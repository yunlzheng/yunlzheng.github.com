title: RabbitMQ之消息发布订阅与信息持久化技术
date: 2012-08-09 14:20:00
tags: rabbitMQ
---


# 信息发布与订阅


Rabbit的核心组件包含Queue(消息队列)和Exchanges两部分，Exchange的主要部分就是对信息进行路由，通过将消息队列绑定到Exchange上，则可以实现订阅形式的消息发布及Publish/Subscribe在这种模式下消息发布者只需要将信息发布到相应的Exchange中，而Exchange则自动将信息分发到不同的Queue当中。

这种模式下Exchange充当的角色

在命令行中可以使用

```
sudo rabbitmqctl list_exchanges
```

```
sudo rabbitmqctl list_bindings
```

分别查看当前系统种存在的Exchange和Exchange上绑定的Queue信息。

<!-- more -->

消息发布者EmitLog.java

```
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class EmitLog {

	private static final String  EXCHANGE_NAME="logs";

	public static void main(String[] args) throws java.io.IOException{

		//创建链接工厂
		ConnectionFactory factory = new ConnectionFactory();
		factory.setHost("localhost");
		//创建链接
		Connection connection = factory.newConnection();

		//创建信息管道
		Channel channel = connection.createChannel();

		//生命Exchange 非持久化
		channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

		String message = "Message "+Math.random();

		//第一个参数是对应的Exchange名称,如果为空则使用默认Exchange
		channel.basicPublish(EXCHANGE_NAME, "", null, message.getBytes());
		System.out.println("[x] Sent '"+message+"'");

		//关闭链接
		channel.close();
		connection.close();

	}

}
```

消息消费者ReceiveLogs.java

```
import java.io.IOException;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.ConsumerCancelledException;
import com.rabbitmq.client.QueueingConsumer;
import com.rabbitmq.client.ShutdownSignalException;

public class ReceiveLogs {

	private static final String EXCHANGE_NAME = "logs";

	public static void main(String[] args) throws IOException, ShutdownSignalException, ConsumerCancelledException, InterruptedException {

		//创建链接工厂
		ConnectionFactory factory = new ConnectionFactory();
		factory.setHost("localhost");
		//创建链接
		Connection connection = factory.newConnection();

		//创建消息管道
		Channel channel = connection.createChannel();

		//声明Exchange
		channel.exchangeDeclare(EXCHANGE_NAME, "fanout");

		//利用系统自动声明一个非持久化的消息队列，并返回唯一的队列名称
		String queueName = channel.queueDeclare().getQueue();

		//将消息队列绑定到Exchange
		channel.queueBind(queueName, EXCHANGE_NAME, "");

		System.out.println(" [*] Waiting for messages. To exit press CTRL+C");

		//声明一个消费者
		QueueingConsumer consumer = new QueueingConsumer(channel);
		channel.basicConsume(queueName, true, consumer);

		while (true) {

			//循环获取信息
			QueueingConsumer.Delivery delivery = consumer.nextDelivery();
			String message = new String(delivery.getBody());
			System.out.println(" [x] Received '" + message + "'");

		}

	}

}
```

 运行时启动一个EmitLog.java多个ReceiveLogs.java则可以看到发布者每次发布信息，只要绑定到了相应Exchange的消费者都可以获取到信息。

## RabbitMQ信息持久化技术

上面的例子中我们实现了Publisher/Subscribe的消息分发方式，但是其中存在一些问题。比如当我们运行一个ReceiveLog都对应了一个特定的消息队列，可以利用list_queues进行查看，同时这些消息队列是帮到到名为logs的Exchange中，这是发布消息每个消费者都可以接收到，可以当关闭ReceiveLog程序后这些消息队列就都会自动销毁，因为他们是非持久化的。同样对于EmitLog程序也一样，每次关闭后之前生命的Exchange也将自动销毁。

这就产生了一些问题。如果当ReceiveLog为运行时，此时就并没有一个消息队列是绑定到Exchange上的，在发布消息后再启动ReceiveLog程序是无法接受到之前发布的信息。这就是为什么要进行消息的持久化。

通过持久化技术，我们可以生命一个持久化的Exchange，以及持久化的Queue这样，在把Queue绑定到Exchange后，即使没有消费者程序运行，信息依然能保存在Queue当中，当下次启动消费者程序时依然能获取到发布的所有信息。就好比当一个消费者程序在执行消息序列中的任务时，如果突然出现了异常那么重新启动后，依然能从上一次发生错误的位置继续运行，对于某些需要一个有序性和连续性的操作，这点显的尤为重要。

下面还是给出一个例子，在持久化过程中，可以借助list_exchanges,list_bindings,list_queues来查看服务器中相关信息来帮组分析过程。


Publisher.java

```
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.MessageProperties;

public class Publisher {

	private static final String  EXCHANGE_NAME="persi";//定义Exchange名称
	private static final boolean durable = true;//消息队列持久化

	public static void main(String[] args) throws java.io.IOException {

		ConnectionFactory factory = new ConnectionFactory();//创建链接工厂
		factory.setHost("localhost");
		Connection connection = factory.newConnection();//创建链接
		Channel channel = connection.createChannel();//创建信息通道

		channel.exchangeDeclare(EXCHANGE_NAME, "fanout", durable);//创建交换机并生命持久化

		String message = "Hello Wrold "+Math.random();
                //消息的持久化
		channel.basicPublish(EXCHANGE_NAME, "", MessageProperties.PERSISTENT_TEXT_PLAIN, message.getBytes());

		System.out.println("[x] Sent '" + message + "'");

		channel.close();
		connection.close();

	}

}
```

Subscriber.java

```
public class Subscriber {


	//private static final String[] QUEUE_NAMES= {"que_001","que_002","que_003","que_004","que_005"};
	private static final String[] QUEUE_NAMES= {"que_006","que_007","que_008","que_009","que_0010"};

	public static void main(String[] args){

		for(int i=0;i<QUEUE_NAMES.length;i++){

			SubscriberThead sub = new SubscriberThead(QUEUE_NAMES[i]);
			Thread t = new Thread(sub);
			t.start();

		}

	}
}
```


SubscriberThead.java

```
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.QueueingConsumer;
import com.rabbitmq.client.AMQP.Queue.DeclareOk;

public class SubscriberThead implements Runnable {

	private String queue_name = null;
	private static final String EXCHANGE_NAME = "persi";// 定义交换机名称
	private static final boolean durable = true;//消息队列持久化

	public SubscriberThead(String queue_name) {

		this.queue_name = queue_name;

	}

	@Override
	public void run() {

		try{

		ConnectionFactory factory = new ConnectionFactory();
		factory.setHost("localhost");
		Connection connection = factory.newConnection();
		Channel channel = connection.createChannel();

		channel.exchangeDeclare(EXCHANGE_NAME, "fanout", durable);

		DeclareOk ok = channel.queueDeclare(queue_name, durable, false,
				false, null);
		String queueName = ok.getQueue();


		channel.queueBind(queueName, EXCHANGE_NAME, "");

		System.out.println(" ["+queue_name+"] Waiting for messages. To exit press CTRL+C");

		channel.basicQos(1);//消息分发处理
		QueueingConsumer consumer = new QueueingConsumer(channel);
		channel.basicConsume(queueName, false, consumer);

		while (true) {

			Thread.sleep(2000);
			QueueingConsumer.Delivery delivery = consumer.nextDelivery();
			String message = new String(delivery.getBody());
			System.out.println(" ["+queue_name+"] Received '" + message + "'");
			channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);

		}
		}catch(Exception e){

			e.printStackTrace();
		}


	}

}
```

 通过持久化处理后rabbitMQ将保存Exchange信息以及Queue信息，甚至在rabbitMQ服务器关闭后信息依然能保存，这样就提供了消息传递的可靠性
