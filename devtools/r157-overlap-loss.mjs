// R157 — what a same-minute pair actually costs, and how a real event's ruler compares to the clock.
import { promises as fs } from 'node:fs';
const ROOT = 'D:/TeslaCam';
const NAME = /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})-(front|back|left_repeater|right_repeater|left_pillar|right_pillar)\.mp4$/;
const ep = s => { const [d,t]=s.split('_'); const [Y,M,D]=d.split('-').map(Number); const [h,m,x]=t.split('-').map(Number); return Date.UTC(Y,M-1,D,h,m,x); };
async function dur(file){let fh;try{fh=await fs.open(file,'r');const st=await fh.stat();let pos=0;
  const rd=async(p,n)=>{const b=Buffer.alloc(n);const {bytesRead}=await fh.read(b,0,n,p);return b.subarray(0,bytesRead);};
  const box=(b,p,total)=>{if(p+8>b.length)return null;let sz=b.readUInt32BE(p);const k=b.toString('latin1',p+4,p+8);let h=8;if(sz===1){if(p+16>b.length)return null;sz=Number(b.readBigUInt64BE(p+8));h=16;}else if(sz===0)sz=total-p;if(sz<h||p+sz>total)return null;return{sz,k,h,end:p+sz};};
  for(let i=0;i<512&&pos+8<=st.size;i++){const b=box(await rd(pos,16),0,st.size);if(!b)return null;
    if(b.k==='moov'){const data=await rd(pos+b.h,Math.min(b.sz-b.h,65536));
      for(let p=0;p+8<=data.length;){const c=box(data,p,data.length);if(!c)return null;
        if(c.k==='mvhd'){const v=data[p+c.h];const ts=v===1?data.readUInt32BE(p+c.h+20):data.readUInt32BE(p+c.h+12);const d=v===1?Number(data.readBigUInt64BE(p+c.h+24)):data.readUInt32BE(p+c.h+16);return ts&&d?d/ts:null;}
        p=c.end;}return null;}
    pos+=b.sz;}return null;}catch{return null;}finally{await fh?.close().catch(()=>{});}}

const out = { sameMinute: { pairs: 0, totalLostSec: 0, losses: [], examples: [] }, gapRanges: [] };
for (const cat of ['SavedClips','SentryClips']) {
  for (const e of (await fs.readdir(`${ROOT}/${cat}`, { withFileTypes: true })).filter(x=>x.isDirectory())) {
    const dir = `${ROOT}/${cat}/${e.name}`;
    let files=[]; try { files = (await fs.readdir(dir)).filter(f=>NAME.test(f)); } catch { continue; }
    const fronts = new Map(); // stamp -> name
    for (const f of files) { const m=NAME.exec(f); if(m[1] && m[2]==='front') fronts.set(m[1], f); }
    const stamps=[...fronts.keys()].sort();
    for (let i=1;i<stamps.length;i++){
      const a=stamps[i-1], b=stamps[i];
      if (a.slice(0,16)!==b.slice(0,16)) continue;
      const da=await dur(`${dir}/${fronts.get(a)}`), db=await dur(`${dir}/${fronts.get(b)}`);
      if(!da||!db) continue;
      const aEnd=ep(a)/1000+da, bStart=ep(b)/1000, bEnd=bStart+db;
      const overlap=Math.max(0, aEnd-bStart);
      const lost=Math.max(0, bEnd-aEnd);
      out.sameMinute.pairs++; out.sameMinute.totalLostSec+=lost; out.sameMinute.losses.push(+lost.toFixed(1));
      if(out.sameMinute.examples.length<6) out.sameMinute.examples.push({cat, a, b, durA:+da.toFixed(3), durB:+db.toFixed(3), overlap:+overlap.toFixed(1), lost:+lost.toFixed(1)});
    }
    // Ruler vs wall clock for events whose fronts all have durations (cap the reads per event).
    if (cat==='SentryClips' && out.gapRanges.length<3 && stamps.length>=4 && stamps.length<=6) {
      const rows=[];
      for(const s of stamps){ const d=await dur(`${dir}/${fronts.get(s)}`); if(d) rows.push({s,d}); }
      if(rows.length===stamps.length && rows.length>=4){
        let ruler=0, wall=0;
        for(let i=0;i<rows.length;i++){
          ruler+=rows[i].d;
          wall += i===0?0:(ep(rows[i].s)-ep(rows[i-1].s))/1000;
        }
        out.gapRanges.push({cat, clips:rows.length, ruler:+ruler.toFixed(1), wall:+wall.toFixed(1),
          perHandoff:rows.slice(1).map((r,i)=>+(((ep(r.s)-ep(rows[i].s))/1000)-rows[i].d).toFixed(1))});
      }
    }
  }
}
out.sameMinute.losses.sort((a,b)=>a-b);
out.sameMinute.medianLostSec = out.sameMinute.losses.length? out.sameMinute.losses[Math.floor(out.sameMinute.losses.length/2)] : 0;
out.sameMinute.maxLostSec = out.sameMinute.losses.length? out.sameMinute.losses[out.sameMinute.losses.length-1] : 0;
delete out.sameMinute.losses;
console.log(JSON.stringify(out,null,1));
