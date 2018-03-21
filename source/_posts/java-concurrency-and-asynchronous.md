title: Java回炉重造之 - 并发与异步编程[图文]
date: 2018-03-21 22:46:39
tags: [Java, Concurrency, Asynchronous]
---

![并发与并行](http://7pn5d3.com1.z0.glb.clouddn.com/concurrency-parallel.png)

<!-- more -->

## 并发与并行

对于操作系统而言，一个单核的CPU就像写字楼中一层只有一个马桶一样。 即使有再多的人想要用，也不可能让两个人同时使用。因此只能将时间片段分配个每一个人单独利用。 当CPU被占用时，其他人只能等待。这种方式就叫做并发(concurrency)。

而多余多核CPU而言，就好多了。可以有不同的人同时使用，这种就叫做并行(Paralle)。 并行强调时间上的同时发生。

而一个程序(即一个进程)运行过程中，不会说这个程序(进程)占用了多少CPU时间，而是说这个进程中派生出的线程(Thread)占用了多少CPU时间。 在操作系统中进程是操作系统资源调度和分配的基本单位，而线程才是CPUdi调度和分配的单位。线程才是上图中的那些小人儿。

Java创建线程有两种方式。一种直接继承Thread类，复写run()方法。在使用时，直接新建一个线程对象，然后使用**new MyThread().start()**启动线程;


```
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Hello thread");
    }
}
```

另外一种方式是实现Runable接口。使用时使用**new Thread(new MyRunable()).start()**。

```
public class MyRunable implements Runnable {
    @Override
    public void run() {
        System.out.println("Hello runable");
    }
}
```

一般来说我们更推荐使用第二种方式，直接继承Thread，会让实现关注了线程自身的行为。 而实际上我们只需要让这个线程运行点什么东西就行了。下文中的线程池也很好的佐证了这样的思路。

当然从理论上讲线程越多，抢占到CPU使用时间的可能性就越大，越多的CPU使用时间就等于越快的处理速度。(注意适可而止，线程的创建和销毁都会消耗资源，线程太多系统也会崩溃掉的)。

## 线程池

上一部分说了，虽然理论上讲，线程越多程序可能更快，但是在实际使用中我们需要考虑到线程本身的创建以及销毁的资源消耗，以及保护操作系统本身的目的。我们通常需要将线程限制在一定的范围之类，线程池就起到了这样的作用。
和所有的池一样，都需要喂养一些东西。线程池中喂养的就是我们的线程，通常来说线程池中会有一定数量的核心线程配比，以及一定的Buffer配比。一定的Buffer比例可以让系统适应并发压力的波动，而固定数量的核心线程，可以确保减少线程创建以及销毁的资源损耗。 这样当有任务需要执行的时候，那就直接把任务丢给线程池就好了。

![线程池](http://7pn5d3.com1.z0.glb.clouddn.com/thread_pool.png)

Java提供了以下方式来创建线程池：

```
ThreadPoolExecutor threadPoolExecutor = new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60L, TimeUnit.SECONDS, new SynchronousQueue<>());
// 等价于 Executors.newCachedThreadPool();
threadPoolExecutor.execute(runable);
```

TheadPoolExecutor的构造函数定义如下：

```
public ThreadPoolExecutor(int corePoolSize,
                              int maximumPoolSize,
                              long keepAliveTime,
                              TimeUnit unit,
                              BlockingQueue<Runnable> workQueue)
```

其中corePoolSize用于指定核心线程数量，maximumPoolSize指定最大线程数，keepAliveTime和TimeUnit指定线程空闲后的最大存活时间，workQueue则是线程池的缓冲队列。还未执行的线程会在队列中等待。java中提供的Executors提供了多种默认的线程池实现。

## 异步与并行

![异步与并行](http://7pn5d3.com1.z0.glb.clouddn.com/asynchronous.png)

在其它的一些场景当中，即使是多线程，如果一个线程中处理了多个任务，并且每个任务有相对比较耗时这时一个请求的响应时间，会变成这些所有任务的耗时总和，如上图第一个场景描述的那样。如果以HTTP请求为例的话，这个HTTP请求的响应时间也会变得很长。

这是我们就需要采用异步编程的方式，来提升系统的吞吐量。一般根据具体的业务来说，会有两种使用方式。

如上图中第二个场景，一个后端服务需要聚合多个其它数据时，可以将这些业务流程编程多个并发的操作，并在最后进行聚合响应给客户端。 第三个场景则描述的是，在某些情况下，如果有些服务本身是需要后台处理的。当客户端发起请求后，直接响应Accepted，告诉客户端，“朕知道了，我会慢慢处理，你先下去吧”。然后由后台任务对业务进行处理即可。

第二种场景，可以使用Java提供的Feature/或者CountDown进行实现。第三种场景一般配合消息队列进行处理。

> 未完待续<使用Feature进行异步编程>