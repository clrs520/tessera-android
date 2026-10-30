// Reports the range the sheet is currently holding, both as text fields and as the viewer's
// actual clip selection.
//   node devtools/cdp-eval.mjs --file devtools/probe-r21-range.mjs
(() => {
  const c = window.viewer?.videoControls;
  const plan = window.viewer?.phoneExportPlan?.();
  return JSON.stringify({
    start: document.getElementById('peStartInput')?.value,
    end: document.getElementById('peEndInput')?.value,
    clip: c ? [Number(c.clipStartTime?.toFixed?.(2)), Number(c.clipEndTime?.toFixed?.(2))] : null,
    total: c?.totalDuration ? Number(c.totalDuration.toFixed(2)) : null,
    summary: document.getElementById('peSummary')?.textContent?.trim(),
    planError: plan?.error || null,
    planDuration: plan?.duration ?? null,
    disabled: document.getElementById('peStartBtn')?.disabled,
  }, null, 1);
})();
