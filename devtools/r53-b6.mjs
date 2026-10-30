// B6 acceptance: measure the *appearance*, not just the class list.
// Every surface the solid-material block is supposed to reach is read as a computed style, and a
// surface that is missing from the DOM is reported as `absent` rather than silently skipped.
const PORT = 9333;

const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) })
    .then((r) => r.json());
const page = pages.find((p) => p.type === 'page');
if (!page) { console.error('no inspectable page'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('ws timeout')), 8000);
    ws.addEventListener('open', () => { clearTimeout(t); res(); });
    ws.addEventListener('error', () => rej(new Error('ws failed')));
});

let seq = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
});
function send(method, params = {}) {
    const id = ++seq;
    const p = new Promise((res, rej) => pending.set(id, { res, rej }));
    ws.send(JSON.stringify({ id, method, params }));
    return p;
}
async function evaluate(expression) {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'threw');
    return r.result.value;
}

const PROBE = `(() => {
    const cs = (el) => getComputedStyle(el);
    const pick = (sel, props) => {
        const el = document.querySelector(sel);
        if (!el) return 'absent';
        const s = cs(el);
        const out = {};
        props.forEach((p) => {
            // camelCase misses anything the engine only exposes as a dashed (often prefixed) name.
            out[p] = s[p] !== undefined && s[p] !== '' ? s[p] : s.getPropertyValue(p);
        });
        return out;
    };
    const visible = (sel) => {
        const el = document.querySelector(sel);
        return !!el && el.offsetHeight > 0;
    };

    // Which of the surfaces the block claims to cover still ask for a blur right now.
    const BLURRED = ['.modal-overlay', '.modal-content', '.dir-modal-content', '.about-panel',
        '.phone-export-panel', '.clip-modal', '.file-path-modal', '.delete-confirm-modal',
        '.toast', '.phone-action-bar', '.card-context-menu', '.header-collapsed .header-actions-group',
        '.metadata-panel', '.empty-hero', '#exportPill'];
    const stillBlurring = BLURRED.filter((sel) => {
        const el = document.querySelector(sel);
        if (!el || el.offsetHeight === 0) return false;
        const s = cs(el);
        return (s.backdropFilter || s.webkitBackdropFilter || 'none') !== 'none';
    });

    const root = cs(document.documentElement);
    const st = window.__tdashcamStorage || {};

    return JSON.stringify({
        ver: st.version,
        // A top-level throw in script.js leaves the page looking like a normal, unmodified app: no
        // viewer, no list, no classes. Every appearance probe is worthless without this.
        alive: typeof window.viewer,
        hc: st.high_contrast,
        rt: st.reduce_transparency,
        mediaContrast: matchMedia('(prefers-contrast: more)').matches,
        mediaTransparency: matchMedia('(prefers-reduced-transparency: reduce)').matches,
        cls: document.documentElement.className,
        bar: pick('.phone-action-bar', ['backgroundColor', 'backdropFilter', 'borderTopColor']),
        barLabel: pick('.tab-btn.on .tab-label', ['color']),
        meta: pick('.metadata-panel', ['backgroundColor', 'backdropFilter', 'borderColor']),
        wordmark: pick('.sidebar-header .header-title', ['backgroundImage', 'color', '-webkit-text-fill-color']),
        textSecondary: root.getPropertyValue('--text-secondary').trim(),
        borderPrimary: root.getPropertyValue('--border-primary').trim(),
        glassBg: root.getPropertyValue('--glass-bg').trim(),
        glassBgSoft: root.getPropertyValue('--glass-bg-soft').trim(),
        ctaFill: root.getPropertyValue('--cta-fill').trim(),
        visible: { panel: visible('#phoneSettingsPanel'), meta: visible('.metadata-panel') },
        stillBlurring,
    });
})()`;

await send('Runtime.enable');
console.log(await evaluate(PROBE));
ws.close();
