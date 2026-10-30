({
    coarse: matchMedia('(pointer: coarse)').matches,
    fine: matchMedia('(pointer: fine)').matches,
    anyCoarse: matchMedia('(any-pointer: coarse)').matches,
    hoverNone: matchMedia('(hover: none)').matches,
    hoverHover: matchMedia('(hover: hover)').matches,
    phoneLayout: typeof isPhoneLayout === 'function' ? isPhoneLayout() : null,
    android: typeof isAndroidRuntime === 'function' ? isAndroidRuntime() : null,
    w: innerWidth, h: innerHeight, dpr: devicePixelRatio,
    touchPoints: navigator.maxTouchPoints,
});
