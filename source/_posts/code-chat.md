title: CODE: 记最近刨的那些坑之Tornado Chat
date: 2013-10-19 17:00:40
tags:
---

# Tornado Chat

项目地址：[https://github.com/yunlzheng/chat](https://github.com/yunlzheng/chat)

开发时间：1周

# 开发目的

话说程序猿总是喜欢抛各种各样的坑，然后再往里面跳。

# 简介

基于Tornado 和 html5 websocket技术的匿名在线聊天工具

# 杂记

## 前端杂记

*  头像服务

由于是提供的匿名聊天服务，所以系统并不会主动保存用户的信息，实际上这个项目上根本就没用到数据持久化的东西，所以头像的问题如何解决是一个简单但是不可忽视的问题，第一个想到的就是使用[gavatar全球头像服务](http://en.gravatar.com/)，python里面要对支持gavatar服务很简单


    # import code for encoding urls and generating md5 hashes
    import urllib, hashlib
 
    # Set your variables here
    email = "someone@somewhere.com"
    default = "http://www.example.com/default.jpg"
    size = 40
 
    # construct the url
    gravatar_url = "http://www.gravatar.com/avatar/" +hashlib.md5(email.lower()).hexdigest() + "?"
    gravatar_url += urllib.urlencode({'d':default, 's':str(size)})


这是这里只有两个东西，一个是当前用户的邮箱地址，一个是默认头像。 获取用户邮箱很简单，增加一个登陆流程，虽然是匿名聊天室，但是最起码你应该输入你的昵称吧，输入昵称的时候再顺便多输入一下你的邮箱地址也是很合情合理的吧。

头像问题就解决了没？ 还没呢，这是你就会发现，如果当前登录的用户没有使用gavatar头像服务的话，所有人的头像都是一样的。。。。 这个就很尴尬了， 到时候说话时连谁和谁都不知道了。

不知道有木有同学注意到过github的头像，它本身也是使用gavatar头像服务，所以就去捣鼓了一下github发现了一个很有意思的服务[identicons](https://github.com/blog/1586-identicons)，如果想知道它是干嘛的？[点我](https://identicons.github.com/jasonlong.png)，所以把上面的代码简单改进一下，修改一下default的值，就实现了我们的目的

这就是所谓的不重复造轮子？ 完全是偷懒！

*  消息通知

chat里面消息通知主要从3个方面完成：未读消息数，chrome桌面通知，以及消息提示音；


*  聊天表情Emoji

 Emoji是前端时间用tower.im时才知道有的那么一个东西，关于Emoji的发展背景也挺好玩的有兴趣的同学可以去Google一把，毕竟是聊天程序所以表情还是应该要有的在chat里面主要使用了前端的javascript库[emojify.js](https://github.com/hassankhan/emojify.js)。简单来说这个库的作用就是匹配当前页面里面有的emoji表情符号，并替换成实现定义好的emoji表情样式图片，用法很简单，导入项目所需的css和js文件。在页面载入时，做一次全局配置


        emojify.setConfig({
            emojify_tag_type: 'img',
            emoticons_enabled: true,
            people_enabled: true,
            nature_enabled: true,
            objects_enabled: true,
            places_enabled: true,
            symbols_enabled: true
        });
       
   
 然后当你觉得应该更新一下页面的时候，调用

        emojify.run();


就能将页面中的emoji表情符号替换成响应的图片或者是字符图 
      


*  背景图片

作为一个只会写点css和javascript而又不懂设计的程序猿，在自己刨坑的时候能窃的就窃点，毕竟都是往坑里面填点东西而已，用过微信网页版的的小伙伴一看就知道，这前端，这样式不就是跟微信一样的呀？ 当然不一样，只能算是模仿，而且还是模仿的很拙劣的那一类，完全没有微信网页版UI的那种流畅感觉。tumblr是最近才开始使用的，之前都是在[oschina](http://my.oschina.net/fhck/blog)上写点东西，不过以前写东西和现在写东西的最大的不同就在于，以前老是把博客当做是个笔记之类的，所以老写些纯技术的东西，后面用了印象笔记，好的资料卡卡卡卡的就往印象笔记里面放，所以后面博客就写的少了。刚说了tumblr是最近才开始用的，优点就不说了，跟国内的博客服务相比一个感觉是文艺范的（毕竟是轻博客嘛，想到国内的点点就不免感叹几句）。

言归正传，tubmlr的登录注册页面每次刷新都是些很漂亮的背景，所以我也一不做二不休，既然无耻了就再无耻一次吧。 

python里面做HTML解析的库倒是很多，这里就不做一一列举，主要怕列举出来就有点装公知的感觉，实际上按最大范围值来计算本人做python到现在也就3个月的时间，连基础都还没学一遍就匆匆开始跟着[@__左弈__](http://weibo.com/xuwenbao)做项目了。

这里主要使用BeautifulSoup来实现的对tumblr登录页面的解析，并获得那张精选的随机大图


    import re
    import tornado.gen
    from tornado.httpclient import AsyncHTTPClient
    from BeautifulSoup import BeautifulSoup
    from chat.handler import BaseHandler


    class TumblrHandler(BaseHandler):

        @tornado.gen.coroutine
        def get(self):
            http_client = AsyncHTTPClient()
            http_response = yield http_client.fetch("https://www.tumblr.com/")
            content = http_response.body
            soup = BeautifulSoup(content)
            img = soup.findAll('img')[0]
            pattern=re.compile(r"""<img\s.*?\s?src\s*=\s*['|"]?([^\s'"]+).*?>""",re.I)
            m = pattern.findall(str(img))
            self.write(m[0])

由于项目使用tornado做的，所以在chat里面就实现了一个RequestHandler异步的去获取tumblr的背景图片，并无耻的被chat使用了（呵呵）

## 后端杂记

----------------------------------无耻的待更新-------------------------------------

# 画廊

![](https://raw.github.com/yunlzheng/chat/master/static/images/login.png)

![](https://raw.github.com/yunlzheng/chat/master/static/images/chat.png)


# 小结

这算是我开始我python开发道路的第二个作业吧。 第一个作业同样是基于tornado开发的web程序在线图书分享[pdflabs](http://pdflabs.herokuapp.com/)以后有时间再总结