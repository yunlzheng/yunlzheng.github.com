title: 大话OpenStack之创建Windows镜像
date: 2015-01-02 00:42:54
tags: openstack
---

关于OpenStack的镜像创建官方已经提供了非常详细的说明，这里主要是记录一下如何使用KVM创建Windows系列镜像的基本过程；本文以创建Window7为例，其他版本类似，不同之处会在案例中进行说明；

<!-- more -->

## 准备基础环境

* 系统环境：ubuntu 14.04
* window7版本iso源文件；
* virtio驱动程序virtio-win-0.1-94.iso（下载地址：http://alt.fedoraproject.org/pub/alt/virtio-win/latest/）；

## 安装相关软件包

```
apt-get install vncviewer kvm qemu-kvm
```

注意：由于使用到KVM需要打开主机的Intel VT-x/EPT支持，否则无法使用kvm模块

## 创建windows7镜像

这里默认建立具有20G存储空间的镜像,在实际使用中假如没有提供Cinder存储服务，虚拟机的磁盘空间往往不能满足使用需求

```
qemu-img create -f qcow windows7.qcow2 20G
```

使用kvm创建虚拟机

```
kvm -m 2048 -no-reboot -boot order=d -drive file=windows7.qcow2,if=virtio,boot=off -drive file=windows7.iso,media=cdrom,boot=on -drive file=virtio-win-0.1-94.iso,media=cdrom,boot=off -net nic,model=virtio -nographic -vnc :1
```

ubuntu examples:

```
kvm -m 1024 -cdrom ubuntu-14.04.1-desktop-amd64.iso -drive file=ubuntu-14.04-desktop-amd64.qcow2 -boot d -nographic -vnc :2
# restart
kvm -m 1024 -drive file=ubuntu-14.04-desktop-amd64.qcow2 -boot d -nographic -vnc :2
```

之后可以通过vnc客户端连接到虚拟机

```
vncviewer # localhost:1
```

进入之后实际上就和我们安装操作系统的流程一致，安装windows7操作系统即可。

* 安装中的第一个问题就是提示找不到任何磁盘安装操作系统，这里就是virtio发挥作用的地方之一

![](http://filehost.qiniudn.com/openstack-images-windows-001.png)

点击加载驱动程序，确认

![](http://filehost.qiniudn.com/openstack-images-windows-002.png)

按理来说应该是选择WIN7目录下的AMD64,不过似乎window2008和这个兼容也没出什么问题。

这里实际上需要根据你当前的操作系统类型和架构进行选择即可

![](http://filehost.qiniudn.com/openstack-windows-windows-004.png)

加载完成驱动之后，就可以开始继续我们的windows操作系统的安装

![](http://filehost.qiniudn.com/penstack-images-windows-005.png)
![](http://filehost.qiniudn.com/openstack-images-window-007.png)

## 安装网卡驱动程序

当完成系统安装之后，你会惊喜的发现windows系统找不到本地网络驱动设备，也就是说这个镜像依然无法在opensatck中正常使用。

这是virtio发挥作用的第二个地方，安装网卡驱动。 你只需要进入windows的设备管理器，你会发现网卡设备上的一个黄色感叹号，点击安装驱动程序即可。

当然驱动程序你可以在CDROM下面找到自己相应版本的操作系统驱动程序即可。 这里就不截图了（mei de jie）。

## 开放windows部分防火墙

由于OpenStack使用到安装组（Securiyu Group进行安装管理），所以对于windows的操作系统镜像需要至少打开TCP3389和ICMP。

## 完成

接下来你就可以使用glance的cli命令上传镜像到OpenStack并且进行测试了。

```
glance image-create --name "windows7-x86_64" --disk-format qcow2 --container-format bare --is-public True --progress < windows7.qcow2
```

对于不同类型版本的windows操作系统，只需要选择相应的驱动程序即可。 Enjoy Your OpenStack;
