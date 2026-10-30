// R143 #14: the dictionary half of the engine error codes.
const fs = require('fs');
const file = 'TDashcamStudio/src/script.js';
let text = fs.readFileSync(file, 'utf8');

const en = `        ariaClearDate: "Clear date filter",
        // The Kotlin engine reports a machine code plus numbers; these are the words the page puts
        // on it, so an English build never shows a Chinese sentence in a toast.
        peEngine_preparing: "Preparing the encoder…",
        peEngine_encoding: "{n} views · {w}×{h} · {frames} frames · {encoder}",
        peEngine_progress: "Wrote {step}/{frames} frames",
        peEngine_badRequest: "The export request could not be read ({message})",
        peEngine_busy: "An export is already running",
        peEngine_noEncoder: "No H.264 encoder on this device can do {w}×{h}",
        peEngine_noDecoder: "One of the files has no usable decoder",
        peEngine_noStreams: "Nothing to export — no camera file matched",
        peEngine_noFrames: "The encoder produced no frame; {w}×{h} may be beyond it",
        peEngine_gpuLost: "The graphics context went away (screen off, or out of memory)",
        peEngine_formatChanged: "The encoder changed its format mid-stream",
        peEngine_emptyFile: "The file came out empty",
        peEngine_darkAll: "{n} view(s) never gave up a picture, so the file holds only the overlays",
        peEngine_darkSome: "{n} view(s) had no picture for the whole export",
        peEngine_tailStuck: "The encoder stopped answering at the end; the last frames may be missing ({frames} written)",
        peEngine_cancelled: "Cancelled",
        peEngine_cancelledKept: "Cancelled — the part already written is kept"
    },`;

const zh = `        ariaClearDate: "清除日期筛选",
        peEngine_preparing: "准备编码器…",
        peEngine_encoding: "{n} 路 · {w}×{h} · {frames} 帧 · {encoder}",
        peEngine_progress: "已写入 {step}/{frames} 帧",
        peEngine_badRequest: "解析导出参数失败（{message}）",
        peEngine_busy: "已有一个导出任务在运行",
        peEngine_noEncoder: "这台机器上没有能编 {w}×{h} 的 H.264 编码器",
        peEngine_noDecoder: "有一个文件找不到可用的解码器",
        peEngine_noStreams: "没有可导出的摄像头画面",
        peEngine_noFrames: "编码器没有产出一帧（{w}×{h} 可能超出它的能力）",
        peEngine_gpuLost: "GPU 上下文丢失（息屏或显存不足）",
        peEngine_formatChanged: "编码器中途改了格式",
        peEngine_emptyFile: "写出的文件是空的",
        peEngine_darkAll: "{n} 路解码器一帧画面都没交出来，文件里只有叠加层",
        peEngine_darkSome: "有 {n} 路全程没有画面",
        peEngine_tailStuck: "编码器结尾没有回话，最后几帧可能缺失（已写入 {frames} 帧）",
        peEngine_cancelled: "已取消",
        peEngine_cancelledKept: "已取消，已写入的片段保存在文件里"
    }`;

for (const [from, to] of [
    ['        ariaClearDate: "Clear date filter"\n    },', en],
    ['        ariaClearDate: "清除日期筛选"\n    }', zh],
]) {
    if (!text.includes(from)) throw new Error('anchor missing: ' + from.slice(0, 40));
    text = text.replace(from, to);
}
fs.writeFileSync(file, text);
console.log('dictionary keys added');
