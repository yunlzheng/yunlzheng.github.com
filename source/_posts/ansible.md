title: Ansible初体验
date: 2014-08-05 09:33:59
tags:
---

![](https://31.media.tumblr.com/64f6098a62f4bf3c88417b06f5e0b961/tumblr_inline_n9yq5400QL1sosno0.png)

## 简单开始

Ansible自动化所需要的一切就是在控制机上安装一个python的package.就和Fabric一样简单

<!-- more -->

## 安装Ansible

For python user

```
pip install ansible
```

For mac user

```
brew install ansible
```

## SSH远程登录授权

在这里我们使用Vagrant模拟一个远程服务器 **vagrant init** 创建一个vagrant实例

```
ssh-copy-id -i ~/.ssh/id_rsa.pub vagrant@127.0.0.1:2222
```

> for mac user need install ssh-copy-id tools first "brew install ssh-copy-id"


## ansible Ad-hot

Ad-hot简单来说就是利用ansible来执行一些简单的零时的服务器远程操作。

example1 初识:

```
echo "127.0.0.1:2222" | tee hosts
ansible all -m ping -i hosts -u vagrant
```

<!-- more -->


上面的命令首先在当前目录创建了一个hosts文件，然后调用ansible的ping模块来对hosts文件中定义的服务器调用ping操作

console output:

```
127.0.0.1 | success >> {
    "changed": false,
    "ping": "pong"
}
```

* all: 指定该命令对hosts中的所有主机生效
* -i hosts: 指定hosts配置文件，默认使用/etc/ansible/hosts
* -u vagrant: 指定远程用户vagrant
* -m ping: 指定ansible模块ping

example2 运行echo语句:

```
ansible all -a 'echo hello' -i hosts -u vagrant
```

* -a: 模块参数，当未使用-m 指定模块时，默认模块为command

example3 使用ansible copy模块远程拷贝文件:

```
ansible all -m copy -a "src=hosts dest=~/hosts" -i hosts -u vagrant
```

## ansible-doc 查看模块信息

> ansible的百科全书

显示ansible所有可用模块

```
ansible-doc -l
```

查看特定模块的相关信息


```
ansible-doc ping
```

![](https://31.media.tumblr.com/545c9ccfd0486332ea0958683392c108/tumblr_inline_n9yq5hTERc1sosno0.png)

## ansible-playbook 剧本

> 做自己的导演

hosts

```
[webserver]
127.0.0.1:2222
```

示例：playbook.xml

```
---
- hosts: webserver
  sudo: yes
  remote_user: vagrant
  vars:
    http_port: 80
    max_clients: 200
  tasks:
    - name: ensure apache is at the latest version
      apt: name=apache2 state=latest
    - name: write the apache config file
      template: src=apache2.conf dest=/etc/apache2/apache2.conf
      notify:
        - restart apache
    - name: ensure apache is running
      service: name=apache2 state=started
  handlers:
    - name: restart apache
      service: name=apache2 state=restarted
```

执行shell:

```
ansible-playbook playbook.yml -i hosts
```

### Hosts & Users

在playbook中使用hosts和remote_user指定**全局**主机和远程服务器的用户

```
---
- hosts: webserver
  remote_user: vagrant
```

使用sudo指定任务是否使用sudo权限执行

```
---
- hosts: webserver
  remote_user: vagrant
  sudo: yes
```

我们也可以给每一个tasks单独指定remote_user和sudo，如下：

```
- name: ensure apache is at the latest version
  apt: name=apache2 state=latest
  remote_user: vagrant
  sudo: yes
```

### Tasks

在playbook的描述文件中会包含一个tasks的列表，这些就是我们实际需要在服务器上所做的操作，
在ansible中这些任务都是按照顺序依次执行，如果其中的一个任务发生了异常或者错误，ansible将会自动退出，并显示错误信息

在playbook中我们可以使用**ignore_errors**忽略单个task的发生的错误

```
- name: ensure apache is at the latest version ignore the errors
  apt: name=apache2 state=latest
  ignore_errors: True
```

在ansible中我们可以使用shell模块直接执行shell语句，所以熟悉shell的同学可以直接利用shell完成所有的task如：

```
- name: execute shell by ansible
  shell: echo "hello world" | tee ~/test.txt
```

但是ansible还提供了很多有用的模块，例如apt, yum, mysql, openstack等

ansible模块列表：[http://docs.ansible.com/list_of_all_modules.html](http://docs.ansible.com/list_of_all_modules.html)

### Handlers

一般来说当我们更新了服务器的配置文件，都需要对相应的服务器进行重启或者做一些其他的关联操作。这个时候就会使用到handlers。

简单来说handlers就是ansible中定义好的一组事件，默认并不会执行。 只有当task中使用了notify触发了相应事件，在所有task执行完成后
相应的handler才会执行。

```
handlers:
  - name: restart apache
    service: name=apache2 state=restarted
```

我们可能在多个task中都使用了notify，但是handler只会执行一次

```
- name: write the apache config file
  template: src=apache2.conf dest=/etc/apache2/apache2.conf
  notify:
    - restart apache
```

Demo源码：[https://github.com/yunlzheng/ansible-examples/tree/master/webserver](https://github.com/yunlzheng/ansible-examples/tree/master/webserver)
