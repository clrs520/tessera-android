(() => {
    const s = window.__samples || [];
    const stalls = [];
    for (let i = 0; i < s.length; i++) {
        if (s[i].paused) continue;
        let j = i;
        while (j + 1 < s.length && s[j + 1].cam === s[i].cam && s[j + 1].seg === s[i].seg && Math.abs(s[j + 1].ct - s[i].ct) < 0.02 && !s[j + 1].paused) j++;
        if ((s[j].t - s[i].t) >= 900) { stalls.push({ t: s[i].t, ct: s[i].ct, ms: s[j].t - s[i].t, rs: s[i].rs, sk: s[i].sk, buf: s[i].buf, fct: s[i].fct, fpaused: s[i].fpaused }); i = j; }
    }
    return JSON.stringify({
        taps: (window.__taps || []).slice(-16),
        errs: (window.__errs || []).slice(-20),
        samples: s.length,
        first: s[0] || null,
        last: s[s.length - 1] || null,
        stalls,
        seeks: (window.__seeklog || []).slice(-40),
    }, null, 1);
})()
