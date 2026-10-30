// Round-11 probes: ⋮ menu under immersive, theme following the system, version display,
// and the phone-leftover sweep (clip button, touch seek thumb, external links).
//   node devtools/probe-r11.mjs
const out = {};
const app = window.viewer;
const cs = (el, prop) => el ? getComputedStyle(el)[prop] : null;

out.stored = {
    legacyThemeKey: localStorage.getItem('theme'),
    themeModeKey: localStorage.getItem('tdashcam.themeMode'),
};
out.native = window.__tdashcamStorage || null;
out.media = {
    prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
    hoverNone: matchMedia('(hover: none)').matches,
};
out.theme = {
    mode: app ? app.themeMode() : null,
    bodyDark: document.body.classList.contains('dark-theme'),
    colorScheme: document.documentElement.style.colorScheme,
    resolvedDark: app ? app.resolveThemeDark() : null,
};
out.version = {
    text: cs(document.getElementById('appVersion'), 'display'),
    content: document.getElementById('appVersion')?.textContent,
};

const header = document.querySelector('.main-header');
const menuBtn = document.getElementById('headerMenuBtn');
out.header = {
    immersive: document.body.classList.contains('immersive'),
    headerOpacity: cs(header, 'opacity'),
    headerPointerEvents: cs(header, 'pointer-events'),
    menuPointerEvents: cs(menuBtn, 'pointer-events'),
    menuRect: menuBtn ? menuBtn.getBoundingClientRect().toJSON() : null,
};

const clipBtn = document.getElementById('clipBtn');
out.clip = {
    display: cs(clipBtn, 'display'),
    confirmDisplay: cs(document.getElementById('confirmClipBtn'), 'display'),
};
const handle = document.querySelector('.progress-handle');
out.seek = {
    opacity: cs(handle, 'opacity'),
    width: cs(handle, 'width'),
};
out.bridge = {
    openExternal: typeof window.TDashcamNative?.openExternal,
    openStorageSettings: typeof window.TDashcamNative?.openStorageSettings,
    nativeHook: typeof window.__tdashcamNativeState,
};
out.playback = {
    isPlaying: app?.videoControls?.isPlaying,
    layoutClass: document.getElementById('playerArea')?.className,
};
JSON.stringify(out, null, 2);
