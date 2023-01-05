---
layout:     post
title:      MapReduce: Simplified Data Processing on Large Clusters
subtitle:   个人翻译
date:       2023-1-5
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - 架构 

---

# Abstract

```
MapReduce is a programming model and an associated implementation for processing and generating large data sets. Users specify a map function that processes a key/value pair to generate a set of intermediate key/value pairs, and a reduce function that merges all intermediate values associated with the same intermediate key. Many real world tasks are expressible in this model, as shown in the paper.
```

MapReduce是一个用于处理和生成大数据集合的编程模型的相关实现。

用户指定一个处理kv对的map方法去生成一组临时kv对，然后用reduce方法合并所有相同key的临时kv对。

```
Programs written in this functional style are automatically parallelized and executed on a large cluster of commodity machines. The run-time system takes care of the details of partitioning the input data, scheduling the program’s execution across a set of machines, handling machine failures, and managing the required inter-machine communication. This allows programmers without any experience with parallel and distributed systems to easily utilize the resources of a large distributed system.
```

这种程序自动在大型集群上执行并行操作。

这种实时系统注重输入拆分的细节，在集群中怎么调度程序，处理宕机事故，同时还要管理节点之间的联系。

这让没有分布式经验的程序员也能轻松使用大型集群的资源。

```
Our implementation of MapReduce runs on a large cluster of commodity machines and is highly scalable:
a typical MapReduce computation processes many terabytes of data on thousands of machines. 
Programmers find the system easy to use: hundreds of MapReduce programs have been implemented and upwards of one thousand MapReduce jobs are executed on Google’s clusters every day.
```

我们对MapReduce的实现运行在一个大规模集群上，并且是高可用的：

一个典型的在千万级集群上处理TB级数据的MapReduce。

程序员会感觉这个系统很好用：

谷歌的集群每天要执行上百的MapReduce程序，一千多的Job。

# **Introduction**

```
Over the past fifive years, the authors and many others at Google have implemented hundreds of special-purpose computations that process large amounts of raw data, such as crawled documents, web request logs, etc., to compute various kinds of derived data, such as inverted indices, various representations of the graph structure of web documents, summaries of the number of pages crawled per host, the set of most frequent queries in a given day, etc. Most such computations are conceptually straightforward. However, the input data is usually large and the computations have to be distributed across hundreds or thousands of machines in order to finish in a reasonable amount of time. The issues of how to parallelize the computation, distribute the data, and handle failures conspire to obscure the original simple computation with large amounts of complex code to deal with these issues. The issues of how to parallelize the computation, distribute the data, and handle failures conspire to obscure the original simple computation with large amounts of complex code to deal with these issues. 
```

过去这些年，作者和其他谷歌的大佬已经实现了数百个计算程序，用于处理大量原始数据，比如爬虫文档、web请求日志等等。

为了计算各种衍生数据，比如逆转索引、web文档的图结构的不同表示、每个主机爬取的页面摘要、一天中最频繁的查询等等。大部分这样的计算直觉上都是很简单的，但是输入数据往往过大，并且这些计算必须分布在成百上千的机器上，不然没法在合理的时间内完成。

并行计算、分布数据、处理故障，这些问题让本来简单的计算需要写出大量复杂的代码来解决。

```
As a reaction to this complexity, we designed a new abstraction that allows us to express the simple computations we were trying to perform but hides the messy details of parallelization, fault-tolerance, data distribution and load balancing in a library.

Our abstraction is inspired by the map and reduce primitives present in Lisp and many other functional languages. We realized that
most of our computations involved applying a map operation to each logical “record” in our input in order to compute a set of intermediate key/value pairs, and then applying a reduce operation to all the values that shared the same key, in order to combine the derived data appropriately. 

Our use of a functional model with user specified map and reduce operations allows us to parallelize large computations easily and to use re-execution as the primary mechanism for fault tolerance.
```

为了解决这个难题，我们设计了一种简单使用的方法，能够隐藏并行、容灾、分布式、负载均衡这些细节。

受lisp等函数式编程语言中的map和reduce原语启发。我们意识到，为了计算出一组中间kv对，大部分我们的计算都涉及把map操作应用到每个输入的record，然后把所有的相同key的value都用reduce操作处理，从而把这些衍生数据合并起来。

用户指定的map和reduce操作让我们更容易并行大量计算，并且把重执行作为容错的首要机制。

PS：这里提一下map和reduce的实际作用。

- **map**

  map是一组操作，用于按某种规则合并多个链表的，比如mapcar

  ```
  (write (mapcar '1+  '(23 34 45 56 67 78 89)))
  输出：(24 35 46 57 68 79 90)
  ```

- **reduce**

  reduce用一个指定的函数处理第一和第二个元素，然后用结果处理第三个元素，依次遍历链表。

  ```
  (reduce #'+ '(1 2 3 4) :initial-value 10) ; => 20
  ```

  所以总结一下，map处理输入，reduce合并输出。

```
The major contributions of this work are a simple and powerful interface that enables automatic parallelization and distribution of large-scale computations, combined with an implementation of this interface that achieves high performance on large clusters of commodity PCs.
```

这份工作的主要贡献是一个简单又强力的接口，保证了自动并行化和分布式数据计算，有了该接口，可以在大型分布式集群上获得优秀的性能。

```
Section 2 describes the basic programming model and gives several examples. Section 3 describes an implementation of the MapReduce interface tailored towards our cluster-based computing environment. Section 4 describes several refinements of the programming model
that we have found useful. Section 5 has performance measurements of our implementation for a variety of tasks. Section 6 explores the use of MapReduce within Google including our experiences in using it as the basis for a rewrite of our production indexing system. Section 7 discusses related and future work. 
```

第二节描述的基本的编程模型并且给了几个例子。

第三节针对我们的集群环境，介绍了MapReduce接口的实现。

第四节介绍了该模型的几种有用的优化。

第五节是我们的实现在不同任务上的性能测试。

第六节是MapReduce在谷歌的一些探索性使用，包含了我们重构索引系统的一些经验。

第七节讨论相关工作和未来工作。



