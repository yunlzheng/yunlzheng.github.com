title: intro-xvfn-ubuntu
date: 2014-10-19 22:47:10
tags: devops
---

xvfb(virtual framebuffer X server), xvfb可以运行在显示，以及输入设备的设备上，它使用虚拟内存模拟了framebuffer即模拟一个虚拟的显示器。
不需要显示设备以及输入设备可以使我们可以非桌面版本的操作系统运行一些需要显示设备的程序，比如seleium自动化测试程序。
同理利用xvfb我们可以实现Vagrant以及Docker中完成自动化功能测试。Vagrant在本地开发上优势十足，而基于Docker也可以让我们的CI/CD过程性感

## OPTIONS

* −screen screennum WxHxD
This option creates screen screennum and sets its width, height, and depth to W, H, and D respectively. By default, only screen 0 exists and has the dimensions 1280x1024x8.

* −pixdepths list-of-depths
This option specifies a list of pixmap depths that the server should support in addition to the depths implied by the supported screens. list-of-depths is a space-separated list of integers that can have values from 1 to 32.

* −fbdir framebuffer-directory
This option specifies the directory in which the memory mapped files containing the framebuffer memory should be created. See FILES. This option only exists on machines that have the mmap and msync system calls.

* −shmem
This option specifies that the framebuffer should be put in shared memory. The shared memory ID for each screen will be printed by the server. The shared memory is in xwd format. This option only exists on machines that support the System V shared memory interface.

* −linebias n
This option specifies that the framebuffer should be put in shared memory. The shared memory ID for each screen will be printed by the server. The shared memory is in xwd format. This option only exists on machines that support the System V shared memory interface.

* −blackpixel pixel-value, −whitepixel pixel-value
These options specify the black and white pixel values the server should use.

## Examples

* Xvfb :1 -screen 0 1600x1200x32
  The server will listen for connections as server number 1, and screen 0 will be depth 32 1600x1200.
* Xvfb :1 -screen 1 1600x1200x16
  The server will listen for connections as server number 1, will have the default screen configuration (one screen, 1280x1024x8), and screen 1 will be depth 16 1600x1200.
* Xvfb -pixdepths 3 27 -fbdir /var/tmp
  The server will listen for connections as server number 0, will have the default screen configuration (one screen, 1280x1024x8), will also support pixmap depths of 3 and 27, and will use memory mapped files in /var/tmp for the framebuffer.
* xwud -in /var/tmp/Xvfb_screen0
  Displays screen 0 of the server started by the preceding example.
