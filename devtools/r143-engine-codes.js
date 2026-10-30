// R143 #14: finish swapping the engine's user-facing Chinese sentences for machine codes.
const fs = require('fs');
const base = 'TDashcamStudio/src-tauri/gen/android/app/src/main/java/com/tdashcam/studio/export/';

function patch(rel, pairs) {
    const file = base + rel;
    let text = fs.readFileSync(file, 'utf8');
    for (const [from, to] of pairs) {
        if (!text.includes(from)) throw new Error(`${rel}: not found: ${from.slice(0, 60)}`);
        text = text.replace(from, to);
    }
    fs.writeFileSync(file, text);
    console.log(`patched ${rel} (${pairs.length})`);
}

patch('ExportEngine.kt', [
    ['throw ExportException("编码器没有产出一帧（${request.width}x${request.height} 可能超出它的能力）")\n                    tailNote = "编码器结尾没有回话，最后几帧可能缺失（已写入 $framesWritten 帧）"',
     'throw ExportException("the encoder produced no frame; ${request.width}x${request.height} may be beyond it",\n                        code = "noFrames", args = frameArgs(request))\n                    tailNote = "encoder went silent at the tail"\n                    tailCode = "tailStuck"\n                    tailArgs = mapOf("frames" to framesWritten)'],
    ['throw ExportException("编码器没有产出一帧（${request.width}x${request.height} 可能超出它的能力）")\n            }',
     'throw ExportException("the encoder produced no frame; ${request.width}x${request.height} may be beyond it",\n                code = "noFrames", args = frameArgs(request))\n            }'],
    ['if (track >= 0) throw ExportException("编码器中途改了格式")',
     'if (track >= 0) throw ExportException("encoder changed its output format mid-stream", code = "formatChanged")'],
    ['if (cameras.isEmpty()) throw ExportException("没有可导出的摄像头画面")',
     'if (cameras.isEmpty()) throw ExportException("no camera file matched the request", code = "noStreams")'],
    ['if (failure == null && size == 0L) failure = "写出的文件是空的"',
     'if (failure == null && size == 0L) { failure = "the file came out empty"; failureCode = "emptyFile" }'],
    ['failure = "${paintedOnce.size} 路解码器一帧画面都没交出来，文件里只有叠加层"',
     'failure = "${paintedOnce.size} decoder(s) never produced a picture; only the overlays are in the file"\n            failureCode = "darkAll"\n            failureArgs = mapOf("n" to paintedOnce.size)'],
    ['tailNote = listOfNotNull(tailNote, "有 $dark 路全程没有画面").joinToString("；")',
     'tailNote = listOfNotNull(tailNote, "$dark view(s) had no picture at all").joinToString("; ")\n            tailCode = "darkSome"\n            tailArgs = mapOf("n" to dark)'],
    ['put("message", failure ?: if (job.cancelled.get()) {\n                if (size > 0L) "已取消，已写入的片段保存在文件里" else "已取消"\n            } else (tailNote ?: ""))',
     'put("message", failure ?: if (job.cancelled.get()) {\n                if (size > 0L) "cancelled, the written part is kept" else "cancelled"\n            } else (tailNote ?: ""))\n            put("code", failureCode.ifEmpty { tailCode.ifEmpty { if (job.cancelled.get())\n                (if (size > 0L) "cancelledKept" else "cancelled") else "" } })\n            (failureArgs.ifEmpty { tailArgs }).forEach { (key, value) -> put(key, value) }'],
    ['    private fun lastEglError(): Int = EGL14.eglGetError()',
     '    /** The size a `noFrames` toast has to quote: this is the pair the encoder was asked for. */\n    private fun frameArgs(request: Request): Map<String, Any> =\n        mapOf("w" to request.width, "h" to request.height)\n\n    private fun lastEglError(): Int = EGL14.eglGetError()'],
]);

patch('CameraStream.kt', [
    ['throw ExportException("$camera: no decoder for ${segment.path}（$rejected）")',
     'throw ExportException("$camera: no decoder for ${segment.path}: $rejected", code = "noDecoder")'],
]);
