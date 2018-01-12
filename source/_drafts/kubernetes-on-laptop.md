本地运行Kubernetes
=========

最近的在针对550名[Cloud Native Computing Foundation](https://www.cncf.io/blog/2017/12/06/cloud-native-technologies-scaling-production-applications/)成员的调查证实，[Kubernetes](https://kubernetes.io/)是他们首选的容器编排管理平台。调查同时也表明，AWS云平台依然是在云中部署Kubernetes集群的首选。
[kubernetes-aws.io](http://kubernetes-aws.io/)中列举了那些可以让你轻松在AWS上创建Kubernetes集群的各种方法。

而在开发阶段，你可能也需要在本地运行Kubernetes集群，以便你可以在本地启动和调试你的应用程序。一旦在本地中应用可以满足要求，那就可以在AWS的集群中部署相同的应用。

这边文章会介绍两种在Mac OSX机器上本地运行Kubernetes的方式，包括常用的[Minikube](https://github.com/kubernetes/minikube)以及[Docker for Mac](https://www.docker.com/docker-mac)中新引入的Kubernetes支持。在Minikube和Docker网站上找到其它平台的支持资料。

那我们开始吧！

## 安装kubectl

Kubectl是Kubernetes集群的命令行工具。首先我们需要在本地安装kubectl:

```
brew install kubernetes-cli
```

如果本地已经安装了kubectl，可以通过以下命令进行更新：

```
brew upgrade kubernetes-cli
```

查看版本信息

```
$ kubectl version --client --short=true
Client Version: v1.8.5
```

默认情况下,kubectl version命令会打印出client以及server端的版本信息。通过--client可以确保只输出客户端的版本信息。--short选项允许只输出版本号。

当Kubectl安装完成后，接下来我们来看看在本地运行kubernetes集群的两种可选方式。

## 使用Minikube安装Kubernetes集群

Minikube会在本地虚拟机中运行一个单节点的kubernetes集群，为用户提供一个本地的开发和测试环境。

minikube使用VirtualBox创建虚拟机。如果你本地还没有安装virtualbox,可以通过下面命令安装：

```
brew cask install virtualbox
```

安装minikube

```
brew cask install minikube
```

如果本地已经安装了minikube，那你可以通过以下命令更新它：

```
brew cask reinstall minikube
```

检查minikube版本

```
~ $ minikube version
minikube version: v0.24.1
```

启动minikube：

```
~ $ minikube start
Starting local Kubernetes v1.8.0 cluster...
Starting VM...
Downloading Minikube ISO
140.01 MB / 140.01 MB [============================================] 100.00% 0s
Getting VM IP address...
Moving files into cluster...
Downloading localkube binary
148.25 MB / 148.25 MB [============================================] 100.00% 0s
0 B / 65 B [----------------------------------------------------------] 0.00%
65 B / 65 B [======================================================] 100.00% 0sSetting up certs...
Connecting to cluster...
Setting up kubeconfig...
Starting cluster components...
Kubectl is now configured to use the cluster.
Loading cached images from config file.
```


这个命令中会首先会下载ISO文件，并且创建虚拟机，之后自动配置Kubernetes组件同时启动一个单节点的集群。默认情况下，集群配置以及认证信息会保存到~/.kube/config文件中。不同集群的上下文可以通过以下命令查看：

```
~ $ kubectl config get-contexts
CURRENT  NAME       CLUSTER     AUTHINFO NAMESPACE
*        minikube   minikube    minikube
```

可以看到，我们目前只创建了一个Kubernetes集群。如果创建了多个集群，该命令回返回集群的列表。

在第一行中的*表示当前我们正在使用的集群上下文，所有的kubectl命令行操作都会定向到该集群。例如，你可以查看集群中的节点信息：

```
~ $ kubectl get nodes
NAME     STATUS ROLES   AGE   VERSION
minikube Ready  <none>  1m    v1.8.0
```

通过kubectl version命令可以查看客户顿以及服务端的版本：

```
~ $ kubectl version --short=true
Client Version: v1.8.5
Server Version: v1.8.0
```

所有常用的kubectl命令都可以在该集群中使用。

## 使用Dokcer for Mac创建Kubernetes集群

Docker for Mac/Docker for Windows为开发者提供了一个很好的起点来使用Docker。用户可以下载Stage或者Edge版本。Stable包含了所有已经完整测试和验证的功能，并且附带罪行的Docker GA版本。而在Edge版本中，通常提供了最新的测试和功能。其中17.12.0-ce-rc2-mac41作为Docker CE Edge版本[private beta](https://beta.docker.com/)的部分提供了对于本地运行单节点kubernetes集群的支持。

这意味着，你可以直接使用Docker for Mac去创建镜像，启动Kubernetes集群，以及部署Pods,而不需要其它任何的第三方工具，比如minikube。当写这边文章的时候，这个特性只在Docker for Mac中支持，Docker for Windows还在计划当中。（在Docker Enterprise Edition版本中已经支持Kubernetes）

我们来看看如何使用Docker for Mac搭建本地的Kubernetes集群。

为了获取Kubernetes支持的Docker for Mac版本，你需要登录到[Docker Beta program](https://beta.docker.com/)提交审核。一旦通过审核你就会收到下载Edge版本的Docker for Mac的链接地址。 请确保About Docker显示其当前版本为12.12.0-ce-rc2-mac31或更新。在Preferences对话框包含新的便签页来支持你配置Kubernetes集群。

选择Enable Kubernetes,点击Apply & Restart 来启动单节点的Kubernetes集群。

![https://d2908q01vomqb2.cloudfront.net/ca3512f4dfa95a03169c5a670a4c91a19b3077b4/2017/12/15/docker-kubernetes1.jpg](https://d2908q01vomqb2.cloudfront.net/ca3512f4dfa95a03169c5a670a4c91a19b3077b4/2017/12/15/docker-kubernetes1.jpg)

几分钟之后，状态栏的状态将会更新，并且显示Kubernetes正在运行当中。

![https://d2908q01vomqb2.cloudfront.net/ca3512f4dfa95a03169c5a670a4c91a19b3077b4/2017/12/15/docker-kubernetes2.jpg](https://d2908q01vomqb2.cloudfront.net/ca3512f4dfa95a03169c5a670a4c91a19b3077b4/2017/12/15/docker-kubernetes2.jpg)

这个操作也会在~/.kube/config配置文件中保存集群信息。使用kubectl命令可以显示行管的信息

```
~ $ kubectl config get-contexts
CURRENT  NAME               CLUSTER                    AUTHINFO            NAMESPACE
*        minikube           minikube                   minikube
         docker-for-desktop docker-for-desktop-cluster docker-for-desktop
```

使用kubectl可以切换集群上下文：

```
~ $ kubectl config use-context docker-for-desktop
Switched to context "docker-for-desktop".
~ $ kubectl config get-contexts 
CURRENT NAME               CLUSTER                     AUTHINFO NAMESPACE 
*       docker-for-desktop docker-for-desktop-cluster  docker-for-desktop 
        minikube           minikube                    minikube 
~ $ kubectl get nodes 
NAME               STATUS  ROLES    AGE   VERSION 
docker-for-desktop Ready   master   23h   v1.8.2
```

现在使用docker verion命令会显示当前环境的编排引擎为Kubernetes

```
        $ docker version
        Client:
        Version: 17.12.0-rc1-kube_beta
        API version: 1.35
        Go version: go1.9.2
        Git commit: a36c9215a7f8d5da5231d2cca353375bcb27efe3
        Built: Thu Dec 7 17:33:49 2017
        OS/Arch: darwin/amd64
        Orchestrator: kubernetes
        
        Server:
        Engine:
        Version: 17.12.0-ce-rc2
        API version: 1.35 (minimum version 1.12)
        Go version: go1.9.2
        Git commit: f9cde63
        Built: Tue Dec 12 06:45:30 2017
        OS/Arch: linux/amd64
        Experimental: true
```

请注意，这里显示的编排引擎为kubernetes,而不是默认的swarm。

你现在只使用了一个工具就即拥有了最新的Kubernetes又拥有最新的Docker运行时。

让我们使用kuberctl version命令查看一下当前的客户端以及服务器端版本

```
~ $ kubectl version --short=true
Client Version: v1.8.2
Server Version: v1.8.0
```

同样，所有kubectl命令也可以在这个集群中使用。

除了使用kubectl命令以外，你也可以使用通过部署Docker Compose应用栈来创建Kubernetes应用。

一旦你可以通过本地的kubernetes集群开发和测试你的应用程序，我们的[Kubernetes workshop](https://github.com/aws-samples/aws-workshop-for-kubernetes)还可以指导你如何在AWS上完成Kubernetes集群的创建以及应用程序的部署。

## 参考资料

* https://www.cncf.io/blog/2017/12/06/cloud-native-technologies-scaling-production-applications/
* http://kubernetes-aws.io/
* https://github.com/kubernetes/minikube
* https://www.docker.com/docker-mac
* https://beta.docker.com/