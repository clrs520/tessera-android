(async () => {
  const mm = window.viewer?.metadataManager;
  const r = {};
  r.protobufGlobal = typeof protobuf;
  r.SeiMetadata = !!mm?.SeiMetadata;
  r.isLoading = mm?.isLoading;
  r.count = mm?.currentMetadata?.length;
  r.protoUrl = new URL('dashcam.proto', location.href).href;
  try { const resp = await fetch('dashcam.proto'); r.protoStatus = resp.status; r.protoLen = (await resp.text()).length; }
  catch (e) { r.protoErr = String(e); }
  try { const resp2 = await fetch('vendor/protobuf.min.js', { method: 'HEAD' }); r.vendorStatus = resp2.status; } catch (e) { r.vendorErr = String(e); }
  return JSON.stringify(r);
})()
