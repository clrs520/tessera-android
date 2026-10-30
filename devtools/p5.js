(() => {
    const p = viewer.multiCameraPlayer.players.front;
    p.pause();
    return p.play().then(() => 'play OK (no gesture needed)')
                 .catch(e => 'play REJECTED: ' + e.name + ' — ' + e.message);
})()
