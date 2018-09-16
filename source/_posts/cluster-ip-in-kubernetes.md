title: Kubernetes服务发现之ClusterIP
date: 2018-09-16 15:38:16
tags: [Kubernetes]
---

在[《Flannel网络以及在阿里云下的实现解析》](http://ylzheng.com/2018/09/07/k8s-flannel-in-alicloud/)中说过在Kubernetes中网络中，主要包含两种IP，分别是Pod IP和Cluster IP。 Pod IP是实际存在于网卡之上（如VETH的虚拟网卡），而Cluster IP则是一个虚拟的IP地址，该虚拟机IP由kube-proxy进行维护，kube-proxy目前提供了两种实现方式，包括默认的ip tables实现以及在K8S 1.8之后开始支持的ipvs实现。文章中以阿里云Kubernetes集群为例，从Pod IP的角度介绍了Pod和Pod之间是如何通讯的。这篇文章，笔者将解释基于ClusterIP的服务发现是个什么鬼。

<!-- more -->

## 基于ClusterIP的服务发现

Kubernetes中服务发现主要通过每个主机上的kube-proxy组件实现，其作用是通过控制iptables将对Service ClusterIP的请求，转发到后端Endpoints中，剩下就交给容器网络。

以default命名空间下的nginx svc为例：

```
$ kubectl get svc --selector app=nginx
NAME      TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
nginx     ClusterIP   172.19.0.166   <none>        80/TCP    1m
```

查看Service详情:

```
$ kubectl describe svc nginx
Name:              nginx
Namespace:         default
Labels:            app=nginx
Annotations:       <none>
Selector:          app=nginx
Type:              ClusterIP
IP:                172.19.0.166
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         172.16.2.125:80,172.16.2.229:80
Session Affinity:  None
Events:            <none>
```

上述信息中可以看出该svc的ClusterIP为172.19.0.166，后端代理了2个Pod实例:172.16.2.125:80,172.16.2.229:80

在任意Node节点中找到flannel实例，查看iptables信息：

```
$ k -n kube-system exec -it kube-flannel-ds-hjlb4 -c kube-flannel -- iptables -S -t nat
# 省略输出
-A KUBE-SERVICES -d 39.96.133.156/32 -p tcp -m comment --comment "default/wrinkled-crocodile-selenium-hub:hub loadbalancer IP" -m tcp --dport 4444 -j KUBE-FW-SI6MMWWVN6LUBWIY
-A KUBE-SERVICES ! -s 172.16.0.0/16 -d 172.19.15.240/32 -p tcp -m comment --comment "default/nginx: cluster IP" -m tcp --dport 80 -j KUBE-MARK-MASQ
-A KUBE-SERVICES -d 172.19.15.240/32 -p tcp -m comment --comment "default/nginx: cluster IP" -m tcp --dport 80 -j KUBE-SVC-4N57TFCL4MD7ZTDA
# 省略出书
```

根据路由转发规则，从Pod访问ClusterIP 172.19.0.166的80端口的请求，匹配到转发规则：

```
-A KUBE-SERVICES ! -s 172.16.0.0/16 -d 172.19.0.166/32 -p tcp -m comment --comment "default/nginx: cluster IP" -m tcp --dport 80 -j KUBE-MARK-MASQ
-A KUBE-SERVICES -d 172.19.0.166/32 -p tcp -m comment --comment "default/nginx: cluster IP" -m tcp --dport 80 -j KUBE-SVC-4N57TFCL4MD7ZTDA
```

直接跳转到KUBE-SVC-4N57TFCL4MD7ZTDA:

```
-A KUBE-SVC-4N57TFCL4MD7ZTDA -m comment --comment "default/nginx:" -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-ZWDBLNQ3XRBMUP33
-A KUBE-SVC-4N57TFCL4MD7ZTDA -m comment --comment "default/nginx:" -j KUBE-SEP-H2XFNPZ6MLIHFOVM
```

通过iptables的--probability的特性，使连接有50%的概率进入到KUBE-SEP-ZWDBLNQ3XRBMUP33，KUBE-SEP-H2XFNPZ6MLIHFOVM的作用是把请求转发到172.16.2.125:80：

```
-A KUBE-SEP-ZWDBLNQ3XRBMUP33 -s 172.16.2.125/32 -m comment --comment "default/nginx:" -j KUBE-MARK-MASQ
-A KUBE-SEP-ZWDBLNQ3XRBMUP33 -p tcp -m comment --comment "default/nginx:" -m tcp -j DNAT --to-destination 172.16.2.125:80
```

另外50%的请求，则可能进入到KUBE-SEP-QKRDMLY5MWSFYSJG，同理，该规则的作用是把请求转发到172.16.2.229:80:

```
-A KUBE-SEP-H2XFNPZ6MLIHFOVM -s 172.16.2.229/32 -m comment --comment "default/nginx:" -j KUBE-MARK-MASQ
-A KUBE-SEP-H2XFNPZ6MLIHFOVM -p tcp -m comment --comment "default/nginx:" -m tcp -j DNAT --to-destination 172.16.2.229:80
```

Kubernetes通过iptables规则，将对ClusterIP的访问，负载到后端的PodID，剩下的事情，就是在文章[《Flannel网络以及在阿里云下的实现解析》](http://ylzheng.com/2018/09/07/k8s-flannel-in-alicloud/)介绍的部分了