// R181 · 强制一次 reflow 后重新合成，再截图（AVD 的 WebView 有时会交旧纹理）。
(async () => {
    const el = document.documentElement;
    el.style.zoom = '1.001';
    void el.offsetHeight;
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    el.style.zoom = '';
    void el.offsetHeight;
    await new Promise((r) => setTimeout(r, 400));
    return JSON.stringify({ zoom: el.style.zoom, text: document.getElementById('aboutBtn')?.textContent.trim() });
})()
