## 1. 重要改变
### 弃用cos-js-sdk-v5

这个库使用的API参考：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/development/storage/service/cos-sdk.html
它的问题是只能接受小于1.1M的文件。

#### 原因和调试过程：

这个后端系统是部署在云托管服务上的，而云托管服务是基于腾讯云的云函数，而腾讯云的云函数是基于腾讯云的COS服务。
从公网入口到COS服务，再到云函数，再到后端系统，中间有多个环节，其中某个环节将request请求的body限制为1.1M。
因此如果需要上传大于1.1M的文件，浏览器会直接收到413错误，而请求根本到达不了后端系统。

调试时，我发现上传大文件时，在handler入口的log都无法打印，因此问题出在后端服务之前的某个中间服务器上。而这个
服务器是在开发者控制之外的。

所以，从commit 116c94f65b783df15ccb04568afe3e40662e9b15开始，转而使用 https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/development/storage/service/upload.html 
提供的uploadFile方法。

这个方法的实现在116c94f65b783df15ccb04568afe3e40662e9b15至93da9a453653c652833b9175c1b331a29bdd2b9c之间。


### 注意事项

1. 确保传入的path不以/开头，否则会报错。如果上传到非根目录，比如想传文件到/covers/test.jpg，请求参数path要写成
covers/test.jpg。而不能是/covers/test.jpg。

2. 如果上传到非根目录，需要在服务端先把目录创建好。比如想要穿到/covers/目录下，需要在服务端先把目录创建好。比如
想要传到/covers/目录下，则需要先在服务端把covers目录创建好，否则会出错。另一个问题是，当covers目录下没有文件的时候，系统会自动删除covers
目录，这样导致下次再上传文件，又要出错。我的workaround是，在covers目录，创建一个空的index.html文件，这样系统就不会
自动删除这个目录了。

