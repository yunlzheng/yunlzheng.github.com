title: Java网络编程框架Netty
date: 2014-07-31 15:26:28
tags: java
---

有人想做一个游戏服务器，所以google了一把大概了解了java体系中主要的两个可以作为游戏服务器的框架mina和netty. 参考了知乎上的上的一些观点，毅然决然的选择了netty. 至于原因引用一段netty上的原话“The answer is the philosophy it is build, netty is build to give you most comfortable exprience both terms of API and the implementation from the day one	”

其实在技术选型上我有个基本观点，如果不是作为企业开发为目的的话，我一般选新不选旧，其次看官方文档是否完善，而且mina和netty都出自同一个作者。 所以没有多少理由就简单做了一个决定.

<!-- more -->

## What is netty

netty是一个提供基于异步事件驱动的网络应用程序框架和用于构架高可维护性，高性能，高伸缩性的协议服务器和客户端的工具.

## 支持的协议

* TCP
* UDP
* SCTP(linux only)
* UDT
* Seril

## 主要内容有

### ChannelInboundHandler的生命周期

netty中利用ChannelInboundHandler作为业余控制器, 对应一个socket请求，handler有相应的生命周期

channelRegisterd (通道注册完成)

channelActive (通道可用)

channelRead (从socket中读取信息)

channelInactive(通道不可用)

channelUnregistered(通道注销)

一般来说程序的核心逻辑部分都关注于channelRead和channelActive两个状态.

channelActive表示当前通道已经可用不过还未从scoket中接受到数据, 不过此时已经可以向通道发送响应信息。

channelRead表示从scoket中读取到数据, 一般来说就是客户端向服务器端发起的调用信息，服务器端程序根据调用信息进行不同的逻辑处理并在比方法中将响应信息返回给客户端。

### 自定义协议

其中主要涉及的问题是自定义协议的部分，这东西在没做过之前感觉挺神秘，不过试过以后其实还是挺好处理的，简单来说就是定义一段规则，比如限制协议大小未12个字节，第一个字节表示撒，第二个字节表示撒..... 定义好这个规则以后再根据规则创建相应的pojo对象。 利用netty的encoder和decoder可以很方便的处理，值得注意的地方是将二进制流转换为pojo对象是需要判断一下获取到的数据大小时候满足约定，否则直接抛弃掉。


**定义协议POJO对象**

    package com.moo.springnetty.handlers.codec.kame;

    public class KameRequest {

        private byte encode; //编码格式
        private byte encrypt; //加密类型
        private byte extend1;
        private byte extend2;
        private int sessionId;
        private int command；

        public byte getEncode() {
            return encode;
        }

        public void setEncode(byte encode) {
            this.encode = encode;
        }

        public byte getEncrypt() {
            return encrypt;
        }

        public void setEncrypt(byte encrypt) {
            this.encrypt = encrypt;
        }

        /**  Other Setter And Getter**/

        @Override
        public String toString() {
            return "Request [encode=" + encode + ", encrypt=" + encrypt + ", extend1=" + extend1 + ", extend2=" + extend2
                + ", sessionid=" + sessionId + ", command=" + command + "]";
        }

    }


如上代码所示定义的为协议的POJO对象，所需的字节为12个字节（4个byte 2个int）, 在scoket传送数据包到达服务器后，可以位获取数据包中的内容，并使用获取的数据构造Request对象，如下所示：


**定义Request的解码器**


    public class KameRequestDecoder extends ByteToMessageDecoder {

        @Override
        protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {

            if (in.readableBytes() < 12) {
                return;
            }

            byte encode = in.readByte();
            byte encrypt = in.readByte();
            byte extend1 = in.readByte();
            byte extend2 = in.readByte();
            int sessionId = in.readInt();
            int command = in.readInt();


            KameRequest request = new KameRequest();
            request.setEncode(encode);
            request.setEncrypt(encrypt);
            request.setExtend1(extend1);
            request.setExtend2(extend2);
            request.setSessionId(sessionId);  
            request.setCommand(command);

            out.add(request);
        }

    }

**定义解码器**

    @ChannelHandler.Sharable
    public class KameRequestEncoder extends     MessageToByteEncoder<KameRequest> {

        @Override
        protected void encode(ChannelHandlerContext ctx, KameRequest msg, ByteBuf out) throws Exception {
            out.writeByte(msg.getEncode());
            out.writeByte(msg.getEncrypt());
            out.writeByte(msg.getExtend1());
            out.writeByte(msg.getExtend2());
            out.writeInt(msg.getSessionId());
            out.writeInt(msg.getCommand())；
        }
    }


如上所示定义了一个自定义协议对象的解码和编码内容。

在ChannelHandler声明周期channelRead前，Netty会自动加载Decoder将客户端发送的数据包解码为Request对象，方便程序进行逻辑处理。

同理，在逻辑处理完成后，Netty会自动加载Encoder将返回的协议对象编码成二进制内容返回给客户端，完成一个请求与响应过程。
