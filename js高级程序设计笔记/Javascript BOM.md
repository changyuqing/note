# JS BOM 内容笔记

* 窗口位置

  不同的浏览器支持不同，总的来说窗口对于屏幕左边以及上边的位置可以使用一下兼容性代码

  ```javascript
  var leftPos = (typeof window.screenLeft == "number")?window.screenLeft:window.screenX;
  var topPos = (typeof window.screenTop == "number")?window.screenTop:window.screenY;
  ```

* 窗口移动

  `moveTo(x,y)`函数的功能是将窗口移动到x,y坐标处

  `moveBy(x,y)`函数的功能是将窗口向右向下移动x,y个像素

* 窗口大小

  > 窗口大小指的是浏览器的大小，而不是页面视口`viewport`的大小

  获取窗口大小可以通过：`window.outHeight/outWidth`

  获取视口大小可以通过：`window.innerHeight/window.innerWidth`

  但是在`chrome`中，以上两组返回相同的值，都是视口大小，所以没有一个完美兼容的方法去获取浏览器的大小，但是我们可以获取视口大小：

  ```javascript
  if(document.compatMode == "CSS1Compat"){
    pageWidth = document.documentElement.clientWidth;
    pageHeight = document.documentElement.clientHeight;
  }else {
    pageWidth = document.body.clientWidth;
    pageHeight = docuemnt.body.clientHeight;
  }
  //简化的写法
  pageWidth = document.documentElement.clientWidth || document.body.clientWidth;
  pageHeight = document.documentElement.clientHeight || document.body.clientHeight;
  ```

* 窗口大小调整

  `window.resizeTo(width,height)`：将视口大小调整至width，height

  `window.resizeBy(widthIncrese,heightIncrese)`：将视口大小增加widthIncrese，heightIncrese大小，可以为负数

* `Location`对象

  | 属性名      | 例子                       | 说明                         |
  | -------- | ------------------------ | -------------------------- |
  | hash     | "#contents"              | 返回URL中的hash（#后内容），否则返回空字符串 |
  | host     | "www.example.com:8080"   | 服务器+端口号(如果有)               |
  | hostname | "www.example.com"        | 服务器名称                      |
  | href     | "http://www.example.com" | 返回当前页面的完整URL               |
  | pathname | "/enOecan/index.php"     | 返回URL中的目录和文件名              |
  | port     | "8080"                   | 端口号                        |
  | protocol | "http:"                  | 返回页面使用的协议                  |
  | search   | "?q=searchWord"          | 返回URL的查询字符串，以问号开头          |

  可以通过改变以上的某一个的值实现位置跳转，例如：

  `window.location.href == "http://www.baidu.com"`可以将当前页面跳转到百度首页

  通过修改`location`对象属性的方法都会生成一条历史记录，可以通过返回键回到上一次页面，但是通过`location.replace()`方法是不能返回到上次页面的。

  `location.reload()`：重新加载页面（可能从缓存中加载文件）

  `location.reload(true)`：强制重新加载（从服务器获取）

* navigator对象