# javascript继承：灵活的原型链

上次彻彻底底的搞清楚了`javascript`是如何利用原型对象实现面向对象的编程方法，今天来深入理解一下`javascript`里面的继承的实现方法，同样需要借助原型对象，首先，简单回顾一下构造函数，原型对象和实例之间的关系：**每个构造函数都有一个`prototype`指针指向其原型对象，每个实例都有一个`__proto__`指针指向原型对象，而原型有一个`constructor`指针指向构造函数**

## 完美继承第一步：原型链继承

如果我们让`SubType`的原型对象等于`SuperType`的实例，而`SuperType`的实例又指向其原型对象，所以`SubType`的原型对象就含有一个指针指向`SuperType`的原型对象了，更进一步，假如我们让`SuperType`的实例等于另一个对象的原型，如此层层递进，就构成了实例和原型之间的链条，这个链条就叫做原型链。

```javascript
function SuperType(){
	this.property = "father";
}

SuperType.prototype.getSuperValue = function() {
	return this.property;
}

function SubType(){
	this.subProperty = "child";
}

//继承了SuperType
SubType.prototype = new SuperType();

SubType.prototype.getSubtypeValue = function() {
	return this.subProperty;
}

var instance = new SubType();
console.log(instance.getSuperValue());	//father
```



上面代码很好理解，就是将`SuperType`的实例当做了`SubType`的原型对象，我们新建了一个`SubType`的实例，只不过我们没有使用默认提供的原型，而是给他替换了一个新原型，新原型有作为`SuperType`实例的所有属性和方法，这样顺着原型链，就能够继承`SuperType`的属性和方法了，具体的指针连接如下图：

![原型链](http://ogzrgstml.bkt.clouddn.com/2.jpg)

在`javascript`中一切皆为对象，所有的对象都继承至`Object`，所以上面的例子的完整的原型链如下图：

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20161121/215530905.png)



> 虽然可以用原型链来实现继承，但是原型链也存在问题：
>
> * 对于`SubType.prototype`中的引用类型的属性，所有`SubType`的实例都会共享一个引用类型的数据
> * 在创建子类的实例时，无法向父类的构造函数传递参数

写一段代码就能很清楚的明白了

```javascript
function SuperType(){
	this.colors = ["red","blue","grey"];
}

function SubType(){

}

//继承了SuperType
SubType.prototype = new SuperType();

var instance1 = new SubType();
instance1.colors.push("black");
console.log(instance1.colors);	//red,bule,grey,black

var instance2 = new SubType();
console.log(instance2.colors);  //red,bule,grey,black
```

这个例子的`SuperType`定义了一个`colors`的数组，可以很明显的看到，当一个`SubType`的实例修改了`colors`数组，将会将这个修改应用在所有的`SubType`实例中，而这个是我们不希望看到的。

## 完美继承第二步：组合继承

为了解决上面原型链继承带来的两个问题，我们在其模式上加入**借用构造函数**的思想，可以很好的解决这个问题

```javascript
function SuperType(name){
	this.colors = ["red","blue","grey"];
	this.name = name;
}

SuperType.prototype.sayName = function(){
	return this.name;
}

function SubType(name,age){
	//在当前实例作用域去调用SuperType(),这样每个实例都会有自己的colors副本
    //继承属性
	SuperType.call(this,name);   //第二次调用SuperType()
	this.age = age;
}

//继承了SuperType的方法
SubType.prototype = new SuperType();	//第一次调用SuperType()

SubType.prototype.sayAge = function(){
	return this.age;
}

var instance1 = new SubType("Eminem",44);
instance1.colors.push("black");
console.log(instance1.colors);	//red,bule,grey,black
console.log(instance1.sayName());//Eminem
console.log(instance1.sayAge());//44

var instance2 = new SubType("Bruno Mars",38);
console.log(instance2.colors);  //red,bule,grey
console.log(instance2.sayName());//Bruno Mars
console.log(instance2.sayAge());//38
```

在这例子里面，最重要的部分就是在`SubType`构造函数的作用域中调用`SuperType`，不仅可以将传参数给父类的构造函数，同时还可以给每个实例添加一个父类的`colors`数组副本。这种继承模式融合了原型链和借用构造函数的优点，用构造函数继承属性，原型链继承方法，是一种常用的继承方式。

但是，认真的`Geek`们依旧发现了这种模式的不足之处

> 这种继承的实现调用了两次`SuperType()`，在性能上不过关，并且数据冗余
>
> 第一次调用：将`SuperType`的实例作为`SubType`的原型对象的时候
>
> 第二次调用：创建`SubType`的实例的时候，调用构造函数会链式调用到父类的构造函数

两次调用不仅性能差，而且在`SubType`的原型对象和实例中都含有`name`属性和`colors`数组，如下图：

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20161121/230614948.png)

子类原型对象和子类实例拥有相同的属性，为了解决这个问题，现在进入完美继承第三步：寄生组合式继承

## 完美继承第三步：寄生组合式继承

在彻底实现完美的继承之前，我们需要先理解两个在特殊场景使用的继承方法

* 原型式继承
* 寄生式继承

### 原型式继承

这种继承模式的诞生是为了简化继承操作，在特殊的场景下，有时候我们不需要大费周章地定义新的类型，直接在现有的对象上创建新的对象，于是有了下面的`object()`函数

```javascript
function object(o){
	function F(){}
	F.prototype = o;
	return new F();
}
```

还是举一个例子来辅助理解`object()`的使用场景

```javascript
function object(o){ 
    function F(){};
    F.prototype = o; 
    return new F();
}
var person = { 
    name:"Nicholas", 
    friends:["Shelby","Court","Van"]
};

var anotherPerson = object(person);
anotherPerson.name = "Greg";
anotherPerson.friends.push("Rob");

var yetAnotherPerson = object(person);
yetAnotherPerson.name = "Linda";
yetAnotherPerson.friends.push("Barbie");

alert(person.friends);  //"Shelby,Court,Van,Rob,Barbie"
```

可以看出这种原型式继承，要求你有一个对象作为新对象的基础，然后在根据需求对新对象进行修改，所以在没有必要兴师动众创建构造函数，只想让新对象在旧对象的基础上保持类似，这种继承还是有很多应用场景的，**不过值得注意的是，这种继承和原型链继承一样，对于引用类型的属性始终都是共享一个值**

> `ECMAScript 5`通过新增`Object.create()`方法规范了原型式继承，可以直接调用，不需要自己去写一个`object()`

### 寄生式继承

寄生式继承是在原型式继承的基础上，以某种方式来增强对象，只是又加入了工厂模式的思维，对这个增强的过程进行了封装，思路和寄生构造函数类似。

```javascript
function createAnother(original){
    var clone = object(original);//object()函数创建对象 就是原型式继承的object()方法
    clone.sayHi = function(){    //增强这个对象
        alert("hi");
    };
    return clone;                //返回这个对象
}
var person = {
    name:"Nicholas";
    friends:["Shelby","Court","Van"];
}     //基础对象
var anotherPerson = createAnother(person);  //新对象
anotherPerson.sayHi();   //"hi"
```

这个例子中的代码基于`person`返回了新的对象，并且增强了新的方法`sayHi()`，这种模式的使用场景和原型式继承类似，只是封装了增强过程

好了，理解了上面两个特殊场景的继承方式后，就可以进入最后的完美继承：寄生组合式继承

### 寄生继承与组合继承的融合

所谓寄生组合式继承，就是在组合继承（借用构造函数继承，原型链继承方法）的基础之上，通过一个原型式继承里面的`F()`空构造函数副本，将空构造函数的`prototype`指向`SuperType`的原型对象，这样去创建一个`F`的实例，而且这个实例的`__proto__`也指向`SuperType`的原型对象，不仅以原型链的方式实现了继承，还成功的避开了组合继承中的**第一次调用`SuperType`构造函数**

```javascript
function object(o){	
	function F(){}
	F.prototype = o;
	return new F();
}

function inheritProtoType(subType,superType){
  	//创建对象（F的实例，同时原型指向父类原型对象） 基于原型式继承思维
 	var prototype = object(superType.prototype);
 	prototype.constructor = subType;//增强对象  寄生式思维
 	subType.prototype = prototype; //指定子类原型对象
}

function SuperType(name){
     this.name = name; 
     this.colors = ["red","blue","green"];
}
SuperType.prototype.sayName = function(){
     alert(this.name);
}
function SubType(name,age){
    //继承属性 
    SuperType.call(this,name);   //只调用一次SuperTyper()
    this.age = age;
}
//继承方法
inheritPrototype(SubType,SuperType);

var bar = new SubType();
```

讲真，这个超级绕，建议拿出草稿纸把原型啊，实例啊之间的关系一步步画出来，不然靠空想真的很难理解到这种思维的巧妙之处。

下面是上面代码的指针图，其中`foo`就是空构造函数`F()`

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20161121/225228765.png)

这种继承就是完美的继承，不仅可以继承属性，继承共享的方法，还不造成内存浪费得以提升性能，同时，原型链也是保存下来的，所以用可以正常用`instanceof`和`isPrototype()`去进行对象识别。

至此，`javascript`面向对象的设计思路的迷雾就全部揭开了，当然，除了原型链中的顶层对象`Function`和`Object`之间的先后问题，这个改天另外用一篇博客详细说明。

不过我产生了一个新的疑问，既然`javascript`借鉴了`java`一切皆为对象和基本类型封装的设计方法，为什么在面向对象这一块却没有像`java`一样设置`class`和`extends`这种语法糖，封装面向对象和继承的细节，同时也让我开始有点好奇`java`内部是如何实现面向对象和继承的

以后再研究，先到这里，滚去睡觉！

