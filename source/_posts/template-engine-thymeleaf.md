title: Java轻量级模板引擎Thymeleaf
date: 2015-03-17 15:02:11
tags: Java
---

Thymeleaf是一个开源的Java模板引擎库。

它的核心目标是提供一种优雅的，结构良好的的方式去创建我们所需要的模板。

为了实现这个目标Thymeleaf全部基于XML标签和属性去定义模板的处理逻辑，而不是想其他模板引擎一样在模板中编写逻辑代码。
所以Thymeleaf项目与其他模板引擎的最大优势，其模板文件本身也是一个格式良好的HTML文件，并且可以直接被浏览器打开。改变了在传统模板引擎下前端设计人员和后端开发人员的协作方式，能有效的提高工作效率。

<!--图片1， 传统模板引擎工作方式 VS Thymeleaf模板引擎工作方式-->

其实根据上面提到的内容Thymeleaf非常适合去处理XHTML/HTML5这类模板。当然也可以处理其他任何的XML模板

<!-- more -->

## 为什么要选择Thymeleaf?

| 模板引擎    | 支持的文件格式          |
| -------   | ----------------------|
| Thymeleaf |  XML/HTML/XHTML/HTML5 |
| Freemaker |  任何类型               |
| Velo***   |  任何类型               |

相比于其他模板引擎，Thymeleaf只专注于XML，这使得它能一非常优雅的方式去处理我们的前端网页模板。 所以如果你是希望为你的Web应用引入一款模板引擎Thymeleaf是不二选择，如果你是还需要处理其他类型的模板那么Thymeleaf并不适合你。

JSP Tag Library:

```
<form:inputText name="userName" value="${user.name}" />
```

Thymeleaf template:

```
￼￼<input type="text" name="userName" value="James Carrot" th:value="${user.name}" />
```

对比以上两个例子，我们可以知道基于Thymeleaf的模板，即使在模板引擎处理之前也能正确的被浏览器解析并且显示。

如果需要，你可以让你的设计人员和开发人员在同一套模板文件上工作，从而减少了将静态原型转换为模板文件的工作量。

## 表达式语句

对于Thymeleaf模板引擎而言，第一步需要理解的就是表达式和字面量。

表达式主要包含以下几种类型：

* "${...} 变量表达式：用于获取对象的值；"
* "*{...} 属性选择表达式： 一般与th:with配合使用用于简化表达式内容；"
* "#{...} 用于获取国际化配置文件内容 messages.properties；"
* "@{...} 链接表达式： 由thymeleaf模板引擎负责解析应用的ContextPath"

在表达式中的字面量有包含：

文本字面量，数字字面量，bool字面量，Null字面量等。相应的也支持直接在表达式中进行boolean运算，数学运算，字符串操作等。

通过灵活的组合和使用表达式内容我们可以非常方便的获取所需的信息

```
‘user is type of ’ + ( $(user.isAdmin())? ‘Administrator’ ：($(user.type ?: ‘Unkown’)))
```

## 面向原型的模板设计

> 因为专一所以美丽

最开始我们已经说过Thymeleaf是只针对xml的模板引擎，所以它完全遵循xml的语法，而不是添加额外的控制语法。
在处理基于Thymeleaf的网页模板时我们可以非常方便的使用其提供的xml标签设置模板的行为。
诸如去设置input的value属性：


```
<input type=“submit” value=“Subscribe me!” th:attr=“value=#{submit}”>
```

直接用浏览器打开时，模板可以被浏览器正常打开，当然如果经过服务器端处理后，就会更具我们动态注入的值而变化。

或者是这样一次设置多个属性值：

```
<img src=“logo.png” th:attr=“title=#{logo},alt=#{logo}” >
```

当然，th:attr处理可能并不是那么优美，所以thymeleaf支持所有html属性的直接设置

```
<input type=“submit” value=“Subscribe me!” th:value=“#{submit}”>
```

或者这样

```
<img src=“logo.png” th:alt-title=“#{logo}” >
```

> HTML5 Friendly

当然，它更可以这样:

```
<img src=“logo.png” data-th-src=“#{logo}” >
```

提供基于标准html5的语法。

> 循环

在原型设计阶段我们通常会包含大量的用于测试界面的网页内容，比如这样：

```
<table>
<thead>
<tr>
  <th colspan="1" rowspan="1">NAME</th>
  <th colspan="1" rowspan="1">PRICE</th> <th colspan="1" rowspan="1">IN STOCK</th>
</tr>
<thead>
<tbody>
<tr>
  <td colspan="1" rowspan="1">Fresh Sweet Basil</td> <td colspan="1" rowspan="1">4.99</td>
  <td colspan="1" rowspan="1">yes</td>
</tr>
<tr class="odd">
  <td colspan="1" rowspan="1">Italian Tomato</td>
  <td colspan="1" rowspan="1">1.25</td>
  <td colspan="1" rowspan="1">no</td>
</tr>
<tr>
  <td colspan="1" rowspan="1">Yellow Bell Pepper</td>
  <td colspan="1" rowspan="1">2.50</td>
  <td colspan="1" rowspan="1">yes</td>
</tr>
<tr class="odd">
  <td colspan="1" rowspan="1">Old Cheddar</td>
  <td colspan="1" rowspan="1">18.75</td>
  <td colspan="1" rowspan="1">yes</td>
</tr>
</tbody>
</table>
```


所以采用thymeleaf时，我们可以这样：


```
<table>
<thead>
<tr>
  <th colspan="1" rowspan="1">NAME</th>
  <th colspan="1" rowspan="1">PRICE</th> <th colspan="1" rowspan="1">IN STOCK</th>
</tr>
<thead>
<tbody th:remove="all-but-first">
<tr th:each="people : ${peoples}">
  <td colspan="1" rowspan="1" th:text="${people.name}">Fresh Sweet Basil</td> <td colspan="1" rowspan="1" th:text="people.srlary">4.99</td>
  <td colspan="1" rowspan="1">yes</td>
</tr>
<tr class="odd">
  <td colspan="1" rowspan="1">Italian Tomato</td>
  <td colspan="1" rowspan="1">1.25</td>
  <td colspan="1" rowspan="1">no</td>
</tr>
<tr>
  <td colspan="1" rowspan="1">Yellow Bell Pepper</td>
  <td colspan="1" rowspan="1">2.50</td>
  <td colspan="1" rowspan="1">yes</td>
</tr>
<tr class="odd">
  <td colspan="1" rowspan="1">Old Cheddar</td>
  <td colspan="1" rowspan="1">18.75</td>
  <td colspan="1" rowspan="1">yes</td>
</tr>
</tbody>
</table>
```

> 天下武功为快不破

正式由于Thymeleaf采用了如此自然的基于xml的语法，以及对html的良好的支持，可以让我们更快更好的完成对于应用的开发工作。
