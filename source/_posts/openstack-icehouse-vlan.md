title: OpenStack之Neutron Vlan
date: 2015-01-31 00:00:34
tags: openstack
---

如下图所示在基于Neutron的Vlan网络模式下，需要对交换机（L3）进行相应的配置, 一般可划分为3个基本网络：管理网络，用于Openstack内部API调用管理; 虚拟机网络，用于虚拟机之间的通讯；外部网络，用于连接外部网络，作为虚拟机的浮动IP来源；

由于Vlan模式下，租户建立的网络都具有独立的Vlan标签，故需要利用交换机将虚机网络设置为trunk模式,如允许通过vlan tag 为800~2000网络，保证虚拟机之间能够正常通讯；

<!-- more -->

![](http://filehost.qiniudn.com/openstack-icehouse-vlan.png)


## Vlan模式主要配置内容

* 修改控制节点配置信息

```
# vim /etc/neutron/plugins/ml2/ml2_conf.ini
[ml2]
type_drivers = vlan

[ml2_type_vlan]
network_vlan_ranges = physnet1:800:2000

[ovs]
tenant_network_type = vlan
bridge_mappings = physnet1:br-em2
```

重启neutron-server服务

```
service neutron-server restart
```

* 网络节点和计算节点

添加网桥用于虚拟机之间的通讯

```
ovs-vsctl add-br br-em2
ovs-vsctl add-port br-em2 em2
```

```
# vim /etc/neutron/plugins/ml2/ml2_conf.ini
type_drivers = vlan

[ml2_type_vlan]
network_vlan_ranges = physnet1:800:2000

[ovs]
tenant_network_type = vlan
bridge_mappings = physnet1:br-em2
```

重启openvswitch agent服务

```
service neutron-plugin-openvswitch-agent restart
```

* 网络节点创建外部网络网桥

```
ovs-vsctl add-br br-ext
ovs-vsctl add-port br-ext em3
```

```
# vim /etc/neutron/l3_agent.ini
external_network_bridge = br-ext
```

重启L3网络服务

```
service neutron-l3-agent restart
```

## 其他问题

对于Neutron而言该项目提供了多种网络模式诸如: gre, vlan, xvlan等。 在最初采用gre网络模式的部署方案对于大部分业务场景都无异常，但是对于某些特定协议如VNC，windows的RDP远程桌面对虚拟机进行使用时，会导致远程桌面黑屏无法使用的问题，具体原因可能是和gre本身性能，或者是内部过滤器相关，但无定论； 在采用vlan模式部署后该问题消失
