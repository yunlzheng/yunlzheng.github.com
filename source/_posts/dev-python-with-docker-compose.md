title: 使用docker-compose进行Python开发
date: 2015-06-06 11:33:42
tags: [Docker, Docker-compose]
---

Docker提供了容器级别的资源隔离，由于Python的外部依赖管理中存在的问题。我们通常会使用virtualenv来对不同的项目创建其唯一的依赖环境。这时利用Docker进行Python开发可以轻松解决不同Python项目之间的依赖隔离问题。

![](http://7pn5d3.com1.z0.glb.clouddn.com/blogoctopus_blocks_die.png)

作为应用程序我们通常需要依赖于多种外部服务比如数据库，缓存服务等等。Docker-compose就是在Docker容器的基础之上，提供了统一的容器编排语言。可以让你更轻松的利用Docker构建你的应用环境

<!-- more -->

## 编写Dockerfile

我们使用requirements.txt定义我们的第三方python包依赖

```
# requirements.txt
Flask
flask-assets
```

Project-Root
   |-- static
   |-- templates
   |-- server.py
   |-- requirements.txt
   |-- Dockerfile
   |-- docker-compose.yml

编写Dockerfile内容如下：

```
FROM ubuntu:14.04
ADD . /app
WORKDIR /app
RUN apt-get update
RUN apt-get install -y python-dev python-pip
RUN pip install -r requirements.txt
CMD server.py
```

在Dockerfile中我们主要目的是通过requirements.txt文件安装第三方的Python库依赖。利用Docker的容器隔离我们可以忽略掉很多我们在本地开发中需要使用的东西比如virtualenv

## 编排我们的Docker容器

由于案例中应用程序依赖了mongodb作为数据存储服务，以及redis作为缓存服务。在一般情况下作为开发团队要么我们搭建统一的mongodb,要不就每个人在开发机上单独部署。
而在Docker中我们则不在需要做这么多无用的事情。 Docker官方提供了大量的基础容器，基本涵盖了日常开发中我们需要的大部分依赖。 在[https://hub.docker.com/](https://hub.docker.com/)我们可以搜索到我们需要的基础镜像。

比如mongodb以及redis，在docker-hub上官方都提供了容器话的服务。

以redis容器为例，我们在本地搭建redis服务要做的事情主要包括两步。

```
docker pull redis:latest
docker run -d -p 63775:63775 redis
```

这个时候我们就可以通过访问0.0.0.0:63775来访问我们的redis服务器了。

我们也可以通过Docker原生的命令来连接我们的应用容器和redis容器，以使我们的代码能够正常的访问redis服务

```
docker run --name some-app --link some-redis:redis -d application-that-uses-redis
```

而事实上我们可以使用更加简化的方式来定义我们的容器组合管理，使用Docker-compose（前身Fig）来定义我们的容器组合关系

```
web:
 build: .
 ports:
  - 5000:5000
 links:
  - redis
  - mongo
 working_dir: /app
 volumes:
  - .:/app
 command: python server.py
redis:
 image: redis:latest
mongo:
 image: mongo
```

这里我们定义了3个容器web，redis,mongo。 其中web容器是通过当前目录的Dockerfile进行构建，同时将当前目录挂在到/app目录。 而redis和mongo则直接使用官方进行。
通过使用links我们可以在web容器中直接通过 'redis:6375'以及'mongo:21707'直接访问相应的服务。

## 开始Coding吧

```
docker-compose up
```

Docker会根据当前的目录下得Dockerfile构建基础镜像，并且使用python server.py运行程序，并且运行redis以及mongo服务。
同时由于使用了volumes挂载了本地目录到/app，此时如果我们是开启的Debug模式，我们就可以直接在本地使用你喜欢的文本编辑器去编写代码。
并且更新的代码能够实时被重新加载。

当然在使用Docker中最漫长的过程就是，下镜像，下镜像&下镜像。
