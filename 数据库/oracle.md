# oracle

数据库与表空间的关系：一个数据库有多个表空间，oracle的优化大部分也是基于表空间的，表空间一般有system、temp、undo等

数据文件与表空间的关系：一个表空间是有多个数据文件来构成的，数据文件的位置可以分开，这样可以IO并发，加快操作的速度，表视图一些对象都是存放在数据文件中的

dba_tablespaces和user_tablespaces两个表存放着不同权限用户对应的表空间

```sql
select tablespace_name from user_tablespaces; //查看普通用户的表空间
```

dba_users、user_users 存放着用户的信息，其中default_tablespace  temporary_tablespace对应该用户的默认和临时表空间

```sql
alter user system
default tablespace system; // 修改默认表空间
```

**表空间的创建：**

```sql
// 永久表空间
create tablespace testone
datafile 'testone.dbf' size 10m;
// 临时表空间
create temporary tablespace testtwo
tempfile 'testtwo.dbf' size 10m;
```

dba_data_files表中存储了永久表空间对应数据文件的相关信息

dba_temp_files表中存储了临时表空间对应数据文件的相关信息

```sql
// 查找表空间对应的数据文件的路径
select file_name from dba_data_files where tablespace_name = 'TESTONE';
```

**修改表空间：**

* 修改表空间的状态：联机或者脱机状态
* 修改数据文件

![mark](http://ogzrgstml.bkt.clouddn.com/blog/20170422/150359002.png)

```sql
// 修改表空间的联机或者脱机状态
alter tablespace testone online/offline

// 读写状态（前提联机）  联机状态就是读写状态
alter tablespace testone read only;

// 增加数据文件
alter tablespace testone add datafile 'testone_2.dbf' size 10m;
// 删除数据文件 不能删除默认的数据文件，需要删除则直接删除整个表空间
alter tablespace testone drop datafile 'testone_2.dbf';
```

**删除表空间**

```sql
// including contents表示连同数据文件一起删除
drop tablespace testtwo including contents;
```

表的操作：

```sql
// 添加表的字段
alter table customers add haha varchar2(10);
// 修改表的字段信息
alter table customer modify haha varchar2(300);
// 删除表的字段
alter table customers drop column haha;
// 修改字段的名字
alter table customers rename column haha to newhha;
```

