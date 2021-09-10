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



### 	总结一下ThreadLocal，它和Hashmap都属于KV的不同实现方式，虽然不常用，但是其设计理念值得深入理解。



# ThreadLocal是什么

```
* This class provides thread-local variables.  These variables differ from
* their normal counterparts in that each thread that accesses one (via its
* {@code get} or {@code set} method) has its own, independently initialized
* copy of the variable.  {@code ThreadLocal} instances are typically private
* static fields in classes that wish to associate state with a thread (e.g.,
* a user ID or Transaction ID).
```

用JDK注释的话来说：这个类提供的是线程本地变量，













































