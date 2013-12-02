title: 使用markdown写作
date: 2013-12-02 12:52:09
tags:
---

## 我为什么使用Markdown

* 跨平台

首先我觉得使用Markdown编写文档语法更简洁，而且由于本身是文本文件，所以在任何平台都能找到一个适合的工具，甚至最简单的文本编辑器就可以了。特别是对程序猿来说，经常需要在各种环境下工作,所以跨平台性显得尤为重要。

* 良好的版本控制

其次也是由于是简单文本的缘故所以，具有更好的版本控制性，可以使用**git diff**进行版本对比，当然doc和pdf想做到这点基本上除了不停更新文档编号外别无他法。


## 让编写Markdown更有趣

### 1, OmniMarkupPreviewer 

这款插件的作者就在我旁边位子，技术大牛。直接甩掉Markdown Preview好几条大街，提供了多种格式文档的实时编辑预览功能。 具体详情，请移步[README.md](https://github.com/timonwong/OmniMarkupPreviewer/blob/master/README.md)

在编写md是的快捷键

**Windows, Linux:**

* <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>O</kbd>: Preview Markup in Browser.
* <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd>: Export Markup as HTML.
* <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd>: Copy Markup as HTML.

**OSX:**

* <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>O</kbd>: Preview Markup in Browser.
* <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>X</kbd>: Export Markup as HTML.
* <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd>: Copy Markup as HTML.


### 2, 万能的pandoc

>Pandoc是一个用于从一种标记格式转换为另一种的Haskell库，是把文件从一种标记语言格式转换到另一种格式的瑞士军刀。 


关于pandoc有多麽牛B这件事，请参考官网上的那个图片[官网地址](http://johnmacfarlane.net/pandoc/)

安装过程就直接忽略不计了

下面是几个使用示例

* 将md转换为doc文件

```
pandoc -s -S doc.md -o doc.docx
```

* 将md转换为pdf文件

```
pandoc -s -S doc.md -o doc.pdf
```

## markdown基础语法

### 1, 重点短语

```*斜体*  _斜体_```

*斜体*

```**加粗**  __加粗__ ``` 

**加粗** 

```***混合***  ___混合___```  

***混合***


### 2, 链接

段内链接: 

```[示例](http://google.com  "链接标题")``` 

参考式

```[example][id]```

```[id]: http://google.com  "Link Title"```


### 3, 图片

段内:

```![alt text](http://www.google.com/images/nav_logo6.png "Title")```

引用:

```![alt text][id]```

```[id]: http://www.google.com/images/nav_logo6.png "Title"```

### 4, 标题

Setext风格:

```
标题一
====================
```

```
标题二
---------------------
```

Atx风格:

```
# 标题一
### 标题三
###### 标题六
```

### 5, 列表:

#### 有序列表: 

* 有序列表 序号.空格 

```
1. Ordered list item
2. Ordered list item
3. Ordered list item
```

#### 无序列表: 

三种等价的无序列表

```
- Dashed list item
- Dashed list item
- Dashed list item
```

```
+ Plus list item
+ Plus list item
+ Plus list item
```

```
* Bulleted list item
* Bulleted list item
* Bulleted list item
```


### 6, 引用文字

```
> Email-style angle brackets
> are used for blockquotes.
>   
>> And, they can be nested.
>
> ## Headers in blockquotes
> 
> * You can quote a list.
> * Etc.
```

### 7, 代码段

在文章中使用代码段使用``` code ```标记

```
function helloword(){
   console.log('hello'); 
}
```

### 8, 分割符

markdown有三种符号表示换行符

语法

```
---
    
* * *
    
- - - - 
```

### 9, 手动换行

手动换行使用1个以上回车

## 结束

最近我还在ipad上找了一款免费的markdown **writedown lite**写作工具，基本可以随时随地的写文章而不受时间限制.
