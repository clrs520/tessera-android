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
  '(async function(){',
  'var v = window.viewer;',
  'var toasts = [];',
  'var orig = v.showToast.bind(v);',
  'v.showToast = function(m,t,d){ toasts.push(String(m)); return orig(m,t,d); };',
  'var err = null;',
  'try { await v.exportMetadataToCSV(); } catch (e) { err = String(e && e.message || e); }',
  'await new Promise(function(r){ setTimeout(r, 1500); });',
  'v.showToast = orig;',
  'return JSON.stringify({has: typeof v.exportMetadataToCSV, toasts: toasts, err: err, prefix: MOBILE_FILE_PREFIX, touchShell: isTouchShellRuntime(), android: isAndroidRuntime()});',
  '})()'
].join('\n');
await send('Runtime.enable');
console.log(await evaluate(PROBE));
ws.close();
