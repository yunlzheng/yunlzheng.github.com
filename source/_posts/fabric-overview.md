title: Fabric Overview
date: 2014-07-31 15:31:27
tags: devops
---

Fabric是一个基于SSH的Python命令行工具


## Hello Fabric

```
pip install fabric
```

__Code__

```
def hello(name="world"):
    run('echo "hello,world"')
```

__Execute__

    fab hello:Jeff`

或者

    fab hello:name=Jeff

## Fabric能做什么？

* 系统和服务器管理
* 应用部署

## Fabric的优势

* 角色定义
* 代码易读
* 封装了本地、远程操作
* 参数灵活
* 完整的日志输出

## 演示时间

从[github](https://github.com/yunlzheng/chat)上拉去源码并部署到服务器


    from __future__ import with_statement
    from fabric.api import *
    from fabric.colors import *
    from fabric.contrib.console import confirm

    def installs():
        with cd("/home"):
            run("sudo apt-get install git")
            run("sudo apt-get install redis-server")
            run("sudo apt-get install python-pip")
            run("sudo apt-get install build-essential")


    def commit():
        local("git add -p && git commit")


    def push():
        local("git push")


    def prepare_deploy():
        commit()
        push()

    @settings(warn_only=True)
    def deploy():
        code_dir = '/home/vagrant/git/chat'
            if run("test -d %s" % code_dir).failed:
            run("git clone https://github.com/yunlzheng/chat.git %s" % code_dir)

        with cd(code_dir):
            run("git pull")
            run("sudo pip install -r requirements.txt")
            run("sudo killall -9 python")
            run("nohup python server.py &")

## 基本用法

    fab -l             -- 显示可用的task（命令）
    fab -H             -- 指定host，支持多host逗号分开
    fab -R             -- 指定role，支持多个
    fab -P             -- 并发数，默认是串行
    fab -w             -- warn_only，默认是碰到异常直接abort退出
    fab -f             -- 指定入口文件

## 主要API

    * cd                --进入远程服务器特定目录
    * lcd               --进入本地服务器特定目录
    * run               --在远程运行command
    * sudo              --以root身份运行command
    * local             --在本地运行command
    * get               --获取远程文件
    * put               --上传文件到远程`
