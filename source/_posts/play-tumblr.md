title: play-tumblr
date: 2013-11-12 00:35:54
tags:
---

#前言

首先，本文完全属于标题党一类的东西，虽然说的是如何让Markdown支持代码高亮，但是实际上算是一片对tumblr倒腾的记录吧。

#Tumblr倒腾之一：代码高亮

![](http://media.tumblr.com/225baa70ad9261fb1092a2dcf298eafc/tumblr_inline_mv0rtcDcOL1sosno0.png)

作为程序猿这一特殊群体的博客载体，虽然Tumblr有够简洁，Markdown写东西也有种特别装B的满足感，但是Tumblr用markdown编辑出来的文章并不支持代码高亮，算是小小的遗憾，但是Tumblr最让我喜欢的地方就在于它有足够强的可定制化能力。

直接上代码，这里主要使用[google-code-prettify][https://code.google.com/p/google-code-prettify/]来完成对代码的高亮处理

![](http://media.tumblr.com/958f02f8492392281dc5f257bd8aa0dc/tumblr_inline_mv0rd0wUC11sosno0.png)

如图所示，打开你的Tumblr的Dashbord页面，"Edit HTML",  在模板文件底部添加一下代码段：

    <script async="async" src="https://google-code-prettify.googlecode.com/svn/loader/run_prettify.js?autoload=true&amp" defer="defer"></script>
    
    <script type="text/javascript">
    
        (function(){
        
            $('code').each(function(){
            
                $(this).addClass("prettyprint");
        
            });
        
        })();
    
    </script>

如上由于使用了jquery所以，你应该在你使用的模板的文件中jquery引入之后添加以上代码，其次在前端开发“渐进增强”的前提下，你应该将代码在网页的末尾处添加代码。

以上代码使用的是google-code-prettify的默认主题，它还提供了其它可选的代码高亮主题供用户选择设置方式就是在引入google-code-prettify库的同时添加参数"？skin=xxxx"例如：

    <script src="https://google-code-prettify.googlecode.com/svn/loader/run_prettify.js?lang=css&skin=sunburst"></script>


详情请参见[google-code-prettify wiki](https://code.google.com/p/google-code-prettify/wiki/GettingStarted).


# Tumblr 倒腾之二 清洁自带模板

毕竟的国外做的产品，所以Tumblr自带的模板中都包含了一些在我们伟大天朝不屑使用的东西，所以为了体现一下民族情怀果断将自带模板里面关于twitter相关的东西都删除了，谁叫它无法访问呢～ 放在那里严重影响了博客的加载速度，不如不要～

#Tumblr倒腾之三 添加本土化社交分享元素

Tumblr的模板大都自带有分享功能，但是每次点击Share按钮4个图标历历在目，在天朝上国能用的就没有几个

 ![](http://media.tumblr.com/4dfce253c279adeab3d5fbac5f8ec35a/tumblr_inline_mv0s4y2N5X1sosno0.png)

所以在模板里面添加了[Jia This](http://www.jiathis.com/)的代码，虽然文章写的烂，被分享的可能性也是微乎其微，但还是加上了这么一段

    <!-- JiaThis Button BEGIN -->
    <div class="jiathis_style">
        <a class="jiathis_button_qzone"></a>
        <a class="jiathis_button_tsina"></a>
        <a class="jiathis_button_tqq"></a>
        <a class="jiathis_button_weixin"></a>
        <a class="jiathis_button_renren"></a>
        <a href="http://www.jiathis.com/share" class="jiathis jiathis_txt jtico jtico_jiathis" target="_blank"></a>
        <a class="jiathis_counter_style"></a>
    </div>
    <script type="text/javascript" src="http://v3.jiathis.com/code/jia.js" charset="utf-8"></script>
   <!-- JiaThis Button END -->

至于在什么位置加就看你个人喜好了。效果图如下（图中还残留了模板自带的分享按钮～，等我有时间就干掉它！）

![](http://media.tumblr.com/b532c19301ef2b666561d3c61cd13854/tumblr_inline_mv0sdtOJHt1sosno0.png)


# 小结
  
  其它的如Disqus在tumblr自带模板中都是现成的，你只需要到disqus上注册你的站点信息得到shortname即可
  总结一句：为什么愿意在Tumblr上写东西，因为它给了我充分的自由，就向题目所说的程序猿之殇 ，每一个程序猿应该都有一种对“自由”的无限向往，无论是生活还是工作，或者仅仅是关于写博客这种小事上。