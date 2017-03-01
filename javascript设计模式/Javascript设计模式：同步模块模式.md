# 模块模式

最近时间都花在学习计算机网络上了，所以关于`javascript`的学习就暂停了，昨天下午的一节电力信息化的水课无聊，所以就拿起《你不知道的Javascript·上卷》看了看，内容和我之前看《Javascript高级程序设计》写的博客差不多（强力推荐这本书，虽然像砖头一样厚，但是内容很好很强大，值得反复读），大致是作用域链，原型链，闭包等内容，抱着复习查漏补缺的心态读了读，偶然的在闭包那一章看到了对模块模式的讲解，《Javascript高级程序设计》上对模块模式的讲解只是稍微提了下，当看到现代的模块模式时，那段关于模块依赖和加载的代码感觉有点生涩难懂，所以，打算结合《Javascript设计模式》这本书对模块模式研究下。

## 0. 基础——立即执行函数

Module模式正是利用了闭包的强大威力，如果你对闭包还不够了解，推荐阅读我之前的一篇博客[从JS引擎理解执行环境和作用域链](http://ecizep.com/2016/12/18/175)，里面详细的从作用域讲述了闭包原理。

匿名函数闭包是JavaScript最棒的特征，没有之一，是它让一切都成为了可能。现在我们来创建一个匿名函数然后立即执行。函数中所有的代码都是在一个闭包中执行的，闭包决定了在整个执行过程中这些代码的私有性和状态，下面是三种立即执行的匿名函数闭包。

```javascript
(function () {
	// ... all vars and functions are in this scope only
	// still maintains access to all globals
}());

(function () {
    // ... all vars and functions are in this scope only
	// still maintains access to all globals
})();

+function () {
    // ... all vars and functions are in this scope only
	// still maintains access to all globals
}();
```

对于第一二种，注意在匿名函数外面的括号。这是由于在JavaScript中以function开头的语句通常被认为是函数声明。加上了外面的括号之后则创建的是函数表达式，总之这种立即执行的匿名函数的原理类似，就是让JS引擎解析语句时将这段代码当做函数表达式，而不是函数声明，`+function`在关键词`function`加上一个操作符也是同样的目的，`Bootstrap`的源码大量使用了这种形式。

## 1. 模块模式

结合单例模式，我们看一个典型的模块模式的例子

```javascript
var foo = (function (id) {
    var something = "COOL";
  	
    function change() {
        //修改公共API
        publicAPI.identify = identify2;
    }
    
    function identify1() {
        console.log(id);
    }

    function identify2() {
        console.log(id.toUpperCase + " " + something);
    }

    var publicAPI = {
        change: change,
        identify: identify1
    };
            
    return publicAPI;
})("foo module");

foo.identify(); //foo module
foo.change();
foo.identify(); //FOO MODULE 
```

匿名函数内声明的一些函数方法例如`change()`和`identify1()`具有涵盖模块实例内部作用域的闭包，通过返回值保留匿名函数内部对象引用，可以对其进行调用和修改。

简单的描述，模块模式需要具备两个必要条件。

> 1) 必须有外部的封闭函数，该函数必须至少被调用一次（每次调用都会创建一个新的模块实例）
>
> 2) 封闭函数必须返回至少一个内部函数，这样内部函数才能在私有作用域中形成闭包，并且可以访问或者修改私有的状态
>
> *——《你不知道的Javascript·上卷》* 

## 2. 排队开发与模块化开发

**模块化：**将复杂的系统分解成高内聚、低耦合的模块，是系统开发变得可控、可维护、可扩展，提高模块的复用率

**同步模块模式——SMD（Synchronous Module Definition）：**请求发出后，无论模块是否存在，立即执行后续的逻辑，实现模块开发中对模块的立即引用。

在开发大的系统中，团队协作时，由于是多个人写代码，可能自己要写的代码必须要等另一个开发者开发完毕后才能开始，比如，对于一个导航栏，可能A程序员负责获取导航数据并且创建导航栏，而B程序员负责对导航添加事件，可能需要再A完成工作后B才能开始工作，而且B程序员的代码紧接着A的代码，糅合在一起，没有办法并行开发，对于这种团队合作需要排队开发的情况，需要用到模块化开发，它的思想就是常说的“高内聚，低耦合”

想要实现模块化开发，首先我们需要创建一个模块管理器，它管理者模块的创建和调用，对于模块的调用分为两类，第一类同步模块调度的实现比较简单，不需要考虑模块间的异步加载，第二类模块调度的实现就比较繁琐，它可以实现对模块的加载调度

### 2.1 模块管理器与创建模块

对于同步模块模式，我们第一步要做的就是定义一个模块管理器对象，然后为其创建一个模块定义方法`define`，在这里，模块的层级结构类似`java`的包和类结构，都是通过`.`来得到当前模块的子模块

```javascript
var Modules = (function() {
    // 利用闭包隐匿模块，禁止外部直接获取
    var modules = {};

    // 创建模块
    function define(str, fn) {
        // 解析模块路由
        var parts = str.split('.'),
            // old为当前模块的祖父模块，parent为当前模块的父模块，初始化为modules
            old = parent = modules,
            // i 模块层级，len模块层级长度
            i = len = 0;
        // 如果第一个模块是模块管理器，则移除
        if(parts[0] === 'Modules') {
            parts = parts.slice(1);
        }
        // 屏蔽对 define 和 module 模块方法的重写
        if(parts[0] === 'define' || parts[0] === 'module') {
            return ;
        }
        // 遍历路由模块并定义每层模块
        for (len = parts.length; i < len; i++) {
            // 如果父模块中不存在当前模块
            if(typeof parent[parts[i]] === 'undefined') {
                // 定义该模块
                parent[parts[i]] = {};
            }
            // 缓存下一级的祖父模块
            old = parent;
            // 缓存下一级的父模块
            parent = parent[parts[i]];
        }
        if(fn){
            old[parts[--i]] = fn();
        }
        console.log(modules);//测试代码，在控制台查看modules对象
    }

    // 临时的调用模块方法，用于测试，仅用于第一层模块
    function get(name) {
        return modules[name];
    }
	// 暴露内部函数
    return {
        define: define,
        get: get
    }
})();
```

这样我们得模块管理器以及模块创建的方法就实现了，我来写几行代码来测试下，首先我们创建`String`模块，这个模块里面有一些对字符串处理的方法，例如`trim()`

```javascript
Modules.define("string", function() {
    return {
        trim: function(str) {
            return str.replace(/^\s+|\s+$/g, '');
        }
    }
});

//测试下
Modules.get('string').trim(" 看前后有空格 ");	// 返回字符串："看前后有空格"
```

上面我们定义模块时，是直接返回的一个对象，对于模块的回调函数，也可以以构造函数的形式返回接口，比如我们来创建一个`DOM`模块，其中包括`dom()`获取元素的方法，`html()`获取或者设置元素`innerHTML`内容的方法等等

```javascript
// html部分
<div id="test">where would you wanna go?</div>

// javascript部分
Modules.define('dom', function() {
    // 简化获取元素的方法，这里只实现对id元素获取
    var $ = function(selector) {
        $.dom = document.getElementById(selector);
        // 返回构造函数对象
        return $;
    };

    $.html = function(html) {
        // 如果传参数，则设置内容，否则获取内容
        if(html) {
            this.dom.innerHTML = html;
            // 方便链式调用
            return this;
        }else{
            return this.dom.innerHTML;
        }
    };

    $.addClass = function(className) {
        if(this.dom.className.indexOf(className) == -1) {
            if(this.dom.className === "") {
                this.dom.className += className;
            }else {
                this.dom.className += ' ' + className;
            }
        }
      	// 方便链式调用
      	return this;
    }

    // 返回构造函数
    return $;
});

// 获取dom模块
var $ = Modules.get('dom');
console.log($('test').html());	// where would you wanna go?
$('test').html("how much you wanna risk?").addClass("ColdPlay");
//修改后的dom element:
<div id="test" class="ColdPlay">how much you wanna risk?</div>
```

看到这里是不是有种熟悉的感觉？没错，就是`JQuery`，这种创建模块的方法非常适合需要用构造函数初始化对象的情况，所有模块功能的运行都是基于`DOM`对象的，所以调用之前必须初始化获取一个元素，而且这些方法都是直接绑定在构造函数对象上。

### 2.2 模块调用方法

我们定义了创建模块的方法，接下来我们来定义调用模块的方法，之前我们为了测试在模块管理器里面定义了一个获取模块的`get()`测试函数，现在我们可以删掉这个测试函数，写一个姿势正确的调用方法`module()`

```javascript
function module() {
    // 将arguments对象转化为数组
    var args = [].slice.call(arguments),
        // 获取回调执行函数
        fn = args.pop(),
        // 获取依赖模块，如果args[0]是数组则为args[0]，否则依赖模块就是args
        parts = args[0] && args[0] instanceof Array ? args[0] : args,
        // 依赖模块列表
        moduleArray = [],
        // 模块路由
        modIDs = '',
        // 父模块
        parent;
    for (var i = 0; i < parts.length; i++) {
        // 如果是模块路由
        if (typeof parts[i] === "string") {
            // 设置父模块
            parent = modules;
            modIDs = parts[i].split('.');
            // 遍历模块路由层级
            for (var j = 0; j < modIDs.length; j++) {
                parent = parent[modIDs[j]] || false;
            }
            // 将模块添加到依赖列表中
            moduleArray.push(parent);
        } else {
            // 如果是模块对象
            moduleArray.push(parts[i]);
        }
    }
    // 执行回调执行函数，将依赖模块传入函数参数
    fn.apply(null, moduleArray);
}
```

接下来我们来调用模块，对于调用模块，参数可以分为两部分，第一部分为依赖模块，第二部分为回调执行函数（最后一个参数），它的原理是先遍历获取所有的依赖模块，并保存在依赖模块列表中，然后将这些模块作为参数传入到执行函数中执行

```javascript
// 第一种调用模块方式
Modules.module(["dom", document], function($, doc) {
    // 通过dom模块设置元素属性
    console.log($('test').html());
    $('test').html("how much you wanna risk?").addClass("ColdPlay");
    // 通过document设置body背景色
    doc.body.style.background = 'red';
});

// 第二种调用模块方式
Modules.module("dom", "string.trim", function($, trim) {
    var html = $('test').html(" 前后有空格 ").html();
    var str = trim(html);
    console.log("*" + html + "* *" + str + "*");
});
```

使用这种模块方法后，团队开发时就可以分开并行开发了，A程序员负责获取服务器导航栏的数据， 放到一个A模块里面，然后其他程序员需要使用导航栏数据时直接引入该模块即可，各自独立开发，互不影响

## 3. 思考

模块化实际也是算法中常说的分而治之的思想，实现对复杂系统的分解，使系统随着其功能的增加而变得可控，可扩，可维护，不过，由于模块化开发大量使用了闭包，这在内存中会占用大量的内存资源，并且得不到释放，因为外部始终有对闭包内部函数的引用，这对资源来说是一种浪费，不过为了解决排队开发的问题，这种开销是值得的。

同时，同步模块模式调用时有一个前提：**依赖的模块必须是提前创建过的。**同步模块模式无法处理异步加载的模块，因此浏览器端异步加载文件的环境模式限制了同步模块模式的应用，不过对于服务器端的`nodeJs`更适用，因为它的文件存储在本地

下一节——异步模块模式