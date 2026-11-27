---
title: 安装与更新
description: 从下载到启动，三步装好。
order: 2
pageLayout: doc
permalink: /docs/start/installation.html
createTime: 2026/11/27 17:37:02
---

# 安装与更新

## 第一步：下载安装包

打开 GitHub Releases 页面：

[https://github.com/maoxinhe/ChronLink/releases/latest](https://github.com/maoxinhe/ChronLink/releases/latest)

页面会自动跳到最新版本。往下滚到 **Assets**（资源）区域，按你的电脑挑一个：

| 你的电脑 | 下载哪个文件 | 说明 |
|---|---|---|
| Windows 64 位（绝大多数电脑） | `ChronLink_<版本>_x64_modern-setup.exe` | 安装版，双击安装，自动检查更新 |
| Windows ARM（骁龙本等） | `ChronLink_<版本>_arm64_modern-setup.exe` | 同上，ARM 架构专用 |
| 喜欢绿色软件 | `ChronLink_<版本>_x64_portable.zip` | 免安装，解压直接运行 |

每个安装包旁边都有一份同名的 ==`.sig`== 文件，那是签名，别删也别改——启动器的自动更新会校验它。

::: tip 版本号看不懂没关系
文件名里的 `<版本>` 只是会变，格式不变：`ChronLink_1.11.2-beta.4_x64_modern-setup.exe` 这样认就行。
:::

> 目前 ChronLink 只发布 ==**Windows**== 版本（x64 / arm64）。macOS 与 Linux 的构建还在计划中，发布后同样出现在这个页面。

## 第二步：安装

1. 双击下载好的 `.exe`
2. 如果弹出“Windows 已保护你的电脑”，点 **更多信息 → 仍要运行**（未上架的独立软件第一次运行常被系统拦一下）
3. 一路“下一步”到完成
4. 桌面出现 ChronLink 图标，双击打开

便携版更简单：解压到任意目录，运行里面的 `ChronLink.exe` 即可。

## 第三步：确认装好了

打开后能看到左侧的「游戏库 / 浏览 / 联机」等入口，说明安装成功。接下来去 [快速上手](../start/first-launch.md) 创建第一个实例。

## 以后怎么更新？

启动器启动时会向云端上报当前版本，云端判断有没有新版本，有就提示你更新。下载完成后会校验包体签名再替换，不会装到一半坏掉。

更新不会动你的数据：实例、模组、存档、设置全都保留在原位置。

也可以在「设置 → 关于」里手动点检查更新。
