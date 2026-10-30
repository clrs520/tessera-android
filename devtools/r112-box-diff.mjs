// R112 判定：把 `--lens-alpha` 从 .90 改到 .45，两张 screencap 到底哪里变了。
// 不靠眼睛 —— 按盒子算平均绝对差（MAD）。面板盒子 MAD≈0 就说明**那一面根本没跟着变量走**，
// 那才是「割裂」的成因（自适应透度管不到它）；面板盒子明显变了才说明只是厚薄观感问题。
import { decodePng } from './png-diff.mjs';

const [a, b] = process.argv.slice(2).map((p) => decodePng(p));
if (a.width !== b.width || a.height !== b.height) {
    console.log(`尺寸不同，不能比：${a.width}x${a.height} vs ${b.width}x${b.height}`);
    process.exit(1);
}
const W = a.width;
// 盒子用 CSS px 写，内部按 dpr 换算成设备像素（这台 AVD dpr=2.7，screencap 是设备像素）。
const DPR = Number(process.env.DPR || 2.7);
const BOXES = {
    全图: [0, 0, 400, 889],
    设置面板: [16, 190, 384, 786],
    面板上半: [16, 190, 384, 480],
    面板下半: [16, 480, 384, 786],
    底部条: [14, 798, 386, 855],
    HUD数据卡: [16, 559, 392, 619],
    顶栏事件名: [0, 60, 400, 130],
    面板外左侧: [0, 300, 14, 700],
};
const at = (img, x, y) => {
    const i = (y * W + x) * 4;   // decodePng 统一吐 RGBA 四通道
    return [img.rgba[i], img.rgba[i + 1], img.rgba[i + 2]];
};
for (const [name, [x0, y0, x1, y1]] of Object.entries(BOXES)) {
    const [X0, Y0, X1, Y1] = [x0 * DPR, y0 * DPR, x1 * DPR, y1 * DPR].map(Math.round);
    let mad = 0, n = 0, maxD = 0, sa = [0, 0, 0], sb = [0, 0, 0];
    for (let y = Y0; y < Y1; y++) {
        for (let x = X0; x < X1; x++) {
            const p = at(a, x, y), q = at(b, x, y);
            const d = (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2])) / 3;
            mad += d; n++; maxD = Math.max(maxD, d);
            sa = [sa[0] + p[0], sa[1] + p[1], sa[2] + p[2]];
            sb = [sb[0] + q[0], sb[1] + q[1], sb[2] + q[2]];
        }
    }
    const m = (v) => v.map((x) => Math.round(x / n));
    console.log(`${name}: MAD=${(mad / n).toFixed(2)} max=${maxD}  均值 ${m(sa).join(',')} → ${m(sb).join(',')}`);
}
