title:  大话OpenStack之Trouble shot
date: 2015-01-02 01:52:03
tags: openstack
---

这篇文章主要记录一下在使用和配置OpenStack时遇到的那些问题

<!--more-->

## 基本环境信息

* Ubuntu Server 14.04
* OpenStack Iceouse

## Trouble shot

### 服务明明运行，OpenStack却告诉你找不到服务

别看了，如果你确认你的安装基本上没有问题。 并且服务是正常运行的，那么恭喜你。 快去检查一下你的主机之间的时间是否同步吧。

### 使用ssh或scp时，网络节点挂掉

关于这个问题，让我头痛了很久。因为在使用OpenStack虚拟机的时候，一旦准备往虚拟机上scp拷贝文件，网络节点就直接挂掉了，并且一直找不到任务原因。
主要是服务器挂掉以后连显示器都打不开，唯有直接重启服务器。 直到我直接在机房眼巴巴看着网络节点的现实器才看到类似于下面的kernel出错信息。

```
Start Of syslog Trace ============================+
ig-file=/etc/neutron/dhcp_agent.ini >/dev/null 2>&1; fi)
May  8 18:00:01 ts036945 CRON[3449]: (neutron) CMD (if [ -x /usr/bin/neutron-netns-cleanup ] ; then /usr/bin/neutron-netns-cleanup --config-file=/etc/neutron/neutron.conf --config-file=/etc/neutron/l3_agent.ini >/dev/null 2>&1; fi)
May  8 18:02:07 ts036945 kernel: [55501.391556] ------------[ cut here ]------------
May  8 18:02:07 ts036945 kernel: [55501.391643] kernel BUG at /build/buildd/linux-3.13.0/net/core/skbuff.c:2903!
May  8 18:02:07 ts036945 kernel: [55501.391755] invalid opcode: 0000 [#1] SMP
May  8 18:02:07 ts036945 kernel: [55501.391828] Modules linked in: xt_nat xt_conntrack xt_REDIRECT xt_tcpudp ip6table_filter ip6_tables iptable_filter iptable_nat nf_conntrack_ipv4 nf_defrag_ipv4 nf_nat_ipv4 nf_nat nf_conntrack ip_tables x_tables openvswitch gre vxlan ip_tunnel libcrc32c radeon ttm drm_kms_helper drm gpio_ich serio_raw lpc_ich hpwdt i2c_algo_bit coretemp kvm_intel kvm hpilo i5000_edac edac_core i5k_amb ipmi_si shpchp mac_hid lp parport hpsa hid_generic usbhid hid bnx2 cciss
May  8 18:02:07 ts036945 kernel: [55501.393060] CPU: 3 PID: 0 Comm: swapper/3 Not tainted 3.13.0-24-generic #47-Ubuntu
May  8 18:02:07 ts036945 kernel: [55501.393175] Hardware name: HP ProLiant DL360 G5, BIOS P58 08/03/2008
May  8 18:02:07 ts036945 kernel: [55501.393277] task: ffff8802245cc7d0 ti: ffff8802245d4000 task.ti: ffff8802245d4000
May  8 18:02:07 ts036945 kernel: [55501.393389] RIP: 0010:[<ffffffff8160e9ba>]  [<ffffffff8160e9ba>] skb_segment+0x95a/0x980
May  8 18:02:07 ts036945 kernel: [55501.393531] RSP: 0018:ffff88022fac34f8  EFLAGS: 00010206
May  8 18:02:07 ts036945 kernel: [55501.393618] RAX: 0000000000000000 RBX: ffff880221bdaa00 RCX: ffff8800cae7b4f0
May  8 18:02:07 ts036945 kernel: [55501.393715] RDX: 0000000000000050 RSI: ffff8800cae7b400 RDI: ffff8800cae7ae00
May  8 18:02:07 ts036945 kernel: [55501.393814] RBP: ffff88022fac35c0 R08: 0000000000000042 R09: 0000000000000000
May  8 18:02 ...
```

这个问题，按照找到的资料的解释是Ubuntu自身的BUG. 修复方式如下:

```
ethtool -K eth3 gro off
ethtool -K eth3 gso off
```

这里的eth3是指网络节点的外部网络网卡

## 启动metadata-service

按照OpenStack安装文档部署完成OpenStack之后，会发现创建虚拟机时user-data无法使用。
跟踪虚拟机启动日志我们会发现，在虚拟机内部无法访问http://169.254.169.254

修复办法：

编辑dhcp_agent.ini文件修改如下配置

```
# The DHCP server can assist with providing metadata support on isolated
# networks. Setting this value to True will cause the DHCP server to append
# specific host routes to the DHCP request. The metadata service will only
# be activated when the subnet does not contain any router port. The guest
# instance must be configured to request host routes via DHCP (Option 121).
enable_isolated_metadata = True

# Allows for serving metadata requests coming from a dedicated metadata
# access network whose cidr is 169.254.169.254/16 (or larger prefix), and
# is connected to a Neutron router from which the VMs send metadata
# request. In this case DHCP Option 121 will not be injected in VMs, as
# they will be able to reach 169.254.169.254 through a router.
# This option requires enable_isolated_metadata = True
enable_metadata_network = True
```
