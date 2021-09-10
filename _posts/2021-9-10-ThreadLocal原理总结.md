---
layout:     post
title:      ThreadLocal原理总结
subtitle:   彻底拿下ThreadLocal
date:       2021-9-10
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - JDK

---



### 	总结一下ThreadLocal，它和Hashmap都属于KV的不同实现方式，虽然不常用，但是其设计理念非常巧妙，值得深入理解。能作为面试轰炸机也不是空穴来风。



### ThreadLocal是什么

```java
 This class provides thread-local variables.  These variables differ from
their normal counterparts in that each thread that accesses one (via its
{@code get} or {@code set} method) has its own, independently initialized
copy of the variable.  {@code ThreadLocal} instances are typically private
static fields in classes that wish to associate state with a thread (e.g.,
a user ID or Transaction ID).
```

简单的说就是线程的局部变量。

用JDK注释的话来说：这个类提供线程本地变量，和我们正常的用法不同，正常我们会初始化一个Thread的实例，比如t，当我们需要使用这个变量的时候，用get和set去解决。而threadlocal不同，它是一个独立的部分，ThreadLocal的实例有**私有静态变量**可以和每个线程保持联系。

初看这段注释一头雾水，但可以明确的是，线程局部变量和我们正常想的设计不一样。



#### 直觉上，线程局部变量可以有如下两种设计方案：

1. Thread中设计一个KV容器，此容器的生命周期与线程保持同步，当给线程创建各种局部变量时，直接使用t.set()，当获得线程局部变量时，使用t.get()。

   ```java
   class TimerThread<T> extends Thread {
   
       private Map<Object, T> threadLocalMap = new ConcurrentHashMap<>();
   
       public void set(Object key, T value) {
           threadLocalMap.put(key, value);
       }
   
       public T get(Object key) {
           return threadLocalMap.get(key);
       }
       
   }
   ```

   

2. 每个线程局部变量全局设计一个KV容器，K为各个线程的ID，V为我们要存储的局部变量。

```java
class TimerThreadLocal<T>{
	
	//static保证此map能作用于所有线程
    private static Map<Long, T> map = new ConcurrentHashMap<>();

    public void set(T value){
        map.put(Thread.currentThread().getId(), value);
    }

    public T get(){
        return map.get(Thread.currentThread().getId());
    }
}

class Thread{
	TimerThreadLocal<T> threadLocal = null;
}
```



#### 实际上，这两种方案都有很大的缺点：

1. 线程局部变量作为成员变量直接使用，**不安全**，线程A中如果有线程B的实例则可以直接调用B的局部变量。另外，Key值如何取是个问题，可以直接把value值hash一下作为key值，但是这样设计较为冗余。**这解释了问题：为什么Threadlocal不直接设计成Thread的成员变量？**

   

2. 全局设计的初衷是好的，JDK初代也是这样设计的，但是当线程高并发时，全局的KV结构就要线程安全而**牺牲部分性能**，可以看到这里的map用了ConcurrentHashMap。另外，此全局KV不好保证map和thread拥有相同的生命周期，线程意外中断或者线程池复用，都是其弱点。**这也解释了问题：为什么ThreadLocal在JDK1.3之后就不再采用全局设计了？**





#### 当前的设计方案：

目前JDK里ThreadLocal设计其实是采用了上面说的两种方法的结合，设计的非常非常巧妙。

ThreadLocal里含有一个静态子类ThreadLocalMap，就是Thread中的成员变量。

```java
//ThreadLocal values pertaining to this thread. This map is maintained by the ThreadLocal class.
 ThreadLocal.ThreadLocalMap threadLocals = null;
```

从Thread源码看出，线程局部变量的实现最终还是在每个线程中放一个KV容器，也就是ThreadLocalMap。**而各个线程的Map是统一交给ThreadLocal去管理的。**

ThreadLocal本身的作用，抛开其map子类，只是产生当前定义的线程局部变量实例的hash值，当再用ThreadLocal定义一个线程局部变量时，这个hash码会固定增长一个值，保证此hash的唯一性。

```java
public class ThreadLocal<T> {
    
    //比如我要创建一个线程局部变量arr[]，这个hashCode就是arr[]的key值
    //在不同的线程中，都可以使用这个hashcode来获得不同线程中的arr[]
    private final int threadLocalHashCode = nextHashCode();
    
    //获得到当前线程的map，通过hashcode计算key，获得value
    public T get() {}
    
    //获得到当前线程的map，通过hashcode计算key，存储value
    public void set(T value){}
 	
    static class ThreadLocalMap {
    	//实现
    }
    
}
```

这里的设计十分巧妙，首先使用一个固定增长的hashcode，解决了方案1中的key值怎么取的问题。其次，每个线程都拥有一个map变量，解决了线程局部变量和线程的生命周期同步的问题。

除开这些总体的设计，代码中依然有很多值得学习的精妙小细节。

1. **为什么ThreadLocal中能获得Thread的map，安全吗？**

   因为Thread的ThreadLocal是默认权限，默认权限代表在当前同级的包中可以获取，包外不行。而Thread和ThreadLocal同为java.lang包中，所以ThreadLocal可以直接拿到每一个线程的Map，用户无法直接获得每一个线程的Map，这也直接的体现了这样设计的安全性，以及ThreadLocal作为一个管理类的特点。

   这里贴一下类的权限表。

   |           | **同一个类** | **同一个包** | **不同包的子类** | **不同包的非子类** |
   | --------- | ------------ | ------------ | ---------------- | ------------------ |
   | Private   | √            |              |                  |                    |
   | Default   | √            | √            |                  |                    |
   | Protected | √            | √            | √                |                    |
   | Public    | √            | √            | √                | √                  |

   

2. #### 为什么ThreadLocalMap要用静态子类？

   先ThreadLocalMap的注释：

   ```
   
        ThreadLocalMap is a customized hash map suitable only for
        maintaining thread local values. No operations are exported
        outside of the ThreadLocal class. The class is package private to
        allow declaration of fields in class Thread.  To help deal with
        very large and long-lived usages, the hash table entries use
        WeakReferences for keys. However, since reference queues are not
        used, stale entries are guaranteed to be removed only when
        the table starts running out of space.
      
   ```

   ThreadLocalMap是一个仅仅用来管理线程局部变量的定制的hashmap。它的一切操作仅仅限定在ThreadLocal内。这个类是包私有的，为了让Thread中可以声明此类。**为了处理大量的数据以及更长久的使用，它的entries对每个key使用弱引用。**但是，既然不使用引用队列了，那么只有当table的空间不足时旧的entries才会保证被删除。

 

















































