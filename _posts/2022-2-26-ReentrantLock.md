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





## ReentrantLock核心成员变量

```java
// AQS的简单实现    
abstract static class Sync extends AbstractQueuedSynchronizer {}
//非公平Sync
static final class NonfairSync extends Sync {}
//公平Sync
static final class FairSync extends Sync {}
```



## ReentrantLock 非公平锁原理

### Lock方法

```java
final void lock() {
    //先尝试CAS看state是否为0
    //CAS成功则直接把当前线程设置为独占线程。
    //CAS失败则调用acquire
    if (compareAndSetState(0, 1))
        setExclusiveOwnerThread(Thread.currentThread());
    else
        acquire(1);
}
```

### Acquire方法

```java
public final void acquire(int arg) {
    // 用tryAcquire再次尝试，万一成功就不用管了，其中tryAcquire为可重入实现
    // 尝试失败则调用addWaiter把当前线程加入阻塞队列尾部，然后调用acquireQueued方法
    if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

#### tryAcquire方法

```java
final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    // 如果当前线程就是占有锁的线程，那么发生重入
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0) // overflow
            throw new Error("Maximum lock count exceeded");
        setState(nextc); // state++
        return true;
    }
    return false;
}
```

### acquireQueued方法

```java
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        // 无限循环
        for (;;) {
            // 找当前节点的前驱节点
            final Node p = node.predecessor();
            // 如果前节点是dummy的话，意味着当前节点是抢到锁的最佳人选，再次尝试获取锁
            if (p == head && tryAcquire(arg)) {
                setHead(node);
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            // should...()的含义为：如果获得锁失败了，要不要暂停？如果要暂停，就调用parkAndCheckInterrupt()
            // should...()主要把前驱节点的status设为-1，-1代表need parking，需要挂起
            // 假设现在的情况为：线程0占用锁，线程1234先后开始争夺
            // dummy <-> 1 <-> 2 <-> 3 <-> 4 那么五个节点会全部挂起，等待锁释放
            // 1离head最近，最有希望获得锁，如果1获得到锁了，那么后继的2离head最近，最有希望获得锁
            if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```

#### release方法

```java
    public final boolean release(int arg) {
        // 如果尝试解锁成功
        if (tryRelease(arg)) {
            Node h = head;
            if (h != null && h.waitStatus != 0)
                //唤醒头部节点，如果此时有新的线程进来，则和它一起争夺，所以“不公平”
                unparkSuccessor(h); 
            return true;
        }
        return false;
    }
```

### tryRelease方法

```java
protected final boolean tryRelease(int releases) {
    int c = getState() - releases; //state--
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();
    boolean free = false;
    //支持可重入，state为0才释放锁
    if (c == 0) {
        free = true;
        setExclusiveOwnerThread(null);
    }
    setState(c);
    return free;
}
```

  



## ReentrantLock可打断模式

ReentrantLock默认是不可打断模式，也就是如果外界进行了打断，也只是获得了一个打断标记。

所以也对应了可打断的方法，整体实现和上文的`acquireQueued`()几乎一致。

```java
    private void doAcquireInterruptibly(int arg)
        throws InterruptedException {
        final Node node = addWaiter(Node.EXCLUSIVE);
        boolean failed = true;
        try {
            for (;;) {
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
                if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
                    throw new InterruptedException(); //如果触发异常，直接抛出，不做“冷处理”
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```



## ReentrantLock公平锁实现

```java
protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // 如果当前线程本来不是AQS队列里的线程，现在要竞争锁了
        // 得用hasQueuedPredecessors() 看队列里是否有老二（老大为dummy）
        // 如果有老二，那肯定是老二上，人家等了半天，当前线程乖乖去队列后面排队。
        if (!hasQueuedPredecessors() && compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0)
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    return false;
}
```

##   

## Condition的Await实现

```java
public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    Node node = addConditionWaiter();
    int savedState = fullyRelease(node);
    int interruptMode = 0;
    while (!isOnSyncQueue(node)) {
        LockSupport.park(this);
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
        interruptMode = REINTERRUPT;
    if (node.nextWaiter != null) // clean up if cancelled
        unlinkCancelledWaiters();
    if (interruptMode != 0)
        reportInterruptAfterWait(interruptMode);
}
```

##   

## Condition的signal方法实现

```java
private void doSignal(Node first) {
    //把ConditionObject里的链表清空，让他们全去竞争
    do {
        if ((firstWaiter = first.nextWaiter) == null){
            lastWaiter = null;
        }
        first.nextWaiter = null;
    } while (!transferForSignal(first) && (first = firstWaiter) != null);
}

final boolean transferForSignal(Node node) {
	//因为等待的线程可能被打断或者超时，所以要CAS验证一下才可以transfer。
    if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
        return false;

    Node p = enq(node);
    int ws = p.waitStatus;
    if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
        LockSupport.unpark(node.thread);
    return true;
}
```























