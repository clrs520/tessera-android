const fs = require('fs');
const p = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js';
let t = fs.readFileSync(p, 'utf8');
function rep(a, b) {
    if (!t.includes(a)) { console.error('MISSING:', a.slice(0, 100)); process.exit(1); }
    t = t.replace(a, b);
}

// ---- i18n ----------------------------------------------------------------
rep('        refreshScanning: "Scanning…",\n',
    '        refreshScanning: "Scanning…",\n' +
    '        scanFilesSeen: "Scanned {n} files",\n' +
    '        scanSidecars: "Reading event info {n}/{m}",\n');
rep('        refreshScanning: "扫描中…",\n',
    '        refreshScanning: "扫描中…",\n' +
    '        scanFilesSeen: "已扫描 {n} 个文件",\n' +
    '        scanSidecars: "读取事件信息 {n}/{m}",\n');

// ---- skeleton: a line that can carry the count ---------------------------
rep("        const wrap = document.createElement('div');\n        wrap.className = 'scan-skeleton';\n",
    "        const wrap = document.createElement('div');\n" +
    "        wrap.className = 'scan-skeleton';\n" +
    "        // R159: a 1.9 TB stick walks tens of thousands of entries before the bridge answers.\n" +
    "        // This line counts them while the cards are still placeholders.\n" +
    "        const status = document.createElement('div');\n" +
    "        status.className = 'scan-skeleton-status';\n" +
    "        status.textContent = i18n[this.currentLanguage].refreshScanning;\n" +
    "        wrap.appendChild(status);\n" +
    "        this.scanStatusEl = status;\n");
rep("    clearScanSkeleton() {\n        document.querySelectorAll('.scan-skeleton').forEach(el => el.remove());\n    }",
    "    clearScanSkeleton() {\n        document.querySelectorAll('.scan-skeleton').forEach(el => el.remove());\n        this.scanStatusEl = null;\n    }");

// ---- poller around the native walk --------------------------------------
rep("        document.body.appendChild(loadingDiv);\n\n        // On a phone the row that was just tapped is the only surface the wait can be shown on:",
    "        document.body.appendChild(loadingDiv);\n\n" +
    "        // R159: the native walk reports its count through `scan_progress`; poll it while the\n" +
    "        // bridge is still answering so the skeleton says how far it got.\n" +
    "        const scanPoll = isTouchShellRuntime() ? setInterval(() => {\n" +
    "            const status = this.scanStatusEl;\n" +
    "            if (!status) return;\n" +
    "            nativeInvoke('scan_progress').then(progress => {\n" +
    "                if (!this.scanStatusEl || !progress || !Number.isFinite(progress.files)) return;\n" +
    "                this.scanStatusEl.textContent = String(i18n[this.currentLanguage].scanFilesSeen)\n" +
    "                    .replace('{n}', progress.files.toLocaleString());\n" +
    "            }).catch(() => { /* the bridge may be between scans */ });\n" +
    "        }, 500) : null;\n\n" +
    "        // On a phone the row that was just tapped is the only surface the wait can be shown on:");
rep("            if (loadingDiv) loadingDiv.remove();\n        }",
    "            if (loadingDiv) loadingDiv.remove();\n            if (scanPoll) clearInterval(scanPoll);\n        }");

// ---- sidecar stage in processFiles -------------------------------------
rep("            }));\n        }\n\n        const thumbFiles = files.filter(f => f.name === 'thumb.png');",
    "            }));\n" +
    "            // R159: the count of event.json reads, on the same skeleton line. A few hundred\n" +
    "            // events are the second wait after the walk; a 24 h stick can be three thousand.\n" +
    "            if (this.scanStatusEl && withLocation.length > 24) {\n" +
    "                const seen = Math.min(withLocation.length, i + 6);\n" +
    "                if (seen % 24 < 6 || seen === withLocation.length) {\n" +
    "                    this.scanStatusEl.textContent = String(i18n[this.currentLanguage].scanSidecars)\n" +
    "                        .replace('{n}', seen).replace('{m}', withLocation.length);\n" +
    "                }\n" +
    "            }\n" +
    "        }\n\n        const thumbFiles = files.filter(f => f.name === 'thumb.png');");

// ---- lazy duration probe on the continuous player ----------------------
rep("    async calculateEventDurations(event) {",
    "    /**\n" +
    "     * R159 — fill in the clips this event's scan never measured. The scan's probe budget only\n" +
    "     * covers the newest minutes, so on a full stick most Sentry events would book 60 s; `mvhd`\n" +
    "     * is three seeks per clip, so the event answers for itself in one bridge call before the\n" +
    "     * ruler is built. Returns true when anything was learned.\n" +
    "     */\n" +
    "    async probeUnmeasuredClips(event) {\n" +
    "        if (!isTouchShellRuntime() || !event?.segments?.length) return false;\n" +
    "        const missing = [];\n" +
    "        for (let i = 0; i < event.segments.length && missing.length < 300; i += 1) {\n" +
    "            const segment = event.segments[i];\n" +
    "            if (Number.isFinite(segment.duration) && segment.duration > 0) continue;\n" +
    "            const file = segment.files?.front || Object.values(segment.files || {})[0];\n" +
    "            if (file?.path) missing.push({ index: i, path: file.path });\n" +
    "        }\n" +
    "        if (!missing.length) return false;\n" +
    "        let values;\n" +
    "        try {\n" +
    "            values = await nativeInvoke('probe_durations', { paths: missing.map(item => item.path) });\n" +
    "        } catch (e) {\n" +
    "            console.warn('[Durations] native probe failed:', e);\n" +
    "            return false;\n" +
    "        }\n" +
    "        if (!Array.isArray(values)) return false;\n" +
    "        let learned = false;\n" +
    "        missing.forEach((item, k) => {\n" +
    "            const seconds = (Number(values[k]) || 0) / 1000;\n" +
    "            if (seconds > 0) {\n" +
    "                event.segments[item.index].duration = seconds;\n" +
    "                learned = true;\n" +
    "            }\n" +
    "        });\n" +
    "        return learned;\n" +
    "    }\n\n" +
    "    async calculateEventDurations(event) {");
rep("        if (!event.totalDuration || event.totalDuration <= 0) {\n            await this.continuousPlayer.calculateEventDurations(event);\n        }",
    "        // R159: the scan measures the newest minutes only; the event answers for its own clips\n" +
    "        // before the ruler is built, so gaps and trims use real lengths too.\n" +
    "        if (await this.continuousPlayer.probeUnmeasuredClips(event)) event.totalDuration = 0;\n" +
    "        if (!event.totalDuration || event.totalDuration <= 0) {\n" +
    "            await this.continuousPlayer.calculateEventDurations(event);\n" +
    "        }");

// ---- language change repaints the two new rows -------------------------
rep("        this.updateTapBehaviorLabel?.();\n        this.updateThemeChoice?.();",
    "        this.updateTapBehaviorLabel?.();\n" +
    "        this.updateGapMarkLabel?.();\n" +
    "        this.updateRecentSplitLabel?.();\n" +
    "        this.updateThemeChoice?.();");

fs.writeFileSync(p, t);
console.log('ok');
