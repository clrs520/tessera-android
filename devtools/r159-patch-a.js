const fs = require('fs');
const p = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio/src/script.js';
let t = fs.readFileSync(p, 'utf8');
function rep(a, b) {
    if (!t.includes(a)) { console.error('MISSING:', a.slice(0, 90)); process.exit(1); }
    t = t.replace(a, b);
}

// ---- i18n ----------------------------------------------------------------
const zh = '        gapMissing: "此处缺 {gap}（未录制）",\n';
const en = '        gapMissing: "Not recorded here: {gap}",\n';
rep(zh, zh + [
    '        choiceGap: "换段缝",',
    '        gapModeAll: "全部标出",',
    '        gapModeHoles: "只标大缺口",',
    '        gapToastAll: "换段缝：全部标出",',
    '        gapToastHoles: "换段缝：只标大缺口",',
    '        choiceRecent: "最近片段",',
    '        recentSplitNone: "一整个",',
    '        recentSplitDay: "按天",',
    '        recentSplitSession: "按段",',
    '        recentSplitToast: "最近片段：{mode}",',
    '',
].join('\n'));
rep(en, en + [
    '        choiceGap: "Seams",',
    '        gapModeAll: "All",',
    '        gapModeHoles: "Holes",',
    '        gapToastAll: "Seams: show all",',
    '        gapToastHoles: "Seams: only holes",',
    '        choiceRecent: "Recent clips",',
    '        recentSplitNone: "One list",',
    '        recentSplitDay: "By day",',
    '        recentSplitSession: "By drive",',
    '        recentSplitToast: "Recent clips: {mode}",',
    '',
].join('\n'));

// ---- storage keys --------------------------------------------------------
rep("const ANDROID_TAP_BEHAVIOR_KEY = 'tdashcam.tapBehavior';",
    "const ANDROID_TAP_BEHAVIOR_KEY = 'tdashcam.tapBehavior';\n" +
    "// R159: ruler seams and how RecentClips is cut up. Both are phone-only preferences.\n" +
    "const ANDROID_GAP_MARK_KEY = 'tdashcam.gapMark';\n" +
    "const ANDROID_RECENT_SPLIT_KEY = 'tdashcam.recentSplit';");

// ---- dom refs ------------------------------------------------------------
rep("            tapBehaviorChoice: document.getElementById('tapBehaviorChoice'),\n            themeChoice: document.getElementById('themeChoice'),",
    "            tapBehaviorChoice: document.getElementById('tapBehaviorChoice'),\n" +
    "            gapMarkChoice: document.getElementById('gapMarkChoice'),\n" +
    "            recentSplitChoice: document.getElementById('recentSplitChoice'),\n" +
    "            themeChoice: document.getElementById('themeChoice'),");

// ---- bind ----------------------------------------------------------------
rep("        this.bindChoiceRow(this.dom.tapBehaviorChoice, mode => this.setTapBehavior(mode));\n        this.bindChoiceRow(this.dom.themeChoice, mode => this.setThemeChoice(mode));",
    "        this.bindChoiceRow(this.dom.tapBehaviorChoice, mode => this.setTapBehavior(mode));\n" +
    "        this.bindChoiceRow(this.dom.gapMarkChoice, mode => this.setGapMarkMode(mode));\n" +
    "        this.bindChoiceRow(this.dom.recentSplitChoice, mode => this.setRecentSplit(mode));\n" +
    "        this.bindChoiceRow(this.dom.themeChoice, mode => this.setThemeChoice(mode));");

// ---- initial labels ------------------------------------------------------
rep("        this.updateTapBehaviorLabel();\n        this.updateThemeChoice();",
    "        this.updateTapBehaviorLabel();\n        this.updateGapMarkLabel();\n        this.updateRecentSplitLabel();\n        this.updateThemeChoice();");

fs.writeFileSync(p, t);
console.log('ok');
