# 交接文档 — 特写 / Tessera 安卓版

> 生成：2026-11-01（顺手接手的 agent 请先读 §0、§1、§6，其余按需）。
> 目的：让下一个 agent 不必重读几十轮对话就能接着干。**长文不要重抄**，指针在 §7。

## 0. 一句话现状

- 版本 **1.2.334 已发**：tag `v1.2.334`、Release 挂着不可调试的 `Tessera-1.2.334.apk`
  （GitHub 回读 `sha256:b0907e60…33b48` 与本地一致）；`main` 最新提交 `d6af623`。
- 真机（小米 23127PN0CC / `e152f205`）**十五套 307 条页内判据 0 红**（明细见 `doc/ANDROID_CN.md` §9）。
- 这一版只加了「桥耗时台账」这件量具，**没有改线程模型**（真机冷启动 `storageVolumes` 241.6 ms，门槛写的是几百 ms）。

## 1. 环境与设备（不先看这条会白跑半天）

- **仓库**：`C:\Users\Xingcong\Documents\Qoder\2026-10-08\bd860998\TDashcamStudio`（GitHub `clrs520/tessera-android`）。
  交付包不放仓库里，放**上一级目录** `bd860998/Tessera-<版本>.apk`，旧包一律保留。
- **版本号唯一来源**：`src-tauri/tauri.conf.json`。
- **构建**：`bash devtools/build-apk.sh`（约 12 min）。成功只认日志里 **`Finished 1 APK`** + APK mtime 变化；
  `… | tail` 会吞退出码，别只看退出码。
- **真机测试台**（规矩在 memory 的「真机测试台的规矩」）：必带 `ADB_SERIAL=e152f205`、`CDP_PORT=9450`
  （`9333` 被本机另一个 adb.exe 占着）；链路要求**页面在前台且屏幕醒着**，否则 `/json` 不答 = 超时不是缺陷；
  跑完把 `stay_on_while_plugged_in` 归 0、方向与显示尺寸复原、**别写 `font_scale`**。
- **手机当前装的是不可调试的正式包** ⇒ 没有 CDP。要跑判据先造测试载具：
  `TDASHCAM_TEST_DEBUGGABLE=1 bash devtools/build-apk.sh`（同一把 release keystore，`adb install -r` 不丢数据）。
- **模拟器 `emulator-5554` 不归这个项目**：另一个 agent 的项目（`com.liangqing.photos`）在用，别去抢；
  `r206-verify` 这类需要 `adb root` 拨钟的判据只能在（自己的）模拟器上跑。

## 2. 代码入口

- 前端几乎全在 `src/script.js`（1.4 MB 单文件）+ `src/styles.css`；原生在
  `src-tauri/gen/android/app/src/main/java/com/tdashcam/studio/MainActivity.kt`（同步桥 + 取帧 + 导出服务）。
- **硬约束：桌面行为一字不改**，手机逻辑一律门控（`isTouchShellRuntime()` / `html.touch-ui` /
  `isPhoneSurfaceLayout()` / `html.sheet-mode`）。改 UI 时先问「这条在桌面上会不会生效」。

## 3. 判据怎么跑（不要重造）

- 页内判据在 `devtools/r*-verify.js`，用 `devtools/cdp-eval.mjs` 注入；带夹具/多步的用同名 `.sh` runner。
- 纪律：**先让判据在旧包上红、再改、再绿**；报告只写量到的数；写进文档/界面的数字必须当场测过。
- 已知的假绿/假红清单在 memory 的「模拟器验收假信号」一栏 —— 写新判据前必读（尤其「判据不自己造前置」那类）。

## 4. 未了事项（按优先级）

1. **OTG 1.9 TB 那一拍**：他在准备「复制诊断」的数据。拿到后看 `bridge (ms the JS thread waited …)` 里
   `storageVolumes first` 是否到几百 ms —— **到了才动线程模型**，否则不动（现在的行为对首屏是有用的）。
2. **`R206 §5` 的 `.part` 回收策略**：需要他拍板（这是删除类行为，按他的规矩要给显式开关，不许代推）。
3. 停止任务时诊断里 `darkSome` 与 `cancelledKept` 的措辞（小账，未结）。
4. **P0 真机验收**：4K 事件、保存进度准确性、1.9 TB 盘首屏体验。

## 5. 下一步建议

- 真机独有的计时验收：六路播放流畅度、导出耗时（硬件编解码，模拟器量不到）。
- 或继续按轮次审计（上一轮是 R208，编号往后排）。

## 6. suggested skills（下一个 agent 直接点名用）

| skill | 什么时候用 |
|---|---|
| `/handoff` | 再交接时（本机已装，**只能由人显式调用**） |
| `superpowers:systematic-debugging` | 遇到"卡住/卡顿/超时"先按它走，别猜 |
| `superpowers:test-driven-development` | 改 `script.js` 前 |
| `design-review:accessibility-review` / `design-review` | 动 UI、对比度、字号档位时 |
| `better-harness:init` | 想生成/刷新仓库 `AGENTS.md` 时 |
| `mobile-use` | 需要真机语义点击/截图证据时 |

## 7. 指针（别重抄这些）

- 按轮次的技术长文：`doc/ANDROID_CN.md`（R208 那一节 + §9 验收账）。
- 逐轮根因、判据坑、已判不采信清单：memory 索引
  `~/.qoder-cn/projects/C--Users-Xingcong-Documents-Qoder-2026-10-08-bd860998/memory/MEMORY.md`。
- 本轮改动：`git log --oneline -10`（`d6af623` 修两处 runner 缺 `ADB_SERIAL`；`c809354` 真机验收账；
  `03cea42` 交付记录；`77dac28` 测试载具开关）。
- 发布：`gh release view v1.2.334`。

## 8. 安全红线（无例外）

- 密钥只在 `keystore.properties` / `local.properties`，**不打印、不写文档、不进 git**。
- 回环流媒体 token 等于**整文件读取能力**，**不许出现在任何探针输出或文档**里。
- 不把录像、可识别路径上传到第三方服务。
