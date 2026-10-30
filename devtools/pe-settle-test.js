// Extracts the export-layout settle methods out of script.js and exercises the swap rules.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'TDashcamStudio', 'src', 'script.js'), 'utf8').split('\n');
const head = src.findIndex(l => l.includes('peBiggestOverlap(rects, index, peersOnly)'));
const tail = src.findIndex(l => l.includes('renderPhoneExportLayout(plan) {'));
let start = head;
while (start > 0 && !/^\s*\/\*\*/.test(src[start])) start -= 1;
let end = tail;
while (end > 0 && !/^\s*\/\*\*/.test(src[end])) end -= 1;
if (start <= 0 || end <= 0) throw new Error('method block not found');
const api = eval(`new (class {\n${src.slice(start, end).join('\n')}\n})()`);

// The same boxes `phoneExportSlots` produces, written out so a mistake in the helper cannot agree
// with a mistake in the rule under test.
const shapes = { 1: [1, 1], 2: [2, 1], 3: [3, 1], 4: [2, 2], 5: [3, 2], 6: [3, 2] };
const slots = (count) => {
    const [cols, rows] = shapes[count];
    return Array.from({ length: count }, (_, i) => ({
        x: (i % cols) / cols, y: Math.floor(i / cols) / rows, w: 1 / cols, h: 1 / rows,
    }));
};

const round = (r) => `${r.x.toFixed(2)},${r.y.toFixed(2)},${r.w.toFixed(2)},${r.h.toFixed(2)}`;
const overlaps = (rects) => {
    const hits = [];
    for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
            const w = Math.min(rects[i].x + rects[i].w, rects[j].x + rects[j].w) - Math.max(rects[i].x, rects[j].x);
            const h = Math.min(rects[i].y + rects[i].h, rects[j].y + rects[j].h) - Math.max(rects[i].y, rects[j].y);
            if (w > 0.005 && h > 0.005) hits.push(`${i}x${j}`);
        }
    }
    return hits;
};

let failures = 0;
const check = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failures += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : `\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`}`);
};

// 1. four views, top-left dragged diagonally onto bottom-right: both land on the other's slot.
let rects = slots(4).map(r => ({ ...r }));
const start1 = { ...rects[0] };
rects[0] = { ...rects[3] };
api.peSettleDrop(rects, 0, start1);
check('2x2 diagonal trade', [round(rects[0]), round(rects[3]), overlaps(rects)],
    ['0.50,0.50,0.50,0.50', '0.00,0.00,0.50,0.50', []]);

// 2. only half over the neighbour: still a trade, never a shared pixel.
rects = slots(2).map(r => ({ ...r }));
let origin = { ...rects[0] };
rects[0] = { x: 0.4, y: 0, w: 0.5, h: 1 };
api.peSettleDrop(rects, 0, origin);
check('1x2 half overlap trades and stays clean', [rects.map(round), overlaps(rects)],
    [['0.50,0.00,0.50,1.00', '0.00,0.00,0.50,1.00'], []]);

// 3. a three-percent nudge past the edge: trades too, so nothing is left overlapping.
rects = slots(2).map(r => ({ ...r }));
origin = { ...rects[0] };
rects[0] = { x: 0.48, y: 0, w: 0.5, h: 1 };
api.peSettleDrop(rects, 0, origin);
check('1x2 near-edge drop stays clean', overlaps(rects), []);

// 4. six views: a bottom-middle drop onto the view that owns it.
rects = slots(6).map(r => ({ ...r }));
origin = { ...rects[0] };
rects[0] = { x: 0.34, y: 0.5, w: 1 / 3, h: 1 / 2 };
api.peSettleDrop(rects, 0, origin);
check('2x3 trade puts both back on slots', [round(rects[0]), round(rects[4])],
    ['0.33,0.50,0.33,0.50', '0.00,0.00,0.33,0.50']);
check('2x3 trade leaves no overlap', overlaps(rects), []);

// 5. picture-in-picture: a hand-sized box inside the full frame is an intended overlap.
rects = [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0.62, y: 0.52, w: 0.34, h: 0.44 }];
origin = { ...rects[1] };
rects[1] = { x: 0.66, y: 0.56, w: 0.34, h: 0.44 };
api.peSettleDrop(rects, 1, origin);
check('PiP keeps its corner', [round(rects[1]), overlaps(rects)], ['0.66,0.56,0.34,0.44', ['0x1']]);

// 6. two drags in a row across three views: a rotation, every view still one slot, no pile-up.
rects = slots(3).map(r => ({ ...r }));
origin = { ...rects[0] };
rects[0] = { x: 0.34, y: 0, w: 1 / 3, h: 1 };
api.peSettleDrop(rects, 0, origin);
origin = { ...rects[0] };
rects[0] = { x: 0.68, y: 0, w: 1 / 3, h: 1 };
api.peSettleDrop(rects, 0, origin);
check('1x3 double trade stays clean', [overlaps(rects), round(rects[0])], [[], '0.67,0.00,0.33,1.00']);
check('1x3 rotation keeps every view boxed', rects.map(r => `${r.w.toFixed(2)}:${r.h.toFixed(2)}`),
    ['0.33:1.00', '0.33:1.00', '0.33:1.00']);

// 7. dropped dead-centre on an identical box: the swap must still separate them.
rects = slots(2).map(r => ({ ...r }));
origin = { ...rects[0] };
rects[0] = { ...rects[1] };
api.peSettleDrop(rects, 0, origin);
check('exact stack separates', [overlaps(rects), rects.map(round)],
    [[], ['0.50,0.00,0.50,1.00', '0.00,0.00,0.50,1.00']]);

// 8. an oversized view dropped onto a small one is a stacking decision, not a reorder: the small
//    view must not be shoved into the hole.
rects = [{ x: 0.6, y: 0, w: 0.4, h: 1 }, { x: 0, y: 0, w: 0.25, h: 0.5 }];
origin = { ...rects[0] };
rects[0] = { x: 0.02, y: 0, w: 0.4, h: 1 };
api.peSettleDrop(rects, 0, origin);
check('oversized drop leaves the small view where it was', round(rects[1]), '0.00,0.00,0.25,0.50');

console.log(failures ? `\n${failures} failing` : '\nall green');
process.exit(failures ? 1 : 0);
