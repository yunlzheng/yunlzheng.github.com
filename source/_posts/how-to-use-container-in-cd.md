title: 我们应该如何基于容器来进行软件的持续交付的
date: 2016-12-14 11:31:44
tags: devops
---

## 概述

在过去的一段时间里容器已经大量的使用到了IT软件生产的各个环节当中：从软件开发，持续集成，持续部署，测试环境到生产环境。

除了Docker官方的Docker Swarm, Docker Machine以及Docker Compose以外，开源软件社区还涌现了一系列的与容器相关的工具，涵盖了从容器编排，调度，监控，日志等等各个方面的需求。

本文将从针对软件研发流程，基于容器解决软件的持续交付问题，以及团队协作问题

## 在持续集成中使用容器

### 构建环境统一管理

在传统模式下使用持续集成工具诸如Jenkins，在部署企业持续持续集成平台的第一个问题就是多样化的构建构建环境需求，而通常的做法是将构建Agent（服务器或者虚拟机）分配给团队由团队自己管理构建服务器的环境配置信息，安装相应的构建依赖等

- 在持续集成中使用docker

```
docker run --rm -v `pwd`:/workspace -v /tmp/.m2/repository:/root/.m2/repository --workdir /workspace  maven:3-jdk-8 /bin/sh -c 'mvn clean package'
```

如上所示，我们可以非常方便的通过容器来完成软件包的构建，其中有几个点需要注意的是：

- [x] --rm 命令可以确保当命令执行完成后能够自动清理构建时产生的容器，我想你应该不太希望需要不定期清理构建服务器磁盘的问题吧
- [x] -v 除了将当前源码挂载到容器当中以外，我们还可以通过挂载磁盘来缓存一些构建所需的依赖，比如maven下载的jar包，从而提高编译效率
- [x] --workerdir 用以指定构建命令执行的工作路径，当然需要和workspace保持一致

如上，基于容器我们可以快速搭建适应多种构建需求的CI构建环境，所有需要的一起就是你的构建服务器上需要的只有Docker

- 在持续集成中使用docker-compose

在某些情况下，在构建或者集成测试阶段我们可能需要使用到一些真正的第三方依赖，比如数据库或者缓存服务器。在传统的持续集成实践中，通常要么你直接使用已经部署的数据库（记得清理测试数据，并发如何保证），直接使用内存数据库来代替真实数据库，要不使用mock或者stub来进行测试。

当然在理想情况下我们还是希望能够使用与真实环境一直的真正的数据库或者其他中间件服务。基于docker-compose我们可以非常方便的实现对于复杂构建环境的需求

```
build:
  command: sh -c 'mvn --help'
  image: maven:3-jdk8
  links: [mysql]
  volumes:
    - '.:/code'
    - '/tmp/.m2/repository:/root/.m2/repository'
  working_dir: /code
mysql:
  environment: {MYSQL_DATABASE: test, MYSQL_PASSWORD: test, MYSQL_ROOT_PASSWORD: test, MYSQL_USER: test}
  image: mysql:5.5
```

同样我们以maven为例，假设我们需要在构建中使用到mysql以支持集成测试的需求

```
docker-compose run --rm build sh -c 'mvn clean package' && docker-compose stop && docker-compose rm -f
```

- [x] --rm 确保在构建命令执行完成后自动清理build所产生的容器
- [x] - docker-compose stop && docker-compose rm -f 确保依赖的其它服务如mysql能够正常的退出并且清理所产生的容器

## 持续交付是文化，自动化是基石，垮职能团队协作是根本

建立基于共同目标的具有跨职能协同的研发团队，是DevOps运动的根本。而自动化则是提高效率的基石。基于以上我们是如何基于容器建立我们的持续交付解决方案？

### 基础设施自动化

使用Rancher理由很简单，Rancher是目前市面上唯一一个能满足开箱即用的容器管理平台，同时能够支持多种编排引擎，如Rancher自己的Cattle，Google的K8S,以及Docker官方的Swarm作为容器编排引擎。同时Rancher提供的Catalog应用商店能够帮助研发团队自主创建所需要的服务实例

![http://7pn5d3.com1.z0.glb.clouddn.com/rancher.png](http://7pn5d3.com1.z0.glb.clouddn.com/rancher.png)

### 创建持续交付流水线

建立持续交付流水线的核心问题是如何定义企业的软件交付**价值流动**。

如下图所示，我们总结了从开发，持续集成，持续交付各个阶段所使用的一些典型工具的使用，以及在各个阶段中的相关团队的相关活动，典型的DevOps相关的活动

![http://7pn5d3.com1.z0.glb.clouddn.com/devops_and_cd_pipeline.png](http://7pn5d3.com1.z0.glb.clouddn.com/devops_and_cd_pipeline.png)

### 在持续交付流水线下的团队协作

正如上文所说，创建持续交付流水线的本质就是定义软件的交付的价值流动，反应正式的软件交付流程。价值的流动则涉及到团队中各个职能的成员的高度协同

![http://7pn5d3.com1.z0.glb.clouddn.com/image-base-cd-3.png](http://7pn5d3.com1.z0.glb.clouddn.com/image-base-cd-3.png)

基于容器的持续交付实践当中以镜像作为在不同职能人员之间的价值传递物

- 开发人员：频繁提交持续集成，通过持续的编译，打包，测试，镜像构建，自动化验收测试等环节产生可测试的候选镜像列表(如：0.1-dev)
- 测试人员：从候选测试镜像列表中，选择需要测试的目标镜像，标记为测试版本(将0.1-dev标记为0.1-test)，并且将待测试镜像自动部署到验收测试环境，完成手动探索性测试，对于已测试完成的镜像标记为预发布版本(0.1-test 标记为 0.1-beta)
- 运维人员：从预发布镜像列表中选择镜像部署到预发布环境，并且在验证通过后标记为release版本（如将0.1-beta 标记为 0.1-release）,并且发布到生产环境

![http://7pn5d3.com1.z0.glb.clouddn.com/harbor_in_pratices2.png](http://7pn5d3.com1.z0.glb.clouddn.com/harbor_in_pratices2.png)

在基于容器的持续交付实现方案当中，我们以镜像为价值传递的单元，通过镜像的持续测试以及验证，完成镜像从开发，测试到可发布的状态转变，完成软件的交付流程
