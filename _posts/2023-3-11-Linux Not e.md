---
layout:     post
title:      Linux Note
subtitle:   
date:       2023-3-11
author:     Timer
header-img: img/the-first.png
catalog: false
tags:
    - Linux

---

# 常用指令

1. ## watch

   可以开一个小窗口随时观察某个命令的进度，例如观察内存变化情况，执行如下所示。

   ```shell
   watch -n 2 -d free -h
   ```

   - -n: 间隔，单位为秒
   - -d:  高亮每次命令输出的不同字符串

   ![image-20230311222833121](https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20230311222833121.png)

# 软件管理-APT

- apt软件源地址文件路径：`/etc/apt/sources.list`
- apt下载文件存放的地址：`/var/cache/apt/archives/`

- apt卸载：
  - 删除，保留配置：`apt remove 包名`
  - 删除，同步删除配置：`apt --purge remove 包名`
  - 删除，同步删除所有依赖软件：`apt autoremove`
- 清除下载文件的缓存（`/var/cache/apt/archives/`中的所有文件）：`apt clean`
- 展示安装包的简介：`apt show 包名`
- 展示安装包的依赖与反向依赖（谁依赖了当前包）：`apt showpkg 包名`
- 单独展示安装包的所有依赖：`apt depends 包名`
- 单独展示安装包的所有反向依赖：`apt rdepends 包名`
- 根据正则在软件源中搜索安装的包：`apt search 字符串`

# 浏览文件

- ### ls - l：长格式显示当前目录中的内容

  <img src="https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20230315010016351.png" alt="image-20230315010016351" style="zoom:67%;" /> 

  - **第一列**：一共10个字符，第一个字符为文件类型，l为链接，d为目录，-为文件。后九个字符为权限信息，也叫模式，即命令chmod中的mod。一共有用户权限、组权限、其他用户权限三个组，每组有rwx三个位，分别表示read、write、execute，二进制表示分为为0001、0010、0100，十进制表示为1、2、4。所以我们常用的`chmod 777` 可以翻译为给用户、对应组、其他用户完整的读写与执行权限。
  - **第二列**：链接数量，后续解释。
  - **第三列**：所属用户。
  - **第四列**：所属组。
  - **第五列**：文件大小。
  - **第六列**：文件最近修改日期。
  - **第七列**：文件名。

- ### ls -l []：通配符用法

  通配符只有三个，很简单。

  - `?`：匹配任意单个字符
  - `*`：匹配任何长度任意字符
  - `[]`：匹配一个单字符范围，例如[a-z]，[0-9]，也有特殊方法，如下。
    - `[:alnum:]`：代表所有字母和数字
    - `[:alpha]`：代表所有字母
    - `[:digit:]：`代表所有数字
    - `[^]：`排除匹配的内容

  实际应用：

  - `ls -l /usr/bin/gcc*`：详细查看环境变量目录中以gcc开头的文件。
  - `ls -l file?.log`：匹配file1.log, file2.log, ...
  - `ls -l [a-z]*.log`：匹配a-z开头的.log文件
  - `ls -l[^a-z*.log]` ：和上面相反

# 正则表达式

- ### 正则元字符

  - #### 特殊单字符

    1. `.`任意单字符
    2. `\d` 任意数字，`\D` 任意非数字
    3. `\w` 任意字母数字下划线，`\W `任意非字母数字下划线
    4. `\s` 空白符， `\S `非空白符
    5. `\b` 单词边界

  - #### 空白符

    1. `\r`回车符
    2. `\n`换行符
    3. `\f`换页符
    4. `\t`制表符
    5. `\v`垂直制表符

  - #### 范围

    1. `|`代表或
    2. `[...]`括号内元素多选一
    3. `[a-z]`匹配a到z之间任意单个元素
    4. `[^...]`取反，不能是括号内任意元素

  - #### 量词

    1. `*`零到多次
    2. `+`一到多次
    3. `?`零到一次
    4. `{m}`出现m次，`{m,}`至少出现m次，`{m,n}`出现m到n次

- ### 非贪婪模式举例

  正则中，默认匹配是贪婪的，`?`表示匹配尽可能少的字符。
  
  ![image-20230320232805316](https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20230320232805316.png) 
  
  
  
  



















