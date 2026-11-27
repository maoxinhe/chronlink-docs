---
title: Java 环境问题
description: 版本对不上、找不到 Java、内存不够——Java 相关的坑都在这里。
permalink: /docs/troubleshoot/java.html
order: 2
---

# Java 环境问题

Minecraft 本体跑在 Java 上。启动器能自动帮你下载运行环境，但手工装错版本、环境变量乱配，照样起不来。

## 每个 MC 版本要哪个 Java

这是硬对应关系，装错了直接崩：

| Minecraft 版本 | 需要的 Java |
|---|---|
| 1.16.5 及更早 | Java 8 |
| 1.17.x | Java 16（建议直接用 17） |
| 1.18 ~ 1.20.4 | Java 17 |
| 1.20.5 及以后、1.21+ | Java 21 |

整合包要按它内部的 MC 版本来，不是看你电脑装的最新 Java。

## 只装一个 Java 21 行不行

不行。Java 21 不能向下兼容跑 1.12.2 这种老版本，会报 `Unsupported class file major version` 或直接 `ClassNotFoundException`。

正解是**装多个版本共存**：8、17、21 各装一份，启动器里给每个实例单独指定用哪个。Temurin 的 `.msi` 安装包会各自装到 `C:\Program Files\Eclipse Adoptium\jdk-17...` 这种独立目录，互不冲突。

## 提示「找不到 Java」/ 启动就退出

1. 先确认真的装了：命令行敲 `java -version`，有版本号说明在 PATH 里；报「不是内部或外部命令」说明没配好。
2. 到启动器设置里手动指定 java 可执行文件路径，一般长这样：
   `C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot\bin\javaw.exe`
3. 选 `javaw.exe`（无黑框），不要选 `java.exe`，否则每次启动都会挂一个命令行窗口。

## 32 位系统 / 32 位 Java

32 位 Java 内存上限约 1.5G，开不了现代版本 MC，也会报 `Could not reserve enough space for object heap`。

解决办法只有装 64 位 Java，并确认系统本身是 64 位。

## 改了内存反而启动失败

内存参数不是越大越好：

- 原版小整合：2G–4G 足够；
- 大整合包（几百个模组）：4G–8G；
- 别把机器全部内存都给游戏，系统和启动器自己也要用。

设置里的「最大内存」超过物理内存，Windows 会直接拒绝分配，表现就是启动一瞬间闪退。

## 环境变量 JAVA_HOME 要不要配

启动器自己指定路径的话，**不需要**配。手工配了反而容易出问题：

- `JAVA_HOME` 指向一个已被卸载的 JDK 目录；
- `Path` 里同时有多个 java，命令行和启动器跑的其实不是同一个。

如果之前折腾过，建议把 `JAVA_HOME` 删掉，`Path` 里只留一个确定的 `bin` 路径，然后重启终端。

## 报 `UnsupportedClassVersionError` 怎么读

报错里会写两个数字，比如 `class file version 61.0`：

| 数字 | 对应 Java |
|---|---|
| 52 | Java 8 |
| 60 | Java 16 |
| 61 | Java 17 |
| 65 | Java 21 |

「你用的是 X，需要 Y」——按表换 Java 就行，不用重装游戏。
