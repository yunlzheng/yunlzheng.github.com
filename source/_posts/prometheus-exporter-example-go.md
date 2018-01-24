title: Prometheus的基本数据类型
date: 2017-07-07 10:26:04
tags: [Prometheus, Exporter, Devops]
---

上一篇文章中分享了[在Kubernetes部署Prometheus](http://yunlzheng.github.io/2017/07/04/prometheus-kubernates/)的内容,Prometheus除了监控数据采集，存储，查询以外。也提供了非常方便的扩展接口，可以方便用户根据自己的业务实现自己的数据采集Exporter。 再实现自定义Exporter或者在现有应用上扩展API接口支持Prometheus采集数据之前，我们需要先了解一下Prometheus下的度量指标数据结构基本类型

## Prometheus metric类型

Prometheus的Client Library提供度量的四种基本类型包括:Counter,Gauge,Histogram,Summary。当访问Exporter的/metrics API地址时我们可以看到类似于一下返回值，其中HELP用于说明度量类型，TYPE用于数据类型说明。

```
# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 255.477922
# HELP process_open_fds Number of open file descriptors.
# TYPE process_open_fds gauge
process_open_fds 312.0
```

需要注意的是，虽然Prometheus Client Library可以定义不同的数据类型，但是Prometheus Server在获取到这些监控数据后并没有使用它们的类型（Type）信息而直接将这些数据扁平处理，并且无区别的保存到时序数据库当中。 因此这四种数据类型主要是提供一些参考，用于不同的度量数据场景

### Counter计数器

![](http://7pn5d3.com1.z0.glb.clouddn.com/blog/prometheus_counter.jpeg)

Counter类型，Counter类型好比计数器，用于统计类似于：CPU时间，API访问总次数，异常发生次数等等场景。这些指标的特点就是增加不减少。

Example: 容器CPU使用率

在使用cAdvisor采集容器数据时，我们会得到监控指标**container_cpu_user_seconds_total**，该指标的的数据类型为Counter用户反映当前容器在各个CPU内核上已经使用的CPU总时间。

通过Prometheus直接查询该指标我们会得到以下数据

```
container_cpu_usage_seconds_total{beta_kubernetes_io_arch="amd64",beta_kubernetes_io_os="linux",container_name="mysql",cpu="cpu03",id="/kubepods.slice/kubepods-besteffort.slice/kubepods-besteffort-pod74ab5e96_6209_11e7_9990_00163e122a49.slice/docker-fb332c4ede82562be6eaebe3eef6376d3f37b3402a7fd570c7c95f8963012c0b.scope",image="docker.io/mysql@sha256:d178dffba8d81afedc251498e227607934636e06228ac63d58b72f9e9ec271a6",instance="dev-4",job="kubernetes-nodes",kubernetes_io_hostname="dev-4",name="k8s_mysql_go-todo-mysql-3723120250-vf8wx_default_74ab5e96-6209-11e7-9990-00163e122a49_0",namespace="default",pod_name="go-todo-mysql-3723120250-vf8wx"}
container_cpu_usage_seconds_total{beta_kubernetes_io_arch="amd64",beta_kubernetes_io_os="linux",container_name="mysql",cpu="cpu01",id="/kubepods.slice/kubepods-besteffort.slice/kubepods-besteffort-pod74ab5e96_6209_11e7_9990_00163e122a49.slice/docker-fb332c4ede82562be6eaebe3eef6376d3f37b3402a7fd570c7c95f8963012c0b.scope",image="docker.io/mysql@sha256:d178dffba8d81afedc251498e227607934636e06228ac63d58b72f9e9ec271a6",instance="dev-4",job="kubernetes-nodes",kubernetes_io_hostname="dev-4",name="k8s_mysql_go-todo-mysql-3723120250-vf8wx_default_74ab5e96-6209-11e7-9990-00163e122a49_0",namespace="default",pod_name="go-todo-mysql-3723120250-vf8wx"}
```

如果使用图形化查询我们可以看出

![](http://7pn5d3.com1.z0.glb.clouddn.com/blog/prometheus_cpu_counter.png)

因此当我们需要统计容器CPU的使用率时，我们需要使用rate()函数计算该Counter在过去一段时间内在每一个时间序列上的每秒的平均增长率

```
rate(container_cpu_user_seconds_total[5m]) * 100
```

![](http://7pn5d3.com1.z0.glb.clouddn.com/blog/prometheus_cpu_usgae.png)

### Gauge仪表盘

![](http://7pn5d3.com1.z0.glb.clouddn.com/blog/prometheus_guage.jpg)

Gauge类型，英文直译的话叫“计量器”，但是和Counter的翻译太类似了，因此我个人更喜欢使用”仪表盘“这个称呼。仪表盘的特点就是数值是可以增加或者减少的。因此Gauge适合用于如：当前内存使用率，当前CPU使用率，当前温度，当前速度等等一系列的监控指标。

Example：主机负载信息

在使用NodeExporter时，指标node_load1可以反映当前主机的负载情况，而其类型则是Gauge，因此在查询主机负载变化时比较简单，直接使用node_load1即可查询出当前所有主机的负载情况

```
node_load1{app="node-exporter",instance="192.168.2.2:9100",job="kubernetes-service-endpoints",kubernetes_name="node-exporter",kubernetes_namespace="default",name="node-exporter",nodeIp="192.168.2.2:9100"}
node_load1{app="node-exporter",instance="192.168.2.3:9100",job="kubernetes-service-endpoints",kubernetes_name="node-exporter",kubernetes_namespace="default",name="node-exporter",nodeIp="192.168.2.3:9100"}
```

![](http://7pn5d3.com1.z0.glb.clouddn.com/prometheus_node_load.png)

### Histogram柱状图

![](http://7pn5d3.com1.z0.glb.clouddn.com/blog/prometheus_histogram.png)

Histogram这个比较直接柱状图图，更多的是用于统计一些数据分布的情况，用于计算在一定范围内的分布情况，同时还提供了度量指标值的总和。

Example：
以Kubernates的API Server度量指标apiserver_request_latencies为例，该指标反映了Kubernates的API请求响应延迟时间。该指标会在一次监控数据抓取过程中返回2中Metrics Key

```
apiserver_request_latencies_bucket
apiserver_request_latencies_count
apiserver_request_latencies_sum
```

apiserver_request_latencies_bucket反映在各个API响应延迟范围(le)内总数

```
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="+Inf",resource="podpresets",verb="WATCH"}	773
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="500000",resource="endpoints",verb="DELETE"}	85
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="1e+06",resource="configmaps",verb="PUT"}	1
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="1e+06",resource="daemonsets",verb="WATCHLIST"}	0
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="2e+06",resource="replicationcontrollers",verb="GET"}	6
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="125000",resource="deployments",verb="PATCH"}	12
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="+Inf",resource="configmaps",verb="DELETE"}	9
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="125000",resource="replicasets",verb="GET"}	1331
apiserver_request_latencies_bucket{instance="192.168.2.2:6443",job="kubernetes-apiservers",le="+Inf",resource="persistentvolumes",verb="LIST"}	3
```

apiserver_request_latencies_count反映对各个资源API的请求次数

```
apiserver_request_latencies_count{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="replicasets",verb="PUT"}	3030
apiserver_request_latencies_count{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="deployments",verb="PUT"}	2454
apiserver_request_latencies_count{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="clusterroles",verb="WATCH"}	1527
apiserver_request_latencies_count{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="replicationcontrollers",verb="WATCHLIST"}	7
apiserver_request_latencies_count{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="clusterroles",verb="POST"}	42
apiserver_request_latencies_count{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="resourcequotas",verb="LIST"}	304
apiserver_request_latencies_count{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="pods",verb="DELETE"}	913
```

而apiserver_request_latencies_sum则反映出对各个资源API操作延迟时间的总量

```
apiserver_request_latencies_sum{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="replicationcontrollers",verb="LIST"}	554991
apiserver_request_latencies_sum{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="clusterroles",verb="LIST"}	33586061
apiserver_request_latencies_sum{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="configmaps",verb="DELETE"}	16466
apiserver_request_latencies_sum{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="pods",verb="WATCH"}	3430725671235
apiserver_request_latencies_sum{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="secrets",verb="LIST"}	5843
apiserver_request_latencies_sum{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="nodes",verb="LIST"}	92849
apiserver_request_latencies_sum{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="persistentvolumes",verb="LIST"}	9302
apiserver_request_latencies_sum{instance="192.168.2.2:6443",job="kubernetes-apiservers",resource="serviceaccounts",verb="WATCH"}	1378625982766
```

在Exporter获取的度量指标当中通常会以一下形式表现：

```
<base_name>_bucket{ label1=value1, label2=value2 }
```

### Summary概要

![](http://7pn5d3.com1.z0.glb.clouddn.com/blog/prometheus_summary.png)

Summary摘要和Histogram柱状图比较类似，主要用于计算在一定时间窗口范围内度量指标对象的总数以及所有对量指标值的总和。

例如：

apiserver_request_latencies_summary
apiserver_request_latencies_summary_count
apiserver_request_latencies_summary_sum

## 小结

如第一个项目而言Prometheus Server当前版本在采集数据时并没有使用metrics的数据类型，数据类型更多是Client进行参考，根据不同的场景选择不同的数据类型
