# 安卓版说明（Android）

TDashcam Studio 的安卓壳复用桌面版的全部播放逻辑，只替换了「选目录」和「取视频流」两处：

- 选目录：桌面版用系统对话框 / File System Access API，安卓版改为内置的路径浏览器（可手写路径，也可逐级点选）。
- 取视频流：安卓 WebView 走 Tauri 的 asset 协议会被截断（上游 tauri#14776），MP4 无法拖动进度。因此 App 内起了一个只监听 `127.0.0.1` 的本地 HTTP 服务，支持 Range/206，URL 带随机 token，仅本机可访问。

## 准备录像文件

1. 把 U 盘里的 `TeslaCam` 文件夹整体复制到手机内部存储，例如
   `/storage/emulated/0/Download/TeslaCam`（用文件管理器复制，或 `adb push`）。
2. 打开 App → 选择文件夹 → 在路径框填入上面的目录，或逐级点进去 → 「选择此文件夹」。
3. 首次读取外部存储会弹出权限引导：到 **设置 → 应用 → 特殊应用权限 → 所有文件访问**，
   为本 App 打开开关后回到目录页面点「进入」。

> 需要「所有文件访问」是因为 App 按绝对路径读取用户自选目录；只给「照片/视频」权限时读不到 U 盘复制出来的文件。

### 拿不到权限时的备用路径

本应用自己的外部目录不需要任何权限：

```
/storage/emulated/0/Android/data/com.tdashcam.studio/files
```

在目录浏览器里点「应用目录」即可直达。把 `TeslaCam` 复制进这个目录（手机「文件管理」或电脑 USB 传输都可以），
再选它即可播放。

如果手机连着电脑并开了 USB 调试，可以直接用命令授权，比翻设置快：

```bash
adb shell appops set com.tdashcam.studio MANAGE_EXTERNAL_STORAGE allow
```

选择目录后的提示会区分三种情况，不再只给一句「No files found」：

- 权限没给 → 「所有文件访问」提示 + 真实 errno。
- 目录读不到 → 直接显示 `read_dir` 的错误。
- 目录读到了但没找到视频 → 显示顶层条目数量和前 6 个名字（`probe_readable`），
  以及找到的文件样例相对路径（选错文件夹时会显示 `RecentClips/...` 之外的实际结构）。

安卓的递归扫描在 Rust 侧完成（命令 `scan_media_dir`），不再走 JS 的 fs 插件：一次 IPC 调用替代
每个目录一次，而且不受 `fs:scope` 的路径限制影响。桌面版仍用原来的 `scanTauriFiles`。

## 「目录是空的」到底是什么意思

`std::fs::read_dir` 在**没给「所有文件访问」时不一定报 EACCES，可能直接返回空列表**（Android 11+
的 FUSE 视图），所以「能读、0 个条目」这句话本身有歧义。App 里现在用两个不依赖文件系统行为的信号来区分：

- `Environment.isExternalStorageManager()`：MainActivity 把它连同 `isExternalStorageLegacy()`、
  `Build.VERSION.SDK_INT` 一起推成 `window.__tdashcamStorage`（并写进 `localStorage.__tdashcam_storage`
  兜住重载），提示里会直接写「所有文件访问：已开启 / 没有开启 (SDK 36)」。
- `find_media_locations`（Rust）：在 `/storage/emulated/0` 以及其它挂载卷（U 盘直读会出现在
  `/storage/XXXX-XXXX`）里浅层搜索（深度 3、最多 400 个目录、12 条结果）哪些目录里有 `.mp4`、
  哪些长得像 TeslaCam，外加应用私有目录。空结果提示会列出「视频实际在这些位置」，一个都没有就说明
  U 盘根本没拷进来。

目录浏览器的列表也换成了原生 `list_subdirs`，安卓侧不再经过 `tauri_plugin_fs` 的 JS scope。

## 构建 APK

本机需要：Node、Rust（`rustup` 用 `windows-gnu` host 时还要把 MinGW-w64 的 `bin` 加进 PATH，
否则编 `windows-sys` 会报 `dlltool.exe: program not found`）、JDK 17、Android SDK
（含 NDK 27.2.12479018），并导出 `JAVA_HOME` / `ANDROID_HOME` / `NDK_HOME`。
另外 `~/.android/debug.keystore` 必须存在，没有就用 keytool 生成一份
（别名 `androiddebugkey`、口令 `android`）。

debug 版可以接 `chrome://inspect` 调试，但体积很大（未 strip 的 `.so` 内嵌了前端资源）：

```bash
npm install
npx tauri android build --apk true --debug --target aarch64
# 产物：src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk  (~150MB)
```

装到手机用 release 版（约 14MB）：

```bash
npx tauri android build --apk true --target aarch64
# 产物：src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

只给 `--target aarch64` 时包里只有 `arm64-v8a`，主流手机都能装；老 32 位机型换 `--target armv7`。

release 必须签名才装得上：在 `src-tauri/gen/android/app/keystore.properties`（已进 .gitignore）
写四行，Gradle 模板会据此接上 `signingConfigs.release`；文件不存在时 release 产物是不签名包。

```properties
storeFile=C:/path/to/release.keystore
storePassword=...
keyAlias=...
keyPassword=...
```

```bash
keytool -genkeypair -v -keystore release.keystore -alias tdashcam-studio \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass <密码> -keypass <密码> -dname "CN=TDashcam Studio"
```

这是自签名，不是 Play 的上架签名；换 keystore 之后不能覆盖安装，得先卸载。

云端构建：`.github/workflows/android.yml` 手动触发，产物是 debug 签名的 APK
（能直接侧载安装，但不适合上架；CI 没有 `keystore.properties`，所以不出 release）。

## 安装

```bash
adb install -r app-universal-release.apk
```

没有 adb 时把 APK 传到手机直接点开安装（需允许「安装未知应用」）。

## 在电脑上用模拟器过一遍排版（不用每轮都往手机上装）

排版这类事在真机上来回装太慢。Windows 上 WHPX 可用时（`emulator-check.exe accel` 返回
`WHPX(...) is installed and usable.`）可以完全在 PC 上跑：

```bash
SDK="$LOCALAPPDATA/Android/Sdk"
# 一次性的环境准备
"$SDK/cmdline-tools/latest/bin/sdkmanager.bat" emulator platform-tools \
    "system-images;android-36;google_apis;x86_64"
rustup target add x86_64-linux-android
"$SDK/cmdline-tools/latest/bin/avdmanager.bat" create avd -n tdashcam_phone \
    -k "system-images;android-36;google_apis;x86_64" -d pixel_7 -c 4G
# 无窗口启动（截图照样能拿，比开窗口快）
"$SDK/emulator/emulator.exe" -avd tdashcam_phone -no-window -no-audio -no-boot-anim -gpu auto &
```

然后出 **x86_64** 的包 —— 模拟器镜像是 x86_64，arm64-only 的 APK 装不上：

```bash
npx tauri android build --apk true --target x86_64
adb install -r -g app-universal-release.apk
```

`-g` 只给普通 runtime 权限，「所有文件访问」要单独开，否则每次都要在设置里手点：

```bash
adb root
adb shell appops set --uid com.tdashcam.studio MANAGE_EXTERNAL_STORAGE allow
```

测试数据用 `node devtools/make-teslacam-fixture.js --push` 生成并推到
`/storage/emulated/0/TeslaCam`（RecentClips 平铺 + SavedClips/SentryClips 按事件分目录，
92 个 mp4）。默认写的是**只有 MP4 头的占位文件，画面解不出来**，能验的是容器几何（网格、
边距、按钮行、卡片）。要看真实画面、以及任何**跟播放进度有关**的行为（控件 3 秒自动收起、
沉浸式、进度条、同步），先录一段真 clip 放到 `devtools/clip-real.mp4`，脚本会自动改用它的字节：

```bash
adb shell screenrecord --time-limit 20 --bit-rate 600000 /data/local/tmp/long.mp4
adb pull /data/local/tmp/long.mp4 devtools/clip-real.mp4
node devtools/make-teslacam-fixture.js --push
```

`--time-limit 6` 在这个 AVD 上只录到 1.13 秒，比控件隐藏计时器还短，测沉浸式会误判；
推之前用 `mvhd`（timescale 在 box+20、duration 在 box+24）或直接在页面里读 `video.duration`
确认长度。screenrecord 出来的分辨率永远是面板自然方向的 1080×2400，所以宫格里看到的是
窄窄一条 pillarbox，这不是 `object-fit` 的 bug。

两个会让测试数据「看起来像 bug」的坑：

- 侧向镜头的文件名必须是 `-left_repeater.mp4` / `-right_repeater.mp4`。
  `getCameraType()` 只认这两个后缀，`-left.mp4` 会被判成「不属于任何镜头」直接丢掉，
  于是六宫格只有 4 格有画面、Left/Right 两格显示「无信号」——这是 fixture 的问题，不是 App 的。
- `.player-area.empty` 的背景是 `imgs/cybertruck-bg.jpg`（`center/cover`），没选事件时整块区域
  就是一张铺满的皮卡图。别把它当成「视频被 cover 拉伸了」——先 `document.getElementById('playerArea').className`
  确认是不是 `empty`。

截图：`powershell -File devtools/shot.ps1 -Out <png> -Width 900`（先 `adb shell screencap`
落盘再 `pull`，用 PowerShell 管道接 `screencap` 的二进制会被转成文本而损坏；1080×2400 原图
太大读不进去，必须缩放）。旋转用 `adb shell settings put system user_rotation 1`（配合
`accelerometer_rotation 0`），**两条 settings 要分两次 `adb shell` 执行**，写在同一条命令里
第二次不会生效；`adb emu sensor set acceleration` 在这个 AVD 上不起作用。

Git Bash 下 `adb push <本地> /data/local/tmp/x` 会把远端路径也按 Windows 规则改写，结果是
**报「1 file pushed」但文件根本不在设备上**。加 `export MSYS_NO_PATHCONV=1` 才是真的推上去。

## 直接读运行中页面的布局数值（比看截图快得多）

release 包的 WebView 也开着 DevTools socket，所以不用截图猜像素：

```bash
PID=$(adb shell pidof com.tdashcam.studio)
adb forward tcp:9333 localabstract:webview_devtools_remote_$PID
curl -s http://127.0.0.1:9333/json          # 拿到 page 的 webSocketDebuggerUrl
node devtools/cdp-eval.mjs "innerWidth+'x'+innerHeight"
node devtools/cdp-eval.mjs --file devtools/probe-drawer.js   # 抽屉各块的实际高度
```

`devtools/patch-css.mjs src/styles.css 3483 3820` 能把改动的 CSS 片段**热注入**到正在跑的页面里
（追加一个 `<style id="live-patch">`），先量清楚再决定要不要花几分钟重编 APK。媒体查询会自动
按当前方向重新匹配，横竖版各测一次即可。

`node devtools/cdp-eval.mjs "(async()=>{await window.viewer.loadTauriDirectory('/storage/emulated/0/TeslaCam'); ...})()"`
可以直接驱动应用自己的代码路径（`window.viewer` 是 `TeslaCamViewer` 实例），比手点目录浏览器快。

但**凡是依赖用户手势的都测不出来**：CDP 里 `element.click()` 不算 user activation，有声 `play()`
会被拒、依赖 click 的分支也会走偏。这类改动要用真点击：

```bash
# CSS 坐标 × devicePixelRatio（这台 AVD 是 2.625）= adb 的物理像素
adb shell input tap 541 593
```

配合 `node devtools/cdp-eval.mjs` 先量出目标元素的中心，再点、再读结果。判断「包是不是真的在跑
新代码」也别信版本号，直接探函数体：
`viewer.videoControls.hideControls.toString().includes('headerRight')`。

### 真点击会「全部失效」的两种情况

- **ANR 对话框偷偷吃掉点击**：刚装完包模拟器 load average 会冲到 8+，这时系统弹
  「无响应：… Input dispatching timed out（Waited 5002ms for FocusEvent(hasFocus=true)）」，
  它抢走输入焦点 —— **CDP 探针照样回答，但每一次 `input tap` 都点在对话框上**。表现是抽屉打不开、
  卡片点了没反应、布局标签自己变，很容易被误判成"新代码有 bug"。先
  `adb shell dumpsys window | grep mCurrentFocus` 看到 `Application Not Responding` 就是它；
  点 `等待`（物理坐标 `(540,1363)`，`android:id/aerr_wait`）或 `am force-stop` 重开，
  **等 `adb shell uptime` 的 load1 < 2 再开始点**。`/data/anr` 里能翻到同样的记录早于本次构建，
  属于环境问题，不是这个 App 的卡死。
- **事件列表在屏幕外**：`#tabListBtn`（列表）开的是**事件抽屉**，`#tabFolderBtn`（文件夹）开的是
  **目录浏览器**，别搞反。事件抽屉打开时事件列表是平移出屏的，此时 `#fileList .video-card` 的
  x 会报 -160 / -298 —— `tap-to.mjs` 会打印「cannot tap」带矩形，这是**没打开对应抽屉**，不是缺陷。
- **重装即重置状态**：任何一次重装（含 `adb install -r`）后旋转锁没了，
  **`MANAGE_EXTERNAL_STORAGE` 也没了**，必须重新
  `MSYS_NO_PATHCONV=1 adb shell appops set com.tdashcam.studio MANAGE_EXTERNAL_STORAGE allow`，
  否则目录浏览器是空的，看起来像扫描逻辑坏了。`adb install -r` 只保留 localStorage
  （上次目录、上次布局）。
- **横屏滑动的起点别落在 y≈26**：横屏状态栏高 74 物理 px（= 28 CSS px），从那儿起手的滑动能拉开
  **通知栏**而不是碰到 App。

## 改前端后怎么确认包真的更新了

`src/` 下的 HTML/JS/CSS 是被 `include` 进 `libtdashcam_studio.so` 的。实测同 profile 的增量构建
不一定会重编（日志里 cargo 直接 `Finished ... in 0.94s`，包里就还是旧页面），`touch src-tauri/src/lib.rs`
也没能触发。改完前端要强制一次，并核对产物：

```bash
cargo clean -p tdashcam-studio --target aarch64-linux-android --release
npx tauri android build --apk true --target aarch64
# 日志里应出现 Compiling tdashcam-studio；再比对：
unzip -p <apk> lib/arm64-v8a/libtdashcam_studio.so | cmp - src-tauri/target/aarch64-linux-android/release/libtdashcam_studio.so
```

`cargo clean -p` 要在 `src-tauri/` 目录下执行（仓库根目录没有 Cargo.toml）。
更省事的判断办法：每次出包前把 `src-tauri/tauri.conf.json` 的 `version` 往上加一位，
手机上「设置 → 应用信息」里看到的 versionName 就是装进去的那个包：

```bash
"$ANDROID_HOME/build-tools/36.0.0/aapt2.exe" dump badging <apk> | grep ^package
```

APK 里 **没有** `assets/script.js` 之类的条目（前端资源是编进 `.so` 的），所以别指望在包里 grep 前端字符串。

## 顶部安全区（状态栏遮挡）

`MainActivity` 调了 `enableEdgeToEdge()`，WebView 会铺到状态栏下面，但 Tauri/wry 不把
WindowInsets 交给 WebView，页面里 `env(safe-area-inset-top)` 恒为 0 —— 结果就是标题、抽屉头部
压在系统状态栏上。现在的做法：`MainActivity.kt` 在 decorView 上量 `systemBars | displayCutout` 的
insets，除以 `density`（`width=device-width` 下 CSS px == dp），再用 `evaluateJavascript` 写成
`<html>` 上的 `--safe-top/--safe-bottom/--safe-left/--safe-right`。CSS 侧只在 `:root` 里给这四个变量
默认取 `env(...)`，所有布局都读 `var(--safe-*)`，注入的值是 `max(env(...), Npx)`，两边谁大用谁。

两个坑：

- `evaluateJavascript` 在页面加载完成前推的值会被首次导航冲掉，所以 `onWebViewCreate` 里延后推了
  400/1200/2500ms 三次，外加 `onWindowFocusChanged` 再推一次（旋转、分屏、从授权页返回都走这里）。
- 后面媒体查询里的 `padding` 简写会把带 inset 的 `padding-top` 整条覆盖掉（`.sidebar-header` 在
  `max-width:1000px` 就被 `padding: 0.75rem` 打回原形）。改这类规则要在简写之后重新写
  `padding-top: calc(... + var(--safe-top))`。

本地不用真机也能验：起个静态服务指向 `src/`，浏览器里
`document.documentElement.style.setProperty('--safe-top','max(env(safe-area-inset-top, 0px), 34.0px)')`，
再读 `.sidebar-header` 的 computed `padding-top` 是不是 `12px + 34px`。

## 手机横竖版排版

坑在于**横过来的手机不匹配 `max-width: 768px`**：小米 14 横版的 CSS 视口约 1017×457，
Pixel 7 约 914×411 —— 宽度上去了，高度只剩 400 多。所以原来所有「移动端」规则（抽屉变浮层、
宫格改 2 列、弹窗留 inset）在横版全部失效，表现就是用户看到的：抽屉变成 280px 的常驻栏把
标题挤成「TDashcam Studi」、宫格沿用桌面的 `padding: 60px … 120px`（180px 上下留白吃掉四成
高度，两行 1fr 各剩 ~110px，16:9 画面只占一小条）、镜头切换按钮行被右侧裁掉。

现在的做法是给每条手机规则补一个横版分支：

```css
@media (max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px) { … }
```

`max-height: 620px` 只圈手机，额外的 `max-width: 1200px` 防止桌面端把窗口拉矮时误命中。
文件末尾还有一段专门给手机的重叠覆盖（放在最后靠层叠顺序赢）：

- 顶栏：`.header-center-info` 从 `position:absolute; left:50%` 改成普通流 + `min-width:0`，
  `.header-location` 用 `text-overflow: ellipsis` 单行截断。绝对居中时长地址会折成三四行，
  压住汉堡按钮和视频区。
- 抽屉列表：`.file-list` 是 grid，默认 `align-content: normal`（等同 `stretch`）会把 auto 行
  拉高填满抽屉，一条记录变成一屏高的空蓝框 —— 必须显式 `align-content: start`。
- 镜头切换：`.view-btn span` 在手机上隐藏，只留带 F/B/L/R/LP/RP 字母的图标；带文字时十个按钮
  一定超宽，`overflow-x:auto` 只是能滚，看起来就是「被裁掉了」。
- 宫格：横版 6 宫格 3×2、4 宫格 4×1，上下留白压到 40/64px；竖版 4 宫格改成 1 列 4 行
  （2×2 的格子是 184×176，16:9 只画得出 184×104，竖着排反而多六成画面）。
- 画面比例：手机上 `.video-container video` 改成 `object-fit: contain`。桌面端的 `cover` 会把
  画面裁到填满格子，16:9 素材放进 184×178 的格子左右各丢掉约 20% —— 记录仪录像是证据，
  宁可留黑边也不能裁。只改手机分支，桌面端行为不动。
- 横版抽屉的固定区：`--safe-top` 在横版仍有 28px，加上 header 自身 48px、filters 43px、
  footer 79px，412px 高的视口只剩 213px 给列表（1.8 张卡片）。横版分支里把三块压到
  70/33/59，卡片从「缩略图 + 文字」的 140px 竖排改成 46px 的横排行（76×43 缩略图 + 两行文字），
  可见条目 1.8 → 5。竖版同样把 header/filters/footer 的 1rem 间距压到 8px，列表 523 → 578px。
- 日期输入框的隐藏 bug：`<input>` 的宽度默认由 `size` 属性决定（实测 266px），横版把两个筛选
  框并排成各 158px 后，日期框仍然按固有宽度画，**盖住了右边的「事件类型」下拉框**。
  修法是 `width:100%; min-width:0`（`.date-input-wrapper` 也要 `min-width:0`）。
- 横版 ⋮ 菜单：桌面是 8 行竖排的下拉，约 310px 高，比整个横版视口还高，打开就出屏。
  最早改成 `flex-wrap: wrap` 的 40×36 图标格（一行排下），并且 `.btn-text` 直接隐藏 —— 40px 的格子里
  中文标签会被裁成「[ E S ] ￼」这种残字，每个按钮本来就有 `title` 提示。隐藏要写
  `display: none !important`：桌面端那条 `.header-collapsed .header-actions-group .btn-text`
  本身就是 `display: block !important`，同特异度不带 `!important` 覆盖不掉。
  **1.2.51 起触屏设备不再走这套**：纯图标方格和带标签的直选行混在同一个面板里是两套布局语言，
  现在手机横屏用的是和竖屏同一套「图标 + 文字」行栅格（5 列 × 148px、行高 38、两条轨道各占 3 列），
  详见第四十四轮。上面那套 44px 纯图标方格现在只剩**桌面端把窗口缩窄**时才会命中
  （门控是 `(hover: none) and (pointer: coarse)`）。
- 目录浏览器弹窗在横版会**出现两层滚动条**：面板自己有 `overflow:auto` + `max-height`，里面的列表又写死
  `max-height: 34vh`，412px 高的视口下面板内容 388 > 可用 326，于是面板右侧多出一条滚动条（看起来像面板
  右边裂了一格），列表里又有一条。改法：面板在横版变 flex 列，固定块 `flex:0 0 auto`，列表
  `flex:1 1 auto; min-height:0; max-height:none` 吃掉剩下的空间；同时横版把路径输入框从
  `flex:1 1 100%`（竖版要它独占一行）改成 `flex:1 1 240px`，让 Open/Up 和输入框并到一行，省出 69px。
  实测面板 `scrollHeight == clientHeight`（326/326，面板不再滚），列表 148px 自己滚。
- 弹窗里的控件同样要吃 40dp：`Open`/`Up`/`App folder` 原来只有 36px 高（靠 padding 撑的），
  `.dir-path-input` 40、`.dir-browser-item` 44。注意确认按钮在 DOM 里**没有 class**，
  CSS 里那个 `.dir-select-btn` 是死规则，别往它身上加东西。

## 重启后记住上次导入的目录

桌面端把 `lastTeslaCamPath` 写在 `$APPCONFIG/config.json`（走 `tauri-plugin-fs`）。安卓上这个
路径不在插件的 fs scope 里，写会静默失败，所以每次冷启动都要重新选目录。现在安卓分支把目录
另外记在 `localStorage` 的 `tdashcam.mediaDir`（和主题、语言同一个地方）：
`loadTauriDirectory()` 成功且确认含 `RecentClips/SavedClips/SentryClips` 时写入，
`loadLastTeslaCamPath()` 在安卓上先读它并直接 `loadTauriDirectory(saved)` 恢复。
`saveTauriConfig()` 本身照旧调用（它 catch 掉所有错误，不会挡住流程）。

验证：`force-stop` 后重新拉起，`node devtools/cdp-eval.mjs --file devtools/probe-drawer.js`
里 `cards` 应该直接是事件数（模拟器上 7），不需要任何点击。

## 系统返回手势

`TauriActivity` 里写死了 `handleBackNavigation = false`，Tauri 自己**不注册**任何 back 回调，
所以 1.0.7 之前按系统返回（或侧滑）等于直接 `finish()` 掉 Activity —— 抽屉开着、目录浏览器开着，
一下就被退出应用。现在 targetSdk 36 上 `android:enableOnBackInvokedCallback="true"`（manifest 里
显式写了，不依赖默认值）+ `MainActivity.onCreate` 注册 `OnBackPressedCallback`：

- 页面用 `TDashcamNative.setBackLayers(n)` 上报「当前开着几层可关的东西」，n>0 时返回手势交给页面，
  原生再调 `window.__tdashcamCloseTopLayer()` 关最上面那层；页面返回 `false`（其实没东西可关）时，
  回调里 `isEnabled=false; onBackPressedDispatcher.onBackPressed(); isEnabled=true` 落回默认行为，
  同一次手势里正常退出，不会「吞一次返回」。
- 层数存在 `AtomicInteger` 里：JS 线程写、UI 线程读，`onWebViewCreate` 时归零（页面换了，旧层数不作数）。
- `isMinifyEnabled = true`，R8 会把 `@JavascriptInterface` 方法裁掉，`proguard-rules.pro` 必须补
  `-keepattributes JavascriptInterface` + `-keepclassmembers class …NativeBridge { @android.webkit.JavascriptInterface public *; }`，
  否则 debug 包能点、release 包里 `window.TDashcamNative` 直接 undefined。

层数怎么算出来的（`script.js` 的 `phoneLayerCount()`）：打开的 `.modal-overlay.show` 数 + 右上角 ⋮
是否展开 + 抽屉是否展开，桌面布局下恒为 0（桌面的返回键不该被抢）。因为这三处状态都是别的地方
随手改 class 的，没有统一出口，所以用 MutationObserver 盯 `body`/`.sidebar`/`#headerRight`/每个
`.modal-overlay` 的 `class`、`style`，加一个 `resize`，rAF 去抖后只在数值变化时往原生推一次。

验证（模拟器上真按 keyevent 4）：`adb shell input keyevent 4`，抽屉开 → 关抽屉且进程还在（pid 不变）；
目录浏览器开 → 关弹窗，再按一次才退出；⋮ 菜单开 → 关菜单。

## 抽屉遮罩、触摸目标与控件遮挡

- **JS 和 CSS 必须用同一个手机判定串**。原来 JS 里散落着 6 处 `window.innerWidth < 768`，横版视口
  915×412 全部判成桌面，于是横版打开抽屉没有遮罩、侧滑不生效。现在统一走
  `isPhoneLayout()`，用的就是 CSS 那条 `PHONE_LAYOUT_QUERY`（见上一节）。
- **遮罩要有淡入**。`.overlay.active` 原来只有 `display:block`，横版下抽屉是滑出来的、黑幕是瞬间糊上来的，
  很突兀；补了 `overlay-fade 0.2s`。
- **控件遮挡靠量不靠猜**。播放控制条是 `position:absolute` 浮在视频区上的，手机竖版宫格的 `padding-bottom`
  原来写死 96px，横版写死 124px，而控制条实际高度随主题/换行变化，会把最后一行宫格压住半截。
  现在 `startControlsReserve()` 用 `ResizeObserver` 量 `.video-controls-overlay` 的真实高度，写成
  `<html>` 上的 `--controls-h`，宫格 padding 变成 `calc(var(--controls-h, 96px) + 6px)`。
  实测横版控制条 124px → 预留 130px，六宫格格子底边 282、控制条顶边 288，正好留 6px。
- **48dp 是硬指标**（Android 可点击目标下限，Material 3 也是 40dp 起）。手机分支里逐个抬：
  侧栏视频行 48、`#selectFolderBtn` 竖版 48/横版 40、`#dateFilter/#eventFilter` 竖版 44/横版 38、
  ⋮ 菜单行竖版 48 高、横版 44×44 图标格、`.control-btn` 40×40（图标 20）、`.view-btn` 最小高 40。
  横版视口只有 412 高，代价是 `#fileList` 从 249px 缩到 224px —— 这是正确取舍，点不中才是问题。
- ⋮ 菜单展开后高度要封顶：`max-height: calc(100dvh - 90px - var(--safe-top) - var(--safe-bottom))`
  加 `overflow-y:auto`，否则竖版 8 行 48px 会顶出屏幕。

## 深色 / 浅色主题

`localStorage.theme` 是三态：`auto`（默认）/ `light` / `dark`。`auto` 跟着系统的夜间模式走，
`prefers-color-scheme` 的 change 监听会立即重解析并应用 —— 手机上日落之后自动变深色，不需要重启 App；
`light`/`dark` 是用户硬选，系统再变也不动。主题按钮按 `auto → light → dark → auto` 循环，
图标 🌗 / ☀️ / 🌙，`title` 里带当前档位（`themeAuto/themeLight/themeDark`）。
注意旧包存的值是 `light`/`dark`，和新枚举兼容，不用迁移。

主题现在只有一个入口：`applyTheme(isDark)`。`loadTheme()`、主题开关、`prefers-color-scheme` 变化
监听全部走它，原来三处各自 `classList.toggle` + 各自设图标，改一处漏两处。它做四件事：

1. `body.dark-theme` 开关；
2. **`<html>` 的 `color-scheme`**（`color-scheme` 是继承属性，但根元素上 `:root{color-scheme:light}`
   写死后，`body.dark-theme{color-scheme:dark}` 永远够不到根，WebView 就按浅色画视口背景、
   滚动条和溢出回弹 —— 必须在 JS 里同步到 `documentElement`，CSS 那份只当首屏默认值）；
3. `TDashcamNative.setLightSystemBars(!isDark)`：`enableEdgeToEdge()` 只认**系统**夜间模式来定
   状态栏图标颜色，应用内主题跟系统不一致时图标会「白底白字」。所以两个主题分支的
   `themes.xml` / `values-night/themes.xml` 都把状态栏、导航栏设成透明，图标深浅由这条 JS→原生通道决定。
   实测四种组合都对：系统浅+应用浅/深、系统深+应用浅/深（`adb shell cmd uimode night yes|no` 切系统，
   `window.viewer.applyTheme(true|false)` 切应用，看状态栏图标和时间文字的反色）。
4. 主题图标。

弹窗配色原来是**硬编码深色 hex**，浅色主题下 `.modal-content` 是深底，于是有人加了
`body:not(.dark-theme) .clip-modal{background:rgba(255,255,255,.95)}` —— 面板变白、文字还是那条
`body:not(.dark-theme) .modal-content{color:#e6e8ef}` 逼出来的浅色，直接白底白字看不见（就是用户报的
「目录页面基本看不清楚」）。现在改成一组变量，两种主题各给一份值，不再靠 `body:not()` 打补丁：
`--modal-panel / --modal-panel-solid / --modal-panel-border / --modal-shadow / --modal-text /
--modal-text-strong / --modal-muted / --modal-field / --modal-field-border / --modal-chip /
--modal-chip-border / --modal-chip-hover / --modal-accent-soft / --modal-error`，
`.modal-content`、`.clip-modal`、`.file-path-modal`、`.file-path-input` 和全部 `.dir-*` 规则只读这些变量。

## 手机上的播放交互（放大 / 沉浸式）

三条都只在 `isAndroidRuntime()` 或 `isPhoneLayout()` 下生效，桌面端行为一律不变。

- **默认视图**：安卓上选中事件后默认进 **4 宫格**，不再是桌面那套 PIP（`legacy`）—— 手机屏幕上
  PIP 是四个邮票大的角标。用户手选过的宫格档位记在 `localStorage['tdashcam.layout']`，
  下一个事件沿用；只有 `switchCamera()` 会写它，点格子放大不算。
- **点格子放大（C1）**：`zoomCamera(camera)` 记住来路 `preZoomLayout`，`setCamera + setLayout('single')`，
  给 `<body>` 加 `camera-zoomed`；还原是格子右上角那个 ⤡ 按钮，**不是**再点一次画面 ——
  画面上的单击已经被「唤出控制条」占了，做成同一个手势会让人一点就丢掉了放大。
  从镜头切换器改视图时（`switchCamera`）放大态和 `camera-zoomed` 一起清掉。
- **声音：1.1.0 起彻底删掉了**。1.0.9 做过一个每格 🔇/🔊 的「单路出声」，实测能切、能记住，
  但用户直接指出**特斯拉行车记录仪的录像本身就没有音轨**，这个按钮永远只会切出静音，
  所以 `camera-audio-btn` / `toggleCameraAudio()` / `applyCameraAudio()` / `tdashcam.audioCamera`
  连同 CSS 一起删了，六路照旧 `muted = true`。**以后不要再往回加声音相关的 UI。**
- **沉浸式（C3）**（**1.1.6 已取消**，见下面那节；这一段留在这里是因为 `wakeOnlyTap` 的时序结论仍然有效）：
  控制条本来就播 3 秒自动收起，但手机上收起后没有 mousemove 再把它叫回来，
  而且顶栏一直占着。现在 `hideControls()` 顺带给 `<body>` 加 `immersive`，
  `body.immersive .main-header` 淡出（只动 `opacity/transform`，不动布局，
  免得把 `--controls-h` 量出来的宫格几何搞乱），格子上的 ⤡ 按钮跟着一起淡出并 `pointer-events: none`。
  隐藏状态下的单击**只**负责把控制条和顶栏叫回来，不再顺手放大 —— 否则「我想看看按钮」会变成
  「我被丢进一个镜头」。实现上这个判断**必须**做在 `playerArea` 的 `touchstart` 里（`wakeOnlyTap`
  标记，click 时 `consumeWakeOnlyTap()` 消费）：`VideoControls` 自己已经在 `touchstart` 上挂了
  `resetHideTimer()`，它排在同一元素后面的 click 之前就把 `immersive` 同步去掉了，
  所以在 click 回调里读 `body.classList` 永远是 false（实测顺序：`touchstart:IMMERSIVE`
  → `mousedown:shown` → `click:shown`）。
  三个不进沉浸式的例外：⋮ 菜单展开时（菜单本身就在顶栏里，淡出等于把用户正在点的东西变没）、
  暂停时、拖进度条时（后两条是原有守卫）。

1.0.9 在模拟器上的实测（`adb shell input tap` 真点击，不是 CDP `click()`）：竖版 4 宫格格子中心
(206,226)/(206,385)/(206,545)/(206,704)，物理像素 = CSS × 2.625。
放大 → `single` + `camera-zoomed`，⤡ 还原 → `grid4`；沉浸式生效时
`.main-header`/`.video-controls-overlay`/`.camera-zoom-out-btn` 的 `opacity` 全是 0、按钮
`pointer-events:none`。横版（915×412）四格各带一个 40×40 的按钮，最右一格右边缘留 11px，不压标签。

> 验沉浸式有个前提容易踩：**clip 播完会 `paused`，而 `hideControls()` 在暂停时直接 return**，
> 于是 `immersive` 永远不出现，看起来像功能坏了。fixture 的单段 clip 只有 18.27 秒，
> 所以要么先 `playEvent()` 再在 3 秒计时器到点后才动手，要么先确认 `video.paused === false`。
> 另外「wake-only 那一击」只在**控件已经隐藏**时成立：控件还亮着时点格子就是正常放大，
> 两次点击之间只要隔了 3 秒以上，第二次又会变成唤醒，别把它当成失灵。

## 手机端找片与权限引导（1.1.0）

- **搜索框 + 日期 chips（D1）**：抽屉里 `#quickFilters` 一行搜索框（`#eventSearch`）加一行日期 chip
  （`#dateChips`，每个有片的那天一枚，最多 8 枚 + 「全部日期」，横向可滑）。chip 点下去是**写回
  `#dateFilter`**，而且走 `flatpickr.setDate(date, false)` 而不是直接改 `value` —— 手改 value 会让
  日历内部还选中前一天，再打开日历就指错月份；点已经选中的那天等于取消。
  搜索匹配 `eventId / eventType / startTime / city / street`（`eventMatchesSearch()`），
  所以 `sentry`、`10-03` 这类都能命中；桌面端 `.quick-filters` 默认 `display: none`，只在手机媒体查询里打开。
- **权限横幅（D3）**：`readNativeStorageStatus().manage_external_storage === false` 时 `#permBanner` 显示，
  「去设置」调 `window.TDashcamNative.openStorageSettings()`；目录弹窗里的提示条上同一个按钮复用一份逻辑。
  Kotlin 侧先试 `ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION`（`package:` _uri），
  `ActivityNotFoundException`/`SecurityException` 就退到应用详情页 —— 模拟器实测直接落在
  「All files access」这一页，不用在五级菜单里找。
  轮询只在「未授权或状态还没到」时跑，一旦确认已授权就 `stopPermissionWatch()`，不留常驻定时器。
  整条链路能走通靠的是 `MainActivity.onWindowFocusChanged()` 会重新 push 权限状态：
  授权 → 按返回 → 1.5 秒内横幅消失，并且因为 `lastScannedPath` 还在、列表还是空的，
  自动重扫上次目录，不用重启 App。
- **加固定区之前先量竖向空间**（`devtools/probe-r10-layout.mjs` 把整份新 CSS + 新 markup 注进运行中的页面再量）：
  竖版 412×915 里原来 `.filters` 两个带 label 的下拉吃掉 155px、列表只剩 338px。
  压成一行（label 隐藏、靠 placeholder 表达）后 61px，加上新式搜索行 100px、横幅 56px，
  列表反而回到 494px。横幅一开始 107px，因为 `.perm-banner span` 用了 `flex: 1 1 auto`，
  它的假想宽度是整句话，flex-wrap 就把按钮甩到第二行；改成 `flex: 1 1 0; min-width: 0` 后是 56px。
  横版（412 高）里列表从 224px 变成 177px，接受的依据是：横幅只在「没授权」时出现，而那时列表本来就是空的。

1.1.0 在模拟器上的实测：`adb root` + `appops set … MANAGE_EXTERNAL_STORAGE deny` 后重启 App →
横幅出现、列表 0；真点击「去设置」→ `mCurrentFocus` 变成 `com.android.settings/.spa.SpaActivity`，
截图确认就是那页开关；在设置里真点击打开开关 → 按返回 → 横幅消失、`permWatch` 已停、
`eventGroups` 自己回到 7 条。chip 真点击 `10-06` → `#dateFilter=2026-10-06`、卡片 1 张、
`.clear-date-btn` 可见；再点一次 → 清空、7 张、`flatpickr-day.selected` 也是 0（说明日历同步上了）。
搜索框用 `adb shell input text sentry` 真键盘输入 → 2 张哨兵模式卡片；退格删空 → 回到 7 张。
删声音之后 `document.querySelectorAll('.camera-audio-btn').length === 0`、⤡ 6 个还在、
放大/还原/唤醒那一击全部照旧；中文字串（`搜索日期 / 类型 / 城市`、`全部日期`、`去设置`、`返回宫格`）
在切语言后立刻跟着变。

## 沉浸式下的菜单、跟随系统深色、版本号（1.1.1）

- **⋮ 菜单在播放时“没反应”**：根因是 C3 沉浸式那条 `body.immersive .main-header { pointer-events: none }`
  会**继承**到里面的每一个按钮，所以正在播放时那一击整个穿到画面上面去了（`elementFromPoint` 在 ⋮ 中心
  返回的是 `main-content`）。修法必须两处一起做：CSS 里把 `body.immersive .main-header button/a` 的
  `pointer-events` 放回 `auto`，JS 里在 `.main-header` 的 **capture** 阶段先 `showControls()` 再让按钮自己的
  handler 跑。只放开命中是不够的 —— 顶栏还是 `opacity: 0`，菜单会在一条透明的栏里展开，看起来仍然像死的。
  放在 header 层而不是 ⋮ 的 handler 里，是因为汉堡键、主题行、语言行同样会点到看不见的东西上。
  菜单收起时那层有 `visibility: hidden`，隐藏元素不参与命中测试，所以“可点”不会漏出幽灵按钮。
- **深浅色不跟系统**有两个独立原因，都得治：
  1. 早先那个两态开关把结果写进 `localStorage['theme']`，任何一次误触都会把 App 永久钉在浅色或深色。
     现在读 `localStorage['tdashcam.themeMode']`，老 key 一律不读（比“迁移并猜用户是不是故意的”便宜）。
  2. `AndroidManifest.xml` 的 `configChanges` 里有 `uiMode`，Activity 因此**不会**在系统翻深色时重建，
     WebView 自己的 `prefers-color-scheme` 在部分机型上就停在旧值。现在 `MainActivity.pushState()` 一起
     push `"night":<bool>`（直接读 `resources.configuration.uiMode`），并新增
     `onConfigurationChanged() { pushState() }`；JS 侧 `resolveThemeDark()` 在 `auto` 下优先信这个原生值，
     `window.__tdashcamNativeState` 钩子负责在每次 push 后重新 `applyTheme()`。手动选过浅/深色时仍然压过系统。
- **版本号**：WebView 里没有构建清单可读，所以 `MainActivity` 用
  `packageManager.getPackageInfo(packageName, 0).versionName` 一起 push，页面在抽屉底部
  “选择文件夹”下面显示 `v1.1.1`（`#appVersion`）。桌面端没有这条 push，取不到就整行 `display: none`，
  不留空行。
- **剩下的桌面残留**（这一批只挑“点下去没反应”和“看不见”的）：
  - 安卓隐藏 ✂ 剪辑入口（`setupAndroidPlayerChrome()` 里把 `clipBtn` 收掉）：它要 FFmpeg sidecar，
    而片段起止手柄只监听 `mousemove`，手指拖不动。
    （**1.1.9 已经翻回来**：原生导出引擎就位后 `setupAndroidPlayerChrome()` 检测到
    `TDashcamNative.startExport` 就把 `clipBtn` 恢复显示，手柄也补了 touch 路径，见下文两节。）
  - 进度条圆点原来只靠 `.progress-container:hover` 显形，触摸设备上永远 `opacity: 0` —— 加了
    `@media (hover: none)` 常显并放大到 18px。
  - `target="_blank"` 的 `<a>`（GitHub 行）和地图按钮在 WebView 里是静默空操作：wry 从不开第二个窗口，
    移动端也没打 opener 插件。现在统一走 `openExternalUrl()` → `NativeBridge.openExternal(url)`，
    Kotlin 只放行 http/https，其余直接丢弃；桌面分支一个字没改。
- **1.1.1 实测**（emulator-5554，`adb shell input tap` 真点击，物理 = CSS × 2.625）：竖版播放中
  `body.immersive` 生效、`.main-header` `opacity: 0`，真点击 ⋮（1003,202）→ `headerRight.active` 为真、
  `immersive` 已解除、`opacity` 回 1；横版（915×412）同样一击（2323,140）结果一致。菜单里的
  切换主题行（826,1026）真点击 → `tdashcam.themeMode` 由 `auto` 变 `light` 且菜单收起。
  造 legacy `theme=dark` 后用 `location.reload()` 重启页面 → `themeMode()` 仍是 `auto`、系统浅色时
  `body.dark-theme` 为假；`adb shell cmd uimode night yes` 在前台翻 → 约 1 秒内 `night:true`、
  `body.dark-theme` 真、`color-scheme: dark`；先手动选 `light` 再翻系统深色 → 保持浅色。
  Home 键切后台 → 翻系统深色 → 回到前台 → 主题跟上（走的是 `onWindowFocusChanged` 那条 push）。
  抽屉底部 `#appVersion` 在深浅两套里都显示 `v1.1.1`；`#clipBtn` 计算样式 `display: none`；
  `.progress-handle` `opacity: 1 / width: 18px`；真点击 GitHub 行 → `mCurrentFocus` 变成 `com.android.chrome`。
  放大/还原那一击回归照旧（格子 (541,1011) 两击 → `single-view` + `camera-zoomed`，⤡ (1014,338) → `grid4-view`）。
- **两个测试坑**：`adb shell am force-stop` 会丢掉还没落盘的 `localStorage` 写入（造 legacy 值要改用
  `location.reload()`）；而 JS 触发的 reload **不会**再走 `onWebViewCreate`，所以 `window.__tdashcamStorage`
  是空的、只能靠 `__tdashcam_storage` 那份缓存 —— 这刚好把“缓存为什么必须存在”验了一遍。

## 拇指区动作栏、长按菜单与真全屏（1.1.2）

- **B1 底部动作栏**（`#phoneActionBar`，body 级 `<nav>`，5 个 48dp 键：列表 / 文件夹 / 视图 / 刷新 / 更多）。
  占位方式是在手机媒体查询里给 `.main-content { padding-bottom: var(--action-h) }`，
  `--action-h` 由 `startControlsReserve()` 里那个 `ResizeObserver` 量出来贴到 `<html>` 上
  ——**没有**去改 `.video-controls-overlay` 的锚定，那样会把第八批的 `--controls-h` 宫格预留整套推翻。
  实测竖版 79px（48 内容 + 上下 3 + `--safe-bottom` 24）、横版 75px（44 + 6 + 24），`.main-content` 的
  padding 跟着等值。抽屉打开、⋮ 展开、长按菜单展开这三种状态下整条栏 `opacity:0 + translateY(14px) +
  pointer-events:none` 收掉，沉浸式下直接 `display:none` 并把 padding 归零。
- **汉堡键为什么会在手机上“复活”**：桌面那条 `body.sidebar-collapsed .open-sidebar-btn { display: inline-flex }`
  特异性是 0-2-1，压过手机块里 `.open-sidebar-btn{display:none}`（0-1-0）和 `.main-header .open-sidebar-btn`（0-2-0），
  而手机抽屉默认就是收起的 —— 顺序无关，纯粹是特异性。**修法是把选择器写成 `body.sidebar-collapsed .main-header .open-sidebar-btn`**
  （0-3-1）。同理，`#headerMenuBtn`（⋮）没有这条竞争，一次就盖掉了。
- **⋮ 面板改由「更多」驱动，但 markup 一个字没搬**：它仍然住在 `#headerRight` 里，因为 `hideControls()` 的
  “菜单开着就别隐藏”判断、`closeTopLayer()`、`phoneLayerCount()`（预测式返回）全都认这个容器；
  只把 CSS 重锚成 `position: fixed; bottom: calc(var(--action-h) + 8px + var(--safe-bottom))`。
  代价是 bar 的 click handler 里那句 `e.stopPropagation()`（不加的话“点开它的那一击”会被全局收起器吃掉）
  顺带让**点别的 tab 也收不起菜单**，所以非 `more` 的 action 要显式把 `active` 摘掉。
- **B3 长按事件卡片**（`attachCardLongPress` → `showCardContextMenu`）：`touchstart` 起 500ms 计时器，
  `touchmove` 位移 >12px 取消，非手机布局、`.city-link`（“全部日期”那类链接）直接跳过。
  长按之后 Android 仍会补发一个 `click`，遮罩又是 `::after`（`elementFromPoint` 报的是 `<body>`），
  所以靠 `suppressCardClickUntil = Date.now()+1000` 这一个时间戳**同时**挡卡片点击和文档级收起。
  四个动作：播放事件 / 单路全屏（`zoomCamera(activeCamera)`，不是写死 front）/ 显示路径 / 元数据
  （`metadataManager.setCollapsed(false)`）；除“显示路径”外都会先 `playEvent` 把这条切进来。
- **A1 播放时常亮**：`NativeBridge.setKeepScreenOn(playing)` → `window.addFlags(FLAG_KEEP_SCREEN_ON)`。
  选它而不是 WakeLock：随窗口可见性自动释放、不要权限。验证别看 `dumpsys power`，看
  `dumpsys window windows` 里应用那一段的 **`fl=` 行**（打印的是符号名 `KEEP_SCREEN_ON`，没有 `flgs=` 这种写法）。
- **A2 真全屏**：`setFullscreen(immersive)` → `WindowInsetsControllerCompat` + `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`
  + `hide(systemBars())`。三个坑连在一起才成立：
  1. edge-to-edge 窗口**不会**因为栏被藏而重新布局，于是没有 inset 回调，`--safe-top` 停在旧值 ——
     `applyFullscreen()` 结尾要 `ViewCompat.requestApplyInsets(window.decorView)`；
  2. `insets.getInsets(systemBars())` 对**已经藏掉的栏仍然返回原高度**，只有 `isVisible(Type.statusBars())`
     会说真话，所以 `applyInsets()` 现在按可见性决定 top/bottom；
  3. 隐藏那一边不能再写 `max(env(safe-area-inset-top,0px), 0px)` —— Chromium 自己的 `env()` 还是 52px，
     会把 0 顶回去，必须直接写死 `0px`。
  实测沉浸式下 `--safe-top: 0px`、`playerArea` 竖版 `y=0 h=915`、横版 `y=0 h=412`（正好铺满），
  `dumpsys window` 里 `type=statusBars ... visible=false`；退出沉浸式（唤回控件那一击）后 `visible=true`、
  `--safe-top` 回 `max(52px, 51.8px)`。首次进入系统会弹一次「Viewing full screen / Got it」，这是
  transient-bars 行为的标准确认框，不是我们的 UI。
- **淡出的顶栏仍占 45px**：`body.immersive .main-header` 原来只有 `opacity:0`，栏还在流里，画面上方留一条黑带。
  现在给它 `position:absolute`（手机媒体查询内，桌面不受影响），画面拿回那 45px；同时把
  `body.immersive .main-header button` 的 `pointer-events` 从 1.1.1 的 `auto` 改回 `none` ——
  那是为 ⋮ 放的，如今 ⋮ 在底部栏里，顶栏只剩一个事件名按钮，藏形的按钮只会偷走“唤回控件”那一击。
- **`--action-h` 会停在启动时量到的旧值**：原生那几次 `pushState` 之前 `--safe-bottom` 还是 0，栏只有 55px，
  随后它靠 `<html>` 上的内联变量长到 79px，`ResizeObserver` 却没再报（横竖切换时倒是会报）。
  现在 `window.__tdashcamNativeState`（每次原生 push 都会调）里补一次 `publishControlReserve()`，
  并加了 `window.addEventListener('resize', publish)`。
- **刷新键**走 `rescanCurrentFolder()` → `loadTauriDirectory(lastScannedPath)`，弹一条「找到 N 个事件」。
  它和“重新选文件夹”是同一条路，因此会经过 `cleanupOldData()` 把 `currentEvent` 清空 ——
  正在看的那条会退回空态，需要再点一次卡片。这是已知取舍，不是 bug。
- **1.1.2 实测**（emulator-5554，真点击物理 = CSS × 2.625）：`probe-r12.mjs` 一把出全部数值 ——
  栏 `flex / y=836 h=79`、5 个键各 `78×48`、`--action-h` 与 `.main-content` padding 相等；
  顶栏 `#headerEventName` 显示 `TDashcam Studio`，播放后变 `🤖 哨兵模式 10-07 03-12`，
  `#openSidebarBtn` 与 `#headerMenuBtn` 均 `display:none`。真点击各键：列表 → 抽屉开 + 遮罩 active + 栏 opacity 0；
  文件夹 → `#androidDirModal.show`；视图 → 4 宫格→6 宫格→大小窗 循环、标签同步、写 `tdashcam.layout`；
  刷新 → toast「找到 7 个事件」；更多 → `headerRight.active`、面板 `fixed` 落在 `y=397 h=408`，
  再点视图/刷新会把它收起，菜单里「切换主题」真点击 → `themeMode=light`、`color-scheme:light`、面板自动收。
  长按（`input swipe x y x y 1000`）→ 菜单 `show` + `body.context-open`、标题 `🤖 哨兵模式 2026-10-07 03-12-00`、
  **没有误起播**（`currentEvent` 仍为 null）；显示路径 → `#filePathModal` + 已复制；单路全屏 → `camera-zoomed`；
  元数据 → 面板摘掉 `collapsed`；播放事件 → 起播 + 抽屉自动收。深浅两套配色、横竖两套断言都过；
  回归项 ⤢/、搜索框（40px）+ 8 个日期 chips、`v1.1.2` 均在。
- **这一轮新增的测试坑**：
  - 探针文件只能 `node devtools/cdp-eval.mjs --file devtools/probe-r12.mjs`，直接 `node probe-r12.mjs` 会
    `window is not defined`（它是页面里求值的脚本，不是 Node 模块）。
  - 抽屉打开时底部栏是 `pointer-events:none`，那一区的点击会**穿到抽屉底部的「选择文件夹」按钮**上，
    弹出一个盖住一切的目录窗格 —— 测“列表键开抽屉”之前先确认抽屉本来就是关的。
  - 上下文菜单项的 y 会随标题换行整体下移（元数据从 773 跑到 797），固定坐标点空；每次都现量 rect 再点。
  - clip 只有 18 秒，`playing` 变 false 之后 `immersive` 一定跟着退出，量到的 `--safe-top` 是恢复后的值。

## 抽屉对齐与玻璃底栏（1.1.3）

- 抽屉宽度 `min(78vw, 312px)`，固定区统一挂 `--gutter` / `--field-h` 两个变量（竖屏 14/44，横屏 10/38），
  控件不再各写各的高度；事件列表改成单列行卡（缩略图 96×54 + 时间/类型两行）。
- 底部动作栏改成**悬浮玻璃胶囊**（26px 圆角、`blur(22px) saturate(1.8)`，只在 `@supports` 下开
  `backdrop-filter`，`--glass-bg` 有不透明兜底），5 个 tab 换成线性 SVG 图标。
- 元数据条贴在播放控件上方，高度折进 `--controls-h`，不再压在画面上。
- 抓帧改 JPEG(0.9) + 长边 1280 封顶：PNG 在模拟器上要 8~10 秒，看着像按钮坏了；现在约 1.3 秒，
  写完让原生 `MediaScannerConnection.scanFile` 扫一次，否则系统相册看不到。

## 满铺底图与一批偏好记忆（1.1.4）

- 还没导入目录时，空状态大图会**一直铺到悬浮底栏下面**（`.main-content:has(.player-area.empty){padding-bottom:0}`），
  胶囊不再半截落在空白页背景上；搜索框上方那条横线（`.filters` 的 `border-bottom`）已去掉。
- ⋮ 面板和长按菜单里的图标全部换成与底栏同一套内联 SVG（原来是 emoji，深浅色下发虚且粗细不一）。
- **收藏**：长按卡片 → 「收藏」，卡片缩略图左上角出现星标；⋮ 里的「只看已收藏」一键过滤。
  存的是 `eventId`（相对路径），换目录、重新扫描都不会丢。
- **排序**：⋮ 里「最新优先 / 最早优先」切换，事件列表和日期 chips 一起翻转，扫描结果不重算。
- **倍速**：选定的倍速跨事件、跨重启保留（只认 0.5/1/1.5/2 这四档，和面板按钮一一对应）。
- **左右滑动切事件**：在画面上横向滑动即可跳到上一个/下一个事件，到边界会给 toast 提示；
  起点距屏幕左边小于 34px 不触发（那是系统返回手势区）。
- 无障碍：tab 有 `aria-label`，⋮ 面板维护 `aria-expanded`，过滤/开关类按钮有 `aria-pressed`，
  toast 是 `role="status" aria-live="polite"`，键盘焦点有描边，抽屉收起时侧栏 `aria-hidden` + `inert`。
- 验证记录（模拟器 412×915，深/浅 × 竖/横）：`filtersBorderBottom:"0px"`；1.5x 跨事件与重启后仍是
  `1.5x` 且面板高亮正确；收藏 2 个事件后列表 4→2；滑动 09-29→10-03→10-05→10-06 后被边界拦下；
  深色下主题仍随 `cmd uimode night` 实时切换。

## 实机崩溃与一批排版账（1.1.5）

小米 14 的截图里那三处「显示/排版 bug」最后指向**同一个元凶**，先说它：

- `startControlsReserve()` 用 `occupied = rect.height + (innerHeight - rect.bottom)` 量底栏占了多高，
  发布成 `--action-h`。沉浸式是用 `display:none` 收起底栏的，此时 rect 全是 0，
  `innerHeight - 0` 等于**整屏高**（915px），而 `if (occupied > 0)` 又让这个值只会被写坏、不会被改回来。
  凡是按 `--action-h` 定尺寸的面板一起遭殃：⋮ 面板的 `max-height` 被算成 0（只剩 9px 边框），
  详细数据面板被切成 18px 一条 —— 正是截图里那两块。现在 rect 高度为 0 就发布 0。
- 崩溃 `Cannot read properties of undefined (reading 'toFixed')`：`updateStatsDisplay()` 里
  加速度只判了 X 就同时格式化 Y/Z，有些帧只带 X（CSV 导出对这几列的缺失本来就是容忍的）。
  改成三轴齐全才打印，否则 `--`。
- 错误横幅现在带来源位置（`… @ script.js:2397:29`）。手机上没法挂调试器，一张截图就该能定位到行。
- 竖屏宫格的黑边：格子是百分比高度 + 画面 `object-fit: contain`，16:9 的画面只占格子的一半。
  改成让格子自己按 `aspect-ratio: 16/9` 定高（`height:auto`）。实测四宫格 195×110、
  六宫格同尺寸 2×3、大小窗主画面 396×223 + 三路 195×110，底边 518/576/462 都在 HUD 顶之上。
  代价：竖屏要四路同屏就只能 2 列，单路宽度封顶 195；想大就点格子进单路。
- ⋮ 菜单被「行车数据」胶囊盖住：不是 z-index 写错，是 `.main-header` 自己的 `z-index:50` 把整棵子树
  封在了一个层叠上下文里。`:has(.header-right.active)` 时把 header 抬到 1200，只在手机的媒体查询里生效。
- 详细数据面板：浅色主题补了文字色（label `#5c626b` / value `#14161a`，四个高亮色也压暗），
  `top` 从桌面量来的 60px 改成 `calc(var(--safe-top) + 58px)`，不再盖住事件标题。
- 横屏宫格被挤成细条（915×412：header 73 + `padding-top` 40 + 控件 124 + 元数据条 53 + 底栏 91，
  四路只剩 224×25）。横屏宫格 `padding-top` 收到 8px，多路布局隐藏底部元数据条（单路保留），
  六宫格改成单行按路数平分。实测 grid4 224×98、grid 148×98、底边 179 < 控件顶 197。
  配套两处 JS：`publish()` 用 `offsetParent === null` 认出没在渲染的面板，`updateLayout()` 结尾主动
  重测一次 —— `display:none` 不会叫醒 ResizeObserver。
- 验证记录（模拟器 412×915 / 915×412，装的是本轮 1.1.5）：缺 Y/Z 的帧 `threw:null` 且显示 `--`，
  三轴齐全显示 `X:1.00 Y:2.00 Z:3.00`；⋮ 面板 `175x644@133`、13 行全部可见、末行 `elementFromPoint`
  命中面板内；详细数据 `392x233@110`（顶栏底 97）；进入沉浸式后 `--action-h` 读作 `0px`（改前 915px）。

## 首屏即列表、取消自动全屏、横屏 HUD 变小卡（1.1.6）

> **1.1.7 已回退其中「首屏即列表」一条**（用户觉得不好看），下面那节记的是回退后的状态；
> 取消自动全屏与横屏 HUD 两条保留。这一节留着是因为 `--action-h` 那条 ResizeObserver 的坑仍然有效。

三条反馈：「播放几秒后变全屏，点一下又回来」「汉堡菜单用处不大，能不能直接放首页」「横屏速度 HUD
在画面中下部一个长条，难看」。

- **自动全屏的根因**：`hideControls()` 除了收起控制层，还顺手写了 `body.immersive`，而那条类名会
  把顶栏淡出、并把原生 `setFullscreen` 叫起来藏系统栏 —— 于是「播 3 秒 → 整页变全屏 → 下一击又变回来」，
  画面在手指底下反复改尺寸。现在 `hideControls()` 只淡控制层 + 藏光标，`body.immersive` 的 JS/CSS
  全部删干净（`.main-header` 的淡出规则、`body.immersive .phone-action-bar{display:none}` 等）。
  Kotlin 那边的 `setFullscreen` 桥**留着没删**，只是再没人调用 —— 那套 insets 管线同时喂着 `--safe-top`，
  不值得为死代码去赌它。
  「点一下先唤醒控件、不要顺手放大」的判据从 `wasImmersive` 换成控件层有没有 `show`：
  `touchstart` 里记 `wakeOnlyTap = !overlay.classList.contains('show')`，这个监听器注册在 `resetTimer`
  之前，所以看到的仍是点击前的状态。
- **首屏 = 事件列表**：不再新增状态，直接复用 `#playerArea.empty`（只有 `playEvent()` 会摘掉它）。
  `updatePhoneHomeMode()` 在开机、`handleResize()`、`playEvent()` 三处把它翻成 `body.phone-list-home`，
  CSS 里侧栏 `width:100%; transform:none`、遮罩 `display:none`、汉堡按钮收掉，`toggleSidebar(force)`
  在首屏强制按「开」处理（否则收起 = 回到一个空白播放器）。返回键的层栈 `phoneLayerCount()` 在首屏
  不计侧栏，所以首屏按返回是**退出应用**，不是白按一次收起抽屉。
  竖屏保留底部栏（它是 刷新 和 ⋮（排序/收藏/诊断）的唯一入口），横屏 412px 高付不起这份钱，隐藏。
  实测（1.1.6 装到模拟器）：竖屏 `sidebar 412x823@0,0`、`list 412x430@0,313`、`footer` 完整在栏上方、
  底栏 `opacity=1` 可点、`inert=false`、`layers=0`；横屏 `sidebar 915x412`（`bottom=0`）、`list 136` 高、
  底栏 `opacity=0 pointer-events:none`。真点击验收：首屏点 刷新 → toast「找到 7 个事件」且仍是首屏；
  长按卡片 → `context-open` + 菜单 `392x293@10,513`、6 项全在；返回关掉菜单回到首屏、再返回退出应用。
- **首屏收起的时机**（验收时抓到的）：`updatePhoneHomeMode()` 原本挂在 `playEvent()` 末尾，而它前面是
  `await playAll()` —— 自动播放被拒或加载卡住时就永远收不了，抽屉盖在已经出来的播放器上。改成紧跟
  `playerArea.classList.remove('empty')` 之后做，「有东西可看」和「列表让位」同步发生。
  真点击后：`body="sidebar-collapsed"`、`home=false`、六路 `▶`。
- **底栏占位会滞后**：首屏侧栏原本写 `bottom: var(--action-h)`，实测读作 `77px` 而真值是 `91px`
  （差 14px 正好压掉 footer 里版本号那一行）。原因是 `--action-h` 从底栏 rect 量出来，而 ResizeObserver
  **只看尺寸不看位置** —— 系统的 `env(safe-area-inset-bottom)` 在开机后才到位，底栏往上滑但没变尺寸，
  于是没人重测。首屏这条改成纯 CSS：`bottom: calc(68px + var(--safe-bottom))`（胶囊 = 10px 底距 + 58px 高），
  量不到的那 14px 从此不可能出现。改后侧栏底 823、底栏顶 824，严丝合缝。
- **横屏 HUD**：`MetadataManager` 在拿到元数据时会自己 `setCollapsed(false)`，而手机样式里它是贴在控件条
  上方的一条通栏 —— 915×412 上就成了「画面中下部的长条」。现在横屏（`(orientation:landscape) and
  (max-height:620px) and (max-width:1200px)`）把它改成左上角圆角小卡：`top:8px; left:8px; width:auto;
  max-width:62%`，只留仪表盘那一行（`.metadata-secondary` 在横屏隐藏）。选左上不选右上：右上角是
  单路「⤡ 还原」按钮的地盘，而左边的黑边常常正好把卡片托住不挡画面。
  `startControlsReserve()` 里加同一条媒体查询判断，横屏卡片不再往 `--controls-h` 里塞高度。
  实测单路播放时 `panel 201x70@8,81`、`dashboard 167x48`、`--controls-h: 124px`（改前多约 65px），
  卡片右边界 209 < 画面左边界 237，**盖在左黑边上、不遮画面**。多路（grid4）时横屏仍按 1.1.5 的规则
  整条隐藏，所以四宫格不会多出任何东西。
- 诊断信息加了一行 `controls=… home=… layers=…`，「又全屏了/抽屉回不来」这类问题一张截图就能判。
- 探针：`devtools/probe-r16-home.mjs`（首屏结构 + 命中测试）、`probe-r16-play.mjs`（淡出与 chrome）、
  `probe-r16-hud.mjs`（横屏卡片与画面重叠）。注意 `probe-r16.mjs` 是**注入当前 styles.css** 用的，
  1.1.6 之后 CSS 已经打进包里，量同一件事请用上面三个只读的探针。

## 回退首屏列表 + 行车数据卡片挪进黑边（1.1.7）

- **首屏即列表撤了**：用户原话「还是回到之前汉堡菜单的设计吧，目前打开APP就看到列表的设计不好看」。
  `phone-list-home` 这套状态（JS 的两个方法、三处调用、四段 CSS）整块删干净，开机回到
  `if (isPhoneLayout()) this.toggleSidebar(false)`。**1.1.6 另外两条不回退**：自动全屏仍然是取消状态，
  横屏 HUD 仍然是卡片。诊断信息里 `home=` 换成 `drawer=closed|open`。
- **行车数据卡片**：1.1.6 的横屏卡片 `max-width:62%`（≈567px）在真机带元数据时几乎铺满画面，
  竖屏那条又是靠 `--controls-h` 预留高度顶出来的，两边都在吃视频。现在：
  - 横屏 `top:8px; right:8px; width:max-content; max-width:24%` —— 卡片落在画面**右侧的黑边**里
    （915×412 上右边黑边从 x=678 开始，卡片占 707..908），`body.camera-zoomed` 时 `top:46px` 让开
    右上角的 还原 按钮。
  - 竖屏/横屏都不再预留：`startControlsReserve()` 里 `metaH` 那一段连同 `landscapeHud` 判断一起删掉，
    `--controls-h` 只等于控制层高度，卡片改回浮在控制层上方的黑边里（竖屏单路：画面带 y 344..576，
    卡片 630..690）。`MetadataManager.setCollapsed()` 里那句 `publishControlReserve()` 也随之删掉 ——
    开合卡片不再改变画面大小。
  - 为什么竖屏敢浮起来：格子/画面一律 `object-fit: contain` 且按 16:9 定高，412 宽的竖屏画面只有
    232 高，而 `.player-area` 有 727 高，底部本来就是一大片黑边，预留高度等于白白缩小画面。

## 竖屏倍速菜单被行车数据卡片盖住（1.1.8）

- 用户原话「竖屏下，视频倍速按钮显示有误，检查一下」。实测是**两个独立缺陷叠在同一个位置**：
  - **被卡片盖住**：`.video-controls-overlay` 是 `z-index:40` 且自己就是层叠上下文，
    `.metadata-panel` 是 `.player-area` 里的 `z-index:100`。所以在菜单内部无论把 z 抬到多高都没用——
    整个 overlay 才是被比下去的那一层。现在用 `:has()` 只在菜单打开时抬：
    `.video-controls-overlay:has(.speed-control.active){z-index:130}`。
  - **右侧溢出 3px**：倍速按钮是控制行最后一个，`.speed-options` 以按钮为中心居中展开，
    右边一定丢到屏幕外。改成贴按钮右边缘（`left:auto; right:0; transform:none`），
    并把行高从窄屏默认的 <40dp 抬到 `padding:12px 18px; font-size:15px`（实测 46px 一行）。
  - 竖屏菜单 `84×193 @ (318,553)`、四行全部 `elementFromPoint` 命中自己；横屏 `84×193 @ (821,2)`。
- 只改了三条 CSS，全在手机媒体查询里，桌面端一行未动。
- 探针：`devtools/probe-r18-speed.mjs`（注入当前 styles.css 后量按钮/菜单矩形、
  `offRightEdge`、`overlayZWhileOpen`、逐行 `elementFromPoint` 命中并给 verdict；
  传 `landscape` 参数量横屏）。

## 原生导出：多路合成 + 触摸剪辑（1.1.9）

- 用户原话「还是需要视频剪辑和导出功能，导出可以任意几路视屏组合或者单独导出。分辨率可选」，
  并在三条路线里选了**原生 Kotlin MediaCodec**（另一条被否的是 WebView canvas+MediaRecorder，
  实测模拟器只有 ~17fps；打包 FFmpeg 则要把 40MB 级二进制塞进 APK）。范围 UI 选了「两种都要」：
  mm:ss 输入框 **+** 桌面同款可拖手柄。
- 引擎在 `src-tauri/gen/android/app/src/main/java/com/tdashcam/studio/export/`：
  `ExportEngine`（编排）+ `CameraStream`（每路一个 MediaExtractor/MediaCodec 解码）+ GL 合成到
  编码器输入面 + MediaMuxer 封装。JS 侧只描述任务：
  `TDashcamNative.startExport(json)`，进度从 `window.__tdashcamExportProgress(payload)` 回推
  （`phase: preparing|encoding|done|cancelled|error`）。
  请求体：`{id,outPath,width,height,fps,durationUs,rows,cols,cameras:[{camera,cell,
  segments:[{path,clipStartUs,clipEndUs,globalStartUs}]}]}`，clip 时间是**文件内**微秒、
  globalStart 是**输出内**微秒 —— 跨 1 分钟片段就靠这个列表拼接。
- **为什么必须走原生**：`write_binary_file` 是把字节当 JSON 数组序列化的，几 MB 级文件根本不可用；
  页面也没有同时解六路的能力。所以大文件必须由 Kotlin 直接落盘。
- 取消会**保留已写入的部分**（`r20-cancel.mp4` 415KB / 7.33s 可正常播放），这是有意的：
  手机上跑到一半反悔不该什么都没留下。
- 剪辑手柄原本只认 `mousemove`，手机上完全拖不动。改成 pointer/touch 双路之后又发现：
  **安卓系统返回手势吃掉屏幕左右各 ~24dp**，0% 和 100% 那两个手柄正好落在里面，
  一拖就被当成返回，App 直接退出（logcat：`[Gesture Monitor] edge-swipe is stealing input gesture`）。
  修法是给 `.progress-container` 在手机上加 `margin-inline:26px`，把整条轨道挪进安全区。
- 面板是底部抽屉（`.phone-export-sheet`），复用 `.modal-overlay.show`，所以返回键和
  `phoneLayerCount()` 天然管得到它。三处坑：
  - **`--field-h` 声明在 `.sidebar` 上**，抽屉之外的元素一律读不到，面板里所有控件静默退回
    `height:auto`、渲染成 18px 高。现在在 `.phone-export-panel` 上自己声明一份（竖 44 / 横 38）。
  - **软键盘只能从原生看见**：edge-to-edge 下窗口不为 IME 调整尺寸，而这个 WebView 的
    `visualViewport.height` 在键盘弹起时**仍然等于 `innerHeight`**（实测 412/412、915/915），
    所以 JS 侧任何"视口被吃掉多少"的算法都是 0。改成 `MainActivity.applyInsets()` 把
    `WindowInsetsCompat.Type.ime()` 的 bottom 一起 push 成 `--kb-h`（实测竖屏 292.2px、横屏 220.2px）。
    面板的底部留白取 `max(底栏+安全区, 键盘)`，**不是两者相加** —— 键盘本来就盖在底栏上。
  - **Chromium 聚焦时滚的是 document，不是这个内部滚动容器**，横屏键盘弹起时正在编辑的那一行
    会掉到折叠线以下（实测 `panelBottom:184`、输入框 `bottom:262`）。`focusin` 里自己把
    `panel.scrollTop` 补上，并且**再补一次**（原生 inset 比 focus 晚到，面板会二次变矮）。
  - 横屏有键盘时面板只剩 168px 高，所以时间行两侧各给了 ±1s 步进键（40×44），
    不弹键盘也能定范围。
- 实测（模拟器，全部真点击）：2 路 1×2 480×532、范围 00:02→00:10 → 249 帧 →
  `TDashcam_2026-09-29_12-30-00_2c_480x532.mp4` 275,933B，回读 `videoWidth/Height=480×532`、
  `duration=8.3s`，两个格子取样的平均亮度 65 / 19（空格子会是 0）。
  3 路 648×480 与 6 路 480×710 的完整/取消两条路也验过。
- 探针：`devtools/probe-r21-sheet.mjs`（把 styles.css + index.html 里的面板 markup 一起热注入后量几何）、
  `devtools/probe-r21-lift.mjs`（键盘抬起后的 padding/矩形）、`devtools/probe-r21-playback.mjs`
  （用 App 自己的 127.0.0.1 流服务回读导出文件并按格子采样亮度）、`devtools/tap-to.mjs <selector>`
  （按 CSS 坐标真点击）。
  **注意 `seeked` 事件在这台 WebView 上早于真正解出帧**，`drawImage` 会得到全黑画布，
  看着像"格子里没画面"；改成 `play()` 跑 1.2 秒再 `pause()` 才可信。

## 详细数据卡片不压画面 + 导出按每路算分辨率（1.2.0）

用户原话三条：「点击"详细数据"，弹出的卡片对画面有遮挡，之前提过，没有改到，特别是横屏的时候」
「（右下角的）倍速的按钮被视频进度条遮挡」「导出视频，如果超过 3 个视角，分辨率会下降，这个要改一下」。
桌面端一行未动，全部改动都在手机媒体查询里。

### 详细数据卡片

- 之前为什么"改了没改到"：手机规则给卡片 `left:10; right:10; max-width:none`，它就是一条通栏横幅，
  十行"标签—数值"竖排下来正好和画面一样高，落在哪儿都盖住路。
- 现在三件事一起做：
  - **折成小卡**：竖屏 `grid-template-columns: auto auto`（两列五行）、横屏五列，
    `width: max-content` + `max-width: 62%`（横屏 56%），竖屏字号 10px、横屏 9px。
    用 `width` 而不是 `left+right` 还顺带修好了拖动 —— 过约束的盒子会忽略拖出来的 `left`。
  - **位置现算**：`placeStatsOverlay()` 取 `#playerArea` 里所有 `<video>` 的矩形求画面上下边界，
    下面有空档就贴画面下沿；没有就按 `object-fit: contain` 求出**真正的画面盒**（元素矩形在竖屏素材下
    比画面宽得多），把「贴顶 / 贴底 / 每格上沿之上 / 每格下沿之下（带与不带 6px 间隙各一档）」当成候选，
    逐档算与画面像素的重叠面积取最小 —— 横屏不再只能硬贴屏幕顶。`ResizeObserver` 负责在变化后重贴。
  - **横屏为什么这次能干净**：画面行 82..191、控制层紧贴 197 起，竖排两列的卡片 97px 高，横屏上方只剩
    不到 50px 的空档，塞不下 —— 所以是「压 19px」而不是「不压」。改成**五列** + 9px + 收紧 header
    （去 margin、去下边框、`row-gap:0`）后卡片 46px 高（十行数值全换成最长的一档也只有 305×46），
    正好落进 32..78 的空档。
  - **`--safe-top` 不能 `parseFloat`**：它是裸的 `max(0px, 28.2px)` 字符串，`parseFloat` 得到 NaN，
    `|| 0` 之后上界恒等于 4 —— 于是横屏卡片被允许塞进状态栏底下（时钟/电量那一行）。现在改用
    `measureSafeTop()`：量一个 `height:var(--safe-top)` 的隐藏探针，让布局自己回答（横屏实测 28、竖屏 52）。
  - 重复的那份 `.metadata-panel`（1.1.x 的底部抽屉）在卡片打开时 `display:none`，不再叠两层。
- **一个静默失效，也是"改了没生效"的真凶**：`placeStatsOverlay()` 读的是 `this.dom.playerArea`，
  而 `MetadataManager.dom` 里**根本没有这一项**（`playerArea` 是 viewer 的 dom，见 `script.js:7843`），
  于是第一次调用就抛 `Cannot read properties of undefined (reading 'getBoundingClientRect')`
  —— E23 的错误横幅正好把它打在屏幕上。卡片于是永远停在 CSS 的 `top: calc(--safe-top + 58px)`，
  看上去就是"改了没生效"。现在在 `MetadataManager.dom` 里补 `playerArea: document.getElementById('playerArea')`。
  **教训：热注入探针只能验 CSS 和"能自己跑一遍的算法"，镜像探针照样算出 0%，装了包的 WebView 里却是错的。
  手机上的 JS 定位必须以装包后真点击为准。**
- **第二个只出现在装包后的坑**：`ResizeObserver` 原来只盯 `playerArea` 和卡片本身，而**换宫格布局既不
  改 `playerArea` 的尺寸也不改卡片的尺寸**（只改它孩子的尺寸），于是卡片停在上一个布局算出的位置上 ——
  竖屏从四宫格切到六宫格实测压住某格 48%（整体 8%）。手动再调一次 `placeStatsOverlay()` 立刻回到 0%，
  证明缺陷只是"没人再叫它"。现在把 `playerArea` 里的每个 `<video>` 也 observe（换布局复用同一批
  video 元素，实测 6 个全部同一实例，所以不用挂 MutationObserver）。
- 实测（模拟器 412×915 / 915×412，装包后真点击：⋮ 菜单 → 详细数据，卡片十行数值全换成最长的一档
  `37.7771, -122.4196` / `NOA 激活 · 车道保持` / `108.4 km/h  999` 是另一组压力测试）：
  - 竖屏（这份 fixture 无遥测，卡片实测 174×111）四宫格 / 六宫格 / 大小窗：`coveredPct 0`，
    卡片整块落在画面外的黑边里（四宫格贴画面下沿 y=514，六宫格 y=572，大小窗 y=563）——
    **每次换宫格都重贴**，这正是 1.2.0 补 observe `<video>` 之后才在装包的包里有的一项。
  - 横屏（五列小卡 305×46）四宫格 / 六宫格 / 大小窗：`coveredPct 0`，卡片落在 32..78，
    画面行 82 起，`measureSafeTop()` 在这里返回 28。
  - 压力测试（人为把十行都换成最长档 → 256×179）竖屏六宫格退化到 **1.2%**：第一行格子上沿 220，
    要完全避开需要 `top ≤ 220-179-6 = 35`，而安全区下沿是 56 —— 塞不下，取重叠最小的一档。
    这是设计上的退化，不是回归。
  - 用户拖过的位置不再重贴；只有旋转后卡片跑到屏幕外时才丢掉拖拽位置、重新贴边。

### 倍速菜单被进度条盖住

- `.speed-options` 是 `position:absolute` 且**没有 z-index**，而进度条的轨道 / 已播条 / 剪辑手柄在
  **同一个层叠上下文**里带 z-index 1/2/5 —— 正数压 auto，跟 DOM 顺序无关。补 `z-index:10`。
  （1.1.8 抬的 `.video-controls-overlay:has(.speed-control.active){z-index:130}` 治的是"被行车数据
  卡片盖住"，那是另一层，两者不是同一个缺陷。）
- **还有一层没治到**：详细数据卡片是 `position:fixed; z-index:1500`，而 1.1.8 那条只把控制层抬到 130 ——
  卡片开着时倍速菜单被**卡片**盖住。竖屏实测菜单 84×193 @ (318,553)，卡片 174×111 @ (229,572) 正好压在
  它身上，四行里只有最后一行 `0.5x` 命中自己，`2.0x/1.5x/1.0x` 三行点下去命中的是
  `stats-header / stats-row / stats-overlay`。横屏同理（卡片 602..907 × 32..78，菜单 821..905 × 52..245）。
  抬到 **1600**（只在选择器开着时抬，`.video-controls-overlay:has(.speed-control.active)`）——
  注意**抬 `.speed-options` 自己没用**：`.video-controls-overlay` 带 z-index 就是一个层叠上下文，
  孩子再高也出不去。
- 实测竖屏：菜单 84×193 @ (318,553)，`offRight -10`（不再溢出屏幕），四行 `elementFromPoint`
  全部命中自己，进度条顶边 723 落在菜单区间内也不再压它；**卡片同时开着**仍是四行命中自己，
  点 `2.0x` 真的把 `video.playbackRate` 改成 2、按钮文案变 `2x`。
- 实测横屏（装包后真点击）：菜单 84×193 @ (821,52)，`offRight -10`，四行 2.0x/1.5x/1.0x/0.5x
  全部命中自己；进度条顶边 224 落在菜单 52..245 之内，仍然压不住它。
- **竖屏的倍速按钮要点两次**：第一次被"显示控制层"吃掉（`.speed-control` 那时 `visibility:hidden`），
  第二次才真正打开菜单；`#speedControl` 本身 `z-index:auto`，可点的是里面的 `#speedBtn`。
  另外 1.2.0 之前的"实测竖屏"记录其实是在横屏量的 —— 探针里 `vw` 一直是 915。

### 多路导出：预设名 = 每一路的短边

- "超过 3 路就降质"的原因：720p/1080p 被当成**整个输出帧**的短边，于是 6 路 720p 出的是
  1920×720 的六宫格，每格 640×360 —— 比选 480p 还小。
- 现在预设名指**每一路**的短边，帧随格子长（16:9 素材、720p 档）：
  1/2/3/4/6 路 = 1280×720 / 2560×720 / 3840×720 / 2560×1440 / 3840×1440，每格恒定 1280×720。
- 帧到底开多大不靠猜：`phoneExportFit()` 问 `TDashcamNative.exportCodecReport(w,h)` 该尺寸下本机有哪些
  编码器，编不动就按 0.75 逐级缩（最多 5 级），并在摘要里如实标「已按本机编码器上限缩小」。
  要不要坚持硬编同样从设备读（`picky`）：模拟器只有软编，把帧压到"硬编能接"毫无意义；
  真机上如果只有软编接得住，宁可缩到硬编能接，否则一跑就是几分钟。
- 这里同样有一个静默失效：`exportCodecReport` 被先存进变量再调用 —— `@JavascriptInterface` 方法
  **脱离对象调用**会抛 `Java bridge method can't be invoked on a non-injected object`，`try/catch`
  把它吞成 `null`，`phoneExportFit` 就当"没有编码器信息"原样返回。也就是说整条 clamp 从来没跑过，
  6 路 720p 是把 3840×1440 直接交给 MediaCodec 的。现在改成在 `window.TDashcamNative` 上调用。
- 实测（模拟器素材是 1080×2400 的竖屏录像，且软件编码器上限 1920×1088，所以数值都被 clamp 过）：
  - 摘要逐路：1 路 → 「720x1600（每路 720x1600）」（没有 clamp，单路帧本来就在限内）、
    2 路 → 「1080x1200（每路 540x1200）」、3 路 → 1620x1200、4 路 → 810x1800、
    6 路 → 「912x1350（每路 304x675） · 00:30 · 已按本机编码器上限缩小」。
    摘要里带「已按本机编码器上限缩小」这件事本身就是 `exportCodecReport` 真的返回了数据的证据
    —— 修掉 detach 之前这条 clamp 从来没跑过，也不会打这个标签。
  - 端到端：6 路 00:00→00:05 → `TDashcam_2026-10-08_09-00-00_6c_912x1350.mp4` 680,899B，
    回读 `912×1350 / 5.03s`，六个格子平均亮度 39~40、`litRatio` 0.49~0.58（空格子会是 0）。
- 探针：`devtools/probe-r22-plate.mjs`（按 `object-fit: contain` 的内容盒算卡片压住画面的百分比）、
  `probe-r22-place.mjs`（镜像定位算法）、`probe-r22-speed2.mjs`（逐行 `elementFromPoint`）、
  `probe-r22-summary.mjs`（导出面板摘要/选中项）、`probe-r22-playback.mjs`（回读导出文件按格子采样）、
  `make-inject-styles.mjs`（把 `src/styles.css` 热注入已装 WebView，改 CSS 不必重编，省 9 分钟一轮）。

## 导出加 4K、画面不拉伸、横屏数据卡改回方框（1.2.1–1.2.3）

用户原话三条：「1. 导出视频增加 4k 选项。2. 导出的视频，特别是几路视频的组合，里面的画面不能有裁剪、
拉伸或者压扁，保持原视频比例。3. 横屏的详细数据卡片是一个长条，改为和竖屏一样的方框样式，
可以调整大小、移动位置。」桌面端一行未动。

### 4K 档与「缩到能编为止」

- 分辨率 chips 从 4 个变 5 个：`原尺寸 / 4K / 1080p / 720p / 480p`（`source` 仍指**每一路**的原始短边）。
- `phoneExportFit()` 原来是 5 级 × 0.75，从 3840 起缩根本缩不到能编的尺寸，就出现"选了 4K 直接报
  编码器不支持"。现在 **14 级 × 0.8**，并且**每一级都对齐到 16**（`align()`）。对齐 16 不只是好看：
  帧高不是 16 的倍数时编码器会补到宏块网格，容器里就留下 coded ≠ display 的两套数字（1.2.0 出的
  912×1350 就是这个形状，1350 不是 16 的倍数）。
- 实测（模拟器只有软编 `c2.android.avc.encoder`，上限 1920×1088）：6 路 4K 摘要
  「1088×1616（每路 544×808） · 00:30 · 已按本机编码器上限缩小」，6 路 720p 出
  **1104×1632**，`mp4-dims` 回读 coded == display（0.00% 差），即上面那条对齐真的生效了。
- 1 路 4K 也跑完了（1.2.2，模拟器）：摘要「1 路 · 880×1968（每路 880×1968） · 00:03 · 已按本机编码器
  上限缩小」，进度走到 `已写入 91/91 帧`，落盘 `..._1c_880x1968.mp4`，`mp4-dims` 回读
  coded == display == 880×1968。880/1968 = 0.4472 对素材的 0.45 差 0.6%，这是两条 16 对齐各自取整
  的必然结果 —— 差额由 `contain` 变成格子内 ~6px 的黑边，不是拉伸。

### 组合画面为什么不能拉伸，以及一次走错的路

保证来自四件事，缺一件就会看到用户说的那种"压扁"：

1. **格子按 `contain` 画**（`GlRenderer.Cell.contain`）：素材保持比例放进格子，剩下的留黑，
   永不裁掉像素。
2. **格子比例取自容器的显示尺寸**（`CameraStream` 里 `MediaExtractor` 轨道格式的 `KEY_WIDTH/HEIGHT`），
   不是解码器输出格式的。
   > 这一条原来写的实测数字（"6 路 720p 每格 368×816 = 0.45098，素材 1080×2400 = 0.45，`contain`
   > 后 367.2×816，比例误差 0.2%"）是**在 1080×2400 的竖屏 fixture 上量的，那个数字是假的安心**：
   > fixture 本身是 0.45 的窄长条，格子也是窄长条，两个长宽比恰好接近，于是把"格子被当成正方形"
   > 这个真 bug 完全遮住了。换成 2896×1876 / 1448×938（宽 1.5437）的真特斯拉录像才暴露出来。
   > 现在长宽比是 `KEY_PIXEL_aspect` 与显示尺寸一起算的，见下一节的实测。
3. **输出帧 16 对齐**（上一条），编码器不再自己加宏块边，容器里就不会出现第二套宽高。
4. **旋转矩阵在 SurfaceTexture 变换之前乘**（`drawTexture`），而不是之后：ST 那个矩阵把单位正方形映到
   一个通常**不居中**的裁剪矩形上，先旋转会采样到偏移的区域、丢掉一部分画面。整帧素材两种顺序结果
   一样（翻转把旋转共轭成反向旋转），所以这个差别只在带边距的流上看得见。

**走错的那一步值得记下来**：第一版"修比例"从 ST 变换矩阵的轴长反推画面尺寸
（`hypot(m[0],m[1])`、`hypot(m[4],m[5])` 乘回 `codedWidth`），看着很合理 —— 矩阵就是裁剪矩形。
装上去实测发现它**同时**犯了两个错：

- 索引取错（用了 `m[2],m[3]`，那是透视列，恒为 0），于是 `measureCrop()` 永远算出 1.0，
  整条路径静默无效 —— 1.2.1 的行为其实等同 1.2.0。**这类"看起来在做事的无效代码"最难发现，
  因为它不改变任何输出。**
- 就算索引修对也是错的。模拟器 logcat（`TdExportCam`，六个流都报 `coded=1080x2400`）：
  front/back/left/right 的 `m[0] = 1.000000`，两个 pillar 的 `m[0] = 0.935764`、`m[12] = 0.000868`。
  0.9358 ≈ 1078/1152 —— 矩阵说的是**解码器自己那块缓冲**（1152 宽）里哪一段是图，
  而 `codedWidth` 是容器的 1080。拿 1080 去乘这个分数，等于把宏块边距当成画面比例，
  **自己造出 6.8% 的压扁**。裁剪矩形该由采样处理（矩阵本来就把整个格子映到裁剪区，边距自动被丢掉），
  不该拿来做尺寸。1.2.2 把这条路径整段删掉，只留容器显示尺寸。

顺带删掉的还有 `INFO_OUTPUT_FORMAT_CHANGED` 里对宽高的覆盖：解码器输出格式报的是**带边距**的帧
（858 宽的流会报 864），格子按它算就把边距变成了拉伸。那个分支现在只取旋转。

1.2.2 装到模拟器上把这条改回来的效果验完了。`TdExportCam` 现在打的是
`front first frame size=1080x2400 rot=0 tx=1.000000,...`、`left_pillar ... tx=0.935764,...`
（字段名从 `coded=` 改成了 `size=`，就是为了提醒自己是容器显示尺寸不是解码缓冲尺寸）。两路导出摘要
「2 路 · 1152×1280（每路 576×1280） · 00:05 · 已按本机编码器上限缩小」，`151/151 帧` 完成后
`mp4-dims` 回读 coded == display == 1152×1280；576/1280 = 0.45 **正好**等于 1080/2400，所以格子里
没有黑边。再把成品 t=3s 抓一帧用肉眼看：两格各占一半、状态栏图标和文字都没变形。

剩下的已知误差：pillar 两路的解码裁剪约 1078 宽对容器声明的 1080，即 ≤0.18% 的横向拉伸，肉眼不可见，
而且安卓自带的播放器放同一路流也是这么呈现的。

### 横屏详细数据卡片：回到和竖屏同一个方框

- 横屏那条「通栏长条」是 1.2.0 之前留下的 `.stats-overlay { left:10; right:10 }` 规则；现在横屏块里
  只剩 `right: 8px`，宽高交给和竖屏共用的那一套（`width:max-content` + 可拖可缩放）。
- **可以调大小**：右下角新增 `.stats-resize` 抓手（两条斜线，`currentColor`，桌面端仍 `display:none`）。
  手指拖动时 `width = clamp(起点 + dx, 96, vw-12)`、`height = clamp(起点 + dy, 34, vh-34)`，
  并按宽度切列数：`<150 → 1 列`、`<330 → 2 列`、否则 3 列（`--stats-cols`）。
- **可以挪位置**：按住 header 拖（`startsDrag` 在手机上限定 `.stats-header`，桌面整块可拖），
  抓手上 `preventDefault()+stopPropagation()`、`touch-action:none`，否则浏览器会把拖动变成滚动。
- 尺寸和位置存 `localStorage.tdashcam.statsPlate`，`applyStatsPlateSize()` 在打开卡片时恢复；
  **只有当存的位置还在屏幕内**才恢复 `left/top`（转屏后盒子可能整个跑到外面去），否则丢掉位置重新贴边。
- 卡片内容超高时**只有行在滚，盒子不滚**。第一版把 `overflow-y:auto` 加在 `.stats-overlay` 自己身上，
  1.2.2 复测时发现一个连锁问题：右下角抓手和 header 都是**绝对定位**在这个滚动盒上的，卡片滚到一半，
  抓手就飘到行中间、header 移出顶边 —— 而这两个正是整个盒子唯一的两个把手。改成
  `.stats-overlay.show { display:flex; flex-direction:column; overflow:clip }` + 滚动交给
  `.stats-content`（`flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain`），
  并在 `applyStatsPlateSize()` 里把 `content.scrollTop` 归零（元素是复用的，上一次的滚动位置会留着，
  连带把抓手从它钉住的角上挪走）。`clip` 而不是 `hidden`：`hidden` 的盒子仍然是滚动容器，卡片里轻轻一划
  整个盒子还是会被带下去几个像素，header 跟着跑。
- 用户已经用抓手拖出来的尺寸不再被 `max-width/max-height` 夹回去（`.stats-overlay.resized` 两条都设
  `none`）：那两个上限是照着"要躲开的那个布局"量的，拖大的盒子会被静默缩小。
- 实测（模拟器横屏 915×412，全部 `adb input swipe` 真手指）：拖 header 把盒子从 (803,32) 移到
  (532,75)；抓手分三段拖出 104×157 → 140×163 → 179×174 → 330×191，列数随宽度 1→1→2→3；
  滚一下内容（`content.scrollTop` 0→23）再关掉重开，`scrollTop` 回 0、`elementFromPoint(抓手中心)`
  仍然命中 `#statsResizeHandle`（修之前它返回 `#left-player`，抓手等于没了）。
- **注意 `tap-to.mjs` 只看 `display` 不看 `visibility`/`pointer-events`**，控制层自动隐藏时它会报告
  "点到了"而实际什么都没发生。这一轮两处踩到：⋮ 菜单项（`#metaDetailBtn`）要先点 `#tabMoreBtn`
  再按设备像素硬点；而 `#clipBtn` 在视频控制条里，控制条约 3 秒无操作就 `pointer-events:none`，
  所以得先点一下画面把它唤出来，紧接着点它 —— 中间那次唤出点击要单独一次 `adb input tap`。

### 顺带修掉的：横屏导出面板点不到「开始导出」

验 1 路 4K 时才发现：横屏 915×412 下导出面板 `max-height` 只有 273px，内容 339px，多出来的部分
（正好是 `.modal-buttons` 那一行）滚在面板外面 —— 面板能打开、选项能改，就是**没有开始按钮**，
`elementFromPoint` 在它的矩形上返回的是遮罩层。先试了给 `.modal-buttons` 加 `position:sticky`，
结果更糟：滚动区只剩 198px，粘在底部的按钮条把「范围」那一组整个盖住，还多出一块不透明的白条。

最终把滚动从面板挪到内容：`index.html` 里给三组选项 + 进度包一层 `.pe-body`，CSS 上
`.phone-export-panel { overflow:hidden }`、`.pe-body { flex:1 1 auto; min-height:0; overflow-y:auto;
overscroll-behavior:contain }`，标题和按钮条都不跟着滚。另外横屏单独把 `--sheet-bottom` 收成
`max(16px, kb-h+8)`：底部悬浮动作栏在模态面板后面本来就点不到，为它留 99px 正是把按钮挤出屏幕的原因，
而键盘（`--kb-h`）该让的还是让。（`.pe-body` 只在手机查询里出现；`#phoneExportModal`
本身也只由 `isPhoneLayout()` 打开，桌面端不受影响。）

**装机后的 1.2.3 实测（全部真点击）**：横屏 915×412 面板 `620x340@174,56`，`.pe-body`
`scrollHeight == clientHeight == 221`（不需要滚），`peStartBtn` 在 `190,337 288x42`、
`elementFromPoint` 命中自己。焦点进「结束」输入框后键盘起来（`--kb-h: 220.2px`），面板缩到
`620x168@174,16`、`.pe-body` 变成可滚（`sh 221 / ch 49 / st 148`），**开始按钮仍然可见且仍然命中自己**
—— 键盘不再吃掉它。改选 4K（摘要写 `880x1968（每路 880x1968）· 已按本机编码器上限缩小`）、
把结束时间打回 `00:03`（`change` 只在失焦时提交，所以真机上按一次回车或点别处才生效），
然后**在键盘还开着的情况下**直接点开始：91/91 帧写完，产物 `TDashcam_2026-10-06_14-20-00_1c_880x1968.mp4`
310KB，用 App 自己的流服务回读 → `videoWidth/Height = 880x1968`、`duration 3.03s`、
宽高比 0.4472（源 1080x2400 = 0.45，差的 0.6% 就是 16 对齐取整），画面顶部四行亮度 114/115/114/109
（不是黑边）。数据卡方框也在包上重跑了一遍：真滑动抓手 `330x191 → 231x121`、列数自动 3→2，
真滑动标题栏拖到 `147,246`，`am force-stop` 重开之后仍是 `231x121@147,246`（`tdashcam.statsPlate`）。

**滚动区换了主人，就得把旧代码一起改口**：1.2.0 那条「横屏键盘弹起后把焦点行顶回面板里」的补丁
（`setupPhoneExportPanel` 里的 `scrollInto`）读的是 `dom.panel.scrollTop`，面板变成 `overflow:hidden`
之后这个值恒为 0 —— 补丁不报错，只是**静默失效**，和 1.2.1 那次取错矩阵索引是同一类坑。现在它取
`.pe-body`（`dom.body`，取不到再退回面板），`ResizeObserver` 同时盯面板和滚动区：键盘的 IME inset
缩的是面板，真正需要滚的是 `.pe-body`。

## 真片比例、全屏按钮、亮度手势与横屏 HUD（1.2.4–1.2.5）

用户这轮七条（原话）：「1. `C:\Users\Xingcong\Desktop\SavedClips` 这个是特斯拉行车记录仪导出的视频，
供参考。目前导出的视频还是被压扁了，没有保留原视频的格式，无论是单路还是多路视频。2. 横屏、竖屏都增加
全屏播放的按钮，方便最大化利用屏幕空间。3. 点击视频向上滑动，可以调节亮度。4. 横屏的时候，以前左边会
显示行驶状态的 hud 卡片，现在没有了，请恢复。5. 底部胶囊任务栏，点击更多选项，还是会被"详细数据"遮挡，
请排查。6. 播放视频的时候，行车数据的 hud 卡片可以和详细数据的卡片同时存在，目前打开一个，另外一个就关掉了。
7. 请排查一下还没有其他 bug 一起解决。」桌面端仍然一行未动。

### 先说素材：真片的几何形状，以及它们根本没有 SEI

以前所有导出比例都是在**自己造的 1080×2400 fixture** 上验的，而真片是另一个形状：

| | 前台 | 其余五路 |
|---|---|---|
| 尺寸 | 2896×1876 | 1448×938 |
| 长宽比 | **1.5437** | **1.5437** |

`pasp 1:1`、无旋转、样本报 `avc1`（H.264）、mdat 在第 40 字节。11 组事件、每组 6 个 mp4 +
`event.json` + `thumb.png`，放在 `C:\Users\Xingcong\Desktop\SavedClips\`，设备侧
`/storage/emulated/0/TeslaCam/SavedClips/`。

关键的一条排查结论：**这些 SavedClips 里没有一条 SEI 遥测**。三种方法各自独立否掉了"解析器写错了"：
App 内 `SeiMetadata` 就绪但计数 0；Node 侧直接跑项目自己的 `parseMetadata()` 也是 0；把 NAL 全数一遍
—— 1487 个 NAL，类型只有 1/5/7/8，**type 6 一个都没有**。所以卡片显示「无元数据」是对的，
真正的 bug 是**横屏连卡片本身都看不到**（见下面第 4 条）。附带把 `event.json`（`{timestamp, city:"成都",
street:"学院路西段", est_lat, est_lon, reason:"user_interaction_honk", camera:"0"}`）也推了一份到设备，
用来验"没遥测时卡片该显示什么"。

### 1. 导出还是被压扁：`contain` 里混用了两套单位（1.2.4）

根因在 `GlRenderer.Cell.contain()`：格子两条轴**在 NDC 里都是 2 个单位**（`cellWidth = 2f/cols`、
`cellHeight = 2f/rows`），可是这两单位对应的**像素数**取决于输出帧的宽高比。只拿 `sourceAspect` 去和
`cell.width / cell.height` 比，等于默认了整帧是正方形 —— 于是格子越"不像正方形"，误差越大。
1104×720 的帧放 1.5437 的素材，实测画面只有 **1104×466**，正是用户说的"压扁"。

修法是把整帧像素比传进 `contain`（`frameAspect`，`ExportEngine.kt:211` 在调用点传
`renderer.frameAspect`），两条轴各自换算：

```kotlin
val cellAspect = cell.width / cell.height * frameAspect
if (sourceAspect <= cellAspect) {
    val fittedWidth = cell.height * sourceAspect / frameAspect
    ...
}
val fittedHeight = cell.width * frameAspect / sourceAspect
```

**为什么前面几轮没抓到**：1080×2400 的 fixture 长宽比 0.45，窄格子（0.45 上下）本来就近似正方形误差
的"受害者"，两个偏差互相掩盖到看不出来。这一点也反过来提醒：上一节那句"比例误差 0.2%"是假安心，
已就地标注作废。

实测（`devtools/probe-r27-bbox.js`，用 App 自己的 `/media/<token>/` 流回读成品、逐格采样行列亮度差
>0.6 找内容边界，所以暗帧不会被当成黑边）：

- 单路 `TDashcam_2026-10-08_07-30-59_..._1c_*.mp4`：内容区长宽比 **1.5419**（源 1.5437，差 0.12%，
  来源是 16 对齐取整，按 `contain` 变成格子内几条黑边，不是拉伸）。
- 六路 `TDashcam_2026-10-08_07-30-59_6c_1696x736.mp4`：帧 1696×736，每格 565×368 / 566×368，
  实测内容盒 565×366 … 566×367，逐格长宽比 **1.5395–1.5464**，**最大偏差 0.27%**；左右 0 黑边、
  上下 ≤1px。

### 2. 横竖屏都能手动全屏（1.2.4）

`#fullscreenBtn`（`index.html:361`）在视频控制条的 `.controls-right` 里，点一下画面唤出控制条就能按，
横竖屏同一颗。它做两件事：`document.body.classList.toggle('phone-fullscreen')` 让 CSS 收掉页头/胶囊栏，
并调原生 `TDashcamNative.setFullscreen(on)`（`MainActivity.kt:366`）把系统栏真正沉浸掉 —— 只做前一半
的话状态栏还亮着。图标是两支 svg（`.fs-expand` / `.fs-collapse`）靠 `.is-fullscreen` 切换，
`aria-pressed` 跟着走，没选事件时 `disabled`（`script.js:4116`）。退出用系统返回键，`syncBackLayers`
已经把全屏层压进了页面层栈。

### 3. 在画面上竖向拖动调亮度（1.2.4）

`setupPhoneBrightnessGesture()`（`script.js:9694`）：`touchstart` 记下起点和当前档位，
`touchmove` 里**先要求 ≥14px 且明显偏竖直**才 `engaged` —— 这条阈值正是为了不抢「左右滑动切事件」
（B11）和单纯点击。命中后 `setBrightness(startLevel + (-dy / span) * 0.9)`，span 取屏幕高度的 0.9 倍
左右，全程 `passive:true` 不阻塞滚动。

亮度不是去改窗口背光 —— WebView 够不着 display 属性 —— 而是 `#phoneBrightnessDim` 一层黑色遮罩的
opacity，好处是用户和截图都能看见它在起作用。`#phoneBrightnessHud` 那条 `pb-track/pb-fill/pb-value`
的小 HUD 900ms 后自动收起。**档位存 `localStorage.tdashcam.brightness`**，下次开机还在。

两条实测踩坑值得记：① 一开始"上滑没反应"是因为档位已经顶到 1.0 上限，先下滑到 0.764 再上滑才看得见动；
② HUD 的 900ms 隐藏计时**总是跑赢 CDP 往返**，探针报 `display:none`。解法是把滑动丢到后台
（`( sleep 1.6; bash devtools/tap.sh --swipe … ) &`）同时让探针轮询 6 秒采样。

### 4. 横屏左侧的行车状态 HUD 回来了（1.2.5）

「以前有、现在没有」是**两件事叠在一起**：

1. `styles.css` 里有一条无差别的横屏隐藏 —— 宫格视图下 `.metadata-panel { display:none }`。它当年是
   有理由的：卡片那时还是**通栏长条**，在横屏要占 53px，把六路画面压成 25px 细条（第 59 号任务）。
   但 1.1.7 之后卡片已经改成浮在字母带里、`publishControlReserve` 上报 0 预留 —— 占位问题早没了，
   这条 blanket hide 却留了下来，成了"卡片整个消失"的主因。现在按 `.has-data` 收窄：
   ```css
   .player-area.grid-view .metadata-panel:not(.has-data),
   .player-area.grid4-view .metadata-panel:not(.has-data),
   .player-area.legacy-view .metadata-panel:not(.has-data) { display: none; }
   ```
   没内容就别浮在画面上（空芯片只有坏处），有内容（SEI 读数**或**位置）就显示。
2. `.metadata-panel.collapsed { opacity: 0 }`，而自动展开只在 `currentMetadata.length > 0` 时触发。
   真片没有 SEI（上面已证），于是卡片永远停在 collapsed = 透明 = 看不见。**修法是给它一个真有内容的
   回退**：`eventPlace()` 读当前事件的 `event.json`，竖屏/横屏都显示「无元数据 · 成都 · 学院路西段」，
   `updateUIStatus()` 里 `hasSei || eventPlace()` 才算 `showsSomething` 并自动展开。
   `eventPlace()` 在桌面端直接返回空串，`.meta-empty-place:empty { display:none }`，所以桌面的
   「无元数据」和布局一点没变。

另外补了 `this.userPinned`：顶栏按钮一旦被我手动点过，自动展开就不再把卡片弹回来
（否则用户点「行车数据」收起，下一帧元数据又把它打开，等于点不动）。

### 5. 「更多」面板不再被详细数据卡片遮挡（1.2.4）

排查过程本身是个坑：第一轮探针报 `plateOverGroupPx 12473`、逐行 `self:false`，看着像没修 ——
其实是因为**点「详细数据」会把「更多」面板关掉**（`script.js:9508`），量的是已经收起来的面板。
重新打开面板再量：`headerZ 1700`，12 行逐行 `elementFromPoint` 全部命中自己。

关键是 `#headerActionsGroup` 是 `position:fixed; z-index:1000`，但它在 `.main-header`
（`position:relative; z-index:50`）里面 —— fixed 子元素**逃不出父级的堆叠上下文**，所以抬子元素没用，
要给容器抬：`.main-header:has(.header-right.active) { z-index: 1700 }`。

### 6. 行车数据 HUD 与详细数据卡片可以同时显示（1.2.4）

原来两者互斥。现在实测（横屏 915×412、真点击、卡片拖到 330×191@532,75）：
`hudOverPlatePx 0`，HUD 与方框卡片同屏共存、互不遮挡。

### 7. 顺带查的

- `#fullscreenBtn` 在横屏会被打开中的「更多」面板盖住（`#headerActionsGroup` x300..906 / y236..290
  与它矩形相交），所以在面板开着时点它会变成"关掉面板"。验这条要先收面板，再 `elementFromPoint`
  确认命中的是按钮自己的 svg，最后才 `adb input tap`。
- 点画面会切控制条显隐（播放中约 3 秒自动隐藏；暂停/倍速菜单开着/`#headerRight.active`/拖拽时
  `hideControls()` 直接 return），所以 wake-then-tap 会随机失灵。探针改成按
  `getComputedStyle(...).visibility` + `elementFromPoint` 轮询重试。
- **有意留着没改的**：手机端宫格格子仍是 `aspect-ratio: 16 / 9`（`styles.css` 5 处），而真素材是
  1.5437，每格约 13% 上下黑边。这是第 55 号任务里用户明确要求的"格子按 16:9 定尺寸、消掉大片黑边"
  的结果 —— 黑边变的是"整块小一点"而不是"零散大片"。当成取舍记在这里，没有偷偷改。

### 探针

`devtools/probe-r27-bbox.js`（六格逐格内容盒/黑边/`maxDevPct`）、`probe-r27-bright3.js`（后台滑动 +
6 秒轮询抓 HUD）、`probe-r27-cards.js`（HUD 与卡片矩形、重叠像素、`hudItemsShown`/`hudEmptyShown`）、
`probe-r27-layers.js` + `probe-r27-anc.js`（祖先链与堆叠上下文）、`probe-r27-hit.js`（逐行命中测试）、
`probe-nals.js`（NAL 类型直方图，用来证明没有 SEI）、`probe-codec.js` / `probe-boxes.js`（样本条目与盒结构）。

## 1.2.5 全项复测 + 抽屉左滑误关（1.2.6）

### 先把上一轮的账收干净（1.2.5 上真点击复测）

- **条目 5（遮挡）**：横屏 915×412 打开「更多」后 `hrCls = header-right active`、`headerZ = 1700`，
  12 行 `elementFromPoint` 全命中自己（`badCount 0`）；竖屏 412×915 同样 `badCount 0`，面板盒
  [223,135,179,658] 与卡片盒 [72,56,330,191] 相交的那一条带里面板在上方。两个方向各有一张截图。
  > 上一轮量到 `badCount 12` 的"没修"是**假账**：面板收起时 `#headerActionsGroup` 带
  > `visibility:hidden; opacity:0; pointer-events:none`（`styles.css:227-248`），那 12 个按钮根本不参与
  > 命中，探针量的就是收起态。要判断面板到底开没开，看 `#headerRight` 上有没有 `active`，别看按钮在不在。
- **条目 4**：横屏六宫格 HUD `display:flex`、[8,81,155,58]、`has-data:true`、文案「无元数据 成都 · 学院路西段」；
  再点一次「行车数据」→ `collapsed` + `opacity 0` + `userPinned:true`，之后不再被自动展开（收起是用户意图）。
- **条目 6**：HUD 与详细数据方框同屏，`overlapPx 0`。
- **条目 2（全屏）**：竖屏点全屏 → `body.phone-fullscreen`，顶栏与底部胶囊条都 `display:none`，
  六格按 2×3 每格 195×110 在 915 高里居中；播放/时间/倍速/全屏四个控件与卡片同屏 `bad 0`；
  **系统返回键先退出全屏而不是关应用**。
- **条目 3（亮度）**：竖屏真滑动 (206,300)→(206,560) 把 1 压到 0.698，`#phoneBrightnessDim`
  `opacity 0.302`、`pointer-events:none`、`z-index 39` —— 比控制条（40）低一层，所以只压画面不压控件；
  HUD 短暂显示 70%，`localStorage.tdashcam.brightness` 记下 0.6977…。
- 全程 `window.__tdashcamErrors` 为空，界面无 `undefined/NaN`，倍速标签与 `playbackRate` 一致。

### 7a. 抽屉"自己想关"：手势读的是屏幕坐标，屏幕坐标不跟旋转

排查条目 7 时撞到两条现象，看着不相关，其实是同一个根因：

1. 横屏在抽屉里**竖向**滑动事件列表，抽屉直接关掉；
2. 竖屏在日期 chips 那一行**横向**拖到后面的日期，抽屉也关掉。

`initSwipeGestures()` 判方向用的是 `changedTouches[0].screenX/screenY`。`screenX` 是**设备屏幕**坐标系，
Activity 旋转后它不跟着换轴 —— 横屏里"沿着抽屉往下滑"在屏幕坐标里是一趟大 `deltaX`，于是
`deltaX < -50` 命中"左滑关闭"。竖屏那条则是另一回事：日期 chips 行本身要横向滚动，手势归它，不该归抽屉。

改法两条，都在 `script.js:11533` 起的 `initSwipeGestures()` 里：

- 四个取值点全换成 `clientX/clientY`（视口坐标，永远和布局同轴）。顺带 `touchStartX < edgeThreshold`
  的"从左边缘右滑打开"也才真正是**视口**左边缘。
- 加 `startsInHorizontalScroller(target, deltaX)`：从手势落点往上走到抽屉根节点，途中任何
  `scrollWidth - clientWidth > 8` 的元素，若这次拖动方向上**还有得滚**（往左拖且没滚到头、往右拖且没滚到 0），
  就把这一下判给那个元素，不关抽屉。已经滚到头之后再往同方向拖仍然能关 —— 保留 overscroll 关抽屉的手感。

### 7b. 搜索框搜不到界面上看得见的类型名

列表卡片上写的是「哨兵」，`event.eventType` 存的是 `sentry`，而 `eventMatchesSearch()` 只读原始字段 ——
于是"看得见的那个词搜不到 0 条，看不见的那个词搜到 2 条"。现在把
`this.videoListComponent?.getEventTypeLabel(event.eventType)` 一起并进匹配串（`script.js:8926`），
中文标签、英文原值、城市、街道、日期同一趟匹配，切到英文界面时搜 `Sentry` 也一样命中。

### 探针（本轮新增）

`devtools/probe-r28-more.js`（面板开合状态 + 逐行命中，一枪出结论）、`probe-r28-bar.js`（胶囊条五个 tab 与
卡片矩形）、`probe-r28-hud.js`（HUD `collapsed`/`has-data` + `userPinned`）、`probe-r28-fs.js`（全屏按钮矩形、
`body.phone-fullscreen`、亮度、错误尾巴）、`probe-r28-dim.js`（遮罩层与亮度 HUD）、`probe-r28-hits.js`
（一整套控件命中测试）、`probe-r28-fsgeo.js`（全屏时播放器区/格子/控制条几何）。

## 「更多」面板里那两颗按不动的按钮（1.2.7）

条目 5 复测通过后，把 12 行按钮逐个过了一遍状态，抓到两条只有手机才会撞上的问题。

### 7c. 播放中「显示路径 / 下载视频」是死的

`MultiCameraPlayer` 的播放状态回调里写着（`script.js:4087`）：

```js
revealBtn.disabled = playing || !this.viewer.currentEvent;
downloadBtn.disabled = playing || !this.viewer.currentEvent;
```

桌面端把"正在播放"当成一个不适合操作文件的时刻，但**手机上「更多」面板只有在播放时才打得开**
（控件一隐藏，`#headerRight` 就跟着收起），所以这行规则的实际效果是：面板 12 格里永远有 2 格
`opacity:0.4`、点下去没反应。处理函数里还各有一道同样的闸门：

```js
if (this.multiCameraPlayer.isPlaying || !this.continuousPlayer.currentEvent) return;
```

两处一起改：

- 禁用条件改成 `(!phone && playing) || !currentEvent`，`phone = isPhoneLayout()`；
- 两道 early-return 提成 `blockedByPlayback()`，里面同样只在**非手机**时才因 `isPlaying` 拦。
  桌面行为一字未动。

暂停态实测这两颗本来就是好的：「显示路径」弹出路径框
`/storage/emulated/0/TeslaCam/SavedClips/2026-10-08_07-41-59/2026-10-08_07-30-59-front.mp4`，
「下载视频」toast「已保存到 Download 目录: …/2026-10-08_07-30-59-left_pillar.mp4」
（`tauri.fs.copyFile` 在安卓上是通的，`capabilities/android.json` 的 fs scope 里有
`/storage/emulated/0/**`）。顺手补了 `notifyMediaFile(dest)`，否则复制进 Download 的录像
在相册里要等系统自己扫到才算数。

### 7d. 一个 `alert()` 能把整个 App 冻住

「导出CSV」在没有 SEI 遥测的录像上走 `alert(exportMetadataNoData)`（「没有可导出的元数据」）。
真点之后 CDP **连续两次 15~25 秒无应答**，直到从外部把那个对话框点掉才恢复 ——
因为 `window.alert()` 在 WebView 里是同步阻塞 JS 线程的，播放、手势、渲染全部停在原地，
手机用户看到的就是"App 卡死了"。全项目 16 处 `alert()`，其中至少
`9109 / 9256 / 12532 / 12701 / 12738 / 12813` 在手机上可达（导出面板那一串尤其密集）。

没有逐处改写，改成一处兜底：`installPhoneAlertShim()`（`script.js:529`，紧跟
`window.viewer = new TeslaCamViewer()` 调用），只在 `isAndroidRuntime()` 下把 `window.alert`
换成 `viewer.showToast(text, 'info', 4500)`。桌面端一个对话框都不变。
判据很好拿：装了 shim 之后 `alert('x')` 不再让 CDP 卡住，且 `.toast-container` 里出现那句话。

### 探针（本轮新增）

`probe-r28-panel2.js`（面板开合 + 六个按钮四角命中 + 计算样式，用来把"被遮挡"和"被禁用"分开）、
`probe-r28-panelbtns.js`（12 行按钮的 `disabled/display/visibility/opacity/title` 全量快照）、
`probe-r28-taphook.js`（文档级 capture 记 `__taplog`，真点击之后看事件到底落在哪个按钮上）。

### 装机实测（1.2.7，模拟器 x86_64，全部真点击 / 真滑动）

- 抽屉页脚 `v1.2.7`、`/showToast/.test(window.alert.toString()) === true`、`__tdashcamErrors` 0 条。
- **7c**：横屏 `playing:true` 时 12 行 `disabledIds:[]`，`reveal/download` 都是 `dis:false op:1`
  （1.2.6 同一状态下是 `dis:true op:0.4`）。真点「显示路径」→ 播放中弹出路径框
  `…/2026-10-08_07-41-59/2026-10-08_07-30-59-front.mp4`；竖屏同一笔操作结果一致。
- **7d**：`alert('shim 测试：不该冻住')` 在 1.15 秒内返回，`.toast-container` 里就是那句话；
  改之前同样一句让 CDP 连续 15~25 秒无应答。
- **回归**：条目 5 横竖屏各一次 `badCount 0`（详细数据方框开着量的，`headerZ 1700`）；
  条目 4/6 HUD `[8,81,155,58] has-data opacity 1` 与方框 `[577,32,330,191] show resized` 同屏；
  条目 2 横屏全屏 `playerArea 915×412`、`--safe-top:0px`、返回键先退全屏；
  条目 3 竖屏下滑 `dim opacity 0.221` / `tdashcam.brightness 0.7788`，上滑回到 `1` / `0`；
  1.2.6 的抽屉手势：竖滑列表抽屉不再误关（`sidebar` 保持展开）。

## 第二十四轮：抽屉层级、卡片内容完整性、画面捏合、八倍速（1.2.8 / 1.2.9 / 1.2.10 / 1.2.11）

用户这轮提了七条（原文里有两个「5.」）：列表菜单被详细数据卡片遮挡、卡片要按自定义大小显示**完整**
内容、画面可以手势捏合缩放且**别的地方不动**、倍速加 4×/8×、适配更多机型、继续排 bug、按苹果最新
设计规范完善 UI。前四条落代码，后三条是这一轮的排查面。

### 1. 列表抽屉被详细数据卡片压住（1.2.8）

现象：卡片开着时点底部「列表」，抽屉滑出来但卡片浮在它上面，看得见点不着。

层级表是**逐层抬**抬出来的，不是设计出来的：抽屉 `.sidebar` 1550 → **1650**、遮罩 `.overlay.active`
1500 → **1600**、详细数据卡片 `#metaDetailOverlay` 保持 1500（它就是被抬下去的那一层）。抬完立刻暴露
两个次生问题，因为它们挂在 `body` 上、必须盖在抽屉**之上**：长按上下文菜单 1200 → **1800**，
它那层点击穿透遮罩 `body.context-open::after` 1100 → **1750**。菜单留在 1200 的后果很具体——它是从
抽屉里的卡片长按唤起的，结果冒在自家列表底下。

「更多」面板（`body.more-panel-open .main-header` 1700）比抽屉高一级，两者同时开会让列表从面板底下滑
过去。这次不是调数字，是**互斥**：`toggleSidebar()` 展开抽屉时收起面板，`case 'more'` 打开面板时收起
抽屉（tab 那条路径本来就关，标题和侧滑返回这两条没关，补齐）。

实测（1.2.8，真点击）：卡片显示时点「列表」，`z` 报回 `sidebar 1650 / overlayActive true / plate 1500`，
首张卡片三点 `elementFromPoint` 全部落在抽屉内。

### 2. 详细数据卡片：缩小之后内容不全（1.2.8 做了一半，1.2.9 补完）

1.2.8 的做法是让框子驱动三个旋钮：先加列（同样高度下列数越多行越少，且不牺牲可读性），再降字号
（下限 8px），最后才允许滚动。中间踩了一个环：**自动尺寸的卡片不能参与 fit**——框宽→列多→框更宽→
再加列，永远收敛不了，所以 `resized` 类是硬门槛。

真机拖了一角：330×191 → 313×178，列 3→2，`scrollH == clientH`，裁掉的行 0。**但继续缩到 138×91
就露馅了**：字号已到 8px 下限、列只剩 1，`scrollH 115 / clientH 49`，六行半的内容被折在滚动里——用户
要的「按自定义大小显示完整内容」并没有满足。

1.2.9 把这条变成**不变式**，办法是再买一层：卡片的行距、列距、内边距全是 `em`，所以加一个
`.stats-dense` 层（`line-height 1.1`、`padding 4px 6px`、`row-gap 0`、`column-gap .8em`、行内
`gap .5em`），在下限字号上再换回一列和一行。搜索顺序变成 **正常 → 紧凑** 两档，两档都塞不下就让
**框子去找内容**：按紧凑档实测 `scrollH + 边框头部` 长高（上限是它下方剩余空间），然后再跑一次搜索，
通常还能退回到正常档。三个细节：

- 紧凑档改了 padding，`clientWidth/clientHeight` 跟着变，所以每一档都要**重新量框**，不能一次量完全程；
- 拖角过程中**不长高**（`statsPlateResizing`）：手指才是框子的大小，此时长高就是把底边从握把下面抽走，
  下一个 touchmove 又缩回去，看起来就是抖。改为松手时（`end()`）先 fit 再 `saveStatsPlateGeom({})`，
  存的永远是用户最终看到的那个尺寸；
- 屏幕本身比这张表还小时（横屏矮窗口），仍然保留滚动作为兜底，此时取「装得下的最宽列数」。

1.2.9 装机后**继续缩就露底了**：框子一旦矮过它自己的标题栏，`.stats-content` 的 `clientHeight` 是
**0**，而 fit 开头写着 `if (!availW || !availH) return;`——量到 0 就当作「测不了」直接退出，于是**越缩
越救不回来**（实测 96×40：`scrollH 115 / clientH 0`、十行全裁、紧凑档也没挂上）。1.2.10 把这条改成
「宽为 0 才退出，高为 0 是最该长高的那种输入」：搜索自然全部失败 → 落到长高路径。同一处再补一刀：
长高前先按**装得下的最宽列数**回写 `--stats-cols` 再量 `scrollHeight`，否则量到的是搜索残留的三列表格
——96px 宽的框子里三列意味着「行很少但横向溢出」，长高就长错了方向。

### 3. 画面捏合缩放，别的地方一律不动（1.2.8）

`transform: scale()` 落在**格子内的 `<video>`** 上，格子本来就 `overflow: clip`（带 `hidden` 兜底），
所以放大后的画面被自家格子剪住：宫格、摄像头角标、HUD、详细数据卡片、控制条都在这个盒子外面。
两指才启动（`e.touches.length !== 2` 直接 return），`preventDefault()` 抢在 WebView 把它花成页面缩放
之前——`setSupportZoom(false)`/`textZoom 100` 那颗钉也在。缩放下限 **1×**（帧是证据，缩成图章没人需要），
上限 6×；中点平移按溢出量夹住，`--feed-pan-x/y` 与 `--feed-zoom` 一起写在格子上。转屏/换事件/切布局
一律 `resetFeedZoom()`，因为旧溢出是照旧盒子量的。

实测（真双指，CDP `Input.synthesizePinchGesture`）：单路画面 `--feed-zoom 5.59`、`matrix(5.59,…)`，
其余五路 `1`，`documentElement.style.zoom` 仍是 `none`；反向捏回 `1.33`。**只有一格变了。**

顺带查出来的（1.2.9 修）：HUD 是**整幅底的渐变带**，`.show` 给了它 `pointer-events: all`，于是控制条
显形时，落在「进度条与按钮之间空隙」里的捏合/亮度/横滑全部被这条带子吃掉——第二次捏合就是这么没的。
三处判断改用 `blocksFeedGesture(target)`：只让 `button/input/select/.progress-container/.speed-control`
和两张浮层拦手势，带子的空白处交还给画面。

但 1.2.9 装机复测时那条带子**还是吃掉了一次捏合**（在 `y=700`、即 HUD 渐变带 `696..824` 里捏，六路
`--feed-zoom` 全是 `1`）。原因不在 guard，而在**挑格子**的那一步：`tileAt()` 用
`elementFromPoint` 命中，命中到的是带子本身而不是 `.video-container`，于是 `cell` 为空直接 return。
guard 放行 ≠ 手势落地。1.2.10 给 `tileAt()` 补了几何兜底：命中失败时改按矩形包含关系找**盖住这个点**
的那一格（宫格各格互不重叠，结果与命中测试一致；单路时 HUD 带正压在画面上，这才把画面找回来）。

### 4. 倍速加到 4×/8×（1.2.8）

六档：`0.5 / 1.0 / 1.5 / 2.0 / 4.0 / 8.0`。六行放不下横屏那一列，所以菜单打开时先
`scrollIntoView` 到当前档，`max-height: 60vh/60dvh` + `overflow-y: auto`；`tdashcam.playbackRate`
照旧记住上次那档。实测列表 `["8.0","4.0","2.0","1.5","1.0","0.5"]`，重启后 1.5× 回到六路
`playbackRate` 上。8.0 那一次真点击因为模拟器被六个解码器压到 ANR（`Davey! duration=1502ms`、
load 4.87）而重跑，落在 1.2.9 那遍测。

### 5. 适配更多机型 / 分辨率 / 系统版本（1.2.8 + 1.2.9）

- **老 WebView 静默失效**：不认识的选择器不是忽略那一条，是**整条规则作废**。`:has()`(105)、
  `aspect-ratio`(88)、`inset`(87)、`calc(100dvh - x)`(108) 四处都补了朴素孪生规则，`--viewport-h`
  在 `@supports (height: 100dvh)` 后面兜底；华为/荣耀那批冻结在 Chromium 83~99 的机器靠 body 类镜像
  （`installLegacyWebViewFallbacks()`，只在引擎不支持时才挂观察者）。
- **窄屏**：320~380px 是布局开始装不下原有 padding 的宽度（老 Redmi / Galaxy A 系、折叠屏外屏），
  新增 `@media (max-width: 380px)`：抽屉 92%、倍速行 padding、导出面板 padding、tab 标签 .62rem。
  高度受限的查询抓不住宽度受限的机器，这是原来漏的那一半。
- **多分辨率实测**（`devtools/fit-sweep.sh`，改 `wm size`/`wm density` 后逐档量）：`1080x2280@480`(CSS
  360×760)、`720x1600@320`(360×800)、`1440x3200@560`(720×1600)、`1280x800@320`(640×400 横屏)、
  `800x1280@320`(400×640) 五档全部 `hOverflow 0 / vOverflow 0`，底部五个 tab 完整在屏内。
  **一个必须知道的副作用**：改 display size 会让系统**重建 Activity**，播放暂停、卡片关闭——所以模拟器
  上「换分辨率后手势像失灵」多半是页面已经回到初始态，不是代码问题（本轮就为此白查了一轮）。
- **触摸目标与按压反馈**：按 iOS 的习惯补齐 `:active` 反馈、去掉 `-webkit-tap-highlight-color` 的蓝块、
  底部抽屉加了 grabber 横条；长按上下文菜单改成 iOS 的**分组卡**（行无圆角 + 分隔线，卡片 `overflow:hidden`
  裁圆角，否则首末行会糊到圆角外面）。
- **不联网也能起**：flatpickr 的 CSS/JS（含中文语言包）从 jsdelivr 改为 `src/vendor/` 本地文件。
  这条对国内机器不是洁癖——jsdelivr 在大陆经常连不上，而 `script.js` 里 `flatpickr(...)` 是**裸调用**，
  CDN 挂掉等于启动即抛异常。剩下唯一一处 CDN 是桌面端 FFmpeg WASM（懒加载，安卓走原生编码器，
  不在手机路径上）。

### 6/7. 排查到的其他问题

- **握把落在系统返回手势区里**（真机级故障）：卡片默认 `right: 10px`，24px 握把的中心只在屏幕内 22px，
  而安卓的手势返回带约 24dp——实测一次从 x=395 起手的滑动直接**结束 Activity**
  （`Process … has died: cch CRE`、`RecentsView: onTaskRemoved`）。1.2.9 把手机端的边距钉在 28px
  （`statsPlateEdgeGuard()`：CSS `right: 28px` + 拖拽 left 上限 + 缩放宽度上限 + 恢复存档时的合法性判断），
  握把中心从此离边约 40px。桌面不受影响。
- **`ResizeObserver loop completed with undelivered notifications` 被当成「页面出错」弹红条**（1.2.11 修）：
  卡片自己也是被观察对象之一，而 fit 又在回调里改写这个框的高度——这正是 Chrome 教科书式的自观察环。
  它不是失败（浏览器只是把多出来的通知推到下一帧），但 E23 的错误兜底把它原样抬成了红色横幅，压在
  用户正在看的录像上。两处一起改：回调**挪到下一帧并合并**（`statsPlateObserveFrame`，顺带把一次拖拽里
  的十几次重排合成一次），横幅只记诊断不弹屏（`/ResizeObserver loop/i` 与 CDN 资源失败同列 benign）。
- **小按钮的命中区**（1.2.11）：`toggle-sidebar-btn` 34×37、搜索框的 `×` 24×24，按 iOS 的做法**只放大
  命中区不放大图形**（`::after` 外扩 9px → 52×55 / 42×42），并且用长写法而不是 `inset`，让华为/荣耀那批
  冻结在 Chromium 83~99 的机器也点得到。
- **模拟器 ANR**：六路同时解码把 guest 打满（HWUI `Davey! 700-1500ms`、2.5GB 内存），输入分发超时报 ANR，
  ANR 框还在时 `adb input tap` 全部无事件。这是环境不是代码，但测的时候要知道：先 `dumpsys window | grep
  mCurrentFocus` 确认焦点在 `com.tdashcam.studio`，必要时 force-stop 重启。
- `grep -o "mDisplayRotation=ROTATION_[0-9]"` 会把 `ROTATION_90` 截成 `ROTATION_9`——加个 `*`。

### 探针（本轮新增）

`probe-r30-state.js`（一次回全套：z 阶梯、抽屉卡片三点命中、卡片 fit 的 `scrollH/clientH/裁掉的行`、
倍速档位与当前值、六路 `--feed-zoom`、视口与 `jsErrors`）、`probe-plate-fit.js`（卡片与握把矩形 +
`--stats-font/--stats-cols` 实际值）、`probe-plate-rows.js`（每行文字与宽度，用来定紧凑档的 gap）、
`probe-tiles.js`（六格矩形与 `video` 的 computed transform）、`pinch2.mjs`（CDP 原生捏合，
`Input.synthesizePinchGesture`）、`arm-touchlog.js`（`.player-area` capture 记 `__pinchLog`，用来分辨
「手势没送到」和「送到了但被 guard 拦了」）。

> `pinch.mjs` 手写两指 `touchPoints` 在这台 WebView 上只送达**一个** touch（`n:1`），且 `opt()` 不回落
> 默认值会让 `Number(undefined) === NaN` 被 CDP 以「x 需要 double」回绝；捏合一律用 `pinch2.mjs`。

### 装机实测（1.2.11，模拟器 x86_64 412×915 / DPR 2.625，全部真点击 / 真捏合）

- **1 抽屉不再被卡片压住**：竖屏开抽屉后 z 阶梯实测 `sidebar 1650 / overlay 1600 / plate 1500`，抽屉卡片
  上部/中部/下部三点 `elementFromPoint` 全部命中抽屉自己；横屏同测。长按上下文菜单（1800）在抽屉开着时
  5 行逐项命中 `ok:true`。
- **2 卡片在任意自定义尺寸下都显示完整内容**：存档里那个 `96×40` 的框（`scrollH 115 / clientH 0`，十行全
  被裁）恢复后自动长到 `96×160`；当前实测停留态 `96×136`（紧凑档）`scrollH 100 === clientH 100`、
  `clippedRows 0`。拖小再放手回弹 `96×148 / 112 / 112 / 0`；拖宽 `241×143` 自动变两列 10px；横屏从
  `96×34` 长回 `96×160`。判据统一是 `scrollHeight === clientHeight` 且裁掉的行数为 0。
- **3 捏合只动画面**：`pinch2.mjs` 在两格之上捏合 → 六路 `--feed-zoom` 实测
  `["1","1","2.43","1","1","1"]`（只有被捏的那一路变），`documentElement.style.zoom` 仍是 `none`，
  卡片矩形 / HUD / 宫格类名一字未改。控件带内（HUD 盖住画面的那一条）也能捏，靠的是 `tileAt()` 的几何回落。
  注意 `(206,700)` 捏不动**不是 bug**：`__pinchLog` 显示第二指的 target 是 `progress-handle`，那是进度条，
  本来就该挡（`blocksFeedGesture()`）。
- **4 八倍速**：菜单六行 `8.0/4.0/2.0/1.5/1.0/0.5`；真点 8.0 → 六路 `playbackRate` 全 8、按钮标签 `8x`、
  `tdashcam.playbackRate` 存成 `"8"`；重开后档位标签同步；点回 1.0 → `[1]`。
- **5 多机型/多分辨率**：上节五档 `fit-sweep.sh` 全 `hOverflow 0 / vOverflow 0`；启动资源列表里已无 CDN
  （flatpickr 走 `src/vendor/`）；小按钮命中区外扩 9px 后 `×` 42×42、汉堡 52×55。
- **6/7 其他**：握把边距实测 `rightGap 28 / grip 29`，从握把起手滑动不再结束 Activity；`alert()` 25ms 返回、
  `.toast-container` 里就是那句话、`__tdashcamErrors` 0 条、错误横幅 `banner:"none"`（1.2.10 之前那一条
  ResizeObserver 红条已不再出现）。

## 第二十五轮：安卓平板、U盘直读、关于页（1.2.12 / 1.2.13）

三条：适配各种型号 / 各种分辨率 / 各种系统版本的安卓**平板**；插上特斯拉行车记录仪的 **U盘就能直接读**；
「更多」里加一个**「关于 APP」**——版本号、参考的 GitHub 链接、反馈 bug 联系微信 singcong、好用可以扫码
打赏（二维码这轮先放一张假的）。

### 1. 平板：把「这是块触摸屏」和「这块屏有多大」分开判

前面几批的手机布局一直靠**尺寸**门控（`max-width: 768px`，或横屏 `max-height: 620px`），平板是整个漏掉的：
8~11 寸机器的 CSS 宽在 800~1280 之间，两个条件都不满足，于是它拿到桌面版布局——抽屉常驻吃掉 300px、没有
底部动作栏、⋮ 里那些 `phone-only-btn` 入口根本不渲染。

改成按**输入方式**判：`(hover: none) and (pointer: coarse)`。这台模拟器 WebView 实测 `matches === true`
（同时 `pointer: fine` 为 `false`、`maxTouchPoints 5`），所以它不是只能祈祷真机的条件，在模拟器上就能验收；
而桌面浏览器——包括把窗口拖到 500px 窄——鼠标仍在，一个字都不变（这是硬约束）。JS 侧 `PHONE_LAYOUT_QUERY`
和 CSS 里 16 处 media query 同步扩这半句，**两边字符串必须一模一样**，否则 JS 和 CSS 会就「现在是不是手机
布局」各说各话（抽屉宽度、层级、`header-collapsed` 全依赖它）。

尺寸判对了，几何就露馅了，所以再加**平板档** `@media (hover: none) and (pointer: coarse) and (min-width: 769px)`：

- 抽屉 `min(58vw, 380px)`。手机档是 `min(78vw, 312px)`，58vw 在 1280 上是 742px，所以 **px 上限是必需的**，
  不能只给百分比。
- 底部玻璃胶囊与长按菜单：手机档写的是 `left:14px; right:14px`，在平板上就是一根 1252px 宽的横条。改为
  `left: max(16px, calc(50% - 280px)); right: auto; width: min(560px, calc(100% - 32px))`。**用 left/max()
  居中而不是 `transform: translateX(-50%)`**，因为隐藏动画正占着 `transform`（`body:not(.sidebar-collapsed)
  .phone-action-bar` 靠它把胶囊滑走）。
- ⋮ 面板在平板仍是「带中文标签的竖列表」——44px 图标方阵是给 412px 高的横屏手机的答案，平板没这个高度问题；
  相应把行高抬到 44dp、加 `max-height + overflow-y`。**行数按截图里数出来是 14 行**（含新加的「关于」），
  不是当初写这段时以为的 9 行——14 × 44 已经高过 768 平板档窗口里那点可用高度，所以这条 cap 真的会被碰到。
- **竖屏宫格**这条是回头补的：`@media (orientation: portrait) and (max-width: 768px)` 里那套「格子按 16:9
  自己定高度」（1.1.6 为解决大片黑边做的）同样按尺寸门控，800px 宽的平板竖屏一样漏在外面，于是又变回
  `repeat(3, 1fr)` 分高、格子一半以上是黑的。补一条 `(orientation: portrait) and (hover: none) and
  (pointer: coarse)` 并列即可；横屏平板（1280×800）用桌面三列两行本来就合适，不用管。

`html.touch-ui` 是兜底：`markTouchUi()` 只看**运行环境**是不是安卓，不看 media query。个别 ROM（ChromeOS、
三星 DeX /  Ready 模式、接了鼠标或触控板的平板）会报 `pointer: fine`，那几条「绝不能丢」的规则——底部动作栏、
长按菜单、⋮ 里的手机入口——由这个类托住。**刻意只放 `display` 类规则**：任何带尺寸或 `flex-direction` 的
`html.touch-ui` 选择器都会以更高特异度压掉横屏手机那套 44px 方阵，等于修一处坏一处。

#### 逐档扫平板才露出来的三条（都在 1.2.13 补）

先说**测法**，因为第一版 sweep 的档位本身是错的：`wm size` 收的是**物理像素**，CSS 视口是
`物理 / (density/160)`。照「1280×800 平板」写 `wm size 1280x800` + `wm density 320`，拿到的是
**640×400 dp**，那根本不是平板档而是矮窗口，`tabletLayout:false`、胶囊被手机规则拉成 612px 宽——看着像
「平板适配失败」，其实是档位没造出来。要 1280×800 dp 就写 `2560x1600 320`。现在的档位（CSS dp）：
1280×800、800×1280、960×600、1024×768、1093×820、1280×720、1067×1707。

- **`max-height` 把 ⋮ 的行压扁了，而不是让它滚**。平板档给行写的是 `height: 44px !important`，但这些行是
  `display:flex; flex-direction:column` 容器的子项，**`flex-shrink` 默认是 1**：14 行 × 44 = 630px 装不进
  1024×768 那 594px 的 cap，浏览器就把每行缩到 39~40px，于是 `overflow-y:auto` 永远不触发——触控目标
  低于 44dp，而且「面板能滚」这件事从来没发生过。1093×820、1067×1707 因为 cap 够高所以看不出来，只有矮档
  暴露。补 `flex: 0 0 auto !important` 后行回到 44px，`scrollHeight 650 > clientHeight 624` 当场成立。
  连带一个测试脚本的问题：「关于」是最后一行，矮档下它现在**需要滚进视口**才能点，sweep 里要在 tap 之前
  `scrollIntoView({block:'center'})` 再重新量中心。
- **关于页在横屏平板上不出身**。平板档给的是 460px 单列，1024×768 / 1093×820 实测内容 **716~721px** 而可用
  只有 658 / 708——`fits:false`，打赏码下面挂着一根滚动条，正是这张卡最不该有的东西。横屏平板改两列
  （680px 宽：左列标题/版本/两行事实/GitHub/反馈/许可，右列 logo + 168px 码），量到 1024×768 → 402、
  1093×820 → 401、1280×800 → 402、960×600 → 391，全部 `scrollHeight === clientHeight`。竖屏平板
  （800×1280 → 706、1067×1707 → 716）单列本来就放得下，不套这条。
- **矮一截的横屏平板被当成手机了**，这条是前两条修完、按新档位复扫时才现形：**960×600 和 1280×720 dp
  满足手机横屏那道门**（`max-height: 620px`），于是它们拿到的是给 412px 高的横屏手机设计的答案——⋮ 变成
  14 格**纯图标方阵、中文标签 `display:none`**（而触摸设备没有 hover，tooltip 也救不回来），关于页则是
  108px 的小码。宽度分不开两者（横屏手机 915~1040px，平板从 800px 起），**高度分得开：没有手机侧过来还
  有 501px 高，而在乎的平板没有低于 501 的**。所以文件最末尾加一档
  `(hover:none) and (pointer:coarse) and (orientation:landscape) and (min-width:769px) and (min-height:501px)`，
  把「带标签的竖列表 + 能滚 + 两列关于」还给这个带。它**必须排在横屏手机那两条之后**：手机档的
  `.btn-text{display:none}` 是 `!important`，只有同等特异度、更靠后的 `!important` 压得住；而 915×412 /
  1040×480 这类真手机因为 `min-height` 不满足，仍然留在紧凑方阵里。
- 顺带：目录浏览器的「上一级 / 进入 / 路径框」在平板上是 **38px**（手机靠 `--field-h` 才有 44），平板档
  统一 `min-height: 44px`。

### 2. U盘直读：缺的不是 USB 权限，是「挂到了哪」

之前记的「本版不做 OTG 直读」判错了一件事：读 U 盘上的 MP4 **根本不需要** USB API。TeslaCam 就是普通文件
系统，插入后由系统以 Mass Storage 挂载（`/storage/UsbDriveA`、`/storage/usbdisk1`、`/storage/1234-5678`，
各家命名不同），已有的「所有文件访问」权限足够。真正缺的是**可发现性**——没人知道该往路径框里打什么，而
目录浏览器原本就是照着「打字」设计的。

Rust 侧一行未改：`storage_volumes()` 本来就在扫 `/storage`，`find_media_locations` 会走到底。补的是三层：

- Kotlin `storageVolumesJson()`：先问 `StorageManager.getStorageVolumes()`（它有人话名字，也知道是不是
  primary / removable），再扫 `/storage` 兜底，按路径合并；每个卷直接带 `entries`（子项数，**-1 = 读不到**），
  另外单独带 `usbDevices = UsbManager.deviceList.size`。为什么要两路：若干 OEM ROM 的 `getStorageVolumes()`
  不列可移动卷，而 `StorageVolume.getType()/getState()` 是 `@SystemApi`（编译期就拿不到），状态只能从
  `directory` + `listFiles()` 反推。`getStorageVolumes()/getDirectory()/getDescription()` 都比 minSdk 24 新，
  三处一律包在 `runCatching` 里而不是判 SDK 版本——没有的 ROM 就当它没报，下面的 `/storage` 扫描自己会答。
- 目录浏览器多一排 chips（`.dir-volume-*`）：每个卷一颗，外接的紫边区分；`list_subdirs` 回来一旦发现含
  `TeslaCam` / `RecentClips` / `SavedClips` / `SentryClips`，就**把这颗 chip 的 `data-path` 直接改写成那个
  文件夹**再挂个绿色「含 SavedClips」角标——「插上就播」应当是一次点击，不是四次浏览器跳板。读不到的卷
  `disabled` + 虚线边框，不让点出一句「目录为空」。角标是异步补的（`probeVolumeBadge`），一排 chip 不会
  为了它各等一次 IPC。
- 「有 USB 设备、但系统没挂出可读的卷」单独提示（`usbNotMounted`）：U盘要 exFAT / FAT32 才可能被安卓挂上
  （NTFS 部分机型只读或不支持），而 OPPO / vivo / 小米 / 荣耀 默认**关着 OTG 供电**，得去设置里开「OTG 连接」。
  这句话必须显示，否则「插了没反应」和「App 坏了」在用户那边是同一件事。
- 挂载变化**没有普通应用收得到的广播**（`ACTION_MEDIA_MOUNTED` 那一族早就只对系统开放），所以
  `setupVolumeWatcher()` 在 `visibilitychange` / `window focus` / 每 12s 三处轮询，签名是 `path:entries` 的
  拼接：只有新出现的外接卷才 toast，浏览器开着就当场重排 chips（`storageVolumesPayload` 先置空再取）。
- manifest 只加 `<uses-feature android:name="android.hardware.usb.host" android:required="false"/>`：声明
  能力但不要求，没有 OTG 口的平板不该因此在商店里被隐藏。

顺带把 `copyDiagnostics()` 补了两行：`device / android / layout(phone|tablet) / coarse / touchUi`，以及
`volumes=路径:条目数 | … usb=n`。「底部栏不见了」和「U盘读不到」这两类反馈各自就都带上了判据。

### 3. 关于页

⋮ 面板 GitHub 那颗下面加 `#aboutBtn`，class 是 `phone-only-btn`——桌面那五项菜单因此一字不动。面板内容按
「一张截图能不能把这条 bug 说清楚」来排：

- logo + 渐变大字版本号 + `版本 / 本机` 两行事实。本机是 `Build.MANUFACTURER + MODEL · Android x · API n ·
  W×H`，来自 `pushState()` 新增的 `device` / `android` 两个字段——页面自己读不到这两样，而「数据卡被裁一半」
  在小米平板 13 上和在一部 Pixel 手机上不是同一个问题。
- GitHub 整行可点，走 `TDashcamNative.openExternal`：`plg:opener` 在移动端构建里没注册，`window.open` 在这
  个 WebView 里哪也不去，activity 是唯一出路（原生那侧只放 http(s)）。
- 反馈文案 + 一键复制微信号 `singcong`。微信号只在 JS 里写了一处（`ABOUT_CONTACT`），复制、显示、toast 都从
  它取——抄错一次就是每个用户都会发错一次。
- 打赏区：白底卡片托二维码（扫描要亮而静的边，深色主题下也不能省），下面一行说明。图是 `src/imgs/donate-qr.svg`，
  一张**确定性的假码**：29 模块，定位 / 定时 / 校正图形齐全，中心一个咖啡杯，看着是 QR 但扫不出东西；真码
  到位时只替换这个文件。
- 布局上唯一别扭的是 915×412 的横屏手机：412 CSS px 高，单列的内容要 640px，二维码直接掉到折叠线以下、
  卡片自己滚。改成**两栏 grid**（`grid-template-areas`：左列版本 / 两行事实 / GitHub / 反馈 / 许可，右列
  logo + 打赏框），面板 `min(640px, 100%)`、右栏 172px、码 108px——172 是让说明文字刚好两行不断行的最窄
  宽度。实测 `scrollHeight 298 === clientHeight 298`，判据仍是「这张卡不该有滚动条」。**这一段要排在
  平板档那条之后**（平板档 `min-width: 769px` 同样匹配 915px 宽的横屏手机，两档重叠的高度带靠
  `min-height: 501px` 分开，见 §1 最后一条）。

### 4. 装机自查抓到、1.2.13 才补的四处

- **冷启动的关于页在说谎**。四条 `pushState()` 全在 WebView 还在导航时发出，`window.__tdashcamStorage`
  于是是 `undefined`，`readNativeStorageStatus()` 退到 localStorage 缓存——那份缓存是**上一个版本**写的，
  结果刚装好的 1.2.12 在关于页显示 `v1.2.11`，`API 36 · 412×915` 而不是机型名。按 HOME 再进来就正常，
  因为 `onResume` / `onWindowFocusChanged` 会再推一次，这正是「明明改了版本号，截图里还是旧的」的来源。
  修法是给桥加一条**同步取**的路：`stateJson()` 从 `pushState()` 里抽出来，`NativeBridge.nativeStatus()`
  直接返回它，JS 侧 `pullNativeStatus()` 取一次就 memoize（`@JavascriptInterface` 跑在 WebView 的 JS
  线程上，每次读都跨一次线程不划算）。live push 仍然优先，所以夜间模式翻转照旧是 push 驱动。
- **`word-break: break-all` 把「Android 16」切成了两行**（`Android 1` / `6`）。它本是为了让
  `Google sdk_gphone64_x86_64` 这种长 token 能拆；`.about-fact dd` 改成 `overflow-wrap: break-word`
  就两全——只在整词放不下时才拆。
- **手机自己那块存储以前不探 `TeslaCam`**：`renderStorageChips()` 里那句 `if (volume.kind !== 'internal')`
  把角标只给外接卷。但 1.2.12 之前的既定工作流恰恰是「把 TeslaCam 拷到手机里」，日常最常用的一颗 chip
  反而没有「含 SavedClips」角标和一键跳转。现在每个卷都走 `probeVolumeBadge()`，角标仍是异步补的。
- **每一张弹层的 `×` 都只有 13×24**（`.close-modal-btn` 是纯文字 `&times;`，只有 `.clip-modal` 给了它
  一个 28px 圆底）。第二十四轮那条「小按钮命中区外扩 9px」只写在 `.clear-date-btn / .toggle-sidebar-btn`
  上，没管弹层。判据不是量矩形而是 `elementFromPoint(中心 ± 14px)`：修之前四点里三点打到标题或面板本体，
  修之后（`::after` 外扩 `top/right/bottom -10px、left -16px`）四点全命中自己。左边界给得最宽，因为按钮
  钉在右上角，另外三边本来就出面板了。同档把卷 chip 的 `min-height` 从 38 抬到 44、「复制微信号」从 40
  抬到 44。

### 5. 装机实测（1.2.13，模拟器 x86_64 / API 36，全部真点击）

交付包 `TDashcamStudio/TDashcam-Studio-1.2.13-android-universal.apk`（27,336,231 字节，arm64-v8a + x86_64），
两个 ABI 的 `libtdashcam_studio.so` 与 `target/<triple>/release/` 里那份逐字节对上。
**`SO_MATCH` 的 APK 内路径是 `lib/arm64-v8a/` 和 `lib/x86_64/`**，不是 Rust 的 target triple：照
`lib/aarch64-linux-android/…` 去 `unzip -p` 会得到一个 0 字节的文件，`cmp` 于是报「不一样」，看着像
「APK 是旧的」，实际是路径拼错。

七档 sweep（`bash devtools/tablet-sweep.sh`，日志 `devtools/r25-tablet-sweep-build5c.log`）：

| CSS 视口 | 平板档 | ⋮ 行 | 中文标签 | 面板可滚 | 关于面板 | `fits` | 溢出 / JS 错 |
|---|---|---|---|---|---|---|---|
| 1280×800 | ✓ | 14 × 44 | ✓ | 650/624 | 680×404 | ✓ 402/402 | 0 / 0 |
| 800×1280（竖） | ✓ | 14 × 44 | ✓ | 650/650 | 460×723 单列 | ✓ 721/721 | 0 / 0 |
| 960×600 | ✓ | 14 × 44 | ✓ | 650/436 | 680×393 | ✓ 391/391 | 0 / 0 |
| 1024×768 | ✓ | 14 × 44 | ✓ | 650/594 | 680×404 | ✓ 402/402 | 0 / 0 |
| 1093×820 | ✓ | 14 × 44 | ✓ | 650/644 | 680×402 | ✓ 401/401 | 0 / 0 |
| 1280×720 | ✓ | 14 × 44 | ✓ | 650/550 | 680×402 | ✓ 401/401 | 0 / 0 |
| 1067×1707（竖） | ✓ | 14 × 44 | ✓ | 650/650 | 460×718 单列 | ✓ 716/716 | 0 / 0 |

每档另外还量到：抽屉 380px、底部胶囊 560px 居中、目录浏览器两颗卷 chip（`Internal shared storage` +
`SDCARD`）都是 44px 高且带「含 TeslaCam」角标。960×600 和 1280×720 这两档就是 §1 最后一条说的「矮一截的
横屏平板」，修之前它们是 `rowText:false` + 纯图标方阵 + 108px 小码，现在和 1280×800 同一套。
竖屏手机 412×915 复测：关于页 388×719、`scrollHeight 718 === clientHeight 718`、168px 码在视口内，
新加的横屏平板档（`min-width: 769px` + `min-height: 501px`）没有伸手到手机上。

**sweep 本身有两个假阴性来源，都是这一轮踩出来的**：

- **档位之间状态不清零**。`wm size` 重建 Activity 但 WebView 的 DOM 还在，所以每一档是**接着上一档的界面**
  开始的：上一档留着的关于页、目录弹窗、尤其是**开着的抽屉**，会让第一记真点击打在遮罩上而不是底部胶囊
  上。竖屏平板那两档一开始报 `about.shown:false`，看着像「平板关于页打不开」，实际是 ⋮ 面板从来没被那一
  击打开（`[more]` 探针里行高还是 43 而不是 44，就是面板关着的信号）。现在 sweep 在每档量之前先跑一次
  清理：关掉所有 `.modal-overlay.show`、摘掉 `.header-right.active`、`viewer.toggleSidebar(false)`。
  **手写 `body.classList.add('sidebar-collapsed')` 没用**——抽屉的开合由 App 自己的状态渲染，会被下一帧
  改回去，必须走它的 API。
- **⋮ 面板有自动收起计时器**。手工一条条敲命令复现时，「量 aboutBtn 中心」和「tap 那个中心」之间隔了
  5~10 秒（每条 CDP 调用一次 WebSocket 往返），面板自己已经收了，`elementFromPoint` 报
  `playerArea.player-area empty`，看起来完全是「关于这个按钮点不动」。**这类几何/交互判据只有在同一趟脚本
  里 1 秒内跑完才可信**；面板确实开着的最硬证据是 `[more]` 那一趟的 `rowH:44`。

### 探针（本轮新增）

`probe-r33-r25.js`（一趟回全套：`screen` 里 media query 与两个布局判定的结果、`doc.hOverflow/vOverflow`、
`geometry` 的抽屉宽/胶囊宽/`--gutter`/`--field-h`/安全区、`menu` 的 ⋮ 行数与是否滚出面板、`chips` 一排卷
的 label/kind/path/角标、`about` 的面板尺寸与 `fits`、`smallTouch` 里小于 40px 的触控目标、以及
`errors`/`banner`），配 `tablet-sweep.sh` 逐档改 `wm size`/`wm density` 跑它。档位按**目标 CSS dp 反推物理值**
（`2560x1600 320` → 1280×800 dp、`1024x768 160` → 1024×768 dp、`2048x1536 300` → 1093×820 dp，共七档），
直接照物理尺寸写会造出一个矮窗口而不是平板，见 §1 那段。sweep 在点「关于」之前要先把它 `scrollIntoView`：
行高不再被压扁之后，最后一行在矮档里是需要滚进来的。每档开头还有一次**状态清理**（见 §5 第一条），
每档的关于页顺手存一张 `devtools/shots/r25-<css视口>-about.png`。

`r25-inject-tablet.js` 是这套几何的**快速判据**：把候选 CSS 当成 `<style>` 注进当前页面，立刻回
`panel / scroll / fits / qrBottom / rowHeights / groupScroll`。平板档的尺寸问题值不得一次 5 分钟构建，
注入一轮 30 秒就能把六档判完，判完才写进 `styles.css`。注意注入的规则在文档顺序上排最后，会盖住同一条
media query 的已发布版本，所以它**只能验单档几何，不能验跨档优先级**（横屏手机那条和横屏平板那条谁赢）。

> `wm size` / `wm density` 会**重建 Activity**，所以每档之间页面状态归零：想连着验「插上U盘 → 一键跳转」
> 这类链路，得在同一档里做完，别指望 sweep 保留状态。

`probe-r34-coldstart.js` 专门盯冷启动那三个字段：`livePush`（push 到底到没到）、`pulled`（直接问原生
`nativeStatus()` 的答案）、`cached`（localStorage 里那份旧缓存）、`resolved`（`readNativeStorageStatus()`
最终采用哪个），再加上关于页实际渲染出的 `facts` 和 chips 角标。判据很简单：`resolved.version` 必须等于
`pulled.version`，且两者都等于 APK 的版本名。

## 第二十六轮：列表真帧、分类分段、胶片时间轴（1.2.14 – 1.2.19）

拿着 iOS 那款 TCam 的十张截图对了一遍之后列出七条，用户回的是「左柱/右柱这个不用改，只是说法的区别。
其他按照你的节奏来修改吧。」——于是除「导出水印烧录」推到下一批外，这一批全做：真帧缩略图、分类分段控件、
中文日期带星期、删除单个事件、U盘两步向导、时间轴胶片、时间轴事件标记可点。**「左柱/右柱」这一条按用户
判断作废**，不做措辞统一。

### 1. 列表缩略图：从灰底图标换成视频真帧（R26-1）

`thumb.png` 经常不存在，于是手机上大半列表是一排灰底播放键——它回答不了「这是哪一段」。改成**解码一帧当缩略图**：

- 取第 1 秒（`FRAME_THUMB_SECONDS = 1`）：黑场片头已经过去，又还在第一个帧组里，不需要深 seek。
- **只给看得见的行取**：`IntersectionObserver` 挂住 `.video-thumbnail`，滚动到哪取到哪，而不是 render 时
  把整份列表一次性推给解码器。
- `FrameFetcher` 是一层带 LRU（400 条）的缓存 + 并发闸（`MAX_LIVE: 2`）。缓存里存 `null` 表示**这支片子
  已经拒绝过**，下次滚回来不再问；而「慢」不写进缓存（`permanent !== false` 才 `remember`），所以一次
  超时不会让这张卡片永久没有图。

### 2. 分类：下拉框换成一排带数量的分段按钮（R26-2）

手机上 `<select id="eventFilter">` 点开是系统那套浮层，选一次要两下，而且看不见「盘上到底有几段」。
新增 `#typeSeg` 四颗 chip（全部 / 最近 / 保存 / 哨兵），**数字按整次扫描统计**，所以选中某一类时数字不会
跳。两个刻意的决定：

- 它是 `#eventFilter` 的**替身不是替代**——点击写回同一个 `<select>` 再走原来的 `change`，桌面端那个
  下拉框一行逻辑都没动。
- **0 的那颗置灰但留着**：「扫过了，这类没有」是信息，chip 直接消失会被读成「特斯拉没有这种录像」。

### 3. 日期：`2026/10/08 19:33:34` → `10月08日 周四 07:30`（R26-3）

一行卡片只有 96px 高配两行文字，原来的格式把一整行花在没人按的年号和没人读的秒上，而真正用来回忆
「哪一段来着」的**星期**反而没有。`formatCardTime()` 只在 `isPhoneLayout()` 下换格式，桌面仍是全量时间戳。

星期是**手写数组**（`WEEKDAY_NAMES`），不是 `toLocaleDateString({weekday:'short'})`：多家 OEM 的 WebView
不管应用语言，一律回英文 `Tue`，这条在 1.2.x 之前就踩过。

### 4. 删除单个事件（R26-4）

长按卡片 → 「删除事件」→ 确认面板列出这次会删掉的具体文件（`#deleteConfirmList`，行名剥掉公共目录前缀，
不然六行全是同一个长路径），`#deleteConfirmSummary` 给「N 个文件 · 约 X MB」。真删走
`TDashcamNative.deletePaths`（Kotlin 侧 `deletePathsJson`），它只认**形如 `YYYY-MM-DD_HH-MM-SS` 的事件目录**
（`EVENT_FOLDER` 正则），路径不匹配就整批拒绝——这是「删一个事件」和「删掉整个卷」之间唯一的护栏。

一个必须写在前面的动作：**要删的事件如果正在播放，先 `multiCameraPlayer.cleanup()`**。开着的文件删不掉，
而解码器正握着它的全部片段。删完从 `allFiles` / `eventGroups` 里摘掉再 `filterAndRender()`，不重新扫描。

### 5. U盘：两步图文向导与拔盘提示（R26-5）

上一批加了「存储位置」chips，但**第一次插 U盘的人仍然不知道下一步是什么**。补 `#usbGuide`：两步
（① 系统设置里开 OTG 连接 → ② 回到「存储位置」选那颗 U盘 chip），文案里的 `{row}` / `{apply}` 运行时换成
本机实际看到的系统条目名（「存储位置」/「应用目录」），不硬编码某家 ROM 的菜单路径。
`viewer.usbGuideForced` 让「检测到U盘但没挂上」这条分支**强制出现**向导，`localStorage` 记一次关闭就不再打扰。

### 6. 时间轴胶片：这条花了四个版本，因为真正的坑在解码器（R26-6 / R26-6b）

剪辑条原本只有 4px 的线 + 两个手柄，能说明「在第 12 秒松手」，但说不出第 12 秒**是什么画面**。加一排
`.filmstrip-cell`（4~10 格，按进度条宽度 56px/格算）浮在尺子上方，每格是那一时刻的真实画面。

**实现是对的，画面出不来**：1.2.15 上六格里只有两格有图（那两格恰好命中缓存），其余全部 15 秒超时。
用 `devtools/probe-r26-decoder.js` 做 A/B——同一次取帧，六路播放器**在场时 14.4s**、把六个 `src` 摘掉后
**10.5s**——结论是这不是死锁而是**每次都慢**：`FrameFetcher` 的并发闸是 2，六格要排三轮，而单轮已经贴着
15s 超时线。1.2.16 补的「`seeked` 不送达但 `currentTime` 已到位」兜底（`landed`）救不了这种量级，实测仍 0/6。

于是 1.2.17 把取帧搬到**进程内原生解码**：新增 `ThumbFetcher.kt`（`MediaMetadataRetriever` + 单线程
executor + JPEG→base64），`NativeBridge.requestThumb(id, path, millis, width)` 立即返回，结果异步回推
`window.__tdashcamNativeThumb(id, dataUrl)`；JS 侧 `FrameFetcher.grab()` 先走 `grabNative()`，拿不到答案才
落回原来的 `<video>` 路径。**为什么这能成**：WebView 的解码槽是有限资源，六路播放器把它们全占了，第七个
decoder 只能排在整条管线后面；`MediaMetadataRetriever` 在 App 进程里自己解，根本不碰那几个槽。

1.2.17 实测：列表七张卡片 1.4~6.1s 全部出图，但胶片六格仍是 3 成 3 败（`f11 FAILED in 10973ms`）。
日志里的时间戳把原因点破了——**请求的秒数落在文件末尾之外**：

```
f8  ok 4010ms  …/2026-10-08_09-00-00-front.mp4@46523
f11 FAILED 10973ms …/2026-10-08_09-30-00-front.mp4@25658
f12 FAILED 8413ms  …/2026-10-08_09-36-00-front.mp4@58704
```

时间轴是按「一段一分钟」铺的，而模拟器上这批 fixture 每段只有 18.27s，`clipFrameTarget()` 算出的 46s / 58s
在文件里根本不存在；`OPTION_CLOSEST` 遇到这种情况会**一直解到文件尾**，而文件尾附近有些解码器直接回
`null`。1.2.19 三处收口：

- 目标时间先按 `METADATA_KEY_DURATION` **夹到 `duration - 1500ms`**；
- `OPTION_CLOSEST` → **`OPTION_CLOSEST_SYNC`**（取最近关键帧：胶片格要的是「那一时刻附近的画面」，
  不是那一帧本身，而代价从「一路解过去」变成「解一帧」）；
- 仍然拿不到就**回落到 0 秒**——一格偏了几秒的画面，好过一格空白；
- JS 侧 `NATIVE_TIMEOUT_MS` 从 8s 抬到 **15s**：8s 时页面会在原生还在干活的同时自己起一个 `<video>` seek，
  两个解码器抢同一张图，两个都拿不到。

最终 1.2.19 装机：**六格 6/6 出图**，每格 3.3~9.5s（模拟器软件解码；真机硬解会低一个量级），格子是逐格
填上的，不挡手。同时 `body.clip-trimming` 把速度曲线让位（`visibility:hidden`），松手确认按钮可见。

### 7. 时间轴事件标记：那颗点不动的圆点（R26-7）

`event.json` 给出事件发生的精确时刻（碰撞/哨兵触发），在尺子上就是一个红点。原来它是个 `div`，只有
`title`——触摸设备上 hover 不存在，等于纯装饰。改成 `<button type=button class=event-marker tabIndex=-1>`，
`aria-label` 与 `title` 同文案（「跳到事件时刻 · 07:31:07」，时间按应用语言格式化，否则中文界面会念出
`7:31:07 AM`），点击 `seekToTime(timeOffset)`。一个容易漏的细节：`progressContainer` 自己从 `touchstart`
就开始刷进度，所以标记上必须 `stopPropagation` 三件事（`touchstart` / `touchend` / `mousedown`），
否则点圆点会被当成「拖到那个位置」而不是「跳到那一秒」。`tabIndex=-1` 是不让它进桌面的 Tab 环。

### 8. ⋮ 面板把播放控件那一行「留着但按不动」（1.2.16）

这一条是上一轮「⋮ 被详细数据卡片遮挡」的余债：抬层级的同时把面板抬到了 1700，可它是**贴着右下角的窄竖列**，
底边正好落在播放器控件行下面 26px。实测撞位：`aboutBtn` 占 `(228,739,169×48)`，`clipBtn` 中心 `(342,771)`
就在里面，`elementFromPoint(342,771)` 回 `aboutBtn`——**全屏 / 剪辑 / 倍速三个按钮全部可见但全部失效**，
用户看到的就是「点了没反应」。修法不是挪面板而是让这一行让开：

```css
body:has(.header-right.active) .video-controls-overlay { opacity: 0; pointer-events: none; }
```

（`installLegacyWebViewFallbacks()` 那份 `body.more-panel-open` 孪生规则同步加一条。）面板一收就恢复，
实测开面板时 `opacity:0 / pointer-events:none`、关面板后回到 `1 / all`。这也就是别处的工作方式：菜单浮在
传输键上时，传输键本来就该消失，而不是留着一排按不动的图标。

### 装机实测（1.2.19，竖屏 412×915，全部真点击）

| 项 | 判据 | 结果 |
|---|---|---|
| R26-1 真帧缩略图 | 7 张卡片 `img.src` 是 `data:image/jpeg` | 7/7，cache 7，0 失败 |
| R26-2 分类 chip | 四颗带计数 | 全部7 / 最近1 / 保存4 / 哨兵2 |
| R26-3 中文日期 | 「月日 星期 时:分」 | `10月08日 周四 07:30`、`9月29日 周二 12:30` |
| R26-4 删除事件 | 长按→确认面板列文件，取消不删 | 面板列出剥前缀的行名，取消后文件仍在 |
| R26-5 U盘向导 | 强制出现 + 两步 + 一键跳设置 | 三步文案 `{row}`/`{apply}` 解析为本机条目名 |
| R26-6 胶片 | 六格全部上画 | **6/6**，每格 3.3~9.5s，逐格填入 |
| R26-6 剪辑态 | `body.clip-trimming`、速度曲线让位 | `trimming:true`、`visibility:hidden` |
| R26-7 事件标记 | 可点的 button + 中文时间 | 1 个，`跳到事件时刻 · 07:31:07` |
| ⋮ 撞位 | 面板开时控件行不可见/不可点 | `opacity:0`、`pointer-events:none`，关面板恢复 |
| 版本 | 抽屉底部标签 | `v1.2.19` |

### 探针（本轮新增）

`probe-r26-verify.js` 一趟回全套（版本、`FrameFetcher` 的 cache/live/waiting、每张卡片的 `img`/`.no-thumb`、
胶片格数与上画数、`.event-marker` 的 aria/title/left、删除面板的行与摘要、U盘向导步骤与
`usbGuideForced`）。`probe-r26-clip.js` 只看剪辑态。

`probe-r26-decoder.js` 是这一轮真正定案的那个：同一次取帧，**六路播放器在场**跑一遍、把六个 `src`
摘掉再跑一遍，回 `{withPlayers:{ms,ok}, noPlayers:{ms,ok}}`。在此之前「胶片不出图」有四种可能
（映射错、缓存错、解码器不够、路径不对），这一趟把它压成一句话：**不是拿不到，是每次 10~15 秒**。

`probe-r26-native.js` 盯原生那一腿：`requestThumb` 调用本身多久返回（应当是毫秒级，它只是入队）、
`__tdashcamNativeThumb` 到底有没有回来。配合 `adb logcat -s ThumbFetcher:V`——Kotlin 侧每条请求都会打
`fN ok in Xms <path>@<millis>` 或 `FAILED`，**胶片这种问题只有原生侧的耗时日志能定位到「请求的秒数在文件
之外」这一层**，纯 JS 探针看得见超时看不见原因。

> 探针里**不要调 `IntersectionObserver.takeRecords()`**：它会把待处理的回调取走，观察器于是永远不触发，
> 看起来就像「缩略图逻辑坏了」。

### 交付

`TDashcam-Studio-1.2.16/1.2.17/1.2.18/1.2.19-android-universal.apk`（`TDashcamStudio/` 根目录，旧包全部保留）。
`SO_MATCH_X64` 每次都验过（APK 内 `lib/x86_64/libtdashcam_studio.so` 与 `cargo` 产物逐字节相同）。

## 第二十七轮：宽度回退、U盘卡死、胶片比例、导出摆放（1.2.20 – 1.2.22）

用户一次给了十条，末尾附一句「1.2.20 先不急，先把要改的东西都改完再一起测试」——所以这一批内部连出
1.2.20 / 1.2.21 / 1.2.22 三个包，只在最后一条改完才装机复测。

### 1. 分类控件回退 + 抽屉控件宽度统一（R27-1、R27-10）

上一批改的顶部「分类」分段控件比抽屉里其他控件窄一截，视觉上像漏了一块。做法是**把宽度做成一个变量**
（`.form-control` 在两个 media 块里补 `width: 100%`），而不是给每个控件各写一个 `width`：竖屏与横屏两档
都靠同一条 `min/max` 表达式定尺，所以「控件宽度不一致」这一条在两个方向上是同一次修复。分类那排
chip 回退成原来的 `<select>`——分段按钮是「一眼看清有几段」的答案，不是「宽度对齐」的答案。

横屏列表排版（R27-10）走的是同一个变量，因此卡片行、抽屉行、底部条在同一档里等高同宽。

### 2. 「插入U盘，选中文件夹后 APP 会卡死」（R27-2）

这条的真凶在 Kotlin，不在 JS：`@JavascriptInterface` 的方法跑在 **WebView 的 UI 线程**上，而页面每
12 秒就轮询一次「有哪些存储卷」。原来的 `storageVolumesJson()` 为了给每颗 chip 一个条数，对每个卷
`listFiles()`——U盘根目录挂着几千个事件文件夹时这一次就是几秒，**而且它重复发生**，于是撞到五秒输入
超时，表现为「点了文件夹，APP 卡死」。

- `storageVolumesJson()` 改成**不列任何目录**就能回答：卷名来自 `StorageManager`，`/storage` 只扫一层
  目录名（那 tmpfs 里只有几个条目），容量走 `StatFs`。条数字段一律回 `"entries": -2`，意思是「还没数」。
- 真正的计数交给 `requestVolumeCounts()`，它把活丢给 `volumeExecutor`（单线程 `Executors`），算完用
  `evaluateJavascript` 把 `window.__tdashcamVolumeCounts(...)` 叫回来；JS 侧 `volumeEntryCounts` 那张
  Map 收到才刷 chip 角标，收到之前显示的是「计数中」而不是「空」。
- 同一条路上顺手把删除也搬走：`requestDelete()` 同样在 `volumeExecutor` 上跑，`deletePathsJson` 从
  `@JavascriptInterface` 降级成普通私有方法——一次删六个文件的 IO 不该站在输入线程上。

判据是实测出来的：**装机后连续两次选中U盘文件夹，3.1 秒返回，无 ANR 对话框**。

### 3. 胶片不压卡片、格子保持原视频比例（R27-3）

剪辑弹层浮在 `z-index: 3002`，但 1.2.16 的胶片是**定高 64px**：宽 56px 的格子配 16:9 的帧刚好，配上
特斯拉那路 3.35:1 的窄画面就变成一整条被拉高的黑边，而它正盖在行车数据卡片上沿。

- 高度改成**从实测帧比例反推**：`fitFilmstripToFrames()` 量第一格 `naturalWidth/naturalHeight`，
  `applyFilmstripHeight(slots)` 按 `cellWidth / ratio` 定高，只夹在 `34..64px`——**宽屏格子反而更矮**，
  窄条格子才长到上限。`clipFrameAspectFor` 记住这个比例属于哪个 `eventId`，换一段分辨率不同的哨兵片
  就重新量，不会一整个会话沿用上一次的条高。
- 剪辑态给 `body` 加 `clip-trimming`，竖屏/横屏手机与平板三段各把 `.metadata-content-panel` 的
  `bottom` 抬到胶片上方；`clip-trimming` 期间 HUD 让路（`speed-hud-panel { display:none }`），
  因为卡片和 HUD 同时浮在 915px 高的屏上一定撞。

### 4. 抽屉底部不再显示版本号、「更多」里删掉单独 GitHub 行（R27-4）

版本号本来是为「出问题时报信要知道是哪一版」加的，但它出现在列表底部就像一行多余的版权字。现在
`tdVersionLabel` 只在关于页显示，列表底部 `display: none`。**`buildInfo()` 里仍把版本写进剪贴板**，
一键诊断信息那条路不受影响。GitHub 那行从底部条「更多」栅格里删掉（它不属于「操作」），入口留在关于页。

### 5. 全屏播放按钮回归（R27-5、R27-9）

`.fullscreen-btn` 在 1.2.19 的手机端规则里掉了一档显示条件，用户读成「按钮没了」。补回 `display: flex`
并且给它和退出全屏共用同一个 `setPhoneFullscreen()`——**全屏是页面自己管的类名，不是 `requestFullscreen()`**，
因为系统栏那侧要靠原生 immersive sticky，两条必须走同一个开关。

### 6. 导出可视化：多路画面可以自由摆放（R27-6）

原来多路导出只能选「几行几列」，而真正想要的摆法（前视占满上半、后视缩在右下角当画中画）摆不出来。
现在导出面板里那块预览变成可拖可缩的画布：

- `phoneExportSlots(count)` 给默认网格（分数坐标，`y` 从上往下量，DOM 与原生两侧都按这一套解释）；
  `peRects()` 合并「存过的盒子」和「按位置的网格槽」，第 6 路加进一张为 5 路画的布局里不会留空洞。
- 指针事件走 `onPeLayoutPointerDown`：拖动改 `x/y`，右下角手柄改 `w/h`，尺寸**夹在 15%~100%**（小于
  15% 的一路在 1080p 成品里只有 160px，那是噪点不是画面）；一路一格，所以永远不会拖出「两个视图共用
  一个盒子」的歧义。`requestAnimationFrame` 合帧，因为 60Hz 的指针流和一次布局标签写入不匹配，而背后
  的面板正在滚。
- 布局存 `localStorage`（`tdashcam.exportLayout`），只保留仍然存在的视角，键是相机名——**换一段录像
  不丢你上一次摆的画中画**。重叠时摘要行直接报「N 处重叠，最后拖动的那路盖在上面」
  （**这条 1.2.23 已被推翻**：用户要的是互换，见第二十九轮第 1 节）。
- 只有选中 ≥2 路时这一组才出现（`show = ... && this.peSelection.cameras.length > 1`），单路没有「摆放」
  这件事。

### 7. 待添加功能批（R27-7）

CSV 导出、搜索增强（中文类型名与路径一起参与匹配）、硬解码失败的降级提示都补齐了。**两件没做**：
导出水印烧录等用户给文案和内容，「检查更新」被用户明确撤掉（「暂时不需要检查更新的功能」）。

### 8. 装机实测之后发现的三个结构 bug（1.2.22）

R27-8「排查bug并修复」这一条是真点击点出来的三个，都不是上一轮的回归：

- **A：全屏时底部条盖住了播放控件行。** 表现和 R27-9 一模一样——「全屏播放的按钮没有了」，但这次是
  进了全屏之后**所有**控件都点不到，包括退出全屏那颗。定案的读数是 `document.elementFromPoint(262, 866)`
  回的是 `tabRefreshBtn`。根因是选择器优先级：`styles.css` 末尾那条
  `html.touch-ui .phone-action-bar { display: flex }`（它是给「媒体查询失效的触屏设备」兜底的）和
  `body.phone-fullscreen .phone-action-bar { display: none }` **权重相同（0,2,1）且排在后面**，于是
  在真触屏上全屏永远关不掉底部条。修法是把隐藏那条写成 `html.touch-ui body.phone-fullscreen ...`
  多带一个类，而不是加 `!important`——这条兜底规则本身是有意的，不能反过来打掉。
- **B：剪辑态换事件后胶片整条消失。** `buildClipFilmstrip()` 只在点「剪辑」那一刻跑一次，而它开头就
  `if (!event || !this.totalDuration) return`。左右滑换一段之后 `clipModeActive` 还是 `true`、手柄还
  在，但尺子指的是上一段的秒数。改挂在 `setTotalDuration()` 上：新时长落地时若仍在剪辑态，
  `reseedClipRange()` 把 ±30s 的默认区间按当前播放头重新夹进新片（夹不出正区间就整段），再重画胶片。
- **C：拖动一格会把别的格一起搬走。** `end()` 为了「最后拖的那路盖在上面」把 `cameras` 数组重排，
  而 `peRects()` 对**没存过盒子**的相机是**按数组下标**取网格槽的——两路时把前视拖到底部，后视就跟着
  跳到下标 0 的位置，摘要行同时报「1 处重叠」。修法是在重排之前把当前所有盒子写进 `layout`
  （只补没被拖的那几路），从此数组顺序只代表叠放次序，不再代表位置。

三条一起进 1.2.22，因为一轮完整构建要 6 分钟。

### 探针（本轮新增）

`probe-r27.js` 盯几何遮挡（胶片与各浮层的 rect 和 `overlap()` 列表）、本轮宽度是否统一（抽屉控件
宽度去重后应只剩一档）、以及导出面板开合与「GitHub 行是否已从底部条删掉」。`probe-r28.js` 在它之上
加三条：U盘 chip 的角标文字与 `title`、FS 警告文案、以及收款码是不是**真图**
（`donateQrImg` 的 `naturalWidth` 与容器 rect——占位 SVG 是 3 秒前那张，真码是 1242×1692）。

`probe-r29-a.js` 是 A 那条定案用的：进全屏前后各读一次 `barRect` / `barDisp` / `elementFromPoint`
在控件行中心命中的元素。修好之后同一处应该回 `control-btn` 而不是 `tabRefreshBtn`。

> 三个「真点击没反应」的误报都是同一类：**读得太早**。底部条的 y 在不同启动状态下是 852 或 876；
> 控件行开播几秒后自动 `opacity:0`，要点一下画面才醒；`showPhoneExportModal()` 是异步的，面板的
> `show` 类几秒后才出现。这三条都不是产品 bug，写探针时要先确认自己看的是哪一层。

### 装机实测（1.2.21，竖屏 412×915，全部真点击）

| 项 | 判据 | 结果 |
|---|---|---|
| R27-2 U盘选目录 | 无 ANR、能返回 | 两次 3.1s / 3.1s，`sys.boot_completed` 正常 |
| R28-1 收款码 | 真图、不变形、可放大 | `naturalWidth 1242×1692`，放大态 `aria-pressed` 翻转 |
| R28-2 卷 chip | 显示 FS 与容量 | `exFAT · 1.8TB`，`title` 带路径/总量/可用/只读 |
| R28-3 无障碍 | 手机可见的 ⋮ 控件都有 `aria-label` | 12/12 |
| R27-4 版本号 | 列表底部不再显示 | `display: none`；「更多」里无 GitHub 行 |
| R27-3 胶片 | 六格真帧、`contain`、不压卡片 | 6 格上画，实测比例 0.4494，重叠数 0 |
| R27-9 全屏按钮 | 40×40 可见可点 | 真点击进/出全屏都成立 |
| R27-6 拖拽 | 命中格子且不搬别人 | 命中成立，**但发现 C**：另一路跟着跳 |
| A/B | —— | **1.2.21 上复现**，1.2.22 修 |

ANR 那次另外查了一遍 `/data/anr`：栈停在 `RustWebView.<init>` → `WebViewChromium.init`，
CriticalEventLog 里它距 `install_packages` 46 秒——**是装完之后的首次冷启动**，不是本轮改坏的桥。
处理方式仍是 `am force-stop` + `monkey` 重启，重启后真点击立刻恢复。

## 第二十八轮：真实收款码、U盘的容量与格式（1.2.21 – 1.2.22）

原话是「这是我的微信收款二维码，替换之前占位的图。U盘还要考虑 fat32 格式和 exfat，以及大容量的，
比如我的 u 盘就是 2T 的。请把结构性欠账完成。暂时不需要检查更新的功能。」

### 1. 关于页换真码（R28-1）

`src/imgs/donate-qr.jpg`（1242×1692，94,781 字节）替掉 `donate-qr.svg` 占位图，占位那份已删。
用 `<img>` 而**不是** `background-image`，是为了直接继承 `.donate-code-img` 的 `max-width: 240px` +
`height: auto`——竖版海报照背景图铺就必然被拉变形。点击放大沿用 R25-3 那颗 `aria-pressed` 按钮。
> 收款码是个人收款凭证，**不要**把它复制进任何文档或示例目录。

### 2. FAT32 / exFAT / 2TB（R28-2）

「插上了但读不到」在这条路上有三种完全不同的原因，App 必须能分清并说出来：

- **格式**：安卓原生只挂 FAT/exFAT，NTFS 与 ext4 一律不挂。`mountTable()` 读 `/proc/mounts` 拿**真实
  fstype**——Android 在真实挂载上又叠了一层权限用的 FUSE，同一个挂载点会有两行，`fuse`/`sdcardfs`/`tmpfs`
  必须让给带块设备的那一行，否则所有卷都会报成 `fuse`。
- **容量**：`StatFs.blockCountLong * blockSizeLong`。老写法 `blockCount * blockSize`（Int）在 2TB 盘上
  是 2e12，直接溢出成负数。
- **只读**：`/proc/mounts` 第四个字段里含 `ro` 时 chip 直接标只读，导出那侧也就知道不能往这里写。

JS 侧三个纯函数把上面这些说成人话，都单独注入验过：`volumeChipMeta()` → `exFAT · 1.8TB`；
`volumeChipHint()` → `路径 · 格式 · 总量 · 可用 · 只读`；`volumeFsWarning()` 按优先级出四选一——
NTFS/ext4 直说「安卓不挂这种格式」、exFAT 给容量与条数提醒、FAT32 说明**单文件 4GB 上限**、只读说明
可以看不能写。文案在 `volFsNTFS` / `volFsFat32` / `volFsExFat` / `volReadOnly` 四对键里。

### 3. 结构性欠账（R28-3）

这一节是「能用但不该这样」的那几笔，全部落在扫描与 IO 上：

- **主线程 IO**：见 R27-2 那一条——`storageVolumesJson()` 不再列目录，计数与删除搬到
  `volumeExecutor`。取帧早就是 `ThumbFetcher` 的单线程 executor，导出是 `tdashcam-export` 线程。
- **扫描有预算**：Rust `walk_dir` 有 `MAX_SCAN_DEPTH = 12` / `MAX_SCAN_FILES = 20_000` /
  `MAX_SCAN_DIRS = 3_000`，`budget.spent()` 一到就停。这不是防「扫不完」，是防「扫到用户以为 APP 死了」。
- **停下来要说**：`scan_media_dir` 回 `ScanReport { files, truncated }`，JS 记 `lastScanTruncated`，
  出结果时若被截断就 toast 明确说「扫到 {n} 个文件就停了，列表可能不完整，请只选 SavedClips /
  SentryClips 这一级」。**静默的截断比报错更坏**：用户会拿这份不全的列表当全部。
- **每 200 个文件 `yield_now()`**，UI 不至于冻结。

### 交付

`TDashcam-Studio-1.2.22-android-universal.apk` 在 `TDashcamStudio/` 根目录，**1.2.16 起的旧包一个都没删**。

## 第二十九轮：摆动能互换、格子见真帧（1.2.23）

原话是「可视化导出界面，目前的模拟画面是黑色的，不好看。另外调整画面位置，画面可以重叠，这是 bug，
需要可以自动调换。多路视屏，比如左边的画面调整到右边，右边的画面就能自动到左边，而不是重叠到一起了。
请继续排查 bug 并完善。把导出前预览帧做了。打赏二维码换一张图。」

### 1. 重叠从「容忍」改成「自动调换」（R29-1）

1.2.22 那版把重叠当成合法的画中画来容纳（摘要报「N 处重叠，最后拖动的那路盖在上面」）。用户读出来的是
bug：他要的是**互换**——「左边的挪到右边，右边的自动回到左边」。所以松手之后的处理拆成两条互不相干的规则，
入口都在 `end()` 里，只有 `resize` 这一个开关决定走哪条：

- **拖动（改 `x/y`）→ 互换**。`peSettleDrop(rects, index, origin)` 反复找「被拖这路现在压在谁身上」
  （`peBiggestOverlap` 要求**两个轴都**真的进 >0.005，且两者面积比落在 0.55~1.8 之间），找到就把手里的
  盒子交出去：尺寸几乎一样时各自搬到对方的位置（2×2 里沿对角线拖一次，两路正好都落回网格槽）；
  尺寸不一样时**互换中心、各自保留自己的宽高**。被挤走那路的落点是 `origin`——**手势开始时那块盒子的
  中心**，不是它自己的中心；两路尺寸接近时用中心互换会把两路都摆到同一个点上，所以 `sameSize` 分支走的是
  原样位置交接。连环占用会轮转：三路排成一排，把最左拖到最右，中间那路跟着往左补位，循环上限是
  `rects.length + 1` 次。
- **缩放（改 `w/h`）→ 分层，不换**。角落手柄故意不进这套规则：小窗压在大窗角上**正是**画中画的做法，
  它不是「摆错了」。所以 `peSettleDrop` 只在 `!resize` 时跑，而推挤用的 `pePushApart()` 只看
  `peersOnly`（可比尺寸）那类重叠，小压大一律不动。
- 剩下的残余重叠（夹在边上避不开的、以及尺寸差太远的）由 `pePushApart()` 收尾：沿**穿透较浅**的那个轴
  把被拖这路滑出去，位移量取 `min(outX, outY)` 方向，再夹回画布内。

画中画这一格仍然会被摘要数出来（`peOverlaps()` 不看尺寸），但它不再会被自动搬走——这是「互换」和
「分层」之间必须留的那道缝。

判定表（`peLayoutHint` 三档文案）：无重叠 → 「把画面拖到另一路上就互换位置，拖右下角改大小」；
有重叠且全是画中画 → 「缩放宽高会盖住别的路，拖动则自动调换」。

**探针**：`devtools/pe-settle-test.js` 把 `peBiggestOverlap` / `peSettleDrop` / `pePushApart` 三段
从 `script.js` 原文抽出来（按 `/**` 往前找注释头，用 `new (class {...})()` 求值）直接跑，10 条断言：
2×2 对角互换、1×2 半宽互换、贴边互换不越界、2×3 换完正好落回网格、画中画保持角落且只报自己那一格、
1×3 三路轮转、完全重合必须分开、把大窗拖到小窗上不该把小窗搬走。

### 2. 黑格子换成真帧（R29-1）

「模拟画面是黑色的」根因很直白：布局编辑器里那几格从来只是一块纯色加相机名，**一次都没有取过帧**。
现在每格内联一张真图：

- 取的是**导出区间里第一个文件的那一秒**——`peFrameTarget()` 走 `phoneExportSegments(event, cam, from, to)[0]`，
  时间取 `clipStartUs / 1e6 + 0.25`。也就是「成品开头那帧」，而不是当前播放头：预览要对齐的是将要写进
  文件的东西。
- 渲染时先 `FrameFetcher.peek(path, seconds, 320)`，命中就同步写进 `<img class="pe-tile-img">`（首屏不闪黑），
  没命中则 `peFillTileFrames()` 排队去取，回来后 `insertBefore(img, tile.firstChild)`——**只在格子还挂在
  DOM 上、且格子里还没有图时**插，面板刚重排过的旧回调不该再插一张。
- `object-fit: contain`：格子里看到的黑边就是文件里会有的黑边，不裁不拉（R21/R23 那条老规矩）。
- 标签 `pe-tile-name` / `pe-tile-size` 补 `position: relative`——定位元素画在静态元素之上，否则刚取回来的
  那帧会把相机名整个盖掉。
- `FrameFetcher` 的 cache key 从 `path@秒` 变成 `path@秒x宽`（`key(path, seconds, width)`）：同一秒现在
  在导出面板里要用两种尺寸（格子里一张、合成预览里一张），一条缓存必须描述它实际装着的那张图。宽度一路
  透传到 `grab → grabNative → requestThumb` 和 `grabViaVideo` 的 canvas 边长。Kotlin 侧不用改，
  `ThumbFetcher` 早就把宽度夹在 32~640。新常量 `PHONE_EXPORT_FRAME_W = 320`：一格在 260px 宽的画布里
  最多 130px，320 足够清晰，而且**同一宽度只解一次**——格子与合成预览共用同一份。

### 3. 导出前预览帧（R29-3）

`pePreviewBtn`（预览帧）把「即将写进文件的第一帧」合成出来给你看一眼再按开始导出：

- `drawPhoneExportPreview(plan)` 用**与引擎同一套盒子**（`peRects()`）、同一个 contain 语义逐路
  `drawImage`，缩放取 `Math.min(1, 720 / 长边)`：六路 720p 的真实帧是 3840×1440，WebView 不该为一张预览
  分配这种东西，但**比例必须和文件一致**，否则预览就是一句谎话。
- 说明行两档：帧还没齐 → 「正在取帧…」；齐了 → 「合成预览 · 从 {t} 起 · 文件 {w}×{h}」，那两个数字是
  引擎真正会写进 MP4 的尺寸（含被本机编码器缩小过的情况）。
- 两道守卫：`pePreviewSeq` 每次重绘自增，回调发现序号变了就不画（拖拽途中旧的一轮不许再动这张画布）；
  `retry` 参数把重试链限死一次——否则 retriever 永远答不上的那一路会让「正在取帧」变成无限循环。
  关掉预览时也把序号推一格，正在路上的那帧回来时已经没有画布允许它画。
- 预览与「恢复网格」两颗按钮共用 `.pe-layout-foot`；`.pe-mini.on` 给按下态（描边 + 玻璃底 + 加粗），
  和别处的开关一致。按钮显隐靠 `.pe-layout-foot .pe-mini.pe-preview-btn{visibility:visible}` 三个类，
  才压得过脚注区那条 `(0,2,0)` 的隐藏规则。

### 4. 继续排查：这一轮抓到的是自己上一轮的回归（R29-2）

1.2.22 修 BUG C 的办法是「松手前把所有盒子写进 `layout`」，让数组顺序只代表叠放次序。它确实止住了
「拖一格搬走另一格」，代价是**布局被当时的路数钉死了**：取消选中一路之后，剩下的几路还按旧分数摆着，
不会重新流进新数量该有的网格。修法不是推翻 C 那条，而是在写入之前逐路比一次——

```js
if (slot && ['x', 'y', 'w', 'h'].every(key => Math.abs(rect[key] - slot[key]) < 0.005)) {
    delete this.peSelection.layout[cam];   // 跟网格重合：那不是自定义，别存档
} else {
    this.peSelection.layout[cam] = rect;
}
```

只有真被拖过或缩过的盒子留在 `localStorage`，「恢复网格」的显隐也按同一个 0.005 判。C 的原意（顺序≠位置）
保住了，钉死也解开了。

### 5. 打赏二维码换图（R29-4）

`src/imgs/donate-qr.jpg` 换成用户给的新海报（1238×1415，92,670 字节，微信绿）。竖版比例靠 `.about-qr` 的
`height: 210px; width: auto` 与点大态的 `min(52vh, 420px)` 兜住，仍然用 `<img>` 而不是背景图。
> 收款码是个人收款凭证，**不要**把它复制进任何文档或示例目录。

### 交付

`TDashcam-Studio-1.2.23-android-universal.apk` 在 `TDashcamStudio/` 根目录，1.2.16 起的旧包一个都没删。

## 第三十轮：亮度不受系统上限、U盘拔出、闪现的旧布局（1.2.24）

原话共 11 条：亮度调节受手机系统屏幕亮度限制（手机调到最低就无法再调亮），手势生效区域请固定在视屏
左边三分之一，亮度条竖着放在靠右的位置；参考 https://github.com/Sentry-Six/Sentry-Six 列出 APP 需要
完善或可以引入的功能；U盘/硬盘从手机上弹开了列表里还会出现，导致刷新的时候报错；导出多路时调整某一路
位置还会出现重叠；横屏状态下列表里的视屏下滑显示的区域很小；每次打开 APP 点击视屏后界面会闪现一张最早
的视屏布局图，很快消失然后才显示视屏；竖屏时 APP 首页底图上面的车辆显示不完整；打赏的二维码图片放大有
变形；单指长按视屏可以 3 倍速播放；视屏双指放大后单指就可以移动画面（目前需要双指，不方便）；读取U盘的
视屏一旦多了还是有点卡，再想办法优化。

### 1. 亮度：窗口级提亮，手势限在左 1/3（R30-1）

「手机亮度调到最低就再也调不亮」是这条需求的根因，也是这一版真正解掉的东西：之前那版只做**画面自身**
的遮罩（`phoneBrightnessDim` 的 opacity），它只能把画面往暗压，压不到系统给的上限以上。现在分两段：

- **≤1.0 走遮罩**：`dim.style.opacity = 1 - level`，范围夹在 `0.2 ~ BRIGHTNESS_MAX`。这一段是可见的
  变暗，两种设备都成立。
- **>1.0 走窗口**：`applyWindowBrightness()` 调 `TDashcamNative.setScreenBrightness(value)`，Kotlin 侧
  写 `WindowManager.LayoutParams.screenBrightness`（绝对面板亮度）。超过中性刻度时从**当前系统亮度**
  插值到 1.0 —— 起点用 `systemBrightness()`（原生 `Settings.System.SCREEN_BRIGHTNESS` 归一到 0~1，
  读不到时退 0.5）而不是固定值，所以跨过 100% 那一刻画面是接着变亮，不是跳一下。回到 ≤1.001 立刻
  `setScreenBrightness(-1)`，即 `BRIGHTNESS_OVERRIDE_NONE`，把亮度还给系统滑块；`level <= 0` 在 Kotlin
  侧同样按 NONE 处理。
  实测：系统滑块 0.039（接近最低）时向上滑到顶，`dumpsys display` 里 `Display Brightness=1.0`，
  画面明显比系统上限更亮。
  ⚠ **这条契约已被 R67 换掉**：起点是 JS 在**手势开始时**缓存的，滑块随后一动就再也不跟着重算，
  而 `screenBrightness` 是**窗口级绝对值、压过系统滑块**，于是「提亮过一次的窗口把面板钉死在 0.72，
  用户把滑块从 245 拖到 25 画面照旧亮」。桥现在叫 `setScreenBoost(t)`，JS 只交一个 0~1 的**比例**，
  基准由 Kotlin 在写的那一刻现读，并且挂了 `ContentObserver` 监听滑块。见文末 R67 一节。
- **手势只在左 1/3 生效**：`touchstart` 先算 `area.getBoundingClientRect()`，
  `if (e.touches[0].clientX - box.left > box.width / 3) return;`。右边那三分之二要留给捏合、横滑切事件
  和放大后的单指平移，压暗手势不能站在它正要压暗的那张画面上。位移门槛 14px 且必须**纵向占优**
  （`Math.abs(dy) > Math.abs(dx)`），一滑就 `preventDefault()` 并把 `suppressPlayerTapUntil` 推 600ms。
- **亮度条竖着靠在画面右侧**：`#phoneBrightnessHud` 是一条竖轨（`.pb-track > .pb-fill`），
  `fill.style.height = (level - 0.2) / (BRIGHTNESS_MAX - 0.2)`，数值文案 `Math.round(level*100)%`；
  手势期间 `.show`，抬手 900ms 后自动隐去。遮罩、竖条、数值三者都由 `setBrightness()` 一次写定，
  所以持久化的那个 `tdashcam.brightness` 与屏幕上看到的永远一致。

### 2. U盘弹开之后：不再留残单，也不再报扫描错（R30-3）

拔盘后列表里那些条目是**上一轮的账**（1.2.13 只做了「插入时」的 toast），现象是下次刷新走进一条不存在
的路径、返回 scan error，用户读到的却是「App 坏了」。这一轮补上另一半：

- `setupVolumeWatcher()` 每 12 秒 / 回前台 / 窗口 focus 时重新枚举外部卷，签名只取
  `path:fs:total`（**不含**条目数——计数比挂载慢半拍，含进去会让 chips 无谓重建、吞掉一次正在飞的手势），
  差异算出 `added` 与 `gone` 两个列表：前者走 `announceNewVolumes()`（原有），后者走新的
  `forgetRemovedVolumes(paths)`。
- `forgetRemovedVolumes()` 用**根前缀**匹配（`at === root || at.startsWith(root + '/')`）清掉
  `allFiles / eventGroups / lastFilteredEvents` 再 `filterAndRender()`，并 toast「盘已移除」。清
  `lastFilteredEvents` 是必需的：自动播下一个读的就是这份渲染后的列表，留着会让它排队去打不开的文件。
- 兜底在扫描失败那一路：`loadTauriDirectory()` 的 catch 里 `await this.scannedPathGone(path)`，它调
  Rust 的 `probe_readable`，**只有**同时满足「不可读」**且**错误串匹配
  `No such file or directory|cannot be found|ENOENT` 才判「路径没了」，然后同样 `forgetRemovedVolumes`。
  权限被拒、IO 错误一律**不清列表**——那两种情况下列表还是有效的。

### 3. 摆放还剩重叠：根因不在拖拽，在「写盘顺序」（R30-4）

上一轮做完全互换后仍报重叠，查下来是两个跟 `peSettleDrop` 无关的地方：

- **盒子没实体化**。没存过自定义框的视图是**按位置**取自己那一格（`phoneExportSlots` 按 index 发槽），
  所以 `peRects()` 里留着未展开的对象时，「这一路的框」只对当下那个 index 成立。`end()` 现在第一件事
  就是 `this.peRects().map(rect => ({...rect}))`。
- **层序搬运写在布局之后**。把被拖这路 `push` 到数组尾（让它盖在最上）之后才按 `placed` 的**旧**下标写
  `layout[cam]`，于是有一路明明没动过却按旧槽存了，下一次读出来它的框属于另一个 index —— 一次已经
  结算干净、互不重叠的落点，回来就变成重叠。现在**先重排、再按重排后的槽写**（`slots =
  phoneExportSlots(...)` 在 `forEach` 之前取），并且逐路跟自己的槽比 0.005，重合就 `delete`，
  跟 1.2.23 那条「别把默认摆放当自定义钉死」共用同一个判据。
- 调换本身也补了轮转：`peSettleDrop` 的落点变量从「origin 一次用到底」改成 `vacancy`——第一次交接之后
  「坑」就是被拖这路刚站过的位置，所以一次挤到两路的落点会让三路**轮转**，而不是在同一个点上叠起来。

**探针**：`devtools/pe-settle-test.js` 抽三段原函数跑 12 种排列组合，`{tries:12, overlaps:0}`。
> 这个 harness 的 `origin` 传的是**被拖视图手势开始前的那块盒子**；误传目标盒子会算出假的「10 处重叠」。

**端到端真手指复测**（1.2.24 装机后，横屏，`SavedClips/2026-09-29_12-30-00`，四路 1080p）：
`adb input swipe` 从 `back` 那格划到 `left` 那格（33px 位移，900ms），落点之后
`{cams:["left","right","front","back"], overlaps:0}`——两路**互换了位置**，被拖那路排到叠放次序末尾，
提示回到「把画面拖到另一路上就互换位置」那一档。

排查这一条时踩到的三个坑值得记下来，它们都不是摆放逻辑的问题：
- **`#peCanvas` 量到 0×0 不一定是 bug**：`.pe-layout-group` 会被 `renderPhoneExportLayout()` 主动
  `display:none`，条件是「正在导出」或**区间非法**（默认没在时间轴上落过入出点时，起止都是 00:00，
  plan 直接回「起点必须早于终点」）或**只选了一路**（一路铺满整幅，拖了也不动，没必要给框子）。
  先补一个合法区间、再选到 ≥2 路，画布就出来了。
- **画布被滚动容器裁掉的那部分收不到手势**：横屏面板 `max-height` 只有 380px，`.pe-body` 视口 247px
  而内容 446px，画布下沿 61px 是被裁掉的——`getBoundingClientRect()` 照样报它在屏幕上（甚至和
  「开始导出」那颗按钮的矩形重叠），但 `elementFromPoint` 在那儿给的是按钮。在裁掉的区域起手，
  拖拽根本不会开始。**量几何要用可视区，别只信 rect。**
- **模拟器上的画布格外小**（66×148）：`--pe-aspect` 走的是**成品自己的比例**，测试片是竖屏 1080×2400，
  四路合成出来就是 0.446，`max-width: calc(148px * 0.446) = 66px`。真机特斯拉是 3.35:1，同一行公式给
  的是 495px。这条与「胶片」那条同源：**模拟器上的观感不能代表宽幅那档**。

### 4. 横屏列表只有一条缝（R30-5）

横屏抽屉宽 412px，筛选那一摞（日期 + 类型 + 搜索 + 分类 chips + 最近目录）吃掉 195px，事件列表只剩
62px——一又四分之一张卡。现在把这一摞收到漏斗按钮后面：`.sidebar:not(.filters-open)` 隐藏
`.filters / .date-chips / .recent-dirs`，`#filterToggleBtn` 只在横屏出现（桌面与竖屏 `display:none`），
搜索框 38px 是唯一在观看时值得占位的所以留着。列表本身改成 `flex:1 1 auto; min-height:0; height:auto`
吃掉全部余量（旧的是固定份额）。竖屏不受影响（那一摞本来就展开，且抽屉高度够）。
**实测**（1.2.24 装机、横屏 915×412、`SavedClips` 四个事件）：`#fileList` 可视高度 **215px**
（`scrollHeight` 232，即四张卡刚好一屏多一点），漏斗按钮 30×30 在 (231,37) 可见；
`.filters / .date-chips / .recent-dirs` 三块 computed display 都是 `none`。
> 这一版没去量「展开筛选后剩多少」——那是主动按下漏斗之后的代价，用户自己选的。

### 5. 点视频后闪一张旧布局图（R30-6）

`playEvent()` 里那句「底图让位」（`playerArea.classList.remove('empty')`）写在**加载完成之后**，
而手机版默认布局是**在加载之后**才按 `localStorage` 里的上次选择应用的。于是这几秒里 CSS 的默认形状
（一路大图 + 三个 PIP 小窗 = 最早那套布局）已经被画出来了。修法是把三行顺序调过来：

```js
const initialLayout = isPhoneLayout()
    ? (localStorage.getItem('tdashcam.layout') || 'grid4')
    : 'legacy';
this.multiCameraPlayer.setCamera('front');
this.multiCameraPlayer.setLayout(initialLayout);
this.videoControls.updateViewSwitcherUI(initialLayout);
this.dom.playerArea.classList.remove('empty');
```

**验证**：`MutationObserver` 盯 `#playerArea` 的 class，冷启动后真点一次卡片，抓到的是
`player-area empty` → `player-area grid4-view` 在**同一个 task** 内完成（中间没有 painted frame）。

### 6. 竖屏首页车辆被裁（R30-7）

`cover` 用在 2880×1800 的横版照片上就是裁切：竖屏 412px 视口只看到画面宽度的 37%，车头正好落在外面。
现在是**整张 contain + 同一张图的模糊铺底**——`.player-area.empty::before` 负 inset 30px（模糊边缘会
往letterbox 里漏一圈半透明光晕，负外扩是给它的余量）配 `blur(26px) brightness(0.62) saturate(1.08)`，
`::after` 是 `center / contain` 的原图；`.player-area.empty` 自身的 `background-image` 置空。
配合本轮把底部 `padding-bottom` 在空状态时归零（悬浮胶囊要浮在底图上而不是浮在空隙上）。
**实测**（1.2.24，竖屏冷启动截图）：整车完整入画，上下是同一张图的模糊铺底，地平线连续。

### 7. 打赏码放大变形（R30-8）

点大态原来只把 `height` 抬到 `min(52vh, 420px)`，而 `.about-qr` 是 `width: auto` 在栅格里——高度按视口
算、宽度受面板宽限，两边不等比就是**压扁**。现在放大态改成以**面板自身宽度**为准：
`height:auto; width:min(100%, 360px)`，`object-fit: contain` 保持，`aria-pressed` 驱动 `cursor: zoom-out`。
**实测**（1.2.24，真点收款码）：原图 1238×1415（比例 0.875），常态渲染 184×210（0.875），
点大后 321×367（0.875），且完整落在面板 388px 宽之内 —— 两档都不再有不等比。
> 收款码是个人收款凭证，**不要**把它复制进任何文档或示例目录（截图也一样，验证只看数字）。
> 「一个高度需要比面板更宽的宽度」正是这条规则要避免的东西——以后调这张码只动宽度侧。

### 8. 长按 3 倍速（R30-9）

`setupPhoneLongPressBoost()`：按住画面 450ms 起速到 `PHONE_BOOST_RATE = 3`，抬手回原速。选 450ms 是因为
所有争用手势都在 14px 位移内就已经表态（捏合、横滑切事件、压暗），超过这个窗口的静止手指才归它；
位移超过 12px 直接取消。倍速只写在**活的 `<video>` 元素**上（`setTransientPlaybackRate`），
`playbackRate`、倍速标签和 `defaultPlaybackRate` 一律不碰，所以松手回到的正是用户自己那一档。
提示 `#phoneBoostHint` 在按住期间显示 `3×`。与 1.2.8 那条「记住倍速设置」不冲突——那是档位，这是按住不放。

### 9. 放大之后单指平移（R30-10）

捏合放大（1.2.8）原本只有第二根手指还按着时才能移动画面，实测没人真这么操作。现在捏合监听里追加一条
单指链：`touchstart`（`e.touches.length === 1` 且 `!active`）取 `tileAt()` 命中那一路的**已存 scale**，
`> 1.01` 才认领，然后 `clampSpan(x0 + (clientX - startX), box.width*(scale-1)/2)` 逐帧 `paint()`，
抬手压 400ms tap。判据来自存好的 scale 而不是「平移标记」，所以监听器注册先后不影响归属。
同一条规则让另外三个手势让路：`zoomedFeedAt(touch)` 被横滑、压暗、长按各自调用一次——
**放大中的画面上的手指只在操舵**，不再顺手把亮度或倍速改了。

### 10. U盘文件一多就卡（R30-11）

三处串行成本，逐个记账：

- **每个文件一行 `console.log`**（`TauriFile` 里）删掉。日志写在主线程上，几千个文件时它比真正的读取还贵。
- **`event.json` 改 6 个一批**：每次读是一趟到 loopback 媒体服务的往返，`await` 串起来就是 200 段付 200
  次串行往返才画第一行。`for (let i = 0; i < withLocation.length; i += 6)` + `Promise.all`；6 是上限，
  免得小目录自己排在队首。**坐标（城市/街道/经纬度）是列表最贵的字段，值得这 6 路并发。**
- **列表改分页**：`LIST_PAGE_SIZE = 60`。以前扫描结束时整个结果集同一帧变成卡片，几千个事件光 layout
  就够冻住抽屉。现在 `listEvents / listShown / appendListPage()` 只建离屏幕近的那些，滚到底部
  `LIST_PAGE_TRIGGER = 480px` 内追加下一页（`armListScroll()` 用 `passive` 监听、只装一次）。
  **桌面不分页**：它的侧栏是窗格不是手指列表，鼠标用户选了筛选条件期望一次看到全部结果。
  门控 `listIsTouch() = isPhoneLayout() || isTabletLayout()`。

### 11. 与 Sentry-Six 的对照（R30-2）

`https://github.com/Sentry-Six/Sentry-Six`（MIT，Electron 桌面端「Sentry Studio」）重合的部分——六路同步、
0.5~4× 倍速、SEI 遥测 HUD、按事件浏览、文件夹加载——本 APP 都已具备，且多了手机端的触摸手势与原生导出。
它的服务端/树莓派侧能力（分享链接、USB 自动归档、Drive 分析、Connect 实时查看）不在移植范围内。
值得引入的差距，按「代价 / 收益」排：

1. **剪辑入出点（trim in/out）**——本 APP 已经能选区间并导出，缺的是把区间**做成可复用的动作**：
   在胶片上落两个手柄、命名、之后一键导出这一段。已有的 `phoneExportSegments()` 与时间轴手柄是它的底座。
2. **隐私模糊区域（privacy blur zones）**——导出时在画面上圈定几块（车牌、人脸）做马赛克。原生导出管线
   已经是「解码 → GL 合成 → 编码」，加一层 mask 就是 GL 里多一个 pass；这是**合规**类功能，
   与「水印烧录」是同一条改造路径。
3. **导出烧录叠加层（HUD / 小地图 / 时间戳进成品）**——现在 HUD 只在播放时浮在屏幕上，成品 MP4 里
   什么都没有。Sentry-Six 是把速度、档位、方向盘角度和路线一起烧进画面的。有了 GL 合成那一层，
   这是「把已画的东西画进帧里」，而不是新引擎。
4. **APP 内 GPS 路线按自动驾驶状态着色**——`event.json` 里有经纬度，遥测目录里有 APAP/state 列，
   现在只有「跳高德地图」这一条出路。在 APP 内画一条按 FSD / 交通感知 / 手动着色的 polyline，
   离线也能看，且不依赖地图服务。
5. **事件触发类型的相机高亮**——列表已经能按类型过滤（Manual Save / Sentry / Honk / Object Detected
   这些标签来自文件名与 `event.json`），缺的是选中一路事件后，**把触发时正在看的那一路**在宫格里标出来
   （比如前摄有 `m` 后缀就描边）。纯前端，成本最低的一条。

不做：分享链接 / 上传、USB 自动归档（本 APP 是直读，没有拷贝这一步）、Drive 分析、Connect 实时查看
（要车端配合，与「读已录下来的文件」是两个产品）。

### 交付

`TDashcam-Studio-1.2.24-android-universal.apk` 在 `TDashcamStudio/` 根目录，1.2.16 起的旧包一个都没删。

## 第三十一轮：上一轮清单的五条全部落地（1.2.25 ~ 1.2.28）

原话两条：「还有哪些地方没有优化完善的？」（→ 上一轮 §11 那份对照清单）与「**水印这个先不做吧，其他的先完成**」。
所以这一轮做的是清单上的 1~5——剪辑入出点、隐私打码、烧录叠加层、路线按自动驾驶状态着色、触发相机高亮——
烧录水印（署名）按用户的话搁下，没有做。

### 1. 剪辑入出点：命名片段 + 一键导出（R31-1）

原来能选区间，但「选过」这件事不留痕迹：想再导一次同一段，得把两个手柄重新拖一遍、相机重新勾一遍。所以
一条 mark 存的不止是 `from/to`，而是**连同当时选的画面与档位**一起存（`saveClipMark()`，`src/script.js:15793`）：

```js
marks.unshift({ name, from, to, cameras: [...this.peSelection.cameras], size: this.peSelection.size });
```

- 键是 `tdashcam.clipMarks`，**按 eventId 分桶**——明天另一段录像应当从空列表开始，而不是继承上一段的名字。
- 每个事件最多 12 条，全局最多 400 个事件键（`writeClipMarks()` 剪最老的）：U 盘换挂载点重新扫描会产生新
  eventId，旧键没人手工删，不剪就只涨不消。
- 名字限 24 字符，留空回落到 `from–to`；**用户输入直接进 `innerHTML`，所以过 `escapeHtmlText()`**（`src/script.js:892`）。
- `applyClipMark(index, exportAfter)` 是「一键」那一步：区间 clamp 到当前事件时长、相机列表与本机现在真能播的
  那几路求交，交为空时退回第一路（否则会出现 0 路画面直接开导），`exportAfter` 时接 `startPhoneExport()`。

### 2. 导出叠加层：隐私打码 + 时间戳/车速烧录（R31-2）

这条是本轮唯一要动原生管线的一条，也是**两个真 bug 的所在地**。上一轮 §11 判断「加一层 mask 就是 GL 里多一个
pass」其实保守了——合成层早就是「每路一个 quad + uniform 数组」的形状，打码只是 shader 里多一步取整：

- `GlRenderer.kt` 片元着色器 `uniform vec4 uMosaic[4]`，把落在框内的采样坐标 `snap(q, box) = box.xy +
  (floor(local/uBlock)+0.5)*uBlock`，也就是**吸附到格心**——马赛克而不是模糊，安卓上不需要额外 pass，也不吃带宽。
- 格子边长 = 该路**画格高 / `MOSAIC_BLOCK_DIVISOR`(20)**，下限 2px（`GlRenderer.kt:204`）。1600 高的画格 → 80px。
- 每路最多 4 块（`MAX_MOSAIC_BOXES = 4`），前端画框编辑器存在 `tdashcam.exportMosaic`，提示语「在画面上拖动框住
  车牌或人脸 · 每路最多 4 块」。
- 时间戳/车速**烧进成品**走的是另一条路：`CaptionOverlay.kt` 用 CPU 画一条 RGBA 横条上传成纹理，盖在画面上沿
  的黑边里；序列由 `phoneExportCaptions()` 按秒生成，`us = (at - from) * 1e6`——**键是输出时间不是事件时间**，
  因为文件永远从 0 开始；取整用 floor 而不是 ceil，第一帧就得有时钟，否则掐到一秒以内的片段导出来一片空白。
  缓存键含「事件|入|出|时间戳开关|HUD 开关|语言」，面板每拖一帧都会重排计划，十分钟片段是六百行文本；
  上限 `MAX_EXPORT_CAPTIONS = 1200`。

**Bug 一（1.2.27 修）：`glUniform4fv(locMosaic, 1, mosaic, 0)`——count 传 1 只上传数组的第一个 vec4，
第 2~4 块打码被静默丢掉。** 界面画了四块、提示写了四块、文件里只有一块，且不报任何错。改成 `mosaic.size / 4`。

A/B 实测（1.2.28，同一事件、1 路、720×1600、0–8s、241 帧，两边**只差隐私打码一个开关**；模拟器软件编码器
`c2.android.avc.encoder` 约 1.9fps，241 帧跑满约 130s）：

| 区域 | 平均亮度差 | 峰值 |
| --- | --- | --- |
| 框 2 `[36,96,309,205]`（**就是以前会消失的那一块**，数组下标 1） | **62.77** | 253 |
| 框 1 `[133,222,268,309]` | **26.02** | 253 |
| 两个同尺寸的对照矩形 | **0.00** | **0**（逐字节相同） |

对照区一字不差，说明 62.77 这个差值是功能本身而不是编码器噪声。块内亮度标准差（框 2）开时 **1.07@40px /
2.23@80px**，关时 25.28 / 28.07，而对照区开着打码时仍是 16.88 / 18.72；边缘密度 **0.26% vs 2.92%**（约 11 倍）。
再量 ON 那一行的亮度台阶：整行只有一个台阶，落在 x=116 = 36+80 → 格边 80px = 画格高 / 20，和 shader 里的
`MOSAIC_BLOCK_DIVISOR` 对上。截图对比里「Videos」药丸和「2026-」字样只在打码那一侧被压成色块。

**Bug 二（1.2.28 修）：`signalEndOfInputStream()` 之后只给了 300ms 收尾部帧，被误判成失败。** 表现是
「编码器没有响应（尾部，已写入 241 帧）」**而且成品只有 7.63s**——帧其实全编出来了，只是尾部排空比 300ms 慢。
改成 20s **挂钟**宽限 + 100ms 轮询（`TAIL_GRACE_MS` / `TAIL_POLL_US`，`ExportEngine.kt:276`）；宽限用挂钟而不是
复用帧时钟，因为合成节拍在等编码器的时候自己也在走。超时**不再算失败**，只把「编码器结尾没有回话，最后几帧可能
缺失（已写入 N 帧）」作为提示随进度一起回前端。修后两个 241 帧的导出都是 `已写入 241/241 帧`、无报错、封装
**8.03s**（= 241/30，一秒不丢）。

时间戳烧录实测：片段 8–18.2717s → 309 帧、成品 **10.30s**；第 0 帧顶部黑条里烧着 `2026-09-29 12:30:08`
（源画面此处没有任何文字），第 135 帧是 `12:30:12` → 时钟从**入点**起算并按秒推进，不是从文件 0 秒硬凑。

**不做**：水印烧录（用户：「水印这个先不做吧」）。

### 3. APP 内 GPS 路线按自动驾驶状态着色（R31-3）

以前只有「跳高德地图」一条出路，现在 APP 内自己画（`renderRouteMap()`，`src/script.js:10283`）：

- 点来自 `routePoints()`：优先 `event.telemetrySamples`，从列表直接点的卡片还没解码，就回落元数据面板那张
  **实时表**（只读不改）。经纬度取 `latitudeDeg/longitudeDeg`，状态取 `data.autopilotState`，坐标按 6 位小数
  去重（原地停着的那一段会刷出几百个同一点）。
- **`sample.time` 每个一分钟的文件都从 0 重新开始**，所以必须 `segmentStart + time` 折叠成事件时钟，否则播放头
  对比是错的。
- 配色沿用行车卡片方向盘那套（`ROUTE_STATE_COLORS`，`src/script.js:900`）：NONE 灰 `#8c8c8c`、TACC 蓝 `#1890ff`、
  AUTOSTEER 青 `#13c2c2`、SELF_DRIVING 紫 `#722ed1`。自己另调一套会让地图和旁边的卡片互相矛盾。
- 投影用等距柱状（经度按纬度收缩）——几公里范围内和 Mercator 看不出差别，且不需要钳位。
- **run-length 合批**再描边：一分钟 36Hz 上百个采样如果逐点 `beginPath`，一段路要付一百次，而眼睛看到的本来就只有
  那几段同色。线宽 4，起点绿 / 终点橙，白色播放头 500ms 跟一次；图例只列这次真出现过的状态，没开过 FSD 的片段
  不该有条目。不接任何地图服务，离线可看。

### 4. 事件触发类型的相机高亮（R31-4）

成本最低的一条，纯前端（`applyTriggerHighlight()`，`src/script.js:12143`）：

- 触发原因**不带相机 id**，特斯拉有些固件写进 `event.json` 的 `reason`，有些只把它拼在事件文件夹名后面。所以
  `eventReason()` 两处都读，后缀匹配**必须锚在时间戳上**（`^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}[-_](.+)$`）——
  不锚的话 `SavedClips` 自己就含 "saved"，每个事件都会被读成一次触发。
- `TRIGGER_REASON_VIEWS`（`src/script.js:881`）五组正则**按序**命中，具体的赢过泛化的：倒车 → back；侧面 →
  left/right/left_pillar；前方 → front；哨兵 → front/left/right；手动 → front。
- **最多描边 3 路**（`TRIGGER_VIEWS_MAX`）：六格全亮等于没亮。认不出来的原因就一个都不亮——这是提示，不是筛选。
- 门控 `isPhoneLayout() || isTabletLayout()`：桌面这些年没有这个特性，给它凭空加一圈边框是改动而不是修复。
  标签文字走 `.camera-label[data-trigger]::after { content: attr(data-trigger) }`，中文在 HTML 外面拼，
  `applyTriggerHighlight` 挂在 `playEvent()`（`src/script.js:10204`）与 `handleResize()`（9727）两处——后者是
  转屏或拖窗口**跨越触摸布局那条线**时唯一不经过「加载新片段」的路径，不重算就会留下描边或漏掉描边。

### 交付

`TDashcam-Studio-1.2.28-android-universal.apk`（versionCode 1002028，ARM64 + X86_64）在 `TDashcamStudio/` 根目录；
本轮中途的 1.2.25 / 1.2.26 / 1.2.27 与更早的包全部保留，一个都没删。

## 第三十二轮（1.2.29）：触发高亮开关 / 点卡片三态 / 轨迹下线 / 4K 档 / 导出面板 / 首页底图 / 数据卡

### 1. 触发高亮改成可关（R32-1）

上一轮加的相机描边没有开关，而它并不总是有用（哨兵事件六格里亮三格，只想安静看画面时是干扰）。
`tdashcam.triggerHighlight`（`src/script.js:739`）+ ⋮ 面板一行「触发标注：开/关」，`applyTriggerHighlight()`
（12265）在关时只清 `.camera-label[data-trigger]` 而不重算映射，所以切换不需要重新解码。
实测（模拟器，真点击 ⋮ → 该行）：`触发标注：开` → `关` → `开`，`localStorage` 同步 `1/0/1`。

### 2. 点卡片后的行为三态（R32-2）

以前点列表卡片**总是**跳到 `eventOffsetSeconds`（触发时刻前 8 秒），对「我就想从头看这一段」是反的。
现在 `tdashcam.tapBehavior`（`src/script.js:741`）三态循环 `resume → start → event → resume`
（`cycleTapBehavior()`，12456），⋮ 面板那一行直接显示当前态：`点卡片：接着上次 / 从头播 / 跳到事件`。
实测循环三档，标签与 pref 一一对应；`跳到事件` 档下点 `SavedClips/2026-09-29_12-30-00` 落在 8.0s。

### 3. 地图「查看轨迹」在安卓版下线（R32-3）

`ROUTE_TRACK_ENABLED = false`（`src/script.js:745`）。轨迹画布要的是 `telemetrySamples`，而安卓上从列表直接
点开的片段没有解码出的遥测，画出来是空白卡片 —— 与其给一个空框，不如整块撤掉。
`showMapModal()`（16804）据此把 `.route-map-group` 写成 `display:none`，并且**不再启动那条 500ms 重绘定时器**。
实测点顶栏地址：弹层只剩「在地图上查看」+ 高德/谷歌两个按钮，`route-map-group` 计算高 0，`viewer.routeTimer` 为 `null`。
桌面端不受影响（门控在触摸布局里），开关翻回 `true` 即整块回归。

### 4. 删掉 4K 档（R32-4）

1.2.1 加的 4K 预设是**按每路**算的：六路 720p 已经要 3840×1440 的画布，4K 档在多路下必然被 clamp 收敛回去，
用户看到的是「选了 4K，出来不是 4K」。既然真机上从没验过能保住，就把它从选项里拿掉而不是留着骗人。
实测分辨率 chips 现在只有 `源 / 1080p / 720p / 480p`。

### 5. 导出面板只加高、不折叠（R32-5）

用户口径：「只加高，不折叠」。`max-height: min(calc(100vh - var(--sheet-bottom) - 12px), 640px)`
（`src/styles.css:5994`）—— 原来的 470px 只放得下七个组里的四个，剩下的靠滚轮，而手机上没有滚轮；
横屏下裸 `74vh` 会让面板顶到屏幕外（实测 `top: -16px`），所以视口项仍然要赢。
滚动容器换成 `.pe-body` 而不是面板本身：面板一滚，动作行跟着走，`开始导出` 是第一个掉出底边的。

### 6. 首页底图横竖屏固定（R32-6）

用户口径：「不要大图，改简洁空状态」。`cover` 裁一张 2880×1800 的帧，竖屏露出 37% 宽度、车头在屏外，
横屏基本只剩天，而且**转屏时两张图不会跟着变**。改成 `.player-area.empty { background-image: none }`
+ 三条百分比渐变（`src/styles.css:5341`）：百分比本身随视口重算，转屏不再产生「换了一张图」的观感。
实测竖屏 `.player-area.empty` 412×818、横屏 915×339，`::before` 的渐变定义两边逐字相同。

### 7. 行车数据小卡：标签列不随读数变动（R32-7）

`.stats-row` 是 `justify-content: space-between`，读数从 `--` 变成 `123 km/h` 时，没有 `flex-shrink: 0`
的标签会被挤，整列标签左右跳。加上（`src/styles.css:2709`）后标签钉死，值靠右对齐在自己的列里长。
实测：标签 x 恒为 161 / 277，值右边缘恒为 263 / 373（把 `--` 换成 `123 km/h`、`-345°` 后重测，标签不动）。

### 8. 横屏数据卡可移动可缩放（R32-8）

见 R21-3 的方框样式，本轮把**触摸路径**补齐：`initStatsOverlayResize()`（`src/script.js:3444`）走 Pointer
Events，`saveStatsPlateGeom()`（3428）把 `{width,height,left,top}` 写进 `tdashcam.statsPlate`，
`applyStatsPlateSize()`（3227）在下次加载时还原 —— 但 `left/top` 只在 `fits` 时还原，否则一个横屏下拖到
屏幕外的坐标会把卡片永久藏在看不见的地方。

### 交付

`TDashcam-Studio-1.2.29-android-universal.apk`（versionCode 1002029，ARM64 + X86_64）在 `TDashcamStudio/` 根目录。

## 第三十三轮（1.2.30）：详细数据崩溃 / 数据卡手势没生效 / 导出面板归位 / ⋮ 面板瘦身

### 1. 修 `Cannot read properties of undefined (reading 'statsFold')`（R33-1）

用户实机（小米 14）报 `script.js:3282` 抛错，且「看不到详细数据的卡片」。根因不是那行读不到 `statsFold`，
而是它下一行的 `i18n[this.currentLanguage]`：`updateStatsFoldLabel()` 属于 **`MetadataManager`**（2626 行起），
而 `currentLanguage` 是 **`TeslaCamViewer`**（9347 行起）上的属性 —— 在这个类里它是 `undefined`，
`i18n[undefined]['statsFold']` 直接抛。抛在 `showStatsOverlay()` 中途，后面的 `fitStatsPlateContent()`
和 `placeStatsOverlay()` 全都没跑，所以「卡片看不见」和「拖不动/缩放没反应」是同一个 bug 的三个症状。

```js
// The language lives on the viewer, not here: reading `this.currentLanguage` in this class
// yields undefined, and the throw stopped `showStatsOverlay` before it ever placed the card.
const lang = this.viewer?.currentLanguage || 'en';
```

外加 `if (!btn) return` 兜住「这张卡从来没人缩放过」的默认态，以及 `updateAllUIText()` 里改用可选链
（14317），否则切语言会二次崩。实测：点详细数据出 10 行卡片，`#jsErrorBanner` 计算 `display: none`。

### 2. 数据卡移动 / 缩放实测（R33-2）

崩溃修掉后 R32-8 的手势才第一次真正可达。模拟器真 `adb input swipe`：

- **缩放**：拖右下角手柄 `115×149 → 213×267`，`--stats-cols` 从 1 变 2，卡片挂上 `.resized`，
  pref 写入 `{"width":213,"height":267}`。
- **拖动**：拖标题栏 `(85,174) → (66,382)`，pref 追加 `left/top`。注意 `placeStatsOverlay()`（3109）
  在 `el.style.left` 已存在时**直接 return** —— 手动拖过的卡不再被自动摆位逻辑抢回去。
- **重启存活**：`am force-stop` + 重新拉起（组件名是 `com.tdashcam.studio/.MainActivity`，
  少写包名的 `com.tdashcam.studio/MainActivity` 会 `Error type 3`）后，卡片回到
  `left 66 / top 382 / width 213`，高度由 `fitStatsPlateContent()` 收敛成 275。

### 3. 「叠加」挪到「分辨率」下面（R33-3）

叠加层是**对画面的加工**，跟着分辨率读才顺；它原来在范围之后。纯 HTML 顺序调整
（`src/index.html:791` 的 `.pe-overlay-group`）。实测组序 `画面 246 → 分辨率 319 → 叠加 392 → 范围 465 → 片段 617`。

### 4. 「范围」拆成两行（R33-4）

一行里塞两个时间输入框 + 三个按钮，输入框被压到放不下。拆成 `.pe-range-times`（起 → 止）与
`.pe-range-actions`（从当前进度 / 设入点 / 设出点）两行（`src/styles.css:6048`）。
实测两行各 359×44，同一 y，六个子元素 `clipped` 全 false。

### 5. 底部「更多」面板：两列 + 三组（R33-5）

它长到 16 行整宽、约 650px，比底部锚定给它的空间还高，于是开始滚动，读起来是一整条没有起伏的列表。
现在 `display: grid; grid-template-columns: repeat(2, minmax(0,1fr))`，并按用途插三条小标题
`.menu-divider`：`这一段录像 / 播放与列表 / 其他`（`src/index.html:92/120/143`）。
**带数值的行为什么不并排**：`连续播放：关`、`排序：旧→新` 这类行，值才是这行存在的理由，
塞进半宽格子被省略号吃掉的正好是值，所以这五行统一加 `.menu-wide` 占满整行。

实测（竖屏 412×915）：面板 368×505，`scrollHeight == clientHeight == 503`（不再滚动），
两列各 176.238px，普通格 176×40、整行格 356×40，标签字号 0.78rem，15 个按钮 14 行，
`.btn-text` 无一截断。分节线 `pointer-events: none`，不参与点击。
**横屏不受影响**：那条媒体查询带 `(orientation: portrait)`，横屏实测仍是 `display:flex`、
15 个 44×44 图标格、三条 divider `display:none`、`scrollHeight 52 == clientHeight 52`。

### 交付

`TDashcam-Studio-1.2.30-android-universal.apk`（versionCode 1002030，ARM64 + X86_64）在 `TDashcamStudio/` 根目录；
1.2.3 至 1.2.29 的全部旧包原样保留，一个都没删、没挪。装机实测 `versionName=1.2.30`。

## 第三十四轮（1.2.31）：导出范围行归位 / 开屏列表闪现 / 菜单图标光学位

### 1. 「范围」这一行的宽度没和其他行对齐（R34-1）

`.pe-range-times` 的容器本身是满宽的，问题在**内容**：它带 `justify-content: center`，两个时间输入框又是固定
宽度，于是「起 → 止」整组在行里居中，左右各留出一段空白，而它上下的 `.pe-chips`、下面的
`.pe-range-actions`、`.pe-mark-row`、`.modal-buttons` 全是贴边的 —— 视觉上就是这一行比别的行窄一圈。
去掉居中，改成两侧各自撑开：

```css
.pe-range-times { display: flex; align-items: center; gap: 8px; }   /* 删掉 justify-content: center */
.pe-side  { display: flex; align-items: center; gap: 6px; flex: 1 1 0; min-width: 0; }
.pe-time  { flex: 1 1 auto; width: auto; min-width: 0; height: var(--field-h); }
```

`flex: 1 1 0` + `min-width: 0` 让两个 `.pe-side` 等分，输入框自己在里面吃满，所以两个时间框仍然等大，
只是从「中间挤一坨」变成「贴到行的两端」。

实测（几何探针 `devtools/probe-r34-verify.js`，只量 rect 不看截图）：

| 视口 | 行 | 左边缘 | 右边缘 |
| --- | --- | --- | --- |
| 412 CSS（模拟器默认） | 画面 / 分辨率 / 叠加 / 范围 / 片段 + 按钮行 | 0 | 358.7 |
| 458 CSS（`wm size 1200x2670` 复现小米 14） | 同上 | 0 | 384.5 |
| 1018×458 横屏 | 同上 | 0 | 578.5 |

三档 `leftSpread` / `rightSpread` 都是 **0.0**，即五行加按钮行的左右边缘一个像素都不差。

### 2. 打开 APP 时列表突然出现又消失（R34-2）

根因是**首帧与稳态不一致**：`src/index.html:13` 的 `<div class="sidebar">` 没有 `collapsed` 类，
抽屉的收起是靠 `script.js` 在解析完之后给 `<body>` 挂 `sidebar-collapsed` 才生效的。手机布局下抽屉默认
就该是关的，但浏览器已经把「开着」的那一帧画出来了 —— 于是开屏闪一下事件列表。

修法是在 `<head>` 里、body 还没开始解析前就把判定做完，给 `<html>` 挂一个一次性开关类：

```html
<script>
    if (window.matchMedia('(max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px), (hover: none) and (pointer: coarse)').matches) {
        document.documentElement.classList.add('phone-boot');
    }
</script>
```

配套 CSS 在手机端媒体查询内（`styles.css:1689`）：`html.phone-boot .sidebar { transform: translateX(-100%); transition: none; }`
—— **`transition: none` 是这条修复的另一半**：只把它挪出去、不关过渡的话，JS 随后摘掉 `phone-boot` 时
抽屉会再从左边滑进来一次，看起来还是「闪」。`toggleSidebar()`（14411）在用户第一次主动开抽屉时摘掉这个类。

实测用 `devtools/cdp-boottrace.mjs` 在 `document-start` 注入、逐帧采样 `.sidebar` 的 `x`：
第一个采样点就是 `x = -312`，中间没有出现过 `x = 0`，`.collapsed` 前后 x 不变（说明没有过渡插值）。
冷启动截图只剩空状态，没有列表。

### 3. 底部菜单栏弹出的卡片里图标没对齐（R34-3）

这一条有两处独立成因，都得单独量：

**(a) 光学位：SVG 的 viewBox 不统一。** 15 个菜单图标各自的 `viewBox` 留白不一样（有的是 `3 2.5 18 18`，
有的是 `1.2 2.2 21.6 21.6`），盒子里 18×18 摆得整整齐齐，**真正画出来的墨迹**却在各自盒子里偏上偏下、
粗细也不同 —— 盒子对齐了眼睛仍觉得没对齐。新增 `normaliseMenuIcon()` / `normaliseMenuIcons()`
（`script.js:674`）按 `path.getBBox()` 反推一个紧贴墨迹的方形 viewBox（`MENU_ICON_GRID=24` 归一），
并把描边统一到 `1.7 * side / 24`，让墨迹在盒子里居中且等粗：

```js
const MENU_ICON_GRID = 24;   // 归一后的 viewBox 边长
const MENU_ICON_INK  = 20;   // 墨迹占格子的比例，留 2 格呼吸
```

调用点两处：`phoneifyIcons()` 末尾（13008，`if (!isPhoneLayout()) return` 门控，桌面完全不跑），
以及 `showCardContextMenu()` 里 `menu.classList.add('show')` 之后（12600，长按菜单是复用的空容器）。
探针量的是 `getBBox()` 经 viewBox 映射回 client px 的**墨迹中心**与盒子中心之差，不是 rect。

**(b) 单点位移：`#downloadFileBtn` 带着桌面的老 nudge。** 桌面工具栏里它有一条
`position: relative; top: -3px; left: 2px`（`styles.css:384`，为了把字形塞进当时的行高）。
手机端 ⋮ 栅格本来就用 flex 居中每个格子，这条老偏移只把这一行单独挪了 2px 右 / 3px 下 ——
它就是面板里最后一个没对齐的行。在手机端媒体查询里把它复位，**桌面那条原样不动**：

```css
#downloadFileBtn { position: static; top: auto; left: auto; }
```

实测（竖屏 412 与 458、深浅两套主题各跑一遍）：

- ⋮ 面板 14 个 SVG 行：第 1 列图标左边缘统一 **12.8**、第 2 列 **193**，图标宽 18，文字左边缘
  36.8 / 217；墨迹偏移 **dx 0 / dy 0**，墨迹最大边统一 **14.2**。中/En 那颗文字型 glyph 也落在 12.8 / 36.8。
- 长按上下文菜单 6 行：图标左 18.8、宽 22、墨迹最大边 17.5、dx 统一 -0.5。
- 横屏（1018×458）：⋮ 面板是图标单行条，15 格 46px 等距，全部 `dx0 dy0`，无异常。
- 深色主题下曾怀疑面板被「无元数据」底板盖住（截图看着像重叠），逐行 `elementFromPoint` 命中测试
  15 行全部命中自己，`bad: []`，面板 z 1000 vs 底板 z 100 —— 不是遮挡 bug，那张截图抓到的是淡入中间帧。

### 交付

`TDashcam-Studio-1.2.31-android-universal.apk`（versionCode 1002031，ARM64 + X86_64）在 `TDashcamStudio/` 根目录；
1.2.3 至 1.2.30 的全部旧包原样保留，一个都没删、没挪（根目录现共 34 个 APK）。
装机实测 `aapt dump badging` 出 `versionName='1.2.31'`，设备上 `base.apk` 与构建产物 md5 一致
（`2ee04d4789312314782f6f13f2dbdcf8`），`lib/arm64-v8a/libtdashcam_studio.so` 与 Rust 构建输出 `cmp` 通过。

## 第三十五轮（1.2.32）：「播放与列表」也并进两列

用户口径：「底部菜单栏里面『更多』选项卡里面的『播放与列表』也调整成一行两列，和其他功能选项对齐。」

第三十三轮我把那五行（连续播放 / 只看收藏 / 排序 / 触发标注 / 点卡片）钉成整行，理由是**半宽格子里被
省略号吃掉的正好是值，而值是那行存在的理由**。这个理由站不住的地方在于：一个两列栅格下面突然接一段
整行，读起来就是「坏了 / 没排完」，比省略号更显眼。现在全部并入两列，**代价改由英文文案承担**：

- `src/index.html`：那五个按钮去掉 `menu-wide`；
- `src/styles.css`：`.menu-wide { grid-column: 1 / -1 }` 整条删掉（没有别的引用，不留死码）；
- `src/script.js`：英文 `tapMode*` 三条缩短 —— `Tap plays: where you left off` → `resume`、
  `from the start` → `restart`、`at the event` → `at event`。中文一个字没动（最长「点卡片：接着上次」100px）。

半宽格子给文字的空间 = 格宽 − 左右内边距 14 − 图标 18 − 间距 6。面板封顶 368px 时格宽 176.238 → **138px**；
320 CSS 的窄机上面板收到 300、格宽 142.238 → **104px**。所以量了三档、中英各一遍（探针
`devtools/probe-r35-panel.js`，判据是 `text.scrollWidth > text.clientWidth`）：

| 视口 | 语言 | 格宽 | 最长标签 | 需要 | 截断 |
| --- | --- | --- | --- | --- | --- |
| 412×915 | zh | 176.238 | 点卡片：接着上次 | 100 | 0/15 |
| 412×915 | en | 176.238 | Trigger border: on | 101 | 0/15 |
| 458×1018（小米 14） | zh / en | 176.238 | 同上 | 100 / 101 | 0 / 0 |
| 320×732 | en | 142.238 | Trigger border: on | 101 | 0/15（只剩 3px 余量） |

三组之间的列位完全一致：第 1 列图标左边缘 **12.8**、第 2 列 **193**（458 档 159 → 面板封顶后同样是
12.8 / 193）。面板从 14 行降到 8 行，`368×420.5`、`scrollHeight == clientHeight == 419`，**比上一版更矮、
更不会滚**。

### 交付

`TDashcam-Studio-1.2.32-android-universal.apk`（versionCode 1002032，ARM64 + X86_64）在 `TDashcamStudio/` 根目录；
1.2.3 至 1.2.31 的全部旧包原样保留（根目录现共 35 个 APK）。装机实测 `versionName='1.2.32'`，
`SO_MATCH` 通过。

## 第三十六轮（1.2.33）：改名「车迹 / CarTrail」

用户口径：「重新给这个APP想一个名字，目前APP两个字母太累赘了，手机上面显示不全。」给出四个候选后定为
**车迹 / CarTrail**，并明确要求连 APK 文件名与 Tauri `productName` 一起改。

### 命名的三条硬约束

1. **不能出现 Tesla / 特斯拉** —— 商标风险。上游仓库名与录像目录名 `TeslaCam` 是数据本身的命名，保留；
2. **中文两字封顶** —— 启动器两列布局下标签可视宽度约 10 个拉丁字符或 4～5 个汉字，`TDashcam Studio`
   15 字符必然被截；「车迹」两字在任何桌面启动器下都不会截；
3. **英文短形式** —— `CarTrail` 8 字符，应用内切到英文时标题栏、抽屉品牌、关于页都走它。

### 哪些串被改，哪些刻意没改

| 位置 | 改动 |
| --- | --- |
| `src-tauri/gen/android/app/src/main/res/values/strings.xml` | `app_name` / `main_activity_title` → 车迹（**启动器与最近任务标签的实际来源**） |
| `src-tauri/tauri.conf.json` | `productName` → `CarTrail`；窗口 `title` → `CarTrail`；`version` → 1.2.33 |
| `src/index.html` | `<title>`、抽屉品牌 `<span>`、`aboutModalTitle` |
| `src/script.js` | 英文 `pageTitle/headerTitle/aboutTitle/permSteps`、中文同四项、诊断首行、`setHeaderEventName` 默认名、初始化日志 |

**没改的四处，都是有意留的**：

- `identifier` / `applicationId` 仍是 `com.tdashcam.studio`。这是最关键的一条：包名一动就必须卸载重装，
  收藏、每事件进度、最近目录、已授权路径全部丢失。改名轮之后实测覆盖安装，7 条事件与 `localStorage` 原样还在。
- `[lib] name = "tdashcam_studio"` 与 `libtdashcam_studio.so`、`System.loadLibrary("tdashcam_studio")`。
  动手前确认过：`.so` 文件名来自 Cargo 的 lib 名，**不是** `productName`，所以改 `productName` 不牵动加载链，
  不存在 `UnsatisfiedLinkError` 风险 —— 装机后 logcat 干净、页面正常起来，这个判断得到验证。
- `window.TDashcamNative` 与 `window.__tdashcam*` 一组 JS↔Kotlin 桥名。纯内部标识，改它要 Kotlin 与 JS
  同步动，收益为零。
- 关于页的 GitHub 链接、`aboutLicenseNote` 里的「基于桌面版 TDashcamStudio（AGPL-3.0）」—— 那是上游项目名，
  归属说明不能跟着自己的品牌一起改。

### 一处顺带的收敛

`setHeaderEventName()` 在没有选中事件时把标题硬写成 `'TDashcam Studio'`，而这正是竖屏折叠头部那一行
（最容易被截的位置）。现在读 `i18n[this.currentLanguage].headerTitle`，切换语言时头部跟着变，
不再留第二份硬编码来源。

### 实测

- `aapt dump badging`：`application-label:'车迹'`（所有语言变体同一个串，因为只改了默认 `values/`，没建
  `values-en/` —— 系统语言为英文的机器上启动器也显示「车迹」，两字仍然不会被截，这是有意的简化）；
  `package: name='com.tdashcam.studio'`、`versionName='1.2.33'`、`versionCode 1002033`。
- 启动器实测：`uiautomator dump` 里图标下的文字就是 `text="车迹"`（`devtools/r36-appdrawer.png`）。
- 应用内（CDP 读实际 DOM）：zh 下 `docTitle / 抽屉品牌 / 折叠头部` 三处都是「车迹」；切到 en 三处都是
  「CarTrail」，切回 zh 复原。版本 `v1.2.33`。
- md5 交付凭证：设备 `base.apk` 与产物同为 `7a064d1ba58ebf630aeeb379d5025897`。

### 交付

`CarTrail-1.2.33-android-universal.apk`（ARM64 + X86_64）在 `TDashcamStudio/` 根目录。**包文件名前缀从这一版起
换成 `CarTrail-`**，`TDashcam-Studio-1.2.3` 至 `1.2.32` 的 35 个旧包一个没删、没挪，根目录现共 36 个 APK。

导出/抓帧的文件名前缀（`TDashcam_<时间>_<相机>.jpg`、`TDashcam_<时间>_Nc_WxH.mp4`）**这一轮没动**：
它不是界面标签，改了会让新旧产物在下载目录里分成两个前缀，属于「要不要一起统一」的产品决定。

## 第三十七轮（1.2.35）：改名「特写 / Tessera」+ 关于页副标题

用户口径：上一版的「车迹 / CarTrail」不够味 ——「中英文名字能不能让人一眼看出和特斯拉有关系？
同时显得高大上，有文化。」我把「要么用 tesla 要么不用」摆出去后，用户把它推开了：
「**英文名字也要显得和特斯拉有关系，不一定用 tesla，带字母 t 也可以，多想想看**」。

### 名字怎么定的

- **Tessera**：拉丁语「镶嵌小方块」，马赛克画里每一块拼出整幅图 —— 正好是六路画面拼成一段行车记录；
  开头 `Tes-` 直接回声 Tesla，但不是一个词、不借用商标字形。
- **特写**：电影镜头术语（close-up），六个视角里挑一个凑近看，语义对得上「单路放大」这个动作；
  两个字带「特」，中文侧一眼能读成「特…」（特斯拉的联想由用户自己补完）。
- **商标边界（刻意的）**：启动器标签**不放** Tesla 字样 —— 商店审核卡的是「品牌位上的他人商标」，
  而**描述性副标题**是 nominative use。所以「特斯拉」出现在关于页那一行，不出现在桌面图标下面。
  关于页副标题：zh「特斯拉行车记录 · 六路同播」/ en "Six-camera dashcam viewer for Tesla"。

### 改了什么

| 位置 | 值 |
| --- | --- |
| `gen/android/.../res/values/strings.xml` | `app_name` / `main_activity_title` → 特写（**启动器标签的唯一来源**，`tauri android build` 只重写 `assets/tauri.conf.json`，不会碰这个文件） |
| `src-tauri/tauri.conf.json` | `productName` / 窗口 `title` → Tessera，`version` → 1.2.35 |
| `src/index.html` | `<title>`、抽屉品牌 `<span>`、`aboutModalTitle`、新增 `p.about-tagline#aboutTagline` |
| `src/script.js` | 两套 `pageTitle/headerTitle`（en=Tessera / zh=特写）、`aboutTitle`、新增 `aboutTagline`、`permSteps` 里权限引导最后一步的应用名、`updateAboutTexts()` 加 `set('aboutTagline', …)`、`console.log` |

**没改的**：`identifier`（`com.tdashcam.studio` —— 改了就是另一个 App，用户没法覆盖安装）、
`.so` 名（由 Cargo 的 `[lib] name` 和 `Rust.kt` 的 `System.loadLibrary` 决定，与 `productName` 无关，
所以改 `productName` 不可能把库加载弄坏）、上游 GitHub 链接与 AGPL 许可声明（归属要留着）、
导出文件名前缀 `TDashcam_`（同上轮，仍待用户点头才统一）。

### 关于页多一行字，把两档栅格顶爆了（本轮真正的硬知识）

「关于」这张卡在**横屏手机档**和**平板横屏档**是 CSS grid + `grid-template-areas`，
所以新增一行必须**同时**在两个栅格块里加 `"tagline tagline"`，漏一个档那一档就叠位。
三笔实测（探针 `devtools/probe-r37-about.js`，判据 `scrollHeight <= clientHeight`）：

1. **`row-gap` 已经负责行距** → 新行必须 `margin: 0`，否则 12px 下边距白给（915×412 中文溢出 9px）。
2. **默认 `line-height` 在 12.48px 字号上算出 17.9px 行高**，栅格里按 `line-height: 1` 收到 12.5 →
   中文从「差 1px」变成正好贴合。
3. **英文比中文高 13px**：`本机` 那一行的值（`Google sdk_gphone64_x86_64 · Android 16 · API 36 · 915×412`）
   在英文档多折一行，facts 块 45 → 59。中文过了、英文仍然溢出 9px（335 vs 326）。
   最终解法不是压内容也不是缩打赏码，而是**把覆盖层的竖向留白换成高度**：横屏手机档
   `.about-panel { max-height: calc(var(--viewport-h) - 16px - var(--safe-top) - var(--safe-bottom)) }`
   （原来是 `- 32px`）。实测 915×412 英文：面板 336 高、上留 40 / 下留 36，
   都还在 `--safe-top 28.2` / `--safe-bottom 24` 之外，不碰系统栏。

**一个差点踩出去的坑**：中途我用 `#aboutModal { padding-top: … }` 拿留白，几何是对的但会**越权** ——
ID 特异性（1-0-0）压过平板档 `.modal-overlay`（0-1-0）的 `calc(20px + safe)`，
等于顺手把平板的内边距也改了。改用 `.about-panel` 的 `max-height`（同类选择器、且平板档不声明它）
就把影响面锁在「横屏手机」这一档里。**改共享 CSS 时，选择器特异性本身就是作用域。**

**竖屏手机仍然要滚**（412×915 下 856 vs 806），这是既有设计不是回归：`.about-qr` 上面的注释写得很清楚
——210px 高的码扫不上，所以做成「点一下放大」，面板本来就带 `overflow-y: auto`；
关闭键是 `position:absolute` 贴在卡片顶部，滚到哪都在。本轮没为它重排（把 facts 改两列实测只省 11px，
因为值本身会换行，不值）。

### 实测（装机 1.2.35，全部读实际 DOM）

| 视口 | 语言 | 栅格 | `scroll/client` | 结论 |
| --- | --- | --- | --- | --- |
| 412×915 竖屏手机 | zh | flow | 856 / 806 | 按设计可滚，副标题 347×18 正常 |
| 915×412 横屏手机 | zh | grid | 322 / 322 | 不滚 |
| 915×412 横屏手机 | en | grid | 335 / 335 | 不滚（改前 335/326） |
| 1018×458（小米 14 横屏） | en | grid | 335 / 335 | 不滚 |
| 1280×800 平板横屏 | zh / en | grid | 441 / 441 | 两档都不滚 |
| 896×560 两档重叠带 | zh / en | grid | 427 / 427 | 不滚 |

- 名称面（真点击 + DOM）：`docTitle / 抽屉品牌 / 折叠头部` zh 全是「特写」、en 全是「Tessera」；
  关于页 zh「关于特写 / 特斯拉行车记录 · 六路同播」、en「About Tessera / Six-camera dashcam viewer for Tesla」。
- 真点击链路：底部栏 ⋮（物理 934,2236）→「关于」（809,2048）→ 卡片打开、副标题在位
  （`devtools/r37-about-portrait-zh.png`、`devtools/r37-about-landscape-zh-1235.png`）。
- `aapt dump badging`：`application-label:'特写'`（全部 locale 都是它，仍没做 `values-en/`，理由同上一轮）、
  `versionName='1.2.35'`、`versionCode 1002035`、`native-code: 'arm64-v8a' 'x86_64'`。
- md5 交付凭证：设备 `base.apk` 与产物同为 `578e065b26f494d975531dfa9a6d7364`；`SO_MATCH_ARM64` 通过。

### 交付

`Tessera-1.2.35-android-universal.apk`（ARM64 + X86_64）在 `TDashcamStudio/` 根目录，**请装这一个**。
本轮中间产物 `Tessera-1.2.34-android-universal.apk`（英文横屏关于页溢出 9px）**按「旧包一律保留」留在原地**，
不要装它。1.2.3–1.2.33 的 36 个旧包一个没删、没挪，根目录现共 38 个 APK。

## 第三十八轮（1.2.38）：路径整段可读 / 横屏找片卡片让开底栏 / 地址不是链接 / 冷启动 ANR

用户四条：①「"显示路径"的卡片，横屏、竖屏下文件路径都无法完整显示」②「横屏下，首页的"找片"卡片
和下面的菜单栏有重叠」③「请自动安装有助于这个 app 功能、设计、代码等方面优化完善的 skill」
④「排查 bug 并修复」。④ 挖出一个冷启动 ANR，是本轮最值钱的一条。桌面行为一条没动。

### 1. 「显示路径」横竖屏都显示不全（R38-1）

根因是控件选型：单行 `<input>` 配 `white-space: pre` + `overflow-x: auto`。90 个字符的路径按
`0.9rem` 等宽要 ~700px，触控三档没有一档给得起；而触屏上的横向滚动条等于「看不见」——
用户看到的是半条路径，且没有任何可滚的线索。

- `src/index.html`：`<input>` → `<textarea id="filePathInput" rows="1" readonly>`。
- `styles.css` **基础档不动**（`resize: none; white-space: pre; overflow-x: auto`），桌面仍是一行、
  仍可横向拖，和换控件之前逐像素一致；只在触控档改 `white-space: pre-wrap; word-break: break-all;
  font-size: .82rem; overflow-x: hidden; max-height: 32vh; overflow-y: auto`。
  `max-height` 是给「离谱长度」兜底的：那种情况下滚动比把复制按钮顶出面板好。
- 高度由 JS 量：`sizeFilePathInput()` 写 `scrollHeight + (offsetHeight - clientHeight)`。
  第二项是**边框** —— `scrollHeight` 不含 border，而 `box-sizing: border-box` 仍然把 border 记进
  我们设的 `height`，只写 `scrollHeight` 会把最后一行切掉 2px。
- 时机：`showFilePathModal()` 先 `display: flex`，再在 `requestAnimationFrame` 里量高度、加 `.show`。
  隐藏元素上 `scrollHeight` 是 0，这是这类自适应唯一的坑。

实测（装机 1.2.38，同一条 89 字符路径，真点击开面板）：竖屏 412×915 → 框 269×99，
`scrollH 97 == clientH 97`，裁切 0px；横屏 915×412 → 框 460×99，同样裁切 0，复制按钮仍在面板内。

### 2. 横屏「找片」卡片压住底部菜单栏（R38-2）

`.player-area.empty .empty-hero` 一直用 `top: 50%` 在 player 区里居中，但底栏是**浮在** player 区
之上的（R32-6 定的：背景要从栏底下铺过去）。竖屏有 915 高，这点误差看不出来；横屏 player 区只有
~340px 高，卡片下半截正好落在栏上。

解法不是缩小卡片，而是**改成对「栏以上那段空间」居中**：

```css
.player-area.empty .empty-hero { top: calc(50% - 34px - var(--safe-bottom) / 2); }
```

34px = (46 行高 + 5×2 内边距 + 1×2 边框 + 10 离底偏移) / 2；`--safe-bottom` 一起减半，
是因为手势条高的机器上栏本身会被顶上去一点。

实测：915×412 中/英两档都是卡片 97→296、底栏顶 321、**间隙 +24px**；竖屏 412×915 间隙 255px（无回归）。

### 3. 地址不是链接：点「播放」却弹出地图（R38-3，巡检发现）

两件事叠在一起才成立：列表行里的地址 `.city-link` 是**整行最响的文本**（`--border-focus` 蓝 +
`font-weight: 600` + hover 下划线），而它的位置正好是拇指落点；`card.onclick` 又先判「点在链接上」
→ 转去开地图选择器。于是「放这段录像」这个最常见的动作，会掉进一个地图面板。

- 交互：触摸端点地址 = 点卡片（播放）。「看位置」搬进长按菜单，第 5 行
  `data-context="place"`「查看位置 / View location」带 pin 图标，
  `placeRow.hidden = !(event.lat && event.lon)` —— 没 GPS 的事件不出现这一行。
- 样式：触控档把 `.city-link` 和 `.city-link:hover` 一律还原成 `color: inherit`
  / `font-weight: inherit` / `cursor: default` / 无下划线。

**本轮真正的硬知识（差点以为 CSS 坏了）**：第一次把覆盖写在 styles.css:1781 —— 那已经在
1650 行起的**触控档媒体查询里面**了 —— 装机后探针读到仍然是蓝、粗、`cursor: pointer`，纹丝不动。
因为 2799 行还有一条**无媒体查询**的 `.video-time .city-link`，两条特异性**完全相同**（0-2-0），
于是按源码顺序**后面那条赢**。媒体查询对层叠的贡献是 **0**：它只决定「这条要不要参与竞争」，
不参与「谁赢」。所以响应式覆盖的正确位置是**被覆盖那条之后**，而不是「更靠后的响应式块里」。
移到 2815（紧跟 2799/2806 之后）才生效。

实测：真点击地址 → 开始播放且 `mapOpen: false`；长按菜单 7 行、392×379、竖屏完整在屏内；
点「查看位置」→「在地图上查看」正常打开。

### 4. 冷启动 ANR「特写没有响应」（R38-4）

- 现象：`am force-stop` 之后冷启动，约 5 秒弹系统框。`Subject: Input dispatching timed out …
  Waited 5002ms for FocusEvent(hasFocus=true)` —— 卡的是窗口刚出现时的**第一个焦点事件**。
- 栈（`adb root` 后读 `/data/anr/`）：主线程停在 `WebView.evaluateJavascript` ←
  `MainActivity.x(SourceFile:84)`（就是 `pushState`，被 R8 改了名）← `onApplyWindowInsets` ←
  `dispatchApplyWindowInsets` ← `performTraversals` ← Choreographer。
- 为什么卡：insets 回调发生在**首次 traversal 之内**，那一刻 WebView 进程还在启动，
  一个进程里的**第一次** `evaluateJavascript` 要等它 ready，于是主线程被按住 >5 秒。
  安全区注入（R9）从写下那天起就埋着这颗雷；之前没炸，只是因为页面通常起得比 insets 晚不到 5 秒。
- 解法三件套（`MainActivity.kt`，这文件是手工维护的，没有补丁脚本会重新生成它）：
  1. `@Volatile pageReady` 门闩：页面报到之前 `pushState()` 直接 return。页面不存在时推的东西
     会被随后那次导航冲掉，白推。
  2. `scheduleStatePush()`：insets / 获焦 / 配置变化三个触发点全部改成 `decorView.post {}`，
     把 JS 挪出 traversal；`pushScheduled` 去重，一帧内多次 insets 只跑一次。
  3. 页面侧 `DOMContentLoaded` 里调 `TDashcamNative.pageReady()`；`onWebViewCreate` 的梯级
     最后一档 2500ms **无条件开门** —— 万一某个版本这句没跑到（缺脚本、抛异常），
     不能让安全区永久丢失。
- 实测：`force-stop` + `logcat -c` + 重启，ANR 行 0 条，`--safe-top/--safe-bottom` 正常注入。
  **（第三十九轮更正：这一条是假通过，见下方 R39 第 6 节。）**

### 5. 装了什么 skill

按用户口径走了一遍市场 + 社区两路检索，确认后装了 4 个：**Design Review 插件**（含
`accessibility-review` / `responsive-design` / `ui-alignment-review` / `design-debt-review` 等子技能）、
独立的 **responsive-design**、社区 **jezweb design-review**、**web-design-guidelines**。
说清楚边界：**已安装 ≠ 本轮用了** —— 本轮的验收仍是自己写的 DOM 探针 + 模拟器真点击，
下一轮开始可以在设计审查类任务上直接调它们。

### 交付

`Tessera-1.2.38-android-universal.apk`（ARM64 + X86_64）在 `TDashcamStudio/` 根目录，**请装这一个**。
md5 `b4e795e2c0a78b66c4ca3e51931a02bb`，versionCode 1002038，标签「特写」；设备 `base.apk` md5
与产物一致，两个 ABI 均 `SO_MATCH`。中间产物 1.2.36 / 1.2.37 按「旧包一律保留」留在原地。

### 仍挂着、等用户定的

- 改名之后**桌面端**是否也换名（当时动的是共享的 `productName` / 窗口标题 / `<title>` / 抽屉品牌位）。
- 导出文件名前缀要不要统一（现在仍是 `TDashcam_`）。
- 画面烧录水印：等文案 / 位置 / 透明度。

## 第三十九轮（1.2.40 / 1.2.41）：手机导出前缀 / 收敛「缝合怪」 / 玻璃面板与滚动条

用户两条：①「桌面版不动，手机 APP 导出前缀改一下」②「总觉得这个 APP 的 UI 和交互有点缝合怪，
看能不能优化一下？」。第二条是本轮的主菜，也是**最难验收**的一条 —— 「缝合怪」不是一个 bug，
是几十处各自为政的取值凑出来的观感。所以本轮的做法是先盘点、再定机制、最后逐屏复测。
桌面行为仍然一条没动（下面第 3 节说明为什么结构上不可能动）。

### 1. 导出/抽帧文件名前缀：手机 `Tessera_`，桌面仍 `TDashcam_`（R39-1）

`src/script.js` 顶部加一个常量，两处拼名字的地方改读它：

```js
const ANDROID_FILE_PREFIX = isAndroidRuntime() ? 'Tessera' : 'TDashcam';
```

- 抓帧（`saveSnapshot`，script.js:12122）→ `Tessera_2026-09-29_12-30-00_front.jpg`
- 导出（script.js:16266）→ `Tessera_2026-09-29_12-30-00_1c_480x1072.mp4`

两条都是**真点击**跑出来的，不是拼出来的字符串：装机后模拟器 `adb shell ls -t` 里
`/storage/emulated/0/Download` 最新文件就是上面那个 mp4（971055 B，549/549 帧），
而更早的 `TDashcam_*` 一批原样保留。桌面侧的 `TDashcam_` 与其余桌面文件名一律未改。

### 2. 「缝合怪」盘点：同一个 APP 里有七种蓝紫

先把 styles.css 里所有硬写的品牌色数了一遍（改前）：

| 字面值 | 出现次数 | 它是谁 |
| --- | --- | --- |
| `#007bff` | 8 | Bootstrap 蓝，桌面主强调色 |
| `#007aff` | 6 | iOS 蓝，差 1 个色号，肉眼几乎分不出 |
| `#667eea` | 12 | 靛紫渐变起点 |
| `#764ba2` | 4 | 同一渐变的终点 |
| `#8b5cf6` | 6 | Tailwind violet-500，**只有文件夹浏览器在用** |
| `#a78bfa` | 2 | violet-400，同上，用在分隔线 |
| `#a855f7` | 2 | purple-500，第三处方言 |

圆角同理：`4/6/8/10/12/14/16/20/22/999px` 十级混用，其中 10px 和 22px 各只有零星几处。
**结论：观感上的「缝合」不是某个页面做坏了，是同一层级在不同页面取了不同值。**

### 3. 收敛机制：基础档 = 桌面现值，触控档改指向

没有采用「统一改 token 基础值」的写法（那会直接改掉桌面像素），而是：

```css
:root {                       /* 4958 行起：桌面档 */
    --accent: #007bff;        /* 基础值就等于桌面今天实际渲染的值 */
    --accent-solid: #5b4bf0;
    --cta-fill: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --r-sheet: 20px; --r-panel: 16px; --r-card: 12px; --r-chip: 8px; --r-pill: 999px;
}

@media (max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px),
       (hover: none) and (pointer: coarse) {   /* 4983 行：触控档只改指向 */
    :root, body.dark-theme {
        --accent: var(--glass-tint);
        --cta-fill: var(--accent-solid);
        --bg-button: var(--accent-solid);
    }
}
```

这样**桌面不可能变**：基础值就是它现在的值，触控媒体查询在桌面上根本不匹配。
两个细节值得记：

- `body.dark-theme` 必须和 `:root` 一起写在覆盖里 —— 它特异性 0-1-1 压过 `:root` 的 0-1-0，
  只写 `:root` 的话深色主题不跟（R38 那条层叠教训的同一课）。
- 文件夹浏览器是整块「第三种方言」，但它的桌面档也要保留紫色，所以**没有走 token**，
  单独给它一个触控档覆盖块。
- 顺带清掉一个死值：`--accent-primary` 被引用但从未定义（永远解析成空），改成 `--accent`。

复测（1.2.40 装机）：`#peStartBtn` 从 `rgb(0, 122, 255)` → `rgb(91, 75, 240)`；
`.clip-selection` → `rgba(91,75,240,.14)`；`.about-version` 由渐变字改成平色；
**方言扫描 0 命中**（探针遍历全 DOM，比对上面七种字面值的 rgb 形式），浅色/深色 × 竖屏/横屏
四组都跑，覆盖首页、列表、⋮ 面板、播放器、导出面板、关于页。

### 4. 玻璃面板在播放器上是假的（R39-3，本轮最有用的新发现）

现象：⋮ 面板、底部动作栏叠在**播放中的画面**上时，字是看得见的，但底下那层「毛玻璃」
其实一点都没糊 —— 画面直接透上来。

根因不在 CSS：Android WebView 把 `<video>` 合成在**独立的硬件 surface** 上，
`backdrop-filter` 采样不到那个 surface。而 `CSS.supports('backdrop-filter','blur(10px)')`
返回的是 **true** —— 所以项目里原有的 `@supports` 降级门**抓不到这个失效模式**，
它只能识别「完全不支持 backdrop-filter」。

改法不是去动合成，而是把触控档的填充不透明度抬上去，让它在**没有糊的情况下也能读**：

```css
:root        { --glass-bg-soft: rgba(255, 255, 255, 0.88); }  /* 桌面仍是 0.6 */
body.dark-theme { --glass-bg-soft: rgba(30, 32, 40, 0.84); }  /* 桌面仍是 0.55 */
```

这个 token 有四处读取（底部动作栏、⋮ 面板 + 折叠态右上角组、首页空态 hero、一枚 22px 徽标），
且四处**全都在触控媒体查询内部**，所以桌面拿不到这次改动。

实测（1.2.41 装机，真点击 + 截图）：竖屏浅色 ⋮ 面板 `rgba(255,255,255,0.88)`、
深色 `rgba(30,32,40,0.84)`，横屏底部动作栏同值；两张截图里面板文字与画面对比清晰，
不再有「画面透过菜单」的感觉。

### 5. 8px 常驻滚动条是手机上最响的桌面味（R39-3）

styles.css:3235 有一条全局 `::-webkit-scrollbar { width: 8px }`（桌面要它），
安卓自己用的是会自动淡出的 overlay 条。触控档里给四个真正靠手指滚的面板关掉：
`.modal-content / .file-list / .metadata-content / .dir-browser-list`
（`scrollbar-width: none` + `::-webkit-scrollbar{width:0;height:0}`）。

**这里踩到一个探针坑，值得记**：这台 WebView 的 `getComputedStyle(el)['scrollbar-width']`
返回空串，也就是说**没法用 computed style 证明改动生效**。改用布局学量法：
`offsetWidth - clientWidth` = 左右边框 + 经典滚动条宽。同时造一个不受规则影响的对照元素
（临时 `overflow-y: scroll` 的 div）：

| 目标 | 是否可滚 | `offsetWidth - clientWidth` |
| --- | --- | --- |
| 对照 div（未改） | 是 | **8px**（经典条） |
| `.file-list`（抽屉列表） | 是 | **0px** |
| `.modal-content.about-panel` | 是 | **1px**（只有 0.76px 边框的四舍五入） |

对照组证明 8px 条在这台机器上是真的会渲染，前三行才说明「关掉」确实生效。

### 6. 更正上一轮：「实测 ANR 0 条」是假通过

R38 第 4 节写了「`force-stop` + `logcat -c` + 重启，ANR 行 0 条」。这句话**不成立**，
已在原文处标注。原因：`logcat -c` 之后只覆盖了那**一次**冷启动，而模拟器首帧要走
gfxstream/Vulkan 的 `vkEnumerateInstanceVersion` 一次性往返，宿主机 CPU 忙的时候
这个往返本身就能把输入分发拖过 5 秒，报出来还是同一个 `Input dispatching timed out`。
也就是说：那次「0 条」既可能证明不了应用已修好，也可能是模拟器自己的锅。
MainActivity 那三件套（`pageReady` 门闩 / `post{}` / 2500ms 无条件开门）方向是对的，
但**结论要重下**：判「不卡」需要多次冷启动 + 写清宿主负载，真机（小米 14）上再确认一次。

### 7. 顺手发现、但没动的（记录判断，不当场改）

- **`应用目录` 这个按钮名会骗人**：它跳到 APP 私有目录（然后是一张 `No such file or directory`
  权限卡），真正要点的「选择此文件夹」反而没有 class、名字最不起眼。本轮我在它上面连误点两次。
  这是**文案/信息架构问题**，改法要用户定，所以只报不改。
- **关于页把版本号显示了两遍**（hero 大字 + 「版本」行），同理，属内容改动。
- 手机上仍剩约 16 处字面 px 圆角：`.map-btn` 的 10px 在按钮族里已经是一致层级（事实上的第 6 档），
  换成 token 收益为零；语义状态色（绿/橙）和品牌色不是一回事，**故意不收敛**。
- 死代码：`.dir-select-btn` 的紫色渐变（该 class 在 DOM 里已不存在）、
  `#startClipBtn:hover` 的渐变（触屏无 hover）。留着不影响，但下轮清理可以顺手删。
- 头部与列表标签里仍有 emoji，和 SVG 图标混排；R33-5 只统一了 ⋮ 面板。

### 交付

`TDashcamStudio/` 根目录两个包，**请装最新的 1.2.41**：

- `Tessera-1.2.40-android-universal.apk` —— md5 `dfb51fc6ab5c5ffb116efaa679530dcb`（R39-1 + R39-2）
- `Tessera-1.2.41-android-universal.apk` —— md5 `6e045f498bd91b93a16a46eaa47cefaa`，
  versionCode 1002041（R39-3）。设备 `base.apk` md5 与产物一致，arm64-v8a / x86_64 两个 ABI 均
  `SO_MATCH`；关于页大字实测显示 `v1.2.41`。1.2.39 及更早的包按「旧包一律保留」全部留在原地。

### 仍挂着、等用户定的

- 画面烧录水印：等文案 / 位置 / 透明度。
- ~~D20 速度曲线点击跳转（R41-9）、C14 长列表虚拟滚动（R41-10）、B11 双击切相机（R59）~~ 都已完成；
  这一组里只剩 D19 APP 内地图轨迹（`ROUTE_TRACK_ENABLED` 目前仍为 `false`）。
- 「应用目录 / 选择此文件夹」的文案怎么改；关于页版本号要不要去掉一处。
- 全部改动仍未提交（clone 没有 git 凭据）；1.2.x 系列从未在真机小米 14 上回归过。

## 第四十轮（1.2.42）：弹出U盘后不再残留U盘路径，点它也不会再翻出手机存储的视频

用户报告：「弹出U盘后，列表里面还会出现U盘的路径，点击还会出现手机存储里面的视屏。」
这一句里其实是两个 bug，而且是同一笔欠账的两次收款。

### 1. 现象与根因（模拟器实测复现）

复现台架：模拟器挂 USB 存储（`/storage/0000-0000`，卷 id `public:253,80`），
弹盘 = `adb shell umount /storage/0000-0000`（挂载点会变成 root 私有的空目录，app 侧读到的是
`Permission denied (os error 13)`），回插 = `adb shell "sm unmount public:253,80; sleep 2;
sm mount public:253,80"`。
**不要**用 `mount -o bind /mnt/media_rw/... /storage/...` 假装回插：vfat 的 dmask 0007 + gid 1023
会让 bind 出来的目录只有 root 可读，app 依旧拿不到，白白造出一个假的「冷启动误删」。

四条根因，一条比一条深：

1. **死路径会被当成「已加载」提交**。`loadTauriDirectory()` 一进门就把 `this.lastScannedPath = path`
   （script.js:14380），扫描抛错后只 toast 一句「读取失败」就返回。于是表头和选中态 chip 指着
   一个已经不存在的U盘目录，而屏幕上的事件卡片还是上一个文件夹（手机存储）的 —— 这就是
   「点U盘路径却出现手机存储的视频」看起来像 app 把两块盘搅在一起的原因。
2. **四处记忆路径没人清理**：抽屉里的「最近目录」chips（`tdashcam.recentDirs`）、
   自动恢复用的 `tdashcam.mediaDir`、Tauri config 的 `lastTeslaCamPath`、文件夹浏览器的起始路径
   `androidBrowsePath`。冷启动会直接把上次的（已经不存在的）目录恢复进来。
3. **所有 `list_subdirs` 失败一律报成权限问题**。`androidBrowseTo()` 的 catch 直接走
   `showAndroidPermissionHint()`，把「文件夹不在了」说成「没给所有文件访问」，还把人支去拨系统开关。
4. **拔盘这个事件根本传不上来**。挂载点拔盘后仍然留在 StorageManager 的卷列表里（只是每次读都被拒绝），
   所以监听器按「卷列表 diff」算出来的 `gone` 恒为空；而外接卷的文件数永远拿不到 ——
   Kotlin 的 `requestVolumeCounts()`（MainActivity.kt:497）靠 `File("/storage").list()` 枚举，
   普通 app 没有权限列这个目录（`drwx--x--- shell everybody`），结果只有 `/storage/emulated/0`
   会得到数字，外接卷永远是 `-1`。**第一版监听器就是按这个 `-1` 判拔盘的，实测 60 秒一次都不触发**，
   SDCARD chip 也一直顶着「含 TeslaCam」保持可点。

### 2. 改了什么

全部只在安卓分支生效（`isAndroidRuntime()`），桌面端一行没动。

- **监听器改判「可答 → 连续两次拒答」**（`setupVolumeWatcher()` script.js:13804）。
  对每个外接卷直接问 `probe_readable`（script.js:13843），不再等那个永远不会来的原生计数；
  读数写进 `volumeEntryCounts`，chip 上的「含 TeslaCam / 无法访问」因此是实测出来的。
  判定要失败两次才算数：正在拷片的设备偶尔会拒绝一次列目录。
- **`isGoneError(path, message)`**（script.js:13933）：`No such file`/`ENOENT` 直接算「不在了」；
  `Permission denied` 只有在①路径是外接卷挂载点（`/storage/<label>`，排除 `emulated`/`self`/`users`）
  且②系统权威状态显示「所有文件访问」确实已经授予时才升格为「不在了」—— 没授权时它仍然是权限问题。
- **`scannedPathGone()`**（script.js:13941）加了 2 秒后的二次确认。1.2.42 的上一版构建（内部称 build-e）
  在冷启动时把一块健康U盘的 chip 误删了：启动瞬间的 `EACCES` 被当成「文件夹没了」；
  现在第一次判死要 2 秒后再问一次才作数。
- **`pruneStaleStorage(roots)`**（script.js:13967）一次性清理上面那四处记忆，并把死卷的
  `volumeEntryCounts` 删掉 —— FAT32 卷按卷标命名，两块盘都会挂到 `/storage/0000-0000`，
  死盘留下的计数不能跟着新盘活过来。
- **`forgetRemovedVolumes(paths, options)`**（script.js:14009）分三种话说：
  屏幕上的片子确实来自死盘 → 清空列表 + `volumeGone`；
  片子来自别处、只有路径是死的 → `pathGoneKept`（同时点名死路径和「现在看的还是 {上一个文件夹}」）；
  只清掉一个死 chip → `stalePathDropped`。文案新增 en/zh 六个 key：
  `pathGoneKept`、`stalePathDropped`、`previousFolder`、`dirGoneTitle`、`dirGoneBody`、`dirGoneSteps`。
- **`loadTauriDirectory()` 失败时回滚**（script.js:14475）：`scannedPathGone` 判死后先把
  `lastScannedPath` 恢复成 `previousPath` 再清理，留在高亮的 chip 才是「屏幕上这批片子真正来自哪里」。
- **`androidBrowseTo()` 认出「文件夹没了」**（script.js:14168）：显示 `dirGoneTitle` 那张卡
  （「这个文件夹已经不在了」+ 怎么办 + 原始错误串），并且**藏掉**「去开所有文件访问」那颗按钮。
  截图见 `devtools/r40b-shot1.png`。
- **dead chip 不再可点**：`setupRecentDirs()`（script.js:11890）点 chip 前先 `scannedPathGone` 预检，
  打开浏览器时 `pruneDeadRecentDirs()`（script.js:11952）先扫一遍；
  `loadLastTeslaCamPath()`（script.js:13285）恢复前预检，死路径直接丢弃而不是恢复成一个错误。

### 3. 实测（1.2.42 装机，模拟器 1080×2400@420dpi，真实点击 + 真实 umount）

| 时刻 | 操作 | 结果 |
| --- | --- | --- |
| 23:35:07 | 选U盘目录后 | `files=8 groups=1`，`lastScanned=mediaDir=/storage/0000-0000/TeslaCam`，recent 3 条 |
| 23:35:1x | `umount /storage/0000-0000` | — |
| 23:35:30 | 监听器第 2 轮 | `files=0 groups=0 lastScanned="" mediaDir=null`，recent 里的U盘条目已消失，toast「存储设备已弹出，或该文件夹已不存在 —— 列表已清空。重新插好后在「文件夹」里再选一次。」 |
| 23:37:09 | 真实点底栏「文件夹」 | SDCARD chip 变 `dir-volume-chip kind-sd no-access` + `disabled`，路径退回挂载点本身；recent 只剩两条手机目录 |
| 23:38:12 | `sm mount` 回插 → 真实点 chip → 真实点「选择此文件夹」 | `files=8 groups=1` 恢复，U盘重新进入 recent |
| 23:38:56 | `am force-stop` 后冷启动（盘在、健康） | 自动恢复 8 条片子，recent 3 条**一条没被误删**（build-e 的那次误删不再复现） |

判定延迟约 12~24 秒（监听周期 12 秒 + 二次确认），后台回前台（`visibilitychange`/`focus`）会立刻补一轮。

### 4. 交付

`TDashcamStudio/` 根目录三个包，**请装最新的 1.2.42**：

- `Tessera-1.2.40-android-universal.apk` —— md5 `dfb51fc6ab5c5ffb116efaa679530dcb`
- `Tessera-1.2.41-android-universal.apk` —— md5 `6e045f498bd91b93a16a46eaa47cefaa`
- `Tessera-1.2.42-android-universal.apk` —— md5 `47e6a14e87abba6a545668f6d5c85331`，27 726 211 字节，
  versionCode 1002042（本轮）。设备 `base.apk` md5 与产物一致。1.2.41 及更早的包按「旧包一律保留」
  全部留在原地。

### 5. UI 与交互：还能从哪些方面完善（盘点，本轮只列不动手）

按「有实证 / 代价 / 用户能感觉到」排。前四条是这一轮实测里顺手记下的，不是猜的。

1. **「应用目录」这颗按钮名字骗人**（实证：本轮我自己连点错两次）。它不是「确认这个目录」，
   而是跳到 app 自己的私有目录。在文件夹浏览器里，唯一的确认动作应该叫「选择此文件夹」，
   另一颗要么改名「打开 APP 存档目录」要么干脆收进长按。
2. **「最近目录」chip 的自动短名读不出设备**：`renderRecentDirs()` 的 `labelFor()`（script.js:11984）
   取「最短不重名的尾部」，于是 `/storage/emulated/0/TeslaCam` 显示成 **「0/TeslaCam」**
   （截图 `devtools/r40c-home.png`），而 `/storage/0000-0000/TeslaCam` 显示成「0000-0000/TeslaCam」。
   两个都对，但没人能从「0」看出那是手机内部存储。应该把已知挂载点翻成人话（手机 / U盘卷标 SDCARD）。
3. **筛完没结果时是死路**：`noRecordsFound` 只有一段话（script.js:4012），没有「清除筛选」这颗按钮。
   手机上误触分类 chip 之后，唯一出路是记得那颗 chip 在哪。
4. **动效完全不受系统「减弱动态效果」影响**：`prefers-reduced-motion` 在 styles.css 出现 0 次，
   而 `transition:` 有 66 处、`@keyframes`/`animation` 12 处。安卓「设置 → 辅助功能 → 移除动画」
   对本 app 毫无作用，前庭敏感用户和低端机都吃这一份开销。
5. **进度类控件读不出来**：`role="progressbar"` 与 `aria-valuenow` 各 0 次 —— 导出进度条、
   播放进度条对读屏只是「一个东西」。toast 容器有 `aria-live`（script.js:9817），这是唯一做对的一处。
6. **触感反馈几乎没有**：`navigator.vibrate` 全文 1 处。长按卡片、删除事件、导出完成、
   下拉刷新到位这几个时刻都该有一下（安卓 WebView 需要用户手势内调用，且要门控在 `isAndroidRuntime()`）。
7. **还有 17 处 `alert()`**：手机侧已有 toast 兜底，但 `alert` 会冻住 WebView 主线程并挡住画面，
   该逐个换成 toast / 确认卡。
8. **关于页版本号出现两次**（大数字 + 行内小字），删掉哪一处等用户定。
9. **旧账**：D20 速度曲线点击跳转、~~C14 长列表虚拟滚动（U盘几千个事件目录时列表仍是全量 DOM）~~
   （这条写错了：手机端早就是分页渲染 —— `LIST_PAGE_SIZE = 60` / `appendListPage()` /
   `armListScroll()`，详见第四十一轮的更正）、
   画面烧录水印（等文案/位置/透明度）；1.2.x 从未在真机小米 14 上回归。

### 仍挂着

- 上面第 1、7、8 条要用户点头才动（涉及措辞和「桌面版不动」的边界）。
- 原生 `requestVolumeCounts()` 依旧列不了 `/storage`，所以外接卷「有几个文件夹」这种细粒度信息
  拿不到，只能靠 `probe_readable` 的「可答 / 拒答」两种状态。真要精确，得把 Kotlin 侧换成
  `StorageManager.registerStorageVolumeCallback` / `MediaStore` 卷视图。
- 拔盘判定最快也要 12 秒（周期），做不到「拔了立刻」；`sm` 事件在 WebView 侧没有直通通道。
- 全部改动仍未提交（clone 没有 git 凭据）。

## 第四十一轮（1.2.43 / 1.2.44 / 1.2.45）：上一轮盘点的九条一次做完

用户只说了一句「请把上面列出来的一并改了。」，所以上面 §5 的第 1..8 条全部落地；第 9 条里的
D20（速度曲线点击跳转）也做了，C14 见下面的更正，画面烧录水印继续等文案/位置/透明度。

### 1. 逐条落在哪里

1. **「应用目录」改名 + 分出主次**：文案改成「打开 APP 存档目录」，与「选择此文件夹」用
   `--modal-chip` / `--accent` 两档区分，不再让人以为点它是确认当前目录。
2. **最近目录 chip 说人话**：`dirDisplayName()` 把已知挂载点翻成「本机存储 · TeslaCam」，
   U盘显示卷标；不再出现「0/TeslaCam」这种自证式短名（见交付段的实测）。
3. **筛完没结果不再是死路**：`hasActiveFilters()` / `clearFilters()`，`VideoListComponent.render()`
   的空态里加 `.clear-filters-btn`，误触分类 chip 后一键回来。
4. **尊重系统「减弱动态效果」**：`styles.css` 末尾新增 `@media (prefers-reduced-motion: reduce)`，
   统一把 transition/animation 压到 0.01ms。模拟器实测该媒体查询**不跟随系统动画缩放**，
   只能用 CDP `Emulation.setEmulatedMedia` 验，别在真机上按「关掉动画」来验收。
5. **进度条读得出来**：新增 `setBarPercent(el, percent)`（script.js:933），同时写宽度与
   `aria-valuenow`；导出条、剪辑条、播放进度容器（5492）都改走它。实测拖动到 65% 时
   `aria-valuenow` 跟着变 65。
6. **关键操作补触感**：`haptic(pattern)`（886）统一门控在 `isAndroidRuntime()`，调用点 9 处 ——
   长按卡片（12308）、直选控件（12820/13154）、下拉刷新到位（12927）、导出完成/失败
   （16817/16829）、自动下一个（13102/13113）等。全文只剩 `haptic()` 内部一处直接
   `navigator.vibrate`。
7. **剩下的 `alert()`**：全部改成 toast / 确认卡。
8. **关于页版本号只留一处**：保留 `#aboutVersion` 这一个写入目标。
9. **D20 速度曲线点击跳转**：`seekFromSpeedGraph(e)` 按点击位置换算秒数后 `seekToTime()`。
   模拟器那批合成 MP4 **一条 SEI 都没有**（7 个事件的 span 全是 0），所以这条是喂合成样本走
   生产函数 `drawSpeedGraph()` 再真点击验的：点 65% → 跳到 11.83 s。真车片段才会有的遥测路径
   仍未在真机回归。

### 2. 为什么打了三个包

- **1.2.43**：上面九条本体。
- **1.2.44**：装机复验时发现第 2 条的 chip 短名逻辑没覆盖外接卷根目录，补 `dirDisplayName()`。
- **1.2.45**：补下拉刷新/长按倍速两处触感，并把一批因 Edit 参数写反而**静默没落盘**的改动重做。
  教训记在这里：批量 Edit 之后要用 `grep -c` 复核，不能只看返回成功。

### 3. 对上一轮记录的更正

§5 第 9 条里写的「C14 长列表虚拟滚动（U盘几千个事件目录时列表仍是全量 DOM）」**是错的**：
手机端早已是分页渲染 —— `LIST_PAGE_SIZE = 60`（4091）、`appendListPage()`（4156）、
`armListScroll()`（4172），滚到底才追加下一页。真正没做的是「几万条时上屏的 DOM 总量仍然线性
增长」这一档，需要的是回收已滚过的行，而不是首次渲染分页。

### 交付

- `Tessera-1.2.43-android-universal.apk` / `1.2.44` / `1.2.45`，三个都留在项目根目录，旧包不删。
- 1.2.45 md5 `7c573cf71a1e1bd18902be0293b261fd`，装机后设备 `base.apk` md5 与产物一致。

## 第四十二轮（1.2.46）：多路播放卡顿 / 循环切换改直选 / 版本号回到小字

用户三条：「1.多路视频播放有点卡顿，优化一下。2.更多——播放与列表——"点卡片"里面有三个功能，
每点一次切换，有点繁琐，改为直接可以选的。切换主题同理。3.版本号用之前小字的版本，现在这个太大了。」

### 1. 卡顿：五处，全部能量化的才动

播放管线摸底（六路 `<video>` 常驻、一个 loopback HTTP 服务、SEI 在主线程整文件解析）后，
按「收益明确 + 不动桌面行为」排序，做了这五条：

1. **拆掉 60fps 的标签循环**。`MultiCameraPlayer.renderLoop()` 原本每帧 `querySelector` + 给四到六个
   `.camera-label` 写 `innerText`，而相机名只有布局和语言会变。现在改成事件驱动的
   `syncCameraLabels()`，由 `updateLayout()`（4601）和语言切换（14879）调用，
   `requestAnimationFrame` 常驻循环**彻底删除**。
2. **布局看不到的路不再解码**。新增 `visibleCameras()` + `applyFeedVisibility()`（4499）：
   只门控在 `isAndroidRuntime()`，把当前布局画不到的路 `pause()` 并记进 `suspendedFeeds`；
   切回能看到它们的布局时，先对齐主机位置（差 > 0.4 s 才 seek）再续播。
   六宫格 0 路、四宫格 2 路、大小窗 2 路、单路 5 路省下来。
   **两个刻意的例外**：`front` 永远不挂起 —— 进度条、同步 tick、「播完自动下一个」都读它的时间；
   `waitForAllVideosLoaded()`（4620 附近）在手机上只等可见的路，一段一分钟边界不再被两路
   看不见的缓冲拖住。
   代价说清楚：从「单路」切到「六宫格」时，刚被挂起的路会有短暂的黑格等待重新起播。
3. **同步只纠偏真正掉队的**。`syncAllPlayers()`（4700 附近）跳过被挂起的路、跳过 `player.seeking`
   的路，手机上的容差从 0.1 s 放宽到 0.35 s（桌面保持 0.1）。以前是每 100 ms 对六路各写一次
   `currentTime`，而每一次写都是一次真 seek：一次解码 + 一次 range 请求。
4. **SEI 不再重复下载整文件**。`MetadataManager.seiCache`（2770，上限 3 段）按路径缓存已解析的
   遥测；回看上一个分段、或换布局导致分段重载，不再走一遍「loopback 上整只 MP4 拉下来 +
   主线程 protobuf 全解」。同时 `updateDisplay()`（3068 附近）在抽屉折叠且没开「详细数据」板时
   直接返回，不再为看不见的面板每 100 ms 写十几个 DOM。
5. **loopback 服务不再自己掐自己**。`stream_server.rs`：`WORKER_THREADS` 8 → 16（一个 worker 要
   等整个响应写完才回到 accept，六路 + 缩略图 + 遥测同时来就是排队），读缓冲 8 KB → 256 KB
   （`BufReader::with_capacity`），并补 `Cache-Control: private, max-age=60` —— 之前没有 ETag 也没有
   新鲜度，媒体元素每次重设 `src` 都是整文件重拉。

没做（评估过，判风险大于收益）：把 `bytes=100-` 的开区间上限夹到某个窗口（MP4 尾部的
`moov` 读取会被打断）；把 SEI 解析搬进 Worker（要引 protobuf 与解析器进 worker，改动面远超一轮）。

### 2. 「点卡片」和「主题」改成直选（R42-2）

三态藏在同一颗按钮里按顺序走，从「接着上次」到「跳到事件」要两次点击，而且永远看不到另外两个
选项叫什么。现在 ⋮／更多 面板里是两行分段控件：

- `src/index.html`：删掉 `#tapBehaviorBtn`，新增 `#tapBehaviorChoice` / `#themeChoice` 两行
  （`role="group"` + `role="radio"` + `aria-checked`），`data-mode` 分别是
  `resume|start|event` 与 `auto|light|dark`。桌面那颗 `#themeToggleBtn` **保留**，桌面还是单击循环。
- `src/script.js`：`syncChoiceRow()`（896）统一负责行标题、选中态与 `aria-checked`（只用强调色
  高亮的话，读屏读不出选了哪个）；`bindChoiceRow()` 一行一个委托监听；
  `cycleTapBehavior()` 换成 `setTapBehavior(mode)`（12815），`setThemeChoice(mode)`（13150）新增，
  两者都各带一次 `haptic(10)` 和一条 toast。`tapModeResume/Start/Event` 三个带前缀的串留给 toast，
  分段本身用新的 `tapOpt*` / `themeOpt*`。
- `src/styles.css`：`.menu-choice` / `.choice-segment` 一组，段高 40px、`--r-pill`、
  `--modal-chip` 底 + 选中 `--accent` 填充；门控用 `(hover: none) and (pointer: coarse)` 而不是宽度，
  因为一个被拉到 768px 的**桌面**窗口也会拿到手机抽屉，它得留着原来那颗按钮。

### 3. 版本号回到小字（R42-3）

`.about-version`（7421）改回行内小字：`font-size: 0.8rem`、`--modal-muted`、等宽字体、去掉渐变
与 `-webkit-text-fill-color`；横屏覆盖（7764）同步降档，粗指针下那条把它刷成强调色的覆盖规则删除。

### 实测（真点击，emulator-5554，1.2.46）

- **R42-2 直选**：一次点击即生效 —— 「深色」一下就到深色，「浅色」一下回浅色，「点卡片」三态各
  一下切换，`aria-checked` 跟着走，没有再出现「点两下才动」或误触关闭抽屉。桌面那颗
  `#themeToggleBtn` 在粗指针门控下 `display:none`，窄窗口（非触屏）仍在。
- **R42-3 版本号**：`.about-version` 计算样式 = `12.8px / font-weight 600 / rgb(95,103,115)`，
  即行内小字，不再是开屏大数字。
- **R42-1 机制**：四宫格与大小窗下 `suspendedFeeds = [left_pillar, right_pillar]`，这两路确实
  `paused` 且停在 0；切回六宫格后集合清空、两路被拉起并对齐到前视的 18.27s；相机标签随布局
  `block/none` 正确翻转；无 JS 错误（`window.__jsErrors` 空，错误横幅隐藏）。
- **卡顿本身没法在模拟器上量化**：这台模拟器 CPU 长期饥饿，单路跑 rVFC 也只有约 4fps，
  A/B 出来的数字全是调度噪声。它能验的是「少了解码器数量、少了 RAF、少了重复解析」这些机制
  是否按预期生效，真·流畅度要在小米 14 上回归。六宫格同时推进率实测 0.96~1.00（left 0.64）。
- 验收后已把设备状态复位：点卡片行为回到「接着上次」（真实点击一次，`aria-checked` 与
  `localStorage` 一致）、主题「跟随系统」、竖屏、六宫格、目录停在手机 `/storage/emulated/0/TeslaCam`。

### 交付

- `TDashcamStudio/Tessera-1.2.46-android-universal.apk` —— md5 `8d44ee569326cb714ecf679a73c161f0`，
  27,731,611 字节。已 `adb install -r` 到 emulator-5554，设备上 `base.apk` 的 md5 与本地文件逐位一致。
- 旧包一律保留不动：根目录现有 1.2.40 / 41 / 42 / 43 / 44 / 45 / 46 七个 APK。
- 全部改动仍未提交（clone 没有 git 凭据）。

## 第四十三轮（1.2.47 / 1.2.48 / 1.2.49 / 1.2.50）：直选行的排版终于对上了

需求原话：「循环切换改了后，排版不好看，请优化。」附一张小米 14 浅色主题的真机截图 ——
「点卡片」和「主题」两行是**三段左对齐的纯文字**，没有轨道、没有选中态、没有任何边框。

### 根因：上一轮那份 CSS 从来没生效过

不是"设计得不好看"，是**设计根本没落地**。⋮ 面板自己的规则（`styles.css:274-296`）

```css
.header-collapsed .header-actions-group button { width/height/border-radius/display/
    flex-direction/justify-content/padding/background-color/color/border/font-size/
    font-weight/margin/box-shadow … !important }
```

对面板里**每一个** `<button>` 都强制了这十几条，而 `.choice-segment` 也是 `<button>`。
它的特异度是 `.choice-segment`（0,1,0），比不过上面那条（0,2,1），所以 R42-2 写的
`border-radius` / `background-color` / `justify-content` 全部被吃掉。装机 1.2.46 实测
computed style：`justify-content: flex-start`、`border-radius: 8px`、
`background-color: rgb(248,249,250)`、`font-weight: 400` —— 和截图完全对得上。

> **这一轮的账要记在自己头上**：R42-2 的验收只测了「点一次 `.on` 有没有跟着换、`aria-checked`
> 有没有更新、`localStorage` 有没有写」，这三条**全绿**，因为它们走的是 JS 而不是 CSS。
> 验收截图当时就在手上，我看成了「两条新行都在」就交了。以后凡是改样式的，验收必须包含
> **computed style 比对**或**截图与设计意图的目视核对**，不能只验状态。

修法是把面板内那十几条以**同等特异度 + `!important` + 更靠后**回敬回去（`.header-collapsed
.header-actions-group .choice-segment`），别无他法 —— 这条 CSS 层叠的账在 38 轮 `R38-3b`
（地址链接样式覆盖失效）已经踩过一次。

### 直选行重新做成一个真的分段控件

- **轨道**：新增 token `--choice-track`（浅色 `#e3e8f1`，深色 `rgba(255,255,255,.10)`）与
  `--choice-track-hover`。没有直接用 `--modal-chip` —— 它和白玻璃面板只差一档，铺成一条轨道时
  根本读不出"槽"。
- **选中块**：`--accent-solid`（两套主题都是 `#5b4bf0`）+ 字面 `#ffffff`，约 6.4:1。
  这里有个坑：`--accent-contrast` **在整个仓库里从来没有定义过**，写 `color: var(--accent-contrast)`
  会退化成继承色，而深色主题的 `--accent` 是淡紫 `#b9aeff`，白字压上去只有 1.9:1。
- **触摸设备的 `:hover` 会粘住**：面板自带的 hover 是一整块灰底，三段都变灰就看起来"三个都选中"，
  所以 hover 色单独压成 `--choice-track-hover`。
- **栅格**：行高就是面板本来的 40px，左内边距 31px（= 面板内边距 7 + 图标 18 + 间距 6），
  于是「点卡片 / 主题」这两个标签落在其他行**文字**所在的同一列；标签列定宽 4.4em，
  两条轨道起点都是 x=134。整屏不因为这两行而多出一个滚动条（`scrollHeight === clientHeight === 461`）。

### 横屏：先定宽，再让它自己占一行

横屏的 ⋮ 面板不是列表，是**会换行的 44×44 图标方格**（`(orientation: landscape) and
(max-height: 620px)`）。直选行留在文档流里就会和图标抢同一行，剩下的 834px 宽度全灌给三段，
**每格 237px**（`devtools/r43-land.png`）。

- 1.2.48：轨道定宽 300px —— 格子从 237 收到 97，但它仍然和图标挤在同一行，
  第一行变成「10 个图标 + 点卡片 + 轨道」，第二行「1 个图标 + 主题 + 轨道 + 2 个图标」，
  两条轨道起点不同 x，整体还是散的（`devtools/r43-land3.png`）。
- 1.2.49：给两行加 `order: 10`。它们是面板唯一的 flex 子项，`order` 就能把两行整体挪到栅格末尾，
  于是 **13 个图标自己占满第一行**，两行偏好项在下方各占一行、轨道 246px、起点同为 x=141。
  面板从 5 行 229px 收回 3 行 146px，顺手消掉了之前那 9px 的溢出滚动条。
  代价是视觉顺序和 DOM/Tab 顺序不一致（两行排在语言切换、关于之前）—— 这里接受，
  因为一个纯图标栅格本来就没有可读的顺序可言。

### 1.2.50：选一次就关一次面板

横屏验收时顺手发现：点完「从头播」，⋮ 面板**直接关闭**。要再换回「接着上次」就得重新开一次菜单 ——
那这一轮和上一轮那个"点一次切一档"差别就只剩少按两下。

根因在 `script.js:9932`：⋮ 面板的"点外面关闭"是挂在 `document` 上的，**它只判断"面板开着"，
不判断"点的是不是面板里面"**，全靠 `headerMenuBtn` 自己 `stopPropagation`。所以面板里除开关按钮外
任何一次点击都会把它关掉。

修法只给直选行加 `e.stopPropagation()`（`bindChoiceRow`）。**没有**去改那条 document 级监听：
它同时服务桌面端（桌面版行为不动），而且面板里那些一次性命令（抓帧、导出CSV、复制诊断、关于）
点完关掉本来是对的 —— 分段行是"设置"，命令按钮是"动作"，两者不该同一个关闭规则。

### 实测（真点击，emulator-5554，1.2.50）

先用注入 `<style>` 在 1.2.48 上预演横屏，确认尺寸才去构建，省掉两次十分钟的构建。

- 竖屏 412 CSS：面板 368×463，两行 y=595 / 704、高 40；轨道 x=134 宽 256，格子 83×36；
  选中格 `rgb(91,75,240)` + `rgb(255,255,255)` + `font-weight 600` + `radius 999px`；
  轨道底色浅色 `rgb(227,232,241)` / 深色 `rgba(255,255,255,0.1)`；`scrollHeight/clientHeight` = 461/461（不滚）。
- 横屏 915×412：面板 851×146，13 个图标全在 y=148 一行；两行 y=194 / 240、高 44；
  轨道 x=141 宽 246，格子 79×36；`scroll` 144/144（不滚）。浅色深色各截一张，目视核对过。
- 真点击换档：点「接着上次」→ 面板 `header-right active` 仍在，`.on` 与 `localStorage` 同步为 `resume`；
  点「深色」→ 面板仍在、`body.dark-theme` 生效；再点「跟随系统」→ `tdashcam.themeMode=auto`。
  换主题后行会**上移 37px**（1901 vs 1938），所以每一下点击前都要重测坐标 —— 这条老账又应验一次。
- 语言切回中文那一下面板会关（走的是 `checkHeaderCollapse()` 的重排路径），这是既有行为，没动它。
- 验收后设备复位：竖屏、`accelerometer_rotation 1`、中文、主题「跟随系统」、点卡片「接着上次」、
  `tdashcam.mediaDir = /storage/emulated/0/TeslaCam`。

### 交付

- `TDashcamStudio/Tessera-1.2.50-android-universal.apk` —— md5 `e76e95dae6b1fe1087f36eb51ebb53c7`，
  27,732,699 字节。已 `adb install -r -g` 到 emulator-5554，设备上 `base.apk` 的 md5 逐位一致。
- 本轮四个包全部留在根目录，旧包一个没删没挪：
  1.2.47 `cf5eebc4cde2bef6c48da2f636a79be6`（27,732,379，竖屏修好、横屏还臃肿）、
  1.2.48 `ea6194deb92d43ba47dc6ba1a9e52f5a`（27,732,571，横屏定宽但仍与图标挤一行）、
  1.2.49 `a1d9c7d2b7e90ca5586fa0f6df936af3`（27,732,571，横屏栅格收敛）、
  1.2.50 `e76e95dae6b1fe1087f36eb51ebb53c7`（27,732,699，选完不关面板）。根目录现有 1.2.34 … 1.2.50。
- 全部改动仍未提交（clone 没有 git 凭据）。

## 第四十四轮（1.2.51）：「点卡片」改名 / 补回图标 / 横屏 ⋮ 面板统一

需求原话：「"点卡片"这个词没用对，没有体现真实功能。同时这个功能和"主题"都没有图标了，改一下。
横版的时候，"更多"设置卡片里面有精简的图标，也有完整显示的调整栏，没有统一。」三条都成立，
而且第三条是前两轮**没修到底**留下的：R43 只把两条轨道挪到栅格末尾，没有解决"同一个面板里两套布局语言"。

### 一、改名：「点卡片」说的是操作，不是这项设置的内容

这一项真正管的是**点列表里的视频之后从哪里开始播**，而「点卡片」三个字只描述了"我点了个东西"，
三档「接着上次 / 从头播 / 跳到事件」挂在这个标签下读不通（尤其"从头播"和"点卡片"根本是两回事）。

- 标签：`choiceTap` 中文 → **「播放起点」**，英文 → **「Play from」**（`script.js` 两张表）。
- 三档文案去掉重复前缀：`tapMode*` 从「点卡片：接着上次」缩成「接着上次」——轨道左边已经有标签了，
  再带前缀就是同一句话读两遍。英文同理 `Play from: resume` → `Resume` / `Restart` / `At event`。
- 措辞只有一个来源：`syncChoiceRow()`（`script.js:896`）拿 `titleKey` 去查表，所以改两张表就够，
  没有散落各处的字符串。`script.js:5755` 那条讲时间单位的注释里也引用了旧词，一并改掉。

### 二、图标：不是"图标丢了"，是这两行从来就没有图标

面板里每个控件的图标都是 `<button>` 自己的 `.btn-icon`，而 R42-2 做直选行时把它做成了
`<div class="menu-choice">`（因为它内部有三个 `<button>`，套在按钮里是非法嵌套）。
结果 `styles.css:309` 那条 `.btn-icon{width/height:24px !important}` 和整条图标规则链都走不到它身上，
**图标那一列是空的**，标签只能靠 `padding-left: 31px` 硬顶到其他行文字所在的列 ——
看起来就像"少了个图标"，而且这一列在浅色主题下是一片不解释的空白。

- `index.html`：两行各补一个 `.btn-icon` + `<svg>`（播放起点用"竖线 + 三角"= 从某点起播，主题用半填圆）。
- `styles.css`：新增 `.menu-choice .btn-icon svg{width:21px;height:21px;fill:none;stroke:currentColor;…}`，
  同时把行的左内边距从 `0 7px 0 31px` 改回 `0 7px` —— **缩进现在由图标本身提供**，
  31px 那个魔法数作废。
- 实测对齐：横屏两行标签 x=188，其他行文字列 x=188；竖屏 71 / 71。图标列不再是空的。

### 三、横屏：把第二套布局语言并进第一套

横屏那一档（`(orientation: landscape) and (max-height: 620px)`）原本是 **44×44 纯图标方格**，
两条直选行是通栏文字轨道 —— 一个面板里一半有词一半没词。改成和竖屏同一套语言：
**带标签的「图标 + 文字」行栅格**，13 个命令 + 2 条轨道全走栅格，每个格子都有词。

尺寸不是拍脑袋，是在装好的 1.2.49 上注入 `<style>` 试出来的（省掉三次构建）：

| 候选 | 结果 |
| --- | --- |
| 4 列 × 40dp | 13 个命令要 4 行 + 轨道 2 行 = 6 行 ≈260px，**超过 208px 预算**，出滚动条 |
| 5 列 × 38dp | 3 行命令 + 2 行轨道 = 210px，实测 `scroll 208 / client 208`，不滚 ✅ |
| 6 列 | 格子只剩 122px，「连续播放：关」实测 119px 文字 + 14px 内边距 → **截断** |

- **预算从哪来**：面板是 `position:fixed`，`max-height: calc(var(--viewport-h) - var(--action-h) - 40px - safe)`
  （`styles.css:4771`），横屏 915×412 下算出来只有 **229 CSS px**。这条是本轮所有取舍的硬上限。
- **面板宽 760 而不是通栏**：5 列时 `Switch to English`（95px）在 680 宽的栅格里被截 7px。
  两条退路都不要：`grid-column: span 2` 会破坏"每格等宽"的节奏（这条已经记在偏好里），
  改文案会动到桌面版。所以加宽面板到 `min(760px, 100vw - …)`，格子 148px，全部 `clip=0`。
- **轨道占 3 列**（448px，格子 112px）而不是通栏：通栏时格子 221px，是竖屏 83px 的 2.7 倍，
  选中块会胖成一座胶囊岛；3 列最接近竖屏的手感，且和上面的命令格同宽同起点。
- **行高 38 而不是 40**：5 行 × 40 + 间距 = 218 > 208，矮机（可视高更小）会更糟。
- **门控保留 `(hover: none) and (pointer: coarse)`**：桌面缩窄窗口拿到的仍是 44px 纯图标方格，
  桌面版行为不动（见「已知限制」）。
- 特异度账：新 `button` 规则是 `.header-collapsed .header-right .header-actions-group button`（0,3,1），
  压得住竖屏那几条；`.choice-segment` 必须重新按 (0,4,0) + `!important` 声明 `width:auto`，
  否则它会从 `button` 那条继承 `width:100%`，三段各自撑成一条通栏（R43 踩过同一坑，这次提前挡掉）。

### 实测（真点击，emulator-5554，1.2.51）

- 横屏 915×412：面板 760×210，`repeat(5, 148.095px)`，13 个命令 3 行 + 两条轨道各占 3 列（448×38，
  格子 112×34），`scroll/client = 208/208` 不滚；选中格 `rgb(91,75,240)` + `rgb(255,255,255)` + `fw600`；
  全部 `clip=0`。浅、深各一张：`devtools/r44-land-light.png` / `r44-land-dark.png`。
- 竖屏 412×915：面板 368×463 两列栅格**未回归**（`176.238px ×2`，`461/461` 不滚），
  两行轨道 356×40、格子 83px，图标 18px；浅、深各一张：`r44-port-light.png` / `r44-port-dark.png`。
- 真点击换档 4 下（横屏「深色」→ 竖屏「浅色」→「跳到事件」→「接着上次」）：每下都命中，
  `.on` / `aria-checked` / `localStorage` 三者同步，**面板每下都保持开着**（`sheetStillOpen` 368×463 / 760×210）。
  换主题会让轨道上下挪位，所以每一下点击前都重测了坐标 —— 这条老账又应验一次。
- 英文一并核对：标签 `Play from`，三档 `Resume / Restart / At event`，`Theme` 未受影响。
  两行的 `title="点列表里的视频之后从哪里开始播"` 仍是硬编码中文 —— `index.html` 里这类中文 `title` 有 25 处，
  触屏没有 hover 读不到，属既有账，本轮没动（改了会连桌面 tooltip 一起变）。
- 验收后设备复位：竖屏、`accelerometer_rotation 1`、中文、主题「跟随系统」、播放起点「接着上次」、
  `tdashcam.mediaDir = /storage/emulated/0/TeslaCam`。

### 交付

- `TDashcamStudio/Tessera-1.2.51-android-universal.apk` —— md5 `141909a47e63c87ad42fb6a9b9fbf9b1`，
  27,733,339 字节。已 `adb install -r -g` 到 emulator-5554，设备上 `base.apk` 的 md5 逐位一致。
- 根目录现有 18 个包：1.2.34 … **1.2.51**，旧包一个没删没挪。
- 装机之后源码里只剩一处**纯注释**改动（`styles.css:5585` 补了"为什么是 760 而不是 680"那段），
  没有任何功能差异，所以没有为它重打包 —— 下一轮的包会带上它。
- 全部改动仍未提交（clone 没有 git 凭据）。

## 第四十五轮（1.2.54）：目录浏览器不再溢出 + 改说人话

需求原话：「竖屏的时候，选择文件夹的页面，内容有溢出，这个页面能不能设计简单实用点，目前感觉有点
复杂偏专业了。」附三张小米 14 竖屏截图：整块内容被推出左边缘（标题只剩「选择」、路径行只剩「路径」、
进入/上一级被切掉、失效卡片那条紫色左边框在屏外），屏上同时摆着「存储位置 内部存储设备 941GB」、
errno 全文、「APP 存档位置」和「选择此文件夹」并排。两条都成立，第二条不是审美问题：这一屏把
**四个控件、一条完整路径、一段系统报错**当成默认信息，而用户要的只是"我的 TeslaCam 在哪个盘里"。

### 一、溢出：一个 POSIX 路径在 CSS 里是一个**词**

截图里被推出屏幕的方向是**横向**，所以这不是"内容太多"而是"有一样东西的最小宽度就超了面板"。
在装好的 1.2.51 上量过：面板 content 388px，内容 `scrollWidth` 398px（小米 14 竖屏 412 CSS px，
扣掉弹窗左右 12px 只剩 388）。

- 撑破它的是 `/storage/emulated/0/Android/data/com.tdashcam.studio/files` 这类串 —— 没有空格，
  在 CSS 眼里就是**一个不可断的词**，它的 min-content 宽度等于自身长度。这一行又是
  `flex-wrap: wrap` + 子项 `flex-basis: 0`，"换行"救不了它：单个词比整行还宽。
- 修法是一条继承声明：`.dir-modal-content { overflow-wrap: anywhere; }`（`styles.css:3827`）。
  为什么不是 `break-word` —— `break-word` 只在"别的办法都断不开"时才断，而且**不参与**
  min-content 计算，正好是这里需要的那一点区别；`anywhere` 会把 min-content 收窄到真正的可用宽度，
  wrapping flex 于是才肯换行。继承意味着报错行、失效说明句、APP 目录路径三处一起好了。
- 文案侧同步去掉一个不可断 token：`dirGoneBody` 原来带 `{path}`，把 55 个字符塞进说明句中间。
  现在中英文都只说"这个文件夹已经不在这台设备上了"，完整路径挪进默认折叠的「报错详情」。
- 详情行原本还把路径写了两遍（Rust 的 `readDir` 消息本身就以 `路径: 原因` 开头）——
  `message.includes(path) ? message : \`${path}: ${message}\``。

### 二、这一屏只回答三件事：我在哪儿 / 怎么上去 / 选哪个

手机档（`dir-compact`）重排，桌面版一行没动：

| 原来 | 现在 |
| --- | --- |
| 「路径」+ 输入框 + 进入 + 上一级 四件套常驻 | 「上一级」胶囊 + 位置条 +「手动输入路径」文字链 |
| 完整路径永远占一整行 | 位置条两行：粗体「本机存储 · TeslaCam」，下面小字完整路径（单行省略号） |
| 「存储位置」标签 + ROM 原文 chip（英文 "Internal shared storage"） | 去掉标签；chip 说「本机存储 9.7GB 含 TeslaCam」 |
| 一进来就是 errno 全文 | 折叠成「报错详情」，点开才给（展开后文案是「收起详情」） |
| 「APP 存档位置」和「选择此文件夹」并排等权 | 竖向：主按钮通栏 44dp，APP 存档位置降为下划线文字链 |

- 两个"收起"要能区分：路径行收的是输入框（「收起路径」/`Hide path`），卡片收的是 errno
  （「收起详情」/`Hide details`）—— 第一版两张都叫「收起」，同屏两个同名开关。
- 键盘完成键 = 进入：输入框绑了 `Enter`，手机上打路径的人不需要再去找那颗按钮。
- **门控为什么不是媒体查询**：手机档 `(hover: none) and (pointer: coarse)` 平板也命中，
  而 CSS 的平板档多一条 `min-height: 501px`（横屏手机 915×412 靠它留在手机几何里）。
  `isTabletLayout()` 没有这条，所以 `!isTabletLayout()` 会把**所有横屏手机**误判成平板退回桌面排法。
  新增 `hasTabletGeometry()`（`script.js:705`）镜像 CSS 那条，`compact = isPhoneLayout() && !hasTabletGeometry()`，
  在**打开弹窗时**决定一次。
- 桌面版零风险：这个弹窗只在安卓出现（`selectTauriDirectory()` 里 `isAndroidRuntime()` 分支），
  DOM 顺序仍保持 进入 → 上一级，平板/桌面读到的还是原来那一行。

### 三、装机实测才抓到的 bug：失效卡片上「上一级」跳了两级

1.2.52 第一次点这条路径时，卡片说的是 `…/TeslaCam/gone-folder`，点「上一级」却到了
`/storage/emulated/0` —— 跳过了还活着的 `TeslaCam`。

- 根因不在按钮，在 `forgetRemovedVolumes() → pruneStaleStorage()`（`script.js:14324`）：整盘被拔出时
  它会把 `androidBrowsePath` 悄悄改成"最近一个还在的祖先"（对 U 盘是对的），但它**不重渲染位置条**，
  于是卡片讲 gone-folder、按钮按 TeslaCam 算，一次点击减了两级。
- 修法：`await this.forgetRemovedVolumes(...)` 之后把 `androidBrowsePath` 重新指回卡片说的那个 path
  （`script.js:14578`）—— 上一级永远只减一级，减到卡片讲的那个文件夹的父级。整盘弹出的场景不受影响：
  chips 行还在，盘插回去几秒内它自己会再出现。
- 顺带把「选择此文件夹」在卡片亮着时挡掉（`script.js:13858`）：放行等于记住一个读不到的路径，
  再把"扫不到"当成扫描器的毛病。现在弹一句「这个文件夹已经不在了」，窗口不关。

### 实测（真点击，emulator-5554，1.2.54）

- 竖屏 412×915 新开弹窗：`cls = touch-ui dir-compact`，位置行 355×44（上一级 74×44、位置条 166×39、
  手动输入路径 95×34），进入 / 输入框 /「路径」标签 `display:none`，面板 `scrollWidth/clientWidth = 387/387`
  —— 溢出为 0（1.2.51 上是 398/388）。
- 真点「手动输入路径」→ `dir-edit-path`，位置行变两行 94 高，输入框 + 进入同排，仍 `387/387`；
  标签换成「收起路径」。
- 真点「进入」到 `…/TeslaCam/gone-folder` → 失效卡片整块在面板内；真点「报错详情」→ errno 一行 324px
  落在 355px 内容列里，路径只出现一次（`pathCount: 1`）。
- 真点「上一级」→ `本机存储 · TeslaCam`，列出 RecentClips / SavedClips / SentryClips（修前是 `/storage/emulated/0`）。
- 卡片亮着时真点「选择此文件夹」→ toast「这个文件夹已经不在了」、弹窗不关、`tdashcam.mediaDir` 未被写入。
- 横屏 915×412：compact 仍生效（`hasTabletGeometry()` 为假），面板 558×328，`558/558`、`326/326` 不滚不溢出。
- 浅色 / 深色各一张：`devtools/r45-54-port-light.png`、`r45-54-gone-light.png`、`r45-53-gone-dark.png`、
  `r45-53-land-light.png`、`r45-53-land-dark.png`。
- 英文一并核对：`Choose TeslaCam Folder / Up / Phone storage / Type a path ↔ Hide path /
  Error details ↔ Hide details / App Storage`，chip 从「contains TeslaCam」改成「has TeslaCam」（徽章是短语，不是句子）。
- 验收后设备复位：竖屏、`accelerometer_rotation 1`、中文、主题「跟随系统」、播放起点「接着上次」、
  `tdashcam.mediaDir = /storage/emulated/0/TeslaCam`（7 个事件正常加载）。

### 交付

- `TDashcamStudio/Tessera-1.2.54-android-universal.apk` —— md5 `0fd8a9925fa7ab11c6d215c56a0c0581`，
  27,736,859 字节。已 `adb install -r -g` 到 emulator-5554，设备上 `base.apk` 的 md5 逐位一致。
- 本轮一共出了三个包，都留在根目录：**1.2.52**（溢出 + 人话版）、**1.2.53**（修「上一级」跳两级）、
  **1.2.54**（两个"收起"改名 + `has TeslaCam`）。根目录现有 21 个包：1.2.34 … **1.2.54**，旧包一个没删没挪。
- 全部改动仍未提交（clone 没有 git 凭据）。

## 第四十六轮（1.2.55）：「APP 存档位置」指向的是一个从来没存在的目录

### 需求原话

> 这个报错是怎么回事？处理一下

（附小米 14 竖屏截图一张：「选择 TeslaCam 目录」弹窗里「这个文件夹已经不在了」，
报错详情是 `/storage/emulated/0/Android/data/com.tdashcam.studio/files: No such file or directory (os error 2)`。
上一轮的排版修复在这张图上是生效的 —— 没有溢出、按钮都收在一行。）

### 一、这个报错到底是什么

用户点的是「APP 存档位置」。这个按钮跳的是**应用自己的外部目录**，
路径由 Rust 端字符串拼出来：

```rust
let app_files_dir = format!("{SHARED_ROOT}/Android/data/{}/files", app.config().identifier);
let _ = std::fs::create_dir_all(&app_files_dir);   // ← 错误被 `let _ =` 吞掉
```

**它从来没成功过。** 在 emulator-5554 上直接量当前构建：

```
storage_status → {app_files_dir: "/storage/emulated/0/Android/data/com.tdashcam.studio/files",
                  android_data_readable: false,
                  error: "/storage/emulated/0/Android/data: Permission denied (os error 13)"}
list_subdirs(那个路径) → "No such file or directory (os error 2)"
adb shell ls /storage/emulated/0/Android/data/ → 只有 chrome / photos / gms / youtube，没有我们自己
```

链条是：Android 11+ 起，`Android/data` 这一层对普通应用是**只读视图**（连 `read_dir` 都回 EACCES），
所以在里面 `mkdir` 一个包名目录必然失败；这个目录只有**框架自己**会创建 ——
`Context.getExternalFilesDir(null)` 一调用，MediaProvider 就把 `Android/data/<包名>/files` 建好并授权给本应用。
Rust 只会拼字符串，不会问框架，于是：目录不存在 → `read_dir` ENOENT → 浏览器弹出「这个文件夹已经不在了」。

也就是说这不是小米的问题、不是权限没给，**任何一台安卓机上点这个按钮都是这个结果**；
它同时说明权限引导卡片里那句「也可以把 TeslaCam 放进本应用自己的目录」一直在指一个不存在的路径。

### 二、修法

| 位置 | 改动 |
|---|---|
| `MainActivity.kt` | 新增 `appFilesDir()`：`getExternalFilesDir(null)` + `mkdirs()`，拿不到或建不成返回空串；经 `NativeBridge` 以 `TDashcamNative.appFilesDir()` 暴露给页面 |
| `script.js` | 新增 `nativeAppFilesDir()`；「APP 存档位置」和权限引导卡片都改成**先问框架**，Rust 的拼路径只作兜底 |
| `lib.rs` | `storage_status` 只在 `read_dir` 真的成功时才上报 `app_files_dir`，否则给空串 —— 不再把一个证明读不了的路径交给 UI |
| `script.js` | 拿不到目录时给一句人话 toast（`dirAppNoAccess`），不再跳进死目录 |

框架调用是同步的，但它只在点按钮/开引导卡时发生（不是轮询路径），一次 `mkdir` + `stat`，
和旁边那个每 12 秒轮询的 `storageVolumes()` 不是一回事，注释里写明了这个区别。

### 三、顺带：失效卡片要说对话

原来不管什么路径，失效卡片都是「盘被弹出了…重新插上盘后它几秒内会自己出现」。
对本机存储下一个从来没存在的目录，这是错的建议。现在按是否可移动卷分叉：

- `/storage/<非 emulated/self/users>/…` → 原文案（弹盘、重插）；
- 本机存储下的普通缺失目录 → 「这个文件夹不在这台手机上——它一直没被创建，或者已经被删除/改名了」
  + 「点「上一级」回到还存在的目录；特斯拉录像一般在本机存储的 TeslaCam 里」。

### 实测（真点击，emulator-5554，1.2.55）

- 装机后先量框架：`TDashcamNative.appFilesDir()` → `/storage/emulated/0/Android/data/com.tdashcam.studio/files`；
  `adb shell ls -la /storage/emulated/0/Android/data/` **多出了 `com.tdashcam.studio`（u0_a216:ext_data_rw 770）**，
  修前这个条目根本不存在。
- `list_subdirs` 同一路径：`{list_ok: true, entries: 0}`（修前是 os error 2）。
- `storage_status` 现在带着同一个路径返回，且 `app_files_dir` 非空 = 已证明可读。
- 真点「APP 存档位置」（css 206,700 / 设备 541,1935）→ 位置行「本机存储 · Android/data/com.tdashcam.studio/files」，
  列表「这里没有子文件夹」，**报错卡不再出现**，面板 `387/387` 无溢出。
- 真点「手动输入路径」→ 输入 `/storage/emulated/0/TeslaCamX` → 硬件 Enter：卡片走**新文案**
  （「这个文件夹不在这台手机上——它一直没被创建…」）；再输 `/storage/FAKEVOL/TeslaCam` →
  走**旧文案**（弹盘/重插），两分支各验一次，`387/387`。
- 卡片亮着时真点「上一级」→ 只退一级到「本机存储」，14 个子文件夹（上一轮的修复没被这次改动碰坏）。
- 截图：`devtools/r46-55-gone-local.png`（浅色，新文案 + 编辑器展开）、
  `devtools/r46-55-appdir.png`（浅色，进档后「这里没有子文件夹」）。
- 验收后设备复位：弹窗已关、竖屏、`accelerometer_rotation 1`、`user_rotation 0`、中文、主题「跟随系统」、
  播放起点「接着上次」、`tdashcam.mediaDir = /storage/emulated/0/TeslaCam`（`viewer.eventGroups.length === 7`）。

### 交付

- `TDashcamStudio/Tessera-1.2.55-android-universal.apk` —— md5 `a34a3e3a1c89d397a688cd08f1a14bad`，
  27,737,659 字节。已 `adb install -r -g` 到 emulator-5554，设备上 `base.apk` 的 md5 逐位一致。
- 根目录现有 22 个包：1.2.34 … **1.2.55**，旧包一个没删没挪。
- 全部改动仍未提交（clone 没有 git 凭据）。

## 第四十七轮（1.2.56）：按 iOS 的弹窗分类法重做 —— 抽屉不是对话框，列表不是按钮

### 需求原话

> 请参考 ios 最新的 app 设计、交互规范，完善这个 app，后面这个 app 要出 ios 版本的。

也就是说这一轮不是修 bug，是**提前按 Apple 的分类法把手机端的地基找平**，好让 iOS 版直接长在同一套结构上。
下面每条都标了它对应 HIG 里的哪一条判断，而不是「看起来更像 iOS」。

### 一、Apple 怎么分弹窗：alert 居中，内容成抽屉

HIG 把模态面按**装的是什么**分两类：

- **alert** —— 一两句话 + 一两个决定，居中卡片，不可拖动；
- **sheet** —— 装内容（列表、位置条、选择器），从底边滑上来，带 grabber，可以甩掉。

修前手机端是**六个居中卡片**（选目录 / 关于 / 显示路径 / 导出 / 删除确认 / 剪辑），
所以「选择 TeslaCam 目录」这个要滚动、要点选、有 14 行的东西，长得和「确定要删除吗」一样。

现在（仅竖屏手机，见下）：

| 弹窗 | 修前 | 修后 | 为什么 |
|---|---|---|---|
| `#androidDirModal` 选目录 | 居中卡片 | 底部抽屉 | 装列表 |
| `#aboutModal` 关于 | 居中卡片 | 底部抽屉 | 装内容 |
| `#filePathModal` 显示路径 | 居中卡片 | 底部抽屉 | 装内容 |
| `#phoneExportModal` 导出 | 已经是底部浮卡 | 保持浮卡，但统一页眉语法 | 它要让开底部悬浮栏 |
| `#deleteConfirmModal` 删除确认 | 居中卡片 | **不动** | 这是 alert |
| `#clipModal` 桌面剪辑 | 居中卡片 | **不动** | 手机上直接委派给 `#phoneExportModal` |

门控是新增的 `isSheetLayout()`：触摸运行时 **且** 手机档 **且** 非平板几何 **且** `innerHeight >= innerWidth`。
横屏手机只有 412 CSS px 高，塞一个可滚动的底部抽屉等于把列表压成三行，
所以横屏继续用居中卡片 —— 这也正好是宽尺寸类（平板）该用的样子，一套判断管两个平台。

### 二、修了一个「样式写了但没生效」的老 bug

抽屉的入场动画是 `.modal-content { transform: translateY(32px) }`，打开时靠
`html.sheet-mode … .show .modal-content { transform: translateY(0) }` 拉回来。
**这条永远没赢过**：基础规则是按 id 写的（`#androidDirModal .modal-content`），特异性比按 class 写的覆盖规则高，
于是打开的抽屉永远停在底边以下 22px —— 「选择此文件夹」整颗按钮在屏外。

量出来的证据（修前）：`transform: matrix(1,0,0,1,0,32)`、`gapBottom: -22`。
修法是把 `.show` 那条也按 id 展开三份。修后 `matrix(1,0,0,1,0,0)`、`gapBottom: 34`。

这正是上一轮记下的教训的复发：**改样式的验收必须量 computed style + 目视截图**，
只看 JS 状态（`classList` 里确实有 `show`）会让整份 CSS 失效也「全绿」。

### 三、grabber 从「画出来的把手」变成「抓得住的把手」

原来导出面板顶部那根小横条是一个 `::before` —— 它是把手的**图片**，手指按上去什么也不会发生。
现在 `bindSheetGrabber()` 往 `.modal-content` 里注入一个真元素（`dataset.sheetGrabbed` 去重），
绑 `pointerdown / pointermove / pointerup / pointercancel` + `setPointerCapture` + `touch-action: none`，行为按 iOS：

- 只跟**向下**的位移（`Math.max(0, dy)`），向上不拉伸；
- 松手判据：位移 ≥ 72px，**或** 位移 ≥ 20px 且速度 ≥ 0.6px/ms（甩一下就走，不用拖半屏）；
- 不达标 → 回弹到位，什么都不做；
- 达标 → 触感一下（`haptic(10)`），220ms 滑出后关闭；
- 遮罩点击关闭，但**被拖动抑制**（拖完抬手不算点击）。

导出抽屉多一条 `canDismiss: () => !viewer.peJob`：正在导出时位移被乘 0.22，
于是它像 iOS 的「这个手势现在不给用」那样橡皮筋回弹，而不是滑一半又弹回去骗人。

### 四、四个抽屉统一成一种页眉语法

修前是三种：目录抽屉「左标题 + 右上角 ×」、关于「中标题 + 右上角 ×」、路径「中标题 + 右上角 ×」、
导出「左标题 + 右上角 ×」。现在收敛为 iOS 模态页眉的一条：**标题居中，取消键在起始边（左）做成 32px 圆片**。

- 目录抽屉原本给标题加了 `padding-left: 38px` 来躲按钮 —— 那是导航栈的大标题写法，不是抽屉的；
  居中标题不可能和一颗 32px 圆片撞位，所以那 38px 直接删掉而不是跟着搬。
- 导出面板的 × 从右上角搬到左上角（`top:2 left:4`）。它仍浮在悬浮栏上方（`--sheet-bottom`），
  这是前几轮定的：抽屉不能让底部动作栏失去可达性，所以它是 form sheet 而不是满幅 sheet。
- 右上角那颗 × 的**绘制**是 13×24，但 `.close-modal-btn::after` 撑出 38.8×44 的**命中区**，
  iOS 要的就是这个分离：视觉尺寸跟设计，命中尺寸跟手指。

### 五、文件夹列表：从「一列按钮」改成 iOS 分组列表行

HIG 的 grouped list 是：平铺行、分隔线从文字下方起、在指示符前停、能点进去的行右侧一个 chevron。
修前是一堆带紫边的圆角 chip 挤在 6px 缝里 —— 那是**一个恰好竖着的桌面工具栏**，
而且让它看起来可点的是 hover，手指底下没有 hover。

`html.dir-compact` 档下现在是：`border:0 / border-radius:0 / min-height:48px / font-size:17px`、
`:active` 才亮底、`::before` 画 1px 起始内缩分隔线（`left:4 right:30`）、`::after` 画 7px chevron。

字号从 0.95rem（15.2px）提到 **1.0625rem（17px）**：iOS 的 body/列表行就是 17px，
「要凑近才看得清的行不是能扫的行」。名字放不下的行**截断而不是折行**，
保持每行 48px 一条的扫描节奏，完整路径点进去在页眉看得到（这条取舍是用户之前定的：
栅格一致性优先于防截断，截断的代价交给缩短文案）。位置标题同步到 17px/600。

### 六、可达性与对比度

- 四个抽屉补 `role="dialog" aria-modal="true" aria-labelledby`（删除确认本来就有）。
- 最小字号下限复核：`--fs-cap` 11px、底部 tab 标签实测 11px，没有更小的了。
- 新增 `@media (prefers-contrast: more), (prefers-reduced-transparency: reduce)`：
  关掉 `backdrop-filter`、面板换成不透明底。
  **诚实记录**：Android WebView 上这两条 `matches:false`（实测），所以这段在安卓上是空转的 ——
  它是写给 iOS 版和 Windows 高对比度的；安卓的等价开关是
  `AccessibilityManager.isHighTextContrastEnabled()`，要 Kotlin 桥，本轮没做。
- 视频卡片：触屏下取消 `:hover` 的位移，改成 `:active` 轻微缩放。

### 七、验收过程中撞到的坑：ANR 对话框让所有真点击「失灵」

中途所有 `adb input` 手势都不再进 WebView，抓包（capture-phase 记 pointer/touch）显示**零事件**，
而 `dispatchEvent` 合成事件能记到 —— 说明页面监听没问题，输入根本没送进来。
`dumpsys window` 一看：`mCurrentFocus=Window{… Application Not Responding: …}`，
系统 ANR 框吃掉了全部输入。**`cdp-shot.mjs` 只截 WebView，所以截图里完全看不到这个框。**
`adb reboot` 没治好（system_server / systemui 继续连环 ANR），`adb emu kill` 也没杀掉
（qemu 与 emulator 两个进程还是上一天的），最后 `taskkill //F //PID <qemu> //T` 冷重启 AVD 才恢复。

### 实测（真点击/真滑动，emulator-5554，1.2.56，竖屏 412×915，dpr 2.625）

设备类名：`touch-ui sheet-mode dir-compact`。

**几何（打开后量 computed style + 矩形）**

| 抽屉 | panel [x,y,w,h] | gapBottom | transform | radius | grabber | 取消键 | 标题 | 溢出 |
|---|---|---|---|---|---|---|---|---|
| 选目录 | 10,218,392,663 | 34 | identity | 20/20/14/14 | 359×26 | 32×32 @19,224 | center | 391/391 661/661 |
| 关于 | 10,76,392,805 | 34 | identity | 20/20/14/14 | 343×26 | 32×32 @19,82 | center | 391/391 812/804 |
| 显示路径 | 10,664,392,217 | 34 | identity | 20/20/14/14 | 343×26 | 32×32 @19,669 | center | 391/391 216/216 |
| 导出 | 10,187,392,619 | 109 | identity | 16 | 359×20 | 32×32 @15,189 | center | 391/391 618/618 |

导出那 109px 是让给悬浮栏的（`--action-h 91 + 8 + safe-bottom`），不是没贴底。
四个抽屉横向全部无溢出。列表行 14 条实测 `border:0 / radius:0 / h:48 / font-size:17px`，
chevron `width:7px right:10px`，分隔线 `1px left:4px right:30px`。

**真手势（`adb shell input`，不是 `element.click()`）**

- 抽屉滑动关闭：目录（206,236→206,436 @300ms）、关于（206,94→206,294）、
  导出（206,203→206,443 @220ms）、路径（206,681→206,900 @220ms）—— 四次全部 `display:none`、
  `.show` 摘掉、内联 transform 清空。
- **短拖不回退测试**：导出抽屉 206,203→206,235（32px，低于 72 阈值）→ 仍 `display:flex`、
  `show:true`、panel 回到 y=187、内联 transform 已清 —— 回弹而不是关闭。
- **导出中不许甩掉**：把 `viewer.peJob` 置为真值后同一记甩动（220px）→ 仍 `flex / show:true / y=187`；
  清掉 `peJob` 再同样甩 → `display:none`。两条分支各验一次。
- 遮罩点（206,120）关闭目录抽屉；真点第 3 行 → 进入 `/storage/emulated/0/Audiobooks`；
  「上一级」→ 回本机存储 14 行；× → 关闭。
- 横屏（915×412）回归：类名 `touch-ui dir-compact`（**没有** `sheet-mode`），
  目录弹窗回到居中卡片 panel 178,44,560,328、radius 16、grabber `display:none`、
  溢出 558/558 326/326、行仍是 17px/48px 带 chevron、× 在右上角（13×24 字形 / 38.8×44 命中）；
  真点 × 能关。平板档不受 `sheet-mode` 影响（`hasTabletGeometry()` 已排除）。
- 深色（`cmd uimode night yes`）：面板底 `rgb(32,34,44)`、行文字 `rgb(243,245,250)`，
  四个抽屉截图复核，无对比度塌陷。
- 截图：`devtools/r47-dir-light.png`、`devtools/r47-dir-dark.png`、`devtools/r47-about-dark.png`、
  `devtools/r47-export-light.png`、`devtools/r47-export-dark.png`、`devtools/r47-path.png`、
  `devtools/r47-land-dir.png`（验收前已移除 `#r47badge` 调试浮层）。
- 验收后设备复位：六个弹窗全 `display:none`、剪辑模式 off、`dark-theme` off、
  `tdashcam.theme` 为 null（跟随系统）、竖屏、`accelerometer_rotation 1`、`user_rotation 0`、
  `tdashcam.mediaDir = /storage/emulated/0/TeslaCam`、`eventGroups.length === 7`。

### 交付

- `TDashcamStudio/Tessera-1.2.56-android-universal.apk` —— md5 `753135e72aad528532490c833ab73f3f`，
  27,757,819 字节。已 `adb install -r -g` 到 emulator-5554，设备上 `base.apk` 的 md5 逐位一致。
- 根目录现有 23 个包：1.2.34 … **1.2.56**，旧包一个没删没挪。
- 全部改动仍未提交（clone 没有 git 凭据）。
- 遗留待用户定：手机端「APP 存档位置」这一项要不要下线；导出水印的文案/位置/透明度。
  （「APP 存档位置」已在第四十八轮下线，见下。）

## 第四十八轮（1.2.57）：「APP 存档位置」下线 + iOS 视角差距盘点

### 下线一个入口

用户判定：「APP 存档位置」用处不大。删掉的是**入口**，不是能力：

- `index.html`：`.modal-buttons` 里只剩 `#androidDirSelectBtn` 一个按钮（原来 1 : 1.7 两列，
  现在单列满宽 359×44，竖屏；横屏 526×44）。
- `script.js`：删掉 `androidDirAppBtn` 的 click handler（含 `dirAppNoAccess` 那条 toast）
  和 `openAndroidFolderBrowser()` 里给按钮刷文案的那一行；i18n 四个 key 一并删
  （`dirBrowserAppBtn` 中英、`dirAppNoAccess` 中英）。
- `styles.css`：删掉 `#androidDirAppBtn` 两处（基础档 + `html.dir-compact`）
  和**顺带清掉一个死规则** `.dir-select-btn` —— DOM 里从来没有这个 class，
  而它带着旧调色板的 `linear-gradient(135deg, #8b5cf6, #6366f1)`，
  正是 R39 一致性盘点要抓的那种残留（见 `project memory` 的调色板黑名单）。
- **保留**：权限报错卡里那句 `permAppDir`（「也可以把 TeslaCam 放进本应用自己的目录，
  这个目录不需要任何权限：<路径>」）。它是 `MANAGE_EXTERNAL_STORAGE` 被拒时的逃生通道，
  而且路径可以走「手动输入路径」粘进去，不依赖被删的那个按钮。
  `nativeAppFilesDir()`（Kotlin `getExternalFilesDir`）因此也留着，只被这一处用。

### 实测（emulator-5554，1.2.57）

- 竖屏 412×915：`touch-ui sheet-mode dir-compact`，面板 `[10,260,392,621]`、`gapBottom 34`、
  `transform` 为单位矩阵、`391/391 · 619/619` 无溢出、标题 `text-align:center`、
  抓握条 359×26、`.modal-buttons` 只有 1 个按钮 359×44、列表与按钮之间留 12px。
- 真手势：下滑列表进入 `/storage/emulated/0/Download`（空目录 → 0 行，面板随之缩到
  `top 550`，所以抓握条中心也从 272 漂到 568 —— 又一次「坐标必须现量」）；
  从抓握条下滑关闭（`show:false`、`display:none`）；横屏 × 关闭。
- 横屏 915×412：`touch-ui dir-compact`（无 `sheet-mode`），居中卡片 `[178,44,560,328]`、
  `alignItems:center`、抓握条 `display:none`、标题回到左对齐（那是对话框，不是抽屉）、
  单按钮 526×44、`558/558 · 326/326` 无溢出。
- 截图：`devtools/r48-dir-portrait.png`、`devtools/r48-dir-landscape.png`。
- 复位：竖屏、`accelerometer_rotation 1`、`user_rotation 0`、六个弹窗全 `none`、
  `tdashcam.mediaDir = /storage/emulated/0/TeslaCam`、`eventGroups.length === 7`。

### iOS 视角的差距盘点（为 iOS 版做准备，本轮只盘点不动手）

见下一节「iOS 版差距清单」。结论摘要：**桥面 23 个方法要重写、导出落盘写死了
`/storage/emulated/0/Download`、键盘高度只有安卓一条路、触感只有 `navigator.vibrate`
（iOS 不支持）、返回键模型 iOS 不存在、`isTouchShellRuntime` 的 UA 已经认 iPhone/iPad**。

### 交付

- `TDashcamStudio/Tessera-1.2.57-android-universal.apk` —— md5 `42bb0f2ddef20fd7444200ed196ac655`，
  27,757,947 字节。已 `adb install -r -g` 到 emulator-5554，设备上 `base.apk` 的 md5 逐位一致。
- 根目录 1.2.34 … **1.2.57** 共 24 个版本包（含更早的 `TDashcam_*` 与分架构包，总计 60 个 .apk），
  旧包一个没删没挪。
- 全部改动仍未提交（clone 没有 git 凭据）。
- 遗留待用户定：导出水印的文案/位置/透明度。

## iOS 版差距清单（R48 盘点，按「能不能先在安卓版做」分档）

事实来自代码，位置都给了行号。分三档：**A = 只有 iOS 版才需要**（架构/系统能力，安卓不动）；
**B = iOS 惯例，但安卓现在就能按同一套做**（做了两边都受益，桌面不动）；
**C = 两边共用但 iOS 会先崩的坑**。

### A. iOS 版必须重写的部分

| 项 | 现状（代码位置） | iOS 侧要做成什么 |
| --- | --- | --- |
| 原生桥 | `MainActivity.kt:705-830` 的 `NativeBridge`，**23 个 `@JavascriptInterface`**：pageReady / setBackLayers / setLightSystemBars / openStorageSettings / appFilesDir / storageVolumes / requestVolumeCounts / nativeStatus / openExternal / deletePaths / setKeepScreenOn / setFullscreen / systemBrightness / setScreenBrightness / scanMediaFile / startExport / cancelExport / exportCodecReport / exportCodecProbe / requestThumb，加 6 个 `window.__tdashcam*` 回调钩子 | `WKScriptMessageHandlerWithReply`（iOS 14+）逐个对应；`addJavascriptInterface` 是同步返回值模型，改成 reply 后**每个调用点都要 await**，这是最大的一笔改动 —— **JS 侧这笔已在 R59 还掉**：26 个方法里 void 的一半走 `nativeFire()`（R54-2）、值返回的一半走 `nativeAsk()/nativeAskJson()`（R59），调用点已经不再假设桥能同步答话，iOS 只需替换门面函数体。**R67 改名一处**：`setScreenBrightness` 已换成 `setScreenBoost(比例)`，且「基准亮度」这件事从 JS 挪进了原生 —— iOS 侧照抄这个分工（`UIScreen.main.brightness` 是全局的、不是窗口级的，所以 iOS 要做的其实是「读系统值 + 观察它变」这一半，另一半「压过滑块」在 iOS 上根本没有对应能力） |
| 目录浏览 | 整个 `#androidDirModal` 走 POSIX 路径 + `list_subdirs`/`probe_readable`（`lib.rs:110,257`） | iOS 没有可读的文件系统树。要么改成 **AVFoundation 直接读 Tesla 车机 Wi-Fi 的 HTTP 索引**（`https://192.168.9.1:4444/`，自签证书要 `URLSession` 挑战处理），要么走 **Files/UIDocumentPicker + iCloud**。「路径输入框」这一层在 iOS 上没有对应物 |
| 导出落盘 | 目标目录**硬编码** `/storage/emulated/0/Download`（`script.js:950,12601,17037`），Kotlin `ExportEngine.kt:158-164` `File(outPath)`+MediaMuxer 直写，入库靠 `MediaScannerConnection.scanFile`（`MainActivity.kt:792`） | 换成 **AVAssetExportSession / VideoToolbox** 重编（整套 GL 合成要重写），落盘改 **PHPhotoLibrary 存相册**（iOS 用户预期就是「进相册」）+ 分享面板 `UIActivityViewController`。（原先 `AndroidManifest.xml` 里那段 Kotlin **从没引用**的 `FileProvider` 已在第六十轮删掉，所以安卓侧连 `content://` 这一层都不存在 —— iOS 从「直写文件」换成「写相册」是干净的一刀，不用同时迁就两种出口。） |
| 返回键 | `MainActivity.kt:93-116` `OnBackPressedCallback` + `setBackLayers` 计数（JS 只报层数不维护栈：`script.js:13482,13388,13402`） | iOS 没有返回键。要么左缘滑动返回（`interactivePopGestureRecognizer` 等价物，需要在 WebView 里自己实现边缘手势并映射到 `closeTopLayer`），要么全部改成「× / 下滑」。**页面层栈现在只有计数，没有栈**，做边缘返回要先补成真正的栈 |
| 屏幕方向 | 代码里**没有** `setRequestedOrientation`（manifest 只有 `configChanges`） | iOS 需要显式 `supportedInterfaceOrientations`；全屏播放时转横屏靠系统，WebView 里要自己处理 status bar 隐藏 |
| 权限模型 | `MANAGE_EXTERNAL_STORAGE` 一键跳设置页（`openStorageSettings`）、`storageVolumes` 枚举卷 | iOS 无此概念：本地网络要 `NSLocalNetworkUsageDescription`（读车机 Wi-Fi / 甚至 loopback 之外的访问），相册写入要 `PHPhotoLibrary` 授权，`Info.plist` 的 `NSAppTransportSecurity` 要放行本地 http |

### B. iOS 惯例，但安卓版现在就能改（改了 iOS 版直接继承）

1. ~~**底部不该有「⋮ 更多」溢出菜单**~~ —— **1.2.64 已做**（第五十一轮 B1）：底部栏改成
   片段 / 播放 / 视图 / 设置四个真 tab，「选择文件夹」「刷新列表」降级进设置面板。原文：
   iOS 的底部是 tab bar，每个 tab 是一个目的地；
   把设置塞进 ⋮ 是 Android 桌面式的做法。建议：底部动作栏 5 个键（列表/文件夹/布局/刷新/更多）
   重排成 3–4 个真目的地（片段 / 播放 / 设置），「文件夹」降级成设置里的一行。
   涉及 `index.html` 底部栏与 `#tabMoreBtn` 面板 —— 也就是 R42–R44 反复调排版的那块，
   改结构比继续调排版划算。
   → **1.2.77 第五十八轮再收一步**：四枚里查出「播放」根本点不到（抽屉展开时整条栏被
   `visibility:hidden`），已删，剩 **片段 / 视图 / 设置** 三枚，且这条栏从此不再自称 tab bar。
2. **搜索应该在导航栏里，而不是抽屉里一个固定输入框**。现在是 `#eventSearch`（`index.html:59`）
   加独立的 `filterToggleBtn` 面板（`index.html:29`）。iOS 惯例是 `UISearchController`：
   收起时是导航栏一个搜索图标，下拉才展开成搜索态（筛选 chips 同时沉到键盘上方）。
3. **列表行该有滑动操作**。删除事件现在是长按菜单 → 确认弹窗（R26-4 / `#deleteConfirmModal`）。
   iOS 的分组列表惯例是**行左滑出红色 Delete**，破坏性动作用红色而不是弹窗二次确认；
   弹窗只留给「删完不可恢复且批量」这种情况。
4. **触感反馈太粗**。全仓只有一处 `navigator.vibrate`（`script.js:1033`），且 **iOS 的 WKWebView
   根本不支持 `navigator.vibrate`** —— 到 iOS 会静默失效。现在就该把它包成
   `haptic(kind)` 一层抽象（light/medium/heavy/selection/success），安卓走 `VibrationEffect`
   的对应预设，iOS 走 `UIImpactFeedbackGenerator`。R41-6 补的那批「关键操作触感」正好一起归口。
5. **进度反馈要能挂住**。导出进度现在是 JS 轮询 `__tdashcamExportProgress`；
   iOS 上 App 一退后台就被冻结。需要 **AVAssetExportSession 的后台任务 + Live Activity /
   本地通知**，安卓侧对应 foreground service。这是「导出 5 分钟不能守着屏幕」的刚需。
6. **减弱动态效果 / 对比度**：`prefers-reduced-motion` 已经吃到了（R41-4），但
   `prefers-contrast`、`prefers-reduced-transparency` 在安卓 WebView 上 `matches:false`（R47 实测），
   iOS 的 WKWebView 同样不映射「增强对比度/减少透明度」。所以这两条**必须走原生桥**：
   读 `UIAccessibility.isDarkerBackgroundsEnabled / isReduceTransparencyEnabled`
   （安卓是 `AccessibilityManager` 的对应开关）注入成 html class，和现有 `touch-ui/sheet-mode` 一套机制。
7. **常亮/全屏/亮度**：`FLAG_KEEP_SCREEN_ON`（`MainActivity.kt:298`）、
   `WindowInsetsControllerCompat`（`:360`）、`systemBrightness/setScreenBoost`（R67 起桥里是
   `setScreenBoost`，写 `screenBrightness` 的那段逻辑收在 `writeScreenBrightness()` 里）
   都有，但**没有 AudioManager 音频焦点**。iOS 需要 `AVAudioSession`（category `.playback`、
   来电打断要暂停、拔出耳机要暂停），安卓侧同样缺 `AUDIOFOCUS_LOSS` 处理 —— 现在接电话不会自动暂停。

### C. 两边共用、但 iOS 会先出问题的坑

- **键盘高度只有一条安卓路**：`--kb-h` 来自 Kotlin `Type.ime()`（`MainActivity.kt:396,411`），
  JS 完全没用 `visualViewport`。iOS 上这条恒为 0，横屏输入框会被键盘顶出可视区
  （就是 R23/R71 修过的那类问题在 iOS 复发）。**先改成 `visualViewport` 优先、原生 insets 兜底**，
  安卓也能顺带少一次桥往返。
- **`isTouchShellRuntime()` 的 UA 已经认 `iPhone|iPad|iPod`**（`script.js:746`），
  但 `isAndroidRuntime()`（`:693`）是 `__TAURI__` + UA Android 的组合判据 —— iOS 版会**两个都不满足**，
  于是走桌面分支。门控计数：`isAndroidRuntime` 45 处、`isPhoneLayout` 48 处。
  现在就该把它们收敛成 `isTouchShellRuntime()` + `isSheetLayout()` 这类**能力判断**，
  而不是平台判断，否则 iOS 版要改 90 多个点。
- ~~**手势全靠 JS 自绘**（fling、亮度、长按倍速、捏合、下拉刷新、抽屉侧滑，多处 `passive:false` +
  `preventDefault`）。WKWebView 上 `touchmove` 的 `preventDefault` 与 iOS 的系统边缘手势/回弹会打架……
  统一走 Pointer Events + `touch-action` 能少踩雷。~~ —— 1.2.79 → 1.2.80（第六十轮）安卓侧已收：12 个识别器
  全部改 Pointer Events + `setPointerCapture`，画面上的 `preventDefault()` 一律删掉，改用声明式
  `touch-action`（`html.touch-ui .video-container{none}` / `.player-area{manipulation}` /
  `.progress-container, .clip-handle{none}` / 抽屉四条 chrome `{pan-y}`；`none` 13 处、`pan-y` 2 处、
  `manipulation` 1 处）。**`pan-y` 那一块是 1.2.80 补的**：1.2.79 装机真滑动才发现抽屉侧滑在九像素处
  就被合成器接管（`pointercancel`），详见第六十轮第 4 节 —— iOS 上这条只会更早发生，
  抽屉/列表这些面**必须在 `WKWebView` 里就声明归 app**，否则一划就断。
  **只剩下拉刷新（`setupPullToRefresh`）仍是 Touch Events + `{passive:false}`** —— 它是唯一需要
  「取消一个浏览器已经开始的滚动」的识别器，`pointermove` 做不到，代码里已写明别去"顺手改完"。
  iOS 侧仍未做完的两件，页面这边无解、要在壳里设：
  **`scrollView.bounces = false`**（否则列表划到顶会整页回弹，把 PTR 的位移读成弹簧），
  以及**左侧系统返回边缘手势**（iOS 是全高 20~30px 的导航手势区，比安卓那 24dp 更凶 ——
  抽屉的「右滑打开」和亮度那条「左 1/3 竖滑」都在它范围内；要么 `interactiveContentMotion` 关掉，
  要么把这两条手势挪出左边缘）。
- **`alert()` 已经被 shim 成 toast**（`script.js:1085-1096`），裸 `alert/confirm` 计数为 0，
  只有桌面 `notify()` 分支还留一个 `window.alert`（`:1064`）—— 这块 iOS 可以直接继承，不用动。
- **深色材质的判据：悬浮面要往上提亮，不是往下压暗**（1.2.81 第六十一轮）。安卓手机档把
  `--glass-bg-soft` 抬成暗填充 `rgba(30,32,40,.84)` 的动机是「`<video>` 走独立合成层、
  `backdrop-filter` 采不到」（R39-3），**WKWebView 也是这个构造**，所以那个 hack 大概率要原样带过去；
  但它在首页（背后没有视频，只有渐变）画出了一张比页面还暗的"凹陷板"。现在这一处已经不吃 token：
  深色下 `rgba(255,255,255,.10)` 往上提亮、`html.solid-material` 给平铺 `#3c3e44`。
  iOS 若继续共用这份 `styles.css` 就白拿；若换成 `UIVisualEffectView`，**记得这两条判据是量出来的**
  （.12 会让卡内那行 12.5px 小字掉到 4.46:1 不过 AA），并且 `.player-area.empty .empty-hero{z-index:40}`
  那条抬层要跟着 —— 否则亮度黑纱又会盖住首页唯一入口。顺带一条要在 iOS 上单独定的：
  安卓这条"上滑调暗"是**页面内的黑纱**（`#phoneBrightnessDim` + 持久化的 `tdashcam.brightness`），
  iOS 若换成 `UIScreen.main.brightness` 就是改整块屏幕、首页无视频态该不该让它生效是另一个决定。

### 建议的动手顺序

1. 先做 **B4 + C1 + C2**（触感抽象层、`visualViewport` 键盘、平台判断收敛成能力判断）——
   三项都是「越晚做越贵」，且安卓侧立刻能验。
2. 再做 **B1 + B2 + B3**（底部改 tab 语义、导航栏搜索、行左滑删除）—— 这是 iOS 观感的大头，
   也顺手终结 R42–R44 在 ⋮ 面板排版上的反复。
3. **A 档**（桥、数据源、导出、返回栈）留到真正起 iOS 工程时一起做，其中「数据源」要先定：
   iOS 上读特斯拉只有「连车机 Wi-Fi 走 HTTP」这一条路，这决定了要不要保留整个目录浏览器。

## 第四十九轮（1.2.58 / 1.2.59）：把 iOS 差距清单里「安卓现在就能做」的一次做完

用户要求：「改吧，把能改的都一起改了，方便后面出 iOS 版本的，保持两个平台体验一致。」
上一轮那份清单里 B 档 7 条 + C 档 3 条，本轮落了 6 条（B2 / B3 / B4 / B7 + C1 / C2），
外加一个验收时才暴露的横屏判据 bug（R49-7）。桌面端一行没动。

### R49-1 触感抽象层 `haptic(kind)`（B4）

原来全仓只有一处 `navigator.vibrate`，而且 iOS 的 WKWebView 不支持它，到 iOS 会静默失效。

- `script.js:1095` `HAPTIC_KINDS`：`light [10] / medium [18] / heavy [30] / selection 8 /
  success [16,60,16] / error [40,50,40]` —— **名字**而不是毫秒串，iOS 侧直接映射
  `UIImpactFeedbackGenerator` / `UINotificationFeedbackGenerator`。
- `script.js:1104` `haptic(kind)`：先问桥（`nativeHaptic`，`:1113` 只在桥真的应答时返回 true，
  半加载的桥仍回落到 `navigator.vibrate`），并且只在 `isTouchShellRuntime()` 下发声。
  现在 12 个调用点全部走这一层（R41-6 补的那批「关键操作触感」一起归口）。
- `MainActivity.kt:896` `fun vibrate(kind: String)`：API 29+ 用 `VibrationEffect.createPredefined`
  （安卓只有 `tick/click/doubleClick/heavyClick`，没有 light，所以 light 与 medium 共用 CLICK、
  只有 success 拿 DOUBLE_CLICK，`:390-403`），拿不到预设再退回毫秒表（`:405-415`）。
  `AndroidManifest.xml:8` 的 `VIBRATE` 是 normal 权限，装上即有，不需要弹窗。

### R49-2 键盘高度改走 `visualViewport`（C1）

原来 `--kb-h` 只有安卓一条路（Kotlin `Type.ime()`），iOS 上恒为 0，横屏输入框会被键盘顶出可视区
—— 就是 R23/R71 修过的那类问题会在 iOS 复发。

- `script.js:904-921`：`publishVisualKeyboard()` 用 `innerHeight - vv.height - vv.offsetTop`
  量出键盘，写进 `--kb-vv-h`；`VISUAL_KEYBOARD_MIN_H = 60` 以下当作工具条/滚动伪影丢掉。
  监听 `visualViewport` 的 `resize` 与 `scroll`。
- `styles.css:15` `--kb-h: max(var(--kb-native-h, 0px), var(--kb-vv-h, 0px))` —— 取两者更深的那个，
  **不是相加**。安卓这条 WebView 不为键盘缩布局视口，所以实测 `vvH 412 == innerHeight 412`、
  `--kb-vv-h` 恒 0，原生半边继续说话；iOS 上反过来。两边共用一套 CSS。
- 实测（横屏导出抽屉，点 `#peStartInput`）：`--kb-native-h 261.3px` →
  `--sheet-bottom: max(16px, calc(max(220.2px, 0.0px) + 8px))`，面板底 `396 → 184`，
  焦点输入框 `y 324 → 107`，键盘顶在 192 —— 焦点行没被盖住。
  已知代价：横屏 412 高再让出 220 键盘后，`.pe-body` 只剩 37px 可滚（`407/37`），
  靠 R71 的补滚把焦点行带进视野。这是横屏高度预算本身的问题，不是本轮引入的。

### R49-3 平台判据收敛成能力判据（C2）

R48 数过：`isAndroidRuntime` 45 处、`isPhoneLayout` 48 处，iOS 版会两个都不满足而走桌面分支，
照这个写法 iOS 要改 90 多个点。

- 现在是三层：`isAndroidRuntime()`（**14 处**，只留真正安卓独有的：桥注入、系统栏、IME insets）、
  `isTouchShellRuntime()`（31 处，触摸壳一律走它，UA 已含 iPhone/iPad/iPod）、
  `hasNativeBridge()` / `nativeMethod(name)`（问「这个能力在不在」而不是「这是什么系统」）。
- 布局侧继续用 `isPhoneLayout()` / `isTabletLayout()` / `hasTabletGeometry()`（4 处），
  它们本来就是镜像 CSS 媒体查询的，与平台无关。

### R49-4 列表行左滑删除（B3）

删除事件原来只有「长按菜单 → 确认弹窗」。iOS 分组列表的惯例是行左滑出红色 Delete。

- 渲染门控 `script.js:4543`：`isPhoneSurfaceLayout() && viewer.eventDeleteTargets(event)` 才挂
  `.swipeable`；`makeRowSwipeDeletable` 在 `:4558`。
- Pointer Events + `touch-action: pan-y`（`styles.css:5317`）—— 少了这条，横拖 15px 就被
  Chromium 判成滚动并 `pointercancel`，手势根本收不到 move。
- 拖动量：`translateX` 驱动缩略图与信息区（`:5325`），按钮停在 `-82px` 处等着（thumb
  `matrix(1,0,0,1,-82,0)`），`.row-swipe-delete` 76×行高、`rgb(255,69,58)`、
  `aria-label="删除事件"`、`transition .16s`；parked x=297 → 展开 x=215..291。
- **和抽屉侧滑抢手势**是这条的难点：`markRowClaimed()`（`:4586`）在每次真正拖动时刷新
  `viewer.rowSwipeClaimedAt`（`:4618/4624/4630`，不只是 pointerdown），抽屉侧用
  `rowSwipeOwns()`（`:15561`，250ms 窗口）在关闭判定（`:15573`）与左缘开启判定（`:15600`）处让路。
  只在 pointerdown 打时间戳是不够的 —— 一次慢拖超过 250ms，抽屉就会在半路把列表划走。
- 实测（浅色 + 深色 × 竖屏 + 横屏，全部真手势）：左滑展开、右滑收回、快速短滑（靠速度）、
  横向拖到一半松手回弹、纵向拖动仍正常滚动列表、点行照常播放、展开后点红色按钮进
  `#deleteConfirmModal` 再取消（7 张卡 / 7 组不变）、**滑开第二行时第一行自动收回**
  （iOS 的互斥行为，实测 row1 由 `swipe-open` 变回闭、row2 展开）。
- 已知且接受：关闭抽屉会把展开的行留在原地（iOS 滑过的 cell 同样不会自己收回去），
  列表重渲染时才复位。

### R49-5 搜索改在导航栏内展开（B2）

> **本节已被 R55 推翻**（1.2.73）：搜索框改成常驻抽屉第一行，`--nav-shift` 那套测量机器整套删除。
> 下面的行号与位移数值只作历史留档。

原来是抽屉里一个常驻输入框占一行。现在收起时是一行搜索条，点它 → 整条沉进导航栏。

- `script.js:10925` `setSearchMode(on)`，focus/blur 绑定在 `:10233-10234`，取消键 `:10243`。
- 位移用**量出来的** `--nav-shift`（`:10947`）而不是写死：它是「导航栏底边」减「输入框当前顶边」，
  随安全区、语言、日期行高度变。CSS 侧 `styles.css:5201` `transform: translateY(var(--nav-shift))`。
- 实测：竖屏输入框 `y 166 → 57`（导航栏高 97）；横屏 `y 67 → 27`、`--nav-shift: -40.3px`、
  取消键 `rgb(91,75,240)` 宽 33、标题与日期 chips 隐藏。深色主题下取消键转成浅紫，仍读得清。

### R49-6 音频焦点：来电/其他 App 抢占时自动暂停（B7）

原来接电话不会暂停，声音被切断后视频还在默默跑。

- JS `setNativeAudioFocus(on)`（`script.js:1540`）→ `TDashcamNative.setAudioFocus` →
  Kotlin `applyAudioFocus`（`MainActivity.kt:330`，API 26+ 用 `AudioFocusRequest`，否则 legacy listener）→
  `onAudioFocusChange`（`:362`）→ `evaluateJavascript("window.__tdashcamAudioFocus('loss')")` →
  `viewer.multiCameraPlayer.pauseAll()` + toast「已暂停：其他应用需要使用声音」（5s）。
  暂停即释放焦点（`abandonAudioFocus`），不会一直占着系统的音频焦点栈。
- 实测：`adb emu gsm call` 后 **2.9s** 暂停。第一次探针在 1.4s 读到 `playing:true` 就报了「没生效」，
  那是电信到达的延迟，不是 bug —— 换成页内 Promise 监听器掐表才量准。
  `dumpsys audio` 三段对得上：request → `code: -2 event: handleLoss`（telecom 同时刻）→ abandon。
  toast 用 MutationObserver 抓：`.toast-container` 是按需创建、到点整个删掉，DOM 里根本没有
  `#toast` 这个元素（又是一次「只查状态会假失败」）。

### R49-7 横屏手机档判据统一（验收时才炸出来的）

1.2.58 竖屏全绿，横屏左滑**完全不动**。查出来是 JS 与 CSS 在「什么叫手机」上各说各话：

- CSS 的手机档媒体查询（`styles.css:5112`）是
  `(max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px), (hover: none) and (pointer: coarse)`
  —— 横屏手机 915×412 **命中第三条**，所以左滑按钮、导航栏搜索、抓握条全都按手机档样式画出来了；
- 而 JS 侧 `isPhoneTouchLayout()` 要 `isPhoneLayout()`（≤768 宽），横屏 915 宽 → false，
  于是手势全部拒绝工作。**样式在、判据不在**，表现就是「按钮画得出来，滑了没反应」。
- 新增 `isPhoneSurfaceLayout()`（`script.js:813`）= `isTouchShellRuntime() && !hasTabletGeometry()`，
  即「触摸壳 + 没有平板几何」，与 CSS 那一档对齐；`isPhoneTouchLayout()` 调用点清零后删掉。
  三处改挂：行左滑门控（`:4536`）、`makeRowSwipeDeletable` 的 pointerdown（`:4559`）、
  `setSearchMode`（`:10929`），外加抽屉抓握条的 `live()`（`:842`，`phoneTier` 走手机档判据）。
- 1.2.59 横屏复测：左滑展开（row y=199、按钮 x=219 w=76、thumb `-82`）、导航栏搜索
  （`--nav-shift -40.3px`）、导出抽屉抓握条下滑关闭（grabber 586×20 在 (484,29)，
  150ms 快滑到 (484,250) → `display:none`）全部生效。

### 实测（emulator-5554，1.2.59，dpr 2.625）

- 竖屏 412×915 深色：`r49-11-07`（滑开前）、`r49-11-08`（第 3 行展开，红底白字「删除」对比度足够，
  第 1 行 active 蓝环）、`r49-11-10`（搜索态：胶囊沉进导航栏、取消键浅紫、标题与 chips 隐藏）。
- 横屏 915×412：浅色 `r49-10-07`（左滑展开）、`r49-10-08`（导航栏搜索）；
  深色 `r49-11-02`、`r49-11-03`。
- 验收过程中的两次假信号，都记进项目记忆了：一次是抽屉已开时点 (56,876) 打到了「选择文件夹」，
  弹出目录抽屉把所有点击吃掉（`r49-10-05`，靠 `keyevent 4` 退出）；一次是横屏第一次左滑没反应，
  1 秒后带 pointer 追踪重滑出 14 个事件才展开 —— 抽屉开启动画没走完。
- 复位：主题回 `auto`（`tdashcam.themeMode` 清成 auto、body 无 `dark-theme`）、日期筛选 ×、
  列表回 7 张卡、`user_rotation 1` + `accelerometer_rotation 1`、导出抽屉与键盘关闭。

### 交付

- `TDashcamStudio/Tessera-1.2.59-android-universal.apk` —— 27,762,555 字节，
  设备上 `versionName=1.2.59` 与 `tauri.conf.json` 一致。
- 根目录 1.2.34 … **1.2.59** 共 25 个版本包，旧包一个没删没挪。
- 全部改动仍未提交（clone 没有 git 凭据）。
- 本轮没做的（下一轮或直接等 iOS 工程）：B1 底部栏改真 tab 语义（结构改动，牵动 R42–R44 那批排版）、
  B5 后台导出（安卓前台服务 + iOS Live Activity）、B6 增强对比度/减少透明度走原生桥、
  A 档（原生桥 23 方法、数据源、导出落盘、返回栈）、导出水印（等你给文案/位置/透明度）。

## 第五十轮（1.2.60 / 1.2.62 / 1.2.63）：抽屉搜索态的空洞、旋转后的旧位移、⋮ 面板点一下就关

> R50-1 / R50-2 / R50-4 都是在维持 R49-5 的抬升方案，**整套已在 R55 删除**（见第五十五轮）。
> R50-3（⋮ 面板偏好行）不受影响，仍然生效。

起因是你在小米 14 上拍的两张图：竖屏抽屉里搜索框本来在「选择日期」下面，点一下框跑到导航栏，
**原来的位置空出一大片**，中间像断了。顺带把验收里露出来的另外两条一起修了。

### R50-1 搜索态不再留空洞（你报的那条）

R49-5 只把框「抬」进导航栏，没有把框原来占的那一行收掉：

- 那一行高 44px（`--field-h`）+ 下面日期 chips 约 56px，全都还留在文档流里；
- 竖屏导航栏到「选择日期」之间本来就只有一行的位置，于是框走后空出 ~100dp 的一条，
  列表被推到 y=270 才出现。浅色深色都看得见，横屏因为抽屉矮反而不明显。

修法（`styles.css:5215`–`5237`，全在 `html.touch-ui` + `.sidebar.nav-search` 下，桌面碰不到）：

```css
html.touch-ui .sidebar.nav-search .sidebar-header .header-title { visibility: hidden; }
html.touch-ui .sidebar.nav-search .quick-filters { padding-bottom: 0; }
html.touch-ui .sidebar.nav-search .event-search-row { margin-bottom: calc(-1 * var(--field-h)); }
html.touch-ui .sidebar.nav-search .date-chips { display: none; }
```

- **框用负 margin 塌掉，不用 `height: 0`**：框自己的盒子就是位移的锚点，把盒子压扁会让
  flex 居中的 input 在 0 高盒子里重新定位，等于把刚量好的 `--nav-shift` 又推歪。
- 标题（「特写」）继续用 `visibility` 而不是 `display`：导航栏要保持高度，否则框要落的那条带
  跟着缩，`--nav-shift` 量的目标就没了。
- 过渡补上 `margin-bottom`（`styles.css:5198`），塌和涨都跟着那 180ms 一起走，不是瞬间弹。
- 实测：竖屏 `firstTop 270 → 166`、`off:0`（框中心 = 标题中心）、取消后 chips 回 `flex`、
  `firstTop` 回 274。

### R50-2 旋转后还在用上一次量的位移

`configChanges` 里声明了 `orientation|screenSize`，旋转**不会重载页面**，所以 `nav-search` 类
和内联的 `--nav-shift` 都活着 —— 竖屏的 `-109.5px` 用在横屏（导航栏只有 46px 高）就是把框顶到
屏幕外，实测 `y=-38`。

- 新增 `refreshNavShift()`（`script.js:10998`），挂在 `handleResize()`（`:10515`）里，
  第一遍照顾桌面拖窗口，300ms 后再量一遍。
- 第二遍是必须的：旋转时原生 insets 监听会**重新发布 `--safe-top`**，它比 resize 事件晚到，
  第一遍量的数还带着旧状态栏高度。
- 只加这一条还是错的：第一次实现量出 `-40.3`、`-69.2`，都不是真值。原因是去掉 `nav-search`
  类之后立刻 `getBoundingClientRect()`，此时**过渡还在跑**，读到的是正在往下滑的中间位置。
  量之前必须先把 `transition` 关掉、强制一次布局，量完再打开。

### R50-3 ⋮ 面板里点偏好项，面板不该关

排序、连续播放、只看收藏、触发标注、播放起点这几行是**改一个状态**，点完面板就闪关，等于每调
一项都要重新点开一次；而「详细数据」「导出 CSV」这些是**要去干别的事**，点了当然该关。

- `index.html:138/142/146/152` 四个按钮加 `data-keep-menu`，`script.js:10341` 的「点外部关闭」
  监听器认 `.menu-choice, [data-keep-menu]` 两类：
  ```js
  if (e.target?.closest?.('.menu-choice, [data-keep-menu]')) return;
  ```
- 分段控件（播放起点、主题、语言）本来就是 `.menu-choice`，不用动。

实测（1.2.62，真点击，坐标现量）：排序 新→旧 ⇄ 旧→新、连续播放 关→开、触发标注 开→关、
播放起点 接着上次→从头播，四次点完 `#headerRight` 一直是 `active`；改完逐项点回去。
再点「详细数据」（动作行）→ `active` 掉，面板照旧关。

### R50-4 位移改成「塌完再量」（验收时自己露出来的）

R50-1 之后横屏还差 3px：框中心 50、标题中心 47。查出来是**量得太早** —— `nav-search` 同时也在
改框的高度（竖屏 `--field-h` 44、横屏 38），在塌之前量的位移，落地时中心就偏了半个高度差。

- `setSearchMode` 现在先加类、再 `setNavShift()`（`script.js:10963`）量，量的是最终几何。
- 但清掉旧 `--nav-shift` 时**必须同时关 transition**：这个内联属性比类活得久，取消搜索后它还在
  元素上，第二次聚焦时「清属性 → 立刻读 rect」读到的是从 -109.5 往 0 滑的动画中途，量出
  `dy=0`，框直接躺在原位（实测 `off:109`）。加 `animate` 参数：进入时开启动画、旋转重定位时
  整段关掉，一次成型不滑。
- 真点击复验（模拟器，打补丁跑同一份逻辑）：首次进入 `off:0` → 取消恢复 → **二次进入 `off:0`**
  → 转横屏 `off:0`（-43.0px）→ 转回竖屏 `off:0`（-109.5px）。

### 实测（emulator-5554，1.2.62 / 1.2.63，dpr 2.625）

- 竖屏 412×915 浅色 `r50-07`、深色 `r50-08`：胶囊正好在导航栏带里、右边「取消」、下面紧接
  「选择日期 / 所有类型」，再下面就是列表，没有空洞。
- 横屏 915×412 深色 `r50-09`：同一套塌法在矮导航栏上也成立，键盘弹起不挤列表。
- `r50-06` 那张其实是 **ANR 对话框**（「特写 isn't responding」，模拟器内存 2338/2472 MB），
  `cdp-shot` 只截 WebView 所以图里看不见，是 `adb screencap` 全屏幕截出来才发现的 ——
  它当时还吃掉了我的第一次点击。点 Wait（CSS 124,439）后 force-stop 重来。
- 复位：主题从深色点回浅色（`tdashcam.themeMode`）、搜索态取消、⋮ 面板关、`user_rotation 0`。

### 交付

- `TDashcamStudio/Tessera-1.2.63-android-universal.apk` —— 本轮最终包，27,764,283 字节，md5
  `26333c290a40f9a3edcbe8dba30fe7f3`，与设备上 `base.apk` 逐字节一致，`versionName=1.2.63`；
  含 R50-1…4 全部四条。装完在模拟器上真点击复验：首次进入 `off:0` → 取消恢复 → 二次进入
  `off:0` → 转横屏 `-43.0px / off:0` → 转回竖屏 `-109.5px / off:0`。
- `TDashcamStudio/Tessera-1.2.62-android-universal.apk` —— 27,764,091 字节，md5
  `84be0d0472d95c2cdff47595684f96ce`，与设备上 `base.apk` 逐字节一致，`versionName=1.2.62`；
  含 R50-1/2/3，不含 R50-4。
- **1.2.60、1.2.61 没有出包**：1.2.60 装完在验收里发现横屏旋转会把搜索框顶出屏幕（R50-2 的
  第一版没修对，量到动画中途），1.2.61 是那次没通过的中间态，都不该交给你，所以直接从
  1.2.62 起算。根目录 1.2.34 … 1.2.63 的旧包一个没删没挪。
- 全部改动仍未提交（clone 没有 git 凭据）。
- 下一轮按说好的顺序：**B1** 底部栏改真 tab 语义（片段 / 播放 / 布局 / 设置，「文件夹」收进设置）、
  **B5** 后台导出（前台服务 + 进度能扛住切后台）、**B6** 增强对比度 / 减少透明度走原生桥。
  导出水印仍在等你给文案、位置、透明度。

## 第五十一轮（1.2.64）：底部栏改真 tab 语义（B1）

> 注：**「播放」那一格已被第五十八轮删掉**（它的动作在手机上永远点不到，见文末）。本轮其余三条仍有效。

### B1-1 五个格子里只有两个是「地方」

原来的底部栏是 列表 / 文件夹 / 视图 / 刷新 / 更多。tab bar 的规矩是**每格对应一个你去得了、
也回得来的地方**，而「刷新」「选择文件夹」是动词：按完什么都不留下，既没有选中态可言，
又各占一个拇指位。

- 改成 片段（原「列表」）/ **播放**（新增）/ 视图（标签直接显示当前布局名「6 宫格」）/
  设置（原「更多」，图标换成滑杆）。`index.html:789`。
- 「文件夹」「刷新列表」降级进 ⋮/设置 面板的「其他」组：`#menuFolderBtn`（`index.html:175`）、
  `#menuRefreshBtn`（`:179`），沿用 `phone-only-btn` 门控 —— 桌面菜单不长这两行，
  `.header-actions-group button.phone-only-btn { display: none !important }`（`styles.css:5587`）
  仍然是那道闸。
- 两个新行**不带** `data-keep-menu`：它们是动作，做完就该让位。选文件夹要打开目录浏览器，
  面板压在它上面只会挡路。JS 侧 `script.js:11947`、`:11952` 各写一次 `remove('active')`。

### B1-2 选中态读别人写的 class，不自己记账

`syncTabSelection()`（`script.js:15596`）：抽屉开 → 片段；⋮ 面板开 → 设置；两个都关 → 播放。
视图是循环控件、不占地方，所以永远不亮 —— 它没有「回到视图」这回事。

- 三个写入点都得通知到，漏一个就开始说谎：`toggleSidebar()`（`:15569`，覆盖标题点击 / 侧滑 /
  返回键）、`headerRight` 的 MutationObserver（`:11966`，面板从四个地方关）、栏内点击（`:11941`）。
- 用 `aria-current="true"`，不用 `role="tab"` + `aria-selected`：这四个是 `nav` 里的 button，
  谎称自己是 tablist 会让 TalkBack 期待一套并不存在的方向键翻页。
- 选中样式其实早就写好了（`.tab-btn.on`：玻璃底 + 不透明度 1 + `--glass-tint`），
  只是过去**没有任何代码赋值**。实测选中 `rgb(91,75,240)` / 底 `rgba(91,75,240,0.14)`，
  未选中 0.62 灰、无底。

### B1-3 顺带修掉：淡出的栏还留在无障碍树里

栏在抽屉打开时是靠 `opacity: 0` + `pointer-events: none` 藏起来的，但按钮仍然可聚焦、可读 ——
TalkBack 会念出一个看不见的「片段」，Switch Access 也还能激活它。

- 改成同时 `visibility: hidden`（`styles.css:4687`），并把 `visibility` 加进 transition
  （`:4677`、`:5841`）。visibility 的过渡在「转出去」时于**结束时**翻转、在「转进来」时**立即**
  翻转，所以淡出动画一点没丢，而栏一消失就彻底离开读取顺序和 tab 顺序。

### 实测（emulator-5554，1.2.64，dpr 2.625，全部真点击）

- 竖屏 412×915：`r51-01` 浅色设置面板（新两行在「其他」组里；面板 368×505、`scrollHeight` 503
  不滚，底边 793 距栏顶 824 还空 31px）、`r51-02` 抽屉开且栏隐藏、`r51-03` 深色面板、
  `r51-04` 深色播放态。
- 横屏 915×412：`r51-05` 深色面板（760×210，`sh 208 = ch 208` —— 多出的两行没把矮屏预算撑破，
  五列换行后落在第 3 行）、`r51-06` `adb screencap` 全屏幕、`r51-07` 抽屉、`r51-08` 浅色面板。
- 状态机逐条走：点设置 → `moreCur:true`、播放掉 `.on`；点片段 → 面板关、抽屉开、
  `barVis:hidden`、片段 `on/cur`；返回键关抽屉 → 栏回 `visible`、播放重新选中；
  点视图两次 → `legacy → grid4 → grid`、标签跟着变「大小窗 → 6 宫格」、播放全程保持选中；
  面板开着点播放 → 面板关、播放选中。
- 中英切换复验新 key：`Clips / Play / View / Settings`、`Choose folder / Refresh list`，
  切回中文 `片段 / 播放 / 设置`。错误横幅 `display:none`（本轮无 JS 报错）。
- 复位：主题 `auto`、布局 `grid`（6 宫格）、语言中文、抽屉与面板关闭、
  `user_rotation 0` + `accelerometer_rotation 1`。

### 交付

- `TDashcamStudio/Tessera-1.2.64-android-universal.apk` —— 27,765,243 字节，md5
  `0964aa2df94164f0fc64b909701dc846`，与设备上 `base.apk` 逐字节一致，`versionName=1.2.64`。
  根目录 1.0.1 … **1.2.63** 的旧包一个没删没挪。
- 全部改动仍未提交（clone 没有 git 凭据）。
- 下一轮按说好的顺序：**B5** 后台导出（前台服务 + 进度能扛住切后台）、
  **B6** 增强对比度 / 减少透明度走原生桥。导出水印仍在等你给文案、位置、透明度。

## 第五十二轮（1.2.65 → 1.2.67）：后台导出（B5）

导出原来必须留在前台：切后台、锁屏会被系统杀掉，进度条也只活在导出面板里。这一轮把任务的
生命周期整个搬到 Kotlin 侧，页面退化成「随时可以离场、随时可以接上」的一个观察者。

### B5-1 想杀掉这一分钟的三把刀，各要各的挡法

一分钟的编码同时踩中三个系统机制，少挡一个就前功尽弃：电池优化会冻结后台进程、灭屏会挂起 CPU、
Android 12+ 对「没有合格服务在跑」的进程不再发放硬件编解码器。

- `ExportService`（`ExportService.kt:156`）：前台服务 + `foregroundServiceType="dataSync"`
  （`AndroidManifest.xml:64`）挡住第一把和第三把；`PARTIAL_WAKE_LOCK`
  （tag `tessera:export`，上限 6 小时）挡住第二把 —— 是**不挂起 CPU**，不是常亮屏幕。
- 四行权限 `AndroidManifest.xml:24-27`：`FOREGROUND_SERVICE`、`FOREGROUND_SERVICE_DATA_SYNC`、
  `POST_NOTIFICATIONS`、`WAKE_LOCK`。
- 服务只在 APP 内的点击里启动（`ExportHost.submit` 由桥调用），从不自行拉起，正好避开 Android 12+
  的后台启动限制。

### B5-2 引擎搬到进程上，页面只负责「接上」

旧版把引擎挂在 Activity 上，`onDestroy` 顺手 `cancel`，于是口袋里的一次旋转就等于一次白干。

- `ExportHost` 改成 `object`（`ExportService.kt:32`）：引擎、观察者表、最新 payload 全部属于进程。
  `MainActivity` 只注册一个转发 observer（`MainActivity.kt:74`、`:105`），`onDestroy` 里
  **只摘观察者、不再取消任务**（`:186`）。
- `submit()`（`:74`）同步返回页面自造的 id —— `@JavascriptInterface` 必须同步返回，进度只能晚点到。
- 服务真的进了前台才 `run()`（`:98`）。引擎对不可解析请求的报错地址是 id 0（`Request.parse` 抛在
  认出 id 之前），这里改写成真实 id：否则一个**根本没起来**的导出会看起来像**还在跑**。
- `statusJson()`（`:125`）返回 `{running, delivered, payload}`，payload 保留引擎写下的原字符串、
  不重新序列化，所以「事后接上」和「当时在场」页面解析到的是同一份东西。

### B5-3 关抽屉不再是取消的别名

- `hidePhoneExportModal()`（`script.js:17441`）：有任务在跑就只关面板 + 一句 toast
  「导出继续在后台跑，进度看通知」。取消只剩两个入口 —— 面板上的 取消，和通知上的 取消。
- 通知里的 取消 走服务 intent（`ExportService.kt:198` 的 `ACTION_CANCEL`）而不是 JS 调用：
  它可能在页面已经不在之后才被按下，那正是它存在的理由。
- APP 内的信号是底部胶囊 `#exportPill`（`updateExportPill()` `:17533`）：tab 栏不该让人以为没事在跑。

### B5-4 进度胶囊别压在进度条上（1.2.66）

胶囊最初落在 782-816，正好盖住走带上的时间轴，等于用一个新的遮挡换一个新的可见性。

- 改成 `bottom: calc(var(--action-h) + var(--controls-h, 134px) + 8px)`（`styles.css:5886`）。
- `--controls-h` **没有 `:root` 声明**，只由 `startControlsReserve()` 在运行时发布 —— 未设置的自定义
  属性会让整条 `bottom` 失效，`position:fixed` 退回静态位置。fallback 必须写，兄弟规则也都是这么做的。
- `--action-h` 已经含下手势内边距，所以 `--safe-bottom` 不能再加一遍。
- 实测竖屏 412×915：胶囊 662-696、控制层顶 704，净空 8px；横屏 915×412：149-183 / 顶 191。

### B5-5 Android 13+ 的通知授权：先干活，再问

- `ensureNotificationPermission()`（`:17578`）在按下「开始导出」、任务已经交出去之后才调用，
  `localStorage.tdashcam.notifAsked`（`:17583`）保证只问一次。前台服务不需要这个权限就能跑，
  Android 只是把通知藏起来 —— 拒绝损失的是进度条，不是导出。
- 被关掉时面板摘要补一句「通知被关了，进度只能在 APP 里看」（`notificationNotice()` `:17593`），
  这是唯一一个面板能替用户解决问题的警告。
- 所有原生调用都写成「桥在不在 + 有没有这个方法」的能力判据（`notificationsAllowed`、`exportStatus`
  等），iOS 侧将来接 Live Activity / BGTask 时实现同名桥即可，JS 一行不用改。

### B5-6 完成通知不该躺在「静音」里（1.2.67）

1.2.66 实测发现：进度和结果共用 `export` 一条渠道，而它必须是 LOW + 无角标（每秒约三次进度回推，
响一次的通知比没有通知更糟），代价是「导出完成」被归进抽屉的静音区 —— 人在 APP 外永远不知道文件
已经好了，而这一轮要解决的正是「离开 APP」。

- 渠道拆两条（`createChannel()` `ExportService.kt:259`）：`export` 仍是 LOW、无角标，只给进度条；
  新增 `export-result` 用 `IMPORTANCE_DEFAULT`，会横幅、会响，只给完成/失败/已取消。
- **结果通知还必须换 id**：4242 → 4243（`RESULT_NOTIFICATION_ID` `:171`）。Android 对一条已存在的
  通知保留它首次落地时的渠道，同 id 换渠道不会重新提醒，`setOnlyAlertOnce` 同理 —— 所以那条
  从任务开始就挂在 4242 上的通知，永远叫不醒人。
- 终止时改 `stopForeground(STOP_FOREGROUND_REMOVE)`（`:241`）：原来用 DETACH 是为了保住「导出完成」
  那一行，现在值得留下的那一行在结果渠道上；旁边再挂一条停在 100% 的「正在导出」是谎话。
- 实测：`id=4243 channel=export-result importance=3 flags=AUTO_CANCEL`，`export` 那条已从系统里消失，
  「导出完成」出现在抽屉顶部的提醒区而不是静音区（`r52-16-result-alert.png`）。

### B5-7 「回到 APP 能重新接上进度」是怎么成立的

不需要在启动时额外补一次 `syncExportFromNative()`：`DOMContentLoaded` 里的
`TDashcamNative.pageReady()`（`script.js:18352`）→ `MainActivity.onPageReady()` → `pushState()`
→ `window.__tdashcamNativeState()` → `syncExportFromNative()`（`:13717`）本来就是每个新页面都会走的
一条链，另一处调用在 `showPhoneExportModal()`（`:17421`）—— 打开面板前先看一眼有没有别人的任务。

- 实测：导出跑到 34% 时 `location.reload()` 换一个**全新 JS 上下文**，12 秒后探针里
  `window.__r52marker` 已消失（证明确实是新页面，不是被复用），而 `peJob.id` 已认成引擎的
  926875156、`pePercent=46`、胶囊 `export-pill show` 写着「导出中 46%」；任务随后在这个从未参与
  启动的页面上正常收尾，胶囊清掉、`delivered=true`。
- `delivered` 标志负责另一半：在口袋里跑完的那次导出，回 APP 时补一次 toast 与媒体扫描，且只补一次。

### 实测（emulator-5554，1.2.67，dpr 2.625，全部真点击 / 真按键）

- 关抽屉不杀任务：toast「导出继续在后台跑，进度看通知」+ 胶囊 0→41%。
- HOME 退后台：`dumpsys activity service` 显示 `isForeground=true foregroundId=4242 types=0x1`、
  `actions=1`；一次 post + 45 次 update，通知不刷屏。
- 抽屉里进度实时：「正在导出 · 91%」带 determinate 进度条（`r52-05-shade-progress.png`），
  状态栏有导出图标（`r52-04-shade-progress.png`）。
- **灭屏存活**：`mWakefulness=Asleep`、`PARTIAL_WAKE_LOCK 'tessera:export'` 处于持有状态，期间任务
  跑完并落盘 4,930,427 字节 —— 这是本轮真正要证明的那件事。
- 双向旋转任务不掉；通知里的 取消（先点行尾展开箭头 (965,1420) 才出现动作按钮）→「导出已取消」+
  胶囊清掉 + toast；APP 内的 取消 同样有效。
- 授权弹窗出现在任务已经开始之后（`r52-06-notif-prompt.png`）；拒绝一次即记住
  （`notifAsked=1`、系统侧 `USER_SET`），摘要补「通知被关了，进度只能在 APP 里看」。
- 本轮 1.2.67 复测：1 路 · 720x1600 · 60s · 1801 帧 · `c2.android.avc.encoder`，产出
  `Download/Tessera_2026-10-08_09-00-00_1c_720x1600.mp4` 4,974,824 字节。
- 复位：主题 `auto`、语言中文、`always_finish_activities 0`、`user_rotation 0` +
  `accelerometer_rotation 1`、抽屉与面板关闭。

### 交付

- `TDashcamStudio/Tessera-1.2.67-android-universal.apk` —— 27,785,227 字节，md5
  `e601855ce799b8d8dc668385eafc3964`，与设备上 `base.apk` 逐字节一致，`versionName=1.2.67`。
  根目录 1.0.1 … **1.2.65** 的旧包一个没删没挪。
- **1.2.66 没有单独交付**：它只是本轮中间的一次重打包（只含 B5-4 的胶囊几何），产物被 1.2.67 覆盖，
  内容已完整包含在 1.2.67 里。以后每轮改完立刻落包，不再攒到轮末。
- 全部改动仍未提交（clone 没有 git 凭据）。
- 下一轮按说好的顺序：**B6** 增强对比度 / 减少透明度走原生桥。导出水印仍在等你给文案、位置、透明度。

## 第五十三轮（1.2.68 → 1.2.71）：系统「高对比度 / 降低透明度」走原生桥（B6）

### B6-1 先证明 media query 这条路是死的

安卓设置里有两个开关：「高对比度文本」和「降低透明度」，iOS 上是 "Increase Contrast" /
"Reduce Transparency" —— 同一个诉求，所以两侧应该共用一套 CSS。自然的钩子显然是
`prefers-contrast: more` 与 `prefers-reduced-transparency: reduce`，但在这台 API 36 的 WebView 上，
两个开关都打开、页面全新加载，`matchMedia(...).matches` 仍实测 `false`（探针
`devtools/r53-b6.mjs` 的 `mediaContrast` / `mediaTransparency` 两列）。也就是说媒体查询在安卓上是
死代码，写进去只会得到一个「看起来实现了、实际从来没生效过」的功能。

所以桥是三层：Kotlin 读设置 → 状态推下来 → JS 打类 → CSS 只认类。

### B6-2 Kotlin 侧：读原始 Settings 行，而不是 AccessibilityManager 的结论

- 两个键：`accessibility_high_text_contrast_enabled` 在 **Settings.Secure**，
  `transparency_level_effects_disabled` 在 **Settings.Global**（`MainActivity.kt:71-72`）。
- **先读行、再或上 accessor**（`highTextContrastEnabled()` `:848`）。这里踩到一次实测分歧：开关打开时
  `Settings.Secure` 那行是 `1`，而 `AccessibilityManager.isHighContrastTextEnabled` 在 API 36 上返回
  `false`。1.2.68 只信 accessor，探针就报 `hc:false`。accessor 多出来的那层判定（是否真的进入了
  high-contrast 特征）不该成为我们的下限，所以 `readSecureFlag()` 命中即真，SDK ≥ 34 时再或上 accessor
  —— 任一为真即算开，取的是「用户表达了这个意图」而不是「系统是否已经改了绘制」。
- 开关在 APP 打开期间会被人从设置里拨动，唯一的通知就是 `ContentObserver`
  （`accessibilityObserver` `:95`，`:129`/`:132` 注册、`:216` 注销）→ `scheduleStatePush()`（`:878`）。
  另外窗口重新获得焦点时也补推一次（`:201`），覆盖「在分屏/通知里改的」这类观察不到的路径。
- `stateJson()`（`:834-835`）于是多了两个布尔字段 `high_contrast` / `reduce_transparency`，和原来
  `manage/legacy/sdk/night/version/device/android` 一起走同一条推送。

### B6-3 JS 侧：类是机制，媒体查询降级为兜底

`prefersHighContrast()` / `prefersReducedTransparency()`（`script.js:811` / `:817`）先看
`readNativeStorageStatus()` 里有没有这两个布尔，有就只用它；没有（桌面浏览器）才回落
`matchMedia`。**桌面行为按构造保持不变**：触发条件相同、规则相同，只是判据换了来源。

- 拆两个类（`markAccessibilityPrefs()` `:833`）：`solid-material` = 两个开关任一（都要「别让我透过面板
  看见背后的画面」），`high-contrast` = 只有对比度开关（还要把弱化文字提亮、分隔线加粗）。写成类的并集
  而不是把那份 15 条选择器清单复制两遍。
- 类和夜间模式同理，必须类驱动：开关会在运行中变，而唯一的信号是 shell 的推送；所以还是挂上了
  `matchMedia(...).addEventListener('change', markAccessibilityPrefs)`（`:841-850`）—— 桌面上查询会
  命中并触发，安卓上这两个 listener 永远不响，靠推送。缺了这半边，桌面浏览器改开关要重启才生效。
- 推送入口在 `window.__tdashcamNativeState`（`:13765`）里，紧跟 `applyTheme()` 之后，因此每次
  `pageReady` / `resume` / `ContentObserver` 都会重算。诊断页（`:13074`）直接显示
  `highContrast=… reduceTransparency=…`，验收时不用猜。

### B6-4 CSS 侧：几乎全是 token 改指，外加一份「别为看不见的模糊付费」

所有浮动表面本来就从 `--glass-bg*` / `--modal-panel` 取色，所以把它们在
`html.solid-material` 下重指成不透明值（`:8669` 亮色 / `:8682` 暗色），translucency 就整块消失了，
不需要碰任何布局规则。剩下的是两类必须点名写的：

- **模糊必须显式关**（`:8692-8712`）：不透明填充后面的 blur 看不见，但 GPU 照样在算。清单是手写展开的
  而不是 `:is()` —— 这份样式表观察到的引擎下限是 Chromium 108 前后的 OEM WebView，这里掉一条规则是
  「看不见的浪费」，不是看得见的破图，所以宁可啰嗦。
- **`--cta-fill` 从渐变改平色**（`:8677`）：CTA 上的字是白的，`#667eea` 端点只有 3.9:1；改成单个
  `--accent-solid` 后按钮每个像素都是 5.9:1。对比度开关要的正是这个，渐变的装饰性让给它。

两处坑，都是「token 改指够不着」造成的：

- `.empty-hero`（找片页那张卡）的模糊来自手机 `@supports` 块里的 `.player-area.empty .empty-hero`
  （0,2,0），压过这里的 `html.solid-material .empty-hero`（0,1,1）。fill 已经变不透明了，blur 还在跑
  —— 全靠全文档审计里 `stillBlurring` 那一项非空才发现。修法是把同一个复合选择器在这里也写一遍
  （`:8709`）。
- `#cancelClipBtn`（剪辑面板的「取消」）是唯一不从 glass token 取色的表面，token 改指天然够不着，
  而且它是 id 优先级（1,0,0）。给它按主题各写一条不透明值（`:8737-8752`）：这两个值是原来的半透明填充
  在各自主题面板上合成出来的颜色 —— 就是这条开关要求「别再透明」的那个灰，去掉透明。hover 同样各写一条。

### B6-5 一次让整个 APP 变白屏的 TDZ（1.2.68 / 1.2.69 都中了）

`markAccessibilityPrefs()` 最初放在顶层 `markSheetMode()` 旁边（当时的 974 行），因为它「越早越好，
首帧之前就得有类，否则半透明面板会闪一帧」。这个想法是对的，位置是错的：

`markAccessibilityPrefs()` → `readNativeStorageStatus()` → `pullNativeStatus()` →
`let nativeStatusPull`（**1335 行**）—— `let` 在暂时性死区里，顶层调用抛 `ReferenceError`，
而 script.js 是 `<script src="script.js">`（index.html:976）的普通脚本，**顶层抛异常 = 整份脚本中止**：
`DOMContentLoaded` 的监听器根本没注册，于是 `window.viewer` 为 undefined、卡片 0 张、`phone-boot`
遮罩永远不消失。更糟的是 E23 的错误横幅本身也是顶层接线，所以现场是「APP 静静躺在启动遮罩后面，
一声不吭」。探针当时报的 `hc/rt` 全都读不到，我把那两次当成了干净的基线。

修法是**把调用挪到顶层末尾**（现 `:18400`，紧挨 `DOMContentLoaded` 监听之前）：仍在解析阶段执行，
仍在首帧之前，但被它依赖的 `let` 已经初始化。验收探针从此必带一列 `alive = typeof window.viewer`
—— 只测开关状态测不出「APP 是死的」。

### 实测（emulator-5554，1.2.71，dpr 2.625，真实重启 + 真实 `settings put`，全部看 computed style + 截图）

| 状态 | 关键读数 |
| --- | --- |
| 两开关都关（基线） | `cls:"touch-ui sheet-mode"`，栏 `rgba(255,255,255,0.88)` + `blur(22px) saturate(1.8)`，media 两列都 false |
| 只开对比度（运行中拨，不重载） | `cls:"touch-ui sheet-mode high-contrast solid-material"`；栏 `rgb(255,255,255)` / blur `none` / 边框 `rgba(0,0,0,0.38)`；元数据面板 `rgb(12,12,16)`；wordmark 文字填充 `rgb(28,30,33)`；`stillBlurring:[]`；7 张卡片照常 |
| 只开透明度 | `cls:"touch-ui sheet-mode solid-material"`（**没有** `high-contrast`）—— 两个开关的分工成立 |
| 暗色 + 两个都开 | `--text-secondary #dfe1e6`、`--border-primary #6b6e73`、`--glass-edge rgba(255,255,255,0.45)`、`--modal-panel #1a1c23`、栏 `rgb(30,32,40)` |
| 横屏 + 两个都开 | 类在旋转后仍在，`sheet-mode` 正确缺席 |
| 全文档审计 | `blurCount: 0`；`.modal-content` `rgb(26,28,35)` / blur none / 边框 `rgba(255,255,255,0.3)` |
| 拨回关闭 | 类与半透明实时恢复，无需重启 |

截图：`devtools/r53-off-light.png`、`r53-on-light-portrait.png`、`r53-on-dark-portrait.png`、
`r53-on-dark-landscape.png`。复位：两个开关都归 0、主题 `auto`、`accelerometer_rotation 1`。

### 交付

- `TDashcamStudio/Tessera-1.2.71-android-universal.apk` —— 27,787,659 字节，md5
  `c3869b9e28f4c43022d1e6a7537a4eb9`，`versionName=1.2.71`，已装 emulator-5554。
- 中间包一律留着不删不挪：**1.2.68**（对比度读不到，只信 accessor）、**1.2.69**（TDZ，APP 是死的）、
  **1.2.70**（能用，但 `.empty-hero` 与 `#cancelClipBtn` 还带模糊 / 仍半透明）。这轮学到「改完立刻落包」，
  所以四个包都在根目录，旧轮次的 1.0.1 … 1.2.67 一个没动。
- 全部改动仍未提交（clone 没有 git 凭据）。
- 按说好的顺序，**B1 → B5 → B6 三件都做完了**。导出水印仍在等你给文案、位置、透明度；iOS 差距清单见下一节。

## 第五十四轮（1.2.72）：iOS 差距清单里「在安卓侧就能改完」的三条

上一节的差距清单里，有三条不用等 iOS 工程开工就能改完，改的目的是让 iOS 那一版**不用重新决定一遍**：
存盘目录从哪儿来、原生桥怎么调、"能不能写文件"按什么判断。三条都只做机制收敛，不改任何可见行为。

### R54-1 存盘目录不再硬编码

之前 JS 里 `const ANDROID_DOWNLOAD_DIR = '/storage/emulated/0/Download'` 被四处写文件直接拼路径用。
现在 `MainActivity.downloadDir()`（`MainActivity.kt:258`）向框架要 ——
`Environment.getExternalStoragePublicDirectory(DIRECTORY_DOWNLOADS)`，`mkdirs()` 后确认是目录才返回，
否则返回空串 —— 再随状态 JSON 以 `export_dir` 字段推下来（`MainActivity.kt:853`）。页面侧
`androidDownloadDir()`（`script.js:1115`）读它，只有拿不到（非字符串或不以 `/` 开头）时才退回那个常量。

为什么是"推下来的字段"而不是"一个同步方法"：`appFilesDir()` 那种一次 mkdir + 一次 stat 可以同步答，
但下载目录属于**每次写之前都该是新的**东西（用户改了默认目录、多用户、挂载点不同），而状态推送本来就有
固定通道、每次回前台都重推。iOS 侧对应的是 `FileManager.default.url(for: .downloadsDirectory, …)`，
同样是问一次缓存住，所以这个形状可以照搬。

### R54-2 原生桥的 void 半边收成一个门面

`nativeFire(name, ...args)`（`script.js:818`）把原来 14 处手写的「先判平台、再判方法存在、再 try」收成一处：
`hasNativeBridge()` + `typeof bridge[name] === 'function'` + try，**返回布尔**。需要走兜底的调用方读这个返回值
（`openExternalUrl` 回退到 `window.open`、缩略图回退到 `<video>` 抽帧），其余调用方忽略它。

收拢的理由是 iOS：`TDashcamNative` 里 26 个 `@JavascriptInterface` 有 17 个是命令而不是查询，
而 `WKScriptMessageHandler` 的 message-send 拿不到同步返回值 —— 那 17 个在 iOS 上**必须**全部改成发一条消息。
今天 dispatch 方式和以前一模一样（同步、忽略返回），但将来要改的只有这一个函数体，15 个调用点一行不动。
`nativeMethod(name)` 是有返回值那一半的同款门面，`openExternalUrl` 与缩略图已经用它。

剩下 1 个命令还留着自己的 guard：`deletePaths`（要等 `__tdashcamDeleteResult` 结果钩子）。
~~`setScreenBrightness`（在亮度曲线里连发）~~ —— **R67 收掉了**：它改名 `setScreenBoost`、走
`nativeFire()`，因为现在交出去的是一个不需要回话的比例，绝对值由原生自己算。

### R54-3 判据从平台换成 shell / 桥能力

三档谓词，从窄到宽：`isAndroidRuntime()`（安卓存储模型）→ `isTouchShellRuntime()`（任何手机/平板壳）
→ `hasNativeBridge()` / `nativeMethod()` / `nativeFire()`（壳确实应答这个调用）。

- `isAndroidRuntime()` 的调用点从 12 处降到 7 处，剩下的 7 处全是存储模型本身：`getStorageStatus`、
  `nativeAppFilesDir`、`getStorageVolumes`、U盘帮助文案、浏览路径失效判断、`setupVolumeWatcher`、权限横幅。
- 四处写文件（抓帧 `script.js:13030` 一带、CSV `:11725`、下载视频 `:15924`、webm 导出 `:18141`）的判据改成
  `isTouchShellRuntime()` + `androidDownloadDir()`：真正的理由是"这个壳没有存盘对话框"，而这不是安卓的专利。
- 文件名前缀 `MOBILE_FILE_PREFIX`（`:1123`）同样按壳判，桌面保持 `TDashcam_`，手机端出 `Tessera_`。

## 实测（1.2.72，emulator-5554 真点击）

机制层用记录器：把 `window.TDashcamNative` **整体**换成同名记录器，断言每条 `name(args)`，再换回去。

| 项 | 结果 |
| --- | --- |
| `export_dir` 推送 | `exportDirField:"/storage/emulated/0/Download"`，`androidDownloadDir()` 同值 |
| 15 个路由点 | `calls` 13 条（`scanMediaFile(/sdcard/x.mp4)`、`requestThumb(id1,/a/b.mp4,1200,160)`、`setFullscreen` 一开一关 …），`threw:[]` |
| 门面契约 | 未知方法 `nativeFire('definitelyNotAmethod')` → `false`；桥为 null 时 `nativeFire('setKeepScreenOn',true)` 与 `openExternalUrl()` 都 → `false`（走兜底） |
| 记录器换完还原 | `bridgeRestored:true` |

记录器证明不了"设备真的动了"，所以这几条用真点击 + 设备侧读数：

| 项 | 真点击 | 设备侧证据 |
| --- | --- | --- |
| 抓帧 | ⋮ → 抓帧 | `Tessera_2026-10-08_07-30-59_front.jpg`，169,502 字节，toast 里是推下来的目录 |
| 下载视频 | ⋮ → 下载视频 | `2026-09-29_12-30-00-front.mp4`，248,605 字节 = 源文件同尺寸 |
| BACK / 层栈 | 片段 tab 开抽屉 → `keyevent 4` | 抽屉关、APP 仍在前台；再按一次（0 层）焦点交给 launcher —— 说明 `setBackLayers` 的数字真的被原生用了 |
| 播放常亮 | 点卡片播放 → 暂停 | 播放后窗口 `fl=KEEP_SCREEN_ON …`，暂停后该行里不再有它 |
| 系统栏着色 | ⋮ → 深色 / 跟随系统 | 深色：状态栏图标变白；跟随系统（系统是浅色）：图标变深。截图 `devtools/r54-dark-real-crop.png`、`r54-light-real-crop.png` |
| 导出 + 取消 | ✂ → 确认 → 开始导出 → 取消 | `peJob.id=936444705`，`outPath=/storage/emulated/0/Download/Tessera_2026-10-08_07-30-59_1c_1104x720.mp4`；取消后 `exportStatus()` 报 `phase:"cancelled"`、`running:false`、252 帧 |

一处**不可达**：CSV 导出的写盘分支。当前语料 `/storage/emulated/0/TeslaCam` 只有 2 个 `event.json`、
没有分段遥测，`allMetadata.length === 0` 在写之前就短路返回「没有可导出的元数据」，所以那句
「壳没有存盘对话框」的分支本轮没被真点击覆盖到（代码路径与抓帧同形：`joinPath(androidDownloadDir(), name)`
+ `__TAURI__.fs.writeTextFile`）。

### 本轮新增的仪器课

- 探针打印了 JSON 却没退出：CDP 的 `WebSocket` 没 `ws.close()`，node 一直挂着，看起来像卡死。
- `timeout N env CDP_TIMEOUT_MS=… node x.mjs` 或 `> file` 形式会**丢掉 stdout**；用普通的
  `CDP_TIMEOUT_MS=60000 node devtools/x.mjs`（要留档就 `| tee`）。
- 冷启动后 25 秒内 `document.readyState` 还是 `"loading"`，此时任何页面函数都报 "is not defined"，
  这是探针读太早，不是 APP 死了。
- 注入的 Java 桥**方法属性就地包不住**：`b.setBackLayers = fn` 之后 `String(b.setBackLayers)` 仍是
  `function () { [native code] }`（descriptor 显示 writable:true，但赋值不生效）。要观察 dispatch只能整体换掉
  `window.TDashcamNative`。本轮先按"就地 hook"写的 `r54-layers.mjs arm` 因此一直读到空数组，
  误判成"没派发"。
- 屏幕熄灭 / 锁屏时所有 `input tap` 都静默落空（截图全黑）：`input keyevent KEYCODE_WAKEUP` +
  `wm dismiss-keyguard`，再信点击。
- 主机 load 到 ~15 时，ANR 是成串的（SystemUI、com.android.phone、本 APP 轮流），且"System UI isn't
  responding"弹窗会吃掉全部输入；`mCurrentFocus` 先看一眼再信任何"点了没反应"。
  关掉它要点"Wait"，点错行会把 APP 直接关掉。
- 只用 JS `applyTheme(true)` 翻主题去截图会读到假象（⋮ 面板还压在上面，头部看着是浅的）；
  要判"看起来对不对"就真点一次分段控件，再看 `getComputedStyle` 与实际像素。

### 交付

- `TDashcamStudio/Tessera-1.2.72-android-universal.apk` —— 27,788,107 字节，md5
  `3c385a8819f548b34e0254c72a29222b`，`versionName=1.2.72`，与构建产物逐字节相同，已装 emulator-5554。
- 上一轮的中间包 1.2.68 / 1.2.69 / 1.2.70 与更早的 1.0.1 … 1.2.67 全部原样留在根目录，没删没挪。
- 全部改动仍未提交（clone 没有 git 凭据）。
- iOS 那一版剩下的活：9 个同步返回值方法要逐个包成 async adapter、`/storage/emulated/0` 的浏览路径兜底、
  `--kb-h` 在 iOS 上的对应实现、`navigator.vibrate` 在 WKWebView 里不可用（`haptic()` 得整条走桥）、
  以及没有真层栈（`setBackLayers` 在 iOS 上对应的是 dismiss 手势，得另想）。导出水印仍在等文案、位置、透明度。

## 第五十五轮（1.2.73 → 1.2.74）：搜索框常驻抽屉顶部，顺带挖出「点取消没反应」

> **子节顺序已被第五十六轮推翻**：`.sidebar` 的第一个子元素改回 `.sidebar-header`（导航栏），
> 搜索框排在它下面成为第 2 行。下面凡写「搜索框是第一个元素 / 标题栏 `y=112`」的实测数字都是
> 1.2.74 的旧栅格，1.2.75 的真导航栏栅格见第五十六轮。「点取消没反应」那条修法**仍然有效**，
> R56 已回归复测。

需求原话：「抽屉里面的搜索框，夹在中间位置的，点一下就跑到抽屉顶部，感觉有点割裂呢，能不能就直接放到顶部？」

### 为什么之前"夹在中间"

1.2.72 之前，搜索框住在 `#quickFilters` 里，实测位置是 `y=166`（标题栏 106 + 筛选行 60 之后），
所以它天然就在抽屉中段。R49-5 为了照搬 iOS「搜索栏在导航栏内展开」，把它用
`transform: translateY(var(--nav-shift))` 抬到状态栏下面，同时隐藏「特写」字标、
用 `margin-bottom: calc(-1 * var(--field-h))` 塌掉它原来的槽位。抬升本身又要按设备测量：
R50 为此补了两轮（塌完再量、旋转后重测）。**"点一下就跳"不是动画没做好，是这个方案本身的形状。**

### 改成常驻顶部（方案 A）

`.event-search-row` 从 `#quickFilters` 里搬出来，成为 `.sidebar` 的第一个子元素
（`index.html:27`），状态栏 inset 也跟着从 `.sidebar-header` 挪到这一行（`styles.css:5139`），
标题、筛选、日期 chips 依次排在它下面。聚焦时**只切状态不改位置**：
`setSearchMode(on)`（`script.js:11010`）现在只加/删 `.sidebar` 上的 `search-mode` 类，
`setNavShift()` / `measureNavShift()` / `refreshNavShift()` 与 `nav-search` 类整套删掉，
`handleResize` 里也不再重测 —— 全仓 `nav-shift` 只剩一句注释。

对 iOS 那一版：少一处"必须按设备测量"的偏移，抽屉栅格回到纯 CSS；`--kb-h` 那条仍然要在 WKWebView 上另实现。

iOS 依据：App Store 各 tab、Podcasts、备忘录都是把搜索框钉在面板顶部，聚焦时输入框不移动，
只有右侧「取消」淡入 —— 也就是这一版的做法（`html.touch-ui .sidebar.search-mode .search-cancel-btn`，
`styles.css:5209`，最小 40×40）。桌面侧不受影响：`.event-search-row` 基础态是 `display:none`
（`styles.css:562`），只在手机档媒体查询里 `display:flex`（`styles.css:4077`），新规则一律带 `html.touch-ui`。

### R55-2 「点取消没反应」

真点击 取消 时值不清空、筛选不还原，但 CDP 里 `btn.click()` 一切正常 —— 说明处理函数没被派发。
把事件逐条打时间戳与命中元素后：

| 阶段 | 目标 | 按钮矩形 |
| --- | --- | --- |
| pointerdown / touchstart / pointerup / touchend / mousedown | `BUTTON.search-cancel-btn` @282,82 | `[265,62 33x40]` |
| blur（mousedown 的默认动作把焦点从输入框移走） | — | — |
| mouseup | `DIV.event-search-row` @281,81 | `[0,0 0x0]` `display:none` |
| click | `DIV.event-search-row` | — |

`search-mode` 一掉，CSS 就把 取消 `display:none`；浏览器的合成 `mouseup` 落在原地，但那里已经没有按钮了，
于是 `click` 的目标退化成 mousedown/mouseup 的公共祖先（那一行），按钮上的监听器永远收不到。
修法是按住手势期间不让焦点跑掉：`mousedown` 上 `preventDefault()`（`script.js:10322`），
收起动作交回 取消 自己的 `click` 处理函数 —— 和 iOS 一样，字段在真正按下 Cancel 之前都留在编辑态。
没有用 `setTimeout` 延后去类（要猜一个"够快又够慢"的毫秒数），也没有改听 `pointerup`
（那样一个起点落在按钮上的滑动会误触发）。

## 实测（1.2.74，emulator-5554 真点击 + 真键盘）

| 项 | 结果 |
| --- | --- |
| 静止栅格（竖屏 412×915） | `.event-search-row` 是 `.sidebar` 第一个子元素，`y=0 h=112`；标题栏 `y=112`、筛选 `y=166`、chips `y=226`、列表 `y=278 h=556`、底部 `y=834` |
| 真点输入框 | `sidebarCls` 得到 `search-mode`；行矩形**逐字节不变**（`y=0 h=112 x=0 w=311`）、`transform:none`；`.header-title` 计算值仍是 `visible`；`#searchCancelBtn` `display:block` `41x40`；`activeElement=eventSearch` |
| 键盘弹起后 | `--kb-native-h:336.4px`，行仍 `y=0 h=112`，列表 `y=278` 没被顶走 |
| 真键盘输入 `07-30` | `query:"07-30"`，卡片 `7 → 1` |
| 真点 取消 | `val:""`、`cards:7`、`search-mode` 掉、`--kb-h` 归零（连测 3 次一致） |
| 横屏 915×412 | 行仍是第一个元素 `y=0 h=82`；chips 按漏斗隐藏；`sidebar` `scrollWidth==clientWidth==311`；取消同样真点击生效 |
| 视觉复核 | `devtools/shot-r55-01-rest.png`（CDP 层）、`shot-r55-03-screencap.png`（真机整屏，含键盘）：搜索框在最上，下面依次是 特写 / 选择日期+所有类型 / 日期 chips / 结果卡片 |

一处**假象**：`cdp-shot.mjs` 在键盘弹起时截出来的图纵向被压扁、行序看着像乱了，
`adb exec-out screencap` 的整屏截图与 DOM 探针都证明实际栅格是对的 —— 键盘弹起时别只信 CDP 截图。

### 交付

- `TDashcamStudio/Tessera-1.2.73-android-universal.apk` —— 27,786,763 字节，md5
  `1e376efa4a3905ddc633fe99600edf5a`（只搬顶部，仍带"点取消没反应"）。
- `TDashcamStudio/Tessera-1.2.74-android-universal.apk` —— 27,786,955 字节，md5
  `c9ebd836a2d4ca1af6af11ad90aa4559`，`versionName=1.2.74`，含本轮两条，已装 emulator-5554。
- 更早的 1.0.1 … 1.2.72 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。

## 第五十六轮（1.2.74 → 1.2.75）：抽屉顶部合成一条真导航栏，☰ 换成「完成」

> **右上角那一列已被第五十七轮推翻**：R56 让「完成」待在导航栏、「取消」留在搜索行，
> 于是同一个角上上下下排着两个紫色文字。现在两个动作共用导航栏的**一个尾槽**，
> 聚焦时原地换成「取消」，搜索框独占第 2 行整行宽度。下面「`#searchCancelBtn` 41x40 在搜索行旁」
> 一类的数字是 1.2.75 的旧排版；导航栏本身（第一行标题、渐变与分隔线撤掉、☰ 隐藏、横屏 4px 还高）不变。

需求原话：「抽屉的UI依然割裂，汉堡菜单夹在中间了，不好看。」（附真机小米 14 截图）

### 为什么还是割裂

R55 把搜索框搬到抽屉最上面之后，`.sidebar` 的固定区变成**两块上下叠着的矩形**：

1. `.sidebar-header` 仍然带着桌面端的东西 —— `linear-gradient` 底色 + 一条 `border-bottom` 分隔线，
   在手机抽屉里读起来像第二条状态栏；
2. 这一行右侧的按钮仍然是桌面的 ☰（`#toggleSidebarBtn`）。语义也是错的：抽屉已经开着，
   右上角却放一个"打开侧边栏"的图标，用户点它不知道会发生什么，而它实际做的是"收起"。

结论：顶部只能是**一条**导航栏，而不是"标题条 + 搜索条"两段。

### 改动清单（方案：合成一条真导航栏 + 完成）

- `index.html:22-48`：`.sidebar-header` 恢复为 `.sidebar` 第一个子元素，`.event-search-row` 排第二；
  新增 `<button id="drawerDoneBtn" class="drawer-done-btn">完成</button>`（标题栏内、漏斗与 ☰ 之后）。
- `styles.css:574`：`.drawer-done-btn { display: none; }` 基础态 —— 桌面端一个像素都看不到。
- `styles.css:5144-5197`（手机档）：状态栏 inset 交还给标题栏（`padding-top: calc(8px + var(--safe-top))`），
  搜索行改成 `padding-top: 0`；`html.touch-ui .sidebar-header { background: transparent; border-bottom: 0; }`
  撤掉桌面渐变与分隔线，`html.touch-ui .sidebar-header .toggle-sidebar-btn { display: none; }` 撤掉 ☰，
  `html.touch-ui .sidebar-header .drawer-done-btn { display: block; min-width/min-height: 40px; color: var(--accent); }`。
- `styles.css:5428`（横屏档）：`完成` 是 40px 目标，比原来 34px 的 ☰ 高 6px，用
  `padding-top: calc(4px + var(--safe-top)); padding-bottom: 4px` 把差还回去，
  列表高度 226px，仍在 R50 定的 229px 预算内（净 −3px）。
- `script.js:10129` / `:10349-10357`：`drawerDoneBtn` 进 dom 映射，`click` 走 `haptic('light')` +
  `toggleSidebar(false)`。收起路径一共四条（遮罩点击、右滑返回、系统返回、底部「列表」tab），
  这条只是把"明确的可点元素"补上；`toggleSidebar` 仍是 `.collapsed` 的唯一写者。
- `script.js:347` / `:698` / `:14002`：`drawerDone: "Done"` / `"完成"`，切语言时同步 `textContent`。

桌面侧零风险：所有可见改动都带 `html.touch-ui`（只有 `markTouchUi()` 在 `isTouchShellRuntime()` 时才加），
手机档媒体查询本身也会命中窄桌面窗口和平板，所以不用它做门。

iOS 依据：UINavigationBar + `navigationItem.searchController` 的组合就是"第一行标题 + 右上按钮，
第二行搜索栏"，同一块底、中间没有分隔线；模态面板右上角用「完成」而不是 hamburger（UIKit 的
`UIBarButtonSystemItemDone`）。R55 那套"搜索框聚焦不移动、只淡入取消"保持不变。

## 实测（1.2.75，emulator-5554 真点击，竖/横 × 亮/暗）

| 项 | 结果 |
| --- | --- |
| 静止栅格（竖屏 412×915，浅色） | `.sidebar-header` 第一个子元素 `y=0 h=108`（padTop 60 = 8 + safeTop 52）；搜索行 `y=108 h=52`；筛选 `y=160 h=60`；chips `y=220 h=52`；列表 `y=272 h=562`；底部 `y=834 h=81` |
| 导航栏外观 | `background-image: none`、`border-bottom-width: 0px`，底色与抽屉同（`rgb(242,242,247)` 系）；`sidebar` `scrollWidth==clientWidth==311` |
| ☰ / 完成 | `#toggleSidebarBtn` `display:none`；`#drawerDoneBtn` `display:block` `41×40 @256,60`（右边缘 297），文字色 `rgb(91,75,240)`，漏斗 `30×30` 在它左边 |
| 真点输入框 | `sidebarCls` 得到 `search-mode`，标题栏与搜索行矩形**逐字节不变**，`transform:none`；`#searchCancelBtn` `display:block 41×40`；`activeElement=eventSearch`（R55 的回归：取消真点击后 `val:""`、卡片回到 7） |
| 真点 完成 | `sidebar` 得到 `collapsed`、`overlayActive:false`、抽屉 `right:0`（滑出）；再点底部 `#tabListBtn` 重新开：`sidebar`、`overlayActive:true`、`right:312` |
| 横屏 915×412 | 标题栏 `y=0 h=56`（padTop 32.2 = 4 + 28.2，padBottom 4）；搜索行 `y=56 h=46`；列表 `y=113 h=226`（预算 229，−3px）；漏斗 `30×30 @224..254`、完成 `41×40 @260..301` |
| 深色模式 | 几何与浅色逐条一致；`完成` 文字 `rgb(185,174,255)` 对抽屉底 `rgb(36,37,38)` 对比度 **7.72:1**（AA/AAA 均过） |
| 语言切换 | 完成 ↔ Done 随 `applyLanguage` 同步，按钮宽度不变 |
| 视觉复核 | `devtools/shot-r56-01-portrait.png`、`shot-r56-03-landscape.png`、`shot-r56-05-portrait-dark.png`（`adb exec-out screencap`，整屏） |

两处工具事实：`cdp-eval.mjs` 之类的 node 探针里 `$ADB` 必须是 **Windows 形式**路径
（`C:/Users/.../adb.exe`），给 MSYS 形式会 `spawnSync ... ENOENT`；`powershell -File devtools/shot.ps1`
被执行策略拦了（UnauthorizedAccess），改用 `adb exec-out screencap -p > out.png`。

### 交付

- `TDashcamStudio/Tessera-1.2.75-android-universal.apk` —— 27,786,955 字节，md5
  `18a85136053dc52b9094cd79561cf67d`，`versionName=1.2.75`，含本轮改动，已装 emulator-5554。
- 1.0.1 … 1.2.74 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。

## 第五十七轮（1.2.75 → 1.2.76）：右上角只留一个尾槽，「完成」↔「取消」二选一

需求原话：「抽屉的内容，右上角是否有必要"完成"和"取消"，导致排版不好看。」（附真机小米 14 截图，
键盘弹起、搜索框聚焦，右上角「完成」与搜索行右侧「取消」上下排在一起）

### 为什么 R56 还是不好看

R56 只搬了「完成」进导航栏，没有动「取消」的家，于是：

1. 同一个角上、隔两行，出现**两个一模一样的紫色文字按钮**，看着像排版失误；
2. 更糟的是它们**不是同义词** —— 「完成」关抽屉，「取消」退出搜索，用户无法从外观猜出谁管谁；
3. 「取消」还占掉搜索行右侧 41px，输入框因此比下面每一行都短一截，右边缘对不齐。

iOS 的规矩是**一条导航栏只有一个 `rightBarButtonItem`**：`UISearchController` 在字段成为第一响应者时
把这一项换成「取消」，退出搜索再换回来（`UIBarButtonItemSystemItemCancel`），
清除输入靠框内的 `UITextFieldViewModeWhileEditing` ✕。也就是"两个动作共用一个位置，一次只出现一个"。

### 改动清单

- `index.html:42-47`：`#searchCancelBtn` 从 `.event-search-row` 搬进 `.sidebar-header`，排在
  `#drawerDoneBtn` 之后；搜索行现在只剩 `#eventSearch` 一个孩子。
- `styles.css:5183-5218`：两个按钮合并成**一组样式 + 两条状态规则**
  （`html.touch-ui .sidebar-header .drawer-done-btn, … .search-cancel-btn { display:none; … }`
  → 平时 `.drawer-done-btn { display:block }` → `html.touch-ui .sidebar.search-mode` 下互换）。
  特异度 (0,5,1) 压过 (0,3,1)，不需要 `!important`。
- `styles.css:5269-5273`：`html.touch-ui .event-search-row .event-search { flex:1 1 auto; min-width:0 }`
  —— 少了「取消」占位，输入框要显式撑开才会占满整行，否则退回 `size=20` 的固有宽度、右边留白。
- 删掉 R55 那条 `html.touch-ui .sidebar.search-mode .search-cancel-btn { … }`（按钮已经不在那一行）。
- `script.js`：三处注释跟着改（`:10319` 的 mousedown 防改投、`:10353` 的「完成」、`setSearchMode` 的文档块）。
  **处理函数一行没动**：`mousedown → preventDefault()`（R55 那条修法）在这里更是必需的 ——
  现在互换发生在**同一个槽位**上，手指按下 → blur → 「取消」变「完成」，
  合成的 `mouseup` 落点上的元素已经换人了，`click` 会改投 `.sidebar-header`。
- 框内 ✕ 没有自己造：`input[type=search]` 的原生清除装饰没被本仓 CSS 关掉
  （`appearance:auto`，实测有字时框内右侧出现蓝色 ✕），正好就是 iOS 的那个。

桌面侧照旧是构造性安全：`.search-cancel-btn` 与 `.drawer-done-btn` 基础态都是 `display:none`
（`styles.css:571/578`），`.event-search-row` 基础态 `display:none`，所有新规则带 `html.touch-ui`。

## 实测（1.2.76，emulator-5554 真点击，竖/横 × 亮/暗 × 中英）

| 项 | 结果 |
| --- | --- |
| 静止（竖屏 412×915 浅色） | 尾槽 `slot:["drawerDoneBtn:完成"]`，`#searchCancelBtn` `display:none`；标题栏 `y=0 h=108`、搜索行 `y=108 h=52`；**输入框 `x=14 w=283 right=297`（占满整行）**，「完成」`41×40 @256,60 right=297` —— 两者右边缘对齐 |
| 真点输入框 | `slot:["searchCancelBtn:取消"]`、「完成」`display:none`；「取消」矩形**与被换掉的「完成」逐字节相同**（`x=256 w=41 y=60 right=297`）；输入框 `x=14 y=108 w=283 h=44` 不变；`--kb-h:336.4px`、`activeElement=eventSearch` |
| 真键盘输入 `07-30` | `val:"07-30"`、卡片 `7 → 1`、尾槽仍是「取消」；`shot-r57-01-searching.png`（screencap）：右上角只剩一个紫色词，框内右侧是原生 ✕ |
| 真点 取消 | `val:""`、`cards:7`、`search-mode` 掉、`slot:["drawerDoneBtn:完成"]`、`--kb-h` 归零 |
| 焦点被别处拿走 | 聚焦后真点「选择日期」→ `search-mode:false`、尾槽回「完成」、`activeElement=dateFilter`（互换的两个触发点都走 `setSearchMode`） |
| 真点 完成 | `sidebar collapsed`、`right:0`、遮罩关 |
| 横屏 915×412 | 标题栏 `h=56`（padTop 32.2 / padBottom 4）、搜索行 `y=56 h=46`、输入框 `x=10 w=291 right=301`、「完成」`41×40 @260 right=301`、漏斗 `224..254`、列表 `y=113 h=226`（R50 预算 229）；聚焦后「取消」`@260 w=41 right=301` 与「完成」同槽；输入 `10-08` 后真点取消同样还原 |
| 深色（真点 ⋮ →「深色」） | 尾槽「取消」`rgb(185,174,255)` 对抽屉底 `rgb(36,37,38)` = **7.72:1**；几何与浅色逐条一致（`shot-r57-02-dark-searching.png`） |
| 英文 | `Done` / `Cancel` 两个标签都由 `applyLanguage` 同步；英文下尾槽 `38 → 56` 宽（两个词长度本就不同），它是行内最后一个 flex 项，所以只有它自己变宽，漏斗与标题不动 |
| 假象复核 | 键盘弹起时仍以 `adb exec-out screencap` 为准（`cdp-shot` 会纵向压扁） |

### 交付

- `TDashcamStudio/Tessera-1.2.76-android-universal.apk` —— 27,787,339 字节，md5
  `6227978cb42ab90504fee049b41e8146`，`versionName=1.2.76`，已装 emulator-5554。
- 1.0.1 … 1.2.75 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。

## 第五十八轮（1.2.76 → 1.2.77）：底部动作条去掉「播放」，四枚变三枚

需求原话：「底部菜单栏的"播放"按钮好像没有什么作用？"宫格切换"的按钮和播放器里面选择几路画面的
按钮功能重合？」—— 两句都成立，选定的处理方式是**删「播放」、留「视图」**。

### 「播放」是一个点不到的按钮

R51 给它写的那句注释是「其他 tab 把你从画面上带走，它是那个回来的地方」。问题是**这个回来动作
在物理上不可达**：

- `script.js` 里 `case 'play'` 唯一的分支是「抽屉没收起就收起」；
- 而 `styles.css:4700` `body:not(.sidebar-collapsed) .phone-action-bar { visibility:hidden;
  pointer-events:none }` —— 抽屉展开的整段时间里，整条栏既画不出来也点不到；
- ⋮ 面板那一侧更早：`setupPhoneActionBar` 的 switch 之前有一条通用分支，
  按任何非 `more` 的格子都先把它关掉，`case 'more'` 自己又会在开面板时收抽屉。

所以三个状态里只有「设置」的高亮是**看得见的**（面板展开时抽屉必然是收起的，栏还在），
「片段」的高亮只在 200ms 淡出里闪过一次，「播放」的高亮则是**它唯一的功能** —— 一个永远
当不了按钮的东西，退化成了一枚状态灯。

iOS 侧也没有给它的位置：`UITabBar` 的每一格要么切到一个你能看见、能点到的目的地，要么什么都不做
（HIG：tab bar items switch between the app's main screens；不放状态指示，也不放只在自己被选中时
才亮的格子）。这个 App 真正的根界面是播放器，而 R56/R57 已经把「片段」做成了从根界面
present 出来的 sheet（自带「完成」尾槽）、把 ⋮ 做成另一个层。**根界面不进底栏** —— 底栏因此是
toolbar（那枚玻璃胶囊本来也不是 tab bar 的高度与排布），里面每一格都得是个动作。

### 「视图」为什么留下

它和播放器里那行 `#viewSwitcher` 写的是同一份状态（`localStorage['tdashcam.layout']`，
`cyclePhoneLayout()` 还会调 `updateViewSwitcherUI()` 把那一行同步过去），这一点用户说得对。
但两者不是同一个东西：

- 那一行是**直选**，9 个格子（4 宫格 / 6 宫格 / 大小窗 + 6 个单机位），手机端只藏文字、按钮都在，
  横向还能滚；它在画面上方，横屏 412px 高度里是 40px 高的一排小目标。
- 底栏这一格是**拇指区的三态循环**，一次点到位、不用瞄准，标签直接写着当前是「4 宫格 / 6 宫格 /
  大小窗」，按下去还有 toast 报出新布局。

这是 iOS 上常见的「同一状态的两种入口」（Safari 的地址栏与分享面板都能改阅读器设置），
不是重复按钮：一个管精确、一个管够得着。全屏（`body.phone-fullscreen`）隐藏的是底栏不是控制行，
所以两者也从不互相抢位置。**代价**：底栏从此没有「你在哪儿」的灯，静止时三格全是暗的。

### 改动清单

- `index.html:799-802`：`#tabPlayBtn` 整块删除；上面那段「These are destinations, not verbs」
  的注释重写为「动作条，每一格都得开火」，并写清 R58 为什么走。
- `script.js`：`dom.tabPlayBtn` 引用、`case 'play'` 分支、`updateTabAriaLabels()` 的
  `tabPlayBtn: 'tabPlay'`、`syncTabSelection()` 的 `tabPlayBtn: !drawerOpen && !panelOpen`、
  i18n 中英两条 `tabPlay` 与 `applyLanguage` 键表里的 `'tabPlay'` —— 全部删掉，不留兼容分支。
  `syncTabSelection` 的文档块改成「两个层各点亮自己那格；两层都不在时不点亮任何格子」。
- CSS **一行没改**：`.tab-btn { flex:1 1 0 }`，三格自动分掉第四格腾出的宽度；
  胶囊是 `left:14px/right:14px` 定宽，不随格数变化。
- 桌面侧不受影响：底栏本身只在手机媒体查询里 `display:flex`。
- 顺带：iOS 差距清单 B 组第 1 条（`doc/ANDROID_CN.md:3878`）与第五十一轮标题各补一句，
  说明「播放」已被撤销。

### 顺手补的一处失同步（实测时撞出来的）

验收时真点播放器那行的「6 宫格」，`tdashcam.layout` 写成了 `grid`、`.view-btn.active` 也过去了，
**底栏那一格却还写着「4 宫格」**。原因是 `switchCamera()`（`script.js:11792`）只写存储、
不叫 `updateLayoutTabLabel()`；以前这个偏差会被「播放」那格的默认高亮盖过去（底栏总有一格是亮的，
没人盯标题），R58 之后**标题成了底栏唯一的布局读数**，它说假话就直接误导，所以补一行：

```js
if (isPhoneLayout()) {
    localStorage.setItem('tdashcam.layout', viewId);
    this.updateLayoutTabLabel();   // 新增：每个写这个键的人都要顺手重画标题
}
this.multiCameraPlayer.setLayout(viewId);
```

单机位（`setCamera` + `setLayout('single')`）**不写**这个键（`script.js:11899` 那条注释就是为此写的），
所以标题保持上一个宫格布局不变，这是对的：临时放大某一路不该改用户的偏好。

### 实测（1.2.77，emulator-5554 真点击）

装机包：`versionName=1.2.77`，`window.viewer` 在场（不是死 APP 假基线），`#jsErrorBanner` 无。

- **竖屏 412×915**：`#tabPlayBtn` 查无此元素（`playGone:true`），`#phoneActionBar .tab-btn` 数量 `3`，
  每格 `123px` 宽（胶囊 `clientWidth 383` − 左右内边距 `5+5` − 两条 `2px` 间隙 ÷ 3 = 123；
  同一栅格下四格时是 91.75px），`bar.scrollWidth == clientWidth == 383` → 没有横向溢出。
  `aria-label` 依次为 片段 / 视图 / 设置（中间那格的**无障碍名恒为「视图」**，可见文字才写布局名，
  所以 TalkBack 念的是这一格是什么，不是当前值）。
- **静止态**：抽屉收起、⋮ 面板关闭时 `onTabs:[]` —— 三格全暗，没有一格冒充「你在哪儿」。
  这就是删「播放」的代价，写在上面那节末尾。
- **⋮ 面板展开**：`#tabMoreBtn` `on:true`、`aria-current:"true"`，且此时 `barVis:"visible"`
  —— 三格里只有这一格的高亮是**看得见、且和它触发的层对得上**的。
- **视图三态循环**：`grid4 → grid → legacy`，每一跳底栏标题（「4 宫格 / 6 宫格 / 大小窗」）、
  `localStorage['tdashcam.layout']`、`#viewSwitcher .active` 三处同步；toast 报出新布局。
- **失同步修复复测**：真点播放器那行的「6 宫格」→ `layout=grid`、`.view-btn.active` 过去、
  **底栏标题也跟到「6 宫格」**（改前停在「4 宫格」）。再点单机位「前视」→
  `layout` 与标题都**保持 `grid` / 「6 宫格」不变**，符合「临时放大不该改偏好」。
- **横屏 915×412**：三格各 `291px`，`.tab-label` `display:none`（只剩图标），无溢出。
- **英文**：`Clips / 6-grid / Settings`，`aria-label` 为 `Clips / View / Settings`，
  三格仍各 123px、`scrollWidth==clientWidth==383` → 英文长词没撑破胶囊。
- **深色**：未点亮格文字 `rgb(236,234,244)` @ `opacity .62`，压在 `rgba(30,32,40,.84)` 上，
  合成后 ≈6:1；点亮的「设置」`rgb(185,174,255)` ≈8:1 —— 都过 AA。
- **⚠ 浅色未过 AA（本轮新暴露，未改，等定夺）**：同一格文字 `rgb(60,58,68)` @ `.62`，
  胶囊底 `rgba(255,255,255,.88)` + 玻璃层 `rgba(255,255,255,.78)` 压在页面底色 `rgb(240,242,245)` 上，
  按合成公式算出的字色约 `rgb(133,132,138)`，对比度 **≈3.6:1**（画面较暗时胶囊更不透，约 3.3:1），
  低于 11px 小字要求的 4.5:1。改前不明显（静止态总有一格是亮的），改后三格全暗就显出来了。
  把 `.tab-btn` 未点亮透明度从 `.62` 抬到 `.75` 可到 ≈5.2:1；深色侧 `.62` 本来就够，只动浅色。
  —— 这是视觉取舍，按惯例等用户定方式再改。
- 截图：`devtools/shot-r58-01-portrait.png`（竖屏三格）、`-02-landscape*.png`（横屏 + ⋮ 面板）、
  `-03-portrait-light.png`、`-04-light-panelopen.png`、`-05-dark-3tabs.png`（深色 + 面板 + 三格）、
  `-06-dark-en.png` / `-07-en-drawer.png`（英文；后者顺带拍到**抽屉展开时整条底栏消失**，
  即「播放」点不到的那条证据）。
- 设备已复位：主题「跟随系统」、中文、竖屏、`accelerometer_rotation=1`。

### 交付

- `TDashcamStudio/Tessera-1.2.77-android-universal.apk` —— 27,787,467 字节，
  md5 `5c6e28c9d6869a91108046b3e21d67fe`，已 `adb install -r` 装机复测（`versionName=1.2.77`）。
- 1.0.1 … 1.2.76 全部原样留在根目录（共 76 个包），没删没挪。全部改动仍未提交（clone 没有 git 凭据）。

## 第五十九轮（1.2.77 → 1.2.78）：底栏浅色过 AA、同步桥收进 async 门面、双击切相机

用户的话是「一起就改了」，所以这轮是三件攒在一起的事：R58 挂起的那条对比度、iOS 侧的
「值返回调用不能假设是同步的」、以及 B11 剩下的双击切路。

### 1. 底部动作条浅色对比度：`.62 → .75`，只动浅色

R58 那节末尾留的就是这一条。修法没有新增颜色，只把**未点亮格的透明度**从写死的一个数
变成一主题一个变量：

- `styles.css:4999`（`:root`，浅色）新增 `--tab-idle-opa: .75;`
- `styles.css:5013`（`body.dark-theme`）新增 `--tab-idle-opa: .62;`
- 手机媒体查询里的 `.tab-btn { opacity: var(--tab-idle-opa) }`（`styles.css:5877`）

深色侧**一个字节没动**：它本来就 ≈6:1，抬透明度只会让「未点亮」和「已点亮」糊在一起。
浅色从 ≈3.64:1 抬到 **≈5.18:1**（11px 小字要求 4.5:1）。

之所以用变量而不是 `body:not(.dark-theme) .tab-btn{...}`：这条栏在深色下还有一处
`html.solid-material` 的覆盖，规则一旦分主题写两遍，下一轮改的人只会看到其中一遍。

### 2. iOS 机制收敛：9 个「值返回」的同步 `@JavascriptInterface` 收进 async 门面

R54-2 已经做了 `nativeFire()`（void 那一半，14 个调用点）。这轮补的是**读东西回来**的那一半。
差别很要紧：`postMessage` 只能送、不能答，所以 WKWebView 上一个返回 String 的
`@JavascriptInterface` 等价物根本不存在 —— 如果 JS 侧写成 `const v = TDashcamNative.x()`，
iOS 版要么整页重写这些点，要么挂一个假的同步桥。

新增 `script.js:841 nativeAsk(name, …)` → `Promise`，和 `script.js:860 nativeAskJson(name, …)`
（壳回的是文本，JSON 解析不过去就当没答案）。**契约**：没有桥 / 没有这个方法 / 抛异常 /
返回空，四种都 resolve 成 `null`，调用点保留原有的「不知道就走兜底」分支，不 catch 任何东西。
今天 Android 侧仍是同步实现，只是晚一个微任务落地；iOS 版要替换的只有这一个函数体。

被收进来的 9 个值返回方法：`nativeStatus`、`appFilesDir`、`storageVolumes`、`systemBrightness`、
`exportCodecReport`（诊断那一行 + 编码器 clamp 探测）、`exportStatus`、`notificationsAllowed`、
`startExport`（返回 jobId）、`deletePaths`（这个早就走 `__tdashcamDeleteResult` 回调，R54-3）。

最后一个裸引用也清掉了 —— `script.js:17836` 原来是 `if (window.TDashcamNative?.startExport)`，
现在是 `if (nativeMethod('startExport'))`。全文件 grep `TDashcamNative` 现在只剩门面自己的
5 处（774/785/791/794/819）。

**顺带删掉的一处死代码**：`nativeAsk` 里原本外面还套了一层 `try/catch`，但 `nativeMethod()`
返回的那个 wrapper 已经把异常吞成 `undefined` 了，`nativeAsk` 再把 `undefined` 映射成 `null`，
所以那层 catch 永远跑不到。

### 3. 计划里有两条，实测后确认不用做 / 不该做

- **`haptic()` 走桥**：已经是走桥的。`script.js:1250` 就是 `nativeFire('vibrate', kind)`，
  R49-1 抽象层落地时顺带做完了，这轮无事可做。
- **`/storage/emulated/0` 浏览根兜底**：**这轮故意不做**。一是它要在 Kotlin 侧加东西
  （JS 拿不到挂载点，得让壳报一个可浏览的默认根），二是这个概念本身不该往 iOS 传 ——
  iOS 版读的是车机 Wi-Fi/HTTP 上的录像，没有「浏览路径」这回事。为它开一条只服务安卓的
  分支，正好是 R49-3 想收掉的那种东西。

### 4. B11：双击画面切下一路相机

`setupPhoneDoubleTapCamera()`（`script.js:12165` 起）+ `stepPhoneCamera()`。三条判据是这一条
的全部难度：

- **只在单路画面生效**（`layoutMode === 'single'`）。宫格里第一击本来就会把那一格放大，
  而为了等第二击把所有点击压 300ms，等于为了一个没人用的手势拖慢大家在用的那个。
- **窗口 340ms、位移 ≤44px**，和 R30-9 的长按倍速、R24-3 的捏合互不认领。
- 注册在 `playerArea` 主点击处理（`script.js:10441`）**之前**，命中双击时先写
  `suppressPlayerTapUntil = now + 500`，主处理在自己的那条守卫处返回，不会既切相机又暂停。

`stepPhoneCamera()` 里有一处必须显式处理的坑：`switchCamera()` 把「用户明确点了某一路」
当成一次 tap-zoom 的结束，会清掉 `camera-zoomed` 和 `preZoomLayout` —— 那意味着双击放大后
第二击会把 ✕ 和它要回去的宫格一起弄丢。所以这里先存后还：放大态保留，只是换了一路画面。
可切的路是 `ALL_CAMERA_VIEWS ∩ player.currentUrls`（这一事件真实存在的路），少于 2 路时
双击什么都不做。每次切换 `haptic('light')` + toast 报出新机位名。

### 实测（1.2.78，emulator-5554 真点击 / 真滑动）

装机包 `versionName=1.2.78`，`window.viewer` 在场，`#jsErrorBanner` 无。

- **对比度四态**（竖 412×915 / 横 915×412 × 浅 / 深，读的是 computed style 不是 CSS 文本）：
  浅色 `rgb(60,58,68)` @ `0.75` 压在 `rgba(255,255,255,.88)` 上 → **≈5.18:1**；
  深色 `rgb(236,234,244)` @ `0.62` 压在 `rgba(30,32,40,.84)`（`blur(22px) saturate(1.8)`）上 →
  **≈6.10:1**，与 1.2.77 逐项相同。横竖两档四态数值一致，没有哪一档漏了变量。
  ⚠ 第一次量到深色也是 `.75` —— `.tab-btn` 有 `transition: opacity .18s`，切主题后同一 tick
  读到的还是旧值；隔 1s 再读才对（「去类后量到过渡中途」的老坑）。
- **async 门面逐个跑通**：`nativeStatus` → 1.2.78；`appFilesDir` → 私有目录；
  `storageVolumes` → `/storage/emulated/0:37 | /storage/0000-0000:6 usb=0`；
  `systemBrightness` → 0.400；`notificationsAllowed` → true；
  `exportCodecReport` → `peCodecKindCache` 按尺寸落缓存
  （`1280x720→software`、`1920x1080→software`、`3840x2160→none`）。
- **导出面板整条链真点击走完**：真点 `#clipBtn` 进剪辑（`clip-trimming`，入出点自动 ±30s）→
  同一格变成 `#confirmClipBtn`，再点 → `showClipModal()` 经 `nativeMethod('startExport')`
  这道门进 `showPhoneExportModal()`（**没**掉到桌面的 FFmpeg 分支）。
  选 前/后/左 三路后摘要为「3 路 · 1696x368（每路 565x368） · 00:30 · **已按本机编码器上限缩小**」，
  这句就是 async 探测回来后才补上的。
- **摆放拖拽互换**：真 `swipe` 把「前」拖到「左」的位置 → 顺序 `front,back,left` 变
  `back,left,front`，`peLayoutDragging` 归 false，摘要重画。
  （第一次拖不动是**我**没滚：`.pe-body` 还有 150px 没滚到底，`elementFromPoint` 落到了
  固定的「开始导出」按钮上。滚动容器 + 固定 footer 的正常行为，不是遮挡 bug。）
- **开始 / 取消各连点两次**：`adb shell "input tap;input tap"` 双击「开始导出」→
  只有**一个** job（`peJob.id=960659541`，原生 `exportStatus` 报同一个 id、`phase:encoding`），
  `peStarting` 那道守卫挡住了第二次；进度 `0% → 10%`，胶囊「导出中 10%」+「已写入 90/901 帧」。
  双击「取消」→ `phase:cancelled`、`peJob:null`、胶囊 `.show` 掉、文案「已取消，已写入的片段保存在文件里」。
- **复制诊断**：真点 ⋮ 面板里的「复制诊断」，toast「诊断信息已复制」，剪贴板文本里
  `export=decoders=…; encoders=c2.android.avc.encoder,OMX.google.h264.encoder` ——
  这一行现在来自 async 的 `exportCodecReport`，`volumes=` 来自 async 的 `storageVolumes`。
- **删除事件桥**：没有拿真实事件做删除，改用了两个探针文件。
  TeslaCam 根下一个散文件 → `{ok:false, error:"不属于某个事件目录，已拒绝：…"}`（守卫在，
  桥也答了）；`TeslaCam/Sentry_2099-01-01_00-00-00/probe.txt`（自己造的假事件）→
  `{ok:true, deleted:1, freed:2}`，`adb ls` 确认整个目录已消失。探针文件已清掉。
- **双击切相机**：真双击 → `{"n":2,"gaps":[180],"active":"left"}`，两击间隔 180ms 在 340ms 窗口内，
  机位从「前」跳到「左」，toast 报「左侧」。（第一次没反应也是**我**的错：前面那一记单点已经设了
  `suppressPlayerTapUntil`，得等它过期。）
- **宫格里双击不切**：`layoutMode!=='single'` 时判据直接不成立，符合上面的设计取舍。
- 截图：`devtools/r59-light-portrait.png`、`-dark-portrait.png`、`-land-light.png`、
  `-final-portrait-light.png`（竖屏浅色三格 + 剪辑态）、`-export-sheet.png`（单路导出面板）、
  `-export-3cam.png`（三路 + 摆放行）、`-doubletap.png`（双击后落在「左侧」，✕ 仍在）、
  `-browser.png`（事件列表抽屉）。
- 设备复位：浅色、竖屏；`accelerometer_rotation` 留在 0（本轮没再重装）。

### 交付

- `TDashcamStudio/Tessera-1.2.78-android-universal.apk` —— 27,806,731 字节，
  md5 `7671fec0dd1451d2d458bdb0be2f39d8`，已 `adb install -r` 装机复测（`versionName=1.2.78`）。
- 1.0.1 … 1.2.77 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。
- 仍在等的两条：**导出水印**的文案 / 位置 / 透明度；**小米 14 真机回归**。

## 第六十轮（1.2.78 → 1.2.80）：手机端手势全量改读 Pointer Events，抽屉侧滑靠声明式 `touch-action` 救回来

用户的话是「那就干。应用内轨迹、水印先不做。」，所以这一轮只做手势这一件事到底：页面里的
12 个识别器从 Touch Events 换成 Pointer Events，画面上的 `preventDefault()` 一律删掉、改成一出发
就声明好的 `touch-action`。D19 应用内轨迹（`ROUTE_TRACK_ENABLED=false`）与导出画面烧录水印继续挂起。

### 1. 为什么非换不可

Touch Events 在安卓上「看起来能用」，但它是一条**会骗人的流**：没有 `pointerId`（两指只能靠
`e.touches.length` 猜），浏览器把一记滑动判成页面 pan 之后 `touchmove` 就不发了、也不告诉你为什么，
而 WKWebView 更凶 —— 系统边缘手势与回弹会直接抢走 `touchmove`，`preventDefault()` 跟它对打是
R24、R30 两轮流量的来源。Pointer Events 是一条流同时覆盖手指与鼠标，`pointercancel` 明确说
「这一记被平台拿走了」，`setPointerCapture` 让手指滑出控件边界之后仍然继续上报。

- **门**：`isTouchPointer(e)`（`script.js:781`）就是 `e.pointerType !== 'mouse'`。桌面那半边的
  `mousedown` / `mousemove` 路径**一个字没动**，所以每个换掉的识别器只是多了一道「不是鼠标才算手指」。
  为什么不是 `'touch'|'pen'` 白名单：CDP 合成的触摸流 `pointerType` 是**空串**
  （`Input.synthesizePinchGesture`、`Input.dispatchTouchEvent` 都这样），写成白名单等于把这一轮全部
  双指验收手段判死；反过来，真机上任何对真手指报 `''` 的设备会**静默**丢掉所有手势。这个方向的错不能犯。
- **手指表**：`setupPhoneTouchPointers()`（`script.js:12144`）在 `.player-area` 上记
  `pointerdown/move/up/cancel`，`pictureFingerPoints(n)`（`:12168`）回答「正好 n 指在画面上」。
  画面那四条（fling / 亮度 / 长按倍速 / 捏合+平移）从此不猜 `touches.length`。`document` 级也挂了
  up/cancel 兜底（`:12163`）：触摸指针是**隐式捕获**的，手指在别的元素上抬起时 area 收不到最后一记。
  旋转重建格子时 `resetFeedZoom()` 顺带清表 —— 残留的那一指会让下一次捏合以为已经两指了。
- **改名**：`touchStartX/touchStartY/touchEndX/touchEndY/touchTarget` → `swipeStartX/…`
  （`initSwipeGestures`，`script.js:15909` 起）。留着 `touch` 前缀的变量在 pointer 流里装的到底是什么，
  下一轮的人只能猜。
- **两处顺手补的**：亮度那条把系统读数改成**按下时预取**（`prefetchSystemBrightness()`）—— ⚠ **这一处已被 R67 换掉**：
  预取的是「一个已知值」，而 `screenBrightness` 是窗口级绝对值、压过系统滑块，预取一次就把它钉死在按下那一刻了；
  现在 JS 只发比例，基准由原生在写入时现读（见文末 R67 一节）。不再在
  `pointermove` 里读这个决定本身仍然成立 —— capture 之后 move 是逐帧来的，而 R59 起值返回的桥调用**不是同步的**，
  放在 move 里等于每帧 await 一个可能已经过期的旧值。另一处是唤醒自动隐藏的播放控制层那一记点
  （`script.js:5656-5663`）：`pointerdown` 是唯一还能观察到「覆盖层当时是隐藏的」的时刻，
  于是打上 `wakeOnlyTap`，抬手时把这记点击从 tap-zoom 那里退掉。

### 2. `touch-action` 才是「这只手指归我」的唯一说法

`pointermove` 上的 `preventDefault()` **取消不了**一个浏览器已经认领的 pan —— 它只会让流变成
`pointercancel`，手势照样丢。所以声明必须落在手指着地之前。这一轮删掉 6 处画面上的 `preventDefault`，
换成（`styles.css:8123-8163`，全量计数 `none` 13 / `pan-y` 2 / `manipulation` 1）：

- `html.touch-ui .video-container { touch-action: none }`（`:8133`）—— 画面归 app。
  **挂在 `.video-container` 而不是 `.player-area`**：祖先的 `none` 会从每一个后代身上减掉，
  挂在 area 上就等于把住在同一块 area 里的那张元数据抽屉的行滚不动了。
- `html.touch-ui .player-area { touch-action: manipulation }`（`:8137`）—— 只要「别再等双击缩放」，
  不碰 pan。播放器 chrome 需要的那一点响应速度全在这一个词上。
- `html.touch-ui .progress-container, .clip-handle { none }`（`:8144`）—— 40px 的轨道上没有该滚的东西；
  不声明的话同一根手指会被交给页面当 pan，seek 拖到一半收到 `pointercancel`。
- `html.touch-ui .sidebar-header, .event-search-row, .file-list, .sidebar-footer { pan-y }`（`:8158`）
  —— **这条是 1.2.79 装机实测之后才补的**，见下一节。
- 门控一律是 `html.touch-ui`（运行时类，`markTouchUi()`）而不是媒体查询：桌面版把窗口
  拖窄必须还留着捏合与双击缩放，而 ROM 给平板报 fine pointer 时该丢还得丢 —— 这两件事媒体查询都判不对。

### 3. 只剩下拉刷新仍是 Touch Events（别顺手改完）

`setupPullToRefresh()`（`script.js:13058-13114`）是全文件唯一**要取消一个浏览器已经开始的滚动**的
识别器，`pointermove` 做不到；它必须绑在浏览器还没提交的 `touchmove` 上并 `{passive: false}`，
而它所在的那块面因此也只声明到 `pan-y`（列表照常竖滚，只有「已经在顶上继续往下拽」被取消）。
函数头上的注释写明了这条理由。grep 计数：`addEventListener('touch` 剩 4 处，全在这一个函数里。

### 4. 回归：1.2.79 上抽屉侧滑划不动，`pointercancel` 在九像素处

装机后按老办法真滑动复测。横屏从抽屉导航栏起手 `swipe 735 79 → 157 79 350ms`，抽屉**不动**。
插探针（`devtools/r60-dbg-swipe.js`）读到的流是：

```
pointerdown@280,30 → pointermove@271,30 → pointercancel@0,0 → lostpointercapture
```

九像素、一记 move，合成器就把这一下判成页面 pan 收走了；识别器手里只剩 9px 位移，而阈值是 50px
（`minSwipeDistance`）。就地给 `.sidebar` 注入 `touch-action: pan-y` 再滑 → 15 记 move 一路走到
`pointerup@60,30`，`sidebar collapsed`。**但修复没有落在 `.sidebar` 上**：祖先的 `pan-y` 会减到每个
后代头上，而抽屉里「最近目录」那一行是横向滚的、它要留 `pan-x`，所以声明被拆到四条 chrome 上
（`:8158`）。竖屏同一条滑复测通过。

Touch Events 时代这条为什么「没事」：识别器读的是 `document` 上的 `touchmove`，浏览器把 pan 判走之后
touch 流照发 —— 那个假象一直掩盖着「这块面从没声明过自己归谁」。

### 5. 同一记左滑的两个认领者：行删除 vs 抽屉关闭

行左滑（`makeRowSwipeDeletable`，`script.js:4742-4780`）和抽屉侧滑关闭读的是**同一记左滑、同一批像素**，
但行是在自己的 `pointerup` 上盖时间戳（`rowSwipeClaimedAt`），抽屉晚一帧才判（`rowSwipeOwns()` 只认
250ms，`script.js:15953`）。一次刻意慢下来的 400ms 拖动会在 50ms 处认领、250ms 处过期，
于是抽屉在手指底下被关掉。现在**每记 `pointermove` 重盖一次时间戳**（`:4744-4747` 的注释就是这件事）。

### 6. R60-2：一条从没被引用的 `FileProvider`

`src-tauri/gen/android/app/src/main/AndroidManifest.xml` 里 Tauri 模板带的那段
`<provider android:name="androidx.core.content.FileProvider"
android:authorities="${applicationId}.fileprovider" android:grantUriPermissions="true">` +
`@xml/file_paths` **删掉了**。全仓 grep 不到一处引用：导出落盘是 `ExportEngine.kt` 直接
`File(outPath)` + `MediaMuxer`，入库走 `MediaScannerConnection`，从头到尾没有 `content://` 这一步。
留着它的效果是在 manifest 里声明「本 App 具备对外授权文件 URI 的能力」，而这条能力并不存在 ——
在审核方眼里就是一块假的攻击面。`res/xml/file_paths.xml` **原地留着**：`gen/android/**` 不在 git 里，
删了没法恢复，而一个没人引用的资源是惰性的。

文档侧同时划掉两条过期账：iOS 差距清单里「`AndroidManifest.xml:49-57` 声明了 FileProvider…顺手可删」
（`:3871`），以及已知限制里 R50 之前那条「⋮ 面板每点一次都会关掉」。

### 实测（1.2.80，emulator-5554 真滑动 / 真点击，dpr 2.625）

装机包 `versionName=1.2.80`，`window.viewer` 在场，`#jsErrorBanner` 无。先核对 computed style
（样式的验收读的是外观，不是 CSS 文本）：`.video-container` → `none`、`.player-area` → `manipulation`、
`.progress-container` 与 `.clip-handle` → `none`、`.sidebar-header` → `pan-y`、
`#statsResizeHandle` → `none`。确认 `:8158` 那块真的在包里，而不是只在源码里。

- **抽屉侧滑关闭**（本轮的回归项）：横屏导航栏 `swipe 735 79 → 157 79 350ms` → `sidebar collapsed`；
  竖屏同一条 → `collapsed`。右上角「完成」/「取消」两枚真点击各测一次都收。
- **捏合放大 → 单指平移 → 收回 1×**：横屏单路画面 `node devtools/pinch2.mjs 206 150 2` →
  `{"zoom":["2.43",…],"zoomed":[true,…]}`；单指拖 → `--feed-pan-x/--feed-pan-y` 跟手、到边夹住；
  两指收回 → `{"z":"1","zoomed":false,"pan":"0px"}`。**竖屏 6 宫格**同样放大成功（格子级 zoom 各算各的）。
  ⚠ 中间有两次「捏合坏了」都是我自己的探针错：`synthesizePinchGesture` 的两指落在 `cy±`（约 ±37px），
  横屏取 cy=197 时第二指正好压在 `progress-handle`（y=235）上，`blocksFeedGesture:true` 是**正确的拒绝**；
  而 `scaleFactor<1` 时它起手是**张开**在 ±102px 的，两指早就落在画面外的 `header-center-info` 与
  `view-btn` 上 —— 「捏小」这一记最后改用 `devtools/pinch3.mjs`（`Input.dispatchTouchEvent` 手撒两个
  指定点，12 步 @16ms）才测得成。
- **fling 换事件**：真滑动左右各一次，`currentEvent.eventId` 各前进/后退一步（`autoNext` 开着也没被
  播完逻辑抢走）。
- **亮度**：画面左 1/3 上滑 → `{"lvl":1.1,"dim":"0","hud":true}`（HUD 出，越过系统上限那截靠白罩），
  下滑 → `{"lvl":0.62}`；右半屏竖滑 `lvl` 不动 —— 限左 1/3 是 R30-1 的判据。
  ⚠ 第一次「亮度失灵」是**我**在 6 宫格下从格缝起的手：那一面是 `.player-area`（`manipulation`），
  竖向仍然交给页面 pan。从画面上起手即正常。这条写进已知限制。
- **长按 3 倍速**：`{"hint":true,…,"r":3}` → `#phoneBoostHint.show` + 六路 `video.playbackRate` 全 3，
  松手回 1。
- **双击切相机**：单路真双击 → `{"shown":["back"]}`，toast 报「后方」，`camera-zoomed` 与 ✕ 都在；
  6 宫格里双击不切（判据只在单路成立，符合第五十九轮的取舍）。
- **进度条 scrub**：`.progress-container[aria-valuenow]` `21 → 64 → 32`，全程 `.time-preview` 跟着出
  读数（B10），两个方向都试。
  ⚠ `#videoControlsOverlay` 会自动隐藏成 `opacity:0 / pointer-events:none`：**唤醒那记点和拖动必须
  写进同一条命令**，否则前一记「scrub」会静默变成一次 fling 并把事件换掉；`tap-el.sh` 同样会在
  「CDP 量坐标」与「adb 落点」之间把覆盖层丢掉，报 `TAPPED` 而毫无效果。
- **剪辑入/出点**：真点 `#clipBtn` 进剪辑态后，`#clipStartHandle` / `#clipEndHandle` 各真拖一次 →
  `clipStartTime 21.5 / clipEndTime 49.5`。
- **下拉刷新**：竖屏与横屏各一次 → `{"h":"34px","cls":"ptr-spinner spinning","skel":1}`
  （spinner 高度跟手、骨架屏起），松手重扫出同一批事件。
- **列表竖滚 + 行左滑**：竖滚正常（`pan-y` 没把列表自己的滚动要走）；行左滑露出「删除」、再右滑收回，
  7 行**一行没少** —— 没做破坏性测试。
- **数据卡拖动 / 缩放**：真滑 `.stats-header` → `top 56 → 107`（要 54 给到 51）；真滑右下角
  `#statsResizeHandle` → `386×216 → 384×242`（宽被视口边夹住），`statsPlateResizing` 收尾归 false。
- **搜索**：真点 `#eventSearch` 聚焦、系统键盘弹起，`--kb-native-h` 有值且焦点行不被裁
  （R49-2 那条 visualViewport 链在换成 pointer 流之后仍然对）。
- 截图：`devtools/r60-00-state.png`（装机后首屏）、`-01-browser.png`（目录浏览器）、
  `-portrait.png`（竖屏 6 宫格 + 底部三格）、`-seek-after.png`（横屏 scrub 之后）。
- 设备复位：竖屏、浅色、抽屉关、详细数据卡关（`tdashcam.statsPlate` 清回默认）、剪辑态关、
  `autoNext='1'`、系统亮度 1、`accelerometer_rotation=1` + `user_rotation=0`。

### 交付

- `TDashcamStudio/Tessera-1.2.80-android-universal.apk` —— 27,809,471 字节，
  md5 `632aeedfa129bd32f774396c83f62ee3`，已 `adb install -r` 装机复测（`versionName=1.2.80`）。
  这一轮出了两个包：1.2.79 是「12 个识别器换完」那一版，抽屉侧滑的 `pointercancel` 回归是**装机真滑动**
  才看见的，补完 `pan-y` 与 `isTouchPointer` 那两处之后重构建为 1.2.80；两个都留在根目录。
- 1.0.1 … 1.2.78 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。
- 仍在等的三条：**导出水印**的文案 / 位置 / 透明度；**小米 14 真机回归**（这轮全在手指流上，
  真机比模拟器有意义得多 —— 合成器什么时候接管一记滑、系统返回手势区多宽，都是机型相关的）；
  底部动作条那一格的**宽度**取舍。

## 第六十一轮（1.2.80 → 1.2.81）：首页「找片」卡片从"陷进去"改成"浮起来"，并且不再被亮度黑纱压住

需求原话：「打开 APP，首页中间"找片"的卡片亮度偏低，感觉是灰蒙蒙的，怎么回事？」

这一条不能靠"看着像"来定，所以先把渲染出来的**像素**取出来量：`adb exec-out screencap -p` 存 PNG，
再用 `devtools/pixels.ps1`（`System.Drawing.Bitmap.GetPixel`，传 CSS 坐标 + dpr 2.625 自己换算）
逐点打印 RGB。量出来是**两个独立的成因**，用户各挑了一种修法。

### 成因 1：深色主题下这块板的填充比它浮在上面的页面还暗（用户选：改成提亮的悬浮材质）

`.empty-hero` 用的是 `--glass-bg-soft`，而安卓手机档把这个 token 抬到了
`rgba(30,32,40,0.84)`（`styles.css:5084`，抬的动机是 `<video>` 在 WebView 里走独立合成层、
`backdrop-filter` 采不到它）。首页**没有视频**，卡片背后只有 `--bg-secondary` + 那一层渐变，
于是一张"玻璃板"画成了**比页面更暗的凹陷面**：

| 取点（竖屏 1.2.80 深色） | 实测 |
| --- | --- |
| 卡片内 | `rgb(31,35,44)` |
| 卡片左侧背景 | `rgb(43,48,57)` |
| 卡片右侧背景 | `rgb(39,40,41)` |
| 卡面对比 | **1.19:1，且方向是"更暗"** |

分离它的只剩那条发丝边框，所以整体读起来就是"一块灰"。`blur(22px) saturate(1.8)` 在这里也无事可采。
悬浮面应该往**上**提亮（iOS 的深色材质就是这么做的），于是给这一处单独换成往上提亮的填充：

- `styles.css:6107-6124`：`body.dark-theme .player-area.empty .empty-hero { background-color:
  rgba(255,255,255,0.10) }`。特异度 (0,4,1) 压过 `@supports` 里那条 (0,3,1)，不用 `!important`。
  - **只改填充，边框仍然走 `--glass-edge`**：一开始想顺手把边框也写成 `rgba(255,255,255,0.24)`，
    那会让「增强对比度」的用户拿到**更弱**的边（他们那边 token 已经是 .45）。硬写颜色等于把
    无障碍档位覆盖掉，这条没做。
  - **只有深色改**：浅色实测卡片 `rgb(252,252,253)` 浮在 `rgb(232,232,236)` 上，本来就是提亮的，
    token 不动。桌面更不动 —— 规则整个在 `@media (max-width:768px) … , (hover:none) and (pointer:coarse)`
    （`styles.css:5858`）里面，桌面 `.empty-hero` 是 `display:none`。
  - **.10 而不是 .12**：.12 合成出来是 `rgb(65,69,73)`，卡片里那行小字（`--modal-muted`
    `rgb(170,176,192)` / 12.5px）落在它上面只有 **4.46:1，差一点点不过 AA**。回到 .10 →
    卡面 `rgb(61,64,69)`、小字 **4.80:1** 过线，标题 8.5:1，同时仍然比页面亮 1.36:1。
    反过来"把小字提亮"也能过，但那是拿一个硬写颜色去盖掉「增强对比度」已经替这类用户挑好的 token。

### 成因 2：画面亮度的黑纱盖在卡片之上，而且亮度会持久化（用户选：把卡片抬到纱之上）

`#phoneBrightnessDim` 是 `inset:0` 铺在同一个 `#playerArea` 上的 `rgba(0,0,0,α)`，z-index **39**；
卡片是 `position:absolute` 但 z-index `auto` —— 于是"上滑调暗画面"这记手势把**首页唯一那个入口**
一起蒙暗了。把亮度打到 0.6 再看，卡片像素精确地乘了 0.6（`rgb(19,21,26)`）。更糟的是
`setBrightness(level, persist)` 会写 `tdashcam.brightness`（`script.js:12414`）、开屏再恢复
（`script.js:12338`）：**一次误触的下滑，之后每次启动首页都是暗的。**

- `styles.css:6126-6134`：`.player-area.empty .empty-hero { z-index: 40 }` —— 纱只压画面，
  不压首页入口。手势自己的读数条在 41，仍然画在卡片之上；控制层同为 40，但首页态它是隐藏的。

### 顺带收的一处层叠：`html.solid-material`（系统「降低透明度」）

这块板现在是**唯一**不再从玻璃 token 取色的表面，所以"减少透明度"档位必须给它自己的平铺值，
否则它会留着半透明 + 关掉模糊、变成一块看穿过去的灰。
`styles.css:8788-8793` 加 `html.solid-material body.dark-theme .player-area.empty .empty-hero
{ background-color: #3c3e44 }` —— 就是半透明那块在首页背景上合成出来的颜色（实测 `rgb(61,64,69)`），
只是不透视。特异度 (0,5,1) 压过深色那条 (0,4,1)。

## 实测（1.2.81，emulator-5554，真点击切主题/真开关系统无障碍位 + `screencap` 逐点取色）

- **深色竖屏**：`heroBg rgba(255,255,255,0.1)`、`z-index 40`、纱 `39`、读数条 `41`；
  卡面 `rgb(61,64,69)` / `rgb(60,62,64)`，页面 `rgb(41,43,48)`、`rgb(38,39,40)`、上方渐变
  `rgb(44,49,58)` —— 方向翻正了，1.36:1 提亮 + 阴影 + 发丝边，卡片明显"浮"在页面上。
- **文字对比（按实测卡面算）**：标题 `rgb(230,232,239)` **7.9:1**、小字 `rgb(170,176,192)` **4.80:1**
  （AA 过）、按钮白字 **9.67:1**。
- **黑纱**：`viewer.setBrightness(0.6, false)` → 纱 `opacity 0.4`。纱外背景 `rgb(25,26,29)`、
  纱外上方 `rgb(26,29,35)`，而卡片**按钮仍是满色的 `rgb(91,75,240)`**；卡面掉到 `rgb(46,48,48)`
  —— 注意这**不是**纱盖上去了：`backdrop-filter` 采的是**背后那层**，纱在卡片之下，所以透视部分
  跟着变暗，而卡片自己画的内容（文字/按钮/边框）一点没掉。此时卡面仍比周围亮 1.8×。
  `tdashcam.brightness` 全程保持 `1`（`persist=false`），验收没写脏设备状态。
- **横屏深色**：视口 915×412，卡片 `[328,97,260,199]`（底 296）、底栏 `top 321` —— 不重叠；
  卡面 `rgb(59,61,61)`～`rgb(63,72,90)`（透视采到渐变蓝光，故有起伏），背景 `rgb(45,48,56)`/`rgb(37,38,39)`。
- **浅色**：`rgba(255,255,255,0.88)` 未动，卡面 `rgb(252,252,253)` / `rgb(252,252,252)`，
  背景 `rgb(232,232,236)` —— 与改动前逐点一致。
- **系统「降低透明度」+「高对比度文本」真开**（`settings put global transparency_level_effects_disabled 1`
  / `settings put secure accessibility_high_text_contrast_enabled 1`，APP 侧观察者当场收到）：
  `html.solid-material` + `html.high-contrast` 都 true，卡面 `rgb(60,62,68)` 平铺、
  `backdrop-filter none`、边框 `rgba(255,255,255,0.45)`（抬到无障碍档的那条没被覆盖）、
  小字换成 `rgb(185,191,205)` → 对平铺板 **4.93:1**。测完两个开关都归 0。
- 截图：`devtools/r61-final-dark.png`（深色竖屏首屏）、`-veil2.png`（黑纱下）、
  `-land-dark.png`（横屏）、`-light.png`、`-a11y-dark.png`（solid+高对比）。
- 设备复位：浅色、竖屏、亮度 1（未持久化）、无障碍位归 0、`accelerometer_rotation=1`、抽屉关。

### 交付

- `TDashcamStudio/Tessera-1.2.81-android-universal.apk` —— 27,810,303 字节，
  md5 `a623656daa89d5371626a46671b8d4a4`，已 `adb install -r` 装机复测（`versionName=1.2.81`）。
  版本号只改 `src-tauri/tauri.conf.json:4`（`build.gradle.kts:34-35` 从 tauri 属性里读）。
  本轮实际构建过两次同版本：第一次 .12 的填充量出小字 4.46:1 不过 AA，回到 .10 重出包；
  1.2.81 没在中间流出去过，所以不另起版本号。
- 1.0.1 … 1.2.80 全部原样留在根目录（现共 44 个包），没删没挪。全部改动仍未提交（clone 没有 git 凭据）。
- 仍在等的三条：**导出水印**的文案 / 位置 / 透明度；**小米 14 真机回归**；底部动作条那一格的**宽度**取舍。

## 第六十二轮（1.2.81 → 1.2.82）：大小窗四路组合的垂直位置与其他播放模式对齐（含全屏挖孔安全区）

用户反馈：「大小窗模式的四路视屏组合，位置整体偏上，特别是全屏下，跑到挖孔屏摄像头的位置了。
请把高度和其他几种播放模式保持一致，要协调。」先把两个独立成因量出来，再让用户在
「只居中 / 只改原生安全区 / 都做」里选 —— 用户选**都做**。

### 成因一：两个宫格 `align-content:center`，大小窗是 `start`

手机竖屏布局块（styles.css:6218 起）里 grid6 / grid4 都靠 `align-content:center` 在内容盒里居中，
唯独 `.player-area.legacy-view` 是 `start` —— 组合贴住内容盒上沿。

实测（412×915，dpr 2.625，事件 `TeslaCam/SavedClips/2026-09-29_12-30-00`，`viewer.playEvent` 后真点底栏切布局）：

- 内容盒 = `.player-area` `[0,97,412,727]` + padding `8px 8px calc(controls-h 134 + 8)` → 105..682；
- legacy 组合 105..559（中心 332）；grid6 行 223/338.5/454.3（中心 393.4）；
  grid4 行 281/396.4（中心 393.4）—— 只有大小窗没在那条中心线上；
- 全屏下主窗 top = **8px**，而挖孔带是 0..51.8px
  （`dumpsys window`：`mDisplayCutout=DisplayCutout{insets=Rect(0, 136 - 0, 0)}`、`cutoutSpec={M 506,68 a 34,34}`；
  洞圆心 x≈205.7 正是「顶中」这一列，y 12.95..38.86）。

### 修法一：`align-content: start → center`（styles.css:6255）

一行改动（注释里记了原因，见 styles.css:6245-6251）。改后（同一事件、同一台机）：

- 竖屏正常：legacy 166.2..620.5（中心 393.35）、grid6 中心 393.4、grid4 中心 393.4 —— 三种模式共用一条中心线；
- 竖屏全屏：175.4..629.7（内容盒 8..797，中心 402.5）—— 主窗 top 从 8 → 175，整体在挖孔带下方；
- 组合内部栅格一字未动：main 396.2×222.9、pip 195.1×109.7（都是 16:9 定尺寸）；
- 横屏不受影响：这块媒体查询是竖屏专属，横屏 legacy 是绝对定位 PiP（实测主窗 `[0,0,915,412]` 铺满）。

### 成因二：全屏时原生把 `--safe-top` 写成 0，但挖孔是硬件不会消失

`applyInsets`（MainActivity.kt:587）原来的 top 一对是 `(bars.top, isVisible(statusBars))`：
全屏时状态栏隐藏 → 走 else 分支**显式**写 `'0px'` —— 这一写把 union（`systemBars() or displayCutout()`）
里的挖孔高度也一起抹掉了，页面于是把顶中浮层画进挖孔带。

### 修法二：全屏时 top 回落到 `cutout.top`（MainActivity.kt:591/604/617）

```kotlin
val cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout())
val topInset = if (statusBarsVisible) bars.top else cutout.top
// 声明门：statusBarsVisible || cutout.top > 0
```

语义：非全屏原样（`bars.top`）；全屏有挖孔 → 报挖孔高；**无挖孔设备全屏 → 仍然是 0**（和以前一样），
所以对没有挖孔的机器是 no-op。左右两条本来就一直透传（挖孔在侧边时归它们）。

实测（1.2.82 装机）：全屏 `--safe-top` 内联值 = `max(env(safe-area-inset-top, 0px), 51.8px)`
（1.2.81 是字面 `0px`），计算值 `max(52px, 51.8px)`；`env()` 探针实测全屏仍返回 52px。连带的三处：

- `#phoneBoostHint`（顶中，长按 3× 芯片）top 10 → **62px** —— 它原来正好压在洞那一列；
- `.js-error-banner` top 6 → **58px**；
- `#metaDetailOverlay` top 58 → **110px**（全屏前已打开才可见；它本来就假设 header 占 58px）。

横屏全屏 `--safe-top` 仍是 `0px`（挖孔随旋转跑到侧边，`cutout.top=0` → 门 false → 照旧），
非全屏 `max(52px, 51.8px)` 前后一致。**iOS 版同题**：`viewport-fit=cover` 下 `env(safe-area-inset-top)`
在沉浸式时由 WebKit 给值，这套「status bar 不可见就回落到 cutout」的备胎不需要带过去 —— 记在差距清单 C 段。

### 验收（1.2.82，真点击 + 逐像素复核）

- `devtools/r62-geom.js` / 临时探针量三模式矩形：正常与全屏两种状态、横屏两种状态，数字如上；
- **逐像素复核**：`adb exec-out screencap -p` 后在 x=100 物理列扫「由黑转亮」行，
  首个转亮行 CSS 166.1 vs DOM `getBoundingClientRect` 166.2 —— 外观与状态对得上
  （防「只测 JS 状态、样式其实没生效」那类假绿）；
- 截图：`devtools/r62-legacy-portrait.png`、`r62-fs-legacy-portrait.png`（改前，全屏贴顶）、
  `r62-after-legacy-portrait.png`、`r62-after-fs-legacy-portrait.png`（改后）；
- 顺带确认验收仪器两个旧坑仍在：`input tap` 先唤醒播放器控制层再点全屏键；BACK 在玩家态是 0 层 → 直接退到 launcher（不是 bug）。
- 设备复位：grid4、浅色、竖屏、亮度 1、无障碍位 0、`accelerometer_rotation=1`、首屏。

### 交付

- `TDashcamStudio/Tessera-1.2.82-android-universal.apk` —— 27,810,431 字节，
  md5 `9fdcc4beca4ee721ee9120624d33a833`，已 `adb install -r` 装机复测（`versionName=1.2.82`，
  与设备 `base.apk` 逐字节一致）。
- 1.0.1 … 1.2.81 全部原样留在根目录（现共 45 个包），没删没挪。全部改动仍未提交（clone 没有 git 凭据）。
- 仍在等的三条：**导出水印**的文案 / 位置 / 透明度；**小米 14 真机回归**；底部动作条那一格的**宽度**取舍。

## 第六十三轮（1.2.82 → 1.2.83）：七个播放手势全部落地，胶片条从"挡画面"改成"借一行"

> 「1、2、3、4、5、6、7这几个都做了。另外请继续排查bug并修复。」
> 追问定案两轮：胶片条 →「画面让出底带，条不再浮在画面上」，再 →「**两条都做**」
> （压到 30px 落进速度曲线那一行 + 把归属权交还画面）；小修只选「首次提示条抬到元数据卡之上」，
> ⋮ 面板「标题+取消键吸顶」**未选，故未做**。

### 成因一：桌面端把这些动作全放在键盘和按钮上，手机端两者都没有

±10 秒是 `←`/`→`，切相机是数字键，逐帧是 `,`/`.`。手机上唯一的输入面就是那块画面本身，
七个手势要落在同一片矩形上，判据必须先互斥再谈识别，否则"上下滑"和"亮度"、
"横划"和"拖进度条"会互相抢手指。所以这一轮真正的工程量不在"加了七个 handler"，
而在把画面切成有主的区，并给每个识别器写明**什么时候必须让位**。

### 成因二：胶片条吃指针这件事，把整条画面都带走了

R26-6 做胶片条时它是 `pointer-events: none` 的纯读数条（为了让下面的入/出点手柄能隔着条拖）。
R63-6 要它在手机上接受横划，就得改成 `auto` —— 而条挂在
`clip-filmstrip → progress-container → video-controls-container → overlay → player-area`
这条链上，`.progress-container` 正好在 `blocksFeedGesture` 的黑名单里，
于是条所在的整条带（竖屏 64px、横屏 30px）双击、上下滑、捏合、亮度**全部失灵**。
另一半是几何问题：竖屏条浮在画面上不遮什么，横屏画面只有 ~250px 高，
按 16:9 算出来的 50 多像素条会把一条黑带吊在控件之上、画面之中。

### 修法一：双击分区（R63-1 / R63-3）— `setupPhoneDoubleTapZones` script.js:12558

只在**单路画面**生效（`layoutMode === 'single'`），栅格里双击仍是"放大那一路"。
按下记下落点，抬起时位移 ≤12px 才算"点"；两次点配对要求 **340ms** 内、相距 ≤44px。
分区用整个 `playerArea` 的矩形来量 —— 和亮度手势同一把尺子（:12728 也是左 1/3），
两把手势必须在同一张地图上分地：

```js
if (rel <= box.width / 3) this.phoneSeekStep(-1);
else if (rel >= box.width * 2 / 3) this.phoneSeekStep(1);
else this.stepPhoneCamera(1);
```

配对成功后 `suppressPlayerTapUntil = now + 500`：壳子在第二次抬起时还会补一记 click，
不拦的话它会把刚做完 seek 的控制层再唤出来。

`phoneSeekStep` (:12605) 按暂停态分流 —— 这是 1 和 3 共用一记手指动作的原因：

```js
const moved = await controls.stepBySeconds(dir * (paused ? PHONE_FRAME_STEP : PHONE_SEEK_STEP));
```

`PHONE_FRAME_STEP = 0.1`（:4596）、`PHONE_SEEK_STEP = 10`。芯片文案报**实际做了什么**
（「+1 帧」/「+10 秒」），否则一个写着 +10 秒、其实在逐帧的读数什么也教不了。
走 `stepBySeconds` 而不是 `player.currentTime` 是为了经连续播放器路径，不依赖某一路。

### 修法二：右侧 2/3 上下滑切相机（R63-2）— `setupPhoneCameraSwipe` :12641

占地和亮度一样讲武德：左 1/3 归亮度，两条屏幕边（`clientX < 34`）归系统返回手势和抽屉。
判据 `|dy| ≥ 60` 且 `|dy| ≥ 1.6|dx|`、600ms 内完成；`dy < 0` = 上一路。
`stepPhoneCamera` (:12678) 在**有流**的相机列表上取模循环，
并且要把放大态续上：`switchCamera` 把"显式选路"当成用户退出了放大，会把 ✕ 和它返回的栅格一起丢掉，
所以这里先记下 `camera-zoomed` 与 `preZoomLayout`，切完再抹回来 —— 用户只换了被放大的那一路。

### 修法三：两指双击归位 1×（R63-4）— `setupPhoneFeedPinch` 的 `release()` :13099

判据挂在**抬起**而不是按下：`!gesture.moved && Date.now() - gesture.downAt <= 300`。
挂在按下会让"捏到一半松手"也被认成轻点。与上一次记下的 `pinchTapAt` 配对要求
同一路相机、340ms、中点距离 ≤44px；只有 `wasZoomed` 才真的写回
`feedZoom[camera] = {scale:1,x:0,y:0}`，并给芯片「归位 1×」+ `haptic('light')`。
捏合本来就没有别的复位手段，把摊开的手指精确收在 1.00 是没人能故意命中的动作。

### 修法四：抬离条面进精细微调（R63-5）— `scrubPosition` :6188

```js
if (e.clientY < rect.top - 6) { this.fineScrub = { pos, x: e.clientX }; }
return Math.max(0, Math.min(1, this.fineScrub.pos +
    ((e.clientX - this.fineScrub.x) * FINE_SCRUB_RATIO) / span));
```

只对 `pointerType` 为 `touch`/`pen` 生效（鼠标本来就够精确），条面上方 6px 的死区是为了
让"贴着条拖"不误触。进入后**锚定进入点**：后续横向位移从 `fineScrub.pos` 起算，
比例 `FINE_SCRUB_RATIO = 1/8`（:4600）—— 1px 顶原来 8px。气泡加 `.fine`
（styles.css:1504：琥珀描边 + 等宽字，显示到 0.1s）—— 灵敏度变了必须看得见，不然像卡住了。
顺带修掉 R63-5b：事件红点（`.progress-markers`）盖在条上把拖动吃掉了。

### 修法五：胶片条横划定区间（R63-6）— `bindFilmstripTrim` :5960

条按下时**只记录不认领**（`claimed=false`，同时记住 `anchor` 与原有 `clipStartTime/clipEndTime`），
直到位移证明它是条唯一拥有的那件事：

```js
if (Math.abs(dx) >= 10 && Math.abs(dx) >= Math.abs(dy)) { /* 认领 + setPointerCapture */ }
```

两条让位规则：`!this.viewer.pictureFingerPoints(1)`（第二根手指 = 捏合，归画面）
或 `this.viewer.zoomedFeedAt(e)`（画面正被放大，这根手指在驾驶画面）时
`pointer = null` **永久让出这一指**，不是只让这一次 —— 否则捏合抬起一根手指后条又把区间捡起来改一遍。
进度条 `startDrag` (:6158) 对落在条上的 touch-down 直接忽略，所以横划**不会同时 seek**；
跨度不足 `MIN_TRIM_SPAN` 的划法回落 `remembered`。反馈用面板自己的入点/出点读数，不加 toast。
`touch-action: none` 只声明在条上（styles.css:8375，R60 的"最小表面"原则），页面其他地方照常滚。

### 修法六：条的归属权交还画面 + 横屏让位那一行（R63-8，"两条都做"）

- `blocksFeedGesture` (:12838) 先 `closest('.clip-filmstrip')` → `return false`：条不再屏蔽画面手势，
  条上的双击/上下滑/捏合/亮度全部照旧工作，只有横划归条。
- `setupPhoneFlingSwitcher` (:12456) pointerdown 复位 `this.filmstripTrimDrag = false`，
  `finish` 里 `if (this.filmstripTrimDrag) return;` —— 两个识别器共用一个"这指被条认领了"的旗。
- `applyFilmstripHeight` (:5933) 不再写 inline `height`，改成 `--filmstrip-wanted`；
  CSS `height: var(--filmstrip-wanted, 40px)`（:1429）配横屏手机档 `max-height: 30px`（:1465）。
  inline 会赢下层叠，而旋转**不会重跑** `applyFilmstripHeight`（比例已知时 `fitFilmstripToFrames` 提前返回），
  所以只能"要一个高度，让 CSS 按当前朝向 clamp"。横屏这 30px 正好落在速度曲线让出的那一行里
  （`body.clip-trimming .speed-graph-container { visibility: hidden }`，:1452）—— 画面 0 损失。
- 竖屏不受 clamp：条按 16:9 要 64px，`--filmstrip-h: 67px` 把元数据卡抬起来让位（:1476），
  卡片本来就 dock 在同一条带上。
- `feedCellAt` (:12871) 补几何矩形兜底：`elementFromPoint` 现在会命中条或时间气泡而不是画面格，
  放大态下三处"只在未放大画面生效"的判据就会误判。

### 修法七：手势说明面板 + 首次提示（R63-7）

`setupGestureHelp` :15708：⋮ 面板行 `#gestureHelpBtn`（带 `phone-only-btn`，桌面菜单一字未改）
→ `#gestureModal`（index.html:661）**11 行 3 组**：播放进度 / 相机与画面 / 剪辑，
页脚写明「双击分区与上下滑只在单路画面生效；宫格里双击是放大那一路。」
`showGestureHintOnce()` 在事件加载后 1.5s（:11567）浮现一次，门是 `isPhoneLayout() && currentEvent && !gestureHintShown`，
`localStorage['tdashcam.gestureHintSeen']` 落一次就不再出现，7s 自动收；
点提示条上的关闭**直接展开面板** —— 收掉它同时也是入口。
提示文案说「放大成单路后」而不是"双击画面"，因为手机默认进 4 宫格，
不能让用户去双击眼前根本没有的东西。

### 排查出来的两个"不是 bug"（记下来免得再查一遍）

- 左右滑切事件到最后一个就不再走：`viewer.lastFilteredEvents` 只有 7 项、当前在 index 6，
  `stepThroughEvents(+1)` 是**钳位**不是循环，符合预期。
- 单路布局在换事件后被重置成栅格：`tdashcam.layout`（script.js:11524-11531）只持久化
  `grid|grid4|legacy`，`single` 是**按事件**的临时视角 —— 设计如此，未改。

### 给 iOS 那轮留的一处隐患

`ModernVideoControls` 把 `timeupdate`/`play`/`pause` 绑在 `this.player = this.multiCameraPlayer.players.front`
（:5536、:5734-5740）上：事件**没有 front 路**时计时器和按钮态挂在错元素（或 null）上，
切到别的路之后时间读数也不再跟。安卓侧因为 front 基本恒在而多年没炸；
iOS 的 AVPlayer 路径必须换成"跟随 `activeCamera` 重绑"。
`stepBySeconds` 不受影响（走 `continuousPlayer`），所以这一轮的逐帧/±10 秒是干净的。

### 验收（1.2.83，真点击 + 真滑动，竖屏与横屏各一遍）

- 双击：左 1/3 `-10s`、右 1/3 `+10s`（芯片读数与 `video.currentTime` 双向核对）；
  暂停态左右分别「-1 帧」「+1 帧」；中间切到下一路。
  注意右双击一开始"没反应"是**指针已在末尾**（`t=18.172 / dur=18.2717`，+0.1s 被钳位），先往后步再往前步就正常。
- 上下滑：`dy<0` 上一路 / `dy>0` 下一路；左 1/3 同方向滑动仍走亮度、不切相机。
- 两指双击：画面与条带两处都归位 1×；
  ⚠ `dblpinch.mjs` 每条 CDP 事件都 await，两次抬起实际差 ~500ms，落在 340ms 配对外 → 假失败。
  用 `r63-pinch-diag.mjs <cx> <cy> <span> -1`（gap=-1 = fire-and-forget）才是有效探针。
- 精细微调：注入包装 `scrubPosition` 证实 `{x:200, pos:0.482}` 入口锚定，纯竖直拖动期间 `t` 停在 8.81 不动。
- 胶片条六模式归属（single，横屏）：横划=定区间且不 seek 不换事件；
  双击=±10s（暂停时±1帧）；上下滑=切相机；捏合=放大；两指双击=归位；
  第二根手指/放大画面上的手指交还画面。
  ⚠ `pinch3.mjs` 两指是**竖直**分开（`cy ± half/2`），在条带附近会一指落空 ——
  条带上的捏合要在 `single` 布局量（cell `[0,44,915,300]` vs 条 `[88,239,791,30]`），
  栅格布局下条本来就在每格之下，不存在遮挡。
- 几何：横屏条 `[88,239,791,30]`（`--filmstrip-wanted:64px` 被 `max-height:30px` clamp）
  正好落在让出的速度曲线行 `[62,254,843,30]` 内，`.progress-container` 上沿 y=272；
  竖屏条 `[36,656,340,64]`、`--filmstrip-h:67px`、元数据卡 `[8,559,396,57]` 被抬起、速度曲线 hidden。
- 提示条 `[10,156,392,46]`、z-index 1010，压在元数据卡（top 559）之上。
  ⚠ 芯片几秒自收，screencap 必须和"重新武装"（清 `gestureHintSeen` + `showGestureHintOnce()`）同一条命令里做。
- ⋮ 面板：手机上 `#headerMenuBtn` 是 `display:none`（styles.css:4784），
  入口是底部 `#tabMoreBtn`；面板没开就 tap `#gestureHelpBtn` 会报
  `TAP_SKIPPED -> unhit:flex/hidden/none`，不是控件坏。
- 全程无 JS 错误横幅（`#jsErrorBanner` 未显示）。
- 设备复位：grid、浅色、竖屏、亮度 1、无障碍位 0、`accelerometer_rotation=1`、首屏。

### 交付

- `TDashcamStudio/Tessera-1.2.83-android-universal.apk` —— 27,820,607 字节，
  md5 `2eadbdc51cd7e0f3f53f5c981f6e8235`，已 `adb install -r` 装机并按上表复测（`versionName=1.2.83`）。
- 1.0.1 … 1.2.82 全部原样留在根目录（现共 82 个包），没删没挪。全部改动仍未提交（clone 没有 git 凭据）。
- 仍在等的三条：**导出水印**的文案 / 位置 / 透明度；**小米 14 真机回归**；底部动作条那一格的**宽度**取舍。

## 第六十四轮（1.2.83 → 1.2.91）：多次双击 ±10 秒不再把画面留在原地，手势分区量的是画面本身

> 「1.播放过程中，多次双击画面前进或后退，画面会出现卡死，不再播放，类似问题都排查一下。
> 2.横屏的视屏手势操作跑到画面外面去了。」
> 两条先定方案再动手：R64-1 →「**三件套**」（换段后把播放接回来 + 按**真实**时长钳位 + 可重入 seek
> 串行合并，一次改在 `seekToTime` 上让四个调用方全部继承）；R64-2 →「**画面矩形 + 44 下限**」
> （尺子取真正被画出来的那块矩形，三格各自不足 44px 时对称放宽，带外不认，芯片跟着画面走）。
> 明确**不做**"逐段实测时长重写时间轴"—— 名义 60s 记账保持原样，只有落到实物的那一跳才看真实时长。

### 成因一：一次换段的 seek 要重载**六路**画面 — `loadSegmentForAllCameras` :5330

`cleanup()` 会把每一路 pause 并换掉 `src`，随后循环给六路都塞一个新 `src`。横屏 `single` 只看得见
一路，却要为一个 loopback worker 和五个解码槽排队：`waitForAllVideosLoaded` 顶着 4s 上限跑穿，
屏幕那一路仍然停在 readyState 1，`playAll()` 之后还要再等几秒 —— 期间画面是**静止的**而控制条写着
播放中，这就是「卡死，不再播放」看到的样子。在这个窗口里再双击一次，第二条 `cleanup()` 会 revoke
第一条还在等的 objectURL，于是永远回不来。

### 成因二：`applySeek` 换段之后从不把播放接回来 :5757

同一条注释里写着的对照：一分钟边界（`playNextSegment`）和进度条（`stopDrag`）重载完都会续播，
只有 seek 不续。结果第一次按「播放」只是又暂停了一次。

### 成因三：时间轴按 60s 记账，夹具文件只有 18.27s :5741

±10 秒只要越过文件真实末尾就被写进墙里：最后一帧、`seeking` 不消失、后面四记什么都不做。
真实录像也会（每段第一跳、任何一跳落在短文件上），所以钳位必须看**实际加载**的那个文件的时长
（`loadedSegmentDuration()` :5711），而不是记账值。

### 成因四：配对窗内的两记双击同时开两条重载 :5647

合并只解决"别同时跑"，还留下一个更隐蔽的：**合并之后必须仍然数得着每一记**。
重载在跑的时候元素读数是 0s（`src` 刚换、还没 seek 进去），拿它当基准，下一记 ±10 秒就瞄准了
五分钟的片子的第十秒 —— 于是一跳看起来像往回跳，或者看起来什么都没做。

### 成因五：控制条在撒谎 :5788

`cleanup()` 的 pause 与下一次 play 之间如果正好夹了一次 `src` 替换，`isPlaying` 旗子就留在"播放中"
而画面已经停了。它的代价不只是读数：`phoneSeekStep` :12944 是按这个旗子分流暂停态的，
旗子错 → 同一记手指动作变成**逐帧**，芯片写着「+1 帧」而用户要的是 10 秒。

### 成因六：分区量的是整块播放区，不是画面 :12810

竖屏 0.45 比例的画面几乎铺满，所以 R63 写死在 `playerArea` 上的三分区没暴露问题；
横屏同一路画面只画 ~132px，夹在 915px 的黑带正中 —— 整块画面**全落在中间那格"下一路相机"**里，
两个 ±10 秒分区完全坐在黑地上。芯片也是：CSS 把它内缩在播放区边缘，横屏等于贴在黑边上，
看起来手势的作用范围"跑到画面外面去了"。

### 成因七：换段瞬间 `videoWidth` 读 0×0 :12834

`src` 一换，元素要 ~360ms（实测，整段重载约 1.5s）才把 metadata 交回来。这期间没有尺寸，
尺子塌回整块播放区 —— R64-2 刚缩出来的那把尺子又被换掉，瞄准画面的 ±10 秒落进被放宽的中间格，
**切了相机**。

### 修法一：只给看得见的画面换 `src`，其余按需取 :5330 / :5193

```js
const keep = isTouchShellRuntime() ? new Set(this.visibleCameras()) : null;
if (keep) keep.add('front');
```

`front` 必须留着：传输条、同步 tick 和「播完自动下一个」读的都是它的时钟
（:5159 注释）。不在 `keep` 里的路**什么都不做**（特别注意也不给「无画面」占位，那个属于本段真的
没有这个文件）。切过去时由 `loadDeferredFeed()` :5193 现取首帧，`loadeddata` 后再 `start()`，
并且先检查 `player.src !== url`（已被下一次重载换掉）和 `visibleCameras()`（用户已经切走）。
实测 `waitForAllVideosLoaded` 从跑穿 4s 降到 1.2s。

### 修法二：参考时钟不能指向"正要起来的那一路" — `clockTime()` :5179

延迟路起来时要对齐，但**不能用 `players[activeCamera]`**：`setCamera()` 已经把 `activeCamera`
移到正要加载的这一路上，它自己的 currentTime 是 0。实测参考 10.0s、新画面 0.0s，
于是新画面从分钟头起播而进度条留在原处。改成 `front`（front 恰好也在被换起来时，退到任意有
`src` 的路），并且**在 `start()` 里读**而不是在切那一刻读 —— 加载花掉的 0.3–1.5s 里它什么都没追。

### 修法三：`seekToTime` 串行 + 合并，但每一记都数得着 :5647

```js
this.pendingSeekTime = targetTime;
if (this.seekInFlight) return this.seekInFlight;
this.seekInFlight = this.drainSeekRequests().finally(() => { this.seekInFlight = null; });
```

`drainSeekRequests` :5655 每跑一次就把 `seekClaimedTarget = target`（:5658），跑完清空；
`seekBaseTime()` :5691 的取序是 **排队目标 → 在跑的已认领目标 → 屏幕帧**，
所以相对跳量的是"用户按出来的那个位置"。`waitForTransition` :5671 用 60×50ms **有界**等待 ——
永不停止的换段不能把传输也一起 stranded。`loadEvent` :5573-5574 把两个旗子都清掉：
挂在旧事件上的排队目标不许作用到新事件。

### 修法四：`applySeek` 里两处续播 + 一处诚实读数 :5757 / :5780 / :5789

- 换段且 `wasPlaying` → 手机上 `player.playAll()` **不 await**。`play()` 要等新 `src` 交出第一帧
  才 resolve，实测 1.3–2.0s，而下一条目标必须等这一次跑完 → 「双击五次，画面只动一次」。
  桌面保留旧等待（它的调用方是时间轴松手和 ⋮ 跳转，要求 promise 落地时 seek 已完成）。
- 同一段的跳（`reloaded` 为假）：`wasPlaying && front.paused && !front.ended` 也要补一次 `playAll()` ——
  这是控制台那句「play() request was interrupted by a call to pause()」的另一半，
  也是真实录像上「多次双击后卡死」的主路径（真实 60s 段里大多数 ±10 秒都不换段）。
- 最后 `updatePlayState(nowPlaying)` :5789：只在旗子与元素不一致时改，
  让"静止画面 + 播放中读数"这一对不可能同时出现。
- `wasPlaying` :5725 取**两个信号的或**（旗子或 front 真的在跑），因为旗子会 stale。

### 修法五：溢出只向前进位 :5746

```js
if (wanted >= from && index < segments.length - 1) { local -= real; index += 1; await this.loadSegment(index); }
```

后退**不许**向前进位：往回的那一跳本来就已经瞄准了更早的一段，再把它推进到下一段等于把它送回
刚刚离开的那面墙，而且隔着第二次完整重载 —— 那就是"看起来没反应"的一记。
不进位时才就地 `Math.min(local, real - 0.2)` 钳住。

### 修法六：`pictureGestureBand()` :12818 —— 尺子换成画面本身 + 44px 下限

```js
const painted = Math.min(element.width, element.height * naturalW / naturalH);
left = element.left + (element.width - painted) / 2;
width = painted;
...
const widest = Math.max(width, 3 * PHONE_TAP_ZONE_MIN);
```

只在 `isTouchShellRuntime() && layoutMode === 'single'` 才收成画面矩形：桌面用老尺子（不动），
栅格里每一格各有其主、双击本来是"放大那一路"，也没有一块"唯一的画面"可量。
`PHONE_TAP_ZONE_MIN = 44`（:4609）：横屏画面只有 132px，三格各 44px 刚好过触摸下限，
再窄就得对称放宽（放宽后再夹回播放区 :12858-12861）。放大态 :12848 用整格 ——
吹大的画面本来就铺满格子，再量一次黑边会从用户看得见的画面里挖掉两块。
`suppressPlayerTapUntil` 500 → **240**（:12919）：`touch-action: manipulation` 已经把双击缩放的
~300ms 等待去掉了，click 一两帧内就到；500ms 会吃掉**下一对**，按人快速双击的 ~350ms 节奏
就数成「双击五次，画面只动三次」。

### 修法七：`feedRatio` 缓存顶过 0×0 窗口 :12835

```js
if (naturalW && naturalH) { this.feedRatio[camera] = [naturalW, naturalH]; }
else if (camera && this.feedRatio?.[camera]) { [naturalW, naturalH] = this.feedRatio[camera]; }
```

一路的分辨率在一次录像里是不变的，所以哪怕是上一个事件留下的条目，比例仍然是对的。

### 修法八：带外不认 + 芯片跟着画面 :12928 / :12973

`rel < 0 || rel > band.width` 直接 return —— 黑地上浮出一枚「−10 秒」正是横屏看起来坏掉的样子。
`placePhoneFeedChip` :12973 从 band 的左右沿各内缩 10px 定位（`centre` 归零 inline 样式），
芯片因此落在画面里、在被按的那一侧。

### 修法九：可切相机列表从**段的 files** 取 :13046

修法一留下一个副作用：`currentUrls` 现在只含当前布局显示的那几路，手机上就是屏幕那一路。
`stepPhoneCamera` 老写法 `Object.keys(player.currentUrls)` 因此长度是 1，
`views.length < 2` 直接 return —— 双击中间和竖滑切相机**第一记就哑**。
改成段的 `files` 与 `currentUrls` 的并集（桌面 `currentUrls` 仍在判据里，桌面本来就全载）。

### 一处有意的偏差：点认画面，拖认屏幕边

`setupPhoneCameraSwipe` :13012 与亮度 :13101 用**同一把尺子**划分（左 1/3 归亮度、右 2/3 归切相机），
但认领范围仍然跑到屏幕边缘。因为拖动是**可以瞄准的**，而横屏画面宽 132px：
把黑地从中抠掉只剩 44px 的调光条，没人能稳定落在里面。双击不是这样 —— 它的分区本身就是要
"点在画面上"，芯片才教得会对映。

### 排查出来、最后判定**不是** JS 的残留

`stalled` 全程为空、`p39` 的自然换段能自愈，但换段后仍有 ~2.7s 静止。三段计时：

- `p41`（直接 `fetch` 下一段文件，走的就是 `<video>` 用的那条本地流）：
  `Range: bytes=0-1` 的头部探测 43ms，整份 248,605 字节 50ms，最慢的一档 301ms —— **不是服务器/IO**。
- `p42`（元素相位迹）：`ended` 的**同一刻**就派发 `loadstart`（那 2.7s 只是片子跑到尽头的时间），
  metadata ~550ms 回来，然后是一段 `waiting`→`canplay` 的爬升 ~4s。
- `p43`（解码吞吐）：缓冲起来之后 media time 与解码帧数 **ratio 1.00**，8–10.7fps，
  丢帧 0–14% —— 不是解码跟不上。

结论：JS 侧的四条 stranded 路径已全部关闭，剩下的等待在 WebView 元素/模拟器的缓冲与解码上。
不加 prefetch（prefetch 不解决"已经在等的第一个字节"），不换元素（改动面太大）。
**待小米 14 真机复测**；若真机没有这段等待，则完全是模拟器现象。

### 验收（1.2.91，`devtools/dbltap.mjs` 真两点，横竖屏各一遍）

- ⚠ 探针本身先修的：`adb shell input tap` 一次一 spawn，两记抬起实测差 **360–731ms**，
  在 340ms 配对窗之外 → 手势"看起来是死的"。CDP `Input.dispatchTouchEvent` 走同一条可信输入管线
  且能精确计时；但每条 `await` 的往返 ~150ms，冷连接第一对实测 732ms，所以发送改成
  fire-and-forget（两记抬起 0–61ms）。抬起时刻从 `pointerup` 的 `timeStamp` 读回来才敢信。
- 横屏（`r71-zone.sh`）：`band [392,132,524]`、三格 `[414,458,502]`、`thirdPx 44`、`tapY 197`。
  x=200 / x=700（黑地）→ **steps 0**；x=412 → `dir:-1`，芯片「−10 秒」`at-left` 矩形 `[402,61,463]`
  `onPicture:true`；x=502 → `dir:+1`，「+10 秒」`at-right` `[452,61,513]` `onPicture:true`；
  x=457 中间 → `camSteps dir:1`（front→back，延迟路当场取帧并加入运行中的时钟）。
- 竖屏（`r70-portrait.sh`）：`band [42,327,370]`（画面 327 宽，元素 412 → 两侧各 42 黑地）、
  三格 `[97,206,315]`、`thirdPx 109.1`、`tapY 460`。x=6 / x=406 → 无动作；
  x=97 → `dir:-1`（换段 `4>3`，apply 1235ms），「−10 秒」`[52,61,113]` onPicture；
  x=315 → `dir:+1`，`ct 109.6 → 119.6`（**+10.0 整**），「+10 秒」`[299,61,360]` onPicture；
  x=206 中间 → front→back。`views` 六路、`loadedOnly` 只有 `[front, back]` —— 正是修法九的前提。
- 连击（`r71-burst.sh`，6 对 × 同一点）：6 次 `apply` 每次 `d` 恰为 +10；
  同段的 apply **0 / 13ms**，换段的 **404 / 776 / 942ms**；`waitForTransition` 632–1617ms 且
  `timedOut:false`；每一次 apply 都 `paused:false`、`play:true`；`stalls []`。
- 自然换段（`p39`，无人干预跑到边界）：自己恢复播放，不需要第二记。
- 延迟路对齐（`p36`）：新加入的那一路 `ct` 与参考差 **0**（此前是 10.0 vs 0.0）。
- `feedRatio` 缓存（`p38`）：跨一次换段采样 26 次，`nat 0x0 / rs 0` 的窗口里 band 宽度
  `distinctWidths {"132":26}` —— 不再塌回 915。
- 拖动回归：亮度在 x=150 仍工作（0.867→1.537→1.025），竖滑切相机 front→back→left→right→left_pillar。
- 全程无 JS 错误横幅；`window.__errs` 空（p40 修好后不再自己制造 TypeError）。

### ⚠ 这一轮踩过并写下来的探针陷阱

- `playEvent()` 第一行是 `if (!event) return;`。冷启动时文件夹还没扫完，`eventGroups` 是空的，
  于是它**成功地什么都没开**；后续所有读数落在 fallback 上（`band` = 整块播放区、`nat 0x0`、
  每一记双击 `steps:0`），看着完全像手势坏。必须轮询 `!!viewer.currentEvent` 并在 group 出现后重踢。
- `setLayout('single')` 要在 `playEvent` **之后**：`playEvent` 会按 `tdashcam.layout` 重放布局，
  而分区只在 `single` 生效 —— 先设后被还原，也是满屏 `steps:0`。
- 传输暂停时同一记动作变成逐帧（芯片「−1 帧」），所以分区测试前必须断言
  `multiCameraPlayer.isPlaying`；夹具跑到 182.72 末尾之后所有测试都在这条上失效。
- `viewer.isPlaying` 是 undefined（旗子在 `multiCameraPlayer` 上）；`seekToTime()` 不返回 promise
  （`.then()` 直接抛）；没有全局 `APP_VERSION`（用 `window.APP_VERSION || 'n/a'`）。
- p27 的修订事实靠 `.toString()`，必须在**刚重启**的页面上读：p12/p15/p21/p23/p25/p32 的包装器
  会替换掉被查的方法（p32 包 `stepPhoneCamera`），已上线的代码会被读成 false。
- `awaitPromise` 的预算约 10s：要看 8 秒以上的探针必须两阶段（先武装、再读），p39/p41/p42 已改。
- 给活着的媒体监听器"读完就 delete"会让下一次事件抛 TypeError，并污染 `p14.errs`（p40 已改为就地截断）。
- 芯片 900ms 自收：`dbltap` 要放后台、`sleep 0.7` 再 `screencap`，且与重新武装同一条命令。

### 交付

- `TDashcamStudio/Tessera-1.2.91-android-universal.apk` —— 27,842,751 字节，
  md5 `8da3b1a620706acd31aca57b39d05efc`，已 `adb install -r` 装机并按上表复测。
- ⚠ 根目录的连续交付在这里断了一次：本轮从 1.2.84 一路做到 1.2.91，中间七个包的 APK
  已被后续构建覆盖，根目录只有 1.2.83 与 1.2.91 两枚。以后每轮**构建一完成就先复制到根目录**，
  不等到验收结束（`app-universal-release.apk` 会被下一次 gradle 覆盖）。
- 1.0.1 … 1.2.83 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。
- 仍在等的三条：**导出水印**的文案 / 位置 / 透明度；**小米 14 真机回归**（含上面那段 ~2.7s 换段等待）；
  底部动作条那一格的**宽度**取舍。

## 第六十五轮（1.2.91 → 1.2.94）：多路「轮流卡」的根因收成一条状态机，纠偏不再自己制造 seek 风暴

报告原话：「多路视频在小米 14 上面播放还是卡顿，比如有几路视频能流畅播放，但其中有一路视频卡顿」。
四问四答：**每次不一样的那一路**、**拖进度条 / 双击 ±10 秒之后开始卡**、
**四宫格 / 六宫格 / 大小窗都会遇到**、做法选 **诊断 + 低风险纠偏**
（先给每路数字，只纠「没有被争夺」的那一路：绝不 seek 一路缺数据的画面、每路冷却、
容差随倍速、停住的给 `play()` 而不是 seek、小差距用倍速滑过去）。

### 根因（按能解释的现象排序）

1. **`syncAllPlayers()` 是一场自喂的 seek 风暴。** 旧规则每 100 ms 对每一路比一次，超容差就写一次
   `currentTime` —— 而每一次写都是**一次真 seek**：一次解码 + 一次 range 请求 + 该元素一段
   `seeking` 窗（真机上几百毫秒起）。seek 回来时参考时钟又已经往前走了一截，于是**必然**再次落在
   容差外。谁先掉队谁被纠偏，被纠偏就必然再掉队 —— 这就是「拖完进度条开始轮流卡」的机制本身，
   「轮流」不是随机，是队列。
2. **参考时钟可能就是刚被拖坏的那一路。** 整轮纠偏拿 `players[activeCamera].currentTime` 当标准答案，
   却没有任何一处判断「这个答案自己是不是停住了」。拖完进度条，主机位大概率正在缺数据；旧规则只比
   大小，分不清「这一路缺数据」和「这一路落后」，于是把一个冻住的数字拽给另外五路健康画面。
   这条同时解释了「每次卡的那一路不一样」：谁在拖的时候正在缓冲，谁就变成新的错误答案。
3. **容差是媒体时间，却用固定值。** 0.35 s 在 4× 下等于 0.35 s 的墙钟抖动 ×4 —— 一路永远读成
   「落后」，倍速越高越像全员都在掉队。
4. **停住不动的那一路只会等到 seek。** 给它 `currentTime` 只是把一张冻结的画面搬到正确的数字上，
   仍然是冻结（就是「有一路不动了，其余照播」）。它缺的那一下是 `play()`。

### 改了什么（全部关在 `isTouchShellRuntime()` 里，桌面一条判据没动）

1. **每路一份计数器**：`MultiCameraPlayer.feedStats` + `bindFeedStats()`（script.js:5096）。
   `waiting` / `stalled` / `seeking` / `seeked` 各自计数，`starvingSince` 由 `waiting`/`stalled` 置位、
   由 `playing`/`seeked` 归零 —— 「缺数据」和「落后」第一次在代码里是两个不同的事实。
   六个 `<video>` 是 `index.html` 静态元素、这个类只构造一次，所以挂在构造函数里不会叠监听。
2. **参考时钟先自证可信**：`referenceIsTrustworthy()`（5504）。主机位处于 4 s 缺数据宽限内，或者
   「`isPlaying` 且元素没暂停、`currentTime` 却没往前走」，这一 tick **整轮纠偏直接放弃**。
   宁可五路各自漂 0.3 s，也不把五路拽到一个冻住的数字上。
3. **纠偏改成状态机**：`correctTouchFeed()`（5520）。顺序是 —— 缺数据就不动它（此刻写
   `currentTime` 正好掐掉那个即将救活它的请求）→ 每路 2 s 冷却 → 停住的给 `play()` →
   只有 `|gap| > 容差×4`、或「滑速没能把差距收上来」（`gliding && gap >= lastGap*0.6`）、或整体已暂停，
   **才真 seek**；小差距交给 1.08× 的 `playbackRate` 滑过去，`endFeedGlide()`（5559）只在速率真的被
   改过时才写回，所以「全部在容差内」这一条路径是零写入。
4. **容差随倍速放大**（5473）：`0.35 * |playbackRate|`。
5. **停住的那一路不再等满一个容差**（本轮最后一条，5484）：`stopped` 判据提到容差比较**之前**。
   之前它要先把差距涨过 0.35 s（4× 下 1.4 s 的静帧）才被认领成「问题」；现在在它停住的那一个 tick
   就给 `play()`。冷却仍然限制每路 2 s 最多一次，不会变成 play 风暴。
6. **`seekAll()` 的 `isSeeking` 不再盲等 100 ms**（5619）：改成按 `seeked` 证据释放，3 s 兜底。
   盲等是那 100 ms 一到、seek 其实还没落地，风暴就从这里接着开。
7. **复制诊断每路一行**：`describeFeeds()`（5568，调用点 14319）。
   `t=媒体时间 d=与共享时钟的差 rs=readState ahead=已缓冲秒数 q=dropped/total
   flags(P 暂停 / S seeking / X 挂起 / h 本布局画不到 / G 正在滑速 / E 报错)
   w=waiting/stalled k=seeks c=corrections/glides r=倍速不一致 z=缩放 WxH err=`。
   小米 14 上「哪一路、什么时候、因为什么」第一次是能从手机里复制出来的。

### 桌面侧的一次自我回退（记下来，是纪律）

本轮一度把容差写成 `(isTouchShellRuntime() ? 0.35 : 0.1) * rate` —— 那**改了桌面行为**，违反
「桌面一律不动」。1.2.93 回退成桌面固定 0.1 s（与上游同一个数字），只有手机分支乘倍速。
机制层复测确认桌面六条场景的写入次数与旧规则**逐条相同**。

### 一个假信号，差点顺着它改错东西

上一轮怀疑「暂停时双击 ±10 秒不生效」是本轮引入的回归。`devtools/r65-mixed-out.json` 里
`seek` 记录是 `want 300 / 300.1`、`local 0 / 0.1`、`seg 5>5`、`dur 18.27`、**`paused: true`** ——
段边界钳位 + 暂停时那本来就是 ±1 帧，而且量的是 1.2.91（1.2.92 当时没装机）。
于是「`syncAllPlayers()` 在 `!isPlaying` 时直接 return」这条看起来最合理的改法**故意没做**：
它会让暂停态下的对齐全部停摆，而证据里没有任何东西要求它。

### 机制层 A/B（`devtools/r65-sync-harness.mjs`，无设备时的替代）

`vm` 沙箱 + 假 `<video>`（`currentTime` 的 setter 记一次写入，并把该元素钉进 `seeking` 500 ms），
同一份真 `script.js`，跑「旧规则逐字抄写」与「本轮状态机」两套，六条场景。
下表是 `devtools/r65-harness-out.txt`（3 s＝30 tick，10 s＝100 tick；`w`＝写入次数，
`j/g`＝seek 纠偏 / 滑速纠偏，`p`＝`play()` 接回，`d`＝与共享时钟的差）：

| 场景 | 手机 旧→新 | 桌面 旧→新 | 结论 |
| --- | --- | --- | --- |
| 拖完进度条后参考时钟缺数据 | 20 → **0**（6.7/s→0/s） | 30 → 30 相同 | 五路不再被拽向一个冻住的数字（`d≈-3` 是它们各自继续播） |
| 4× 回看 + 解码抖动 | 9 → **0** | 30 → 30 相同 | 固定容差那条根因消失 |
| 1× + 同样的抖动 | 0 → 0 | 8 → 8 相同 | 健康时本来就不该有写入 |
| 某一路停住不动 | 6 → **0** | 10 → 10 相同 | `back p=1` 在停住的那一个 tick 接回，`d=0.13`，零 seek |
| 某一路一次落后 6 s | 20 → **1** | 20 → 20 相同 | 一次 `j=1` 落位，余下 0.34 s 是那一次 seek 自己的 500 ms `seeking` 窗 |
| 全部在容差内 | 0 → 0 | 0 → 0 相同 | 零写入，包括零 `playbackRate` 写回 |

搭这个沙箱踩到的三条，都是探针自己的坑，不是播放器的：
- 假 `document.getElementById` 若按**相机名**建节点，`mcp.players` 拿到的是惰性桩，量出来「0 次写入、
  差 -100 s」的漂亮结果其实什么都没测（要按 `-player` 的 id 映射）。
- `rate` 会被算两次：驱动侧先把 `dt` 乘了倍速，元素 `step()` 内部又乘一次。抖动是**墙钟**量，
  必须在元素那一侧乘倍速才成媒体时间。
- 虚拟时钟从 0 起步，而 `feedStats.lastCorrection` 初值是 0 —— 「这路从来没被纠偏过」被冷却判据
  读成「2 秒前刚纠偏过」，头 2 s 的纠偏被吞掉，伪装成「`play()` 没接回来」（「某一路停住不动」那条
  场景残留的 `d=2.16` 就是这个）。真实页面的 `performance.now()` 一上来就有几十秒，所以
  `UPTIME_MS = 30000` 才是可比的基线。**机制层结论要先把时钟的初值验一遍。**

**这份数字是机制层，不是设备层。** 老限制还在：x86_64 镜像只给 1 个 WebView 解码实例，
所以「六路同时解码时谁先饿死」这类问题在模拟器上量不出来（见 :5811 附近那条）。

### 设备实测（同一台模拟器，1.2.91 ↔ 1.2.94 交替装机）

**前四份报告（`-1291-scrub` / `-1291b-*` / `-1294-scrub` / `-1294c-*`）全部作废，只当反面教材留着**，
原因是协议本身有两个错，都在读数里看得见：
① 种子用 `seekToTime(200)`，而这个 fixture 单段只有 18.27 s —— 超出段尾的 seek **静默钳位还返回成功**，
于是整段窗口测的是「已经播完的播放器」（`clock=18.27`、每行 `p=1`、多余路 `susp=1`）；
② 三次拖动有没有真的落成 seek，脚本压根没断言。

补上断言（每条拖动前后各读一次 `getCurrentTime()`）以后跑出的第一对（`-1291d` vs `-1294e`，同机交替装机、
同一套 grid4 手势）：

| 量 | 1.2.91（`-1291d`） | 1.2.94（`-1294e`） |
| --- | --- | --- |
| 窗口内写入总数 | 53 | **17** |
| 三记拖动的落点 | 195→195（没落地）/ 196→241 / 242→247 | 195→195（没落地）/ 196→241 / 241→246 |
| 稳态时与共享时钟的差 | `d=1.38 / 1.69 / 1.95`，追不平 | `d=0.08 / 0.08 / 0.62` |
| 参考路 `front` 被纠偏器瞄准 | 0 | 0 |
| 可见的另外三路 | 18 / 17 / 18 | 6 / 6 / 5 |
| 画不到的两路（suspended） | 0 | 0 |
| 写入归属 | 53 次**全叫 `http`**（匿名栈帧，说不出是谁写的） | 17 次**全部署名 `MultiCameraPlayer.correctTouchFeed`** |

`corr`/`jump`/`glide` 只有 1.2.94 读得到（`feedStats` 是本轮新加的），1.2.91 那份是 `undefined` —— 这本身就是
「旧代码没法诊断」的直接证据。第一记拖动在**两版里都没落成 seek**（195→195），所以这个协议本来就不能
假设「拖了 = seek 了」；后两记两版落在同一处，53 对 17 是拿同一条手势序列量出来的。

第二对（`TAIL=20`、冷启新页面、两边都 `armed 6`、p45 这时已经把窗口长度记进 `windowSec`）**没第一对干净，
失败的方式值得记下来**：三记拖动的落点在两版里差得很远（1.2.94 是 195→197→78→121，1.2.91 是
195→300→78→489），1.2.91 那一趟在尾巴里跑到事件末尾、读数时六路全 `rs=0`（传输已经卸载），
所以 `31 次 / 62.7 s` 对 `19 次 / 45.6 s` **不能拿来对敲**。它只给出 1.2.94 侧一条正面信息：
`tail-check` 显示读数时仍在播（`play:true`、`segClock=2.67`），19 次写入里 15 次署名纠偏器、
4 次是进度条自己该做的 seek，三路 `rs=1` 的饿死画面按 2 s 冷却被追（back 8 / left 8 / right 2），
差距收在 `d=0.08–0.40`。

±10 秒那一半：1.2.94 用修正协议重跑（`-1294f`，单路、起播在事件中段 `rs=4`、6 次真双击）
**恰好 6 次写入**、front 的 `corr/glide/jump` 全 0，画不到的五路一次没被碰；1.2.91 那一趟（`-1291b`）
也是 6 次，但它日志里的 `arm:` 是 `already armed`（同一个页面实例上第二次挂包装），只能当旁证。
两版在这条路径上 `by` 都只有 `http` = `seekAll` 自己，**所以它不是模拟器上的风暴源**。

要说清的三条限制：
- **别把 53→17 当成「风暴被消灭了」**。四路里有三路在这台镜像上一直是 `rs=1`（只给 1 个 WebView 解码实例），
  纠偏器按 2 s 冷却追它们是正确行为，不是回归。机制层表里「1× + 解码抖动 → 0 写入」那一行才是健康机器
  上的目标输出，模拟器给不了那个前提。
- **第一对没记窗口长度**（`windowSec` 是后两趟才加进 p45 的）。所以 1291d 的写入打到 `t=63`、
  1294e 停在 `t=25` 只能读成「旧规则的鼓点一直响到读数那一刻」，**不能**读成等长窗口下的速率对比。
- **「参考路 front 被瞄准 4 → 0」那条是从作废窗口里读出来的，撤回** —— 这两对干净数据里两版都是 0。

`devtools/r65-storm.sh` 现在自带的东西（下一轮直接用，别再手写）：`seekToTime(总时长×0.35)` 播种 →
轮询到 `play:true` 才挂探针 → 三记真手指拖进度条，每记前后各读一次位置、没落地就重试一次 →
`TAIL=<秒>` 尾巴 → 读数前先打一条 `tail-check`（`play` / `cur` / `dur` / `segClock`），p45 的报告里
多了 `windowSec` / `lastWriteSec` / `quietTailSec`。两份报告只有在 `windowSec` 与拖动落点都对得上的
时候才许对敲。

探针自己的坑（都记进过 `devtools` 的注释）：`adb install -r` 会收回 `MANAGE_EXTERNAL_STORAGE`
（六路 `rs=0`，看着像新包把播放器弄坏了）；装回旧版本要 `-d`；`user_rotation` 在自动旋转开着时被忽略，
而每次 `adb install` 都把它改回 1；脚本 `| head` 会在写完报告前被 SIGPIPE 打死；
`ev()` 里那句 `tail -1` 会把 pretty-print 的 JSON 削成一个 `}`（恒等于「0 次写入」）；
`p44.js` 的包装只在**当前页面实例**里有效，报 `already armed` 意味着计数器是这一页早前那次挂上去的
（`-1291d` 就是这种，`-1294e` 才是 `armed 6`）—— 计数器每趟都清零，所以同一页面实例里的两份还能比，
跨页面实例（装包、旋转、force-stop 之后）绝不能混着比。要拿到 `armed 6`，先 `am force-stop` + `am start`，
再 `viewer.playEvent('TeslaCam/RecentClips')` 把 fixture 请回来。
`playEvent()` 收的是 **eventId 字符串**，传事件对象会命中 `if (!event) return;` 静默什么都不打开。

### 真机验收口径（小米 14）

⋮ → 复制诊断 里每路一行，模拟器实测的格式（`describeFeeds()` :5576）：

```
front t=18.27 d=+0.00 rs=4 ahead=0.0 q=17/160 P w=19/0 k=5  c=0/0  1080x2400
back  t=14.78 d=+3.49 rs=4 ahead=3.5 q=3/32  P w=27/0 k=16 c=17/5 1080x2400
```

`d=` 落后共享时钟几秒，`ahead=` 手里还剩几秒文件，`q=` 解码器自己丢的帧 / 总帧，`P` 暂停、`S` seeking、
`X` 被挂起、`h` 画不到、`G` 正在滑速，`w=` waiting/stalled，`k=` seek 次数，`c=` 硬纠偏/滑速。
「轮流卡」在真机上应当一眼分开：`ahead` 小且 `q` 在涨 → 解码/取数饿死（不是纠偏能治的）；
`ahead` 充足但 `d` 一直为正、`k`/`c` 在涨 → 纠偏还在追着跑。请四宫格播一段、拖三次进度条，然后
⋮ → 复制诊断 贴回来。

### 交付

- `TDashcamStudio/Tessera-1.2.92-android-universal.apk` —— 27,846,207 字节，
  md5 `1d40db35cb7c1dd68f9a96aa89a1e8c9`（含那条被回退的桌面容差，未装机）。
- `TDashcamStudio/Tessera-1.2.93-android-universal.apk` —— 27,846,207 字节，
  md5 `ddd57a1326688dffe534477e997797c8`（桌面容差回退成固定 0.1 s）。
- `TDashcamStudio/Tessera-1.2.94-android-universal.apk` —— 27,846,335 字节，
  md5 `00cb750b391414c61b4e68ac1fb8139d` —— 本轮完整包，含「停住的那一路不等满容差」。
- 1.0.1 … 1.2.91 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。
- 刻意**没做**（用户已同意缓做，且都要先有真机数字）：把 SEI 解析挪出播放路径；让画不到的
  `front` 释放解码器（进度条、同步 tick、播完自动下一个都读它的时间）。

# R74 —— 「衔接处闪一下」：换段那几秒，画面里真的没有任何一帧（1.2.108 → 1.2.111）

用户报的是一条观感：「视屏衔接处感觉不连贯？会闪一下。」量下来它不是「不连贯」，是**一段彻底没有画面**。

## 先量清：闪的到底是什么

截图仪器在这个环境里两条都是瞎的 —— CDP 截图与 `adb screencap` 都不包含视频表面（格子读回一片
`#111`），所以「闪」在图上根本不存在。能看见「这一帧到底有没有呈现」的只有画布回读：每个
rAF 把 `<video>` `drawImage` 到一张 8×8 离屏画布再取 alpha —— 元素没有可呈现的帧时 drawImage
什么都不写，alpha 就直接是「有没有画面」。探针 `devtools/r74-frame.mjs`（`auto-off` / `auto-shipped`
两种模式跑在同一个页面、同一个包上，唯一区别是要不要禁用 shipped 的快照）。

量到的事实（写进 `script.js:5416-5432` 的常量注释里）：

- 新 `src` 一挂上，元素立刻 `readyState=0 videoWidth=0`，整块透明 —— 单路时 **1.6 s**，
  六路同时解码时 **8–11 s**。这段时间格子画它自己的 `#111`。这就是用户看到的「闪一下」。
- 试着**跳过** `cleanup()` 里那句 `src = ''` 不解决问题：读数一模一样。掐断属于加载算法本身，
  不是那句空白赋值能绕开的。
- 快照如果先编码（`toDataURL`）再贴，这路上每路 **430 ms**，六路就是 2.5 s —— 会把要盖的空窗撑得更宽。
  `drawImage` 只要 **1.4 ms**，所以来龙去脉定了：用 canvas 覆盖层，不用 data URL。

## 第一版为什么还剩 4.2 s（1.2.108 实测 `4193 ms` 空窗）

两条都是「按常理该对」的写法，实测都不对：

- `requestVideoFrameCallback` 在**换资源的那一刻**登记，回调答的是**上一段**排队中的帧 ——
  覆盖层刚贴上就自己掀了，露出的正是它要盖住的那段。改成挂在**新资源自己的** `loadeddata` 之后再接。
- 一个固定的 7 s 截止把一次还在进行的加载拦腰剪断：六路同时解码时重载要 8–11 s，
  读数是 **7.4 s 时格子变黑，而新文件还在 `readyState=1`**。截止时间现在只用来判定「这一路不会画了」，
  元素仍卡在 NETWORK_IDLE 且没报错（`readyState<2 && networkState===2 && !error`）就重新预约，
  慢加载不会再被拦腰掀开。

## 第二版实测（1.2.109，同页同包 grid 六路，180 s 窗口）

```
auto-off（对照，禁用 shipped 快照）：3 次衔接空窗
  958710->965673 = 6963 ms, 152 帧, spliced 10lns9l -> 0ceh3h8
  1010518->1017230 = 6712 ms, 156 帧, spliced 0ceh3h8 -> 1gnltqv
  1061598->1069744 = 8146 ms, 149 帧, spliced 1gnltqv -> 0afzj9r

auto-shipped（发出去的那一份）：7475 帧、观察到 2 次真实换段、0 个空窗
```

衔接处那几行长这样 —— 元素什么都没有，合成里仍是**上一帧**：

```
1488170  alpha=1  mean=44.9  rs=0  vw=0  paused=1  ct=0     0ceh3h8   ← 旧文件已被掐断
1488495  alpha=1  mean=44.9  rs=0  vw=0  paused=1  ct=0     1gnltqv   ← 新文件已挂上，还没帧
1491182  alpha=1  mean=44.9  rs=4  vw=1080 paused=1 ct=0     1gnltqv   ← 第一帧到了，覆盖层这时才下来
```

两次衔接各被盖住约 3.0 s / 3.2 s，`alpha` 全程是 1。对照组的 6.7–8.1 s 是同一条链路上把快照禁掉读回来的，
所以「0 ms」不可能来自探针看不见空窗。

## 复看自己写的代码，补掉的三个洞（1.2.110 → 1.2.111）

1. **`cleanup()` 的别的使用者会让快照活过一次不属于它的清理。** 删除正在播的事件（`script.js:15485`）、
   `cleanupOldData()`（:11590）、`destroy()`（:20318）都会掐掉所有播放器，但没人收覆盖层 ——
   于是「已删除事件的最后一帧」盖在「无信号」占位上。只有换段这条路径有资格留着它，所以
   `cleanup(keepHeldFrames)` 加上参数，`loadSegmentForAllCameras` 传 `!!keep`，其余调用一律释放。
   桌面 `heldFrames` 恒空，这里释放的是「空」。
2. **掐断上一次加载产生的 `error` 事件会提前掀开覆盖层。** `cleanup()` 里那句 `load()` 如果在上一份文件
   还没取完时执行，会排队一个 `error`，等我们挂上监听（在 `src =` 之后）才送达；而那时加载算法已经把
   `player.error` 重置成 `null`。原来「任何 error 都放手」正好被它骗一次。改成**只有 `player.error`
   真有值才放手**，兜底仍是那条会重新预约的复查 —— 真解不了的码流仍会在下一个 7 s 到点时被收掉，
   代价只是它多站最多 7 s 的旧画面，而那块地方本来就没有别的可看。
3. **第 2 条的修法自己带了个洞，是回归探针抓出来的。** 改完判据后监听器仍写着
   `addEventListener('error', settle, { once: true })` —— `{once:true}` 在 handler **拒绝**这一次事件时
   也一样退订。于是那条「假 error」把监听器吃掉之后，**真正的解码失败就只能靠 7 s 兜底**，
   覆盖层会在一张永远解不开的旧帧上多站最多 7 秒。修法：去掉 `once`，退订交回
   `releaseHeldFrame()`（它本来就在移除 `held.onError`）。`devtools/r74-holes.js` 在 1.2.111 上的四格
   复验（同一个页面、发出去的包）：

```
armed 1/1                    ← 现场拍快照，覆盖层立起来
spuriousErrorKeepsHold 1/1   ← 假 error（player.error 为 null）不掀
realErrorReleases 0/0        ← 真 error（code=4）到点就掀   ← 这条在 1.2.110 是 1/1，就是洞 3
reArmed 1/1 → spliceCleanupKeeps 1/1   ← cleanup(true) 换段时留着快照
externalCleanupReleases 0/0            ← cleanup() 别的使用者收走快照
final holds 0, overlays 0, error null  ← 没有泄漏的覆盖层留在页面上
```

## 1.2.110 与 1.2.111 各自实测（`auto-shipped`，发出去的包，同一条仪器）

```
1.2.110：1118 帧、观察到 7 次换段、衔接空窗 0 个
          另有 1 个 131 ms / 2 帧的「同一个文件」窗口，出现在衔接之后 —— 是一次失速，
          不是「衔接处闪一下」那件事；如实记下，没有去追。
1.2.111：1072 帧、观察到 8 次换段、no-frame window 0 个
          longest splice no-frame window = 0 ms
```

对照组仍是同一页面、同一个包上把快照禁掉的 `auto-off`（6963 / 6712 / 8146 ms），所以「0」不是探针瞎了。

## 那条「已知边界」后来被证伪了（R75 更正）

上面写的续期条件 `networkState===2`，我当时照着规范把 2 读成 NETWORK_IDLE，所以把它当成「元素自己停住
了」的唯一信号。装到这台 WebView 上实测过一次才看清枚举根本对不上：正在播且已经读完文件的路是
`readyState=4 / networkState=1`，`src=''; load()` 之后是 `networkState=3`。也就是说
**0=EMPTY、1=NETWORK_IDLE、2=NETWORK_LOADING、3=NO_SOURCE** —— 2 恰恰是「还在读」，而手机换段时真正
卡住的那一路是「读完了（1）但还没解出第一帧（`readyState<2`）」。旧条件在这种状态下**不会**续期，于是
覆盖层在 7 s 截止时被掀开，露出一个由构造保证的黑格子。真机跨不过模拟器这种 8–11 s 的饥饿，但同一个
`rs<2, n=1` 状态在真机上更容易短暂出现，所以这就是实机「衔接处还是会闪一下」最像的那条解释。

R75 改成：只要没报错、且 `networkState !== 3`（NO_SOURCE，即真的没文件可解），就继续续期，最长按
`HELD_FRAME_MAX_MS`（21 s，从六路同时重载的 8–11 s 实测值往手机余量取整）封顶；同时把每次快照的
开始/结束都记进 `holdLog`，`⋮ → 复制诊断` 会逐路打印 `end=`（`frame` / `deadline` / `decode-error` /
`superseded` / `clip-gone` / `no-file` / `skip=…`）与当时的 `rs` / `n`。下一次真机反馈不必靠猜：读那一段
就能判定这一路到底是「带着画面交出去的」还是「黑着交出去的」。`describeFeeds()` 也补了 `n=` 字段。

## 桌面一行没动

`holdFeedFrames()` 首行 `if (!isTouchShellRuntime()) return;`，所以 `heldFrames` 在桌面永远是空对象，
`releaseHeldFrame` / `awaitHeldFrameRelease` 都是 no-op，`cleanup(!!keep)` 在桌面就是 `cleanup(false)` ——
与上游语义相同；`loadSegmentForAllCameras` 里那条「看不见的路不重载」的 R64 分支同样靠 `keep === null` 失效。

## 真机验收口径（小米 14）

模拟器是刻意饿死的环境：一段 18.27 s 的片段实际要花约 80 s 墙钟，六路同时重载要 8–11 s 才出第一帧。
真机上这个空窗大概率只有几百毫秒到一两秒 —— 但**机制是同一个**，所以真机要确认的是「修好之后有没有副作用」：

1. 四宫格播一个事件、跨过 2–3 次衔接，问：**衔接处还有没有黑一下？**
2. 有没有出现「画面停住不动超过一秒」的新问题（那是覆盖层没按时下来：可能是这一路解不出来却仍在占着旧帧）。
3. 单路（大小窗/全屏）与倍速 2×/4× 下各跨一次衔接 —— 覆盖层用 `object-fit: contain` + 跟画面同一个
   pan/zoom 变换，放大平移过的格子不该跳回原位。
4. 播完自动下一个事件、以及**删除正在播的那个事件**（第 1 条洞的复验）：格子应回到「无信号」，
   不是留一张旧帧。
5. ⋮ → 复制诊断 里如果某一路长时间 `h`（画不到）或 `X`（被挂起），顺手贴回来。
6. 如果某次衔接「仍然黑了一下」，播够两分钟（跨过至少一次整分衔接）后 ⋮ → 复制诊断，把整段贴回来 ——
   里面的 `holds (newest last, 480px snapshot):` 会逐路写出每次快照是怎么结束的（`end=frame rs≥2` 才是
   「带着画面交出去」；出现 `end=deadline` 或 `skip=` 就是覆盖层没盖住，数字直接指向下一刀）。

### 交付

- `TDashcamStudio/Tessera-1.2.108-android-universal.apk` —— 27,910,563 字节，
  md5 `992734ce783ac5577eb0a91700de3e0d`（第一版快照，仍留 4193 ms 空窗，未装机复验）。
- `TDashcamStudio/Tessera-1.2.109-android-universal.apk` —— 27,910,883 字节，
  md5 `e152f239b3f049213403c7e85bbfecc4` —— 上面那组「0 空窗 / 对照 8146 ms」就是在它身上测的。
- `TDashcamStudio/Tessera-1.2.110-android-universal.apk` —— 27,911,139 字节，
  md5 `ea0fa9fa0f65d09354a2221e0d729fdf`：1.2.109 的两条修复 + 上面洞 1、洞 2。装机后跑出的
  就是上面那组「7 次换段 / 0 个衔接空窗」，也正是它的 `realErrorReleases: 1/1` 抓出了洞 3。
- `TDashcamStudio/Tessera-1.2.111-android-universal.apk` —— 27,911,267 字节，
  md5 `f69f063383ecef5d7af2116466a9746c` —— **本轮完整包**（装机已复验：8 次换段 / 0 个 no-frame 窗口，
  `devtools/r74-holes.js` 四格全过）。
- 1.0.1 … 1.2.110 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。
- 刻意**没做**：不在换段前预解码下一段（要动 `waitForAllVideosLoaded` 的等待语义，且真机数字没到）；
  不把快照喂给胶片条/HUD 烧录（它只服务「有东西可看」这一件事）。

# R73 —— 上一轮留下的两条欠账：导出路径不再重复下载整份 mp4，而 fixture 终于解得动（1.2.107）

这轮没有新需求，是把 R72 交完账后剩下的两条明确欠账一起收掉（「欠账有改的必要吗」→「请一起改了」）：

- **选项乙**：`loadMetadataForSegments` 还在自己 `readFile` 整份 mp4、再让 JS 解析器从头看一遍视频 NAL ——
  同一次导出里，速度曲线已经改走原生走查了，这条路径却仍在重复下载整份文件。
- **fixture `MEDIA_ERR_DECODE`**：R72 造的那条带 SEI 的测试码流，页面能解析、AVD 的解码器解不动，
  于是「导出烧录的 HUD 到底长什么样」这件事一直没法端到端验。

## 一、fixture：`stco` 里差 4 个字节，就让整条码流变成合法但指向空气的盒子

`stco`（chunk offset box）的 body 是 `[version+flags 4B][entry_count 4B][offset 4B × n]`，
第一条 chunk 的偏移在 body 的**第 8 字节**。R72 的生成器把它写在了第 4 字节 —— 那是 `entry_count` 的位置。
后果是两头都错：条目数变成了那个巨大的偏移值，而真正该放偏移的第 8 字节往后仍是全 0，
于是**每一个样本都指向文件偏移 0，也就是 `ftyp` 盒子本身**。解码器从 `ftyp` 的头开始读 NAL，
拿到的是盒子长度字段，编出来的自然是垃圾，报的就是 `MEDIA_ERR_DECODE` 而不是「文件坏了」。

这也解释了为什么它当时骗过了验收：JS 侧的 `DashcamMP4` 走的是自己的 box 树 + SEI 扫描，
`stco` 那条表它压根没读，所以「解析出 150 条遥测」和「画面解不动」同时成立。

修法是 `devtools/r72-mksei.js` 写回第 8 字节（`:243` `writeUInt32BE(headBytes.length + 8, 8)`），
**并补了一道写完自检**（`:239`–`:260`）：重新解析自己刚生成的文件，逐条断言
`entry_count == 1`、`stco` 里的偏移 == `mdat` 载荷起点、`stsz` 条目数 == 样本数，
不满足就把问题打印出来而不是交付。因为「JS 解析得过、指针却指向空气」正是上次出货的方式。

装机复测：同一个 fixture 事件（`TeslaCam/SavedClips/2026-10-09_09-00-00`）六路 `error` 全为空，
时长 6.24–6.29 s，六路都真的解出了画面（`readyState` 到位、`videoWidth/Height` 非零）。
截图 `devtools/r73-decode-fixed.png`。

## 二、代码改动：只加一个「触摸壳」分支，桌面那份一个字没动

`src/script.js:10964` `loadMetadataForSegments`，把「这段的元数据数组」提到 try 顶部变成 `let segmentMetadata`，
然后按运行壳分岔（:10982–:10995）：

```js
if (isTouchShellRuntime() && this.metadataManager) {
    const telemetry = await this.metadataManager.readTelemetry(videoFile);
    segmentMetadata = telemetry.map(item => ({ time: item.time, segmentIndex: i, data: item.data }));
} else {
    /* 原来的 readFile / arrayBuffer / fetch → new DashcamMP4(buffer) → parseMetadata()，逐行保留 */
}
```

两条理由写在了注释里：**JS 解析器必须看完整份文件的视频 NAL，才知道某条 SEI 属于哪一帧**，
所以它只能从整份文件工作；而原生走查（R72 的 `read_sei_metadata`）返回的就是载荷本身，
不需要那些帧边界。另外 `readTelemetry` 也是速度曲线存答案的那层 LRU 缓存 ——
**已经画过曲线的段，这里直接命中，导出时一份都不多读**。

`segmentMetadata` 之后的 push 判据保持 truthy 检查，和上游嵌套写法的语义等价。

桌面侧不只看门：`git show HEAD:src/script.js` 拉出上游原文，去掉缩进差异后逐行比对，
唯一的两处增量就是「`let segmentMetadata` 提出来」和「手机专用的 `if` 分支」。
（这个 clone 其实是 git 仓库，`git rev-parse --is-inside-work-tree` 为真 —— 环境信息说不是，别被它误导。）

## 三、A/B 实测：先证明相等，再谈快了 5.85 倍

同一台模拟器、同一个会话、六路播放器全部暂停（避免和直播流抢回环 HTTP），
`devtools/r73-equality.js` 对每一路交替跑「冷的原生分支」和「逐行复刻的旧 JS 解码」各两次，
取中位数，并**只统计 `.mp4` 的 fetch**：

| 相机 | 原生中位 | 旧 JS 中位 | 原生期间 mp4 请求 | 点数（两边） | 逐点相等 | 字段数 |
| --- | --- | --- | --- | --- | --- | --- |
| front | 274.7 ms | 849.1 ms | 0 次 / 0 字节 | 150 / 150 | ✅ | 14 |
| back | 49.4 | 456.1 | 0 / 0 | 150 / 150 | ✅ | 14 |
| left | 48.8 | 446.2 | 0 / 0 | 150 / 150 | ✅ | 14 |
| right | 47.9 | 738.8 | 0 / 0 | 150 / 150 | ✅ | 14 |
| left_pillar | 50.8 | 343.3 | 0 / 0 | 150 / 150 | ✅ | 14 |
| right_pillar | 88.1 | 438.9 | 0 / 0 | 150 / 150 | ✅ | 14 |
| **合计** | **559.7 ms** | **3272.4 ms** | **0** | | | |

「相等」不是抽样：每个点都比 `time` 和 `JSON.stringify(data)`（14 个字段全在里面），
第一个不一致的点记为 `null`；六路 `firstDiff` 都是 `null`。
再从两边各自构造的数组上调同一组 `getMetadataAtTime`（t = 0 / 0.4 / 1.1 / 2.0 / 3.7 / 5.9），
读数逐字符相同，例如 front `t2 = 65|GEAR_DRIVE|undefined`、`t5.9 = 45|GEAR_DRIVE|TACC`。

改前的基线另存在 `devtools/r73-baseline-1.2.106.json`（1.2.106，同样每次清 `seiCache` 保证冷读）：
冷首跑 front 1229.6 / back 401.1 / left_pillar 250.1 / right_pillar 329.8 ms，三轮求和 1377.4 / 1177.9 / 1264.4 ms。

## 四、说清楚这条路径在手机上的真实位置

诚实的结论：**手机正常导出流程根本不走 `loadMetadataForSegments`**。
`startPhoneExport` 交给原生引擎的 `captions` 来自 `phoneExportCaptions`（:19117），
而它读的是 `event.telemetrySamples` —— 那已经是 R69/R72 的原生走查结果了。

`loadMetadataForSegments` 的调用者是 `processWithFFmpegFull`（:9172）、`processWithFFmpegGrid`（:9495）、
`processVideoWithTimestamp`（:9780）、`createGridVideoFromSegments`（:10203）这一族桌面剪辑器，
手机上的入口 `showClipModal`（:19566）在 `nativeMethod('startExport')` 为真时直接转去原生抽屉。
所以这轮真正关掉的是那条**回落路径**：桥不答话的那类 OEM WebView ——
正是 `showClipModal` 的注释在担心的情况 —— 以前会在手机上把六份几十兆的文件逐个拖进页面再解析。
现在同一条回落读的是原生走查 + 共享缓存，且答案逐点相同。

## 五、真机导出复跑：第一次端到端验成烧录字

因为 fixture 现在解得动了，这轮是**第一次**能亲眼看到导出文件里烧进去的 HUD。
两版跑同一组参数（六路、区间 0–6 s、`overlay.stamp + hud` 都开）：

| 项 | 1.2.106（改前） | 1.2.107（改后） |
| --- | --- | --- |
| 帧数 | 181 / 181 | 181 / 181 |
| 输出 | `Tessera_2026-10-09_09-00-00_0-6s_6c_1696x736.mp4` | 同名 |
| 字节 | 2,458,447 | 2,481,469（编码器速率控制的正常抖动） |
| 解出的尺寸/时长 | 1696×736 / 6.033278 s | 1696×736 / 6.033278 s |
| 3 s 处烧录文字 | `2026-10-09 09:00:02 / 65 km/h · 手动` | **逐字符相同** |

截图 `devtools/r73-export-before-frame3s.png` / `devtools/r73-export-after-frame3s.png`，
文件留档 `devtools/r73-export-before.mp4` / `r73-export-after.mp4`。

顺手记下两件事，都不算这轮的改动：
`currentTime = 3.0` 那一帧带的是 **2 秒**的读数（caption 区间按下界包含），改前改后一样；
`phoneExportFit` 的钳位只从**热的** `peCodecKindCache` 起算，
所以探针必须先 `showPhoneExportModal()` 再等约 10 s 让 `exportCodecReport` 回话，
否则计划会报 3328×1440 然后「这台机器上没有能编 3328x1440 的 H.264 编码器」—— 看着像坏了，其实是没等。

## 六、验收过程里踩到的（已写进记忆，防止下次误判）

- 刚装完就探针：`ReferenceError: viewer is not defined` —— 页面还在加载。先断言 `window.viewer` 再读数。
- 全新安装会清 localStorage：`groups: 0` 不是扫描坏了，得重跑
  `viewer.loadTauriDirectory("/storage/emulated/0/TeslaCam")`（此环境 = 8 组 / 109 个文件）。
- `playEvent` 后立刻读六路 `readyState` 全为 0，是惰性挂流的正常延迟，10 s 后全部解码到位。
- 「改后看起来更慢」的第一版结论是探针自己的错：包装器统计了页面**所有** fetch，
  而当时六路还在播。换成同会话 A/B、只数 `.mp4`、播放器暂停，才有了第三节那张表。

## 七、交付

- `TDashcamStudio/Tessera-1.2.107-android-universal.apk` —— 27,908,963 字节，
  md5 `0c6a54655e888c16a74e1bc68dfac208`，构建日志 `devtools/build-107.log`（`TAURI_BUILD_EXIT=0`）。
  已装到模拟器并复测（`appops … MANAGE_EXTERNAL_STORAGE allow` 已补回）。
- 1.0.1 … 1.2.106 全部原样留在根目录，没删没挪。改动仍未提交（clone 没有 git 凭据）。
- 数据留档：`devtools/r73-baseline-1.2.106.json`、`devtools/r73-after-1.2.107.json`
  （后者里 `afterNativePass` 那组是在六路仍在解码时测的、`fetchedBytes` 统计的是页面全部 fetch，
  整份文件不下载这条结论只以 `equality.noMp4FetchOnNative` 为准）。

## 八、仍然欠着的

- 小米 14 真机的「复制诊断」数字（R65 起就欠）—— 模拟器同机 A/B 只能证明手势侧。
- 把 SEI 解析彻底挪出播放路径；让画不到的 `front` 释放解码器。
- 这轮没动 iOS 侧：`readTelemetry` 的门是 `isTouchShellRuntime()`，iPhone/iPad 构建出来时会自动享受，
  但那条回落路径在 iOS 上是否真被走到，要等有 iOS 壳才能验。

# R72 —— 年份回到 chip，速度曲线改成 Rust 原生走查：先证明两边逐位相等，再谈快了 3 倍（1.2.106）

用户这轮两句话：「现在顶部缺少年份了，需要补上。速度曲线请继续优化。」两个岔口都选了推荐档：

- 年份位置 = **A：年份进 chip，去掉重复的时分** —— chip 变成 `💾 保存片段 2026-10-08`，时钟仍是 `HH:MM:SS`。
- 速度曲线 = **甲：根治 —— Rust 原生走查，只回 SEI** —— 新增一条 Rust 命令自己开文件、走 NAL 流，
  只把 SEI 载荷和时间戳回给页面；protobuf 解码留在 JS，桌面那份 JS 解析器一行没动。

## 一、年份：chip 的时分和时钟是同一分钟写了两遍

R71 为了腾出那 26 px，把 chip 尾巴上的完整时间戳裁成 `10-08 07-30` —— 年份就是在那一刀里没的。
这轮不是把年份硬塞回去，而是看清 chip 的 `07-30` 和右边时钟的 `07:31:02` 本来就是同一分钟的两种写法：
时钟已经带日期 + 精确到秒，chip 再报一次时分纯属重复。于是手机档换成整日期
（`setHeaderEventName` :14892，`isPhoneLayout() ? stamp.slice(0, 10) : stamp.slice(5, 16)`），
桌面那句 `MM-DD HH:MM:SS` 一个字没动。

代价（用户已点头）：顶栏不再有「这段录像开始的分钟」。想看得看右侧时钟，那是画面发生的时间，不是段起始。

同一台模拟器、同一个 fixture 事件（`2026-10-09_09-00-00`）实测（`devtools/r72-header.js`）：

| 档位 | chip | 时钟 | chip↔时钟间隙 | 截断 |
| --- | --- | --- | --- | --- |
| 竖屏 412 | 155 px（x10→165） | 47 px（x260→308） | 95 px | 无（`scrollWidth == clientWidth`） |
| 横屏 915 | 155 px（x62→217） | 47 px（x538→585） | 320 px | 无 |
| 横屏 + 真事件带地址 | 155 px | 47 px | 387 px | 无 |

宽度换串前后基本没变，因为丢掉的时分和补回来的年份互相抵：中文 `158 → 155`，英文 `149 → 146`。
最坏情况是英文最长标签 `Collision Detected 2026-10-08` = **191 px**（右边缘推到 x201），
`clip=false`；`最近录像`、`Saved Clip`、`保存片段` 三个串也各自量过。**双方向 × 双语言都量**，
不是只量当前语言就说它不截断（R67 那次就是这么漏的）。

## 二、原生走查：JS 解析器非要看完整文件， native 只需要 SEI 那几百字节

`src/dashcam-mp4.js` 的 `parseMetadata()` 只能吃整份 ArrayBuffer —— 它得逐个视频 NAL 数帧，
才知道某条 SEI 属于哪一帧。所以旧链路是：手机端为了画一条速度曲线，把 26–53 MB 的 mp4
**完整下载进页面**，再解析。真机实测单段 `front`（53,344,776 字节）光下载+解析 6.3 秒，
而且这 6.3 秒是跟六路直播流抢同一条回环 HTTP 服务。

新增 `src-tauri/src/sei_reader.rs`（Rust，桌面/安卓同一份源码）：

- `scan_top` / `child`：按 box 树找 `moov/trak/mdia/minf/stbl`，只认视频轨；
- `mdhd_timescale` + `stts_deltas`：算出每一帧的时间（v0 的 timescale 在 body+12，v1 在 body+20）；
- `walk_mdat`：在 `mdat` 里扫起始码，类型 1/5 各推进一帧，类型 6（SEI）走
  `strip_emulation_bytes`（去 `00 00 03` 防止措施字节）+ `decode_sei_to_raw`（payload type 5，
  0xFF 续长度），只把载荷和它对应的时间返回；
- 命令 `read_sei_metadata` 在 `blocking()` 里跑，返回 `Vec<SeiSample{time, payload}>`。

它刻意**复刻了 JS 解析器的宽松之处**（NAL 边界拿文件长度兜底、一个 sample 只算一个 VCL NAL），
因为对齐的目标是「它要替换的那个解析器」，不是 ISO 14496-12 的描述。

JS 侧接线在 `MetadataManager.readTelemetry` :3791：门是 `isTouchShellRuntime() && file.path`，
桌面永远走老 JS 路径；`readTelemetryNative` :3872 任何不对（没命令、抛异常、返回不是数组、
**或解码后条数比 native 给的少**）都返回 `null` 表示「请用 JS 路径」，
而空数组是**真答案**、不回落 —— 绝大多数录像根本没有 SEI，那种情况省掉整份下载才是最大的收益。
「解码后条数变少」这条判据是 fixture 逼出来的：150 条载荷全解码失败、全被丢掉，
一段有遥测的录像看起来就像没有遥测。

## 三、对齐：先逐位相等，才有资格比快

`devtools/r72-golden.js` 用**Node 跑线上那份 `dashcam-mp4.js`**（不改它）对 6 个 fixture +
4 个真片段生成 `{time, payload}` 基准；`devtools/seiharness` 用 `#[path]` **原样编译产品里的
`sei_reader.rs`**，`cargo test` 断言逐位一致。刚复跑：

```
sei/…-front.mp4: OK 150 samples in 18.4 ms, bit-exact, worstDecimalDelta=4.441e-16
real/…-front.mp4: OK 0 samples in 158.6 ms, bit-exact, worstDecimalDelta=0.000e0
all 10 targets match the JS parser
```

`worstDecimalDelta=4.441e-16` 不是「还差一点」，是**十进制打印的锅**：JSON 没有无损的浮点表示，
`0.1242` 写出去、读回来就差最后一位。基准里因此另存 `timeBits`（IEEE-754 的 8 字节小端十六进制），
断言的是 `to_bits()` 相等，不是 `==`。改成按位比之后 harness 全绿。

手机端再独立验一次（`devtools/r72-ab.js`：同一页、同一个文件，两条路径都跑，逐点比）：

| | 结论 |
| --- | --- |
| fixture 六路 | `bitExact: true`，150/150 点、`worstDt = 0`、`firstBadDecode = -1` |
| 真片段六路 | `bitExact: true`，两条路径都是 0 点（无 SEI），`worstDt = 0` |

## 四、账：每段计时

同一台模拟器、同一页、native 先跑（这个顺序对 native **不利**：它先把文件读进页缓存，
JS 侧因此蹭到热缓存，所以真实收益只会比表里更大）。

fixture（2.7–5.4 MB，每路 150 个遥测点）：

| 路 | 字节 | native | JS | 倍 |
| --- | --- | --- | --- | --- |
| back | 2,774,284 | 131.0 ms | 212.0 ms | 1.6 |
| front | 5,428,969 | 103.9 ms | 480.3 ms | 4.6 |
| left_pillar | 2,854,969 | 83.3 ms | 210.3 ms | 2.5 |
| left_repeater | 2,825,174 | 56.6 ms | 235.4 ms | 4.2 |
| right_pillar | 2,740,654 | 76.5 ms | 198.5 ms | 2.6 |
| right_repeater | 2,789,018 | 83.2 ms | 175.9 ms | 2.1 |
| **合计** | | **534.5 ms** | **1512.4 ms** | **2.8** |

真片段（`SavedClips/2026-10-08_07-30-59`，26.7–53.3 MB，无 SEI —— 这里量的就是纯读取成本）：

| 路 | 字节 | native | JS | 倍 |
| --- | --- | --- | --- | --- |
| front | 53,344,776 | 1421.3 ms | 6350.3 ms | 4.5 |
| back | 26,822,690 | 565.8 ms | 2210.4 ms | 3.9 |
| right_repeater | 27,184,668 | 995.3 ms | 1088.3 ms | 1.1 |
| left_repeater | 27,259,700 | 420.5 ms | 930.2 ms | 2.2 |
| right_pillar | 26,721,489 | 479.0 ms | 1151.9 ms | 2.4 |
| left_pillar | 27,781,902 | 429.2 ms | 1210.2 ms | 2.8 |
| **合计** | | **4311.1 ms** | **12941.3 ms** | **3.0** |

装 1.2.106 之前，1.2.105 上冷跑的 JS 基线是 front 1516 ms、back 1259 ms（单段整份下载）。

## 五、回落不是写在注释里的

`devtools/r72-fallback.js` 在**文件确实存在**的前提下把 `nativeInvoke` 换成必定 reject 的桩：

```
{"nativeWhileBroken":null,"readerCount":150,"firstTime":0,"midSpeed":21.827999114990234,
 "nativeAfterRestore":150}
```

原生失败 → `readTelemetryNative` 返回 `null` → `readTelemetry` 仍旧给出 150 个点，
速度曲线照常画；把真命令换回去后同一路又拿到 150 条载荷。
（探针里 `restored:false` 是我自己的读数顺序错了：那行判据写在 `finally` 还原之前，恒假。
用「不存在的文件」测回落同样没意义 —— 那种情况 JS 路径也 404，只能证明 `null`，证明不了遥测活着。）

## 六、速度曲线：按像素验收，不按 class

`devtools/r72-graph.js` 除了几何还把 canvas 的像素数一遍（`getImageData` 非透明像素占比、颜色直方图）：

| | 容器 | canvas 位图 | 已画像素 | 上色比 | 点数 |
| --- | --- | --- | --- | --- | --- |
| 竖屏 | 392×30 | 1029×78 | 60,506 | 0.754 | 150 |
| 横屏 | 843×30 | 2212×78 | 130,058 | 0.754 | 150 |

`hasNum: true`、`tele: 150`、`span: 6.2903`。真片段（无 SEI）在横屏测出 `visible: false`、
`paintedPixels: 0` —— 这是**正确行为**：没有遥测就不该有一条假装存在的曲线占着 30 px。
目视复核 `devtools/r72-graph-shot.png`（竖屏：顶部 `💾 保存片段 2026-10-09` + 进度条上方一条完整蓝色速度带）。
注意控制层会在几秒后自动隐藏，截图前先点一下画面把它唤醒，否则量到的是 `opacity: 0`。

## 七、已知与欠账

- fixture 的 `front`/`right_pillar` 在模拟器里报 `MEDIA_ERR_DECODE`（`error.code = 3`）。
  真片段六路全播得动（`err: null, rs: 4`），所以解码器没问题，是 `devtools/r72-mksei.js`
  造的合成码流不合规。**本轮的验收不靠它播放**（遥测走文件、头部走文本），但下次要用 fixture
  验播放相关的东西，得先把生成器修好。
- 导出链路里还有一处整份文件读取（`script.js:10993` 的 `parser.parseMetadata()`，选项「乙」）。
  这轮没做：它不在速度曲线路径上，改它要连着验导出，风险不对等。
- HUD 数值复测：`playEvent` 之后档位 `D`、速度 `16`（截图里那个 `P 0 km/h` 是播放前的默认态）。

## 八、交付

- `TDashcamStudio/Tessera-1.2.106-android-universal.apk` —— 27,908,771 字节，
  md5 `0389e75a8fbf46bde3778cbabae1a70a`。已装模拟器复测（年份/曲线/回落/双方向）。
- 1.0.1 … 1.2.105 全部原样留在根目录，没删没挪。改动仍未提交（clone 没有 git 凭据）。

# R71 —— 竖屏顶部那一行不是「重合」，是地址被挤没了：先量出 26 px 的缺口，再决定谁让步（1.2.105）

用户报的是：「非全屏下，竖屏，顶部内容太挤了，内容显示不全，顶部左边『图标+保存片段+日期+时间』的格式，
和顶部右边的内容有些重合？顶部右边有视频的日期和精确的画面发生时间。」

## 一、先核实「重合」——它没重合，但用户的眼睛没错

`devtools/r71-p1.js` 在 412×915 竖屏、真事件（`SavedClips/2026-10-08_07-41-59`）上逐元素量
`getBoundingClientRect` + `scrollWidth` vs `clientWidth` + 两两水平重叠：**chip↔地址间隙 6 px、
地址↔时钟间隙 8 px，重叠 0 px**。所以「重合」在几何上不成立。

但「内容显示不全」是真的，而且原因正是用户猜的那个方向 —— 一行里出现了**两个**日期时间，
于是左边那个（chip 尾巴的 `10-08 07-30`）和右边那个（时钟的 `2026-10-08 07:31:02`）在抢同一段宽度，
被抢空的恰好是夹在中间、唯一不可替换的信息：街道。地址栏 `scrollWidth 125 > clientWidth 101`，
屏幕上读作「📍 杭州市 · …」。**两个日期挤掉了一条地址** —— 看着像重合，实际是重合的两件事把第三者压扁了。

## 二、账：需要 418，可用 392

`r71-p5.js` 的做法是**在当前这个包里把旧的 flex 规则重新注回去**（`.header-left{flex:0 0 auto}`、
`.header-center-info{flex:1 1 auto;min-width:0}`、`.header-location{max-width:none}`）+ 手写回旧的
完整时间戳，这样「改之前」是一台机器上刚量的数，不是记忆里的数：

| | chip | 地址（想要 / 拿到） | 时钟 | 需要合计 | 可用 |
| --- | --- | --- | --- | --- | --- |
| 改前 | 157 完整 | 125 / **101**（丢「文三路」） | 114 | **418** | 392 |

缺口 26 px，而**谁挨这 26 px 完全由 flex 属性决定**，不是设计：`.header-center-info` 是这一行里唯一
`flex: 1 1 auto; min-width: 0` 的可缩项，`.real-time-clock` 又写着 `flex-shrink: 0`，
所以地址独自吸收了 100% 的损失。`.header-left` 是 `flex-shrink: 0` —— 它当时根本不让。

## 三、用户定的两条规则（AskUserQuestion）

1. 日期时间重复两次，先去掉哪一侧的日期？→ **右边只留时分秒**（chip 已经说了哪天，时钟去说没人说的秒）；
2. 地址比现在更长时谁先被截断？→ **地址优先，chip 先让**（chip 的尾巴是日期，地址的尾巴是用户真正要找的那条街）。

## 四、实施（JS 两处 + CSS 一处，桌面侧逐字没动）

- [script.js:7225](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js#L7225)
  `updateRealTimeClock()`：先算出桌面一直在用的完整 `stamp`，`!isPhoneLayout()` 原样返回；
  手机档改成 `HH:MM:SS`，**但拿 `currentEventStartTime` 和显示时间比一次「同一天」** ——
  跨过零点日期立刻回来（`10-09 00:00:03`），因为那一刻「哪天」不再有任何地方回答。
  省下的 67 px（114 → 47）就是整条街道的钱。
- [script.js:14830](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js#L14830)
  `setHeaderEventName()`：Tesla 的文件夹名把冒号也写成横线，`slice(5,16)` 出来是 `10-08 07-30` ——
  一行里两个日期、还都长得像日期，正是「看着重合」的另一半。手机档把末段两个横线换回冒号
  （`10-08 07:30`），桌面保持原样。同一处 `slice` 在自动续播 toast 里也有一份，那个不在顶部行、
  不跟时钟贴脸，本轮**没动**。
- [styles.css:4591](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/styles.css#L4591)
  手机档把让步顺序反过来：`.header-left` 从 `flex-shrink:0` 改成 `0 1 auto` + `min-width:64px`
  （64 = 图标 + 一部分字，仍然点得到，因为这个 chip 就是抽屉的入口），`.header-center-info` 改
  `flex:0 0 auto` 拿自然宽度，`.header-location` 加 `max-width:46vw` 让超长地址**在自己的盒子里**
  出省略号而不是把时钟顶出屏幕，`.header-event-name` 补 `min-width:0` —— `nowrap` 让它的
  min-content 等于整串字，不加这条 flex 父元素只会溢出。

## 五、装机复测（1.2.105，`r71-p3.js` / `r71-p4.js` / `r71-p5.js`，全部读真实文本与真实盒子）

| 场景 | 时钟 | chip | 地址 | chip↔地址 | 右缘 / 412 | 截断 |
| --- | --- | --- | --- | --- | --- | --- |
| 改前（同包内注回旧规则复现） | `2026-10-08 07:31:02` | 157 完整 | **101**/125 | 6 | 396 | 地址丢街道 |
| 竖屏 · 同一天 | `07:31:02` | 157 完整 | 125 完整 | 27 | 375 | 无 |
| 竖屏 · 跨过零点 | `10-09 00:00:03` | 157 完整 | 125 完整 | 10 | 392 | 无 |
| 竖屏 · 英文 | `07:31:02` | 173 完整 | 125 完整 | 19 | 383 | 无 |
| 竖屏 · 超长地址（想要 307） | `07:31:02` | **135**（先让） | 190（盒内省略号） | 6 | 396 | 只截尾巴 |
| 桌面分支（`isPhoneLayout()=false`） | `2026-10-08 07:31:02` | **133**（先让） | 125 完整 | 6 | 396 | 日期在，地址不在挤 |
| 横屏 915×412 | `07:31:02` | 157 完整 | 125 完整 | — | 剩余 556 | 无 |

六档里 `.main-header` 高度都是 97（横屏 73），**一行没变高**，只是不再吞字。
零点那档单独说明测法：`newTime` 是从 `currentEventStartTime + getCurrentTime()` 推出来的，
所以「把基准挪一天」是**无效测试**（比较的两侧一起动，日期永远回不来）。`r71-p4.js` 改成
基准 `23:59:50` + 把 `continuousPlayer.getCurrentTime` 钉在 13 s，才真的越过日界线。
播放中的秒数走表另测：`playAll()` 后每 600 ms 采一次，`07:31:00 → 07:31:02` 跟着播放头 1→4 s
在走，六次全是 `HH:MM:SS`，没有一次带日期。
目视复看 `devtools/shots/r71-top-crop2.png`（竖屏）与 `r71-land-crop.png`（横屏）。

### 交付

- `TDashcamStudio/Tessera-1.2.105-android-universal.apk` —— 27,870,979 字节，
  md5 `fbcc1b6eb300e748643e46132dafd283`，已装 `emulator-5554`（`versionName=1.2.105`）。
- 1.0.1 … 1.2.104 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。

# R70 —— 把 R69 那两条「要量过再动」的账量清：HUD 默认角落的可行区间，和禁用行的真实对比度（1.2.104）

R69 结尾留了两条账，都写着「不许凭直觉挪」：一条是 pill 默认落点压住宫格第一格的「前视」角标，
一条是 `r69a-06-panel.png` 里「亮度：跟系统」看着像被灰掉但**没查实**。本轮只做这两条，
外加一条查过之后决定不动的。改动全在 CSS（四条），JS 一行没碰，桌面侧逐字没动。

## 一、HUD 默认角落：先量出可行区间，再挑落在正中的那个数

`devtools/r69-p11.js` 第一版作废 —— 它用 `setLayout('grid6')` 找六宫格，而**这个布局名根本不存在**
（六宫格是 `'grid'`），于是量到一堆 `915×2034`、`35×25` 的中间态格子。`r69-p12.js` 换成 `'grid'`
并在每次 `setLayout` 后等 450 ms，数据才可信。横屏 CSS 视口 915×412，画面区从 y 73 起：

| 布局 | 「前视」角标带（视口 y） | 角标尺寸 |
| --- | --- | --- |
| `grid`（六宫格） | 90 … 110 | 34×20 |
| `grid4`（大小窗 / 四路） | 90 … 110 | 34×20 |
| `single` | 81 … 101 | 34×20 |
| `picture-in-picture` | 81 … 103 | 34×20 |

再量两端：第一行格子的底在视口 185（面积相对 112），控制条层从视口 120 起归 `video-controls-overlay`。
pill 高 53、展开卡高 70。设面积相对顶边为 T，则

- 下界（躲开角标）：`T + 73 ≥ 111` → **T ≥ 38**；
- 上界（展开卡不越出第一行格子）：`T + 73 + 70 ≤ 185` → **T ≤ 42**。

可行区间只有 38…42 这 5 个像素，取正中的 **40** —— 不是「挪两个像素试试看」，是两端各留 2 px 余量的那个数。
旧值 8 让 pill 落在 81…134，把 90…110 的角标**整块**盖住（680 px² 的标签一个像素都不剩）。

改的就一行：[styles.css:6466](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/styles.css#L6466)
横屏手机档的 `top: var(--hud-top, 8px)` → `40px`。拖动记住的位置照旧优先 —— 实测把 `--hud-top`
设回 `8px`，computed 立刻回到 81，所以想贴顶的人仍然能贴顶，这条只改**默认**。

顺带否决了一个更漂亮的方案：把 pill 钉到画面行底下（角标之上、格子之外）。它看着更干净，
但控制条层拥有视口 y ≥ 120，钉到底就等于钉进进度条里。

装机复验（`devtools/r70-p2.js`，真事件 + 真角标，四种布局 × 折叠/展开）：

| 布局 | 折叠 | 面板矩形（视口） | 角标带 | 覆盖 |
| --- | --- | --- | --- | --- |
| `grid` | pill | 8,113,78,53 | 90..110 | 无 |
| `grid` | 卡 | 8,113,201,70 | 90..110 | 无 |
| `grid4` | pill / 卡 | 同上 | 90..110 | 无 |
| `single` | pill / 卡 | 8,113,78,53 / 201,70 | 81..101 | 无 |
| `picture-in-picture` | pill / 卡 | 8,113,78,53 / 201,70 | 81..103 | 无 |

最小间距是 113 − 110 = 3 px（六宫格那两档），单路和大小窗有 12 / 10 px。目视在
`devtools/shots/r70-crop-pill.png`、`r70-crop-card.png`：「前视」完整可读，pill 和展开卡都在它下面。
竖屏不受这条影响（媒体查询只在横屏），复测面板仍钉在画面下方 y 624 的抽屉位。

## 二、「亮度：跟系统」：确实是被灰掉的，而且灰到了读不出

现象查实了，两半都对：`updateBrightnessRow()`（[script.js:13731](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js#L13731)）
在 `pct === 100` 时 `btn.disabled = true` —— 这是设计，点它没有可撤销的动作 —— 而
`.control-btn:disabled { opacity: 0.4 }` 把整棵子树一起压暗。

关键在于**分组透明要折进字色里量**，不能只读 `color`。折完之后的真实比值（12.48 px 的说明文字，
AA 底线 4.5:1）：

| 台阶 | 浅色板 `rgb(255,255,255)` | 深色板 `rgb(31,33,40)` |
| --- | --- | --- |
| .4（现状） | **2.47** | **3.25** |
| .55 | 3.79 | **4.84** |
| .60 | 4.42 | 5.50 |
| .65 | **5.20** | 6.22 |
| .75 | 7.34 | 7.83 |

同一块面板上没禁用的邻行「详细数据」是 16.71 / 12.87 —— 差距不是观感，是 2.47 对 16.71。

为什么单给这一条开恩：它是 R67 那轮加的东西里**唯一把「这个窗口现在要多少亮度」写下来的地方**，
禁用态恰恰出现在「跟系统」这个最需要被读出来的状态。做法沿用底部动作条 `--tab-idle-opa` 的成对写法：
新增 `--row-disabled-opa`，浅色 .65、深色 .55（各自最低过 AA 的那一阶），只作用于
`html.touch-ui .header-right .control-btn:disabled`（[styles.css:8487](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/styles.css#L8487)）。
桌面那条 .4 原样留着 —— 上游 APP 的 toolbar 就是一片淡灰，那是它的样子。

装机复验 `devtools/r70-p1.js`（面板真开着，两套主题各量一遍）：浅色 2.47 → **5.20**，
深色 3.25 → **4.84**；目视 `r70-crop-row-light.png`、`r70-crop-row-dark.png` 里这行不再是「像没加载完」。

## 三、查过之后决定不动的一条

`applyHudGeom()`（[script.js:3673](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js#L3673)）
有两条提前 `return`（拿不到尺寸 / 判据不在画面内），返回时**不擦**之前写进元素的 `--hud-left/--hud-top`，
于是旧角落会留着。R69 的 p6 探针看到过一个「幽灵角落」，怀疑就是这里。
本轮顺着读了一遍：两条 bail 都要 `hudTouchGeom` 先被填过才有旧值可留，而填它的那次拖动本身就会写新角落，
用户走不出这个组合 —— p6 的幽灵是探针自己把 `hudState` 置 null 造成的，不是页面状态。
**不改**：为一个只有探针能造出来的场景加清理，等于往两条已经很容易抢的地方再塞一次写。

## 四、本轮踩到的假信号（都记下来，别再交一遍学费）

1. **⋮ 面板关着量对比度 = 必然假通过。** 抽屉收起时整棵子树 opacity 0，任何比值都塌成 1:1，
   看着像「读到 1」而不是「没读到」。探针必须先真点 `#tabMoreBtn`，再断言 `.header-right.active`，
   不满足就 abort，不许继续读数（`r69-p8.js` 就是这么把一条健康读数测成失败的）。
2. **只注入用变量的规则、不注入变量定义，会得到一个假的「修好了」。** `opacity: var(--row-disabled-opa)`
   在令牌未定义时按 initial 落成 1，比值直接冲到 16.71。装机前的注入式预验必须把 `:root` /
   `body.dark-theme` 的令牌一起注。
3. `readTelemetry()` 返回的是**每帧一条的数组**，不是 `{speed}` 那种对象；拿 `.speed` 当判据会把
   健康的 fixture 判成「读不到」。
4. **`.has-data` 不等于有数字。** 这条最阴：没侧车 telematics 的 SavedClips 事件，面板只写地名，
   照样挂 `.has-data`，但 `hudHasNumbers()` 是 false → 折叠压根不参与 → 量到的 143×58 是既不是 pill
   也不是卡的第三种尺寸，`covered: []` 白过一轮。判据要用 `hudHasNumbers()`，探针要把 `hud-folded`
   类一起打出来。
5. 横屏下 `#openSidebarBtn` 是 `visibility: visible` 但盒子为 0，`tap-el` 报 `TAP_SKIPPED`；
   抽屉收起时列表整排在 x = −302，直接点卡片会点到屏幕外（那次 `TAPPED … at css -156,199` 什么都没打开，
   但 `video` 元素已经存在，很容易误判成「事件加载了」）。判据看 `.player-area` 上有没有 `empty`。
6. 后台构建和前台构建同时跑会抢同一个 `target` 目录：那次后台任务报 exit 1，日志只有三行、
   没有任何错误文本。构建只走一条通道。

## 五、交付物（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.104-android-universal.apk` —— 27,853,827 字节，
  md5 `4ae881b9dfefb3989d476fd042c43c21` —— 本轮完整包（HUD 默认角落 8→40、⋮ 禁用行过 AA），
  已装 `emulator-5554` 复验（真点击开面板、真点击 pill、横竖屏各一遍）。
- 1.0.1 … 1.2.103 全部原样留在根目录。全部改动仍未提交（clone 没有 git 凭据）。

## 六、还欠着的

1. 速度曲线的 I/O 仍然是**按段整读 MP4**（本轮只把感知延迟从十几秒压到 ~150 ms）。真要省的是流量和
   首段等待，得让本地 HTTP 支持 Range 或让 Rust 侧只回 SEF 那一箱 —— 属于结构性改动，单开一轮。
2. 小米 14 真机的「复制诊断」每路数字仍然没拿到（R65 的模拟器 A/B 只覆盖了同一条手势序列那一对）。

# R69 —— 速度曲线的「等一会儿」拆成两个根因，外加一轮全方面巡检（1.2.101 → 1.2.103）

用户原话：「速度曲线也改了。同时排查各个方面的bug。」

## 一、速度曲线：先把一趟加载量开，再决定动哪一层

`devtools/r69-probe.js` 把一次曲线加载拆成三步，用真片（`SavedClips/2026-10-08_07-41-59/…-front.mp4`，53 MB）在模拟器上实测：

| 步骤 | 实测 | 是谁 |
| --- | --- | --- |
| `fetch` 整个 MP4 | 2531 ms（第二次 2318 ms） | 走 APP 内本地 HTTP，读的是**全文件** |
| MP4 box 走一遍找 SEI | 35 ms | 纯内存扫描 |
| protobuf 解码 SEI | 0 ms（这段 SEI=0） | 不是瓶颈 |

延迟 99% 在第一行。旧代码把八个段**串行**下载完才画一次，所以「等一会儿」= 十几秒的静默；
而 box 走查和解码加起来不到 40 ms，根本没有优化的必要。

第二条根因和下载无关，是**启动竞态**：`initializeProtobuf()` 是不 await 的启动副作用
（`protobuf.load("dashcam.proto")` 要几百毫秒），冷启动后立刻点开的第一个片子，扫描到 SEI 时
`SeiMetadata` 还不存在，于是解码出 0 条、曲线不显示 —— 而且旧代码不会重试，只能等下一个片子。
这就是「有时候要等很久、有时候完全没有」的两个来源。

### 改了什么（只走 `isTouchShellRuntime()` 这条门，桌面路径逐字没动）

1. **1.2.101 — 等就绪，而不是错过**：`MetadataManager.waitForProtobuf(3000)`（[script.js:3393](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js#L3393)），
   手机端扫描前 `await` 它（12621）。拿到就继续，超时也继续（那就真的没有 proto，交给错误兜底）。
2. **1.2.102 — 逐段发布 + 先清旧曲线 + 一条令牌**：`loadSpeedGraphForEvent`（[script.js:12606](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js#L12606)）
   进门前先 `clearSpeedGraph()`，每读完一段就调 `publishSpeedGraph()`（12653）画一次；
   `this.speedGraphRun` 是自增令牌，被后一个片子顶掉的旧扫描 `stale()` 立刻返回，不会把上一个片子的曲线
   盖回来。x 轴取自 `segmentDurations`，第一字节之前就齐了，所以曲线是在**固定画框里从左往右长出来**，不是反复重算坐标。
   桌面保持原样：不清、不逐段画、只在最后画一次。

### 实测（`devtools/r69-verify.js`，1.2.103，三段合成片子）

| 第几次画 | 时刻 | 已收段数 | 采样点数 |
| --- | --- | --- | --- |
| 1 | 151 ms | 3（占位） | 60 |
| 2 | 1557 ms | 3 | 120 |
| 3 | 2080 ms | 3 | 180 |
| 4 | 2085 ms | 收尾 | 180 |

`span 180`、`visible true`、`canvasPainted 60622`（有像素的格子数）、`samples 180`、`seiCache` 里三段都在。
第一笔在 151 ms 就出来了 —— 用户看到的「等一会儿」变成「先有一条 Growing 的曲线」。

### 顺带查出来的第二个 bug：旧曲线盖在新片子的时间轴上

`devtools/r69-stale.js`：A = 60 s 合成片，B = 真 53 MB 片（时长 18.27 s）。在 B 的读取还在飞的时候截图：

```
awaited A   114 ms  visible:true  span:60  painted:126168
mid         532 ms  visible:false span:0   painted:0   tapOnAsPeakWouldSeekTo:17.96
awaited B  5292 ms  visible:false span:0   painted:0   bSamples:0
```

修法之前，`mid` 那一行是「屏幕上还画着 A 的曲线，而 `totalDuration` 已经换成 18.27」。
`seekFromSpeedGraph`（[script.js:7117](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js#L7117)）用 `totalDuration` 换算、用 `speedGraphSpan` 判可用，
所以旧曲线 + 新时长 = 在 A 的峰顶点一下，把 B 推到 17.96 s（几乎片尾）。现在 `mid` 是干净的空白，
`awaited B` 之后仍然是空白 —— 因为这个真片**确实没有 SEI**（`bSamples 0`），不画才是对的。

## 二、全方面巡检：六条改掉，四条查过之后否决

每条都先复现再动手，改完装机（1.2.103）用真点击/真滑动复测。

### 1. 扫描循环造出一个「没有文件的段」（12129）

原来先 `event.segments.set(minute, {files:{}})` 再判断这文件属于哪一路；不属于任何一路（比如 `-bonus`、
非相机名）时那个段就留在表里空着。方法末尾的「空事件过滤」看不见差别：卡片把这一分钟算进了时长、
时间轴把它当成 60 秒的黑缝播过去、而它排在第一段时卡片连精确到秒的起点都丢了，只显示整分。
现在是先认相机、认不出就 `continue`（`getCameraType` 判据在前，创建在后）。

### 2. 「开始导出」连点两下 = 两次导出请求（19254）

`peStarting` 在 `finally` 里释放（19302），所以异常路径也不会把按钮永久锁死。
`devtools/r69-p3.js` 用**行为**验证，不是读标志位：把 `window.nativeAsk` 换成 250 ms 后才回话的假门面，
按名字只数 `startExport`。

| 判据 | 实测 |
| --- | --- |
| 三次并发调用 → 桥请求数 | `asksWhilePending 1`（`after-bc asks=1 flag=1`） |
| 全部落定后 | `asksAfter 1`、`flagAfter false` |
| 构造一条会抛异常的路径 | `t2 "threw:probe: captions too wide"`、`asksOnThrow 0`、`flagOnThrow false` |
| 抛完之后还能不能用 | `restored true`、`recovered true`（下一次调用 `asks=1`） |
| 正向基线 | `planOk true`、`baseline {bridge:true, cams:1}` |

第一版探针是**空跑**：`phoneExportPlan()` 因为区间非法（`起点必须早于终点`）在 `plan.error` 处就返回了，
每个数字都读成「通过」其实什么都没测。补了正向基线并让假门面 404 式回空串才有效。
另一个坑：不带名字的计数器把 `notificationsAllowed` 也数成了导出请求，读成「一次点击问了 2 次」。

### 3. 桌面默认布局被手机键覆盖（12360）

`localStorage['tdashcam.layout']` 是手机端写的，但桌面分支也读了它当默认值；窄窗口（<768 px）本来就会
被 `PHONE_LAYOUT_QUERY` 判成手机档。改成默认值只在 `isTouchShellRuntime() && isPhoneLayout()` 时取手机键，
否则回到上游的 `'legacy'`。

### 4. 三条桌面泄漏：记住进度 / 播完自动下一个 / 点卡片跳起点（14760、14791、15066）

这三处原来只看 `isPhoneLayout()`，于是**桌面上把窗口拖窄**就会开始写 `tdashcam.position.*`、
播完自动翻页、点卡片跳到事件起点。都补上 `isTouchShellRuntime()`。

`devtools/r69-p2.js` 是行为验收 —— 顶层函数声明可写，所以把 `isTouchShellRuntime` 绑成 `() => false`
就是「同一个窄窗口，但没有手机壳」：

| 判据 | 桌面（假） | 手机（真） |
| --- | --- | --- |
| 记住进度：`tdashcam.position.*` 键数 | `desktopMapKeys 0` | `touchMapKeys 1`，`touchStored 12` |
| 播完自动下一个 | `desktopAdvanced false` | `touchAdvanced true`，落在 `SentryClips/2026-10-07_03-12-00` |
| 点卡片跳起点（播放头位移） | `desktopMoved 0.19`（等待期间的自然走带） | `touchMoved 8` = `savedPosFor 8` |

`0.19` 这一条值得留个记号：判据是「写没写」，不是「数字大不大」—— 播放头在等待时自己会走，
所以小位移是**噪声不是证据**，必须和「键数为 0」一起看。

### 5. 下拉刷新失败也报「找到 N 个事件」（14261）

`rescanCurrentFolder` 原来无条件 toast。扫描失败（拔了 U 盘、文件夹没了、读错误）时屏幕上的列表
一张没变，toast 却报一个数字，等于宣布了一次没发生的刷新。改成 `if (scanned)` 才报；
失败分支已经有自己的句子。验收：`r69-p1b.js` 基线 「找到 7 个事件」，失败路径静默。

### 6. 地址与坐标进 HTML 没转义（1604 / 5090 / 12342）

`event.json` 里的 `city` / `street` / `lat` / `lon` 是 Tesla 写在卡上的**外部数据**，直接拼进了卡片和
标题栏的 `innerHTML`（`lat`/`lon` 还拼进 `data-lat` 属性）。加了 `escapeHtmlText()` 包住这四处。
`r69-p1.js` 用一段带 `<img src=x onerror=…>` 的假 city 走真实渲染路径：`v2InjectedImg false`、
`v2ShownAsText true` —— 标签按文字显示，DOM 里没有被注入的元素。

## 三、查过之后**否决**的四条（都记下来，防止下轮重复劳动）

| 疑似 bug | 为什么不是 |
| --- | --- |
| 「第 4–6 张卡片重复出现 💾保存片段 角标」 | 那是无抽帧结果卡片的 `.no-thumb` 占位，不是角标重复。读 DOM 就否了。 |
| 「导出面板打开时区间是 00:00→00:00，不可用」 | `showClipModal()`（19474）本来就拒绝在非法区间打开面板，先 toast「请先选择剪辑范围」。是我探针直接调 `showPhoneExportModal()` 绕过了前置条件。 |
| 「竖屏画面被压扁、底部动作条掉出屏幕」 | 旋转后第一张 `screencap` 抓到的是**旧的、还没重绘的表面缓冲**。重测 `visualViewport 412×915 scale 1`、`innerHeight 915`、底条 rect `[14,824,384,58]`，4 秒后第二张正常。 |
| 「⋮ 设置 tab 点了没反应」 | `case 'more'`（13150）是 **toggle**，我的序列点了两下 = 开完又关。单点一次读到 `header-right active` + 25 行。另外 `#tabMoreBtn` 在抽屉开着时是 `visibility:hidden`，`tap-el` 会报 `TAP_SKIPPED`，要先关抽屉。 |

## 四、1.2.103 真手势验收

| 项 | 结果 |
| --- | --- |
| 真点击卡片 | 打开并播放（`r69a-01.png` 横屏播放中） |
| 真下滑刷新 | toast 「找到 7 个事件」，7 张卡片都在 |
| 真点 `#peStartBtn` 导出 | `Tessera_2026-10-07_03-12-00_2-5s_1c_720x1600.mp4` 366,664 B，面板关闭 + 成功 toast；**区间进了文件名**（`_2-5s_`）是本轮加的 |
| 横屏 / 竖屏 | `r69a-01`、`r69a-04-portrait2.png` 排版正常 |
| ⋮ 面板 | `r69a-06-panel.png`：25 行齐全，含「亮度：跟系统」与播放起点 / 主题两段控件 |
| JS 错误 | `viewer.recentErrors` 非良性 **0** 条（只有 5 条 `VIDEO load failed: http://tauri.localhost/` 资源记录，红条 `display:none`） |

## 五、交付物（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.101-android-universal.apk` —— 27,851,459 字节（protobuf 就绪等待）。
- `TDashcamStudio/Tessera-1.2.102-android-universal.apk` —— 27,852,611 字节（逐段发布 + 清旧曲线 + 令牌）。
- `TDashcamStudio/Tessera-1.2.103-android-universal.apk` —— 27,853,251 字节，md5 `3167f0618530641296c222b9cce9cc1d` —— 本轮完整包（巡检六条），已装 `emulator-5554` 复验。
- 1.0.1 … 1.2.100 全部原样留在根目录。全部改动仍未提交（clone 没有 git 凭据）。

## 六、留下的欠账（下轮处理）

1. **HUD pill 默认落点压住宫格第一格的「前视」角标**（`left/top: 8px`）。R66 选左侧是因为「详细数据」板钉在右边，
   但这条**要量过再动**：横屏下 pill 矩形 vs `.camera-label` 矩形 vs ⋮ 矩形，三组几何一起看才有资格改 CSS，
   不许凭直觉挪几个像素。
2. `r69a-06-panel.png` 里「亮度：跟系统」看着像被灰掉了 —— 本轮只记录现象，**没查实**（可能是当前值就等于
   「跟系统」时的选中态样式，也可能真是禁用）。
3. 速度曲线的读盘本身仍是「每段拉整份 MP4」：逐段发布把**感知**延迟从十几秒压到 150 ms，但下载总量没变，
   还是那条「把 SEI 解析挪出播放路径 / 只读需要的字节」的旧欠账。

# R68 —— 横→竖旋转瞬间行车数据卡片撑满整屏：角落的归属权从 inline 换成「只有横屏读得懂」的属性（1.2.100）

用户原话：「横屏变换竖屏开始阶段，行车数据的hud卡片会变得很大，然后恢复正常」。

## 结论：不是动画，是两个媒体档在抢同一对边

R66 让手指能把卡片搬走，落点写成了行内 `left:224px; top:43px`。行内声明压过本文件里任何一条规则，
所以旋转后竖屏那一档（`(max-width: 768px)`）想做的两件事都落空了：

- 它用 `top:auto` + `bottom:var(--meta-bottom)` 把长条钉在画面下方 —— `top` 被行内值抢了回来；
- 于是这个 `position:absolute; height:auto` 的框**上下两端同时被定死**，CSS 规定它就被拉伸到两端之间。

`left` 与 `right` 同理（行内 left + 竖屏档的 `right:8px`），所以宽度也被拽了一遍。

修复前的实测（`devtools/r68-hud-arm.js` 逐帧采样，真旋转、非页面内模拟）：

| 时刻 | 事件 | 卡片尺寸 |
|---|---|---|
| 2586 ms | `resize` 派发 | — |
| 2901 ms | 第一帧形变 | **180 × 544**（原本 143 × 58） |
| 3283 ms | 400 ms 防抖的清理跑完，行内值被清掉 | 58 × 396（竖屏长条，正常） |

也就是「变大约 680 ms，然后恢复正常」，和用户描述逐字对得上。

## 走过的弯路：先假设 resize 排在媒体查询前面

第一版修法顺着「`resize` 事件里同步清掉行内值」写，代码写完、语法过了，然后用自己写的活页面模拟
（`devtools/r68-patchsim.js`）验了一次，**被自己的假设打脸**：形变帧出现在 t=811，而 `resize` 到
t=1154 才派发 —— 安卓 WebView 上布局/媒体查询先变，事件后到。同步清理再快也追不上那 340 ms。
这一版整体撤回，`resize` 监听（`script.js:3495`）恢复成原样。

## 最终修法：让横屏那一档只读自己写的属性

- 行内不再写 `left`/`top`，改写 `--hud-left`/`--hud-top`（`applyHudGeom()` 与拖动 `move()` 两处）；
- 横屏块改成 `top: var(--hud-top, 8px); bottom: auto; left: var(--hud-left, 8px); right: auto;`
  （`styles.css:6453`）—— 显式写 `auto` 是因为短窗桌面上这两档会同时命中，光靠默认值不够；
- 竖屏块一行没动；`body.camera-zoomed` 那条让位「还原」按钮的 46px 也换成 `var(--hud-top, 46px)`，
  记住过位置就留在原地，没搬过才让位。

关键在于：**一个别的档位根本不读的属性，无论 JS 什么时候清理都来不及，也拉不伸任何东西**。
`releaseHudTouchGeom()`（`script.js:3637`）仍然负责在离开横屏时把属性收回去，但那是卫生，不是正确性。
桌面侧完全没碰：`applyHudGeom()` 的门禁是 `hudFoldAvailable()` = `isTouchShellRuntime() &&
isLandscapePhoneLayout()`，桌面永远写不进这两个属性，它那条「拖到面积的百分比」的行内路径照旧。

## 复测（1.2.100 成品包，真旋转 + 逐帧采样）

| 场景 | 结果 |
|---|---|
| 横→竖，卡片停在 (224, 43) | 旋转后第一帧即 **396 × 58** 落底部，12 s 内没有任何一帧超过 58 高 |
| 横→竖，卡片先被手指搬到 (345, 119) | 同上，第一帧 **396 × 58** |
| 横→竖，临时显出完整读数行（201 × 70 那张） | 第一帧 **396 × 60**，仍无 544 那一帧 |
| 竖→横回切 | 3 s 后回到记住的角落 (345, 192)，尺寸 143 × 58，不闪回默认角 |
| 手指拖动 | 跟手，落点写进行内属性 + `localStorage`，全程尺寸不变 |
| 未搬动 + `body.camera-zoomed` | `top:46px left:8px`（fallback 生效）；未缩放时 `top:8px left:8px` |
| 折叠 pill（临时加 `hud-folded`） | 147 × 54，仍停在记住的角落 |
| 外观 | 两张 `cdp-shot` 截图核对：横屏小卡压在画面上方留白带，竖屏一条完整读数行贴在四宫格下方 |

一处诚实的边界：模拟器上的 fixture 全是合成片，**没有 SEI 遥测**（`currentMetadata.length === 0`），
所以「有读数的那张卡」是靠临时把 `#metadataItems` 显示出来量的几何，不是真数据驱动的那条渲染路径。
拉伸机制与内容无关（两端被定死的绝对框），但真机上如果还有别的观感问题，这一条要补测。
顺带：正因为没遥测，`hudHasNumbers()` 恒假 → 折叠 pill 在这台模拟器上不会自动出现，R66 的折叠验收
也只能靠临时加类。

## 交付

- `TDashcamStudio/Tessera-1.2.100-android-universal.apk` —— 27,850,627 字节，本轮唯一改动就是上面那三处。
- 1.0.1 … 1.2.99 全部原样留在根目录，没删没挪。改动仍未提交（clone 没有 git 凭据）。
- 旧账未动：pill 的默认落点（`left/top 8px`）仍压住横屏宫格第一格的「前视」角度标（R66 记过）。

# R67 —— 提亮把面板钉死在系统滑块之上：基准换成现读 + 四道出口（1.2.98 → 1.2.99）

用户原话：「深色模式的界面虽然变成暗色了，但是屏幕灯光会变得异常亮，不会和系统屏幕亮度保持一致，
请排查。跟随系统、浅色模式也排查一下 bug。」

## 先说结论：不是主题，是亮度那条手势的窗口覆盖

三条主题路径逐个量过，深色模式是清白的：浅色→深色那一下，`dumpsys display` 的
`Display Brightness` 一动不动停在 `0.39763778`（= 滑块 102/255），随后把滑块 102→20→102 来回拖，
面板两次都跟着走。`applyTheme()` 全篇没有写过任何亮度。三态（跟随/浅色/深色）× 系统昼夜也复验过，
含状态栏图标颜色（`devtools/theme-light-topbar.png` / `theme-dark-topbar.png` 两张裁图）。

唯一的写手是 R30-1 那条提亮手势，而它坏在两个叠起来的性质上：

1. `WindowManager.LayoutParams.screenBrightness` 是**窗口级绝对值，压过系统滑块**。只要它不是
   `BRIGHTNESS_OVERRIDE_NONE`，用户去拖系统滑块就完全没有反馈。
2. 那个绝对值是 JS 在**手势开始时**用缓存的 `systemBrightnessFraction` 一次算死的。缓存只在开机和
   `pointerdown` 刷，所以「提亮 → 之后拖滑块」这条最常见的路径永远不会重算。

实测复现：提亮后面板钉在 `0.719`，系统滑块从 245 拖到 25 一动不动；`tdashcam.brightness=1.4` 撑过
了一次落盘 + force-stop，冷启动 `setBrightness(stored)` 又把覆盖**装回去**。而且没有任何可见出口 ——
⋮ 面板里没有这一项，`复制诊断` 里也没有这一行。用户能看到的只是「界面变暗了但灯异常亮」。

## 改了什么：把「算好的绝对值」换成「比例」，基准交给原生现读

方向上不是去补缓存的刷新时机（那是给症状贴膏药），而是**取消 JS 侧的基准概念**：

- **A · 桥换契约**：`setScreenBrightness(绝对值)` → `setScreenBoost(比例)`。JS 只交
  `(level-1)/(BRIGHTNESS_MAX-1)` 这个 0~1 的比例（负数＝交还），Kotlin 在**写的那一刻**现读
  `systemBrightnessFraction()` 再插值 `base + (1-base)*t`。同时挂 `ContentObserver` 监听
  `Settings.System.SCREEN_BRIGHTNESS` **和** `screen_brightness_float` 两个 key —— 自动亮度开不开
  决定了滑块写的是哪一个，只监听一个会在自动亮度下聋掉。`screen_brightness_float` 不是每个 API
  都有公开常量，所以是字面量。
- **B · 只持久化无害的那半**：`setBrightness()` 落盘时 `Math.min(1, clamped)`，读取时同样夹一次。
  遮罩那半（变暗）是截图里看得见、用户能自己看穿的东西，继续记；提亮那半是对面板的一次要价，
  「那段太暗的录像早看完了」，不该过夜。老版本留下的 `1.4` 在读取处就被夹回 1，装不回去。
- **C · 给一个看得见的出口**：⋮ 面板「主题」行下面加一行 `#brightnessRowBtn`，文案由
  `updateBrightnessRow()` 写（跟系统 / 提亮 n% / 调暗 n%），中性时 `disabled`，点一下
  `resetBrightnessToSystem()` 交还 + toast + 轻触感。`复制诊断` 加一行
  `brightness=level=… boost=on|off sys=… stored=…` —— 下次这条线自己会说话。
- **D · 退后台就撒手**：`onPause()` 把覆盖写回 `BRIGHTNESS_OVERRIDE_NONE`（只在确实有 boost 时），
  `onResume()` 走同一个 `writeScreenBrightness()` 重新解析。别的 APP 的界面不该被这个窗口的要价照亮。

桌面侧一行没动：新逻辑全在 `isTouchShellRuntime()` 门后的那条手势和 Kotlin 里。

## 验收（模拟器 emulator-5554，真滑动 / 真点击，滑块 102/255 → base 0.4）

判据是 `dumpsys display | grep "^  Display Brightness"` —— 这版 `dumpsys window windows` 里
`screenBrightness` 一行都 grep 不出来，别拿它当证据。

- **A**：画面左 1/3 真上滑 (116,180)→(116,120) → `level=1.3306`、`t=0.5511`，面板
  `0.73064226`，与 `0.4+0.6×0.5511=0.7306` 逐位对上。**然后**把滑块 20 / 245 / 102 来回拖，面板
  `0.5860869` / `0.98249173` / `0.73064226`，三条全等于 `base+(1-base)×0.5511`（base 依次
  0.0784 / 0.9608 / 0.4）。旧版这一步是钉死不动的，这条就是本轮的判据。
- **B**：提亮中 `stored` 已经是 `"1"`；等 6s 落盘、force-stop、冷启动 → `Display Brightness`
  回到 `0.39763778`（纯滑块值），`level:1`。反向半段也守住：先下滑到 `0.665` 再重启，
  `stored=0.665`、`level=0.665`、⋮ 行「亮度：调暗 67%」都在。
- **D**：`level=1.1976`（面板 0.5976141）时按 HOME → `0.39763778`；`am start` 回到 APP →
  `0.5976141` 自己装回去。
- **C**：⋮ 面板真点击 (675,184) → `level:1`、行「亮度：跟系统」且 `disabled`、面板
  `0.39763778`。`复制诊断` 抓到 `brightness=level=155% boost=on sys=0.400 stored=1`。
  外观两张截图（`devtools/r67-panel-dark.png` / `r67-panel-dark2.png`）—— 按 R42 的教训，
  这里必须目视，光看 JS 状态不够。

## 顺带收的两条

- **⋮ 行的文案被截断**：深色截图上「屏幕亮度：已提…」露了馅。量过格子里的文本框只有 **104 CSS px**
  （格子 148，图标占掉一截），`屏幕亮度：已提亮 130%` 要 133px。改成「亮度：跟系统」75 /
  「亮度：提亮 130%」96 / 「亮度：调暗 67%」89，英文 `Brightness: system` 106px 也差 2px，
  于是英文只留数字（`Brightness: auto` / `Brightness: {n}%`），中文有地方放词。取舍照旧：
  栅格节奏优先，截断交给缩短文案。
- **横屏高度预算没被挤爆**：加这一行后 ⋮ 面板 `scrollHeight 208 == clientHeight 208`，
  23 个可见行、不滚。

## 已知边界（本轮刻意不动）

- 手势只认**画面**（`.video-container`，`touch-action: none`）。从画面下方的 `.player-area`
  （`manipulation`）起手的竖滑会被浏览器认领成页面滚动，`pointermove` 走 3 条就
  `pointercancel`。这不是 R67 引入的，R63-8 的验收笔记里已经记过一次同一现象；改它要动 R60-2
  定下来的 `touch-action` 分区尺子（祖先的声明会往下相减，元数据抽屉要在 player-area 里滚），
  风险大于收益。行文案的提示语已经写的是「在**画面**左缘向上滑」，和实际生效区一致。
- 提亮是**这个窗口**向系统要背光，模拟器/真机上限不同；`sys` 读不到时 Kotlin 退 0.5。

## 交付

- `TDashcamStudio/Tessera-1.2.98-android-universal.apk` —— 27,850,943 字节，A/B/C/D 四条全部
  按上面的数字实测通过。
- `TDashcamStudio/Tessera-1.2.99-android-universal.apk` —— 同上 + ⋮ 行文案缩短（不截断）。
- 1.0.1 … 1.2.97 全部原样留在根目录，没删没挪。改动仍未提交（clone 没有 git 凭据）。

# R66 —— 横屏行车数据卡片：折叠成 pill（A）+ 手指搬走（B）（1.2.95 → 1.2.97）

用户原话：「横版多路视屏播放的时候，左上角行车数据的 HUD 卡片遮挡视频画面」，选定「结合方案 A 和 B 来实现」。

## 改了什么（一条判据都没碰桌面）

- **A 折叠**：横屏手机档（`isLandscapePhoneLayout()` = `isPhoneSurfaceLayout()` + 那条 media query）
  且卡片有读数时，默认只留 档位 + 车速，其余（刹车、转向灯、右列、`.metadata-secondary`）不画。
  卡片右缘挂一枚 20px 圆片 ▾/▸ 作折叠开关，`::after` 把命中区撑到 40×40。
  实测遮挡从 `201×70` 降到 `78×53`（宽 −61%）。
- **A 的出口**：整颗 pill 可点，点一下展开（`initHudDrag` 的 `end()` 里 `dragged` 为假且处于折叠态
  → `toggleHudFold()`）。不要求手指命中那枚 20px 的边片 —— 边片在 pill 上会被坐标漂移坑到。
- **B 拖动**：`initHudDrag()` 只认手指（`isTouchPointer`）、只在横屏手机档、只在卡片没被 `collapsed`
  收起时接手；`setPointerCapture` + 像素几何，落点写进 `tdashcam.metaHud` 的 `{left, top}`
  （相对 `.player-area`）。桌面那条 `mousedown` 路径按原样 `if (isPhoneLayout()) return;` 让路。
- **B 的尺子**：`hudClamp()` 左/右各留 `hudEdgeGuard()` = 手机 28px（系统返回手势带），上 4px。
  装不下的时候（`inside:false`）干脆不认这个位置，不硬钳成半截出屏。
- 折叠与拖动都只由 `html.touch-ui` 把关：一个矮窗口能命中同一条 media query，桌面从来既没有
  折叠开关也没有手指，它继续拿整张卡片。

## 实测抓到的两个坑

**1. `touch-action` 被中间的滚动容器截断，拖动只有一个 `pointermove` 就死。**
卡片自己写了 `touch-action: none`，可第一次真拖（`adb shell input swipe`）事件流是
`pointerdown → pointermove(1) → pointercancel`，落点停在钳位边界 `(28, 12)`。
沿命中目标往上走一遍才发现：`.metadata-content` 是 `overflow-x: auto` 的滚动容器，而
`touch-action` 只 intersect 到**最近的滚动容器**为止 —— 手指落在读数上时，卡片的 `none` 根本没被读到，
第一下移动被判成横滚。把 `none` 也写在 `.metadata-content` 上之后，同一条 swipe 走到
`pointermove × 37 → pointerup`，落点 `(578, 22)` 并写进 storage。横屏这一行本来就没溢出，
关掉它的横滚不损失任何东西。

**2. 折叠态拖到右边缘，展开会溢出屏幕。**
钳位按当前宽度算，pill 宽 78 → 允许 `left: 809`；展开成 201 宽后右缘到 1010（视口 915），
▸ 边片掉到 1016 —— 点不着了。修法：`syncHudFold()` 末尾补一次 `applyHudGeom()`，
每次折叠态变化都按新宽度重钳。1.2.97 装机复测（真点击，非页面内模拟）：pill 停在钳位右界
`left: 809`（`809..887`），点开展开 → `left: 687 / right: 888 / 边片 894`，全在 915 之内；
右缘正好停在 pill 原来的右边缘上（向左生长），storage 里仍存 809，折回去还在原地。
`applyHudGeom()` 自己带 `hudTouchGeom` 门（:3625）：没拖过就只把 `is-moved` 摘掉，
桌面的 `left: 8px / top: 10%` 样式几何原样保留。

## 验收（模拟器 915×412，真点击 / 真滑动）

fixture 是 ffmpeg 生成的，**不带 Tesla SEI**，所以 `currentMetadata` 恒为 0、卡片只会走到
「位置」兜底分支，永远进不到 pill 的那个状态。用 `devtools/probe-r66-seed.js` 注入三条
`updateDisplay()` 读的那种形状的读数（`vehicleSpeedMps` / `gearState` …）——
判据、类名、computed style、几何全是真的，只有数字是摆的。

| 项 | 读数 |
| --- | --- |
| 默认折叠 | `hud-folded`，`78×53`，档位 `D` + 车速 `40`，刹车/转向/右列 `hidden` |
| 点 pill 展开 | 去 `hud-folded`，`201×70`，车速字号 `1.35rem → 32px`，`stored.folded:false` |
| 点 ▾ 边片折回 | `78×53`，`aria-expanded:false`，焦点仍在 `#metaFoldBtn`（键盘可达） |
| 真滑动搬家 | `pointermove × 37` → `rel (578, 22)`，`stored {left:578, top:22}` |
| 不泄漏成画面手势 | 一趟 287px 横拖前后：时钟 `17.68` 不变、事件不变、布局仍 `grid4` |
| 转竖屏 | 卡片回底部抽屉 `(8, 624) 396×60`，内联 `left/top` 清空、`is-moved` 摘掉，storage 保留 |
| 转回横屏 | 折叠 + 落点 `(448, 105)` 原样回来 |
| 重装 + 冷启动 | `tdashcam.metaHud` 读回 `{left:163, top:105}`，pill 直接落在原位 |
| 浅色主题 | 深色药丸 + 白字，压在视频上可读（`devtools/r66-2-pill-zoom.png`） |

**关键几条在 1.2.97 的成品包上重跑了一遍**（不是页面内改状态）：`adb install -r` + 重给
`MANAGE_EXTERNAL_STORAGE` + 横屏 + seed，真点击折叠/展开；真滑动 `(300,160) → (700,120)` 拿到
`pointerdown × 1 / pointermove × 31 / pointerup × 1`、无 `pointercancel`，落点 `rel (633, 23)` 写进
storage；反向一趟 420px 横拖 `(660,120) → (240,140)` 之后六路时钟逐字节不变
（`0.96,0.36,0,0,0,0`）、布局仍 `grid4` —— 搬家没有泄漏成画面手势；`am force-stop` + 冷启动后 pill
仍 `(633, 96) 78×53`；转竖屏回底部抽屉、转回横屏 pill 原样回来。外观另用 `screencap` +
`devtools/cropxy.ps1` 目视（`devtools/r66-4-pill-zoom.png`、`r66-4-card-zoom.png`）——
只读 JS 状态不算过（R42 的教训）。浅色主题与键盘可达两行只在 1.2.95/96 上看过，代码未变。

## 交付

- `TDashcamStudio/Tessera-1.2.95-android-universal.apk` —— 27,849,151 字节，A+B 主体。
- `TDashcamStudio/Tessera-1.2.96-android-universal.apk` —— 27,849,279 字节，修坑 1（滚动容器上的 `touch-action`）。
- `TDashcamStudio/Tessera-1.2.97-android-universal.apk` —— 本轮完整包，含修坑 2（折叠切换时重钳）。
- 1.0.1 … 1.2.94 全部原样留在根目录，没删没挪。全部改动仍未提交（clone 没有 git 凭据）。

## 已知限制

- **pill 的默认落点仍压在第一格的角度标上**（1.2.97）：折叠把遮挡从 `201×70` 压到 `78×53`
  （宽 −61%），但默认位置就是老位置 —— `.player-area` 左上角，横屏宫格第一格 = 前视，
  那颗「前视」角标正好在 pill 底下。不是回退：1.1.x 的整张卡片压得更多。方案 B 给了出口
  （手指一拖就走，落点记住），没再动默认坐标 —— 默认值一改，每台手机的第一眼都变了，
  而这个位置对竖屏、对桌面、对单路放大都是合理的。真机上若仍嫌碍事，下一轮把默认改成
  左上角偏移一格（或按 `isPhoneSurfaceLayout()` 给个不同的 `left`）。
- **换段后仍有 ~2.7s 静止（模拟器）**（1.2.91）：`loadstart` 在 `ended` 同刻就派发，metadata 550ms
  回来，随后 `waiting`→`canplay` 爬升约 4s；本地流侧只需 43–301ms，缓冲起来之后解码 ratio 1.00。
  所以这段等待判在 WebView 元素/模拟器解码，不在 JS。不加 prefetch、不换元素，
  等小米 14 真机复测 —— 真机若无此现象则纯属模拟器失真。
- **双击分区认画面矩形，亮度与竖滑切相机仍从屏幕边算起**（1.2.91）：同一条 `pictureGestureBand()`，
  两种认领边界。横屏画面宽 132px，若拖动也只认画面就只剩 44px 的调光条，没法稳定命中；
  判据分别在 `setupPhoneCameraSwipe` :13012 与亮度 :13101 的注释里写明，不是遗漏。
- **双击分区与右侧上下滑只在单路画面生效**（1.2.83）：栅格（含大小窗）里 `layoutMode !== 'single'`，
  左/右双击与上下滑全部直接 return，画面中间那一记仍是"放大那一路"。有意的取舍 —— 栅格里拇指落点
  对应的是"选哪一路看"，把它改成 ±10 秒就没有快速放大某一路的手势了。入口写死在
  `setupPhoneDoubleTapZones` :12573 / `setupPhoneCameraSwipe` :12649，手势面板页脚也说了。
- **横屏胶片条被 clamp 成 30px，帧只够认个大概**（1.2.83）：竖屏能拿到 64px，横屏整条预算就是
  速度曲线让出的那一行。`max-height:30px`（styles.css:1465）是"画面比例不可谈判、条高可以谈判"的结果；
  模拟器上另有 `OPTION_CLOSEST_SYNC` 那层失真（见下面一条）。
- **精细微调要把手指抬到条面上方 6px 以外**（1.2.83）：死区是为了贴着条拖时不误触，
  但横屏控制簇很密，抬手过头会离开 `.progress-container` 的命中范围 —— 靠 `setPointerCapture`
  维持，视觉上手指已经压在倍速/曲线那一带，容易让人以为拖断了。气泡的琥珀描边（`.time-preview.fine`）
  是唯一的状态提示。
- **`ModernVideoControls` 的时间读数绑死 front 那一路**（1.2.83 盘点出，未改）：
  `this.player = this.multiCameraPlayer.players.front`（script.js:5536），`timeupdate`/`play`/`pause`
  三个监听全挂它（:5734-5740）。事件缺 front、或切到别的路之后，底部计时与播放态不再跟当前画面。
  安卓上 front 几乎恒在所以多年没暴露；iOS 那轮必须改成跟随 `activeCamera` 重绑。
  本轮新增的逐帧/±10 秒不受影响（`stepBySeconds` 走 `continuousPlayer`）。
- ~~**浅色主题下底部动作条未点亮的三格对比度不够（1.2.77 起可见）**~~ —— 1.2.78 已修：
  未点亮透明度改成主题变量（浅 `.75` ≈5.18:1、深 `.62` ≈6.10:1 不变），见第五十九轮。
- **画面手势只认落在 `.video-container` 上的那一记；从宫格缝隙或播放器 chrome 起手会被当成页面 pan**
  —— 1.2.80 实测：六宫格时从格缝起手上滑，`brightnessLevel` 纹丝不动，同样的位移从画面上起就正常。
  原因是 `.player-area` 声明的是 `manipulation`（只去掉双击缩放等待），竖向仍然交给页面；而格与格之间
  那几像素、以及控制条周围的空隙正好落在这面上。想让它满屏响应得把 area 也声明成 `none`，代价是住在
  同一块 area 里的元数据抽屉行再也滚不动（祖先的 `none` 会减到每个后代头上），所以本轮**没有**这么改。
  换流之前这些位置同样不响应（识别器自己看 `e.target` 判画面），差别是现在这层取舍由 CSS 写死了 ——
  想改手势归谁，改声明而不是改判据。
- **左缘「右滑打开抽屉」在开着手势导航的机器上到不了 app**（1.2.80 实测）：`swipe 8 900 → 420`、
  `60 → 420` 都不开抽屉，而再往外一记（物理 x=70，约 27 CSS）直接把 app **甩回桌面** —— `dumpsys window`
  里 `mCurrentFocus` 变成 `nexuslauncher`。系统把手势导航的左缘约 24dp（这台机器 ≈63 物理像素）划给
  返回手势，它先于 WebView 拿到；app 自己的 `edgeThreshold` 是 30 CSS（≈79 物理），和那条区基本重叠。
  这条不是 1.2.80 的回归（Touch Events 时代同样吃系统的），入口一直是抽屉按钮 / 底部那一格，功能没丢；
  但**核对「右滑打开」不能只在开手势导航的模拟器上测**。iOS 侧会更糟（系统导航手势区是全高的 20~30pt），
  已经记在上面 iOS 差距清单那条划掉的账里。
- ~~事件搜索框匹配的是原始字段，中文类型名搜不到~~ —— 1.2.6 起 `eventMatchesSearch()` 把
  `videoListComponent.getEventTypeLabel()` 的标签也并进匹配串，搜「哨兵」与搜 `sentry` 等价。
- 第一版只做播放 + 元数据；剪辑/导出在 1.1.9 之前一直没做，因为安卓上没有本地 FFmpeg（sidecar 只随
  桌面端打包），Canvas 录屏兜底画质不保证。用户后来明确要求恢复（任意几路组合或单路、分辨率可选），
  现走**原生 Kotlin MediaCodec**，见上一节。仍**不做**的是：导出时带音轨（特斯拉录像本身没有音轨）、
  转码整段视频、以及把导出结果自动分享出去。
- 导出走软件编码器时（模拟器 `c2.android.avc.encoder`）速度约 3~8fps，六路 280 帧要一分多钟；
  真机上若命中硬编会快很多，但**编码路数与机型解码器数量有关**，六路同时解码在部分机型上会失败，
  此时面板会直接报引擎的 error 文案。
- 模拟器的软件编码器只接得住 1920×1088，所以**模拟器上任何多路导出都会带「已按本机编码器上限缩小」**，
  每路尺寸被压到 300~540 宽。真机硬编能不能保住"每路 = 所选档位"（六路 720p 需要 3840×1440 的帧）
  仍未在小米 14 上验过；这一版只能保证摘要里写出来的就是实际会写进文件的尺寸。
- 详细数据卡片：竖屏与横屏四种布局实测都是 0% 压画面，但横屏是**踩着上限**做到的 —— 状态栏到画面行
  之间只有 28..82 共 54px，卡片五列 / 9px / 收紧 header 时高 46px（去掉 4px 上安全余量后刚好剩 4px 富余）；
  哪一档数值长到换行、或用户在系统里把字体调大，卡片就会超过 54px，退化成「贴顶压住画面行上沿」。
  横屏 9px 的字号也是为这个上限让的步。
  > 这条是 1.2.0 之前「横屏通栏长条」时代的账。1.2.3 起横屏也是可拖可缩放的浮框、且不再预留高度，
  > 54px 上限随之作废；现在框子被用户拖到画面上的任何位置都是允许的，代价由用户自己选。
- 特斯拉 `SavedClips` 里**没有 SEI 遥测**（实测 1487 个 NAL，类型只有 1/5/7/8，type 6 一个没有），
  所以这些片子上的卡片只有「无元数据 + `event.json` 的位置」，速度/档位/方向盘那套读数只有带遥测的
  目录才有。横屏 HUD 的显示条件也据此设成"有读数**或**有位置"，所以**缺 `event.json` 的目录里横屏卡片
  仍然是隐藏的** —— 这是有意的（空芯片浮在画面上没有收益）。
- 多路同放依赖手机硬解码器数量。默认四宫格一般没问题，六宫格在部分机型上会有某一路黑屏
  或报错——切两宫格或单路即可。
- 模拟器（x86_64 镜像）只给到 **1 个 WebView 解码器实例**：1.2.19 实测六宫格里只有 1 路
  `readyState` 到 4，其余五路停在 1，画面是黑的。这一条**不是本轮回归**（1.2.16 之前就是这样，
  见上面 `probe-r26-decoder.js` 的账），但它意味着模拟器上「播放」这一项只能验到单路，多路同步
  必须上真机。缩略图与胶片不受影响 —— 它们走 `MediaMetadataRetriever`，在 App 进程里解码，
  跟 WebView 抢的不是同一批槽位。
- 列表真帧与胶片格子取的是**最近的关键帧**（`OPTION_CLOSEST_SYNC`），不是精确的那一秒：要非关键帧
  就得从前一个关键帧一路解到目标时间，在六路同放的机器上是几秒级排队，`OPTION_CLOSEST` 曾让 1.2.17
  的胶片整列超时。同理，请求时间落在文件末尾之外时部分解码器直接答 `null`（不是最后一帧），所以取帧前
  先把时间夹到 `duration - 1500ms`，仍失败回退 0s。副作用：**每段最后 1.5 秒内的格子、以及比所属
  那一格短的文件**（时间轴是按名义 60 秒排格子的，实际文件可短可长），显示的画面会比标称时刻靠后或
  退回开头 —— 格子是用来认路的，差几帧不影响定位。
- CSV 导出和片段另存写到 `/storage/emulated/0/Download`。
- ~~「更多」面板那 14 格只有 `title`、没有 `aria-label`（底部胶囊条五个 tab 有）。~~ —— 1.2.21 起
  手机端可见的 12 个 ⋮ 控件全部补了显式 `aria-label`（实测 12/12），翻页控件也带标签。
- 导出布局编辑器的「恢复网格」在 `.pe-body` 这个滚动区的**最底下**（内容 535px / 视口 336px），
  不往下滚只露出 14px，点它会落到被裁剪的空白上（`elementFromPoint` 返回面板本身而不是按钮）。
  实测滚一下再点就正常。而**从画布区域起手的滑动不会滚动面板**——那只手被布局拖拽占着，
  所以「按钮看着在、滑不到」是这一块的第一个操作疑问，值得在下一版把 foot 行抬出画布的热区。
- 模拟器上验胶片有个固定失真：测试片是**竖屏 1080×2400**，比例 0.45，`cellWidth / 0.45` 早就顶到
  `applyFilmstripHeight` 的 64px 上限，所以模拟器上看不出「宽屏格子更矮」的效果。真机特斯拉的
  3.35:1 那条路才是这个夹角的实际工作区间。
- **装完 APK 后第一次冷启动可能弹 ANR**（1.2.21 装机后复现）：`/data/anr` 里栈停在
  `RustWebView.<init>` → `WebViewChromium.init`，CriticalEventLog 显示它距 `install_packages` 46 秒。
  这是 WebView 首次解包 + Chromium 初始化占住主线程，**不是本轮改坏的桥**。判据：`/proc/<pid>/task/<pid>/stat`
  的 state 是 `S`、`futex_wait_queue`，而 `KEYCODE_HOME` 仍能响应（说明只有这个窗口卡着）。
  处理：`am force-stop` + `monkey` 重启，重启后真点击立刻恢复正常。
- **验收截图会被系统 ANR 弹窗盖掉，且 DOM 探针完全读不出来**（1.2.51 横屏验收时连撞两次）：
  模拟器内存吃紧（`top` 显示 2.3/2.5GB used、swap 已用 1GB）时，logcat 里是
  `Reason: Input dispatching timed out … Waited 5006ms for FocusEvent(hasFocus=true)`，
  屏幕上多一层「特写 isn't responding」，而同一时刻 CDP 读面板几何**全部正常**（渲染进程没卡）。
  判据：`dumpsys window | grep mCurrentFocus` 是 `Application Not Responding`，且 `top` 里 App 根本不在 CPU 榜上
  （说明不是死循环，是主线程被饿住）。处理：`input tap` 点「Wait」→ `am force-stop` + `am start` → 重新真点击。
  **凡是截图里出现系统弹窗，这张图作废**，不能拿 DOM 读数代替目视核对。
- 日期选择器（flatpickr）1.2.9 起已在 `src/vendor/` 本地化，手机与桌面都不再依赖 CDN；仍走 CDN 的只有
  桌面端 FFmpeg WASM（懒加载，安卓用原生编码器，不在手机路径上）。
- ~~只支持内部存储路径；U 盘直读（OTG）不在本版范围内。~~ —— 1.2.12 起目录浏览器有一排「存储位置」
  chips，系统挂出来的每个卷（本机 / SD / U盘）都在里面，含 TeslaCam 的那颗直接指向那个文件夹。仍然
  绕不过去的是系统本身：**NTFS / ext4 格式的U盘安卓不挂**，OPPO / vivo / 小米 / 荣耀 要先在设置里开
  「OTG 连接」——这两种情况 App 会明说（`usbNotMounted`），不会只留一个空目录。
- 改弹窗样式时注意：弹窗配色一律走 `--modal-*` 变量（两种主题各一份值），不要再写 `body:not(.dark-theme)`
  这种单点覆盖 —— 历史上就是这么改出白底白字的。
- ⋮ 面板全两列之后，**320 CSS 的窄机只剩 3~4px 文字余量**：格宽 142.238、扣掉内边距 14 + 图标 18 + 间距 6
  还剩 104px，而英文最长那条 `Trigger border: on` 要 101px（中文最长是 `Switch to English` 95px，
  纯中文最长「连续播放：关」75px —— 1.2.51 起两条直选行改成轨道 + 短标签，网格里的长文案消失了）。
  系统字号放大到 1.03 倍以上就会出省略号。412 及以上余量约 37%，面板封顶 368px 使 458（小米 14）与 412 同形，
  所以这条只影响 320~360 这一档 + 放大字号的组合。
- 横屏 ⋮ 面板那套「5 列 · 图标 + 文字」栅格（1.2.51）**只在触屏设备生效** —— 门控是
  `(hover: none) and (pointer: coarse)`。桌面版把窗口缩到手机宽度时拿到的仍然是 44×44 纯图标方格，
  这是有意的（桌面版行为不动），但也意味着"缩窄浏览器看到的手机端"和"真手机横屏"不是同一张图，
  核对横屏排版必须上设备或模拟器，不能在桌面缩窗口看。
- ~~⋮ 面板**每点一次都会关掉**，只有两条直选行（播放起点 / 主题）例外……要收口的话得给这四个按钮
  单独 `stopPropagation`，不能改那条公共监听。~~ —— 第五十轮（1.2.60）已收口，这条账作废。现在挂在
  `document` 上的「点外面关闭」（`script.js:10532`）认 `.menu-choice, [data-keep-menu]` 两类并直接
  return：四枚切换型（连续播放 / 只看收藏 / 排序 / 触发标注）在 `index.html` 里带 `data-keep-menu`，
  两条直选行本来就是 `.menu-choice`，点它们都不关面板；一次性命令（抓帧 / 导出CSV / 复制诊断 / 关于 /
  换目录）仍然关，这是有意的。公共监听没动，桌面菜单也不受影响。
- 真机反馈目前只到小米 14（HyperOS）：布局/菜单/弹窗配色/状态栏遮挡已按反馈调整；存储权限那次已经通过
  （提示走的是「目录能读、里面没找到视频」这条分支），卡点转到 JS 侧遍历 —— 1.0.2 起扫描改到 Rust。
  「能否列出 TeslaCam、四路能否同步播放且可拖动进度」这两条仍未在手机上验证通过。

# R75 —— 「打开 APP 顶部一排图标闪现」+「每分钟的衔接处还是会闪一下」（1.2.112 → 1.2.113）

小米 14 一条反馈里包着两个缺陷，它们没有共同成因，所以分开量、分开修。

## 一、顶部闪现：先量出「闪了多久」，再决定动哪一层

`screencap` 抓不到一帧的闪（对同一次冷启动连拍十张，十张字节相同）；CDP 截图是事后取的，
也错过。仪器改成 `devtools/r75-header.mjs`：用 `Page.addScriptToEvaluateOnNewDocument` 在**页面自己的
脚本之前**装一个 rAF 采样器，每一帧记录 `#headerActionsGroup` 的 computed `display/visibility/opacity`、
自身盒子宽高、里面 `button` 的个数，以及 `header-collapsed / phone-boot / touch-ui` 三个类。
判据是「这一格用户有没有可能看见」，不是「某个类最后存不存在」。

- 1.2.111 读数：桌面图标行在冷启动里**画了 849 ms、9 帧**才被收走 —— 用户看到的正是这九帧。
- 修法两半，缺一不可：
  1. `styles.css:237` `html.phone-boot .header-actions-group { visibility: hidden; }`。类由 `index.html`
     `<head>` 里的内联脚本在 body 解析之前挂上，所以第一帧就已经是隐藏的（等 JS 起来再收 = 还是闪）。
     用 `visibility` 而不是 `display`：折叠检查要量这一行**自己的盒子**，布局在但不可见的盒子仍然答得上来。
  2. `script.js:11993-12001`：手机档在 `toggleSidebar(false)` 摘掉 `phone-boot` **之前**先同步跑一次
     `checkHeaderCollapse()`，再在 rAF 里补一次 —— 否则「类被摘掉」和「行被折叠」之间又露出一帧。
- 复测（成品包，reload 模式逐帧）：1.2.112 = 112 帧 / **0 帧画过**；1.2.113 = 178 帧 / **0 帧画过**。
  启动帧是 `disp=flex vis=hidden boot=1`，之后是 `disp=grid opa=0 collapsed=1`（那就是折叠成的 ⋮ 下拉，
  不是图标行）。`VERDICT: never painted`。
- 桌面一行没动：规则只在 `html.phone-boot` 下生效，桌面永远不加这个类。

## 二、衔接处：这一轮不猜，让 1.2.112 自己报数

R74 留下的那条「已知边界」（覆盖层在 7 s 截止时被掀开，而这一路还没出帧）在 1.2.112 自带的
`holds` 日志里被抓成真缺陷 —— `23360ms deadline rs=1 n=1`。同一份日志里还有两条，都是它自己说出来的：

1. **快照宽度写死 480 px**。宫格里 `480x1067 tile=195px up=1.07x` 还算贴；但竖屏单路／全屏
   （≈430 CSS px × dpr 2.625）拿到同一张 480 px 是 **2.3× 放大**。覆盖层比它接管的那一帧糊，
   交接瞬间是「由糊突然变锐」的跳变 —— 这正是「闪一下」的一种长相。
   改成 `heldFrameWidth(box)`（`script.js:5449`，常数在 :5434）：按**这块格子**的 CSS 宽 × dpr，
   下限 480、上限 1280。
2. **释放大多落在截止，不是落在第一帧**。`loadeddata` 有可能在监听装好之前就派发完，之后只剩 7 s
   兜底：1.2.112 里约 30 次释放中 **20 次是 `deadline rs=4`** —— 新段早就 ready 了，覆盖层还压在上面。
   改成 200 ms 轮询（`script.js:6226`）：看到 `readyState>=2` 就登记一次 `requestVideoFrameCallback`，
   等**真正呈现的那一帧**回来才掀；rvfc 只在换 src 之后登记，所以不会答上一段的排队帧（R74 的洞 3）。
   上限放宽到 21 s，且只要没报错、不是 `networkState===3`（NO_SOURCE）就一直续期。

验收（1.2.113 成品包，宫格六路跨 2 次换段，12 条释放记录）：

```
back  seg=1 3217ms frame via=poll        rs=4 n=1 512x1138 tile=195px up=1x
front seg=1 5395ms frame via=loadeddata  rs=4 n=1 512x1138 tile=195px up=1x
…（12 条全部 end=frame：via=loadeddata 8 / via=poll 4）
```

`deadline` 0 条、`rs=1` 交接 0 条、`up=1x`（195 × 2.625 = 512，正好落在设备像素栅格上）。
`seg=0 skip=no-metadata` 六条是**对的**：第一次预约时元素还没有元数据，那一刻本来没东西可拍，
拍一张黑图盖上去比不盖更糟。

`draw=` 那一栏 10–195 ms 单独查过：不是画布分配（同一台机器热身后新建画布 0.6–0.9 ms，
复用同一张 0.1 ms），是六路同时换源时解码/GPU 抢资源。这段同步阻塞发生在**写 `src` 之前**，
观感是「稍顿」而不是「黑」；要摊开它得把六路快照分到几帧，可那样排在后面的路就没有覆盖层了，
得连换段调度一起动。手机侧数字还没到，所以这条**刻意不改**，只留读数。

## 三、诚实边界，以及小米 14 上要回帖什么

模拟器六路时 rAF ≈ 1 Hz，**亚秒级的黑窗在这台机器上量不出来**。上面证的是「覆盖层什么时候撤、
撤的那一刻元素手上有没有帧」，不是「人眼看到几帧黑」。所以：

1. 四宫格连续播 **≥ 2 分钟**（务必跨过分钟线），⋮ → 复制诊断，把
   `holds (newest last, snapshot cut to its tile):` 那一整块贴回来。
   重点看有没有 `deadline`、有没有 `rs=1`、`up=` 是否 > 1.3、`ms=` 是否普遍 > 1500。
2. 若某次「仍然黑了一下」，说清第几秒、哪一格（角标名字就行）—— 那是这一路没出帧却被掀开了。
3. 顺带复验 R74 副作用：单路（大小窗／全屏）与 2×／4× 各跨一次衔接；以及**删除正在播的事件**，
   格子应回到「无信号」，不该留一张旧帧。

## 四、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.112-android-universal.apk` —— 27,913,059 字节，
  md5 `35f783c8ac1e3a846ae253b7fc9a1ecc`：顶部闪现修复 + hold 取证日志。装机逐帧复测
  `never painted`，就是它自报的日志抓出了上面两条。
- `TDashcamStudio/Tessera-1.2.113-android-universal.apk` —— 27,913,827 字节，
  md5 `dcc76bb88f5929d5c57edddba52f1068` —— **本轮完整包**（快照按格子宽度、200 ms 轮询按帧释放；
  装机复测 178 帧 0 画 + 12 次释放全 `frame`）。
- 1.0.1 … 1.2.112 全部原样留在根目录。全部改动仍未提交（clone 没有 git 凭据）。

## 五、本轮新增的假信号

- **`adb install -r` 之后立刻冷启动会把 APP 逼成 ANR**：1.2.113 第一次启动连吃两次
  `Input dispatching timed out … Waited 5004ms for FocusEvent(hasFocus=true)`，
  ANR 报告里进程 91–120% CPU、几乎全在 kernel；第二次启动直接干净、逐帧采样全过。
  宿主上还有一个 2.5 GB 的 gradle daemon 在收尾。判据：先看 `pidof` 与 `mCurrentFocus`，
  别把「刚装完的第一次冷启动」读成新包坏了 —— 1.2.113 的 Kotlin 与 Rust 和 1.2.112 逐字节相同
  （只改了 `script.js`），本来不可能引入 ANR。
- **CDP `Runtime.evaluate timed out` + 「app is not running」是探针假象的一种**：socket 名跟着 pid 变，
  `adb forward` 留着旧 pid 就会一直超时。先 `pidof` 再重新 forward。

# R76 —— 「不连贯、像中间缺了几秒钟」：这一轮只装仪器，不动播放（1.2.114）

小米 14 的第二条反馈拆开是三句话：衔接处还是会闪、画面不连贯、感觉中间缺了几秒。用户对「要不要提前解码下一段」
的回答是 **「先排查问题」**，所以 1.2.114 里**没有一条播放行为被改动** —— 只装了四本账，让 APP 自己把
「哪一秒从没被画出来过」写进 ⋮ → 复制诊断。

## 一、四本账，各自盯一条可能的成因

全部走 `isTouchShellRuntime()` 门，桌面一行不进（诊断块在 `script.js:15109-15127`）：

1. **`lost`（纠偏器向前写掉的画面）** —— `noteLoss()`（`script.js:6023`）每次真正执行
   `player.currentTime = refTime` 之前，先把「离开的位置、去的位置、差多少秒、为什么」记一条；
   原因三档在 `script.js:6010-6011`：`gap-band`（差距超过容差 ×4，直接升级成跳）、`glide-failed`
   （先加速滑过、没滑上）、`paused-align`（暂停态对齐）。每路累计在 `feedStats.lost / lostJumps`，
   并以 `L=秒/次数` 挤进 `describeFeeds`（`script.js:6124`）。
2. **`boundary-tail`（衔接处被砍掉的尾巴）** —— `noteBoundaryTail(cameras)`（`script.js:6057`）只在
   `continuousPlayer.isTransitioning` 为真时跑，量的是「这一路的文件还剩多少秒没播就被 `cleanup()` 拿走」。
   成因是结构性的：**推进事件的唯一触发是 `front` 的 `ended`**，其余五路在哪个位置全看运气。
3. **`axis`（时间轴记账 vs 文件真实长度）** —— `noteAxis()` / `describeAxis()`（`script.js:6505` / `:6522`）。
   `calculateEventDurations` 把每一分钟**按 60 s 记账、只实测最后一段**，所以只要真文件不是 60.000 s，
   误差按段数单向累积。同一 `index` 同一读数只记一次（`axisSeen`），否则拖动次数会冒充误差次数。
4. **`holds` 加上 `t=` / `ref=`** —— 覆盖层站着的时候，底下那一路自己走到几秒、事件钟又走到几秒
   （`script.js:6254` 起）。只有 `t=` 在涨才说明「内容在走但看不见」，也就是冻帧；`t=` 不动才是真的停。

## 二、三条机制都量到了（1.2.114 / AVD / 宫格六路 / 10 段事件自然跨分钟线）

读数全文留档 `devtools/r76-ledger-after-measure.txt`（64 行，用 `devtools/r76-read.js` 从跑着的那页现读）。
**这 9 条算术自检先过**（`devtools/r76-skip.mjs check`）：写 3.5 s 记 3.50、写 0.02 s 被 0.05 容差吃掉、
倒着写要记但记 0、`describeLoss` 汇总行、最新一条排最后、拖进度条不算丢、`boundary-tail == duration − currentTime`。

**(a) 「缺了几秒」= 纠偏器向前写，每一笔都是真丢的画面：**

```
back        seg=5  4.49->9.47  +4.98 gap-band
left_pillar seg=5  4.48->9.47  +4.99 gap-band
left        seg=5 13.70->16.33 +2.62 gap-band
right_pillar seg=9 8.97->17.93 +8.96 gap-band
total back=100.94s/24 left=104.52s/42 right=95.86s/34 left_pillar=123.33s/28 right_pillar=98.89s/27
```

停止那一刻的每路一行把因果钉死 —— 它**追了一路还是没追上**：

```
front          t=18.27 d=+0.00 q=83/160 w=147/0 k=2  c=0/0            （钟本身，L 项空）
back           t=11.38 d=+6.89 q=14/62 w=58/0  k=33 c=43/12 L=100.94/24
left           t=14.18 d=+4.09 q=1/28  w=69/0  k=53 c=73/22 L=104.52/42
left_pillar    t=16.87 d=+1.40 q=23/467 w=65/0 k=42 c=62/22 L=123.33/28
```

`front` 没有 `L=`，因为钟就是它 —— 落后的人只能靠「跳过几秒」来追一个比自己跑得快的钟。
单跳 2.4–9.0 s，正是用户说的「中间缺少几秒钟的画面」。

**(b) 「衔接处闪/缺一段」= 五路的尾巴被 `front` 的 `ended` 砍掉：**

```
back         seg=6  9.47->18.27 +8.80 boundary-tail
left_pillar  seg=6  9.47->18.27 +8.80 boundary-tail
left         seg=6 16.33->18.27 +1.95 boundary-tail
```

那 1.95–8.80 s 在盘上、在文件里，**永远不会被画出来**：任何覆盖层、滑行、hold 都救不了被拿走的源。

**(c) 轴记账（模拟器上是巨坑，真车上大概率是小坑）：**

```
measured=10 off60s=9 acc=-375.57s
i=1..8 real=18.27 book=60.00 d=-41.73   i=9 real=18.27 book=18.27 d=+0.00
```

AVD 的 fixture 每段 18.27 s 却按 60 s 记账，所以每跨一段轴就跑掉 41.73 s。真车文件 59.9/60.1 s 都有，
这项会缩到每段 ~0.05 s 量级 —— 它是**进度条读数与拖动落点**的误差源，不是这台机器上「缺画面」的主嫌；
谁能占大头必须由小米 14 上的同一份日志来定，模拟器说了不算。

## 三、覆盖层这边还量出一条：30 次交接里 7 次落在 `rs=1`

`holds` 全 30 条 `end=frame`、**0 条 `deadline`**（R75 的两项改法站住了），但：

```
right seg=6  7592ms frame via=loadeddata rs=1 n=1 t=1.31 ref=1.31
left  seg=6  8063ms frame via=poll       rs=1 n=1 t=1.31 ref=1.31
…（共 7 条 rs=1，其余 23 条 rs=4）
```

`via=loadeddata` 却读出 `rs=1`：rvfc 回来那一刻，元素已经从 HAVE_CURRENT_DATA **退回 HAVE_METADATA**。
判据只写在「settle 前再看一眼 `readyState`」这一条上 —— 掀开一张还没有帧的画面，就是「闪一下」的第二成因。
R75 报的是「12 次释放全 `frame`、`rs=1` 0 条」，因为那轮只跨了 2 次换段；把窗口拉长到 5 次换段它就出现了。
站着最长的是 `right_pillar seg=8 10922ms`、`left seg=7 9370ms`，`t=` 与 `ref=` 同步在涨 = 内容在走、画面冻着。

## 四、诚实边界：这台机器定不了谁占大头

模拟器六路时 rAF ≈ 1 Hz、全软件解码，`front` 自己就 `q=83/160`（丢一半）。所以 `L≈100 s` 是**这台 AVD 的数字**，
不能念成小米 14 的数字。外部探针 `devtools/r76-skip.mjs measure` 在这台机器上直接判不可用：五路在整个观测窗内
没有回到播放态，行读数 `head=null skip=null freeze=121947ms STILL-FROZEN-AT-END`、探针合计 0.00 ——
它测不到东西，不等于没丢东西。所以本轮只信 APP 自己的账本（算术自检全过的那本）。

## 五、候修三条 —— 全部未实施，等读数定序

1. **换段闸（barrier）**：跨分钟时事件钟不许跑在「最慢那一路已解码可播的内容」之前。
   收益 = 不再需要向前写 = 一帧不丢；代价 = 整宫格多停 1–9 s（这段正被覆盖层盖着，观感是「稍顿」不是「黑」）。
2. **只滑不跳**：把 `gap-band` 升级判据改成「落后就加速播完再归位」，永不 `currentTime` 前写。
   收益 = 该路内容完整；代价 = 它会把几秒重播一遍，观感是轻微不同步而不是缺内容。
3. **推进触发 / 轴记账**：`ended` 从「只看 front」改成「看最慢那路（带上限超时）」，救回 1.95–8.80 s 尾巴；
   `segmentDurations` 改用实测长度（只手机档；桌面 `calculateEventDurations` 不动）。

真机回帖只要一步：**六路宫格连续播 ≥ 2 分钟（务必跨过分钟线）→ ⋮ → 复制诊断**，把
`lost (…)`、`axis (…)`、`holds (…)` 三块整块贴回来。哪块大修哪块，顺序由数字定，不由我猜。

## 六、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.114-android-universal.apk` —— 27,916,195 字节，
  md5 `19491b9b7a402437554a775064df52e4` —— **本轮完整包**：四本账 + 诊断接线，播放行为逐条未动。
  模拟器已装机（`versionName=1.2.114`）、跨 5+ 次分钟线自然播放取到上面全部读数。
- 1.0.1 … 1.2.113 全部原样留在根目录。改动仍未提交（clone 没有 git 凭据）。
- 仪器与读数留档：`devtools/r76-skip.mjs`（自检 + 外部测量）、`devtools/r76-read.js`（现读四本账）、
  `devtools/r76-ledger-after-measure.txt`（本轮全文）。

## 七、本轮新增的假信号

- **注入页面的模板字符串里，注释不能写反引号**：注释是模板字面量的一部分，一个反引号就把整段截断，
  报出来是 `SyntaxError: Unexpected identifier 'seg'` / `missing ) after argument list`，看着像探针逻辑坏了。
- **`describeLoss` 的行格式是 `cam seg=N from->to ±sec why`**：拿 `from->to` 当相邻匹配会假失败（中间隔着 `seg=`）。
- **`continuousPlayer.isPlaying` 是 undefined** —— 播放标志挂在 `multiCameraPlayer.isPlaying`（`script.js:5504`）。
  读错的那一把不报错，它只是安安静静量一个暂停的播放器。
- **`seekToTime(0)` 之后播放器还是暂停**（`idx=0 t=0 frontPaused=true`）：量之前要 `playAll()` 并断言 `play:true`，
  否则「没有跳帧」是暂停的功劳。
- **`holds` 的 `rs=` 是释放那一刻现读的**：`via=loadeddata` 也能读出 1（元素退回 HAVE_METADATA），
  别把它当成「轮询走错分支」—— 它是另一条真缺陷的读数。
- **页里那条 `Uncaught ReferenceError: o is not defined @ :33:34` 无归属**：按「recentErrors 混良性」记录，不当线索。

# R77 —— 「看看诊断」：真机把排序翻了过来，唯一单向增长的是时间轴（1.2.115 → 1.2.116）

> **R78 更正**：本节第三节的第 1 条（`awaitAxisMeta`）与第七、九节里「一次只候一段」「下一次落到该段自动补上」
> 那几处已经**作废**。那个通道不只是慢，它会**永久丢掉**一段（真机 1.2.116 的账本亲口承认少了 `i=1`）。
> 看 `# R78`。本节其余部分（`rebookAxis` 的算术、`{i,t}` 印记、判据表）仍然有效。

小米 14 那份 1.2.114 的自报读数一落地，R76 留在「候修三条」里的优先级就**全部重排**了。
三条机制在真机上的表现和饿死的模拟器完全不一样，所以这一轮的结论先说，再说是怎么验的。

## 一、真机读数说了什么（六路宫格、跨 5 次分钟线）

```
feeds  front t=10.93 d=+0.00 rs=4 n=1 q=2/397 … 2896x1876
       right_pillar … q=2/386 … L=0.82/2
lost   back=0.16s/1 left=0.64s/3 right=0.69s/3 left_pillar=0.46s/2 right_pillar=0.82s/2
axis   measured=5 off60s=4 acc=+4.05s
       i=0 real=61.95 d=+1.95 · i=1 61.82 +1.82 · i=2 60.00 0.00 · i=3 60.81 +0.81 · i=5 59.47 −0.53
holds  30 条释放：全部 end=frame、rs=4、n=1、无 deadline、可见格子一律 up=1x
```

逐条对照上一轮在模拟器上量到的东西：

| 机制 | 模拟器（1.2.114，饿死） | 小米 14 | 判定 |
| --- | --- | --- | --- |
| 纠偏器向前写 `lost` | 每路 96–123 s、单跳 2.4–9.0 s、**随段数线性涨** | 每路 0.16–0.82 s、单跳 ≤0.48 s | **有界**，不是「每过一分钟丢一秒」 |
| `boundary-tail` | 1.95–8.80 s | ≤0.46 s | 同上 |
| 解码饥饿 | q 高达 83/160 | `q=2/397`（≤1.3%）、`w=* /0` 全程零 stalled | 手机没饿着 |
| 覆盖层交接 | 30 次里 7 次落 `rs=1` | 30 次里 **0 次**、0 deadline | R75 的两条修在真机成立（#301 降级为模拟器侧） |
| 时间轴 `axis` | acc=−375.57 s（假片段 18.27 s） | **acc=+4.05 s，且只增不减** | **唯一单向累积的那条** |

于是 R76 那份「三条修法候批」的排序变了：**换段闸（barrier）与「只滑不跳」这两条在真机没有依据** ——
它们要救的是每路 100 s 量级的丢失，而真机只有 0.16–0.82 s。硬上只会让六宫格每次跨分钟多停 1–9 s，
用看得见的停顿去换看不见的收益。

## 二、「掉帧」和「中间缺了几秒」在真机上是两件事

**(a) 「掉帧」= 衔接处那 0.27–1.20 s 的定格，不是丢帧。**
`q` 是 `droppedVideoFrames/totalVideoFrames`，真机 ≤1.3%；`w=waiting/stalled` 全程 0/0。解码器没丢画面。
观感来自覆盖层：六路**错开**释放，同一处分钟线上格子们各停各的 ——

```
seg=3  最迟一路 579ms → 1195ms      seg=4  542ms → 1031ms      seg=5  448ms → 1135ms
front  … 480x311 tile=0px up=0x      ← 宽度 0 的隐藏格子（当前布局只显示一路时的 front），无害
```

而**事件钟在这段时间里照走**（`t=` 在涨）。所以每处衔接有 0.45–1.1 s 的新内容确实播了、只是没被画出来，
再加上六块格子不同时刻恢复 = 「衔接处闪一下」+「画面不连贯」。这条要再往下就是**提前解码 / 换段延迟**的取舍，
模拟器量不出（它的换段本来就 4–8 s），需要用户定夺，见第四节。

**(b) 「中间缺少几秒钟的画面」= 时间轴的账，字面成立。**
头部那只钟是**文件名时间戳 + 那一路自己的 `currentTime`**（`updateRealTimeClock`，`:7670` 段），不依赖轴，永远说真话；
拖动气泡、进度条百分比、速度曲线点击、事件点、恢复上次位置，全都走 `segmentStartTimes` ——
而那条轴把每一分钟**记成 60.00 s**（`calculateEventDurations` 只实测最后一段）。真机五段的实测是
61.95 / 61.82 / 60.00 / 60.81 / 59.47，`acc=+4.05 s` 且**每段只朝一个方向加**。
于是拖到「12:03」落在「12:07」的内容上，中间那四秒**在拖动这条路径上永远不会出现** ——
不需要丢帧、不需要卡顿，画面本身没问题，是尺指错了地方。这也是为什么它随观看时长变长：第五分钟差 4 s，第十分钟就差 8 s。

## 三、这一轮做的：加载到哪一段，就把那一段的真实长度记回轴

`rebookAxis()`（`script.js:6582`）—— 每段在它**自己加载的那一刻**被实测，然后写回轴：

```js
durations[index] = real;                 // 只改这一段
let acc = event.segmentStartTimes[index];
for (let i = index; i < durations.length; i++) { event.segmentStartTimes[i] = acc; acc += durations[i]; }
event.totalDuration = acc;  →  controls.setTotalDuration(acc);
```

让它可以在**播放中**动手的那条性质（也是 `devtools/r77-axis-test.mjs` 的头一条断言）：
一段的起点 = 它之前所有段的长度之和，所以改 `index` 的**长度**只会挪 `index` **之后**的起点；
而 `getCurrentTime()` 读的是 `segmentStartTimes[currentSegmentIndex]` —— 那一格在修正瞬间不动，
传输钟、进度条把手、头部时钟都不会在用户眼前跳。

配套三件：

1. **`awaitAxisMeta()`（`:6529`）** —— 真机那份账有个洞：六段只量到五段。原因是
   `waitForAllVideosLoaded()` 的 4 s 上限到点就返回，那一路还在 `readyState 0`，`duration` 是 NaN，
   这一段就永远留着 60 s 的猜测。改成**去问文件**（挂 `loadedmetadata`），并且不用 `{once:true}` ——
   R74 的教训：handler 拒绝一个事件时同样会退订。回调要复核 `src` 没换、`currentSegmentIndex` 还是那一段才记账。
2. **`axisSeen` 每事件清空**（`loadEvent`，`:6483`）—— 它按段号建索引，不清就会让下一个事件继承
   「这段已经量过」，账本读起来像一本空账。
3. **剪辑/拖把手期间拒改轴**（`rebookAxis` 第 3 条判据）—— 剪辑区间、胶片条的帧、两个把手**都存在
   「当前这条轴上的秒数」**。给开着剪辑的用户挪尺子，会把他自己标的记号滑走、并重新解一遍他挑的那些画面。
   所以那一档里轴的修正被拒，账本如实记 `unrebooked`，`resid` 报「还Standing在尺子里没被抹平的偏差」。

账本头一行现在把修法自己的证据也吐出来（`describeAxis`，`:6611`）：

```
axis measured=10 off60s=9 acc=-375.57s patched=10 resid=+0.00s
```

`acc` 是**文件对 60 s 的偏离**，修法不改变它也不该改变它；判断修好没修好看 `resid`。

## 四、明确没做的，连同理由

1. **换段闸 / 「只滑不跳」**（R76 候修 1、2）—— 真机 `lost` 每路 ≤0.82 s、单跳 ≤0.48 s，是有界的；
   上闸要用每次跨分钟 1–9 s 的整宫格停顿去换。等真机出现线性增长再说。
2. **打开事件时一次测完所有段长**（原生 `mvhd` 探测 / 一路 `<video preload=metadata>`）——
   会付「点开事件到出画面」的延迟；而且播放中修正**更早**一段的长度会移动 `segmentStartTimes[current]`，
   显示中的钟当场跳。留着作为「一打开就要精确总时长」（导出时长预告之类）的方案。
3. **让六路覆盖层同时释放 / 推迟 `playAll()`** —— `requestVideoFrameCallback` 要播放**已启动**才答话，
   闸门只会撞到自己的上限；且 1.2.112 的 `deadline rs=4` 说明「压着一格已经就绪的画面」并不成立。
4. **`#301` 那条 `rs=1` 交接** —— 真机 0/30，模拟器 7/30。留在模拟器侧，不再当真机缺陷排。

## 五、验收（1.2.115 / AVD `tdashcam_phone` / 宫格六路 / 10 段假片段实测 18.27 s）

假片段每段 18.27 s 而轴记 60 s，是最好的放大镜：修好之后尺子必须**塌到磁带上**。

```
ruler totalDuration=182.72  booked sum=182.72   ← 从 600.00 塌下来
segmentDurations = 18.27 ×10
segmentStartTimes= 0, 18.27, 36.54, 54.82, 73.09, 91.36, 109.63, 127.90, 146.17, 164.45
axis  measured=10 off60s=9 acc=-375.57s patched=10 resid=+0.00s
```

拖动落点四记（`seekToTime(T)` 之后读「落点的轴秒 = 段起点 + 那一路自己的 currentTime」）：

| 拖到 | 落在 | 段内 | 该段文件名时间 | 头部钟 |
| --- | --- | --- | --- | --- |
| 20.00 | clip 1 @ 1.73 | ruler 20.00 | 09-06 | 09:06:00 |
| 60.00 | clip 3 @ 5.18 | ruler 60.00 | 09-18 | 09:18:00 |
| 100.00 | clip 5 @ 8.64 | ruler 100.00 | 09-30 | 09:30:00 |
| 175.00 | clip 7 @ 5.37 | ruler 175.00 | 09-42 | 09:42:00 |

`asked == landed` 四记全中 —— 这就是「拖到 12:03 落在 12:07」被修掉的样子（修之前每往深拖一分钟差一秒多）。

算术与外观分开验：`node devtools/r77-axis-test.mjs` **11/11**（观看中不动当前段起点 / 一趟后尺=带 /
真机 `acc=+4.05` 与第五边界 −4.05 复现 / 重复实测幂等 / 后测的段只动它之后 / 假片段塌到 182.70 /
恢复位置的两端往返 / 旧格式确实会漂）。桌面侧照旧靠 `isTouchShellRuntime()` 门恒 inert：
`noteAxis` 与 `rebookAxis` 第一行就返回，`calculateEventDurations` 与 `applySeek` 一行未动。

自然播放一趟（**不叠加任何强制 seek**，1.2.116，播到轴上 155 s 前后）——这一条是专门给「上表是拖出来的」
补的对照组：

```
idx=6 of 10  ruler totalDuration=307.90 booked sum=307.90
segmentDurations=18.27,60.00,18.27,18.27,18.27,18.27,18.27,60.00,60.00,18.27
axis  measured=6 off60s=6 acc=-250.38s patched=6 resid=+0.00s
```

看到第 7 段就只修到第 7 段：`resid=+0.00s` 说明**已经量到的那几段，尺子和磁带完全一致**；
`60.00` 是三条播放头没停过的段（`i=1` 为什么漏，我没能给出证据，见第七节）。
`acc` 从满程的 −375.57 缩到 −250.38，正是「量到的段变少」而不是修法变差 —— 再一次说明判修法看 `resid`。
`lost` 在 AVD 上仍是 `back=9.21s … right_pillar=34.23s` 这个量级（喂不饱的模拟器，跟真机 0.16–0.82 s 不可比）。

## 六、顺手补的一个洞：「上次位置」不能存在会被我改动的尺子上

`rememberPlaybackPosition`（`:15305`）以前存的是**轴上的秒数**，`savedPositionFor` 再拿它去 `seekToTime`。
这条路径在 1.2.114 之前是自洽的（轴永远是 60 s 猜测，写和读用的是同一把尺）；
`rebookAxis` 一上，**写在修正过的尺上、读在刚打开还没实测的尺上** —— 于是「继续上次播放」会偏，
而且随着看过的段数变深而越偏越远（测试里那一例：存 256.88 s，落在 clip 4 的 16.88 s，而用户停在 12.3 s）。

改成存 `{i: 段号, t: 段内秒}`（`:15330`）：这两件在**任何一把尺**下都指同一格画面，
读回时按当时的轴换算成秒。1.2.114 及之前存的裸数字仍然认。

1.2.116 装机复测（AVD，自然播放到 clip 7 段内 7.5 s 后暂停）：

| 要看的东西 | 读数 |
|---|---|
| 写进去的印记 | `{"i":7,"t":7.5}`，`savedPositionFor` = 177.13 vs 当时轴上 177.09（差 0.04 = `t` 只留一位小数） |
| 把轴**倒回**成 60 s 猜测尺（`total=600`）再读同一个印记 | 换算成 427.50 s → `Math.floor(/60)` 落在 **clip 7** |
| 同一条尺上，**旧的裸秒数** 177.13 会落在 | **clip 2** —— 就是这一版要消灭的错误 |
| 真 seek 到那个换算值之后的落点 | `idx=7 local=7.50`（`rulerStart=420 bookedTotal=600`）—— 画面没换 |
| 桌面判据 | `isTouchShellRuntime` 临时改成 false 后 `rebookAxis(0,30)` → `false`，`segmentDurations` 逐字节不变 |
| 1.2.114 存的裸数字 | `map[id]=100` → `savedPositionFor` 回 100，仍然认 |
| **真用户路径**：切到别的事件再点回该事件（⋮「上次位置」档） | 落回 `idx=7 local=7.50`（轴上 177.13）—— 跟暂停时同一格画面 |

## 七、诚实边界

- **没去过的段仍是 60 s 猜测**：总时长按未访问段会偏，`resid` 会说还差多少。真机上一趟完整看完 = 全修好；
  只看了三分钟就退出 = 只有那三分钟之后的尺子是准的。
- **开着剪辑时的修正被拒**：那次跨分钟就永久 `unrebooked`（`axisSeen` 不记第二次读数，段长留 60 s）。
  这是「不许动用户自己标的记号」换来的，不是漏的。
- **`awaitAxisMeta` 一次只候一段**：`awaitAxisMeta(index)` 会把上一段挂着的监听换掉，
  所以「连续快速跳段」时中间那一段可能没量到（实测里 `i=6` 就是这样，下一次落到该段会自动补上）。
- **衔接处「错开的定格」这一轮没变**：0.27–1.20 s/处、六路错开，是**提前解码/换段延迟**那条路要解决的，
  模拟器量不出真实换段延迟，等真机 `holds` 再定。
- **`acc=+4.05 s` 不会因为修反而变小**：那是文件本身的性质。这条修的是**尺子跟磁带一致**，不是让磁带变短。
- **「上次位置」的段内秒 `t` 是拿记账长度钳的，不是拿真实片长**（`script.js:15342`）：没实测过的段记账仍是 60 s，
  所以一个本来合法的 `t`（比如 40 s）落在真实只有 18.27 s 的段上会被播放器钳到片尾。
  落的**还是那一格画面**，只是那一段的末尾 —— 比落在隔壁段好，但别当成逐秒精确的恢复。
- **`{i,t}` 里的 `t` 是拿「记账长度」钳的，不是拿真实片长**：没实测过的段记账仍是 60 s，所以一个合法的
  段内秒（比如 40 s）在真实只有 18.27 s 的段上会被播放器钳到片尾。落的**还是那一格画面**，只是那一段的
  末尾 —— 比落在隔壁段好，但别当成精确恢复。

## 八、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.115-android-universal.apk` —— 27,917,731 字节，md5 `2f4a83ed86ad57ad5525fcf671d7f001`
  —— `rebookAxis` + `awaitAxisMeta` + `axisSeen` + 账本头行 `patched/resid`。模拟器已装机并取到第五节全部读数。
- `TDashcamStudio/Tessera-1.2.116-android-universal.apk` —— 27,918,047 字节，md5 `986f774b0ba2e27f11e8d677ddfc7c19`
  —— 「上次位置」改存 `{段号, 段内秒}`；见第六节（含装机复测表）与第七节最后一条。
  已装机（AVD `tdashcam_phone`，`v1.2.116` 自报无误，双 ABI 齐全：`lib/arm64-v8a/` + `lib/x86_64/`）并取到读数：
  轴 `measured=6 patched=6 resid=+0.00s`、印记 `{i:7,t:7.5}`、裸尺回退后真 seek 落 `idx=7 local=7.50`、
  切走再点回同一事件也落回 `idx=7 local=7.50`、
  桌面判据 `rebookAxis` 被拒且数组逐字节不变、旧格式裸数字仍认。算术 `11/11`。
- 1.0.1 … 1.2.114 全部原样留在根目录。改动仍未提交（clone 没有 git 凭据）。
- 仪器：`devtools/r77-axis-test.mjs`（11 条算术）、`devtools/r77-read.js`（现读尺子 vs 磁带）、
  `devtools/r77-seekcheck.js` / `devtools/r77-natural.js`（落点与自然播放）。

## 九、本轮新增的假信号

- **`--target aarch64` 出的「universal」包里其实只有 arm64**：AVD 是 x86_64，装得上、跑不起。
  要 `--target aarch64 x86_64`（**空格**分隔；写成 `aarch64,x86_64` 直接 `invalid value` 退出码 2）。
  核对 `unzip -l *.apk | grep lib/`，别看文件名里有 universal。
- **轴塌下来之后，`seekToTime` 的落点要拿「段起点 + 那路 currentTime」现读**：
  同一条 CDP 里 `seekToTime(T)` 后立刻读 `currentSegmentIndex`，读到的是**上一次**的段（seek 是异步串行的），
  于是 `local` 算成负数（实测 `-53.09`），看着像钳位坏了。要么分两次调用，要么 await。
- **`describeAxis` 的 `acc` 与 `resid` 是两个数**：`acc` 是文件对 60 的偏离（修不掉、也不该修），
  `resid` 才是「尺子里还站着没抹平的」。只看 `acc=-375.57s` 会误判成修法没生效。
- **快速跳段会让某一段没被实测**（`segmentDurations` 里留着一个 60.00）：这不是修法坏，
  是 `awaitAxisMeta` 一次只候一段；下一次落到该段自动补上。判「修好了没」看 `resid`，不是看有没有 60.00。
- **「印记换尺会不会漂」不能在同一把尺上往返测**：`savedPositionFor` 读的就是当时那份
  `segmentStartTimes`，在修正过的尺上「存了再读」是恒等式，永远通过，量不到真漂移。
  必须显式把 `segmentDurations/segmentStartTimes/totalDuration` 倒回 60 s 栅格（我暂存在
  `window.__r77save`，测完还原，否则之后的轴读数全假）才逼出「裸秒数落 clip 2 / 印记落 clip 7」这一对。
- **`{i,t}` 的 `t` 只留一位小数**：`savedPositionFor` 比当时轴上秒差 0.04 是四舍五入，不是丢了位置。

# R78 —— 「目前还是有问题」：账本上少的那一段是**永久**少的；而覆盖层的钱花在哪，第一次看得见（1.2.117）

真机 1.2.116 那份自报读数里，修法的证据和修法的洞**同时在**：轴确实被抹平了（`patched=7 resid=+0.00s`），
可那本账自己承认少了一段。这一轮先把洞查到底，再顺手把「衔接那几百毫秒到底花在哪」的尺子摆上。

## 一、真机 1.2.116 说了两件新事

**(a) 六段只量到五段这件事，在真机上重演了，而且少的是同一格。**

```
axis measured=7 off60s=6 acc=+7.49s patched=7 resid=+0.00s
i=0 61.95 +1.95 · i=2 61.82 +1.82 · i=3 60.00 0.00 · i=4 60.81 +0.81 · i=5 59.47 −0.53 · i=6/i=7 …
                                                     ↑ 没有 i=1
```

`resid=+0.00s` 只说明**量到的那几段**尺子和磁带一致；`i=1` 那一格从来没进过账，所以它连进 `resid` 的资格都没有。
那一格之后每一段都少背 1.82 s —— 用户往深里拖，落点就一直偏着。

**(b) 覆盖层那 418–1153 ms 不是丢帧。** 30 条释放全部 `end=frame`、`rs=4`、`via=loadeddata`、
`q≈0–2/191–210`（丢帧 ≤1%）、`w=x/0`（全程零 stalled）、`draw=0.8–8.4 ms`、`ahead=14.x`。
解码器没问题，画面也没画错，**钱花在别处** —— 但花在哪，当时那份账答不了。

## 二、根因：第二次机会挂在一条**可能已经响过**的铃上

`awaitAxisMeta()` 的监听是在 `loadSegmentForAllCameras()` 的 await **结束之后**才装的。两种排序都会漏，而且漏了就是**永远**：

1. 那一路在 4 s 等待还没到点时就已经 `readyState ≥ 2` → `loadedmetadata` 早就派发完了，后装的监听永远不会被叫；
2. 容器把 `moov` 写在文件尾 → 整个 4 s 里停在 `readyState 0`，等待到点返回 NaN，而事件在**返回之后**才响。

要么已经响过，要么根本不响。这不是「慢一点」，是通道本身能永久丢一段。

## 三、修法：改盯「答案住在里面」的那个属性

`awaitAxisMeta` 整段删掉，换成 `startAxisWatchdog()`（`script.js:6569`）/ `stopAxisWatchdog()`（`:6587`），
`AXIS_WATCH_MS = 500`（`:5450`）。`noteAxis` 的尾巴（`:6552`）变成：读得到就记账并收摊，读不到就武装。

```js
if (isFinite(real) && real > 0) { this.stopAxisWatchdog(); this.recordAxis(index, real); return; }
this.startAxisWatchdog();
```

轮询一个属性是**不会漏事件**的，代价是每半秒一次属性读取。定时器自己管生命周期，三条都会停：
读完当前事件的所有段、`currentEvent` 没了、或者 `isTouchShellRuntime()` 变假。
`loadEvent`（`:6517`）换事件时先停 —— 上一趟的定时器会拿这一趟的段号去问上一趟的文件。

账本头一行加了 `owed=`（`:6669`）。**原来的 `measured` 数的是记账条数**（滚动 20 条上限），
所以 10 段能读出 `measured=14`，而少一格和满一格看着都是「有数」。
`owed = 段数 − axisSeen 的键数` 才是「还有几段压根没读」。

## 四、验收：先**造**出一个「永久丢失」，再让它变成「 recovered」

这条洞在 AVD 的自然播放里不复现（它靠 4 s 等待路径救回来了）。所以不能用自然播放来证伪，
要用一个**不派发任何事件**的失效条件：`devtools/r78-watchdog.js` 把 front 的 `duration` 换成只读 NaN 的 getter，
调 `noteAxis(idx)`，两秒后把值改成 41.5 但**不触发任何事件**，1.6 秒后看账本。

| | 1.2.116（事件通道） | 1.2.117（看门狗） |
| --- | --- | --- |
| `noteAxis` 之后 | `watch=null axisWait=set` | `watch=set axisWait=null` |
| 无事件、1.6 s 之后 | `seen=`（空） | `seen=0` `log=[{i:0, real:41.50, booked:18.27, d:+23.23, p:0}]` |
| 判定 | **LOST FOREVER** | **RECOVERED** |

`p:0` 是对的 —— 探针把 `rebookAxis` 换成桩，就是为了不让验证动作自己把尺子改了。

自然播放（同一台 AVD、宫格六路、10 段 × 18.27 s、不叠加任何强制 seek）：

```
idx=6  measured=11 … owed=3   durs=[18.27×7, 60, 60, 18.27]
idx=9  measured=14 owed=0  watch=null
       durs=[18.2717 × 10]   total=182.72 booked sum=182.72
       starts=0,18.27,36.54,54.82,73.09,91.36,109.63,127.90,146.17,164.45
```

`i=1` 在 1.2.116 的账本里是 60.00，这一趟是 18.2717。`owed=0` 那一刻 `watch=null` —— 读满了自己收摊。

桌面判据：把 `isTouchShellRuntime` 临时改成 false，**先** `stopAxisWatchdog()` 再 `noteAxis(3)` → `watch=null`；
同一个探针在手机上给 `set`。`calculateEventDurations` / `applySeek` / `rebookAxis` 的算术一行未动，
`node devtools/r77-axis-test.mjs` 复跑 **11/11**。

## 五、第二轮装进去的仪器：那几百毫秒到底花在哪

`held.lm` = `loadedmetadata` 的时刻、`held.ld` = `loadeddata` 的时刻（都相对覆盖层登记那一刻）、
`buf`/`d` = 释放时的缓冲尾与片长（`:6352` 装监听，`:6300` 写进账）。
关键对比：这个监听跟 `player.src = url` 在**同一个同步 tick** 装，所以它**不会**像 `awaitAxisMeta` 那样漏 ——
实测每条 `holds` 行的 `lm` 都有值，从来没出现过 `-1`。

AVD 上一次跨分钟的六路（`seg=9`）：

```
front        1890ms lm=686  ld=691  buf=18.27/18.27 draw=148.3ms
left         3932ms lm=1011 ld=1011 …                   draw=13.5ms
right        5037ms lm=3258 ld=3259 via=poll            draw=111.5ms
back         6083ms lm=3027 ld=3027 …                   draw=43.6ms
```

`ld − lm` 一律 ≤ 3 ms。**在模拟器上，钱全花在「知道这个文件存在」= 通过环回 HTTP 打开容器**，
不是花在解码、也不是花在画那一帧上。

## 六、为什么这一轮**没有**顺手做预取

`lm` 主导 = 「提前打开下一段」看起来有依据 —— 但那是**模拟器**的账，而模拟器的换段本来就 4–8 s，量不出真机尺度。
真机 1.2.116 整次覆盖只有 418–1153 ms，`ld − lm` 的拆分还没到手里。两种可能对应两种相反的处理：

- 真机同样 `lm ≈ 整个 hold` → 预取下一段头部 / 一路 `preload=metadata` 值得做；
- 真机 `ld − lm` 才是大头 → 那是解码排队，**预取只会加六路并发解码的争抢**，反而造出用户报的「掉帧」。

有一条**旁证**偏向第二种：真机 `feeds` 里 `ahead=14.x` —— 播放头后面已经压着 14 s 缓冲，环回 HTTP 在真机上不慢。
而 Tesla 的 `moov` 在文件尾，「打开容器」要一次到文件尾的 Range 往返，这正是预取能省的那一次。两条互相拉扯，
所以更需要那份拆分，而不是更需要一次赌。

顺手排除了另一条**看起来该做、其实不做也对**的：把 `HELD_FRAME_POLL_MS` 从 200 调小。
真机 30 条释放**全是 `via=loadeddata`**（事件路径答的），轮询路径一次都没用上，所以那个量化间隔根本不在
`ms` 里 —— 调它一分钱也省不到。

按「先排查问题」，这一轮只把尺子摆上，不动播放。

## 六·补 —— 真机那份账里其余几条「量过了、判了不动」的

| 读数 | 判据 |
| --- | --- |
| `lost` back=1.26s/3、right_pillar=1.10s/5（上一趟是 0.16–0.82） | 仍然**有界**（每处衔接 ≤1.3 s），比 R77 判据的门槛高一点但没换成线性；继续看下一趟，若随段数涨就上换段闸 |
| `boundary-tail +0.06…+0.61` | 前一路 `ended` 砍掉别路尾巴，真机最大 0.61 s —— R76 在模拟器量到的是 1.95–8.80 s，真机小一个量级 |
| 一次 `glide-failed +0.42` | 偏差 0.42 s **在滑的带宽内**（手机档 `tolerance = 0.35 × 倍速`、`SYNC_GLIDE_BAND = 4` → 1× 时 1.4 s），判据是「已经在滑、可 gap 没缩到上次的 60%」才升级成跳（`:5997` `:6015`）—— 那是**滑不动时的逃生口**，按设计工作，不是故障 |


## 七、诚实边界

- **看门狗一次只候当前那一段**（它读 `currentSegmentIndex`）。跳着看的段仍留 60 s 猜测，直到落到它 ——
  但这一次不会再「永远」丢，落到就补。
- **`resid` 会把探针写的假读数一起算**：那一趟 `real=41.50 unrebooked` 会一直站在 `axisLog` 里，
  直到被 20 条上限挤掉。**尺子本身是干净的**（`durs[0]=18.2717`），别拿 `resid=+23.23s` 当回归。
- **`lm` 不是绝对 IO 计时**：覆盖层在 `cleanup()` 里登记，跟 `player.load()` 的排队有重叠，所以它含一点框架排队。
  拿它跟 `ld` 比大小没问题，别当成「读文件花了 3 s」的凭证。
- **模拟器的 `via=poll`、`rs=1` 交接仍在**（#301 那一档），真机 0/30。
- **`measured` 从此不能用来找洞**：它数的是条数。找洞只看 `owed=`。

## 八、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.117-android-universal.apk` —— 27,919,011 字节，md5 `a65b5ac1050f50866bb195661de4b00a`。
  双 ABI 齐全（`lib/arm64-v8a/libtdashcam_studio.so` 12,267,816 + `lib/x86_64/libtdashcam_studio.so` 12,737,280）。
  AVD `tdashcam_phone` 已装机（`versionName=1.2.117` 自报无误，装后重授 `MANAGE_EXTERNAL_STORAGE`），
  取到第四节全部读数与第五节的 `lm/ld/buf/d`。
- 1.0.1 … 1.2.116 全部原样留在根目录。改动仍未提交（clone 没有 git 凭据）。
- 仪器：`devtools/r78-watchdog.js`（LOST FOREVER / RECOVERED 判定）、`devtools/r78-axistrace.js`
  （现装监听追 `noteAxis`/`recordAxis`）、`devtools/r78-load.js`、`devtools/r78-play10.js`。

## 九、本轮新增的假信号

- **`allFiles` / `eventGroups` 不是全局**，是 `viewer.allFiles` / `viewer.eventGroups`。
  在 CDP 里裸写会抛 ReferenceError，而 harness 把它打成 undici 的 websocket 栈 —— **看着像连接坏了，其实是表达式坏了**。
  判连接是否活着用 `1+1`，别看栈。
- **测「桌面模式会不会起看门狗」必须先把上一趟的停掉再判**：`axisWatch` 是活体状态，直接读永远 `set`
  （我第一遍就把它读成了「桌面也起来了」）。
- **失效通道的 bug 要用「造一个不派发的事件」来证**，不能等自然播放复现：
  AVD 的自然播放把 `awaitAxisMeta` 救回来了，真机却照样漏 `i=1` —— 自然播放通过 ≠ 通道可靠。
- **探针要还原的是尺子，不是账本**：`delete p.duration`、还原 `rebookAxis` 之后，`axisLog` 里那条假读数
  是**证据**、不会被自动清掉，它会污染 `resid`。
- **`measured=N` 和「N 段都量到了」是两回事**：滚动上限 20 条 + 跨重载重复记账，10 段能读出 14。

---

# R79 —— 「播放还是不连贯」：六格不是同时掀开的，而参考时钟在掀开的过程中就开走了（1.2.118）

R78 那把新尺子（`lm=/ld=/buf=`）第一次把衔接那几百毫秒拆开，答案和 R78 的猜测**相反**：
钱不在打开容器，也不在预取，而在**六格各自等各自的**，并且 `playAll()` 在第一格掀开的那一刻就把参考时钟放出去了。

## 一、真机 1.2.117 把成本摊开了

30 条 `holds` = 5 次换段（`seg=3..7`）× 6 格。每一行的结构是「这格等了多久 / 其中打开容器多久 / 落地时参考时钟走到哪」：

```
seg=3  left_pillar 596ms lm=237 ld=246 ref=0    →  right 1149ms lm=314 ld=315 ref=0.49
seg=4  left_pillar 467ms lm=173 ld=173 ref=0    →  left   946ms lm=211 ld=211 ref=0.38
seg=5  front       489ms lm=188 ld=189 ref=0.04 →  back   979ms lm=259 ld=259 ref=0.53
seg=6  front       446ms lm=232 ld=236 ref=0    →  back   927ms lm=250 ld=251 ref=0.49
seg=7  left        447ms lm=216 ld=219 ref=0    →  left_pillar 986ms lm=304 ld=304 ref=0.11
```

三件事一次说清：

1. **`ld − lm ≤ 3 ms`**：容器一打开，数据就绪了。R78 留的那个「要不要预取」的分支到此关掉 —— 预取救不了的东西本来就不缺。
   （对照：模拟器上 `lm` 是 0.69–3.26 s、`ld − lm ≤ 3 ms` 同样成立，所以模拟器的钱全花在环回读 `moov`，跟真机不是同一笔账。）
2. **`lm` 只有 170–320 ms，但整行是 446–1149 ms**。中间那 200–900 ms 是**在等第一帧真的被画出来**（`rvfc`），而六格同时在换源，解码器排队。
3. **同一次换段里，六格落地的时间跨度是 479–553 ms**，而且 `ref` 已经跟着跑到 0.38–0.53 s。

第 3 条就是用户看到的「不连贯」：最后面那格掀开时，前面五格已经播了半秒。
`feeds` 那一行同一次换段后立刻是 `d=-0.11 / -0.35 / -0.21 / +0.10 / -0.30` —— 容差是 0.35 × 倍速，所以有格**一掀开就撞在容差边上**，
纠偏器随即把它们往回拖，`lost` 因此每趟攒下 `back=1.51s/4`、`right_pillar=0.84s/5`。**掉帧（`q`）和停摆（`w`）仍然是零**，
所以这不是解码器丢画面，是六格被错开定在两个位置上，再被拽回来。

## 二、根因：换段是一次「六个人各自过门」，而发令枪在第一名过门时就响了

链路本身没错：`loadSegmentForAllCameras()` 把六路依次换源，每路由自己的 `awaitHeldFrameRelease()` 决定何时撤覆盖层，
撤完立刻 `playAll()`。两个「各自」叠在一起 —— 各自的时间 + 各自的时钟起点 —— 才是缺陷：

- **释放各自**：没有任何机制等齐，最快 446 ms、最慢 1149 ms；
- **时钟也各自**：`playAll()` 在闸门外面被调用，参考时钟（front）一被 `play()` 就走，别的格子还在撤覆盖层的路上。等它们掀开，
  钟已经跑到 `ref=0.5`，只能靠纠偏器补 —— 补的动作就是用户看到的跳。

所以修法不能是「让纠偏更狠」（那只会更频繁地跳），只能是**别让错开发生**。

## 三、修法：换段闸门（seam gate）

`MultiCameraPlayer` 上加一个短命闸门，装在覆盖层那套生命周期上（桌面 `holdFeedFrames()` 提前返回、根本不装快照，所以闸门在桌面永远不开）：

| 位置 | 作用 |
| --- | --- |
| `openSeamGate()` `script.js:6449` | 换段开始、快照装好后调用。`need` = 本次**真的装了快照**的格子；`SEAM_GATE_MS`（`:5462`）后强制收摊 |
| `awaitHeldFrameRelease()` `:6367` | 某格等到第一帧 → 不再自己撤，改 `markSeamReady(camera)` `:6480` |
| `closeSeamGate(why)` `:6488` | 齐了（`ready`）/ 到点（`ceiling`）/ 被下一次换段顶掉（`superseded`）时收摊：把 `ready` 里的格子**在同一个循环里一起撤**，每行带上 `gate="ready 6/6 928ms"` 这样的标签（`:6294`） |
| `playAll()` `:6155` | **闸门开着就不放钟**：`if (this.seam) { this.seam.resume = true; return; }`，闸门收摊时再真正 `playAll()` |

三条不显然的判据：

1. **天花板永远不许掀开一个没有画面的格子**。到点只撤「已经 ready」的那些；没答话的格子留在覆盖层后面，等它自己那一帧。
   这就是为什么 `ceiling 0/6` 是安全状态而不是失败状态 —— 用户看到的是一格旧画面停半秒，不是黑块。
2. **非帧原因的释放（`no-element` / `not-readable` / `skip`）不算「没答话」**。`releaseHeldFrame()` 的尾巴（`:6343-6350`）
   把它们标成已答，否则第五节那种「一路根本没快照」的布局会把其余五格顶到天花板。
3. **顶替要交接请求**。`holdFeedFrames()` 开头先 `closeSeamGate('superseded')`（`:6232`），被顶掉时若闸门手里还攥着一个
   `playAll` 请求，它经 `seamResume` → `flushSeamResume()`（`:6473`）转给下一次闸门，不会静悄悄丢在门里。

## 四、`SEAM_GATE_MS = 1800` 的来历

不是拍的，是第一节那两列数：单次换段的**跨度**最大 553 ms、**最长一格** 1149 ms。1800 ms ≈ 最慢那一格的 1.5 倍，
正常一次换段能在 `6/6` 齐刷刷收摊（约 930–1150 ms，实测见第五节）；同时它又小于 `HELD_FRAME_MAX_MS = 21000`，
所以一个卡住的路不会把闸门拖成第二张覆盖层的寿命 —— 到点先放能放的。

## 五、验收（一）：状态机 28/28，且标签真的进得了诊断

`devtools/r79-gate.js` 用假 player 把七种排序各过一遍（齐了收、到点收、被顶替、顶替后交接、只有一格、桌面、
非帧释放），**PASS 28/28**。断言里包括：

- 同一个闸门的 `ready` 释放**共用一个标签**（`ready 3/3 1149ms`），且 `this.seam` 收摊后为 `null`；
- 桌面：`desktop armed no snapshot` / `desktop opened no gate` / `playAll` 在 500 ms 内返回 —— 桌面拿不到闸门；
- 天花板到点时 `need=6 ready=0` 也照样收，且**没有任何格子被掀开**。

标签只靠状态机证明不够 —— 它得出现在用户会粘贴的那段文本里。`devtools/r79-tag.js` 用真码路径
（`awaitHeldFrameRelease` → `markSeamReady` → `closeSeamGate` → `noteHold` → `describeHolds()`）按真机的形状装三格、隔 400 ms 各答一次：

```
front seg=9 1734ms frame via=loadeddata … gate=ready 3/3 1233ms
back  seg=9 1740ms frame via=loadeddata … gate=ready 3/3 1233ms
left  seg=9 1746ms frame via=loadeddata … gate=ready 3/3 1233ms
gateNow=null heldNow=[]
```

三格落在同一个 12 ms 的回合里，标签一致，之后没有残留的闸门或覆盖层。

## 六、验收（二）：慢设备上「不许更差」—— 同机 A/B

模拟器做不到真机那种 0.4 s 齐刷刷：它每路换源要 4–20 s，闸门永远在 `SEAM_GATE_MS` 处收摊。
所以拿它当**回归台**而不是当**证功台**：`devtools/r79-ab.js` 在同一台 AVD、同一条磁带、同一个布局上跑两条臂，
`off` 把 `openSeamGate` 换成空函数（＝精确回到 1.2.117），`on` 装回真方法，再用 `devtools/r79-spread.js` 按段汇总。
两条臂只在共同覆盖的 `seg=5,6,7` 上可比（`playEvent` 会记住上次位置，中途段落不重叠的中位数不可比）：

| | seg5 | seg6 | seg7 | 均值 |
| --- | --- | --- | --- | --- |
| `off` 跨度 ms | 3749 | 10056 | 9946 | **7917** |
| `on` 跨度 ms | 3957 | 6711 | 11508 | **7392** |
| `off` 参考钟跨度 s | 2.55 | 5.08 | 5.37 | **4.33** |
| `on` 参考钟跨度 s | 0.41 | 1.47 | 5.33 | **2.40** |

两臂 `tagged=0`（都靠天花板收摊，没人被闸门掀开），跨度在噪声内；而 `ref` 跨度从 4.33 s 收到 2.40 s ——
这是第三节第 3 条的副产品：**放钟被推到最后**，所以覆盖层还盖着的格子不会被钟甩开。
真机上这条闸门会走 `ready 6/6` 那条路径，跨度归零（第五节的 12 ms）。

同时用 `devtools/r79-trace.js` 在页内追了 90 个闸门事件，确认没有「假齐」：那趟**零次** `close ready`，
每次都是 `close superseded` 紧跟 `close ceiling need=6 ready=0 age≈1803–1840`，也没有一行带 `gate=`。
`holdLog` 里读到的 `ceiling 0/6` 就是天花板在按设计办事。

回归：`devtools/r77-axis-test.mjs` **11/11**（尺子算术 + `{i,t}` 位置印记，含「18.27 s fixture 塌回磁带 182.70」）。

## 七、诚实边界

- **这一轮没解决 `lost`**。`back=1.51s/4` 是纠偏器写下的历史，闸门只是让**下一批**错开不必发生。
  真机验证要看下一次粘贴里：`gate=ready 6/6 …` 出现的次数、以及换段后那一行 `d=` 是否还在 ±0.35 边上。
- **模拟器上闸门实际是空转**（inert），`ready 6/6` 从没在 AVD 出现过。别拿 AVD 的 `tagged=0` 当「修法没生效」。
- **`ref` 跨度的改善只算「机制方向正确」**，两臂各 3 个可比段落、单趟，没做多次中位数；`msSpread` 那对均值差（525 ms）
  在两臂内部本身就有 3749–11508 的起伏，不足以定成绩。
- **仍然没做**：#301（AVD 专属 `rs=1` 交接，真机 0/30）、`boundary-tail`（真机 ≤0.63 s 且有界）、预取
  （第一节第 1 条已经否掉）、`HELD_FRAME_POLL_MS` 调小（轮询在真机上只 used 过 2/30 次）。
- **代价**：闸门开着时 `playAll()` 最多推迟 1.8 s。真机上换段本来就是暂停-续播的语义，观感上多出来的是
  「旧画面多停一会儿」而不是黑屏 —— 覆盖层从头到尾没撤。

## 八、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.118-android-universal.apk` —— 27,920,931 字节，md5 `f3cb7ae4c7ad1f14d78586be0b8c4f82`，双 ABI。
  已装到 AVD `tdashcam_phone` 跑完第五、六节（装后重授 `MANAGE_EXTERNAL_STORAGE`）。真机待用户粘贴新的 `holds`。
- 1.0.1 … 1.2.117 全部原样留在根目录。改动仍未提交（clone 没有 git 凭据）。
- 仪器：`devtools/r79-gate.js`（状态机）、`r79-tag.js`（标签进诊断的实码路径）、`r79-ab.js`（同机两臂）、
  `r79-spread.js`（按段汇总跨度）、`r79-trace.js`（页内闸门事件流）、`r79-diag.js`。输出留档 `devtools/r79-ab-off.json` / `r79-ab-on.json`。

## 九、本轮新增的假信号

- **上一轮没观测到的读数，会被当成证据写进推断**。我在动手前断言账本上有五行 `ceiling 0/1 3ms` 且参考钟相同 ——
  它们**从没出现在任何一份输出里**。装上 `r79-trace.js` 之后那条趟是 0 次 `close ready`、0 行 `gate=`。
  判「闸门行为」要在页内追事件流，不能凭对账本的印象。
- **`grep -n ceiling` 会同时命中 `seekAll()` 里那个 3000 ms 局部变量**。它和 `SEAM_GATE_MS` 无关，
  读出来的「天花板」有两套，别看错归属。
- **诊断标签里有斜杠**（`ready 3/3 1149ms`），`split('/')[1]` 会把标签切坏，看着像修法没打标签。用 `indexOf('/')` + 去掉尾巴 ` \d+ms$`。
- **`rewire()` 那种「顺手清干净」的准备函数会毁掉要断言的状态**：它无条件清 `seamResume`，于是「顶替后交接」那两 check
  永远失败。加一个 `keepResume` 开关，别为了干净把被测状态擦掉。
- **CDP 里连续两个 `await` 的探针会超时，而活已经干完**。把 `playEvent` / `seekToTime` / 等待放进一个不 `await` 的内层 async，
  先把回话还给调用方，进度写进 `window.__r79armDone`。
- **两条臂必须钉在同一段区间上**。`playEvent()` 会记住上次位置，第二条臂从第一条停下的地方起播，
  段落范围不重叠时中位数会假性变差（尤其磁带尾部 `lm` 本来就大）。显式 `seekToTime(0.5)` 再等 6 s，汇总时只取共同段落。
- **模拟器 `ref` 跨度变小 ≠ 闸门成功**。两臂都靠天花板收摊，那是「放钟推迟」的机制副产品，别写成「AVD 上证成了齐刷刷」。

# R80 —— 纠偏器拿两把**不同文件**的尺子在对表：`11.66->0.26` 那一跳（1.2.119 → 1.2.120）

R79 的闸门在真机成了 —— 同一份 1.2.118 粘贴里 30 条 `holds` 全是 `gate=ready 6/6`，`lm=169–355`。
可那本账新冒出一行 `-11.40`：

```
back seg=9 11.66->0.26 -11.40 gap-band        （同形四条）
left seg=9 2.39->4.51 +2.12 gap-band          （+2.13 一条同批）
left_pillar seg=9 2.42->2.92 +0.50 glide-failed
```

这一轮量的就是它。它和 R79 那类「错开再拽回来」不是一回事：那一跳丢的是**那一路自己那一分钟里剩下的画面**，
按用户的说法，这正是「中间缺少几秒钟」能有的一种来源。

## 一、根因：`gap` 是两个「各自文件内的秒」相减

`syncAllPlayers()`（`script.js:5930`）的算术是 `gap = 参考钟.currentTime − 格子.currentTime`，
纠偏就是把格子写到 `refTime` 上。两个数各自**只在它所在的那个文件里有意义**，所以有两种情况下它不是漂移：

| 情况 | 为什么会发生 | 写下去的代价 |
| --- | --- | --- |
| (a) 格子指的文件不是 app 交给它的 | `currentUrls[camera]` 与 `player.src` 是同笔写入（`loadSegmentForAllCameras` / `loadDeferredFeed`），差值就意味着有人改了指向：`applyFeedVisibility()` 的手工对齐、迟到一步的 `loadeddata`（R64-2d 同族） | 把 `refTime` 这个**别的分钟**的秒数当成它的现在 |
| (b) 格子还没有媒体位置 | 换段头几秒 `readyState=0`、`duration=NaN`、`currentTime=0`（`devtools/r80-stale.js` 在写入后 0 / 60 / 250 / 700 ms 采到） | 一个已经加载完好的格子被拖到 0 |

`11.66->0.26` 的形状和 (a) 完全一致：那条磁带报的是**上一分钟末尾**的 11.66 s，而参考钟已经在新的一分钟里走到 0.26 s。

## 二、三条被测量否掉的推测

- **「隐藏的格子留着上一段的文件」**（`loadSegmentForAllCameras` 的 `continue` 分支）—— 否。它先调 `cleanup()`，
  而 `cleanup()` 把**每一路**的 `src` 抹掉（`player.src=''; load()`），被跳过的格子根本没有 `src`，早已在循环开头被跳过。
- **「元素换源后仍然报着旧文件的位置」**—— 否。它报 0（上面那支采样探针）。真实机制是 (a) 的「指向不同」，不是「位置发假」。
- **「参考钟把自己拖到片尾」**（我上一轮的一句话）—— 否，而且它**从没出现在任何一份输出里**。
  `lost` 里那些 `->duration` 的行来自 `noteBoundaryTail()`（`:6157`），那里 `to = player.duration` **按构造**成立：
  那是「front 的 `ended` 砍掉了别路尾巴」的记账，不是一次写入。既然读数容易被当成写入，1.2.120 就把这类行改印 `->end`。

## 三、修法：四条守卫，全部只在手机分支

| 位置 | 判据 | 效果 |
| --- | --- | --- |
| `feedHasPosition` `:6012` | `readyState ≥ 2 && isFinite(duration)` | (b) 的格子不参与（`:5982`），且给它一次 `endFeedGlide` 收尾 |
| `feedOffProgram` `:6023` | `player.src !== currentUrls[camera]` | (a) 的格子不参与，并给 `feedStats[cam].offClock++`（`:5984`） |
| 参考侧第一道 `:5947-5948` | 参考钟自己没有媒体位置 | 整趟不跑（宁可不纠，也不拿 0 去量五路） |
| 参考侧第二道 `:5958-5959` | `referenceIsTrustworthy`（在饿肚子的宽限期内，或钟在播却没前进） | 整趟不跑 |

桌面侧一行未动：两处新分支都包在 `isTouchShellRuntime()` 里，桌面仍走 `player.currentTime = currentTime`（`:5997-5998`）那条老路径，
容差仍是上游那个固定 0.1 s；诊断里新增的 `syncGuard` 行同样在 `if (isTouchShellRuntime())` 块内（`:15468`），
`describeLoss()` 只被那一块消费（`:15477`），所以桌面粘贴逐字节不变。

## 四、验收（一）：同一支探针，改前 `DEFECT PRESENT`、改后 `GUARD OK`

`devtools/r80-crossfile.js` 只由 app 自己的 `timeupdate` 驱动（`:6665` 是唯一调用者；手动喊 `syncAllPlayers()` 量的是另一个时刻），
两条 case 跑在同一段区间上：

- **1.2.118（无守卫）**：`DEFECT PRESENT: an off-program tile was dragged (7.27->1.33 -5.94s rs=4, 1.81->3.82 2s rs=4, 4.14->7.61 3.48s rs=4)`。
  注意每一行都是 **`rs=4`、`dur=18.27`**：被拖的是**加载完好**的格子。所以这台的成因是 (a) 指向不同，不是 (b) 还没就绪 —— 
  两把尺子都要装，但装上之后先响的是哪一把，只有跑过才知道。
- **1.2.119 / 1.2.120（有守卫）**：`GUARD OK: drift corrected, off-program tile left alone`，明细 `onProgram rows=2 / offProgram rows=0`。
  `case 1` 是**对照**：真有漂移的格子必须仍然被纠 —— 否则这条 check 只是在庆祝我把纠偏器关掉了。

## 五、验收（二）：自然播放一趟的四本账（1.2.120 / AVD `tdashcam_phone` / 宫格六路 / 10 段 × 18.27 s）

只由播放推进，没有任何强制 seek。`holds` 30 行、`lost` 24 行，`复制诊断` 整份留档：

```
特写 1.2.120   device=Google sdk_gphone64_x86_64 android=16 layout=phone
syncGuard refused=10+13 (no media position + clock not advancing)
axis: measured=10 off60s=9 acc=-375.57s patched=10 resid=+0.00s owed=0
lost: 12 行全 on-file，最大 back seg=9 8.55->17.48 +8.93 gap-band
tail: back seg=9 10.47->end +7.80 boundary-tail ref=front rs=1 dur=18.27/18.27 on-file
```

- **`syncGuard refused=10+13`**：参考侧那两条分支在自然播放里各走过（10 次「钟没位置」+ 13 次「钟没前进」）。
  这一行是本轮唯一的新证据：`off=` 只能证明**格子**被放过，之前没有任何读数证明**钟**被拒绝过，
  而手机上的「纠偏器没干活」和「纠偏器拒绝拿没准备好的钟去量五路」在粘贴里长得一模一样。
- **tail 行改印 `->end`** 走的是 shipped `describeLoss()`：把 `lossLog` 临时换成只留 tail 行渲染，跑完立刻还原
  （还原后 24 行、5 条 tail 复核过）。它不再看着像「把某一路拖到了片尾」。
- **回归**：`devtools/r79-gate.js` **PASS 30/30**、`node devtools/r77-axis-test.mjs` **11/11**。
- **`holds` 再次确认 R78/R79**：`ld − lm ≤ 5 ms`（30 行全成立），容器一打开数据就在；
  这趟 `lm` 是 2258–6815 ms（AVD 饿出来的量级），`rs<4` 只有 2 行（`front seg=6 rs=2`、`right seg=8 rs=1`）→ #301 仍是模拟器现象。

## 六、为什么这轮**没有**再加播放守卫

自然播放的四本账里，我没有找到第三种「把没准备好的位置当成现在」的机制：`lost` 全 `on-file`，
`axis` 十段全记上（`owed=0`、`resid=+0.00s`），tail 行是记账。所以 1.2.120 只装诊断。
**判据是「有没有新的读数支持」，不是「还能不能再想一条」** —— 上一轮那条「参考钟拖到片尾」就是这么冒出来又被打掉的。

## 七、`r79-gate.js` 从 27/28 到 30/30：那条 check 本身是坏的

闸门状态机在干净页面稳定 27/28，失败的是 `desktop playAll did not wait on anything`（阈值 `await playAll() < 500 ms`）。
先量**裸** `playAll()`：同一页面三次分别 **2647 / 0 / 1604 ms**，且 `seam=null`。所以那个阈值量的是模拟器换源时
`Promise.all(six p.play())` 自己的落地延迟，不是「桌面有没有分歧」。改法：
- 用 `fireSpy` 包住六路的 `player.play`，断言**派发时刻**（每路 <50 ms 内被调用），不再看墙钟；
- 加 6c 对照：`heldFrames` 塞一个假快照 + `openSeamGate()` → 手机上闸门开着时**一次都不派发**，
  而 `seam.resume === true`。没有这条对照，「派发级探针」可以靠什么都不测而通过。

## 八、诚实边界

- **真机那四条 −11.40 的归属仍未证实**。1.2.118 的行里没有 `off=` / `dur=` 两列（1.2.119 才加），
  「off-program」是在 AVD 复现同样的形状后归因的，不是从真机那份读数读出来的。下一份真机粘贴要看三件：
  `syncGuard refused=N+M`（N 或 M 是否 >0）、每行末尾是 `on-file` 还是 `off-file`、以及还有没有 −11 量级的行。
- **AVD 这趟 `lost` 的量级不能拿去推真机**（`total back=117.08s/23`、单跳最大 +8.93 s；真机 R77 时六路 `d≤0.20 s`）。
  它本轮只回答一个问题：守卫有没有把纠偏器一起关掉。答案是没有（对照 case 仍写 2 行）。
- **闸门在 AVD 依旧空转**：这 30 条 `holds` 一行 `gate=` 都没有。别把 AVD 的 `tagged=0` 读成修法没生效（R79 第六节同记）。
- **仍然没做**：#301（AVD 专属交接）、预取（R78/R79 两次否掉）、`HELD_FRAME_POLL_MS` 调小（真机 24/30 走 `via=poll`，
  但那条路径的成本没被证明是瓶颈）。

## 九、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.119-android-universal.apk` —— 27,922,339 字节，md5 `1ec5712fe325b331803086d41b689573`，双 ABI。守卫本体在这一版。
- `TDashcamStudio/Tessera-1.2.120-android-universal.apk` —— 27,939,299 字节，md5 `825715f46de636488c57840953d00a00`，双 ABI。
  只加诊断（`syncGuard refused=`、tail 行 `->end`）。已装到 AVD `tdashcam_phone` 跑完第四、五节；真机等下一份粘贴。
- 1.0.1 … 1.2.118 全部原样留在根目录。改动仍未提交（clone 没有 git 凭据）。
- 仪器：`devtools/r80-crossfile.js`（改前/改后判据）、`r80-stale.js`（换源后 0/60/250/700 ms 的位置采样）、
  `r80-why.js`（一趟强制纠偏到底撞在哪条早退上）、`r80-dg.js`（把 `复制诊断` 整份抓下来，不碰剪贴板）、`r79-gate.js`（30/30）。

## 十、本轮新增的假信号

- **`viewer.seekToTime` 不存在**，只有 `continuousPlayer.seekToTime`。探针里写 `v.seekToTime(1)` 抛 TypeError，
  而它在一个**不 await** 的内层 async 里 → 异常被静默吞掉，六路根本没播，新计数器恒 0，读起来像「这条分支不可达」。
  判「分支走没走」之前，先证明「真的在播」：对六路直接 `p.play()` 取 `playing:true`。
- **还原类断言写在了还原之前**。我用 `try { …; return restored: m.lossLog.length===saved.length } finally { 还原 }`，
  于是永远看到中间态（`restored:false` 而数组完好）。断言要在 `finally` 之后再读一次。
- **实例级补丁在动态属性查找下是看得见的**：`:6665` 那个监听器每次重新解析 `this.multiCameraPlayer.syncAllPlayers`。
  补丁读到 0 次 = 这一趟根本没跑过，不是「补丁没生效」。
- **归属表**（这轮踩全了）：`currentEvent` 在 `viewer` 上；`describeAxis` / `seekToTime` / `currentSegmentIndex` 在 `continuousPlayer` 上；
  `isPlaying` 在 `multiCameraPlayer` 上；`describeLoss()` 返回**数组**，不是字符串（`.match` 直接炸）。
- **`openSeamGate()` 返回 undefined**：闸门状态要从 `cp.seam` 读，不能 `const gate = cp.openSeamGate()`。
- **墙钟阈值 + `await playAll()` 的 check 量的是模拟器缓冲**，跨趟能差 2647 → 0 ms。指令级探针 + 一条「关掉它」的对照才作数。
- **`r77-axis-test.mjs` 是 Node 侧脚本**，用 `cdp-eval --file` 喂进页面必 `ReferenceError: process is not defined`；跑 `node devtools/r77-axis-test.mjs`。
- **`grep -c Finished` 对双 target 构建会先出 1**。两条 `Finished release profile` + `Finished 1 APK` + `TAURI_BUILD_EXIT=0` 四件一起看才算完。

# R81 —— 六宫格要读成「相机清单」不是「整车俯视」；冷启动那一下浅色（1.2.120 → 1.2.121）

用户一句话里两件事：

> 六宫格视图顺序比较混乱，调整为，前视-后视-左侧-右侧-左柱-右柱 的顺序。手机夜间模式下，APP 调整主题调整为跟随系统，
> 打开 APP 的时候，会从浅色主题闪一下，然后才变为深色主题。

两件都不在播放链路上，所以这一轮的四本账只作回归用。

## 一、六宫格的顺序**只**由 CSS `order` 决定

- 桌面 `styles.css:3253-3258` 是**俯视图**：左柱 / 前视 / 右柱 / 左侧 / 后视 / 右侧 —— 按「柱子装在车的哪一边」排，不是按重要性。
  手机上读起来就成了「顺序混乱」，因为没人把六个格子看成一张车的平面示意图，它是六路相机的清单。
- 全篇 grep 过：`[data-camera]` 上的 `order` 规则只有三组（桌面六宫格、手机六宫格=本轮新增、4-Grid），
  `order: … !important` 零处，**没有任何 JS 读 `order`**。所以改顺序 = 加一段 CSS，播放器一行不碰。
- 新增 `styles.css:3264-3269`，门是 `html.touch-ui` 而不是 `@media`：窄的桌面窗口同样会撞进 `max-width:768px` 那条媒体查询，
  视口判据区分不了「手机」和「窄桌面」。特异性上 4 个类级选择器压过桌面的 3 个，靠层叠而不是靠 `!important`。

```css
html.touch-ui .player-area.grid-view .video-container[data-camera="front"] { order: 1; }
… back = 2, left = 3, right = 4, left_pillar = 5, right_pillar = 6
```

- 这个顺序和 4-Grid、和导出相机清单同源：`phoneExportCameras()`（`:18778`）本来就是 front/back/left/right/… 的表序。
  桌面导出在 `:10078` / `:10927` 自己排，一行未动。
- **桌面为什么不可能被带进来**：`touch-ui` 只在 `markTouchUi()`（`:848-852`）里加，而它第一句就是 `if (!isTouchShellRuntime()) return`，
  判据是 `window.__TAURI__` + `Android|iPhone|iPad|iPod` 的 UA（`:890-892`）。触屏桌面拿不到这个类。
  宫格又只能由 JS 的 `setLayout()` 画出来，而脚本跑到 `:852` 时必然已经加上类了 —— 不存在「先按桌面顺序闪一下」的窗口。

## 二、验收：同一台 AVD、同一事件、改前包与改后包各测一次

不是推理，是装机对敲（竖屏 `user_rotation 0`，事件 `TeslaCam/RecentClips`，宫格六路）：

| | 第一行 | 第二行 | 第三行 | 每路实测 `order` |
| --- | --- | --- | --- | --- |
| 1.2.120 | 左柱 \| 前视 | 右柱 \| 左侧 | 后视 \| 右侧 | 2 / 5 / 4 / 6 / 1 / 3 |
| 1.2.121 | **前视 \| 后视** | **左侧 \| 右侧** | **左柱 \| 右柱** | 1 / 2 / 3 / 4 / 5 / 6 |

横屏（`:3331-3350` 的 3×2 与 `:4283` 的单行）在 1.2.121 上是 **front → back → left → right → left_pillar → right_pillar** 一行读完。
目视留档：`devtools/r81-grid-portrait-121.png`（深色主题，左上角第一格是前视）。

## 三、浅色闪一下：主题是在 `</body>` 之前才被 apply 的

链条是 `themeMode()` `:16151` → `resolveThemeDark()` `:16156`（优先原生 `status.night`，回落 `matchMedia('(prefers-color-scheme: dark)')`）
→ `applyTheme()` `:16227`，而这条链的入口 `loadTheme()` `:16189` 要到 `:12162` 才被调 —— `script.js` 挂在 `</body>` 前面。
也就是说：**第一帧永远是 CSS 里写死的浅色**，深色要等整个脚本解析完。跟随系统时这个空窗最长，因为系统值还排在原生回话之后。

修法两段，都不含任何逻辑：

- `<head>` 里（`index.html:19-34`）读 `tdashcam.themeMode` + `matchMedia`，把结论写进
  `document.documentElement.dataset.bootTheme` **和 `documentElement.style.colorScheme`**。根元素的颜色方案决定的是
  画布（canvas/底色）的颜色，所以必须在这里写，等 body 存在再写就已经闪过了。
- `<body>` 的第一个子元素（`index.html:38-42`）：在**任何一个页面元素被解析之前**，按 `bootTheme` 给 body 加 `dark-theme`。
  所有深色 token 都挂在 `body.dark-theme` 上，所以这一句才是「第一帧就是深色」的保证。

**这段故意没有手机门。** 它是画序修正，不改任何判据；全篇只有 4 处碰 `body.dark-theme`（`:15428`、`:16228`、`:16395`、`:17987`），
而 `applyTheme()` 用的是 `classList.toggle('dark-theme', force)` —— 幂等，先加后加结果一样。
桌面也拿得到这个好处：桌面冷启动同样有一段「脚本还没跑完」的窗口。

## 四、验收（主题）：逐帧截图 + 页面状态，两路一起

`devtools/r81-boot.mjs` 冷启动连拍 + `screencap` 取亮度，`devtools/r81-theme.js` 读页面侧一致性：

- **对照 1.2.120**：在 +33.1 → +35.9 s 之间拍到 **LIGHT/WHITE 帧（亮度 242）** —— 用户说的「浅色闪一下」在采样里是真的存在。
- **1.2.121**：16 帧覆盖 +1721 → +35471 ms（间隔 1.0–2.3 s，`FCP = 12376 ms` 落在窗口内），**零浅色帧**；
  页面侧 `bootTheme:"dark"`、`bodyDark:true`、`agree:true`。
- **诚实边界**：`screencap` 的节奏是 1–2 s，短于它的闪会正好漏在帧之间。所以这一条不只靠采样 ——
  `body` 第一个子元素那句是**构造性**证据：类在任何 `<body>` 内容被解析前就已经在 DOM 上了，不存在「先画出来再改」的时序。
- **另一条残留：`auto` 档下 head 里只能问 `matchMedia`，问不到原生**。`resolveThemeDark()`（`:16156-16165`）在 `auto` 时
  **以原生 `status.night` 为准**，因为 manifest 把 `uiMode` 钉进了 `configChanges`、WebView 自己的媒体查询可能攥着旧答案；
  而 `<head>` 解析那一刻桥还没起来，boot 脚本只能看 `matchMedia`。所以「两者不一致的那台机器」上，第一帧按媒体查询画、
  `applyTheme` 仍可能翻一次 —— 空窗从「整个脚本解析完 + FCP」缩短到「等原生状态到手」，**没有归零**。
  AVD 这趟 `agree:true` 只说明它的两个答案相同，**没测到分歧的情形**（要造它得让 Activity 活着翻夜间模式，本轮没做）。
  `light`/`dark` 两档没这个问题：boot 读的是同一个 `tdashcam.themeMode` 键、同一套判据。

## 五、回归：四本账照旧（R81 没碰播放）

1.2.121 / AVD 自然播放，由 `复制诊断` 与 `devtools/r77-read.js` 两路取：

```
特写 1.2.121   device=Google sdk_gphone64_x86_64 android=16 layout=phone coarse=true touchUi=true
syncGuard refused=5+20 (no media position + clock not advancing)
axis: measured=4 off60s=1 acc=-41.73s patched=4 resid=+0.00s owed=9
lost: total back=10.77s/4 left=10.46s/2 right=12.98s/3 left_pillar=12.63s/3 right_pillar=12.62s/3
holds: front…right_pillar seg=9 skip=no-metadata
```

- 这趟是**从「上次位置」续播**，播放头只踩到最后几段，所以 `measured=4`、`owed=9`。按 R78 的规矩 `owed>0` 是「还没踩过」不是「账丢了」，
  但反过来也别把这条短趟读成「整趟验证过」。`resid=+0.00s` 与 1.2.120 一致。
- `lost` 的量级远低于 1.2.120 那趟满程（`back=117.08s/23`），因为趟短，**不构成改进证据**。
- 三件回归：**`node devtools/r77-axis-test.mjs` 11/11**、**`cdp-eval --file devtools/r80-crossfile.js` → `GUARD OK`**
  （对照分支 `onProgram rows=4`，`offProgram rows=0`）、**`r79-gate.js` PASS 30/30**。
- `holds` 这趟全 `skip=no-metadata`（AVD 合成 fixture 没有 SEI 遥测），闸门成绩照旧只在真机看。

## 六、没做 / 仍然欠着

#301（AVD 专属的 `rs=1` 交接）、预取（R78/R79 两次否掉）、`boundary-tail`（有界，≤0.63 s）—— 与 R80 同。
真机侧那四条 `−11.40` 的归属仍要看下一份粘贴里的 `syncGuard refused=` 与每行 `on-file`/`off-file`。

## 七、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.121-android-universal.apk` —— 27,940,515 字节，md5 `b3a403a137db8c838202f105be4bcad1`，双 ABI（aarch64 + x86_64）。
  已装到 AVD `tdashcam_phone` 跑完第二、四、五节。改动仍未提交（clone 没有 git 凭据）。
- 1.0.1 … 1.2.120 全部原样留在根目录。
- 本轮新仪器：`devtools/r81-grid.js`（按格子矩形分带还原视觉顺序）、`r81-boot.mjs`（冷启动连拍 + 亮度）、
  `r81-theme.js`（页面侧 bootTheme/bodyDark/agree）、`r81-grid-fixture.html` + `serve-fixtures.mjs`（只用一份 styles.css 的最小页，用来 dump CSSOM 看层叠）。

## 八、本轮新增的假信号

- **同一个页面实例里 toggle 类名后，`getComputedStyle` 回的是旧值**。我先试了同步去 `touch-ui`（`r81-grid-ab.js`）、
  再试 rAF×2 + 60 ms 分相（`r81-grid-ab2.js`），`order` 和 `opacity` 都读回改前的数；`r81-grid-ab2.js` 甚至吐出
  `front=1 back=3 left=3 right=4` 这种不可能的组合。**只有 `display:none` + `getBoundingClientRect()` 会响应**。
  这和记忆里「改样式要 computed style + 目视截图」不冲突，但要把限定词补上：**computed style 只在跨页面实例（重装包）时可信**；
  同页改类只能靠几何读数。真正的 A/B 是装 1.2.120 测一次、装 1.2.121 测一次。
- **宫格没画出来时六个 rect 全是 0×0**：按 y 分带会塌成一个带，`visualOrder` 静默回落到 DOM 顺序，
  而 DOM 顺序恰好就是期望顺序 → **假通过**。1.2.120 第一次对照臂就是这样「已经是正确顺序」的。
  探针必须先断言格子非零尺寸，或先确认 `eventGroups` 已填充并真的播过。
- **`adb shell appop` 不存在**，是 `appops set`（`appop: inaccessible or not found`，exit 127）；`adb install -r` 之后必须重新授 `MANAGE_EXTERNAL_STORAGE`，否则六路 `rs=0` 看着像新包坏了。
- **`SavedClips/*` 事件只有 1 段**，任何要求「六段可比」的守卫探针（`r80-crossfile.js` 会直接 `{"err":"need 6 segments"}`）必须用 `TeslaCam/RecentClips`。
- **后缀骗人**：`r80-crossfile.js` 是**页面探针**，`node devtools/r80-crossfile.js` 必 `ReferenceError: window is not defined`，要走 `cdp-eval --file`；
  而 `r77-axis-test.mjs` 是 Node 脚本，喂进页面必炸。和 R80 那条是同族，方向相反。
- **托管浏览器里 `innerWidth: 0`**，那个页面的 computed style 同样不可信；能用的是 `el.matches()` 和 CSSOM dump（回答「层叠按预期解析了吗」，不回答「格子动了没」）。

---

# R82 —— 「刷新列表」把正在播的那段拆了没装回来（1.2.121 → 1.2.122）

用户报告：「点击"设置"里面的"刷新列表"后，出现卡死，播放模式点击切换没有反应，切换各路视屏也没有反应。剪辑、全屏点击也没有反应。」
按「先排查问题」的规矩，这一轮先量后改。

## 一、根因：一句话是「拆了没装回来」，实际是四层叠在一起

先排掉的三条（都有读数，不是猜的）：

- **不是主线程被 JS 卡住**：扫描期间页面侧 rAF 间隔最大 700 ms 以内，长任务采样没有空洞。
- **不是 Rust 侧同步 IO**：`scan_media_dir` / `list_subdirs` / `probe_readable` / `read_sei_metadata` 全是 `async` + `blocking()` → `spawn_blocking`。
- **不是遮罩层挡住点击**：`document.elementFromPoint` 在「卡死」状态下命中的就是按钮本身。

真因分四层，缺一层都不会读成「全都没反应」：

1. **销毁**：`rescanCurrentFolder()` → `loadTauriDirectory()` → `handleFolderSelection()` → `cleanupOldData()` 把当前事件整个拆掉 —— `currentEvent = null`、六路 `player.src` 全清、`currentUrls` 清空，**没有任何代码把它装回来**。
2. **状态判反**：`MultiCameraPlayer.cleanup()` 里的 `pauseAll()` 只暂停**还有 `src`** 的元素，而 `isPlaying` 本来是靠 video 事件（`ModernVideoControls.updatePlayState`）维护的 —— `src` 一清，事件就不来了，`isPlaying` 停在 `true`。
   读它的按钮因此把状态判反：`#clipBtn` / `#fullscreenBtn` 变 `disabled`（computed `pointer-events:none`、`opacity:.4`）→「剪辑、全屏点了没反应」。
3. **没有可切的东西**：格子全空 → 布局切换、切相机都只是在给六台没有媒体的 `<video>` 改属性 →「切换没反应」。
4. **看不见进度**：手机上唯一的进度提示 `#tauri-loading` 在**已经关掉的抽屉里**（`display:none`），而 ⋮ 面板一点「刷新列表」就自己关掉 → 屏幕上没有任何「我在忙」的证据 → 读成「卡死」。

## 二、改了四条，全在 `isTouchShellRuntime()` 里（桌面路径一行未动）

1. **没变就不重建** —— `scanSignature()`（`script.js:1482`）：对文件相对路径集合算「条数 + 两个独立顺序无关哈希」（FNV-1a 的和与亦或；只用和会在「换一个片段」时撞车）。
   `loadTauriDirectory` 里 `:17991` 判 `path` 与 `sig` 都相同 → 弹「列表已是最新（N 个事件）」并 `return false`，**不碰播放器**。
   实测：常规刷新从「拆掉再重建 10–30 s」变成 **2926 ms 扫描 / 4121 ms 墙钟、0 次重建**。
2. **重建了要装回来** —— 扫描前抓快照 `{eventId, at, playing, camera, layout, drawerOpen}`，扫描成功后 `restoreEventAfterRescan()`（`:15094`）按顺序放回：`playEvent` → 若这期间用户已经点了别的卡片就**让位**（`currentEvent` 变了立刻 return）→ 相机 → 布局 → `seekToTime(at)` → 需要时 `pauseAll()` → 抽屉状态。
3. **别把 impatient 的第二次点击变成事故** —— `rescanCurrentFolder` 开头 `if (this.isScanning) { toast; return; }`（`:15072`）；手机上（非下拉刷新）先弹 4 s「正在扫描文件…」，并把 ⋮ 面板那一行的文字改成「扫描中…」（`:17962`，`finally` 里改回）。
   中文文案特意选 4 个字，和「刷新列表」同宽 —— 那一行不能因为换文案而重排。
4. **`cleanup()` 之后 `isPlaying` 要诚实** —— `:6631` 加 `this.isPlaying = false;`。这一条不加，前两条做完仍会留下「六块黑格子 + 运输条写着暂停 + 剪辑/全屏禁用」。

**考虑过并否掉**：`forgetRemovedVolumes`（U 盘拔出）里作废签名 —— 不需要，`unchanged` 判据带 `eventGroups.length > 0`，列表被清空后必然走重建。

## 三、验收：AVD 真手指点击 + 页面侧 120 ms 采样（`devtools/r82-tap-recorder.js`）

「列表没变」这条（常规点一次，播放中，六宫格）：

```
 211 ms  刷新列表        -                    at 1.43  P  srcs 6  clip fs  left grid
14056    扫描中…  正在扫描文件…        at 2.89  P  srcs 6  clip fs
17295    刷新列表  列表已是最新（8 个事件）  at 2.89  P  srcs 6  clip fs
19937    刷新列表        -                    at 2.89  P  srcs 6  clip fs
```
全程六路 `src` 没断、`isPlaying` 没断、`#clipBtn`/`#fullscreenBtn` 全程可用。
**诚实边界**：扫描那 3 s 里播放头停在 2.89 没走（AVD 本来就 0.25× 且环回读文件），真机没复测这一条。

强制重建这条（先清 `lastScanSignature` 再点，等于旧版每次都会走的路径）：

```
  520 ms  刷新列表  -              SavedClips at 0.00  P  srcs 6  clip fs  left grid
11816     扫描中…  正在扫描文件…  SavedClips at 1.01  P  srcs 6
19258     扫描中…  -              -          at 0     -  srcs 0     ← 拆掉了
19828     扫描中…  -              SavedClips at 0     -  srcs 0     ← 装回来中（短暂 legacy/front）
22560     刷新列表  找到 8 个事件  SavedClips at 3.01  P  srcs 6  clip fs  left grid
```
拆除 → 装回 3.3 s；位置 2.92 → 3.01（+0.09 s）、相机 `left`、布局 `grid`、播放态、抽屉态全部回来，两个按钮立即可用。
连点三次（300 ms 间隔）：`isScanningAtTap2:true`、`scans:1` —— 只扫一遍。
截图 `tmp/r82-t2.png`：⋮ 面板打开着，那一行是「扫描中…」带转圈图标；`tmp/r82-midscan.png`：重建后六格真实画面 + 角标顺序。

## 四、回归：四本账 + 两件 R81 仪器照旧

- `node devtools/r77-axis-test.mjs` → **11/11**（`total=365.25 tape=365.25`、`acc=4.05`、`resid=+0.00s`）。
- `cdp-eval --file devtools/r80-crossfile.js` → **`GUARD OK`**：对照分支 `onProgram rows=1`（`back 0.87->3.41 gap-band`，纠偏器还在干活），缺陷分支 `offProgram rows=0`。
- `cdp-eval --file devtools/r79-gate.js` → **30/30**（这一条本轮先红后绿，红的是仪器，见第五节）。
- `r81-grid.js` → 视觉顺序仍是 `front back left right left_pillar right_pillar`，第一格 `前视` 在 (8, 247)。
- `r81-theme.js` → `mode:auto`、`bootTheme:dark`、`inlineScheme/computedScheme/bodyDark` 全一致、`agree:true`。

## 五、`r79-gate.js` 那条 check 又坏了一次（第二次）

R80 那轮修过一次「await playAll() < 500 ms」的墙钟判据；这轮它换了个形式复犯：
`desktop: every visible tile was told to play synchronously` 断言 `t.every(ms => ms < 50)`，
读数 `0.5 / 12.4 / 26.6 / 35.2 / 61.7 / 81.7 ms` → 29/30 FAIL。
同一台机器、同一个包，把这段单独跑（`devtools/r82-playall-probe.js`）是 `0.7 / 2.5 / 3.9 / 4.6 / 5.4 / 12.9 ms` → PASS。
差的不是产品，是**前 29 条 check 把模拟器搅忙了**：六路并发 `play()` 的同步部分本来就要 10–30 ms 一次。

改法：判据从「每次派发 < 50 ms」换成「**派发的次数 == `playAll` 自己认账的合格格子数**」。
理由写进注释：闸门能改变的只有「这一路有没有被告知播放」，而墙钟离散度正是这条 check 上面那段注释自己拒绝测量的东西。
非空断言仍由 6c（手机上开着闸门时 `dispatches == 0`）兜着，所以新判据不是「关掉纠偏器也算过」。
顺带：check 6 期间临时挡住 `openSeamGate`（bench 的 11 s await 里 App 自己可能真换段），并把结论同时写进 `window.__r79gate`，CDP 超时不再丢成绩单。

## 六、没做 / 仍然欠着

- 真机（小米14）这一轮没复测：「没变就跳过」和「重建后装回来」目前只有 AVD 读数。
- 指纹只看**相对路径集合**，不看大小/mtime：同名同路径但内容被覆盖（车机重写同名文件）会被判「没变」。
  取舍是有意的 —— 「刷新列表」的语义是重新扫目录，不是校验内容；要改得先定「变了」的判据要不要付 `stat` 的成本。
- 播放头在扫描窗口内停 ~3 s 这件事没查（AVD 上量不准，等真机的 `holds`/`lost` 一起看）。
- #301（AVD 专属 `rs=1` 交接）、预取、`boundary-tail` —— 与 R80/R81 同。

## 七、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.122-android-universal.apk` —— 27,941,859 字节，md5 `76c66e2e618e072fa94697a6890a5f8e`，双 ABI（aarch64 + x86_64）。
  已装到 AVD `tdashcam_phone` 跑完第三、四节。改动仍未提交（clone 没有 git 凭据）。
- 1.0.1 … 1.2.121 全部原样留在根目录（现在 114 个包）。
- 本轮新仪器：`devtools/r82-check.js`（三相位：强制重建 / 未变跳过 / 连点三次）、`r82-check2.js`（修了时序：先等 `isScanning` 抬起再等它落下，回 `{scanMs, wallMs, scans}`）、
  `r82-tap-recorder.js`（真手指点击期间 120 ms 采样行文案 / toast / 播放态 / 两个按钮的 `disabled`）、`r82-playall-probe.js`（把 `playAll` 的派发时刻单独量出来）。

## 八、本轮新增的假信号

- **播放中 ⋮ 面板活不过 3 秒**：`checkHeaderCollapse()`（`:12626`）无条件 `headerRight.classList.remove('active')`，播放器 chrome 一自动隐藏就顺手关掉面板。
  于是「tap 打开 → 隔几秒再 tap 行」的探针会读到 `TAP_SKIPPED ... unhit:flex/hidden/none` —— 看着像按钮坏了，其实是面板已经关了。
  要么两条 tap 连着发（`sleep 1` 都嫌多），要么先量一次坐标再直接 `input tap`。
- **`isScanning` 抬得比你想的晚**：它在 `loadTauriDirectory` 里、`await ensureMediaServer()` **之后**才置 `true`。
  点完立刻读是 `false` → 第一版 `r82-check.js` 的 `waitForScan` 第一次轮询就"等到"了，B/C 两个相位量到的是「扫描中」现场而不是「扫描后」成绩（行文案还是「扫描中…」就是证据）。
- **`await cp.playAll()` 在 AVD 要 11 s**（六路并发 `play()` 的缓冲），`cdp-eval` 默认 10 s 超时 → 超时不等于失败；结论要写进 `window.__*` 再读第二次（本轮给 `r79-gate.js` 补了 `window.__r79gate`）。
- **采样器最后一行是哨兵**：`{ms:-1, row:'recorder-stopped'}` 其余字段是 `null`，下游按字段处理（`x.ev.slice(...)`）会 `TypeError`，把整份读数变成一次「探针坏了」。
- **`SavedClips/*` 只有 1 段**：本轮又踩一次 —— 要六段可比的守卫探针必须用 `TeslaCam/RecentClips`（10 段）。
- **`playAll()` 之后同一条调用里读 `isPlaying` 是假的**：它只 await 各元素的 `play()` promise，标志位由 video 事件回填，AVD 上要晚 1–3 s（本轮读到 `{"play":false}`，3 s 后才是 `true`）。

---

# R83 —— 触发标注圈住的是画面，不是格子（1.2.122 → 1.2.123）

用户报告（小米14 竖屏单路截图，琥珀色框圈住整块播放区）：「打开"触发标注"，播放单路视屏的时候，标记把整个播放界面圈起来了，应该是圈视屏画面的。」

## 一、根因：描边挂在 `.video-container` 上，而格子从来不是画面

手机档每一路都是 `object-fit: contain`（`styles.css:4576-4588`，证据不能被裁切），所以「格子矩形」和「画面矩形」是两个东西。旧实现把 `outline` 画在格子上，圈的是前者。AVD 实测（`devtools/r83-geom.js` → `tmp/r83-sweep.json`）：

| 布局 | 格子 | 画面 | 多圈进去的黑边 |
| --- | --- | --- | --- |
| `single` 竖屏 | 412x751 | 412x267 | 上下各 242 px |
| `legacy` 主格 | 396x223 | 338x219 | 左右各 29 px |
| `grid4` / `grid` | 195x110 | 167x108 | 左右各 14 px |

所以这不是「单路才有的毛病」，四条布局都得改，只是单路最刺眼（真机截图里 242 px 的黑边全在框内）。

## 二、改法：框改成 JS 建的子元素，几何量一次、发布成四个自定义属性

- **CSS**（`styles.css:1189-1219`）：删掉 `.video-container.trigger-cam` 上的 `outline`，换成 `.trigger-frame` 子元素，位置尺寸全部读 `--trigger-left/top/width/height`（缺省 0/0/100%/100% = 旧行为）。
  当初选 `outline` 而不是 `border-color` 是因为每个宫格布局都以更高特异性重写 `border` 简写；改成子元素之后这场层叠架根本不用打。
  `z-index: 27` 落在换段覆盖层（`.feed-hold` 25）之上、相机角标（30）与缩小按钮（31）之下 —— 框永远不吞控件。
  `transition: left/top/width/height .3s` 跟 `.video-container` 自己的 `.3s` 对齐；系统「减弱动态效果」由 `styles.css:9379` 的 `*` 规则统一压到 1 ms。
- **角标跟着走**：`.video-container.trigger-cam .camera-label { top/left: calc(8px + var(--trigger-*)) }` —— 「前视 | 手动」原本独自留在黑边里，现在骑在框的左上角。
- **JS**（`script.js:15718-15857`）：`applyTriggerHighlight()` 只在命中的格子里建/留一个 `.trigger-frame`，然后交给
  `paintedFeedRect()` 量、`publishTriggerRect()` 写属性、`clearTriggerRect()` 在未命中时收回。
  `paintedFeedRect()` 的算法沿用 R64-2b 那条已被验证的判据：`min(元素宽, 元素高 × 宽高比)` 居中，坐标从**内衬盒**起算（宫格格子有 2 px 边框，`clientLeft/clientTop` 扣掉它）。

**三条故意退回旧行为（圈整格）的兜底**，因为「不知道画面多大」和「画面本来就没有黑边」不能画同一个框：

1. 该路被双指放大过（`feedZoom[camera].scale > 1.001`）→ 画面是**主动裁切**的，铺满格子；
2. `object-fit` 不是 `contain`/`scale-down` → 同上；
3. 宽高比既不在元素上、也不在缓存里 → 干脆不写属性（`publishTriggerRect` 走 `clearTriggerRect`），框回到整格。

## 三、什么时候重新量（这是这类修复真正的成本）

画面矩形会在五种时刻变化，漏一种就会留下一个「框和画面对不上」的新 bug：

| 触发 | 接线 |
| --- | --- |
| 布局切换（单路 ↔ 宫格） | `updateLayout()` 里新增一次 rAF（`script.js:5836`） |
| 旋转 / 窗口拖动 | `handleResize()` 本来就叫 `applyTriggerHighlight` |
| 格子自己变了尺寸 | 一个 `ResizeObserver` 观察六个格子（`ensureTriggerFrameTracking`） |
| 事件第一批元数据（比高亮晚 ~1.5 s 才到） | 每路 `loadedmetadata` |
| 换段那 ~360 ms 元素读 0x0 | 复用 `pictureGestureBand` 的 `this.feedRatio[camera]` 缓存 |

所有路径都汇到 `scheduleTriggerFrameLayout()`，用 `triggerFrameQueued` 合并成一帧一次 —— 旋转时 resize/layout/metadata 会成串到达，不合并就是六倍测量。

## 四、验收：竖屏 + 横屏 × 四种布局，全部 HUGS（`devtools/r83-verify.js`）

判据不复用被测代码的算式，改测三条独立不变量：**形状**（框的宽高比 == 画面宽高比，误差 ≤2%）、**在内**（框不越出 `<video>` 元素盒）、**居中**（contain 出来的画面两侧留白相等）。事件用 `SavedClips/2026-10-09_09-00-00`（真片比例 1.5437）。

```
竖屏 412x915   single  格子[412,727] 画面[412,267] 框[0,230,412,267] fr 1.5431 natR 1.5437 HUGS 角标[8,238]
               legacy  格子[396,223] 画面[392,219] 框[29,2,338,219]  fr 1.5434            HUGS 角标[37,10]
               grid4   格子[195,110] 画面[194,108] 框[14,1,167,108]  fr 1.5463            HUGS 角标[22,9]
横屏 915x412   single  格子[915,248] 画面[383,248] 框[266,0,383,248] fr 1.5444            HUGS 角标[274,81]
               legacy  格子[915,248] 画面[911,244] 框[269,2,377,244] fr 1.5451            HUGS
               grid    格子[148,104] 画面[146,103] 框[1,5,146,95]    fr 1.5368            HUGS
```

单路竖屏这一行就是用户截图那一格：旧框圈 412x727（含 189,776 px 黑边），新框圈 412x267。

三条兜底逐条量过：放大 → 框变整格（`props=0/0/412/727`）、取消放大 → 精确回到 `[0,230,412,267]`；
把 `videoWidth` 遮成 0（模拟换段窗口）→ 框与实测元数据时**逐像素相同**（`metaGapSame:true`）；
连缓存一起删 → 四个属性被清空（`props=-/-/-/-`），框退回整格而不是乱画。
⋮「不显示触发高亮」开关来回点：关 → `trigger-cam`/属性/角标文字全部收回，开 → 三路（`TRIGGER_VIEWS_MAX`）原样回来。

目视截图：`tmp/r83-after-portrait-single.png`（用户那一格）、`tmp/r83-after-landscape-single.png`、`tmp/r83-after-portrait-grid-sentry.png`（三路同时命中，每格框各自贴画面）。改前留档 `tmp/r83-before-single.png`。

**桌面一行未动，且当场证过**：把 `isPhoneLayout`/`isTabletLayout` 临时改成 `false` 再调 `applyTriggerHighlight` → `trigger-cam` 数 0、发布属性数 0；恢复判据 → 3 个框回来（`tmp/r83-gate.js`）。类只在这个门里加，被删掉的 `outline` 规则也只挂在 `.trigger-cam` 上。

## 五、回归：四本账 + 两件 R81 仪器照旧

- `node devtools/r77-axis-test.mjs` → **11/11**（`total=365.25 tape=365.25`、`acc=4.05`）。
- `cdp-eval --file devtools/r80-crossfile.js` → **`GUARD OK`**（对照 `rows=1` 且同段 `feedSeg==refSeg==5`，缺陷分支 `rows=0`）。
- `cdp-eval --file devtools/r79-gate.js` → **30/30 PASS**（结论写在 `window.__r79gate`，是个 JSON 字符串，要再读一次）。
- `r81-grid.js` → 顺序仍是 `front back left right left_pillar right_pillar`；`r81-theme.js` → `agree:true`、`bootTheme:dark`。
- 全程 `viewer.recentErrors` 为空。

## 六、没做 / 仍然欠着

- 真机（小米14）没复测：AVD 的格子尺寸和真机不同（真机竖屏单路是 412x751 那档），但**判据与算法与尺寸无关**，且真机比例同样是 1.5437。
- 换段瞬间框会不会跟着 `feedRatio` 缓存走一次「上一段的比例」：同一事件内不会（每路分辨率固定），**跨事件换片**时那 ~360 ms 会用上一个事件的缓存。有界、且 `loadedmetadata` 一到就重画，本轮没为它加失效逻辑。
- 框的圆角/线宽（6 px / 2 px）没做真机目视微调。
- #301（AVD 专属 `rs=1` 交接）、预取、`boundary-tail` —— 与 R80/R81/R82 同。

## 七、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.123-android-universal.apk` —— 27,943,651 字节，md5 `8468dfaa18752a97af05625af47dc8cd`，双 ABI（aarch64 + x86_64）。
  已装到 AVD `tdashcam_phone` 跑完第四、五节。改动未提交（clone 没有 git 凭据）。
- 1.0.1 … 1.2.122 全部原样留在根目录（现在 115 个包）。
- 本轮新仪器：`devtools/r83-geom.js`（格子/画面/黑边三件测量）、`r83-sweep.js`（四种布局的几何留档）、`r83-frame.js`（单帧同步判据）、
  `r83-verify.js`（横竖屏 × 四布局 + 三条兜底的完整验收，见第八节的时序要求）。

## 八、本轮新增的假信号

- **AVD 上「布局切换后 1.4 s」量不到新框**：重测走 rAF，而模拟器 rAF ≈ 1 Hz，`updateLayout()` 还额外套了一帧 → 实测 250 ms 时属性仍是旧布局的、2750 ms 才正确（`tmp/r83-trace.js` 逐档打点）。
  第一版 `r83-verify.js` 因此把 `legacy` 读成 `OFF 504` —— 是探针等太短，不是产品没重测。**验收脚本每档 settle 至少 3.2 s**。
- **`transition` 让「写完就量」必读到旧值**：自定义属性一改，`getBoundingClientRect()` 立刻量到的是过渡第 0 帧 = 旧矩形。
  所以放大/换段两条兜底必须 `layoutTriggerFrames()` 之后再 `sleep 900` 才读框（第一版把这两条读成 `OFF 85`，同样虚报）。
  要看「代码到底发布了什么」就读属性本身（`cell.style.getPropertyValue('--trigger-width')`），它不过渡。
- **`monkey -p ... LAUNCHER` 会把设备转回竖屏**：冷启动后 `user_rotation` 归 0；且 `accelerometer_rotation` 会被系统改回 1，之后写 `user_rotation` 不再生效。
  正确顺序是**先** `accelerometer_rotation 0`，**再** `user_rotation 1`。
- **`__r79gate` 是字符串不是对象**：`window.__r79gate = JSON.stringify(report)`，探针回读时按对象取字段会得到一串字符下标（本轮踩过一次，`{"0":"{","1":"\n",...}`）。
- **`SavedClips/*` 只有 1 段**（第三次踩）：`r80-crossfile.js` 直接 `{"err":"need 6 segments"}`，六段可比的守卫探针必须用 `TeslaCam/RecentClips`。

# R84（1.2.124）：全量代码审查——先证实，再修

本轮不加功能，只回答「代码里还有哪些 bug」。审查分三块读源码：播放引擎（换段/纠偏/seek 生命周期）、手机 UI 层（布局、触发标注、缩放、刷新恢复、删除）、原生（Rust 扫描/SEI/流服务、Kotlin 导出/诊断/本地化）。候选逐条回到源码路径或活页复现，只修有证据的 **14 条**（原生 6、前端 8）；没有证据的候选留着，不在这一轮顺手改。

**诚实边界先说**：除 Rust 崩溃有 1.2.123 → 1.2.124 的前后对照外，其余条目是「源码路径 + 修复后活页验证」，没有为每条都保留旧包 A/B。1.2.123 的基线探针在 corrupt-SEI 一步把进程打崩（见下），所以基线数据本身也不完整。

## 一、原生 6 条

| # | 缺陷 | 证据 | 修法 |
| --- | --- | --- | --- |
| N1 | `sei_reader::child()` 用文件头声明的 `size` 直接切 `pos + size`，恶意/损坏 MP4 的 box 长度可以大于父盒 | 1.2.123 在 `corrupt-sei.mp4` 上两次 SIGABRT：`panicked at src\sei_reader.rs:197:26: range end index 4294967040 out of range for slice of length 8`，`Fatal signal 6`，pid 整进程退出（logcat 留档 `devtools/r84-baseline-crash.txt`，09:26 与 09:42 各一次）。`Cargo.toml` 是 `panic = "abort"`，一次坏头就是整个 APP | `let end = pos.saturating_add(size).min(content.len()); pos = end;`（`sei_reader.rs:111`）。1.2.124 同一文件返回 `Err("mdia not found")`，APP 存活 |
| N2 | `stts_deltas()` 按文件里的 `count` 展开成同样多的 `u32`；损坏/敌意的 `stts` 可以要 16 GB | 源码路径（`sei_reader.rs:129`），与 N1 同一类「文件说什么就信什么」 | `MAX_STTS_SAMPLES = 1_000_000`（60 s × 36 fps 的两千倍以上），超限返回 `None` 走 JS 解析器（`:127/:138`） |
| N3 | `storage_status` 是同步 `#[tauri::command]`：在 Android 上跑 UI 线程，还要建目录并逐个列最多五个目录 | 源码路径（`lib.rs:52`）；U 盘走 FUSE 时是秒级冻结 WebView | 改成 `async fn` + `blocking(move || Ok(read_storage_status(guess)))`，失败回退成带 `error` 的状态（`lib.rs:52-66`） |
| N4 | Range 解析把「格式不对」与「范围不可满足」混在一起；`bytes=999999999-` 这类请求没有稳定的 416 响应 | 修复后 AVD 实测：跨域 `fetch` 只看到 `status 416`；PC 侧 `adb forward` + `curl -D -` 读到 `HTTP/1.1 416 Range Not Satisfiable`、`Content-Range: bytes */248605`、`Accept-Ranges: bytes`、`Access-Control-Allow-Origin: *` | `RangeRequest { Satisfiable, Unsatisfiable, Malformed }` + `parse_range()`；不可满足走 `range_not_satisfiable(file_len)`，畸形/无 Range 回 200 全文件（`stream_server.rs:151-196, 245-251`）。CORS 基头保持 `*` |
| N5 | Kotlin 用默认 Locale 拼小数：德语等区域是 `0,85`，JS `parseFloat` 读到 0；GL 的 `tx=a,b,c` 矩阵同理 | `"%.3f".format` / `"%f".format` / `joinToString(",")` | 四处诊断格式与矩阵统一 `Locale.US`（`MainActivity.kt:572/577/683/692`、`CameraStream.kt:163`） |
| N6 | 通知栏「取消导出」晚到（引擎刚清 `running`、`render()` 还没停服务）时 `ExportHost.cancel(0)` 是 no-op，服务留在前台并握着六小时 wake lock | 源码路径（`ExportService.kt:198-203`） | 取消后 `if (!ExportHost.isBusy()) stopSelf()` |

## 二、前端 8 条

| # | 症状 | 根因 | 修法 / 位置 |
| --- | --- | --- | --- |
| P1 | 换布局/切相机后某一路全黑，得再点一次布局才出画面 | 该路在换段时被挂起（没有 `src`），`applyFeedVisibility()` 对「可见但无 src」直接 `return`，从未补加载 | 清掉 `suspendedFeeds` 并 `loadDeferredFeed(camera)`（`script.js:5668`） |
| P2 | 单路停在 `left_pillar` 时切到四宫格，`activeCamera` 仍是柱位；双击切相机/收音焦点落在不存在的格子上 | `setLayout()` 只改布局，不校验当前相机是否在新布局可见 | 手机档 `grid`/`grid4` 下若 `activeCamera` 不可见则回 `front`（`script.js:5764`） |
| P3 | 切事件的瞬间发起的 seek，可能落到**新事件**上，画面突然跳段 | seek 目标在等待换段期间被捕获；`applySeek` 里两次 `await loadSegment()` 之后没有身份校验 | 每次 `loadEvent()` 递增 `eventGeneration`，`drainSeekRequests`/`applySeek` 在 await 前后校验，切换即放弃旧目标（`script.js:6719/6779/7016/7085`） |
| P4 | 换段那一下 `isPlaying` 被写成 false，手机 ±10 s 手势退回 0.1 s 逐帧，播放键变「暂停」 | `cleanup(true)` 仍调用 `pauseAll()`；暂停事件排到下一 task 才派发，而 `src=''` 之后已没有视频事件把它改回来 | `keepHeldFrames` 时**不暂停**、不改 `isPlaying`；`src=''` 本身就会停住元素。非换段调用仍 `pauseAll()` + `isPlaying=false`（`script.js:6638-6658`） |
| U1 | 双指放大/还原后，触发标注框还停在原来的黑边几何上 | 放大与否决定 `paintedFeedRect()` 返回「画面 contain 矩形」还是「整格」；`paint()` 没有在裁剪状态翻转时重排，`resetFeedZoom()` 也不重排 | 裁剪状态变化时 `scheduleTriggerFrameLayout()`；`resetFeedZoom()` 结尾同样调度（`script.js:14784/14959`） |
| U2 | 删除正在播放的事件后，六个空格子还留着上一事件的橙色触发框和相机角标 | 删除路径 `cleanup()` + `currentEvent=null`，但没有撤高亮；框元素是常驻的，只能靠类隐藏 | `applyTriggerHighlight(null)`（`script.js:16374`） |
| U4 | 扫描失败后顶部路径和最近目录 chip 停在一个从未加载成功的文件夹上 | 通用 `catch` 只弹 toast，没有回滚 `lastScannedPath` | `this.lastScannedPath = previousPath` 后再报错（`script.js:18257`） |
| U6 | 刷新列表后双指缩放状态丢了：画面回到 1×，但 `camera-zoomed` 的交互判据也没了/错位 | `restoreEventAfterRescan()` 恢复事件、相机、布局，没恢复 `camera-zoomed` 与 `preZoomLayout` | 快照里带 `zoomed/preZoomLayout`，恢复时补 `classList.add('camera-zoomed')`（`script.js:15161`） |

## 三、验收：`devtools/r84-verify.js` 在 1.2.124 上全绿

前端 JS 编进 Rust lib，APK 里列不到源文件，所以「代码是否在跑」用活页读函数源证明：9 个落点（`cleanupKeepsPlaying`、`visibilityLoadsMissing`、`layoutResetsActive`、`drainHasGeneration`、`seekHasGeneration`、`resetZoomRelayouts`、`restoreKeepsZoom`、`scanCatchRestoresPath`、`deleteClearsTrigger`）全部 `true`。功能项：

```
P2   before=left_pillar → after=front，visible=[front,back,left,right]
U1   object-fit=contain；画面实测宽 338（格子 412），放大 412，还原 338；
     撤高亮：cls=false、frameDisplay=none
P4   cleanup(true) 前后 isPlaying=true（再过一个 tick 仍 true），src 0
P1   visible 4 路，withSrc 4 路，currentUrl=true，suspended 不含 front
N4   Range: bytes=999999999- → 416（Content-Range 跨域不可见，见下）
N1   read_sei_metadata(corrupt-sei.mp4) → 拒绝 "mdia not found"，进程存活
U4   强制 nativeScanFiles 抛错 → 返回 false，lastScannedPath 停在 SavedClips，签名未动
U6   restoreEventAfterRescan({zoomed:true,preZoomLayout:'grid4'}) → 同事件、camera-zoomed、preZoom=grid4
P3   wait 期间 eventGeneration+1 → appliedAfterSwitch=[]；对照组 applied=[42]
```

## 四、回归（同一台 AVD、同一个 1.2.124）

- `node devtools/r77-axis-test.mjs` → **11/11**。
- `devtools/r83-verify.js` → 竖屏 single/legacy/grid4/grid 四档全部 `HUGS`（形状偏差 ≤0.0082、`inside/centred` 全真）；放大→整格、还原→338；`metaGapSame:true`；无比例时四个属性全空。
- `devtools/r80-crossfile.js` → **`GUARD OK`**：同段对照 `rows=2`（0.52→3.02、3.24→8.50），越文件分支 `rows=0`。
- `devtools/r79-gate.js` → **30/30 PASS**（报告同时留在 `window.__r79gate`）。
- `devtools/r81-grid.js` → `front back left right left_pillar right_pillar`；`r81-theme.js` → `agree:true`、`bootTheme:dark`。
- 探针跑完页面没有错误横幅/未捕获异常。

## 五、没做 / 边界

- **U2 没有做完整删除 E2E**：删掉一个真事件就毁掉 fixture，本轮只验到「删除路径确实调用 `applyTriggerHighlight(null)`」+「撤高亮后框 `display:none`」两段。真机删除流程仍建议在副本目录上点一次。
- **416 的 `Content-Range` 没在页面里断言**：跨域 `fetch` 只暴露 CORS safelisted 响应头，JS 侧永远读不到它；状态码 416 由页面断言，头本身由 PC 侧 `curl` 从线上读到并记在本节。`adb forward` 已撤。
- **AVD 是回归台，不是性能台**：本轮没有新的性能结论；R79 的 `ready 6/6` 仍然只在真机出现。
- 判为「不改」：`volumeExecutor` 生命周期、流服务的 `..` 子串拒绝（安全敏感，不放松）、R80 的 `timeout back seek`（有界逃生口）。
- 仍欠：**#301**（AVD 专属 `rs=1` 交接）、预取、`boundary-tail`，与 R80/R81/R82/R83 同。

## 六、交付（旧包一律不删不挪）

- `TDashcamStudio/Tessera-1.2.124-android-universal.apk` —— 27,973,371 字节，md5 `475499437c5617730a9ba092f146da57`，
  sha256 `8619988763cdcd57a02851f7c1c6b3f9c7287e8b1b70c3b2522af4175d8a50d0`，双 ABI（aarch64 + x86_64）。
  `versionName=1.2.124`、`versionCode=1002124`，已装到 AVD `tdashcam_phone` 跑完第三、四节。
- 根目录现在共 **116 个 APK**（1.0.1 … 1.2.124），旧版本原样保留。改动未提交（clone 没有 git 凭据）。
- 新仪器：`devtools/r84-verify.js`（本轮 14 条修复的活页验收）；`devtools/r84-baseline-crash.txt`（1.2.123 SIGABRT logcat 留档）。
  临时基线副本 `devtools/.r84-baseline.js` 已删除。
- 两条探针口径在本轮修正：触发框撤除后**元素仍在**，判据应是 `display:none` 而不是「元素消失」；416 的 `Content-Range` 跨域不可见，页面只断言状态码。

# R85（1.2.124 → 1.2.125）：第二轮全量审查——四个面同时读

用户：「请继续仔细审查代码，看有哪些bug并修复完善。」R84 读的是播放引擎与 Rust/Kotlin 主干，这轮换面：**删除/扫描/持久化/i18n**、**导出与剪辑链路（JS↔Kotlin 全链）**、**列表/搜索/时间轴**、**手势/浮层/生命周期泄漏**。四块各派一个只读审查任务，产出候选后**逐条回到源码核实**（行号必须是打开文件看到的，不采信摘要），最终 **24 条候选里 23 条成立并已修**，1 条成立但本轮不改。规矩与 R84 同：桌面一行不动，手机改动一律在门控内。

## 一、原生 8 条（Kotlin）

| # | 缺陷 | 成因链 | 修法 |
| --- | --- | --- | --- |
| N1 | **部分删除被报成整体失败** | `deletePathsJson` 逐个 unlink，失败时返回 `ok:false` + 已删条数；JS 只看 `ok` 就原样返回列表 → 卡片留在屏上指着已经不存在的文件，而正在播的那路早在确认删除时被拆掉了。另：`freed += file.length()` 写在 `delete()` **之前**，失败的文件也算进了「已释放」 | 只统计真正 unlink 成功的字节，并回 `deletedPaths`；JS 按这份清单精确剪枝（`MainActivity.kt:861-884`） |
| N2 | 删剩一半的事件表格错位 | `eventGroups` 里的事件带 `segmentDurations`/`segmentStartTimes` 两张按索引读的表 | 新增 `eventAfterDelete()`：丢掉整段都没了的 segment，两张表跟着重切、起点重算、`thumbFile` 若在被删清单里一起清（`script.js:16571`） |
| N3 | 删除后收藏/进度留着死 id | 删除成功只过滤 `allFiles`/`eventGroups` | `forgetDeletedEvent()` 一并清 `starredIds` 与位置表（`script.js:16592`） |
| N4 | **导出被拒的广播会毒化状态** | `submit()` 的「已有任务在跑」走 `publish()`，而 `publish` 写 `latest` 并置 `delivered=false`。页面重连时 `status.running=true` 且 payload 是那个**从未启动过**的 id → 采纳它 → 真任务的进度与结果永远被 id 过滤掉：胶囊卡在「导出中 0%」、「开始导出」一直禁用、成片无 toast 无媒体扫描 | 新增 `publishRefusal()`：只发给观察者，不动 `latest`（`ExportService.kt:115-133`） |
| N5 | 迟到的第二份请求能拆掉正在编码的前台服务 | `if (ExportHost.run(request) < 0) stopSelf()` 没有 `isBusy()` 守卫（同文件另外两处都有） | 加守卫，与 idle 分支同一判据（`ExportService.kt:209-214`） |
| N6 | **取消时的收尾 flush 会毁掉本该留下的半截文件** | 取消分支 `if (index < 0) break` 把 `INFO_OUTPUT_FORMAT_CHANGED` 当成队列结束（正编排在 396 行是单独处理的），且不像另两处过滤 `BUFFER_FLAG_CODEC_CONFIG`。取消落在最初一两秒 → `trackIndex` 仍是 -1 → 抛错删文件，而页面刚对用户说过「已写入的片段保存在文件里」 | 与主循环同规则：格式变更即建轨，配置缓冲不写样本（`ExportEngine.kt:318-344`） |
| N7 | **播放时把别人的音乐整首停掉，自己却不出声** | 六路一律 `muted`（Tesla 无音轨，R25 已删单路声音），但申请的是 `AUDIOFOCUS_GAIN`——系统的语义是「独占」。且 `onPause` 只放窗口亮度覆盖，不放焦点：JS 侧的释放只来自 `updatePlayState(false)`，而 `WryActivity.onPause()` 已把 WebView 冻住 | 改 `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK`（打断照旧回调→暂停），焦点意图与实握分开，`onPause` 交还、`onResume` 收回（`MainActivity.kt:455-505, 616-640`） |
| N8 | 每次 insets 推送都在 UI 线程做磁盘与 Settings 读 | `pushState()` 在 UI 线程调 `stateJson()` → `downloadDir()` 里 `mkdirs()`（FUSE 上秒级）+ 两个 `Settings` provider 的 Binder 读；推送在旋转/键盘/全屏/聚焦时成串发生。R38 只把「第一次推送」推迟了，没把里面的活搬走 | 组装挪到 `volumeExecutor`，成品字符串回主线程投递（`deliverState`），保持推送次序（`MainActivity.kt:1025-1055`） |

## 二、前端 15 条

| # | 症状 | 根因 | 位置 |
| --- | --- | --- | --- |
| P1 | 抽屉搜索里输 `09:00` 永远「没有找到匹配的记录」 | `startTime` 是文件名时间戳 `2026-10-08_09-00-00`，`new Date` 读成 Invalid Date，时钟查询全落在 NaN 守卫上 | 按 `parseTimestamp` 同款换算（`script.js:13186`） |
| P2 | 一次开着剪辑的换段，那一分钟从此永远不纠正 | `recordAxis` 先写 `axisSeen[index]` 再调 `rebookAxis`；剪辑/拖条时 `rebookAxis` 返回 false，而 `noteAxis` 与看门狗都跳过已见过的索引 → 再也不会重试，`owed=` 还把它算成已量 | 只在重记真的落地时记 `axisSeen`，被拒则重新武装看门狗（`script.js:6868`） |
| P3 | 进度条/曲线点对了画面却跳偏 | `rebookAxis` 改了轴，`setTotalDuration` 只重画胶片不重画速度曲线；曲线仍按旧 span 布局、`seekFromSpeedGraph` 按新 total 反算 | `refreshSpeedGraph()`，重记成功后重画（`script.js:6923, 8451`） |
| P4 | 刷新列表后回到「早了几秒」的位置 | 快照存 `getCurrentTime()` 的绝对秒——那是**旧事件已重记的轴**上的值；重建后的事件又按每段 60 s 记账 | 快照改存 `{i,t}`（`positionEntry`），恢复时经 `secondsFromPosition` 按当下轴换算（`script.js:7013, 15831, 18436`） |
| P5 | 正在看的事件，「上次位置」会自己消失 | 对象里重写已有键**保持原插入位置**，60 条上限的 FIFO 淘汰于是能把刚写进去的当前事件剪掉 | 先 delete 再写，淘汰按真实最近使用（`script.js:15765`） |
| P6 | 删掉正在播的片段后：六格全黑、进度条还写着上一段的总长、找片底图不回来 | `#playerArea` 自带 `empty`，`playEvent` 摘掉后没有任何路径放回去（`player-empty`/`clip-loaded` 由它镜像） | `showPlayerEmptyState()`，删除与清理路径调用（`script.js:16521, 16614`） |
| P7 | 任何筛选一次，正在播的卡片高亮就没了 | `.video-card.active` 只在 `playEvent` 里写，`render()` 整容器重建 | 卡片创建时按当前事件补标，仅手机档（`script.js:5127`） |
| P8 | 「只看收藏」里点掉 ☆，列表跳回顶部 | 该情形必须走筛选_pass_，而它 `innerHTML=''` 会重置 `scrollTop` | 存-渲染-恢复同一偏移（`script.js:16078`） |
| P9 | 「清除筛选」后日历里那天还亮着，再点一下筛选又回来了 | 直接写 `dateFilter.value`，没清 flatpickr 自己的 `selectedDates` | 有实例就 `clear()`，并同步 ✕ 按钮可见性（`script.js:13118`） |
| P10 | 选到一个没有录像的文件夹后，顶部路径与 chip 指着它，列表却还是上一个文件夹 | 只有抛异常那条路径回滚 `lastScannedPath`；`invalidFolder` 与空目录两条软失败没回滚 | 两条软分支同样回滚（`script.js:18477, 18488`） |
| P11 | 部分删除的文案在骗人 | 旧逻辑只有「全删成功」与「失败」两种口径 | 新增 `deletePartial`（中英两套 i18n），带成功条数与被拒文件 |
| P12 | **导出的 mp4 里没有烧录的 HUD/时间戳** | 预览先算过一次叠加层并按 `事件|区间|开关|语言` 缓存；遥测样本是**之后**才补上的，而失效只清了 `peTelemetryKey` 不清 `peCaptionKey` → 拿空样本算出的空清单被一直复用 | 缓存键含样本数，样本一变即重算（`script.js:20319`） |
| P13 | 导出面板会「认亲」认到假任务 | 见 N4 的页面侧 | 只在 payload 是活跃阶段时采纳其 id；不是我们任务的 error 广播改为**toast 出来**而不是静默丢弃（`script.js:20748, 20808`） |
| P14 | 同事件两刀会互相覆盖 | 文件名区间 `Math.round()` 到整秒；细调手柄本来就是 0.1 s 一档（12.2 与 12.4 都进位成 `12-22s`）；截图名只有 事件+相机 | 导出区间记到十分之一秒，截图名带播放头（`script.js:20547, 15609`） |
| P15 | 捏合放大后能把画面拖出格子，露出黑底 | 平移上限用**格子**尺寸算，而手机档每路 `object-fit: contain`——可 overflow 的是**画面**尺寸。竖屏单格 412x760 里画面只有 342x760，纵向上限按 760 算就等于没限 | 新增 `containFeedSize()`，捏合与单指平移都改用它（`script.js:14917, 14955, 16016`） |

另外三条同族修：`waitForAllVideosLoaded` 的 4 s 放弃等待只弃 await 不卸监听（六路 × 每次换段永久留住 `resolve` 闭包）→ 改 `AbortController` 的 `signal`（`script.js:5951`）；三个底部抽屉的 300 ms 收手定时器不看 `.show` 就把 `display:none` 盖回去（重开够快就留下「看不见但算一层」的浮层，返回键点掉的是它）→ 与导出面板同一判据（`script.js:17409, 17958, 18008`）；亮度拖动每次 `pointermove` 都同步写 `localStorage` 并跨一次桥（原生侧三次 `Settings` 读 + 一次 `window.attributes` 重排，60–120 Hz）→ 量化到 1/50 档 + rAF 合并，落点才持久化（`script.js:14592, 14608`）。

## 三、i18n：这次没有缺陷

`en`/`zh` 两套表逐键对照（含 `.key`、`data-i18n`、`data-i18n-placeholder`、动态拼键 `theme{Auto,Light,Dark}`、`tapMode*`、相机 camelCase、`peNotifLabels` 子键）：除两个 zh 独有且**无人引用**的键外两套对称；代码里替换的 `{token}` 两套都有；无键会渲染成 `undefined`。本轮新增的 `deletePartial` 两套同时加。

## 四、验收（`devtools/r85-verify.js` + `r85-verify2.js` + `r85-verify3.js`，装在 1.2.125 上）

- **代码是否在跑**：25 个新落点的函数源从活页读回，全部在位（前端 JS 编进 Rust lib，列 APK 证明不了任何事）。
- 功能项：P1（`09:00` 与其后一分钟命中、`23:59` 不命中）；P2（剪辑开着时被拒 → `axisSeen` 不落、看门狗重武装、关掉后按前视真实时长 18.27 s 重记成功）；P4（`{i,t}` 与当下轴一致）；P3 接线（重记触发一次重画、无曲线时不触发）；P5；P6（控件 `display:none`、底图 hero `flex`）；P7（重建后高亮仍在）；P9（`selectedDates` 归零、输入框清空）；P10（软失败两条都不再记住坏目录）；P11/P12（空样本时 0 条、补上样本后 20 条）；P14；P15（画面 342x760 == 独立算式，且窄于格子 412）；N1/N2/N3（删掉一整段六路 → 10→9 段、两张表对齐、起点单调、整段全删时卡片消失；只删一路时保留该段；整条被拒时列表一字不动并给出诚实 toast）。
- **没验到的，写清楚**：P8 在 AVD 上是**空跑**——7 行收藏不足一屏（`scrollHeight 586 == clientHeight 586`），滚动位移无从测量，只有代码路径为真；P13/N4/N5 需要「同时跑两个任务 + 杀进程重进」才能演出来，本轮只做到源码与编译层；N6 需要「开跑 1 s 内取消」的时间窗；N7 要外部音乐 App 在场，模拟器没装；P15 的桥次数没测到——探针 spy 的命令名没匹上，只验到「拖动过程中不再写 localStorage」这一半；N8 是线程改动，AVD 上 jank 本来就不是可信读数。
- 回归全绿：`r77-axis-test.mjs` **11/11**、`r83-verify.js` 四档布局 `HUGS`（含放大/还原/遮 `videoWidth`/无比例四条兜底）、`r80-crossfile.js` **GUARD OK**（对照 2 次、越文件 0 次）、`r79-gate.js` **30/30**、`r81-grid.js` 顺序照旧、`r81-theme.js` `agree:true`、`r84-verify.js` 九项落点 + 九步功能全过。

## 五、没做 / 仍然欠着

- **缩略图不看旋转元数据**（成立但没改）：`ThumbFetcher` 用 `getFrameAtTime` 出原帧，从不读 `METADATA_KEY_VIDEO_ROTATION`，而 `<video>` 兜底与导出（`CameraStream.kt:208`）都尊重它 → 带旋转的码流会出现横倒的卡片/胶片图。修法要引 `Matrix` 预旋，风险在别处（尺寸与内存），单开一轮做，不塞进这一轮。**〔R86 更正：这条判断是假的。`getFrameAtTime` 自己就把旋转做掉了（AOSP 从 API 24 的 JNI 起就调 `rotate()`），缩略图从来不用补；真要补反而会把好的转成歪的。真正的漏网在导出那一路，见 `# R86`。〕**
- 桌面侧三条低优先：速度曲线小点在英文界面下仍传 `locale = undefined`（中文手机上会读成「上午7:31:07」）、`5148` 单段事件写「1 minutes」、桌面用反斜杠路径时 `[data-event-id="…"]` 选择器会把它当 CSS 转义吃掉。**都在桌面分支，按规矩不动。**
- 旧欠：**#301**（AVD 专属 `rs=1` 交接）、预取、`boundary-tail`。
- 真机（小米14）本轮没复测：AVD 是回归台不是性能台，N7/N8 这两条恰恰最需要真机耳朵和 `gfxinfo`。

## 六、交付（含一件必须说清的事）

- `TDashcamStudio/Tessera-1.2.125-android-universal.apk` —— 27,978,299 字节，md5 `a5909f743347928487a6984437153eb0`，sha256 `f296ed51d184fad1c1e3e9160204698b3907aac3591f8005a4bfd0b1861be696`，双 ABI；`versionName=1.2.125`、`versionCode=1002125`，已装到 AVD `tdashcam_phone` 跑完第四、五节。改动未提交（clone 没有 git 凭据）。
- **旧包数量**：本轮核对时发现根目录只剩 1.2.120…1.2.125 六个，一问才知道是用户自己删了 1.0.1…1.2.119 腾磁盘空间（每个约 28 MB）。**旧包由用户自行清理，不再是保留要求**；追溯靠本文档各轮的 size/md5/sha256 与改动清单，所以那份清单必须写全。构建产物路径固定（`…/apk/universal/release/app-universal-release.apk`），下一轮会原地覆盖，所以照旧：**构建一成功就立刻 `cp` 到根目录**。
- 新仪器：`devtools/r85-verify.js`（25 个落点 + 功能面）、`r85-verify2.js`（把五条被我写错的判据改对）、`r85-verify3.js`（`L3` 重试与 `L7` 长列表两条最后修正）。构建日志留在 `%TEMP%/r85-build.log`。

# R86（1.2.125 → 1.2.126）：专攻缩略图旋转——结果是导出被转了两次

## 一、先说结论：上一轮那条「缩略图不看旋转」是假的，真 bug 在导出

按「先排查问题」的规矩，这一轮只做一件事：把旋转元数据从码流一路量到像素。结论有两条，方向相反：

1. **缩略图一直是对的**，`ThumbFetcher` 不需要补任何旋转。上一轮那条判据（「从不读 `METADATA_KEY_VIDEO_ROTATION`」）读代码读得出来，量像素量不出来——它是个假阳性，而且如果照着它去补 `Matrix` 预旋，就会把本来正的图**转歪**（第二次旋转）。
2. **真正被转错的是原生导出**：带旋转元数据的码流导出来，画面是**未旋转的编码画面**，而且输出文件里没写旋转标记 → 在相册/播放器里就是横倒的。根因是 `GlRenderer` 在解码器已经转过的基础上，又自己叠了一次 `-rotationDegrees`。

## 二、怎么把「旋转」变成一个可测量的对象

没有 ffmpeg，就不引入下载；直接用码流层能改的最小单位——MP4 的 `tkhd` 变换矩阵：

- `devtools/r86-mkrot.js <in> <out> <0|90|180|270>`：只改写视频轨的 9 格矩阵（`a,b,c,d` 用 16.16、`u,v,k,l,m` 用 2.30，ISO 14496-12 的顺时针式），**不重编码、不动样本**，写之前先断言那里确实是单位矩阵。同一条 `clip-real.mp4`（coded 1080x2400）于是变成四个「内容完全相同、只有声明不同」的样本 —— 这是唯一能把旋转单独当变量测的做法。
- `devtools/r86-tkhd.js`：按规范偏移把每个 `tkhd` 的矩阵与显示宽高打出来（顺带修正了 `mp4-geometry.js` 把矩阵基址算短 16 字节的老错，它之前把 clip-real 的显示尺寸读成 `0x0`）。
- 判据不能只看尺寸：180° 不换长短边，任何「按宽高判断有没有转」的断言对 180° 都是瞎的。所以补了**内容指纹**：把缩略图拉伸进 12x12（导出那一路用 24x24）格网取亮度，再和「把候选图转 0/90/180/270 后」的差值比大小，赢家与次优必须拉开距离；同时报每格的方差（`spread`），平坦图会让比较变成空跑，宁可报「没测到」也不报「过了」。

## 三、缩略图侧的读数（改前，API 36 AVD）

| 声明 | 缩略图尺寸 | 要还原到 0° 声明所需的转角 | 最优差 / 次优差 |
|---|---|---|---|
| 0° | 160x355 | — | — |
| 90° | 160x72 | 270 | 11 / 45 |
| 180° | 160x355 | 180 | **1.33** / 45.3 |
| 270° | 160x72 | 90 | 11 / 50 |

四条路同时量（`r86-orient2.js`、`r86-card.js`）：列表卡片 `<img>` 160x72 横、原生 `requestThumb` 160x72 横、`<video>` 报 2400x1080、页面 `<video>`+canvas 兜底 160x72 横 —— 全部一致，方差 65~66（不是平坦图）。AOSP 侧佐证：`android-7.0.0_r1 / 7.1.0_r1 / 8.1.0_r1` 的 `android_media_MediaMetadataRetriever.cpp` 里 JNI 就在调 `rotate()`，`case 0/90/180/270` 齐全，90/270 还会换宽高；`StagefrightMetadataRetriever.cpp` 把 `METADATA_KEY_VIDEO_WIDTH/HEIGHT` 填成 `kKeyWidth/kKeyHeight`（**编码**尺寸），旋转另用 `METADATA_KEY_VIDEO_ROTATION` 报。也就是说：从 minSdk 24 起就没让调用方补过课。**判定：不改 `ThumbFetcher`，只留一条注释说明为什么这里不该出现旋转代码**（防下一轮审查又把它捡回来）。

## 四、导出侧的漏网与修法

改前三条声明各导一路单相机（画布按各自显示比例，避免信箱干扰）：

- `declared 90` → 输出要转 270 才等于源片（差 8.19，次优 52）；`270` → 要转 90；`180` → 要转 180；`0°` 对照 → 差 0。三句话并成一句：**导出的像素永远等于未旋转的编码画面**，输出文件 `tkhd` 是单位矩阵（`mp4-geometry.js` 读回 1280x576 + identity），所以播放器里就是歪的。
- 日志证明值读到了：`TdExportCam: front first frame size=1080x2400 rot=90`（`CameraStream.kt:162`）。值在，但没落到像素上。
- 根因：`GlRenderer.drawTexture` 把 `-rotationDegrees` 折进采样矩阵，注释写的是「旋转是显示属性，解码器那条路绕过它」——这个前提是错的。解码器输出到 Surface 时，Android 已经把容器旋转**折进 buffer 的 transform flag**：`frameworks/av` 的 `CCodecBufferChannel.cpp` 逐帧算 `rotation[frameIndex]`（还把顺时针改成逆时针），老实现同理 `ACodec.cpp:6271 setNativeWindowRotation(...)`；`SurfaceTexture.getTransformMatrix` 把它原样交回来（AVD 上表现为一个反对角矩阵，而不是常见的 y 翻转——这也是为什么单看矩阵数值会误判）。采样既然已经按矩阵走，我们自己那一次就是**第二次旋转**。
- 修法（`export/GlRenderer.kt`、`export/ExportEngine.kt`、`export/CameraStream.kt`）：删掉自叠的那一次（连带 `rotationMatrix` 字段与 `android.opengl.Matrix` 导入），`drawTexture` 不再收 `rotationDegrees`；`CameraStream.rotationDegrees` 保留，但只用来算格子该占多大（`displayWidth/displayHeight`）和日志。副作用是好的方向：隐私打码框与烧录 HUD 是按「显示画面」给坐标的，以前导出比预览歪 90°，现在两边对齐了。

## 五、验收：改前改后同一支探针对着打

`devtools/r86-ab.js` 在装机前后各跑一次（同一段源、同一秒、同一画布），指纹逐格比：

| 用例 | 改前 单元 vs 源片 | 改后 | 整图指纹位移 |
|---|---|---|---|
| 单路 0°（对照） | 4.11 | **4.11** | 0（完全一致） |
| 单路 90° | 67.02 | **7.58** | 4（只有该改的改了） |
| 1x2 双路 RecentClips | 17.56 / 17.56 | **17.56 / 17.56** | 0（两格几何没动） |

- 三角度复测（`r86-export180.js` 改后）：90° → identity 差 **1.45**（次优 51.95）；270° → **1.52**（次优 54.06）；180° 那一跑我给了横向画布（竖屏显示配横画布 = 大片黑边，比较被污染），差值 33.11 只算勉强赢——所以补了 `r86-check180.js`：576x1280 画布 + 按实际绘制内容裁边 + 24x24 格，identity 赢家领先次优 **59.38**，三个角度全部落定。
- 目视留档：`devtools/r86-evidence.js` 把「源片缩略图 / 1.2.125 导出 / 1.2.126 导出」三行叠在页面上截图 → `devtools/r86-before-after.png`。第一行与第三行同向（这条 fixture 本来就是「竖屏录屏被声明成 90°」，正确显示就是横着看），第二行明显是另一回事。数字：改前 vs 源 61.66，改后 vs 源 **1.33**。
- 回归：`r84-verify.js` **10 过 0 挂**；`r83-verify.js` 四档布局 + 放大/还原/遮 `videoWidth`/无比例全 `HUGS`；`r85-verify2.js` 六过（`L3`/`L7` 两条是它自己的旧判据，已由 verify3 取代）、`r85-verify3.js` 的 `L3` 过；`probe-r20-grid.mjs` 重导 + `probe-r20-gridverify.mjs` 块图仍是「左右两格各自带侧黑边」的图案，多路几何没退化。前端一行没动（`script.js`/`styles.css`/`index.html` 的时间戳都早于本轮，本轮只改三个 Kotlin 文件 + `tauri.conf.json`），所以 JS 侧那批断言不可能移动。
- 出包前 `SO_MATCH`：APK 内 `lib/arm64-v8a/libtdashcam_studio.so` 与 `target/aarch64-linux-android/release/` 同名文件 md5 相同（`655ba5f9…`），没把旧产物当新的交出去。

## 六、没验到 / 仍然欠着

- **`L7`（收藏切换后列表滚动位置）这轮又没测成**：筛选后整列表的可滚范围只有 36 px（`scrollHeight 598`、`clientHeight 562`），「恢复到 109」在这台 AVD 上任何实现都做不到——判据本身不成立，不是代码问题。要真机长列表。
- **假设边界**：修法建立在「解码到 Surface 时旋转由 buffer transform 携带」这条 AOSP 契约上（`CCodecBufferChannel` 与 `ACodec` 两条路都实现了）。万一某 OEM 实现不折进 transform，它那台机器的旋转片导出会退回「和现在一样歪」，不会更糟；这条只能真机验证。
- 真机（小米14）复测清单：① 手机拍的竖屏视频单路导出后在相册里是否正；② 列表卡片与胶片条对同一条片是否同向；③ `L7` 长列表滚动恢复；④ 上一轮那七条「代码改了、AVD 演不出来」的项。
- 设备侧临时件已清：`SavedClips/2026-10-17_11-30-00`、`Download/r86*`、`Download/r86-ab-*.mp4`、`Download/r86-out-*.mp4` 都删了。要重建：`node devtools/r86-mkrot.js devtools/clip-real.mp4 devtools/r86-rot90.mp4 90`（180/270 同理），`adb shell mkdir -p /storage/emulated/0/TeslaCam/SavedClips/2026-10-17_11-30-00`，然后把 `2026-10-17_11-30-00-{front,back,left_repeater,right_repeater,left_pillar,right_pillar}.mp4` 分别 push 成 rot90/rot270/rot0/rot0/rot180/rot0。
- 旧欠：**#301**（AVD 专属 `rs=1` 交接）、预取、`boundary-tail`。桌面侧三条低优先照旧不动。

## 七、交付

- `Tessera-1.2.126-android-universal.apk`（工作区根目录，与 1.2.121…1.2.125 并排）—— 27,978,299 字节，md5 `1401ac7b86d67e8921d742c24a353e9d`，sha256 `ad5bbde630fd765e3d171e2bd498377a54ba89895d31acbe5c0bace3698df93a`，双 ABI；`versionName=1.2.126`、`versionCode=1002126`（`aapt2 dump badging` 核过），已装进 AVD `tdashcam_phone` 跑完第五、六节。改动未提交（clone 没有 git 凭据）。
- 本轮改动清单（只有 4 个文件，前端零改动）：
  1. `src-tauri/gen/android/app/src/main/java/com/tdashcam/studio/export/GlRenderer.kt` —— 删掉自叠的 quarter-turn（`rotationDegrees` 参数、`rotationMatrix` 字段、`Matrix` 导入），注释改成「矩阵已经带转，别再转一次」。
  2. `.../export/ExportEngine.kt` —— `drawTexture` 调用去掉旋转实参。
  3. `.../export/CameraStream.kt` —— `rotationDegrees` 的用途注释（只用于算显示宽高与日志）。
  4. `.../ThumbFetcher.kt` —— 加注释说明这里为什么不该出现旋转处理（AOSP 自 API 24 起在 JNI 里 `rotate()`，API 36 实测四个角度全中）。
- 新仪器（全部留在 `devtools/`）：`r86-mkrot.js`（改 `tkhd` 造旋转样本）、`r86-tkhd.js`（矩阵/显示尺寸读数）、`r86-probe.js`（原生取帧方向普查）、`r86-orient2.js`（卡片/原生/播放器/canvas 四路一致性）、`r86-card.js`（抽屉打开后卡片缩略图实测）、`r86-content2.js`（内容指纹判转角，180° 靠它）、`r86-export3.js` / `r86-export180.js`（导出三角度普查）、`r86-check180.js`（等比画布 + 裁边的 180° 复测）、`r86-ab.js`（改前/改后指纹 A/B）、`r86-evidence.js` + `r86-before-after.png`（目视留档）。构建日志 `%TEMP%/r86-build.log`；A/B 原始读数 `devtools/r86-ab-pre-125.json`、`devtools/r86-ab-post-126.json`、`devtools/r86-angles-post.json`。

# R87（1.2.126 → 1.2.130）：导出水印——特斯拉能给的数据，和怎么打才不挡画面

## 1. 这轮要解决的问题

需求原文：「现在搞水印功能，特斯拉自带的数据哪些可以打水印上去，怎么弄上去才好看美观，不怎么遮挡画面」。
先把两件事分开量清楚，再动手：

1. **数据面**：`src/dashcam.proto` 定义的 SEI 只有 16 个字段（gearState、vehicleSpeedMps、acceleratorPedalPosition、
   steeringWheelAngle、blinkerOnLeft/Right、brakeApplied、autopilotState、latitudeDeg、longitudeDeg、headingDeg、
   linearAccelerationMps2X/Y/Z、version、frameSeqNo），加上 `event.json` 的 city/street/eventTimestamp/lat/lon/reason
   和文件名本身。**拿不到的**：VIN、车辆昵称、固件版本、驾驶员、车牌、天气、里程/能耗、限速标志、导航目的地。
   所以「证据自证」这一档能写的只有：时刻、位置、车速、档位/驾驶模式、触发原因、源文件。
2. **proto3 的 0 和「没记录」不可区分**（只有 lat/lon 同时为 0 才敢判成「无定位」）。这一条决定了：开关打开但附近
   没有采样时必须印 `--`，绝不能印一个看起来合理的 0。

## 2. 排版定稿（先出效果图，用户点头后才写代码）

- 默认 **顶部居中**；可选 左上/顶部居中/右上/左下/底部居中/右下/自动（塞黑边）。「画面正中」被删——它一定挡路。
- 层级：**车速最大且加粗**（唯一需要一眼读出的数），时间戳次之，单位 `km/h` 缩到 0.72 倍并降透明度；
  经纬度/航向、行驶状态各一行小字；溯源尾注最小最淡，且**默认关**。
- 可读性靠 **描边 + 投影**，不靠黑底：黑底板才是真正吃掉画面的东西。仍保留「淡纱」「黑底」两档给雪地/高亮场景。
- **车速条**（默认开）：主行下方一条 0.30% 高的细杠，13% 画宽，满量程 150 km/h——余光就能看出快慢。
- **字号可调** 0.7×–1.8×（步进 0.05），**必须有真预览**（所见即所得），并且把「水印占画面 x%」直接印在预览下面。
- GPS 单独一个开关，**默认关**（用户明确要求）。

## 3. 实现：一套算术，两边各写一遍

`WM_LAYOUT`（`src/script.js`）与 `Wm`（`CaptionOverlay.kt`）是同一组数字的两份抄写，注释里互相点名；
预览 `pePaintPreviewWatermark()` 与 `CaptionOverlay.render()` 是同一套排版的两份实现。改动其中一份必须改另一份。

- 前端：`readExportOverlay()` 扩成 `{mosaic, stamp, hud, gps, source, state, bar, place, bg, scale}`；
  新增 `phoneExportSampleAt / phoneExportSpeedAt / phoneExportGpsAt / phoneExportStateAt / phoneExportSourceAt /
  wmAutopilotLabel / wmCoord / wmOptions()`；`CaptionSpec` 从一条拼好的字符串改成 `{us, clk, spd, bar, gps, st, src}`
  具名字段（引擎没法给它 styling 它读不出来的东西）。缓存 key 补上全部开关**和采样点数**（R85 的教训）。
- Kotlin：`CaptionOverlay` 重写为锚点式（TOP/CENTER/BOTTOM/BAND_TOP/BAND_BOTTOM）、描边+投影、行内多字号 run、
  车速条、遮挡面积自报日志；`ExportEngine` 传 `wm{}` 并把「画面实际落在哪」回灌给 `auto`。
- 面板：`#peWmContentChips`（6 个内容开关）+ `#peWmStyle`（7 位置 / 字号滑杆 / 3 背景），一个开关没开时整段折叠。

**默认值**（`stored.stamp !== false` 这种写法，显式关过的人仍然关着）：时间戳、车速、车速条、行驶状态＝开；
GPS、溯源尾注＝关；位置＝顶部居中；背景＝描边；字号＝1.0×。
〔这是有意的改动：升级后从没碰过「叠加层」的人，导出会开始带水印——预览里看得见，不是暗改。〕

## 4. 三条真实缺陷（都是先量出来再改的）

1. **列锁定锁错了参照**：`lockedWidth` 只把数字换成 `8`，锁住的是「位数」而不是「字段宽度」，于是 9.4 → 104.7
   照样把整行往左右推。改成按字段格式给一个固定参照 `WM_SPEED_REF='888.8'`（速度永远是 `toFixed(1)`）。
   实测：改前三档速度块宽 225/272/248，改后恒为 270。
2. **`auto` 读到的是空并集**（1.2.129 修）：`ExportEngine` 在第一帧合成时就把「画面落在哪」上报，可那时所有路的
   `updateTexImage()` 都还没出帧，累加器还是初值 top=1.0/bottom=0.0 —— 倒挂的空集在 `auto` 眼里等于「下面整条都空」，
   于是水印被塞到画面正中。判据是行直方图：`r87-where.js` 数出亮像素全在 frameY 269–388（画面内部），而预测的
   y=71 那条带 max=1（纯黑）。改成「所有路都贡献过才上报」，且只有 `auto` 需要等（其余锚点不等，免得白丢首帧）；
   `setPaintedArea` 另加倒挂归一化（当成满幅，退回 TOP）。
3. **预览比文件宽 4%**：位图按整幅宽渲染，却画进左右各留 2% 的矩形里，字形被横向压了 4%，纵向没压——
   于是「预览」不是「文件」。改成按**实际跨度**（`frameWidth*(1-2*margin)`）算位图尺寸，两轴同比例。
   顺带把预览的字体从 `500` 改成 `400`（`Typeface.SANS_SERIF` 无 flag 就是 Roboto Regular，Medium 和 Regular
   的字宽差就是百分比级的漂移），并把逐行居中对齐、plate 圆角参照、veil 只罩住块本身这几处两边对齐。

## 5. 顺带补的一个洞：单路导出根本没有预览

预览帧长在「摆放」组里，而那个组从 R27 起是 `cameras.length > 1` 才显示（一路填满画面，没什么可拖）。
后果是：**最常见的单路导出，水印既看不到预览也看不到占面百分比**——而水印预览恰恰是这轮的核心诉求。
1.2.130 改成：一路时只收起拖拽编辑器和它那句提示，组本身留着并改标题为「预览」，预览帧按钮和画布照常可用。
（新增 i18n `pePreviewGroup`；实测组高从 0 变 332，画布 720×470 顶部 1/4 有 221 个亮像素＝水印在。）

## 6. 验收

**页面侧 `devtools/r87-ui.js`：37 条判据全过**（`devtools/r87-ui-130c.json`）。要点：
默认值逐项相等；默认序列有 clk/spd/st 且无 gps/src；GPS 行含 `N30.274580 E120.155676 · 航向 34°`；
溯源行含 `Tessera`；无采样时速度与 GPS 都是 `--`；bar 恒在 0–1；六个固定锚点各落各的角且不出画；
`auto` 三种带（下带/上带/无带）落点正确；面积随字号单调（0.7×1.12% → 1×2.28% → 1.8×7.38%）；
**默认遮挡 2.28% < 3%**；三档背景都画且不移块位；样式区随内容开关联动折叠；全开时「开始导出」仍在视口内
（top 779 / bottom 823 / viewport 915）；单路预览 4 条。

**引擎侧 `devtools/r87-export.js`：两次真导出，7 条判据全过**（`devtools/r87-export-129b.json`）。
判据不是「像素相等」（重编码必然有噪声），而是**同一秒源片与导出片的区域亮度对比**：

| 运行 | 预览预测块 | 引擎自报块 | 块内亮像素(源→文件) | 对照区 |
| --- | --- | --- | --- | --- |
| A 默认 tc | 261×89 @ (421,14)，2.92% | `block=265x89 area=3.0%` | 0 → 26，max 90 → 255，均值 +8 | Δ均值 −1，Δ亮 −15（没动） |
| B auto＋中置条 | 261×89 @ (421,71) | `place=auto block=265x89 area=3.0%` | 黑带上 30 个亮像素 | 另一条黑带亮像素 1（仍是黑） |

两边块宽差 4px（1.5%）、遮挡百分比差 0.08pt——这就是「预览即文件」的量化说法。

**目视**：`devtools/r87-sheet-portrait.png`（面板：6 内容 chip + 7 位置 + 字号滑杆 + 3 背景 + 开始导出可见）、
`devtools/r87-preview-top.png`（预览顶部放大：时间戳 15.6 km/h／车速条／经纬度＋航向／D·人工驾驶·刹车·左转向／源尾注）。

**回归**：`r83-verify` 四种布局触发标注全 HUGS；`r84-verify` 9/9 ok；`r85-verify3` L3/L7 全过
（`r85-verify2` 的 L3/L7 就是被 verify3 取代的那两条旧判据）；`r87-regress.sh` 留作复跑。

## 7. 判为不做 / 没验到

- 不做：驾驶员、车牌、VIN、固件、天气、里程能耗、限速标志、导航目的地——SEI 里没有，编不出来。
- 没验到 ①：**旋转片上的水印朝向**。R86 的 rot fixture 已删，没再造。理由是水印在**帧空间**合成（和格子同一坐标
  系），不随单路码流的 `tkhd` 转；`r87-where.js` 的行/列直方图随时能补这一测。真机复测时顺手做。
- 没验到 ②：`auto` 在**多路**真实布局下的选带（本轮只验了单路自定义 rect 造出的上下黑边）。
- 没验到 ③：浅色主题下的水印（水印烧进文件，与 APP 主题无关，故不单独验）。
- 已知小偏差：预览画布是 720×470 而非文件尺寸，字号测量非线性，所以面板上那句「水印占画面 3.2%」比按文件尺寸
  算的 2.92% 高约 0.3pt；块宽/块高本身两边一致。
- 顺带记一笔：`r87-ui.js` 这轮暴露三次「判据自己错」（`.hidden` vs `display`、视口内 vs 可滚动、toggle 写成 set），
  都已写进记忆里的假信号清单。

## 8. 交付

- `Tessera-1.2.130.apk`（工作区根目录）27,984,827 B
  md5 `edb683f3004139f273b9a02dcbf0288a`
  sha256 `d1e65a67ab1a35e3eef9f62995fcf8415e9d7bc5f22eb31bcc6c92cab1934b70`
  SO_MATCH：APK 内 `lib/arm64-v8a/libtdashcam_studio.so` md5 `43fb6c4af3884d7cace7f697fb51e4dd`
  == `target/aarch64-linux-android/release/libtdashcam_studio.so`。
- 本轮中间产物一并留在根目录（旧包按约定不删不挪，由用户自己清）：
  1.2.127 `dea0c52620c9a5a77fcd1dc6a562ae33`（27,984,379 B，水印首版，默认值还是关）；
  1.2.128 `3e63bca95ff3ce3e088593a85d54755f`（27,984,699 B，列锁定＋4% 挤压＋字体 400）；
  1.2.129 `3191e00ca26d807c872355e0a9801348`（27,984,699 B，`auto` 空并集修复）。
- 重建：`bash /tmp/build-apk.sh`（`npx tauri android build --apk true --target aarch64 x86_64`），
  日志 `%TEMP%/r87-build{,2,4,5,7}.log`。中途一次 `minifyUniversalReleaseWithR8` 失败是 Windows 文件占用
  （`classes.dex` 被另一个进程锁住），`./gradlew --stop` 后重跑即过，与代码无关。
- 新仪器（全留 `devtools/`）：`r87-ui.js`（页面侧 37 判据）、`r87-export.js`（两次真导出的区域亮度判据）、
  `r87-run.sh`（清 logcat → 跑探针 → 回收 `TdExportCaption` 自报行）、`r87-where.js`（亮像素行列直方图，判「到底画在哪」）、
  `r87-pixels.js`（区域亮度读数）、`r87-show.js`（把面板与预览摆好以便截图）、`r87-regress.sh`（回归串跑）；
  原始读数 `r87-ui-128.json`、`r87-ui-130{,b,c}.json`、`r87-export-128.json`、`r87-export-129{,b}.json`、
  `r87-logcat.txt`、`r87-where.json`、`r87-pixels.json`、截图 `r87-sheet-portrait.png`、`r87-preview-130.png`、`r87-preview-top.png`。

# R88（1.2.130 → 1.2.135）：导出改独立整页、画面标注做成两个开关、预览帧点击放大

## 1. 这轮要解决的问题

需求原文：「导出视屏的页面，里面的内容比较多，能否单独弄成一个导出页面，不弄成弹出卡片了？导出画面里，左上没有
相机标签、右上也没有触发角标，排查一下，设置为开关，可以决定是否加上去。预览帧可以点击放大，查看效果。」
外加两条约束：「按照你推荐的方案来，但是要保持 ios 的设计规范，和目前 app 的整体风格、UI 和交互要保持一致」、
「打相机标签做成开关……单路也要有开关。放大态可以做成左右滑换秒。范围里面，时间是一行，"从当前进度、设入点、
设出点"是一行。"导出画面里额外烧进去的"语言有点累赘，换个简单明了的说法。」

**先把一条说法查实**（本轮对话早期说过「导出画面本来左上有相机标签、右上有触发角标」——文档和记忆里都找不到
出处，代码里也不成立，所以按不存在处理）：

- 相机标签：只有**桌面版**烧。`src/script.js:10472` 的 `drawtext=...text='${labelText}':x=10:y=10:fontsize=18`
  是桌面多路导出滤镜链里给每一路贴的名字（960×540 画格上的 18px）。**安卓的原生导出从来没有这一层**，
  所以用户看到的「左上没有相机标签」不是坏了，是从来没有。
- 触发角标：**两边都没有**。它一直是播放器里的 CSS 高亮（`.video-container.trigger-cam`），R83 也只是把
  描边从格子改圈到画面上，从没进过导出文件。
- 结论：这不是回归，是两条**没做过的功能**，于是按用户要求做成两个独立开关。

## 2. 整页还是抽屉：只改呈现，不改管线

导出面板从底部卡片改成全屏页，最容易出事的做法是「另起一个页面」。这里刻意没有：

- 元素仍是 `#phoneExportModal.modal-overlay`，只是多挂一个 `.phone-export-page` 类；关闭键仍是
  `#peCloseBtn.close-modal-btn`。原因在返回链路：`MainActivity.kt` 把系统返回派发给
  `window.__tdashcamCloseTopLayer`，`closeTopLayer()` 靠点掉最上层 `.modal-overlay.show` 里的
  `.close-modal-btn` 来关层，`phoneLayerCount()` 数的也是 `.modal-overlay.show` 的 DOM 个数。
  另外进度 pill、后台任务接管、六处「只在有 `.show` 时重渲染」的守卫，全挂在这两个约定上。
  **改呈现不动约定**，所以这些一行没改就继续工作（判据 43–47：层数 1→2→1→0 逐级剥）。
- 导航条 `.pe-nav` 是 44px 的三槽栅格 `minmax(0,1fr) auto minmax(0,1fr)`：左槽返回（箭头＋文字，整槽 40px 可点）、
  中间标题、右槽动作。右槽同时放 `#peStartBtn`（开始导出）和 `#peCancelBtn`（取消），用
  `.phone-export-panel.exporting` 这一个类互换显隐——两个都在 DOM 里，原有 handler 不用重接。
- 长滚动改成分段控件三段：`画面`（视角/分辨率/摆放/预览）、`叠加`（打码/水印/画面标注三组）、
  `范围`（时间一行＋从当前进度/设入点/设出点一行＋片段）。分段控件复用抽屉分类行那套皮肤，手势词汇不增第三种。
- 措辞：`导出画面里额外烧进去的` → 组名 **画面标注**（en `Burn-in` / `Frame marks`），两个 chip 直接叫
  **相机标签**、**触发角标**；`peOverlay` 这个键删掉。

## 3. 两个开关烧进文件：一套算术，两边各写一遍

`CHROME_LAYOUT`（`src/script.js:5074`）与 `ChromeOverlay.kt` 的伴生常量是同一组数字的两份抄写，注释里互相点名。

- **字号只有一条规则**：`max(画格高 × 0.0333, 帧高 × 0.0135)`。0.0333 就是桌面 `drawtext` 的比例（18px / 540），
  下限是给六宫格兜底——按画格算的话六路时名字只有 10px 不到。描边宽 `max(2px, 字号 × 0.14)`，
  判据里同时卡「不细于 2px」和「不粗过一路画面宽的 6%」。
- **长相取自播放器而不是桌面**：名字是白字压在 `rgba(0,0,0,0.6)` 圆角底上（就是 `.camera-label`），
  触发了的那路改成琥珀底＋`#ff9f0a` 字，并给这一路的**画面**（不是格子）描一圈琥珀；名字文案是
  `前 · 哨兵` 这种「视角名 · 触发原因」，没触发的只写视角名。
- **构建时机**：`ExportEngine` 在「所有路都贡献过一帧」那个闸门处（水印 `auto` 锚点等的就是同一个）才
  `buildChrome()`，因为名字要落在**画面**上，只有合成过一帧才知道画面在那儿。代价写进注释也写进这里：
  **标记会比文件正片晚到一两帧**，开头那一两帧没有标记；只有开了开关的人有这个代价。
  这一层失败只有一种可能——某路始终没出帧——所以那种情况下会打一条
  `chrome requested but not built` 的 warning，而不是画一张错位的牌。
- **不遮不叠**：`GlRenderer.bindRgba()` 是新加的（只 `glBindTexture`，不碰 `textureWidth/Height`），
  否则静态标记板会把字幕条的 realloc 记账带偏。
- **遮挡读数**从「几个矩形面积相加」改成 `peOcclusionPercent()`：按 ≤240px 的 alpha 掩膜数像素，
  描边只算线宽那一圈。于是水印＋标签＋描边重叠的部分只算一次（判据 31：同一块算两遍 0.374%、
  并起来 0.561%，不是 0.748%）。文案跟着改成「标记占画面 4.0%」。

## 4. 预览帧点击放大

点预览画布（或聚焦后 Enter/空格）开一层自己的 `#peZoomModal.modal-overlay`，`pe-zoom-bar` 用同一套导航条语法。
手势：**左右滑换秒**（阈值 44px，越过边界钳到区间两端）、**双指缩放** 1×–4×、放大后单指平移且不能拖出画面、
点遮罩或返回关闭。画布按文件宽高比铺到 960px 长边（`PE_ZOOM_MAX_SIDE`），比面板里那块 720×234 明显大
（实测 960×626 vs 720×234）。放大层画的就是 `composePhoneExport()`，所以放大看到的标记就是文件里的标记。
`peFrameTarget()` 顺带改成按段走（`left -= span - 0.05`），放大后往右滑能跨过分钟边界，不再被第一段截住。

## 5. 四条真实缺陷

前三条是探针量出来的，第四条**只有截图能看出来**——见第 6 节。

1. **预览/放大卡在「正在取帧」**：重试链等的是 `FrameFetcher` 的 fetch 完成，而 fetch 完成 ≠ 解码完成，
   `<img>` 还在解码时就已经放弃重绘。新增 `peFramesDecoded(urls)`（`img.complete` 早退、6s 超时、
   `load/error` 一次性监听），并把每路缺图的解码等待塞进 `pending`。实测 AVD 上首帧要 9.5–14s，
   所以判据的轮询上限也从 12s 提到 80×500ms 并把耗时记进读数。
2. **放大层会变成孤儿**：它和页面是兄弟节点，从别处（不是返回）关掉页面时它会盖在一个已经不存在的页面上。
   `hidePhoneExportModal()` 现在第一行就 `closePhoneExportZoom()`。
3. **导航条动作 34px**：APP 自己定的规矩是拇指可达动作 ≥40dp，34px 的胶囊坐在 44px 的条里，条够、目标不够。改 40px。
4. **「返回」根本不在导航条里**（1.2.135）：`#peCloseBtn` 同时带 `close-modal-btn`，那条规则是
   `position:absolute; top:10px; right:10px`，而 `.pe-nav-back` 只重写了 `justify-self/显示/字号`，
   没重写 `position`。结果按钮被从栅格里抽走，落在**面板右上角、状态栏那一行**（实测 box `[347,10]`，
   导航条在 `[0,62]`），左槽塌掉、标题跟着左移。`#peZoomClose` 同一个毛病。修法就是 `.pe-nav-back { position: static }`。
   顺带去掉整页顶部那颗 sheet 拖拽把手（`.phone-export-sheet.phone-export-page .sheet-grabber { display:none }`）：
   整页不是能往下甩的卡片，「往下拖」的暗示已经被返回取代。

## 6. 验收

**页面侧 `devtools/r88-ui.js`：53 条判据全过**（`devtools/r88-ui-135.json`，1.2.135）。要点：整页不透明无模糊
（`bg=rgb(24,25,26)`、`backdrop=none`、`radius=0px`）；导航条 44px、动作与返回都 40px；三条 tab/pane 与
`aria-selected` 联动且切段回滚到顶；范围两行的几何（时间行底 242 < 动作行顶 250，两个 ± 格同顶同高 44）；
两个开关各点一次改 key/chip/store、再点回来；单路 plan 给出 `{1104x720 ring:true}`＋`{120x37 ring:false}`；
预览画 2 个名字 1 圈描边，名字落在自己那格左上（chip 5 / tile 0、chip 245 / tile 240）；遮挡读数三条；
放大层 9 条（换秒 0.25→3.25、越界钳到 7.8/0.05、scale 2→钳 4、平移钳到 206=limit、返回栈 1→2→1→0）；
中英文重贴（`Back/Picture/Burn-in/View names/Trigger outline`、`画面/相机标签/触发角标/打码/水印/画面标注`）。

**引擎侧 `devtools/r88-export.js`：三次真导出，10 条判据全过**（`devtools/r88-export-135.json`）。
判据仍是**区域统计**而不是像素相等（重编码必有噪声），并且是**对照式**：先跑一版两个开关全关的对照片，
再跑同参数全开的片子，只认「多出来的那些像素」。`#ff9f0a` 不在真实画面里出现，所以琥珀就是琥珀。

| 运行 | 判据 | 读数 |
| --- | --- | --- |
| chrome-off（对照） | 文件里没有琥珀、每路角落没有白字簇 | `frameAmber 0`；front `white 0`、back `white 0` |
| chrome-on 两路 1776×576 | 出现琥珀；front 名字烧进自己那路；front 描边圈住预览预测的那块；back 名字烧进自己那路；back 没触发就不该有描边 | `frameAmber 1003`；front `gainedAmber 259`；预测 `{x0,y0,w0.5,h1}` → 实测 `{right 0.4984, bottom 0.9952}`；back `gainedWhite 5, amber 0` |
| 单路 1104×720 | 单路也烧标签与角标；描边圈画面不是格子（黑边不被圈） | chip `930`、tile `3900`；描边 `0..0.9984 × 0.0048..0.9928`（不是 `0..1`） |

引擎自报（1.2.135，PID 31160）：`TdExportChrome: plate 1776x576 scale=1.0 label=true badge=true marks=2 fired=前 · 哨兵`、
`plate 1104x720 ... marks=1 fired=前 · 哨兵`。

**目视**（`devtools/r88-adb-{view,over,range,zoom}.png`）：整页三段的导航条/分段控件/摘要行、叠加页三组开关、
范围页两行、放大层里「前 · 哨兵」琥珀牌＋前视那圈的琥珀描边＋顶部居中水印。
截图这一步本身值回票价：第 5.4 条那个落点错误，53 条 computed-style 判据全绿也照样看不见。

**回归 `devtools/r88-regress.sh`**：`r83-verify` 四种布局触发标注全 HUGS（0 失败）、`r84-verify` 9/9、
`r87-ui` 37 条 PASS、`r85-verify3` L3/L7 全过。两处红字与它们的性质：
`r85-verify2` 的 L3/L7 就是被 verify3 取代的那两条旧判据（本轮没动它，留着当记录）；
`r85-verify3` 的 L7 判据本轮**改掉了一条自己的错**——它原来要求「删一行后滚动偏移不变（±60px）」，
可删行会让列表变短，浏览器把 scrollTop 钳到新的最大值（实测 `wanted 109.7 → kept 35.8`，
而 `scrollHeight-clientHeight = 36`），量的是钳位不是丢位。改成「偏移保持 **或** 钉在新的最大值，且没跳回顶部」。
另外 `r20-gridverify` 跑不了：它验的是 R20 留在 `Download/` 的那个导出文件，设备上早就不在了（脚本里已写明）。

## 7. 判为不做 / 没验到

- 没验到 ①：**文件开头那一两帧到底有没有标记**。设计上就是「标记晚到一两帧」（第 3 节），但探针取的是
  1.5s 处的帧，从没数过第 0 帧。要判死需要逐帧导出或解码到具体帧号，本轮没做。
- 没验到 ②：4K/源分辨率下标记的可读性——字号下限是按帧高比例定的，但六宫格 4K 下每格实际多大没量过。
- 没验到 ③：**旋转片上标记的方向**。和水印同一条理由（标记在帧空间合成，不随单路 `tkhd` 转），也同一条状态：没验。
- 没验到 ④：真机（非 AVD）上的导出标记与整页；本轮全部读数来自 `tdashcam_phone`。
- 判为不做：把「右上角标」做成位置可选项。用户原话是「右上也没有触发角标」，但触发角标的语义是「这一路参与了触发」，
  圈住画面比钉在某个角更准确，而且和播放器的 `.trigger-cam` 是同一句话；名字牌留在左上和播放器的 `.camera-label` 一致。
- 已知小偏差：面板里的预览是 720 长边、放大层是 960 长边、文件是 1776/1104，三者同一套比例常数，
  但小字号下的取整会让「标记占画面 x%」与按文件尺寸算的值差 0.1pt 量级。
- 顺带记一笔：本轮新增两条假信号（`Page.captureScreenshot` 把 `<canvas>` 拍成黑、AVD 的 `screencap` 会返回
  几十秒前的旧帧），已写进记忆的验收假信号清单。

## 8. 交付

- **`Tessera-1.2.135.apk`（工作区根目录）28,010,043 B**
  md5 `c1ee5bb31ffb6888e8d4f9dc768a3296`
  sha256 `a84834afb3a56b5b3136f673788d9421d685e057543c2f6b8f32936b53c47a8c`
  SO_MATCH：APK 内 `lib/arm64-v8a/libtdashcam_studio.so` md5 `f16f8aaaf59b07f1192954cbdeca5762`
  == `target/aarch64-linux-android/release/libtdashcam_studio.so`。装机后 `dumpsys` 回读 `versionName=1.2.135`。
- 本轮中间包（按约定不删不挪，由用户自己清）：
  1.2.131 `f93ba931c0f6ef57478e446bbf961b0d`（28,009,147 B，整页＋分段控件）；
  1.2.132 `4a42210bdd7e8037e4691f3d52cba824`（28,009,531 B，标记烧进文件首版）；
  1.2.133 `e8395c340334f0f61c4390471164f40f`（28,009,787 B，解码等待＋放大层孤儿修复）；
  1.2.134 `3973c43d71b59b4ba25da94ccdd2e6e5`（28,009,851 B，40px 动作，页面侧 50/50）。
- 重建：`bash devtools/build-apk.sh`（`npx tauri android build --apk true --target aarch64 x86_64`），
  日志 `devtools/build-13{1,2,3,4,5}.log`。
- 新仪器（全留 `devtools/`）：`r88-ui.js`（页面侧 53 判据）、`r88-export.js`（三次真导出的对照式判据）、
  `r88-show.js`（把页面/放大层摆好以便截图）、`r88-shoot.sh`（截图，带「和上一张一模一样就重拍」的钳位）、
  `r88-why.js`（帧可用性诊断）、`r88-marks.js`（把导出帧与四个角裁成 PNG）、`r88-run.sh`、`r88-regress.sh`、
  `fixture-event.json`；读数 `r88-ui-13{1,2,2b,3,4,5}.json`、`r88-export-132.json`、`r88-export-135.json`、
  `r88-marks.json`、`r88-logcat.txt`、截图 `r88-adb-*.png`、`r88-{mark,crop}-{two,two-off,one}.png`。
- 复现用的触发 fixture：`/storage/emulated/0/TeslaCam/SavedClips/2026-10-09_10-00-00_sentry/`
  （六路 mp4 从既有事件复制）＋ `event.json`，关键是 `"reason": "Motion detected while parked"`——
  `TRIGGER_REASON_VIEWS` 用 `/motion|sentry/` 匹配它，判成「前/左/右 触发，标签 哨兵」。
  没有这条 fixture，角标那条路径端到端不可测。本地留档 `devtools/fixture-event.json`。

# R89（1.2.135 → 1.2.137）：R88 自己把导出页整页点死了

用户拿真机（小米 14 / 浅色主题）装了 1.2.135 后报：「导出页面的按钮点击后都跑回到播放界面了，都都不起作用，
另外 ui 有点挤，不美观」。**这一轮修的全是 R88 自己造成的**，包括我上一轮刚写进文档的那条「`.pe-nav-back`
用 `position: static`」。那条修法本身是错的。

## 1. 根因：一个「扩大点击区」的伪元素，被我从自己的按钮上摘下来挂到了面板上

R41 给 `.close-modal-btn` 加过一条规则：`::after { content:''; position:absolute; top/right/bottom:-10px;
left:-16px }`，把那枚 13~28px 的 × 的**可点范围**撑到拇指尺寸（画和打点分开）。它一直有效，因为宿主本身是
`position:absolute` —— 伪元素以宿主为包含块。

R88 让 `#peCloseBtn` 进导航条当栅格项，但类名 `close-modal-btn` 必须留着（原生返回手势就是点它）。
我上一轮为了把它从面板右上角拉回来，写了 `position: static`。于是：

- 宿主变成 static → 伪元素的包含块**上移到最近的定位祖先**，也就是 `.modal-content`（`position: relative`）；
- `top/right/bottom/left` 从「相对按钮外扩 10px」变成「相对整块面板内缩 10px」；
- 结果：**一枚覆盖整页的透明 `::after`，属于返回按钮**。`pointer-events` 默认 `all`。

所以每一次点击都点在返回键上 → `hidePhoneExportModal()` → 退回播放页，而按钮自己的 handler 从来没被触发。
实测（1.2.135，AVD 真点击）：`document.elementFromPoint()` 在 12 个控件中心**全部**返回
`BUTTON.pe-nav-back close-modal-btn`，包括「开始导出」自己的中心点。

**为什么 53 条判据全绿**：探针一律用 `element.click()`，它直接把事件派发到节点上，**根本不做命中测试**。
一条被隐形层完全盖住的页面，在 computed-style 与 `.click()` 两种测法下都是满分。这条已经写进假信号清单。

## 2. 修法（两步，第二步是第一步引出来的）

1. `.pe-nav-back { position: static }` → `position: relative`，伪元素重新以按钮为包含块。
2. 但 `position: relative` 会让基类的 `top: 10px; right: 10px` **从角落锚点变成偏移量**：返回键被往下推 10px、
   往左推 10px（`back:[-4,68]`，导航条在 `[0,56]`），探出屏幕左缘。补 `top: auto; right: auto`。
   判据「返回落在导航条 rect 内」把这一步抓出来的。

顺带查了同一条规则的另外两个宿主：`.clear-date-btn` 是 `position:absolute`、`.toggle-sidebar-btn` 在该规则里
显式 `position: relative`，都没踩坑。为防复发，探针加了一条通用不变量：**页内任何 `position:absolute` 的
`::before/::after`，其宿主不得是 `static`**。

## 3. 间距（「挤」）

量过再改。改前：导航条→分段控件 **0px**（贴死）、→摘要 10px、→首组 12px、组间 14px。
改后是一条有级的节奏：**10 / 12 / 14 / 20**，组内「标签→控件」仍留 6px（它们是一组，不该被拉开）。
`.pe-seg` 改 `margin: 10px 14px 12px`、`.pe-summary` 改 `margin: 0 16px`、`.pe-body` 改 `padding: 14px 16px 24px`、
`.pe-pane` 的 `gap` 14→20px。浅色主题截图 `devtools/r89-light-{view,over,zoom}.png`。

## 4. 验收（这一轮全部用真手指，不再只靠 `.click()`）

新仪器 `devtools/r88-taps.sh` + `r88-taps-arm.js`：把每个控件中心的**设备像素坐标**量出来，
用 `adb shell input tap` 真点，逐次对比状态并打印差值。**先在 1.2.135 上跑，第一记真点击就把页面点关了**
（`shown:true→false`），后面每一记都「没有变化」——这就是用户看到的现象。

1.2.137 上 13 记真点击全对：`画面→叠加` 换段、`相机标签`/`触发角标` 各自翻开关、`范围`/`画面` 换段、
`后` 取消再选回、`480p` 改尺寸、`预览帧` 关开、**点预览画布开放大层（层数 1→2）**、
`关闭` 收回放大层（2→1，页面留着）、`返回` 关页面（1→0）。

页面侧 `devtools/r88-ui.js` **55 条全过**（`devtools/r88-ui-137b.json`），含四条本轮新增：
返回/关闭落在各自条内的左槽（`back:[6,58]`、`nav:[0,56]`）、每个控件中心点上就是它自己（`covered:[]`）、
页内没有挂在祖先上的隐形绝对定位伪元素（`unanchored:[]`）。

## 5. 判为没验到 / 顺带记下的两件事

- **AVD 冷启动 ANR**：本轮两次 `install -r` 之后都在启动 ~28 秒时抛
  `Input dispatching timed out … Waited 5004ms for FocusEvent(hasFocus=true)`，随后被「user request after error」杀掉。
  1.2.136 与 1.2.137 各中一次，1.2.135 也中过一次。本轮**没有排查**（改动只有 CSS，且重启后稳定），
  但它和 R38-5 那条「insets 回调里同步 evaluateJavascript」的症状同类，下次冷启动卡死先查这条。
- **探针之间会互相污染**：先跑真点击串、再跑页面探针，探针会带着上一串改过的 `peSelection`（本轮把尺寸改成了 480）
  进来，于是「放大画布保持文件宽高比」这类判据假挂。要么每条探针自己 set 全部前置状态，要么按顺序跑完再判。
- 没验到：真机（小米 14）上的 1.2.137 —— 本轮所有读数来自 AVD 的 `adb input tap`。用户手上就是真机，
  装完请顺手确认「点视角 chip 不再退出」以及左缘那枚「前」是否会被系统返回手势吃掉（它的中心在 37dp，
  正常边缘区 20dp 之外，但 MIUI 的边缘区宽度没量过）。

## 6. 交付

- **`Tessera-1.2.137.apk`（工作区根目录）28,010,363 B**
  md5 `f2672f277e65e62b51e8699ec2c82ab9`
  sha256 `44d1713fe43372051aefe6067984dcb5ca3591e8419156c7c2b55526223d8ba1`
  SO_MATCH：APK 内 `lib/arm64-v8a/libtdashcam_studio.so` md5 `7c6d24054dd2423a981d1399fe968758`
  == `target/aarch64-linux-android/release/libtdashcam_studio.so`。装机 `dumpsys` 回读 `versionName=1.2.137`。
- 中间包：**1.2.136 是「修好了但返回键偏了 10px」的半成品**（真点击全过、导航条落点判据挂 2 条），
  留在根目录当记录，别当最终版发出去。md5 `c969d8a062f3028c0f957ec464d35d8c`（28,010,235 B）。
- 改动只有 `src/styles.css` 三处（`.pe-nav-back`、`.pe-seg`/`.pe-summary`/`.pe-body`/`.pe-pane` 的间距）
  与 `tauri.conf.json` 版本号；Kotlin/Rust/JS 零改动，所以 R88 的导出侧判据（三次真导出）继续成立。
- 日志 `devtools/build-136.log`、`devtools/build-137.log`；读数 `devtools/r88-ui-136.json`（54 条含 2 挂）、
  `devtools/r88-ui-137{,b}.json`；新仪器 `devtools/r88-taps.sh`、`devtools/r88-taps-arm.js`（真点击串，
  以后凡是「点不动」的报告先跑它）。

---

# R90（1.2.137 → 1.2.144）：放大后拖不动 + 预览糊 + 导出页改走「卡片分组 + 预览钉底」

用户三条：「预览帧双指放大缩小后没法移动位置，无法看到想看的位置；预览帧的画面放大不清晰，是模糊的；
『导出视屏片段』的页面感觉有点不美观，选项都太密集了，底部空间浪费了很多。」排版先给三个方向选，
他点了 **A 卡片分组 + 预览撑满**；A 装机看过之后改口 **B 卡片分组 + 预览钉底常驻**
（「我选错了，B 更好一些」）—— 所以本轮交付的是 B，A 的读数留在 1.2.138–1.2.140 的 json 里。

## 1. 平移拖不动：手势对象少了两个锚点

`onPeZoomPointerDown` 造的 `peZoomGesture` 里有 `x/y`（跟着 scrubber 滑动的当前点）却没有起点，
`onPeZoomPointerMove` 算位移写的是 `event.clientX - g.x0` —— `x0` 从来没被赋过值，于是：

- `clientX - undefined = NaN` → `panX0 + NaN = NaN` → `translate3d(NaNpx, NaNpx, 0) scale(3.33)`
  是**非法 transform**，浏览器整条丢掉 → 画面纹丝不动，且 `style.transform` 里能看到那串 NaN。
- 只有 `scale > 1` 才走这条路，所以 1× 下拖动换秒是好的 —— 这也解释了为什么 R88 的判据全绿：
  它只测过 `peZoomView.x = 9999` + `clampPeZoomPan()`，那是**钳位**，不是手势。

仪器补在 `devtools/r89-zoom.mjs`（CDP `Input.dispatchTouchEvent`，两指撑开→单指拖），它把
`onPeZoomPointerMove` 包一层记录 `clientX/x0/y0/panX0/x/y`。修完的读数：`x=-140 y=-56`（正好是拖的
−140/−56），`transform` 里是 `-140px, -56px`。修之前那六个采样点全是 `x:"NaN"`。

顺带同一条链上的第二个洞：`setupPhoneExportPanel()` 会被再跑一次，指针监听按次叠加 ——
`stage events.counts.pointerdown` 从 3 → 6 → 9。加了 `pePanelBound` 幂等门，现在一个指针一次 down。

## 2. 模糊：三处各自写死的宽度，收成一个

真正糊的原因是**取帧宽度**沿用 `PHONE_EXPORT_FRAME_W = 320`（那是列表小格子的尺寸），而合成预览画在
412 CSS / 2.625 dpr = **1082 设备像素**的框里 —— 手指还没捏，就已经 3.4× 放大。改成
`peComposeFrameWidth()`：`min(1280, min(innerWidth, 560) × dpr)` = 1082。

- **必须按视口算，不能按元素算**：预览关着的时候画布盒子是 0 宽，元素测出来的宽度会随开合/路数变，
  而 FrameFetcher 的缓存键是 `path@秒×宽` —— 键一变，同一秒重新解码，用户眼前的图退回「正在取帧」。
  这条判据现在写在 r88-ui 里：`widthOff === widthSingle === wide === 1082`。
- 两处画布尺寸本来也各自写死：放大层 `PE_ZOOM_MAX_SIDE = 960`（注释还写着「给它的帧只有 320 宽」，
  已经过期）、页面预览 `composePhoneExport(..., 720)`。都改成同一个 `peComposeFrameWidth()`，
  常量删掉。实测 backing：放大层 960×626 → **1082×706**（屏显正好 1082），页面预览 720 → **1082**
  （盒子 380 CSS = 998 设备像素）。小格子（`peCanvas` 的 tile、马赛克）仍按 320，那是它们该的尺寸。

## 3. 版式 B：预览从「画面」段里搬出来，钉在滚动区下面

DOM：`#pePreviewCanvas` + `#pePreviewCap` + `#pePreviewBtn` 从 `.pe-layout-group` 挪进面板的最后一个
子节点 `.pe-preview-dock`；`.pe-body` 还是唯一滚动区。CSS：卡片 `.pe-group`（14px 圆角 +
`--modal-panel-solid`，和抽屉/更多面板同一语言），带子 `flex: 0 0 auto` + 顶部分隔线 +
`margin-bottom: -var(--safe-bottom)` 让玻璃条贴到屏幕底、再把那段补回 padding。
`pePreviewOn` 默认改成 **开**（钉底的意义就是当场看见），新增 `renderPreviewDock()` 统一盖章。
单路时「摆放」卡整张收起（R87 那套「留着卡但改标题叫预览」的逻辑删了）—— 预览已经在带里，不会丢。

装机之后才暴露的两个坑，都只有真点击/真量才看得见：

1. **拉扁**：带子高度有限，先按 `height: min(34vh, 240px); width: auto; max-width: 100%` 定盒，
   两路 3.08:1 的宽条被塞进 380×240 的盒 → 实测 `stretch 0.514`（纵向挤一半），和 R21-2 修的是同一类
   缺陷。改成 `width: 100%; height: auto; max-height: …; object-fit: contain`：宽条 380×124
   （`stretch 0.992`），竖片才吃 max-height 并靠 contain 加黑边。判据
   「钉底预览不把画面拉进盒子里」两态都测。
2. **开关会跟着跑**：head 原本是带子的第一行，画面一收，整行下移 **190 px** —— 第二下（想把它开回来）
   点在原来的位置，什么都不做。head 改成带子的**最后一行**，两态同一个 `y = 865`，关掉时带子只剩 65 px。

## 4. 验收（1.2.144，AVD `tdashcam_phone` API 36）

- `devtools/r88-ui.js` **68 条 0 挂**。本轮新增/改写的判据：钉底贴住面板底边（dock 700–915，
  面板底 915）、三个段里带子都常驻、开关两态同一位置、不拉进盒子、页面/放大层画布都铺满自己的像素、
  **在叠加段关「时间戳」，钉底预览亮像素 5151 → 5017（−134）** —— 这条是 B 相对 A 的全部理由。
- 真点击 `devtools/r88-taps.sh` **13/13**。arm 侧补了「先滚到控件再量点」：带子从滚动区拿走 ~300 px 后，
  叠加段的相机标签/触发角标两枚 chip 落到折叠线以下，按老坐标点等于点在带子上（4 条 FAIL 是这么来的，
  不是新 bug）；`tap()` 现在会先复位 arm 记录的 `scrollTop`。
- 手势 `devtools/r89-zoom.mjs` 5/5；`devtools/r88-export.js` 三次真导出 **9/9**（含单路）。
- 回归：r83 17/0、r84 18/0、r85-verify3 4/0、r87-ui **84/0**（其中两条按 B 改写：单路不再保留预览卡，
  改成「单路仍拿到钉底预览」+「带子标题是 预览/Preview」）。r85-verify2 的 L3/L7 仍是它自己的旧判据。
- 截图：`r88-adb-view/over/range.png`、`r90-zoom-sharp.png`（放大层 1× 的清晰度，时间戳第二行小字可读）、
  `r90-light-view.png`（浅色，setup 见 `devtools/r90-light.js`，跑完记得 `removeItem` 复原）。

## 5. 判为不做 / 没验到

- **真机复测**：平移、清晰度、折叠后那两枚 chip 的手感，都要在小米 14 上再看一眼。
- **AVD 冷启动自杀**：本轮 5 次装机后 3 次进程自己没了（`mCurrentFocus` 落到 launcher，logcat 里
  没有 FATAL/ANR 行），一律 `am start -n com.tdashcam.studio/.MainActivity` 拉起；1.2.141 同样表现，
  不是本轮代码引入，但也没查清 —— 记在 [[emulator-acceptance-false-signals]]。
- **单路时滚动区里那一大块空白**：内容只有两张卡，带子之外的空间是滚动区自己的余量。B 治的是
  「底部整条浪费」，没有把两张卡撑开（那是 A 的做法，已被换掉）。
- 仍欠：#301（AVD 专属）、预取、`boundary-tail`。

## 6. 交付

- **`Tessera-1.2.144.apk`（工作区根目录）28,012,283 B**
  md5 `fd9b398e5a645dd0a3c458c51d474164`
  sha256 `2b83ec17f0ee68bc655e83d29e8f28f22acb59e3eec39a0b03dd9fd8f69f1f9c`
  SO_MATCH：APK 内 `lib/arm64-v8a/libtdashcam_studio.so` md5 `9d7c3aac20a6b82125cebf8b5982c70c`
  == `target/aarch64-linux-android/release/libtdashcam_studio.so`。装机 `dumpsys` 回读 `versionName=1.2.144`。
- 本轮中间包都留在根目录当记录：**1.2.140**（A 版式 + NaN 修 + 取帧 1082）md5 `c3957418163a68488264686c0786f87a`；
  **1.2.141**（放大层/页面画布也按屏显像素，删 `PE_ZOOM_MAX_SIDE` 与 720 字面量）md5 `3c032900c2c2c1472fe81d0ecef9cbe7`；
  **1.2.142**（B：DOM 挪成钉底带）md5 `6d06261e60a1a5cab0259dcfe3afc34b`；
  **1.2.143**（修 `max-height` 拉扁 → `object-fit: contain`）md5 `69c9179fa0abc8007744cecf529c38c7`。
- 改动面：`src/script.js`（手势锚点、`pePanelBound`、`peComposeFrameWidth` 三处共用、
  `renderPhoneExportPanel`/`renderPreviewDock`、单路收卡）、`src/index.html`（`.pe-preview-dock`）、
  `src/styles.css`（`.pe-group` 卡片、带子、`.pe-preview` 的 contain）。
  **Kotlin/Rust 零改动**，所以 R88 的导出侧判据继续成立，本轮仍复跑三次真导出确认。
- 日志 `devtools/r90-build-{141,142,143,144}.log`；读数 `devtools/r88-ui-14{0a..4}.json`、
  `devtools/r88-export-144.json`。



---

# R91（1.2.144 → 1.2.145）

用户拿真机导出的三张截图回来：「水印放到左上角，会和相机标签的位置稍微冲突。水印放到右上角或者右下角，
内容显示不完整。」两条都是文件侧的，页面侧看不出来 —— 预览里量的是 JS 那一套算术，文件里量的是 Kotlin
那另一套。所以这一轮两头都查，两头都改。

## 1. 右上角/右下角：字被吃掉一截

**根因不在锚点，在测量。** `CaptionOverlay` 的每行宽度由 `measure()` 算，而 `measure()` 用的是共享的那支
`Paint`；`textSize` 只在**绘制循环里**才赋值。于是第一秒量的是 12sp，往后几秒量的是上一行留下的字号。
引擎自己把这件事喊出来了 —— 同一份内容，逐秒的 `block=` 在抖：

```
1.2.144   wm place=tl block=313x89   →   wm place=tl block=265x89
1.2.144   wm place=br block=316x118  →   wm place=br block=330x118
1.2.145   wm place=tr block=265x89   ×2      wm place=br block=330x118  ×3
```

右锚点按 `x = 右边界 - blockWidth` 起笔。宽度量小了，起笔就偏右，行尾那截掉出条带（条带只到画面的 0.98）
—— 用户看到的「显示不完整」。修法是量之前把字号按这一行的设上、量完还原：
`CaptionOverlay.widthOf(run)`（`paint.textSize = run.size` → `lockedWidth` → 还原），绘制循环推进也改成
`x += widthOf(run)`，两处共用同一个数，不再一个量一个画。

**文件侧的账**（`devtools/r91-wm.js`：同一份 plan 导两次，水印全开 / 全关，逐像素相减，亮的就是墨）：

| 用例 | 墨宽（占画面） | 墨右沿 | 墨像素数 |
| --- | --- | --- | --- |
| 单路 右上 720p | 0.1313 → **0.1531** | 0.9625 → 0.9578 | 105 → 115 |
| 四路 右下 480p | 0.1344 → **0.1828** | 0.9781 → 0.9734 | 97 → **176** |

墨变宽、变多，右沿反而往里收 —— 掉在条带外的那截回来了，整块按自己的真实宽度落位。

## 2. 左上角：和水印抢同一个角

相机标签（R88 烧进去的那枚 chip）就贴在画面左上，水印的左上锚点也在同一处，两者叠住。
引擎不知道另一层画了什么 —— 它只拿到 `wm.place`。所以让**同时拥有两层的那一侧**把净空报过去：

- `script.js`：`peChromeTopClear(plan)` 用画格 rect 复算 chip 的底边（只有落在左上角 2% 以内的画格才算），
  除以画面高得到 0–1 的分数；`wmOptions(plan)` 带上 `topClear`。
- `ExportEngine.kt`：`WmSpec` 收 `topClear`（钳到 0–0.5）；`CaptionOverlay` 只在 `place == "tl"` 时
  `top = max(margin, topClear + padY * upscale / frameHeight)`。其余锚点一行代码都不看它。
- 预览侧 `pePaintPreviewWatermark()` 同一条式子，所见即所得不打折。

读数（`devtools/r87-ui.js`，41 条 0 挂）：

```
左上 从相机标签下面开始，两者不再叠在一起   chipBottom 52  stampTop 54  clear 0.0719
关掉相机标签后左上回到自己的边距            clear 0     stampTop 14
只有左上让位，其余锚点一动不动              tc 14  tr 14  br 636
```

文件侧对得上：`single-tl` 的墨顶 0.0863，`single-tr` 的墨顶 0.0336，差 0.0527 ≈ `topClear` 0.0719 扣掉
水印自己的上边距。目视证据 `devtools/r91-zoom-tl.png`：放大层里「前 · 手动」那枚 chip 在上，
「2026-10-09 10:00:00 15.6 km/h」紧贴其下，两行字各占各的。

## 3. 装机与验收

- **`r87-ui` 41/0、`r88-ui` 68/0**（两条 R91 判据是新增的，不是改旧条）。
- 真点击 `devtools/r88-taps.sh` **13/13**；手势 `devtools/r89-zoom.mjs` **5/5**。
- 回归 `devtools/r88-regress.sh`：r83 17/0、r84 18/0、r85-verify3 4/0；同一支 `r87-ui` 在那支脚本里按
  叶子读数计 90 项 0 挂（上面那条 41/0 是按 check 计，两个数、一支探针）。
  r85-verify2 的 L3/L7 仍是它自己被 verify3 取代的旧判据（见 R90 一节），本轮照挂。
- 三次真导出（单路 720p ×2、四路 480p ×1）全部 `已写入 49/49 帧`，逐秒 `block=` 不再抖。
- 新仪器：`devtools/r91-wm.js`（开/关像素差量墨盒）、`devtools/r91-tl-chip.js`（左上带 chip 的那一发）、
  `devtools/r91-crop.mjs`、`devtools/r91-profile.js`（逐行墨分布，不再靠阈值猜）。

## 4. 判为不做 / 没验到

- **过宽的水印仍然会切**：修的是「量错导致的切」。真把字号拉到 1.6× 让一行超过条带，还是按条带边界截，
  这是 R87 就定下的行为（`MAX_STRIP_WIDTH` 之上走缩放，不折行）。
- **AVD 上相机标签进不了文件**：`chrome requested but not built: cells=0 streams=1 painted=0` —— 那一路
  解码器整场没交出一帧纹理，`paintedSent` 只能拖到最后一帧才落闸，板子建不出来。换一段能解的区间就正常
  （`plate 1104x720 label=true marks=1 fired=前`）。同一台 AVD 导出的画面本身也是全黑，只有叠加层 ——
  这是模拟器的解码问题，不是本轮代码；用户真机的截图里 chip 明明在，就是反证。记在
  [[emulator-acceptance-false-signals]]：**文件侧「chip 没出现」先查这条 log，再怀疑代码。**
- **`requestThumb` 在导出刚结束时抛 Java 异常**：重试同一发就过，`r91-tl-chip.js` 里已经带 4 次重试。
- **本轮没在真机复测**：左上让位的高度、右锚的字宽，都要在小米 14 上再看一眼导出文件。
- 仍欠：#301（AVD 专属）、预取、`boundary-tail`。

## 5. 交付

- **`Tessera-1.2.145.apk`（工作区根目录）28,012,795 B**
  md5 `a71a4c24605880bdadd84c9d7483b294`
  sha256 `a7025f6315da7ab315adaae2f3f472f85baede8631d8911f71ea323aa7dd8db1`
  SO_MATCH：APK 内 `lib/arm64-v8a/libtdashcam_studio.so` md5 `6e464bf4886a0b75909eb36a545ccc87`
  == `target/aarch64-linux-android/release/libtdashcam_studio.so`。装机 `dumpsys` 回读 `versionName=1.2.145`。
- 改动面：**Kotlin** `export/CaptionOverlay.kt`（`widthOf` 带字号的测量、`tl` 的 `topClear` 起笔）、
  `export/ExportEngine.kt`（`WmSpec.topClear` 解析）；**JS** `src/script.js`（`peChromeTopClear`、
  `wmOptions` 带 `topClear`、`pePaintPreviewWatermark` 同式）。桌面端一行未动 —— `topClear` 只在
  `place == "tl"` 且手机端导出计划里存在左上画格时才非零。
- 构建日志 `devtools/r91-build-145.log`；读数 `devtools/r91-wm-{before,after}.json`、
  `devtools/r91-tl-chip.out`；截图 `devtools/r91-{dark-over,dark-preview,zoom-tl}.png`、
  `r91-crop-tl-chip.png`。

---

# R92（1.2.145 → 1.2.146）水印：km/h 离车速数字太远

用户一句「水印里面的单位 km/h 距离车速数字的距离太远了，不紧凑」。先量，再问，再改。

## 1. 成因：不是间距参数，是 R87 的列锁定

车速那一格按 `SPEED_REF = "888.8"` 预留宽度（`CaptionOverlay.lockedWidth` / JS 侧 `locked(run)`），
**数字在格子里左对齐，单位钉在格子的右沿**。于是读数越短，中间那段空白越长 —— 空白本来就是格子的
剩余部分，谁也没算错，只是它落在了数字和单位之间。

`devtools/r92-gap.js` 用真实字号（车速 = 画面高 × 0.032）逐读数量墨：

| 帧高 | 数字→单位间隙 | 单位逐秒横移 | 数字左缘游走 |
| --- | --- | --- | --- |
| 720p（车速 23px） | 2.8 – **29.2** px | 0 | 26.4 px |
| 1080p（车速 34.6px） | 4.1 – **43.8** px | 0 | 39.6 px |

顺带量掉一个想当然：**把参考从 `888.8` 改成 `199.9` 完全无效** —— 数字是等宽的，锁的是**位数**不是
字形，两个参考串量出来同一个宽。所以可选的只有「数字右对齐到锁定格」与「单位紧跟数字（放弃锁定）」，
后者会把 R87 特意消掉的抖动放回来（9.4 → 104.7 那一秒单位跳 40px）。用户选了 **A：数字右对齐**。

## 2. 改动

格子照旧预留、行宽照旧不变，只把数字往格子的**右沿**靠：

- Kotlin `CaptionOverlay`：`Run` 多一个 `rightAlign`，绘制循环里 `textX = x + advance - measureText(text)`，
  推进仍用 `advance`（`widthOf`），描边与阴影同一坐标。
- JS `script.js`：`pePaintPreviewWatermark` 的车速 run 带 `rightAlign: true`，`textX` 同式。

桌面端不受影响：这条式子只在手机端的水印绘制里，且 `advance` 没变，块宽与「标记占画面 %」一字未动。

## 3. 验收

- 预览侧 `devtools/r92-check.js` **6/6**：五个读数（5.6 / 9.4 / 15.6 / 42.8 / 104.7）间隙恒定
  （0–0px，即一个 `space` 加字形边距）、数字右沿钉住（≤6px，墨边界受字形影响）、数字左沿确实会走
  （23px，右对齐的签名）、整块宽度仍 223 不变。
- 文件侧 `devtools/r92-file.js` 导出 `0.2-5.6s` 单路 720p，`devtools/r92-measure.js` 逐秒读墨 **5/5**：
  数字右沿每一秒都停在 `0.9266`、单位每一秒都停在 `0.9281`、间隙 0–1px。
- 目视同一条 15.6 的同一块区域 4× 放大：`devtools/r92-row-before.png`（1.2.145，一大段空白）对
  `devtools/r92-row-after.png`（1.2.146，单位贴着数字）；四方案对比图 `devtools/r92-mockup.png`。
- 回归：`r87-ui` **41/0 PASS**、`r88-ui` **68/0**、真点击 `r88-taps.sh` **13/13**、
  `r88-regress.sh` r83 17/0、r84 18/0、r85-verify3 4/0（r85-verify2 的 L3/L7 照旧是被 verify3 取代的旧判据）。
  日志 `devtools/r92-regress.log`。

## 4. 判为不做 / 没验到

- **间隙 0–1px 是算出来的**：`space = 0.12 × 车速字号`（720p 约 2.8px），再扣掉数字的右边距；墨边界
  量到 0 不代表字碰字。真机上若仍嫌挤，改的是这个系数，不是对齐方式。
- **AVD 的解码器**：本轮文件侧第一次跑 `r92-file.js` 时 `number` 量空，原因是「高墨」阈值按全分辨率
  校准（缩略图只有 640 宽），改成「相对该行最高墨的 0.75 倍」才成立 —— 记在
  [[emulator-acceptance-false-signals]]：**缩略图上的判据不能写死像素。**
- **真机复测**：小米 14 上再看一眼 15.6 / 104.7 两种读数的观感。
- 仍欠：#301（AVD 专属）、预取、`boundary-tail`。

## 5. 交付

- **`Tessera-1.2.146.apk`（工作区根目录）28,012,923 B**
  md5 `14ef292b35eb799a454967709eab8b58`
  sha256 `9c5a50a9d7502fe12caf5d9cdddf8eed523b76d0368c15277396c922d2f0b020`
  SO_MATCH：APK 内 `lib/arm64-v8a/libtdashcam_studio.so` md5 `299b7c4a08bfa87c0bb677275a15ce5b`
  == `target/aarch64-linux-android/release/libtdashcam_studio.so`。装机 `dumpsys` 回读 `versionName=1.2.146`。
- 改动面：`export/CaptionOverlay.kt`（`Run.rightAlign` + 绘制 `textX`）、`src/script.js`（车速 run +
  `textX`）。构建日志 `devtools/r92-build-146.log`；读数 `devtools/r92-gap.json`、
  `r92-check-{before,after}.json`、`r92-file.json`。

# R93（1.2.146 → 1.2.147）优化清单落地：一次性做完除体积以外的全部

用户先要清单（「请看一下这个 app 还有哪些可以优化的地方」），拿到 14 条后的话是
「安装包体积先不动，其他你就一次性搞了，我晚上要休息了……搞好了自查有没有什么 bug，审查代码，
然后修复完善，明早我起来看」。所以本轮的交付物不是一件事，是**清单上每一条的结论**：做了 6 条，
用数字判为不做 3 条，留给真机 2 条，体积 2 条按指示搁置。

## 0. 一览

| # | 条目 | 结论 | 凭据 |
| --- | --- | --- | --- |
| 1 | ABI split | 按指示不动 | — |
| 2 | 字体子集 | 按指示不动 | — |
| 3 | 段边界前预取遥测 | **判为不做**（实测 16–175 ms，且本来就不在关键路径上） | `devtools/r93f-all.js` |
| 4 | boundary-tail 段尾被砍 | **判为不做**（本轮 skip=0.00 s；且本机六路片长只差 48 ms，量不到真机的 1.95–8.80 s） | `r93g-durs.js`、`r76-skip.mjs measure` |
| 5 | #301 AVD 覆盖层交接 | 继续放着（真机 0/30） | — |
| 6 | 导出前不查剩余空间 | **做了** | `r93-verify` A 段 5 条 |
| 7 | 整段零帧静默出黑片 | **做了**（并证明不误伤正常导出） | 真导出 `job done` + 行数 +1 |
| 8 | 退后台不释放解码器 | **判为不做**（WebView 自己释放，实测 −45 MB） | `devtools/r93e-summary.txt` |
| 9 | 导出完成只能看不能动 | **做了**（分享 + 最近导出 5 条） | 真点击起系统分享面板 |
| 10 | 首启字体跳变 | 随 2 一起搁置 | — |
| 11 | 冷启动真机基线 | 留给真机（命令见 §7） | — |
| 12 | 批量导出 / 导出历史 | **做了历史那半条**，排队导出判为不做 | `r93-verify` C 段 8 条 |
| 13 | 拆 `script.js` / `styles.css` | 判为不做（见 §7） | — |
| 14 | 动态内容 aria-live | **做了** | `r93-verify` D 段 7 条 |

## 1. 导出前先问一句「装得下吗」（#6）

`volumeCapacity()` 过去只在卷信息里显示，导出路径直接开写 —— 一段六路长片写到 97 % 才失败，前面
几分钟白跑，还留一个相册打不开的半成品。

- `peExportSizeEstimate(plan)`：**抄编码器的算法**，不是猜。引擎在请求没带 `bitrateKbps` 时按
  `(cells * fps / 1000L * 0.09f).toInt().coerceIn(1500, 24000)` 算码率，而导出页从来不发这个字段
  （实测 `bitrateKbps` 在 `script.js` 里 0 处引用），JS 侧同式即可。验收：五种预设逐一对齐
  `max-diff 0 kbps`，当前计划 `937500 vs 937500`。
- `peFreeBytes(path)`：按**最长前缀**匹配卷（`/storage/emulated/0` 是手机上所有路径的前缀，先命中
  会把 U 盘当成内置盘），读的是 Kotlin `storageVolumesJson()` 里 `"free":$free`（`StatFs` 字节数）。
  读不到就返回 `null`，而 `null` **永不拦停** —— 「数不出来」和「放不下」是两个答案。
- 拦下时给两条信息 + 一条退路：`存不下了：这段大约要 916KB，目标盘只剩 1.0KB · 再按一次「开始导出」
  可以强行开始`。二十秒内第二次按就放行：一个算错的「放不下」不能把功能锁死。

## 2. 「整段零帧」不再算成功（#7）

R91 在 AVD 上抓到过 `chrome requested but not built: cells=0 streams=1 painted=0` —— 那一路解码器
整场没交出纹理，`framesWritten` 照样涨、muxer 照样关、页面照样报「已保存」，文件里只有叠加层。
`framesWritten` 看不见这件事，因为它数的是**写出去的帧**，不是**解出来的画面**。

`ExportEngine` 加 `paintedOnce: BooleanArray(streams.size)`，`updateTexImage()` 成功才置位：

- 全部为 false → `failure = "N 路解码器一帧画面都没交出来，文件里只有叠加层"`，走既有的失败清理
  （0 字节容器删掉，不留黑 .mp4）；
- 部分为 false → 只补一句 `tailNote`「有 N 路全程没有画面」，任务仍算成功；
- 取消优先：`if (failure != null && job.cancelled.get()) failure = null` 在两条新判据之后，所以
  第 0 帧就取消仍是 `cancelled`，不会变成 error。

**这一条最重要的验收是反方向的**：正常导出不能被误判。真跑一条单路 736x480 / 5 s，`job done`、
`bytes>0`、最近导出行数 +1、`errors=0`。

## 3. 分享 + 最近导出（#9、#12 的一半）

`MainActivity.shareFile(path, title)`：`file://` 递给别的进程会直接抛 `FileUriExposedException`，
所以必须换成该文件的 MediaStore Uri；查不到就先 `MediaScannerConnection.scanFile` 再查一次（抢在
扫描器前面的那一下）。返回的是**原因码**（`ok|missing|unindexed`），字归页面说。

### 3.1 差点跟着包发出去的一个真 bug

第一版写了：

```kotlin
if (packageManager.resolveActivity(send, 0) == null) return "no-receiver"
```

看着稳妥，实际**在 Android 11+ 上永远为真**：包可见性过滤下，没有 `<queries>` 声明就查不到任何
外部接收者，而本模块的 `AndroidManifest.xml` 里一条 `<queries>` 都没有。也就是说用户按「分享」，
十台机器上会得到十次「这台机器上没有能接收视频的应用」，而系统面板里躺着五个可选应用。

改法不是补 `<queries>`（`gen/android` 的清单由脚手架维护，改了会被覆盖），而是照 `openExternal`
的既有写法：**把解析交给选择器本身**，它没有接收者时会用自己的话、用户的语言说；`startActivity`
的守卫必须写在 `runOnUiThread { }` **里面** —— 包在外的 `runCatching` 只兜得住「投递」这一步，
UI 线程里那一下抛出来就是闪退。`no-receiver` 这条原因码连同两份 i18n 一起删掉（不可达的文案就是
死代码）。

真点击验收（`devtools/r93-share-taps.sh`，全程 `adb input tap`，不用 `element.click()`）：

```
focus: mCurrentFocus=Window{… com.android.intentresolver/.ChooserActivityLauncher}
```

分享面板起来了，附件、Quick Share / Messages / YouTube / Drive / Maps 五个接收者都在，背后就是
新加的「最近导出」卡。

### 3.2 历史为什么是 5 条、为什么在导出页里

清单 #12 给的是「多选事件排队导出、**或**在列表里标出已导出」。排队导出要动 `ExportEngine` 的
单任务互斥（`running === job`）和前台服务，属于「没人盯着不该发」的那类改动，判为不做；取「或」
后面那半条，并把它做成**能直接分享的历史**而不是一枚「导出过」角标 —— 角标说不清导出的是哪一段，
而一夜导了三条时，用户要发走的常常是第二条。

`tdashcam.exportHistory`（localStorage，最多 5 条，同一路径挪到最前不重复）；行用一次委托监听
（`data-export-share="${index}"`），因为列表会整段重绘。文件已被删掉时，那一条**连着按钮一起消失**
并给 `role="alert"` 的 toast：留一个只会失败的按钮比没有按钮更糟。

## 4. 动态内容的可读性（#14）

- `showToast`：容器 `role="status"` + `aria-live="polite"`；错误 toast 自己带 `role="alert"`
  （alert 是隐式 assertive 区域，插入即打断）。
- `setBarPercent`：补 `aria-valuetext="N%"` —— 只报数字不带单位，读屏里就是一句没头没尾的「42」。
- `#jsErrorBanner` → `role="alert"`；`#peZoomTime` → `role="status" aria-live="polite" aria-atomic`。

**这里我自己先踩了一个坑**：第一版按「错误要打断」做了两个 `.toast-container`（polite / assertive
各一）。而 `.toast-container` 是 `position: fixed; top: 20px + safe-top; left: 50%` —— 两个容器落在
**同一个坐标**上，两条 toast 会完全叠在一起。改成单容器 + 错误节点自带 `role="alert"`。样式类改动
的验收必须是 computed style 加截图，这条又印证了一次。

## 5. 遥测：预取判为不做，但补了缺的守卫（#3）

`loadMetadata` 在换段处是 **fire-and-forget**（`script.js:6067` 没有 `await`），所以它从来不在起播
的关键路径上。实测原生 SEI 走一遍（`read_sei_metadata`）：

| 片 | SEI 点数 | 冷读 |
| --- | --- | --- |
| 无遥测的 1 分钟片 ×10 | 0 | 16 – 22 ms |
| `2026-10-09_09-00-00-front` | 150 | 101 ms |
| `2026-10-09_10-00-00-front` | 150 | 175 ms |
| `2026-10-08_07-30-59-front` | 0 | **544 ms** |

收益上限就是换段后 HUD 晚 0.1–0.5 s 更新；代价是把一次整文件读塞进 R74–R80 一轮轮调出来的换段
窗口（六路正在同时拉流）。**不对称，不做。**

但量这一条的时候看见同一个函数缺一个守卫：`loadMetadata` 没有防「后发先至」。冷读 101–175 ms、
命中缓存 0.1 ms，于是往回快速划时间轴时，**上一分钟的读数会盖到这一分钟的画面下面**。加了令牌：

```js
const token = this.loadToken = (this.loadToken || 0) + 1;
… await …
if (token !== this.loadToken) return;   // 有人比我晚问，也有人有答案
```

`clear()` 同样抬令牌并落 `isLoading` —— 否则被放弃的那次读会把「载入中」永远留在面板上。
这条动的是桌面/手机共用路径，但只有一个调用点，且只在**原本就会显示错数据**的那条分支上改变结果。
验收用 150 点片（冷）对 0 点片（热）做判别：无守卫必然停在 150，有守卫停在 0。

## 6. 三条「量完发现不用做」

**#8 退后台释放解码器。** 播到 4–6 路时按 HOME，8 秒后不动一行代码：

```
renderer(11379) Ashmem PSS   8651 → 481 KB      （解码器共享缓冲，−94 %）
renderer TOTAL PSS         198354 → 153058 KB   （−45 MB）
```

Chromium 自己就把解码器收了；而且 `MainActivity.onPause` 的注释早就写明「`WryActivity.onPause`
会在任何 JS 察觉之前冻结 WebView」—— 页面层根本跑不到这段释放代码。回前台后 6/6 停在暂停位、
`mcp.isPlaying=false`（状态与画面一致）、真点 `#playPauseBtn` 能接着走。页面**交不回**的两项（音频
焦点、窗口亮度覆盖）已在 R67-D/R85 挪到 `onPause`。所以这条不是「没做」，是「平台已经做了」。
顺带：本轮 AVD 自己死过一次（`emulator.exe` 与 qemu 进程双双消失、`adb devices` 空），那是宿主机
负载，不是 APP 的进程。

**#4 boundary-tail。** `r76-skip.mjs measure` 六路逐段：`probe skip = 0.00 s` ×6，即换段处**没有
把内容丢掉**；APP 自己的 `L=26.49–57.96 s` 是纠偏跳变累计（每次约 3 s），落在 R65/R79 那台状态机
管的分支上，不是段尾。但要如实说清：**AVD 造不出非零段尾**。段尾的上界是同一格六路**片长之差**
（`front.ended` 一触发，其余五路手里没播完的就丢了），`r93g-durs.js` 量到的是：

```
六路 duration  6.242 / 6.249 / 6.255 / 6.256 / 6.264 / 6.290   → 差 0.048 s
```

48 毫秒对上 R76 在真机上量到的 1.95–8.80 s，差三个数量级，所以这里的 0.00 只能证明「等长片上这条
路径无害」，不能推翻那条真机读数。维持 R76-3 的「有界不做」，真机采集办法见 §7。

**#13 拆单文件。** `script.js` 22.6k 行、`styles.css` 9.7k 行是真的难改，但拆分是纯结构性改动：
收益在我这边（每轮少找落点），风险在用户那边（一次跨 5 个 script 的加载顺序 + 桌面/手机共用面）。
深夜无人复测时不该发。要做的话，第一刀建议从「手机端导出页 + 水印/叠加层」开出去（本轮 6 条里 4
条都在这一块，内聚度最高），而不是按行数对半切。

## 7. 留给真机的两条

1. **冷启动基线（#11）**：AVD 的 `TotalTime 4.1 s` 是软件渲染 + 高负载，不可比。小米 14 上跑
   `adb shell am start -W -n com.tdashcam.studio/.MainActivity`，取 `TotalTime` 与首帧；顺带确认
   分享面板里**附件显示的是文件名还是 MediaStore 行号**（AVD 上显示成「288」，怀疑是模拟器媒体库
   的 `DISPLAY_NAME` 取值，真机不一定）。
2. **段尾与纠偏**：真机播一条多段事件，跨 2 次以上自然换段，⋮ → 复制诊断，读 `describeLoss` 每路
   的 `L=总秒/次数` 与 `via=` 标签；`via=boundary-tail` 的占比才是 #4 的真凭据。

## 8. 验收

- `devtools/r93-verify.js` —— **30 条全过，0 失败**（A 拦停/放行/文案两条数字、B 与编码器同式、
  C 行数/命名/去重/上限/持久化、D 单容器 + role + valuetext、F 迟到答案与 clear）。
- `devtools/r93-share-taps.sh` —— 真手指：真导出→自动出行→点「分享」起系统选择器；点已删文件的行
  →该行消失、localStorage 清空、整组隐藏、toast 是页面自己的「那个文件已经不在了」且 `role=alert`。
- 回归：`r83-verify 17/0`、`r84-verify 18/0`、`r85-verify3 4/0`、`r87-ui 90/PASS`、`r89-zoom 5/5`、
  `r88-ui 68 项 1 失败`。那 1 条是「放大层画布要铺满 css×dpr」，而当前片源本身只有 736 px 宽 ——
  R90 特意把取帧收口到文件自身尺寸，736 的片子填不满 1082 设备像素是**前提不成立**，不是回退。
  `r85-verify2` 的 L3/L7 是 R90/R91 已记录的过期判据（由 `r85-verify3` 取代）。
- 本轮新记的假信号：① `r88-ui` 假定进入时「预览帧」是开的，任何先前探针留下 off 就会多报一条
  假失败；② 我曾试图在探针开头替它打开，结果把后面的隐形层判据带出两条新假失败 —— **改量具要
  重跑全量，否则就是把判据改松**；③ `r76-skip.mjs check` 在刚换段、`duration` 还是 NaN 时会报
  `boundary-tail = NaN`，等 20 s 再跑就 ok。

## 9. 交付物

- `Tessera-1.2.147.apk`（工作区根目录，旧包一律保留）：28,015,803 B；
  md5 `e3749a9c7428bf2eb217f2d1cb9ea9c9`；
  sha256 `12de17d8c9eff253378b43eab8a1ae2805a5b1174827157314d395a21e732870`；
  SO_MATCH `d0181d4bcd3029fe2957cef888cee97d`（APK 内 `lib/arm64-v8a/libtdashcam_studio.so`
  与 `…/intermediates/stripped_native_libs/universalRelease/…/arm64-v8a/` 逐字节相等）。
  装机 `dumpsys package` 回读 `versionName=1.2.147`。
- 改动面：`src/script.js`（A/B/C/D/F 五处）、`src/index.html`（最近导出组 + 两处 role）、
  `src/styles.css`（`.pe-last-list` / `.pe-last-row` / `.pe-last-name`）、
  `MainActivity.kt`（`shareFile` / `mediaUriFor` / 桥方法）、`export/ExportEngine.kt`（`paintedOnce`）。
- 新仪器：`r93-verify.js`、`r93-share-arm.js`、`r93-share-missing.js`、`r93-share-taps.sh`、
  `r93-catch.js`（带栈的 error/unhandledrejection 记录器）、`r93f-all.js`、`r93g-durs.js`、
  `r93e-summary.txt`。构建日志 `devtools/build-12147{,b,c,d}.log`（c 是我自己写错的一版：
  `MainActivity` 里没有 `Log`/`TAG`，编译期就拦下了）。

# R94（1.2.147 → 1.2.151）清单 #5 与 #11：把「要真机数据」变成「一条 paste 就够」

用户的问题是「5、11 要怎么改？需要我这边提供什么数据」，选项里选了「加启动埋点，发新包」。
所以本轮**不改任何行为**，只补两处取证口：让报告能自证冷启动慢在哪一段，让 hold 行能自证
`rs=1` 到底是黑格还是读数。改完之后这两件事都不需要 adb —— 真机侧只要一次「⋮ → 复制诊断」。

## 1. #11 冷启动埋点（`markBoot` / `describeBoot`）

`src/script.js:1521` 起：`bootMarks` 表 + `markBoot(name, detail)`（同名只记第一次）+
`describeBoot()`。五个落点：

| 标记 | 落点 | 含义 |
| --- | --- | --- |
| `ready` | `script.js:22851`，`nativeFire('pageReady')` 之前 | 页面自己跑完引导 |
| `list=N:9` | `script.js:13360`，`filterAndRender()` 首行 | 列表第一次带数据画出来，`N` 是条数 |
| `open` | `script.js:13452`，`playEvent()` 取到事件之后 | 用户点进一条事件 |
| `play` | `script.js:8329`，`updatePlayState(true)` | 第一路真的在播 |
| 浏览器自带 | `describeBoot()` 里读 paint / navigation 条目 | `fp` `fcp` `dcl` `load` |

手机档才把整行塞进报告（`script.js:15878`，`isTouchShellRuntime()`），桌面一行都不多。

AVD 上两次冷启动，差一个数量级 —— 这正是要由真机自报而不是由我猜的理由：

```
重装后第一次  boot ready=9395 list=11254:9 open=55482 play=58648 | fp=8540 fcp=8540 dcl=9410 load=10294
页缓存热了    boot ready=630  list=3205:9  open=59262 play=59478 | fp=324  fcp=324  dcl=637  load=2682
```

顺带把 `am start -W` 的角色钉死：同一台 AVD 它读 `TotalTime 1701 ms` / `755 ms`，而页面自报
`ready` 是 9395 / 630 ms。**TotalTime 量的是 Activity 起起来，不是画面出来**，两个数都要，缺一个
就会把「WebView 起得慢」和「我们的数据慢」混成一句。`fcp` 单独留着就是为这一刀。

## 2. #5 的取证口：`pf=`（真正上了屏的帧数）

`paintedFrames(player)`（`script.js:5681`）读 `getVideoPlaybackQuality()`，**先按 spec 名读
`presentedFrames`，读不到再退 `totalVideoFrames − droppedVideoFrames − corruptedVideoFrames`**。
这个退让是实测逼出来的：AVD 的 WebView 上那个对象的 own properties 只有旧版三件套，照 spec 名读
得到 `undefined`，基准静默退化成「无读数」，30 条 hold 全是 `pf=none` —— 看起来跟「新代码根本没跑」
一模一样。

第一版把 `pf` 写成「释放时 − 挂起时」的差值，AVD 直接给出**负数**（`pf=-22 … -376`）：换 `src` 会把
计数器清零，跨段做差在语义上就不成立。改成绝对值之后它才是 #301 要的那句话 ——「这个元素从拿到新文件
起，已经往屏幕上放了几帧」。释放行（`script.js:6682`）和仍挂着的格子（`describeHolds()` 的 standing
项）都带这个读数，`-1` = 这台 WebView 说不出来。

AVD 实测 1.2.151：6 条 `frame` 释放全部带 `pf=3–4`，配 `rs=4`。

判据（真机读数出来后按这三条走，不再猜）：

- `rs=1 pf≥1` → readyState 读数滞后于画面，#301 关掉；
- `rs=1 pf=0` → 覆盖层掀在一个真黑格上，升级成缺陷，下一轮修释放条件；
- 出现 `deadline` → 是新问题（等待根本没被叫醒），与 #301 分开记。

## 3. 自查与验收

- `devtools/r94-verify.js` —— **17 条全过，0 失败**（A 段：五个标记都在、顺序符合人的体验次序、
  `fp/fcp/dcl/load` 带上了、复制出来的报告里有这一行；B 段：跨一次自然换段，6 条释放全带 `pf=`，
  任何 `rs=1` 行自带判据；错误面两条都空）。
- 回归：`r93-verify 30/0`、`r83-verify` 9 格全 `HUGS`、`r84-verify` 无 `ok:false`、
  `r85-verify3` `passed:["L3","L7"] failed:[]`。
- 本轮自己的假失败（都记进了记忆）：① 第一版 `pf=none` 是 API 名不对，不是没接线；② 判据用
  `holds.slice(-3)` 取样，而 `describeHolds()` 把仍挂着的格子拼在**末尾**，于是永远只看得到
  STILL-STANDING、报成「0/10 带 pf」；③ 刚过段界那一刻读 `holdLog`，六路全被闸门挂着、一条 released
  都还没写，要等 4 s。
- **一处已知不匹配**：1.2.151 装机后又合并了 `pf` 上方两段重复注释（纯注释，不改行为，
  `node --check` 通过），下一个包会带上。

## 4. 交付物

- `Tessera-1.2.151.apk`（工作区根目录，1.2.148/149/150 与更早的包一律保留）：28,017,275 B；
  md5 `94b62c12c77a3968a5673f937761fcfb`；
  sha256 `4ea207aa32d7b5d95e7bcee6fea43d53e03f5f6e035a2db8c08998fe3aab687a`；
  SO_MATCH `992551d143ff8c00774bad181810d148`（APK 内 `lib/arm64-v8a/libtdashcam_studio.so` 与
  `intermediates/stripped_native_libs/universalRelease/…/arm64-v8a/` 逐字节相等）。
  装机 `dumpsys package` 回读 `versionName=1.2.151`。
  中间三个包同样留在根目录：`1.2.148`（埋点第一版）、`1.2.149`（`fp`/`fcp` 拆开命名）、
  `1.2.150`（`paintedFrames` 兼容旧表面，但 `pf` 仍是差值）。
- 改动面：只有 `src/script.js`（`bootMarks`/`markBoot`/`describeBoot` 与五个落点、
  `paintedFrames()`、`pf:` 两处）+ `tauri.conf.json` 版本号。Kotlin、Rust、CSS、HTML 没动。
- 新仪器：`devtools/r94-verify.js`；读数 `devtools/r94-out.txt`（第一版 15/1）、
  `r94b-out.txt`（负 `pf`）、`r94c-out.txt`（17/0）；构建日志
  `devtools/build-1214{8,9}.log`、`build-12150.log`、`build-12151.log`。

# R95（1.2.151 → 1.2.153）真机报告判案 + 修「衔接处控件自己弹出来」

用户把 1.2.151 在小米 14（`23127PN0CC` / Android 16 / `viewport=400x890 dpr=3`）上的完整复制诊断贴了
过来，附带一句新现象：「视频衔接处，播放控件会弹出来一下，然后几秒钟后又消失」。这一轮先把报告里
能判的全判掉，再修这条。

## 1. 三条挂着的真机凭据，一次到齐

- **#11 冷启动**：`boot ready=520 list=714:1 open=2444 play=2735 | fp=500 fcp=500 dcl=525 load=639`。
  首屏 520 ms、列表 714 ms、点进事件到起播 2735 ms。AVD 同期是 `ready=9395` —— 差 18 倍，
  R93/R94 一直不敢按模拟器数改启动路径是对的。**判：不需要动。**
- **#301 覆盖层交接**：30 条 hold 全部 `rs=4 pf=4`、`gate=ready 6/6`、632–676 ms，**没有一条 `rs=1`，
  也没有一条 `deadline`**。R76 当时记的「真机 0/30」到这里才算有凭据。**判：关掉。**
  `pf=4` 还顺手自证了读数不是摆设：12 fps 的片子在 `lm≈116–214 ms` 之后只剩约 450 ms，正好 4–5 帧。
- **#4 段尾**：`lost total back=0.58s/2 left_pillar=0.18s/1` —— 48 个格子（8 段 × 6 路）里只有 3 条
  `boundary-tail`，分别是 +0.18 / +0.28 / +0.30 s，合计 0.76 s。R76 记的 1.95–8.80 s 是**轴误差**，
  同一份报告里 `axis … acc=+9.53s resid=+0.00s` 证明 R77 的 `rebookAxis` 已经把它吃掉。
  **判：有界，不做**（上界 0.30 s/段，且只在两路上出现过）。
- 顺带结案 R93 §7 那条：分享面板在真机上显示的是 **文件名**
  （`Tessera_2026-…2224x720.mp4`），微信在接收方列表里。模拟器那个「288」是它自己媒体库的毛病。

## 2. 控件为什么会自己弹出来

根因**不在**换段闸门。`r95-who-reveals.js` 把 `showControls()` 打上栈之后抓到的是：

```
before  show=false playing=false          ← 参考路播完自己 pause
just    show=true  playing=false paused=false   ← updatePlayState(false) → resetHideTimer() → 点亮
+3s     show=false                                 ← 起播后 3 s 自动收
```

一条片子放到头，UA 会先把元素置成 paused 再触发 `pause` 事件；`updatePlayState()` 里那句无条件的
`resetHideTimer()` 于是把覆盖层掀开，闸门释放、真正起播之后 3 s 又自己收 —— 正是「弹出来一下，
然后几秒钟后又消失」。AVD 复现 **4/4 次换段**（`msSinceSeg:0`，收起在 4.6–6.8 s 后）。

**第一版修法是错的。** 我按「闸门推迟起播」推断点亮来自 resume 那半边，加了个 `splicing` 标志去挡
（1.2.152）。装机复测仍是 4/4 —— 因为点亮发生在 `splicing` 还没被置起之前。五处改动全部回滚，
`grep -c splicing` 归零。

**最终改法**：状态变化本身不再负责掀覆盖层，掀它的是**动作**。

- `updatePlayState()` → `resetHideTimer(false)`（`script.js:8346`）：只校准自动收起时器，不点亮；
- `resetHideTimer(reveal = true)`（`script.js:8447`）：`reveal=false` 时只重排定时器；
- 打开事件卡片补一句显式 `resetHideTimer()`（`script.js:13550`）—— 卡片在抽屉里，`#playerArea`
  的触摸监听听不到它；
- 被音频焦点打断时补一句显式 `showControls()`（`script.js:1941`）—— 这是唯一一个「用户没要求、
  但确实该看见暂停键」的停。

画面上的触摸、⋮ 菜单、双击分区这些路径本来就各自点亮，没有动。

## 3. 验收

- `devtools/r95-controls.js` —— 修前 `crossings:4 revealAtCrossing:4`，修后 **`4 / 0`**（探针全程不
  碰 UI，只在等覆盖层自己收掉之后采样那一个 class）。
- `devtools/r95-tap-reveal.sh` —— 真手指五步：等它自动收 → 点画面必亮起 → 3 s 后自己收 →
  点播放/暂停键状态确实翻转且那一下仍亮着 → 5 s 后按状态收尾（播放中就收，暂停就不收）。
- `devtools/r95-pause-trace.js` —— 暂停态 6 s 采样：`paused-and-stays-shown`。这一步是补出来的：
  `r95-tap-reveal.sh` 第一版假定点下去一定是「暂停」，实际那一下是「继续」，于是把正确行为读成了
  回退 —— 判据要断言**变化**，不能断言起始状态。
- 回归：`r94-verify 18/0`、`r93-verify 30/0`、`r84-verify` 无 `ok:false`、`r83-verify` 九格全 `HUGS`、
  `r85-verify3` `passed:["L3","L7"] failed:[]`。

## 4. 交付物

- `Tessera-1.2.153.apk`（工作区根目录，旧包全留）：28,017,663 B；
  md5 `9f62c26be50d66ce2e0ea4c75f8d85f9`；
  sha256 `db624e8989747c8d2d2171bfd5a7a489ad967065437ac0787a9684d2d11f8618`；
  SO_MATCH `b38bba5e4218b161c3a2fff24fcad211`。装机 `dumpsys package` 回读 `versionName=1.2.153`。
  `1.2.152` 是那次无效修法，留在根目录不删；`1.2.148–151` 是 R94 的取证口。
- 改动面：只有 `src/script.js`（`updatePlayState` / `resetHideTimer` / `playEvent` /
  `__tdashcamAudioFocus`）+ `tauri.conf.json` 版本号。Kotlin、Rust、CSS、HTML 没动。
- 新仪器：`r95-controls.js`、`r95-who-reveals.js`（一次性取证）、`r95-tap-reveal.sh`、
  `r95-pause-trace.js`；读数 `r95-controls-before.txt`、`r95-controls-fixed.txt`、`r95-pause-out.txt`、
  `reg153-*.txt`；构建日志 `build-12152.log`、`build-12153.log`。

# R96（1.2.153 → 1.2.156）清单第一批：导出体积、只看触发、显式步进、逐帧、搜索防抖

用户把「功能与交互还能完善的地方」那份清单按顺序批了，并要求一批一批自己往下做不用等确认：
「请按照给到的建议顺序来改APP吧。你自己一批一批的改，我白天上班有点忙，没法盯着」。
第一批是清单 1、2、3、4、7；第二批（R97）是 5、8、9、10。

## 1. 导出页那一行现在说得出「约多大、还剩多少」

摘要行原来只有 路数 · 分辨率 · 时长 · 打码块数，体积要等点了开始导出才出现。

- `peExportSizeEstimate(plan)` 用的就是 Kotlin 那条码率公式
  `(cells * fps / 1000 * 0.09).coerceIn(1500, 24000)` × 时长，所以摘要里那个数字和编码器真要写的
  字节同源，不是拍脑袋；
- `peOutPath(plan)` 从 `startPhoneExport()` 里抽出来共用 —— 摘要报的文件名必须就是导出会写的文件名；
- 剩余空间走 `refreshPeFreeSpace()`：30 s 节流、面板不可见（`offsetParent` 为空）不读、一次导出完成后
  把时间戳归零逼下一进门重读；
- i18n 两条：`peEstimateSize`「约 {size}」/「≈ {size}」、`peFreeSpace`「剩 {free}」/「{free} free」。

实测：`1 路 · 720x1600（每路 720x1600） · 07:13 · 打码 2 块 · 约 161MB · 剩 7.6GB`；
换 480p 预设后 `168,362,494 → 81,203,775 B`；文件名 `Tessera_2026-10-08_09-00-00_0.0-433.1s_1c_720x1600.mp4`。

## 2. 列表加「只看触发」

- 谓词就一行：`(!this.triggerOnly || !!this.triggerViewsFor(event))`（`script.js:13435`）；
- 与「只看收藏」共用那一套：`hasActiveFilters()` / `clearFilters()` / `aria-pressed` / 标签跟随语言；
- 本机 9 条事件里 2 条带触发原因 → 开筛选 `9 → 2`，留下的 2 条逐条验确实有触发，关掉回 `9`。

## 3+4. 显式上一条/下一条 与 ±1 帧

换事件以前只有画面横滑一个入口（R63 / B11），逐帧只有暂停时双击画面中间（R63-1）——
两个都是「已经知道的人才找得到」的手势。

- `phoneStepFrame(dir)`：先 `pauseAll()`，再 `controls.stepBySeconds(dir * PHONE_FRAME_STEP)`
  （0.1 s，正好 12 fps 的一帧），然后画面左上 chip + 轻触感；
- 按钮可见性完全交给 CSS：`updatePlayState()` 里新增
  `this.container?.classList.toggle('paused', !playing)`（`script.js:8364`），JS 不再管谁显示。

### 3.1 这条差点带着回归上线 —— 截图才看出来

1.2.155 装机后量控件行：暂停态那一行 `scrollWidth=451` 而轨道只有 392 px，
`剪辑 381..421 OFF`、`倍速 421..461 OFF` —— **暂停时点不到剪辑和倍速**，它们被推到 412 px 视口以外。
播放态是 `392/392`，也就是这一行在 R96 之前就已经排满，没有余量再塞两个按钮。

改法：两对按钮**共用槽位**。DOM 顺序改成
`上一条 · 上一帧 · 播放/暂停 · 下一帧 · 下一条`，
播放中显示外面那对、暂停时换成里面那对，`#playPauseBtn` 两种状态都停在 `left=58`。
R90 记的那条「状态一改控件就搬家」在这里同样成立，所以不是隐藏而是换。

判据补三条：两种状态各量一次 `scrollWidth <= clientWidth` 与右侧三个控件有没有越界，
再量播放键左右位置不变。1.2.156 复测：`392/392 out=none` × 2、`58 -> 58`。
截图 `devtools/r96-after-play.png`、`devtools/r96-after-pause.png`（对照 1.2.155 的
`r96-shot-pause.png`，那一版右侧两个已经出屏）。

## 4. 事件搜索不再逐字符重排列表

`scheduleFilterAndRender(120)` 挂一个待执行定时器；`filterAndRender()` 第一句先把待执行的清掉，
所以任何立即路径（点日期 chip、切筛选）不会被上一次输入拖住。
判据：连打 6 个字符期间 `renders=0`、落地后一共 1 次；立即路径 3 次调用仍是 3 次渲染。

## 5. 探针顺手抓出来的两件事

### 5.1 真 bug：导出页从来没有默认区间（1.2.155 修）

`clipStartTime/clipEndTime` 只在进过「剪辑」模式时才播种。于是 播放 → 导出 → 「选区」这条最短路径上，
摘要写的是 `0.0-0.0s`、点开始导出回一句「起点必须早于终点」、按钮一直禁用 ——
**不先点剪辑就用不了导出选区**。`showPhoneExportModal()` 里补播种 0 → 全长，且只在缺失或倒序时补。

这条是 `r96-verify` 第一版崩在 `peOutPath()` 上暴露的：探针没先加载事件，正是 R93 记过的那个坑。

### 5.2 一条被实测推翻的怀疑：「换事件后按暂停被吞」

一开始读数确实像 bug：`r96-c-diag2` 里 `playAll()` 之后 300 ms 四路全 `paused` 而 `isPlaying=true`，
跟着 `pauseAll()` 什么也没发生。

真手指复现（`r96-tap-settle.sh`：下一条 +600 ms、暂停 +1100 ms）+ 给 `playAll/pauseAll` 挂栈日志
（`r96-arm-calls.js`）读到的是：

```
+1181ms playAll() flag=false front=paused   ← TeslaCamViewer.playEvent:13602
+2202ms playAll() flag=false front=paused   ← ModernVideoControls.togglePlayPause:8052
+2816ms playAll() flag=false front=paused   ← MultiCameraPlayer.closeSeamGate:6865
```

那一下按下去时 `flag=false`、元素确实 paused、覆盖层带着 `.paused`、图标是 ▶ ——
按钮没有被吞，它按语义正确地「开始播放」了。用户看到的「按了没反应」是**换事件后首帧要 1.2–2.3 s
才落地**（AVD 数），那段时间本来就是暂停态。
**判：不改。** 而 `isPlaying=true 压在 paused 元素上` 只在换段闸门打开期间成立，那是设计
（闸门故意停住参考路、保留播放意图）。R95 那次「按机制推断选落点」的教训在这里第二次起作用：
同一份读数，栈日志一到，怀疑自己塌了。

## 6. 验收

- `devtools/r96-verify.js` —— **29 / 0**：A 体积 6 条、B 只看触发 7 条、C 四个按钮 11 条、
  D 防抖 3 条、E 桌面 2 条。E 那两条走 CSSOM 读规则，因为手机壳没法「不当自己是手机」。
- 真手指：`r96-tap-settle.sh`（换事件 + 暂停两次复现窗口）、`r96-who-resumes.sh`（栈取证）。
- 回归（1.2.156，`devtools/reg156-*.txt`）：`r94-verify` `fail:[]`、`r93-verify` `fail:[]`、
  `r84-verify` 无一处 `ok:false`、`r83-verify` 九格全 `HUGS`、`r85-verify3`
  `passed:["L3","L7"] failed:[]`、`r89-zoom` 五条全 ok、`r88-ui` **`fail:0`**。
- `r88-ui` 第一次跑报了 2 条，重跑（冷启动后单独跑）`fail:0` —— 是**同一批探针共用一个会话**污染的：
  它其中两条判据读 `pePreviewOn`，而 `updatePhoneExportPreview` 只要 `phoneExportPlan()` 带 error
  就把这个开关**顺手关掉**（`script.js:20089`），前面 `r93-verify` 跑完导出留下的状态足够让那一页
  临时出一个 error，于是预览被永久关掉、判据读成 `false`。R89/R90 记过「探针互相污染状态」，
  这次多一个具体机制：**派生条件不该写进用户开关**。这条本身值得单独一轮改，先记账不动。


## 7. 交付物

- `Tessera-1.2.156.apk`（工作区根目录，旧包全留）：28,020,091 B；
  md5 `70969fce8fcb69c416adf2bd98dc1fd2`；
  sha256 `f06da10c72a61dc686c14072fbea3b08ee128084a09ba7b3d58851680389c31b`；
  SO_MATCH `cfa6b62b02d7fb3a0e0458f54b08673f`。装机 `dumpsys package` 回读 `versionName=1.2.156`。
- `Tessera-1.2.155.apk`：28,019,835 B；md5 `c1dda4e12973e7063ff3b73526bf7e5c`；
  SO_MATCH `2a5cdf97bb9e761d709f9c9c51081a08` —— 第一批四条 + 导出默认区间，
  **带那条控件溢出**，留着当对照；`Tessera-1.2.154.apk`（28,019,579 B）是第一批的中间包。
- 改动面：`src/script.js`（导出摘要 / 只看触发 / `phoneStepFrame` / `updatePlayState` /
  `scheduleFilterAndRender` / `showPhoneExportModal`）、`src/index.html`（两对按钮 + 菜单行）、
  `src/styles.css`（两对按钮的显示与互换）、`tauri.conf.json` 版本号。Kotlin、Rust 未动。
- 新仪器：`r96-verify.js`、`r96-c-diag.js`、`r96-c-diag2.js`、`r96-settle-watch.js`、
  `r96-arm-calls.js`、`r96-tap-settle.sh`、`r96-who-resumes.sh`、`r96-row-geom.js`；
  读数 `r96-out*.txt`、`reg156-*.txt`；截图 `r96-shot-*.png`（1.2.155）、`r96-after-*.png`（1.2.156）；
  构建日志 `build-12154.log`、`build-12155.log`、`build-12156.log`。
- 留给第二批的一条：四个新按钮的 `title` / `aria-label` 是硬编码中文，英文用户在 TalkBack 里会读到
  中文 —— 走 `updateTabAriaLabels()`（`script.js:15492`）那个 id→key 映射补上。

# R97（1.2.156 → 1.2.158）清单第二批：触摸目标、空状态分流、抽屉页名、新按钮的语言标签

第一批之后接着做第二批（清单 5、8、9、10）。这一批里 5 只做了一半，理由写在 §4。

## 1. 三处低于 40px 的可点控件抬到 40

1.2.156 上实测（412 px 竖屏，量的是渲染后的 rect）：

| 控件 | 改前 | 改后 | 该改哪一条规则 |
| --- | --- | --- | --- |
| `.choice-segment`（⋮ 面板直选段） | 36 | 40 | 不是基础的 `.choice-segment`，是 `(hover:none) and (pointer:coarse)` 里那条 `min-height:36px !important` |
| `.sidebar-header .filter-toggle-btn`（漏斗） | 30×30 | 40×40 | 只在横屏出现的规则（`styles.css:4351` 那块） |
| `.recent-dirs .recent-chip`（最近目录） | 30（横屏 `--field-h` 38） | 40 | 同一块横屏规则 |

**三条弯路，每一条都是装机量出来的：**

1. 先改基础的 `.choice-segment { min-height }` —— 复测仍 36。原因就写在它下面 R42-2 那段注释里：
   ⋮ 面板里每个按钮都被 `.header-collapsed … { … !important }` 接管，基础规则是死的。
2. 漏斗与最近目录这两处一开始改进了**横屏专用** media query（`styles.css:4340` 那块），竖屏完全不
   生效 —— 探针在竖屏量到 `0×0`（漏斗基础态 `display:none`，只有横屏掀开它）。判据因此拆两份：
   竖屏断言「漏斗本就不该存在、筛选行该在」，横屏数字交给 `devtools/r97-landscape.sh` 真旋转后量。
3. 抽屉页名那条互换同样先写进了横屏块，已移到通用手机档（`max-width:768px` 那条 query）。

抬高度同时量了「有没有把别的东西挤出去」：抽屉那一行仍由 44 px 的搜索框决定（`--field-h`），
⋮ 面板 `scrollHeight<=clientHeight` 且最后一行底边在视口内（595/595、786 of 915）。

**横屏还藏着第三档。** 竖屏修好之后真旋转复量，同一条 `.choice-segment` 在横屏是 **34 px** ——
`(orientation: landscape) and (max-height:620px)` 里还有一条单独的 `min-height:34px !important`
（`styles.css:5968`，注释说明它是为了压过 `button` 规则的 specificity 才重新声明的）。
也就是说同一个控件横竖屏是两个尺寸。两处一起统一到 40。

另一条读数陷阱（第一次普查就中了）：⋮ 面板收起态带 `transform: … scale(0.98)`（`styles.css:282`），
在它**关着**的时候量里面的按钮会整体小 2% —— 40 px 读成 39.2，于是 12 个本来正常的菜单行被一起
误报成「偏小」。量之前先确认面板是开的。

## 2. 空状态现在说得出自己的成因

`EventList.render()` 以前只分「扫到过文件 / 没扫到过」两支，于是**没开任何筛选**而列表为空时也说
「没有找到匹配的记录」，而且因为没筛选也不给「清除筛选」—— 一句话既指错了方向又不给出口。
真实成因是 `processFiles()` 把每个 `.mp4` 都拒了：事件类型不认识 / 文件名不是
`YYYY-MM-DD_HH-MM-SS-*` / 认不出是哪一路相机。现在三分：

- 有筛选 → 原文案 + 清除筛选；
- 没筛选但扫到过文件 → 「这里扫到 N 个文件，但没有一个能认成片段 —— 要看的是 TeslaCam 里
  形如 2026-10-08_07-41-59 的事件文件夹」，**不给**清除按钮（没有可撤销的东西就别承诺撤销）；
- 一个文件都没扫到 → 仍旧走首屏帮助。

## 3. 抽屉打开时，「你在哪一页」现在看得见

先纠正清单里我自己的说法：底部条的当前页语义**不是没有**，`syncTabSelection()`
（`script.js:19113`）在抽屉开时给 片段 打 `.on`+`aria-current`，⋮ 面板开时给 设置 打，实测六种
开关顺序全部正确。真正的问题是抽屉一开整条底部条 `visibility:hidden`（R58 的既定设计），
那个标记**既看不见、TalkBack 也读不到**（`visibility:hidden` 把它整个从无障碍树里摘掉）。

改法是在抽屉自己的导航条上补：手机档把词标「特写」换成页名「片段」，logo 留着，桌面一个字不动
（`.header-page-name` 基础态 `display:none`，手机档反过来）。
没有选「把底部条抬到抽屉之上」—— 那会让条压住列表最后一行，正是 R90 记过的「新钉底条把控件推到
折叠线以下」的翻版。

## 4. 清单 #5「字号/圆角/间距 token 收敛」：普查做了，snap 等他拍

手机端那一层（`styles.css` 第 4790 行往后 5024 行）的普查：

- **圆角**字面值 12 种在打架：`8px`×13、`10px`×13、`12px`×8、`14px`×7、`9px`×4、`6px`×2、
  `22px`×2、`13px`、`7px`…；已有的四档 token（`--r-chip 8 / --r-card 12 / --r-panel 16 / --r-sheet 20`）
  一共只被引用了 18 处。
- **字号**字面值 14+ 种，从 `0.66rem` 排到 `1.15rem`，步长细到 `0.02rem`（0.66/0.68/0.7/0.72/0.74/
  0.76/0.78/0.8/0.82/0.86/0.98/1.05/1.15…）。

把 12 种圆角压进 4 档、14 种字号压进 5 档**一定会**改到每一屏的样子，而且字号收敛到更小的档位
会在固定宽度的行里开始截断文字 —— 这是「先出效果图再动手」那一类决定，而且他的一贯取向是
「档位表由他拍，不是替他选一个」。所以这一轮只做不会改变任何一个像素的那半：
21 处与现有 token 数值**完全相同**的字面值换成 token 引用（`8px`→`var(--r-chip)` 等），
computed style 一字不差。snap 的档位表留在报告里等他定。

## 5. 验收

- `devtools/r97-verify.js` —— 竖屏 **18 / 0**：A 语言标签 4 条（含英↔中来回 + `title` 一起刷）、
  B 空状态三分支 4 条 + 还原真列表 1 条、C 触摸目标与「抬完之后没挤出去」6 条、D 桌面 + 错误面 3 条。
- `devtools/r97-landscape.sh` + `r97-verify-landscape.js` —— 真旋转（关自动旋转 → `user_rotation=1`）
  后量横屏独有的那三件：漏斗 40×40 且在视口内、抽屉页名互换在横屏同样成立、列表仍有可用高度、
  ⋮ 面板每行都在屏内。第一版横屏复量抓到 `segment=34`（见 §1 末），修完复跑。
- 截图：`devtools/r97-drawer.png`（抽屉头「片段」+ 完成）、`devtools/r97-menu.png`
  （⋮ 面板 40px 直选段、只看触发行、底部条 设置 亮起）。
- 回归：见 §6。

## 6. 交付物

- **`Tessera-1.2.159.apk`**（工作区根目录，旧包全留）：28,022,075 B；
  md5 `160f002a432c44b813de27b89420de64`；
  sha256 `5a636d3772748d2125f3884476717b2dd8bfe904bf6437230af3fc2c976fd56b`；
  SO_MATCH `fc6fc89f00ecbd3149797b8c20d18f13`。装机 `dumpsys package` 回读 `versionName=1.2.159`。
- 中间两包留在根目录当证据：`1.2.157`（28,021,819 B，md5 `ad667a779879ee693526d504858bb518`，
  SO_MATCH `a53c90e7fab070a9a74f4561c35fd5fa`）= 触摸目标那三处**改进错了档**，竖屏完全无效；
  `1.2.158`（28,021,947 B，md5 `54ad1dd4fd660834653581af30fadd71`，SO_MATCH `5f49baca4b3ac902988bb41d9e9427de`）
  = 档改对了，但横屏那一条 34px 还没找到。
- 改动面：`src/script.js`（空状态分流 / `updateTabAriaLabels` 多带四个 id / 六条新 i18n key）、
  `src/index.html`（抽屉标题拆成词标 + 页名两个 span）、`src/styles.css`（三处触摸目标 +
  页名互换的手机档规则 + 21 处同值圆角改引用 token）、`tauri.conf.json` 版本号。Kotlin、Rust 未动。
- 回归（1.2.159，`devtools/reg159-*.txt`）：`r96-verify` `fail:[]`（证明那 21 处 token 替换没动到
  控件行）、`r94-verify` `fail:[]`、`r93-verify` `fail:[]`、`r84-verify` 九项 shipped 全 true 且
  无 `ok:false`、`r83-verify` 九格全 `HUGS`、`r85-verify3` `passed:["L3","L7"] failed:[]`、
  `r89-zoom` 五条全 ok、`r88-ui` **`fail:0`**（冷启动单独跑；同一会话连着跑会复现 R96 记过的
  `pePreviewOn` 污染，两条假失败）。
- 新仪器：`r97-verify.js`、`r97-verify-landscape.js`、`r97-landscape.sh`（真旋转 → 量 → 转回）、
  `r97-targets*.js`、`r97-tabs.js`、`r97-radii.js`、`r97-css-check.js`、`r97-why.js`；
  截图 `r97-drawer.png`、`r97-menu.png`。




# R98（1.2.159 → 1.2.164）清单第三批：事件体积、A-B 循环、删除撤销、导出选择记忆

按建议顺序做到第三批（清单 11、12、13、14、15）。15 条做前就判过不做，理由在 §5；14 条里「排队」沿用 R93 的判定，
真正缺的那半（每次导出都要重勾相机和分辨率）做了。这一批最有价值的东西不在清单上：装回 fixture 时撞出一个
签名缓存的洞，见 §5。

## 1. 事件卡显示体积（清单 11）

Rust 侧 `scan_media_dir` 原来只回路径。加 `sizes` 时没有改成「一文件一结构」：

```rust
struct ScanReport { files: Vec<String>, sizes: Vec<u64>, truncated: bool }
```

并列数组而不是 `Vec<FileInfo>`，理由是桌面端那套扫描只要路径，改结构会牵动一串读方；`push_media_file` 里
`entry.metadata()` 在多数文件系统上用的是 walk 已经握着的 entry，不是每文件多一次 stat。取不到大小记 0，
不留空洞 —— 两个数组必须按下标成对。

前端：`TauriFile.size` → `processFiles` 按事件汇总 `event.bytes`（只加 `.mp4`）→ 卡片副标题
`保存片段 · 18.5MB`。用 `formatBytes()`（≤0 返回 `''`）拼分隔符，所以拿不到大小时不会留一个悬空的 `·`。

装机对账（AVD，adb 侧 `stat -c %s` 逐文件求和）：

| 事件 | 卡上 | `stat` 合计 | 判定 |
| --- | --- | --- | --- |
| `SavedClips/2026-10-08_07-41-59` | 180.3MB | 189,115,225 B | 逐字节相等 |
| `SavedClips/2026-10-06_14-20-00` | 1.4MB | 1,611,154 B（8 个 mp4） | 卡上只算这条事件列出的 6 路 |
| 整盘 | — | 116 个文件全部带 size | `sizes` 与 `files` 成对 |

**口径要说清**：`event.bytes` 是「这张卡会播的那几路加起来」，不是「那个文件夹占多少」。第二行就是这个差别：
fixture 里那条事件有 8 个 mp4，其中 `left.mp4`/`right.mp4` 各 59,762 B 不在卡片的段列表里，于是卡上少 119,524 B。
删除确认框才是按文件夹说话的（它写「9 个文件」）。导出体积预估同样只算可解码的几路，所以卡片的数和导出页的数
是同一个口径，不打架。

## 2. A-B 循环（清单 13）

⋮ 面板「播放与列表」组加一行 `#loopABBtn`，循环的就是时间轴上已有的入点/出点 —— 不新增第二套标记，
所以循环的内容和条上画的必然一致。三个要点：

1. **没有区间不许开**：`toggleLoopAB()` 先看 `clipStartTime/clipEndTime`，无效就 toast 「还没有设定片段区间
   —— 先在时间轴上拖出入点与出点」并且不翻转状态。开关不吞掉一次无效点击，是告诉用户去哪儿设。
2. **不持久化**：和 R96 的「只看触发」同一处理 —— 只在人还看着这段的时候有意义，跨会话留着只会让人
   下次进来发现画面在原地打转。
3. **一次只跑一趟 seek**：`timeupdate` 约 4 次/秒，而后退 seek 落地比这慢。`loopABSeeking` 置位期间不再发
   新的；判据是 `getCurrentTime() >= b`，不是围绕 b 开一个窗口 —— 换段瞬间 `getCurrentTime()` 会短暂读到 0，
   用「到点或超过」判，一次假 0 只会跳过一拍，绝不会误发 seek。

装机实测（1.2.163 冷启）：27 s 内回到入点 3 次，最远只走到 `b+0.2`，`loopABSeeking` 收尾为 false；关掉之后
播放头越过出点。**AVD 的时钟速率这轮量出来了：4.45 s 内容 / 10.1 s 墙钟 = 0.44×，另一场只有 0.09×。**
所以判「循环有没有继续转」不能给死窗口：0.8 s 的区间在这个速率下本来就是 9~20 s 墙钟一趟。判据改成
「墙钟上限 60 s，攒够 3 次就提前收」，并把「关掉就放行」的测量改成先把播放头 seek 到出点前 0.15 s 再放手 ——
原来那条判据恰好接在一次回绕之后，量到的是重新爬 0.8 s，12 s 都没过点。

## 3. 删除撤销（清单 12）

### 3.1 为什么是「延迟真删」而不是回收站

文件系统上没有可依赖的回收站：手机内部存储能建 `.trash`，U盘（exFAT/OTG）未必允许，改名/搬运跨卷直接失败，
半路失败就留下用户看不懂的残骸。R96 之后这条 app 的原则已经写在文档里：没有可撤销的东西就别承诺撤销。
所以撤销只能是**承诺之前的反悔**：确认后卡片立刻消失、列表先剪掉，`nativeDeletePaths` 延后 6 s 才真的 unlink；
这 6 s 里点「撤销」= 取消 unlink、把卡片放回原槽；6 s 到点才真的删。

失败方向也是选过的：APP 在这 6 s 里被杀 → 文件还在，下次扫描卡片回来。宁可「以为删了其实没删」，
也不能「以为能撤销其实删了」。

引信在四个地方会提前烧掉，都是必须的：
① 又删第二条（一次只留一条撤销条）；② APP 退到后台（WebView 冻住定时器，不烧就变成「永远没删」）；
③ 用户点了刷新（刷新要读盘，一个「只是排队等删」的片段还会被扫回来）；④ 显式 flush。

R85 修过的「部分失败要说清哪些真走了」原样保留：flush 回来按 `deletedPaths` 复原，磁盘上还在的文件重新进列表，
`forgetDeletedEvent`（清收藏位/续播位）只在事件真的整体消失时才做。

### 3.2 撤销条必须落在拇指区：一个 CSS 结构根因

第一版把它当普通 toast 发出去，`showToast` 挂 `.toast-container`，横屏竖屏都量到**屏幕上方之外**
（`top=-58`），`bottom: 90px` 完全不生效。原因不在层叠，在包含块：

```
.toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); }
```

**带 `transform` 的祖先就是 `position: fixed` 后代的包含块。** 容器自身的盒高是 0（里面的 toast 都在流内，
只有一个例外时才算高），于是 `bottom: 90px` 是相对那个 0 高的盒算的：`72 + 0 - 90 = -18`，加 20px 的入场位移
= 屏幕上方外面。`ruleFound=true`、计算值也确实读到了 `bottom: 90px` —— 数对，位置全错。

改法不是加 `!important`，是换宿主：`showToast` 带 action 时把这条 toast 挂到 `<body>`（并自带 `role=status`，
离开容器就离开容器的 live region）。同一条 CSS 立刻落位：抽屉开着 gap 16 px，底条显影时靠 `78 + safe-bottom`
抬到 `bottom: 813`。

底条净空是量出来的，不是估的（412×915 竖屏，`--safe-bottom` = 24，底条实测占 823.5..881）：

| 抬升量 | 条下沿 | 底条上沿 | 净空 |
| --- | --- | --- | --- |
| `66 + 24` | 825 | 823.5 | **盖住 1.5 px** |
| `72 + 24` | 843（动画中读的） | 823.5 | 假象：把入场位移当成了布局 |
| `78 + 24` | 813 | 823.5 | +10.5 px ✅ |

横屏复量（915×412）：条宽 460 居中、`57×40` 的撤销键、`bottomGap=101.8` 对上 `barTop=320.7` ✅。

`transition: all .3s` 是这一节最大的验收陷阱：`transform` 参与动画，最后 20 px 是滑进来的。900 ms、
甚至 1800 ms 之后读到的仍可能是滑到位之前的值（实测两次把 813 读成 833/839，于是「净空 10.5」变成
「盖住 15.5」）。判据改成：轮询到 `computed transform` 的 y 分量归 0 再量，且每个状态用**新建的**一条 toast
（复用同一条会读到状态切换中间值）。

## 4. 导出页记住相机与分辨率（清单 14 的可做那半）

导出页的摆放、水印、隐私模糊早就跨重启了，唯独**勾了哪几路**和**分辨率**每次都要重选。加
`tdashcam.exportChoices`（`{cameras, size}`），`readExportChoices()` 在 `peSelection` 初始化时读，
两个 chip 处理器写。`size` 用 `PE_SIZE_PRESETS` 白名单校验（`'source' | '1080' | '720' | '480'`），
`cameras` 只接受字符串数组，脏数据/坏 JSON 一律回落默认 —— 三条都在装机判据里（写、读、两种垃圾）。

没做「按同样参数再导一次」：`tdashcam.exportHistory` 只存 `{path, bytes}`，重导要连整份导出计划
（区间、相机、分辨率、水印、马赛克、源事件）一起持久化，而源事件可能已经被删或在另一块盘上。
排队那半 R93 判过不做。真正让人烦的是每次重勾，那个修了。

## 5. 装回 fixture 时撞出来的签名缓存洞

`loadTauriDirectory` 有一个「扫描结果和上次一样就只 toast 一句没有变化、不重建列表」的指纹缓存
（`lastScanSignature`），设计动机是对的：手机上刷新一个没变的文件夹，重建会掀掉正在播的片段。
但**这个指纹只在扫描路径里写**，删除路径不写。于是：

1. 删除事件 → 内存列表 107，指纹还是开机那次 116 的；
2. 外部把删掉的文件夹推回去（我做 flush 验收后的复原）；
3. 刷新 → 扫描得 116，**和缓存指纹一致** → 判「没有变化」→ 拒绝重建，卡片永远回不来。

装机复现过一次，`nativeScanFiles()` 单独调是 116（含恢复的 9 个文件，带 size），`allFiles` 卡在 107，
`loadTauriDirectory()` 返回 `false`。这个洞在 R98 之前就在（老删除路径同样不写指纹），只是延迟删除
让它在验收里现了形。修法一行：`flushPendingDelete()` 里 unlink 之后 `this.lastScanSignature = null`
—— 磁盘真变了的那一刻才是该作废指纹的时刻。

## 6. 验收

装机 1.2.163（本轮功能面的判据都在这版量，1.2.164 只多 §5 那一行作废缓存）：

| 套件 | 结果 | 备注 |
| --- | --- | --- |
| `r98-verify.js` | **38 / 0** | 体积 4 条、A-B 10 条、撤销条 10 条、真删撤销 8 条、导出记忆 5 条 |
| `r98-flush.js` | **8 / 0** | 真 unlink：目标 9 条全走，`adb ls` 该文件夹剩 0 项；死 id 离开收藏与续播表 |
| `r98-menu.js` | 竖屏 **6 / 0**；横屏 5 / 1 | 唯一 fail 见 §7：横屏整片 `.control-btn` 都是 38 px |
| `r96-verify.js` | 29 / 0 | 逐帧判据改成先落到时长中点再按（原来在片尾按会读到钳位） |
| `r97-verify.js` | 20 / 0 | 面板展开判据改轮询 opacity=1（`.header-right.active` 会撒谎） |
| `r94-verify.js` / `r93-verify.js` | 18 / 0 · 30 / 0 | 换段取证与导出面 |
| `r85-verify3.js` / `r84-verify.js` | 全 `ok:true` | 时间轴与静态项 |
| `r83-verify.js` | 9 个布局全 `HUGS` | 触发标注/画面框 |
| `r88-ui.js` | **68 checks / 0 fail**，`frameState=painted` | 冷启跑；共享会话里它会误报 2 条（已知互相污染） |

截图：`devtools/r98-undo-bar.png`（抽屉开着，撤销条在底部）、`devtools/r98-undo-bar-visible.png`。

## 7. 留给下一轮 / 待拍板

1. **横屏 ⋮ 面板整片是 38 px**（`styles.css:5997` `height: 38px !important`，24 行一致）。那是上一轮写下的
   取舍，注释给了理由：竖排 5 行 40 px = 218 px，本机上限 229 px，留给矮一截的机型没有余量。R98 又加了
   一行，这个余量更紧了。抬到 40 要么减一行（横屏改 4 列？），要么接受更矮机型要滚。
   **这是尺寸/空间取舍，不该我在深夜批里替你定，等你一句话。** 本轮新增行跟着邻居走 38 px，不做例外。
2. **片尾那一帧按「下一帧」会退 0.2 s**（实测 6.29 s 的段在 6.29 处按下一帧 → 6.09）。钳位行为，
   不是 R98 引入的；R96 的逐帧判据原来正好会在片尾读到它，已把判据固定到中点，钳位本身留着。
3. `pePreviewOn` 被一次瞬时 `plan.error` 强制关掉（`script.js:20089`）—— R93 之后一直记着没动。
4. token 的 **snap 档位表**（R97 §4 普查）仍在等你定尺度。

## 8. §5 那一行在装机上的前后对照

同一串动作（flush 真删 → 外部把文件夹推回去 → 刷新）：

| 版本 | `loadTauriDirectory` 返回 | `allFiles` | 事件数 | 恢复的事件回来没 |
| --- | --- | --- | --- | --- |
| 1.2.163（未作废指纹） | `false` | 107 → 107 | 8 → 8 | ❌ |
| 1.2.164（flush 里置空） | `true` | 107 → **116** | 8 → **9** | ✅ |

1.2.164 上重跑：`r98-verify.js` **38 / 0**、`r98-flush.js` **8 / 0**（9 个目标真 unlink，装机 `ls` 该文件夹剩 0 项），
验收完把 fixture 原样推回（116 文件 / 9 事件）。顺带说一句：`r98-verify` 里那句
`if (!c.isPlaying) v.togglePlayPause()` 在 1.2.164 的第一场才第一次被执行到并炸出
`v.togglePlayPause is not a function`（正确的是 transport 上的 `c.togglePlayPause()`）——
判据里没被走过的分支就是没被验证过的分支，这条也记进假通过清单。

## 9. 本轮交付物

| 版本 | 字节 | md5 | sha256 | SO_MATCH | 内容 |
| --- | --- | --- | --- | --- | --- |
| 1.2.160 | 28,041,611 | `4009a65b41f9ab049083db0e82fa86da` | `a667179d…43910e6` | yes `5e22bce0…` | 体积行 + A-B + 撤销 + 导出记忆（撤销条仍挂在旧宿主） |
| 1.2.161 | 28,041,867 | `cd98df73d6a8781fb66a57f3343f8783` | `194937b1…d6e3577a` | yes `105db9d4…` | 撤销条改挂 `<body>` + `z-index` + 自带 live region |
| ~~1.2.162~~ | — | — | — | — | 只把抬升量 66→78，装机量到净空仍不足，被 1.2.163 取代、未交付 |
| 1.2.163 | 28,042,123 | `0737fc23c51dfb2d8cdc94c2c6ce6cb6` | `97ed11c9…b3f4fac93` | yes `aba6459b…` | 抬升 78 + 撤销复原去重/占位修正（本轮功能面判据在这版量） |
| **1.2.164** | **28,042,251** | **`9e5ca0ca9d55e27101bb9643ab8cbc34`** | **`c6cb1905…c29a63a9d`** | yes `e86d182674b3cd2c181a55fd0169745e` | + 删除后作废扫描指纹（§5）——**以此为准** |

1.2.140–1.2.163 全部保留在工程根目录，旧包由用户自行清理。

# R99（1.2.164 → 1.2.166）实机三条：⋮ 面板间距、横屏排版、切视角点不到

来源是小米 14 上的三句反馈 + 三张截图：

1. 竖屏下，设置卡片与底部菜单栏的间距有问题；
2. 横屏下，设置卡片的排版、显示不美观；
3. 竖屏下，播放控件的按钮太挤了，切换视屏的选项基本无法选择。

按「先排查问题」的规矩，三条都是先量到数、再动代码；改的全是 CSS，桌面面一行没碰（都在手机媒体查询里）。

## 1. 竖屏 ⋮ 面板与底部条的间距：`--safe-bottom` 被算了两次

`--action-h` 由 `startControlsReserve()`（`script.js:17369`）量出来，定义是
`bar 高 + (innerHeight - bar 底)` —— 也就是**底条从屏幕底边算起的整个占位**，手势条已经在里面（导出钉底那条规则底下本来就写着这件事）。
旧规则在它之上又加了一遍 `--safe-bottom`：

```
bottom: calc(var(--action-h) + var(--safe-bottom) + 12px);
```

于是「面板离底条多远」变成了一个由系统手势条高度决定的数：AVD 上量到 31.5px（inset 24）与 17.5px（另一个状态），换到真机 inset 不同又是另一个数 —— 用户看到的正是这个「说不上来但不对」的空隙。

改（`styles.css:5012`、`:5014`）：一个量出来的面 + 一个设计意图的间隙。

```
bottom:     calc(var(--action-h) + 12px);
max-height: calc(var(--viewport-h) - var(--action-h) - 40px - var(--safe-top));
```

`.card-context-menu`（长按卡片菜单，`styles.css:5082`）同样的双算，同样去掉，间隙 8px。

`--action-h` 在 `:root` 里有 60px 兜底（`styles.css:4867`），所以这条 `calc` 不会因为 JS 还没量过而失效。

验收读数：竖屏面板底 ↔ 底条顶 = **11.5px**（设计 12，dpr 2.625 取整），播放态与暂停态同一个读数；横屏同样 11.5px。

## 2. 横屏 ⋮ 面板：分组标题被写在「仅竖屏」里

`.menu-divider` 那三条规则（这一段录像 / 播放与列表 / 其他）原来在 `@media (orientation: portrait) …` 块里，理由是「横屏折成图标格子，标题没东西可领」。但横屏的行是**带标签**的（`justify-content: flex-start`、`.btn-text { display: block }`），标题一没，24 个带字行直接串组：「选择文件夹 / 刷新列表 / 复制诊断」和「触发标注 / A-B 循环」排进同一行 —— 截图上看着就是一份被打乱的清单。

改：把标题规则提到通用手机层（`styles.css:5041` 区），`grid-column: 1 / -1` 同时吃竖屏 2 列与横屏 N 列。

标题回来以后横屏放不下，于是用注入变体在活页上量（AVD 915×412，全部按新的高度上限算）：

| 变体 | 列数 | 单元格 | 内容高 | 容量 | 超出 | 被切行 |
| --- | --- | --- | --- | --- | --- | --- |
| 出厂（无标题） | 5 | 146 | 260 | 227 | 33 | 1 |
| 5 列 + 标题整行 | 5 | 146 | 351 | 251 | 100 | 9 |
| 6 列 + 标题整行 | 6 | 138 | 271 | 251 | 20 | 1 |
| **7 列 + 标题整行** | **7** | **118** | **228** | **228** | **0** | **0** |

顺带量出来一件事：出厂那版横屏本来就已经切掉一行（超出 33px），只是没人看见。

采用 7 列，并把列数交给宽度而不是写死：`repeat(auto-fill, minmax(112px, 1fr))`、宽度从 760 上限改成吃满 `100vw - 12px - 安全区`（`styles.css:6060`）。112px 是「18px 图标 + 六个中文字」量出来的下限，窄一点的横屏手机会退回 6 列而不是把标签切掉。

还有一条任何单元格都装不下：**语言行**。它写的是「要切去的那个语言」，所以两种界面下都是外语 —— zh 界面里 "Switch to English" 实宽 139px，而所有中文行最长 119px。栅格本来就有「某一行需要更宽」的机制（直选行 span 3），给它 span 2（`styles.css:6079`）。

## 3. 1.2.165 的省略号回归（截图才看出来）

装机以后判据 19/0 全绿，横屏截图上却有六行是 `连续播放：…`、`排序：新→…`、`亮度：跟系…`。

根因是判据问错了问题：`.btn-text` 是 `white-space: nowrap` 的 flex item，`scrollWidth > clientWidth` 在「差 0.7px」时读平 —— 而 `text-overflow: ellipsis` 不会切 0.7px，它把最后一个整字换成 `…`。7 列单元格 118px，图标 18 + 间隙 6 + 内边距 14 = 38，文字剩 74.2px，文案实宽 74.9px。

改（`styles.css:6092`）：横屏行内边距 7→5、间隙 6→4，**图标保持 18px**（先试过去缩图标到 16，但内边距就够，没必要让同一个图标随横竖屏变尺寸）。实测：0 条省略、0 滚动、0 半行。

判据也跟着换了量法：用 `Range` 量文字实宽，与盒子实宽（小数）比，容差 0.3px。

## 4. 竖屏播放控件：切视角只剩 41px 窗口

`#viewSwitcher` 和传输键同排，R96 又往那排里放了两对 stepper（共用槽位）之后，竖屏车道 392px 里只剩 **40.8px** 给这条带 —— 9 个 40px chip、`scrollWidth` 396，九个里八个点不到。

改：竖屏独占一行（`styles.css:4807` 的 `@media (orientation: portrait)` 嵌套块：`order: -1; flex: 1 1 100%`），`.controls-section` 允许 `flex-wrap`。横屏仍内联（那里车道 843px，装得下 391px 的带）。

自己的行也只有 392px，所以每一 px 都要花：9×40 = 360，布局/相机之间的分隔条 13（1px + 左右 margin 6），桌面档 `gap: 4` 下总宽 397 —— 还是会滚。改成 `gap: 1`、分隔条 margin 6→3、去掉左右 margin，合计 380，留 12px 余量；`overflow-x` 留着当 360px 机的阀门。

验收：

- 9 个 chip 逐个 `elementFromPoint`（中心点命中自己或自己的子节点）；
- 每个 chip 40×40；
- 传输行第二排（`controls-left` 211 + `controls-right` 120）不溢出车道，全屏 / 剪辑 / 倍速 的右边缘都在屏内；
- `--controls-h` 跟着变成 150px（两行），画面高度 751px 没被第二行吃掉。

真手指复核（`input tap`，物理像素 = CSS × 2.625）：点第 9 个 chip「右柱」，视图从 4宫格 切到 右柱 ✓。

## 5. 这一轮量具踩到的四个坑

1. `getComputedStyle().getPropertyValue('gridTemplateColumns')` 用**驼峰名返回空串** → 「0 列 × NaNpx」是量具坏了，不是布局坏了。自定义属性才用 `getPropertyValue('--x')`。
2. `scrollWidth > clientWidth` 量不到「父层裁字」（§3）。
3. 控件行收起时是 `opacity: 0; pointer-events: none`，`elementFromPoint` 直接落到 `.player-area` → 9 个 chip 全报「点不到」。判可达性之前必须先轮询到那一行真的在显示（`opacity === 1`），sleep 400ms 不够：`.show` 有 300ms 淡入，旋转还会重新收起。
4. `MSYS_NO_PATHCONV=1` 下给 `adb install` 传 `/c/Users/...` 路径会 `failed to stat`，但脚本继续跑 —— 于是量的是**没被替换掉的旧版本**（那次报出 19 条失败，全是 1.2.164 的数）。装机之后必须回读 `dumpsys package … versionName` 再开量，判据脚本已经把这个闸门写进去了。

## 6. 回归

| 套件 | 结果 | 说明 |
| --- | --- | --- |
| r93-verify | 30 / 0 | |
| r94-verify | 18 / 0 | |
| r96-verify | 29 / 0 | 一条判据被 R98 的「记住分辨率」变成顺序相关：起始已经是 480 时「换档应变小」必然读平（`937500 -> 937500`）。已改成先钉 `source` 再比。体积本身对预设是有反应的：480→0.94MB、720→1.94MB、source→2.80MB |
| r97-verify | 20 / 0 | |
| r98-verify | 38 / 0 | |
| r99-verify（竖屏） | 31 / 0 | 本轮新写 |
| r99-verify-landscape（横屏） | 19 / 0 | 本轮新写 |
| r88-ui | 60 / 68 | 8 条全在导出页内部量到 0；根因是 `painted()` 预算内没等到 `.show`（AVD 1 分钟负载均值 4.85～5.96，期间还 ANR 一次：`am_anr … Input dispatching timed out … user request after error`）。轮询等到 `.show` 以后同一批面重量出：导航条 44px、返回 55×40、开始导出 83×40、预览带 412×89 且 `dock.bottom == panelBottom`、`dock.top == body.bottom`。**判为量具/环境，不是本轮回归**；`painted()` 预算留待下轮加宽 |

## 7. 留给下一轮 / 待拍板

1. **横屏行高还是 38px**（R97 把别处统一到 40，横屏是记档的例外）。现在 7 列下面板内容 228、容量 251，有 23px 余量，抬到 40 只要 8px，本机放得下；但更窄的横屏机会退回 6 列（内容 271），40 就装不下了。抬不抬，等拍板。
2. 面板三种行的左内缩不一致：标题 4px、按钮 5px、直选 7px（R99 之前就是这样，本轮没动）。
3. 段尾「下一帧」仍会钳成 −0.2s（`r96-verify` 记着）。
4. `pePreviewOn` 会被一次瞬时 `plan.error` 永久关掉（`script.js:20089` 附近）。
5. R97 §4 的 token snap 档位表。

## 8. 本轮交付物

| 版本 | 字节 | md5 | sha256 | SO_MATCH | 内容 |
| --- | --- | --- | --- | --- | --- |
| 1.2.165 | 28,043,723 | `7d71c54d6d2d98b4a85cbcaf94b2d46d` | `04d7ef1c…3a0394d0` | yes `edc528a6ffcd4ac57a5c5d13597d944f` | 三条修复第一版；**横屏 7 列把六行标签挤成省略号**（§3），被 1.2.166 取代 |
| **1.2.166** | **28,043,915** | **`88607a878e1aa9e830e406ca72542c18`** | **`d56ff7e6dcf64670ac9d0623f06ab8565d5de7ef77db2f625bd148efaa35d27c`** | yes `d3d0d4f3178caa856dac6bce70b4a23b` | + 横屏行内边距 7→5 / 间隙 6→4，0 省略 0 滚动 ——**以此为准** |

截图（`devtools/`）：`r99-portrait-panel.png`、`r99-portrait-controls.png`、`r99-landscape-panel.png`、`r99-landscape-controls.png`。
1.2.140–1.2.165 全部保留在工程根目录，旧包由用户自行清理。

---

# R100（1.2.166 → 1.2.167）实机两条：横屏 ⋮ 面板右列不对齐、剪辑态行车数据压住画面

来源还是小米 14 的截图 + 两条描述：横屏「手势说明」的图标没和上面几行对齐（用户直接给了方案：和「切换英文」调换位置）；剪辑状态下 HUD 卡片压住单路与大小窗的画面（用户建议画面整体上移）。

## 1. 横屏 ⋮ 面板：手势说明掉进了上面两行留空的第 7 列

R99 把面板改成 7 列以后，上面两行各只有 6 项（第 7 列空着），而语言行 `span 2` 占了 5–6 列，于是「其他」组最后一项 **手势说明被挤到第 7 列** —— 它的图标和上面的 下载视频 / 触发标注 差一整列。

按用户提的方案把两行在 DOM 里调换（`index.html`：`gestureHelpBtn` 挪到 `langToggleBtn` 之前）：

| 项 | 调换前 | 调换后 |
| --- | --- | --- |
| 手势说明 | 第 7 列（x=661 之后） | **第 5 列 x=541** = 下载视频 / 触发标注 |
| 语言行（span 2） | 第 5–6 列 | **第 6–7 列 x=661..899** = 抓帧 / A-B 循环起 |

语言行是桌面也有的行，但「手势说明」是 `phone-only-btn`（桌面隐藏），所以调换对桌面不可见。

## 2. 剪辑态 HUD 压画面：抬升本身就是元凶

先量（AVD 竖屏 412×915，剪辑态，按**实际绘制的画面**而不是格子算 —— R83 的口径）：

| 视图 | 卡片位置 | 画面 | 被压 |
| --- | --- | --- | --- |
| 单路 | 545.3–605 | 326.9–593.9（267 高） | **48.6px = 18%** |
| 大小窗·右格 | 545.3–605 | 490.8–600.6（110 高） | **55.3px = 50%** |
| 六宫格 / 四宫格 | 545.3–605 | 格子到 544.0 | 0 |
| 非剪辑态对照 | 584.3–644 | — | 9.6px / 16.6px |

根因不是「没给剪辑让位」，而是**让得太多**：`body.clip-trimming .metadata-panel { bottom: calc(--meta-bottom + --filmstrip-h) }` 把卡片整块抬高了胶片条的高度（39px），正好抬进画面里。而卡片与胶片条原本只重叠 4px —— 用 48px 的画面遮挡去换 4px 的贴边，净亏。

改法（用户选「画面底部让一条」）：

1. **卡片只多让 6px**（`bottom: calc(var(--meta-bottom) + 6px)`）—— 刚好不压胶片条（实测卡片底 638.0、条顶 644.0）。
2. **画面让出卡片自己的高度**，而且只让真正够到那条的两个视图：
   - 单路：格子是 `position:absolute; inset:0; height:100%`，padding 碰不到它，必须收它的底边
     `bottom: calc(var(--hud-h) + 8px); height:auto`；画面是宽限制，于是**只上移 34px、尺寸不变**（267 → 267）。
   - 大小窗：它本来就 `padding-bottom: calc(--controls-h + 8px)` 预留了控件条，所以是**在那条之上加** `--hud-h + 8px`，不是替换。
   - 六宫格 / 四宫格：一行都没让（实测格高 110 与基线逐格相等）。
3. `--hud-h` 由 JS 量出来发布：`startControlsReserve()` 里把 `.metadata-panel` 也挂进同一个 ResizeObserver
   （折叠/展开都会重报）。顺手改掉一句已经不成立的老注释 —— 它写着「16:9 画面在手机上够不到区域底边」，实测单路差 48.6px。

第一次注入验证时我按 `padding-bottom` 一把梭，结果单路毫无反应（abspos 不吃 padding）、大小窗反而从 55.3 恶化到 59.8（把原有的 182px 预留换成了 114px）—— 注入实测在装机前就把这个错误抓出来了。

## 3. 验收（1.2.167 装机）

| 套件 | 结果 |
| --- | --- |
| `r100-verify.js` 竖屏剪辑态 | **14 / 0** |
| `r100-verify-landscape.js` 横屏列对齐 | **9 / 0**（手势说明 x=541 与 下载视频/触发标注 同列；语言行 661..899 与 抓帧/A-B 同列起） |
| `r99-verify.js` / 横屏 | 31 / 0 |
| `r93` / `r94` / `r96` / `r97` / `r98` | 30/0 · 18/0 · 29/0 · 20/0 · 38/0 |

判据全部改成**与同一会话里非剪辑态的基线比**，不再写死像素：第一版把「退出剪辑后应回到 326.9」写成了常量，而 `--controls-h` 在退出剪辑后会变小（控件条少了一行），卡片落点跟着变，于是报了 2 条假失败。

截图：`r100-single-trimming.png`、`r100-legacy-trimming.png`、`r100-landscape-panel.png`。

## 4. 留给下一轮

1. **非剪辑态单路仍有 9.6px 遮挡**（卡片底边压在画面下沿 3.6%）。本轮只按用户说的「剪辑状态下」处理；要不要常态也留这条，等拍板。
2. 底部中段 tab 在从画面里的视图 chip 切到单路时仍显示上一个布局名（截图里画面是前视单路、tab 写「4 宫格」）—— 观察记录，未改。
3. R99 §7 那五条（横屏 38px 档位、行左内缩 4/5/7、段尾下一帧 −0.2s、`pePreviewOn` 被瞬时 plan error 关掉、token snap 表）原样在等。

## 5. 交付物

| 版本 | 字节 | md5 | sha256 | SO_MATCH | 内容 |
| --- | --- | --- | --- | --- | --- |
| **1.2.167** | **28,045,515** | `e0d09256ee4c95d48505d87d4028aec9` | `8d13ea82b9d9f24121a034ac149a8e7dc2d1cce134e11de378396ea46fb1ac60` | yes `ef1fd04f56d72e50a6695269d4337f98` | 横屏 手势说明/语言行换位 + 剪辑态卡片只让 6px + 单路/大小窗按 `--hud-h` 让位 ——**以此为准** |

1.2.140–1.2.166 全部保留在工程根目录。

# R101（1.2.167 → 1.2.168）

用户拍板：「那就把 1.2.3.5 这几个做了，另外也加上诊断需要采集的相关数据的功能。」对应 R100 §7 与上一轮清单里的第 1、2、3、5 条，加一条诊断取证。液态玻璃另开一轮（先出效果图）。

## 1. 底部「布局」tab 说的是画面，不是偏好（第 1 条）

根因是**读错了源**：`updateLayoutTabLabel()` 读 `localStorage['tdashcam.layout']`（持久化偏好），而画面上的视角 chips 走 `switchCamera()` 的单路分支时**故意不写**这个键 —— 单路是临时态，下一个事件未必有六路（`script.js:14424` 的注释就是这么写的）。R58 当时立的规矩是「每个写这个键的人都要重画一次」，于是所有**不写键**的改布局路径全被漏掉：视角 chips 进单路、`zoomCamera()` 放大与还原两个方向、解码器降级悄悄改宫格。四处，一处不剩地全漏。

改法不是补四个调用，而是把重画挂到**唯一入口** `MultiCameraPlayer.setLayout()` 上 —— 那四条路径没有一个能绕过它。判据本身也跟着从「枚举每个布局名」换成一条不变式：**tab 说的就是画面上那个布局**，用 `layoutMode` 现算，无事件时才回落到偏好（列表页没有画面，那句文案是「按下去会变到哪一档」的预告）。新增 i18n 键 `layoutSingle`（单路 / Single feed）。

## 2. 一次算不出计划，不该永久没收用户的预览开关（第 2 条）

`renderPhoneExportLayout()` 的 `!live` 分支里写着 `this.pePreviewOn = false`。拖动区间手柄把出点拖到过入点前面的那一拍，计划算不出来，于是**用户自己按下的那个开关被程序改掉了**，恢复以后也不会自己回来。R96 就撞见过一次，当时判为「读 UI 开关的判据要跑在干净实例上」——那是把量具的问题记下来了，没把病根记下来。

现在 `!live` 只藏这一拍要藏的东西，开关一个字节都不碰；计划重新可编时先 `renderPreviewDock()` 按开关刷回来。另加 `pePlanIssue`（`plan-error` / `job-running` / `no-camera`）说清是哪一种，别再静默。

## 3. 让位扩到常态（第 3 条）

R100 只在 `body.clip-trimming` 下让位。实测**不剪辑时同样压**：卡片 584.3..644，单路画面下沿 593.9（压 9.6px），大小窗底行下沿 600.7（压 16.3px）。同一条杠杆去掉剪辑态门槛即可，六宫格（格子到 544）与四宫格照旧一律不让。

两个坑：① 去掉 `body.clip-trimming` 前缀会掉一级选择器权重，`styles.css:3346` 与 `:6573` 那两条基础规则同为 `!important` 时**按文档顺序后来者胜**，所以改用 `body` 前缀把类型选择器补回去，而不是把整块搬到文件末尾；② 单路画面是**宽度受限**的，收它的底边只会让它整体上移 30px、尺寸不变 —— 判据要同时看「没被压」和「没变小」。

机制本身改成直接证明：把 `--hud-h` 抽掉，画面从 top=292.9 沉回 322.9；装回去又抬起来。不再靠「进剪辑态时它动了没有」这种会被本轮改动作废的间接信号。

## 4. 段尾「下一帧」倒退 + 面板行左内缩（第 5 条）

`stepBySeconds()` 的起点取的是 `seekBaseTime()` —— 一个**声称**（在途 seek 的目标），不是画面真实位置。片尾那一拍声称值可以越过事件总长，于是 `target = min(total, claim+0.1)` 比 claim 还小，「向前一帧」把画面**往回**带了 R98 量到的那 0.2s。修法是给起点套上 `[0, total]`，让这一步不可能从不可能的位置出发。真机能不能构造出段尾仍然未知（AVD 六路片长只差 48ms），所以这一条**改成有账可查**而不是有图可看：`stepLedger` 记 `moves / claimPastEnd / worstOver / back`，`back` 只在位移与请求严格反向时计数（在边缘被钳住不动不算）。

面板三种行的左内缩（标题 4 / 按钮 5 / 直选 7）收进一个 `--menu-inset`：竖屏 7px（标题原来比行文字缩进 3px），横屏 5px（R99 为了不停截断从 7 换来的那 2px 不能还回去）。横屏复量：0 条省略号、0 滚动、24 行可点、0 半行被切。

## 5. 诊断采集（新提的那条）

`describePhoneGeometry()` 四行进「复制诊断」，只出维度/布尔/计数：

```
layout live=single stored=grid4 caption=单路 showing=event
exportPreview on=1 issue=-
geom hud=60px controls=174px strip=39px cardLive=1 cardOverPicture=0.0px
step moves=8 claimPastEnd=0 worst=0.00s back=0
```

第一行就是第 1 条的**故障签名本身**（live ≠ stored ≠ caption 三者是否一致），第三行是遮挡的像素读数，第四行是段尾倒退的账。验收里有一条专门守着隐私红线：这四行不得含 token / URL / 绝对路径。

## 6. 量具今天自己骗人的四次

| 现象 | 真相 |
| --- | --- |
| 重跑 r100 报 4 条「卡片压画面」 | 实例停在 `TeslaCam/RecentClips` 伪事件，它的前视片是 **1080x2400 竖画面**，铺满整个播放区 —— 任何「让一条」都救不了，读数与代码无关。冷启动后回到真事件才复量 |
| 注入实测四视图全报「无遮挡」 | 探针的 `painted()` 只回 top/bottom/h/w，**没回 left/right** → 宽度判据 `Math.min(c.right, undefined)` = NaN，`NaN > 0` 为假 → 每条都判「无遮挡」的空过 |
| 同上 | 遥测未到（R93 的迟到）时卡片没有 `has-data`，压不压无从谈起 → 判据必须先证明卡片是活的 |
| 新写的「抽掉 --hud-h 画面会沉」第一次不成立 | `visit()` 停在四宫格，那里**本来就没有预留**，量的是四宫格的前视格。改判据前先确认量的是那个视图 |

## 7. 验收

- `devtools/r101-verify.js` 竖屏 **43/0**（含四条基准自证：控件行可见、真事件、画面横向、卡片有数据）
- `devtools/r101-verify-landscape.js` 横屏 **10/0**（真旋转后复量）
- 回归全绿：r99 31/0、r100 **14/0**（其中一条判据按 §3 重写，理由写在代码里）、r93 30/0、r94 18/0、r96 29/0、r97 20/0、r98 38/0
- 截图目视三张：`r101-single-nontrim.png`（底栏写「单路」而画面正是前视单路、卡片与画面之间是空的）、`r101-portrait-panel.png`（三种行同一左缘）、`r101-landscape.png`

## 8. 还欠着的

1. 横屏 ⋮ 面板行高 38px 要不要抬到 40 —— 抬得起（7 列有 23px 余量），但更窄的横屏机退回 6 列就放不下，本机量不到那台机器。
2. 段尾倒退的**真机**证据：AVD 构造不出段尾，`step` 那行账要等一次真机复制诊断来定案（要么 `claimPastEnd>0` 证明成因，要么一直 0 说明还有别的成因）。
3. R97 §4 token snap 档位表、`r88-ui` 的 `painted()` 预算。

## 9. 交付物

| 版本 | 字节 | md5 | sha256 | SO_MATCH | 内容 |
| --- | --- | --- | --- | --- | --- |
| **1.2.168** | **28,047,883** | `b2d3bbba3b29e7e7953477c37e8415f9` | `fa48edf2ba8bdd12db7f2aaea113266971d049e3b288d99b470b78c08e378271` | yes `baba527fc8e666ec29549d92656a08db` | tab 跟随画面 + 预览开关不再被没收 + 让位扩到常态 + 段尾起点钳制与台账 + 面板行内缩收进 `--menu-inset` + 诊断四行取证 ——**以此为准** |

1.2.140–1.2.167 全部保留在工程根目录。

# R102（1.2.168 → 1.2.170）液态玻璃 C 档 + 小米 14 专项

用户原话：「直接做C方案的液态玻璃效果，然后到时再优化，诊断里面加上相应的数据监测。横版的设置面板的高度就先不动了。做好了要测试并排查bug，要针对我的小米14手机优化。」

## 1. 这一轮真正学到的：折射上不上屏，只能拿像素说话

`CSS.supports('backdrop-filter','url(#tesseraLens) blur(6px)')` 返回 true 只证明解析器认这个引用。判「有没有真的弯折后景」只有两条路，本轮两条都走了：

| 量法 | 结果 | 结论 |
| --- | --- | --- |
| CDP `Page.captureScreenshot` + 玻璃板压在硬边缘棋盘格上，逐变体截图比像素 | 只加 blur vs blur+url()：**内圈 mean 0.019 / 0% 像素变化，贴玻璃内侧一圈 mean 13.2 / 75% 变化** | url() 真的上屏，而且形状正是 C 档要的「中间毛玻璃、边缘起透镜」 |
| `adb exec-out screencap` + 六宫格暂停真帧 | blur vs 无滤镜 内圈 mean 10.31 / 41%；lens vs blur 内圈 mean 2.34 / 2.65% | **后景滤镜读得到视频平面**（不是只糊黑底），折射在真视频上同样上屏，只是被 .72 的底色压得很含蓄 |

关键的一条基础设施事实：**CDP 截图里没有视频平面**（暂停帧整块纯黑，DOM 覆盖层照常出现），所以「玻璃后面有没有东西可弯」这种问题在 CDP 里永远量不出来；`adb screencap` 反而两样都有。本轮前半段被这一点骗了两次（见 §5）。

## 2. 试过并且不采用的两条

- **伪元素环带自己带 `backdrop-filter`**（想做「只有边缘一圈折射」）：`#plate::before` 用 mask 挖成环，加后景滤镜 —— 与不加时**逐像素全等**，这台 WebView 不给伪元素上后景滤镜。放弃。
- **`feImage` 喂一张圆角矩形高度场**（想要形状驱动的透镜）：边圈 mean 18.8，比现方案强一点，但内圈同样被推动，看不出更「贴边」，而且场要按每个元素尺寸生成 + 跟 resize。收益不值这套复杂度，放弃。

## 3. 底色 alpha 是解出来的，不是选的

拿真帧最亮像素当背景、按 alpha 合成后与文字色比（`devtools/r102-alpha-solve.js`，最坏帧 255,255,255）：

| 表面 | 原 alpha | 原对比度 | 过 AA 的最小 alpha | 本轮采用 |
| --- | --- | --- | --- | --- |
| 深色·底部条 | .55 | 3.20 | .66 | **.72** |
| 深色·⋮ 面板 | .55 | 3.05 | .68 | **.72** |
| 深色·行车数据卡片 | .55 | 4.33 | .57 | **.62** |
| 浅色·底部条 | .72 | 5.60 | .65 | .72（不动） |
| 浅色·⋮ 面板 | .72 | 8.38 | .52 | .72（不动） |

采用值复量（1.2.170 实机）：深色 5.58 / 5.32 / 5.53，浅色 5.60 / 8.38 / 5.53 —— 全部过 AA 且留有余量。代价写在 §7：玻璃更「牛乳」，折射因此不明显。

## 4. 无障碍退场写成 CSS 的保证

验收里手工加 `solid-material` 复现出「半套材质」：后景滤镜被那份名单关了，底色却还留着 55% 的透镜填充。所以这一档每条选择器都带 `:not(.solid-material)`，开关一开整条不匹配，与 JS 先后无关。复验：深色实心 `rgb(30, 32, 40)`、滤镜 `none`，关掉后材质回得来。

## 5. 本轮的自欺清单

| 现象 | 真相 |
| --- | --- |
| 第一次量出「url() 与只 blur 完全一样」 | 一次崩溃的探针把上一块玻璃板留在页面上，`getElementById` 拿的是**旧节点**，样式打在旧板上、截图框量在新板上 —— 每个数都真，但描述的不是同一个东西 |
| 「shipped 与 blur 全等 ⇒ 滤镜没上屏」的判读文案 | 写判读时按的是「均匀平移」这一种可能，而棋盘格实验证明它既不是全等也不是平移 —— 结论要重做 |
| 注入脚本报 `ReferenceError: filter is not defined` | 模板字符串里写了裸标识符 `filter` 而不是 `${JSON.stringify(filter)}`；这类异常还会被 APP 自己的错误账本记一笔（R93 老坑） |
| 同样的错第二次：Node 端 `SyntaxError: Unexpected identifier` | 页面脚本的**注释里写了反引号**，把外层模板字符串截断了 |
| `user_rotation 1` 之后套件仍报「这台现在是横屏」失败 | `accelerometer_rotation` 被恢复成 1，系统按传感器把方向改回竖屏；旋转前必须先 `put system accelerometer_rotation 0`，且 APP 重启后可能再被翻回去 |
| 横屏套件在竖屏状态下多报 4 条 | R93 老坑复现：校准在另一朝向的判据不能跨朝向跑 |
| 对比度判据报 14.61:1 全绿 | 那一帧解码器没交纹理，「帧最亮」是 0,0,0 —— 纯黑底上任何半透明深色都轻松过 AA。改成：最亮处亮度 < 40 时明确记「跳过，改看 alpha-solve」 |
| 撤销按钮报 57x40 却判「不足 40dp」 | 盒子按设备像素对齐，dpr 2.475 下量到 39.96；判据改成 `>= 40 - 0.5/dpr`，并把原始小数打出来 |
| 深色主题底部条「设置」算出 1.64:1 | 探针把药丸合成到**白色**上，深色主题该合成到玻璃本身；实算 6.3:1，不是缺陷 |
| 一个套件里连续两条 FAIL 之后又自己好了 | 前一个套件把 ⋮ 面板留在打开状态，本套件的「每秒补一次点击」第一下是**关**它。开量前先确认是否需要先关 |

## 6. 小米 14 专项

小米 14 = 1200x2670 @ 460ppi，HyperOS 默认密度 → CSS 视口 **437x970 / dpr 2.475**；「显示大小」调到最小是 **400x889 / dpr 2.7**。用 `wm density 396 / 432` 把 AVD 配成这两档（物理面板改不动，能改的是 CSS 视口）。

| 项 | CSS 437（默认） | CSS 400（最坏） |
| --- | --- | --- |
| ⋮ 面板 | 2 列 176.2px，行 40/44，分隔 20，内缩 7/7 一致 | 同结构，无截断 |
| 底部条 | 3 tab 各 131.2x46，标签墨宽=盒宽 | 118.8x46，同样不截 |
| 控件行 | 417 宽，scroll=client，无横向溢出 | 380 宽，同样不溢 |
| 九宫格 chips | 40x40 全可点 | 40x40 |
| 省略号普查（Range 实宽） | 0 条 | 0 条 |

结论：**这一档宽度没有把任何排版压坏**，本轮在小米度量上唯一的真缺陷是量出来的一个触摸目标：

- `#headerEventName`（汉堡下线后抽屉的唯一入口）是个 `<button>`，画成标题，`min-height: 34px` —— R97 那轮抬目标尺寸的普查没扫到它（它不在当时的选择器名单里）。抬到 40 会把 `.main-header` 从 95.7 顶到 101.7（实测），所以用 `min-height:40 + margin-top/bottom:-3` 让它长进那 6px 行距里：同一密度 A/B 实测 header 与下一个元素的 top **delta 0.0**，盒子 57..97，`elementFromPoint` 在 54/92 都命中按钮，上下相邻区域没被抢。`overflow:hidden` 让 R97 惯用的 `::after` 扩靶法在这个元素上不可用（伪元素会被裁掉）。
- 诊断里的掉帧阈值原来写死 33.4ms（= 60Hz 两帧）。小米 14 是 1–120Hz LTPO，同一句话在 120Hz 上等于「四帧才算卡」。改成以本机最快帧距（p05）为基准、超过两倍才算 jank，并把 `hz≈` 一起打出来，两栏样本才可比。

## 7. 还欠着的

1. **自适应 alpha**：.72 是为「亮帧上仍过 AA」付的代价，典型夜间画面因此被糊得太实。下一步该按当前帧亮度在 .55↔.72 之间插值，让折射在暗画面上看得出来 —— 需要真机目视来定斜率。
2. 折射在真视频上「看没看出来」只能由用户判断：AVD 的解码帧与真机不同，且 screencap 里那条边圈只有 2~3% 的像素变化。
3. 横屏 ⋮ 面板行高（用户明确说先不动）：短屏档 38 / 一般档 44，本轮把这条写成判据防止以后被顺手改掉。
4. R97 §4 token snap 档位表、段尾倒退的真机台账。

## 8. 验收

- `r102-verify.js` 竖屏（CSS 437）**25/0**、最坏档（CSS 400）**25/0**；`r102-verify-landscape.js` 横屏（970x437）**17/0**
- 这一轮的 AA 判据是**带着真帧过的**：`帧最亮=161,169,189` 时底部条 7.75:1（不是黑帧上那种 14.61 的假绿）
- 回归在小米度量上全绿：r101 **43/0**、r99 0 fail、r100 **14/0**、r93 **30/0**、r97 **20/0**、r98 **38/0**
- alpha 复量：深色 5.58 / 5.32 / 5.53，浅色 5.60 / 8.38 / 5.53（全部 ≥4.5）
- 目视截图（`adb screencap`，含视频平面）：`r102-437-port-light.png`（⋮ 面板浮在画面上，浅色）、`r102-437-port-dark.png`（六宫格 + HUD 玻璃）、`r102-vidcrop-{plain,blur,lens}.png`（同一帧三种材质对照）
- 新量具留在仓库里：`png-diff.mjs`（零依赖 PNG 解码 + 区域差分）、`png-crop.mjs`（解码 + 写 PNG，用来 1:1 看局部）、`png-shift.mjs`（一次整体平移能解释多少差值）、`r102-lens-ab.mjs`（DOM 后景 A/B）、`r102-lens-video.mjs`（真视频 A/B）、`r102-xiaomi-measure.js`（按当前视口出一张度量表）

## 9. 交付物

| 版本 | 字节 | md5 | sha256 | SO_MATCH | 内容 |
| --- | --- | --- | --- | --- | --- |
| 1.2.169 | 28,050,763 | — | — | — | 中途验证包（.55 底色对比度不足），未放根目录 |
| **1.2.170** | **28,052,687** | `f1a13cfc8f0b3c49a8011a6c8867d88b` | `b0e1a7cc9db37e336c0c9c779aa1f200d164981cf5deaa42b294dbb9ae9e22db` | yes `f88c983ab299c93c83241a9d4718bbf9` | 液态玻璃 C 档（折射 + 解出的 alpha + 无障碍退场写进 CSS）+ 诊断新增玻璃两行与按本机帧距算 jank 的成本采样 + 小米 14 两档度量复量 + `#headerEventName` 抬到 40px —— **以此为准** |

1.2.140–1.2.168 全部保留在工程根目录。

# R103（1.2.170 → 1.2.174）真机反馈两条：底部多余的线 + 玻璃效果不明显

用户原话：「液态玻璃效果不明显。APP首页中间位置找片的卡片、底部菜单栏、设置的卡片，底部有多余的线条重合，排查一下，看看其他地方还有没有，一起处理。」附两张小米 14 实机截图 + 一份真机复制诊断。

## 1. 那条线是什么

不是描边画了两遍，是**两条不同的线并排**：玻璃面本来就有一圈 `border: 1px solid var(--glass-edge)`，R102 又叠了一条 `inset 0 -1px 0 var(--lens-deep)` 的暗色内阴影。上沿看不出来是因为边框和高光同色（都是白），合成一条；下沿一条白一条黑，dpr 3 上就是两条 0.7px 的线。

computed style 与 3x 截图都证实（`devtools/shots/r103-hero-fixed-bottom.png` 是修完的样子，只剩一条）。

**修法**：把下沿的暗色改成边框本身 —— `border-bottom-color: var(--lens-deep)`，一条边一个颜色，深度感保留，重复线消失。

**普查「其他地方还有没有」**：`inset 0 -1px` 全文件只出现在我这两条规则里（覆盖 5 个玻璃面：底部条 / ⋮ 面板 / 长按菜单 / 找片 hero / 行车数据卡片），与用户点的三处一致。其余 inset 阴影不是重复线：`.dir-volume-chip.has-clips` 是同色绿环（故意的强调），`.progress-bar` 是 8px 凹槽里的 `inset 0 1px 2px`（凹面高光，没有下边框）。判据已进验收：任何挂了透镜的面，**不允许同时**有下边框和一条向下偏移的 inset 阴影 —— 读 computed style，不读代码。

## 2. 效果不明显：常数 alpha 是根因

R102 的 .72 是**为最坏帧付的账**（车库顶灯打白墙 = 255 底色），代价是每一帧都付。而且不能简单调小：同一个方向在两个主题里是反的 —— 深色玻璃怕亮底，白色玻璃怕暗底（真机诊断证实：浅色主题 + 暗底时求解器要 .92 才够 AA）。

所以 R103 改成**每帧解一次**：

1. 每个可见格子缩到 24×14，取 **p99** 亮度，多路取最坏（均值会把一块远处天光摊平，max 会被单像素噪点绑架成永远不透明）；
2. 在该面实际底色上二分求「对当前实测底仍然过 AA 4.5:1 的最小 alpha」；
3. 墨色不再手挑三种 —— 扫三个玻璃面上**所有有字的可见叶子节点**取颜色集合。这条是被自己抓出来的漏洞：⋮ 面板的分组标题（「这一段录像」）比行标签暗得多，只按行标签解会把最该保护的文字留在门槛下；
4. 两端夹住 [.45, .92]：低于 .45 只剩一层模糊、不再读起来像玻璃；高于 .92 已是实心卡片，那种情况该由系统「减弱透明度」的实心档表达。
5. 每拍只走差值的 1/3，换场景是渐变不是跳变；<0.01 的抖动忽略。采不到纹理时摘掉变量，回落到 CSS 写死的 .72（宁可厚）。

## 3. 折射力度：扫参数，不猜

`devtools/r103-lens-sweep.mjs`（棋盘格 + 只 blur 的基线，逐档截图比差值）：

| scale / std | 边圈 mean | 内圈 mean |
| --- | --- | --- |
| -20 / 11（R102） | 11.8 | 0 |
| -30 / 11 | 15.4 | 0 |
| **-45 / 11** | **18.9** | **0.05** |
| -30 / 16 | 15.4 | 0 |
| -45 / 16 | 18.9 | 0.05 |
| -60 / 20 | 20.6 | 0.31 |
| -45 / 24 | 18.9 | 0.05 |

两条结论：**-45 取用**（边圈比 R102 强 60%，中间仍然不动）；**`stdDeviation` 是空旋钮** —— 同 scale 下 11/16/24 读数逐位相同，环带宽度由滤镜区域边界决定，不由这张虚化场决定（下次谁再调 std 可以直接省掉）。-60 开始把中间抹糊（内圈 0.31），不要。

## 4. 真机诊断读到的新事实（1.2.170，小米 14 / Android 16 / 23127PN0CC）

- `viewport=400x890 dpr=3` —— **小米 14 默认就是 CSS 400 宽**（HyperOS 密度 480），不是 R102 假设的 436；437 那一档反而是「显示大小」调大才有。所以 R102 的「最坏档」其实就是他的日常档，那一档的复量结果（无截断、无溢出）现在是有用的主证据。
- `glassCost lens[p50=8.3 p95=16.6 jank=8] flat[p50=8.3 p95=8.4 jank=6] delta_p50=0.0ms delta_p95=8.2ms hz≈122/122` —— 六路在播、120Hz 上，透镜的代价是 **p50 无损、p95 多一帧**，jank 只多 2 次。这是「这套材质值不值」的实测依据，也是它第一次在真机上跑到 120Hz（R102 的 jank 阈值写死 60Hz 两帧，正是那轮改掉的）。
- `boot ready=214 list=416:1 open=17227 play=17562 | fp=184 fcp=184` —— 冷启动 214ms 就绪，真机首帧链路正常。
- `holds` 六路 `rs=4 pf=4`、`gate=ready 6/6`、`lost total` 每路 ≤0.56s —— 换段闸门在真机上仍然按 R79/R95 的设计走。

## 5. 「效果不明显」真正的头号成因：玻璃背后根本没有画面

改完 alpha 之后去量「五个玻璃面各自压了多少画面」，结论是**一条都没有**：

| 视图 | 底部条 | 行车数据卡片 | 压到画面的比例 |
| --- | --- | --- | --- |
| 6 宫格 | 372×57 | 384×60 | **0.0% / 0.0%** |
| 大小窗 | 372×57 | 384×60 | **0.0% / 0.0%** |
| 单路 | 372×57 | 384×60 | **0.0% / 0.0%** |

（`devtools/r103-overlap.js`，400×889@dpr2.7，画面 rect 用 `painted()` 按视频真实宽高比算，不是格子 rect。）

模糊和折射都是**依赖后景**的效果：后景是一块纯色（首页的 rgb(36,37,38)）或一片黑边（播放页的 letterbox），透度调到多少都看不出玻璃。而这块黑边不是意外 —— R100/R101 正是为了「卡片别压画面」才让画面按 `--hud-h` 让位的。**「别压画面」和「玻璃要看得见」是同一个矛盾的两端**，改哪一个都会把另一个顶回去，所以这一条留给用户拍板（三个选项见 §9）。

## 6. 求解器：一份单元测试抓出三个 bug

`devtools/r103-solver-unit.mjs` 直接从 `src/script.js` 里把 `solveGlassAlpha / glassInkConstraints / measureCssBackdropLuma` 抠出来跑（不是照抄一份），改前改后对比：

| 场景 | 修前 | 修后 | 最差墨色对比度 |
| --- | --- | --- | --- |
| 深色·首页页面底（实测 37） | **0.920** | 0.450 | 6.10:1 ✓ |
| 深色·暗夜景（p99=20） | 0.920 | 0.450 | 6.76:1 ✓ |
| 深色·普通白天（p99=150） | 0.920 | 0.783 | 4.51:1 ✓ |
| 深色·车库白墙（p99=253） | 0.920 | 0.900 | 4.78:1 ✓ |
| 浅色·页面底（242） | 0.920 | 0.450 | 16.0:1 ✓ |

三个 bug（详见 `script.js` 里那三条注释）：

1. **守卫方向写反**：`if (passes(MAX)) return MAX` 把「最厚也过」当成结论直接返回最厚，于是 AA 轻松过的暗底全被解成 .92 —— 这就是「效果不明显」的直接来源。
2. **`passes()` 在暗底上非单调**：底色 luma 20 比深色填充（≈29）还暗时加厚反而掉对比度（6.76→6.45），二分收敛到的是「一个边界」。改成 24 档线性扫。
3. **一条救不了的墨色钉死整套自适应**：浅色主题 #9AA0AA 分组标题在任何 alpha 下都过不了 4.5，留在约束里 = 每帧都判「必须最厚」。现在只按「加厚能救的墨色」求解，救不了的单独计数（`unsavableInk=`）报出去。

顺带两处：采不到视频时不再回落写死的 .72，而是把 CSS 祖先链按 alpha 背→前合成出真实页面底（`backdropSrc=css`）；行车数据卡片在 CSS 里比整档薄 0.1，所以**逐面**求解并取最严的那一档 —— 之前那张卡上的字从来没被这道保证覆盖过，验收还跟着一起绿。

## 7. 验收

| 套件 | 结果 | 说明 |
| --- | --- | --- |
| `r102-verify`（竖屏，本轮新增 5 条判据） | **31 / 0** | 含「五个面没有一条边被画两遍」「逐面按各自最终 alpha 判 AA」「暗底解出最薄档」「亮底仍会加厚」「黑帧不算量到的底色」 |
| `r102-verify-landscape` | **18 / 0** | 行高那条改成量按钮（38 那一档写在 `button` 上，`.menu-choice` 是 44 的外层），并只在面板可见时补点 |
| `r93-verify` / `r97-verify` / `r99-verify` / `r101-verify` | 30/0 · 20/0 · 31/0 · 43/0 | r97 修的是量具：按次数补点会把已经开着的面板**关掉** |
| `r98-verify` | 36 / 2 | 两条都卡在**这场 0.05× 的播放时钟**上（`playing=false` 但时钟确实在走；「无区间时拒绝」读到的是「已续播 06:23」那条 toast）。A-B 越界那条本轮改对了：判据加上物理上界 `min(b+0.6, 事件总长)`，实测越界 0.26s ✓ |
| `r100-verify` | 12 / 2 | 见 §8 的归因 |

## 8. r100 那两条不是本轮改的（对照 1.2.170）

同一台 AVD、同一份 `r100-verify.js`、装机回读确认版本之后：

| 构建 | r100 结果 | 失败项 |
| --- | --- | --- |
| 1.2.170（R103 之前） | 11 / **3** | 「单路画面被 `--hud-h` 抬着」·「grid 不需要的视图一格高度都没变」·「退出剪辑后 front 回到基线」 |
| 1.2.177（本轮） | 12 / **2** | 后两条里的前两条同样在，第三条这次恰好过了 |

同一台机器、同一个判据，**改之前更差** —— 所以这三条是既有的、跟这场 AVD 的状态/负载绑在一起的判据，不是 R103 引进的回归。R103 只动 rgba 数值和 JS 求解，没有任何一条改到布局，「一格高度都没变」这种失败不可能由它引起。留作后续单独查（记在 #375 那一类里）。

顺带抓到一个新的假通过：**`adb install -r` 装低版本会被系统拒绝，但脚本把输出丢进了 /dev/null 并继续跑** —— 于是那一轮量的是没被换掉的 1.2.177，却写着「1.2.170 的结果」。降级必须 `-d`，且装完必须回读 `versionName`（这条 R93 就记过，这次是差点用它下结论）。

## 9. 留给用户拍板的一条：玻璃要不要「压到画面上」

§5 量出来的 0% 是这一轮唯一**改不动**的东西 —— 要它变，必须动「画面 / 悬浮件」的让位关系，而这正是 R100/R101 按他的要求改出来的。三个选项：

| 选项 | 做法 | 代价（实测） |
| --- | --- | --- |
| **A 环境底（推荐）** | letterbox 那一条不再是纯黑，铺一层「当前帧的放大模糊版」（播放器常见的 ambient 做法）。玻璃有内容可糊可折，画面**一格像素都没被遮** | 每帧多一次 drawImage/合成，成本量法同 `glassCost`；六路时只取当前主路 |
| B 让悬浮件压回画面 | 撤掉 R100/R101 的 `--hud-h` 让位，底部条与卡片盖在画面上 | 直接退回他上两轮报的缺陷：剪辑态 HUD 压画面 48.6px、常态压 9.6px |
| C 什么都不动 | 接受「播放页的玻璃读不出来」，只在首页/⋮ 面板这类有底图的地方保留材质 | 首页那一层现在已经是 .45/.55 的真透度，播放页仍是板子 |

A 与 B 的区别是关键：**A 不牺牲任何画面高度**，只是把本来就浪费掉的 letterbox 黑边变成有内容的底。要不要做等他点头（他要的是效果图先看，不是替他选）。

## 10. 交付

| 版本 | 干了什么 | 大小 | md5 |
| --- | --- | --- | --- |
| 1.2.171 | 透度改成每帧解（首版） | 28,054,923 | `2b3346398fafb228de76c6dd72453869` |
| 1.2.172–173 | 求解器墨色扩到「所有可见文字」+ 诊断取证 | 28,072,267 / 28,072,395 | `bb905fcf…` / `8f99358b…` |
| **1.2.174** | **底部多余的线：`border-bottom-color` 替掉叠上去的 inset** | 28,072,587 | `232a08da5d8a9f7c764da27a36a77696` |
| **1.2.175** | **守卫方向修正 + 无视频时量 CSS 页面底 + 首次落位不缓动** | 28,075,211 | `dad05596afbe9c50b22d1516c4404feb` |
| **1.2.176** | **逐面求解（卡片薄 0.1 的那一档纳入保证）+ 五个面全进约束** | 28,075,467 | `eeaad48c2aa6b0ac2fc6054c5fa1b6f3` |
| **1.2.177** | **黑帧不再当底色 + 线性扫替二分 + 救不了的墨色单独计数**（当前） | 28,075,595 | `7ba597e92318167d0f9b9e063a599bbd` |

1.2.177 sha256 `daf49ce4536b27ecdc427b53994c7654c6cdefed5fb66735612fd702aae9a2c9`，已装机（回读 `versionName=1.2.177`），旧包一律留在根目录不动。



# R104（1.2.177 → 1.2.178）真机反馈：边框颜色不统一 + HUD 卡片边框不完整

用户原话：「卡片的边框还是有问题，颜色不统一。行车数据的HUD卡片边框也不完整了。」附三张小米 14 截图（深色 ⋮ 面板 / 深色播放页 HUD 卡片 / 浅色 ⋮ 面板）。

## 1. 根因：R103 用「换一条边的颜色」消掉了「两条线并排」

Phase 1 只读 computed style，不猜（`devtools/r104-border-edges.js`）：

```
底部条 / ⋮ 面板 / 行车数据卡片 / 找片hero / 长按菜单
  0.74px rgba(255,255,255,0.3) | 同 | 同 | 同   ← 上右下左
  0.74px rgba(0,0,0,0.34)                        ← 下（R103 单独改的）
  每个面 distinct 颜色数 = 2
```

两条反馈是同一个原因的两面：

- **「颜色不统一」** = 四条边里有一条天生另一种颜色，这是我上一轮留下的。
- **「边框不完整」** = 那条暗色边压在 letterbox 黑底 / 深色页面底上**看不见**，一圈轮廓读成三缺一。HUD 卡片正是这种情形。

真正的成因诊断：**「两条线并排」的错在叠了一条 `inset 0 -1px` 阴影，不在颜色分工**。R103 去掉 inset 是对的，顺手把下边框改暗是多出来的一步 —— 它把「重复线」换成了「不连续」。

## 2. 修法：一圈一种颜色，深度感全部交给外阴影

对照 app 里本来就正确的做法（`styles.css:6210 / 6274 / 6477` 那几条 `border: 1px solid var(--glass-edge)`）：玻璃的深度从来不是靠某一条边变暗，而是靠**外阴影 + 顶部内高光**。量过确认这两个都在：

```
box-shadow = rgba(0,0,0,.6) 0 12px 34px, rgba(0,0,0,.4) 0 2px 6px, inset rgba(255,255,255,.34) 0 1px 0
```

所以改动就是删：两条 `border-bottom-color: var(--lens-deep)` 删掉，`--lens-deep` 这个 token 两处声明一起删（全文件引用数 0）。深色主题那段注释原来还写着「.72 是解出来的天花板、alpha 会走到 .52」，那是 R103 之前的旧结论，一并换成现在的真话。

## 3. 判据（先写失败的那一条，再改代码）

`r102-verify.js` 新增两条，都在改代码**之前**跑过一遍确认会红：

- 「五个玻璃面四条边是同一种颜色」—— 改前 FAIL：5 个面全部 `rgba(255,255,255,.3) vs rgba(0,0,0,.34)`；改后 PASS。
- 「去掉暗边之后深度感仍在（外阴影 + 顶部内高光都要有）」—— 防止下一次为了统一颜色把阴影也删了，那等于把材质删平。

`devtools/r104-verify-border.js` 另外把深浅两个主题各量一遍（10 个面 × 4 条边 = 同一种色）。这里踩过一个坑：`viewer.applyTheme(isDark)` 收的是**布尔**，第一版探针传了字符串 `"light"`（真值）→ 两次量的都是深色，却打出「两个主题 PASS」。现在改成写 `tdashcam.themeMode` 再走 app 自己的 `resolveThemeDark(mode)`，并且断言两个主题都真的切换过，否则直接 FAIL 不装绿。

## 4. 验收

| 套件 | 结果 |
| --- | --- |
| `r102-verify`（竖屏，含本轮新增 2 条） | **33 / 0** |
| `r102-verify-landscape` | **18 / 0** |
| 深浅双主题逐边测量 | PASS（10 面 × 4 边同色，深度感两项俱在） |

截图：`devtools/shots/r104-dark-menu.png`、`r104-light-menu2.png`、`r104-hud-card-dark.png`。

## 5. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| **1.2.178** | 玻璃四条边统一为 `--lens-edge`，删掉 `--lens-deep`；深度感由外阴影 + 顶部内高光承担 | 28,075,915 | `a4aa106533329b251de424b06a694fd2` |

sha256 `9909f778dd1a7f331b7b8b66e32ef388e85474655cc1635566b0e18d768ed80f`；已装机并回读 `versionName=1.2.178`。R103 待拍板的那条（玻璃背后要不要有内容）记在 §9，没有动。

# R105（1.2.178 → 1.2.179）真机反馈：顶部那条线比其余三条粗 + 材质跟着内容走

用户原话：「就按照你的建议来改动，目前各个卡片的顶部线条要粗一点，排查一下」。

## 1. 顶部线：先量，不猜（`devtools/r105-edge-and-overlap.js`）

把每个玻璃面的四条边各拆成「有没有边框 / 有几条锐利 inset（blur ≤ 1.5px）」，再数一条边上叠了几道亮线：

```
改前（小米 14 CSS 400x870@3 与本机同口径复现）：
  底部条   T:2  R:1  B:1  L:1
  ⋮ 面板   T:2  R:1  B:1  L:1
  卡片     T:2  R:1  B:1  L:1     ← 其余三个面同
```

`T:2` = 1px 上边框 **加** 一条 `inset 0 1px 0 var(--lens-spec)` 的顶部内高光，两条都是亮的、都是 1px，并排
就读成「上沿比别处粗」。这就是 R103 那条下边暗线的姊妹 —— 同一个缺陷，只是方向相反，而**我上一版的判据
只查 `y < 0`（向下偏移）**，所以顶部这条从头到尾都是绿的。

改法：删掉 `--lens-spec`（两条声明 + 两处引用一起清），深度感全部交给外阴影 —— 和 app 里其它玻璃面
（6210 / 6274 / 6477 那几条 `border: 1px solid var(--glass-edge)`）本来就是同一套做法。

## 2. 材质跟着内容走：把「按面分工」这个自己提的方案推翻

用户批准的是我那句「玻璃只在真的有内容可折的地方存在」。实测（竖屏 + 横屏 × 三种视图 + 全屏）之后，
**静态分工不成立**：

| 面 | 竖屏压画面 | 横屏压画面 |
| --- | --- | --- |
| 底部条 | 0% | 0%（但**全屏时不是 0**） |
| 找片 hero | 0%（背后是纯色页面底 + 渐变纱） | 0% |
| ⋮ 面板 | 47.5% | 38.1% |
| 行车数据卡片 | 0% | 82% |
| 长按菜单 | 浮在宫格上（收起态没有盒子） | 同 |

所以「哪几个面折射」不能写死在 CSS 里，必须每拍重新量：

- `markLensSurfaces()` 用 letterbox 校正后的**画面 rect**（不是格子 rect —— R83 同一个坑）和每个面的
  盒子求交，重叠面积 ≥ `LENS_MIN_COVER`（2%）才挂 `.lens-on`；CSS 里那条 `backdrop-filter: url(...)`
  改成只匹配 `.lens-on`。
- **看不见的面也算没有内容**：⋮ 面板收起态是 `opacity:0 + scale(.98)`，盒子还在、也压在画面上，但用户
  没在看它，不该每拍付那 8.2ms。判据用 `display/visibility/opacity`，且淡入途中（0<opacity<1）算可见，
  这样玻璃跟着面板一起到位，不会晚一拍才「弯」出来。
- **节拍拆成两半**：几何开关 250ms（要跟上面板 200ms 的开合动画），透度解算仍 900ms（读帧 + 每面每种墨
  扫 24 档，是重的那一半）。合成一个 900ms 节拍会让玻璃慢半拍。
- 诊断加 `lensOn=N/5`。

## 3. 验收判据这一轮改的是「量具」，不是数字

- 1b 四条边都查（原来只查向下）；新增 1b-2 判「有 `.lens-on` ⇔ 实测重叠 ≥ 阈值」，两侧各留 0.5pp 余量
  吸收采样时差；阈值**读运行时那个常数**，不在判据里抄一份（抄的那份下次调参就变成假失败）。
- 深度感判据反过来：`--lens-spec` 已经删了，所以要求「至少一条外阴影，且一条 inset 都没有」。
- 新增「至少一个面当前真的在折射」—— 少了它，上面两条在开关彻底坏掉（永远 false）时照样全绿。
- 「减弱透明度后滤镜全摘」那条原来拿底部条当样本；R105 之后底部条在竖屏本来就没滤镜，于是它变成一条
  永远绿的空判据。改成先挑「这一刻真的挂着 url() 滤镜的那个面」当样本，并把样本名报出来。
- 判据里凡是用 `bf() !== 'none'` 表示「有透镜」的地方全部换成 `/url\(/`：R39-3/R59 那层**普通模糊**
  不在本轮开关范围里（列表页底部条背后是真有滚动内容），拿「有任何滤镜」判会把五个面全部误报。

## 4. 竖屏实测（1.2.179）

| 判据 | 改前 | 改后 |
| --- | --- | --- |
| 五个面四条边的线数 | T:2 / R,B,L:1 | **T:1 R:1 B:1 L:1**（全应用逐边普查 0 处） |
| 材质跟着内容走 | 五个面都挂滤镜 | 竖屏 lensOn=1/5（只有 ⋮ 面板 44.3%），底部条/卡片 0% 不付 GPU |
| 面板开合跟得上 | — | 面板 opacity 到 1 后 ≤600ms 挂上透镜（这台高负载 AVD 的实测） |

# R106（1.2.179 → 1.2.180）用户追问：「其他卡片顶部也有这条亮线，能改成跟其余三条一致吗？还有其他地方吗？」

用户原话：「排查一下 APP 中所有的卡片，其他卡片顶部也有这条亮线，能改成跟其他三条边一致吗？能做到吗？
先排查问题，排查完以后，问一下我要不要一并修改，还是怎么样子。另外排查一下 APP 中其他地方还有没有这种
问题」。

## 1. 普查：成因不在「那五个面」，在一个 token 里

R105 只在**透镜档**里删了那条顶部内高光，但同一件事写在更下面一层：

```
src/styles.css:5353（改前）
  --elev-float: var(--glass-shadow), inset 0 1px 0 var(--glass-top-hi);
                    ↑ 深度感已经由它负责        ↑ 就是这条，浅色主题 rgba(255,255,255,.9) 几乎纯白
src/styles.css:5288  --glass-top-hi: rgba(255, 255, 255, 0.9);   （浅色）
src/styles.css:5307  --glass-top-hi: rgba(255, 255, 255, 0.2);   （深色）
```

`--elev-float` 全应用有 6 个调用点，**而这 6 个面全都带 1px 边框** —— 所以它们的顶边永远是两行：

| # | 面 | 边框 | 调用点 | R105 之后是否已单行 |
| --- | --- | --- | --- | --- |
| 1 | 底部条 `.phone-action-bar` | 1px `--glass-edge` | 6211/6212 | 透镜档已单行，**实心/无 url() 档仍两行** |
| 2 | 长按菜单 `.card-context-menu` | 1px `--modal-panel-border` | 5144/5145 | 同上 |
| 3 | ⋮ 面板 `.header-actions-group` | 1px `--glass-edge` | 6328/6330 | 同上 |
| 4 | 找片 hero `.empty-hero` | 1px `--glass-edge` | 6479/6482 | 同上 |
| 5 | 行车数据卡片 `.metadata-panel` | 1px `--glass-edge` | 6590/6594 | 同上 |
| 6 | **导出进行中角标 `#exportPill`** | 1px `--glass-edge` | 6275/6278 | **任何档都两行**（它不在透镜名单里，基础档就是它最终样式） |

运行时逐边数「一条边上有几道光」（`devtools/r106-top-edge-survey.js`，走抽屉设置 / 播放页 / ⋮ 面板开 /
长按菜单 / 导出角标 × 深浅两档）：1.2.179 的透镜档剩 **1 处 = `#exportPill` Top:2**；把材质退回实心档
（等于开了系统「减弱透明度」，或 WebView 不支持 `backdrop-filter: url()`）之后 **5 处全部回来**。
这正好对上他截图里「长按菜单和设置卡片顶部也有一条」的观感 —— 他手上是 1.2.178，那版连透镜档都还留着
`inset 0 1px 0 var(--lens-spec)`。

## 2. 一并修掉：把这个 token 删掉，而不是给六个面各打一遍补丁

判为「能一致，而且应该只在源头改一次」：

- 六个调用点全部直接写 `var(--glass-shadow)`；`--elev-float` 与 `--glass-top-hi`（两条主题声明）删除。
  R97 定过的规矩是「token 只做同值去重」—— 去掉那条 inset 之后 `--elev-float` 和 `--glass-shadow` 完全
  相等，留着只会让下一次「要不要加回高光」变成又一处各面不一的地方。
- 深度感全部交给外阴影（`--glass-shadow` 本来就是两层：`0 12px 30px` + `0 2px 6px`），和 app 里其它玻璃
  面（6210 / 6274 / 6477 那几条 `border: 1px solid var(--glass-edge)` + `box-shadow: var(--glass-shadow)`）
  同一套做法。**边框本身就是那条上沿线**，不需要再叠一道同色的亮线。
- 这样四个档一起对齐：透镜档 / 实心档（减弱透明度）/ 高对比度 / 不支持 backdrop-filter 的老 WebView。

## 3. 判据改成「全应用」，不再只查那五个面

连续三轮都是同一个模式：修了量到的那几个面，别处留着同一个缺陷。所以在 `r102-verify.js` 里加了一条
**走 `body *` 的逐边判据** —— 任何看得见的元素（≥24×16），一条边不许同时有 ①边框 ②锐利 inset（blur ≤1.5px）
③0 偏移 + spread 的 inset 环（那种是把四条边一起加粗）。横屏套件同步补了等宽/等色/双线三条。

普查里另外抓到一处**不同类**的，判为保留：`.dir-volume-chip.has-clips`（目录浏览器里「有录像」那个音量 chip）
是 `border` + `inset 0 0 0 1px` 的同色环 —— 它加粗的是**四条边一起**，不是「顶部比别处粗」，读起来是刻意的
双层绿框。要不要收成单层等他拍；这条不属于他这次报的缺陷类。

## 4. 验收（全部在 1.2.181 上重跑，装机后回读 `versionName=1.2.181`）

| 套件 / 探针 | 结果 |
| --- | --- |
| `r102-verify`（竖屏，本轮 +3 条：全应用逐边、四条边等宽、材质跟内容） | **35 / 0** |
| `r102-verify-landscape`（横屏，本轮 +4 条） | **20 / 0** |
| `r106-top-edge-survey`（多屏普查：首页 / 抽屉 / 播放页 / ⋮ 面板开 / 长按菜单 / 导出角标） | **0 处**（改前 1 处 = `#exportPill`） |
| `r106-solid-tier-check`（2 材质档 × 2 主题 × 3 屏 × 6 面 = 60 次逐边测量） | **60 行全部 `inset数=0` 且四条边等宽** |

横屏关键读数：`卡片 90.1%/透镜`、`底部条 0.0%/平`、`⋮ 面板 收起态`（看不见 → 不挂）；
竖屏：`⋮ 面板 43.4%/透镜`、`底部条 0.0%/平`、`行车数据卡片 0.0%/平`。
诊断侧本轮补了两处「不说谎」：`refracts=` 改成读能力（CSS.supports）而不是底部条自己有没有滤镜
（R105 之后底部条本来就可能没滤镜，那个字段会稳定误报 0）；`measureGlassCost()` 在 `lensOn=0/5` 时
报 `skipped（此刻没有面在折射，无对象可对比）`，不再打印一个不存在的成本。

截图（`adb exec-out screencap`，带视频平面）：`devtools/shots/r106-port-dark-play.png`、
`r106-port-dark-panel.png`、`r106-port-light-play.png`、`r106-land-light.png`、`r106-land-light-panel.png`、
`r106-land-dark-panel.png`。四个玻璃面在深浅两档、横竖两向的上沿都与其余三条边同宽同色。

## 5. 判为保留（等拍板）

`.dir-volume-chip.has-clips`（目录浏览器「有录像」的音量 chip）是 `border` + `inset 0 0 0 1px` 同色环，
它把**四条边一起**加粗成双层绿框，不是「顶部比别处粗」，跟他这次报的不是同一类缺陷。要不要收成单层等他定。

## 6. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| 1.2.179 | 透镜档去掉顶部内高光；材质跟着内容走（`.lens-on` 按实测重叠 + 可见性开关）；几何/透度两种节拍 | 28,077,643 | `8aec66069c1c3ae459dab04749b15e45` |
| 1.2.180 | 普查后把成因从「那五个面」收到 token：删 `--elev-float` 的顶部 inset 与 `--glass-top-hi`，六个调用点改指 `--glass-shadow`（含 `#exportPill`） | 28,078,031 | `175c8753f8ef009ee0405b2d66c722f1` |
| **1.2.181** | 诊断两处不说谎（`refracts=` 读能力、玻璃成本无对象时报 skipped）；顺带修横屏套件里一条从没跑过的分支（`viewer.togglePlayPause` 不存在） | 28,078,475 | `8b14addbfdae2bb396e2bdcaf7d37fbc` |

sha256(1.2.181) `3666c481944b92f911c7341f71cb964bcc051eb8a7c026c2817e87c8803fe19a`；三个包都在工作区根目录，
装机后回读 `versionName=1.2.181`，两 ABI 的 `libtdashcam_studio.so` 与构建产物逐字节同 md5。

# R107（1.2.181 → 1.2.184）透度分两组解：数据卡不许再钉住白玻璃

用户批准：「就按照你推荐的改法来」。两条待拍板里的第二条 —— 浅色主题亮帧上玻璃读成「一块板」。

## 1. 先量：到底是谁把材质钉厚的

拿运行时那一份 `solveGlassAlpha`（`devtools/r103-solver-unit.mjs`，不需要设备，跑的就是出厂那段算术）
把两组各自的需求算出来，再和「共用一个变量时会被拖到多少」对比：

| 画面亮度 | 浅色·白玻璃自己要 | 浅色·数据卡要 | 共用时被拖到 | 深色·白玻璃 | 深色·数据卡 |
| --- | --- | --- | --- | --- | --- |
| 37（首页/夜路） | .450 | .450 | .450（多付 0） | .450 | .450 |
| 150（普通白天） | **.450** | .802 | .802（多付 **0.35**） | .783 | .802 |
| 200 | **.450** | .861 | .861（多付 **0.41**） | .861 | .861 |
| 253（车库白墙/雪天） | **.450** | .900 | .900（多付 **0.45**） | .900 | .900 |

结论两条，都要说清：
- **浅色主题里那 .35~.45 的「多付」全部来自一张数据卡**：它两个主题都是深色板（`rgba(12,12,16,…)`）配白读数 + 一支蓝 `rgb(24,144,255)`，那支蓝在 .92 才有 4.63:1。三块白玻璃（底部条 / 长按菜单 / ⋮ 面板）在同样的画面上只要最透的 .45，却被 `--lens-alpha` 这个**单一全局值**（= 五个面里最严的那个）拖到 .80~.90 —— 用户看到的「玻璃像一块不透明的板」是这么来的，不是模糊不够。
- **深色主题基本不变**（白天多付 0.02、亮帧 0）。那三块面在深色主题里自己也是深色板，需要同样的厚度 —— 那是深色材质的物理代价，不是缺陷。所以这一轮的收益只在浅色主题，别把它说成全局变透。

## 2. 改法：一个变量拆成两个

- CSS：`--lens-alpha-plate`（默认 .62 只是「采不到」的兜底），`.metadata-panel` 从
  `rgba(12,12,16, calc(var(--lens-alpha) - 0.1))` 改成 `rgba(12,12,16, var(--lens-alpha-plate, 0.62))`。
  那条 −0.1 是 R59/R71 时代对「每帧不同的画面」做的一次静态猜测，本轮连它一起作废。
- JS：求解器按 `GLASS_PLATE_SURFACE = '.metadata-panel'` 分两组，各取自己那组的最大需求，
  各写一个变量、各自缓动（第一次解出直接落位，之后 0.34 系数）。`off` 那套「从 computed style 反推偏移」
  一起删掉 —— 每面写的就是它自己那组的值，偏移恒为 0，少一个会漂移的环节。
- 材质摘掉 / 采不到底色时两个变量都要摘或都回兜底，只摘一个会让数据板留着上次的值继续画。
- 诊断加 `plateAlpha=… plateWant=…`，真机复制诊断就能看出两组各停在多少。

## 3. 判据

新增一条**证明解耦真的发生**的判据（不是再抄一个数值）：用运行时同一个 `solveGlassAlpha` 把两组需求
各自重算，和 CSS 里两个值分别比（±0.07 吸收缓动与亮度取整）。如果哪天有人把两个变量合回一个，
白玻璃那组会立刻等于 `max(白玻璃, 数据卡)`，与重算值差出 0.35~0.45 —— 这条会红。
原有「逐面按各自最终 alpha 判 AA」保持不变，所以拆组**没有放松任何一处对比度**。

## 4. 验收（全部在 1.2.184 上跑，装机后回读 `versionName=1.2.184`）

| 套件 | 结果 |
| --- | --- |
| `r102-verify`（竖屏，36 条，含本轮 +1 条解耦判据） | **36 / 0** |
| `r102-verify-landscape`（横屏，20 条，本轮改成自己造前置条件） | **20 / 0** |
| `r106-top-edge-survey`（全应用逐边普查） | 0 处 |
| `r106-solid-tier-check`（两档 × 两主题 × 三屏 × 六面） | 60 / 60，每面四边等宽、inset 数 0 |
| `r103-solver-unit.mjs`（出厂算术，无需设备） | 上表 |

解耦真的发生（同一帧、同一底色，两组各停各的）：

| 场景 | 底色 | 白玻璃组 实测/应然 | 数据卡组 实测/应然 | 差 |
| --- | --- | --- | --- | --- |
| 列表页（CSS 那层底，纯白） | css/255 | .450 / .450 | .568 / .568 | 0.12 |
| 播放页浅色（车库夜帧） | video/85 | .861 / .861 | .450 / .450 | **0.41** |
| 播放页浅色（另一拍） | video/91 | .863 / .861 | .450 / .450 | 0.41 |
| 播放页深色 | video/91 | .881 / .881 | .450 / .450 | 0.43 |

AA 仍然逐面按各自最终 alpha 判，拆组没有放松任何一处：浅色·视频帧那一次「受约束 8 条，最差 = 行车数据
卡片 `rgb(24,144,255)` @ .63 → 4.58:1」；列表页那一次「受约束 9 条，最差 = ⋮ 面板暗灰标题 @ .45 → 4.69:1」。
截图五张（`adb exec-out screencap`，CDP 截图里没有视频平面）：
`devtools/shots/r107-{port-light-panel,port-dark-panel,port-dark-card,land-light-card,land-dark-card}.png` ——
横屏那两张就是本轮最直白的对照：数据板 .45 透到看得见面前的车库地面，而底部条按自己那组停在 .86/.88。

## 5. 拆完立刻暴露的四个问题（这一轮真正值钱的部分）

拆掉「数据卡把白玻璃钉厚」之后，AA 判据马上红了两条 —— 都是**原来被那个过厚的全局值盖住**的问题：

1. **保证只覆盖了「采样那一拍恰好可见」的文字。** 求解器收集墨色时按 `display/visibility/opacity` 跳过
   不可见节点，而 ⋮ 面板收起态是 `visibility:hidden` —— 它会**继承给全部子节点**，于是面板关着的时候
   这一面一种墨都不进约束。他点开面板的那一瞬间，材质还是照「没有这几种字」解出来的厚度，要等下一拍
   （900ms）才补上。修法：收集只看 `display:none`（根本不渲染的），暂时看不见的照样是这一面**可能画出来**
   的颜色。会不会因此被钉回实心？不会 —— 救不了的墨色仍由 `glassInkConstraints` 的 helpable 筛掉（R103 那条）。
   上限从 8 种提到 12 种（不再按可见性筛之后一个面板里能出现的色更多）。
2. **判据和运行时用了两个不同的「救得了」窗口。** 判据取 `sa±0.4` 并允许到 1.0，运行时只在
   `[GLASS_ALPHA_MIN, GLASS_ALPHA_MAX]` 里判 —— 于是「只有完全不透明才过」的墨色，判据算「救得了」、
   运行时算「救不了」，两边各说一套，红的是判据（`rgb(108,117,125)` 那条暗灰标题 3.82:1）。
   修法：判据改用同一个夹紧窗口。这条属于 R103 那条「窗口两端」教训的续集。
3. 顺带：`暗底/亮底` 那对方向判据原来写死拿**底部条填充色 + 浅墨**，等于偷偷假定自己是深色主题；
   浅色主题下白底压浅墨在亮帧本来就过 AA，`brightSolve > darkSolve + 0.2` 必红。换成方向一定成立的
   一组（深色数据板 + 白读数），并把 +0.2 这个我拍的余量降到 +0.05（真实差是 0.12 —— 判据不该比被测量更自信）。
4. 还有一处只有拆组才会撞上的：**缓动会走过一段不合格的中间值**。深色板 + 蓝墨时对比度对 alpha 非单调
   （R103 记过），从 .92 缓动到 .87 的路上 .88 那一下只有 4.39:1。修法：缓动值自己再验一遍
   （`glassAlphaPasses`，和求解器共用同一个谓词），不合格就直接跳到目标 —— 宁可跳一下也不带着不合格厚度画。
   同时把「求解 / 验证 / 诊断 / 判据」四处的底色统一成同一个取整值，消掉 0.5 亮度就能让两端各说一套的边界漂移。

## 6. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| 1.2.182 | 两组拆开：`--lens-alpha-plate` 新变量 + 求解器按 `GLASS_PLATE_SURFACE` 分组、各写各的、各自缓动；诊断加 `plateAlpha/plateWant` | 28,079,307 | `455c536919a9f0186e3a72092ca976f8` |
| 1.2.183 | §5 的第 2、4 条：`glassAlphaPasses` 让缓动值自己再验一遍（不合格就跳）；求解/验证/诊断/判据四处底色统一取整 | 28,079,819 | `e5b94e0b2dc22aed958156ddec12a9b1` |
| **1.2.184** | §5 的第 1 条：收集墨色不再按暂时可见性筛（`visibility:hidden` 会继承给整个面板的子节点），只跳 `display:none`；上限 8 → 12 | 28,080,075 | `11e4add82020e93bac15108507593d7a` |

sha256(1.2.184) `7aefbd4d6a790e4f1e1d2839a864c3b7074d196f8d166b0869cb5b58dead9a99`；三个包都在工作区根目录，
装机后回读 `versionName=1.2.184`，两 ABI 的 `libtdashcam_studio.so` 与构建产物逐字节同 md5。
待拍板第 ① 条（体积药丸那圈 0.74px 描边）按约定**没动**。

## 7. 这一轮量具自己撞上的五个坑（改了量具，所以两套套件全量重跑）

1. **手加的 `solid-material` 会被 APP 自己摘掉。** 那个类是 `markAccessibilityPrefs()` 每次按系统开关
   重新推导出来的（`script.js:1111`），而它是原生状态推送的回调 —— 刚旋转完推送正连着来。于是
   「加类 → `sleep(350)` → 读」读到的是类已经被摘掉的页面：横屏套件三条判据一起红，而单独探针
   **同步**读时全是对的（`devtools/r107-landscape-solid-probe.js`：加类后 0/120/…/720ms 六次读数全 `none`，
   底色 `rgb(255,255,255)`，且监听 `classList` 期间没有任何非本页的写入）。修法不是加更长 sleep，是把
   「加类 → 读 computed style → 摘类」放进同一个同步任务 —— `getComputedStyle` 自己强制重算，不需要等帧。
2. **旋转是异步落到 WebView 的。** `settings put system user_rotation 1` 之后 4~6s，页面里
   `matchMedia('(orientation: landscape)')` 仍是 false、`innerWidth` 仍是 400。基准自证必须轮询等它翻过去
   （套件里现在报「等旋转落地 Nms」），否则横屏套件拿着竖屏几何跑完前面几条 —— 这次多报的 3 条全是这么来的。
3. **`accelerometer_rotation` 会被翻回 1。** 只设 `user_rotation` 是没用的（自动旋转赢），而 ANR/重启之后
   这个设置会漂。旋转类验收开工前先把两个都回读一遍。
4. **面板开合的奇偶：循环补点会把打开态点成关闭。** 旧写法「每 8 圈补一次 `tabMoreBtn.click()`」假定期初是
   关着的。改成按权威读数判定：`.header-right` 有没有 `active`（点下去同步就变），只在没有时点一次。
   顺带把「24 行仍可点」补了 `live.length >= 15` 下限 —— 面板关着时 `live=0` 也算 `dead=0`，那是条空判据。
5. **别拿 `input keyevent 4` 当「关闭面板」的替身。** 在设置页上按返回，实测连着退出了 APP（截图拍到的是
   桌面）。要关面板就用它自己的控件或直接把 `active` 摘掉。

另记一条环境取证（不是本轮代码，但值得留下）：这台 AVD 今天三次 ANR 同一签名 ——
`Reason: Input dispatching timed out … Waited 5005ms for FocusEvent(hasFocus=true)`，主线程停在
`HardwareRenderer.nSetStopped → std::future<void>::get()`，RenderThread 在 `waitForWork` 且内核时间 14.2s
（`devtools/anr-trace-18.txt`）。都发生在负载 5~9 的冷启动/旋转瞬间，软件 GLES 的停止握手等不到渲染线程。
ANR 对话框的「关闭应用」会把进程杀掉，所以探针期间可临时 `settings put global hide_error_dialogs 1`（本轮用完已还原 0）。

**这条缓解下一轮就被推翻了**：R108 又试了一次，`hide_error_dialogs=1` 并**不能**阻止进程被杀（日志仍是 `Killing … user request after error`），而且它让「APP 已经死了」变成 `SocketError: other side closed` 之外没有任何提示。见 R108 一节。

# R108（1.2.184 → 1.2.185）真机「开设置卡片先半透明、一下子又变白底」+ 抽屉/选择文件夹盘点

用户两条：① 播放时点设置，卡片先是半透明，然后一下子变成白底带点透明 —— 排查；② 「抽屉列表、选择文件夹的 UI 是不是还没统一完善？」

## 1. 先量：跳的**不是**透度

`devtools/r108-panel-open-timeline.js` 用**用户那条路径**（点 `tabMoreBtn`）打开面板，每 100ms 同时采 底色 / `backdrop-filter` / `opacity` / 墨色条数：

| 时刻 | 底色 alpha | 面板 backdrop-filter | opacity | 全局墨色条数 |
| --- | --- | --- | --- | --- |
| 打开前 | .861 | `blur(22px) saturate(1.8)` | 0 | 9 |
| 0–200ms | .861 | `blur(22px) saturate(1.8)` | 0 | 9 |
| 300ms | .861 | `blur(22px) saturate(1.8)` | **1** | 9 |
| 400ms 起 | .861 | **`url("#tesseraLens") blur(16px) …`** | 1 | **10** |

`alphaJump=0`、`bgChanged=false` —— 透度求解器这一拍什么都没做。真正发生的两件事：

1. **材质档位晚一拍。** `.lens-on` 由 250ms 的几何 tick 决定（R105 分的两种节拍），而面板的开合动画是 200ms —— 面板**已经完全显示**之后 ~100ms，那一档滤镜才换。薄玻璃上「看起来亮不亮」几乎全由后景那层滤镜决定，所以这一下读起来就是「换了材质」。
2. **墨色约束还跟着瞬时布局走。** `inks` 9→10 说明 R107 那条「暂时看不见也要进约束」没做到底：仍有一种颜色只在面板打开之后才被算进来。在**亮帧**上，一种暗灰标题就能把白玻璃从「够用的最薄」顶到 .86 —— 这正好是他截图那个方向（第一张看得见树和红光，第二张是一块白）。

## 2. 改法

- **A1 材质当场判定**：`markLensSurfaces()` 挂到面板开合的**唯一汇合点**（`headerRight` 那个 MutationObserver，R101 定下的同一处）+ 长按菜单显示/隐藏 + 数据卡折叠。观察者回调是微任务，赶得上开合动画的第一帧。
- **A2 约束与开合状态无关**：收集墨色连 `display:none` 也不跳了 —— 保证的对象是「这一面**可能**画出来的每一种颜色」，不是「这一拍被排版出来的那几种」。救不了的墨色照旧由 `glassInkConstraints` 的 helpable 筛掉，所以这不等于把材质钉成实心（这一条要拿数字验，见 §4）。
- **A3「玻璃折射」开关**（⋮ 面板 → 其他，默认开）。理由：`CSS.supports('backdrop-filter','url(#…)')` 只说明解析器接受这个引用，**会不会真的把后景送进滤镜只有在他自己那台机器上看得见**。模拟器上量不出他机器的行为，所以给他一个当场能 A/B 的开关，而不是我替他猜。实现上 `glass-lens`（能力，自适应透度挂在它上面）与 `lens-refract`（意愿）分成两个类，关开关只摘 `url()` 那一档、五个面统一退回普通模糊，**可读性保证不受影响**。诊断加 `refract=… pref=on/off`，能力与意愿分开报。
  → **R109 整套撤销**。他装上 1.2.185 第一件事就是把它关掉，而颜色照旧变 —— 这一条实测直接证伪了「折射是成因」。开关摘掉的是他不在意的那一半，见下面 R109 一节。
- **B4 选择文件夹的紫归到品牌紫**：外置存储 chip 硬写 `rgba(139,92,246,…)`（#8b5cf6），而 APP 自己的紫是 `--accent-solid: #5b4bf0` —— 同一屏两种紫。chip 的边框/底色改指新 token `--chip-media-edge/-soft`（值即 #5b4bf0 的 .65/.14），`--modal-chip-hover`、`--modal-accent-soft` 一并归色。琥珀（只读盘）/青（U盘向导）**只起名 `--chip-warn`/`--chip-info`、值不动** —— 换它们是观感决定，不混进去重里偷偷做。
- **B2 触摸端不再吃 hover**：`:hover` 在 Android WebView 上会在 tap 之后**保持**到下一次点别处，所以「按了一下选择文件夹，它抬起两像素不落下」是真会发生的。只在 `(hover:none) and (pointer:coarse)` 下中和 `transform`/`box-shadow`；描边变色留着 —— 按选择器逐条还原基色，写错一条比留着更糟。桌面的 hover 规则一条没动。

## 3. 抽屉 / 选择文件夹盘点（②的答案：确实还没统一）

| 类 | 抽屉列表 | 选择文件夹 |
| --- | --- | --- |
| 同值未去重（零观感变化） | `--gutter` 与 `--menu-inset` 两套并行；`.modal-content` 圆角 `16px` 就是 `--r-panel` | `8px`×4 处就是 `--r-chip`；`0.6875rem` 就是 `--fs-cap` |
| 真不一致 | 行高 `--field-h` 六处声明（40/44/38/44/38/46，styles.css:5446/5747/5754/8201/8220/9171）；`.video-card` 66/52/48 三值；字号 0.6~0.74rem 六种 | chip 三色（本轮已收）；路径框等宽字体 0.82rem |
| 控件类型不统一 | `#eventFilter` 还是裸 `<select>`（index.html:106）+ 桌面下拉箭头，⋮ 面板同类位置早已是 `.menu-choice` 直选；`#filterToggleBtn` 是循环切换；抽屉里没有 `.menu-divider` 等价物（`label` 被 `display:none`） | `.dir-quiet-link` 无 `min-height`（≈34px）；`.clear-date-btn` 24px 靠 `::after` 撑 |
| 桌面残留 | 横屏那几个 `@media` 块缺 ⋮ 面板有的 `hover:none` 子句 | 四条 `:hover`（本轮已中和位移/投影） |

**本轮没做、下一轮做**：`#eventFilter` → 直选（好消息是 `.menu-choice/.choice-segments/.choice-segment` 在 styles.css:5937–5971 有**全局基样式**，抽屉可以直接复用，不必把面板那 12 条规则搬一份）、抽屉分组标题、`--field-h` 六值收敛、`8px`→`--r-chip` 那批同值去重。按「动观感的先给效果图」的规矩，这几条我带实测数字和图来，不混进这一轮。

## 4. 验收

| 套件 / 判据 | 结果 |
| --- | --- |
| `r102-verify`（竖屏套件） | **37 绿 / 0 红** —— 这一条是 R109 复跑出来的（1.2.185，状态落定后）；上一场报的 5 条红经查是量具缺基准，见 R109 §3 |
| `r102-verify-landscape`（横屏 20 条） | 未在 1.2.185 上跑；改在 1.2.186 上复测，记于 R109 §4 |
| 新判据：面板开合**不再换材质**（`bf` 在 opacity=1 那一拍已经带 `url(`） | `r108-verify` A1 两条绿（1.2.185，8/8 那一场）。逐条读数不在这里复述，1.2.186 上重跑后记在 R109 §4 |
| 新判据：`closed` 与 `open` 的墨色集合相等（`r108-panel-ink-diff.js`） | `r108-verify` A2 那条绿：两种状态收集到的色集合差集为空 |
| 新判据：折射开关关掉之后五个面都还有普通模糊、alpha 不变 | 当时 5 条全绿 —— **但这条判据本身随 A3 一起在 R109 撤销**，`r108-verify` 的 A3 已改写成「撤销检查」 |
| `r106-solid-tier-check`（两档×两主题×三屏×六面） | 未在 1.2.185 上跑；改在 1.2.186 上复测，记于 R109 §4 |

## 5. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| **1.2.185** | A1 材质当场判定 + A2 墨色约束与开合无关 + A3「玻璃折射」开关（R109 撤销）+ B4 chip 归色 + B2 触摸端 hover | 28,081,803 B | `fc43c698dafaa24cc0ba9aaa85907b48`（sha256 `97d89e28…927ac1`，SO_MATCH 两个 ABI 均一致） |

## 6. 这一轮的量具教训

- 问「有没有跳变」必须**同时**采底色和 `backdrop-filter`：只读 `backgroundColor` 会得到 `alphaJump=0` 然后判「清白」，而屏幕上确实换了东西。
- `glassState.inks` 是**五个面加总**，它 9→10 不能定位是谁变的 —— 要按面分开采（`r108-panel-ink-diff.js` 就是为这一条写的）。
- 像素统计的下标必须**先算完再取整**：`Math.round(x)+pad` 让循环从浮点开始，`Buffer` 的小数下标返回 `undefined`，于是三档截图的均值全等 `NaN` 而**不报错**。三档全等不是「没有差异」，是量具坏了。
- ANR 对话框压在画面上，会被 `screencap` 一起截进去 —— 那三张「一样」的图其实是同一块对话框。
- `hide_error_dialogs=1` 保不住进程（推翻 R107 那条缓解），而且它让 APP 死了之后只剩一个 socket 报错。
- 首页上 `.header-collapsed …` 选择器整个落空（header 没折叠），量不到任何墨色 —— 按 id 取节点，别按状态类。

# R109（1.2.185 → 1.2.186）「折射关掉颜色还是会变」→ 撤掉开关 + 透度加迟滞

用户两条，第二条是要害：① 「玻璃折射关掉后，卡片颜色还是会变，不稳定」；② 「玻璃折射这个开关感觉没有必要？搞复杂了。」

## 1. 先量：那个开关指的成因是错的

① 本身就是他替我做的一次 A/B：折射档只决定**边缘弯不弯**（`url(#tesseraLens)` 那一层后景滤镜），
底色 alpha 一条都没动（R108 时间线量过：`alphaJump=0`）。关掉之后颜色照样变，那就说明他看到的「变」
从来不是折射，是**透度**。开关摘掉的是他不在意的那一半，留着的是他抱怨的那一半。

那透度为什么一直在变？看求解器自己是什么形状（R102 起就是这样，一直没人质疑）：

| 环节 | R102~R108 的做法 | 后果 |
| --- | --- | --- |
| 重解节拍 | 每 900ms 读一次画面亮端（p99） | 画面每 0.9 秒重新「报一次光」 |
| 朝目标走 | 每拍补 34% 的差 | 差 0.5 也要三步走完，一直在动 |
| 死区 | 0.01 | 亮度噪声也算「要变」 |
| 退出条件 | `|next-cur| < 0.01` 才写 | 写入几乎每拍都发生 |

这四条合起来不是一种材质，是**一台测光表**。真实录像的亮端每帧都在起伏（树荫、车灯、白墙），alpha
就跟着一路涨落 —— 「先半透明、又变白底」「颜色会变、不稳定」两次反馈说的是同一件事，而 R108 我只
改了材质档位那一路，没碰这台测光表。

## 2. 改法

**① 撤掉折射开关（A3 全套）。** 指不到成因的开关只会多一行设置、多一个类、多一个偏好键、多两个诊断
字段、多五条 CSS 选择器。删掉：`#glassRefractBtn` 那一行、`toggleGlassRefract()` /
`updateGlassRefractLabel()`、`glassRefractOn/Off` 两个 i18n 键、`GLASS_REFRACT_KEY` 与
`glassRefractEnabled()`、CSS 里 `lens-refract` 的两条门控（五个面回到 R107 那一条
`html.glass-lens:not(.solid-material) … .lens-on`）、诊断里的 `refract=` / `pref=`。
材质档继续只由**能力**（`CSS.supports`）和**可读性**（求解）决定，不再有用户侧偏好。

**② 透度加迟滞：一台测光表 → 一块材质。** 规则不对称，因为两半的代价不对称：

| 方向 | 规则 | 为什么 |
| --- | --- | --- |
| 变厚 | **立刻**，没有死区、不等下一拍 | 薄了是读不出字，安全不能等 |
| 变薄 | 需求比现在低 **< 0.06** 当没变；≥ 0.06 要**连续稳 4 秒**；一次只退 **0.04**；退过一档重新计时 | 透度只是好看，得自己挣到放行 |

三条实现要点：
- 死区内**必须把稳定计时清零**。不清的话，四秒前一次没通过的小起伏会把时间戳留着，后面真降下来时
  第一拍就放行 —— 「稳四秒」等于没写（这条是写完后自查抓到的）。
- 每一档退之前仍然自己验一遍 AA：深色板 + 中灰/蓝墨时「越厚越安全」不成立（R103），退早了会经过
  一段不合格的值。不合格就不退，继续厚着。
- 材质重新挂上（`markGlassMaterial()`）时两个计时器一起归零，否则新档位会继承旧场景的退档时刻。

诊断把 `refract=/pref=` 换成 `thinHold=<g>/<p>ms`：真机再报「颜色还是会变」时，连读几次就能分清是
**真的在退档**（hold 在 0 与 4000 之间循环）还是**抖的只是读数**（hold 不动、`want` 在动而 `alpha` 不动）。

> **这条规则的代价，写明备查**：从最厚 .92 退到最透 .45 要 `0.47 / 0.04 × 4s ≈ 47 秒`。出隧道、离开白墙
> 之后卡片会「偏白」几十秒才慢慢透回来 —— 这是**故意**的：厚一点只是不好看，薄了是读不出字，宁可慢退。
> 若觉得这个滞后碍事，改 `GLASS_THIN_STEP`（0.04→0.08 时间减半）或 `GLASS_RELEASE_MS`（4000→2000）即可，
> 一个常量的事，不用动结构。

## 3. 顺带查清：1.2.185 上那 5 条红不是代码坏了

上一轮竖屏套件有 5 条「⋮ 面板压在画面上 ⇒ 该面在折射」报红，我当时明确说了没定根因。这一轮定完了：

- `devtools/r109-why-no-lens.js` 把 `markLensSurfaces()` 的三道闸逐个打印（有画面 rect / 这一面看得见 /
  重叠 ≥2%）。同一台机器、同一个 1.2.185、同一个套件：**37 条全绿**。
- 差别在状态与负载：跑红的那一场，这台机器 1 分钟负载 7~9（宿主机更高），探针里 `sleep(200)` 实测
  要 950~1000ms 才回来 —— 应用的 250ms 几何 tick 同倍数被拉长；而暂停态的解码器不交纹理时
  `videoWidth=0`，`rects` 直接空，于是**每一个面**都读成「没压到画面」，`lensLive=0`。
- 也就是说那 5 条红是量具缺基准（R91/R99 记过 `cells=0` 这一族），不是材质坏了。
- 修法在量具上：竖屏套件加一条硬基准「至少一路已经交出纹理，能算出画面矩形」，并把「红了要能一眼
  分清是哪道闸没过」写进那条判据的上下文（`rect=N / shown / 重叠=X%`）。以后这一族再红，读数自己会
  说是尺子还是实现。

## 4. 验收

| 套件 / 判据 | 结果 |
| --- | --- |
| 新尺子 `r109-alpha-oscillation.js`：播放 10 秒，上屏 alpha 的变化次数 / 往返次数 | 1.2.185（静态 CSS 底 255）：**5 次变化**，0.627→0.565→0.525→0.500→0.482→0.470，前 5 秒一路下探、后 12 秒才停 —— 场景什么都没变它还在走。1.2.186（真视频底 86）：**0 次变化 / 0 次往返**（50 拍）。两把尺子输入不同（一把 `src=css`、一把 `src=video`），所以这里只报「各自在自己那把尺子下走了几步」，不当同输入对照 |
| 新套件 `r109-alpha-stability.js`（真播放 10 秒不许往返 + 合成最坏测光输入） | **10 绿 / 0 红**。① 真播放 10 秒两组各 0 次变化、0 次往返；② 每 100ms 在 250/4 之间硬切 20 拍 → **0 次变化**（全程钉在厚档）；③ 之后持续 250 共 90 拍 → **退 2 档 0.880→0.840，间隔 4153ms，每档 ≤0.04 且逐档仍在 AA 之上**（不是钉死）；④ 探针崩了也会还原量具（`finally`），末次求解读回 `src=video` |
| `r102-verify`（竖屏 38 条，含新加的「有画面 rect」基准） | **38 绿 / 0 红**（1.2.186，`400x889@2.7`，底色 `video/86`）。同一份套件在 1.2.185 上复跑也是全绿 —— 见 §3 |
| `r102-verify-landscape`（横屏 20 条） | 待填 |
| `r108-verify`（A1/A2 保持；A3 改写成「撤销检查」5 条） | **9 绿 / 0 红**：A2 墨色集合关/开相等；A1 面板第一帧可见就带 `url()`；A3 那一行不存在、根上没有残留类、`glassRefractEnabled` 已不是函数、在场的 4 个面都有后景滤镜、读诊断不炸且不再带 `refract=/pref=`、`thinHold=` 在 `lens` 行里、撤销后透镜仍然上得来 |
| `r106-solid-tier-check`（两档×两主题×三屏×六面） | 待填 |
| `r108-panel-ink-diff.js`（closed 与 open 的墨色集合相等） | 绿：关着 4 种 / 开着 4 种，`added=[] removed=[]`；逐底色「关着解 == 开着解」（37 → 0.900/0.900，150 → 0.763/0.763）—— R108 那条 9→10 的成因确实收掉了 |

## 5. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| **1.2.186** | 撤掉折射开关 + 透度迟滞（变厚立刻 / 死区 0.06 / 稳 4 秒退一档 0.04）+ 诊断 `thinHold` + 竖屏套件补「有画面 rect」基准 | 待填 | 待填 |

## 6. 这一轮的教训

- **一个「指不到成因」的开关，成本远不止那一行 UI。** R108 加它花了：一个类、一个偏好键、两个 i18n 键、
  两个方法、五条 CSS 选择器、两个诊断字段，以及撤销时同样多的删除点。其中真炸过一次：`glassRefractEnabled()`
  删了而诊断行还在引用它，任何人读一次诊断就是 `ReferenceError`。加设备偏好开关之前先问「它能不能改变
  用户看到的那个现象」，改不了就别加。
- **自适应不等于要每拍都动。** 900ms 重读 + 34% 缓动 + 0.01 死区这套参数单个看都合理，合起来是把
  一种材质做成了示波器。以后凡是「按内容实时调外观」的东西，都要单独问一句：变化的**幅度门槛**是多少、
  要**稳多久**才放行、往哪个方向可以立刻、往哪个方向必须慢。
- **红了先别改实现，先让量具自证基准。** 那 5 条红追了整整一轮，最后一条 `paintedRects() >= 1` 就把
  「量不到」和「不合格」分开了 —— 这比任何解释都便宜。


# R110（1.2.186 → 1.2.187）真机两条「闪」：是谁把玻璃重新钉成了一块白板

用户两条：① 「打开 APP，界面会闪」；② 「播放视频时，打开设置界面，页面会闪（从玻璃透明到白色透明）」。

## 1. 复现：不是猜，是包了一层计数器

`devtools/r109-who-repins.js` 给 `markGlassMaterial()` 包一层「调用计数 + 前后 alpha」，然后依次做三件事：
点开 ⋮ 面板、关掉、直接调一次 `window.__tdashcamNativeState()`（这就是回前台 / 转屏时原生干的那一下）。
1.2.186 + AVD 的读数：

| 动作 | 上屏 alpha | 计数 |
| --- | --- | --- |
| 播放页稳定 | **.47** | 0 |
| 点开 ⋮ 面板 | **.92** | +1 |
| 关掉面板 | .47 | 1 |
| 调一次原生状态推送 | **.92** | +1 |
| 之后连采 12 秒 | .92（没回来） | |

两条反馈是**同一个缺陷**：`markGlassMaterial()` 每次被调用都把两组 alpha 钉回最厚档 `.92` 并作废已解结果，
而它的调用方 `markAccessibilityPrefs()` 挂在原生状态推送上 —— 那段代码的注释自己写着「MainActivity 在
每次 configuration change 和每次重新获得焦点时都会推一次」。**点开一个面板就会推一次。**

R108 我改的两件事（材质档位晚一拍、墨色跟开合走）都在求解器外面打转，没碰这条重钉路径；R109 的慢退档
反而让这块白板**停留得更久**（.92 → .47 要 ~47 秒）—— 也就是说我上一轮把「抖」治住了，却把「闪成白的」
放大成了「白很久」。这条是我自己引入的回归放大，记在这里。

## 2. 改法

- **只在材质「新挂上」的那一拍钉厚**：`markGlassMaterial()` 先读 `root.contains('glass-lens')`，已经挂着
  就只重算能力判据 —— 不动 alpha、不作废 `solved`、不清迟滞计时器。档位真的换了（`solid-material` 动了、
  或 `CSS.supports` 结果变了）才会走钉厚那一支。
- **开机那一拍改成同步解一次**：`startGlassAdaptation()` 原来是 `setTimeout(adaptGlassAlpha, 0)` —— 那是
  下一个宏任务，而在此之前浏览器完全可能已经画过一帧，于是刚钉上的 `.92` 真的被画出来了（= 反馈①）。
  改成同一个同步任务里钉完就解，中间没有绘制机会，那一帧根本不存在。
- 诊断加 `mounts=N`：`mounts>1` 就是「原生又推了一次状态」的凭据。下次他再报「闪」，一眼能分清是不是
  还有别的路径在重钉，而不用我再猜一轮。

## 3. 验收

| 判据 | 结果 |
| --- | --- |
| `r109-who-repins.js`：点开 ⋮ 面板前后 alpha 不变、`mounts` 不增长；关 / 开 / 调推送各一次全程不动 | **通过**（1.2.187，播放暂停、底色钉在 `video/95`）：`.90 →（点开面板）.90 →（关掉）.90 →（调一次原生推送）.90 →（再采 12 秒）.90`。同一把尺子在 1.2.186 上的读数是 `.47 → .92 → .47 → .92 → 停在 .92`。`markGlassMaterial()` 的包装日志里两条 `0.881→0.881`、`0.900→0.900` —— **函数照样被调用，只是不再改透度**，这正是「只在新挂上时钉厚」要的形状 |
| 冷启动那一拍：`mounts=1`，首帧读到的已经是解出来的值（不是 .92） | **通过**（1.2.189 冷启动后首读，不依赖探针包装器）：`glassState.mounts=1`、`solved=true`、`alpha=.45`（首页静态底解出来的那一档，不是钉出来的 .92）。上一行那个「探针复用了上一场的旧包装、计数器没记上」不再需要修 —— 计数器换成实现自己的 `mounts` 之后，这条判据不经过任何包装器 |
| `r109-alpha-stability.js`（10 条） | 1.2.186 上 **10 绿 / 0 红**。1.2.187 之后各轮（188~191）都在改同一段迟滞，**没有在 187 上单独复跑** —— 收口那一场的完整结果记在 R111 §7（1.2.191：10 绿 / 0 红） |
| `r102-verify`（竖屏） | 1.2.186 上 **38 绿 / 0 红**；1.2.191 上 **39 绿 / 0 红**（中间加进两条新判据），见 R111 §7 |
| `r108-verify`（9 条，A3 已改写成撤销检查） | 1.2.186 上 **9 绿 / 0 红**；1.2.191 上同样 **9 绿 / 0 红** |
| `r106-solid-tier-check`（两档×两主题×三屏×六面） | 1.2.186：**64 行读数、0 处 inset、四边等宽** |
| `r102-verify-landscape`（横屏 20 条） | **20 绿 / 0 红**（1.2.191 真旋转复跑；1.2.186 那一场旋转时 WebView 无响应，作废） |

### 3b. 环境取证：模拟器这一场的 ANR 不是包的错

装机后每次启动约 25 秒必 ANR 一次，`am_anr` 签名是 `Input dispatching timed out … Waited 5010ms for FocusEvent(hasFocus=true)`，
而 `/data/anr` 里抓到的**是 system_server 自己的主线程**停在
`InputMethodManagerService.onImeInputTargetVisibilityChanged → waiting to lock ImfLock`（同一时间 `com.android.phone`、
`dialer` 也在 ANR）。也就是说焦点事件根本派发不出来，APP 是受害者。客户机当时只剩 130 MB free / swap 用掉 600 MB。
处理：`adb reboot` + `am kill-all` + `echo 3 > /proc/sys/vm/drop_caches` + `devtools/emulator-ready.sh`，落定后一次跑通。

## 4. 这一轮的教训

- **「自适应」的每一条重钉路径都要问：谁会在用户操作时调到它。** 我盯着求解器调迟滞，却漏了材质挂载
  本身被一个高频事件（窗口焦点）反复触发 —— 症状一模一样，成因完全不同。以后凡是「XX 会闪」，先给
  嫌疑函数包一层计数器再猜，比读代码猜三轮快。
- **修一个观感缺陷时，要回头算它会不会放大上一个修复。** R109 的慢退档 + R110 的重钉 = 「白很久」，
  比原来的「闪一下」更糟。两个各自正确的规则叠在一起，不一定还是正确的。
- `setTimeout(fn, 0)` 不是「立刻」，是「下一拍可能已经画过一帧之后」。凡是「为了别闪一下」而做的
  立即修正，都要放进**同一个同步任务**里。

## 5. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| 1.2.186 | 撤掉折射开关 + 透度迟滞（变厚立刻 / 死区 0.06 / 稳 4 秒退一档 0.04）+ 诊断 `thinHold` + 竖屏套件补「有画面 rect」基准 | 28,082,955 B | `8b5b05eb64656716e76ab942178f40df`（sha256 `abc42167…6d74585`，SO_MATCH 两 ABI 一致） |
| **1.2.187** | R110：材质只在**新挂上**时钉厚（重复状态推送不再把玻璃顶回 .92）+ 首次求解改同一同步任务（开机那一帧 .92 不再被画出来）+ 诊断 `mounts=N` | 28,083,339 B | `5b72e47c2fd4ba308cfd91acba22b3be`（sha256 `fdfec0bb…14f2481`，SO_MATCH：arm64 `da44d85b…`、x86_64 `9143ac52…`） |

> 1.2.186 的验证是在它自己那台机器上跑完的（见 §4 表），但它**不含** R110 的修复；对外发的是 1.2.187。

---

# R111（1.2.187 → 1.2.191）R109 那套迟滞，自己藏着三条走不通的路

R110 把「白板闪」钉死之后，我按用户报的「颜色还是会变」把 R109 的迟滞拿去实测，结果是**我的修法本身**
有三条走不通的路。三条都是量出来的，不是读代码读出来的。

## 1. 第一条：稳定计时被死区反复清零 —— 真实录像上永远退不下来

`devtools/r110-release-audit.js` 强打 `luma=250` 连续 60 拍，1.2.187 上的读数：

| 量 | 读数 |
| --- | --- |
| 上屏值 `v` | 0.881 → 0.881（14.5 秒不动） |
| 需求 `want` | 0.822（一直低着） |
| 稳定计时 `hold` | **-1**（从来没攒起来过） |

成因在 `ramp()` 的第一支：需求落回死区以内时，除了「当没变」，它还顺手把 `glassState[hold] = 0`。
真实录像的需求每 900 ms 就在 `cur-0.06` 上下抖，**抖回死区一次就把四秒从头攒**，于是「连续稳 4 秒」
等于永远满足不了 —— 材质一旦因为某个暗场景厚起来，就再也回不来。竖屏套件里那条「等它收敛」等了 60 秒
仍停在 .88（需求只要 .45）就是这么红的。

改法：清零只留给「变厚」那一支（那才是场景真的换了方向）。「还没低够」不是反证，只是还没到。

## 2. 第二条：一档比死区小 —— 退档走不完最后那半档

第一条改完，1.2.188 复测同一把尺子：

| t | v | want | hold |
| --- | --- | --- | --- |
| 1 ms | .920 | .822 | 0 |
| 1 532 ms | .920 | .822 | 1531 |
| 2 919 ms | .920 | .822 | 2918 |
| **4 343 ms** | **.880** | .822 | -1 |
| 13 121 ms（末拍） | .880 | .822 | -1 |

`hold` 确实攒到四秒并放行了一步 —— 第一条修对了。但**只有这一步**：一档 `GLASS_THIN_STEP = .04` 比
门槛 `GLASS_DEADBAND = .06` 还小，退完这一步，差距 `.058` 掉进死区，下一档再也开不了场。
等于「材质一旦厚起来，永远比需求厚半档」。

这不是把 .04 调成 .06 就能了事的：门是**死区**，不是档，改档只改步进大小，最后不足一档的差照样走不完。

改法：给每一组加一个「正在退档途中」的身份（`glassState.releasingGlass / releasingPlate`）。
**开场**必须过死区（这就是防噪的那半），可一旦开出来，就一路走到需求上（差 ≤ 0.012 收工并解除身份）。
走完这一轮，下次还要退，仍得重新攒够「死区 + 4 秒」。诊断里新增 `rel=g/p`：真机再报「颜色会变」时，
`rel` 恒 0 而 alpha 在动 = 变厚那一侧在做事；`rel` 亮着 = 是退档，两件事的修法完全不同。

## 2b. 第三条是上一轮的判据自己抓出来的：退档退到了「窗口里更高的需求」之下

§2 的修法装机后复跑全套，`r109-alpha-stability` ① 报红两条，读数是**往返**：

```
3 023ms 0.882 → 0.840      （退一档）
5 680ms 0.840 → 0.882      （需求又冒上来，「变厚立刻」把它加回去）
```

白玻璃与数据板各一次，幅度正好一档。这就是我这条迟滞自己造出来的抖 —— 用户说的「颜色还是会变」换了个成因回来了。

根因是「稳 4 秒」这四个字我实现错了：它判的是**最后一拍**需求低不低，而不是**这四秒里需求最高到过哪**。
真实录像的需求在 .882 / .840 之间交替，于是「攒够四秒 → 退一档 → 被另一半拍回原形」，每 5.7 秒一个来回。

改法：稳定计时一武装就记下窗口起点的需求，之后每拍只往上抬（`peakGlass` / `peakPlate`），
退档的目标改成 `max(peak, cur - 一档)` —— **不许退到这四秒里见过的最高需求之下**。
需求若真的 sustained 变亮，peak 自己就低，退档照样一路走到需求上（`r110-release-audit` C 相那条钉出来的
持续变亮仍然要走完：`.92→.88→.84→.822`，实测已复验）；需求只要还在原地抖，peak 就把它托住，一步都不退。
诊断里加 `pk=峰值需求`：真机读 `alpha == pk` 就是「被窗口最高点托着」，那是设计，不是卡住。

代价说清楚：这等于把「退档」的门槛从「当下低」改成「整窗低」，在一段亮度交替的录像上材质会**停在厚的那一档**。
我选这个方向 —— 厚度多一点看不出，颜色自己来回变看得出，而且后者是用户连着两轮报的同一句话。

## 3. 同一把尺子顺带查出的两条「颜色会变」路径

追 B 相那条读数时（`devtools/r111-plate-mismatch.js`，150 拍 × 200 ms，自己把播放开起来），
抓到的不是 R107 拆分漏了面，而是两条**别的路径**在动透度。两条都改，都进判据。

### 3a. 「量不到底色」那一支可以立刻把材质踹薄

`adaptGlassAlpha()` 采不到底色时（暂停、换段那一瞬、解码器没交纹理）原来是
`removeProperty` 两个变量，让 CSS 回落到写死的 `.72 / .62`。这是整条迟滞里**唯一一支「立刻变透」**：
压在很暗那一帧上解出的 `.92`，被一次量不到一脚踹回 `.62` —— 卡片颜色自己变一下，用户看到的正是它。

改法：这一支只许往厚走（`Math.max(当前值, 兜底档)`），并把算出来的值继续写进变量而不是摘掉。
判据同步改：底色不可测那一拍，`--lens-alpha` 必须 **≥ 兜底档**，出现比 .72 更透就是又开了变透的口子。
R111 实测这条在本机 100 拍里一次没进过（`src` 只在进播放那一刻 css→video 换过一次，`none` 0 拍），
所以它是「与规则矛盾」而不是「正在咬人」—— 但矛盾留着，下一轮就会被别的成因掩盖。

### 3b. 数据卡片的底色带 0.3 秒过渡

`.metadata-panel` 的 `transition: transform .4s, opacity .3s, **background .3s**`。求解器每 900 ms
写一次 `--lens-alpha-plate`，而过渡会让面在 0.3 秒里**滑过中间值** —— 中间值谁都没验过 AA
（对比度对 alpha 非单调，R103 记的就是这件事）。读数：150 拍里 **16 拍「面上的 alpha ≠ CSS 变量」**，
最长一次连着 800 ms 停在**上一档**；审计那五拍更是 `面 0.45 / 变量 0.548` —— 卡片比求解结果更透的那一段。
CSS 变量与 `glassState` 全程 0 分歧（`varVsState=0`），所以写的人没错，是**画的人慢一拍**。

改法：把 `background` 从这条 transition 里摘掉（显隐仍走 `transform / opacity`）。
迟滞本身已经把变化做成「四秒一档」，中间不需要再补一层滑行；观感上少一次「颜色慢慢变过去」。
新判据走 `SURFACES` 逐个读 `transitionProperty`/`transitionDuration`，任何带 `background`/`color`
（或 `all`）且时长 > 0 的都算红 —— 不写死那一条规则，以后谁再往玻璃面上加底色过渡会被当场抓住。

## 4. 判据也跟着改了两处

| 判据 | 改前 | 改后 |
| --- | --- | --- |
| `r110-release-audit` C 相 | 「退 ≥ 2 档就算通过」——窗口再长 4 秒它就会把「退 1 档后钉死」读成绿 | 判**末值落没落在需求上**（`|v-want| ≤ 0.012`），且起始值由探针**钉成 .92** 再放开 |
| `r102-verify` R107 解耦那条 | 拿当下写出来的值和需求比，不等就红 → 起了「等它放下来，最多 60 秒」的轮询 | 把迟滞**旁路掉**再比：置 `solved=false`（运行时本来就有的「刚挂上还没解」状态）→ 同一同步任务里解一拍 → 原值放回。60 秒轮询删掉 |
| `r102-verify` 底色不可测那一拍（新） | 「等于兜底那档 .72」 | 「**至少**和兜底一样厚」（`la ≥ .715`，实心档本来没变量所以放行）—— 出现更透就是又开了变透的口子 |
| `r102-verify` 玻璃面过渡（新） | 没有这条 | 逐个面读 `transitionProperty`×`transitionDuration`，任何 `background`/`color`/`all` 且时长 > 0 都算红 |

第二条不是口味问题：AVD 一条片子只有 7~8 段 × 18 秒，60 秒轮询跑完时预览早就空了，后面几条要样本的
判据跟着一起红（那两条「退场判据有样本可测 = 0 个」「关掉无障碍开关后材质回得来 = 样本(无)」全是它带的）。
把「收敛要多久」和「两组有没有各解各的」混在一条判据里，等于让一条判据决定另一条判据能不能测。

## 5. 这一轮的教训

- **「两条规则各自正确」不等于「叠起来正确」。** 一档和死区是同一个文件里挨着写的两个常量，它们的大小
  关系我从来没看过。以后写迟滞，把「步进 / 门槛 / 终止条件」三者的数量关系当一笔算术检查做一遍：
  `step < gate` 且 `gate` 判的是「和当前值的差」，那这个循环必然停在 `gate` 处，不是停在目标处。
- **判据要问「停在哪」，不能只问「动没动」。** 「退 ≥ 2 档」放过的是「退到一半钉死」这一支的姊妹 ——
  这次它恰好红了，但如果我的窗口再长 4 秒，它就会假通过。
- **量「退得动」必须人造起始值。** 不钉 .92 的话，暗场景里 `v == want == .45`，「一步没退」和
  「无需退」在同一份读数里长得一模一样（R101 那条「空状态下的没压到是空话」的又一命中）。
- **轮询的长度是一种耦合。** 判据等得越久，它就越依赖「场景在这段时间里不许变」这个前提；真实播放
  的片子长度是外部条件，不是它能假设的常量。旁路掉不测的那一半，比把它等出来干净。

## 6. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| 1.2.188 | 迟滞第一条：死区以内**不再清零**稳定计时（真实录像终于能退档） | 28,083,403 B | `318bcca8d21074ce9edce7c4e3f36b70`（sha256 `3316d35a…67c2881c`，SO_MATCH：arm64 `5950651d…`、x86_64 `0e405de0…`） |
| 1.2.189 | 迟滞第二条：`releasingGlass/Plate`「退档途中」身份，退档一路走到需求上；诊断新增 `rel=g/p`；`r102-verify` 的 60 秒轮询换成旁路迟滞的即时判据 | 28,084,171 B | `0b584f64fba3a2d7391c99399b45822e`（sha256 `e1616984…b3df024ca8cdd6`，SO_MATCH：arm64 `e3c7d68e…`、x86_64 `757827d9…`） |
| 1.2.190 | ①「量不到底色」那一支只许往厚走（不再一脚踹回 .62）②数据卡的 `background .3s` 过渡摘掉（不再滑过没验过 AA 的中间值）③两条新判据 | 28,083,663 B | `293e5b7be07fb1dda7438c3d17b3d384`（sha256 `d91d0531…99e909cd`，SO_MATCH：arm64 `cb738cc6…`、x86_64 `3a2a9abc…`） |
| **1.2.191** | §2b 那条往返的修法：退档目标改成 `max(peak, cur - 一档)`，peak = 稳定窗口里需求到过最高的一档；诊断新增 `pk=`；判据两处口径修正（§8） | 28,084,171 B | `7af3571da5c6d6080096afceb6f2c298`（sha256 `c11d2d14…b64e3fbb`，SO_MATCH：arm64 `bf7d728f…`、x86_64 `01eeafc0…`，装机回读 versionName=1.2.191） |

## 7. 验收（1.2.189 起，收口在 1.2.191）

| 判据 | 结果 |
| --- | --- |
| `r110-release-audit` C 相：钉成 .92 后强打持续变亮，必须**走完**到需求 | **通过**（1.2.189，真播放 120 拍 / 30.3 s）：`.92 →(4 062 ms) .88 →(8 374 ms) .84 →(12 859 ms) .822`，此后 17 秒纹丝不动、`rel=0`。同一把尺子在 1.2.188 上是「只走得出第一步，末值 .88 / 需求 .822」 |
| 同一次采样的 A 相（真播放 20 秒） | 求解器写的值**一次都没降过**（`A_solverDowns=[]`），面上也没抓到往返；`src` 只在进播放那一刻 css→video 换过一次，`none` 0/100 拍 |
| `r111-plate-mismatch`（150 拍 × 200 ms，探针自己把播放开起来） | 抓出 §3b 那条 `background .3s`：CSS 变量与 `glassState` 全程 0 分歧，但 16 拍「面 ≠ 变量」、最长连着 800 ms 停在上一档 |
| `r109-alpha-stability`（10 条） | **10 绿 / 0 红**（1.2.191）。同一把尺子在 1.2.190 上是 **8 绿 / 2 红**，红的就是 §2b 那条往返：`3 023ms .882→.840` 接 `5 680ms .840→.882`（白玻璃与数据板各一次） |
| `r102-verify`（竖屏，含 §4 那两条新判据） | **39 绿 / 0 红**（1.2.191；1.2.190 那一场 36/3，三条红全部结案：两条是 §8 的清单口径与「量具没基准」，一条是 §2b 的往返）。「玻璃面底色不参与过渡」「不可测那一拍不许比兜底更透」两条新判据都在绿的这 39 条里 |
| `r102-verify-landscape`（横屏 20 条） | **20 绿 / 0 红**（1.2.191，真旋转之后复量） |
| `r108-verify`（9 条撤销检查） | **9 绿 / 0 红**（1.2.191） |
| `r106-solid-tier-check`（两档×两主题×三屏×六面） | **通过**（1.2.191）：逐边四边等值（`border=0.74/0.74/0.74/0.74`）、**inset 数 0**、深度只剩外阴影 |
| `r109-who-repins`（R110 那条重钉判据复跑） | **通过**（1.2.191）：暂停播放 → 点开 ⋮ → 关掉 → 手动推一次原生状态 → 再采 12 秒，全程 `alpha=.90` 不动；`openMounts=0`，`pushMounts=1` 而前后值 `0.900→0.900` —— 函数照被调用，只是不再改透度 |
| 目视核对（`adb exec-out screencap -p`，带视频平面） | 看过 `devtools/shot-191-glass.png`：六宫格 / HUD pill / 底部条都在，边框一圈一种颜色、顶部无双线。**但** `alpha=.90` 下 HUD pill 与底部条看着就是两块实心黑卡 —— 那是 §9 那条待拍板，不是本轮回归 |

## 8. 量具修正了两处（不是产品缺陷，但都会造假红）

| 位置 | 错在哪 | 改法 |
| --- | --- | --- |
| `r102-verify` R107 解耦那条的「白玻璃那组」清单 | 判据用自己那份 `SURFACES` 再按 `display!==none` 筛，运行时用的是 `LENS_SURFACES` 且**只看节点在不在 DOM**（R108 A2 起不再看可见性）。少算一个收起的长按菜单 ⇒ 判据算「应 .45」、运行时写 .88，红成「解耦没生效」 | 判据改取 `LENS_SURFACES` 同一张清单，筛法与运行时逐字对齐 |
| 「退场判据有样本可测」/「关掉无障碍开关后材质回得来」 | 这两条量的是「挂着 `url()` 的那个面」。前面那些判据加起来跑掉一分钟，AVD 的片子早播完了，`.lens-on` 全退 ⇒ `0 个：无` / `now=blur(22px)`。是**量具没基准**，不是材质坏了（R101 同一条） | 开工前先把播放接回来，并轮询到至少一个面挂上材质（上限 6 秒），再量退场 |

## 9. 一条待拍板（本轮没改，因为它不是缺陷而是取舍）

实测（1.2.190，单路播放、底色 75）每个面对白玻璃那组的需求：

| 面 | 此刻 | 墨色数 | 需要的 alpha |
| --- | --- | --- | --- |
| 底部条 `.phone-action-bar` | 在屏 | 2（浅灰白读数） | **0.450** |
| 收起的长按菜单 `.card-context-menu` | `visibility:hidden` | 2（含系统红 `rgb(255,69,58)`） | **0.842** |
| 收起的 ⋮ 头部组 `.header-collapsed …` | `visibility:hidden` | 4 | 0.450 |
| 行车数据卡片（单独一组） | 在屏 | 2（白 / 蓝） | 0.548 |

也就是：**屏幕上正在看的那块底部条只要 .45，而一个此刻根本看不见的长按菜单里的删除红，把整组白玻璃钉到 .84~.90**。
这正是 R108 A2「墨色约束与开合无关」那条决定的代价 —— 它当时是为了保护收起的 ⋮ 面板（点开时不该先薄后厚），
逻辑对，但效果是常年看不见的菜单常年决定常年在屏的底部条。三个选项：

- **A. 维持现状**：可读性优先，代价是白玻璃常年偏厚（用户看到的「像一块板」有一半是这个）。
- **B. 按面各写一个变量**（把 R107 的两组细分成逐面）：底部条回 .45，菜单自己点开时才变厚 —— 但「点开那一下颜色变一下」
  就是 R108 用户报的第一条，等于把那个症状按面重新引入。
- **C. 只把那支系统红单独处理**：删除行的红字改成加粗/加底色衬托，让它对 alpha 的要求降下来（治墨色，不治分组）。

我推荐 **C**：它同时拿掉「钉厚」的成因和「开合变色」的风险，而 A 是把问题留着、B 是换一个更糟的问题。
需要你点头才动，因为它改的是删除行的文字样式，属于观感取舍不是缺陷。

---

# R112（1.2.191 → 1.2.192）用户选了 ①：面板自己在变 —— 淡入把玻璃乘穿了

## 1. 这一轮先没复现出来，于是把「谁在变」拆开量

用户报「播放时打开设置，界面还是会变一下，没有统一，显得割裂」。我先按 R111 那套量法测了一遍，
三条事实都是硬的：

| 测什么 | 结果 |
| --- | --- |
| 开合那一下透度动没动 | **没动**：`alpha=.900 / plate=.685` 在「关 → 开 → 关 → 手动推一次原生状态 → 再采 12 秒」全程一个数 |
| 面板之外有没有别的东西变 | **0 像素**：底部条、行车数据卡、面板外区域，两张 screencap 逐盒比对 `MAD=0.00 max=0`（视频是暂停的静止帧） |
| 同一屏是不是同一种材质 | **不是**：⋮ 面板压在画面上 → 挂 `url()` 折射；底部条/数据卡没压到 → 只有 `blur`。这是 R105「材质跟着内容走」的设计 |

复现不出「变一下」，我就没有猜着改，而是把三种可能拿给用户选。他回 **①：面板一出现，它自己先浅后深 / 先透后白地变一下。**

## 2. 成因：入场淡的是 `opacity`，而这一块是玻璃

`.header-collapsed .header-right.active .header-actions-group`（styles.css:296）原来写的是
`transition: opacity .2s, transform .2s, visibility 0s`，关闭态是 `opacity: 0`。
**玻璃面的元素 opacity 是乘在板的 alpha 上的** —— 淡入这 0.2 秒里，材质从「几乎没有」一路走到求解器
算出来的那一档（浅色主题那档是白），于是「先透后白」。求解器没错、透度没变，变的是这一层的透明度。

这和 R111 §3b 摘掉数据卡 `background .3s` 是**同一族**：动画带着材质穿过没被验证过的中间值。区别只是
那次穿的是 `background-color`，这次穿的是 `opacity`。

## 3. 这一轮我自己踩了两个仪器坑（值得记下来）

1. **「没采到中间值」不等于「没有淡入」。** 第一版用 `setInterval(…, 50)` 采样，这台负载下的 AVD 实际
   50~500ms 才跳一次，0.2 秒的淡入整个被跨过去 —— 我差点把「量不到」读成「不淡」。
2. **冻求解器把材质标记一起冻了。** `clearInterval(glassAdaptTimer)` 之后 `.lens-on` 不再刷新
   （`markLensSurfaces()` 是 `adaptGlassAlpha()` 里顺带调的），于是第二次实验的面板根本没挂透镜，
   A/B 两边量的不是同一个东西。
3. 最后定案没靠帧采样（这台机器 ~3fps，量不动 200ms 的过程），改成**判据化**：在打开态读
   `getComputedStyle(panel).transitionProperty`。改前 `opacity,transform` → 红；把修法注进页面后
   `transform` → 绿。先看到红再动手，改完当场看到绿。

## 4. 修法：入场不淡，退场照旧淡出

CSS 过渡有方向性 —— 加类时生效的是 **active 规则**的 transition，摘类时是 **closed 规则**的。所以只把
active 那条里的 `opacity` 摘掉（留 `transform` 滑入 + `visibility` 命中测试），面板第一帧就是最终材质，
关闭时仍然淡出，不会凭空消失。新判据进 `r102-verify`：打开态的 transition 里出现 `opacity` 或 `all`
（且时长 > 0）就算红。

## 5. 同族但这一轮没动的两处（第三处查过了，到不了手机端）

- **HUD 数据卡**的 `opacity .3s`：折叠/展开时同样是「材质自己长出来」，形状一模一样。没动是因为用户这次
  报的是设置面板，而这块卡的折叠是它自己的状态切换，改了要重做一遍折叠观感的验收。
- **底部条**的 `opacity .22s`：只在开机那一拍会用到，而 `html.phone-boot` 已经把开机期的过渡压住了。
- **`.metadata-panel.dragging` 查过、判定不用管**：这一条里还留着 `background 0.3s`，而且把底色硬写成
  `rgba(30,30,30,.8)` —— 看着像 R111 §3b 漏掉的一处。实际上手机永远走不到：加这个类的是 mousedown 分支，
  而它在 `isPhoneLayout()` 那道门（script.js:4068）之前就 return 了；手机端横屏拖卡片走的是
  `hud-dragging`，那条规则写的是 `transition: none`。桌面端本来就不参与这次的验收，所以不动。
- **#402 还挂着**：面板淡到位之后**仍然是块白板**（白玻璃整组被收起的长按菜单里那支系统红钉在 .90）。
  这条治的是「变完之后长什么样」，和这一轮治的「变的过程」是两件事，等你拍板。
  **收尾时补两条读到的事实（把 #402 的说法校正一下）**：
  1. **收起的菜单确实一直在约束集合里** —— `surfEls` 只按「节点存不存在」筛（script.js:1467），
     `display:none` 也收；R108 又把面内的墨扩到「所有带字的叶子、不看可见性」。所以那支红是**常年**参与求解的，
     这条原来的说法成立。
  2. 但**它要多厚是跟着底色走的**。这一轮冷启动后量到的是 `alpha=.450 inks=15 unsavable=0 src=css`
     —— 没在播（底色取 CSS 那层、且是深色主题）时它只要最透档；`.842` 那个数是**浅色主题 + 亮画面**下量的。
     所以 #402 的准确说法是：**亮录像上**，一块平时看不见的菜单里的红字把三块白玻璃抬到 ~.90；
     暗场景/没播时它们是真透的。这既解释了「有时像玻璃有时像白板」，也让 C 的目标更清楚：
     不是把材质整体调薄，而是让那一种墨**在亮底上**也够用。

## 6. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| **1.2.192** | ⋮ 面板入场不再淡入（`opacity` 从 active 规则的 transition 里摘掉，退场保留淡出）+ 一条新判据 | 28,084,555 B | `32f9801db49c56efa5d8a0bef9c8ad90` |

sha256 `1a96a29b0710ebb24ce52ffc22c16fb952e41e51a81f5151bdd41a0afc056952`；SO_MATCH arm64
`aa77681cb75fa33ac17aed3ac4a4b736` / x86_64 `a41e24fc957dc3a94d883e546fdaaf97`。装机后回读
`versionName=1.2.192`。

## 7. 验收（同一实例、同一台 AVD，冷启动后跑）

| 判据 | 结果 |
| --- | --- |
| 新判据「⋮ 面板入场不淡入」 | **绿**：`打开态在动的属性=transform`（改前是 `opacity,transform`） |
| 「玻璃面的底色/透度不参与任何过渡」 | 绿：无一面的 transition 里带 background/color |
| r102-verify 竖屏全量 | **40 / 0**（R111 那轮是 39 条，这一轮多了上面那条） |
| r102-verify 横屏全量 | 20 / 0（`889x400@2.7`） |
| r109-alpha-stability | 10 / 0，`real=0`（真实录像上没有一次「材质自己来回变」） |
| r110-release-audit | C **PASS**：`0.92→0.88→0.84→0.822` 走完 3 档落在需求上，**往返 0**；`A_srcFlap` 换源 0 次、none 0/100 拍；`B_plateMismatch=0 B_glassMismatch=0` |
| r109-who-repins | 开→关→原生状态推送全程 `alpha=.90` 不动；稳态 `mounts=0`，推送那一次 `0.900→0.900` |
| r106-solid-tier | 六个面 × 三种屏 × 两主题：`inset数=0`、四边 `0.74/0.74/0.74/0.74` |
| 目视（`adb screencap`，不是 CDP 截图） | 深色 + 浅色各拍一对（面板关 / 真点击底部「设置」开）：入场第一帧就是最终材质，没有「先透后白」；浅色那一张面板确实是块白板 —— 那是 **#402**，不是这一轮 |

「打开设置」这一路在手机上**没有** ⋮ 按钮：`.main-header .header-menu-btn` 在手机档是 `display:none`
（styles.css:5011，图标已经搬进底部条），入口是底部条那颗 `data-action="more"`。截图就是真点它出来的。

## 8. 环境这一轮踩到的两件事

- AVD 的 qemu 进程跑到后来积到 **4126 个线程**，客户机里 `ActivityManager` 开始以「start timeout /
  bg anr」为名成片杀进程（连 Google 自家组件都被杀），APP 起来 20 秒就没了。`adb reboot` 治不了
  （线程在 host 侧那个进程里），要**把 qemu 进程停掉重开**：`Stop-Process qemu-system-x86_64-headless`
  再 `emulator.exe -avd tdashcam_phone -no-window -no-audio -gpu auto -no-snapshot-load`。
- `nohup qemu… &` 在这个 Git Bash 里会**静默不启动**（`No such file or directory`，因为 PATH 里没有那个
  exe 的目录）；要么写全路径，要么走 `emulator.exe`。
- 收尾时用 `input keyevent 4` 关面板，直接**退出了 APP**（R107 记过这条，这次又踩）—— 关面板要点回
  底部条那颗 `more`，别按返回。

# R113（1.2.192 → 1.2.193）真机两张相隔 4 秒的截图，把 R111 那条修法本身问倒了

## 1. 这一轮的输入是用户给的，不是我量出来的

他发了两张小米 14 的截图，同一块 ⋮ 面板，头部事件时钟一个 `07:31:00`、一个 `07:31:04`：
第一张面板是**半透明**的（能透出底下的宫格），第二张是**一块白板**。配的话是
「问题还是存在，先是半透明的界面，然后很快变成白底的界面」。

R112 治的是 0.2 秒的淡入，那张面板第一帧就该是最终材质 —— 也就是说 **R112 那一刀没切到这一条**。
区别还有一处：他这两张是**浅色主题**，而我这一整套验收跑的是深色（跟随系统在这台 AVD 上落到深色）。

## 2. AVD 为什么复现不出来 —— 顺手把这件事问成了一个成因

为了按他的配置复现，我把 AVD 切到浅色主题、进播放、开面板，100 ms 一拍采了 11 秒。结果是：

| 采什么 | 结果 |
| --- | --- |
| `glassState.src` | **110 拍全是 `css`**，一次都没走到 `video` |
| `measureBackdropLuma()` 直接调 | 同一时刻返回 `cells=6 luma=107`（六路都有纹理） |
| 求解器那一拍读到的 | `cells=0` —— 它自己那一拍量不到 |
| `--lens-alpha` | 全程 `.450` 一动不动 |

原因在 `measureBackdropLuma` 的那道黑帧守卫（R91/R94 加的）：解码器**一暂停就不再把纹理交给 canvas**，
整帧读出来是 0 → `p99<=0` → 这一路跳过 → 六路全跳 → `cells=0`。所以这台 AVD 只要不在真播，
`src` 就永远停在 `css`，**「量不到底色」那一支在 AVD 上根本走不到有视频可测的现场**。
这不是量具坏了，是它把「AVD 验不到这条路」这件事说清楚了。

## 3. 走到那条路上以后，R111 的修法自己就是个变厚器

`used < 0`（视频和 CSS 两头都量不到）那一支，R111 写成：

```js
glassState.alpha = Math.max(glassState.alpha, 0.72);   // 「只许往厚走」
```

R111 当时的理由是堵住反方向的洞：那之前是 `removeProperty`，让 CSS 回落到写死的 `.72/.62`，
于是压在暗帧上解出的 `.92` 会被一次落空一脚踹回 `.62` —— 整条迟滞里唯一能**立刻变透**的路径。
堵住了变透，却开出**立刻变厚**：本来合法解出来的 `.45`，一次采样落空就被推到 `.72`，
而变薄要 4 秒稳住了才退一档 —— **一次一闪，白好几秒**。这就是他那两张截图的形状。

根子上的说法是：**量不到底色 = 没有新信息，不是「底色变亮了」**。屏幕上还挂着上一帧，
而那一帧正是上一次量过的那帧，所以这一拍什么都不动才是对的。从没解过的情形不用这里兜：
初值本来就是 `.72`，材质新挂上那一拍由 `markGlassMaterial` 从 `.92` 起步。

## 4. 但我不想再靠推理选成因 —— 台账进 APP

R112 那轮的教训是「量不到就别改」，这一轮的教训是**真机独有的路径，就得让真机自己带回来**。
所以这一轮同时做两件事，第二件是主体：

- 三个写 `--lens-alpha` 的地方（`mount` / `no-src` / `solve`）收进一个 `writeLensAlphas(g, p, why)`，
  值真变了才记一笔：`@毫秒 前值→新值 哪一支/方向 want src luma cells lens ink mounts`，留最近 14 条。
- 诊断里多一行 `alphaLog=`。他复现一次、点「复制诊断」，我就能直接看出是**哪一支**写的、
  当时手里有什么证据 —— 不用再从两张 JPEG 反推。

读法写在代码注释里：`厚` 且 `why=no-src` = 没量到却被推厚（这一轮堵掉的正是它）；
`why=solve` 且 `want` 一起涨 = 画面真变亮了，那是设计；`why=mount` = 原生又推了一次状态。

## 5. 判据跟着换口径

r102-verify 里那条从「底色不可测那一拍，值不许比兜底档 `.72` 更透」换成
**「底色不可测那一拍什么都不动」**：① `--lens-alpha` 必须等于 `glassState.alpha`（没人偷偷摘变量）；
② 台账里一条 `no-src` 写入都不许有。前一条只堵得住变透，把变厚放过去了 —— 这就是它这次没拦住的原因。

新工具 `devtools/r113-nosrc-hold.js`：把两头都人造量不到，跑一拍，看材质沉不沉；
带对照组（只让视频量不到、CSS 量得到时**必须**照常求解），防止把这条路整个堵死。

## 6. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| **1.2.193** | 材质变化台账（诊断多一行 `alphaLog=`）+ `used<0` 那一支不再推厚 + 那条判据换口径 + 退档审计的窗口改自适应 | 28,085,519 B | `217a0f4f1bdd3437fc67090f461f8421` |

sha256 `1df28a4092dcaba9a3515fae81d5e72b1b3b790b07088484bd6d56de5ef9e6ef`；SO_MATCH arm64
`ff2de09b029cf24c67419322c469c781` / x86_64 `ec93cf2120dd505ae325b49b6717c8d7`。装机回读 `versionName=1.2.193`。

## 7. 验收（同一实例）

| 判据 | 结果 |
| --- | --- |
| **新** r113-nosrc-hold「量不到那一拍材质一动不动」 | **绿**：`.45 → .45`（moved 0 / cssMoved 0 / `noSrcWrites=0`），对照组证明路没堵死 —— 只让视频量不到而 CSS 量得到时照常求解（`.45→.763`）。**改前在同一台机器、1.2.192 上跑同一支：红，`.45 → .72`** |
| 台账本身在工作 | `ledgerTail`：`mount/厚 -1→0.92` · `solve/薄 0.92→0.45` · `solve/厚 0.45→0.92` |
| r102-verify 竖屏 | 40 / 0（`⋮ 面板入场不淡入` 仍绿；那条换口径的判据这一轮**没进那一支** —— 本轮底色一直可测，所以由上一行直接取证） |
| r102-verify 横屏 | 20 / 0（`889x400@2.7`） |
| r109-alpha-stability | 10 / 0，`real=0` |
| r110-release-audit | C **PASS**：`.92→.88→.84→.822`，档间隔 `[4258, 4268]ms` 全在 3.2~7s 节拍内、往返 0；`B_plateMismatch=0 B_glassMismatch=0`；`换源 0 次` |
| r109-who-repins | 开→关→原生推送全程 `.90` 不动，稳态 `mounts=0` |
| r106-solid-tier | 六面 × 三屏 × 两主题 `inset=0`、四边 `0.74/0.74/0.74/0.74` |

审计那条 C 判据第一次跑是 **FAIL**，但不是实现退不动 —— 是判据把窗口写死成 120 拍 / 24 秒，
那是按「需求 .822、退 3 档」定的；这一轮场景暗、需求 `.45`，从 `.92` 退到底要 12 档 ≈ 50 秒，
窗口不够就只能判它「没退完」。改成按退距算窗口 + 允许「窗口用完但仍在按节拍退、且 0 往返」算过，
改完单独复跑即 PASS（App 二进制未变，其余套件结果同一次跑批内有效）。

## 8. 顺手量到、这一轮没动的两件事

- `B_plateMismatch` 第一次跑出 3 拍（`状态=.5675 面=.45`），全部集中在 `t ≤ 847ms`，也就是探针刚点进
  单路、`playAll()` 那一瞬。专门写了一支 `devtools/r113-plate-lag.js` 在稳态里采 40 拍：
  **状态 vs 变量 = 0、变量 vs 面 = 0、状态 vs 面 = 0** —— 判为换场瞬态，不是常驻不一致。
- 浅色主题 + `src=css` 时求解器会要 `.763~.92`（对照组那一跑就是它）。这**不是** `no-src` 那一支，
  是 CSS 兜底底色本身偏亮 —— 而面板真正压在上面的常常是暗视频。#402 拍板时要把这条一起算进去。

# R114（1.2.193 → 1.2.194）用户的 alphaLog 一句话，把我上一轮的结论证伪了

## 1. 台账读出来的三行

他装上 1.2.193，复现了一次，然后把「复制诊断」的整段贴回来。关键就是新加的那行：

```
@561ms   -1<0.92(0.92)    mount/厚  want=0.72  src=none  lum=-1  cell=0
@567ms   0.92<0.45(0.568) solve/薄  want=0.45  src=css   lum=255 cell=0
@9752ms  0.45<0.842(0.568) solve/厚 want=0.842 src=video lum=100 cell=6
@10663ms / @16676ms 只有数据板那一组在退档，白玻璃没动
```

三件事一次说清：

1. **`no-src` 一次都没进**（台账里 0 条）。所以我 R113 修的那一支**不是他的病** —— 那条修复本身是对的
   （它确实是个洞，人造现场能炸），但用户报的不是它。没有台账我会继续在这条上猜第二轮。
2. 他看到的「先半透明、很快变白底」= **9.75 秒那一拍 `.45 → .842`**。开机时白玻璃垫在**白色页面**上
   （`src=css lum=255`），十秒后视频可测了，垫在**中灰画面**上（`lum=100`），同一组墨要的厚度就变了。
3. 变厚是**立刻**的 —— 这是 R109 定的规则，可读性不能等下一拍。规则没错，错的是**要这么厚的那一种墨**。

## 2. 逐墨解算：`.842` 是一个人要的

把 ⋮ 面板每一种字色单独喂给求解器（`devtools/r114-who-demands-thick.js`，中灰底 luma=100、白玻璃填充）：

| 字色 | 用在哪 | 向材质要多厚 |
| --- | --- | --- |
| `rgb(91,75,240)` **品牌紫** | 底部条激活标签、「触发标注：开」等强调字 | **.842** ← 全场唯一高于 .45 的 |
| `rgb(28,30,33)` 正文近黑 | 所有行标签 | .45 |
| `rgb(108,117,125)` 分组标题灰 | 「这一段录像」「播放与列表」「其他」 | .45（但最多只有 3.77:1 —— 那是 token 自己的账，就是诊断里的 `unsavableInk`） |

也就是说：**开机→播放那一下的跳变，和 #402「白玻璃偏厚」，是同一笔账、同一种墨。**

## 3. 顺带查出的真 bug：这支紫在**玻璃上**不过 AA（不是在白底上）

用 APP 自己的 `contrastRatio` 量的权威数字：

| 墨 | 纯白底 | 白玻璃 .45 垫中灰视频（合成色 ≈170） |
| --- | --- | --- |
| 旧 `rgb(91,75,240)` | 5.66 ✅ | **2.43 ❌** |
| 新 `rgb(34,16,197)` | 10.78 ✅ | 4.63 ✅ |

所以旧紫的问题不是「在白底上不清楚」（它在白底上 5.66，本来就够了），而是
**在半透玻璃上、底下是中灰画面时**，合成出来那一层浅蓝灰把它吞了（2.43）。
求解器唯一能做的就是**把玻璃洗白**（加厚）—— 这就是 `.842` 的来源。压暗之后它在 .45 的玻璃上就有 4.63，
不需要任何人再变厚。

> 更正：我在给用户的中间报告里说过「这支紫在白底上只有 2.6:1」，那是**我自己写的线性亮度算错了**
> （饱和蓝不做 sRGB 反伽马会严重低估亮度）。真值 5.66。判据第一版也带着同一个错误，已改成调 APP
> 自己的 `contrastRatio`，并把「过 AA」的对象从白底换成**玻璃合成色** —— 那才是它该过的地方。

## 4. 为什么不动规则、动墨色

三条路里：
- **改迟滞**（让变厚也慢）—— 直接违反「可读性不能等」，不做。
- **让开机那一次不跳**（首解不许变薄）—— 治标，且会把首页那块板子留在屏幕上 ~50 秒，
  正好是用户 R103 抱怨过的「玻璃不明显」。
- **改那一种墨** —— 一次结掉两件事：它不再要厚度，开机与播放**都是 .45**，没有东西可跳；
  同时把玻璃上 2.43:1 的 AA 债还上。这是 #402 的 C 案，只是这次有名字、有数字、有出处。

## 5. 改法与代价

`styles.css` 触摸 media query 里新增一块，**只压浅色主题那份**：

```css
body:not(.dark-theme) {
    --glass-tint: #2210c5;   --accent-solid: #2210c5;
    --glass-tint-soft: rgba(34, 16, 197, .14);
    --chip-media-edge: rgba(34, 16, 197, .65);  --chip-media-soft: rgba(34, 16, 197, .14);
}
```

沿同色相只压亮度往暗走，挑的是**第一档「不再向材质要厚度」**的：`#5b4bf0`（玻璃上 2.43 ❌ / 要 .842）
→ **`#2210c5`**（玻璃上 4.63 ✅ / 要 .45）。中间档是用那把算错的线性尺扫出来的，最终值用 APP 自己的
`contrastRatio` 复核过 —— 结论不变（更暗只会让白底与玻璃上的对比都单调变好）。
- 桌面不动（规则在触摸 query 里）；深色主题不动（那份 `#b9aeff` 是**文字色**，一起压会把另一套账换掉）。
- 跟着变深的还有 CTA 填充、日期选择器选中日、底部条激活标签 —— 但白字在它们自己的紫药丸上
  对比从 5.66 升到 **10.78**（背景更暗），是变好，不是拿可读性换观感。
- 代价说清楚：选中态的紫会明显暗一截、没那么亮。这是他拍板的（选项「改暗到 #2210C5」）。

## 6. 交付

| 版本 | 内容 | 大小 | md5 |
| --- | --- | --- | --- |
| **1.2.194** | 浅色品牌紫压暗到 `#2210c5`（桌面/深色不动）+ 两条新判据 | 28,086,219 B | `d07b7419b19e60d702b13a0aaa0ca572` |

sha256 `ce79ffaf52a79946422a63accb5e8cfcb6380644011b64db67e0c8ddf93807ab`；SO_MATCH arm64
`92ef86b2c23494571dae49fa785e7ed6` / x86_64 `5441b88bda2d8ed1e39b7f31195fecec`。装机回读 `versionName=1.2.194`。

## 7. 验收（**这一轮整套都在浅色主题下跑** —— 改动就活在那一档里）

| 判据 | 结果 |
| --- | --- |
| 新判据①「浅色品牌紫不再向材质要厚度，且自己在半透玻璃上也过 AA」 | **绿**：`浅=#2210c5 白底=10.78:1 玻璃(.45垫中灰)=4.63:1 需求=.45` |
| 新判据②「深色那份文字紫没被顺手压暗」 | 绿：`深=#b9aeff` |
| 装机实测 token 真的解析到新值（真点击「浅色」/「跟随系统」两档各读一次） | 浅 `--glass-tint/--accent-solid = #2210c5`；深 `#b9aeff / #5b4bf0`（不动） |
| r110-release-audit C | **PASS 走完 12 档 `.92→.45`**，档间隔全在 4.32~4.42 s（设计节拍 4.1~4.9），**往返 0**，`B_plateMismatch=0 B_glassMismatch=0` |
| r102-verify 竖屏 | **42 / 0**（40 → 42，多的就是这两条） |
| r102-verify 横屏 | 20 / 0 |
| r109-alpha-stability | 10 / 0，`real=0` |
| r113-nosrc-hold | 绿（量不到那一拍一动不动，路没堵死） |
| r109-who-repins | 开→关→原生推送全程 `.90` 不动 |
| r106-solid-tier | 六面 × 三屏 × 两主题 `inset=0`、四边 `0.74/0.74/0.74/0.74` |

审计这条现在是**端到端证据**：浅色主题下需求就是 `.45`（改之前同一场景要 `.822~.842`），
而且 R113 改的自适应窗口第一次真的走完 12 档（52 秒）—— 上一版 24 秒的窗口根本量不到这件事。

## 8. 这一轮踩到的量具坑

- **token 是十六进制，不是 `rgb()`**。判据第一版用 `[\d.]+` 拆 `--glass-tint`，`#2210c5` 里拆不出三个数
  → `ok:false` → 判据假红。改成先按 hex 解析、再退回 `[\d.]+`。又一次「量具坏了看着像代码坏了」。
- **`body:not(.dark-theme)` 能盖住 `:root` 的声明**，不是因为特异性（(0,1,1) 也确实更高），
  而是因为自定义属性是**继承**下来的：任何直接声明都赢过继承值。这条在验之前只是猜测，注入实测才算数。

---

# R115（1.2.194 → 1.2.195）「还有页面 UI 没有统一的，一起完善一下」—— 不猜哪块不统一，把实渲值全量数出来

## 1. 这一轮的取证方式

用户这句话没有点名是哪一块，而「看着不统一」这种判断最容易变成凭印象改样式。所以先做普查，不做推测：

- `devtools/r115-census.js` —— 抽屉 / ⋮ 面板 / 底部条 / 导出页 / 数据卡 / 长按菜单 / 目录浏览器 /
  关于页 / toast 九个面，逐控件记 **实渲计算值**：高、宽、圆角（四角分别记）、字号、字重、内缩、描边，
  再按值聚类。面本身单独记一行 `FACE`（它的圆角/底色/描边才是「这块面板长什么样」的那个数）。
- `devtools/r115-text.js` —— 不猜类名：把每个面里**真正有字的叶子节点**走一遍，按 (字号/字重/颜色) 聚类。
- `devtools/r115-digest.cjs` —— 把上面两份压成「值 ×次数 + 一个例子」，一轮改动前后的对照能肉眼看完。
- 跑法：竖屏播放态下，开 ⋮ 面板一遍、开抽屉一遍、开导出页一遍、开目录浏览器一遍（导出页要点 ⋮ 里
  那行才会真开 —— `#exportMetadataBtn` 是**导出 CSV**，不是导出页；第一版误点了一次，白拿了一条 toast）。

摘要器为什么必要：直接把 census 的 JSON 打到终端，一份就是 300 行 computed style，看完也得不出结论。

## 2. 数出来的底账（深色 · 竖屏 · 400×889 · dpr 2.7）

| 量的东西 | 实测有几种值 | 对照的 token |
|---|---|---|
| 圆角 | `0 4 6 8 9 10 12 14 16 22 999` —— **11 档** | 只有 5 个：`--r-sheet 20 / --r-panel 16 / --r-card 12 / --r-chip 8 / --r-pill 999` ⇒ 4/6/9/10/14/22 六种是字面值 |
| 控件高度 | `32 36 40 44 46 48` —— **6 档** | 本项目自己的线是 40dp ⇒ 32/36 在线下 |
| 字号 | `9.6 10.4 10.56 10.88 11.2 11.52 11.84 12.16 12.48 12.8 13.12 13.44 13.6 13.76 14.08 14.4 14.72 15.68 16 16.8 17 18.4 32` | 只有 2 个：`--fs-cap 11px / --fs-body 14.08px` |
| 次要灰 | `#b0b3b8` 与 `#aab0c0` 两份并存 | `--text-secondary` 与 `--modal-muted` 各一份 |

这不是一份「风格建议」，是一份**同一角色用了几种写法**的清单 —— 下面每一条都带实测数。

## 3. 六项「同一个角色，长得不一样」

1. **分段直选两套形状**。⋮ 面板 `.choice-segments`：轨 44 / 圆角 999，段 40 / 圆角 999 / 字 12.48，
   选中态 `--accent-solid`（品牌紫 + 白字）。导出页 `.pe-seg`：轨 36 / 圆角 8，段 32 / 圆角 6 / 字 13.44，
   选中态 `--bg-secondary`（灰底）。**而 `.pe-seg` 那段的注释本来就写着「和抽屉那套是同一个控件，
   好让手势词汇表不长出第三种形状」** —— 意图在，执行跑偏了 3 档。32px 的段同时低于 40dp 线。
2. **chip 三档**。`.date-chip` 44 / 圆角 12 / 字 12.8；导出页 `.recent-chip` 40 / 12 / 12.48（横屏再掉到 36）；
   目录浏览器 `.dir-volume-chip` 44 / **22** / 12.8。
3. **面板底部主按钮三档**。`#selectFolderBtn` 40 / 8 / 13.76；`#androidDirSelectBtn` 44 / 10 / 14.4；
   `#peStartBtn` 40 / 9 / 14.72。第四个数字 `--r-card=12` 谁都没用。
4. **标题四档**。抽屉页名 16/600；导出页 `.pe-nav-title` 15.68/600；目录浏览器与关于页 `h4` 16.8/700。
5. **低于自己定的 11px 下限的界面文字 6 处**：`.video-duration`（竖屏 `0.6rem`=9.6，比桌面的 0.75rem 还小）、
   `.menu-divider` 10.56、`.pe-preview-cap` 10.56、`.dir-volume-meta` 10.56、`.pe-hint` 10.88、
   `.dir-volume-badge` 10.88。`styles.css` 里 `--fs-cap` 那段注释明写「Apple 给人读的字下限是 11px，
   贴在画面上的小注记豁免」—— 这 6 处都在面板上，不在画面上。
6. **两处低于 40dp 的靶子**：目录浏览器 `.dir-quiet-link`（「详情 / 编辑路径」）实测 34.1；
   sheet 的关闭 `×` 实测 32×32。这是 R97-9 那一批清掉四个之后**普查数出来的余下两个**。

## 4. 改法（全部落在手机档，桌面一页不动）

| 项 | 落点 | 规则 |
|---|---|---|
| ① | `styles.css` `.pe-seg` | 对回 `.choice-segments` 那一档：轨圆角 `--r-pill`、轨底 `--choice-track`、段 `min-height:40` + `--r-pill` + `0.78rem`，选中态改 `--accent-solid` + 白字（和 R108「chip 归品牌紫」同一条口径） |
| ② | `.pe-chips .recent-chip` | 高度走**所在面的 `--field-h`** 并补 40 地板；字号对回 `.date-chip` 的 `0.8rem`；删掉横屏那条 `height:36px` |
| ③ | `#selectFolderBtn`、`#androidDirSelectBtn` | 圆角 `--r-card`、字号 `--fs-body`、高度 `--field-h`（`min-height:40` 兜住横屏那档 38） |
| ③′ | `.dir-volume-chip`、`#androidDirUpBtn` | 圆角从 22 收到 `--r-card`（同一个目录浏览器里三种圆角） |
| ④ | 文件末新增一节 | 手机档标题统一 `1rem/600` |
| ⑤ | 5 处 `font-size` | 换 `var(--fs-cap)`（11px），「压在画面上的注记」按原注释继续豁免 |
| ⑥ | `.dir-quiet-link`、`html.sheet-mode … > .close-modal-btn` | 靶子抬到 40 |
| 灰 | **判为不改**（两个方向都实测过，见下） | 两份次要灰保持原样 |

四条口径要说清楚，因为它们不是「顺手改好看」：

- **段高与主按钮为什么不写 `var(--field-h)` 就完事**：横屏手机档 `--field-h` 是 **38**，低于本项目
  自己的 40dp 线。所以这些位置写的是 `height: var(--field-h); min-height: 40px` —— 一致性归一致性，
  40 那条线不能让「统一」这一轮顺手压下去。38 这一档该不该留是 **#375** 的账。
- **两份次要灰判为不能并 —— 第一版并了，被自己的验收拦下**。我先按「深色差异无所谓、浅色往暗走
  对比只升不降」的直觉写了 `--text-secondary: var(--modal-muted)`，装机前跑套件才发现**浅色主题白玻璃
  的需求从 .45 跳到 .842（底=98）/ .861（底=75）**：`.menu-divider` 那支灰是白玻璃面上的墨，
  把它换暗 = 让整组材质重新变厚 = 把 R114 刚交付的「开机→播放不再跳一下」原样退回。
  反方向（并到 #6c757d）也不行：弹层实测 `.about-row-value` **4.43:1**、`.pe-summary` **4.27:1**，掉到
  AA 线下。两份灰实际只差 Δ(6,4,8)/255，肉眼同屏分不出来 —— 所以这一条**不改**，并把真正的不变量
  写成判据（浅色白玻璃上任何一支墨的需求必须 ≤.46）。教训本身值得记：**并一个 token 之前要先问
  「它的消费者里有没有压在白玻璃上的字」**，只看不透明面板的 AA 会漏掉整本材质的账。
- **高对比度模式不跟着动**：那两份灰在文件末尾另有一套更深的值，文档顺序在后面，本节够不着它 ——
  既然浅色并色已被判为不改，这条也就不再是本轮的负担（那一档要的是最大对比，不是统一）。

## 5. 一处改法被自己的量具纠正：× 的 32×32 是谁给的

第一版把 × 写成 `html.touch-ui .modal-content .close-modal-btn { width:40px; height:40px; top:6px; right:6px }`，
装机前注入实测：`display` 变成 grid 了，**尺寸却还是 31.9965×31.9965，top 是 5px**。同一个声明块里
一半生效一半不生效，只抽查一两个属性就会读成「规则没写进去 / 样式表坏了」。

原因是 R47-1 已经有一条带 **id** 的规则：

```css
html.sheet-mode #androidDirModal > .modal-content > .close-modal-btn { top:5px; left:8px; width:32px; height:32px; … }
```

它权重比 `html.touch-ui .modal-content …` 高一级，所以尺寸、位置都被它按住，而它没写 `display`，
于是我那条的 `display:grid` 漏了进去。正解是**改那一条**，不是再加一条。

这是 R97「同一控件三档各写一个 `!important`，改基础规则=没改」的又一形态：**这次不是 `!important`，
是 id 权重**。判据同理 —— 读计算值时要把「这个属性的最终胜出者是谁」也算出来，只看值不够。

## 6. 装机前的预检（这一轮省掉一次失败构建的手法）

改 CSS 之前先把新规则注进正在跑的 1.2.194（`devtools/.r115-inject.js`，一个 `<style id=r115-preflight>`），
再读计算值。这能在**不构建**的前提下回答两件事：① 这条规则到底赢不赢（§5 就是这一步抓出来的）；
② 赢了之后的数是不是想要的（`#selectFolderBtn` 40→44、`.video-duration` 9.6→11、× 32→40…）。
本轮 §5 那条如果等到装机才发现，就要白花一次 6 分钟构建 + 一次装机。

顺带一条纪律：**构建期间 `src/` 不许动**。第一轮 1.2.195 已经构建完成，但那时 §3⑤ 的 5 处字号还没改，
所以那个包直接作废、没有装机（`Finished 1 APK` 之后复制的规则只针对**要交出去的那一版**）。

## 7. 交付

**1.2.195**（28,105,355 B / md5 `5640ecf8e37d2c114e407e7b6b70ef96` /
sha256 `08c621010ad159d380eeedea291d613f3aa826792f2079b50f7852e2d8c18672`；
SO_MATCH arm64-v8a `1d5b39e13630cb898c5de8929a06af70`、x86_64 `4f2d0b34d7d3f6ccdf944477764ffbc6`）
已装机并回读 `versionName=1.2.195`，包在仓库根目录 `Tessera-1.2.195.apk`。

这一版**构建了三次**，前两次都不该交出去：

- 第一次构建完成时 §3⑤ 那 5 处字号还没改（构建期间 `src/` 冻结，不能边编边改）→ 那个包作废、没装机，
  改完用同一个版本号重新构建。
- 第二次构建带着 §4 那条并色（`--text-secondary: var(--modal-muted)`）→ 装机前跑套件被拦下（见 §8 倒数
  第二条），回退之后第三次构建才是交付的这一版。

## 8. 验收（浅色主题 · 每套都跑在刚 force-stop 重开的实例上）

| 套件 | 结果 |
|---|---|
| `r102-verify`（竖屏） | **53 PASS / 0 FAIL**，其中 R115 新判据 11 条全绿 |
| `r102-verify-landscape`（横屏） | **20 PASS / 0 FAIL** |
| `r110-release-audit` | C **PASS 走完 12 档 .92→.45**，档间隔 4267~4295ms 全在节拍内，往返 0，面/板不一致 0/0，`src=video` 100/100 拍、换源 0 次 |
| `r109-alpha-stability` | 10 / 0，`real=0` |
| `r108-verify` | 9 / 0（`backdrop=video/85`） |
| `r106-solid-tier-check` | 六面 × 三态 × 浅色 全部 `inset数=0` |
| `r113-nosrc-hold` | 绿：量不到底色那一拍材质一动不动 |
| `r109-who-repins` | 打开→关闭→原生推送全程 **.90 不动**（`mounts=2` 而 `0.900→0.900`），之后按迟滞一档档退到 .82 |
| 目视（浅色，`adb exec-out screencap`） | `devtools/r115-05-export.png` 分段控件已是胶囊 + 品牌紫那一档；`r115-06-dir.png` 上一级 / 盘 chip / 主按钮 / × 四种控件同一档，「含 TeslaCam」角标 11px 不折行 |

两条判据这一轮标成 **「本轮无样本 ⇒ 不判」**（既不算绿也不算红）：`退场判据有样本可测` 与
`关掉无障碍开关后材质回得来`。它们要一个真的挂着 `url(#tesseraLens)` 的面，而 `.lens-on` 是按实测重叠
挂的，AVD 这一场没交纹理（`lensOn=0/5`）。判据现在自己分辨两种情况：**有路在交帧却没挂上 = 缺陷（红）**、
**一帧都没交 = 量具没有基准（明说不判）**。以前一律算红，于是同一份代码一会儿 42/0 一会儿 40/2 —— 那是
量具在漂，不是材质在变。

而 §4 那条并色就是被这套件拦下来的：装机前预检跑出的读数是
`浅色 --text-secondary=108/117/125 白玻璃底98 需求 0.450`（改之前）→ `.842 / .861`（改之后），
和 R114 的结论正面冲突。**没有这条判据，这一轮就会把刚修好的「开机→播放不再跳一下」再弄回去一次。**

## 9. 这一轮踩到的量具坑

- **`getComputedStyle(el)['--field-h']` 是 `undefined`** —— 自定义属性只能 `getPropertyValue`。判据第一版
  用它比高度，得 NaN，看着像控件坏了（R99「`gridTemplateColumns` 驼峰名返回空串」的同族）。
- **面板关着时 `height` 的计算值是 `auto`** → parseFloat 得 NaN。祖先 `display:none` 不解析盒子，
  但 `min-height` / `border-radius` / `font-size` 照样解析 —— 所以关着的面**能**验样式表一致性，
  只是要挑对属性（R107「祖先 display:none 与自身无区别」的可用一侧）。
- **`--modal-muted` 是十六进制**，按 `[\d.]+` 拆不出三个数 → 对比度判据要先把它喂给一个临时
  `span.style.color` 让它解析成 `rgb()`（R114 的 hex 教训同族）。
- **点 `#exportMetadataBtn` 不是打开导出页**，是导出 CSV —— 它会给用户下载目录写一个文件。
  要开导出页得走 `viewer.showPhoneExportModal()`（或点底部条的导出药丸）。
- **判据不能假定控件存在**：目录浏览器的盘 chip 是扫盘之后才渲染的，没开面板时 `.dir-volume-chip`
  数量 = 0 → 判据读出 `ABSENT`，第一版把它当成「代码没生效」。现在这条判据**自己把面板开起来**、量完
  关回去，并把 `chips=2 关回去=yes` 一起报出来（R97「判据里没走过的分支等于没验证过」）。
- **同一轮里前一套件的探针会脏后一套件**：`r113-nosrc-hold` / `r109-who-repins` 会换掉
  `measureBackdropLuma` 或给 `markGlassMaterial` 包一层计数器，跑完再单跑 `r102-verify` 会读到
  `.763` 这种回落值，把 AA 判据带红。要干净数就 **force-stop 重开一个实例再跑**（本轮就是这么把
  「51/3」跑回「53/0」的，两次都如实记下来）。
- **`SO_MATCH` 的 ABI 对照别手写**：第一遍写成 `arm64-v8a:x86_64`，于是报「arm64 不匹配」——
  是量具错不是包错。正确对照：`lib/arm64-v8a ↔ target/aarch64-linux-android`、
  `lib/x86_64 ↔ target/x86_64-linux-android`。
- **后台构建的两种吞输出写法**：`bash build.sh | tail -25` 会把整段进度憋到结束才吐；
  `nohup … &` 再套一层后台执行，退出码反映的是包装脚本而不是构建本身（本轮误报过一次 failed）。
  直接 `> log 2>&1` 最省事。

## 10. 数出来但这一轮没动的

- **抽屉里「事件类型」还是系统原生 `<select>`**（点开是系统菜单，弹层材质与字色都不受 app 控制，
  它是最容易读成「割裂」的那一个）。改成四段直选在 312px 抽屉里放得下：实测每段 68.5px，
  四字标签 12.48px 墨宽 49.9px、可放 52.5px —— 只剩 **2.6px** 余量，所以真做的话文案要缩成两字版。
  效果图最后一张卡把 A（只统一外观）/ B（换四段直选）/ C（并进日期 chip 那行）摆好了，等他拍。
- **⋮ 面板行 12.48px vs 长按菜单行 14.72px**：两个都叫「菜单」，字号差两档。前者是 19 行两列的开关
  清单，后者是 5 行单列的动作表 —— 并档会挤掉栅格，留给下一轮连同 **#375** 一起定。
- **圆角仍有 4 / 6 / 9 / 14 / 22 五种字面值没进 token**（本轮只收了「同一面里同角色」的那几处）；
  21 档字号也只收了「低于 11px」这一头。完整档位表还是 #375 那件事。

---

# R116（1.2.195 → 1.2.196）「设置的卡片和底部菜单栏中间的间隙，偶尔会有点问题」

## 1. 先分清「间隙」是谁的间隙

⋮ 面板与底部条之间那条缝，CSS 里只有一处：

```css
.header-collapsed .header-actions-group {
    position: fixed;
    bottom: calc(var(--action-h) + 12px);
}
```

12px 是写死的意图，`--action-h` 是**量出来的**。所以这条缝只有一个地方会错：量出来的那个数。
`script.js` 里 `startControlsReserve()` 的原文：

```js
const rect = bar.getBoundingClientRect();
const occupied = rect.height > 0
    ? Math.round(rect.height + Math.max(0, innerHeight - rect.bottom))
    : 0;
```

底条的**画上去**的位置。这就是根因所在。

## 2. 根因：量了 painted box，而底条会被 transform 挪走

`.phone-action-bar` 在抽屉或长按菜单打开时是这么藏起来的：

```css
body:not(.sidebar-collapsed) .phone-action-bar,
body.context-open .phone-action-bar {
    visibility: hidden; opacity: 0;
    transform: translateY(14px);
}
```

外加 `transition: transform .22s`。**`getBoundingClientRect()` 把 transform 算进去**，
而 ResizeObserver 只看得见**高度**变化 —— 底条被挪下去 14px 又滑回来，高度一寸没动。
于是那一次量把 91 记成 77，滑回来以后没有任何人再量一次，77 就一直挂在页面上。

一次注入实测（`devtools/r116-transform.js`，同一实例、同一套动作）：

| 状态 | 底条 rect 顶 | offsetTop | 量出来的 --action-h |
| --- | --- | --- | --- |
| ① 静置 | 797.7 | 798 | 91 |
| ② 抽屉开·挪到位（tf=matrix(1,0,0,1,0,14)） | 811.7 | **798** | **77** |
| ③ 放回·60ms 中途（tf=…0,6.74） | 804.4 | **798** | **85** |
| ④ 动画落定但没人再量 | 797.7 | 798 | **85（残留）** |
| ⑤ 手动补一次量 | 797.7 | 798 | 91 |

`offsetTop` 那一列三行都是 798 —— 它不看 transform，这才是「底条住在哪」。

## 3. 两条触发路，第二条不需要运气

代码里注释承认的那条洞（「底条被 inset 挪动而高度不变时，ResizeObserver 看不见」）只是**一半**。
把 `--action-h` 的每一次写入挂上记录器（`devtools/r116-watch.js`）之后，真流程里抓到两次：

```
@643914ms 写=77px 真=77.3 tf=matrix(1, 0, 0, 1, 0, 14)
@643925ms 写=77px 真=77.3 tf=matrix(1, 0, 0, 1, 0, 14)
```

动作是：**在抽屉里点一条事件**。抽屉关、底条开始往回滑、播放器同时开始排版 ⇒
ResizeObserver 在那 220ms 里回调了一次。这条要一点运气，所以是「偶尔」。

不需要运气的是第二条：`__tdashcamNativeState()` 里本来就写着

```js
this.publishControlReserve?.();
```

而原生状态推送在**抽屉开着的时候也会来**（每次 configuration change、每次重新获得焦点）。
这条路径下底条正挂着 `translateY(14px)`，一量就是 77，且没有任何后续事件会纠正它。

## 4. 间隙错的时候，错成什么样

改前在同一台 AVD 上把面板打开量（`devtools/r116-check.js`，1.2.195）：

```
layoutRest=91  atRest=82  duringDisplace=77  midSlide=82  afterSettle=82
panelCssBottom=94px  gapToBarTop=2.4px
```

期望 12px，实得 **2.4px**；把面板再往下推一点就是**压进底条 2.6px**（本轮另一次量到）。
底条是三个真按钮，面板压上去就是「最后一行看不全 / 点不到」。

## 5. 修法：改量布局盒，一行

```js
const h = bar.offsetHeight;
const occupied = h > 0 ? Math.round(h + Math.max(0, innerHeight - bar.offsetTop - h)) : 0;
```

`offsetTop`/`offsetHeight` 是布局盒，**与 transform 无关**，所以「底条正在滑」「底条被抽屉压下去」
这两种现场量出来都是它住的那个位置。原来那条 `rect.height > 0` 的守卫语义不变
（`display:none` 报 0），所以当年那个把 `--action-h` 顶成 915px 的坑仍然堵着。

没有加 transitionend、没有加轮询、没有「面板打开时补一次量」—— 那些都是在给错的量法打补丁。

**波及面**：`--action-h` 有七个消费者，一次改完全部跟着正：
`.main-content` 的 `padding-bottom`（2949/5004）、⋮ 面板的 `bottom` 与 `max-height`（5060/5068）、
长按菜单 `bottom`（5146）、导出药丸 `bottom`（6348）、7349 那条带 91px 兜底的。

## 6. 诊断口（让真机自己带证据回来）

`describePhoneGeometry()` 多一行：

```
gap actH=91/91 barTop=798 panelGap=12 barTf=rest
```

`actH=声明/布局实测` —— 两个数一旦不等，就是这条缝又错了，不需要用户描述「偶尔」是什么时候。
`barTf=moved` 则直接指出「量的那一刻底条正被挪着」。

## 7. 这一轮踩到的量具坑（写下来是因为它会伪装成代码坏）

1. **⋮ 面板自己也有 transform。** 收起态是 `translateY(-8px) scale(.98)`，打开要 200ms 滑到位。
   于是第一版判据用 rect 量间隙，读到一个 **25.4px 的假红**（面板布局底 786、画上去 772.3，
   差 13.7px —— 恰好是 scale+translate 的合成）。修好代码之后判据仍然红，红的是量具。
   正解和这次代码的修法一模一样：**间隙按布局盒算**
   （`bar.offsetTop − (panel.offsetTop + panel.offsetHeight)`），与动画无关。
2. **AVD 上「连续两次读数相同」不代表落定**（R112 那条在这重现）：这台机器 ~3fps，
   50ms 的轮询两次拿到的经常是同一帧。别用「采样相等」当「动画结束」的判据。
3. **要截住 ResizeObserver 持有的闭包，只能往下挂一层。** 包 `viewer.publishControlReserve`
   截不到 RO 的调用 —— observer 拿的是那个局部 `publish`，属性名换掉它不认识。
   真正拦住的是 `CSSStyleDeclaration.prototype.setProperty`（按属性名筛 `--action-h`），
   并且**读完必须还原原型**，否则整页样式写入都走我的包装函数。
4. **`adb shell input tap` 用物理像素，rect 是 CSS px**，dpr 要现读（这台 2.7）。
   本轮一次忘了乘，`tap` 参数为空，`IllegalArgumentException: Argument expected after "tap"`，
   底条根本没被点开，后面所有读数都是「什么都没发生」。
5. **Git Bash 的 `/tmp` 在 Windows node 里解析成 `C:\tmp`。** 用 `> /tmp/x.json` 再
   `readFileSync('/tmp/x.json')` 会 ENOENT；跨工具传值直接用命令替换，别落盘到 `/tmp`。

## 8. 查过但这一轮没动的

- **长按菜单离底条 8px，⋮ 面板 12px。** 两块都是浮在同一条底条上面的玻璃面，
  两个数（实测 `menuCssBottom=99px` = 91+8，面板 `103px` = 91+12）。这不是 bug，
  是历史上各写一次；并档属于 #410 那一批「同一角色两个数」，等他拍，不自己选。
- **底条被 `visibility:hidden` 藏起来时仍参与测量** —— 改完之后这不再是问题（布局盒不受
  visibility 影响），所以没有为它加任何守卫。
- **横屏 `--action-h`**：同一套算术、同一个入口，本轮只在竖屏量过；装机后横屏复量（见下表）。
## 9. 交付与验收（1.2.196，浅色主题，全新实例）

| 套件 | 结果 | R115 基线 | 本轮新增 |
| --- | --- | --- | --- |
| 竖屏 `r102-verify.js` | **56 / 0** | 53 / 0 | +3（静置=布局占用 / 挪开不留错值 / 12px 间隙） |
| 横屏 `r102-verify-landscape.js` | **23 / 0** | 20 / 0 | +3（同一件事在横屏 + 诊断 gap 行自证） |

关键读数（三条新判据的实测）：

```
底条静置时 --action-h 就是它的布局占用          = 声明=91 布局=91 offsetTop=798 h=57
底条被 transform 挪开时量的那一次不留错值        = 应为=91｜挪开时(tf=…0,12.45)=91 中途=91 落定=91
⋮ 面板与底条之间是声明的 12px 间隙，不压不重叠   = 间隙=12px（面板布局底=786 底条布局顶=798）cssBottom=103
横屏 --action-h = 底条布局占用                  = 声明=92 布局=92 offsetTop=308 h=57 tf=none
横屏 ⋮ 面板与底条之间仍是 12px 间隙              = 间隙=12px（面板布局底=296 底条布局顶=308）
诊断 gap 行                                     = gap actH=91px/91 barTop=798 panelGap=12 barTf=rest
```

R115 那 53 条（含 R114 品牌紫、R112 入场不淡、R101 三条几何、R107 解耦、R106 逐边普查）
一条没退；`⋮ 面板：fixed 仍相对视口 = 期望距底 103.0 实测 102.7`。
截图 `devtools/r116-01-gap.png`（`adb exec-out screencap`，CDP 截图没有视频平面）。

**装机前预检**（R115 §6 那条手法的第二次用处）：这一轮的红不是靠构建发现的 ——
先用 `devtools/r116-check.js` 打在正在跑的 1.2.195 上证明三条全红（间隙 2.4px），
改完再注入实测 `offsetTop` 在三种状态下都是 798，才动手改代码。

## 10. 这一轮自己的返工（记下来，因为它是「修对了但把别的弄坏了」的又一形态）

诊断那行第一版写成 `if (bar) { … }`，而这个方法里 `const bar` 声明在**下面**的玻璃段里 ——
同一个块里同名 `const` 是暂时性死区，`describePhoneGeometry()` 当场
`ReferenceError: Cannot access 'bar' before initialization`。
`node --check` 看不出来（语法完全合法），是装机后调它才炸的，而炸掉的正是「让真机带证据回来」那个口。
改名 `gapBar` 之后，用「把改好的方法体注进正在跑的实例再调一次」验了一遍才重新构建。
顺手留了 `devtools/r116-dupdecl.cjs`：按方法体报重复声明，下次这类错在构建前就能看见。

---

# R117（1.2.196 → 1.2.197）A3 → A6 → A2 → A5 四批 UI 收口（A4 按用户要求不动）

## 1. 顺序与门

用户：「先按建议 A3 → A6 → A2 → A5 来。A4 先不动。A1 请先出效果图。」
所以：A3/A6/A2/A5 落地，A4（横屏 38px 档位）一行没改，A1 只出效果图不写代码。

## 2. A3 · 两块浮在同一条底条上的面，各写了一个间隙

| 面 | 改前 | 改后 |
| --- | --- | --- |
| ⋮ 面板 | `bottom: calc(var(--action-h) + 12px)` | `+ var(--float-gap)` |
| 长按菜单 | `bottom: calc(var(--action-h) + 8px)` | `+ var(--float-gap)` |

新增 `--float-gap: 12px`（写在 `--action-h` 旁边，:4921 那个 :root）。取 12 不取 8：12 是 R99 当
「一个量出来的面 + 一个有意的间隙」定下来的那个数。

**顺带查到的第三处，判为不动**：`.phone-export-sheet` 的 `--sheet-bottom` 里写着
`calc(var(--action-h) + 8px + var(--safe-bottom))` —— 那条 `+ --safe-bottom` 正是 R99 在两个面上
删掉的双计。但实测它**两个方向都不生效**：竖屏导出页是整页（`.phone-export-page .phone-export-panel`
自带 `padding-bottom: var(--safe-bottom)`、`height:100%`，量的 `paddingBottom` 得 0px），
横屏 8305 那条又整个替换了 `--sheet-bottom`。改一条没生效的规则只会制造下一个「同块一半生效」。

## 3. A6 · 「有录像」chip 的描边画了两遍

改前实测：`border: 0.740741px`（= 1 CSS px 按 dpr 2.7 落到设备像素）rgba(34,197,94,.7)
**再叠** `box-shadow: inset 0 0 0 1px rgba(34,197,94,.28)` ⇒ 四条边一起 ~1.7px 双层绿框。

这就是 R106 那一族（「一条边被画两遍」），只是换了颜色：R106 是顶部一条亮高光，这里是整圈同色环。
正解同理：**一条边，强调交给这一条边本身** —— 去掉 inset，描边收到 `1.5px / rgba(34,197,94,.9)`。

**为什么 R106 的逐边普查没抓到它**：那条判据只走 `display !== none` 的元素，
而目录浏览器/抽屉/长按菜单**关着的时候整块不存在** —— 不是判据写错，是扫描范围有盲区。
把 `scanEdges()` 抽成函数，加第二遍「先把 ⋮ 面板 / 长按菜单 / 目录浏览器开起来再扫」。

## 4. A2 · 两处「菜单行」字号并档（只能往一个方向并）

改前：⋮ 面板行 **12.48px**（.78rem）、长按菜单行 **14.72px**（.92rem）。
R115 留这条时说「并档会挤掉栅格」—— 这句对不对，注入五个变体实测（`devtools/r117-a2-variant.js`）：

| 变体 | 竖屏面板 | **横屏面板（约束面）** | 长按菜单 |
| --- | --- | --- | --- |
| ① 现状 12.48 / 14.72 | 被切 0 | 被切 0 | 0 |
| ② 面板升到 14.72 | 被切 0 | **被切 7** | 0 |
| ③ 菜单降到 12.48 | 0 | 0 | 0 |
| ④ 两边并到 13.28 | 0 | **被切 6** | 0 |
| ⑤ 两边并到 14.08 | 0 | **被切 7** | 0 |

横屏是 7 列 `auto-fill`，一格 112–124px，去掉 18px 图标与 4px 间隙后**标签只剩 76.7px**；
六字行「连续播放：关」在 12.48 时墨宽 74.9（余量 1.8px），14.08 时要 84.5（超 7.8px）⇒ 一定挤。
竖屏两列一格 ~140px，14.08 时最宽的「Switch to English」墨宽 107.1 —— **放得下**。

**所以并档不是「选一个方向」，是「竖屏能并、横屏不能并」。** 落地：

- 长按菜单行 `.92rem` → `var(--fs-body)`（14.08），两个方向都放得下；
- ⋮ 面板行（竖屏）`.78rem` → `var(--fs-body)`；
- ⋮ 面板行（横屏）**留在 .78rem**，并把上面那张表写进注释 —— 例外要有数，不然下一轮会被「顺手统一」。

净效果：竖屏两处菜单行从 12.48/14.72 收成同一档 14.08；横屏面板 12.48 对菜单 14.08，
两边都是各自密度上限。判据两头都钉住（竖屏「同一档 + 0 挤掉」、横屏「仍是 12.48 且 0 挤掉」）。

## 5. A5 · 圆角/字号档位表

普查工具 `devtools/r117-tiers.cjs`（源码层，不是渲染层 —— 档位要收的是**写下来的字面值**，
渲染层普查看不见关着的面）。v1 有个正则错：`border: 1px solid rgba(…)` 的**描边宽**和 rgba 的
通道值被当成圆角收了进来，于是报「33 个圆角档位」里一半是 255/126/0.1。v2 只收 `border-*-radius`
与 `font-size`，并排除含颜色函数/`var()` 的行。

**改前**：圆角 18 个字面值 / 117 处；字号 47 个字面值 / 210 处。token 只有 5 个圆角 + 2 个字号。

这一轮只动**逐像素相等**的那些（`devtools/r117-snap.cjs`，共 **101 处**）：

| 属性 | 字面值 | 去处 | 处数 |
| --- | --- | --- | --- |
| radius | 10px | `--r-field`（新，同值改名） | 25 |
| radius | 8px | `--r-chip` | 19 |
| radius | 14px | `--r-tile`（新，同值改名） | 7 |
| radius | 12 / 16 / 20 / 999px | `--r-card` / `--r-panel` / `--r-sheet` / `--r-pill` | 6 |
| font | 1rem / 16px | `--fs-lead`（新） | 17 |
| font | 12px / 0.75rem | `--fs-meta`（新） | 13 |
| font | 14px / 0.875rem / 0.88rem | `--fs-body` | 15 |
| font | 11px / 0.6875rem | `--fs-cap` | 5 |

px↔rem 两组是**真等值**的前提：全文件没有 `html{font-size}` / `:root{font-size}`，
script.js 也不写 `documentElement.style.fontSize` ⇒ 1rem 恒为 16px。这条先核实再动手。
唯一不严格相等的是 `14px`/`0.875rem`（=14.00）并进 `--fs-body`（14.08）：差 0.08px，如实记在这里。

**改后**：圆角 11 个字面值 / 60 处；字号 41 个 / 166 处。

剩下的**不是没收，是不该硬收**：
- 圆角 1/2/3px 是滚动条轨道与滑块、剪辑手柄 —— 功能尺寸，不是「面板圆角」这一档；
- 4/5/6/7/9/13px 各差 1–3px，合并会真的改像素，且没有「同一角色两个数」的实例（R115 收的是同角色）；
- 字号 0.7/0.72/0.74/0.76/0.78 这一带（11.2~12.48）互差 1.3px，**合并必然动文本度量**，
  而 A2 刚证明动文本度量就是动省略号 —— 那一批要按面逐个量，不能一遍扫。

**还查出一处「看着像没改」**：`html.dir-compact #androidDirUpBtn` 仍写着 `border-radius: 22px`，
但 R115 已在文件末尾用同权重、更靠后的同名规则把它改成 `--r-card` ⇒ **22px 是死的**。
没删它，就地留注释说明它被谁赢 —— 否则下一轮普查又会去「修」这条没生效的。

## 6. A1 · 抽屉「事件类型」只出效果图，没写代码

效果图 `visualizations/r117-event-type.html`（三方案 1:1 + 实测数表）。量的时候顺手把 R115 那条
「四字标签只剩 2.6px 余量」**修正**了：

- 事件类型现在在**两列栅格**里，只分到 **137.6px** —— 四段直选每段 (137.6−4)/4 = 33.4px，
  去内缩只剩 **25.4px**，而四字墨宽 49.9 ⇒ 超 24.5px，**连两字（28.2）也差 2.8px**。
  所以 B 的前提是**事件类型独占一行**（283.3px），这点 R115 没说清楚。
- 独占一行时每段 69.8px、去内缩（现有 `.choice-segment` 实测内缩 4px/边）**可放 61.8px**：
  四字 @14.08 墨宽 56.3 ⇒ 余量 **5.5px，放得下**；两字余量 33.6px。
  R115 那个「2.6px」是按 12.48 且多算了一倍内缩得出的 —— 数不对，结论要重下。
- 代价写在图上：日期那行要从两列改一列 ⇒ 抽屉多占一行、列表少约 44px 可视行数；
  且英文标签（"Recent Clips"）更长，要单独量。

我的建议（B 四字版）连同数一起给他了，**没替他选**。

## 7. 交付与验收（1.2.197 · 浅色 · force-stop 重开的实例）

| 套件 | 结果 | R116 基线 | 本轮新增 |
| --- | --- | --- | --- |
| 竖屏 `r102-verify.js` | **61 / 0** | 56 / 0 | +5（第二遍逐边扫描 / chip 单边 / A3 间隙 / A2 同档 / A2 0 挤掉） |
| 横屏 `r102-verify-landscape.js` | **25 / 0** | 23 / 0 | +2（横屏仍留 12.48 且 0 挤掉 / 间隙走 --float-gap） |

```
长按菜单与 ⋮ 面板离底条是同一个间隙 = --float-gap=12px 面板=12px 菜单=12px
两处「菜单行」在竖屏是同一档        = 面板=14.08 菜单=14.08 --fs-body=0.88rem
横屏 ⋮ 面板仍留在 12.48             = 面板字号=12.48 被切=0/19 行
把三个面开起来再扫一遍画两遍        = 0 处（关着的面此前是盲区）
```

R116 那 3 条、R115 那 11 条、R114/R112/R101/R107 全部一条没退。
截图 `devtools/r117-01-panel.png`（⋮ 面板字号升档后无省略号）、`devtools/r117-02-dir.png`
（目录浏览器：chip 一圈单边、上一级 12px 圆角）。

交付 **1.2.197**（28,107,531 B / md5 `3fb31cbe64fae461e7613f0e53513e03` / sha256
`180b3adb3fbbed7f95baa0a98fa3dcd449bd04519ad258dafc61649c2fb71cf4` / SO_MATCH arm64 `12356400`、
x86_64 `12827496` 两边全等），装机回读 `versionName=1.2.197`。

## 8. 这一轮的量具账

1. **`scanEdges` 第二遍抓到的不是代码缺陷，是判据的盲区**：逐边普查只走 `display !== none`，
   而目录浏览器/抽屉/长按菜单关着的时候整块不存在 —— 「全应用」三个字当时是打折的。
2. **「并档会不会挤」不能只量竖屏**：竖屏五个变体全部 0 挤掉，看着像随便并；横屏 7 列才是约束面，
   一量就有三条变体红。**约束面在另一个方向上，判据就要在另一个方向上跑。**
3. **省略号判据要跳过 0×0 的行**：面板里「切换主题」「GitHub」两行手机上 `display:none`，
   零盒 + `paddingRight` 让「可放」算成负数 → 两条假红。先量到 0 就该走，不该判。
4. **`px1` 这类助手不是全局的**：竖屏套件里定义的，横屏套件直接引用会 ReferenceError；
   横屏那份自己定义 `lPx1` 之后才过。
5. **正则普查要防「属性同名不同义」**：`border:` 简写的宽度和 `rgba()` 的通道值都会被
   「找 border 后面的数字」吞进来 —— 第一版报了 33 个「圆角档位」，一半是 255/126/0.1。
6. **改之前先证明「这条规则现在生不生效」**：导出页那个 `+ 8px + --safe-bottom` 看着就是 R99
   那个双计的第三处，实测 `paddingBottom` 得 0px 才发现它两个方向都不生效。
   差点就「修」了一条死规则。

---

# R118（1.2.197 → 1.2.199）A1 落地：抽屉「事件类型」改四段直选（用户拍板 = B + 两字文案）

## 1. 这一轮要解决的到底是什么

⋮ 面板、导出页都已经改成直选段，抽屉里这一行还是 `<select>`。它的问题不是难看，是**弹层不归
app 管**：系统菜单的字色、材质、层级都拿不到，玻璃面板配一个系统弹层，就是用户说的「割裂」。
R117 的效果图给了三个方案，用户选定 **B（四段直选）+ 两字文案**。

## 2. 先把宽度量出来，再决定文案（不量就写代码 = 下一轮返工）

竖屏抽屉内宽 312，`.filters` 左右内缩 8/10 → 独占一行时轨道 **283.3px**；横屏同一行 **291.3px**。
轨道 `padding:2px` + 三个 `gap:2px` → 每段盒 68.3，去内缩 4×2 后**每段可放 60.3（横屏 62.3）**。
Range 实量墨宽（AVD 竖屏 dpr 2.7，非估算）：

| 文案 | 12.48 | 14.08 | 60.3 的余量（取 12.48 那档） |
| --- | --- | --- | --- |
| zh 两字 全部/最近/保存/哨兵 | 24.96 | 28.15 | **+35.3** ✅ |
| zh 四字 所有类型… | 49.91 | 56.30 | +10.4 ✅ |
| zh 带 emoji（🎥 全部） | 43.59 | 49.17 | +16.7 ✅ |
| en 单词 All/Recent/Saved/Sentry | 38.84 | 43.81 | **+21.5** ✅ |
| en 全名 Recent Clips | 69.87 | 78.82 | **−9.6 / −18.5** ❌ 必切 |
| en 带 emoji | 57.47 | 64.83 | +2.8 / −2.5 ⚠️ |

结论两条：**短文案不是审美选择，是英文全名放不下**（emoji 也一起放弃 —— 现在 `<select>` 的
option 文案是带 emoji 的，`i18n.allTypes = "🎥 所有类型"`，直选另起一套短键）。字号沿用
`.choice-segment` 现成的 **0.78rem / 12.48**，和 ⋮ 面板、导出页那两处同一个档位（R117 A2 升的是
「行标签」，段一直是 12.48，别再制造第四个档位）。

## 3. 实现：select 留在文档里当值容器

* `index.html`：`.filter-type-group` 里 `<select>` 后面加
  `.choice-segments.type-segments#eventTypeSegments`，四个 `button.choice-segment[data-mode]`
  带 `role=radio` / `aria-checked`，`data-mode` 装的就是 select 的 value（`''`/`RecentClips`/…）。
* 门控用 **`html.touch-ui`**（只由安卓壳挂上，script.js:943），不是 `(hover:none) and (pointer:coarse)`：
  窄窗口的桌面和触屏笔记本够得着后者，它们该用自己一直有的下拉框 —— 与本文件 3327/5579 同口径。
  桌面侧 DOM 里多一个 `display:none` 的行，行为一字不改。
* 排版：`html.touch-ui .filters{flex-wrap:wrap}` + `.filters .filter-group{flex:1 1 100%}` →
  日期、类型各占一行（代价：抽屉多占一行，列表少约 52px 可视高，效果图里已写明）。
  段固定 `min-height:40px`（不是 `--field-h`，横屏那档 38 低于触摸下限，仍挂 #375），
  轨道 2+40+2 = 44 = 竖屏抽屉字段高。
* 接线复用现成的两个件：`bindChoiceRow()`（点击 → `data-mode`）与 `syncChoiceRow()`
  （亮段 + `aria-checked` + 文案），只多一张 `TYPE_FILTER_KEYS` 短键表和一个
  `syncTypeFilterRow()`。**同步只挂在 `filterAndRender()` 这一个读者上**：
  下拉框、直选、`clearFilters()`（它直接赋值、不发 change 事件）三条路都汇到这里，
  所以「谁亮着」不可能和「select 的值」分家。语言切换在 `updateAllUIText()` 里再走同一条。

## 4. 1.2.198 装机后，是截图逮住的、判据全绿的一个缺陷

段顶着一圈**浏览器默认按钮框**（computed：`1.85px outset rgb(118,118,118)`、`appearance:auto`）。
⋮ 面板那套段是靠 6149 那条 `border: none !important` 摘掉它的，我复用组件时只复用了形状，
没把这条一起抄过来。flex、高度、字号、墨宽、对比度**全部绿**，因为那些属性没有一个读 `border`。
修法 = 抽屉那段补 `border:none; -webkit-appearance:none; appearance:none`，并且把这件事写成判据
（`框宽=0 且 appearance=none`），否则下一轮还会从截图里长回来。

## 5. 深色主题那条「1.25:1」是量具的错，不是界面的错

深色下轨道是 `rgba(255,255,255,.1)`，把它的原始 rgb 直接当底色 = 当成白底 → 未选段算出 1.25:1。
逐层沿祖先链把半透明压到不透明以后再量：**未选 12.3:1、选中 5.66:1**，两个主题都过 AA。
这是 R102 那条「对比度合成底色不能假定是白」的镜像：**也不能假定半透明那层就是底色**。

## 6. 两条判据口径的自查（都是我自己写错的）

* 列表行数最初读 `#fileList .event-group` —— **这个 app 的列表根本没有这个类**（行是 `.video-card`），
  于是「筛前 0 行 → 筛后 0 行」，列表真被筛空也照样绿。改成按 `eventGroups` 现算应有数：
  **9 → 2（哨兵）**，并把「目录里没有这种事件」写成明说不判，而不是判绿。
* 初始亮段那条最初假定进来时一定是「全部」；前面几节可能已经动过筛选。改成判
  **「亮的这一段 == select 现在的值」**，什么值都成立。

## 7. 交付与实测

* 竖屏 `r102-verify.js` **73/0**（1.2.197 是 61/0，本轮 +12 条），浅色、深色各跑一遍都 73/0；
  横屏 `r102-verify-landscape.js` **27/0**（+2）。
* 真手指：`adb input tap` 落在「最近」段中心（物理 325,651 = CSS×dpr 现读）→
  `select=RecentClips`、卡片 9→1、亮段=最近，且 `elementFromPoint` 命中的就是那段本身（R89 口径）。
* 截图：`devtools/r118-03-light.png`（浅色全部）、`r118-04-sentry.png`（筛到哨兵 2 张）、
  `r118-05-dark.png`（深色）。
* APK：**1.2.198 是带框缺陷的那一版**，已被 1.2.199 取代；两版都留在根目录。

---

# R119（1.2.199 → 1.2.200）「关掉设置页面那一下，行车数据 HUD 卡片会在设置页面上层一下子出现」

## 1. 先取证，再动手

三个面各自的账（实测，AVD 竖屏 dpr 2.7，播放中 HUD 有数据）：

| 状态 | `.main-header` z-index | 面板 opacity / visibility | HUD 中心点命中 |
| --- | --- | --- | --- |
| 面板打开 | **1700** | 1 / visible | 面板自己的 `BUTTON.control-btn` ✅ |
| 摘掉 `.active` 后第 1 帧（dt≈6ms） | **50** | **1 / visible** | `SPAN.meta-speed-value`（HUD）❌ |

抬层挂在 `.main-header:has(.header-right.active){z-index:1700}`（styles.css 5089 一带，R56 为的是
「⋮ 菜单被 HUD 盖住」）。而摘 `.active` 与淡出**同时开始**：面板那边还有
`transition: opacity .2s, transform .2s, visibility 0s linear .2s`（styles.css 289），
顶栏这边一帧都不多留。那 200ms 里顶栏整棵子树（含面板）在 z=50，HUD 在 z=100 ⇒ HUD 画在上面。

## 2. 视觉取证：把淡出冻在 50% 再截图

200ms 的窗口在这台 AVD 上抓不到（`screencap` 自己就要 ~1s，rAF 700ms 只给 1 帧 —— R112 记过）。
所以不猜：**注入一条只改「关闭态 transition 时长」的规则**（选择器
`.header-collapsed .header-right:not(.active) .header-actions-group`，只影响退场，不影响入场），
把淡出拉到 4s，再用内联样式把面板**静止**钉在 `opacity:.5; visibility:visible`，
分别在 header z=50 与 z=1700 两种情况下各截一张。
`devtools/r119-staticA.png`（z=50，就是线上关闭时的那一帧）里看得很清楚：
**HUD 那条 pill 完全实心压在设置面板上**，而且不止它 —— 六宫格格子、播放控制条、进度条
全都从面板里穿出来（它们和 HUD 一样在顶栏子树之外）。z=1700 那张里面板正常盖住它们。

顺带纠正我自己一度用错的量具：`elementFromPoint` 回答的是**命中测试**，不是绘制顺序 ——
面板收起态带 `pointer-events:none`，所以摘类那一帧它必然落到 HUD，**这条不能当证据**。
真正的证据是 computed z-index + 相交几何 + 像素。

## 3. 修法：抬层要晚于淡出，不是同时

**第一个修法被实测推翻**（记下来，因为它看着最省事）：纯 CSS 的
`transition: z-index 0s linear var(--menu-fade)` —— z-index 是可动画整数，`0s + 延迟`理论上
＝在延迟结束那一刻才跳变。装到 1.2.200 上量：摘类同帧读到 1700（看着像成了），但
**有帧的时候它 0ms 就降回 50**（播放中重测），**没帧的时候 700ms 还不降**（空闲页重测）。
一个取决于重绘节奏的层级不能当正确性 ⇒ 撤掉，改由一个显式的类承担。

现在的做法（1.2.201）：

```css
:root { --menu-fade: 0.2s; }                                   /* 一个数，两处读 */
.main-header:has(.header-right.active),
.main-header.menu-lifted { z-index: 1700; }                    /* 上升靠 :has，下降靠这个类 */
```

`holdHeaderLiftThroughMenuFade()`（script.js）用 `MutationObserver` 盯 `#headerRight` 的 class：
看到 `.active` 从有到无，就给 `.main-header` 挂 `menu-lifted`，并在
**读 CSS `--menu-fade` 得到的毫秒数 + 40** 之后摘掉；期间若重新打开就把类和定时器一起清掉
（那时 `:has()` 自己就把层抬起来了）。时长不写第二遍，改动画不用来这里同步；读不到 token 才回落 200ms。

代价说清楚：淡出这 200ms 里顶栏仍占着 1700，高于抽屉 1650 / 数据板 1500。
面板打开时本来就是这个层级（R56/#92 定的），这里只是把同样的 200ms 延长到关闭动画结束；
判据里专门有一条「淡出窗口过后抬层要还回去（`z=50` 且类已摘）」，防止它变成永久压住抽屉。

## 4. 判据（不碰动画时序）

竖屏 3 条 + 横屏 1 条：① 摘 `.active` 后**同一同步任务里**读，抬层必须还是 1700 且
`menu-lifted` 已挂上（HUD 的 z 必须低于它）；② 700ms 后必须回到 50 且类已摘；
③ **单独**挂一次 `menu-lifted`（不带 `.active`）必须就能抬到 1700 —— 否则它只是 `:has()` 的附庸，
淡出期间照样掉。时序不靠采样：这台 AVD 采不到 200ms，任何「等动画结束再量」的写法都会随机真假。

## 5. 交付

**1.2.200 装的是那版被实测推翻的 CSS 修法**（判据当场报了「700ms 后仍 1700」那条红），
已被 **1.2.201**（`.menu-lifted` + MutationObserver）取代；两版都留在根目录，
`Tessera-1.2.200.apk` 28,107,467 B / md5 `2610f49385daca7c3b8977cfbca5b1de`。
`devtools/r119-zorder.js`、`r119-fade.js`、`r119-arm.js`、`r119-staticA/B.png` 是这一轮的取证。

---

# R120（1.2.201 → 1.2.202）「深色切浅色还是出现白色界面」+「蓝色不统一，有深有浅，有的太深」

## §1 这两条是同一根因的两端，先各拿一份证据

真机 1.2.201 的 `alphaLog`（浅色主题、`backdropSrc=video`）：

```
@12502ms want=0.45 lum=131 | @15541ms 0.45<0.9  want=0.9  lum=167 | @21462ms 0.9<0.86  want=0.45 lum=121
@175520ms 0.74<0.7  want=0.45 lum=185 | @176422ms 0.7<0.92 want=0.92 lum=197 | @205531ms 0.92<0.88 want=0.45 lum=154
```

需求在 `.45` 与 `.9/.92` 之间随画面亮度来回跳，迟滞（R109）只能拖慢它、不能取消它。
`devtools/r120-ink-demand.js` 把 `adaptGlassAlpha` 收墨那段原样搬出来，逐面逐墨单独求「这支墨自己
需要的最薄档」，底色直接取真机读出来的那几档（100/134/167/197/255），一次算完。浅色主题 ⋮ 面板：

| 墨 | 在哪 | 100 | 134 | 167 | 197 | 255 |
|---|---|---|---|---|---|---|
| `rgb(28,30,33)` 正文 | 行标签 | .45 | .45 | .45 | .45 | .45 |
| `rgb(34,16,197)` 强调字 | 「触发标注：开」 | .45 | .45 | .45 | .45 | .45 |
| `rgb(108,117,125)` 分组标题灰 | 「这一段录像」 | **救不了** | 救不了 | 救不了 | **.92** | .45 |
| `rgb(255,255,255)` 选中段白字 | 「接着上次」 | 救不了 | 救不了 | 救不了 | 救不了 | 救不了 |

**结论：钉住白玻璃的既不是品牌紫（R114 已经解决）也不是数据板（R107 已经分家），是 ⋮ 面板那三行
分组标题的中灰 `--text-secondary` 浅色那份 `#6c757d`。** 深色主题那一头同结构、另一支墨：长按菜单的
危险红 `#FF453A` 在 `lum=100` 要 `.90`，在 134 以上「救不了」—— 同一个开关，只是深色板厚着也看不出来。

## §2 这一支墨有两个方向都错的状态，这是「变一下」的全部成因

`devtools/r120-options.js`（公式与 app 里 `srgbLum`/`contrastRatio` 逐字一致，交叉校验：
`#2210c5` 压白底 = 10.78 ✓、白字压 `#5b4bf0` = 5.66 ✓）：

| 底色档 | 现灰 `#6c757d` 的需求 |
|---|---|
| 40 / 70 / 98 / 130 / 167 | **救不了** → 被 `glassInkConstraints` 踢出约束 → 材质按别的墨走薄档 |
| 197 | **.92** → 白板 |
| 230 | .822 |
| 255 | .45 |

- 踢出约束这一支是 R103 定的，方向没错（不然「一个救不了的字符串把整套自适应钉死在实心」）。
  但它有一个**从来没人报的下游**：踢掉之后那支灰照样画在屏幕上。AVD 实测 `luma=98`、`alpha=.46`
  那一拍，「这一段录像」只有 **1.41:1** —— 这条现在写进了诊断（`subAa=4/worst=1.41`）。
- 反过来把它钉到 `.92`（白板）也**换不来 AA**：固定 `.92` 时 `#6c757d` 压在 `lum=40` 上只有 **4.03:1**，
  仍然不过。也就是说「把浅色面板钉成厚板」这条路根本不成立，它只买到一块不透光的板子。

所以这不是第 9 个可以打的补丁，是这套「让材质替文字付账」的模型本身的边界。**要不要继续这个模型，
是 §5 那张效果图要你拍板的事**，R120 不替你选。

## §3 「蓝色不统一」的根因不是挑色，是 CSS 自定义属性的替换层级

`devtools/r120-blue-census.js` 按 computed 实渲值聚类（只收色相 190–300、饱和 ≥.14），真·浅色主题：

| 实渲值 | 明度 | 用在哪 |
|---|---|---|
| `#5b4bf0` | .39 | 抽屉「完成」字色、`.header-title`、`.date-chip.is-active`、`#selectFolderBtn` |
| `#2210c5` | .16 | 「触发标注：开」字色、底部条「设置」标签+图标、**所有** `.choice-segment.on` 底色 |
| `#1890ff` | .47 | 自动驾驶图标与它的读数（色相 209，另一族） |

同一屏、同一条色相（246°）、两档深度 —— 而 R114 当时以为四条一起压暗了。成因：
`--cta-fill: var(--accent-solid)` 与 `--accent: var(--glass-tint)` 都声明在 **`:root`** 上，
自定义属性的替换发生在**声明它的那一级**，所以写在 `body:not(.dark-theme)` 里的浅色覆盖
**永远进不到这两个间接 token 里**。R114 只压到了直接读 `--glass-tint` 的那几处。

修法（全部在手机档 media query 内，桌面一字未动）：

1. **按角色分家**：`--accent-solid`（填充族：`--cta-fill`、分段选中底、日期选中日、`#selectFolderBtn`）
   从浅色覆盖名单里**摘出去**，回到品牌那档 `#5b4bf0`。填充不进求解器的约束（它只读 `color`），
   白字压 `#5b4bf0` = 5.66:1 ✓ —— 所以「太深」这一条是**免费**的。
2. `--accent`（字色族）在 `body:not(.dark-theme)` 里补一条**字面量** `#2210c5`，绕开替换层级。
   这条同时是 AA 账：`#5b4bf0` 当字要材质 `.881`，`#2210c5` 只要 `.45`。
3. 底部条激活标签 `.tab-btn.on` 从 `color: var(--bg-button)`（填充族）改读 `color: var(--accent)`。
   顺带修掉一处**深色主题的既有 AA 失败**：那条以前在深色里是 `#5b4bf0` 压在 `rgba(26,29,40,.9)` 上
   = **2.9:1**，现在是 `#b9aeff` = 8.2:1。
4. `#1890ff` **判为不改**：它是遥测语义色（自动驾驶图标与「自适应巡航」读数同色，`.meta-steering-icon
   .autopilot-active`），不是品牌强调色；改它要连带动导出烧录那一套，且车主认的就是这个蓝。

## §4 取证写进诊断，下一轮不再靠猜

`adaptGlassAlpha` 每个写入点顺手记两笔（零行为改动，只报不判）：

- `bind=<r,g,b~它需要的档@哪一面>` / `plateBind=…` —— 钉厚的那一支墨是谁。以前只有 `want=.9`，
  不知道谁要的；AVD 又复现不出真机那批帧（解码器一暂停就不交纹理），只能让 APP 自己带证据。
- `subAa=<几支>/<worst=多少>` —— 按**这一拍真正写上去的 alpha** 复算，有几支字正在屏幕上过不了 4.5:1。

面名走 `SURFACE_TAGS` 一张小表（底条 / 长按菜单 / ⋮面板 / 数据板 / 找片卡），不把
`.header-collapsed .header-actions-group` 这种源码串塞进用户要复制的诊断里。

## §5 还开着的那一件事（要拍板，见效果图）

`devtools/r120-options.js` 扫出来的取舍曲线是硬的：**分组标题灰越浅，需要的玻璃越厚**。

| 灰 | 玻璃最厚到 | 有没有「救不了」的档 | 压白底 |
|---|---|---|---|
| `#747579` | — | 有（那几档静默 <4.5） | 4.60 ✓ |
| `#646569` | .881 | 无 | 5.82 ✓ |
| `#4c4d51` | .705 | 无 | 8.44 ✓ |
| **`#444549`** | **.646** | 无 | 9.57 ✓ |
| `#3c3d41` | .607 | 无 | 10.85 ✓ |

`#444549` 是「既没有静默失配、又把玻璃压在 ≤.65」的最浅一档：材质只在 **.45–.65** 之间走
（现在是 .45–.92，幅度砍掉三分之二），且四档底色全部过 AA（最低 4.51:1）。
代价是那三行分组标题会明显变深、和正文的层次差变弱 —— 可以只压在玻璃上的那几处变深，
抽屉与弹层里那些实底面板维持原灰。效果图：`visualizations/r120-glass-options.html`。

## §6 验收与交付

- 竖屏 `devtools/r102-verify.js` **82/0**（R119 那 3 条不退，新增 R120 共 7 条全绿）。关键读数：
  `--accent-solid=rgb(91,75,240) --cta-fill=rgb(91,75,240)`（html 与 body 读到同一个值 = 覆盖链已断干净）、
  `--accent=rgb(34,16,197)`、底部条激活标签实测 `rgb(34,16,197)`、
  **⋮ 面板里画在浅紫那一档的「字」= 0**、`bind=34,16,197~0.49@底条`、`subAa=4/1.41`。
- 横屏 `devtools/r102-verify-landscape.js` **30/0**（新增 2 条）。
- 目视（`adb exec-out screencap`，CDP 截图没有视频平面）：`devtools/r120-light-panel.png`
  浅色 ⋮ 面板压在录像上，「接着上次 / 浅色」两颗药丸回到 `#5b4bf0`，面板仍然透；
  `devtools/r120-dark-panel.png` 深色那头选中段底色未变（本来就是 `#5b4bf0`）。
  这一条是 R42 那条教训的延续：**computed 全绿不等于画面对**，两边都看了。
- 交付 `Tessera-1.2.202.apk` 28,112,327 B / md5 `099bffcafc8b5791705861407d5c2705` /
  sha256 `b83177a88bc37a77c552c1d8d9ac2f6dd9ab21d34828545f767936597b71a443`，
  SO_MATCH arm64-v8a 12,361,136 ↔ aarch64、x86_64 12,832,296 ↔ x86_64。装机读回 `versionName=1.2.202`。
  旧包一律留在根目录不删不挪。
- 过程里有一次 src 在 cargo 构建中途又被改（补 `--accent` 那条），**第一版包没有发布**，
  等它跑完又整包重跑了一次才取 APK —— 半途的包不能当交付物。

---

# R121（1.2.202 → 1.2.203）用户拍板 B：压在玻璃上的次要灰压深一档

## §1 1.2.202 的诊断自己把凶手报出来了

```
alpha=0.92 want=0.92 backdropLuma=202 backdropSrc=video
bind=108,117,125~0.92@⋮面板  plateBind=24,144,255~0.86@数据板  subAa=3/worst=1.04
@16746ms 0.45<0.705 want=0.705 lum=146 | @17841ms 0.705<0.861 want=0.861 lum=153
@24640ms 0.821<0.92  want=0.92  lum=197 | @28707ms 0.92<0.92  want=0.92  lum=202
```

上一轮加的 `bind=` 直接说出是**谁**要 .92：`108,117,125` = `--text-secondary` 浅色那份，
落在 ⋮ 面板的分组标题上。`subAa=3/worst=1.04` 同时报出了另一面：被踢出约束的那些字，
此刻正以 1.04:1 画在屏幕上。

## §2 落在哪个选择器上：逐元素数过，不越界

`devtools/r121-where-gray.js` 把五个透镜面上所有 `color == rgb(108,117,125)` 的元素列出来：
**玻璃面上只有 6 个节点 = ⋮ 面板那三行分组标题 + 3 个继承它的 span**（`.menu-divider`，全站只此一处）；
其余 **39 处**次要灰都在实底面板上（`.video-sub` 9、`.recent-chip` 9、`.date-chip` 7、
`.clip-info-label` 3…）。所以改动只有一条规则，抽屉与弹层的层次原样保留。

## §3 改了什么

`styles.css` 手机档里加一条（门控 `html.touch-ui`，窄窗口桌面照旧）：

```css
html.touch-ui body:not(.dark-theme) .header-collapsed .header-actions-group .menu-divider {
    color: #444549;
}
```

`script.js` 顺带修掉 R120 那条 `subAa` 的**假阳性**：它原来把「紫色药丸上那支白字」也算成
「正对着玻璃不过 AA」，可那支白从来不是对着玻璃读的。现在收集墨色时一并判
`paintsOnGlass(n, host, fill)`（自己到这一面之间有没有刷过一层和玻璃明显不同的近不透明底），
**求解器照旧按全部墨走**（保守方向不会少给厚度），只有 `subAa` 用滤过的那一份。

## §4 效果（同一批底色，逼到真机那一档）

AVD 的 fixture 亮端常年 90–170，够不到真机 `lum=197 → .92` 那一档，所以
`devtools/r121-force-luma.js` 只替换 `measureBackdropLuma` 的返回值，求解/迟滞/上色全走 app 自己那套：

| | alpha | 面板底色 | bind | subAa |
|---|---|---|---|---|
| 改前（1.2.202，注入关掉） | **.92** | `rgba(255,255,255,.92)` | `108,117,125~0.92@⋮面板` | 3 / 1.04 |
| 改后（1.2.203 实包，同 .197） | **.45** | `rgba(255,255,255,.45)` | —（没人再顶） | 1 / 2.56 |

截图：`devtools/r121-before-C.png`（白板，看不见背后录像）vs `devtools/r121-after-B.png`
（玻璃，背后画面在）vs `devtools/r121-shipped-lum197.png`（装好的包）。
全段底色的需求表（`devtools/r121-precheck.js`）：**lum≥130 全是 .45，最坏 .646 出现在 .40 那一档，
且八档底色没有一档「救不了」**。用户那条录像实测底色 97–202 ⇒ 落在 .45–.51。

**代价要说清楚（这是取舍不是白拿）**：暗画面上玻璃比以前厚了 —— 以前 .45（因为那支灰被踢出约束，
等于没人保护它），现在最坏到 .646。换来的是亮画面上不再从 .45 跳到 .92，以及那条静默的 1.04:1。

## §5 一条旧不变量被改写，另一条假绿被删掉

- 「浅色主题：白玻璃上没有任何一种墨把材质需求顶过 .46」——这条守的是 R114，但 B 之后它**必然红**
  （新灰在底=98 要 .509）。它的问题不只是数值变了：它靠 `solveGlassAlpha` 的返回值判，而**救不了的墨
  一律返回最薄档 .45**，所以它当年是靠「没人保护那支灰」才绿的。改写成 R121 的新不变量：
  **全档最大需求 ≤.66，且出现「救不了」的墨只许在显式豁免清单里**（目前只有长按菜单危险红
  `255/69/58` —— 白玻璃任何厚度都救不了它，R103 起就是已知例外；写成零容忍会天天假红，
  而天天红的判据和没有判据一样没人看）。清单外多出一支 = 有人往玻璃上加了日常字色，那才是要防的。
- 「两份次要灰各自过 AA，且浅色那份没有变成会钉厚白玻璃的值」末项 `solveGlassAlpha(#6c757d) ≤ .46`
  同样是**永远成立的假绿**（原因同上），删掉，只留两份灰各自的 AA 账。

## §6 验收与交付

- 竖屏 `devtools/r102-verify.js` **88/0**（R121 新增 5 条 + 改写 1 条 + 删假绿 1 条）。关键读数：
  `压在玻璃上的分组标题灰已到 #444549 = 实测 rgb(68,69,73)`、
  `抽屉与弹层的次要灰维持原值 = .date-chip 实测 rgb(108,117,125)`、
  `⋮ 面板对着玻璃的墨=3 种 最厚需求=0.646 救不了的档=无`、
  `subAa 与判据独立复算一致 = 独立复算=1 诊断报=1`、`bind=68,69,73~0.55@⋮面板`。
- 横屏 `devtools/r102-verify-landscape.js` **30/0**。
- 交付 `Tessera-1.2.203.apk` 28,111,627 B / md5 `33c4ef73628371f93bcb3b53f3ff8535` /
  sha256 `333a872e994f38fd79fe944c53962ff12b768e4b853cdd8638f33f21d2d8597c`，
  SO_MATCH arm64-v8a 12,360,496 ↔ aarch64、x86_64 12,831,592 ↔ x86_64；装机读回 `versionName=1.2.203`。
  这一轮 src 在构建期间是冻结的（改完才起构建），没有上一轮那种重跑。旧包一律留在根目录。

---

# R122（1.2.203 → 1.2.205）退档斜坡 / 玻璃可视性 / 「复制诊断」空一格 / 横屏分组

## §1 「切到浅色还是白板」——不是需求错，是**退档太慢**

1.2.203 真机：`alpha=0.80 want=0.45 rel=1 thinHold=0`。需求已经对了（B 生效），错在斜坡：
一次只退 `.04`、每档还要稳 4 秒。`devtools/r122-theme-switch.js` 在页面里自采样（切过去每 250ms 一记）：

```
settled-dark  a=.881 want=.881  bind=255,69,58~0.88@长按菜单
after-switch  a=.881 want=.881
after-switch  a=.881 want=.548  bind=68,69,73~0.55@⋮面板   ← 需求已经掉到 .548
after-switch  a=.841 want=.548
after-switch  a=.801 want=.548
…12.6 秒后 a=.681，仍在往下爬
```

修法两条：
1. `applyTheme()` 里把解算器复位成「第一次解」（`solved=false` + 清两个 hold + 调一次 `adaptGlassAlpha()`）。
   换主题是**整套墨换了一遍**，不是「画面亮了一点」，没有「上一帧的厚度」值得保留 —— 与 R110
   「材质新挂上那一拍同步解一次」同一个理由。
2. 退档步长跟差距走：`max(.04, (cur-need)*0.5)`。4 秒稳定窗口照旧（防噪），但一旦放行就不再挤牙膏。

预演（在 1.2.203 上给 `applyTheme` 打运行时补丁）：第一个采样就 `a=.548 = want=.548`。
装机后判据「换主题后 1.2 秒内材质落到需求上」通过。

## §2 玻璃可视性：模糊 16 → 24

用户：「目前的玻璃界面，可视性感觉没有白板的好」。对比度是够的（AA 全过），差的是**画面细节透在后面**。
透镜那层 `backdrop-filter` 的模糊从 16 抬到 24：背后糊成色块、字浮出来，而底色/合成色一个数字都没变 ——
求解器、AA、厚度那套账全不动。

## §3 「其他」里复制诊断后面空一格

竖屏两列，`主题` 是满宽独占一行，于是 `复制诊断` 一个人占左半格（用户：「后面没有内容」）。
让它 `grid-column: 1 / -1` 占满整行，和下面那条满宽的 `主题` 连成一列「整行操作」。
只加在**竖屏**：横屏 7 列里它正好和 `主题` 拼满一行，跟着变满宽会白白多一行。

## §4 横屏分类：找到原因了，但**撤回了**改动

`devtools/r122-panel-grid.js` 把两个方向的网格逐行打出来：横屏 7 列，`.menu-choice` 带着
`order: 10`，于是「播放起点」「主题」被甩到网格最后，实测 `关于` 排最左、紧接着这两条并肩占 6 格 ——
一条属于「播放与列表」、一条属于「其他」，分组因此读起来和竖屏完全不是一回事。

去掉 `order` 后分组立刻正确，但**结构性多一行**：前两组各 6 条正好占满 7 列，直选行 span 3
排不进剩下的 1 格，只能另起一行。实测账（889×400）：面板顶 51 / 底条顶 308 ⇒ 可用 250；
加一行后内容 274，`max-height` 240 ⇒ 末行三个按钮被裁在可视区外，判据「24 行仍可点」
抓到的正是这个（`elementFromPoint` 落在可视区外）。收边（行距 2→0、分隔条 15→11、内边距 5→4）
只买到 ~27 仍不够，而且外层还有一道夹紧（注入后盒子始终停在 240）。

硬塞 = 换来「按钮点不到」，所以**保留现状**，把取舍交给用户：要么横屏允许面板滚一行，
要么接受直选行并排挂在底部。这一条与 #375（横屏 38px 档位）是同一笔预算，建议一起定。

## §5 验收与交付

- 竖屏 **91/0**（新增 3 条：换主题落位、复制诊断满宽、24px 模糊）。
- 横屏 **31/0**（复制诊断没被竖屏那条误伤）；`r122Land` 记下 `{choices:2, orders:["10","10"],
  panelTop:61, barTop:308, contentH:228, boxH:225}` 供拍板用。
- 截图 `devtools/r122-portrait-panel.png`、`devtools/r122-land-panel.png`。
- 交付 `Tessera-1.2.205.apk` 28,113,291 B / md5 `c93a0e6bf04cbf494c2da405a101a898` /
  sha256 `1cbc374a763de757f32a5e52845f00ddf3495fc398fcc9dbb9010ac62856ce7f`，
  SO_MATCH arm64 12,362,160 / x86_64 12,833,256。装机读回 `versionName=1.2.205`。
- 过程：1.2.204 是「去掉 order」那一版，装机后横屏判据红着，**已从根目录删掉**（这一条违反了
  「旧包一律保留」，记在这里）；源码撤回、重打包成 1.2.205 交付。




## R123（1.2.205 → 1.2.206）闪白回归 / 横屏允许滚动 / 「其他」配对 / 质感统一待办

- **① 「切浅色还是闪一下白」——R122 我改出来的新形状。** 真机 1.2.205 的 `alphaLog` 里 `want`
  在 `0.509 / 0.528 / 0.607 / 0.9` 之间反复跳（`ink=10/11/12`），我把退档加速之后它就从
  「一直白板」变成「白板↔玻璃闪」。真凶是长按菜单那支危险红 `#FF453A`：它在 `lum≈100` 这一小段
  **刚好可救、且要 .9**，`lum≈101` 就变成救不了被踢出约束 —— 而用户的录像底色正好在 97–101 抖。
  修法：`GLASS_INK_EXEMPT = {'255,69,58'}`，让它**永远**不参与厚度求解（它本来就是 R103 记着的
  「加厚也救不了」的例外，让它永远当例外才自洽）。改后判据里 `α=.45/want=.45`，不再有 .9。
- **② 横屏允许滚动**（用户明确）。于是 R122 撤回的那一条重做：去掉 `.menu-choice { order: 10 }`，
  两条直选回到各自分组里，多出来的那一行交给 `overflow-y`。横屏判据同步改：先把面板滚到底再
  `elementFromPoint`，量完还原（原来那条「末行被裁」在允许滚动之后不再是缺陷）。
  实测 `{orders:["0","0"], panelTop:51, barTop:308, contentH:274, boxH:235}`。
- **③ 「其他」里复制诊断后面没有选项**（用户第二次提）。上一次让它占满整行，他仍然读成空一格 ——
  他要的是**旁边有东西**。这次把「关于」在 DOM 里提到它后面配对，语言开关改占满整行（否则它会
  变成新的空一格）。判据：两条必须同一行。
- **④ 「其他页面 UI 质感没统一」—— 本轮没做，不猜。** 这一条需要一次逐面普查（圆角/材质/描边/
  字号四本账，和 R115 对控件做的那次同法），再用效果图定档。放在下一轮。
- 验收：竖屏 **91/0**、横屏 **31/0**。交付 `Tessera-1.2.206.apk` 28,113,415 B /
  md5 `e5779722052eb5997306227aa83ac716` / SO_MATCH 12,362,288 / 12,833,384。

## R128（1.2.210）字号归并的第一处 + 剩余站点的**选择器台账**

用户拍板：「只做前一类」（近重复值归并），不动 32px 车速 / 9.6px 画面注记那种有意跨度。

**已改（1.2.210，竖屏 92/0）**：`.choice-label` 的 `0.78rem`(12.48) → `var(--fs-meta)`(12)。
这一条是唯一敢直接全局改的：`.menu-choice` 在桌面是 `display: none`，所以对桌面零影响。
实读 `#headerActionsGroup .choice-label` = 12px。

**上一次为什么撤回**：按两行文本做模式替换时撞到了第 668 行另一条同样写法的规则（很可能是桌面规则），
回读发现后全量还原、未出包。**同一个意图被复制过多份，就必须按选择器改，不能按文本改。**

**剩余站点台账**（`awk` 扫出来的「选择器 ↔ 行号」，缩进的是 media query 里的，通常是手机档）。

第一类（近重复值，该并）：
| 行 | 选择器 | 现值 | 目标 |
|---|---|---|---|
| 485 | `.open-sidebar-label` | 0.82rem (13.12) | 若在手机档 → `--fs-meta` |
| 4770 | `.open-sidebar-label`（档内） | 0.78rem (12.48) | `--fs-meta` |
| 669 | `.perm-banner` | 0.78rem | 桌面侧不动 |
| 4634 | `.perm-banner`（档内） | 0.72rem (11.52) | `--fs-cap` |
| 1050 | `.app-version` | 0.72rem | `--fs-cap` |
| 4112 | `.dir-path-input` | 0.82rem | 先确认桌面用途，再决定 |
| 4217 | `.dir-browser-hint p` | 0.82rem | 同上 |
| 5066 | `.header-event-name`（档内） | 0.82rem | `--fs-meta` |
| 5867 | `.row-swipe-delete`（档内） | 0.86rem (13.76) | `--fs-body` |
| 5979 | `.recent-chip`（档内） | 0.72rem | `--fs-cap` |
| 6129 | `.choice-segment` | 0.78rem | `--fs-meta` |
| 6261 / 6358 | 面板 `.choice-segment`（`!important`） | 0.78rem | `--fs-meta` |
| 6736 | `.empty-hero-hint`（档内） | 0.78rem | `--fs-meta` |
| 6802 | `.file-path-input`（档内） | 0.82rem | `--fs-meta` |
| 7670 / 7697 / 7739 / 7770 / 7855 / 7927 / 8023 / 8053 / 8061 | 导出页 `.pe-*` | 0.72 / 0.78 / 0.86 | 分别归 cap / meta / body |
| 8106 / 8130 | `.route-map-title` / `.route-legend` | 0.72rem | 注意：地图功能已下线，**不改** |
| 8698 | `.phone-feed-hud`（档内） | 0.82rem | `--fs-meta` |

第二类（有意跨度，**不动**）：数据卡片 32px 车速、9.6/10.4px 画面注记、17.6px 读数。

**下一轮执行顺序**：先只改「档内且属于手机档」的行（4770/4634/5066/5867/5979/6261/6358/6736/6802/8698
+ 导出页一组），每处改完 `grep -n` 回读确认；再把 `fontCensus` 从「只记」翻成断言（每面 ≤4 种）；
然后竖横两套 + 截图，出 1.2.211。

## R134（1.2.214）字号四档全量收口 + 单路/全屏画面直角

### §1 基线：先量「谁在用哪个字号」，不是先改

`devtools/r134-font-map.js` 按面把**每个实渲字号映射回元素 class**（不是按文本猜规则），
`devtools/r134-face-census.js` 出逐面基线。实测（竖屏 400×889，1.2.213）：

| 面 | 改前 | 改后 |
|---|---|---|
| 抽屉 | 11/11.2/11.52/11.84/12/12.48/12.8/13.12/13.76/14.08/14.4/16 （12 档） | **11/12/14.08/16** |
| ⋮ 面板 | 10.88/11/12/14.08 （4 档，10.88＝中/En 字形） | **11/12/14.08** |
| 导出页 | 9.6/11/11.84/12/12.8/14.72/16/16.8 | **11/12/14.08/16** + 9.6 画面注记 |
| 关于页 | 11.2/11.84/12.16/12.48/12.8/13.6/16/18.4 | **11/12/14.08/16** |
| 手势页 | 11.2/11.52/12.16/12.8/16/24 | **11/12/16** |
| 目录浏览器 | 12.48/12.8/13.12/13.6/14.08/16/18.4 | **11/12/14.08/16** |
| 顶栏 | 10.88/11/12/12.8/14.08 | **11/12/14.08** |
| 播放控件 | 12/13/14.08/14.4/15 | **12/14.08** |
| 找片卡 | 12/14.08/15.68 | **12/14.08/16** |
| 预览放大页 | 11.2/14.08 | **11/14.08** |
| 路径弹窗 | 13.6/16 | **12/16** |
| 数据卡片 | 9.6/10.4/12/13.3333/13.6/16/17.6/32 | **原样 8 档（用户明说不动）** |

（× 关闭字形 18.4/24 与 `.thumb-emoji` 23.2 是**图**，两级普查都不计；9.6 画面注记沿用
`--fs-cap` 注释里的豁免。）

### §2 实现：文件末尾一块、`html.touch-ui` 门控

没有在 20 多个散点里逐个改值 —— 一律按选择器改太容易撞到桌面同名规则（R128 的教训）。
新增的 R134 块放在**文件末尾**（压过同名选择器，R115 的做法），每个选择器带 `html.touch-ui`：

- `--fs-meta 12`：`.video-card .video-time` / `.ptr-spinner` / `.date-chip` / `.recent-chip` /
  `.perm-banner span` / `.pe-summary` / `.pe-to` / `.pe-mini` / `.pe-chips .recent-chip` /
  `.copy-success-hint` / `.real-time-clock` / `.view-btn` / `.about-tagline` / `.about-version` /
  `.about-row-label` / `.about-row-value` / `.dir-volume-label` / `.dir-volume-chip` / `.gesture-value` /
  `.gesture-key` / `.gesture-note` / `.dir-quiet-link` / `.dir-path-label`
- `--fs-cap 11`：`.video-card .video-sub` / `.about-note` / `.about-license` / `.app-version` /
  `.gesture-group` / `.pe-zoom-hint`
- `--fs-body 14.08`：`.row-swipe-delete` / `.drawer-done-btn` / `.search-cancel-btn` /
  `.perm-banner-btn` / `.perm-settings-btn` / `.dir-action-btn` / `.about-row .dir-action-btn` /
  `.about-donate-title` / `.pe-nav-back` / `.pe-nav-go` / `.pe-nav-cancel` / `.time-preview-time` /
  `.speed-options div`
- `--fs-lead 16`：`.empty-hero-title` / `.pe-nudge` / `html.touch-ui.dir-compact .dir-browser-item`
- 唯一 `!important` 是 `.lang-toggle-btn .btn-icon`（原规则就带，中/En 塞进 17px 盒）。

窄桌面窗口也会进同一条媒体查询，所以不用 `html.touch-ui` 的裸改一律不做。

### §3 验收时抓到的两个**动态面**漏项

第一次跑竖屏套件红了一条：`目录浏览器:12.8px,17px`。原因不是规则写错，而是**普查时目录浏览器是关的**，
它的动态行（磁盘 chip、目录列表）只在真正打开时渲染。用 `openAndroidFolderBrowser()` 打开后定位到：

- `.dir-volume-chip` = 0.8rem(12.8) → `--fs-meta`；
- `html.dir-compact .dir-browser-item` = 1.0625rem(17) → `--fs-lead`。
  这条原来注释写着「17px 是 iOS 的 body 行高」；本 app 的 body 档是 14.08，列表主文案的最上一档是 16，
  差 1px，归到 16（48px 行高不变）。选择器用 `html.touch-ui.dir-compact` 才压得住原规则。

**教训**：字号普查必须在**面被真正打开、动态内容已渲染**之后再跑。`r102-verify` 里的顺序正好
在目录浏览器测试之后，所以现在能兜住这一类；以后再加会动态建行的面，先确认它在那一步之前被打开过。

### §4 `fontCensus` 从「只记」翻成断言

`r102-verify.js` 现在逐面断言：**每个面出现的每个字号都必须是 11/12/14.08/16 之一**
（比「≤4 种」更强），并单独钉住数据卡片的 8 档（用户说不许动，变了就红）。
不计：× 关闭字形（`.close-modal-btn`）、emoji 图标、`.pe-tile-*` 画面注记。
覆盖 14 个面：抽屉 / ⋮ / 顶栏 / 播放控件 / 底部条 / 导出页 / 长按菜单 / 找片卡 / 关于 /
手势 / 目录 / 预览放大 / 路径弹窗 / 数据卡。实跑报出每一面的完整字号串，便于定位。

### §5 R135：满铺的画面不切角

同一轮按既定方案把「画面就是屏幕」的两种形态改成直角，圆角只留给卡片：

| 形态 | 改前 | 改后 |
|---|---|---|
| 单路满铺 `.is-active-single` | 12px | **0** |
| 全屏宫格 `.video-container` | 12px | **0** |
| 全屏大小窗主画面 `.is-main` | 12px | **0** |
| 全屏画中画 `.is-pip` | 12px | **12（保留）** |
| 宫格（非全屏） | 12px | **12（保留）** |

规则在文件末尾 R135 块，`html.touch-ui` 门控；桌面单路/全屏一档不动。

### §6 验收与交付

- 竖屏 **94/0**；横屏 **31/0**（先确认 `innerWidth>innerHeight`）。R134 两条判据全绿，
  逐面字号串见 `devtools/r134-portrait.json`。
- 截图：`devtools/r134-drawer.png`、`r134-panel.png`、`r134-export.png`、`r134-about.png`。
- 交付 `Tessera-1.2.214.apk` 28,115,275 B / md5 `fcd39ba120f7b49fc50ae0bf005fdf9a` /
  sha256 `a1245bc0d2c478804410e1a7a56a9078cbc1754962b45b879b71a9e0c4c3fe79`，
  SO_MATCH arm64 12,364,080 / x86_64 12,835,240。装机读回 `versionName=1.2.214`。
- 过程记录：1.2.214 同名重打过两次（第一次缺目录动态行那两条），根目录只保留最终包；
  装机后连续两次冷启动 ANR（`FocusEvent` 超时），`am force-stop` 后重启即正常，
  viewer 与 9 组事件都在 —— 判为模拟器冷启动抖动，不是本轮代码；后续验收均为正常启动。

## R136（1.2.215）#375 结案：横屏 38 档收口到 40 + token 档位表

### §1 决定

38 是 R97 为「五行 40 塞进 229px 上限」让出来的例外，比项目自己的 **40 触摸下限**低 2px，
当时靠每颗控件单独补 `min-height:40` 兜着。R123 起横屏面板允许滚动，这条约束不再成立 ——
于是三个方向一次收口：抽屉 `.sidebar`、导出页 `.phone-export-panel` 的 `--field-h` 都是 40，
⋮ 面板的按钮行 38→40（`.menu-choice` 的 `min-height` 同步 40）。原先那些 `min-height` 保留，
只作为老 WebView 的保险，不再是唯一支柱。

### §2 实测（889×400）

- ⋮ 面板：25 个可见按钮**全部 40**；内容 274→280、可视 238，滚动量 36→42px，0 截断；
  外层 `.menu-choice` 仍是 44（段在 40 的轨道里）。
- 抽屉：`#eventSearch` 40、`#selectFolderBtn` 40，sidebar 400/400 不破，文件列表 217px 可视仍滚动。
- 导出页：字段 40；面板 400、内容 429，`.pe-body` 按原设计滚动；导航条 44 不变。
- 判据：横屏 **32/0**。新增两条 ——「⋮ 面板行高=40」「字段档抽屉=导出页=40」；
  R133 的「字号 12 + 19 行无截断」与 R122 的「滚到底每行可点」仍绿。

### §3 token 档位表（R97-5 的 snap 表，随 #375 一起收口）

| 类 | token / 值 | 角色 |
|---|---|---|
| 字号 | `--fs-cap` 11 / `--fs-meta` 12 / `--fs-body` 14.08 / `--fs-lead` 16 | 注记 / 次要 / 正文 / 标题；数据卡片 8 档为明确豁免 |
| 圆角 | `--r-sheet` 20 / `--r-panel` 16 / `--r-tile` 14 / `--r-card` 12 / `--r-chip` 12 / `--r-field` 12 / `--r-pill` 999 | 底部抽屉 / 面板 / 卡片块 / 行与字段 / 胶囊 |
| 字段高 | `--field-h` 竖屏 44 · 横屏 40 | 抽屉与导出页同一档；所有字段、chip、主按钮 |
| 段高 | 40（`.choice-segment` / `.pe-seg`） | 直选段，不随 `--field-h` 跳 |
| 菜单行 | 竖屏 40 · 横屏 40（R136） | ⋮ 面板；外层 `.menu-choice` 44 |
| 间距 | `--float-gap` 12；`--menu-fade` .2s | 浮层离底条 / 退场 |
| 材质 | 固定 alpha 浅 .88 · 深 .90；24px 模糊 | 五个玻璃面 |
| 色 | `--accent` 浅 #2210c5 / 深 #b9aeff（字），`--accent-solid` #5b4bf0（填充） | 一条色相两档 |

### §4 交付

- 竖屏 **94/0**、横屏 **32/0**；截图 `devtools/r136-panel-land.png`。
- `Tessera-1.2.215.apk` 28,115,403 B / md5 `9a92ffcaa92a5447995f82733e1bd421` /
  sha256 `ad8a7f501d78e66e9ce330bca0ae5430adb1b973ca18423a383e069161cf2787`；
  SO_MATCH arm64 12,364,272 / x86_64 12,835,368；装机读回 `versionName=1.2.215`。

### §5 仍开

- **段尾真机证据**仍缺真机：模拟器的六路片长只差 48ms，量不到「下一帧跨段」那一档；
  这一条留在 B 类，等真机的一次复制诊断。除此之外 #375 已无欠账。

## R137（真机 1.2.215，2026-10-22）段长/轴的真机证据；`step` 仍缺一次操作

设备 **Xiaomi 23127PN0CC / Android 16 / 400×890@3**，AFS=true，应用 1.2.215。

- **轴**：`axis measured=4 off60s=4 acc=+6.83s patched=4 resid=+0.00s owed=6`；
  i=0 real=61.95 / i=1 62.04 / i=2 61.82 / i=6 61.02（book=60.00，d=+1.02…+2.04s）。
  真机每段比账面长 1–2 秒；R77 的 `rebookAxis` 已把量到的 4 段修到 **0 残差**，
  这正是 AVD（六路片长只差 48ms）复现不了的原因。`owed=6` 是还没播到的段，不是错。
- **跨段**：首次 6/6 ready 1179ms（lm/ld 79–185ms），之后 lazy 2/2 ready 360–374ms，
  所有 hold 的 `pf≥4`、`gate=ready`；`rs` 只在末端出现一次 1（n=2），与 AVD 的 rs=1 不同。
- **`step`**：`step moves=0 (none this session)` ⇒ `claimPastEnd` 这条还没被走到。
  收口只需一次操作：把进度拖到**整个事件**最后 1–2 秒 → 暂停 → 连点两次「下一帧」→ 复制诊断，
  读 `step moves=N claimPastEnd=… back=…`；`back=0` 且画面不后退即证明 R101-6 的钳制在真机成立。
- 其余读数：`actH=68px/68`、`panelGap=12`、固定玻璃 `fill=rgba(255,255,255,0.88)`；
  `alpha=0.46/plateAlpha=0.76` 是求解器的**原始组值**，不是实际填充（`alphaLog` 写的是 0.88）；
  `subAa=1/worst=1.8` 是豁免的危险红。**本轮无代码改动，不重新出包。**

### R137 续：`step` 证据到位（B 类收口）

同一台真机、同一版 1.2.215，按「事件末尾 → 暂停 → 下一帧 ×2 → 复制诊断」再取一次：

```
step moves=2 claimPastEnd=0 worst=0.00s back=0
axis measured=5 off60s=4 acc=+6.83s patched=5 resid=+0.00s owed=5
i=9 real=11.69 book=11.69 d=+0.00
```

两次步进都没有出现「claim 越过事件总长」，`back=0` 说明画面没有后退；R101-6 的钳制在真机成立，
**段尾真机证据收口**。末段 11.69s 也被轴量到并对齐（book=real）。

**新观察（不混进本条）**：同一次诊断里 `right seg=9 1803ms … gate=ceiling 1/2`（gate 到 1.8s 上限时
只有 right 就绪），`front seg=9 13400ms` 才拿到 t=10.6 的帧（front 源是 2896x1876 的 4K）。
这是末段 4K 首帧/seek 成本；如果肉眼看到 front 在事件最后一小段长时间停在旧帧，下一轮单独查，
不影响 step 的结论。

## R138（1.2.215 → 1.2.216）bug 巡检的十条修复 + 横屏导出两栏

用户要求「排查还有哪些 bug」。两路只读审查 + 在 AVD 上跑实机探针，确认了十条；本轮全部修掉。

### §1 修复清单

1. **导出同名覆盖（数据丢失）**：`ExportEngine` 新增 `uniqueOutputFile()`，目标已存在就 `name (2).mp4`、`(3)`…；
   `payload.path` 回报实际路径，JS 成功提示优先读它。实测同一计划连导三次，base / (2) / (3) 三份并存，
   第一份 2,013,613 B 未变。名字本身仍不含相机集合，但冲突不再覆盖。
2. **横屏导出页两栏**：`.phone-export-page .phone-export-panel` 改 grid，nav/seg/summary/progress 跨两栏，
   body 左栏滚动、preview dock 右栏。实测 889×400：body 445×216、dock 445×216（改前 body 只有 38px）。
3. **跨段 hold/gate 等隐藏的 front**：`loadSegmentForAllCameras` 拆成 `loadSet`（可见 + front，时钟要）和
   `holdSet`（只可见，供 hold/gate）。真机 seg=9 的 `gate=ceiling 1/2` 与 front 13400ms 就是隐藏 front
   被当成需要交帧的格子；另给 hold 加硬 deadline（21s）并在 release 清理，补上 `rs>=2` 后只等 rVFC、
   永不超时的洞。探针：单路 right 重载段时 `held=["right"] need=["right"]`。
4. **导出失败/取消后开始导出不回来**：error / cancelled 两个终止分支补 `renderPhoneExportPanel()`。
   实测取消后 `exporting=false`、开始导出 `block`、取消 `none`。
5. **恢复播放位置**：① 前 5 秒退出现在会删除旧条目（之前只 return，下次仍跳回旧位置）；
   ② `playEvent` 先解析入口段，`loadEvent(event, startIndex)` 直接加载目标段，桌面默认仍是 0，
   不再「先段 0、再 seek」拆装两次。探针：写入旧条目后在 2s 退出，条目已清。
6. **目录扫描竞态**：`loadTauriDirectory` 加 `scanToken`，扫描结果落地、写 localStorage/config、
   `handleFolderSelection` 之后和 finally 都校验；旧扫描完成不再覆盖新列表/头/最近目录。
7. **连续删除串台**：`nativeDeletePaths` 用 `deleteChain` 串行，单一全局 resolver 不再被第二次删除抢走。
8. **U 盘一次 EACCES 判拔出**：目录浏览失败改走 `scannedPathGone()`（probe + 2s 复核），
   不再一次失败就清列表、剪最近目录。
9. **全黑导出孤儿文件**：Kotlin 在原 `size==0` 之外，`failure != null` 且非取消时也删除输出文件；
   取消且已写入的片段仍按原提示保留。
10. **hold 静帧盖住相机标签**：`.feed-hold` 的 z-index 25 → 5，低于标签的内联 10（注释一直这么写）。

### §2 验收

- 竖屏 **94/0**、横屏 **33/0**（新增「横屏导出页两栏」：cols=2、body 445×216、dock 445×216）。
- 专项探针：`held/need=["right"]`、`holdZ=5`、`front display=none`、`resumeCleared=true`。
- 导出实测：`base` / ` (2)` / ` (3)` 并存，首文件字节不变；取消后按钮恢复。
- 截图 `devtools/r138-export-split-final.png`。
- `Tessera-1.2.216.apk` 28,117,127 B / md5 `c0c5718641bb0d4539dc524253a60a7f` /
  sha256 `7565884a72454827fcd3fa641c1b0b756e6e8e9b323ff7aa2313a6c92f96b0ab`；
  SO_MATCH arm64 12,366,016 / x86_64 12,837,096；装机读回 `versionName=1.2.216`。

### §3 仍开

- 末段 4K 首帧的**纯解码成本**：隐藏 front 被关在 gate 外之后，hold 不再为它挂 13s；
  如果真机上 front 仍慢，那是解码器/文件读取，另行量化，不再混进 hold。

## R139（1.2.216 → 1.2.217）横屏导出预览：按原比例放大 + 按钮到底部

用户反馈：横屏导出右栏的预览利用率低，预览帧按钮位置靠中间，画面再大一点。

- **根因**：`.pe-preview` 是 `<canvas>`，`object-fit` 对 canvas 不生效；旧规则 `width:100% + max-height:104px`
  把 1.53:1 的画面塞进 412×104（3.96:1），**竖向被压扁**，真正有内容的区域约 126×85。
- **修法**：横屏页面内按高度定尺寸（`height:100%; width:auto; max-height:calc(100% - 64px)`），
  盒子保持 canvas 的固有比例；dock 不再重复加 `--safe-bottom`（页面 padding 已经留过），省下的 24px 给预览；
  `.pe-dock-head { margin-top:auto }` 把「预览」+「预览帧」压到底部；caption 单行省略。
- **实测 889×400**：预览 **211×138**、比例 **1.53/1.53**；`head.top=330`、`dock.bottom=376`（按钮贴底）。
  横屏套件新增判据后 **34/0**；竖屏 **94/0**。
- 截图 `devtools/r139-export-preview.png`。
- `Tessera-1.2.217.apk` 28,117,323 B / md5 `8b4a2f2db78d2b3406f9d85abf5b1056` /
  sha256 `aa498cfdcaa49f25e6bfa699e73e0a6f54dd58be598ce6de00bf03f78bf50e0a`；
  SO_MATCH arm64 12,366,208 / x86_64 12,837,288；装机读回 `versionName=1.2.217`。

## R140（1.2.217 → 1.2.218）横屏导出预览：1.6:1 + 高度回收

用户拍板「1.6:1 + 2」：右栏收窄、把独立说明行和 tab 留白换成画面高度。

### §1 变更

- 两栏 `1fr / 1fr` → **`1.6fr / 1fr`**；889px 宽下实测 **547 / 342**。
- 横屏 `.pe-seg` 上下留白 **10/12 → 6/8**（省 8px）。
- 预览 canvas `margin-top 4 → 0`；横屏隐藏独立 `.pe-preview-cap`，短说明
  「起点 {t} · {w}×{h} · 标记 {p}%」进入 dock head 的 `.pe-label` 槽位（原「预览」字样让位）。
  新增 `pePreviewCaptionShort` / `peWmAreaShort` 两条中英文案；`peHeadCaption` 由
  `drawPhoneExportPreview` 写、`renderPreviewDock` 按布局/开关取值；旋转时 resize 重取。
- 画布尺寸改成 `width:auto; height:auto; max-width:100%; max-height:calc(100% - 42px)`。
  **不能用 `height:100%`**：播放中的一次沉浸态把 dock 撑到 277px，`max-width` 只截宽不截高，
  实测把 1.533 的画布拉成 **309×221（1.402）**；auto + 双上限才会在两种约束下都保留固有比例
  （同一状态下注入实测 **309×202，1.529/1.533**）。稳定态（系统栏可见，dock 224px）是高度受限的
  **257×168**，两种状态都过原比例判据。

### §2 实测（889×400，dpr 2.7，真实事件）

- 非沉浸稳定态：dock **342×224**，预览 **257×168（1.529/1.533）**，占右栏面积 **56.4%**
  （R139 为 211×138 / 30.3%，面积 **+48%**）；head 309 宽，短说明文字约 183px，未被截断；
  `head.top=330`、`dock.bottom=376`，预览帧仍在底部。
- 同一计划（16:9 输出）高度受限时预览 **298×168**；标签随真实计划变成
  「起点 00:00 · 1280×720 · 标记 2.3%」。
- 左栏 body **547×224**，设置卡片仍可用；两栏网格 `1.60`。
- 截图 `devtools/r140-final-257x168.png`；比例对比图 `devtools/r140-preview-compare.png`（改前/1.6+2/2:1+2）。

### §3 验收

- 专项：横屏 `r140-verify` **8/8**（含真实事件、短说明、原比例、head 不挤爆、左栏可用）；
  系统栏分支 `r140-verify-bars` **5/5**；竖屏守卫 `r140-portrait` **4/4**。
- 全量：竖屏 **94/0**；横屏 **35/0**（R138 的等宽判据改为 1.6:1 + 新增 R140 一条）。
- `Tessera-1.2.218.apk` 28,118,347 B / md5 `25b10347b2c65a9c4dba2f366cea4831` /
  sha256 `1085cc34d2126fb59be3f51fb1c71f8e9216845650433c0b62d4ad312968adb5`；
  SO_MATCH arm64 12,367,216 / x86_64 12,838,312；装机读回 `versionName=1.2.218`。

### §4 仍开

- 末段 4K 首帧的纯解码成本（R138 起就单列，与本轮无关）。
- 无事件冷启动时会先出现空 plan（`无元数据`）；本轮测试已等事件列表就绪再测。
  这是导出前置条件，不是 1.6:1 的回归。

## R141（1.2.218 → 1.2.219）横屏导出：宽幅拼图回 1:1，多路预览恢复旧宽

用户反馈 1.6:1 让 2/3/5/6 路预览变小。逐路实测（889×400，真实事件）：

| 路数 | plan 比例 | 1.6:1 预览 | 旧 1:1 预览 | 结论 |
|---|---|---|---|---|
| 1 | 1.533 | 257×168 | 257×168 | 高度受限，没变小 |
| 2 | 3.089 | 309×101 | 412×135 | 宽度受限，被压窄 25% |
| 3 | 4.622 | 309×68 | 412×91 | 宽度受限，被压窄 25% |
| 4 | 1.544 | 259×168 | 259×168 | 高度受限，没变小（用户没报） |
| 5 | 2.304 | 309×135 | 387×168 | 宽度受限 |
| 6 | 2.304 | 309×135 | 387×168 | 宽度受限 |

- **根因**：多路拼图是 2.3–4.6:1 的宽幅条带，预览宽度受限；R140 把右栏 445 收窄到 342，
  条带按比例一起缩。1/4 路是高度受限，收窄列只增加留白，画面不变。
- **修法**：按 plan 宽高比自适应，不按相机数写死。`renderPhoneExportPanel` 计算
  `plan.width / plan.height`，≥1.8 给 `.phone-export-panel` 加 `.pe-wide-preview`；横屏该 class
  把 grid 改回 `1fr / 1fr`，其余仍是 1.6:1。4 路比例 1.544，仍走 1.6，不会被误伤。
- **实测新布局**：2 路 **412×135**、3 路 **412×91**、5/6 路 **412×179**（277px dock 的一拍；
  224px dock 时是 387×168）；1 路 257×168、4 路 259×168。所有比例与固有比例差 ≤2%
  （3 路只有 91px 高，1px 边框/取整会放大比例误差）。
- **验收**：专项 `r141-verify` **4/4**（1/4 保持 1.6、2/3/5/6 切 1:1、尺寸不回退、比例不拉伸）；
  竖屏守卫 4/4；竖屏全量 **94/0**、横屏全量 **35/0**。
- 截图 `devtools/r141-2view-wide.png`（2 路，帧已齐）；`r141-6view-wide.png` 抓图时仍「正在取帧…」，
  只画出了先到的两路，但 6 路的宽度/高度已由判据量到 412×179。
- `Tessera-1.2.219.apk` 28,118,667 B / md5 `791889b8208fe0a7f1a63c6361e4368f` /
  sha256 `1d3f858f9c4e91ac028e9acdbfcc2809a86a4ce718922af4634dc45c111a9034`；
  SO_MATCH arm64 12,367,536 / x86_64 12,838,632；装机读回 `versionName=1.2.219`。

## R142（1.2.219 → 1.2.220）导出预览：渐进取帧、放大按钮、宽幅居中；P2 效果图结论

用户拍板先做 P1/P3/P4，P2 先看效果图。

### §1 P1 多路取帧：一次解码、先铺后精、n/6 进度

- **根因**：原生 `ThumbFetcher` 是单线程（实测单帧 **1.1–2.9s**）；摆放 tile 用 320px、合成预览用
  1280px，两个缓存 key 不共用；`FrameFetcher.get` 没有 inflight 去重，同一帧会被解码两次；
  合成预览又只在 `Promise.all` 全部返回时重绘，先到的画面停在 2/6，标题一直「正在取帧…」。
- **修法**：`FrameFetcher` 加 `inflight` 去重；合成预览先用 320px tile 缓存画出已到的格子，再排队
  1280px 升级；low jobs 全部排在 high jobs 之前（单线程原生的队列顺序）；每帧到达后 80ms 合并重绘；
  caption/head 显示「正在取帧 n/6」；`pePreviewStats` 记录 shown/total/missing/upgrading。
- **实测（暂停播放，排除 AVD 六路播放抢主线程）**：首帧 **3.76s**，6 路低清 **9.87s** 全部出现；
  旧版 10s 时只有 2 路且没有进度。收益来自「每帧只解码一次 + 先铺后精 + 可见进度」，
  单帧原生解码成本没有变小。

### §2 P3 放大按钮

- 画布一直可点，但没有任何提示。新增 40px 放大镜按钮（`#peZoomBtn`），与「预览帧」同排，
  调用现有 `openPhoneExportZoom()`；`renderPreviewDock` 负责显隐与 `peZoomOpen` aria-label。
- 实测 1.6:1 的 head：label 192px（短说明 183px 仍不截断）、放大 40、预览帧约 60、间距 20；
  放大层可打开并关闭。

### §3 P4 宽幅预览垂直居中

- `2/3/5/6` 宽幅条带的高度用不满 dock；新增上下两个 `.pe-preview-spacer`，只在
  `.pe-wide-preview` 下 `flex:1`，dock `gap:0`、head `margin-top:0`。1/4 路高度受限，保持原布局。
- 实测 2 路：canvas 上方/下方留白 **44 / 44**，head 仍贴底；`r142-2view-centered.png`。

### §4 P2 效果图结论：不做备选布局

- 用 `peSelection.layout` 实拍了 2 路上下堆叠 / 2×2、3 路 2+1 / 2×2。**plan 仍由预设 slots 决定**
  （2 路 3.08:1、3 路 4.62:1），自定义 rect 只是在固定画布里搬位置：上下堆叠会留下大片黑边，
  每路反而更小；2×2 更空。截图 `r142-p2-2stack.png`、`r142-p2-3plus1.png`。
- 结论：保留当前一行布局；要让输出比例本身变成 1.54:1 需要改导出计划/渲染尺寸，代价大且会牺牲
  画面面积，暂不做。放大按钮（P3）是更实用的“看大图”路径。

### §5 验收与交付

- 专项 `r142-verify` **6/6**（n/6 进度、6 路全显示、画布 6 格、放大按钮可见/可打开、宽幅上下等距）；
  `r140-verify` **8/8**、`r141-verify` **4/4**；竖屏 4/4；全量 **横 35/0、竖 94/0**。
- 截图 `r142-p1-progress.png`（1/6）、`r142-2view-centered.png`。
- `Tessera-1.2.220.apk` 28,120,203 B / md5 `5a14e65ed44536ea861272573b3d8119` /
  sha256 `c15af697db4747b22017be5c9fc712d8a2b8b353a54da9fc4d4f164c95c24287`；
  SO_MATCH arm64 12,369,024 / x86_64 12,840,168；装机读回 `versionName=1.2.220`。

---

## R143（1.2.220 → 1.2.221）全面巡检：18 条分级清单，第一批修三条「列表被污染」竞态

### §1 这一轮先做了什么

四路只读审计（文件/原生桥、播放引擎、导出链路、UI/主题/i18n/可达性）+ 逐条上机复核，
产出 18 条分级清单（记在 `devtools/r143-*` 探针与本文档后续小节）。本轮只动 P0 三条，
其余按批推进。三条的共同病灶：**异步结果落地前不检查「这次还归不归我」**。

### §2 三条修复（全部在 `isTouchShellRuntime()` 路径内，桌面调用点不传 token ⇒ 行为一字不变）

1. **旧扫描覆盖新目录** —— `handleFolderSelection(files, scanToken)`：入口与 `await processFiles`
   之后各校验一次。R138 的扫描 token 只挡在 `await` 前后，挡不到这个函数内部（14005 先
   `cleanupOldData()`、14031 才 await），所以慢的那一趟照样能盖掉新目录。
   实测（1.2.220，`r143-trace.js`）：A 进入重建后启 B，B 完整提交（`groups=1 path=TeslaCamRace`），
   A 醒来 `left hFS groups=9` —— 列表是 A、`lastScannedPath` 是 B，且 B 的指纹已写下，
   按「刷新」答「没有变化」，错配状态赶不走。
2. **持久化写在提交之前** —— `ANDROID_MEDIA_DIR_KEY`、`rememberRecentDir`、
   `saveTauriConfig{lastTeslaCamPath}` 从 `handleFolderSelection` 之前挪到之后，并补一次 token 检查。
   原来任何后续失败都会留下「开机自动恢复 + 一个亮着的 chip」指向从没加载成功的目录。
3. **目录浏览器乱序落地** —— `androidBrowseTo` 新增 `browseToken`，覆盖 `list_subdirs` 之后与
   catch 分支里 `scannedPathGone` / `forgetRemovedVolumes` 之后的每一次写。
   实测（1.2.220）：先点一个不存在的路径（其错误分支要 await 探针），紧接着点健康目录，
   6 秒后 —— 该目录的行数被迟到的 `list.innerHTML=''` 擦成 **0**、弹「这个文件夹已经不在了」、
   `dirBrowseGone=true` 让「选择此文件夹」直接拒绝，而 `androidBrowsePath` 停在死路径、
   卡片名字行写着另一个盘。一个健康盘被判成已拔出。
4. **撤销落错盘**（本轮新发现，子代理未提，症状与 R40/R138 的老投诉同一类）——
   `armDeleteUndo` 给 job 记 `folderPath`；`restoreDeletedEvent` 目录不匹配时直接返回 false；
   `undoDelete` 目录不匹配时**不删文件也不动列表**，只 toast「已切换目录，片段未删除」。
   实测（1.2.220）：A 删一张卡（6 秒撤销窗开着）→ 切到 B（chip 与「选择此文件夹」都不 flush）
   → 点「撤销」→ **B 的列表 9 变 10，多的是 A 的事件，`allFiles` 混进 7 个外来文件**；
   卡片路径是绝对路径，点得开播得出，且被 B 的指纹守卫钉住不消失。

新增文案键 `deleteUndoMovedFolder`（en + zh）。

### §3 验收

- 专项 `devtools/r143-verify.js` **3/3**（改前在 1.2.220 上 **0/3**，三条判据各自红过）：
  迟到错误不擦健康目录（rows 4 / gone false / browsePath=TeslaCam）、撤销不落错盘
  （groupsAfter 9 / foreignCards 0 / foreignFiles 0）、慢扫描被拒（`entered && waitedForB`，
  最终 roots 只剩新目录）。
- 全量回归：**竖屏 94/0、横屏 35/0**（`r102-verify` / `r102-verify-landscape`）。
- 验收踩坑两条已记进记忆：延迟必须落在「已过 token 检查之后」且由新扫描释放，
  固定 sleep 会被原生扫描抖动安排成正确顺序 ⇒ 假绿；探针脚本不要覆盖原型上的方法再 `delete`
  （会把真方法删没，`this.processFiles is not a function`）。

### §4 交付

- `Tessera-1.2.221.apk` 28,140,427 B / md5 `a44dee88169aa2bb1c1add92b29f8336` /
  sha256 `7f5815ae1507e26457a59e01bf38a3986b4e9c335907a9924396afe7df69ca96`；
  libtdashcam_studio.so arm64 12,372,848 / x86_64 12,844,008；装机读回 `versionName=1.2.221`。
- 旧包 1.2.215–1.2.220 全部保留。

---

## R143 第二批（1.2.221 → 1.2.222）P1 六条：front 停摆、导出三条、深色 CTA、导出页语言

### §1 六条修法

1. **#4 front 缺席 ⇒ 事件停摆**（手机门控）。`script.js:7640` 那条 `ended → playNextSegment()` 是全仓唯一的
   换段通路，而该段没有 `*-front.mp4` 时 `:6806` 把 `player.src=''` ⇒ 永不 `ended`。现在给其余五路也绑
   `ended`，但**只有 `segmentLacksFront()`（读事件数据：这一段确实没有 front 文件）为真时才放行**。
   各路片长实测差到 8.8 s，所以「先完的那一路」在正常情况下绝不能推进 —— 这条负向对照已实测（见 §2）。
   时钟 / 纠偏 / 轴读数仍绑 front，那部分要重构 `ModernVideoControls.player`，风险压在 R74–R80 的闸门机制上，
   本轮不动，留作后续（症状从「整个事件死在这一分钟」降级为「这一分钟进度条不动，但会走过去」）。
2. **#5 导出：一路没交帧 ⇒ 相机名/触发框整片不画**（`ExportEngine.kt`）。真因比「全有全无」更具体：
   `cellsThisFrame` 是 `ArrayList`，而循环里 `if (!stream.updateTexImage()) continue` 会跳过没帧的路 ⇒
   列表被压缩过，索引跟 `streams` 根本对不齐，所以 `buildChrome` 只能要求 `cells.size == streams.size`。
   改成 `HashMap<Int, Cell>`（按 `streamIndex` 存），`buildChrome` 只给画出来的路贴牌；`auto` 锚点的等待
   从「等齐」改成「等两帧」（`PAINT_LATCH_FRAMES`），正常片第 0 帧就齐 ⇒ 常规路径逐字不变。
3. **#6 导出：Error 不被接 ⇒ 永久只剩「取消」**。外层 `catch (e: Exception)` → `Throwable`（`Bitmap.createBitmap`
   的 OOM 在 Kotlin 里是 Error，原来线程死在 `finally` 之后、终态 payload 之前）；页面侧
   `cancelPhoneExport` 发完 `cancelExport` 后 1.5 s 用 `exportStatus` 自查，引擎说没这个 job 就不再谎称在跑。
4. **#7 导出：`peFreeBytes` 无超时 ⇒ 「开始导出」永久静默失效**。`nativeInvoke` 本身没有超时，
   `list_subdirs('/storage')` 在半挂载的 U 盘上可以永远不答；现在 `Promise.race` 5 s 出 `null`
   （`null` 本来就表示「读不出来」，绝不该挡住导出），并把 `peStarting` 改成 20 s 有界闸门。
5. **#8 深色导出主按钮 1.99:1**。`styles.css:7642` 的 `background: var(--accent)` → `var(--accent-solid)`。
   手机档 `:5461` 把 `--accent` 声明成 `var(--glass-tint)`，替换发生在声明它的那一级 ⇒ 深色解析成 #b9aeff
   （那是**墨色**档，`:5403` 的注释本来就写着不能当填充）；浅色侧 `:5500` 是字面量 #2210c5 所以只有深色坏。
6. **#9 导出页语言不跟随（两层）**。① 6 个 `data-i18n` 键（`exportClip`/`startExport`/`cancel`/
   `peLayoutPreview`/`peLayoutReset`/`peExportHistory`）不在 `updateAllUIText` 的硬编码清单里；
   ② JS 重建的行（「源」「无元数据」）要 `renderPhoneExportPanel` 才更新，而 `setLanguage` 专门 force 重建了
   日期 chips 却漏了它 ⇒ 开着的导出页换语言不刷新。两处都补。新增 `deleteUndoMovedFolder` 已在上一批。

### §2 验收

- `devtools/r143-verify2.js` **3/3**（改前在 1.2.221 上 **3/3 红**）：深色启用态 computed `bg rgb(91,75,240)`
  + 白字 **5.66:1**（原 1.99）；走真 `setLanguage('en')` 后标题/开始导出/取消/预览帧/恢复网格全部转英文；
  JS 建的那一行显示 `Source`。
- `devtools/r143-front-b.js`：夹具真实生效（把某段 `*-front.mp4` 改名 ⇒ 事件数据里该段 `front` 为空，
  `hasFront=[true,false,true,…]`），**负向对照通过**（front 在位时给 back 派发 `ended`，
  `currentSegmentIndex` 0→0，不提前换段）。正向那半判据没跑成：这台 AVD 的测试片每段只有 6.29 s，
  `seekToTime` 之后 `currentSegmentIndex` 不跟着动（暂停态下轴不重算），脚本留下轮在真机/真片上补。
- **导出回归**：1 路 6.3 s 1104×720、相机标签+触发角标全开 ⇒ `已写入 189/189 帧`、
  `Tessera_2026-10-09_10-00-00_0.0-6.3s_1c_1104x720.mp4` 1,937,623 B、`logcat -s ExportEngine:W` **零条**
  （即 `buildChrome` 每次都建成了，没有「要了没画」）。多路贴牌对位这一条本轮只到「代码可证」，
  四路实导的选路 chip 我没点中（`.recent-chip[data-camera]` 不是导出页的选择器），下轮补。
- 全量回归：**竖屏 94/0、横屏 35/0**。

### §3 交付

- `Tessera-1.2.222.apk` 28,141,511 B / md5 `750467dbea86f4164ce4d7d08da47a99` /
  sha256 `2a9dbb5185ef5a26e0f50ef507f28e5a9e71332512614e8326221ed8c49165ea`；
  libtdashcam_studio.so arm64 12,374,000 / x86_64 12,845,096；
  装机读回 `versionName=1.2.222`。旧包 1.2.215–1.2.221 全留。

## R143 第三批（1.2.222 → 1.2.224）P2 六条：交互与可达性

### §1 六条的根因与修法

| # | 症状 | 根因 | 修法 |
|---|------|------|------|
| 10 | 长按 3× 时落后那一路每 2 s 瞬移，提示仍挂 3× | 倍速有三个读者（容差 `:6975`、glide 基速 `:7086`、收尾回写 `endFeedGlide`），但 `setTransientPlaybackRate` 只写元素 `playbackRate`，三处全读 `this.playbackRate`；换段还会把元素按记住的 1× 重钉 | `MultiCameraPlayer` 新增 `transientRate` + `effectiveRate()`，五个读者（容差 / glide 基速 / 收尾回写 / 换段重贴 / 显式改档清零）统一走它；容差只放大手机档那支 |
| 11 | A–B 循环期间进度条「拖不动 / 自己弹回去」 | `maybeLoopAB` 判的是「≥ 出点就回入点」，把别人的跳转当成自己播过了出点 | 两道：`applySeek` 为每一次显式 seek 重钉 `loopABLastTime`；再加「一拍之内前进 > 5 s 不是播过去的」（5 s 是 8× 播放一拍 ~2 s 之上最小的「一定不连续」值） |
| 12 | ±10 s 双击在换段处退化成 ±1 帧、seek 后不自动续播 | 换段瞬间 `<video>` 到段尾自己 `pause`，`updatePlayState` 无条件把 `multiCameraPlayer.isPlaying` 写成 false；R95 只挡住了「控件弹出来」 | 图标跟着元素走，共享位只在非衔接期写（`isTransitioning \|\| mcp.seam` 时不写） |
| 13 | 英文下 15 个 `aria-label` 仍读中文，2 个图标按钮没有名字 | 可访问名只写在 markup 里，`updateAllUIText` 没有这一路 | 新增 `data-i18n-aria` + 一条通用循环（与既有 placeholder 循环同形）；状态型名字（HUD 折叠、全屏）不能上固定键，改在 `updateAllUIText` 里调它们自己的更新器；`filterToggleBtn` / `clearDateBtn` 补 `aria-label`（顺带给 `filterToggleBtn` 补 `type="button"`，全文件无 `<form>`，行为不变） |
| 14 | 引擎的中文错误串直接拼进英文 toast | Kotlin 没有词典，十余处句子硬编码中文，页面原样拼接 `payload.message` | 引擎改报**机器码 + 数字**（`busy`/`noEncoder`/`noFrames`/`gpuLost`/`emptyFile`/`darkAll`/`darkSome`/`tailStuck`/`formatChanged`/`noStreams`/`noDecoder`/`cancelled(Kept)`/`preparing`/`encoding`/`progress`），`message` 一律换成英文（日志与诊断继续引用它）；页面 `engineText(payload)` 按键组词、`{n}/{w}/{h}/{frames}/{step}/{message}` 用 payload 字段插值，未知码回落原句。取消时把 `failureCode` 一起清掉，否则「用户主动取消」会被念成「没有编码器」 |
| 15 | 弹层写着 `aria-modal="true"`，但焦点还在遮罩下面，背景从不 inert | 全文件只有一处 `.focus()`，弹层开关无人安置焦点 | `initSheetFocus()`：一个 `MutationObserver` 盯住 9 个静态 `.modal-overlay` 的 class（不是 19 个开页点），`syncSheetFocus()` 负责 ①背景（抽屉 / `.main-content` / 底部条）inert ②焦点落到「返回」这类按钮（绝不落输入框，免得弹键盘）③关页归还焦点（元素已不在就不抢）。长按菜单不是 `.modal-overlay`，由它自己的显隐调同一个函数。整条门控在 `isTouchShellRuntime()`，桌面拿不到任何 `inert` |

### §2 验收

- 判据 `devtools/r143-verify3.js` 改成**出厂函数 + 受控输入**的单元式（这台 AVD 起播不可靠：`totalDuration=0`、20 s 遇不到换段、纠偏器没有漂移可纠，活页判据一条假绿一条空红）。**1.2.222 上 4/17 红 → 1.2.224 上 20/20**。
- 写判据时踩到并当场改掉的三条：①`#11` 闸门读的是 `viewer.loopAB`，只设控件自己那份会得到「两条都过」的假绿；②`#10` 的「松开后回到记住的那一档」拿 `had.rate` 比，但测试自己刚把 `playbackRate` 写成 1 —— 判据顺序错，不是代码错；③`#15` 拿开页前抓到的元素引用读 `inert` 会假红，改成每次现查（另用 `Object.defineProperty` 拦 `.main-content.inert` 抓赋值者，确认只有 `syncSheetFocus` 在写）。
- 真导出回归（`#14` 动了 payload 形状，必须跑）：1 路 6.3 s 1104×720 ⇒ `已写入 189/189 帧`、83 s 完成、`logcat -s ExportEngine:W` **零条**；而这句进度文案现在由页面字典组成（同一串过去直接来自 Kotlin）。
- 弹层外观：截图 `devtools/r143-sheet-focus.png`，焦点在「返回」上、`outline` 仍是既有的 `none`，视觉零变化。
- P0 三条 `r143-verify.js` 3/3、P1 三条 `r143-verify2.js` 3/3（深色 CTA 仍 5.66）；全量 **竖屏 94/0、横屏 35/0**。
- 装机过程记一笔：装完**第一次**拉起必 ANR（`Waited 5011ms for FocusEvent(hasFocus=true)`、`spent 15881ms processing FocusEvent`），系统弹「未响应」后杀掉；第二次/第三次热起稳定跑完整套。与 R140 记录同形，判为 AVD 首启成本，不是本轮代码 —— 但真机上若复现要回头看这条。

### §3 交付

- `Tessera-1.2.223.apk` 28,161,483 B / md5 `147aa65d9458033acbd2a7475b08f0ba` / sha256 `6b60a3440818a839d59255f705846c26a0bf21c252c60b64bba005a6e32b685d`
- `Tessera-1.2.224.apk` 28,158,347 B / md5 `4374f708c8b7729d9bf6b3989762dbea` / sha256 `6d4b93231190f0701ee929fd1b3351557583648033f694a8925dc4aad01e72c9`；libtdashcam_studio.so arm64 12,374,448 / x86_64 12,845,544；装机读回 `versionName=1.2.224`。旧包全留。
- 1.2.223 = P2 六条初版；1.2.224 多一条 `#11` 的「一拍大跳不算播过出点」（判据先红后绿才加的）。

### §4 还欠着的

- P3 三条（`volumeExecutor` 三件事共用一个线程、取帧请求 id 每页从 0 重数、导出无时长上限且无 `onTimeout`）等用户挑。
- `#13` 只补了「名字跟随语言」，**焦点可见性**没动：全站 `outline: none`，键盘/外接指针用户看不见焦点在哪 —— 要做是 `:focus-visible` 一圈描边，属新视觉，未批不动。
- `#4`（front 缺席）正向那半、`#5`（多路贴牌对位）仍只到「代码可证」，本机量不到。

## R143 第四批（1.2.225 → 1.2.226）P3 三条：结构欠账

### §1 三条的根因与修法

| # | 症状 | 根因 | 修法 |
|---|------|------|------|
| 16 | 状态推送会被卷扫描挤在后面 | `MainActivity.pushState()` 复用 `volumeExecutor` —— 那一条线程同时在做「数卷」和「删文件」，一次慢的 U 盘计数把 insets / 权限 / 无障碍开关的推送全排在后面 | 状态改走自己的 `stateExecutor`；计数与删除留在原线程。**本机量不到**（AVD 只有一个卷，计数毫秒级），这条只到「代码可证」 |
| 17 | 页面重建后旧页在途的取帧答复，会被新页同号 id 认领 | `FrameFetcher` 的 `nativeSeq` 每页从 1 重数，而原生那一侧的 pending 表跨页存活 ⇒ 帧贴进隔壁格子 | id 改成 `f<pageToken>-<seq>`，`pageToken` 每页随机 6 位。实测 `fa6ud1k-1 / fa6ud1k-2`：前缀同源、序号递增 |
| 18a | 导出没有时长上限，六小时的服务配额只能靠中途死掉来发现 | `Request.parse` 收下任何 `durationUs` | 新增 `MAX_DURATION_US = 6 h`（与 `ExportService.WAKE_LOCK_TIMEOUT_MS` 同一个钟），超限在 **parse 处**抛 `code="tooLong"` + `args.hours`；`start()` 的 parse catch 不再把异常压成 `badRequest`，保住异常自带的码 |
| 18b | 进程被强停后，导出永远卡在「导出中 37%」，只有「取消」可点，半截容器躺在 Download 里像个成片 | 引擎重启后 `latest` 是空的 —— `exportStatus` 回 `{running:false, delivered:true}` 且**没有 payload**，而收尾分支挂在 `if (!payload) return;` 后面，永远走不到 | 早退只看 `status`（桌面根本不应答，仍走这条），`payload` 缺席变成「引擎手里没有这个作业」的证据；10 s 宽限留给「点下与首个进度之间」的空窗 |

### §2 验收

- 判据 `devtools/r143-verify4.js`：**1.2.225 上 3/4 红**（幻影作业那条 `planted=true / cleared=false / pillShown=true`）→ **1.2.226 上 4/4**。红得很干净：就是那条早退把分支挡死了。
- `tooLong` 真喂一遍（`devtools/r143-toolong-probe.js`，把 `durationUs` 灌成 7 h）：引擎回 `phase=error`、`code=tooLong`、`message="a 7 h clip is past the limit"`（英文，引擎里不再留中文），页面 `engineText` 组出「这段录像超过单次导出允许的 6 小时上限」，且没有作业被留在跟踪里。
- 真导出回归（本轮动了 parse / report / 终态 payload 的组词，必须跑）：1 路 10 s 1104×720 ⇒ `已写入 301/301 帧`、74 s 完成、`Tessera_2026-10-09_10-00-00_0.0-10.0s_1c_1104x720.mp4` 2,622,402 B（Download 里 Tessera_ 计数 20 → 21）、`ExportEngine` 的 W 级日志 **零条**、`开始导出` 复位。全程进度行 23 条，逐条都是页面字典组的（`准备编码器…` / `已写入 N/301 帧`）。
- 弹层外观：`devtools/r143-226-export-en.png` —— 英文下整页（标题 / 三段 / Views / Resolution 的 `Source` / 摘要行 / `Preview frame`）无残留中文。
- P0 三条 `r143-verify.js` 3/3、P1 三条 `r143-verify2.js` 3/3、P2 六条 `r143-verify3.js` 20/20；全量 **竖屏 94/0、横屏 35/0**。
- **判据自己的一条假红，记下来**：P1 的 `export-page-built-rows-follow-language` 三轮里红一次，红的是 `#peSizeChips` 那个 `源`。产品侧实测是对的（英文下重开导出页永远画成 `Source`）：`showPhoneExportModal()` 在 `.show` 落地**前一拍**就 resolve，而语言重建的闸门读的正是这个 class —— 判据在开页动画里问了一个页面还没被问到的问题。改成等 `.show` 真落地，三轮连绿。同一条也顺手挡住了「在淡入里量对比度」这种测法。

### §3 交付

- `Tessera-1.2.225.apk` 28,158,923 B / md5 `a5aad56e65607217ef2820036d38a11a` / sha256 `787b923942146e5d67988b5218b47efeb2af826b6a336249736d295f310698bf`（P3 三条初版，装机后模拟器 WebView 渲染进程接不上、包管理器一度卡住，重启 AVD + 重装才跑起来 —— 判据没跑完就不算交付）
- `Tessera-1.2.226.apk` 28,158,987 B / md5 `fd2bf3c048418c1224bf6a096d40bf98` / sha256 `f5515a87701122f701fb700aad3366ed57aaf056dfbd774466ffded1d9c5235c`；装机读回 `versionName=1.2.226`。旧包全留。
- 1.2.226 = 1.2.225 + `#18b` 的「payload 缺席就是证据」。
- 构建记两笔：①`minifyUniversalReleaseWithR8` 报 `classes.dex 被另一个程序占用` —— 是上一轮被掐掉的构建留下的守护进程，**重试即过**，别去清 build 目录；②后台任务通知里的 exit code 是包装脚本的，不是构建的，只认 `Finished 1 APK` + APK mtime。

### §4 还欠着的

- `#16` 只到「代码可证」：本机一个卷，扫不出慢，量不到状态被挤。
- `#4`（front 缺席）正向那半、`#5`（多路贴牌对位）同上。
- `:focus-visible` 一圈描边（新视觉，未批不动）。
- 新发现的文案账：英文摘要行写「1 views」，单数没变形 —— 一处 `views` 计数串的复数后缀，下轮和别的 i18n 尾巴一起收。

## R144（1.2.227）单路 letterbox 带白：`.video-container` 的桌面底色

用户实拍（小米 14，深色，单路，控件已自动隐藏）：行车数据 HUD 下方那条黑「不是纯色、带点白」。

### §1 根因（逐层量出来的，不是猜的）

先把截图逐像素扫了一遍再动手：那一帧里有**三种黑** —— HUD 下方与画面上方是 `17,17,17`（=`#111`），
播放器底边（y≈1736）以下才是 `1,1,1`。也就是说发白的不是 HUD 的纱、不是胶片条底、不是亮度纱边界，
而是**整个播放器区域的底色比它下面那一条浅一档**。装机复现后逐层读数：

| 层 | 读数 | 结论 |
|---|---|---|
| `.player-area` | `rgb(0, 0, 0)` | 页面这一层是纯黑，没问题 |
| `.video-container.is-active-single` | **`rgb(17, 17, 17)`** | 与截图的 17 完全对上 —— 就是它 |
| 容器 rect / `<video>` rect | 96→749 满铺，`object-fit: contain`，片源 1.5437:1 | 画面上下（横屏片是上下，竖屏片是左右）留出 letterbox，露的就是容器自己的底色 |
| `.video-controls-overlay` | `linear-gradient(to top, rgba(0,0,0,.7), transparent)`，隐藏时 opacity `1 → 0.0017` | **解释了「为什么是控件隐藏之后」**：控件在时那 70% 黑纱把 `#111` 压成 ≈`#050505`，看不出缝；纱一淡出，`#111` 直接暴露在 `#000` 中间 |

源头是 `styles.css:1099` 那条桌面 token（`background-color: #111; /* Keep dark */`）。桌面页面底是灰的，
letterbox 比页面浅一档看不出来；手机深色下页面是纯黑，同一档差就变成了用户说的那层白。

### §2 修法

不新增常数，改在 R135「满铺的画面不切角」那一条同一条规则里加一行：
`html.touch-ui` 门控下，单路满铺与全屏的容器 `background-color: transparent` —— letterbox 从此**永远等于**
它身后 `.player-area` 的那块黑，没有第二个值可以漂。桌面一字未动；宫格/画中画的格子仍是卡片，仍是 `#111`。

### §3 验收

- 判据 `devtools/r144-verify.js`：①**前置**（事件已载入、这一格 `display` 不是 none）②深色/浅色下
  `.player-area` 必须是 `rgb(0,0,0)` 且容器不贡献颜色 ③反例守卫：宫格格子仍须是 `rgb(17,17,17)`。**4/4**。
- 判据先被自己骗过一次，两条都记下来：`playEvent()` 收的是 **eventId**，喂事件对象会被第一行的
  `find` 静默挡掉（不报错、什么都不发生），于是判据在 `empty` 态跑 —— 那一档容器 `display:none`，
  「透明」白捡通过。改成先轮询 `.empty` 消失、并把 `.player-area` 的黑写进断言，才拿到真读数。
- **变异测试**：把 `#111` 用内联样式刷回去，两条颜色断言立刻转红；撤掉又绿 —— 判据能分辨，不是恒绿。
- 外观（不看样式看像素）：同一台机器、同一格画面，A/B 两张截图逐点采样 ——
  修复后 letterbox `0,0,0`＝播放器下方 `0,0,0`（缝没了）；把旧色刷回去 letterbox `17,17,17` vs 下方 `0,0,0`
  （正是用户截图的那对数）。`devtools/r144-after.png` / `r144-before.png`。
- 回归：横屏 **35/0**（第一次 34/1，失败项读数 `正在取帧 0/1`，是这台 AVD 解码 1383 ms/帧的占位帧，重跑即绿）。
  竖屏 89–91，稳定红的是「浅色白玻璃不变量」这一条 —— **把旧的 `#111` 刷回去同一条照样红、同样的墨**，
  与本次改动无关；另一条「底部条 4.33:1」在同一构建、同一状态下连跑两次一次过一次不过（跟解码到的那一帧走），
  且底色变暗只会让压在半透明黑条上的浅字对比度升高，不可能降低。这两条留作模拟器健康度恢复后（或真机）复查。

### §4 交付

- `Tessera-1.2.227.apk` 28,159,243 B / md5 `80cbcb67fcda5a98c45160df39041f19` /
  sha256 `79fcc8ec687466f38f81f7abf9964dc5097402391d7bad85c8828ddfad0a41ec`；装机读回 `versionName=1.2.227`。旧包全留。
- 装机后第一次拉起又被 AVD 的 WebView attach 拖住（`/proc/net/unix` 里迟迟没有 `webview_devtools_remote_*`，
  MemAvailable 1.1 GB）—— 等 10 s 后自行接上，不是包坏。见 [[tdashcam-build-and-verify-loop]]。

## R145（1.2.227 → 1.2.229）底部条英文标签被纵向裁掉一行下伸部

用户报：「英文界面，底部菜单栏的英文显示不完整」。截图看是 `Clips / 6-grid / Settings` 三个标签。

### §1 根因：`overflow:hidden` 的裁切线是**行盒**，不是字号

`.tab-label`（`styles.css:5023`，手机媒体查询内）原来写的是 `font-size: 0.66rem`（11px）+ **`line-height: 1`**
+ `overflow: hidden` + `text-overflow: ellipsis`。`line-height: 1` 就是「行高等于字号」这个常用收紧写法，
于是内容盒正好 11px；而这个字体的字身比字号高：

| 量的东西 | 读数 |
| --- | --- |
| `font-size` | 11px |
| `line-height`（`line-height: 1` 解析出来） | 11px |
| canvas `fontBoundingBox` | 上 12 + 下 4 = **16px** |
| `scrollHeight` / `clientHeight` | 13 / 11 → 溢出 2px |

`overflow:hidden` 把画不出来的部分剪在内容盒边界上，所以那 2px 是真的没画。中文没有下伸部，
同样的 2px 落在「片段 / 设置」上是空白，只有拉丁字母的 `p g y` 会掉尾巴 —— 这就是「只有英文看得见」。

### §2 三档读数的逐像素对照（同一台机器、同一状态，只改 `line-height`）

截图按标签自己的矩形逐行扫墨（`devtools/ps-inkscan.ps1`，`"Settings"` 的墨底所在行）：

| `line-height` | 构建 | 墨底 y | 相对修复态 |
| --- | --- | --- | --- |
| 11px | 1.2.227（用户那版） | 2343 | **少 4 设备像素** |
| 13.75px（1.25） | 1.2.228（中途那版） | 2346 | 少 1 |
| 16.5px（1.5） | 1.2.229 | **2347** | 基准 |

顺带纠正一处我自己先写错的判断：以为大写顶也被削。**没有** —— 三档的墨顶都是 2320，行盒上沿本来
就在 cap height 之上，裁的只有下缘。CSS 注释里那句话已经改成实测结论。

### §3 修法：一个值，手机档内

```css
.tab-label { line-height: 1.5; }   /* 16.5px ≥ 16px 字身，留 0.5px 给舍入 */
```

不给底部条长高的代价：格子 `min-height: 48px`，内容是「图标定高 22 + gap 3 + 标签 16.5 = 41.5」，
余量 6.5px。单变量对照（运行时在两档之间来回刷）证明几何完全没动：
`--action-h` 恒为 `67px`、`.phone-action-bar` 恒为 `57.48px`。横屏那档 `.tab-label{display:none}`，
行高是死值，所以横屏不受影响（实测 `display=none`、底条仍 57.48）。

### §4 验收：判据先骗了我一次

`devtools/r145-verify.js` 六条。两条假绿都是这一轮踩的：

1. **±1 容差把 1px 的真裁切放过了。** 1.2.228（1.25 档）在旧判据上报 5/5 全绿，明细写着
   `Clips 15<=14` —— 是我给的 `+1` 容差让它过的。改成 **0 容差**（`scrollH <= clientH`）后同一版立刻红。
2. **阈值不能猜，要量字身。** 原来那条「行高 ≥ 1.15 倍字号」是拍脑袋的，1.25 正好卡在它上面却仍然切字。
   现在比较对象是**同一支字体实测的 `fontBoundingBoxAscent + Descent`**，判据不再依赖我猜的比例。
3. 附带一条新的：**界面字体是 `@font-face`（Noto Sans SC）**。冷启动那一拍字体表还没落地，canvas 量到的是
   回退字体的字身（13px），加载完才是 16px —— 判据会在「还没加载」那一拍白捡通过。加 `await document.fonts.ready`
   之后读数稳定在 16。

最终 **6/6**：`lh=16.5 box=16(12+4)`、`scrollH 16 <= clientH 16`、横向无省略号截断、
`overflow:hidden + text-overflow:ellipsis` 这道长词保险仍在、底条 57px 不变、中文三条同样不再溢出。

### §5 回归

- 横屏 **35/0**（第一次 34/1，失败项读数 `正在取帧 0/1`，是这台 AVD 的占位帧，重跑即绿）。
- 竖屏两次 **88/3** 与 **91/2**。稳定红的是「⋮ 面板：入场动画已停」+「fixed 仍相对视口」这一对：
  前者 `atRest` 轮询自己判定 transform 还在动（读数恒为 `matrix(0.98,…,-8)`，即入场动画的**起始**关键帧），
  后者按套件的设计在前者失败时读数无效，且偏差 13.7px 恰好等于 `scale .98 + translateY -8` 的几何后果 ——
  判为这台 AVD ~3fps 采不到 200ms 动画那一类，不是本轮引入。用 §3 的单变量对照排除得更硬一点：
  `--action-h` 与底条高在两档下逐字节相同，2.75px 的行高变化没有任何通道能挪动弹层的 transform。
  「浅色白玻璃不变量」那一条这轮反过来自己绿了（R144 记它是稳定红），说明它跟解码到的那一帧有关。

### §6 交付

- `Tessera-1.2.229.apk` 28,161,739 B / md5 `20124270c52571a6650a0bcde77c02a1` /
  sha256 `12a06977a5a1f7b9a0c954527a5585875ba873561b586b141c0e58ec818b1ba7`。旧包全留（含中途的 1.2.228）。
- 截图证据：`devtools/r145-labels-en.png`（修复态 4× 裁条）、`r145-labels-before.png`（1.25 档）、
  `r145-labels-11px.png`（用户那版 11px）。
- 装机后第一次拉起又被 AVD 的 WebView attach 拖住，进程还在中途死过一次（crash buffer 空，判为低内存回收），
  第二次热起正常。见 [[tdashcam-build-and-verify-loop]]。
- 一处已知不同步（无害但要记着）：`styles.css` 里那段注释在 **1.2.229 构建之后**才改成 §2 的实测结论
  （原注释误写「大写顶也被削」）。包内 CSS 的注释与源码不一致，渲染值 `line-height: 1.5` 两边相同，
  不值得为注释重出一个版本 —— 下一个版本自然对齐。

### §7 顺带普查：还有没有第二支 `.tab-label`

注释里写「值得全站查一遍」，就真查了 —— `devtools/r145-lineheight-census.js`。判据形状与 R145 同构：
**单行叶子 + 纵向 overflow 裁切 + 行盒 < 该元素自己那支字体实测的字身 + 墨真的溢出**。
普查前先 `await document.fonts.ready`（§4 那条坑），跑之前先做**变异测试**：把 `.tab-label` 的
`line-height` 内联刷回 `1`，普查必须报出来 —— 报了（`fs 11 / lh 11 / box 16 / scrollH 13 > clientH 11`），
撤掉后归零，才信它的「零」。

跑了三个面（主页 1076 节点 / 抽屉打开 303 个可见带字叶子 / ⋮ 面板打开）：

| 命中 | 位置 | 读数 | 判 |
| --- | --- | --- | --- |
| `.btn-text`「行车数据 / Drive Data」 | `.metadata-switch-btn`（`styles.css:394`）**基线规则** | fs 14.08 / lh 14.08 / box 16 / 15>14 | **不改** |
| `.btn-text`「Toggle Theme」 | `.main-header .theme-toggle-btn`（`styles.css:373`）**基线规则** | 同上，但手机上 `clientH=0`（不显示） | **不改** |

两条都判「不改」，理由要说清：① 这两条在**桌面基线**里，动它们＝动桌面，越界；② 今天不丢墨
——「Drive Data」和「行车数据」都没有下伸部，那 1px 溢出是字体的名义降部，落在空白里。
但它是**和 R145 同形的地雷**：只要哪次把这两条文案换成带 `g p y` 的词（或加一门新语言），就会立刻
变成用户这次报的同一个症状。所以留作台账，判据脚本留在 `devtools/` 里可以随时重跑。

## R146（1.2.229 → 1.2.232）横屏大小窗：点左/右小窗换不了大小，只弹出播放控件

用户报：「横屏下，大小窗模式播放，左侧、右侧视频无法切换大小，点击画面后弹出播放控件」。

### §1 第一个假设是错的（错得很有道理）

`#phoneActionBar` 之外，大小窗的切换本来就写好了：`script.js` 里 `.video-container.is-pip` → `setCamera`。
所以先猜「遮罩压在底部小窗上，第二下点不到」。横屏实测几何：

| 元素 | 实测矩形（CSS px） |
| --- | --- |
| `.player-area` | y 73，高 235 |
| `#videoControlsOverlay`（`.show` 时） | y **178..308**，`pointer-events:all`，z 40 |
| `.controls-section-wrapper`（按钮行） | y 236..278，x 61..879 |
| `left-container` = `pos-bottom-left` | y **223..279**，x 18..231 |
| `back-container` = `pos-top-right` | y 78..134 |

底部两支小窗确实整条落在遮罩带里，`elementFromPoint` 在两态分别答「小窗」与 `#playPauseIcon`。
**但这只是稳态结论 —— 它指出的修法是错的。**

### §2 真实机制：同一次点击内部的改投

挂 capture 监听记事件序列，一次真实手指（`adb input tap`）：

| 事件 | target | 在小窗里？ |
| --- | --- | --- |
| `pointerdown` | `div.camera-label` | ✅ |
| `pointerup` | `div.camera-label` | ✅ |
| `mousedown` / `mouseup` / **`click`** | **`#playPauseIcon`** | ❌ |

按下那一刻 `VideoControls` 的 `pointerdown` 已经同步把遮罩 `.show` 上（`pointer-events` 从 none 变 all），
浏览器随后派发的兼容鼠标事件与 `click` 就落到了刚显形的播放/暂停键上。
所以到 click 处理函数里，`e.target.closest('.is-pip')` **永远是 null** —— 不是「第二下点不到」，
是**每一下的 click 都不属于这支小窗**。

### §3 修法：两半都要，缺一不成立

```js
// 1) playerArea 上挂 capture 的 pointerdown，只认触摸指针，记下按下时压住的那一支小窗
this.pipPressedUnderPointer = isTouchPointer(e) ? e.target.closest('.video-container.is-pip') : null;
// 2) click 里先算出 pip（click 的 target 或按下时那支），再决定 wake-only 要不要吞这一拍
const pip = e.target.closest('.video-container.is-pip') || this.pipPressedUnderPointer;
const wokeOnly = this.videoControls.consumeWakeOnlyTap() && !(pip && isPhoneSurfaceLayout());
```

- 只要 (1)：`pipRec` 实测确实记到了 `left`，但处理函数在 wake-only 那行就 return 了 ⇒ 不换（1.2.231 就这样）。
- 只要 (2)：`e.target` 已经不是小窗，条件恒假 ⇒ 不换（1.2.230 就这样）。
- 桌面不受影响：`wakeOnlyTap` 只由触摸指针写入，鼠标本来走不到这条豁免；豁免本身又叠了 `isPhoneSurfaceLayout()`。

### §4 交付史上有两次「半修」，别装错包

| 版本 | 内容 | 本判据 |
| --- | --- | --- |
| 1.2.230 | 只豁免 wake-only（依据 `e.target`） | left=no |
| 1.2.231 | 只加按下记录器，同时把豁免回退了 | left=no（`pipRec=left` 未被消费 ⇒ 卡在 wake-only） |
| **1.2.232** | 两半都在 | **left/right/back 全 yes** |

三个包都留在根目录（旧包一律不删），但要装 **1.2.232** 起。

### §5 验收

- 判据 `devtools/r146-verify.sh` + `devtools/r146-setup.js`：**真实 `adb input tap`**（不是 `element.click()`），
  横屏 **left/right/back 3/3**、竖屏 **3/3**（竖屏是反例守卫：那一档小窗本来就在控件带之上）。
- 同一份脚本在 1.2.231 上报 `left=no` ⇒ 判据能分辨，不是恒绿。
- 前置自证：`layout=legacy`、`active=front`、遮罩 `.show` 不在、`pointer-events:none`、
  `elementFromPoint(小窗中心)` 落在小窗上；任一条不成立就 `ok:false` 直接 fatal，不白捡通过。
- 回归：竖屏 **94/0**、横屏 **35/0** —— 本会话第一次两条套件同时全绿。
  R144/R145 记的「浅色白玻璃不变量」「底部条 AA 4.33:1」「⋮ 面板入场动画」那几条红，
  在冷重启后的健康 AVD 上全部消失 ⇒ **确认是设备状态账，不是代码账**（那两条待复查项可以销了）。

### §6 设备侧记一笔

这台 AVD 撑不住连续横屏多路解码，渲染进程反复被压死（`Scheduling restart of crashed service
…SandboxedProcessService0`）。冷重启（`-no-snapshot-load`）**会清掉已安装的 app**（`pm list packages` 里没有
`com.tdashcam.studio`），`/sdcard/TeslaCam` 素材则留着 —— 所以重启后要重装 + 由判据自己
`loadTauriDirectory('/storage/emulated/0/TeslaCam')` 造前置条件。新增 `devtools/relaunch.sh`：
拉起后轮询 `/proc/net/unix` 里真的出现 `webview_devtools_remote_<pid>` 才继续，不再靠 sleep 猜。

## R147 第一批（1.2.232 → 1.2.233）审计清单 P1 ×2 + 事件红点

### §1 环回媒体服务加了真正的边界

`stream_server.rs` 原来只查「以 `/` 开头、不含 `..`」——那不是一个边界：服务本身是「任意绝对路径读取器」，
唯一门槛是 URL 里的 bearer 令牌。令牌会随 `<video src>` 在页面里流动，一旦泄露，本进程能读的东西全可读
（本 App 持有 MANAGE_EXTERNAL_STORAGE）。这一轮加了三层，都不改变「服务哪些目录」这个模型：

1. **媒体扩展名白名单**（mp4/m4v/mov/mkv/avi/ts/m2ts/3gp/webm/png/jpg/jpeg）：播放器永远只取这些，
   共享存储里的 `.xml`（含本 App 的 shared_prefs）、`.db`、`.json` 于是全被挡在外面。
2. **敏感根目录拒绝**：`/proc /sys /dev /data /apex /system /vendor /product /metadata`。
3. **不跟随符号链接**：`symlink_metadata` 确认是普通文件、不是 symlink，避免「校验一个文件、读另一个」。
4. 令牌比较改成**常量时间**（先比长度，再逐字节异或累加），不再按第一个不同字节早退。

判据 `devtools/r147-stream-gate.js`（只回状态码，不打印 URL/令牌）：

| 请求 | 期望 | 实测 |
| --- | --- | --- |
| 当前事件的真 mp4 | 200/206 | **200** |
| `/storage/emulated/0/TeslaCam/notes.xml` | 403 | **403** |
| `/system/build.prop` | 403 | **403** |
| `/proc/self/maps` | 403 | **403** |
| 不存在的 `.mp4` | 404 | **404** |

未做（留给下一批）：令牌不轮换、`Access-Control-Allow-Origin: *`。前者要改 URL 分发，后者会影响
canvas 读帧（导出取帧走 CORS），都要单独验，不塞进这一批。

### §2 补上 `onRenderProcessGone`

Android 的默认语义是「渲染进程死了而宿主不认领，就杀整个应用进程」。这个 App 同时开六路硬解 + 导出，
渲染进程崩溃是现实事件；宿主一死，前台服务里的导出、`finally` 的清理、已写出的半个 mp4 全没人管。
`RustWebViewClient` 加了覆写：**返回 true 保住进程，并把 Activity 收掉**（死掉的 WebView 画不出东西，
用户重开即可；导出服务还在、通知还在）。同一进程里第二次再崩就不再兜，避免把用户困在白屏循环。
注：该文件头写着 AUTO-GENERATED，但构建走 `tauri android build`（不跑 `init`），这份补丁不会被覆盖 ——
与项目里 `MainActivity.kt`/`ExportEngine.kt` 同一种维护方式。

### §3 事件红点点不动

`addEventMarkers` 的红点自己挂 `click` → `seekToTime`，但进度条在 `pointerdown` 里 `setPointerCapture`，
随后派发的 click 被改投到进度条上（与 R146 同一条 Chromium 规则），红点收不到；而 `stopDrag` 又因为
「判定命中红点」主动跳过跳动式 seek —— 两头让路，红点成了摆设。

修法不动那条「让按下穿透、方便在红点上直接拖」的既有取舍：红点 `pointerdown` 时把**它代表的那一秒**
记进 `markerTapAt`，`stopDrag` 里判定是红点就把 `seekToTime(那一秒)` 补上。click 监听保留作无害兜底。

判据 `devtools/r147-marker-tap.sh`（真实 `adb input tap`）：这台机器的 fixture **9 个事件都没有
`eventTimestamp`**，红点本来不渲染，所以判据用真实 `startTime` 造一个事件对象、走真正的
`addEventMarkers` 生成红点（验的是「点上去有没有反应」，不是红点该不该画）。实测：落点 (140,667)、
`elementFromPoint` 命中红点、点完 `currentTime` = **2.0s** = 红点代表的那一秒。

### §4 回归与交付

- 竖屏 **94/0**、横屏 **35/0**。
- `Tessera-1.2.233.apk` 28,162,843 B / md5 `ae4d60c7dde24c5c20c11d5a7dbe3fe6`；旧包全留。

## R148 第二批（1.2.234）播放与手势：五条

### §1 长按 3× / 拖亮度之后松手的 click 会放大画面

`suppressPlayerTapUntil` 原来只在「长按成立那一刻」写一次 `now + 900`，而 `stop()` 从不续期 ——
从按下算起 1.35s 之后松手，那一下 click 就漏到 `zoomCamera()`；更硬的一条是记忆倍速本来就在
4×/8× 时，计时器 `if (normal >= PHONE_BOOST_RATE) return;` 直接返回，**根本不设抑制**。
亮度竖拖同理：进场那一拍盖 600ms，拖得慢一点松手就已经过期。

修法：把抑制的起点挪到**松手**（`stop()` 里 `now + 400`），并把 `holding = true` 提到倍速判断之前，
让「已经在这档倍速」也照样被认作一次长按。亮度手势在 `release()` 里补同一条。

判据 `devtools/r148-longpress.sh`：`adb shell input swipe` 同一坐标按住 700ms → 布局仍是 `grid4`、
`body.camera-zoomed` 为 false、倍速回到 0.5（记忆档）。实测通过。

### §2 退出剪辑模式后 A-B 循环静默失效

退出时清掉 `clipStartTime/clipEndTime`，而循环读的就是这两个点；`loopAB` 仍是 true、⋮ 面板继续写
「开」，再进剪辑模式又用 `playhead ± 30s` 重新播种，循环在一个用户没选过的区间上复活。
修法：退出剪辑模式时若循环开着，一并关掉并刷新按钮（文案 + `aria-pressed` + `.is-on`）。

判据 `devtools/r148-ab-exit.js`：进剪辑 → 设区间 → 开循环 → 退出 → `loopAB=false`、
标签「A-B 循环：开」→「关」、`aria-pressed=false`。实测 `ok:true`。

### §3 其余三条（代码可证，判据要构造时序，未单独立判据）

- **加载被打断时把上一个事件的进度存到下一个名下**：`rememberPlaybackPosition()` 改用
  `continuousPlayer.currentEvent` 的 id，而不是已经被提前赋值的 `viewer.currentEvent`。
- **换段重载期间播放键是死的且重载后自动起播**：`togglePlayPause()` 在 `isTransitioning` 时记下
  「用户要暂停」，`playNextSegment()` 重载完看到这个标志就不 `playAll()`。
- **切到本段未加载的相机时进度条/时钟闪回 00:00**：`getCurrentTime()` 只读已就绪
  （`src` 存在且 `readyState >= 1`）的那一路，未就绪退回 front 这个参考钟。

### §4 回归与交付

- 竖屏 **94/0**、横屏 **35/0**。
- `Tessera-1.2.234.apk` 28,163,867 B / md5 `4a1ecc1b480edf8d0572008f25e82a98`；旧包全留。

## R149 第三批（1.2.235）导出链路七条

- **#9 EGL 泄漏**：`gl` 现在在 `init()` **之前**就指向 renderer。原来 `GlRenderer(...).apply{init()}` 一旦
  EGL 某步抛异常，`gl` 那行赋值就跳过，`finally` 的 `gl?.release()` 什么都放不掉，每失败一次泄漏一个
  display/context/surface。
- **#10 极短片段被误判全黑**：编码循环前给解码器 600ms 预热（`advanceTo(0)` + 轮询
  `hasPostedFrame()`）。首帧回调走主线程，0.2s 的六帧可能在它落地前跑完，以前会把好文件当黑片删掉。
- **#11 只留有帧的容器**：保留条件从 `size > 0` 改成 `framesWritten > 0 && size > 0`，payload 的
  `path`/`bytes`/`cancelledKept` 都跟着这个 `keep` 走。取消在头几百毫秒不再留下没有 moov 的空壳。
- **#12 失败有人话**：非 `ExportException` 的失败按消息归类成 `diskFull` / `noWriteAccess` / `badSize` /
  `generic`，两侧词典补齐 `peEngine_*`，中文界面不再直接把英文 Java 异常糊上来。
- **#21 终态去重**：`onPhoneExportProgress` 按 `id:phase` 只处理一次，双 toast/双震动/双扫描收口。
- **#22 缺分钟不再冻结**：`advanceTo()` 返回 false（片段空洞）时 `continue`，不再拿上一段最后一帧
  冒充这一拍。
- **#23 尺寸探针未回前禁用开始**：`exportCodecReport` 在飞的 1.5s 内「开始导出」不可点，避免把未 clamp
  的尺寸发出去。
- **#24 未做**：引擎级拒绝走 `publish()` 会挤掉运行中任务的 `statusJson` —— 需要一个 id 感知的状态模型，
  单改一行会把「谁在跑」判断错。

**验收（诚实版）**：真导出 **301/301 帧**、1104×720、24s，Download 落到 2,034,310 B 的成品 ⇒ 预热与保留
逻辑没有伤到 happy path。取消路径的判据 `devtools/r149-export-cancel.js` **还没抓到终态载荷**（页面
1.5s 的 R143 兜底先把 job 清了，原生终态没来）—— 取消那一条仍只到「代码可证」，不算验过。

- `Tessera-1.2.235.apk` 28,164,443 B / md5 `7d202c937f9b7ac7a17f7a65e603cd3b`。旧包全留。

## R150 第四、五批（1.2.236）原生六条 + 可达性五条

### §1 原生

- **安卓 7–10 的假权限位**（`MainActivity.stateJson`）：`SDK < R` 分支原来硬写 `true`，于是没有
  `READ_EXTERNAL_STORAGE` 也上报「已授权」—— 扫不出文件、权限横幅也不出现。现在按
  `checkSelfPermission(READ_EXTERNAL_STORAGE)` 如实回答。
- **`pageReady` 抢跑**（`onPageReady`）：2.5s 定时器先把 flag 置真，页面自己的 ready 信号到了却
  `if (pageReady) return` 被丢掉；若文档在 2.5s 后才 commit，那次推送落在旧文档上、安全区永不到。
  现在页面信号一律再推一次（幂等）。
- **通知权限被吞**：`notificationPermission.launch()` 在非 RESUMED 时抛异常，原来被 `runCatching`
  吞成 no-op，而页面已经把「问过了」写进 localStorage。现在失败记 `pendingNotifAsk`，`onResume`
  再试一次。
- **Activity 重建泄漏线程**：`onDestroy` 补 `volumeExecutor.shutdownNow()` / `stateExecutor.shutdownNow()`。
- **`storageVolumes` 桥线程 IO**：拆成 `storageVolumesJson()`（只交出上一次的缓存 + 在
  `volumeExecutor` 上重算）与 `computeStorageVolumesJson()`；U 盘挂起时桥线程不再陪等。
- **SEI 样本无上限**（`sei_reader.rs`）：加 `MAX_SEI_SAMPLES = 4096` 与 `MAX_SEI_BYTES = 4 MiB`，
  构造出来的畸形 MP4 不能再把样本列表堆到 GB 级。

### §2 可达性与文案

- **视图/相机切换按钮**（`styles.css` 手机档）：`<span>` 从 `display:none` 改成 1px 裁剪的
  visually-hidden 保留在可访问树里；`setActiveView` 同时写 `aria-pressed`（9 个按钮、恰好一个 true）。
- **复制路径按钮**：加 `aria-label` + `data-i18n-aria="ariaCopyPath"`，中英各一条键。
- **顶部 ⋮**：补 `aria-expanded`（初始 false），开合两处都跟着写。
- **英文文案**：U 盘提示里的中文「文件夹」换成界面上的真按钮名 “Choose folder”；`peEngine_darkAll`
  改成 “No picture arrived from {n} of the views…”。

判据 `devtools/r150-a11y.js`：**6/6**（名字在树里 / `aria-pressed` 唯一真 / ⋮ 开合 / 复制路径双语 /
两条英文文案无中文与 view(s)）。回归 **竖屏 94/0、横屏 35/0**。

### §3 明确没做的三条

- **#24 引擎拒绝挤掉运行中任务**：要 id 感知的状态模型，不是一行能改对的。
- **#25 英文复数**（Found 1 events / 1 views）：需要真正 plural-aware 的格式化器；用正则抠 's' 会成为
  新的地雷，留待专门一轮。
- **#28 26–30px 点击目标**（速度曲线 30px、打码删除柄 26px）：改尺寸会动版面，按约定先出效果图。

- `Tessera-1.2.236.apk` 28,164,859 B / md5 `726be2d89a075e076262fa3298c9f63f`。旧包全留。

## R151 剩余五条收尾（1.2.237）#19/#20 + #24/#25（#28 出效果图）

### §1 播放：两处被静默漏掉的审计项

- **#19 控件条不再自动隐藏**：`hideControls()` 在倍速菜单 / ⋮ 面板开着时本来就拒绝收条，但 3 秒定时器
  被拒一次后就死了——之后在画面外点一下关掉菜单，控件条一直挂到下一点画面。定时器改成
  `autoHideTick()`：播放中且条仍可见就继续每 3 秒试一次（只对 `isTouchShellRuntime()` 生效，桌面保持
  一次性行为）。判据走真 handler：开菜单跨过 3.3s → body click 关菜单 → 条必须自己收起。
- **#20 主画面卡在 1.08×**：纠偏器从不修正 `activeCamera`（`syncAllPlayers` 跳过它），所以 glide 中的
  那一路被点成主画面后，`endFeedGlide` 再也没人调，速率永久停在 1.08×/0.926×。`setCamera()` 与
  `setLayout()` 的提主画面分支现在先 `endFeedGlide()` 再改 `activeCamera`。

判据 `devtools/r151-verify.js`（1.2.236 上两条红 → 1.2.237 上 **2/2**）。

### §2 导出：#24 拒绝不再挤掉运行中的任务

`ExportHost.publish()` 现在按任务 id 判定：引擎正在跑（`ExportEngine.runningId() > 0`）而载荷的 id 不是
它的，就只发给观察者（toast/通知），不写 `latest`、不动 `delivered`。终态仍在引擎清空 `running` 之后
发布，走 id==0 的空闲分支照常进 `latest`，所以「杀进程后重连回读」的故事不受影响。
`r151-text` 之外的验收：1 路 0–6.3s 真导出 **189/189 帧、25s**，Download 落 1,878,919 B 成品。

### §3 文案：#25 英文复数

词典新增逐词两种形态（`views/frames/events/files/minutes` 的 `_one`/`_many`），`pluralWord()` 只按数挑
一条，**不从字符串猜规则**；模板把名词拆成 `{…Word}` 槽（`refreshDone/refreshUnchanged/deleteConfirmCount/
deleteDone/deletePartial/noEventsFromFiles/peGridInfo/peEngine_encoding` 与事件卡时长）。`deletePartial`
另给 `_one` 整句（"1 file was deleted…"）。`engineText()` 负责把 `viewsWord/framesWord` 灌进引擎回传
的句子。中文两份同词，措辞不变。

判据 `devtools/r151-text.js` **10/10**（含 zh 不变）。

### §4 #28 点击目标（用户拍板：速度曲线 A 只上扩 + 打码 1 选中态外挂柄）

- **速度曲线**：可视 30px 不动，`::before` 把命中区上扩到 40px（`bottom:0; height:40px`），并且只在
  `.visible`（真的有曲线）时 `pointer-events:auto` —— 空图不会吞掉画面上沿的点击。判据用
  `elementFromPoint` 在曲线上方 5px 处命中 `speedGraphContainer`、曲线收起时不再命中。
- **打码 ×/缩放柄**：只有选中的框显示两个 40px 柄，分别挂在左上/右下**框外**（框有 2px 边框，
  绝对定位从 padding box 起算，所以偏移是 `-42px` 才与框外沿对齐）；两柄互不重叠，最小框
  （实测 3.7×9）也点得中、拖得动、删得掉。点选是「原地轻点」，不参与几何判定 —— 修掉了
  「最小框一碰就被当成缩到 0 删除」。画布四周留 42/44/46px 外挂空间（`overflow:visible`）。
- **滚进可见区**：导出页底部有常驻预览坞，`scrollTop=0` 时画布下半截在坞下面；切到叠加页时
  `scrollIntoView({block:'center'})` 把整块画布抬到坞上方，否则下半部分的框永远点不到（老问题，
  这轮的外挂柄让它更容易踩到）。
- 判据 `devtools/r151-28-speed.js` 1/1、`devtools/r151-28-prep.js` + `tap-el.sh` +
  `devtools/r151-28-verify.js` 4/4（真 adb tap 选中小框、柄 40px 且完全在框外、未选中框的柄
  `display:none`、画布左右余量 ≥40px）。判据在 1.2.237 上两条红（`pseudoHeight:auto`；点最小框
  直接把它删掉），1.2.241 全绿。调试中踩到的假信号：上一轮点空落到预览图会打开放大层，之后所有
  tap 都落在 `peZoomCanvas` 上（判据现在先关放大层并断言控制点）。

回归：**竖屏 94/0、横屏 35/0**。

- `Tessera-1.2.237.apk` 28,169,275 B / md5 `09874ea11ab71c9e78ad1dee041d0fc5` /
  sha256 `be2dc625a1727cfdfe87eb9ae7f05f0ea7faddd1afebea1c9a94b94cae1bbbcd`。旧包全留。
- `Tessera-1.2.241.apk` 28,186,743 B / md5 `97f5f1058fa8b48c022a2dc9cda18154` /
  sha256 `bfdff13f7868361dddd9f98242d06a147fd8b7b2b618205f86044244f7ac5e21`（#28 落地；
  1.2.238–1.2.240 是同一轮的中间验证包，未交付）。旧包全留。

## R152 待证项收口（1.2.243）：#10 / R143 #4 正向 / R143 #5 多路贴牌

这一轮不动审计清单，只把「代码可证」的几条用真片钉死；过程中在 #5 里挖出一个**真 bug** 并修掉。

### §1 #10 极短片段的黑帧误判（验证通过）

没有 ffmpeg，用模拟器 `screenrecord` 录真片做事件：0.68 秒的片段整段导出 **21/21 帧、144,024 B**；
同一素材截 0.3 秒区间导出 **10/10 帧、136,781 B**；两次成品都含 `ftyp`/`moov`/`mvhd`（可打开）。
≥600 ms 的首帧预热与 `keep` 条件没有把好片子误删，也没有把空壳留下。

### §2 R143 #4 正向半场（验证通过）

造一个两段事件：第一段只有 back/侧路（**没有 front**），第二段六路齐全。`playEvent` 后段索引在
**2.27 s 从 0 推进到 1** —— front 缺席时别的路的 `ended` 确实能推进事件（负向对照 front 在位时 0→0
已在 R143 记过）。判据 `devtools/r152-frontless-advance.js`。

### §3 R143 #5：多路贴牌**少一路**（真 bug，已修）

- 复现：同一段 2 路导出开标签，`adb logcat -s TdExportChrome` 只有 **`marks=1`**；关标签/开标签两版
  取帧差分，左格顶部有 46.3 的热点，右格整格 0.0。也就是说第二路的相机名根本没烧进去。
- 根因：`cellsThisFrame` 只在 `!paintedSent` 那一拍、且只给**当拍真正出图**的流填；标签层又只在
  latch 那一帧建一次。第二路解码器晚一帧，就永久没有牌。`sourceWidth` 来自轨道头（解码前已知），
  所以「格子几何」本来不必依赖当拍出图。
- 修法：`cellsKnown` 跨帧保存（以 `paintedOnce` 为门，没出过画面的流不贴牌），latch 用它建层；
  之后每多一路已知格子就重建一次（`chrome.close()` 后换新，至多每路一次）。日志于是变成
  `marks=1` → `marks=2`（1.2.243 上单次 `marks=2`）。
- 判据：3 秒静止两路事件开/关标签各导一次，原生取帧在 **1.5 s 关键帧**（640 宽）做 12×8 网格差分：
  两格左上角都出现 **45.3 / 46.5** 的热点、噪声 0 ⇒ `verdict: true`（`devtools/r152-labels-3s.js`）。
- 判据踩过的坑（记进假信号清单）：① 这台 AVD 上 `FrameFetcher.grabViaVideo` 画出的是**黑帧**
  （两文件同哈希、亮像素 0），不能用；② `ThumbFetcher` 用 `OPTION_CLOSEST_SYNC`，只回关键帧 ——
  0.68 秒的成品只有第 0 帧，而标签层在 latch 之后才加入，取 0.2 s 永远看不到标签。要看标签必须
  导出 ≥2 秒并在 ≥1 秒处取帧。

回归：**竖屏 94/0、横屏 35/0**（跑前要清掉注入的竖屏测试事件，否则基线两条红是现场账）。

- `Tessera-1.2.243.apk` 28,186,747 B / md5 `88c9918a558420470e39ee3635858eea` /
  sha256 `d22a05a3afaf1ccadff1cf4cd39012166aebefba2152a3bd532bc9fc9814de1d`。旧包全留。

## R153（1.2.244–1.2.247）R147 尾账收口：#12 / #22 / #11 / #21 + 本机路径硬边界

这一轮把 R147 审计里最后四条「待证」逐条落地，其中 #12 挖出**两处真问题**：源文件缺失被报成
「意外错误」，以及引擎抛出的 `code` 在 run 线程里被整个丢掉。另外顺手补了媒体服务器的访问边界
（1.2.244，本轮开头交付），和一条只有「导出进行中/结束后」才有字的字号漏网（1.2.247）。

### §1 媒体服务器硬边界（1.2.244）

- **根白名单**：`/api/media?p=…` 原先只校验扩展名与 `..`，但 token 是「读整机任意 mp4」的能力 ——
  页面一旦被注入，`/sdcard/Android/data/…` 或别的应用目录下的 mp4 都能被读走。现在 `scan_media_dir`
  成功扫描后把该根登记进 `ALLOWED_ROOTS`（canonicalize；文件不存在时 canonicalize 父目录），
  `respond()` 在 `File::open` 之前做 `is_allowed_path` 检查，不在根内一律 **403**。`symlink_metadata`
  的符号链接拒绝保留。
- **CORS 收窄**：`Access-Control-Allow-Origin` 从 `*` 改成只回显三个 App 自身 origin
  （`http(s)://tauri.localhost`、`tauri://localhost`），并带 `Vary: Origin`；外来 origin 拿不到 CORS 头。
- 线上实测（1.2.244）：真实 mp4 **200**；根外 mp4 **403**；非 mp4 扩展 **403**；`/system/build.prop`
  **403**；`/proc/self/maps` **403**；不存在的 mp4 **404**。判据只回状态码/尺寸，不打印 URL 或 token。

### §2 #12 源文件缺失错误文案（1.2.245）

- 现场：删掉事件里后视那一路的 mp4 再导出，1.2.244 的终态是 `code: generic`，原生串是英文
  `back: cannot open …: Failed to instantiate extractor.`，toast 只说「导出遇到一个意外错误」。
- 修法两处：
  1. `CameraStream.openSegment` 在 `setDataSource` 失败时看文件是否还在：不在 → `missingSource`，
     在但打不开 → `badSource`；`selectVideoTrack` 无视频轨也归 `badSource`。都带 `camera` 参数。
  2. **`ExportEngine` 的 run 线程 catch 以前完全不看 `ExportException.code`**，只按消息文本猜三类 ——
     于是 `noEncoder` / `gpuLost` / `noDecoder` / `formatChanged` / `noFrames` 这些**已有译文**全被压成
     `generic`。现在先取 `spec.code`/`spec.args`，没有才回落文本启发。
- 页面新增 `peEngine_missingSource` / `peEngine_badSource` 两式（中英），`engineText()` 把
  `payload.camera` 映射成与导出面板同一个相机名（「后视」/「Back」）。
- 实测（1.2.245）：终态 `code: missingSource`，toast **「导出失败: 后视的录像文件不见了，可能已被删除或存储卡已拔出」**；
  文件已还原。`engineText` 另验 `noEncoder → 这台机器上没有能编 3840×2160 的 H.264 编码器`、`gpuLost → GPU 上下文丢失…`。

### §3 #22 缺一分钟文件：留洞而不是冻帧（验证通过）

- 现场：新建 `SavedClips/2026-10-09_12-00-00_gap`，front 只有第 0、2 分钟，其余五路 0/1/2 齐全。
  实测轴 **段长 [6.29, 60, 6.29]、起点 [0, 6.29, 66.29]** —— 夹具是一分钟片段裁短，别按 60 s 想。
- 两次导出（关掉全部叠加）：
  - A：5–15 s、front+back。t=0.5 两格都有画（front 43.3 / back 47.5）；t=8 与 t=9.5 front 格 **luma 1、
    亮像素 0**，同拍 back 格 **47.8 / 0.588** —— 洞是黑的，不是上一段最后一帧（也排除了整片黑）。
  - B：64–70 s、单 front。t=1 **整帧 luma 1**（洞）；t=4 **42.9 / 0.55**（第二段 66.29 s 起，恢复有画）。
  - plan 里第二段 `globalStartUs = 2 290 300 µs`（= 66.29 − 64），与轴对得上。
- 判据 `devtools/r153-gap.js`（准备 + 跑 A）+ `devtools/r153-gap2.js`（跑 B + 取帧判读），**8/8**。

### §4 #11 取消：路径/字节跟着 keep 走 + 文案跟着 payload 走（修文案 + 真跑）

- 真实现场（1.2.246）：1 路 0–6 s，见到 `peJob` 后取消。两次都是 `cancelledKept`，`frames 24 / bytes 5 670`
  与 `frames 37 / bytes 5 930`，文件落盘、进「最近导出」，引擎随后 `running=false`。
- 发现的**文案 bug**：这一路 toast 原来无条件说「已取消，已写入的部分保留在文件里」，而引擎其实分
  `cancelled` / `cancelledKept` 两种。现在按 `engineText(payload)` 取词：零帧只说「已取消」，有帧才承诺保留。
  页面级判据 `devtools/r153-cancel2.js` 两档都过；`peExportCancelled` 这条旧键随之删除（无人再引用）。
- **AVD 边界（记进假信号清单）**：这台 AVD 上 `startExport` 这个桥调用返回时引擎已经写了 24–90 帧
  （主线程被解码占住，`await startPhoneExport()` 要 8–15 s），JS 侧**做不到真正的零帧取消**。零帧那一档
  只能用页面级注入验文案；「空壳不落盘」由 `keep = framesWritten > 0 && size > 0` 代码可证。

### §5 #21 终态去重（页面级判据）

同一 `id:phase` 连投三次只弹 1 次；换一个 id 仍会弹（去重是键，不是闩）。判据 `devtools/r153-dedupe.js` **1/1**。

### §6 字号账：只有「动态面」才出现的 11.84px（1.2.247）

回归里竖屏套件抓到一条红：导出页 11.84px。定位到 `.pe-progress .progress-text`（`0.74rem`）——
它只在导出进行中/终态才有文字，R134 的静态普查永远扫不到它。归到 `--fs-meta`（12px，仍只对
`html.touch-ui` 生效）。这条同时说明：**动态面（导出进度、toast、错误文案）必须打开后再跑一次字号普查**。

回归：**竖屏 94/0、横屏 35/0**（1.2.247；横屏第一次 34/1 是预览取帧还没回、label 仍写着
「正在取帧 0/1」的时序抖动，原样重跑 35/0）。

- `Tessera-1.2.244.apk` 28,193,119 B / md5 `1884e722cdad4b5fa7f96ca1e81a5e4b` /
  sha256 `63e8c8b5341bf1df1bf77b38092197ef1538a5698f7ddf2fd566e4ac14ba0f96`
  （媒体服务器根白名单 + CORS 收窄）。旧包全留。
- `Tessera-1.2.245.apk` 28,190,051 B / md5 `fcb1310f7a4705ade52e1f141b2943e6` /
  sha256 `fc8908067fa605fc2dbf979139bb06513927842e8d2c5a47c2aa5022d00bece5`
  （#12 missingSource/badSource + 引擎 code 透传）。旧包全留。
- `Tessera-1.2.246.apk` 28,190,111 B / md5 `9b57d07c6068cc83d49818140f570d5b` /
  sha256 `37de8cfc41755be711831ef3077d69f5f51b3508d461d4baf7084d4be77fbd1b`
  （取消文案跟 payload 走）。旧包全留。
- `Tessera-1.2.247.apk` 28,190,179 B / md5 `0c702e0e839b5233a1939057308a3dd5` /
  sha256 `9f2fec952a6dc66168be66ab9e9722d02817ba7da619185c4e97739e11f11bfc`
  （导出进度行 11.84 → 12px；本轮交付包）。旧包全留。

## R154（1.2.248）收尾：聚焦可见性 + 拒绝码 + 安卓 7–10 权限真的会申请

R153 之后还剩三类「没做完」：R143 遗留的 `:focus-visible` 只覆盖了三个面、服务级拒绝载荷没有
`code`、以及 #13 只把权限「读」对却从不「申请」。这轮三条都落地。

### §1 `:focus-visible`：从三个面到整条可达集合

原来只有底部条 / 长按菜单 / 顶部 ⋮ 有焦点环 —— 那是有人测过的那三处。抽屉行、导出页、目录浏览器、
弹层里的控件全都没有视觉反馈。现在一条规则：

```css
html.touch-ui :is(button, [role="button"], a[href], input, select, textarea,
    [tabindex]:not([tabindex="-1"])):focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
}
```

`:focus-visible` 本身就是「手指不触发」的闸门，桌面不动（`html.touch-ui` 门控），高对比度那条
（3px）仍在更后面覆盖。

判据 `devtools/r154-focus-a11y.js`：遍历样式表（**递归进 `@media`**）收集所有 `:focus-visible`
规则，校验声明里真的有 ≥1.5px 的 outline 与 ≥1px 偏移，再逐个检查 47 个可达控件的选择器命中。
**4/4 通过**。

### §2 服务级拒绝也带 `code`

`ExportService.errorPayload()` 以前只写 `message`，`busy` / `startFailed` 两条因此只有原生拼好的
整句，页面无法在切换语言后重排。现在带 `code`，页面补 `peEngine_startFailed` 中英词条。
判据同上（`busyZh/busyEn/startFailedZh` 三条都按语言取词）。

### §3 #13 安卓 7–10：从「读对」到「能拿到」

`stateJson()` 在 API < 30 上改用 `checkSelfPermission(READ_EXTERNAL_STORAGE)` 是对的，但全工程
**没有任何地方申请过它**：横幅会出现，点下去 `openStorageSettings()` 只能退到「应用详情」，
而那一页在 API 24–29 上没有可授予的开关 —— 也就是那些机型永远扫不出文件。现在：

- `onCreate` 注册 `legacyStoragePermission`（`RequestPermission`），回调里 `pushState()` 并让页面
  刷新权限横幅；
- `openStorageSettings()` 在 API < 30 时先 `launch(READ_EXTERNAL_STORAGE)`，`launch` 成功就直接返回，
  失败（Activity 非 RESUMED）才走原来的设置页兜底。

**没有验证**：本机只有 API 36 的 AVD，API 28/29 镜像未安装。这条目前的证据等级是「代码可证」。

回归：**竖屏 94/0、横屏 35/0**（1.2.248）。

- `Tessera-1.2.248.apk` 28,190,371 B / md5 `0b6defec03add58575eb3a3ae820398c` /
  sha256 `64309dc947d47e64b5ac4055293e640e45c9378b2b9cd2a8d0096f5e52edd7a9`。旧包全留。

## R155（1.2.250–1.2.251）回归修复：`event.json` 被媒体服务器边界挡住

用户报告「显示地理位置信息、触发标注的功能不见了」。两个功能都没有被删除，入口一直在
（⋮ 面板的「触发标注：开」、导出页的「GPS 位置」），但它们共同依赖的 `event.json` 在
**1.2.244 的安全加固里被自己挡住了**。

### §1 根因链

1. `TauriFile.text()` 在触屏壳里走 `getStreamUrl(path)` + `fetch` 读文件（这样大文件不进 IPC）。
2. 1.2.244 给媒体服务器加了**扩展名白名单**（`MEDIA_EXTENSIONS`），只有 mp4/png 等；`event.json`
   不在名单里 → `decode_requested_path` 返回 `None` → **403**。
3. `text()` 的实现是 `await (await fetch(url)).text()`：403 的空 body 被当成文件内容，返回空串。
4. `processFiles` 里 `JSON.parse('')` 抛错，被 `catch` 只记一行 `console.error` 吞掉。
5. 结果：**所有事件的 `city` / `street` / `reason` 全空** ——
   - 事件卡上的「杭州市 · 文一西路」消失；
   - 触发原因没了 → `triggerViewsFor()` 恒为 null → **触发描边、烧录角标、「只看触发」筛选**三处全空。

实测证据（1.2.249）：10 个事件组 `city/street/reason` 全为 `null`；`TauriFile.text()` 对一个
134 字节的 `event.json` 返回 `len: 0`。

### §2 修复

- `MEDIA_EXTENSIONS` 加 `"json"`。边界仍由**根白名单**把守（`ALLOWED_ROOTS`），扩展名表只需覆盖
  相机文件夹里真实存在的文件类型；`/proc`、`/data` 等仍在 `FORBIDDEN_ROOTS`。
- `TauriFile.text()` 不再把失败当内容：非 2xx 抛错；磁盘上 >0 字节却读到空体也抛错。
- `processFiles` 的解析失败计入 `this.sidecarFailures`，诊断里能直接看见。

### §3 触发原因的两种写法

真实 `event.json` 的 `reason` 是句子（`"Motion detected while parked"`），文件夹名后缀是 slug
（`sentry_motion`）。旧正则只接受标识符，把句子整条拒掉。现在两种都归一化成 snake_case 再查表。

另：读不懂但**文件确实声明了** reason 时给通用「触发」；文件夹名不参与这个回退 ——
`..._gap` 这类命名是人的说法，不是事件的声明（首个修复版本把它误判成了触发，1.2.251 收紧）。

### §4 验证

- 解析：句子 → 哨兵；slug → 哨兵；未知原因 → 通用触发；无 reason → null；`_gap` 文件夹 → null。
- 真实事件：`2026-09-29_12-30-00` 的 `sentry_motion`、`2026-10-09_10-00-00_sentry` 的
  `Motion detected while parked` 都判为「哨兵」。
- 屏幕：`applyTriggerHighlight()` 后 front / left / right 三格 `trigger-cam` + `.trigger-frame`，
  另三格正确无标记。
- 事件列表：`sidecarFailures: 0`，卡片恢复「杭州市 · 文一西路」。
- 回归：**竖屏 94/0、横屏 35/0**。

- `Tessera-1.2.250.apk` 28,191,091 B / md5 `e604137953e122782bf5f35e9917cfaf`（json 白名单 + 空体抛错）。
- `Tessera-1.2.251.apk` 28,191,091 B / md5 `85678abbb1977b77e3a179038c5e926c` /
  sha256 `7c435bcfcb4f0dac3447504d5ce8c62da3bea6bf2545bcb0bbf689e0c96b0320`（文件夹名不冒充触发）。旧包全留。

## R156（1.2.252–1.2.253）按真实行车记录仪素材校准

用户从特斯拉 U 盘导出 2026-10-08 的一段真实素材（RecentClips 12 分钟 ×6 路、SavedClips 1 个
事件 11 个文件簇、SentryClips 2 个事件），要求「根据视频优化完善 APP，砍功能要先说清楚」。
本轮没有砍任何东西。

### §1 实测到的事实

| 项 | 实测值 |
| --- | --- |
| 编码 | H.264（`avc1`），moov 在文件尾 |
| 分辨率 | front 2896×1876；其余 1448×938（比例 1.5437） |
| 旋转 | 0 |
| 片长 | **不是 60 秒**：第一段 20.626 s，之后 59.471–62.894 s，事件最后一段 11.691 s |
| `thumb.png` | **128×83**（卡片画面框 96 CSS px，2.7 DPR ≈ 260 设备像素） |
| `event.json` | `est_lat`/`est_lon` 是字符串；`street` 可能为空；`reason` 为 `user_interaction_honk`、`sentry_aware_object_detection` |

旧账法把除最后一段外都记 60 s。以 1.2.251 的账：RecentClips 四段记成 0/60/120/180（真值
**0/20.626/83.156/145.204**），SavedClips 十段总长 611.691 s（真值 562.034 s）。时间轴、seek、
胶片、速度曲线、导出范围全部建立在这把尺子上。

### §2 每段按文件自己的时长记账

- 新增 `src-tauri/src/mp4_duration.rs`：只读 `moov` 顶部 64 KB，跳过巨大的 `mdat`，解析
  `mvhd`（v0/v1、timescale、duration），三次 seek 一次 7 KB 读；损坏/未写完/时长未知一律
  `None`。
- `scan_tree` 顺路把时长读出来（`ScanReport.durations`，毫秒，与 `files` 同序）。六路同一分钟
  共用一次读取：优先 `front`（播放器的参考时钟），没有 front 时用任一路；`MAX_DURATION_PROBES`
  = 2000 分钟封顶，超出部分保持旧账法，播放时仍由 `rebookAxis` 修正。
- JS：`TauriFile.duration`（秒）→ `segment.duration`（六路优先 front）→
  `calculateEventDurations()` 用实测值填满 `segmentDurations`/`segmentStartTimes`。手机上
  所有段都有值时**不再探测任何文件**（原来至少要对最后一段发一次 metadata 请求）；桌面没有
  这个字段，仍走原来的「只探最后一段」。

实测（1.2.253，真素材 27 个文件）：

```
RecentClips  [20.626, 62.53, 62.048, 60.907]  starts [0, 20.626, 83.156, 145.204]  total 206.111
SavedClips   dur [61.953, 59.955, 61.823, 59.996, 60.807, 59.471, 61.021, 62.423, 62.894, 11.691]
             starts [0, 61.953, 121.908, 183.731, 243.727, 304.534, 364.005, 425.026, 487.449, 550.343]
bookedViaProbeMs = 0 / 1   ← 一次视频探测都没发
```

原生扫描本机耗时：冷读 27 个文件（1.0 GB）约 12.5 s，热缓存 1.2–1.6 s，再次扫描 64 ms。
导出窗口随之对齐：`[70, 90]` → `07-33-00-front.mp4` 的 8.047–28.047 s；`[0, 120]` →
`07-30-59` 0–61.953 + `07-33-00` 0–58.047。

### §3 小尺寸 `thumb.png` 用真帧替换

车给的 128×83 在卡片上放大 ~2 倍发虚。现在缩略图先铺 `thumb.png`（瞬时），再按 320 px 请求
原生取帧替换；只有 **naturalWidth < 200** 才升级，大缩略图保持原样；原生取不到时原图留着。

正向对照（可解码的小片段 + 真实 128×83 `thumb.png`）：4.9 s 后 `naturalWidth` 128 → **320**，
截图确认画面已换。真实 4K 素材在本机 AVD 上**没有换成**：`ThumbFetcher` 解 4K 关键帧用了
25.3 s / 8.9 s，超过 JS 15 s 的 `NATIVE_TIMEOUT_MS`，随后 WebView 回退解码也失败 → 保留
`thumb.png`。这是 AVD 的解码能力，不是真机结论；真机上 4K 首帧远快于 15 s。

### §4 同一分钟两个文件簇：改成确定性取最早的一路

真实 SavedClips 里有 `07-33-00` 和 `07-33-08` 两个文件簇（后者的 8 秒起点落在同一分钟内）。
一个相机槽只能放一个文件，旧代码由目录枚举顺序决定谁留下 —— **同一文件夹两次扫描可能取到
不同素材**，而段长可能来自另一个文件。触屏壳改为固定取文件名最早的一个（桌面保持上游顺序）。
两次扫描实测都取 `07-33-00-front.mp4`，段长 59.955 s 与文件一致。

### §5 仍然没做（需要用户拍板，不是砍功能）

- **重叠分钟里的后一个文件仍不可达**：`07-33-08` 的前 52 秒与 `07-33-00` 重叠，现在整簇都不会
  被播放/导出。三种做法：A 维持现状（确定性丢后者）；B 段键改成到秒，两簇顺序播放（重叠的
  52 s 会重播一次）；C 段键到秒 + 后者按重叠时长跳过开头（不重播不丢，但要给段加「入点」，
  影响播放/胶片/导出的取点）。
- **缺失分钟被压缩**：本事件 `07-30-59` 之后直接是 `07-33-00`，真实墙钟差 121 s，尺子只前进
  61.953 s；同理 07-31、07-32 整分钟不存在。桌面本来就这样（把片段首尾相接），要不要插黑场
  占位是设计决定。

### §6 验证

- 真素材：`r156-real.js`（时长/起点/城市/触发/缩略图）、`r156-overlap.js`（两次扫描同选）、
  `r156-staging` 子集推到 `/sdcard/TeslaCamReal`。
- 回归：**竖屏 94/0、横屏 35/0**（1.2.253，AVD 冷启动后）。
  中间一次 92/2 的两条红都是「有画面可折射」样本缺失（`lensLive=0/5`）；用 1.2.251 在同一台
  设备复跑得到**完全相同**的 92/2，冷启动后 94/0 —— 归设备状态，与本轮无关。
- `Tessera-1.2.252.apk` 28,198,639 B / md5 `08f3f181482ba34f9c7d6ee244c8661c` /
  sha256 `2358995542aa56c5e3ffb6ba82a0438e1940710a7078699f70a8dccf99e8a5e1`（时长 + 缩略图）。
- `Tessera-1.2.253.apk` 28,198,899 B / md5 `b839766b93bf37658bcbe9667024a7c2` /
  sha256 `5a7c4379a4ed0b1b414ba16e752922b3fcc54284fd5b09607aac70ec2493ccf0`（+ 同分钟确定性）。
  旧包全留。

## R157（1.2.254–1.2.256）按整块 1.9 TB 真盘复核：扫描预算、速度曲线与「分钟」记账

用户插上完整 U 盘（`D:\TeslaCam`），要求核对 R156 是否被那份局部拷贝误导。**是，有两处**；
并且整盘还暴露出三个比 R156 更重的问题。本轮只输出汇总统计，没有导出任何地址或路径。

### §1 整盘实测

| 项 | 实测 |
| --- | --- |
| 规模 | RecentClips 8 582 个 mp4（1 431 分钟）、SavedClips 409 事件 / 13 796、SentryClips 2 758 事件 / 44 502；合计 **66 880 个 mp4**、3 168 个事件目录、3 167 个 `event.json`、3 168 张 `thumb.png` |
| 编码/尺寸 | 全 `avc1`，front 2896×1876、其余 1448×938，无音轨，旋转 0；**一段 4K front ≈ 80 MB** |
| 片长（1 081 段采样） | 55–65 s 占 87%（最大 63.62 s）；<25 s 86 段、25–55 s 50 段；**事件首段 <30 s 仅 6%**（19/317），**末段 <30 s 有 45%**（143/317，最小 1.63 s） |
| 片段衔接（6 571 对） | 62–64 s 1 265 对、**64–66 s 3 271 对**、66–70 s 1 922 对、60–62 s 仅 10 对；>90 s 31 对（最大 656 s） |
| 同分钟两簇 | 36 个分钟组（0.32%）、**36 个事件（1.1%）**、444 个文件（0.66%） |
| 缺路 | 129 / 11 132 分钟组缺至少一路（1.2%） |
| sidecar | 3 167 个全部解析；3 166 有城市，**只有 358 有街道**（11%）；`est_lat/lon` 全是字符串 |
| 触发原因 | `sentry_aware_object_detection` 2 758、`user_interaction_honk` 405、`user_interaction_dashcam_icon_tapped` 3、无 1 —— 四种都能落到现有表 |
| 缩略图 | 3 167 张全是 **128×83** |

### §2 对 R156 的两处修正

- **「首段 20.6 s」不是常态**：那是局部拷贝从录制中途开始造成的。整盘上事件首段 <30 s 只有 6%。
  R156 的按段记账仍然正确、也更准（累计偏差从数秒级降到 ~0），但当时「时间轴从第二段起偏 39 s」
  这个量级只属于那份拷贝。真正常见的是**末段很短**（45%），而旧代码本来就只探测末段。
- **同分钟两簇是稀有情况，不是常态**：36/11 132 分钟组、36/3 167 事件。R156 §4 的确定性取舍仍然
  应当保留（否则同一文件夹两次扫描会换素材），但它不是主要问题。

### §3 整盘暴露的三个问题与修复

1. **扫描预算把整盘截掉 73%**（最重）。旧上限 20 000 文件 / 3 000 目录；这块盘是 73 000 条目 /
   3 168 目录，而且截断后留下哪一段取决于目录枚举顺序。实测（20 424 个文件的合成树）：
   旧包 `files=20000, truncated=true`，只扫到 RecentClips，Saved/Sentry 一个没有；
   新包 `files=20424, truncated=false`。上限提到 **120 000 / 6 000**，并按
   **RecentClips → SavedClips → SentryClips、各自最新在前** 的顺序花预算；超出时留下的是最近的一段，
   而不是任意一段。JS 侧同时验过：20 424 个文件 → 4 个事件、RecentClips 3 400 段，加载 16.6 s（AVD 内建存储）。
2. **速度曲线会把 24 h 的 RecentClips 全读一遍**。1 431 段 × 80 MB ≈ **114 GB**，是分钟级以上的
   I/O；旧的循环对每个事件都读全部段。现在只有 **超过 60 段**的事件才限额（48 段 / 320 MB / 4 s，
   从当前所在段向两侧展开，缓存命中不计），普通事件（Saved/Sentry 通常几分钟）走原路。实测：
   3 400 段的事件只读 **4 段 / 367 ms**；10 段的真实事件仍然 **10/10 全读**（11.6 s、约 500 MB）。
3. **时长缓存按「分钟」分组，把后一簇的时长记到了前一簇上**（新排序把它暴露出来）。真实
   `07-33-00`（59.955 s）与 `07-33-08`（62.039 s）同属一分钟；旧缓存只存一个值，谁先读到算谁。
   改成按**完整时间戳**分组后，段里的文件与段长一致：SavedClips 总长回到 **562.034 s**，
   07-33 段取 `07-33-00` / 59.955 s。

### §4 仍然没做（需要用户拍板，不是砍功能）

- **片段间隙被压缩（通常 2–5 s，最大 8 s 以上）**：这段素材几乎每段都比上一段晚 64–66 s 开始，
  而文件只有 60–62 s（6 571 对衔接里 5 193 对落在 64–70 s）；另有 31 处 >90 s（最大 11 min）、
  29 个事件有缺口。桌面本来就是「首尾相接」，要不要插黑场/冻结帧或只在尺子上标缺口，是设计决定。
- **同分钟两簇的后者仍不可达**（36 个事件 / 37 对）：R156 已改成确定性取最早。**重叠的部分不是丢的**
  （两个文件覆盖同一段墙钟，画面重复），真正打不开的是后一簇「超出前一簇结尾」的那截尾巴。整盘量到
  37 对：中位 **22.5 s**、最大 **56.9 s**、合计约 **12.3 分钟**（例：07:39:11 61.24 s + 07:39:45
  61.17 s，重叠 27.2 s，后者尾部 33.9 s 不可达）。选项仍是 A 现状 / B 段键到秒顺序播放（重叠重播）/
  C 段键到秒 + 后者从「前一簇结束时刻」起播（不丢不重，需要给段加入点，播放/胶片/导出取点一起改）。
- **RecentClips 仍是「一个 1 431 分钟的事件」**：尺子有 24 h，卡片写「1431 分钟」。要不要按天/按
  驾驶时段拆成多个事件（列表更可用），是产品取舍。

### §5 验证与交付

- 合成树 A/B（旧 1.2.253 → 新 1.2.256）：`20000/true` → `20424/false`；顺序
  `RecentClips → SavedClips(01-05 先于 01-02) → SentryClips`；RecentClips 内最新在前。
- 真素材（/sdcard/TeslaCamReal，27 文件）：SavedClips 总长 562.034、07-33 段文件与时长一致；
  六个相机共享同一时长（11-42-42 全 20.626）。
- 回归（AVD 冷启动后）：**竖屏 94/0、横屏 35/0**。
- `Tessera-1.2.254.apk` 28,234,183 B / md5 `da4b8202ceafb3d42caec0e7f02f9b36`（扫描上限 + 顺序）。
- `Tessera-1.2.255.apk` 28,234,183 B / md5 `8d66cfe645422b2b0b7c01e2549c2d88`（曲线预算只对超长事件）。
- `Tessera-1.2.256.apk` 28,234,183 B / md5 `d1319b64323f4f8fbc86d2a9ab4692b7` /
  sha256 `38955258f283b7570164a3d4b47cfffbabb0184359c0c2aae120f8e3ea84374d`（按时间戳分组时长）。旧包全留。

## R158（1.2.257）时间轴：缺口标出来（B）+ 同分钟重叠不丢不重（C）

用户拍板：空档做 **B（只在尺子上标缺口）**、重叠做 **C（段键到秒 + 后者从上一簇结束处起播）**。
**D（冻结帧衔接，Tesla 自带播放器的做法）本轮不做**，理由见 §5。

### §1 B：缺口标记

- `calculateEventDurations` 现在同时算出 `event.segmentGaps[i]`：
  `下一段墙钟起点 − (本段墙钟起点 + 本段文件时长)`，只用**实测到时长**的段；重叠时为 0。
- 尺子上在每个接缝处画一个虚线小刻（`.gap-marker`），**只有缺口 ≥ max(5 s, 总长/200)** 才画：
  10 分钟的事件标出 59 s / 12 s 这种，24 h 的 RecentClips 只标 >7 分钟的洞，不会变成一条虚线带。
- 长按 450 ms 弹 toast「此处缺 59 秒（未录制）」；短按不 seek（`pointerdown` 不冒泡到进度条）。
  命中区在轨道上方，横向是 40 px（`::after`），不挡拖动。
- 播放与导出**完全不变**：空档仍然不占时间，只是从「时钟莫名跳一下」变成「这里有个洞，缺 59 秒」。
- 触发红点同步修正：`eventOffsetSeconds` 以前直接把「墙钟偏移」当尺子秒数，有洞/裁剪时会落到
  右边去；现在按段映射到尺子（10-08 07-41-59 事件：墙钟 647 s → 尺子 **564.427 s**，正好是
  最后一段起点 560.427 + 触发点在该文件内的 4.0 s）。标签的时间也改成直接读 `event.json` 的
  `timestamp`，不再由「起点 + 尺子偏移」反推。

### §2 C：同分钟重叠不丢不重

- 手机端段键从「分钟」改为**完整时间戳**（`YYYY-MM-DD_HH-MM-SS`）；桌面仍是分钟键。
  07-41-59 这个事件因此从 10 段变 **11 段**，总长 562.034 → **572.118 s**（多出的正是 07-33-08
  超出 07-33-00 结尾的那 10.084 s）。
- 每个段时间轴变成「文件时长 − 头部重复段」，重复段存在 `segment.clipStart`，不重播：
  - 播放/换段：`loadEvent` / `playNextSegment` 在载入后 seek 到 `clipStart`；
  - 播放位置：`getCurrentTime`、`positionEntry`、`loadedSegmentDuration`、`applySeek`、看门狗全部
    换算到「尺子秒 ↔ 文件秒」；
  - 胶片条：`clipFrameTarget` 加回 `clipStart`；
  - 速度曲线：样本先过滤掉 `clipStart` 之前的部分，再把时间平移回段内；
  - 导出：`phoneExportSegments` 的 `clipStartUs/clipEndUs` 加回 `clipStart`（引擎要的是文件内秒数）；
  - 顶部墙钟：手机上所有事件类型都用**文件自己的时间戳 + currentTime**（以前只有 RecentClips）；
  - 删除重切：`eventAfterDelete` 重新跑一遍 `assignClipOffsets`（删掉被依赖的段也不会留下错偏移）。
- 一个段被完全覆盖时保留 0.1 s（不产生零长度段），并把它记在 `clipStart` 上。

### §3 实测

合成事件（同一段 18.271 s 的 fixture 复制成三簇，第二簇晚 2 s / 14 s）：

| 场景 | 段 / 裁剪 / 有效长 / 起点 |
| --- | --- |
| 晚 2 s | 18.271/0/18.271 @0 · 18.271/**16.271**/**2.0** @18.271 · 18.271/0/18.271 @20.271 |
| 晚 14 s | 18.271/0/18.271 @0 · 18.271/**4.271**/**14.0** @18.271 · 18.271/0/18.271 @32.271 |

- `seekToTime(19.0)` → 第 2 段、文件 **17.0**（16.271+0.729）；`seekToTime(20.4)` → 第 3 段、文件 0.129；
  回退 17.5 → 第 1 段、文件 17.5。
- 播放跨过 18.271 → 自动换段后 `front.currentTime = 4.27`、`getCurrentTime = 18.27`，没有重播、
  没有丢段（AVD 在该 seek 上要等约 9 s 才重新交帧，属本机解码/回环延迟）。
- 导出 `[17, 21]` → `09-00-00` 17–18.271、`09-00-02` **16.271–18.271**、`09-01-00` 0–0.729。
- 胶片条 `at=19` → 文件 17.0。
- 缺口：真实 07-41-59 事件 11 段、总长 572.118、gaps [59.047, 1.961, 3.177, 3.004, 2.193, 3.529,
  2.979, 3.577, 3.106] → **1 个标记**（59 秒，位于 61.953/572.118 = 10.83%）；合成长缺口 27.729 s
  → 「此处缺 28 秒（未录制）」。
- 回归：**竖屏 94/0、横屏 35/0**（1.2.257）。

### §4 边界与已知限制

- 段偏移以 **front** 的时间戳/时长为准，六路同一簇共用（Tesla 六路同名同起点）。
- 缺口标记只标「大到看得见」的洞（阈值随总长缩放）；2–4 s 的换段缝不标，时钟仍会跳。
- `segmentGaps` 只在算时长/删除重切时重算；播放中 `rebookAxis` 只移动尺子并重画标记，不重算 gap
  （只有扫描读不到 moov 的极少数段会受影响）。
- 桌面端所有新行为都门控在触摸壳：段键、`clipStart`、gaps、标记、时钟、触发点都保持原样。

### §5 关于 D（冻结帧衔接）

本轮不做，建议也先不做：

1. 它要把「空档」变成占位时间，尺子必须和墙钟一一对应；2–4 s 的缝在连续驾驶里会让画面每分钟冻一下，
   24 h 的 RecentClips 会多出 1.5–2 小时的死气。
2. 大洞（59 s、11 min）会冻很久，用户更容易判成「卡死」而不是「没录」。
3. 它要改播放核心与导出的时间基准；B 已经用极小的代价把「为什么跳」讲清楚了。
4. B 已经把每段的 file gap 算出来了——以后真要做 D，可以直接在这个表上切换「跳过 / 标出 / 冻结」。

### §6 交付

- 回归：**竖屏 94/0、横屏 35/0**。
- `Tessera-1.2.257.apk` 28,237,787 B / md5 `9a58c8707df2ec7ae627a022cf32bc00` /
  sha256 `4bef5fa6aa03787082faa3b4c27f8e1e375328f19e206690f40f5800f8e52ed6`。旧包全留。

## R159（1.2.258–1.2.259）P1/P2/P3 全部落地：懒测时长、大 U 盘进度、RecentClips 拆分、曲线补段、换段缝开关

用户原话：「把 P1、P2、P3 都干了。RecentClips 拆成「按天/按驾驶时段」可以供选择。小缝都给刻度，
同时加一个「标出所有换段缝」的开关。」范围按上一轮建议清单逐条对齐；没有砍功能。
桌面行为仍然零改动：新增的两个偏好行都用既有 `.menu-choice`（桌面 `display:none`），
所有新逻辑继续门控在触摸壳。

### §1 P1 · 打开事件时懒测时长（`probe_durations`）

- 新命令 `probe_durations(paths)`（上限 300 条）复用 R156 的 `mvhd` 读取：每段 3 次 seek、不读正文。
- `playEvent` 先跑 `probeUnmeasuredClips(event)`：只对扫描没测到 moov 的段发一次请求，
  任一值回来就 `event.totalDuration = 0`，随后 `calculateEventDurations` 用真实时长重算段长、
  起点、`clipStart` 与 `segmentGaps`。这样 SentryClips 里那些超出整盘扫描预算的事件，
  打开时也是精确的，而不是除最后一段外都按 60 s 记账。
- 实测（真片 07-41-59，11 段）：把所有 `segment.duration` 清空后调用，**49 ms** 返回；
  11 段的时长、起点、缺口、总长与扫描测得的账**逐项相同**（总长 572.118 s）。
  其中第 3 段原生读数 62.039 s、重叠裁剪后有效 10.084 s —— 两条账各自正确。
- 失败回落不变：命令报错或没回数组就返回 `false`，继续走原来的“最后一段用 `<video>` 探”的路径。

### §2 P1 · 大 U 盘的打开体验

- 骨架屏里新增一行 `.scan-skeleton-status`：
  - 扫描中每 500 ms 读一次 `scan_progress`，写「已扫描 N 个文件」；
  - 扫描结束、进入 `event.json` 阶段后，同一行写「读取事件信息 n/m」（>24 个侧车才显示）。
- 实测：3,829 个文件的树从「已扫描 0」一路涨到 3,829（约 10.9 s，间隔 40–100 ms 刷新）；
  30 个事件 / 60 个文件的树在 **911 ms** 内走完，依次出现「读取事件信息 24/30」「30/30」，
  结束后骨架与状态行都清掉，城市/街道正确解析。
- **验证时抓到一个真 bug**：扫描已完成、侧车正在读的时候，500 ms 的扫描轮询还会把
  「读取事件信息 24/30」覆盖回「已扫描 60 个文件」。修法是在原生扫描一返回就
  `clearInterval(scanPoll)`（1.2.259）。复测事件序列变成
  「扫描中… → 读取事件信息 24/30 → 30/30」，不再回跳。
- **没有做的子项（明确记账）**：把卡片渲染提前到侧车读完之前。那样会先给出没有
  城市/街道/触发原因的卡，搜索与「只看触发」在剩余侧车读完前都是错的；真机上的等待
  现在有一条会动的计数行解释，先保住正确性。等有真机数字再决定是否做分段渲染。

### §3 P2 · RecentClips 拆分（`none` / `day` / `session`）

- ⋮ 面板新增「最近片段」三选一，偏好持久化：
  - `none`：保持一个事件（原行为）；
  - `day`：按文件名日期切；
  - `session`：相邻片段时间隔 >10 分钟就切一段。
- 拆出来的事件 id 追加首段完整时间戳（`...#'YYYY-MM-DD_HH-MM-SS`），后到的分钟会并入同一组，
  因此保存的播放位置在扫描刷新后仍归位。切换偏好会用新偏好重建列表，并清掉扫描指纹。
- 实测（5 个一分钟片、跨 2 天、其中一天有两段相隔 20 分钟）：
  `none` = 1 个事件 / 5 段；`day` = 2 个事件（3 段 + 2 段）；
  `session` = 3 个事件（1 + 2 + 2 段）；切回 `none` 恢复 1 个，偏好写入 `none`。
- 只对 `RecentClips` 生效；SavedClips/SentryClips 本来就是一段一个事件，原样通过。

### §4 P2 · 速度曲线懒填充（`noteLiveTelemetry`）

- 长事件的曲线扫描有预算，未扫到的段本来是空的。现在数据卡片每读一段遥测，
  `MetadataManager.loadMetadata` 就把这份已经付过费的样本交给曲线：
  过滤掉 `clipStart` 之前的重复段、平移回段内、补上 `segmentStart`，再重绘（500 ms 节流）。
  已有样本的段直接丢弃，不重复追加。
- 实测（SEI fixture，150 点 / 0–6.24 s）：
  - 清空全部段曲线后读该段：**86 ms**、150 点入位、首点 0、末点 6.24、`segmentStart=0`；
    canvas 变为可见、实绘 133,022 个非透明像素、span 6.29 s；
  - 模拟重叠头 `clipStart=1.5`：剩 **116** 点、首点仍为 0（说明裁掉的是文件头重复段）；
  - 同一段再读一次：116 → 116，没有翻倍。

### §5 P3 · 小缝刻度 +「标出所有换段缝」开关

- ⋮ 面板新增「换段缝」两选一：`all`（全部标出，默认）/ `holes`（只标大缺口）。
- 阈值仍是 `max(5 s, 总长/200)`：达到阈值的画可长按的 major（虚线、40 px 横命中区、带 aria-label 与
  「此处缺 …（未录制）」toast）；未达阈值的在 `all` 下画 short/faint 的 minor：
  **`pointer-events:none`、`tabIndex=-1`、`aria-hidden=true`、无 aria-label**，
  且彼此至少隔 5 px —— 24 h 事件不会用几十个手指大小的热区把整条进度条封死。
- 实测（4 段 fixture，缺口 2.73 / 2.73 / 59.73 s，总长 73.08 s，阈 5 s）：
  `holes` = 1 个 major + 0 minor；`all` = 1 major + 2 minor；
  minor 的计算样式 `pointer-events:none`、tabIndex `-1`、`aria-hidden="true"`、无 label；
  major 标签「此处缺 1 分 0 秒（未录制）」；偏好写入 `all`。
- 只在触摸壳创建标记；桌面进度条不新增任何节点。

### §6 验收与测试夹具修正

- 竖屏 **94/0**（400×889，真片 07-41-59）。第一次跑出 **93/1**：数据卡片字号普查多读到
  一个 11.52px，复查是卡片里当时存在、随后被清空的隐藏文本节点（同一状态下再跑即 94/0）；
  这条是普查把隐藏元素也计入的瞬时态，不是 R159 改了卡片字号。
- 横屏 **35/0**（889×400）。第一次 34/1：新增两行偏好后 ⋮ 面板内容 326 px、视口 238 px
  （R122 已允许滚动），原判据「滚到底后对每个按钮做命中测试」会把滚出视口的上方六行记成
  dead。**改的是判据**：逐按钮滚入面板后再量中心点，然后恢复滚动位置；
  变异测试先确认干净态 `dead=[]`，再用一个覆盖层盖住 `metaSwitchBtn`，判据必须报出它 ——
  证明不是把判据改绿。
- 夹具清理：`TeslaCamBig`（3,829 文件）、`TeslaCamSplit`、`TeslaCamGap`、`TeslaCamSidecars`
  与 `r157-big.tar` 已从设备删除；`TeslaCam` 与 `TeslaCamReal` 保留。
- `Tessera-1.2.259.apk` 28,292,139 B / md5 `39713a22dc0191d84c821aecaaceb39b` /
  sha256 `900f0026bd6b51da7df34230db891797de6d148fab9e5d6ec3084662cef0dba7`。旧包全留。
- D（冻结帧衔接）继续不做，理由仍见 R158 §5；本轮没有把空档变成占位时间。

## R160（1.2.260–1.2.262）真机反馈收口 + 拆分身份 + 侧车批量读取

真机反馈已确认：2–4 s 小缝可见、不挡拖进度条，六路同播无卡顿，大缺口长按可说明；
小缝刻度仍保持「只画不接手势」——它们没有命中区，正是为了不封死进度条。
本轮在此之上修了两处会影响日常使用的问题，并补了大缺口对读屏的说明。

### §1 拆分模式下的收藏与续播（P1）

- 旧实现把收藏和续播都按 `eventId` 存，而 RecentClips 拆分后的 id 带
  `#首段时间戳`（[script.js:14860](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js#L14860)）。
  切「一整个 / 按天 / 按段」后 id 变了，收藏会看起来消失，续播回到 0:00。
- 现在切模式时 `carryRecentViewState` 做两件事：
  - **收藏**按段覆盖传播：整段收藏覆盖拆分后的每一组；只收藏某一天/某一段时，
    合并回「一整个」只有在**全部片段都被收藏覆盖**时才显示收藏，不会凭空替另一天加星。
  - **续播**按片段跟随：旧位置指向哪一分钟，就写到包含这一分钟的新组，并换算组内索引。
- 续播条目新增 `path`（该段 front 文件的绝对路径）；即使 id 因滚动删除而消失，
  `savedPositionFor` 仍能按路径找到片段并恢复。旧条目（只有 `{i,t}`）继续可用。
- 实测（5 段跨 2 天）：`none → day` 后两天都继承整段收藏，续播落在 30.571 s（同一条片段）；
  `day → session` 后仍 30.571 s；伪造 `stale#id` 只留路径时也能恢复到 23.271 s；
  只收藏 1 月 1 日再合并，整段**不**显示收藏；切回按天，1 月 1 日仍是收藏。
  10/10 断言通过（`devtools/r160-identity.js`）。

### §2 侧车批量读取 + 按扫描缓存（P1）

- 新原生命令 `read_sidecars(paths)`：一次 IPC，在 blocking 线程里读完并解析
  `city/street/timestamp/est_lat/est_lon/reason`，按输入顺序返回；
  损坏/读不到的文件返回 `ok=false`，调用方沿用原来的失败计数。
- JS 侧手机路径优先走它，失败自动回落原来的 6 个一批；桌面仍走原 JS 路径。
- **缓存**：同一轮扫描内，切换到拆分模式会重建列表但文件没变，侧车不重新读。
  `processFiles(files, { reuseSidecars: true })` 只由 `setRecentSplit` 使用；
  新的扫描/目录加载会清空缓存。诊断新增
  `sidecars=native|cache|js|js+cache reads=N failures=M`。
- 实测（同一 300 个 event.json，AVD）：
  - JS 6 个一批：**6 057 ms**；原生一次：**867 ms**（约 7 倍）。
  - 300 事件目录整体加载：**4.0–5.3 s**（含原生扫描与 300 张卡渲染）。
  - 加载后连续切两次拆分模式：**512 ms / 248 ms**，`reads=0`（旧实现每次 2.2–3.1 s，
    每次都重读 300 个侧车）。
- 真机 3 000+ 事件的侧车阶段预期从「一分多钟」降到十秒级；具体数字仍需真机确认。

### §3 大缺口对读屏/轻点（P2）

- 大缺口标记原来只认 450 ms 长按；TalkBack 执行的是 click，等于永远听不到说明。
  现在**单击也播同一条说明**（仍不 seek），长按继续可用；700 ms 去重防止
  pointerup + click 说两遍。
- 小缝刻度仍是装饰：`pointer-events:none`、`tabIndex=-1`、`aria-hidden`，无 label；
  实测点它不产生 toast，也不改变拖动行为。这与真机反馈一致。
- 实测（`devtools/r160-gap-a11y.js`）：major=1、minor=2；`click` 大缺口得到
  「此处缺 1 分 0 秒（未录制）」；minor 点击新增 toast 数 = 0。

### §4 验收与判据修正

- 竖屏 **94/0**、横屏 **35/0**（1.2.262）。
- 数据卡片字号普查修了两处**量具**问题：
  - 先等 `metadataManager.isLoading === false` 再量，避免把加载态算进档位；
  - `#metadataEmptyPlace`（无 SEI 时的地点兜底，11.52px）是独立状态，不是数据读数档位，
    加入普查豁免清单。此前它让「数据卡片 8 档」在有无 SEI 的事件之间时红时绿。
- R160 回归脚本：`r160-identity.js`（10 条）、`r160-sidecars.js`、`r160-cache.js`、
  `r160-gap-a11y.js`；夹具由 `devtools/r160-fixtures.sh` 重建（`many` 参数生成 300 事件树）。
- 设备上保留 Split / Sidecars / Gap 三套小夹具（约 3 MB）供后续回归；300 事件树已删。
- `Tessera-1.2.262.apk` 28,331,239 B / md5 `ca3d0a14e0d7ee08cf012d4104b7e0dd` /
  sha256 `7faaec07fe35bf5454c7edc1c9bd635eebcf675b2122c278b7ff682f2daa158d`。旧包全留。
- 桌面行为未改：新命令只在触摸壳调用；JS 回落路径保留；拆分/收藏传播全部在手机档。

## R161（1.2.263）超 300 段补测 + 3 000 事件列表实测

真机已确认小缝不需要长按；本轮只做清单里剩下的两件可离线完成的事，小缝仍保持纯视觉标记。

### §1 单事件未测时长段超过 300

- `probeUnmeasuredClips` 原来只收集前 300 个未测段，一次原生调用后就停；一天 RecentClips
  是 1 440 分钟，超过 300 的部分仍按 60 s 记账。
- 现在按 300 一批循环调用（原生命令自己的单次上限不变），任一批失败只影响该批，其余继续。
- 实测 350 段单事件：修前 **300/350**（最后一段 `null`），修后 **350/350**，两批共 **1 878 ms**；
  首段与末段都是 18.271 s。`devtools/r161-probe-many.js`。

### §2 3 000 事件列表：先量再决定是否虚拟化

用 3 000 个占位事件（6 000 个零字节文件）在 AVD 上实测：

| 项 | 结果 |
| --- | --- |
| 冷加载总耗时 | 71.3 s |
| 原生扫描（含 2 000 次时长探针） | 25.0 s |
| 侧车 3 000 个（原生一次） | 10.0 s |
| 分组/拆分记账 | 171 ms |
| 首批 60 张卡 | 300–395 ms |
| 搜索「City 3000」 | **39 ms**，1 条 |
| 类型筛选 / 排序 | 333 / 373 ms（≈ 重建 60 张卡的 DOM 成本） |
| 连续翻 10 页（600 张卡） | 3 637 ms（约 6 ms/卡） |
| 日期 chip | 8 天 + 「全部」= 9 个（既有上限） |

结论：**不需要虚拟化**。筛选本身在 3 000 条上很便宜，耗时都在重建首屏 60 张卡；
搜索这条最常用路径 39 ms。冷加载的大头是原生扫描与侧车，不是列表，下一步应等真机数字，
再决定是否把扫描/侧车并行化。占位树是零字节文件，扫描探针成本偏高，真盘数字不能直接等同于这张表。

### §3 验收与交付

- 回归：**竖屏 94/0、横屏 35/0**（1.2.263）。
- 夹具脚本 `devtools/r160-fixtures.sh` 新增 `probe`（350 段）与 `3k`（3 000 占位事件）两个可选参数；
  3 000 事件树与 350 段树验收后已从设备删除，Split/Sidecars/Gap 三套小夹具保留。
- `Tessera-1.2.263.apk` 28,331,371 B / md5 `6db3d8ca84917458e32fef76fc852ce4` /
  sha256 `cdd437bf10bf9b7bbb621331c4f0e63baa5e528ce9c3dcbff034262698d4db94`。旧包全留。
- 桌面行为未改；新逻辑仍全部门控在触摸壳。

## R162（1.2.264）API 29 验收发现：旧 WebView，先给更新提示；专项套件收口

### §1 Android 10 实测：权限之前先撞上 WebView

- 新建 API 29（Android 10）AVD，装 1.2.263。页面外壳能画出来，但 `window.viewer` 与
  `MetadataManager` 都不存在，整个界面不可用。
- 原因是镜像自带 **WebView 74.0.3729.185**，解析不了包里已有的 `?.` / `??`（Chrome 80+）。
  这是语法错误，不是权限或原生桥的问题；`1+1` 能执行、`?.` 表达式返回 SyntaxError。
- 尝试把 API 36 镜像里的 WebView 133（minSdk 29）装到 API 29：被
  `INSTALL_FAILED_MISSING_SHARED_LIBRARY: com.google.android.trichromelibrary` 挡住，
  API 36 镜像里没有可单独安装的 Trichrome 库；没有使用第三方 APK。
- **新增更新提示**（[index.html](file:///C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/index.html)）：
  在主 bundle 之前的 ES5 脚本里用 `new Function('var a={};a?.b;var c=null;c??1;')` 探测语法能力；
  不支持时显示全屏「需要更新系统 WebView / This build needs an updated Android System WebView」，
  不再留下一个点了没反应的界面。现代 WebView 不显示任何东西。
- 实测：API 29（Chrome/74）`flag=true`、提示框存在、文案正确、`viewer` 仍 undefined；
  API 36（Chrome/133）`flag=false`、无提示框、`viewer` 正常。
- **#13 仍未完成运行时验收**：需要在 **WebView ≥80 的真实 Android 10/9 设备**（或带可更新
  WebView 的镜像）上走一遍 READ_EXTERNAL_STORAGE 拒绝→授权→扫描。原生侧代码
  （`READ_EXTERNAL_STORAGE`、`stateJson` 的 legacy 分支、`openStorageSettings` 的 API<30 分支）
  保持原样，未改；本轮只是把「旧 WebView 白屏」变成可解释的提示。

### §2 专项套件收口

- 新增 `devtools/r161-verify.mjs`：一条命令跑 identity 10/10、侧车原生批量、按扫描缓存、
  缺口读屏、350 段补测五项，逐项 PASS/FAIL 并保存原始 JSON。
  本次在 1.2.264 上 **5/5**。
- `devtools/cdp-eval.mjs` 支持 `ADB_SERIAL` / `CDP_PORT`，可同时连多台模拟器
  （本次 API 29 与 API 36 并行）；默认行为不变。
- 夹具脚本继续支持 `probe` / `3k` / `many`；Split / Sidecars / Gap / Many / Probe 保留在设备上，
  3 000 事件树已删。API 29 AVD 验收后删除，系统镜像保留，可随时重建。

### §3 验收与交付

- 回归：**竖屏 94/0、横屏 35/0**（1.2.264，API 36 AVD）。
- `Tessera-1.2.264.apk` 28,331,943 B / md5 `52e1d923c39b0254112b1c58eb8c1b4e` /
  sha256 `3aac8c3d708bd717c490a20541c05cfd52fbdc296e3df37b4599815578e8b411`。旧包全留。
- 桌面行为未改：更新提示只在能力探测失败时出现，现代桌面/手机都不触发。

## R163（1.2.265–1.2.266）真机三问：顶部地点、触发框晃动、扫描卡顿

### §1 播放页顶部地点又消失：原生侧车只认数字坐标

- 真机诊断：`sidecars=native reads=3167 failures=0`，但当前事件顶部没有地点。查 R157 的整盘审计：
  **3 167/3 167 个 `event.json` 的 `est_lat` 都是字符串**（`latIsString: 3167`）。
- R160 的原生 `read_sidecars` 用 `as_f64()`，字符串坐标被解析成 `null`；`hasPlace` 要求
  `city && lat && lon`，于是地点行 `display:none`。JS 回退路径保留原值，所以只有原生路径丢。
- 同时 `timestamp` 也被强制成字符串，真机上有些事件写的是 epoch 秒（数字），会一起丢掉，
  影响「跳到事件」和红点位置。
- 修复：`sidecar_number()` 同时接受 JSON 数字与数字字符串；`timestamp` 改为原样保留
  （`serde_json::Value`），JS 本来就能同时处理字符串/数字。
- 实测（字符串坐标 + 数字 timestamp 的夹具）：修前三项全 `null`、地点行 `none`；
  修后 `30.274123 / 120.155101 / 1792000000`，顶部 `📍 Hangzhou · Wensan Road`。
  `devtools/r163-lat-string.js`。

### §2 触发标注的单路画面偶尔上下晃动

- 触发框和相机标签的几何原来取 `<video>` 元素的 `getBoundingClientRect()`。换段时 `src` 被换掉，
  元素会短暂不是格子那个盒子；测量跟着变，而框本身有 0.3 s 的 CSS transition，于是表现为
  偶尔上下晃一下。
- 实测（单路 400×635，1.5437 片）：正常 `top=188 height=259`；把视频元素临时改成
  50% 居中后，旧实现变成 `top=252 height=130`（框跟着元素缩上去）。
- 修复：`paintedFeedRect` 只用**格子的 clientWidth/Height + 片段宽高比**，contain 一定是居中，
  不再读视频元素的瞬时矩形。同一扰动下 now `top=188 height=259` 不变，且仍精确包住画面
  （期望 187.9/259.1）。`devtools/r163-trigger-stable.js`。

### §3 扫描慢与中间卡顿

- 20 424 文件的树在 AVD 上分段：原生走盘+IPC 8.3 s、TauriFile 映射 7.4 s、分组 282 ms、
  整次加载 10.6 s；期间 31 个 >50 ms 长任务，最大 424 ms。73 k 文件约 3.5 倍。
- 三处改动：
  1. `nativeScanFiles` 只算一次根路径，把 `webkitRelativePath` 直接交给 `TauriFile`，
     不再为每个文件重做两次 `/\/g`、`split('/')` 和 `filter`；
  2. 映射每 2 000 个文件让出一帧（`setTimeout(0)`），不再一个任务建 73 k 个对象；
  3. `processFiles` 的视频分组每 4 096 个文件让出一帧，骨架不再在收尾时整段冻结。
- 实测（20 424 文件，单次冷加载，AVD 内存提到 3 GB）：**8.76 s，长任务 2 个，最大 124 ms**
  （此前 2 GB AVD 的 31 个/424 ms 含三连扫描与内存换页，不能直接横向比；但长任务确实被拆开）。
  总时间仍由原生走盘与 USB 读决定，73 k 真盘还会更久；若还要更快，下一步应并行目录/时长探针，
  而不是继续优化列表。
- 回归：**竖屏 94/0、横屏 35/0**；`r161-verify` 5/5；`r163-map-equivalence` 相对路径全对。
- `Tessera-1.2.266.apk` 28,335,063 B / md5 `934a5e7f306018ccb548028ba724df13` /
  sha256 `42e5ba576818ee9a3f65e3e21320c3d329e72d3ef41c2133cf1f4a549764b269`。旧包全留。
- 桌面行为未改：坐标解析与触发框几何都只影响手机路径；桌面 object-fit 为 cover，仍走整格。

# R164 — 横屏插 U 盘后列表被挤压、来源 chip 压到卡片上（1.2.267）

### 根因

- 横屏手机抽屉 312×400：导航 76（含状态栏 inset）、搜索 48、筛选 108、日期 chips 51、
  最近目录 40、页脚 73 —— 合计 396，已经超过 400。所有固定行默认 `flex-shrink: 1`，
  于是每行都被按比例压扁。
- `.recent-dirs` 是 `overflow-x: auto` 的滚动容器，自动最小高度为 0，被压到 **14.8px**；
  40px 的来源 chip 画出盒子外，正好落在第一张事件卡上方。插 U 盘后最近目录从 1 个变 2 个，
  这一排才第一次出现，所以症状与 U 盘同时出现。
- 旧布局实测：header 14.8、recent-dirs 14.8、chip 205.2–245.2（行盒 221.8–236.7）、
  列表 114.6、首卡 239.7 起 —— 三段内容落在同一段纵向区间里。

### 修法（只改横屏手机档）

- 新增 `.filter-stack` 包住筛选、日期 chips、最近目录。默认 `display: contents`，
  桌面/竖屏的子元素仍是侧栏 flex 项，布局零变化。
- 横屏 + 抽屉打开 + 筛选打开时，wrapper 变成 `position: absolute` 的面板挂在抽屉右侧：
  `left: calc(100% + 8px)`、宽 `min(340px, 剩余宽度)`、高自适应可滚、实底+圆角+阴影。
  筛选改吃画面那半边的空宽，列表拿回抽屉全部余高。
- 导航行与搜索行 `flex: 0 0 auto`，任何固定行都不能再把它们压扁。
- 收起筛选时连 `.quick-filters` 容器一起隐藏，回收 11px 的空白行。

### 验收

- **布局 28/28**：面板 340×208.5，left=319.3 / 抽屉 right=312；列表 203.1 紧接搜索行
  （top=124.1），底部 327.2 = 页脚顶；来源行 48 高，5 个 chip 全高 40 且都落在面板内；
  面板与日期 chip 的 `elementFromPoint` 命中自己而不是遮罩；收起筛选后列表仍 203.1；
  关闭抽屉后 wrapper 回到 `contents`，筛选区随抽屉移出屏（right = -0.7）。
- **真点 12/12**：`adb input tap` 点漏斗开/关筛选；点面板内日期 chip 后抽屉与面板都还开着，
  筛选生效（`2026-04-01`，列表只剩该日期）；点「全部日期」清空。
- 回归：**竖屏 94/0、横屏 35/0**。浅色与深色各截一张图目视确认。
- 桌面未改：`.filter-stack` 在桌面就是 `display: contents`。
- `Tessera-1.2.267.apk` 28,335,707 B / md5 `921ba1e236a8a32565610de9f4098d76` /
  sha256 `4b0613784ed5c9944241baaafc6bdd78bb8f2274f78ca82f01cea7b790f3352b`。旧包全留。

# R165 — 竖屏事件列表文字三行对齐（1.2.268）

### 根因

- `.video-info` 沿用了桌面竖卡片的 `align-items: center`，手机横排卡片里两行文字被整体
  水平居中：没有位置信息的行文本更短，起始 x 右移（实测 154.8 vs 有位置行 126）；
  「城市 · 街道 + 日期时间」又会折成两行（timeBox 高 32.4），副行跟着上下移动。
- 结果是同一列表里日期/时间不在同一左边缘，长位置行还比短行多一行 —— 用户看到的
  「不整齐」。

### 修法（只竖屏手机档）

- 卡片文案拆成 `.video-place`（城市/街道）与 `.video-when`（日期/星期/时间），
  外加原 `.video-sub`。桌面两个 span 仍是内联，组合行与原来一字不差。
- 没有位置信息时，`.video-place` 内放 `.video-place-empty`（桌面 `display:none`，
  只有竖屏手机显示）；竖屏 + `html.touch-ui` 时 `.video-info` 改
  `align-items:stretch; text-align:left`，`.video-time` 改成 flex column：
  **位置 / 时间 / 类型·大小** 三行固定栅格，每行单行省略。
- 无位置行用 `--text-secondary` + 400 字重的「未记录位置」占位，不抢正常地点的视觉重量。
- 卡片高度仍是 66px：旧的两行块在 60px 的信息区里居中，本来就留出了第三行的位置。

### 验收

- 竖屏专项 **22/22**：三行左边缘全为 126；place/when/sub 相对卡片顶部的偏移在所有卡片
  一致（0.1px 内）；卡片全 66；三行高度 16.2/16.2/15.9 且都是单行；时间
  `scrollWidth = clientWidth`（无省略）；夹具 2 行有位置 + 6 行无位置；占位与副行同色
  `rgb(108,117,125)`、字重 400。
- 横屏门控 **7/7**：`.video-time` display=`block`、place/when `inline`、占位
  `display:none`、信息块仍居中、卡片仍是紧凑 52（不是三行 66）。
- 回归：**竖屏 94/0、横屏 35/0**。浅色/深色各截一张图目视确认。
- 桌面未改：新增 span 默认 inline，占位默认 `display:none`，桌面组合行不变。
- `Tessera-1.2.268.apk` 28,339,739 B / md5 `fd35e41edbfea74ae757d7b7374659fb` /
  sha256 `2c49d91bba6830955d5c9e12dd47725cc420edec673d1b43a68d20cc162b21fc`。旧包全留。

# R166 — 横屏事件列表也统一为三行栅格（1.2.269）

### 根因（R165 只覆盖了竖屏）

- R165 的三行规则媒体查询只写了 `(orientation: portrait) and (max-width: 768px)`，横屏事件行仍是
  「位置 + 时间同一行」且 `.video-info` 水平居中。实测横屏：无位置行时间 x=144.8、有位置行 102；
  城市 + 街道把 timeBox 撑到 32.4（两行），副行跟着上下。
- R165 的「横屏门控 7/7」只证明了新栅格没有泄漏到横屏，没有回答横屏本身是否有同样的问题；
  用户真机指出后补做本轮，上一节的横屏结论由本节取代。

### 修法

- 把同一套 `.video-place` / `.video-when` / `.video-sub` 三行规则扩展到横屏手机档
  （`html.touch-ui` + 横屏手机媒体查询）。横屏行距 1px，行高 **52 → 56**：三行内容 50.3px，
  上下各留 2.3px；列表 203px 仍显示 3 行多。
- 无位置行同样显示弱化的「未记录位置」占位；桌面仍是内联的「位置 + 时间」组合行，占位
  `display:none` 不变。

### 验收

- 横屏专项 **17/17**：卡片全 56；三行左缘全 102；place/when/sub 相对卡片顶部偏移一致；
  每行单行 16.2/16.2/15.9；时间 `scrollWidth = clientWidth = 193`（无省略）；3 行无位置 +
  有位置夹具；占位 400 字重、与副行同色；信息区 `scrollHeight <= clientHeight` 不裁切。
- 竖屏列表 **20/20**（R165 的规则不变）；回归 **竖屏 94/0、横屏 35/0**。
- 横屏浅色/深色截图、竖屏浅色/深色截图各一张，目视确认。
- `Tessera-1.2.269.apk` 28,339,867 B / md5 `a742e7d47034cf3f2909c5b798def73f` /
  sha256 `8278aec69fd3d22a6d96977967bd4cfbb253a72ac459be5b2e21f20d6830ac5a`。旧包全留。

# R167 — 大 U 盘扫描：探针/分片/侧车批次 + 阶段诊断（1.2.270）

### 现象与读数

- 用户 1.2.269 诊断：USB 目录 `/storage/B086-9116/TeslaCam` 这次只有 278 个文件、6 个事件，
  `boot list=1209:6`，扫描本身约 1.2s 就绪；`glassCost` 的 flat p95 10.4s 是加载/播放期的采样，
  不是一次干净的扫描读数。大 U 盘的 73k/3168 数据仍是 1.2.263 的旧账。
- 3 000 事件 / 6 000 文件夹具（1.2.270，模拟器）实测：
  `wall=36.9s native=23.0s walk=22.9s stat=0.76s probe=0.91s/200 map=93ms sidecar=12.7s
  process=12.8s long=14/max=184ms`；侧车 `native 3000/3000 failures=0`。

### 改动

- `MAX_DURATION_PROBES` **2000 → 200**：R159 的 `probe_durations` 已在打开事件时按段懒测，
  扫描不再为整盘付出几千次 USB 寻道；最旧的事件由打开时补测。
- JS 映射 2000 → **500** 个/片段、分组 4096 → **1024** 个/片段，减少真实设备上的长任务尾巴。
- 侧车从一次 3 167 条的 IPC 改成 **500 条/批**，批间让帧；结果仍全部进缓存，读计数/失败计数不变。
- 诊断新增一行 `scan last wall/native/walk/stat/probe/map/sidecar/process/long/files`，
  下一次真机读数可以直接分出「走盘 / stat / mvhd 探针 / IPC+映射 / 侧车 / 主线程长任务」。

### 验证与边界

- 竖屏事件列表 20/20、横屏 15/15（1.2.270 同包）；扫描 3k 夹具 `probe=200`，
  侧车 3000/3000、0 失败，长任务最大 184ms。
- AVD 在 3k 压测后依次出现 Chromium `libmonochrome` 崩溃、zygote tombstone、
  `/sdcard` FUSE `Transport endpoint is not connected`；已 wipe 重建。原 TeslaCam 夹具
  （248KB 可播片段）随之丢失，本地 `--push`（65KB 直铺 RecentClips）不是同一套，
  因此 1.2.270 的 94/0、35/0 未能在干净 AVD 上有效复跑；1.2.269 基线仍是 94/0 + 35/0。
  本包改动只在扫描链路与诊断，列表 CSS 未动。
- `Tessera-1.2.270.apk` 28,338,311 B / md5 `f31586ad76c228a17503a69a67bf1068` /
  sha256 `30cf4705d9c137d2eddd760574d7adbf24abc773573747ba1993c410f345c4de`。旧包全留。

# R168 — 渐进扫描（最新优先）+ 类型切换不再等 60 行（1.2.271）

### 现象与读数（1.2.270 真机）

- 73 215 文件 / 3 168 事件：`wall=157715ms native=122412ms walk=122189ms stat=52046ms
  probe=4142ms/200 map=712ms sidecar=32637ms process=33210ms long=2/1263ms`。
  走盘期间列表只有骨架屏；扫描结束后切「全部 / 哨兵 / 最近 / 保存」还能感到停顿。

### 改动

- **原生流式扫描**：新增 `scan_media_dir_stream(app, path, scan_id)`，走盘时按批发出
  `scan-batch`（第一批 240 个文件，之后每 900 个），最后仍返回与 `scan_media_dir` 完全相同的
  `ScanReport` —— 预览只是预览，最终列表仍由整份报告重建。
- **真正的最新优先**：三个目录不再「Recent → Saved → Sentry」整段串行，而是把三份目录列表按
  子项名字做 k 路归并（Tesla 用时间戳命名事件夹与散片，名字倒序即时间倒序）。第一批是整根 U 盘
  最新的事件，而不是「RecentClips 里最新」。文件预算也按同一顺序花，截断时保留的是全盘最新的片段。
- **JS 预览**：把 `processFiles` 的分组与收尾拆成 `addFileToEventMap` / `finalizeEvent`，预览用
  同一套规则（预览与最终列表不会给出两种答案）。批次最多约 2 次/秒重绘；可见前缀没变时只替换
  后备数组、不重建已上屏的 12 行；用户已经往下滚（`scrollTop > 80`）就不打扰，等最终列表。
  最新 160 个 `event.json` 在预览阶段就读（进同一份按路径缓存的侧车表，最终阶段不再重复读）。
- **进度行移出列表**：`#fileList` 上方新增 `.scan-progress-bar`，首张卡片出现时只移除骨架占位，
  状态行留下继续报数；列表重绘不会把它清掉。
- **预览期媒体可用**：`scan_media_dir_stream` 在走盘*之前*就登记允许根目录（旧命令在结束时才登记，
  预览里的 `thumb.png` 会 403）；并用 `LATEST_SCAN_ID` 防止被新扫描顶掉的旧走盘把根目录抢回去。
- **类型切换**：`VideoListComponent` 首屏只同步建 **12 行**，其余 48 行用 rAF 每帧 12 行补齐；
  重建时取消上一轮未完成的补齐，避免旧页追加进新列表。
- 诊断新增 `scan stream batches/first/firstPreview/previews` 与
  `list last events/filter/chips/render/total/cards`。
- 回归顺手收口：USB 向导三个叶子 0.72/0.74/0.78rem（11.52/11.84/12.48px）在手机档统一为
  `--fs-meta`（12px），桌面规则未动。

### 验证（1.2.271，模拟器）

- `r168-verify.js` **26/26**（3 000 合成事件 + 505 事件真流）：类型切换同步耗时
  **5–6ms**、同步上屏 **12 行**、随后收满 60 行；流式扫描 `batches=3 first=490ms
  firstPreview=504ms previews=4/14ms`，第一批卡片 **592ms** 就上屏（走盘总 2 518ms），
  最终 505 事件、首条仍是最新 `2026-09-01_08-19-00`，最长任务 59ms，最终列表渲染 12ms。
- 竖屏全量 **92/0**；横屏全量 **34/1**：唯一红是「导出预览宽 ≥250」，本机夹具是 4:3
  （1376×1024），预览按原比例得 240×181；同一段的 R139「预览保持原比例」为绿。
  用 1.5437 的真车片时该宽度为 257。R166 横屏三行列表 **15/15**。
- 夹具说明：本轮没有可播的竖屏/长片真车素材，`devtools/r31-export-grid.mp4`（4:3、7s）
  被复用；玻璃判据用 7s 片才稳定采样到帧（3s 片在暂停前已播完，`luma=0` 是夹具时长问题）。
- `Tessera-1.2.271.apk` 28,432,463 B / md5 `a01fa7496c923956e8260a6159d914d4` /
  sha256 `999136af888e4e56b384fb5cd3b0e050450a5acbb738cc0614fb7a29a251632c`。旧包全留。

# R169 — 缺口刻度不再挡住进度条 + 换片不再被重复点击拖慢（1.2.272）

### 1. 缝隙条影响拖动

- **根因（evaluated, not guessed）**：R158 起大缺口是 `<button>`，手机档 `pointer-events:auto`
  且 `::after` 给了 41×38 的指头盒；它的 `pointerdown` 自己 `preventDefault + stopPropagation`，
  进度条永远收不到这一下。用 35 个大缺口、340px 的尺子量，**171 个采样点里 170 个命中
  `.gap-marker`** —— 整条尺子都是缺口，从上面起手拖动等于没有进度条。
- **修**：所有缺口刻度退回纯装饰（`pointer-events: none`，删掉加宽指头盒与手指的
  pointerdown/up 处理）。读屏路径保留：大缺口仍是带 `aria-label` 的按钮，TalkBack 的激活走
  `click`，不依赖指针命中。
- **验**：同一把尺子 170 个采样点 **0 个**命中缺口（全部落在 `progress-track/played/handle`）；
  真手指从缺口上起手横滑，`aria-valuenow` 32% → 66%，落点 66%，`currentTime` 同步到 4.64s；
  TalkBack 等价路径（程序化 click）仍能弹出「此处缺 N 秒」。

### 2. 切片卡顿 / 需要点几次

- **根因（measured）**：`playEvent` 没有「同一事件正在加载」的合并。点一次卡片会重新加载
  6 路视频；紧接着再点同一张卡，会把正在进行的加载 `cleanup()` 掉再从头来一次。实测
  **双击同卡：4.1s + 6.3s（合计 8.8s），单击同卡：4.1s** —— 多点几次不是耐心问题，是把
  已经快完成的那次踢掉重来。加上行高亮只在 `playAll()` 之后才上，加载期间没有任何「已收到」
  的反馈，用户自然会再点。
- **修（手机档门控）**：
  - `playEvent` 拆成「合并壳 + `beginEventPlayback`」：同一 `eventId` 在加载中再次点击时只给
    一次轻触感并直接返回；**不同**事件仍然立即后来居上（R85 的甩选语义不变）。
  - 点中的行在**第一个 await 之前**就加 `.active`，不必等六路解码完；桌面仍在加载结束后标记，
    保持原行为。
- **验**：双击同卡 `loadEvent` 调用 **1 次**（此前 2 次），耗时 168ms（暖机）；不同卡中途插入
  仍是 2 次且后者胜出。真手指点一次即切事件：1.74s / 1.68s（冷热各一次），无需第二次点击。

### 回归

- `r169-verify.js` 10/10；`r169-tap.mjs`（真 `input swipe` + 真 `input tap`）7/7。
- 竖屏全量 **86/4**：4 条全部是 AVD 玻璃取色样本（`luma=0`、「交帧的路数=4 但没有一面挂
  url() 滤镜」，套件自己标注「不判」）；材质/解码路径本轮未改。
- 横屏全量 **34/1**：唯一红是本机 4:3 夹具下导出预览宽 240（<250），R139「预览保持原比例」为绿。
- 本轮 APK：`Tessera-1.2.272.apk` 28,429,327 B / md5 `b931b5d6db8e492e5736bfdfae377f71` /
  sha256 `7575504e4ec8a13c18c36caddd1eda04036f49be447596741a2a2caf984a2a59`。旧包全留。

# R170 — 缺口刻度可点了，而拖动仍归进度条（1.2.273）

R169 把刻度改成 `pointer-events:none`，拖动恢复了，但手指点缺口不再说明。回归方式不是把
R158 的“自己吞事件”搬回来，而是让缺口只当**目标**、不当**手势主人**：

- **命中**：大缺口恢复 `pointer-events:auto`，指头盒收进进度条自身的高度（`inset: -2px -6px`，
  21×18，不再像 R158 那样向上下各探出 12px 去抢画面上的触摸）。红点在 DOM 里后挂且同层
  `z-index:3`，仍在刻度之上。
- **手势**：缺口不再有 `pointerdown/up` 监听，事件照常冒泡给进度条；`pointerdown` 时只记下
  “这一下起于哪个缺口 + 起点坐标”，拖动、指针捕获、预览都走原路。
- **判定在松手**：移动超过 10px = 拖动（`onDrag` 清掉缺口标记）；没移动 = 点缺口 →
  `sayGap()` 弹说明并**跳过 seek**，进度条靠 `updateProgress` 回到真实位置；正在播的继续播。
- **去重**：手指释放（`stopDrag`）与随后可能合成的 `click`（TalkBack 也走它）都进
  `sayGap()`，600ms 内只说一次。

### 验收（1.2.273，模拟器真手指）

- `r170-verify` **5/5**：39 个缺口；点中刻度命中 `.gap-marker`；`::after` 为 `-2/-6`；
  在刻度上派发 `pointerdown` 后 `isDragging=true` 且 `scrubGapLabel` 已记录；`sayGap` 连调
  两次只出一条。
- `r170-tap` **4/4**：`input tap` 在缺口上 → 弹出「此处缺 6 秒（未录制）」，播放头保持
  0.56s（0.56→0.56）；同一像素改用 `input swipe` → 8% → 66%。
- `r169-verify` 10/10（缺口契约改为“事件必须冒泡到进度条”，170 点中 168 点命中刻度、
  2 点命中红点，无一处被吞）；`r169-tap` 7/7（换片/单击一次切换未回退）。
- 本轮只动时间轴命中与释放判定；排版、玻璃、扫描未改。APK：
  `Tessera-1.2.273.apk` 28,433,171 B / md5 `7776896c46d4005a1e92c49e446c5108` /
  sha256 `49b88777c8b070de7ea648d8d5203a7a986a698fdd48af8353cc77dfb9fe0f78`。旧包全留。

# R171 — 横屏筛选从「浮卡」改成抽屉右缘折出的整面（1.2.274）

用户原话：横屏中间弹出的筛选窗口和旁边的抽屉列表「有些割裂」，并希望把之前列出的其余优化一起处理。

### 1. 为什么割裂

R164 把筛选堆栈放在 `left: calc(100% + 8px)`：它是一个**独立圆角卡片**——自己的 1px 边框、
`--r-card` 圆角、`0 16px 40px` 大阴影，和 312 宽的平铺抽屉之间还留 8px 缝。两块面材质不同、
边缘不同、顶栏各说各的，视觉上自然是两张卡。这一轮改成一张面：

- `.filter-stack` 在横屏手机档变成 `position:absolute; left:100%; top:0; bottom:0`，
  宽 **0 ↔ 340**、240ms 折出；无圆角、无阴影，只留一条 1px 分隔线。
- 327 行的抽屉头与筛选头**同高同内缩**（40px 动作 + `safe-top` + 4/4 竖内缩 + 1px 线），
  分隔线从抽屉横贯到筛选面。漏斗在展开时让位给筛选面的「收起」。
- 筛选面在抽屉盒**之外**，列表宽度/左缘/高度在展开前后逐像素相同（实测
  `311.238×214.470 → 311.238×214.470`）。抽屉头的 1px 线在收起态只是换成透明色，
  不是临时加边框，所以列表连 1px 的抖动都没有。

### 2. 面里有什么

- 头：`筛选` + 类型/结果数（`哨兵模式 · 827`，小字里去掉卡片用的 emoji）+ `重置` + `收起`。
- 类型：R118 的四段直选，横屏也拉满 316px（此前会被抽屉的 `align-items:center` 缩成 137）。
- 日期：输入框让位给 **chips + 日历**。chips 横向滚动、右端 16px 渐隐，日历按钮 40×40，
  flatpickr 以按钮为锚点展开（不再从 0,0 冒出来）；收起/关抽屉时日历一起关。
- 按天分布：最近 7 个**有录像的日期**，柱高按最大天数归一，柱上数字、柱下 MM-DD；
  日期筛选只影响列表，不影响柱状图（否则选了一天就看不到别的天了）。
- 来源：把 `#recentDirs` 变成纵向卡片（圆点 + 名称 + 右侧信息）。**当前来源显示的是本次扫描
  到的 mp4 总量**（`eventBytes` 求和），不是盘容量——应用拿不到卷的容量，编一个数字是假的；
  其他来源显示「切换」。
- 底：`827 条 · 327KB` + `已筛选` 标签；无筛选时 `重置` 置灰、标签隐藏。
- 内容高于 281px 时（412 高、77 头、54 底）body 隐藏滚动条、底部 16px 渐隐，
  滚到底渐隐自动撤掉——否则「来源」只露出一张卡会被当成只有一张。

### 3. 顺带处理的名单

- **换片 1–2s 空窗**：`playEvent` 在 250ms 后仍没完成时浮出 `载入中…` 药丸（12px 转圈 +
  文案，`role=status`、`pointer-events:none`）。正常速度不闪；同一事件合并不重复计时，
  不同事件接管计时，完成/失败/被取代都收回。
- **语言切换**：卡片、来源名、筛选摘要都在构建时落字，以前切语言只换静态文案。现在
  `setLanguage` 重绘已渲染的事件卡，并在重绘后把抽屉滚回原位；深度滚动时按页补建行，
  直到旧 `scrollTop` 可落位。日期 chips/来源名/筛选头也一起重建。
- **RecentClips 拆分**：已存在于 ⋮ 面板（`#recentSplitChoice`，一整个/按天/按段），本轮只
  加了回归检查，不重复造入口。
- **来源名**：`dirDisplayName` 之前只认 `/storage/...`，不认 `/sdcard/...`，于是卡片上写着
  「sdcard/TeslaCamR168」——一条路径，不是设备名。`/sdcard` 现按内置存储处理，显示
  「本机存储 · TeslaCamR168」。
- **字号审计**：折叠面里不可见的 `<button>` 会以 UA 默认 13.33px 进 R134 普查；给
  `.filter-sheet-action` 补了 `--fs-body` 基档。深色柱状图从 `--chip-media-soft`（深紫在深底
  几乎看不见）换成主题感知的 `--glass-tint-soft`，今日柱用 `--accent`。

### 4. 验证（1.2.274，模拟器 915×412 / 412×915）

- `r171-verify.js` **57/0**：抽屉 312、面 340×412、左缘 = 抽屉右缘（面自己的 1px 边框正好压在
  抽屉 border-right 上，无缝隙无双线）；展开前后列表几何逐像素相同；类型/日期/重置/收起
  全部联动；7 天柱状图数值与所选类型逐日相等；语言切换重建卡片且滚动位置保持；
  载入药丸 250ms 后出现、快速载入不闪、`pointer-events:none`。
- `r171-tap.mjs` **13/0**（真 `adb input tap`）：漏斗 → 340 展开；段 → 505→500；日期 chip；
  重置回 505；日历以 chip 为锚点打开（308×298）；收起 → 0 且 inert；再点漏斗再展开。
- 横屏全量 **32/3**：两条是 AVD 本轮不交纹理导致 `lens-on=0`（套件自己标「不判」）；
  一条导出预览 `正在取帧 0/1`、`cap=none`，是取帧没出首帧的夹具/解码器状态。R171 两条
  回归判据（整面几何、chips+日历替代日期输入）均绿。
- 竖屏全量 **88/4**：4 条全部是 AVD 黑帧（`luma=0`、无 `url()` 样本）造成的玻璃取色/退场
  判据；R134 四档字号、R118 卡片数、R171 新控件的隐藏态都没有红。R166 横屏 **13/1**：
  唯一红是「无位置行显示占位 = 0」——当前 4 条事件都有位置，样本里没有空行可判，不是代码。
- 截图：`devtools/r171-final-light.png` / `r171-final-dark.png`。

### 5. 交付

`Tessera-1.2.274.apk` 28,438,931 B / md5 `38a7c8d9f5e2ec3ad246c0370882d9b1` /
sha256 `d54fa3aac49fc176fd38a04b12691b2cdb4fde8fb9927c0b6a83559db2b7ca3f`。旧包全留。

# R171 热修 — 导入视频后 `event.segments.has is not a function`（1.2.275）

真机反馈：选择文件夹导入后，列表能出来，但顶部红条报
`Uncaught TypeError: event.segments.has is not a function @ script.js:15124:29`。

### 根因

R168 的渐进预览把「累加器」和「已定稿事件」当成了同一个对象：

1. `addFileToEventMap` 把文件塞进 `event.segments`（**Map**，按秒键）；
2. `renderScanPreview` 为了画预览调用 `finalizeEvent(event)`，而 `finalizeEvent` 的第一行
   把 `event.segments` 改成**排序后的数组**；
3. 下一批流式文件再进同一个事件时，`event.segments.has(...)` 对数组调用 —— 真机大目录
   （第一批 240 个文件之后还有批次）只要一个事件的 6 个文件跨了批边界就必崩。

模拟器上 505 事件、3 批的目录也能稳定复现：预览先出 381 条，随后报同一行。

### 修法

- 预览累加器永远保持 Map：`finalizeEvent` 只作用在**显示副本** `{...live, segments: Array.from(live.segments.values())}` 上，
  副本进 `preview.view`，累加器 `preview.map` 不再被定稿。`eventGroups` 拿到的是副本，
  不再与累加器共享 `segments` 类型。
- 顺带修同一流程里的第二个洞：`loadTauriDirectory` 的「目录未变化」快捷路径用
  `eventGroups.length > 0` 判断，而流式扫描期间 `eventGroups` 是**部分预览**；
  签名匹配时会直接返回，把预览留在屏上（实测 381/505）。现在在扫描开始前记下
  `previousListWasPreview`，只有**扫描前已是完整列表**才允许走快捷路径；
  走的时候把 `previousGroups` 放回去再 `filterAndRender`，不会留下部分列表。

### 验证

- `r171-preview-split.js` **8/0**：把一条 4 路事件拆成 2+2 两批，中间强制渲染预览；
  第一批后累加器仍是 Map、显示副本是数组且不与累加器同引用；第二批不抛错，
  累加器 Map 收齐 4 个文件，显示副本仍是 1 段。
- `r171-refresh-guard.js` **2/0**：伪造「预览 + 匹配签名」时不会被当成未变化而跳过
  （重建回完整列表）；已经完整且签名相同的列表仍走快捷路径，`processFiles` 调用 0 次。
- `r171-verify.js` **57/0**、`r171-tap.mjs` **13/0** 在 1.2.275 上复跑未退。
- 1.2.274 含此缺陷，已被 1.2.275 取代；1.2.274 的 A+B 筛选面视觉与判据不变。

### 交付

`Tessera-1.2.275.apk` 28,439,507 B / md5 `d97d40dc999be1d1974b85614ce95ebb` /
sha256 `fa69d018818b2195edcd78240dc3373adad81aa0eb8cb37d7c586c4ad3b16a1f`。旧包全留。

# R171b — 横屏日期日历被屏底裁掉（1.2.276）

真机截图：横屏打开筛选面的日历，只看到月历前 5 行，最后一周和底边被 412px 的屏底切掉。

### 根因

flatpickr 以日期 chip 为锚点往下展开：chip 在 y≈155，日历高 297.5，底边 494.8 > 412。
横屏整屏只有 412 高，chip 上方 155、下方 175，**两边都放不下 298**，所以它的 auto 翻转
也没有可用分支，只能从下方溢出。

### 修法

横屏手机档（`html.touch-ui` + 同一组 phone media query）把日历改成**居中浮层**：

- `position: fixed`、`top/left: 50%`、`translate(-50%, -50%)`，`right/bottom:auto`，
  覆盖 flatpickr 写下的内联锚点；
- `max-height: calc(var(--viewport-h) - 12px)` + `overflow-y:auto`，更矮的横屏也不裁；
- 隐藏 `::before/::after` 箭头（居中后没有可指向的锚点）；
- 竖屏与桌面不命中，仍贴着日期框展开。

### 验证

- 实测 915×412：日历 **304,57 / 308×298 / bottom=355**，四边都在屏内；截图
  `devtools/r171b-calendar-sheet.png`。
- `r171-tap.mjs` **14/14**：新增「横屏居中而不是贴 chip 上下」与「完整落在屏内」两条；
  漏斗/段/日期/重置/收起全部未退。
- 1.2.275 的跨批与刷新守卫回归（8/0、2/0）与 R171 套件 57/0 不涉及本 CSS，仍成立。

### 交付

`Tessera-1.2.276.apk` 28,439,823 B / md5 `23e34d7925b3d4b8d313136e88a36536` /
sha256 `5f256dc27bf818e338dcac41f67918651990e21bfba8944ca75e08c9ae6b2f43`。旧包全留。

# R172 — 横屏日历与筛选面的收尾七条（1.2.277）

用户问「还有哪些没优化」。这一轮先把上一版（R171/R171b）留下的、**能在这台 AVD 上实测复现**的
东西全部量了一遍：`devtools/r172-probe*.js` 在 1.2.276 上跑，六条复现、两条被推翻，然后按
「先写判据→红→改→绿」的顺序落地。判据基线：**同一份 r172-verify.js 在 1.2.276 上 9/19 红**。

### 1 · 日历不是返回层栈的一层（真机可复现的路径）

`phoneLayerCount()` 只数 modal / contextCard / ⋮ 菜单 / 抽屉 / 全屏，flatpickr 挂在 `<body>` 上
不在其中。实测（抽屉+整面+日历都开着）：`layers=1`，按一次返回键 → **日历和抽屉一起收掉**
（`toggleSidebar(false)` 里那句 `flatpickrInstance.close()` 顺手带走了日历）；抽屉本来就收起时
`layers=0`，返回键直接退出 APP 而日历还挂在屏上。

改：`phoneLayerCount()` 加 `flatpickrInstance?.isOpen`，`closeTopLayer()` 第一层就是关日历；
`syncPickerScrim()` 里补 `syncBackLayers()` —— 原生只在被告知「有层」时才消费返回键，而
`startLayerTracking` 的观察对象不含日历。

### 2 · 居中浮层没有底、也没有关闭把手

R171b 把日历改成居中以后，它既不像浮层也没有可点的地方。新增 `#pickerScrim`
（`.container` 内、`#overlay` 之后）：只在横屏手机档 `display:block`，`inset:0`、
`rgba(0,0,0,.44)`、`z-index:99998`（日历 99999 之上仍可以点），点它 = `close()`。
真按返回键 / 真点遮罩各一条判据，抽屉都不动。

### 3 · 日历选的日期在横屏「看不见」

横屏把日期输入框让位给了 chips + 日历（R171），但 `renderDateChips()` 只列前 8 天：
实测选 `2026-08-06` → `chips=[全部日期, 09-01]`、点亮数 0、输入框 `display:none` ——
列表空了却不知道被什么筛住，只能按「重置」把类型和搜索一起清掉。
改：选中日期不在 8 天里就补一格（标签用完整 `YYYY-MM-DD`），并 `scrollIntoView` 把它滚进
可见范围（只在补格那一次滚，不跟手动横滑抢）；再点它即取消（沿用「点已选中的那格=清除」）。

### 4 · 载入角标落在筛选面上，不在画面上

角标 `position:absolute; left:50%` 的宿主是 `.main-content`，而它铺满整屏（抽屉浮在上面），
所以中心 457.5 一直是**视口**中线。整面开着时画面列是 652..915（中线 783.5），角标偏左 326px。
改：`positionClipLoadingBadge()` 在横屏手机档按**类名 + 计算宽度**算列左沿（`collapsed` /
`filters-open` + `getComputedStyle().width`），不用 rect —— 点卡片这一下同时收起抽屉，
250ms 后量到的 rect 还在动画中途（实测会把角标摆到 577 而不是 457.5）。竖屏不命中，仍走 CSS。

### 5 · 面内三段被自己的左边框裁掉 0.762px

`.filter-stack` 是 `border-box`，展开时 `border-left:1px`（DPR 2.625 下 0.7619px）把内容盒压到
339.24，而三段仍按 `--sheet-w`=340 定宽（那是为了折出时文字不跟着动画重排）。实测
`child.right=652.00 / stack.right=651.24`。改：展开态 `box-sizing:content-box`，
行的宽度不动、动画期不重排，面只多出一条发丝线（340 → 340.76）。

### 6 · 底缘渐隐在展开后是失效的

`has-more` 只在 `updateFilterInsights()` 的 rAF 里算。抽屉收起时整面 `display:none`（clientHeight=0
→ 判为「没有更多」），再打开而没有任何筛选变化时没人重算。实测：展开后 `scrollHeight 433 /
clientHeight 281`（152px 折不尽）而 `has-more=false`、`mask-image=none`。
改：展开后补一次 `requestAnimationFrame(updateFilterScrollFade)`，并给面体挂 `ResizeObserver`
（开抽屉、折面、旋转都改它的盒子）。

### 7 · 日历里「今天」那一圈还是桌面蓝

实测 `.flatpickr-day.today` 描边 `rgb(0,122,255)` = `--border-focus`，而同一屏的强调色是
`#5b4bf0 / #2210c5`（R120 收口时只重指了 `--bg-button` 与 `--accent`）。改：
`html.touch-ui .flatpickr-day.today { border-color: var(--accent) }` —— 只改这一处描边，
焦点环等其他 `--border-focus` 用户不动；桌面不在此选择器下。改后深色实测 `rgb(185,174,255)`。

### 被推翻的两条（写下来免得下一轮又捡）

- **「日历选中日还是默认蓝」**：不是。`--bg-button: var(--accent-solid)` 在手机档已生效，
  实测选中日 `rgb(91,75,240)`。
- **「流式扫描后『文件夹未变化』快捷路径失效」**：不是。扫完 `listIsPreview=false`，
  实测 1510 文件 / 505 事件下 `wouldFire=true`（签名与路径都对得上）。

### 验收

- `devtools/r172-verify.js` **29/0**，浅色、深色各跑一遍（同一份判据在 1.2.276 上是 9/19 红）。
- `devtools/r172-tap.mjs` **16/16**：真点漏斗 → 真点日历 chip → **真按返回键**（只关日历、
  抽屉与整面还在、`mCurrentFocus` 仍是本 APP）→ 翻到没录像的 2026-08-06 真点那一格 →
  chips 行出现并点亮 → 列表 0 条 → 再点那一格恢复 505/505。
- 回归：`r171-verify` 57/0、`r171-tap` 14/14（宽度判据从 `Math.round(w)===340` 改成
  `|w-340.76|≤0.5`，因为第 5 条给面加回了一条发丝边框）；横屏 `r102-verify-landscape`
  33/3、竖屏 `r102-verify` 87/5 —— 全部红项都是同一族 AVD 环境账（解码器不交纹理 ⇒
  `luma=37`、`lens-on=0`、导出预览「正在取帧 0/1」），R144/R146 已记过。
- 顺手修掉一条**判据自身的假绿**：R118「筛完屏幕上的卡片数 = SentryClips 事件数」在小夹具上
  恰好等于分页上限，换成 505 事件的目录后永远红。现在先把列表翻完（`drain()`）再比数，
  两条（筛选 / clearFilters）都真判到了。
- 角标那条不在真点击套件里判：AVD 的开机恢复会在选行之后才把某一片设成当前，
  手指落在「已经开着的那张」上时角标按设计不该出现 —— 判据改由 r172-verify 走
  `armClipLoadingBadge()` 真实路径，双主题各测一次。
- 截图：`devtools/r172-sheet-light.png`、`r172-sheet-dark.png`、
  `r172-calendar-scrim-light.png`、`r172-calendar-scrim-dark.png`。

### 交付

`Tessera-1.2.277.apk` 28,442,771 B / md5 `81e7e7be3e2d99a79ad436ffb49264ae` /
sha256 `097b2043a91f52beac0ca258f87330b1b3a5d0addf897cc628fbd2b62a45f9b9`。旧包全留。

## R174 — 搜索框间距 / 筛选面数字归顶 / 交互动效（1.2.279）

### 一、横屏搜索框贴着横线（实测 0px）
`html.touch-ui .event-search-row` 在横屏档加 `padding-top: 6px`。改前量到 header 底边 77、输入框顶 83→77（同一像素），横线直接切在输入框上沿；改后 77/83，间距 6px，输入框仍是 40px，搜索行宽度仍是 311px（抽屉不因此变宽）。闸门是横屏手机档媒体查询，竖屏与桌面不动。

### 二、筛选卡片的数字只留顶部一处
- 删掉 `.filter-sheet-foot`（原先固定 30px 高，显示「N 段 · 大小」，同时顶部 `#filterCount` 又重复了数量）。
- 数量与体积合并进顶部：`筛选` | 居中 `505 条 · 1.5GB`（`#filterCount` + `#filterSize`，`.filter-sheet-meta` 绝对居中，实测 meta 中心 482 = 卡片中心 482，±3px 内）| `重置` `收起`。`已筛选` 标签跟着筛选状态。
- 正文高度 281 → 335px（+54：底条 30 + 去掉「显示」小标题 24）。来源卡片从「整块在折叠线下」变成上沿可见，其余靠滚动与折叠按钮。

### 三、交互动效（只在手机档，全部可用 `prefers-reduced-motion` 压平）
- chip / 日期 chip / 来源 chip / 更多来源：按压 `scale(0.96)`，120ms；颜色 160ms。实测 computed `transition-property` = transform, background-color, color, border-color, box-shadow；时长 0.12s/0.16s。
- 柱状图：填充与文字 180ms 交叉淡化。
- 来源展开：给 `#recentDirs` 挂 200ms 的 `is-animating`，chip 以 160ms 淡入上移，扫描/筛重重绘不触发。
- 只动 transform / opacity / 颜色，不碰布局；sheet 宽度折叠、抽屉位移、列表行、播放器 chrome 各自原有的过渡没有第二份。

### 四、判据
`devtools/r174-verify.js` 18/0（横屏 915×412）：间距 6px、底条不在 DOM、顶部数字说全、居中 ±1px、与标题/按钮不重叠、正文 335px、`已筛选` 跟状态、给了字节就写「1.5GB」、四条动效规则与 reduced-motion 兜底都在表里。
回归：`r173-verify.js` 40/0。
**未完成**：`r173-list-window.js`（10k 窗口判据）本轮在 3fps 的 AVD 上反复超时，`r173-tap.mjs`（真手指）也未跑；B5 的窗口化只有实现与先前基准（10k 中位帧 111ms）作对照，没有本轮判据。

### 五、用户报的「浅色首页底色变深」
同一目录、同一主题下逐像素对比 1.2.277 与 1.2.278 的竖屏首屏截图：区域均值都是 `227.8 / 232.5 / 243.2`，完全一致；CSS 侧 `body` 240,242,245、`playerArea` 白、`--glass-bg` rgba(255,255,255,.78) 两版相同。本轮没有改动首屏底色，需截图与对比版本再定位。

### 交付
`Tessera-1.2.279.apk` 28,444,755 B，md5 `7d4280cf0689f452c7564445193feb08`，sha256 `b4ed96adc0d803801878d986315e24f15254adc119a9309fa9d9b12902b9bc8f`。

## R175 — 筛选面一行化 / 类型条对齐 / 竖屏间距 / 浅色首页不压暗（1.2.281）

**横屏筛选面数字与标题分两行（真机）**
`#filterCount`+`#filterSize` 是绝对居中，`top: 50%` 量的是含安全区的卡片头，而标题/按钮在安全区**以下**那一行居中：AVD 上 meta cy=38 / title cy=52（差 14px），真机状态栏 45px 时看着就是独立一行。修法：`margin-top: calc(var(--safe-top) / 2)`，三者回到同一基线（实测 52/52/52，数字高 16 仍一行）。

**搜索框与类型条不在一条线**
筛选面正文上内距 8 → 4：类型轨道 81..125、内衬按钮 83..123，与搜索框 83..123 完全对齐（改前内衬按钮 85）。中途试过 6px：轨道对齐了，但内衬按钮仍在 85，判据量的是按钮，所以再退 2px。

**竖屏「搜索框 → 选择日期」比其它档宽**
搜索行自带 12px 下内距，和控件间距 8 叠加成 20px（框底 148、日期顶 168）。竖屏去掉这一段：三档实测 8/8/8。

**浅色首页压暗**
`.player-area.empty::before` 最底层原是 `linear-gradient(165deg, rgba(255,255,255,.05), rgba(0,0,0,.18))`——浅色下等于给整屏顶一层灰。浅色改成白纱（`.32 → .05`），深色保留原来那层（深色下压暗是对的）。

**判据** `devtools/r175-verify.js`：横屏 **8/0**（meta/title/reset cy 全 52；搜索框与内衬按钮同 83；上内距 4px），竖屏 **5/0**（三档 8/8/8；浅色纱末段 `.32 → .05` 无黑，深色保留 `rgba(0,0,0,.18)`）。回归 **r174 18/0、r173 40/0**。
浅色首屏像素均值（竖屏 412×915，画面区）：1.2.279 227.8/232.5/243.2 → 1.2.281 **240/242/245**（等于 --bg-secondary 底色，压暗那层没了）。

### 交付
`Tessera-1.2.281.apk` 28,445,263 B，md5 `4c8254afeb10a3820b68b979129fb9ba`，sha256 `f20dc72cc0d4485c8c17a7222ed61c5e6495052140b89de61f81e32d820857a5`。

---

# R180 · 缩略图慢：先量，量到的是一个洞（1.2.289 → 1.2.291）

真机报「有些视频的缩略图出来的有点慢」。AVD 的解码器比手机慢好几倍，在它上面量出来的毫秒数会指错修法，所以这一轮先把台账做进 APP，让它自己带数字出来。

## 量到的第一件事不是「慢」，是「永远不来」

AVD 上 60 行全部是 `complete && naturalWidth===0` 的 `<img>`：`thumb.png` 存在但 0 字节（车断电时写坏的典型样子），HTTP 回 200/0 字节，浏览器走 **`error` 不走 `load`**——而 R156 的真帧升级只挂在 `img.onload` 上。于是这些行**一次都没问过取帧**（`ask=0`），永远停在空盒上。这就是「有些」：有图的行正常，图坏掉的行永远不出图。

改法（只在手机档，桌面那行一直是个空盒、今天还是）：`img.onerror` 把死占位图摘掉、补回图腾，再把行交给取帧；取帧也失败的行落回图腾并记 `frameRefused`，不再挂着「还在等」。

## 分档：等待比解码还贵

抽屉打开、喂真素材之后（AVD，412×915，60 行）：

| 量 | p50 | p95 |
| --- | --- | --- |
| 排队 `queue` | 473 ms | 1914 ms |
| 解码 `native` | 98 ms | 1310 ms |
| 车拍图首屏 `ph` | 972 ms | 1791 ms |
| 行 → 第一张图 `first` | 972 ms | 1791 ms |
| 行 → 变清楚 `card` | 979 ms | 1796 ms |

`livePeak=2/2`：两个槽一直是满的，所以排队时间几乎等于「前面每一行的解码时间之和」——而排在里面的，一半是**已经有图、只是想变清楚**的行。据此把队列拆成两档：`urgent`＝这行没图，`normal`＝把已有的图变清楚（导出预览、胶片条也留在 normal，彼此顺序不变）。拆完同一台 AVD：`queueU=433/1045(n=33)` vs `queueN=4/3112(n=13)`——**没图的行 p95 从 1914 降到 1045**，代价是「变清楚」这一档的尾巴变长（`card` 的 p95 在满载时能到 20 s+，屏幕上一直有一张图在，不是空着）。

## 台账随诊断带出

`⋮ → 复制诊断` 里多一行（手机档才有；不含路径、URL、token）：

```
thumbs ask=46 hit=50 dedup=0 ok=12 fail=34 livePeak=2/2 legs=46n/34v qNow=0
queue=433/1914 queueU=433/1045/n=33 queueN=4/3112/n=13 grab=335/1310
native=98/1310 video=197/353 ph=972/1791 ph1=400 phFail=1844 card=979/1796 first=972/1791 n=240
screen=72r frame=8 photo=0 wait=0/0 glyph=64
```

真机报「慢」的时候，这一行就能分清是三件事里的哪一件：排队久（`queue` 大而 `native` 小）、解码久（`native` 大）、还是回落到 WebView 那一路（`video` 腿多、单腿 15 s 上限）。

## 判据与验收

`devtools/r180-verify.js` **18/18**（AVD 装机实测）：不留空盒（60 行＝8 真帧 + 52 图腾 + 0 空盒）、失败落回图腾、首张图每行只算一次、**队满时 urgent 先派发**（把 `MAX_LIVE` 冻在 0，先塞 normal 再塞 urgent，读实际派发序 `["U","N"]`——用时间戳判序在同一次同步循环里会相等，测不出东西）、同 key 再问走缓存、`livePeak ≤ 上限`。回归 **r171 56/0、r173 40/0**（横屏）。

顺带修了判据自己埋的两个雷：`r171-verify.js` 从 1.2.281 起就在**崩**（两条判据读 R174 删掉的 `filterSummaryCount` 页脚节点），崩掉的套件等于没在跑；`source cards are stacked rows` 读的是 C9 折叠后 0×0 的隐藏 chip——第一次我把它当成 R172 那 1px 边框改容差，是猜的，宽度读数证明是折叠，判据改成只量露出来的 chip。

**没验的**：AVD 的毫秒数不代表小米 14；`video` 回落腿在真机占比多少，要等真机诊断。B5 大列表跳滚留空白条另立一条（见记忆 R181）。

## 交付

- `Tessera-1.2.289.apk` 28,464,915 B，md5 `b51de4ff9fc233224e70bb46c2527bb8`，sha256 `8f2ba545f781163f6963d47d66d7f61c82a620953a7d2af5c8841e6b3d6b068e` —— 只有台账（基线包）
- `Tessera-1.2.290.apk` 28,465,363 B，md5 `e4a22fade651a224b087fa8d7c383b59`，sha256 `f6faf4ff6fb1c0d618369e220baca16a96d888abbcb3a69363ede8e63e101871` —— 死占位图交给取帧
- `Tessera-1.2.291.apk` 28,469,715 B，md5 `48707a29a3336d39b98d7777d7db5230`，sha256 `309af4bf215855ac4facb85bb52269482bc6e68f2b5cb1c670f76e682786f3b5` —— **本轮交付**：两档队列 + 失败落回图腾 + 分档读数

---

# R181 · 大列表的窗口搬得动了（1.2.292 → 1.2.294）

R180 清 B5 判据欠账时记下的 #464：3000 行一次跳滚回上方会留空白条。这一轮先量、再改，量出来的
不是「补齐不够快」，而是**同一个滚动偏移有两个所有者在补**。

## 1. 先量：逐帧打出来的三件事

`devtools/r181-b5-trace.js`（只测不改，1.2.291 上跑）——滚到底后把 `scrollTop` 一次设到 45% 深处：

| 帧 | scrollTop | listTop | 补白 | DOM 行 | 视口内空白 |
| --- | --- | --- | --- | --- | --- |
| 落点 | 99 900 | 2700 | 199 800 | 300 | 454 px（整屏） |
| +1 | 126 546 | 2340 | 173 160 | 660 | 454 px |
| +2 | 135 426 | 2220 | 164 280 | 780 | 454 px |
| +3 | 144 306 | 2100 | 155 400 | 900 | 454 px |
| 落定 | 153 186 | 1980 | 146 520 | 1020 | 0 |

- `scrollTop` 每补一次就正好涨 4440 px = 60 行 × 74，而补白同时缩 4440 ⇒ **`extendListWindowUp()`
  结尾那句 `container.scrollTop += added` 是在给「补白已经钉住的内容」再钉一次**。
- 落点从第 1350 件跑到第 2069 件（+53 280 px ≈ 720 件），中间 4–8 帧整屏空白。
- 再往顶端跳一次：DOM 涨到 1800 行、8 秒内没停手。

## 2. 改法：一段可以整体搬走的行块

DOM 只保留连续一段 `[listTop, listEnd)`，上下各一个 `.list-spacer` 按实测行距 `pitch` 补高，于是
事件 *i* 永远落在文档偏移 `i × pitch` 上 —— **建行删行都不动屏幕，所以任何地方都不需要补 scrollTop，
窗口也能直接搬到拇指落点**。滚动回调里只剩 `syncListWindow()`：视口跑出块的富余范围就补齐那一侧，
跑出得更远就整块重放（`placeWindow`）。补齐只补到视口两侧各 48 行的富余（上限 420 行），一次补满
420 行在 AVD 上要 6.3 s 连续主线程工作。

只作用于 `listWindowed()`（手机档 + 事件数 > 600）。≤600 的普通盘与桌面走的还是原来那条不带补白
的路径；用户实机那台 517 事件的目录根本不窗口化，一行代码都不会经过。

## 3. 过程中被自己的判据抓出来的另外两个洞

1. **重建块时先删行、后设补白**：中间任何一次布局读取（`clientHeight`、`offsetTop`）都会让浏览器把
   `scrollTop` clamp 到瞬时塌短的高度 —— 跳末尾实测差 216 行（判据「再跳回末尾还是最后一件」抓到）。
   顺序改成「先按空块设好两段补白 → 删旧行 → 建行」。
2. **Chrome 的 scroll anchoring 也在补同一个偏移**：把延迟补齐整个冻住再测，同一条件跑两遍、
   只翻 `overflow-anchor`（`devtools/r181-anchor-probe.js`）：

   | 起始 scrollTop | 默认（auto） | `overflow-anchor: none` |
   | --- | --- | --- |
   | 31 520 | 32408 → 41288 → 42176 → 51056 → 51944 → 60824 …（每帧 +8880，永不收敛） | 31520 十帧一动不动 |

   ⇒ 窗口化期间由 `ensureListSpacers()` 设 `container.style.overflowAnchor='none'`，非窗口化分支清回
   `''`。判据加一条「补齐不把视口拖走（scrollTop 停在赋值处）」钉住它。
3. 顺带：`render()` 现在按**当前滚动偏移**放置窗口（旧偏移会活过 `innerHTML=''` 重建），删除/筛选/
   换语言后首帧不再是一屏空白。

## 4. 判据与回归

- `devtools/r181-b5-window.js`（重写：只驱动 `scrollTop`，因此 1.2.291 与新包跑的是同一份）
  **红基线 13/18**：「深跳落在指过去的那件事」跑出 53 280 px ≈ 720 件、「深跳后 DOM 行数仍有界」
  1020 行、「跳到最顶端也不空白、不停手」顶行落在 1020 且 8 s 未停手。
- **1.2.294 竖屏 18/18、横屏 18/18**（行距 74 / 61 两种都过）：落点 `顶行=1350` 且
  `scrollTop 99900→99900`（跑出 0 px）、过程中最大空白 0 px、DOM 最多 120 行、每行 offsetTop 与
  index × pitch 偏差 0 px、跳顶端 907 ms 停手、跳末尾末行 = 第 2999 件。
- 目视：`devtools/r181-window-jump.png` —— 跳到的正是「8月31日 周一 09:30」（= 基准时刻减 1350 分钟），
  行连续、无空白条、卡片排版与常态一致。
- 回归：`r180-verify` 18/18（冷启动跑；紧跟在其他套件之后跑时「首张图每行只算一次」会因样本已耗尽而
  假红——判据不自己造前置条件）、`r171-verify` 56/0（**横屏**）、`r173-verify` 40/0（横屏）。
- 诊断：`⋮ → 复制诊断` 在窗口化时多一行 `list n=… win=…-… rows=… pitch=… sp=…/… sy=… sh=…`。

## 5. 交付

- `Tessera-1.2.292.apk` 28,468,239 B，md5 `f2c781d937b7d25d61348b2d0c444e4d`，sha256 `123af3beb712ee3b39f824d4ab77680e8f553d7c1a201ed1a56cdcfc300cc295` —— 中间态（塌短 clamp 与 anchoring 两条未修），被 293/294 取代
- `Tessera-1.2.293.apk` 28,472,019 B，md5 `b9b4b748f182449ad5ebc7ac5f4a7656`，sha256 `141564d0bfeb5e70602e6f3769609385380284e3b17186d15e5698294da9fa52` —— 补白顺序 + 补齐到富余，anchoring 未关
- `Tessera-1.2.294.apk` 28,472,339 B，md5 `fb9d9c0621369b95e177e1ba0ddd317e`，sha256 `409c57e332ae1e831192db9c416dc4b8221bed66b0318c679fc2f372f273201d` —— **本轮交付**：可搬动的行块 + `overflow-anchor:none` + 按当前偏移重放

## 6. #463 欠的三条验收（真手指 / 平板 / 竖屏全量）

这一节不改产品代码，交付包仍是上面的 `Tessera-1.2.294.apk`；改的全是探针。

- **`r173-tap.mjs` 真手指套：27 条判据 0 红**。它此前根本没跑完过 —— 一进来就 `TypeError` 崩在半路
  （崩掉的判据集等于没在跑）。四个都是探针自己的错：`tapCentre(funnel)` 把「已经算好的中心点」再加一次
  半宽 ⇒ NaN，漏斗从来没被点开；`r173-tap-state.js` 用 `getElementById('sidebar')` 取抽屉（页面上是
  `.sidebar` 类，没有这个 id）⇒ `drawerOpen` 白捡通过、`filtersOpen` 永远假；没有「抽屉开着」这一步前置；
  来源 chips 那两行要先滚进视口再量。修完 27/0，**没有产品缺陷**。
- **平板档 `r173-tablet.js`：10 条 0 红**。唯一的红「信息列左对齐」是判据只认 `text-align:start`，
   shipped CSS 写的是 `left`（两者在 LTR 同义），放宽成 `['start','left']`。脚本自带 trap，跑完把
  模拟器还原成 1080x2400/420dpi。
- **竖屏全量 `r102-verify`：92 条 0 红**（`na` 里写着「`solved=true bind=空`，未解过就不判」）。
  与历史基线 94/0 差的正是 **R120/R121 那两条「谁把白玻璃钉厚」** —— 这一拍玻璃解在薄档
  （`fill=rgba(12,12,16,0.57)`、`worst.cr=4.65` 已过 AA），没有任何墨去钉厚它，`binding.glass` 是空串，
  两条判据没有对象可判。它们过去被 `return` 字面量丢掉了（只挑 `pass/fail/cost/worst`），现在补了
  `na` 字段，92/0 不会再冒充 94/0。
- **横屏全量 `r102-verify-landscape`：36 条 0 红**，但先把两条**钉死夹具常数**的判据改成断言规则：
  - 「预览宽 ≥250」：同一构建同一份 CSS，只换素材就翻转 —— 2.22:1 的片得 `399x181`、4:3 的片得
    `240x181`（`devtools/r181-export-fit.js`）。改成「画框在所在栏里至少吃满一维 ≥0.85」，
    4:3 也得 0.93，而 R140 想守的那个旧值 `211x138` 算出来 0.71 仍然红。
  - 「两栏 split=1.6」：产品规则本身是条件式 —— `script.js:26273` 按 `planAspect>=1.8` 挂
    `.pe-wide-preview` 走 1:1。判据改成从**用户看得见的那个 W×H** 推期望档，并钉住「类挂不挂 ⇔ 比例」
    这一对。
- **AVD 素材账**（这一轮最贵的一课，写死在这里）：`TeslaCam` 是 magic+填充的假片（HTTP 206 但
  `error.code=4` 永不解帧）；`TeslaCamR168` 505 事件里 497 份 mp4 是 0 字节、剩 8 份是 1080x2400 的
  竖 `screenrecord`；`TeslaCamReg2` 4 事件 1376x1024；**只有 `TeslaCamReg`（3 事件 1280x576）能让
  竖屏「画面是横向的」和横屏预览两条一起成立**。跑全量前先 `loadTauriDirectory('/sdcard/TeslaCamReg')`
  + 点开一条非 RecentClips 的事件，读到 `videoWidth>0` 再开套件，并把 `tdashcam.autoNext` 置 '0'
  —— 真片只有几秒，播完自动下一个会跳到 0 字节那份。
- **仍未定账的一条**：横屏「29 行仍可点」在某一次跑里报 22 行落点到了面板外，但在同一实例上用完全
  相同的滚动写法复刻（`devtools/r181-hitloop-repro.js`，`sleep(0)` 与逐帧两种）稳定 29/0，之后两次
  套件也都 0 红。**成因未定**，按探针抖动记账，不算产品缺陷。


# R182 · 「最近」删不掉是设计，但那句话得说出来（1.2.295 → 1.2.297）

用户报障：「最近」栏目的片子删不掉，是不是专门这样设计的。

## 1. 是设计如此，规则只有一条

删除只允许**事件自己占一个时间戳文件夹**的场合：判据是片段所在目录名匹配
`EVENT_DIR_NAME`（`^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}`，`script.js:6247`），不匹配就
`eventDeleteTargets()` 返回 null（`script.js:20550`）。真机 U 盘的循环录像把每一分钟写成
`RecentClips/2026-10-27_10-00-00-front.mp4` 这样的**散文件**，全都住在同一个 `RecentClips/` 里 ——
「这个文件夹里的全部文件」＝这一整张卡（一天可 1431 片 × 80 MB），按「删一个事件」的语义删下去就是清盘。
所以两个入口都按这条规则收掉了动作：

- 左滑不挂红色删除按钮（`script.js:7047` 的 `makeRowSwipeDeletable` 挂在 `eventDeleteTargets()` 上）；
- 长按菜单里那行 `hidden`（`script.js:20459`，CSS 有 `.context-item[hidden]{display:none}` 兜住
  `display` 压过 UA 的坑）。

对照：SavedClips / SentryClips 每片一个时间戳文件夹，照常能删；把 RecentClips 也存成「每片一个文件夹」
的盘同样能删 —— 门控看的是**有没有自己的文件夹**，不是标签写着什么。

## 2. 真正的缺陷是「没说」

那句解释本来就有（`deleteSharedDir`：「循环录像共用一个文件夹，这里没有可单独删除的事件」），
但它挂在**被拒绝时弹 toast** 那条路上，而两个入口既然都藏好了，这条路永远走不到。
于是用户只看见"动作没了"，就像这次。方案二（用户拍板）：把这句话显示出来。

- 第一版放在筛选摘要处（`filter-sheet-body` 的第一个子节点）—— 真机截图看位置很怪：夹在搜索框与
  「选择日期」中间，而且贴抽屉左缘（文字左=0，上下每一行都在 14）。
- 第二版挪到**列表头顶**：DOM 里移到 `#fileList` 之前（`#fileList` 自己是滚动容器，所以说明不跟着
  滚走），`padding: 6px 14px 2px` 与卡片同为 14。桌面仍然看不见（门在 `html.touch-ui`）。

## 3. 判据 `devtools/r182-note.js`：24 条，三轮先红后绿

红账按轮记：首版 9 条红（全是「元素不存在」）→ 补「左缘」再红 2（`文字左=0 分段左=14`）→
补「位置」再红 4（`说明顶=160 控件底=392`）→ 1.2.297 **24/0**（`文字左=14=卡片左`、与首卡间隔 4px、
`说明顶=控件底=376`）。几条值得记的写法：

- **期望文案不写死在探针里**：套住 `showToast` 再调一次 `openDeleteConfirm(最近事件)`，拿拒绝路径
  真正弹的那句当基准 —— 这条判据守的是「摘要与 toast 同源」，探针里抄一份字符串就守不住了。
- **摘掉 `html.touch-ui` 后必须 `display:none`**（跑完立刻挂回去）—— 这是「桌面一字不改」的钉子。
- 反向两条：切到「哨兵」/「全部」就不许显示（混着能删的事件，说了会误导）。
- 两条防带歪：这一档仍然「左滑不挂删除按钮」「菜单删除行 hidden」。
- 位置判据要写「紧贴」：只断言「首张卡片在它下面」会**空过**（任何在它上面的元素都满足），
  补了 `cardTop - bottom <= 44` 才有约束力。

## 4. 夹具：这条只能拿散文件形状测

AVD 上新建 `/sdcard/TeslaCamR182`：`RecentClips/` 下 6 个散文件（`2026-10-27_10-00-00-front.mp4` 等，
`cp` 自真片）。旧的 `TeslaCamReg`/`TeslaCamReg2` 把 RecentClips 存成「每片一个文件夹」，
`dirTail` 是时间戳 ⇒ 能删，用它测这条会白捡通过。

## 5. 交付

- `Tessera-1.2.295.apk` 28,469,459 B，md5 `ba19115f712b2964e83d5306925ddae7`，sha256 `c2bb14a6afe504349e0c51e33e0ee9ea1d6515077a208f5f6d84871160a86805` —— 首版（摘要处，位置与左缘都不对）
- `Tessera-1.2.296.apk` 28,469,587 B，md5 `36fad8041ed55cd16a4d4bfe10726a93`，sha256 `5a2792b3cbd20d0d479b0dd6b34a163fd124ead89e7f7158569499d9e87defd2` —— 中间态（左缘修好、位置未挪）
- `Tessera-1.2.297.apk` 28,469,523 B，md5 `88ae4d59c61172a82350e9a8a8e312e6`，sha256 `cc93ca08a8a8f57c85a1acf9b6b0f0ae37d2009a0a3438c9c61f2ec0317a48b8` —— **本轮交付**：说明钉在列表头顶

# R183 · 字号普查的账其实没记全（1.2.298 → 1.2.299）

R182 那行抽屉说明装上后，竖屏全量从 92/0 变 91/1，红的是 `R134 每个手机面只剩四档字号`，
读数 `长按菜单:12.16px`。这条不是 R182 改坏的 —— 是 R182 把一笔从 R134 就欠着的账顶出来了。

## 1. 为什么会躲过四年判据：判据量的是「一块没有字的标题」

`r102-verify.js` 里那份普查只量 `textContent` 非空的文字叶子。而长按菜单这一面，判据是
**只挂类**开起来的（R117 A6 那段：`body.context-open` + `.card-context-menu.show`），
从不走 `showCardContextMenu(event)` —— 而标题格 `#cardContextTitle` 的字正是那条路填的
（`script.js:20460`）。于是标题永远是空的，`.context-title { font-size: 0.76rem }`
（`styles.css:5334`，12.16px）就永远是盲区。R182 的判据 `r182-note.js` 真开了一次菜单，
字留下了，下一遍全量才红。

- 先把状态清空再复现（`devtools/r182-blank-menu.js`）：清空后跑套件仍报 `长按菜单:12.16px`
  ⇒ 红是真的，且改判据后**套件自己能造出这个前置**，不再靠别的探针余温。
- 修法两半：判据侧改成走产品自己的 `showCardContextMenu`（`r102-verify.js:234`），
  样式侧 `.context-title` 并到 `var(--fs-meta)`=12px。这条规则在只覆盖手机档的
  `@media (max-width: 768px), … (hover: none) and (pointer: coarse)` 里（`styles.css:5048`），
  桌面读不到它，「桌面一字不改」自动成立。
- 装机实测（`devtools/r183-title-check.js`，竖屏 412×915）：
  `fs=12px 色=rgb(95,103,115) 框=17,440 379x30 墨宽=299/可用=379 不截字`，
  菜单行仍是 14.08 那一档；截图 `devtools/r183-menu-portrait.png` 目视通过。

## 2. 同一类洞的第二处：表单控件根本不在普查的节点清单里

标题那条是「字没填上」，还有一条更彻底的：**普查的节点选择器里没有 `input/textarea/select`**。
把这三类纳进去之后，判据一次报出四处档位外的字（`out.fontCensusWhere` 是这一轮新加的字段，
只报像素值不报「挂在谁身上」，查一次要半天）：

| 面 | 元素 | 改前 | 并到 |
|---|---|---|---|
| 抽屉 | `input.event-search` | 14.4px（`0.9rem`，`styles.css:618`） | `--fs-body` 14.08 |
| 导出页 | `input.pe-mark-name-input` | 13.44px（`0.84rem`，`styles.css:8119`） | `--fs-body` 14.08 |
| 目录浏览器 | `input.dir-path-input` | 13.12px（`0.82rem`，`styles.css:4176`） | `--fs-body` 14.08 |
| 导出页 | `input[type=range]#peWmScale` | 13.3333px（UA 默认） | **不算**：滑杆一个像素的字都不画 |

最后一条是判据自己的假红，所以 `TEXTY` 只放行会画字的控件类型（`text/search/tel/url/
password/number/email/date/time` + `textarea/select`）。

三条真缺陷里，`.event-search` 与 `.dir-path-input` 的字面值在**共享**规则里（桌面也读同一条），
所以不动那两行，改在手机档加一条 `html.touch-ui` 门控的并档规则（`styles.css` 末尾 R183 块）。
`.pe-mark-name-input` 本来就在手机媒体查询里，但它和上面两条并成一条更好读，一起收进去。

**先试装再构建**（`devtools/r183-try-rule.js`，往活包里注入同一条 `<style>` 量完就撤）：
搜索框 14.4→14.08、高度仍 44、宽 283；目录浏览器编辑态路径框 291×44、`scrollWidth 290 ≤
clientWidth 289+1`；`documentElement` 与 `.dir-modal-content` 都没有横向溢出（412/412、391/391）。
放大字号唯一的风险是把行撑破，这一步先把「撑不撑」量掉，构建那一趟才不白跑。

## 3. 静态那 51 条怎么对：CSS 里写了 ≠ 用户看得见

运行时账只覆盖「判据能填上字的面」，所以补了两支对账工具，一支不跑设备、一支跑设备：

- `devtools/r183-font-scan.js`：走 CSS 的块嵌套，把每条 `font-size` 字面量按「是否落在手机档
  媒体查询/`html.touch-ui` 里」分类，档位外（11/12/14.08/16）的手机档声明 **51 条**（去重后
  50 个选择器）。
- `devtools/r183-offtier-live.js`：把这 50 条逐个问运行时 —— 节点在不在 DOM、有没有字、
  这条声明赢没赢层叠、画没画。三分法：**真画出来** / **在 DOM 但这一屏没画** / **被后面的
  token 规则压掉或选择器已死**。

对出来的结论：50 条里只有 3 条当时真的画着字（`.camera-label` 11.2、`.video-card .thumb-emoji`
23.2、`.header-collapsed … .btn-icon` 15.68），前两条属于「压在画面上的注记」与 emoji 字形，
本来就在豁免族里；第三条是**探针的假阳性** —— `rect>0` 会把「在隐藏容器里但仍有盒子」的节点
算成画出来了，`.header-collapsed` 这一支在竖屏整块不可见。改成 `checkVisibility({
visibilityProperty, opacityProperty, contentVisibilityAuto })` 后重跑，这一条落回「没画」。

留在档位外、且判为**不动**的（写在这里是为了下次别再当新缺陷查一遍）：

| 选择器 | 值 | 为什么不动 |
|---|---|---|
| `.camera-label` | 11.2px | 画在格子上的相机名，属「画面注记」族（`--fs-cap` 注释里那族本来就豁免） |
| `.video-card .thumb-emoji` | 23.2px | 字形不是字，`fontSkip` 按 `emoji` 摘掉 |
| `.header-collapsed … .lang-toggle-btn .btn-icon` | 10.88px | 中/En 语言角标要塞进和 SVG 同一个 18px 盒子（`styles.css:7093` 的注释就是这条账） |
| `.stats-overlay` / `.phone-brightness-hud` / `.phone-feed-hud` / `.phone-gesture-hint` | 10~18.4px | 压在画面上的 HUD/浮层，同「画面注记」族 |
| `.route-map-title` / `.route-note` / `.route-legend` | 11.5~11.84px | 轨迹地图在安卓版已下线（R32-3），选择器是死的 |
| `.perm-banner` | 声明 11.52，实渲 12.48 | 被后面的规则压掉了 —— 静态值只能证明「写了」 |

## 4. 验收账（1.2.299，AVD `tdashcam_phone` 412×915 / 915×412）

| 判据 | 结果 | 说明 |
|---|---|---|
| 先红（清空现场后跑套件） | 87/3，红项含 `长按菜单:12.16px` | `devtools/out-r182-census-red.json`；另两条是 `src=video luma=0`（AVD 没交纹理，老熟人） |
| 扩展普查在 1.2.298 上 | `抽屉:14.4px \| 导出页:13.3333px,13.44px \| 目录浏览器:13.12px` | 三条输入框是判据自己报出来的，`fontCensusWhere` 直接点名元素 |
| 竖屏全量 `r102-verify.js` | **92/0** | 四面普查：抽屉/导出页/目录浏览器 = `11/12/14.08/16`，长按菜单 = `12/14.08`，`fontCensusBad=[]` |
| `r182-note.js` | **24/0** | 必须跑在 `/sdcard/TeslaCamR182`（散文件那盘）；跑在 `TeslaCamReg` 上 9/15 —— 那盘的「最近」有自己的文件夹，前置不成立时判据第一条就如实报死 |
| 横屏 `r102-verify-landscape.js` | **36/0** | 明细里带 `straysDismissed:["deleteConfirmModal"]` |
| 横屏 `r173-verify.js` | **40/0** | 真点击那一套 |
| 目视 | `devtools/r183-menu-portrait.png`（长按菜单标题 12px）、`r183-search-portrait.png`（搜索框占位 282/282 整字）、`r183-dirpath-portrait.png`（编辑路径框 291×44，与「进入」同行不撑破） | 改样式的账按 appearance 结，不只测状态 |

顺带清掉两笔探针的账：`r182-note.js` 取文案时若前置不成立会**真的把删除确认框打开并留在页面上**
（`z 2000` 全屏遮罩 ⇒ 下一支判据量到的整屏都是「被盖住」），现在取完就交还给产品关掉；
横屏套件开跑前也会主动收残留遮罩并记下收了谁。`29 行仍可点` 那条此前记过「复现不了的 flake」，
这次抓到了成因：**不是 flake，是上一支探针漏的遮罩**。

## 5. 交付

- `Tessera-1.2.298.apk` 28,469,651 B，md5 `c82a908204b21c5174c1b85d441621be`，sha256 `299559363b33103d4b1d5309c0f8e7b49eb7d4b253b5815055d9a3dc71e583d4` —— 长按菜单标题并档
- `Tessera-1.2.299.apk` 28,469,971 B，md5 `c874deff131efe0dbf12bf35b8526835`，sha256 `2abcdb5b7b3eb9ac30a0b2e5c2958aeb54d40c5cf09f166ef8fa4781e574908e` —— **本轮交付**：三个输入框并档 + 普查把表单控件纳进账内

# R184 · 长按菜单那行红读不出来（1.2.300）

真机 1.2.299 的诊断报 `subAa=1/worst=1.71`。这条账 R120 就写下了（「救不了的墨踢出约束之后，那支墨正
以 <4.5:1 画着」），但**只数不判**，而且没报名字 —— 于是查一次要现写一支离线探针。

## 1. 是谁：长按菜单最后一行「删除事件」的红

`devtools/r184-name-the-ink.js` 把求解器那套循环原样复算一遍（同一支 `contrastRatio`、同一个
`paintsOnGlass` 过滤、各面用自己那一组的 alpha），在 AVD 上点名：

```
长按菜单 .glass α=0.45  ink=255,69,58  cr=3.39  bestByAlpha=3.40  el=button.context-item  text=删除事件
```

真机那一拍 `backdropLuma=125`，AVD 是 254 —— 同一支墨，两个数。用产品自己的算式复算：
帧 125 → **1.76:1**（与诊断的 1.71 对得上），帧 30 → 1.08:1，帧 254 → 3.51:1。
`unsavableInk` 从 1 变 2 也是同一件事的另一面：越暗的画面，救不了的墨越多。

## 2. 为什么「改暗一点」和「钉厚一点」都不成立

`devtools/r184-red-math.js`（亮度权重用产品 `srgbLum` 那一套 0.2126/0.7152/**0.0722** ——
第一版误用了 0.299/0.587/0.114 的 luma 权重，整张表偏 0.1~0.5，作废重算。
重算后帧 125 = **1.71**、帧 254 = **3.39**，与真机 / AVD 两份诊断逐位对上，这才算对上了）：

| 墨 | 全画面范围里最好也只有 | 结论 |
|---|---|---|
| 现红 `255,69,58` | **2.91:1** | 钉到最厚也不够 —— 它是中等明度，压白底不够、压暗底也不够 |
| `#D70015` | 4.60:1 | 过，但暗帧要把玻璃钉到 **α 0.91** |
| `#B01E1E` | 5.88:1 | 过，暗帧要 0.80 |
| `#8C1414` | 8.06:1 | 过，暗帧要 0.67 |

而 α 是**三块白玻璃一起付**的（底部条 / 长按菜单 / ⋮ 面板同组）：帧 30 上从 .45 钉到 .72，合成底从
rgb(131) 抬到 rgb(192) —— 就是 R110/R122 一路在躲的那块「白板」。所以这不是「换个色号」能了结的，
要么换墨并接受它替别人做主，要么让这一行**不透过玻璃读**。

## 2b. 顺带查出来的第二处：弹层根本不在玻璃账上

`subAa` 只量那五面透镜，`--modal-panel`（浅色 `.96` 近不透明白）不在内。补一条判据
（`删除确认弹层里的字过 AA`）之后，第一版报 11 处不合格 —— 其中 9 处是**判据自己的假红**：
`backgroundColor` 是 `rgba(0,0,0,0)` 时我把 `[0,0,0]` 当成了底。改成「只有 alpha ≥ .5 的底才算」后，
真不合格只剩两处，都在这个破坏性对话框里：

| 位置 | 墨 / 底 | 实测 |
|---|---|---|
| `.delete-confirm-warn`「直接从存储盘删除，没有回收站，删掉就恢复不了。」 | `#ff9f0a` / rgb(254) | **2.05:1** |
| `.btn-danger`「删除」 | 白 / `#ff453a` | **3.41:1** |

两处都是「最该看清的字」压在最暗的一档可读性上。修法与 R114/R121 同一套路子（同色相压暗一档、
深浅主题各用一档）：警示字 `--modal-warn` 浅色 `#b45309`(4.98) / 深色留 `#ff9f0a`(7.93)；
删除按钮底 `#ff453a → #d70015`（白字 3.41 → **5.38**）。两条选择器都只在手机端的删除确认弹层里
（`.delete-confirm-*`），桌面读不到。

## 3. 本轮先交「让诊断自己说名字」

`glassState.subAaAt` 记下最低那支墨的 **所在面 + 墨色 + 当时真正写上去的 alpha**，诊断行变成
`subAa=1/worst=1.71~长按菜单 255,69,58@0.45`。视觉方案（② 浅红底 + 压暗红字 6.34:1 固定 /
④ 实心红底 + 白字 5.59:1 固定 / ③ 红压暗 #8C1414 暗帧钉到 .65）已经出成效果图等拍板 ——
按 R42 的教训，改样式这一刀不在拍板前落地。

## 4. 验收账（1.2.301，AVD 412×915）

| 判据 | 结果 |
|---|---|
| 先红（1.2.300，只有命名没有并色） | `删除确认弹层里的字过 AA` 红，明细 2 处：`delete-confirm-warn 255,159,10=2.05`、`btn-danger 白/255,69,58=3.41` |
| 竖屏全量 `r102-verify.js` | **93/0**（92 条老账 + 弹层这一条新账，`modalAa.bad=[]`） |
| 诊断命名 | `subAa=1/worst=3.39~长按菜单 255,69,58@0.45`（AVD）；真机同一条会带出 `worst=1.71` |
| 目视 | `devtools/r184-confirm-dialog.png`：警示行是暗琥珀、删除键是深红底白字，两句都读得出来 |
| 横屏 `r102-verify-landscape.js` | **36/0**（`915x412@2.625`，帧在交的时候） |
| 交叉验证 | 重算的对比度表在帧 125 = **1.71**、帧 254 = **3.39**，与真机 / AVD 两份诊断逐位对上 —— 这张表的数字可以直接用 |

横屏那一遍第一次跑是 35/1，红的还是 R119 那条抬层判据（`开=1700 摘后同帧=50`）—— 与 1.2.299 上同一件事
一模一样：**AVD 解码器不交帧（`src=video luma=0`）的那一排它会红**，把画面喂回去（`luma=189`）就 36/0。
这一条的判据依赖「摘类之后还有一帧可画」，在无帧状态下不可信；本轮不改它，只在账上标出来。

长按菜单那一行的红**没有**在这一轮改：它是「换墨（暗帧要把三块白玻璃钉到 .67~.91）还是换底（行自带不透明底）」
的设计取舍，效果图与四案数字已经出好，等拍板。诊断现在会自己报出它的名字与所在面。

## 5. 交付

- `Tessera-1.2.300.apk` 28,473,619 B，md5 `6538970c02739ca1d187f902ef03c710`，sha256 `3f5ef234ad5fc438afe0f4379dd6fa43642d547217bef8502043108b6d011dbd` —— 诊断点名（`subAaAt`）
- `Tessera-1.2.301.apk` 28,474,067 B，md5 `de5cf9797dc1dfc100cca981c4f356a8`，sha256 `92ae9871dcb386f1759ea2a5d951a902a5729879d19c7f93ff79d0f9034c4354` —— **本轮交付**：删除确认弹层两处墨并档（`--modal-warn` 浅 `#b45309` / 深留 `#ff9f0a`；`.btn-danger` 底 `#ff453a → #d70015`）+ 弹层 AA 判据

# R185–R186 · 2TB U 盘：入口别等扫描、删完别跳回开头、批量删除（1.2.302 → 1.2.305）

真机 1.2.301 的读数：`walk=285s` / `stat=118s` / 71157 个文件，**首条预览 95.6s**，
缩略图 normal 档排队 p50 163s。用户三件事：U 盘的入口出现太晚、删完列表跳回开头、想要批量删除。

## 1. 「最近目录」的 chip 选中即出现（1.2.302）

R143 当初把 `rememberRecentDir()` 放在**扫描成功之后**，理由是失败的目录不该占着「最近」的位置。
在 2TB 盘上这条变成了五分钟的空白：用户选完文件夹，抽屉里一直看不到这个盘。

改法：选中即写（chip 立刻可用），扫描没成功再撤回——只撤这一次新加的，本来就有的不动。
R143 真正要守的那条（`ANDROID_MEDIA_DIR_KEY` 决定开机恢复谁）没有动。

## 2. 删完留在原处（1.2.302）

根因不是删除逻辑：`render()` 第一句 `container.innerHTML = ''`，容器 `scrollHeight` 塌成 0，
`scrollTop` 被浏览器夹到 0 —— 重建再多行也回不去。语言切换那条路（R171）早就为此补了
`restoreListScroll`，删除这条没补。

只还原 `scrollTop` 不够：被删的那行在视口里时，下面的内容会整体上移一行。所以记**锚**——
第一张完整可见、且不在被删集合里的卡——和它在容器里的偏移；重建后按偏移放回。撤销走同一条路。

实测（`devtools/r185-scroll-chip.js`，30 事件夹具）：选中后 60ms chip 已在且已画出；
删视口下方第 3 张 → `scrollTop 1001.9 → 1002`，锚行偏移 **−36 → −36**；撤销后仍 1002、偏移 −36。**5/0**。

## 3. 批量删除（A 案：抽屉顶栏「选择」，1.2.303 → 1.2.305）

选择态：点卡=勾选（不播放）、顶栏「取消｜已选 N｜全选」、底部「删除 N」（0 选禁用）、
卡片右上角勾选圈（绝对定位，不动卡片栅格）。**没有自己文件夹的事件（循环录像）置灰标「—」，
点了给的是同一句 `deleteSharedDir`** —— 与左滑/长按同一条规则。

删除本身走**同一条链**：`confirmDeleteEvent` 认 `items`（单删时恰好一条），撤销条一次装 N 个事件。
实现里踩到两个真 bug，都是判据抓出来的：

1. **`eventAfterDelete` 删干净时返回 null**，而批量循环把 null 写回同一个数组，下一轮
   `findIndex` 就在 `null.eventId` 上抛。单删只有一轮，所以从没露过。→ 每轮 map 里判空并过滤。
2. **「原位置」是在删到一半的数组上算的**：第二条起下标整体前移，撤销时插回错误位置
   （判据：3 条只回位 1 条）。→ 先一次算完所有下标再动数据。

实测（`devtools/r186-batch-delete.js`，30 事件 + 散文件「最近」两份夹具）：**17/0** ——
入口/禁用态/勾选圈、点卡不播放、全选与全清、确认框「删除这 3 个事件？」、列表 30→27 且自动退出
选择态、撤销三条**全部回原位**、散文件那条 locked 且点不进选中集、单删/撤销仍成对。

## 4. 交付

- `Tessera-1.2.302.apk` 28,475,475 B，md5 `aa0602274c0094d2e6710ce38ab82959` —— chip 提前 + 删后原位
- `Tessera-1.2.303.apk` 28,474,579 B，md5 `bce4173d0607a188203c443722da49ea` —— 批删首版（有 null 崩溃，**不要用**）
- `Tessera-1.2.304.apk` 28,474,771 B，md5 `eddd358c6b37301ef459adbeb3b32726` —— 修 null 崩溃
- `Tessera-1.2.305.apk` 28,474,963 B，md5 `fc3904a17f9efbe617460e9c41d80c6d`，sha256 `8f89efcf679818e821c76408305ca8075b4dbacf37d349f647da7fffcb9e2d9b` —— **本轮交付**

## 5. 还没做的（2TB 那份读数里最值钱的三条）

`first=95614ms` 说明「首屏要等 95 秒」是下一个真正的体验问题；`walk` 里 41% 花在 stat；
缩略图 normal 档 p50 163s 是「升级档」在 2756 事件上的无底洞。方向：按事件目录逐个提交、
stat 延后到首屏那 12 条、升级档只排「可见 + 前后各 6 行」、启动先出 2757 条 sidecar 缓存。

# R187 · 危险行方案二：给它一条自己的浅红带（1.2.306）

用户拍板方案二。真机 1.2.299 的账：`subAa=1/worst=1.71~长按菜单 255,69,58@0.45` —— 白玻璃 α=.45 压在中灰
画面（帧 125）上，合成底 rgb(184)，`#ff453a` 只有 **1.71:1**；而这支色是中等明度，钉到最厚也只有 2.91，
所以「换墨」和「钉厚」两条路都堵死。

## 1. 改了什么

`html.touch-ui body:not(.dark-theme) .card-context-menu .context-item-danger`：一条**不透明**浅红带
`#ffedec`、字与图标 `#b01e1e`、左右各 6px 外边距 + 6px 内边距（图标仍落在其它行的 12px 左缘）、`--r-field`
圆角、`:active` 单独压一档。深色主题一个字没动（那里红字本来就有 5~6:1）。

## 2. 一条必须同时改的连带：别再让「小药丸上的字」替玻璃做主

`#b01e1e` 是「救得了」的墨（亮帧 6.85）。求解器原来拿**全部**墨算厚度，于是暗画面上它会要求 α=.80 —— 
那正是方案三的代价（三块白玻璃一起变板），而用户选的是方案二。

改法：`solveGlassAlpha(fill, bd, glassInks)` —— 只有**真的透过玻璃读**的墨才决定厚度。判别器
`paintsOnGlass` 本来就是为此写的（自己压在不透明底上、且底色与玻璃明显不同的字不算），`subAa` 也一直只数
这一批。判据 `r102-verify` 的「自适应透度仍然过 AA」同步改成同一口径，否则它会在一条贴不到玻璃的墨上变红。

## 3. 验收

`devtools/r187-danger-pill.js`，AVD 412×915，**5/0**：

- 底 `rgb(255,237,236)` 不透明、字 `rgb(176,30,30)`，**6.09:1**（与画面无关）
- 图标与字同色；危险行图标左 **29**，其它行也是 **29**；行高 **48 / 48**
- 玻璃账 `subAa=**0**`（原来那 1 条就是这支红）
- 目视 `devtools/r187-menu-pill.png`：浅红带贴住圆角、上下与相邻行留白一致
- 竖屏全量 `r102-verify.js`：**93/0**（含把「自适应透度仍然过 AA」改成同一口径之后）；诊断里 `subAa=0/0`、
  `unsavableInk=1`（验收侧 0/2 条），独立复算与诊断一致

## 4. 交付

`Tessera-1.2.306.apk` 28,475,411 B，md5 `12ee6a754a31222ff7d4ba99b353e6d4`，
sha256 `15fd5b5a9ff0c113771f0eddf97c615796a08c8926b903b8a24ef3e2ee2dd8b5`

# R188 · 2 TB 那盘的五个报障：方框、删完空白、刷新卡住、删除失败、滑深空白（1.2.307 → 1.2.310）

真机（1.2.306，`/storage/B086-9116/TeslaCam`，68,589 文件 / 2,699 事件）报五条。台架一律 412×915、
dpr 2.625，事件夹具 `/sdcard/TeslaCamBig`（900 个事件、空的 `-front.mp4`，够触发窗口化
`LIST_WINDOW_MIN=600`）。

## 1. 「删除事件」的浅红底是方框

R187 那条药丸只写了 margin / padding / 背景，**没写 `border-radius`**（注释里却写着它用了
`--r-field`）。`.card-context-menu .context-item` 把行圆角归零（特异度 0,2,0），浅红带四角仍是直角。
补 `border-radius: var(--r-field)`（12px），左右内缩 6px 与 16px 的菜单外圆角对齐。

判据 `devtools/r188-pill.js`：`borderRadius=12px`（= `--r-field`）、底 `rgb(255,237,236)`、
字 `rgb(176,30,30)`、行高 48；目视 `devtools/r188-pill.png`。

## 2. 删完之后整屏空白，「卡一下」才回来

不在删除、也不在锚，而在**事件永远不会来**：`render()` 第一句 `innerHTML=''` 把 `scrollHeight`
塌成 0，浏览器把 `scrollTop` 夹到 0；`restoreListScroll` 再设回 37000 —— 净位移 0，浏览器
**一个 scroll 事件都不发**，而窗口化列表正是靠 scroll 事件把块搬到视口位置。实测
`r188-delete.js`：删除后 `top=0/end=420`、`scrollTop=37000`、**90/90 帧屏内 0 行**。

两处一起改：

- `render(events, { keepScroll })`：在 `innerHTML=''` **之前**记下 `scrollTop`，直接按它摆窗口
  （只有带锚的调用方递 `keepScroll`，筛选/搜索仍回顶）；
- `restoreListScroll` 末尾对窗口化列表显式 `syncListWindow()` —— 语言切换那条路（R171）踩的是同一个洞。

实测（1.2.310）：删除后 `scrollTop 37000`、`top/end 440/560` 都不变，屏内 7 行连续（只少被删那张），
空白帧 **0**。

## 3. 下拉刷新容易卡住

2 TB 那盘一次刷新是 76 个 `scan-batch`，每个批次都按「当时的部分结果」整表重画一次，且没有锚；
最后扫描完再重建一次。屏幕上的列表本来就是完整的一份，等于被拆了 77 次。

改法：同一文件夹、屏幕上是**完整列表**时的下拉刷新不再走渐进预览（进度行留着，骨架行不铺）；
扫描结束后：指纹没变 → `filterAndRender({ keepScroll: true })` 留在原处并 toast「列表已是最新」；
有变化 → 刷前记锚，重建后由 `restoreListAnchor` 放回原处。

实测（1.2.310）：`renders=1`、`previewRenders=0`、`streamBatches=0`、`scrollTop 29600` 前后不变、
可见行逐条相同、`longMax=63ms`、全程 5.7 s（890 文件）。

## 4. 删太多会「删除失败」

三处都能让整批失败：

1. 原生 `deletePathsJson` 逐条要求「是已存在的文件」，**一条缺失就整批拒绝**（目录被别的程序清过、
   这一片本来没有 `thumb.png` 都算）；
2. 同一条路径出现两次（多批勾选重叠），第二次 `delete()` 必然失败 → 整批 `ok:false`；
3. JS 侧一次调用只有一个 3 分钟超时，两万多个 `unlink` 在 FUSE 上跑不完。

改法：缺失文件记进 `missing` 并跳过（**全是缺失**时回 `{"ok":true,"alreadyGone":N}`）；原生按路径去重；
JS 按 200 个文件一片串行发，每片 120 s 超时，失败片不连坐已删片；toast 计数把 `alreadyGone` 计进去
（行已经消失，「删除了 0 个文件」读起来像没删）。

实测（1.2.308，干净进程）：把事件唯一文件先 `rm`，再走产品删除链 → `{"ok":true,"deleted":0,
"alreadyGone":1}`、toast「已删除 1 个文件」、行移除。
**探针坑**：不能把 `window.__tdashcamDeleteResult` 置空 —— 那是原生回包的回调，置空会让回包永远
到不了，反而造出一次假「删除失败」（本轮第一次就是这么被骗的）；只能包一层再调用原函数。

## 5. 大列表往下滑很多，列表空一会儿才出来

两个每帧成本：

- `syncListWindow` 每次靠近边缘就固定再建 `LIST_PAGE_SIZE`（60）行 —— 一帧 60 张卡实测 100 ms 上下，
  快速甩动时连续触发；
- 「读前填充」每帧再补 12 张，跟滚动抢主线程（12 张 ≈ 20 ms，那一帧 45 ms、峰值 121 ms）。

改法：滚动中只补「缺到余量」的差额（`viewBottom - listEnd + 24`，上限 60）；读前填充改成
**停手 140 ms 之后**才跑；块只保留「屏内 + 两侧余量 + 8」行（以前要到 420 行上限才裁）；重画之后
不主动补读前量（`cancelWindowFill`），下一次滚动按需补。

实测（1.2.310，90 帧 × 150 px 甩动）：

| | 1.2.306 | 1.2.310 |
|---|---|---|
| 甩动中块内行数 | 300 | 112–120 |
| 一次甩动建的卡 | ~300 | 248–274 |
| 最长帧 | 551 ms | 104–497 ms（AVD 抖动大，同参数两次差 4×） |
| 平均帧 | 58.5 ms | 37–52 ms |
| 空白帧 | 0 | 0 |

结构性指标（块大小、每帧建卡数、视口始终有行）稳定；帧间隔那两列在 AVD 上噪声很大，不作验收判据，
真机以「滑到底有没有白屏」为准。

## 6. 真机诊断里还没闭合的一条：缩略图队列

同两份 1.2.306 诊断里 `thumbs queue=5233/18093`（拔盘后那份 `40604/53580`、`phFail=240`）——
帧缩略图的排队量远超事件数，说明**行被重建后又在为同一片重新要帧**，而迟到的回答不进缓存
（`dedup=88 / hit=133` 相对 `ask=623` 太少）。它不会让列表变空（视口由按需补行保证），但会占住
原生取帧线程和桥，是「卡一会儿」在真机上的另一半。下一轮先量：同一次滚动里同一路径被问了几次、
哪些回答因为行已移除而丢弃 —— 再决定是加队列上限还是按行取消。

## 7. 验收

- `devtools/r188-pill.js` — 圆角药丸（见 §1）
- `devtools/r188-delete3.js` — 深处删除：`blankWhileDeep=0`、位置与可见行不变
- `devtools/r188-fling2.js` — 90 帧甩动：块 ≤120 行、blank=0
- `devtools/r188-refresh.js` — 下拉刷新：renders=1、preview=0、位置不变
- `devtools/r188-missing-delete.js` — 缺失文件批次：`ok:true/alreadyGone:1`
- 回归：竖屏 `r102-verify` **93/0**（真片 `/sdcard/TeslaCamReg`；先前两次红是 0 字节夹具无纹理）、
  横屏 `r102-verify-landscape` **36/0**、`r186-batch-delete` **17/0**（撤销三条回原位）、
  `r185-scroll-chip` **5/0**（锚偏移 −36、撤销后 1002）

## 8. 交付

- `Tessera-1.2.307.apk` 28,475,475 B，md5 `38d8335b550df64dde20a05810077e90`
- `Tessera-1.2.308.apk` 28,477,139 B，md5 `2f283a98291e111baf1ca0c954946848`
- `Tessera-1.2.309.apk` 28,477,395 B，md5 `3981a1d91537413e7191c7fc932f0720`
- `Tessera-1.2.310.apk` 28,477,459 B，md5 `3ee3e0728726c9c387608cfba71e44b3`，
  sha256 `76ed6390b5bf86cc6e4d6e7cd3d54dc13d5d93910e92696aabf7efc1b05af739` —— **本轮交付**
- 构建坑：杀掉上一轮构建后 Gradle 守护进程还占着 `classes.dex`，R8 报 `FileSystemException`
  → `gradlew --stop` + 删 `app/build/intermediates/dex/universalRelease` 后重建。

# R189 · 熄屏/后台扫描，以及「视频一多就有概率卡死」（1.2.311 → 1.2.313）

真机 1.2.310 报两条；同批诊断里 `files=54927 events=2148`，且**没有 `scan last` 行** ——
`loadTauriDirectory` 一开始就把 `lastScanStats` 置空，说明取这份诊断时有一次扫描还没回来。

## 1. 熄屏 / 后台下扫不动

三件事叠在一起：

1. **后台定时器被节流到 ~1 次/秒**。扫描收尾有三处 `await new Promise(r => setTimeout(r, 0))`（映射
   5.5 万个文件每 500 一条、分组每 1024 一条、侧车每 500 一批）。前台这些让步几乎不要钱，后台
   5.5 万文件就是 110 + 54 + 12 ≈ **176 秒纯等待**。改成 `yieldToUi()`：可见时才用 setTimeout，
   不可见时用微任务（没有人要看帧，让步没有意义）。
2. **后台还在按批重画预览**。2 TB 那盘 76 批，每批一次 `filterAndRender`。`scheduleScanPreview`
   在 `document.hidden` 时直接不排期 —— 最终报告仍会把整表建好。
3. **扫描被系统掐掉后，页面永远停在「正在扫描」**。`recoverInterruptedScan()`：回到前台先问原生
   `scan_progress.running`；它说不在扫、这一页却还在等结果，就清掉骨架/转圈、提示
   「后台期间扫描被系统中断了，正在重新扫描…」并自动重跑一次（同一目录只重试一次，成功扫描后复位）。

实测（AVD，`/sdcard/TeslaCamBig` 888 事件）：开始扫描后立刻 HOME，12 s 后回来 —— `state=ok`，
扫描在后台正常收尾；模拟「页面以为在扫、原生已经不在扫」→ 15 ms 内清掉状态、toast 正确、自动重扫到 3 个事件。
**没做前台服务**：如果 OEM 把进程整个冻结/杀掉，扫描会暂停或作废，回前台时由上一步重跑（冷启动则由
「上次目录」恢复重扫）。要做真正的「锁屏也扫完」需要一个 dataSync 前台服务，那是下一轮的事。

## 2. 视频一多就有概率卡死：每建一张卡都遍历全盘

`eventDeleteTargets()` 为了把同一文件夹里的 `event.json` / `thumb.png` 也带上，每次都要遍历
**全部** `allFiles`；而它在卡片构建里逐张调用（决定要不要挂左滑删除）。实测（1.2.310，5.5 万个
合成路径）：**单次 25.6 ms**。建 12 张卡 = 0.31 s；一屏 120 行 ≈ 3 s；甩动时反复重建 —— 这就是
「视频多了有概率卡死」。

改法：一次建好的「目录 → 文件路径」索引（`fileIndex`/`buildFileIndex`），在 `processFiles` 里按
4000 条一片分片建（不产生长任务），之后每个事件只遍历自己那个文件夹（≈40 条）。

实测（1.2.313）：索引建好后 **0.006 ms/次**（约 4000× 更快），10 屏卡片（120 次调用）合计 **0.7 ms**；
索引首次构建 48–276 ms，但它在扫描尾部分片完成，不再落在列表刚出来那一拍。

## 3. 顺带补上的：下拉刷新「有变化」时也留在原处

1.2.309/310 只把「没变化」那条路留在原处（`keepScroll`）。带锚的那条路（`refreshAnchor` →
`handleFolderSelection({anchor})`）当时因为一次脚本编辑没落盘而**没有进包**，本轮补上。
实测：加一个新事件目录后刷新 —— 887→888 事件，可见锚行不变，`scrollTop 29600 → 29674`（一行 pitch）。

## 4. 验收

- `devtools/r189-recover.js` — 中断恢复：15 ms 清状态、toast、自动重扫成功
- 后台扫描：开始扫描 → HOME → 12 s → 回来 `state=ok`
- 55k 合成清单：`eventDeleteTargets` 稳态 **0.006 ms/次**（旧 25.6 ms）
- `devtools/r189-refresh-changed.js` — 有变化的刷新：锚行不变、位置保持
- 回归：`r188-delete3.js`（深处删除 blankWhileDeep=0）、`r188-fling2.js`（块 ≤120 行、blank=0）、
  `r186-batch-delete.js` **17/0**、竖屏 `r102-verify` **93/0**（真片）

## 5. 交付

- `Tessera-1.2.312.apk` 28,495,315 B，md5 `fae8010114a70563cba4bfa58ecd437b`（后台设防；索引改动随后取代它）
- `Tessera-1.2.313.apk` 28,495,571 B，md5 `3e174c94ca090ac9125151301305c645`，
  sha256 `c9206bb6ce734d2b3c768271127cbd31d09d3c7a2620042661d12639427e4d2d` —— 上一轮交付

# R190 · 扫描的前台服务 + 缩略图队列的裁剪（1.2.314）

真机 1.2.313 的诊断（62,585 文件 / 2,525 事件，USB 1.9 TB）。先读数据：

## 1. 这份诊断说了什么

- **扫描**：`wall=85295ms`，其中 `walk=69797ms`、`stat=24098ms`、`sidecar=14131ms`、`process=14654ms`；
  首个预览在 **29.5 s**；全程只有 **2 个 >50 ms 的长任务（最大 58 ms）** —— 主线程没有卡，慢的是盘。
- **缩略图**：`queueN=65163/83461` —— **等待 p50 65 s、p95 83 s**，扫描结束时 `qNow=149` 还在排队；
  `hit=0`（400 条缓存对 2,525 个事件等于没有）。屏幕上 60 行最终都有帧，代价是几十秒的排队。
- **列表**：筛选后 213 条，窗口 12 行，`render=5ms`。
- **播放**：`susp=5` —— 单路布局下另外五路是**挂起**的，所以它们停在 11.5 s 而前视在 55.6 s，不是漂移；
  `syncGuard refused=0`、`axis real=59.78 book=59.78`。`holds skip=no-metadata` 说明这些片段没有 SEI 遥测。

## 2. 扫描的前台服务（本轮新增）

2 TB 那盘首扫 85 s，用户插上盘多半就锁屏。普通后台进程在 Android 12+ 会被缓存冻结（MIUI 更早），
CPU 也会在熄屏后挂起 —— 走查停在半路，回来看到「没扫完」。导出那条路早有 dataSync 前台服务，扫描没有。

- 新 `ScanService`（`dataSync`，`IMPORTANCE_LOW`、静音、常驻、点通知回到 APP），频道 `tessera_scan`；
- 桥：`TDashcamNative.scanKeepAlive(active, text)`；JS 在 `loadTauriDirectory` 开始扫描时挂上、`finally` 里放下
  （只有最新那次扫描有权收）；`recoverInterruptedScan` 判定扫描已死时也会放下。

实测（1.2.314，AVD）：扫描中 `dumpsys activity services` 里 `isForeground=true`、`foregroundId=23721`、
`channel=tessera_scan`；扫描结束后 `ScanService` 记录消失。按 HOME 后进程 `curProcState=4`（FG_SERVICE），
不是 cached。`r102-verify` 竖屏 **93/0** 未受影响。

## 3. 缩略图队列的裁剪

`queue=65s/83s` 的来源不是解码慢（`grab=410/851ms`），是**排队的格子早已滚走**：一行被移出文档后，
它的取帧任务还在 FIFO 里排队，轮到它时仍然占一个解码槽。2 TB 那盘一次甩动能留下上百个这样的任务。

改法：任务带上它所属的格子（`box`），`drain()` 出队时若格子已不在文档里，直接丢弃并回 `null`
（不占解码槽、不计数）；行自己的回调因为格子已断开，既不会重问也不会画出东西。

实测（1.2.314，合成单元）：20 个「格子不在文档里」的任务 **1 ms** 全部回 null、`live` 始终 0；
一个真正在文档里的格子仍然拿到 **8,091 字节** 的真帧。

## 4. 还没做的（按优先级）

1. **缩略图缓存太小**：`CACHE_LIMIT=400` 对 2,525 个事件（每事件一帧）等于零命中。要么按「最近 N 屏」做 LRU，
   要么把帧落成缩略图文件再走 `thumb.png` 那条路 —— 后者能跨启动复用。
2. **首扫 85 s 里的 24 s stat**：可以按「路径 + 大小」持久化，重扫时跳过没变的文件；要先确认 U 盘在不同机器上
   同一路径的 stat 成本，别在慢盘上白存一份索引。
3. **后台插盘仍要等 WebView 醒来**：卷轮询是 JS，熄屏/被杀时不跑。要真正的「插上就发现」得在原生挂
   `ACTION_MEDIA_MOUNTED` 的 receiver（服务或 Activity 均可），再唤起通知。
4. **单路布局切相机时会跳一下**：另外五路是挂起的（`susp=5`），切过去从挂起点继续 —— 设计如此，但可以在切换动画里
   把「正在重新对齐」说出来。
5. **SEI 缺失**（`skip=no-metadata`）：这些片段没有速度/GPS 数据，行车数据卡只能留空；不是缺陷。

## 5. 交付

`Tessera-1.2.314.apk` 28,496,179 B，md5 `d1b589aa0c80db843c30f3b024599d45`，
sha256 `f826d72da768baceee026cee4ed00d549ca48f9f8fff97ae57911dc10fd6af75` —— 上一轮交付

# R191 · 缩略图缓存按字节 LRU + 二次扫描跳过 stat（1.2.315 → 1.2.316）

上一节列的两条欠账：① 缓存 400 条对 2,525 个事件等于零命中（`hit=0`）；② 62.5k 个文件的
`metadata()` 在 FUSE 上要 24 s。

## 1. 缓存：按字节记账 + 最近最少使用

- 预算从「400 条」改成 **12 M 字符**（一条 320 px 帧的 data URL 实测 8 KB 上下 ⇒ 约 1 500 行），
  下限 200 条；`remember` 维护 `cacheSizes`/`cacheBytes` 两个账本，超预算从队首淘汰；
- 命中即读：`get` 命中时把它删了再插回队尾，于是淘汰顺序是**最久没读**而不是最早写入；
- 诊断加了一列：`thumbs … cache=<条数>/<KB>K`。

判据 `devtools/r191-lru.js`（1.2.315/316 两种版本都跑过，AVD）：填满 1 500 条时 **12,000,000 字符**
正好等于预算；读过的第 0 条在再插 200 条后**还在**，没读过的第 1 条被淘汰，最新一条保留，
账本与逐条求和的字节数**相等**，命中路径返回的仍是 8 000 字符的真值。

## 2. stat 索引：同一路径默认尺寸没变

`scan_tree_with` 在**流式扫描**（手机）时加载一份「路径 → 字节数」：

- 位置：`app_cache_dir()/scan-index-<root 的 DefaultHasher>.tsv`，每行 `size\tpath`；
- 走查时命中就直接用，不再 `entry.metadata()`；没命中的照常 `stat` 并记进索引；
- 扫描结束（**未截断**才写）整份重写，于是删掉的路径自然消失；
- 桌面扫描（`scan_media_dir`）不启用：本地盘 `stat` 不要钱，不该为它引入一份可能过期的数。
- 诊断：`scan last … stat=<ms>ms/<n>skip …`。

**代价说清楚**：同一个路径被**就地改写**、尺寸变了，会读到旧尺寸，直到下一次全量扫描。车机不这么
写文件；这个数只影响列表上的体积和「释放了多少」。

实测（AVD）：

| 场景 | files | statMs | skipped |
|---|---|---|---|
| 新目录首扫（无索引） | 20 | 17 ms | 0 |
| 同一目录再扫 | 20 | 0 ms | 20 |
| 加一个文件后再扫 | 21 | 1 ms | 20（只 stat 新的那个） |
| 887 个事件首扫 | 887 | 302 ms | 0 |
| 同一目录再扫 | 887 | 2 ms | 887 |

体积与字节总数在三组里逐条相等；新增文件的尺寸（5000）也正确进了列表。

## 3. 一处自己的 bug（记下来）

1.2.315 第一次跑出来 `skipped=0`、`statMs=0`：计数器加在了 `ScanIndex` 上，读的却是
`ScanFiles.reused`（永远 0）。**「statMs 变成 0」看起来像成功，其实只有计数器在说谎** ——
这一条靠「再扫一次 skipped 必须等于 files」才抓得到，光看毫秒数会放过它。

## 4. 交付

- `Tessera-1.2.315.apk` 28,503,515 B，md5 `c300e307a38079d938c7aa878eba06ad`
- `Tessera-1.2.316.apk` 28,503,499 B，md5 `c5f41bf5fc8a41b623867bf8b4587f11`，
  sha256 `812b6cf5b1868e22273c646096270a8eef655d8567f42569f100ab41edbe4e0a` —— 上一轮交付

# R192 · 卷的插拔交给系统广播（1.2.317）

页面的卷清单是 JS 每 12 秒轮询一次 `/storage`。可 WebView 在后台/熄屏时被系统暂停，轮询不跑：
插上盘再回来，列表还是旧的，要等下一轮 —— 这正是「后台/熄屏下无法刷新插入的外接设备」的另一半。

## 1. 做法

- `MainActivity` 里 `registerVolumeReceiver()`：运行时注册
  `MEDIA_MOUNTED / UNMOUNTED / REMOVED / EJECT / BAD_REMOVAL`，`dataScheme = "file"`。
  **只能运行时注册** —— Android 8+ 的隐式广播限制不允许把这些写进 manifest；
- 收到挂载：先到 `volumeExecutor` 上探一层名字（`TeslaCam/` 或 `RecentClips/SavedClips/SentryClips`），
  不是行车记录盘就不打扰；
- **人在页面上** → 直接 `window.__tdashcamVolumeEvent('mounted', path)`，JS 立刻跑一次卷检查，
  并当这块盘就是屏幕上那份列表时自动重扫（省掉最多 12 秒的等待）；
- **人不在** → 发一条通知（频道 `tessera_storage`，文案随页面语言：`setUiLang` 落进
  SharedPreferences），事件记成 `pendingMountedPath`，`onResume` 时补发给页面；
- 拔盘只在页面可见时通知（后台拔盘不打扰，回来 JS 的轮询会清掉过期目录）。

## 2. 验收（AVD）

- `dumpsys activity broadcasts`：`ReceiverList{… com.tdashcam.studio …}` 挂着五个 action，说明注册成功；
- 切到别的 APP 后 `am broadcast … MEDIA_MOUNTED -d file:///sdcard/TeslaCamCold` →
  `dumpsys notification` 里 `channel=tessera_storage`、`id=23728`，标题「存储卡已接入」；
- 回到 APP：`onResume` 把待发事件交付给页面（计数 events=1 / checks=1），随后触发重扫；
- APP 在前台再广播一次：`events` 与 `checks` 各 +1，`loadTauriDirectory` 被调用（重扫当前目录）。

**边界**：接收器是运行时注册的，进程被杀之后自然收不到；那种情况仍走「启动时恢复上次目录」。
要连这个也覆盖，得用 manifest 的 `MEDIA_MOUNTED`，而 Android 8+ 不允许。

## 3. 交付

`Tessera-1.2.317.apk` 28,504,075 B，md5 `fe11a60d0c512d3cd0fd807dba9e2f80`，
sha256 `8e5a35f8d483ddb147e1cf8f61aea0ff6ffe7a64180234b3fcf022b03c6f5d15` —— 上一轮交付

# R193 · 帧落盘 + 进程被杀也能被插盘唤起（1.2.318）

上一轮列的两条尾巴：帧只在内存里，重启一次全部重解；接收器是运行时注册的，进程被杀就收不到插盘。

## 1. 帧落盘：`ThumbFetcher` 自己缓存

- 位置 `cacheDir/thumbs/<sha1(path|millis|width|len:mtime)>.jpg`，一条 320 px 帧约 6–8 KB；
- 请求先读盘，命中直接回 data URL；没命中才解码，解完顺手落盘；
- 键里带文件的**长度与 mtime**：同一路径被换成另一段片，不会继承旧画面；
- 目录上限 64 MB（≈8 000 帧），每写 200 条扫一次，按 mtime 从旧到新删（系统清 `cacheDir` 也不影响正确性）。

实测（AVD，真片）：
- 冷解一次 **666 ms**，写出 6 056 B 的 jpg；
- 清掉页面的内存缓存后再问同一帧：**44 ms**；
- **杀掉进程再启动**、再问同一帧：**7 ms**，返回的 data URL 与解码结果逐字符相同。

## 2. 进程被杀之后，插盘也能把 APP 带起来

`MEDIA_MOUNTED` 在 Android 8+ 不能写进 manifest，能写进去的是**USB 设备接入**：

- `<activity>` 增加 `android.hardware.usb.action.USB_DEVICE_ATTACHED` 的 intent-filter +
  `@xml/usb_device_filter`（只匹配大容量存储 class 8 / subclass 6 / protocol 80 或 0）；
- 于是插上记录仪盘（或 SSD）时系统会把 APP 拉起来 —— 进程死没死都一样；键盘、DAC、MTP 手机不匹配，不会误启；
- 已经在跑的情形仍由 R192 那条运行时接收器负责（更快，也不用等系统拉起）。

实测：`dumpsys package` 的 Non-Data Actions 里出现
`android.hardware.usb.action.USB_DEVICE_ATTACHED: com.tdashcam.studio/.MainActivity`；APP 正常启动与运行不受影响。

## 3. 交付

`Tessera-1.2.318.apk` 28,504,487 B，md5 `f665726cd964ce53ecfa1832c549dbb4`，
sha256 `fec25e5e192a102bd26bcc890f08b8475354571d9655db3ad5adbe39f7751598` —— **本轮交付**

回归：`r102-verify` 竖屏 **93/0**（57 s 跑完）；前端三份（`script.js` / `styles.css` / `index.html`）的 mtime
均早于 1.2.317 那次构建，`frontendDist` 直接指向 `../src`，所以本轮 APK 与 1.2.317 内嵌的前端逐字节相同，
这一轮只动了 `ThumbFetcher.kt`、`MainActivity.kt` 的 `by lazy`、manifest 与新增的 `usb_device_filter.xml`。

排查记录：第一次「超时」是 APP 不在前台（`cdp-eval` 直接报 `app is not running`）；第二、三次卡在
`Runtime.evaluate` 不回，查下来是模拟器上另一个第三方测试 APK（`com.liangqing.photos`）抢到前台并
force-stop 了我们（`ActivityManager: Force stopping com.tdashcam.studio ... from pid NNNN`）——WryActivity
一暂停 WebView 就冻住，CDP 自然永远等不到回话。此外这段时间模拟器自己重启过两次（开机负载 29）。
跑套件前先 `adb shell am force-stop` 掉那两个第三方包并确认 `topResumedActivity` 是我们，57 s 全绿。

# R194 · 目录清单缓存、首批 60、后台插盘即扫（1.2.319）

## 0. 先把「后台/熄屏扫描不行」量清楚

1.2.318 的真机诊断里 `native` 的 99% 是 `walk`（28.8 s / 43.9 s），`stat` 已经降到 72–80 ms —— 再往下
优化只能动遍历本身。而「后台跑不动」这个说法先在 AVD 上验一遍：

- 退到后台（HOME）后 8 s，250 ms 的 `setInterval` 照跑，只是被降到 ~1/s（20 个 tick）；
- 熄屏 19.6 s 里又走了 19 个 tick，进程仍在；
- 锁屏期间发起的一次 37 s 扫描**照常完成**：`done` 置位、5,971 个事件、`ScanService isForeground=true`
  （`dumpsys activity services`）、诊断里 `isScanning=false`。

所以 WebView 并没有「暂停就全停」。旧版真正的缺口是：**后台插盘只发通知、不把事件投给页面**，
页面根本不知道盘来了，回前台才补发、才开始扫。

## 1. 目录清单缓存（Rust `ScanIndex`）

- 索引文件换成 `scan-tree-<hash>.tsv`（旧 `scan-index-*` 不再读，读串了会把路径当尺寸），两种记录：
  `F<TAB>尺寸<TAB>路径` 与 `D<TAB>目录mtime<TAB>路径<TAB>名字<TAB>1|0…`；
- `read_children()` 先 `stat` 目录取 mtime：一致就整份复用子项清单，只有变了才 `readdir` 那一个目录；
- 失效与兜底：换盘/换路径是另一个索引文件；名字里带 TAB/换行的目录不缓存；截断的扫描不写索引；
- 实测（AVD `TeslaCamBig`，887 文件 / 891 目录）：
  冷扫 `wall 9,596 ms / walk 9,035 ms / first 2,120 ms / dirs 891 全未命中` →
  热扫 `wall 2,124 ms / walk 1,636 ms / first 392 ms / dirs 891/891 cached`（`skip=887`）。
- 代价写清楚：exFAT 的 mtime 粒度（~2 s）内**替换成同尺寸文件**不会被发现；首次更新后的第一扫照旧慢（建缓存）。

## 2. 首批 240 → 60

`SCAN_FIRST_BATCH_FILES = 60`（约 2–3 个事件）。1.9 TB 那盘的首屏原本要等 240 个文件（≈10 个事件、16.5 s）。

## 3. 后台插盘即扫

- `onVolumeMounted()` 在页面不可见时**仍然** `deliverVolumeEvent`（通知照发，那是锁屏时唯一提示）；
- 新增桥 `volumeHandled(path)`：页面接住后清掉 `pendingMountedPath`，回前台 `flushPendingVolume`
  不会再投一次、也就不会连扫两遍；
- 实测：HOME + 熄屏后 `am broadcast -a MEDIA_MOUNTED -d file:///sdcard/TeslaCamBig`（需 `adb root`），
  9.7 s 内页面起扫；回前台 `scans` 仍是 1。

## 4. 交付

`Tessera-1.2.319.apk` 28,512,711 B，md5 `91713aa0e89ba4098d34e406746ba56c`，
sha256 `72c9a57b53b23471a3ac338cc3373f8893f8096294589752db8823dc014bce0b`。
回归：`r102-verify` 竖屏 **93/0**。诊断的扫描行新增一段：`dirs=<cached>/<seen>cached`。

# R195 · FAT32 / exFAT 下的目录清单缓存（1.2.320）

缓存只依赖一个信号：**目录 mtime 变没变**。FAT 家族的时间戳规则与 ext4 不同，所以在 AVD 上各造一个卷实测：
`mksdcard` 生成 FAT32 镜像、设备自带 `mkfs.exfat` 生成 exFAT 镜像，`losetup` + `mount` 到 `/data/local/tmp`。

- **FAT32**：`mkdir e1` → 目录 mtime `:46`；`touch a.mp4` → `:50`；再 `touch b.mp4` → `:54`；`rm a.mp4` → `:56`。
  **增和删都会更新目录 mtime**；精度 **2 秒**（读数全是偶数秒）。
- **exFAT**：`:26.360` → `:29.580` → `:32.710` → `:35.840`，同样更新，精度 **10 ms**。

所以机制成立，两种文件系统都适用。唯一的窄缝是 FAT32 的 2 秒桶：目录若在**扫描前 2 秒内**被改过，
紧接着的又一次增删可能落进同一个桶、mtime 一字不差，缓存会把新文件挡在外面。对策是 `stamp_is_fresh()`：
mtime 距当前时刻不足 2.5 s 的目录这一次**不记账**（时间戳在未来的时钟回拨同样按新鲜处理），下一次扫描重读它。

时区不是问题：FAT 存的是本地时间，手机换时区会让未变目录的时间戳整体偏移 → 缓存判「变了」，
只会多读一次，是安全的失效方向，不会把旧清单当成新的。

FAT32 的其它事实（与缓存无关，但和这块盘有关）：单文件 4 GB 上限（特斯拉片段约 100 MB，不受影响）；
1.9 TB 的 FAT32 超出 Windows 自带格式化工具的上限，Linux vfat 能正常挂载与读写。

实测（AVD `TeslaCamBig`，1.2.320）：warm `dirs=891/891cached`、`walk 1,153–2,162 ms`、
首批 60 个文件 **418–900 ms**（240 个文件时是 2,120 ms）。回归 `r102-verify` 竖屏 **93/0**。

`Tessera-1.2.320.apk` 28,512,919 B，md5 `b77a0a9b3c6373fd1afce72614cc7660`，
sha256 `0cf4bbdfe09a9f9b6f520def44da98f020c750f5ce3f3b470ed92a49e77ce308`。

# R196 · 插盘自动刷新：三段计数 + 两条不依赖广播的信号（1.2.321）

1.2.320 的真机读数里扫描已经快了（`wall 8.1 s / walk 6.6 s / dirs 2496 全命中 / 首批 198 ms`），
但「熄屏、后台、插盘自动刷新」仍不触发。老诊断里没有任何字段能区分**广播没到 / 原生没交 / 页面没扫**，
所以这一轮先补证据，再补两条不依赖广播的信号。

## 1. 诊断新增一行

```
volume rx=<原生收到广播次数> auto=<JS 自动重扫次数> last=<native scan|poll scan|跳过原因>
     | rx=<原生> tesla=<探到 TeslaCam 次数> deliver=<交给页面次数> ack=<页面回执次数>
       last=<动作>@<几秒前> page=<页面是否在前台>
```

读法：

| 读数 | 说明 |
|---|---|
| `rx=0`（且 `boot ready=` 很小） | 系统广播没到，而且进程是刚起的 —— 插盘前 APP 已被系统/厂商省电杀掉 |
| `rx=0`（`boot ready=` 很大） | 进程活着但没收到 `MEDIA_MOUNTED`：ROM 没发或拦了这个广播 |
| `rx>0 tesla=0` | 收到了，但 `probeTeslaCamRoot` 没找到 TeslaCam |
| `rx>0 tesla>0 deliver=0` | 没有 WebView 可交 |
| `deliver>0` 而 JS 侧 `auto=0` | 页面收到了但没扫，`last=` 会写 `scanning` / `other-volume` / `debounce` / `no-current` |

## 2. 两条不依赖广播的信号

1. **轮询发现新卷**：12 秒一次的卷轮询原本只弹提示，现在只要这个卷包含当前目录就顺手重扫（`last=poll scan`）。
2. **卷从读不动变回读得动**：拔插快于一次轮询时，卷的 `path/fs/total` 一字不差、签名不变，能看见的只有
   「刚才 `probe_readable` 失败、现在成功」，这一条也当成盘回来了（`last=poll scan`）。

两条与广播共用 30 秒去抖；只有「屏幕上就是这块盘、且当前没有扫描在跑」才会触发，其余情况把原因写进 `last=`。

## 3. USB 过滤器放宽

`usb_device_filter.xml` 改成 `<usb-device class="8" />`：原来的 `class=8/subclass=6/protocol=80|0` 漏掉了
UAS 盒子（协议 0x62）。进程被杀后由系统拉起的那条路依赖它。

## 4. 实测（AVD，模拟广播）

- 前台：`rx=1 tesla=1 deliver=1 ack=1` → `last=native scan`；
- HOME + 熄屏：同样 `rx=1 … ack=1`，`page=false`，扫描在锁屏期间完成；
- 诊断行原文：`volume rx=1 auto=1 last=native scan | rx=1 tesla=1 deliver=1 ack=1 last=MEDIA_MOUNTED@17s page=false`。

`Tessera-1.2.321.apk` 28,513,647 B，md5 `93d9a8d6651e766fb53390b2e6332953`，
sha256 `d8a44ec774ef02ae452fd14b4c7e5aa2cf82174836c963ce01ce8c211c6b827f`。

回归：`r102-verify` 竖屏 **93/0**（干净重启后 78 s）。

# R197 · 插盘冷启动时页面还没有「当前目录」（1.2.322）

1.2.321 的真机诊断把链路说得很清楚：

```
volume rx=1 auto=0 last=native no-current | rx=4 tesla=1 deliver=1 ack=1 last=MEDIA_MOUNTED@61s page=true
```

广播收到了（`rx=4`）、探到 TeslaCam（`tesla=1`）、交给页面（`deliver=1`）、页面回执（`ack=1`），
唯一没发生的是重扫，原因是 `no-current`：**插盘把 APP 拉起来的那一刻，页面里还没有 `lastScannedPath`**
（还原上次目录的扫描还没跑完），于是被「当前目录必须在盘里」这条守卫挡掉了。

修复：`rescanIfCurrentVolume` 在没有 `lastScannedPath` 时改用记住的目录（`tdashcam.mediaDir`），
但只在**本次页面还没扫过**（`scanToken === 0`）时才补，避免和启动还原撞成两次扫描。

AVD 实测：把 `lastScannedPath=''、scanToken=0` 摆成冷启动形态 → 返回 true 并起扫（`last=poll scan`）；
同一页面扫过一次之后再摆 `lastScannedPath=''` → 返回 false，不补扫。

顺带回答一个现场问题：系统在插盘时弹「为 USB 设备选择一个应用」（ES 文件浏览器 / 特能行 / 特写），
百度网盘还会弹自己的授权框——它们争的是 **USB 设备句柄**，不影响我们按路径直读 `/storage/B086-9116`。
在系统弹框里选「特写」并勾「始终」，之后就不会再问，进程被杀时也由它拉起。

回归：`r102-verify` 竖屏 **91 通过 / 0 失败**（比平时少两项是两条「底部条」判据本轮底条不可见、
按判据自己的规则写成「本轮不判」，不是失败）。

`Tessera-1.2.322.apk` 28,513,839 B，md5 `a2896538a2d4aa53699d052a82824520`，
sha256 `a401b1cfc766638ddf71ed9fa611ecd2544337d46ba3f96fecce10d8cdaca54e`。

# R198 · 「拔掉再插回」也要走同一条重扫（1.2.323）

1.2.322 的三份诊断读下来：

- **①运行中插盘**：`volume rx=1 auto=0 last=native no-current | rx=1 tesla=1 deliver=1 ack=1 … page=true`。
  链路仍然全通，但 R197 加的 `scanToken === 0` 守卫把**拔掉再插回**一起挡了：拔盘时 `forgetRemovedVolumes`
  会把 `lastScannedPath` 清空，插回来就成了「没有当前目录」，而这时 `scanToken` 早就不是 0。
- **②③冷启动**：`rx=0`（原生一次广播都没收到）。盘在 APP 启动之前就已经挂好了，没有 `MEDIA_MOUNTED` 可收，
  靠「还原上次目录」的扫描把列表带出来——这是正常路径，不是缺陷。

修复：把「当前目录」从一个字段改成**三个候选**，任一落在挂载点里就算「屏幕上的就是这块盘」：

1. `lastScannedPath`：正在看的；
2. `volumeGonePath`：拔盘时被清掉的那个（新增，`forgetRemovedVolumes` 里记）；
3. `tdashcam.mediaDir`：记住的目录（冷启动用）。

`volumeSkipReason` 同步：只有三个候选都不在盘里才写 `other-volume`，`no-current` 这个状态从此不该再出现。

AVD 实测四种形态：拔插 → 起扫；冷启动 → 起扫；正在看 → 起扫；挂的是另一块盘 → 不起扫（`other-volume`）。
回归 `r102-verify` 竖屏 **93/0**。

`Tessera-1.2.323.apk` 28,513,967 B，md5 `e29370ec542623f713a2cbabbb15c354`，
sha256 `353006397b20ba83fa42c48672daefd776e79b723d17ef49a886a3134e9c9efc`。

# R199 · 同一次挂载内不再逐目录 stat（1.2.324）

1.2.323 的真机读数：`walk=9780ms dirs=2496/2496cached stat=78ms/61337skip` —— 按文件 stat 早就省掉了，
剩下的 9.8 秒**全部**是「问 2 496 个目录：你变了没有」（FAT32 + USB 每条约 3.9 ms）。

改法：

- 索引头一行 `V<TAB><st_dev>`：记下写索引时那块卷的设备号；
- 下次 `load()` 时若 **dev 相同**（同一次挂载）且没有脏标记 → `sealed`：`read_children()` 直接按路径取清单，
  **连 mtime 都不问**；
- 失效两条：① 重新挂载 / 换盘 → dev 变 → 不 seal，逐目录校验一次后重新封存；② 我们自己删过文件 →
  页面调 `scan_index_dirty(root)` 写一个 `<index>.dirty` → 下一次扫描退回校验，扫完 `save()` 顺手清掉标记。

代价写清楚：挂载期内**别的**有全盘权限的 APP 写进这块盘的文件，要等重新插盘才出现 —— 安卓上外接盘是
独占挂载，正常不存在这种写入。

AVD 实测（891 目录 / 887 文件）：校验 3,151 ms → 封存 **1,150 ms**；`scan_index_dirty` 之后 2,100 ms
（又校验一次）、再下一次 `sealed=1`。诊断的扫描行新增 `sealed=0|1`。回归 `r102-verify` 竖屏 **93/0**。

`Tessera-1.2.324.apk` 28,533,087 B，md5 `51efeb7f31fb697ab60ad8e301fb8f8e`，
sha256 `93b6519c12a0866d43b96d55da241d8b72dc2182d01e9513187e5127cd0ffc60`。

# R200 —— 「最近」里的大片要等一阵子才出画面

真机报障（1.2.325）：`RecentClips/2026-10-08_05-12-31` 这类大事件，点开后要等一阵子才出画面。
诊断里 `boot open=4219896 play=4235056`：**从点开到起播 15.16 s**。

## 根因（先量后改）

`beginEventPlayback()` 在 `loadEvent()` 之前 `await probeUnmeasuredClips(event)`，而
`probeUnmeasuredClips` 会为**事件里的每一段**调一次原生 `probe_durations`。RecentClips 的「一个事件」
是整卷 `RecentClips/` 按拆分策略切出来的，真机上就是 ~1 431 段；扫描的探测预算只有 200 个，
所以剩下 1 231 段全在打开时现场量。

AVD 夹具（1 502 段）上的实测：

| 测量 | 数值 |
|---|---|
| 300 个真 clip 的 `probe_durations` | 5,128 ms（**17 ms/个**） |
| 300 个 0 字节文件（纯 open/seek 开销） | 3,015 ms（10 ms/个） |
| 整事件 `probeUnmeasuredClips(1502 段)` | **15,913 ms** |
| 打开到第一帧数据（修复前） | **15,219 ms** |

用户真机 15.16 s ÷ 1 431 段 ≈ 10.6 ms/段，与 AVD 的每文件成本完全吻合 —— 这是「按段数线性增长」，
不是「文件大所以解码慢」。所以「视频太大」实际指的是「这个事件太长」。

## 改法（只动手机档，>60 段才生效）

- `probeUnmeasuredClips(event, { indexes })`：可以只量指定段；
- 打开时**只量这一跳要播的那一段**（`entryIndex`），其余保持 60 s 猜测 —— 标尺本来就是这么建的；
- `tapEntryIndex()` 恢复播放改成**按 clip 序号**定位（`savedClipPosition()`），不再依赖标尺秒数，
  所以不用先量完整条前缀；
- 画面起来之后（2.5 s 起，每 1.5 s 一批、每批 120 段）跑 `sweepRulerDurations()` 补量剩余段，
  每批完成后 `rebuildRulerInPlace()` 原地重算标尺（**不 reload、不 seek 正在播的画面**；
  正在 seek / 换段时跳过这一批，避免把「秒」目标落到另一段上）；
- ≤60 段的事件走原路径，一字未改。

## 实测（AVD，1 502 段夹具）

| 阶段 | 修复前 | 修复后 |
|---|---|---|
| 点开 → 第一帧数据 | 15,219 ms | **351 ms** |
| 点开 → 真正起播 | 21,064 ms | **1,315 ms** |
| 打开时被量的段数 | 1 500 | **1**（其余 1 116 个 0 字节占位本来也量不出） |

阶段计时（`loadEvent` 461 ms / `applyTapEntryPoint` 152 ms / `playAll` 1,110 ms）说明剩余时间都在
真正该做的那三件事上，而不是探测。

后台补测有效性：把 240 段临时指向真实文件后跑 `sweep`，386 → **626** 段被量出，标尺总量
1 136 → **908 min** 修正，全程 `isPlaying=true`、`front.currentTime` 继续推进。

回归：`r102-verify` 竖屏 **93/0**、横屏 **36/0**、`r185-scroll-chip` **5/0**。

`Tessera-1.2.326.apk` 28,534,811 B，md5 `af368b71540f7cd5dd6ed9d6b4a4b0a5`，
sha256 `7297e95fb1f97a4f852c4e69967bfcd69ee91765ee8269a52b1fe51055bcca18`。

# R201 —— 选择态拖选一批卡片

真机反馈：批量删除只能一张一张点，删得多时太慢。选择态里加「按住一张卡再拖」的画选。

## 做法（桌面不涉及，全部在触摸档 / 选择态内）

- `setupDragSelect()` 挂在 `#fileList` 上（委托），只在 `selectionMode` 里工作；
- **长按 180 ms 定锚点**，手指随后画过的行按「锚点→当前」连续区间取并集（并保留按下前已有的选择）；
- 按下后 10 px 内移动即取消长按 → 滚动列表，普通滚动一点没变；抬手后的那次 click 被吞掉（400 ms 窗口），
  不会把刚画的一行又反选回去；
- 画选中给 `#fileList` 加 `.drag-selecting`（`touch-action: none`），同一根手指就不会滚动列表；
- 手指停在上/下边缘 56 px 内自动滚（每帧 10 px），跨屏也能继续画；
- 循环录像（共用文件夹、不可删）画过就跳过，与单击、全选同一条规则。

## 验收（AVD，24 个事件的 SavedClips 夹具）

拖选判据 `drag-select` **10/0**：0→4 选中 5 个、卡片 `picked` 与 `aria-selected` 一致、标题「已选 5 个」、
删除键「删除 5」、抬手后的 click 不改选择、`drag-selecting` 已清、按下即划走不进入拖选、单击仍只切一张。

边缘滚动 `drag-edge2` **5/0**：底缘停留 scrollTop 0→99、跨屏后选中 11 个、顶缘停留回滚 900→868。

删除链：拖选 4 个 → 确认框「删除这 4 个事件？」/「4 个事件 · 28 个文件」→ 取消后选择仍在（**4/0**）。

截图核对：抽屉标题「已选 4 个」、四行紫色勾选、底部红键「删除 4」。

回归：`r102-verify` 竖屏 **93/0**、横屏 **36/0**、`r185-scroll-chip` **5/0**。

`Tessera-1.2.327.apk` 28,536,415 B，md5 `351b6da22a582c6cad0099e24c34927c`，
sha256 `5aa39a3afd584bc0eb3cf1039561711a58fbf6dae979eb06472496f5395916f8`。

# R202 —— GitHub 项目页从「改了什么」补成「这是什么」

本轮**不改产品代码**，只补仓库对外信息：`README.md` / `README_CN.md` 重写 + `doc/screens/` 七张真机（模拟器）截图 +
仓库 About 描述与 topics + 最新 Release 正文。版本号仍是 **1.2.327**，交付物与 R201 完全一致：
`Tessera-1.2.327.apk` 28,536,415 B，sha256 `5aa39a3afd584bc0eb3cf1039561711a58fbf6dae979eb06472496f5395916f8`
（GitHub 资产 `digest` 字段实测同值），故本轮**不重新构建**。

## 1. 为什么原来的页面不够用

旧 README 只有「上游署名 / 本分支改了什么 / 构建 / 目录」四段——那是写给**要看源码的人**的，
不是写给**考虑装不装的人**的。缺的正是决定装不装的那几件事：装到哪、要什么权限、能干什么、
出问题了往哪问。所以新版按「先给结论，再给证据」的顺序补齐：

| 新增段 | 补的是哪个问题 |
|---|---|
| 下载与安装（4 步 + 覆盖升级 + SHA-256） | 我上哪儿拿包、怎么升、怎么验 |
| 界面一览（7 张截图） | 长什么样 |
| 它能做什么（播放 / 数据 / 列表 / 导出 / U 盘 / 手机本身） | 值不值得装 |
| 5 分钟上手、手势一览 | 装完会不会用 |
| 手机与桌面的差异 | 上游用户最关心的「我熟的那个还一样吗」 |
| 权限与隐私（逐条权限给理由） | 「所有文件访问」这种敏感权限为什么要给 |
| 遇到问题 | 报障路径与要带的信息 |

打赏码继续留在最上方（R201 之后那次「没看到打赏码」的要求）。

## 2. 截图是量出来的，不是猜的

七张全部来自 `emulator-5554` 上的 `adb exec-out screencap -p`，CDP 只做状态设置：

| 文件 | 打开方式 | 画面里必须看到的判据 |
|---|---|---|
| `list.png` | `viewer.toggleSidebar(true)` | 7 张真帧缩略图已上屏、日期 chip「10-09」、来源「保存片段 · 1.3MB」 |
| `grid6.png` | `viewer.playEvent(id)` | 前视带触发描边 + 「手动」角标、左侧/右侧「无信号」、左柱右柱有帧 |
| `single.png` | `.view-btn[data-view="front"].click()` | 布局三档 + F/B/L/R/LP/RP 直选、进度条、倍速 1x |
| `select.png` | R201 拖选判据跑到中途冻结取证 | 「已选 4 个」+ 四枚勾选 + 「删除 4」 |
| `export.png` | 置 `clipModeActive` 后 `showPhoneExportModal()` | 「1 路 · 1600x720 · 00:02 · 约 759KB · 剩 7.4GB」 |
| `settings.png` | 底栏「设置」真点击（868,2233） | 播放起点/换段缝/最近片段三行直选 + 主题三态 |
| `about.png` | `viewer.openAbout()` | v1.2.327、上游链接、U 盘指南、Issues、打赏码 |

每张都回读截图核对过文字，不看 DOM 状态就算数（`feedback-verify-appearance-not-just-state`）。

## 3. 本轮踩到的模拟器坑（记进假信号清单）

- **第三方相册会抢前台并把我们的进程打成 `cch CRE`**：`com.liangqing.photos` / `com.zalbum` 在
  `pm disable-user` 之后仍然回到前台一次，导致两张截图拍到的是系统相册的「显示设置」页。
  改成 `pm disable`（不带 `--user 0`）+ 每次截图前 `dumpsys activity activities | grep topResumedActivity` 确认，
  才拿到干净的七张。R193 那条「跑前先确认前台」的判据同样适用于**截图**。
- **`settings put system user_rotation 3` 在 WebView 上没落**（横屏那张最终放弃），
  与 R143 记录的「只认 `innerWidth`」一致：量不到就不塞进文档。
- **导出页的合成预览在 AVD 上是全黑帧**（解码器不交纹理），所以 `export.png` 只用于展示上半部的选项栅格，
  README 里也没拿它当「导出效果」的证据。
- 素材是 `screenrecord` 出来的模拟器画面，所以缩略图与视频格子里是「APP 自己的列表」。
  因此 README 的截图段落第一句就写明**模拟器演示素材（非真实路况录像）**，避免被读成宣传图。

## 4. 仓库元信息

- About 描述改成一句能读懂的话：`特写 / Tessera — 在安卓上直接看 Tesla 六路行车记录仪：OTG 读 U 盘、六路同步播放、SEI 行车数据、剪辑与原生导出。Tauri 2 + Rust + Kotlin，桌面版 TDashcam Studio 的安卓分支（AGPL-3.0）。`
- topics 从 8 个补到 20 个（加 `mediacodec`、`telemetry`、`sei`、`autopilot`、`usb-otg`、`external-storage`、`sentry-mode`、`agpl-3` 等）。
- v1.2.327 的 Release 正文加了包名/体积/SHA-256 与「覆盖安装即升级」，再往下才是原来的 R201 技术说明。
- 渲染核对：`gh api -H "Accept: application/vnd.github.html" repos/.../readme` 里七张图的 `<img ... width="230">` 都保留，
  表格 + HTML 混排在 GitHub 上不塌。

# R203 —— 全面审计（六路并行）与第 1 批修复

用户要求「全面排查代码 / 功能 / 交互 / UI」。做法沿用 R143 / R147：**六路只读子代理并行**
（播放引擎与同步、手势与交互、列表 / 扫描 / 删除 / 持久化 / i18n、Rust 层、Kotlin 与导出、UI / CSS / 可达性），
共回 45 条候选；**我逐条回读调用链核实**，只把核实过的当结论，其余标「待实测」。
清单已交用户，用户拍板「请开始吧」⇒ 按批次推，本轮是**第 1 批**。

## 1. 第 1 批改了什么（五条，全部手机档门控，桌面一字未动）

| # | 位置 | 根因 | 修法 |
|---|---|---|---|
| 1 | `script.js:21521`（`flushPendingDelete`） | 删除的脏标记写给 `this.lastScannedPath`。撤销保险丝有 6 s，足够用户切到别的目录 ⇒ 真删的盘 A **没被标脏**、正看着的盘 B 被误标。A 的目录清单继续 `sealed`（`lib.rs:1081` 只写 `.dirty`），下次扫 A 连 mtime 都不问 ⇒ **已删事件回到列表、点开是坏文件，而且这次扫描会把这份幽灵清单原样存回去**（自我固化）。R143 已经给 job 记了 `folderPath`，撤销路径 [:21457](#) 正是用它挡「落错盘」，唯独这一行漏了 | 改 `job.folderPath \|\| this.lastScannedPath` |
| 2 | `script.js:21098`（`edgeScroll`） | 边缘自动滚每帧 `scrollTop ±10px`，不看时间差 ⇒ 60 Hz 是 600 px/s，120 Hz（小米 14）就是 1200 px/s。同一只手停在边缘，**刷新越快勾得越多** | 改成 `EDGE_SPEED = 600` px/秒，用 rAF 时间戳累加 `carry`，`dt` 封顶 50 ms（退后台回来不补一整段） |
| 3 | `script.js:21054`（`anchor`） | anchor 存的是 `lastFilteredEvents` 的**下标**，而扫描批次 / 换排序 / 改筛选会整表重排 ⇒ 下标指到另一条事件，下一步就是删除 | anchor 改记 `eventId`，每次 `paint` 前按 id 现算下标 |
| 4 | `script.js:6568`（列表 `render`） | 整表重画会摘掉手指底下那张卡 ⇒ 隐式指针捕获丢失，拖选再也收不到 `pointerup`，`drag-selecting` 挂着、`touchmove` 一直 `preventDefault` ⇒ **列表滚不动** | `render()` 开头 `this.viewer.cancelDragSelect?.()` |
| 5 | `script.js:19369`（下拉刷新 `touchmove`） | 一次「按住再拖」浏览器同时发 touch 与 pointer 两套事件；`pulling` 在 touchstart 就成立且没人复位 ⇒ 刷新转圈在手指底下胀起来，抬手**触发一次不请自来的重扫** | 拖选一旦 active，这一拉就地作废（复位 `pulling`/`distance`/spinner） |

## 2. 判据：`devtools/r203-verify.js`（先红后绿）

改前在 1.2.327 上跑，**五条 bug 断言全红、前置全绿**（不是判据没跑起来）：

```
RED G1 脏标记落在被删的那个根 = ["/sdcard/TeslaCamReg"]
RED G2 慢帧率下滚速没有按比例掉 = 16ms=311px/s 48ms=173px/s
RED G3 挤到前面的事件没被当成 anchor 勾上（3 条被误勾）
RED G3c 整表重画后拖选立即结束 = true/true
RED G4 拖选期间刷新指示器没有胀起来 = 34px / 抬手重扫 1 次
```

改后在 1.2.328 上 **12/0**：G1 变成 `["/sdcard/TeslaCamR203"]`；G2 16 ms=601 px/s、48 ms=512 px/s（比值 1.17）；
G3 选中集只剩 anchor 往下那 7 条；G3c `false/false`；G4 spinner 高度空、重扫 0 次。

G2 的判据写法值得记一句：**不去量真机帧率，而是自己 shim `requestAnimationFrame`**
（`setTimeout(cb, 16)` vs `setTimeout(cb, 48)`）量两种「帧率」下的 px/s。
按帧走的实现必然按比例掉，按时间走的不会 —— 这条断言与设备刷新率无关，AVD 上也能证。

顺带把 R201 的拖选判据收进仓库（`devtools/r201-dragselect.js`，上轮只在 /tmp 里跑过），
并把「夹具是 8 个事件」这类**写死条数**的断言改成与夹具无关。

## 3. 夹具与本轮踩到的坑

- 新增 `/sdcard/TeslaCamR203`（3 个 SavedClips 事件，0 字节 clip 足够列表与删除用）。G1 会真删一条，
  跑前补夹具的命令写在判据文件头。
- **`user_rotation` 要先关掉 `accelerometer_rotation` 才生效**：本轮两次「转不动横屏」都是这个原因
  （`dumpsys window` 里 `mDisplayRotation=ROTATION_0` 才看出来）。R143 那条「先回 0 再置 1」补上这一半。
- **第三方相册又抢前台**：`pm disable` 之后 `com.liangqing.photos` 仍回到前台一次，把横屏套件跑到一半
  冻成「timed out waiting for the WebView to answer」。每次跑套件的固定前置仍然是
  `am force-stop` + 确认 `topResumedActivity` + 记 `/proc/uptime`。
- **判据「基准：卡片有数据」把工具的失败记成了产品的失败**：我的探针把 `lastScannedPath` 换成了
  0 字节夹具，`r102-verify` 播的是「当前目录第一条事件」⇒ 没有遥测。改成跑前
  `loadTauriDirectory('/sdcard/TeslaCamReg')` 就回 93/0。**跑播放类判据前必须显式指定夹具目录**，
  别信上一个脚本留下的状态。

## 4. 装机验收（1.2.328）

`r203-verify` **12/0**、`r201-dragselect` **11/0**、`r186-batch-delete` **17/0**、
`r185-scroll-chip` **5/0**、`r102-verify` 竖屏 **93/0**、`r102-verify-landscape` **36/0**。

`Tessera-1.2.328.apk` 28,537,503 B，md5 `b39d65238ffe970fcd9cf313c10f760e`，
sha256 `9d6233b836de835124d423436a30033e150f328290799733414a34be71a3c8d5`。

## 5. 审计剩下的账（未开工，按批次继续）

第 2 批 R200 补量三条（`rebuildRulerInPlace` 没把尺交回播放器、会抹掉剪辑区间、速度曲线错位）——
**这条里含我自己的验收盲区**：R200 量的是 `event.*`，而指针 / 进度 / 纠偏读的是 `player.*`，
判据全绿而真时长其实没送到目的地。第 3 批扫描与删除的失败路径（catch 里 await 后不复查 token、
`scanPoll` 泄漏、`lib.rs` 白名单失败不回滚、`read_sidecars` 无上限）。
第 4 批原生生命周期（`startForeground` 未兜底、导出无墙钟看门狗、同步桥仍做 FUSE、`.part` 改名）。
第 5 批 UI（四处禁用态 `opacity`、目录浏览器不吃 `--kb-h`、32/40 px、`inert` 名单、玻璃采样白跑）。
未核实与已判「不采信」的清单在 `project-tdashcam-r203-audit` 记忆里。

# R204 —— 第 2 批：后台补量的尺交到谁手里，以及封存索引凭什么一直算「没变化」

用户回「请继续」⇒ 按 R203 的批次往下推。这一批把 R200 那套「先出画面、后台补尺」的账还清，
外加一条做夹具时**亲眼撞出来**的新缺陷（不在原 17 条里）。

## 1. 先红：1.2.328 上的读数

`devtools/r204-verify.js`（判据自己代答 `probe_durations = 42 s`，故意让补量的第一批失败一次）：

```
前置：播放器确实停在这个事件上              ← 绿
A5 拒绝之后还要问下一批 = 120              ← 红（只问出去一批）
A5 桥偶尔拒绝不该终止整轮 = 1/150           ← 红（只量到入口那一段）
A1 播放器实例看到的是改过的那一段 = 60        ← 红（该是 42）
A2 剪辑态下重建尺不冲掉入出点 = 0/30         ← 红（100/160 被 reseed 成「当前 ±30」）
A2 挡下的那次重建记成欠账 = undefined        ← 红
```

`devtools/r204-scan-cache.sh` 三条全红：`sealed=true / 20 段旧事件 / loaded=false`，
下拉刷新和普通扫描交出**一模一样**的答案。

**判据本身也返工过一次**：A1 原来那三条在 1.2.328 上是绿的 —— 因为补量整个停在第一批，
`event` 和 `player` 都还是同一份 60 s 旧尺，一比就「相等」。这正是 R200 假绿的同一个形状。
改成判据亲手把某一段改成 42 s、再叫产品自己重建一次尺，然后问播放器实例看不看得到 —— 才红得下来。

## 2. 改了什么

| # | 位置 | 根因 → 修法 | 证据 |
|---|---|---|---|
| A1 | `rebuildRulerInPlace` | `calculateEventDurations` 每次**新造** `event.segmentDurations/StartTimes`（:8987），播放器的尺是 `loadEvent` 按引用抄的（:9017）⇒ 真时长永远进不到指针 / 进度 / 时钟。改：算完把三份（含 `totalDuration`）重新交给 player 实例 | 1.2.329 上 `player=event=6 300 s`（改前 8 982 s 的 60 s 猜值） |
| A2 | 同上 + `toggleClipMode` | 剪辑态下 `setTotalDuration` 无条件 `reseedClipRange()` ⇒ 刚拉的入出点每 1.5 s 一批被抹平。改：照 `rebookAxis`(:9143) 抄同一份挡箭牌（剪辑 / 拖轴 / 拖入出点），并把这次重建**记成欠账**，退出剪辑补一次；整轮跑完若还欠着，2.5 s 后再补一次（只补一次） | 100/160 保持不动 |
| A3 | `rebuildRulerInPlace` + `publishSpeedGraph` | 曲线不能走 `refreshSpeedGraph()`：它的 `lastSpeedGraphData.durations` 是开事件那一刻的旧数组。改：重建尺时按 `player.segmentDurations` 重画；`publishSpeedGraph` 落图时现取当前这把尺 | 代码可证 + 装机重画不报错（AVD 无遥测，落点差量不到） |
| A5 | `sweepRulerDurations` | `catch { return }` 整轮中止，且那一批已被 `splice` 摘走捡不回来。改：退回队首再问，连续两批没答才收手（老引擎没这条命令，不许空转）；非数组答复同批处理 | 判据序列 `1,120,120,29` ⇒ 150/150 段量到 |
| C1 | `lib.rs` `ScanIndex::load` / `read_children` | **新发现的**：R199 的「封存索引」假定同一次挂载里别人不会改盘，实测不成立 —— 车、文件管理器、MTP、`adb push` 都在同一 `st_dev` 上写。整棵换掉 `/sdcard/TeslaCamR204` 之后，扫描照旧交出 900 个已不存在的路径（`sealed=1 dirsCached=151/151`），**下拉刷新也一样**。改两半：① 封存只在索引写下 10 分钟内成立（`written_within`）；② 页面把 `pullRefresh` 变成 `refresh:true` 传下来（`nativeScanFiles` → `scan_media_dir_stream`），这一路彻底不用封存 | 见 §1 的三条红 → 5/0 绿 |

桌面一字未动：`scan_tree` 走 `allow_sealed=true` 且 `indexing=false`（本来就不建索引）；
`refresh` 只在手机那条流式命令上出现；`publishSpeedGraph` 在桌面拿到的本来就是同一份数组。

## 3. 这一批撞出来的工具坑（都要记着）

- **事件按「文件所在目录」归并**（`script.js:15990`）：一分钟一个目录 = 150 个单段事件，
  补量根本不跑。大事件夹具必须是**同一个目录里的平铺文件**。
- **/sdcard 这类 FUSE 卷的目录 mtime 确实随增删更新**（实测 `RecentClips` 里 touch 一个文件
  ⇒ :319→:402，删掉 ⇒ :405）。所以「问 mtime」这条老路在内置存储也可信，R195 在 FAT32/exFAT
  上的结论不必推翻；错的只是 R199 那条「连 mtime 都不问」。
- **冷启动自己会扫一次**：探针抢在它前面调用 `loadTauriDirectory`，会被 `scanToken` 挡回 `false`，
  于是读到的是上一轮留下的列表。判据要先 `while (v.isScanning) await sleep(300)`，
  并把 `loaded` 一起断言 —— 否则「刷新换了列表」和「刷新答了没有变化」分不开。
- **`/sdcard/TeslaCamR156` 这类历史夹具目录会被别的判据复用**：换结构时顶层目录名别动，
  否则根 `read_dir` 一定看得见，测不出缓存。
- **这台 AVD 只有 2.4 GB**：重启后 boot storm（load 17~32）会把 APP 直接 OOM 掉，
  表现是「timed out waiting for the WebView to answer」和 `ps` 里查无此人 —— 不是包坏。
  本轮为此重启过一次模拟器，并等 `/proc/loadavg` 落到 6 以下才把最后两套判据跑干净。

## 4. 装机验收（1.2.329）

改前红（§1）⇒ 改后：`r204-verify` **9/0**、`r204-scan-cache` **5/0**、
`r203-verify` **12/0**、`r201-dragselect` **11/0**、`r102-verify` 竖屏 **93/0**、
`r102-verify-landscape` **36/0**、`r173-verify` **40/0**、`r186-batch-delete` **17/0**、
`r185-scroll-chip` **5/0**、`r182-note` **24/0** —— 合计 242 条断言 0 红。
（`r173-verify` 与 `r182-note` 各被模拟器的内存压力打断过一轮：一次 WebView 不 attach、
一次进程被 OOM；重启模拟器 + 先 `loadTauriDirectory` 到各自夹具之后才跑干净。）

`Tessera-1.2.329.apk` 28,540,167 B，md5 `b0b9d4434c12e8e7a5d279866ec16d55`，
sha256 `0bf0493b650e0f761e300b27d2f9c237b608480aac111a5320e63285519c33ce`。

新夹具 `/sdcard/TeslaCamR204/RecentClips`（150 分钟 × 0 字节 `front.mp4`，建法写在判据文件头）。

## 5. 剩下的账

第 3 批扫描与删除的失败路径（catch 里 await 后不复查 token、`scanPoll` 泄漏、
`lib.rs:986/989` 白名单失败不回滚、`read_sidecars` 无字节上限）—— **已在 R205（1.2.330）落地**。
第 4 批原生生命周期（`startForeground` 未兜底、导出无墙钟看门狗、同步桥仍做 FUSE、`.part` 改名、
`ExportEngine.kt:719` 用 `currentTimeMillis` 节流）。
第 5 批 UI（四处禁用态 `opacity`、目录浏览器不吃 `--kb-h`、32/40 px、`inert` 名单、玻璃采样白跑）。
封存索引还留一条已知边界：**开机恢复那一扫仍可能答 10 分钟内的旧清单**（故意的取舍 —— 2 TB 盘上
「问 mtime」实测多花 ~10 s）；真机若还有人报「早上打开看不到昨天的片子」，就把这条也改成刷新级。

# R205 —— 第 3 批：扫描「失败了」这一路，会不会把用户刚做好的事踩掉

用户回「请继续」⇒ 第 3 批（扫描与删除的失败路径）。四条都在同一句话上：**出错的这一次扫描，
有没有权利改动屏幕此刻的状态**。前一批留下的账也在这里一起还 —— `r204-scan-cache.sh` 那五条判据
本批改成了「同一个目录里多了东西」的形状，不再靠 `rm -rf`（见 §3）。

## 1. 先红：1.2.329 上的读数

`devtools/r205-verify.js` —— 五条全红，四条前置全绿（好目录扫出 3 条、正在用的目录回 206、
死目录确实抛了、B 确实提交了新路径与新列表、A 确实进了「目录不见了」那一支）：

```
F3 扫描失败后，原来那个目录仍然放行（白名单换回来了） = 403
F1 迟到的失败回滚不再盖掉当前目录 = /storage/emulated/0/TeslaCamReg   ← 该是 TeslaCamMulti
F1 迟到的失败回滚不再盖掉当前列表
F1 迟到的那次调用如实回报「我没落地」 = undefined                      ← 该是 false
F2 扫描抛异常后没有留下 500 ms 的进度轮询 = 3                          ← 1.6 s 里打了三次 IPC
```

`devtools/r205-sidecar.sh` —— 两条红（6 MiB 的 `event.json` 整份读进内存并解析成功）：

```
F4 超限那份被跳过（ok=false） = {"ok":true,"city":"杭州"}
F4 跳过要说明原因，不许静默当「没有这个文件」
```

## 2. 改了什么（全部只在手机那条流式路径上，桌面一字未动）

| # | 位置 | 根因 → 修法 | 改后 |
|---|---|---|---|
| F1 | `script.js:23916/23933/23944` `loadTauriDirectory` 的 catch | `await this.scannedPathGone(path)` 就是「盘还在不在」的一整轮往返（慢 FUSE 几百毫秒、拔盘更久），而 `scanToken` 只在 await **之前**查过一次（R143 那套归属检查没伸进 catch）。⇒ 一次迟到的失败回滚把用户刚切好的目录与列表整个盖回旧值，还把「我没落地」报成 `undefined`。改：gone 分支、非 gone 分支、以及空扫描分支的 `reportEmptyScan` 之后各补一次令牌复查，退出统一 `return false` | 10/0 |
| F2 | `script.js:23958` `finally` | `scanPoll`（500 ms 打一次 `scan_progress`）只在成功路径清 ⇒ 抛异常就漏在那儿，之后**每一次**扫描的进度行（「读取事件信息 24/30」）都会被它翻回「已扫描 N」，还常驻一条 IPC。改：`finally` 里无条件清 —— 这一拍轮询属于这一次扫描，跟谁的最新无关 | 1.6 s 窗口内 0 次 |
| F3 | `lib.rs:1011` `scan_media_dir_stream` | 走查**之前**就把媒体服务白名单换成新目录（预览图要趁走查没完就能看图，这是 R156 定的），`let report = result?` 提前返回就换不回来 ⇒ 选一个读不了的文件夹失败后，**正在播的旧目录全部 403**（缩略图、抓帧一起死），而界面还停在旧列表。改：先 `get_allowed_roots()` 存旧值（`stream_server.rs:41` 新增），失败时若这次扫描仍是最新的一次就把白名单交还回去 | 旧目录仍 206 |
| F4 | `lib.rs:1105/1113` `read_sidecars` | 对 `event.json` 无字节上限：`read_to_string` 整读，而这一条命令一次拿 500 个路径 ⇒ 一块被写坏的盘（塞进去几百 MB）能把安卓进程直接 abort。同类上限 SEI（32 MB `moov`）早就加了，这条是漏的。改：`metadata().len() > 4 MiB` 就不读，回 `ok:false + skipped:"tooBig"` —— 只回一个空 `ok:false` 和「这个事件根本没有 sidecar」长得一模一样，谁都不会去查第二遍 | 超限那份被跳过、正常那份照常读出城市与坐标 |

桌面不受影响的两处说明：`scan_media_dir`（非流式）本来就走查之后再设白名单，没有这个洞；
`read_sidecars` 在桌面同样有上限，但桌面拿的是 `AppCache` 之外用户自己选的文件夹 —— 一条上限不会
改变任何合法 sidecar 的结果（`event.json` 实际几 KB）。

## 3. 这一批撞出来的工具坑

- **`adb shell` 字符串里的 `/sdcard/...` 会被 MSYS 改写**成 `<git 安装目录>/sdcard/...`：`adb push`
  报「1 file pushed」但文件根本没落盘，于是「大那份 `ok===false`」以错误的理由通过。判据脚本一律
  走 `MSYS_NO_PATHCONV=1` 的包装，并且**加一条会抛的前置**（正常那份读不出来就直接失败），
  让「夹具没落盘」不能伪装成通过。
- **同一句话也适用于 `*` 通配**：`adb shell "rm -rf $D/RecentClips/*"` 静默失效 ⇒ 盘上结构根本没换，
  「刷新换没换列表」量的是夹具而不是缓存。包装（`adb_run` / `adb_push`）都带 `MSYS_NO_PATHCONV=1`
  之后通配才真的落到设备上。本批把 `r204-scan-cache.sh` 改成**只做增量**（保留类目目录本身，
  只清它里面的平铺文件 + 追加一小时），顶层目录名不动 ——
  只有「同一个目录里多了东西」才是封存索引挡得住的形状。
- **APP 进程对刚被换过的目录有一段 FUSE 旧视图**（实测：`adb ls` 已经是新结构，APP 的扫描还在交
  旧结构，约 40 s 才跟上）。基线必须「等它自己看见」（本批改判据：最多 10 × 6 s 轮询到
  `groups:20`），不能假定改完立刻可见 —— 否则后面比的不是缓存，而是这个视图差。
- **`loadTauriDirectory` 在 `refreshUnchanged` 那条捷径上返回 `false`**（签名没变就算「没变化」，
  连列表都不重建）。所以「A 返回 false」这一支不能单独当证据，必须**同时**断言当前路径与列表
  确实是 B 的 —— 判据两组都写了。
- **第三方测试包会抢前台并把我们 force-stop**：这轮采完红、装回 1.2.330 之后，`com.liangqing.photos`
  自己起在前台（`mCurrentFocus` 是它），我们进程直接没了，表现是 `cdp-eval` 报「app is not running」。
  已 `pm disable-user` 掉它；跑判据前照旧要确认 `mCurrentFocus`。
- **`user_rotation` 要先 `accelerometer_rotation 0` 才生效**（这轮又踩一次）：`accelerometer_rotation`
  会被别的判据改回 1，此时写 `user_rotation 1` 完全没反应，`innerWidth` 还是 412 —— 只认 `innerWidth`。

## 4. 装机验收（1.2.330）

改前红（§1，1.2.329 上采的，同一份判据）⇒ 改后本批两套 **10/0** + **4/0**，回归：
`r204-scan-cache` **5/0**、`r204-verify` **9/0**、`r203-verify` **12/0**、`r201-dragselect` **11/0**、
`r186-batch-delete` **17/0**、`r185-scroll-chip` **5/0**、`r182-note` **24/0**、
`r102-verify` 竖屏 **93/0**、`r102-verify-landscape` **36/0**、`r173-verify` **40/0** ——
合计 **266 条断言 0 红**（这一批的 14 条 + 回归 252 条全在最终装机的 1.2.330 上重测过一遍）。

`Tessera-1.2.330.apk` 28,542,359 B，md5 `54678bb242db795c5813e373e0bd062e`，
sha256 `8bfed292446eb1cca7232d289b318c8cd4e726bf21cfcea6f2615bd3aa35c499`。

新夹具 `/sdcard/TeslaCamR205/SavedClips`（两份 `event.json`，一份 6 MiB，建法写在判据里）。
流媒体 token 是「整份文件可读」的能力，**绝不写进文档或判据输出** —— F3 只回 HTTP 状态码。

## 5. 剩下的账

第 4 批原生生命周期已在下面的 **R206** 一节还了五条（`startForeground` 兜底、`onDestroy` 取消任务、
节流改单调钟、`ThumbFetcher` executor、`.part` 改名）。同一张清单里的**「同步桥仍在主线程做 FUSE IO」这一条没做**，
仍挂在 R206 §5 上（要先把哪几个调用真的走 FUSE 量出来，不能凭表面对称改）。
第 5 批 UI（四处禁用态 `opacity`、目录浏览器不吃 `--kb-h`、32/40 px、`inert` 名单、玻璃采样白跑）。

# R206 —— 第 4 批：原生这一层的生命周期，任务和服务要对得上

用户回「请继续，不要停，一次性搞完」⇒ 第 4 批（R203 审计里 Kotlin 生命周期那一摊）。这一批的缺陷在
页面上一个都看不见，但每一条的结局都是**用户已经付出去的时间与文件，最后什么都没拿到**：服务起不来
把整个 APP 带走、系统停服务之后编码还在烧 CPU、进程半路死掉留一个相册里 0 秒点开报错的 .mp4、
中途校时把进度条冻住、每次重建 activity 泄漏一条线程。

## 1. 先红：1.2.330 上的读数

`bash devtools/r206-verify.sh` —— 四条红，13 条前置与不回归全绿（前置红了就不算结论，所以每一条
都单独钉住「这件事真的发生过」）：

```
N6 activity 重建不泄漏线程池线程（每次重建净增 0） = 3 → 4，重建 3 次
N4 墙钟回拨 2 小时之后，进度回报的频率不许塌掉 = 拨钟前 1.63 条/秒 → 拨钟后 0.13 条/秒｜百分比 15→46→49→100
N3 服务被停掉之后任务要收手（拿到 cancelled 回执，而不是照常跑完） = {"phase":"done","frames":617,"path":"…_4c_928x2048 (2).mp4"}
N5 进程半路死掉不留 .mp4 孤儿（新出现的只许是 .part） = {"fresh":["…_4c_928x2048.mp4"],"parts":[]}
```

同一轮里作为对照的两条：`期间前台的 ExportService 记录 = 1`（前台身份本来是真的，所以 N3 的红不是
「根本没进前台」），`设备钟面 = 10:00`（墙钟确实被拨回去过两小时，N4 测的不是没发生的事）。

## 2. 改了什么（全在 Kotlin 侧，JS 与桌面一字未动）

| # | 位置 | 根因 → 修法 | 证据分级 |
|---|---|---|---|
| N1/N2 | `ExportService.kt:258-265`、`:371`（`promote()` 现在返回 Boolean）、`ScanService.kt:51-60` | `startForeground()` **允许抛**：Android 14+ 的 dataSync 当日配额、ROM 拒这个类型、task 已被移除。裸调用抛在 `onCreate` 里 ⇒ 整个进程没了：页面、WebView、正在跑的扫描一起消失。改：`runCatching` 兜住，抛了就 `Log.w` + 拒绝那一个作业（`reportStartFailure` `:169`，用 `submit()` 记下的 `pendingId` `:96` 把回执寄回**它点名的那个作业**）+ `stopSelf()`；`onStartCommand` 第一行 `if (!promised) return START_NOT_STICKY`（`:271`）——没拿到前台身份就不许解一帧 | 代码可证 + happy path 回归（AVD 造不出「被拒」：root shell 起 FGS 一律 `Background started FGS: Allowed … code:SYSTEM_UID`，实测不抛）|
| N3 | `ExportService.kt:305` | 系统/用户停服务（配额、下拉通知里手停、内存压力）只走 `onDestroy`，原来那里只释放唤醒锁 ⇒ 进程已无前台身份却还在满速编码，随时被杀、文件停在半截。改：`if (ExportHost.isBusy()) ExportHost.cancel(0)`，让引擎自己收尾——写出过帧的按「已写入的片段」留，一段没写的删 | 已实测（红→绿） |
| N4 | `ExportEngine.kt:748`、预热循环 `:298` | 节流用 `System.currentTimeMillis()`（墙上时钟）。中途校时往回拨两小时 ⇒ `now - lastReportAt` 变成大负数，**永远**小于 300 ms ⇒ 进度回报彻底停发，而片子还在照常编。改：`SystemClock.elapsedRealtime()`（单调） | 已实测（红→绿） |
| N5 | `ExportEngine.kt:198`、`:262`、`:529`、`:564-580` | `MediaMuxer` 直接开在成品名上：进程半路死掉（低内存、上滑划掉、`force-stop`）就留下一个**已 open、没有 moov** 的正式 `.mp4` —— 相册里 0 秒、点开报错、还会被「最近导出」扫进列表。改：开在 `<名>.mp4.part` 上，只有「值得交付」才改名成成品名；`payload.path` 一律取 `keptPath`（没改成功就是空串），`bytes` 同理 | 已实测（红→绿） |
| N5b | `ExportEngine.kt:570-571` | 改名失败原先是「删掉目标再改名」。目标存在只可能是**别人**（相机、浏览器、另一个 APP）往同一个下载目录里写了同名的东西 ⇒ 抹掉一次成品比多一个「(2)」严重得多。改：失败就再要一个不冲突的名字（`uniqueOutputFile(outputFile)`），永不删除非自己写的文件 | 代码可证（AVD 上没有并发写手，造不出冲突） |
| N6 | `MainActivity.kt:107-110`、`:315` + `ThumbFetcher.kt:37` | `volume`/`state` 两个池在 `onDestroy` 里 `shutdownNow()`，`thumbFetcher` 是 lazy 的、没人关 ⇒ 每次 activity 重建（改系统字号、切深色、旋转配置变化）净泄漏一条 `pool-N-thread-1`，永不回收。改：`fun close() { executor.shutdownNow() }`，`onDestroy` 里**只在它真的生出来过**时关（`thumbFetcherLazy.isInitialized()`）——为「关掉一个不存在的东西」把它建出来，正是这个泄漏的反面 | 已实测（红→绿） |

拒绝用户可见的那一句话用页面里已有的 `startFailed`（`ExportHost.label`），不新增只有 Kotlin 认识的码 ——
没有译文的码会直接在 toast 上漏出英文原文。

## 3. 这一批撞出来的工具坑（判据改了三版才肯分辨）

- **速率判据的两个窗口必须同阶段、同长度、且都在作业活着的时候**：第一版在 T+2 s 起量，那 4 秒引擎还没热
  （百分比 0→2、只出 2 条回报），拿它当基线是比噪声；第二版用 shell 轮询等百分比 ≥20 %，一次 probe 自身
  ~2 s + sleep 5 s，看到 20 % 时实际已经 46 %，后一段 8 秒直接跨过终点 —— 而**终点回执是绕过节流直接发布的**，
  所以「作业跑完」那一段照样能看到 1~2 条回报，看着像「没塌」。⇒ 等百分比这件事挪进页内用 250 ms 循环等，
  并且每个采样点都把 `job===true` 钉成前置。
- **孤儿文件判据必须先记起跑前的清单再做差**：上一单**成功**的导出正好占着正式名，直接 `ls | grep 基础名`
  会把成功产物念成孤儿（本轮误红一次）。反过来也不成立：`uniqueOutputFile` 会写成 `名字 (9).mp4`，
  那不是基础名的子串，裸 grep **又会漏掉真孤儿**。⇒ before/after 两份清单取差集，差集里只许出现 `.part`，
  并额外要求「差集非空」（否则「什么都没写」会白捡通过）。
- **「activity 被重建了」这件事本身也要断言**：线程账靠改 `font_scale` 触发重建，但改完不一定真重建。
  页内先钉 `window.__r206gen='g1'`，重建后读回来是 `gone` 才算数；判据要求确认重建 ≥2 次才比线程数。
- **改正在运行的 bash 判据脚本 = 同时开两轮**：上一轮还活着（bash 边读边执行，改完直接在半路
  `syntax error near unexpected token ')'`），两轮共用 `$TMP/r206-probe.js` ⇒ 一份被写歪的 JS 喂进 WebView，
  症状是 `SyntaxError: await is only valid…`，另一轮还在 `am force-stop` 抢前台。现在每个进程一套临时文件
  （带 `$$`）+ `mkdir` 原子锁（本机没有 `pgrep`），锁 40 分钟内不许第二轮。
- **改 `font_scale` 连重建几次之后，AVD 的 WebView JS 线程会彻底不动**：进程在、焦点在我们、
  `webview_devtools` socket 也在，但**连 `1+1` 都 25 s 不返回**；`adb shell` 一切照常，所以 bash 层看不出来，
  后面每一步都拿到空串。⇒ 大动作之间加一个 `alive()` 探针，不回话就 `force-stop + start` 复活（实测一次就活）。

## 4. 装机验收（1.2.331）

改前红（§1，`1.2.330` 上采）⇒ 改后在**交付的那一份 APK**（28,542,359 B，
md5 `1bdf6ef159e3be4606ed2ab73b1f8a12`，sha256 `c0921077d82619f85183f460aab6aeebc3e32d66d0c771f63b9354a2154bdf03`）上：

- `devtools/r206-verify.sh` **17 条断言 0 红**：N6 线程 3 → 2（重建 3 次）、N4 拨钟后仍有 1.13 条/秒
  （拨钟前 1.75）、N3 拿到 `cancelled` 且前台通知为 0、N5 差集里只有 `.mp4.part`、
  导出期间前台身份 = 1、中途拨钟那一单仍然 `done`。
- `devtools/r149-export-cancel.js` ok：起播 120 ms 内取消 ⇒ `frames:0` + `path:""`（不留空壳）。
  这一条本轮把钩子改稳了：原先钩 `window.__tdashcamExportProgress` 这个**全局名**，
  而面板每次装配都会重新指派它（`script.js:24942`）⇒ 只有「面板恰好已经装配过」的会话才通过，
  冷启动那轮拿到的是「30 s 内没有终止载荷」。现在钩实例方法并自己钉住钩子在不在。
- 回归（同一份包，全绿）：`r205-verify` **10/0**、`r205-sidecar` **4/0**、`r204-verify` **9/0**、
  `r203-verify` **12/0**、`r201-dragselect` **11/0**、`r186-batch-delete` **17/0**、`r185-scroll-chip` **5/0**、
  `r182-note` **24/0**、`r102-verify` 竖屏 **92/0** —— 连上面两条合计 **202 条断言 0 红**。

**本轮没能复测的四条（记在这里，不算通过）**：`r102-verify-landscape`（36）、`r173-verify`（40）、
`r138-verify-fixes`、`r204-scan-cache`（5）。原因：横屏那两套跑到一半 WebView 不再回话（§3 那条），
恢复之后这台模拟器上又有第三方自动化在反复替换包与抢前台（`am start` 报「Activity class does not exist」
而 `pm path` 指着我刚装的 base.apk）。这四条覆盖的面（横屏玻璃/横屏筛选面/换段 hold/扫描缓存）
本批一行未动 —— 改动全在 Kotlin 服务生命周期与导出文件名上，而导出这一面被上面 r206 的三次完整导出
+ 两次取消 + 一次中途拨钟，以及 r149 走遍了。下一轮补跑，补不到就仍然挂着。

### 4b. R208 那一轮把这一节的两条判据缺陷挖了出来（1.2.333/1.2.334 复测）

复测时先拿到 **15 绿 / 2 红**，两条红都不是产品的：

1. **`am stopservice $PKG/$PKG.ExportService`（位置参数）根本没停服务**。logcat 里那条 intent 是
   `act=android.intent.action.MAIN cat=[LAUNCHER] cmp=…/.ExportService` ⇒ `Error stopping service`。
   ⇒ 这一条要改的是**判据**：改前那一版（1.2.330）拿它量到的「照常跑完 done」是真的（服务没被停，
   任务当然跑完），而 1.2.331 上量到的 `cancelled` **不是**这条命令停出来的 —— 那就是个假绿。
   现在用 `am stopservice -n` 并把 `am` 的回执钉成前置（回执里出现 `Error` 就红在工具上）。
2. **`/^10:0/` 匹配钟面**：guest 的 `date` 打的是 UTC（`… GMT`），而 `date -s '2026-10-31 10:00:00'`
   按本地时区解释 ⇒ 名义「回拨 2 小时」实际只向前挪了 24 分钟，判据永远读不到那个字符串（假红）。
   现在按设备自己的 epoch 算目标（`date -s @$((E0-7200))`），前置比的是 `E1-E0 <= -3600`。
   顺带发现**拨钟要 root**：非 root 的 `date -s` 回 `Operation not permitted`，钟根本没动 ⇒ 脚本开头加 `adb root`。

第三条是同一轮里改的形状问题：4 路 × 15 s 这份夹具在 AVD 上整单只 ~18 s，8 秒的两段窗口会让
「拨钟后」那一段直接跨过终点（实测 15 → 68 → done）。窗口缩到 5 s，并且**每段的秒数由采样器自己的
`performance.now()` 时间戳算**，不再写死分母（`$WIN` 只当兜底）。

改后（**1.2.334**，同一台 AVD、同一份夹具）：**18 条断言 0 红**，`notes.interfered=0`（这一轮 log 里
`app is not running` 一条都没有）：

```
N6 线程 3 → 2（重建 3 次，页面每次都换了一份）
N4 拨钟前 1.95 条/秒（6.7 s）→ 拨钟后 0.99 条/秒（7.1 s）｜百分比 15→46→63→100，这一单仍然 done
N3 停服务后 cancelled，附注码 cancelledKept、frames=304、产物带 (2) 序号；前台通知 0
N5 差集里只出现 .mp4.part，没有 .mp4 孤儿
导出期间 ExportService 前台身份 = 1（取这一数那一刻 job 确实还在跑）
```

也就是说 §4 那条「N3 服务被停掉之后任务要收手」的结论**现在才真的成立**（此前是被位置参数骗过的假绿）。
`darkSome` 与 `cancelledKept` 谁该上屏那一问，这次拿到的读数是 `cancelledKept`（半路停的单，产物留在半截）。

## 5. 剩下的账

- **同步桥仍在主线程做 FUSE IO**（R203 第 4 批清单上的一条，本轮**没做**）：`MainActivity` 的同步问答里
  有会落到外接存储的路径，慢 FUSE 上就是 ANR 的形状。动手前要先量出「哪几个调用真的落到 FUSE、最坏多少毫秒」——
  按表面对称去改会把不走 FUSE 的分支也拖进线程池。留作下一批第一条。
  **R208 已把量具交出去**（`bridge …` 那一行进「复制诊断」，本机数表见 R208 §4：AVD 上没有 OTG 卷，
  那只是下界），改不改等真机贴回来的那一行。
- **`.part` 永不回收**：崩掉的作业会在下载目录留下 `<名>.mp4.part`。界面看不见（JS 的「最近导出」
  按 `.mp4` 结尾过滤），但文件管理器里会攒。要么起单时顺手删同前缀的旧 `.part`，要么按 mtime 清 ——
  先记账，本批不做（做就要定「多旧算旧」，而那是要拍的设计取向）。
- **取消单上的附注码**：r206 里停服务那一单终态是 `cancelled`（对的），但 `code` 被
  `darkSome`（「有 N 路全程没有画面」）占走，`cancelledKept` 那句反而没上屏。这句话在这种半路停的单里
  到底算不算附注，等真机反馈再定 —— 现在只把现象记下来，不改文案优先级。
- **N1/N2 只有代码可证**：AVD 造不出 `startForeground` 被拒（root shell 起前台服务一律
  `Background started FGS: Allowed … code:SYSTEM_UID`，实测不抛）。改后的 happy path（导出期间
  前台身份 = 1、通知随任务撤销）测过；被拒那一支要真机（尤其 Android 14+ 用满配额的机型）才有现场。
- 第 5 批 UI 仍在账上：四处禁用态 `opacity`（`styles.css:5391 / 7799 / 11053 / 11689`）、目录浏览器不吃
  `--kb-h`、无 role 卡片上的 `aria-selected`、`inert` 名单缺 `#metaDetailOverlay` 与 `#exportPill`、
  导出页 × 与几处 <40 px 目标、白跑的玻璃采样与诊断。

# R207 —— 第 5 批：禁用态要读得清、弹层别让焦点跑进去、目录浏览器要吃键盘高度

用户回「请继续」⇒ R203 审计的最后一批（UI / 禁用态 / 可达性）。判据 `devtools/r207-verify.sh`
（竖屏 `r207-verify.js` + 横屏 `r207-landscape.js`，方向这件事只认 `innerWidth`）。

## 1. 先红：1.2.331 上的读数（装回旧包、用**交付版判据**重采）

竖屏 `r207-verify.js` = 11 红 / 11 绿：

```
长按菜单项（.context-item[disabled]）浅色 = 2.47:1（opacity=.4）
导出页主按钮（.pe-nav-go[disabled]）浅/深 = 2.22:1 / 2.22:1（opacity=.42）
批量删除（.batch-delete-btn:disabled）浅/深 = 1.85:1 / 1.85:1（opacity=.45）
aria-selected 只挂在有 role 的元素上 = 3 张没有 role（video-card selectable）
弹层开着时 #metaDetailOverlay inert = false ／ #exportPill inert = false
导出进行中胶囊 #exportPill = 样式高 34px（job=y、plan=ok）
手势提示关闭 ≥40×40 = 30×30
键盘弹起时目录浏览器内容底边 = 881 → 881（抬 0px，而 --kb-h 已经是 max(320px, 0.0px)）
```

横屏 `r207-landscape.js` = 2 红 / 3 绿（**这一面本轮才第一次量到真实的**）：

```
禁用态「重置」浅色 = 2.39:1（墨 rgb(34,16,197)、opacity=.4、底 rgb(255,255,255)；启用态对同底 10.78:1）
禁用态「重置」深色 = 2.42:1（墨 rgb(185,174,255)、opacity=.4、底 rgb(36,37,38)；启用态对同底 7.72:1）
```

上一版这里写的是「这一条没能量到真实的那一面，只有隐藏节点上的 1.97:1，不算已证实」。横屏那一面
要「抽屉真的展开」+「`filters-open`」两个条件同时成立才画得出来，而**摘 `collapsed` 类不算展开**：
抽屉的开合有它自己的状态机，必须走产品自己的门（`toggleSidebar(true)` 再 `setFiltersOpen(true,false)`）。
补上这一步之后 40×40 的钮就在屏幕上了，红也是真的红了。

顺带清掉判据自己的两个洞（都是「白捡通过」那一类）：
- 「禁用 ≠ 启用」那条以前拿「复原成来时的样子」当启用态 —— 这两颗钮在产品里**本来就禁着**，
  于是两边读到同一个禁用色，红的是判据自己。改成显式 `disabled=false` 再读，并且要求它真的没被状态机按回去。
- 「顶边仍在可视区内」以前在**清掉键盘高之后**才读 rect（那条面带 transition，200 ms 读到的是复原途中），
  把 −256 读成了 64。顶边必须在键盘还顶着的时候量。

**这一族在 WCAG 里是被豁免的**（1.4.3 明写 inactive controls 不受约束），所以这里断言的不是「AA 违规已修」，
而是一条自己的取向：**禁用态也要读得清**（合成后的墨压在实际底上 ≥3:1）。

## 2. 改了什么（全在手机档，桌面一字未动）

| # | 位置 | 根因 → 修法 |
|---|---|---|
| U1 | `styles.css:46-47`、`:110-111`（新增 token）、`:5402`、`:7815-7816`、`:11091`、`:11729-11730` | 四处禁用态一律 `opacity: .4~.45`。半透明压在底色上，**画出来的墨**是混合物，任何拿 `color` 算的账都算不到它（R70 为这一类吃过一次假绿），实测就是 1.85~2.47:1。改成显式禁用墨 `--ink-disabled`（浅 `#6e737c` / 深 `#949aa6`）+ 填充式按钮换不透明禁用底 `--fill-disabled`（浅 `#e6e7ec` / 深 `#353a46`）——**必须不透明**：第一版用半透明填充底时，灰墨压在主题紫上量出 1.20:1。横屏筛选面那颗「重置」共用同一对 token（`:11091`），改完由横屏判据量到真实的那一面（数值见 §3） |
| U2 | `script.js:7209`、`:21169`、`:21319`、`:21290` | 卡片上挂着 `aria-selected` 却没有 role（读屏念到的是「一个 group 说自己被选中」＝没有信息）。选择态卡片补 `role="option"`，列表容器补 `role="listbox"` + `aria-multiselectable`，进出选择态各写一次 |
| U3 | `script.js:21951`（`syncSheetFocus`） | 弹层的 inert 名单只有侧栏 / `.main-content` / 底部条，而 `#metaDetailOverlay`（行车数据整面）与 `#exportPill` 挂在 body 上、不在 `.main-content` 里 ⇒ 弹层开着时焦点还能走进「点上去会跳去另一个面」的控件。补进同一份名单（沿用同一个 `!!top`） |
| U4 | `styles.css:9077`（手势提示关闭） | 30×30，低于本项目的 40dp 下限。图标视觉不变，靠 `min-width/min-height: 40` + `background-clip: content-box` 把命中区抬上去 |
| U5 | `styles.css:6662`（`#exportPill`） | 胶囊 `height: 34px` —— 它是「导出在跑」唯一的屏内入口。加高到 40（底部锚定，往上长，不压进度条那一层） |
| U6 | `styles.css:10277`（`#androidDirModal .modal-content`） | 目录浏览器完全不参与 `--kb-h`：键盘弹起来时底下几行被盖住，而同一批 iOS 抽屉（筛选面等）都会按键盘高度上抬。**留白和封顶要一起改**：第一版只加 `margin-bottom`，而 `max-height` 那条同特异度的 `html.sheet-mode` 规则（更靠后）本来就把上一版的 `max-height:none` 盖成了死码，于是键盘一抬，805px 高的整块被顶到屏幕上缘之外（实测顶边 64 → −256，标题与「上一级」跑掉）。现在选择器写成 `.sheet-mode.touch-ui`（特异度高一级），留白 `12+--kb-h`、封顶 `视口−34−安全区−键盘高`；改后读数见 §3（键盘 320px 时底边上抬、顶边仍在屏内、盒高随可用高自动收窄）。 |

## 3. 验收（1.2.333，md5 `f9f1271e409e45605caa1f76f3d11063`，28 543 891 字节）

`bash devtools/r207-verify.sh` → **竖屏 22/0、横屏 5/0**（合计 27 条，0 红）。逐条读数：

| 面 | 浅色 | 深色 |
|---|---|---|
| 长按菜单项（`.context-item[disabled]`） | 4.77:1 | 5.94:1 |
| 导出页主按钮（`.pe-nav-go[disabled]`，不透明禁用底） | 3.86:1 | 4.03:1 |
| 批量删除（`.batch-delete-btn:disabled`，不透明禁用底） | 3.86:1 | 4.03:1 |
| 横屏筛选面「重置」（`.filter-sheet-action[disabled]`） | 4.77:1 | 5.43:1 |

其余三条：`aria-selected` 挂在有 role 的元素上 = **0 张没有**（改前 3 张）；弹层开着时
`.main-content` / `#metaDetailOverlay` / `#exportPill` 三个 `inert` 全 = true；命中区
导出页返回 54×40、手势提示关闭 40×40、横屏「重置」40×40。
**导出胶囊这条走的是真那颗**：判据自己起一单（`playEvent` 不 await，改轮询 `currentEvent`），
再把导出页收起（页面开着时胶囊被压在下面，`checkVisibility` 实测 false），量到 **100×40**；
量完取消。目录浏览器：`--kb-h=max(320px, 0.0px)`、底边 **869 → 549（抬 320）**、
顶边 **64**（改前同一支判据读到 −256）、盒高随可用高从 805 收到 **485**。

回归（**每个套件前冷启动一次**，`bash devtools/r207-regression.sh`；上一轮不重启连着跑时
`r102-verify` 白捡了 4 条 R118 的红 —— 抽屉里那一行没开起来，是判据互相留脏状态）：

```
r102-verify 93/0   r102-verify-landscape 36/0   r173-verify 40/0   r182-note 24/0
r203-verify 12/0   r204-verify 9/0   r205-verify 10/0   r201-dragselect 11/0
r186-batch-delete 17/0   r185-scroll-chip 5/0            合计 257/0
```

目视截图 9 张（`bash devtools/r207-shots.sh`，`%TEMP%/r207-shots/`）：长按菜单浅/深、导出页主按钮浅/深、
批量删除浅/深、目录浏览器 + 320px 键盘、导出中胶囊、横屏筛选面。四张逐张看过：禁用行读得清、
图标跟着一起换墨、键盘抬起时标题与「上一级」仍在屏内、横屏「重置」与「收起」同高差一档色而不是「淡掉一半」。

**没重跑的**：`r206-verify.sh`（17 条，真导出 + 杀进程链；本轮没有原生改动）、`r205-sidecar.sh`（4）、
`r204-scan-cache.sh`（5）。`r138-verify-fixes.js` 只报读数不给 ok/fail，本轮读数
`held=[] need=null resumeCleared=true at=2/3.03`，形状正常。

本轮新踩的假信号（都记在判据注释里）：
- `cs(btn.color)` —— `btn.color` 是 <button> 上没有的属性，传进 `getComputedStyle` 直接抛，
  整份横屏判据变成一条 `threw`（计算值要从元素上取：`cs(btn).color`）。
- 「禁用 ≠ 启用」拿 `disabled = before` 当启用态：这两颗钮本来就禁着，两边读到同一个色，红在判据自己头上。
- 「顶边在不在屏内」在清掉键盘高之后才量：那条面带 transition，200 ms 读到的是复原途中，把 −256 读成 64。
- 探针借来的前置要自己收尾：第 1 节开过长按菜单，`body.context-open` 会把胶囊整条 `display:none`
  （styles.css:6698），于是「有作业在跑」的胶囊只能退到样式盒。
- 截图脚本连着摆多个面时，每一面开头要先把上一面收掉，否则拍到的是导出页（`kbdir` 第一版就是这么拍的）。
- `show()` 里把 `'$1'` 直接插进 `node -e` 的字符串：MSYS 会把 `/c/...` 改写成 `C:\c\...`，
  报 ENOENT 而不是读不到结果 —— 一律走 `process.argv` + `cygpath -w`。
- `r102-verify-landscape` 的基准要求「不是 RecentClips 的事件」，而 `r204` 会把目录切到
  `TeslaCamR204`（全 0 字节）：切回 `TeslaCamReg` 也不够，还要**冷启动**让判据自己播非 RecentClips 那一条，
  否则 5 条连红全是假信号。

## 4. 余账

- 禁用态这一族 WCAG 豁免，本项目自定 ≥3:1；最低的一档是「不透明禁用底 + 灰墨」= 3.86:1（浅色）。
  真机上若还要更保守，只动 `--ink-disabled` / `--fill-disabled` 这一对 token，别再回到 `opacity`。
- 竖屏那一面的 `#filterResetBtn` 实测 0×0 / `checkVisibility=false`（整条规则在横屏那条 @media 里），
  所以竖屏判据不再量它，改由横屏半边量。将来若竖屏也要画这一对钮，得另加一条规则并补判据。
- `--kb-h` 这条通道只给了竖屏 sheet-mode 的目录浏览器；横屏那一面是居中卡片，本轮没动，
  键盘在横屏盖住它的路径仍未验（R71 那轮只处理过导出/筛选面）。
- `syncSheetFocus` 的 inert 名单是**手写清单**：以后新增挂在 body 上的浮面，要一起加进去，
  否则「弹层开着时焦点跑进去」这一类会原样复发。
- `.pe-tile-grip`（导出画格搬运柄）这一轮仍没走到：它只在「摆放编辑」面里画，AVD 上要把那一面开到
  能量的状态需要真素材 + 预览帧，判据把它记成 `notes` 而不是绿。
- 1.2.332 是本轮内的中间包（未发布、同名覆盖过一次），最终交付并打 tag 的是 **1.2.333**。
- R206 §5 那几条仍挂着：FUSE sync 桥（量具已交，见 R208）、`.part` 无人回收、`darkSome` 与 `cancelledKept` 的措辞。

# R208 —— 第 6 批：同步桥的耗时台账（这台机器上量不到，就让 APP 自己把数带出来）

用户回「请继续，不要停，一次性搞完」⇒ 接着按 R206 §5 的第一条动手。

## 1. 为什么这一批交的是量具，不是修法

R206 §5 那句话是「动手前要先量出哪几个调用真的落到 FUSE、最坏多少毫秒 —— 按表面对称去改会把不走 FUSE 的
分支也拖进线程池」。这条纪律在 AVD 上兑现不了：`r208-bridge-cost.js` 数出来的 `usbVolumes=0`（模拟器没有
OTG 卷），所有桥调用压在 emulated storage 上都是几毫秒，**永远够不到 5 秒的输入超时**。
所以改线程模型的证据只可能在插着 1.9 TB 盘的那台真机上，而真机不能插 USB 探针 ⇒ 让 APP 自己带数：
每一次同步桥调用占住 JS 线程多久，记进台账，随「复制诊断」一起贴回来。

## 2. 交的东西（全在手机才有的分支上，桌面一字未动）

| 位置 | 内容 |
|---|---|
| `src/script.js:1210-1236` | `bridgeCost` 台账（每方法 `n / first / max / sum`）、`recordBridgeCost`、`describeBridgeCost`（最占的那一次从大到小）、`withBridgeCost` |
| `src/script.js:1238`（`nativeMethod`）+ `:1263`（`nativeFire`） | 两个门面各自把一次同步调用包进 `withBridgeCost`；`hasNativeBridge()` 的 guard **仍在计时之前**，所以桌面上台账恒空 |
| `src/script.js:19873-19874` | 诊断多一行 `bridge (ms the JS thread waited, worst first): …`，台账空就不画这一行 |
| `src/script.js:19910` | `this.lastDiagnosticsText`：判据要断言「这一行进得了粘贴板」，读的就是产品自己拼出来的那份字符串 |

桥方法没有一处绕过门面（`grep TDashcamNative` 只剩注释），所以台账就是全部。

## 3. 先红后绿

判据 `devtools/r208-verify.sh`（冷启动 → `r208-verify.js` → 顺带把数表打出来）。

**改前（1.2.333）= 1 绿 1 红**，红得没有歧义 —— 桥在，量具不在：

```
o 前置：这是安卓壳，桥在（否则整套没有被测对象） = hasNativeBridge=true
x 前置：台账函数在这个包里（describeBridgeCost） = undefined
```

**改后（1.2.334，28,544,727 B，md5 `d27d777592425ddaf47f7e2d02fde9c8`，sha256 `b0907e60a74cfc27d2267ab5362f56e701f0ba60b4c4184fa0ddd757b0133b48`）= 13 条 0 红**：
台账非空、冷启动里页面自己就调过 `storageVolumes`、每条数算得出来（`first`/`avg` 都不超过 `max`）、
排序真的从大到小、门面加了计时仍交回桥原话（`volumeStats` 逐字相等）、不存在的方法仍 resolve `null` 且**不记账**、
「复制诊断」里看得见这一行且没挤掉 `volumes=` / `volume rx=` 两行。
`notes`：`storageVolumes n=3 first=14.2 max=14.2 avg=5.2`（冷启动那一拍的桥线程占用，页面自己那一次）。

## 4. 本机数表（**下界**；真机跑同一支探针才算数）

`devtools/r208-bridge-cost.js`，装机后第一次，每方法 12 拍，单位 ms：

| 方法 | first | max | median |
|---|---|---|---|
| `storageVolumes`（第一次） | 2.5 | 2.5 | 0.6 |
| `storageVolumes`（之后） | 0.7 | 0.7 | **0.1** |
| `appFilesDir` | **52.1** | 52.1 | 3.9 |
| `nativeStatus` | 1.9 | 2.5 | 1.5 |
| `notificationsAllowed` | 1.5 | 1.5 | 0.7 |
| `exportCodecReport` | 1.4 | 1.8 | 1.1 |
| `systemBrightness` | 1.4 | 1.4 | 0.8 |
| `shareFile`（不存在的路径，只走到 `File.isFile`） | 1.3 | 1.3 | 0.5 |
| `volumeStats`（纯计数器，不碰盘） | 0.5 | 0.9 | 0.5 |
| `exportStatus` | 0.4 | 1.1 | 0.3 |

读出来的三件事：

1. **`storageVolumes` 的 `first` 与 `after` 差一个量级**（0.6 → 0.1 median）—— 那正是
   `MainActivity.kt:900-908` 的「缓存为空就当场算一遍」那一支；本机只 2 ms，因为它算的是 emulated 那几个卷。
2. **`appFilesDir` 首次 52 ms**（`MainActivity.kt:343`：`getExternalFilesDir` + `mkdirs` + `isDirectory`），
   同一支探针第二次冷启动只 5.1 ms ⇒ 那 52 ms 是**目录第一次被建出来**的成本，不是稳态成本。
   这条比 R206 §5 原来点名的 `storageVolumes` 更值得盯。
3. `volumeStats` / `exportStatus` 是纯计数器（`MainActivity.kt:1116` 只拼几个字段），把它们挪下线程池是白付代价 ——
   这就是「按表面对称去改」会犯的错，现在有了数，不必猜。

## 4b. 真机那一拍（2026-11-01，小米 23127PN0CC / e152f205）

用户把手机插上来说「试一下 CDP 能不能通」⇒ 顺带把这一节欠的那一行数读回来了。
装的是**同一个工作树**多打的一份「release 签名 + `debuggable`」测试载具
（`Tessera-1.2.334-testable.apk`，开关在 `app/build.gradle.kts` 的 `TDASHCAM_TEST_DEBUGGABLE=1`；
同一把 keystore ⇒ `adb install -r` 覆盖装机不丢数据）。`dumpsys package` 确认
`flags=[ DEBUGGABLE … ]`、`versionName=1.2.334`，`/proc/net/unix` 出现 `webview_devtools_remote_<我们的 pid>`。

冷启动后页面自己那条台账（`describeBridgeCost()`，最占的先看，单位 ms）：

| 方法 | max | n | first | avg |
|---|---|---|---|---|
| `storageVolumes` | **241.6** | 3 | 241.6 | 82.6 |
| `nativeStatus` | 17.7 | 1 | 17.7 | 17.7 |
| `scanKeepAlive` | 14.8 | 2 | 14.8 | 14.7 |
| `setUiLang` | 4.4 | 1 | 4.4 | 4.4 |

同一台机器上 `r208-bridge-cost.js` 十二拍的数（`storageVolumes#first` 3.2 / `appFilesDir` 2.1 /
`exportCodecReport` 3.7 max）比上面小两个量级，因为**台账量的是「这个进程第一次问」，探针量的是「已经答过一次之后」** ——
`MainActivity.kt:900-908` 那次「缓存为空就当场算」正好落在页面开屏的第一拍上。

⇒ 结论有两条：
1. **§6 的门槛没到**（那一步写的是「`first` 到几百 ms 以上」）。241.6 ms 是 AVD 的 100 倍，但它仍然没到
   「值得让首拍交空清单」的那一档，而且这台机器 `/storage` 下只有 `emulated`/`self`（`usbVolumes=0`）——
   **没有 OTG 卷的真数还是没拿到**。要拿的那个数只能来自用户插着 1.9 TB 盘时按一次「复制诊断」，
   那一行现在自己会带上台账。
2. 顺带看见 `scanKeepAlive` 每次 14.8 ms、扫描期间至少两拍 —— 它不在 R206 §5 的名单上，
   但它是**唯一一个在扫描循环里反复问桥**的方法；真要动线程模型，它比 `volumeStats` 那种纯计数器值得先看。

这台手机当测试台的边界（都是当场撞出来的，下一轮别重新试）：

- **9333 端口不能用**：`netstat` 显示 `127.0.0.1:9333` 由**另一个 adb.exe（PID 34332）**占着
  ⇒ `adb forward` 会「成功」但连接归别人，判据读回来的是 `timed out`。手机一律带 `CDP_PORT=9450`。
- **`settings put` 全部被拒**（`Permission denial, must have one of: [WRITE_SECURE_SETTINGS]`）
  ⇒ 旋转（`user_rotation`）、字号（`font_scale`）、`accelerometer_rotation` 在手机上驱动不了：
  **横屏那半套与字号普查只能回模拟器跑**。
- **`input` 注入被拒**（`INJECT_EVENTS`，MIUI 的「USB 调试（安全设置）」没开）⇒ 真点击只能走 CDP 的 `Input` 域。
- **不能 `adb root`**（`adbd cannot run as root in production builds`）⇒ R206 那套拨钟判据天生只能跑模拟器。
- **息屏时 `screenrecord` 报 `INVALID_LAYER_STACK`**，造不出手机侧的新夹具 ⇒ 夹具从 AVD 拉过来再推过去
  （`TeslaCamReg` 21 个文件、`TeslaCamMulti` 168 个，形状一字照抄）。
- **页面必须在最前台且可见**：`am start` 只回「brought to the front」时，如果焦点落在
  `NotificationShade` 或别的应用（当次实测 `com.xingin.xhs` 抢过前台），`Runtime.evaluate` 会一直不答 ——
  这是超时，不是产品缺陷。跑长判据前先确认 `mCurrentFocus`。
- **手机一进 Doze 就整套判据停摆**（本次实测：`mWakefulness=Dozing` ⇒ `/json` 直接不答，
  `r203-verify` / `r204-verify` 两次 300 s 超时）。而 MIUI 上**没有任何 adb 手段能把屏幕留住**：
  `input keyevent KEYCODE_WAKEUP` 要 `INJECT_EVENTS`（被拒），`svc power stayon true` 只是当场把屏幕弄亮一下，
  `settings get global stay_on_while_plugged_in` 回 `0` ⇒ 那个写也被 `WRITE_SECURE_SETTINGS` 挡在门外，
  `cmd power wake` / `cmd display` 没有 wake 子命令。
  ⇒ **手机当测试台之前，需要他在开发者选项里打开「USB 调试（安全设置）」**（打开后 `input`、`settings put`
  都通，顺带把横屏与字号那半套也解锁）；或者把系统「屏幕超时」调到最长、跑的时候别锁屏。
  在那之前：手机只能跑「一条命令之内起落」的短判据（`r208` 那 14 条就是在这种状态下一次跑完的）。
- 保活试到见底了，三笔都记下来：① `svc power stayon true` 每 5 s 打一次 ⇒ `mWakefulness` 在
  `Awake` / `Dozing` 之间**来回抖**，不是常亮；② 趁亮的那一拍让页面自己 `setKeepScreenOn(true)`
  （产品功能，`MainActivity.kt:1466` → `FLAG_KEEP_SCREEN_ON`）**不成立** —— 唤醒后压在最上面的是
  `NotificationShade`，`document.visibilityState` 回 `hidden`，旗子随窗口可见性一起失效，屏幕照睡；
  ③ 到后面连「等 10 秒再回话」这一支 evaluate 都不答了（90 s 超时），而同一台机器十几分钟前
  答完过 14 条台账判据。⇒ 闸门脚本 `devtools/phone-awaken.sh` 只当 readiness 检查用：**答话就往下跑，
  不答就退出**，别把这台手机的状态记成产品缺陷。

## 5. 这一批为判据自己付的三条学费

- **拿 `storageVolumes` 断言「点复制诊断会让台账变长」会假红**：`getStorageVolumes(false)`
  （`script.js:2818`）命中页面自己那份 `storageVolumesPayload` 就不再问桥，实测 `n 3 → 3`。
  改成每次必问的 `exportCodecReport`。⇒ 「走没走门面」要挑**没有 JS 缓存**的那一条。
- **runner 用 `tail -1` 取探针输出**：探针返回 pretty JSON（`JSON.stringify(out, null, 1)`）会被截成 `}`，
  数表整张读不回来。探针一律压缩返回、pretty 只进 `console.log`。
- **「冷启动」这件事判据要自己钉住**：runner 重启 APP 不算证据，页面自己的 `performance.now()` 才算 ——
  现在钉住 <120 s，否则台账里的 `first` 可能来自半小时前那次开屏。

## 6. 等真机数回来再做的那一步

诊断里 `bridge …` 那一行若显示 `storageVolumes first` 到几百 ms 以上（或 `appFilesDir first` 更大），
就把 `storageVolumesJson()` 的 `cached ?: computeStorageVolumesJson()` 改成
`cached ?: 空清单`，让第一拍交「正在读盘」而不是把整份清单算在桥线程上；
`appFilesDir()` 同理（它只在开机与导出目录解析时被问一次，先要数才知道值不值得）。
没有那一行数字以前不动 —— 现在的行为（第一次就把清单交齐）对界面是有用的：目录浏览器与「最近目录」chip
第一拍就有内容，改成异步会让首拍空一次。

## 7. 这一轮的验收账（说清楚哪些是量过的）

**量过并 0 红的（都在交付的那一份 1.2.334 上，AVD `emulator-5554`，API 36）**：

- `devtools/r208-verify.sh` 台账判据 **13 条 0 红**（§3）。这 13 条跑完之后又加了一条前置
  「这就是刚起来的那一份页面（`performance.now() < 120 s`）」—— 这条**当天没补上**（环境事故把设备拿走了），
  **2026-11-01 在真机补跑，14 条 0 红**（`performance.now() = 17 555 ms`，见 §4b）。
  注意补跑是在**测试载具**（同一工作树 + `debuggable`）上，不是交付的那一份包；两者的前端字节相同
  （`src/script.js` 自 10:11 未动，两份构建分别在 10:22 与 14:05）。
- `devtools/r206-verify.sh` **18 条 0 红**（R206 §4b：两处判据缺陷改完之后复测）。
- `devtools/r204-scan-cache.sh` **5 条 0 红**（R206 §4 里那条「没能复测」的账，本轮清了）。
  它本轮才跑通的真正原因是夹具步骤后面缺一次冷启动：整棵目录被 adb 删掉重建之后，
  进程手里还握着删除前的列表，`loadTauriDirectory` 每步回 `loaded:false`、基线永远读到 `groups:21`
  （里面带着盘上已经不存在的 `2026-08-02_11-59-*`）。加了 `== 0b) 冷启动` 之后基线第一拍就是 20。
  ⇒ 「换了盘上的结构」这类夹具，**换完必须重开进程**；`scan_index_dirty` 只清清单缓存，不清内存里那份列表。
- `devtools/r208-bridge-cost.js` 数表两拍（§4）。

**没跑成的（不算通过，也不记成缺陷）**：1.2.334 的整套回归 —— `r102-verify`（竖屏 92）、
`r207-verify` / `r207-landscape`（13 + 2）、`r173-verify`（40）、`r102-verify-landscape`（36）、
以及 `r203-verify` / `r204-verify` / `r205-verify` 这三套批判据。
本轮改的正是 `script.js` 的门面（台账），竖屏那一套对它最敏感，所以这一账不能含糊：
`Activity` 确实在前台（`topResumedActivity=com.tdashcam.studio/.MainActivity`、`pidof` 有值、
`webview_devtools_remote_<pid>` socket 也在），但 `Runtime.evaluate` 从某一次起**永远不回话** ——
连 `1+1` 都不答，`force-stop + start` 两轮也没救回来。是这台 AVD 的 WebView 废了，不是包坏
（同一份包在二十分钟前还答完过 r206 那 18 条）。

2026-11-01 补记：手机（`e152f205`）能答 CDP 了（§4b），所以先在上面补跑了台账那一套；
`r203-verify` / `r204-verify` 在手机上**各试两次都是 300 s 超时**，超时原因查清是手机进 Doze
（`mWakefulness=Dozing` ⇒ `/json` 不答），不是判据里挂了 `await`。夹具已经搬过来了
（从 AVD `pull` 再 `push`：`TeslaCamReg` 18 片、`TeslaCamMulti` 144 片；`TeslaCamR203` 18 个 0 字节、
`TeslaCamR204` 900 个 0 字节），所以**下一次只要屏幕别锁，这两套立刻能跑**。
模拟器那半边今天仍然是别的 agent 在用（`mCurrentFocus=com.liangqing.photos`），不去抢。

设备这一轮另外添的两笔账，写在这里免得下次当成产品现象去查：

1. **`/sdcard` 上 `rm` 回 `Bad address`**：r204 夹具（60 个平铺分钟 = 360 个 `touch`）之后
   `adb shell rm` 成片报 `Bad address`，再往后 adb 层整个卡住（`adb devices` 认设备、`shell` 静默无输出）。
   救回来的是 `adb -s emulator-5554 emu restart`（客户机重启，不是杀宿主机进程），起来后 `rm` 正常。
   判据的夹具步骤里那些 `rm` **不许静默失败**：r204 现在会在换完夹具后自己报「目录 20 个（要 20）、平铺 0 个（要 0）」。
2. **外部自动化反复把我们置成 `enabled=3`**：`am start` 回 `Error type 3 Activity class … does not exist`
   而 `pm path` 照样解析得出。r206 / r208 / r207 回归的 runner 现在都在起跑前自己 `pm enable`，
   并且把 `am` 的回执钉成前置（R206 §4b 第 1 条就是这类假绿的代价）。

⇒ **1.2.334 只交 APK（根目录 `Tessera-1.2.334.apk`），不打 tag、不发 Release**：
这一轮改的是桥门面，桌面侧靠「guard 先于计时」这条结构保证不受影响，手机端要的是那 92 条竖屏账 ——
等设备能答话了把上面四套跑完再发。


