// What is actually inside mdat? Counts NAL types, and for type 6 dumps the first bytes
// so a rejection can be told apart from absence.
(async () => {
  const v = window.viewer;
  const f = v.currentEvent?.segments?.[0]?.files?.front;
  if (!f) return JSON.stringify({ err: 'no front file' });
  const buf = await (await fetch(getFileUrl(f))).arrayBuffer();
  const view = new DataView(buf);
  const mp4 = new DashcamMP4(buf);
  const mdat = mp4.findMdat();
  const types = {};
  const six = [];
  let cursor = mdat.offset;
  const end = mdat.offset + mdat.size;
  while (cursor + 4 <= end) {
    const len = view.getUint32(cursor);
    cursor += 4;
    if (len < 1 || cursor + len > view.byteLength) { six.push({ trunc: true, cursor, end }); break; }
    const t = view.getUint8(cursor) & 0x1F;
    types[t] = (types[t] || 0) + 1;
    if (t === 6 && six.length < 4) {
      const b = new Uint8Array(buf.slice(cursor, cursor + Math.min(len, 24)));
      six.push({ len, hex: [...b].map(x => x.toString(16).padStart(2, '0')).join(' ') });
    }
    cursor += len;
  }
  return JSON.stringify({
    mb: +(buf.byteLength / 1048576).toFixed(1),
    mdatOffset: mdat.offset, mdatSize: mdat.size,
    nalTypeCounts: types, seiSamples: six,
    bytesReadPastMdat: cursor - mdat.offset
  }, null, 1);
})()
