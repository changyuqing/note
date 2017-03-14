# vue

```html
<ol>
     <todo-item v-for="(name,index) in names" v-bind:indexpos="index" v-bind:todo="name" ></todo-item>
       这个语法会循环生成
       <todo-item indexpos="0" todo="vue" ></todo-item>
       <todo-item indexpos="1" todo="react" ></todo-item>
       <todo-item indexpos="2" todo="augular" ></todo-item>
       //然后经过component模板处理，把该元素property和模板对应的全部读取并替换到模板
       <li>vue</li>
       <li>react 我是下标1</li>
       <li>angular</li>
</ol>
```

