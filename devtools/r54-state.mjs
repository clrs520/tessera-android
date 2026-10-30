const PORT = 9333;
const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) }).then(r=>r.json());
const page = pages.find(p=>p.type==='page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('ws timeout')),8000);ws.addEventListener('open',()=>{clearTimeout(t);res()});ws.addEventListener('error',()=>rej(new Error('ws failed')))});
let seq=0; const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const p=pending.get(m.id); if(!p)return; pending.delete(m.id); m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result)});
function send(method,params={}){const id=++seq;const p=new Promise((res,rej)=>pending.set(id,{res,rej}));ws.send(JSON.stringify({id,method,params}));return p}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||'threw'); return r.result.value}
const PROBE = `(() => {
    const v = window.viewer;
    const out = { ver: null, alive: typeof v, selected: null, events: [], mediaKinds: {} };
    try { out.ver = JSON.parse(localStorage.getItem('__tdashcam_storage')||'{}').version || null; } catch(e){}
    const rows = [...document.querySelectorAll('[data-event-id]')];
    out.selectedRow = rows.findIndex(r => r.classList.contains('selected') || r.classList.contains('active'));
    out.events = rows.slice(0, 4).map(r => ({ id: r.dataset.eventId, cls: r.className, hasPath: !!r.dataset.eventPath, txt: (r.textContent||'').replace(/\s+/g,' ').trim().slice(0,70) }));
    if (v) {
        for (const k of Object.keys(v)) {
            const val = v[k];
            if (typeof val === 'string' && /\.(mp4|jpg|png|csv)/i.test(val)) out.mediaKinds[k] = val.slice(-60);
        }
        out.curEventKeys = Object.keys(v.currentEvent || {});
    }
    return JSON.stringify(out);
})()`;
await send('Runtime.enable');
console.log(await evaluate(PROBE));
ws.close();
