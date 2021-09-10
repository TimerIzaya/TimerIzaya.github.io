---
layout:     post
title:      ThreadLocal原理总结
subtitle:   拿下ThreadLocal
date:       2021-9-10
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - JDK

---



#### 	总结一下ThreadLocal，它和Hashmap都属于KV的不同实现方式，虽然不常用，但是其设计理念值得深入理解。能作为面试轰炸机也不是空穴来风。



### ThreadLocal是什么

```
* This class provides thread-local variables.  These variables differ from
* their normal counterparts in that each thread that accesses one (via its
* {@code get} or {@code set} method) has its own, independently initialized
* copy of the variable.  {@code ThreadLocal} instances are typically private
* static fields in classes that wish to associate state with a thread (e.g.,
* a user ID or Transaction ID).
```

简单的说就是线程的局部变量。

用JDK注释的话来说：这个类提供线程本地变量，和我们正常的用法不同，正常我们会初始化一个Thread的实例，比如t，当我们需要使用这个变量的时候，用get和set去解决。而threadlocal不同，它是一个独立的部分，ThreadLocal的实例有**私有静态变量**可以和每个线程保持联系。

初看这段注释一头雾水，但可以明确的是，线程局部变量和我们正常想的设计不一样。



##### 直觉上，线程局部变量可以有如下两种设计方案：

1. Thread中设计一个KV容器，此容器的生命周期与线程保持同步，当给线程创建局部变量时，直接使用实例t.map.set()，当获得线程局部变量时，使用t.map.get()。
2. 全局设计一个KV容器，K为各个线程的ID，V为我们要存储的局部变量。



##### 实际上，这两种方案都有很大的缺点：

1. 作为局部变量直接使用，**线程不安全**，线程A中如果有线程B的实例则可以直接调用B的局部变量，不够安全。另外，多余的key设计冗余。**这解释了：为什么Threadlocal不直接设计成Thread的成员变量呢？**

   

2. 全局设计的初衷是好的，JDK初代也是这样设计的，但是当线程高并发时，全局的KV结构就要线程安全而**牺牲部分性能**。另外，此全局KV不好保证threadlocal和thread拥有相同的生命周期，代码复杂度变高，设计冗余。**这解释了：为什么ThreadLocal在JDK1.7之后就不再采用全局设计了呢？**

























































