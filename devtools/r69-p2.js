// The three R69 gates, tested by behaviour rather than by grep. Fire-and-forget: the whole run is
// longer than the 10 s CDP answer window, so progress lands in window.__p2 and is read back after.
window.__p2 = { steps: [], done: false };
(async () => {
  const r = window.__p2;
  const mark = s => r.steps.push(s);
  const settle = ms => new Promise(res => setTimeout(res, ms));
  const real = isTouchShellRuntime;
  const posKey = ANDROID_PLAYBACK_POS_KEY;
  const id = 'TeslaCam/SavedClips/2026-10-08_07-41-59';
  const readMap = () => { try { return JSON.parse(localStorage.getItem(posKey) || '{}'); } catch (e) { return {}; } };
  const clear = () => localStorage.removeItem(posKey);
  try {
    mark('play ' + id);
    await viewer.playEvent(id);
    await settle(1500);
    r.played = viewer.currentEvent && viewer.currentEvent.eventId;
    r.duration = viewer.continuousPlayer.getTotalDuration();

    mark('rememberPlaybackPosition');
    clear();
    await viewer.continuousPlayer.seekToTime(12);
    await settle(600);
    r.at = +viewer.continuousPlayer.getCurrentTime().toFixed(1);
    isTouchShellRuntime = () => false;
    viewer.rememberPlaybackPosition();
    await settle(150);
    r.desktopMapKeys = Object.keys(readMap()).length;
    isTouchShellRuntime = real;
    viewer.rememberPlaybackPosition();
    await settle(150);
    r.touchMapKeys = Object.keys(readMap()).length;
    r.touchStored = readMap()[id];

    mark('auto-next desktop');
    const before = { run: viewer.playEventRun, ev: viewer.currentEvent.eventId };
    viewer.autoNextEnabled = true;
    clear();
    isTouchShellRuntime = () => false;
    viewer.onEventPlaybackFinished();
    await settle(500);
    r.desktopAdvanced = viewer.playEventRun !== before.run
        || (viewer.currentEvent && viewer.currentEvent.eventId) !== before.ev;

    mark('tap entry point');
    isTouchShellRuntime = real;
    viewer.setTapBehavior('resume');
    localStorage.setItem(posKey, JSON.stringify({ [id]: 8 }));
    await viewer.playEvent(id);
    await settle(1500);
    await viewer.continuousPlayer.seekToTime(0);
    await settle(400);
    const atZero = viewer.continuousPlayer.getCurrentTime();
    isTouchShellRuntime = () => false;
    await viewer.applyTapEntryPoint(viewer.currentEvent);
    await settle(500);
    r.desktopMoved = +(viewer.continuousPlayer.getCurrentTime() - atZero).toFixed(2);
    isTouchShellRuntime = real;
    await viewer.applyTapEntryPoint(viewer.currentEvent);
    await settle(900);
    r.touchMoved = +(viewer.continuousPlayer.getCurrentTime() - atZero).toFixed(2);
    r.savedPosFor = viewer.savedPositionFor(viewer.currentEvent);

    mark('auto-next phone');
    const order = viewer.lastFilteredEvents && viewer.lastFilteredEvents.length
        ? viewer.lastFilteredEvents : viewer.eventGroups;
    const me = order.findIndex(e => e.eventId === viewer.currentEvent.eventId);
    const next = order[me + 1] || order[0];
    r.nextChosen = next.eventId;
    viewer.lastFilteredEvents = [
        { eventId: viewer.currentEvent.eventId, startTime: viewer.currentEvent.startTime }, next];
    const beforeTouch = viewer.currentEvent.eventId;
    viewer.onEventPlaybackFinished();
    await settle(2500);
    r.touchAdvanced = (viewer.currentEvent && viewer.currentEvent.eventId) !== beforeTouch;
    r.touchNowOn = viewer.currentEvent && viewer.currentEvent.eventId;
    clear();
  } catch (e) {
    r.err = String(e && e.stack || e);
  } finally {
    isTouchShellRuntime = real;
    r.done = true;
  }
})().catch(e => { window.__p2.err = 'outer:' + e; window.__p2.done = true; });
'started'
