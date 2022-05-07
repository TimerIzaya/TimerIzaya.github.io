---
layout:     post
title:      Reactor与IO多路复用
subtitle:   
date:       2022-1-20
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - OS
    - Java

---





## 前言

研一刚开学，我舍友问了我一句，为啥服务器都要放在Linux上啊？

我人懵了，随便扯了一点Linux开源、Linux可以定制、Linux安全之类的屁话。

现在再有人问我这个问题，我一定首先说，**因为linux支持epoll**。  



## 四种IO

首先搞清楚同步/非同步和阻塞/非阻塞。

### 同步

用户线程主动发请求，内核空间是被动接受。

### 异步

内核空间主动发请求，用户线程是被动接受。

### 阻塞

内核IO操作彻底完成，才能返回用户空间执行操作。

### 非阻塞

内核IO操作不用完成，就能返回用户空间执行操作。

### 四种IO方式：

1. #### 同步阻塞IO

   Java程序默认都是同步阻塞IO，也叫BIO（Blocking IO）。

   比如read方法，一共有三个步骤：

   1. 等待内核缓冲区数据
   2. 复制到用户缓冲区
   3. 复制完成，返回调用

   这三个过程全程都是阻塞的，必须返回调用，用户线程才可以执行其他操作。

   **阻塞IO的优点是**：开发简单，阻塞期间，用户线程挂起，不会占用CPU资源。

   **阻塞IO的缺点是**：每个连接需要占用一个线程，高并发场景内存、线程切换开销会非常大。

   **总得来说**，同步阻塞IO在高并发是不可用的。 

   

2. #### 同步非阻塞

   socket连接默认是阻塞模式，但是可以设置为非阻塞模式，也就是NIO（Non-Blocking IO）。这种IO有两种状态：

   1. 内核缓冲区没有数据，返回调用失败的信息。
   2. 内核缓冲区有数据了，继续阻塞IO。

   **同步非阻塞IO的优点是**：在内核等待数据的过程中，用户线程不会阻塞，实时性好。

   **同步非阻塞IO的缺点是**：不断轮询，占用CPU，效率低下。

   **总得来说**，同步非阻塞IO在高并发也是不可用的。   

   

3. #### IO多路复用

   IO多路复用就是为了解决轮询等待问题，**让已经就绪的IO主动告诉用户线程，它已经准备好了**。

   检查就绪状态的系统调用为：**poll**、**select**、**epoll**，一个进程对应一个文件描述符fd，一旦某个fd就绪，也就是内核缓冲区可读或可写，内核就主动把就绪的状态返回给用户线程，告诉用户线程哪个fd可以用了。

   在Java里，对应的就是selector的select操作，如果OS是Linux，那么底层就会调用epoll，如果底层是Windows，那么就会调用poll。  

   **IO多路复用的优点**：和传统的一个socket要占用一个线程的方式比，IO多路复用只需要一个线程轮询epoll就可以处理成千上万的高并发。

   **IO多路复用的缺点**：本质上epoll还是阻塞式的，因为IO就绪后，epoll获得可用的线程，其中读写还是阻塞的。

   要想完全不阻塞，就要用异步IO。  

   

4. #### 异步IO

   异步IO和同步非阻塞的不同点在于，用户发出请求后，一切操作都是异步的，当OS完成或没完成用户的请求，发回信息即可。

   异步IO的缺点在于：程序需要对事件进行注册和接受，需要内核提供支持。

   理论上来说，异步IO的吞吐量应该高于IO多路复用。

   实际上看，Windows系统下通过IOCP实现了真正的异步IO。而在Linux系统下，异步IO模型在2.6版本才引入，目前并不完善，其底层实现仍使用epoll，与IO多路复用相同，因此在性能上没有明显的优势。

   Windows系统下通过IOCP实现了真正的异步IO。而在Linux系统下，异步IO模型在2.6版本才引入，目前并不完善，其底层实现仍使用epoll，与IO多路复用相同，因此在性能上没有明显的优势。  

   

## Reactor设计模式

说到底epoll是一个系统调用，在代码正儿八经写的时候，具体的实现最优雅的就是Reactor。

这里以最简单的EchoServer为例。

- 服务器端的ServerSocketChannel首先要注册到selector，用于接受新连接请求。同时其SeletionKey要过滤的信号为accept的IO活动。
- 每当一个新连接接受后，就把用户端的SocketChannel也注册到selector，同时其SeletionKey要过滤的信号为read或者write的IO活动。
- 每个SelectionKey都由对应的Handler处理，新连接的Key交给AcceptHandler，传输连接的Key交给对应的IOHandler。

#### 单线程版本的Reactor模型（Scalable IO In Java）

![](https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20220121003013016.png) 



#### 单线程版本的Reactor模型（Java NIO 自行实现）

<img src="https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20220122023126899.png" alt="image-20220122023126899" style="zoom:80%;" /> 

#### java.nio对应支持的类库

- **Channel**：本质就是socket的fd
- **Buffer**：通道的读写缓存
- **Selector**：底层为poll/epoll，告诉你哪个channel有IO活动
- **SelectionKey**：维护IO活动的状态





#### ReactorServer实现

```java
public class ReactorServer implements Runnable {

    private Selector selector;

    private ServerSocketChannel socketChannel;

    ReactorServer() throws IOException {
        selector = Selector.open();
        socketChannel = ServerSocketChannel.open();
        InetSocketAddress address = new InetSocketAddress("127.0.0.1", 1024);
        socketChannel.socket().bind(address);
        socketChannel.configureBlocking(false);
        //把serverSocket注册到selector，获得它的selectionKey，此sk用于维护当前serverSocket的IO状态
        SelectionKey sk = socketChannel.register(selector, SelectionKey.OP_ACCEPT);
        //对新请求sk，绑定一个接收处理器
        sk.attach(new AcceptorHandler());
    }

    @Override
    public void run() {
        try {
            while (!Thread.interrupted()) {
                System.out.println("select...");
                selector.select();
                Set<SelectionKey> selected = selector.selectedKeys();
                Iterator<SelectionKey> it = selected.iterator();
                while (it.hasNext()) {
                    //Reactor负责dispatch收到的事件
                    SelectionKey sk = it.next();
                    dispatch(sk);
                }
                selected.clear();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // 获得当前sk对应的handler
    // 如果当前sk是accept，那么就执行AcceptorHandler对象的run方法
    // 如果当前sk是read/write，那么就执行EchoHandler对象的run方法
    public void dispatch(SelectionKey sk) {
        Runnable handler = (Runnable) sk.attachment();
        if (handler != null) {
            handler.run();
        }
    }


    //用于处理sk是accept的新连接
    class AcceptorHandler implements Runnable {
        @Override
        public void run() {
            try {
                SocketChannel channel = socketChannel.accept();
                if (channel != null) {
                    new EchoHandler(selector, channel);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) throws IOException {
        new Thread(new ReactorServer()).start();
    }
}
```



#### EchoHandler实现

```java
class EchoHandler implements Runnable {
    final SocketChannel channel;
    final SelectionKey sk;
    final ByteBuffer byteBuffer = ByteBuffer.allocate(1024);
    static final int RECIEVING = 0, SENDING = 1;
    int state = RECIEVING;

    EchoHandler(Selector selector, SocketChannel c) throws IOException {
        channel = c;
        c.configureBlocking(false);
        sk = channel.register(selector, 0);

        sk.attach(this);

        sk.interestOps(SelectionKey.OP_READ);
        selector.wakeup();
    }

    public void run() {
        try {
            if (state == SENDING) {
                channel.write(byteBuffer);
                byteBuffer.clear();
                sk.interestOps(SelectionKey.OP_READ);
                state = RECIEVING;
            } else if (state == RECIEVING) {
                int length = 0;
                while ((length = channel.read(byteBuffer)) > 0) {
                    System.out.println(new String(byteBuffer.array(), 0, length));
                }
                byteBuffer.flip();
                sk.interestOps(SelectionKey.OP_WRITE);
                state = SENDING;
            }
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }
}
```



































































