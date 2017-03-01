# 深入理解 javascript 原生Object对象

Tags： javascript 

---
##对象
###Object概述
`Javascript`原生提供一个`Object`对象，其他所有的对象都是继承自这个对象，同时`Object`本身也是一个构造函数，可以用来生成对象。
创建对象的方法一般有两种，一种是用`New`来创建，将`Object`作为构造函数，一种是对象字面量的方式创建，后者方便阅读理解，建议使用
```javascript
//new的方式创建对象
var object = New Object();
object.name = "hello world";
object.age = 18;

//对象字面量的方式创建对象
//对象的属性以key/value的形式体现，直白方便理解
var object2 = {
    name: "hello world",
    age: 18
}
```
>通过New和对象字面量创建的对象是等效的
###Object()
同时，`Object()`也是一个方法，用它可以来生成对象，如果调用该方法的时候，传入一个基本类型的值，则该方法会返回对应基本类型的包装对象的实例。

```javascript
Object(); //返回一个空对象
Object() instanceof Object //true

Object(undefined); //返回一个空对象
Object(undefined) instanceof Object //true

Object(null);  //返回一个空对象
Object(null) instanceof Object //true

//这里有一个疑问，undefined和null有什么区别？

Object(1) // 等同于 new Number(1)
Object(1) instanceof Object // true
Object(1) instanceof Number // true

Object('foo') // 等同于 new String('foo')
Object('foo') instanceof Object // true
Object('foo') instanceof String // true

Object(true) // 等同于 new Boolean(true)
Object(true) instanceof Object // true
Object(true) instanceof Boolean // true
```

上面的代码可以表明，`Object()`函数可以将各种类型的值转为对应的构造函数生成的对象，同时，如果传入的参数本来就是一个对象，则返回原对象，利用这个特性可以写一个判断变量是非为对象的函数
```javascript
var object = {};
Object(object); //返回原对象
object === Object(object); //true

//全等===表示不仅值相等，同时类型相等

var func = function(){};
Object(func); //返回原函数对象
func === Object(func); //true

function isObject(argument){
    return argument === Object(argument);
}

isObject([]); //[]表示一个数组对象，返回值为true
isObject(true); //true是一个boolean的基本类型，不是对象，返回fasle
```
###Object对象的静态方法




