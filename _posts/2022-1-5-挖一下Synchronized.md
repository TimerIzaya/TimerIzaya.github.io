---
layout:     post
title:      挖一下Synchronized
subtitle:   lock开会了
date:       2022-1-5
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - Java
    - JUC

---

## Java对象头（以32位虚拟机为例）

**第一部分**：对象自身运行时数据

<img src="https://gitee.com/timerizaya/timer-pic/raw/master/img/image-20220105014312605.png" alt="image-20220105014312605" style="zoom: 80%;" />

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



















































