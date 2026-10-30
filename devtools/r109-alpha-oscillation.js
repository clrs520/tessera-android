// 一把尺子，两版各量一次：播放 10 秒里，玻璃的**上屏 alpha** 到底动了多少次、有没有来回。
// 这不是判据套件，是「改前 / 改后」的那组数 —— 用户两次说的「颜色会变、不稳定」能不能收口，
// 只能靠这两个数说话，不能靠我描述规则看起来多稳。
// 同一个节拍同时喂给 1.2.185（34% 缓动 + 0.01 死区）和 1.2.186（变厚立刻 + 0.06 死区 + 稳 4 秒退一档），
// 负载会拉长节拍，但两半都是按 `Date.now()` 数真实秒，所以「10 秒窗口内的变化次数」可比的。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const alphaOf = (sel) => { const el = document.querySelector(sel); if (!el) return null;
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor); if (!m) return null;
        const p = m[1].split(',').map((x) => parseFloat(x));
        return p.length >= 4 ? +p[3].toFixed(4) : 1; };
    for (let i = 0; i < 30 && !(v.eventGroups || []).length; i++) await sleep(500);
    const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')));
    if (document.querySelector('.player-area.empty') && ev) {
        for (let k = 0; k < 3; k++) { try { await v.playEvent(ev.eventId); break; } catch (e) { await sleep(2500); } }
        await sleep(3000);
    }
    if (!v.multiCameraPlayer.isPlaying) { v.multiCameraPlayer.playAll(); await sleep(1500); }
    const out = { version: '待读', samples: 0, series: [] };
    const t0 = Date.now();
    for (let i = 0; i < 50; i++) {
        out.series.push({ t: Date.now() - t0, g: alphaOf('.phone-action-bar'), p: alphaOf('.metadata-panel') });
        await sleep(200);
    }
    out.samples = out.series.length;
    out.src = `${glassState.src}/${glassState.luma}`;
    const tally = (key) => {
        const seq = out.series.map((x) => x[key]).filter((a) => typeof a === 'number');
        let up = 0, down = 0, rev = 0, lastDir = 0;
        for (let i = 1; i < seq.length; i++) {
            const d = +(seq[i] - seq[i - 1]).toFixed(4);
            if (Math.abs(d) < 0.002) continue;
            if (d > 0) up++; else down++;
            if (lastDir && Math.sign(d) !== lastDir) rev++;
            lastDir = Math.sign(d);
        }
        return { changes: up + down, up, down, reversals: rev, min: seq.length ? Math.min(...seq) : null,
            max: seq.length ? Math.max(...seq) : null, distinct: new Set(seq.map((a) => a.toFixed(3))).size };
    };
    out.glass = tally('g');
    out.plate = tally('p');
    // 版本从诊断行读不出来，让调用方自己带上：装机前后各跑一次，把 name 抄进表里。
    out.orient = `${innerWidth}x${innerHeight}@${devicePixelRatio}`;
    return out;
})().catch((e) => ({ probeError: `${e && e.name}: ${e && e.message}` }));
