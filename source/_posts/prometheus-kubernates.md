title: Prometheus在Kubernetes下的监控实践
date: 2017-07-04 22:19:36
tags: [DevOps,Monitor,Prometheus]
---

在上一篇文章[使用Prometheus Pusher实现跨环境监控](http://yunlzheng.github.io/2017/05/13/prometheus-01/)中笔者分享了Prometheus的一些基本概念，包括架构，数据模型，查询API以及表达式等内容。

在这边文章中笔者将会详细介绍在kubernetes平台下部署Prometheus,以及监控kubernetes平台中部署的应用的信息。

## 总体目标

从监控平台本身的业务需求分析来看，我们至少应该希望通过Prometheus平台获取到一下监控数据:

性能指标

* 容器相关的性能指标数据(如：cpu, memory, filesystem；
* Pod相关的性能指标数据;
* 主机节点相关的性能指标数据;

服务健康状态监控

* Deployment相关的健康状态（health or unhealth）;
* Pod的健康状态；
* 主机Node节点的健康状态

除了获取监控数据意外，我们还需要对一些特定的异常情况进行告警，因此需要配合使用AlertManager使用告警通知

## 实现思路和要点

**1，容器和Pod相关的性能指标数据**

kubernetes在部署完成后会在每个主机节点上内置cAdvisor，因此可以直接用过cAdvisor提供的metrics接口获取到所有容器相关的性能指标数据。

**2，主机性能指标数据**

Prometheus社区提供的[NodeExporter](https://github.com/prometheus/node_exporter)项目可以对于主机的关键度量指标状态监控，通过kubernetes的Deamon Set我们可以确保在各个主机节点上部署单独的NodeExporter实例，从而实现对主机数据的监控

**3，资源对象（Deployment, Pod以及Node）的健康状态**

坏消息是Prometheus社区并没有直接提供对于kubernetes资源的健康状态采集的Exporter,好消息是Prometheus的架构体系我们可以快速扩展我们自己的Exporter从而实现对kubernetes的资源对象健康状态数据的采集，因此这个部分我们**需要基于kubernetes API实现自己的kubernetes Exporter**

**4，Prometheus如何动态发现采集Target的地址**

Promentheus最基本的数据采集方式是用过在yml文件中直接定义目标Exporter的的访问地址，此刻Prometheus可以根据Target地址定时轮训获取监控数据。同时Prometheus还支持动态的服务发现注册方式，具体信息可以参考[Promethues官方文档](https://prometheus.io/docs/operating/configuration/#kubernetes_sd_config)，这里我们主要关注在kubernetes下的采集目标发现的配置，Prometheus支持通过kubernetes的Rest API动态发现采集的目标Target信息，包括kubernetes下的node,service,pod,endpoints等信息。因此基于kubernetes_sd_config以及之前提到的三点，我们基本了解了整个的一个实现实例。

## Step By Step

### DaemonSet部署NodeExporter服务

```
# node-exporter-ds.yml
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/scrape: 'true'
  labels:
    app: node-exporter
    name: node-exporter
  name: node-exporter
spec:
  clusterIP: None
  ports:
  - name: scrape
    port: 9100
    protocol: TCP
  selector:
    app: node-exporter
  type: ClusterIP
---
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  template:
    metadata:
      labels:
        app: node-exporter
      name: node-exporter
    spec:
      containers:
      - image: prom/node-exporter:latest
        name: node-exporter
        ports:
        - containerPort: 9100
          hostPort: 9100
          name: scrape
      hostNetwork: true
      hostPID: true
      restartPolicy: Always
```

在Service中定义标注prometheus.io/scrape: 'true'，表明该Service需要被promethues发现并采集数据

![](http://7pn5d3.com1.z0.glb.clouddn.com/kubernates_prometheus.png)

### 使用RBC创建Cluster Role并设置访问权限

```
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: ["", "extensions", "apps"]
  resources:
  - nodes
  - nodes/proxy
  - services
  - endpoints
  - pods
  - deployments
  - services
  verbs: ["get", "list", "watch"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: default
```

通过RBC创建ClusterRole,ServiceAccount以及ClusterRoleBinding从而确保Promethues可以通过kubernetes API访问到全局资源信息

![](http://7pn5d3.com1.z0.glb.clouddn.com/prometheus_role.png)

### 创建Promethues配置文件ConfigMap

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 30s
      scrape_timeout: 30s
    rule_files:
      - "/etc/prometheus-rules/*.rules"
    scrape_configs:
    - job_name: 'prometheus'
      static_configs:
      - targets: ['localhost:9090']

    - job_name: 'kubernetes-apiservers'
      kubernetes_sd_configs:
      - role: endpoints
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https

    - job_name: 'kubernetes-nodes'
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      kubernetes_sd_configs:
      - api_server: 'https://kubernetes.default.svc'
        role: node
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      - target_label: __address__
        replacement: kubernetes.default.svc:443
      - source_labels: [__meta_kubernetes_node_name]
        regex: (.+)
        target_label: __metrics_path__
        replacement: /api/v1/nodes/${1}/proxy/metrics

    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name

    - job_name: 'kubernetes-services'
      metrics_path: /probe
      params:
        module: [http_2xx]
      kubernetes_sd_configs:
      - role: service
      relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_probe]
        action: keep
        regex: true
      - source_labels: [__address__]
        target_label: __param_target
      - target_label: __address__
        replacement: blackbox
      - source_labels: [__param_target]
        target_label: instance
      - action: labelmap
        regex: __meta_kubernetes_service_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_service_name]
        target_label: kubernetes_name

    - job_name: 'kubernetes-service-endpoints'
      kubernetes_sd_configs:
      - role: endpoints
      relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
        action: replace
        target_label: __scheme__
        regex: (https?)
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__]
        action: replace
        target_label: nodeIp
      - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
        action: replace
        target_label: __address__
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
      - action: labelmap
        regex: __meta_kubernetes_service_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_service_name]
        action: replace
        target_label: kubernetes_name
```

Promethues可以在容器内通过DNS地址 **https://kubernetes.default.svc** 访问kubernetes的Rest API.

rule_files则定义了告警规则的文件匹配规则，这里会加载/etc/prometheus-rules/下所有匹配*.rules的文件

### 创建AlertManager配置文件ConfigMap

```
kind: ConfigMap
apiVersion: v1
metadata:
  name: alertmanager
data:
  config.yml: |-
    global:
      resolve_timeout: 5m
      smtp_smarthost: 'smtp.exmail.qq.com:25'
      smtp_from: 'admin@yourcompany.com'
      smtp_auth_username: 'admin@yourcompany.com'
      smtp_auth_password: 'yourpassword'
      slack_api_url: '<slack_api_url>'
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 15m
      receiver: slack-notifications
      routes:
      - match:
          severity: email
        receiver: email_alert
    receivers:
    - name: 'email_alert'
      email_configs:
      - to: 'user@yourcompany.com'
    - name: 'slack-notifications'
      slack_configs:
      - channel: '#alerts'
```

在Alertmanager的配置文件中我们定义了两种基本的通知方式,邮件以及Slack对于产生的告警默认情况下都会通知到slack的特定channel,这里promethues主要集成了Slack的[incoming-webhooks](https://api.slack.com/incoming-webhooks),从而实现基于slack的告警通知，对于某些告警当存在label为severity：email则通过还会通过邮件发送告警信息。

例如如果在promethues中定义了告警规则

```
ALERT NodeCPUUsage
  IF (100 - (avg by (instance) (irate(node_cpu{name="node-exporter",mode="idle"}[5m])) * 100)) > 75
  FOR 2m
  LABELS {
    severity="email"
  }
  ANNOTATIONS {
    SUMMARY = "{{$labels.instance}}: High CPU usage detected",
    DESCRIPTION = "{{$labels.instance}}: CPU usage is above 75% (current value is: {{ $value }})"
  }
```

则当主机的CPU使用率草果75%后会触发告警，由于告警包含标签severity="email，因此当alertmanager接收到告警信息会会通过stmp协议发送告警邮件

![](http://7pn5d3.com1.z0.glb.clouddn.com/alert_email.png)

### 部署自定义kubernetes Exporter获取kubernetes下主要资源对象的健康状态

```
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/scrape: 'true'
  labels:
    app: kubernetes-exporter
    name: kubernetes-exporter
spec:
  ports:
  - name: kubernetes-exporter
    protocol: TCP
    port: 9174
    targetPort: 9174
  selector:
    app: kubernetes-exporter
  type: NodePort

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: kubernetes-exporter
  labels:
    name: kubernetes-exporter
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: kubernetes-exporter
    spec:
      serviceAccountName: prometheus
      serviceAccount: prometheus
      containers:
      - name: kubernetes-exporter
        image: wisecity/kubernetes-exporter
        ports:
        - containerPort: 9174
          protocol: TCP
```

这里不详细展开如果实现自定义实现Prometheus的Exporter,源码可以通过[https://github.com/yunlzheng/kubernetes-exporter](https://github.com/yunlzheng/kubernetes-exporter)获取。

这里由于kubernetes Exporter同样需要访问全局kubernetes资源，因此使用了之前步骤定义的ServiceAccount从而可以通过kubernetes API获取到deployments，pod，service等资源的详细信息，从而通过/metrics接口暴露相关信息。这里Service中同样标注了 prometheus.io/scrape: 'true'从而确保prometheus会采集数据。

### 部署Promethues和Alertmanager的Deployment

```
apiVersion: v1
kind: "Service"
metadata:
  name: prometheus
  labels:
    name: prometheus-service
spec:
  ports:
  - name: prometheus-server
    protocol: TCP
    port: 9090
    targetPort: 9090
  - name: alertmanager
    protocol: TCP
    port: 9093
    targetPort: 9093
  selector:
    app: prometheus-server
  type: NodePort
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  labels:
    name: prometheus
  name: prometheus
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: prometheus-server
    spec:
      serviceAccountName: prometheus
      serviceAccount: prometheus
      containers:
      - name: prometheus
        image: prom/prometheus:v1.7.1
        command:
        - "/bin/prometheus"
        args:
        - "-config.file=/etc/prometheus/prometheus.yml"
        - "-storage.local.path=/prometheus"
        - "-storage.local.retention=24h"
        - "-alertmanager.url=http://127.0.0.1:9093"
        ports:
        - containerPort: 9090
          protocol: TCP
        volumeMounts:
        - mountPath: "/prometheus"
          name: data
        - mountPath: "/etc/prometheus"
          name: config-volume
        - mountPath: "/etc/prometheus-rules"
          name: alert-roles
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
          limits:
            cpu: 500m
            memory: 2500Mi
      - name: altermanager
        image: prom/alertmanager:v0.7.1
        args:
          - '-config.file=/etc/alertmanager/config.yml'
          - '-storage.path=/alertmanager'
        ports:
        - containerPort: 9093
          protocol: TCP
        volumeMounts:
        - name: alertmanager-config-volume
          mountPath: /etc/alertmanager
        - name: templates-volume
          mountPath: /etc/alertmanager-templates
      volumes:
      - emptyDir: {}
        name: data
      - emptyDir: {}
        name: alert-roles
      - name: config-volume
        configMap:
          name: prometheus-config
      - name: alertmanager-config-volume
        configMap:
          name: alertmanager
      - name: templates-volume
        configMap:
          name: alertmanager-templates
```

需要注意的是这里我们明确使用了上一步定义的ClusterRole和Service Acoount
```
serviceAccountName: prometheus
serviceAccount: prometheus
```
因此Promethues可以在容器内通过DNS地址 **https://kubernetes.default.svc** 访问kubernetes的Rest API地址.同时访问API所需的认证信息以及https的ca证书信息可以从文件
/var/run/secrets/kubernetes.io/serviceaccount/token和/var/run/secrets/kubernetes.io/serviceaccount/ca.crt读取，从而确保prometheus具有权限并且可以发现采集的目标资源。

同时由于promentheus和alertmanager部署在同一个pod当中，因此prometheus可以直接通过127.0.0.1:9073推送告警信息到alertmanager

![](http://7pn5d3.com1.z0.glb.clouddn.com/prometheus_pod.png)

访问promethues网页我们可以查看当前的所有target信息

![](http://7pn5d3.com1.z0.glb.clouddn.com/promethues_target.png)

通过表达式查询kubernates的pod健康状态

![](http://7pn5d3.com1.z0.glb.clouddn.com/prometheus_query.png)

查看告警信息

![](http://7pn5d3.com1.z0.glb.clouddn.com/prometheus_alert.png)

## 总结

在本文中我们以在总体目标为背景定义了在Kubernates下部署promentheus监控平台的总体目标，并且一次目标分析了细线的基本实例，最后给出了在Kubernates部署Promentheus的具体步骤。

## 参考资料

* https://github.com/prometheus/prometheus
