# CSS深入理解之Float浮动

> 实验室前端CSS进阶培训——2017.1.9

## 0. Float的历史——文字环绕

在远古`web`时代，在`float`还没有诞生之前，传统的网页形式仅仅是文字一行，图片一行的，为了能够实现类似下图中`Word`的文字环绕效果，于是`float`应运而生

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170106/193648174.png)

所以，请记住，**浮动出现的意义其实只是用来让文字环绕图片而已，仅此而已**， 而我们目前用浮动实现页面布局本不是浮动该干的事情

> 浮动的本质就是实现文字环绕效果

## 1 Float的破坏性——脱离文档流

就和我们前面说到的那样，为了实现文字环绕效果，设计者在`css`的内部实现上使`float`具有破坏性，要破坏原有的文档流，把这个浮动的元素抽离，让其他的元素在定位的时候会当做没看见它，不过浮动的元素依旧存在于`DOM`树中。

例如这段代码：

```html
<!DOCTYPE html>
<html>
<head>
	<title></title>
	<style type="text/css">
		#outofnormal {
			width: 200px;
			background-color: cyan;
			padding: 10px;
		}
		body > p{
			margin: 10px ;
			display: inline-block;
			background-color: skyblue;
		}
	</style>
</head>
<body>
	<!-- 破坏测试，脱离文档流以及absolute -->
	<div id="outofnormal">
		Out of normal: 
		Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sequi esse impedit autem praesentium magni culpa, amet corporis, veniam consequatur voluptates temporibus. Voluptates eius similique asperiores cupiditate fugit hic atque quisquam?
	</div>
	<h2>Normal Content</h2>
	<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nostrum praesentium nam tempora beatae quis nobis laboriosam alias aliquid, tenetur exercitationem. Odio, aperiam, illo! Eveniet natus dignissimos architecto velit eligendi id!</p>
	<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rem reprehenderit velit nam delectus distinctio at unde aliquid officia illo, tempore vitae et incidunt non, ut eos nesciunt quaerat. Enim, minus.</p>
</body>
</html>
```

它的解析结果是这样的：

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/213004150.png)

跟在后面的`h2`，可以看到两者是垂直排列，`padding`互相顶着。3D视图的话就是这样，大家排排坐：

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/213043395.png)

加上`float:left`了之后，蓝色的`div`就脱离文档流了，变成了这样：

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/213137646.png)

因为蓝色的`div`脱离了文档流，跟在后面的h2和p的**盒子**都当做没看到这个`div`的样子去定位，所以他们都顶着浏览器左边和顶部的边框。但是有趣的是，`h2`和`p`里面的**文本**（属于`content flow`）却都看到了这个被`float`的`div`，在自己的盒子里往右推，飘到了蓝色`div`的边上。这就是`float`的特性，其他盒子看不见被`float`的元素，但是其他盒子里的文本看得见

3D视图就是这样，强势插入



![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/213259075.png)

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/213326170.png)

在这里顺带说下`absolute`的情况
删掉`float: left`，加上`postion: absolute`。和`float`一样的是，旁边的盒子无视了蓝色`div`的存在，也是顶着左边边框定位。但是~ **文本**也无视了蓝色`div`的存在，顶着左边边框定位！

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/213418135.png)

脱离文档流，也就是将元素从普通的布局排版中拿走，其他盒子在定位的时候，会当做脱离文档流的元素不存在而进行定位。需要注意的是，使用`float`脱离文档流时，其他盒子会无视这个元素，但其他盒子内的文本依然会为这个元素让出位置，环绕在周围。而对于使用`absolute:position`脱离文档流的元素，其他盒子与其他盒子内的文本都会无视它。

同时也是因为这个原因，使得含有浮动元素的父元素会高度塌陷，于是就有人会问：如何解决浮动让父元素高度塌陷的`BUG`，这句话整体是没有问题的，有问题的是最后一句，BUG？？？？EXO ME？？？？黑人问号？？？

> 父元素高度塌陷是标准，不是BUG

## 2 清除浮动——解决父元素高度塌陷

说起清除浮动，大家肯定会想起 `clear: both` 的确，这是`CSS`中清除浮动的属性，clear 有 both/left/right/none/inherit 几个属性值，分别代表在元素左右两侧不允许出现浮动元素/左侧不允许出现浮动元素/右侧不允许出现浮动元素/不清除浮动/继承父元素的值。

清除浮动解决方法经过多年的发展，已经有了比较完善的方法，下面介绍三种常用方法

### 2.1 空div法

这是较为古老的方法了，除了 div ，也有使用其他标签的，但 div 更为适用，因为除了浏览器赋予它的 display: block 外，它没有其他的样式了，也不会有特殊的功能，干干净净。这里插一段题外话，display: block 是浏览器赋予 div 的，存在于浏览器的 user agent stylesheet ，而不是 div 默认 display 的值就为 block ，在 W3C 中，所有的 HTML 标签 display 的默认值都为 inline 。

```css
<div class="box">
    <div class="main left">我设置了左浮动 float: left</div>
    <div style="clear: both;"></div>
    <div class="aside">我是页脚，我的上面添加了一个设置了 clear: both 的空 div</div>
</div>
```

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/220500733.png)

空 div 方法很方便，但是加入了没有涵义的 div ，这违背了结构与表现分离的原则，并且后期维护也不方便。

### 2.2 overflow 方法

在浮动元素的父元素上设置了 overflow 的值为 hidden 或 auto ，可以闭合浮动，另外在 IE6 中还需要触发 hasLayout ，例如为父元素设置容器宽高或设置 zoom：1

```css
<div class="box" style="overflow: hidden; *zoom: 1;">
    <div class="main left">我设置了左浮动 float: left</div>
    <div class="aside left">我是页脚，但是我也设置了左浮动。</div>
</div>
```

效果如图：

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/220531019.png)

这个方法相对前者更加方便，也更加符合语义要求，只是 overflow 并不是为了闭合浮动而设计的，因此当元素内包含会超出父元素边界的子元素时，可能会覆盖掉有用的子元素，或是产生了多余的滚动条。这也是在 overflow 方法诞生后依然需要寻找更佳方法的原因。

### 2.3 使用 :after 伪元素的方法

该方法来源于 [positioniseverything](http://www.positioniseverything.net/easyclearing.html)， 结合 :after 伪元素（注意这不是伪类，而是伪元素，代表一个元素之后最近的元素）和 IEhack ，可以完美兼容当前主流的各大浏览器，这里的 IEhack 指的是触发 hasLayout ，具体请看下面的方法。

```css
<style>
    .clearfix {/* 触发 hasLayout */ zoom: 1; }
    .clearfix:after {content: ""; display: block; height: 0; clear: both; visibility: hidden; }
</style>
<div class="box clearfix">
    <div class="main left">我设置了左浮动 float: left</div>
    <div class="aside left">我是页脚，但是我也设置了左浮动。</div>
</div>
```

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/220703355.png)

## 3 清除浮动的实质——CSS clear 与 BFC 特性

通过上面的例子，我们不难发现清除浮动的方法可以分成两类：

一是利用 clear 属性，包括在浮动元素末尾添加一个带有 `clear: both` 属性的空 `div` 来闭合元素，其实利用` :after` 伪元素的方法也是在元素末尾添加一个内容为一个点并带有 `clear: both` 属性的元素实现的。

二是触发浮动元素父元素的 BFC (Block Formatting Contexts, 块级格式化上下文)，使到该父元素可以包含浮动元素，关于这一点在下文解释，我们先解释下`BFC`

简而言之，元素BFC化，div内任何元素无论怎么折腾都是在内部，不会影响div外面的元素

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/221445135.png)

触发 BFC 的条件如下：

- 浮动元素，float 除 none 以外的值
- 绝对定位元素，position（absolute，fixed）
- display 为以下其中之一的值 inline-block，table-cell，table-caption
- overflow 除了 visible 以外的值（hidden，auto，scroll）

BFC 主要有三个特性：

### 3.1 BFC 会阻止外边距折叠

两个相连的 div 在垂直上的外边距会发生叠加，有些书籍会把这个情况列作 bug ，这种折叠虽然会给不熟悉 CSS 布局的开发者带来一些不便，但实际上它具有完整且具体的折叠规则，并且在主流浏览器中都存在，因此这应该是 CSS 的特性。当然，在实际开发中，或许我们有时会不需要这种折叠，这时可以利用 BFC 的其中一个特性——阻止外边距叠加

例如，两个相邻的`p`元素都设置了`margin:10px`，那么实际的显示效果则是，两个`p`标签之间只有`10px`的边距，而不是`20px`，下图中的黄色部分表示边距，上面的`p`和下面的`p`的边距重叠

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/225738413.png)

但是如果我们去触发`p`标签的`BFC`，例如给`p`标签加上一个`display:inline-block`，则不会重叠`margin`值

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/230240899.png)

### 3.2 BFC 可以包含浮动的元素

这也正是上面使用 overflow: hidden 与 overflow: auto 方法闭合浮动的原理，使用 overflow: hidden 或 overflow: auto 触发浮动元素父元素的 BFC 特性，从而可以包含浮动元素，闭合浮动。

W3C 的原文是“['Auto' heights for block formatting context roots](http://www.w3.org/TR/CSS2/visudet.html#root-height)”，也就是 BFC 会根据子元素的情况自动适应高度，即使其子元素中包括浮动元素。

### 3.3 BFC 可以阻止元素被浮动元素覆盖

如上面所说，浮动元素的块状兄弟元素会无视浮动元素的位置，尽量占满一整行，这样就会被浮动元素覆盖，为该兄弟元素触发 BFC 后可以阻止这种情况的发生，表现原则就是，内部子元素再怎么翻江倒海，翻云覆雨都不会影响外部的元素

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170108/230411967.png)

## 4 Float环绕文字带来的其他特性

正如本文一开始说的，`float`这个属性的本质是用来文字环绕，但是实现这个效果的同时，也给使用了`float`这个属相的元素带来了几个很明显的特征：

* 元素块状化（block）
* 破坏性造成紧密型排列，使空格（或者换行符）后置

第一个特性很好理解，就是`float`之后的元素的`display`属性值会变成`block`，虽然float的元素由于浮动的特性，不会像`block`元素一样独占一行，但是如果用`getComputedStyle`获取浮动的元素的`display`的值，会是`block`

第二个特性我们用一段代码去理解：

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>浮动去空格</title>
<style>
button { margin: 0; border:0px;padding: 0px;}
p { clear: both; }
</style>
</head>

<body>
	<button>按钮1</button>
	<button>按钮2</button>
	<button>按钮3</button>
	<button>按钮4</button>
	<p><input type="button" id="trigger" value="点击按钮浮动"></p>
	<script>
	var trigger = document.getElementById("trigger"),
	    buttons = document.getElementsByTagName("button");

	var length = buttons.length;

	if (trigger && length > 0) {
		trigger.onclick = function() {
			for (var index = 0; index < length; index += 1) {
				buttons[index].style["cssFloat" in trigger.style? "cssFloat": "styleFloat"] = "left";
			}
		};
	}	
	</script>
</body>
</html>
```

四个`button`元素并没有浮动，`display`的默认值是`inline-block`，显示效果如下图：

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170201/212432318.png)

值得注意的是，每个`button`元素之间有一定的空隙，而我们审查元素缺发现这个空隙并不是因为设置了`margin`或者`padding`值，那么，这个空隙是因为什么原因产生的呢？

实际上，在`html`文件的代码中，每个按钮之间实际上有一个换行符的存在，所以在浏览器中这四个按钮并非是紧紧的浮动贴靠在一起，而是之间有一个字符占了一定的空间，如果我们把这个换行符删掉，换成这种：

```html
<button>按钮1</button><button>按钮2</button><button>按钮3</button><button>按钮4</button>
```

那么这个之间的空格就会消失，当然，设置父元素的`font-size`属性值为`0px`也可以达到同样的效果。

当我点击按钮，给这四个按钮加上浮动属性，会发现，这四个按钮不仅`display`的属性变成了`block`，而且按钮之间的空格也消失了

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170201/214519434.png)

实际的情况是，这几个换行符所占的空被后置了，并未消失，如果把换行符换成HTML中的空格符号，就可以用鼠标找到这几个被后置的字符了

```html
<button>按钮1</button>&nbsp;<button>按钮2</button>&nbsp;<button>按钮3</button>&nbsp;<button>按钮4</button>
```

## 5 Float的应用——自适应三栏式布局

结合上面的float的浮动特性，以及BFC相关知识，网上的大牛们总结出一个`float`的及其强悍的应用：自适应三栏式布局

先上代码：

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>三栏式布局</title>
	<style>
		*{
			margin: 0px;
			border: 0px;
			padding: 0px;
			text-align: left;
		}

		.left{
			background-color: green;
			width: 160px;
			height: 500px;
			float: left;
			margin-right: 20px;
		}

		.right{
			
			width: 160px;
			height: 500px;
			float: right;
			background: yellow;
			margin-left: 20px; 
		}

		.content{
			display: table-cell;/*触发BFC*/
			background: white;
			padding: 20px;
		}
		p{
			margin-top: 20px;
		}
		.clearfix {/* 触发 hasLayout */ zoom: 1; }
		.clearfix:after {content: ""; display: block; height: 0; clear: both; visibility: hidden; }
	</style>
</head>
<body>

	<textarea class="left">
	</textarea>
	<textarea class="right">
	</textarea>
	<div class="content">
		<h1>两侧自适应三栏式布局</h1>
		<p>左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应，拖拽左右两边的textarea的右下角设置宽度查看自适应效果</p>
		<p>左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应，拖拽左右两边的textarea的右下角设置宽度查看自适应效果</p>
		<p>左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应，拖拽左右两边的textarea的右下角设置宽度查看自适应效果</p>
		<p>左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应，拖拽左右两边的textarea的右下角设置宽度查看自适应效果</p>
		<p>左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应，拖拽左右两边的textarea的右下角设置宽度查看自适应效果</p>
		<p>左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应，拖拽左右两边的textarea的右下角设置宽度查看自适应效果</p>
		<p>左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应，拖拽左右两边的textarea的右下角设置宽度查看自适应效果</p>
		<p>左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应，拖拽左右两边的textarea的右下角设置宽度查看自适应效果</p>
	</div>
</body>
</html>
```

显示效果大家可以自己在浏览器上去查看，这个布局的原理也没有那么复杂，粗略的总结就是：左右设置浮动，中间元素BFC化达到不影响两边浮动元素的效果，从而实现自适应

这个布局的好处就是可复用性很强，中间的内容根据左右两边的元素宽度自动适应大小，不需要针对每个使用场景重新去写`margin-left`或者`margin-right`的值，传统的三栏式布局则是需要根据左右两边浮动元素的宽度，手动去给中间内容的元素设置这两个值。

## 6 参考资料

[CSS float浮动的深入研究、详解及拓展](http://www.zhangxinxu.com/wordpress/2010/01/css-float%E6%B5%AE%E5%8A%A8%E7%9A%84%E6%B7%B1%E5%85%A5%E7%A0%94%E7%A9%B6%E3%80%81%E8%AF%A6%E8%A7%A3%E5%8F%8A%E6%8B%93%E5%B1%95%E4%B8%80/)

[CSS脱离文档流](https://www.zhihu.com/question/24529373/answer/29135021)

[CSS深入理解流体特性和BFC特性下多栏自适应布局](http://www.zhangxinxu.com/wordpress/2015/02/css-deep-understand-flow-bfc-column-two-auto-layout/)

[CSS深入理解之float浮动](http://www.imooc.com/learn/121)

[详说 Block Formatting Contexts (块级格式化上下文)](http://kayosite.com/block-formatting-contexts-in-detail.html)