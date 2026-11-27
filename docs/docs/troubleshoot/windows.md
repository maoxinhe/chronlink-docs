---
title: Windows 安装与权限问题
description: 装不上、被拦截、双击没反应、找不到文件——先把 Windows 这一层排掉。
permalink: /docs/troubleshoot/windows.html
order: 1
---

# Windows 安装与权限问题

装不上多半不是启动器的问题，而是 Windows 把文件拦了、或者装到了不该装的地方。按下面顺序看一遍。

## 双击安装包，弹「Windows 已保护你的电脑」

这是 SmartScreen 对**没有代码签名证书**的新程序的默认拦截，不是杀毒软件报毒。

1. 点弹窗里的「更多信息」；
2. 出现「仍要运行」按钮，点它；
3. 后续按提示装完。

如果连「更多信息」都没有、直接闪一下消失，说明文件被安全软件拦了，看下一条。

## 杀毒软件报毒 / 安装程序被自动删除

火绒、卡巴斯基、360、Windows Defender 对新程序常报「可疑」或「未知程序」。先确认安装包来源：

- 必须是 GitHub Releases 或官网下载的，文件名形如 `ChronLink_<版本>_x64_modern-setup.exe`；
- 每个安装包旁边都有一个同名 `.sig` 文件，用来给自动更新校验，**别删、别改**。

来源确认没问题后：

1. 把安装包所在文件夹加进杀毒软件的信任区 / 白名单；
2. 从隔离区恢复被删掉的文件；
3. 重新运行安装包。

装完仍然启动就被拦，就把 C 盘里启动器安装目录整个加入白名单，再把已删除的进程恢复。

## 双击安装包毫无反应

按顺序排查：

1. **确认是 Windows 版**。目前只有 Windows 构建（x64 / arm64），macOS、Linux 的包在这里跑不了。
2. **确认架构对**。骁龙笔记本、部分二合一平板是 ARM 架构，要下 `arm64` 那个；拿 `x64` 的包会装失败或闪退。
3. **检查路径**。安装目录别带中文、空格、特殊符号，别装在桌面或压缩包里直接双击运行——先解压到硬盘再运行。
4. **用管理员身份运行**。右键安装包 → 以管理员身份运行。
5. **看事件查看器**。`Win + X` → 事件查看器 → Windows 日志 → 应用程序，找红色错误，有 `ChronLink` 或 `.NET` 关键字就是它崩了。

## 提示找不到 VCRUNTIME140.dll / api-ms-win-crt-*.dll

缺 Visual C++ 运行库。装微软官方的 [VC++ 运行库合集](https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist)，x64 和 x86 两个都装上，然后重启再开。

## 装到一半报「文件被占用」「无法写入」

- 先关掉正在运行的启动器（托盘里也要退出），再装；
- 关闭同步盘（OneDrive、坚果云）对该目录的同步；
- 换一个目录装，比如 `D:\Games\ChronLink`。

## 装完打开是白屏 / 界面加载不出来

界面依赖 WebView2。Windows 10 部分版本和精简版系统没带：

1. 装 [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)（Evergreen 版）；
2. 重启启动器。

## 启动器目录里哪些文件不能删

| 文件 / 目录 | 作用 | 能不能删 |
|---|---|---|
| `ChronLink.exe` | 主程序 | 不能 |
| `*.sig` | 自动更新签名校验 | 不能 |
| `logs/` | 运行日志，排错用 | 可清空，出问题前先备份 |
| `instances/` | 你的实例（存档、模组都在这） | **绝对不能** |
| `config.json` | 启动器设置 | 删了会重置设置 |
