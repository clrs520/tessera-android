# 特写 · Tessera (Android)

An Android port of **[TDashcam Studio](https://github.com/DeaglePC/TDashcamStudio)** — synchronized playback of Tesla's six dashcam cameras (front, back, left, right, left B-pillar, right B-pillar) with the driving-data overlay, built as a [Tauri 2](https://tauri.app) app.

<p align="center">English | <a href="README_CN.md">简体中文</a></p>

## Upstream & attribution

This repository is a **fork** of **[DeaglePC/TDashcamStudio](https://github.com/DeaglePC/TDashcamStudio)**
(a fork of [DeaglePC/TeslaCamPlayer](https://github.com/DeaglePC/TeslaCamPlayer) before it).
The desktop viewer, the TeslaCam metadata/SEI decoding, the UI and the export design all come from
that project. This fork adds an Android target and the phone-side machinery described below.

- Upstream author: **DeaglePC** and the TDashcam Studio contributors
- License: **GNU AGPL-3.0** (unchanged — see [LICENSE](LICENSE))
- As required by AGPL §5/§13: this is a modified version; the complete corresponding source is this
  repository. If you run a modified version as a network service, you must offer its source too.

## What this fork changes

Everything below is **gated to the touch shell**; the desktop build behaves exactly as upstream.

- **Android target** (arm64-v8a + x86_64) with a phone-first UI layer: bottom action bar, drawer
  navigation, touch gestures, iOS-style sheets, safe-area handling.
- **External storage / USB OTG**:
  - streaming scan in Rust with progressive list rendering (`scan-batch` → cards while walking);
  - per-drive **size index** and **directory-listing cache** (invalidated by directory mtime, by
    re-mount, or when the app itself deletes something), so a re-scan of a 61k-file drive drops from
    ~30 s to ~1 s;
  - background scanning with a `dataSync` foreground service, `MEDIA_*` mount receiver and a
    `USB_DEVICE_ATTACHED` filter, so plugging the drive in refreshes (or launches) the app;
  - pull-to-refresh that keeps the list and the scroll position.
- **Native export** (`MediaCodec` + GL composition) and **native thumbnails**
  (`MediaMetadataRetriever`, with a disk cache), because the WebView already holds every hardware
  decoder slot while six feeds play.
- **Diagnostics**: one-tap copyable report (timings, queue depths, geometry, volume/mount chain).
- **Engineering log**: [`doc/ANDROID_CN.md`](doc/ANDROID_CN.md) — per-round root causes,
  measurements and acceptance criteria (Chinese).

## Build

Prerequisites: Node 20+, Rust (stable), Android SDK 36, NDK 27, JDK 17.

```bash
# full universal release APK (frontend is embedded into the Rust library)
bash devtools/build-apk.sh
# → TDashcamStudio/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

Release signing reads `TDashcamStudio/src-tauri/gen/android/app/keystore.properties`
(`storeFile` / `storePassword` / `keyAlias` / `keyPassword`). That file and the keystore itself are
**not** committed; without it the build produces an unsigned APK.

Desktop:

```bash
cd TDashcamStudio
npm install
npm run tauri build
```

## Repository layout

| Path | What |
|---|---|
| `TDashcamStudio/` | the app (Tauri 2 crate, frontend in `src/`, Android project in `src-tauri/gen/android`) |
| `doc/ANDROID_CN.md` | the Android port engineering log |
| `devtools/` | acceptance probes, build script, CDP/adb helpers used to verify builds on a device |

## License

GNU AGPL-3.0 — see [LICENSE](LICENSE). Copyright belongs to the upstream authors and
the contributors of this fork.
