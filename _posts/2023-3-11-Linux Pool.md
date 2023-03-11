---
layout:     post
title:      Linux Pool
subtitle:   所有Linux相关的知识
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

   - -n: 间隔，单位为妙
   - -d:  高亮每次命令输出的不同字符串

   ![image-20230311222833121](https://raw.githubusercontent.com/TimerIzaya/TimerBlogPic/master/image-20230311222833121.png)

2. ## asd
