---
5layout:     post
title:      ReentrantReadWritelock、缓存和并发读写
subtitle:   
date:       2022-2-26
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - JUC
 
---

## 读写锁的意义

假设现在不用读写锁，那么想保证IO的线程安全，那只能把read方法和write方法都加上锁，这样就成了串行IO，效率极低。

并发读写的时候，写操作是需要互斥的，这毋庸置疑，但是读操作是可以并行的，因为读不会修改共享变量。

所以可以得出，读读不用互斥，读写要互斥，写写要互斥。**ReentrantReadWritelock**就在底层完成了这一工作。

 
