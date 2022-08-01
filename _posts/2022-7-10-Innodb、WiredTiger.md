---
layout:     post
title:      Innodb与WiredTiger解析
subtitle:   重新认识数据库
date:       2022-8-1
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - 数据库
 

---

### 常识

##### 为什么数据库中几乎不用MMAP？

一次read()的过程：磁盘page -> 内存page cache -> 内存用户空间。

一次MMAP的read()过程：磁盘page -> 内存page cache（用户直接操作page cache）。

直观上来看，MMAP少一次内存copy，性能提升。

实际上，MMAP有以下缺点：

1. page cache属于内核空间，需要建立页表映射。
2. MMAP是一种按需分页（demand paging）。也就是先映射好一段地址，当真正需要访问某页的时候才会去磁盘加载。这样会触发大量page fault（A page fault occurs when a process accesses a page that is mapped in the virtual address space, but not loaded in physical memory）。
3. 面对批量小IO，4K对齐会成为瓶颈。比如read 1k的数据，有3k空间会被浪费。不仅仅浪费，还会造成大量空间碎片。

实际上，随着硬件发展，内存多copy一次并不会特别影响性能，read()方式也并不是完全被MMAP吊打。

两者二选一的话，用性能优化竞赛的经验来看，还是那句话：都写一遍。

以上这些都是日常开发需要的，但是我们的开发都是基于用户空间的。**从数据库的角度**，MMAP是非常差劲的选择，或者说，依赖OS是非常不明智的做法。

本质原因是MMAP让我们无法掌控flush的时机，失去了数据在内存和磁盘移动的权利，这对数据库来说是非常致命的。数据库需要对数据足够的主动权，比如：

1. 按指定顺序刷脏页
2. buffer置换策略
3. 线程进程调度策略

一个非常著名的例子，MongoDB初版用了MMAP作为数据库内核的IO方式，用了相当多的精力去弥补MMAP带来的缺陷，最后还是放弃了MMAP，四处筹钱买下了WiredTiger，从此一飞冲天。

用CMU 15-445课程讲师Andy的话来说：

> The OS is **not** your friend.









