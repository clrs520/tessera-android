// R102 render test: `CSS.supports("backdrop-filter","url(#x)")` returning true proves the *parser*
// accepts it, nothing more — Chromium has long accepted filter references there while painting
// nothing. The only evidence that counts is whether the video actually bends under the glass, so
// apply a real displacement filter to the bottom bar over a live feed and report the painted pixels.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const bar = document.querySelector('.phone-action-bar');
    if (!v.currentEvent) {
        const e = (v.eventGroups || []).find(x => !/RecentClips/i.test(String(x.eventId || '')));
        await v.playEvent(e.eventId);
        await sleep(3500);
    }
    // Put a hard-edged picture behind the glass so bending is visible at all: a single feed, playing.
    document.querySelector('.view-btn[data-view="front"]')?.click();
    await sleep(1200);

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.innerHTML = `<filter id="r102lens" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="b"/>
        <feDisplacementMap in="SourceGraphic" in2="b" scale="46" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
    document.body.appendChild(svg);

    const cs0 = getComputedStyle(bar);
    const before = { blur: cs0.backdropFilter || cs0.webkitBackdropFilter, bg: cs0.backgroundColor };

    // Sample what the glass is compositing from: read the bar's own pixels is not possible (it is a
    // DOM layer), so instead report whether the engine accepted the reference by reading back the
    // used value — an unsupported filter reference falls back to `none`.
    bar.style.setProperty('backdrop-filter', 'url(#r102lens) blur(22px) saturate(1.8)', 'important');
    bar.style.setProperty('-webkit-backdrop-filter', 'url(#r102lens) blur(22px) saturate(1.8)', 'important');
    await sleep(900);
    const used = getComputedStyle(bar).backdropFilter || getComputedStyle(bar).webkitBackdropFilter;
    const accepted = /url\(/.test(used);
    bar.style.removeProperty('backdrop-filter');
    bar.style.removeProperty('-webkit-backdrop-filter');
    svg.remove();
    await sleep(500);

    return { orient: `${innerWidth}x${innerHeight}`, chrome: (navigator.userAgent.match(/Chrome\/(\d+)/) || [])[1],
        before, usedWithRef: used.slice(0, 90), referenceSurvivedSerialization: accepted,
        note: 'computed value 保留 url() 只说明没有当场作废；是否真的折射，看同一次注入前后的截图' };
})()
