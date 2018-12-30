title: Flannel网络以及在阿里云下的实现解析
date: 2018-09-07 09:00:00
tags: kubernetes
---

在Kubernetes中网络中，主要包含两种IP，分别是Pod IP和Cluster IP。 Pod IP是实际存在于网卡之上（如VETH的虚拟网卡），而Cluster IP则是一个虚拟的IP地址，该虚拟机IP由kube-proxy进行维护，kube-proxy目前提供了两种实现方式，包括默认的ip tables实现以及在K8S 1.8之后开始支持的ipvs实现。

<!-- more -->

对于Kubernetes其网络而言，其实现需要确保集群中每个Pod都有一个唯一的IP地址，并且Pod之间可以直接进行跨主机通讯。在符合这一原则的前提下，Kubernetes允许通过插件的方式，集成不同的容器集群网络实现。其中最常用的应该是Flannel。Flannel是由CoreOS团队针对KUbernetes设计的一个Overlay Network实现，通过隧道协议（udp，vxlan）封装容器之间的通讯报文，实现集群间网络通讯。

![/images/flannel.png](/images/flannel.png)

Flannel默认使用UDP作为集群间通讯实现，如上图所示，Flannel通过ETCD管理整个集群中所有节点与子网的映射关系，如上图所示，Flannel分别为节点A和B划分了两个子网：10.1.15.0/16和10.1.20.0/16。同时通过修改docker启动参数，确保Docker启动的容器能够特定的网段中如10.1.15.1/24。

* 同一Pod实例容器间通信：对于Pod而言，其可以包含1~n个容器实例，这些容器实例共享Pod的存储以及网络资源，Pod直接可以直接通过127.0.0.1进行通讯。其通过Linux的Network Namespace为这组容器实现了一个隔离网络。

* 相同主机上Pod间通信：对于Pod而言，每一个Pod实例都有一个独立的Pod IP，该IP是挂载到虚拟网卡（VETH）上，并且bridge到docker0的网卡上。以节点A为例，其节点上运行的Pod均在10.1.15.1/24的网段中，其属于相同网络，因此直接通过docker0进行通信。

* 对于跨节点间的Pod通信：以节点A和节点B通讯而言，由于不同节点docker0网卡的网段并不相同，因此flannel通过主机路由表的方式，将对节点B POD IP网段地址的访问路由到flannel0的网卡上。 而flannel0网卡的背后运行的则是flannel在每个节点上运行的进程flanneld。由于flannel通过ETCD维护了节点间所有网络的路由关系，原本容器将的数据报文，被flanneld封装成UDP协议，发送到了目标节点的flanneld进程，再对udp报文进行解包，后将数据发送到docker0，从而实现跨主机的Pod通讯。

## 解析阿里云Flannel实现

上述简单解释了Flannel默认的UDP实现过程，可以看出，由于存在大量的数据报文封装和解析的过程，其必然会导致Pod间网络性能的下降。除了默认的UDP实现以外，Flannel还支持基于vxlan的方式，vxlan是一个在已有3层物理网络上构建的2层逻辑网络的协议。

这里我们以通过阿里云Kubernetes服务创建的集群为例，解释跨主机将Pod是如何通讯的。

这里创建了两个Pod实例，其分别运行在节点cn-beijing.i-2ze52j61t5p9z4n60c9m和cn-beijing.i-2ze52j61t5p9z4n60c9l上：

```
$ kubectl get pods -o wide --selector app=nginx
NAME                     READY     STATUS    RESTARTS   AGE       IP             NODE
nginx-56f766d96f-2dl9t   1/1       Running   0          2m        172.16.2.229   cn-beijing.i-2ze52j61t5p9z4n60c9m
nginx2-6f4bb4799-t84rh   1/1       Running   0          3m        172.16.2.125   cn-beijing.i-2ze52j61t5p9z4n60c9l
```

以172.16.2.229访问172.16.2.125为例，我们进入到172.16.2.229所在节点的flannel容器:

```
$ k -n kube-system get pods -o wide --selector app=flannel
NAME                    READY     STATUS    RESTARTS   AGE       IP             NODE
kube-flannel-ds-7zdnw   2/2       Running   4          31d       192.168.3.91   cn-beijing.i-2ze52j61t5p9z4n60c9k
kube-flannel-ds-86d5j   2/2       Running   0          31d       192.168.3.90   cn-beijing.i-2ze52j61t5p9z4n60c9m
kube-flannel-ds-9xn6p   2/2       Running   1          31d       192.168.3.87   cn-beijing.i-2ze44hu8106jqyw43i8d
kube-flannel-ds-hjlb4   2/2       Running   1          31d       192.168.3.92   cn-beijing.i-2ze52j61t5p9z4n60c9l
kube-flannel-ds-nb28r   2/2       Running   1          31d       192.168.3.88   cn-beijing.i-2ze8rkx46zywd36w8noo
kube-flannel-ds-vmsxn   2/2       Running   1          31d       192.168.3.89   cn-beijing.i-2ze3pggklybyryt9475e
```

首先，在上文中说了，Flannel通过ETCD会统一为每个节点分配相应的网段：

```
$ k -n kube-system exec -it kube-flannel-ds-hjlb4 -c kube-flannel cat /run/flannel/subnet.env
FLANNEL_NETWORK=172.16.0.0/16
FLANNEL_SUBNET=172.16.2.1/25
FLANNEL_MTU=1500
FLANNEL_IPMASQ=true
```

如上所示，Flannel建立了一个172.16.0.0/16的大网，而节点cn-beijing.i-2ze52j61t5p9z4n60c9m则分配了一个172.16.2.1/25的小网。所以该节点上所有Pod的IP地址一定是在该网段中（172.16.2.1 ~ 172.16.2.126）。

### 出口方向

从nginx-56f766d96f-2dl9t（172.16.2.229）所在节点的flannel实例kube-flannel-ds-86d5j查看网卡信息：

```
$ k -n kube-system exec -it kube-flannel-ds-86d5j -c kube-flannel ifconfig
cni0      Link encap:Ethernet  HWaddr 0A:58:AC:10:02:81
          inet addr:172.16.2.129  Bcast:0.0.0.0  Mask:255.255.255.128
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:613034223 errors:0 dropped:0 overruns:0 frame:0
          TX packets:410106254 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:97180782429 (90.5 GiB)  TX bytes:855792296086 (797.0 GiB)

docker0   Link encap:Ethernet  HWaddr 02:42:31:24:3A:76
          inet addr:172.17.0.1  Bcast:0.0.0.0  Mask:255.255.0.0
          UP BROADCAST MULTICAST  MTU:1500  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)

eth0      Link encap:Ethernet  HWaddr 00:16:3E:12:3F:B9
          inet addr:192.168.3.90  Bcast:192.168.3.255  Mask:255.255.252.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:1026400899 errors:0 dropped:0 overruns:0 frame:0
          TX packets:731775772 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:933504290702 (869.3 GiB)  TX bytes:151441072517 (141.0 GiB)

lo        Link encap:Local Loopback
          inet addr:127.0.0.1  Mask:255.0.0.0
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:2848730 errors:0 dropped:0 overruns:0 frame:0
          TX packets:2848730 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1
          RX bytes:1107009588 (1.0 GiB)  TX bytes:1107009588 (1.0 GiB)

veth00c70308 Link encap:Ethernet  HWaddr D2:D9:ED:7B:3F:A7
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:10680903 errors:0 dropped:0 overruns:0 frame:0
          TX packets:12038380 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0
          RX bytes:717656154 (684.4 MiB)  TX bytes:108607531374 (101.1 GiB)
# 省略其它输出
```

其中veth00c70308是每个Pod实例虚拟网卡，并且通过网桥的方式链接到cni0网卡：

```
$ k -n kube-system exec -it kube-flannel-ds-86d5j -c kube-flannel brctl show
bridge name	bridge id		STP enabled	interfaces
docker0		8000.024231243a76	no
cni0		8000.0a58ac100281	no		veth00c70308
							veth244016e7
							veth41b59852
							veth1bde8f9e
							veth5758e57f
							vethfb90332d
							veth6fd79bb3
							veth80ab3625
							veth2f19245f
							vethb593c87a
							vethbc655860
							vethde851a00
							veth0c794757
							veth46c15d7c
							vethdddc772a
							veth9e77c7d5
							veth17b62b88
							veth3810c1b0
```

从172.16.2.229向172.16.2.125，从源容器发出后通过网桥全部发送到cni0的网卡上。查看系统路由表，遗憾的是在系统中找不到任何从cni0网卡向后转发的规则：

```
$ k -n kube-system exec -it kube-flannel-ds-86d5j -c kube-flannel route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         192.168.3.253   0.0.0.0         UG    0      0        0 eth0
169.254.0.0     *               255.255.0.0     U     1002   0        0 eth0
172.16.2.128    *               255.255.255.128 U     0      0        0 cni0
172.17.0.0      *               255.255.0.0     U     0      0        0 docker0
192.168.0.0     *               255.255.252.0   U     0      0        0 eth0
```

这部分的路由转发在阿里云环境中是通过VPC路由表实现，如下所示：

![](https://github.com/yunlzheng/kubernetes-hands-on-workshop/raw/master/02-core-concept/images/aliyun-vpc-route.png)

从172.16.2.225发送到172.16.2.125的请求，匹配的路由记录为172.16.2.0/25。流量会被转发到 主机i-2ze52j61t5p9z4n60c9l，即Pod实例nginx2-6f65c584d-nglvf（172.16.2.125）所在的主机。

### 入口方向

出口方向，从源容器nginx-56f766d96f-2dl9t（172.16.2.229）发送到nginx2-6f4bb4799-t84rh（172.16.2.125)的流量已经正确的发送到目标节点i-2ze52j61t5p9z4n60c9l。

查看接收流量主机的路由规则：

```
$ k -n kube-system exec -it kube-flannel-ds-hjlb4 -c kube-flannel -- route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.3.253   0.0.0.0         UG    0      0        0 eth0
169.254.0.0     0.0.0.0         255.255.0.0     U     1002   0        0 eth0
172.16.2.0      0.0.0.0         255.255.255.128 U     0      0        0 cni0
172.17.0.0      0.0.0.0         255.255.0.0     U     0      0        0 docker0
192.168.0.0     0.0.0.0         255.255.252.0   U     0      0        0 eth0
```

根据主机路由表规则，发送到172.16.2.125的请求会落到路由表：

```
172.16.2.0      0.0.0.0         255.255.255.128 U     0      0        0 cni0
```

从而请求进入到cni0网卡，并发送到相应的容器。

相比于UDP的实现方式，在vxlan中，不需要依赖于额外的flannel接口，通过([ali-vpc backend](https://github.com/coreos/flannel/blob/master/Documentation/alicloud-vpc-backend-cn.md))来代替封装IP规则以获得最佳的性能表现。