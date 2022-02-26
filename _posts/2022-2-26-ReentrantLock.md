---
5layout:     post
title:      MonitorPlus(JDK限定) -> Reentrantlock
subtitle:   
date:       2022-2-26
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - JUC
 


---

## 前言

Synchronized优化了半天，发现直接用C++的东西还是不够灵活，干脆把Monitor本土化，于是有了AQS，用意类似AbstractMap，作为框架，后续定制阻塞式锁的话，直接继承即可。



## AQS ( AbstractQueuedSynchronizer )

#### 本土化方式一：用state来表示owner的状态

AQS把owner的状态细分为独占模式和共享模式，说白了就是owner不为空就是独占，为空就是在共享。

getState()方法获取state状态。

setState()方法设置state状态。

compareAndSetState()方法CAS设置state状态。

对比Synchronized那**无声无息的使用**，AQS更为灵活且透明。  

#### 本土化方式二：提供了基于 FIFO 的等待队列来替换EntryList

#### 本土化方式三：条件变量来实现等待、唤醒机制，支持多个条件变量，强于 Monitor 的单 WaitSet

synchronized最大的不便之处在于它的waitSet只有一个，对于一些复杂的场景，比如生产者消费者模式，需要两个及以上的waitSet相互合作，这时候AQS的便利之处就体现出来了。

















