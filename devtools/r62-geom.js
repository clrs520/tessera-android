(()=>{try{
const pa=document.getElementById('playerArea');
const cs=getComputedStyle(document.documentElement);
const paCS=getComputedStyle(pa);
const r=el=>{const b=el.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)]};
const mains=[...pa.querySelectorAll('.video-container.is-main')].filter(e=>e.offsetParent!==null||getComputedStyle(e).display!=='none');
const pips=[...pa.querySelectorAll('.video-container.is-pip')].filter(e=>getComputedStyle(e).display!=='none');
const ret={
 cls:pa.className.replace('player-area','').trim(),
 area:r(pa),
 areaPad:paCS.padding, areaAlign:paCS.alignContent, areaDisplay:paCS.display,
 areaRows:paCS.gridTemplateRows, areaCols:paCS.gridTemplateColumns,
 vh:innerHeight, vw:innerWidth,
 safeTop:cs.getPropertyValue('--safe-top').trim(),
 safeBottom:cs.getPropertyValue('--safe-bottom').trim(),
 controlsH:cs.getPropertyValue('--controls-h').trim(),
 mc:r(document.querySelector('.main-content')),
 mains:mains.map(e=>({c:e.className,h:r(e),ar:getComputedStyle(e).aspectRatio,pos:getComputedStyle(e).position,top:getComputedStyle(e).top})),
 pips:pips.map(e=>({c:e.className.split(' ').slice(-2).join(' '),h:r(e),pos:getComputedStyle(e).position})),
};
return JSON.stringify(ret);
}catch(e){return 'THREW '+e.message}})()
