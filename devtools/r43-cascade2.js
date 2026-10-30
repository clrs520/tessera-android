(() => {
    const out = {};
    const row = document.getElementById('tapBehaviorChoice');
    const track = row.querySelector('.choice-segments');
    const segs = [...row.querySelectorAll('.choice-segment')];
    const on = segs.find(s => s.classList.contains('on'));
    const off = segs.find(s => !s.classList.contains('on'));
    const pick = (el) => { const c = getComputedStyle(el); const r = el.getBoundingClientRect(); return {
        w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), bg: c.backgroundColor,
        radius: c.borderRadius, jc: c.justifyContent, color: c.color, fw: c.fontWeight, pad: c.padding, shadow: c.boxShadow.slice(0, 40) }; };
    out.row = pick(row); out.track = pick(track); out.on = on && pick(on); out.off = off && pick(off);
    out.rowPadLeft = getComputedStyle(row).paddingLeft;
    const otherRow = document.getElementById('themeChoice');
    out.themeTrackX = Math.round(otherRow.querySelector('.choice-segments').getBoundingClientRect().x);
    out.tapTrackX = Math.round(track.getBoundingClientRect().x);
    out.panelW = Math.round(document.getElementById('headerActionsGroup').getBoundingClientRect().width);
    out.scroll = (el => ({ sh: el.scrollHeight, ch: el.clientHeight }))(document.getElementById('headerActionsGroup'));
    return JSON.stringify(out, null, 1);
})()
