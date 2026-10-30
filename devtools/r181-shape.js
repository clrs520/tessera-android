JSON.stringify((() => {
    const v = window.viewer, l = v.videoListComponent;
    return { ver: (window.__diagVersion || (v.nativeVersion || '?')),
        has: ['listEnd','placeWindow','syncListWindow','growWindowUp','growWindowDown','setListSpacers','describeList']
            .filter((k) => (k in l) || (k in v)),
        missing: ['trimListWindow','extendListWindowUp'].filter((k) => k in l),
        listEnd: l.listEnd, pitch: typeof l.listPitch === 'function' ? Number(l.listPitch().toFixed(1)) : null,
        describeList: v.describeList ? v.describeList() : null };
})());
