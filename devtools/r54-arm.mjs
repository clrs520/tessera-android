const PORT = 9333;
const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) }).then(r=>r.json());
const page = pages.find(p=>p.type==='page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('ws timeout')),8000);ws.addEventListener('open',()=>{clearTimeout(t);res()});ws.addEventListener('error',()=>rej(new Error('ws failed')))});
let seq=0; const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const p=pending.get(m.id); if(!p)return; pending.delete(m.id); m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result)});
function send(method,params={}){const id=++seq;const p=new Promise((res,rej)=>pending.set(id,{res,rej}));ws.send(JSON.stringify({id,method,params}));return p}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||'threw'); return r.result.value}
const MODE = process.argv[2] || 'arm';
const ARM = [
  '(function(){',
  'window.__r54clicks = [];',
  'window.__r54toasts = window.__r54toasts || [];',
  'var v = window.viewer;',
  'if (!v.__r54hooked) { var o = v.showToast.bind(v); v.showToast = function(m,t,d){ window.__r54toasts.push(String(m)); return o(m,t,d); }; v.__r54hooked = true; }',
  'document.addEventListener("click", function(e){ window.__r54clicks.push(String(e.target.id || e.target.className).slice(0,28) + "@" + Math.round(e.clientX) + "," + Math.round(e.clientY)); }, true);',
  'var el = document.getElementById("downloadFileBtn"); var b = el.getBoundingClientRect(); var dpr = devicePixelRatio;',
  'return JSON.stringify({armed: true, panel: /active/.test(document.getElementById("headerRight").className),',
  ' x: Math.round((b.left+b.width/2)*dpr), y: Math.round((b.top+b.height/2)*dpr), vis: getComputedStyle(el).visibility, disabled: el.disabled});',
  '})()'
].join('\n');
const READ = [
  '(function(){',
  'var hr = document.getElementById("headerRight");',
  'return JSON.stringify({clicks: window.__r54clicks, toasts: window.__r54toasts, panel: /active/.test(hr.className),',
  ' cur: window.viewer.currentEvent ? window.viewer.currentEvent.startTime : null});',
  '})()'
].join('\n');
await send('Runtime.enable');
console.log(await evaluate(MODE === 'arm' ? ARM : READ));
ws.close();
