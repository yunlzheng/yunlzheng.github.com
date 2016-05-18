title: functional-programming-with-python
date: 2016-04-21 21:28:49
tags:
---

## Introducation

* Function Programming has a long history
* List 1958
* Renaissance: F#, Haskell, Erlang...
* Used in industry
  * Trading
  * Algorithmic
  * Telecommunication(Concurrency)

## Features Of Functional Programming

* Everything is a function
* Pure functions without side effects
* Immutable data structures
* Preserve state in functions
* Recursion instead of loops / iteration

## Advantages of Functional Programming

* Absence of side effects can make your programs more robust
* Programs tend to be more modular come and typically in smaller building blocks
* Better testable - call with same parameters always return same result
* Focus on algorithms
* Conceptional fit with parallel / concurrent programming
* Live updates - Install new release while running

## Disadvantages of Functional Programming

* Solutions to the same problem can look very different than procedural / object-oriented ones
* Find good developers can be hard
* Not equally useful for all types of problems
* Input/output are side effects and need special treatment
* Recursion is "an order of magnitude more complex" than loops/iteration
* Immutable data structures may increase run times

## Python's Functional Features - Overview

* Pure functions (sort of)
* Closures - hold state in functions
* Functions as object and decorators
* Immutable data types
* Lazy evaluation - generators
* List(dictionary, set) comprehensions
* functions, itertools, lambda, map, filter
* Recursion - try to avoid, recursion limit has a reason

# Pure Functions - No Side Effects

* No side effect, return value only
* "Shallow copy" problem

```
def dp_pure(data):
  """
  Returen copty times two.
  """
  return data * 2
```

* An ooverloaded * that modifies data or causes other side effects would make the function un-pure
* No guarantee of pureness
* Pure functions by convention

## Side effects
* Side effects are common

```
def do_side_effect(my_list):
  """
  Modify list appending 100.
  """
  my_list.append(100)
```

## Functions are Objects

```
def func1():
  return 1

def func2():
  return 2
```

```
>>>> my_funcs = {'a': func1, 'b': func2}
>>>> my_funcs['a']()
>>>> my_funcs['b']()
```

* Everything is an object

## Closures and "Currying"

```
def outer(outer_arg):
  def inner(inner_arg):
    return inner_arg * outer_arg
  return inner

>>>> func = outer[10]
>>>> func(5）
>>>> func.__closure__
>>>> func.__closure__[0]
>>>> func.__closure__[0].cell_contents
```

## Partail Functions

* Module functools offers some tools for the Functional approach

```
import functools
def func(a, b, c):
  return a,b,c

>>>> p_func = functools.partial(func, 10)
>>>> p_func(3, 4)
10 3 4
>>>> p_func = functools.partial(func, 10, 12)
>>>> p_func(3)
10 12 3
```

## Recursion

```
def loop(n):
  for x in xrange(int(n)):
    a = 1+1

def recures(a):
  if a <= 0:
    return
  a = 1 + 1
  recurse(int(n) - 1)
```

## Recursion - Time it in IPython

```
%timeit loop(le3)
10000 loops, best of 3:48 us per loop

%timeit recurse(le3)
1000 loops, best of 3: 687 us per loop
```

* sys.setrecursionalimit(int(le6)) and %timeit recurse(le5) segfaulted my IPython kernel

## Lambda

* Allow versy limited anonymous functions
* Expressions only, no statements
* Past discussion to exclude it from Python 3
* Useful for callbacks

```
def use_callback(callback, arg):
  return callback(arg)
>>> use_callback(lambda arg: arg * 2, 10)
20
```

## Lambda - Not Essential

* Always possible to add two extra lines
* Write a function with name and docstring

```
def double(arg):
  """
  Double the argument.
  """
  return arg * 2

>>>> use_callback(double, 10)
```

## List Comprehensions instead of map

* Typical use of map

```
>>> map(lambda arg: arg * 2, range(2, 6))
[4,6,8,10]
```

* Replace with list comprehension

```
[x * 2 for x in range(2, 6)]
[4,6,8,10]
```

## List Comprehensions instead of filter

* Typical use of filter

```
>>> filter(lambda x: x > 10, range(5, 16))
```

* Replace with list comprehension

```
>>> [x for x in range(5, 16) if x > 10]
```

## Decorators

* Application of closures

```
import functools
def decorator(func):
  @functools.wraps(func)
  def new_func(*args, **kwargs):
    print 'decorator was here'
    return func(*args, **kwargs)
  return new_func

@decorator
def add(a, b):
  return a + b

add(2, 3)
```

## Immutable Data Types - Tuples Instead of Lists

```
my_list = range(10)
my_list
[0,1,2,3,4,5,6,7,8,9]
my_tuple = tuple(my_list)
my_tuple
(0,1,2,3,4,5,6,7,8,9)
```

* Contradicts the usage recommendation
  * Lists == elements of the same kind
  * Tuple == "named" elements

## Immutable Data Types - Freeze Sets

```
my_set = set(range(5))
my_set
set([0,1,2,3,4])
my_frozenset = frozenset(my_set)
my_frozenset
forzenset([0,1,2,3,4])
```

* Can be used as dictionary keys

## Not Only Functional

* Pure functional programs can be difficult to implement
* Combine with procedural and object-oriented program parts
* Choose right tool, for the task at hand
* Develop a feeling where a functional approach can be beneficial


## Avoid Side effects

```
class MyClass(object):
  """
  Example for init-only definitions
  """
  def __init__(self):
    self.attr1 = self._make_attr1()
    self.attr2 = self._make_attr2()

  @staticmethod
  def _make_sttr1():
    """
    Do mant things to create att1
    """
    attr1 = []
    return attr1
```

* Set all attributes in __init__ (Pylint will remind you)
* Actual useful application of static methods
* Fewer side effects than setting attributes outside __init__
* Your beloved classes and instances are still here
* Inheritance without overriding __init__ and use super,child class implements own __make_attr1()__

## Freeze Classes

```
class Reader(object):
  def __init__(self):
    self.data = self._read()

  @staticmethod
  def _read():
    data = []
    with open('data.txt') as fobj:
      for line in fobj:
        data.append(tuple(line.split()))
    return tuple(data)
```

* Mutable data structures are useful for reading data
* "Freeze" to get read-only version
* No future, unwanted modifications possible

## Freeze Classes - One Liner Version

* Still kind of readable

```
class Reader(object):
  def __init__(self):
    self.data = self._read()

  @staticmethod
  def _read():
    return tuple(tuple(line.split()) for line in open('data.txt'))
```

## Stepwise Freezing and Thawing I

```
class FrozenUnFrozen(object):
  def __init__(self):
    self.__repr = {}
    self.__frozen = False
  def __getitem__(self, key):
    return self.__repr[key]
  def __setitem__(self, key, value):
    if self.__frozen:
      raise KeyError('Cannot change key %r' % key)
    self.__repr[key] = value
  def freeze(self):
    self.__frozen = True
  def unfreeze(self):
    self.__forzen = False
```

## Stepwise Freezing and Thawing II

```
>>>> fuf = FrozenUnFrozen()
>>>> fuf['a'] = 100
>>>> fuf['a']
100
>>>> fuf.freeze()
>>>> fuf['a'] = 100
Traceback (most recent cell lest):
KeyError: Cannot change key 'a'"
>>>> fuf['a']
100
>>>> fuf.unfreeze()
>>>> fuf['a'] = 100
```

## Use Case for Freezing

* Legacy code: Where are data modified?
* Complex systems: Detect unwanted modifications

## Immutable Data Structures - Counter Arguments

* Some algorithms maybe diffcult to implement
* Can be rather inefficient - repeated re-allocation of memory
  * Antipattern string concatanation

```
>>>> s += 'text'
```

* Try this in Jypthon and (standrad-)PyPy

## Lazy Evaluation

* Iterators and generators

```
>>> [ x * 2 for x in xrange(5)]
>>> ( x * 2 for x in xrange(5))

>>> sum(x * x for x in xrange(10))
```

* Saves memory and possibly CPU time

## Itertools - "Lazy Programmers are Good Programmers"

* Module itertools offers tools for the work with iteratoes

```
it.izip('abc', 'xyz')
<itertools.izp object at 0x00FA9FS0>
list(it.izip('abc', 'xyz'))
[('a', 'x'), ('b','y',('c','z'))]
```

```
list(it.islice(iter(range(10)), None, 8, 2))
[0,2,4,6]
range(10)[:8:2]
[0,2,4,6]
```

## Pipelining -Chaining Commands

* Generators make good pipelines
* Useful for workflow problems
* Example parsing of a log file

## Generators - Pull

* Log file:

```
35
29
75
36
28
54
# comment
54
56
```

## Generators - Pull - Import

```
import sys
import time
```

## Generators - Pull - Read File

```
def read_forever(fobj):
  counter = 0
  while True:
    line = fobj.readLine()
    if not line:
      time.sleep(0.1)
      continue
    yield line
```

## Generators - Pull - Filter Out Comment lines

```
def filter_comments(lines):
  for line in lines:
    if not line.strip().startwith("#"):
      yield line
```

## Generators - Pull - Convert Numbers

```
def get_number(lines):
  for line in lines:
    yield int(line.split()[-1])
```


## Generators - Pull - Initialize  the Process I

```
def show_sum(file_name = 'oyr.txt'):
  lines = read_forevery(open(file_name))
  filtered_lines = filter_comments(lines)
  numbers = get_number(filtered_lines)
  sum_ = 0
  try:
    for number in numbers:
      sum_ += number
      sys.stdout.write('sum: %d\r' % sum_)
      sys.stdout.flush
  except KeyboardInterrupt:
    print 'Sum:', sum_
```

## Coroutines - Push

* Log file:
```
Error: 78
DEBUG: 72
WAN: 99
CRITICAL: 97
Error: 78
Error: 89
Error: 46
```

## Coroutines - Push -Initialize with a Decorator

```
def init_coroutine(func):
  functools.wraps(func)
  def init(*args, **kwargs):
    gen = func(*args, **kwargs)
    next(gen)
    return gen
  return init
```

## Coroutines - Push - Read the File

def read_forever(fobj, target):
  counter = 0
  while True:
    line = fobj.readline()
    if not line:
      time.sleep(0.1)
      continue
    target.send(line)

## Coroutines - Push - Filter Out Comments

```
@init_coroutine
def filter_comments(target):
  while True:
    line = yield
    if not line.strip().startwith('#'):
      target.send(line)
```

## Coroutines - Push - Convert Numbers

```
@init_coroutine
def get_number(targets):
  while True:
    line = yield
    level, number = line.split(':')
    number = int(number)
    tagets[level].send(number)
```

## Coroutines - Push - Consumer I

```
@init_coroutine
def fatal():
  sum_ = 0
  while True:
    value = yield
    sum_ += value
    sys.stdout.write('FATAL  sum:%7d\s' % sum_)
    sys.stdout.flush()
```

## Coroutines - Push - Consumer II

```
@init_coroutine
def fatal():
  sum_ = 0
  while True:
    value = yield
    sum_ += value
    sys.stdout.write('CRITICAL  sum:%7d\s' % sum_)
```

## Coroutines - Push - All Consumers

```
TARGETS = {
  'CRITICAL': critical(),
  'DEBUG': debug(),
  'FATAL': fatal(),
}
```

## Conroutines - Push - Initialize

```
def show_sum(file_name='out.txt'):
  read_forever(open(file_name), filter_comments(get_number(TARGETS)))

if __name__ == '__main__':
  show_sum(sys.argv[1])
``

## Conroutines - Push - Initialize

```
def show_sum(file_name='out.txt'):
  read_forever(open(file_name), filter_comments(get_number(TARGETS)))

if __name__ == '__main__':
  show_sum(sys.argv[1])
``

## Conclusions

* Python offers useful functional features
* But it is no pure functional language
* For some tasks the functional approach works veru well
* For some others much less
* Combine and switch back and forth with oo and procedural style
& "Stay pythonic, be pragmatic"
