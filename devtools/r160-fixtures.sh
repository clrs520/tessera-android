#!/usr/bin/env bash
# R160/R161 acceptance fixtures. Run from the repo root on a device with the app fixture tree
# already installed (/sdcard/TeslaCam). The source clip is one 248 KB front file from that tree.
#   bash devtools/r160-fixtures.sh          # split / sidecars / gap (~3 MB)
#   bash devtools/r160-fixtures.sh probe    # 350 clips in one event (~85 MB)
#   bash devtools/r160-fixtures.sh 3k       # 3 000 placeholder events (6 000 tiny files)
#   bash devtools/r160-fixtures.sh many     # 300 real-clip events (~77 MB)
set -euo pipefail
ADB="${ADB:-adb}"
SRC=/sdcard/TeslaCam/RecentClips/2026-10-08_09-00-00-front.mp4

"$ADB" shell 'rm -rf /sdcard/TeslaCamSplit /sdcard/TeslaCamSidecars /sdcard/TeslaCamGap'

# RecentClips across two days, with a >10 min break on the second day.
"$ADB" shell "mkdir -p /sdcard/TeslaCamSplit/RecentClips; \
  for n in 2026-01-01_10-00-00 2026-01-01_10-01-00 2026-01-02_09-00-00 2026-01-02_09-01-00 2026-01-02_09-20-00; do \
    cp $SRC /sdcard/TeslaCamSplit/RecentClips/\$n-front.mp4; done"

# Three valid sidecars + one malformed one.
"$ADB" shell "mkdir -p /sdcard/TeslaCamSidecars/SavedClips; i=0; \
  for n in 2026-02-01_08-00-00 2026-02-02_08-00-00 2026-02-03_08-00-00; do \
    d=/sdcard/TeslaCamSidecars/SavedClips/\$n; mkdir -p \$d; \
    cp $SRC \$d/\$n-front.mp4; i=\$((i+1)); \
    printf '{\"city\":\"City %s\",\"street\":\"Street %s\",\"est_lat\":%s.5,\"est_lon\":120.%s,\"reason\":\"sentry_aware_object_detection\",\"timestamp\":\"2026-02-0%sT08:00:00\"}' \
      \$i \$i \$i \$i \$i > \$d/event.json; done; \
  d=/sdcard/TeslaCamSidecars/SavedClips/2026-02-04_08-00-00; mkdir -p \$d; \
  cp $SRC \$d/2026-02-04_08-00-00-front.mp4; echo '{not json' > \$d/event.json"

# Two 2.73 s seams and one 59.73 s hole.
"$ADB" shell "d=/sdcard/TeslaCamGap/SavedClips/2026-10-10_10-00-00; mkdir -p \$d; \
  for n in 2026-10-10_10-00-00 2026-10-10_10-00-21 2026-10-10_10-00-42 2026-10-10_10-02-00; do \
    cp $SRC \$d/\$n-front.mp4; done"

if [ "${1:-}" = "probe" ]; then
  "$ADB" shell "rm -rf /sdcard/TeslaCamProbe; \
    d=/sdcard/TeslaCamProbe/SavedClips/2026-04-01_08-00-00; mkdir -p \$d; i=0; \
    for h in 08 09 10 11 12 13; do for m in \$(seq -w 0 59); do [ \$i -ge 350 ] && break 2; \
      cp $SRC \$d/2026-04-01_\$h-\$m-00-front.mp4; i=\$((i+1)); done; done"
fi

if [ "${1:-}" = "3k" ]; then
  "$ADB" shell 'rm -rf /sdcard/TeslaCam3k; mkdir -p /sdcard/TeslaCam3k/SavedClips; i=0; \
    for d in $(seq -w 1 25); do for h in 08 09 10 11 12 13 14 15 16 17; do for m in 00 05 10 15 20 25 30 35 40 45 50 55; do \
      i=$((i+1)); n=2026-06-$d\_$h-$m-00; dir=/sdcard/TeslaCam3k/SavedClips/$n; mkdir -p $dir; \
      : > $dir/$n-front.mp4; \
      printf "{\"city\":\"City %s\",\"street\":\"Street %s\",\"reason\":\"sentry_aware_object_detection\"}" $i $i > $dir/event.json; done; done; done'
fi

if [ "${1:-}" = "many" ]; then
  "$ADB" shell 'rm -rf /sdcard/TeslaCamMany; mkdir -p /sdcard/TeslaCamMany/SavedClips; i=0; \
    for d in $(seq -w 1 25); do for h in 08 09 10 11 12 13 14 15 16 17 18 19; do \
      i=$((i+1)); n=2026-03-$d\_$h-00-00; dir=/sdcard/TeslaCamMany/SavedClips/$n; mkdir -p $dir; \
      cp '"$SRC"' $dir/$n-front.mp4; \
      printf "{\"city\":\"City %s\",\"street\":\"Street %s\",\"est_lat\":3.5,\"est_lon\":120.2,\"reason\":\"sentry_aware_object_detection\",\"timestamp\":\"2026-03-%sT%s:00:00\"}" \
        $i $i $d $h > $dir/event.json; done; done'
fi

echo "fixtures ready"
