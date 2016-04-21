title: Consul In Practice 1 [概述]
date: 2016-04-21 10:57:01
tags: [consul]
---

## Background Info

项目基本信息：

* MicroServices架构基于Spring Cloud框架实现；
* 除了系统自身的4个核心服务外，还包含其他的第三方服务如Mysql, Mongo以及其它开源软件等
* 当前系统部署方式基于Docker完成系统核心服务以及第三方服务的部署，配合使用Docker Compose以及Ansible完成应用的自动化部署
* 包含3个基本的环境Dev环境，UAT环境，Prod环境

## Consul In Practice

### 1, As Service Discovery

使用开发模式我们可以快速验证Consul提供的相关能力

```
consul agent -dev -config-dir /etc/consul.d
```

Consul中我们非常方便的创建和定义服务，例如通过在/etc/consul.d/中创建文件sonarqube.json

```
{
  "service": {
    "name": "sonarqube",
    "tags": ["dev"],
    "port": 9000
  }
}
```

完成服务定义之后：

```
consul reload
```

可以重新加载服务配置文件，从Consul UI中我们可以查看到我们的服务实例

![](http://7pn5d3.com1.z0.glb.clouddn.com/consul-ui.png)

完成服务注册之后我们便可以通过Consul提供的API去查询服务实例

例如我们可以通过**HTTP API**查询到sonarqube服务实例的相关信息：

```
curl http://localhost:8500/v1/catalog/service/web
```

返回值:

```
[
  {
    "Node":"agent-two",
    "Address":"xxx.xxx.xxx",
    "ServiceID":"web",
    "ServiceName":"web",
    "ServiceTags":["dev"],
    "ServiceAddress":"",
    "ServicePort":9900,
    "ServiceEnableTagOverride":false,
    "CreateIndex":515,
    "ModifyIndex":516
  }
]
```

除此之外Consul还提供了内置的DNS服务，DNS服务的默认访问端口为8600，通过DNS服务我们可以通过域名'[serviceName].service.consul'的方式直接访问我们的服务实例:

```
dig @127.0.0.1 -p 8600 sonarqube.service.consul
```

返回值:

```
; <<>> DiG 9.9.4-RedHat-9.9.4-29.el7_2.1 <<>> @127.0.0.1 -p 8600 sonarqube.service.consul
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 21563
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0
;; WARNING: recursion requested but not available

;; QUESTION SECTION:
;sonarqube.service.consul.	IN	A

;; ANSWER SECTION:
sonarqube.service.consul. 0	IN	A	10.174.231.41

;; Query time: 0 msec
;; SERVER: 127.0.0.1#8600(127.0.0.1)
;; WHEN: Thu Apr 21 12:23:26 CST 2016
;; MSG SIZE  rcvd: 82
```

或者结合使用服务的tag标签[tagName].[serviceName].service.consul的方式访问服务实例：

```
dig @127.0.0.1 -p 8600 dev.sonarqube.service.consul
```

返回值:

```
; <<>> DiG 9.9.4-RedHat-9.9.4-29.el7_2.1 <<>> @127.0.0.1 -p 8600 dev.sonarqube.service.consul
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 17333
;; flags: qr aa rd; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 0
;; WARNING: recursion requested but not available

;; QUESTION SECTION:
;dev.sonarqube.service.consul. IN	A

;; AUTHORITY SECTION:
consul.			0	IN	SOA	ns.consul. postmaster.consul. 1461212746 3600 600 86400 0

;; Query time: 0 msec
;; SERVER: 127.0.0.1#8600(127.0.0.1)
;; WHEN: Thu Apr 21 12:25:46 CST 2016
;; MSG SIZE  rcvd: 119
```

你还可以通过在启动consul是使用--domain参数设定域名规则

### 2, As Service Monitor

同时当应用以服务为单位向外部暴露接口之后，需要对各个服务的状态进行监控，Consul同样可以非常方便的让我们能够对服务状态进行监控.

同样以sonarqube为例子，通过check属性我们可以自定义所需要的监控方式。

```
{
  "service": {
    "name": "sonarqube",
    "tags": ["server"],
    "port": 9000,
    "check": {"script": "curl localhost:9000 >/dev/null 2>&1", "interval": "10s"}
  }
}
```

除了通过script脚本的形式进行服务的健康检查，Consule还支持一下方式：

HTTP状态检查:

```
{
  "check": {
    "id": "api",
    "name": "HTTP API on port 5000",
    "http": "http://localhost:5000/health",
    "interval": "10s",
    "timeout": "1s"
  }
}
```

TCP状态检查：

```
{
  "check": {
    "id": "ssh",
    "name": "SSH TCP on port 22",
    "tcp": "localhost:22",
    "interval": "10s",
    "timeout": "1s"
  }
}
```

TTL检查:
```
{
  "check": {
    "id": "web-app",
    "name": "Web App Status",
    "notes": "Web app does a curl internally every 10 seconds",
    "ttl": "30s"
  }
}
```

Docker容器监控：

```
{
"check": {
    "id": "mem-util",
    "name": "Memory utilization",
    "docker_container_id": "f972c95ebf0e",
    "shell": "/bin/bash",
    "script": "/usr/local/bin/check_mem.py",
    "interval": "10s"
  }
}
```

### 3, Key/Vale Store

Consul支持开放的K/V存储，你可以用在动态配置，特性开关，调度， 集群等等任何你需要使用的地方，同时Consul提供的HTTP API可以让你非常易于使用

> 本篇不详细说明该特性，后续会详细讨论在集中式配置管理中的应用

### 4, As DataCenters

在实际软件交付过程中我们会涉及到另外一个问题，多环境的管理，以当前自己所在的项目为例，在交付过程中会涉及到3个基本的环境Dev, UAT以及Prod环境。各个环境独立部署了所有的服务，Cosul的多数据中心能力可以很好的对多个环境进行统一的管理和监控；

![](http://7pn5d3.com1.z0.glb.clouddn.com/multi-data-center.png)

以下我们假设以Dev和UAT两个DataCenter为例

* DEV DataCenter:

在Node1上启动Consul Server

```
consul agent -server  -bootstrap-expect 1  -data-dir /tmp/consul -node=agent-one -config-dir /etc/consul.d -bind 192.168.0.2  -client 0.0.0.0 -ui -dc=dev
```

在Node2上启动Consul Agent

```
consul agent -data-dir /tmp/consul -node=agent-two -config-dir /etc/consul.d -bind=192.168.0.3 -dc=dev
```

加入到Consul Server


```
consul join 192.168.0.2
```

此时在Node1或者Node2上检查当前集群信息

```
consul members
#response
agent-one  192.168.0.2:8301  alive   server  0.6.4  2         dev
agent-two  192.168.0.3:8301  alive   client  0.6.4  2         dev
```

* UAT DataCenter:

在Node3上启动Consul Server

```
consul agent -server  -bootstrap-expect 1  -data-dir /tmp/consul -node=agent-three -config-dir /etc/consul.d -bind 192.168.2.2 -dc=uat
```

* 关联Dev和UAT DataCenter

在Node1上：

```
consul members -wan
# response:
agent-one  192.168.0.2:8301  alive   server  0.6.4  2         dev
```

 通过命令

 ```
consul join -wan 192.168.2.2
 ```

通过Consul UI集中式管理多个环境的信息

![/images/consul-multi-center-web-ui.png](http://7pn5d3.com1.z0.glb.clouddn.com/consul-multi-center-web-ui.png)

## Summary

这篇主要目的是用于介绍一下Consul的基本特性

在后续还会继续考虑：

* 使用Consul替换Spring Cloud作为服务发现和注册平台；
* 与Docker集成完成服务的自动发现和注册；
* 基于Consul的KV特性完成系统的中兴化配置管理

未完待续......
