title: 使用gRPC-Gateway快速构建微服务
date: 2017-10-19 21:43:31
tags: grpc
---

## 微服务：独立的，去中心化的架构模式

> 独立的，去中心化的，围绕业务组织服务和管理数据，并且使用轻量级通讯机制

按照业务领域组织服务并且提供Restful接口，服务与服务之间通过轻量级通讯方式(Restful)进行数据交换和调用，对外使用轻量级网关简化客户端访问复杂度。基于服务发现和注册中心，完成服务之间的相互发现以及实现服务自身的横向扩展。

![http://7pn5d3.com1.z0.glb.clouddn.com/api_gateway.png](http://7pn5d3.com1.z0.glb.clouddn.com/api_gateway.png)

## gRPC： 通用的，高性能的RPC框架

![http://7xj61w.com1.z0.glb.clouddn.com/grpc-logo.png](http://7xj61w.com1.z0.glb.clouddn.com/grpc-logo.png)

> Google开发的基于HTTP/2标准设计的一个通用的，高性能的RPC框架

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

## 示例：创建支持gRPC

**1， 定义服务echo_service.proto**

定义服务EchoService，并且Echo方法，该方法接收一个StringMessage结构的数据，并且返回StringMessage。 同时声明该方法对外提供Rest API **/v1/example/echo/{value}**

```
syntax = "proto3";

package echo;
import "google/api/annotations.proto";

message StringMessage {
  string value = 1;
}

service EchoService {
  rpc Echo(StringMessage) returns (StringMessage) {
      option (google.api.http) = {
        post: "/v1/example/echo/{value}"
        body: "*"
      };
  }
}
```

**2, 生成Server端代码**

这里使用gradle进行构建 build.gradle，调用构建命令基于proto文件生成服务端代码

```
|- ProjectRoot
   |- build.gradle
   |- src
      |- main
         |- proto
            |- api
              |- annotations.proto
              |- http.proto
            |- echo_service.proto
```

build.gradle

```
apply plugin: 'java'
apply plugin: 'maven'

apply plugin: 'com.google.protobuf'

buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        // ASSUMES GRADLE 2.12 OR HIGHER. Use plugin version 0.7.5 with earlier
        // gradle versions
        classpath 'com.google.protobuf:protobuf-gradle-plugin:0.8.1'
    }
}

repositories {
    mavenCentral()
    mavenLocal()
}

group = 'com.demo.grpc'
version = '1.0-SNAPSHOT'

description = """echo-service"""

sourceCompatibility = 1.5
targetCompatibility = 1.5

def grpcVersion = '1.6.1' // CURRENT_GRPC_VERSION

dependencies {
    compile "com.google.api.grpc:proto-google-common-protos:0.1.9"
    compile "io.grpc:grpc-netty:${grpcVersion}"
    compile "io.grpc:grpc-protobuf:${grpcVersion}"
    compile "io.grpc:grpc-stub:${grpcVersion}"

    testCompile "io.grpc:grpc-testing:${grpcVersion}"
    testCompile "junit:junit:4.11"
    testCompile "org.mockito:mockito-core:1.9.5"
}

protobuf {
    protoc {
        artifact = 'com.google.protobuf:protoc:3.3.0'
    }
    plugins {
        grpc {
            artifact = "io.grpc:protoc-gen-grpc-java:${grpcVersion}"
        }
    }
    generateProtoTasks {
        all()*.plugins {
            grpc {
                // To generate deprecated interfaces and static bindService method,
                // turn the enable_deprecated option to true below:
                option 'enable_deprecated=false'
            }
        }
    }
    generatedFilesBaseDir = new File("$projectDir", "src")
}

// Inform IntelliJ projects about the generated code.
apply plugin: 'maven'

// Provide convenience executables for trying out the examples.
apply plugin: 'application'

startScripts.enabled = false

task echoServer(type: CreateStartScripts) {
    mainClassName = 'com.wise2c.grpc.App'
    applicationName = 'echo-server'
    outputDir = new File(project.buildDir, 'tmp')
    classpath = jar.outputs.files + project.configurations.runtime
}


applicationDistribution.into('bin') {
    from(echoServer)
    fileMode = 0755
}
```

```
./gradlew build
```

3, 实现Echo接口,并且启动服务

接口获取请求内容，并且生成相应内容

```
public class EchoImpl extends EchoServiceImplBase {
    @Override
    public void echo(StringMessage request, StreamObserver<StringMessage> responseObserver) {
        StringMessage reply = StringMessage.newBuilder().setValue("Hello " + request.getValue()).build();
        responseObserver.onNext(reply);
        responseObserver.onCompleted();
    }
}
```

创建启动类

```
public class EchoServer
{
    private static final Logger logger = Logger.getLogger(EchoServer.class.getName());

    private Server server;

    private void start() throws IOException {
        int port = 9090;
        server = ServerBuilder.forPort(port)
                .addService(new EchoImpl())
                .build()
                .start();
        logger.info("Server started, listening on " + port);
        Runtime.getRuntime().addShutdownHook(new Thread() {
            @Override
            public void run() {
                // Use stderr here since the logger may have been reset by its JVM shutdown hook.
                System.err.println("*** shutting down gRPC server since JVM is shutting down");
                EchoServer.this.stop();
                System.err.println("*** server shut down");
            }
        });
    }

    private void stop() {
        if (server != null) {
            server.shutdown();
        }
    }

    private void blockUntilShutdown() throws InterruptedException {
        if (server != null) {
            server.awaitTermination();
        }
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        final EchoServer server = new EchoServer();
        server.start();
        server.blockUntilShutdown();
    }

}
```

运行gRPC Server实例

```
Oct 24, 2017 4:05:00 PM com.wise2c.grpc.EchoServer start
信息: Server started, listening on 9090

```

4， 生成Restful反向代理（Go）代码

目前gRPC-Gateway只支持生成Go的Restful反向代理

```
protoc -I/usr/local/include -I. -I$GOPATH/src -I$GOPATH/src/github.com/grpc-ecosystem/grpc-gateway/third_party/googleapis --grpc-gateway_out=logtostderr=true:. echo/echo_service.proto
```

5, 创建Restful代理启动类

```
package main

import (
	"flag"
	"net/http"

	gw "git.wise2c.com/grpc-gateway-example/echo"

	"github.com/golang/glog"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"
	"golang.org/x/net/context"
	"google.golang.org/grpc"
)

var (
	echoEndpoint = flag.String("echo_endpoint", "localhost:9090", "endpoint of YourService")
)

func run() error {
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	mux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithInsecure()}
	err := gw.RegisterEchoServiceHandlerFromEndpoint(ctx, mux, *echoEndpoint, opts)
	if err != nil {
		return err
	}

	return http.ListenAndServe(":8080", mux)
}

func main() {
	flag.Parse()
	defer glog.Flush()

	if err := run(); err != nil {
		glog.Fatal(err)
	}
}
```

启动Restful接口

```
bee run
```

![grpc-example](http://7pn5d3.com1.z0.glb.clouddn.com/grpc-gateway-example.png)

## 小结

至此，以Kubernetes下部署为例：
* 对于每个微服务创建Deployment包含两个容器，该服务的gRPC Server实现以及其对应的反向代理。并且以此为单位进行伸缩（同一Pod内容器共享公网，存储资源，直接使用127.0.0.1访问即可）。
* 创建Service并且代理Deployment的Http端口以及RPC端口（对内同时暴露Http和RPC服务）。
* 对于无状态服务而言，系统内部服务之间以Service作为DNS，实现RPC的远程调用。
* 对于有状态服务，需要添加额外的服务发现和注册中心如Consul或Eureka。实现点对点调用。
* 对外基于API Gateway对外部客户端（浏览器，H5）提供Rest API。

![http://7pn5d3.com1.z0.glb.clouddn.com/http-with-grpc.png](http://7pn5d3.com1.z0.glb.clouddn.com/http-with-grpc.png)

在诸如Spring Cloud这样的微服务框架当中，每一个服务默认基于HTTP协议对外提供Restful API,从而对外对内的提供服务能力。 而在某些场景下，我们既需要保持Restful的简单性，又想充分提升应用内部的性能以及可靠性，采用gRPC可以帮助我们实现是这样的目的，而使用gRPC-Gateway这样的工具我们可以很快速的基于proto接口定义，在使用RPC的同时对外提供Restful，实现软件架构的小步优化以及应用性能的提升。


