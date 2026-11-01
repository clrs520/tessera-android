// Generate a fake TeslaCam tree and push it to a running emulator/device, so the
// Android UI can be checked on PC without a phone. Output dir is scratch, not repo state.
//   node devtools/make-teslacam-fixture.js [localOutDir]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const OUT = positional[0] || path.join(__dirname, '.fixture', 'TeslaCam');
// Tesla's own filenames for the two side cameras are *_repeater, and that is exactly what
// TeslaCamViewer.getCameraType() matches — plain "-left.mp4" is parsed as no camera at all.
const CAMS = ['front', 'back', 'left_repeater', 'right_repeater', 'left_pillar', 'right_pillar'];
const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';

// MP4 magic header only: the layout does not depend on decoded frames, and a real
// clip would make the fixture hundreds of MB.
const PLACEHOLDER = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x20]),
    Buffer.from('ftypiso6', 'ascii'),
    Buffer.from([0x00, 0x00, 0x02, 0x00]),
    Buffer.from('mp41isom', 'ascii'),
    Buffer.alloc(64 * 1024, 0x21),
]);

// Resolve ffmpeg the way the shell runners do: explicit FFMPEG, then PATH, then the copy
// this machine installed under %LOCALAPPDATA%. Null when there is none.
function findFfmpeg() {
    if (process.env.FFMPEG) return process.env.FFMPEG;
    const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    for (const dir of (process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
        const cand = path.join(dir, exe);
        if (fs.existsSync(cand)) return cand;
    }
    const local = process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'Programs', 'ffmpeg', 'bin', exe)
        : '';
    return local && fs.existsSync(local) ? local : null;
}

// The placeholder has no decodable frames, so anything gated on playback (control
// auto-hide, timeline, audio) needs a real clip. devtools/clip-real.mp4 wins when it is
// there; otherwise one is generated with ffmpeg into the scratch dir next to the fixture.
// (No more `adb shell screenrecord`: MIUI refuses it while the screen sleeps, and what it
// records is a portrait phone, not a 1280x576 dashcam frame.) Only with neither do we fall
// back to the header-only placeholder.
const VIDEO = (() => {
    try {
        return fs.readFileSync(path.join(__dirname, 'clip-real.mp4'));
    } catch (e) { /* fall through to ffmpeg */ }
    const ffmpeg = findFfmpeg();
    if (!ffmpeg) return PLACEHOLDER;
    const clip = path.join(path.dirname(OUT), '_clip.mp4');
    try {
        if (fs.existsSync(clip)) return fs.readFileSync(clip);
        fs.mkdirSync(path.dirname(clip), { recursive: true });
        execFileSync(ffmpeg, [
            '-hide_banner', '-loglevel', 'error', '-y',
            '-f', 'lavfi', '-i', 'testsrc2=size=1280x576:rate=30:duration=6',
            '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono',
            '-shortest', '-c:v', 'libx264', '-preset', 'veryfast',
            '-pix_fmt', 'yuv420p', '-g', '30', '-c:a', 'aac', '-b:a', '64k',
            '-movflags', '+faststart', clip,
        ]);
        return fs.readFileSync(clip);
    } catch (e) {
        console.warn('   ffmpeg 造片失败，退回 header-only 夹具：' + e.message);
        return PLACEHOLDER;
    }
})();

function write(pathName, buf) {
    const full = path.join(OUT, pathName);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, buf);
}

function eventStamp(daysAgo, hour, minute, second) {
    const d = new Date(2026, 9, 8 - daysAgo, hour, minute, second);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

fs.rmSync(OUT, { recursive: true, force: true });

// RecentClips: flat files, one rolling hour.
for (let i = 0; i < 10; i++) {
    const stamp = eventStamp(0, 9, i * 6, 0);
    for (const cam of CAMS) write(path.join('RecentClips', `${stamp}-${cam}.mp4`), VIDEO);
}

// SavedClips: one folder per event, cameras inside.
const saved = [[2, 14, 20], [3, 8, 5], [5, 19, 47], [9, 12, 30]];
for (const [days, hour, min] of saved) {
    const stamp = eventStamp(days, hour, min, 0);
    for (const cam of CAMS) write(path.join('SavedClips', stamp, `${stamp}-${cam}.mp4`), VIDEO);
}

// SentryClips: fewer events, triggering clips are usually only front + neighbours.
for (const [days, hour, min] of [[1, 3, 12], [6, 21, 40]]) {
    const stamp = eventStamp(days, hour, min, 0);
    for (const cam of ['front', 'left', 'right', 'back']) {
        write(path.join('SentryClips', stamp, `${stamp}-${cam}.mp4`), VIDEO);
    }
}

const files = [];
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        e.isDirectory() ? walk(p) : files.push(p);
    }
})(OUT);
console.log(`fixture: ${files.length} files under ${OUT}`);

if (process.argv.includes('--push')) {
    // Trailing slash matters: `adb push <dir> /storage/emulated/0/` copies the tree as
    // TeslaCam/, while naming the destination path directly merges into an existing one.
    execFileSync(ADB, ['push', OUT, '/storage/emulated/0/'], { stdio: 'inherit' });
    execFileSync(ADB, ['shell', 'ls', '/storage/emulated/0/TeslaCam'], { stdio: 'inherit' });
    console.log('pushed to /storage/emulated/0/TeslaCam');
}
