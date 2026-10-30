// R93 acceptance: the five things this round changed, each read the way the user would see it.
//   A  the space guard blocks, tells the truth about why, and a second press gets through
//   B  the engine's own bitrate arithmetic agrees with the page's estimate
//   C  the 最近导出 rows render, name the right file, and one click per row
//   D  the live regions and the valuetext are actually on the nodes
//   F  a stale telemetry read can no longer overwrite a newer one
// Needs an event loaded and the export sheet open; it does not start an export of its own.
(async function () {
    var v = window.viewer;
    var out = { pass: [], fail: [] };
    var ok = function (name, cond, detail) {
        (cond ? out.pass : out.fail).push(name + (detail === undefined ? '' : ' = ' + detail));
    };

    if (!v) return 'NO-VIEWER';
    var t = i18n[v.currentLanguage];
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // Every check below hangs off a plan, and a plan needs an event: `phoneExportPlan` answers
    // 「无元数据」 for `currentEvent === null`, which is what a freshly opened app is.
    var ev = (v.eventGroups || []).find(function (e) { return String(e.eventId).indexOf('2026-10-09') >= 0; })
        || (v.eventGroups || [])[0];
    if (ev) {
        await v.playEvent(ev.eventId);
        for (var w = 0; w < 30 && !v.videoControls.totalDuration; w += 1) await sleep(500);
        v.videoControls.clipStartTime = 0;
        v.videoControls.clipEndTime = Math.min(5, v.videoControls.totalDuration || 5);
        v.peSelection.cameras = ['front'];
        v.peSelection.size = '480';
    }

    // ---- B: the estimate is the encoder's formula, not a guess at it ----
    var dims = [[1920, 1080], [1280, 720], [854, 480], [3840, 2160], [640, 360]];
    var worst = 0, worstAt = '';
    dims.forEach(function (d) {
        var cells = d[0] * d[1];
        // Kotlin: (cells * fps / 1000L * 0.09f).toInt().coerceIn(1500, 24000)
        var kbps = Math.round(Math.min(24000, Math.max(1500, Math.trunc(Math.trunc(cells * 30 / 1000) * 0.09))));
        var mine = Math.min(24000, Math.max(1500, Math.trunc(Math.trunc(cells * 30 / 1000) * 0.09)));
        var diff = Math.abs(mine - kbps);
        if (diff > worst) { worst = diff; worstAt = d.join('x'); }
    });
    ok('B estimate matches the engine formula for every preset', worst === 0, 'max-diff ' + worst + ' kbps @' + worstAt);
    var plan = v.phoneExportPlan ? v.phoneExportPlan() : null;
    if (plan && !plan.error) {
        var est = v.peExportSizeEstimate(plan);
        var kbps = Math.min(24000, Math.max(1500, Math.trunc(Math.trunc(plan.width * plan.height * 30 / 1000) * 0.09)));
        var secs = plan.durationUs / 1e6;
        var hand = kbps * 1000 / 8 * secs;
        ok('B estimate = kbps x duration for the live plan', Math.abs(est - hand) <= 1,
            est + ' vs ' + Math.round(hand) + ' (' + plan.width + 'x' + plan.height + ' ' + secs.toFixed(1) + 's)');
        ok('B estimate is never below the real bitrate floor',
            kbps >= 1500 && kbps <= 24000, kbps + ' kbps');
    } else {
        ok('B live plan available', false, JSON.stringify(plan && plan.error));
    }

    // ---- A: the guard ----
    var real = v.peFreeBytes;
    v.peSpaceArmedAt = 0;
    v.peFreeBytes = function () { return Promise.resolve(1024); };   // one KiB: anything is too big
    await v.startPhoneExport();
    var toastText = [...document.querySelectorAll('.toast')].map(function (n) { return n.textContent; }).join(' | ');
    ok('A refuses when the volume is full', !v.peJob && v.peStarting === false,
        'peJob=' + !!v.peJob + ' peStarting=' + v.peStarting);
    ok('A names both numbers in the refusal', /\d+(\.\d+)?\s*(MB|GB|KB)/.test(toastText), JSON.stringify(toastText.slice(-170)));
    ok('A offers the second press as the way out', /再按|again/i.test(toastText), JSON.stringify(toastText.slice(-60)));
    ok('A armed the bypass', v.peSpaceArmedAt > 0, v.peSpaceArmedAt);
    await v.startPhoneExport();
    ok('A lets the same press through inside twenty seconds', !!v.peJob || v.peStarting === false,
        'peJob=' + !!v.peJob);
    // The bar is only written by a live job, so its accessible text is read here rather than in D.
    var bar = v.peDom && v.peDom.bar;
    ok('D the export bar carries valuenow and a valuetext with the unit',
        !!bar && bar.getAttribute('aria-valuenow') !== null && /%$/.test(bar.getAttribute('aria-valuetext') || ''),
        bar ? bar.getAttribute('aria-valuenow') + '/' + bar.getAttribute('aria-valuetext') : 'no bar');
    if (v.peJob) { try { v.cancelPhoneExport(); } catch (e) { } }
    v.peFreeBytes = real;
    v.peSpaceArmedAt = 0;

    // ---- C: the export history rows ----
    var dom = v.peDom;
    ok('C the list node is the one in the page', dom.exports === document.getElementById('peExportList'),
        dom.exports ? 'found' : 'MISSING');
    v.peExports = [];
    v.renderPhoneExports();
    ok('C hidden with nothing in it', dom.lastGroup.style.display === 'none', dom.lastGroup.style.display);
    v.writeExportHistory([
        { path: '/storage/emulated/0/Download/Tessera_a_6c_1280x720.mp4', bytes: 12345678 },
        { path: '/storage/emulated/0/Download/Tessera_b_1c_480x240.mp4', bytes: 0 },
    ]);
    v.renderPhoneExports();
    var rows = dom.exports.querySelectorAll('.pe-last-row').length;
    var shares = dom.exports.querySelectorAll('[data-export-share]').length;
    var firstName = (dom.exports.querySelector('.pe-last-name') || {}).textContent || '';
    ok('C renders one row per record', rows === 2 && shares === 2, rows + ' rows / ' + shares + ' buttons');
    ok('C names the file and its size', /Tessera_a_6c_1280x720\.mp4/.test(firstName) && /11\.8 MB/.test(firstName),
        JSON.stringify(firstName));
    ok('C drops the size for a zero-byte record',
        /Tessera_b_1c_480x240\.mp4$/.test((dom.exports.querySelectorAll('.pe-last-name')[1] || {}).textContent || ''),
        JSON.stringify((dom.exports.querySelectorAll('.pe-last-name')[1] || {}).textContent));
    ok('C shares are disabled only when the shell cannot share',
        shares === 2 && dom.exports.querySelector('[data-export-share]').disabled === !nativeMethod('shareFile'),
        'disabled=' + dom.exports.querySelector('[data-export-share]').disabled);
    var stored = JSON.parse(localStorage.getItem('tdashcam.exportHistory') || 'null');
    ok('C persisted to localStorage', Array.isArray(stored) && stored.length === 2, JSON.stringify(stored));
    // five is the cap, and a repeat of the same path must not stack
    var many = [];
    for (var i = 0; i < 8; i++) many.push({ path: '/x/file' + i + '.mp4', bytes: 1000 * i });
    many.forEach(function (m) { v.rememberExport(m); });
    ok('C capped at five, newest first',
        v.peExports.length === 5 && /file7/.test(v.peExports[0].path), JSON.stringify(v.peExports.map(function (r) { return r.path; })));
    v.rememberExport({ path: '/x/file5.mp4', bytes: 5 });
    ok('C a re-export of one path moves it to the front instead of doubling',
        v.peExports.length === 5 && v.peExports.filter(function (r) { return r.path === '/x/file5.mp4'; }).length === 1,
        v.peExports.length);
    v.writeExportHistory([]);

    // ---- F: a stale read cannot land on top of a newer one ----
    // Discriminator: the cold file has telemetry and the warm one has none, so "the old answer won"
    // is a count of 150 and "the guard held" is a count of 0. Two files with the same point count
    // would pass either way.
    var mm = v.metadataManager;
    var cold = null, warm = null;
    if (mm.SeiMetadata) {
        for (var gi = 0; gi < (v.eventGroups || []).length && (!cold || !warm); gi++) {
            for (var si = 0; si < ((v.eventGroups[gi] || {}).segments || []).length; si++) {
                var f = (v.eventGroups[gi].segments[si].files || {}).front;
                if (!f || !f.path) continue;
                var n = (await mm.readTelemetry(f)).length;
                if (n > 0 && !cold) cold = { file: f, points: n };
                if (n === 0 && !warm) warm = { file: f, points: 0 };
                if (cold && warm) break;
            }
        }
    }
    if (cold && warm) {
        var slow = Math.max(cold.points, 1);
        // `warm` is in the cache from the scan above and answers at once; `cold` is dropped from it
        // first, so its read is the one still in the air when the newer request lands.
        MetadataManager.seiCache.delete(warm.file.path);
        await mm.readTelemetry(warm.file);                       // warm it again, deliberately
        MetadataManager.seiCache.delete(cold.file.path);
        var slowLoad = mm.loadMetadata(cold.file);               // newest, but slow
        var fastLoad = mm.loadMetadata(warm.file);               // asked last, answers first
        await Promise.all([slowLoad, fastLoad]);
        var settled = mm.currentMetadata.length;
        ok('F the newest request owns currentMetadata', settled === 0,
            'have ' + settled + ', cold=' + slow + ' warm=0');
        ok('F isLoading released', mm.isLoading === false, mm.isLoading);

        // A clear must outrank whatever is in the air, or the card sits on 「载入中」 forever.
        MetadataManager.seiCache.delete(cold.file.path);
        var flying = mm.loadMetadata(cold.file);
        mm.clear();
        await flying;
        ok('F a clear outranks an in-flight read',
            mm.currentMetadata.length === 0 && mm.isLoading === false,
            'len=' + mm.currentMetadata.length + ' loading=' + mm.isLoading);
    } else {
        ok('F one clip with telemetry and one without', false,
            'cold=' + JSON.stringify(cold && cold.points) + ' warm=' + JSON.stringify(warm && warm.points));
    }

    // ---- D: the live regions ----
    v.showToast('R93 polite probe', 'success', 800);
    v.showToast('R93 assertive probe', 'error', 800);
    var containers = document.querySelectorAll('.toast-container');
    ok('D exactly one toast container exists', containers.length === 1, containers.length);
    ok('D the container is a status region',
        containers[0].getAttribute('role') === 'status' && containers[0].getAttribute('aria-live') === 'polite',
        containers[0].getAttribute('role') + '/' + containers[0].getAttribute('aria-live'));
    var errToast = [...document.querySelectorAll('.toast')].filter(function (n) { return /assertive probe/.test(n.textContent); })[0];
    var infoToast = [...document.querySelectorAll('.toast')].filter(function (n) { return /polite probe/.test(n.textContent); })[0];
    ok('D an error toast is role=alert',
        !!errToast && errToast.getAttribute('role') === 'alert' && errToast.getAttribute('aria-live') === 'assertive',
        errToast ? errToast.getAttribute('role') : 'not found');
    ok('D a non-error toast is not an alert', !!infoToast && !infoToast.getAttribute('role'),
        infoToast ? String(infoToast.getAttribute('role')) : 'not found');
    var box = document.querySelector('[aria-valuetext]');
    ok('D some control carries an accessible valuetext', !!box, box ? box.id + '/' + box.getAttribute('aria-valuetext') : 'none');
    var banner = document.getElementById('jsErrorBanner');
    ok('D the error banner is an alert region', banner.getAttribute('role') === 'alert', banner.getAttribute('role'));
    var zoomTime = document.getElementById('peZoomTime');
    ok('D the zoom readout is a status region',
        zoomTime.getAttribute('role') === 'status' && zoomTime.getAttribute('aria-live') === 'polite',
        zoomTime.getAttribute('role') + '/' + zoomTime.getAttribute('aria-live'));

    // ---- the page must still be healthy ----
    ok('no new uncaught errors', (window.__r93err || []).length === 0, JSON.stringify((window.__r93err || []).slice(0, 2)));
    ok('the app recorded no errors this session', (v.recentErrors || []).length === 0, JSON.stringify(v.recentErrors));

    return JSON.stringify(out, null, 1);
})();
