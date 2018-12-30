title:  在Kubernetes下实现API网关
date: 2017-11-28 13:02:08
tags: ['Spring Cloud', 'Spring Cloud Zuul', 'Kubernetes']
---

本文将介绍在Kubernetest如何搭建基于Spring Cloud Zuul的API网关。

<!-- more -->

## 两种服务发现模式

* 客户端服务发现

  客户端服务发现可以以Netflix的Eureka，CoreOS的etcd以及xxx的Consul为代表，提供了单独的服务发现和注册中心。客户端在进行远程调用时首先通过服务发现和注册中心获取到要访问的目标服务实例信息，在根据客户端负载均衡策略选择实例，再发起API的远程调用。

* 服务器端服务发现

  服务器端服务发现模式主要以DNS为代表，相关的工具包括Consul,以及一些平台如Kubernetes, Rancher等都提供了基于DNS服务发现注册能力。服务请求转发由平台或者工具提供相关的能力(如Health Check)支持，用于维护DNS代理的后端实例信息。

![/images/service-discovery.png](/images/service-discovery.png)


在**服务无状态的前提下**，基于DNS可以简化在代理过程中的Http请求次数，降低由于网络或者其他不稳定因数导致的服务远程调用失败。

## 在Kubernetes下使用Zuul创建API网关

### 创建服务实例

1. 创建应用Deployment

  构建应用镜像后通过Deployment文件可以将应用部署到k8s环境中

  ```
  apiVersion: extensions/v1beta1
  kind: Deployment
  metadata:
    labels:
      app: servicea
    name: servicea
  spec:
    template:
      metadata:
        labels:
          app: servicea
      spec:
        containers:
        - name: servicea
          image: namespace/servicea:stable
  ```

2. 添加服务健康检测探针

  通过设置Pod的liveness和readiness可以提升应用程序的稳定性，并且可以基于k8s的自身调度机制实现服务的自愈。同时在对服务进行滚动升级过程中，也可以避免k8s将请求发送到不健康的服务实例当中

  * liveness探针用于检测服务的运行状态
  * readiness探针用于服务状态是否正常

  ```
  spec:
    template:
      spec:
        containers:
        - name: servicea
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 15
            timeoutSeconds: 1
          readinessProbe:
            httpGet:
              path: /readiness
              port: 8080
            initialDelaySeconds: 20
            timeoutSeconds: 5
  ```

3. 创建Service，用于集群内服务的相互访问

  通过以下命令可以快速创建一个servicea的svc资源，在集群内部可以其它容器可以通过**service.namespace.svc.cluster.local**进行访问。在同一namespace下的可以直接使用service进行访问。

  ```
  kubectl expose deployment/servicea --port 8081
  ```

### 创建API Gateway实例

1. 基于Spring Cloud Zuul创建API Gateway代理应用

  ```
  @EnableZuulProxy
  @SpringBootApplication
  public class GatewayApplication {
      public static void main(String[] args) {
          SpringApplication.run(GatewayApplication.class, args);
      }
  }
  ```

2. 设置关闭基于Eureka的服务发现

  默认情况下Zuul会自动完成基于Eureka的服务发现能力对接，这里需要关闭相关功能

  ```
  # application.yml
  ribbon:
    eureka:
      enabled: false
  ```

3. 设置Zuul反向代理的Http Header穿透

  在某些情况下需要设置哪些Http Header可以通过代理层下发到服务中

  ```
  zuul:
    sensitiveHeaders: Cookie,Set-Cookie
  ```

4. 设置根服务路由

  代理根路径请求(http://gateway:8080/)到特定服务时使用在routes节点下使用root

  ```
  zuul:
    routes:
      root:
        path: /api/**
        url: http://api_server:16060
        stripPrefix: false
  ```

5. 设置其他服务路由

  设置其他服务的router代理路径，如下所示客户端可以通过访问api gateway的/servicea将请求代理到servicea（http://gatewat:8080/servicea/api/xxx -> http://servicea:8081/api/xxx）

  ```
  zuul:
    routes:
      servicea:
        url: http://servicea:8081
      serviceb:
        url: http://serviceb:8082
  ```

6. 设置基于DNS的路由请求超时时长

  对于API Gateway设施合理的超时时间，可以在服务发生异常时，快速失败。

  * 当使用服务发现时，通过设置ribbon.ReadTimeout和ribbon.SocketTimeout可以配置服务的超时时间。
  * 当使用URL进行路由时，则需要设施zuul.host.connect-timeout-millis和zuul.host.socket-timeout-millis来控制超时时间。

  ```
  zuul:
    host:
      socket-timeout-millis: 10000 #ms
  ```

### 要点小结

* 简化代理过程：使用DNS减少服务代理过程中的请求数，提高效率降低风险；
* 反脆弱性：在Kubernetes下对服务添加liveness和readness探针；
* 合理设施代理超时时间，避免因为不合理的超时时间导致正常调用失败，由于服务变慢导致系统变慢；

