#!/usr/bin/env bash
# 真机验收夹具（R209）：两份树，专门造 AVD 造不出来的形状。
#   TesseraCam4K  —— Sentry 的形状：front 是 4K，其余三路仍是 1280x576，外加 128x83 的 thumb.png
#   TesseraCam10m —— 单段 10 分钟的事件，用来给「导出 10 分钟对时」一个能核对的长度
# 用法：  DEV=e152f205 bash devtools/make-phone-acceptance.sh [--push]
set -euo pipefail
DEV="${DEV:-e152f205}"
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="${ROOT:-/tmp/phone-acceptance}"

if [ -z "${FFMPEG:-}" ]; then
  FFMPEG="$(command -v ffmpeg 2>/dev/null || true)"
fi
if [ -z "${FFMPEG:-}" ] && [ -x "/c/Users/Xingcong/AppData/Local/Programs/ffmpeg/bin/ffmpeg.exe" ]; then
  FFMPEG="/c/Users/Xingcong/AppData/Local/Programs/ffmpeg/bin/ffmpeg.exe"
fi
if [ -z "${FFMPEG:-}" ]; then
  echo "没有 ffmpeg：这一份夹具必须有真帧（header-only 占位片测不了 4K），先装 ffmpeg。" >&2
  exit 1
fi

stamp() { date -d "$1" '+%Y-%m-%d_%H-%M-%S'; }

# ---- 4K Sentry 事件：front 4K，其余 1280x576，60 秒 ----------------------------------------
S4K="$ROOT/TesseraCam4K/SentryClips/$(stamp '1 day ago')"
mkdir -p "$S4K"
echo "  4K front -> $S4K"
"$FFMPEG" -hide_banner -loglevel error -y \
  -f lavfi -i "testsrc2=size=3840x2160:rate=30:duration=60" \
  -f lavfi -i "anullsrc=r=48000:cl=mono" -shortest \
  -c:v libx264 -preset veryfast -crf 30 -pix_fmt yuv420p -g 30 \
  -c:a aac -b:a 64k -movflags +faststart \
  "$(cygpath -w "$S4K/$(basename "$S4K")-front.mp4")"
# `getCameraType` 认的是 Tesla 的真名：`-left.mp4` 在它眼里「不是任何一路相机」，会被整片丢掉。
for cam in left_repeater right_repeater back; do
  "$FFMPEG" -hide_banner -loglevel error -y \
    -f lavfi -i "testsrc2=size=1280x576:rate=30:duration=60" \
    -f lavfi -i "anullsrc=r=48000:cl=mono" -shortest \
    -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -g 30 \
    -c:a aac -b:a 64k -movflags +faststart \
    "$(cygpath -w "$S4K/$(basename "$S4K")-$cam.mp4")"
done
# 真车的 thumb.png 是 128x83 的小灰图；R156 的原生取帧要把它换成 320 px 真帧。
"$FFMPEG" -hide_banner -loglevel error -y -f lavfi -i "color=c=gray:size=128x83:duration=1" \
  -frames:v 1 "$(cygpath -w "$S4K/thumb.png")"

# ---- 10 分钟单段事件：六路都是 1280x576 ------------------------------------------------------
S10="$ROOT/TesseraCam10m/SavedClips/$(stamp '2 days ago')"
mkdir -p "$S10"
echo "  10 min -> $S10"
for cam in front back left_repeater right_repeater left_pillar right_pillar; do
  "$FFMPEG" -hide_banner -loglevel error -y \
    -f lavfi -i "testsrc2=size=1280x576:rate=30:duration=600" \
    -f lavfi -i "anullsrc=r=48000:cl=mono" -shortest \
    -c:v libx264 -preset veryfast -crf 28 -pix_fmt yuv420p -g 30 \
    -c:a aac -b:a 64k -movflags +faststart \
    "$(cygpath -w "$S10/$(basename "$S10")-$cam.mp4")"
done

du -sh "$ROOT"/TesseraCam* 2>/dev/null || true

if [ "${1:-}" = "--push" ]; then
  for name in TesseraCam4K TesseraCam10m; do
    MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" push "$ROOT/$name" /storage/emulated/0/ >/dev/null
    "$ADB" -s "$DEV" shell "find /storage/emulated/0/$name -type f | wc -l"
  done
  # 让 MediaStore 认账，否则应用侧的卷扫描可能看不见新推的文件。
  "$ADB" -s "$DEV" shell "am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///storage/emulated/0/TesseraCam4K" >/dev/null 2>&1 || true
  echo "pushed."
fi
