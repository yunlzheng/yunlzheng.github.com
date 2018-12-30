title: Promtheus Remote Storage使用案例：多Kubernetes集群监控方案
date: 2018-04-25 10:35:20
tags:
- Kubernetes
- Prometheus
---

![/images/mutil-k8s-cluster.png](/images/mutil-k8s-cluster.png)

<!-- more -->

Agent侧组件：

* Prometheus Server: 负责采集当前K8s集群下所有样本数据，并通过Remote Write写入数据到Remote Storage Adaptor；
* Exporters: 暴露当前集群各监控指标的Exporter实例。

Server侧组件：

* Prometheus Server: 负责监控数据查询以及告警规则计算;
* Prometheus Rest: 自定义API组件，负责创建和管理告警规则文件;
* Remote Storage Adaptor: 提供Remote Storage相关API。 持久化数据到Influxdb以及从Influxdb中获取样本数据；
* Alertmanager：负责对Prometheus产生的告警进行后续处理。

优点:

* Prometheus读写分离
* 支持垮网络环境(类Push模式)

缺点：

* Remote Storage Adaptor的单点故障和性能问题