# 特写 · Tessera（安卓）

**把 Tesla 行车记录仪的六路录像和行车数据，装进手机里看。**

Tesla 的行车记录仪一次会同时写下 6 路视频（前视、后视、左侧、右侧、左 B 柱、右 B 柱），
外加压在 H.264 SEI 里的车速、挡位、方向盘角度、电门 / 刹车、Autopilot 状态和 GPS。
在电脑上要开浏览器、导文件、等转码；在手机上，这个 APP 直接读那张卡——
U 盘插上去就能翻、能播、能剪、能分享。

基于 [Tauri 2](https://tauri.app)：Rust 负责扫描与解析，Kotlin 负责解码与导出，界面是 WebView。

<p align="center"><a href="README.md">English</a> | 简体中文</p>

<p align="center">
  <a href="https://github.com/clrs520/tessera-android/releases/latest"><img alt="下载 APK" src="https://img.shields.io/github/v/release/clrs520/tessera-android?label=APK&color=6d3bf5"></a>
  <img alt="Android 7.0+" src="https://img.shields.io/badge/Android-7.0%2B-3ddc84">
  <img alt="ABI" src="https://img.shields.io/badge/ABI-arm64--v8a%20%C2%B7%20x86__64-blue">
  <img alt="体积" src="https://img.shields.io/badge/APK-%E7%BA%A6%2028%20MB-lightgrey">
  <a href="LICENSE"><img alt="AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-orange"></a>
</p>

## 支持这个分支

如果这个安卓移植对你有用，可以扫码请我一杯咖啡（微信）：

<p align="center"><img src="src/imgs/donate-qr.jpg" alt="微信打赏码" width="220"></p>

## 下载与安装

1. 到 **[Releases](https://github.com/clrs520/tessera-android/releases/latest)** 下载 `Tessera-<版本号>.apk`
   （universal 包，同时含 arm64-v8a 与 x86_64，约 28 MB，Android 7.0 及以上）。
2. 在手机上打开这个 APK，允许「安装未知来源应用」。
3. 首次启动按引导授予**「所有文件访问」**—— TeslaCam 的文件夹是按绝对路径读的，
   Android 11 之后这是侧载应用唯一可行的办法（详见[权限与隐私](#权限与隐私)）。
4. 点「选择文件夹」，选到 `TeslaCam`（或 `RecentClips` / `SavedClips` / `SentryClips` 任意一层）即可。

**升级**：直接装新包覆盖，设置、收藏、播放进度都保留（存在应用私有目录）。
**校验**：每个 Release 的正文都附 APK 的 SHA-256，可用 `sha256sum Tessera-x.y.z.apk` 对一下。

> 没有 Google Play 版本；APK 由本机工具链构建并签名后上传到 Releases。

## 界面一览

以下截图来自安卓模拟器上的演示素材（**非真实路况录像**），界面为简体中文（也内置英文）。

| 事件列表：真帧缩略图、日期 chips、类型筛选 | 六宫格同播：触发路高亮、缺路标「无信号」 | 单路播放：布局与相机直选、进度条、倍速 |
|---|---|---|
| <img src="doc/screens/list.png" alt="事件列表" width="230"> | <img src="doc/screens/grid6.png" alt="六宫格播放" width="230"> | <img src="doc/screens/single.png" alt="单路播放" width="230"> |

| 批量选择：长按拖选一批，一次删完并可撤销 | 导出页：视角 / 叠加 / 范围三段，先预览再导 | 设置面板：偏好全部直选，不用翻页 |
|---|---|---|
| <img src="doc/screens/select.png" alt="批量选择" width="230"> | <img src="doc/screens/export.png" alt="导出页" width="230"> | <img src="doc/screens/settings.png" alt="设置面板" width="230"> |

## 它能做什么

### 播放

- **六路同步**：前视 / 后视 / 左侧 / 右侧 / 左 B 柱 / 右 B 柱按同一条时间轴对齐播放，
  某一路缺失就标「无信号」，不会把整段拖停。
- **四种画面布局**：六宫格、四宫格、大小窗（画中画）、单路全屏；单路下可用 F / B / L / R / LP / RP 直选切相机。
- **换段不闪**：跨过 1 分钟片段时先把上一帧按住、等各路都就绪再同时放开，接缝处不黑一下、时钟不跳。
- **倍速**：0.5×–8×，长按画面临时 3×；进度条拖动时上抬进入微调（约 0.1 秒 / 像素）。
- **进度记忆**：每个事件记住看到哪一秒，下次点开接着放；也可设为「从头播」或「跳到事件点」。
- **连续播放**：一个事件播完自动进下一个。

### 行车数据

- 从视频里的 SEI 直接解出：**车速、挡位、方向盘角度、左右转向灯、刹车、电门、Autopilot 状态、GPS 位置与航向、加速度**。
- 车速 HUD 小药丸可拖到任意角落并记住位置；「详细数据」面板给全部字段与统计。
- **速度曲线**画在时间轴上，点曲线任意一点直接跳到那一秒。
- **CSV 导出**：把整段遥测导成表格，交给别的工具看。

### 找片与列表

- 事件卡带**真帧缩略图**（原生取帧 + 落盘缓存）、中文日期与星期、时长、来源（保存片段 / 哨兵 / 最近）与体积。
- 筛选：类型四段直选、只看触发、只看收藏、按日期 chip、搜索日期 / 类型 / 城市、新→旧或旧→新。
- 大列表窗口化渲染：几千个事件也滑得动，跳滚深处不留空白。
- 下拉刷新保留列表与滚动位置；单条左滑删除；批量删除支持**长按拖选**一批，删完可撤销。

### 剪辑与导出

- 在时间轴上定入出点（或在胶片条上横划一道直接框选区间），可命名片段、A-B 循环。
- **原生导出**（`MediaCodec` 解码 → GL 合成 → 编码）：多路画面自由摆放、自动调换位置，
  每路单独算分辨率（源 / 1080p / 720p / 480p）。
- 叠加层：相机标签、触发角标、时间戳、水印、隐私模糊，导出前可看合成预览帧。
- 导出跑在前台服务里：熄屏、切后台不断，进度常驻通知；开始导出前查剩余空间，完成后一键分享。

### U 盘 / 外接存储

- OTG 直读 TeslaCam 卡，不用先拷到手机里。
- Rust 侧流式扫描，边扫边出列表；**每块盘的尺寸索引 + 目录清单缓存**，
  61k 文件的二次扫描从约 30 秒降到约 1 秒。
- 插盘即刷新：`MEDIA_*` 挂载广播 + `USB_DEVICE_ATTACHED` 过滤器，进程被杀也会被拉起。
- FAT32 / exFAT 都实测过，2 TB 大容量盘扫得完。

### 手机本身

- 底部动作栏（片段 / 布局 / 设置）在拇指区，抽屉导航，iOS 风格底部弹层，安全区与状态栏跟随主题。
- 主题三态：跟随系统 / 浅色 / 深色；玻璃面板按底下的画面自动调厚度与墨色，保证对比度过 WCAG AA。
- 尊重系统的「减弱动态效果」「高对比度文本」「减少透明度」。
- 简体中文 / English 一键切换；TalkBack 可达性补齐，关键操作有触感反馈。
- 一键复制**诊断报告**（耗时、队列深度、几何、插盘链路），报障时直接贴过来。

## 5 分钟上手

1. 车里导出：中控屏 →「行车记录仪」→ 点 USB 图标把录像拷出来，或直接拔下那张 TeslaCam U 盘。
2. 用 OTG 转接头插到手机（或先把 `TeslaCam` 文件夹拷进手机存储）。
3. 打开 APP →「选择文件夹」→ 选中 `TeslaCam` → 等列表出来。
4. 点任意一张卡片 → 六路同时起来；双指捏合放大，左右滑画面切事件。
5. 想要某一段：点剪刀定区间 →「导出」→ 选视角与分辨率 → 开始导出。

## 手势一览

播放页首次进入会浮现一份手势说明，也可以在设置面板里随时打开。

| 手势 | 作用 |
|---|---|
| 双击画面左 / 右 | 后退 / 前进 10 秒（暂停时逐帧） |
| 双击画面中间 | 切换到下一路相机 |
| 右侧 2/3 上下滑 | 上一路 / 下一路相机 |
| 左侧 1/3 上下滑 | 调亮度（可突破系统亮度上限，右侧有进度条） |
| 双指捏合 / 两指双击 | 放大画面 / 缩放归位 1× |
| 放大后单指拖动 | 平移画面 |
| 长按画面 | 临时 3 倍速 |
| 横滑画面 | 上一个 / 下一个事件 |
| 进度条拖动时上抬 | 进入精细微调（约 0.1 秒 / 像素） |
| 在胶片条上横划一道 | 直接框出剪辑区间 |
| 列表里长按卡片 | 打开上下文菜单；**按住不放再拖** = 批量选一片 |
| 列表行左滑 | 删除单个事件 |

## 手机与桌面的差异

**桌面版行为与上游一字不差。** 下面这些只在手机（触摸壳）生效：

- 手机优先的界面层：底部动作栏、抽屉、手势、iOS 风格弹层、安全区。
- 扫描、缩略图、遥测解析、导出全部走原生（Rust / Kotlin），因为六路播放已经把 WebView 的硬件解码器槽位占满。
- 安卓端不做：单路声音、检查更新、地图查看轨迹（改为在 APP 内用颜色标注自动驾驶状态）。
- 文件名前缀：安卓导出 / 抽帧用 `Tessera_`，桌面保持上游命名。

## 权限与隐私

| 权限 | 为什么要 |
|---|---|
| 所有文件访问（`MANAGE_EXTERNAL_STORAGE`） | 按绝对路径读 TeslaCam 文件夹与 U 盘；Android 11+ 的侧载应用没有别的办法 |
| 网络（`INTERNET`） | **只用于 `127.0.0.1` 上的回环媒体服务**，让 WebView 能用 `<video>` 读本地文件 |
| 前台服务 + 通知 | 后台导出与后台扫描不被系统冻结 |
| 振动 | 长按、批量选择等操作的触感反馈 |
| 保持唤醒 | 导出 / 播放期间不降频 |

- **不联网**：没有统计、没有广告、没有云同步，运行期不请求任何外部地址。
  界面上仅有的外部链接是 GitHub（关于页）和「显示路径」里的地址跳转，都交给你自己的浏览器。
- 回环服务带随机令牌，只允许读你本次打开的那个文件夹，且只放行媒体扩展名，`/proc`、`/data` 等一律拒绝。
- 遥测解析、缩略图、导出都在本机完成，视频文件不会离开设备。
- 诊断报告里只有耗时、计数与几何数据，不含令牌。

## 遇到问题

- **插盘读不到 / 列表是空的**：设置 →「关于」→「U 盘读取指南」；多数是系统没挂载或没给「所有文件访问」。
- **点开要等一下**：超过 60 段的大事件只量即将播的那一段，其余在画面起来后后台补，时间轴边补边长。
- **六路有点卡**：切到单路或大小窗；部分机型硬解槽位有限，这是系统限制。
- **导出失败**：导出页会显示预计体积与剩余空间；整段取不到帧会明确报错，而不是出一个黑视频。
- 还是不行：设置 →「复制诊断」，连同现象发到 **[Issues](https://github.com/clrs520/tessera-android/issues)**。
  能附上机型、系统版本和 APK 版本号（在「关于」页）就更有帮助。

<p align="center"><img src="doc/screens/about.png" alt="关于页" width="260"><br>
<sub>「关于」页：版本号、上游链接、U 盘读取指南、Issues 入口。</sub></p>

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
npm install
npm run tauri build
```

验收：`devtools/` 下是本项目在模拟器与真机上跑过的判据脚本（CDP / adb），
每一轮的判据与实测数字记在工程日志里。

## 工程日志

[`doc/ANDROID_CN.md`](doc/ANDROID_CN.md) —— 逐轮的根因、实测数字与验收判据（中文）。
想知道某个看起来多余的处理为什么在那儿，那里有答案。

## 仓库结构

| 路径 | 内容 |
|---|---|
| `src/` | 前端（HTML / CSS / JS，构建时嵌入） |
| `src-tauri/` | Rust crate：扫描、SEI 遥测、回环媒体服务；安卓工程在 `src-tauri/gen/android` |
| `src-tauri/gen/android/app/src/main/java/` | Kotlin：原生导出、原生缩略图、前台服务、系统能力桥 |
| `doc/ANDROID_CN.md` | 安卓移植工程日志 |
| `doc/screens/` | 本文用的界面截图 |
| `devtools/` | 验收探针、构建脚本、CDP / adb 辅助工具 |

## 上游与署名

本仓库是 **[DeaglePC/TDashcamStudio](https://github.com/DeaglePC/TDashcamStudio)** 的**分支（fork）**
（该项目更早的前身是 [DeaglePC/TeslaCamPlayer](https://github.com/DeaglePC/TeslaCamPlayer)）。
桌面版播放器、TeslaCam 元数据 / SEI 解析、界面与导出设计均来自上游；本分支只增加安卓目标与手机侧能力。

- 上游作者：**DeaglePC** 与 TDashcam Studio 的贡献者
- 许可证：**GNU AGPL-3.0**（沿用未改，见 [LICENSE](LICENSE)）
- 按 AGPL 第 5 / 13 条：本仓库是修改版，完整对应源码即本仓库；若把修改版作为网络服务提供，也必须提供源码。

## 版本与变更

- 全部发行说明在 **[Releases](https://github.com/clrs520/tessera-android/releases)**，每个版本附可直接安装的 APK。
- 版本号只在 `src-tauri/tauri.conf.json` 里维护，「关于」页显示的就是它。

## 许可证

GNU AGPL-3.0，见 [LICENSE](LICENSE)。版权归上游作者与本分支贡献者所有。
