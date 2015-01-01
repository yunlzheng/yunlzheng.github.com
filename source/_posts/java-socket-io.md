title: Java中使用Socket.io
date: 2014-07-31 15:28:23
tags: java
---

今天有一个小任务，主要是解决将来可能遇到的Web前端与服务器端实时通讯的一个小需求。其实按照我个人的理解直接在前端轮循基本上也能达到相同的效果，但是由于某领导认为这样实现不够优雅,So就又倒腾一下Websocket，不过是在Java下基于Socket.io实现的。

之前在Python下也做过一个[基于WebSocket的聊天程序](github.com/yunlzheng/chat)，不过是使用原生html的websocket api和tornado实现的。 在接触Node以后了解了Socket.io这个牛逼哄哄的组件，Socket.io对web端而言主要使用Html5 WebSocket和Flask分别适配，达到可以在Chrome这类Morden浏览器也可以在IE这货上正常使用。不过Java党就没有Node那么幸运了至少之前都没听说什么比较出名的Socket.io的Java服务器端实现。不过机缘巧合之前学习Netty的时候也看过一些实现Websocket的例子，顺着这条线在万能的Google和程序员的好朋友Stackflow上找到了一个答案[netty-socketio](https://github.com/mrniko/netty-socketio), 基于Netty的Socket.io的服务器端实现。

<!-- more -->

## 代码才是王道

### 服务器端代码

	import com.corundumstudio.socketio.Configuration;
	import com.corundumstudio.socketio.AckRequest;
	import com.corundumstudio.socketio.SocketIOClient;
	import com.corundumstudio.socketio.SocketIOServer;
	import com.corundumstudio.socketio.listener.ConnectListener;
	import com.corundumstudio.socketio.listener.DataListener;

	public Class Server{

		public static void main(String[] args){

			Configuration config = new Configuration();
			config.setHostname("localhost");
			config.setPort(9092);

			final SocketIOServer server = new SocketIOServer(config);

			server.addJsonObjectListener(LogFile.class, new DataListener<LogFile>() {
			    @Override
			    public void onData(SocketIOClient client, LogFile data, AckRequest ackSender) {
				server.getBroadcastOperations().sendJsonObject(data);
			    }
			});

			server.addConnectListener(new ConnectListener() {
			    @Override
			    public void onConnect(SocketIOClient client) {

				 //server.getBroadcastOperations().sendJsonObject(data);

			    }
			});

			server.start();

		}
	}


代码很简单实例化一个SocketIOServer对象后，通过添加监听器监听websocket的事件

添加监听器的主要方法包括：

* addEventListener

针对socket.io中的event类型的消息进行监听。

* addJsonObjectListener

针对JSON类型的Data的数据，改监听器会自动将前端传入的json对象转换成响应的Java对象。

此操作需要前端显式的传入映射的java对象，如下js代码所示：

	var jsonObject = {'@class': 'com.moo.socketio.model.LogFile',line: message};
        socket.json.send(jsonObject);

@class制定了要转换的java类

* addConnectListener

顾名思义，当有新的客户端链接时会触发的事件

* addDisconnectListener

顾名思义，当有客户端断开链接时会触发的事件

* addMessageListener

主要针对字符串的消息内容，相对比较简单不需要做序列化的操作

### 客户端主要代码

	var socket =  io.connect('http://localhost:9092');

	socket.on('connect', function() {
		output('<span class="connect-msg">Client has connected to the server!</span>');
	});

	socket.on('message', function(data) {
		output(data.line);
	});

	socket.on('disconnect', function() {
		output('<span class="disconnect-msg">The client has disconnected!</span>');
	});

更多的Demo代码见[github](https://github.com/yunlzheng/spring-socketio)
