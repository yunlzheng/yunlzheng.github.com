What is Kubernetes?
==================
![dwblog-kubernetes.png](https://developer.ibm.com/dwblog/wp-content/uploads/sites/73/dwblog-kubernetes.png)

你可能听说过Kubernetes, 但是它到底是什么？ 说真的，你能向你的老板，同事或者你家的狗（玩笑）解释清楚这件事情吗？

Kubenetes 是一款由Google开发的开源的容器编排工具（[Github源码](https://github.com/kubernetes/kubernetes)）,在Google已经使用超过15年(译者注：Kubernetest前身Borg). 但这意味着什么？ 为什么你需要关心它？

首先我们先简要说明一下在容器集群中运行应用时会面临到的一些问题，然后我会告诉你Kubernetes不是什么。 最后，我将会让你了解到Kubernetes是如何解决以上这些问题的。

那最后你应该能够说清楚Kubernetes到底是什么，这时他们(老板、同事)应该都会听你的了吧。

## 问题

在这节当中，我们将会看到三个当你在集群环境中运行容器应用程序时所会面临到的问题。 任何（容器集群）解决方案都需要解决这些问题（剧透警告: Kubernetes就是这样的）

### 调度

你已经得到了这个很棒的基于容器的应用程序？ 太棒了！现在你需要确保它能够运行在它应该运行的地方。将应用运行在集群中正确的主机上对你的应用程序而言是很重要的一件事情，因为并不是集群中所有主机都是一样的。

### 负载均衡

你的应用程序已经启动并且成功运行起来了。 好样的！ 现在你需要保证来自客户端的负载（请求）能够均匀的分布到集群的节点当中。这对于你的应用程序能够以最佳的方式利用每台主机的资源来处理客户端负载是非常重要的。你并不希望当中一些容器正在满负荷的工作，而另外一些却处在空闲的状态。

### 应用伸缩

这时你的容器已经运行起来了，并且客户端负载能够在这些容器当中很好的取得平衡。好极了! 而现在你需要能够启动一些新的容器来处理负载（当请求高峰时），同时可以清理掉一些（容器）当不再需要这些容器的时候。这很重要，因为这样才能够有效的（按需的）处理客户端请求的峰值。

### 集群管理和监控

现在你的应用程序已经可以在这个庞大的集群中高效的运行，这时你必须要管理它。 你需要明确知道它们 （集群中的相关服务）都是正常运行的，如部署，弹性伸缩，负载均衡以及容器的健康状态。当然这并不是一个轻松的活儿。

## Kubernetes不是什么？

### 平台即服务(PaaS)

尽管Kubernetes提供了很多与PaaS相似的功能，如存储管理，集群日志以及监控等。 但是Kubernetes并不是一个真正的PaaS，因为它并不提供诸如操作系统之类的组件，或者提供对Docker或者Java的支持工具，然而Kubernetes却可以和像Bluemix以及OpenShift这样的PaaS平台产品完美融合。

### 数据处理框架

Kubernetes毫无疑问是一个非常适合于运行大数据应用的框架，但是它并不能执行或者提供与数据处理的框架（如Apache Spark和Hadoop Map/Reduce）相同的功能。然而Kubernetes与Sprak以及Hadoop都能够很好的集成（这里仅举两个例子）

### 持续集成

Kubernetes并不能像Jenkins或者其它CI工具一样去构建你的应用程序容器，但（令人惊喜的是）它可以与CI协同工作，以帮助管理应用程序在其生命周期中的更新升级。

## 解决方案

Kubernetes解决了上面列举的每一个问题（你不会震惊，是吗？）。在接下来的部分，我将会讲述Kubernetes是如何解决这些问题的，同时也会介绍Kubernetes相关的一些<b><i>术语</i></b>(加粗的斜体部分)。

### 调度

在Kubernetes中<b><i>[Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/)</i></b>是指一组容器，它们一起工作，并且对外提供一个（或者一组）功能，<b><i>Pod</i></b>是Kubernetes中的调度的（最小）单元。

当一个pod被创建，调度器将会寻找最适合运行它的<b><i>[Node节点](https://kubernetes.io/docs/concepts/architecture/nodes/)</i></b>（集群当中的主机）。这个（调度）过程主要由[kube-scheduler](https://kubernetes.io/docs/admin/kube-scheduler/)组件负责完成，它会在集群中选择备选节点，并且确保其（节点）提供的资源能够满足pod中容器的需求。

### 负载均衡

Kubernetes中<b><i>[Service服务](https://kubernetes.io/docs/concepts/services-networking/service/)</i></b>是逻辑上的一组Pod（也被称为<b><i>[Replicas副本](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)</i></b>），这组Pod提供了相同的功能，Service服务解除了这些Pod副本与它们客户端之间的耦合（译者注：这里指当客户端需要访问Pod所提供的功能或服务时，直接访问Service即可，而不同知道具体是哪一个Pod实例在提供服务）。

在Kuernetes中，负载均衡在默认情况下是由Service来处理。 对于每一个Service实例你可以提供一个[lable selector(标签选择器)](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)，用于标示（与该服务关联的）Pod的Replica副本。由于Service服务与Replica副本的物理位置并不相关，因此当客户端使用它门（Pod副本）所提供的功能时，客户端既不知道也不关心它们实际运行的位置。调度器使用标签选择器为请求选择正确的服务，并且确保客户端负载始终均衡。

在某些受支持的云环境中，比如在[IBM Bluemix容器服务](https://www.ibm.com/cloud-computing/bluemix/containers)， Google Compute Engine(GCE)以及Amazon Web Services(AWS)中，你可以通过指定服务类型为**LoadBalancer**来[将服务配置为云供应商的负载均衡器](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/)。

### 应用伸缩

Kubernetes的[Replication控制器](https://kubernetes.io/docs/concepts/workloads/controllers/replicationcontroller/)可以确保在集群中始终运行制定数量的Pod副本。

Replication控制器通过确保要运行的副本数量来来实现应用程序的扩展伸缩。如果副本数量（可能有一个或者多个副本因为某些原因死掉），Replication控制器则会启动更多的实例，直到达到目标数量。而如果当存在过多的副本时（在[弹性伸缩](https://kubernetes.io/docs/user-guide/kubectl/v1.6/#autoscale)的情况下），则会自动关闭部分实例。

### 集群管理和监控

Kubernetest [Dashboard](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/)是一个基于Web的集群监控UI，包括管理运行中的pod实例，以及查看CPU,内存使用情况等指标。 在默认情况下Kubernetest并不会部署Dashboard，但通过kubectl命令你可以快速部署Dashboard，并开始使用它：

```
kubectl create -f https://rawgit.com/kubernetes/dashboard/master/src/deploy/kubernetes-dashboard.yaml
```

## 总结

你应该已经更好的理解Kubernetes所要解决的问题，以及是如何解决的。

好了，当在下一次员工会议时，让你的老板和同事惊讶与你对Kubernetes的（深入）了解。如果当你介绍完Kubernetes，他们还没有打算听你的，那你可能需要一份新的工作了，但是至少你的狗还是爱你的(玩笑)。

## 参考和一些其他Kubernetes相关的资料

在这篇文章里面，我已经给出了一些连接，以帮助你更多的了解Kubernetes，但是我认为我还是应该在这里列出一些更概括的参考资料，请享用！

* 原文地址: [https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)
* [IBM Bluemix Container Service – A highly secure, native Kubernetes experience for rapidly building cognitive apps](https://www.ibm.com/cloud-computing/bluemix/containers)
* [Scaling containers: The essential guide to container cluster](https://techbeacon.com/scaling-containers-essential-guide-container-clusters)
* [Kubernetes and IBM Bluemix: How to deploy, manage, and secure your container-based workloads](https://www.ibm.com/blogs/bluemix/2017/05/kubernetes-and-bluemix-container-based-workloads-part1/)
* [Compare other container cluster management tools](https://blog.kublr.com/choosing-the-right-containerization-and-cluster-management-tool-fdfcec5700df)
* [K8s scheduler](http://kamalmarhubi.com/blog/2015/11/17/kubernetes-from-the-ground-up-the-scheduler/)


