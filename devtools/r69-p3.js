// The `peStarting` guard, tested by behaviour. Two separate questions, because they fail differently:
//  T1 - taps whose replies are still in flight must only ask the native side once;
//  T2 - a throw on the way to the bridge must not leave 「开始导出」 dead until the page reloads.
// Only `startExport` requests are counted: the bridge carries unrelated traffic too, and a bare
// counter once read "2 asks" from one tap because the permission call was counted as an export.
(async () => {
  const r = { steps: [], log: [] };
  const settle = ms => new Promise(res => setTimeout(res, ms));
  const realCaptions = TeslaCamViewer.prototype.phoneExportCaptions;
  const realAsk = window.nativeAsk;
  let asks = 0;
  const ctl = viewer.videoControls;
  const rangeBefore = [ctl.clipStartTime, ctl.clipEndTime];
  const mark = t => r.log.push(`${t} asks=${asks} flag=${viewer.peStarting ? 1 : 0}`);
  try {
    // Positive baseline first: without a legal range the method returns at `plan.error` and every
    // number below reads as a pass while testing nothing.
    ctl.clipStartTime = 2; ctl.clipEndTime = 5;
    const plan = viewer.phoneExportPlan();
    r.planOk = !plan.error;
    r.baseline = { bridge: !!nativeMethod('startExport'), cams: (plan.cameras || []).length };
    if (!r.planOk) return JSON.stringify(r, null, 1);

    window.nativeAsk = (name, payload) => new Promise(res => {
        if (name === 'startExport') asks++;
        r.log.push(`ask:${name}`);
        setTimeout(() => res(''), 250);   // a reply that parses as nothing: the method stops at the error toast
    });

    // --- T1: overlapping taps
    viewer.peStarting = false;
    const a = viewer.startPhoneExport();
    mark('after-a');
    const b = viewer.startPhoneExport();
    const c = viewer.startPhoneExport();
    mark('after-bc');
    r.asksWhilePending = asks;
    r.flagWhilePending = !!viewer.peStarting;
    r.rejected = [a, b, c].map(p => p && typeof p.then === 'function' ? 'promise' : String(p));
    await Promise.all([a, b, c]);
    await settle(400);
    r.asksAfter = asks;
    r.flagAfter = !!viewer.peStarting;
    mark('after-T1');

    // --- T2: the build throws before the bridge is reached. Caught here, because the method
    // re-throws through its own `finally` — that is the point of the test.
    asks = 0;
    viewer.phoneExportCaptions = () => { throw new Error('probe: captions too wide'); };
    await viewer.startPhoneExport().then(() => { r.t2 = 'resolved'; }, e => { r.t2 = 'threw:' + e.message; });
    r.asksOnThrow = asks;
    r.flagOnThrow = !!viewer.peStarting;
    mark('after-T2');

    // and the button must work again right after
    delete viewer.phoneExportCaptions;
    r.restored = viewer.phoneExportCaptions === realCaptions;
    await viewer.startPhoneExport().then(() => { r.t3 = 'resolved'; }, e => { r.t3 = 'threw:' + e.message; });
    r.asksAfterRecover = asks;
    r.recovered = asks === 1;
    mark('after-T3');
    return JSON.stringify(r, null, 1);
  } catch (e) {
    r.err = String(e && e.stack || e);
    return JSON.stringify(r, null, 1);
  } finally {
    delete viewer.phoneExportCaptions;
    window.nativeAsk = realAsk;
    viewer.peStarting = false;
    ctl.clipStartTime = rangeBefore[0]; ctl.clipEndTime = rangeBefore[1];
  }
})()
