---
title: Tips:解决Consul中服务实例重复注册的问题
date: 2018-06-04 00:59:45
tags:
---

为了提升系统核心服务的问题性，避免由于K8S网络导致服务间调用的稳定性。目前将系统核心服务的部署方式从Pod Network切换到了Host Network。 Host Network限制了Pod的部署数量，最大情况下只能和主机数量保持一致。因此需要在Deployment中设置一些反亲和性的调度策略。 确保Pod不会被反复注册到相同主机上。

<!-- more -->

![](/images/to-many-instance.png)

Spring Cloud中每个实例启动时都会产生一个唯一的InstanceID,并且通过InstanceID向Consul中进行注册。不同的InstanceID对于Consul而言就代表着不同的服务实例。但是由于目前将Pod网络方式设置成为了HostNetwork。因此只要是相同主机上启动的服务，其访问地址一定是相同的。 但是反复启动时，Spring Cloud注册会生成不同的InstanceID。 这些对于COnsul而言不同的Instance。 实际指向了一个相同的Pod网络。 在应用反复升级/部署之后，会发现Consul中存在大量的服务实例，而这些服务实例指向的地址都是相同的。对于这些服务Consul会定期调用Health Check去检查服务可用性。 大量的检查项导致Consul性能下降。为此需要一个简单的解决方案，确保在相同主机上运行的Pod实例，在部署/重启/升级后的InstanceID保持一致。

一个简单的方案就是在InstanceID中取出随机值，并且使用当前Pod的IP地址作为标识，例如： service-192-168-1-2。 这种方式可以确保Pod在默认容器网络或者Host网络下可以保持一致的行为。

```
apiVersion: v1
kind: Pod
metadata:
  name: your-spring-cloud-service
spec:
  containers:
    - name: your-spring-cloud-service
      image: your-spring-cloud-service-image
      command: [ "sh", "-c"]
      args:
      - --spring.cloud.consul.discovery.instanceId=${spring.application.name}${MY_POD_IP}
      env:
        - name: MY_POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
  restartPolicy: Never
```

这里通过将当前Pod的IP地址注入到容器实例的环境变量变量中，并且覆盖默认的--spring.cloud.consul.discover.instanceId来确保注册到Consul中的ServieID唯一。

除了podIP以外，K8S还支持从spec，metadata中获取Pod相关的信息：

```
    env:
        - name: MY_NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        - name: MY_POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: MY_POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: MY_POD_SERVICE_ACCOUNT
          valueFrom:
            fieldRef:
              fieldPath: spec.serviceAccountName
```