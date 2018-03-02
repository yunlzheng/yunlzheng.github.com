title: Prometheus中的服务发现和relabel
date: 2018-01-17 15:15:49
tags: prometheus
---

在云平台中如果自动发现监控目标？本文将结合Consul向读者介绍Promethues下的服务发现机制以及relabel机制。

<!-- more -->

## Prometheus中的Job和Instance

Prometheus主要由一下几个部分组成：

* Prometheus Server: 负责采集监控数据，并且对外提供PromQL实现监控数据的查询以及聚合分析；
* Exporters: 用于向Prometheus Server暴露数据采集的endpoint,Prometheus轮训这些Exporter采集并且保存数据；
* AlertManager以及其它组件(...和本文无关就不说这些)

在Prometheus Server的配置文件中我们使用scrape_configs来定义

``` yaml
scrape_configs:
- job_name: prometheus
  metrics_path: /metrics
  scheme: http
  static_configs:
  - targets:
    - localhost:9090
```

其中每一个scrape_config对象对应一个数据采集的Job，每一个Job可以对应多个Instance,即配置文件中的targets. 通过Prometheus UI可以更直观的看到其中的关系。

![](http://p2n2em8ut.bkt.clouddn.com/blog_service_discovery_and_relabel.png)

## Pull vs Push

对于zabbix以及nagios这类Push系统而言，通常由采集的agent来决定和哪一个监控服务进行通讯。而对于Prometheus这类基于Pull的监控平台而言，则由server侧决定采集的目标有哪些。

![](http://p2n2em8ut.bkt.clouddn.com/prom_pull_vs_push.png)

相比于Push System而言, Pull System:

* 只要Exporter在运行，你可以在任何地方(比如在本地)，搭建你的监控系统
* 你可以更容器的去定位Instance实例的健康状态以及故障定位

当然对于我个人的角度来看，Pull System更利于DevOps的实施。每一个团队可以搭建自己的监控系统，并关注自己关心的监控指标，并构建自己的DevOps Dashboard。

在小规模监控或者本地测试中__static_configs__是我们最常用的用于配置监控目标服务，但是在IaaS平台(如Openstack)或者CaaS平台(如Kubernetes)中：基础设施，容器，应用程序的创建和销毁会更加频繁。
那对于Prometheus这样的Pull System而言，如何动态的发现这些监控目标？ Service Discovery

## 服务发现 Service Discovery

![](http://p2n2em8ut.bkt.clouddn.com/prometheus_sd.png)

Prometheus支持多种服务发现机制：文件，DNS，Consul,Kubernetes,OpenStack,EC2等等。基于服务发现的过程并不复杂，通过第三方提供的接口，Prometheus查询到需要监控的Target列表，然后轮训这些Target获取监控数据。

这里为了验证Prometheus的服务发现能力，我们使用Docker Compose在本地搭建我们的测试环境。我们使用gliderlabs/registrator监听Docker进程，对于暴露了端口的容器，registrator会自动将该容器暴露的服务地址注册到Consul中。

这里使用Node Exporter采集当前主机数据，使用cAdvisor采集容器相关数据。

完整的Docker Compose文件如下：

```
version: '2'

services:
  consul:
    image: consul
    ports:
      - 8400:8400
      - 8500:8500
      - 8600:53/udp
    command: agent -server -client=0.0.0.0 -dev -node=node0 -bootstrap-expect=1 -data-dir=/tmp/consul
    labels:
      SERVICE_IGNORE: 'true'
  registrator:
    image: gliderlabs/registrator
    depends_on:
      - consul
    volumes:
      - /var/run:/tmp:rw
    command: consul://consul:8500
  prometheus:
    image: quay.io/prometheus/prometheus
    ports:
      - 9090:9090
  node_exporter:
    image: quay.io/prometheus/node-exporter
    pid: "host"
    ports:
      - 9100:9100
  cadvisor:
    image: google/cadvisor:latest
    ports:
      - 8080:8080
    volumes:
      - /:/rootfs:ro 
      - /var/run:/var/run:rw
      - /var/lib/docker/:/var/lib/docker:ro
```

使用docker compose启动该应用堆栈，在consul ui中,我们可以看到如下结果：

![](http://p2n2em8ut.bkt.clouddn.com/blog_service_discovery_and_relabel_consul.png)

创建Prometheus配置文件

```
global:
  scrape_interval: 5s
  scrape_timeout: 5s
  evaluation_interval: 15s
scrape_configs:
  - job_name: consul_sd
    metrics_path: /metrics
    scheme: http
    consul_sd_configs:
      - server: consul:8500
        scheme: http
        services:
          - node_exporter
          - cadvisor
```

其中我们创建了一个Job名为consul_sd,并通过consul_sd_configs定义我们需要从consul获取的服务实例，其中：

* server: 指定了consul的访问地址
* services: 为注册到consul中的实例信息

挂载配置文件到Prometheus Server,并且重新启动docker compose.

```
services:
  prometheus:
    volumes:
      - ./prometheus/prometheus:/etc/prometheus/prometheus.yml
```

查看Prometheus UI的Target页面，我们可以看到，如下结果：

![](http://p2n2em8ut.bkt.clouddn.com/blog_sd_relabel_consol_target.png)

我们通过将Exporter注册到Consul，并且配置Prometheus基于Consul动态发现需要采集的目标实例。

## 如何过滤选择Target实例？relabel

目前为止，只要是注册到Consul上的Node Exporter或者cAdvisor实例是可以自动添加到Prometheus的Target当中。现在请考虑下面的场景：

![](http://p2n2em8ut.bkt.clouddn.com/bolg_sd_mutil_cluster.png)

对于线上环境我们可能会划分为:dev, stage, prod不同的集群。每一个集群运行多个主机节点，每个服务器节点上运行一个Node Exporter实例。Node Exporter实例会自动测试到服务注册中心Consul服务当中，Prometheus会根据Consul返回的Node Exporter实例信息产生Target列表，并且向这些Target轮训数据。

so far so good.

然而，如果我们可能还需要：

* 需要按照不同的环境dev, stage, prod聚合监控数据？
* 对于研发团队而言，我可能只关心dev环境的监控数据？
* 为每一个团队单独搭建一个Prometheus Server？ 如何让不同团队的Prometheus Server采集不同的环境监控数据？

### 第一个问题: 如何根据环境聚合监控数据？replace

在默认情况下，我们从所有环境的Node Exporter中采集到的主机指标如下：

```
node_cpu{cpu="cpu0",instance="172.21.0.3:9100",job="consul_sd",mode="guest"}
```

其中instance为target的地址，通过instance我们可以区分主机，但是无法区分环境。

我们希望采集的指标应该是如下形式：

```
node_cpu{cpu="cpu0",instance="172.21.0.3:9100",dc="dc1",job="consul_sd",mode="guest"}
```

通过metrics中的label dc(数据中心)来在监控数据中添加不同的环境指标。这样我们可以通过dc来聚合数据 sum(node_cpu{dc="dc1"})。

为了达到这个目的我们需要使用relabel的replace能力。

官方文档中是这样解释relabel能力的

> Relabeling is a powerful tool to dynamically rewrite the label set of a target before it gets scraped. Multiple relabeling steps can be configured per scrape configuration. They are applied to the label set of each target in order of their appearance in the configuration file.

简单理解的话，就是Relabel可以在Prometheus采集数据之前，通过Target实例的Metadata信息，动态重新写入Label的值。除此之外，我们还能根据Target实例的Metadata信息选择是否采集或者忽略该Target实例。

基于Consul动态发现的Target实例，具有以下Metadata信息：

* __meta_consul_address: consul地址
* __meta_consul_dc: consul中服务所在的数据中心
* __meta_consul_metadata_<key>: 服务的metadata
* __meta_consul_node: 服务所在consul节点的信息
* __meta_consul_service_address: 服务访问地址
* __meta_consul_service_id: 服务ID
* __meta_consul_service_port: 服务端口
* __meta_consul_service: 服务名称
* __meta_consul_tags: 服务包含的标签信息

在Prometheus UI中，也可以直接查看target的metadata信息

![](http://p2n2em8ut.bkt.clouddn.com/blog_sd_target_metedata.png)

这里我们使用__meta_consul_dc信息来标记当前target所在的data center。并且通过regex来匹配source_label的值，使用replacement来选择regex表达式匹配到的mach group。通过action来告诉prometheus在采集数据之前，需要将replacement的内容写入到target_label dc当中

```
scrape_configs:
  - job_name: consul_sd
    relabel_configs:
    - source_labels:  ["__meta_consul_dc"]
      regex: "(.*)"
      replacement: $1
      action: replace
      target_label: "dc"
```

对于直接保留标签的值时，也可以简化为：

```
    - source_labels:  ["__meta_consul_dc"]
      target_label: "dc"
```

重启Prometheus，查看通过UI查看Target列表

![](http://p2n2em8ut.bkt.clouddn.com/blog_sd_relabel_replace.png)

在Target的labels列我们可以看到当前Instance的label标签。

查询Prometheus查询监控数据,所有metrics都被写入了所在的数据中心标签dc

```
node_cpu{cpu="cpu0",dc="dc1",instance="172.21.0.6:9100",job="consul_sd",mode="guest"}	0
node_cpu{cpu="cpu0",dc="dc1",instance="172.21.0.6:9100",job="consul_sd",mode="guest_nice"}	0
node_cpu{cpu="cpu0",dc="dc1",instance="172.21.0.6:9100",job="consul_sd",mode="idle"}	91933.77
node_cpu{cpu="cpu0",dc="dc1",instance="172.21.0.6:9100",job="consul_sd",mode="iowait"}	56.8
node_cpu{cpu="cpu0",dc="dc1",instance="172.21.0.6:9100",job="consul_sd",mode="irq"}	0
node_cpu{cpu="cpu0",dc="dc1",instance="172.21.0.6:9100",job="consul_sd",mode="nice"}	0
node_cpu{cpu="cpu0",dc="dc1",instance="172.21.0.6:9100",job="consul_sd",mode="softirq"}	19.02
```

### 第二个问题：如何选择采集目标? keep/drop

在第一个问题中，我们通过定义relabel_configs的action为replace，告诉Prometheus，需要为当前实例采集的所有metrics写入新的label。当需要过滤target目标时，我们则将action定义为keep或者drop。

在Job的配置当中使用一下配置，当匹配到target的元数据标签__meta_consul_tags中匹配到".*,development,.*",则keep当前实例

```
    relabel_configs:
    - source_labels: ["__meta_consul_tags"]
      regex: ".*,development,.*"
      action: keep
```

为了在本地模拟，我们可以使用registor自动注册service tag的能力。 修改docker compose如下

```
version: '2'

services:
  consul:
    image: consul
    ports:
      - 8400:8400
      - 8500:8500
      - 8600:53/udp
    command: agent -server -client=0.0.0.0 -dev -node=node0 -bootstrap-expect=1 -data-dir=/tmp/consul
    labels:
      SERVICE_IGNORE: 'true'
  registrator:
    image: gliderlabs/registrator
    depends_on:
      - consul
    volumes:
      - /var/run:/tmp:rw
    command: consul://consul:8500
  prometheus:
    image: quay.io/prometheus/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
  node_exporter:
    image: quay.io/prometheus/node-exporter
    pid: "host"
    ports:
      - 9100:9100
    labels:
      SERVICE_TAGS: "development" # 设置该服务向consul注册的TAGS为development
  cadvisor:
    image: google/cadvisor:latest
    ports:
      - 8080:8080
    volumes:
      - /:/rootfs:ro 
      - /var/run:/var/run:rw
      - /var/lib/docker/:/var/lib/docker:ro
    labels:
      SERVICE_TAGS: "production,scraped" # 设置该服务向consul注册的TAGS为development,production
```

重启docker-compose如下所示，我们可以在Consul中查看服务的TAGS

![](http://p2n2em8ut.bkt.clouddn.com/consul_service_tags.png)

查看Prometheus UI Target页面，可以发现，当前target实例当中只存在__meta_consul_tags中包含development的实例，从而过滤了其它注册到Consul中的实例。

![](http://p2n2em8ut.bkt.clouddn.com/sd_relabel_keep.png)

## 小结

综上：

* 在云平台/容器平台中我们可以通过Prometheus的SD能力动态发现监控的目标实例
* 通过relabeling可以在写入metrics数据之前，动态修改metrics的label
* 通过relabeling可以对target实例进行过滤和选择