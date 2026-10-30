// R69: the emulator's TeslaCam fixtures carry no SEI at all (probe said seiCount:0), so every
// telemetry surface — speed curve, data card, HUD burn-in — has been untestable here. Build three
// tiny MP4s that DashcamMP4 can walk, with SEI NALs framed exactly the way decodeSei() expects
// (0x06 0x05 <size> then 0x42… 0x69 then protobuf, emulation-prevention applied, last byte dropped),
// encode them with the page's own SeiMetadata type, then decode them straight back to prove the
// round trip before the files ever leave the page. Returns base64 so a shell step can push them.
(() => {
  const Sei = viewer.metadataManager.SeiMetadata;
  if (!Sei) return 'NO_PROTOBUF';

  const enc32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const box = (type, ...payloads) => {
    const body = DashcamMP4.concat(...payloads);
    return DashcamMP4.concat(Uint8Array.from(enc32(body.length + 8)),
      Uint8Array.from([...type].map(c => c.charCodeAt(0))), body);
  };
  const zeros = n => new Uint8Array(n);

  // 0x00 0x00 followed by <=0x03 needs an 0x03 stuffed in, which is what stripEmulationBytes undoes.
  function escapeNal(data) {
    const out = [];
    let run = 0;
    for (const b of data) {
      if (run >= 2 && b <= 3) { out.push(3); run = 0; }
      out.push(b);
      run = b === 0 ? run + 1 : 0;
    }
    return Uint8Array.from(out);
  }

  function seiNal(payload) {
    const magic = Uint8Array.from([0x42, 0x42, 0x69]);
    const body = DashcamMP4.concat(magic, escapeNal(payload), Uint8Array.from([0x80]));
    return Uint8Array.from([0x06, 0x05, body.length, ...body]);
  }

  // A slice NAL just has to exist and be type 1 or 5; parseMetadata counts frames by it.
  const sliceNal = Uint8Array.from([0x01, 0x20, 0x00]);

  const TIMESCALE = 1000;
  const FRAMES = 60;          // 1 s apart -> the SEI time axis spans the whole 60 s segment

  function stts(frames) {
    return box('stts', Uint8Array.from([...zeros(4), ...enc32(1), ...enc32(frames), ...enc32(TIMESCALE)]));
  }
  function stsz(frames) {
    return box('stsz', Uint8Array.from([...zeros(4), ...enc32(0), ...enc32(frames)]));
  }
  function stco() { return box('stco', Uint8Array.from([...zeros(4), ...enc32(0)])); }
  function stsc() { return box('stsc', Uint8Array.from([...zeros(4), ...enc32(0)])); }

  function buildTrak(nals) {
    const sps = Uint8Array.from([0x67, 0x42, 0xC0, 0x1E]);
    const pps = Uint8Array.from([0x68, 0xCE, 0x3C, 0x80]);
    const avcC = box('avcC', Uint8Array.from([
      1, 0x42, 0xC0, 0x1E, 0xFF, 1,
      ...enc32(sps.length).slice(2), ...sps,
      1,
      ...enc32(pps.length).slice(2), ...pps
    ]));
    // getConfig() reads width/height at avc1+24/26 and avcC at avc1+78, so the VisualSampleEntry
    // preamble in front of the record has to be exactly 78 bytes.
    const avc1Body = DashcamMP4.concat(zeros(24), Uint8Array.from([0, 0x48, 0, 0x48]), zeros(50), avcC);
    const avc1 = box('avc1', avc1Body);
    const stsd = box('stsd', Uint8Array.from([...zeros(4), ...enc32(1)]), avc1);
    const stbl = box('stbl', stsd, stts(FRAMES), stsc(), stsz(FRAMES), stco());
    const minf = box('minf', box('vmhd', zeros(8)), box('dinf', box('dref', zeros(8))), stbl);
    const mdhd = box('mdhd', Uint8Array.from([...zeros(4), ...enc32(0), ...enc32(0),
      ...enc32(TIMESCALE), ...enc32(FRAMES), 0x55, 0xC4, 0, 0]));
    const hdlr = box('hdlr', Uint8Array.from([...zeros(4), ...enc32(0), ...[...'vide'].map(c => c.charCodeAt(0))]), zeros(12));
    const mdia = box('mdia', mdhd, hdlr, minf);
    const tkhd = box('tkhd', zeros(80));
    const trakBox = box('trak', tkhd, mdia);

    const mdatBody = (() => {
      const parts = [];
      for (const nal of nals) { parts.push(Uint8Array.from(enc32(nal.length)), nal); }
      return DashcamMP4.concat(...parts);
    })();
    return { file: DashcamMP4.concat(box('ftyp', Uint8Array.from([...'isom', ...zeros(4), ...'isom'])), box('moov', box('mvhd', zeros(100)), trakBox), box('mdat', mdatBody)) };
  }

  function segment(speedFn, seqBase) {
    const nals = [];
    for (let f = 0; f < FRAMES; f++) {
      const msg = Sei.create({
        version: 1,
        gearState: 1,
        frameSeqNo: seqBase + f,
        vehicleSpeedMps: speedFn(f),
        steeringWheelAngle: (f % 7) - 3,
        brakeApplied: f === 30,
        autopilotState: f > 40 ? 'TACC' : 'NONE'
      });
      nals.push(seiNal(Sei.encode(msg).finish()));
      nals.push(f === 0 ? Uint8Array.from([0x05, 0x20, 0x00]) : sliceNal);
    }
    return nals;
  }

  const specs = [
    { name: 'seg0', speed: f => 5 + f * 0.1 },
    { name: 'seg1', speed: f => f === 30 ? 33.3 : 11 + f * 0.05 },
    { name: 'seg2', speed: f => Math.max(0, 6 - f * 0.08) }
  ];

  const out = [];
  for (const [i, spec] of specs.entries()) {
    const { file } = buildTrak(segment(spec.speed, i * FRAMES));
    const buf = file.slice().buffer;
    // Round trip through the app's own parser before shipping the bytes.
    const parsed = new DashcamMP4(buf).parseMetadata();
    const decoded = parsed.map(p => Sei.toObject(Sei.decode(p.data), { enums: String, longs: String }));
    const cfg = new DashcamMP4(buf).getConfig();
    out.push({
      name: spec.name, bytes: file.length, parsed: parsed.length,
      firstSpeed: decoded[0]?.vehicleSpeedMps, midSpeed: decoded[30]?.vehicleSpeedMps,
      midTime: parsed[30]?.time, durMs: cfg.durations[0], frames: cfg.durations.length,
      b64: btoa(String.fromCharCode.apply(null, file))
    });
  }
  return JSON.stringify(out);
})()
