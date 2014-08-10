title: 利用Ansible将开发环境纳入版本管理
date: 2014-08-08 08:40:59
tags: Devops
---

## 前言

在Vagrant出现的时候，发现原来使用虚拟机是这么爽得一件事情从**vagrant init**到**vagrant up**的过程是这么美好。于是程序员所有的虚拟机都开始通过Vagrant来进行管理(unless windows)

我所有开发相关服务Mysql, Mongodb, Rabbit都跑在了Vagrant里面。 有一天我的虚拟机挂掉了，完蛋！ 又要重新装一遍这些所有的服务

恩，其实Vagrant通过box的方式来打包虚拟机，我还可以把这些服务器都装好，然后打包再保存这些box。一个人玩挺好的，就是挺占我本就不大的存储空间的，不过也不是什么大问题了。

于是有人尝试将这种方式推广到开发团队中，利用box来统一开发环境。 使用Pycharm甚至可以直接支持Vagrant的远程Python环境。

但是有一天随着越来越多好玩的新的技术，新的服务，新的中间件。 团队的每个成员都重复这一个人将所有依赖配置完成，重新打包box，分发box，团队成员再从新导入box的虚幻中。 box的list也越来越长，，所需要的存储空间也越来越大。

## 如何解决

其实Vagrant已经提供好了解决这些所有问题的支持,在Vagrant的官方资料中是包含了解决这一问题的特性**provisioning**， 所谓的**provisioning**就是指在启动完成一个新的虚拟机之后，我们自动的去安装和配置软件的一个过程。

Vagrant新版本中以及默认支持了譬如：Chef，Puppte以及Ansible和Docker等多种自动化工具。 利用这些自动化工具我们可以将配置开发环境的过程保存为相应的配置描述文件，在Vagrant启动一台新的虚拟机的时候就会自动根据这些配置文件所描述的内容安装和搭建好我们所需的开发测试的服务器环境

引入自动化工具的好处是我们可以将**环境配置信息版本化**，而不必再陷入去管理那些体积庞大的box的额外工作中。

## 利用Ansible实践

开发测试环境需求：Java 1.7， Mysql

### Vagrant初始化虚拟机

```
vagrant init
```

修改Vagrantfile文件，添加Mysql映射端口3306. 并添加**vm.provision**指定使用ansible来进行自动化配置.

Vagrantfile文件内容如下：

```
# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "base"

  config.vm.network "forwarded_port", guest: 3306, host: 3306

  config.vm.provision "ansible" do |ansible|
     ansible.playbook = "ansible/playbook.yml"
  end

end
```

在Vagrantfile中间我们指定了调用ansible/playbook.yml配置文件，在第一次启动vagrant时，
Vagrant会自动更具playbook.yml内容自动安装配置服务器，当配置文件发生变更以后使用**vagrant provision**命令重新加载配置即可

playbook.yml文件内容如下：

```
---
- hosts: all
  sudo: yes
  vars:
    http_port: 80
    max_clients: 200
    database_name: development
    root_db_username: development
    root_db_password: development
  remote_user: vagrant
  tasks:
    - name: update to 163 sources
      copy: src=sources.list dest=/etc/apt/sources.list
    - name: update key
      shell: gpg --keyserver keyserver.ubuntu.com --recv 3E5C1192
    - name: update key
      shell: gpg --export --armor 3E5C1192 | sudo apt-key add -
    - name: install python software properties
      apt: name=python-software-properties state=present
    - name: add oracle jdk repo
      apt_repository: repo="ppa:webupd8team/java"
    - name: update apt-get local cache
      shell: apt-get update
    - name : Select java license
      shell: echo oracle-java7-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections
    - name: ensure software is the lastest version
      apt: name={{item}} state=latest
      with_items:
      - mysql-server-5.5
      - python-mysqldb
      - oracle-jdk7-installer
      - maven
      - git
    - name: ensure and upload my.cnf
      copy: src=my.cnf dest=/etc/mysql/my.cnf
      notify:
        - restart mysql
    - name: Ensure MySQL is running
      service: name=mysql state=started enabled=true
      notify:
        - restart mysql
    - name: Update MySQL Root Password
      mysql_user: host=% name={{root_db_username}} password={{root_db_password}} priv=*.*:ALL state=present
    - name: Create local development database
      mysql_db: name={{database_name}} state=present
  handlers:
    - name: restart mysql
      service: name=mysql state=restarted
```

上述的playbook.xml文件描述的基本内容包括：

* 更新软件源为网易163源（这里直接在本地创建了一个sources.list文件并使用copy模块上传到服务器）
* 添加和配置appkey
* 添加oracle-jdk的repository
* 调用apt-get update 更新软件包索引
* 利用ansible的apt模块安装oracle-java7-installer, mysql-server-5.5,python-mysqldb,maven,git等相关软件
* 利用ansible的copy讲本地的mysql配置文件my.conf,上传到服务器的指定位置(mysql监听的地址0.0.0.0在该配置文件设置)
* 利用ansible的service模块启动mysql服务，并且设置为开机启动
* 利用ansible的mysql_user模块添加mysql用户，并设置远程授权
* 利用ansible的mysql_db模块创建数据库

通过以上的过程，我们就可以在**vagrant up**的同时自动化的搭建好我们的开发测试环境。

Java党蛋疼的问题在于集成开发环境如IDAD不支持直接使用远程的JDK环境。所以只能做到统一部分开发环境和测试环境

但是对于Python程序员而言由于如Pycharm直接支持使用vagrant的远程python环境，所以完全能做到统一所有的开发和测试环境。而主机只是作为编辑代码的存在。什么时候能有python项目来做呢？想想还很激动呢~
