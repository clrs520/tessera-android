// R67: is there anything for a vertical pan inside .player-area to actually scroll?
(() => {
  const area = document.getElementById('playerArea');
  const chain = [];
  let n = area;
  while (n && n !== document.documentElement) {
    chain.push({
      el: n.id ? '#' + n.id : '.' + String(n.className).trim().split(' ')[0],
      scrollable: n.scrollHeight > n.clientHeight + 1,
      sh: n.scrollHeight, ch: n.clientHeight,
      oy: getComputedStyle(n).overflowY, ta: getComputedStyle(n).touchAction
    });
    n = n.parentElement;
  }
  const drawer = document.querySelector('#metadataDrawer, .metadata-drawer, #metadataPanel');
  return {
    chain,
    drawerInArea: drawer ? area.contains(drawer) : 'no drawer element found',
    drawerCls: drawer ? (drawer.id || drawer.className) : null,
    pageScrollY: window.scrollY,
    docScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight
  };
})();
