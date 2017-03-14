title: API网关那些儿
date: 2017-03-14 15:23:58
tags: microservice
---

> 现在越来越多的技术团队开始尝试采纳微服务架构进行产品开发。而基于微服务架构后后端服务通常而言是动态的，为了简化前端的调用逻辑，通常会引入API Gateway作为轻量级网关，同时API Gateway中也会实现相关的认证逻辑从而简化内部服务之间相互调用的复杂度，这边文章我们就来聊聊API Gateway的那些事。
> 关键字：API Gateway, Spring Cloud Zuul, Nginx，Consul，Consul-Template。

## 为什么需要API Gateway

* 简化客户端调用复杂度

在微服务架构模式下后端服务的实例数一般是动态的，对于客户端而言如何发现这些动态改变的服务实例的访问地址信息？因此在基于微服务的项目中为了简化前端的调用逻辑，通常会引入API Gateway作为轻量级网关，同时API Gateway中也会实现相关的认证逻辑从而简化内部服务之间相互调用的复杂度。

![http://7pn5d3.com1.z0.glb.clouddn.com/api_gateway.png](http://7pn5d3.com1.z0.glb.clouddn.com/api_gateway.png)

* 数据裁剪以及聚合

通常而言多余不同的客户端对于显示时对于数据的需求是不一致的，比如手机端或者Web端又或者在低延迟的网络环境或者高延迟的网络环境。

因此为了优化客户端的使用体验，API Gateway可以对通用性的响应数据进行裁剪以适应不同客户端的使用需求。同时还可以将多个API调用逻辑进行聚合，从而减少客户端的请求数，优化客户端用户体验

* 多渠道支持

当然我们还可以针对不同的渠道和客户端提供不同的API Gateway,对于该模式的使用由另外一个大家熟知的方式叫**Backend for front-end**, 在Backend for front-end模式当中，我们可以针对不同的客户端分别创建其BFF

![backend for front-end](http://7pn5d3.com1.z0.glb.clouddn.com/bff.png)

* 遗留系统的微服务化改造

对于系统系统而言进行微服务改造通常是由于原有的系统存在或多或少的问题，比如技术债务，代码质量，可维护性，可扩展性等等。API Gateway的模式同样适用于这一类遗留系统的改造，通过微服务化的改造逐步实现对原有系统中的问题的修复，从而提升对于原有业务**响应力**的提升。**通过引入抽象层，逐步使用新的实现替换旧的实现。**

![](http://7pn5d3.com1.z0.glb.clouddn.com/bff-process.png)

## 使用Zuul实现API网关

Spring Cloud的Zuul组件提供了轻量级网关的功能支持，通过定义路由规则可以快速实现一个轻量级的API网关

```
zuul:
  ignoredPatterns: /api/auth
  sensitive-headers: "*"
  ignoreLocalService: true
  retryable: false
  host:
    max-total-connections: 500
  routes:
    service01:
      pateh: /service01/**
      serviceId: service01
      stripPrefix: true
    thirdpart:
      pateh: /thirdpart/**
      url: http://thirdpart.api.com
```

同时除了通过serviceId关联已经注册到Consul的服务实例以外，我们也可以通过zuul直接定义实现对已有服务的直接集成。

这里我们就不过多介绍Zuul的细节，在实际使用中我们会发现直接使用Zuul会存在诸多问题，包括：

 * 性能问题：当存在大量请求超时后会造成Zuul阻塞，目前只能通过横向扩展Zuul实例实现对高并发的支持；
 * WebSocket的支持问题： Zuul中并不直接提供对WebSocket的支持，需要添加额外的过滤器实现对WebSocket的支持；

为了解决以上问题，可以通过在Zuul前端部署Nginx实现对Zuul实例的反向代理，同时适当的通过添加Cache以及请求压缩减少对后端Zuul实例的压力。

![](http://7pn5d3.com1.z0.glb.clouddn.com/nginx-with-zuul.png)

## 实现Nginx的动态代理

通过Nginx我们可以实现对多实例Zuul的请求代理，同时通过添加适当的缓存以及请求压缩配置可以提升前端UI的请求响应时间。这里需要解决的问题是Nginx如何动态发现Zuul实例信息并且将请求转发到Zuul当中。

[consul-template](https://github.com/hashicorp/consul-template)可以帮助我们解决以上问题,consul-template是一个命令行工具，结合consul实现配置文件的动态生成并且支持在配置文件发生变化后触发用户自定义命令。

我们使用了如下的Dockerfile用于构建我们的Nginx服务


```
FROM nginx:1.11.10

ADD consul-template /usr/local/bin

RUN mkdir /etc/consul-templates

# 模板文件
ADD nginx.tpl /etc/consul-templates/nginx.tpl
ENV CT_FILE /etc/consul-templates/nginx.tpl

ENV NX_FILE /etc/nginx/conf.d/default.conf # 目标文件

ENV SERVICE identity # 注册在Consul的服务名

COPY dist /usr/share/nginx/html
RUN mkdir -p /data/cache

CMD /usr/sbin/nginx -c /etc/nginx/nginx.conf  \
  & CONSUL_TEMPLATE_LOG=debug \
  consul-template -consul-addr=$CONSUL -template "$CT_FILE:$NX_FILE:/usr/sbin/nginx -s reload";
```

Nginx配置模板文件

```
# nginx.tpl
upstream api_server {
  least_conn;
  {{range service "identity"}}
  server  {{.Address}}:{{.Port}};
  {{else}}server 127.0.0.1:9191;{{end}}
}

server {
    listen       80;
    server_name  localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    location /api {
      proxy_pass http://api_server;
    }
}

```

其中

```
upstream api_server {
  least_conn;
  {{range service "identity"}}
  server  {{.Address}}:{{.Port}};
  {{else}}server 127.0.0.1:9191;{{end}}
}
```

会根据当前consul中注册的所有identity服务实例进行模板渲染，并且当配置文件内容发生变化后调用nginx -s reload重新加载Nginx配置从而实现对于后端服务实例的动态代理。

```
CMD /usr/sbin/nginx -c /etc/nginx/nginx.conf  \
  & CONSUL_TEMPLATE_LOG=debug \
  consul-template -consul-addr=$CONSUL -template "$CT_FILE:$NX_FILE:/usr/sbin/nginx -s reload";
```

## 其它的一些优化建议

启用Nginx的Gzip可以对服务器端响应内容进行压缩从而减少一定的客户端响应时间

```
gzip on;
gzip_min_length 1k;
gzip_buffers  4 32k;
gzip_types    text/plain application/x-javascript application/javascript text/xml text/css;
gzip_vary on;
```

缓存图片以及其它静态资源可以减少对Zuul实例的请求量

```
proxy_buffering on;
proxy_cache_valid any 10m;
proxy_cache_path /data/cache levels=1:2 keys_zone=my-cache:8m max_size=1000m inactive=600m;
proxy_temp_path /data/temp;
proxy_buffer_size 4k;
proxy_buffers 100 8k;

location ~* (images)    {
  proxy_pass http://api_server;
  # cache setting
  proxy_cache my-cache;
  proxy_cache_valid 200;
}

```

如果需要通过Nginx实现对Websocket的代理可以添加一下配置

```
  location /sockjs {
      proxy_pass http://api_server;

      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

      # WebSocket support (nginx 1.4)
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_connect_timeout 90;
      proxy_send_timeout 90;
      proxy_read_timeout 90;

      # !!!Support Spring Boot
      proxy_pass_header X-XSRF-TOKEN;
      proxy_set_header Origin "http://localhost:4000";
    }
```
