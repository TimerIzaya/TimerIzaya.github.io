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

## 互斥同步

互斥同步是一种最常见的保证并发正确性的手段。

### 传统实现

Java里，最基本的互斥同步手段就是synchronized关键字，synchronized关键字经过Javac编译之后，会在同步块的前后分别形成**monitorenter**和**monitorexit**这两个字节码指令。这两个字节码指令都需要一个reference类型的参数来指明要锁定和解锁的对象。

根据《Java虚拟机规范》的要求，在执行monitorenter指令时，首先要去尝试获取对象的锁。如果这个对象没被锁定，或者当前线程已经持有了那个对象的锁，就把锁的计数器的值增加一，而在执行monitorexit指令时会将锁计数器的值减一。一旦计数器的值为零，锁随即就被释放了。如果获取对象锁失败，那当前线程就应当被阻塞等待，直到请求锁定的对象被持有它的线程释放为止。 

所以可以得出：

1. 被synchronized修饰的代码块对同一条线程来说是**可重入的**。这意味着同一线程反复进入同步块也不会出现自己把自己锁死的情况。
2. 被synchronized修饰的同步块在持有锁的线程执行完毕并释放锁之前，会无条件地阻塞后面其他线程的进入。

从操作系统执行成本的角度看，这无疑是一个**重量级操作**。

Java线程是映射到OS的原生内核上的，如果要阻塞或者唤醒一个线程，需要OS帮助，也就不可避免的陷入用户态到核心态的转换，会消耗处理器大量的时间。对于的简单的代码块，比如setter()、getter()，内核态用户态切换的时间甚至比代码本身还长，所以说synchronized是java中的一个**重量级操作**。

### JUC实现

另外，自jdk5后，JUC出现了，Lock接口成为了全新的互斥同步手段，基于Lock接口，用户可以以非块的形式实现互斥同步，摆脱了语言特性的束缚。

重入锁（ReentrantLock）是Lock接口最常见的一种实现，它与synchronized一样是可重入的。在基本用法上，ReentrantLock也和synchronized很相似，只是代码写法上稍有区别。ReentrantLock与synchronized相比增加了一些高级功能，主要有以下三项：

1. **等待可中断**：当持有的锁的线程长期不释放锁的时候，等待的线程可以适当的选择放弃。

2. **公平锁：**多个线程等待一个线程的时候，按照申请时间顺序排列。synchronized是非公平的，ReentrantLock默认也是非公平的，但是可以设置为公平锁。**不过一旦使用了公平锁，将会导致ReentrantLock的性能急剧下降，会明显影响吞吐量。**

3. **绑定多个条件：**在synchronized中，锁对象的wait()跟它的notify()或者notifyAll()方法配合可以实现一个隐含的条件，如果要和多于一 

   个的条件关联的时候，就不得不额外添加一个锁；而ReentrantLock则无须这样做，多次调用newCondition()方法即可。 

### 两者对比

在JDK5之前，synchronized是比ReentrantLock吞吐量低的，但是在后续的优化中，两者基本持平。  



## 锁优化

### 自旋锁和自适应自旋锁

synchronized之所以是重量级的，最主要是因为线程挂起和唤醒需要系统调用，导致效率降低。

JVM开发团队发现在很多情况，锁只会持续很短的一段时间，那么这时候线程挂起和唤醒就不值得了。

有了自旋锁，竞争线程不需要挂起和唤醒，而是进入一个忙循环，无限等待。

这样的代价是：**会占用CPU**。因此自旋的时间必须要有个限度，超过这个限度就会恢复之前的挂起+唤醒的阻塞方法。

这个限度JDK6后变成自适应了，如果一个竞争线程刚刚开始自旋就获得到了锁，那么就可以认为它下次可能再次成功，就给予他更多的自旋时间，如果它自旋很少获得过锁，那么可能直接忽略到自旋过程。随着程序运行时间的增长，JVM对自旋的时间就会预测的越来越精准。

### 锁消除

**顾名思义，JVM在编译的时候，对于一些要求同步，但是对共享数据不存在竞争的锁进行消除操作。**锁消除的主要判定依据来源于**逃逸分析**的数据支持，如果判断到一段代码中，在堆上的所有数据都不会逃逸出去被其他线程访问到，那就可以把它们当作栈上数据对待，认为它们是线程私有的，同步加锁自然就无须再进行。

### 锁粗化

如果虚拟机探测到有这样一串零碎的操作都对同一个对象加锁，将会把加锁同步的范围扩展（粗化）到整个操作序列的外部。

比如StringBuffer每次append都对内部代码块进行同步，其实指需要在所有append之前和之后加锁即可。



## Java对象头（以32位虚拟机为例）

**第一部分**：对象自身运行时数据，也叫MarkWord，具体布局如图。

<img src="https://gitee.com/timerizaya/timer-pic/raw/master/img/image-20220105225617710.png" alt="image-20220105225617710" style="zoom:67%;" />

**第二部分**：类型指针，也就是instanceKlass。

**第三部分**：如果是数组，还需要一块保留长度的数据，这样虚拟机才可以判断出数组占用内存大小。  



## Moniter

个人以为“获得锁”这种说法是有失偏颇的，如果把临界区代码看作是一个房间，用一个对象作为锁，把这个房间上锁，那么获得这个房间的使用权，这样的行为应该叫“获得钥匙“，但是既然说惯了，那就像”双亲委派“一样仅仅当个代号吧。

而**Moniter**，就是房门的锁。用一段简单的代码为例：

```java
public class Solution {
    static final Object lock = new Object();
    static int counter = 0;

    public static void main(String[] args) throws Exception {
        synchronized (lock){
            counter++;
        }
    }
}
```

这个lock，就是作为临界区代码块的锁，lock对象头中指向重量级锁的指针便会指向Moniter对象。

**Moniter对象有三个重要的成员变量：**

1. Owner（当前锁所有者）
2. EntryList（等待获得锁的线程）
3. WaitSet（Waiting状态的线程）

**争夺步骤：**

1. 刚开始Moniter中的Owner为null
2. 当t1执行synchronized (lock)就会把Moniter的所有者置为t1，一个Moniter只能有一个Owner。
3. 在t1上锁的过程中，如果t2、t3、t4也来执行synchronized (lock)，就会进入entryList。
4. 当t1执行完毕，entrylist中的线程会以非公平的方式争夺锁。

**对代码的字节码进行分析：**

```java
  public static void main(java.lang.String[]) throws java.lang.Exception;
    descriptor: ([Ljava/lang/String;)V
    flags: ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=3, args_size=1
         0: getstatic     #2                   // 把lock push stack
         3: dup							    // copy栈顶，再次push stack
         4: astore_1						// pop stack，放到slot 1
         5: monitorenter					// 把lock对象的MarkWord置为Moniter指针
         6: getstatic     #3                  // 把counter push stack
         9: iconst_1						// 把常数1 push stack
        10: iadd							// pop + pop的结果push stack
        11: putstatic     #3                  // pop结果赋予counter
        14: aload_1							// 把slot1里之前存下的lock取出
        15: monitorexit						// 重置markword，唤醒entrylist
        16: goto          24
        19: astore_2                          // 异常处理，把e放入slot 2
        20: aload_1							// 加载slot里的lock
        21: monitorexit						//重置markword，唤醒entrylist
        22: aload_2
        23: athrow
        24: return
```