const PORT = 9333;
const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) }).then(r=>r.json());
const page = pages.find(p=>p.type==='page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('ws timeout')),8000);ws.addEventListener('open',()=>{clearTimeout(t);res()});ws.addEventListener('error',()=>rej(new Error('ws failed')))});
let seq=0; const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const p=pending.get(m.id); if(!p)return; pending.delete(m.id); m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result)});
function send(method,params={}){const id=++seq;const p=new Promise((res,rej)=>pending.set(id,{res,rej}));ws.send(JSON.stringify({id,method,params}));return p}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||'threw'); return r.result.value}
const PROBE = [
  '(function(){',
  'var dpr = window.devicePixelRatio;',
  'var out = { sidebarOpen: document.body.classList.contains("sidebar-open"), buttons: [] };',
  'var sel = "#phoneActionBar button, .phone-action-bar button, #tabEventsBtn, #tabPlayBtn, #tabViewBtn, #tabSettingsBtn, #tabMoreBtn";',
  'var seen = {};',
  '[].slice.call(document.querySelectorAll(sel)).forEach(function(el){',
  '  if (seen[el.id]) return; seen[el.id] = 1;',
  '  var cs = getComputedStyle(el);',
  '  var b = el.getBoundingClientRect();',
  '  out.buttons.push({id: el.id, cls: String(el.className).slice(0,40), vis: cs.visibility, disp: cs.display,',
  '    x: Math.round((b.left+b.width/2)*dpr), y: Math.round((b.top+b.height/2)*dpr), w: Math.round(b.width), h: Math.round(b.height)});',
  '});',
  'return JSON.stringify(out);',
  '})()'
].join('\n');
await send('Runtime.enable');
console.log(await evaluate(PROBE));
ws.close();
