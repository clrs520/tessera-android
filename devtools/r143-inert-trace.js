// 谁把 .main-content 的 inert 写回 false —— 在元素上拦截这个属性，把每次赋值的调用栈抓下来。
(async () => {
  const v = window.viewer;
  const el = document.querySelector('.main-content');
  const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'inert');
  const out = { hasInertAccessor: !!d, writes: [] };
  if (!d || !d.set) return JSON.stringify(out);
  let cur = false;
  const realSet = d.set.bind(el), realGet = d.get.bind(el);
  Object.defineProperty(el, 'inert', {
    configurable: true,
    get() { return cur; },
    set(val) {
      const stack = (new Error().stack || '').split('\n').slice(2, 5)
        .map(s => s.trim().replace(/https?:\/\/[^\s]*?script\.js/, 'script.js')).join(' <- ');
      out.writes.push((val ? 'true' : 'false') + ' @' + Math.round(performance.now()) + ' :: ' + stack);
      cur = !!val;
    },
  });
  el.inert = false;
  const more = document.getElementById('tabMoreBtn'); more.focus();
  await v.showPhoneExportModal();
  await new Promise(r => setTimeout(r, 700));
  out.readback = { inert: el.inert, sheetOpen: v.sheetOpen ? v.sheetOpen.id : null };
  el.removeAttribute && null;
  delete el.inert;                       // 交还原型上的访问器
  out.restoredAccessor = Object.getOwnPropertyDescriptor(el, 'inert') === undefined;
  return JSON.stringify(out, null, 1);
})()
