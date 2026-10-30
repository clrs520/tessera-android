(() => {
    const group = document.getElementById('headerActionsGroup');
    const hr = document.getElementById('headerRight');
    const c = getComputedStyle(group);
    const lines = [];
    lines.push(`panel cls=${hr.className} rect=${JSON.stringify(group.getBoundingClientRect().toJSON())}`);
    lines.push(`panelCS display=${c.display} cols=${c.gridTemplateColumns} dir=${c.flexDirection} wrap=${c.flexWrap} gap=${c.gap} pad=${c.padding} scroll=[${group.scrollHeight},${group.clientHeight}]`);
    [...group.children].forEach(el => {
        if (el.tagName === 'BUTTON' && el.classList.contains('theme-toggle-btn')) { /* still list it */ }
        const s = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        const txt = (el.querySelector('.btn-text')?.textContent || el.textContent || '').trim().slice(0, 12);
        const hidden = b.width === 0 && b.height === 0 ? ' HIDDEN' : '';
        lines.push(`${el.tagName} ${String(el.id || el.className).slice(0, 26).padEnd(26)} ${String(Math.round(b.x)).padStart(4)},${String(Math.round(b.y)).padStart(4)} ${String(Math.round(b.width)).padStart(4)}x${String(Math.round(b.height)).padStart(3)} disp=${s.display.padEnd(5)} w=${s.width.padStart(6)} h=${s.height.padStart(5)} pad=${s.padding.padEnd(14)} order=${String(s.order).padStart(2)} "${txt}"${hidden}`);
    });
    return lines.join('\n');
})()
