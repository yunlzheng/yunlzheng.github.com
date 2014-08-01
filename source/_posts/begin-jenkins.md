title: Jenkins安装与配置
date: 2012-07-02 17:42:00
tags: jenkins
---

Jenkins安装与配置

安装jenkins

地址http://mirrors.jenkins-ci.org/war/选择合适的Jenkins版本下载

将下载的jenkins.war包直接放到tomcat下，启动tomcat即可安装完成


![](http://static.oschina.net/uploads/space/2012/0702/174713_juh7_553747.jpg)
图表 1 Jenkins初始化界面

配置Jenkins

插件安装

在jenkins界面中选择“系统管理——插件管理”进入jenkins插件管理界面。代码仓库我们机可能需要使用SVN也可能使用git作为代码仓库，这里安装git plugin

安装完成插件后我们还需要去jenkins进行全局配置：“系统管理——系统设置”

Git配置

![](http://static.oschina.net/uploads/space/2012/0702/174728_BPlJ_553747.jpg)

图表 2 Git配置

Name我们采用默认设置即可

Path to Git executable是执行git的程序路径，根据git安装目录即可，这里注意目录分隔符使用”/”

Maven配置


![](http://static.oschina.net/uploads/space/2012/0702/174739_UNw4_553747.jpg)
图表 3 Maven配置

Name：自己随便取一个名字即可

MAVEN_HOME：就是你本机Maven的安装路径，根据实际情况配置即可

全局MAVEN_OPTS：设置Maven运行时参数

Local Maven Repository：Maven的本地仓库默认即可

新建Job

在安装插件以及配置好Jenkins参数后即可新建Job测试配置效果，由于暂时未安装git服务器所以就直接使用github做测试，这里提供一个maven的java-web项目作为例子地址：https://github.com/yunlzheng/Hello-World

点击”新Job”


![](http://static.oschina.net/uploads/space/2012/0702/174759_DTik_553747.jpg)
图表 4 新建Job 步骤1

任务名字根据实际情况输入即可，这里我输入的是”TestJob”，选择构建一个maven2/3项目单击OK即可进入Job的详细配置页面


![](http://static.oschina.net/uploads/space/2012/0702/174810_87jE_553747.jpg)
源码管理

即配置编译时的源码仓库

![](http://static.oschina.net/uploads/space/2012/0702/174838_nfXw_553747.jpg)

这里我们选择Git作为源码管理，在Repository URL中输入对应的git仓库地址即可https://github.com/yunlzheng/Hello-World.git

构建触发器
Jenkins支持基于事件的构建代码机制，如按照时间周期构建，也可选择当检测到代码仓库发生变化时进行构建

![](http://static.oschina.net/uploads/space/2012/0702/174854_XFJ9_553747.jpg)

这里作为测试默认选择即可。

Pre Steps

即构建前需要执行的工作这里不需要配置

Build

由于测试时建立的是Maven2/3项目所以这里需要告诉Jenkins服务器构建maven项目所需的pom.xml文件所在的位置即项目项目根路径位置,根据项目实际情况设置即可

![](http://static.oschina.net/uploads/space/2012/0702/174902_3qp1_553747.jpg)

现在单击保存即可。保存后页面将跳转到Job页面点击立即构建即可

![](http://static.oschina.net/uploads/space/2012/0702/174910_IBDC_553747.jpg)

图表 5 Jenkins构建控制台输出
