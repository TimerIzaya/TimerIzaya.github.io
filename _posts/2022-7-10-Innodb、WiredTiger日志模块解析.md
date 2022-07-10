---
layout:     post
title:      Innodb、WiredTiger日志模块解析.md
subtitle:   
date:       2022-7-10
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - 数据库
 

---

## Mysql undolog

#### 作用

1. 回滚，保证原子性
2. MVCC，保证隔离性。CC是并发控制，比如读事务不会因为写事务也在写同一行而等待。MV是实现CC的手段，多版本是指一行数据有多个版本，本质是以链表形式存储，这点Mongo也是同样的实现，但是具体方式有所不同。

#### 存储方式

undolog曾经是放在系统表空间里的，也就是ibdata文件，但是现在undolog已经有自己的表空间了。

表空间是mysql自己定义的一种说法，一个表空间就是一个实际存在的文件，比如mysql刚安装好的时候就会初始化一个12M的Ibdata1文件。一个tablespace有多个segment，一个segment有多个extent，一个extent有多个page，一个page16K，是mysql的最小物理单位。

undo log 在 MySQL 8.0 中默认的存在于两个 undo tablespace 中。一个tablespace划分为128个segment，这里的segment叫rollback segment，简称rseg。每一个rseg里有1024个undo log segment，分别从rseg slot0到reseg slot127,。也就说总共可以记录128 * 1024个undo操作。

一个rseg具体架构如图：

<img src="https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20220710223241779.png" alt="image-20220710223241779" style="zoom:67%;" /> 

当一个事务需要记录undo log时，会申请两个undo slot，也就是会占用两个rseg。因为undo log分为两种，insert undo log和update undo log，两者在事务提交后删除的时机不一样。

































