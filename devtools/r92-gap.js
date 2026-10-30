// R92 pre-work: the 车速 column is reserved against `888.8`, so at a real speed the unit sits at the
// right edge of a mostly-empty box. This measures the gap the eye actually sees, for the current
// layout and three candidates, at both the emulator's 720p and a phone's 1080p — and then paints the
// four of them at true scale so the choice is made by looking, not by reading numbers.
// Writes nothing to the app; the mockup canvas is removed at the end.
(async () => {
    const FRAME_H = [720, 1080];
    const SPEEDS = ['5.6', '9.4', '15.6', '42.8', '104.7'];
    const CLOCK = '2026-10-09 10:00:00';
    const L = { speed: 0.032, clock: 0.019, lineHeight: 1.26 };
    const REF_NOW = '888.8';
    const REF_NARROW = '199.9';
    const UNIT = 'km/h';

    const scratch = document.createElement('canvas');
    const ctx = scratch.getContext('2d');
    const w = (text, px, bold) => {
        ctx.font = `${bold ? '700' : '400'} ${px}px sans-serif`;
        return ctx.measureText(text).width;
    };
    const locked = (text, px, ref) => Math.max(w(text, px, true), w(ref, px, true));

    const out = { cases: [] };
    FRAME_H.forEach(fh => {
        const sp = L.speed * fh, ck = L.clock * fh;
        const space = sp * 0.12;
        const row = { frameH: fh, speedPx: +sp.toFixed(1), unitPx: +(ck * 0.72).toFixed(1),
            gapPx: {}, unitX: {} };
        const variants = {
            now: (t) => locked(t, sp, REF_NOW),
            narrowRef: (t) => locked(t, sp, REF_NARROW),
            rightAlign: (t) => locked(t, sp, REF_NOW),
            hug: (t) => w(t, sp, true),
        };
        Object.entries(variants).forEach(([name, adv]) => {
            // The gap the eye sees between the last digit and the unit. Left-aligned in the box, that
            // is the unused tail of the box plus the run's own space; right-aligned, or with no box at
            // all, it is just the space.
            const gaps = SPEEDS.map(t => +((name === 'rightAlign' || name === 'hug')
                ? space : adv(t) - w(t, sp, true) + space).toFixed(1));
            const xs = SPEEDS.map(t => {
                let x = w(CLOCK, ck, false) + ck * 0.28;
                return +(x + adv(t)).toFixed(1);
            });
            // What right-aligning trades: the empty space moves to the *left* of the number, so the
            // digits' own left edge is what wanders inside the reserved box.
            const lefts = SPEEDS.map(t => +(adv(t) - w(t, sp, true)).toFixed(1));
            row.gapPx[name] = { min: Math.min(...gaps), max: Math.max(...gaps), perSpeed: gaps };
            row.unitX[name] = { jitter: +(Math.max(...xs) - Math.min(...xs)).toFixed(1) };
            row.digitLeftDrift = row.digitLeftDrift || {};
            row.digitLeftDrift[name] = +(Math.max(...lefts) - Math.min(...lefts)).toFixed(1);
        });
        out.cases.push(row);
    });

    // The strip: four variants × two readings (a short one and a long one), drawn at true 1080p scale
    // and then fitted to the phone's width, so what is judged is the layout, not the zoom.
    const H = 1080, sp = L.speed * H, ck = L.clock * H;
    const space = sp * 0.12;
    const names = ['now', 'narrowRef', 'rightAlign', 'hug'];
    const labels = { now: '现在：锁定 888.8，数字左对齐（单位被推到格子右沿）',
        narrowRef: 'B 把参考收到 199.9（等宽数字，量出来和现在一模一样 —— 无效）',
        rightAlign: 'A 数字右对齐到锁定格（单位钉住，间隙恒为一个 space）',
        hug: 'C 单位紧跟数字（最紧凑，但换位数时整块会横移）' };
    const PICKS = ['9.4', '104.7'];
    const canvas = document.createElement('canvas');
    const rowH = sp * L.lineHeight * 1.55;
    const labelH = 26;
    const INK_W = 700;
    canvas.width = INK_W;
    canvas.height = Math.round(rowH * names.length * PICKS.length
        + labelH * names.length + 6);
    canvas.style.cssText = `position:fixed;left:0;top:0;z-index:99999;width:400px;`
        + `height:${Math.round(400 * canvas.height / canvas.width)}px;background:#000;`;
    const c = canvas.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, canvas.width, canvas.height);
    names.forEach((name, i) => {
        PICKS.forEach((spd, j) => {
            const y = 8 + rowH * (i * PICKS.length + j) + sp;
            const x0 = 8;
            c.font = `400 ${ck}px sans-serif`; c.fillStyle = 'rgba(255,255,255,0.95)';
            c.fillText(CLOCK, x0, y);
            const clockW = c.measureText(CLOCK).width;
            const boxX = x0 + clockW + ck * 0.28;
            const adv = name === 'hug' ? w(spd, sp, true)
                : locked(spd, sp, name === 'narrowRef' ? REF_NARROW : REF_NOW);
            const textW = w(spd, sp, true);
            c.strokeStyle = 'rgba(255,159,10,0.55)'; c.lineWidth = 1;
            c.strokeRect(boxX, y - sp * 0.86, adv, sp * 1.02);
            c.font = `700 ${sp}px sans-serif`; c.fillStyle = '#fff';
            c.fillText(spd, name === 'rightAlign' ? boxX + (adv - textW) : boxX, y);
            c.font = `400 ${ck * 0.72}px sans-serif`; c.fillStyle = 'rgba(255,255,255,0.72)';
            c.fillText(UNIT, boxX + adv + space, y);
            const gapPx = Math.round((name === 'rightAlign' || name === 'hug')
                ? space : adv - textW + space);
            c.font = '400 13px sans-serif'; c.fillStyle = '#8e8e93';
            c.fillText(`${spd} → 间隙 ${gapPx}px`, boxX + adv + space + 46, y);
        });
        c.font = '400 15px sans-serif'; c.fillStyle = '#ff9f0a';
        c.fillText(labels[name], 8, 8 + rowH * (i * PICKS.length + 2) - 6);
    });
    if (window.__r92) window.__r92.remove();
    window.__r92 = canvas;
    document.body.appendChild(canvas);
    await new Promise((r) => setTimeout(r, 900));
    return JSON.stringify({ ...out, shot: { rows: names.length * PICKS.length, speedPx: +sp.toFixed(1),
        onScreen: Math.round(canvas.getBoundingClientRect().width) + 'x'
            + Math.round(canvas.getBoundingClientRect().height) } });
})()
