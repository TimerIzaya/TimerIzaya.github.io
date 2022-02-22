---
layout:     post
title:      深挖一下synchronized
subtitle:   多线程的命根子
date:       2022-1-5
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - Java
    - JUC


---

[TOC]



## 互斥同步综述

互斥同步是一种最常见的保证并发正确性的手段。

### 传统实现

Java里，最基本的互斥同步手段就是`synchronized`关键字，`synchronized`关键字经过Javac编译之后，会在同步块的前后分别形成`monitorenter`和`monitorexit`这两个字节码指令。这两个字节码指令都需要一个`reference`类型的参数来指明要锁定和解锁的对象。

根据《Java虚拟机规范》的要求，在执行`monitorenter`指令时，首先要去尝试获取对象的锁。如果这个对象没被锁定，或者当前线程已经持有了那个对象的锁，就把锁的计数器的值增加一，而在执行`monitorexit`指令时会将锁计数器的值减一。一旦计数器的值为零，锁随即就被释放了。如果获取对象锁失败，那当前线程就应当被阻塞等待，直到请求锁定的对象被持有它的线程释放为止。 

所以可以得出：

1. 被`synchronized`修饰的代码块对同一条线程来说是**可重入的**。这意味着同一线程反复进入同步块也不会出现自己把自己锁死的情况。
2. 被`synchronized`修饰的同步块在持有锁的线程执行完毕并释放锁之前，会无条件地阻塞后面其他线程的进入。

从操作系统执行成本的角度看，这无疑是一个**重量级操作**。

Java线程是映射到OS的原生内核上的，如果要阻塞或者唤醒一个线程，需要OS帮助，也就不可避免的陷入用户态到核心态的转换，会消耗处理器大量的时间。对于的简单的代码块，比如`setter()`、`getter()`，内核态用户态切换的时间甚至比代码本身还长，所以说synchronized是java中的一个**重量级操作**。

### JUC实现

另外，自jdk5后，JUC出现了，Lock接口成为了全新的互斥同步手段，基于Lock接口，用户可以以非块的形式实现互斥同步，摆脱了语言特性的束缚。

重入锁（ReentrantLock）是Lock接口最常见的一种实现，它与synchronized一样是可重入的。在基本用法上，ReentrantLock也和synchronized很相似，只是代码写法上稍有区别。ReentrantLock与synchronized相比增加了一些高级功能，主要有以下三项：

1. **等待可中断**：当持有的锁的线程长期不释放锁的时候，等待的线程可以适当的选择放弃。

2. **公平锁：**多个线程等待一个线程的时候，按照申请时间顺序排列。synchronized是非公平的，ReentrantLock默认也是非公平的，但是可以设置为公平锁。**不过一旦使用了公平锁，将会导致ReentrantLock的性能急剧下降，会明显影响吞吐量。**

3. **绑定多个条件：**在synchronized中，锁对象的wait()跟它的notify()或者notifyAll()方法配合可以实现一个隐含的条件，如果要和多于一 

   个的条件关联的时候，就不得不额外添加一个锁；而ReentrantLock则无须这样做，多次调用newCondition()方法即可。 

### 两者对比

在JDK5之前，synchronized是比ReentrantLock吞吐量低的，但是在后续的优化中，两者基本持平。      



## Java对象头（以32位虚拟机为例）

**1.对象自身运行时数据，也叫MarkWord。**

<img src="https://gitee.com/timerizaya/timer-pic/raw/master/img/image-20220105225617710.png" alt="image-20220105225617710" style="zoom: 67%;" /> 

**2.类型指针**，也就是instanceKlass。

**3.如果是数组，**还需要一块保留长度的数据，这样虚拟机才可以判断出数组占用内存大小。  



## 重量级锁的底层实现原理：

<img src="https://gitee.com/timerizaya/timer-pic/raw/master/img/image-20220130033435674.png" alt="image-20220130033435674" style="zoom:80%;" />

如果说synchronized底层是monitorenter和monitorexit，那么更底层就是Monitor对象的系统调用，Monitor也叫管程。

对象头中指向重量级锁的指针，也就是指向Monitor对象。

- 如果当前Monitor的Owner为空，那么当前申请锁的线程就直接成为Owner。
- 如果当前Monitor的Owner不为空，那么当前申请锁的线程进入阻塞状态，加入EntryList。
- Waitset是已经申请过锁，但是条件不满足进入WAITING状态的线程。



## 锁优化1：轻量级锁

轻量级锁是JDK 6时加入的，轻量级锁并不是用来代替重量级锁的。

经过前辈们的研究发现大部分锁在整个同步周期内不存在锁竞争，在没有竞争的时候会使用**轻量级锁**，这样就可以减少开销了。

轻量级锁包括偏向锁等等锁的实现都是利用**对象头**实现的。

### 轻量级锁的工作过程

<img src="https://gitee.com/timerizaya/timer-pic/raw/master/img/image-20220130035402092.png" alt="image-20220130035402092" style="zoom:80%;" />

1. 代码进入同步块时如果同步对象没被锁定，也就是标志位为01，JVM会在当前线程栈帧中建立一个LockRecord，LockRecord是一个线程内独享的存储，每一个线程都有一个可用LockRecord列表。

   LockRecord包含了：

   - **Displaced Mark Word**：也就是MarkWord的拷贝
   - **Owner：**对象的markword

2. 在Displaced Mark Word拷贝完成后，当前线程会用CAS把LockRecord对象的对象头和同步对象的对象互换，修改成功的线程将获得轻量级锁。失败则线程膨胀为重量级锁。

3. #### 膨胀成重量级锁的过程

   1. 为同步对象申请 Monitor 锁，让同步对象指向重量级锁地址。

   2. 自己进入 Monitor 的 EntryList。

   3. 当 Thread-0 退出同步块解锁时，使用 cas 将 Mark Word 的值恢复给对象头，失败。这时会进入重量级解锁

      流程，即按照 Monitor 地址找到 Monitor 对象，设置 Owner 为 null，唤醒 EntryList 中 BLOCKED 线程

   <img src="https://gitee.com/timerizaya/timer-pic/raw/master/img/image-20220130035646444.png" alt="image-20220130035646444" style="zoom:80%;" />



## 锁优化1：自旋锁和自适应自旋锁

synchronized之所以是重量级的，最主要是因为线程挂起和唤醒需要系统调用，导致效率降低。

JVM开发团队发现在很多情况，锁只会持续很短的一段时间，那么这时候线程挂起和唤醒就不值得了。

**重量级锁竞争的时候，还可以使用自旋来进行优化，如果当前线程自旋成功（即这时候持锁线程已经退出了同步块，释放了锁），这时当前线程就可以避免阻塞。**

有了自旋锁，竞争线程不需要挂起和唤醒，而是进入一个忙循环，无限等待。

这样的代价是：**会占用CPU**。因此自旋的时间必须要有个限度，超过这个限度就会恢复之前的挂起+唤醒的阻塞方法。

这个限度JDK6后变成自适应了，如果一个竞争线程刚刚开始自旋就获得到了锁，那么就可以认为它下次可能再次成功，就给予他更多的自旋时间，如果它自旋很少获得过锁，那么可能直接忽略到自旋过程。随着程序运行时间的增长，JVM对自旋的时间就会预测的越来越精准



## 锁优化2：锁消除

**顾名思义，JVM在编译的时候，对于一些要求同步，但是对共享数据不存在竞争的锁进行消除操作。**锁消除的主要判定依据来源于**逃逸分析**的数据支持，如果判断到一段代码中，在堆上的所有数据都不会逃逸出去被其他线程访问到，那就可以把它们当作栈上数据对待，认为它们是线程私有的，同步加锁自然就无须再进行。



## 锁优化3：锁粗化

如果虚拟机探测到有这样一串零碎的操作都对同一个对象加锁，将会把加锁同步的范围扩展（粗化）到整个操作序列的外部。

比如StringBuffer每次append都对内部代码块进行同步，其实指需要在所有append之前和之后加锁即可。



## 锁优化4：偏向锁

轻量级锁在没有竞争时（就自己这个线程），每次重入仍然需要执行 CAS 操作。

Java 6 中引入了偏向锁来做进一步优化：**只有第一次使用 CAS 将线程 ID 设置到对象的 Mark Word 头，之后发现这个线程 ID 是自己的就表示没有竞争，不用重新 CAS。以后只要不发生竞争，这个对象就归该线程所有。**

偏向锁可以通过JOL来可视化对象头来观察。

```java
        System.out.println(ClassLayout.parseInstance(new Timer()).toPrintable());
        TimeUnit.SECONDS.sleep(4);
        System.out.println(ClassLayout.parseInstance(new Timer()).toPrintable());
```

```
OFF  SZ               TYPE DESCRIPTION               VALUE
  0   8                    (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4                    (object header: class)    0xf800c143


OFF  SZ               TYPE DESCRIPTION               VALUE
  0   8                    (object header: mark)     0x0000000000000005 (biasable; age: 0)
  8   4                    (object header: class)    0xf800c143
```

前32个bit，也就是0到8字节是markword，后三位，无偏向为001，有偏向为101。

### 偏向锁细节：

一个对象的hashcode存在markword中的，markword只有在normal状态才会存hashcode。

如果这个对象作为重量级锁，那么hashcode会存在monitor中。

如果这个对象作为轻量级锁，那么hashcode会存在线程的LockRecord中。

但是偏向锁的头部需要存线程ID占用大量空间，所以hashcode没地方存了，所以如果调动一个对象的hashcode方法时，就会**默认禁用它的偏向锁**。









