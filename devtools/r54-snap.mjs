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
  'var v = window.viewer;',
  'var out = { sidebarOpen: document.body.classList.contains("sidebar-open") };',
  'out.curEvent = v && v.currentEvent ? String(v.currentEvent.eventPath || v.currentEvent.path || "").slice(-46) : null;',
  'var vids = [].slice.call(document.querySelectorAll("video")).slice(0,3);',
  'out.videos = vids.map(function(x){ return { src: String(x.currentSrc||x.src||"").slice(-48), t: Math.round(x.currentTime*10)/10, rs: x.readyState, w: x.videoWidth, h: x.videoHeight }; });',
  'var sb = document.getElementById("snapshotBtn");',
  'if (sb) { var cs = getComputedStyle(sb); var b = sb.getBoundingClientRect();',
  '  out.snap = { vis: cs.visibility, disp: cs.display, title: sb.title,',
  '    x: Math.round((b.left+b.width/2)*dpr), y: Math.round((b.top+b.height/2)*dpr),',
  '    css: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] };',
  '  var hit = document.elementFromPoint(b.left+b.width/2, b.top+b.height/2);',
  '  out.snap.hitOk = hit === sb || sb.contains(hit); out.snap.hitTag = hit ? (hit.id || String(hit.className).slice(0,30)) : null;',
  '} else { out.snap = "absent"; }',
  'return JSON.stringify(out);',
  '})()'
].join('\n');
await send('Runtime.enable');
console.log(await evaluate(PROBE));
ws.close();
