---
title: 安装与更新
description: 保姆级安装教程，照着点就行。
order: 2
pageLayout: doc
permalink: /en/docs/start/installation.html
createTime: 2026/11/27 17:36:45
---

开始使用

# 安装与更新

保姆级安装教程，照着点就行。

Updated Oct 7, 2026

This page has no translation yet; the Chinese original is shown.

> 保姆级安装教程，照着点就行。

## 第一步：下载启动器

打开浏览器，访问 **GitHub Releases 页面**：

https://github.com/maoxinhe/ChronLink/releases/latest

这个页面会自动跳转到最新版本。往下滚，找到 **Assets**（资源）区域，里面有一堆文件，**认准下面这几个**：

| 你的系统 | 下载哪个文件 | 说明 |
| --- | --- | --- |
| **Windows**（10 或 11） | `ChronLink.Launcher_<版本>_x64-setup.exe` | 比如 `ChronLink.Launcher_1.7.4_x64-setup.exe`，是安装程序 |
| **Windows 便携版** | `ChronLink.Launcher_<版本>_x64_portable.zip` | 免安装，解压就能用，喜欢绿色软件选这个 |
| **macOS**（苹果电脑） | `ChronLink.Launcher_<版本>_universal.dmg` | 通用版本，Intel 和苹果芯片都能用 |
| **Linux** | `ChronLink.Launcher_<版本>_amd64.AppImage` / `.deb` / `.rpm` | 推荐 `.AppImage`，双击就能跑 |

> 版本号会持续更新，认准文件名格式就行，别管具体数字。

> 不知道怎么分辨 Windows / macOS / Linux？Windows 就是最常见的电脑（戴尔、联想、华硕那种）；macOS 是苹果的 MacBook / iMac；Linux 一般只有程序员在用，如果你不确定，那你大概率是 Windows。

## 第二步：安装

### Windows

1. 双击下载好的 `.exe` 文件
2. 如果弹出“Windows 已保护你的电脑”之类的蓝色提示，点 **更多信息 → 仍要运行**（这是正常的，开源软件第一次运行经常被系统提醒）
3. 一路点“下一步”直到安装完成
4. 桌面上会出现 ChronLink 图标，双击打开

### macOS

1. 双击下载好的 `.dmg` 文件
2. 会弹出一个窗口，把 ChronLink 的图标拖进“应用程序”文件夹
3. 从启动台打开 ChronLink（第一次打开如果提示“无法验证开发者”，去 系统设置 → 隐私与安全性 里点“仍要打开”）

### Linux

推荐 `.AppImage`：

```bash
chmod +x ChronLink*.AppImage
./ChronLink*.AppImage
```

或者用包管理器安装（省事）：

```bash
## Arch Linux (AUR)
yay -S chronlink

## Debian / Ubuntu (APT)
curl -fsSL https://ppa.launcher.camzy.tech/setup.sh | sudo bash
sudo apt install chronlink
```

## 第三步：确认安装成功

打开 ChronLink，如果看到主界面（有“浏览”“游戏库”这些字眼），说明安装成功啦！接下来去 [快速上手](../../../docs/start/sign-in.md))继续。

## 以后怎么更新？

**==完全不用管==。** ChronLink 会在后台自动检测新版本，下载好、校验签名后自动更新。你只需要偶尔看到提示点个“重启更新”就行。

更新==不会动你的任何数据==：实例、模组、存档、设置全都保留。

```json
```

```json
```
