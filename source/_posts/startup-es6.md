title: ES6 10分钟入门
date: 2016-9-18 15:36:15
tags: web
---

#### 转换器

目前ES6并没有在主流浏览器上直接支持，如果想使用ES6的新特性需要使用转换器，将ES6的代码转换成ES5

* Tracerur
* Babeljs

#### 变量定义Let

在ES6之前的版本当中我们使用var来声明变量，但是var的行为和其它编程语言相比显得非常奇怪，通常而言变量的作用范围只存在于其声明的作用域当中，但是在js中var直接声明的变量不同，无论何时声明，其作用域都是顶级作用域

我们在if作用域中声明了name变量

```
function getPonyFullName(pony) {
    if (pony.isChampion) {
        var name = 'Champion ' + pony.name;
        return name;
    }
    return pony.name;
}
```

其等同于

```
function getPonyFullName(pony) {
    var name;
    if (pony.isChampion) {
      name = 'Champion ' + pony.name;
      return name;
    }
    // name is still accessible here,
    // and can have a value from the if block
    return pony.name;
}
```

无论在何处使用var声明变量，其作用域都是作用的整个函数块当中

而es6中引入了let关键字用于声明变量，可以确保变量的作用域只存在于其声明的地方

```
function getPonyFullName(pony) {
  if (pony.isChampion) {
      let name = 'Champion ' + pony.name;
      return name;
    }
    // name is not accessible here
    return pony.name;
  }
}
```

#### 常量定义-Constants

除了let意外，es6还定义了一个新的keywords用于定义常量**const**,当你使用const声明一个变量时，这个变量必须立即初始化，并且不能再次赋值

```
const PONIES_IN_RACE = 6;
PONIES_IN_RACE = 7; // SyntaxError
```

和let一样，const声明的常量作用范围和其声明范围一致；

主要注意的是，当你使用对象初始化一个常量是你是可以继续修改这个常量的

```
const PONY = {}
PONY.color = 'blue'
```

但是你不能对这个常量重新赋值

```
const PONY = {};
PONY = {color: 'red'} // SyntaxError
```

#### 创建对象

在新的ES6中当我们要创建对象的属性和变量名一致时，我们可以通过ES6提供的语法糖快速创建对象

```
function createPony() {
    let name = 'Rainbow Dash';
    let color = 'blue';
    return { name: name, color: color };
}
```

可以简化为

```
function createPony() {
    let name = 'Rainbow Dash';
    let color = 'blue';
    return { name, color };
}
```

#### 解构赋值

在ES6中支持一种新的方式来从对象或者数组中获取值

在ES5中

```
var httpOptions = { timeout: 2000, isCache: true };

var httpTimeout = httpOptions.timeout;
var httpCache = httpOptions.isCache;
```

而在ES6中我们可以这样写

```
let httpOptions = { timeout: 2000, isCache: true };

let { timeout: httpTimeout, isCache: httpCache } = httpOptions;
```

当你希望声明的变量和对象的属性一致时，甚至可以直接写成

```
let httpOptions = { timeout: 2000, isCache: true };

let { timeout, isCache } = httpOptions;
// 这里定义了名为timeout和isCache的两个变量
```

对于嵌套的对象同样适用

```
let httpOptions = { timeout: 2000, cache: { age: 2 } };

let { cache: { age } } = httpOptions;
// 这里我们得到一个名为age的变量其值为2
```

解构赋值同样适用于数组对象

```
let timeouts = [1000, 2000, 3000];

let [shortTimeout, mediumTimeout] = timeouts;
```

另外一个有趣的用法是在函数的多返回值上

```
function randomPonyInRace(){
    let pony = { name: 'Rainbow Dash' };
    let position = 2;
    // ...
    return { pony, position };
}
let { position, pony } = randomPonyInRace();
```

同理如果你只关心函数返回值得一部分，那么这样既可

```
function randomPonyInRace(){
    let pony = { name: 'Rainbow Dash' };
    let position = 2;
    // ...
    return { pony, position };
}
let { pony } = randomPonyInRace();
```

#### 默认参数和默认值

当我们定义函数时，对于可选参数我们可以这样写：

```
function getPonies(size, page) {
    size = size || 10;
    page = page || 1;
    // ...
    server.get(size, page);
}
```

可选参数通常具有默认值，当“||”操作左边的值为undefined时，将会返回右边的值

所以此时，当使用函数时

```
getPonies(20, 2);
getPonies(); // 等价于 getPonies(10, 1);
getPonies(15); // 等价于 getPonies(15, 1);
```

当然为了更好的可读性，ES6还提供了更好的方式，我们还可以直接在函数声明时定义默认值

```
function getPonies(size = 10, page = 1) {
    server.get(size, page);
}
```

除此之外，默认参数的的值还可以是函数调用

```
function getPonies(size = defaultSize(), page = 1) {
    //  defaultSize方法将在未提供size参数的情况下调用
    server.get(size, page);
}
```

甚至还可以使用其它变量，全局变量，函数参数

```
function getPonies(size = defaultSize(), page = size - 1) {
    server.get(size, page);
}
```

默认参数在解构赋值时同样适用

```
let { timeout = 1000 } = httpOptions;
```

#### 可变长参数

在之前版本的JS当中我们可以通过arguments来获取函数的所有操作

```
function addPonies(ponies) {
    for (var i = 0; i < arguments.length; i++) {
      poniesInRace.push(arguments[i]);
    }
 }
 addPonies('Rainbow Dash', 'Pinkie Pie');
```

在上面的例子里面我们声明了ponies变量，但是实际上没有任何用处

在ES6中提供了更好的语法来帮助我们创建可变参数的函数

```
function addPonies(...ponies) {
    for (let pony of ponies) {
      poniesInRace.push(pony);
} }
```

相比于ES5中的实现，此时ponies是一个真正的数组对象，我们可以更加显示的进行操作

该操作在解构赋值时同样适用

```
let [winner, ...losers] = poniesInRace;
```

该操作同时还支持反向操作，如：

```
let ponyPrices = [12, 3, 4];
let minPrice = Math.min(...ponyPrices);
```

#### 类-class

在ES6中引入的另外一个非常重要的概念类。

在新的ES6语法当中我们可以非常简单的去创建一个对象

```
class Pony {
    constructor(color) {
      this.color = color;
    }
    toString() {
      return `${this.color} pony`;
    }
}

let bluePony = new Pony('blue');
console.log(bluePony.toString()); // blue pony
```

同样的ES6中的class也支持静态方法

```
class Pony {
    static defaultSpeed() {
        return 10;
    }
}
let speed = Pony.defaultSpeed();
```

class还可以包含自己的get,set属性

```
class Pony {
    get color() {
      console.log('get color');
      return this._color;
    }
    set color(newColor) {
      console.log(`set color ${newColor}`);
      this._color = newColor;
    }
}

let pony = new Pony();
pony.color = 'red'; // set color red
console.log(pony.color); // get color
```

类的继承也是同样支持的

```
class Animal {
    speed() {
        return 10;
    }
}

class Pony extends Animal {
}

let pony = new Pony();
console.log(pony.speed());
```

Animal被称为基类，Pony则称为派生类。派生类可以覆盖基类的方法

```
class Animal {
    speed() {
        return 10;
    }
}

class Pony extends Animal {
    speed() {
      return super.speed() + 10;
    }
}
let pony = new Pony();
console.log(pony.speed());
```

通过关键字super我们可以在派生类中调用基的方法

```
class Animal {
    constructor(speed) {
        this.speed = speed;
    }
}
class Pony extends Animal {

    constructor(speed, color) {
        super(speed);
        this.color = color;
    }
}

let pony = new Pony(20, 'blue');
console.log(pony.speed); // 20
```

#### Promises

在ES5中当我们使用异步编程如ajax时我们通常会定义一些列的回调函数。

大量使用回调函数会严重影响代码的可读性，以及可维护性。陷入我们俗称的依赖地狱中

```
getUser(login, function (user) {
    getRights(user, function (rights) {
      updateMenu(rights);
    });
});
```

在ES6中引用Promise的最主要目的就是为了简化我们的异步编程操作

对比如下基于promises我们的异步代码：

```
getUser(login)
    .then(function (user) {
      return getRights(user);
    })
    .then(function (rights) {
      updateMenu(rights);
})
```

相比而言基于promises的代码具有更好的可读性

对于一个Promises对象而言，其包含三种基本状态：

* pending: 操作还未完成时
* fulfilled： 操作完成并且成功
* rejected： 操作失败时

初始化一个Promises对象需要两个参数resilove和reject

```
let getUser = function (login) {
    return new Promise(function (resolve, reject){
      // async stuff, like fetching users from server, returning a response
      if (response.status === 200) {
        resolve(response.data);
      } else {
        reject('No user');
} });
};
```

对Promises处于fulfilled状态时将会调用resolve函数，而当操作失败时则调用reject函数

一旦你创建完成一个promises对象之后

你就可以通过then方法注册一个回调函数

```
getUser(login)
    .then(function (user) {
      console.log(user);
    })
```

另外一个有趣的用法是扁平化代码结构,当resolve函数的返回值同样是一个promises时

```
 getUser(login)
    .then(function (user) {
      return getRights(user) // getRights is returning a promise
        .then(function (rights) {
          return updateMenu(rights);
        });
})
```

可以简化成

```
   getUser(login)
    .then(function (user) {
      return getRights(user); // getRights 返回一个 promise
    })
    .then(function (rights) {
      return updateMenu(rights);
})
```

对于异常处理，你可以通过一个函数处理所有promise的错误和异常

```
getUser(login)
    .then(function (user) {
      return getRights(user);
    })
    .then(function (rights) {
      return updateMenu(rights);
    })
    .catch(function (error) {
      console.log(error);
    })
```

#### 箭头函数

ES6中箭头函数也是一个非常有用的特性，它可以帮组我们大大简化我们的代码，尤其是对于回调函数以及匿名函数

匿名函数的情况

```
getUser(login)
    .then(function (user) {
      return getRights(user); // getRights is returning a promise
    })
    .then(function (rights) {
      return updateMenu(rights);
})
```

可以简化成

```
getUser(login)
    .then(user => getRights(user))
    .then(rights => updateMenu(rights))
```

在回调函数当中我们经常会遇到this作用域的问题,在ES5中我们可以通过对重新定义变量指向this或则使用作用域bind

```
var maxFinder = {
    max: 0,
    find: function (numbers) {
      var self = this;
      numbers.forEach(
        function (element) {
          if (element > self.max) {
            self.max = element;
          }
}); }
};
maxFinder.find([2, 3, 4]);

console.log(maxFinder.max);
```

bind作用域

```
var maxFinder = {
    max: 0,
    find: function (numbers) {
    numbers.forEach(
        function (element) {
        if (element > this.max) {
            this.max = element;
        }
    }.bind(this));
}
};
maxFinder.find([2, 3, 4]);

console.log(maxFinder.max);
```

而在ES6中我们可以直接使用箭头函数

```
let maxFinder = {
    max: 0,
    find: function (numbers) {
        numbers.forEach(element => {
            if (element > this.max) {
                this.max = element;
            }
        }) ;
    }
};

maxFinder.find([2, 3, 4]);

console.log(maxFinder.max);
```

#### Sets and Maps

相比于ES5而言，在ES6中我们有了新的Set和Map来创建专门的数据结构

```
let cedric = { id: 1, name: 'Cedric' };
let users = new Map();
users.set(cedric.id, cedric); // adds a user
console.log(users.has(cedric.id)); // true
console.log(users.size); // 1
users.delete(cedric.id); // removes the user

```

```
let cedric = { id: 1, name: 'Cedric' };
let users = new Set();
users.add(cedric); // adds a user
console.log(users.has(cedric)); // true
console.log(users.size); // 1
users.delete(cedric); // removes the user
```

#### 模板字符串

在ES5当中对字符串进行格式化通常是一件比较麻烦的事情

```
let fullname = 'Miss ' + firstname + ' ' + lastname;
```

模板字符串可以帮组我们大大简化这个操作

```
let fullname = `Miss ${firstname} ${lastname}`;
```

#### Modules

在过去原生JS一直缺乏模块管理机制，在过去我们经常听到CommonJS规范，以及AMD规范。响应的我们可以使用诸如RequireJS这样的工具来模拟模块管理。但所有的这些都不是实时上的标准

而现在在ES6中终于有了标准的原生模块管理机制

service.js

```
export function bet(race, pony) {
    // ...
}
export function start(race) {
// ...
}
```

使用新的export关键字可以帮助我们快速定义对外暴露的两个函数

当我们需要在其它模块中使用service.js定义的函数时

```
import { bet, start } from './races_service';
bet(race, pony1);
start(race);

```

同时在使用import导入模块时，我们还能设置响应的别名

```
import { start as startRace } from './service';

startRace(race);
```

当你需要使用模块提供的所有功能时，还可以使用“*”

```
import * as racesService from './service'
racesService.bet(race, pony1);
racesService.start(race);
```

如果你的模块只有一个方法,或者变量，或者类时可以直接使用export default


```
// pony.js
export default class Pony {
}
// service.js
import Pony from './pony';
```

### 函数式编程

#### filter

#### map

#### reduce
