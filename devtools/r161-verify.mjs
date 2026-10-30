// R160/R161 focused regression, one command. Fixtures:
//   bash devtools/r160-fixtures.sh          # split / sidecars / gap
//   bash devtools/r160-fixtures.sh probe    # 350-clip probe fixture
// Usage: node devtools/r161-verify.mjs
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const runFile = (file, timeout = 240000) => {
    const res = spawnSync(process.execPath, [join(root, 'devtools/cdp-eval.mjs'), '--file', file], {
        cwd: root,
        encoding: 'utf8',
        timeout,
        env: { ...process.env, CDP_TIMEOUT_MS: String(timeout) },
    });
    const text = `${res.stdout || ''}${res.stderr || ''}`;
    const at = text.indexOf('{');
    if (at < 0) return { error: text.trim().slice(0, 300) || `exit ${res.status}` };
    try { return JSON.parse(text.slice(at)); } catch (e) { return { error: `parse: ${e.message}` }; }
};

const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });

const identity = runFile('devtools/r160-identity.js');
writeFileSync('devtools/r161-verify-identity.json', JSON.stringify(identity, null, 1));
check('identity: 10/10 (split modes keep stars + resume)', identity.failed === 0 && identity.results?.length === 10,
    identity.error || `failed=${identity.failed} results=${identity.results?.length}`);

const sidecars = runFile('devtools/r160-sidecars.js');
writeFileSync('devtools/r161-verify-sidecars.json', JSON.stringify(sidecars, null, 1));
check('sidecars: native batch, one malformed file counted', sidecars.wiring?.source === 'native'
    && sidecars.wiring?.failures === 1 && sidecars.direct?.count === 4
    && sidecars.direct?.rows?.[3]?.ok === false && sidecars.wiring?.city === 'City 1',
    sidecars.error || JSON.stringify({ source: sidecars.wiring?.source, failures: sidecars.wiring?.failures }));

const cache = runFile('devtools/r160-cache.js');
writeFileSync('devtools/r161-verify-cache.json', JSON.stringify(cache, null, 1));
check('cache: mode switches read no sidecars', cache.firstSource === 'cache'
    && cache.secondSource === 'cache' && cache.nativeReadCount === 0 && cache.events === 300,
    cache.error || JSON.stringify({ first: cache.firstSource, second: cache.secondSource, reads: cache.nativeReadCount }));

const gap = runFile('devtools/r160-gap-a11y.js');
writeFileSync('devtools/r161-verify-gap.json', JSON.stringify(gap, null, 1));
check('gap: major tap speaks, minor stays silent and decorative', gap.markers?.major === 1
    && gap.markers?.minor === 2 && gap.markers?.majorSpoke === true
    && gap.markers?.minorSilent === true && gap.markers?.minorPointer === 'none',
    gap.error || JSON.stringify(gap.markers || gap));

const probe = runFile('devtools/r161-probe-many.js');
writeFileSync('devtools/r161-verify-probe.json', JSON.stringify(probe, null, 1));
check('probe: all 350 unmeasured clips get a duration', probe.segments === 350
    && probe.filled === 350 && probe.missing === 0 && probe.learned === true,
    probe.error || JSON.stringify({ segments: probe.segments, filled: probe.filled, missing: probe.missing }));

let failed = 0;
for (const c of checks) {
    if (!c.ok) failed += 1;
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.ok ? '' : `  —  ${c.detail}`}`);
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
