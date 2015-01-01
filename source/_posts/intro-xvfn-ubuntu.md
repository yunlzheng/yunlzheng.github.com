title: 如何在Vagrant/Docker中运行Firefox
date: 2014-10-19 22:47:10
tags: devops
---

在诸如Linxu的服务器版本，Vagrant,Docker并不包含物理的显示设备。
某些特定的程序诸如浏览器firefox,chrome，在linux下运行都需要依赖于显示设备。最明显的需求就包括运行基于浏览器的单元测试。那么该如何解决这些问题？

<!-- more -->

```
vagrant@vagrant-ubuntu-trusty-64:~$ firefox

(process:2450): GLib-CRITICAL **: g_slice_set_config: assertion 'sys_page_size == 0' failed
Error: no display specified
```

如果尝试在服务器版本Linux或者Vagrant中运行Firefox我们将会得到诸如以上的输出**Error: no display specified**.

如何解决？xvfb(virtual framebuffer X server)，xvfb 这个工具相当于一个wrapper，给应用程序提供模拟的 X server。



## 安装Xvfb

```
apt-get install xvfb
# apt-get install firefox
```

## 启动Xvfb

```
Xvfb :88 -screen 0 1366x768x24 -ac
```

该命令会创建一个运行在：88且屏幕分辨率为1366x768x24的screen0。

运行firefox时指定DISPLAY为:88

```
export DISPLAY=:88
firefox

# or run your application(firefox, seleuim)
```

或者

```
DISPLAY=:88 firefox &
```
