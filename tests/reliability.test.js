const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const core = require('../editor/core.js');
const comparison = require('../editor/comparison.js');
const project = require('../editor/project.js');
const sample = require('../editor/sample.js');
const specBuilder = require('../editor/spec-builder.js');
const drafts = require('../editor/drafts.js');

test('оптимизация сохраняет результат JavaScript на сложных границах токенов', () => {
  const scripts = [
    'var result = /[/ ]/.test(" ");',
    'var a = 4; var result = a / /[/ ]/.test(" ");',
    'var result = /[\\/ =]/.test(" ");',
    'var a = 1; var result = a + +a;',
    'var result = 1 .toString();',
    'function f() { return\n { ok: true }; } var result = f();',
    'var result = String.raw` x  ${`inner ${2 + 3}`} y `;',
    'var result = (() => { /* preserve */ return 3; })();',
    'var result = ({ get value() { return 2; } }).value;',
    'var result = (() => { let a=1; a\n++a; return a; })();'
  ];
  for (const source of scripts) {
    const html = '<script>' + source + '</script>';
    const optimized = core.optimizeHtml(html).html.slice(8, -9);
    const before = {}; const after = {};
    vm.runInNewContext(source, before);
    vm.runInNewContext(optimized, after);
    assert.equal(JSON.stringify(after.result), JSON.stringify(before.result), source);
  }
});

test('CSS сохраняет селекторы, строковые значения и пользовательские свойства', () => {
  const css = '.box :first-child { color: red; } .box::before { content: "a ;} b"; } :root { --gap:  2px; }';
  const result = core.optimizeHtml('<style>' + css + '</style>').html;
  assert.match(result, /\.box :first-child/);
  assert.match(result, /content:"a ;} b"/);
  assert.match(result, /--gap:  2px/);
});

test('HTML сохраняет разделители атрибутов, текст и непрозрачные области', () => {
  const html = '<img src=data:,x /><div data-text="a >  b">A</div> <div>B</div>' +
    '<script data-type="text/javascript" type="application/ld+json">{ "text": "  a  " }</script>' +
    '<template><template>  nested </template> after </template><pre>  x  </pre>';
  const result = core.optimizeHtml(html).html;
  assert.equal(result, html);
  assert.equal(core.optimizeHtml('  ' + html + '\r\n', { enabled: false }).html, '  ' + html + '\r\n');
});

test('неподдерживаемый синтаксис не переписывается оптимизатором', () => {
  const source = '<script>const future = ???;</script><style>.box { broken ??? }</style>';
  assert.equal(core.optimizeHtml(source).html, source);
});

test('защитная вставка всегда предшествует пользовательским строкам и разметке', () => {
  for (const html of ['<!doctype html><title>Example <head></title>', '<script>var text="<head>";</script>', '<!-- <head> --><body>x</body>']) {
    const result = core.buildPreviewDocument(html, '</script><script>bad()</script>');
    assert.match(result, /^<!doctype html><meta http-equiv="Content-Security-Policy"/);
    assert.ok(result.indexOf('Content-Security-Policy') < result.indexOf('<head>'));
    assert.doesNotMatch(result, /<script>bad\(\)<\/script>/);
  }
});

function validReport() {
  const item = sample.getById('brick-breaker');
  const html = item.html;
  const specification = { ...item.spec, difficulty: 3 };
  const checks = core.validateHtml(html, specification, { quietZone: 4, runtime: { horizontalOverflow: false, verticalOverflow: false, controls: [], errors: [], blocked: [] } });
  return { reportVersion: '0.1', validatorVersion: core.VALIDATOR_VERSION, application: { id: 'test', title: 'Тест' }, specification,
    measurements: { htmlBytes: core.byteLength(html), dataUrlBytes: core.byteLength(core.makeDataUrl(html)), encoding: 'base64', qr: { version: 35, ecc: 'M', quietZone: 4 }, checksum: { value: 'test' } },
    roundtrip: { ok: true }, validation: { summary: core.summarizeChecks(checks), checks } };
}

test('импорт отчёта отклоняет потерянные и противоречивые результаты', () => {
  assert.doesNotThrow(() => comparison.normalize(validReport()));
  const mutations = [
    r => delete r.validation,
    r => delete r.validation.summary.fail,
    r => { r.validation.summary.fail = -1; },
    r => { r.validation.summary.pass++; },
    r => { r.validation.checks = []; },
    r => { r.validation.checks.push(r.validation.checks[0]); },
    r => { r.measurements.qr.version = 41; },
    r => { r.measurements.htmlBytes = '100'; },
    r => delete r.roundtrip.ok
  ];
  mutations.forEach(mutate => { const report = validReport(); mutate(report); assert.throws(() => comparison.normalize(report)); });
});

test('проект сохраняет отключённую оптимизацию и открывает прежние настройки', () => {
  const input = { html: sample.html, specification: sample.spec, settings: { optimize: false } };
  assert.equal(project.parse(project.serialize(input)).settings.optimize, false);
  delete input.settings.optimize;
  assert.equal(project.parse(project.serialize(input)).settings.optimize, true);
});

test('метаданные и doctype учитываются только в настоящей разметке документа', () => {
  const metadata = '<meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">';
  const spec = specBuilder.build({});
  for (const body of ['<!--' + metadata + '-->', '<textarea>' + metadata + '</textarea>', '<template>' + metadata + '</template>',
    '<script>var markup=' + JSON.stringify(metadata) + ';</script>', '<title>' + metadata + '</title>']) {
    const checks = core.validateHtml('<!doctype html>' + body, spec);
    for (const id of ['charset', 'viewport']) assert.equal(checks.find(check => check.id === id).status, 'fail', body);
  }
  assert.equal(core.validateHtml('<!doctype html><!--<!doctype html>-->' + metadata, spec)[0].status, 'pass');
  assert.equal(core.validateHtml('<!doctype html><!doctype html>' + metadata, spec)[0].status, 'fail');
});

test('проверка зависимостей разбирает все атрибуты, CSS и JavaScript', () => {
  const html = '<img data-src="data:,placeholder" src="https://example.invalid/real.png">' +
    '<img src="data:,x" srcset="data:image/png;base64,a 1x, https://example.invalid/double.png 2x">' +
    '<style>/* url(https://example.invalid/comment) */ @import "https://example.invalid/style"; b{background:url(https://example.invalid/bg)}</style>' +
    '<script>var text="fetch()"; /* new WebSocket() */ window["fetch"]("/test");</script>';
  const external = core.findExternalResources(html).join('\n');
  for (const name of ['real.png', 'double.png', '/style', '/bg']) assert.ok(external.includes(name), name);
  assert.doesNotMatch(external, /comment|placeholder/);
  assert.deepEqual(core.findNetworkApis(html), ['fetch()']);
  assert.deepEqual(core.findNetworkApis('<p>fetch() XMLHttpRequest</p><script>var text="fetch()";</script>'), []);
  assert.deepEqual(core.findNetworkApis('<button onclick="return fetch(\'/x\')">Go</button>'), ['fetch()']);
  assert.ok(core.findExternalResources('<iframe srcdoc="&lt;img src=&quot;https://example.invalid/nested&quot;&gt;"></iframe>').some(value => value.includes('/nested')));
});

test('QR без белого поля не проходит проверку, а неизвестные параметры остаются ожидающими', () => {
  for (const quietZone of [0, 1, 3, 4, 8, undefined]) {
    const check = core.validateHtml(sample.html, sample.spec, { quietZone }).find(check => check.id === 'qr-quiet-zone');
    assert.equal(check.status, quietZone == null ? 'pending' : quietZone < 4 ? 'fail' : 'pass');
  }
});

test('состав отчёта соответствует всему профилю, версии валидатора и геометрии QR', () => {
  const report = validReport();
  for (const missing of ['viewport', 'external-resources', 'network-apis', 'difficulty', 'horizontal-overflow', 'source-analysis', 'qr-quiet-zone']) {
    const reduced = structuredClone(report);
    reduced.validation.checks = reduced.validation.checks.filter(check => check.id !== missing);
    reduced.validation.summary = core.summarizeChecks(reduced.validation.checks);
    assert.throws(() => comparison.normalize(reduced), /обязательная проверка/, missing);
  }
  const old = structuredClone(report); delete old.validatorVersion;
  assert.throws(() => comparison.normalize(old), /версией валидатора/);
  const wrong = structuredClone(report); wrong.measurements.qr.quietZone = 0;
  assert.throws(() => comparison.normalize(wrong), /белого поля противоречит/);
  wrong.validation.checks.find(check => check.id === 'qr-quiet-zone').status = 'fail';
  wrong.validation.summary = core.summarizeChecks(wrong.validation.checks);
  assert.equal(comparison.normalize(wrong).automaticReady, false);
  const uncertain = structuredClone(report);
  uncertain.validation.checks.find(check => check.id === 'source-analysis').status = 'warn';
  uncertain.validation.summary = core.summarizeChecks(uncertain.validation.checks);
  assert.equal(comparison.normalize(uncertain).automaticReady, false);
  for (const item of sample.items) for (const ecc of ['M', 'L']) {
    const actual = core.validateHtml(item.html, item.spec, { ecc }).map(check => check.id).sort();
    assert.deepEqual(actual, core.expectedCheckIds(item.spec, ecc).sort());
  }
});

test('сравнение различает критерии даже при одинаковых ID и контрольных суммах', () => {
  const report = validReport();
  const changed = structuredClone(report);
  changed.specification.technical.networkRequests = true;
  changed.validation.checks = changed.validation.checks.filter(check => check.id !== 'network-apis');
  changed.validation.summary = core.summarizeChecks(changed.validation.checks);
  const first = comparison.upsert([], report, 'same.json');
  const second = comparison.upsert(first.items, changed, 'same.json');
  assert.equal(second.items.length, 2);
  assert.equal(comparison.summarize(second.items).mixedProfiles, true);
  assert.equal(comparison.summarize(second.items).mixedAssignments, false);
});

function draftSnapshot(source = '  <!doctype html>\r\n<pre>не закончено  ') {
  return { format: drafts.FORMAT, version: '0.1', fields: { source, spec: '{"unfinished":', 'optimize-source': false },
    mode: 'code', specEditorMode: 'json', questions: [{ prompt: '', answers: ['', 'ответ'], correct: 1 }], qrEmulation: null };
}

function draftStorage() {
  const values = new Map();
  return { get length() { return values.size; }, key: index => [...values.keys()][index],
    getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('черновик сохраняет незавершённые поля и исходный текст без нормализации', () => {
  const snapshot = draftSnapshot();
  assert.deepEqual(drafts.parse(drafts.serialize(snapshot)), snapshot);
  assert.throws(() => drafts.parse('{"format":"qr-microapps-draft","version":"9"}'), /версия/);
  assert.throws(() => drafts.parse('x'.repeat(drafts.MAX_TEXT_LENGTH + 1)), /велик/);
});

test('автосохранения вкладок независимы, а история хранит последние версии', () => {
  const storage = draftStorage();
  const first = drafts.createStore(() => storage, 'first');
  const second = drafts.createStore(() => storage, 'second');
  first.save(draftSnapshot('first text'));
  second.save(draftSnapshot('second text'));
  for (let i = 0; i < 25; i++) first.save(draftSnapshot(String(i)), 'Версия ' + i, true);
  const reopened = drafts.createStore(() => storage, 'first');
  assert.equal(reopened.latest().snapshot.fields.source, 'first text');
  assert.equal(second.latest().snapshot.fields.source, 'second text');
  const history = reopened.list().filter(record => record.kind === 'history');
  assert.equal(history.length, drafts.HISTORY_LIMIT);
  assert.equal(history[0].snapshot.fields.source, '24');
  assert.equal(history.at(-1).snapshot.fields.source, '5');
});

test('ошибка хранилища не уничтожает черновик и предыдущую сохранённую копию', () => {
  const storage = draftStorage();
  const store = drafts.createStore(() => storage, 'tab');
  assert.equal(store.save(draftSnapshot('saved')), true);
  storage.setItem(drafts.PREFIX + 'damaged', '{');
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(store.save(draftSnapshot('new text')), false);
  assert.equal(store.latest().snapshot.fields.source, 'new text');
  assert.equal(JSON.parse(storage.getItem(drafts.PREFIX + 'tab')).snapshot.fields.source, 'saved');
  assert.match(store.error(), /Quota/);
  const denied = drafts.createStore(() => { throw new Error('SecurityError'); }, 'denied');
  assert.equal(denied.save(draftSnapshot('in memory')), false);
  assert.equal(denied.latest().snapshot.fields.source, 'in memory');
});
