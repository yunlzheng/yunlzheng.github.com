title: Tmux Linux会话管理神器
date: 2013-10-8 17:06:45
tags: tools
---

 今天突然觉得每天背着自己的笔记本去公司上班是件活受罪不讨好的事情，于是还是决定在公司的Windows机器上重新弄一套开发环境，关于会话管理的东西之前有听领导介绍但却一直没有机会尝试一下，刚好今天又闲着没什么事情做，就尝试了一下Tmux

 <!-- more -->

## 初体验

 “高端大气上档次,低调奢华有内涵”，估计只有这话能形容一下使用的感受。会话管理那套东西就不多少说了，大家都懂。 给我感觉最牛B的还是它的多面板控制

![](http://media.tumblr.com/a134acdee31402e4d91b147397e6ae21/tumblr_inline_mucqivJE881sosno0.png)



## 安装

* 环境Ubuntu 12.04

```bash
sudo apt-get install tmux
```

## 需要知道的概念

* server    服务器。输入tmux命令时就开启了一个服务器。
* session   会话。一个服务器可以包含多个会话。
* window    窗口。一个会话可以包含多个窗口。
* pane  面板。一个窗口可以包含多个面板。

## 一些实用常用的命令

### 基本命令

* 开启一个新的会话

```bash
tmux
```

* 显示当前系统的所有会话

```bash
tmux ls
```

![](http://media.tumblr.com/ac9589bb921c65c0af88aae420012470/tumblr_inline_mucr4n5eWw1sosno0.png)


* 重新链接到特定会话

```bash
tmux attach -t <会话编号>
```

![](http://media.tumblr.com/f3cfb99e5105aa5398a6f1f518d3072d/tumblr_inline_mucrc8Yakl1sosno0.png)

### 控制台命令

进入tmux后使用 ctrl+b 进入tmux控制台

#### 系统操作

* ？ 列出所有快捷键；按q返回
* d 脱离当前会话；这样可以暂时返回Shell界面，输入tmux attach能够重新进入之前的会话
* ctrl+z 挂起当前会话
* : 进入命令行模式；此时可以输入支持的命令，例如kill-server可以关闭服务器

#### 面板操作

* % 将当前面板平分为左右两块

![](http://media.tumblr.com/b71f6d2f90c2a40b8d05cc1ca52e2f2d/tumblr_inline_mucrhc05gU1sosno0.png)

* “ 将当前面板平分为上下两块

![](http://media.tumblr.com/c527cce15b93d562f501b34574ac5765/tumblr_inline_mucre7xHJb1sosno0.png)

* x 关闭当前面板

![](http://media.tumblr.com/1d0eb920858a50863f2551b7adbdf859/tumblr_inline_mucribO2iM1sosno0.png)

* ctrl+方向键 以1个单元格为单位移动边缘以调整当前面板大小
* o 在当前窗口中选择下一面板
* 方向键 移动光标以选择面板
* { / } 向前/后置换当前面板

## 更多的东西还需要你自己去试试！
