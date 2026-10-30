// R108 排查：`hdr.add('active')` 之后 4s 内它自己没了 —— 谁摘的？
// 面板从四个地方关（另一个 tab、遮罩、返回手势、header 重新展开），所以只能给 headerRight 的
// classList 装栈探针，把「摘掉 active 的那一次调用」的栈打出来。按机制推断选落点这条规矩（R95）
// 在这里同样适用：不猜，看栈。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const hdr = document.querySelector('.header-right');
    const out = { removed: [], added: [], seen: [] };
    const raw = hdr.classList;
    const native = {};
    ['add', 'remove', 'toggle'].forEach((fn) => {
        native[fn] = raw[fn].bind(raw);
        raw[fn] = function (...a) {
            const hit = a.some((x) => String(x) === 'active');
            if (hit) {
                const stack = (new Error().stack || '').split('\n').slice(1, 5)
                    .map((l) => l.trim().replace(/^at /, '')).join(' ← ');
                (fn === 'add' ? out.added : out.removed).push(`${fn}(${a.join(',')}) | ${stack}`);
            }
            return native[fn](...a);
        };
    });
    native.remove('active');
    await sleep(400);
    native.add('active');
    for (let i = 0; i < 24; i++) {
        await sleep(200);
        out.seen.push(`${(i + 1) * 200}ms active=${hdr.classList.contains('active') ? 1 : 0} lensLive=${glassState.lensLive} collapsed=${document.querySelector('.main-header')?.classList.contains('header-collapsed') ? 1 : 0}`);
    }
    ['add', 'remove', 'toggle'].forEach((fn) => { hdr.classList[fn] = native[fn]; });
    out.final = hdr.className;
    return out;
})();
