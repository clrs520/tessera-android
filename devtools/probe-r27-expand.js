(async () => {
  const mm = window.viewer.metadataManager;
  mm.currentMetadata = [{ time: 5, data: { speed: 42, gear: 'D', steering_angle_degrees: 12, accelerator: 30, brake: 0, left_blinker: false, right_blinker: false, left_turn_signal: false, right_turn_signal: false } }];
  mm.setCollapsed(false);
  mm.updateUIStatus();
  await new Promise(r => setTimeout(r, 400));
  return 'ok';
})()
