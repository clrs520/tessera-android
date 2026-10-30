// R188 #1 — the danger row in the long-press menu must be a rounded pill, not a square.
(() => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const event = c.listEvents?.find((ev) => v.eventDeleteTargets(ev)) || c.listEvents?.[0];
    if (!event) return JSON.stringify({ err: 'no event' });
    v.showCardContextMenu(event);
    const row = document.querySelector('.card-context-menu [data-context="delete"]');
    if (!row) return JSON.stringify({ err: 'no row' });
    const cs = getComputedStyle(row);
    const menu = document.querySelector('.card-context-menu');
    const menuCs = getComputedStyle(menu);
    const out = {
        hidden: row.hidden,
        radius: cs.borderRadius,
        background: cs.backgroundColor,
        color: cs.color,
        margin: `${cs.marginTop}/${cs.marginRight}/${cs.marginBottom}/${cs.marginLeft}`,
        padding: `${cs.paddingTop}/${cs.paddingRight}/${cs.paddingBottom}/${cs.paddingLeft}`,
        fieldToken: getComputedStyle(document.documentElement).getPropertyValue('--r-field').trim(),
        menuRadius: menuCs.borderRadius,
        menuVisible: menu.classList.contains('show') && menu.checkVisibility(),
        rect: (() => { const r = row.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
        rowClass: row.className,
    };
    return JSON.stringify(out);
})()
