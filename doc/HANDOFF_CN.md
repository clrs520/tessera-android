# 交接文档 — 特写 / Tessera 安卓版

> 生成：2026-11-03（R216 更新：2026-11-26）。接手请先读 §0、§1、§4，其余按需。
> 目的：让下一个 agent 不必重读几十轮对话就能接着干。**长文不要重抄**，指针在 §6。

## 0. 一句话现状

- 版本 **1.2.344**（`src-tauri/tauri.conf.json`），`main` HEAD = `4a1e511`（R216，已推送）。
  R216 = Rust 索引代码去重 + 14 条单测 + r215 判据半格算法修正 + 扫描缓存归因改口（无可修 bug），
  前端一字未动；交付包 `Tessera-1.2.344.apk`（根目录，同版本 `-testable` 载具也在，
  AVD 上装的就是 testable）。
  **tag 与 Release 仍只有 `v1.2.334`**（GitHub 回读 `sha256:b0907e60…33b48` 与本地一致）——
  335–343 都是同源或小改，不打 tag；要不要把 1.2.343 发出去由他决定。
- 交付包在项目根目录（**不是仓库里**）：`Tessera-1.2.343.apk` 28 580 287 B ·
  md5 `09d09668679ac840391224d899e355c9` · sha256 `2fa7f388…65d83`；同版本可调试载具
  `Tessera-1.2.343-testable.apk` 也在。**旧包一律保留**（根目录现有 30 个 APK，828 MB）。
- **他手机上现在装的是不可调试的 1.2.342**（`dumpsys package` 无 `DEBUGGABLE`），不是 343；
  1.2.343 只装进了本机 AVD。
- 真机验收基线：1.2.334 那一版「十五套 307 条页内判据 0 红」（明细 `doc/ANDROID_CN.md` §9）；
  R209 的四条真机 P0 读数（4K 多路同播 / thumb 升级 / 导出对时 / MIUI 前台服务）都不需要改产品码。
- 最近四轮（细节都在 `doc/ANDROID_CN.md` 对应小节，这里只留一行）：
  - **R212** 未完成的导出残片（`.mp4.part`）手动清理，两道原生闸门 + 二次点击确认。
  - **R213** 「复制诊断」口径：`listLast`、`n/a` 不再印成 0 / `-`。
  - **R214** 底栏选中态换成**一枚会滑动的透镜**（A+C）；`--safe-bottom` 的指控**撤回**
    （本来就是 `calc(10px + var(--safe-bottom))`）。
  - **R215** 设置面板里「清理残片 + 关于」配成一行（`关于` 不再独占整行）。

## 1. 环境与设备（不先看这条会白跑半天）

- **仓库**：`C:\Users\Xingcong\Documents\Qoder\2026-10-08\bd860998\TDashcamStudio`（GitHub `clrs520/tessera-android`）。
- **版本号唯一来源**：`src-tauri/tauri.conf.json`。构建 `bash devtools/build-apk.sh`（约 4–12 min）；
  成功只认日志里 **`Finished 1 APK`** + APK mtime 变化（`… | tail` 会吞退出码）。
  可调试载具：`TDASHCAM_TEST_DEBUGGABLE=1 bash devtools/build-apk.sh`（同一把 keystore，`install -r` 不丢数据）。
- **真机（小米 23127PN0CC / `e152f205`）—— 此刻是断的**：上一轮收尾执行了 `adb disconnect`，
  之后 MIUI 的无线调试端口变了，`adb mdns services` 也搜不到。
  ⇒ **要跑真机判据必须先请他重新打开「设置 → 开发者选项 → 无线调试」并给配对码/端口**，
  再 `adb pair` → `adb connect`。**OTG 那块 1.9 TB 盘（`/storage/B086-9116`）当时还插着，我没拔。**
- **跑判据的固定环境**：`ADB_SERIAL=<serial>`、`CDP_PORT=9450`（`9333` 被本机另一个 adb.exe 占着）；
  链路要求**页面在前台且屏幕醒着**，否则 `/json` 不答 = 超时不是缺陷。
- **前台会被抢**（本轮实测两次）：`co.slidebox`（相册整理）与 MIUI「屏幕使用时长统计」会自己跳到前台，
  把我们的 WebView 冻住，还会吃掉 `input tap`。⇒ 跑前 `am force-stop` 第三方包 + 确认 `topResumedActivity`，
  每一步设备操作前 `ensure_conn`。
- **AVD `emulator-5554` 是共享的**（另有项目在用：`com.liangqing.photos` / `co.slidebox`），别去抢。
  R216（2026-11-26）冷启动救活过一次，判据链路（CDP 9450）全程可用，见 `# R216` §0 的两个环境坑：
  **整个包被 shell disable 时 `am start` 报 Activity does not exist，要包级 `pm enable`**；
  跑 r102 基准要用有真片的夹具（`TeslaCamMulti` 144 段全可播；`TeslaCam`/`TeslaCamR156` 是 0 字节桩）。
- **复原清单**（每次跑完）：`stay_on_while_plugged_in` 归 0、方向与显示尺寸复原、删掉**我造的**夹具、
  装回不可调试正式包、`forward --remove-all`。
  **`font_scale` 绝不写**（只允许在 AVD 上写；判据里那条 N6 在真机上要一起标 n/a，不许假绿）。
- **MIUI 不许降级**（`INSTALL_FAILED_VERSION_DOWNGRADE`，`-d` 无效）⇒ 版本号只往前走，
  没验过的改动别抬进版本号。

## 2. 代码入口与硬约束

- 前端几乎全在 `src/script.js`（1.4 MB 单文件）+ `src/styles.css`；原生在
  `src-tauri/gen/android/app/src/main/java/com/tdashcam/studio/MainActivity.kt`（同步桥 + 取帧 + 导出服务）
  与 `src-tauri/src/lib.rs`（扫描 / 侧车 / `.part` 清理 / 流媒体白名单）。
- **桌面行为一字不改**，手机逻辑一律门控（`isTouchShellRuntime()` / `html.touch-ui` /
  `isPhoneSurfaceLayout()` / `html.sheet-mode`）。改 UI 先问「这条在桌面上会不会生效」。

## 3. 判据怎么跑（不要重造）

- 页内判据在 `devtools/r*-verify.js` / `r*-*.js`，用 `devtools/cdp-eval.mjs --file <script>` 注入；
  带夹具或多步的用同名 `.sh` runner。`cdp-eval` 默认 10 s，长测量要页内 detached + 轮询。
- 纪律：**先让判据在旧包上红、再改、再绿**；红必须是**同状态把旧值刷回去**重新采的，不是猜的；
  报告只写量到的数，写进文档/界面的数字必须当场测过。
- 假绿/假红清单在 memory 的「模拟器验收假信号」—— 写新判据前必读（尤其「判据不自己造前置」那类）。
  本轮新增两条：**竖屏抽屉（sheet）整片盖住底栏**，在抽屉那一档问「标签中心命中谁」必然命中抽屉底部；
  **⋮ 面板展开时整块进 `.header-collapsed`，图标是 17 px 档**，「同一套」要拿隔壁行当基准比而不是钉死像素。

## 4. 未了事项（按优先级）

1. **等他（阻塞）**：重开无线调试 → 装 1.2.343 载具 → 补跑 `devtools/r215-settings.js`
   （断言：清理残片与关于同行等宽且都是半格、语言那一格 = 清理残片那一格＝反证「不是被英文标签挤」、
   面板无半格独行、图标同一套、触控 ≥40）+ 竖屏/横屏双主题截图。
   **R215 目前只有目视证据**（AVD 竖屏截图），数值判据没跑成 —— 两面都断了，见 §1。
2. **等那块盘（阻塞）**：R211 两条 —— ① 18 小时级事件的界面（盘上已经没有那条 1 100 段事件，要重新造）；
   ② `peExportSizeEstimate` 在真片上的复测。这块 1.9 TB 一天掉三次，
   跑前先 `sm list-volumes` + 读到 `videoWidth>0` 再下结论。
3. ~~**冷开的大头已改口，还没做**~~ → **R216 已改口并结案（AVD 实测，真盘待定案）**：
   下拉刷新**不会**逐目录 readdir（401/401 目录清单缓存命中），它只付每目录一次 mtime stat；
   276.7 s 是那次挂载后第一次全树触达的冷 FUSE stat 往返，8.75 s 是热缓存，同一件事的冷/热两档。
   「刷新后 sealed=false」= r210/r211 harness 中间标过脏（`scan_index_dirty` 按设计禁封存），
   AVD 已复现且不标脏时 sealed=true 正常。**没有可修的产品 bug**；真盘回来后补一个
   「不标脏的刷新→普通扫」读数即可定案。明细 `doc/ANDROID_CN.md` `# R216`。
4. **未结的异常**（都不是本轮改出来的，但都还没解释）：~~扫描成功后 `sealed=false` 没查~~
   （R216 已解释，见上条）；R210 里 590 个文件的 `reads` 缺口；剪辑面板标签偶尔 `--:--:--`。
   R216 新增一条挂起：**r102-verify 在 AVD 上 91/2**，两条 `.menu-lifted` 红疑为套件内状态残留
   （干净状态独立探针读到 1700，套件跑过长按菜单条目后再量是 50），与 1.2.343 前端无关，待查。
5. **是否把 1.2.343 发成 tag/Release**：等他决定（现在只有 `v1.2.334`）。
6. **仍欠他一个确认**（R209 遗留）：复原时我误删了他手机的 `system/font_scale`（现值 `null` = 默认 1.0），
   请他去「设置 → 显示 → 字体大小」看一眼滑块是否在他原来的位置。
7. 小账：停止任务时诊断里 `darkSome` / `cancelledKept` 的措辞。

## 5. 工作区文件状态（2026-11-03 清理过）

- **已删**（都是无引用的会话垃圾，删前逐条 grep 过 `doc/*.md`、`README*`、`devtools/`）：
  根目录 31 张 R28–R34 旧截图（16 MB）、`build-111.log`、`tmp/`（155 MB 探针与 `.so` 副本）。
- **已归位**：仓库里那份 `TDashcamStudio/Tessera-1.2.328.apk`（唯一一份 1.2.328）**复制**到根目录，
  仓库原件没动。
- **故意留着、等他拍**：
  - `TDashcamStudio-upstream-git.bak`（44 MB，上游 `.git` 的裸备份，别处没有副本）——删了就没了，**没删**。
  - `--push/`（6.2 MB，92 个 mp4）是 `make-teslacam-fixture.js --push` 的产物，可用脚本重造；目录名本身是个歧义源。
  - `dev-bug-review-notes.md`（10-17 的 Rust 自查中间产物，结论已进 R143/R147 审计）。
  - 30 个历史 APK（828 MB）与 `-testable` 载具（约 237 MB）——按「旧包一律保留」没动。
  - `src-tauri/target` **10 GB** + `gen/android/app/build` 798 MB 是 cargo/gradle 缓存，
    删了要整包重建（一次 4–12 min），**没删**。

## 6. 指针（别重抄这些）

- 按轮次的技术长文：`doc/ANDROID_CN.md`（最新两节 = `# R214`、`# R215`）。
- 逐轮根因、判据坑、已判不采信清单：memory 索引
  `~/.qoder-cn/projects/C--Users-Xingcong-Documents-Qoder-2026-10-08-bd860998/memory/MEMORY.md`。
- 本轮改动：`git log --oneline -8`（`78e8af3` R215 / `17a0fe9` R214 / `e82f429` R213 撤回 /
  `4738b7f` R213 / `1a0b398` R212 / `f6d6a4c` R210 判不采纳）。
- 发布：`gh release view v1.2.334`。

## 7. suggested skills（下一个 agent 直接点名用）

| skill | 什么时候用 |
|---|---|
| `/handoff` | 再交接时（本机已装，**只能由人显式调用**） |
| `superpowers:systematic-debugging` | 「卡住 / 卡顿 / 超时」先按它走，别猜 |
| `superpowers:test-driven-development` | 改 `script.js` 前（判据先红） |
| `superpowers:verification-before-completion` | 报「改完 / 验过」之前 |
| `design-review:accessibility-review` / `design-review` | 动 UI、对比度、字号档位时 |
| `mobile-use` | 需要真机语义点击 / 截图证据时 |

## 8. 安全红线（无例外）

- 密钥只在 `keystore.properties` / `local.properties`，**不打印、不写文档、不进 git**。
- 回环流媒体 token 等于**整文件读取能力**，**不许出现在任何探针输出或文档**里。
- 不把录像、可识别路径上传到第三方服务。
