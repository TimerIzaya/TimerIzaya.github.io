## 单例模式解决了什么问题

一个全局使用的变量反复创建和销毁

## 单例模式的使用场景

- Web的配置文件

- 数据库连接池

- 多线程的线程池

- Spring的Bean

- Web的日志

## 实现方式 1.0：懒汉

```java
class Singleton {
    private static Singleton instance;

    private Singleton() {
    }

    public static Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

懒加载。线程不安全。  



## 实现方式 1.1：懒汉加锁

```java
class Singleton {
    private static Singleton instance;

    private Singleton() {
    }

    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

懒加载。线程安全。



## 实现方式 2.0：饿汉

```java
class Singleton {
    private static Singleton instance = new Singletion();

    private Singleton() {}

    public static synchronized Singleton getInstance() {
        return instance;
    }
}
```

非懒加载。线程安全。



## 实现方式 3.0：DCL（Double-Check Locking)

```java
class Singleton {
    private volatile static Singleton singleton;

    private Singleton() {
    }

    public static Singleton getSingleton() {
        if (singleton == null) {
            synchronized (Singleton.class) {
                if (singleton == null) {
                    singleton = new Singleton();
                }
            }
        }
        return singleton;
    }
}

```

懒加载。线程安全。高性能。

- 高效的原因在于只对第一次创建对象用了锁，后续获得对象无锁。

- 使用synchronized是因为多线程情况下，可能多个线程判断对象为null，同步创建对象的代码，一次保证只有一个线程进。

- 第二次判定对象是否为空是因为，当第一个进入的线程创建好对象之后，后续线程不需要重复创建。

- synchronized已经可以保证原子性和可见性，使用votatile是为了对付指令重排序。

  创建对象要三步：

  1. 分配空间
  2. 初始化对象
  3. 把空间地址给引用

  如果线程A在创建对象的时候，编译器为了优化进行了指令重排序，将创建对象的步骤变为：

  1. 分配空间
  2. 把空间地址给引用
  3. 初始化对象

  那么可能出现，线程A在第二步结束的时候，还未初始化对象，线程BCD已经在请求获得对象了，这个时候引用已经被赋值，所以会直接返回instance，但是此时对象依然为空。