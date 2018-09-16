title: 使用Helm优化Kubernetes下的研发体验：基础设施即代码
date: 2018-09-13 12:00:00
tags: [Helm, Kubernetes]
---

容器即进程，Kubernetes则解决了如何部署和运行应用的问题。对于任何一个部署在Kubernetes得应用而言，通常都可以由几个固定的部分组成：Ingress,Service,Deployment等。直接使用Kubernetes原生的YAML定义服务，虽然能一定程度上简化应用的部署，但是对于大部分研发人员来说编写和使用YAML依然是一件相对痛苦的事情。HELM应允而生，Helm作为Kubernetes下的包管理工具，对原生服务定义过程进行了增强，通过模板化，参数化的形式大大简化用户部署Kubernetes应用的复杂度。

在本文中笔者，将以一个Spring Boot程序为例，介绍如何在软件研发端到端过程中是使用Helm。本文中所使用的示例代码可以通过[Github](https://github.com/yunlzheng/project-samples/tree/master/containerization-spring-with-helm)下载。

<!-- more -->

## 创建应用程序

项目采用Maven作为项目的编译和构建工具，项目目录结构如下：


```
├── README.md
├── chart
│   ├── Chart.yaml # Chart基本信息
│   ├── charts # 依赖
│   ├── templates # Kubernetes模板
│   │   ├── NOTES.txt
│   │   ├── _helpers.tpl
│   │   ├── deployment.yaml
│   │   ├── ingress.yaml
│   │   └── service.yaml
│   └── values.yaml # 变量
├── Dockerfile # Dockerfile定义
├── entrypoint.sh # 容器的entrypoint.sh文件
├── mvnw
├── mvnw.cmd
├── pom.xml 
├── src # 应用源码
│   └── main
│       └── java
│           └── hello
│               ├── Application.java
│               └── HelloController.java
```

该项目SCM中通过基础实施即代码的方式，我们定义了应用的3大要素：应用源码，应用是如何构建的（Dockerfile）以及应用是如何部署的(Chart)。

## 构建容器镜像

容器相关内容

```
├── Dockerfile # Dockerfile定义
├── entrypoint.sh # 容器的entrypoint.sh文件
```

为了简化容器镜像构建过程，在Dockerfile中我们采用了Multi-Stage Builds的方式构建镜像，Dockerfile的具体内容如下：

```
# Build
FROM maven:3.5.0-jdk-8-alpine AS builder

ADD ./pom.xml pom.xml
ADD ./src src/
RUN mvn clean package


# Package
FROM java:8

COPY --from=builder target/gs-spring-boot-0.1.0.jar gs-spring-boot.jar
RUN bash -c 'touch /gs-spring-boot.jar'

ADD entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
```

在第一个阶段中，我们将pom.xml以及源码加载到一个maven基础镜像中，并命名为builder，通过`mvn clean package`命令实现Java源码的编译打包，产生的jar包会保存到容器的targets目录下。

在第二个阶段中，我们在java:8基础镜像的基础上直接从builder容器中拷贝jar文件，到当前容器中。为了能够在容器中运行该jar文件，这里我们定义了一个entrypoint.sh作为容器的启动命令，其内容如下：

```
#!/usr/bin/env bash
ACTIVE_PROFILE=${PROFILE:=default}
java -Xmx1024m -Djava.security.egd=file:/dev/./urandom -jar gs-spring-boot.jar --spring.profiles.active=${ACTIVE_PROFILE} $@
```

这里需要注意的是在命令的最后我们添加了一个$@，该语法可以获取命令命令行中的所有参数，这样在后期运行容器时，可以在命令行中使用参数，覆盖应用的默认配置，例如`--spring.profiles.active=prod`

运行以下命令，编译并打包应用:

```
$ docker build -t yunlzheng/spring-app . # 修改为自己的镜像仓库
Sending build context to Docker daemon  16.38MB
Step 1/10 : FROM maven:3.5.0-jdk-8-alpine AS builder
 ---> 67d11473f554
......
Successfully built e332622092ce
Successfully tagged yunlzheng/spring-app:latest
```

上传镜像到镜像仓库中(需要实现注册容器镜像服务)

```
docker push yunlzheng/spring-app # 修改为自己的镜像仓库
```

## 构建Chart

通过容器镜像我们为服务定义了一个隔离的运行时环境，而为了能够让我们的应用程序能够运行到Kubernetes集群当中，我们还需要定义Helm相关的内容，来标准化容器的编排和部署信息：

```
├── chart
│   ├── Chart.yaml # Chart基本信息
│   ├── charts # 依赖
│   ├── templates # Kubernetes模板
│   │   ├── NOTES.txt
│   │   ├── _helpers.tpl
│   │   ├── deployment.yaml
│   │   ├── ingress.yaml
│   │   └── service.yaml
│   └── values.yaml # 变量
```

在以上结构中我们定义了该应用是如何在Kubernetes集群中运行的。在初始化应用时，用户可以通过使用helm命令生成以上内容：

```
$ helm create chart
Creating chart
```

Chart我们可以理解为一组K8S manifest文件的模板，Chart.yaml中包含了该chart的基本信息,如名称，版本等:

```
apiVersion: v1
appVersion: "1.0"
description: A Spring Boot Application
name: chart
version: 0.1.0
```

在values.yaml中，我们定义了当前模板中所有的变量，如下所示：

```
replicaCount: 1

image:
  repository: yunlzheng/spring-app #修改为自己的镜像
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8080 #容器映射的端口
  
ingress:
  enabled: true # 打开集群ingress
  annotations: {}
    # kubernetes.io/ingress.class: nginx
    # kubernetes.io/tls-acme: "true"
  path: /
  hosts:
    - spring-example.local
  tls: []
```

templates目录下，则是K8S用户熟悉的如deployment.yaml, service.yaml。当然你也可以根据自己的需求添加更多的模板文件。

以deployment.yaml为例，文件内容如下所示：

```
# deployment.yaml
apiVersion: apps/v1beta2
kind: Deployment
metadata:
  name: {{ template "chart.fullname" . }}
  labels:
    app: {{ template "chart.name" . }}
    chart: {{ template "chart.chart" . }}
    release: {{ .Release.Name }}
    heritage: {{ .Release.Service }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ template "chart.name" . }}
      release: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ template "chart.name" . }}
        release: {{ .Release.Name }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
```

在文件中使用了了values.yaml中定义的相关变量，如Values.replicaCount，Values.image.repository，Values.image.tag等，使用这些变量的好处是，在部署Chart的时候，我们可以在命令行中动态修改这些变量的值，例如，修改镜像部署的版本等， service.yaml中的内容也是类似的，这里就不做描述。

完成以上内容后，我们就可以将当前应用打包成一个chart文件，首先我们需要验证一下chart文件的内容：

```
$ cd chart
$ helm lint
==> Linting .
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, no failures
```

在确认chart格式没有问题之后，开发人员就可以直接通过helm部署实例到Kubernetes集群：

```
$ cd chart
$ helm install .
# 省略其它输出
==> v1/Service
NAME                        TYPE       CLUSTER-IP    EXTERNAL-IP  PORT(S)   AGE
womping-sparrow-spring-app  ClusterIP  172.19.11.41  <none>       8080/TCP  1s

NOTES:
1. Get the application URL by running these commands:
  http://spring-example.local/
```

开发人员访问，并验证应用是否按照预期运行：

[attach]15417[/attach]

## 发布Chart

在确认应用能够正常运行之后，我们就可以对Chart进行打包和发布了。对于运维和测试人员，而言，他们只需要直接使用特定版本的应用chart，并对其进行测试或者是部署：

```
$ cd ..
$ helm package chart
Successfully packaged chart and saved it to: /Users/yunlong/workspace/project-samples/containerization-spring-with-helm/chart-0.1.0.tgz
```

在默认情况下，`helm package`命令会使用Charts.yaml中文件定义的版本。 而如果在持续集成工具中，如果我们希望每次都能动态生成一个新版本的Chart，那在打包时，可以通过--version，动态修改，从而确保每次持续集成过程都能产生一个新的版本，并且能够对该版本进行独立验证。

```
$ helm package chart --version 0.0.2
Successfully packaged chart and saved it to: /workspace/tmp/spring-sample/chart-0.0.2.tgz
```

万事具备，当然现在还没有任何人能够使用你构建的chart，为了能够让其他人（测试，运维，or anyone）能够使用Chart我们需要将Chart发布到一个公共的仓库(Repository)当中。

Helm官方提供了一个名叫[Chartmusem](https://github.com/helm/chartmuseum)的开源项目，支持对接AWS S3，Google Storage，Alibaba OSS等存储服务，用户可通过其API上传Chart,并且自动生成仓库索引文件，有精力的同学可以自行研究。

这里我们直接使用[阿里云效](https://rdc.aliyun.com/)提供的Helm仓库服务，用户只需要注册账号，并[开通私有仓库服务](https://repomanage.rdc.aliyun.com/my/repo)，即可免费创建自己私有的，无容量限制的Helm仓库。

由于通过[阿里云效](https://rdc.aliyun.com/)创建的Helm仓库是私有的，因此在添加仓库时需要通过参数`--username=kHKvnX`和`--password=WsCH7zuHH2`指定用户名和密码：

```
helm repo add play-helm https://repomanage.rdc.aliyun.com/helm_repositories/26125-play-helm --username=kHKvnX --password=WsCH7zuHH2
```

为了更好的Chart发布体验，Helm官方为Chartmusem提供了一个[Helm Push](https://github.com/chartmuseum/helm-push)的插件，[云效](https://rdc.aliyun.com/)Helm仓库服务对该插件进行了完整兼容，因此用户可以直接使用该插件完成chart的发布：

安装Helm Push插件：

```
$ helm plugin install https://github.com/chartmuseum/helm-push
Downloading and installing helm-push v0.7.1 ...
https://github.com/chartmuseum/helm-push/releases/download/v0.7.1/helm-push_0.7.1_darwin_amd64.tar.gz
Installed plugin: push
```

由于已经将Helm仓库添加到了本地，我们可以直接使用以下命令将chart发布到仓库中：

```
$ helm push chart-0.1.0.tgz play-helm 
Pushing chart-0.1.0.tgz to play-helm...
Done.
```

发布完成后重新更新本地仓库索引：

```
$ helm update
...Successfully got an update from the "play-helm" chart repository
...Successfully got an update from the "stable" chart repository
Update Complete. ⎈ Happy Helming!⎈ 
```

搜索play-helm仓库并部署的chart：

```
$ helm search play-helm
NAME            CHART VERSION   APP VERSION     DESCRIPTION              
play-helm/chart 0.1.0           1.0             A Spring Boot Application

$ helm install play-helm/chart
```

## 其它的小技巧

在发布镜像的时候指定版本：

```
$ helm push chart-0.1.0.tgz play-helm --version=0.2.0
Pushing chart-0.2.0.tgz to play-helm...
Done.
```

直接发布chart目录:

```
$ helm push chart play-helm --version=0.3.0
Pushing chart-0.1.0.tgz to play-helm...
Done.
```

在不添加helm仓库的情况下直接发布chart:

```
$ helm push chart https://repomanage.rdc.aliyun.com/helm_repositories/26125-play-helm --username=kHKvnX --password=WsCH7zuHH2
Pushing chart-0.1.0.tgz to https://repomanage.rdc.aliyun.com/helm_repositories/26125-play-helm...
Done.
```

## 小结

到目前为止，我们展示了如何在软件研发的端到端过程中使用Helm，通过基础设施即代码的模式，开发人员可以直接在源码中通过Chart定义管理应用的部署架构，在完成开发工作后开发人员只需要将Chart发布到Helm仓库中，接下来无论是测试，还是运维都可以直接使用Chart快速在Kubernetes集群中对应用进行测试与发布。

下一篇文章中，我们将会介绍如何使用Jenkins构建一条基于容器和Helm的持续交付流水线，同时介绍研发团队中的不同角色如何围绕Helm，围绕持续交付流水线实现一个高效，协作的研发流程。

## 参考资料

* [Github Helm项目](https://github.com/helm/helm)
* [Github Chartmuseum项目](https://github.com/helm/chartmuseum)
* [Github Chartmuseum项目](https://github.com/helm/chartmuseum)
* [Helm Push插件](https://github.com/chartmuseum/helm-push)
* [云效一站式企业协同研发云](https://www.aliyun.com/product/yunxiao?spm=5176.224200.developerService.27.1b776ed6tdwLm5)
* [云效私有仓库服务](https://repomanage.rdc.aliyun.com/my/repo)
