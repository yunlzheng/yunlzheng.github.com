title: 上网的正确姿势
date: 2016-05-20 12:14:11
tags: [Others]
---

最近苦于云梯的各种不稳定，在经历了几天无法正常上网的情况下，还是决定在digitalocean部署一个Shadowsocks的服务实例。

大致过程很简单：

在Digitalocean创建一台Ubuntu的实例：

![](http://7pn5d3.com1.z0.glb.clouddn.com/digitalocean.png)

安装毕竟启动shadowsocks即可

```
apt-get install python-pip
pip install shadowsocks
```

添加配置文件/etc/shadowsocks.json

```
{
    "server":"my_server_ip",
    "server_port":8388,
    "local_port":1080,
    "password":"barfoo!",
    "timeout":600,
    "method":"table",
    "auth": true
}
```

启动服务或停止服务

```
ssserver -c /etc/shadowsocks.json -d start
# or
ssserver -c /etc/shadowsocks.json -d stop
```

完成服务器启动之后，本机安装一个[ShadowsocksX客户端即可](https://shadowsocks.org/en/download/clients.html)

![](http://7pn5d3.com1.z0.glb.clouddn.com/local_config.png)

这里配置你的服务器IP地址，端口，以及密码即可。

完成后ShadowsocksX默认在本地的1080端口建立代理服务，这个时候你就可以使用诸如chrome的SwitchySharp在浏览器中通过代理上网

![](http://7pn5d3.com1.z0.glb.clouddn.com/SwitchySharp_config.png)

另外通过在SwitchySharp配置切换规则我们可以自动完成对不同域名网站的访问方式切换。

另外可以使用Github的[https://github.com/gfwlist/gfwlist](https://github.com/gfwlist/gfwlist)项目，该相互维护了一个官方的已被屏蔽的网站列表。

添加Online Rule List可以避免大部分的手动规则设置

![](http://7pn5d3.com1.z0.glb.clouddn.com/SwitchySharp_config2.png)

大致如此。

### 科学上网

> 另外关于DigitalOcean的计费模式

另外关于DigitalOcean的计费模式的计费是按时计费，按照你开通的VPS使用时间来计费，当你删除VPS液滴后将会停止计费（关机还会照样计费）

所以在科学上网的同时，我们还要进行一些简单的计划经济手段，方式很简单，无外乎通过自动化的手段去创建一个Shadowsocs的实例，按需创建/销毁即可.

这里给一个例子，基于digitalocean api可以通过python创建和销毁实例。这里用fabric包装了一下，大致两个命令：

```
fab create_droplet:token=<your digitalOcean token> # 创建droplet并且安装运行shadowsocks
fab destroy_all:token=<your digitalOcean token> # 销毁所有的，所有的实例
```

实例代码：

```
import digitalocean
from fabric.api import *

env.use_ssh_config = True
env.user = 'root'

@task
def create_droplet(token, name="shadowsocks-instance", image="ubuntu-14-04-x64", region="nyc3"):

    droplet = digitalocean.Droplet(
        token=token,
        name=name,
        region=region, # New York 2
        image=image, # Ubuntu 14.04 x64
        size_slug='512mb',  # 512MB
        backups=False,
        ssh_keys=list_sshkeys(token))
    droplet.create()

    status = ""
    while status != "completed":
        actions = droplet.get_actions()
        for action in actions:
            action.load()
            # Once it shows complete, droplet is up and running
            status = action.status
            print ">>>{0}".format(action.status)

    droplet.load()
    ip_address = droplet.ip_address
    print "start provision shadowsocks instance in: {0}".format(ip_address)
    execute(provision_shadownsocks, ip_address=ip_address, hosts=[ip_address])

@task
def provision_shadownsocks(ip_address):
    run("echo start provision")
    run("apt-get update")
    run("apt-get install -y python-pip")
    run("pip install shadowsocks")
    put("shadowsocks.json", "/etc/shadowsocks.json")
    run("ssserver -c /etc/shadowsocks.json -d start")

@task
def destroy_all(token):
    for droplet in list_droplets(token):
        droplet.destroy()

def list_sshkeys(token):
    manager = digitalocean.Manager(token=token)
    return [ssh_key.id for ssh_key in manager.get_all_sshkeys()]

def list_droplets(token):
    manager = digitalocean.Manager(token=token)
    my_droplets = manager.get_all_droplets()
    return my_droplets

```

备注：如果要在本机运行这个代码需要将ssh的StrictHostKeyChecking禁用掉:


```
#~/.ssh/config
StrictHostKeyChecking no
```

另外shadowsocks.json是从本地上传，需要的代码相同的路径创建shadowsocks.json文件,例如

```
{
  "server":"0.0.0.0",
  "server_port":8388,
  "local_port":1080,
  "password":"barfoo!",
  "timeout":600,
  "method":"table",
  "auth": true
}
```
