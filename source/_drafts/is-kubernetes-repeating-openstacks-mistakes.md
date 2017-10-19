Kubernetes会重蹈OpenStack的覆辙？
==================

还记的OpenStack的崛起之路吗？一开始是亚马逊和它的公有云。然后VMware表示，云其实也可以是私有的，然后Eucalyptus和CloudStack说私有云也应该是可以开放的。 而后，Rackspace和它的OpenStack来了，说私有云应该是可插拔和灵活的。 这时所有厂商都欢呼雀跃！（是的，也包括Mirantis）。 所有人都在为OpenStack欢呼，将其视为实现DIY私有云的护航者以及Amazon的征服者！

![https://cdn.mirantis.com/wp-content/uploads/2017/09/sheep.png?resize=720x468](https://cdn.mirantis.com/wp-content/uploads/2017/09/sheep.png?resize=720x468)

但是最后，还是几乎没有人能够通过OpenStack在与AWS（云计算市场）对抗中找到庇护。因此大都家开始寻找新的庇护所。 
而今天，这个新的庇护所开始看起来像是由Google和Kubernetes推动的容器即服务（又称为，非结构化PaaS）。
而我们也正在确切的看到CloudOpinion的云法则正在发挥着它的效应：“每一个无法在（公有）云中竞争的厂商，都会选择混合云（Hybrid-Cloud）作为它们的战略方向”

现如今，多云(Multi-Cloud)像是新的私有云场景，而Kubernetes则像是新的OpenStack。 但是我们是否能够从过去学到点什么？ 然后在这次做的更好？当然，到目前为止它们之间还是有许多相似之处。我们先来看看这些：

在OpenStack之前是Eucalyptus和CloudStack， 它们都实现了自己的私有云架构。而它们的封闭却扼杀了大部分客户对于（私有云）的采纳，但是情况总是在不断发展。这时OpenStack来了，它打了一手完全开放的牌，于是就发生了下面这些事情：

![https://cdn.mirantis.com/wp-content/uploads/2017/09/unopinionated2.png?resize=701x118](https://cdn.mirantis.com/wp-content/uploads/2017/09/unopinionated2.png?resize=701x118)
![https://cdn.mirantis.com/wp-content/uploads/2017/09/unopinionated.png](https://cdn.mirantis.com/wp-content/uploads/2017/09/unopinionated.png)

回到今天。现有Cloud Foundry和OpenShift，就和Eucalyptus以及CloudStack一样，都是属于较为封闭一类。虽然世界总是在不断变化和发展，但是他们两者依然谈不上取得了成功。它们都在逆势而行，对抗着企业对于开放和DIY的需求。

随着Kubernetes的出现，多云（Mutil-Cloud）模式的CaaS出现了，而且毫无疑问，开放性和DIY属性又一次胜利了。

![https://cdn.mirantis.com/wp-content/uploads/2017/09/opinionated.png?resize=1086x196](https://cdn.mirantis.com/wp-content/uploads/2017/09/opinionated.png?resize=1086x196)
![https://cdn.mirantis.com/wp-content/uploads/2017/09/opinionfsx.png](https://cdn.mirantis.com/wp-content/uploads/2017/09/opinionfsx.png)

Kubernetes和CaaS取得了成功，这是不可否认的。 Mesosphere成为支持Kubernetes的CaaS。超级封闭的Privotal Cloud Foundry也成为了基于Kubernetes的CaaS。 即使是非常保守的Garther在它[五月的报告](https://www.gartner.com/doc/3728217/assessing-container-management-frameworks-running)中也提出了一些非常不保守的说法：“平台即服务的供应商们, 正在转型到CaaS解决方案...,而这些平台可以最终将多云（Mutil-Cloud）变成现实”

我认为我们可以从两方面来看待这个问题。首先作为乐观的那个我一定为开放的基于多云架构（Mutil-Cloud）的CaaS最终获得开发者的青睐而庆祝，这是结构化PasS从来没有体会过的。而另一个保守的我却开始思考，再一次，行业渴望着DIY，导致对于了Kubernetes短期的采纳速度已经已经远远超过了长期运营的可持续性的考量。我们正朝着一个可组合的多云CaaS发展，而这种组合的最佳方式可能是：Docker, Kubernetes, Helm, Istio以及Spinnaker等。 但是基于这种由多种松耦合的利益个体的组合，它们每一个都有自己独立的发布周期，我们又该如何运营和管理这些东西呢？

正是这种运营挑战恰到好处的拖累和扼杀了OpenStack的发展，所以当我们从结构化PaaS转向可组合的CaaS时，我们如何才能不再次重走以前的老路？

以软件的形式交付封闭整体解决方案依然是无法战胜（如AWS这种）基于公有云的服务交付方式的，
所以想要将基础设施市场转移到软件层面的唯一办法还是继续打着DIY的牌。
而经过一段时间后，运营这个软件的挑战将会更加尖锐，
于是基于（公有）云下的交付又将更具有吸引力。这又将是厄运的螺旋吗？
为了取得私有IaaS平台的采用，我们创建了DIY友好的OpenStack，
但随后我们被运营绊倒，并最终向公有云屈服。 
现在到了私有的PaaS软件，为了得到私有的PaaS软件的采用，我们通过转向CaaS并创建了DIY友好的Kubernetes。 我想，你应该能够想象后面将会发生的事情了吧。

### 正文的分割线

#### Mark Collier：

Boris,

这是一篇有趣并且发人深思的文章。

首先，文章中暗含的OpenStack已死的含义，很可能会让这篇文章引起某些人群过多的关注，但是我们知道这并不是事实。 当然暂且不说这个，先说一下你文章中的中心观点。

我认为如果你去看看那些市面上最成功的开源工具栈在行业所取得的巨大成功，比如LAMP，你会看到一种模式，它往往涉及到多个开源项目，并且每一个开源项目都有他们自己的社区，这个整体并不是某一个社区就能创建的，这也是为什么它们是能够成功的原因之一。每一个社区可以专注在它们所擅长的领域，这种方式在单个社区中是不可行的。虽然这种模式有点偏理论化，并且确实导致了你所提到的运营的负担，但是它（开源工具栈）确实是能够更加的模块化，而当中的每一层都可以被替换的。并且他们似乎确实已经取得了很好的平衡。

只要我们能够相互合作并且倾听用户的情况下，我们是有机会在开放的基础设施以及开放云领域复制这一成功的。
对于每一个用户而言他们都非常清楚，他们实际上正在努力的将各个部分组合在一起，尤其是关系到如何管理这只组合的怪物。但是这确实就是他们想要的，而我们还缺少的东西。 而回到OpenStack本身，我们已经开始剔除那些会导致OpenStack变的封闭的可选项以及项目，而且这确实是有用的。

我们的机会是巨大的，它是要通过跨越社区来服务和实现用户需求，而不仅仅只是满足自我驱动的发展，如果我们不能放弃自我，AWS绝对会蚕食掉我们所有人的午餐，在Wholefoods期间，我们可以当面讨论这些问题。

如果说要举一个具体的例子，eBay获取是这个世界上最大的OpenStack用户，我相信也是Kubernetes部署规模最大的用户之一，eBay将它们部署在一起，并且展现了它们组合在一起的力量！当然对于这个组合有哪些好的方面以及哪些不好的方面，获取每一个社区的参与者都应该听一下eBay的实际需求以及它们想要做什么，或许它们在云领域的需要远大于Kubernetes+OpenStack这样的组合，但是我相信，这会是一个很好的开端。

今天我们在旧金山举行会议，许多开源社区的成员都在寻求如何为当前混沌的局面构建正确的工具栈，其中也包括eBay的领导者，而他们正在实际的使用Kubernetes+OpenStack这样的组合。这可能使我们实际可以采取的一个步骤，即构建一个即多样又开放，并且又相对稳定，足以实际运作。

Join us. http://www.opendevconf.com

Mark Collier
COO, OpenStack Foundation
@sparkycollier

#### Boris Renski ：

Mark- 感谢评论。 首先，我并没有说OpenStack已死。 那会违背我的董事会成员的托付以及我自己业务的利益。我想表达的是OpenStack没有成功的取代AWS的地位，这应该是许多供应商上了OpenStack的船之后,希望它会做的事情。我想这一点我们应该都是同意的。

回到正题： 首先我认为这是一个很好的例子，通过类比LAMP这样的组合， 有一些已经新的工具链组合比如：Kubernetes + Istio + Spinnaker已经开始构建起来。而在这个云版本的LAMP栈中任然有许多关键的问题需要解决，我认为这是可以有机会利用OpenStack社区的力量来填补这些问题的。此外，无论是Istio还是Spinnaker都没有附加到任何的基础之上，也许在这一方面OpenStack还有的玩。还有一些空白的领域比如在服务管理方面也需要一些新的项目来进行补充。当然我也相信，像Nova或者Neutron这样的项目可能并不会成为云版LAMP组合的关键部分。 欢迎纠正

#### Roman Alekseenkov:

> 或许它们在云领域的需要远大于Kubernetes+OpenStack这样的组合，但是我相信，这会是一个很好的开端

我完全同意。 同时我也相信这个租户不仅仅是在基础设施组件这一个层面。

其中一个许多企业都会需要的领域是：如何在上层交付和管理应用程序以及服务。 Boris提到的Spinnaker是一个管理单独的持续交付流水线的一个理想选择，但是对于企业的完整需求而言，这并不是一个完整的答案。

实际上我们现在正在构建一些有助于解决这个特殊问题的东西，我们允许开发人员和运维人员在应用以及服务层面去思考问题，而不仅仅是容器和基础设施这些原始问题上。 而这个东西将会在十月以开源项目的形式发布出来- [http://aptomi.io/](http://aptomi.io/)

### Mark Collier 

Roman我非常很想要了解更多的东西。请给我发一些资料： mark@openstack.org

**原文链接:**[https://www.mirantis.com/blog/is-kubernetes-repeating-openstacks-mistakes/](https://www.mirantis.com/blog/is-kubernetes-repeating-openstacks-mistakes/) 
（翻译: 云龙 校对：李韵宇）
