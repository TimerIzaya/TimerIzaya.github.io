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

抛开内存映射这一点以外，MMAPV1也是全方位被WiredTiger吊打。

| 特点     | MMAPV1              | WiredTiger             |
| -------- | ------------------- | ---------------------- |
| 数据压缩 | 无                  | 有，且支持多种压缩方式 |
| 锁       | db锁、collection锁  | document锁             |
| 并发性能 | 多核CPU不能提高性能 | 多核系统表现更好       |

<br>

## WiredTiger优势

1. **无锁并行框架**：充分利用 CPU 并行计算的内存模型的无锁并行框架，使得 WT 引擎在多核 CPU 上的表现优于其他存储引擎。
2. **磁盘优化算法**：WT 实现了一套基于 BLOCK/Extent 的友好的磁盘访问算法，使得 WT 在数据压缩和磁盘 I/O 访问上优势明显。
3. **简化事务模型**：实现了基于 snapshot 技术的 ACID 事务，snapshot 技术大大简化了 WT 的事务模型，摒弃了传统的事务锁隔离又同时能保证事务的 ACID。
4. **高效缓存模型**：WT 根据现代内存容量特性实现了一种基于 Hazard Pointer 的 LRU cache 模型，充分利用了内存容量的同时又能拥有很高的事务读写并发。

<img src="https://github.com/wiredtiger/wiredtiger/wiki/attachments/iiBench_insert_aws.png" alt="Pretty Pictures" style="zoom: 80%;" />

<img src="https://github.com/wiredtiger/wiredtiger/wiki/attachments/iiBench_query_aws.png" alt="Pretty Pictures" style="zoom: 80%;" />

<br>

##  性能优化的几个维度

1. 去锁化：lock free || wait free
2. 去大量随机IO
3. 拉满缓存性能：内存、L1、L2、L3 cache
4. 数据压缩：去冗余、压缩算法


<br>

## WiredTiger引擎存储结构对比（LSM  vs B+Tree）

<img src="https://github.com/wiredtiger/wiredtiger/wiki/attachments/LSM_btree_Throughput.png" alt="漂亮的图片" style="zoom: 33%;" /> 

在24C 144G内存的前提下

**写吞吐量**：LSM是B+Tree的1.5到2倍

**读吞吐量**：B+Tree是LSM的1.5到3倍

1.如果需要极高的写入吞吐量，而对查询没有性能要求的话，LSM是最佳选择

2.大部分场景下，对读写都有要求，那么B+Tree是最好的选择

3.复杂需求场景可以考虑在一个数据库内同时建立这两种存储结构的collection

#### 

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

   

<br>

## WiredTiger事务前置知识-WAL

**行为**：先写日志，后刷盘。

**目的**：刷脏页是随机写，而写日志是顺序写，节省IO消耗，提升性能。

**分类**：根据Commit的标记时机和数据落盘时机顺序不同，WAL日志分为以下三类：

1. **Undo-Only Logging**

   		Log记录可以表现为<T,X,V>，事务T修改了X的旧值V。这种WAL通过undo保证了原子性，却不能保证持久性。所以必须先刷盘再commit，落盘顺序为：Log -> Data -> Commit。
		
   		这种做法有两个坏处：
		
   		1.Page并发问题，如果两个事务同时修改了一个Page，一个事务提交需要Flush，会导致另一个事务的数据也被迫落盘，破坏了WAL的原则。
		
   		2.同步持久化Data导致频繁的随机写，影响性能。违背WAL通过顺序写优化性能的初衷。

2. **Redo-Only Logging**

   		Log记录可以表现为<T,X,V>，事务T修改了X的新值V。这种WAL通过redo保证了持久性，却不能保证原子性。所以必须先commit再刷盘，落盘顺序为：Log -> Commit -> Data。
		
   		这种WAL依然不能解决Page并发的问题。如果两个事务同时修改了一个Page，只要有一个没提交，另一个就不能刷盘，这些数据全都放在内存中，限制很大。

3. **Redo-Undo Logging**

   		Undo记录旧值保证了原子性，但必须通过Commit前刷盘保证持久性。
   	
   		Redo记录新值保证了持久性，但必须通过Commit后刷盘保证原子性。
   	
   		现在将Undo和Redo结合，就可以消除刷盘时机的限制，所以也解决了Page并发的问题。
   	
   		因为只靠WAL就可以保证数据库故障恢复，刷盘操作就可以单独分开处理，更可以把地址连续的page攒着进行批量的顺序刷盘，进一步优化性能。


<br>

#### 总结：

Undo和Redo分别有一种缺陷，需要用严格的刷盘顺序来弥补。

业界把Commit时是否要强制刷盘统称为Force、No-Force，把Commit前能否提前刷盘称为No-Steal、Steal。

Force或者redo保证了持久性，No-Steal或者undo保证了原子性。

所以排列组合有四种保证数据库宕机恢复的方式：**

1. Redo(No-Force) + No-Steal，意味着commit时**不强制**全量刷盘，之前不可以刷盘，之后可以随便刷
2. Undo(Steal) + Force, 意味着commit时**强制**全量刷盘，之前可以随便刷
3. Redo(No-Force) + Undo(Steal)，意味着刷盘操作完全不受commit影响，可以在任意时机刷盘
4. Force + No-Steal，意味着只能在commit时全量刷盘

**Wiredtiger属于Redo + No-Steal类型，所以WT没有undo log。**

**Innodb属于Redo + Undo类型。**

<br>

## ARIES（题外话）

	92年的老论文，被誉为数据库领域的成人礼，通篇79页，提供了一个经典的No-Force+Steal的WAL实现，No-Force+Steal的高性能可以说每个商用数据库必备的，但是内容实在过于复杂，这里不做过多解释。算法非常完善，很多大型关系型数据库的实现都是基于这篇论文。而WiredTiger选择放弃Undo，以No-Steal为代价，绕开了这块复杂的设计。
	
	这里说两点ARIES算法的细节：

1. **WAL Protocol**

   由于ARIES整体是No-Force+Steal的设计，所以刷盘时机由BM（BufferManger）管理。BM只需要遵守WAL协议就行。

   1. 协议内容一：对于某个Page，刷盘之前，必须保证对这个页面对应的所有undo log全部刷盘。
   2. 协议内容二：事务提交之前，必须保证redo log全部刷盘。

2. **Compensation Log Record**

   ARIES的Log Record有三种，Redo/Undo/CLR，CLR是ARIES的关键之一。

   当rollback使用Undo Log的时候，每执行一条Undo恢复操作，就要记录一条CLR记录。这是因为undo只是逻辑日志，并不指定要修改哪个页面，而CLR是物理日志，相当于是undo翻译后的结果，也可以看做是undo过程的redo日志。

   这么做的原因是，宕机恢复的过程中，依然可能产生嵌套宕机的情况，而undo由于是逻辑日志，无法保证幂等性，所以需要CLR来保证幂等性。

   比如事务只有一个-1和+1操作，那undo记录的就是与之相反+1和-1，如果undo在执行到+1的时候再次宕机，那么再次执行的时候则可以根据CLR得知已经+1过了，避免再次+1的情况。

   但是Mysql处理嵌套宕机并没有用CLR，而是单独为UndoLog设置了一个Segment，把undoLog当做真实的数据存储。

<br>

## WiredTiger引擎事务实现

#### 事务实现的核心

1. snapshot
2. MVCC
3. redo log

#### 事务对象

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

有scan_count就说明有其他请求在创建SnapShot。

开启事务的时候，事务ID是默认的`WT_TNX_NONE(= 0)`。当第一次执行写操作的时候，全局事务管理器给它分配一个唯一id。

所以只要是transaction_id不为0的事务，都可以认为是有修改操作的事务。

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

#### 总结

1. WT在并发创建事务、并发执行事务，都做了去重量锁的优化，保证了事务的高效执行，至于并发提交，涉及到日志的部分，放在下文讲解。
2. WT使用SnapShot-Isolation，本质是因为处理并发写的时候，如果不抛异常，就要做行锁、间隙锁等等重量锁去处理，这种隔离方式也是一种并发优化。


<br>
## WiredTiger引擎日志实现

由事务的分析可以知道，WiredTiger在事务过程中的修改都是发生在MVCC List上的，属于内存操作。

由于它选择了No-Steal的模式，所以它的持久化只需要关注redo log能否在事务提交的时候刷盘即可。

#### 日志格式

WT定义了一个LSN，这个LSN和Innodb中不断增长的LSN不同，WT中的LSN定义是文件ID和文件中的offset。

```c
wt_lsn{
    file // 确认日志文件
    offset // 确认日志文件内偏移位置
}
```

WT中一个事务对应一个操作日志对象（log record），这里简称**logrec**。

WT事务中一个操作对应一个**logop**对象，所以一个logrec包含多个logop。

logop有多个类型：

1. logrec_checkpoint：建立checkpoint
2. logrec_commit：事务内的操作，其中还分为PUT类型（增加或者修改），REMOVE类型（删除）
3. logrec_file_sync：page刷盘日志
4. logrec_message：提供给引擎外部的日志

LogRocrd总结结构如图所示：

<img src="https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20220810222834765.png" alt="image-20220810222834765"  /> 

#### 事务提交时的并发写优化

事务提交的完整流程：

1. 事务执行第一个写操作时，会现在redo_log_buf的缓冲区上创建一个logrec对象，并且事务类型设置为LOGREC_COMMIT
2. 每个写操作生成一个logop对象，加入到logrec。
3. 事务提交时，把logrec写入到全局log对象里的slot buffer中等待写完成的信号。
4. **slot buffer会根据并发的情况合并同时提交的logrec，批量刷盘，然后通知对应所有的事务刷盘完成。**

可以看出核心在于slot buffer对并发提交的处理。

Wiredtiger在全局log对象中定义了一个active_slot和slot_pool数组结构，如下所示：

```c
wt_log{
    active_slot: // 可以用的slot buffer对象
    slot_pool: // slot buffer数组，包括正在合并的、准备合并和闲置的slot buffer。
}
```

slot buffer定义如下：

```c
wt_log_slot{
    state // 当前 slot 的状态，ready/done/written/free 这几个状态
    buf: // 缓存合并 logrec 的临时缓冲区
    group_size: // 需要提交的数据长度
    slot_start_offset: // 合并的logrec存入log file中的偏移位置
}
```

另外提一句，国内喜欢用桶（bucket）称呼，国外喜欢用slot（槽）称呼，本质都是一种将集中请求分散化的手段。

并发写入过程如图：

![image-20220811002908056](https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20220811002908056.png)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

这里还要提的一点是，对于大事务，也就是超过256KB的事务，直接写入磁盘，不需要走缓存。
事务并发提交的过程，我们可以抽象成：**多个不定长的小数组并发写入一个大数组**的过程。

一种直接的想法是加锁串行依次写入，但是WT采用的方案去用自旋的 join 操作，给每一个小数组分配写入位置，然后无锁并发写入。秀的一批嗷。

join操作核心逻辑如下所示：

```c
void __wt_log_slot_join(WT_SESSION_IMPL *session, uint64_t mysize, uint32_t flags, WT_MYSLOT *myslot)
{
    wait_cnt = 0; // 自旋次数
    for (;;) {
        WT_BARRIER();
        slot = log->active_slot; // 获得分配的slot
        old_state = slot->slot_state; // 获得slot状态
        if (WT_LOG_SLOT_OPEN(old_state)) { // slot可用就分配，不可用就自旋
            join_offset = WT_LOG_SLOT_JOINED(old_state);
            if (unbuffered) // 大事务，标记为unbuffered，表示不走缓存直接写入
                new_join = join_offset + WT_LOG_SLOT_UNBUFFERED;
            else // 小事务，在slot当前偏移量加上事务长度，获得写入位置
                new_join = join_offset + (int32_t)mysize;
            new_state = (int64_t)WT_LOG_SLOT_JOIN_REL( 
              (int64_t)new_join, (int64_t)released, (int64_t)flag_state);
			
            // cas标记new_state，比如上图T1走到这步new_state由ready变为done
            if (__wt_atomic_casiv64(&slot->slot_state, old_state, new_state))
                break;
        } else {
            ++wait_cnt;
        }
    }
    myslot->offset = join_offset; // 更新offset
}
```

#### 

<br>

## WiredTiger引擎内存页面

传统的关系型数据库的page都是磁盘和内存对齐的，比如innodb是16KB。访问这些页面的时候要严格遵守一定的规则：

- 修改一个page需要获得该页的x-latch
- 访问一个page需要获得该页的s-latch或者x-latch

WiredTiger为了获得更好的并发性能以及压缩数据，并没有将磁盘和内存里的page对齐，而是各有一套数据结构。

- 内存里的数据页：in-memory page
- 磁盘里的数据页：disk extent

WiredTiger是同时支持行存储和列存储的，但是Mongo只用到了行存储，所以这里只要关注行存储的B+Tree索引页和数据页就可以。

内存中一个page的存储结构如图所示：

![image-20220814204907528](https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20220814204907528.png)

#### row_array:

row_array的长度是根据page从磁盘里读出来的行数确认的，每个单元就是一个kv，准确的说是磁盘里的kv cell对象、它的偏移位置以及编码方式。

#### row_insert_array:

两个row_array的单元很可能是不连续的，比如图中存的4个都不是连续的。那么往k = 1和k = 10中插入一个kv对的话，必然不能往数组里插，所以他们的间隙用了跳表来处理。

跳表简单来说就是数组和链表的中和，数组查询快，链表增删快，如果都想要，那就可以尝试跳表、红黑树这些均衡的数据结构。之所以这里不用红黑树，是因为红黑树实现复杂，设计到旋转、变色等操作，不方便无锁化，一般需要加锁，而跳表虽然算法的常数项比红黑树大一些，但是底层结构是依赖的链表，**可以无锁化**。

#### row_update_array:

查询和更新操作自然对应的就是数组了，这里的数组上文介绍mvcc已经说过，每个单元都是一行数据的历史改动链。

<br>

## WiredTiger引擎磁盘页面



![image-20220814222257568](https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20220814222257568.png)

#### Disk  Extent 结构

- page header：记录当前数据页的状态信息
- block header： extent 存储的头信息，主要存有数据的 chucksum 和长度等。
- extent data：存储的数据，是一个 cell 数据集合（cell为kv对的序列化之后的数据块）

#### Extent address

Extent address全都存储在一个作为索引的特殊extent里面，它有如下构造：

- offset：extent在b+树文件中的偏移量
- size：extent的长度
- chunksum：判断合法性

#### Page从磁盘中读取的过程（in-memory）

1. 根据b+树索引上的extent address，从对应文件中读这个extent到内存缓冲区。
2. 检验checksum
3. 判断是否开启压缩，如果开启则解压
4. 构建内存中的page对象
5. 遍历整个extent里的cell，构建row_array、row_insert_array、row_update_array

#### Page从内存中写到磁盘的过程（reconcile）（reconcile和split需要排它锁）

1. 扫描所有row_array、row_insert_array、row_update_array，生成cell对象，依次放到rec buffer中，其中超大的cell会特殊处理。

2. 判断这个缓冲区是否超过了page_max_size，如果超过了要split。page_max_size可以自行设置。

3. 判断是否开启压缩，如果是则压缩rec_buffer为data_buffer

4. 根据b+树文件的状态生成一个extent对象，用压缩后的data_buffer填充这个对象

5. 写入b+树文件，返回extent address更新内存里b+树的索引

   <br>

## WiredTiger的常用配置

- **memory_page_max**

  内存里的page最大值，一个page不断被插入和修改会接近这个值，默认为5MB。

  当一个内存page达到这个值会触发split和reconcile，需要注意这两个操作是必须要排它锁的，会影响性能。

  如果这个值太小，会容易加锁，如果太大，不容易触发锁，但是一旦触发时间会比较长。所以需要根据实际情况合理判断。

- **leaf_page_max**

  磁盘里的叶子page最大值，默认为32KB, 如果超过这个大小会自动拆分。

  这个值太小会影响IO性能，JAVA里BufferReader默认一次是8KB，设置为4K理论上是最小的了。

  这个值太大也会造成读写放大，因为读出来的数据很多都可能用不上。

  一些常用的经验有：

  - 如果是随机读很多的场景，可以把叶子设置稍微小一点。
  - 如果是顺序读很多的场景，可以把叶子设置稍微大一点。

- #### leaf_value_max && leaf_key_max 

  这两个kv最大值和leaf_page_max没有关系，如果k或者v超过leaf_page_max，那么WT会忽视leaf_page_max，创建一个更大的页面。

  但如果超过了这个值，会被认为是overflow item，需要额外IO去处理，影响性能。

  叶子节点里的最大value上限，最大为4G，也是理论上Mongo的单个document上限。但是Mongo出于和存储引擎的适配以及网络IO等角度考虑，至今document上限仍然是16M。

  

<br>


## 总结

WiredTiger作为一款救了MongoDB命的存储引擎，很多地方还是值得研究的。

一直都知道mongo吃内存，但是一直不知道其中原因，其实本质还是为了并发付出的代价。

比如in-memory page的设计，再比如reconcile的过程，需要多次拷贝，所以为了发挥WT的性能，大一点物理内存是很必要的。

它的数据结构使用的也相当灵活，除了redis又一次见到了使用跳表的场景，加深了我对这些数据结构的理解。

同时它的并发设计也非常有意思，比如并发创建事务、并发执行事务、并发提交事务、无锁化访问页等等，一些很小的trick却能带来很强的优化。日后遇到并发写的场景时相信会有很大的帮助。

由于本人精力有限，其中Ticket限流算法、HazardPointer页面释放算法这里没有写进来，后续会补上。
