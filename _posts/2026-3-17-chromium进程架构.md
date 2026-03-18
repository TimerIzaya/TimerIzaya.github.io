---
layout:     post
title:      chromium进程架构
subtitle:   
date:       2026-03-17
author:     TimerIzaya
header-img: img/the-first.png
catalog: false
tags:
    - fuzzing

---

# webkit

> **WebKit 是一个浏览器引擎，用来把网页代码（HTML / CSS / JS）解析、执行并渲染成用户看到的页面。**

1. convert html into dom,  and css into cssdom
2. invoke the JS engine
3. render the page, calculate position, draw styal, print on the screen
4. provide the web api



# blink

> **Blink 是从 WebKit fork 出来的浏览器引擎分支，并在之后经历了大规模重构与独立演化。**

**But now !  In 2026, blink is completely indepentent of Webkit and belongs to an indepentent engine**

























