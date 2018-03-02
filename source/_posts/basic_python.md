title: Python查漏补缺
date: 2016-04-21 21:28:49
tags: [python]
---

温故而知新。

<!-- more -->

### Python文件头

* 设置脚本执行解释器路径

告诉操作系统执行脚本时调用/usr/bin下的python解释器

```
#!/usr/bin/python
```

防止在/usr/bin路径下不存在python解释器的情况，从env设置中查找Python安装路径，再调用相应路径下的解释器

```
#!/usr/bin/env python
```

* 设置脚本脚本编码格式

```
# coding=utf-8
```

or

```
# -*- coding: utf-8 -*-
```

### 注释

* 单行注释

```
# This is comment
```

* 多行注释

```
'''
This is mutil line comment
'''
```

* 函数说明

```
def some_func():
  'This is function doc you can show it by some_func.__doc__'
  pass
```

### 语句

* 序列解包

```
values = 1. 2. 3 # This is tuple
x, y, z = values
```

* 相等性和同一性

is运算符判定同一性而不是相等性

```
x = y = [1,2,3]
z = [1,2,3]
x == y # True
x == z # True
x is y # True
x is z # False
```
* 列表与迭代

当需要迭代一个巨大的序列时xrange会比range更高效，range函数一次产生整个序列，而xrange一次只创建一个数

实现原理可以参考：

```
class irange(object):

    def __init__(self, start, end, step=1):
        self.start = start
        self.end = end
        self.step = step

    def next(self):
        if self.start + self.step >= self.end:
            raise StopIteration
        self.start = self.start + self.step
        return self.start

    def __iter__(self):
        return self

if __name__ == "__main__":
    for x in irange(1, 10):
        print x
```

* 编号迭代

使用enumerate可以迭代索引-值

```
for index, str in enumerate(strings):
  pass
```

* in <scope> 消除exec和evel的全局污染

限制exec执行的作用域只存在于scope当中

```
from math import sqrt
scope = {}
exec 'sqrt = 1' in scope
scope['sqrt'] # 1
```

为evel提供命名空间

```
scope = {}
scope['x'] = 2
scope['y'] = 3
eval('x*y', scope)
```

### 函数参数参数

* 收集参数*和**

python函数定义时的参数可以分为位置参数和关键字参数

```
def hello(greeting, name):
  pass

hello("welcome", name='world')
```

使用*收集其余的位置参数

```
def some_func(*args):
  pass # args is tuple

some_func(1, 2, 3, 4, 5)
```

使用**收集其余的关键字参数

```
def some_func(*kargs):
  pass #kargs is dict

some_func(a=1, b=2, c=3)
```

* 参数分配*和**

```
params = (1, 2)
some_func(*params)
```

```
params = {'a': 1, 'b':2}
some_func(**params)
```

### 面向对象

* 私有化

Python并没有真正的私有化支持

使用双下划线,类内部使用双下划线开始的名称都被翻译为'_<ClassName>__<MethodName>'

```
class Some:
  def __pri_method:
    print 'you can call this fake private method'

s = Some()
s._Some__pri_method()
```

另外类的函数名称前包含单下划线的方法都不会被imports语句导入
