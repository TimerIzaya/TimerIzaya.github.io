---
layout:     post
title:      JAVA语言特性
subtitle:   表达方式
date:       2022-2-12
author:     TimerIzaya
header-img: img/the-first.png
catalog: false
tags:




---

[TOC]



## 谈谈Java反射机制，动态代理是基于什么原理？

反射可以直接获得类定义，java对象头除了markword还有一个instanceKlass指针，指向元数据，也就是Class类

这个东西把类的一些通用的地方抽象了出来，比如有什么方法、有什么属性、有什么修饰符。

反射也是实现动态代理的一种方式，比如java的Proxy就是用反射实现的。

其他比如cglib就是用操作字节码来实现的。

Proxy是运行时增强，cglib是编译时增强。

动态代理可以看做装饰器模式的一种实现，可以让实现代码的人和调用代码的人解耦。

比如我要在某个人的代码中增加输出日志的代码，没必要直接让他改代码，我可以用过动态代理，在它的代码方法invoke之前或者之后加入我想要输出的语句。

简单实现，加深记忆：

```java
interface Hello {
    void say();
}

class HelloImpl implements Hello {
    @Override
    public void say() {
        System.out.println("Timer!!!!!");
    }
}

class Handler implements InvocationHandler {

    private Object target;

    public Handler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("Who i am ？？？");
        Object res = method.invoke(target, args);
        System.out.println("Yes, you're right！！！");
        return res;
    }
}

public class test {
    public static void main(String[] args) {
        Handler handler = new Handler(new HelloImpl());
        Hello proxy = (Hello) Proxy.newProxyInstance(HelloImpl.class.getClassLoader(), HelloImpl.class.getInterfaces(), handler);
        proxy.say();
    }
}
```



## 为什么Proxy必须要用接口？

由于Proxy是运行时增强的，所以没法直接看代理对象的字节码文件，可以通过一些其他手段看它的字节码文件。

可以看到代理对象是继承了Proxy类和实现了原对象的接口，java不支持多继承，所以只能用接口折中。



## 介绍一下Java中的序列化与反序列化



## 内存溢出问题该如何解决

1. 简单粗暴，-Xms -Xmx 加内存

2. 根据日志找可能溢出的位置

3. 可能是数据库一次查询内容过多，比如一开始表里只有几百行，对外提供select all接口，但是后期表中数据越来越多，甚至超过内存，就需要重新设计接口。

4. 大循环里不断new对象也可能内存溢出。

5. 除了这些内存不够的情况，还要检查是不是之前用的大对象没被回收。

   

## Java中有哪些集合类

## 使用过可变长参数吗？

任意类型后加上三个点，相当于把一个这类型的数组传进来。



## JAVA里的x++和++x有什么区别

实现计算需要局部变量表+操作数栈，区别在于先入栈还是局部变量先自增。

x++的话，先入栈，然后局部变量表再自增。

++x的话，先自增，然后再加到栈里。



## 为什么重写 `equals()` 时必须重写 `hashCode()` 方法

hashCode()是用于确认在哈希表中的索引位置，比如HashSet HashMap等等。

当发生哈希碰撞，要判断是不是一个对象的时候就要用equals。

所以如果要重写equals方法的话，那两个对象相等，他们的哈希码也必须都相等，这是equals的必要条件。



## 自动拆箱和装箱？

JAVA里所有类型基本可以分为8大基本类型和reference，拆箱装箱就是基本类型和reference的转换。

比如int自动转成Integer，从字节码角度看其实就是调用的Integer.valueOf()

比如Integer自动转成int，从字节码角度看其实就是调用的Integer.intValue()



















