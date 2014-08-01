title: Tomcat7 开启CGI，并配置awstats日志监控
date: 2012-10-8 17:42:38
tags: java
---

```
  原文最初写与我的[OSCHINA博客](http://my.oschina.net/fhck/blog/85773)
```

# 搭建环境

Apache Tomcat 7.x
JDK 1.6+
Perl 5.2+
Ubuntu

1，下载[Tomcat](http://www.fayea.com/apache-mirror/tomcat/tomcat-7/v7.0.32/bin/apache-tomcat-7.0.32.tar.gz)并解压到特定目录

2,修改<Tomcat_HOME>\conf\web.xml配置文件，取消cgi servlet和对应的mapping注释

```
<servlet>
 <servlet-name>cgi</servlet-name>
 <servlet-class>org.apache.catalina.servlets.CGIServlet</servlet-class>
 <init-param>
 <param-name>debug</param-name>
 <param-value>0</param-value>
 </init-param>
 <init-param>
 <param-name>cgiPathPrefix</param-name>
 <param-value>WEB-INF/cgi</param-value>
 </init-param>
 <init-param>
 <param-name>passShellEnvironment</param-name>
 <param-value>true</param-value>
 </init-param>
 <load-on-startup>5</load-on-startup>
</servlet>

<servlet-mapping>
 <servlet-name>cgi</servlet-name>
 <url-pattern>/cgi-bin/*</url-pattern>
</servlet-mapping>
```

3，修改<Tomcat_HOME>\conf\context.xml配置文件，在Context上添加privileged属性

```
<Context privileged="true">
<!--其他部分-->
</Context>
```

4，安装Perl，window[点击下载](http://strawberry-perl.googlecode.com/files/strawberry-perl-5.16.1.1-32bit.msi)

5，测试，在<Tomcat_HOME>\webapps\ROOT\WEB-INF\cgi\下创建cgi脚本文件test1.cgi

```
print "Content-type: text/html\n\n";
print "Hello, world!\n"
```

6，启动Tomcat,并访问URL:[http:localhost:8080/cgi-bin/test1.cgi](http:localhost:8080/cgi-bin/test1.cgi)

7,下载awstats日志分析工具,并解压到特定目录

8，在<Tomcat_HOME>/webapps/下创建awstats目录以及相应的WEB-INF目录

9，将<AWSTATS_HOME>/wwwroot/目录下css/,icon/,js/目录拷贝到<Tomcat_HOME>/webapps/awstats/目录下

10,将<AWSTAS_HOME>/wwwroot/cgi-bin/下的所有文件拷贝到<TOMCAT_HOME>/webapps/awstats/WEB-INF/cgi目录下

11，重命名<Tomcat_HOME>/webapps/awstats/cgi/awstats.model.conf 为awstats.localhost.conf


```
#对应日志文件所在位置
LogFile="/home/test/server/apache-tomcat-7.0.29/logs/localhost_access_log.%yyyy-%mm-%dd.txt"
#站点域名
SiteDomain="localhost"
#图标所在目录
DirIcons="../icon"
#国际化所使用的语言，默认为"auto"
Lang="cn"
#国际化文件所在目录
DirLang="./lang"
#在生成页面头部所要加入的HTML
HTMLHeadSection="<div id="header">Head Example</div>"
#在生成页面尾部索要加入的HTML
HTMLEndSection="<div align='right'>@company</div>"
#生成页面所使用的样式表，awstas提供了默认的样式表，可通过该项目自定义awstats样式
StyleSheet="../css/awstats_default.css"
```

12,修改<TOMCAT_HOME>/conf/server.xml

```
<Service name="Catalina">
  <Host name="localhost"  appBase="webapps" unpackWARs="true" autoDeploy="true">
      <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log." suffix=".txt"
               pattern="combined" fileDateFormat="yyyy-MM-dd" resolveHosts="false"/>
</Host>
</Service>
```

13，运行脚本

```
awstats.pl -config=localhost -update
```


14,访问URL查看生成的日志页面：[http://localhost:8080/awstats/cgi-bin/awstats.pl?config=localhoost](http://localhost:8080/awstats/cgi-bin/awstats.pl?config=localhoost)
