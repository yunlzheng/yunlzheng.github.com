title: Flex Fileupload With Java
date: 2014-07-31 15:29:13
tags:
---

## 前言

今天要说的是关于文件上传这个普通的不能再普通的话题，为什么会有这东西。 因为“已故项目”的一个普遍存在的需求：大文件上传。 由于“已故项目”是作为一个IaaS和PaaS的综合平台，可能会涉及到如各种应用程序，以及系统镜像这种超大文件的上传。 所以需要解决一下在浏览器端大文件上传的问题，于是有了今天的这个主题，虽然项目不在了。但是作为学习和巩固还是很有必要记录一下的。

## 一些需求

其实以前也做过文件上传的东西，但是只是简单的实现了一下。 但是其实向来还是有很多细节的东西需要考虑的:

* 上传文件前的check动作，文件是否存在，文件大小是否超过限制，是否需要覆盖已经存在的文件等等；
* 文件上传过程中如何实现暂停与恢复，这就涉及到文件分段写入；
* 对于超大文件直接分块上传；

## 走了捷径

文件上传其实有很多细节值得推敲，但是如果只靠我等屁民可能还是稍微花一点时间来做这些东西，因为就单个文件上传的动作而言就有好几个与服务器端交互的过程。在伟大的Google帮助下，找到了[一款Flex+PHP的文件上传组件](http://www.zehnet.de/2009/02/23/flex-fileupload-component/#more-264), 读了它的博客以后觉得这东西很多细节做的很不错，本上包含了上面说的所有需求，在继续寻找无果的情况下，屁民毅然决然决定保留Flex部分，重新用Java实现之前Php脚本提供的功能，姑且把它当作是个稍微复杂一点的表单吧，毕竟无论是Html或者Flex和服务器交互都是走的Http协议，所以本质上没什么不同。

前端代码动不得：

	<div id="uploader">
	<script type="text/javascript">
	 /** CONFIG SETTINGS FOR THE FILE UPLOADER **/
	  var flashvars = {
	  	/**
		 * the url of the upload target file which processes the file uploads
		 */
		uploadUrl : 'upload.php',
	  	/**
		 * the maximum file size that can be upload in Bytes
		 */
		maxFileSize : (1024 * 1024 * 1024),
	  	/**
		 * the maximum size of a single post request in Bytes that can be uploaded
		 * As the BigFileUpload transfers big files with several requests,
		 * this setting specifies the maximum size of one of these requests.
		 */
		maxPostSize : (1024 * 1024 * 1024)
	  	/**
		 * a comma seperated list of file endings that are allowed to be uploaded
		 */
		//fileFilter : 'jpg,jpeg,png,gif'
	  	/**
		 * The maximum number of files that can be added to the upload list
		 */
		//maxFiles : 20
	  };
	  swfobject.embedSWF("FileUploaderStandalone.swf", "uploader", "500", "350", "10.0.0", "", flashvars);
	</script>
	</div>

主要设计几个参数：

* uploadUrl: 文件上传的访问路径
* maxFileSize: 单个文件的最大大小
* maxPostSize: 和maxFileSize保持一致即可

Flex的东西就不多说了，因为完全不懂。 主要说一下在看了Php脚本以及一些实验后得出的一些简单结论。
首先这个Flex虽然可以选择多文件，但是实际过程中也是顺序上传的，这对服务器端是个好消息，不用考虑多文件同时上传的问题。 对于每个单个文件的上传主要涉及到两个过程：1，文件检查；2，上传。 说直白一点就是上传文件前，先将文件的基本信息通过get请求到服务器，服务器段代码再做一些判断，比如文件是否存在等等，如果服务器端返回success则表示可以上传，近而将文件post到服务器段。

下面展示一个文件上传的HTTP过程：

* 正常的一个文件上传过程

![](https://31.media.tumblr.com/78ff9b1ae05d7cec18736caec5aecde9/tumblr_inline_n2dsw1kd8k1sosno0.png)

* 文件已经存在的上传过程

![](https://31.media.tumblr.com/531b66058b198b4e10e37f500d74e889/tumblr_inline_n2dswfnQ8v1sosno0.png)

![](https://31.media.tumblr.com/b3640b3262db53c2cc93050d42df9662/tumblr_inline_n2dswtMV591sosno0.png)

![](https://31.media.tumblr.com/44415a1086ddfe6917f642960ab33ab4/tumblr_inline_n2dsx665y81sosno0.png)

在根据这个基本过程，利用common-fileupload实现响应的过程就很简单了。 当然现在只是处理了基本的文件上传过程，对于文件上传过程中的暂停与恢复过程暂时并未涉及。相对与简单的文件上传，暂停与恢复涉及的东西更多。 今天主要是写的东西主要是设计一个分析过程。 屁民不懂php也不懂flex还是硬着头皮做了一点尝试。下面是上传Servlet的主要实现：

	   protected void process(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

		PrintWriter out = resp.getWriter();
		UploadAction paser = loadUploadRequestPaser(req);
		try {
		    paser.doAction(req);
		} catch (FileUploadException e) {
		    out.print(MessageHandler.getErrorMessage(e));
		    return;
		} catch(Exception e ){
		    out.print(MessageHandler.getErrorMessage(e.getMessage()));
		    return;
		}
		out.print(MessageHandler.getSuccessMessage());

	    }

	    private UploadAction loadUploadRequestPaser(HttpServletRequest req) {
		String fileAction = req.getParameter("fileAction");
		if (fileAction.equals("check")) {
		    return new FileCheckAction();
		} else if(fileAction.equals("upload")) {
		    return new OrdninaryUploadAction();
		}
		else {
		    return new OrdninaryUploadAction();
		}
	    }

更多的代码请异步[https://github.com/yunlzheng/flex-fileupload-with-java](https://github.com/yunlzheng/flex-fileupload-with-java)。

## 一些其他的话

在实现这个小功能的过程中，我都尽量的通过小步快跑的方式来做，实现过程中很多问题的修改方法都参考了《重构》中的思想。 其实怎么说这些东西无非是让我们写出更加具有可扩展，可读，健壮，优雅的代码。其中很多东西都是平时有用到的，只是没有如书中如此系统的总结一番。 如果你是一个刚从事软件开发不久的同学，希望有机会一定要看看这本书；如果你是一个已经从事多年软件开发的人，那么这些小技法肯定早就熟悉的不得了，但是再看一次别有一番风味。

话说写到这里，已经淡忘了刚开始写这篇文章时激动的心情。写代码或者写博客总能让人渐渐平静下来。所以我更想保护我自己的这片净土了。
