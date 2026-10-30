(() => {
  const pa = document.getElementById('playerArea');
  return JSON.stringify({ body: document.body.className, player: pa.className,
    viewBtns: [...document.querySelectorAll('.view-btn')].map(b => b.dataset.view + ':' + b.classList.contains('active')).join(' '),
    hudDisp: getComputedStyle(document.getElementById('metadataPanel')).display });
})()
