// Regenerate a CDP expression that hot-swaps the current src/styles.css into the running app,
// so a layout change can be measured before spending ten minutes on a build.
import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync('TDashcamStudio/src/styles.css', 'utf8');
const expr = `(() => {
  let el = document.getElementById('injected-styles');
  if (!el) { el = document.createElement('style'); el.id = 'injected-styles'; document.head.appendChild(el); }
  el.textContent = ${JSON.stringify(css)};
  return 'injected ' + el.textContent.length + ' bytes';
})()`;
writeFileSync('devtools/.tmp-inject-styles.js', expr);
console.log('wrote devtools/.tmp-inject-styles.js (' + expr.length + ' chars)');
