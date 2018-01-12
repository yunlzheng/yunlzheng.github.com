Kubernetes 101: Pods, Nodes, Containers, and Clusters
====

Kubernetes已经迅速成为在云中部署和管理软件的新的标准。然后Kubernetes的学习曲线却相对而言更陡峭。对于一个初学者，想要从官方文档中深入了解Kubernetes会非常困难。Kubernetes由很多不同的部分组成，因此很难说清楚哪些是和你的需求有关。这边博客将会尝试提供一个Kubernetes的简化视图，并且尝试对重要的组件进行High-level的描述，以及它们是在一起的工作的。

首先，我们先来看看硬件层面

## 硬件Hardware

### 节点Node

![](http://7pn5d3.com1.z0.glb.clouddn.com/k8s-101/1_uyMd-QxYaOk_APwtuScsOg.png)

[Node](https://kubernetes.io/docs/concepts/architecture/nodes/)是Kubernetes中硬件的最小单元。它代表集群当中的一个单台主机。在大部分的生产系统中，Node既可以是你数据中心中的一个物理主机也可以在托管在云平台(如Google Cloud Platform)中的虚拟主机。当然你也不必限制于这些当中，从理论上讲，你可以将任何东西都作为Node,比如一个[智能手表](https://twitter.com/jkrippy/status/932800484703862784)，或者[树莓派](https://blog.hypriot.com/post/setup-kubernetes-raspberry-pi-cluster/)


把主机抽象成一个Node可以允许我们定义一个抽象层。从而可以不用担心单个主机的独立特性，我们可以简单的将每一个主机视为一组可以利用的CPU和RAM资源。这样Kubernetes集群中的任何一个主机都是可以替换的。

### 集群Cluster

![](http://7pn5d3.com1.z0.glb.clouddn.com/k8s-101/1_KoMzLETQeN-c63x7xzSKPw.png)

虽然在单个节点上处理任务也是可行的，但这并不是Kubernetes的风格。一般来说，你应该考虑整个集群的状态，而不是其中的某一个节点。

在Kubernetes中，将所有Node的资源集中在一起，从而形成了一台更加强大的“服务器”。 当你将你的应用部署到集群当中时，它可以自动的为你选择工作Node。如果有新的Node加入或者被移除，集群会自动将应用转移。对于应用程序或者程序员而言，代码到底运行在哪一个节点上显得并不重要。

这种类似于hivemind的系统可能让你联想到[星际迷航中的Brog](http://memory-alpha.wikia.com/wiki/Borg)，当然并不是只有你一个人会这么想，“Borg”也正是一个[Google内部项目](http://blog.kubernetes.io/2015/04/borg-predecessor-to-kubernetes.html)的名字，而Kubernetes正是在此项目基础上构建的。

### 持久卷Presistent Volumes

由于在Kubernetes当中并不保证应用程序运行在集群中的特定节点上，因此数据不能直接保存到主机的文件系统上。如果应用程序把数据保存到文件系统中，而应用又被调度到其它节点删，那应用就无法找到想要的数据文件。因此对于传统的在每个节点上的本地存储应该被视为应用程序的临时缓存，而不应该在本地存储任何需要持久化的数据。

![](http://7pn5d3.com1.z0.glb.clouddn.com/k8s-101/1_kF57zE9a5YCzhILHdmuRvQ.png)

为了保存数据，Kubernetes使用[持久卷（Persistent Volumes）](http://kubernetes/)。尽管集群中所有节点的CPU和RAM都是有集群进行集中管理的，但是持久化文件存储并不是。相反，可以将本地或者云存储链接到集群当中。可以理解为将一个外部的硬盘插入到了集群这个“服务器”中。持久卷提供了一个文件系统，这个文件系统可以挂在到集群当中，而不需要关联任何特定的节点。


## 软件Software

### 容器Containers

![](http://7pn5d3.com1.z0.glb.clouddn.com/k8s-101/1_ILinzzMdnD5oQ6Tu2bfBgQ.png)
运行在Kubernetes中的应用程序需要使用[Linux containers](https://www.docker.com/what-container)进行打包。容器是一个广泛接受的标准，这里也已经有很多的[已构建的镜像](https://hub.docker.com/explore/)可以直接部署到Kubernetes当中。

容器化允许你创建一个包含Linux执行环境的独立空间。任何应用程序以及其依赖都可以被打包成一个文件中，并且在互联网上共享。任何人都可以下载容器并且通过极少的配置就可以将其部署到基础设施上。创建容器的过程也可以通过编程来实现，从而可以形成一个当大的CI/CD流水线。

虽然我们可以将多个应用程序打包到一个容器当中，但是对于你而言，最好还是尽可能保持一个容器中只包含一个单独的进程。相比于在一个容器包含多个进程而言，将这些进程拆分到不同的容器当中，可以让每个容器更加内聚，并且更易于更新和部署。同时在出问题时也更容易定位。

### 豆荚Pods

![](http://7pn5d3.com1.z0.glb.clouddn.com/k8s-101/1_8OD0MgDNu3Csq0tGpS8Obg.png)

不同于其它你过去使用过的其它系统，Kubernetes并不直接运行容器，取而代之的是使用了一个high-level的抽象来包装一个或者多个容器，这个抽象被称为[Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/)。在Pod中的任何容器都共享了[容器命名空间](https://en.wikibooks.org/wiki/Introduction_to_Programming_Languages/Scoping_with_Namespaces)以及本地网络。因此在Pod的容器直接可以非常方便的进行通讯，就好像它们是运行在同一个机器上一样，同时彼此之间又保持隔离。

Pod同时也是Kubernetes中的最小调度单元。 如果你的应用编程非常受欢迎，单个Pod无法处理这样的负载。Kubernetes可以在必要时创建并部署一个新的副本。即使在非高负载的情况下，在生成环境中运行多个Pod的副本可以有效的均衡负载并且避免故障的发生。

Pod中可以包含多个容器，但是你还是应该尽可能的限制一下。因为Pod是作为一个最小单元，整体进行伸缩。这可能导致资源的浪费以及更多的费用开销。为了避免这种问题。Pod应该尽可能的保持“小”，通常指应该包含一个主进程，以及与其紧密合作的辅助容器(这些辅助容器通常被称为Sidecar).

### 部署Deployments

![](http://7pn5d3.com1.z0.glb.clouddn.com/k8s-101/1_iTAVk3glVD95hb-X3HiCKg.png)


虽然Pod是Kubernetes中的一个最小单元，但是通常我们并不在集群中直接部署一个Pod。相反，Pod通常应该被另外一个抽象[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)进行管理。

一个Deployment最主要的目的是用来声明需要有多少Pod的副本运行。当Deployment部署到集群之后，它会自动运行指定数量的Pods,并且对这些Pod进行监控，如果有Pod的副本死掉了，Deployment会自动创建新的实例。

使用Deployment后就不需要手动去管理Pods,你只需要声明应用期望的状态，Deployment会自动帮你管理应用。

### 路由入口Ingress

![](http://7pn5d3.com1.z0.glb.clouddn.com/k8s-101/1_tBJ-_g4Mk5OkfzLEHrRsRw.png)

使用上面的这些概念，你可以创建一个集群，并且在集群中通过Deployment来部署和管理Pod。 这里还有最后一个问题需要解决：如何允许外部流量进入到你的应用程序。

默认情况下，Kubernetes将Pods和外部网络环境进行了隔离。 如果你想要与运行在Pod中的服务进行通讯，那你必须要大概一个用于通讯的通道，这个通道就是Ingress.

有许多方式可以将Ingress添加到你的集群当中。最普遍的方式是使用[Ingress Controller](https://kubernetes.io/docs/concepts/services-networking/ingress/)或者[负载均衡器](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/)。如果选择这两种方式已经超出了本文的范围，但是你必须意识到，在你尝试使用Kubernetes之前，你需要处理Ingress入口。

## 接下来做什么？

上面的部分介绍的是一个简化了的Kubernetes版本，但是应该可以给你在开始实验前必要的一些基础知识了。你已经了解了该系统的各个部分，现在你需要的是使用Kubernetes来部署一个真正的应用程序。 [官方的Kubernetes教程](https://kubernetes.io/docs/tutorials/kubernetes-basics/)是一个很好的开始。

为了在本地试验Kubernetes，[Minikube](https://kubernetes.io/docs/getting-started-guides/minikube/)可以帮助你在本地创建一个虚拟的集群。而如果你已经开始准备在云服务中尝试Kubernetes。 [Google Kubenetes Engine](https://cloud.google.com/kubernetes-engine/)包含了一系列的[教程](https://cloud.google.com/kubernetes-engine/docs/tutorials/)可以帮助你快速入门。

如果你是刚开始接触容器或者web基础设施这个领域，我建议你可以先了解[应用12要素](https://12factor.net/)。12要素中描述了当你在设计运行在类似于Kubernetes这样的平台上的应用程序时的最佳实践，这些都是需要时刻记住的东西。

最后，如果喜欢这篇文章，可以在Medium以及[Twitter (@DanSanche21)](https://twitter.com/DanSanche21)上找到我.

## 参考资料

* https://kubernetes.io/docs/concepts/architecture/nodes/
* https://twitter.com/jkrippy/status/932800484703862784
* https://blog.hypriot.com/post/setup-kubernetes-raspberry-pi-cluster/
* http://blog.kubernetes.io/2015/04/borg-predecessor-to-kubernetes.html
* https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
* https://kubernetes.io/docs/concepts/services-networking/ingress/
* https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/
* https://kubernetes.io/docs/tutorials/kubernetes-basics/
* https://cloud.google.com/kubernetes-engine/
* https://12factor.net/

原文链接：[Kubernetes 101: Pods, Nodes, Containers, and Clusters](https://medium.com/google-cloud/kubernetes-101-pods-nodes-containers-and-clusters-c1509e409e16) （翻译： [云龙](http://dockone.io/people/%E4%BA%91%E9%BE%99%E4%BA%91)）