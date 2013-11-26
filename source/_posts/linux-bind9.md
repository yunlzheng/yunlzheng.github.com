title: Ubuntu Bind9泛域名解析配置
date: 2013-03-26 01:06:34
tags:
---

# Bind9简介


BIND (Berkeley Internet Name Domain)是Domain Name System (DNS) 协议的一个实现，提供了DNS主要功能的开放实现，包括

域名服务器 (named)
DNS解析库函数
DNS服务器运行调试所用的工具
是一款开放源码的DNS服务器软件，由美国加州大学Berkeley分校开发和维护的，

按照ISC的调查报告，BIND是世界上使用最多最广泛的域名服务系统。不论你的邮件服务器，WEB服务器或者其他的services如何的安全可靠，DNS的故障会给你带来用户根本无法访问这些服务。

BIND，也是我们常说的named，由于多数网络应用程序使用其功能，所以在很多BIND的弱点及时被发现。主要分为三个版本：

## v4

1998年多数UNIX捆绑的是BIND4，已经被多数厂商抛弃了，除了OpenBSD还在使用。OpenBSD核心人为BIND8过于复杂和不安全，所以继续使用BIND4。这样一来BIND8/9的很多优点都不包括在v4中。

## v8

就是如今使用最多最广的版本。

## v9

最新版本的BIND，全部重新写过，免费（但是由商业公司资助），也添加了许多新的功能（但是安全上也可能有更多的问题）。BIND9在2000年十月份推出，现在稳定版本是9.3.2。


-----------------------------------------废话的分割线-----------------------------------------------

-----------------------------------------主题的开始-------------------------------------------------

# 安装bind9

```
sudo apt-get install bind9 bind9-doc dnsutils
```

bind9将默认安装在/etc/bind/目录下

## rndc授权


修改/etc/bind/named.conf.options,在未授权的情况下，将会出现

错误信息：rndc: connect failed: 127.0.0.1#953: connection


```
sudo vim /etc/bind/named.conf.options
```

添加文件内容与/etc/bind/rndc.key相同
例如rnfc.key的文件内容为：

```
key "rndc-key" {
        algorithm hmac-md5;
        secret "vfmD0+yvxhgW0wa8FQ54EQ==";
};
```

则在named.conf.options 中添加一下内容

```
key "rndc-key" {
        algorithm hmac-md5;
        secret "vfmD0+yvxhgW0wa8FQ54EQ==";
};

controls {
        inet 127.0.0.1 port 953
                allow { 127.0.0.1; } keys { "rndc-key"; };
};
```

到此为止Bind9的基本安装配置就算完成了。
接下来是如何配置域名解析的问题

## 添加本地区域文件

创建文件 /etc/bind/zones.zheng

```
zone "zheng.dev"  { type master; file "/etc/bind/db.zheng.dev"; };
```

这里master表示DNS为主服务器
file则是只想该域的具体配置文件

创建文件/etc/bind/db.zheng.dev

添加一下内容

```
$TTL    86400
@   IN  SOA localhost. root.localhost. (
                  1     ; Serial
             604800     ; Refresh
              86400     ; Retry
            2419200     ; Expire
              86400 )   ; Negative Cache TTL
;
@   IN  NS  localhost.
*.zheng.dev.    IN A    192.168.146.129
```

注意这里的 域名后缀也必须是与本地域配置文件中定义的zone相同。 *.zheng.dev. 表示匹配所有的以zheng.dev结尾的访问请求，这些请求都将会转发到192.168.146.129这台服务器。

## 重启bind9 

```
sudo /etc/init.d/bind9 restart
```

这样一个最基本的基于bind9的泛域名配置即可完成

-----------------------------------------再次废话的分割线---------------------------------------------

感觉已经好久没写博客了。不负责任的讲是工作太多没时间，自己偷懒

马上就到毕业设计了，毕业设计没完，老是觉得有道坎。老是有种只有毕业设计搞完，自己才可以毫无负担的凭爱好学习各种东西。悲催的是之前工作确实太忙了。还有差不多只有一个月的时间来准备毕业设计。 而我却基本才开始整理架构设计。






