title: （译）Why Ramda
date: 2016-04-16 11:37:51
tags:
---

译文，原文地址：[http://fr.umio.us/why-ramda/](http://fr.umio.us/why-ramda/)

<!-- more -->

当buzzdecafe最近向大家介绍了Ramda之后，这里基本上存在两种截然不同的反应。那些已经习惯在Javascript或者其它语言中使用函数式编程的人大部分反应是“Cool”. 他们可能会感到兴奋或者只是注意到Ramda可能作为另一个工具，并且他们理解这是什么。

而另一类的人的反应则是:Huh?这是什么鬼？

对于那些不适用函数式编程的人而言，Ramda似乎并没有存在的意义。而且它大部分的能力已经被Underscore以及LoDash实现了。

当然，对于那些想要保持使用OO编码风格的人而言，他们并没有错。Ramda并不能向你提供太多的帮助。

当时它确实提供了另外一种截然不同编码风格，是一种纯粹的函数式编程语言的风格。Ramda使得你可以轻松的通过功能组合构建复杂逻辑。需要注意的是对于任何允许你通过组合函数的库都能使你可以完成功能组合；这里的关键问题在于，“如果让它变得简单”。

接下来，让我们来看看Ramda是如何工作的。

“TODO List”似乎经常用于比较不同的Web框架，所以我们也会使用这个例子来向大家展示Ramda的能力；首先我们想要能够过滤TODO列表中已经完成的项。

使用原生的Array方法，我们可能写出这样的代码:

```
var incompleteTasks = tasks.filter(function(task) {
    return !tasks.complete;
})
```

而使用LoDash,这个将会更简单

```
var incompleteTasks = _.filter(tasks, {complete: false})
```

在这些例子中我们都将能够得到过滤后的列表。

而在Ramda中，我们可能通过这种方式：

```
var incomplete = R.filter(R.where({complete: false}));
```

你有注意到他们的区别吗？在代码当中没有涉及到任何的任务列表，Ramda代码只提供了一个函数。

为了能够得到过滤后的task集合，我们仍然需要在调用该函数时提供task列表。

由于我们当前得到的是一个函数，所以我们可以非常轻易的将它运用在其他任何的数据操作当中。想想一下如果我们已经存在一个函数叫`groupByUser`,这个函数可以更具用户对TODO列表进行分组，那么现在我们可以非常简单的创建一个新的函数：

```
var activeByUser = R.compose(groupByUser, incomplete)
```

这个函数可以帮助我们过滤出所有的未完成的task列表，并且按照用户进行组合。

当然，由于这个函数功能本身非常简单。如果愿意，我们也可以写出同样功能的代码如下：

```
var activeByUser = function(tasks) {
  return groupByUser(incomplete(tasks))
}
```

组合作为函数式编程的关键技术，可以让我们实现相同功能的同时，避免手动就组合不同的函数功能。让我们来看看当我们想要给这个函数添加一些新功能时会发生什么？ 如果我们需要按照截止时间对TODO列表进行排序？

```
var sortUserTaks = R.compose(R.map(R.sortBy(R.prop("dueDate"))), activeByUser)
```

### All in one?

细心的读者可能已经注意到了我们的compose函数允许多个参数，所以为什么我们通过一个调用来完成以上的功能？

```
var sortUserTasks = R.compose(R.mapObj(R.sortBy(R.prop('dueDate'))), groupByUser, R.filter(R.where({complete: false})))
```

我的回答是，如果这里没有任何其他地方需要调用中间函数activeByUser以及incomplete可能是你这样使用的理由之一。但是这样会使得我们的函数非常难于调试，并且并没有为我们的diamante增加任何的可读性。

事实上，我想说的是我们在一个函数内容使用了相当复杂的内容，并且这部分内容是可能服用的，所以如果按照下面的方式来完成同样的功能可能会更好。

```
var sortByDate = R.sortBy(R.prop('dueDate'));
var sortUserTasks = R.compose(R.mapObj(sortByDate), activeByUser);
```

现在我们可以在任何需要通过due date对task进行排序的地方使用sortByDate这个函数了（事实上，我们基本上可以对于任何对象中包含dueDate的对象集合进行排序）

Oh, 但是等等，是不是有人说过我们需要通过逆序的方式来对due date进行排序呢？

```
var sortByDateDescend = R.compose(R.reverse, sortByDate);
var sortUserTasks = R.compose(R.mapObj(sortByDateDescend), activeByUser);
```

当然如果我们事先知道我们需要通过逆序的方式对列表进行排序，我们可能只会声明一个sortByDayeDescend的方法，但是我个人更习惯于保持着两个方法，这样可以防止需求改变对代码的影响，当然这都取决于你自己。

### Where's the Data?

到目前为止我们还没有使用任何的实际数据. 那这里到底发生了什么? 在没有数据的情况下进行了数据处理，这里恐怕需要你的一点耐心来理解这个事情。 当你使用函数式编程时，你的所有函数形成的是一个管道，每一个函数处理完数据之后就将结果传递给下一个函数，直到所有流程处理完后你才得到你所需要的结果。

到目前为止我们所构建的只是一个函数的集合

```
1. incomplete: [Task] -> [Task]
2. sortByDate: [Task] -> [Task]
3. sortByDateDescend: [Task] -> [Task]
4. activeByUser: [Task] -> {String: [Task]}
5. sortUserTasks: {String: [Task]} -> {String: [Task]}
```

虽然我们已经使用之前创建的函数构造了一个新的函数sortUserTasks， 并且这些函数都有明确的用途。 而这里我们似乎掩盖了一些事情，我们只是告诉你假如我们已经有了一个函数gourpByUser并且通过这个函数构建了activeByUser; 但是我们并没有真正的看到这个函数。 那么我们如何构建一个呢？

这里是一种可能性：

```
var groupByUser = R.partition(R.prop('username'));
```

partition函数使用了Ramda提供的*reduce*, Ramda中的*reduce*与*Array.prototype.reduce*非常像是。在其他的许多函数式编程语言当中，也被称为*fold1*。 这里我们并不打算深入的讨论这个特性。 prop('username')依次从每个对象中解析"username"属性，而partition函数将包含相同key的项添加到子列表当中

（这里是是不是通过一个闪亮的新函数分散了你的注意力？目前为止我还不打算提及真正的数据，抱歉，但是值得期待的是接下来马上又会有更多的强大的函数出现）

### But Wait, There's More

我们可以接着处理数据，直到我们满意为止，如果我们想象选取前5个列表元素，那么我们可以使用Ramda的take函数。所以如果我们要一次得到每一个用户的前5个列表项我们可以像下面这样处理：

```
var topFiveUserTasks = R.compose(R.mapObj(R.take(5)), sortUserTasks);
```

我们还可以只返回对象的属性的子集，比如我们只需要task项的title和due date，在这个数据结构中username是明显对于的属性，并且我们也并不需要其它系统知道这些属性。

这里我们可以使用Ramda提供的类似于SQL的select函数，这里我们叫做project:

```
var importantFields = R.project(['title', 'dueDate']);
var topDataAllUsers = R.compose(R.mapObj(importantFields), topFiveUserTasks);
```

我们在这里创建的这些函数似乎可以非常轻易的在其它的需要类似TODO应用的系统中进行复用。现在我们回顾一下我们完成的所有代码，如下所示：

```

var incomplete = R.filter(R.where({complete: false}));
var sortByDate = R.sortBy(R.prop('dueDate'));
var sortByDateDescend = R.compose(R.reverse, sortByDate);
var importantFields = R.project(['title', 'dueDate']);
var groupByUser = R.partition(R.prop('username'));
var activeByUser = R.compose(groupByUser, incomplete);
var topDataAllUsers = R.compose(R.mapObj(R.compose(importantFields,
    R.take(5), sortByDateDescend)), activeByUser);
```

### All Right, Already! My I See Some Data?

是的，当然可以。

现在已经是时候将数据导入我们的函数当中。但是需要注意的一点是，这些函数都接收相同的数据类型，一个TODO对象的集合。我们并没有明确的支出这个TODO的具体数据结构，但是我们清楚他们至少应该包含以下属性：

* complete: Boolean
* dueDate: String, 满足 YYYY-MM-DD格式
* title: String
* userName: String

那么如果我们有了一个 tasks的集合，我们如何使用呢？ 非常简单：

```
var results = topDataAllUsers(tasks);
```

就是这样？

恐怕确实是的，results对象可能的结构如下所示：

```
{
    Michael: [
        {dueDate: '2014-06-22', title: 'Integrate types with main code'},
        {dueDate: '2014-06-15', title: 'Finish algebraic types'},
        {dueDate: '2014-06-06', title: 'Types infrastucture'},
        {dueDate: '2014-05-24', title: 'Separating generators'},
        {dueDate: '2014-05-17', title: 'Add modulo function'}
    ],
    Richard: [
        {dueDate: '2014-06-22', title: 'API documentation'},
        {dueDate: '2014-06-15', title: 'Overview documentation'}
    ],
    Scott: [
        {dueDate: '2014-06-22', title: 'Complete build system'},
        {dueDate: '2014-06-15', title: 'Determine versioning scheme'},
        {dueDate: '2014-06-09', title: 'Add `mapObj`'},
        {dueDate: '2014-06-05', title: 'Fix `and`/`or`/`not`'},
        {dueDate: '2014-06-01', title: 'Fold algebra branch back in'}
    ]
}
```

有趣的是，你还可以在incomplete函数中使用，用过过滤列表：

```
var incompleteTasks = incomplete(tasks);
```

也许就会得到如下的结果：

```
[
    {
        username: 'Scott',
        title: 'Add `mapObj`',
        dueDate: '2014-06-09',
        complete: false,
        effort: 'low',
        priority: 'medium'
    }, {
        username: 'Michael',
        title: 'Finish algebraic types',
        dueDate: '2014-06-15',
        complete: true,
        effort: 'high',
        priority: 'high'
    } /*, ... */
]
```

当然同样可以使用这个集合应用到sortBydate，sortByDateDescend，importantFields，byUser或者是activeByUser。 因为他们都支持同样的数据结构，一个tasks的集合。通过简单的组合我们就可以构建一个庞大的工具集合

### New Requirements

在刚才的游戏当中，你已经学会了根据你的需求为函数添加新的特性。 你需要过滤所有的tasks并且按照用户组成集合，接着运行同样的过滤，排序并且获得特定用户的tasks列表，之后将生成的列表与之前产生的username产生mapping.

这些所有的逻辑目前都嵌套在topDataAllUsers当中，这个可能将我们的函数组合功能显得太激进了。但是我们可以非常轻易的对这个函数进行重构。正如平时一样，最困难的事情其实是如何给我们的新函数去一个好的名字。"gloss"可能并不合适，但是现在正是深夜，我已经尽力了。

```
var gloss = R.compose(importantFields, R.take(5), sortByDateDescend);
var topData = R.compose(gloss, incomplete);
var topDataAllUsers = R.compose(R.mapObj(gloss), activeByUser);
var byUser = R.use(R.filter).over(R.propEq("username"));
```

接下来当你可以这样进行调用：

```
var results = topData(byUser('Scott', tasks))
```

### I just Want My Data, Thanks

"好了，好了，这些功能确实很酷，但是现在我只想得到我的数据。 我不希望产生一堆只是在将来产生数据的函数，或者我能不能直接使用Ramda?"

当然可以。

来让我们看看我们最先完成的函数：

```
var incomplete = R.filter(R.where({complete: false}))
```

那么我们如何将这个转换一下然后得到我们需要的数据呢？ 非常简单：

```
var incompleteTasks = R.filter(R.where({complete: false}), tasks);
```

上面的方式对于我们刚才所有的其他函数都适用：只需要在调用时将tasks作为最后一个参数，这个时候你就能得到你所需要的数据。

### What Just Happened?

这是Ramda的另外一个主要的特定。所有Ramda提供的函数都是自动柯里化的。 这就意味着如果在调用函数时没有提供函数的所有参数，我们将只是返回给你一个新的函数，而这个函数所需的参数则是之前未调用未提供的参数。 所以对于*filter*函数，在定义时涉及到两个参数，一个是数组array，另外一个是用于过滤数组的布尔函数function。 在第一个班中中，我们并没有向filter提供values参数，所以filter只是简单的返回一个以array为参数的数组的新函数。 而在第二个版本中，我们在调用时传入了array参数，这个时候filter将会使用布尔函数进行计算，过滤出我们所需要的结果。

自动柯里化是的Ramda的函数以及function-first, data-last的API涉及使得Ramda能够非常容易的实现函数组合的编程风格。

更多的关于Ramda柯里化得资料可以参考一些其他的文章[Why Curry Helps](http://hughfdjackson.com/javascript/why-curry-helps/)

### Come On, Does this Stuff Really Work?

好吧，下面就是我们刚才讨论代码在JSFiddle中的运行结果：

<script async src="//jsfiddle.net/CrossEye/Gk6uu/embed/"></script>

简洁的代码也正是我们使用Ramda的另一个很好的理由。

### Using Ramda

你可以通过Github或者NPM获得 Ramda的代码。

如果需要在Node中使用，只需要如下操作：

```
npm install ramda
var R = require('ramda')
```

如果想在浏览器中使用，只需要引入即可：

```
<script src="path/to/yourCopyOf/ramda.js"></script>
```

当然我们也会尝试将Ramda尽快托管在某些CDN服务中。
