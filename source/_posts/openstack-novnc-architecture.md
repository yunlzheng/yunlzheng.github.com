title: OpenStack Console 设计
date: 2015-02-1 00:00:34
tags: openstack
---

对于使用过OpenStack的用户，我们第一次操作虚拟机都可能是直接通过OpenStack Dashbord管理控制台提供的Web vnc来进行使用。

如图所示，我们可以很方便的使用该功能，对虚拟机进行管理和配置；

<!-- more -->

![](http://filehost.qiniudn.com/dashbord_console.png)

## OpenStack虚拟化

对于OpenStack而言，OpenStack并不直接提供虚拟化技术实现，而是直接使用现虚拟化技术如QEMU，KVM，XenServer等。

对于KVM和QEMU我们可以通过如下命令在操作系统上运行一台虚拟机。

以在Linux上直接使用kvm创建windows虚拟机为例

定义虚拟机Disk

```
qemu-img create -f qcow windows7.qcow2 20G
```

使用kvm导入ISO镜像，并且安装操作系统

```
kvm -m 2048 -no-reboot -boot order=d -drive file=windows7.qcow2,if=virtio,boot=off -drive file=windows7.iso,media=cdrom,boot=on -drive file=virtio-win-0.1-94.iso,media=cdrom,boot=off -net nic,model=virtio -nographic -vnc :1
```

此时我们指定了虚拟机的模式为-nographic 并且指定了vnc端口，这个时我们就可以通过localhost:1访问到该虚拟机

而对OpenStack而言，OpenStak更多是作为上层的管理者负责管理和控制地城的虚拟化技术

当我们使用nova命令创建一台虚拟机之后

```
nova list

+--------------------------------------+---------------------+--------+------------+-------------+---------------------------------------------+
| ID                                   | Name                | Status | Task State | Power State | Networks                                    |
+--------------------------------------+---------------------+--------+------------+-------------+---------------------------------------------+
| c75adb4f-c554-4fa2-962e-35fef3367041 | centos-test         | ACTIVE | -          | Running     | internal-network=192.168.0.50, 10.74.149.23 |
+--------------------------------------+---------------------+--------+------------+-------------+---------------------------------------------+

```

```
nova show c75adb4f-c554-4fa2-962e-35fef3367041

+--------------------------------------+-------------------------------------------------------------+
| Property                             | Value                                                       |
+--------------------------------------+-------------------------------------------------------------+
| OS-DCF:diskConfig                    | AUTO                                                        |
| OS-EXT-AZ:availability_zone          | hp-server                                                   |
| OS-EXT-SRV-ATTR:host                 | compute02                                                   |
| OS-EXT-SRV-ATTR:hypervisor_hostname  | compute02                                                   |
| OS-EXT-SRV-ATTR:instance_name        | instance-00000044                                           |
| OS-EXT-STS:power_state               | 1                                                           |
| OS-EXT-STS:task_state                | -                                                           |
| OS-EXT-STS:vm_state                  | active                                                      |
| OS-SRV-USG:launched_at               | 2015-02-06T06:03:24.000000                                  |
| OS-SRV-USG:terminated_at             | -                                                           |
| accessIPv4                           |                                                             |
| accessIPv6                           |                                                             |
| config_drive                         |                                                             |
| created                              | 2015-02-06T06:02:37Z                                        |
| flavor                               | m1.small (2)                                                |
| hostId                               | dddad0cc7fcd1cad5eeb87ea7bad2a9f31d690d8955d73b998e2ba5c    |
| id                                   | c75adb4f-c554-4fa2-962e-35fef3367041                        |
| image                                | centOS_6.5_x86_64_en (d923120e-5a1f-417f-b627-36320215f8be) |
| internal-network network             | 192.168.0.50, 10.74.149.23                                  |
| key_name                             | -                                                           |
| metadata                             | {}                                                          |
  | name                                 | centos-test                                                 |
  | os-extended-volumes:volumes_attached | []                                                          |
  | progress                             | 0                                                           |
  | security_groups                      | default                                                     |
  | status                               | ACTIVE                                                      |
  | tenant_id                            | 52941cb7e81644c1a32fb087b83d83b6                            |
  | updated                              | 2015-02-06T06:02:40Z                                        |
  | user_id                              | 33aef1cf867d48468fc295ac46296953                            |
  +--------------------------------------+-------------------------------------------------------------+
```

同样OpenStack调用了libvirt接口利用底层虚拟化技术Provider创建了一台虚拟设备，我们可以在计算节点上查看qemu进程，如下所示，只是参数比起我们自己使用qemu会相对负责许多，因为涉及到诸如网络信息的配置等

```
# ps -ef|grep qemu
libvirt+  2711     1  6 14:01 ?        00:01:02 /usr/bin/qemu-system-x86_64 -name instance-00000043 -S -machine pc-i440fx-trusty,accel=kvm,usb=off -cpu Nehalem,+rdtscp,+dca,+pdcm,+xtpr,+tm2,+est,+vmx,+ds_cpl,+monitor,+dtes64,+pbe,+tm,+ht,+ss,+acpi,+ds,+vme -m 512 -realtime mlock=off -smp 1,sockets=1,cores=1,threads=1 -uuid e6759873-7e62-4341-9a35-39a10d65fb12 -smbios type=1,manufacturer=OpenStack Foundation,product=OpenStack Nova,version=2014.1.3,serial=35383339-3134-434e-4731-323353345756,uuid=e6759873-7e62-4341-9a35-39a10d65fb12 -no-user-config -nodefaults -chardev socket,id=charmonitor,path=/var/lib/libvirt/qemu/instance-00000043.monitor,server,nowait -mon chardev=charmonitor,id=monitor,mode=control -rtc base=utc,driftfix=slew -global kvm-pit.lost_tick_policy=discard -no-hpet -no-shutdown -boot strict=on -device piix3-usb-uhci,id=usb,bus=pci.0,addr=0x1.0x2 -drive file=/var/lib/nova/instances/e6759873-7e62-4341-9a35-39a10d65fb12/disk,if=none,id=drive-virtio-disk0,format=qcow2,cache=none -device virtio-blk-pci,scsi=off,bus=pci.0,addr=0x4,drive=drive-virtio-disk0,id=virtio-disk0,bootindex=1 -netdev tap,fd=25,id=hostnet0,vhost=on,vhostfd=26 -device virtio-net-pci,netdev=hostnet0,id=net0,mac=fa:16:3e:59:90:96,bus=pci.0,addr=0x3 -chardev file,id=charserial0,path=/var/lib/nova/instances/e6759873-7e62-4341-9a35-39a10d65fb12/console.log -device isa-serial,chardev=charserial0,id=serial0 -chardev pty,id=charserial1 -device isa-serial,chardev=charserial1,id=serial1 -device usb-tablet,id=input0 -vnc 0.0.0.0:1 -k en-us -device cirrus-vga,id=video0,bus=pci.0,addr=0x2 -device virtio-balloon-pci,id=balloon0,bus=pci.0,addr=0x5
```

虚拟机的文件保存在/var/lib/nova/instances目录中。


![](http://filehost.qiniudn.com/vnc_viewer.png)



![](http://filehost.qiniudn.com/connect_to_vm.png)

## Nova Console实现

基于Libvirt对虚拟化技术的管控基础上，Nova项目提供了如下主要功能：

* API：提供外部访问Http访问接口
* Compute Core：负责对虚拟化资源的生命周期管理
* Networking for VMS：负责虚拟机的网络访问控制等及Nova-Network模式，适合小型的企业私有云，更多的场景还是考虑使用Neutron
* Image management (EC2 scenario)：与Glance组件通讯负责镜像管理
* Command-line clients and other interfaces： 提供命令行管理接口
* Console interface：提供VNC以及NoVNC功能，方便管理和使用OpenStack虚拟机
