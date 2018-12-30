title: React入坑指南
date: 2015-06-09 20:08:18
tags: ['react.js','web']
author: '墨鱼'
---

React.js 入坑记：快速上手，组件化，高复用，高性能。

<!-- more -->

### 1.1，创建你的第一个React应用

```
<!DOCTYPE html>
<html>
  <head>
    <script src="build/react.js"></script>
    <script src="build/JSXTransformer.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/jsx">

      var HelloWorld = React.createClass({
          render:function(){
            return (
              <h1>Hello World</h1>
            );
          }
      });

      React.render(
        <HelloWorld/>,
        document.getElementById('example')
      );
    </script>
  </body>
</html>
```
* __在应用中使用React依赖两个文件react.js和JSXTransformer.js文件。一个是框架本身，另一个用于支持JSX语法；__
* __React在组件中使用JSX语法（js和html混合语法），当然不用JSX也行；__
* __当然官方也并不推荐你直接使用JSX语法,请参考[jsx预处理工工具](http://facebook.github.io/react/docs/tooling-integration.html#jsx)；__
* __引用JSX脚本或者代码，script标签type为"text/jsx";__

### 1.2，程序入口React.render()

```
React.render(
  <h1>hello world</h1>,
  document.getElementById("example")
);
```

React.render在React中算是程序的最基本入口，会将React模板转换为页面内容，添加到document.getElementById("example")当中，并且返回该组件的引用。

### 1.3，创建组件React.createClass()

```
var HelloWorld = React.createClass({
    render:function(){
      return (
        <h1>Hello World</h1>
      );
    }
});

```

React.createClass(object specification)方法将会根据specification创建一个组件类，一个组件必须要继承render方法，并且返回组件模板。创建完成组件之后我们就可以像应用html一样的使用组件。

* 可以直接在render中使用;
```
React.render(
  <HelloWorld/>
  document.getElementById("example")
);

```

* 也可以在其他组件中嵌套使用;
```
var Header = React.crrateClass({
  render: function(){
    return (
      <div><HelloWorld/><HelloWorld/></div>
    );
  }
});
```

对于返回的内容必须要是闭合的子模板。如下所示：

```
#这是对的
render:function(){
  return (
    <ul><li></li></ul>
  )
}
# 这是错的
render:function(){
  return (
    <div></div>
    <div></div>
  )
}
```

## 2，组件详解

### 2.1，组件的属性this.props

通过React.createClass()方法我们可以创建自己的组件，和组件本身的使用和直接使用html标签是非常相似的。最主要的区别在于组件的属性值可以是一个javascript对象（JSX语法）

在组件内使用this.props.attributeName可以获取到组件特定属性的值。

```
var Menu = React.createClass({
  render: function(){
    var className = this.props.active ? "active" : "";
    return (
      <li className={className}>
        <a href={this.props.href}><i className={this.props.icon}/>{this.props.value}</a>
      </li>
    )
  }
});

React.render(
  <Menu active={true} href='/login' icon='fa fa-weixin' value='登录'/>
);

```
> Tips：JSX支持javascript和html的混合语法。在JSX模板解析过程中,当遇到{}则使用js语法进行解析，其他则以html语法解析

### 2.2， 获取组件子节点内容this.props.children

既然我们可以像使用html标签一样的去使用React组件，那么一定是能够通过如下形式使用组件

```
<Menus>
  <Menu>首页</Menu>
  <Menu>博客</Menu>
  <Menu>归档</Menu>
</Menus>
```

在React中我们可以使用{this.props.children}获取组件中的子内容

```
var Menu = React.createClass({
  render: function(){
    return (
      <li className='normal'><a>{this.props.children}</a></li>
    )
  }
});

var Menus = React.createClass({
  render: function(){
    return (
        <ul>{this.props.children}</ul>
    )
  }
});

React.render(
  <Menus>
    <Menu>首页</Menu>
    <Menu>博客</Menu>
    <Menu>归档</Menu>
  </Menus>,
  document.getElementById("menus")
)

```

> Tips: 由于class和for是javascript的关键字，所以在JSX模板中使用className和htmlFor

### 2.3, 遍历

上面的Menus菜单的例子，在实际情况中菜单一般会根据当前状态比如用户是否登录动态的现实菜单项目。重写上面的例子

```
var Menu = React.createClass({
  render: function(){
    return (
      <li><a href={this.props.link}>{this.props.children}</a></li>
    )
  }
});

var Menus = React.createClass({
  render: function(){
    var menus = this.props.items.map(function(item){
      return (
        <Menu link={item.link}>{item.text}</Menu>
      )
    });
    return (
        <ul>{menus}</ul>
    )
  }
});

React.render(
  <Menus items={[
    {text:'首页',link:'/'},
    {text:'博客',link:'/blogs'},
    {text:'归档',link:'artive'}
  ]}>
  </Menus>,
  document.getElementById("menus")
)

```

这里我们为Menus创建了一个items属性，该属性是一个数组，用来保存菜单项。

在Menus组件中我们通过this.props.items获取到菜单项的数组，这个使用js的map方法遍历items,每一次遍历返回一个Menu对象。最终返回一个ReactElement的数组menus. 从而实现动态的创建菜单列表。

### 2.4，组件的生命周期与事件处理

到目前为止，我们可以通过render去加载组件，并且可以通过this.props去获取组件相关的属性以及子内容。但是对于组件而言props是不可变的。但是对于一个组件而言它通常是会包含多种状态，
例如以Button为例子，就有enable和disabled的状态。

在React中，每一个组件都包含一个__this.state__属性，当通过__this.setState()__ 方法设置组件的状态之后，React都会调用Render方法重绘组件。而在这个过程中React将会通过diff算法比较虚拟的DOM树与实际的DOM并且只变更之间差异的部分，从而保证高性能的局部刷新。


而对于每一个组件而言，都有其主要的生命周期主要包含以下3各部分：

* Mounting： 组件将要插入到DOM当中；
  对应的处理函数：
  * getInitialState()：object在组件mounted之前调用，返回组件的初始状态
  * componentWillMount()
  * componentDidMount()
* Updating：组件在重绘render时(必要时)；
  * componentWillReceiveProps()
  * shouldComponentUpdate()
  * componentWillUpdate()
  * componentDidUpdate()
* Unmounting：组件将会从DOM众移除时；
  * componentWillUnmount

> Tips: Javascrippt是基于事件驱动模型，假如在连续两次__this.setState()__ 之后，React发现DOM没有变更，此时React并不会触发render方法

在介绍完组件的生命周期以及状态state之后，我们遍可以根据这些方法创建一个有状态的组件。 同样是针对Menus和Menu组件，我们希望当点击Menu菜单项时能够设置该菜单项为active的状态。


```
var Menu = React.createClass({
  handleClick: function(event){
    //调用回调函数
    event.preventDefault();
    this.props.onSelect(this.props.link);
  },
  render: function(){
    return (
      <li className={this.props.active}>
        <a href={this.props.link} onClick={this.handleClick}>{this.props.children}</a>
      </li>
    )
  }
});

var Menus = React.createClass({
  getInitialState:function(){
    return {link: '/'}
  },
  handleClick: function(link){
    this.setState({link: link})
  },
  render: function(){

    var that = this;
    var menus = this.props.items.map(function(item){
      // 将Menus的handleClick方法作为回调函数，用以触发Menus的重绘
      return (
        <Menu link={item.link} active={that.state.link == item.link} onSelect={that.handleClick}>{item.text}</Menu>
      )
    });
    return (
        <ul>{menus}</ul>
    )
  }
});

```

Menus组件：

针对Menus组件我们覆盖了getInitialState()方法，返回Menus组件的初始状态为{link:'/'}。

同时添加了自定义的handleClick方法，传入link参数。在handleClick方法中我们使用this.setState方法。假如该方法被调用组件就会触发Render事件进行重绘。

Menu组件：

对于Menu组件我们添加了两个新的属性active和onSelect，分别用于设置Menu组件的class以及点击后的毁掉。 而这里我们的回调函数就是Menus组件的handleClick方法。这样当Menu点击时我们能够触发Menus的setState方法，对菜单进行重绘。

> 在React中每一个组件事件上就是一个状态机，当状态发生变化时。组件触发render事件，对组件进行重绘

### 2.5，与Dom的交互

除此之外，当组件处于mounted状态时，我们可以通过React.findDOMNode()方法获取实际的DOM对象，此方法特别适用于处理诸如表单提交时，需要获取表单内容的情况。

```
var Component = React.createClass({
  handleSubmit: function(){
    React.findDOMNode(this.refs.InputText).value.trim();
  },
  render: function(){
    return (
        <form>
          <input type="text" ref="InputText"/>
          <button type="submit" value="提交" onClick={this.handleSubmit}/>
        </form>
    )
  }
});
```

## 3，组件化的开发模式，复用，复用还是复用

![](/images/blog_react_cpmponents.png)

以一个简单页面，当我们使用React将页面组件化之后，对于一个新的页面而言我们要做的事情就是进行组装。

```
var PageOne = React.createClass(function(){
    return (
      <div>
        <Header>
          <Menus/>
        </Header>
        <SomeForm/>
        <Footer>
      </div>
    );
});
React.render(
    PageOne,
    document.getElementById('pageOne')
);

```

当然如果在另外一个页面我们也可以通过同样的方式，通过组件定义一个新的页面。

> Tips：用React是做单页应用还是多页应用？ 何苦呢，又不是只会用js一种语言，对于前段框架的使用我跟喜欢服务器端模板与前段模板混合的模式，各取所长。

## 5，结论

通过组件化的开发方式，我们可以将我们的关注点从一个复杂的应用逻辑，转变对每一个组件本身。 同时组件化也以为着更小的功能块，以及更好的可测试性。 当然对于React本身而言其上手快，易学习以及诸如React Native这样的Mobile开发框架，相信React的路一定会走的非常顺畅。
