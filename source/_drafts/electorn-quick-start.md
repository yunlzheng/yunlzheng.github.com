## Quick Start

Electorn(电子) 通过提供运行时环境以及丰富的编程接口使你可以使用JavaScript创建桌面应用程序。你可以将其视为Node.js运行时环境的一个变种，它专注在桌面应用程序而非web服务。

这并不意味着Electron是一个绑定了图形用户界面的JavaScript库，事实上，Electron使用Web页面作为它的GUI,因此你可以将其视为一个JavaScript控制的迷你版本的Chromium浏览器。

### Main Process(主进程)

在Electrn中，运行package.json中main脚本的进程称为主进程。运行在主进程中的脚本通过创建Web页面来显示用户界面

### Renderer Process(渲染进程)

由于ELectron 使用了Chromium展示web页面，Chrommium是多进程架构同样适用，因此在Electron中的每一个Web页面都使用了独立的进程，这些进程被称为渲染进程。

在正常浏览器中，web页面使用了独立的沙盒环境，并且不运行访问系统本地资源.而Electron则允许用户在页面中使用Node.js API,从而实现与操作系统底层资源的交互。

### Differences Between Main Process And Renderer Process(主进程和渲染进程之间的差异)

主进程通过创建BrowserWindows创建web页面。 每一个BrowserWindow实例运行的web页面都包含属于它自己的熏染警察呢过。因此当BrowserWindow实例销毁时，相应的渲染进程也会被销毁。

主进程管理了所有的web页面已经它们对应的渲染进程。每一个渲染进程彼此独立并且只关心当中运行的页面。

在web页面中，不允许调用本地GUI相关的API，因为在Web页面中管理本地GUI资源是非常危险的事情，这些操作很容器导致资源泄露，因此，如果你想要在Web页面中调用GUI相关的操作，渲染进程必须通过请求主进程来触发这些操作。

在Electrin中，我们提供了多种方式用于实现主进程和渲染进程之间的通讯，例如ipcRenderer以及ipcMain模块可以用于发送消息，又比如remote模块提供了RPC风格的通讯方式。 这里还有专门的FAQ页面在**how to share data between web pages**

## Write you First Electron App(编写你的第一个Electron应用)

一般来说Electron应用结构如下所示：

```
your-app/
|-- package.json
|-- mian.js
|-- index.html
```

package.json的结构与Node的模式完全一致，通过mian字段指定的脚本将作为程序启动脚本，它将运行主进程。 一个简单的例子可能想下面这样：

```
{
    "name": "your-app",
    "version": "0.1.0",
    "main": "main.js"
}
```

>>> 注意，当package.json中没有指定main字段时，Electron将默认加载index.js.

在mian.js中我们应该创建窗口以及处理系统时间，一个典型的例子如下：

```
const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
```

最后再index.html中编写你想要呈现的网页内容即可：

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Hello World!</title>
  </head>
  <body>
    <h1>Hello World!</h1>
    We are using node <script>document.write(process.versions.node)</script>,
    Chrome <script>document.write(process.versions.chrome)</script>,
    and Electron <script>document.write(process.versions.electron)</script>.
  </body>
</html>
```

## 运行程序

一旦你创建了初始化的mian.js,index.html以及package.json，你可以希望尝试在本地运行你的运行程序并且测试它是否按照预期工作。

**electron**

electron是一个npm的模板，它包含了预先编译版本的Electron.

如果你通过npm在全局安装了electron，接下来你只需要在你的应用源码下运行

```
electron .
```

macOS/lINUX

```
$ ./node_modules/.bin/electron .
```

Windows

```
$ .\node_modules\.bin\electron .
```

## Manually Downloaded Electron Binary

如果你通过手动方式下载Electron，你可以使用二进制白来运行你的应用程序。

macOS

```
$ ./Electron.app/Contents/MacOS/Electron your-app/
```

Linux

```
$ ./electron/electron your-app/
```

Windows

```
$ .\electron\electron.exe your-app\
```

Electron.app 包含在Electorn正式版本包当中

### Run as distribution(发布运行时包)

当你编写完成应用之后，你可以创建发行包，请参照[Application Distribution](https://electron.atom.io/docs/tutorial/application-distribution)手册，并且执行软件包。

### Try this Example(尝试一下例子)

