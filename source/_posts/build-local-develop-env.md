title: 快速构建一致的开发环境
date: 2014-10-08 09:58:45
tags: Devops
---


## 一，概述

作为软件开发者，在软件开发过程中我们是否会经常遇到如下几种情况：


* 项目需要各种各样的服务和中间件依赖，我要花大量的时间去安装配置这些东西；
* 每一次项目组有新成员加入了，我花了好多时间用来帮组他搭建一个可以工作的本地开发环境；
* 我的天啊，为什么每次环境配置都会遇到各种各样的奇葩问题；

上面的情况总结下来就是大部分的软件项目往往都需要依赖各种各样的第三方工具和软件，而安装配置这些工具和软件的过程又是极其烦琐耗时且容易出错的。

除此以上的情况之外，作为一个程序员我们的使命告诉我们，我们往往需要工作的不同的项目中。 当你沉浸当前项目愉快的编码中时，突然有领导告诉你，之前的项目出现了几个bug需要你去协助修改一下。Ok，对于万能的程序员当然不在话下，可以当动手时才发现，重新搭建以前的开发环境是一件多么痛苦的事情。 下面一张图展示了一般情况下我们程序员是本地开发环境是如何工作的：

![](https://31.media.tumblr.com/a59d6b34ea69d612fc5ca9fe45054dff/tumblr_inline_nd3sfuyJqW1sosno0.png)

如上图所示，一个程序员的本地开发环因为不同项目设计的不同而同时存在各种类型和版本的第三方软件依赖。 环境依赖导致我们的整个的本地开发环境混乱，并且无法保证我们的本地开发环境能与生成环境保持一致，从而导致各种奇怪的问题。

那么我们理想的本地开发环境应该是什么样子的呢？如下所示

![](https://31.media.tumblr.com/22d2f5b110b56633922c7aba98adc63e/tumblr_inline_nd3shcFCcC1sosno0.png)

我们希望每一个应用程序的本地开发环境能与我们的生产环境保持一致，同时不同项目之间本地开发环境能保证的其相互隔离。在此同时作为软件开发人员我们需要能够非常方便快捷的搭建应用程序所需的本地开发环境。

## 二，除了代码还有可运行的环境

正如之前所说的那样，传统的软件开发实践过程中我们往往更多的关注与编写可运行的代码，而忽略了作为一个可用软件的另外一个重要组成部分：可运行的环境。
这个时候我们重新思考一下我们的源码仓库，在传统的软件开发实践过程中我们通常只包含我们的项目源代码本身。 如下图所示，在这里我们提倡除了代码之外我们还应该包含程序运行环境的描述信息，这个时候软件开发人员应该和运维人员就应该是一起协同工作，在软件人员设计软件架构的同时，运维人员也能一起设计相应的环境架构。

![](https://31.media.tumblr.com/0efe53332677785488b5ea5e4e9edcff/tumblr_inline_nd3sirWB4l1sosno0.png)


当我们的软件仓库中除了代码以外也包含了足够详细的运行环境描述信息时，无论当我们是加入到一个新的项目，或者是因为某些原因你需要修改旧的项目时，我们都能根据这些环境描述信息在本地利用虚拟化技术快速的构建起一个隔离的且一致的开发环境，并且无需担心不同项目之间的环境依赖关系。

## 三，隔离的本地开发环境

我们使用Vagrant构建我们的本地虚拟化开发环境，Vagrant是一个基于Ruby的工具，用于创建和部署虚拟化开发环境。使用Vagrant我们可以非常快捷创建本地虚拟化环境，运行vagrant init ubuntu/trusty64我们将得到一个用以描述虚拟主机基本信息的Vagrantfile文件，文件内容如下所示：

```
# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = “2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.box = "ubuntu/trusty64"

end
```

Vagrantfile文件将会告诉Vagrant在初次启动该虚拟机时，我们将使用ubuntu/trusty64作为基础镜像创建我们的虚拟主机。

在完成初始化操作之后，我们可以使用vagrant up启动虚拟机，在工作完成之后我们可以使用vagrant halt关闭虚拟主机减少不必要的资源浪费。 当我们不再需要该虚拟主机的时候我们可以使用vagrant destroy彻底删除该虚拟主机。

四，一致的本地开发环境

在使用Vagrant完成本地虚拟环境的搭建之后我们需要思考的问题是如何让这个干净的虚拟机能够达到可用的状态。这是我们关注Vagrant的另外一个特性Provision。所谓的Provision是指我们将一台完全干净的主机安装配置成可用状态的一个过程。Vagrant支持在初次启动虚拟主机或者调用vagrant provision命令时使用诸如：Shell, Chef，Puppet以及Ansible等工具自动配置虚拟主机。

这里我们主要结合Ansible这个自动化工具和Vagrant向大家展示如何构建一个一致的本地开发环境。

修改Vagrantfile，添加一下内容，我们将告诉Vagrant在初次创建虚拟机或者使用vagrant provision命令时，我们将根据playbook.yml所定义的内容自动配置虚拟机。

```
# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.box = "ubuntu/trusty64”

  config.vm.provision "ansible" do |ansible|
     ansible.playbook = “playbook.yml"
  end

end
```

在自动化脚本编写方面Ansible选择了根据有可读性的yaml格式描述我们的自动化过程，而不像puppet和chef的自动化脚本具有浓烈的编程语言背景。
同时由于Ansible它本身是基于Python开发的同时所有的自动化过程都是基于SSH实现，所以对Ansible而言，搭建一个可用的自动化管理环境只需要使用pip install ansible即可。

```
---
- hosts: all
  sudo: yes
  remote_user: vagrant
  tasks:
    - name: install tree tools
      shell: echo hello world
```

如上所示，是一个最基本的Ansible自动化脚本的基本内容

* hosts：用于指定playbook定义的内容对哪些主机生效, all表示对所有主机生效
* remote_user：指定远程服务器的用户
* sudo：指定任务时候使用sudo权限执行
* tasks：定义了所有的我们需要在服务器上执行的操作列表，在ansible中所有的tasks都是按照顺序依次执行

通过ansible我们可以将我们的整个运行环境信息用playbook的形式进行加以描述。

在结合使用Vagrant和Ansible之后我们的项目结构如下所示,我们的源码仓库中除了代码以外，Vagrantfile描述了我们所需的服务器环境基本类型，playbook则记录了项目运行环境搭建的自动化过程。

![](https://31.media.tumblr.com/0efe53332677785488b5ea5e4e9edcff/tumblr_inline_nd3sk0Hp641sosno0.png)

更完整的Demo可以查看我的github：https://github.com/yunlzheng/ansible_django_example 这里使用ansible自动构建一个Django的本地开发环境。

## 五，总结

通过结合Ansible和Vagrant我们可以快速构建隔离且具有一致性的本地开发测试环境，帮助程序开发人员能够更加的专注于项目本身。同时如果将话题衍生到持续交付领域，这种软件开发实践方式的变化同样能起到非常重要的作用，这里我们不做更多的讨论。
