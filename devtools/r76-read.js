(function () {
    var v = window.viewer;
    if (!v) {
        return 'NO-VIEWER (the page reloaded after the measurement; the ledgers are gone)';
    }
    var mm = v.metadataManager;
    var mcp = v.multiCameraPlayer;
    var cp = v.continuousPlayer;
    var box = function (x) { return Array.isArray(x) ? x.join('\n') : String(x); };
    var out = [];
    out.push('lossLog=' + (mcp && mcp.lossLog ? mcp.lossLog.length : 'n/a')
        + ' axisLog=' + (cp && cp.axisLog ? cp.axisLog.length : 'n/a')
        + ' holdLog=' + (mcp && mcp.holdLog ? mcp.holdLog.length : 'n/a'));
    out.push('idx=' + (cp ? cp.currentSegmentIndex : 'n/a')
        + ' playing=' + (mcp ? !!mcp.isPlaying : 'n/a')
        + ' layout=' + (mcp ? mcp.layoutMode : 'n/a')
        + ' transitioning=' + (cp ? !!cp.isTransitioning : 'n/a'));
    out.push('--- describeLoss ---');
    out.push(box(mcp && mcp.describeLoss ? mcp.describeLoss() : 'missing'));
    out.push('--- describeAxis ---');
    out.push(box(cp && cp.describeAxis ? cp.describeAxis() : 'missing'));
    out.push('--- describeHolds ---');
    out.push(box(mcp && mcp.describeHolds ? mcp.describeHolds() : 'missing'));
    out.push('--- describeFeeds ---');
    out.push(box(mcp && mcp.describeFeeds ? mcp.describeFeeds() : 'missing'));
    return out.join('\n');
})();
