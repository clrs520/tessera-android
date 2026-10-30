const fs = require('fs');
for (const f of process.argv.slice(2)) {
  let j;
  try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(f, 'unparsed'); continue; }
  const row = (s) => `${s.tag}: lang=${s.lang} calls=${s.calls} show=${/show/.test(s.cls)} sameModal=${s.sameModal} peDom=${s.peDom} sizes=${s.sizes.join('/')}`;
  console.log('== ' + f + '  renderDuringFlip=' + j.renderDuringFlip);
  console.log('   ' + row(j.before));
  console.log('   ' + row(j.sync));
  console.log('   ' + row(j.after));
}
