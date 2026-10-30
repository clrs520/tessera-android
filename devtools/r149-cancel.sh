#!/usr/bin/env bash
# R149 裁决：取消后 Download 里不许出现「空壳」。判据不看页面回调，只看文件：
#   取消后新出现的 Tessera_*.mp4，要么不存在，要么 > 20000 B（真有帧）。
# 修复前：muxer 一 start 就写 ftyp，取消在头几百毫秒会留下 1KB 左右、没有 moov 的文件。
cd "$(dirname "$0")/.." || exit 1
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
ADB=$(command -v adb)
cdp() { CDP_TIMEOUT_MS=${CDP_TIMEOUT:-120000} node devtools/cdp-eval.mjs "$1" 2>&1 | tail -1; }

lsdl() { "$ADB" -s emulator-5554 shell "ls -l /sdcard/Download/Tessera_*.mp4 2>/dev/null" | tr -d '\r' | awk '{print $5"\t"$NF}'; }
BEFORE=$(lsdl); echo "BEFORE $(echo "$BEFORE" | wc -l) files"

OUT=$(cdp "$(cat devtools/r149-cancel-start.js)"); echo "RUN $OUT"
echo "$OUT" | grep -q '"ok":true' || { echo "FATAL start/cancel did not run"; exit 1; }
sleep 8
AFTER=$(lsdl)
NEW=$(comm -13 <(echo "$BEFORE" | sort) <(echo "$AFTER" | sort) | grep -v '^$')
if [ -z "$NEW" ]; then echo "RESULT no-empty-shell=yes (取消很早就落地，没留下文件)"; exit 0; fi
BAD=""
while IFS=$'\t' read -r size name; do
  [ -z "$name" ] && continue
  if [ "$size" -lt 20000 ]; then BAD="$BAD$size $name"$'\n'; fi
done <<< "$NEW"
if [ -n "$BAD" ]; then echo "RESULT no-empty-shell=no"; printf '%s' "$BAD"; exit 1; fi
echo "RESULT no-empty-shell=yes (新文件都有帧)"
printf '%s\n' "$NEW"
exit 0
