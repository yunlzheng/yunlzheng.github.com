title: Windows环境下如何在本地IDEA中联调Kubernetes集群中的服务
date: 2019-12-14 09:18:35
tags: [Kubernetes, IDEA, Windows]
---

## 本文适用于

* 使用Windows的Java开发者
* IDEA作为主要开发IDE
* Kubernetes作为开发测试环境
* 开发的应用包含多个服务，且存在相互调用关系

## 通过本文希望解决的问题

* 本地联调环境搭建复杂

既然已经有现成的在Kubernetes中的测试环境，为什么还要费劲在本地搭建一套副本？

* 本地开发，本地联调

想使用Kubernetes中的测试环境，那就得至少做一次代码编译，镜像构建然后再部署到集群中

## 快速开始

> 前提条件，本地已安装kubectl并且能够正常与Kubernetes集群交互

### 使用KT Connect启动本地到Kubernetes集群的SOCKS5代理服务

从[下载](https://alibaba.github.io/kt-connect/#/zh-cn/downloads)最新版本的KT Connect Cli工具到本地，解压并拷贝ktctl命令行工具到系统PATH路径下。

验证安装结果

```
ktctl --version
KT Connect version 0.0.8
```

进入到Java项目根路径，并启动ktctl

```
cd $PROJECT_ROOT
$ sudo ktctl -d connect --method socks5
...省略其它输出...
4:31PM INF ==============================================================
4:31PM INF Start SOCKS5 Proxy: export http_proxy=socks5://127.0.0.1:2223
4:31PM INF ==============================================================
4:31PM DBG Child, os.Args = [ktctl -d connect --method socks5]
4:31PM DBG Child, cmd.Args = [ssh -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null -i /Users/yunlong/.kt_id_rsa -D 2223 root@127.0.0.1 -p2222 sh loop.sh]
Handling connection for 2222
Warning: Permanently added '[127.0.0.1]:2222' (ECDSA) to the list of known hosts.
4:31PM DBG vpn(ssh) start at pid: 56190
4:31PM DBG KT proxy start successful
```

使用ktctl可以快速在本地启动一个基于SOCKS5协议的代理服务，通过该代理服务可以直接访问集群内资源。 
在CMD中验证网络连通性，新建一个CMD窗口，并根据ktctl中的日志输出设置http_proxy，对于Windows用户需要使用`set`命令

```
set http_proxy=socks5://127.0.0.1:2223
# 尝试访问CLUSTER IP和POD IP
curl http://<ClusterIP>:<Port>
```

### 在IDEA中与Kubernetes集群中的程序联调

对于Java程序来说如果希望所有网络请求能够通过SOCKS5代理完成，需要在启动程序时设置JVM参数`-DsocksProxyHost`和`-DsocksProxyPort`指定代理的IP和端口。当然手动配置是肯定不能接受的，首先ktctl启动的代理端口是动态的，其次并不是每次在IDEA中启动程序都需要使用代理。

如何解决？ktctl在socks5模式下，会自动在当前路径下生成.jvmrc文件。 该文件中会包含SOCKS5代理的相关JVM参数。在$PROJECT_ROOT下查看.jvmrc文件内容如下：

```
-DsocksProxyHost=127.0.0.1
-DsocksProxyPort=2223
```

为了能够让IDEA在启动时自动使用该文件作为Java启动参数，我们需要在IDEA中安装插件[JVM Inject](https://plugins.jetbrains.com/plugin/13482-jvm-inject), 用户可以在IDEA的Plugin管理中搜索并安装该插件。

![/images/install_jvm_inject_idea_plugin.png](/images/install_jvm_inject_idea_plugin.png)

在IDEA中启动Java程序时，该插件会自动加载当前项目根路径下的.jvmrc并追加到Java的启动参数中。

![/images/idea_run_application.png](/images/idea_run_application.png)

```
java ...省略的其他输出... -Djava.rmi.server.hostname=127.0.0.1 -Dspring.liveBeansView.mbeanDomain -Dspring.application.admin.enabled=true -Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=2223 ...其它输出...
```

从而可以在Java程序中直接访问集群资源（ClusterIP和PodIP)。当ktctl退出时，会自动删除.jvmrc。 通过JVM Inject配合KT Connect开发者可以在IDEA按需决定是否直接访问Kubernetes集群。

## 参考资料

* KT Connect: [https://alibaba.github.io/kt-connect](https://alibaba.github.io/kt-connect/#/zh-cn/guide/how-to-use-in-idea)
* JVM Inject: [https://plugins.jetbrains.com/plugin/13482-jvm-inject](https://plugins.jetbrains.com/plugin/13482-jvm-inject)