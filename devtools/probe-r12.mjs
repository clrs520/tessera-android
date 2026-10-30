// Round-12 probes: the bottom action bar, the slimmed thumb-zone header, the long-press card
// menu, and the two native calls (keep-screen-on / real fullscreen).
//   node devtools/probe-r12.mjs
const out = {};
const app = window.viewer;
const cs = (el, prop) => el ? getComputedStyle(el)[prop] : null;
const rect = (el) => el ? (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null;

const bar = document.getElementById('phoneActionBar');
out.bar = {
    display: cs(bar, 'display'),
    rect: rect(bar),
    tabs: [...document.querySelectorAll('.tab-btn')].map(b => ({
        action: b.dataset.action,
        label: b.querySelector('.tab-label')?.textContent,
        rect: rect(b),
    })),
    actionH: getComputedStyle(document.documentElement).getPropertyValue('--action-h').trim(),
    mainPaddingBottom: cs(document.querySelector('.main-content'), 'padding-bottom'),
    hiddenWhenDrawerOpen: cs(bar, 'opacity'),
    sidebarCollapsed: document.body.classList.contains('sidebar-collapsed'),
};

const name = document.getElementById('headerEventName');
out.header = {
    eventNameDisplay: cs(name, 'display'),
    eventNameText: name?.textContent,
    hamburgerDisplay: cs(document.getElementById('openSidebarBtn'), 'display'),
    menuBtnDisplay: cs(document.getElementById('headerMenuBtn'), 'display'),
    headerRect: rect(document.querySelector('.main-header')),
    bodyImmersive: document.body.classList.contains('immersive'),
};

const menu = document.getElementById('cardContextMenu');
out.context = {
    display: cs(menu, 'display'),
    rect: rect(menu),
    open: menu?.classList.contains('show'),
    bodyContextOpen: document.body.classList.contains('context-open'),
    title: document.getElementById('cardContextTitle')?.textContent,
    items: [...document.querySelectorAll('.context-item')].map(i => ({
        action: i.dataset.context,
        disabled: i.disabled,
        text: i.textContent.trim(),
        h: Math.round(i.getBoundingClientRect().height),
    })),
    cardUserSelect: cs(document.querySelector('.video-card'), 'user-select'),
};

out.controls = {
    overlayRect: rect(document.querySelector('.video-controls-overlay')),
    controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h').trim(),
    viewport: { w: innerWidth, h: innerHeight },
    dpr: devicePixelRatio,
};

out.bridge = {
    keepScreenOn: typeof window.TDashcamNative?.setKeepScreenOn,
    fullscreen: typeof window.TDashcamNative?.setFullscreen,
    nativeState: window.__tdashcamStorage || null,
};

out.state = {
    events: app?.eventGroups?.length ?? null,
    currentEvent: app?.currentEvent?.eventId ?? null,
    layoutMode: app?.multiCameraPlayer?.layoutMode ?? null,
    storedLayout: localStorage.getItem('tdashcam.layout'),
    isPlaying: app?.videoControls?.isPlaying ?? null,
    layers: app?.phoneLayerCount?.() ?? null,
};

JSON.stringify(out, null, 2);
