// Arm a touch-event recorder so a pinch either reaches the app or it does not, with evidence.
window.__pinchLog = [];
if (!window.__pinchArmed) {
    window.__pinchArmed = true;
    const area = document.querySelector('.player-area');
    ['touchstart', 'touchmove', 'touchend'].forEach(type => {
        area.addEventListener(type, e => {
            if (type === 'touchstart') {
                window.__pinchLog.push({
                    type,
                    n: e.touches.length,
                    target: (e.target.className || e.target.tagName) + '',
                    phone: typeof isPhoneLayout === 'function' ? isPhoneLayout() : null,
                    ev: !!window.viewer?.currentEvent,
                });
            }
        }, { capture: true, passive: true });
    });
}
'armed';
