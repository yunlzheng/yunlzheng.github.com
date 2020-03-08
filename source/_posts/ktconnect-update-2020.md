title: KT Connect项目在迭代了10个小版本后变化
date: 2020-03-08 10:23:47
tags: [kubernetes, kt connect]
---

在Dockone在线分享二三一期中，我分享了如何使用[KT Connect](https://github.com/alibaba/kt-connect)实现本地与Kubernetes集群内服务的双向联调，以实现面向Kubernetes的高效的本地开发测试体验。之后我们继续迭代了10+小版本后为KT Connect带来了一些新的变化。

<!--more-->

### 特性介绍

[KT Connect](https://github.com/alibaba/kt-connect)是面向Kubernetes开发者提供的一款轻量级的开发测试辅助工具。基于SSH协议实现本地与Kubernetes集群内服务之间的双向网络互通。从而可以直接在本地访问Kubernetes集群中的服务，以及从集群访问本地服务的能力。并提供了以下命令：

* connect: 建立本地->Kubernetes的网络通道，从而在本地可以直接访问PodIP, CluserIP以及Service DNS
* exchange: 将集群中所有对特定应用的网络请求，全部转发到本地服务
* mesh: 将部分对特定应用的网络请求，转发到本地服务。配合Istio可以实现精确的流量控制

### Windows的原生支持

在新版本中全新引入socks5代理模式，解决了由于依赖sshuttle导致Windows用户无法使用connect功能的问题。 在全新的版本中，Windows用户可以直接使用如下命令：

```
ktctl -d connect --method socks5
```

在命令执行成功后，通过设置http_proxy和https_proxy环境变量就可以直接在本地访问集群的PodIP以及ClusterIP。 

同时为了解决socks5模式下无法使用DNS域名解析的问题新增加参数`--dump2hosts`可以自动同步service dns解析规则到系统的hosts文件，并且在退出后自动清理。

```
ktctl -d connect --method socks5 --dump2hosts
```

配合新增的IDEA插件[JVM Inject](https://plugins.jetbrains.com/plugin/13482-jvm-inject/versions)可以自动加载http_proxy以及https_proxy参数到Java启动命令中，从而可以在IDEA中无缝与集群内服务进行联调，[点击这里](https://alibaba.github.io/kt-connect/#/en-us/guide/how-to-use-in-idea)查看详细介绍

### DNS域名解析增强

在旧版的KT Connect中本地如果要使用域名访问Kubernetes集群中的服务，只能使用类似于`<svc>.<namespace>.svc.cluster.local`这样的完整域名，在新版本中为了保持本地与集群的一致性。 新增了对`<svc>`以及`<svc>.<namespace>`DNS解析的完整支持。

### 新增*run*命令：暴露本地服务到集群

在kubectl中我们可以使用`kubectl run`命令在集群中快速使用镜像创建deployment并暴露svc.

在KT Connect中我们也可以采用类似的方式直接在集群中暴露本地服务:

```
ktctl run localservice --port=5701 --expose
```

其中localservice是注册到Kubernetes集群中的服务名，通过在集群中访问`localservice:5701`可以直接访问到本地运行的服务。

### 新增*dashboard*以及*check*命令

为了简化用户对当前本地环境无法正常使用ktctl相关命令的问题，新增`check`命令用于检查本地环境依赖。通过`ktctl dashboard init`以及`ktctl dashboard open`可以帮助用户快速安装以及使用KT Connect的Dashboard支持。

### 新的项目：Kt VirtualEnvironment

[KT Connect](https://github.com/alibaba/kt-connect)在本地通过双向网络互通让用户可以在本地和集群之间双向连通。而在集群侧我们引入[KT VirtualEnvironment]，(https://github.com/alibaba/virtual-environment)基于Service Mesh实现隔离的测试环境，本地服务可以通过ktctl命令直接加入到特定的隔离测试环境中。更多详情请查看[KT VirtualEnvironment Quick Start](https://alibaba.github.io/virtual-environment/#/zh-cn/ve/quickstart)

### 特别感谢

在这10多个版本迭代过程中除了云效团队以外，还有以下用户一起参与了KT Connect的建设中排名不分先后：

* [linfan](https://github.com/linfan)
* [fudali113](https://github.com/fudali113)
* [zeusro](https://github.com/zeusro)
* [sunmiOS](https://github.com/sunmiOS)
* [mojo-zd](https://github.com/mojo-zd)
* [csdnshyang](https://github.com/csdnshyang)
* [sunny0826](https://github.com/sunny0826)
* root2wf(dingtalk)

也希望有更多的用户和开发者能够参与到KT Connect的项目中，一起从Cloud Native到Cloud To Native，打造面向Kubernetes的高效的本地开发测试体验。

想了解更多关于KT Connect相关的问题，欢迎加入钉钉群：

![kt-dev](/images/dingtalk-group-v2.png)