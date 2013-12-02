title: Vargant一个属于程序员的虚拟机
date: 2013-11-26 12:30:29
tags:
---


Vargant一个属于程序猿的虚拟机。


![](/vagrant/vagrant.png)

“这段程序明明在我的机器上运行的好好的，怎么到这就没法运行的”，

“我这儿都能运行，肯定是你机器的问题”。

在软件开发过程中往往由于开发环境不一致导致各种各样奇怪的问题，而是用Vagrant就可以很好的解决这种问题
Vagrant是用Ruby开发的，对虚拟机操作进行封装和简化，从而可以很方便的创建用于开发的虚拟机环境，Vagrant中的虚拟机都可以使用一个名叫BOX的东西来进行分发，下面主要记录一些Vagrant的基本使用方式和方法

## 安装Vargant

[下载地址](http://hc-vagrant-files.s3.amazonaws.com/packages/a40522f5fabccb9ddabad03d836e120ff5d14093/Vagrant_1.3.5.msi)

## 初始化工作目录

```

cd WORKSPACE

```

```

vagrant init

```

![](/vagrant/03.png)

完成初始化后将在工作目录创建Vagrantfile文件

## BOXES

* 添加BOX **vargant box add**


```
vagrant box add precise32  http://files.vagrantup.com/precise32.box
```

![](/vagrant/04.png)

* 使用BOX
 
查看Vagrant文件如下，Vagrant默认使用名为base的BOX

```
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
    
    config.vm.box = "base"

end
```

修改**config.vm.box**,让vagrant使用新添加的BOX

```
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
    
    config.vm.box = "precise32"

end
```

## 启动和SSH登录

* 启动Vargant

```
vagrant up
```

![](vagrant/05.png)

* SSH登录Vagrant虚拟机

```
vargant ssh
```

windows下直接使用cmd会报错如下

![](/vagrant/06.png)

如果windows本机安装了git客户端，可以在git-bash中使用**vagrant ssh**,也可以使用Putty等SSH客户端,链接地址如下

```
Host: 127.0.0.1
Port: 2222
Username: vagrant
```

* 文件同步

默认情况下虚拟机 /vagrant目录下则自动同步了当前工作区下的所有内容

## 自动化部署

vagrant内置对自动化部署的支持，使用该特性可以在**vagrant up**时自动安装所需要的软件

* 安装软件

在**WORKSPACE**目录下新建**bootstrap.sh**文件

```
#/usr/bin/env bash

apt-get update
apt-get install vim

```

修改**WORKSPACE/Vagrantfile**文件

```
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
    
    config.vm.box = "precise32"
    config.vm.provision :shell, :path => "bootstrap.sh"

end
```

该配置让Vagrant知道在虚拟机启动时，运行**bootstrap.sh**文件
文件路径**$WORKSPACE**目录的相对路径

## 网络

* 端口转发

使用该特性， 可以将虚拟机的端口映射到主机的特定端口上。 


使用该特性需要修改**WORKSPACE/Vagrantfile**文件

```
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
    
    config.vm.box = "precise32"
    config.vm.provision :shell, :path => "bootstrap.sh"
    config.vm.network :forwarded_port, guest: 80, host: 8080

end
```

修改文件后重新启动**Vagrant** 重新启动虚拟机

![](/vagrant/07.png)

如图所示对本机8080端口的请求都将转发到虚拟机的80端口


