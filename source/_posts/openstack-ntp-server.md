title: OpenStack之ntp服务
date: 2015-01-02 01:51:49
tags: openstack
---

明明是OpenStack为什么要讲NTP服务呢？ OpenStack作为一个具有良好的横向扩展管理平台，其组件之间高度依赖于时间。 所以假如你的节点直接的时间不同步，我只能呵呵二字奉上。 这里我们来聊聊NTP服务，以及它的基本配置方式。

<!--more-->

## 基本环境

在大部分OpenStack的安装配置说明中，我们都需要在主控节点上安装NTP服务，而其他节点与主控节点之间保持一致

```
#/etc/hosts
controller  192.168.0.11
network     192.168.0.21
compute01   192.168.0.31
block01     192.168.0.41
```

安装NTP服务

```
sudo apt-get install ntp
```
## NTP Server配置

在OpenStack的安装配置过程中，我们使用Controller节点作为NTP Server

### 权限管理

```
# /etc/ntp.conf
restrict -4 default kod notrap nomodify
restrict -6 default kod notrap nomodify
```

重启NTP服务

```
sudo service ntp restart
```

## NTP Client配置

其余节点均作为Client与Controller节点时间保持同步,移除其他所有server配置

```
# /etc/ntp.conf
server controller iburst
```

## NTP小结

NTP虽小，但是对于OpenStack的正常运行起到了非常重要的作用
