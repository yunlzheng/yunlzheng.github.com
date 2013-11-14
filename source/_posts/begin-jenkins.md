title: begin-jenkins
date: 2012-07-02 00:30:09
tags: 持续集成
---

# Jenkins安装与配置

## 安装jenkins

地址http://mirrors.jenkins-ci.org/war/选择合适的Jenkins版本下载

将下载的jenkins.war包直接放到tomcat下，启动tomcat即可安装完成



图表 1 Jenkins初始化界面

# 配置Jenkins

## 插件安装

在jenkins界面中选择“系统管理——插件管理”进入jenkins插件管理界面。代码仓库我们机可能需要使用SVN也可能使用git作为代码仓库，这里安装git plugin

安装完成插件后我们还需要去jenkins进行全局配置：“系统管理——系统设置”

### Git配置



