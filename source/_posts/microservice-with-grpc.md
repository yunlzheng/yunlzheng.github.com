title: 使用Grpc快速构建微服务
date: 2017-10-19 21:43:31
tags: grpc
---

## 微服务：独立的，去中心化的架构模式

> 独立的，去中心化的，围绕业务组织服务和管理数据，并且使用轻量级通讯机制

一个简单的模式可能如下图所示：

![http://7pn5d3.com1.z0.glb.clouddn.com/api_gateway.png](http://7pn5d3.com1.z0.glb.clouddn.com/api_gateway.png)

按照业务领域组织服务并且提供Restful接口，服务与服务之间通过轻量级通讯方式(Restful)进行数据交换和调用，对外使用轻量级网关简化客户端访问复杂度。基于服务发现和注册中心，完成服务之间的相互发现以及实现服务自身的横向扩展。


## Grpc： 通用的，高性能的RPC框架

> Google开发的基于HTTP/2标准设计的一个通用的，高性能的RPC框架

![https://grpc.io/img/landing-2.svg](https://grpc.io/img/landing-2.svg)

* 基于HTTP/2协议提供了更好的强的应用性能（节省带宽，减少TCP请求连接数）
* 基于ProtoBuf定义服务，面向接口对服务进行顶层设计
    ```
    syntax = "proto3";
    package example;
    message StringMessage {
    string value = 1;
    }

    service YourService {
    rpc Echo(StringMessage) returns (StringMessage) {}
    }
    ```
* 支持主流的编程语言，C++,Java,Python,Go,Ruby,Node.js，PHP等, 基于ProtoBuf生成相应的服务端和客户端代码。

相比在使用Restful方式完成服务之间的相互访问，GRPC能提供更好的性能，更低的延迟，并且生来适合与分布式系统。
同时基于标准化的IDL（ProtoBuf）来生成服务器端和客户端代码, ProtoBuf服务定义可以作为服务契约，因此可以更好的支持团队与团队之间的接口设计，开发，测试，协作等等。

因此在很多对于应用性能有较高要求的情况下，对外使用Restful提供API接口以支持不同的客户端渠道（Web, Mobile）而服务与服务之间则采用RPC方式进行交互。

## 扩展你的gRPC定义

使用gRPC基于Protobuf可以实现服务间的标准化定义，同时可以能够提供更好的应用性能，而在某些情况下我们依然希望我们的服务接口是能够支持Restful API的，比如在第一个图中，我们需要对外支持不同的渠道。因此我们可以在原有的Protobuf服务定义文件中添加更多的扩展，来讲Protobuf在定义服务的同时定义相应的Restful接口即可：

```
 syntax = "proto3";
 package example;
+
+import "google/api/annotations.proto";
+
 message StringMessage {
   string value = 1;
 }
 
 service YourService {
-  rpc Echo(StringMessage) returns (StringMessage) {}
+  rpc Echo(StringMessage) returns (StringMessage) {
+    option (google.api.http) = {
+      post: "/v1/example/echo"
+      body: "*"
+    };
+  }
 }
```

> 其中google/api/annotations.proto出自https://github.com/googleapis/googleapis，是Google提供的用于定义REST和gRPC的标准接口定义

## gRPC-Gateway: 从gRPC到HTTP

通过google提供的标准接口google/api/annotations.proto我们可以有效的对Protobuf服务描述其相应的HTTP接口形式。而gRPC-Gateway则提供了基于.proto文件中的服务接口定义生成Http的反向代理的能力。因为对于同一个标准的Grpc服务定义，除了基本的grpc client以外还能生成相应的HTTP+JSON的接口实现。

![https://camo.githubusercontent.com/e75a8b46b078a3c1df0ed9966a16c24add9ccb83/68747470733a2f2f646f63732e676f6f676c652e636f6d2f64726177696e67732f642f3132687034435071724e5046686174744c5f63496f4a707446766c41716d35774c513067677149356d6b43672f7075623f773d37343926683d333730](https://camo.githubusercontent.com/e75a8b46b078a3c1df0ed9966a16c24add9ccb83/68747470733a2f2f646f63732e676f6f676c652e636f6d2f64726177696e67732f642f3132687034435071724e5046686174744c5f63496f4a707446766c41716d35774c513067677149356d6b43672f7075623f773d37343926683d333730)

## 小结

回到本文的第一个图例当中，在诸如Spring Cloud这样的微服务框架当中，每一个服务默认基于HTTP协议对外提供Restful API,从而对外对内的提供服务能力。 而在某些场景下，我们既需要保持Restful的简单性，又想充分提升应用内部的性能以及可靠性，采用gRPC可以帮助我们实现是这样的目的，而使用gRPC-Gateway这样的工具我们可以很快速的基于proto接口定义，在使用RPC的同时对外提供Restful，实现软件架构的小步优化以及应用性能的提升。

![http://7pn5d3.com1.z0.glb.clouddn.com/api_gateway.png](http://7pn5d3.com1.z0.glb.clouddn.com/api_gateway.png)
