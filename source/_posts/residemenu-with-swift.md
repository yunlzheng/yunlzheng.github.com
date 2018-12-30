title: Swift中使用RESideMenu
date: 2015-09-20 17:09:49
tags: [swift, ios, xcode]
---

RESideMenu是github上开源的一个Objective-c实现IOS侧滑菜单的组件库. 本文简单介绍一下如何在Swift中集成并且使用该第三发库

<!-- more -->

## 添加RESideMenu依赖

在Podfile中添加一下内容

```
pod 'RESideMenu', '~> 4.0.7'
```

运行install命令即可下载并且编译依赖的第三方库

```
pod instal
```

由于podfile中定义use_frameworks!，对于Objective-c实现的第三方库，我们不需要使用Header文件导入依赖，直接在Swift文件中import即可

```
import RESideMenu
```

## 添加根视图控制器

RESideMenu实现方式为，创建了一个父容器。 当中包含了3个子视图控制器：contentViewController,leftMenuViewController,rightMenuViewController。

并且提供了两个主要方法presendLeftMenuViewController和presendRightMenuViewController分别用户显示左菜单，以及显示右菜单

由RESideMenu控制并且实现3个子视图之前的切换

在Main.storyboard中添加相应的视图创建3个视图并且命名为Storyboard ID为LeftMenuViewController和ContentViewController

![](/images/residemenu0.png)

创建RootViewController.swift

```
import UIKit
import RESideMenu

class RootViewController: RESideMenu, RESideMenuDelegate{

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
    }

    override func awakeFromNib() {

        self.menuPreferredStatusBarStyle = UIStatusBarStyle.LightContent
        self.contentViewShadowColor = UIColor.blackColor();
        self.contentViewShadowOffset = CGSizeMake(0, 0);
        self.contentViewShadowOpacity = 0.6;
        self.contentViewShadowRadius = 12;
        self.contentViewShadowEnabled = true;

        self.contentViewController = self.storyboard?.instantiateViewControllerWithIdentifier("ContentViewController") as! UIViewController
        self.leftMenuViewController = self.storyboard?.instantiateViewControllerWithIdentifier("LeftMenuViewController") as! UIViewController

        self.backgroundImage = UIImage(named: "MenuBackground")

    }

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
    }
    */

}
```

## 关联事件

如下图所示，在ContentViewController中添加菜单按钮，并且右键关联点击事件即可

![/images/1.png](/images/1.png)

运行效果如下

![/images/residemenu22.png](/images/residemenu22.png)
