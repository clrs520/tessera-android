// Seed the metadata manager with readings shaped exactly like a decoded SEI record.
// The emulator's fixture MP4s are ffmpeg-generated and carry no Tesla SEI, so
// `currentMetadata` is always empty there and the 行车数据 card never reaches the state
// the R66 pill is built for. This injects the values `updateDisplay()` reads — classes,
// computed styles and geometry are all the real ones, only the numbers are staged.
(() => {
    const mm = viewer.metadataManager;
    if (!mm) return 'NO metadataManager';
    mm.currentMetadata = [
        { time: 0, data: { vehicleSpeedMps: 0, gearState: 'GEAR_PARK', steeringWheelAngle: 0, autopilotState: 'OFF' } },
        { time: 1, data: { vehicleSpeedMps: 11.11, gearState: 'GEAR_DRIVE', steeringWheelAngle: -12, autopilotState: 'AUTOSTEER' } },
        { time: 18, data: { vehicleSpeedMps: 11.11, gearState: 'GEAR_DRIVE', steeringWheelAngle: -12, autopilotState: 'AUTOSTEER' } }
    ];
    mm.isLoading = false;
    mm.updateUIStatus();
    mm.setCollapsed(false);
    mm.updateDisplay(5);
    return JSON.stringify({ pts: mm.currentMetadata.length, collapsed: mm.dom.panel.classList.contains('collapsed') });
})()
