---
layout:     post
title:      弄清楚修饰符和嵌套类
subtitle:   嵌套类一次搞个明白
date:       2021-12-25
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - Java

---

## 前言

​	嵌套类虽然自己不常用，但是各种源码中还是大量出现，结合oracle的java tutorials一次弄个明白。



## 嵌套类

嵌套类分为两种，静态和非静态，非静态一般叫内部类（InnerClass），静态的一般叫静态嵌套类（*static nested classes*）。

```java
class OuterClass {
    ...
    class InnerClass {
        ...
    }
    static class StaticNestedClass {
        ...
    }
}
```

  



## 嵌套类的作用

- 如果类B仅仅为类A所用，那么可以把类B放在类A中。
- 增加封装性。比如类B需要访问A的变量，A要么把变量设为public，要么把B作为内部类。

## Inner Classes

内部类可以直接访问上层类的方法和变量，另外，它不能设置static，这样没有任何意义。

内部类的实例仅仅能在上层类的实例存在时存在。

如果非要初始化一个内部类的实例，可以这样写：

```java
OuterClass out = new OuterClass();
OuterClass.InnerClass in = out.new InnerClass();
```

## Static Nested Classes

静态嵌套类本质上就是一个正常的顶级类（top level class），为了方便打包，它嵌套在另一个类中。

就像静态方法一样，它不能直接访问上层类中的变量和方法。

## 实际场景1

```java
public class ThreadLocal<T> {
	...
	static class ThreadLocalMap {
        static class Entry extends WeakReference<ThreadLocal<?>> {
           ...
        }
}
    
class Thread{
    ...
    ThreadLocal.ThreadLocalMap threadLocals = null;
}
```

ThreadLocalMap并不是仅仅被ThreadLocal所用的，Thread中同样也用到了ThreadLocalMap。

所以这种静态嵌套类仅仅是因为打包方便。  

## 实际场景2

```java
public class LinkedList<E> {
    ...
	private static class Node<E> {
       ...
    }
}
```

Node是**私有静态嵌套类**，意味着外部无法访问Node这个类，Node这个类因为是静态的所以访问不到LinkedList的内部变量和方法。

总结一下，Node同时用private和static的原因：

- Node类仅作用于LinkedList
- Node不需要访问LinkedList的成员



