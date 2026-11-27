---
title: 常用工具与下载
description: 玩 MC 会用到的下载站、Java、模组平台和联机工具，一个页面收齐。
permalink: /docs/tools/resources.html
order: 2
---

# 常用工具与下载

这一页不放教程，只放「该去哪里拿」。链接都是官方或主站地址，点开就是对应页面。

## 启动器本体

| 用途 | 地址 | 说明 |
|---|---|---|
| 下载最新版 | [GitHub Releases](https://github.com/maoxinhe/ChronLink/releases/latest) | 安装包、便携版、签名文件都在这里 |
| 官网 | [launcher.camzy.tech](https://launcher.camzy.tech/) | 功能介绍、截图、下载入口 |
| 源码与 Issue | [maoxinhe/ChronLink](https://github.com/maoxinhe/ChronLink) | 提 Bug、看提交记录 |

## Java 运行环境

Minecraft 本体跑在 Java 上，版本对不上就起不来。

| 来源 | 地址 | 适合 |
|---|---|---|
| Eclipse Temurin | [adoptium.net](https://adoptium.net/zh-CN/temurin/releases/) | 最通用，8 / 17 / 21 都有，选 `.msi` 一键装 |
| Microsoft OpenJDK | [learn.microsoft.com/openjdk](https://learn.microsoft.com/zh-cn/java/openjdk/download) | 微软维护的构建，装完自带环境变量 |
| Azul Zulu | [azul.com/downloads](https://www.azul.com/downloads/) | 不想装系统 Java 时可下免安装压缩包 |

具体装哪个版本，见 [Java 环境问题](../troubleshoot/java.md)。

## 模组与整合包

| 平台 | 地址 | 说明 |
|---|---|---|
| Modrinth | [modrinth.com](https://modrinth.com/) | 开源友好，启动器内直接能搜 |
| CurseForge | [curseforge.com/minecraft](https://www.curseforge.com/minecraft) | 老牌，整合包多 |
| Fabric | [fabricmc.net](https://fabricmc.net/) | 轻量模组加载器 |
| NeoForge | [neoforged.net](https://neoforged.net/) | 1.20.2 之后 Forge 的分支路线 |
| Forge | [files.minecraftforge.net](https://files.minecraftforge.net/) | 老版本整合包基本都靠它 |

## 光影与画面

- Iris 光影加载器：[irisshaders.dev](https://irisshaders.dev/)
- 光影包合集：[Modrinth Shaders](https://modrinth.com/shaders)

光影很吃显卡，集显或老显卡先别开，见 [启动崩溃排查](../troubleshoot/crash.md)。

## 联机与内网穿透

- SakuraFrp（免费内网穿透）：[natfrp.com](https://www.natfrp.com/)
- 端口与正版验证说明见：[多人游戏](../online/multiplayer.md)

## 查资料

- Minecraft Wiki（中文）：[zh.minecraft.wiki](https://zh.minecraft.wiki/)

::: tip 别从搜索引擎随便下
搜「Minecraft 启动器下载」排在前面的很多是带捆绑的第三方站。认准上面这几个地址，尤其是 GitHub Releases 和官网。
:::
