#!/bin/bash
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-17.0.20.101-hotspot"
export ANDROID_HOME="C:/Users/Xingcong/AppData/Local/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export NDK_HOME="$ANDROID_HOME/ndk/27.2.12479018"
export PATH="/c/Program Files/nodejs:$HOME/.cargo/bin:/c/Users/Xingcong/AppData/Local/Microsoft/WinGet/Packages/BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bb/mingw64/bin:$ANDROID_HOME/platform-tools:$PATH"
cd "C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio"
npx tauri android build --apk true --target aarch64 x86_64
echo "TAURI_BUILD_EXIT=$?"
