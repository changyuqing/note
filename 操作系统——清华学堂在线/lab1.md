# lab1 bootloader启动ucore os

## x86启动顺序

* **第一条指令**　　CPU加电初始化的时候，会给CS:IP寄存器一个初始值`F00H:FFF0`，此时CPU处于实模式，这个初始值指向的地址是BIOS的`EPROM`的地址，通常这个地址的所对应的第一条指令是一个长跳转的指令，跳转到BIOS的代码中执行，这个时候CS：IP寄存器会被更新为`0x7c00`
* **从BIOS到Bootloader中**   `BIOS`加载存储设备（比如硬盘），把磁盘的第一个扇区（主引导扇区MBR）的`512字节`读到内存的`0X7C00`（经过上面的一步，CPU的CS：IP寄存器已经指向了这个地址），然后从这里开始执行`Bootloader`
* **从Bootloader到OS**
  1. 使能保护模式和段机制
  2. 从硬盘上读取kernel in ELF格式的ucore kernel（一般是跟在MBR后面的扇区），放在内存的指定的固定位置
  3. 跳转到ucore OS的入口点执行，这个时候将控制权转交给操作系统

### 保护模式与段机制

下图就是`x86`中保护模式的寻址机制，CS寄存器中存放`Logical Address`(注意只有16位，只存放一个索引下表)，EIP寄存器中存放`Offset`（段内偏移）的值，实际上，CS中存放的是`GDT`全局描述符表的下表，需要去在图中的`Descriptor Table`中找到`Segment Descriptor`(段描述符)，获取基地址，与偏移地址相加得到线性地址

![](http://ogzrgstml.bkt.clouddn.com/20161207/123159544.png)

其中CS寄存器的内容的前十三位是索引的下标，后两位是特权级描述

![](http://ogzrgstml.bkt.clouddn.com/20161207/130130573.png)

使能保护模式还需要设置CR寄存器的bit 0（PE）置为1

### 加载ELF格式的ucore OS Kernel



