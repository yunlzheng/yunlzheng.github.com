Knative初探
==========

Knative(kay-nay-tiv)是由Google、Privotal、IBM、RedHat、SAP协作开发的，基于Kubernetes平台，用于构建，部署和管理现代Serverless框架。

## 核心组件

Knative目前主要提供了一下3个组件：

* Build: 提供从源码到容器的构建编排能力
* Eventing: 管理和分发事件
* Serving: 请求驱动的计算能力，支持scale to zero

Knative基于Kubernetes和Isito提供了一组中间件，提供在基于Kubernetes的研发过程的一系列最佳实践。

## 生态

* 开发者：可以使用Knative提供的Kubernetes原生API部署Serverless风格应用程序，并且可以自动的进行伸缩；
* 运营商：Knative旨在可以集成到更多的云产品中，任何企业或者云提供商都可以将Knative应用到起生态中，并且将这些优势提供他们的客户；
* 社区贡献者：Knative是一个多元，开放和包容的社区，并且建立了一条有效的贡献者工作流。

![](https://github.com/knative/docs/raw/master/images/knative-audience.svg?sanitize=true)