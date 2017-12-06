AWS上的容器生态系统：听Andy Jassy在Re:Invent大会上的介绍
====================

![image](https://storage.googleapis.com/cdn.thenewstack.io/media/2017/11/a1881587-jassy-comp.jpg)

继Microsoft Azure和Google Cloud Platform之后，Amazon Web Services今天也开始提供了大众期待已久的, 支持云原生基础设施的开源容器编排引擎Kubernetes服务。

同时还推出了一个新的容器管理服务，一个新的图形数据库以及一个基于[Aurora](https://aws.amazon.com/rds/aurora/)公司（MySQL）数据架构的Serverless数据库。

在本周拉斯维加斯举办的年度[Re:Invent](https://reinvent.awsevents.com/)用户会议上, 由AWS首席执行官：[Andy Jassy](https://twitter.com/ajassy)对这些服务以及升级进行了介绍。

下面是一些纲要内容:

## 容器生态系统

[Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com/blogs/aws/amazon-elastic-container-service-for-kubernetes/)：该服务将会运行kubernetes的上游版本，目前允许用户使用所有的[Kubernetes插件以及支持工具](https://www.thenewstack.io/tag/Kubernetes),同时允许用户可以轻松的在AWS，其它云提供商以及自有数据中心中迁移容器。

在[Heptio](https://www.thenewstack.io/tag/Heptio)的支持下，AWS还增加了对于Kubernetes弹性能力的支持。通过将Kubernetes运行在三个可用区上，可以减少单点故障，同时可以自动检测和替换不健康的主控节点。当前版本中K8s还集成了AWS的许多其他服务，比如 Elastic Load Balancing(弹性负载均衡)，IAM（用于身份认证），AWS CloudTrail和用于网络方面的Amazon VPC以及 AWS Privaelink。

[AWS Fargate](https://aws.amazon.com/blogs/aws/aws-fargate/):当前业界一直在期待某种新的对Kubernetes支持方式时，新推出的[AWS Fargate](https://aws.amazon.com/blogs/compute/aws-fargate-a-product-overview/)服务给大家带来了一个惊喜，或者是一种更重要的呈现，根据Jassy的介绍，从企业角度来看，该服务提供了一种直接通过EKS或者AWS自家的[Elastic Container Server](https://aws.amazon.com/ecs/)运行容器的方式，而不需要管理底层服务或者集群。

Jassy告诉参会者：“它改变了你运行容器的方式。人们希望能够在任务级别上运行容器”。

Fargate提供容器的方式与[AWS Elastic Cloud Compute](https://aws.amazon.com/ec2/)提供虚拟机的方式非常相似。“它基于一个基本的计算基元，而无需管理底层实例”，[根据AWS博客中](https://aws.amazon.com/blogs/aws/aws-fargate/)提到的内容，要构建容器镜像，用户需要指定CPU以及内存ya要求，以及网络和身份策略。而计费则以秒的粒度进行。

## 数据，数据，数据

Aurora Serverless: Aurora目前对读/写提供了多master实例以及可扩展的能力。这意味着单个数据库可以跨多个可用于并且拥有多个master实例。在之前的版本中，Aurora只提供了对多Master读操作的支持。 通过添加对于写操作的支持，意味着Aurora提供了真正的分布式数据库的能力。 从而使得从故障中进行恢复的时间可能只需要100ms，数据库的任何故障，在用户面前都是透明的。

“它允许你的应用程序可以透明的容忍任何主机的故障，即是是对于整个可用域而言”，Jassy提到，今天Aurora已经提供了对单区域-多实例的支持；多区域-多实例的支持将会在2018年初对外提供。

AWS还提供了另外一种方式扩展Aurora：允许用户只支付他们实际使用的内容，这个版本的Aurora可以在预览版中进行使用。

”它不需要你提供任何的数据库实例。并且可以根据数据库的负载情况自动对实例进行扩容或者缩容。而当它没有被使用时，则会自动关闭。而不需要支付任何额外的费用“，Jassy说。

[DynamoDB 更新](https://aws.amazon.com/blogs/compute/aws-fargate-a-product-overview/):AWS的旗舰NoSQL数据库服务[DynamoDB](https://aws.amazon.com/dynamodb/)已更新为完整的多区域全局数据库，无论用户在哪一个可用区使用该服务，它都可以提供相同的一致稳定的服务。

通过提供全局的数据库表功能 - 它能够在两个或者以上的AWS可用区中自动完成表的复制（通过多实例写的方式完成） 。这可以消除维护复制过程中所有数据管理的繁琐工作。

DynamoDB现在同时支持一键创建表的完成备份的能力，而这个过程对于性能的影响几乎为零。在2018年初还会支持精确到秒的数据恢复能力。

AWS通过[Amazon Neptune](https://aws.amazon.com/blogs/aws/amazon-neptune-a-fully-managed-graph-database-service/)进入到持续增长的[图形数据库](https://www.thenewstack.io/tag/graph-databases)市场。它可以存储数十亿关系数据，并且能够在毫秒级完成关系查询。它还支持主要的图查询栈：通过[Gremlin](https://tinkerpop.apache.org/gremlin.html)查询基于[Apache TinkerPop](http://tinkerpop.apache.org/)的属性图，以及使用[SPARQL](https://www.w3.org/TR/rdf-sparql-query/)查询[Resource Description Framework](https://www.w3.org/RDF/)(RDF)

此外，在数据前端，AWS可以通过[Glacier Select](https://aws.amazon.com/blogs/aws/s3-glacier-select/)支持对其归档存储服务中的对象进行查询，Jassy也表示[Glacier](https://aws.amazon.com/glacier/)是在所有主要的云提供商中第一个提供这个能力的。

该公司同时还宣布了一个[Service Broker](https://aws.amazon.com/blogs/apn/aws-service-broker-bridging-the-gulf-between-on-premises-and-aws/)服务，用于桥接自有资源和云上资源，同时更新了其[现有的定价策略](https://thenewstack.io/aws-now-making-easier-save-spot-instances/)以及一些新的[机器学习服务](https://aws.amazon.com/blogs/aws/sagemaker/)，这些会在后续的文章中进行介绍。

## 参考资料

* Aws Aurora：https://aws.amazon.com/rds/aurora/
* EKS: https://aws.amazon.com/blogs/aws/amazon-elastic-container-service-for-kubernetes/
* Heptio: https://www.thenewstack.io/tag/Heptio
* Dynamodb: https://aws.amazon.com/dynamodb/
* EC2: https://aws.amazon.com/ec2/
* Amazon Neptune: https://aws.amazon.com/blogs/aws/amazon-neptune-a-fully-managed-graph-database-service/
* Gremlin: https://tinkerpop.apache.org/gremlin.html
* Apache TinkerPop: http://tinkerpop.apache.org/
* RDF: https://www.w3.org/RDF/
* Glacier: https://aws.amazon.com/glacier/
* Glacier Select: https://aws.amazon.com/blogs/aws/s3-glacier-select/
* Service Broker: https://aws.amazon.com/blogs/apn/aws-service-broker-bridging-the-gulf-between-on-premises-and-aws/
