 const i18n = {
    en: {
        pageTitle: "Tessera",
        headerTitle: "Tessera",
        toggleSidebar: "Toggle Sidebar",
        toggleTheme: "Toggle Theme",
        toggleLanguage: "切换到中文",
        drivingRecords: "Driving Records",
        date: "Date",
        eventType: "Event Type",
        allTypes: "📂 All Types",
        recentClips: "🕒 Recent Clips",
        savedClips: "💾 Saved Clips",
        sentryClips: "🤖 Sentry Clips",
        jumpToEvent: "Jump to event",
        contextDelete: "Delete event",
        deleteConfirmTitle: "Delete this event?",
        deleteConfirmCount: "{n} files in {dir}",
        deleteConfirmMore: "…and {n} more",
        deleteConfirmWarn: "Removed straight from the drive — no trash, no undo.",
        deleteConfirmCancel: "Cancel",
        deleteConfirmOk: "Delete",
        deleteDone: "Deleted {n} files",
        deleteFailed: "Delete failed: ",
        deleteSharedDir: "Rolling clips share one folder — there is no single event here to delete",
        deleteNoBridge: "Deleting only works in the Android app",
        noRecordsFound: "No records found",
        clearFiltersBtn: "Clear filters",
        filtersCleared: "Filters cleared",
        selectFolder: "📁 Select Folder",
        selectFiles: "📁 Select Files",
        helpStep1: "Insert your Tesla USB drive into your PC",
        helpStep2: "Select or drag the 'TeslaCam' directory from the drive",
        helpStep1IOS: "Copy TeslaCam videos to your iPad/iPhone",
        helpStep2IOS: "Select the video files (e.g., 2024-01-15_12-30-00-front.mp4)",
        helpStep1Android: "Copy the whole TeslaCam folder from the USB stick onto phone storage, e.g. /storage/emulated/0/Download/TeslaCam",
        helpStep2Android: "Press Choose Folder, open that folder, then press Choose This Folder",
        helpNote: "Note: This tool does not upload your data. All operations are performed locally. (Gaode Maps may have inaccuracies due to limited WGS-84 support.)",
        desktopTip: "💡 Tip: Due to browser limitations, it is recommended to use the desktop version for better performance.",
        desktopDownload: "Download Desktop Version",
        heroTitle: "Nothing loaded yet",
        heroHint: "Pick a TeslaCam folder, then a clip from the list",
        heroFind: "Find clips",
        menuClip: "This clip",
        menuPlayback: "Playback & list",
        menuOther: "Other",
        statsFold: "Collapse the data card",
        statsExpand: "Expand the data card",
        mapModalTitle: "View on Map",
        gaodeMap: "Gaode Map",
        googleMap: "Google Map",
        revealFile: "Show Path",
        downloadFile: "Download",
        filePathAlertTitle: "Current Video File Path",
        copiedToClipboard: "Copied to clipboard",
        copyFailed: "Copy failed",
        scanReadFailed: "Could not read the folder: {msg}",
        volumeGone: "The drive was unplugged or that folder is gone — the list was cleared. Re-insert it and pick the folder again.",
        pathGoneKept: "{path} is not on this device any more (ejected drive, or the folder was deleted). The list below still belongs to {keep} — re-pick it under Files.",
        stalePathDropped: "Removed the dead path from the list: {path}",
        previousFolder: "the folder before it",
        noFilePath: "Could not determine file path for the active camera.",
        selectDate: "Select Date",
        minutes: "minutes",
        preview: "Preview",
        noSignal: "No Signal",
        front: "Front",
        back: "Back",
        left: "Left",
        right: "Right",
        leftPillar: "Left Pillar",
        rightPillar: "Right Pillar",
        play: "Play",
        pause: "Pause",
        toggleDay: "Switch to Day Mode",
        toggleNight: "Switch to Night Mode",
        themeAuto: "Theme: Follow system",
        themeLight: "Theme: Light",
        themeDark: "Theme: Dark",
        cameraZoomOut: "Back to the grid",
        feedDecodeError: "Decode failed",
        feedDecodeHint: "Out of hardware decoders: use the 4-grid or a single feed",
        feedDecodeDowngraded: "Not enough decoders for six views — switched to the 4-grid",
        tabList: "List",
        tabFolder: "Folder",
        tabLayout: "View",
        tabRefresh: "Refresh",
        tabMore: "More",
        enterFullscreen: "Fullscreen",
        exitFullscreen: "Leave fullscreen",
        contextPlay: "Play event",
        contextSingle: "Fullscreen one camera",
        contextPath: "Show path",
        noFilePath: "Could not determine the file path",
        contextMeta: "Metadata",
        contextPlace: "View location",
        contextStar: "Star event",
        contextUnstar: "Remove star",
        starredAdd: "Starred",
        starredRemove: "Star removed",
        starFilterOn: "Starred only: on",
        starFilterOff: "Starred only: off",
        starFilterEmpty: "No starred events yet — hold a card and tap Star",
        sortNewest: "Sort: newest first",
        sortOldest: "Sort: oldest first",
        triggerHlOn: "Trigger border: on",
        triggerHlOff: "Trigger border: off",
        /* The phone ⋮ panel pairs these into half-width cells, so the English form has to stay
           under ~19 characters or the value — the only part that changes — gets ellipsised. */
        tapModeResume: "Tap plays: resume",
        tapModeStart: "Tap plays: restart",
        tapModeEvent: "Tap plays: at event",
        /* The two cycle-buttons used to walk these one step per tap; the chips say all of them
           at once, so each word has to stand alone without the "Tap plays:" prefix. */
        choiceTap: "Tap card",
        choiceTheme: "Theme",
        tapOptResume: "Resume",
        tapOptStart: "Restart",
        tapOptEvent: "At event",
        themeOptAuto: "System",
        themeOptLight: "Light",
        themeOptDark: "Dark",
        tapEventNone: "This clip has no event moment",
        jumpedTo: "Jumped to",
        prevEventNone: "This is the oldest event",
        nextEventNone: "This is the newest event",
        layoutGrid6: "6-grid",
        layoutGrid4: "4-grid",
        layoutLegacy: "Picture-in-picture",
        // The three view-switcher buttons carry these keys in the markup; they are separate from
        // the layout names above because the buttons want the short form.
        grid6: "6-Grid",
        grid4: "4-Grid",
        legacy: "PiP",
        refreshNoFolder: "Choose a folder first",
        refreshDone: "Found {n} events",
        pullToRefresh: "Pull to rescan",
        releaseToRefresh: "Release to rescan",
        snapshot: "Snapshot",
        snapshotSaving: "Saving frame…",
        snapshotSaved: "Frame saved to",
        snapshotFailed: "Snapshot failed",
        snapshotNoVideo: "No picture to save",
        autoNextOn: "Auto-play: on",
        autoNextOff: "Auto-play: off",
        autoNextDone: "Last event reached",
        autoNextNext: "Next:",
        diagnostics: "Copy diagnostics",
        diagCopied: "Diagnostics copied",
        diagFailed: "Copy failed",
        resumedAt: "Resumed at",
        recentFolders: "Recent folders",
        jsErrorTitle: "Page error",
        copyDetails: "Copy details",
        invalidFolder: "This does not appear to be a valid TeslaCam directory. Please ensure you select the 'TeslaCam' directory which contains subfolders like RecentClips, SavedClips, etc.",
        clipVideo: "Clip Video",
        confirmClip: "Confirm Clip Range",
        exportClip: "Export Video Clip",
        clipDuration: "Duration:",
        clipStartTime: "Start Time:",
        clipEndTime: "End Time:",
        selectCameras: "Select Cameras:",
        addTimestamp: "Add Timestamp Watermark",
        addMetadata: "Add Driving Data Overlay",
        mergeVideos: "Merge as Grid Video",
        startExport: "Start Export",
        cancel: "Cancel",
        preparing: "Preparing...",
        processing: "Processing...",
        exporting: "Exporting...",
        complete: "Complete!",
        selectClipRange: "Select clip range on progress bar first",
        selectAtLeastOneCamera: "Please select at least one camera",
        exportFailed: "Export failed: ",
        peViews: "Views",
        peSize: "Resolution",
        peRange: "Range",
        peFromNow: "From playhead",
        peMarkIn: "In",
        peMarkOut: "Out",
        peMarks: "Marks",
        peMarkSave: "Save mark",
        peMarkNameHint: "Name",
        peMarkSaved: "Mark saved",
        peMarkExport: "Export",
        peMarkDelete: "Delete mark",
        peMarkOutOfRange: "This mark falls outside the clip",
        routeMapTitle: "Route for this clip",
        routeNoPoints: "No GPS points in this clip",
        routeOnePoint: "One fix only — this is what the car writes here",
        routeApNone: "Manual",
        routeApTacc: "TACC",
        routeApAutosteer: "Autosteer",
        routeApSelfDriving: "Self-driving",
        peGridInfo: "{n} views · {w}x{h} ({cw}x{ch} each) · {d}{c}",
        peSizeCapped: " · capped by this device",
        peSourceSize: "Source",
        peExportStarted: "Exporting…",
        peExportSaved: "Saved to {path}",
        peExportCancelled: "Cancelled, the written part is kept",
        peExportNoBridge: "This build has no native export engine",
        peExportBadRange: "Start must be before end",
        peExportMissingFile: "No file for {camera} in this range",
        peLayout: "Layout",
        peLayoutReset: "Reset grid",
        peLayoutPreview: "Preview frame",
        peLayoutHint: "Drop a view onto another to swap their places; drag the corner to resize",
        peLayoutOverlap: "{n} overlapping — resizing stacks views, dragging swaps them",
        pePreviewBusy: "Fetching frames…",
        pePreviewCaption: "Composite preview · from {t} · file {w}×{h}",
        peOverlay: "Overlay",
        peMosaic: "Privacy mosaic",
        peMosaicHint: "Drag on the picture to box a plate or a face · up to 4 per view",
        peMosaicClear: "Clear view",
        peMosaicDelete: "Delete box",
        peMosaicFull: "A view carries at most 4 boxes",
        peMosaicCount: "{n} mosaic boxes",
        peBurnStamp: "Timestamp",
        peBurnHud: "Speed · AP",
        peBurnNoClock: "This clip has no start time to burn",
        scanningFiles: "Scanning files…",
        metadata: "Drive Data",
        driveStats: "Drive Stats",
        loadingMetadata: "Loading...",
        noMetadata: "No metadata found",
        speed: "Speed",
        gear: "Gear",
        steering: "Steering",
        accelerator: "Accelerator",
        brake: "Brake",
        brakeApplied: "Applied",
        brakeNotApplied: "Not applied",
        blinker: "Blinker",

        autopilot: "Autopilot",
        gps: "GPS",
        heading: "Heading",
        acceleration: "Acceleration",
        gearPark: "Park",
        gearDrive: "Drive",
        gearReverse: "Reverse",
        gearNeutral: "Neutral",
        blinkerLeft: "Left",
        blinkerRight: "Right",
        blinkerBoth: "Both",
        blinkerOff: "Off",
        autopilotNone: "None",
        autopilotSelfDriving: "FSD",
        autopilotAutosteer: "Autosteer",
        autopilotTACC: "TACC",
        moreOptions: "More Options",
        metadataDetail: "Details",
        vehicleStatus: "Vehicle Status",
        drivingAssist: "Driving Assist",
        locationInfo: "Location Info",
        motionData: "Motion Data",
        latitude: "Latitude",
        longitude: "Longitude",
        accelX: "Accel X",
        accelY: "Accel Y",
        accelZ: "Accel Z",
        exportMetadata: "Export CSV",
        exportMetadataSuccess: "Metadata exported successfully",
        exportMetadataNoData: "No metadata available to export",
        dirBrowserTitle: "Choose TeslaCam Folder",
        dirBrowserPath: "Path",
        dirBrowserGo: "Open",
        dirBrowserUp: "Up",
        dirBrowserSelect: "Choose This Folder",
        dirBrowserEmpty: "No subfolders here",
        dirBrowserPickDeeper: "Open the TeslaCam folder itself (the one that contains RecentClips / SavedClips / SentryClips)",
        dirBrowserAppBtn: "App Storage",
        dirGoneTitle: "That folder is gone",
        dirGoneBody: "{path} is not on this device any more — the drive was ejected, or the folder was deleted or renamed.",
        dirGoneSteps: "Pick the volume again in the row above, or re-insert the drive and it shows up by itself within a few seconds.",
        dirVolumeRow: "Storage",
        volInternal: "Phone storage",
        volUsb: "USB drive",
        volSd: "SD card",
        volExternal: "External storage",
        volApp: "App folder",
        volNoAccess: "cannot be read",
        volEmptyDir: "empty",
        volClips: "contains {folders}",
        dirBrowserMore: "Show more — {shown} of {total} folders",
        dirBrowserAllShown: "All {n} folders shown",
        scanTruncated: "So many files that the walk stopped at {n} to keep the app answering, so this list may be incomplete. Point the browser one level lower — a single day, or SavedClips / SentryClips — to see the rest.",
        volFree: "free",
        volReadOnly: "read-only",
        volReadOnlyWarn: "is mounted read-only by Android, so deleting from it or exporting to it will fail. Pull the stick and plug it back in, or reformat it to exFAT.",
        volFsUnsupported: "{fs} is not a filesystem Android can read, so {label} has to be reformatted to exFAT (or FAT32) before this app can open it.",
        volFsFat32: "This stick is FAT32, so no single file may pass 4 GB — a long export will fail. Reformat it to exFAT, or export to the phone and copy it afterwards.",
        usbOneLevel: "Nothing here. Open TeslaCam, or SavedClips / SentryClips directly — the root of the drive only holds that folder.",
        deleteNoAnswer: "the delete did not answer in time",
        usbNotMounted: "A USB device is attached, but Android has not mounted a filesystem from it. Sticks have to be exFAT or FAT32 for the system to read them, and several brands (OPPO, vivo, Xiaomi, Honor) keep OTG power off until you switch it on in Settings.",
        usbGuideTitle: "Three things to rule out before blaming the stick",
        usbGuideStep1: "Use an OTG adapter with a charging port. A dashcam stick draws more than most phones supply on OTG alone, and on an under-powered link the filesystem simply never mounts.",
        usbGuideStep2: "In the {row} row above, tap the USB volume — it is usually named 1234-5678, UsbDriveA or OTG. If it is not in the list, unplug the stick and plug it back in once.",
        usbGuideStep3: "Open TeslaCam, or SavedClips / SentryClips directly, then press {apply}.",
        usbGuideOem: "OPPO / OnePlus: 设置 → 其他设置 → OTG 连接 (switches itself off after about ten idle minutes). vivo / iQOO: 设置 → 更多设置 → OTG 连接. Xiaomi / Honor / Huawei: usually plug-and-play — search 「OTG」 in Settings when the drive is missing.",
        usbGuideEject: "Before pulling the stick, hold the recording icon on the car screen for 3 seconds to stop writing, and wait for the drive light to stop blinking. A stick pulled mid-write loses the tail of the last clip.",
        usbGuideDismiss: "Don't show again",
        aboutUsbGuide: "USB stick guide",
        aboutUsbGuideHint: "For when the stick is not read",
        usbFound: "Detected {label}: {path}",
        usbFoundClips: "Detected {label} with {folders} — press 文件夹 below and choose it to play straight from the stick.",
        about: "About",
        aboutTitle: "About Tessera",
        aboutTagline: "Six-camera dashcam viewer for Tesla",
        aboutDevice: "Device",
        aboutGithub: "Upstream project on GitHub",
        aboutFeedback: "Bug reports / feedback: WeChat singcong",
        aboutCopyContact: "Copy WeChat ID",
        aboutCopied: "Copied: singcong",
        aboutDonate: "If it is useful, buy me a coffee",
        aboutDonateNote: "Tap the code to enlarge it, then scan it with WeChat.",
        aboutQrAlt: "WeChat payment QR code, tap to enlarge",
        aboutLicenseNote: "Free, open-source software. Based on the desktop TDashcamStudio (AGPL-3.0).",
        permTitle: "All Files Access permission is required",
        permBody: "Android blocks folder access until this app is allowed to manage all files. Grant it, then press Back and reopen the folder chooser.",
        permSteps: "Settings → Apps → Special app access → All files access → Tessera",
        permAppDir: "Or copy TeslaCam into this app's own folder, which needs no permission:",
        permBanner: "All Files Access is off, so the copied clips stay hidden.",
        permBannerBtn: "Open settings",
        allDates: "All dates",
        searchEvents: "Search date, type or city",
        noFilesPerm: "This app cannot read shared storage yet. Grant All Files Access, press Back, then choose the folder again.",
        noFilesEmpty: "No videos in this folder. Choose the TeslaCam folder itself (the one containing RecentClips / SavedClips / SentryClips).",
        noFilesEmptyDir: "the folder is empty",
        noFilesEntries: "{n} entries at the top level of this folder",
        permMissing: "All Files Access is OFF",
        permGranted: "All Files Access is ON",
        scannedPath: "scanned",
        noMediaAnywhere: "no .mp4 anywhere on this device, so the USB copy has not landed yet",
        foundMediaAt: "videos are actually at",
        openSidebarLabel: "Videos",
        savedToDownloads: "Saved to Download"
    },
    zh: {
        pageTitle: "特写",
        headerTitle: "特写",
        toggleSidebar: "切换侧边栏",
        toggleTheme: "切换主题",
        toggleLanguage: "Switch to English",
        drivingRecords: "行车记录",
        date: "日期",
        eventType: "事件类型",
        allTypes: "🎥 所有类型",
        recentClips: "🕒 最近片段",
        savedClips: "💾 保存片段",
        sentryClips: "🤖 哨兵模式",
        jumpToEvent: "跳到事件时刻",
        contextDelete: "删除事件",
        deleteConfirmTitle: "删除这个事件？",
        deleteConfirmCount: "{dir} 里的 {n} 个文件",
        deleteConfirmMore: "……还有 {n} 个",
        deleteConfirmWarn: "直接从存储盘删除，没有回收站，删掉就恢复不了。",
        deleteConfirmCancel: "取消",
        deleteConfirmOk: "删除",
        deleteDone: "已删除 {n} 个文件",
        deleteFailed: "删除失败：",
        deleteSharedDir: "循环录像共用一个文件夹，这里没有可单独删除的事件",
        deleteNoBridge: "只有安卓版本支持删除事件",
        noRecordsFound: "没有找到匹配的记录",
        clearFiltersBtn: "清除筛选",
        filtersCleared: "已清除筛选",
        selectFolder: "📁 选择文件夹",
        selectFiles: "📁 选择文件",
        helpStep1: "插入特斯拉U盘到你的PC",
        helpStep2: "选择或拖拽U盘中的TeslaCam目录",
        helpStep1IOS: "将TeslaCam视频复制到iPad/iPhone",
        helpStep2IOS: "选择视频文件（如 2024-01-15_12-30-00-front.mp4）",
        helpStep1Android: "把U盘里的 TeslaCam 整个文件夹复制到手机存储，例如 /storage/emulated/0/Download/TeslaCam",
        helpStep2Android: "点「选择文件夹」，进入该目录后点「选择此文件夹」",
        helpNote: "注意：本工具不会上传你的数据，一切操作都是本地行为。（由于高德对WGS-84支持不够，所以高德地图有误差）",
        desktopTip: "💡 提示：由于浏览器有诸多限制，建议使用桌面版获得更好的性能体验。",
        desktopDownload: "下载桌面版",
        heroTitle: "还没有选录像",
        heroHint: "挑一个 TeslaCam 目录，列表里选一段",
        heroFind: "找片",
        menuClip: "这一段录像",
        menuPlayback: "播放与列表",
        menuOther: "其他",
        statsFold: "收起数据卡",
        statsExpand: "展开数据卡",
        mapModalTitle: "在地图上查看",
        gaodeMap: "高德地图",
        googleMap: "谷歌地图",
        revealFile: "显示路径",
        downloadFile: "下载视频",
        filePathAlertTitle: "当前视频文件路径",
        copiedToClipboard: "已复制到剪贴板",
        copyFailed: "复制失败",
        scanReadFailed: "读取文件夹失败：{msg}",
        volumeGone: "存储设备已弹出，或该文件夹已不存在 —— 列表已清空。重新插好后在「文件夹」里再选一次。",
        pathGoneKept: "{path} 已经不在这台设备上了（盘已弹出或文件夹被删除）。下面这份列表还是 {keep} 的内容，要换盘请在「文件夹」里重选。",
        stalePathDropped: "已从列表里去掉失效路径：{path}",
        previousFolder: "上一个文件夹",
        noFilePath: "无法获取当前摄像头的文件路径",
        selectDate: "选择日期",
        minutes: "分钟",
        preview: "预览图",
        noSignal: "无信号",
        grid6: "6宫格",
        grid4: "4宫格",
        legacy: "画中画",
        front: "前",
        back: "后",
        left: "左",
        right: "右",
        leftPillar: "左柱",
        rightPillar: "右柱",
        play: "播放",
        pause: "暂停",
        toggleDay: "切换到日间模式",
        toggleNight: "切换到夜间模式",
        themeAuto: "主题：跟随系统",
        themeLight: "主题：浅色",
        themeDark: "主题：深色",
        cameraZoomOut: "返回宫格",
        feedDecodeError: "解码失败",
        feedDecodeHint: "这路解码器已用尽：改用四宫格或单路播放",
        feedDecodeDowngraded: "六路同时解码不够用了：已切到四宫格",
        tabList: "列表",
        tabFolder: "文件夹",
        tabLayout: "视图",
        tabRefresh: "刷新",
        tabMore: "更多",
        enterFullscreen: "全屏",
        exitFullscreen: "退出全屏",
        contextPlay: "播放事件",
        contextSingle: "单路全屏",
        contextPath: "显示路径",
        noFilePath: "无法确定文件路径",
        contextMeta: "元数据",
        contextPlace: "查看位置",
        contextStar: "收藏",
        contextUnstar: "取消收藏",
        starredAdd: "已收藏",
        starredRemove: "已取消收藏",
        starFilterOn: "只看收藏：开",
        starFilterOff: "只看收藏：关",
        starFilterEmpty: "还没有收藏的事件 —— 长按卡片选「收藏」",
        sortNewest: "排序：新→旧",
        sortOldest: "排序：旧→新",
        triggerHlOn: "触发标注：开",
        triggerHlOff: "触发标注：关",
        tapModeResume: "点卡片：接着上次",
        tapModeStart: "点卡片：从头播",
        tapModeEvent: "点卡片：跳到事件",
        choiceTap: "点卡片",
        choiceTheme: "主题",
        tapOptResume: "接着上次",
        tapOptStart: "从头播",
        tapOptEvent: "跳到事件",
        themeOptAuto: "跟随系统",
        themeOptLight: "浅色",
        themeOptDark: "深色",
        tapEventNone: "这段录像里没有事件时刻",
        jumpedTo: "已跳到",
        prevEventNone: "已经是最旧的一个",
        nextEventNone: "已经是最新的一个",
        layoutGrid6: "6 宫格",
        layoutGrid4: "4 宫格",
        layoutLegacy: "大小窗",
        refreshNoFolder: "还没有选择目录",
        refreshDone: "找到 {n} 个事件",
        pullToRefresh: "下拉重新扫描",
        releaseToRefresh: "松开重新扫描",
        snapshot: "抓帧",
        snapshotSaving: "正在保存画面…",
        snapshotSaved: "已保存当前画面到",
        snapshotFailed: "抓帧失败",
        snapshotNoVideo: "当前没有可保存的画面",
        autoNextOn: "连续播放：开",
        autoNextOff: "连续播放：关",
        autoNextDone: "已经是最后一个事件",
        autoNextNext: "下一个：",
        diagnostics: "复制诊断",
        diagCopied: "诊断信息已复制",
        diagFailed: "复制失败",
        resumedAt: "已续播",
        recentFolders: "最近目录",
        jsErrorTitle: "页面出错",
        copyDetails: "复制详情",
        invalidFolder: "这似乎不是一个有效的TeslaCam目录。请确保您选择了包含RecentClips, SavedClips等子文件夹的TeslaCam目录。",
        clipVideo: "剪辑视频",
        confirmClip: "确认剪辑范围",
        exportClip: "导出视频片段",
        clipDuration: "选中时长:",
        clipStartTime: "起始时间:",
        clipEndTime: "结束时间:",
        selectCameras: "选择摄像头:",
        addTimestamp: "添加时间水印",
        addMetadata: "添加行驶数据",
        mergeVideos: "合成四宫格视频",
        startExport: "开始导出",
        cancel: "取消",
        preparing: "准备中...",
        processing: "处理中...",
        exporting: "导出中...",
        complete: "完成!",
        selectClipRange: "请先在进度条上选择剪辑范围",
        selectAtLeastOneCamera: "请至少选择一个摄像头",
        exportFailed: "导出失败: ",
        peViews: "画面",
        peSize: "分辨率",
        peRange: "范围",
        peFromNow: "从当前进度",
        peMarkIn: "设入点",
        peMarkOut: "设出点",
        peMarks: "片段",
        peMarkSave: "存为片段",
        peMarkNameHint: "名称",
        peMarkSaved: "已保存片段",
        peMarkExport: "导出",
        peMarkDelete: "删除片段",
        peMarkOutOfRange: "这个片段落在本段录像的时间之外",
        routeMapTitle: "这段录像的轨迹",
        routeNoPoints: "这段录像里没有 GPS 点",
        routeOnePoint: "只有一个定位点——车机在这里通常只写一个",
        routeApNone: "手动",
        routeApTacc: "自适应巡航",
        routeApAutosteer: "自动转向",
        routeApSelfDriving: "自动驾驶",
        peGridInfo: "{n} 路 · {w}x{h}（每路 {cw}x{ch}） · {d}{c}",
        peSizeCapped: " · 已按本机编码器上限缩小",
        peSourceSize: "源",
        peExportStarted: "导出中…",
        peExportSaved: "已保存到 {path}",
        peExportCancelled: "已取消，已写入的部分保留在文件里",
        peExportNoBridge: "这个版本没有原生导出引擎",
        peExportBadRange: "起点必须早于终点",
        peExportMissingFile: "这段时间里没有 {camera} 的文件",
        peLayout: "摆放",
        peLayoutReset: "恢复网格",
        peLayoutPreview: "预览帧",
        peLayoutHint: "把画面拖到另一路上就互换位置，拖右下角改大小",
        peLayoutOverlap: "{n} 处重叠：缩放宽高会盖住别的路，拖动则自动调换",
        pePreviewBusy: "正在取帧…",
        pePreviewCaption: "合成预览 · 从 {t} 起 · 文件 {w}×{h}",
        peOverlay: "叠加",
        peMosaic: "隐私打码",
        peMosaicHint: "在画面上拖动框住车牌或人脸 · 每路最多 4 块",
        peMosaicDraw: "画一块",
        peMosaicClear: "清空本路",
        peMosaicDelete: "删除这块",
        peMosaicFull: "这一路最多只能放 4 块",
        peMosaicCount: "打码 {n} 块",
        peBurn: "烧录文字",
        peBurnStamp: "时间戳",
        peBurnHud: "车速·辅助驾驶",
        peBurnNoClock: "这段没有可烧录的开始时间",
        scanningFiles: "正在扫描文件…",
        metadata: "行车数据",
        driveStats: "行车数据",
        loadingMetadata: "加载中...",
        noMetadata: "无元数据",
        speed: "速度",
        gear: "档位",
        steering: "方向盘角度",
        accelerator: "油门踏板",
        brake: "刹车",
        brakeApplied: "踩下",
        brakeNotApplied: "未踩",
        blinker: "转向灯",
        autopilot: "自动驾驶",
        gps: "GPS 坐标",
        heading: "航向",
        acceleration: "加速度",
        gearPark: "驻车 (P)",
        gearDrive: "前进 (D)",
        gearReverse: "倒车 (R)",
        gearNeutral: "空档 (N)",
        blinkerLeft: "左",
        blinkerRight: "右",
        blinkerBoth: "双闪",
        blinkerOff: "关",
        autopilotNone: "无",
        autopilotSelfDriving: "完全自动驾驶 (FSD)",
        autopilotAutosteer: "自动辅助转向",
        autopilotTACC: "自适应巡航",
        moreOptions: "更多选项",
        metadataDetail: "详细数据",
        vehicleStatus: "车辆状态",
        drivingAssist: "驾驶辅助",
        locationInfo: "位置信息",
        motionData: "运动数据",
        latitude: "纬度",
        longitude: "经度",
        accelX: "加速度 X",
        accelY: "加速度 Y",
        accelZ: "加速度 Z",
        exportMetadata: "导出CSV",
        exportMetadataSuccess: "元数据导出成功",
        exportMetadataNoData: "没有可导出的元数据",
        dirBrowserTitle: "选择 TeslaCam 目录",
        dirBrowserPath: "路径",
        dirBrowserGo: "进入",
        dirBrowserUp: "上一级",
        dirBrowserSelect: "选择此文件夹",
        dirBrowserEmpty: "这里没有子文件夹",
        dirBrowserPickDeeper: "请进入 TeslaCam 目录本身（包含 RecentClips / SavedClips / SentryClips 的那一层）",
        dirBrowserAppBtn: "APP 存档位置",
        dirGoneTitle: "这个文件夹已经不在了",
        dirGoneBody: "{path} 已经不在这台设备上——盘被弹出了，或者文件夹被删除/改名了。",
        dirGoneSteps: "在上面的存储条里重选一次；重新插上盘后它几秒内会自己出现。",
        dirVolumeRow: "存储位置",
        volInternal: "本机存储",
        volUsb: "U盘",
        volSd: "SD 卡",
        volExternal: "外接存储",
        volApp: "应用目录",
        volNoAccess: "读不到",
        volEmptyDir: "空",
        volClips: "含 {folders}",
        dirBrowserMore: "显示更多（已列 {shown} / 共 {total} 个文件夹）",
        dirBrowserAllShown: "全部 {n} 个文件夹已列出",
        scanTruncated: "文件夹太多，扫描到 {n} 个文件就停了（继续扫会长时间没有响应）。列表可能不完整，可以只选 SavedClips / SentryClips 这一级。",
        volFree: "可用",
        volReadOnly: "只读",
        volReadOnlyWarn: "被系统挂载成了只读，从它上面删除或直接导出到它会失败。拔下重插一次，或格式化成 exFAT。",
        volFsUnsupported: "{fs} 不是安卓能读的文件系统，{label} 要先格式化成 exFAT（或 FAT32）才能在这里打开。",
        volFsFat32: "这块盘是 FAT32，单个文件不能超过 4GB，导出很长的片段会失败；建议格式化成 exFAT，或先导出到手机再拷贝。",
        usbOneLevel: "这里是空的。请进 TeslaCam，或者直接进 SavedClips / SentryClips——盘的根目录只有那一个文件夹。",
        deleteNoAnswer: "删除操作没有在预期时间内应答",
        usbNotMounted: "检测到 USB 设备，但系统没有把它挂载成可读的存储。U盘需要是 exFAT 或 FAT32 才可能被安卓读取（NTFS 部分机型不支持）；OPPO / vivo / 小米 / 荣耀 还要在设置里手动打开「OTG 连接」开关。",
        usbGuideTitle: "U 盘读不到？先确认这三步",
        usbGuideStep1: "用带充电口的 OTG 转接头接 U 盘。记录仪 U 盘的用电常常超过手机 OTG 的默认供电，供电不够时系统根本不会挂载它。",
        usbGuideStep2: "在上方「{row}」里点那枚 USB 卷标（一般叫 1234-5678、UsbDriveA 或 OTG）。列表里没有就拔下重插一次。",
        usbGuideStep3: "进入 TeslaCam，或者直接进 SavedClips / SentryClips，然后按「{apply}」。",
        usbGuideOem: "OPPO / 一加：设置 → 其他设置 → OTG 连接（约 10 分钟无设备会自动关掉）；vivo / iQOO：设置 → 更多设置 → OTG 连接；小米 / 荣耀 / 华为：一般即插即用，找不到就在设置里搜「OTG」。",
        usbGuideEject: "拔盘之前，先在车机上长按录制图标 3 秒停止写入，等 U 盘指示灯不再闪烁。正在写的时候拔掉，最后一段会缺尾巴。",
        usbGuideDismiss: "不再显示",
        aboutUsbGuide: "U 盘读取指南",
        aboutUsbGuideHint: "插盘读不到时看这里",
        usbFound: "检测到 {label}：{path}",
        usbFoundClips: "检测到 {label}，里面有 {folders} —— 按下方「文件夹」选中它，就能直接从 U盘播放。",
        about: "关于",
        aboutTitle: "关于特写",
        aboutTagline: "特斯拉行车记录 · 六路同播",
        aboutDevice: "本机",
        aboutGithub: "上游项目（GitHub）",
        aboutFeedback: "反馈 bug / 建议：微信 singcong",
        aboutCopyContact: "复制微信号",
        aboutCopied: "已复制：singcong",
        aboutDonate: "觉得好用的话，请我一杯咖啡",
        aboutDonateNote: "点一下可放大，用微信「扫一扫」对着本屏即可。",
        aboutQrAlt: "微信收款码，点击放大",
        aboutLicenseNote: "免费开源软件，基于桌面版 TDashcamStudio（AGPL-3.0）移植。",
        permTitle: "需要「所有文件访问」权限",
        permBody: "安卓会拦截未授权应用的目录访问。请为本应用开启「所有文件管理」权限，然后返回重新选择目录。",
        permSteps: "设置 → 应用 → 特殊应用权限 → 所有文件访问 → 特写（小米：设置 → 应用设置 → 应用管理 → 特写 → 权限管理）",
        permAppDir: "也可以把 TeslaCam 放进本应用自己的目录，这个目录不需要任何权限：",
        permBanner: "缺少「所有文件访问」权限，拷进来的录像现在是看不见的。",
        permBannerBtn: "去设置",
        allDates: "全部日期",
        searchEvents: "搜索日期 / 类型 / 城市",
        noFilesPerm: "本应用当前读不到共享存储。请先开启「所有文件访问」权限，返回后重新选择目录。",
        noFilesEmpty: "这个目录下没有视频文件。请选择 TeslaCam 目录本身（包含 RecentClips / SavedClips / SentryClips 的那一层）。",
        noFilesEmptyDir: "这个文件夹是空的",
        noFilesEntries: "这个文件夹顶层有 {n} 个条目",
        permMissing: "「所有文件访问」没有开启",
        permGranted: "「所有文件访问」已开启",
        scannedPath: "已扫描",
        noMediaAnywhere: "整部手机都没找到 mp4，说明 U 盘还没拷进来",
        foundMediaAt: "视频实际在这些位置",
        openSidebarLabel: "视频列表",
        savedToDownloads: "已保存到 Download 目录"
    }
};

// --- Tauri Helper Functions ---
function getTauri() {
    return window.__TAURI__;
}

// --- Android (Tauri mobile) Runtime Helpers ---
function isAndroidRuntime() {
    return !!window.__TAURI__ && /Android/i.test(navigator.userAgent);
}

// A phone turned sideways is ~915 CSS px wide, so it misses a plain `max-width: 768px` test and
// ends up with desktop behaviour: no drawer scrim, no swipe-to-close, an expanded sidebar.
// The third clause is the tablet case: an 11" tablet is 800..1440 CSS px wide in portrait and
// 1100 tall sideways, so every width test either misses it or drags narrow desktop windows in with
// it. `hover: none / pointer: coarse` is the one feature that says "this screen is touched" without
// looking at its size, and it leaves a desktop browser — even a narrow one — exactly where it was.
// This string must stay identical to the phone media queries in styles.css, otherwise the JS
// and the CSS disagree about which layout is showing.
const PHONE_LAYOUT_QUERY =
    '(max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px), '
    + '(hover: none) and (pointer: coarse)';

// Tablet-tier rules key off "touch, and wider than a phone" — the same test in CSS, so a device
// cannot be a phone to one and a tablet to the other.
const TABLET_LAYOUT_QUERY = '(hover: none) and (pointer: coarse) and (min-width: 769px)';

function isPhoneLayout() {
    return window.matchMedia(PHONE_LAYOUT_QUERY).matches;
}

function isTabletLayout() {
    return window.matchMedia(TABLET_LAYOUT_QUERY).matches;
}

// A device can report `pointer: fine` while still being an Android tablet (some OEM WebViews, mouse
// or trackpad attached). The layout then falls back to desktop for everything CSS-only, and the two
// rules that must never miss — the bottom bar and the drawer — are what this class carries.
function markTouchUi() {
    if (!isAndroidRuntime()) return;
    document.documentElement.classList.add('touch-ui');
}
markTouchUi();

/**
 * One icon language also has to mean one optical box. Every menu glyph is drawn on a 24-unit grid,
 * but the *ink* is not centred on it and does not fill it the same way — a folder that spans y7..19
 * sits low next to a car that spans y4.5..19, and a star whose ink is 17 wide reads larger than a
 * download arrow whose ink is 14. The boxes line up; the pictures inside them don't, which is what
 * "the icons aren't aligned" describes.
 *
 * Re-deriving the viewBox from the path's own bounding box puts every glyph's ink in the same square
 * at the same centre. The stroke is re-derived too, because it is measured in user units: shrinking
 * the box would otherwise make the thin glyphs render bolder than the wide ones.
 */
const MENU_ICON_GRID = 24;
const MENU_ICON_INK = 20;
function normaliseMenuIcon(svg) {
    const path = svg?.querySelector('path');
    if (!path || svg.dataset.inkNormalised) return;
    let box;
    try {
        box = path.getBBox();
    } catch (e) {
        return;
    }
    // getBBox is zeroed inside a `display:none` subtree, and a zero-height box would be a divide by
    // zero — the caller runs the pass again when the surface is actually shown.
    if (!box || box.width < 1 || box.height < 1) return;
    svg.dataset.inkNormalised = '1';
    const side = Math.max(box.width, box.height) * (MENU_ICON_GRID / MENU_ICON_INK);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    svg.setAttribute('viewBox',
        `${(cx - side / 2).toFixed(2)} ${(cy - side / 2).toFixed(2)} ${side.toFixed(2)} ${side.toFixed(2)}`);
    path.style.strokeWidth = (1.7 * side / MENU_ICON_GRID).toFixed(2);
}

function normaliseMenuIcons(root) {
    (root || document).querySelectorAll('.header-actions-group .btn-icon svg, .card-context-menu .context-icon svg')
        .forEach(normaliseMenuIcon);
}

// Desktop keeps the last TeslaCam folder in $APPCONFIG/config.json via tauri-plugin-fs;
// on Android that path is outside the plugin's fs scope, so the folder is remembered in
// localStorage (same place theme/language already live).
const ANDROID_MEDIA_DIR_KEY = 'tdashcam.mediaDir';

// The one place the support contact is written; it is shown on the About panel and copied from
// there, so a typo here would be a typo every user ends up sending.
const ABOUT_CONTACT = 'singcong';
const ABOUT_REPO_URL = 'https://github.com/DeaglePC/TDashcamStudio';

let mediaServerInfo = null;

// Android streams media from a loopback HTTP server instead of the asset protocol.
// Must be awaited once before any file URL is built.
async function ensureMediaServer() {
    if (!isAndroidRuntime()) return null;
    if (mediaServerInfo) return mediaServerInfo;

    const tauri = getTauri();
    const invoke = tauri.core?.invoke || tauri.invoke;
    if (!invoke) return null;

    try {
        mediaServerInfo = await invoke('ensure_media_server');
        console.log('[mediaServer] streaming from', mediaServerInfo.base_url);
    } catch (e) {
        console.error('[mediaServer] failed to start local media server:', e);
        mediaServerInfo = null;
    }
    return mediaServerInfo;
}

function toBase64Url(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getStreamUrl(path) {
    if (!mediaServerInfo) return null;
    return `${mediaServerInfo.base_url}/media/${mediaServerInfo.token}/${toBase64Url(path)}`;
}

function joinPath(dir, name) {
    return dir.endsWith('/') ? dir + name : `${dir}/${name}`;
}

const ANDROID_DOWNLOAD_DIR = '/storage/emulated/0/Download';

// A file that lands in the shared `Download/` folder should say which app made it. Desktop keeps
// its own `TDashcam_` (its history and its sidecar output names are unchanged); only the phone,
// which ships as 特写 / Tessera, is renamed here.
const ANDROID_FILE_PREFIX = isAndroidRuntime() ? 'Tessera' : 'TDashcam';

// The drawer remembers one folder today, which is fine for one car and useless for two.
const ANDROID_RECENT_DIRS_KEY = 'tdashcam.recentDirs';
// Where the user stopped inside each event, so a second visit does not start at 00:00.
const ANDROID_PLAYBACK_POS_KEY = 'tdashcam.playbackPos';
const ANDROID_AUTO_NEXT_KEY = 'tdashcam.autoNext';
// Events the user flagged. Stored as a JSON array of eventIds; a set in memory.
const ANDROID_STARRED_KEY = 'tdashcam.starred';
// 'newest' | 'oldest'. List order is a preference, not a property of the recordings.
const ANDROID_SORT_ORDER_KEY = 'tdashcam.sortOrder';
// The amber frame that names which feeds a trigger was looking at. It is a hint some people want
// and some read as a claim, so it is theirs to turn off.
const ANDROID_TRIGGER_HIGHLIGHT_KEY = 'tdashcam.triggerHighlight';
// 'resume' | 'start' | 'event' — what tapping a card in the list should do with the playhead.
const ANDROID_TAP_BEHAVIOR_KEY = 'tdashcam.tapBehavior';
// 「地图上面查看轨迹这个功能先下线」. A track needs one GPS point per second, and real SavedClips
// folders carry none of that in the mp4s, so the sheet would be an empty box with a caption. The
// drawing code stays; flip this to bring the canvas back if a recording ever carries the points.
const ROUTE_TRACK_ENABLED = false;
// Export size presets the sheet offers. `2160` is deliberately absent — see peSizeKey().
const PE_SIZE_PRESETS = ['source', '1080', '720', '480'];
// Speed survives across events and app restarts; re-picking 2x every session is the worst part of any player.
const ANDROID_PLAYBACK_RATE_KEY = 'tdashcam.playbackRate';
// The USB guide is advice, not a notification: it shows itself once per install and can be put
// away for good, with the About panel left as the way back to it.
const ANDROID_USB_GUIDE_KEY = 'tdashcam.usbGuideDismissed';
// The size the 详细数据 plate is left in. Which black band a plate fits into is a property of the
// layout, and the layouts differ enough that the size is genuinely the user's, not the app's.
const STATS_PLATE_KEY = 'tdashcam.statsPlate';

/**
 * Write text to the system clipboard. `navigator.clipboard` needs a focused document and a
 * user gesture, both of which the WebView can drop when the call comes from a menu that has
 * already been torn down, so keep the legacy path.
 */
async function copyTextToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        // fall through
    }
    try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0';
        document.body.appendChild(area);
        area.select();
        area.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        area.remove();
        return ok;
    } catch (e) {
        console.warn('[copyTextToClipboard] failed:', e);
        return false;
    }
}

/**
 * A file written straight into Download is invisible to the gallery until MediaScanner looks
 * at it, and the user's next question would be "where did my picture go".
 */
function notifyMediaFile(path) {
    if (!isAndroidRuntime() || !window.TDashcamNative) return;
    try {
        window.TDashcamNative.scanMediaFile(String(path));
    } catch (e) {
        console.warn('[notifyMediaFile] failed:', e);
    }
}

/**
 * One short pulse for the moments a phone cannot show you: a card that just vanished, an export
 * that finished behind a closed lid, a long-press that took. Best-effort by design — WebViews
 * without a vibrator, and users who turned system haptics off, simply feel nothing.
 */
function haptic(pattern = 12) {
    if (!isAndroidRuntime()) return;
    try { navigator.vibrate?.(pattern); } catch (e) { /* no vibrator here */ }
}

/**
 * Paints one of the ⋮ panel's segmented rows: label, active segment, and the `aria-checked` that
 * a colour-only highlight does not carry. Both rows want this, and neither wants a second
 * copy of the loop that walks `[data-mode]`.
 */
function syncChoiceRow(row, mode, keyMap, titleKey, translations) {
    if (!row) return;
    const strings = translations || {};
    const title = strings[titleKey];
    const label = row.querySelector('.choice-label');
    if (label && title) label.textContent = title;
    row.querySelectorAll('.choice-segment').forEach(seg => {
        const on = seg.dataset.mode === mode;
        const text = strings[keyMap[seg.dataset.mode]];
        if (text) seg.textContent = text;
        seg.classList.toggle('on', on);
        seg.setAttribute('aria-checked', String(on));
    });
}

/**
 * A blocking `alert()` freezes the WebView's JS thread — playback, gestures and frame
 * rate all stop with it, which on a phone reads as a crash. Same sentence, no freeze. Desktop
 * keeps its dialogs because there they sit on top of a window the user is already looking at.
 */
function notify(message, kind = 'info') {
    const text = String(message === undefined || message === null ? '' : message);
    if (!isAndroidRuntime()) {
        window.alert(text);
        return;
    }
    if (window.viewer?.showToast) {
        window.viewer.showToast(text, kind === 'error' ? 'error' : 'info', kind === 'error' ? 6000 : 4500);
    } else {
        console.info('[notify]', text);
    }
}

/**
 * These progress bars are a width on an inner div, which a screen reader cannot see, so every
 * write of the width carries the number as well.
 */
function setBarPercent(el, percent) {
    if (!el) return;
    const clamped = Math.max(0, Math.min(100, percent));
    el.style.width = `${clamped}%`;
    el.setAttribute('aria-valuenow', String(Math.round(clamped)));
}

function installPhoneAlertShim() {
    if (!isAndroidRuntime()) return;
    window.alert = message => {
        const text = String(message === undefined || message === null ? '' : message);
        if (window.viewer && typeof window.viewer.showToast === 'function') {
            window.viewer.showToast(text, 'info', 4500);
        } else {
            console.info('[alert→toast]', text);
        }
    };
    console.log('[boot] phone alert shim installed');
}

function parentPath(path) {
    const trimmed = path.replace(/\/+$/, '');
    const index = trimmed.lastIndexOf('/');
    return index <= 0 ? '/' : trimmed.slice(0, index) || '/';
}

// The browser opens at the storage root; selecting it would recursively walk the whole
// phone, so refuse anything at or above it.
function isStorageRootPath(path) {
    const roots = ['/', '/storage', '/storage/emulated', '/storage/emulated/0', '/sdcard'];
    return roots.includes(path.replace(/\/+$/, '') || '/');
}

function nativeInvoke(command, args) {
    const tauri = getTauri();
    const invoke = tauri.core?.invoke || tauri.invoke;
    if (!invoke) return Promise.reject(new Error('Tauri invoke unavailable'));
    return invoke(command, args);
}

let storageStatus = null;

async function getStorageStatus(forceRefresh) {
    if (!isAndroidRuntime()) return null;
    if (storageStatus && !forceRefresh) return storageStatus;
    try {
        storageStatus = await nativeInvoke('storage_status');
    } catch (e) {
        console.warn('[getStorageStatus] probe failed:', e);
    }
    return storageStatus;
}

// Shared storage being unreadable at its own root means the All Files Access toggle was
// never granted; anything else is a plain "wrong folder" case.
function storageBlockedByPermission(status) {
    if (!status) return false;
    return !status.root_readable && !status.download_readable;
}

// MainActivity pushes {manage_external_storage, legacy_storage, sdk}. This is the only
// trustworthy permission signal: without the toggle Android returns an *empty* directory
// listing instead of EACCES, which looks exactly like a folder with no videos.
function readNativeStorageStatus() {
    const live = window.__tdashcamStorage;
    if (live && typeof live.manage_external_storage === 'boolean') return live;
    const pulled = pullNativeStatus();
    if (pulled) return pulled;
    try {
        const cached = JSON.parse(localStorage.getItem('__tdashcam_storage') || 'null');
        if (cached && typeof cached.manage_external_storage === 'boolean') return cached;
    } catch (e) {
        // Private-mode localStorage or a malformed value: treat as unknown.
    }
    return null;
}

// Every native push is posted while the WebView is still navigating, so on a cold start the window
// property can stay absent for seconds and the cache is all there is — but that cache was written by
// whichever version ran last, which is how an upgrade showed the *old* version number on the About
// page. Asking the shell is synchronous, so the answer is memoised; a real push always wins.
let nativeStatusPull;
function pullNativeStatus() {
    if (nativeStatusPull !== undefined) return nativeStatusPull;
    const bridge = window.TDashcamNative;
    nativeStatusPull = null;
    if (!bridge || typeof bridge.nativeStatus !== 'function') return null;
    try {
        const parsed = JSON.parse(bridge.nativeStatus());
        if (parsed && typeof parsed.manage_external_storage === 'boolean') nativeStatusPull = parsed;
    } catch (e) {
        // A bridge that throws is a bridge we cannot read from; fall back to the cache.
    }
    return nativeStatusPull;
}

async function getNativeStorageStatus(timeoutMs = 1500) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const status = readNativeStorageStatus();
        if (status || !isAndroidRuntime() || Date.now() > deadline) return status;
        await new Promise(resolve => setTimeout(resolve, 150));
    }
}

/* --- external storage (USB stick on an OTG cable, SD card) ------------------------- */

// Android mounts a dashcam stick wherever the vendor decided (`/storage/UsbDriveA`,
// `/storage/usbdisk1`, `/storage/1234-5678`), which is one level *above* the shared storage the
// browser used to open at. These names are never media, so they must not be offered as volumes.
const VOLUME_SKIP_NAMES = ['emulated', 'self', 'users', 'storage', 'tmp', 'private', 'linker', 'app'];
const CLIP_FOLDER_NAMES = ['RecentClips', 'SavedClips', 'SentryClips', 'TeslaCam'];

// Rows the folder browser paints in one pass. A screenful of 44px rows is roughly this many, and a
// drive holding ten thousand event folders should not build ten thousand buttons to show the first
// nine.
const DIR_PAGE_SIZE = 200;

// A trigger never arrives with a camera id: Tesla writes a free-text `reason` into `event.json`
// on some builds and appends it to the event folder name on others. These patterns turn the words
// into the views that point that way, tested in order so the specific reasons win over the general
// ones. It is a hint, not a filter — an unrecognised reason highlights nothing, and a reason that
// matches several views only marks the first few, because six amber borders say nothing at all.
const TRIGGER_REASON_VIEWS = [
    [/reverse|backing|backup|rear/, ['back'], { zh: '倒车', en: 'Reverse' }],
    [/side|door|pillar|handle/, ['left', 'right', 'left_pillar'], { zh: '侧面', en: 'Side' }],
    [/obstacle|collision|brak|emergency|forward|front|swerve|speed/, ['front'], { zh: '前方', en: 'Ahead' }],
    [/motion|sentry|person|approach|walk|hit|impact|vibration|tow|glass/, ['front', 'left', 'right'],
        { zh: '哨兵', en: 'Sentry' }],
    [/driver|dashcam|manual|honk/, ['front'], { zh: '手动', en: 'Manual' }],
];
const TRIGGER_VIEWS_MAX = 3;

// Mark names are typed, and they land in `innerHTML` next to the buttons that export them.
function escapeHtmlText(text) {
    return String(text ?? '').replace(/[&<>"]/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// The route line's colours are the steering-wheel icon's: blue for 「车在帮着开」, purple for
// 「车完全在开」, grey for the driver. Inventing a third palette would make the map disagree with
// the card next to it.
const ROUTE_STATE_COLORS = {
    NONE: '#8c8c8c',
    TACC: '#1890ff',
    AUTOSTEER: '#13c2c2',
    SELF_DRIVING: '#722ed1',
};

function volumeKind(volume) {
    if (volume.primary || volume.path === '/storage/emulated/0') return 'internal';
    const hay = `${volume.path} ${volume.label || ''}`.toLowerCase();
    if (/usb|otg|udisk/.test(hay)) return 'usb';
    if (/sdcard|external_sd|microsd|\bsd\b|card/.test(hay)) return 'sd';
    return volume.removable ? 'external' : 'other';
}

let storageVolumesPayload = null;

/**
 * Top-level entry counts per mount, answered a beat later by `__tdashcamVolumeCounts` after a
 * worker thread has listed the directory. They are deliberately not part of `storageVolumes()`:
 * that call runs on the WebView's UI thread and the row polls it every twelve seconds, and a
 * `listFiles()` on the root of a stick holding a few thousand event folders is long enough to blow
 * Android's five-second input timeout — the freeze that was reported as 「选中文件夹后卡死」.
 *
 * `-1` means "listed, and this app may not read it" and `-2` means "not counted yet". Only the
 * first of those may grey a volume out; treating the second as a failure is what made a healthy
 * 2 TB drive look dead for the second or two before the count came back.
 */
const volumeEntryCounts = new Map();

function volumeEntries(volume) {
    if (!volume) return -2;
    if (volumeEntryCounts.has(volume.path)) return volumeEntryCounts.get(volume.path);
    return Number.isFinite(volume.entries) ? volume.entries : -2;
}

window.__tdashcamVolumeCounts = (counts) => {
    let changed = false;
    for (const [path, raw] of Object.entries(counts || {})) {
        const count = Number(Number(raw));
        const value = Number.isFinite(count) ? count : -1;
        if (volumeEntryCounts.get(path) === value) continue;
        volumeEntryCounts.set(path, value);
        changed = true;
    }
    if (!changed || !storageVolumesPayload) return;
    storageVolumesPayload = null;
    // Rebuilding the chips wipes their scroll position and can swallow a tap in flight, so only do
    // it while the browser is on screen.
    const modal = document.getElementById('androidDirModal');
    if (modal && modal.classList.contains('show')) window.viewer?.renderStorageChips?.();
};

/**
 * Bytes the size of a thumb-sized label. Raw bytes on a 2 TB drive are thirteen digits, which fits
 * neither a chip nor a human.
 */
function formatBytes(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const shown = value / Math.pow(1024, index);
    return `${shown >= 100 || index === 0 ? Math.round(shown) : shown.toFixed(1)}${units[index]}`;
}

// `/proc/mounts` calls a FAT32 stick `vfat`, and that is the name the phone reports when the
// partition really is fine — so the display names have to be the ones on a reformat dialog.
const FS_LABELS = {
    vfat: 'FAT32', msdos: 'FAT32', exfat: 'exFAT', fat32: 'FAT32',
    ntfs: 'NTFS', ext2: 'ext2', ext3: 'ext3', ext4: 'ext4', f2fs: 'F2FS',
    xfs: 'XFS', btrfs: 'btrfs', hfs: 'HFS+', hfsplus: 'HFS+', apfs: 'APFS',
};

// Android mounts none of these, so a volume that arrived on one is either an OEM driver doing
// something read-only, or a stick the handset silently refused. Either way the app must say so.
const FS_UNSUPPORTED = ['ntfs', 'ext2', 'ext3', 'ext4', 'xfs', 'btrfs', 'hfs', 'hfsplus', 'apfs'];

function volumeFsLabel(fs) {
    const key = String(fs || '').toLowerCase();
    if (!key) return '';
    return FS_LABELS[key] || key.toUpperCase();
}

/**
 * Mounted storages, from `StorageManager` where it will talk and from a `/storage` scan where it
 * will not. The scan is not belt-and-braces padding: several OEM ROMs omit removable volumes from
 * `getStorageVolumes()`, and on those devices it is the only thing that finds the stick.
 */
async function getStorageVolumes(forceRefresh) {
    if (!isAndroidRuntime()) return null;
    if (storageVolumesPayload && !forceRefresh) return storageVolumesPayload;

    const byPath = new Map();
    let usbDevices = 0;
    try {
        const raw = window.TDashcamNative?.storageVolumes
            ? String(window.TDashcamNative.storageVolumes()) : '';
        if (raw) {
            const parsed = JSON.parse(raw);
            usbDevices = Number(parsed.usbDevices) || 0;
            for (const item of parsed.volumes || []) {
                byPath.set(item.path, { ...item, entries: volumeEntries(item), kind: volumeKind(item), fromFramework: true });
            }
        }
    } catch (e) {
        console.warn('[getStorageVolumes] native volume list failed:', e);
    }

    // Ask for the counts that used to come back inside the call above. The answer arrives through
    // `__tdashcamVolumeCounts` and repaints the row, so nobody waits on it here.
    try { window.TDashcamNative?.requestVolumeCounts?.(); } catch (e) { /* the row just stays plain */ }

    try {
        const names = await nativeInvoke('list_subdirs', { path: '/storage' });
        for (const name of names) {
            const path = `/storage/${name}`;
            if (VOLUME_SKIP_NAMES.includes(name.toLowerCase())) continue;
            if (byPath.has(path)) continue;
            const guess = { path, label: name, primary: false, removable: true };
            byPath.set(path, { ...guess, kind: volumeKind(guess), entries: volumeEntries(guess), fromFramework: false });
        }
    } catch (e) {
        console.warn('[getStorageVolumes] /storage scan failed:', e);
    }

    storageVolumesPayload = { volumes: [...byPath.values()], usbDevices };
    return storageVolumesPayload;
}

/**
 * Deleting an event unlinks every clip it holds, and on a spinning 2 TB drive that is not one
 * frame's work, so the call runs on the same worker as the volume counts and answers through
 * `__tdashcamDeleteResult` instead of returning a String. The timeout is not decoration: a promise
 * that never settles leaves the confirm dialog with neither a result nor a message.
 */
let deleteResultSettle = null;

function nativeDeletePaths(targets, translations) {
    const native = window.TDashcamNative;
    return new Promise(resolve => {
        let settled = false;
        let timer = 0;
        const finish = result => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            deleteResultSettle = null;
            resolve(result || { ok: false, error: translations.deleteNoAnswer });
        };
        timer = setTimeout(() => finish({ ok: false, error: translations.deleteNoAnswer }), 180000);
        deleteResultSettle = finish;
        try {
            native.deletePaths(JSON.stringify(targets));
        } catch (e) {
            finish({ ok: false, error: String((e && e.message) || e) });
        }
    });
}

window.__tdashcamDeleteResult = (result) => {
    if (deleteResultSettle) deleteResultSettle(result);
};

/**
 * Does this volume hold dashcam footage, and where exactly? One level of names answers it, and the
 * answer is what makes "plug the stick in and press play" one tap instead of a tour of the tree.
 */
async function probeVolumeForTeslaCam(path) {
    try {
        const names = await nativeInvoke('list_subdirs', { path });
        const clips = names.filter(name => CLIP_FOLDER_NAMES.includes(name));
        if (names.includes('TeslaCam')) {
            return { bestPath: `${path.replace(/\/+$/, '')}/TeslaCam`, clipFolders: ['TeslaCam'] };
        }
        if (clips.length) {
            return { bestPath: path.replace(/\/+$/, ''), clipFolders: clips };
        }
        return { bestPath: null, clipFolders: [] };
    } catch (e) {
        return { bestPath: null, clipFolders: [], error: String(e?.message || e) };
    }
}

/**
 * Open an external URL in the system browser. Returns true when the link was handled, so the
 * caller can suppress the default navigation. `plg:opener` is not registered in the mobile
 * build and `window.open` goes nowhere in this WebView, so the activity is the only way out;
 * the native side rejects anything that is not http(s).
 */
function openExternalUrl(url) {
    if (!isAndroidRuntime() || !window.TDashcamNative) return false;
    try {
        window.TDashcamNative.openExternal(String(url));
        return true;
    } catch (e) {
        console.warn('[openExternalUrl] failed:', e);
        return false;
    }
}

// Only the activity can keep the screen awake while a feed is running; the call is a no-op on
// desktop. The matching `setFullscreen` bridge is still in MainActivity but the page no longer
// asks for system-bar fullscreen — see VideoControls.hideControls().
function setNativeKeepScreenOn(on) {
    if (!isAndroidRuntime() || !window.TDashcamNative) return;
    try { window.TDashcamNative.setKeepScreenOn(!!on); }
    catch (e) { console.warn('[setNativeKeepScreenOn] failed:', e); }
}

// --- End Android Runtime Helpers ---

// Get system temp directory for temporary files
async function getTempDir() {
    const tauri = getTauri();
    if (tauri && tauri.path && tauri.path.tempDir) {
        try {
            const tempDir = await tauri.path.tempDir();
            // Ensure no trailing separator for consistency
            return tempDir.replace(/[\/\\]$/, '');
        } catch (e) {
            console.warn('[getTempDir] Failed to get temp dir:', e);
        }
    }
    // Fallback for different OS
    if (typeof process !== 'undefined' && process.env) {
        return process.env.TEMP || process.env.TMP || '/tmp';
    }
    return '/tmp';
}

function getFileUrl(file) {
    const tauri = getTauri();
    if (tauri && file.path) {
        if (isAndroidRuntime()) {
            const streamUrl = getStreamUrl(file.path);
            if (streamUrl) return streamUrl;
            console.warn('[getFileUrl] media server not ready for', file.path);
        }

        // Tauri 2: use core.convertFileSrc
        let convertFn = null;
        if (tauri.core && tauri.core.convertFileSrc) {
            convertFn = tauri.core.convertFileSrc;
        } else if (tauri.tauri && tauri.tauri.convertFileSrc) {
            convertFn = tauri.tauri.convertFileSrc;
        } else if (tauri.convertFileSrc) {
            convertFn = tauri.convertFileSrc;
        }
        
        if (convertFn) {
            const url = convertFn(file.path);
            console.log('[getFileUrl] path:', file.path, '-> url:', url);
            return url;
        }
        
        // Fallback: return path directly (won't work but helps debug)
        console.warn('[getFileUrl] No convertFileSrc found, returning raw path');
        return file.path;
    }
    return URL.createObjectURL(file);
}

/**
 * A real picture out of a clip: the event cards that have no `thumb.png`, and the filmstrip on the
 * trim timeline, ask the same question — 「second N of this file」 — so the decoded frames are
 * cached between the two and survive a re-render of the list.
 *
 * Decoding is a detached `<video>` seeking through the loopback server (Range and
 * `Access-Control-Allow-Origin: *` both come from `stream_server.rs`; `crossOrigin` is what turns
 * that into an untainted canvas), then a canvas readback. Two run at a time on purpose: a phone
 * has a handful of hardware decoder slots and playback already holds one per camera, so an
 * unbounded queue starves the player rather than the list.
 */
const FrameFetcher = {
    MAX_LIVE: 2,
    CACHE_LIMIT: 400,
    // A cold OTG stick plus a 1080x2400 HEVC keyframe seek can take the better part of ten seconds
    // on a mid-range handset, and one slow read should not cost the card its picture for good.
    TIMEOUT_MS: 15000,
    // Long enough that the page never fires its own `<video>` seek while the retriever is still
    // working on the same frame — two decoders racing for one picture costs both of them.
    NATIVE_TIMEOUT_MS: 15000,
    cache: new Map(),
    waiting: [],
    live: 0,
    canvas: null,
    nativeSeq: 0,
    nativePending: {},

    // The width is part of the key: the export sheet asks the same second at a larger size for a
    // composite preview, and a cache entry has to describe the picture it actually holds.
    key(path, seconds, width) { return `${path}@${Math.round(seconds)}x${width || 160}`; },

    peek(path, seconds, width) { return this.cache.get(this.key(path, seconds, width)); },

    get(path, seconds, width) {
        const wanted = width || 160;
        const key = this.key(path, seconds, wanted);
        if (this.cache.has(key)) return Promise.resolve(this.cache.get(key));
        return new Promise((resolve) => {
            this.waiting.push({ key, path, seconds, width: wanted, resolve });
            this.drain();
        });
    },

    drain() {
        while (this.live < this.MAX_LIVE && this.waiting.length > 0) {
            const job = this.waiting.shift();
            this.live += 1;
            this.grab(job.path, job.seconds, job.width, (value, permanent) => {
                this.live -= 1;
                // A clip that merely answered late stays unrecorded so the next scroll can ask
                // again; a clip that said no is a clip that will keep saying no.
                if (permanent !== false) this.remember(job.key, value);
                job.resolve(value);
                this.drain();
            });
        }
    },

    remember(key, value) {
        this.cache.set(key, value);
        // Oldest out. The list scrolls forwards, so whatever was looked at first is what sits
        // furthest behind the user now.
        while (this.cache.size > this.CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value);
    },

    /**
     * The native retriever decodes in the app process, so it does not queue behind the six
     * players for a WebView decoder slot — which is the difference between a filmstrip that
     * paints and one that times out while an event is loaded.
     */
    grab(path, seconds, width, done) {
        if (!isAndroidRuntime() || typeof window.TDashcamNative?.requestThumb !== 'function') {
            this.grabViaVideo(path, seconds, width, done);
            return;
        }
        this.grabNative(path, seconds, width, (value) => {
            if (value) done(value);
            else this.grabViaVideo(path, seconds, width, done);
        });
    },

    grabNative(path, seconds, width, done) {
        const id = `f${++this.nativeSeq}`;
        let settled = false;
        const finish = (value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            delete this.nativePending[id];
            done(value);
        };
        const timer = setTimeout(() => finish(null), this.NATIVE_TIMEOUT_MS);
        this.nativePending[id] = finish;
        try {
            window.TDashcamNative.requestThumb(id, String(path),
                Math.max(0, Math.round(seconds * 1000)), width || 160);
        } catch (e) {
            console.warn('[FrameFetcher] native request failed:', e);
            finish(null);
        }
    },

    grabViaVideo(path, seconds, width, done) {
        const edge = width || 160;
        const video = document.createElement('video');
        let settled = false;
        let target = 0;
        const finish = (value, permanent) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            // The decoder slot is the scarce resource, not the bytes: dropping the source and
            // forcing a load is what gives it back instead of waiting for the collector.
            video.removeAttribute('src');
            try { video.load(); } catch (e) { /* already detached */ }
            video.remove();
            done(value, permanent);
        };
        const capture = () => {
            const sourceWidth = Number(video.videoWidth) || edge;
            const sourceHeight = Number(video.videoHeight) || Math.round(edge * 9 / 16);
            const canvas = this.canvas || (this.canvas = document.createElement('canvas'));
            canvas.width = edge;
            // The card box crops with `object-fit: cover`, so the grab keeps the clip's own
            // proportions instead of squaring them off.
            canvas.height = Math.max(1, Math.round(edge * sourceHeight / sourceWidth));
            try {
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                finish(canvas.toDataURL('image/jpeg', 0.62));
            } catch (e) {
                console.warn('[FrameFetcher] readback failed:', e);
                finish(null);
            }
        };
        // Android's decoder sometimes moves `currentTime` and then never announces it: the seek
        // finished, the `seeked` event is not coming. `seeking === false` is what separates that
        // from a seek still in flight, which would otherwise read back the frame from 0 s and
        // label it with the time we asked for.
        const timer = setTimeout(() => {
            const landed = !video.seeking && video.readyState >= 2
                && Math.abs(Number(video.currentTime) - target) < 0.75;
            if (landed) capture();
            else finish(null, false);
        }, this.TIMEOUT_MS);

        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.crossOrigin = 'anonymous';
        // Parked offscreen rather than left detached or hidden: a video that is not in the document
        // is a video the WebView is free to decode last.
        video.style.cssText = 'position:fixed;left:-9999px;top:0;width:160px;height:90px;pointer-events:none;';
        document.body.appendChild(video);
        video.addEventListener('loadeddata', () => {
            const duration = Number(video.duration);
            if (!Number.isFinite(duration) || duration <= 0) finish(null, true);
            else {
                target = Math.max(0, Math.min(seconds, duration - 0.25));
                video.currentTime = target;
            }
        }, { once: true });
        video.addEventListener('seeked', capture, { once: true });
        video.addEventListener('error', () => finish(null, true), { once: true });
        video.src = getFileUrl({ path });
    },
};

// An answer that arrives after its own timeout has already fallen back to `<video>` has nowhere
// to go, so the pending entry is the whole handshake.
window.__tdashcamNativeThumb = (id, dataUrl) => {
    const settle = FrameFetcher.nativePending[id];
    if (settle) settle(typeof dataUrl === 'string' ? dataUrl : null);
};

class TauriFile {
    constructor(entry, rootPath) {
        this.name = entry.name;
        this.path = entry.path; 
        
        // Calculate webkitRelativePath - must use forward slashes
        if (this.path && rootPath) {
             // Normalize all separators to forward slashes
             const normalizedPath = this.path.replace(/\\/g, '/');
             const normalizedRoot = rootPath.replace(/\\/g, '/');
             
             // Get the root folder name (e.g., "TeslaCam")
             const rootName = normalizedRoot.split('/').filter(Boolean).pop();
             
             // Get the relative part after the root path
             const relativePart = normalizedPath.substring(normalizedRoot.length);
             const cleanRelative = relativePart.startsWith('/') ? relativePart.slice(1) : relativePart;
             
             if (cleanRelative) {
                 // Ensure forward slashes in the final path
                 this.webkitRelativePath = (rootName + '/' + cleanRelative).replace(/\\/g, '/');
             } else {
                 this.webkitRelativePath = this.name;
             }
        } else {
             this.webkitRelativePath = this.name;
        }

        this.lastModified = 0;
        this.size = 0; 
        this.type = this.guessType(this.name);
    }
    
    guessType(name) {
        if (name.endsWith('.mp4')) return 'video/mp4';
        if (name.endsWith('.json')) return 'application/json';
        if (name.endsWith('.png')) return 'image/png';
        return '';
    }

    async text() {
        const tauri = getTauri();
        if (!tauri) throw new Error("Tauri API not found");
        if (isAndroidRuntime()) {
            const streamUrl = getStreamUrl(this.path);
            if (streamUrl) return await (await fetch(streamUrl)).text();
        }
        return await tauri.fs.readTextFile(this.path);
    }
    
    async arrayBuffer() {
        const tauri = getTauri();
        if (!tauri) throw new Error("Tauri API not found");
        if (isAndroidRuntime()) {
            // Loopback fetch keeps large MP4 buffers out of the IPC channel.
            const streamUrl = getStreamUrl(this.path);
            if (streamUrl) {
                const response = await fetch(streamUrl);
                if (!response.ok) throw new Error(`Media server returned ${response.status}`);
                return await response.arrayBuffer();
            }
        }
        const binary = await tauri.fs.readFile(this.path);
        return binary.buffer;
    }
}
// --- End Tauri Helper ---

// ============================================================
// Metadata Overlay Generator for FFmpeg (PNG icons + overlay filter)
// ============================================================
class MetadataOverlayGenerator {
    constructor() {
        // Gear mapping
        this.gearMap = {
            'GEAR_PARK': 'P',
            'GEAR_DRIVE': 'D',
            'GEAR_REVERSE': 'R',
            'GEAR_NEUTRAL': 'N'
        };
        
        // Autopilot mapping
        this.autopilotMap = {
            'NONE': '',
            'SELF_DRIVING': 'FSD',
            'AUTOSTEER': 'AP',
            'TACC': 'TACC'
        };
        
        // 预加载刹车踏板图标
        this.brakeIconLoaded = false;
        this.brakeIconImg = null;
        this.loadBrakeIcon();
        
        // Colors for FFmpeg (hex format)
        this.colors = {
            white: 'ffffff',
            gray: '808080',
            green: '52c41a',
            red: 'ff4d4f',
            blue: '1890ff',
            orange: 'ffa500',
            dimGray: '606060'
        };
        
        // Icon size for overlay
        this.iconSize = 28;
        this.iconSpacing = 8;
        
        // Cache for generated PNG icons
        this.iconCache = new Map();
    }
    
    /**
     * Get font file path based on operating system
     */
    getFontPath() {
        if (typeof navigator !== 'undefined') {
            if (navigator.userAgent.includes('Windows')) {
                return "C\\\\:/Windows/Fonts/msyh.ttc";
            } else if (navigator.userAgent.includes('Mac')) {
                // Escape spaces for FFmpeg filter
                return "/System/Library/Fonts/Hiragino\\ Sans\\ GB.ttc";
            } else {
                return "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
            }
        }
        return "";
    }
    
    /**
     * Generate SVG icon as data URL
     */
    getSvgDataUrl(svgContent) {
        const encoded = encodeURIComponent(svgContent);
        return `data:image/svg+xml,${encoded}`;
    }
    
    /**
     * Create SVG for left blinker arrow
     */
    createBlinkerLeftSvg(active, size = 28) {
        const color = active ? '#52c41a' : 'rgba(255,255,255,0.3)';
        const stroke = active ? '#52c41a' : 'rgba(255,255,255,0.5)';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">
            <path d="M20 8 L6 24 L20 40 L20 30 L42 30 L42 18 L20 18 Z" 
                  fill="${color}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;
    }
    
    /**
     * Create SVG for right blinker arrow
     */
    createBlinkerRightSvg(active, size = 28) {
        const color = active ? '#52c41a' : 'rgba(255,255,255,0.3)';
        const stroke = active ? '#52c41a' : 'rgba(255,255,255,0.5)';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">
            <path d="M28 8 L42 24 L28 40 L28 30 L6 30 L6 18 L28 18 Z" 
                  fill="${color}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;
    }
    
    /**
     * Create SVG for brake icon
     */
    createBrakeSvg(active, size = 28) {
        const color = active ? '#ff4d4f' : 'rgba(255,255,255,0.4)';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">
            <circle cx="24" cy="24" r="20" fill="none" stroke="${color}" stroke-width="2"/>
            <circle cx="24" cy="24" r="10" fill="none" stroke="${color}" stroke-width="2"/>
            <circle cx="24" cy="24" r="3" fill="${color}"/>
            <path d="M8 14 C2 18, 2 30, 8 34" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
        </svg>`;
    }
    
    /**
     * Create SVG for accelerator/throttle icon
     */
    createAcceleratorSvg(percent, size = 28) {
        const fillHeight = (percent / 100) * 20;
        const yPos = 26 - fillHeight;
        const color = percent > 0 ? '#73d13d' : 'rgba(255,255,255,0.4)';
        const fillRect = percent > 0 ? `<rect x="10" y="${yPos}" width="12" height="${fillHeight}" rx="2" fill="#73d13d" opacity="0.9"/>` : '';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
            <rect x="8" y="4" width="16" height="24" rx="3" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
            <path d="M18 8 L13 16 L16 16 L14 24 L19 15 L16 15 L18 8 Z" fill="${color}"/>
            ${fillRect}
        </svg>`;
    }
    
    /**
     * Create SVG for autopilot/steering wheel icon
     */
    createAutopilotSvg(active, size = 28) {
        const color = active ? '#1890ff' : 'rgba(255,255,255,0.6)';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
            <circle cx="32" cy="32" r="26" fill="none" stroke="${color}" stroke-width="4"/>
            <circle cx="32" cy="32" r="8" fill="${color}"/>
            <rect x="6" y="29" width="17" height="6" rx="2" fill="${color}"/>
            <rect x="41" y="29" width="17" height="6" rx="2" fill="${color}"/>
            <rect x="29" y="41" width="6" height="17" rx="2" fill="${color}"/>
        </svg>`;
    }
    
    /**
     * Convert SVG to PNG using Canvas and return as base64
     */
    async svgToPngBase64(svgContent, size = 28) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            img.onload = () => {
                ctx.drawImage(img, 0, 0, size, size);
                URL.revokeObjectURL(url);
                // Get PNG as base64 (without data:image/png;base64, prefix)
                const dataUrl = canvas.toDataURL('image/png');
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load SVG'));
            };
            
            img.src = url;
        });
    }
    
    /**
     * Generate a complete metadata overlay PNG for a single frame
     * Uses bucket values for display to match the state key
     * Returns PNG as Uint8Array
     */
    /**
     * Generate a static background PNG for the overlay bar
     */
    async generateBackgroundPng() {
        const barWidth = 460;
        const barHeight = 65;
        const canvas = document.createElement('canvas');
        canvas.width = barWidth;
        canvas.height = barHeight;
        const ctx = canvas.getContext('2d');
        
        // Glassmorphism effect background (less transparent)
        ctx.save();
        const gradient = ctx.createLinearGradient(0, 0, 0, barHeight);
        gradient.addColorStop(0, 'rgba(20, 20, 20, 0.5)');
        gradient.addColorStop(1, 'rgba(5, 5, 5, 0.55)');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(0, 0, barWidth, barHeight, 16);
        } else {
            const r = 16;
            ctx.moveTo(r, 0); ctx.lineTo(barWidth - r, 0); ctx.quadraticCurveTo(barWidth, 0, barWidth, r);
            ctx.lineTo(barWidth, barHeight - r); ctx.quadraticCurveTo(barWidth, barHeight, barWidth - r, barHeight);
            ctx.lineTo(r, barHeight); ctx.quadraticCurveTo(0, barHeight, 0, barHeight - r);
            ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
        }
        ctx.fill();
        ctx.restore();
        
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                blob.arrayBuffer().then(buffer => {
                    resolve({ data: new Uint8Array(buffer), width: barWidth, height: barHeight });
                });
            }, 'image/png');
        });
    }

    /**
     * Generate a complete metadata overlay PNG for a single frame
     * Returns an object { data: Uint8Array, width, height }
     */
    async generateMetadataOverlayPng(data) {
        // We use a fixed height for the bar - increased size
        const barHeight = 65;
        const barWidth = 460;
        const iconSize = 30;

        // Get values with fallbacks
        const speedKmh = Math.round((data.vehicleSpeedMps || 0) * 3.6);
        const speedDisplay = speedKmh >= 150 ? '150+' : `${speedKmh}`;
        const speedText = `${speedDisplay} km/h`;
        
        const gear = this.gearMap[data.gearState] || '--';
        const gearText = `[${gear}]`;
        
        // Autopilot state for steering wheel color
        const autopilotState = data.autopilotState || 'NONE';
        
        // Accelerator: use 10% bucket for both display and icon to match state key
        const accelPercent = Math.round(data.acceleratorPedalPosition || 0);
        const accelBucket = Math.floor(accelPercent / 10) * 10;
        
        // Steering angle: use 10° bucket to match state key
        const steeringAngle = Math.round(data.steeringWheelAngle || 0);
        const steeringBucket = Math.round(steeringAngle / 10) * 10;

        // Create actual canvas for drawing
        const canvas = document.createElement('canvas');
        canvas.width = barWidth;
        canvas.height = barHeight;
        const ctx = canvas.getContext('2d');
        
        // NO BACKGROUND DRAWN HERE - IT WILL BE OVERLAID SEPARATELY IN FFMPEG

        // Draw items (Using FIXED COORDINATES to prevent jittering)
        ctx.font = 'bold 24px "Noto Sans SC", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        const yCenter = barHeight / 2;
        
        // Layout: Speed -> Gear -> Blinkers -> Brake -> Accel -> Steering Wheel
        
        // Speed (Fixed area, right-aligned at 125)
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(speedText, 125, yCenter);
        
        // Gear (Fixed at 145)
        ctx.textAlign = 'left';
        let gearColor = '#ffffff';
        if (gear === 'D') gearColor = '#52c41a';
        else if (gear === 'R') gearColor = '#ff4d4f';
        ctx.fillStyle = gearColor;
        ctx.fillText(gearText, 145, yCenter);

        // Blinkers (Tightened gaps)
        try { this.drawLeftArrow(ctx, 200, yCenter, iconSize, data.blinkerOnLeft); } catch (e) { console.error('[drawLeftArrow]', e); }
        try { this.drawRightArrow(ctx, 240, yCenter, iconSize, data.blinkerOnRight); } catch (e) { console.error('[drawRightArrow]', e); }

        // Brake (Fixed at 290)
        try { this.drawBrakeIcon(ctx, 290, yCenter, iconSize, data.brakeApplied); } catch (e) { console.error('[drawBrakeIcon]', e); }

        // Accel / Power (Fixed at 340)
        // Use bucket value for icon fill (10% granularity), no percentage text
        try { this.drawAcceleratorIcon(ctx, 340, yCenter, iconSize, accelBucket); } catch (e) { console.error('[drawAcceleratorIcon]', e); }

        // Steering Wheel (Fixed at 390) - color based on autopilot state
        try { this.drawSteeringWheelIcon(ctx, 390, yCenter, iconSize, steeringBucket, autopilotState); } catch (e) { console.error('[drawSteeringWheelIcon]', e); }
        
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to create PNG blob'));
                    return;
                }
                blob.arrayBuffer().then(buffer => {
                    resolve({ data: new Uint8Array(buffer), width: barWidth, height: barHeight });
                }).catch(reject);
            }, 'image/png');
        });
    }
    
    // Draw left arrow icon using Canvas
    drawLeftArrow(ctx, x, y, size, active) {
        const color = active ? '#52c41a' : 'rgba(255,255,255,0.2)';
        const shadowColor = active ? 'rgba(82, 196, 26, 0.4)' : 'transparent';
        
        ctx.save();
        if (active) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = shadowColor;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        const halfSize = size / 2;
        // More stylish arrow
        ctx.moveTo(x + size * 0.9, y - halfSize * 0.4);
        ctx.lineTo(x + halfSize * 1.1, y - halfSize * 0.4);
        ctx.lineTo(x + halfSize * 1.1, y - halfSize * 0.8);
        ctx.lineTo(x + size * 0.1, y);
        ctx.lineTo(x + halfSize * 1.1, y + halfSize * 0.8);
        ctx.lineTo(x + halfSize * 1.1, y + halfSize * 0.4);
        ctx.lineTo(x + size * 0.9, y + halfSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    // Draw right arrow icon using Canvas
    drawRightArrow(ctx, x, y, size, active) {
        const color = active ? '#52c41a' : 'rgba(255,255,255,0.2)';
        const shadowColor = active ? 'rgba(82, 196, 26, 0.4)' : 'transparent';
        
        ctx.save();
        if (active) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = shadowColor;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        const halfSize = size / 2;
        // More stylish arrow
        ctx.moveTo(x + size * 0.1, y - halfSize * 0.4);
        ctx.lineTo(x + halfSize * 0.9, y - halfSize * 0.4);
        ctx.lineTo(x + halfSize * 0.9, y - halfSize * 0.8);
        ctx.lineTo(x + size * 0.9, y);
        ctx.lineTo(x + halfSize * 0.9, y + halfSize * 0.8);
        ctx.lineTo(x + halfSize * 0.9, y + halfSize * 0.4);
        ctx.lineTo(x + size * 0.1, y + halfSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    // Draw autopilot icon (steering wheel)
    drawAutopilotIcon(ctx, x, y, size) {
        ctx.save();
        ctx.strokeStyle = '#1890ff';
        ctx.fillStyle = '#1890ff';
        ctx.lineWidth = 2.5;
        const r = size / 2 - 2;
        const cx = x + size / 2;
        const cy = y;
        
        // Outer circle with glow
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(24, 144, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Spokes (more like a Tesla steering wheel)
        ctx.beginPath();
        ctx.moveTo(cx - r + 3, cy);
        ctx.lineTo(cx - 4, cy);
        ctx.moveTo(cx + 4, cy);
        ctx.lineTo(cx + r - 3, cy);
        ctx.moveTo(cx, cy + 4);
        ctx.lineTo(cx, cy + r - 3);
        ctx.stroke();
        ctx.restore();
    }
    
    // Draw accelerator icon (rectangle with fill level like web version)
    drawAcceleratorIcon(ctx, x, y, size, percent) {
        const active = percent > 0;
        
        ctx.save();
        
        // Rectangle dimensions
        const rectWidth = size * 0.6;
        const rectHeight = size * 0.9;
        const rectX = x + (size - rectWidth) / 2;
        const rectY = y - rectHeight / 2;
        const cornerRadius = 3;
        
        // Draw outer rectangle border
        ctx.strokeStyle = active ? '#52c41a' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        } else {
            // Fallback for older browsers
            ctx.moveTo(rectX + cornerRadius, rectY);
            ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
            ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
            ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
            ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
            ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
            ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
            ctx.lineTo(rectX, rectY + cornerRadius);
            ctx.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
        }
        ctx.stroke();
        
        // Draw fill level from bottom
        if (active && percent > 0) {
            const fillHeight = (percent / 100) * (rectHeight - 4);
            const fillY = rectY + rectHeight - 2 - fillHeight;
            
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(82, 196, 26, 0.5)';
            ctx.fillStyle = '#52c41a';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(rectX + 2, fillY, rectWidth - 4, fillHeight, Math.min(cornerRadius - 1, 2));
            } else {
                ctx.rect(rectX + 2, fillY, rectWidth - 4, fillHeight);
            }
            ctx.fill();
        }
        
        // Draw small lightning bolt icon inside (smaller, at top)
        const boltSize = size * 0.35;
        const boltX = x + size / 2;
        const boltY = rectY + boltSize / 2 + 3;
        ctx.fillStyle = active ? '#ffffff' : 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.moveTo(boltX + boltSize * 0.1, boltY - boltSize * 0.4);
        ctx.lineTo(boltX - boltSize * 0.15, boltY + boltSize * 0.05);
        ctx.lineTo(boltX + boltSize * 0.02, boltY + boltSize * 0.05);
        ctx.lineTo(boltX - boltSize * 0.1, boltY + boltSize * 0.4);
        ctx.lineTo(boltX + boltSize * 0.15, boltY - boltSize * 0.05);
        ctx.lineTo(boltX - boltSize * 0.02, boltY - boltSize * 0.05);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    // 预加载刹车踏板SVG图标
    loadBrakeIcon() {
        const svgContent = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M821.394 861.482H200.242c-23.709 0-44.013-20.191-45.124-44.975 0 0-30.555-129.896-30.044-166.228 0.325-23.102 15.23-164.3 15.23-164.3 2.449-27.739 18.019-48.258 42.686-48.258h646.233c24.667 0 44.357 21.769 43.759 48.258l14.579 163.622-22.043 166.906c-0.56 24.784-20.414 44.975-44.124 44.975z m24.716-358.364l0.292-10.498c0.23-8.275-6.452-15.059-14.85-15.059H186.497c-8.397 0-14.828 6.784-14.291 15.059l0.681 10.498c0.534 8.232 7.802 14.954 16.153 14.954h641.472c8.35 0 15.37-6.722 15.598-14.954z m8.739 81.304l0.296-10.264c0.233-8.091-6.628-14.724-15.248-14.724H177.735c-8.62 0-15.226 6.633-14.681 14.724l0.691 10.264c0.542 8.049 7.999 14.622 16.571 14.622H838.84c8.574 0 15.777-6.572 16.009-14.622z m6.172 79.506l0.298-10.038c0.235-7.912-6.747-14.399-15.516-14.399H172.234c-8.769 0-15.494 6.487-14.945 14.399l0.695 10.038c0.545 7.872 8.126 14.3 16.847 14.3h669.91c8.721 0 16.047-6.428 16.28-14.3z m-14.901 77.765l0.282-9.819c0.222-7.74-6.466-14.085-14.863-14.085H186.526c-8.397 0-14.841 6.345-14.322 14.085l0.659 9.819c0.517 7.701 7.772 13.989 16.123 13.989h641.548c8.351 0 15.365-6.288 15.586-13.989z m-8.749 76.081l0.267-9.608c0.21-7.573-6.189-13.781-14.222-13.781H206.385c-8.033 0-14.202 6.208-13.711 13.781l0.623 9.608c0.489 7.535 7.425 13.688 15.415 13.688h613.751c7.99 0.001 14.698-6.152 14.908-13.688z m1.869-378.856l36.038-94.167 21.623-119.775H785.183L752.749 356.56l-118.926 82.358H839.24z" fill="#ffffff"/></svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        this.brakeIconImg = new Image();
        this.brakeIconImg.onload = () => {
            this.brakeIconLoaded = true;
            URL.revokeObjectURL(url);
        };
        this.brakeIconImg.src = url;
    }
    
    // Draw brake icon (brake pedal shape from SVG image)
    drawBrakeIcon(ctx, x, y, size, active) {
        ctx.save();
        
        try {
            if (active) {
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(255, 77, 79, 0.5)';
            }
            
            // 绘制图标，居中对齐 - 使用较大尺寸
            const iconSize = size * 1.5;
            const iconX = x + (size - iconSize) / 2;
            const iconY = y - iconSize / 2;
            
            // 使用Path2D绘制SVG路径
            const color = active ? '#ff4d4f' : 'rgba(255,255,255,0.2)';
            ctx.fillStyle = color;
            
            // SVG viewBox是0 0 1024 1024，路径实际范围约 x:140-880, y:162-861
            // 需要调整偏移使其居中
            const svgSize = 1024;
            const pathWidth = 880 - 140; // 约740
            const pathHeight = 861 - 162; // 约699
            const pathCenterX = 140 + pathWidth / 2; // 约510
            const pathCenterY = 162 + pathHeight / 2; // 约511
            
            const scale = iconSize / svgSize;
            
            // 将路径中心移到图标中心
            ctx.translate(iconX + iconSize / 2, iconY + iconSize / 2);
            ctx.scale(scale, scale);
            ctx.translate(-pathCenterX, -pathCenterY);
            
            const path = new Path2D('M821.394 861.482H200.242c-23.709 0-44.013-20.191-45.124-44.975 0 0-30.555-129.896-30.044-166.228 0.325-23.102 15.23-164.3 15.23-164.3 2.449-27.739 18.019-48.258 42.686-48.258h646.233c24.667 0 44.357 21.769 43.759 48.258l14.579 163.622-22.043 166.906c-0.56 24.784-20.414 44.975-44.124 44.975z m24.716-358.364l0.292-10.498c0.23-8.275-6.452-15.059-14.85-15.059H186.497c-8.397 0-14.828 6.784-14.291 15.059l0.681 10.498c0.534 8.232 7.802 14.954 16.153 14.954h641.472c8.35 0 15.37-6.722 15.598-14.954z m8.739 81.304l0.296-10.264c0.233-8.091-6.628-14.724-15.248-14.724H177.735c-8.62 0-15.226 6.633-14.681 14.724l0.691 10.264c0.542 8.049 7.999 14.622 16.571 14.622H838.84c8.574 0 15.777-6.572 16.009-14.622z m6.172 79.506l0.298-10.038c0.235-7.912-6.747-14.399-15.516-14.399H172.234c-8.769 0-15.494 6.487-14.945 14.399l0.695 10.038c0.545 7.872 8.126 14.3 16.847 14.3h669.91c8.721 0 16.047-6.428 16.28-14.3z m-14.901 77.765l0.282-9.819c0.222-7.74-6.466-14.085-14.863-14.085H186.526c-8.397 0-14.841 6.345-14.322 14.085l0.659 9.819c0.517 7.701 7.772 13.989 16.123 13.989h641.548c8.351 0 15.365-6.288 15.586-13.989z m-8.749 76.081l0.267-9.608c0.21-7.573-6.189-13.781-14.222-13.781H206.385c-8.033 0-14.202 6.208-13.711 13.781l0.623 9.608c0.489 7.535 7.425 13.688 15.415 13.688h613.751c7.99 0.001 14.698-6.152 14.908-13.688z m1.869-378.856l36.038-94.167 21.623-119.775H785.183L752.749 356.56l-118.926 82.358H839.24z');
            ctx.fill(path);
        } catch (err) {
            console.error('[drawBrakeIcon] Error:', err);
        }
        
        ctx.restore();
    }
    
    // Draw steering wheel icon with rotation and autopilot color (matches web version)
    drawSteeringWheelIcon(ctx, x, y, size, angle, autopilotState) {
        // Determine color based on autopilot state
        let color = 'rgba(255,255,255,0.9)'; // Default: white
        let shadowColor = 'transparent';
        
        if (autopilotState === 'SELF_DRIVING') {
            color = '#52c41a'; // Green for full self-driving
            shadowColor = 'rgba(82, 196, 26, 0.5)';
        } else if (autopilotState === 'AUTOSTEER' || autopilotState === 'TACC') {
            color = '#1890ff'; // Blue for autopilot/TACC
            shadowColor = 'rgba(24, 144, 255, 0.5)';
        }
        
        ctx.save();
        
        // Apply shadow for active states
        if (shadowColor !== 'transparent') {
            ctx.shadowBlur = 6;
            ctx.shadowColor = shadowColor;
        }
        
        // Move to center of icon and rotate
        const cx = x + size / 2;
        const cy = y;
        ctx.translate(cx, cy);
        ctx.rotate((angle * Math.PI) / 180);
        
        // Scale factor: SVG viewBox is 64x64, we scale to fit 'size'
        const scale = size / 64;
        const r = 28 * scale; // outer ring radius (from SVG: r="28")
        const hubR = 9 * scale; // hub radius (from SVG: r="9")
        const strokeWidth = 5 * scale;
        const spokeHeight = 8 * scale;
        const spokeWidth = 19 * scale;
        const spokeRx = 2 * scale;
        
        // Draw outer ring (steering wheel rim)
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw center hub circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw three spokes as rounded rectangles (like web SVG)
        ctx.fillStyle = color;
        
        // Left spoke: rect x="4" y="28" width="19" height="8" (centered at y=32)
        // In our coordinate system (centered at 0,0): x from -28 to -9, y from -4 to +4
        const leftSpokeX = -r - strokeWidth / 2;
        const leftSpokeY = -spokeHeight / 2;
        this.drawRoundedRect(ctx, leftSpokeX, leftSpokeY, spokeWidth, spokeHeight, spokeRx);
        ctx.fill();
        
        // Right spoke: rect x="41" y="28" width="19" height="8"
        // In our coordinate system: x from +9 to +28, y from -4 to +4
        const rightSpokeX = r - spokeWidth + strokeWidth / 2;
        const rightSpokeY = -spokeHeight / 2;
        this.drawRoundedRect(ctx, rightSpokeX, rightSpokeY, spokeWidth, spokeHeight, spokeRx);
        ctx.fill();
        
        // Bottom spoke: rect x="28" y="41" width="8" height="19"
        // In our coordinate system: x from -4 to +4, y from +9 to +28
        const bottomSpokeX = -spokeHeight / 2;
        const bottomSpokeY = hubR;
        this.drawRoundedRect(ctx, bottomSpokeX, bottomSpokeY, spokeHeight, spokeWidth, spokeRx);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Helper: draw rounded rectangle
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, radius);
        } else {
            // Fallback for older browsers
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }
    }
    
    /**
     * Generate unique key for metadata state (for caching overlay PNGs)
     */
    getMetadataStateKey(data) {
        // Real speed (1 km/h granularity)
        const speedKmh = Math.round((data.vehicleSpeedMps || 0) * 3.6);
        
        const gear = this.gearMap[data.gearState] || '--';
        
        // Accelerator bucket: 10% granularity (0, 10, 20, ..., 100) to reduce unique states
        // while maintaining reasonable visual accuracy
        const accelPercent = Math.round(data.acceleratorPedalPosition || 0);
        const accelBucket = Math.floor(accelPercent / 10) * 10;
        
        // Steering angle bucket: 10° granularity to reduce unique states
        const steeringAngle = Math.round(data.steeringWheelAngle || 0);
        const steeringBucket = Math.round(steeringAngle / 10) * 10;
        
        return `${speedKmh}_${gear}_${data.blinkerOnLeft ? 1 : 0}_${data.blinkerOnRight ? 1 : 0}_${data.autopilotState || 'NONE'}_${accelBucket}_${data.brakeApplied ? 1 : 0}_${steeringBucket}`;
    }
    
    /**
     * Get display values from state key
     */
    parseStateKey(key) {
        const parts = key.split('_');
        return {
            speedBucket: parseInt(parts[0]),
            gear: parts[1],
            blinkerLeft: parts[2] === '1',
            blinkerRight: parts[3] === '1',
            autopilotState: parts[4],
            accelBucket: parseInt(parts[5]),
            brakeApplied: parts[6] === '1',
            steeringBucket: parseInt(parts[7] || '0')
        };
    }
    
    /**
     * Generate all unique overlay PNGs needed for the video and save them
     * Returns a map of stateKey -> pngPath, or null if too many unique states
     */
    async generateOverlayPngs(allMetadata, clipSegments, workDir, width = 1920, height = 1080, progressCallback = null, language = 'zh') {
        const tauri = window.__TAURI__;
        const fs = tauri.fs;
        
        const pathSeparator = workDir.includes('\\') ? '\\' : '/';
        const timestamp = Date.now();
        const pngDir = `${workDir}${pathSeparator}overlay_pngs_${timestamp}`;
        
        // Collect all unique metadata states first
        const uniqueStates = new Map();
        
        for (const segMeta of allMetadata) {
            if (!segMeta.metadata) continue;
            for (const item of segMeta.metadata) {
                if (!item.data) continue;
                const key = this.getMetadataStateKey(item.data);
                if (!uniqueStates.has(key)) {
                    uniqueStates.set(key, item.data);
                }
            }
        }
        
        // Limit the number of unique PNGs to avoid FFmpeg command line length issues
        const MAX_UNIQUE_PNGS = 500;
        if (uniqueStates.size > MAX_UNIQUE_PNGS) {
            console.warn(`[MetadataOverlay] Too many unique states (${uniqueStates.size}), falling back to ASS subtitles`);
            return null;
        }
        
        progressCallback?.(language === 'zh' ? `生成 ${uniqueStates.size} 个元数据覆盖层...` : `Generating ${uniqueStates.size} metadata overlays...`);
        
        // Create directory for PNGs
        await fs.mkdir(pngDir, { recursive: true });
        
        // Generate and save background PNG first
        const bgResult = await this.generateBackgroundPng();
        const bgPath = `${pngDir}${pathSeparator}background.png`;
        await fs.writeFile(bgPath, bgResult.data);

        // Generate PNG for each unique state
        const pngPaths = new Map();
        pngPaths.set('__background__', bgPath);
        let idx = 0;
        
        for (const [key, data] of uniqueStates) {
            try {
                const result = await this.generateMetadataOverlayPng(data);
                const pngPath = `${pngDir}${pathSeparator}overlay_${idx}.png`;
                
                await fs.writeFile(pngPath, result.data);
                pngPaths.set(key, pngPath);
                idx++;
                
                if (idx % 20 === 0) {
                    progressCallback?.(language === 'zh' ? `生成覆盖层 ${idx}/${uniqueStates.size}...` : `Generating overlay ${idx}/${uniqueStates.size}...`);
                    // Short sleep to yield main thread
                    await new Promise(r => setTimeout(r, 0));
                }
            } catch (err) {
                console.error(`[MetadataOverlay] Failed to generate PNG for key ${key}:`, err);
                // Continue with next state instead of failing entirely
            }
        }
        
        return { pngDir, pngPaths };
    }

    /**
     * Generate FFmpeg filter for metadata overlay using concat demuxer (STABLE & FAST)
     */
    async generateOverlayFilter(allMetadata, clipSegments, pngPaths, workDir, videoInputCount = 1) {
        const pathSeparator = workDir.includes('\\') ? '\\' : '/';
        const concatFilePath = `${workDir}${pathSeparator}metadata_concat.txt`;
        const tauri = window.__TAURI__;
        
        // Build timeline of metadata changes
        const timeline = [];
        let accumulatedTime = 0;
        let totalVideoDuration = 0;
        
        for (let segIdx = 0; segIdx < clipSegments.length; segIdx++) {
            const clipSeg = clipSegments[segIdx];
            const clipStart = clipSeg.clipStart || 0;
            const clipEnd = clipSeg.clipEnd || (clipSeg.clipDuration || 60);
            totalVideoDuration += (clipEnd - clipStart);
        }

        // Create a transparent PNG for empty gaps (same size as metadata overlay)
        const transparentPngPath = `${workDir}${pathSeparator}empty_transparent.png`;
        const transCanvas = document.createElement('canvas');
        // Must match metadata overlay dimensions (460x65) for concat demuxer
        transCanvas.width = 460;
        transCanvas.height = 65;
        const transBlob = await new Promise(r => transCanvas.toBlob(r, 'image/png'));
        await tauri.fs.writeFile(transparentPngPath, new Uint8Array(await transBlob.arrayBuffer()));

        // Debug: log pngPaths content
        console.log(`[Metadata Overlay] pngPaths size: ${pngPaths.size}`);
        const pngPathKeys = Array.from(pngPaths.keys()).slice(0, 10);
        console.log(`[Metadata Overlay] First 10 pngPath keys:`, pngPathKeys);

        accumulatedTime = 0;
        let lastEndTime = 0;
        let concatLines = [];
        const safeTransPath = transparentPngPath.replace(/\\/g, '/').replace(/'/g, "'\\''");

        for (let segIdx = 0; segIdx < clipSegments.length; segIdx++) {
            const clipSeg = clipSegments[segIdx];
            const segmentMetadata = allMetadata.find(m => m.segmentIndex === segIdx);
            const clipStart = clipSeg.clipStart || 0;
            const clipEnd = clipSeg.clipEnd || (clipSeg.clipDuration || 60);
            const segmentDuration = clipEnd - clipStart;
            
            console.log(`[Metadata Overlay] Segment ${segIdx}: clipStart=${clipStart}, clipEnd=${clipEnd}, duration=${segmentDuration}`);
            console.log(`[Metadata Overlay] Segment ${segIdx}: hasMetadata=${!!segmentMetadata}, metadataCount=${segmentMetadata?.metadata?.length || 0}`);
            
            if (segmentMetadata && segmentMetadata.metadata && segmentMetadata.metadata.length > 0) {
                const metadata = segmentMetadata.metadata;
                console.log(`[Metadata Overlay] Segment ${segIdx}: metadata time range: ${metadata[0]?.time} to ${metadata[metadata.length-1]?.time}`);
                
                // Fixed 0.5 second update interval
                const updateInterval = 0.5;
                const numIntervals = Math.ceil(segmentDuration / updateInterval);
                console.log(`[Metadata Overlay] Segment ${segIdx}: numIntervals=${numIntervals}`);
                
                // Track last valid metadata for fallback when no match found
                let lastValidItem = metadata.find(m => m && m.data) || null;
                let matchCount = 0;
                
                // Debug: log some metadata samples to verify data variety
                const sampleIndices = [0, Math.floor(metadata.length/4), Math.floor(metadata.length/2), Math.floor(metadata.length*3/4), metadata.length-1];
                console.log(`[Metadata Overlay] Sample metadata items:`);
                for (const idx of sampleIndices) {
                    const item = metadata[idx];
                    if (item && item.data) {
                        const key = this.getMetadataStateKey(item.data);
                        console.log(`  [${idx}] time=${item.time?.toFixed(2)}, speed=${(item.data.vehicleSpeedMps*3.6).toFixed(1)}km/h, gear=${item.data.gearState}, key=${key}`);
                    }
                }
                
                for (let i = 0; i < numIntervals; i++) {
                    const intervalStart = clipStart + i * updateInterval;
                    const intervalEnd = Math.min(clipStart + (i + 1) * updateInterval, clipEnd);
                    const intervalDuration = intervalEnd - intervalStart;
                    
                    if (intervalDuration <= 0) continue;
                    
                    // Find the best metadata item for this interval
                    // Priority: latest item <= intervalStart, then closest, then last valid
                    let bestItem = null;
                    let closestItem = null;
                    let closestDist = Infinity;
                    for (const item of metadata) {
                        if (!item || !item.data) continue;
                        const dist = Math.abs(item.time - intervalStart);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestItem = item;
                        }
                        if (item.time <= intervalStart && (!bestItem || item.time > bestItem.time)) {
                            bestItem = item;
                        }
                    }
                    
                    const selectedItem = bestItem || closestItem || lastValidItem;
                    if (!selectedItem || !selectedItem.data) continue;
                    lastValidItem = selectedItem;
                    matchCount++;
                    
                    const relativeStart = accumulatedTime + (intervalStart - clipStart);
                    
                    // Fill gap before this interval if exists
                    if (relativeStart > lastEndTime + 0.001) {
                        concatLines.push(`file '${safeTransPath}'`);
                        concatLines.push(`duration ${(relativeStart - lastEndTime).toFixed(4)}`);
                    }

                    const key = this.getMetadataStateKey(selectedItem.data);
                    const pngPath = pngPaths.get(key);
                    
                    // Debug: log first 5, last 5, and any key changes
                    const isFirst5 = i < 5;
                    const isLast5 = i >= numIntervals - 5;
                    const prevKey = i > 0 ? this._lastLoggedKey : null;
                    const keyChanged = prevKey && key !== prevKey;
                    this._lastLoggedKey = key;
                    
                    if (isFirst5 || isLast5 || keyChanged) {
                        console.log(`[Metadata Overlay] Interval ${i}: time=${intervalStart.toFixed(2)}, selectedTime=${selectedItem.time?.toFixed(2)}, key=${key}, pngPath=${pngPath ? 'found' : 'NOT FOUND'}`);
                    }
                    
                    if (pngPath) {
                        // FFmpeg concat demuxer needs forward slashes even on Windows
                        const safePath = pngPath.replace(/\\/g, '/').replace(/'/g, "'\\''");
                        concatLines.push(`file '${safePath}'`);
                        concatLines.push(`duration ${intervalDuration.toFixed(4)}`);
                        lastEndTime = relativeStart + intervalDuration;
                    } else {
                        // PNG not found for this key, use transparent placeholder but still advance time
                        console.log(`[Metadata Overlay] PNG not found for key: ${key}, using transparent`);
                        concatLines.push(`file '${safeTransPath}'`);
                        concatLines.push(`duration ${intervalDuration.toFixed(4)}`);
                        lastEndTime = relativeStart + intervalDuration;
                    }
                }
                console.log(`[Metadata Overlay] Segment ${segIdx}: matched ${matchCount} intervals`);
            }
            // Use actual clipped duration, not full segment duration
            accumulatedTime += segmentDuration;
        }

        console.log(`[Metadata Overlay] Generated ${concatLines.length / 2} entries, lastEndTime: ${lastEndTime}, totalDuration: ${totalVideoDuration}`);
        console.log(`[Metadata Overlay] Concat file content (first 10 lines):`, concatLines.slice(0, 20).join('\n'));
        console.log(`[Metadata Overlay] Concat file content (last 10 lines):`, concatLines.slice(-20).join('\n'));

        // FFmpeg concat demuxer requires entries to cover the full duration
        if (lastEndTime < totalVideoDuration) {
            const remaining = totalVideoDuration - lastEndTime;
            if (remaining > 0.001) {
                console.log(`[Metadata Overlay] Filling remaining time: ${remaining.toFixed(4)}s`);
                concatLines.push(`file '${safeTransPath}'`);
                concatLines.push(`duration ${remaining.toFixed(4)}`);
            }
        }
        
        // Final line for concat demuxer bug - needs one last file entry without duration
        // for images to ensure the last duration is respected
        if (concatLines.length > 0) {
            concatLines.push(`file '${safeTransPath}'`);
        }

        await tauri.fs.writeFile(concatFilePath, new TextEncoder().encode(concatLines.join('\n')));

        // FFmpeg position (center bottom 97%)
        const xExpr = '(W-w)/2';
        const yExpr = '(H*0.97-h/2)';

        // Return the concat input and a SIMPLE overlay filter
        return {
            concatFile: concatFilePath,
            filter: `overlay=x=${xExpr}:y=${yExpr}`,
            inputIdx: videoInputCount // This will be the next input index
        };
    }
}

// ============================================================
// ASS Subtitle Generator for FFmpeg Metadata Overlay (Fallback)
// ============================================================
class AssSubtitleGenerator {
    constructor() {
        // ASS style constants
        this.styles = {
            // Style for metadata display at bottom center
            metadata: {
                name: 'Metadata',
                fontName: 'Microsoft YaHei',  // Will be overridden based on OS
                fontSize: 26,
                primaryColor: '&H00FFFFFF',   // White
                outlineColor: '&H00000000',   // Black outline
                backColor: '&H80000000',      // Semi-transparent black background
                bold: 1,
                outline: 2,
                shadow: 0,
                alignment: 2,  // Bottom center
                marginV: 25
            }
        };
        
        // Gear mapping
        this.gearMap = {
            'GEAR_PARK': 'P',
            'GEAR_DRIVE': 'D',
            'GEAR_REVERSE': 'R',
            'GEAR_NEUTRAL': 'N'
        };
        
        // Autopilot mapping
        this.autopilotMap = {
            'NONE': '',
            'SELF_DRIVING': 'FSD',
            'AUTOSTEER': 'AP',
            'TACC': 'TACC'
        };
        
        // ASS colors in BGR format (&HBBGGRR)
        this.colors = {
            white: '&H00FFFFFF',
            gray: '&H00808080',
            green: '&H001AC452',      // #52C41A
            red: '&H004F4DFF',         // #FF4D4F
            blue: '&H00FF9018',        // #1890FF
            orange: '&H0000A5FF',      // #FFA500
            dimGray: '&H00606060'
        };
    }
    
    /**
     * Get font name based on operating system
     */
    getFontName() {
        if (typeof navigator !== 'undefined') {
            if (navigator.userAgent.includes('Windows')) {
                return 'Microsoft YaHei';
            } else if (navigator.userAgent.includes('Mac')) {
                return 'Hiragino Sans GB';
            }
        }
        return 'Arial';
    }
    
    /**
     * Generate ASS header with styles
     * @param {number} width - Video width
     * @param {number} height - Video height
     * @returns {string} ASS header
     */
    generateHeader(width = 1920, height = 1080) {
        const fontName = this.getFontName();
        const style = this.styles.metadata;
        
        return `[Script Info]
Title: TeslaCam Metadata Overlay
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ${style.name},${fontName},${style.fontSize},${style.primaryColor},${style.primaryColor},${style.outlineColor},${style.backColor},${style.bold},0,0,0,100,100,0,0,3,${style.outline},${style.shadow},${style.alignment},10,10,${style.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    }
    
    /**
     * Format time for ASS (H:MM:SS.cc format)
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatAssTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const cs = Math.floor((seconds % 1) * 100);
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    }
    
    /**
     * Create colored text with ASS tags
     * @param {string} text - Text content
     * @param {string} color - ASS color
     * @returns {string} Colored text with ASS tags
     */
    colorText(text, color) {
        return `{\\c${color}}${text}{\\c${this.colors.white}}`;
    }
    
    /**
     * Format metadata to display text with colors (no ASS drawing, reliable text only)
     * @param {Object} data - Metadata object
     * @param {string} lang - Language code ('en' or 'zh')
     * @returns {string} Formatted display text with ASS color commands
     */
    formatMetadataText(data, lang = 'zh') {
        if (!data) return '';
        
        const parts = [];
        const c = this.colors;
        
        // Speed
        const speedKmh = Math.round((data.vehicleSpeedMps || 0) * 3.6);
        parts.push(`${speedKmh} km/h`);
        
        // Gear with color
        const gear = this.gearMap[data.gearState] || '--';
        let gearColor = c.white;
        if (gear === 'D') gearColor = c.green;
        else if (gear === 'R') gearColor = c.red;
        parts.push(this.colorText(`[${gear}]`, gearColor));
        
        // Blinkers using simple arrow symbols with colors
        // Left blinker: use colored arrow
        const leftArrow = data.blinkerOnLeft 
            ? this.colorText('◄', c.green)
            : this.colorText('◄', c.dimGray);
        // Right blinker
        const rightArrow = data.blinkerOnRight 
            ? this.colorText('►', c.green)
            : this.colorText('►', c.dimGray);
        parts.push(leftArrow);
        parts.push(rightArrow);
        
        // Autopilot (if active)
        const autopilot = this.autopilotMap[data.autopilotState] || '';
        if (autopilot && data.autopilotState !== 'NONE') {
            parts.push(this.colorText(`@${autopilot}`, c.blue));
        }
        
        // Accelerator with lightning symbol and percentage
        const accelPercent = Math.round(data.acceleratorPedalPosition || 0);
        if (accelPercent > 0) {
            parts.push(this.colorText(`↑${accelPercent}%`, c.green));
        } else {
            parts.push(this.colorText('↑', c.dimGray));
        }
        
        // Brake with symbol
        if (data.brakeApplied) {
            parts.push(this.colorText('●BRAKE', c.red));
        } else {
            parts.push(this.colorText('○', c.dimGray));
        }
        
        return parts.join('  ');
    }
    
    /**
     * Generate a single dialogue line for ASS
     * @param {number} startTime - Start time in seconds
     * @param {number} endTime - End time in seconds
     * @param {string} text - Text to display
     * @returns {string} ASS dialogue line
     */
    generateDialogue(startTime, endTime, text) {
        const start = this.formatAssTime(startTime);
        const end = this.formatAssTime(endTime);
        // Escape special ASS characters
        const escapedText = text.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
        return `Dialogue: 0,${start},${end},Metadata,,0,0,0,,${escapedText}`;
    }
    
    /**
     * Generate complete ASS subtitle file content from metadata
     * @param {Array} allMetadata - Array of segment metadata from loadMetadataForSegments
     * @param {Array} clipSegments - Array of clip segments with timing info
     * @param {string} lang - Language code
     * @param {number} width - Video width
     * @param {number} height - Video height
     * @returns {string} Complete ASS file content
     */
    generateAssContent(allMetadata, clipSegments, lang = 'zh', width = 1920, height = 1080) {
        let content = this.generateHeader(width, height);
        const dialogues = [];
        
        // Track accumulated time across segments
        let accumulatedTime = 0;
        
        for (let segIdx = 0; segIdx < clipSegments.length; segIdx++) {
            const clipSeg = clipSegments[segIdx];
            const segmentMetadata = allMetadata.find(m => m.segmentIndex === segIdx);
            
            if (!segmentMetadata || !segmentMetadata.metadata || segmentMetadata.metadata.length === 0) {
                accumulatedTime += clipSeg.clipDuration;
                continue;
            }
            
            const metadata = segmentMetadata.metadata;
            const clipStart = clipSeg.clipStart;
            const clipEnd = clipSeg.clipEnd;
            
            // Filter metadata within clip range and generate dialogues
            for (let i = 0; i < metadata.length; i++) {
                const item = metadata[i];
                const itemTime = item.time;
                
                // Skip if outside clip range
                if (itemTime < clipStart || itemTime > clipEnd) continue;
                
                // Calculate relative time in output video
                const relativeStart = accumulatedTime + (itemTime - clipStart);
                
                // Find end time (next metadata item or segment end)
                let relativeEnd;
                if (i + 1 < metadata.length && metadata[i + 1].time <= clipEnd) {
                    relativeEnd = accumulatedTime + (metadata[i + 1].time - clipStart);
                } else {
                    relativeEnd = accumulatedTime + (clipEnd - clipStart);
                }
                
                // Ensure minimum duration of 0.1s
                if (relativeEnd - relativeStart < 0.1) {
                    relativeEnd = relativeStart + 0.1;
                }
                
                const text = this.formatMetadataText(item.data, lang);
                if (text) {
                    dialogues.push(this.generateDialogue(relativeStart, relativeEnd, text));
                }
            }
            
            accumulatedTime += clipSeg.clipDuration;
        }
        
        content += dialogues.join('\n');
        return content;
    }
    
    /**
     * Generate ASS file for single camera export
     * @param {Array} allMetadata - Metadata array
     * @param {Array} clipSegments - Clip segments
     * @param {string} lang - Language
     * @returns {string} ASS content
     */
    generateForSingleCamera(allMetadata, clipSegments, lang = 'zh') {
        return this.generateAssContent(allMetadata, clipSegments, lang, 1920, 1080);
    }
    
    /**
     * Generate ASS file for grid video export
     * @param {Array} allMetadata - Metadata array
     * @param {Array} clipSegments - Clip segments
     * @param {number} cameraCount - Number of cameras in grid
     * @param {string} lang - Language
     * @returns {string} ASS content
     */
    generateForGrid(allMetadata, clipSegments, cameraCount, lang = 'zh') {
        // Calculate grid dimensions
        let width, height;
        if (cameraCount <= 2) {
            width = 1920;
            height = 540;
        } else if (cameraCount <= 4) {
            width = 1920;
            height = 1080;
        } else {
            width = 2880;
            height = 1080;
        }
        
        return this.generateAssContent(allMetadata, clipSegments, lang, width, height);
    }
}

// Global instance for ASS generation
// Global instances for metadata overlay generation
const assSubtitleGenerator = new AssSubtitleGenerator();
const metadataOverlayGenerator = new MetadataOverlayGenerator();

class MetadataManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.protoRoot = null;
        this.SeiMetadata = null;
        this.currentMetadata = []; // Array of metadata objects for the current segment
        this.isLoading = false;
        this.detailModalOpen = false;
        this.lastDetailData = null;
        
        this.dom = {
            panel: document.getElementById('metadataPanel'),
            switchBtn: document.getElementById('metaSwitchBtn'),
            detailBtn: document.getElementById('metaDetailBtn'),
            statsOverlay: document.getElementById('metaDetailOverlay'),
            statsResize: document.getElementById('statsResizeHandle'),
            playerArea: document.getElementById('playerArea'),
            closeStatsBtn: document.getElementById('closeStatsBtn'),
            statsFold: document.getElementById('foldStatsBtn'),
            statsTitle: document.getElementById('statsTitle'),
            loading: document.getElementById('metadataLoading'),
            empty: document.getElementById('metadataEmpty'),
            emptyPlace: document.getElementById('metadataEmptyPlace'),
            items: document.getElementById('metadataItems'),
            values: {
                speed: document.getElementById('metaSpeed'),
                gear: document.getElementById('metaGear'),
                steering: document.getElementById('metaSteering'),
                steeringIcon: document.getElementById('metaSteeringIcon'),
                steeringContainer: document.getElementById('metaSteeringContainer'),
                blinkerLeft: document.getElementById('metaBlinkerLeft'),
                blinkerRight: document.getElementById('metaBlinkerRight'),
                brakeIcon: document.getElementById('metaBrakeIcon'),
                brakeActiveGroup: document.querySelector('#metaBrakeIcon .brake-active'),
                brakeInactiveGroup: document.querySelector('#metaBrakeIcon .brake-inactive'),
                acceleratorIcon: document.getElementById('metaAcceleratorIcon'),
                accelFillRect: document.getElementById('accelFillRect'),
                autopilot: document.getElementById('metaAutopilot'),
                gps: document.getElementById('metaGPS'),
                heading: document.getElementById('metaHeading'),
                acceleration: document.getElementById('metaAcceleration')
            },
            stats: {
                speed: document.getElementById('statsSpeed'),
                gear: document.getElementById('statsGear'),
                steering: document.getElementById('statsSteering'),
                accelerator: document.getElementById('statsAccelerator'),
                brake: document.getElementById('statsBrake'),
                blinker: document.getElementById('statsBlinker'),
                autopilot: document.getElementById('statsAutopilot'),
                gps: document.getElementById('statsGPS'),
                heading: document.getElementById('statsHeading'),
                accel: document.getElementById('statsAccel')
            }
        };
        
        this.initializeProtobuf();
        this.bindEvents();
    }
    
    async initializeProtobuf() {
        try {
            if (typeof protobuf === 'undefined') {
                console.warn("[MetadataManager] protobuf.js not loaded yet, retrying in 1s");
                setTimeout(() => this.initializeProtobuf(), 1000);
                return;
            }
            this.protoRoot = await protobuf.load("dashcam.proto");
            this.SeiMetadata = this.protoRoot.lookupType("SeiMetadata");
            console.log("[MetadataManager] Protobuf initialized");
        } catch (err) {
            console.error("[MetadataManager] Failed to load protobuf:", err);
        }
    }
    
    bindEvents() {
        // Toggle from header button
        if (this.dom.switchBtn) {
            this.dom.switchBtn.addEventListener('click', () => {
                // From now on the button owns the state: the auto-expand in `updateUIStatus`
                // must not put the card back after the user hid it.
                this.userPinned = true;
                const isCollapsed = this.dom.panel.classList.contains('collapsed');
                this.setCollapsed(!isCollapsed);
            });
        }

        // Stats overlay button click (toggle)
        if (this.dom.detailBtn) {
            this.dom.detailBtn.addEventListener('click', () => {
                this.toggleStatsOverlay();
            });
        }

        // Close stats overlay
        if (this.dom.closeStatsBtn) {
            this.dom.closeStatsBtn.addEventListener('click', () => {
                this.hideStatsOverlay();
            });
        }

        // Fold the plate down to its title bar (touch layouts show the control).
        if (this.dom.statsFold) {
            this.dom.statsFold.addEventListener('click', () => this.toggleStatsPlateFold());
        }

        // Stats overlay draggable logic
        this.initStatsOverlayDrag();
        this.initStatsOverlayResize();

        // Draggable logic
        let isDragging = false;
        let offsetX, offsetY;

        this.dom.panel.addEventListener('mousedown', (e) => {
            // Only drag if left click
            if (e.button !== 0) return;
            if (this.dom.panel.classList.contains('collapsed')) return;
            // On a phone the strip is docked to the bottom edge, so dragging it would only
            // detach it from the reserve the feeds are padded by. Android synthesises
            // mousedown from a tap, which is why this needs an explicit gate.
            if (isPhoneLayout()) return;

            isDragging = true;
            this.dom.panel.classList.add('dragging');
            
            // Get the container's bounding box to calculate relative coordinates
            const parentRect = this.dom.panel.parentElement.getBoundingClientRect();
            const rect = this.dom.panel.getBoundingClientRect();
            
            // Calculate the offset of the mouse relative to the panel's top-left corner
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // Add global mouse listeners
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            e.preventDefault();
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const parentRect = this.dom.panel.parentElement.getBoundingClientRect();
            
            // Calculate new position relative to the parent container
            let newLeft = e.clientX - parentRect.left - offsetX;
            let newTop = e.clientY - parentRect.top - offsetY;

            // Boundary checks
            const panelRect = this.dom.panel.getBoundingClientRect();
            newLeft = Math.max(0, Math.min(newLeft, parentRect.width - panelRect.width));
            newTop = Math.max(0, Math.min(newTop, parentRect.height - panelRect.height));

            this.dom.panel.style.left = `${newLeft}px`;
            this.dom.panel.style.top = `${newTop}px`;
            this.dom.panel.classList.add('is-moved');
            this.dom.panel.style.transform = 'none'; 
            this.dom.panel.style.margin = '0';
        };

        const onMouseUp = () => {
            isDragging = false;
            this.dom.panel.classList.remove('dragging');
            this.dom.panel.style.transform = ''; // Allow CSS to handle scale/transitions
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Convert to percentages for responsiveness
            const parentRect = this.dom.panel.parentElement.getBoundingClientRect();
            const panelRect = this.dom.panel.getBoundingClientRect();
            
            if (parentRect.width > 0 && parentRect.height > 0) {
                const leftPct = ((panelRect.left - parentRect.left) / parentRect.width) * 100;
                const topPct = ((panelRect.top - parentRect.top) / parentRect.height) * 100;
                
                this.dom.panel.style.left = `${leftPct}%`;
                this.dom.panel.style.top = `${topPct}%`;
            }
        };

        // Handle window resize to keep panel in bounds
        window.addEventListener('resize', () => {
            if (this.dom.panel.style.left && this.dom.panel.style.left.includes('%')) {
                this.ensureInBounds();
            }
        });
    }

    ensureInBounds() {
        const parentRect = this.dom.panel.parentElement.getBoundingClientRect();
        const panelRect = this.dom.panel.getBoundingClientRect();
        
        if (panelRect.right > parentRect.right) {
            const newLeft = Math.max(0, parentRect.width - panelRect.width);
            this.dom.panel.style.left = `${(newLeft / parentRect.width) * 100}%`;
        }
        if (panelRect.bottom > parentRect.bottom) {
            const newTop = Math.max(0, parentRect.height - panelRect.height);
            this.dom.panel.style.top = `${(newTop / parentRect.height) * 100}%`;
        }
    }

    setCollapsed(collapsed) {
        if (collapsed) {
            this.dom.panel.classList.add('collapsed');
            if (this.dom.switchBtn) this.dom.switchBtn.classList.remove('active');
        } else {
            this.dom.panel.classList.remove('collapsed');
            if (this.dom.switchBtn) this.dom.switchBtn.classList.add('active');
        }
    }
    
    async loadMetadata(file) {
        if (!this.SeiMetadata) {
            console.warn("[MetadataManager] Protobuf not ready, skipping metadata load");
            return;
        }
        
        this.isLoading = true;
        this.updateUIStatus();
        this.currentMetadata = [];
        
        try {
            let buffer;
            if (file instanceof File) {
                buffer = await file.arrayBuffer();
            } else if (file instanceof TauriFile) {
                buffer = await file.arrayBuffer();
            } else if (file && file.path) {
                // If it's a file-like object but not instance of File/TauriFile
                const response = await fetch(getFileUrl(file));
                buffer = await response.arrayBuffer();
            } else {
                console.warn("[MetadataManager] Unknown file type for metadata loading");
                return;
            }

            const parser = new DashcamMP4(buffer);
            const rawMetadata = parser.parseMetadata();
            
            this.currentMetadata = rawMetadata.map(item => {
                try {
                    const decoded = this.SeiMetadata.decode(item.data);
                    return {
                        time: item.time,
                        data: this.SeiMetadata.toObject(decoded, { enums: String, longs: String })
                    };
                } catch (e) {
                    console.warn("[MetadataManager] Failed to decode SEI item:", e);
                    return null;
                }
            }).filter(Boolean);
            
            console.log(`[MetadataManager] Loaded ${this.currentMetadata.length} metadata points`);
            
            // Auto expand panel if metadata is loaded. A phone clip with no SEI telemetry still
            // has its `event.json` location, which is what the card falls back to there.
            if ((this.currentMetadata.length > 0 || this.eventPlace()) && this.dom.panel.classList.contains('collapsed')) {
                this.setCollapsed(false);
            }
        } catch (err) {

            console.error("[MetadataManager] Error parsing metadata:", err);
            this.currentMetadata = [];
        } finally {
            this.isLoading = false;
            this.updateUIStatus();
        }
    }

    /**
     * Where the current clip was taken, from the `event.json` Tesla writes next to the videos.
     * Phones only: the desktop card has always read 「无元数据」 for a clip without SEI and that
     * is the behaviour its layout was tuned around.
     */
    eventPlace() {
        if (!isAndroidRuntime()) return '';
        const ev = this.viewer?.currentEvent;
        if (!ev) return '';
        return ev.street ? `${ev.city} · ${ev.street}` : (ev.city || '');
    }
    
    updateUIStatus() {
        if (!this.dom.loading) return;
        const hasSei = !this.isLoading && this.currentMetadata.length > 0;
        this.dom.loading.style.display = this.isLoading ? 'block' : 'none';
        this.dom.empty.style.display = (!this.isLoading && this.currentMetadata.length === 0) ? 'block' : 'none';
        this.dom.items.style.display = hasSei ? 'flex' : 'none';
        if (this.dom.emptyPlace) this.dom.emptyPlace.textContent = hasSei ? '' : this.eventPlace();
        // The landscape grid puts this card on top of a feed, so it only earns that when it has
        // a reading or a location to show.
        const showsSomething = hasSei || !!this.dom.emptyPlace?.textContent;
        this.dom.panel.classList.toggle('has-data', showsSomething);
        if (showsSomething && !this.userPinned && this.dom.panel.classList.contains('collapsed')) {
            this.setCollapsed(false);
        }
    }
    
    updateDisplay(currentTime) {
        if (this.currentMetadata.length === 0) return;
        
        const lang = this.viewer.currentLanguage;
        
        // Find the metadata item closest to current playback time
        let bestMatch = this.currentMetadata[0];
        for (let i = 0; i < this.currentMetadata.length; i++) {
            if (this.currentMetadata[i].time <= currentTime) {
                bestMatch = this.currentMetadata[i];
            } else {
                break;
            }
        }
        
        if (!bestMatch || !bestMatch.data) return;
        
        const d = bestMatch.data;
        const v = this.dom.values;
        
        // Update speed (just the number, unit is separate)
        const speedKmh = (d.vehicleSpeedMps || 0) * 3.6;
        const speedDisplay = Math.round(speedKmh);
        v.speed.textContent = speedDisplay === 0 ? '0' : speedDisplay;
        
        // Update gear (single letter: P, D, R, N)
        const gearLetterMap = {
            'GEAR_PARK': 'P',
            'GEAR_DRIVE': 'D',
            'GEAR_REVERSE': 'R',
            'GEAR_NEUTRAL': 'N'
        };
        v.gear.textContent = gearLetterMap[d.gearState] || '--';
        
        // Update steering wheel angle and rotation
        const steeringAngle = d.steeringWheelAngle || 0;
        v.steering.textContent = `${steeringAngle.toFixed(0)}°`;
        // Rotate the steering wheel icon - allow full rotation (can exceed 360°)
        v.steeringIcon.style.transform = `rotate(${steeringAngle}deg)`;
        
        // Update steering wheel color based on autopilot state
        v.steeringIcon.classList.remove('autopilot-active', 'autopilot-self-driving');
        if (d.autopilotState === 'SELF_DRIVING') {
            v.steeringIcon.classList.add('autopilot-self-driving');
        } else if (d.autopilotState === 'AUTOSTEER' || d.autopilotState === 'TACC') {
            v.steeringIcon.classList.add('autopilot-active');
        }
        
        // Update accelerator pedal - fill height based on pedal position (grows from bottom)
        const accelPercent = d.acceleratorPedalPosition || 0;
        if (v.accelFillRect) {
            const maxHeight = 20; // max fill height
            const fillHeight = (accelPercent / 100) * maxHeight;
            const yPos = 26 - fillHeight; // start from bottom (y=26) and grow upward
            v.accelFillRect.setAttribute('y', yPos);
            v.accelFillRect.setAttribute('height', fillHeight);
            v.accelFillRect.setAttribute('opacity', accelPercent > 0 ? 0.9 : 0);
        }
        v.acceleratorIcon.classList.toggle('active', accelPercent > 5);
        
        // Update brake - use CSS class to toggle active state
        const brakeApplied = d.brakeApplied || false;
        v.brakeIcon.classList.toggle('active', brakeApplied);
        
        // Update blinkers
        v.blinkerLeft.classList.toggle('active', d.blinkerOnLeft || false);
        v.blinkerRight.classList.toggle('active', d.blinkerOnRight || false);
        
        // Update autopilot
        const apMap = {
            'NONE': 'autopilotNone',
            'SELF_DRIVING': 'autopilotSelfDriving',
            'AUTOSTEER': 'autopilotAutosteer',
            'TACC': 'autopilotTACC'
        };
        v.autopilot.textContent = i18n[lang][apMap[d.autopilotState] || d.autopilotState] || d.autopilotState || '--';
        v.autopilot.style.color = d.autopilotState !== 'NONE' ? '#1890ff' : '';
        
        // Update GPS
        v.gps.textContent = (typeof d.latitudeDeg === 'number' && typeof d.longitudeDeg === 'number') 
            ? `${d.latitudeDeg.toFixed(6)}, ${d.longitudeDeg.toFixed(6)}` 
            : '--';
        
        // Update Heading
        v.heading.textContent = (typeof d.headingDeg === 'number') ? `${d.headingDeg.toFixed(0)}°` : '--';
        
        // Update Acceleration
        v.acceleration.textContent = (typeof d.linearAccelerationMps2X === 'number' && 
                                     typeof d.linearAccelerationMps2Y === 'number' && 
                                     typeof d.linearAccelerationMps2Z === 'number') 
            ? `X:${d.linearAccelerationMps2X.toFixed(2)} Y:${d.linearAccelerationMps2Y.toFixed(2)} Z:${d.linearAccelerationMps2Z.toFixed(2)}` 
            : '--';

        // Store for detail modal
        this.lastDetailData = d;
        
        // Update stats overlay if open
        if (this.detailModalOpen) {
            this.updateStatsDisplay(d);
        }
    }
    
    toggleStatsOverlay() {
        if (this.detailModalOpen) {
            this.hideStatsOverlay();
        } else {
            this.showStatsOverlay();
        }
    }
    
    showStatsOverlay() {
        if (!this.dom.statsOverlay) return;
        this.dom.statsOverlay.classList.add('show');
        this.detailModalOpen = true;
        
        // Update title based on language
        const lang = this.viewer.currentLanguage;
        if (this.dom.statsTitle) {
            this.dom.statsTitle.textContent = i18n[lang].driveStats;
        }
        
        // Update with latest data
        if (this.lastDetailData) {
            this.updateStatsDisplay(this.lastDetailData);
        }

        this.applyStatsPlateSize();
        this.fitStatsPlateContent();
        this.placeStatsOverlay();
        // On a phone the band the plate fits into moves when the device rotates, when the grid
        // changes shape, and when the telemetry makes a row wrap — all of which happen with the
        // plate already open, so this watches rather than measures once.
        if (typeof ResizeObserver !== 'undefined' && this.dom.playerArea) {
            this.statsOverlayObserver?.disconnect();
            // The plate is one of the observed boxes and the fit rewrites that box's height, so a
            // synchronous callback is the textbook self-observing loop: the browser spends the rest of
            // the frame delivering notifications it can never finish and reports a loop error. Hand the
            // work to the next frame and coalesce, which is also fewer relayouts during a resize.
            this.statsOverlayObserver = new ResizeObserver(() => {
                if (this.statsPlateObserveFrame) return;
                this.statsPlateObserveFrame = requestAnimationFrame(() => {
                    this.statsPlateObserveFrame = 0;
                    this.fitStatsPlateContent();
                    this.placeStatsOverlay();
                });
            });
            this.statsOverlayObserver.observe(this.dom.playerArea);
            this.statsOverlayObserver.observe(this.dom.statsOverlay);
            // Switching grid keeps `playerArea` exactly the same size and only reshapes its
            // children, so the container alone never fires and the plate stays where the previous
            // layout put it — which can be in the middle of the new one.
            this.dom.playerArea.querySelectorAll('video').forEach(v => this.statsOverlayObserver.observe(v));
        }
    }

    /**
     * `--safe-top` is a raw `max(0px, 28.2px)` expression, so `parseFloat` on it is NaN — which
     * read as "no status bar" and let the plate tuck itself under the clock. Ask layout instead.
     */
    measureSafeTop() {
        if (!this.safeTopProbe) {
            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;top:0;left:0;height:var(--safe-top);'
                + 'visibility:hidden;pointer-events:none';
            document.body.appendChild(probe);
            this.safeTopProbe = probe;
        }
        return this.safeTopProbe.offsetHeight;
    }

    /**
     * The plate is ten numbers, which folded into two columns makes a short chip, and on a phone
     * the grid leaves a black band either above or below the picture — sideways it often does not,
     * so the fallback scores candidate heights against the actual pixels. CSS cannot know where the
     * picture ends, so this does. A plate the user has dragged keeps its spot: the drag is the only
     * other writer of an inline `left`.
     */
    placeStatsOverlay() {
        const el = this.dom.statsOverlay;
        if (!el || !el.classList.contains('show')) return;
        if (el.style.left) {
            // A dragged plate keeps its spot — unless a rotation put that spot off the new screen,
            // in which case the drag is what has to be forgotten.
            const r = el.getBoundingClientRect();
            if (r.right < 8 || r.bottom < 8 || r.left > innerWidth - 8 || r.top > innerHeight - 8) {
                el.style.left = '';
                el.style.right = '';
                this.forgetStatsPlatePosition();
            } else {
                return;
            }
        }
        // Growing the plate under a finger moves its bottom edge, which is the very thing this
        // function watches; repositioning mid-drag would slide it out from under the grip.
        if (this.statsPlateResizing) return;
        if (!isPhoneLayout()) {
            el.style.top = '';
            return;
        }
        const area = this.dom.playerArea.getBoundingClientRect();
        const feeds = [...this.dom.playerArea.querySelectorAll('video')]
            .map(v => ({ box: v.getBoundingClientRect(), video: v }))
            .filter(f => f.box.width > 0);
        if (!area.height || !feeds.length) return;
        const artBottom = Math.max(...feeds.map(f => f.box.bottom));
        const chrome = document.querySelector('.video-controls-overlay')?.getBoundingClientRect();
        const floor = chrome && chrome.top > artBottom ? chrome.top : area.bottom;
        const ceil = this.measureSafeTop() + 4;
        const gap = 6;
        const height = el.offsetHeight;
        if (floor - artBottom >= height + gap) {
            el.style.top = `${Math.round(artBottom + gap)}px`;
            return;
        }        // Sideways there is usually no band: a four-view row of 16:9 cells is 109px of a 412px
        // viewport with the controls directly under it. But the *picture* is narrower than the
        // cell (`object-fit: contain` letterboxes it), so a spot clear of pixels often does
        // exist — find it instead of guessing the top corner.
        const arts = feeds.map(({ box, video }) => {
            if (!video.videoWidth) return box;
            const s = Math.min(box.width / video.videoWidth, box.height / video.videoHeight);
            const w = video.videoWidth * s, h = video.videoHeight * s;
            return { left: box.x + (box.width - w) / 2, right: box.x + (box.width + w) / 2,
                top: box.y + (box.height - h) / 2, bottom: box.y + (box.height + h) / 2 };
        });
        const spot = el.getBoundingClientRect();
        const lo = ceil, hi = Math.max(lo, Math.round(floor - height));
        // The 行车数据 HUD is on screen at the same time now, and in portrait it is a full-width
        // strip just under the picture — the one band a top-anchored plate would otherwise pick.
        const hud = this.dom.panel && !this.dom.panel.classList.contains('collapsed')
            ? this.dom.panel.getBoundingClientRect() : null;
        const overlapArea = (a, b) => {
            const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            return w > 0 && h > 0 ? w * h : 0;
        };
        const hitArea = (top) => {
            const shifted = { left: spot.left, right: spot.right, top, bottom: top + height };
            let total = arts.reduce((s, a) => s + overlapArea(shifted, a), 0);
            if (hud) total += overlapArea(shifted, hud);
            return total;
        };
        // `lo` first so that on a tie the plate stays where it always did — the top of the screen.
        // The gap-less pair is what makes a slot barely taller than the chip still usable.
        const candidates = [lo, hi,
            ...arts.flatMap(a => [a.top - height - gap, a.bottom + gap, a.top - height, a.bottom])];
        let best = lo, bestHits = Infinity;
        candidates.forEach(t => {
            const top = Math.min(hi, Math.max(lo, Math.round(t)));
            const hits = hitArea(top);
            if (hits < bestHits) { bestHits = hits; best = top; }
        });
        el.style.top = `${best}px`;
    }

    hideStatsOverlay() {
        if (!this.dom.statsOverlay) return;
        this.dom.statsOverlay.classList.remove('show');
        this.detailModalOpen = false;
        this.statsOverlayObserver?.disconnect();
        this.statsOverlayObserver = null;
        clearTimeout(this.statsFitTimer);
        this.statsFitTimer = null;
        if (this.statsFitFrame) {
            cancelAnimationFrame(this.statsFitFrame);
            this.statsFitFrame = 0;
        }
    }

    /**
     * Android reads a swipe that starts inside its back-gesture band (about 24dp from the edge) as
     * system back, which finishes the activity. The plate's resize grip lives at its bottom-right
     * corner, so a plate parked flush right turns "shrink the card" into "close the app" — tested
     * and it does. Phones therefore keep that band free for the grip; desktop has no such gesture.
     */
    statsPlateEdgeGuard() {
        return isPhoneLayout() ? 28 : 12;
    }

    statsPlateLeftLimit(width) {
        return Math.max(0, innerWidth - width - this.statsPlateEdgeGuard());
    }

    /** The widest a dragged (left-anchored) plate may get. A CSS-anchored one cannot reach the edge. */
    statsPlateWidthLimit(el) {
        const left = parseFloat(el.style.left);
        return Number.isFinite(left)
            ? Math.max(96, innerWidth - this.statsPlateEdgeGuard() - left)
            : innerWidth - 12;
    }

    /**
     * The plate the user left behind: its size always comes back, and its corner only if that
     * corner still exists — a rotation makes the previous spot land under the floating bar or off
     * the short edge, and a plate that cannot be seen is worse than one that auto-places.
     */
    applyStatsPlateSize() {
        const el = this.dom.statsOverlay;
        if (!el) return;
        // The element is reused across open/close, so a scroll from last time is still there —
        // and it shifts every child, including the grip, away from the corner it is pinned to.
        const content = el.querySelector('.stats-content');
        if (content) content.scrollTop = 0;
        const saved = this.statsPlateGeom || this.readStatsPlateGeom();
        if (!saved) {
            el.classList.remove('resized');
            el.classList.remove('folded');
            el.style.width = '';
            el.style.height = '';
            // The plate is one reused element: a type size left over from a box the user has since
            // forgotten would keep an auto-sized card rendering small.
            if (content) content.style.removeProperty('--stats-font');
            this.updateStatsFoldLabel(false);
            return;
        }
        // A record can carry only a fold — nobody ever sized the card, they just put it away — and a
        // folded chip is too short to count as a size, so the table comes back at its own width.
        if (saved.width >= 40 && saved.height >= 32) {
            el.classList.add('resized');
            el.style.width = `${saved.width}px`;
            el.style.height = `${saved.height}px`;
            el.style.setProperty('--stats-cols', String(this.statsPlateCols(saved.width)));
        }
        // A chip dragged into a corner carries its position but not its size: the height in that
        // record is the title bar's, and giving it to the table leaves a card one row high.
        if (saved.left !== undefined && saved.top !== undefined) {
            const w = saved.width || el.offsetWidth;
            const h = saved.height || el.offsetHeight;
            const fits = saved.left >= 0 && saved.top >= 0
                && saved.left + w <= innerWidth - this.statsPlateEdgeGuard()
                && saved.top + h <= innerHeight - 8;
            if (fits) {
                el.style.left = `${saved.left}px`;
                el.style.top = `${saved.top}px`;
                el.style.right = 'auto';
            }
        }
        this.setStatsPlateFold(!!saved.folded);
    }

    /**
     * Folded is the plate down to its title bar. It exists for landscape, where a six- or four-view
     * grid leaves no black band for a ten-row table and the only way to stop covering the picture is
     * to stop being a table until somebody taps it again.
     */
    setStatsPlateFold(folded) {
        const el = this.dom.statsOverlay;
        if (!el) return;
        el.classList.toggle('folded', folded);
        this.updateStatsFoldLabel(folded);
        this.statsPlateGeom = Object.assign({}, this.statsPlateGeom || {}, { folded: folded ? 1 : 0 });
    }

    /** The chip's own aria state, also set for a plate nobody has ever sized — the ⋮-less default. */
    updateStatsFoldLabel(folded) {
        const btn = this.dom.statsFold;
        if (!btn) return;
        // The language lives on the viewer, not here: reading `this.currentLanguage` in this class
        // yields undefined, and the throw stopped `showStatsOverlay` before it ever placed the card.
        const lang = this.viewer?.currentLanguage || 'en';
        const label = i18n[lang][folded ? 'statsExpand' : 'statsFold'];
        btn.textContent = folded ? '▸' : '▾';
        btn.title = label;
        btn.setAttribute('aria-label', label);
        btn.setAttribute('aria-expanded', String(!folded));
    }

    toggleStatsPlateFold() {
        const el = this.dom.statsOverlay;
        if (!el) return;
        const folded = !el.classList.contains('folded');
        this.setStatsPlateFold(folded);
        // Expanding at a corner the user parked near the bottom of a short landscape viewport puts
        // the new table off-screen; keep its column, pull its height back in.
        if (!folded && el.style.left) {
            const box = el.getBoundingClientRect();
            const room = innerHeight - 8;
            if (box.bottom > room) {
                const top = Math.max(this.measureSafeTop() + 4, Math.round(room - box.height));
                el.style.top = `${top}px`;
                if (this.statsPlateGeom) this.statsPlateGeom.top = top;
            }
        }
        try {
            localStorage.setItem(STATS_PLATE_KEY, JSON.stringify(this.statsPlateGeom));
        } catch (e) { /* full or blocked */ }
        // A chip is a third of the height, so the band it fits into is not the one the table chose.
        this.placeStatsOverlay();
    }

    /** One column is readable down to about 96px, three stop being worth it past a wide box. */
    statsPlateCols(width) {
        return width < 150 ? 1 : width < 330 ? 2 : 3;
    }

    /**
     * A plate the user shrinks used to fold its rows behind a scroll, which hid exactly the numbers
     * the card was opened to read. So the box drives three knobs it has: the column count first,
     * because more columns is the only way a short plate gets fewer rows and it costs nothing in
     * legibility; the type size second, down to a floor still readable at arm's length; and the gaps
     * third, since every gap in the card is in `em` and one dense tier buys back both a column and a
     * row without touching the type. Only when the screen itself is smaller than the table may the
     * plate scroll: a box the user dragged is otherwise grown to its content, because a plate that
     * shows half its values is not a small plate, it is a broken one.
     */
    fitStatsPlateContent() {
        this.fitStatsPlateContentOnce(false);
    }

    fitStatsPlateContentOnce(grew) {
        const el = this.dom.statsOverlay;
        const content = el && el.querySelector('.stats-content');
        if (!content) return;
        if (!el.classList.contains('show') || !isPhoneLayout()) {
            content.style.removeProperty('--stats-font');
            el.classList.remove('stats-dense');
            return;
        }
        // Only a box the user sized is a constraint. An auto plate grows to hold its rows, so
        // fitting it would be measuring a result and feeding it back as an input: the widened grid
        // makes the plate wider, which asks for yet another column, and the box never settles.
        if (!el.classList.contains('resized')) return;
        const base = Math.round((parseFloat(getComputedStyle(el).fontSize) || 10) * 10) / 10;
        const floor = Math.max(8, Math.round(base * 0.72 * 10) / 10);
        // A value one digit longer than the one measured (GPS gains decimals as the car moves) must
        // not push a number past the clipped edge, so the width test keeps the same slack the
        // column-gap already spends.
        let lastFeasible = 0;
        for (const dense of [false, true]) {
            el.classList.toggle('stats-dense', dense);
            // The dense tier changes the padding too, so the box is measured again per tier instead
            // of once for the whole search.
            const availW = content.clientWidth;
            // A box dragged shorter than its own title bar leaves the content with no height at all.
            // That is not a measurement to bail on, it is the worst case the growth path exists for.
            if (!availW) return;
            const availH = content.clientHeight;
            const widthLimit = availW + 2;
            const from = this.statsPlateCols(el.getBoundingClientRect().width);
            for (let font = base; ; font = Math.round((font - 0.5) * 10) / 10) {
                content.style.setProperty('--stats-font', `${font}px`);
                let feasible = 0;
                for (let cols = from; cols <= 3; cols++) {
                    el.style.setProperty('--stats-cols', String(cols));
                    if (content.scrollWidth > widthLimit) break;
                    feasible = cols;
                    if (content.scrollHeight <= availH) return;
                }
                lastFeasible = feasible || lastFeasible;
                if (font <= floor) break;
            }
        }
        // Mid-drag the finger owns the box: growing it under the touch would snap the bottom edge
        // past the grip and the next move would shrink it again. The settle happens on release.
        if (grew || this.statsPlateResizing) {
            el.style.setProperty('--stats-cols', String(lastFeasible || this.statsPlateCols(el.getBoundingClientRect().width)));
            return;
        }
        // Nothing the box can do fits it, so the box itself moves. Grow to what the dense table needs
        // at the smallest type, capped by the room below it, and re-run the search with that much
        // height — which usually lets it come back up out of the dense tier.
        const rect = el.getBoundingClientRect();
        const chrome = el.offsetHeight - content.clientHeight;
        content.style.setProperty('--stats-font', `${floor}px`);
        // Measure the tall-and-narrow table the box can actually hold, not whatever column count the
        // search last left set — three columns in a 96px box reads as a short table that overflows.
        el.style.setProperty('--stats-cols', String(lastFeasible || this.statsPlateCols(rect.width)));
        const needed = Math.round(content.scrollHeight + chrome);
        const room = Math.max(34, Math.round(innerHeight - rect.top - 10));
        el.style.height = `${Math.min(needed, room)}px`;
        this.fitStatsPlateContentOnce(true);
    }

    /** Telemetry rewrites the values about ten times a second; re-measure twice a second, not ten. */
    scheduleStatsFit() {
        if (this.statsFitTimer) return;
        this.statsFitTimer = setTimeout(() => {
            this.statsFitTimer = null;
            this.fitStatsPlateContent();
        }, 500);
    }

    readStatsPlateGeom() {
        try {
            const raw = JSON.parse(localStorage.getItem(STATS_PLATE_KEY) || 'null');
            if (!raw) return null;
            // A folded chip is smaller than the 32px a table needs, and it is still a plate the user
            // left behind — dropping the record because its height is a title bar forgot the fold.
            const sized = raw.width >= 40 && raw.height >= 32;
            if (!sized && !raw.folded) return null;
            this.statsPlateGeom = raw;
            return raw;
        } catch (e) {
            return null;
        }
    }

    saveStatsPlateGeom(patch) {
        const el = this.dom.statsOverlay;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const next = Object.assign({}, this.statsPlateGeom || {}, patch,
            // Folded, the box is a title bar. Measuring it would write ~34px as the table's height
            // and the next expand would inherit a card with one row in it.
            el.classList.contains('folded')
                ? {}
                : { width: Math.round(rect.width), height: Math.round(rect.height) });
        if (next.left === undefined) delete next.top;
        this.statsPlateGeom = next;
        try {
            localStorage.setItem(STATS_PLATE_KEY, JSON.stringify(next));
        } catch (e) { /* full or blocked */ }
    }

    /**
     * Corner drag = the plate's new width and height. The column count follows the width, so one
     * gesture turns the chip into a single readable column or a wide table, which is the only way
     * the same plate can serve a 412px-tall landscape screen and a 915px portrait one.
     */
    initStatsOverlayResize() {
        const el = this.dom.statsOverlay;
        const grip = this.dom.statsResize;
        if (!el || !grip) return;

        let origin = null;

        const begin = (point) => {
            const rect = el.getBoundingClientRect();
            origin = { x: point.clientX, y: point.clientY, width: rect.width, height: rect.height };
            // The plate watches its own box to re-pick the free band; mid-drag that would move it
            // out from under the finger.
            this.statsPlateResizing = true;
            el.classList.add('resized');
        };

        const move = (point) => {
            if (!origin) return;
            const width = Math.round(Math.min(
                Math.max(origin.width + (point.clientX - origin.x), 96), this.statsPlateWidthLimit(el)));
            const height = Math.round(Math.min(
                Math.max(origin.height + (point.clientY - origin.y), 34), innerHeight - 34));
            el.style.width = `${width}px`;
            el.style.height = `${height}px`;
            el.style.setProperty('--stats-cols', String(this.statsPlateCols(width)));
            // Re-measure on the next frame rather than per touchmove: the fit lays out the plate
            // several times, and a finger emits moves faster than a mid-range phone draws them.
            if (this.statsFitFrame) cancelAnimationFrame(this.statsFitFrame);
            if (typeof requestAnimationFrame === 'function') {
                this.statsFitFrame = requestAnimationFrame(() => {
                    this.statsFitFrame = 0;
                    this.fitStatsPlateContent();
                });
            } else {
                this.fitStatsPlateContent();
            }
        };

        const end = () => {
            if (!origin) return;
            origin = null;
            this.statsPlateResizing = false;
            // A box smaller than its own rows is grown to them the moment the finger lifts, so fit
            // first and then store the size the user is actually left with.
            this.fitStatsPlateContent();
            this.saveStatsPlateGeom({});
            // A different size fits a different band, so the spot chosen for the old box is not
            // necessarily free for this one — unless the user has pinned it by dragging.
            if (!el.style.left) this.placeStatsOverlay();
        };

        grip.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            e.preventDefault();
            e.stopPropagation();
            begin(e.touches[0]);
        }, { passive: false });
        grip.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            e.preventDefault();
            move(e.touches[0]);
        }, { passive: false });
        grip.addEventListener('touchend', end);
        grip.addEventListener('touchcancel', end);

        grip.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            begin(e);
        });
        document.addEventListener('mousemove', (e) => { if (origin) move(e); });
        document.addEventListener('mouseup', () => end());
    }

    /** A plate the drag handler forgot (it landed off the new screen) forgets its stored corner too. */
    forgetStatsPlatePosition() {
        if (!this.statsPlateGeom) return;
        delete this.statsPlateGeom.left;
        delete this.statsPlateGeom.top;
        this.saveStatsPlateGeom({});
    }
    
    initStatsOverlayDrag() {
        if (!this.dom.statsOverlay) return;
        
        let isDragging = false;
        let offsetX, offsetY;

        /**
         * On a phone the plate is only a drag handle along its title bar. Making the whole card one
         * was harmless while it was always exactly as tall as its content; a plate the user has
         * sized smaller than the ten rows has to scroll, and a `touchmove` that turns into a move is
         * a `touchmove` that called preventDefault — the rows below the fold would be unreachable.
         * Desktop keeps the whole surface, where a wheel scrolls and nothing is captured.
         */
        const startsDrag = (target) => !isPhoneLayout()
            || (target.closest && target.closest('.stats-header') !== null);

        const onMouseDown = (e) => {
            if (e.button !== 0) return;
            // The corner grip resizes; it must not also start a move.
            if (e.target.closest && e.target.closest('.stats-resize')) return;
            if (!startsDrag(e.target)) return;
            
            isDragging = true;
            this.dom.statsOverlay.classList.add('dragging');
            
            const rect = this.dom.statsOverlay.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            e.preventDefault();
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;
            
            // Boundary checks
            const panelRect = this.dom.statsOverlay.getBoundingClientRect();
            newLeft = Math.max(0, Math.min(newLeft, this.statsPlateLeftLimit(panelRect.width)));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - panelRect.height));
            
            this.dom.statsOverlay.style.left = `${newLeft}px`;
            this.dom.statsOverlay.style.top = `${newTop}px`;
        };
        
        const onMouseUp = () => {
            isDragging = false;
            this.dom.statsOverlay.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this.saveStatsPlatePosition();
        };
        
        // Touch support for mobile
        const onTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            if (!startsDrag(e.target)) return;
            
            isDragging = true;
            this.dom.statsOverlay.classList.add('dragging');
            
            const touch = e.touches[0];
            const rect = this.dom.statsOverlay.getBoundingClientRect();
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        };
        
        const onTouchMove = (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            let newLeft = touch.clientX - offsetX;
            let newTop = touch.clientY - offsetY;
            
            const panelRect = this.dom.statsOverlay.getBoundingClientRect();
            newLeft = Math.max(0, Math.min(newLeft, this.statsPlateLeftLimit(panelRect.width)));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - panelRect.height));
            
            this.dom.statsOverlay.style.left = `${newLeft}px`;
            this.dom.statsOverlay.style.top = `${newTop}px`;
        };
        
        const onTouchEnd = () => {
            isDragging = false;
            this.dom.statsOverlay.classList.remove('dragging');
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            this.saveStatsPlatePosition();
        };
        
        this.dom.statsOverlay.addEventListener('mousedown', onMouseDown);
        this.dom.statsOverlay.addEventListener('touchstart', onTouchStart, { passive: true });
    }

    /**
     * The spot the drag left behind. `placeStatsOverlay()` reads an inline `left` as "the user
     * put this here", so this is what keeps a plate that has been parked from being swept back
     * into the auto-chosen band the next time the telemetry makes a row wrap.
     */
    saveStatsPlatePosition() {
        const el = this.dom.statsOverlay;
        if (!el || !el.style.left) return;
        this.saveStatsPlateGeom({
            left: Math.round(parseFloat(el.style.left) || 0),
            top: Math.round(parseFloat(el.style.top) || 0),
        });
    }
    
    updateStatsDisplay(d) {
        const lang = this.viewer.currentLanguage;
        const s = this.dom.stats;
        if (!s.speed) return;
        
        // Speed
        const speedKmh = (d.vehicleSpeedMps || 0) * 3.6;
        s.speed.textContent = `${speedKmh.toFixed(1)} km/h`;
        
        // Gear
        const gearMap = {
            'GEAR_PARK': 'P',
            'GEAR_DRIVE': 'D',
            'GEAR_REVERSE': 'R',
            'GEAR_NEUTRAL': 'N'
        };
        s.gear.textContent = gearMap[d.gearState] || '--';
        
        // Steering
        const steeringAngle = d.steeringWheelAngle || 0;
        s.steering.textContent = `${steeringAngle.toFixed(1)}°`;
        
        // Accelerator
        const accelPercent = d.acceleratorPedalPosition || 0;
        s.accelerator.textContent = `${accelPercent.toFixed(1)}%`;
        
        // Brake
        s.brake.textContent = d.brakeApplied 
            ? (lang === 'zh' ? '踩下' : 'Applied') 
            : (lang === 'zh' ? '未踩' : 'Released');
        s.brake.className = 'stats-value' + (d.brakeApplied ? ' highlight-red' : '');
        
        // Blinker
        const blinkerLeft = d.blinkerOnLeft || false;
        const blinkerRight = d.blinkerOnRight || false;
        if (blinkerLeft && blinkerRight) {
            s.blinker.textContent = lang === 'zh' ? '双闪' : 'Hazard';
            s.blinker.className = 'stats-value highlight-yellow';
        } else if (blinkerLeft) {
            s.blinker.textContent = lang === 'zh' ? '← 左转' : '← Left';
            s.blinker.className = 'stats-value highlight-green';
        } else if (blinkerRight) {
            s.blinker.textContent = lang === 'zh' ? '右转 →' : 'Right →';
            s.blinker.className = 'stats-value highlight-green';
        } else {
            s.blinker.textContent = lang === 'zh' ? '关' : 'Off';
            s.blinker.className = 'stats-value';
        }
        
        // Autopilot
        const apMap = {
            'NONE': lang === 'zh' ? '无' : 'None',
            'SELF_DRIVING': 'FSD',
            'AUTOSTEER': lang === 'zh' ? '自动转向' : 'Autosteer',
            'TACC': 'TACC'
        };
        s.autopilot.textContent = apMap[d.autopilotState] || d.autopilotState || '--';
        s.autopilot.className = 'stats-value' + (d.autopilotState && d.autopilotState !== 'NONE' ? ' highlight-blue' : '');
        
        // GPS
        if (typeof d.latitudeDeg === 'number' && typeof d.longitudeDeg === 'number') {
            s.gps.textContent = `${d.latitudeDeg.toFixed(6)}, ${d.longitudeDeg.toFixed(6)}`;
        } else {
            s.gps.textContent = '--';
        }
        
        // Heading
        s.heading.textContent = typeof d.headingDeg === 'number' ? `${d.headingDeg.toFixed(1)}°` : '--';
        
        // Acceleration (combined)
        // A frame can carry X without Y/Z (the CSV exporter tolerates the same gap), so all
        // three are checked, exactly like the HUD above.
        const accelAxes = [d.linearAccelerationMps2X, d.linearAccelerationMps2Y, d.linearAccelerationMps2Z];
        s.accel.textContent = accelAxes.every(v => typeof v === 'number')
            ? `X:${accelAxes[0].toFixed(2)} Y:${accelAxes[1].toFixed(2)} Z:${accelAxes[2].toFixed(2)}`
            : '--';
        // A longer value can make a row the fit already sized no wider than the box; re-check on a
        // timer instead of every telemetry tick.
        this.scheduleStatsFit();
    }
    
    clear() {
        this.currentMetadata = [];
        this.lastDetailData = null;
        this.hideStatsOverlay();
        this.updateUIStatus();
    }
}

// --- Device Detection ---
function isIOSDevice() {
    // Detect iOS/iPadOS (including Chrome on iPad which uses WebKit)
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
           (navigator.userAgent.includes('CriOS')) || // Chrome on iOS
           (navigator.userAgent.includes('Mobile') && navigator.maxTouchPoints > 1);
}

function supportsDirectoryPicker() {
    // Check if webkitdirectory is actually supported and works
    const input = document.createElement('input');
    return 'webkitdirectory' in input && !isIOSDevice();
}

// Check if File System Access API is supported (for persistent directory handle)
function supportsFileSystemAccess() {
    return 'showDirectoryPicker' in window && !isIOSDevice();
}

// --- IndexedDB helpers for storing directory handle ---
const DB_NAME = 'TeslaCamPlayerDB';
const DB_VERSION = 1;
const STORE_NAME = 'directoryHandles';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

async function saveDirectoryHandle(handle) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.put({ id: 'lastDirectory', handle });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        db.close();
        console.log('[IndexedDB] Directory handle saved');
    } catch (e) {
        console.warn('[IndexedDB] Failed to save directory handle:', e);
    }
}

async function getDirectoryHandle() {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const result = await new Promise((resolve, reject) => {
            const request = store.get('lastDirectory');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        db.close();
        return result?.handle || null;
    } catch (e) {
        console.warn('[IndexedDB] Failed to get directory handle:', e);
        return null;
    }
}

async function clearDirectoryHandle() {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.delete('lastDirectory');
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        db.close();
        console.log('[IndexedDB] Directory handle cleared');
    } catch (e) {
        console.warn('[IndexedDB] Failed to clear directory handle:', e);
    }
}
// --- End IndexedDB helpers ---

// --- End Device Detection ---

// --- Coordinate Conversion Functions ---
const x_pi = 3.14159265358979324 * 3000.0 / 180.0;
const PI = 3.1415926535897932384626;
const a = 6378245.0;
const ee = 0.00669342162296594323;

function transformlat(lng, lat) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformlng(lng, lat) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}

function wgs84togcj02(lng, lat) {
    let dlat = transformlat(lng - 105.0, lat - 35.0);
    let dlng = transformlng(lng - 105.0, lat - 35.0);
    const radlat = lat / 180.0 * PI;
    let magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    const sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
    const mglat = lat + dlat;
    const mglng = lng + dlng;
    return [mglng, mglat];
}

function gcj02tobd09(lng, lat) {
    const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_pi);
    const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_pi);
    const bd_lng = z * Math.cos(theta) + 0.0065;
    const bd_lat = z * Math.sin(theta) + 0.006;
    return [bd_lng, bd_lat];
}
// --- End Coordinate Conversion ---

// Index matches Date.getDay().
const WEEKDAY_NAMES = {
    zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

// `2026-10-08_14-32-05` — the name Tesla gives one event's folder, and the only directory name
// that proves the folder belongs to a single event.
const EVENT_DIR_NAME = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/;

// A second in is past the black lead-in these clips open with and still inside the first frame
// group, so the grab never has to wait for a deep seek.
const FRAME_THUMB_SECONDS = 1;

// The export sheet draws the same frame twice — as a tile in the layout editor and inside the
// composite preview, which is at most 720 px across with six views sharing it. One width means one
// decode per view instead of two, and 320 px is still legible in a 260 px canvas box.
const PHONE_EXPORT_FRAME_W = 320;

// Burned-in text is one entry per wall-clock second, so this is a twenty-minute cap as much as a
// guard against a range that was typed wrong. Past it the clock simply stops updating in the file.
const MAX_EXPORT_CAPTIONS = 1200;

// These five mirror the constants in GlRenderer.kt / CaptionOverlay.kt, and the preview is only
// worth having because it is the same arithmetic the encoder runs.
const PE_MOSAIC_BLOCK_DIVISOR = 20;
const PE_CAPTION_STRIP_WIDTH = 1440;
const PE_CAPTION_TEXT_FRACTION = 0.030;
const PE_CAPTION_LINE_HEIGHT = 1.32;
const PE_CAPTION_MARGIN = 0.02;

// The brightness rail runs from a quarter-lit picture to a panel the system slider said no to.
// 1.0 is the neutral mark — no dim layer, no window override — and everything above it is bought
// from `Window.screenBrightness`, which a CSS layer can never ask for.
const BRIGHTNESS_MAX = 1.6;

// The long-press rate. Three is what a parked clip tolerates before it stops being watchable, and
// it is a gear the 倍速 menu does not offer, so the boost is always a change and never a no-op.
const PHONE_BOOST_RATE = 3;

// A 2TB stick holds a few thousand events, and every one of them used to become a card on the same
// frame the scan finished — the layout pass alone was long enough to freeze the drawer. Only the
// rows near the screen are built now, and scrolling near the bottom appends the next page.
// Desktop is left alone: its sidebar is a window pane, not a finger-scrolled list, and a mouse user
// who selects a filter expects the whole result at once.
const LIST_PAGE_SIZE = 60;

// How far from the bottom edge (CSS px) the next page is fetched — about a screen and a half of
// rows, so the append lands before the thumb reaches the end rather than after it stalls.
const LIST_PAGE_TRIGGER = 480;

class VideoListComponent {
    constructor(elementId, eventHandler, viewer) {
        this.container = document.getElementById(elementId);
        this.eventHandler = eventHandler;
        this.viewer = viewer;
        this.listEvents = null;
        this.listShown = 0;
        this.listScrollArmed = false;
        if (!this.container) {
            throw new Error(`Element with id "${elementId}" not found.`);
        }
    }

    render(events) {
        const lang = this.viewer.currentLanguage;
        const translations = i18n[lang];
        this.container.innerHTML = '';
        this.listEvents = null;
        this.listShown = 0;
        if (!events || events.length === 0) {
            if (this.viewer.allFiles.length > 0) {
                this.container.innerHTML = `<div class="empty-state"><p>${translations.noRecordsFound}</p></div>`;
                // Four controls can empty this list and none of them is where the user is looking.
                if (this.viewer.hasActiveFilters()) {
                    const clear = document.createElement('button');
                    clear.type = 'button';
                    clear.className = 'clear-filters-btn';
                    clear.textContent = translations.clearFiltersBtn;
                    clear.addEventListener('click', () => this.viewer.clearFilters());
                    this.container.querySelector('.empty-state').appendChild(clear);
                }
            } else {
                this.viewer.showInitialHelpMessage();
            }
            return;
        }
        if (!this.listIsTouch()) {
            const fragment = document.createDocumentFragment();
            events.forEach(event => {
                const card = this.createVideoCard(event);
                if (card) fragment.appendChild(card);
            });
            this.container.appendChild(fragment);
            return;
        }
        this.listEvents = events;
        this.armListScroll();
        this.appendListPage();
    }

    listIsTouch() {
        return isPhoneLayout() || isTabletLayout();
    }

    /**
     * Appending rather than rebuilding is the other half of the fix: the reason to scroll to the
     * end of a thousand-row list is to keep reading where you stopped, and a rebuild answers that
     * with a scroll back to the top and a fresh decode of every thumbnail.
     */
    appendListPage() {
        if (!this.listEvents) return 0;
        const fragment = document.createDocumentFragment();
        let built = 0;
        for (let i = this.listShown; i < this.listEvents.length && built < LIST_PAGE_SIZE; i++) {
            const card = this.createVideoCard(this.listEvents[i]);
            if (card) {
                fragment.appendChild(card);
                built++;
            }
            this.listShown = i + 1;
        }
        this.container.appendChild(fragment);
        return built;
    }

    armListScroll() {
        if (this.listScrollArmed) return;
        this.listScrollArmed = true;
        this.container.addEventListener('scroll', () => {
            if (!this.listEvents || this.listShown >= this.listEvents.length) return;
            if (this.container.scrollTop + this.container.clientHeight
                > this.container.scrollHeight - LIST_PAGE_TRIGGER) {
                this.appendListPage();
            }
        }, { passive: true });
    }

    createVideoCard(event) {
        if (!event || !event.segments || event.segments.length === 0) return null;
        const firstSegment = event.segments[0];
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.eventId = event.eventId;
        
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'video-thumbnail';
        const eventTypeLabel = this.getEventTypeLabel(event.eventType);
        const [typeEmoji, ...typeNameParts] = eventTypeLabel.split(' ');
        const typeName = typeNameParts.join(' ') || typeEmoji;

        if (event.thumbFile) {
            const thumbUrl = getFileUrl(event.thumbFile);
            const img = document.createElement('img');
            img.src = thumbUrl;
            img.alt = i18n[this.viewer.currentLanguage].preview;
            img.onload = () => URL.revokeObjectURL(img.src);
            thumbnailDiv.appendChild(img);
        } else {
            // Split so the phone row can keep the glyph in the 96px box and move the words
            // into the text column, where there is room for them.
            thumbnailDiv.innerHTML = `<div class="no-thumb"><span class="thumb-emoji">${typeEmoji}</span><span class="thumb-name">${typeName}</span></div>`;
            this.queueFrameThumb(event, thumbnailDiv);
        }
        const durationDiv = document.createElement('div');
        durationDiv.className = 'video-duration';
        durationDiv.textContent = `${event.segments.length} ${i18n[this.viewer.currentLanguage].minutes}`;
        thumbnailDiv.appendChild(durationDiv);

        // A star only makes sense where the user already recognises the clip, so it rides on
        // the thumbnail rather than the text column.
        if (this.viewer.isStarred(event.eventId)) {
            const star = document.createElement('span');
            star.className = 'card-star';
            star.setAttribute('aria-hidden', 'true');
            thumbnailDiv.appendChild(star);
            card.classList.add('starred');
        }

        card.appendChild(thumbnailDiv);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'video-info';
        const startTime = this.parseTimestamp(event.startTime);
        const timeString = this.formatCardTime(startTime);
        
        let cityHtml = '';
        if (event.city && event.lat && event.lon) {
            const locationText = event.street ? `${event.city} · ${event.street}` : event.city;
            cityHtml = `<span class="city-link" data-lat="${event.lat}" data-lon="${event.lon}">${locationText}</span> `;
        } else if (event.city) {
            const locationText = event.street ? `${event.city} · ${event.street}` : event.city;
            cityHtml = `${locationText} `;
        }

        infoDiv.innerHTML = `
            <div class="video-time">
                <span class="video-type-tag" title="${eventTypeLabel}">${typeEmoji}</span>
                ${cityHtml}${timeString}
            </div>
            <div class="video-sub">${typeName}</div>
        `;
        card.appendChild(infoDiv);
        
        // Attach event listener to the card, but check for city-link target.
        // On touch the address is the loudest text in the row and lands right under the thumb, so
        // it is not a link there — 查看位置 moved into the long-press menu.
        card.onclick = (e) => {
            if (e.target.classList.contains('city-link') && !isPhoneLayout() && !isTabletLayout()) {
                e.stopPropagation(); // Prevent card click from firing
                this.viewer.showMapModal(e.target.dataset.lat, e.target.dataset.lon,
                    this.viewer.eventGroups?.find(item => item.eventId === card.dataset.eventId));
            } else {
                if (Date.now() < (this.viewer.suppressCardClickUntil || 0)) return;
                this.eventHandler(event.eventId);
            }
        };
        this.viewer.attachCardLongPress(card, event);

        return card;
    }

    getEventTypeLabel(type) {
        const lang = this.viewer.currentLanguage;
        return i18n[lang][type.charAt(0).toLowerCase() + type.slice(1)] || type;
    }

    parseTimestamp(timestamp) {
        // Handles "2024-01-01_12-00-00" format
        const [datePart, timePart] = timestamp.split('_');
        return new Date(`${datePart}T${timePart.replace(/-/g, ':')}`);
    }

    /**
     * A phone row is a 96px box beside two text lines, so 「2024/10/08 19:33:34」 spends a line on
     * a year nobody filters by and seconds nobody reads. The weekday is the part that actually
     * answers 「哪一段来着」, so it goes in — spelled out by hand rather than through
     * toLocaleDateString({weekday}), which several OEM WebViews answer in English no matter what
     * the app language is.
     */
    formatCardTime(date) {
        if (!isPhoneLayout()) {
            return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        const pad = n => String(n).padStart(2, '0');
        const weekday = (WEEKDAY_NAMES[this.viewer.currentLanguage] || WEEKDAY_NAMES.zh)[date.getDay()];
        const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
        if (this.viewer.currentLanguage === 'zh') {
            return `${date.getMonth() + 1}月${pad(date.getDate())}日 ${weekday} ${clock}`;
        }
        return `${date.toLocaleDateString('en-US', { month: 'short' })} ${pad(date.getDate())} ${weekday} ${clock}`;
    }

    /**
     * A card with no `thumb.png` is a grey glyph, which says nothing about the clip. Decoding a
     * frame answers 「是哪一段」 at a glance — but only for the rows on screen, so the request
     * waits on an observer instead of running down the whole list at render time.
     */
    queueFrameThumb(event, thumbnailDiv) {
        if (!isAndroidRuntime()) return;
        const path = this.firstClipPath(event);
        if (!path) return;

        const known = FrameFetcher.peek(path, FRAME_THUMB_SECONDS);
        if (typeof known === 'string') {
            this.applyFrameThumb(thumbnailDiv, known);
            return;
        }
        if (known === null) return;   // this clip already refused once

        const observer = this.ensureThumbObserver();
        if (!observer) return;
        thumbnailDiv.dataset.framePath = path;
        observer.observe(thumbnailDiv);
    }

    firstClipPath(event) {
        const files = (event.segments && event.segments[0] && event.segments[0].files) || {};
        const file = files.front || Object.values(files)[0];
        return file && file.path ? file.path : null;
    }

    applyFrameThumb(thumbnailDiv, url) {
        thumbnailDiv.querySelector('.no-thumb')?.remove();
        const img = document.createElement('img');
        img.src = url;
        img.alt = i18n[this.viewer.currentLanguage].preview;
        thumbnailDiv.insertBefore(img, thumbnailDiv.firstChild);
    }

    /**
     * Built on the first card that needs it, and shared by every render after that: the list is
     * rebuilt wholesale on filter, star and sort, and a fresh observer per render would re-ask
     * for every visible frame each time. The cache answers those instead.
     */
    ensureThumbObserver() {
        if (this.thumbObserver !== undefined) return this.thumbObserver;
        if (typeof IntersectionObserver !== 'function') {
            this.thumbObserver = null;
            return null;
        }
        this.thumbObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const box = entry.target;
                this.thumbObserver.unobserve(box);
                const path = box.dataset.framePath;
                delete box.dataset.framePath;
                if (!path || !box.isConnected) return;
                FrameFetcher.get(path, FRAME_THUMB_SECONDS).then(url => {
                    // A card that scrolled away and got re-rendered while the frame was still
                    // decoding is a card that no longer wants it.
                    if (url && box.isConnected) {
                        this.applyFrameThumb(box, url);
                        return;
                    }
                    // One re-ask for a card whose clip was merely slow, on the assumption that the
                    // read is warm now. A second miss leaves the placeholder, which is honest.
                    if (url === null && box.isConnected && !box.dataset.frameRetried) {
                        box.dataset.frameRetried = '1';
                        box.dataset.framePath = path;
                        this.thumbObserver.observe(box);
                    }
                });
            });
        }, { rootMargin: '240px 0px' });
        return this.thumbObserver;
    }
}

const ALL_CAMERA_VIEWS = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
const GRID4_CAMERA_VIEWS = ['front', 'back', 'left', 'right'];

// Which three feeds share the screen with the chosen one in 大小窗. Both the layout writer and the
// feed suspender need this, and a hidden feed is defined as "not in here".
const LEGACY_PIP_LAYOUTS = {
    front: { back: 'top-right', left: 'bottom-left', right: 'bottom-right' },
    back: { front: 'top-left', left: 'bottom-left', right: 'bottom-right' },
    left: { front: 'top-left', back: 'top-right', right: 'bottom-right' },
    right: { front: 'top-left', back: 'top-right', left: 'bottom-left' },
    left_pillar: { front: 'top-left', back: 'top-right', left: 'bottom-left' },
    right_pillar: { front: 'top-left', back: 'top-right', right: 'bottom-right' }
};

const CAMERA_LABEL_NAMES = {
    front: { en: 'Front', zh: '前视' },
    left_pillar: { en: 'Left Pillar', zh: '左柱' },
    right_pillar: { en: 'Right Pillar', zh: '右柱' },
    back: { en: 'Back', zh: '后视' },
    left: { en: 'Left', zh: '左侧' },
    right: { en: 'Right', zh: '右侧' }
};

class MultiCameraPlayer {
    constructor() {
        this.players = {
            front: document.getElementById('front-player'),
            back: document.getElementById('back-player'),
            left: document.getElementById('left-player'),
            right: document.getElementById('right-player'),
            left_pillar: document.getElementById('left-pillar-player'),
            right_pillar: document.getElementById('right-pillar-player')
        };
        // Loopback media URLs are cross-origin; without CORS mode any canvas readback of
        // these videos would be tainted.
        if (isAndroidRuntime()) {
            Object.values(this.players).forEach(player => {
                if (player) player.crossOrigin = 'anonymous';
            });
        }
        this.playerContainers = {
            front: document.getElementById('front-container'),
            back: document.getElementById('back-container'),
            left: document.getElementById('left-container'),
            right: document.getElementById('right-container'),
            left_pillar: document.getElementById('left-pillar-container'),
            right_pillar: document.getElementById('right-pillar-container')
        };
        this.currentUrls = { front: null, back: null, left: null, right: null, left_pillar: null, right_pillar: null };
        this.activeCamera = 'front';
        this.layoutMode = 'grid4'; // Default to 4-Grid
        this.isPlaying = false;
        this.isSeeking = false;
        // B8: 2x for reviewing a 10-minute parking clip is a habit, and re-picking it for every
        // event was the one thing that made the phone build feel unfinished.
        this.playbackRate = this.storedPlaybackRate();
        this.lastSyncTime = 0;
        // Feeds the current layout cannot show, on a phone. `applyFeedVisibility()` owns both sides.
        this.suspendedFeeds = new Set();

        this.syncCameraLabels();
    }

    /**
     * The cameras this layout actually paints. Everything else is decoration that costs a decoder.
     */
    visibleCameras() {
        switch (this.layoutMode) {
            case 'grid':
                return ALL_CAMERA_VIEWS;
            case 'grid4':
                return GRID4_CAMERA_VIEWS;
            case 'legacy':
                return [this.activeCamera, ...Object.keys(LEGACY_PIP_LAYOUTS[this.activeCamera] || {})];
            default:
                return [this.activeCamera];
        }
    }

    /**
     * Camera names are static per layout and per language, but this used to run inside a
     * `requestAnimationFrame` loop and rewrite four `innerText`s sixty times a second. On a phone
     * that is a permanent layout invalidation competing with the decoders, for text that only
     * changes when the layout or the language does — so those are the places that call it now.
     */
    syncCameraLabels() {
        const isGrid = this.layoutMode === 'grid' || this.layoutMode === 'grid4';
        const lang = (window.viewer && window.viewer.currentLanguage) || 'zh';
        const views = this.visibleCameras();

        ALL_CAMERA_VIEWS.forEach(camera => {
            const container = this.playerContainers[camera];
            if (!container) return;
            let label = container.querySelector('.camera-label');
            if (!label) {
                label = document.createElement('div');
                label.className = 'camera-label';
                // Style is handled in CSS, but ensure it exists
                label.style.position = 'absolute';
                label.style.top = '10px';
                label.style.left = '10px';
                label.style.color = 'white';
                label.style.backgroundColor = 'rgba(0,0,0,0.5)';
                label.style.padding = '5px 10px';
                label.style.fontSize = '14px';
                label.style.pointerEvents = 'none';
                label.style.zIndex = '10';
                container.appendChild(label);
            }
            label.innerText = CAMERA_LABEL_NAMES[camera]?.[lang] || camera;
            // Single/Legacy leave visibility to CSS (opacity), as before.
            label.style.display = isGrid ? (views.includes(camera) ? 'block' : 'none') : '';
        });
    }

    /**
     * A phone has a couple of hardware decoders and a loopback server with a fixed number of
     * workers; asking both for six 1080p MP4s is how a mid-range device ends up software-decoding
     * two of them and stuttering on all six. Whatever the current layout cannot show is paused, and
     * restarted from the main feed's position the moment it becomes visible again. Desktop keeps
     * playing every feed it has always played — it has the headroom, and a hidden feed that holds
     * its exact position is the behaviour it was tested with.
     */
    applyFeedVisibility() {
        if (!isAndroidRuntime()) return;
        const visible = new Set(this.visibleCameras());
        const main = this.players[this.activeCamera];

        visible.forEach(camera => {
            if (!this.suspendedFeeds.has(camera)) return;
            this.suspendedFeeds.delete(camera);
            const player = this.players[camera];
            if (!player || !player.src) return;
            if (main && main.src && Math.abs(player.currentTime - main.currentTime) > 0.4) {
                player.currentTime = main.currentTime;
            }
            if (this.isPlaying) player.play().catch(() => { /* superseded by a newer request */ });
        });

        ALL_CAMERA_VIEWS.forEach(camera => {
            if (visible.has(camera)) return;
            const player = this.players[camera];
            if (!player || player.paused) return;
            player.pause();
            this.suspendedFeeds.add(camera);
        });
    }
    
    // Start render loop for labels
    startRenderLoop() {
        if (this.renderLoopRunning) return;
        this.renderLoopRunning = true;
        this.renderLoop();
    }

    renderLoop() {
        const isGrid = ['grid', 'grid4'].includes(this.layoutMode);
        
        if (isGrid) {
            // Check active views to determine layout
            const views = this.layoutMode === 'grid' ?
                ['left_pillar', 'front', 'right_pillar', 'left', 'back', 'right'] : // 6-grid (grid)
                ['front', 'back', 'left', 'right']; // 4-grid (grid4)

            // Iterate over each view container and add/update labels
            views.forEach(camera => {
                const container = this.playerContainers[camera];
                if (container) {
                     let label = container.querySelector('.camera-label');
                     if (!label) {
                         label = document.createElement('div');
                         label.className = 'camera-label';
                         // Style is handled in CSS, but ensure it exists
                         label.style.position = 'absolute';
                         label.style.top = '10px';
                         label.style.left = '10px';
                         label.style.color = 'white';
                         label.style.backgroundColor = 'rgba(0,0,0,0.5)';
                         label.style.padding = '5px 10px';
                         label.style.fontSize = '14px';
                         label.style.pointerEvents = 'none';
                         label.style.zIndex = '10';
                         container.appendChild(label);
                     }
                     // Set localized text (Simple check for window.viewer global or fallback)
                     // Note: We access window.viewer carefully
                     const lang = (window.viewer && window.viewer.currentLanguage) || 'zh';
                     const cameraNames = {
                        front: { en: 'Front', zh: '前视' },
                        left_pillar: { en: 'Left Pillar', zh: '左柱' },
                        right_pillar: { en: 'Right Pillar', zh: '右柱' },
                        back: { en: 'Back', zh: '后视' },
                        left: { en: 'Left', zh: '左侧' },
                        right: { en: 'Right', zh: '右侧' }
                     };
                     label.innerText = cameraNames[camera]?.[lang] || camera;
                     label.style.display = 'block';
                }
            });
            
             // Hide labels for inactive cameras in the grid
             Object.keys(this.playerContainers).forEach(key => {
                 if (!views.includes(key)) {
                     const container = this.playerContainers[key];
                     if (container) {
                        const label = container.querySelector('.camera-label');
                        if (label) label.style.display = 'none';
                     }
                 }
             });

        } else {
             // Single/Legacy view mode: Revert to CSS control (Single hidden by opacity, Legacy PIP shown by opacity)
             Object.values(this.playerContainers).forEach(container => {
                 if (container) {
                    const label = container.querySelector('.camera-label');
                    if (label) label.style.display = '';
                 }
             });
        }

        requestAnimationFrame(() => this.renderLoop());
    }

    setLayout(mode) {
        this.layoutMode = mode;
        this.updateLayout();
    }

    setCamera(camera) {
        if (this.players[camera]) {
            this.activeCamera = camera;
            this.updateLayout();
        }
    }

    updateLayout() {
        const playerArea = document.getElementById('playerArea');
        if (!playerArea) return;

        // Reset Player Area Classes
        playerArea.classList.remove('grid-view', 'grid4-view', 'legacy-view', 'single-view');

        // Reset Container Classes
        const positionClasses = ['pos-top-left', 'pos-top-right', 'pos-bottom-left', 'pos-bottom-right'];
        Object.keys(this.playerContainers).forEach(key => {
            const container = this.playerContainers[key];
            if (!container) return;
            container.classList.remove('is-main', 'is-pip', 'hidden', 'is-grid', 'is-active-single', ...positionClasses);
            container.style.display = ''; // Reset inline display
        });

        // Apply Logic based on Layout Mode
        if (this.layoutMode === 'grid') {
            playerArea.classList.add('grid-view');
            Object.values(this.playerContainers).forEach(c => { if(c) c.classList.add('is-grid'); });
        } 
        else if (this.layoutMode === 'grid4') {
            playerArea.classList.add('grid4-view');
            Object.keys(this.playerContainers).forEach(key => {
                const c = this.playerContainers[key];
                if (!c) return;
                // Only Front, Back, Left, Right are standard grid4
                if (['front', 'back', 'left', 'right'].includes(key)) {
                    c.classList.add('is-grid');
                } else {
                    // Pillars are hidden via CSS for grid4-view, but we can ensure it
                }
            });
        }
        else if (this.layoutMode === 'single') {
            playerArea.classList.add('single-view');
            const activeC = this.playerContainers[this.activeCamera];
            if (activeC) activeC.classList.add('is-active-single');
        }
        else if (this.layoutMode === 'legacy') {
            playerArea.classList.add('legacy-view');
            
            const layouts = {
                front: { back: 'top-right', left: 'bottom-left', right: 'bottom-right' },
                back: { front: 'top-left', left: 'bottom-left', right: 'bottom-right' },
                left: { front: 'top-left', back: 'top-right', right: 'bottom-right' },
                right: { front: 'top-left', back: 'top-right', left: 'bottom-left' },
                left_pillar: { front: 'top-left', back: 'top-right', left: 'bottom-left' },
                right_pillar: { front: 'top-left', back: 'top-right', right: 'bottom-right' }
            };
            const pipMapping = layouts[this.activeCamera] || {};

            Object.keys(this.playerContainers).forEach(key => {
                const container = this.playerContainers[key];
                if (!container) return;

                if (key === this.activeCamera) {
                    container.classList.add('is-main');
                } else if (pipMapping[key]) {
                    container.classList.add('is-pip', `pos-${pipMapping[key]}`);
                } else {
                    container.classList.add('is-pip', 'hidden');
                }
            });
        }

        // The reserve under the grid depends on which surfaces this layout shows — landscape
        // multi-feed hides the metadata strip — and a `display:none` never wakes the
        // ResizeObserver, so a layout change has to ask for a re-measure itself.
        if (window.viewer && window.viewer.publishControlReserve) {
            requestAnimationFrame(() => window.viewer.publishControlReserve());
        }
    }

    // Deprecated but kept for compatibility if needed, aliased to setCamera + Single Mode
    setActive(cameraType) {
        if (['grid', 'grid4', 'legacy'].includes(cameraType)) {
            this.setLayout(cameraType);
        } else {
            this.setCamera(cameraType);
            this.setLayout('single');
        }
    }

    async loadSegmentForAllCameras(segment) {
        this.cleanup();
        const cameras = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
        let activeCount = 0;

        for (const camera of cameras) {
            const file = segment.files[camera];
            const player = this.players[camera];
            const cameraView = this.playerContainers[camera];

            if (file && player) {
                activeCount++;
                this.currentUrls[camera] = getFileUrl(file);
                player.src = this.currentUrls[camera];
                // Re-apply the rate here as cleanup() / .src change resets the player state.
                player.defaultPlaybackRate = this.playbackRate;
                player.playbackRate = this.playbackRate;
                if(cameraView) {
                    cameraView.classList.remove('error', 'empty', 'feed-decode-error');
                    cameraView.querySelector('.feed-decode-note')?.remove();
                }
            } else {
                if (player) player.src = '';
                if(cameraView) cameraView.classList.add('empty');
            }
        }

        // Adjust Grid Layout based on active cameras
        // Logic removed: User explicitly selects layout now.
        
        await this.waitForAllVideosLoaded();

        // Load SEI metadata from front camera
        if (segment.files['front'] && window.viewer && window.viewer.metadataManager) {
            window.viewer.metadataManager.loadMetadata(segment.files['front']);
        } else if (window.viewer && window.viewer.metadataManager) {
            window.viewer.metadataManager.clear();
        }
    }


    async waitForAllVideosLoaded() {
        const loadPromises = Object.values(this.players).filter(p => p.src).map(player =>
            new Promise((resolve) => {
                if (player.readyState >= 2) resolve();
                else {
                    player.addEventListener('loadeddata', resolve, { once: true });
                    player.addEventListener('error', resolve, { once: true });
                }
            })
        );
        await Promise.all(loadPromises);
    }

    async syncAllPlayers() {
        if (this.isSeeking) return;

        const now = performance.now();
        if (now - this.lastSyncTime < 100) { // Throttle to max 10 times per second
            return;
        }
        this.lastSyncTime = now;

        const mainPlayer = this.players[this.activeCamera];
        if (!mainPlayer || !mainPlayer.src) return;
        const currentTime = mainPlayer.currentTime;

        // Update metadata display
        if (window.viewer && window.viewer.metadataManager) {
            window.viewer.metadataManager.updateDisplay(currentTime);
        }

        Object.keys(this.players).forEach(key => {
            if (key !== this.activeCamera && this.players[key] && this.players[key].src) {
                const player = this.players[key];
                if (Math.abs(player.currentTime - currentTime) > 0.1) {
                    player.currentTime = currentTime;
                }
            }
        });
    }

    async playAll() {
        const playPromises = Object.values(this.players).filter(p => p.src).map(p => p.play().catch(e => console.warn('Play failed:', e)));
        await Promise.all(playPromises);
    }

    pauseAll() {
        Object.values(this.players).forEach(p => { if (p.src) p.pause(); });
    }

    seekAll(time) {
        this.isSeeking = true;
        Object.values(this.players).forEach(p => { if (p.src) p.currentTime = time; });
        setTimeout(() => { this.isSeeking = false; }, 100);
    }

    cleanup() {
        this.pauseAll();
        Object.values(this.players).forEach(player => {
            player.src = '';
            player.removeAttribute('src');
            player.load();
        });
        Object.keys(this.currentUrls).forEach(key => {
            if (this.currentUrls[key]) {
                URL.revokeObjectURL(this.currentUrls[key]);
                this.currentUrls[key] = null;
            }
        });
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        // Desktop keeps the per-session default; only a phone, where every event reloads the
        // players, benefits from the rate outliving the current clip.
        if (isPhoneLayout()) {
            try { localStorage.setItem(ANDROID_PLAYBACK_RATE_KEY, String(rate)); } catch (e) { /* full or blocked */ }
        }
        Object.values(this.players).forEach(p => {
            if (p) {
                p.defaultPlaybackRate = rate;
                p.playbackRate = rate;
            }
        });
    }

    storedPlaybackRate() {
        if (!isPhoneLayout()) return 1.0;
        const raw = parseFloat(localStorage.getItem(ANDROID_PLAYBACK_RATE_KEY));
        // Read the offered rates off the menu itself rather than a list kept beside it: a stored
        // 16x from a future build, or a retired 3x from an old one, would otherwise restore onto a
        // player whose button offers nothing to match it.
        const offered = Array.from(document.querySelectorAll('.speed-options [data-speed]'))
            .map(el => parseFloat(el.dataset.speed));
        return offered.includes(raw) ? raw : 1.0;
    }
}

class ContinuousVideoPlayer {
    constructor(multiCameraPlayer) {
        this.multiCameraPlayer = multiCameraPlayer;
        this.currentEvent = null;
        this.currentSegmentIndex = 0;
        this.totalDuration = 0;
        this.segmentDurations = [];
        this.segmentStartTimes = [];
        this.isTransitioning = false;
        this.bindEvents();
    }

    bindEvents() {
        const refPlayer = this.multiCameraPlayer.players.front;
        if (!refPlayer) return;
        refPlayer.addEventListener('ended', () => { if (!this.isTransitioning) this.playNextSegment(); });
        refPlayer.addEventListener('timeupdate', () => this.multiCameraPlayer.syncAllPlayers());
    }

    async calculateEventDurations(event) {
        if (!event.segments || event.segments.length === 0) {
            event.totalDuration = 0;
            event.segmentDurations = [];
            event.segmentStartTimes = [];
            return;
        }
        const getVideoDuration = (file) => new Promise((resolve) => {
            if (!file) { resolve(60); return; }
            const video = document.createElement('video');
            const url = getFileUrl(file);
            const cleanup = () => {
                video.onloadedmetadata = null;
                video.onerror = null;
                video.src = '';
                URL.revokeObjectURL(url);
            };
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const duration = video.duration;
                cleanup();
                resolve(isFinite(duration) ? duration : 60);
            };
            video.onerror = () => { cleanup(); resolve(60); };
            video.src = url;
        });
        const segmentCount = event.segments.length;
        const durations = new Array(segmentCount).fill(60);
        if (segmentCount > 0) {
            const lastSegment = event.segments[segmentCount - 1];
            const repFile = lastSegment.files.front || lastSegment.files.back || lastSegment.files.left || lastSegment.files.right || lastSegment.files.left_pillar || lastSegment.files.right_pillar;
            durations[segmentCount - 1] = await getVideoDuration(repFile);
        }
        event.segmentDurations = [];
        event.segmentStartTimes = [];
        let accumulatedTime = 0;
        for (let i = 0; i < segmentCount; i++) {
            event.segmentStartTimes[i] = accumulatedTime;
            const segmentDuration = durations[i];
            event.segmentDurations[i] = segmentDuration;
            accumulatedTime += segmentDuration;
        }
        event.totalDuration = accumulatedTime;
    }

    async loadEvent(event) {
        this.currentEvent = event;
        this.currentSegmentIndex = 0;
        this.segmentDurations = event.segmentDurations || [];
        this.segmentStartTimes = event.segmentStartTimes || [];
        this.totalDuration = event.totalDuration || 0;
        await this.loadSegment(0);
    }

    async loadSegment(index) {
        if (!this.currentEvent || index < 0 || index >= this.currentEvent.segments.length) return;
        this.currentSegmentIndex = index;
        const segment = this.currentEvent.segments[index];
        await this.multiCameraPlayer.loadSegmentForAllCameras(segment);
    }

    async playNextSegment() {
        if (this.currentSegmentIndex < this.currentEvent.segments.length - 1) {
            this.isTransitioning = true;
            await this.loadSegment(this.currentSegmentIndex + 1);
            await this.multiCameraPlayer.playAll();
            this.isTransitioning = false;
        } else {
            console.log("All segments played.");
            this.multiCameraPlayer.pauseAll();
            // Rolling clips are meant to be watched one after another, not one tap each.
            if (this.viewer) this.viewer.onEventPlaybackFinished();
        }
    }

    getCurrentTime() {
        if (!this.currentEvent) return 0;
        const segmentStartTime = this.segmentStartTimes[this.currentSegmentIndex] || 0;
        const activePlayer = this.multiCameraPlayer.players[this.multiCameraPlayer.activeCamera];
        const segmentCurrentTime = activePlayer ? activePlayer.currentTime : 0;
        return segmentStartTime + segmentCurrentTime;
    }

    async seekToTime(targetTime) {
        if (!this.currentEvent) return;
        let targetSegmentIndex = 0;
        for (let i = 0; i < this.segmentStartTimes.length; i++) {
            if (targetTime >= this.segmentStartTimes[i]) targetSegmentIndex = i;
            else break;
        }
        const segmentStartTime = this.segmentStartTimes[targetSegmentIndex];
        const segmentTime = targetTime - segmentStartTime;
        if (targetSegmentIndex !== this.currentSegmentIndex) {
            await this.loadSegment(targetSegmentIndex);
        }
        this.multiCameraPlayer.seekAll(segmentTime);
    }

    getTotalDuration() { return this.totalDuration; }
}

class ModernVideoControls {
    constructor(continuousPlayer, viewer) {
        this.continuousPlayer = continuousPlayer;
        this.multiCameraPlayer = continuousPlayer.multiCameraPlayer;
        this.viewer = viewer;
        this.player = this.multiCameraPlayer.players.front;
        this.container = document.getElementById('playerArea');
        this.totalDuration = 0;
        this.isPlaying = false;
        this.isDragging = false;
        this.wasPlaying = false;
        this.currentEventStartTime = null;
        
        // Clip selection state
        this.clipStartTime = null;
        this.clipEndTime = null;
        this.isDraggingClipStart = false;
        this.isDraggingClipEnd = false;
        this.clipModeActive = false;
        
        this.hideControlsTimer = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        if (!this.container) return;
        this.overlay = this.container.querySelector('#videoControlsOverlay');
        this.playPauseBtn = this.container.querySelector('#playPauseBtn');
        this.playPauseIcon = this.container.querySelector('#playPauseIcon');
        this.progressContainer = this.container.querySelector('#progressContainer');
        this.progressPlayed = this.container.querySelector('#progressPlayed');
        this.progressHandle = this.container.querySelector('#progressHandle');
        this.videoTimeDisplay = this.container.querySelector('#videoTimeDisplay');
        this.timePreview = this.container.querySelector('#timePreview');
        this.realTimeClock = document.getElementById('realTimeClock');
        this.speedControl = this.container.querySelector('#speedControl');
        this.speedBtn = this.container.querySelector('#speedBtn');
        this.speedOptions = this.container.querySelector('.speed-options');
        // A restored 2x that still reads "1x" on the button is worse than no memory at all.
        if (this.speedBtn && this.speedOptions && this.multiCameraPlayer.playbackRate !== 1) this.syncSpeedUI();
        
        // Speed graph elements
        this.speedGraphContainer = this.container.querySelector('#speedGraphContainer');
        this.speedGraphCanvas = this.container.querySelector('#speedGraphCanvas');
        // D20: the curve is the same timeline the scrub bar below it draws, only with a speed
        // story on it — tapping where the car braked has to jump to that second.
        if (this.speedGraphContainer) {
            this.speedGraphContainer.style.cursor = 'pointer';
            this.speedGraphContainer.addEventListener('click', e => this.seekFromSpeedGraph(e));
        }
        
        // Clip elements
        this.clipBtn = this.container.querySelector('#clipBtn');
        this.confirmClipBtn = this.container.querySelector('#confirmClipBtn');
        this.clipSelection = this.container.querySelector('#clipSelection');
        this.clipStartHandle = this.container.querySelector('#clipStartHandle');
        this.clipEndHandle = this.container.querySelector('#clipEndHandle');
        this.viewSwitcher = this.container.querySelector('#viewSwitcher');
    }

    bindEvents() {
        if (this.viewSwitcher) {
            this.viewSwitcher.addEventListener('click', (e) => {
                const btn = e.target.closest('.view-btn');
                if (btn && btn.dataset.view) {
                    this.viewer.switchCamera(btn.dataset.view);
                }
            });
        }

        if (this.playPauseBtn) this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());

        if (this.progressContainer) {
            this.progressContainer.addEventListener('mousedown', (e) => this.startDrag(e));
            document.addEventListener('mousemove', (e) => this.onDrag(e));
            document.addEventListener('mouseup', (e) => this.stopDrag(e));

            this.progressContainer.addEventListener('mousemove', (e) => {
                if (!this.isDragging && !this.isDraggingClipStart && !this.isDraggingClipEnd) this.showTimePreview(e);
            });
            this.progressContainer.addEventListener('mouseleave', () => {
                if (!this.isDragging && !this.isDraggingClipStart && !this.isDraggingClipEnd) this.hideTimePreview();
            });

            // Scrubbing by touch (B10). The drag maths already worked off `clientX`, so a
            // finger only ever needed a source for those events — and the bubble that tells you
            // where you are pointing, which `mousemove` never sends on a phone.
            const touchAsPointer = (e) => {
                const t = e.touches[0] || e.changedTouches[0];
                if (!t) return null;
                return { clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault() };
            };

            this.progressContainer.addEventListener('touchstart', (e) => {
                const pointer = touchAsPointer(e);
                if (!pointer || this.isDraggingClipStart || this.isDraggingClipEnd) return;
                this.startDrag(pointer);
                this.showTimePreview(pointer);
            }, { passive: false });

            this.progressContainer.addEventListener('touchmove', (e) => {
                const pointer = touchAsPointer(e);
                if (!pointer || !this.isDragging) return;
                this.onDrag(pointer);
                this.showTimePreview(pointer);
            }, { passive: false });

            const endTouchScrub = (e) => {
                const pointer = touchAsPointer(e);
                if (!pointer || !this.isDragging) return;
                this.stopDrag(pointer);
                this.hideTimePreview();
            };
            this.progressContainer.addEventListener('touchend', endTouchScrub);
            this.progressContainer.addEventListener('touchcancel', endTouchScrub);
        }
        
        // Clip handle events
        if (this.clipStartHandle) {
            this.clipStartHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.isDraggingClipStart = true;
                this.wasPlaying = this.multiCameraPlayer.isPlaying;
                if (this.wasPlaying) this.multiCameraPlayer.pauseAll();
            });
            this.clipStartHandle.addEventListener('touchstart',
                (e) => this.beginClipHandleDrag('isDraggingClipStart', e), { passive: false });
        }
        
        if (this.clipEndHandle) {
            this.clipEndHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.isDraggingClipEnd = true;
                this.wasPlaying = this.multiCameraPlayer.isPlaying;
                if (this.wasPlaying) this.multiCameraPlayer.pauseAll();
            });
            this.clipEndHandle.addEventListener('touchstart',
                (e) => this.beginClipHandleDrag('isDraggingClipEnd', e), { passive: false });
        }

        // The finger equivalent of the document-level `mousemove` above. It has to live on the
        // document, not the handle: the whole point of dragging is that the pointer leaves the
        // 14px handle almost immediately.
        const clipTouchPointer = (e) => {
            const t = e.touches[0] || e.changedTouches[0];
            if (!t) return null;
            return { clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault() };
        };
        const clipTouchMove = (e) => {
            if (!this.isDraggingClipStart && !this.isDraggingClipEnd) return;
            const pointer = clipTouchPointer(e);
            if (pointer) this.onDrag(pointer);
        };
        const clipTouchEnd = () => {
            if (!this.isDraggingClipStart && !this.isDraggingClipEnd) return;
            this.stopDrag({ clientX: 0, clientY: 0, preventDefault: () => {} });
        };
        document.addEventListener('touchmove', clipTouchMove, { passive: false });
        document.addEventListener('touchend', clipTouchEnd);
        document.addEventListener('touchcancel', clipTouchEnd);
        
        // Clip button
        if (this.clipBtn) {
            this.clipBtn.addEventListener('click', () => {
                if (!this.clipModeActive) {
                    // Enter clip mode
                    this.toggleClipMode();
                } else {
                    // Exit clip mode
                    this.toggleClipMode();
                }
            });
        }
        
        // Confirm clip button
        if (this.confirmClipBtn) {
            this.confirmClipBtn.addEventListener('click', () => {
                this.viewer.showClipModal();
            });
        }

        if (this.player) {
            this.player.addEventListener('timeupdate', () => {
                if (!this.isDragging) this.updateProgress();
            });
            this.player.addEventListener('play', () => this.updatePlayState(true));
            this.player.addEventListener('pause', () => this.updatePlayState(false));
        }

        if (this.container) {
            const resetTimer = () => this.resetHideTimer();
            // A tap that only exists to wake the auto-hidden overlay must not also act on the
            // feed underneath it (tap-to-zoom). touchstart is the only point where that is
            // still observable: the resetTimer listener below reveals the overlay right away,
            // so by the time mousedown and click run the state is already gone.
            this.container.addEventListener('touchstart', () => {
                this.wakeOnlyTap = !this.overlay.classList.contains('show');
            }, { passive: true });
            this.container.addEventListener('mousemove', resetTimer);
            this.container.addEventListener('click', resetTimer);
            this.container.addEventListener('touchstart', resetTimer);
            this.container.addEventListener('mouseenter', resetTimer);
            this.container.addEventListener('mouseleave', () => {
                // If playing, hide immediately on mouse leave (standard behavior)
                // But keep showing if paused or interacting
                if (this.isPlaying && !this.isDragging && !this.speedControl?.classList.contains('active')) {
                    this.hideControls();
                }
            });
        }

        if (this.speedBtn) {
            this.speedBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.speedControl.classList.toggle('active');
                // Six speeds no longer fit sideways, so the menu opens on the rate already in use
                // rather than on whichever end of the list happens to be visible.
                if (this.speedControl.classList.contains('active') && this.speedOptions) {
                    const current = this.speedOptions.querySelector('div.active');
                    if (current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest' });
                }
            });
        }

        if (this.speedOptions) {
            this.speedOptions.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.dataset.speed) {
                    this.setSpeed(parseFloat(e.target.dataset.speed));
                    this.speedControl.classList.remove('active');
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (this.speedControl && this.speedControl.classList.contains('active') && !this.speedControl.contains(e.target)) {
                this.speedControl.classList.remove('active');
            }
        });
        
        // Handle resize for speed graph redraw
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.lastSpeedGraphData) {
                    this.drawSpeedGraph(this.lastSpeedGraphData.metadata, this.lastSpeedGraphData.durations);
                }
            }, 100);
        });
    }
    
    updateViewSwitcherUI(cameraType) {
        if (!this.viewSwitcher) return;
        this.viewSwitcher.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === cameraType);
        });
    }

    updatePillarButtons(show) {
        if (!this.viewSwitcher) return;
        
        // Always show Pillar Buttons (User Request)
        const pillarBtns = this.viewSwitcher.querySelectorAll('[data-view="left_pillar"], [data-view="right_pillar"]');
        pillarBtns.forEach(btn => {
            btn.style.display = 'flex';
        });

        // Always show 6-Grid Button
        const grid6Btn = this.viewSwitcher.querySelector('[data-view="grid"]');
        if (grid6Btn) {
            grid6Btn.style.display = 'flex';
        }
    }

    toggleClipMode() {
        this.clipModeActive = !this.clipModeActive;
        
        if (this.clipModeActive) {
            // Enter clip mode - pause video first
            if (this.multiCameraPlayer.isPlaying) {
                this.multiCameraPlayer.pauseAll();
                this.updatePlayState(false);
            }
            
            // Initialize selection
            const currentTime = this.continuousPlayer.getCurrentTime();
            const duration = this.totalDuration;
            
            // Set default selection: current time ± 30 seconds (or bounds)
            this.clipStartTime = Math.max(0, currentTime - 30);
            this.clipEndTime = Math.min(duration, currentTime + 30);
            
            this.updateClipSelection();
            this.clipSelection.classList.add('active');
            this.clipStartHandle.classList.add('active');
            this.clipEndHandle.classList.add('active');
            this.clipBtn.style.color = 'var(--accent)';
            
            // Show confirm button, hide clip button
            if (this.confirmClipBtn) {
                this.confirmClipBtn.style.display = 'block';
            }
            this.buildClipFilmstrip();
        } else {
            // Exit clip mode
            this.clipSelection.classList.remove('active');
            this.clipStartHandle.classList.remove('active');
            this.clipEndHandle.classList.remove('active');
            this.clipBtn.style.color = '';
            this.clipStartTime = null;
            this.clipEndTime = null;
            this.hideClipFilmstrip();
            
            // Hide confirm button
            if (this.confirmClipBtn) {
                this.confirmClipBtn.style.display = 'none';
            }
        }
    }
    
    /**
     * The trim ruler is 4px of line and two handles: it can say 「第 12 秒」 but not what is at the
     * 12th second, which is the only thing that decides where to let go. A strip of real frames
     * above it turns the drag into aiming instead of guessing.
     */
    buildClipFilmstrip() {
        if (!isPhoneLayout() && !isTabletLayout()) return;
        const event = this.viewer && this.viewer.currentEvent;
        if (!this.progressContainer || !event || !this.totalDuration) return;

        // The ratio is measured from a frame, so it belongs to the event that frame came from. A
        // sentry clip shot at a different resolution would otherwise keep the previous strip's
        // height for the whole session.
        if (this.clipFrameAspectFor !== event.eventId) {
            this.clipFrameAspectFor = event.eventId;
            this.clipFrameAspect = 0;
        }

        let strip = this.clipFilmstrip;
        if (!strip) {
            strip = document.createElement('div');
            strip.className = 'clip-filmstrip';
            strip.setAttribute('aria-hidden', 'true');
            this.progressContainer.appendChild(strip);
            this.clipFilmstrip = strip;
        }
        const slots = Math.max(4, Math.min(10,
            Math.round((this.progressContainer.clientWidth || 320) / 56)));
        strip.textContent = '';

        for (let i = 0; i < slots; i += 1) {
            const cell = document.createElement('div');
            cell.className = 'filmstrip-cell';
            cell.style.left = `${(i / slots) * 100}%`;
            cell.style.width = `${100 / slots}%`;
            strip.appendChild(cell);

            const target = this.clipFrameTarget(event, (this.totalDuration * (i + 0.5)) / slots);
            if (!target) continue;
            const known = FrameFetcher.peek(target.path, target.seconds);
            if (typeof known === 'string') {
                this.paintFilmstripCell(cell, known);
            } else if (known === undefined) {
                FrameFetcher.get(target.path, target.seconds).then(url => {
                    if (url && cell.isConnected) this.paintFilmstripCell(cell, url);
                });
            }
        }
        document.body.classList.add('clip-trimming');
        this.applyFilmstripHeight(slots);
    }

    applyFilmstripHeight(slots) {
        const strip = this.clipFilmstrip;
        if (!strip || !this.clipFrameAspect) return;
        const cellWidth = (this.progressContainer.clientWidth || 320) / (slots || strip.children.length || 1);
        const height = Math.max(34, Math.min(64, Math.round(cellWidth / this.clipFrameAspect)));
        strip.style.height = `${height}px`;
        document.documentElement.style.setProperty('--filmstrip-h', `${height + 3}px`);
    }

    hideClipFilmstrip() {
        if (this.clipFilmstrip) this.clipFilmstrip.remove();
        this.clipFilmstrip = null;
        document.body.classList.remove('clip-trimming');
    }

    /**
     * Timeline seconds → the clip that holds them, and the offset inside it. An event is a run of
     * one-minute files, so there is no single video to ask for the frame at 90 s.
     */
    clipFrameTarget(event, at) {
        const starts = this.continuousPlayer.segmentStartTimes || [];
        let index = 0;
        for (let i = 0; i < starts.length; i += 1) {
            if (at >= starts[i]) index = i;
            else break;
        }
        const segment = event.segments && event.segments[index];
        const files = (segment && segment.files) || {};
        const file = files.front || Object.values(files)[0];
        if (!file || !file.path) return null;
        return { path: file.path, seconds: Math.max(0, at - (starts[index] || 0)) };
    }

    paintFilmstripCell(cell, url) {
        cell.style.backgroundImage = `url("${url}")`;
        cell.classList.add('has-frame');
        this.fitFilmstripToFrames(url);
    }

    /**
     * A cell is a slice of the ruler, so its width is decided by how many slots fit the timeline,
     * not by the picture in it. Sized that way, every frame either loses its sides or grows bars.
     * The strip's height therefore follows the clip's own ratio — measured once from the first
     * decoded frame, then reused — which is also what the card above it reads from `--filmstrip-h`
     * to know how far to lift while trimming.
     */
    fitFilmstripToFrames(url) {
        const strip = this.clipFilmstrip;
        if (!strip || this.clipFrameAspect) return;
        const image = new Image();
        image.onload = () => {
            if (!image.naturalWidth || !image.naturalHeight || !strip.isConnected) return;
            this.clipFrameAspect = image.naturalWidth / image.naturalHeight;
            this.applyFilmstripHeight(strip.children.length);
        };
        image.src = url;
    }

    updateClipSelection() {
        if (!this.clipStartTime && this.clipStartTime !== 0) return;
        if (!this.clipEndTime) return;
        
        const startPercent = (this.clipStartTime / this.totalDuration) * 100;
        const endPercent = (this.clipEndTime / this.totalDuration) * 100;
        const widthPercent = endPercent - startPercent;
        
        this.clipSelection.style.left = `${startPercent}%`;
        this.clipSelection.style.width = `${widthPercent}%`;
        
        this.clipStartHandle.style.left = `${startPercent}%`;
        this.clipEndHandle.style.left = `${endPercent}%`;

        // The phone export panel shows the same range as two numbers; a handle drag has to move
        // them or the two controls disagree about what will be exported.
        this.viewer?.onClipRangeChanged?.();
    }

    setTotalDuration(duration) {
        this.totalDuration = duration || 0;
        this.updateProgress();
        // Trimming survives a clip switch, but the strip and the selection window belonged to the
        // clip that just closed: the ruler would keep pointing at the old event's seconds.
        if (this.clipModeActive) {
            this.reseedClipRange();
            this.buildClipFilmstrip();
        }
    }

    /** The default trim range around wherever the playhead is, clamped into the new clip. */
    reseedClipRange() {
        const current = this.continuousPlayer.getCurrentTime();
        this.clipStartTime = Math.max(0, current - 30);
        this.clipEndTime = Math.min(this.totalDuration, current + 30);
        if (this.clipEndTime <= this.clipStartTime) {
            this.clipStartTime = 0;
            this.clipEndTime = this.totalDuration;
        }
        this.updateClipSelection();
    }

    async togglePlayPause() {
        if (!this.multiCameraPlayer.isPlaying) await this.multiCameraPlayer.playAll();
        else this.multiCameraPlayer.pauseAll();
    }

    /**
     * Touch version of a handle's `mousedown`. `onDrag` only ever reads `clientX`, so a touch is
     * handed to it in the same shape rather than duplicating the range maths.
     */
    beginClipHandleDrag(flag, e) {
        e.preventDefault();
        e.stopPropagation();
        this[flag] = true;
        this.wasPlaying = this.multiCameraPlayer.isPlaying;
        if (this.wasPlaying) this.multiCameraPlayer.pauseAll();
    }

    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.wasPlaying = this.multiCameraPlayer.isPlaying;
        if (this.wasPlaying) {
            this.multiCameraPlayer.pauseAll();
        }
        this.timePreview.classList.remove('show');
    }

    onDrag(e) {
        if (this.isDraggingClipStart) {
            e.preventDefault();
            const rect = this.progressContainer.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newTime = pos * this.totalDuration;
            
            // Don't let start go past end
            if (newTime < this.clipEndTime) {
                this.clipStartTime = newTime;
                this.updateClipSelection();
            }
            return;
        }
        
        if (this.isDraggingClipEnd) {
            e.preventDefault();
            const rect = this.progressContainer.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newTime = pos * this.totalDuration;
            
            // Don't let end go before start
            if (newTime > this.clipStartTime) {
                this.clipEndTime = newTime;
                this.updateClipSelection();
            }
            return;
        }
        
        if (!this.isDragging) return;
        e.preventDefault();
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        const currentTime = pos * this.totalDuration;

        this.setScrubPercent(pos * 100);
        this.videoTimeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(this.totalDuration)}`;
    }

    async stopDrag(e) {
        if (this.isDraggingClipStart || this.isDraggingClipEnd) {
            this.isDraggingClipStart = false;
            this.isDraggingClipEnd = false;
            if (this.wasPlaying) {
                await this.multiCameraPlayer.playAll();
            }
            return;
        }
        
        if (!this.isDragging) return;
        this.isDragging = false;

        const rect = this.progressContainer.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        if (this.totalDuration > 0) {
            const targetTime = pos * this.totalDuration;

            this.setScrubPercent(pos * 100);
            this.videoTimeDisplay.textContent = `${this.formatTime(targetTime)} / ${this.formatTime(this.totalDuration)}`;

            await this.continuousPlayer.seekToTime(targetTime);
        }

        if (this.wasPlaying) {
            await this.multiCameraPlayer.playAll();
        }
    }

    /**
     * The graph's x axis is seconds from the start of the event, exactly like the scrub bar, so a
     * tap maps straight onto a seek. `totalDuration` stays the authority because the graph only
     * draws when it agrees with it.
     */
    async seekFromSpeedGraph(e) {
        if (!this.totalDuration || !this.speedGraphSpan) return;
        const rect = this.speedGraphContainer.getBoundingClientRect();
        if (!rect.width) return;
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const targetTime = pos * this.totalDuration;

        this.setScrubPercent(pos * 100);
        this.videoTimeDisplay.textContent = `${this.formatTime(targetTime)} / ${this.formatTime(this.totalDuration)}`;
        await this.continuousPlayer.seekToTime(targetTime);
    }

    /** Paint the scrub bar and keep the assistive-technology number in step with it. */
    setScrubPercent(percent) {
        this.progressPlayed.style.width = `${percent}%`;
        this.progressHandle.style.left = `${percent}%`;
        this.progressContainer.setAttribute('aria-valuenow', String(Math.round(percent)));
    }

    showTimePreview(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const pos = Math.max(0, Math.min(1, mouseX / rect.width));
        const time = pos * this.totalDuration;
        this.timePreview.style.left = `${pos * 100}%`;
        this.timePreview.querySelector('.time-preview-time').textContent = this.formatTime(time);
        this.timePreview.classList.add('show');
    }

    hideTimePreview() {
        this.timePreview.classList.remove('show');
        this.updateProgress();
    }

    updateProgress() {
        if (this.totalDuration > 0) {
            this.setScrubPercent((this.continuousPlayer.getCurrentTime() / this.totalDuration) * 100);
        }
        this.updateTimeDisplay();
        this.updateRealTimeClock();

        // timeupdate fires ~4×/s; the write is throttled so seeking does not hammer storage.
        if (isPhoneLayout() && this.viewer.currentEvent && Date.now() - (this.lastPositionSavedAt || 0) > 5000) {
            this.lastPositionSavedAt = Date.now();
            this.viewer.rememberPlaybackPosition();
        }
    }

    setEventStartTime(startTime) {
        this.currentEventStartTime = startTime ? this.parseTimestamp(startTime) : null;
        this.updateRealTimeClock();
    }

    parseTimestamp(timestamp) {
        // Handles "2024-01-01_12-00-00" format
        const [datePart, timePart] = timestamp.split('_');
        return new Date(`${datePart}T${timePart.replace(/-/g, ':')}`);
    }

    updateRealTimeClock() {
        if (!this.realTimeClock) return;

        const currentEvent = this.continuousPlayer.currentEvent;
        if (!currentEvent) {
            this.realTimeClock.classList.remove('visible');
            return;
        }
        
        // Show the clock when there's an event
        this.realTimeClock.classList.add('visible');

        try {
            let newTime;
            const activePlayer = this.multiCameraPlayer.players[this.multiCameraPlayer.activeCamera];
            const segmentTime = activePlayer ? activePlayer.currentTime : 0;

            if (currentEvent.eventType === 'RecentClips') {
                const currentSegmentIndex = this.continuousPlayer.currentSegmentIndex;
                const segment = currentEvent.segments[currentSegmentIndex];
                const activeCameraFile = segment.files[this.multiCameraPlayer.activeCamera];

                if (activeCameraFile && activeCameraFile.name) {
                    const timestampMatch = activeCameraFile.name.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
                    if (timestampMatch) {
                        const segmentStartTime = this.parseTimestamp(timestampMatch[0]);
                        if (segmentStartTime) {
                            newTime = new Date(segmentStartTime.getTime());
                            newTime.setSeconds(newTime.getSeconds() + segmentTime);
                        }
                    }
                }
            } 
            
            // Fallback or default behavior for Sentry/Saved and if RecentClips logic fails
            if (!newTime) {
                if (!this.currentEventStartTime) {
                    this.realTimeClock.classList.remove('visible');
                    return;
                }
                newTime = new Date(this.currentEventStartTime.getTime());
                const totalElapsedTime = this.continuousPlayer.getCurrentTime();
                newTime.setSeconds(newTime.getSeconds() + totalElapsedTime);
            }

            const locale = this.viewer.currentLanguage === 'zh' ? 'zh-CN' : 'en-CA';
            this.realTimeClock.textContent = newTime.toLocaleString(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/\//g, '-').replace(',', '');

        } catch (e) {
            this.realTimeClock.textContent = '--:--:--';
            console.error("Error updating real-time clock:", e);
        }
    }

    updatePlayState(playing) {
        this.isPlaying = playing;
        this.multiCameraPlayer.isPlaying = playing;
        // Watching footage should never end because the phone decided to sleep.
        setNativeKeepScreenOn(playing);
        this.playPauseIcon.src = playing ? 'assets/icons/pause.svg' : 'assets/icons/play.svg';
        this.playPauseIcon.alt = i18n[this.viewer.currentLanguage][playing ? 'pause' : 'play'];
        
        this.resetHideTimer();

        /* Desktop used to grey these two out while playing. On a phone the panel is only ever
           opened while playing, so the same rule made two of its twelve buttons look dead. */
        const phone = isPhoneLayout();
        const revealBtn = this.viewer.dom.revealFileBtn;
        if (revealBtn) {
            revealBtn.disabled = (!phone && playing) || !this.viewer.currentEvent;
        }
        const downloadBtn = this.viewer.dom.downloadFileBtn;
        if (downloadBtn) {
            downloadBtn.disabled = (!phone && playing) || !this.viewer.currentEvent;
        }
        // A frame grab is exactly the thing you want while it is moving, so unlike the two
        // above it only needs something on screen.
        const snapshotBtn = this.viewer.dom.snapshotBtn;
        if (snapshotBtn) {
            snapshotBtn.disabled = !this.viewer.currentEvent;
        }
        if (!playing) this.viewer.rememberPlaybackPosition();
        
        // Enable/disable metadata button
        const metadataBtn = this.viewer.dom.metadataSwitchBtn;
        if (metadataBtn) {
            metadataBtn.disabled = !this.viewer.currentEvent;
        }
        
        // Enable/disable metadata detail button
        const metadataDetailBtn = document.getElementById('metaDetailBtn');
        if (metadataDetailBtn) {
            metadataDetailBtn.disabled = !this.viewer.currentEvent;
        }

        // Nothing to maximise before an event is loaded.
        if (this.viewer.dom.fullscreenBtn) {
            this.viewer.dom.fullscreenBtn.disabled = !this.viewer.currentEvent;
        }
        
        // Enable/disable export metadata button
        const exportMetadataBtn = document.getElementById('exportMetadataBtn');
        if (exportMetadataBtn) {
            exportMetadataBtn.disabled = !this.viewer.currentEvent;
        }
        
        // Enable/disable clip button
        if (this.clipBtn) {
            this.clipBtn.disabled = !this.viewer.currentEvent;
            this.clipBtn.title = i18n[this.viewer.currentLanguage].clipVideo;
        }
        
        // Update confirm clip button title
        if (this.confirmClipBtn) {
            this.confirmClipBtn.title = i18n[this.viewer.currentLanguage].confirmClip;
        }
    }

    updateTimeDisplay() {
        const current = this.formatTime(this.continuousPlayer.getCurrentTime());
        const total = this.formatTime(this.totalDuration);
        this.videoTimeDisplay.textContent = `${current} / ${total}`;
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showControls() {
        this.overlay.classList.add('show');
        if (this.container) {
            this.container.classList.remove('hide-cursor');
        }
    }

    hideControls() {
        // Don't hide if paused, the speed menu or the ⋮ menu is open, or dragging.
        if (!this.isPlaying ||
            this.speedControl?.classList.contains('active') ||
            document.getElementById('headerRight')?.classList.contains('active') ||
            this.isDragging ||
            this.isDraggingClipStart ||
            this.isDraggingClipEnd) {
            return;
        }
        // Only the overlay fades. This used to also take the header and the system bars with it,
        // which read as "the app went fullscreen by itself a few seconds in" — and the next tap
        // undid it, so the picture kept resizing under the user's finger.
        this.overlay.classList.remove('show');
        if (this.container) {
            this.container.classList.add('hide-cursor');
        }
    }
    
    consumeWakeOnlyTap() {
        const wake = !!this.wakeOnlyTap;
        this.wakeOnlyTap = false;
        return wake;
    }

    resetHideTimer() {
        this.showControls();
        
        if (this.hideControlsTimer) {
            clearTimeout(this.hideControlsTimer);
            this.hideControlsTimer = null;
        }

        if (this.isPlaying) {
            this.hideControlsTimer = setTimeout(() => {
                this.hideControls();
            }, 3000); // 3 seconds auto-hide
        }
    }

    setSpeed(rate) {
        this.multiCameraPlayer.setPlaybackRate(rate);
        this.speedBtn.textContent = `${rate}x`;

        this.speedOptions.querySelectorAll('div').forEach(div => {
            div.classList.remove('active');
        });
        // `data-speed` is "2.0" while the rate prints as "2", so compare as numbers.
        const activeOption = Array.from(this.speedOptions.querySelectorAll('div'))
            .find(div => parseFloat(div.dataset.speed) === rate);
        if (activeOption) {
            activeOption.classList.add('active');
        }
    }

    // Reflect a rate the player already holds (restored from storage) onto the overlay's button.
    syncSpeedUI() {
        const rate = this.multiCameraPlayer.playbackRate;
        this.speedBtn.textContent = `${rate}x`;
        this.speedOptions.querySelectorAll('div').forEach(div => {
            div.classList.toggle('active', parseFloat(div.dataset.speed) === rate);
        });
    }

    addEventMarkers(event) {
        if (!this.progressContainer) return;
        // Clear previous markers
        this.progressContainer.querySelectorAll('.event-marker').forEach(m => m.remove());

        if (!event.eventTimestamp || !event.startTime || !this.totalDuration) {
            return;
        }

        try {
            // One helper for both the dot and 「点卡片：跳到事件」, and it is the helper that fixes
            // units: `event.json` writes epoch **seconds** on a lot of firmware, and `new Date()`
            // of that is 1970 — the marker then falls outside the clip and disappears.
            const timeOffset = this.viewer?.eventOffsetSeconds?.(event);
            const eventTime = timeOffset === null || timeOffset === undefined
                ? null : new Date(this.parseTimestamp(event.startTime).getTime() + timeOffset * 1000);

            if (eventTime && timeOffset >= 0 && timeOffset <= this.totalDuration) {
                const positionPercent = (timeOffset / this.totalDuration) * 100;
                // The WebView inherits the handset locale, not the app's, so a zh interface would
            // otherwise announce 「跳到事件时刻 · 7:31:07 AM」.
            const locale = this.viewer.currentLanguage === 'zh' ? 'zh-CN' : undefined;
            const label = `${i18n[this.viewer.currentLanguage].jumpToEvent} · ${eventTime.toLocaleTimeString(locale)}`;

                // A button rather than a div: the touch stylesheet re-enables its pointer-events,
                // so the dot becomes the on-screen answer to 「事件发生在第几秒」. tabIndex -1 keeps
                // it out of the desktop tab ring, where until now it was an inert div.
                const marker = document.createElement('button');
                marker.type = 'button';
                marker.className = 'event-marker';
                marker.tabIndex = -1;
                marker.style.left = `${positionPercent}%`;
                marker.title = label;
                marker.setAttribute('aria-label', label);
                // progressContainer scrubs from its own touchstart, so a tap on the dot would
                // otherwise seek to the drag position instead of the exact event second.
                ['touchstart', 'touchend', 'mousedown'].forEach((type) =>
                    marker.addEventListener(type, (e) => e.stopPropagation()));
                marker.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.continuousPlayer.seekToTime(timeOffset);
                });
                this.progressContainer.appendChild(marker);
            }
        } catch (e) {
            console.error("Error creating event marker:", e);
        }
    }
    
    /**
     * Draw speed graph based on metadata for the entire event
     * @param {Array} allSegmentsMetadata - Array of metadata arrays for each segment
     * @param {Array} segmentDurations - Duration of each segment
     */
    drawSpeedGraph(allSegmentsMetadata, segmentDurations) {
        if (!this.speedGraphCanvas || !this.speedGraphContainer) return;
        this.speedGraphSpan = 0;
        
        // Store data for resize redraw
        this.lastSpeedGraphData = { metadata: allSegmentsMetadata, durations: segmentDurations };
        
        if (!allSegmentsMetadata || allSegmentsMetadata.length === 0) {
            this.speedGraphContainer.classList.remove('visible');
            return;
        }
        
        const canvas = this.speedGraphCanvas;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size for high DPI
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Collect all speed data with normalized time
        const speedData = [];
        let totalDuration = 0;
        
        for (let i = 0; i < allSegmentsMetadata.length; i++) {
            const segmentMeta = allSegmentsMetadata[i];
            const segmentDuration = segmentDurations[i] || 60;
            const segmentStartTime = totalDuration;
            
            if (segmentMeta && segmentMeta.length > 0) {
                for (const item of segmentMeta) {
                    const speedKmh = (item.data?.vehicleSpeedMps || 0) * 3.6;
                    const timeInEvent = segmentStartTime + (item.time || 0);
                    speedData.push({ time: timeInEvent, speed: speedKmh });
                }
            }
            totalDuration += segmentDuration;
        }
        
        if (speedData.length < 2 || totalDuration === 0) {
            this.speedGraphContainer.classList.remove('visible');
            return;
        }
        
        // Sort by time
        speedData.sort((a, b) => a.time - b.time);
        
        // Find max speed for scaling
        const maxSpeed = Math.max(...speedData.map(d => d.speed), 1);
        const padding = { top: 2, bottom: 4 };
        const graphHeight = height - padding.top - padding.bottom;
        
        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(66, 165, 245, 0.5)');
        gradient.addColorStop(1, 'rgba(66, 165, 245, 0.05)');
        
        // Draw filled area
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        for (let i = 0; i < speedData.length; i++) {
            const x = (speedData[i].time / totalDuration) * width;
            const y = height - padding.bottom - (speedData[i].speed / maxSpeed) * graphHeight;
            
            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        // Close the path
        const lastX = (speedData[speedData.length - 1].time / totalDuration) * width;
        ctx.lineTo(lastX, height);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw the line on top
        ctx.beginPath();
        for (let i = 0; i < speedData.length; i++) {
            const x = (speedData[i].time / totalDuration) * width;
            const y = height - padding.bottom - (speedData[i].speed / maxSpeed) * graphHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.strokeStyle = 'rgba(66, 165, 245, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        this.speedGraphSpan = totalDuration;
        this.speedGraphContainer.classList.add('visible');
    }
    
    clearSpeedGraph() {
        if (!this.speedGraphCanvas || !this.speedGraphContainer) return;
        const ctx = this.speedGraphCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.speedGraphCanvas.width, this.speedGraphCanvas.height);
        this.speedGraphContainer.classList.remove('visible');
        this.speedGraphSpan = 0;
        this.lastSpeedGraphData = null;
    }
}

// WebM Duration Fixer
// MediaRecorder 生成的 webm 文件缺少正确的 duration 元数据
// 这个类通过解析和修改 EBML 结构来修复 duration
class WebmDurationFixer {
    constructor() {
        // EBML Element IDs
        this.EBML_ID = 0x1A45DFA3;
        this.SEGMENT_ID = 0x18538067;
        this.INFO_ID = 0x1549A966;
        this.DURATION_ID = 0x4489;
        this.TIMECODE_SCALE_ID = 0x2AD7B1;
        this.CLUSTER_ID = 0x1F43B675;
        this.TIMECODE_ID = 0xE7;
    }

    async fixDuration(blob, durationMs) {
        console.log('[WebmFixer] Starting duration fix, blob size:', blob.size, 'duration:', durationMs, 'ms');
        
        try {
            const buffer = await blob.arrayBuffer();
            const view = new DataView(buffer);
            
            // 查找 Segment 和 Info 元素的位置
            const segmentInfo = this.findElement(view, 0, this.SEGMENT_ID);
            if (!segmentInfo) {
                console.warn('[WebmFixer] Segment not found, returning original blob');
                return blob;
            }
            
            const infoInfo = this.findElement(view, segmentInfo.dataStart, this.INFO_ID);
            if (!infoInfo) {
                console.warn('[WebmFixer] Info not found, returning original blob');
                return blob;
            }
            
            // 查找 TimecodeScale（默认 1000000 纳秒 = 1 毫秒）
            let timecodeScale = 1000000;
            const timecodeScaleInfo = this.findElement(view, infoInfo.dataStart, this.TIMECODE_SCALE_ID, infoInfo.dataStart + infoInfo.dataSize);
            if (timecodeScaleInfo) {
                timecodeScale = this.readUint(view, timecodeScaleInfo.dataStart, timecodeScaleInfo.dataSize);
            }
            
            // 如果没有提供 duration，尝试从最后一个 Cluster 的 Timecode 计算
            if (!durationMs || durationMs <= 0) {
                durationMs = this.calculateDurationFromClusters(view, segmentInfo.dataStart);
            }
            
            if (!durationMs || durationMs <= 0) {
                console.warn('[WebmFixer] Could not determine duration, returning original blob');
                return blob;
            }
            
            // 将毫秒转换为 WebM 时间单位
            const durationWebm = (durationMs * 1000000) / timecodeScale;
            
            // 查找现有的 Duration 元素
            const durationInfo = this.findElement(view, infoInfo.dataStart, this.DURATION_ID, infoInfo.dataStart + infoInfo.dataSize);
            
            if (durationInfo) {
                // Duration 已存在，直接修改
                console.log('[WebmFixer] Duration element found, modifying in place');
                const newBuffer = buffer.slice(0);
                const newView = new DataView(newBuffer);
                this.writeFloat64(newView, durationInfo.dataStart, durationWebm);
                const fixedBlob = new Blob([newBuffer], { type: 'video/webm' });
                console.log('[WebmFixer] Duration fixed successfully');
                return fixedBlob;
            } else {
                // Duration 不存在，需要插入
                console.log('[WebmFixer] Duration element not found, inserting new element');
                return this.insertDurationElement(buffer, infoInfo, durationWebm);
            }
        } catch (error) {
            console.error('[WebmFixer] Error fixing duration:', error);
            return blob;
        }
    }
    
    // 从 Cluster 的 Timecode 计算总时长
    calculateDurationFromClusters(view, segmentStart) {
        let maxTimecode = 0;
        let offset = segmentStart;
        const endOffset = view.byteLength;
        
        while (offset < endOffset - 4) {
            const clusterInfo = this.findElement(view, offset, this.CLUSTER_ID, endOffset);
            if (!clusterInfo) break;
            
            // 查找 Cluster 中的 Timecode
            const timecodeInfo = this.findElement(view, clusterInfo.dataStart, this.TIMECODE_ID, clusterInfo.dataStart + Math.min(clusterInfo.dataSize, 100));
            if (timecodeInfo) {
                const timecode = this.readUint(view, timecodeInfo.dataStart, timecodeInfo.dataSize);
                if (timecode > maxTimecode) {
                    maxTimecode = timecode;
                }
            }
            
            offset = clusterInfo.dataStart + clusterInfo.dataSize;
        }
        
        // 添加一些额外时间（最后一个 cluster 的大概时长）
        return maxTimecode > 0 ? maxTimecode + 1000 : 0;
    }
    
    // 插入 Duration 元素到 Info 中
    insertDurationElement(buffer, infoInfo, durationWebm) {
        // Duration 元素: ID (2 bytes) + Size (1 byte) + Float64 (8 bytes) = 11 bytes
        const durationElementSize = 11;
        const durationElement = new Uint8Array(durationElementSize);
        const durationView = new DataView(durationElement.buffer);
        
        // 写入 Duration ID (0x4489)
        durationElement[0] = 0x44;
        durationElement[1] = 0x89;
        // 写入 Size (8 bytes for float64)
        durationElement[2] = 0x88; // VINT for 8
        // 写入 Float64 值
        durationView.setFloat64(3, durationWebm, false);
        
        // 创建新的 buffer
        const insertPosition = infoInfo.dataStart;
        const newBuffer = new Uint8Array(buffer.byteLength + durationElementSize);
        
        // 复制插入点之前的数据
        newBuffer.set(new Uint8Array(buffer, 0, insertPosition), 0);
        // 插入 Duration 元素
        newBuffer.set(durationElement, insertPosition);
        // 复制插入点之后的数据
        newBuffer.set(new Uint8Array(buffer, insertPosition), insertPosition + durationElementSize);
        
        // 更新 Info 元素的大小
        this.updateElementSize(newBuffer, infoInfo.sizeStart, infoInfo.sizeLength, infoInfo.dataSize + durationElementSize);
        
        const fixedBlob = new Blob([newBuffer], { type: 'video/webm' });
        console.log('[WebmFixer] Duration element inserted, new size:', fixedBlob.size);
        return fixedBlob;
    }
    
    // 更新元素大小（VINT 编码）
    updateElementSize(buffer, sizeStart, sizeLength, newSize) {
        // 简单实现：只支持固定长度的 size 更新
        const view = new DataView(buffer.buffer);
        if (sizeLength === 1) {
            buffer[sizeStart] = 0x80 | newSize;
        } else if (sizeLength === 2) {
            buffer[sizeStart] = 0x40 | (newSize >> 8);
            buffer[sizeStart + 1] = newSize & 0xFF;
        } else if (sizeLength === 3) {
            buffer[sizeStart] = 0x20 | (newSize >> 16);
            buffer[sizeStart + 1] = (newSize >> 8) & 0xFF;
            buffer[sizeStart + 2] = newSize & 0xFF;
        } else if (sizeLength === 4) {
            buffer[sizeStart] = 0x10 | (newSize >> 24);
            buffer[sizeStart + 1] = (newSize >> 16) & 0xFF;
            buffer[sizeStart + 2] = (newSize >> 8) & 0xFF;
            buffer[sizeStart + 3] = newSize & 0xFF;
        }
    }
    
    // 查找 EBML 元素
    findElement(view, startOffset, targetId, endOffset) {
        endOffset = endOffset || view.byteLength;
        let offset = startOffset;
        
        while (offset < endOffset - 4) {
            const { id, idLength } = this.readVintId(view, offset);
            if (idLength === 0) break;
            
            const sizeStart = offset + idLength;
            const { value: size, length: sizeLength } = this.readVint(view, sizeStart);
            if (sizeLength === 0) break;
            
            const dataStart = sizeStart + sizeLength;
            
            if (id === targetId) {
                return {
                    offset,
                    idLength,
                    sizeStart,
                    sizeLength,
                    dataStart,
                    dataSize: size
                };
            }
            
            // 对于容器元素（Segment, Info），不跳过内容
            if (id === this.SEGMENT_ID || id === this.INFO_ID) {
                offset = dataStart;
            } else {
                offset = dataStart + size;
            }
        }
        
        return null;
    }
    
    // 读取 VINT ID
    readVintId(view, offset) {
        if (offset >= view.byteLength) return { id: 0, idLength: 0 };
        
        const first = view.getUint8(offset);
        let idLength = 1;
        let id = first;
        
        if (first >= 0x80) {
            idLength = 1;
        } else if (first >= 0x40) {
            idLength = 2;
        } else if (first >= 0x20) {
            idLength = 3;
        } else if (first >= 0x10) {
            idLength = 4;
        } else {
            return { id: 0, idLength: 0 };
        }
        
        for (let i = 1; i < idLength; i++) {
            id = (id << 8) | view.getUint8(offset + i);
        }
        
        return { id, idLength };
    }
    
    // 读取 VINT 大小
    readVint(view, offset) {
        if (offset >= view.byteLength) return { value: 0, length: 0 };
        
        const first = view.getUint8(offset);
        let length = 1;
        let value = first;
        
        if (first >= 0x80) {
            length = 1;
            value = first & 0x7F;
        } else if (first >= 0x40) {
            length = 2;
            value = first & 0x3F;
        } else if (first >= 0x20) {
            length = 3;
            value = first & 0x1F;
        } else if (first >= 0x10) {
            length = 4;
            value = first & 0x0F;
        } else if (first >= 0x08) {
            length = 5;
            value = first & 0x07;
        } else if (first >= 0x04) {
            length = 6;
            value = first & 0x03;
        } else if (first >= 0x02) {
            length = 7;
            value = first & 0x01;
        } else if (first >= 0x01) {
            length = 8;
            value = 0;
        } else {
            return { value: 0, length: 0 };
        }
        
        for (let i = 1; i < length; i++) {
            value = (value << 8) | view.getUint8(offset + i);
        }
        
        return { value, length };
    }
    
    // 读取无符号整数
    readUint(view, offset, length) {
        let value = 0;
        for (let i = 0; i < length; i++) {
            value = (value << 8) | view.getUint8(offset + i);
        }
        return value;
    }
    
    // 写入 Float64
    writeFloat64(view, offset, value) {
        view.setFloat64(offset, value, false); // big-endian
    }
}

// 全局 WebM Duration Fixer 实例（单例）
const webmDurationFixer = new WebmDurationFixer();

// Video Clip Processor using Canvas API
class VideoClipProcessor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.mediaRecorder = null;
        this.recordingStartTime = null;
        this.ffmpegFixerLoaded = false;
        this.ffmpeg = null;
        // SVG icon cache for metadata overlay
        this.metadataIcons = null;
        this.iconsLoaded = false;
        this.ffmpegChild = null;
        this.isCancelled = false;
    }

    cancelExport() {
        console.warn('[VideoClipProcessor] Cancelling export...');
        this.isCancelled = true;
        if (this.ffmpegChild) {
            try {
                this.ffmpegChild.kill();
                console.log('[VideoClipProcessor] FFmpeg process killed');
            } catch (e) {
                console.error('[VideoClipProcessor] Failed to kill FFmpeg process:', e);
            }
            this.ffmpegChild = null;
        }
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try {
                this.mediaRecorder.stop();
            } catch (e) {}
        }
    }

    /**
     * Create SVG icon as Image object
     * @param {string} svgContent - SVG markup string
     * @param {number} size - Icon size in pixels
     * @returns {Promise<HTMLImageElement>}
     */
    createSvgIcon(svgContent, size = 24) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
            };
            img.src = url;
        });
    }

    /**
     * Load all metadata icons for video export
     */
    async loadMetadataIcons() {
        if (this.iconsLoaded && this.metadataIcons) {
            return this.metadataIcons;
        }

        const iconSize = 24;
        
        // SVG definitions for each icon
        const svgDefs = {
            // Left blinker arrow (green when active)
            blinkerLeft: (active) => `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${iconSize}" height="${iconSize}">
                    <path d="M20 8 L6 24 L20 40 L20 30 L42 30 L42 18 L20 18 Z" 
                          fill="${active ? '#52c41a' : 'rgba(255,255,255,0.3)'}" 
                          stroke="${active ? '#52c41a' : 'rgba(255,255,255,0.5)'}" 
                          stroke-width="2" stroke-linejoin="round"/>
                </svg>`,
            // Right blinker arrow (green when active)
            blinkerRight: (active) => `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${iconSize}" height="${iconSize}">
                    <path d="M28 8 L42 24 L28 40 L28 30 L6 30 L6 18 L28 18 Z" 
                          fill="${active ? '#52c41a' : 'rgba(255,255,255,0.3)'}" 
                          stroke="${active ? '#52c41a' : 'rgba(255,255,255,0.5)'}" 
                          stroke-width="2" stroke-linejoin="round"/>
                </svg>`,
            // Brake icon (brake pedal - red when active)
            brake: (active) => `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${iconSize}" height="${iconSize}">
                    <path d="M821.394 861.482H200.242c-23.709 0-44.013-20.191-45.124-44.975 0 0-30.555-129.896-30.044-166.228 0.325-23.102 15.23-164.3 15.23-164.3 2.449-27.739 18.019-48.258 42.686-48.258h646.233c24.667 0 44.357 21.769 43.759 48.258l14.579 163.622-22.043 166.906c-0.56 24.784-20.414 44.975-44.124 44.975z m24.716-358.364l0.292-10.498c0.23-8.275-6.452-15.059-14.85-15.059H186.497c-8.397 0-14.828 6.784-14.291 15.059l0.681 10.498c0.534 8.232 7.802 14.954 16.153 14.954h641.472c8.35 0 15.37-6.722 15.598-14.954z m8.739 81.304l0.296-10.264c0.233-8.091-6.628-14.724-15.248-14.724H177.735c-8.62 0-15.226 6.633-14.681 14.724l0.691 10.264c0.542 8.049 7.999 14.622 16.571 14.622H838.84c8.574 0 15.777-6.572 16.009-14.622z m6.172 79.506l0.298-10.038c0.235-7.912-6.747-14.399-15.516-14.399H172.234c-8.769 0-15.494 6.487-14.945 14.399l0.695 10.038c0.545 7.872 8.126 14.3 16.847 14.3h669.91c8.721 0 16.047-6.428 16.28-14.3z m-14.901 77.765l0.282-9.819c0.222-7.74-6.466-14.085-14.863-14.085H186.526c-8.397 0-14.841 6.345-14.322 14.085l0.659 9.819c0.517 7.701 7.772 13.989 16.123 13.989h641.548c8.351 0 15.365-6.288 15.586-13.989z m-8.749 76.081l0.267-9.608c0.21-7.573-6.189-13.781-14.222-13.781H206.385c-8.033 0-14.202 6.208-13.711 13.781l0.623 9.608c0.489 7.535 7.425 13.688 15.415 13.688h613.751c7.99 0.001 14.698-6.152 14.908-13.688z m1.869-378.856l36.038-94.167 21.623-119.775H785.183L752.749 356.56l-118.926 82.358H839.24z" fill="${active ? '#ff4d4f' : 'rgba(255,255,255,0.3)'}"/>
                </svg>`,
            // Accelerator/throttle icon (green fill based on percentage)
            accelerator: (percent) => {
                const fillHeight = (percent / 100) * 20;
                const yPos = 26 - fillHeight;
                const color = percent > 0 ? '#73d13d' : 'rgba(255,255,255,0.4)';
                return `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${iconSize}" height="${iconSize}">
                    <rect x="8" y="4" width="16" height="24" rx="3" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
                    <path d="M18 8 L13 16 L16 16 L14 24 L19 15 L16 15 L18 8 Z" fill="${color}"/>
                    ${percent > 0 ? `<rect x="10" y="${yPos}" width="12" height="${fillHeight}" rx="2" fill="#73d13d" opacity="0.9"/>` : ''}
                </svg>`;
            },
            // Autopilot/steering wheel icon (blue when active)
            autopilot: (active) => `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${iconSize}" height="${iconSize}">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="${active ? '#1890ff' : 'rgba(255,255,255,0.6)'}" stroke-width="4"/>
                    <circle cx="32" cy="32" r="8" fill="${active ? '#1890ff' : 'rgba(255,255,255,0.6)'}"/>
                    <rect x="6" y="29" width="17" height="6" rx="2" fill="${active ? '#1890ff' : 'rgba(255,255,255,0.6)'}"/>
                    <rect x="41" y="29" width="17" height="6" rx="2" fill="${active ? '#1890ff' : 'rgba(255,255,255,0.6)'}"/>
                    <rect x="29" y="41" width="6" height="17" rx="2" fill="${active ? '#1890ff' : 'rgba(255,255,255,0.6)'}"/>
                </svg>`
        };

        // Pre-generate common icon states
        this.metadataIcons = {
            blinkerLeftActive: await this.createSvgIcon(svgDefs.blinkerLeft(true), iconSize),
            blinkerLeftInactive: await this.createSvgIcon(svgDefs.blinkerLeft(false), iconSize),
            blinkerRightActive: await this.createSvgIcon(svgDefs.blinkerRight(true), iconSize),
            blinkerRightInactive: await this.createSvgIcon(svgDefs.blinkerRight(false), iconSize),
            brakeActive: await this.createSvgIcon(svgDefs.brake(true), iconSize),
            brakeInactive: await this.createSvgIcon(svgDefs.brake(false), iconSize),
            autopilotActive: await this.createSvgIcon(svgDefs.autopilot(true), iconSize),
            autopilotInactive: await this.createSvgIcon(svgDefs.autopilot(false), iconSize),
            // Generate accelerator icons for 0%, 25%, 50%, 75%, 100%
            accel0: await this.createSvgIcon(svgDefs.accelerator(0), iconSize),
            accel25: await this.createSvgIcon(svgDefs.accelerator(25), iconSize),
            accel50: await this.createSvgIcon(svgDefs.accelerator(50), iconSize),
            accel75: await this.createSvgIcon(svgDefs.accelerator(75), iconSize),
            accel100: await this.createSvgIcon(svgDefs.accelerator(100), iconSize),
            iconSize
        };

        this.iconsLoaded = true;
        return this.metadataIcons;
    }

    /**
     * Get accelerator icon based on percentage
     */
    getAcceleratorIcon(percent) {
        if (!this.metadataIcons) return null;
        if (percent <= 0) return this.metadataIcons.accel0;
        if (percent <= 25) return this.metadataIcons.accel25;
        if (percent <= 50) return this.metadataIcons.accel50;
        if (percent <= 75) return this.metadataIcons.accel75;
        return this.metadataIcons.accel100;
    }

    formatBytes(bytes) {
        if (typeof bytes !== 'number') return 'n/a';
        const MB = 1024 * 1024;
        if (bytes < MB) return `${bytes.toFixed(0)} B`;
        return `${(bytes / MB).toFixed(2)} MB`;
    }

    logMemory(label, extra = {}) {
        try {
            const mem = performance?.memory;
            const payload = {
                ...extra,
            };
            if (mem) {
                payload.usedJSHeapSize = this.formatBytes(mem.usedJSHeapSize);
                payload.totalJSHeapSize = this.formatBytes(mem.totalJSHeapSize);
                payload.jsHeapSizeLimit = this.formatBytes(mem.jsHeapSizeLimit);
            }
            console.log(`[Mem][Grid] ${label}`, payload);
        } catch (err) {
            console.warn('logMemory failed', err);
        }
    }
    
    // Clean up resources to prevent memory leaks
    cleanup() {
        console.log('[VideoClipProcessor] Cleaning up resources...');

        
        // Clear canvas
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Reset canvas size to minimal to free GPU memory
        if (this.canvas) {
            this.canvas.width = 1;
            this.canvas.height = 1;
            this.canvas = null;
        }
        this.ctx = null;
        
        // Clear media recorder
        if (this.mediaRecorder) {
            if (this.mediaRecorder.state !== 'inactive') {
                try {
                    this.mediaRecorder.stop();
                } catch (e) {
                    // Ignore errors when stopping
                }
            }
            this.mediaRecorder = null;
        }
        
        this.recordingStartTime = null;
        
        console.log('[VideoClipProcessor] Cleanup completed');
    }


    // IndexedDB cache for FFmpeg WASM files
    static FFMPEG_CACHE_DB = 'FFmpegWASMCache';
    static FFMPEG_CACHE_STORE = 'files';
    static FFMPEG_CACHE_VERSION = '0.12.6'; // Update when upgrading FFmpeg version
    
    async openCacheDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(VideoClipProcessor.FFMPEG_CACHE_DB, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(VideoClipProcessor.FFMPEG_CACHE_STORE)) {
                    db.createObjectStore(VideoClipProcessor.FFMPEG_CACHE_STORE, { keyPath: 'url' });
                }
            };
        });
    }
    
    async getCachedFile(db, url) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([VideoClipProcessor.FFMPEG_CACHE_STORE], 'readonly');
            const store = transaction.objectStore(VideoClipProcessor.FFMPEG_CACHE_STORE);
            const request = store.get(url);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    
    async setCachedFile(db, url, data, mimeType) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([VideoClipProcessor.FFMPEG_CACHE_STORE], 'readwrite');
            const store = transaction.objectStore(VideoClipProcessor.FFMPEG_CACHE_STORE);
            const request = store.put({ 
                url, 
                data, 
                mimeType, 
                version: VideoClipProcessor.FFMPEG_CACHE_VERSION,
                timestamp: Date.now() 
            });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    
    async toBlobURLWithCache(url, mimeType, progressCallback) {
        try {
            const db = await this.openCacheDB();
            const cached = await this.getCachedFile(db, url);
            
            // Check if cached and version matches
            if (cached && cached.version === VideoClipProcessor.FFMPEG_CACHE_VERSION && cached.data) {
                console.log(`[FFmpeg] Loading from cache: ${url.split('/').pop()}`);
                const blob = new Blob([cached.data], { type: mimeType });
                db.close();
                return URL.createObjectURL(blob);
            }
            
            // Download and cache
            console.log(`[FFmpeg] Downloading: ${url.split('/').pop()}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            
            // Save to cache
            try {
                await this.setCachedFile(db, url, data, mimeType);
                console.log(`[FFmpeg] Cached: ${url.split('/').pop()}`);
            } catch (cacheError) {
                console.warn('[FFmpeg] Failed to cache file:', cacheError);
            }
            
            db.close();
            return URL.createObjectURL(new Blob([arrayBuffer], { type: mimeType }));
        } catch (error) {
            // Fallback to direct download without caching
            console.warn('[FFmpeg] Cache failed, downloading directly:', error);
            const response = await fetch(url);
            const blob = await response.blob();
            return URL.createObjectURL(new Blob([await blob.arrayBuffer()], { type: mimeType }));
        }
    }

    async loadFFmpeg(progressCallback) {
        if (this.ffmpeg && this.ffmpegLoaded) return this.ffmpeg;
        
        // Dynamically load FFmpeg WASM library if not already loaded
        let FFmpegLib = window.FFmpegWASM || window.FFmpeg;
        
        if (!FFmpegLib) {
            progressCallback?.('加载 FFmpeg 库...');
            console.log('[FFmpeg] Dynamically loading FFmpeg WASM library...');
            
            try {
                // Try ESM import first - much better for cross-origin and avoids UMD chunk issues
                // Use version 0.12.6 to match core
                const module = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/+esm');
                FFmpegLib = module;
                console.log('[FFmpeg] FFmpeg library loaded via ESM');
            } catch (esmError) {
                console.warn('[FFmpeg] ESM import failed, falling back to UMD script tag:', esmError);
                // Fallback to the UMD script tag if ESM fails
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    // Use 0.12.6 for better compatibility with core 0.12.6
                    script.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.min.js';
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load FFmpeg library via script tag'));
                    document.head.appendChild(script);
                });
                FFmpegLib = window.FFmpegWASM || window.FFmpeg;
            }

            if (!FFmpegLib) {
                throw new Error('FFmpeg WASM library failed to initialize');
            }
        }

        const { FFmpeg } = FFmpegLib;
        
        if (!this.ffmpeg) {
            this.ffmpeg = new FFmpeg();
            
            this.ffmpeg.on('log', ({ message }) => {
                console.log('[FFmpeg]', message);
            });
            
            // Use arrow function to capture 'this' and access current progress callback
            this.ffmpeg.on('progress', ({ progress, time }) => {
                 // progress is 0-1
                 if (this.ffmpegProgressCallback) {
                     this.ffmpegProgressCallback(`编码中... ${(progress * 100).toFixed(0)}%`);
                 }
            });
        }

        // Check if multi-threading is supported (requires COOP/COEP headers)
        const supportsMultiThread = typeof SharedArrayBuffer !== 'undefined';
        const useMultiThread = supportsMultiThread; // Re-enabled with scale optimization
        
        if (useMultiThread) {
            progressCallback?.('加载 FFmpeg 多线程核心模块...');
            console.log('[FFmpeg] Loading FFmpeg WASM core (multi-threaded)...');
        } else {
            progressCallback?.('加载 FFmpeg 核心模块...');
            console.log('[FFmpeg] Loading FFmpeg WASM core (single-threaded)...');
        }
        
        const startTime = performance.now();
        
        // Load from CDN for web version
        // Use unpkg CDN for ffmpeg core files
        // Must use toBlobURL to convert remote scripts to Blob URLs to bypass CORS Worker restrictions
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const baseURLMT = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd';
        
        try {
            if (useMultiThread) {
                // Multi-threaded version - faster but requires COOP/COEP headers
                progressCallback?.('加载 FFmpeg 核心文件 (使用本地缓存)...');
                const [coreURL, wasmURL, workerURL] = await Promise.all([
                    this.toBlobURLWithCache(`${baseURLMT}/ffmpeg-core.js`, 'text/javascript', progressCallback),
                    this.toBlobURLWithCache(`${baseURLMT}/ffmpeg-core.wasm`, 'application/wasm', progressCallback),
                    this.toBlobURLWithCache(`${baseURLMT}/ffmpeg-core.worker.js`, 'text/javascript', progressCallback),
                ]);
                progressCallback?.('初始化 FFmpeg...');
                await this.ffmpeg.load({ coreURL, wasmURL, workerURL });
                this.ffmpegMultiThread = true;
            } else {
                // Single-threaded version - more stable
                progressCallback?.('加载 FFmpeg 核心文件 (使用本地缓存)...');
                const [coreURL, wasmURL] = await Promise.all([
                    this.toBlobURLWithCache(`${baseURL}/ffmpeg-core.js`, 'text/javascript', progressCallback),
                    this.toBlobURLWithCache(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm', progressCallback),
                ]);
                progressCallback?.('初始化 FFmpeg...');
                await this.ffmpeg.load({ coreURL, wasmURL });
                this.ffmpegMultiThread = false;
            }
        } catch (mtError) {
            // If multi-thread fails, fallback to single-thread
            if (useMultiThread) {
                console.warn('[FFmpeg] Multi-thread load failed, falling back to single-thread:', mtError);
                progressCallback?.('多线程加载失败，使用单线程模式...');
                const [coreURL, wasmURL] = await Promise.all([
                    this.toBlobURLWithCache(`${baseURL}/ffmpeg-core.js`, 'text/javascript', progressCallback),
                    this.toBlobURLWithCache(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm', progressCallback),
                ]);
                await this.ffmpeg.load({ coreURL, wasmURL });
                this.ffmpegMultiThread = false;
            } else {
                throw mtError;
            }
        }
        
        this.ffmpegLoaded = true;
        const loadTime = ((performance.now() - startTime) / 1000).toFixed(1);
        console.log(`[FFmpeg] FFmpeg WASM loaded successfully in ${loadTime}s (multi-thread: ${this.ffmpegMultiThread})`);
        return this.ffmpeg;
    }
    
    // Fix WebM metadata using FFmpeg WASM (for streamed files)
    async fixWebmWithFFmpeg(fileHandle, progressCallback) {
        try {
            progressCallback?.(this.currentLanguage === 'zh' ? '加载 FFmpeg 修复模块...' : 'Loading FFmpeg repair module...');
            const ffmpeg = await this.loadFFmpeg(progressCallback);
            
            // Read the file content
            progressCallback?.(this.currentLanguage === 'zh' ? '读取视频文件...' : 'Reading video file...');
            const file = await fileHandle.getFile();
            const inputData = new Uint8Array(await file.arrayBuffer());
            
            // Write to FFmpeg virtual filesystem
            await ffmpeg.writeFile('input.webm', inputData);
            
            // Run FFmpeg to remux (copy streams, fix metadata)
            progressCallback?.(this.currentLanguage === 'zh' ? '修复视频元数据...' : 'Repairing video metadata...');
            await ffmpeg.exec([
                '-i', 'input.webm',
                '-c', 'copy',
                '-y',
                'output.webm'
            ]);
            
            // Read the fixed file
            const outputData = await ffmpeg.readFile('output.webm');
            
            // Clean up FFmpeg virtual filesystem
            try {
                await ffmpeg.deleteFile('input.webm');
                await ffmpeg.deleteFile('output.webm');
            } catch (e) {
                console.warn('[FFmpeg] Cleanup warning:', e);
            }
            
            // Write back to the original file
            progressCallback?.(this.currentLanguage === 'zh' ? '保存修复后的视频...' : 'Saving repaired video...');
            const writable = await fileHandle.createWritable();
            await writable.write(outputData);
            await writable.close();
            
            console.log('[FFmpeg] WebM metadata fixed successfully');
            return true;
        } catch (error) {
            console.error('[FFmpeg] Failed to fix WebM metadata:', error);
            return false;
        }
    }
    
    // Helper function to fetch file as Uint8Array (replaces @ffmpeg/util fetchFile)
    async fetchFileAsUint8Array(file) {
        if (file instanceof File) {
            return new Uint8Array(await file.arrayBuffer());
        } else if (file instanceof Blob) {
            return new Uint8Array(await file.arrayBuffer());
        } else if (typeof file === 'string') {
            // URL or path
            const response = await fetch(file);
            return new Uint8Array(await response.arrayBuffer());
        } else if (file instanceof Uint8Array) {
            return file;
        }
        throw new Error('Unsupported file type');
    }

    async processWithFFmpegWasm(clipSegments, cameras, startTime, endTime, addTimestamp, mergeGrid, eventStartTime, progressCallback, fileHandle = null) {
        // Set the progress callback for FFmpeg events
        this.ffmpegProgressCallback = progressCallback;
        
        const ffmpeg = await this.loadFFmpeg(progressCallback);
        
        // Track all temporary files to ensure cleanup
        const allCreatedFiles = [];
        
        // Prepare writable stream if available
        let writable = null;
        if (fileHandle) {
             try {
                 writable = await fileHandle.createWritable();
             } catch(e) {
                 console.warn("Create writable stream failed, fallback to memory mode", e);
             }
        }
        
        try {
            // Sort cameras for grid layout consistency
            let sortedCameras = cameras;
            if (mergeGrid) {
                 const order = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
                 sortedCameras = cameras.sort((a, b) => {
                     const idxA = order.indexOf(a);
                     const idxB = order.indexOf(b);
                     return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                 });
            }

            // Load Font if needed (once)
            let fontFile = null;
            if (addTimestamp) {
                progressCallback?.('加载字体...');
                try {
                     const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf';
                     const fontData = await this.fetchFileAsUint8Array(fontUrl);
                     await ffmpeg.writeFile('font.ttf', fontData);
                     fontFile = 'font.ttf';
                     allCreatedFiles.push('font.ttf');
                } catch (e) {
                     console.warn('Font load failed, timestamp disabled', e);
                     addTimestamp = false;
                }
            }

            // Process each segment sequentially to save memory
            // Use TS (MPEG-TS) for intermediate segments as it's streamable
            const tsBlobs = [];
            
            for (let i = 0; i < clipSegments.length; i++) {
                const seg = clipSegments[i];
                const segmentFiles = []; // Files for this segment only
                
                progressCallback?.(`处理片段 ${i + 1}/${clipSegments.length}...`);
                
                const cameraInputs = {};
                
                // 1. Write input files for this segment
                for (const cam of sortedCameras) {
                    const file = seg.segment.files[cam];
                    if (!file) continue;
                    
                    const filename = `s${i}_${cam}.mp4`;
                    let data;
                    if (file.path && window.__TAURI__) {
                         data = await window.__TAURI__.fs.readFile(file.path);
                    } else {
                         data = await this.fetchFileAsUint8Array(file);
                    }
                    
                    await ffmpeg.writeFile(filename, data);
                    segmentFiles.push(filename);
                    if (!cameraInputs[cam]) cameraInputs[cam] = [];
                    cameraInputs[cam].push(filename);
                    
                    // Allow GC
                    data = null;
                }
                
                // 2. Build filter graph for this segment
                let filterComplex = '';
                let inputIdx = 0;
                const cameraStreamNames = [];
                
                // Calculate timestamp for this segment
                let segmentTimestampStr = '';
                if (addTimestamp) {
                    // Base timestamp from file or fallback
                    const firstCam = sortedCameras[0];
                    const firstFile = seg.segment.files[firstCam];
                    const fileName = firstFile?.name || (firstFile?.path ? firstFile.path.split(/[/\\]/).pop() : null);
                    const fullTimestampMatch = fileName?.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
                    
                    let segBaseTime;
                    if (fullTimestampMatch) {
                        segBaseTime = this.parseTimestamp(fullTimestampMatch[1]);
                    } else {
                        segBaseTime = this.parseTimestamp(seg.timestamp);
                    }
                    
                    // Add clipStart offset
                    const currentSegTime = new Date(segBaseTime.getTime() + seg.clipStart * 1000);
                    
                    segmentTimestampStr = currentSegTime.toLocaleString('zh-CN', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    }).replace(/\//g, '-');
                }

                // Build inputs and filters
                for (const cam of sortedCameras) {
                    if (!cameraInputs[cam]) continue;
                    
                    // Since we process one segment, there is only one file per camera here
                    const inputFile = cameraInputs[cam][0];
                    const inputStream = `[${inputIdx}:v]`;
                    inputIdx++;
                    
                    const trimmedStream = `[v_${cam}_trimmed]`;
                    // Use segment-specific clip duration
                    const duration = seg.clipEnd - seg.clipStart;
                    
                    filterComplex += `${inputStream}trim=start=${seg.clipStart}:duration=${duration},setpts=PTS-STARTPTS${trimmedStream};`;
                    cameraStreamNames.push({ name: trimmedStream, cam });
                }
                
                let finalStream = '';
                
                if (mergeGrid && cameraStreamNames.length > 1) {
                    // Grid logic
                    const scaledStreams = [];
                    for (const {name, cam} of cameraStreamNames) {
                        const scaledName = `[v_${cam}_scaled]`;
                        filterComplex += `${name}scale=960:540${scaledName};`;
                        scaledStreams.push(scaledName);
                    }
                    
                    const count = scaledStreams.length;
                    let stackLayout = '';
                    if (count === 4) stackLayout = '0_0|w0_0|0_h0|w0_h0';
                    else if (count === 2) stackLayout = '0_0|w0_0';
                    else if (count === 3) stackLayout = '0_0|w0_0|0_h0';
                    else if (count === 6) stackLayout = '0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0';
                    else stackLayout = '0_0';
                    
                    finalStream = `[v_grid]`;
                    filterComplex += `${scaledStreams.join('')}xstack=inputs=${count}:layout=${stackLayout}${finalStream};`;
                } else {
                    finalStream = cameraStreamNames[0].name;
                }
                
                // Add timestamp
                if (addTimestamp && fontFile) {
                    const stampedStream = `[v_final]`;
                    const escapedTimestamp = segmentTimestampStr.replace(/:/g, '\\:');
                    const drawText = `drawtext=fontfile=${fontFile}:text='${escapedTimestamp}':x=w-text_w-20:y=20:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5`;
                    
                    filterComplex += `${finalStream}${drawText}${stampedStream}`;
                    finalStream = stampedStream;
                }
                
                if (filterComplex.endsWith(';')) filterComplex = filterComplex.slice(0, -1);
                
                const args = [];
                // Add inputs
                for (const cam of sortedCameras) {
                    if (cameraInputs[cam]) args.push('-i', cameraInputs[cam][0]);
                }
                
                args.push('-filter_complex', filterComplex);
                args.push('-map', finalStream);
                
                // Encoding settings
                // Use MPEG-TS for intermediate segments
                args.push('-c:v', 'libx264', '-preset', 'ultrafast');
                // Cap bitrate to control file size and memory usage (4Mbps is sufficient for dashboard)
                args.push('-b:v', '4000k', '-maxrate', '4000k', '-bufsize', '8000k');
                args.push('-crf', '28'); // Slightly better quality than 32, but bitrate cap will control size
                args.push('-g', '48', '-bf', '0', '-pix_fmt', 'yuv420p');
                args.push('-f', 'mpegts'); // Output as TS
                
                const tempOutName = `temp_out_${i}.ts`;
                args.push(tempOutName);
                
                console.log(`[FFmpeg] Processing segment ${i}`, args.join(' '));
                await ffmpeg.exec(args);
                
                // Read temp file to JS memory
                const segData = await ffmpeg.readFile(tempOutName);
                
                if (writable) {
                     // Streaming write to disk directly
                     progressCallback?.(`写入磁盘 (段 ${i + 1})...`);
                     await writable.write(segData);
                } else {
                     // Convert to Blob immediately
                     const segBlob = new Blob([segData.buffer], { type: 'video/mp2t' });
                     tsBlobs.push(segBlob);
                }
                
                // Clean up WASM memory
                await ffmpeg.deleteFile(tempOutName);
                
                // CLEANUP INPUTS IMMEDIATELY
                for (const f of segmentFiles) {
                    await ffmpeg.deleteFile(f);
                }
                
                // Explicitly nullify
                data = null; 
            }
            
            if (writable) {
                 await writable.close();
                 this.ffmpegProgressCallback = null;
                 // Return empty blob to satisfy signature, but with saved: true
                 return new Blob([], { type: 'video/mp2t' });
            }
            
            // 3. Concat all segments (Memory Mode Fallback)
            progressCallback?.('合并片段...');
            
            try {
                const allTsBlob = new Blob(tsBlobs, { type: 'video/mp2t' });
                
                // Only try to remux if small enough
                const MAX_SAFE_SIZE = 500 * 1024 * 1024; // Lower limit to 500MB
                if (allTsBlob.size > MAX_SAFE_SIZE) {
                    console.warn('[FFmpeg] Total size too large, returning TS file');
                    return allTsBlob;
                }

                const allTsBuffer = await allTsBlob.arrayBuffer();
                const allTsUint8 = new Uint8Array(allTsBuffer);
                
                await ffmpeg.writeFile('all.ts', allTsUint8);
                allCreatedFiles.push('all.ts');
                
                progressCallback?.('封装 MP4...');
                const args = [
                    '-i', 'all.ts',
                    '-c', 'copy',
                    '-movflags', '+faststart',
                    'output.mp4'
                ];
                
                await ffmpeg.exec(args);
                const finalOutputData = await ffmpeg.readFile('output.mp4');
                allCreatedFiles.push('output.mp4');
                
                const blob = new Blob([finalOutputData.buffer], { type: 'video/mp4' });
                
                // Final cleanup
                for (const f of allCreatedFiles) {
                    try { await ffmpeg.deleteFile(f); } catch {}
                }
                
                this.ffmpegProgressCallback = null;
                return blob;
                
            } catch (remuxError) {
                console.warn('[FFmpeg] MP4 Remux failed, falling back to TS:', remuxError);
                const finalBlob = new Blob(tsBlobs, { type: 'video/mp2t' });
                for (const f of allCreatedFiles) {
                    try { await ffmpeg.deleteFile(f); } catch {}
                }
                this.ffmpegProgressCallback = null;
                return finalBlob; 
            }

        } catch (e) {
            console.error('FFmpeg WASM Error:', e);
            if (writable) {
                 try { await writable.close(); } catch {}
            }
            this.ffmpegProgressCallback = null;
            // Attempt cleanup
            for (const f of allCreatedFiles) {
                try { await ffmpeg.deleteFile(f); } catch {}
            }
            throw new Error('浏览器导出失败: ' + e.message + "\\n建议使用 Chrome 浏览器或尝试本地应用模式。");
        }
    }

    initCanvas(width, height) {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    async checkFFmpeg() {
        const tauri = window.__TAURI__;
        if (!tauri || !tauri.shell) {
            console.warn('[FFmpeg] Tauri shell not available');
            return false;
        }
        try {
            console.log('[FFmpeg] Checking bundled FFmpeg availability...');
            // Try bundled FFmpeg first (sidecar)
            try {
                const sidecarCommand = tauri.shell.Command.sidecar('binaries/ffmpeg', ['-version']);
                const sidecarOutput = await sidecarCommand.execute();
                if (sidecarOutput.code === 0) {
                    console.log('[FFmpeg] Bundled FFmpeg available');
                    this.ffmpegCommand = 'sidecar';
                    return true;
                }
            } catch (e) {
                console.log('[FFmpeg] Bundled FFmpeg not available, trying system FFmpeg...');
            }
            
            // Fallback to system FFmpeg
            const command = tauri.shell.Command.create('ffmpeg', ['-version']);
            const output = await command.execute();
            console.log('[FFmpeg] System FFmpeg check result:', output);
            if (output.code === 0) {
                this.ffmpegCommand = 'system';
                return true;
            }
            return false;
        } catch (e) {
            console.warn('[FFmpeg] Check failed:', e);
            return false;
        }
    }
    
    createFFmpegCommand(args) {
        const tauri = window.__TAURI__;
        if (this.ffmpegCommand === 'sidecar') {
            return tauri.shell.Command.sidecar('binaries/ffmpeg', args);
        }
        return tauri.shell.Command.create('ffmpeg', args);
    }

    /**
     * Execute FFmpeg command with real-time progress updates
     */
    async executeFFmpegWithProgress(args, totalDuration, progressCallback, progressPrefix) {
        if (!progressPrefix) {
            progressPrefix = this.currentLanguage === 'zh' ? '编码中...' : 'Encoding...';
        }
        const tauri = window.__TAURI__;
        const command = this.createFFmpegCommand(args);
        
        return new Promise((resolve, reject) => {
            let stderr = '';
            let resolved = false;
            let lastProgressTime = Date.now();
            let progressCheckInterval = null;
            let childProcess = null;
            
            const cleanup = () => {
                if (progressCheckInterval) {
                    clearInterval(progressCheckInterval);
                    progressCheckInterval = null;
                }
            };
            
            const onFinished = data => {
                if (resolved) return;
                resolved = true;
                cleanup();
                
                console.log('[FFmpeg] Process finished/terminated:', data);
                const code = typeof data === 'number' ? data : (data && typeof data.code === 'number' ? data.code : 0);
                
                if (code === 0) {
                    resolve({ code: 0, stderr });
                } else {
                    const lastError = stderr.split('\n').filter(l => l.includes('Error') || l.includes('error')).pop() || '未知错误';
                    reject(new Error(`FFmpeg 错误 (code ${code}): ${lastError}`));
                }
            };

            command.on('close', onFinished);
            command.on('terminated', onFinished);
            
            command.on('error', error => {
                if (resolved) return;
                resolved = true;
                cleanup();
                console.error('[FFmpeg] Process error:', error);
                reject(error);
            });
            
            command.on('stdout', line => {
                // Consume stdout to prevent buffer fill
                lastProgressTime = Date.now();
                if (line && line.includes('progress=end')) {
                    console.log('[FFmpeg] Progress end detected in stdout');
                }
            });
            
            command.on('stderr', line => {
                // line is usually a string in Tauri v2 shell plugin
                stderr += line + '\n';
                lastProgressTime = Date.now();
                
                // Detailed logging for debugging
                if (line.includes('Error') || line.includes('error')) {
                    console.error('[FFmpeg stderr]', line);
                }
                
                // Keep stderr buffer manageable
                if (stderr.length > 20000) {
                    stderr = stderr.substring(stderr.length - 10000);
                }
                
                // Parse FFmpeg progress: time=00:00:05.12 or time=00:00:05.123
                const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
                if (timeMatch && totalDuration > 0) {
                    const hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    const seconds = parseInt(timeMatch[3], 10);
                    const msStr = timeMatch[4];
                    // Handle different millisecond lengths (.1, .12, .123)
                    const ms = parseFloat("0." + msStr);
                    const currentTime = hours * 3600 + minutes * 60 + seconds + ms;
                    
                    const progress = Math.min(99, Math.round((currentTime / totalDuration) * 100));
                    progressCallback?.(`${progressPrefix} ${progress}%`);
                    
                    // Check if we've reached near the end
                    if (currentTime >= totalDuration - 0.5) {
                        console.log('[FFmpeg] Reached end of expected duration, waiting for process to finish...');
                    }
                }
            });
            
            console.log('[FFmpeg] Spawning process with args:', args.slice(0, 10).join(' '), '...');
            command.spawn().then(child => {
                childProcess = child;
                this.ffmpegChild = child;
                console.log('[FFmpeg] Process spawned successfully, PID:', child.pid);
                
                // Set up a watchdog to detect if FFmpeg has stalled
                // Check every 30 seconds if we've received any output
                progressCheckInterval = setInterval(() => {
                    const timeSinceLastProgress = Date.now() - lastProgressTime;
                    console.log(`[FFmpeg Watchdog] Time since last output: ${Math.round(timeSinceLastProgress / 1000)}s`);
                    
                    // If no output for 2 minutes, something is wrong
                    if (timeSinceLastProgress > 120000 && !resolved) {
                        console.warn('[FFmpeg Watchdog] No output for 2 minutes, process may be stuck');
                        console.warn('[FFmpeg Watchdog] Last stderr:', stderr.slice(-500));
                    }
                }, 30000);
            }).catch(err => {
                cleanup();
                console.error('[FFmpeg] Failed to spawn process:', err);
                reject(err);
            });
        });
    }

    async processWithFFmpeg(clipSegments, camera, progressCallback) {
        const tauri = window.__TAURI__;
        const fs = tauri.fs;
        const shell = tauri.shell;
        
        // Use the directory of the first file for output, temp dir for intermediate files
        const firstFile = clipSegments[0].segment.files[camera];
        if (!firstFile || !firstFile.path) throw new Error('File path not found');
        
        // Get directory path (handle both forward and back slashes)
        const pathSeparator = firstFile.path.includes('\\') ? '\\' : '/';
        const lastSepIdx = firstFile.path.lastIndexOf(pathSeparator);
        const outputDir = lastSepIdx !== -1 ? firstFile.path.substring(0, lastSepIdx) : '.';
        
        // Use system temp directory for intermediate files
        let workDir = await getTempDir();
        const workSeparator = workDir.includes('\\') ? '\\' : '/';
        
        const timestamp = new Date().getTime();
        const listFilename = `ffmpeg_list_${camera}_${timestamp}.txt`;
        const outputFilename = `export_${camera}_${timestamp}.mp4`;
        
        const listPath = `${workDir}${workSeparator}${listFilename}`;
        const outputPath = `${outputDir}${pathSeparator}${outputFilename}`;
        
        // Generate list content
        let listContent = '';
        for (const seg of clipSegments) {
            const file = seg.segment.files[camera];
            if (!file || !file.path) continue;
            
            // For ffmpeg concat, paths should be escaped
            // FFmpeg concat demuxer needs forward slashes even on Windows
            const safePath = file.path.replace(/\\/g, '/').replace(/'/g, "'\\''");
            listContent += `file '${safePath}'\n`;
            listContent += `inpoint ${seg.clipStart}\n`;
            listContent += `outpoint ${seg.clipEnd}\n`;
        }
        
        try {
            // Write list file
            await fs.writeTextFile(listPath, listContent);
            
            // ffmpeg args
            const args = [
                '-f', 'concat',
                '-safe', '0',
                '-i', listPath,
                '-c', 'copy',
                '-y',
                outputPath
            ];
            
            console.log('Running ffmpeg:', args);
            progressCallback?.(this.currentLanguage === 'zh' ? `FFmpeg 极速导出中...` : `FFmpeg Fast Exporting...`);
            
            const totalDuration = clipSegments.reduce((sum, seg) => {
                const dur = (seg.clipEnd || 60) - (seg.clipStart || 0);
                return sum + (dur > 0 ? dur : 0);
            }, 0);
            const output = await this.executeFFmpegWithProgress(args, totalDuration, progressCallback, this.currentLanguage === 'zh' ? '极速导出...' : 'Fast Exporting...');
            
            // Read result
            const binary = await fs.readFile(outputPath);
            const blob = new Blob([binary], { type: 'video/mp4' });
            
            // Cleanup
            await fs.remove(listPath);
            await fs.remove(outputPath);
            
            return blob;
            
        } catch (e) {
            // Cleanup on error
            try { await fs.remove(listPath); } catch(_) {}
            try { await fs.remove(outputPath); } catch(_) {}
            throw e;
        }
    }




    async processClip(segments, cameras, startTime, endTime, addTimestamp, addMetadata, mergeGrid, eventStartTime, progressCallback, useLocalFFmpeg = false, language = 'zh', fileHandle = null, metadataManager = null) {
        try {
            // Reset cancellation state
            this.isCancelled = false;
            // Store language for use in processing methods
            this.currentLanguage = language;
            this.metadataManager = metadataManager;
            // Calculate which segments are needed
            const clipSegments = this.getSegmentsForTimeRange(segments, startTime, endTime);
            
            if (clipSegments.length === 0) {
                throw new Error('未找到有效的视频片段');
            }

            // 1. Use local FFmpeg if requested (Tauri desktop only)
            if (useLocalFFmpeg && window.__TAURI__) {
                const hasFFmpeg = await this.checkFFmpeg();
                if (!hasFFmpeg) {
                    throw new Error('未检测到 FFmpeg，请先安装 FFmpeg 并确保其在系统 PATH 中');
                }
                
                console.log('[VideoClipProcessor] Using local FFmpeg for export');
                
                if (mergeGrid && cameras.length > 1) {
                    // FFmpeg grid merge with optional timestamp and metadata
                    progressCallback?.(this.currentLanguage === 'zh' ? 'FFmpeg 合成四宫格视频...' : 'FFmpeg Merging Grid Video...');
                    const result = await this.processWithFFmpegGrid(clipSegments, cameras, addTimestamp, addMetadata, eventStartTime, progressCallback);
                    return [result];
                } else {
                    // FFmpeg single camera export
                    const results = [];
                    for (const camera of cameras) {
                        if (this.isCancelled) throw new Error(this.currentLanguage === 'zh' ? '导出已取消' : 'Export Cancelled');
                        progressCallback?.(this.currentLanguage === 'zh' ? `FFmpeg 极速导出 ${camera}...` : `FFmpeg Fast Exporting ${camera}...`);
                        const result = await this.processWithFFmpegFull(clipSegments, camera, addTimestamp, addMetadata, eventStartTime, progressCallback);
                        results.push(result);
                    }
                    return results;
                }
            }

            // 2. Fallback: Try native FFmpeg for fast copy (no timestamp, no grid, no metadata) - Tauri only
            const hasFFmpeg = await this.checkFFmpeg();
            if (hasFFmpeg && !addTimestamp && !addMetadata && !mergeGrid) {
                 const results = [];
                 for (const camera of cameras) {
                     progressCallback?.(`极速导出 ${camera}...`);
                     const blob = await this.processWithFFmpeg(clipSegments, camera, progressCallback);
                     results.push({ camera, blob });
                 }
                 return results;
            }
            
            // 3. Web FFmpeg (WASM) for Grid or Timestamp in Browser
            // If we have fileHandle (streaming mode), force use Web FFmpeg logic even if cameras.length=1
            // But currently processWithFFmpegWasm is only called if we implement it here.
            // Wait, previous logic called createGridVideoFromSegments or processVideoWithTimestamp (Canvas).
            // We want to replace Canvas with FFmpegWASM for better quality if possible, OR just optimize processWithFFmpegWasm
            
            // Previously, there was NO call to processWithFFmpegWasm in processClip in the provided snippet!
            // Wait, let's check the original code again.
            // Ah, the original code used Canvas (createGridVideoFromSegments / processVideoWithTimestamp).
            // But I modified processWithFFmpegWasm earlier. Where is it called?
            // It seems processWithFFmpegWasm was added but maybe not hooked up in processClip in the original code, 
            // OR I missed where it was called.
            
            // Let's hook it up. If fileHandle is provided, OR if we want to use WASM instead of Canvas.
            // Using WASM is generally better quality than Canvas recording but slower.
            // If the user is on Web, we prefer WASM for Grid/Timestamp to avoid re-encoding loss of Canvas recording (which is real-time-ish).
            
            // However, to be safe and stick to the "fix memory" goal:
            // If fileHandle is present, we MUST use processWithFFmpegWasm because Canvas recording doesn't support stream writing easily (MediaRecorder returns chunks, we could write chunks...).
            // Actually MediaRecorder chunks CAN be written to fileHandle!
            // But processWithFFmpegWasm was the one I optimized.
            
            // Let's use processWithFFmpegWasm if fileHandle is present OR if we want higher quality.
            // For now, let's only enable it if fileHandle is present to test the fix.
            
            if (fileHandle) {
                 progressCallback?.('正在使用流式导出模式 (Canvas)...');
                 
                 // 如果是合并四宫格
                 if (mergeGrid && cameras.length > 1) {
                     const result = await this.createGridVideoFromSegments(
                        clipSegments,
                        cameras,
                        startTime,
                        endTime,
                        addTimestamp,
                        addMetadata,
                        eventStartTime,
                        progressCallback,
                        fileHandle
                    );
                    // result 可能是 Blob 或 { saved: true, blob: ... }
                    const blob = result.saved ? result.blob : result;
                    const saved = !!result.saved;
                    return [{ camera: 'grid', blob: blob, saved: saved }];
                 } else {
                     // 单个摄像头处理
                     const results = [];
                     for (const camera of cameras) {
                         const result = await this.processVideoWithTimestamp(
                            clipSegments, 
                            camera, 
                            startTime, 
                            endTime, 
                            addTimestamp,
                            addMetadata,
                            eventStartTime,
                            progressCallback,
                            fileHandle
                        );
                        const blob = result.saved ? result.blob : result;
                        const saved = !!result.saved;
                        results.push({ camera, blob: blob, saved: saved });
                     }
                     return results;
                 }
            }

            // 3. If merging as grid, process all cameras together (Canvas method)
            if (mergeGrid && cameras.length > 1) {
                progressCallback?.('合成四宫格视频...');
                const gridBlob = await this.createGridVideoFromSegments(
                    clipSegments,
                    cameras,
                    startTime,
                    endTime,
                    addTimestamp,
                    addMetadata,
                    eventStartTime,
                    progressCallback
                );
                return [{ camera: 'grid', blob: gridBlob }];
            }
            
            // 5. Otherwise, process each camera individually (Canvas method - fallback)
            const results = [];
            
            for (const camera of cameras) {
                progressCallback?.(`处理 ${camera} 摄像头...`);
                
                const videoBlob = await this.processVideoWithTimestamp(
                    clipSegments, 
                    camera, 
                    startTime, 
                    endTime, 
                    addTimestamp,
                    addMetadata,
                    eventStartTime,
                    progressCallback
                );
                
                results.push({ camera, blob: videoBlob });
            }
            
            return results;
            
        } catch (error) {
            console.error('Video processing error:', error);
            throw error;
        } finally {
            // Clean up canvas and media recorder resources
            this.cleanup();
        }
    }
    
    // FFmpeg full export with optional timestamp and metadata (single camera)
    async processWithFFmpegFull(clipSegments, camera, addTimestamp, addMetadata, eventStartTime, progressCallback) {
        const tauri = window.__TAURI__;
        const fs = tauri.fs;
        const shell = tauri.shell;
        
        const firstFile = clipSegments[0].segment.files[camera];
        if (!firstFile || !firstFile.path) throw new Error(`${camera} 摄像头文件路径未找到`);
        
        const pathSeparator = firstFile.path.includes('\\') ? '\\' : '/';
        const lastSepIdx = firstFile.path.lastIndexOf(pathSeparator);
        const outputDir = lastSepIdx !== -1 ? firstFile.path.substring(0, lastSepIdx) : '.';
        
        // Use system temp directory for intermediate files
        let workDir = await getTempDir();
        const workSeparator = workDir.includes('\\') ? '\\' : '/';
        
        const timestamp = new Date().getTime();
        const listFilename = `ffmpeg_list_${camera}_${timestamp}.txt`;
        const outputFilename = `TeslaCam_${camera}_${timestamp}.mp4`;
        
        const listPath = `${workDir}${workSeparator}${listFilename}`;
        const outputPath = `${outputDir}${pathSeparator}${outputFilename}`;
        
        // Track temp files for cleanup
        const tempFiles = [listPath];
        
        // Generate concat list
        let listContent = '';
        for (const seg of clipSegments) {
            const file = seg.segment.files[camera];
            if (!file || !file.path) continue;
            const safePath = file.path.replace(/\\/g, '/').replace(/'/g, "'\\''");
            listContent += `file '${safePath}'\n`;
            listContent += `inpoint ${seg.clipStart}\n`;
            listContent += `outpoint ${seg.clipEnd}\n`;
        }
        
        try {
            await fs.writeTextFile(listPath, listContent);
            
            // Calculate total duration early for trim filters
            const totalDuration = clipSegments.reduce((sum, seg) => {
                const dur = (seg.clipEnd || 60) - (seg.clipStart || 0);
                return sum + (dur > 0 ? dur : 0);
            }, 0);
            
            // Generate PNG overlay for metadata if enabled
            let allMetadata = null;
            let overlayInfo = null;
            
            if (addMetadata && this.metadataManager) {
                progressCallback?.(`加载 ${camera} 元数据...`);
                allMetadata = await this.loadMetadataForSegments(clipSegments, camera, progressCallback);
                
                if (allMetadata && allMetadata.length > 0) {
                    // Tesla cameras are typically 1280x960
                    const videoWidth = 1280;
                    const videoHeight = 960;
                    
                    progressCallback?.(`生成元数据图标覆盖层...`);
                    try {
                        overlayInfo = await metadataOverlayGenerator.generateOverlayPngs(
                            allMetadata,
                            clipSegments,
                            workDir,
                            videoWidth,
                            videoHeight,
                            progressCallback,
                            this.currentLanguage
                        );
                        if (overlayInfo) {
                            tempFiles.push(overlayInfo.pngDir);
                            console.log('[FFmpeg] PNG overlays generated:', overlayInfo.pngDir);
                        }
                    } catch (pngError) {
                        console.error('[FFmpeg] PNG overlay generation failed:', pngError);
                        overlayInfo = null;
                    }
                }
            }
            
            // Build filter chain
            let filterComplex = '';
            let inputArgs = ['-fflags', '+genpts', '-f', 'concat', '-safe', '0', '-i', listPath];
            
            console.log(`[FFmpeg] Exporting ${camera}, calculated duration: ${totalDuration}s`);

            let currentLabel = '[0:v]';
            
            // Normalize video stream if we are re-encoding (timestamp or metadata enabled)
            // This is CRITICAL to fix duration shortening issues caused by PTS gaps in concat demuxer
            if (addTimestamp || addMetadata) {
                // Use fps filter to fill gaps, setpts to ensure continuous timeline from 0
                // and trim to force the expected duration.
                filterComplex = `${currentLabel}fps=fps=30,setpts=PTS-STARTPTS,trim=duration=${totalDuration}[v_sync]`;
                currentLabel = '[v_sync]';
            }
            
            // Add timestamp filter if enabled
            if (addTimestamp) {
                const firstFileRef = clipSegments[0].segment.files[camera];
                const fileName = firstFileRef.name || firstFileRef.path.split(/[/\\]/).pop();
                const fullTimestampMatch = fileName.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
                
                let firstSegTime;
                if (fullTimestampMatch) {
                    firstSegTime = this.parseTimestamp(fullTimestampMatch[1]);
                } else {
                    firstSegTime = this.parseTimestamp(clipSegments[0].timestamp);
                }
                
                const clipStartTimeObj = new Date(firstSegTime.getTime() + clipSegments[0].clipStart * 1000);
                const startEpoch = Math.floor(clipStartTimeObj.getTime() / 1000);
                
                let fontOption = "";
                if (navigator.userAgent.includes('Windows')) {
                    fontOption = "fontfile='C\\:/Windows/Fonts/msyh.ttc':";
                } else if (navigator.userAgent.includes('Mac')) {
                    // Escape spaces for FFmpeg filter
                    fontOption = "fontfile='/System/Library/Fonts/Hiragino\\ Sans\\ GB.ttc':";
                }

                // FFmpeg pts:localtime only accepts 2 arguments (localtime and epoch timestamp)
                const drawtext = `drawtext=${fontOption}text='%{pts\\:localtime\\:${startEpoch}}':x=w-text_w-20:y=20:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5`;
                filterComplex += (filterComplex ? ';' : '') + `${currentLabel}${drawtext}[ts]`;
                currentLabel = '[ts]';
            }
            
            // Add PNG overlay filters for metadata
            if (addMetadata && overlayInfo && overlayInfo.pngPaths && overlayInfo.pngPaths.size > 0) {
                const overlayResult = await metadataOverlayGenerator.generateOverlayFilter(
                    allMetadata,
                    clipSegments,
                    overlayInfo.pngPaths,
                    workDir,
                    1 // Video is input 0
                );
                
                if (overlayResult.concatFile) {
                    // Add background and concat stream to inputs
                    const bgPath = overlayInfo.pngPaths.get('__background__');
                    // Use -loop 1 for background image
                    inputArgs.push('-loop', '1', '-i', bgPath);
                    const bgIdx = 1; // Video is 0, background is 1

                    inputArgs.push('-f', 'concat', '-safe', '0', '-i', overlayResult.concatFile);
                    const metaIdx = 2; // Concat stream is 2

                    tempFiles.push(overlayResult.concatFile);

                    // Overlay background then metadata stream
                    const xExpr = '(W-w)/2';
                    const yExpr = '(H*0.97-h/2)';
                    
                    // Background and metadata streams also need synchronization
                    const bgTrim = `[${bgIdx}:v]trim=duration=${totalDuration},setpts=PTS-STARTPTS[bg_trimmed]`;
                    const metaSync = `[${metaIdx}:v]setpts=PTS-STARTPTS[meta_sync]`;
                    
                    // Apply overlays using synchronized streams
                    const ovPart = `${bgTrim};${metaSync};${currentLabel}[bg_trimmed]overlay=x=${xExpr}:y=${yExpr}:eof_action=pass[bg_v];[bg_v][meta_sync]overlay=x=${xExpr}:y=${yExpr}:eof_action=pass[ov]`;
                    
                    filterComplex += (filterComplex ? ';' : '') + ovPart;
                    currentLabel = '[ov]';
                }
            }
            
            let args;
            if (filterComplex) {
                // With filters: need re-encode
                // Use filter_complex_script to avoid command line length limits on Windows
                const filterScriptPath = `${workDir}${pathSeparator}ffmpeg_filter_${timestamp}.txt`;
                console.log('[FFmpeg] Filter complex content:', filterComplex);
                console.log('[FFmpeg] Current label for -map:', currentLabel);
                await fs.writeTextFile(filterScriptPath, filterComplex);
                tempFiles.push(filterScriptPath);

                args = [
                    ...inputArgs,
                    '-filter_complex_script', filterScriptPath,
                    '-map', currentLabel,
                    '-map', '0:a?',
                    '-c:v', 'libx264',
                    '-preset', 'fast',
                    '-crf', '23',
                    '-c:a', 'aac',
                    '-t', String(Math.ceil(totalDuration + 0.5)),
                    '-y',
                    outputPath
                ];
            } else {
                // Without filters: fast copy
                args = [
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', listPath,
                    '-c', 'copy',
                    '-y',
                    outputPath
                ];
            }
            
            console.log('[FFmpeg] Running:', args.join(' '));
            progressCallback?.(this.currentLanguage === 'zh' ? `FFmpeg 处理 ${camera}...` : `FFmpeg Processing ${camera}...`);
            
            // totalDuration already calculated at line 4166
            const output = await this.executeFFmpegWithProgress(args, totalDuration, progressCallback, this.currentLanguage === 'zh' ? `处理 ${camera}...` : `Processing ${camera}...`);
            progressCallback?.(this.currentLanguage === 'zh' ? `处理 ${camera}: 100%` : `Processing ${camera}: 100%`);
            
            console.log('[FFmpeg] Finished processing camera:', camera);
            
            if (output.code !== 0) {
                throw new Error(`FFmpeg 错误 (code ${output.code}): ${output.stderr || output.stdout || '未知错误'}`);
            }
            
            // Cleanup temp files
            for (const f of tempFiles) {
                try { 
                    // Check if it's a directory (PNG overlay dir)
                    if (f.includes('overlay_pngs_')) {
                        await this.removeDirectory(f, fs);
                    } else {
                        await fs.remove(f); 
                    }
                } catch(_) {}
            }
            
            return { camera, path: outputPath, isFile: true };
            
        } catch (e) {
            // Cleanup on error
            for (const f of tempFiles) {
                try { 
                    if (f.includes('overlay_pngs_')) {
                        await this.removeDirectory(f, fs);
                    } else {
                        await fs.remove(f); 
                    }
                } catch(_) {}
            }
            try { await fs.remove(outputPath); } catch(_) {}
            throw e;
        }
    }
    
    // Helper to remove directory recursively
    async removeDirectory(dirPath, fs) {
        try {
            const entries = await fs.readDir(dirPath);
            for (const entry of entries) {
                const entryPath = entry.path || `${dirPath}/${entry.name}`;
                if (entry.children !== undefined) {
                    await this.removeDirectory(entryPath, fs);
                } else {
                    await fs.remove(entryPath);
                }
            }
            await fs.remove(dirPath);
        } catch (e) {
            console.warn('[FFmpeg] Failed to remove directory:', dirPath, e);
        }
    }
    
    // FFmpeg grid merge export with optional timestamp and metadata
    async processWithFFmpegGrid(clipSegments, cameras, addTimestamp, addMetadata, eventStartTime, progressCallback) {
        const tauri = window.__TAURI__;
        const fs = tauri.fs;
        const shell = tauri.shell;

        // Sort cameras for 6-grid layout
        let sortedCameras = [...cameras];
        if (cameras.length > 4) {
            const sortOrder = ['left_pillar', 'front', 'right_pillar', 'left', 'back', 'right'];
            sortedCameras.sort((a, b) => {
                const idxA = sortOrder.indexOf(a);
                const idxB = sortOrder.indexOf(b);
                return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            });
        } else {
             // Standard layout for <= 4 cameras
             const sortOrder = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
             sortedCameras.sort((a, b) => {
                const idxA = sortOrder.indexOf(a);
                const idxB = sortOrder.indexOf(b);
                return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            });
        }
        
        // Filter out cameras that have no files in the selected range to prevent FFmpeg hangs
        const activeCameras = sortedCameras.filter(cam => 
            clipSegments.some(seg => seg.segment.files[cam] && seg.segment.files[cam].path)
        );
        
        if (activeCameras.length === 0) throw new Error('没有可导出的视频流');
        
        const firstFile = clipSegments.find(seg => seg.segment.files[activeCameras[0]] && seg.segment.files[activeCameras[0]].path)?.segment.files[activeCameras[0]];
        if (!firstFile) throw new Error('文件路径未找到');
        
        const pathSeparator = firstFile.path.includes('\\') ? '\\' : '/';
        const lastSepIdx = firstFile.path.lastIndexOf(pathSeparator);
        const outputDir = lastSepIdx !== -1 ? firstFile.path.substring(0, lastSepIdx) : '.';
        
        // Use system temp directory for intermediate files
        let workDir = await getTempDir();
        const workSeparator = workDir.includes('\\') ? '\\' : '/';
        
        const timestamp = new Date().getTime();
        const outputFilename = `TeslaCam_grid_${timestamp}.mp4`;
        const outputPath = `${outputDir}${pathSeparator}${outputFilename}`;
        
        // Create temp concat files for each camera
        const tempFiles = [];
        const inputArgs = [];
        
        try {
            // Build concat files for each camera and track which ones have content
            const validCameras = [];
            for (const camera of activeCameras) {
                const listFilename = `ffmpeg_list_${camera}_${timestamp}.txt`;
                const listPath = `${workDir}${workSeparator}${listFilename}`;
                tempFiles.push(listPath);
                
                let listContent = '';
                for (const seg of clipSegments) {
                    const file = seg.segment.files[camera];
                    if (!file || !file.path) continue;
                    const safePath = file.path.replace(/\\/g, '/').replace(/'/g, "'\\''");
                    listContent += `file '${safePath}'\n`;
                    listContent += `inpoint ${seg.clipStart}\n`;
                    listContent += `outpoint ${seg.clipEnd}\n`;
                }
                
                // Only add cameras that have actual video files
                if (listContent.trim()) {
                    await fs.writeTextFile(listPath, listContent);
                    inputArgs.push('-f', 'concat', '-safe', '0', '-i', listPath);
                    validCameras.push(camera);
                } else {
                    console.warn(`[FFmpeg Grid] Camera ${camera} has no files in selected range, skipping`);
                }
            }
            
            // Update activeCameras to only include cameras with valid files
            if (validCameras.length === 0) {
                throw new Error('没有可导出的视频文件');
            }
            if (validCameras.length !== activeCameras.length) {
                console.log(`[FFmpeg Grid] Reduced cameras from ${activeCameras.length} to ${validCameras.length}`);
            }
            // Replace activeCameras with validCameras for the rest of processing
            const originalActiveCameras = activeCameras;
            activeCameras.length = 0;
            activeCameras.push(...validCameras);
            
            // Generate ASS subtitle for metadata if enabled
            let allMetadata = null;
            let overlayInfo = null;
            
            // Calculate grid dimensions
            const count = activeCameras.length;
            let gridWidth, gridHeight;
            if (count <= 2) {
                gridWidth = 1920;
                gridHeight = 540;
            } else if (count <= 4) {
                gridWidth = 1920;
                gridHeight = 1080;
            } else {
                gridWidth = 2880;
                gridHeight = 1080;
            }
            
            if (addMetadata && this.metadataManager) {
                progressCallback?.('加载元数据...');
                // Use first camera for metadata (front camera preferred)
                const metadataCamera = activeCameras.includes('front') ? 'front' : activeCameras[0];
                allMetadata = await this.loadMetadataForSegments(clipSegments, metadataCamera, progressCallback);
                
                if (allMetadata && allMetadata.length > 0) {
                    progressCallback?.(this.currentLanguage === 'zh' ? `生成元数据图标覆盖层...` : `Generating metadata overlays...`);
                    try {
                        overlayInfo = await metadataOverlayGenerator.generateOverlayPngs(
                            allMetadata,
                            clipSegments,
                            workDir,
                            gridWidth,
                            gridHeight,
                            progressCallback,
                            this.currentLanguage
                        );
                        if (overlayInfo) {
                            tempFiles.push(overlayInfo.pngDir);
                            console.log('[FFmpeg Grid] PNG overlays generated:', overlayInfo.pngDir);
                        }
                    } catch (pngError) {
                        console.error('[FFmpeg Grid] PNG overlay generation failed:', pngError);
                        overlayInfo = null;
                    }
                }
            }
            
            // Calculate total duration EARLY - needed for trim filter to prevent FFmpeg hanging
            const totalDuration = clipSegments.reduce((sum, seg) => {
                const dur = (seg.clipEnd || 60) - (seg.clipStart || 0);
                return sum + (dur > 0 ? dur : 0);
            }, 0);
            
            console.log('[FFmpeg Grid] Total duration calculated:', totalDuration, 'seconds');
            
            // Build filter for grid layout
            let filterComplex = '';
            
            // Camera names for localization
            const lang = this.currentLanguage || 'zh';
            const cameraNames = {
                front: { en: 'Front', zh: '前视' },
                left_pillar: { en: 'Left Pillar', zh: '左柱' },
                right_pillar: { en: 'Right Pillar', zh: '右柱' },
                back: { en: 'Back', zh: '后视' },
                left: { en: 'Left', zh: '左侧' },
                right: { en: 'Right', zh: '右侧' }
            };

            // Scale each input and add label
            for (let i = 0; i < count; i++) {
                const camName = activeCameras[i];
                const labelText = cameraNames[camName]?.[lang] || camName.toUpperCase();
                
                // Determine font file path based on OS for labels (use CJK-compatible font)
                let fontOption = "";
                if (navigator.userAgent.includes('Windows')) {
                    fontOption = "fontfile='C\\:/Windows/Fonts/msyh.ttc':";
                } else if (navigator.userAgent.includes('Mac')) {
                    // Escape spaces for FFmpeg filter
                    fontOption = "fontfile='/System/Library/Fonts/Hiragino\\ Sans\\ GB.ttc':";
                }

                const drawLabel = `drawtext=${fontOption}text='${labelText}':x=10:y=10:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5`;
                // Add trim filter to ensure all streams have the same duration, preventing FFmpeg from hanging
                filterComplex += `[${i}:v]trim=duration=${totalDuration},setpts=PTS-STARTPTS,scale=960:540,setsar=1,fps=24,format=yuv420p,${drawLabel}[v${i}];`;
            }
            
            // Stack layout - no shortest=1 needed since trim filter ensures equal duration
            let stackFilter = '';
            if (count === 1) {
                stackFilter = `[v0]null[grid]`;
            } else if (count === 2) {
                stackFilter = `[v0][v1]hstack=inputs=2[grid]`;
            } else if (count === 3) {
                // Top: 2 videos (1920px), Bottom: 1 video (960px) -> Pad bottom to 1920px (center aligned)
                stackFilter = `[v0][v1]hstack=inputs=2[top];[v2]pad=1920:540:480:0[v2_padded];[top][v2_padded]vstack=inputs=2[grid]`;
            } else if (count === 4) {
                stackFilter = `[v0][v1]hstack=inputs=2[top];[v2][v3]hstack=inputs=2[bottom];[top][bottom]vstack=inputs=2[grid]`;
            } else if (count >= 5) {
                // 3x2 grid. Top row is always 3 videos (2880px).
                stackFilter = `[v0][v1][v2]hstack=inputs=3[top];`;
                if (count === 5) {
                    // Bottom: 2 videos (1920px) -> Pad to 2880px (center aligned: (2880-1920)/2 = 480)
                    stackFilter += `[v3][v4]hstack=inputs=2,pad=2880:540:480:0[bottom];[top][bottom]vstack=inputs=2[grid]`;
                } else {
                    // Bottom: 3 videos (2880px)
                    stackFilter += `[v3][v4][v5]hstack=inputs=3[bottom];[top][bottom]vstack=inputs=2[grid]`;
                }
            } else {
                stackFilter = `[v0]null[grid]`;
            }
            
            filterComplex += stackFilter;
            
            // Track current output label
            let currentOutput = 'grid';
            
            // Add timestamp if needed
            if (addTimestamp) {
                // Extract full timestamp (with seconds) from filename
                const firstFileRef = clipSegments.find(seg => seg.segment.files[activeCameras[0]])?.segment.files[activeCameras[0]];
                const fileName = firstFileRef.name || firstFileRef.path.split(/[/\\]/).pop();
                const fullTimestampMatch = fileName.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
                
                let firstSegTime;
                if (fullTimestampMatch) {
                    firstSegTime = this.parseTimestamp(fullTimestampMatch[1]);
                } else {
                    firstSegTime = this.parseTimestamp(clipSegments[0].timestamp);
                }
                
                const clipStartTimeObj = new Date(firstSegTime.getTime() + clipSegments[0].clipStart * 1000);
                const startEpoch = Math.floor(clipStartTimeObj.getTime() / 1000);
                
                let fontOption = "";
                if (navigator.userAgent.includes('Windows')) {
                    fontOption = "fontfile='C\\:/Windows/Fonts/msyh.ttc':";
                } else if (navigator.userAgent.includes('Mac')) {
                    // Escape spaces for FFmpeg filter
                    fontOption = "fontfile='/System/Library/Fonts/Hiragino\\ Sans\\ GB.ttc':";
                }
                
                // FFmpeg pts:localtime only accepts 2 arguments (localtime and epoch timestamp)
                // Time format uses system locale default
                const drawtext = `drawtext=${fontOption}text='%{pts\\:localtime\\:${startEpoch}}':x=w-text_w-20:y=20:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5`;
                filterComplex += (filterComplex ? ';' : '') + `[${currentOutput}]${drawtext}[ts]`;
                currentOutput = 'ts';
            }
            
            // Add PNG overlay filters for metadata
            if (overlayInfo && overlayInfo.pngPaths && overlayInfo.pngPaths.size > 0) {
                const overlayResult = await metadataOverlayGenerator.generateOverlayFilter(
                    allMetadata,
                    clipSegments,
                    overlayInfo.pngPaths,
                    workDir,
                    activeCameras.length // Multiple video inputs
                );
                
                if (overlayResult.concatFile) {
                    // Add background and concat stream to inputs
                    const bgPath = overlayInfo.pngPaths.get('__background__');
                    // Use -loop 1 for background image
                    inputArgs.push('-loop', '1', '-i', bgPath);
                    const bgIdx = activeCameras.length; // Cameras are 0 to N-1, background is N

                    inputArgs.push('-f', 'concat', '-safe', '0', '-i', overlayResult.concatFile);
                    const metaIdx = bgIdx + 1;

                    tempFiles.push(overlayResult.concatFile);

                    // Scale down metadata overlay for grid view to match single camera proportions
                    // Front camera reference: 2896px width video -> 480px box width
                    // Target grid width: 1920px -> 1920 * (480 / 2896) ≈ 318px
                    const referenceWidth = 2896;
                    const scaleFactor = 1920 / referenceWidth;
                    const scaledBgWidth = Math.round(480 * scaleFactor);
                    const scaledBgHeight = Math.round(65 * scaleFactor);
                    
                    // Overlay background then metadata stream with scaling
                    const xExpr = '(W-w)/2';
                    const yExpr = '(H*0.97-h/2)';
                    const currentLabelStr = `[${currentOutput}]`;
                    
                    // Ensure all streams start at PTS 0 and are synchronized
                    const videoStream = `${currentLabelStr}setpts=PTS-STARTPTS[v_sync]`;
                    const bgScale = `[${bgIdx}:v]trim=duration=${totalDuration},setpts=PTS-STARTPTS,scale=${scaledBgWidth}:${scaledBgHeight}[bg_scaled]`;
                    const metaScale = `[${metaIdx}:v]setpts=PTS-STARTPTS,scale=${scaledBgWidth}:${scaledBgHeight}[meta_scaled]`;
                    
                    const ovPart = `${videoStream};${bgScale};${metaScale};[v_sync][bg_scaled]overlay=x=${xExpr}:y=${yExpr}:eof_action=pass[bg_v];[bg_v][meta_scaled]overlay=x=${xExpr}:y=${yExpr}:eof_action=pass[ov]`;
                    
                    filterComplex += (filterComplex ? ';' : '') + ovPart;
                    currentOutput = 'ov';
                }
            }
            
            const finalOutput = `[${currentOutput}]`;
            
            // Calculate total duration BEFORE building args
            // Use filter_complex_script to avoid command line length limits on Windows
            const filterScriptPath = `${workDir}${pathSeparator}ffmpeg_filter_grid_${timestamp}.txt`;
            await fs.writeTextFile(filterScriptPath, filterComplex);
            tempFiles.push(filterScriptPath);

            const args = [
                ...inputArgs,
                '-filter_complex_script', filterScriptPath,
                '-map', finalOutput,
                '-map', '0:a?',
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-crf', '23',
                '-r', '24',
                '-t', String(Math.ceil(totalDuration + 1)),
                '-y',
                outputPath
            ];
            
            console.log('[FFmpeg Grid] Filter script content (first 500):', filterComplex.substring(0, 500));
            console.log('[FFmpeg Grid] Filter script content (last 500):', filterComplex.substring(filterComplex.length - 500));
            console.log('[FFmpeg Grid] Running with', activeCameras.length, 'cameras, duration:', totalDuration);
            console.log('[FFmpeg Grid] Args:', args.join(' '));
            progressCallback?.(this.currentLanguage === 'zh' ? 'FFmpeg 合成四宫格...' : 'FFmpeg Merging Grid...');
            
            const output = await this.executeFFmpegWithProgress(args, totalDuration, progressCallback, this.currentLanguage === 'zh' ? '合成四宫格...' : 'Merging Grid...');
            progressCallback?.(this.currentLanguage === 'zh' ? '合成四宫格: 100%' : 'Merging Grid: 100%');
            
            console.log('[FFmpeg Grid] Finished processing grid');
            
            if (output.code !== 0) {
                throw new Error(`FFmpeg 错误 (code ${output.code}): ${output.stderr || output.stdout || '未知错误'}`);
            }
            
            // Cleanup temp files
            for (const f of tempFiles) {
                try { 
                    if (f.includes('overlay_pngs_')) {
                        await this.removeDirectory(f, fs);
                    } else {
                        await fs.remove(f); 
                    }
                } catch(_) {}
            }
            
            return { camera: 'grid', path: outputPath, isFile: true };
            
        } catch (e) {
            for (const f of tempFiles) {
                try { 
                    if (f.includes('overlay_pngs_')) {
                        await this.removeDirectory(f, fs);
                    } else {
                        await fs.remove(f); 
                    }
                } catch(_) {}
            }
            try { await fs.remove(outputPath); } catch(_) {}
            throw e;
        }
    }
    
    getSegmentsForTimeRange(allSegments, startTime, endTime) {
        const result = [];
        let accumulatedTime = 0;
        
        for (let i = 0; i < allSegments.length; i++) {
            const segment = allSegments[i];
            const segmentDuration = segment.duration || 60; // Default 60s
            const segmentStart = accumulatedTime;
            const segmentEnd = accumulatedTime + segmentDuration;
            
            // Check if this segment overlaps with our clip range
            if (segmentEnd > startTime && segmentStart < endTime) {
                const clipStart = Math.max(0, startTime - segmentStart);
                const clipEnd = Math.min(segmentDuration, endTime - segmentStart);
                
                result.push({
                    segment,
                    segmentIndex: i,
                    clipStart,
                    clipEnd,
                    clipDuration: clipEnd - clipStart,
                    timestamp: segment.timestamp,
                    absoluteStart: segmentStart
                });
            }
            
            accumulatedTime += segmentDuration;
            
            if (accumulatedTime >= endTime) break;
        }
        
        return result;
    }
    
    async processVideoWithTimestamp(clipSegments, camera, totalStartTime, totalEndTime, addTimestamp, addMetadata, eventStartTime, progressCallback, fileHandle = null) {
        if (clipSegments.length === 0) {
            throw new Error('没有可用的视频片段');
        }
        
        progressCallback?.(this.currentLanguage === 'zh' ? `处理 ${camera} 摄像头 (${clipSegments.length} 个片段)...` : `Processing ${camera} camera (${clipSegments.length} segments)...`);
        
        // Load metadata for all segments if addMetadata is enabled
        let allMetadata = [];
        if (addMetadata && this.metadataManager) {
            progressCallback?.(this.currentLanguage === 'zh' ? '加载行驶数据...' : 'Loading driving data...');
            allMetadata = await this.loadMetadataForSegments(clipSegments, camera, progressCallback);
            // Load SVG icons for metadata overlay
            await this.loadMetadataIcons();
        }
        
        // Check if we're in Tauri environment
        const isTauri = !!window.__TAURI__;
        
        // First pass: get video dimensions from first segment (load and release immediately)
        let canvasWidth = 0;
        let canvasHeight = 0;
        const firstVideoFile = clipSegments[0].segment.files[camera];
        if (firstVideoFile) {
            const tempVideo = document.createElement('video');
            tempVideo.muted = true;
            tempVideo.crossOrigin = 'anonymous';
            tempVideo.src = getFileUrl(firstVideoFile);
            await new Promise((resolve, reject) => {
                tempVideo.onloadedmetadata = resolve;
                tempVideo.onerror = reject;
            });
            canvasWidth = tempVideo.videoWidth;
            canvasHeight = tempVideo.videoHeight;
            // Release immediately
            URL.revokeObjectURL(tempVideo.src);
            tempVideo.src = '';
            tempVideo.load();
        }
        
        // Initialize canvas
        this.initCanvas(canvasWidth, canvasHeight);
        
        // Calculate total duration
        const FPS = 30;
        let totalDuration = 0;
        for (const clipSegment of clipSegments) {
            totalDuration += clipSegment.clipDuration;
        }
        const totalFrames = Math.ceil(totalDuration * FPS);
        
        // Setup MediaRecorder with fixed framerate
        const stream = this.canvas.captureStream(FPS);
        
        // Try VP9 first, fallback to VP8 if not supported
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
        }
        
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 3000000 // Reduced to 3 Mbps for lower memory footprint
        });
        
        // Use streaming approach - write chunks to array and periodically clear
        const chunks = [];
        let totalChunkSize = 0;
        let writable = null;
        
        // Write queue system to avoid Promise chain memory leaks
        const writeQueue = [];
        let writeQueueSize = 0;
        let isWriting = false;
        
        const processWriteQueue = async () => {
            if (isWriting) return;
            isWriting = true;
            
            while (writeQueue.length > 0) {
                const blob = writeQueue.shift();
                if (!blob) {
                    continue;
                }
                writeQueueSize -= blob.size || 0;
                try {
                    await writable.write(blob);
                } catch (err) {
                    console.error('Write error:', err);
                }
            }
            
            isWriting = false;
        };
        
        if (fileHandle) {
             try {
                 writable = await fileHandle.createWritable();
             } catch(e) {
                 console.warn("Writable creation failed", e);
             }
        }
        
        this.mediaRecorder.ondataavailable = (e) => {
            const size = e?.data ? e.data.size : 0;
            if (size > 0) {
                if (writable) {
                    writeQueue.push(e.data);
                    writeQueueSize += size;
                    if (writeQueueSize > 50 * 1024 * 1024) {
                        this.logMemory('writeQueue > 50MB', {
                            writeQueueSize: this.formatBytes(writeQueueSize),
                            totalChunkSize: this.formatBytes(totalChunkSize),
                            chunksBuffered: chunks.length,
                        });
                    }
                    processWriteQueue();
                } else {
                    chunks.push(e.data);
                }
                totalChunkSize += size;
            }
        };

        
        const recordingComplete = new Promise((resolve) => {
            this.mediaRecorder.onstop = async () => {
                console.log('MediaRecorder stopped, chunks count:', chunks.length, 'total size:', totalChunkSize);
                if (writable) {
                     await writable.close();
                     // Return result indicating saved
                     resolve({ saved: true, blob: new Blob([], { type: 'video/webm' }) });
                } else {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    console.log('Created blob, size:', blob.size);
                    // Clear chunks array to free memory
                    chunks.length = 0;
                    resolve(blob);
                }
            };
        });
        
        // Start recording - smaller timeslice helps reduce internal buffering
        this.mediaRecorder.start(250);
        const recordingStartTime = performance.now();
        
        // Process segments one at a time (streaming approach to reduce memory)
        let processedFrames = 0;
        const hasVideoFrameCallback = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
        
        for (let i = 0; i < clipSegments.length; i++) {
            const clipSegment = clipSegments[i];
            const videoFile = clipSegment.segment.files[camera];
            
            if (!videoFile) {
                throw new Error(`${camera} 摄像头在片段 ${i + 1} 中没有可用的视频文件`);
            }
            
            progressCallback?.(`加载片段 ${i + 1}/${clipSegments.length}...`);
            
            // Load video for this segment only
            const video = document.createElement('video');
            video.muted = true;
            video.crossOrigin = 'anonymous';
            
            // In Tauri, we need to read the file as blob to avoid CORS issues with canvas
            if (isTauri && videoFile.path) {
                try {
                    const fs = window.__TAURI__.fs;
                    const fileData = await fs.readFile(videoFile.path);
                    const blob = new Blob([fileData], { type: 'video/mp4' });
                    video.src = URL.createObjectURL(blob);
                } catch (e) {
                    console.error('Failed to read file via Tauri fs:', e);
                    video.src = getFileUrl(videoFile);
                }
            } else {
                video.src = getFileUrl(videoFile);
            }
            
            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = reject;
            });
            
            // Calculate timestamp for this segment - extract full timestamp from filename
            const fileName = videoFile?.name || (videoFile?.path ? videoFile.path.split(/[/\\]/).pop() : null);
            const fullTimestampMatch = fileName?.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
            
            let segmentTime;
            if (fullTimestampMatch) {
                segmentTime = this.parseTimestamp(fullTimestampMatch[1]);
            } else {
                segmentTime = this.parseTimestamp(clipSegment.timestamp);
            }
            
            const segmentEndTime = clipSegment.clipEnd;
            
            // Adjust clipStart if it exceeds video duration
            const actualClipStart = Math.min(clipSegment.clipStart, video.duration);
            // Adjust clipEnd based on actual video duration
            const actualEndTime = Math.min(segmentEndTime, video.duration);
            
            // Calculate timestamp based on actual clip start
            const segmentStartTimestamp = new Date(segmentTime.getTime() + actualClipStart * 1000);
            
            // Skip this segment if clipStart is already past video duration
            if (actualClipStart >= video.duration) {
                console.warn(`Segment ${i + 1}: clipStart (${clipSegment.clipStart}) exceeds video duration (${video.duration}), skipping`);
                // Release video resources
                URL.revokeObjectURL(video.src);
                video.src = '';
                video.load();
                continue;
            }
            
            console.log(`Processing single camera segment ${i + 1}/${clipSegments.length}:`, {
                clipStart: clipSegment.clipStart,
                actualClipStart,
                clipEnd: clipSegment.clipEnd,
                segmentEndTime,
                actualEndTime,
                videoDuration: video.duration,
                actualDuration: actualEndTime - actualClipStart
            });
            
            // Seek to clip start position
            video.currentTime = actualClipStart;
            await new Promise((resolve) => {
                video.onseeked = resolve;
            });
            
            if (hasVideoFrameCallback) {
                // Use requestVideoFrameCallback for precise frame capture
                await new Promise((resolve) => {
                    let lastFrameTime = -1;
                    let resolved = false;
                    
                    const captureFrame = (now, metadata) => {
                        if (resolved) return;
                        
                        if (video.currentTime >= actualEndTime + 0.05 || video.ended) {
                            resolved = true;
                            video.pause();
                            resolve();
                            return;
                        }
                        
                        if (metadata.mediaTime !== lastFrameTime) {
                            lastFrameTime = metadata.mediaTime;
                            
                            this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
                            
                            if (addTimestamp) {
                                const currentTime = new Date(segmentStartTimestamp.getTime() + (video.currentTime - actualClipStart) * 1000);
                                const timeString = currentTime.toLocaleString('zh-CN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\//g, '-');
                                
                                this.drawTimestamp(timeString);
                            }
                            
                            // Draw metadata overlay if enabled
                            if (addMetadata && allMetadata.length > 0) {
                                const metadataData = this.getMetadataAtTime(allMetadata, i, video.currentTime);
                                this.drawMetadata(metadataData, this.currentLanguage);
                            }
                            
                            processedFrames++;
                            
                            if (processedFrames % 30 === 0) {
                                const progress = Math.min(100, Math.round((processedFrames / totalFrames) * 100));
                                progressCallback?.(`处理 ${camera}: ${progress}%`);
                            }
                        }
                        
                        if (!resolved) {
                            video.requestVideoFrameCallback(captureFrame);
                        }
                    };
                    
                    video.onended = () => {
                        if (!resolved) {
                            resolved = true;
                            video.pause();
                            resolve();
                        }
                    };
                    
                    video.requestVideoFrameCallback(captureFrame);
                    video.play();
                });
            } else {
                // Fallback: play and sample at FPS (avoid per-frame seeking which can explode memory)
                const frameInterval = 1000 / FPS;
                
                await new Promise((resolve) => {
                    let resolved = false;
                    
                    const stop = () => {
                        if (resolved) return;
                        resolved = true;
                        video.pause();
                        resolve();
                    };
                    
                    const tick = () => {
                        if (resolved) return;
                        
                        const t = video.currentTime;
                        if (t >= actualEndTime - 0.02 || video.ended) {
                            stop();
                            return;
                        }
                        
                        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
                        
                        if (addTimestamp) {
                            const currentTime = new Date(segmentStartTimestamp.getTime() + (t - actualClipStart) * 1000);
                            const timeString = currentTime.toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                            }).replace(/\//g, '-');
                            
                            this.drawTimestamp(timeString);
                        }
                        
                        // Draw metadata overlay if enabled
                        if (addMetadata && allMetadata.length > 0) {
                            const metadataData = this.getMetadataAtTime(allMetadata, i, t);
                            this.drawMetadata(metadataData, this.currentLanguage);
                        }
                        
                        processedFrames++;
                        
                        if (processedFrames % 30 === 0) {
                            const progress = Math.min(100, Math.round((processedFrames / totalFrames) * 100));
                            progressCallback?.(`处理 ${camera}: ${progress}%`);
                        }
                        
                        setTimeout(tick, frameInterval);
                    };
                    
                    video.play().then(() => tick()).catch(() => tick());
                });
            }
            
            // Release video resources immediately after processing this segment
            video.pause();
            URL.revokeObjectURL(video.src);
            video.src = '';
            video.load();
            
            // Allow GC
            if (i % 5 === 0) {
                 await new Promise(r => setTimeout(r, 100));
            }

            console.log(`Segment ${i + 1} completed, memory released`);
            this.logMemory(`segment done ${i + 1}/${clipSegments.length}`, {
                writeQueueSize: this.formatBytes(writeQueueSize),
                totalChunkSize: this.formatBytes(totalChunkSize),
                chunksBuffered: chunks.length,
                writeQueueItems: writeQueue.length,
            });
        }

        
        // Ensure all writes are finished before stopping
        if (writable) {
            while (isWriting || writeQueue.length > 0) {
                await new Promise(r => setTimeout(r, 100));
            }
        }
        
        // Stop recording
        await new Promise(resolve => setTimeout(resolve, 500));
        this.mediaRecorder.stop();
        
        const result = await recordingComplete;
        
        const calculatedDuration = (processedFrames / FPS) * 1000;
        const recordingEndTime = performance.now();
        const realTimeDuration = recordingEndTime - recordingStartTime;
        console.log(`[Single Video Export] Recording completed. Expected: ${totalDuration * 1000}ms, Calculated: ${calculatedDuration}ms, RealTime: ${realTimeDuration}ms, Frames: ${processedFrames}`);
        
        // Clean up canvas and stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        if (result.saved) {
            // For streamed files, try to use FFmpeg to fix metadata
            // If FFmpeg fails, the video is still playable (just without accurate duration)
            if (fileHandle) {
                try {
                    const fixed = await this.fixWebmWithFFmpeg(fileHandle, progressCallback);
                    if (!fixed) {
                        console.warn('[Grid Video Export] FFmpeg metadata fix failed, video may have inaccurate duration');
                        progressCallback?.('视频已保存（元数据修复跳过）');
                    }
                } catch (e) {
                    console.warn('[Grid Video Export] FFmpeg metadata fix error:', e);
                    progressCallback?.('视频已保存（元数据修复跳过）');
                }
            }
            return result;
        }

        progressCallback?.('修复视频元数据...');
        const fixedBlob = await webmDurationFixer.fixDuration(result, calculatedDuration);
        
        return fixedBlob;
    }
    
    async createGridVideoFromSegments(clipSegments, cameras, totalStartTime, totalEndTime, addTimestamp, addMetadata, eventStartTime, progressCallback, fileHandle = null) {
        progressCallback?.(this.currentLanguage === 'zh' ? `准备四宫格视频 (${clipSegments.length} 个片段)...` : `Preparing grid video (${clipSegments.length} segments)...`);
        
        // Load metadata for all segments if addMetadata is enabled
        let allMetadata = [];
        if (addMetadata && this.metadataManager) {
            progressCallback?.(this.currentLanguage === 'zh' ? '加载行驶数据...' : 'Loading driving data...');
            // Use front camera for metadata (it's the same for all cameras)
            allMetadata = await this.loadMetadataForSegments(clipSegments, cameras[0], progressCallback);
            // Load SVG icons for metadata overlay
            await this.loadMetadataIcons();
        }
        
        // Check if we're in Tauri environment
        const isTauri = !!window.__TAURI__;
        
        // First pass: get video dimensions from first segment (load and release immediately)
        let canvasWidth = 0;
        let canvasHeight = 0;
        const firstVideoFile = clipSegments[0].segment.files[cameras[0]];
        if (firstVideoFile) {
            const tempVideo = document.createElement('video');
            tempVideo.muted = true;
            tempVideo.crossOrigin = 'anonymous';
            tempVideo.src = getFileUrl(firstVideoFile);
            await new Promise((resolve, reject) => {
                tempVideo.onloadedmetadata = resolve;
                tempVideo.onerror = reject;
            });
            canvasWidth = tempVideo.videoWidth;
            canvasHeight = tempVideo.videoHeight;
            URL.revokeObjectURL(tempVideo.src);
            tempVideo.src = '';
            tempVideo.load();
        }
        
        const videoCount = cameras.length;
        
        // Calculate grid layout and sort order
        let gridCols, gridRows;
        let sortOrder;

        if (videoCount > 4) {
            gridCols = 3; 
            gridRows = 2;
            sortOrder = ['left_pillar', 'front', 'right_pillar', 'left', 'back', 'right'];
        } else {
            sortOrder = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
            if (videoCount === 1) {
                gridCols = 1; gridRows = 1;
            } else if (videoCount === 2) {
                gridCols = 2; gridRows = 1;
            } else {
                gridCols = 2; gridRows = 2;
            }
        }

        const sortedCameras = cameras.sort((a, b) => {
            const idxA = sortOrder.indexOf(a);
            const idxB = sortOrder.indexOf(b);
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });

        // Target output resolution: 1920x1080 (scales each cell to fit)
        const targetWidth = 1920;
        const targetHeight = 1080;
        const cellWidth = Math.floor(targetWidth / gridCols);
        const cellHeight = Math.floor(targetHeight / gridRows);
        const gridCanvasWidth = targetWidth;
        const gridCanvasHeight = targetHeight;
        
        // Initialize canvas
        this.initCanvas(gridCanvasWidth, gridCanvasHeight);

        
        // Calculate total duration
        const FPS = 30;
        let totalDuration = 0;
        for (const clipSegment of clipSegments) {
            totalDuration += clipSegment.clipDuration;
        }
        const totalFrames = Math.ceil(totalDuration * FPS);
        
        // Setup MediaRecorder
        const stream = this.canvas.captureStream(FPS);
        
        // Dynamic bitrate based on grid cell count
        // Optimize bitrate to reduce memory usage: ~2.5Mbps per camera is sufficient
        const gridCellCount = gridCols * gridRows;
        const videoBitsPerSecond = Math.min(2500000 * gridCellCount, 15000000);
        
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
        }
        
        console.log(`Grid export: ${gridCols}x${gridRows}, ${gridCanvasWidth}x${gridCanvasHeight}, ${videoBitsPerSecond / 1000000} Mbps, codec: ${mimeType}, total frames: ${totalFrames}`);
        this.logMemory('grid init', {
            gridSize: `${gridCols}x${gridRows}`,
            canvasSize: `${gridCanvasWidth}x${gridCanvasHeight}`,
            bitrateMbps: (videoBitsPerSecond / 1000000).toFixed(2),
        });
        
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond
        });

        
        const chunks = [];
        let totalChunkSize = 0;
        let writable = null;
        
        // Write queue system to avoid Promise chain memory leaks
        const writeQueue = [];
        let writeQueueSize = 0;
        let isWriting = false;
        
        const processWriteQueue = async () => {
            if (isWriting) return;
            isWriting = true;
            
            while (writeQueue.length > 0) {
                const blob = writeQueue.shift();
                if (!blob) {
                    continue;
                }
                writeQueueSize -= blob.size || 0;
                try {
                    await writable.write(blob);
                } catch (err) {
                    console.error('Write error:', err);
                }
            }
            
            isWriting = false;
        };


        if (fileHandle) {
             try {
                 writable = await fileHandle.createWritable();
             } catch(e) {
                 console.warn("Writable creation failed", e);
             }
        }
        
        this.mediaRecorder.ondataavailable = (e) => {
            const size = e?.data ? e.data.size : 0;
            if (size > 0) {
                if (writable) {
                    writeQueue.push(e.data);
                    writeQueueSize += size;
                    if (writeQueueSize > 50 * 1024 * 1024) {
                        this.logMemory('writeQueue > 50MB', {
                            writeQueueSize: this.formatBytes(writeQueueSize),
                            totalChunkSize: this.formatBytes(totalChunkSize),
                            chunksBuffered: chunks.length,
                        });
                    }
                    processWriteQueue();
                } else {
                    chunks.push(e.data);
                }
                totalChunkSize += size;
            }
        };

        
        const recordingComplete = new Promise((resolve) => {
            this.mediaRecorder.onstop = async () => {
                console.log('MediaRecorder stopped, chunks count:', chunks.length, 'total size:', totalChunkSize);
                if (writable) {
                     await writable.close();
                     resolve({ saved: true, blob: new Blob([], { type: 'video/webm' }) });
                } else {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    console.log('Created blob, size:', blob.size);
                    chunks.length = 0;
                    resolve(blob);
                }
            };
        });
        
        // Start recording - smaller timeslice helps reduce internal buffering
        this.mediaRecorder.start(250);
        const recordingStartTime = performance.now();
        
        // Position mapping for grid
        const cameraPositions = {};
        sortedCameras.forEach((cam, index) => {
            cameraPositions[cam] = {
                x: index % gridCols,
                y: Math.floor(index / gridCols)
            };
        });
        
        // Process segments one at a time (streaming approach)
        let processedFrames = 0;
        const hasVideoFrameCallback = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
        
        for (let i = 0; i < clipSegments.length; i++) {
            const clipSegment = clipSegments[i];
            
            progressCallback?.(`加载片段 ${i + 1}/${clipSegments.length}...`);
            
            // Load videos for this segment only
            const videos = {};
            for (const camera of cameras) {
                const videoFile = clipSegment.segment.files[camera];
                if (!videoFile) continue;
                
                const video = document.createElement('video');
                video.muted = true;
                video.crossOrigin = 'anonymous';
                
                if (isTauri && videoFile.path) {
                    try {
                        const fs = window.__TAURI__.fs;
                        const fileData = await fs.readFile(videoFile.path);
                        const blob = new Blob([fileData], { type: 'video/mp4' });
                        video.src = URL.createObjectURL(blob);
                    } catch (e) {
                        console.error('Failed to read file via Tauri fs:', e);
                        video.src = getFileUrl(videoFile);
                    }
                } else {
                    video.src = getFileUrl(videoFile);
                }
                
                await new Promise((resolve, reject) => {
                    video.onloadedmetadata = resolve;
                    video.onerror = reject;
                });
                
                videos[camera] = video;
            }
            
            if (Object.keys(videos).length === 0) {
                throw new Error(`片段 ${i + 1} 没有可用的视频文件`);
            }

            const videoCountLoaded = Object.keys(videos).length;
            this.logMemory(`segment start ${i + 1}/${clipSegments.length}`, {
                videoCountLoaded,
                writeQueueSize: this.formatBytes(writeQueueSize),
                totalChunkSize: this.formatBytes(totalChunkSize),
                chunksBuffered: chunks.length,
                writeQueueItems: writeQueue.length,
            });
            
            // Calculate timestamp for this segment
            const firstCam = sortedCameras[0];

            const videoFile = clipSegment.segment.files[firstCam];
            const fileName = videoFile?.name || (videoFile?.path ? videoFile.path.split(/[/\\]/).pop() : null);
            const fullTimestampMatch = fileName?.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
            
            let segmentTime;
            if (fullTimestampMatch) {
                segmentTime = this.parseTimestamp(fullTimestampMatch[1]);
            } else {
                segmentTime = this.parseTimestamp(clipSegment.timestamp);
            }
            
            const segmentEndTime = clipSegment.clipEnd;
            
            const videoEntries = Object.entries(videos);
            const firstVideo = videoEntries[0][1];
            
            // Adjust clipStart if it exceeds video duration
            const actualClipStart = Math.min(clipSegment.clipStart, firstVideo.duration);
            // Adjust clipEnd based on actual video duration
            const actualEndTime = Math.min(segmentEndTime, firstVideo.duration);
            
            // Calculate timestamp based on actual clip start
            const segmentStartTimestamp = new Date(segmentTime.getTime() + actualClipStart * 1000);
            
            // Skip this segment if clipStart is already past video duration
            if (actualClipStart >= firstVideo.duration) {
                console.warn(`Grid segment ${i + 1}: clipStart (${clipSegment.clipStart}) exceeds video duration (${firstVideo.duration}), skipping`);
                // Release video resources
                for (const video of Object.values(videos)) {
                    URL.revokeObjectURL(video.src);
                    video.src = '';
                    video.load();
                }
                continue;
            }
            
            console.log(`Processing segment ${i + 1}/${clipSegments.length}:`, {
                clipStart: clipSegment.clipStart,
                actualClipStart,
                clipEnd: clipSegment.clipEnd,
                clipDuration: clipSegment.clipDuration,
                segmentEndTime,
                actualEndTime,
                videoDuration: firstVideo.duration,
                actualDuration: actualEndTime - actualClipStart
            });
            
            // Seek all videos to clip start position with timeout
            const seekWithTimeout = (video, targetTime, timeout = 5000) => {
                return new Promise((resolve) => {
                    // If already at target position (within tolerance), resolve immediately
                    if (Math.abs(video.currentTime - targetTime) < 0.1) {
                        video.playbackRate = 1.0;
                        resolve();
                        return;
                    }
                    
                    const timeoutId = setTimeout(() => {
                        console.warn(`[Grid] Seek timeout for video, forcing continue`);
                        video.onseeked = null;
                        resolve();
                    }, timeout);
                    
                    video.onseeked = () => {
                        clearTimeout(timeoutId);
                        video.onseeked = null;
                        resolve();
                    };
                    
                    video.playbackRate = 1.0;
                    video.currentTime = targetTime;
                });
            };
            
            await Promise.all(Object.values(videos).map(video => 
                seekWithTimeout(video, actualClipStart)
            ));
            
            const segmentDuration = actualEndTime - actualClipStart;
            const segmentFrameCount = Math.ceil(segmentDuration * FPS);
            console.log(`Segment ${i + 1}: clipStart=${clipSegment.clipStart}, actualEndTime=${actualEndTime}, segmentDuration=${segmentDuration}s, expectedFrames=${segmentFrameCount}`);
            
        const renderFrame = (videoTime) => {
            // Clear canvas
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, gridCanvasWidth, gridCanvasHeight);
            
            // 2x2 特殊逻辑：等比缩小、不裁剪；同一行的两张图水平拼成一组，整组居中，保证左右贴合无外部空隙
            const is2x2 = gridCols === 2 && gridRows === 2;

            if (is2x2) {
                const layout = videoEntries.map(([camera, video]) => {
                    const pos = cameraPositions[camera] || { x: 0, y: 0 };
                    const x = pos.x * cellWidth;
                    const y = pos.y * cellHeight;
                    const srcW = video.videoWidth || cellWidth;
                    const srcH = video.videoHeight || cellHeight;
                    const scale = Math.min(cellWidth / srcW, cellHeight / srcH); // contain: 不裁剪
                    const drawW = Math.ceil(srcW * scale);
                    const drawH = Math.ceil(srcH * scale);
                    return { camera, video, x, y, row: pos.y, drawW, drawH };
                });

                // 按行处理，每行两张：总宽度 <= 1920，整行居中；左右紧贴
                const rows = new Map();
                for (const item of layout) {
                    if (!rows.has(item.row)) rows.set(item.row, []);
                    rows.get(item.row).push(item);
                }

                for (const [, items] of rows) {
                    items.sort((a, b) => a.x - b.x); // 左右顺序
                    const totalW = items.reduce((sum, it) => sum + it.drawW, 0);
                    const startX = Math.floor((gridCanvasWidth - totalW) / 2);
                    let cursorX = startX;
                    for (const item of items) {
                        const offsetX = cursorX;
                        const offsetY = item.y + Math.floor((cellHeight - item.drawH) / 2);
                        this.ctx.drawImage(item.video, offsetX, offsetY, item.drawW, item.drawH);
                        cursorX += item.drawW;

                        // Draw camera label (auto width)
                        const labelX = offsetX + 4;
                        const labelY = item.y + 4;
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                        this.ctx.font = 'bold 12px "Noto Sans SC", Arial';
                        const lang = this.currentLanguage || 'zh';
                        const cameraNames = {
                            front: { en: 'Front', zh: '前视' },
                            left_pillar: { en: 'Left Pillar', zh: '左柱' },
                            right_pillar: { en: 'Right Pillar', zh: '右柱' },
                            back: { en: 'Back', zh: '后视' },
                            left: { en: 'Left', zh: '左侧' },
                            right: { en: 'Right', zh: '右侧' }
                        };
                        const labelText = cameraNames[item.camera]?.[lang] || item.camera.toUpperCase();
                        const textW = this.ctx.measureText(labelText).width;
                        const padX = 6;
                        const padY = 4;
                        const boxW = Math.ceil(textW + padX * 2);
                        const boxH = 20 + padY * 0; // 20 高度够 12px 字体
                        this.ctx.fillRect(labelX, labelY, boxW, boxH);
                        this.ctx.fillStyle = '#fff';
                        this.ctx.fillText(labelText, labelX + padX, labelY + 14);

                    }
                }
            } else {

            // Draw each camera view (contain: keep aspect, center inside cell)
            for (const [camera, video] of videoEntries) {
                const pos = cameraPositions[camera] || { x: 0, y: 0 };
                const x = pos.x * cellWidth;
                const y = pos.y * cellHeight;

                const srcW = video.videoWidth || cellWidth;
                const srcH = video.videoHeight || cellHeight;
                const scale = Math.min(cellWidth / srcW, cellHeight / srcH); // contain: 不裁剪
                const drawW = Math.ceil(srcW * scale);
                const drawH = Math.ceil(srcH * scale);

                const offsetX = x + Math.floor((cellWidth - drawW) / 2);
                const offsetY = y + Math.floor((cellHeight - drawH) / 2);
                
                this.ctx.drawImage(video, offsetX, offsetY, drawW, drawH);

                
                // Draw camera label (auto width)
                const labelX = x + 4;
                const labelY = y + 4;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                this.ctx.font = 'bold 12px "Noto Sans SC", Arial';
                
                const lang = this.currentLanguage || 'zh';
                const cameraNames = {
                    front: { en: 'Front', zh: '前视' },
                    left_pillar: { en: 'Left Pillar', zh: '左柱' },
                    right_pillar: { en: 'Right Pillar', zh: '右柱' },
                    back: { en: 'Back', zh: '后视' },
                    left: { en: 'Left', zh: '左侧' },
                    right: { en: 'Right', zh: '右侧' }
                };
                const labelText = cameraNames[camera]?.[lang] || camera.toUpperCase();
                const textW = this.ctx.measureText(labelText).width;
                const padX = 6;
                const padY = 4;
                const boxW = Math.ceil(textW + padX * 2);
                const boxH = 20 + padY * 0;
                this.ctx.fillRect(labelX, labelY, boxW, boxH);
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText(labelText, labelX + padX, labelY + 14);




            }
            }



            
            // Draw timestamp if needed
            if (addTimestamp) {
                const currentTime = new Date(segmentStartTimestamp.getTime() + (videoTime - actualClipStart) * 1000);
                const timeString = currentTime.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).replace(/\//g, '-');
                
                this.ctx.font = 'bold 20px "Noto Sans SC", Arial';
                const textWidth = this.ctx.measureText(timeString).width;
                const padding = 10;
                const boxWidth = textWidth + padding * 2;
                const boxHeight = 32;

                // 放到右上角单元格的右上侧内边距位置
                const topRightCell = videoEntries.reduce((acc, [cam]) => {
                    const pos = cameraPositions[cam] || { x: 0, y: 0 };
                    if (!acc) return { cam, pos };
                    if (pos.x > acc.pos.x || (pos.x === acc.pos.x && pos.y < acc.pos.y)) {
                        return { cam, pos };
                    }
                    return acc;
                }, null);
                const targetX = topRightCell ? topRightCell.pos.x * cellWidth : gridCanvasWidth - cellWidth;
                const targetY = topRightCell ? topRightCell.pos.y * cellHeight : 0;
                const margin = 16; // base inset
                // 额外左移：按文本宽度的一半（n/2），让长时间戳整体更向内
                const extraLeft = textWidth / 2;
                const tsX = targetX + cellWidth - boxWidth - margin - extraLeft;
                const tsY = targetY + margin;


                
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(tsX, tsY, boxWidth, boxHeight);
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(timeString, tsX + boxWidth - padding, tsY + 24);


                this.ctx.textAlign = 'left';

            }
            
            // Draw metadata overlay if enabled (at bottom center of grid)
            if (addMetadata && allMetadata.length > 0) {
                const metadataData = this.getMetadataAtTime(allMetadata, i, videoTime);
                this.drawMetadata(metadataData, this.currentLanguage);
            }


        };


            
            if (hasVideoFrameCallback) {
                await new Promise((resolve) => {
                    let resolved = false;
                    const masterVideo = firstVideo;
                    let lastFrameTime = Date.now();
                    let stuckCheckInterval = null;
                    
                    const stopAll = () => {
                        if (resolved) return;
                        resolved = true;
                        if (stuckCheckInterval) clearInterval(stuckCheckInterval);
                        for (const video of Object.values(videos)) {
                            video.pause();
                        }
                        resolve();
                    };
                    
                    // Check if video is stuck (no frame for 10 seconds)
                    stuckCheckInterval = setInterval(() => {
                        if (resolved) {
                            clearInterval(stuckCheckInterval);
                            return;
                        }
                        if (Date.now() - lastFrameTime > 10000) {
                            console.warn(`[Grid] Video playback stuck, forcing continue. currentTime=${masterVideo.currentTime}, targetEnd=${actualEndTime}`);
                            stopAll();
                        }
                    }, 2000);
                    
                    const onFrame = () => {
                        if (resolved) return;
                        lastFrameTime = Date.now();
                        
                        const t = masterVideo.currentTime;
                        if (t >= actualEndTime - 0.02 || masterVideo.ended) {
                            stopAll();
                            return;
                        }
                        
                        // Light sync: if other cameras drift too much, correct occasionally
                        // Skip videos that have ended or if target time exceeds their duration
                        for (const video of Object.values(videos)) {
                            if (video === masterVideo) continue;
                            if (video.ended || t >= video.duration) continue; // Skip ended videos
                            if (Math.abs(video.currentTime - t) > 0.15) {
                                video.currentTime = Math.min(t, video.duration - 0.1);
                            }
                        }
                        
                        renderFrame(t);
                        processedFrames++;
                        
                        if (processedFrames % 30 === 0) {
                            const progress = Math.min(100, Math.round((processedFrames / totalFrames) * 100));
                            progressCallback?.(`处理四宫格: ${progress}%`);
                        }
                        
                        masterVideo.requestVideoFrameCallback(onFrame);
                    };
                    
                    Promise.all(Object.values(videos).map(v => v.play().catch((e) => {
                        console.warn('[Grid] Video play failed:', e);
                        return null;
                    })))
                        .then(() => {
                            if (!resolved) {
                                masterVideo.requestVideoFrameCallback(onFrame);
                            }
                        })
                        .catch((e) => {
                            console.error('[Grid] Failed to start video playback:', e);
                            stopAll();
                        });
                });
            } else {
                // Fallback: play and sample at FPS without per-frame seeking
                await new Promise((resolve) => {
                    let resolved = false;
                    const masterVideo = firstVideo;
                    const frameInterval = 1000 / FPS;
                    let lastTickTime = Date.now();
                    let stuckCheckInterval = null;
                    
                    const stopAll = () => {
                        if (resolved) return;
                        resolved = true;
                        if (stuckCheckInterval) clearInterval(stuckCheckInterval);
                        for (const video of Object.values(videos)) {
                            video.pause();
                        }
                        resolve();
                    };
                    
                    // Check if video is stuck (no tick for 10 seconds)
                    stuckCheckInterval = setInterval(() => {
                        if (resolved) {
                            clearInterval(stuckCheckInterval);
                            return;
                        }
                        if (Date.now() - lastTickTime > 10000) {
                            console.warn(`[Grid] Video playback stuck (fallback mode), forcing continue`);
                            stopAll();
                        }
                    }, 2000);
                    
                    const tick = () => {
                        if (resolved) return;
                        lastTickTime = Date.now();
                        const t = masterVideo.currentTime;
                        if (t >= actualEndTime - 0.02 || masterVideo.ended) {
                            stopAll();
                            return;
                        }
                        renderFrame(t);
                        processedFrames++;
                        
                        if (processedFrames % 30 === 0) {
                            const progress = Math.min(100, Math.round((processedFrames / totalFrames) * 100));
                            progressCallback?.(`处理四宫格: ${progress}%`);
                        }
                        setTimeout(tick, frameInterval);
                    };
                    
                    Promise.all(Object.values(videos).map(v => v.play().catch((e) => {
                        console.warn('[Grid] Video play failed (fallback):', e);
                        return null;
                    })))
                        .then(() => {
                            if (!resolved) {
                                tick();
                            }
                        })
                        .catch((e) => {
                            console.error('[Grid] Failed to start video playback (fallback):', e);
                            stopAll();
                        });
                });
            }
            
            // Release video resources immediately after processing this segment
            for (const key of Object.keys(videos)) {
                const video = videos[key];
                video.pause();
                URL.revokeObjectURL(video.src);
                video.src = '';
                video.load(); // Detach source
                videos[key] = null;
            }
            
            // Explicitly force garbage collection pause if processing many segments
            if (i % 5 === 0) {
                 await new Promise(r => setTimeout(r, 100));
            }
            
            console.log(`Segment ${i + 1} completed, memory released`);
            this.logMemory(`segment done ${i + 1}/${clipSegments.length}`, {
                writeQueueSize: this.formatBytes(writeQueueSize),
                totalChunkSize: this.formatBytes(totalChunkSize),
                chunksBuffered: chunks.length,
                writeQueueItems: writeQueue.length,
            });
        }

        
        // Ensure all writes are finished before stopping
        if (writable) {
            // Wait for queue to drain
            while (isWriting || writeQueue.length > 0) {
                await new Promise(r => setTimeout(r, 100));
            }
            this.logMemory('write queue drained', {
                writeQueueSize: this.formatBytes(writeQueueSize),
                totalChunkSize: this.formatBytes(totalChunkSize),
                chunksBuffered: chunks.length,
                writeQueueItems: writeQueue.length,
            });
        }


        // Stop recording
        await new Promise(resolve => setTimeout(resolve, 500));
        this.mediaRecorder.stop();
        
        const result = await recordingComplete;
        
        const calculatedDuration = (processedFrames / FPS) * 1000;
        const recordingEndTime = performance.now();
        const realTimeDuration = recordingEndTime - recordingStartTime;
        console.log(`[Grid Video Export] Recording completed. Expected: ${totalDuration * 1000}ms, Calculated: ${calculatedDuration}ms, RealTime: ${realTimeDuration}ms, Frames: ${processedFrames}`);
        this.logMemory('recording stopped', {
            writeQueueSize: this.formatBytes(writeQueueSize),
            totalChunkSize: this.formatBytes(totalChunkSize),
            chunksBuffered: chunks.length,
            writeQueueItems: writeQueue.length,
        });
        
        // Clean up canvas and stream
        if (stream) {

            stream.getTracks().forEach(track => track.stop());
        }
        
        if (result.saved) {
            // For streamed files, try to use FFmpeg to fix metadata
            // If FFmpeg fails, the video is still playable (just without accurate duration)
            if (fileHandle) {
                try {
                    const fixed = await this.fixWebmWithFFmpeg(fileHandle, progressCallback);
                    if (!fixed) {
                        console.warn('[Grid Video Export] FFmpeg metadata fix failed, video may have inaccurate duration');
                        progressCallback?.('视频已保存（元数据修复跳过）');
                    }
                } catch (e) {
                    console.warn('[Grid Video Export] FFmpeg metadata fix error:', e);
                    progressCallback?.('视频已保存（元数据修复跳过）');
                }
            }
            return result;
        }

        progressCallback?.('修复视频元数据...');
        const fixedBlob = await webmDurationFixer.fixDuration(result, calculatedDuration);
        
        return fixedBlob;
    }
    
    drawTimestamp(timeString) {
        // Dynamic scaling
        const referenceWidth = 2896;
        const scale = this.canvas.width / referenceWidth;
        
        const fontSize = Math.round(28 * scale);
        const padding = 15 * scale;
        const boxHeight = 40 * scale;
        const margin = 20 * scale;
        
        // Measure text width
        this.ctx.font = `bold ${fontSize}px "Noto Sans SC", Arial`;
        const textWidth = this.ctx.measureText(timeString).width;
        const boxWidth = textWidth + padding * 2;
        const x = this.canvas.width - boxWidth - margin;
        const y = margin;
        
        // Draw background (top-right corner)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(x, y, boxWidth, boxHeight);
        
        // Draw text
        this.ctx.fillStyle = '#fff';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(timeString, x + padding, y + boxHeight / 2);
    }
    
    // Load metadata for all segments
    async loadMetadataForSegments(clipSegments, camera, progressCallback = null) {
        const allMetadata = [];
        
        for (let i = 0; i < clipSegments.length; i++) {
            if (this.isCancelled) throw new Error('导出已取消');
            if (progressCallback) {
                progressCallback(`读取视频数据 ${i + 1}/${clipSegments.length}...`);
            }
            const clipSegment = clipSegments[i];
            const videoFile = clipSegment.segment.files[camera];
            
            if (!videoFile) continue;
            
            try {
                let buffer;
                if (videoFile instanceof File) {
                    buffer = await videoFile.arrayBuffer();
                } else if (videoFile.path && window.__TAURI__) {
                    const fs = window.__TAURI__.fs;
                    const data = await fs.readFile(videoFile.path);
                    buffer = data.buffer;
                } else if (videoFile.path || videoFile.name) {
                    const response = await fetch(getFileUrl(videoFile));
                    buffer = await response.arrayBuffer();
                } else {
                    continue;
                }
                
                const parser = new DashcamMP4(buffer);
                const rawMetadata = parser.parseMetadata();
                
                if (this.metadataManager && this.metadataManager.SeiMetadata) {
                    const segmentMetadata = rawMetadata.map(item => {
                        try {
                            const decoded = this.metadataManager.SeiMetadata.decode(item.data);
                            return {
                                time: item.time,
                                segmentIndex: i,
                                data: this.metadataManager.SeiMetadata.toObject(decoded, { enums: String, longs: String })
                            };
                        } catch (e) {
                            return null;
                        }
                    }).filter(Boolean);
                    
                    allMetadata.push({
                        segmentIndex: i,
                        clipStart: clipSegment.clipStart,
                        clipEnd: clipSegment.clipEnd,
                        metadata: segmentMetadata
                    });
                }
            } catch (e) {
                console.warn(`[Metadata] Failed to load metadata for segment ${i}:`, e);
            }
        }
        
        return allMetadata;
    }
    
    // Get metadata for a specific time within a segment
    getMetadataAtTime(allMetadata, segmentIndex, currentTime) {
        const segmentData = allMetadata.find(m => m.segmentIndex === segmentIndex);
        if (!segmentData || !segmentData.metadata || segmentData.metadata.length === 0) {
            return null;
        }
        
        // Find the metadata item closest to current time
        let bestMatch = segmentData.metadata[0];
        for (const item of segmentData.metadata) {
            if (item.time <= currentTime) {
                bestMatch = item;
            } else {
                break;
            }
        }
        
        return bestMatch?.data || null;
    }
    
    // Draw metadata overlay at bottom center with SVG icons
    /**
     * Draw metadata overlay on canvas
     */
    drawMetadata(metadataData, lang = 'zh') {
        if (!metadataData) return;
        
        const d = metadataData;
        
        // Dynamic scaling based on reference: 480px width box is "just right" for 2896px width video
        const referenceWidth = 2896;
        const scale = this.canvas.width / referenceWidth;
        
        const barWidth = 480 * scale;
        const barHeight = 65 * scale;
        const iconSize = 30 * scale;
        const borderRadius = 16 * scale;
        const fontSize = 24 * scale;
        
        // Position: Bottom center
        const x = (this.canvas.width - barWidth) / 2;
        const y = this.canvas.height - barHeight - (20 * scale);
        
        // Draw background bar (Glassmorphism effect)
        this.ctx.save();
        const gradient = this.ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, 'rgba(20, 20, 20, 0.3)');
        gradient.addColorStop(1, 'rgba(5, 5, 5, 0.35)');
        this.ctx.fillStyle = gradient;
        
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x, y, barWidth, barHeight, borderRadius);
        } else {
            const r = borderRadius;
            this.ctx.moveTo(x + r, y);
            this.ctx.lineTo(x + barWidth - r, y);
            this.ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
            this.ctx.lineTo(x + barWidth, y + barHeight - r);
            this.ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - r, y + barHeight);
            this.ctx.lineTo(x + r, y + barHeight);
            this.ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
            this.ctx.lineTo(x, y + r);
            this.ctx.quadraticCurveTo(x, y, x + r, y);
        }
        this.ctx.fill();
        this.ctx.restore();
        
        const yCenter = y + barHeight / 2;
        
        // Speed
        const speedKmh = Math.round((d.vehicleSpeedMps || 0) * 3.6);
        const speedDisplay = speedKmh >= 150 ? '150+' : `${speedKmh}`;
        const speedText = `${speedDisplay} km/h`;
        
        // Gear
        const gearMap = {
            'GEAR_PARK': 'P',
            'GEAR_DRIVE': 'D',
            'GEAR_REVERSE': 'R',
            'GEAR_NEUTRAL': 'N'
        };
        const gear = gearMap[d.gearState] || '--';
        const gearText = `[${gear}]`;
        
        // Steering bucket
        const steeringAngle = Math.round(d.steeringWheelAngle || 0);
        const steeringBucket = Math.round(steeringAngle / 10) * 10;
        const autopilotState = d.autopilotState || 'NONE';
        
        // Accelerator bucket
        const accelPercent = Math.round(d.acceleratorPedalPosition || 0);
        const accelBucket = Math.floor(accelPercent / 10) * 10;
        
        // Draw items (Using SCALED COORDINATES)
        this.ctx.save();
        this.ctx.font = `bold ${fontSize}px "Noto Sans SC", Arial, sans-serif`;
        this.ctx.textBaseline = 'middle';
        
        // Speed (Scaled at 125)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(speedText, x + 125 * scale, yCenter);
        
        // Gear (Scaled at 145)
        this.ctx.textAlign = 'left';
        let gearColor = '#ffffff';
        if (gear === 'D') gearColor = '#52c41a';
        else if (gear === 'R') gearColor = '#ff4d4f';
        this.ctx.fillStyle = gearColor;
        this.ctx.fillText(gearText, x + 145 * scale, yCenter);
        
        // Blinkers
        this.drawLeftArrow(this.ctx, x + 200 * scale, yCenter, iconSize, d.blinkerOnLeft);
        this.drawRightArrow(this.ctx, x + 240 * scale, yCenter, iconSize, d.blinkerOnRight);
        
        // Brake (Fixed at 290)
        this.drawBrakeIcon(this.ctx, x + 290 * scale, yCenter, iconSize, d.brakeApplied);
        
        // Accel (Fixed at 340, no percentage text, only icon)
        this.drawAcceleratorIcon(this.ctx, x + 340 * scale, yCenter, iconSize, accelBucket);
        
        // Steering Wheel (Fixed at 390)
        this.drawSteeringWheelIcon(this.ctx, x + 390 * scale, yCenter, iconSize, steeringBucket, autopilotState);
        
        this.ctx.restore();
    }

    // Helper: draw left arrow
    drawLeftArrow(ctx, x, y, size, active) {
        const color = active ? '#52c41a' : 'rgba(255,255,255,0.2)';
        ctx.save();
        if (active) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(82, 196, 26, 0.4)';
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        const halfSize = size / 2;
        ctx.moveTo(x + size * 0.9, y - halfSize * 0.4);
        ctx.lineTo(x + halfSize * 1.1, y - halfSize * 0.4);
        ctx.lineTo(x + halfSize * 1.1, y - halfSize * 0.8);
        ctx.lineTo(x + size * 0.1, y);
        ctx.lineTo(x + halfSize * 1.1, y + halfSize * 0.8);
        ctx.lineTo(x + halfSize * 1.1, y + halfSize * 0.4);
        ctx.lineTo(x + size * 0.9, y + halfSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Helper: draw right arrow
    drawRightArrow(ctx, x, y, size, active) {
        const color = active ? '#52c41a' : 'rgba(255,255,255,0.2)';
        ctx.save();
        if (active) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(82, 196, 26, 0.4)';
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        const halfSize = size / 2;
        ctx.moveTo(x + size * 0.1, y - halfSize * 0.4);
        ctx.lineTo(x + halfSize * 0.9, y - halfSize * 0.4);
        ctx.lineTo(x + halfSize * 0.9, y - halfSize * 0.8);
        ctx.lineTo(x + size * 0.9, y);
        ctx.lineTo(x + halfSize * 0.9, y + halfSize * 0.8);
        ctx.lineTo(x + halfSize * 0.9, y + halfSize * 0.4);
        ctx.lineTo(x + size * 0.1, y + halfSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Helper: draw brake icon (brake pedal shape from SVG)
    drawBrakeIcon(ctx, x, y, size, active) {
        const color = active ? '#ff4d4f' : 'rgba(255,255,255,0.4)';
        ctx.save();
        
        try {
            if (active) {
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(255, 77, 79, 0.5)';
            }
            ctx.fillStyle = color;
            
            // 绘制图标，居中对齐 - 使用较大尺寸
            const iconSize = size * 1.5;
            const iconX = x + (size - iconSize) / 2;
            const iconY = y - iconSize / 2;
            
            // SVG viewBox是0 0 1024 1024，路径实际范围约 x:140-880, y:162-861
            const svgSize = 1024;
            const pathWidth = 880 - 140;
            const pathHeight = 861 - 162;
            const pathCenterX = 140 + pathWidth / 2;
            const pathCenterY = 162 + pathHeight / 2;
            
            const scale = iconSize / svgSize;
            
            // 将路径中心移到图标中心
            ctx.translate(iconX + iconSize / 2, iconY + iconSize / 2);
            ctx.scale(scale, scale);
            ctx.translate(-pathCenterX, -pathCenterY);
            
            const path = new Path2D('M821.394 861.482H200.242c-23.709 0-44.013-20.191-45.124-44.975 0 0-30.555-129.896-30.044-166.228 0.325-23.102 15.23-164.3 15.23-164.3 2.449-27.739 18.019-48.258 42.686-48.258h646.233c24.667 0 44.357 21.769 43.759 48.258l14.579 163.622-22.043 166.906c-0.56 24.784-20.414 44.975-44.124 44.975z m24.716-358.364l0.292-10.498c0.23-8.275-6.452-15.059-14.85-15.059H186.497c-8.397 0-14.828 6.784-14.291 15.059l0.681 10.498c0.534 8.232 7.802 14.954 16.153 14.954h641.472c8.35 0 15.37-6.722 15.598-14.954z m8.739 81.304l0.296-10.264c0.233-8.091-6.628-14.724-15.248-14.724H177.735c-8.62 0-15.226 6.633-14.681 14.724l0.691 10.264c0.542 8.049 7.999 14.622 16.571 14.622H838.84c8.574 0 15.777-6.572 16.009-14.622z m6.172 79.506l0.298-10.038c0.235-7.912-6.747-14.399-15.516-14.399H172.234c-8.769 0-15.494 6.487-14.945 14.399l0.695 10.038c0.545 7.872 8.126 14.3 16.847 14.3h669.91c8.721 0 16.047-6.428 16.28-14.3z m-14.901 77.765l0.282-9.819c0.222-7.74-6.466-14.085-14.863-14.085H186.526c-8.397 0-14.841 6.345-14.322 14.085l0.659 9.819c0.517 7.701 7.772 13.989 16.123 13.989h641.548c8.351 0 15.365-6.288 15.586-13.989z m-8.749 76.081l0.267-9.608c0.21-7.573-6.189-13.781-14.222-13.781H206.385c-8.033 0-14.202 6.208-13.711 13.781l0.623 9.608c0.489 7.535 7.425 13.688 15.415 13.688h613.751c7.99 0.001 14.698-6.152 14.908-13.688z m1.869-378.856l36.038-94.167 21.623-119.775H785.183L752.749 356.56l-118.926 82.358H839.24z');
            ctx.fill(path);
        } catch (err) {
            console.error('[drawBrakeIcon Web] Error:', err);
        }
        
        ctx.restore();
    }

    // Helper: draw accelerator icon
    drawAcceleratorIcon(ctx, x, y, size, percent) {
        const active = percent > 0;
        const rectWidth = size * 0.6;
        const rectHeight = size * 0.9;
        const rectX = x + (size - rectWidth) / 2;
        const rectY = y - rectHeight / 2;
        const cornerRadius = 3;
        
        ctx.save();
        ctx.strokeStyle = active ? '#52c41a' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        this.drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, cornerRadius);
        ctx.stroke();
        
        if (active) {
            const fillHeight = (percent / 100) * (rectHeight - 4);
            const fillY = rectY + rectHeight - 2 - fillHeight;
            ctx.fillStyle = '#52c41a';
            this.drawRoundedRect(ctx, rectX + 2, fillY, rectWidth - 4, fillHeight, 1);
            ctx.fill();
        }
        ctx.restore();
    }

    // Helper: draw steering wheel icon
    drawSteeringWheelIcon(ctx, x, y, size, angle, autopilotState) {
        let color = 'rgba(255,255,255,0.9)';
        let shadowColor = 'transparent';
        if (autopilotState === 'SELF_DRIVING') {
            color = '#52c41a';
            shadowColor = 'rgba(82, 196, 26, 0.5)';
        } else if (autopilotState === 'AUTOSTEER' || autopilotState === 'TACC') {
            color = '#1890ff';
            shadowColor = 'rgba(24, 144, 255, 0.5)';
        }
        
        ctx.save();
        if (shadowColor !== 'transparent') {
            ctx.shadowBlur = 6;
            ctx.shadowColor = shadowColor;
        }
        
        const cx = x + size / 2;
        const cy = y;
        ctx.translate(cx, cy);
        ctx.rotate((angle * Math.PI) / 180);
        
        const scale = size / 64;
        const r = 28 * scale;
        const hubR = 9 * scale;
        const strokeWidth = 5 * scale;
        const spokeHeight = 8 * scale;
        const spokeWidth = 19 * scale;
        const spokeRx = 2 * scale;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fill();
        
        // Left spoke
        this.drawRoundedRect(ctx, -r - strokeWidth / 2, -spokeHeight / 2, spokeWidth, spokeHeight, spokeRx);
        ctx.fill();
        // Right spoke
        this.drawRoundedRect(ctx, r - spokeWidth + strokeWidth / 2, -spokeHeight / 2, spokeWidth, spokeHeight, spokeRx);
        ctx.fill();
        // Bottom spoke
        this.drawRoundedRect(ctx, -spokeHeight / 2, hubR, spokeHeight, spokeWidth, spokeRx);
        ctx.fill();
        
        ctx.restore();
    }

    // Helper: draw rounded rectangle
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, radius);
        } else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }
    }

    parseTimestamp(timestamp) {
        // Handles "2024-01-01_12-00-00" format
        const [datePart, timePart] = timestamp.split('_');
        return new Date(`${datePart}T${timePart.replace(/-/g, ':')}`);
    }
}

class TeslaCamViewer {
    constructor() {
        this.isTauri = !!window.__TAURI__;
        this.allFiles = [];
        this.eventGroups = [];
        this.currentEvent = null;
        this.currentLanguage = 'zh';
        this.starredIds = this.loadStarred();
        this.starredOnly = false;
        this.sortOrder = localStorage.getItem(ANDROID_SORT_ORDER_KEY) === 'oldest' ? 'oldest' : 'newest';
        this.currentMapCoordinates = null;
        this.flatpickrInstance = null;
        this.videoClipProcessor = new VideoClipProcessor();
        this.metadataManager = new MetadataManager(this);
        this.dom = {
            folderInput: document.getElementById('folderInput'),
            fileInputIOS: document.getElementById('fileInputIOS'),
            selectFolderBtn: document.getElementById('selectFolderBtn'),
            appVersion: document.getElementById('appVersion'),
            headerEventName: document.getElementById('headerEventName'),
            cardContextMenu: document.getElementById('cardContextMenu'),
            fileList: document.getElementById('fileList'),
            snapshotBtn: document.getElementById('snapshotBtn'),
            autoNextBtn: document.getElementById('autoNextBtn'),
            diagnosticsBtn: document.getElementById('diagnosticsBtn'),
            starFilterBtn: document.getElementById('starFilterBtn'),
            sortOrderBtn: document.getElementById('sortOrderBtn'),
            triggerHlBtn: document.getElementById('triggerHlBtn'),
            tapBehaviorChoice: document.getElementById('tapBehaviorChoice'),
            themeChoice: document.getElementById('themeChoice'),
            contextStarLabel: document.getElementById('contextStarLabel'),
            cardContextTitle: document.getElementById('cardContextTitle'),
            dateFilter: document.getElementById('dateFilter'),
            clearDateBtn: document.getElementById('clearDateBtn'),
            eventFilter: document.getElementById('eventFilter'),
            eventSearch: document.getElementById('eventSearch'),
            dateChips: document.getElementById('dateChips'),
            permBanner: document.getElementById('permBanner'),
            permBannerText: document.getElementById('permBannerText'),
            permBannerBtn: document.getElementById('permBannerBtn'),
            sidebar: document.querySelector('.sidebar'),
            toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
            filterToggleBtn: document.getElementById('filterToggleBtn'),
            openSidebarBtn: document.getElementById('openSidebarBtn'),
            emptyHeroBtn: document.getElementById('emptyHeroBtn'),
            playerArea: document.getElementById('playerArea'),
            overlay: document.getElementById('overlay'),
            themeToggleBtn: document.getElementById('themeToggleBtn'),
            langToggleBtn: document.getElementById('langToggleBtn'),
            mapModal: document.getElementById('mapModal'),
            mapModalTitle: document.getElementById('mapModalTitle'),
            routeCanvas: document.getElementById('routeMapCanvas'),
            routeMapGroup: document.querySelector('.route-map-group'),
            routeLegend: document.getElementById('routeLegend'),
            routeNote: document.getElementById('routeNote'),
            gaodeMapBtn: document.getElementById('gaodeMapBtn'),
            googleMapBtn: document.getElementById('googleMapBtn'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            revealFileBtn: document.getElementById('revealFileBtn'),
            downloadFileBtn: document.getElementById('downloadFileBtn'),
            exportMetadataBtn: document.getElementById('exportMetadataBtn'),
            metadataSwitchBtn: document.getElementById('metaSwitchBtn'),
            headerLocationDisplay: document.getElementById('headerLocationDisplay'),
            headerMenuBtn: document.getElementById('headerMenuBtn'),
            headerRight: document.getElementById('headerRight'),
            tabMoreBtn: document.getElementById('tabMoreBtn'),
            tabListBtn: document.getElementById('tabListBtn'),
            headerActionsGroup: document.getElementById('headerActionsGroup'),
            headerCenterInfo: document.getElementById('headerCenterInfo') || document.querySelector('.header-center-info'),
            mainHeader: document.querySelector('.main-header'),
            // Clip modal elements
            clipModal: document.getElementById('clipModal'),
            clipModalTitle: document.getElementById('clipModalTitle'),
            clipInfo: document.getElementById('clipInfo'),
            clipOptions: document.getElementById('clipOptions'),
            clipDuration: document.getElementById('clipDuration'),
            clipStartTime: document.getElementById('clipStartTime'),
            clipEndTime: document.getElementById('clipEndTime'),
            exportFront: document.getElementById('exportFront'),
            exportBack: document.getElementById('exportBack'),
            exportLeft: document.getElementById('exportLeft'),
            exportRight: document.getElementById('exportRight'),
            exportLeftPillar: document.getElementById('exportLeftPillar'),
            exportRightPillar: document.getElementById('exportRightPillar'),
            addTimestamp: document.getElementById('addTimestamp'),
            mergeVideos: document.getElementById('mergeVideos'),
            useLocalFFmpeg: document.getElementById('useLocalFFmpeg'),
            ffmpegOptionRow: document.getElementById('ffmpegOptionRow'),
            clipProgress: document.getElementById('clipProgress'),
            clipProgressBar: document.getElementById('clipProgressBar'),
            clipProgressText: document.getElementById('clipProgressText'),
            startClipBtn: document.getElementById('startClipBtn'),
            cancelClipBtn: document.getElementById('cancelClipBtn'),
            closeClipModalBtn: document.getElementById('closeClipModalBtn'),
            // File path modal elements
            filePathModal: document.getElementById('filePathModal'),
            filePathModalTitle: document.getElementById('filePathModalTitle'),
            filePathInput: document.getElementById('filePathInput'),
            copyPathBtn: document.getElementById('copyPathBtn'),
            copySuccessHint: document.getElementById('copySuccessHint'),
            closeFilePathModalBtn: document.getElementById('closeFilePathModalBtn'),
        };
        this.videoListComponent = new VideoListComponent('fileList', (eventId) => this.playEvent(eventId), this);
        this.multiCameraPlayer = new MultiCameraPlayer();
        this.continuousPlayer = new ContinuousVideoPlayer(this.multiCameraPlayer);
        // The player owns the "last segment finished" moment, which is the only place the
        // auto-next rule can live without polling.
        this.continuousPlayer.viewer = this;
        this.videoControls = new ModernVideoControls(this.continuousPlayer, this);
        this.initializeEventListeners();
        this.initializeFlatpickr();
        this.loadTheme();
        this.loadLanguage();
        this.loadLastTeslaCamPath();
    }

    // 清理旧数据，释放内存
    cleanupOldData() {
        // 清理视频播放器
        if (this.multiCameraPlayer) {
            this.multiCameraPlayer.cleanup();
        }
        
        // 清理缩略图的 blob URL
        if (this.eventGroups) {
            for (const event of this.eventGroups) {
                if (event.thumbFile && !this.isTauri) {
                    // Web 环境下的缩略图可能有 blob URL 需要清理
                    // 但实际上缩略图 URL 在 img.onload 时已经 revoke 了
                }
            }
        }
        
        // 清空旧数据引用
        this.allFiles = [];
        this.eventGroups = [];
        this.currentEvent = null;
        
        // 强制垃圾回收提示（浏览器可能会忽略）
        if (window.gc) {
            window.gc();
        }
        
        console.log('[cleanupOldData] Old data cleaned up');
    }

    initializeEventListeners() {
        const useFileInput = !supportsDirectoryPicker();
        
        this.dom.selectFolderBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Tauri 环境下使用 dialog API 选择目录
            if (this.isTauri) {
                await this.selectTauriDirectory();
                return;
            }
            
            // 优先使用 File System Access API（支持持久化目录句柄）
            if (supportsFileSystemAccess()) {
                await this.selectDirectoryWithFSA();
                return;
            }
            
            if (useFileInput) {
                this.dom.fileInputIOS.click();
            } else {
                this.dom.folderInput.click();
            }
        });
        this.dom.folderInput.addEventListener('change', (e) => this.handleFolderSelection(e.target.files));
        this.dom.fileInputIOS.addEventListener('change', (e) => this.handleIOSFileSelection(e.target.files));

        // Drag & Drop Support
        const dropZone = document.body;
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            this.dom.sidebar.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dom.sidebar.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Tauri File Drop Support
        if (this.isTauri) {
            const tauri = getTauri();
            if (tauri && tauri.event) {
                console.log('Registering Tauri drag/drop listeners');
                
                // Tauri 2 uses different event names
                const dropEvent = 'tauri://drag-drop';
                const enterEvent = 'tauri://drag-enter';
                const leaveEvent = 'tauri://drag-leave';
                
                tauri.event.listen(enterEvent, (event) => {
                    console.log('Tauri drag enter:', event);
                    this.dom.sidebar.classList.add('drag-over');
                }).catch(err => console.error('Failed to listen to drag-enter', err));
                
                tauri.event.listen(leaveEvent, (event) => {
                    console.log('Tauri drag leave:', event);
                    this.dom.sidebar.classList.remove('drag-over');
                }).catch(err => console.error('Failed to listen to drag-leave', err));
                
                tauri.event.listen(dropEvent, (event) => {
                    console.log('Tauri drag drop event received:', event);
                    this.dom.sidebar.classList.remove('drag-over');
                    const paths = event.payload?.paths || event.payload;
                    if (paths && paths.length > 0) {
                        this.handleTauriDrop(paths);
                    }
                }).catch(err => console.error('Failed to listen to drag-drop', err));
            } else {
                console.warn('Tauri detected but event API not found. window.__TAURI__:', tauri);
            }
        }

        this.dom.eventFilter.addEventListener('change', () => this.filterAndRender());

        if (this.dom.eventSearch) {
            this.dom.eventSearch.addEventListener('input', () => this.filterAndRender());
        }
        if (this.dom.dateChips) {
            this.dom.dateChips.addEventListener('click', (e) => {
                const chip = e.target.closest('.date-chip');
                if (!chip || !this.dom.dateFilter) return;
                // Touching the day that is already selected clears it again.
                const date = chip.dataset.date === this.dom.dateFilter.value ? '' : chip.dataset.date;
                // Go through flatpickr rather than writing the input: setting the value by hand
                // leaves the calendar's own selection on the previous day, so reopening it shows
                // the wrong month highlighted.
                if (this.flatpickrInstance) this.flatpickrInstance.setDate(date, false);
                else this.dom.dateFilter.value = date;
                this.updateClearDateButton();
                this.filterAndRender();
            });
        }
        this.setupPermissionBanner();
        this.dom.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        if (this.dom.openSidebarBtn) {
            this.dom.openSidebarBtn.addEventListener('click', () => this.toggleSidebar(true));
        }
        this.dom.overlay.addEventListener('click', () => this.toggleSidebar(false));
        
        // Mobile swipe gesture support for sidebar
        this.initSwipeGestures();
        this.startLayerTracking();
        this.startControlsReserve();
        this.setupAndroidPlayerChrome();
        this.setupPhoneActionBar();
        this.setupCardContextMenu();
        this.setupPhoneExportPanel();
        this.setupPhoneFlingSwitcher();
        this.setupPhoneFullscreen();
        this.setupPhoneBrightnessGesture();
        this.setupPhoneFeedPinch();
        this.setupPhoneLongPressBoost();
        this.installLegacyWebViewFallbacks();
        this.setupRecentDirs();
        this.setupFilterToggle();
        this.setupPullToRefresh();
        this.setupPhoneMenuButtons();
        this.setupAboutPanel();
        this.setupVolumeWatcher();
        
        this.dom.playerArea.addEventListener('click', (e) => {
            // A fling that just changed the event is still followed by a click, and without this
            // the release would also zoom the user into whichever cell they happened to end on.
            if (Date.now() < (this.suppressPlayerTapUntil || 0)) return;
            const zoomBtn = e.target.closest('.camera-zoom-out-btn');
            if (zoomBtn) {
                this.zoomCamera(zoomBtn.dataset.camera);
                return;
            }
            // Any tap on the feeds counts as "show me the controls" — a phone has no
            // mousemove to wake the auto-hidden overlay. While it is hidden that wake-up
            // is the tap's only job; acting on the cell as well would zoom the user into
            // a camera they were not aiming at.
            const wokeOnly = this.videoControls.consumeWakeOnlyTap();
            this.videoControls.resetHideTimer();
            if (wokeOnly) return;

            const pip = e.target.closest('.video-container.is-pip');
            if (pip) {
                 this.multiCameraPlayer.setCamera(pip.dataset.camera);
                 return;
            }
            const cell = e.target.closest('.video-container.is-grid');
            if (cell && isPhoneLayout()) {
                this.zoomCamera(cell.dataset.camera);
            }
        });
        this.dom.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        this.dom.langToggleBtn.addEventListener('click', () => this.toggleLanguage());

        // wry never creates a second window, so a `target="_blank"` anchor is a silent no-op
        // in the WebView. Route it back out to the system browser instead.
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            link.addEventListener('click', (e) => {
                if (openExternalUrl(link.href)) e.preventDefault();
            });
        });
        
        if (this.dom.headerMenuBtn) {
            this.dom.headerMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dom.headerRight.classList.toggle('active');
            });
            
            // 点击外部关闭菜单
            document.addEventListener('click', () => {
                if (this.dom.headerRight.classList.contains('active')) {
                    this.dom.headerRight.classList.remove('active');
                }
            });
        }

        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

        window.addEventListener('resize', () => this.handleResize());

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            // In 'auto' this is the whole feature; a forced mode resolves back to itself,
            // so re-applying is cheaper than tracking which case we are in.
            this.applyTheme(this.resolveThemeDark());
        });

        // Map Modal Listeners
        this.dom.closeModalBtn.addEventListener('click', () => this.hideMapModal());
        this.dom.mapModal.addEventListener('click', (e) => {
            if (e.target === this.dom.mapModal) {
                this.hideMapModal();
            }
        });
        this.dom.gaodeMapBtn.addEventListener('click', () => this.openMap('gaode'));
        this.dom.googleMapBtn.addEventListener('click', () => this.openMap('google'));
        this.dom.revealFileBtn.addEventListener('click', () => this.revealCurrentFilePath());
        this.dom.downloadFileBtn.addEventListener('click', () => this.downloadCurrentFile());
        this.dom.exportMetadataBtn.addEventListener('click', () => this.exportMetadataToCSV());
        
        // Clip modal listeners
        this.dom.closeClipModalBtn.addEventListener('click', () => this.hideClipModal());
        this.dom.cancelClipBtn.addEventListener('click', () => this.hideClipModal());
        this.dom.startClipBtn.addEventListener('click', () => this.startClipExport());
        this.dom.clipModal.addEventListener('click', (e) => {
            if (e.target === this.dom.clipModal) {
                this.hideClipModal();
            }
        });
        
        // File path modal listeners
        this.dom.closeFilePathModalBtn.addEventListener('click', () => this.hideFilePathModal());
        this.dom.copyPathBtn.addEventListener('click', () => this.copyFilePath());
        this.dom.filePathModal.addEventListener('click', (e) => {
            if (e.target === this.dom.filePathModal) {
                this.hideFilePathModal();
            }
        });

        // Delete confirmation. Tapping outside is a refusal, same as 取消 — the only way to agree
        // to a hard delete is the red button that names it.
        ['closeDeleteConfirmBtn', 'deleteCancelBtn'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => this.closeDeleteConfirm());
        });
        document.getElementById('deleteConfirmBtn')?.addEventListener('click', () => this.confirmDeleteEvent());
        document.getElementById('deleteConfirmModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('deleteConfirmModal')) this.closeDeleteConfirm();
        });

        // A phone boots to the player with the drawer put away; the list is one tap or a swipe away.
        if (isPhoneLayout()) {
            this.toggleSidebar(false);
        }
        requestAnimationFrame(() => {
            this.checkHeaderCollapse();
        });
    }

    /**
     * 显示 toast 提示
     * @param {string} message - 提示消息
     * @param {string} type - 类型: 'success' | 'error' | 'info'
     * @param {number} duration - 显示时长(ms)，默认3000
     */
    showToast(message, type = 'success', duration = 3000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            // Most of the phone feedback is a toast nobody can see with a glove on and a bright
            // screen, so it has to be announced as well as drawn.
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // 触发重排以启动动画
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, duration);
    }

    initializeFlatpickr() {
        if (!this.dom.dateFilter) return; // Guard clause
        const lang = this.currentLanguage;
        const translations = i18n[lang];
        this.flatpickrInstance = flatpickr(this.dom.dateFilter, {
            dateFormat: "Y-m-d",
            locale: this.currentLanguage === 'zh' ? 'zh' : 'default',
            placeholder: translations.selectDate,
            disableMobile: true, // Force flatpickr on mobile instead of native picker
            onChange: (selectedDates, dateStr, instance) => {
                this.filterAndRender();
                this.updateClearDateButton();
            },
            onReady: (selectedDates, dateStr, instance) => {
                // Guard clause for onReady
                if (instance.calendarContainer) {
                    instance.calendarContainer.classList.add('teslacam-flatpickr');
                }
            }
        });
        
        // Initialize clear date button
        if (this.dom.clearDateBtn) {
            this.dom.clearDateBtn.addEventListener('click', () => this.clearDateFilter());
            this.updateClearDateButton();
        }
    }
    
    clearDateFilter() {
        if (this.flatpickrInstance) {
            this.flatpickrInstance.clear();
            this.filterAndRender();
            this.updateClearDateButton();
        }
    }
    
    updateClearDateButton() {
        if (this.dom.clearDateBtn) {
            const hasValue = this.dom.dateFilter && this.dom.dateFilter.value;
            this.dom.clearDateBtn.classList.toggle('visible', !!hasValue);
        }
    }

    handleGlobalKeydown(e) {
        const activeElement = document.activeElement;
        const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);


        if (e.key === ' ' && !isTyping) {
            e.preventDefault();
            this.videoControls.togglePlayPause();
        }
    }

    handleResize() {
        this.dom.sidebar.style.transition = 'none';
        
        const isCollapsed = this.dom.sidebar.classList.contains('collapsed');
        this.dom.overlay.classList.toggle('active', !isCollapsed && isPhoneLayout());

        setTimeout(() => {
            this.dom.sidebar.style.transition = '';
        }, 50);

        // Check if header buttons need to collapse
        this.checkHeaderCollapse();
        // The trigger marks only exist on touch layouts, and this is the one place a rotation or a
        // window drag crosses that line without a new clip being loaded.
        this.applyTriggerHighlight(this.currentEvent);
    }

    checkHeaderCollapse() {
        const mainHeader = this.dom.mainHeader;
        const centerInfo = this.dom.headerCenterInfo;
        const actionsGroup = this.dom.headerActionsGroup;
        const headerRight = this.dom.headerRight;
        
        if (!mainHeader || !centerInfo || !actionsGroup) return;

        // Store current state
        const wasCollapsed = mainHeader.classList.contains('header-collapsed');
        
        // Close dropdown menu during resize to prevent visual glitches
        if (headerRight) {
            headerRight.classList.remove('active');
        }
        
        // Disable transitions and hide actionsGroup during measurement
        mainHeader.style.transition = 'none';
        actionsGroup.style.transition = 'none';
        actionsGroup.style.visibility = 'hidden';
        actionsGroup.style.opacity = '0';
        
        // Temporarily force non-collapsed state to measure true button width
        mainHeader.classList.remove('header-collapsed');
        
        // Force a reflow to get accurate measurements
        void mainHeader.offsetWidth;
        
        // Get bounding rects
        const centerRect = centerInfo.getBoundingClientRect();
        const actionsRect = actionsGroup.getBoundingClientRect();
        
        // Check if there's overlap (with some padding for safety)
        const padding = 16;
        // On a tablet the header is wide enough that nothing overlaps, so the geometric test
        // says "not collapsed" — and the phone layout, which anchors the ⋮ panel and sizes its
        // rows off `.header-collapsed`, gets the desktop dropdown instead. The class is what the
        // touch layout is written against, so the touch layout always wears it.
        const shouldCollapse = isPhoneLayout()
            || actionsRect.left < (centerRect.right + padding);

        if (shouldCollapse) {
            mainHeader.classList.add('header-collapsed');
        }
        
        // Restore styles after a frame
        requestAnimationFrame(() => {
            mainHeader.style.transition = '';
            actionsGroup.style.transition = '';
            actionsGroup.style.visibility = '';
            actionsGroup.style.opacity = '';
        });
    }

    async handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dom.sidebar.classList.remove('drag-over');

        if (this.isTauri) {
            console.log('Tauri drop detected, waiting for tauri://file-drop event');
            return;
        }

        const items = e.dataTransfer.items;
        if (!items) return;

        const files = [];
        const queue = [];

        // Normalize items to entries
        for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
            if (entry) {
                queue.push(entry);
            }
        }

        // Recursive scan
        while (queue.length > 0) {
            const entry = queue.shift();
            if (entry.isFile) {
                try {
                    const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
                    // Manually attach webkitRelativePath based on fullPath
                    // entry.fullPath usually starts with /
                    const relativePath = entry.fullPath.startsWith('/') ? entry.fullPath.slice(1) : entry.fullPath;
                    
                    // We need to define property because webkitRelativePath is read-only
                    Object.defineProperty(file, 'webkitRelativePath', {
                        value: relativePath,
                        writable: false
                    });
                    files.push(file);
                } catch (err) {
                    console.error("Error reading file:", entry.name, err);
                }
            } else if (entry.isDirectory) {
                try {
                    const dirReader = entry.createReader();
                    // readEntries might not return all files at once, need to loop
                    const readEntries = async () => {
                        return new Promise((resolve, reject) => {
                            dirReader.readEntries(resolve, reject);
                        });
                    };
                    
                    let entries;
                    do {
                        entries = await readEntries();
                        for (const childEntry of entries) {
                            queue.push(childEntry);
                        }
                    } while (entries.length > 0);
                } catch (err) {
                     console.error("Error reading directory:", entry.name, err);
                }
            }
        }

        if (files.length > 0) {
            this.handleFolderSelection(files);
        }
    }

    async handleTauriDrop(paths) {
        console.log('[Tauri Drop] Received paths:', paths);
        
        // Show loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'tauri-loading';
        loadingDiv.style.position = 'fixed';
        loadingDiv.style.top = '50%';
        loadingDiv.style.left = '50%';
        loadingDiv.style.transform = 'translate(-50%, -50%)';
        loadingDiv.style.padding = '20px';
        loadingDiv.style.background = 'rgba(0,0,0,0.8)';
        loadingDiv.style.color = 'white';
        loadingDiv.style.borderRadius = '10px';
        loadingDiv.style.zIndex = '9999';
        loadingDiv.innerText = i18n[this.currentLanguage].scanningFiles;
        document.body.appendChild(loadingDiv);

        try {
            const allFiles = [];
            // 记录第一个有效的目录路径用于保存
            let validDirPath = null;
            
            for (const path of paths) {
                console.log('[Tauri Drop] Scanning path:', path);
                const files = await this.scanTauriFiles(path, path);
                console.log('[Tauri Drop] Found files:', files.length);
                allFiles.push(...files);
                
                // 记录第一个路径作为保存的目录
                if (!validDirPath && files.length > 0) {
                    validDirPath = path;
                }
            }

            console.log('[Tauri Drop] Total files found:', allFiles.length);
            if (allFiles.length > 0) {
                // Log first few files for debugging
                allFiles.slice(0, 5).forEach(f => {
                    console.log('[Tauri Drop] Sample file:', f.name, 'webkitRelativePath:', f.webkitRelativePath);
                });
                
                // 检查是否是有效的 TeslaCam 目录
                const hasTeslaCamSubfolders = allFiles.some(file => 
                    file.webkitRelativePath.includes('RecentClips/') ||
                    file.webkitRelativePath.includes('SavedClips/') ||
                    file.webkitRelativePath.includes('SentryClips/')
                );
                
                if (hasTeslaCamSubfolders && validDirPath) {
                    // 保存路径到配置文件，供下次启动使用
                    await this.saveTauriConfig({ lastTeslaCamPath: validDirPath });
                    console.log('[Tauri Drop] Saved path to config:', validDirPath);
                }
                
                this.handleFolderSelection(allFiles);
            } else {
                notify('No files found in the dropped folder.');
            }
        } catch (e) {
            console.error('Tauri drop error:', e);
            notify('Error reading files: ' + e.message, 'error');
        } finally {
            if (loadingDiv) loadingDiv.remove();
        }
    }

    // Android: the recursive walk runs in Rust (one IPC call instead of one per folder,
    // and it doesn't depend on the fs plugin's JS-side path scope).
    async nativeScanFiles(rootPath) {
        const report = await nativeInvoke('scan_media_dir', { path: rootPath });
        this.lastScanTruncated = !!report.truncated;
        return (report.files || []).map(full => new TauriFile({ name: full.split('/').pop(), path: full }, rootPath));
    }

    async scanTauriFiles(currentPath, rootPath) {
        const tauri = getTauri();
        const files = [];
        
        try {
            let isDir = false;
            let isFile = false;
            
            try {
                const metadata = await tauri.fs.stat(currentPath);
                isDir = metadata.isDirectory;
                isFile = metadata.isFile;
            } catch (e) {
                console.warn('Stat failed for', currentPath, e);
                return [];
            }

            if (isFile) {
                const name = currentPath.split(/[\\/]/).pop();
                files.push(new TauriFile({ name, path: currentPath }, rootPath));
            } else if (isDir) {
                const entries = await tauri.fs.readDir(currentPath);
                for (const entry of entries) {
                     const separator = currentPath.includes('\\') ? '\\' : '/';
                     const fullPath = currentPath + (currentPath.endsWith(separator) ? '' : separator) + entry.name;
                     
                     if (entry.isDirectory) {
                         const subFiles = await this.scanTauriFiles(fullPath, rootPath);
                         files.push(...subFiles);
                     } else if (entry.isFile) {
                         files.push(new TauriFile({ name: entry.name, path: fullPath }, rootPath));
                     }
                }
            }
        } catch (e) {
            console.warn(`Error scanning ${currentPath}:`, e);
        }
        return files;
    }

    async handleFolderSelection(files) {
        // 清理旧数据，释放内存
        this.cleanupOldData();
        
        this.allFiles = Array.from(files);
        
        console.log('[handleFolderSelection] Total files:', this.allFiles.length);
        // Log sample paths for debugging
        this.allFiles.slice(0, 5).forEach(f => {
            console.log('[handleFolderSelection] File:', f.name, 'webkitRelativePath:', f.webkitRelativePath);
        });

        const hasTeslaCamSubfolders = this.allFiles.some(file => 
            file.webkitRelativePath.includes('RecentClips/') ||
            file.webkitRelativePath.includes('SavedClips/') ||
            file.webkitRelativePath.includes('SentryClips/')
        );
        
        console.log('[handleFolderSelection] hasTeslaCamSubfolders:', hasTeslaCamSubfolders);

        if (!hasTeslaCamSubfolders) {
            notify(i18n[this.currentLanguage].invalidFolder);
            this.dom.folderInput.value = ''; 
            this.allFiles = [];
            this.showInitialHelpMessage();
            return;
        }

        this.eventGroups = await this.processFiles(this.allFiles);
        console.log('[handleFolderSelection] eventGroups:', this.eventGroups.length);
        this.filterAndRender();
    }

    async handleIOSFileSelection(files) {
        if (!files || files.length === 0) return;
        
        // Convert files to array and add fake webkitRelativePath based on filename
        this.allFiles = Array.from(files).map(file => {
            // TeslaCam filename format: 2024-01-15_12-30-00-front.mp4
            // Create a fake path structure for iOS
            const timestampMatch = file.name.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2})-\d{2}/);
            if (timestampMatch) {
                // Create fake relative path: RecentClips/2024-01-15_12-30/filename.mp4
                const eventFolder = timestampMatch[1].replace(/_/g, '-');
                const fakePath = `RecentClips/${eventFolder}/${file.name}`;
                // Create a new object that mimics the file with webkitRelativePath
                return Object.defineProperty(file, 'webkitRelativePath', {
                    value: fakePath,
                    writable: false
                });
            }
            return file;
        });

        const validFiles = this.allFiles.filter(f => f.webkitRelativePath && f.name.endsWith('.mp4'));
        
        if (validFiles.length === 0) {
            const lang = this.currentLanguage;
            notify(lang === 'zh' 
                ? '未找到有效的TeslaCam视频文件。请选择文件名格式为 "2024-01-15_12-30-00-front.mp4" 的视频文件。'
                : 'No valid TeslaCam video files found. Please select video files with filename format like "2024-01-15_12-30-00-front.mp4".');
            this.dom.fileInputIOS.value = '';
            this.allFiles = [];
            this.showInitialHelpMessage();
            return;
        }

        this.eventGroups = await this.processFiles(this.allFiles);
        this.filterAndRender();
    }

    async processFiles(files) {
        const eventMap = new Map();
        const videoFiles = files.filter(f => f.name.endsWith('.mp4'));
        for (const file of videoFiles) {
            const eventType = this.getEventType(file.webkitRelativePath);
            if (eventType === 'Unknown') continue;
            const timestampMatch = file.name.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2})-\d{2}/);
            if (!timestampMatch) continue;
            const eventId = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
            if (!eventMap.has(eventId)) eventMap.set(eventId, { eventId, eventType, segments: new Map() });
            const event = eventMap.get(eventId);
            const minuteTimestamp = timestampMatch[1];
            if (!event.segments.has(minuteTimestamp)) event.segments.set(minuteTimestamp, { timestamp: minuteTimestamp, files: {} });
            const segment = event.segments.get(minuteTimestamp);
            const cameraType = this.getCameraType(file.name);
            if (cameraType) segment.files[cameraType] = file;
        }

        const jsonFiles = files.filter(f => f.name === 'event.json');
        // Each read is a round trip to the loopback media server, so awaiting them one after
        // another made a 200-clip stick pay 200 serial trips before the list drew anything.
        // Six at a time keeps the small-server case from queueing behind itself, and the logging
        // that used to sit in this loop cost more than the reads.
        const withLocation = jsonFiles.filter(f => {
            const eventId = f.webkitRelativePath.substring(0, f.webkitRelativePath.lastIndexOf('/'));
            return eventMap.has(eventId) ? (f.eventId = eventId, true) : false;
        });
        for (let i = 0; i < withLocation.length; i += 6) {
            await Promise.all(withLocation.slice(i, i + 6).map(async (jsonFile) => {
                try {
                    const eventData = JSON.parse(await jsonFile.text());
                    const eventObj = eventMap.get(jsonFile.eventId);
                    eventObj.city = eventData.city;
                    eventObj.street = eventData.street;
                    eventObj.eventTimestamp = eventData.timestamp;
                    eventObj.lat = eventData.est_lat;
                    eventObj.lon = eventData.est_lon;
                    if (typeof eventData.reason === 'string') eventObj.reason = eventData.reason;
                } catch (e) {
                    console.error(`Error parsing event.json for ${jsonFile.eventId}:`, e);
                }
            }));
        }

        const thumbFiles = files.filter(f => f.name === 'thumb.png');
        for(const thumb of thumbFiles) {
            const thumbDir = thumb.webkitRelativePath.substring(0, thumb.webkitRelativePath.lastIndexOf('/'));
            if (eventMap.has(thumbDir)) eventMap.get(thumbDir).thumbFile = thumb;
        }
        return Array.from(eventMap.values()).map(event => {
            event.segments = Array.from(event.segments.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            if (event.segments.length > 0) {
                // Try to get precise start time from the first file of the first segment
                const firstSegment = event.segments[0];
                const firstFile = Object.values(firstSegment.files)[0];
                if (firstFile) {
                    const match = firstFile.name.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
                    if (match) {
                        event.startTime = match[1];
                    } else {
                        event.startTime = firstSegment.timestamp;
                    }
                } else {
                    event.startTime = firstSegment.timestamp;
                }
            }
            return event;
        }).filter(e => e.segments.length > 0).sort((a, b) => b.startTime.localeCompare(a.startTime));
    }

    hasActiveFilters() {
        const dom = this.dom;
        return !!(dom.dateFilter?.value || dom.eventFilter?.value
            || (dom.eventSearch?.value || '').trim() || this.starredOnly);
    }

    /**
     * The only way out of a filtered-to-nothing list used to be remembering which of four controls
     * was tapped. Sorting is deliberately left alone — it never hides a record.
     */
    clearFilters() {
        this.dom.dateFilter.value = '';
        this.dom.eventFilter.value = '';
        if (this.dom.eventSearch) this.dom.eventSearch.value = '';
        if (this.starredOnly) {
            this.starredOnly = false;
            this.updateStarFilterLabel();
        }
        this.filterAndRender();
        this.showToast(i18n[this.currentLanguage].filtersCleared, 'info', 1800);
    }

    filterAndRender() {
        const dateFilter = this.dom.dateFilter.value;
        const eventFilter = this.dom.eventFilter.value;
        const query = (this.dom.eventSearch ? this.dom.eventSearch.value : '').trim().toLowerCase();
        let filteredEvents = this.eventGroups.filter(event =>
            (!dateFilter || event.startTime.startsWith(dateFilter)) &&
            (!eventFilter || event.eventType === eventFilter) &&
            (!this.starredOnly || this.isStarred(event.eventId)) &&
            (!query || this.eventMatchesSearch(event, query))
        );
        // eventGroups is built newest-first; the toggle only flips the display order, so the
        // scan itself never has to be redone.
        if (this.sortOrder === 'oldest') filteredEvents = filteredEvents.slice().reverse();
        this.renderDateChips();
        // Auto-next follows what the user is looking at, not the raw scan order.
        this.lastFilteredEvents = filteredEvents;
        this.videoListComponent.render(filteredEvents);
    }

    eventMatchesSearch(event, query) {
        /* The card renders 「哨兵」, never `sentry`, so matching only the raw fields made a
           search for what is actually on screen return nothing. */
        const label = this.videoListComponent?.getEventTypeLabel(event.eventType);
        return [event.eventId, event.eventType, event.startTime, event.city, event.street, label]
            .some(field => typeof field === 'string' && field.toLowerCase().includes(query))
            || this.eventMatchesClock(event, query);
    }

    /**
     * 「14:30」 is how somebody remembers an incident, and no field on the event contains it —
     * `startTime` is an ISO stamp. So a clock-shaped query is read as a time of day and matched
     * against the window the event actually covers, which makes the search box work the way the
     * memory does.
     */
    eventMatchesClock(event, query) {
        const at = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(query);
        if (!at) return false;
        const hour = Number(at[1]);
        const minutes = Number(at[2]);
        if (hour > 23 || minutes > 59) return false;
        const wanted = hour * 3600 + minutes * 60 + Number(at[3] || 0);
        const start = new Date(event.startTime);
        if (Number.isNaN(start.getTime())) return false;
        // The length lives in the per-segment table, which only exists once a clip has been
        // opened; before that an event is its minute count, which is what the cards say too.
        const seconds = (event.segmentDurations || []).reduce((sum, d) => sum + (d || 60), 0)
            || (event.segments?.length || 1) * 60;
        const from = start.getHours() * 3600 + start.getMinutes() * 60 + start.getSeconds();
        // Spilling past midnight is a different day, not a wrap-around match.
        return wanted >= from && wanted <= from + seconds;
    }

    // A flatpickr calendar is fiddly one-handed, so the phone also gets one chip per day that
    // actually has clips. The calendar stays for anything outside the loaded range.
    renderDateChips() {
        const wrap = this.dom.dateChips;
        if (!wrap) return;
        const dates = [...new Set(this.eventGroups.map(e => (e.startTime || '').slice(0, 10)))]
            .filter(Boolean).sort();
        // The chips are the list's spine, so they have to run the same direction the cards do.
        if (this.sortOrder === 'newest') dates.reverse();
        const shown = dates.slice(0, 8);
        const signature = shown.join(',');
        if (wrap.dataset.signature !== signature) {
            wrap.dataset.signature = signature;
            wrap.textContent = '';
            const add = (value, label) => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'date-chip';
                chip.dataset.date = value;
                chip.textContent = label;
                wrap.appendChild(chip);
            };
            add('', i18n[this.currentLanguage].allDates);
            shown.forEach(d => add(d, `${d.slice(5, 7)}-${d.slice(8, 10)}`));
        }
        const active = this.dom.dateFilter.value || '';
        wrap.querySelectorAll('.date-chip').forEach(chip => {
            chip.classList.toggle('is-active', chip.dataset.date === active);
        });
    }

    async playEvent(eventId) {
        const event = this.eventGroups.find(e => e.eventId === eventId);
        if (!event) return;
        if (this.currentEvent && this.currentEvent.eventId !== eventId) this.rememberPlaybackPosition();
        this.currentEvent = event;
        // A framing the user chose for the last clip's picture is not a framing for this one.
        this.resetFeedZoom();
        this.decodeHintShown = false;
        this.decodeDowngraded = false;
        this.setHeaderEventName(event);
        this.applyTriggerHighlight(event);

        if (this.dom.headerLocationDisplay) {
            const hasPlace = !!(event.city && event.lat && event.lon);
            // The row is a place label that happens to open the map links, so with no coordinates in
            // `event.json` there is nothing to show — including on a phone, where it used to stand in
            // for the 轨迹 entry that is now offline.
            if (hasPlace) {
                const locationText = event.street ? `${event.city} · ${event.street}` : event.city;
                this.dom.headerLocationDisplay.innerHTML = '📍 <span class="city-text">'
                    + locationText + '</span>';
                this.dom.headerLocationDisplay.onclick = () => this.showMapModal(event.lat, event.lon, event);
                this.dom.headerLocationDisplay.style.display = 'block';
            } else {
                this.dom.headerLocationDisplay.innerHTML = '';
                this.dom.headerLocationDisplay.onclick = null;
                this.dom.headerLocationDisplay.style.display = 'none';
            }
        }

        // A phone screen turns PIP into four postage stamps, so there the default is the
        // 4-grid, and whichever grid the user last picked is kept for the next event. This has
        // to happen *before* the hero steps aside: applied after the load, the reveal showed the
        // CSS default (one big feed with three PIP boxes) for the few seconds six files take to
        // open, and that stale arrangement flashing up is what it reads as.
        const initialLayout = isPhoneLayout()
            ? (localStorage.getItem('tdashcam.layout') || 'grid4')
            : 'legacy';
        this.multiCameraPlayer.setCamera('front');
        this.multiCameraPlayer.setLayout(initialLayout);
        this.videoControls.updateViewSwitcherUI(initialLayout);
        this.dom.playerArea.classList.remove('empty');

        // The drawer is a means to pick a clip, not a place to live: once one is loaded it steps
        // out of the way of the picture.
        if (isPhoneLayout()) this.toggleSidebar(false);

        this.videoControls.setEventStartTime(event.startTime);
        
        // Check for pillars and update UI
        const hasPillars = event.segments.some(seg => seg.files.left_pillar || seg.files.right_pillar);
        this.videoControls.updatePillarButtons(hasPillars);

        if (!event.totalDuration || event.totalDuration <= 0) {
            await this.continuousPlayer.calculateEventDurations(event);
        }

        await this.continuousPlayer.loadEvent(event); 
        this.videoControls.setTotalDuration(this.continuousPlayer.getTotalDuration());
        this.videoControls.addEventMarkers(event);

        // Where a tap on a card lands is the user's call, not ours: the ⋮ switch offers 接着上次 /
        // 从头播 / 跳到事件. Desktop keeps its old always-from-zero behaviour untouched.
        await this.applyTapEntryPoint(event);
        
        // Load speed graph for entire event (async, don't block playback)
        this.loadSpeedGraphForEvent(event);

        await this.multiCameraPlayer.playAll();

        document.querySelectorAll('.video-card.active').forEach(c => c.classList.remove('active'));
        document.querySelector(`.video-card[data-event-id="${eventId}"]`)?.classList.add('active');
    }
    
    /**
     * Load speed data for all segments and draw the speed graph
     */
    /**
     * The route in `#mapModal`, drawn here instead of asked of a tile server: an event folder is a
     * closed piece of driving, the phone often has no bars over it, and the only thing that makes a
     * track readable as telemetry is the state the car was in. The polyline is therefore cut into
     * runs by `autopilotState` — the same colours the steering-wheel icon uses.
     *
     * Only the front view is decoded, so a clip whose SEI carries no position answers 「一个定位点」;
     * that is what domestic recordings usually write, not a failure here.
     */
    renderRouteMap() {
        if (!ROUTE_TRACK_ENABLED) return;
        const canvas = this.dom.routeCanvas;
        if (!canvas || !this.dom.mapModal?.classList.contains('show')) return;
        const points = this.routePoints();
        const note = this.dom.routeNote;
        const translations = i18n[this.currentLanguage];
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cssWidth = Math.max(120, canvas.clientWidth);
        const cssHeight = Math.max(90, canvas.clientHeight);
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        if (points.length === 0) {
            note.textContent = translations.routeNoPoints;
            note.style.display = 'block';
            this.renderRouteLegend([]);
            return;
        }
        if (points.length === 1) {
            note.textContent = translations.routeOnePoint;
            note.style.display = 'block';
            this.renderRouteLegend([points[0].state]);
            this.drawRouteMarker(ctx, cssWidth / 2, cssHeight / 2,
                ROUTE_STATE_COLORS[points[0].state] || ROUTE_STATE_COLORS.NONE, true);
            return;
        }
        note.style.display = 'none';
        this.renderRouteLegend(points.map(point => point.state));

        const projection = this.routeProjection(points, cssWidth, cssHeight);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Run-length the colour changes: a minute at 36 Hz is a hundred `beginPath` calls per segment
        // if each sample draws its own line, and the same handful of runs is what the eye sees.
        const runs = [];
        points.forEach((point, index) => {
            const last = runs[runs.length - 1];
            if (last && last.state === point.state && last.to === index) last.to = index + 1;
            else runs.push({ state: point.state, from: index, to: index + 1 });
        });
        runs.forEach((run) => {
            ctx.beginPath();
            ctx.strokeStyle = ROUTE_STATE_COLORS[run.state] || ROUTE_STATE_COLORS.NONE;
            ctx.lineWidth = 4;
            for (let i = run.from; i <= Math.min(run.to, points.length - 1); i++) {
                const xy = projection(i);
                if (i === run.from) ctx.moveTo(xy[0], xy[1]);
                else ctx.lineTo(xy[0], xy[1]);
            }
            ctx.stroke();
        });
        const first = projection(0);
        const last = projection(points.length - 1);
        this.drawRouteMarker(ctx, first[0], first[1], '#34c759', false);
        this.drawRouteMarker(ctx, last[0], last[1], '#ffb020', true);
        // Where the clip currently is on that line: the map stays open while the video keeps
        // playing, and a static track answers 「车后来去哪了」 but not 「我正在看的这段在哪」.
        const now = this.continuousPlayer?.getCurrentTime?.();
        if (Number.isFinite(now)) {
            let at = 0;
            for (let i = 0; i < points.length; i++) {
                if (points[i].time <= now) at = i;
                else break;
            }
            const xy = projection(at);
            ctx.beginPath();
            ctx.arc(xy[0], xy[1], 7, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.stroke();
        }
    }

    /**
     * Position samples on the *event* clock, deduplicated. `sample.time` restarts at zero for every
     * one-minute file, so the segment start has to be folded in before the playhead comparison —
     * and the source arrays are read, never rewritten: `currentMetadata` is the metadata panel's own
     * table and re-timing it would move every reading.
     */
    routePoints() {
        const event = this.routeEvent || this.currentEvent;
        const raw = event?.telemetrySamples?.length
            ? event.telemetrySamples
            // A card tapped straight from the list has no decoded samples yet — the speed graph is
            // what produces them, and it runs when a clip opens. Only the playing clip can fall back
            // to the metadata panel's live table.
            : (event === this.currentEvent ? (this.metadataManager?.currentMetadata || []) : []);
        const out = [];
        const seen = new Set();
        for (const sample of raw) {
            const data = sample.data || sample;
            const lat = Number(data.latitudeDeg ?? data.lat);
            const lon = Number(data.longitudeDeg ?? data.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat === 0 || lon === 0) continue;
            const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
            if (seen.has(key)) {
                const last = out[out.length - 1];
                if (last) last.state = data.autopilotState || 'NONE';
                continue;
            }
            seen.add(key);
            out.push({
                time: (Number(sample.segmentStart) || 0) + (Number(sample.time) || 0),
                lat,
                lon,
                state: data.autopilotState || 'NONE',
            });
        }
        if (!out.length) {
            // `event.json` writes the place the clip was saved even where the SEI carries no fix, so
            // the map can still answer 「这是在哪」 for a card that was never opened.
            const lat = Number(event?.lat), lon = Number(event?.lon);
            if (Number.isFinite(lat) && Number.isFinite(lon) && (lat || lon)) {
                out.push({ time: 0, lat, lon, state: 'NONE' });
            }
        }
        return out;
    }

    /** The colours that appear in this clip, in reading order — a legend for a state never driven
     *  in is noise, and `NONE` belongs last because most of a manual clip is that. */
    renderRouteLegend(states) {
        const legend = this.dom.routeLegend;
        if (!legend) return;
        const translations = i18n[this.currentLanguage];
        const labels = {
            SELF_DRIVING: translations.routeApSelfDriving,
            AUTOSTEER: translations.routeApAutosteer,
            TACC: translations.routeApTacc,
            NONE: translations.routeApNone,
        };
        const order = ['SELF_DRIVING', 'AUTOSTEER', 'TACC', 'NONE'];
        const present = new Set(states);
        legend.innerHTML = order.filter(state => present.has(state)).map((state) =>
            `<span class="route-key"><i style="background:${ROUTE_STATE_COLORS[state] || ROUTE_STATE_COLORS.NONE}"></i>`
            + `${labels[state] || state}</span>`).join('');
    }

    /**
     * Equirectangular with the longitude squeezed by the latitude. Over the few kilometres a clip
     * covers this is indistinguishable from a Mercator projection, and it needs no clamping.
     */
    routeProjection(points, width, height) {
        const lats = points.map(p => p.lat);
        const lons = points.map(p => p.lon);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        const minLon = Math.min(...lons), maxLon = Math.max(...lons);
        const pad = 16;
        const midLat = (minLat + maxLat) / 2;
        const k = Math.cos(midLat * Math.PI / 180);
        const xSpan = Math.max(1e-6, (maxLon - minLon) * k);
        const ySpan = Math.max(1e-6, maxLat - minLat);
        const scale = Math.min((width - pad * 2) / xSpan, (height - pad * 2) / ySpan);
        const offX = (width - xSpan * scale) / 2;
        const offY = (height - ySpan * scale) / 2;
        return (index) => {
            const { lat, lon } = points[index];
            return [offX + ((lon - minLon) * k) * scale, height - offY - (lat - minLat) * scale];
        };
    }

    drawRouteMarker(ctx, x, y, color, filled) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = filled ? color : 'rgba(0, 0, 0, 0.55)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    async loadSpeedGraphForEvent(event) {
        if (!event || !event.segments || event.segments.length === 0) {
            this.videoControls.clearSpeedGraph();
            return;
        }
        
        try {
            const allSegmentsMetadata = [];
            const segmentDurations = event.segmentDurations || [];
            
            for (let i = 0; i < event.segments.length; i++) {
                const segment = event.segments[i];
                const file = segment.files?.front;
                
                if (!file) {
                    allSegmentsMetadata.push([]);
                    continue;
                }
                
                try {
                    let buffer;
                    if (file instanceof File) {
                        buffer = await file.arrayBuffer();
                    } else if (file instanceof TauriFile) {
                        buffer = await file.arrayBuffer();
                    } else if (file && file.path) {
                        const response = await fetch(getFileUrl(file));
                        buffer = await response.arrayBuffer();
                    } else {
                        allSegmentsMetadata.push([]);
                        continue;
                    }
                    
                    const parser = new DashcamMP4(buffer);
                    const rawMetadata = parser.parseMetadata();
                    
                    if (this.metadataManager && this.metadataManager.SeiMetadata) {
                        const segmentStart = event.segmentStartTimes?.[i] ?? i * 60;
                        const segmentMeta = rawMetadata.map(item => {
                            try {
                                const decoded = this.metadataManager.SeiMetadata.decode(item.data);
                                return {
                                    time: item.time,
                                    segmentStart,
                                    data: this.metadataManager.SeiMetadata.toObject(decoded, { enums: String, longs: String })
                                };
                            } catch {
                                return null;
                            }
                        }).filter(Boolean);
                        allSegmentsMetadata.push(segmentMeta);
                    } else {
                        allSegmentsMetadata.push([]);
                    }
                } catch (err) {
                    console.warn(`[SpeedGraph] Failed to load metadata for segment ${i}:`, err);
                    allSegmentsMetadata.push([]);
                }
            }
            
            this.videoControls.drawSpeedGraph(allSegmentsMetadata, segmentDurations);
            // The route map needs the same decode the speed graph already paid for, so the samples
            // stay on the event instead of a second pass over every one-minute file.
            event.telemetrySamples = allSegmentsMetadata.flat();
            if (this.dom.mapModal?.classList.contains('show')) this.renderRouteMap();
        } catch (err) {
            console.error('[SpeedGraph] Error loading speed graph:', err);
            this.videoControls.clearSpeedGraph();
        }
    }
    
    /**
     * Export all metadata from the current event to a CSV file
     */
    async exportMetadataToCSV() {
        const lang = this.currentLanguage;
        const translations = i18n[lang];
        
        if (!this.currentEvent || !this.currentEvent.segments) {
            notify(translations.exportMetadataNoData);
            return;
        }
        
        try {
            const allMetadata = [];
            const segmentDurations = this.currentEvent.segmentDurations || [];
            let accumulatedTime = 0;
            
            // Parse event start time for timestamp calculation
            let eventStartDate = null;
            
            // Helper function to parse timestamp
            const parseTimestampStr = (timestamp) => {
                if (!timestamp) return null;
                try {
                    // Parse "2024-01-01_12-00-00" or "2024-01-01_12-00" format
                    const [datePart, timePart] = timestamp.split('_');
                    if (datePart && timePart) {
                        // Handle both HH-MM-SS and HH-MM formats
                        const timeComponents = timePart.split('-');
                        let timeStr;
                        if (timeComponents.length >= 3) {
                            // Has seconds: HH-MM-SS
                            timeStr = `${timeComponents[0]}:${timeComponents[1]}:${timeComponents[2]}`;
                        } else if (timeComponents.length === 2) {
                            // No seconds: HH-MM, add :00
                            timeStr = `${timeComponents[0]}:${timeComponents[1]}:00`;
                        } else {
                            return null;
                        }
                        const result = new Date(`${datePart}T${timeStr}`);
                        console.log(`[ExportCSV] Parsed timestamp: "${timestamp}" -> "${datePart}T${timeStr}" -> ${result}`);
                        return result;
                    }
                } catch (e) {
                    console.warn('[ExportCSV] Failed to parse timestamp:', timestamp, e);
                }
                return null;
            };
            
            // Try event.startTime first
            console.log('[ExportCSV] event.startTime:', this.currentEvent.startTime);
            if (this.currentEvent.startTime) {
                eventStartDate = parseTimestampStr(this.currentEvent.startTime);
            }
            
            // Fallback: try to get timestamp from first segment
            if (!eventStartDate || isNaN(eventStartDate.getTime())) {
                const firstSegment = this.currentEvent.segments[0];
                if (firstSegment?.timestamp) {
                    eventStartDate = parseTimestampStr(firstSegment.timestamp);
                } else if (firstSegment?.files?.front) {
                    // Try to extract from filename (e.g., "2024-01-14_21-13-36-front.mp4")
                    const frontFile = firstSegment.files.front;
                    const filename = frontFile.name || frontFile.path?.split(/[/\\]/).pop() || '';
                    const match = filename.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
                    if (match) {
                        eventStartDate = parseTimestampStr(match[1]);
                    }
                }
            }
            
            console.log('[ExportCSV] Event start date:', eventStartDate);
            
            // Load metadata from all segments
            for (let i = 0; i < this.currentEvent.segments.length; i++) {
                const segment = this.currentEvent.segments[i];
                const file = segment.files?.front;
                const segmentStartTime = accumulatedTime;
                
                // Get segment-specific timestamp - prioritize filename (has full timestamp with seconds)
                let segmentBaseDate = null;
                
                // First try to extract from filename (most accurate, includes seconds)
                if (file) {
                    const filename = file.name || file.path?.split(/[/\\]/).pop() || '';
                    const match = filename.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
                    if (match) {
                        segmentBaseDate = parseTimestampStr(match[1]);
                        console.log(`[ExportCSV] Segment ${i} timestamp from filename: ${match[1]}`);
                    }
                }
                
                // Fallback to segment.timestamp if filename parsing failed
                if (!segmentBaseDate && segment.timestamp) {
                    segmentBaseDate = parseTimestampStr(segment.timestamp);
                }
                
                // Final fallback to event start date
                if (!segmentBaseDate) {
                    segmentBaseDate = eventStartDate;
                }
                
                if (file) {
                    try {
                        let buffer;
                        if (file instanceof File) {
                            buffer = await file.arrayBuffer();
                        } else if (file instanceof TauriFile) {
                            buffer = await file.arrayBuffer();
                        } else if (file && file.path) {
                            const response = await fetch(getFileUrl(file));
                            buffer = await response.arrayBuffer();
                        }
                        
                        if (buffer) {
                            const parser = new DashcamMP4(buffer);
                            const rawMetadata = parser.parseMetadata();
                            
                            if (this.metadataManager && this.metadataManager.SeiMetadata) {
                                for (const item of rawMetadata) {
                                    try {
                                        const decoded = this.metadataManager.SeiMetadata.decode(item.data);
                                        const data = this.metadataManager.SeiMetadata.toObject(decoded, { enums: String, longs: String });
                                        const eventTime = segmentStartTime + item.time;
                                        
                                        // Calculate actual timestamp using segment-specific base date
                                        let timestamp = '';
                                        if (segmentBaseDate && !isNaN(segmentBaseDate.getTime())) {
                                            // Use item.time (time within segment) + segment base date
                                            const recordTime = new Date(segmentBaseDate.getTime() + item.time * 1000);
                                            timestamp = this.formatDateTimeForCSV(recordTime);
                                        }
                                        
                                        allMetadata.push({
                                            timestamp,
                                            segmentIndex: i,
                                            segmentTime: item.time,
                                            eventTime,
                                            ...data
                                        });
                                    } catch {
                                        // Skip invalid items
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.warn(`[ExportCSV] Failed to load metadata for segment ${i}:`, err);
                    }
                }
                
                accumulatedTime += segmentDurations[i] || 60;
            }
            
            if (allMetadata.length === 0) {
                notify(translations.exportMetadataNoData);
                return;
            }
            
            // Define CSV columns (timestamp first)
            const columns = [
                'timestamp',
                'segmentIndex',
                'segmentTime',
                'eventTime',
                'vehicleSpeedMps',
                'speedKmh',
                'gearState',
                'steeringWheelAngle',
                'acceleratorPedalPosition',
                'brakeApplied',
                'blinkerOnLeft',
                'blinkerOnRight',
                'autopilotState',
                'latitudeDeg',
                'longitudeDeg',
                'headingDeg',
                'linearAccelerationMps2X',
                'linearAccelerationMps2Y',
                'linearAccelerationMps2Z'
            ];
            
            // Build CSV content
            const csvLines = [];
            // Always include timestamp in header
            csvLines.push(columns.join(','));
            
            console.log(`[ExportCSV] Building CSV with ${allMetadata.length} records, first item timestamp: "${allMetadata[0]?.timestamp || 'empty'}"`);
            
            for (const item of allMetadata) {
                const speedKmh = ((item.vehicleSpeedMps || 0) * 3.6).toFixed(2);
                const row = columns.map(col => {
                    if (col === 'speedKmh') return speedKmh;
                    if (col === 'timestamp') return item.timestamp || '';
                    const val = item[col];
                    if (val === undefined || val === null) return '';
                    if (typeof val === 'number') return val.toFixed(6);
                    if (typeof val === 'boolean') return val ? 'true' : 'false';
                    // Escape strings with commas or quotes
                    const str = String(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                });
                csvLines.push(row.join(','));
            }
            
            const csvContent = csvLines.join('\n');
            
            // Generate filename with event timestamp
            const eventTime = this.currentEvent.startTime || new Date().toISOString();
            const safeTimestamp = eventTime.replace(/[:\s]/g, '-').replace(/\//g, '-');
            const filename = `tesla_metadata_${safeTimestamp}.csv`;
            
            // Tauri environment: use Tauri dialog and fs APIs
            if (window.__TAURI__) {
                // Android has no dialog plugin: write straight into the system Download dir.
                if (isAndroidRuntime()) {
                    try {
                        const dest = joinPath(ANDROID_DOWNLOAD_DIR, filename);
                        await window.__TAURI__.fs.writeTextFile(dest, csvContent);
                        this.showToast(`${translations.exportMetadataSuccess}: ${dest}`, 'success');
                    } catch (e) {
                        console.error('[ExportCSV] Android write failed:', e);
                        this.showToast(String(e?.message || e), 'error');
                    }
                    return;
                }

                try {
                    const tauri = window.__TAURI__;
                    const invoke = tauri.core?.invoke || tauri.invoke || (tauri.tauri && tauri.tauri.invoke);
                    
                    if (!invoke) {
                        throw new Error('Tauri invoke not found');
                    }
                    
                    // Use Tauri dialog to get save path
                    const savePath = await invoke('plugin:dialog|save', {
                        options: {
                            defaultPath: filename,
                            filters: [{
                                name: 'CSV File',
                                extensions: ['csv']
                            }]
                        }
                    });
                    
                    const resolvedSavePath = typeof savePath === 'string' ? savePath : savePath?.path;
                    if (!resolvedSavePath) {
                        console.log('[ExportCSV] User cancelled save dialog');
                        return;
                    }
                    
                    // Write CSV content using Tauri fs
                    const fs = tauri.fs;
                    if (fs && fs.writeTextFile) {
                        await fs.writeTextFile(resolvedSavePath, csvContent);
                    } else if (fs && fs.writeFile) {
                        const encoder = new TextEncoder();
                        const uint8Array = encoder.encode(csvContent);
                        await fs.writeFile(resolvedSavePath, uint8Array);
                    } else {
                        // Fallback to custom command
                        const encoder = new TextEncoder();
                        const bytes = Array.from(encoder.encode(csvContent));
                        await invoke('write_binary_file', {
                            path: resolvedSavePath,
                            bytes
                        });
                    }
                    
                    console.log(`[ExportCSV] Exported ${allMetadata.length} metadata records to ${resolvedSavePath}`);
                    this.showToast(translations.exportMetadataSuccess, 'success');
                    return;
                } catch (err) {
                    console.error('[ExportCSV] Tauri save failed:', err);
                    // Fall through to web fallback
                }
            }
            
            // Web environment: Try to use File System Access API for save dialog
            if ('showSaveFilePicker' in window && !window.__TAURI__) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'CSV File',
                            accept: { 'text/csv': ['.csv'] }
                        }]
                    });
                    
                    const writable = await fileHandle.createWritable();
                    await writable.write(csvContent);
                    await writable.close();
                    
                    console.log(`[ExportCSV] Exported ${allMetadata.length} metadata records`);
                    return;
                } catch (err) {
                    // User cancelled or API not supported, fall back to download
                    if (err.name === 'AbortError') {
                        console.log('[ExportCSV] User cancelled save dialog');
                        return;
                    }
                    console.warn('[ExportCSV] File System Access API failed, falling back to download:', err);
                }
            }
            
            // Fallback: download the file directly
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`[ExportCSV] Exported ${allMetadata.length} metadata records to ${filename}`);
        } catch (err) {
            console.error('[ExportCSV] Error exporting metadata:', err);
            notify(translations.exportFailed + err.message, 'error');
        }
    }
    
    /**
     * Format date time for CSV export (YYYY-MM-DD HH:mm:ss)
     */
    formatDateTimeForCSV(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    switchCamera(viewId) {
        if (!this.currentEvent) return;

        // Choosing a view from the switcher ends any tap-to-zoom.
        this.preZoomLayout = null;
        document.body.classList.remove('camera-zoomed');
        this.resetFeedZoom();

        if (['grid', 'grid4', 'legacy'].includes(viewId)) {
            if (isPhoneLayout()) localStorage.setItem('tdashcam.layout', viewId);
            this.multiCameraPlayer.setLayout(viewId);
        } else {
            this.multiCameraPlayer.setCamera(viewId);
            this.multiCameraPlayer.setLayout('single');
        }
        this.videoControls.updateViewSwitcherUI(viewId);
    }

    /**
     * Tap a grid cell to blow it up to the whole player area, tap the enlarged feed to go
     * back to whatever grid it came from. Only wired up for phones: on desktop the same
     * click would fight with the metadata panel and the much larger cells already readable
     * at grid size.
     */
    zoomCamera(camera) {
        const player = this.multiCameraPlayer;
        // Either direction reshapes the tile, and a pan measured against the old box lands the
        // picture partly off the feed.
        this.resetFeedZoom();
        if (player.layoutMode === 'single') {
            const restore = ['grid', 'grid4', 'legacy'].includes(this.preZoomLayout) ? this.preZoomLayout : 'grid4';
            this.preZoomLayout = null;
            document.body.classList.remove('camera-zoomed');
            player.setLayout(restore);
            this.videoControls.updateViewSwitcherUI(restore);
            return;
        }
        this.preZoomLayout = player.layoutMode;
        document.body.classList.add('camera-zoomed');
        player.setCamera(camera);
        player.setLayout('single');
        this.videoControls.updateViewSwitcherUI(camera);
    }

    /**
     * Per-feed affordances, Android only. The feeds stay muted because Tesla writes no audio
     * track, so the only button a cell needs is how a tap-zoomed feed goes back — a bare tap on
     * the picture is already taken by "reveal the controls".
     */
    setupAndroidPlayerChrome() {
        if (!isAndroidRuntime()) return;

        // Clipping used to be hidden here because the desktop flow needs the FFmpeg sidecar and
        // range handles that only answered to mousemove. Both are gone on this route: the job runs
        // in the native encoder and the handles now take touch as well.
        if (isAndroidRuntime() && window.TDashcamNative?.startExport && this.videoControls?.clipBtn) {
            this.videoControls.clipBtn.style.display = '';
        }

        // The media server already answers with `Access-Control-Allow-Origin: *`, and without
        // that request mode the decoded frames taint the canvas — which is exactly what
        // "save this frame as a picture" needs. Must be set before the first src.
        Object.values(this.multiCameraPlayer.players).forEach(player => {
            if (player) player.crossOrigin = 'anonymous';
        });

        Object.entries(this.multiCameraPlayer.playerContainers).forEach(([name, container]) => {
            if (!container) return;
            const zoomOut = document.createElement('button');
            zoomOut.type = 'button';
            zoomOut.className = 'camera-zoom-out-btn';
            zoomOut.dataset.camera = name;
            zoomOut.textContent = '⤡';
            container.appendChild(zoomOut);
        });

        // R24-5: how many decoders may run at once is a property of the chip, not of the app — a
        // Snapdragon flagship carries six 1080p streams, a Unisoc mid-range gives up after three,
        // and the loser just stops painting. Without a word on the tile the black square reads as
        // a broken file, so the element that refused gets said out loud.
        Object.entries(this.multiCameraPlayer.players).forEach(([name, player]) => {
            if (!player) return;
            player.addEventListener('error', () => this.markFeedDecodeError(name));
        });

        this.refreshFeedButtonTitles();
    }

    markFeedDecodeError(camera) {
        const container = this.multiCameraPlayer.playerContainers[camera];
        if (!container || container.classList.contains('empty')) return;
        container.classList.add('feed-decode-error');
        if (!container.querySelector('.feed-decode-note')) {
            const note = document.createElement('div');
            note.className = 'feed-decode-note';
            note.textContent = i18n[this.currentLanguage].feedDecodeError;
            container.appendChild(note);
        }
        // B9: how many decoders may run at once is the chip's business, not the app's, and on a
        // mid-range phone the loser of six simultaneous streams is a black tile. Step the grid down
        // by itself instead of leaving a dead square and a hint to act on. Only from the six-way
        // view, and only once per event: one broken file must not rearrange the layout the user
        // chose, and a second error means the downgrade did not help.
        if (isPhoneLayout() && !this.decodeDowngraded
            && this.multiCameraPlayer.layoutMode === 'grid') {
            this.decodeDowngraded = true;
            this.decodeHintShown = true;
            // Deliberately not saved to `tdashcam.layout` — the next event may well carry six.
            this.multiCameraPlayer.setLayout('grid4');
            this.videoControls.updateViewSwitcherUI('grid4');
            this.showToast(i18n[this.currentLanguage].feedDecodeDowngraded, 'info', 6000);
            return;
        }
        // One hint per event, not one per missing decoder: six of them is the same single sentence.
        if (!this.decodeHintShown) {
            this.decodeHintShown = true;
            this.showToast(i18n[this.currentLanguage].feedDecodeHint, 'info', 6000);
        }
    }

    refreshFeedButtonTitles() {
        const translations = i18n[this.currentLanguage];
        document.querySelectorAll('.camera-zoom-out-btn').forEach(button => {
            button.title = translations.cameraZoomOut;
        });
    }

    /**
     * One-hand controls. The folder picker lived at the bottom of the drawer and the view
     * switcher inside the control overlay, so on a phone both primary actions were out of thumb
     * reach. Desktop never sees any of this: the bar is `display: none` outside the phone media
     * query, and the header buttons it replaces stay exactly where they were.
     */
    setupPhoneActionBar() {
        const bar = document.getElementById('phoneActionBar');
        if (!bar) return;

        bar.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;
            // The document-level listener that closes the ⋮ dropdown would otherwise swallow the
            // same click that opened it.
            e.stopPropagation();
            // Which also means this handler is the only thing that can close the dropdown when the
            // next tap lands on a different tab — the panel is a mode, not a co-worker.
            if (btn.dataset.action !== 'more' && this.dom.headerRight.classList.contains('active')) {
                this.dom.headerRight.classList.remove('active');
            }
            switch (btn.dataset.action) {
                case 'list':
                    this.toggleSidebar(this.dom.sidebar.classList.contains('collapsed'));
                    break;
                case 'folder':
                    this.dom.selectFolderBtn.click();
                    break;
                case 'layout':
                    this.cyclePhoneLayout();
                    break;
                case 'refresh':
                    this.rescanCurrentFolder();
                    break;
                case 'more':
                    this.dom.headerRight.classList.toggle('active');
                    // The ⋮ panel is the one layer that sits above the drawer, so the two open
                    // states are mutually exclusive rather than stacked — sideways the panel
                    // would otherwise land on the clip list it just covered up.
                    if (this.dom.headerRight.classList.contains('active')
                        && isPhoneLayout() && !this.dom.sidebar.classList.contains('collapsed')) {
                        this.toggleSidebar(false);
                    }
                    this.syncBackLayers?.();
                    break;
            }
        });

        // The title is the drawer's entry point now that the hamburger is gone.
        this.dom.headerEventName?.addEventListener('click', () => {
            this.toggleSidebar(this.dom.sidebar.classList.contains('collapsed'));
        });

        // The ⋮ panel closes from four different places — another tab, the scrim, the back
        // gesture, the header re-expanding — so the only way its tab can keep reporting the
        // truth is to watch the class rather than the code that sets it.
        if (this.dom.headerRight && this.dom.tabMoreBtn && window.MutationObserver) {
            new MutationObserver(() => {
                this.dom.tabMoreBtn.setAttribute('aria-expanded',
                    String(this.dom.headerRight.classList.contains('active')));
            }).observe(this.dom.headerRight, { attributes: true, attributeFilter: ['class'] });
        }
        // The drawer starts collapsed on a phone, and toggleSidebar is what normally keeps the
        // state honest, so the boot-time state has to be published once by hand.
        this.dom.tabListBtn = document.getElementById('tabListBtn');
        this.syncSidebarAria(this.dom.sidebar.classList.contains('collapsed'));

        this.updateLayoutTabLabel();
        this.updateTabAriaLabels();
        this.phoneifyIcons();
        this.setHeaderEventName(null);
    }

    setupCardContextMenu() {
        const menu = this.dom.cardContextMenu;
        if (!menu) return;

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-item');
            if (!item || item.disabled) return;
            e.stopPropagation();
            this.runCardContextAction(item.dataset.context);
        });

        // The scrim is a pseudo-element, so a tap on it reports <body> as the target and lands
        // here. The press that opened the menu is followed by a click of its own, which is why
        // the same timestamp the menu records has to gate closing it.
        document.addEventListener('click', () => {
            if (!this.contextCard) return;
            if (Date.now() < (this.suppressCardClickUntil || 0)) return;
            this.hideCardContextMenu();
        });
    }

    /**
     * B11: a fling across the picture steps through the event list, which is what a viewer
     * standing in front of a phone expects after every gallery app. The controls overlay is
     * excluded because a horizontal drag there means "seek", not "next".
     */
    setupPhoneFlingSwitcher() {
        const area = this.dom.playerArea;
        if (!area) return;
        let startX = 0, startY = 0, startAt = 0, tracking = false;

        area.addEventListener('touchstart', (e) => {
            tracking = false;
            if (!isPhoneLayout() || !this.currentEvent || e.touches.length !== 1) return;
            if (this.blocksFeedGesture(e.target)) return;
            // Both screen edges belong to the system gestures and to the drawer swipe.
            if (e.touches[0].clientX < 34) return;
            // A blown-up feed owns the finger that lands on it — that finger is steering the
            // picture, and a fling that also fired would swap the event out from under it.
            if (this.zoomedFeedAt(e.touches[0])) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startAt = Date.now();
            tracking = true;
        }, { passive: true });

        const finish = (e) => {
            if (!tracking) return;
            tracking = false;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            if (Date.now() - startAt > 400) return;
            if (Math.abs(dx) < 80 || Math.abs(dx) < 2 * Math.abs(dy)) return;
            this.suppressPlayerTapUntil = Date.now() + 400;
            this.stepThroughEvents(dx < 0 ? 1 : -1);
        };

        area.addEventListener('touchend', finish, { passive: true });
        area.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
    }

    /**
     * R23-2: a fullscreen toggle in the control row, in both orientations.
     *
     * Two halves are needed and neither is enough on its own. The activity can take the status and
     * navigation bars away, but the page's own header and capsule bar still hold their rows; CSS
     * can drop those, but the system bars stay lit without the native call. `--safe-*` follows the
     * bars by itself — `applyInsets` re-pushes them as they come and go — so nothing here reserves
     * room twice.
     */
    setupPhoneFullscreen() {
        const btn = document.getElementById('fullscreenBtn');
        if (!btn) return;
        this.dom.fullscreenBtn = btn;
        btn.addEventListener('click', () => this.togglePhoneFullscreen());
        this.updatePhoneFullscreenUi();
    }

    setPhoneFullscreen(on) {
        document.body.classList.toggle('phone-fullscreen', on);
        if (isAndroidRuntime() && window.TDashcamNative) {
            try {
                window.TDashcamNative.setFullscreen(on);
            } catch (e) {
                /* desktop */
            }
        }
        this.updatePhoneFullscreenUi();
        this.syncBackLayers?.();
    }

    togglePhoneFullscreen() {
        this.setPhoneFullscreen(!document.body.classList.contains('phone-fullscreen'));
    }

    updatePhoneFullscreenUi() {
        const btn = this.dom.fullscreenBtn;
        if (!btn) return;
        const on = document.body.classList.contains('phone-fullscreen');
        const label = i18n[this.currentLanguage][on ? 'exitFullscreen' : 'enterFullscreen'];
        btn.title = label;
        btn.setAttribute('aria-label', label);
        btn.setAttribute('aria-pressed', String(on));
        btn.classList.toggle('is-fullscreen', on);
    }

    /**
     * R23-3: a vertical drag on the picture dims or brightens it. R30-1 narrowed it to the left
     * third of the frame and gave it a rail on the right.
     *
     * It engages only after 14px of clearly *vertical* travel, which is what keeps it out of the
     * way of the horizontal fling that steps through events and of a plain tap. Below the neutral
     * mark it is a layer rather than the window's backlight attribute, because a layer is at least
     * something the user — and a screenshot — can see working; above it there is no choice, since
     * only the window can ask the panel for more light than the system slider allows.
     */
    setupPhoneBrightnessGesture() {
        const area = this.dom.playerArea;
        if (!area || !document.getElementById('phoneBrightnessDim')) return;
        this.setBrightness(parseFloat(localStorage.getItem('tdashcam.brightness')) || 1, false);

        let startX = 0, startY = 0, startLevel = 1, engaged = false, pending = false;
        const hud = document.getElementById('phoneBrightnessHud');

        area.addEventListener('touchstart', (e) => {
            engaged = false;
            pending = false;
            if (!isPhoneLayout() || !this.currentEvent || e.touches.length !== 1) return;
            if (this.blocksFeedGesture(e.target)) return;
            // The left third, and only the left third: a finger that dims the picture should not
            // be sitting on the picture it is dimming, and the two thirds to its right are where
            // the pinch, the fling and — once zoomed — the pan have to live undisturbed.
            const box = area.getBoundingClientRect();
            if (e.touches[0].clientX - box.left > box.width / 3) return;
            if (this.zoomedFeedAt(e.touches[0])) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startLevel = this.brightnessLevel;
            pending = true;
        }, { passive: true });

        area.addEventListener('touchmove', (e) => {
            if (!pending || e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            if (!engaged) {
                if (Math.abs(dy) < 14 || Math.abs(dy) <= Math.abs(dx)) return;
                engaged = true;
                this.suppressPlayerTapUntil = Date.now() + 600;
            }
            e.preventDefault();
            // A drag the height of the picture sweeps the whole range, dim end to boost end.
            const span = area.getBoundingClientRect().height || 1;
            this.setBrightness(startLevel + (-dy / span) * (BRIGHTNESS_MAX - 0.2));
            hud.classList.add('show');
            clearTimeout(this.brightnessHudTimer);
            this.brightnessHudTimer = setTimeout(() => hud.classList.remove('show'), 900);
        }, { passive: false });

        const release = () => { pending = false; engaged = false; };
        area.addEventListener('touchend', release, { passive: true });
        area.addEventListener('touchcancel', release, { passive: true });
    }

    setBrightness(level, persist = true) {
        const clamped = Math.min(BRIGHTNESS_MAX, Math.max(0.2, level));
        this.brightnessLevel = clamped;
        const dim = document.getElementById('phoneBrightnessDim');
        const fill = document.getElementById('phoneBrightnessFill');
        const value = document.getElementById('phoneBrightnessValue');
        // Rounded so the layer's opacity string never carries the float noise of a live drag.
        // Above the neutral mark there is nothing left to dim, and the rail keeps climbing.
        if (dim) dim.style.opacity = String(Math.round(Math.max(0, 1 - clamped) * 1000) / 1000);
        if (fill) {
            fill.style.height = `${Math.round(((clamped - 0.2) / (BRIGHTNESS_MAX - 0.2)) * 100)}%`;
        }
        if (value) value.textContent = `${Math.round(clamped * 100)}%`;
        this.applyWindowBrightness(clamped);
        if (persist) localStorage.setItem('tdashcam.brightness', String(clamped));
    }

    /**
     * `screenBrightness` is an absolute panel level, so the boost is interpolated from wherever the
     * system slider actually sits up to full. Starting at that value is what keeps the gesture
     * continuous across the neutral mark instead of jumping the moment it is crossed.
     */
    applyWindowBrightness(level) {
        const native = window.TDashcamNative;
        if (!native || typeof native.setScreenBrightness !== 'function') return;
        if (level <= 1.001) {
            this.systemBrightnessFraction = null;
            native.setScreenBrightness(-1);
            return;
        }
        if (this.systemBrightnessFraction == null) {
            const read = typeof native.systemBrightness === 'function'
                ? parseFloat(native.systemBrightness()) : NaN;
            this.systemBrightnessFraction = Number.isFinite(read) ? Math.min(1, Math.max(0.01, read)) : 0.5;
        }
        const base = this.systemBrightnessFraction;
        const t = Math.min(1, (level - 1) / (BRIGHTNESS_MAX - 1));
        native.setScreenBrightness(base + (1 - base) * t);
    }

    /**
     * The HUD is a full-width gradient band, and `.show` gives the whole band `pointer-events: all`,
     * so excluding it from the picture gestures used to swallow the pinch, the brightness drag and
     * the fling whenever the controls were on screen — a finger in the gap between the seek bar and
     * the buttons did nothing at all. Only the controls themselves block now; the empty band belongs
     * to the video, which is what the user is looking at.
     */
    blocksFeedGesture(target) {
        return !!(target && target.closest && target.closest(
            'button, input, select, .progress-container, .speed-control, .metadata-panel, .stats-overlay'));
    }

    /**
     * Is the feed under this finger currently blown up? The three one-finger gestures that live on
     * the picture — fling, brightness, long-press — all ask before claiming, because a finger on a
     * zoomed feed is steering it and nothing else. Answered from the stored scale rather than from
     * a flag the pan sets, so the order the listeners were registered in stays irrelevant.
     */
    zoomedFeedAt(touch) {
        if (!touch || !this.feedZoom) return false;
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = el && el.closest ? el.closest('.video-container') : null;
        const state = cell && this.feedZoom[cell.dataset.camera];
        return !!(state && state.scale > 1.01);
    }

    /**
     * R30-9: hold a finger on the picture and it runs at 3× until you let go — the one gesture a
     * dashcam review keeps asking for, since most of a parked clip is nothing happening.
     *
     * It waits 450ms, by which time every competing gesture has already declared itself (they all
     * engage inside 14px of travel), and any move past 12px cancels it. The rate is written onto the
     * live elements only: the remembered speed, the 倍速 label and `defaultPlaybackRate` are left
     * alone, so releasing puts the clip back on exactly the gear it was in.
     */
    setupPhoneLongPressBoost() {
        const area = this.dom.playerArea;
        if (!area || !document.getElementById('phoneBoostHint')) return;
        const hint = document.getElementById('phoneBoostHint');
        const value = document.getElementById('phoneBoostValue');
        let timer = null, holding = false, startX = 0, startY = 0;

        const stop = () => {
            clearTimeout(timer);
            timer = null;
            if (!holding) return;
            holding = false;
            hint.classList.remove('show');
            this.setTransientPlaybackRate(this.multiCameraPlayer?.playbackRate || 1);
        };

        area.addEventListener('touchstart', (e) => {
            stop();
            if (!isPhoneLayout() || !this.currentEvent || e.touches.length !== 1) return;
            if (this.blocksFeedGesture(e.target) || this.zoomedFeedAt(e.touches[0])) return;
            if (e.touches[0].clientX < 34) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            timer = setTimeout(() => {
                timer = null;
                const normal = this.multiCameraPlayer?.playbackRate || 1;
                if (normal >= PHONE_BOOST_RATE) return;
                holding = true;
                this.suppressPlayerTapUntil = Date.now() + 900;
                this.setTransientPlaybackRate(PHONE_BOOST_RATE);
                value.textContent = `${PHONE_BOOST_RATE}×`;
                hint.classList.add('show');
                haptic(14);
            }, 450);
        }, { passive: true });

        area.addEventListener('touchmove', (e) => {
            if (!timer || !e.touches.length) return;
            if (Math.abs(e.touches[0].clientX - startX) > 12 ||
                Math.abs(e.touches[0].clientY - startY) > 12) stop();
        }, { passive: true });

        area.addEventListener('touchend', stop, { passive: true });
        area.addEventListener('touchcancel', stop, { passive: true });
        // Backgrounding mid-hold would otherwise leave the clip running at 3× with nobody holding it.
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    }

    /** Write the rate onto the running elements without touching the remembered one. */
    setTransientPlaybackRate(rate) {
        Object.values(this.multiCameraPlayer?.players || {}).forEach(p => {
            if (!p) return;
            try { p.playbackRate = rate; } catch (e) { /* a detached element */ }
        });
    }

    /**
     * R24-3: two fingers on a feed blow its picture up, and nothing else on screen moves.
     *
     * The transform lands on the `<video>` inside the tile, and every tile already clips
     * (`overflow: hidden`), so a 3x front view is still a front view in its own cell — the grid,
     * the camera labels, the HUD, the 详细数据 plate and the control row all live outside the box
     * being scaled. Pinching smaller stops at 1x: the frame is evidence, and shrinking it to a
     * stamp serves nobody. Spread from a zoomed state back to 1x clears the tile.
     *
     * Both fingers travel together, so the midpoint also pans — clamped to the overflow, because
     * sliding past it shows the black of the tile instead of the road.
     */
    setupPhoneFeedPinch() {
        if (!isAndroidRuntime()) return;
        const area = this.dom.playerArea;
        if (!area) return;
        this.feedZoom = {};
        let active = null;

        const clampSpan = (value, limit) => Math.max(-limit, Math.min(limit, value));

        const tileAt = (touch, fallback) => {
            if (!touch) return fallback || null;
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            const found = el && el.closest ? el.closest('.video-container') : null;
            if (found) return found;
            // The HUD band is drawn on top of the picture it controls, so a finger that lands there is
            // still a finger on that feed. Resolve it by geometry when the hit-test only sees chrome.
            const covering = [...document.querySelectorAll('.video-container')].find((cell) => {
                const b = cell.getBoundingClientRect();
                return b.width > 0 && b.height > 0
                    && touch.clientX >= b.left && touch.clientX <= b.right
                    && touch.clientY >= b.top && touch.clientY <= b.bottom;
            });
            return covering || fallback || null;
        };

        const paint = (cell, state) => {
            cell.style.setProperty('--feed-zoom', String(Math.round(state.scale * 100) / 100));
            cell.style.setProperty('--feed-pan-x', `${Math.round(state.x)}px`);
            cell.style.setProperty('--feed-pan-y', `${Math.round(state.y)}px`);
            cell.classList.toggle('feed-zoomed', state.scale > 1.01);
        };

        area.addEventListener('touchstart', (e) => {
            if (!isPhoneLayout() || e.touches.length !== 2 || !this.currentEvent) return;
            if (this.blocksFeedGesture(e.target)) return;
            const first = e.target.closest ? e.target.closest('.video-container') : null;
            const cell = tileAt(e.touches[0], tileAt(e.touches[1], first));
            if (!cell) return;
            const camera = cell.dataset.camera;
            const start = this.feedZoom[camera] || { scale: 1, x: 0, y: 0 };
            const box = cell.getBoundingClientRect();
            active = {
                cell,
                camera,
                box,
                scale0: start.scale,
                x0: start.x,
                y0: start.y,
                dist0: Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY) || 1,
                mid0: {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                },
            };
            // Claimed before the WebView spends it on page zoom, and before the one-finger
            // listeners see a fling or a brightness drag in the same motion.
            e.preventDefault();
            this.suppressPlayerTapUntil = Date.now() + 900;
        }, { passive: false });

        area.addEventListener('touchmove', (e) => {
            if (!active || e.touches.length !== 2) return;
            e.preventDefault();
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY) || 1;
            const scale = Math.min(6, Math.max(1, active.scale0 * (dist / active.dist0)));
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const state = {
                scale,
                x: clampSpan(active.x0 + (midX - active.mid0.x), (scale - 1) * active.box.width / 2),
                y: clampSpan(active.y0 + (midY - active.mid0.y), (scale - 1) * active.box.height / 2),
            };
            this.feedZoom[active.camera] = state;
            paint(active.cell, state);
            this.suppressPlayerTapUntil = Date.now() + 900;
        }, { passive: false });

        // R30-10: once a feed is blown up, one finger is the pan. Holding a two-finger pinch in
        // place while the other hand steers is not a gesture anyone actually performs, and the
        // zoomed picture is the only thing on screen that still has somewhere to go.
        let pan = null;
        area.addEventListener('touchstart', (e) => {
            if (!isPhoneLayout() || e.touches.length !== 1 || !this.currentEvent || active) return;
            if (this.blocksFeedGesture(e.target)) return;
            const cell = tileAt(e.touches[0], null);
            const state = cell && this.feedZoom[cell.dataset.camera];
            if (!cell || !state || state.scale <= 1.01) return;
            pan = {
                cell,
                camera: cell.dataset.camera,
                box: cell.getBoundingClientRect(),
                scale: state.scale,
                x0: state.x,
                y0: state.y,
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
            };
            e.preventDefault();
        }, { passive: false });

        area.addEventListener('touchmove', (e) => {
            if (!pan || e.touches.length !== 1) return;
            e.preventDefault();
            const limitX = (pan.box.width * (pan.scale - 1)) / 2;
            const limitY = (pan.box.height * (pan.scale - 1)) / 2;
            const state = {
                scale: pan.scale,
                x: clampSpan(pan.x0 + (e.touches[0].clientX - pan.startX), limitX),
                y: clampSpan(pan.y0 + (e.touches[0].clientY - pan.startY), limitY),
            };
            this.feedZoom[pan.camera] = state;
            paint(pan.cell, state);
            this.suppressPlayerTapUntil = Date.now() + 400;
        }, { passive: false });

        const endPan = () => {
            if (!pan) return;
            this.suppressPlayerTapUntil = Date.now() + 400;
            pan = null;
        };
        area.addEventListener('touchend', endPan, { passive: true });
        area.addEventListener('touchcancel', endPan, { passive: true });

        const release = () => {
            if (!active) return;
            const state = this.feedZoom[active.camera];
            if (!state || state.scale <= 1.01) {
                this.feedZoom[active.camera] = { scale: 1, x: 0, y: 0 };
                paint(active.cell, this.feedZoom[active.camera]);
            }
            active = null;
            // Android still fires a click when the last finger leaves, and that click belongs to
            // "reveal the controls" — or worse, tap-to-zoom, which would replace the framing the
            // user just set with a full-area single feed.
            this.suppressPlayerTapUntil = Date.now() + 500;
        };
        area.addEventListener('touchend', release, { passive: true });
        area.addEventListener('touchcancel', release, { passive: true });

        // A rotation reshapes every tile, so a pan that was inside the overflow before it is
        // outside the picture after. Reframing is cheaper than explaining a black corner.
        const landscape = window.matchMedia && window.matchMedia('(orientation: landscape)');
        if (landscape) {
            const onChange = () => this.resetFeedZoom();
            if (landscape.addEventListener) landscape.addEventListener('change', onChange);
            else if (landscape.addListener) landscape.addListener(onChange);
        }
    }

    resetFeedZoom() {
        this.feedZoom = {};
        document.querySelectorAll('.video-container').forEach(cell => {
            cell.classList.remove('feed-zoomed');
            cell.style.removeProperty('--feed-zoom');
            cell.style.removeProperty('--feed-pan-x');
            cell.style.removeProperty('--feed-pan-y');
        });
    }

    /**
     * R24-5: the four CSS features this layout leans on are newer than the Android system image on
     * the phones that lack Play — Huawei and Honor ship a WebView frozen around Chromium 83-99 and
     * never update it, and `:has()` (105), `aspect-ratio` (88), `inset` (87) and `100dvh` inside a
     * `calc()` (108) all fail closed: a selector with an unknown pseudo-class is not ignored, the
     * whole rule is thrown away, so the ⋮ panel and the speed picker fell back under the 详细数据
     * plate and every grid tile collapsed to zero height.
     *
     * `inset` and `100dvh` are fixed in the stylesheet (spelled-out longhands and a `--viewport-h`
     * token behind `@supports`). What cannot be fixed without knowing the box is mirrored here as a
     * body class, and only on the engines that need it — a modern WebView gets no observers.
     */
    installLegacyWebViewFallbacks() {
        const supports = (property, value) => {
            try {
                return !!(window.CSS && CSS.supports && CSS.supports(property, value));
            } catch (e) {
                return true;
            }
        };
        // A selector test has to go through the one-argument form; `supports(prop, '')` is an
        // invalid pair and answers false on engines that do have the feature.
        const supportsSelector = (selector) => {
            try {
                return !!(window.CSS && CSS.supports && CSS.supports(`selector(${selector})`));
            } catch (e) {
                return true;
            }
        };
        const report = [];

        if (!supportsSelector(':has(*)')) {
            report.push('has');
            const mirror = (node, className, marker) => {
                if (!node || !window.MutationObserver) return;
                const sync = () => document.body.classList.toggle(className, node.classList.contains(marker));
                sync();
                new MutationObserver(sync).observe(node, { attributes: true, attributeFilter: ['class'] });
            };
            // Three layering rules and one background rule that were each keyed off a descendant's
            // state; the twins live beside them in the stylesheet under the same media query.
            mirror(this.dom.headerRight, 'more-panel-open', 'active');
            mirror(document.getElementById('speedControl'), 'speed-picker-open', 'active');
            mirror(this.dom.playerArea, 'player-empty', 'empty');
            // `:not(.empty)` is the other half of the same pair, and `player-empty` carries it.
            if (this.dom.playerArea && window.MutationObserver) {
                const syncShelf = () => document.body.classList.toggle('clip-loaded',
                    !this.dom.playerArea.classList.contains('empty'));
                syncShelf();
                new MutationObserver(syncShelf).observe(this.dom.playerArea,
                    { attributes: true, attributeFilter: ['class'] });
            }
        }

        if (!supports('aspect-ratio', '1 / 1')) {
            report.push('aspect-ratio');
            const area = this.dom.playerArea;
            if (area) {
                const fixTiles = () => {
                    area.querySelectorAll('.video-container').forEach(cell => {
                        if (!cell.offsetParent) return;
                        const width = cell.getBoundingClientRect().width;
                        if (!width) return;
                        // Inline `!important` is the only thing that outranks the grid's own
                        // `height: auto !important`, which is what let aspect-ratio size the tile.
                        cell.style.setProperty('height',
                            `${Math.round(width * 9 / 16)}px`, 'important');
                    });
                };
                if (window.ResizeObserver) {
                    this.legacyTileObserver = new ResizeObserver(fixTiles);
                    this.legacyTileObserver.observe(area);
                }
                window.addEventListener('resize', fixTiles);
                // Layout mode changes swap the class on `playerArea`, not its size.
                if (window.MutationObserver) {
                    new MutationObserver(fixTiles).observe(area, { attributes: true, attributeFilter: ['class'] });
                }
                this.legacyTileFix = fixTiles;
                fixTiles();
            }
        }

        if (report.length) console.log('[compat] legacy rulesets engaged:', report.join(', '));
        this.legacyCssGaps = report;
    }

    stepThroughEvents(direction) {
        const list = this.lastFilteredEvents || [];
        if (list.length < 2) return;
        const index = list.findIndex(event => event.eventId === this.currentEvent?.eventId);
        if (index < 0) return;
        const next = index + direction;
        if (next < 0 || next >= list.length) {
            const translations = i18n[this.currentLanguage];
            // Which end of time the user hit depends on which way the list runs, and saying
            // "newest" when they are looking at the oldest clip is worse than saying nothing.
            const atFront = next < 0;
            const newestEnd = (atFront && this.sortOrder === 'newest') || (!atFront && this.sortOrder === 'oldest');
            this.showToast(translations[newestEnd ? 'nextEventNone' : 'prevEventNone'], 'info', 1400);
            return;
        }
        this.playEvent(list[next].eventId);
    }

    cyclePhoneLayout() {
        const translations = i18n[this.currentLanguage];
        const order = ['grid4', 'grid', 'legacy'];
        const stored = localStorage.getItem('tdashcam.layout') || 'grid4';
        const next = order[(order.indexOf(stored) + 1) % order.length];
        localStorage.setItem('tdashcam.layout', next);
        this.updateLayoutTabLabel();

        const labels = { grid4: translations.layoutGrid4, grid: translations.layoutGrid6, legacy: translations.layoutLegacy };
        if (this.currentEvent) {
            // A tapped-into single feed is a temporary state, not the stored preference, so
            // changing the layout here has to leave it too.
            document.body.classList.remove('camera-zoomed');
            this.preZoomLayout = null;
            this.resetFeedZoom();
            this.multiCameraPlayer.setLayout(next);
            this.videoControls.updateViewSwitcherUI(next);
        }
        this.showToast(labels[next], 'info', 1400);
    }

    updateLayoutTabLabel() {
        const label = document.getElementById('tabLayoutLabel');
        if (!label) return;
        const translations = i18n[this.currentLanguage];
        const stored = localStorage.getItem('tdashcam.layout') || 'grid4';
        const names = { grid4: translations.layoutGrid4, grid: translations.layoutGrid6, legacy: translations.layoutLegacy };
        label.textContent = names[stored] || translations.tabLayout;
    }

    /**
     * Landscape hides the tab captions to save height, so the accessible name has to come from
     * the attribute rather than the text node — otherwise TalkBack announces four anonymous
     * buttons in a row.
     */
    updateTabAriaLabels() {
        const translations = i18n[this.currentLanguage];
        const tabs = {
            tabListBtn: 'tabList',
            tabFolderBtn: 'tabFolder',
            tabLayoutBtn: 'tabLayout',
            tabRefreshBtn: 'tabRefresh',
            tabMoreBtn: 'tabMore',
        };
        Object.entries(tabs).forEach(([id, key]) => {
            const btn = document.getElementById(id);
            if (btn && translations[key]) btn.setAttribute('aria-label', translations[key]);
        });
    }

    /**
     * "Refresh" has to mean the same folder it last scanned; re-opening the browser to tap the
     * same path twice is not a refresh.
     */
    async rescanCurrentFolder(options = {}) {
        const translations = i18n[this.currentLanguage];
        if (!this.lastScannedPath) {
            this.dom.selectFolderBtn.click();
            return;
        }
        await this.loadTauriDirectory(this.lastScannedPath, { pullRefresh: options.pullRefresh });
        this.showToast(translations.refreshDone.replace('{n}', this.eventGroups.length), 'info', 2000);
    }

    /**
     * Recent folders (C16). One slot for the last folder meant that anyone with two cars, or a
     * RecentClips and a SavedClips root, walked the whole tree again each time.
     */
    setupRecentDirs() {
        const wrap = document.getElementById('recentDirs');
        if (!wrap) return;
        wrap.addEventListener('click', async (e) => {
            const chip = e.target.closest('.recent-chip');
            if (!chip) return;
            e.stopPropagation();
            if (chip.dataset.path === this.lastScannedPath) return;
            // A chip for a drive that has since left would otherwise scan, fail quietly, and leave
            // the previous folder's clips on screen under a path that does not exist.
            if (await this.scannedPathGone(chip.dataset.path)) {
                await this.forgetRemovedVolumes([chip.dataset.path]);
                return;
            }
            this.loadTauriDirectory(chip.dataset.path);
        });
        this.renderRecentDirs();
        // A chip now carries its device's name, and at boot the volume list has not been read yet,
        // so the first paint falls back to the mount point. One cached fetch fixes the label.
        getStorageVolumes().then(() => this.renderRecentDirs()).catch(() => {});
        this.pruneDeadRecentDirs();
    }

    /**
     * Sideways the filter stack cost the event list more than half the drawer — 62px of list
     * in a 412px viewport, about one and a half cards. The funnel hands that height back by
     * hiding everything but the search box until asked for it; portrait and desktop never show
     * the button and the CSS that reads `filters-open` is landscape-only, so this class is
     * inert outside it.
     */
    setupFilterToggle() {
        const btn = this.dom.filterToggleBtn;
        const sidebar = this.dom.sidebar;
        if (!btn || !sidebar) return;
        const stored = (() => {
            try { return localStorage.getItem('tdashcam.filtersOpen'); } catch (e) { return null; }
        })();
        const apply = (open) => {
            sidebar.classList.toggle('filters-open', open);
            btn.classList.toggle('is-on', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        apply(stored === '1');
        btn.addEventListener('click', () => {
            const open = !sidebar.classList.contains('filters-open');
            apply(open);
            try { localStorage.setItem('tdashcam.filtersOpen', open ? '1' : '0'); } catch (e) { /* private mode */ }
        });
    }

    readRecentDirs() {
        try {
            const list = JSON.parse(localStorage.getItem(ANDROID_RECENT_DIRS_KEY) || '[]');
            return Array.isArray(list) ? list.filter(p => typeof p === 'string' && p) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Drop remembered folders that are no longer on the device, so the row only ever offers taps
     * that lead somewhere. The scan is deliberately narrow — `list_subdirs` is one readdir and a
     * missing folder fails it instantly — because a chip whose drive is merely slow or momentarily
     * busy must not be thrown away.
     */
    async pruneDeadRecentDirs() {
        if (!isAndroidRuntime()) return 0;
        const list = this.readRecentDirs();
        if (!list.length) return 0;
        const alive = [];
        const missing = [];
        for (const path of list) {
            if (await this.scannedPathGone(path)) missing.push(path);
            else alive.push(path);
        }
        if (!missing.length) return 0;
        try {
            localStorage.setItem(ANDROID_RECENT_DIRS_KEY, JSON.stringify(alive));
        } catch (e) {
            return 0;
        }
        const savedDir = localStorage.getItem(ANDROID_MEDIA_DIR_KEY);
        if (savedDir && missing.some(root => savedDir === root || savedDir.startsWith(root + '/'))) {
            try { localStorage.removeItem(ANDROID_MEDIA_DIR_KEY); } catch (e) { /* private mode */ }
        }
        this.renderRecentDirs();
        return missing.length;
    }

    rememberRecentDir(path) {
        if (!path) return;
        const list = [path, ...this.readRecentDirs().filter(p => p !== path)].slice(0, 5);
        try {
            localStorage.setItem(ANDROID_RECENT_DIRS_KEY, JSON.stringify(list));
        } catch (e) {
            return;
        }
        this.renderRecentDirs();
    }

    renderRecentDirs() {
        const wrap = document.getElementById('recentDirs');
        if (!wrap) return;
        const list = this.readRecentDirs();
        if (list.length < 2) {
            // With only the current folder there is nothing to switch between; a chip that
            // duplicates the drawer title is just another box to line up.
            wrap.textContent = '';
            wrap.style.display = 'none';
            return;
        }
        wrap.style.display = '';
        wrap.textContent = '';
        list.forEach(path => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'recent-chip' + (path === this.lastScannedPath ? ' on' : '');
            chip.dataset.path = path;
            chip.title = path;
            chip.textContent = this.dirDisplayName(path);
            wrap.appendChild(chip);
        });
    }

    /**
     * The previous label rule was "shortest tail that does not collide", which rendered
     * `/storage/emulated/0/TeslaCam` as 「0/TeslaCam」 — unique, and unreadable, because nobody
     * parses a mount point's last segment as the name of a device. Say the device in words and
     * keep the folder that actually differs.
     */
    dirDisplayName(path) {
        const translations = i18n[this.currentLanguage];
        const at = String(path || '').replace(/\/+$/, '');
        const volumes = (storageVolumesPayload && storageVolumesPayload.volumes) || [];
        const hit = volumes.find(v => v.path && (at === v.path || at.startsWith(v.path + '/')));
        if (hit) {
            // The framework calls the built-in volume "Internal shared storage" in whatever locale
            // the ROM ships, which is not the app's language. A stick's own name (SDCARD) is worth
            // keeping — it is how the user labelled the thing — but the built-in one is not.
            const device = hit.kind === 'internal'
                ? translations.volInternal : this.volumeChipLabel(hit, translations);
            return this.joinDirLabel(device, at.slice(hit.path.length));
        }
        const mount = /^(\/storage\/emulated\/[^/]+|\/storage\/[^/]+)/.exec(at);
        if (!mount) return at.replace(/^\/+/, '');
        const device = /^\/storage\/(emulated|self|users)\b/.test(mount[1])
            ? translations.volInternal : translations.volUsb;
        return this.joinDirLabel(device, at.slice(mount[1].length));
    }

    joinDirLabel(device, rest) {
        const tail = String(rest || '').replace(/^\/+/, '');
        return tail ? `${device} · ${tail}` : device;
    }

    /**
     * Pull to rescan (C17). Only armed while the list is already at the top, so an ordinary
     * flick down through a long list is never mistaken for the gesture.
     */
    setupPullToRefresh() {
        const list = this.dom.fileList;
        const spinner = document.getElementById('ptrSpinner');
        if (!list || !spinner) return;
        const THRESHOLD = 64;
        let startY = 0;
        let distance = 0;
        let pulling = false;

        list.addEventListener('touchstart', (e) => {
            pulling = e.touches.length === 1 && isPhoneLayout() && !this.isScanning && list.scrollTop <= 0;
            startY = pulling ? e.touches[0].clientY : 0;
            distance = 0;
        }, { passive: true });

        list.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            const dy = e.touches[0].clientY - startY;
            if (dy <= 0 || list.scrollTop > 0) {
                pulling = false;
                distance = 0;
                spinner.style.height = '';
                return;
            }
            // Half the travel, capped: the header should follow the finger, not race it.
            distance = Math.min(THRESHOLD * 1.5, dy * 0.5);
            spinner.style.height = `${distance}px`;
            spinner.classList.toggle('ready', distance >= THRESHOLD);
            e.preventDefault();
        }, { passive: false });

        const release = () => {
            if (!pulling) return;
            pulling = false;
            const go = distance >= THRESHOLD;
            distance = 0;
            spinner.style.height = '';
            spinner.classList.remove('ready');
            if (go) {
                haptic(10);
                this.rescanCurrentFolder({ pullRefresh: true });
            }
        };
        list.addEventListener('touchend', release);
        list.addEventListener('touchcancel', release);
    }

    showScanSkeleton(count = 5) {
        const list = this.dom.fileList;
        if (!list || !isPhoneLayout()) return;
        this.clearScanSkeleton();
        const wrap = document.createElement('div');
        wrap.className = 'scan-skeleton';
        for (let i = 0; i < count; i++) {
            const row = document.createElement('div');
            row.className = 'skeleton-card';
            row.innerHTML = `
                <div class="skeleton-block" style="width:96px;height:54px"></div>
                <div class="skeleton-col">
                    <div class="skeleton-block skeleton-line" style="width:72%"></div>
                    <div class="skeleton-block skeleton-line" style="width:44%"></div>
                </div>`;
            wrap.appendChild(row);
        }
        list.appendChild(wrap);
    }

    clearScanSkeleton() {
        document.querySelectorAll('.scan-skeleton').forEach(el => el.remove());
    }

    /**
     * One listener per row rather than one per segment: the segments are static markup, but the
     * row is what carries the meaning, and a delegate keeps the two rows on the same code path.
     */
    bindChoiceRow(row, onPick) {
        row?.addEventListener('click', (e) => {
            const seg = e.target.closest('.choice-segment');
            if (!seg || !row.contains(seg)) return;
            onPick(seg.dataset.mode);
        });
    }

    /**
     * The three phone entries of the ⋮ panel. They live in the same dropdown the desktop header
     * uses, so the buttons themselves are hidden outside the phone media query.
     */
    setupPhoneMenuButtons() {
        this.dom.snapshotBtn?.addEventListener('click', () => this.captureSnapshot());
        this.dom.autoNextBtn?.addEventListener('click', () => this.toggleAutoNext());
        this.dom.diagnosticsBtn?.addEventListener('click', () => this.copyDiagnostics());
        this.dom.starFilterBtn?.addEventListener('click', () => this.toggleStarFilter());
        this.dom.sortOrderBtn?.addEventListener('click', () => this.toggleSortOrder());
        this.dom.triggerHlBtn?.addEventListener('click', () => this.toggleTriggerHighlight());
        this.bindChoiceRow(this.dom.tapBehaviorChoice, mode => this.setTapBehavior(mode));
        this.bindChoiceRow(this.dom.themeChoice, mode => this.setThemeChoice(mode));
        // The first screen's only job is to get a folder picked, so its button is the drawer's own.
        this.dom.emptyHeroBtn?.addEventListener('click', () => this.toggleSidebar(true));
        this.updateAutoNextLabel();
        this.updateStarFilterLabel();
        this.updateSortOrderLabel();
        this.updateTriggerHighlightLabel();
        this.updateTapBehaviorLabel();
        this.updateThemeChoice();
        this.setupErrorBanner();
    }

    toggleAutoNext() {
        this.autoNextEnabled = localStorage.getItem(ANDROID_AUTO_NEXT_KEY) !== '0';
        this.autoNextEnabled = !this.autoNextEnabled;
        localStorage.setItem(ANDROID_AUTO_NEXT_KEY, this.autoNextEnabled ? '1' : '0');
        this.updateAutoNextLabel();
        this.showToast(i18n[this.currentLanguage][this.autoNextEnabled ? 'autoNextOn' : 'autoNextOff'], 'info', 1600);
    }

    updateAutoNextLabel() {
        const btn = this.dom.autoNextBtn;
        if (!btn) return;
        const on = localStorage.getItem(ANDROID_AUTO_NEXT_KEY) !== '0';
        this.autoNextEnabled = on;
        const label = i18n[this.currentLanguage][on ? 'autoNextOn' : 'autoNextOff'];
        const text = btn.querySelector('.btn-text');
        if (text) text.textContent = label;
        btn.setAttribute('aria-label', label);
        btn.classList.toggle('is-on', on);
    }

    /**
     * Save the frame under the thumb (A4). "截图取证" is the reason people open these files at
     * all, and it needs no FFmpeg — the decoded frame is already on the surface.
     */
    async captureSnapshot() {
        const translations = i18n[this.currentLanguage];
        const camera = this.multiCameraPlayer.activeCamera || 'front';
        const video = this.multiCameraPlayer.players[camera];
        if (!video || !video.videoWidth) {
            this.showToast(translations.snapshotNoVideo, 'error', 3000);
            return;
        }
        this.showToast(translations.snapshotSaving, 'info', 1200);
        // 1280 on the long edge: enough to read a plate in the gallery, and a 2.6 MP software
        // PNG encode cost eight seconds on the emulator against under one second here.
        const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        let blob;
        try {
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            blob = await new Promise((resolve, reject) => {
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/jpeg', 0.9);
            });
        } catch (e) {
            // A cross-origin frame without CORS headers taints the canvas and throws here.
            console.error('[snapshot] failed:', e);
            this.showToast(`${translations.snapshotFailed}: ${e.message || e}`, 'error', 6000);
            return;
        }

        const stamp = (this.currentEvent?.startTime || new Date().toISOString().slice(0, 19).replace('T', '_'))
            .replace(/[: ]/g, '-');
        const name = `${ANDROID_FILE_PREFIX}_${stamp}_${camera}.jpg`;
        try {
            if (isAndroidRuntime()) {
                const dest = joinPath(ANDROID_DOWNLOAD_DIR, name);
                const bytes = new Uint8Array(await blob.arrayBuffer());
                await nativeInvoke('write_binary_file', { path: dest, bytes: Array.from(bytes) });
                notifyMediaFile(dest);
                this.showToast(`${translations.snapshotSaved}: ${dest}`, 'success', 4000);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 2000);
            }
        } catch (e) {
            console.error('[snapshot] write failed:', e);
            this.showToast(`${translations.snapshotFailed}: ${e.message || e}`, 'error', 6000);
        }
    }

    /**
     * One tap that turns "it doesn't work" plus a screenshot into something readable (E22).
     */
    async copyDiagnostics() {
        const translations = i18n[this.currentLanguage];
        const native = readNativeStorageStatus() || {};
        const lines = [
            `${translations.headerTitle} ${native.version || this.dom.appVersion?.textContent || ''}`,
            `android sdk=${native.sdk || '?'} afs=${native.manage_external_storage} legacy=${native.legacy_storage}`,
            `server=${mediaServerInfo ? mediaServerInfo.base_url.replace(/\/media$/, '') : 'none'}`,
            `dir=${this.lastScannedPath || localStorage.getItem(ANDROID_MEDIA_DIR_KEY) || '-'}`,
            `recent=${this.readRecentDirs().join(' | ') || '-'}`,
            `files=${this.allFiles.length} events=${this.eventGroups.length}`,
            `current=${this.currentEvent ? `${this.currentEvent.eventType}/${this.currentEvent.startTime}` : '-'}`,
            `layout=${localStorage.getItem('tdashcam.layout') || 'grid4'} theme=${localStorage.getItem('tdashcam.themeMode') || 'auto'} dark=${document.body.classList.contains('dark-theme')}`,
            `viewport=${Math.round(innerWidth)}x${Math.round(innerHeight)} dpr=${devicePixelRatio} safe=${getComputedStyle(document.documentElement).getPropertyValue('--safe-top').trim()}/${getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom').trim()}`,
            `controls=${document.querySelector('.video-controls-overlay')?.classList.contains('show')} drawer=${this.dom.sidebar?.classList.contains('collapsed') ? 'closed' : 'open'} layers=${this.phoneLayerCount ? this.phoneLayerCount() : '?'}`,
            // Which codecs the export engine can actually reach is the first question any
            // "the export failed" report turns on.
            `export=${window.TDashcamNative?.exportCodecReport ? window.TDashcamNative.exportCodecReport(1280, 720) : 'none'}`,
            `exportJob=${this.peJob ? `${this.peJob.id} running` : 'idle'}`,
        ];
        if (this.lastError) lines.push(`lastError=${this.lastError}`);
        // The three things that decide the layout, so a report about "the bar is missing" says
        // whether the touch media query or the runtime check is what failed.
        lines.push(`device=${native.device || '?'} android=${native.android || '?'} layout=${isTabletLayout() ? 'tablet' : 'phone'} coarse=${window.matchMedia('(hover: none) and (pointer: coarse)').matches} touchUi=${document.documentElement.classList.contains('touch-ui')}`);
        const volumes = await getStorageVolumes(false);
        if (volumes) {
            lines.push(`volumes=${volumes.volumes.map(v => `${v.path}:${volumeEntries(v)}:${v.fs || '?'}:${formatBytes(v.total) || '?'}${v.readOnly ? ':ro' : ''}`).join(' | ') || '-'} usb=${volumes.usbDevices}`);
        }
        const text = lines.join('\n');
        console.log('[diagnostics]\n' + text);
        const ok = await copyTextToClipboard(text);
        this.showToast(ok ? translations.diagCopied : `${translations.diagFailed}: ${this.lastError || ''}`, ok ? 'success' : 'error', 3000);
    }

    /**
     * A release WebView renders nothing for an uncaught exception, so a broken build looks like
     * a blank page the user can only photograph. Put it on screen where they can copy it.
     */
    setupErrorBanner() {
        const banner = document.getElementById('jsErrorBanner');
        const textEl = document.getElementById('jsErrorText');
        if (!banner || !textEl) return;
        this.recentErrors = [];

        const record = (raw) => {
            const message = String(raw || 'unknown error').slice(0, 600);
            this.recentErrors.push(message);
            if (this.recentErrors.length > 5) this.recentErrors.shift();
            this.lastError = message;
            return message;
        };

        const show = (raw, where) => {
            const text = where ? `${raw} @ ${where}` : String(raw);
            textEl.textContent = `${i18n[this.currentLanguage].jsErrorTitle}: ${record(text)}`;
            banner.style.display = '';
        };

        // There is no way to attach a debugger to someone's phone, so the source position has to
        // travel with the message — one screenshot is then enough to find the line.
        const at = (e) => (e.filename ? `${e.filename.split('/').pop()}:${e.lineno}:${e.colno}` : '');
        const atStack = (stack) => {
            const frame = (stack || '').split('\n').slice(1).find(l => l.trim());
            return frame ? frame.trim().replace(/^at\s+/, '') : '';
        };

        window.addEventListener('error', (e) => {
            const isResource = e.target !== window && e.target && e.target.tagName;
            const message = isResource
                ? `${e.target.tagName} load failed: ${e.target.src || e.target.href || ''}`
                : (e.message || '');
            if (!message) return;
            // A failed CDN request is routine offline; it belongs in the diagnostics, not on
            // a red banner over someone's footage. Neither does a ResizeObserver loop notice — the
            // browser defers the extra deliveries to the next frame, it is not a failure.
            const benign = isResource || /ResizeObserver loop/i.test(message);
            if (benign) record(message);
            else show(message, at(e));
        }, true);
        window.addEventListener('unhandledrejection', (e) => {
            const message = e.reason?.message || e.reason;
            if (message) show(message, atStack(e.reason?.stack));
        });

        document.getElementById('jsErrorClose')?.addEventListener('click', (e) => {
            e.stopPropagation();
            banner.style.display = 'none';
        });
        document.getElementById('jsErrorCopy')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const ok = await copyTextToClipboard(this.recentErrors.join('\n'));
            this.showToast(ok ? i18n[this.currentLanguage].diagCopied : i18n[this.currentLanguage].diagFailed, ok ? 'success' : 'error', 2500);
        });
    }

    /**
     * Where the user left off (B6). RecentClips are ten minutes long and a phone call ends the
     * session; losing the place again on every reopen is the kind of thing that makes people
     * go back to the laptop.
     */
    readPositionMap() {
        try {
            const map = JSON.parse(localStorage.getItem(ANDROID_PLAYBACK_POS_KEY) || '{}');
            return map && typeof map === 'object' ? map : {};
        } catch (e) {
            return {};
        }
    }

    rememberPlaybackPosition() {
        if (!this.currentEvent || !isPhoneLayout()) return;
        const total = this.continuousPlayer.getTotalDuration();
        const at = this.continuousPlayer.getCurrentTime();
        if (!total || !isFinite(at)) return;
        const map = this.readPositionMap();
        const id = this.currentEvent.eventId;
        if (total - at < 5) delete map[id];
        else if (at > 5) map[id] = Math.round(at);
        else return;
        // Keep the map from growing without bound across months of clips.
        const keys = Object.keys(map);
        if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(k => delete map[k]);
        try {
            localStorage.setItem(ANDROID_PLAYBACK_POS_KEY, JSON.stringify(map));
        } catch (e) {
            // Full storage is not worth interrupting playback over.
        }
    }

    savedPositionFor(event) {
        const at = this.readPositionMap()[event.eventId];
        const total = event.totalDuration || 0;
        if (!at || !total || at >= total - 5) return 0;
        return at;
    }

    /**
     * Rolling clips are one after another; stopping at the end of each to tap the next card is
     * the single most tedious thing about watching them on a phone (B7).
     */
    onEventPlaybackFinished() {
        if (!isPhoneLayout() || !this.autoNextEnabled || !this.currentEvent) return;
        const translations = i18n[this.currentLanguage];
        const order = this.lastFilteredEvents && this.lastFilteredEvents.length ? this.lastFilteredEvents : this.eventGroups;
        const index = order.findIndex(e => e.eventId === this.currentEvent.eventId);
        const next = index >= 0 ? order[index + 1] : null;
        if (!next) {
            this.showToast(translations.autoNextDone, 'info', 2000);
            return;
        }
        this.showToast(`${translations.autoNextNext} ${next.startTime.replace('_', ' ').slice(5, 16)}`, 'info', 2200);
        this.playEvent(next.eventId);
    }

    setHeaderEventName(event) {
        const el = this.dom.headerEventName;
        if (!el) return;
        if (!event) {
            el.textContent = i18n[this.currentLanguage].headerTitle;
            return;
        }
        const type = this.videoListComponent?.getEventTypeLabel(event.eventType) || event.eventType;
        el.textContent = `${type} ${event.startTime.replace('_', ' ').slice(5, 16)}`;
    }

    /**
     * Mark the views a trigger was most likely looking at. Touch layouts only: desktop has lived
     * without this, and a border appearing there is a change rather than a fix.
     */
    applyTriggerHighlight(event) {
        const touch = isPhoneLayout() || isTabletLayout();
        const hit = touch && this.triggerHighlightEnabled() ? this.triggerViewsFor(event) : null;
        const views = new Set(hit?.views || []);
        document.querySelectorAll('#playerArea .video-container').forEach((cell) => {
            const on = views.has(cell.dataset.camera);
            cell.classList.toggle('trigger-cam', on);
            const label = cell.querySelector('.camera-label');
            if (!label) return;
            if (on) label.dataset.trigger = hit.label[this.currentLanguage] || hit.label.en;
            else delete label.dataset.trigger;
        });
    }

    /** Tesla writes the trigger as words, in one of two places depending on the firmware. */
    eventReason(event) {
        const written = typeof event?.reason === 'string' ? event.reason : '';
        const folder = String(event?.eventId || '').split('/').filter(Boolean).pop() || '';
        // The folder is `2026-09-29_12-30-00`, and the builds that put the reason in its name append
        // it after the seconds. Anchoring on the timestamp is what stops an unrelated folder word —
        // `SavedClips` itself contains "saved" — from reading as a trigger.
        const suffix = folder.match(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}[-_](.+)$/);
        const text = (written || (suffix ? suffix[1] : '')).toLowerCase().replace(/[-\s]+/g, '_');
        return /^[a-z][a-z0-9_]{1,31}$/.test(text) ? text : '';
    }

    /** `{ views, label }` for the reason, or null when it means nothing to this app. */
    triggerViewsFor(event) {
        const reason = this.eventReason(event);
        if (!reason) return null;
        for (const [pattern, views, label] of TRIGGER_REASON_VIEWS) {
            if (pattern.test(reason)) return { views: views.slice(0, TRIGGER_VIEWS_MAX), label };
        }
        return null;
    }

    /**
     * Long-press on an event card. Touch events only, so a desktop click never sees it, and the
     * click that Android still fires after the press is suppressed by the timestamp the menu
     * records — otherwise the card the user was holding down would also start playing.
     */
    attachCardLongPress(card, event) {
        let timer = null;
        let startX = 0;
        let startY = 0;

        const cancel = () => {
            if (timer) { clearTimeout(timer); timer = null; }
        };

        card.addEventListener('touchstart', (e) => {
            if (!isPhoneLayout()) return;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            cancel();
            timer = setTimeout(() => {
                timer = null;
                this.showCardContextMenu(event);
            }, 500);
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            if (!timer) return;
            const touch = e.touches[0];
            if (Math.abs(touch.clientX - startX) > 12 || Math.abs(touch.clientY - startY) > 12) cancel();
        }, { passive: true });

        card.addEventListener('touchend', cancel);
        card.addEventListener('touchcancel', cancel);
    }

    loadStarred() {
        try {
            const raw = JSON.parse(localStorage.getItem(ANDROID_STARRED_KEY) || '[]');
            return new Set(Array.isArray(raw) ? raw : []);
        } catch (e) {
            return new Set();
        }
    }

    isStarred(eventId) {
        return this.starredIds.has(eventId);
    }

    toggleStar(eventId) {
        const translations = i18n[this.currentLanguage];
        const nowStarred = !this.starredIds.has(eventId);
        if (nowStarred) this.starredIds.add(eventId); else this.starredIds.delete(eventId);
        try {
            localStorage.setItem(ANDROID_STARRED_KEY, JSON.stringify([...this.starredIds]));
        } catch (e) { /* private-mode storage; the marker still shows for this session */ }

        // Re-rendering the whole list to move one glyph is wasteful, and it scrolls the list
        // back to the top — which is exactly where the user was not looking.
        const card = [...(this.dom.fileList?.querySelectorAll('[data-event-id]') || [])]
            .find(node => node.dataset.eventId === eventId);
        const thumb = card?.querySelector('.video-thumbnail');
        if (card && thumb) {
            card.classList.toggle('starred', nowStarred);
            card.querySelector('.card-star')?.remove();
            if (nowStarred) {
                const star = document.createElement('span');
                star.className = 'card-star';
                star.setAttribute('aria-hidden', 'true');
                thumb.appendChild(star);
            }
        }
        // Unstarring inside "只看收藏" has to drop the card, and only a filter pass does that.
        if (this.starredOnly) this.filterAndRender();
        this.showToast(translations[nowStarred ? 'starredAdd' : 'starredRemove'], 'info', 1400);
    }

    toggleStarFilter() {
        this.starredOnly = !this.starredOnly;
        this.updateStarFilterLabel();
        this.filterAndRender();
        const translations = i18n[this.currentLanguage];
        if (this.starredOnly && this.lastFilteredEvents.length === 0) {
            this.showToast(translations.starFilterEmpty, 'info', 2800);
        } else {
            this.showToast(translations[this.starredOnly ? 'starFilterOn' : 'starFilterOff'], 'info', 1600);
        }
    }

    updateStarFilterLabel() {
        const btn = this.dom.starFilterBtn;
        if (!btn) return;
        btn.setAttribute('aria-pressed', String(this.starredOnly));
        const text = btn.querySelector('.btn-text');
        if (text) {
            text.textContent = i18n[this.currentLanguage][this.starredOnly ? 'starFilterOn' : 'starFilterOff'];
            btn.title = text.textContent;
            btn.setAttribute('aria-label', text.textContent);
        }
        btn.classList.toggle('is-on', this.starredOnly);
    }

    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'newest' ? 'oldest' : 'newest';
        try { localStorage.setItem(ANDROID_SORT_ORDER_KEY, this.sortOrder); } catch (e) { /* same as above */ }
        this.updateSortOrderLabel();
        this.filterAndRender();
    }

    updateSortOrderLabel() {
        const btn = this.dom.sortOrderBtn;
        if (!btn) return;
        const label = i18n[this.currentLanguage][this.sortOrder === 'oldest' ? 'sortOldest' : 'sortNewest'];
        const text = btn.querySelector('.btn-text');
        if (text) text.textContent = label;
        btn.title = label;
        btn.setAttribute('aria-label', label);
    }

    /**
     * Two ⋮ preferences that are opinions, not facts: the amber frame reads as a claim to some
     * people, and where a tapped card should start depends on whether they are hunting for one
     * moment or watching the whole clip. Both default to what the app has always done.
     */
    triggerHighlightEnabled() {
        return localStorage.getItem(ANDROID_TRIGGER_HIGHLIGHT_KEY) !== '0';
    }

    toggleTriggerHighlight() {
        const on = !this.triggerHighlightEnabled();
        try { localStorage.setItem(ANDROID_TRIGGER_HIGHLIGHT_KEY, on ? '1' : '0'); } catch (e) { /* private mode */ }
        this.updateTriggerHighlightLabel();
        // Turning it off has to take the existing frames down, not just stop the next one.
        this.applyTriggerHighlight(this.currentEvent);
        this.showToast(i18n[this.currentLanguage][on ? 'triggerHlOn' : 'triggerHlOff'], 'info', 1600);
    }

    updateTriggerHighlightLabel() {
        const btn = this.dom.triggerHlBtn;
        if (!btn) return;
        const on = this.triggerHighlightEnabled();
        const label = i18n[this.currentLanguage][on ? 'triggerHlOn' : 'triggerHlOff'];
        const text = btn.querySelector('.btn-text');
        if (text) text.textContent = label;
        btn.title = label;
        btn.setAttribute('aria-label', label);
        btn.classList.toggle('is-on', on);
    }

    tapBehavior() {
        const stored = localStorage.getItem(ANDROID_TAP_BEHAVIOR_KEY);
        return stored === 'start' || stored === 'event' ? stored : 'resume';
    }

    setTapBehavior(mode) {
        if (mode !== 'start' && mode !== 'event') mode = 'resume';
        try { localStorage.setItem(ANDROID_TAP_BEHAVIOR_KEY, mode); } catch (e) { /* private mode */ }
        this.updateTapBehaviorLabel();
        this.showToast(this.tapBehaviorLabel(mode), 'info', 1800);
        haptic(10);
    }

    // `tap${Cap(mode)}` would collide with the rate panel's own `tapEvent` (= 「轻点显示车速」), so the
    // three keys are named for what they switch.
    tapBehaviorLabel(mode) {
        return i18n[this.currentLanguage][{ resume: 'tapModeResume', start: 'tapModeStart', event: 'tapModeEvent' }[mode]];
    }

    /**
     * Both the row title and the selected segment are read out, because a segmented control whose
     * current choice is only painted in accent colour is invisible to a screen reader.
     */
    updateTapBehaviorLabel() {
        syncChoiceRow(this.dom.tapBehaviorChoice, this.tapBehavior(),
            { resume: 'tapOptResume', start: 'tapOptStart', event: 'tapOptEvent' }, 'choiceTap',
            i18n[this.currentLanguage]);
    }

    /**
     * Seconds from the start of the clip to the moment the car recorded the event, or null when the
     * folder does not say. `event.json` writes an absolute time and firmware is inconsistent about
     * units: a value below 1e11 is **seconds**, and handing that to `new Date()` puts the marker in
     * 1970 — which is why the timeline dot silently never appears on some builds.
     */
    eventOffsetSeconds(event) {
        if (!event?.eventTimestamp) return null;
        const numeric = Number(event.eventTimestamp);
        const at = Number.isFinite(numeric)
            ? (numeric < 1e11 ? numeric * 1000 : numeric)
            : new Date(event.eventTimestamp).getTime();
        if (!Number.isFinite(at)) return null;
        const parse = this.videoListComponent?.parseTimestamp?.bind(this.videoListComponent);
        const start = parse && event.startTime ? parse(event.startTime) : null;
        if (!start || Number.isNaN(start.getTime())) return null;
        const offset = (at - start.getTime()) / 1000;
        if (offset < 0) return null;
        // Past the end means the stamp belongs to a later segment set than this folder starts at;
        // the timeline dot still wants to be drawn there, so the caller clamps instead of losing it.
        return offset;
    }

    /**
     * Where the playhead lands right after a clip loads, for the three tap modes. Runs after
     * `loadEvent`, so `totalDuration` is already the real one. Desktop never calls this.
     */
    async applyTapEntryPoint(event) {
        if (!isPhoneLayout() && !isTabletLayout()) return;
        const translations = i18n[this.currentLanguage];
        const mode = this.tapBehavior();
        const total = this.continuousPlayer.getTotalDuration() || 0;
        let at = 0;
        if (mode === 'resume') at = this.savedPositionFor(event) || 0;
        else if (mode === 'event') {
            const offset = this.eventOffsetSeconds(event);
            if (offset === null) this.showToast(translations.tapEventNone, 'info', 2000);
            at = offset || 0;
        }
        if (total > 0) at = Math.min(at, Math.max(0, total - 0.5));
        if (at <= 0) return;
        await this.continuousPlayer.seekToTime(at);
        // The same sentence would have to mean two different things, so each mode gets its own verb.
        const said = mode === 'event' ? translations.jumpedTo : translations.resumedAt;
        this.showToast(`${said} ${this.videoControls.formatTime(at)}`, 'info', 2200);
    }

    showCardContextMenu(event) {
        const menu = this.dom.cardContextMenu;
        if (!menu || !event) return;
        this.contextCard = event;
        this.suppressCardClickUntil = Date.now() + 1000;
        const translations = i18n[this.currentLanguage];
        const type = this.videoListComponent?.getEventTypeLabel(event.eventType) || event.eventType;
        const place = event.street ? `${event.city} · ${event.street}` : (event.city || '');
        // The menu header is the card title again, so it is formatted the same way — and the raw
        // `2026-10-08_14-32-05` stays as the fallback for a startTime the parser cannot read.
        const when = this.videoListComponent?.parseTimestamp(event.startTime);
        const label = when && !isNaN(when.getTime())
            ? this.videoListComponent.formatCardTime(when)
            : event.startTime.replace('_', ' ');
        this.dom.cardContextTitle.textContent = `${type} ${label}${place ? ' · ' + place : ''}`;

        const first = (event.segments && event.segments[0]) || null;
        const file = first && (first.files[this.multiCameraPlayer.activeCamera] || first.files.front);
        menu.querySelector('[data-context="path"]').disabled = !(file && file.path);

        // No folder of its own, nothing safe to delete — the row disappears rather than offering
        // an action that would wipe the shared rolling buffer.
        const deleteRow = menu.querySelector('[data-context="delete"]');
        if (deleteRow) deleteRow.hidden = !this.eventDeleteTargets(event);

        // Same for the location row: an event with no GPS fix has nowhere to view.
        const placeRow = menu.querySelector('[data-context="place"]');
        if (placeRow) placeRow.hidden = !(event.lat && event.lon);

        // The menu has to say what it will do, not what it did last time.
        if (this.dom.contextStarLabel) {
            this.dom.contextStarLabel.textContent =
                i18n[this.currentLanguage][this.isStarred(event.eventId) ? 'contextUnstar' : 'contextStar'];
        }

        menu.classList.add('show');
        // After, not before: `getBBox()` reads zero inside a `display:none` subtree, and this menu is
        // `display:none` until the line above. The pass is idempotent, so only the first open measures.
        normaliseMenuIcons(menu);
        document.body.classList.add('context-open');
        this.syncBackLayers?.();
        haptic(10);
    }

    hideCardContextMenu() {
        this.contextCard = null;
        this.dom.cardContextMenu?.classList.remove('show');
        document.body.classList.remove('context-open');
        this.syncBackLayers?.();
    }

    async runCardContextAction(action) {
        const event = this.contextCard;
        this.hideCardContextMenu();
        if (!event) return;

        // 显示路径, 收藏, 查看位置 and 删除 work straight off the scan result; the rest need the
        // event loaded, and loading is what takes 10+ seconds, so the menu always closes first and
        // the work starts after it.
        if (action !== 'path' && action !== 'star' && action !== 'delete' && action !== 'place'
            && this.currentEvent?.eventId !== event.eventId) {
            await this.playEvent(event.eventId);
        }

        if (action === 'play') return;

        if (action === 'delete') {
            this.openDeleteConfirm(event);
            return;
        }

        if (action === 'single') {
            this.zoomCamera(this.multiCameraPlayer.activeCamera);
            this.videoControls.resetHideTimer();
            return;
        }

        if (action === 'path') {
            const file = event.segments[0].files[this.multiCameraPlayer.activeCamera] || event.segments[0].files.front;
            if (file?.path) this.showFilePathModal(file.path);
            else this.showToast(i18n[this.currentLanguage].noFilePath || 'No path', 'error');
            return;
        }

        if (action === 'meta') {
            this.metadataManager?.setCollapsed(false);
        }

        if (action === 'place') {
            this.showMapModal(event.lat, event.lon, event);
            return;
        }

        if (action === 'star') {
            this.toggleStar(event.eventId);
        }
    }

    /**
     * The files one event owns outright: every clip its card plays, plus the sidecars that sit in
     * the same folder and never appear on the card (`event.json`, `thumb.png`, the views this
     * build cannot decode). Deleting only the listed clips would leave the folder — and on the
     * car's own playback screen that folder still reads as "the clip is here".
     *
     * Returns null when the event has no folder of its own. The rolling buffer keeps every minute
     * in one shared directory, so there the set of "files in this folder" is the whole card of
     * events, and a delete that wiped the stick is not a delete of one event.
     */
    eventDeleteTargets(event) {
        const own = new Set();
        (event.segments || []).forEach(segment => Object.values(segment.files || {}).forEach(file => {
            if (file?.path) own.add(file.path);
        }));
        if (event.thumbFile?.path) own.add(event.thumbFile.path);
        if (!own.size) return null;

        const dirs = new Set([...own].map(path => path.slice(0, path.lastIndexOf('/'))));
        if ([...dirs].some(dir => !EVENT_DIR_NAME.test(dir.split('/').pop() || ''))) return null;

        const targets = new Set(own);
        this.allFiles.forEach(file => {
            if (!file.path) return;
            if (dirs.has(file.path.slice(0, file.path.lastIndexOf('/')))) targets.add(file.path);
        });
        return [...targets];
    }

    openDeleteConfirm(event) {
        const translations = i18n[this.currentLanguage];
        const dom = this.deleteDom || (this.deleteDom = {
            modal: document.getElementById('deleteConfirmModal'),
            title: document.getElementById('deleteConfirmTitle'),
            summary: document.getElementById('deleteConfirmSummary'),
            list: document.getElementById('deleteConfirmList'),
            warn: document.getElementById('deleteConfirmWarn'),
            cancel: document.getElementById('deleteCancelBtn'),
            ok: document.getElementById('deleteConfirmBtn'),
        });
        if (!dom.modal) return;

        const targets = this.eventDeleteTargets(event);
        if (!targets) {
            this.showToast(translations.deleteSharedDir, 'error', 4000);
            return;
        }
        this.pendingDelete = { event, targets };

        const folder = targets[0].slice(0, targets[0].lastIndexOf('/')).split('/').pop();
        dom.title.textContent = translations.deleteConfirmTitle;
        dom.summary.textContent = translations.deleteConfirmCount
            .replace('{n}', targets.length).replace('{dir}', folder);
        dom.warn.textContent = translations.deleteConfirmWarn;
        dom.cancel.textContent = translations.deleteConfirmCancel;
        dom.ok.textContent = translations.deleteConfirmOk;

        // Just the view name. `2026-10-03_19-47-00-front.mp4` repeats the folder the summary line
        // already states, and on a phone dialog every row truncated to the same unreadable prefix.
        dom.list.textContent = '';
        const shown = targets.slice(0, 12);
        const prefix = `${folder}-`;
        shown.forEach(path => {
            const name = path.slice(path.lastIndexOf('/') + 1);
            const li = document.createElement('li');
            li.textContent = name.startsWith(prefix) ? name.slice(prefix.length) : name;
            dom.list.appendChild(li);
        });
        if (targets.length > shown.length) {
            const li = document.createElement('li');
            li.textContent = translations.deleteConfirmMore.replace('{n}', targets.length - shown.length);
            dom.list.appendChild(li);
        }

        dom.modal.style.display = 'flex';
        dom.modal.classList.add('show');
        this.syncBackLayers?.();
    }

    closeDeleteConfirm() {
        const dom = this.deleteDom;
        if (!dom || !dom.modal.classList.contains('show')) return;
        this.pendingDelete = null;
        dom.modal.classList.remove('show');
        setTimeout(() => {
            if (!this.pendingDelete) dom.modal.style.display = 'none';
        }, 300);
        this.syncBackLayers?.();
    }

    async confirmDeleteEvent() {
        const job = this.pendingDelete;
        this.closeDeleteConfirm();
        if (!job) return;
        const translations = i18n[this.currentLanguage];
        const native = window.TDashcamNative;
        if (!native || typeof native.deletePaths !== 'function') {
            this.showToast(translations.deleteNoBridge, 'error', 4000);
            return;
        }

        // An open file is a file that cannot be deleted, and on the event that is playing the
        // decoder is holding every one of its clips.
        if (this.currentEvent?.eventId === job.event.eventId) {
            this.multiCameraPlayer.cleanup();
            this.currentEvent = null;
            this.setHeaderEventName(null);
        }

        // Deletion answers from a worker thread a few seconds later, so hold the row out of the
        // list until it does — otherwise a failure leaves a card on screen for files that are gone.
        let result;
        try {
            result = await nativeDeletePaths(job.targets, translations);
        } catch (e) {
            result = { ok: false, error: String((e && e.message) || e) };
        }
        if (!result.ok) {
            haptic([40, 50, 40]);
            this.showToast(`${translations.deleteFailed}${result.error || ''}`, 'error', 6000);
            return;
        }

        const gone = new Set(job.targets);
        this.allFiles = this.allFiles.filter(file => !gone.has(file.path));
        this.eventGroups = this.eventGroups.filter(each => each.eventId !== job.event.eventId);
        this.filterAndRender();
        const freed = formatBytes(result.freed);
        // The card disappearing is the only confirmation a pocketed phone can notice.
        haptic([16, 60, 16]);
        this.showToast(`${translations.deleteDone.replace('{n}', result.deleted ?? job.targets.length)}${freed ? ` · ${freed}` : ''}`,
            'success', 2600);
    }

    // Three states, cycling: follow the system, then force light, then force dark.
    // 'auto' is the default because a phone's night mode flips on its own schedule, and a
    // stored manual choice would leave the app stuck on the wrong theme after sunset.
    //
    // A fresh key on purpose. The two-state toggle that used to write `theme` stored 'light'
    // or 'dark' for anyone who ever tapped it, so reusing it would hand the upgrade a pin the
    // user never chose deliberately — which is exactly how the app stopped following the system.
    themeMode() {
        const mode = localStorage.getItem('tdashcam.themeMode');
        return mode === 'light' || mode === 'dark' ? mode : 'auto';
    }

    resolveThemeDark(mode) {
        if (!mode) mode = this.themeMode();
        if (mode === 'light') return false;
        if (mode === 'dark') return true;
        // The manifest pins `uiMode` in `configChanges`, so the activity survives a night-mode
        // flip and the WebView's own media query can be left holding the old answer. The native
        // side reads the real configuration, so where it has reported, it wins.
        const status = readNativeStorageStatus();
        if (status && typeof status.night === 'boolean') return status.night;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    toggleTheme() {
        const order = ['auto', 'light', 'dark'];
        const next = order[(order.indexOf(this.themeMode()) + 1) % order.length];
        localStorage.setItem('tdashcam.themeMode', next);
        this.applyTheme(this.resolveThemeDark(next));
    }

    /** The phone row picks a state by name; the desktop button still cycles. */
    setThemeChoice(mode) {
        const next = mode === 'light' || mode === 'dark' ? mode : 'auto';
        localStorage.setItem('tdashcam.themeMode', next);
        this.applyTheme(this.resolveThemeDark(next));
        haptic(10);
    }

    updateThemeChoice() {
        syncChoiceRow(this.dom.themeChoice, this.themeMode(),
            { auto: 'themeOptAuto', light: 'themeOptLight', dark: 'themeOptDark' }, 'choiceTheme',
            i18n[this.currentLanguage]);
    }

    loadTheme() {
        // MainActivity re-pushes its state on every configuration change and on regaining
        // focus, which is the only notice available that the system night mode moved.
        window.__tdashcamNativeState = () => {
            this.applyTheme(this.resolveThemeDark());
            this.updateAppVersion();
            // The same push rewrites `--safe-*`, which changes the height of the bar those
            // insets pad — re-measure so the content reserve matches what is now on screen.
            this.publishControlReserve?.();
        };
        this.applyTheme(this.resolveThemeDark());
        this.updateAppVersion();
    }

    /**
     * There is no build manifest inside the WebView, so the installed version comes from the
     * activity. Hidden until it actually arrives: an empty row in the drawer is worse than none,
     * and on desktop the push never happens at all.
     */
    updateAppVersion() {
        const el = this.dom.appVersion;
        if (!el) return;
        const status = readNativeStorageStatus();
        const version = status && status.version;
        if (!version) {
            el.style.display = 'none';
            return;
        }
        el.style.display = '';
        el.textContent = `v${version}`;
    }

    applyTheme(isDark) {
        document.body.classList.toggle('dark-theme', isDark);
        // The root element's scheme is what the WebView uses for the viewport background,
        // overscroll glow and native widgets; `body.dark-theme` alone never reaches it.
        document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
        // The in-app theme can disagree with the system night mode, and `enableEdgeToEdge()`
        // only ever looks at the system one, so the bar icon tint is pushed down explicitly.
        if (window.TDashcamNative) {
            try {
                window.TDashcamNative.setLightSystemBars(!isDark);
            } catch (e) {
                /* desktop */
            }
        }
        this.updateThemeIcon(isDark);
    }

    // ---- System back gesture ------------------------------------------------------------

    openModalOverlays() {
        return Array.from(document.querySelectorAll('.modal-overlay.show'));
    }

    // Counted from the live DOM instead of a stack maintained at each open/close call site:
    // modals are opened from several places and one missed hook would make the activity
    // swallow every back press.
    phoneLayerCount() {
        if (!isPhoneLayout()) return 0;
        let count = this.openModalOverlays().length;
        if (this.contextCard) count++;
        if (this.dom.headerRight && this.dom.headerRight.classList.contains('active')) count++;
        if (this.dom.sidebar && !this.dom.sidebar.classList.contains('collapsed')) count++;
        // Fullscreen is chrome the user did not ask the page to put there, so it is a layer too —
        // counted last, because back should close whatever is on top before it gives the bars back.
        if (document.body.classList.contains('phone-fullscreen')) count++;
        return count;
    }

    // Returns whether the page consumed the gesture; the activity falls back to the default
    // behaviour when it does not.
    closeTopLayer() {
        if (this.contextCard) {
            this.hideCardContextMenu();
            return true;
        }
        const modals = this.openModalOverlays();
        if (modals.length) {
            const closer = modals[modals.length - 1].querySelector('.close-modal-btn');
            if (closer) {
                closer.click();
            } else {
                modals[modals.length - 1].classList.remove('show');
                modals[modals.length - 1].style.display = 'none';
            }
            return true;
        }
        if (this.dom.headerRight && this.dom.headerRight.classList.contains('active')) {
            this.dom.headerRight.classList.remove('active');
            return true;
        }
        if (isPhoneLayout()
            && this.dom.sidebar && !this.dom.sidebar.classList.contains('collapsed')) {
            this.toggleSidebar(false);
            return true;
        }
        if (document.body.classList.contains('phone-fullscreen')) {
            this.setPhoneFullscreen(false);
            return true;
        }
        return false;
    }

    /**
     * The grid reserves room for the control overlay by padding its container, but that overlay
     * grows with the system navigation inset, the speed graph and the view, so a fixed reserve
     * either hides the bottom row of feeds or wastes picture height. Publish the measured height
     * and let the phone rules reserve exactly that.
     */
    startControlsReserve() {
        const overlay = document.querySelector('.video-controls-overlay');
        const bar = document.getElementById('phoneActionBar');
        if (!overlay || typeof ResizeObserver === 'undefined') return;
        const publish = () => {
            const h = Math.round(overlay.getBoundingClientRect().height);
            // A hidden overlay reports 0; keeping the last real value avoids a jump when an
            // event finishes loading.
            if (h > 0) {
                // The driving-data card floats over the letterbox in both orientations, so it
                // reserves nothing: a 16:9 picture never reaches the bottom of the area it is
                // given on a phone, and taking height away from the feeds only made them smaller.
                document.documentElement.style.setProperty('--controls-h', `${h}px`);
                document.documentElement.style.setProperty('--meta-bottom', `${h + 6}px`);
            }
            // The bar floats: what the content has to clear is its top edge, not its height.
            if (bar) {
                const rect = bar.getBoundingClientRect();
                // Desktop never renders the bar, and a surface hidden with `display:none` reports
                // 0x0@0 — where `innerHeight - rect.bottom` alone equals the whole viewport. That
                // poisoned `--action-h` with 915px once, which then zeroed every surface sized by
                // it: the ⋮ panel lost all its height and the 详细数据 plate was cut to a sliver.
                const occupied = rect.height > 0
                    ? Math.round(rect.height + Math.max(0, innerHeight - rect.bottom))
                    : 0;
                document.documentElement.style.setProperty('--action-h', `${occupied}px`);
            }
        };
        this.controlsObserver = new ResizeObserver(publish);
        this.controlsObserver.observe(overlay);
        if (bar) this.controlsObserver.observe(bar);
        // The bar's own height moves when `--safe-bottom` does, and a `env()` inset that only
        // arrives after the WebView is attached moves the bar without resizing it — which a
        // ResizeObserver cannot see. Rotation is covered by the listener below; anything else
        // that shifts the bar leaves the reserve stale by the height of the gap it moved.
        this.publishControlReserve = publish;
        window.addEventListener('resize', publish);
        publish();
    }

    startLayerTracking() {
        let queued = false;
        const sync = () => {
            if (!window.TDashcamNative) return;
            const count = this.phoneLayerCount();
            if (count === this.reportedLayerCount) return;
            this.reportedLayerCount = count;
            try {
                window.TDashcamNative.setBackLayers(count);
            } catch (e) {
                /* desktop */
            }
        };
        this.syncBackLayers = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                sync();
            });
        };

        const targets = [
            document.body,
            this.dom.sidebar,
            this.dom.headerRight,
            ...document.querySelectorAll('.modal-overlay'),
        ];
        this.layerObserver = new MutationObserver(this.syncBackLayers);
        targets.forEach(node => {
            if (node) this.layerObserver.observe(node, { attributes: true, attributeFilter: ['class', 'style'] });
        });
        window.addEventListener('resize', this.syncBackLayers);
        this.syncBackLayers();
    }

    /**
     * One icon language. The bottom bar and the long-press menu are line SVGs while the ⋮ panel
     * still used emoji, so the same action looked different depending on where it was reached
     * from. Phone only: desktop keeps the emoji rows exactly as they shipped.
     */
    phoneifyIcons() {
        if (!isPhoneLayout()) return;
        this.phoneIconMode = true;
        const paths = {
            metaSwitchBtn: 'M4 10.5l1.7-4.5h12.6l1.7 4.5M3.5 10.5h17v6h-17zM6.5 16.5v2.5M17.5 16.5v2.5',
            metaDetailBtn: 'M4 19h16M7 16v-5M12 16V7M17 16v-8',
            exportMetadataBtn: 'M12 4v10M8 11l4 4 4-4M5 19h14',
            revealFileBtn: 'M3 7h6l2 2h10v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z',
            downloadFileBtn: 'M12 4v9M12 13l-3.5-3.5M12 13l3.5-3.5M5 19h14',
            snapshotBtn: 'M4 8.5h3L8.6 6.5h6.8L17 8.5h3V19H4zM12 15.5a3 3 0 100-6 3 3 0 000 6z',
            autoNextBtn: 'M6 5.5l9 6.5-9 6.5zM18 5.5v13',
            diagnosticsBtn: 'M6.5 4h8l3.5 3.5V20h-11.5zM9.5 10.5h5.5M9.5 14h5.5',
            aboutBtn: 'M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 10.5v6M12 7.6v.9',
        };
        Object.entries(paths).forEach(([id, d]) => {
            const icon = document.querySelector(`#${id} .btn-icon`);
            if (!icon || icon.dataset.phonified) return;
            icon.dataset.phonified = '1';
            icon.innerHTML = `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
        });
        this.updateThemeIcon(document.body.classList.contains('dark-theme'));
        normaliseMenuIcons();
    }

    updateThemeIcon(isDark) {
        if (!this.dom.themeToggleBtn) return;
        const mode = this.themeMode();
        const glyph = mode === 'auto' ? '🌗' : (isDark ? '🌙' : '☀️');
        const iconEl = this.dom.themeToggleBtn.querySelector('.btn-icon');
        if (iconEl && this.phoneIconMode) {
            // Three states need three distinct silhouettes, and the emoji read as one blurry
            // yellow blob at this size.
            const shapes = {
                auto: 'M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 3.5v17',
                dark: 'M19 14.5A8 8 0 019.5 5a8 8 0 109.5 9.5z',
                light: 'M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2L17 7M7 17l-1.8 1.8',
            };
            iconEl.innerHTML = `<svg viewBox="0 0 24 24"><path d="${shapes[mode] || shapes.auto}"/></svg>`;
            normaliseMenuIcon(iconEl.querySelector('svg'));
        } else {
            (iconEl || this.dom.themeToggleBtn).textContent = glyph;
        }
        const translations = i18n[this.currentLanguage];
        const label = translations['theme' + mode[0].toUpperCase() + mode.slice(1)];
        this.dom.themeToggleBtn.title = `${label} · ${translations.toggleTheme}`;
        this.updateThemeChoice();
    }

    showInitialHelpMessage() {
        const lang = this.currentLanguage;
        const translations = i18n[lang];
        const useFileInput = !supportsDirectoryPicker();
        let step1, step2;
        if (isAndroidRuntime()) {
            step1 = translations.helpStep1Android;
            step2 = translations.helpStep2Android;
        } else if (useFileInput) {
            step1 = translations.helpStep1IOS;
            step2 = translations.helpStep2IOS;
        } else {
            step1 = translations.helpStep1;
            step2 = translations.helpStep2;
        }
        
        // Show desktop tip only in web environment (not in Tauri)
        const desktopTipHtml = !this.isTauri ? `
            <p class="desktop-tip">
                ${translations.desktopTip}
                <a href="https://github.com/DeaglePC/TeslaCamPlayer/releases" target="_blank" class="desktop-link">${translations.desktopDownload}</a>
            </p>
        ` : '';
        
        const helpHtml = `
            <div class="empty-state help-text">
                <ol>
                    <li>${step1}</li>
                    <li>${step2}</li>
                </ol>
                <p class="note">${translations.helpNote}</p>
                ${desktopTipHtml}
            </div>
        `;
        this.videoListComponent.container.innerHTML = helpHtml;
    }

    toggleLanguage() {
        const newLang = this.currentLanguage === 'zh' ? 'en' : 'zh';
        this.setLanguage(newLang);
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        // Guard clause for flatpickr instance and its methods
        if (this.flatpickrInstance && typeof this.flatpickrInstance.set === 'function') {
            const isChinese = lang === 'zh';
            this.flatpickrInstance.set('locale', isChinese ? 'zh' : 'default');
            this.flatpickrInstance.redraw();
        }
        // Guard clause for dateFilter element
        if (this.dom.dateFilter) {
            this.dom.dateFilter.placeholder = i18n[lang].selectDate;
        }
        if (this.dom.eventSearch) {
            this.dom.eventSearch.placeholder = i18n[lang].searchEvents;
        }
        if (this.dom.dateChips) {
            // Force the chip row to rebuild so its "all dates" label follows the language.
            this.dom.dateChips.dataset.signature = '';
            this.renderDateChips();
        }
        this.updatePermissionBanner();
        this.refreshFeedButtonTitles();
        this.updateAllUIText(lang);
    }

    loadLanguage() {
        const savedLang = localStorage.getItem('language');
        let lang = navigator.language.startsWith('zh') ? 'zh' : 'en';
        if (savedLang) {
            lang = savedLang;
        }
        this.setLanguage(lang);
    }

    /**
     * 获取 Tauri 配置文件路径
     */
    async getTauriConfigPath() {
        const tauri = getTauri();
        if (!tauri || !tauri.path) return null;
        
        try {
            // 使用应用数据目录存储配置
            const appDataDir = await tauri.path.appDataDir();
            return `${appDataDir}config.json`;
        } catch (e) {
            console.warn('[getTauriConfigPath] Failed to get app data dir:', e);
            return null;
        }
    }

    /**
     * 保存 Tauri 配置到本地文件
     */
    async saveTauriConfig(config) {
        const tauri = getTauri();
        if (!tauri || !tauri.fs) return;
        
        try {
            const configPath = await this.getTauriConfigPath();
            if (!configPath) return;
            
            // 确保目录存在
            const appDataDir = await tauri.path.appDataDir();
            try {
                await tauri.fs.mkdir(appDataDir, { recursive: true });
            } catch (e) {
                // 目录可能已存在
            }
            
            await tauri.fs.writeTextFile(configPath, JSON.stringify(config, null, 2));
            console.log('[saveTauriConfig] Config saved to:', configPath);
        } catch (e) {
            console.warn('[saveTauriConfig] Failed to save config:', e);
        }
    }

    /**
     * 读取 Tauri 配置文件
     */
    async loadTauriConfig() {
        const tauri = getTauri();
        if (!tauri || !tauri.fs) return null;
        
        try {
            const configPath = await this.getTauriConfigPath();
            if (!configPath) return null;
            
            const content = await tauri.fs.readTextFile(configPath);
            return JSON.parse(content);
        } catch (e) {
            // 文件不存在或解析失败
            console.log('[loadTauriConfig] No config file found or parse error:', e.message);
            return null;
        }
    }

    /**
     * 加载上次选择的 TeslaCam 目录
     */
    async loadLastTeslaCamPath() {
        // Tauri 环境：使用本地配置文件存储路径
        if (this.isTauri) {
            // 等待一小段时间确保 Tauri API 完全初始化
            await new Promise(resolve => setTimeout(resolve, 100));

            if (isAndroidRuntime()) {
                const saved = localStorage.getItem(ANDROID_MEDIA_DIR_KEY);
                if (!saved) {
                    console.log('[loadLastTeslaCamPath] No saved media dir on Android');
                    return;
                }
                console.log('[loadLastTeslaCamPath] Restoring Android media dir:', saved);
                // Desktop gets `fs.stat` before it restores; the phone used to restore blind, so a
                // boot after an overnight eject opened straight onto a folder that was gone.
                if (await this.scannedPathGone(saved)) {
                    console.log('[loadLastTeslaCamPath] Saved dir is gone, dropping it:', saved);
                    await this.forgetRemovedVolumes([saved]);
                    return;
                }
                await this.loadTauriDirectory(saved);
                return;
            }

            const tauri = getTauri();
            if (!tauri || !tauri.fs) {
                console.warn('[loadLastTeslaCamPath] Tauri fs API not available');
                return;
            }
            
            // 从配置文件读取上次的路径
            const config = await this.loadTauriConfig();
            const lastPath = config?.lastTeslaCamPath;
            
            if (!lastPath) {
                console.log('[loadLastTeslaCamPath] No saved path found in config');
                return;
            }
            
            console.log('[loadLastTeslaCamPath] Found saved path:', lastPath);
            
            try {
                // 检查目录是否仍然存在
                const metadata = await tauri.fs.stat(lastPath);
                if (!metadata.isDirectory) {
                    console.log('[loadLastTeslaCamPath] Path is not a directory');
                    return;
                }
                
                // 自动加载该目录
                console.log('[loadLastTeslaCamPath] Auto-loading directory...');
                await this.loadTauriDirectory(lastPath);
            } catch (e) {
                console.warn('[loadLastTeslaCamPath] Failed to load saved path:', e);
            }
            return;
        }
        
        // Web 环境：使用 File System Access API 和 IndexedDB 存储目录句柄
        if (supportsFileSystemAccess()) {
            try {
                const handle = await getDirectoryHandle();
                if (!handle) {
                    console.log('[loadLastTeslaCamPath] No saved directory handle found');
                    return;
                }
                
                console.log('[loadLastTeslaCamPath] Found saved directory handle:', handle.name);
                
                // 请求权限（用户可能需要重新授权）
                const permission = await handle.requestPermission({ mode: 'read' });
                if (permission !== 'granted') {
                    console.log('[loadLastTeslaCamPath] Permission denied, clearing saved handle');
                    await clearDirectoryHandle();
                    return;
                }
                
                // 加载目录
                console.log('[loadLastTeslaCamPath] Auto-loading directory from handle...');
                await this.loadDirectoryFromHandle(handle);
            } catch (e) {
                console.warn('[loadLastTeslaCamPath] Failed to load saved directory handle:', e);
                await clearDirectoryHandle();
            }
        } else {
            console.log('[loadLastTeslaCamPath] File System Access API not supported');
        }
    }

    /**
     * 使用 File System Access API 选择目录（Web 版本）
     */
    async selectDirectoryWithFSA() {
        try {
            const handle = await window.showDirectoryPicker({
                id: 'teslacam-directory',
                mode: 'read',
                startIn: 'documents'
            });
            
            console.log('[selectDirectoryWithFSA] Selected directory:', handle.name);
            
            // 保存目录句柄到 IndexedDB
            await saveDirectoryHandle(handle);
            
            // 加载目录
            await this.loadDirectoryFromHandle(handle);
        } catch (e) {
            if (e.name === 'AbortError') {
                console.log('[selectDirectoryWithFSA] User cancelled');
                return;
            }
            console.error('[selectDirectoryWithFSA] Error:', e);
            this.showToast('选择目录失败: ' + e.message, 'error');
        }
    }

    /**
     * 从目录句柄加载文件（Web 版本）
     */
    async loadDirectoryFromHandle(handle) {
        // 显示加载状态
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'fsa-loading';
        loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px 40px;border-radius:8px;z-index:9999;';
        loadingDiv.textContent = this.currentLanguage === 'zh' ? '正在加载目录...' : 'Loading directory...';
        document.body.appendChild(loadingDiv);
        
        try {
            const files = [];
            await this.collectFilesFromHandle(handle, handle.name, files);
            
            console.log('[loadDirectoryFromHandle] Collected files:', files.length);
            
            if (files.length === 0) {
                this.showToast(i18n[this.currentLanguage].invalidFolder, 'error');
                await clearDirectoryHandle();
                return;
            }
            
            // 检查是否有 TeslaCam 子文件夹
            const hasTeslaCamSubfolders = files.some(file => 
                file.webkitRelativePath.includes('RecentClips/') ||
                file.webkitRelativePath.includes('SavedClips/') ||
                file.webkitRelativePath.includes('SentryClips/')
            );
            
            if (!hasTeslaCamSubfolders) {
                this.showToast(i18n[this.currentLanguage].invalidFolder, 'error');
                await clearDirectoryHandle();
                return;
            }
            
            // 清理旧数据
            this.cleanupOldData();
            
            this.allFiles = files;
            this.eventGroups = await this.processFiles(this.allFiles);
            console.log('[loadDirectoryFromHandle] eventGroups:', this.eventGroups.length);
            this.filterAndRender();
            
        } finally {
            loadingDiv.remove();
        }
    }

    /**
     * 递归收集目录中的所有文件
     */
    async collectFilesFromHandle(dirHandle, basePath, files) {
        for await (const entry of dirHandle.values()) {
            const entryPath = `${basePath}/${entry.name}`;
            
            if (entry.kind === 'file') {
                // 收集视频文件、缩略图和事件JSON
                if (entry.name.endsWith('.mp4') || entry.name.endsWith('.png') || entry.name.endsWith('.jpg') || entry.name === 'event.json') {
                    try {
                        const file = await entry.getFile();
                        // 添加 webkitRelativePath 属性
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: entryPath,
                            writable: false
                        });
                        files.push(file);
                    } catch (e) {
                        console.warn('[collectFilesFromHandle] Failed to get file:', entryPath, e);
                    }
                }
            } else if (entry.kind === 'directory') {
                // 递归处理子目录
                await this.collectFilesFromHandle(entry, entryPath, files);
            }
        }
    }

    /**
     * 使用 Tauri dialog 选择目录
     */
    async selectTauriDirectory() {
        const tauri = getTauri();
        if (!tauri) return;

        // Android 上 dialog 插件不可用（且不支持目录选择器），使用内置目录浏览器
        if (isAndroidRuntime()) {
            await this.openAndroidFolderBrowser();
            return;
        }

        try {
            // 获取上次选择的路径作为默认目录
            const config = await this.loadTauriConfig();
            const lastPath = config?.lastTeslaCamPath;
            
            // 使用 Tauri dialog API 选择目录
            let dialog = tauri.dialog;
            if (!dialog && tauri.api) {
                dialog = tauri.api.dialog;
            }
            
            if (!dialog || !dialog.open) {
                console.warn('[selectTauriDirectory] Dialog API not available');
                this.dom.folderInput.click();
                return;
            }
            
            const selected = await dialog.open({
                directory: true,
                multiple: false,
                title: 'Select TeslaCam Directory',
                defaultPath: lastPath || undefined
            });
            
            if (!selected) {
                console.log('[selectTauriDirectory] User cancelled');
                return;
            }
            
            const path = typeof selected === 'string' ? selected : selected[0];
            console.log('[selectTauriDirectory] Selected path:', path);
            
            await this.loadTauriDirectory(path);
        } catch (e) {
            console.error('[selectTauriDirectory] Error:', e);
            this.showToast('选择目录失败: ' + e.message, 'error');
        }
    }

    /**
     * Android 专用：内置目录浏览器（dialog 插件在安卓不可用，且不支持目录选择）
     */
    async openAndroidFolderBrowser() {
        const modal = document.getElementById('androidDirModal');
        if (!modal) return;

        await ensureMediaServer();

        if (!this.androidDirBound) {
            this.androidDirBound = true;
            document.getElementById('androidDirCloseBtn')
                .addEventListener('click', () => this.closeAndroidFolderBrowser());
            document.getElementById('androidDirUpBtn')
                .addEventListener('click', () => this.androidBrowseTo(parentPath(this.androidBrowsePath)));
            document.getElementById('androidDirGoBtn')
                .addEventListener('click', () => this.androidBrowseTo(document.getElementById('androidDirPathInput').value.trim()));
            document.getElementById('androidDirAppBtn')
                .addEventListener('click', async () => {
                    const status = await getStorageStatus();
                    if (status?.app_files_dir) await this.androidBrowseTo(status.app_files_dir);
                });
            // One delegated listener for a row whose chips are rebuilt on every open: a stick can
            // be plugged in between two visits, so there is no fixed set of buttons to bind.
            document.getElementById('androidDirVolumeChips')
                .addEventListener('click', async (e) => {
                    const chip = e.target.closest ? e.target.closest('.dir-volume-chip') : null;
                    if (!chip || chip.disabled) return;
                    await this.androidBrowseTo(chip.dataset.path);
                });
            document.getElementById('androidDirSelectBtn')
                .addEventListener('click', async () => {
                    const path = this.androidBrowsePath;
                    if (isStorageRootPath(path)) {
                        this.showToast(i18n[this.currentLanguage].dirBrowserPickDeeper, 'error', 5000);
                        return;
                    }
                    this.closeAndroidFolderBrowser();
                    await this.loadTauriDirectory(path);
                });
        }

        const translations = i18n[this.currentLanguage];
        document.getElementById('androidDirModalTitle').textContent = translations.dirBrowserTitle;
        document.getElementById('androidDirSelectBtn').textContent = translations.dirBrowserSelect;
        document.getElementById('androidDirUpBtn').textContent = translations.dirBrowserUp;
        document.getElementById('androidDirGoBtn').textContent = translations.dirBrowserGo;
        document.getElementById('androidDirPathLabel').textContent = translations.dirBrowserPath;
        document.getElementById('androidDirAppBtn').textContent = translations.dirBrowserAppBtn;
        document.getElementById('androidDirVolumesLabel').textContent = translations.dirVolumeRow;

        const config = await this.loadTauriConfig();
        const status = await getStorageStatus(true);
        this.androidBrowsePath = (config && config.lastTeslaCamPath) || '/storage/emulated/0';

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);

        // Warn up front instead of letting the first tap look like an empty folder.
        const nativeStatus = await getNativeStorageStatus(600);
        if (nativeStatus ? nativeStatus.manage_external_storage === false : storageBlockedByPermission(status)) {
            this.showToast(`${translations.noFilesPerm} — ${translations.permMissing}`, 'error', 10000);
        }
        await this.renderStorageChips();
        // Where the remembered folder went with the drive, open on the mount it came from while
        // that is still readable, and on the phone's own storage once it is not.
        if (isAndroidRuntime() && await this.scannedPathGone(this.androidBrowsePath)) {
            const up = parentPath(this.androidBrowsePath);
            const mountAlive = up && up !== '/' && up !== this.androidBrowsePath && !await this.scannedPathGone(up);
            this.androidBrowsePath = mountAlive ? up : '/storage/emulated/0';
        }
        await this.androidBrowseTo(this.androidBrowsePath);
        this.pruneDeadRecentDirs();
    }

    closeAndroidFolderBrowser() {
        const modal = document.getElementById('androidDirModal');
        if (!modal) return;
        // The 「不再显示」 button is the only other way out of a forced guide, and a row in 关于
        // should not hold the browser hostage every time it is opened afterwards.
        this.usbGuideForced = false;
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }

    volumeChipLabel(volume, translations) {
        const byKind = {
            internal: translations.volInternal,
            usb: translations.volUsb,
            sd: translations.volSd,
            external: translations.volExternal,
        };
        const fallback = byKind[volume.kind] || volume.label || volume.path;
        // The framework's own description ("USB 存储设备", "SD 卡") is more useful than a mount
        // point nobody can type, but only when it is actually a sentence and not just the name.
        const human = volume.label && volume.label !== volume.path.split('/').pop()
            ? volume.label : '';
        return human || fallback;
    }

    /**
     * The one line under a chip's name that tells the two drives apart: a 32 GB stick and a 2 TB
     * drive both mount at `/storage/XXXX-XXXX`, and which one you plugged in is the first thing
     * anyone wants to know before the second one is "why is it this slow".
     */
    volumeChipMeta(volume) {
        const parts = [];
        const fs = volumeFsLabel(volume.fs);
        if (fs) parts.push(fs);
        const total = formatBytes(volume.total);
        if (total) parts.push(total);
        return parts.join(' · ');
    }

    /**
     * The long form, for the tap-and-hold and the toasts: mount point, filesystem, capacity and
     * whether the phone mounted it read-only, which is the answer to 「为什么删不掉」.
     */
    volumeChipHint(volume, translations) {
        const parts = [volume.path];
        const fs = volumeFsLabel(volume.fs);
        if (fs) parts.push(fs);
        const total = formatBytes(volume.total);
        const free = formatBytes(volume.free);
        if (total) parts.push(free ? `${total} · ${translations.volFree} ${free}` : total);
        if (volume.readOnly) parts.push(translations.volReadOnly);
        return parts.join(' · ');
    }

    /**
     * The one thing a filesystem can make the app say out loud before a single folder is opened:
     * Android reads none of the Linux or Mac formats, and FAT32 cannot hold a file over 4 GB, which
     * bites the long exports rather than the one-minute clips.
     */
    volumeFsWarning(volumes, translations) {
        const externals = volumes.filter(volume => volume.kind !== 'internal');
        const unsupported = externals.find(volume => FS_UNSUPPORTED.includes(String(volume.fs).toLowerCase()));
        if (unsupported) {
            return `${translations.volFsUnsupported
                .replace('{fs}', volumeFsLabel(unsupported.fs))
                .replace('{label}', this.volumeChipLabel(unsupported, translations))}`;
        }
        const fat32 = externals.find(volume => volumeFsLabel(volume.fs) === 'FAT32');
        if (fat32) return translations.volFsFat32;
        const readOnly = externals.find(volume => volume.readOnly);
        if (readOnly) {
            return `${this.volumeChipLabel(readOnly, translations)} ${translations.volReadOnlyWarn}`;
        }
        return '';
    }

    /**
     * Every mounted storage as one tap. A dashcam stick on an OTG cable lands at a vendor-named
     * mount point (`/storage/UsbDriveA`, `/storage/usbdisk1`, `/storage/1234-5678`), which before
     * this row meant typing a path nobody had ever seen; and a stick that is plugged in but never
     * mounted has to say so out loud, because on OPPO / vivo / Xiaomi / Honor OTG power is off by
     * default and "nothing happened" is otherwise indistinguishable from a broken app.
     */
    async renderStorageChips() {
        const row = document.getElementById('androidDirVolumes');
        const chips = document.getElementById('androidDirVolumeChips');
        const warn = document.getElementById('androidDirVolumeWarn');
        if (!row || !chips) return null;

        const translations = i18n[this.currentLanguage];
        const label = document.getElementById('androidDirVolumesLabel');
        if (label) label.textContent = translations.dirVolumeRow;

        const payload = await getStorageVolumes(true);
        if (!payload || !payload.volumes.length) {
            row.style.display = 'none';
            if (warn) {
                warn.textContent = payload && payload.usbDevices ? translations.usbNotMounted : '';
                warn.style.display = payload && payload.usbDevices ? 'block' : 'none';
            }
            this.renderUsbGuide(payload);
            return payload;
        }

        chips.innerHTML = '';
        for (const volume of payload.volumes) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `dir-volume-chip kind-${volume.kind}`;
            chip.dataset.path = volume.path;
            chip.title = this.volumeChipHint(volume, translations);
            chip.textContent = this.volumeChipLabel(volume, translations);
            const meta = document.createElement('span');
            meta.className = 'dir-volume-meta';
            meta.textContent = this.volumeChipMeta(volume);
            chip.appendChild(meta);
            // -1 is "we listed it and could not read it"; -2 is "the worker has not got there yet",
            // and disabling a chip on the second of those is how a healthy drive looks dead.
            if (volumeEntries(volume) === -1) {
                chip.disabled = true;
                chip.classList.add('no-access');
                chip.title = `${chip.title} — ${translations.volNoAccess}`;
            }
            // Every volume gets the same "含 SavedClips" probe, the phone's own storage included:
            // the documented workflow before USB reading was to copy TeslaCam onto the handset, and
            // that folder deserves the same one-tap jump the stick does.
            this.probeVolumeBadge(volume, chip, translations);
            chips.appendChild(chip);
        }
        this.renderUsbGuide(payload);

        row.style.display = 'flex';
        if (warn) {
            const mountedExternal = payload.volumes.some(v => v.kind !== 'internal' && volumeEntries(v) !== -1);
            const text = (payload.usbDevices > 0 && !mountedExternal)
                ? translations.usbNotMounted
                : this.volumeFsWarning(payload.volumes, translations);
            warn.textContent = text;
            warn.style.display = text ? 'block' : 'none';
        }
        return payload;
    }

    /**
     * Two thirds of 「APP 读不到我的 U 盘」 are OTG power and stopping one level too early in the
     * tree, and no error message fixes either. So the steps appear on their own the first time an
     * external volume is in sight — not on every open of the browser, and not at all once the user
     * has put them away; 关于 → U 盘读取指南 is the way back.
     */
    renderUsbGuide(payload) {
        const box = document.getElementById('usbGuide');
        if (!box) return;
        const externals = ((payload && payload.volumes) || []).filter(volume => volume.kind !== 'internal');
        const relevant = !!payload && (payload.usbDevices > 0 || externals.length > 0);
        if (!this.usbGuideForced && (!relevant || localStorage.getItem(ANDROID_USB_GUIDE_KEY) === '1')) {
            box.style.display = 'none';
            return;
        }

        const translations = i18n[this.currentLanguage];
        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        set('usbGuideTitle', translations.usbGuideTitle);
        set('usbGuideDismiss', translations.usbGuideDismiss);
        set('usbGuideOem', translations.usbGuideOem);
        set('usbGuideEject', translations.usbGuideEject);

        const list = document.getElementById('usbGuideSteps');
        if (list) {
            list.textContent = '';
            [translations.usbGuideStep1,
                translations.usbGuideStep2.replace('{row}', translations.dirVolumeRow),
                // Named the confirm button, not the neighbouring 「APP 存档位置」 jump — the guide
                // used to tell people to press the wrong one, and they did.
                translations.usbGuideStep3.replace('{apply}', translations.dirBrowserSelect)]
                .forEach(text => {
                    const li = document.createElement('li');
                    li.textContent = text;
                    list.appendChild(li);
                });
        }
        box.style.display = 'block';
    }

    dismissUsbGuide() {
        localStorage.setItem(ANDROID_USB_GUIDE_KEY, '1');
        this.usbGuideForced = false;
        const box = document.getElementById('usbGuide');
        if (box) box.style.display = 'none';
    }

    // Fill in "含 SavedClips" once the one-level listing comes back; awaiting it here would put a
    // round trip in front of the whole row.
    async probeVolumeBadge(volume, chip, translations) {
        const found = await probeVolumeForTeslaCam(volume.path);
        if (found.bestPath) chip.dataset.path = found.bestPath;
        if (found.clipFolders && found.clipFolders.length) {
            chip.classList.add('has-clips');
            const badge = document.createElement('span');
            badge.className = 'dir-volume-badge';
            badge.textContent = translations.volClips.replace('{folders}', found.clipFolders.join('/'));
            chip.appendChild(badge);
        } else if (volumeEntries(volume) === 0) {
            chip.classList.add('is-empty');
        }
        if (volume.readOnly) chip.classList.add('is-readonly');
    }

    /**
     * A stick is usually inserted while the app is already open, and Android gives no broadcast an
     * ordinary app can hear, so the only way it appears without a restart is to keep asking.
     */
    setupVolumeWatcher() {
        if (!isAndroidRuntime()) return;
        let signature = '';
        let seen = [];
        // Pulling a stick usually leaves the mount point in place — still listed by StorageManager,
        // now refusing every read — so the volume list does not change and the 「gone」 set below
        // stays empty while the dead clips remain on screen. The surviving signal is the mount
        // point itself going from answerable to unreadable, and that has to fail twice in a row
        // before being believed: a device busy copying a clip can refuse a single listing.
        const answered = new Set();
        const refusing = new Set();
        const check = async () => {
            let payload = null;
            try {
                payload = await getStorageVolumes(true);
            } catch (e) {
                return;
            }
            if (!payload) return;
            const externals = payload.volumes.filter(v => v.kind !== 'internal');
            // Identity, not state: the entry counts now land a beat after the mount, and a
            // signature that included them would rebuild the chips — wiping their scroll and
            // swallowing a tap — for nothing but a number filling in.
            const next = externals.map(v => `${v.path}:${v.fs}:${v.total}`).join('|');
            const changed = next !== signature;
            if (signature && changed) {
                const paths = seen.map(v => v.path);
                const added = externals.filter(v => !paths.includes(v.path));
                const gone = paths.filter(p => !externals.some(v => v.path === p));
                if (added.length) await this.announceNewVolumes(added);
                if (gone.length) await this.forgetRemovedVolumes(gone);
            }
            const withdrawn = [];
            let countsChanged = false;
            for (const volume of externals) {
                // Asked directly, because the native count worker can only ever answer for the
                // phone's own storage: listing `/storage` is not something an app may do.
                let probe = null;
                try {
                    probe = await nativeInvoke('probe_readable', { path: volume.path });
                } catch (e) {
                    continue;
                }
                const entries = probe.readable ? Number(probe.entries) || 0 : -1;
                if (volumeEntryCounts.get(volume.path) !== entries) {
                    volumeEntryCounts.set(volume.path, entries);
                    countsChanged = true;
                }
                if (entries >= 0) {
                    answered.add(volume.path);
                    refusing.delete(volume.path);
                    continue;
                }
                if (!answered.has(volume.path)) continue;
                if (!refusing.has(volume.path)) {
                    refusing.add(volume.path);
                    continue;
                }
                answered.delete(volume.path);
                refusing.delete(volume.path);
                withdrawn.push(volume.path);
            }
            seen = externals;
            signature = next;
            if (withdrawn.length) await this.forgetRemovedVolumes(withdrawn);
            // The chips only exist while the browser is open, so a stick that arrived while the
            // user was reading the list shows up without closing and reopening it. Rebuilding them
            // wipes their horizontal scroll and swallows a tap in flight, so only do it when a
            // volume came, went, or changed whether it answers — not on every poll.
            const modal = document.getElementById('androidDirModal');
            if ((changed || countsChanged || withdrawn.length) && modal && modal.classList.contains('show')) {
                storageVolumesPayload = null;
                await this.renderStorageChips();
            }
        };
        check();
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) check();
        });
        window.addEventListener('focus', check);
        this.volumeWatchTimer = setInterval(check, 12000);
    }

    async announceNewVolumes(volumes) {
        const translations = i18n[this.currentLanguage];
        for (const volume of volumes) {
            const label = this.volumeChipLabel(volume, translations);
            const entries = volumeEntries(volume);
            const found = await probeVolumeForTeslaCam(volume.path);
            if (found.bestPath) {
                this.showToast(
                    translations.usbFoundClips
                        .replace('{label}', label)
                        .replace('{folders}', found.clipFolders.join('/')),
                    'info', 12000);
            } else if (entries > 0 || entries === -2) {
                this.showToast(
                    `${translations.usbFound.replace('{label}', label).replace('{path}', volume.path)}`,
                    'info', 9000);
            } else if (found.error || entries === -1) {
                // The drive is mounted somewhere this app may not read, and on a big stick the
                // usual reason is the filesystem, not the permission — so name whichever it is.
                const fsWarn = this.volumeFsWarning([volume], translations);
                this.showToast(`${label} ${this.volumeChipHint(volume, translations)} — ${fsWarn || translations.volNoAccess}`,
                    'error', 15000);
            } else {
                // Mounted, readable, nothing in it: usually one level too high in the tree.
                this.showToast(`${label} ${volume.path} — ${translations.volEmptyDir} · ${translations.usbOneLevel}`,
                    'error', 15000);
            }
        }
    }

    /**
     * `No such file or directory` out of the scanner means the folder is not there any more —
     * pulled drive or deleted clips, and the difference does not matter to the list, which is
     * dead either way. See `isGoneError` for the other half.
     */
    isMissingFolderError(message) {
        return /No such file or directory|cannot be found|ENOENT/i.test(String(message || ''));
    }

    /**
     * Whether a read failure means 「the folder left」 rather than 「you cannot see it」. A stick whose
     * mount died refuses reads instead of disappearing from the directory tree, and to the list
     * those are the same news. Only the removable mounts get to be read that way: a refusal under
     * the phone's own storage is the permission, and with all-files access not yet granted telling
     * someone the folder is gone would send them re-plugging a drive that was never the problem.
     */
    async isGoneError(path, message) {
        if (this.isMissingFolderError(message)) return true;
        if (!/Permission denied|EACCES/i.test(String(message || ''))) return false;
        if (!/^\/storage\/(?!emulated|self|users)[^/]+/i.test(String(path || ''))) return false;
        const status = await getNativeStorageStatus(300);
        return status?.manage_external_storage === true;
    }

    async scannedPathGone(path, options = {}) {
        if (!isAndroidRuntime()) return false;
        try {
            const probe = await nativeInvoke('probe_readable', { path });
            if (probe.readable) return false;
            if (!await this.isGoneError(path, probe.error)) return false;
        } catch (e) {
            return false;
        }
        if (!options.confirmed) {
            // A process that starts while a stick is mounting sees the folder refuse reads for a
            // moment before the mount reaches it — measured on the emulator, where that transient
            // verdict deleted a healthy drive's folder from the row. The second look is the one
            // acted on; a folder that really left fails both.
            await new Promise(resolve => setTimeout(resolve, 2000));
            return this.scannedPathGone(path, { ...options, confirmed: true });
        }
        return true;
    }

    /**
     * Everything the app remembers about a folder that has since left the device. The remembered
     * paths are what made 「弹出U盘」 look like a broken app: the dead mount point stayed in the
     * drawer as a chip, stayed as the folder the browser opens on, and stayed as the path the
     * header claims is loaded — while the clips still on screen were the phone's own.
     */
    pruneStaleStorage(roots) {
        const norm = roots.map(p => String(p).replace(/\/+$/, '')).filter(Boolean);
        if (!norm.length) return [];
        const under = (path, root) => path === root || path.startsWith(root + '/');
        const onGone = path => {
            const at = String(path || '').replace(/\/+$/, '');
            return !!at && norm.some(root => under(at, root));
        };

        const before = this.readRecentDirs();
        const keep = before.filter(p => !onGone(p));
        if (keep.length !== before.length) {
            try { localStorage.setItem(ANDROID_RECENT_DIRS_KEY, JSON.stringify(keep)); } catch (e) { /* private mode */ }
            this.renderRecentDirs();
        }

        const savedDir = localStorage.getItem(ANDROID_MEDIA_DIR_KEY);
        if (savedDir && onGone(savedDir)) {
            try { localStorage.removeItem(ANDROID_MEDIA_DIR_KEY); } catch (e) { /* private mode */ }
        }
        if (this.lastScannedPath && onGone(this.lastScannedPath)) this.lastScannedPath = '';
        if (this.androidBrowsePath && onGone(this.androidBrowsePath)) {
            // Stay inside the mount that is still there, so the browser opens on the stick's root
            // rather than jumping to the phone and implying the stick was never there.
            const up = parentPath(this.androidBrowsePath);
            this.androidBrowsePath = onGone(up) ? '' : up;
        }

        const changed = keep.length !== before.length || (savedDir && onGone(savedDir));
        if (changed && this.isTauri) this.saveTauriConfig({ lastTeslaCamPath: this.lastScannedPath || null });
        // The next stick gets the same mount point — FAT32 volumes are named by their label, and
        // two of them mount at /storage/0000-0000 — so the dead one's count must not follow it.
        for (const root of norm) volumeEntryCounts.delete(root);
        return norm;
    }

    /**
     * The other half of the mount watch. A pulled stick left its events in the list, so the next
     * refresh walked a path that no longer exists and answered with a scan error — the user read
     * that as the app breaking, when the whole truth was 盘不在了. Clear what lived on it and say
     * that instead.
     */
    async forgetRemovedVolumes(paths, options = {}) {
        const roots = (paths || []).map(p => String(p).replace(/\/+$/, '')).filter(Boolean);
        if (!roots.length) return false;
        const onGone = path => {
            const at = String(path || '').replace(/\/+$/, '');
            return !!at && roots.some(root => at === root || at.startsWith(root + '/'));
        };

        const hadGoneFiles = !!this.allFiles?.some(file => onGone(file.path));
        if (hadGoneFiles) {
            this.allFiles = [];
            this.eventGroups = [];
            // Auto-next reads the rendered list, and a stale copy of a removed drive would keep
            // queueing clips that cannot open.
            this.lastFilteredEvents = [];
            this.filterAndRender();
        }

        const keptList = !hadGoneFiles && this.eventGroups?.length;
        const pruned = this.pruneStaleStorage(roots);
        const translations = i18n[this.currentLanguage];
        if (options.silent) return hadGoneFiles || pruned.length > 0;
        if (hadGoneFiles) {
            this.showToast(translations.volumeGone, 'error', 9000);
        } else if (keptList && pruned.length) {
            // The clips on screen came from somewhere else all along, so the only honest sentence
            // is the one that names both the dead path and the folder still being shown.
            this.showToast(translations.pathGoneKept
                .replace('{path}', roots[0])
                .replace('{keep}', this.lastScannedPath || translations.previousFolder), 'error', 12000);
        } else if (pruned.length) {
            this.showToast(translations.stalePathDropped.replace('{path}', roots[0]), 'info', 7000);
        }
        return hadGoneFiles || pruned.length > 0;
    }

    /**
     * R25-3: one screen that answers the three questions a bug report always contains — which
     * build, which handset, where the source is — plus the contact and the reward code. The row
     * itself is `phone-only-btn`, so the desktop menu keeps its original five entries.
     */
    setupAboutPanel() {
        const modal = document.getElementById('aboutModal');
        if (!modal || this.aboutBound) return;
        this.aboutBound = true;

        document.getElementById('aboutBtn')?.addEventListener('click', () => this.openAbout());
        document.getElementById('aboutCloseBtn')?.addEventListener('click', () => this.closeAbout());
        document.getElementById('aboutGithubBtn')?.addEventListener('click', () => {
            openExternalUrl(ABOUT_REPO_URL);
        });
        // The guide normally shows itself once and then keeps out of the way; this is the way back.
        document.getElementById('aboutUsbGuideBtn')?.addEventListener('click', () => {
            this.usbGuideForced = true;
            this.closeAbout();
            this.openAndroidFolderBrowser();
        });
        document.getElementById('usbGuideDismiss')?.addEventListener('click', () => this.dismissUsbGuide());
        // The code inside the poster is only ~90px at the size the card can hold, which is under
        // what most cameras lock onto, so a tap trades it for a full-height view and back.
        document.getElementById('aboutQrBtn')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        });
        document.getElementById('aboutCopyContactBtn')?.addEventListener('click', async () => {
            const ok = await copyTextToClipboard(ABOUT_CONTACT);
            this.showToast(ok
                ? i18n[this.currentLanguage].aboutCopied
                : `${i18n[this.currentLanguage].copyFailed}: ${ABOUT_CONTACT}`, 'info', 4000);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAbout();
        });
    }

    updateAboutTexts() {
        const translations = i18n[this.currentLanguage];
        const set = (id, key) => {
            const el = document.getElementById(id);
            if (el && translations[key]) el.textContent = translations[key];
        };
        set('aboutModalTitle', 'aboutTitle');
        set('aboutTagline', 'aboutTagline');
        set('aboutDeviceLabel', 'aboutDevice');
        set('aboutGithubLabel', 'aboutGithub');
        set('aboutUsbGuideLabel', 'aboutUsbGuide');
        set('aboutUsbGuideHint', 'aboutUsbGuideHint');
        set('aboutFeedbackText', 'aboutFeedback');
        set('aboutCopyContactBtn', 'aboutCopyContact');
        set('aboutDonateTitle', 'aboutDonate');
        set('aboutDonateNote', 'aboutDonateNote');
        const qrImg = document.getElementById('aboutQrImg');
        if (qrImg) qrImg.alt = translations.aboutQrAlt;
        set('aboutLicenseNote', 'aboutLicenseNote');
    }

    async openAbout() {
        const modal = document.getElementById('aboutModal');
        if (!modal) return;

        this.updateAboutTexts();

        const native = await getNativeStorageStatus(600) || readNativeStorageStatus() || {};
        const shown = native.version || this.dom.appVersion?.textContent?.replace(/^v/, '') || '—';
        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        set('aboutVersion', `v${shown}`);
        // Which handset and which Android — the two facts a remote diagnosis always needs, and the
        // page cannot read either of them itself.
        const deviceParts = [
            native.device,
            native.android ? `Android ${native.android}` : '',
            native.sdk ? `API ${native.sdk}` : '',
            `${Math.round(innerWidth)}×${Math.round(innerHeight)}`,
        ].filter(Boolean);
        set('aboutDeviceValue', deviceParts.join(' · '));

        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
        this.syncBackLayers?.();
    }

    closeAbout() {
        const modal = document.getElementById('aboutModal');
        if (!modal) return;
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        this.syncBackLayers?.();
    }

    async androidBrowseTo(path) {
        if (!path) return;

        const list = document.getElementById('androidDirList');
        const hint = document.getElementById('androidDirHint');

        document.getElementById('androidDirPathInput').value = path;
        hint.style.display = 'none';
        list.textContent = '…';

        try {
            const names = await nativeInvoke('list_subdirs', { path });

            this.androidBrowsePath = path;
            list.innerHTML = '';

            if (names.length === 0) {
                list.textContent = i18n[this.currentLanguage].dirBrowserEmpty;
                return;
            }

            this.appendDirRows(list, path, names, 0);
        } catch (e) {
            console.warn('[androidBrowseTo] list_subdirs failed for', path, e);
            const message = String(e && e.message || e);
            if (await this.isGoneError(path, message)) {
                // A folder that is not there is not a permission problem, and sending anyone who
                // ejected a stick to the 所有文件访问 switch is how the app got blamed for it.
                const translations = i18n[this.currentLanguage];
                list.innerHTML = '';
                document.getElementById('androidDirHintTitle').textContent = translations.dirGoneTitle;
                document.getElementById('androidDirHintBody').textContent =
                    translations.dirGoneBody.replace('{path}', path);
                document.getElementById('androidDirHintSteps').textContent = translations.dirGoneSteps;
                document.getElementById('androidDirHintApp').textContent = '';
                document.getElementById('androidDirHintError').textContent = message;
                const settingsBtn = document.getElementById('androidDirHintSettings');
                if (settingsBtn) settingsBtn.style.display = 'none';
                hint.style.display = 'block';
                await this.forgetRemovedVolumes([path], { silent: true });
                return;
            }
            await this.showAndroidPermissionHint(path, hint);
        }
    }

    /**
     * A folder on a 2 TB drive can hold several thousand event directories, and building that many
     * buttons in one pass is a freeze nobody would recognise as a browser bug. So one screenful
     * lands at once and the rest arrives per tap, with the total said out front so the list never
     * reads as the whole folder when it is a fifth of it.
     */
    appendDirRows(list, path, names, from) {
        const translations = i18n[this.currentLanguage];
        const page = names.slice(from, from + DIR_PAGE_SIZE);
        for (const name of page) {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'dir-browser-item';
            row.textContent = name;
            row.addEventListener('click', () => this.androidBrowseTo(joinPath(path, name)));
            list.appendChild(row);
        }

        const older = list.querySelector('.dir-browser-more');
        if (older) older.remove();
        const next = from + page.length;
        if (next >= names.length) {
            if (names.length > DIR_PAGE_SIZE) {
                const done = document.createElement('div');
                done.className = 'dir-browser-count';
                done.textContent = translations.dirBrowserAllShown.replace('{n}', names.length);
                list.appendChild(done);
            }
            return;
        }
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'dir-browser-more';
        more.textContent = translations.dirBrowserMore
            .replace('{shown}', next)
            .replace('{total}', names.length);
        more.addEventListener('click', () => this.appendDirRows(list, path, names, next));
        list.appendChild(more);
    }

    // The toggle sits five menus deep and the vendor skins disagree about which five, so the
    // banner names it and jumps straight there. MainActivity re-pushes the permission state
    // whenever the window regains focus, which is what makes "grant it, press back" work
    // without restarting the app.
    setupPermissionBanner() {
        if (!isAndroidRuntime() || !this.dom.permBanner) return;
        const openSettings = () => {
            try {
                window.TDashcamNative.openStorageSettings();
            } catch (e) {
                console.warn('[permBanner] openStorageSettings failed:', e);
            }
        };
        this.dom.permBannerBtn.addEventListener('click', openSettings);
        const hintBtn = document.getElementById('androidDirHintSettings');
        if (hintBtn) hintBtn.addEventListener('click', openSettings);

        this.updatePermissionBanner();
        // The permission state is pushed by the native side and the first push can land after
        // this runs, so keep polling while it is either off or still unknown.
        this.permWatch = setInterval(() => this.updatePermissionBanner(), 1500);
    }

    stopPermissionWatch() {
        if (this.permWatch) {
            clearInterval(this.permWatch);
            this.permWatch = null;
        }
    }

    updatePermissionBanner() {
        const banner = this.dom.permBanner;
        if (!banner) return;
        const status = readNativeStorageStatus();
        const blocked = !!status && status.manage_external_storage === false;
        const wasBlocked = this.permBannerBlocked;
        this.permBannerBlocked = blocked;
        // Granted before the app ever needed it: nothing left to watch for.
        if (status && !blocked) this.stopPermissionWatch();

        const translations = i18n[this.currentLanguage];
        this.dom.permBannerText.textContent = translations.permBanner;
        this.dom.permBannerBtn.textContent = translations.permBannerBtn;
        banner.style.display = blocked ? 'flex' : 'none';
        const hintBtn = document.getElementById('androidDirHintSettings');
        if (hintBtn) hintBtn.textContent = translations.permBannerBtn;

        if (wasBlocked && !blocked) {
            // The list is still empty from the scan that failed, so redo it now that it can
            // succeed; guidance that leaves you staring at nothing is not guidance.
            if (this.lastScannedPath && !this.eventGroups.length) this.loadTauriDirectory(this.lastScannedPath);
        }
    }

    // readDir failures on Android are almost always the storage permission, but the
    // JS plugin error text is unreliable, so ask the native side for the real errno.
    async showAndroidPermissionHint(path, hint) {
        const translations = i18n[this.currentLanguage];
        const status = await getStorageStatus();
        document.getElementById('androidDirHintTitle').textContent = translations.permTitle;
        document.getElementById('androidDirHintBody').textContent = translations.permBody;
        document.getElementById('androidDirHintSteps').textContent = translations.permSteps;
        document.getElementById('androidDirHintApp').textContent = status?.app_files_dir
            ? `${translations.permAppDir} ${status.app_files_dir}`
            : '';

        const errorEl = document.getElementById('androidDirHintError');
        // The gone-folder card hides this button; a later permission card must not inherit that.
        const settingsBtn = document.getElementById('androidDirHintSettings');
        if (settingsBtn) settingsBtn.style.display = '';
        const nativeStatus = await getNativeStorageStatus(600);
        const lines = [];
        if (nativeStatus) {
            lines.push(nativeStatus.manage_external_storage
                ? `${translations.permGranted} (SDK ${nativeStatus.sdk})`
                : `${translations.permMissing} (SDK ${nativeStatus.sdk})`);
        }
        try {
            const probe = await nativeInvoke('probe_readable', { path });
            if (!probe.readable) {
                lines.push(`${path}: ${probe.error}`);
            }
        } catch (e) {
            console.warn('[androidBrowseTo] probe failed:', e);
        }
        errorEl.textContent = lines.join(' · ');

        hint.style.display = 'block';
    }

    // An empty scan can mean the permission is missing, the folder really is empty, or
    // the files landed somewhere else; only the native side can tell them apart.
    async reportEmptyScan(path) {
        const translations = i18n[this.currentLanguage];
        const nativeStatus = await getNativeStorageStatus();
        if (nativeStatus && nativeStatus.manage_external_storage === false) {
            this.showToast(`${translations.noFilesPerm} — ${translations.permMissing}`, 'error', 12000);
            return;
        }

        const status = await getStorageStatus(true);
        if (!nativeStatus && storageBlockedByPermission(status)) {
            this.showToast(`${translations.noFilesPerm} ${status.error || ''}`.trim(), 'error', 10000);
            return;
        }

        let detail = '';
        try {
            const probe = await nativeInvoke('probe_readable', { path });
            if (!probe.readable) {
                detail = ` — ${probe.error}`;
            } else if (probe.entries === 0) {
                detail = ` — ${translations.noFilesEmptyDir}`;
            } else {
                const names = (probe.sample || []).join(', ');
                detail = ` — ${translations.noFilesEntries.replace('{n}', probe.entries)}: ${names}`;
            }
        } catch (e) {
            console.warn('[reportEmptyScan] probe failed:', e);
        }

        const locations = await this.describeMediaLocations(path, translations);
        this.showToast(`${translations.noFilesEmpty}${detail} · ${translations.scannedPath}: ${path}${locations}`, 'error', 15000);
    }

    // Where the clips actually are on this device. Without this, "the folder is empty"
    // cannot be told apart from "you copied them somewhere else".
    async describeMediaLocations(chosenPath, translations) {
        try {
            const found = await nativeInvoke('find_media_locations');
            const others = (found || []).filter(item => item.path !== chosenPath.replace(/\/+$/, ''));
            if (!others.length) return ` · ${translations.noMediaAnywhere}`;

            const listed = others.slice(0, 3)
                .map(item => `${item.path} (${item.videos}${item.teslacam ? ' · TeslaCam' : ''})`)
                .join(', ');
            return ` · ${translations.foundMediaAt}: ${listed}`;
        } catch (e) {
            console.warn('[describeMediaLocations] search failed:', e);
            return '';
        }
    }

    /**
     * 加载 Tauri 目录
     */
    async loadTauriDirectory(path, options = {}) {
        await ensureMediaServer();
        // Remembered, not committed: a folder that is not on the device any more must not become
        // the path the header and the on-state chip claim is loaded, which is how 「点击U盘路径却
        // 出现手机存储的视频」 looked like the app mixing two drives together.
        const previousPath = this.lastScannedPath;
        this.lastScannedPath = path;
        this.isScanning = true;

        // A pull that springs straight back reads as "nothing happened", so the header keeps
        // its height and spins until the scan is over.
        const ptrSpinner = options.pullRefresh ? document.getElementById('ptrSpinner') : null;
        if (ptrSpinner) {
            ptrSpinner.classList.add('spinning');
            ptrSpinner.style.height = '34px';
        }

        // Show loading state. On a phone the list itself gets the placeholder: a centred
        // "Scanning files..." bubble over an empty drawer tells you nothing about how many
        // events are coming.
        const useSkeleton = isPhoneLayout();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'tauri-loading';
        loadingDiv.style.position = 'fixed';
        loadingDiv.style.top = '50%';
        loadingDiv.style.left = '50%';
        loadingDiv.style.transform = 'translate(-50%, -50%)';
        loadingDiv.style.padding = '20px';
        loadingDiv.style.background = 'rgba(0,0,0,0.8)';
        loadingDiv.style.color = 'white';
        loadingDiv.style.borderRadius = '10px';
        loadingDiv.style.zIndex = '9999';
        loadingDiv.innerText = i18n[this.currentLanguage].scanningFiles;
        if (useSkeleton) {
            loadingDiv.style.display = 'none';
            this.showScanSkeleton();
        }
        document.body.appendChild(loadingDiv);

        try {
            console.log('[loadTauriDirectory] Scanning path:', path);
            const files = isAndroidRuntime()
                ? await this.nativeScanFiles(path)
                : await this.scanTauriFiles(path, path);
            console.log('[loadTauriDirectory] Found files:', files.length);

            if (files.length > 0) {
                // Log first few files for debugging
                files.slice(0, 5).forEach(f => {
                    console.log('[loadTauriDirectory] Sample file:', f.name, 'webkitRelativePath:', f.webkitRelativePath);
                });
                
                // 检查是否是有效的 TeslaCam 目录
                const hasTeslaCamSubfolders = files.some(file => 
                    file.webkitRelativePath.includes('RecentClips/') ||
                    file.webkitRelativePath.includes('SavedClips/') ||
                    file.webkitRelativePath.includes('SentryClips/')
                );
                
                if (hasTeslaCamSubfolders) {
                    if (isAndroidRuntime()) {
                        localStorage.setItem(ANDROID_MEDIA_DIR_KEY, path);
                        this.rememberRecentDir(path);
                    }
                    // 保存路径到配置文件
                    await this.saveTauriConfig({ lastTeslaCamPath: path });
                    console.log('[loadTauriDirectory] Saved path to config file');
                    
                    await this.handleFolderSelection(files);
                    // A budget cut is invisible in the result: twenty thousand clips and a partial
                    // walk of two hundred thousand look identical, and the difference is only
                    // discoverable the day somebody looks for the recording that is not there.
                    if (this.lastScanTruncated) {
                        this.showToast(i18n[this.currentLanguage].scanTruncated.replace('{n}', files.length),
                            'info', 12000);
                    }
                } else {
                    // Print what was actually found: on a phone a screenshot is the only
                    // way to tell a wrong folder from a misread tree.
                    const samples = files.slice(0, 3).map(f => f.webkitRelativePath).join(', ');
                    const translations = i18n[this.currentLanguage];
                    this.showToast(
                        `${translations.invalidFolder} (${files.length}): ${samples}`,
                        'error',
                        12000
                    );
                }
            } else {
                await this.reportEmptyScan(path);
            }
        } catch (e) {
            console.error('[loadTauriDirectory] Error:', e);
            const translations = i18n[this.currentLanguage];
            // A pulled stick is the usual reason for this throw, and `scanReadFailed` made it
            // sound like the reader broke. Ask the folder whether it is still there before
            // blaming the read — but only on a genuine "no such file", because a list blocked
            // by permission is still a list the user can see and must not lose.
            if (await this.scannedPathGone(path)) {
                // Put the folder that is still there back in the header before pruning, so the
                // chip that stays lit is the one whose clips are actually on screen.
                this.lastScannedPath = previousPath;
                await this.forgetRemovedVolumes([path]);
                return;
            }
            this.showToast(translations.scanReadFailed.replace('{msg}', e.message || String(e)), 'error');
        } finally {
            this.isScanning = false;
            this.clearScanSkeleton();
            this.renderRecentDirs();
            if (ptrSpinner) {
                ptrSpinner.classList.remove('spinning', 'ready');
                ptrSpinner.style.height = '';
            }
            if (loadingDiv) loadingDiv.remove();
        }
    }


    updateAllUIText(lang) {
        const translations = i18n[lang];
        if (!translations) return;

        document.title = translations.pageTitle;
        
        // Update language toggle button text
        const langIconEl = this.dom.langToggleBtn.querySelector('.btn-icon');
        if (langIconEl) {
            langIconEl.textContent = lang === 'zh' ? 'En' : '中';
        } else {
            this.dom.langToggleBtn.textContent = lang === 'zh' ? 'En' : '中';
        }
        
        this.dom.langToggleBtn.title = translations.toggleLanguage;
        this.updateThemeIcon(document.body.classList.contains('dark-theme'));
        this.dom.toggleSidebarBtn.title = translations.toggleSidebar;
        this.dom.mapModalTitle.textContent = translations.mapModalTitle;
        this.dom.gaodeMapBtn.textContent = translations.gaodeMap;
        this.dom.googleMapBtn.textContent = translations.googleMap;
        this.dom.revealFileBtn.title = translations.revealFile;
        this.dom.downloadFileBtn.title = translations.downloadFile;
        this.dom.exportMetadataBtn.title = translations.exportMetadata;
        if (this.dom.headerMenuBtn) {
            this.dom.headerMenuBtn.title = translations.moreOptions;
        }
        // On a phone these cells keep the glyph and lose the words (the `.btn-text` rules in the
        // touch tier), and TalkBack reads neither the `title` nor a hidden label — so the button
        // announces itself as "button". The label has to travel with the language, which is why it
        // is mirrored here instead of hard-coded into the markup.
        const headerAria = {
            metaSwitchBtn: translations.metadata,
            metaDetailBtn: translations.metadataDetail,
            exportMetadataBtn: translations.exportMetadata,
            revealFileBtn: translations.revealFile,
            downloadFileBtn: translations.downloadFile,
            snapshotBtn: translations.snapshot,
            diagnosticsBtn: translations.diagnostics,
            themeToggleBtn: translations.toggleTheme,
            langToggleBtn: translations.toggleLanguage,
            aboutBtn: translations.about,
            headerMenuBtn: translations.moreOptions,
            openSidebarBtn: translations.openSidebarLabel,
        };
        Object.entries(headerAria).forEach(([id, text]) => {
            const btn = document.getElementById(id);
            if (btn && text) btn.setAttribute('aria-label', text);
        });

        document.querySelector('.sidebar-header .header-title span').textContent = translations.headerTitle;
        document.querySelector('.filter-group label[for="dateFilter"]').textContent = translations.date;
        document.querySelector('.filter-group label[for="eventFilter"]').textContent = translations.eventType;
        document.querySelector('#eventFilter option[value=""]').textContent = translations.allTypes;
        document.querySelector('#eventFilter option[value="RecentClips"]').textContent = translations.recentClips;
        document.querySelector('#eventFilter option[value="SavedClips"]').textContent = translations.savedClips;
        document.querySelector('#eventFilter option[value="SentryClips"]').textContent = translations.sentryClips;
        
        const useFileInput = !supportsDirectoryPicker() && !isAndroidRuntime();
        document.querySelector('#selectFolderBtn').textContent = useFileInput ? translations.selectFiles : translations.selectFolder;
        const openSidebarLabelEl = document.getElementById('openSidebarLabel');
        if (openSidebarLabelEl) openSidebarLabelEl.textContent = translations.openSidebarLabel;

        // Update View Switcher and other common labels
        document.querySelectorAll('[data-i18n="front"]').forEach(el => el.textContent = translations.front);
        document.querySelectorAll('[data-i18n="back"]').forEach(el => el.textContent = translations.back);
        document.querySelectorAll('[data-i18n="left"]').forEach(el => el.textContent = translations.left);
        document.querySelectorAll('[data-i18n="right"]').forEach(el => el.textContent = translations.right);
        document.querySelectorAll('[data-i18n="leftPillar"]').forEach(el => el.textContent = translations.leftPillar);
        document.querySelectorAll('[data-i18n="rightPillar"]').forEach(el => el.textContent = translations.rightPillar);
        document.querySelectorAll('[data-i18n="grid6"]').forEach(el => el.textContent = translations.grid6);
        document.querySelectorAll('[data-i18n="grid4"]').forEach(el => el.textContent = translations.grid4);
        document.querySelectorAll('[data-i18n="legacy"]').forEach(el => el.textContent = translations.legacy);

        // Phone bar, card context menu, pull-to-refresh and the ⋮ phone entries.
        ['tabList', 'tabFolder', 'tabLayout', 'tabRefresh', 'tabMore',
         'contextPlay', 'contextSingle', 'contextPath', 'contextMeta', 'contextPlace', 'contextStar', 'contextUnstar',
         'contextDelete',
         'starFilterOn', 'starFilterOff', 'sortNewest', 'sortOldest',
         'pullToRefresh', 'snapshot', 'diagnostics', 'copyDetails', 'about',
         'heroTitle', 'heroHint', 'heroFind',
         'menuClip', 'menuPlayback', 'menuOther'].forEach(key => {
            document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el => {
                if (translations[key]) el.textContent = translations[key];
            });
        });
        // The About panel is only ever filled when it opens, but its row title has to follow the
        // language the moment the menu is drawn.
        const aboutBtn = document.getElementById('aboutBtn');
        if (aboutBtn && translations.about) aboutBtn.title = translations.about;
        if (document.getElementById('aboutModal')?.classList.contains('show')) this.updateAboutTexts();
        // Export-sheet rows and the route map are built once in the markup, so their labels have to
        // be re-stamped here like any other phone UI.
        ['peViews', 'peSize', 'peLayout', 'peRange', 'peFromNow', 'peMarkIn', 'peMarkOut',
         'peMarks', 'peMarkSave', 'routeMapTitle',
         'peOverlay', 'peMosaic', 'peMosaicClear', 'peBurnStamp',
         'peBurnHud'].forEach(key => {
            document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el => {
                if (translations[key]) el.textContent = translations[key];
            });
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const text = translations[el.dataset.i18nPlaceholder];
            if (text) el.placeholder = text;
        });
        this.updateLayoutTabLabel();
        this.updateAutoNextLabel?.();
        this.updateStarFilterLabel();
        this.updateSortOrderLabel();
        this.updateTriggerHighlightLabel?.();
        this.updateTapBehaviorLabel?.();
        this.updateThemeChoice?.();
        this.metadataManager?.updateStatsFoldLabel(!!this.metadataManager.dom.statsOverlay?.classList.contains('folded'));
        this.updateTabAriaLabels();
        if (!this.currentEvent) this.setHeaderEventName(null);

        // Update Metadata Panel and Buttons
        const metadataKeys = [
            'metadata', 'metadataDetail', 'loadingMetadata', 'noMetadata', 'speed', 'gear', 'steering', 
            'accelerator', 'brake', 'blinker', 'autopilot', 'gps', 'heading', 'acceleration',
            'revealFile', 'downloadFile', 'toggleTheme', 'toggleLanguage', 'exportMetadata'
        ];
        metadataKeys.forEach(key => {
            document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el => {
                if (translations[key]) el.textContent = translations[key];
            });
        });

        // Update stats overlay title if open
        const statsTitle = document.getElementById('statsTitle');
        if (statsTitle) {
            statsTitle.textContent = translations.driveStats;
        }

        if (this.allFiles.length === 0) {
            this.showInitialHelpMessage();
        } else {
            this.filterAndRender();
        }
        
        this.videoControls.updatePlayState(this.multiCameraPlayer.isPlaying);
        this.videoControls.updateRealTimeClock();
    }

    /**
     * A phone that boots to a black rectangle with the clip list behind a drawer is unfriendly,
     * but the drawer is still the shape that fits a 412px-wide screen: the list gets the whole
     * width while it is open, and the picture gets it back the moment something is playing.
     */
    toggleSidebar(forceState) {
        let isNowCollapsed;
        if (typeof forceState !== 'undefined') {
            isNowCollapsed = !forceState;
            this.dom.sidebar.classList.toggle('collapsed', isNowCollapsed);
        } else {
            isNowCollapsed = this.dom.sidebar.classList.toggle('collapsed');
        }
        
        document.body.classList.toggle('sidebar-collapsed', isNowCollapsed);
        // Hand the boot-time "drawer is away" rule over to `.collapsed`. Done after the toggle so
        // the two rules never disagree for a frame, and done here because this is the only writer
        // of the collapsed state.
        document.documentElement.classList.remove('phone-boot');
        this.dom.toggleSidebarBtn.classList.toggle('collapsed', isNowCollapsed);
        this.dom.overlay.classList.toggle('active', !isNowCollapsed && isPhoneLayout());
        // The ⋮ panel and its header ride at z-index 1700, one notch over the drawer, so opening
        // the drawer from the title while the panel is still up slid the list underneath it. The
        // tab bar already closes the panel; the title and the swipe-back were the paths that
        // didn't.
        if (!isNowCollapsed && isPhoneLayout()) {
            this.dom.headerRight?.classList.remove('active');
        }
        this.syncSidebarAria(isNowCollapsed);
        
        // Re-check header collapse after sidebar animation completes
        setTimeout(() => this.checkHeaderCollapse(), 350);
    }

    /**
     * A drawer that is only pushed off-screen by a transform is still in the reading order, so
     * TalkBack would announce the whole clip list behind the picture on every swipe. Phone only:
     * on desktop the collapsed panel is a narrow column, not a hidden one, and its contents stay
     * reachable.
     */
    syncSidebarAria(collapsed) {
        if (!this.dom.sidebar) return;
        const open = String(!collapsed);
        [this.dom.tabListBtn, this.dom.openSidebarBtn, this.dom.toggleSidebarBtn]
            .forEach(btn => btn?.setAttribute('aria-expanded', open));
        if (!isPhoneLayout()) {
            this.dom.sidebar.removeAttribute('aria-hidden');
            this.dom.sidebar.inert = false;
            return;
        }
        this.dom.sidebar.setAttribute('aria-hidden', open === 'false' ? 'true' : 'false');
        this.dom.sidebar.inert = collapsed;
    }

    initSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let touchTarget = null;
        const minSwipeDistance = 50;
        const maxVerticalDistance = 100;
        const edgeThreshold = 30; // Edge area for swipe-to-open

        /* clientX/clientY, not screenX/screenY: the screen frame keeps its axes when the activity
           rotates, so in landscape a straight vertical drag through the event list arrives as a
           large deltaX and read as "swipe left to close" — the drawer dismissed itself every time
           the list was scrolled. The viewport frame is the one the drawer is laid out in. */
        const px = t => t.clientX;
        const py = t => t.clientY;

        /* A drag that starts inside something that already scrolls sideways in that direction
           belongs to that element — the date chips row was the case, where the flick to reach the
           later chips also closed the whole drawer. */
        const startsInHorizontalScroller = (target, deltaX) => {
            let node = target instanceof Element ? target : target?.parentElement;
            while (node && node !== this.dom.sidebar) {
                const overflow = node.scrollWidth - node.clientWidth;
                if (overflow > 8) {
                    if (deltaX < 0 && node.scrollLeft < overflow - 1) return true;
                    if (deltaX > 0 && node.scrollLeft > 1) return true;
                }
                node = node.parentElement;
            }
            return false;
        };

        // Swipe on sidebar to close
        this.dom.sidebar.addEventListener('touchstart', (e) => {
            touchStartX = px(e.changedTouches[0]);
            touchStartY = py(e.changedTouches[0]);
            touchTarget = e.target;
        }, { passive: true });

        this.dom.sidebar.addEventListener('touchend', (e) => {
            if (!isPhoneLayout()) return;

            touchEndX = px(e.changedTouches[0]);
            touchEndY = py(e.changedTouches[0]);

            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(touchEndY - touchStartY);

            // Swipe left to close sidebar
            if (deltaX < -minSwipeDistance && deltaY < maxVerticalDistance &&
                !startsInHorizontalScroller(touchTarget, deltaX)) {
                this.toggleSidebar(false);
            }
        }, { passive: true });

        // Swipe from left edge to open sidebar
        document.addEventListener('touchstart', (e) => {
            touchStartX = px(e.changedTouches[0]);
            touchStartY = py(e.changedTouches[0]);
            touchTarget = e.target;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!isPhoneLayout()) return;
            
            const isCollapsed = this.dom.sidebar.classList.contains('collapsed');
            if (!isCollapsed) return; // Only handle swipe-to-open when sidebar is hidden
            
            touchEndX = px(e.changedTouches[0]);
            touchEndY = py(e.changedTouches[0]);
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(touchEndY - touchStartY);
            
            // Swipe right from left edge to open sidebar
            if (touchStartX < edgeThreshold && deltaX > minSwipeDistance && deltaY < maxVerticalDistance &&
                !startsInHorizontalScroller(touchTarget, deltaX)) {
                this.toggleSidebar(true);
            }
        }, { passive: true });
        
        // Initialize view switcher scroll with mouse wheel support
        this.initViewSwitcherScroll();
    }

    initViewSwitcherScroll() {
        const viewSwitcher = document.getElementById('viewSwitcher');
        if (!viewSwitcher) return;

        // Mouse wheel horizontal scroll
        viewSwitcher.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                viewSwitcher.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }

    /* Desktop treats "the current file" as undefined mid multi-camera playback, so both file
       actions used to bail out. On a phone mid-playback is the only state they are reachable in. */
    blockedByPlayback() {
        return (this.multiCameraPlayer.isPlaying && !isPhoneLayout()) || !this.continuousPlayer.currentEvent;
    }

    async revealCurrentFilePath() {
        if (this.blockedByPlayback()) {
            return;
        }
    
        const currentSegmentIndex = this.continuousPlayer.currentSegmentIndex;
        const segment = this.continuousPlayer.currentEvent.segments[currentSegmentIndex];
        if (!segment) {
            notify(i18n[this.currentLanguage].noFilePath);
            return;
        }
    
        const activeCamera = this.multiCameraPlayer.activeCamera;
        const file = segment.files[activeCamera];
    
        // In Tauri desktop, open file explorer and select the file
        if (this.isTauri && file && file.path) {
            try {
                const tauri = window.__TAURI__;
                const shell = tauri.shell;
                
                // Detect OS and use appropriate command
                const platform = navigator.platform.toLowerCase();
                const isWindows = platform.includes('win');
                const isMac = platform.includes('mac');
                
                if (isWindows) {
                    // Windows: explorer /select,"path" - must be a single argument
                    const normalizedPath = file.path.replace(/\//g, '\\');
                    const command = shell.Command.create('explorer', [`/select,${normalizedPath}`]);
                    await command.execute();
                } else if (isMac) {
                    // macOS: open -R "path"
                    const command = shell.Command.create('open', ['-R', file.path]);
                    await command.execute();
                } else {
                    // Linux: xdg-open parent directory (can't select file directly)
                    const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
                    const command = shell.Command.create('xdg-open', [parentDir]);
                    await command.execute();
                }
                return;
            } catch (e) {
                console.error('Failed to reveal file in explorer:', e);
                // Fall through to show modal with path
            }
        }
        
        // Fallback: show modal with file path for easy copying
        // Prefer absolute path (file.path) if available, otherwise use webkitRelativePath
        const displayPath = file?.path || file?.webkitRelativePath;
        if (displayPath) {
            this.showFilePathModal(displayPath);
        } else {
            this.showToast(i18n[this.currentLanguage].noFilePath || "Could not determine file path for the active camera.", 'error');
        }
    }
    
    sizeFilePathInput() {
        const el = this.dom.filePathInput;
        el.style.height = 'auto';
        // scrollHeight excludes the border, which `box-sizing: border-box` still charges to the
        // height we set — leaving it out clips the last line by 2px.
        el.style.height = (el.scrollHeight + (el.offsetHeight - el.clientHeight)) + 'px';
    }

    showFilePathModal(filePath) {
        const translations = i18n[this.currentLanguage];
        this.dom.filePathModalTitle.textContent = translations.filePathAlertTitle;
        this.dom.filePathInput.value = filePath;
        this.dom.copySuccessHint.classList.remove('show');
        this.dom.filePathModal.style.display = 'flex';
        requestAnimationFrame(() => {
            this.sizeFilePathInput();
            this.dom.filePathModal.classList.add('show');
        });
        // Select the text for easy copying
        this.dom.filePathInput.select();
    }
    
    hideFilePathModal() {
        this.dom.filePathModal.classList.remove('show');
        setTimeout(() => {
            this.dom.filePathModal.style.display = 'none';
        }, 300);
    }
    
    async copyFilePath() {
        const filePath = this.dom.filePathInput.value;
        const translations = i18n[this.currentLanguage];
        try {
            await navigator.clipboard.writeText(filePath);
            this.dom.copySuccessHint.textContent = translations.copiedToClipboard;
            this.dom.copySuccessHint.classList.add('show');
            setTimeout(() => {
                this.dom.copySuccessHint.classList.remove('show');
            }, 2000);
        } catch (e) {
            // Fallback for older browsers
            this.dom.filePathInput.select();
            document.execCommand('copy');
            this.dom.copySuccessHint.textContent = translations.copiedToClipboard;
            this.dom.copySuccessHint.classList.add('show');
            setTimeout(() => {
                this.dom.copySuccessHint.classList.remove('show');
            }, 2000);
        }
    }

    async downloadCurrentFile() {
        if (this.blockedByPlayback()) {
            return;
        }

        const currentSegmentIndex = this.continuousPlayer.currentSegmentIndex;
        const segment = this.continuousPlayer.currentEvent.segments[currentSegmentIndex];
        if (!segment) {
            return;
        }

        const activeCamera = this.multiCameraPlayer.activeCamera;
        const file = segment.files[activeCamera];
        if (!file) {
            return;
        }

        if (window.__TAURI__) {
            if (isAndroidRuntime()) {
                try {
                    const dest = joinPath(ANDROID_DOWNLOAD_DIR, file.name || 'TeslaCam.mp4');
                    await window.__TAURI__.fs.copyFile(file.path, dest);
                    notifyMediaFile(dest);
                    this.showToast(`${i18n[this.currentLanguage].savedToDownloads}: ${dest}`, 'success');
                } catch (e) {
                    console.error('Android copy failed:', e);
                    this.showToast(String(e?.message || e), 'error');
                }
                return;
            }

            try {
                const invoke = window.__TAURI__.core?.invoke || window.__TAURI__.invoke || (window.__TAURI__.tauri && window.__TAURI__.tauri.invoke);
                if (!invoke) throw new Error('Tauri invoke not found');

                const defaultName = file.name || 'TeslaCam.mp4';
                const savePath = await invoke('plugin:dialog|save', {
                    options: {
                        defaultPath: defaultName,
                        filters: [{
                            name: 'Video',
                            extensions: ['mp4']
                        }]
                    }
                });

                const resolvedSavePath = typeof savePath === 'string' ? savePath : savePath?.path;
                if (!resolvedSavePath) {
                    return;
                }

                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Use Tauri fs plugin to write binary file
                const fs = window.__TAURI__.fs;
                if (fs && fs.writeFile) {
                    await fs.writeFile(resolvedSavePath, uint8Array);
                } else {
                    // Fallback to custom command
                    const bytes = Array.from(uint8Array);
                    await invoke('write_binary_file', {
                        path: resolvedSavePath,
                        bytes
                    });
                }

                this.showToast('保存成功!', 'success');
            } catch (e) {
                console.error('Tauri download failed:', e);
                const errorMsg = typeof e === 'string' ? e : (e.message || JSON.stringify(e));
                notify('保存失败: ' + errorMsg, 'error');
            }
            return;
        }

        const a = document.createElement('a');
        const url = getFileUrl(file);
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    
    /**
     * Clipping on a phone runs through the Kotlin MediaCodec engine: the page describes the wanted
     * output — which feeds, how big, what range — and never touches a frame, because the desktop
     * route for this is an FFmpeg sidecar that does not exist in the mobile bundle.
     */
    setupPhoneExportPanel() {
        const modal = document.getElementById('phoneExportModal');
        if (!modal) return;
        const dom = this.peDom = {
            modal,
            panel: modal.querySelector('.phone-export-panel'),
            cameras: document.getElementById('peCameraChips'),
            sizes: document.getElementById('peSizeChips'),
            layout: document.getElementById('peCanvas'),
            layoutHint: document.getElementById('peLayoutHint'),
            layoutReset: document.getElementById('peLayoutResetBtn'),
            previewBtn: document.getElementById('pePreviewBtn'),
            preview: document.getElementById('pePreviewCanvas'),
            previewCap: document.getElementById('pePreviewCap'),
            start: document.getElementById('peStartInput'),
            end: document.getElementById('peEndInput'),
            inBtn: document.getElementById('peSetInBtn'),
            outBtn: document.getElementById('peSetOutBtn'),
            marks: document.getElementById('peMarkList'),
            markName: document.getElementById('peMarkName'),
            markSave: document.getElementById('peMarkSaveBtn'),
            overlayChips: document.getElementById('peOverlayChips'),
            mosaic: document.getElementById('peMosaicEditor'),
            mosaicCams: document.getElementById('peMosaicCams'),
            mosaicCanvas: document.getElementById('peMosaicCanvas'),
            mosaicHint: document.getElementById('peMosaicHint'),
            mosaicClear: document.getElementById('peMosaicClearBtn'),
            range: document.querySelector('#phoneExportModal .pe-range'),
            // The panel owns the action row, `.pe-body` owns the scroll — see styles.css.
            body: modal.querySelector('.pe-body'),
            fromNow: document.getElementById('peFromNowBtn'),
            summary: document.getElementById('peSummary'),
            progress: document.getElementById('peProgress'),
            bar: document.getElementById('peProgressBar'),
            text: document.getElementById('peProgressText'),
            startBtn: document.getElementById('peStartBtn'),
            cancelBtn: document.getElementById('peCancelBtn'),
            closeBtn: document.getElementById('peCloseBtn'),
        };
        this.peSelection = {
            cameras: [], size: '720', layout: this.readExportLayout(),
            overlay: this.readExportOverlay(), mosaic: this.readExportMosaic(), mosaicCamera: '',
        };
        this.peJob = null;
        this.pePreviewOn = false;

        dom.overlayChips?.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-overlay]');
            if (!chip) return;
            this.peSelection.overlay[chip.dataset.overlay] = !this.peSelection.overlay[chip.dataset.overlay];
            this.saveExportOverlay();
            this.renderPhoneExportPanel();
        });
        dom.mosaicCams?.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-camera]');
            if (!chip) return;
            this.peSelection.mosaicCamera = chip.dataset.camera;
            this.renderPhoneExportPanel();
        });
        dom.mosaicClear?.addEventListener('click', () => {
            const camera = this.peMosaicCamera();
            if (!camera) return;
            delete this.peSelection.mosaic[camera];
            this.saveExportMosaic();
            this.renderPhoneExportPanel();
        });
        dom.mosaicCanvas?.addEventListener('pointerdown', (e) => this.onPeMosaicPointerDown(e));

        dom.cameras.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-camera]');
            if (!chip) return;
            const at = this.peSelection.cameras.indexOf(chip.dataset.camera);
            if (at >= 0) this.peSelection.cameras.splice(at, 1);
            else this.peSelection.cameras.push(chip.dataset.camera);
            this.renderPhoneExportPanel();
        });

        dom.sizes.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-size]');
            if (!chip) return;
            this.peSelection.size = chip.dataset.size;
            this.renderPhoneExportPanel();
        });

        dom.layout.addEventListener('pointerdown', (e) => this.onPeLayoutPointerDown(e));
        dom.previewBtn?.addEventListener('click', () => this.togglePhoneExportPreview());
        dom.layoutReset?.addEventListener('click', () => {
            this.peSelection.cameras.forEach(camera => { delete this.peSelection.layout[camera]; });
            this.saveExportLayout();
            this.renderPhoneExportPanel();
        });

        dom.fromNow.addEventListener('click', () => {
            const controls = this.videoControls;
            const now = this.continuousPlayer.getCurrentTime();
            controls.clipStartTime = now;
            controls.clipEndTime = Math.min(controls.totalDuration || now + 30, now + 30);
            controls.updateClipSelection();
            this.renderPhoneExportPanel();
        });

        // Trim in/out on the playhead, the way an editor does it: one button sets the start and
        // leaves the end alone, the other closes the range. `fromNow` above stays, because a user
        // who wants "the next half minute" should not have to press two buttons and count.
        const setEdge = (which) => {
            const controls = this.videoControls;
            const total = controls.totalDuration || 0;
            const at = Math.max(0, Math.min(this.continuousPlayer.getCurrentTime(), total || Infinity));
            if (which === 'in') {
                // Parked at the very end, an in-point would push the out past the clip, so leave
                // the minimum span room for it inside the file.
                controls.clipStartTime = Math.min(at, Math.max(0, (total || 0.2) - 0.2));
                controls.clipEndTime = Math.max(controls.clipStartTime + 0.2,
                    Math.min(controls.clipEndTime || at + 30, total || at + 30));
            } else {
                controls.clipEndTime = Math.max((controls.clipStartTime || 0) + 0.2, at);
            }
            controls.updateClipSelection();
            this.renderPhoneExportPanel();
        };
        dom.inBtn?.addEventListener('click', () => setEdge('in'));
        dom.outBtn?.addEventListener('click', () => setEdge('out'));
        dom.markSave?.addEventListener('click', () => this.saveClipMark());
        dom.markName?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveClipMark();
            }
        });
        dom.marks?.addEventListener('click', (e) => {
            // The delete button sits inside the row, so the nearest target wins or a removal also
            // re-applies the range it was just about to forget.
            const del = e.target.closest('[data-mark-del]');
            if (del) {
                this.deleteClipMark(Number(del.dataset.markDel));
                return;
            }
            const go = e.target.closest('[data-mark-export]');
            if (go) {
                this.applyClipMark(Number(go.dataset.markExport), true);
                return;
            }
            const apply = e.target.closest('[data-mark]');
            if (apply) this.applyClipMark(Number(apply.dataset.mark), false);
        });

        const commitRange = () => {
            const controls = this.videoControls;
            const total = controls.totalDuration || 0;
            const from = this.parseClockInput(dom.start.value);
            const to = this.parseClockInput(dom.end.value);
            // A half-typed range is normal while editing, so leave it alone rather than fight the
            // keyboard; the plan reports it as a bad range if export is pressed anyway.
            if (from === null || to === null) return;
            if (to <= from || from >= total) {
                // But a *complete* range that cannot be built has to snap back: leaving the field
                // showing what the user typed means the sheet displays a selection the plan is
                // not using, and the summary line quietly disagrees with it.
                this.renderPhoneExportPanel();
                this.showToast(i18n[this.currentLanguage].peExportBadRange, 'error', 3000);
                return;
            }
            controls.clipStartTime = Math.max(0, Math.min(from, total));
            controls.clipEndTime = Math.max(controls.clipStartTime + 0.2, Math.min(to, total));
            controls.updateClipSelection();
            this.renderPhoneExportPanel();
        };
        dom.start.addEventListener('change', commitRange);
        dom.end.addEventListener('change', commitRange);

        // Chromium scrolls the *document* to reveal a focused field, and the document does not
        // scroll here — the sheet does. Without this the row you are typing into ends up below the
        // fold behind the keyboard in landscape.
        let liftedField = null;
        const scroller = dom.body || dom.panel;
        const scrollInto = () => {
            const field = liftedField;
            if (!field || !scroller.contains(field)) return;
            const box = scroller.getBoundingClientRect();
            const at = field.getBoundingClientRect();
            if (at.bottom <= box.bottom - 8) return;
            // Park the row near the *top* of the sheet rather than just clearing the bottom
            // edge, so it survives being pushed down again.
            scroller.scrollTop += at.top - box.top - 12;
        };
        // The re-check has to be driven by the panel, not by a timer: the native IME inset is what
        // shrinks the sheet, and on the emulator it landed after the last timed pass had already
        // given up, leaving the field you are typing in outside the visible panel.
        if (typeof ResizeObserver !== 'undefined') {
            this.phoneExportLiftObserver?.disconnect();
            this.phoneExportLiftObserver = new ResizeObserver(scrollInto);
            this.phoneExportLiftObserver.observe(dom.panel);
            if (scroller !== dom.panel) this.phoneExportLiftObserver.observe(scroller);
        }
        dom.panel.addEventListener('focusin', (e) => {
            if (!e.target.classList?.contains('pe-time')) return;
            liftedField = e.target;
            requestAnimationFrame(scrollInto);
        });
        dom.panel.addEventListener('focusout', () => { liftedField = null; });

        // The steppers write the selection directly rather than going through the text fields, so
        // they stay usable while the soft keyboard is hiding those fields.
        dom.range.addEventListener('click', (e) => {
            const nudge = e.target.closest('.pe-nudge');
            if (!nudge) return;
            const controls = this.videoControls;
            const total = controls.totalDuration || 0;
            const delta = Number(nudge.dataset.delta) || 0;
            const span = Math.min(0.2, total * 0.5);
            if (nudge.dataset.range === 'start') {
                const at = Math.max(0, Math.min(total, (controls.clipStartTime || 0) + delta));
                controls.clipStartTime = Math.max(0, Math.min(at, (controls.clipEndTime || 0) - span));
            } else {
                const at = Math.max(0, Math.min(total, (controls.clipEndTime || 0) + delta));
                controls.clipEndTime = Math.min(total, Math.max(at, (controls.clipStartTime || 0) + span));
            }
            controls.updateClipSelection();
            this.renderPhoneExportPanel();
        });

        dom.startBtn.addEventListener('click', () => this.startPhoneExport());
        dom.cancelBtn.addEventListener('click', () => {
            if (this.peJob) this.cancelPhoneExport(); else this.hidePhoneExportModal();
        });
        dom.closeBtn.addEventListener('click', () => this.hidePhoneExportModal());
        dom.modal.addEventListener('click', (e) => {
            if (e.target === dom.modal) this.hidePhoneExportModal();
        });

        // The native side pushes progress here; it is a plain function reference, so a rebuild of
        // the panel can never leave a stale listener behind.
        window.__tdashcamExportProgress = (payload) => this.onPhoneExportProgress(payload);
    }

    parseClockInput(value) {
        const parts = String(value || '').trim().split(':').map(p => Number(p));
        if (!parts.length || parts.some(n => !Number.isFinite(n) || n < 0)) return null;
        return parts.reduce((total, n) => total * 60 + n, 0);
    }

    phoneExportCameras() {
        const order = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
        const event = this.currentEvent || this.continuousPlayer.currentEvent;
        if (!event || !event.segments) return [];
        const present = new Set();
        event.segments.forEach(segment => {
            Object.keys(segment.files || {}).forEach(camera => present.add(camera));
        });
        return order.filter(camera => present.has(camera));
    }

    phoneExportLabel(camera) {
        const translations = i18n[this.currentLanguage];
        return translations[camera.replace(/_(\w)/g, (_, c) => c.toUpperCase())] || camera;
    }

    /** 1x1, 1x2, 1x3, 2x2, then 2x3 for five and six — the same shape the on-screen grid uses. */
    phoneExportGrid(count) {
        if (count <= 1) return { rows: 1, cols: 1 };
        if (count === 2) return { rows: 1, cols: 2 };
        if (count === 3) return { rows: 1, cols: 3 };
        if (count === 4) return { rows: 2, cols: 2 };
        return { rows: 2, cols: 3 };
    }

    /**
     * That grid as placement boxes: fractions of the frame, with `y` measured **down from the
     * top** because that is how a DOM box is specified and how the native side converts it. The
     * engine still receives `rows`/`cols`, so a box-less request composites exactly as before.
     */
    phoneExportSlots(count) {
        const { rows, cols } = this.phoneExportGrid(count);
        return Array.from({ length: count }, (_, index) => ({
            x: (index % cols) / cols,
            y: Math.floor(index / cols) / rows,
            w: 1 / cols,
            h: 1 / rows,
        }));
    }

    /**
     * Where each selected view goes. A saved box wins; a camera without one takes its grid slot,
     * so adding the sixth view to a layout drawn for five does not leave a hole in the frame.
     */
    peRects() {
        const slots = this.phoneExportSlots(this.peSelection.cameras.length);
        const layout = this.peSelection.layout || {};
        return this.peSelection.cameras.map((camera, index) => {
            const saved = layout[camera];
            return saved && saved.w > 0 && saved.h > 0 ? saved : slots[index];
        });
    }

    /**
     * A layout is worth keeping between events — the PiP corner you set up once is the one you
     * want next time — but only the boxes for views that still exist, so the stored map can never
     * grow stale entries into the frame.
     */
    readExportLayout() {
        try {
            const stored = JSON.parse(localStorage.getItem('tdashcam.exportLayout') || '{}');
            const layout = {};
            Object.keys(stored).forEach(camera => {
                const box = stored[camera];
                if (!Array.isArray(box) || box.length !== 4) return;
                const [x, y, w, h] = box.map(Number);
                if ([x, y, w, h].some(n => !Number.isFinite(n)) || w <= 0 || h <= 0) return;
                layout[camera] = { x, y, w, h };
            });
            return layout;
        } catch (e) {
            return {};
        }
    }

    saveExportLayout() {
        try {
            const out = {};
            Object.keys(this.peSelection.layout).forEach(camera => {
                const box = this.peSelection.layout[camera];
                out[camera] = [box.x, box.y, box.w, box.h].map(n => Math.round(n * 1e4) / 1e4);
            });
            localStorage.setItem('tdashcam.exportLayout', JSON.stringify(out));
        } catch (e) {
            console.warn('[export] layout not saved:', e);
        }
    }

    peOverlaps(rects) {
        let hits = 0;
        for (let i = 0; i < rects.length; i += 1) {
            for (let j = i + 1; j < rects.length; j += 1) {
                const width = Math.min(rects[i].x + rects[i].w, rects[j].x + rects[j].w)
                    - Math.max(rects[i].x, rects[j].x);
                const height = Math.min(rects[i].y + rects[i].h, rects[j].y + rects[j].h)
                    - Math.max(rects[i].y, rects[j].y);
                if (width > 0.005 && height > 0.005) hits += 1;
            }
        }
        return hits;
    }

    /**
     * The frame this view's export begins on: the first file the selected range reaches, a
     * quarter-second into it. The same numbers the engine is handed, so the picture the sheet shows
     * is the picture the file opens with rather than a keyframe from the top of the clip.
     */
    peFrameTarget(camera) {
        const event = this.currentEvent || this.continuousPlayer.currentEvent;
        const controls = this.videoControls;
        if (!event || !event.segments || !controls) return null;
        const from = controls.clipStartTime || 0;
        const to = Math.max(from + 0.2, controls.clipEndTime || from + 1);
        const segment = this.phoneExportSegments(event, camera, from, to)[0];
        if (!segment) return null;
        return { path: segment.path, seconds: segment.clipStartUs / 1e6 + 0.25 };
    }

    /** A base64 JPEG from the retriever is the only thing safe to put into an attribute. */
    peFrameIsImage(url) {
        return typeof url === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(url);
    }

    /**
     * Fill the tiles the retriever has not answered yet. They come in two at a time on purpose
     * (see `FrameFetcher.MAX_LIVE`): the sheet is open on top of a playing event, and the phone's
     * hardware decoder slots are shared with it.
     */
    peFillTileFrames() {
        const canvas = this.peDom.layout;
        if (!canvas) return;
        canvas.querySelectorAll('.pe-tile').forEach((tile) => {
            if (tile.querySelector('.pe-tile-img')) return;
            const camera = tile.dataset.camera;
            const target = this.peFrameTarget(camera);
            if (!target) return;
            FrameFetcher.get(target.path, target.seconds, PHONE_EXPORT_FRAME_W).then((url) => {
                // `isConnected` is the whole staleness check: a re-render during the fetch replaced
                // this node, and the detached one belongs to no layout anyone is looking at.
                if (!this.peFrameIsImage(url) || !tile.isConnected) return;
                if (tile.querySelector('.pe-tile-img')) return;
                const img = document.createElement('img');
                img.className = 'pe-tile-img';
                img.alt = '';
                img.src = url;
                tile.insertBefore(img, tile.firstChild);
            });
        });
    }

    /**
     * The other view a box is sitting on top of, by whichever covers the most of it. With
     * `peersOnly` the answer is limited to views of comparable size — a small box parked inside a
     * big one is a corner window the user placed on purpose, not something to trade or push.
     */
    peBiggestOverlap(rects, index, peersOnly) {
        const a = rects[index];
        let best = 0;
        let target = -1;
        rects.forEach((rect, i) => {
            if (i === index) return;
            const width = Math.min(a.x + a.w, rect.x + rect.w) - Math.max(a.x, rect.x);
            const height = Math.min(a.y + a.h, rect.y + rect.h) - Math.max(a.y, rect.y);
            if (width <= 0.005 || height <= 0.005) return;
            if (peersOnly) {
                const ratio = (a.w * a.h) / Math.max(1e-6, rect.w * rect.h);
                if (ratio < 0.55 || ratio > 1.8) return;
            }
            const cover = width * height;
            if (cover > best) { best = cover; target = i; }
        });
        return target;
    }

    /**
     * Settle a drop so two views of comparable size never end up on top of each other.
     *
     * Dropped onto a peer: the two **trade places** — "move this one over there" means the view
     * that was there comes back, which is what a grid is for, and stacking two same-sized views
     * only ever hides one of them. The displaced view goes to the hole the drag opened at the
     * start of the gesture, so a drop dead-centre on another view still separates them instead of
     * swapping a box onto the identical coordinates it already had.
     *
     * A view under about half the area of another is a corner window, not a peer: picture-in-picture
     * is the one thing an overlap is genuinely for, so that overlap stays. What is left after the
     * trades is pushed out along whichever axis penetrates least, so a release can never leave a
     * sliver of one view covering another.
     */
    peSettleDrop(rects, index, origin) {
        const sameSize = (a, b) => Math.abs(a.w - b.w) < 0.02 && Math.abs(a.h - b.h) < 0.02;
        const place = (box, at) => ({
            w: box.w,
            h: box.h,
            x: Math.max(0, Math.min(1 - box.w, at.x - box.w / 2)),
            y: Math.max(0, Math.min(1 - box.h, at.y - box.h / 2)),
        });
        // Where the displaced view goes. After the first trade the hole is wherever this view just
        // stood, so a drop that displaces two views rotates all three instead of piling them up.
        let vacancy = { x: origin.x + origin.w / 2, y: origin.y + origin.h / 2 };
        for (let pass = 0; pass <= rects.length; pass += 1) {
            const moved = rects[index];
            const target = this.peBiggestOverlap(rects, index, true);
            if (target < 0) break;
            const other = rects[target];
            const landing = { x: other.x + other.w / 2, y: other.y + other.h / 2 };
            const originPoint = { x: vacancy.x, y: vacancy.y };
            // Two grid-sized boxes hand their slots over exactly; anything else keeps its own size
            // and takes the other's centre, because inflating a hand-sized box to the full-width
            // one it was dropped on would redraw a layout the user never drew.
            if (sameSize(moved, other)) {
                rects[index] = { x: other.x, y: other.y, w: moved.w, h: moved.h };
                rects[target] = { x: Math.max(0, Math.min(1 - other.w, originPoint.x - other.w / 2)),
                    y: Math.max(0, Math.min(1 - other.h, originPoint.y - other.h / 2)),
                    w: other.w, h: other.h };
            } else {
                rects[target] = place(other, originPoint);
                rects[index] = place(moved, landing);
            }
            vacancy = { x: moved.x + moved.w / 2, y: moved.y + moved.h / 2 };
        }
        this.pePushApart(rects, index);
    }

    /**
     * Slide the dropped view out of whatever it still touches, along the shallower of the two
     * axes and away from the neighbour — the least the finger can be contradicted by.
     */
    pePushApart(rects, index) {
        for (let pass = 0; pass < rects.length; pass += 1) {
            const target = this.peBiggestOverlap(rects, index, true);
            if (target < 0) return;
            const a = rects[index];
            const b = rects[target];
            const outX = Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
            const outY = Math.min(a.y + a.h - b.y, b.y + b.h - a.y);
            if (outX <= outY) {
                const left = a.x + a.w / 2 < b.x + b.w / 2;
                a.x = Math.max(0, Math.min(1 - a.w, left ? b.x - a.w : b.x + b.w));
            } else {
                const up = a.y + a.h / 2 < b.y + b.h / 2;
                a.y = Math.max(0, Math.min(1 - a.h, up ? b.y - a.h : b.y + b.h));
            }
        }
    }

    /**
     * The composite, drawn to its own aspect so what is dragged is what gets encoded, with each
     * view's real opening frame inside its box. Views paint in selection order; a drop onto a view
     * of similar size trades the two places over (`peSettleDrop`), so what is left overlapping is
     * either a deliberate corner window or a resized box — which is why the hint counts them
     * instead of blocking the gesture.
     */
    renderPhoneExportLayout(plan) {
        const canvas = this.peDom.layout;
        if (!canvas) return;
        // No plan means nothing to place yet (or a range the engine could not build), and a preview
        // of a frame that will not be encoded is worse than no preview. One view fills the frame
        // whatever you drag, so there is nothing to edit either — the sheet shows the numbers
        // instead of a box that refuses to move.
        const group = canvas.closest('.pe-group');
        const show = !this.peJob && !plan.error && this.peSelection.cameras.length > 1;
        if (group) group.style.display = show ? '' : 'none';
        if (!show) {
            canvas.textContent = '';
            this.pePreviewOn = false;
            if (this.peDom.preview) this.peDom.preview.style.display = 'none';
            if (this.peDom.previewCap) this.peDom.previewCap.style.display = 'none';
            return;
        }
        // The frame the engine encodes, as a CSS box: the preview has to be the same shape or a
        // square drawn here comes out wide in the file. The same ratio goes to styles.css twice —
        // once as the box's own ratio, once as the max width that keeps it inside the sheet.
        const ratio = plan.width && plan.height ? plan.width / plan.height : 16 / 9;
        canvas.style.aspectRatio = `${ratio}`;
        canvas.style.setProperty('--pe-aspect', String(ratio));

        const rects = this.peRects();
        const html = this.peSelection.cameras.map((camera, index) => {
            const box = rects[index];
            const target = this.peFrameTarget(camera);
            const cached = target && FrameFetcher.peek(target.path, target.seconds, PHONE_EXPORT_FRAME_W);
            return `<div class="pe-tile" data-camera="${camera}" style="left:${box.x * 100}%;top:${box.y * 100}%`
                + `;width:${box.w * 100}%;height:${box.h * 100}%">`
                // `contain`, not `cover`: the engine letterboxes each view inside its box instead of
                // cropping evidence, so the tile has to show the black bars it will really encode.
                + (this.peFrameIsImage(cached) ? `<img class="pe-tile-img" src="${cached}" alt="">` : '')
                + `<span class="pe-tile-name">${this.phoneExportLabel(camera)}</span>`
                + `<span class="pe-tile-size">${Math.round(box.w * plan.width)}×${Math.round(box.h * plan.height)}</span>`
                + `<span class="pe-tile-grip" aria-hidden="true"></span></div>`;
        }).join('');
        if (canvas.innerHTML !== html) canvas.innerHTML = html;
        this.peFillTileFrames();

        const overlaps = this.peOverlaps(rects);
        const translations = i18n[this.currentLanguage];
        this.peDom.layoutHint.textContent = overlaps
            ? translations.peLayoutOverlap.replace('{n}', overlaps)
            : translations.peLayoutHint;
        const reset = this.peDom.layoutReset;
        if (reset) {
            const layout = this.peSelection.layout || {};
            const slots = this.phoneExportSlots(this.peSelection.cameras.length);
            const custom = this.peSelection.cameras.some((camera, index) => {
                const saved = layout[camera];
                return saved && ['x', 'y', 'w', 'h'].some(key => Math.abs(saved[key] - slots[index][key]) > 0.005);
            });
            reset.style.visibility = custom ? 'visible' : 'hidden';
        }
        // The preview is a picture of this same plan, so it redraws with it: a drag, a new range, a
        // different preset all move the boxes it has to compose.
        if (this.pePreviewOn) this.drawPhoneExportPreview(plan);
    }

    /**
     * One pointer down, then the tile owns the gesture until it ends. The box is written straight
     * to the element during the drag rather than through `renderPhoneExportPanel`, which would
     * rebuild the very node the pointer is captured on and drop the capture; the full re-render
     * happens once, on release.
     */
    onPeLayoutPointerDown(event) {
        const canvas = this.peDom.layout;
        const tile = event.target.closest('.pe-tile');
        if (!canvas || !tile || this.peJob) return;
        const camera = tile.dataset.camera;
        const index = this.peSelection.cameras.indexOf(camera);
        if (index < 0) return;

        const resize = event.target.classList.contains('pe-tile-grip');
        const box = canvas.getBoundingClientRect();
        const from = { ...this.peRects()[index] };
        const origin = { x: event.clientX, y: event.clientY };
        const min = 0.06;
        let current = from;
        let frame = 0;

        const paint = () => {
            tile.style.left = `${current.x * 100}%`;
            tile.style.top = `${current.y * 100}%`;
            tile.style.width = `${current.w * 100}%`;
            tile.style.height = `${current.h * 100}%`;
            const label = tile.querySelector('.pe-tile-size');
            const plan = this.phoneExportPlan();
            if (label && plan.width) {
                label.textContent = `${Math.round(current.w * plan.width)}×${Math.round(current.h * plan.height)}`;
            }
        };

        const move = (e) => {
            const dx = (e.clientX - origin.x) / (box.width || 1);
            const dy = (e.clientY - origin.y) / (box.height || 1);
            const next = { ...from };
            if (resize) {
                next.w = Math.max(min, Math.min(1 - from.x, from.w + dx));
                next.h = Math.max(min, Math.min(1 - from.y, from.h + dy));
            } else {
                next.x = Math.max(0, Math.min(1 - from.w, from.x + dx));
                next.y = Math.max(0, Math.min(1 - from.h, from.y + dy));
            }
            current = next;
            // One paint per frame: a 60Hz pointer stream and a layout-label write are not a match,
            // and the sheet is scrolling behind it.
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(paint);
        };

        const end = () => {
            if (frame) cancelAnimationFrame(frame);
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', end);
            document.removeEventListener('pointercancel', end);
            // Materialise every box: a view with no saved box takes its slot *by position*, so
            // leaving a view unsaved only means anything while its index is the one that slot was
            // read for.
            const rects = this.peRects().map(rect => ({ ...rect }));
            rects[index] = current;
            // Dropped on top of a view of comparable size? Then they trade places rather than
            // overlap — the point of dragging one feed onto another is that the other one moves.
            // A resize is exempt: growing a box over a neighbour is how a corner window is made,
            // and the view underneath would have somewhere else to go only by the user's hand.
            if (!resize) this.peSettleDrop(rects, index, from);
            // The dragged view goes last, so a box that does end up overlapping ends up on top of
            // what it covers — the same rule every other layered surface on a phone follows.
            const placed = this.peSelection.cameras.map((cam, i) => ({ cam, rect: rects[i] }));
            this.peSelection.cameras.splice(index, 1);
            this.peSelection.cameras.push(camera);
            // ...and the reorder happens *before* the layout is written, against the slots the
            // views now actually get. Writing it against the old indices left a view that never
            // moved unpinned, and on the next read its slot belonged to a different index — which
            // is how a settled, non-overlapping drop came back as an overlap.
            const slots = this.phoneExportSlots(this.peSelection.cameras.length);
            this.peSelection.cameras.forEach((cam, i) => {
                const rect = placed.find(entry => entry.cam === cam).rect;
                const slot = slots[i];
                // A box still sitting on its own grid slot is not a customisation, and recording it
                // as one would freeze the whole layout at this camera count: deselect a view later
                // and the rest would keep their old fractions instead of re-flowing into the grid
                // the new count asks for.
                if (slot && ['x', 'y', 'w', 'h'].every(key => Math.abs(rect[key] - slot[key]) < 0.005)) {
                    delete this.peSelection.layout[cam];
                } else {
                    this.peSelection.layout[cam] = rect;
                }
            });
            this.saveExportLayout();
            this.renderPhoneExportPanel();
        };

        document.addEventListener('pointermove', move, { passive: true });
        document.addEventListener('pointerup', end);
        document.addEventListener('pointercancel', end);
        event.preventDefault();
    }

    togglePhoneExportPreview() {
        this.pePreviewOn = !this.pePreviewOn;
        const dom = this.peDom;
        dom.previewBtn?.classList.toggle('on', this.pePreviewOn);
        if (dom.preview) dom.preview.style.display = this.pePreviewOn ? '' : 'none';
        if (dom.previewCap) dom.previewCap.style.display = this.pePreviewOn ? '' : 'none';
        if (!this.pePreviewOn) {
            // Drop the in-flight redraw guard: whatever the retriever answers next has no picture
            // it is allowed to paint into any more.
            this.pePreviewSeq = (this.pePreviewSeq || 0) + 1;
            return;
        }
        this.drawPhoneExportPreview(this.phoneExportPlan());
        // The sheet scrolls, not the page, and the picture appears under the editor you were just
        // dragging — so it is scrolled into view rather than left below the fold.
        requestAnimationFrame(() => dom.preview?.scrollIntoView({ block: 'nearest' }));
    }

    /**
     * The first frame of the file that is about to be written, composed from the same boxes the
     * engine is handed. Cheap insurance: a wrong layout costs a minute of encoding and a file to
     * delete, and here it costs one look before pressing 开始导出.
     */
    drawPhoneExportPreview(plan, retry) {
        const canvas = this.peDom.preview;
        if (!canvas) return;
        if (plan.error) {
            this.peDom.previewCap.textContent = plan.error;
            return;
        }
        // The encoder's own numbers are what matters, but a six-view 源 layout asks for a canvas no
        // WebView wants to allocate, so the composite is drawn at the same ratio, just smaller.
        const scale = Math.min(1, 720 / Math.max(plan.width, plan.height));
        canvas.width = Math.max(16, Math.round(plan.width * scale));
        canvas.height = Math.max(16, Math.round(plan.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const rects = this.peRects();
        const pending = [];
        let missing = 0;
        this.peSelection.cameras.forEach((camera, index) => {
            const target = this.peFrameTarget(camera);
            if (!target) { missing += 1; return; }
            const url = FrameFetcher.peek(target.path, target.seconds, PHONE_EXPORT_FRAME_W);
            if (!this.peFrameIsImage(url)) {
                missing += 1;
                pending.push(FrameFetcher.get(target.path, target.seconds, PHONE_EXPORT_FRAME_W));
                return;
            }
            const img = this.peFrameImage(url);
            if (!img.complete || !img.naturalWidth) { missing += 1; return; }
            const box = rects[index];
            const area = { x: box.x * canvas.width, y: box.y * canvas.height,
                w: box.w * canvas.width, h: box.h * canvas.height };
            // Contained, like the engine: the view keeps its proportions inside its box and the
            // remainder is black in the file, so it is black here too. Painting a cropped, stretched
            // preview would hide exactly the letterboxing this preview exists to show.
            const fit = Math.min(area.w / img.naturalWidth, area.h / img.naturalHeight);
            const dw = img.naturalWidth * fit;
            const dh = img.naturalHeight * fit;
            const paint = { x: area.x + (area.w - dw) / 2, y: area.y + (area.h - dh) / 2, w: dw, h: dh };
            ctx.drawImage(img, paint.x, paint.y, paint.w, paint.h);
            this.pePaintPreviewMosaic(canvas, ctx, paint, this.peMosaicBoxes(camera));
        });

        this.pePaintPreviewCaption(ctx, canvas);
        const translations = i18n[this.currentLanguage];
        this.peDom.previewCap.textContent = missing
            ? translations.pePreviewBusy
            : translations.pePreviewCaption
                .replace('{t}', this.videoControls.formatTime(this.videoControls.clipStartTime || 0))
                .replace('{w}', plan.width)
                .replace('{h}', plan.height);

        if (!pending.length) return;
        // One guard per draw: a drag that lands while the retriever is still working has already
        // queued its own pass, and the older one must not paint boxes that no longer exist.
        // `retry` bounds the chain — a frame the retriever will not answer must not turn the
        // caption's 正在取帧 into a redraw loop.
        const seq = this.pePreviewSeq = (this.pePreviewSeq || 0) + 1;
        if (retry) return;
        Promise.all(pending).then(() => {
            if (seq === this.pePreviewSeq && this.pePreviewOn) {
                this.drawPhoneExportPreview(this.phoneExportPlan(), true);
            }
        });
    }

    /**
     * The same block the shader snaps to: it works out of the view's *picture*, not its cell, so a
     * box that hides a plate still hides it after the tile moves. Downscaling into a scratch canvas
     * and painting it back with smoothing off is the cheapest way to say the same thing in 2D.
     */
    pePaintPreviewMosaic(canvas, ctx, picture, boxes) {
        if (!boxes.length) return;
        const block = picture.h / PE_MOSAIC_BLOCK_DIVISOR;
        if (!(block > 0)) return;
        const scratch = this.peMosaicScratch ??= document.createElement('canvas');
        const sctx = scratch.getContext('2d');
        boxes.forEach(box => {
            const x = picture.x + box[0] * picture.w;
            const y = picture.y + box[1] * picture.h;
            const w = box[2] * picture.w;
            const h = box[3] * picture.h;
            const columns = Math.max(1, Math.round(w / block));
            const rows = Math.max(1, Math.round(h / block));
            scratch.width = columns;
            scratch.height = rows;
            sctx.drawImage(canvas, x, y, w, h, 0, 0, columns, rows);
            const smoothing = ctx.imageSmoothingEnabled;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(scratch, 0, 0, columns, rows, x, y, w, h);
            ctx.imageSmoothingEnabled = smoothing;
        });
    }

    /**
     * The stamp line as the engine will lay it out — same corner, same fraction of the width, same
     * translucent box — so 「预览帧」 shows what the file carries rather than a prettier guess.
     */
    pePaintPreviewCaption(ctx, canvas) {
        const captions = this.phoneExportCaptions();
        if (!captions.length || captions[0].us > 0) return;
        const lines = captions[0].text.split('\n').filter(line => line.length);
        if (!lines.length) return;
        const plan = this.phoneExportPlan();
        const frameWidth = plan.width || canvas.width;
        const stripWidth = Math.min(frameWidth, PE_CAPTION_STRIP_WIDTH);
        const textSize = Math.min(64, Math.max(14, stripWidth * PE_CAPTION_TEXT_FRACTION))
            * (canvas.width / frameWidth);
        const lineHeight = textSize * PE_CAPTION_LINE_HEIGHT;
        const padX = textSize * 0.35;
        const padY = textSize * 0.18;
        ctx.font = `${textSize}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'alphabetic';
        const right = canvas.width * (1 - PE_CAPTION_MARGIN * 2) - padX;
        let at = canvas.height * PE_CAPTION_MARGIN * 2 + padY + textSize * 0.8;
        lines.forEach(text => {
            const metrics = ctx.measureText(text);
            const boxTop = at - (metrics.actualBoundingBoxAscent || textSize * 0.75) - padY * 0.5;
            const boxBottom = at + (metrics.actualBoundingBoxDescent || textSize * 0.2) + padY * 0.5;
            const boxLeft = right - metrics.width - padX;
            const boxWidth = padX * 2 + metrics.width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(boxLeft, boxTop, boxWidth, boxBottom - boxTop, textSize * 0.18);
                ctx.fill();
            } else {
                ctx.fillRect(boxLeft, boxTop, boxWidth, boxBottom - boxTop);
            }
            ctx.fillStyle = '#fff';
            ctx.fillText(text, right, at);
            at += lineHeight;
        });
        ctx.textAlign = 'start';
    }

    /** `drawImage` needs a decoded bitmap, and a data URL only promises one asynchronously. */
    peFrameImage(url) {
        this.peFrameImages ??= new Map();
        let img = this.peFrameImages.get(url);
        if (img) return img;
        img = new Image();
        img.onload = () => {
            if (this.pePreviewOn) this.drawPhoneExportPreview(this.phoneExportPlan());
        };
        img.src = url;
        // The entries are keyed by a base64 blob, so they are the expensive thing here; a new range
        // or event makes every one of them worthless at once.
        if (this.peFrameImages.size > 16) this.peFrameImages.clear();
        this.peFrameImages.set(url, img);
        return img;
    }

    /**
     * A preset names the short edge of **one view**; the frame grows with the grid. Pinning the
     * whole frame instead is what made the fourth view expensive: "720p" with six cameras produced
     * a 1920x720 file whose cells were 640x360 — less picture per view than the 480p preset.
     *
     * Both dims go to a multiple of 16. A codec that is asked for 1350 rows encodes 1360 and has to
     * tell the container to trim the extra ten, and while most devices do, the ones that forget put
     * a smeared band along the bottom and stretch the picture by that fraction — which is precisely
     * the 「压扁」 this file is not allowed to have. Sizing the frame on the grid costs nothing:
     * every cell is *contained*, so a few pixels of extra frame become a few pixels of black bar.
     */
    /**
     * The dashcam never records above 1080 per view, so a 4K preset was a promise the source cannot
     * fill: it only made the frame bigger and the encode slower. A clip mark saved while that preset
     * still existed is read back as `源` rather than as a size nobody can pick any more.
     */
    peSizeKey() {
        return PE_SIZE_PRESETS.includes(this.peSelection.size) ? this.peSelection.size : 'source';
    }

    phoneExportSize(source, rows, cols) {
        const align = (n) => Math.max(16, Math.round(n / 16) * 16);
        const short = this.peSizeKey() === 'source'
            ? Math.min(source.width, source.height)
            : parseInt(this.peSizeKey(), 10);
        const aspect = source.width / source.height;
        const cell = aspect >= 1
            ? { width: short * aspect, height: short }
            : { width: short, height: short / aspect };
        return this.phoneExportFit(align(cell.width * cols), align(cell.height * rows));
    }

    /**
     * How large a frame the phone will encode is a property of the device, so the codec list is
     * asked instead of guessed: `源` across six views is 5760x2160, which no mobile hardware block
     * takes. Whether to insist on hardware is read from the device too — an emulator only has the
     * software codec, and holding its frame down to what a hardware block would accept buys
     * nothing, while on a phone that insists quietly hands the job to software and takes minutes.
     *
     * The steps are not a fixed handful: 6-way 4K is 12288x4320, which needs eleven halvings of 0.8
     * before a mobile block takes it, and stopping early is what made the big presets simply fail.
     * Each pass asks the codecs again, so the loop leaves as soon as anything accepts the size.
     */
    phoneExportFit(width, height) {
        const align = (n) => Math.max(16, Math.round(n / 16) * 16);
        const ideal = width;
        const picky = this.phoneExportEncoderKind(1280, 720) === 'hardware';
        for (let step = 0; step < 14; step++) {
            const kind = this.phoneExportEncoderKind(width, height);
            if (!kind || kind === 'hardware' || (kind === 'software' && !picky)) break;
            width = align(width * 0.8);
            height = align(height * 0.8);
            if (width <= 16 && height <= 16) break;
        }
        return { width, height, capped: width < ideal };
    }

    /** 'hardware' | 'software' | 'none', or null when there is no native bridge to ask. */
    phoneExportEncoderKind(width, height) {
        const native = window.TDashcamNative;
        if (typeof native?.exportCodecReport !== 'function') return null;
        // What a device's codecs accept does not change while the app is open, and the drag handler
        // re-plans the frame on every animation frame — one synchronous bridge crossing per probe,
        // up to fourteen per `phoneExportFit`, is enough to make the tile stutter behind the finger.
        this.peCodecKindCache ??= new Map();
        const key = `${width}x${height}`;
        const cached = this.peCodecKindCache.get(key);
        if (cached !== undefined) return cached;
        const kind = this.probeEncoderKind(native, width, height);
        this.peCodecKindCache.set(key, kind);
        return kind;
    }

    probeEncoderKind(native, width, height) {
        let text = '';
        try {
            // The call has to stay attached to the bridge object — a saved reference throws
            // "Java bridge method can't be invoked on a non-injected object", and catching that as
            // `null` silently disabled the size clamp below.
            text = String(native.exportCodecReport(width, height) || '');
        } catch (e) {
            return null;
        }
        const names = (text.split('encoders=')[1] || '')
            .split(/[,;]/).map((name) => name.trim()).filter(Boolean);
        if (!names.length) return 'none';
        return names.some((name) => !name.includes('.android.') && !name.includes('google'))
            ? 'hardware' : 'software';
    }

    phoneExportPlan() {
        const translations = i18n[this.currentLanguage];
        const controls = this.videoControls;
        const event = this.currentEvent || this.continuousPlayer.currentEvent;
        if (!event || !event.segments) return { error: translations.noMetadata };
        const from = controls.clipStartTime;
        const to = controls.clipEndTime;
        if (from === null || from === undefined || to === null || to === undefined || to <= from) {
            return { error: translations.peExportBadRange };
        }
        const { rows, cols } = this.phoneExportGrid(this.peSelection.cameras.length);
        const rects = this.peRects();
        const player = this.multiCameraPlayer.players[this.peSelection.cameras[0]];
        const size = this.phoneExportSize(
            { width: player?.videoWidth || 1280, height: player?.videoHeight || 720 }, rows, cols);
        const cameras = this.peSelection.cameras
            .map((camera, index) => ({
                camera,
                cell: index,
                // Fractions of the frame with the origin at the top left; `Cell.of` flips the axis
                // for GL. The engine keeps `cell`/`rows`/`cols` as the fallback it always used.
                rect: [rects[index].x, rects[index].y, rects[index].w, rects[index].h]
                    .map(n => Math.round(n * 1e4) / 1e4),
                // Fractions of *this view's* picture, `y` down from its top — the engine's shader
                // works in the same space the editor draws in.
                mosaic: this.peMosaicBoxes(camera),
                segments: this.phoneExportSegments(event, camera, from, to),
            }))
            .filter(entry => entry.segments.length);
        if (!cameras.length) {
            return { error: translations.peExportMissingFile.replace('{camera}',
                this.phoneExportLabel(this.peSelection.cameras[0])) };
        }
        return {
            rows, cols, cameras, width: size.width, height: size.height,
            durationUs: Math.round((to - from) * 1e6),
            summary: translations.peGridInfo
                .replace('{n}', cameras.length)
                .replace('{w}', size.width)
                .replace('{h}', size.height)
                .replace('{cw}', Math.round(size.width / cols))
                .replace('{ch}', Math.round(size.height / rows))
                .replace('{d}', controls.formatTime(to - from))
                // A frame this phone cannot encode is the one case where the preset is not what
                // the user gets, so say so next to the numbers instead of leaving them to notice.
                .replace('{c}', size.capped ? translations.peSizeCapped : ''),
        };
    }

    /**
     * The event timeline is stitched from one-minute files, so a range that crosses a minute
     * becomes two segments — each with its own place in the file and on the output clock.
     */
    phoneExportSegments(event, camera, from, to) {
        const out = [];
        event.segments.forEach((segment, index) => {
            const file = segment.files && segment.files[camera];
            if (!file || !file.path) return;
            const start = event.segmentStartTimes?.[index] ?? index * 60;
            const duration = event.segmentDurations?.[index] ?? 60;
            const overlapFrom = Math.max(from, start);
            const overlapTo = Math.min(to, start + duration);
            if (overlapTo - overlapFrom <= 0.05) return;
            out.push({
                path: file.path,
                clipStartUs: Math.round((overlapFrom - start) * 1e6),
                clipEndUs: Math.round((overlapTo - start) * 1e6),
                globalStartUs: Math.round((overlapFrom - from) * 1e6),
            });
        });
        return out;
    }

    /* --- Export overlays: privacy mosaic and burned-in text -------------------------------------
       A clip that leaves the phone is a clip somebody else may watch, so both of these exist to be
       *in the file* rather than on the screen. The boxes are stored per view and measured against
       that view's own picture, which is what lets a layout be rearranged afterwards without a plate
       coming uncovered; the text is one strip over the whole frame, because the figures describe the
       car rather than any one camera. */

    readExportOverlay() {
        const off = { mosaic: false, stamp: false, hud: false };
        try {
            const stored = JSON.parse(localStorage.getItem('tdashcam.exportOverlay') || '{}');
            return { mosaic: !!stored.mosaic, stamp: !!stored.stamp, hud: !!stored.hud };
        } catch {
            return off;
        }
    }

    saveExportOverlay() {
        try {
            localStorage.setItem('tdashcam.exportOverlay', JSON.stringify(this.peSelection.overlay));
        } catch (e) {
            console.warn('[overlay] not saved:', e);
        }
    }

    readExportMosaic() {
        try {
            const stored = JSON.parse(localStorage.getItem('tdashcam.exportMosaic') || '{}');
            const out = {};
            Object.keys(stored).forEach(camera => {
                const boxes = Array.isArray(stored[camera]) ? stored[camera].slice(0, 4) : [];
                const kept = boxes.filter(box => Array.isArray(box) && box.length === 4
                    && box.every(n => Number.isFinite(n)) && box[2] > 0.01 && box[3] > 0.01);
                if (kept.length) out[camera] = kept;
            });
            return out;
        } catch {
            return {};
        }
    }

    saveExportMosaic() {
        try {
            const out = {};
            Object.keys(this.peSelection.mosaic).forEach(camera => {
                const boxes = this.peSelection.mosaic[camera]
                    .filter(box => box[2] > 0.01 && box[3] > 0.01)
                    .map(box => box.map(n => Math.round(n * 1e4) / 1e4));
                if (boxes.length) out[camera] = boxes;
            });
            localStorage.setItem('tdashcam.exportMosaic', JSON.stringify(out));
        } catch (e) {
            console.warn('[mosaic] not saved:', e);
        }
    }

    /** What the engine is handed: nothing at all while the toggle is off, four boxes at most. */
    peMosaicBoxes(camera) {
        if (!this.peSelection.overlay?.mosaic) return [];
        return (this.peSelection.mosaic[camera] || []).slice(0, 4)
            .map(box => box.map(n => Math.round(n * 1e4) / 1e4));
    }

    /** The view being masked has to be one that is actually going into the file. */
    peMosaicCamera() {
        const cameras = this.peSelection.cameras;
        if (!cameras.length) return '';
        if (!cameras.includes(this.peSelection.mosaicCamera)) this.peSelection.mosaicCamera = cameras[0];
        return this.peSelection.mosaicCamera;
    }

    renderPhoneOverlay() {
        const dom = this.peDom;
        const overlay = this.peSelection.overlay;
        const translations = i18n[this.currentLanguage];
        dom.overlayChips?.querySelectorAll('[data-overlay]').forEach((chip) => {
            const on = !!overlay[chip.dataset.overlay];
            chip.classList.toggle('on', on);
            chip.setAttribute('aria-pressed', String(on));
        });
        const show = overlay.mosaic && !!this.peSelection.cameras.length && !this.peJob;
        dom.mosaic.style.display = show ? '' : 'none';
        if (!show) return;
        const camera = this.peMosaicCamera();
        dom.mosaicCams.innerHTML = this.peSelection.cameras.map(key =>
            `<button type="button" class="recent-chip${key === camera ? ' on' : ''}"`
            + ` data-camera="${key}">${this.phoneExportLabel(key)}</button>`).join('');
        // The editor's own shape is the view's picture shape, so a box drawn here is the same box in
        // the file rather than one stretched over a letterbox the engine never encodes.
        const player = this.multiCameraPlayer.players[camera];
        const aspect = player?.videoWidth && player?.videoHeight
            ? player.videoWidth / player.videoHeight : 16 / 9;
        dom.mosaicCanvas.style.aspectRatio = `${aspect}`;
        // A portrait view is taller than the sheet's whole scroll window, and the box coordinates are
        // fractions of this canvas — so the canvas has to shrink in width to stay honest rather than
        // getting a max-height, which would letterbox the frame inside it and misalign every box.
        const tallest = Math.max(180, Math.min(300, window.innerHeight * 0.34));
        dom.mosaicCanvas.style.maxWidth = `${Math.min(260, Math.round(tallest * aspect))}px`;
        const target = this.peFrameTarget(camera);
        const cached = target && FrameFetcher.peek(target.path, target.seconds, PHONE_EXPORT_FRAME_W);
        const boxes = this.peSelection.mosaic[camera] || [];
        dom.mosaicCanvas.innerHTML = (this.peFrameIsImage(cached)
            ? `<img class="pe-mosaic-img" src="${cached}" alt="">` : '')
            + boxes.map((box, index) => `<div class="pe-mosaic-box" data-box="${index}"`
                + ` style="left:${box[0] * 100}%;top:${box[1] * 100}%`
                + `;width:${box[2] * 100}%;height:${box[3] * 100}%">`
                + `<button type="button" class="pe-mosaic-del" data-box-del="${index}"`
                + ` aria-label="${escapeHtmlText(translations.peMosaicDelete)}">×</button>`
                + `<span class="pe-mosaic-grip" aria-hidden="true"></span></div>`).join('');
        if (target && !this.peFrameIsImage(cached)) {
            FrameFetcher.get(target.path, target.seconds, PHONE_EXPORT_FRAME_W).then(() => {
                // `isConnected` plus the panel still being open: a re-render during the fetch owns
                // the picture now, and this answer belongs to a node nobody is looking at.
                if (dom.mosaicCanvas?.isConnected && overlay.mosaic) this.renderPhoneOverlay();
            });
        }
        dom.mosaicHint.textContent = boxes.length >= 4
            ? translations.peMosaicFull : translations.peMosaicHint;
    }

    /**
     * One gesture per box: the background draws a new one, the box moves, its corner resizes, and a
     * tap on × removes it. A drag that never got bigger than a finger is not a box the user meant to
     * draw, and a box dragged down to nothing is how a removal is asked for without a second control.
     */
    onPeMosaicPointerDown(event) {
        const canvas = this.peDom.mosaicCanvas;
        const camera = this.peMosaicCamera();
        if (!canvas || !camera || this.peJob) return;
        const remove = event.target.closest('[data-box-del]');
        if (remove) {
            const boxes = this.peSelection.mosaic[camera] || [];
            boxes.splice(Number(remove.dataset.boxDel), 1);
            this.peSelection.mosaic[camera] = boxes;
            this.saveExportMosaic();
            this.renderPhoneExportPanel();
            return;
        }
        if ((this.peSelection.mosaic[camera] || []).length >= 4
            && !event.target.closest('.pe-mosaic-box')) {
            this.showToast(i18n[this.currentLanguage].peMosaicFull, 'error', 2500);
            return;
        }

        const frame = canvas.getBoundingClientRect();
        const point = (e) => ({
            x: Math.max(0, Math.min(1, (e.clientX - frame.left) / (frame.width || 1))),
            y: Math.max(0, Math.min(1, (e.clientY - frame.top) / (frame.height || 1))),
        });
        const start = point(event);
        const node = event.target.closest('.pe-mosaic-box');
        const index = node ? Number(node.dataset.box) : -1;
        const existing = index >= 0 ? (this.peSelection.mosaic[camera] || [])[index] : null;
        const resize = event.target.classList.contains('pe-mosaic-grip');
        let current = existing ? [...existing] : [start.x, start.y, 0.02, 0.02];
        let target = node;
        if (!target) {
            target = document.createElement('div');
            target.className = 'pe-mosaic-box';
            target.innerHTML = '<span class="pe-mosaic-grip" aria-hidden="true"></span>';
            canvas.appendChild(target);
        }

        let paintFrame = 0;
        const paint = () => {
            target.style.left = `${current[0] * 100}%`;
            target.style.top = `${current[1] * 100}%`;
            target.style.width = `${current[2] * 100}%`;
            target.style.height = `${current[3] * 100}%`;
        };
        const move = (e) => {
            const p = point(e);
            const next = [...current];
            if (!existing) {
                next[0] = Math.min(start.x, p.x);
                next[1] = Math.min(start.y, p.y);
                next[2] = Math.abs(p.x - start.x);
                next[3] = Math.abs(p.y - start.y);
            } else if (resize) {
                next[2] = Math.max(0.02, Math.min(1 - existing[0], p.x - existing[0]));
                next[3] = Math.max(0.02, Math.min(1 - existing[1], p.y - existing[1]));
            } else {
                next[0] = Math.max(0, Math.min(1 - existing[2], existing[0] + p.x - start.x));
                next[1] = Math.max(0, Math.min(1 - existing[3], existing[1] + p.y - start.y));
            }
            current = next;
            if (paintFrame) cancelAnimationFrame(paintFrame);
            paintFrame = requestAnimationFrame(paint);
        };
        const end = () => {
            if (paintFrame) cancelAnimationFrame(paintFrame);
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', end);
            document.removeEventListener('pointercancel', end);
            const kept = current[2] > 0.02 && current[3] > 0.02;
            const boxes = (this.peSelection.mosaic[camera] || []).slice();
            if (index >= 0) {
                if (kept) boxes[index] = current;
                else boxes.splice(index, 1);
            } else if (kept) {
                boxes.push(current);
            }
            this.peSelection.mosaic[camera] = boxes;
            this.saveExportMosaic();
            this.renderPhoneExportPanel();
        };
        document.addEventListener('pointermove', move, { passive: true });
        document.addEventListener('pointerup', end);
        document.addEventListener('pointercancel', end);
        event.preventDefault();
    }

    /** One line next to the plan's numbers, saying what the file will carry. */
    peOverlayNotice() {
        const overlay = this.peSelection.overlay;
        const translations = i18n[this.currentLanguage];
        const parts = [];
        if (overlay.mosaic) {
            const count = this.peSelection.cameras
                .reduce((sum, camera) => sum + this.peMosaicBoxes(camera).length, 0);
            if (count) parts.push(translations.peMosaicCount.replace('{n}', count));
        }
        if (overlay.stamp && !this.videoControls.currentEventStartTime) parts.push(translations.peBurnNoClock);
        return parts.join(' · ');
    }

    /** Wall clock of event second `at`, in the same shape the on-screen clock writes. */
    phoneExportClock(at) {
        const base = this.videoControls.currentEventStartTime;
        if (!base || Number.isNaN(base.getTime?.())) return '';
        const date = new Date(base.getTime() + at * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
            + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    /**
     * The speed and assisted-driving figures, taken from the sample nearest to `at`. The burn runs at
     * one entry per second, so a nearest lookup rather than a lookup of the last one before it: the
     * SEI cadence and the caption cadence are independent, and the closest reading is the honest one.
     */
    phoneExportHudAt(points, at) {
        if (!points.length) return '';
        let lo = 0;
        let hi = points.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (points[mid].at < at) lo = mid + 1; else hi = mid;
        }
        const before = points[Math.max(0, lo - 1)];
        const after = points[lo];
        const best = Math.abs(after.at - at) <= Math.abs(before.at - at) ? after : before;
        const translations = i18n[this.currentLanguage];
        const labels = {
            SELF_DRIVING: translations.routeApSelfDriving,
            AUTOSTEER: translations.routeApAutosteer,
            TACC: translations.routeApTacc,
        };
        const state = labels[best.state] || translations.routeApNone;
        return `${Math.round(best.speed)} km/h · ${state}`;
    }

    /** Event-relative `{at, speed, state}` points, built once per event rather than per caption. */
    phoneExportTelemetry(event) {
        if (this.peTelemetryKey === event.eventId && this.peTelemetry) return this.peTelemetry;
        const points = (event.telemetrySamples || []).map(sample => ({
            at: (Number(sample.segmentStart) || 0) + (Number(sample.time) || 0),
            speed: (Number(sample.data?.vehicleSpeedMps) || 0) * 3.6,
            state: sample.data?.autopilotState || 'NONE',
        })).sort((a, b) => a.at - b.at);
        this.peTelemetryKey = event.eventId;
        this.peTelemetry = points;
        return points;
    }

    /**
     * The series the engine burns in, keyed by output time rather than event time — the file starts
     * at zero whatever the clip was cut from. Cached against the range and the toggles because the
     * sheet re-plans on every frame of a drag, and a ten-minute clip is six hundred lines of text.
     */
    phoneExportCaptions() {
        const overlay = this.peSelection.overlay;
        const controls = this.videoControls;
        const event = this.currentEvent || this.continuousPlayer.currentEvent;
        if (!event || (!overlay.stamp && !overlay.hud)) return [];
        const from = controls.clipStartTime || 0;
        const to = controls.clipEndTime || 0;
        const key = `${event.eventId}|${from.toFixed(2)}|${to.toFixed(2)}|${overlay.stamp}|${overlay.hud}`
            + `|${this.currentLanguage}`;
        if (this.peCaptionKey === key) return this.peCaptions;
        const list = [];
        // Floor, not ceil: an entry says what is true from its own second until the next one, so the
        // first frame of the file carries a stamp instead of waiting for a second to go by. A clip
        // trimmed shorter than that wait would otherwise export with no clock burned in at all.
        for (let at = Math.floor(from); at < to && list.length < MAX_EXPORT_CAPTIONS; at += 1) {
            const lines = [];
            if (overlay.stamp) {
                const clock = this.phoneExportClock(at);
                if (clock) lines.push(clock);
            }
            if (overlay.hud) {
                const hud = this.phoneExportHudAt(this.phoneExportTelemetry(event), at);
                if (hud) lines.push(hud);
            }
            if (lines.length) {
                list.push({ us: Math.max(0, Math.round((at - from) * 1e6)), text: lines.join('\n') });
            }
        }
        this.peCaptionKey = key;
        this.peCaptions = list;
        return list;
    }

    /* --- Named clip marks ------------------------------------------------------------------
       A ten-minute clip is rarely one thing worth exporting; it is two or three, and finding them
       again meant re-dragging both handles every time. A mark is the range **plus** the views and
       the preset selected with it, kept per event so tomorrow's clip starts with an empty row. */

    clipMarks() {
        const key = this.currentEvent?.eventId;
        if (!key) return [];
        try {
            const all = JSON.parse(localStorage.getItem('tdashcam.clipMarks') || '{}');
            return Array.isArray(all[key]) ? all[key] : [];
        } catch {
            return [];
        }
    }

    writeClipMarks(marks) {
        const key = this.currentEvent?.eventId;
        if (!key) return;
        try {
            const all = JSON.parse(localStorage.getItem('tdashcam.clipMarks') || '{}');
            all[key] = marks.slice(0, 12);
            // Marks outlive the drive they were made on: a stick re-read under another mount point
            // leaves the old keys behind and nobody is deleting them by hand.
            const ids = Object.keys(all);
            if (ids.length > 400) ids.slice(0, ids.length - 400).forEach(id => delete all[id]);
            localStorage.setItem('tdashcam.clipMarks', JSON.stringify(all));
        } catch (e) {
            console.warn('[marks] could not persist:', e);
        }
    }

    saveClipMark() {
        const plan = this.phoneExportPlan();
        if (plan.error) {
            this.showToast(plan.error, 'error', 3000);
            return;
        }
        const controls = this.videoControls;
        const typed = (this.peDom.markName?.value || '').trim();
        const name = (typed
            || `${controls.formatTime(controls.clipStartTime)}–${controls.formatTime(controls.clipEndTime)}`)
            .slice(0, 24);
        const marks = this.clipMarks();
        marks.unshift({
            name,
            from: Math.round(controls.clipStartTime * 10) / 10,
            to: Math.round(controls.clipEndTime * 10) / 10,
            cameras: [...this.peSelection.cameras],
            size: this.peSelection.size,
        });
        this.writeClipMarks(marks);
        if (this.peDom.markName) this.peDom.markName.value = '';
        this.showToast(`${i18n[this.currentLanguage].peMarkSaved} ${name}`, 'success', 2200);
        this.renderPhoneMarks();
    }

    /** @param {boolean} exportAfter — the one-tap path: apply the mark and press 开始导出 for it. */
    applyClipMark(index, exportAfter) {
        const mark = this.clipMarks()[index];
        if (!mark) return;
        const controls = this.videoControls;
        const total = controls.totalDuration || mark.to;
        const from = Math.max(0, Math.min(mark.from, total));
        const to = Math.min(mark.to, total);
        if (!(to > from)) {
            this.showToast(i18n[this.currentLanguage].peMarkOutOfRange, 'error', 3000);
            return;
        }
        controls.clipStartTime = from;
        controls.clipEndTime = to;
        controls.updateClipSelection();
        // The views a mark remembers may not exist in the clip it is applied to — a pillar-only
        // mark on a clip without B-pillar files would plan an empty view and gray the button out.
        const available = this.phoneExportCameras();
        const kept = (mark.cameras || []).filter(camera => available.includes(camera));
        this.peSelection.cameras = kept.length ? kept : [available[0]];
        this.peSelection.size = mark.size || this.peSelection.size;
        this.renderPhoneExportPanel();
        if (exportAfter) this.startPhoneExport();
    }

    deleteClipMark(index) {
        const marks = this.clipMarks();
        marks.splice(index, 1);
        this.writeClipMarks(marks);
        this.renderPhoneMarks();
    }

    /** Rebuilt rather than patched: the marks belong to the event, not to the current selection. */
    renderPhoneMarks() {
        const dom = this.peDom;
        if (!dom?.marks) return;
        const marks = this.clipMarks();
        const translations = i18n[this.currentLanguage];
        const clock = (value) => this.videoControls.formatTime(value || 0);
        dom.marks.innerHTML = marks.map((mark, index) => `
            <span class="pe-mark">
                <button type="button" class="pe-mark-name" data-mark="${index}">
                    <span>${escapeHtmlText(mark.name)}</span><em>${clock(mark.from)}–${clock(mark.to)}</em></button>
                <button type="button" class="pe-mini pe-mark-go" data-mark-export="${index}"
                    aria-label="${escapeHtmlText(translations.peMarkExport)}">${translations.peMarkExport}</button>
                <button type="button" class="pe-mark-del" data-mark-del="${index}"
                    aria-label="${escapeHtmlText(translations.peMarkDelete)}">×</button>
            </span>`).join('');
        dom.marks.style.display = marks.length ? 'flex' : 'none';
    }

    renderPhoneExportPanel() {
        const dom = this.peDom;
        if (!dom) return;
        const translations = i18n[this.currentLanguage];
        const available = this.phoneExportCameras();
        this.peSelection.cameras = this.peSelection.cameras.filter(camera => available.includes(camera));
        if (!this.peSelection.cameras.length && available.length) {
            this.peSelection.cameras = [available.includes('front') ? 'front' : available[0]];
        }

        const chip = (attribute, value, label, on) =>
            `<button type="button" class="recent-chip${on ? ' on' : ''}" data-${attribute}="${value}">${label}</button>`;
        dom.cameras.innerHTML = available
            .map(camera => chip('camera', camera, this.phoneExportLabel(camera),
                this.peSelection.cameras.includes(camera))).join('');
        dom.sizes.innerHTML = [['source', translations.peSourceSize],
            ['1080', '1080p'], ['720', '720p'], ['480', '480p']]
            .map(([value, label]) => chip('size', value, label, this.peSizeKey() === value)).join('');

        dom.start.value = this.videoControls.formatTime(this.videoControls.clipStartTime || 0);
        dom.end.value = this.videoControls.formatTime(this.videoControls.clipEndTime || 0);
        this.renderPhoneMarks();

        const plan = this.phoneExportPlan();
        const notice = plan.error ? '' : this.peOverlayNotice();
        dom.summary.textContent = plan.error || `${plan.summary}${notice ? ` · ${notice}` : ''}`;
        dom.startBtn.disabled = !!plan.error || !!this.peJob;
        this.renderPhoneExportLayout(plan);
        this.renderPhoneOverlay();
    }

    showPhoneExportModal() {
        if (!this.peDom) this.setupPhoneExportPanel();
        // A finished job leaves its bar at 100%, and reopening the sheet with last run's progress
        // still on it reads as "already exporting".
        if (!this.peJob) {
            this.peDom.progress.style.display = 'none';
            setBarPercent(this.peDom.bar, 0);
            this.peDom.text.textContent = '';
        }
        this.renderPhoneExportPanel();
        this.peDom.modal.style.display = 'flex';
        requestAnimationFrame(() => this.peDom.modal.classList.add('show'));
        this.syncBackLayers?.();
    }

    hidePhoneExportModal() {
        if (this.peJob) this.cancelPhoneExport();
        const dom = this.peDom;
        if (!dom) return;
        dom.modal.classList.remove('show');
        setTimeout(() => { dom.modal.style.display = 'none'; }, 300);
        this.syncBackLayers?.();
    }

    onClipRangeChanged() {
        if (this.peDom && this.peDom.modal.classList.contains('show')) this.renderPhoneExportPanel();
    }

    startPhoneExport() {
        const translations = i18n[this.currentLanguage];
        const native = window.TDashcamNative;
        if (!native || typeof native.startExport !== 'function') {
            this.showToast(translations.peExportNoBridge, 'error', 4000);
            return;
        }
        const plan = this.phoneExportPlan();
        if (plan.error) {
            this.showToast(plan.error, 'error', 4000);
            return;
        }
        const stamp = (this.currentEvent?.startTime || new Date().toISOString().slice(0, 19).replace('T', '_'))
            .replace(/[: ]/g, '-');
        const outPath = joinPath(ANDROID_DOWNLOAD_DIR,
            `${ANDROID_FILE_PREFIX}_${stamp}_${plan.cameras.length}c_${plan.width}x${plan.height}.mp4`);
        const id = Date.now() % 1e9;
        const started = native.startExport(JSON.stringify({
            id,
            outPath,
            width: plan.width,
            height: plan.height,
            fps: 30,
            durationUs: plan.durationUs,
            rows: plan.rows,
            cols: plan.cols,
            cameras: plan.cameras,
            // One entry per second of the *file*, so the engine never has to know what a wall clock
            // is or where the telemetry samples came from.
            captions: this.phoneExportCaptions(),
        }));
        if (!started || started.indexOf('"id"') < 0) {
            this.showToast(`${translations.exportFailed}${started || ''}`, 'error', 6000);
            return;
        }
        this.peJob = { id, outPath };
        this.peDom.progress.style.display = 'block';
        setBarPercent(this.peDom.bar, 0);
        this.peDom.text.textContent = translations.peExportStarted;
        this.renderPhoneExportPanel();
    }

    cancelPhoneExport() {
        if (!this.peJob) return;
        try {
            window.TDashcamNative.cancelExport(this.peJob.id);
        } catch (e) {
            console.warn('[export] cancel failed:', e);
        }
    }

    onPhoneExportProgress(payload) {
        const dom = this.peDom;
        if (!dom || !payload || (this.peJob && payload.id !== this.peJob.id)) return;
        const translations = i18n[this.currentLanguage];
        // A `done` payload can still carry a note (the encoder went silent on the tail after every
        // frame was handed over), so the progress line and the toast both keep it visible.
        if (payload.message) dom.text.textContent = payload.message;
        if (Number.isFinite(payload.percent)) {
            setBarPercent(dom.bar, payload.percent);
        }
        if (!['done', 'cancelled', 'error'].includes(payload.phase)) return;

        const finished = this.peJob;
        this.peJob = null;
        dom.startBtn.disabled = false;
        if (payload.phase === 'error') {
            haptic([40, 50, 40]);
            this.showToast(`${translations.exportFailed}${payload.message || ''}`, 'error', 6000);
            return;
        }
        if (payload.path) notifyMediaFile(payload.path);
        if (payload.phase === 'cancelled') {
            this.showToast(translations.peExportCancelled, 'info', 4000);
            return;
        }
        const megabytes = Math.round((payload.bytes || 0) / 104857.6) / 10;
        // The panel closes the moment this lands, so a minute-long export finishing in a pocket
        // needs to be felt as much as heard.
        haptic([16, 60, 16]);
        // The modal closes on success, so a warning that came with it only survives inside the toast.
        this.showToast(`${translations.peExportSaved.replace('{path}', finished?.outPath || payload.path)} · ${megabytes} MB${payload.message ? ' · ' + payload.message : ''}`,
            'success', 8000);
        this.hidePhoneExportModal();
    }

    showClipModal() {
        if (!this.videoControls.clipModeActive || 
            this.videoControls.clipStartTime === null || 
            this.videoControls.clipStartTime === undefined || 
            this.videoControls.clipEndTime === null || 
            this.videoControls.clipEndTime === undefined) {
            notify(i18n[this.currentLanguage].selectClipRange);
            return;
        }

        // Same entry point, different engine: on a phone the range feeds MediaCodec, not FFmpeg.
        // The test is the bridge rather than the layout, matching the gate that enables the button —
        // an OEM WebView that reports a mouse as its pointer would otherwise fall through to the
        // desktop FFmpeg path, and no ffmpeg binary ships in the mobile bundle.
        if (window.TDashcamNative?.startExport) {
            this.showPhoneExportModal();
            return;
        }
        
        const translations = i18n[this.currentLanguage];
        
        // Update modal title and labels
        this.dom.clipModalTitle.textContent = translations.exportClip;
        
        // Update labels
        document.getElementById('selectCamerasLabel').textContent = translations.selectCameras;
        document.getElementById('addTimestampLabel').textContent = translations.addTimestamp;
        document.getElementById('addMetadataLabel').textContent = translations.addMetadata;
        document.getElementById('mergeVideosLabel').textContent = translations.mergeVideos;
        this.dom.startClipBtn.textContent = translations.startExport;
        this.dom.cancelClipBtn.textContent = translations.cancel;
        
        // Update camera labels
        document.querySelectorAll('[data-i18n="front"]').forEach(el => el.textContent = translations.front);
        document.querySelectorAll('[data-i18n="back"]').forEach(el => el.textContent = translations.back);
        document.querySelectorAll('[data-i18n="left"]').forEach(el => el.textContent = translations.left);
        document.querySelectorAll('[data-i18n="right"]').forEach(el => el.textContent = translations.right);
        document.querySelectorAll('[data-i18n="leftPillar"]').forEach(el => el.textContent = translations.leftPillar);
        document.querySelectorAll('[data-i18n="rightPillar"]').forEach(el => el.textContent = translations.rightPillar);
        document.querySelectorAll('[data-i18n="grid6"]').forEach(el => el.textContent = translations.grid6);
        document.querySelectorAll('[data-i18n="grid4"]').forEach(el => el.textContent = translations.grid4);
        document.querySelectorAll('[data-i18n="legacy"]').forEach(el => el.textContent = translations.legacy);

        // Update Metadata Panel
        const metadataKeys = [
            'metadata', 'loadingMetadata', 'noMetadata', 'speed', 'gear', 'steering', 
            'accelerator', 'brake', 'blinker', 'autopilot', 'gps', 'heading', 'acceleration'
        ];
        metadataKeys.forEach(key => {
            document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el => {
                if (translations[key]) el.textContent = translations[key];
            });
        });

        
        // Update clip info labels
        const clipDurationLabel = this.dom.clipDuration.previousElementSibling;
        const clipStartTimeLabel = this.dom.clipStartTime.previousElementSibling;
        const clipEndTimeLabel = this.dom.clipEndTime.previousElementSibling;
        if (clipDurationLabel) clipDurationLabel.textContent = translations.clipDuration;
        if (clipStartTimeLabel) clipStartTimeLabel.textContent = translations.clipStartTime;
        if (clipEndTimeLabel) clipEndTimeLabel.textContent = translations.clipEndTime;
        
        // Calculate duration
        const duration = this.videoControls.clipEndTime - this.videoControls.clipStartTime;
        this.dom.clipDuration.textContent = this.videoControls.formatTime(duration);
        
        // Calculate actual timestamps
        const event = this.continuousPlayer.currentEvent;
        if (event && event.startTime) {
            const startDate = this.parseTimestamp(event.startTime);
            const startTime = new Date(startDate.getTime() + this.videoControls.clipStartTime * 1000);
            const endTime = new Date(startDate.getTime() + this.videoControls.clipEndTime * 1000);
            
            const locale = this.currentLanguage === 'zh' ? 'zh-CN' : 'en-CA';
            this.dom.clipStartTime.textContent = startTime.toLocaleString(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            this.dom.clipEndTime.textContent = endTime.toLocaleString(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        }
        
        // Reset checkboxes
        this.dom.exportFront.checked = true;
        this.dom.exportBack.checked = false;
        this.dom.exportLeft.checked = false;
        this.dom.exportRight.checked = false;
        this.dom.addTimestamp.checked = true;
        this.dom.mergeVideos.checked = false;
        
        // Show FFmpeg option only in Tauri desktop
        if (this.isTauri && this.dom.ffmpegOptionRow) {
            this.dom.ffmpegOptionRow.style.display = 'flex';
            // Check FFmpeg availability
            this.videoClipProcessor.checkFFmpeg().then(hasFFmpeg => {
                if (hasFFmpeg) {
                    this.dom.useLocalFFmpeg.checked = true;
                    this.dom.useLocalFFmpeg.disabled = false;
                    document.getElementById('useLocalFFmpegLabel').textContent = 
                        this.currentLanguage === 'zh' ? '使用 FFmpeg 极速导出' : 'Use FFmpeg Fast Export';
                } else {
                    this.dom.useLocalFFmpeg.checked = false;
                    this.dom.useLocalFFmpeg.disabled = true;
                    document.getElementById('useLocalFFmpegLabel').textContent = 
                        this.currentLanguage === 'zh' ? 'FFmpeg 未安装' : 'FFmpeg Not Installed';
                }
            });
        } else if (this.dom.ffmpegOptionRow) {
            this.dom.ffmpegOptionRow.style.display = 'none';
        }
        
        // Hide progress
        this.dom.clipProgress.style.display = 'none';
        this.dom.startClipBtn.disabled = false;
        this.dom.startClipBtn.style.display = 'block'; // Ensure visible
        this.dom.cancelClipBtn.disabled = false;
        this.dom.cancelClipBtn.textContent = i18n[this.currentLanguage].cancel; // Reset text
        this.dom.cancelClipBtn.style.display = 'block'; // Ensure visible
        
        // Reset clip info and options state (remove disabled class)
        this.dom.clipInfo.classList.remove('disabled');
        this.dom.clipOptions.classList.remove('disabled');
        
        // Hide download buttons if any
        const downloadButtons = document.getElementById('downloadButtons');
        if (downloadButtons) {
            downloadButtons.style.display = 'none';
            downloadButtons.innerHTML = '';
        }
        
        // Show modal
        this.dom.clipModal.style.display = 'flex';
        setTimeout(() => this.dom.clipModal.classList.add('show'), 10);
    }
    
    hideClipModal() {
        // Cancel any pending export
        if (this.videoClipProcessor) {
            this.videoClipProcessor.cancelExport();
        }
        
        this.dom.clipModal.classList.remove('show');
        setTimeout(() => {
            this.dom.clipModal.style.display = 'none';
            // Reset download buttons
            const downloadButtons = document.getElementById('downloadButtons');
            if (downloadButtons) {
                downloadButtons.style.display = 'none';
                downloadButtons.innerHTML = '';
            }
            
            // Clean up pending export blobs to free memory
            if (this.pendingExportBlobs) {
                console.log('[Memory] Cleaning up pending export blobs...');
                for (const result of this.pendingExportBlobs) {
                    if (result.blob) {
                        // Clear the blob reference
                        result.blob = null;
                    }
                }
                this.pendingExportBlobs = null;
                
                // Suggest garbage collection (browser will do this automatically, but this helps)
                if (window.gc) {
                    window.gc();
                }
                console.log('[Memory] Export blobs cleaned up');
            }
        }, 300);
    }
    
    parseTimestamp(timestamp) {
        // Handles "2024-01-01_12-00-00" format
        const [datePart, timePart] = timestamp.split('_');
        return new Date(`${datePart}T${timePart.replace(/-/g, ':')}`);
    }
    
    async saveVideoFile(blob, filename) {
        try {
            // Check if File System Access API is available (Chrome 86+, Edge 86+)
            if ('showSaveFilePicker' in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'WebM Video',
                            accept: { 'video/webm': ['.webm'] }
                        }]
                    });

                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();

                    console.log('File saved via File System Access API');
                    this.showToast('视频保存成功!', 'success');
                } catch (fsError) {
                    // User cancelled the save dialog or API failed
                    if (fsError.name === 'AbortError') {
                        console.log('User cancelled save dialog');
                        return;
                    }
                    throw fsError; // Re-throw other errors to fall back
                }
            } else {
                // Fallback to traditional download for older browsers
                const url = URL.createObjectURL(blob);
                console.log('Created blob URL:', url);

                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);

                await new Promise(resolve => {
                    setTimeout(() => {
                        a.click();
                        console.log('Download link clicked');
                        resolve();
                    }, 100);
                });

                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    console.log('Cleanup completed');
                }, 1000);
                
                this.showToast(`视频已下载: ${filename}`, 'success');
            }
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            notify('下载失败: ' + downloadError.message, 'error');
        }
    }

    async startClipExport() {
        const translations = i18n[this.currentLanguage];
        
        // Get selected cameras
        const cameras = [];
        if (this.dom.exportFront.checked) cameras.push('front');
        if (this.dom.exportBack.checked) cameras.push('back');
        if (this.dom.exportLeft.checked) cameras.push('left');
        if (this.dom.exportRight.checked) cameras.push('right');
        if (this.dom.exportLeftPillar && this.dom.exportLeftPillar.checked) cameras.push('left_pillar');
        if (this.dom.exportRightPillar && this.dom.exportRightPillar.checked) cameras.push('right_pillar');
        
        if (cameras.length === 0) {
            notify(translations.selectAtLeastOneCamera);
            return;
        }
        
        const addTimestamp = this.dom.addTimestamp.checked;
        const addMetadata = document.getElementById('addMetadata').checked;
        const mergeGrid = this.dom.mergeVideos.checked && cameras.length > 1;
        const useLocalFFmpeg = this.isTauri && this.dom.useLocalFFmpeg && this.dom.useLocalFFmpeg.checked;
        
        console.log('[startClipExport] Export options:', { addTimestamp, addMetadata, mergeGrid, useLocalFFmpeg, cameras });
        
        // WEB ONLY: Ask for save location upfront to enable streaming
        let fileHandle = null;
        if (!this.isTauri && 'showSaveFilePicker' in window && !useLocalFFmpeg) {
             // Only support streaming for Grid (1 file) or Single Camera (1 file)
             if (mergeGrid || cameras.length === 1) {
                  try {
                      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                      const camName = mergeGrid ? 'grid' : cameras[0];
                      // Canvas export produces WebM
                      const suggestedName = `TeslaCam_${camName}_${timestamp}.webm`;
                      
                      fileHandle = await window.showSaveFilePicker({
                          suggestedName: suggestedName,
                          types: [{
                              description: 'WebM Video',
                              accept: { 'video/webm': ['.webm'] }
                          }],
                      });
                  } catch (e) {
                      if (e.name === 'AbortError') return; // User cancelled
                      console.error('File picker failed, falling back to memory mode:', e);
                  }
             }
        }

        // Disable start button but KEEP cancel button enabled
        this.dom.startClipBtn.disabled = true;
        if (this.dom.cancelClipBtn) this.dom.cancelClipBtn.disabled = false;
        this.dom.clipInfo.classList.add('disabled');
        this.dom.clipOptions.classList.add('disabled');
        this.dom.clipProgress.style.display = 'block';
        setBarPercent(this.dom.clipProgressBar, 0);
        this.dom.clipProgressBar.classList.remove('indeterminate');
        this.dom.clipProgressText.textContent = translations.preparing;
        
        // Ensure buttons state
        const downloadButtons = document.getElementById('downloadButtons');
        if (downloadButtons) {
            downloadButtons.style.display = 'none';
            downloadButtons.innerHTML = '';
        }

        try {
            const event = this.continuousPlayer.currentEvent;
            
            // Add duration to segments
            const segmentsWithDuration = event.segments.map((seg, idx) => {
                return {
                    ...seg,
                    duration: event.segmentDurations[idx] || 60
                };
            });
            
            const results = await this.videoClipProcessor.processClip(
                segmentsWithDuration,
                cameras,
                this.videoControls.clipStartTime,
                this.videoControls.clipEndTime,
                addTimestamp,
                addMetadata,
                mergeGrid,
                event.startTime,
                (msg) => {
                    this.dom.clipProgressText.textContent = msg;
                    // Extract real percentage from message if available
                    const percentMatch = msg.match(/(\d+)%/);
                    if (percentMatch) {
                        // Real progress - remove indeterminate animation
                        this.dom.clipProgressBar.classList.remove('indeterminate');
                        const percent = parseInt(percentMatch[1], 10);
                        setBarPercent(this.dom.clipProgressBar, Math.min(95, percent));
                    } else if (msg.includes('FFmpeg') || msg.includes('极速导出') || msg.includes('写入磁盘')) {
                        // FFmpeg export - use indeterminate animation
                        this.dom.clipProgressBar.classList.add('indeterminate');
                        // No percentage exists to announce while the bar just sweeps.
                        this.dom.clipProgressBar.removeAttribute('aria-valuenow');
                    } else {
                        // For other non-percentage messages
                        this.dom.clipProgressBar.classList.remove('indeterminate');
                        const currentWidth = parseFloat(this.dom.clipProgressBar.style.width) || 0;
                        if (currentWidth < 30) {
                            setBarPercent(this.dom.clipProgressBar, Math.min(30, currentWidth + 5));
                        }
                    }
                },
                useLocalFFmpeg,
                this.currentLanguage,
                fileHandle,
                this.metadataManager
            );
            
            this.dom.clipProgressBar.classList.remove('indeterminate');
            
            setBarPercent(this.dom.clipProgressBar, 100);
            
            if (window.__TAURI__) {
                // Tauri implementation
                this.dom.clipProgressText.textContent = translations.exporting;
                for (const result of results) {
                    // Check if result is from FFmpeg (file path) or Canvas (blob)
                    if (result.isFile && result.path) {
                        const rawPath = result.path;
                        const defaultFilename = rawPath.replace(/\\/g, '/').split('/').pop();
                        const ext = defaultFilename.split('.').pop() || 'mp4';
                        
                        console.log('[Tauri Save] Finalizing export for:', defaultFilename, 'from temp:', rawPath);
                        
                        try {
                            const tauri = window.__TAURI__;
                            const invoke = tauri.core?.invoke || tauri.invoke;
                            const fs = tauri.fs;
                            const dialog = tauri.dialog;
                            
                            let savePath;
                            if (dialog && typeof dialog.save === 'function') {
                                console.log('[Tauri Save] Using dialog.save API');
                                savePath = await dialog.save({
                                    defaultPath: defaultFilename,
                                    filters: [{
                                        name: 'Video',
                                        extensions: [ext]
                                    }]
                                });
                            } else {
                                console.log('[Tauri Save] Falling back to invoke plugin:dialog|save');
                                savePath = await invoke('plugin:dialog|save', {
                                    options: {
                                        defaultPath: defaultFilename,
                                        filters: [{
                                            name: 'Video',
                                            extensions: [ext]
                                        }]
                                    }
                                });
                            }
                            
                            const resolvedSavePath = typeof savePath === 'string' ? savePath : savePath?.path;
                            if (resolvedSavePath && resolvedSavePath !== result.path) {
                                // Copy file to new location
                                await fs.copyFile(result.path, resolvedSavePath);
                                // Remove temp file
                                await fs.remove(result.path);
                                this.showToast('保存成功!', 'success');
                            } else if (resolvedSavePath === result.path) {
                                this.showToast('保存成功!', 'success');
                            } else {
                                // User cancelled, keep the file in original location
                                this.showToast(`视频已保存到: ${result.path}`, 'success');
                            }
                        } catch (e) {
                            console.error('File move failed:', e);
                            this.showToast(`视频已保存到: ${result.path}`, 'success');
                        }
                    } else if (result.blob) {
                        // Canvas export - blob needs to be saved
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const filename = `TeslaCam_${result.camera}_${timestamp}.webm`;
                        
                        if (result.blob.size === 0) {
                            console.error('Invalid blob for camera:', result.camera);
                            notify('导出失败：生成的视频文件为空', 'error');
                            continue;
                        }
                        
                        try {
                            const invoke = window.__TAURI__.core?.invoke || window.__TAURI__.invoke;
                            const fs = window.__TAURI__.fs;

                            if (isAndroidRuntime()) {
                                const dest = joinPath(ANDROID_DOWNLOAD_DIR, filename);
                                const arrayBuffer = await result.blob.arrayBuffer();
                                await fs.writeFile(dest, new Uint8Array(arrayBuffer));
                                this.showToast(`${i18n[this.currentLanguage].savedToDownloads}: ${dest}`, 'success');
                                continue;
                            }

                            const savePath = await invoke('plugin:dialog|save', {
                                options: {
                                    defaultPath: filename,
                                    filters: [{
                                        name: 'Video',
                                        extensions: ['webm']
                                    }]
                                }
                            });
                            
                            const resolvedSavePath = typeof savePath === 'string' ? savePath : savePath?.path;
                            if (resolvedSavePath) {
                                const arrayBuffer = await result.blob.arrayBuffer();
                                const uint8Array = new Uint8Array(arrayBuffer);
                                
                                // Tauri v2 uses writeFile
                                await fs.writeFile(resolvedSavePath, uint8Array);
                                this.showToast('保存成功!', 'success');
                            }
                        } catch (e) {
                            console.error('Tauri save failed:', e);
                            notify('保存失败: ' + (e.message || e), 'error');
                        }
                    }
                }
                
                this.dom.clipProgressText.textContent = translations.complete;
                setTimeout(() => {
                    this.hideClipModal();
                    this.videoControls.toggleClipMode(); 
                }, 2000);
            } else {
                // Browser download - Show buttons
                this.dom.clipProgressText.textContent = '视频已生成，请点击下方按钮保存';
                
                // Disable clip info and options since video is already generated
                this.dom.clipInfo.classList.add('disabled');
                this.dom.clipOptions.classList.add('disabled');
                
                // Store results for cleanup when modal closes
                this.pendingExportBlobs = results;
                
                if (downloadButtons) {
                    downloadButtons.style.display = 'flex';
                    
                    for (const result of results) {
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const filename = `TeslaCam_${result.camera}_${timestamp}.webm`;
                        const isGrid = result.camera === 'grid';
                        const cameraName = isGrid ? '四宫格' : result.camera;
                        const sizeInMB = result.blob.size / (1024 * 1024);
                        const sizeText = sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${(result.blob.size / 1024).toFixed(0)} KB`;
                        
                        const btn = document.createElement('button');
                        btn.className = `download-btn${isGrid ? ' grid-btn' : ''}`;
                        
                        if (result.saved) {
                             btn.disabled = true;
                             btn.innerHTML = `
                                <span class="btn-icon">✅</span>
                                <span class="btn-text">${cameraName} 已保存</span>
                            `;
                             if (result.blob && result.blob.size > 0) {
                                 btn.innerHTML += `<span class="btn-size">${sizeText}</span>`;
                             }
                             this.dom.clipProgressText.textContent = translations.complete;
                        } else {
                            btn.innerHTML = `
                                <span class="btn-icon">💾</span>
                                <span class="btn-text">保存 ${cameraName} 视频</span>
                                <span class="btn-size">${sizeText}</span>
                            `;
                            btn.onclick = async () => {
                                await this.saveVideoFile(result.blob, filename);
                                // Mark as downloaded
                                result.downloaded = true;
                                btn.disabled = true;
                                btn.innerHTML = `
                                    <span class="btn-icon">✅</span>
                                    <span class="btn-text">${cameraName} 已保存</span>
                                    <span class="btn-size">${sizeText}</span>
                                `;
                            };
                        }
                        downloadButtons.appendChild(btn);
                    }
                }
                
                // Hide both buttons since we have the X close button
                this.dom.cancelClipBtn.style.display = 'none';
                this.dom.startClipBtn.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Clip export error:', error);
            const errorMsg = error?.message || error?.toString?.() || JSON.stringify(error) || '未知错误';
            notify(translations.exportFailed + errorMsg, 'error');
            this.dom.clipProgress.style.display = 'none';
            this.dom.startClipBtn.disabled = false;
            this.dom.cancelClipBtn.disabled = false;
        }
    }

    showMapModal(lat, lon, event = null) {
        this.currentMapCoordinates = { lat, lon };
        this.routeEvent = event || this.currentEvent;
        this.dom.mapModal.style.display = 'flex';
        setTimeout(() => {
            this.dom.mapModal.classList.add('show');
            // The track sheet is offline (ROUTE_TRACK_ENABLED): the canvas group is taken out of the
            // sheet on every layout, and no half-second repaint loop runs for a hidden canvas. When
            // it comes back, an empty string hands the decision back to the stylesheet.
            if (this.dom.routeMapGroup) this.dom.routeMapGroup.style.display = ROUTE_TRACK_ENABLED ? '' : 'none';
            if (!ROUTE_TRACK_ENABLED) return;
            this.renderRouteMap();
            clearInterval(this.routeTimer);
            this.routeTimer = setInterval(() => this.renderRouteMap(), 500);
        }, 10);
    }

    hideMapModal() {
        clearInterval(this.routeTimer);
        this.routeTimer = null;
        this.dom.mapModal.classList.remove('show');
        setTimeout(() => {
            this.dom.mapModal.style.display = 'none';
            this.currentMapCoordinates = null;
        }, 300);
    }

    async openMap(type) {
        if (!this.currentMapCoordinates) return;
        const { lat, lon } = this.currentMapCoordinates;
        let url;
        if (type === 'gaode') {
            // Convert WGS-84 (GPS) to GCJ-02 (Gaode/AMap) for accuracy
            const gcj02 = wgs84togcj02(parseFloat(lon), parseFloat(lat));
            const gcj_lon = gcj02[0];
            const gcj_lat = gcj02[1];
            // Gaode URI API uses lon,lat order and GCJ-02 coordinates
            url = `https://uri.amap.com/marker?position=${gcj_lon},${gcj_lat}&name=事件位置`;
        } else { // google
            url = `https://www.google.com/maps?q=${lat},${lon}`;
        }
        
        // In Tauri desktop, use shell plugin to open in default browser
        if (openExternalUrl(url)) return;
        if (this.isTauri && window.__TAURI__) {
            try {
                const tauri = window.__TAURI__;
                // Tauri 2: try different API paths for shell.open
                let openFn = null;
                if (tauri.shell?.open) {
                    openFn = tauri.shell.open;
                } else if (tauri.opener?.open) {
                    openFn = tauri.opener.open;
                }
                
                if (openFn) {
                    await openFn(url);
                } else {
                    // Fallback: use invoke to call shell plugin directly
                    const invoke = tauri.core?.invoke || tauri.invoke || (tauri.tauri && tauri.tauri.invoke);
                    if (invoke) {
                        await invoke('plugin:shell|open', { path: url });
                    } else {
                        window.open(url, '_blank');
                    }
                }
            } catch (e) {
                console.error('Failed to open URL with Tauri shell:', e);
                window.open(url, '_blank');
            }
        } else {
            window.open(url, '_blank');
        }
        this.hideMapModal();
    }

    getEventType(path) {
        if (path.includes('RecentClips/')) return 'RecentClips';
        if (path.includes('SavedClips/')) return 'SavedClips';
        if (path.includes('SentryClips/')) return 'SentryClips';
        return 'Unknown';
    }

    getCameraType(fileName) {
        if (fileName.includes('-front.mp4')) return 'front';
        if (fileName.includes('-back.mp4')) return 'back';
        if (fileName.includes('-left_repeater.mp4')) return 'left';
        if (fileName.includes('-right_repeater.mp4')) return 'right';
        if (fileName.includes('-left_pillar.mp4')) return 'left_pillar';
        if (fileName.includes('-right_pillar.mp4')) return 'right_pillar';
        return null;
    }

    destroy() { if (this.multiCameraPlayer) this.multiCameraPlayer.cleanup(); }
}

// Preload custom font for Canvas rendering (desktop only, non-blocking)
function preloadFonts() {
    // Only load font in Tauri desktop environment
    if (!window.__TAURI__) return;
    
    // Dynamically add @font-face for desktop
    const style = document.createElement('style');
    style.textContent = `
        @font-face {
            font-family: 'Noto Sans SC';
            src: url('./assets/fonts/NotoSansSC-Light.ttf') format('truetype');
            font-weight: 300;
            font-style: normal;
            font-display: swap;
        }
    `;
    document.head.appendChild(style);
    
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            console.log('Fonts ready for Canvas rendering');
        }).catch(() => {
            console.warn('Font loading check failed, using fallback');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        preloadFonts();
        window.viewer = new TeslaCamViewer();
        installPhoneAlertShim();
        // Called by MainActivity when the system back gesture fires; true means the page had
        // something open and closed it.
        window.__tdashcamCloseTopLayer = () => window.viewer.closeTopLayer();
        // Until this returns, MainActivity drops every state push (--safe-* and the storage
        // facts). It used to push from onApplyWindowInsets instead, which is during the first
        // traversal, and the first evaluateJavascript of a process waits on a WebView that is
        // still starting — long enough on a cold start to trip the five-second input timeout.
        try { if (isAndroidRuntime() && window.TDashcamNative) window.TDashcamNative.pageReady(); }
        catch (e) {}
        window.addEventListener('beforeunload', () => { if (window.viewer) window.viewer.destroy(); });
        console.log('Tessera initialized');
    } catch (error) {
        console.error("Initialization failed:", error);
        // The error banner is wired up by the viewer, and the viewer is the thing that just failed,
        // so write it by hand: a blocking native alert is worse than useless here because the alert
        // shim lives behind the same constructor that threw.
        const banner = document.getElementById('jsErrorBanner');
        const textEl = document.getElementById('jsErrorText');
        if (isAndroidRuntime() && banner && textEl) {
            textEl.textContent = `${error && (error.stack || error.message) || error}`;
            banner.style.display = '';
            return;
        }
        notify("Player initialization failed. Check console for details.", 'error');
    }
});
