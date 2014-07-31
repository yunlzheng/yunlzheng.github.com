title: jenkins插件开发
date: 2012-07-02 17:58:00
tags:
---

# Jenkins插件开发简要介绍

## 环境变量

为了能开发插件，开发环境需安装Maven和JDK 6.0以上版本

配置maven的settings.xml配置文件

```
<settings>
  <pluginGroups>
    <pluginGroup>org.jenkins-ci.tools</pluginGroup>
  </pluginGroups>
<profiles>
<!-- Give access to Jenkins plugins -->
    <profile>
      <id>jenkins</id>
      <activation>
        <activeByDefault>true</activeByDefault> <!-- change this to false, if you don't like to have it on per default -->
      </activation>
      <repositories>
        <repository>
          <id>repo.jenkins-ci.org</id>
          <url>http://repo.jenkins-ci.org/public/</url>
        </repository>
      </repositories>  
      <pluginRepositories>
        <pluginRepository>
          <id>repo.jenkins-ci.org</id>
          <url>http://repo.jenkins-ci.org/public/</url>
        </pluginRepository>
      </pluginRepositories>
    </profile>
  </profiles>
</settings>
```

## 创建新的插件

创建插件之前需运行以下Maven命令:

```
mvn -cpu hpi:create
```

该操作需要你输入一些参数，比如说groupid,artifactid。之后会创建一个新的插件模板便于开发者之后的开发工作。确保你可以使用一下命令：

```
cd newly-create-directory 
mvn package
```

## 设置Eclipse开发环境

```
mvn -DdownloadSources=true -DdownloadJavadocs=true -DoutputDirectory=target/eclipse-classes eclipse:eclipse
```

或者 使用m2eclipse插件在Eclipse打开即可

## 插件目录结构

pom.xml：Maven的构建配置文件

src/main/java：Java源文件目录

src/main/resources：插件Jelly/Grovy视图

src/main/webapps：插件的静态资源如images和html文件

## 插件调试

插件开发中在使用一下命令对插件进行调试

Windows

```
set MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,address=8000,suspend=n
mvn hpi:run
```

Linux

```
$ export MAVEN_OPTS="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,address=8000,suspend=n"
$ mvn hpi:run
```

改变端口

```
mvn hpi:run -Djetty.port=8090
```

设置comtext path

```
mvn hpi:run -Dhpi.prefix=/jenkins
```

插件发布

```
mvn package
```

## 源码分析

```
import hudson.Launcher;
import hudson.Extension;
import hudson.util.FormValidation;
import hudson.model.AbstractBuild;
import hudson.model.BuildListener;
import hudson.model.AbstractProject;
import hudson.tasks.Builder;
import hudson.tasks.BuildStepDescriptor;
import net.sf.json.JSONObject;
import org.kohsuke.stapler.DataBoundConstructor;
import org.kohsuke.stapler.StaplerRequest;
import org.kohsuke.stapler.QueryParameter;

import javax.servlet.ServletException;
import java.io.IOException;

/**
 * Sample {@link Builder}.
 *
 * <p>
 * When the user configures the project and enables this builder,
 * {@link DescriptorImpl#newInstance(StaplerRequest)} is invoked
 * and a new {@link HelloWorldBuilder} is created. The created
 * instance is persisted to the project configuration XML by using
 * XStream, so this allows you to use instance fields (like {@link #name})
 * to remember the configuration.
 *
 * <p>
 * When a build is performed, the {@link #perform(AbstractBuild, Launcher, BuildListener)}
 * method will be invoked. 
 */
public class HelloWorldBuilder extends Builder {

    private final String name;

    // Fields in config.jelly must match the parameter names in the "DataBoundConstructor"
    @DataBoundConstructor
    public HelloWorldBuilder(String name) {
        this.name = name;
    }

    /**
     * We'll use this from the <tt>config.jelly</tt>.
     */
    public String getName() {
        return name;
    }

    @Override
    public boolean perform(AbstractBuild build, Launcher launcher, BuildListener listener) {
        // This is where you 'build' the project.
        // Since this is a dummy, we just say 'hello world' and call that a build.

        // This also shows how you can consult the global configuration of the builder
        if (getDescriptor().getUseFrench())
            listener.getLogger().println("Bonjour, "+name+"!");
        else
            listener.getLogger().println("Hello, "+name+"!");
        return true;
    }

    // Overridden for better type safety.
    // If your plugin doesn't really define any property on Descriptor,
    // you don't have to do this.
    @Override
    public DescriptorImpl getDescriptor() {
        return (DescriptorImpl)super.getDescriptor();
    }

    /**
     * Descriptor for {@link HelloWorldBuilder}. Used as a singleton.
     * The class is marked as public so that it can be accessed from views.
     *
     * <p>
     * See <tt>src/main/resources/hudson/plugins/hello_world/HelloWorldBuilder/*.jelly</tt>
     * for the actual HTML fragment for the configuration screen.
     */
    @Extension // This indicates to Jenkins that this is an implementation of an extension point.
    public static final class DescriptorImpl extends BuildStepDescriptor<Builder> {
        /**
         * To persist global configuration information,
         * simply store it in a field and call save().
         *
         * <p>
         * If you don't want fields to be persisted, use <tt>transient</tt>.
         */
        private boolean useFrench;

        /**
         * Performs on-the-fly validation of the form field 'name'.
         *
         * @param value
         *      This parameter receives the value that the user has typed.
         * @return
         *      Indicates the outcome of the validation. This is sent to the browser.
         */
        public FormValidation doCheckName(@QueryParameter String value)
                throws IOException, ServletException {
            if (value.length() == 0)
                return FormValidation.error("Please set a name");
            if (value.length() < 4)
                return FormValidation.warning("Isn't the name too short?");
            return FormValidation.ok();
        }

        public boolean isApplicable(Class<? extends AbstractProject> aClass) {
            // Indicates that this builder can be used with all kinds of project types 
            return true;
        }

        /**
         * This human readable name is used in the configuration screen.
         */
        public String getDisplayName() {
            return "Say hello world";
        }

        @Override
        public boolean configure(StaplerRequest req, JSONObject formData) throws FormException {
            // To persist global configuration information,
            // set that to properties and call save().
            useFrench = formData.getBoolean("useFrench");
            // ^Can also use req.bindJSON(this, formData);
            //  (easier when there are many fields; need set* methods for this, like setUseFrench)
            save();
            return super.configure(req,formData);
        }

        /**
         * This method returns true if the global configuration says we should speak French.
         *
         * The method name is bit awkward because global.jelly calls this method to determine
         * the initial state of the checkbox by the naming convention.
         */
        public boolean getUseFrench() {
            return useFrench;
        }
    }
}
```

这里主要使用了jenkins的Builder作为扩展点，通过内部类DescripotorImpl添加@Extension声明，告诉系统该内部类是作为BuildStepDescriptor的扩展出现

这里基本完成了扩展点的后台代码部分，但是扩展过程中还需要对前端页面进行扩张，这时就需要建立一个pcakage放置该扩展类对应的视图

视图有三种:1,全局配置(global.jelly)2,Job配置(config.jeely),还有就是使用帮助(help-字段名).html

global.jeely（对于插件需要使用的全局配置）

```
<j:jelly xmlns:j="jelly:core" xmlns:st="jelly:stapler" xmlns:d="jelly:define" xmlns:l="/lib/layout" xmlns:t="/lib/hudson" xmlns:f="/lib/form">
  <!--
    This Jelly script is used to produce the global configuration option.

    Jenkins uses a set of tag libraries to provide uniformity in forms.
    To determine where this tag is defined, first check the namespace URI,
    and then look under $JENKINS/views/. For example, <f:section> is defined
    in $JENKINS/views/lib/form/section.jelly.

    It's also often useful to just check other similar scripts to see what
    tags they use. Views are always organized according to its owner class,
    so it should be straightforward to find them.
  -->
  <f:section title="Hello World Builder">
    <f:entry title="French" field="useFrench"
      description="Check if we should say hello in French">
      <f:checkbox />
    </f:entry>
  </f:section>
</j:jelly>
```

将插件部署到Jenkins后实际效果如下图（系统管理-系统设置）
![](http://static.oschina.net/uploads/space/2012/0703/130915_9ows_553747.jpg)


config.jeely（正对每个Job而言需要的配置信息）

```
<j:jelly xmlns:j="jelly:core" xmlns:st="jelly:stapler" xmlns:d="jelly:define" xmlns:l="/lib/layout" xmlns:t="/lib/hudson" xmlns:f="/lib/form">
  <!--
    This jelly script is used for per-project configuration.

    See global.jelly for a general discussion about jelly script.
  -->

  <!--
    Creates a text field that shows the value of the "name" property.
    When submitted, it will be passed to the corresponding constructor parameter.
  -->
  <f:entry title="Name" field="name">
    <f:textbox />
  </f:entry>
</j:jelly>
``` 

部署到jenkins后的实际效果
![](http://static.oschina.net/uploads/space/2012/0703/131122_ZUOx_553747.jpg)

![](http://static.oschina.net/uploads/space/2012/0703/131152_4jbA_553747.jpg)


 


这里细心的人可能已经看出来了，config.jelly中定义的字段实际就是扩展类中构造函数的参数，对于HelloWorldBuilder类而言自成了Builder父类，通过使用@DataBoundConstructor申明，当用户在界面填写配置信息点击保存后将自动初始化该类，同时会在对应的job的配置文件中保存相关信息本机是在.jenkins\jobs\TestJob目录下的config.xml文件中点击查看文件，在publishers节点下即可看见与该插件有关的信息

```
<prebuilders>
    <org.wocloud.jenkins.manager.HelloWorldBuilder>
      <name>Hello!!!!!!!!!!</name>
    </org.wocloud.jenkins.manager.HelloWorldBuilder>
  </prebuilders>
```

每一次修改配置并保存时都将修改该配置文件。
在Job进行构建时，将会激活HelloWorldBuilder类的perform方法，而该方法中就是你插件真正开始完成工作的地方

```
public boolean perform(AbstractBuild build, Launcher launcher, BuildListener listener) 
```

listener是此次构建工作的监听器

通过该listener可以输出内容信息到前端jenkins页面

使用build可以判断当前构建工作的结果

 

 
