---
layout:     post
title:      彻底拿下常量池和intern()问题
subtitle:   所有一知半解抄来抄去毫无根据的博客和网课就是恶心人
date:       2021-12-15
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - Java
    - JVM

---

## 方法区到底是什么？

存储被虚拟机加载的类型信息，常量，代码缓存等数据。

JDK6以及之前，用永久代实现方法区，也就是方法区完全在堆外。

JDK7，把**字符串常量池**移到堆里作为一个单独区域。

JDK8，完全废弃永久代，改为元空间，把永久代除了常量池剩余的内容（**主要是类型信息**）存储在内，元空间属于本地内存。

> 以上信息选自《深入理解JVM》第三版。  

## 常量池到底是什么？

常量池主要有三种：Class文件常量池，运行时常量池，全局字符串常量池。

### 1.Class文件常量池

Class字节码文件，对应着是编译后、但还没运行的java程序，除了有类版本、字段、方法、接口等描述信息以外，还有一个非常重要的**常量池表（Constant Pool Table）**，用于存放编译期间生成的**字面量和符号引用**，常量池表会在类加载完存放到**运行时常量池**中。

解释一下**字面量**和**符号引用**，对一个简单的程序，对其二进制字节码文件用javap反汇编一下。

```java
public class Test {
    
    private int value = 1;

    private String s = "wtf";

    public String get(String x){
        return s;
    }
}
```

```shell
javap -v Test.class
```

**具体的常量池表如下图**

<img src="https://gitee.com/timerizaya/timer-pic/raw/master/img/image-20211215172859529.png" alt="image-20211215172859529" style="zoom:67%;" /> 

- **字面量**：说白了就是加了双引号的可见常量，比如String s = "fuck"里的“fuck”。还有一种特殊就是final修饰的成员变量。所以加了双引号的字符串，在类加载完后会直接被加入**运行时常量池**。这类字面量在反汇编的时候，可以以**UTF8**的格式直接表示出来，比如上图中的：

  ```shell
   #3 = String             #25 
   #25 = Utf8               wtf
  ```

- **符号引用：**

  - **类和接口的全名**，把使用时候的 “.” 换为 “/” ，比如上图中的：

    ```shell
     #5 = Class              #27  
     #27 = Utf8              Test
    ```

  - **字段（也就是成员变量）的名称和描述符**，Class的常量池表仅仅保存字段的名，不保存值。比如上图中的：

    ```shell
    #2 = Fieldref           #5.#24
    #24 = NameAndType        #7:#8 
    #7 = Utf8               value
    #8 = Utf8               I
    ```

  - **方法的名称和描述符**，也就是参数类型和返回类型，比如上图中的：

    ```shell
    #19 = Utf8               (Ljava/lang/String;)Ljava/lang/String;
    ```

### 2.运行时常量池

​	运行时常量池是每个类或接口在运行时，对二进制class常量池的一种表示。它包含各种常量，从编译时已知的字面的数值到运行时候解析的方法引用、成员变量引用。运行时常量池的作用类似于传统编程语言的**符号表**。

> ​	本段内容取自Oracle的JVM规范。  

### 3.全局字符串常量池

​	关于**字符串常量池**和运行时常量池的关系，GitHub有个非常经典的讨论，是某位大佬和周志明的对线：https://github.com/fenixsoft/jvm_book/issues/112

​	**简单来说，两者不是一部分**。运行时常量池是方法区的一部分，而JDK1.7之后字符串常量池被移动到堆区。二者从存放位置来说不是一个概念。

​	在生成**运行时常量池**的时候，调用了intern()方法，所以一开始的**Class常量池**中的字符串能在**字符串常量池**中使用。CPP代码见下图

<img src="https://gitee.com/timerizaya/timer-pic/raw/master/img/image-20211215182812947.png" alt="image-20211215182812947" style="zoom:67%;" />

​	到这里为止，三种常量池的大体脉络就理清楚了。

### 4.总结

- Class文件常量池仅仅是一个静态的文件，javac编译完，其内容也就确定了。
- 运行时常量池在方法区，具体的说，jdk1.8中，它在元空间，也就是用户空间，也就是本地内存。
- 字符串常量池在堆中，仅仅为字符串服务，和运行时常量池没有交集。



## 深入理解 String::intern

在Oracle的JVM规范中，对运行时常量池的解释中，有一个特殊的部分，就是字符串常量池。这段“**addition**”基本可以解决所有的无聊的字符串问题。建议这部分英文规范详细阅读。

> A string literal is a `reference` to an instance of class `String`, and is derived from a `CONSTANT_String_info` structure ([§4.4.3](https://docs.oracle.com/javase/specs/jvms/se7/html/jvms-4.html#jvms-4.4.3)) in the binary representation of a class or interface. The `CONSTANT_String_info` structure gives the sequence of Unicode code points constituting the string literal.
>
> The Java programming language requires that identical string literals (that is, literals that contain the same sequence of code points) must refer to the same instance of class `String` (JLS §3.10.5). In addition, if the method `String.intern` is called on any string, the result is a `reference` to the same class instance that would be returned if that string appeared as a literal. Thus, the following expression must have the value `true`:
>
> ```java
> ("a" + "b" + "c").intern() == "abc"
> ```
>
> To derive a string literal, the Java Virtual Machine examines the sequence of code points given by the `CONSTANT_String_info` structure.
>
> - If the method `String.intern` has previously been called on an instance of class `String` containing a sequence of Unicode code points identical to that given by the `CONSTANT_String_info` structure, then the result of string literal derivation is a `reference` to that same instance of class `String`.
> - **Otherwise, a new instance of class `String` is created** containing the sequence of Unicode code points given by the `CONSTANT_String_info` structure; a `reference` to that class instance is the result of string literal derivation. Finally, the `intern` method of the new `String` instance is invoked.

​	**总结：一个字面字符串必须是一个String实例的引用，它可以从Class常量池的CONSTANT_String_info中。所谓的字面字符串（Literal String），实质上就是在编写代码的时候加上双引号的字符串。JAVA程序要求相同的字面字符串必须是同一个实例的引用。**

**举个例子：**

```java
 String s = new String("123");
 System.out.println(s == s.intern()); //false
```

这意味着，当执行这行代码之前，**Class常量池**中就有了“123”这个字面字符串。

**运行时常量池**在parse **class常量池**的时候，会先判断“123”之前是否已经在**字符串常量池**中，如果有就直接返回引用。如果没有，则会在堆中创建一个String对象，然后把这个对象的引用放到**字符串常量池**中。

但是，这里和s还没关系，仅仅是双引号内的字符串的一个编译-运行流程。

然后，JVM会为变量s又创建一个对象，内容和"123"完全一致。

所以，两者不是一个对象，结果为false。

**再举个例子：**

```java
String s = "123";
System.out.println(s == s.intern()); //true
```

同理，这个时候常量池的引用就是堆里的“123”的引用，所以结果是true。

**再举个例子：**

```java
    public static void main(String[] args) {
        char[] arr = {'1', '2', '3'};
        String s = new String(arr);
        System.out.println(s == s.intern()); //true
    }
```

这段代码中没有出现任何字面字符串，所以s仅仅就是堆中的一个字符串。这个时候字符串常量池中没有”123“，所以调用intern()返回的就是本身，所以为true。

**再举个例子：**

```java
    public static void main(String[] args) {
        String s = new String("123") + new String("456");
        System.out.println(s.intern() == s); //true
        System.out.println(s == "123456");  //true
    }
```

字符串加法底层是StringBuilder，加完后会使用new String(value)生成结果，value为char数组，这个时候问题就转换成了上一个例子。所以 s.intern() == s 为 true。

在第三行，"123456"作为字面字符串，要保证对应一个实例，所以要先去字符串常量池中寻找，这个时候串池中已经有了，所以结果为true。

这个例子，如果把两个输出颠倒过来，结果相反，分析同上。
