import fs from 'node:fs';
const p = 'TDashcamStudio/src/script.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');

// Line numbers are 1-based, as in the grep output. `must` is a substring that has to be present.
const BRIDGE = {
  1041: ['if (!isAndroidRuntime() || !window.TDashcamNative) return;', 'if (!hasNativeBridge()) return;'],
  1477: ['if (!isAndroidRuntime() || !window.TDashcamNative) return false;', 'if (!hasNativeBridge()) return false;'],
  1491: ['if (!isAndroidRuntime() || !window.TDashcamNative) return;', 'if (!hasNativeBridge()) return;'],
  1643: ['if (!isAndroidRuntime() || typeof window.TDashcamNative?.requestThumb !== \'function\') {', 'if (!nativeMethod(\'requestThumb\')) {'],
  4539: ['if (!isAndroidRuntime()) return;', 'if (!nativeMethod(\'requestThumb\')) return;'],
  11559: ['if (isAndroidRuntime() && window.TDashcamNative?.startExport && this.videoControls?.clipBtn) {', 'if (nativeMethod(\'startExport\') && this.videoControls?.clipBtn) {'],
  11785: ['if (isAndroidRuntime() && window.TDashcamNative) {', 'if (hasNativeBridge()) {'],
  17868: ['try { if (isAndroidRuntime() && window.TDashcamNative) window.TDashcamNative.pageReady(); }', 'try { if (hasNativeBridge()) window.TDashcamNative.pageReady(); }'],
};

const TOUCH = [938, 976, 1113, 1136, 1543, 1789, 1799, 3308, 4645, 4734, 4899, 4938,
               11554, 12013, 12412, 13794, 13991, 14494, 15036, 15055, 15170, 17879];

const renamed = [];
for (const [n, [must, next]] of Object.entries(BRIDGE)) {
  const i = n - 1;
  if (!lines[i].includes(must)) throw new Error(`bridge site ${n}: expected ${must}\n got: ${lines[i]}`);
  lines[i] = lines[i].replace(must, next);
  renamed.push(n);
}
for (const n of TOUCH) {
  const i = n - 1;
  if (!lines[i].includes('isAndroidRuntime()')) throw new Error(`touch site ${n}: ${lines[i]}`);
  lines[i] = lines[i].replace('isAndroidRuntime()', 'isTouchShellRuntime()');
  renamed.push(n);
}

const whole = [
  ['const ANDROID_FILE_PREFIX = isTouchShellRuntime() ? \'Tessera\' : \'TDashcam\';',
   'const MOBILE_FILE_PREFIX = isTouchShellRuntime() ? \'Tessera\' : \'TDashcam\';'],
  ['${ANDROID_FILE_PREFIX}_', '${MOBILE_FILE_PREFIX}_'],
  ['this.setupAndroidPlayerChrome();', 'this.setupTouchPlayerChrome();'],
  ['    setupAndroidPlayerChrome() {', '    setupTouchPlayerChrome() {'],
];
for (const [from, to] of whole) {
  let hits = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(from)) { lines[i] = lines[i].split(from).join(to); hits++; }
  }
  if (!hits) throw new Error(`no hit for ${from}`);
  console.log(`replaced ${hits}x: ${from}`);
}

fs.writeFileSync(p, lines.join('\n'));
console.log('sites converted:', renamed.length);
