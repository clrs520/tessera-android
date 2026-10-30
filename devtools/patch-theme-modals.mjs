import io from 'node:fs';

const path = new URL('../TDashcamStudio/src/styles.css', import.meta.url);
// The file is CRLF; patterns below are written with \n. Normalise, patch, write back as CRLF.
let s = io.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const subs = [
  // ---- theme variables -------------------------------------------------------------
  [`    --icon-color: #1c1e21;
    --icon-filter-on-dark: brightness(0) invert(1);
    --calendar-picker-filter: none;
}`,
  `    --icon-color: #1c1e21;
    --icon-filter-on-dark: brightness(0) invert(1);
    --calendar-picker-filter: none;

    /* Dialogs (folder browser, file path, map, clip) follow the theme. They used to be
       hardcoded dark in both themes, which left the clip dialog — the one panel with a light
       override — rendering pale text on a white card in light mode. */
    --modal-panel: rgba(255, 255, 255, 0.96);
    --modal-panel-solid: #ffffff;
    --modal-panel-border: rgba(0, 0, 0, 0.1);
    --modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    --modal-text: #1c1e21;
    --modal-text-strong: #16181c;
    --modal-muted: #5f6773;
    --modal-field: #f2f3f5;
    --modal-field-border: #d5d9e0;
    --modal-chip: #f4f6fa;
    --modal-chip-border: #dfe3ea;
    --modal-chip-hover: #e8ecf6;
    --modal-accent-soft: rgba(102, 126, 234, 0.1);
    --modal-error: #c62828;
}`],

  [`    --icon-color: #e4e6eb;
    --icon-filter-on-dark: brightness(0) invert(0.9);
    --calendar-picker-filter: invert(1);
}`,
  `    --icon-color: #e4e6eb;
    --icon-filter-on-dark: brightness(0) invert(0.9);
    --calendar-picker-filter: invert(1);

    --modal-panel: rgba(30, 30, 40, 0.85);
    --modal-panel-solid: #20222c;
    --modal-panel-border: rgba(255, 255, 255, 0.1);
    --modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    --modal-text: #e6e8ef;
    --modal-text-strong: #f3f5fa;
    --modal-muted: #aab0c0;
    --modal-field: #14161d;
    --modal-field-border: #3d4356;
    --modal-chip: #2a2d3a;
    --modal-chip-border: #363c4d;
    --modal-chip-hover: rgba(139, 92, 246, 0.28);
    --modal-accent-soft: rgba(139, 92, 246, 0.18);
    --modal-error: #ff9a9a;
}`],

  // ---- shared panel ---------------------------------------------------------------
  [`.modal-content {
    background: rgba(30, 30, 40, 0.85);`,
  `.modal-content {
    background: var(--modal-panel);`],

  [`    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    text-align: center;`,
  `    box-shadow: var(--modal-shadow);
    color: var(--modal-text);
    text-align: center;`],

  [`    border: 1px solid rgba(255, 255, 255, 0.1);
    max-height: calc(100vh - 32px);`,
  `    border: 1px solid var(--modal-panel-border);
    max-height: calc(100vh - 32px);`],

  [`.clip-modal {
    max-width: 480px;
    width: 95%;
    padding: 20px;
    background: rgba(25, 25, 35, 0.9);`,
  `.clip-modal {
    max-width: 480px;
    width: 95%;
    padding: 20px;
    background: var(--modal-panel);`],

  [`.file-path-modal {
    max-width: 560px;
    width: 95%;
    padding: 24px;
    background: rgba(25, 25, 35, 0.95);`,
  `.file-path-modal {
    max-width: 560px;
    width: 95%;
    padding: 24px;
    background: var(--modal-panel);`],

  [`.file-path-input {
    flex: 1;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: var(--text-primary);`,
  `.file-path-input {
    flex: 1;
    padding: 12px 16px;
    background: var(--modal-field);
    border: 1px solid var(--modal-field-border);
    border-radius: 8px;
    color: var(--modal-text-strong);`],

  // ---- folder browser -------------------------------------------------------------
  [`/* ============================================================
   Android directory browser (dialog plugin has no folder picker on mobile)
   Colours are fixed dark-on-light-text on purpose: the shared .modal-content
   panel is dark in both themes, so var(--text-primary) would turn near-black
   text on a near-black panel whenever the app runs in light mode.
   ============================================================ */
.dir-modal-content {
    width: min(560px, 100%);
    text-align: left;
    background: #20222c;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #e6e8ef;
}

.dir-modal-content h4 {
    margin: 0 0 16px;
    color: #f3f5fa;
    font-size: 1.05rem;
}`,
  `/* ============================================================
   Android directory browser (dialog plugin has no folder picker on mobile)
   ============================================================ */
.dir-modal-content {
    width: min(560px, 100%);
    text-align: left;
    background: var(--modal-panel-solid);
    border: 1px solid var(--modal-panel-border);
    color: var(--modal-text);
}

.dir-modal-content h4 {
    margin: 0 0 16px;
    color: var(--modal-text-strong);
    font-size: 1.05rem;
}`],

  [`.dir-path-label {
    color: #aab0c0;`,
  `.dir-path-label {
    color: var(--modal-muted);`],

  [`    border-radius: 8px;
    border: 1px solid #3d4356;
    background: #14161d;
    color: #f3f5fa;
    font-size: 0.82rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;`,
  `    border-radius: 8px;
    border: 1px solid var(--modal-field-border);
    background: var(--modal-field);
    color: var(--modal-text-strong);
    font-size: 0.82rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;`],

  [`    cursor: pointer;
    font-size: 0.85rem;
    color: #f3f5fa;
    background: #3d4356;
    transition: background 0.2s ease;
}

.dir-action-btn:hover {
    background: #4a5168;
}`,
  `    cursor: pointer;
    font-size: 0.85rem;
    color: var(--modal-text-strong);
    background: var(--modal-chip);
    border: 1px solid var(--modal-chip-border);
    transition: background 0.2s ease;
}

.dir-action-btn:hover {
    background: var(--modal-chip-hover);
}`],

  [`    margin-bottom: 16px;
    color: #e6e8ef;
    font-size: 0.9rem;
}`,
  `    margin-bottom: 16px;
    color: var(--modal-text);
    font-size: 0.9rem;
}`],

  [`    border-radius: 8px;
    border: 1px solid #363c4d;
    background: #2a2d3a;
    color: #f3f5fa;
    cursor: pointer;`,
  `    border-radius: 8px;
    border: 1px solid var(--modal-chip-border);
    background: var(--modal-chip);
    color: var(--modal-text-strong);
    cursor: pointer;`],

  [`.dir-browser-item:hover {
    background: rgba(139, 92, 246, 0.28);
    border-color: #8b5cf6;
}`,
  `.dir-browser-item:hover {
    background: var(--modal-chip-hover);
    border-color: #8b5cf6;
}`],

  [`    border-left: 3px solid #a78bfa;
    background: rgba(139, 92, 246, 0.18);
    color: #e6e8ef;
}

.dir-browser-hint strong {
    display: block;
    font-size: 0.9rem;
    margin-bottom: 6px;
    color: #f3f5fa;
}`,
  `    border-left: 3px solid #a78bfa;
    background: var(--modal-accent-soft);
    color: var(--modal-text);
}

.dir-browser-hint strong {
    display: block;
    font-size: 0.9rem;
    margin-bottom: 6px;
    color: var(--modal-text-strong);
}`],

  [`.dir-browser-steps {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.76rem !important;
    color: #c3c9d8;
}

.dir-browser-error {
    color: #ff9a9a;`,
  `.dir-browser-steps {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.76rem !important;
    color: var(--modal-muted);
}

.dir-browser-error {
    color: var(--modal-error);`],

  [`.dir-modal-content .close-modal-btn {
    color: #c3c9d8;
}`,
  `.dir-modal-content .close-modal-btn {
    color: var(--modal-muted);
}`],

  [`.dir-browser-list::-webkit-scrollbar-thumb {
    background: #4a5168;`,
  `.dir-browser-list::-webkit-scrollbar-thumb {
    background: var(--modal-field-border);`],

  // ---- rules that assumed a permanently dark panel ---------------------------------
  [`/* ============================================================
   Modals keep a dark panel in both themes, so their text must not
   follow the light theme's near-black --text-primary.
   ============================================================ */
body:not(.dark-theme) .modal-content {
    color: #e6e8ef;
}

body:not(.dark-theme) #mapModalTitle,
body:not(.dark-theme) .file-path-modal h4 {
    color: #f3f5fa;
}

body:not(.dark-theme) .file-path-input {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    color: #f3f5fa;
}

body:not(.dark-theme) .clip-info-label {
    color: #aab0c0;
}`,
  `/* Panels now follow the theme, so modal text comes from --modal-text and these
   dark-panel-for-light-theme patches would only fight it. */`],

  [`body:not(.dark-theme) .clip-modal {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

`, ''],

  // ---- phone touch target: the view buttons were 32px wide -------------------------
  [`    .view-btn {
        padding: 7px 7px;`,
  `    .view-btn {
        padding: 7px 11px;`],
];

let failed = 0;
for (const [oldStr, newStr] of subs) {
    const n = s.split(oldStr).length - 1;
    if (n !== 1) {
        console.error(`!! ${n} matches for: ${oldStr.slice(0, 60).replace(/\n/g, '\\n')}`);
        failed++;
        continue;
    }
    s = s.replace(oldStr, newStr);
}
if (failed) {
    console.error(`${failed} pattern(s) did not match exactly once — nothing written.`);
    process.exit(1);
}
io.writeFileSync(path, s.replace(/\n/g, '\r\n'));
console.log(`applied ${subs.length} replacements`);
