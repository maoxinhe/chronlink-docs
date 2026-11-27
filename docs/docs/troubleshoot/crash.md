---
title: 启动崩溃排查
description: 闪退、黑屏、卡加载、OutOfMemory——先找日志，再按现象对症。
permalink: /docs/troubleshoot/crash.html
order: 3
---

# 启动崩溃排查

MC 崩了别急着重装。日志里一般已经把原因写清楚了，先看日志再动手。

## 日志在哪

| 位置 | 内容 |
|---|---|
| `.minecraft/logs/latest.log` | 本次启动的完整日志 |
| `.minecraft/logs/` 里带日期的 `.log.gz` | 历史日志 |
| `.minecraft/crash-reports/` | 崩溃时生成的报告，最有用 |
| 启动器的实例目录 | 每个实例有自己的 `logs` / `crash-reports` |

`.minecraft` 默认在 `%APPDATA%\.minecraft`；用启动器分实例的话，日志在实例自己的目录里，不在全局那个。

## 怎么看日志

从文件**末尾往上**找这几类关键词：

| 关键词 | 含义 |
|---|---|
| `java.lang.OutOfMemoryError` | 内存不够 |
| `Could not reserve enough space` | 内存参数超过物理内存 / 32 位 Java |
| `UnsupportedClassVersionError` | Java 版本不对 |
| `Mixin apply failed` / `NoSuchMethodError` | 模组之间冲突，或模组版本不匹配 |
| `Invalid signature` / `Failed to verify` | 文件损坏或被改动 |
| `Exception in thread "main"` + 第一条 `at ...` | 真正的崩溃点，看第一行 Java 类名 |

模组崩一般会直接写「哪个模组出问题」，那个模组 ID 就是元凶。

## 卡在加载界面一直不动

1. 模组太多：第一次进整合包要跑资源重载，几分钟正常，超过 10 分钟多半是某个模组死循环；
2. 看 `latest.log` 最后一行停在哪，停在某个模组名就不再动，就是它；
3. 内存给太小也会卡在「Building terrain」阶段。

## 进世界就黑屏 / 花屏 / 直接掉驱动

显卡相关，按顺序试：

1. 更新显卡驱动（NVIDIA / AMD / Intel 官方驱动，别用 Windows 自动装的旧版）；
2. 关掉光影；
3. 把渲染距离从 16 降到 8–10；
4. 笔记本确认游戏跑在独显上，不是核显。

## 一开光影就崩

- 光影加载器（Iris / OptiFine）版本必须和 MC 版本、模组加载器对应；
- 光影包文件太大或版本不兼容会报 shader 编译错误，换一个包试；
- 集显、老显卡（GTX 10 系以下）基本跑不动现代光影，别硬开。

## 模组冲突怎么定位

不要一次装十几个再看。用**二分法**：

1. 只留一半模组，能进就说明问题在另一半；
2. 反复二分，几轮就能锁定具体那一个；
3. 锁定后去模组页面看它要求的 MC 版本和依赖模组（比如 Fabric API、Architectury API）有没有装对。

::: warning 别乱删文件
`config` 目录里的配置删了不会「修复」问题，只会丢设置。真怀疑配置坏了，先整个目录改名备份，再启动让它重新生成。
:::

## 存档会不会丢

崩在启动阶段一般不动存档。崩在游戏里，先备份 `saves/<世界名>` 整个目录再折腾。开游戏前顺手备份一次，比事后找回省心。
