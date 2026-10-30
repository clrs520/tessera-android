// Measures the centre of the first event row whose id contains $ARGUMENTS[0]-ish substring.
const SUB = process.argv[2] || '2026-10-08_09-00-00';
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
  'var sub = ' + JSON.stringify(SUB) + ';',
  'var rows = [].slice.call(document.querySelectorAll("[data-event-id]"));',
  'var dpr = window.devicePixelRatio;',
  'var pick = null;',
  'for (var i=0;i<rows.length;i++){ if (rows[i].dataset.eventId.indexOf(sub) >= 0) { pick = rows[i]; break; } }',
  'if (!pick) return JSON.stringify({error:"not found", ids: rows.map(function(r){return r.dataset.eventId})});',
  'pick.scrollIntoView({block:"center"});',
  'var b = pick.getBoundingClientRect();',
  'var hit = document.elementFromPoint(b.left+b.width/2, b.top+b.height/2);',
  'return JSON.stringify({id: pick.dataset.eventId, x: Math.round((b.left+b.width/2)*dpr), y: Math.round((b.top+b.height/2)*dpr),',
  ' hitOk: hit===pick||pick.contains(hit), hitTag: hit?(hit.id||String(hit.className).slice(0,30)):null});',
  '})()'
].join('\n');
await send('Runtime.enable');
console.log(await evaluate(PROBE));
ws.close();
