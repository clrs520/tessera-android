# 特写 · Tessera（安卓）

Tesla 行车记录仪的安卓播放器：六路相机（前、后、左、右、左 B 柱、右 B 柱）同步播放，带行车数据叠加。
基于 [Tauri 2](https://tauri.app) 构建。

<p align="center"><a href="README.md">English</a> | 简体中文</p>

## 来源与署名

本仓库是 **[DeaglePC/TDashcamStudio](https://github.com/DeaglePC/TDashcamStudio)** 的**分支（fork）**
（该项目更早的前身是 [DeaglePC/TeslaCamPlayer](https://github.com/DeaglePC/TeslaCamPlayer)）。
桌面版播放器、TeslaCam 元数据 / SEI 解析、界面与导出设计均来自上游；本分支只增加安卓目标与手机侧能力。

- 上游作者：**DeaglePC** 与 TDashcam Studio 的贡献者
- 许可证：**GNU AGPL-3.0**（沿用未改，见 [LICENSE](LICENSE)）
- 按 AGPL 第 5 / 13 条：本仓库是修改版，完整对应源码即本仓库；若把修改版作为网络服务提供，也必须提供源码。

## 本分支改了什么

以下全部**只在手机档生效**，桌面版行为与上游保持一致。

- **安卓目标**（arm64-v8a + x86_64）与手机优先的界面层：底部动作栏、抽屉导航、触摸手势、iOS 风格底部弹层、安全区处理。
- **外接存储 / U 盘**：
  - Rust 侧流式扫描，边扫边出列表（`scan-batch` 逐批上屏）；
  - 每块盘的**尺寸索引**与**目录清单缓存**（按目录 mtime 失效；重新挂载、或本 APP 自己删过文件也会失效），
    61k 文件的二次扫描从 ~30 s 降到 ~1 s；
  - 后台扫描配 `dataSync` 前台服务、`MEDIA_*` 挂载广播接收器、`USB_DEVICE_ATTACHED` 过滤器，
    插盘即刷新（进程被杀也会被拉起）；
  - 下拉刷新保留列表与滚动位置。
- **原生导出**（`MediaCodec` + GL 合成）与**原生缩略图**（`MediaMetadataRetriever` + 落盘缓存）——
  六路播放时 WebView 已经占满硬件解码器槽位。
- **诊断**：一键复制完整报告（耗时、队列深度、几何、插盘链路）。
- **工程日志**：[`doc/ANDROID_CN.md`](doc/ANDROID_CN.md)，逐轮的根因、实测数字与验收判据。

## 构建

依赖：Node 20+、Rust（stable）、Android SDK 36、NDK 27、JDK 17。

```bash
# 完整 universal release APK（前端会被嵌进 Rust 动态库）
bash devtools/build-apk.sh
# 产物：src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

签名读取 `src-tauri/gen/android/app/keystore.properties`
（`storeFile` / `storePassword` / `keyAlias` / `keyPassword`）。该文件与 keystore 本身**不入库**；
没有它构建出来的是未签名包。

桌面版：

```bash
cd TDashcamStudio
npm install
npm run tauri build
```

## 目录

| 路径 | 内容 |
|---|---|
| `src/` | 前端（HTML / CSS / JS，构建时嵌入） |
| `src-tauri/` | Rust crate；安卓工程在 `src-tauri/gen/android` |
| `doc/ANDROID_CN.md` | 安卓移植工程日志 |
| `devtools/` | 验收探针、构建脚本、CDP / adb 辅助工具 |

## 许可证

GNU AGPL-3.0，见 [LICENSE](LICENSE)。版权归上游作者与本分支贡献者所有。
