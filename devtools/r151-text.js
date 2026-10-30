// R151 判据（批二 #25）：英文单复数走逐词词表，中文保持原样。只读字典与纯函数，不碰 DOM。
(async () => {
  const out = { checks: [], pass: 0, total: 0 };
  const ok = (name, pass, detail) => { out.total++; if (pass) out.pass++; out.checks.push({ name, pass: !!pass, detail }); };
  const en = i18n.en, zh = i18n.zh;
  const fill = (tpl, n, wordKey) => tpl.replace('{n}', n).replace(`{${wordKey}}`, pluralWord(en, wordKey.replace('Word', ''), n));

  const one = n => fill(en.refreshDone, n, 'eventsWord');
  ok('en refreshDone agrees at 1 and 2', one(1) === 'Found 1 event' && one(2) === 'Found 2 events', { one: one(1), two: one(2) });
  ok('en refreshUnchanged agrees', fill(en.refreshUnchanged, 1, 'eventsWord') === 'Already up to date (1 event)',
    { one: fill(en.refreshUnchanged, 1, 'eventsWord') });

  const files = n => fill(en.deleteConfirmCount.replace('{dir}', 'X'), n, 'filesWord');
  ok('en delete count agrees', files(1) === '1 file in X' && files(3) === '3 files in X', { one: files(1), three: files(3) });
  ok('en deleteDone agrees', fill(en.deleteDone, 1, 'filesWord') === 'Deleted 1 file', { one: fill(en.deleteDone, 1, 'filesWord') });
  ok('en deletePartial has a one-file sentence', en.deletePartial_one === '1 file was deleted, the rest are still on disk: {msg}',
    { one: en.deletePartial_one });
  ok('en noEventsFromFiles agrees', fill(en.noEventsFromFiles, 1, 'filesWord').startsWith('1 file here'), 
    { one: fill(en.noEventsFromFiles, 1, 'filesWord').slice(0, 30) });

  ok('en grid summary agrees', fill(en.peGridInfo, 1, 'viewsWord').startsWith('1 view ·') && fill(en.peGridInfo, 2, 'viewsWord').startsWith('2 views ·'),
    { one: fill(en.peGridInfo, 1, 'viewsWord').slice(0, 18), two: fill(en.peGridInfo, 2, 'viewsWord').slice(0, 18) });

  const v = window.viewer;
  // engineText reads the *current* UI language; pin it so this check does not ride on whatever
  // language the last suite left behind.
  const wasLang = v.currentLanguage;
  v.setLanguage('en');
  await new Promise(r => setTimeout(r, 400));
  const et1 = v.engineText({ code: 'encoding', n: 1, frames: 1, w: 1920, h: 1080, encoder: 'c2.qti' });
  const et2 = v.engineText({ code: 'encoding', n: 6, frames: 301, w: 1920, h: 1080, encoder: 'c2.qti' });
  v.setLanguage(wasLang);
  await new Promise(r => setTimeout(r, 300));
  ok('en engine text agrees on views and frames',
    et1.includes('1 view') && et1.includes('1 frame') && et2.includes('6 views') && et2.includes('301 frames'),
    { one: et1, many: et2 });

  const mins = n => `${n} ${pluralWord(en, 'minutes', n)}`;
  ok('en minutes noun agrees', mins(1) === '1 minute' && mins(10) === '10 minutes', { one: mins(1), ten: mins(10) });

  const zhOne = zh.refreshDone.replace('{n}', 1).replace('{eventsWord}', pluralWord(zh, 'events', 1));
  const zhFiles = zh.deleteDone.replace('{n}', 1).replace('{filesWord}', pluralWord(zh, 'files', 1));
  const zhViews = zh.peGridInfo.replace('{n}', 1).replace('{viewsWord}', pluralWord(zh, 'views', 1)).slice(0, 6);
  ok('zh is unchanged by the plural work',
    zhOne === '找到 1 个事件' && zhFiles === '已删除 1 个文件' && zhViews.startsWith('1 路 ·'),
    { events: zhOne, files: zhFiles, views: zhViews });

  return JSON.stringify(out);
})()
