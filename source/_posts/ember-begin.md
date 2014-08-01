title: 一个最基本的Ember应用程序
date: 2012-12-23 00:26:00
tags: javascript
---


```
一个构建野心勃勃的web应用框架
```

# 一个最小的Ember应用程序

一个最小可能性的Ember应用程序可以像下面描述的这样：

```
var App = Ember.Application.create();

App.ApplicationView = Ember.View.extend({

  templateName: 'application'

});

App.ApplicationController = Ember.Controller.extend();


App.Router = Ember.Router.extend({

  root: Ember.Route.extend({

    index: Ember.Route.extend({

      route: '/'

    })

  })

});

App.initialize();
```


现在介绍该应用程序的每一部分


```
App = Ember.Application.create();
```

这句话创建了一个新的Ember.Application的实例，这里完成了两件重要的事情



* 为你的应用程序提供了一个统一的命名空间

* 创建了一个对用户时间的监听器和事件代理控制器

```
App.ApplicationView = Ember.View.extend({

  templateName: 'application'

});
```

在Ember中视图主要负责：



* 决定应用程序的每一部分如何在HTML中进行渲染
* 响应用户事件委托


在视图之上我们只能通过改变视图模版来改变页面结构。

你的应用程序必须包含一个ApplicationView的属性，这个类将会为你创建一个视图并插入插入到视图结构中并作为根视图。

```
App.ApplicationController = Ember.Controller.extend();
```

每一个视图都关联了一个上下文环境，这个上下文环境就是Handlebars模板引擎获取关联属性的对象，所以如果你的模版像下面这种结构：


```
{{name}}
```

并且这个模版的上下文环境包含一个name的属性，那么这个模版将为显示这个值，如果没有则什么都不会显示。


一个单独的ApplicationController实例创建时将会自动关联到ApplicationView的上下文环境中。这里有一个简单并且明显的问题是。你的应用程序必须包含一个ApplicationController属性，否则应用程序的根视图将会无法关联上下文并且 Ember将会显示的抛出响应的异常信息


```
App.Router = Ember.Router.extend({

  root: Ember.Route.extend({

    index: Ember.Route.extend({

      route: '/'

    })

  })

});
```


Ember的Router与你平时所使用的其它JavaScript类库的’router’标签的行为有着显著的区别，Ember的Router的子类有一个更加一般的目标StateManager。大多数浏览器的路由实现知识简单的模仿与服务器端技术。但是HTTP协议是一个特殊的无状态的协议栈，服务器端的路由技术缺少了一个重要的特定：如何将浏览器中的应用程序变成有状态的。

状态是作为Ember应用程序的一个核心功能模块。当然属性和视图的双向绑定与自动更新时十分便利的，但是如果这就是Ember的全部的话，它只会成为严肃和健壮开发中的一小部分。


```
root: Ember.Route.extend({

    index: Ember.Route.extend({

      route: '/'

    })

  })
```

你的router至少必须包含两个路由。首先，root作为所有子路由的容器。你可以把它作为一个路由的路径设置，而不是路由本身。Index的名字可以使任何值，它的关键是它必须包含一个值为’/’的route属性。当应用程序开始加载的时候Ember会自动搜索它的路由并获取一个与url想匹配的路由。如果你从url’/’进入应用程序，你的路由将会自动装换到该状态。


```
App.initialize();
```

最后调用initialize,你的应用程序将会启动路由处理程序，并根据配置创建基本的结构，并且插入ApplicationView到页面中



本文翻译至：http://trek.github.com/。为了避免由于蹩脚英语对大家造成误导，还是强烈建议学习原版文章，本文尽作为个人笔记
