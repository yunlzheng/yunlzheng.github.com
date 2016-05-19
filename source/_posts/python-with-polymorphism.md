title: python与鸭子类型
date: 2016-05-19 14:44:59
tags: [python]
---

> 当看到一只鸟走起来像鸭子、游泳起来像鸭子、叫起来也像鸭子，那么这只鸟就可以被称为鸭子

### 动态且强类型的Python

动态且强类型，如何理解？

在Python命令行中，如果我们输入以下代码，结果如何？

```
>>> variable = 1
>>> variable = '123'
```

上面的代码在Python当中是绝对合法的，那是不是意味着对象variable的类型被改变了呢？ 答案是“不是”，首先variable本身并不是一个对象，它只是一个引用。在第一行中我们创建了一个integer对象，并且将其绑定到variable这个名称中，而第二行我们创建了一个新的string对象，并且将其重新绑定到variable中，当没有任何引用关联到第一个integer对象那么这个对象的引用计数就会变成0，将会出发python的垃圾回收机制。

综上所述，说Python是动态类型是因为我们在使用变量过程中可以不关心引用的真正类型，直到最后我们真正调用时；说Python是强类型，是因为在Python中对象本身的类型是不可以改变的。

```
from random import choice
x = choice(['Hello', [1, 2, 'e', 'e']])
x.count('e')
```

在Python当中我们会尽量避免使用诸如type, isinstance以及issubckass等函数，因为当使用这个函数时，会毁掉你代码的多态性，在Python当中真正重要的事情是关心如何让对象按照你所希望的方式工作，不管它是否是正确的类型。

这就涉及到另外一个动态语言的概念“鸭子类型”，正如开篇所提到的那句话“当看到一只鸟走起来像鸭子、游泳起来像鸭子、叫起来也像鸭子，那么这只鸟就可以被称为鸭子”

### 鸭子类型

在鸭子类型的编程形式当中，类型不是我们关心的第一要素，真正重要的在于这个对象的行为。

我们以静态类型语言当中的加法为例子，在静态语言当中我们通常只能对于相同类型的对象进行加法运算。假如使用了不同类型的对象进行加法运算编辑器将会直接提示错误。

而在Python当中只要对象实现了__add__方法，那么就意味着这个对象是可以进行加法运算的:

```
class A:
     def __init__(self, val):
         self.val = val
     def __add__(self, other):
         return self.__class__(self.val+other.val)
     def __str__(self):
         return str(self.val)

a = A(2)
b = A(3)
print a + b
```

类似于__add__,还包括诸如**__getitem__** **__setitem__** 等方法都是同样的道理

```
a = [1,2,3]
print a[0]
# 等价于
print list.__getitem__(a, 0)
```

这里鸭子类型的产生是由于在Python当中我们对a使用“索引”操作时，我们并不用整整关心a的正是类型，我们只需要关心a所引用的对象是否包含__getitem__这样的方法。

### 继承与鸭子类型

在Java当中我们使用接口来定义行为，通过继承超类实现代码共享。而在Python当中由于鸭子类型的存在，除了代码共享以外(如mixin)我们很少有对继承的需要：

```
class Duck:
  def quck(self):
    print "duck qucking"

  def walk(self):
    print "duck is walking"

class GreenDuck(Duck):
  def quck(self):
    print "green duck is qucking."

class PersonWithDuckSkil:
  def quck(self):
    print "em~ i'm not a real duck"

  def walk(self):
    print "All peope can waking."

def duck_game(duck):
  duck.quck()
  duck.walk()

if __name__ == "__main__":
  duck = Duck()
  greenDuck = GreenDuck()
  people = PersonWithDuckSkil()

  duck_game(duck)
  duck_game(greenDuck)
  duck_game(people)
```

基于鸭子类型实现完全由程序员自身进行控制，在增加了灵活性的同时还需要程序员自身的更高要求，虽然没有语言层面的约束，但是还是要保持心中有“接口”的状态。
