const PORT = 9333;
const MODE = process.argv[2] || 'arm';
const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) }).then(r=>r.json());
const page = pages.find(p=>p.type==='page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('ws timeout')),8000);ws.addEventListener('open',()=>{clearTimeout(t);res()});ws.addEventListener('error',()=>rej(new Error('ws failed')))});
let seq=0; const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const p=pending.get(m.id); if(!p)return; pending.delete(m.id); m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result)});
function send(method,params={}){const id=++seq;const p=new Promise((res,rej)=>pending.set(id,{res,rej}));ws.send(JSON.stringify({id,method,params}));return p}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||'threw'); return r.result.value}
const ARM = [
  '(function(){',
  'window.__r54back = [];',
  'var bridge = window.TDashcamNative;',
  'if (bridge && !bridge.__r54hooked) {',
  '  var o = bridge.setBackLayers.bind(bridge);',
  '  bridge.setBackLayers = function(n){ window.__r54back.push("setBackLayers(" + n + ")"); return o(n); };',
  '  bridge.__r54hooked = true;',
  '}',
  'return JSON.stringify({hooked: !!(bridge && bridge.__r54hooked),',
  ' drawer: document.body.classList.contains("sidebar-open"), panel: /active/.test(document.getElementById("headerRight").className)});',
  '})()'
].join('\n');
const READ = [
  '(function(){',
  'return JSON.stringify({back: window.__r54back,',
  ' drawer: document.body.classList.contains("sidebar-open"),',
  ' panel: /active/.test(document.getElementById("headerRight").className),',
  ' dir: (typeof androidDownloadDir === "function") ? androidDownloadDir() : null});',
  '})()'
].join('\n');
await send('Runtime.enable');
console.log(await evaluate(MODE === 'arm' ? ARM : READ));
ws.close();
