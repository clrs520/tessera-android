(() => {
    const COLS = Number(window.__r44cols || 5);
    const WIDTH = window.__r44w || '680px';
    const CSS = `
.header-collapsed .header-actions-group .menu-choice .btn-icon svg,
.header-right .header-actions-group .menu-choice .btn-icon svg {
    width: 21px; height: 21px; display: block; fill: none;
    stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round;
}
@media (orientation: landscape) and (max-height: 620px) and (max-width: 1200px)
        and (hover: none) and (pointer: coarse) {
    .header-collapsed .header-right .header-actions-group {
        display: grid;
        grid-template-columns: repeat(${COLS}, minmax(0, 1fr));
        width: min(${WIDTH}, calc(100vw - 12px - var(--safe-left) - var(--safe-right)));
        gap: 2px;
        padding: 5px;
        align-content: start;
    }
    .header-collapsed .header-right .header-actions-group button,
    .header-collapsed .header-right .header-actions-group a {
        width: 100% !important;
        height: ${window.__r44h || 40}px !important;
        padding: 0 7px !important;
        justify-content: flex-start !important;
        gap: 6px !important;
        font-size: 0.78rem !important;
    }
    .header-collapsed .header-right .header-actions-group .btn-text {
        display: block !important;
    }
    .header-collapsed .header-right .header-actions-group .menu-choice {
        order: 10;
        grid-column: ${window.__r44span === 'full' ? '1 / -1' : 'span ' + (window.__r44span || 3)};
        flex: 0 0 100%;
        width: auto;
        min-height: 40px;
        padding: 0 7px;
    }
    .header-collapsed .header-right .header-actions-group .choice-label {
        flex: 0 0 4.4em;
    }
    .header-collapsed .header-right .header-actions-group .choice-segments {
        flex: 1 1 auto;
        width: auto;
    }
    .header-collapsed .header-right .header-actions-group .choice-segment {
        width: auto !important;
        height: auto !important;
        min-height: 36px !important;
        flex: 1 1 0 !important;
        padding: 0 4px !important;
        justify-content: center !important;
        gap: 0 !important;
    }
}`;
    let st = document.getElementById('r44-preview');
    if (!st) { st = document.createElement('style'); st.id = 'r44-preview'; document.head.appendChild(st); }
    st.textContent = CSS;
    /* The installed build predates R44-2, so fake the leading icon the shipped rows will have. */
    const GLYPH = {
        tapBehaviorChoice: 'M7 5v14M11 12l7-4.3v8.6z',
        themeChoice: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18zM12 3v18',
    };
    Object.keys(GLYPH).forEach(id => {
        const row = document.getElementById(id);
        if (!row || row.querySelector('.btn-icon')) return;
        const s = document.createElement('span');
        s.className = 'btn-icon';
        s.innerHTML = `<svg viewBox="0 0 24 24"><path d="${GLYPH[id]}"/></svg>`;
        row.insertBefore(s, row.firstChild);
    });
    const hr = document.getElementById('headerRight');
    if (!hr.className.includes('active')) document.getElementById('headerMenuBtn').click();
    const group = document.getElementById('headerActionsGroup');
    const R = el => { const b = el.getBoundingClientRect(); return `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`; };
    const lines = [`cols=${COLS} width=${WIDTH} panel ${R(group)} scroll=[${group.scrollHeight},${group.clientHeight}] fits=${group.scrollHeight <= group.clientHeight}`];
    [...group.children].forEach(el => {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) return;
        const t = el.querySelector('.btn-text');
        const segs = [...el.querySelectorAll('.choice-segment')];
        lines.push(`${String(el.id || el.className).slice(0, 22).padEnd(22)} ${R(el).padEnd(14)}` +
            (t ? ` txt ${Math.round(t.getBoundingClientRect().width)}px need=${t.scrollWidth} clip=${t.scrollWidth - t.clientWidth}` : '') +
            (segs.length ? ` seg=[${segs.map(s => Math.round(s.getBoundingClientRect().width)).join(',')}] track=${R(el.querySelector('.choice-segments'))}` : ''));
    });
    return lines.join('\n');
})()
