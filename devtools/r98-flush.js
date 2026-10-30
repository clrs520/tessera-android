// R98-C3: the destructive half. The undo bar is only honest if the files really go when the fuse
// burns out, so this runs the flush on purpose — on the oldest fixture event, pulled off the device
// first by r98-flush.sh so the fixture can be put back.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (name, cond, detail) => (cond ? out.pass : out.fail)
        .push(name + (detail === undefined ? '' : ' = ' + detail));

    const target = v.eventGroups[v.eventGroups.length - 1];
    const folder = String(target.eventId).split('/').pop();
    const targets = v.eventDeleteTargets(target);
    const groupsBefore = v.eventGroups.length;
    const filesBefore = v.allFiles.length;
    const starredBefore = v.starredIds ? v.starredIds.has(target.eventId) : false;
    const positionBefore = v.readPositionMap()[target.eventId];

    v.pendingDelete = { event: target, targets };
    await v.confirmDeleteEvent();
    await sleep(100);
    ok('C3 armed, the card is already gone but the job is still open',
        v.eventGroups.length === groupsBefore - 1 && !!v.pendingDeleteUndo, folder);
    ok('C3 the undo bar is showing with the target inside it',
        !!document.querySelector('.toast.has-action .toast-action'),
        (document.querySelector('.toast.has-action') || {}).textContent);

    await v.flushPendingDelete();
    await sleep(300);
    ok('C3 flushing clears the armed job and does not leave a second one',
        v.pendingDeleteUndo === null, String(v.pendingDeleteUndo));
    ok('C3 the card stays gone', v.eventGroups.length === groupsBefore - 1,
        `${groupsBefore} -> ${v.eventGroups.length}`);
    ok('C3 the unlisted files leave allFiles too',
        v.allFiles.length === filesBefore - targets.length,
        `${filesBefore} - ${targets.length} -> ${v.allFiles.length}`);
    ok('C3 the success toast names how many went',
        [...document.querySelectorAll('.toast')].some(t => /已删除/.test(t.textContent)),
        [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' / '));
    // The dead-id sweep (R85) has to follow the real delete, not the armed one.
    ok('C3 a dead id leaves the star set and the resume map',
        !(v.starredIds && v.starredIds.has(target.eventId)) && v.readPositionMap()[target.eventId] === undefined,
        `star ${starredBefore}->${v.starredIds && v.starredIds.has(target.eventId)} pos ${JSON.stringify(positionBefore)}->${JSON.stringify(v.readPositionMap()[target.eventId])}`);
    const groupsAfter = v.eventGroups.length;
    await v.flushPendingDelete();
    await sleep(200);
    ok('C3 flushing with nothing armed changes nothing',
        v.eventGroups.length === groupsAfter && v.allFiles.length === filesBefore - targets.length,
        `${v.eventGroups.length}/${v.allFiles.length}`);
    out.folder = folder;
    out.targets = targets;
    out.summary = `pass=${out.pass.length} fail=${out.fail.length}`;
    return out;
})()
