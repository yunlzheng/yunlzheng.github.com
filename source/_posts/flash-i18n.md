title: Flask 国际化记录
date: 2014-07-31 15:25:39
tags:
---

Flask Bable(i18n)
=================

## 安装Flask-Babel


    pip install flask-babel


## 设置Babel

Flask Application目录下创建babel.cfg, 内容如下：


    [python: **.py]
    [jinja2: **/templates/**.html]
    extensions=jinja2.ext.autoescape,jinja2.ext.with_

根据该配置Babel会自动扫描配置文件所描述的文件，并将需要进行国际化处理的内容提取出来。

## 生成翻译模版.pot


    pybabel extract -F babel.cfg -o messages.pot .


## 翻译

根据.pot文件生成特定语言的国际化文件：

    pybabel init -i messages.pot -d translations -l zh_CN


该操作会在当前目录下生成translations文件夹，并创建响应的message.po文件

## 编译翻译结果

使用如下命令将.po文件编译为.mo文件：

    pybabel compile -d translations


> 如果无法生成mo文件，请删除.po文件中的 **#fuzzy**

## 更新翻译

当更新了.pot文件后，我们需要根据pot更新相应语言的.po文件,执行：

    pybabel update -i messages.pot -d translations
