(() => {
    const i = document.getElementById('androidDirPathInput');
    i.value = '/storage/emulated/0/Android/data/com.tdashcam.studio/files';
    i.dispatchEvent(new Event('input', {bubbles: true}));
    const g = document.getElementById('androidDirGoBtn');
    const r = g.getBoundingClientRect();
    const c = document.querySelector('#androidDirModal .modal-content');
    return JSON.stringify({value: i.value, go: [Math.round((r.x+r.width/2)*devicePixelRatio), Math.round((r.y+r.height/2)*devicePixelRatio)],
        inputW: Math.round(i.getBoundingClientRect().width), contentX: Math.round(c.getBoundingClientRect().x)});
})()
