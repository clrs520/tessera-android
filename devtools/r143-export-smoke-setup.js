(async () => {
  const v = window.viewer;
  if (!v.currentEvent) {
    const ev = v.eventGroups.find(g => (g.segments || []).length >= 3);
    v.playEvent(ev);
    await new Promise(r => setTimeout(r, 4000));
  }
  await v.showPhoneExportModal();
  await new Promise(r => setTimeout(r, 600));
  const btns = [...document.querySelectorAll('#peViewChips button, .pe-views button, #peViews button')]
    .map(b => ({ id: b.id, txt: b.textContent.trim(), cls: b.className }));
  return JSON.stringify({ event: !!v.currentEvent, plan: v.phoneExportPlan().error ? v.phoneExportPlan().error : {
      w: v.phoneExportPlan().width, h: v.phoneExportPlan().height, cams: (v.phoneExportPlan().cameras || []).length,
      durUs: v.phoneExportPlan().durationUs }, btns: btns.slice(0, 10) });
})()
