title: OpenStack之体系设计
date: 2015-01-02 01:52:26
tags: openstack
---

OpenStack作为一个最广泛使用的开源云计算管理平台，除了它本是开源的，由开源社区驱动，它本身的架构设计也是非常开放的。 这里我们来聊一下关于OpenStack的软件架构设计

<!--more-->

## 开放的设计

![](http://filehost.qiniudn.com/openstack_logic_arch.png)

如上图所示，OpenStack包含了大量的组件以及服务，除去这些组件和服务我们会发现OpenStack几乎所有组件之间通讯以及内部逻辑都高度依赖于消息服务。

基于消息的架构设计使得OpenStack具有更好的开放性和扩展性，实施时可根据企业环境的具体情况进行安装和配置，同时也方便后期通过增加硬件的方式提高OpenStack的能力。

抛开上图的逻辑部分，我们可以发现openstack所有的服务基本可以分为以下3大类：

* 基于WSGI的Web服务，用于提供相应API接口与服务（如nova-api,cinder-api等）;
* 守护进程，用于处理API请求同时与数据库以及消息服务器器交换信息，以及资源生命周期管理（如nova-compute,cinder-volume等）；
* 基于消息服务的业务逻辑处理；

OpenStack围绕“计算，存储以及网络”3大服务展开，分别提供nova,cinder和swift以及neutron4个项目提供相应的基础服务。同时使用glance提供基础的镜像管理，keystone提供3A以及service catalog服务。

OpenStack目前主要服务以及项目代号和说明

|服务|项目代号|说明|
|----|----|----|
|Dashbord| Horizon | 提供基于Web的管理控制台和管理界面|
|Compute| Nova | 提供计算实例的生命周期管理，同时包含祖如资源调度（nova-scheduler）的服务保证硬件资源使用的均衡 |
|Network|Neutron| 提供网络及服务，容许用户定义自己的私有网络，定义基本网络结构等 |
||Storage||
|Block Storage|Cinder|为虚拟机实例提供永久存储服务，可以基于多种Backend实现存储服务，诸如:iscis|
|Object Storage|Swift|提供类似于AWS S3的对象存储服务|
||Shared Service||
|Identity Service|Keystone|为OpenStack提供核心的3A服务，以及服务Endpoint列表|
|Image Service|Glance|存储和管理OpenStack的基础镜像，提供镜像存储服务，Nova依赖于该服务|
|Telemetry| Ceilometer | 提供资源使用的监控，计量,统计以及计费服务 |
|Orchestration| Heat|类似于AWS的CloudFormation服务，提供通过模板的方式定义和创建OpenStack资源管理服务|
|Database Service|Trove|数据库既服务|

## 开放的接口

OpenStack为开发者提供了开放的API，可以方便企业用户按自己的业务需求对OpenStack进行二次开发，目前基于OpenStack的公有云服务包括如国外的RackSpace,以及诸如国内的联通沃云，以及华为云皆是基于OpenStack的云服务供应商。
