// Why is the pill not where `bottom` says it is? Read the computed values off the box rather than
// reasoning about the cascade — this project has already been burned twice by a rule that was
// silently out-ranked by a media query tier (R97).
(() => {
    const v = window.viewer;
    const before = document.querySelectorAll('.toast').length;
    v.showToast('已删除 9 个文件', 'success', 9000, { label: '撤销', onClick: () => {} });
    const pill = [...document.querySelectorAll('.toast')].slice(before)[0];
    const cs = getComputedStyle(pill);
    const container = document.querySelector('.toast-container');
    const ccs = getComputedStyle(container);
    const cr = container.getBoundingClientRect();
    const pr = pill.getBoundingClientRect();
    const out = {
        pill: { position: cs.position, top: cs.top, bottom: cs.bottom, height: cs.height,
            transform: cs.transform, margin: cs.margin, display: cs.display,
            zIndex: cs.zIndex, cls: pill.className },
        container: { position: ccs.position, top: ccs.top, left: ccs.left, bottom: ccs.bottom,
            transform: ccs.transform, display: ccs.display, alignItems: ccs.alignItems,
            rect: [cr.top, cr.left, cr.width].map(n => +n.toFixed(1)) },
        rects: { pill: [pr.top, pr.bottom, pr.left, pr.width].map(n => +n.toFixed(1)) },
        safeBottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom'),
        innerHeight, dpr: devicePixelRatio,
        // Is the rule even in the stylesheet the page loaded?
        ruleFound: [...document.styleSheets].some(sheet => {
            try {
                return [...sheet.cssRules].some(r => r.selectorText === '.toast.has-action');
            } catch (e) { return false;
            }
        }),
    };
    pill.remove();
    return JSON.stringify(out, null, 1);
})()
