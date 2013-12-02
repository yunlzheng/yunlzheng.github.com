title: JavaScript学习笔记-原型继承
date: 2012-09-06 13:09:32
tags:
---

```
  原文最初写与我的[OSCHINA博客](http://my.oschina.net/fhck/blog/77091)
```

JavaScript基于原型的编程语言，本身并不包含内置的类实现。但是可以通过Javascript模拟出类

# 类

JavaScript中有构造函数和New运算符。构造函数用来实例对象和初始化属性。任何JavaScript函数都可以用作构造函数，构造函数必须使用new运算符作为前缀来创建新的实例

JavaScript要模拟一个类可以直接使用函数function

```

var Person = function(name){
   this.name = name;
}

//实例化Person
var alice = new Person('alice');
console.log(alice.name);
```

这里需要注意的this关键字， new运算符会改变函数的执行上下文，同时改变return的行为。当使用new运算符来调用构造函数时，执行上下文this从全局对象编程一个空的上下文，这个上下文代表新生成的实例。因此this指向当前创建的实例。

所以一下代码执行会出现undefined

```
var bob = Person('bob');
console.log(bob.name);
```

# 原型    

JavaScript本身是基于原型的编程语言，原型的作用:区别类和实例

```
var Animal = function(){}

Animal.run = function(){
    console.log('Animal run')
}

Animal.prototype.breath = function(){
   console.log('animal breath');
}

Var Dog = function(){}

//Dog继承自Animal
Dog.prototype = new Animal();

Dog.prototype.wag = function(){
   console.log('dog wag');
}

var dog = new Dog();
dog.wag();
dog.breath();//继承的属性
```

输出：

```
dog wag
animal breath
```

那么通过类的prototype定义的方法或者属性就可以叫做所有实例的方法或属性，而其他的方法和属性就是类本身的方法和属性类比java类中的静态变量

这里对下面一些东西的叫法约定一下

通常按照个人习惯

构造函数/匿名函数

```
var Person = function(name){
  this.name=name;
}
```

函数/类

```
function Person(){}
对象/实例

var person = { name:'zhangsan',sex:'male'}
```


# 原型继承继承是的什么？

还是上面关于Animal和Dog的例子，我们做一些改造

```
var  animal = {
        breath:function(){console.log('animal breath!')},
};

var Dog = function(){}

//Dog继承自animal
Dog.prototype = animal;

Dog.prototype.wag = function(){
   console.log('dog wag');
}

var dog = new Dog();
dog.wag();
dog.breath();//继承的属性
```

结果和上面的一样

在一个例子中我们使用 Dog.prototype = new Animail;   这个例子中我们使用的是Dog.prototype = animal

区别在于第一个例子中的Animal是一个匿名类，通过调用new运算符调用其构造函数返回了一个animal实例，而第二个例子中animal本身就已经是一个实例/对象。这就是之前提到的new运算符的作用。

所以一个类的如果要继承另一个类那么就需要继承那个类的实例而不是类本身（Function），当然我们可以试一下直接使用Dog.prototype=Animal，结果就是当调用dog.breath();时直接返回的是一个Function对象，无法达到共享属性的意义。


原型对象就是一个“模板”，定义在原型上的属性被用来初始化一个新的对象。任何对象都可以作为一个对象的原型对象，以此来共享属性。

   

