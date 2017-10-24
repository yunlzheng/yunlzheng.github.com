title: CRI-O 1.0来了
date: 2017-10-23 21:04:37
tags: 译见
---

## CRI-O 1.0来了

[译者的话]CRI-O是一个轻量级的，专门对Kubernetes进行优化的容器运行时环境。它兼容OCI标准，也是Docker或者Moby的代替品之一。

对于CRI-O团队而言今天是一个激动的日子。 就在一年前，大概是2016年9月的时候，Antonio Murdaca和我们的研发团队的Antonio Murdaca创建了一个名为OCID的项目，后来改名为CRI-O。
我们的目标是为了确认我们是否可以构建一个简单的后台程序，这个程序既可以同时支持基于[Kubernetes容器运行时接口(CRI)](http://blog.kubernetes.io/2016/12/container-runtime-interface-cri-in-kubernetes.html)和[Open Container Initiative(OCI)](https://www.opencontainers.org/)标准的容器。也因如此，这个项目才会命名为CRI-O。

当时我们认为由于上游的Docker项目变化太快，导致了Kubernetes的不稳定。因此我们认为通过简化容器运行时环境我们应该可以做的更好。

我们非常感谢来自Intel，SUSE, Hyper，IBM以及其它的献者们。我们也得到了来自Google和Kubernetes社区的巨大帮助和支持，并且将这个项目放在了(Kubernetes孵化项目)[https://github.com/kubernetes-incubator]下。

对于CRI-O项目而言，我们的首要目标就是确保Kubernetes的始终稳定。我们在Github上建立了一个ci/cd系统，这样所有的pull reques都必须经过整个Kubernetes端到端测试套件的验证后才能提交到项代码仓库中。随着时间的推移，我们还计划添加额外的测试套件扩展，比如如[crictl](https://github.com/kubernetes-incubator/cri-tools/)测试套件和[OpenShift](http://www.openshift.com/)测试套件。
尽管这会给工程团队的工作带来很大挑战，但却可以大大提高了我们对于生产稳定产品的信心。

我们的第一个版本的CRI-O v1.0是基于Kubernetes 1.7版本。 工程团队希望有一个1.0版本。这是OpenShift 3.7中正在构建的版本。我们还计划近期发布CRI-O 1.8，未来CRI-O所有的版本都会与它们所支持的Kubernetes版本保持一致。

CRI-O项目的另一个目标是与其他项目共享技术。 我们知道我们自己无法构建一切。 
首先，我们需要能够支持与基于OCI标准的运行时环境如[runc](https://github.com/opencontainers/runc)以及Intel的[Clear Containers](https://clearlinux.org/features/intel%C2%AE-clear-containers)一起工作

我们也希望使用像[containers/storage](https://github.com/containers/storage)以及[containers/image](https://github.com/containers/image)这样的库，这样我们可以有效的取长补短。
同时我们并不希望像其他的容器运行时环境一样将所有的锁以及容器状态放在内存当中，这种做法会阻止系统中的其它进程与镜像和及存储系统协同工作。
因此CRI-O能够与[Skepeo](https://github.com/projectatomic/skopeo)和[Buildah](https://github.com/projectatomic/buildah)这样的工具一起很好的工作。对于未来，我们很乐意能够看到其它项目能够分享这些内容。

对于这个项目而言，我们另外的一个目标是能够比其它的容器运行时环境更轻。能够占用更小的内容空间，以及相比其他容器运行时环境对Kubernetes提供更好的性能表现。

CRI-O也非常感谢处于（容器生态系统）上游的Docker项目。
正如Isaac Newton所说：“如果我能够看得更远，那一定是站在巨人的肩膀上”
同样，CRI-O项目的工程师也从Docker项目中学习到了许多的经验。同时，我们也相信我们能够从他们过去的错误中吸取教训。由于开源,他们也能够借用一些其他的技术了。我们的工程师也会继续对Moby(原名Docker)项目做出贡献，并且希望所有容器相关的项目都能够继续蓬勃发展。

在OpenShift项目中还有很多其他的使用CRI-O的计划。
OpenShfit的在线版本中会在下个月将其中一些大部分用户从上游的Docker迁移到CRI-O。
OpenShift 3.7也会计划在技术预览模式下支持CRI-O。

V1.0只是一个开始。我们对于CRI-O的未来还有很多大的计划。做出一些新的尝试，并且一如既往的欢迎贡献者们的加入。

原文链接：[CRI-O 1.0 is here](https://medium.com/cri-o/cri-o-1-0-is-here-d06b97b92a98) （翻译：云龙)