# 从JS引擎理解执行环境和作用域链

## 0. Introduction

要理解整个`javascript`的设计以及代码的执行过程，写出更加优雅高性能的代码，并且知其所以然，那么原型链，作用域链以及执行环境是必须要深入的内容，在我写的前两篇的博客里面详细的解释了`javascript`的面向对象和继承的原型链，可以知道`javascript`并没有使用类似`java`一样传统类继承模型，而是使用了`prototypal`原型模型。

刚开始初学的时候，不理解`javascript`为什么要这样去实现，而且很麻烦，没有`java`里面的`class`和`extends`这种语法糖（ECMAScript 6引入了这几个语法糖），而且这一度也被当做`javascript`的缺点，不过在完全理解原型链后，发现基于原型的继承模型要比传统的类继承模型强大和灵活很多。

`java`里面对类的功能的扩展，只能通过继承原有的然后新建类来实现（当然你要是有权限修改代码，也可以直接修改源文件代码），这个时候，基于原型链的继承的灵活和强大就体现出来了，`javascript`可以轻易的通过`prototype`给原型对象添加方法做功能扩展，完全不需要新建一个继承本类的子类，而且每个子类的实例创建时，都不用创建父类的实例。

> 可以说，javascript的灵活正是其强大之处

转到正题，这篇文章将会从JS引擎深入探讨执行环境，在定义到执行的过程中，JS引擎都做了哪些初始化的工作，从根本上去理解标识符的查找过程，理解作用域链，同时，你也会明白为何`javascript`中会存在变量提升`Hoisting`，以及闭包在JS中的使用和`this`陷阱

在这之前，我们需要引入几个关键的概念：

* 执行环境栈`Execution Context Stack`——ECS
* 执行环境`Execution Context `——EC
* 变量对象`Variable Object`——VO
* 活动对象`Activation Object`——AO
* 变量声明提升`Hoisting`
* 作用域`[[scope]]`
* 作用域链`Scope Chain`
* this指针`This Value`
* 闭包`closure`

## 1. 问题的提出

首先我们来看一段代码，仔细思考一下，最终的运行结果

```javascript
var name = "the window";
var object = {
	name: "the object",
	getNameFunc: function(){
		var name = "the anonymous";
		console.log(this.name);		//第一个name
		return function(){
			console.log(name); 		//第二个name
			console.log(this.name); //第三个name
		};
	}
};
object.getNameFunc()();
```

运行的结果到底是什么呢？这个题目的综合性很强，需要对闭包，作用域链以及this指针的初始化有全面的了解才能准确无误的说出正确答案，实际上，最终会输出下面的结果：

```javascript
the object
the anonymous
the window
```

不理解为什么会是这样的结果没关系，接下来我们将围绕这个问题去深挖原理

## 2. 执行环境栈（Execution Context Stack）

在`JavaScript`中，可以执行的代码类型包括全局代码、函数代码和`eval()`代码，这里是一个简短的介绍：

* 全局代码（Global code）——代码被当做一个程序时，默认是全局执行环境，在浏览器中，一般`SCRIPT`标签的内容会被`JS`引擎解释为一个程序，即在`SCRIPT`标签中的内容会被视为全局代码
* 函数代码（Function code）——任何在函数中运行的代码都被当做函数代码
* Eval 代码（Eval code）——代码在`Eval()`函数中执行

每一种代码的执行都需要依赖自身的执行环境，而且每进入一个新的执行代码（比如调用一个函数），都会先创建一个执行环境，然后由原来的执行环境进入到新的函数的执行环境，将代码的执行权交给新的执行环境。

首先，`JavaScript`代码执行是单线程的，也就是说在浏览器中，一个时间你只能做一件事情，在一段程序开始时，会先进入全局执行环境，同时初始化必要的对象`Object`、变量`Variable`和函数`Functions`，全局环境也是执行环境栈的最底部的元素。然后，当你在全局环境中调用了`A`函数，那么将会激活A函数的执行环境，将A函数的执行环境推到栈顶，当这个A函数执行完毕后，将会弹出`A`函数的执行环境回到全局执行环境。

![mark](http://pic002.cnblogs.com/images/2011/349491/2011123113175418.png)



激活其它执行环境的某个执行环境被称为调用者`caller` ，被激活的执行环境被称为被调用者`callee` 。被调用者同时也可能是调用者(比如一个在全局执行环境中被调用的函数调用某些自身的内部方法)。

当一个`caller`激活了一个`callee`，那么这个`caller`就会暂停它自身的执行，然后将控制权交给这个`callee`， 于是这个`callee`被放入堆栈，称为进行中的执行环境`running/active execution context`. 当这个`callee`的执行环境结束之后，会把控制权再次交给它的`caller`，然后`caller`会在刚才暂停的地方继续执行。在这个`caller`结束之后，会继续触发其他的执行环境。一个`callee`可以用返回（`return`）或者抛出异常（`exception`）来结束自身的执行环境。

关于执行环境栈可以总结其五个特点：

* 单线程
* 同步执行
* 一个全局环境（global context）
* 无限制的函数执行环境
* 每个函数的调用都会创建一个新的执行环境，即使是自己调用自己

## 3. 执行环境（Execution Context）

一个执行环境可以抽象的看做一个对象，每一个执行环境都会有一系列的属性，对象可以抽象的看做有三个属性，用伪代码去模拟其结构大致如下：

```javascript
executionContextObj = {
    variableObject: { /* function arguments / parameters, inner variable and function declarations */ },
   	scopeChain: { /* variableObject + all parent execution context's variableObject */ },
    this: {}
}
```

对应下图执行环境（`Execution Context`）的基本结构：

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20161215/223641112.png)

> 在一些书籍中，例如《JavaScript高级程序设计》中，是将`this`指针归纳到了变量对象中，国内的很多博客也遵从了这本书的设定，但是实际上这是错误的，`this`是属于执行环境里面，将会在后面详细说明原因

除了这三个必须的属性（变量对象（`Variable Object`）,this指针（`this value`）,作用域链（`scope chain`））,执行环境还可以根据具体的实现具有任意额外的属性，但是无论如何，在`JS`引擎内部，每次调用执行`Execution Context`都会分为两个阶段：

**1.创建阶段【在函数被调用之后，内部代码执行之前】**

* 初始化变量对象`V0`，这里面存储被定义在执行环境中的变量`variables`和函数申明`function declarations`
* 创建作用域链`scope chain`，这个具体的过程后面详解
* 确定`this`的值

**2.激活/代码执行阶段**

* 一步步执行代码，变量赋值

每次一个新的执行环境`EC`被创建，就会被推入执行环境栈`ECS`的最顶端，浏览器总是会执行位于最顶端的执行环境中的代码，一个执行环境的创建阶段，`JS`的引擎会首先创变量对象`VO`(在函数的执行环境中被称为活动对象`AO`)，初始化函数参数，变量和函数声明（注意不包括函数表达式），接下来就是初始化作用域链的工作，紧接着就是`this`指针值的赋值，最后进入代码执行阶段，代码会一步步被解释执行。

## 4. 变量对象/活动对象（V0/A0）

每一个执行环境都有一个变量对象与之相对应，类似执行环境，变量对象也是一个抽象的概念

在全局执行环境中，我们将这个抽象的对象称为变量对象`Variable Object`，当进入函数执行环境，我们将这个抽象的对象叫做活动对象`Activation Object`，只要进入了函数的执行环境，`A0`每次都会被创建，这个对象里面存储着当前执行环境的数据。

> 变量对象和活动对象都是`JS`引擎内部的机制，程序的代码无法访问到这个抽象的对象

对于全局执行环境来说，其变量对象`VO`就是全局对象（Global Object === VO === this），这个对象全局只存在一份，它的属性在任何地方都可以访问，它的存在伴随着应用程序的整个生命周期。全局对象在创建时，将Math,String,Date,document 等常用的JS对象作为其属性。由于这个全局对象不能通过名字直接访问，因此还有另外一个属性`window`,并将`window`指向了自身，这样就可以通过`window`访问这个全局对象了。

```javascript
var globalObject = { 
    Math:{},
    String:{},
    Date:{},
    document:{}, //DOM操作
    ...
    window:Window //让window属性指向了自身
}
```

那么相应的全局执行环境`GEC`，其结构可以模拟如下：

```javascript
GlobalExecutionContext{
  VariableObject:{
    Math:{},
    String:{},
    Date:{},
    document:{}, //DOM操作
    ...
    window:Window //让window属性指向了自身
  },
  ScopeChain:{
    0:Global
  },
  this:window
}
```

对于函数的执行环境中的活动对象来说，`AO`的创建分为三个部分：

* 扫描代码中的变量声明（`Var`,Variable Declaration），为每个声明的变量在`VO`上创建这个属性，属性名就是变量名，并且将这个属性的值初始化为`undefined`
* 扫描代码中的函数声明`Function Decalration`，**注意不包括函数表达式`Function Expression`**，在`VO`上创建指向这个函数的指针，指针名就是函数名，如果函数名已经存在，则会被重写覆盖。
* 创建实参对象`arguments object`，检查函数的形式参数`parameters`，在`V0`和实参对象`arguments`上都创建这个形式参数的副本，初始化名称和值，在`VO`中创建的形式参数可以看做局部变量

然后，在代码执行阶段，会根据代码中的赋值语句一步步给变量赋值

让我们看一个例子去理解：

```javascript
<script type="text/javascript">
function funcA(param1,param2){
	var a = 'hello';
    var b = function privateB() {
    };
    function c() {
    }
}
funcA(4);	//此处只传了一个参数
</script>
```

当调用了`funcA(4)`，创建阶段完成后，`funcAExecutionContext`会被初始化为这个样子：

```javascript
funcAExecutionContext = {
    variableObject: {
        arguments: {
            0: 4,
            length: 1,
            callee:funcA(param1,param2)
          	......
        },
        param1: 4,
        param2:undefined,
        a: undefined,
        b: undefined,
        c: pointer to function c(),
        ......
    },
    scopeChain: { 
      	1: variableObject,
      	0: Global			//全局执行环境的变量对象
    },						//详解在后面
    this: window			//详解在后面
}
```

可以看到，在创建阶段只负责对属性名称的定义，但是不会给他们赋值（除了形式参数，因为调用函数的时候，值已经确定），只有等到执行代码的时候，才能根据赋值语句去给参数赋值，而且对于变量`b`，后面接的是一个函数表达式，只有执行的时候才会把这个匿名函数赋给变量`b`，所以在赋值语句执行之前变量`b`将会是`undefined`，也无法调用`b()`，当`funcA()`执行完毕后，`context`是这个样子的：

```javascript
funcAExecutionContext = {
    variableObject: {
        arguments: {
            0: 4,
            length: 1,
            callee:funcA(param1,param2)
          	......
        },
        param1: 4,
        param2:undefined,
        a: 'hello',
        b: pointer to function privateB(),
        c: pointer to function c(),
        ......
    },
    scopeChain: { 
    	1: variableObject,
      	0: Global			//全局执行环境的变量对象
    },						//详解在后面
    this: window			//详解在后面
}
```

## 5. 变量提升（Hoisting）

或许你可以在网上找到很多关于变量提升`Hoisting`的博客和文献，解释了这种现象：变量和函数的声明会在他的作用域被提前，但是很少有文章在细节上去解释为什么会发生这种现象，通过上面了解了`JS`引擎如何创建活动对象`AO`，显而易见，你会完全明白为什么会出现变量提升这种现象了，用一个例子来说明：

```javascript
function funcA(param1,param2){
  	console.log(typeof a);		//undefined
  
	var a = 'hello';
    console.log(typeof a);		//string
  
  	console.log(typeof b);		//undefined
    var b = function privateB() {
    };
  	console.log(typeof b);		//function
  
  	console.log(typeof c);		//function
    function c() {
    }
}
funcA(4);	//此处只传了一个参数
```

现在我们就可以回答下面问题了：

* 在`var a = 'hello'`执行之前，为什么变量`a`是`undefined`？ 
* 在`var a = 'hello'`执行之后，为什么变量`a`的类型是`string`？ 
* 在`b`被赋值之前，变量`b`是`undefined`，复制之后，为什么变成了函数指针？


* 在`c()`定义之前，为什么我们可以访问`c`？ 

对照活动对象的创建过程和执行过程，我想你很容易得出上面几个问题的答案，在这里我就不再赘述

## 6. 作用域（Scope）与作用域链（Scope Chain）

作用域是指正在执行的代码能够访问到的变量的范围，对于函数来说，每一个函数都有自己的作用域，在某些浏览器解释器的实现中给函数添加`[[Scopes]]`这个属性去记录**本函数被定义的那一刻**的作用域链，对于执行环境`EC`来说，每个执行环境都有自己的作用域链`scope chain`，这同样是一个抽象的概念，值得注意的是在`javascript`中没有块级作用域这个概念。

> a scope chain is a list of objects that are searched for identifiers appear in the code of context
>
> 作用域链是一个对象列表，用以检索上下文代码中出现的标识符`identifiers`

实际上，作用域链和我之前在继承的那篇文章中讨论的原型链很类似，标识符查找的过程就是从当前函数的作用域找，没有找到就顺着作用域链一直向上直到最顶层

```javascript
<script type="text/javascript">
function funcA(param1,param2){
	var a = 'hello';
    var b = function privateB() {
    };
    function c() {
    }
}
console.log(window);	//定义之后，调用之前
funcA(4);				//此处只传了一个参数
</script>	
```

依旧拿上面的例子说明，在`funcA`函数在当前的执行环境(Global EC)被**定义**的时候，会创建一个包含当前执行环境的作用域链的对象`[[Scopes]]`，全局执行环境的作用域链会被全部保存到`[[scope]]`这个属性中，这个时候，在全局对象（Global Object）中就会多了一个`funcA`的属性，我们可以从`window`中找到`funcA`这个对象。

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20161217/210159437.png)

这张图是在`chrome`的环境下的，可以清晰的看到函数的`[[Scopes]]`属性中保存了定义`funcA`时的执行环境（全局）的作用域链，对于全局环境的作用域链则只有一个全局的变量对象，同时我们也看到一些关于原型链的属性和函数的一些固有属性。

当调用并且执行`funcA`这个函数，就会按照本文上面的步骤去创建函数的执行环境，然后通过复制函数的`[[Scopes]]`属性中的对象去构建作用域链，也就是执行环境中的`scope chain`，此后，又有一个函数的活动对象`AO`被创建并推入执行环境作用域链的最前端，对于上面这个例子中的`funcA`函数的执行环境而言，其作用域链包含两个对象：函数自己的活动对象和全局对象的变量对象。所以实际上作用域链就是一个指向变量对象的指针列表，它只是引用但是不包含对象。

![Execution Context](http://ogzrgstml.bkt.clouddn.com/blog/20161218/122734181.png)

一张图，可以很直观的说明很多道理，如果能完全明白这张图，那么关于作用域链就能理解透彻了，下面在举一个实际的例子去理解函数定义时的细节

```javascript
var hello = "global";

function A(){
	console.log(hello);
}

function B(){
	var hello = "B";
	A();
}

B();
```

这个程序会输出什么？我想有部分人可能会说输出`B`，然而实际上，这个程序会输出`global`，有一句话很好的讲述了为什么

> 函数运行在他们被定义时的作用域中，而不是被调用的作用域中		*——《JavaScript权威指南》*

根据上面函数作用域链的创建过程中强调的，`A`函数是在全局执行环境中被定义的，它的`[[Scopes]]`属性只包含全局执行环境的变量对象，所以当调用并进入`A`函数的执行环境的时候，它的作用域链`scope chain`除了变量对象，就只含有其自身的活动对象。

所以在`hello`这个标识符的查找过程中，顺着它的作用域链是不会含有`B`函数的活动对象的，自然也无法访问到`B`函数中的局部变量，最后就会找到全局变量对象的`hello:global`

## 7. This指针

关于执行环境的三个组成部分的创建，已经解释了变量对象和作用域链的详细创建过程，最后就是`this`指针的赋值了，在这之前要说一下`this`的特殊性，首先`this`不是一个变量`Variable`，所以任何对`this`的赋值操作都是会出错的，`this`是与执行环境息息相关的一个特殊对象，从某种意义上说，它也可以称为环境对象（context object），还有一点需要强调的是，`this`不是变量对象的属性，在很多`JS`相关的书籍中，都错误的把它当做了`VO`的属性，这是不正确的。

>*Any object* can be used as `this` value of the context. One important note is that the`this` value is a *property of the execution context*, but *not* a property of the variable object.
>
>*——《JavaScript. The Core.》Dmitry Soshnikov*
>
>任何对象都可以作为执行环境`this`的值，值得注意的是：`this`是执行环境的一个属性，而不是某个变量对象的属性

这个特点很重要，`this`值的搜索过程和标识符的搜索过程不一样，`this`的值的查找是不会进入到作用域链上查找的。当你在代码中使用了this，这个this的值就直接从执行的上下文中获取了，`this`直接和执行环境绑定了，this的值只取决中进入上下文时的情况，那么对于函数来说，只有当调用的那一刻你才能确定`this`的值。

**全局代码中的this**

在这里一切都简单。在全局代码中，初始化全局执行环境的时候，`this`的值会被指向全局对象本身（Global Object === this === window）

```javascript
var x = 10;
 
console.log(
  x, 		// 10
  this.x, 	// 10
  window.x 	// 10
);
```

**函数代码中的this**

当`this`遇上函数代码就比较有趣和复杂了，`this`值的首要特点（或许是最主要的）是它不是静态的绑定到一个函数，`this`会可能会根据每次的函数调用而成为不同的值，`this`会由每一次`caller`提供，`caller`是通过调用表达式[call expression]产生的（也就是这个函数如何被激活调用的）。例如，下面的例子中`foo`就是一个`callee`，在全局上下文中被激活，下面的例子就表明了不同的`caller`引起`this`的不同。

```javascript
// "foo"函数里的alert没有改变
// 但每次激活调用的时候this是不同的
 
function foo() {
  alert(this);
}
 
// caller 激活 "foo"这个callee，
// 并且提供"this"给这个 callee
 
foo(); // 全局对象
foo.prototype.constructor(); // foo.prototype
 
var bar = {
  baz: foo
};
 
bar.baz(); // bar
 
(bar.baz)(); // also bar
(bar.baz = bar.baz)(); // 这是一个全局对象
(bar.baz, bar.baz)(); // 也是全局对象
(false || bar.baz)(); // 也是全局对象
 
var otherFoo = bar.baz;
otherFoo(); // 还是全局对象
```

>一句话总结：调用函数的方式影响了调用的上下文中的this值

我们可以在一些文章，甚至是在关于javascript的书籍中看到，它们声称：“this值取决于函数如何定义，如果它是全局函数，this设置为全局对象，如果函数是一个对象的方法，this将总是指向这个对象。”这是绝对不正确的

终于，关于执行环境的创建过程的所有细节就全部说明白了，接下来讲讲关于作用域链的一个重要的应用——闭包

## 8. 闭包（closure）

闭包其实是一个大家都谈烂了的概念，不过在这里，我们还是试着从`JS`引擎的角度去理解闭包的原理，看看在`javascript`中的闭包是如何工作的

> 闭包是指有权访问另一个函数作用域中的变量的函数		*——《JavaScript高级程序设计》*
>
> 闭包的好处是内部函数可以访问定义它们的外部函数的参数和变量（**除了this和arguments**）	*——《JavaScript语言精髓》*

根据闭包的定义，再加上上面对作用域链的理解，实际上整个`javascript`中函数的运行都是利用了闭包，都是通过作用域链去访问外部函数的数据，但是有一点必须强调：外部函数的`this`和`arguments`是无法访问到的，前者是因为`this`值的查找不会进入作用域链，直接从执行环境获取，后者是因为每个函数有自己的`arguments`，它会屏蔽掉外部函数的`arguments`，如果需要使用外部函数的参数，则直接通过外部函数的参数名去访问。

接下来用一个例子去解释闭包是如何工作的。

```javascript
lis = container.getElementsByTagName('li');
for (var i = 0; i < lis.length; i++) {
	//闭包的方式访问外部函数作用域
	lis[i].addEventListener("click",function(index){	//第一个匿名函数
		return function(){								//返回值也是一个匿名函数
          this.deleteIndex(index);
        }
	}(i),false);
}}
```

这个代码的功能就是给每个`li`绑定一个点击事件，点击每个`li`时输出自己的序号，在第一个匿名函数中，会将当前`i`的值保存在本函数的参数`index`中，然后在返回的响应事件的函数中，则就可以通过作用域链去访问到外部匿名函数中临时保存的`index`值了，正确的输出想要的结果。

## 9. 问题的解决

这个时候我们再来回顾在文章开头中的例子

```javascript
var name = "the window";
var object = {
	name: "the object",
	getNameFunc: function(){
		var name = "the anonymous";
		console.log(this.name);		//the object
		return function(){
			console.log(name); 		//the anonymous
			console.log(this.name); //the window
		};
	}
};
object.getNameFunc()();
```

为了解释的更加清晰，我们可以将调用的语句做一个等价变动

```javascript
//object.getNameFunc()();  替换成下面的语句
var func = object.getNameFunc();
func();
//解除对匿名函数的引用，方便getNameFunc()的活动对象从内存中释放
func = null;
```

首先，对于第一个输出的`this.name`，我们是通过`object`这个对象调用`getNameFunc()`这个函数的，所以在其执行环境`EC`创建时，它的`this`的值将会被赋为`object`这个变量，所以输出的是`object`的`name:"the object"`

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20161218/123418073.png)

然后，这个函数返回了一个匿名函数，我们将这个函数用`func`记录了下来，由于这个匿名函数的定义时在`getNameFunc`的执行环境中的，所以这个匿名函数的作用域链就包含了其外部执行环境(getNameFunc Execution Context)的活动对象，所以输出`name`会顺着作用域链找到`the anonymous`并且返回，这个就是闭包，最后，我们是在全局环境中调用的`func()`，显而易见，`func`的执行环境的`this`的值会被赋值为`window`，最后输出`the window`

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20161218/123456953.png)

需要说明的是，当`getNameFunc`执行完毕后，其执行环境会被销毁，但是其活动对象不会被销毁，因为匿名函数的作用域链依旧在引用着这个活动对象，只有当匿名函数被销毁后，`getNameFunc`的活动对象才会被干掉，所以我们需要将`func = null`

仔细对照上面两张图，画了我一个多小时，且看且珍惜.............

### Additional literature

* [JavaScript. The core.](http://dmitrysoshnikov.com/ecmascript/javascript-the-core/)
* [ECMA-262-3 in detail. Chapter 4. Scope chain.](http://dmitrysoshnikov.com/ecmascript/chapter-4-scope-chain/)
* [ECMA-262-3 in detail. Chapter 2. Variable object.](http://dmitrysoshnikov.com/ecmascript/chapter-2-variable-object/)
* [ECMA-262-3 in detail. Chapter 6. Closures.](http://dmitrysoshnikov.com/ecmascript/chapter-6-closures/)
* [ECMA-262-3 in detail. Chapter 3. This.](http://dmitrysoshnikov.com/ecmascript/chapter-3-this/)
* [深入理解JavaScript系列](http://www.cnblogs.com/TomXu/archive/2011/12/15/2288411.html)
* [javascript 从定义到执行，你不知道的那些事](http://www.webhek.com/javascript-from-define-to-execute)
