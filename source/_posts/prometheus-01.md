title: Prometheus以及如果实现跨环境监控
date: 2017-05-13 23:28:14
tags: [DevOps, Monitor, Prometheus]
---

## 本文结构

* 第一部分：我们会了解关于Prometheus架构以及主要组件的一些基础知识；
* 第二部分：通过具体实例了解Prometheus基于时间序列的数据查询以及聚合方式；
* 第三部分：Prometheus在企业实践中存在的一些典型问题；
* 第四部分：多环境数据采集方案Prometheus Pusher。

## Part1: Prometheus

Prometheus是SoundCloud开源的监控与告警平台，由于其从推出就提供了完整的基于容器的部署方式，开发者可以快速的基于容器搭建自己的监控平台。因此在Docker社区迅速聚集了大量的人气。

Prometheus与其他主流的监控系统都采用了时序的方式对数据进行存储。其他典型的时序数据库诸如(OpenTsdb, Influxdb等等)。相比于其他的时序数据库，Prometheus的时间序列标示包含一个度量名称以及一些列的键值对进行表示（例如api_http_requests_total{method="POST", handler="/messages"}）。

Prometheus主要的组件包括：

Prometheus Server: * 主要提供了监控数据数据采集(Pull模式)，监控数据存储以及查询接口。同时支持用户定义告警规则(Rule)实现对特定指标数据的告警。
* Jobs/Exporters: 监控数据采集Agent，Exporter以Web API的形式对外暴露数据采集接口（"/metrics"）。通过将exporter的信息注册到Prometheus Server,实现监控数据的定时采集。
* Pushgateway: 对于某些场景Prometheus无法直接拉取监控数据，Pushgateway的作用就在于提供了中间代理，例如我们可以在应用程序中定时将监控metrics数据提交到Pushgateway。而Prometheus Server定时从Pushgateway的/metrics接口采集数据。
* Altermanager: 对Prometheus进行告警功能补充，可以实现告警通知。
* 以及其它的第三方工具集成，如Grafana等。

![](https://prometheus.io/assets/architecture.svg)

## Part2: Prometheus数据查询

Prometheus中的存储的数据包括：时间序列标识符，数值以及timestamp三部分组成。

基于Prometheus的高纬度数据模型我们可以很方便的通过表达式对采集到的监控数据进行查询，聚合同时Prometheus还提供了大量的函数，用于时序向量数据的操作。

这里我们以主机负载监控为例介绍Promethus的数据查询功能：

```
node_load1{agentIP=~"127.0.0.1|127.0.0.2"}
```

通过~=匹配查询我们可以从监控数据中通过维度agentIP获取特定主机或者特定多个主机的负载数据

查询API

```
/api/v1/query?query=<express>
```

以主机负载信息为例，API查询将会返回一下结构数据，data为查询到的数据结果，resultType表明当前expression查询结果为向量，metrics为所有可用的维度。value数组包含了以timestamp为key的键值对。

```
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "node_load1",
          "agentIP": "127.0.0.1",
          "environmentUUID": "7d908325-1014-4544-9429-a663d7d308a2",
          "exported_instance": "10-42-54-216-9100-metrics",
          "exported_job": "HostsMetrics",
          "hostName": "Server217",
          "instance": "127.0.0.1:9091",
          "job": "push-metrics"
        },
        "value": [
          1494682460.069,
          "0.42"
        ]
      },
      {
        "metric": {
          "__name__": "node_load1",
          "agentIP": "127.0.0.2",
          "environmentUUID": "ae9ce424-0f49-4c01-b027-ab25678a64c4",
          "exported_instance": "10-42-40-225-9100-metrics",
          "exported_job": "HostsMetrics",
          "hostName": "hfbank-1",
          "instance": "127.0.0.2:9091",
          "job": "push-metrics"
        },
        "value": [
          1494682460.069,
          "0.14"
        ]
      }
    ]
  }
}
```

查询一定时间范围内的监控数据,与/api/query相比返回值中value将会包含时间范围内的所有监控数据，通过控制step我们可以按需减少返回的数据量。

```
/api/v1/query_range?query=<express>&start=<timestamp>&end=<timestamp>&step=<step>
```

其中我们需要注意的是metrics的返回数据中包含__name__，该属性为对于metrics的名称，通过__name__我们可以查询多个监控项的数据，并且进行聚合。

例如我们可以通过一个表达式查询出特定主机的网络revice和transmit的数据。其中$machine为查询的主机ip地址

```
{__name__=~"node_network_receive_bytes|node_network_transmit_bytes", agentIP=~"$machine"}
```

我们将得到如下返回结果，每一个Host主机的不同device的网络transmit以及receive字节大小数据。

```
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "node_network_transmit_bytes",
          "agentIP": "182.140.210.217",
          "device": "lo",
          "environmentUUID": "7d908325-1014-4544-9429-a663d7d308a2",
          "exported_instance": "10-42-54-216-9100-metrics",
          "exported_job": "HostsMetrics",
          "hostName": "Server217",
          "instance": "10.42.107.66:9091",
          "job": "push-metrics"
        },
        "value": [
          1494683375.216,
          "0"
        ]
      },
      {
        "metric": {
          "__name__": "node_network_receive_bytes",
          "agentIP": "101.37.38.115",
          "device": "eth0",
          "environmentUUID": "ae9ce424-0f49-4c01-b027-ab25678a64c4",
          "exported_instance": "10-42-40-225-9100-metrics",
          "exported_job": "HostsMetrics",
          "hostName": "hfbank-1",
          "instance": "10.42.107.66:9091",
          "job": "push-metrics"
        },
        "value": [
          1494683375.216,
          "33115808"
        ]
      },
      {
        "metric": {
          "__name__": "node_network_transmit_bytes",
          "agentIP": "182.140.210.217",
          "device": "eth0",
          "environmentUUID": "7d908325-1014-4544-9429-a663d7d308a2",
          "exported_instance": "10-42-54-216-9100-metrics",
          "exported_job": "HostsMetrics",
          "hostName": "Server217",
          "instance": "10.42.107.66:9091",
          "job": "push-metrics"
        },
        "value": [
          1494683375.216,
          "832809663"
        ]
      },
      {
        "metric": {
          "__name__": "node_network_receive_bytes",
          "agentIP": "127.0.0.1",
          "device": "lo",
          "environmentUUID": "7d908325-1014-4544-9429-a663d7d308a2",
          "exported_instance": "10-42-54-216-9100-metrics",
          "exported_job": "HostsMetrics",
          "hostName": "Server217",
          "instance": "127.0.0.1:9091",
          "job": "push-metrics"
        },
        "value": [
          1494683375.216,
          "0"
        ]
      },
      {
        "metric": {
          "__name__": "node_network_transmit_bytes",
          "agentIP": "127.0.0.2",
          "device": "lo",
          "environmentUUID": "ae9ce424-0f49-4c01-b027-ab25678a64c4",
          "exported_instance": "10-42-40-225-9100-metrics",
          "exported_job": "HostsMetrics",
          "instance": "127.0.0.2:9091",
          "job": "push-metrics"
        },
        "value": [
          1494683375.216,
          "0"
        ]
      },
      {
        "metric": {
          "__name__": "node_network_receive_bytes",
          "agentIP": "127.0.0.2",
          "device": "lo",
          "environmentUUID": "ae9ce424-0f49-4c01-b027-ab25678a64c4",
          "exported_instance": "10-42-40-225-9100-metrics",
          "exported_job": "HostsMetrics",
          "instance": "127.0.0.2:9091",
          "job": "push-metrics"
        },
        "value": [
          1494683375.216,
          "0"
        ]
      },
      {
        "metric": {
          "__name__": "node_network_receive_bytes",
          "agentIP": "127.0.0.1",
          "device": "eth0",
          "environmentUUID": "7d908325-1014-4544-9429-a663d7d308a2",
          "exported_instance": "10-42-54-216-9100-metrics",
          "exported_job": "HostsMetrics",
          "instance": "127.0.0.1:9091",
          "job": "push-metrics"
        },
        "value": [
          1494683375.216,
          "29353588"
        ]
      },
      {
        "metric": {
          "__name__": "node_network_transmit_bytes",
          "agentIP": "127.0.0.2",
          "device": "eth0",
          "environmentUUID": "ae9ce424-0f49-4c01-b027-ab25678a64c4",
          "exported_instance": "10-42-40-225-9100-metrics",
          "exported_job": "HostsMetrics",
          "hostName": "hfbank-1",
          "instance": "10.42.107.66:9091",
          "job": "push-metrics"
        },
        "value": [
          1494683375.216,
          "1154982857"
        ]
      }
    ]
  }
}
```

当然我们希望得到的结果是每台主机网络receieve和transmit字节的总量而不关心所示的设备是多少。这时候我们可以通过Prometheus提供的聚合操作完成对向量数据的计算

```
sum({__name__=~"node_network_receive_bytes|node_network_transmit_bytes", agentIP="$machine"})
```

sum操作服会将表达式查询的向量进行汇总，最终结果如下：

```
{"status":"success","data":{"resultType":"vector","result":[{"metric":{},"value":[1494683856.658,"2052998868"]}]}}
```

当然我们实际需要的是按照主机IP以及网络receieve/transmit进行聚合，因此表达式可以修改为：

```
sum({__name__=~"node_network_receive_bytes|node_network_transmit_bytes", agentIP="$machine"}) by (__name__, agentIP)
```

返回结果如下，时序数据按照监控指标__name__以及主机IP进行了聚合：

```
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "node_network_transmit_bytes",
          "agentIP": "127.0.0.1"
        },
        "value": [
          1494684112.084,
          "834504138"
        ]
      },
      {
        "metric": {
          "__name__": "node_network_receive_bytes",
          "agentIP": "127.0.0.1"
        },
        "value": [
          1494684112.084,
          "29412883"
        ]
      }
    ]
  }
}
```

这里提供一些其他常用的表示式：

查询主机使用率

```
1 - avg by (agentIP) (irate(node_cpu{agentIP=~"$machine", mode="idle"}[5m]))
```

查询主机磁盘IO

```
irate(node_disk_io_time_ms{agentIP=~'$machine',device!~'^(md\\d+$|dm-)'}[5m])
```

查询主机内存使用量

```
(node_memory_MemTotal{agentIP="101.37.26.244"} - node_memory_MemAvailable{agentIP="101.37.26.244"}) / node_memory_MemTotal{agentIP="101.37.26.244"}
```

除了本文中示例的表达式功能以外，Prometheus还提供了其它丰富的查询，操作符以及表达式。包括：[运算符](https://prometheus.io/docs/querying/operators/#binary-operators)，[聚合](https://prometheus.io/docs/querying/operators/#aggregation-operators),[函数](https://prometheus.io/docs/querying/functions/#functions)等等。

## Part3: Pull模式所带来的问题

在上部分我们介绍了Prometheus的基础架构以及Prometheus所提供的丰富的查询功能。

* 问题一：跨网络环境问题

基于Prometheus的Pull模式对于网络环境的基本要求就是Prometheus Server可以访问Exporter所提供的metrics接口，这就要求Prometheus Server与Exporter的网络是能够联通的。

但是在实际企业环境中，网络环境往往是复杂的。

* 问题二：Pushgateway

在架构部分我们简单介绍过，通过Pushgateway组件，我们可以通过Pushgatway作为中间代理，实现跨网络环境的数据采集，通过一些周期性的任务定时向Pushgateway上报数据，Prometheus依然通过Pull模式定时获取数据。

在官方文档中介绍了三种使用Pushgateway的问题：
* 当采用Pushgateway获取监控数据时，Pushway即会成为单点以及潜在的性能瓶颈
* 丧失了Prometheus的实例健康检查功能
* 除非手动删除Pushgateway的数据，否则Pushgateway会一直保留所有采集到的数据并且提供给Prometheus。

当然对于程序员最重要的是：
* 我们需要对所有需要监控的实现与Pushgateway的集成，定时Push数据到Pushgateway。
* 同时无法直接使用社区已经提供的大量exporter实现

## Part4: 扩展Prometheus: Prometheus Pusher

[Prometheus Pusher](https://github.com/yunlzheng/prometheus-pusher)是为了解决跨网络环境下监控数据采集的问题。扩展的原有的Prometheus功能，实现对exporters的数据采集并且推送到pushgateway

![](https://camo.githubusercontent.com/cf42bd41b01f47ed55e00de8e91a336433922d57/687474703a2f2f37706e3564332e636f6d312e7a302e676c622e636c6f7564646e2e636f6d2f70726f6d6574686575735f7075736865722e706e67)

由于[Prometheus Pusher](https://github.com/yunlzheng/prometheus-pusher)直接在Prometheus基础上进行扩展，因此原生支持Prometheus的配置方式，以及所有的服务发现方式诸如static,DNS,consul,k8s等等。

```
global:                       
  scrape_interval:     15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'exporter-metrics'                 

scrape_configs:

- job_name: 'HostsMetrics'
  dns_sd_configs:
  - names:
    - node-exporter
    refresh_interval: 15s
    type: A
    port: 9100

- job_name: 'ContainerMetrics'
  static_configs:
    - targets:
      - 'rancher-server:9108'
- job_name: 'RancherServerMetrics'
  dns_sd_configs:
  - names:
    - cadvisor
    refresh_interval: 15s
    type: A
    port: 8080

- job_name: 'RancherApi'
  dns_sd_configs:
  - names:
    - 'prometheus-rancher-exporter'
    refresh_interval: 15s
    type: A
    port: 9173

- job_name: 'Prometheus'
  static_configs:
    - targets:
      - '127.0.0.1:9090'
```

在命令行中进行使用，设置PUSH_GATEWAY环境变量即可。

```
export PUSH_GATEWAY=http://pushgateway.example.org:9091
./prometheus_pusher -config.file=prometheus.yml
```

同时Prometheus Pusher支持在采集的metrics数据基础上添加额外的维度Label

```
./prometheus_pusher -config.file=prometheus.yml -config.customLabels=label1,label2 -config.customLabelValues=value1,value2
```

在多环境的监控数据采集中我们通过添加环境唯一标示，可以避免跨环境数据查询错误的问题。

## Part5: 小结

这边文章在上层角度向读者感性介绍了Promtheus监控平台的架构，Prometheus提供的查询功能，以及在现有模式下在企业实践方面存在的不足。最后介绍了跨环境数据采集方案Prometheus Pusher等信息。后续将在本文的基础上结合官方文档继续完成Prometheus的入门系列教程。

* Prometheus以及其它监控平台的生态系统（ING）
* 在Rancher下快速搭建Prometheus监控平台
* Prometheus查询表达式实践
* exporter详解以及自定义exporter
* Grafana与可视化
* AlterManager告警实践
* Pushgateway以及如何与Spring进行集成
* 使用[Prometheus Pusher](https://github.com/yunlzheng/prometheus-pusher)实现多环境数据采集
