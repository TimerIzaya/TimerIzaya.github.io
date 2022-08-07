---
layout:     post
title:      WiredTiger引擎解析
subtitle:   重新认识数据库
date:       2022-8-1
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - 数据库
 

---

## 为什么Mongo用WiredTiger？

答案是**MMAP这条路走不下去了。**

先说一下什么是内存映射。

一次正常的read()的过程：磁盘page -> 内存page cache -> 内存用户空间。

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

**这里的主动权描述还是比较笼统，举一个具体的例子：**

BufferPool的划分是以frame为单位的，一个frame其实就是一个page，只是叫法不同用于区分。

BufferPool用于存储page，而PageTable用于管理page，本质就是一个hash表，根据pageId可以查到这个page在BufferPool的哪个frame里。

PageTable有一些额外的元信息，最重要的是Dirty Flag和Pin Counter。

**Dirty Flag**用于判断page是否做了修改，用于表示当前页面需要刷盘。

**Pin Counter**是当前使用这个page的请求数量，用于表示当前page还不能刷盘。

- 场景1：当某个page现在正在被使用，甚至可能是热点page，也就是pin counter > 0，但是mmap却可能突然刷盘。	

- 场景2：当某个page被打上Dirty Flag，说明它做了修改，根据WAL的思想，我们需要先写完日志才能flush，mmap也可能突然刷盘。

------

**业界一个非常著名的例子**就是MongoDB，MongoDB初版用了MMAP作为数据库内核的IO方式，用了相当多的精力去弥补MMAP带来的缺陷，最后还是放弃了MMAP，四处筹钱买下了WiredTiger，从此一飞冲天。

**另一个著名的例子**就是谷歌的LevelDB，后由Facebook收购，基于LevelDB研发了RocksDB，Facebook做的第一件事就是移除LevelDB的MMAP。

用Andy Pavlo的话来说：

> **The OS is not your friend.**



## WiredTiger优势

1. **无锁并行框架：**充分利用 CPU 并行计算的内存模型的无锁并行框架，使得 WT 引擎在多核 CPU 上的表现优于其他存储引擎。
2. **磁盘优化算法：**WT 实现了一套基于 BLOCK/Extent 的友好的磁盘访问算法，使得 WT 在数据压缩和磁盘 I/O 访问上优势明显。
3. **简化事务模型：**实现了基于 snapshot 技术的 ACID 事务，snapshot 技术大大简化了 WT 的事务模型，摒弃了传统的事务锁隔离又同时能保证事务的 ACID。
4. **高效缓存模型：**WT 根据现代内存容量特性实现了一种基于 Hazard Pointer 的 LRU cache 模型，充分利用了内存容量的同时又能拥有很高的事务读写并发。

<img src="https://github.com/wiredtiger/wiredtiger/wiki/attachments/iiBench_insert_aws.png" alt="Pretty Pictures" style="zoom: 33%;" />

<img src="https://github.com/wiredtiger/wiredtiger/wiki/attachments/iiBench_query_aws.png" alt="Pretty Pictures" style="zoom: 33%;" />



## 性能优化的几个维度

1. 去重量锁，轻量化，最好无锁化
2. 去随机IO
3. 缓存性能拉满，不局限于内存，包括CPU Cache
4. 数据压缩

## WiredTiger引擎存储结构

#### B+Tree的优点：

1. 优化IO次数，三层的B+Tree能支持存储千万级别的数据
2. 方便范围查询

#### B+Tree的缺点：

1. 随机写入性能差

#### LSM

// todo 待补充

#### 总结：

<img src="https://github.com/wiredtiger/wiredtiger/wiki/attachments/LSM_btree_Throughput.png" alt="漂亮的图片" style="zoom: 33%;" /> 

1. 如果有大量的写操作的需求，则LSM是一种替换BTREE 更好的选择
2. Btree 的数据存储结构方式在大部分情况中是可以满足,写入和查询的需求的
3. 如果数据库中的collections 的需求比较复杂,则可以在一个DATABASE中选择适合的 lsm 和 btree 混合的模式

#### LSM的使用

1. 创建LSM结构的Collection

   ```shell
   db.createCollection(
       "lsm_stroage",
       { storageEngine: { wiredTiger: {configString: "type=lsm"}}}
   )
   ```

2. 创建LSM结构的Index

   ```shell
   db.lsm_stroage.createIndex(
       { value: 1 },
       { storageEngine: { wiredTiger: {configString: "type=lsm"}}}
   )
   ```

3. 2k连接，每个连接插入20w数据持续一分钟

   | Query                             | Result |
   | --------------------------------- | ------ |
   | db.lsm_storage.find({}).count()   | 107895 |
   | db.btree_storage.find({}).count() | 56157  |

   

   ## WiredTiger事务前置知识-WAL

   **行为：**先写日志，后刷盘。

   **目的：**刷脏页是随机写，而写日志是顺序写，节省IO消耗，提升性能。

   **分类：**根据Commit的标记时机和数据落盘时机顺序不同，WAL日志分为以下三类：

   1. **Undo-Only Logging**

      ​		Log记录可以表现为<T,X,V>，事务T修改了X的旧值V。这种WAL通过undo保证了原子性，却不能保证持久性。所以必须先刷盘再commit，落盘顺序为：Log -> Data -> Commit。

      ​		这种做法有两个坏处：

      ​		1.Page并发问题，如果两个事务同时修改了一个Page，一个事务提交需要Flush，会导致另一个事务的数据也被迫落盘，破坏了WAL的原则。

      ​		2.同步持久化Data导致频繁的随机写，影响性能。违背WAL通过顺序写优化性能的初衷。

   2. **Redo-Only Logging**

      ​		Log记录可以表现为<T,X,V>，事务T修改了X的新值V。这种WAL通过redo保证了持久性，却不能保证原子性。所以必须先commit再刷盘，落盘顺序为：Log -> Commit -> Data。

      ​		这种WAL依然不能解决Page并发的问题。如果两个事务同时修改了一个Page，只要有一个没提交，另一个就不能刷盘，这些数据全都放在内存中，限制很大。

   3. **Redo-Undo Logging**

      ​		Undo记录旧值保证了原子性，但必须通过Commit前刷盘保证持久性。

      ​		Redo记录新值保证了持久性，但必须通过Commit后刷盘保证原子性。

      ​		现在将Undo和Redo结合，就可以消除刷盘时机的限制，所以也解决了Page并发的问题。

      ​		因为只靠WAL就可以保证数据库故障恢复，刷盘操作就可以单独分开处理，更可以把地址连续的page攒着进行批量的顺序刷盘，进一步优化性能。

      ​		总结一下，Undo和Redo分别有一种缺陷，需要用严格的刷盘顺序来弥补，业界关于Commit时是否要强制刷盘统称为Force、No-Force，关于Commit前能否提前刷盘称为No-Steal、Steal。**Force保证了持久性，No-Steal保证了原子性。**

      ​	**所以排列组合有四种保证数据库宕机恢复的方式：**

      1. Redo(No-Force) + No-Steal，意味着commit时**不强制**全量刷盘，之前不可以刷盘，之后可以随便刷
      2. Undo(Steal) + Force, 意味着commit时**强制**全量刷盘，之前可以随便刷
      3. Redo(No-Force) + Undo(Steal)，意味着刷盘操作完全不受commit影响，可以在任意时机刷盘
      4. Force + No-Steal，意味着只能在commit时全量刷盘

   

   

   

## WiredTiger引擎事务实现

#### 事务实现的核心

1. snapshot
2. MVCC
3. redo log

#### 单个事务对象

```c
wt_transaction{
	transaction_id:    用于标识数据的版本号 （mvcc）
	snapshot_object:   当前事务开始时其他未提交事务集合（snapshot）
	operation_array:   本次事务中已执行的操作,用于事务回滚（mvcc）
	redo_log_buf:      操作日志缓冲区。用于事务提交后的持久化（redo log）
	State:             事务当前状态
}
```

#### 全局事务管理器

```
struct __wt_txn_global {
    current; // 当前最新的txnId
    oldest_id; // 最早产生的还在执行的写事务Id
    transaction_array; // 保存系统中所有的事务对象
    scan_count; // 正在扫描transaction_array数组的线程数，用于建立snapshot过程的无锁并发
};
```

#### SnapShot实现

**这里第一个无锁化的点**就在于创建snapshot时的scan_count。

开启事务的时候，事务ID是默认的`WT_TNX_NONE(= 0)`。当第一次执行写操作的时候，全局事务管理器给它分配一个唯一id。

创建一个snapshot的流程：

1. CAS判断scan_count是否为0，不为0则自旋
2. 如果为0，则系统调用CAS_ADD把scan_count加1
3. 扫描 transaction_array，获得所有事务ID不为0的事务。

#### MVCC实现

WT的MVCC本质就是个链表，记录txnId和修改的数据。

每次当我们get一个value的时候，依次遍历链表寻找合适版本的数据即可。

这里需要注意的是：**MVCC仅仅存在于内存中**

```
struct __wt_update {

    volatile uint64_t txnid; //事务ID

    WT_UPDATE *next; // 链表结构

    uint8_t data[]; // 更新的值
};
```

#### 事务执行

更新一个值的流程

1. 创建一个MVCC对象update
2. 判断是否被分配事务ID，如果没有则分配，并把事务状态设为HAS_TXN_ID
3. 事务的ID作为MVCC对象的版本号
4. 创建一个operation对象，指针指向update，并存入operation_array
5. 将MVCC对象设为当前MVCC链表头
6. 写一条redo log到redo_log_buf

#### 事务提交

由于WT属于Redo + No-Steal类型，所以事务提交时不用考虑数据持久化，只要把日志持久化就可以。完整步骤为：

1. 把redo_log_buf写入redo log file并持久化
2. 清除snapshot
3. 事务ID设为WT_TNX_NONE，也就是0，保证其它事务可见

#### 事务回滚

事务回滚有两种含义：

1. 事务执行中偷刷的数据，需要回滚，这里指的是磁盘里的数据
2. 事务执行中内存里修改的数据，需要回滚

很明显WT由于是No-Steal，所以并不需要考虑偷刷的情况，直接对内存里的数据操作即可。

具体操作为：遍历operation_array，对每个operation的update的事务ID设为一个*WT_TXN_ABORTED(= uint64_max)*，表示这个修改被回滚了，其他事务读MVCC的时候，跳过这个值就OK。

整个过程无锁、高效。

#### 事务的隔离级别

1. **Read-uncommited**
2. **Read-commited**
3. **Snapshot-Isolation**

这三种隔离级别都可以适用于读，但是写的话只能用快照隔离。快照隔离有如下特征：

1. 只读快照里的数据
2. 对事务不可见的数据做修改，会失败+回滚
3. 对事务可见但是写冲突的数据做修改，会失败+回滚

从事务隔离这个角度看，WT 并没有使用传统的事务独占锁和共享访问锁来保证事务隔离，而是通过对系统中写事务的 snapshot 来实现。这样做的目的是在保证事务隔离的情况下又能提高系统事务并发的能力。

#### 事务日志



































### 已知WiredTiger的mvcc不需要持久化，为什么Innodb的mvcc需要持久化？

因为innodb实现mvcc是对undolog进行了复用，undolog需要持久化。



### WiredTiger为什么没有undolog？

首先需要搞清楚undolog的作用。

常年受八股文荼毒的话，说到innodb，一提及redo就是宕机恢复，一提及undo就是mvcc和事务回滚。

其实应该反过来，一提及宕机恢复就该提到redo + undo。

**宕机恢复需要保证的是ACID中的AD。也就是已提交的事务宕机后依然存在（D），未提交事务的修改宕机后不存在（A）。**





### WiredTiger没有undolog是怎么做的事务回滚？













文本解释了：**为什么wiredtiger的redolog是逻辑日志，innodb的redolog是物理日志？**



### 物理日志、逻辑日志定义

##### 物理日志

举例：**Page 42:image at 367,2; before:'ab';after:'cd'**  

作用：把42号page的367、368字节从ab变成cd

特点：幂等

##### 逻辑日志

比物理日志更高层的抽象，可以看做是Sql语句。

一个逻辑日志可以对应多个物理日志。但多个物理日志不一定能对应一个逻辑日志。

特点：数据量小，所以适合IO吞吐量、网络带宽要求高的地方，所以用于同步binLog必然是逻辑日志。



### Innodb的RedoLog为什么用物理日志更合适？

1. **幂等性：**因为我们无法得知在事务执行期间，哪些page刷盘了。**所以redo重放必须是可重复的，也就是要保证幂等性。**
2. **并发重放：**物理日志的执行单位是page，**所以在重放的时候可以并发重放**，简单理解就是page和page之间是并行的，一个page内的执行操作是串行的。而逻辑日志由于一条日志可能对应多个page，所以无法并发，只能整体串行。

### Innodb的RedoLog是纯物理日志吗？（待补充）

当然不是。物理日志的优势在于幂等和页并发。但是页内的日志重发是串行的。16k的页极限情况下可能的日志量能上万，这样串行效率就非常低了。

### Innodb的UndoLog为什么用逻辑日志更合适？

1. 物理日志量会更大，所以redo log设计成了循环写，否则会占用大量空间。
2. 







文本解释了：**为什么innodb的undolog需要持久化？**

原因：**不考虑mvcc，innodb通过redolog和undolog的持久化保证了数据库的“高性能”宕机恢复能力，从而把事务数据的持久化操作分离，从最朴素的“同步的单次大量随机写” 优化到了 “异步的多次小量随机写 + 部分连续page顺序写”。**



## 数据库故障恢复需要保证：

1. Durability of Updates，持久性：已提交事务的修改，恢复后依然存在
2. Failure Atomic，原子性：未提交事务的的修改，恢复后不存在

## 最朴素的做法

Commit时强制刷脏页，会产生大量随机写操作，性能很差。但是也能保证。

## WAL

**行为：**先写日志，后刷盘。

**目的：**刷脏页是随机写，而写日志是顺序写，节省IO消耗，提升性能。

**分类：**Log中还需要记录Commit的标记，判断事务的状态，所以根据Commit的标记时机和数据落盘时机顺序不同，WAL日志分为以下三类：

1. **Undo-Only Logging**

   ​		Log记录可以表现为<T,X,V>，事务T修改了X的旧值V。这种WAL通过undo保证了原子性，却不能保证持久性。所以必须先刷盘再commit，落盘顺序为：Log -> Data -> Commit。

   ​		这种做法有两个坏处：

   ​		1.Page并发问题，如果两个事务同时修改了一个Page，一个事务提交需要Flush，会导致另一个事务的数据也被迫落盘，破坏了WAL的原则。

   ​		2.同步持久化Data导致频繁的随机写，影响性能。违背WAL通过顺序写优化性能的初衷。

2. **Redo-Only Logging**

   ​		Log记录可以表现为<T,X,V>，事务T修改了X的新值V。这种WAL通过redo保证了持久性，却不能保证原子性。所以必须先commit再刷盘，落盘顺序为：Log -> Commit -> Data。

   ​		这种WAL依然不能解决Page并发的问题。如果两个事务同时修改了一个Page，只要有一个没提交，另一个就不能刷盘，这些数据全都放在内存中，限制很大。

3. **Redo-Undo Logging**

   ​		Undo记录旧值保证了原子性，但必须通过Commit前刷盘保证持久性。

   ​		Redo记录新值保证了持久性，但必须通过Commit后刷盘保证原子性。

   ​		现在将Undo和Redo结合，就可以消除刷盘时机的限制，所以也解决了Page并发的问题。

   ​		因为只靠WAL就可以保证数据库故障恢复，刷盘操作就可以单独分开处理，更可以把地址连续的page攒着进行批量的顺序刷盘，进一步优化性能。

   ​		总结一下，Undo和Redo分别有一种缺陷，需要用严格的刷盘顺序来弥补，业界关于Commit时是否要强制刷盘统称为Force、No-Force，关于Commit前能否提前刷盘称为No-Steal、Steal。**Force保证了持久性，No-Steal保证了原子性。**

   ​	**所以排列组合有四种保证数据库宕机恢复的方式：**

   1. Redo(No-Force) + No-Steal，意味着commit时**不强制**全量刷盘，之前不可以刷盘，之后可以随便刷
   2. Undo(Steal) + Force, 意味着commit时**强制**全量刷盘，之前可以随便刷
   3. Redo(No-Force) + Undo(Steal)，意味着刷盘操作完全不受commit影响，可以在任意时机刷盘
   4. Force + No-Steal，意味着只能在commit时全量刷盘

   

   ## ARIES

   ​	92年的老论文，被誉为数据库领域的成人礼，通篇69页，提供了一个经典的No-Force+Steal的WAL实现，No-Force+Steal的高性能，可以说每个商用数据库必备的。

   ​	ARIES算法的关键：

   1. **WAL Protocol**

      由于ARIES整体是No-Force+Steal的设计，所以刷盘时机由BM（BufferManger）管理。BM只需要遵守WAL协议就行。

      1. 协议内容一：对于某个Page，刷盘之前，必须保证对这个页面对应的所有undo log全部刷盘。
      2. 协议内容二：事务提交之前，必须保证redo log全部刷盘。

   2. **Compensation Log Record**

      ARIES的Log Record有三种，Redo/Undo/CLR，CLR是ARIES的关键之一。

      当rollback使用Undo Log的时候，每执行一条Undo恢复操作，就要记录一条CLR记录。这是因为undo只是逻辑日志，并不指定要修改哪个页面，而CLR是物理日志，相当于是undo翻译后的结果，也可以看做是undo过程的redo日志。

      这么做的原因是，宕机恢复的过程中，依然可能产生嵌套宕机的情况，而undo由于是逻辑日志，无法保证幂等性，所以需要CLR来保证幂等性。

      比如事务只有一个-1和+1操作，那undo记录的就是与之相反+1和-1，如果undo在执行到+1的时候再次宕机，那么再次执行的时候则可以根据CLR得知已经+1过了，避免再次+1的情况。

      

   ​	































































