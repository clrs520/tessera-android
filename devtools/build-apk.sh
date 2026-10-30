#!/usr/bin/env bash
# Full universal APK build. Run from anywhere; the project path is absolute because the Node/Git-Bash
# working directory is not stable across tool calls.
set -euo pipefail
export ANDROID_HOME="C:/Users/Xingcong/AppData/Local/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
cd "C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio"
npx tauri android build --apk true --target aarch64 x86_64
