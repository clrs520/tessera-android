(() => {
    try {
        window.__r60p = { down: [], move: {}, up: [], cancel: [], pinch: [], notes: [] };
        const vc = document.querySelector('.video-container');
        document.addEventListener('pointerdown', (e) => {
            const fingersBefore = viewer.pictureFingers ? viewer.pictureFingers.size : -1;
            const rec = {
                xy: Math.round(e.clientX) + ',' + Math.round(e.clientY),
                pt: String(e.pointerType), id: e.pointerId,
                tgt: (e.target.className || e.target.tagName || '').toString().slice(0, 40),
                phone: isPhoneLayout(), cur: !!viewer.currentEvent,
                blocks: viewer.blocksFeedGesture ? viewer.blocksFeedGesture(e.target) : 'no fn',
                fingersBefore,
                pts2: !!viewer.pictureFingerPoints(2),
                hit: (() => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest ? String(!!el.closest('.video-container')) : 'nc'; })(),
            };
            window.__r60p.down.push(rec);
            window.__r60p.move[e.pointerId] = (window.__r60p.move[e.pointerId] || 0) + 1;
        }, true);
        document.addEventListener('pointermove', (e) => {
            if (window.__r60p.down.some(d => d.id === e.pointerId)) window.__r60p.move[e.pointerId]++;
        }, true);
        document.addEventListener('pointerup', (e) => { window.__r60p.up.push(e.pointerId); }, true);
        document.addEventListener('pointercancel', (e) => { window.__r60p.cancel.push(e.pointerId); }, true);
        let last = '';
        if (window.__r60pTimer) clearInterval(window.__r60pTimer);
        window.__r60pTimer = setInterval(() => {
            const z = vc.style.getPropertyValue('--feed-zoom') || '1';
            if (z !== last) { last = z; window.__r60p.pinch.push(z + '@' + vc.classList.contains('feed-zoomed')); }
        }, 30);
        window.__r60p.notes.push('fingersNow=' + (viewer.pictureFingers ? viewer.pictureFingers.size : -1));
        return 'armed ' + JSON.stringify({ fingers: viewer.pictureFingers ? viewer.pictureFingers.size : -1, cur: !!viewer.currentEvent, phone: isPhoneLayout() });
    } catch (e) { return 'THREW ' + e.message; }
})()
