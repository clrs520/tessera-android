(() => {
    const b = document.getElementById('androidDirSelectBtn');
    const r = b.getBoundingClientRect();
    return {
        txt: b.textContent.trim(), path: window.viewer?.androidBrowsePath,
        tapX: Math.round((r.left + r.width / 2) * devicePixelRatio),
        tapY: Math.round((r.top + r.height / 2) * devicePixelRatio),
    };
})()
