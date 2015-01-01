title: Angular 不完全参考手册
date: 2014-07-31 15:30:25
tags: angular
---

Angulare及Ember之后又一前端MVC的一大力作，同时也越来越多的应用到现在Web应用开发当中，这里我们来了解一下Angular中非常重要的一块Derective

<!-- more -->

用简单的方式理解Directive就是通过标记（例如通过 属性, 标签, 或者css的 class）特定的DOM元素，为其提供额外功能的方法。

    angular.module("myApp")
      .directive("myDirective", function(){

        // directive define here

      });

申明一个指令需要两个元素：

**name(string)**

Directive的名称

**factory_function(function)**

工厂方法需要返回一个用于定义指令行为的对象。

    angular.module("myApp")
      .directive("myDirective", function(){

        // directive define here
        return {
          // directive definition options
        };

      });

当Angular启动以后，Angular的compiler将会解析document通过匹配标签，属性，或者css类需找directive，当找到相应的元素，则通过我们定义的指令方法作用于标签之上。

    <div my-directive></div>

实例见:[http://jsbin.com/kovak/7/](http://jsbin.com/kovak/7/)

## Directive参数详解

    angular.module('myApp', [])
    .directive('myDirective', function() {
        return {
            restrict: String,
            priority: Number,
            terminal: Boolean,
            template: String or Template Function:
                function(tElement, tAttrs) (...},
            templateUrl: String,
            replace: Boolean or String,
            scope: Boolean or Object,
            transclude: Boolean,
            controller: String or
                function(scope, element, attrs, transclude, otherInjectables) { ... },
            controllerAs: String,
            require: String,
            link: function(scope, iElement, iAttrs) { ... },
            compile: return an Object OR
                function(tElement, tAttrs, transclude) {
                return {
                    pre: function(scope, iElement, iAttrs, controller) { ... },
                    post: function(scope, iElement, iAttrs, controller) { ... }
                }
                // or
                return function postLink(...) { ... }
            }
        };
    });

__restrict(string)__

可选参数，定义将使用哪种方式(element, attribute, class, comment)在DOM中申明一个指令,默认情况下Angular使用attribute申明directive, 申明的可选值

* E 作为元素
* A 作为属性
* C 作为类
* M 作为注释

example:

        <my-directive></my-directive>
        <div my-directive></div>
        <div class="my-directive:express;"></div>
        <!-- directive: my-directive express> -->

example:

        angular.module('myApp', []);
        angular.module("myApp")
          .directive("myDirective", function(){
            // directive define here
            return {
              // directive definition options
              restrict: 'AE'
            };
        });


在页面中通过如下方式调用：

        <-- as an attribute -->
        <div my-directive></div>
        <-- or as an element -->
        <my-directive></my-directive>

> 注意事项，请慎用Element的定义方式. IE你懂得~

__priority(numver)__

可选参数，默认值0. 该属性定义了指令的优先级，当同一个dom元素定义了多个指令，优先级高的先执行，一般情况下大部分指令是忽略了这个值得，只有特殊的如__ng-repeat__设置为1000,如此ng-repeat总能在其它指令之前先运行，而保证不出先一些怪异的情况

__terminal(boolean)__

可选参数，默认值。 当定义了该参数后，diretive将会告诉Angular，停止执行之后的有更高priority的指令，而不影响其他相同优先级的directive。

> 注意，在定义的terminal参数的指令元素上，加入优先级更高的指令时，优先级更高的指令将不会执行。

__template(string|function)__

可选参数。directive的模版，必须是以下类型之一


* string: HTML的字符串表示
* function(tElement, tAttrs)： 一个函数并且返回值必须为一个HTML的字符串，这里的tElement, tAttrs是正对模版的，不同于申明了指令的dom元素。

example:

        template: '<div><h1>When using two elements, wrap them in a parent element</h1></div>'

> 对angular而言，处理模版和处理其他的html是一样的，模版中我们同样可以使用angular的标记如{{ haha }}

__templateUrl(string|function)__

可选参数，如果提供必须是一下类型之一：
* string: 指向html模版的路径
* function(tElement, tAttrs)：返回html模版的路径

默认情况下，当directive被调用时，将使用ajax请求相应的模版文件

> 注意1，在本地开发时为了防止CORS错误，应该使用静态资源服务器WebStorm自带了一个build-in server在开发时会方便

> 注意2：模版文件是同步加载的，这意味着compilation和link函数会在模版加载完成之后才开始运行

大量的同步加载模版将会使客户端速度和体验明显下降，这时我们应该考虑缓存模版，这时候你应该考虑使用[$templateCache](http://docs.angularjs.org/api/ng/service/$templateCache)

__replace__(boolean)

可选参数，默认值为false; 默认情况下指令的模版将作为子元素添加到申明了指令的Dom元素之中

js:

    angular.module('myApp', []);

    angular.module("myApp")
      .directive("myDirective", function(){

        // directive define here
        return {
          restrict: 'EA',
          // directive definition options
          template: '<div>some stuff here</div>'
        };

      });

 html:

     <div my-directive></div>

 生成的html如下所示：

            <div my-directive=""><div>some stuff here</div></div>

当replace为true时，生成的html如下所示


            <div my-directive="">some stuff here</div>


__指令的Sope(域)__

为了更好的理解，剩下的参数，我们有必要了解一下scope是如何工作的。

当在DOM中申明ng-app指令时，一个特殊的对象$rootscope将会被创建

      <div ng-app="myApp" ng-init="someProperty='some data'"></div>

      <div ng-init="siblingProperty = 'more data'">
         Inside Div Two
         <div ng-init="aThirdProperty"></div>
      </div>


如上代码所示，我们在rootsocpe上创建了3个属性：someProperty， siblingProperty， aThirdProperty。

从这里开始，每一个在DOM中的directive将会：

* 直接使用这些属性
* 创建一个新的对象并且集成rootscope对象
* 创建一个完全独立与rootscope的对象

实例展示的是第一种情况，第二个div是一个兄弟节点它可以直接set和get$rootScope. 此外，在第二个div中的div同样有访问同一个rootScope的权利。 默认情况下子指令具有访问它们父节点的scope的的权限。

而指令也仅仅是作为内嵌在其他指令下，并不意味着scope对象被改变了。到这里也就可以理解为什么申明指令时scope参数是默认为false了。

> 提示：关于scope集成的问题可以参考Javascript的原型集成模型

__scope(boolean|object)__

可选参数，默认值False. 可以设置为true或者一个object {}.

当设置为true时，指令的scope将会原型集成自父节点scope

内置的 ng-controller指令存在的目的就在于创建一个原型继承自父scope的scope.下面是一个例子：

html:

    <div ng-init="someProperty = 'some data'"></div>
      <div ng-init="siblingProperty = 'more data'">
        Inside Div Two: {{ aThirdProperty }}
      <div ng-init="aThirdProperty = 'data for 3rd property'" ng-controller="SomeController">
        Inside Div Three: {{ aThirdProperty }}
        <div ng-init="aFourthProperty">
        Inside Div Four: {{ aThirdProperty }}
        </div>
      </div>


js:

    angular.module('myApp', []);

    angular.module('myApp')
      .controller('SomeController', function($scope){

      });

result:

    Inside Div Two:
    Inside Div Three: data for 3rd property
    Inside Div Four: data for 3rd property

如上所示，ng-controller的socpe集成自rootScope. 在对ng-controller的scope添加属性后，不会影响rootScope的属性

> 再次提醒：JavaScript的原型集成模型

html:

    <div ng-init="someProperty = 'some data'"></div>
      <div ng-init="siblingProperty = 'more data'">
        Inside Div Two: {{ aThirdProperty }}
          <div ng-init="aThirdProperty = 'data for 3rd property'" ng-controller="SomeController">
              Inside Div Three: {{ aThirdProperty }}
              <div ng-controller="SecondController">
                Inside Div Four: {{ aThirdProperty }}
                <br>
                Outside myDirective: {{ myProperty }}
                <div my-directive ng-init="myProperty = 'wow, this is cool'">
                  Inside myDirective: {{ myProperty }}
                </div>
              </div>
          </div>
      </div>

js:如下所示我们定义了一个SecondController，定义了一个新的指令myDirective并且设置scope为true,这意味着myDirective的域将会原型集成自父节点的域。

    angular.module('myApp', []);

    angular.module('myApp')
      .controller('SomeController', function($scope){

      })
      .controller('SecondController', function($scope){

      })
      .directive('myDirective', function() {
        return {
            restrict: 'A',
            scope: true
        };
    });

result:

    Inside Div Two:
    Inside Div Three: data for 3rd property
    Inside Div Four: data for 3rd property
    Outside myDirective:
    Inside myDirective: wow, this is cool

完整代码请点击
[http://jsbin.com/lehan/31/](http://jsbin.com/lehan/31/)希望上面的例子能对你理解socpe是如何工作的有所帮助。

__隔离Scope__

隔离的scope可能是最容易让人疑惑，同时也是最强大的工具之一，最主要的用例是创建可重用的组件。 避免不经意间污染其他的父scope对象。

为了创建一个具有隔离Scope的指令，我们需要设置指令的scope属性为一个空对象{},如此设置之后指令的模版将不能使用任何父scope的属性。

html:

      <div ng-controller='MainController'>
        Outside myDirective: {{ myProperty }}
        <div my-directive ng-init="myProperty = 'wow, this is cool'">
        Inside myDirective: {{ myProperty }}
        <div>
      </div>

js:

      angular.module('myApp', [])
          .controller('MainController', function($scope) {})
          .directive('myDirective', function() {
            return {
              restrict: 'A',
              scope: {},
              template: '<div>Inside myDirective {{ myProperty }}</div>'
            };
        });

result:

    Outside myDirective: hello world
    Inside myDirective

完整代码参考[http://jsbin.com/gisoz/61/](http://jsbin.com/gisoz/61/)

__Transclude__

可选参数，默认值false;如果提供必须设置为true.
Transclue经常被用来创建可重用的组件，一个很好的例子就是如modal box以及导航条。

html:

    <div sidebox title="Links">
      <ul>
        <li>First link</li>
        <li>Second link</li>
      </ul>
    </div>

js:

    angular.module('myApp', [])
      .directive('sidebox', function() {
        return {
          restrict: 'EA',
          scope: {
            title: '@'
          },
          transclude: true,
          template: '<div class="sidebox"><div class="content"><h2 class="header">{{ title }}</h2><span class="content" ng-transclude></span></div></div>'
        };
    });



上面的代码将会告诉Angular的编译器寻找模版中的__ng-transclude__指令，并将DOM内的元素作为子元素添加到ng-transclude标签下。

上述代码生成的Html结果如下所示：

    <div sidebox="" title="Links" class="ng-isolate-scope">
      <div class="sidebox">
        <div class="content">
        <h2 class="header ng-binding">Links</h2>
        <span class="content" ng-transclude="">
          <ul class="ng-scope">
            <li>First link</li>
            <li>Second link</li>
          </ul>
        </span>
        </div>
      </div>
    </div>

完整代码参考[http://jsbin.com/gisoz/73/](http://jsbin.com/gisoz/73/)

__controller(string|function)__

可选参数，可以设置为：

* string: Angular将会根据名字找到相应的已经注册的Controller;

        angular.module('myApp', [])
        .directive('myDirective', function() {
            restrict: 'A', // always required
            controller: 'SomeController'
        });

        angular.module('myApp')
            .controller('SomeController', function($scope, $element, $attrs, $transclude) {
                // controller logic goes here
        });

* function($scope, $element, $attrs, $transclude): 定义内联的controller


        angular.module('myApp', [])
        .directive('myDirective', function() {
            restrict: 'A',
            controller:
            function($scope, $element, $attrs, $transclude) {
                // controller logic goes here
            }
        });

一般情况下link 和controller是可以互换的，而使用controller的主要用例是希望controller可以在多个directive中重复使用。

* 参数

    * $scope: 当前指令的scope
    * $element: 当前指令所在的dom节点对象
    * $attrs: 当前 dom 节点的属性

            <div id="aDiv" class="box"></div>

        属性为：

            {
                id: "aDiv",
                class: "box"
            }

    * $transclude:

        js:

            angular.module("myApp", []);

            angular.module('myApp')
            .directive('link', function() {
              return {
                restrict: 'EA',
                transclude: true,
                controller:
                function($scope, $element, $transclude) {
                  $transclude(function(clone) {

                    var a = angular.element('<a>');
                    a.attr('href', clone.text());
                    a.text(clone.text());
                    $element.append(a);
                  });
                }
              };
            });

        html:

            <div link>aaaaaa</div>

        result:

            <div link=""><a href="aaaaaa">aaaaaa</a></div>

        完整代码见[http://jsbin.com/gisoz/104/](http://jsbin.com/gisoz/104/)

__controllerAs(string)__

可选参数，该参数允许我们为controller设置别名

    angular.module('myApp')
      .directive('myDirective', function() {
        return {
          restrict: 'A',
          template: '<h4>{{ myController.msg }}</h4>',
          controllerAs: 'myController',
          controller: function() {
            this.msg = "Hello World";
          }
        };
    });

__require(string|array)__

可选参数，可以设置为一个string或者一个string数组，这些string代表了当前指令所依赖的其他指令
