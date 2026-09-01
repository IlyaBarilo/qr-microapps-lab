const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../editor/core.js');
const sample = require('../editor/sample.js');
const simpleBuilder = require('../editor/simple-builder.js');
const specBuilder = require('../editor/spec-builder.js');
const history = require('../editor/history.js');
const projectFile = require('../editor/project.js');
const comparison = require('../editor/comparison.js');
const deviceTest = require('../editor/device-test.js');

test('тест устройства формирует самостоятельный быстрый лист и шесть страниц полного набора', () => {
  const simpleGame = sample.getById('tiny-quiz');
  const brickGame = sample.getById('brick-breaker');
  const lowCorrectionGame = sample.getById('cyber-maze-3d');
  const suite = deviceTest.createTestSuite({ simpleHtml: simpleGame.html, brickHtml: brickGame.html, lowCorrectionHtml: lowCorrectionGame.html });
  assert.equal(suite.quick.length, 1);
  assert.deepEqual(suite.full.map((page) => [page.id, page.items.length]), [
    ['overview', 4],
    ['threshold', 4],
    ['correction', 4],
    ['encoding', 4],
    ['density', 4],
    ['iphone-manual', 4]
  ]);
  assert.deepEqual(suite.quick[0].items.map((item) => item.id), ['Q1', 'Q2', 'Q3', 'Q4']);
  assert.deepEqual(suite.full[0].items.map((item) => item.id), ['A1', 'A2', 'A3', 'A4']);
  assert.deepEqual(suite.full[1].items.map((item) => item.id), ['B1', 'B2', 'B3', 'B4']);
  assert.deepEqual(suite.full[2].items.map((item) => item.id), ['C1', 'C2', 'C3', 'C4']);

  const quickItems = suite.quick[0].items;
  assert.equal(quickItems[0].payload, 'https://github.com/IlyaBarilo/qr-microapps-lab');
  assert.match(quickItems[1].payload, /^https:\/\/github\.com\/IlyaBarilo\/qr-microapps-lab#/);
  assert.equal(quickItems[1].payloadBytes, quickItems[3].payloadBytes);
  assert.equal(core.parseDataUrl(quickItems[2].payload).text, simpleGame.html, 'HTML мини-теста нельзя изменять или дополнять.');
  assert.equal(core.parseDataUrl(quickItems[3].payload).text, brickGame.html, 'HTML игры «Разбей блоки» нельзя изменять или дополнять.');
  assert.equal(core.parseDataUrl(suite.full[0].items[2].payload).text, simpleGame.html);
  assert.equal(core.parseDataUrl(suite.full[0].items[3].payload).text, brickGame.html);
  assert.ok(suite.full[1].items.every((item) => item.payload === quickItems[3].payload));
  assert.ok(suite.full[2].items.every((item) => item.payload.startsWith('https://github.com/IlyaBarilo/qr-microapps-lab#')));
  assert.deepEqual(suite.full[1].items.map((item) => item.moduleMm), [0.50, 0.40, 0.32, 0.25]);
  assert.deepEqual(suite.full[2].items.map((item) => item.ecc), ['L', 'M', 'Q', 'H']);

  const encodingItems = suite.full[3].items;
  assert.deepEqual(encodingItems.map((item) => item.id), ['D1', 'D2', 'D3', 'D4']);
  assert.equal(core.parseDataUrl(encodingItems[1].payload).text, encodingItems[0].payload);
  assert.equal(core.parseDataUrl(encodingItems[2].payload).text, encodingItems[0].payload);
  assert.equal(core.parseDataUrl(encodingItems[3].payload).text, encodingItems[0].payload);
  assert.equal(core.parseDataUrl(encodingItems[1].payload).encoding, 'percent');
  assert.equal(core.parseDataUrl(encodingItems[2].payload).encoding, 'percent');
  assert.equal(core.parseDataUrl(encodingItems[3].payload).encoding, 'base64');
  assert.notEqual(encodingItems[1].payload, encodingItems[2].payload);
  assert.ok(encodingItems.every((item) => item.payloadBytes <= core.getQrLimit('M')));

  const densityItems = suite.full[4].items;
  assert.deepEqual(densityItems.map((item) => item.id), ['E1', 'E2', 'E3', 'E4']);
  assert.deepEqual(densityItems.map((item) => item.payloadBytes), [200, 640, 1300, 2250]);
  assert.deepEqual(densityItems.map((item) => item.expectedVersion), [10, 20, 30, 40]);
  assert.ok(densityItems.every((item) => item.ecc === 'M' && item.moduleMm === 0.45));

  const iphoneItems = suite.full[5].items;
  assert.deepEqual(iphoneItems.map((item) => item.id), ['F1', 'F2', 'F3', 'F4']);
  assert.deepEqual(iphoneItems.map((item) => item.payloadBytes), [42, 1017, 2245, 2933]);
  assert.ok(iphoneItems.every((item) => item.payload.startsWith('Xdata:')));
  assert.deepEqual(iphoneItems.map((item) => item.ecc), ['M', 'M', 'M', 'L']);
  assert.ok(iphoneItems.every((item) => item.moduleMm === 0.50));
  assert.deepEqual(iphoneItems.map((item) => item.expectedVersion || null), [null, null, 40, 40]);
  assert.equal(core.parseDataUrl(iphoneItems[0].payload.slice(1)).text, '<h1>OFFLINE</h1>');
  const offlineCheckHtml = core.parseDataUrl(iphoneItems[1].payload.slice(1)).text;
  assert.match(offlineCheckHtml, /<h1>Тест автономного запуска<\/h1>/);
  assert.match(offlineCheckHtml, /Тест пройден: страница и кнопка работают без Интернета/);
  assert.notEqual(offlineCheckHtml, encodingItems[0].payload);
  assert.equal(core.parseDataUrl(iphoneItems[2].payload.slice(1)).text, brickGame.html);
  assert.equal(core.parseDataUrl(iphoneItems[3].payload.slice(1)).text, lowCorrectionGame.html);
  assert.ok(iphoneItems.every((item) => item.payloadBytes <= core.getQrLimit(item.ecc)));
});

test('цифровая проверка тестового QR различает совпадение, BOM и ошибку', () => {
  const canvas = {
    width: 1,
    height: 1,
    getContext: () => ({ getImageData: () => ({ data: new Uint8ClampedArray(4) }) })
  };
  assert.equal(deviceTest.verifyCanvasPayload(canvas, 'данные', () => ({ data: 'данные' })).status, 'pass');
  assert.equal(deviceTest.verifyCanvasPayload(canvas, 'данные', () => ({ data: '\uFEFFданные' })).status, 'warn');
  assert.equal(deviceTest.verifyCanvasPayload(canvas, 'данные', () => ({ data: 'другие' })).status, 'fail');
  assert.equal(deviceTest.verifyCanvasPayload(canvas, 'данные', null).status, 'unavailable');
});

test('метка печати содержит локальные дату и время с секундами', () => {
  assert.equal(deviceTest.formatPrintTimestamp(new Date(2026, 7, 29, 14, 5, 6)), '29.08.2026 14:05:06');
  assert.equal(deviceTest.formatPrintTimestamp('не дата'), '');
});

test('калибровка экрана считает CSS-пиксели, буфер и целые пиксели на модуль', () => {
  const calibration = deviceTest.calculateCalibration(428, 2);
  assert.equal(calibration.cssPxPerMm, 5);
  assert.equal(calibration.cssPpi, 127);
  assert.equal(calibration.devicePpi, 254);

  assert.deepEqual(deviceTest.calculateScreenRender(177, 4, 512, 2, 5), {
    totalModules: 185,
    modulePixels: 6,
    backingSize: 1110,
    cssSize: 555,
    physicalMm: 111,
    quality: {
      id: 'good',
      label: 'Хороший запас',
      detail: 'Не менее 4 пикселей экрана на модуль.'
    }
  });
  assert.deepEqual(deviceTest.calculateScreenCapacity(177, 4, 700, 2), {
    totalModules: 185,
    modulePixels: 7,
    backingSize: 1295,
    cssSize: 647.5
  });
  assert.equal(deviceTest.classifyModulePixels(3).id, 'warn');
  assert.equal(deviceTest.classifyModulePixels(2).id, 'bad');

  const print = deviceTest.calculatePrintGeometry(177, 4, 0.50, 30);
  assert.equal(print.totalModules, 185);
  assert.equal(print.sizeMm, 92.5);
  assert.equal(print.moduleMm, 0.5);
  assert.ok(Math.abs(print.printerDots300 - 5.9055) < 0.001);
  assert.ok(Math.abs(print.printerDots600 - 11.8110) < 0.001);
});

test('base64 data URL сохраняет Unicode побайтово', () => {
  const html = '<!doctype html><h1>Привет, QR!</h1>';
  const url = core.makeDataUrl(html, 'base64');
  const decoded = core.parseDataUrl(url);
  assert.equal(decoded.encoding, 'base64');
  assert.equal(decoded.mime, 'text/html');
  assert.equal(decoded.text, html);
});

test('percent data URL декодируется обратно', () => {
  const html = '<p data-x="1">Тест & проверка</p>';
  const url = core.makeDataUrl(html, 'percent');
  assert.equal(core.parseDataUrl(url).text, html);
});

test('полноэкранный QR масштабируется целым числом физических пикселей на модуль', () => {
  assert.deepEqual(core.fitQrDisplay(141, 4, 1920, 1080, 1), {
    totalModules: 149,
    pixelsPerModule: 7,
    physicalSize: 1043,
    cssSize: 1043,
    physicalLeft: 438,
    physicalTop: 18,
    cssLeft: 438,
    cssTop: 18
  });
  assert.deepEqual(core.fitQrDisplay(157, 4, 1920, 1080, 1), {
    totalModules: 165,
    pixelsPerModule: 6,
    physicalSize: 990,
    cssSize: 990,
    physicalLeft: 465,
    physicalTop: 45,
    cssLeft: 465,
    cssTop: 45
  });
  assert.deepEqual(core.fitQrDisplay(157, 4, 1536, 864, 1.25), {
    totalModules: 165,
    pixelsPerModule: 6,
    physicalSize: 990,
    cssSize: 792,
    physicalLeft: 465,
    physicalTop: 45,
    cssLeft: 372,
    cssTop: 36
  });
});

test('профиль загруженного QR описывает формат, геометрию и параметры имитации', () => {
  const html = '<!doctype html><p>QR</p>';
  const data = core.makeDataUrl(html, 'base64');
  const profile = core.analyzeQrImage({
    data,
    binaryData: new Uint8ClampedArray(120),
    chunks: [{ type: 'byte', text: data }],
    version: 1,
    errorCorrectionLevel: 'Q',
    dataMask: 5,
    location: {
      topLeftCorner: { x: 20, y: 20 },
      topRightCorner: { x: 125, y: 20 },
      bottomRightCorner: { x: 125, y: 125 },
      bottomLeftCorner: { x: 20, y: 125 }
    }
  }, {
    fileName: 'foreign-qr.png', fileType: 'image/png', fileSize: 2048,
    width: 290, height: 290, decodeWidth: 145, decodeHeight: 145, decodeScale: 0.5, inverted: false
  });

  assert.equal(profile.payload.kind, 'html-data-url');
  assert.equal(profile.payload.isHtml, true);
  assert.equal(profile.version, 1);
  assert.equal(profile.modules, 21);
  assert.equal(profile.ecc, 'Q');
  assert.equal(profile.mask, 5);
  assert.equal(profile.payloadBytes, 120);
  assert.deepEqual(profile.chunkModes, ['byte']);
  assert.equal(profile.geometry.modulePixels, 10);
  assert.equal(profile.geometry.marginPixels, 40);
  assert.equal(profile.geometry.marginModules, 4);
  assert.equal(profile.geometry.perspectivePercent, 0);
  assert.deepEqual(profile.emulation, { ecc: 'Q', moduleScale: 10, quietZone: 4 });
  assert.ok(profile.observations.some((item) => /не меньше 4 модулей/.test(item.text)));
});

test('классификация QR-нагрузки отделяет HTML от обычных ссылок и текста', () => {
  assert.equal(core.classifyQrPayload('<!doctype html><p>OK</p>').isHtml, true);
  assert.equal(core.classifyQrPayload('https://example.org/').kind, 'url');
  assert.equal(core.classifyQrPayload('обычный текст').kind, 'text');
  assert.equal(core.classifyQrPayload('data:text/plain,hello').isHtml, false);
});

test('округление измерений не создаёт ложное предупреждение на границе четырёх модулей', () => {
  const profile = core.analyzeQrImage({
    data: 'test', version: 39, errorCorrectionLevel: 'L', dataMask: 3,
    location: {
      topLeftCorner: { x: 24, y: 24 },
      topRightCorner: { x: 1062.0001, y: 24 },
      bottomRightCorner: { x: 1062.0001, y: 1062.0001 },
      bottomLeftCorner: { x: 24, y: 1062.0001 }
    }
  }, { width: 1086, height: 1086, decodeWidth: 1086, decodeHeight: 1086, decodeScale: 1 });

  assert.equal(Math.round(profile.geometry.marginModules * 10) / 10, 4);
  assert.equal(profile.observations.some((item) => /меньше рекомендуемых 4 модулей/.test(item.text)), false);
  assert.equal(profile.observations.some((item) => /не меньше 4 модулей/.test(item.text)), true);
});

test('расчёт сокращения показывает точный объём HTML для возврата к M при Base64', () => {
  const prefixBytes = core.byteLength(core.makeDataUrl('', 'base64'));
  const maxHtmlBytes = Math.floor((core.getQrLimit('M') - prefixBytes) / 4) * 3;
  const fitting = core.getReductionToFit('A'.repeat(maxHtmlBytes), 'base64', 'M');
  const overflowing = core.getReductionToFit('A'.repeat(maxHtmlBytes + 1), 'base64', 'M');
  assert.equal(fitting.payloadReduction, 0);
  assert.equal(fitting.htmlReduction, 0);
  assert.ok(overflowing.payloadReduction > 0);
  assert.equal(overflowing.htmlReduction, 1);

  const percentHtml = '<p>' + 'я'.repeat(400) + '</p>';
  const percent = core.getReductionToFit(percentHtml, 'percent', 'M');
  assert.ok(percent.payloadReduction > 0);
  assert.equal(percent.htmlReduction, null);
  assert.equal(percent.payloadBytes, core.byteLength(core.makeDataUrl(percentHtml, 'percent')));
});

test('normalizeSource принимает и HTML, и data URL', () => {
  const html = '<main>ok</main>';
  assert.equal(core.normalizeSource(html), html);
  assert.equal(core.normalizeSource(core.makeDataUrl(html, 'base64')), html);
});

test('универсальная сложность обнаруживается и изменяется в любом HTML-коде', () => {
  const html = '<!doctype html><script>var $d=3;speed=$d*2</script>';
  assert.deepEqual(core.inspectDifficulty(html), {
    count: 1, editable: true, valid: true, name: '$d', value: 3,
    start: html.indexOf('3;speed'), end: html.indexOf('3;speed') + 1
  });
  const changed = core.setDifficulty(html, 5);
  assert.match(changed, /var \$d=5/);
  assert.equal(core.inspectDifficulty(changed).value, 5);
  assert.equal(core.inspectDifficulty('<script>var $d=8</script>').valid, false);
  assert.equal(core.inspectDifficulty('<script>var d=3,$x=3</script>').count, 0, 'переключатель должен учитывать только стандартную переменную $d');
  assert.throws(() => core.setDifficulty('<script>var $d=2;var $d=3</script>', 4), /ровно одна/);
  assert.throws(() => core.setDifficulty('<script>play()</script>', 4), /\$d/);
  const gameSpec = {
    schemaVersion: '0.1', id: 'any-game', title: 'Любая игра', type: 'game', difficulty: 3,
    qr: { encoding: 'base64', ecc: 'M' }, technical: {}, interface: {}
  };
  assert.equal(core.validateHtml(html, gameSpec, {}).find((check) => check.id === 'difficulty').status, 'pass');
  assert.equal(core.validateHtml(core.setDifficulty(html, 4), gameSpec, {}).find((check) => check.id === 'difficulty').status, 'fail');
  assert.equal(core.validateHtml('<script>play()</script>', gameSpec, {}).find((check) => check.id === 'difficulty').status, 'fail');
});

test('автоотчёт предупреждает о пользовательских идентификаторах с зарезервированным префиксом $', () => {
  const html = '<!doctype html><script>var $d=3,a=6/b,$score=0;let $timer=1,$d2=2;var text="$fake",pattern=/var \\$regex=1/;/* var $comment=1 */\n// let $line=1\n</script>';
  assert.deepEqual(core.findReservedFormatIdentifiers(html), ['$score', '$timer', '$d2']);
  assert.deepEqual(core.findReservedFormatIdentifiers('<script>var $d=3;let text="$fake";var pattern=/\\$regex/</script>'), []);
  const checks = core.validateHtml(html, {
    schemaVersion: '0.1', id: 'reserved-prefix', title: 'Проверка префикса', type: 'game', difficulty: 3,
    qr: { encoding: 'base64', ecc: 'M' }, technical: {}, interface: {}
  }, {});
  const warning = checks.find((check) => check.id === 'reserved-format-identifiers');
  assert.equal(warning.status, 'warn');
  assert.equal(warning.evidence, '$score, $timer, $d2');
  assert.equal(core.validateHtml('<script>var $d=3</script>', {
    type: 'game', difficulty: 3, qr: { encoding: 'base64', ecc: 'M' }, technical: {}, interface: {}
  }, {}).find((check) => check.id === 'reserved-format-identifiers').status, 'pass');
});

test('оптимизатор HTML удаляет служебное форматирование и сохраняет чувствительное содержимое', () => {
  const html = `
<!doctype html>
<html>
  <style>
    /* удалить CSS-комментарий */
    .note::before { content: "два  пробела"; color: red; }
  </style>
  <body>
    <!-- удалить -->
    <div   data-note = "a  b">
      <span>Первый</span> <span>второй</span>
    </div>
    <script>
      const value = "два  пробела";
    </script>
    <pre>  строка 1
  строка 2</pre>
  </body>
</html>
`;
  const result = core.optimizeHtml(html);
  assert.doesNotMatch(result.html, /удалить/);
  assert.match(result.html, /<html><style>\.note::before\{content:"два  пробела";color:red\}<\/style><body><div data-note="a  b"><span>Первый<\/span> <span>второй<\/span><\/div><script>/);
  assert.match(result.html, /const value="два  пробела";/);
  assert.match(result.html, /<pre>  строка 1\n  строка 2<\/pre>/);
  assert.ok(result.savedBytes > 0);
  assert.equal(result.optimizedBytes, core.byteLength(result.html));
  assert.equal(result.commentsRemoved, 1);
  const secondPass = core.optimizeHtml(result.html);
  assert.equal(secondPass.html, result.html);
  assert.equal(secondPass.savedBytes, 0);
});

test('оптимизатор JavaScript убирает форматирование массивов и сохраняет чувствительный синтаксис', () => {
  const html = `<!doctype html><script>
Q = [['Что интереснее?',                                             'Разбираться в коде', 0, 'Объяснять людям', 1], [
  'Как удобнее работать?', 'Создавать интерфейсы'
]];
const text = 'два  пробела';
const template = \`строка  с  пробелами\`;
const pattern = /[ ,]+\\/x/;
function value() { return
  { ok: true } }
</script>`;
  const result = core.optimizeHtml(html);
  assert.match(result.html, /Q=\[\['Что интереснее\?','Разбираться в коде',0,'Объяснять людям',1\],\['Как удобнее работать\?','Создавать интерфейсы'\]\];/);
  assert.match(result.html, /'два  пробела'/);
  assert.match(result.html, /`строка  с  пробелами`/);
  assert.match(result.html, /\/\[ ,\]\+\\\/x\//);
  assert.match(result.html, /return\n\{ok:true\}/);
  const sandbox = {};
  vm.runInNewContext(result.html.match(/<script>([\s\S]*)<\/script>/)[1], sandbox);
  assert.equal(JSON.stringify(sandbox.Q), JSON.stringify([
    ['Что интереснее?', 'Разбираться в коде', 0, 'Объяснять людям', 1],
    ['Как удобнее работать?', 'Создавать интерфейсы']
  ]));
  assert.equal(sandbox.value(), undefined, 'перенос после return должен сохранять автоматическую вставку точки с запятой');
  assert.ok(result.savedBytes > 40);
  assert.equal(core.optimizeHtml(result.html).html, result.html);
});

test('некорректный data URL отклоняется с понятной ошибкой', () => {
  assert.throws(() => core.parseDataUrl('data:text/html;base64'), /разделитель/);
  assert.throws(() => core.makeDataUrl('x', 'unknown'), /Неизвестный/);
});

test('валидатор профиля проверяет формат и QR-параметры', () => {
  assert.deepEqual(core.validateSpec(sample.spec), []);
  assert.ok(core.validateSpec({ schemaVersion: '9' }).length >= 3);
  assert.match(core.validateSpec({ ...sample.spec, interface: { minTouchTargetPx: 10, minControlGapPx: 80, requireControlLabels: 'yes', noVerticalScroll: 'yes' } }).join(' '), /minTouchTargetPx.*minControlGapPx.*requireControlLabels.*noVerticalScroll/);
});

test('встроенный каталог содержит одиннадцать компактных примеров с валидными профилями', () => {
  assert.equal(sample.items.length, 11);
  assert.equal(sample.defaultId, 'brick-breaker');
  for (const item of sample.items) {
    assert.doesNotMatch(item.html, /[\r\n]$/);
    assert.deepEqual(core.validateSpec(item.spec), []);
  }
});

test('эталонный пример укладывается в стандартную вместимость QR', () => {
  const url = core.makeDataUrl(sample.html, sample.spec.qr.encoding);
  assert.ok(core.byteLength(url) <= core.getQrLimit(sample.spec.qr.ecc));
  const checks = core.validateHtml(sample.html, sample.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 35 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);
});

test('«Как думает компьютер?» укладывается в стандартную вместимость QR', () => {
  const quiz = sample.getById('computer-thinking');
  const url = core.makeDataUrl(quiz.html, quiz.spec.qr.encoding);
  assert.ok(core.byteLength(url) <= core.getQrLimit(quiz.spec.qr.ecc));
  assert.match(quiz.html, /Угадай ИТ-понятие/);
  assert.match(quiz.html, /font:4vh\/1 monospace/);
  const choices = [...quiz.html.matchAll(/;(\d+);(\d+);(\d+);[0-9a-f]+`/g)]
    .map((match) => match.slice(1).map(Number));
  assert.deepEqual(
    choices.map((choice, index) => choice[(index + 1) % 3]),
    [0, 1, 3, 6, 7, 8, 11, 12],
  );
  assert.match(quiz.html, /\| ID  42  \|\^ \| ID  73  \|\^ \| ID  91  \|/);
  const checks = core.validateHtml(quiz.html, quiz.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);
});

test('«Турнирная сетка» укладывается в стандартную вместимость QR', () => {
  const quiz = sample.getById('tournament-bracket');
  const url = core.makeDataUrl(quiz.html, quiz.spec.qr.encoding);
  assert.ok(core.byteLength(url) <= core.getQrLimit(quiz.spec.qr.ecc));
  assert.match(quiz.html, /\[<v>\?<\/v>\]=вопрос/);
  assert.match(quiz.html, /f\{color:#5d5\}v\{color:#fd4\}/);
  assert.doesNotMatch(quiz.html, /Ответ:/);
  const questions = [...quiz.html.matchAll(/;(\d+);(\d+);(\d+);(\d+);(\d+)`/g)];
  assert.deepEqual(questions.map((question) => Number(question[2])), [0, 0, 0, 1, 2, 0, 0, 2]);
  const checks = core.validateHtml(quiz.html, quiz.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);
});

test('«Пакет в сети» укладывается в стандартную вместимость QR', () => {
  const packet = sample.getById('packet-network');
  const url = core.makeDataUrl(packet.html, packet.spec.qr.encoding);
  assert.ok(core.byteLength(url) <= core.getQrLimit(packet.spec.qr.ecc));
  assert.match(packet.html, /H=h\/s/);
  assert.match(packet.html, /setTransform\(D\*s,0,0,D\*s,O\*D,0\)/);
  assert.match(packet.html, /f\(-O\/s,0,w\/s,H\)/);
  assert.match(packet.html, /H-S\[i\]\[1\]-G/);
  assert.match(packet.html, /C\[z\]='#123047'/);
  assert.match(packet.html, /Q>1\?0:Q\?R\(\):V=-J/);
  assert.match(packet.html, /Q=64/);
  assert.match(packet.html, /B=U\*P/);
  assert.match(packet.html, /I=\.045\*r/);
  assert.match(packet.html, /E=B\/\(U\+I\)\*J\*\(\$d\*\$d\+9\)\/75/);
  assert.match(packet.html, /p&&\(U\+=I\)/);
  assert.match(packet.html, /L\+\(Math\.random\(\)\*2-1\)\*\(E=/);
  assert.match(packet.html, /S\.push\(\[o\[0\]\+B,N\(\)\]\)/);
  const checks = core.validateHtml(packet.html, packet.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);

  const ticks = [];
  const drawingContext = { setTransform() {}, fillRect() {}, fillText() {} };
  const canvas = { style: {}, getContext: () => drawingContext };
  const sandbox = {
    c: canvas,
    devicePixelRatio: 1,
    innerWidth: 360,
    innerHeight: 640,
    Math,
    setInterval: (callback) => { ticks.push(callback); }
  };
  const script = packet.html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, sandbox);
  canvas.ontouchstart();
  sandbox.Y = sandbox.H;
  ticks[0]();
  assert.ok(sandbox.Q > 1, 'после проигрыша должна кратко отображаться защита от случайного касания');
  for (let index = 0; index < 70; index++) ticks[0]();
  assert.equal(sandbox.Q, 1, 'задержка результата должна завершаться, даже если персонаж остался за границей');
  canvas.ontouchstart();
  assert.equal(sandbox.Q, 0, 'нажатие после ожидания должно запускать новый раунд');

  const maximumOffsets = [1, 2, 3, 4, 5].map((difficulty) => {
    const variant = core.setDifficulty(packet.html, difficulty);
    const variantTicks = [];
    const fixedMath = Object.create(Math);
    fixedMath.random = () => 1;
    const variantContext = { setTransform() {}, fillRect() {}, fillText() {} };
    const variantCanvas = { style: {}, getContext: () => variantContext };
    const variantSandbox = {
      c: variantCanvas,
      devicePixelRatio: 1,
      innerWidth: 360,
      innerHeight: 640,
      Math: fixedMath,
      setInterval: (callback) => { variantTicks.push(callback); }
    };
    vm.runInNewContext(variant.match(/<script>\s*([\s\S]*?)<\/script>/)[1], variantSandbox);
    const previousGap = variantSandbox.L;
    const nextGap = variantSandbox.N();
    assert.ok(nextGap >= 30 && nextGap <= variantSandbox.H - variantSandbox.G - 30, 'новый проём должен оставаться внутри экрана');
    assert.ok(Math.abs(nextGap - previousGap) <= variantSandbox.E + 0.001, 'новый проём не должен превышать рассчитанное достижимое отклонение');
    assert.ok(variantSandbox.E <= variantSandbox.B / (variantSandbox.U + variantSandbox.I) * variantSandbox.J, 'отклонение должно оставаться в пределах физически доступного подлёта');
    return variantSandbox.E;
  });
  for (let index = 1; index < maximumOffsets.length; index++) {
    assert.ok(maximumOffsets[index] > maximumOffsets[index - 1], 'максимальное случайное отклонение должно возрастать со сложностью');
  }

  const spacingTicks = [];
  const fixedMath = Object.create(Math);
  fixedMath.random = () => 0.5;
  const spacingContext = { setTransform() {}, fillRect() {}, fillText() {} };
  const spacingCanvas = { style: {}, getContext: () => spacingContext };
  const spacingSandbox = {
    c: spacingCanvas,
    devicePixelRatio: 1,
    innerWidth: 360,
    innerHeight: 640,
    Math: fixedMath,
    setInterval: (callback) => { spacingTicks.push(callback); }
  };
  vm.runInNewContext(script, spacingSandbox);
  spacingCanvas.ontouchstart();
  spacingSandbox.A = 0;
  spacingSandbox.V = 0;
  const initialSpeed = spacingSandbox.U;
  let previousSpeed = initialSpeed;
  let previousScore = 0;
  const speedIncrements = [];
  let measuredPairs = 0;
  for (let frame = 0; frame < 600; frame++) {
    spacingTicks[0]();
    assert.equal(spacingSandbox.Q, 0, 'при проёмах на одной высоте пакет не должен столкнуться');
    if (spacingSandbox.K > previousScore) {
      speedIncrements.push(spacingSandbox.U - previousSpeed);
      previousSpeed = spacingSandbox.U;
      previousScore = spacingSandbox.K;
    }
    for (let index = 1; index < spacingSandbox.S.length; index++) {
      const distance = spacingSandbox.S[index][0] - spacingSandbox.S[index - 1][0];
      assert.ok(Math.abs(distance - spacingSandbox.B) < 0.001, 'расстояние между линиями должно оставаться постоянным');
      measuredPairs++;
    }
  }
  assert.ok(measuredPairs > 0, 'тест должен измерить расстояние между несколькими линиями');
  assert.ok(spacingSandbox.U > initialSpeed, 'проверка постоянного расстояния должна включать ускорение игры');
  assert.ok(speedIncrements.length > 2, 'тест должен измерить несколько шагов ускорения');
  for (const increment of speedIncrements) {
    assert.ok(Math.abs(increment - spacingSandbox.I) < 0.000001, 'каждая пройденная линия должна добавлять одинаковую скорость');
  }
});

test('«Разбей блоки» начисляет очки за цветные блоки и завершает игру победой', () => {
  const game = sample.getById('brick-breaker');
  const url = core.makeDataUrl(game.html, game.spec.qr.encoding);
  assert.equal(game.title, 'Разбей блоки');
  assert.equal(game.spec.difficulty, 3);
  assert.equal(core.inspectDifficulty(game.html).value, 3);
  assert.ok(core.byteLength(url) <= core.getQrLimit(game.spec.qr.ecc));
  assert.match(game.html, /hsl\('/);
  assert.match(game.html, /A\^=1<<i/);
  assert.match(game.html, /ПОБЕДА/);
  assert.match(game.html, /ГОТОВО/);
  assert.match(game.html, /,120,168/);
  assert.match(game.html, /,120,196/);
  assert.match(game.html, /f\(-O\/S,0,w\/S,H\)/);
  assert.match(game.html, /Math\.min\(2,\(t-o\)\/16\.7\|\|1\)/);
  const checks = core.validateHtml(game.html, game.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);

  const frames = [];
  const drawingContext = {
    setTransform() {}, fillRect() {}, beginPath() {}, arc() {}, fill() {}, fillText() {}
  };
  const canvas = { style: {}, getContext: () => drawingContext };
  const sandbox = {
    c: canvas,
    devicePixelRatio: 1,
    innerWidth: 360,
    innerHeight: 640,
    Math,
    requestAnimationFrame: (callback) => { frames.push(callback); }
  };
  const script = game.html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, sandbox);
  assert.equal(sandbox.Q, 1, 'до первого касания должен отображаться стартовый экран');
  assert.equal(sandbox.A, -1, 'в начале должны быть активны все 32 блока');
  assert.equal(sandbox.J, 70, 'средняя сложность должна использовать платформу шириной 70');
  assert.ok(Math.abs(sandbox.V - 1.6) < 0.001, 'горизонтальная скорость средней сложности должна быть умеренной');
  assert.ok(Math.abs(sandbox.U + 1.95) < 0.001, 'вертикальная скорость средней сложности должна быть умеренной');

  const pointer = (clientX) => ({ clientX, preventDefault() {} });
  canvas.onpointerdown(pointer(180));
  assert.equal(sandbox.Q, 0, 'первое касание должно запустить игру');

  sandbox.X = 100;
  sandbox.Y = 250;
  sandbox.V = 2;
  sandbox.U = 0;
  frames.shift()(100);
  const fullFrameX = sandbox.X;
  frames.shift()(108.35);
  assert.ok(Math.abs(sandbox.X - fullFrameX - 1) < 0.001, 'на экране 120 Гц движение за кадр должно уменьшаться вдвое');

  sandbox.X = sandbox.P + 0.5;
  sandbox.Y = sandbox.PY + 8;
  sandbox.U = 2;
  frames.shift()();
  assert.ok(sandbox.U > 0, 'мяч, уже прошедший верх платформы, не должен отскакивать от её бокового края');

  sandbox.X = sandbox.P + sandbox.J / 2 - 1.6;
  sandbox.Y = sandbox.PY - sandbox.B - 1;
  sandbox.V = 1.6;
  sandbox.U = 2;
  const speedBeforeBounce = Math.hypot(sandbox.V, sandbox.U);
  frames.shift()();
  assert.ok(sandbox.U < 0, 'платформа должна отбить падающий мяч вверх');
  assert.ok(Math.abs(Math.hypot(sandbox.V, sandbox.U) - speedBeforeBounce) < 0.001, 'отскок от платформы не должен менять скорость мяча');

  sandbox.X = 18.5 - sandbox.V;
  sandbox.Y = 52 - sandbox.U;
  frames.shift()();
  assert.equal(sandbox.K, 1, 'попадание в блок должно начислять очко');
  assert.equal(sandbox.A & 1, 0, 'разбитый блок должен исчезнуть');

  sandbox.A = 1;
  sandbox.K = 31;
  sandbox.X = 18.5 - sandbox.V;
  sandbox.Y = 52 - sandbox.U;
  frames.shift()();
  assert.equal(sandbox.K, 32);
  assert.equal(sandbox.Q, 3, 'последний разбитый блок должен открыть экран победы');

  const variants = [1, 2, 3, 4, 5].map((difficulty) => ({
    html: core.setDifficulty(game.html, difficulty),
    spec: { ...game.spec, difficulty }
  }));
  assert.equal(new Set(variants.map((item) => item.html)).size, 5, 'каждый уровень должен создавать собственный HTML');
  variants.forEach((variant, index) => {
    assert.equal(core.inspectDifficulty(variant.html).value, index + 1);
    assert.ok(core.byteLength(core.makeDataUrl(variant.html, 'base64')) <= core.getQrLimit('M'), 'уровень ' + (index + 1) + ' должен помещаться в M');
    const variantChecks = core.validateHtml(variant.html, variant.spec, { encoding: 'base64', ecc: 'M' });
    assert.equal(variantChecks.find((check) => check.id === 'difficulty').status, 'pass');
  });
  assert.match(variants[0].html, /var \$d=1/);
  assert.match(variants[4].html, /var \$d=5/);
});

test('извлечённый из QR «Брандмауэр» встроен как автономный пример', () => {
  const game = sample.getById('firewall');
  const url = core.makeDataUrl(game.html, 'base64');
  assert.equal(game.title, 'Брандмауэр');
  assert.equal(core.inspectDifficulty(game.html).value, 3);
  assert.ok(core.byteLength(url) <= core.getQrLimit('M'));
  assert.match(game.html, /КРАСНЫЕ НАЖИМАЙ/);
  assert.match(game.html, /ЗЕЛЕНЫЕ ПРОПУСКАЙ/);
  assert.match(game.html, /onpointerdown/);
  assert.match(game.html, /v=\.8\+\$d\/12/);
  assert.match(game.html, /f=\(\.33-\$d\*\.02\)\*14\/13/);
  assert.match(game.html, /p=\.3/);
  assert.match(game.html, /j\*=1\.0004/);
  assert.match(game.html, /w=26\.25\+n\(\)\*6\.25;y=w\*\(1\+n\(\)\*3\)/);
  assert.match(game.html, /a=A\[i\]\)\[3\]&&X<a\[0\]\+a\[4\]\+3/);
  assert.match(game.html, /for\(r=0;r<2;r\+\+\)for\(i=A\.length;i--;\).*a\[3\]==r/, 'зелёные должны рисоваться до красных');
  assert.match(game.html, /display:block/);
  const checks = core.validateHtml(game.html, game.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);

  const ticks = [];
  const fixedMath = Object.create(Math);
  fixedMath.random = () => 0;
  const drawingContext = { setTransform() {}, fillRect() {}, fillText() {} };
  const canvas = { style: {}, getContext: () => drawingContext };
  const sandbox = {
    c: canvas,
    devicePixelRatio: 1,
    innerWidth: 360,
    innerHeight: 640,
    Math: fixedMath,
    setInterval: (callback) => { ticks.push(callback); }
  };
  const script = game.html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, sandbox);
  canvas.onpointerdown({ clientX: 180, clientY: 320 });
  for (let index = 0; index < 150; index++) ticks[0]();
  const redBlocks = sandbox.A.filter((block) => block[3]);
  assert.ok(redBlocks.length > 1, 'красные блоки должны иметь возможность следовать друг над другом');
  assert.equal(new Set(redBlocks.map((block) => block[0])).size, 1, 'вертикально разделённые красные блоки могут использовать одну координату X');
  redBlocks.forEach((block) => {
    assert.ok(block[4] >= 26.25, 'ширина блока должна быть не меньше полутора прежних минимумов');
    assert.ok(block[4] <= 32.5, 'верхняя граница ширины блока не должна измениться');
    assert.ok(block[2] >= block[4], 'высота блока не должна быть меньше ширины');
    assert.ok(block[2] <= block[4] * 4, 'высота блока не должна превышать четыре ширины');
  });
  for (let left = 0; left < redBlocks.length; left++) {
    for (let right = left + 1; right < redBlocks.length; right++) {
      const a = redBlocks[left];
      const b = redBlocks[right];
      const separated = a[0] + a[4] < b[0] || b[0] + b[4] < a[0] || a[1] + a[2] < b[1] || b[1] + b[2] < a[1];
      assert.equal(separated, true, 'красные блоки не должны накладываться или стыковаться');
    }
  }
});

test('извлечённая из QR игра «Успей в релиз» встроена как автономный пример', () => {
  const game = sample.getById('release-run');
  const url = core.makeDataUrl(game.html, 'base64');
  assert.equal(game.title, 'Успей в релиз');
  assert.equal(core.inspectDifficulty(game.html).value, 3);
  assert.ok(core.byteLength(url) <= core.getQrLimit('M'));
  assert.match(game.html, /УСПЕЙ В РЕЛИЗ/);
  assert.match(game.html, /ТАП-ПРЫЖОК/);
  assert.match(game.html, /u=2\.9\+\$d\*\.3/);
  assert.match(game.html, /t=58-\$d\*4\+n\(\)\*\(32-\$d\*2\)/);
  assert.match(game.html, /u\+=\.004\+\$d\*\.002/);
  assert.match(game.html, /x\.arc\(M,50,11,0,7\);x\.fill\(\)/, 'луна должна начинаться с заполненного круга ниже счётчика');
  assert.match(game.html, /x\.arc\(M\+4,47,8,0,7\);x\.fill\(\)/, 'смещённый круг цвета фона должен формировать заполненный полумесяц');
  assert.match(game.html, /x\.fillText\(s,18,28\)/, 'счётчик должен располагаться с отступом от края');
  assert.match(game.html, /x\[F\]='#123e'/, 'информационная карточка должна иметь контрастный тёмный фон');
  assert.match(game.html, /x\.font='bold 18px sans-serif'/, 'заголовок карточки должен быть полужирным');
  const checks = core.validateHtml(game.html, game.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);

  const variants = [1, 2, 3, 4, 5].map((difficulty) => {
    const html = core.setDifficulty(game.html, difficulty);
    const ticks = [];
    const drawingContext = {
      setTransform() {}, fillRect() {}, beginPath() {}, arc() {}, fill() {}, fillText() {}
    };
    const canvas = { style: {}, getContext: () => drawingContext };
    const sandbox = {
      c: canvas,
      devicePixelRatio: 1,
      innerWidth: 360,
      innerHeight: 640,
      Math,
      setInterval: (callback) => { ticks.push(callback); }
    };
    vm.runInNewContext(html.match(/<script>\s*([\s\S]*?)<\/script>/)[1], sandbox);
    canvas.onpointerdown({ preventDefault() {} });
    return { speed: sandbox.u, ticks, sandbox };
  });
  assert.deepEqual(variants.map((item) => Number(item.speed.toFixed(2))), [3.2, 3.5, 3.8, 4.1, 4.4]);
  variants.forEach((variant) => {
    for (let index = 0; index < 36; index++) variant.ticks[0]();
    assert.ok(variant.sandbox.A.length > 0, 'после старта должно появиться препятствие');
  });
});

test('«Киберрефлекс» встроен как автономный пример и укладывается в QR', () => {
  const game = sample.getById('cyber-reflex');
  const url = core.makeDataUrl(game.html, game.spec.qr.encoding);
  assert.equal(game.title, 'Киберрефлекс');
  assert.equal(core.inspectDifficulty(game.html).value, 3);
  assert.ok(core.byteLength(url) <= core.getQrLimit(game.spec.qr.ecc));
  assert.match(game.html, /КИБЕР<br>РЕФЛЕКС/);
  assert.match(game.html, /conic-gradient/);
  assert.match(game.html, /setInterval/);
  assert.match(game.html, /o\.style='--p:'\+20\*r\+'%'/);
  assert.match(game.html, /'<br>'\+v\+' мс'/);
  const checks = core.validateHtml(game.html, game.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);
});

test('«Кибертрасса 2.5D» использует три полосы и укладывается в QR', () => {
  const game = sample.getById('cyber-track-3d');
  const url = core.makeDataUrl(game.html, game.spec.qr.encoding);
  assert.equal(game.title, 'Кибертрасса 2.5D');
  assert.equal(game.spec.title, 'Кибертрасса 2.5D');
  assert.equal(core.inspectDifficulty(game.html).value, 3);
  assert.ok(core.byteLength(url) <= core.getQrLimit(game.spec.qr.ecc));
  assert.match(game.html, /requestAnimationFrame\(T\)/);
  assert.match(game.html, /N=22\+\$d\*2/);
  assert.match(game.html, /S==N/);
  assert.match(game.html, /Q>1&&o<E/);
  assert.match(game.html, /r\+=!\(Q%3\)\*d/, 'игровой таймер должен двигаться во время гонки и финиша, но останавливаться на старте и при ударе');
  assert.match(game.html, /a\[1\]-=d\*v/, 'препятствия должны использовать общую скорость трассы');
  assert.match(game.html, /r\*v\*9/, 'разметка должна использовать ту же скорость и игровой таймер');
  assert.doesNotMatch(game.html, /t\/250/, 'разметка не должна продолжать движение по абсолютному времени');
  assert.match(game.html, /a\[0\]==L&&a\[1\]<\.06&&a\[1\]\+d\*v>=\.06/, 'столкновение должно происходить только при пересечении зоны корабля');
  assert.match(game.html, /a\[1\]<-\.15/, 'пройденное препятствие должно удаляться только за нижней границей экрана');
  assert.match(game.html, /for\(i=Q<3\?A\.length:0;i--;\)/, 'после финиша препятствия не должны рисоваться');
  assert.match(game.html, /f\(0,0,W\*S\/N,5\)/);
  assert.match(game.html, /ТАП: ПОЛОСА/);
  assert.match(game.html, /КИБЕРТРАССА 2\.5D/);
  assert.match(game.html, /L=e\.clientX\/W\*3\|0/);
  assert.equal((game.html.match(/Math\.random\(\)\*3\|0/g) || []).length, 2, 'полоса и один из трёх видов препятствия должны выбираться независимо');
  assert.match(game.html, /C=\['#f24','#fc0','#a3f'\]/, 'палитра препятствий должна создаваться один раз, а не в каждом кадре');
  assert.match(game.html, /strokeStyle=C\[q\]/, 'три ярких вида препятствий должны визуально различаться');
  assert.match(game.html, /for\(j=4;j--;\)x\.rect/, 'препятствия должны собирать вложенные голографические контуры в один путь');
  assert.doesNotMatch(game.html, /strokeRect/, 'каждая линия голограммы не должна вызывать отдельную обводку');
  assert.match(game.html, /for\(i=-3;i<4;i\+=2\).*for\(i=9;i--;\).*x\.stroke\(\)/, 'вся разметка трассы должна обводиться одной операцией');
  assert.match(game.html, /V=B\*p\/4/, 'увеличенный размер препятствий должен уменьшаться вместе с перспективной шириной полосы');
  assert.match(game.html, /G=Y\+\(H-Y\)\*p/, 'препятствия и горизонтальная разметка должны двигаться в одной вертикальной перспективе');
  assert.doesNotMatch(game.html, /G=Y\+\(H-Y\)\*p\*\.83/, 'препятствия не должны искусственно замедляться относительно разметки');
  assert.doesNotMatch(game.html, /V=7\+45\*p/, 'у дальних препятствий не должно быть постоянного минимального размера');
  assert.match(game.html, /for\(i=-3;i<4;i\+=2\)/, 'дорога должна иметь четыре границы для трёх полос');
  assert.match(game.html, /\(a\[0\]-1\)\*B\*p\*2\/3/);
  assert.match(game.html, /p=\(H-55-Y\)\/\(H-Y\)/, 'позиция корабля должна учитывать сужение трассы на высоте его визуального центра');
  assert.match(game.html, /\(L-1\)\*B\*p\*2\/3/);
  assert.match(game.html, /display:block/);
  assert.match(game.html, /l\(W\/2\+B,H\)/);
  const checks = core.validateHtml(game.html, game.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);

  const frames = [];
  const drawingContext = {
    fillRect() {}, rect() {}, beginPath() {}, moveTo() {}, lineTo() {}, fill() {}, stroke() {}, fillText() {}
  };
  const canvas = { getContext: () => drawingContext };
  const sandbox = {
    c: canvas,
    innerWidth: 360,
    innerHeight: 640,
    Math,
    requestAnimationFrame: (callback) => { frames.push(callback); }
  };
  vm.runInNewContext(game.html.match(/<script>([\s\S]*?)<\/script>/)[1], sandbox);
  assert.equal(sandbox.Q, 1, 'до первого касания должен отображаться стартовый экран');
  canvas.onpointerdown({ clientX: 180 });
  frames.shift()(100);
  assert.equal(sandbox.Q, 0, 'первое касание должно запустить игру');
  assert.equal(sandbox.A.length, 1, 'после старта должно появиться первое препятствие');
  canvas.onpointerdown({ clientX: 10 });
  assert.equal(sandbox.L, 0, 'касание левой полосы должно перестроить корабль влево');
  canvas.onpointerdown({ clientX: 180 });
  assert.equal(sandbox.L, 1, 'касание центральной полосы должно вернуть корабль в центр');
  canvas.onpointerdown({ clientX: 350 });
  assert.equal(sandbox.L, 2, 'касание правой полосы должно перестроить корабль вправо');

  sandbox.L = 1;
  sandbox.S = sandbox.N - 1;
  sandbox.A = [[0, -0.2]];
  frames.shift()(116);
  assert.equal(sandbox.S, sandbox.N, 'последнее пройденное препятствие должно завершить дистанцию');
  assert.equal(sandbox.Q, 3, 'после прохождения дистанции должен открыться экран победы');

  const finishLock = sandbox.E;
  const finishPhase = sandbox.r;
  canvas.onpointerdown({ clientX: 180 });
  assert.equal(sandbox.Q, 3, 'случайное касание сразу после финиша не должно перезапускать игру');
  frames.shift()(finishLock - 1);
  assert.ok(sandbox.r > finishPhase, 'после финиша разметка трассы должна продолжать движение');
  canvas.onpointerdown({ clientX: 180 });
  assert.equal(sandbox.Q, 3, 'экран финиша должен оставаться заблокированным целую секунду');
  frames.shift()(finishLock);
  canvas.onpointerdown({ clientX: 180 });
  assert.equal(sandbox.Q, 0, 'после секундной задержки касание должно запускать новый раунд');

  sandbox.A = [[1, 0, 1]];
  frames.shift()(finishLock + 16);
  assert.equal(sandbox.Q, 0, 'переход на полосу уже проехавшего препятствия не должен вызывать запоздалый удар');
  assert.ok(sandbox.A[0][1] < 0, 'проехавшее препятствие должно продолжать движение за экраном без телепортации к кораблю');
  sandbox.A = [[1, 0.065, 1]];
  frames.shift()(finishLock + 32);
  assert.equal(sandbox.Q, 2, 'препятствие на выбранной полосе должно завершить игру столкновением');
  assert.equal(sandbox.A[0][1], 0.06, 'столкнувшееся препятствие должно оставаться видимым в точке удара');
  const collisionLock = sandbox.E;
  const collisionPhase = sandbox.r;
  canvas.onpointerdown({ clientX: 180 });
  assert.equal(sandbox.Q, 2, 'случайное касание сразу после удара не должно перезапускать игру');
  frames.shift()(collisionLock - 1);
  assert.equal(sandbox.r, collisionPhase, 'во время паузы после удара препятствия и трасса должны быть заморожены вместе');
  frames.shift()(collisionLock);
  canvas.onpointerdown({ clientX: 180 });
  assert.equal(sandbox.Q, 0, 'после секундной задержки удар должен разрешить новый раунд');
});

test('«Киберлабиринт 2.5D» строит вид от первого лица, проверяет стены и укладывается в QR L', () => {
  const game = sample.getById('cyber-maze-3d');
  const url = core.makeDataUrl(game.html, game.spec.qr.encoding);
  assert.equal(game.title, 'Киберлабиринт 2.5D');
  assert.equal(game.spec.qr.ecc, 'L');
  assert.equal(core.inspectDifficulty(game.html).value, 3);
  assert.ok(core.byteLength(url) <= core.getQrLimit('L'));
  assert.match(game.html, /r=D\+\(i\/W-\.5\)\*1\.1/);
  assert.match(game.html, /m\.round\(X\+a\*d\)\+m\.round\(Z\+b\*d\)\*15/);
  assert.match(game.html, /D\+=m\.atan2/);
  assert.match(game.html, /55-3\*\$d/);
  assert.match(game.html, /position:fixed/);
  assert.match(game.html, /НАЙДИ ВЫХОД/);
  assert.match(game.html, /R\.toFixed\(1\)\+' СЕКУНД'/);
  assert.doesNotMatch(game.html, /ВПЕРЁД/);
  assert.equal(game.documentation.title, 'Как играть в «Киберлабиринт 2.5D»');
  const documentationText = JSON.stringify(game.documentation);
  ['15 × 15', '28 шагов', '1 — 52 секунды', '5 — 40 секунд', 'S1 (3, 3)', 'выход E (7, 7)', 'Canvas-рейкастером'].forEach((text) => {
    assert.ok(documentationText.includes(text), 'в описании должен быть текст: ' + text);
  });
  const mapDocumentation = game.documentation.sections.find((section) => section.visualization)?.visualization;
  assert.equal(mapDocumentation.type, 'grid-map');
  assert.equal(mapDocumentation.rows.length, 15);
  assert.ok(mapDocumentation.rows.every((row) => row.length === 15));
  assert.deepEqual(mapDocumentation.starts.map((start) => start.index), [48, 28, 200, 204]);
  assert.deepEqual(mapDocumentation.exit, { label: 'E', index: 112 });
  assert.deepEqual(sample.items.filter((item) => item.documentation).map((item) => item.id), ['cyber-maze-3d'], 'описание пока должно быть только у лабиринта');
  const checks = core.validateHtml(game.html, game.spec, { dataUrl: url, encoding: 'base64', ecc: 'L', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);

  const frames = [];
  let now = 1000;
  let randomValue = 0;
  const sandboxMath = Object.create(Math);
  sandboxMath.random = () => randomValue;
  const drawingContext = {
    fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, fill() {}, fillText() {}
  };
  const canvas = { getContext: () => drawingContext };
  const sandbox = {
    c: canvas,
    innerWidth: 360,
    innerHeight: 640,
    Math: sandboxMath,
    performance: { now: () => now },
    requestAnimationFrame: (callback) => { frames.push(callback); }
  };
  vm.runInNewContext(game.html.match(/<script>([\s\S]*?)<\/script>/)[1], sandbox);
  assert.equal(sandbox.Q, 1, 'до касания должен отображаться стартовый экран');
  assert.equal(sandbox.M.length, 225, 'лабиринт должен содержать поле 15 на 15 клеток');
  assert.deepEqual(Array.from(sandbox.P), [48, 28, 200, 204], 'должны использоваться четыре точки старта');
  assert.equal(sandbox.M[112], '2', 'выход должен быть отдельной зелёной поверхностью в 3D-сцене');

  const distances = Array.from(sandbox.P, (start) => {
    const queue = [[start, 0]];
    const visited = new Set([start]);
    for (let index = 0; index < queue.length; index++) {
      const [cell, distance] = queue[index];
      if (cell === 112) return distance;
      for (const next of [cell - 1, cell + 1, cell - 15, cell + 15]) {
        if (!visited.has(next) && sandbox.M[next] !== '1') {
          visited.add(next);
          queue.push([next, distance + 1]);
        }
      }
    }
    return Infinity;
  });
  assert.deepEqual(distances, [28, 28, 28, 28], 'все точки старта должны быть равноудалены от выхода');

  const pointer = (clientX) => ({ clientX, preventDefault() {} });
  canvas.onpointerdown(pointer(180));
  frames.shift()(now);
  assert.equal(sandbox.Q, 0, 'центральное касание должно запустить игру');
  assert.equal(sandbox.T, 46, 'на средней сложности должно быть доступно 46 секунд');

  const initialDirection = sandbox.D;
  canvas.onpointerdown(pointer(330));
  frames.shift()(1016);
  assert.ok(sandbox.D > initialDirection, 'правое касание должно начать поворот камеры от первого лица');
  assert.ok(sandbox.D - initialDirection < 0.15, 'один кадр не должен резко завершать поворот на 90 градусов');
  now = 1032;
  canvas.onpointerdown(pointer(180));
  assert.deepEqual([sandbox.I, sandbox.V], [3, 2], 'центральное касание должно перемещать персонажа по направлению стрелки');

  sandbox.I = sandbox.X = 3;
  sandbox.V = sandbox.Z = 3;
  sandbox.A = sandbox.D = -1.57;
  now = 1100;
  canvas.onpointerdown(pointer(180));
  assert.equal(sandbox.Q, 2, 'шаг в стену должен включить состояние столкновения');
  const collisionLock = sandbox.E;
  frames.shift()(collisionLock - 1);
  assert.equal(sandbox.Q, 2, 'столкновение должно блокировать управление на 600 мс');
  frames.shift()(collisionLock);
  assert.equal(sandbox.Q, 0, 'после паузы прохождение лабиринта должно продолжаться');

  sandbox.I = sandbox.X = 6;
  sandbox.V = sandbox.Z = 7;
  sandbox.A = sandbox.D = 1.57;
  sandbox.S = 1000;
  now = 3500;
  canvas.onpointerdown(pointer(180));
  assert.equal(sandbox.Q, 3, 'вход на зелёную клетку должен завершить игру');
  assert.equal(sandbox.R, 2.5, 'на финише должно сохраняться затраченное время');
  frames.shift()(4000);
  assert.equal(sandbox.T, 43.5, 'счётчик должен показывать остаток времени в момент выхода');
  frames.shift()(4400);
  assert.equal(sandbox.T, 43.5, 'после выхода счётчик не должен продолжать уменьшаться');
  canvas.onpointerdown(pointer(180));
  assert.equal(sandbox.Q, 3, 'случайное касание после финиша не должно сразу перезапускать игру');
  now = sandbox.E;
  canvas.onpointerdown(pointer(180));
  assert.equal(sandbox.Q, 0, 'через секунду экран финиша должен разрешить новую игру');

  sandbox.Q = 0;
  sandbox.S = 0;
  frames.shift()(46001);
  assert.equal(sandbox.Q, 4, 'по истечении 46 секунд должен открываться экран завершения времени');

  const starts = [];
  for (const value of [0, 0.25, 0.5, 0.75]) {
    randomValue = value;
    sandbox.N();
    starts.push([sandbox.I, sandbox.V]);
  }
  assert.deepEqual(starts, [[3, 3], [13, 1], [5, 13], [9, 13]], 'случайный выбор должен охватывать все четыре точки старта');
});

test('«Карьерный компас» укладывается в QR и содержит три результата', () => {
  const compass = sample.getById('career-compass');
  const url = core.makeDataUrl(compass.html, compass.spec.qr.encoding);
  assert.ok(core.byteLength(url) <= core.getQrLimit(compass.spec.qr.ecc));
  ['Разработка', 'Управление продуктом', 'Аналитика'].forEach((label) => assert.match(compass.html, new RegExp(label)));
  const checks = core.validateHtml(compass.html, compass.spec, { dataUrl: url, encoding: 'base64', ecc: 'M', qrVersion: 40 });
  assert.equal(checks.filter((check) => check.status === 'fail').length, 0);
});

test('валидатор находит внешние ресурсы и сетевые API', () => {
  const html = '<meta name=viewport content="width=device-width"><script src="https://cdn.example/app.js"></script><script>fetch("/api")</script>';
  const checks = core.validateHtml(html, sample.spec, { encoding: 'base64', ecc: 'M' });
  assert.equal(checks.find((check) => check.id === 'external-resources').status, 'fail');
  assert.equal(checks.find((check) => check.id === 'network-apis').status, 'fail');
});

test('автоотчёт предупреждает о коррекции L и указывает сокращение для M', () => {
  const oversizedForM = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><p>' + 'я'.repeat(900) + '</p>';
  const warning = core.validateHtml(oversizedForM, sample.spec, { encoding: 'base64', ecc: 'L' }).find((check) => check.id === 'low-ecc');
  assert.equal(warning.status, 'warn');
  assert.match(warning.message, /снижает устойчивость/);
  assert.match(warning.message, /сократите HTML минимум на \d+ байт/);

  const unnecessaryL = core.validateHtml(sample.html, sample.spec, { encoding: 'base64', ecc: 'L' }).find((check) => check.id === 'low-ecc');
  assert.match(unnecessaryL.message, /уже помещаются в M/);
});

test('валидатор требует doctype, UTF-8 и полноценный мобильный viewport', () => {
  const valid = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><button>OK</button>';
  const invalid = '<meta name=viewport content="width=400"><button>OK</button>';
  ['single-html', 'charset', 'viewport'].forEach((id) => {
    assert.equal(core.validateHtml(valid, sample.spec, {}).find((check) => check.id === id).status, 'pass');
    assert.equal(core.validateHtml(invalid, sample.spec, {}).find((check) => check.id === id).status, 'fail');
  });
});

test('поиск зависимостей охватывает навигацию, CSS import и дополнительные атрибуты', () => {
  const html = '<style>@import "https://cdn.example/theme.css"</style><a href=other.html>Далее</a><video poster=cover.jpg></video><form action=/send></form><meta http-equiv=refresh content="0;url=https://example.test"><script>window.open("https://example.test");location.href="next.html"</script>';
  const external = core.findExternalResources(html).join('\n');
  const network = core.findNetworkApis(html).join('\n');
  assert.match(external, /@import/);
  assert.match(external, /a\[href\]/);
  assert.match(external, /poster/);
  assert.match(external, /form\[action\]/);
  assert.match(external, /meta\[refresh\]/);
  assert.match(network, /window\.open/);
  assert.match(network, /location/);
});

test('динамическая метрика обнаруживает горизонтальное переполнение', () => {
  const url = core.makeDataUrl(sample.html, 'base64');
  const checks = core.validateHtml(sample.html, sample.spec, {
    dataUrl: url,
    encoding: 'base64',
    ecc: 'M',
    runtime: { horizontalOverflow: true, verticalOverflow: false, scrollWidth: 500, scrollHeight: 640, viewportWidth: 360, viewportHeight: 640, errors: [], blocked: [] }
  });
  const overflow = checks.find((check) => check.id === 'horizontal-overflow');
  assert.equal(overflow.status, 'fail');
  assert.match(overflow.evidence, /500/);
});

test('динамические проверки имеют стабильный состав и находят вертикальное переполнение и ошибки', () => {
  const before = core.validateHtml(sample.html, sample.spec, {});
  ['horizontal-overflow', 'vertical-overflow', 'touch-target-size', 'control-spacing', 'control-labels', 'preview-start', 'runtime-errors', 'blocked-operations'].forEach((id) => {
    assert.equal(before.find((check) => check.id === id).status, 'pending', id);
  });
  const runtime = {
    horizontalOverflow: false, verticalOverflow: true,
    scrollWidth: 360, scrollHeight: 700, viewportWidth: 360, viewportHeight: 640,
    controls: [{ left: 0, top: 0, right: 200, bottom: 52, width: 200, height: 52, labeled: true }],
    errors: [{ message: 'boom', line: 7 }], blocked: [{ directive: 'connect-src', uri: 'https://example.test' }]
  };
  const after = core.validateHtml(sample.html, sample.spec, { runtime });
  assert.equal(after.length, before.length);
  assert.equal(after.find((check) => check.id === 'vertical-overflow').status, 'fail');
  assert.equal(after.find((check) => check.id === 'runtime-errors').status, 'fail');
  assert.equal(after.find((check) => check.id === 'blocked-operations').status, 'fail');
  assert.equal(after.find((check) => check.id === 'preview-start').status, 'pass');
});

test('предпросмотр получает CSP с запретом сети и монитор', () => {
  const document = core.buildPreviewDocument('<!doctype html><h1>x</h1>', 'token-1');
  assert.match(document, /connect-src 'none'/);
  assert.match(document, /securitypolicyviolation/);
  assert.match(document, /MutationObserver/);
  assert.match(document, /controls:cs/);
  assert.match(document, /verticalOverflow/);
  assert.match(document, /errors:x\.slice/);
  assert.match(document, /blocked:b\.slice/);
  assert.match(document, /token-1/);
});

test('анализатор интерфейса измеряет размер, подписи и интервалы', () => {
  const metrics = core.analyzeControls([
    { left: 0, top: 0, right: 30, bottom: 30, width: 30, height: 30, labeled: true },
    { left: 0, top: 34, right: 52, bottom: 86, width: 52, height: 52, labeled: false }
  ], 44, 8);
  assert.equal(metrics.count, 2);
  assert.equal(metrics.smallCount, 1);
  assert.equal(metrics.unlabeledCount, 1);
  assert.equal(metrics.tightPairCount, 1);
  assert.equal(metrics.smallestGap, 4);
});

test('анализ размера точно разделяет HTML, CSS, JavaScript и текст', () => {
  const html = '<!doctype html><style>body { color: red }</style><main>Привет</main><script>let x = 1</script>';
  const analysis = core.analyzeSize(html, { encoding: 'base64', ecc: 'M' });
  assert.equal(analysis.totalBytes, core.byteLength(html));
  assert.equal(analysis.categories.reduce((sum, category) => sum + category.bytes, 0), analysis.totalBytes);
  assert.ok(analysis.categories.find((category) => category.id === 'css').bytes > 0);
  assert.ok(analysis.categories.find((category) => category.id === 'javascript').bytes > 0);
  assert.ok(analysis.categories.find((category) => category.id === 'content').bytes >= core.byteLength('Привет'));
});

test('анализ размера предлагает измеримые способы экономии и предупреждает о малом запасе', () => {
  const html = '<!doctype html>\n<!-- комментарий -->\n<style>\nbutton { color: red; margin: 0; }\n</style>\n<main>' + 'A'.repeat(1600) + '</main>\n';
  const payloadBytes = core.byteLength(core.makeDataUrl(html, 'base64'));
  const analysis = core.analyzeSize(html, { encoding: 'base64', ecc: 'M' });
  const ids = analysis.hints.map((hint) => hint.id);
  assert.ok(ids.includes('markup-formatting'));
  assert.ok(ids.includes('css-formatting'));
  assert.ok(ids.includes('payload-reserve'));
  assert.ok(ids.includes('largest-category'));
  assert.equal(analysis.payload.reserve, core.getQrLimit('M') - payloadBytes);
  const asciiAnalysis = core.analyzeSize('<!doctype html><main>' + 'A'.repeat(200) + '</main>', { encoding: 'base64', ecc: 'M' });
  assert.ok(asciiAnalysis.hints.some((hint) => hint.id === 'encoding'));
});

test('runtime-валидатор принимает удобные кнопки и отклоняет маленькие без подписи', () => {
  const html = sample.html;
  const goodRuntime = { horizontalOverflow: false, verticalOverflow: false, errors: [], blocked: [], controls: [
    { left: 0, top: 0, right: 200, bottom: 52, width: 200, height: 52, labeled: true },
    { left: 0, top: 62, right: 200, bottom: 114, width: 200, height: 52, labeled: true }
  ] };
  const badRuntime = { horizontalOverflow: false, verticalOverflow: false, errors: [], blocked: [], controls: [
    { left: 0, top: 0, right: 30, bottom: 30, width: 30, height: 30, labeled: true },
    { left: 0, top: 34, right: 200, bottom: 86, width: 200, height: 52, labeled: false }
  ] };
  const good = core.validateHtml(html, sample.spec, { runtime: goodRuntime });
  const bad = core.validateHtml(html, sample.spec, { runtime: badRuntime });
  ['touch-target-size', 'control-spacing', 'control-labels'].forEach((id) => {
    assert.equal(good.find((check) => check.id === id).status, 'pass');
    assert.equal(bad.find((check) => check.id === id).status, 'fail');
  });
});

test('автоотчёт содержит только автоматические статусы', () => {
  const checks = core.validateHtml(sample.html, sample.spec, {});
  assert.ok(checks.every((check) => ['pass', 'fail', 'warn', 'pending'].includes(check.status)));
});

test('сводка считает только автоматические результаты', () => {
  assert.deepEqual(core.summarizeChecks([
    { status: 'pass' }, { status: 'pass' }, { status: 'fail' }, { status: 'warn' }, { status: 'pending' }, { status: 'legacy' }
  ]), { pass: 2, fail: 1, warn: 1, pending: 1 });
});

test('упрощённый конструктор создаёт валидный автономный тест в пределах QR', () => {
  const built = simpleBuilder.build(simpleBuilder.DEFAULT_CONFIG);
  const url = core.makeDataUrl(built.html, built.spec.qr.encoding);
  const editorPage = fs.readFileSync(path.join(__dirname, '../qr-microapps-lab.html'), 'utf8');
  assert.match(editorPage, /editor\/simple-builder\.js/);
  assert.match(editorPage, /id="mode-simple"/);
  assert.match(editorPage, /id="simple-questions"/);
  assert.match(editorPage, /id="simple-add-question"/);
  assert.match(editorPage, /Профиль проверки/);
  assert.match(editorPage, /id="spec-vertical-overflow-input"/);
  assert.match(editorPage, /<details class="spec-box">[\s\S]*class="summary-hint">показать<\/span>/);
  assert.doesNotMatch(editorPage, /показать \/ скрыть/);
  assert.doesNotMatch(editorPage, /Функциональные требования|Макс\. Data URL|Макс\. HTML/);
  assert.match(editorPage, /<details class="qr-controls">[\s\S]*id="encoding" type="hidden" value="base64"[\s\S]*id="ecc" type="hidden" value="M"[\s\S]*<\/details>\s*<div class="qr-action-row">[\s\S]*id="build"/);
  assert.doesNotMatch(editorPage, />Кодирование<select|>Коррекция QR<select/);
  assert.doesNotMatch(editorPage, /<details class="qr-controls"[^>]*\sopen(?:\s|>)/);
  assert.match(editorPage, /class="qr-column"[\s\S]*id="qr-zoom"[\s\S]*class="download-actions"[\s\S]*class="metrics-column"[\s\S]*id="qr-correction-card"[\s\S]*class="limit-metrics"[\s\S]*id="qr-reserve"[\s\S]*id="qr-l-reserve"/);
  assert.doesNotMatch(editorPage, /id="qr-limit-note"/);
  assert.match(editorPage, /<details class="metric-details">[\s\S]*id="html-bytes"[\s\S]*class="metric checksum-metric"[\s\S]*id="checksum"/);
  assert.match(editorPage, /id="qr-import-analysis"[\s\S]*id="imported-qr-ecc"[\s\S]*id="imported-qr-mask"[\s\S]*id="apply-imported-qr"/);
  assert.match(editorPage, /id="module-scale" type="number" min="1" max="20"[\s\S]*id="quiet-zone" type="number" min="0" max="16"/);
  assert.match(editorPage, /id="qr-emulation-note"[\s\S]*id="clear-qr-emulation"/);
  assert.match(editorPage, /id="qr-mask"/);
  assert.match(editorPage, /<details class="payload-details">[\s\S]*id="data-url"/);
  assert.match(editorPage, /id="qr-open-help"[^>]*hidden[\s\S]*можно выбрать «Поиск»[\s\S]*Открыть как сайт/);
  assert.doesNotMatch(editorPage, /Для проверки автономности повторите запуск в авиарежиме/);
  assert.doesNotMatch(editorPage, /<details class="(?:metric-details|size-analysis|payload-details)"[^>]*\sopen(?:\s|>)/);
  assert.match(editorPage, /id="qr-zoom"[\s\S]*aria-expanded="false"[\s\S]*id="qr-canvas"/);
  assert.match(editorPage, /id="optimization-summary"[\s\S]*id="optimization-saving"[\s\S]*id="optimization-detail"/);
  assert.match(editorPage, /<details class="size-analysis">[\s\S]*class="size-analysis-meta"[\s\S]*id="size-total"[\s\S]*class="summary-hint">показать<\/span>/);
  assert.match(editorPage, /class="validation-inline"[\s\S]*id="validation-summary"[\s\S]*id="validation-remarks"[\s\S]*id="validation-toggle"[\s\S]*id="validation-details"[\s\S]*class="preview-layout"/);
  assert.match(editorPage, /id="validation-toggle"[^>]*class="[^"]*validation-toggle[^"]*summary-hint[^"]*"[^>]*>показать<\/button>/);
  assert.doesNotMatch(editorPage, /class="panel validation-panel"/);
  assert.match(editorPage, /id="open-quick-device-test"[\s\S]*id="open-full-device-test"/);
  assert.match(editorPage, /Полный тест · листы A–F/);
  assert.match(editorPage, /id="device-test-overlay"[\s\S]*id="device-test-pages"[\s\S]*id="device-test-screen-view"/);
  assert.match(editorPage, /id="device-card-ruler"[\s\S]*id="device-card-width"[\s\S]*id="device-screen-module-pixels"/);
  assert.match(editorPage, /<script data-source="editor\/device-test\.js">[\s\S]*<script data-source="editor\/app\.js">/);
  const editorStyles = fs.readFileSync(path.join(__dirname, '../editor/styles.css'), 'utf8');
  assert.match(editorStyles, /\.topbar,\.workspace,footer\{width:100%;max-width:none\}/);
  assert.match(editorStyles, /grid-template-columns:clamp\(320px,22vw,420px\) clamp\(360px,25vw,480px\) minmax\(0,1fr\)/);
  assert.match(editorStyles, /\.device-shell\{border:0;box-shadow:0 0 0 9px/);
  assert.match(editorStyles, /@media\(min-width:1200px\)\{\.topbar h1\{[^}]*white-space:nowrap/);
  assert.match(editorStyles, /@media\(min-width:1600px\)\{\.workspace\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}\}/);
  assert.match(editorStyles, /\.preview-panel \.preview-layout\{grid-template-columns:1fr\}/);
  assert.match(editorStyles, /\.input-panel\{font-size:15px\}/);
  assert.match(editorStyles, /\.qr-stage\.expanded\{position:fixed/);
  assert.match(editorStyles, /\.qr-stage\.expanded\{[^}]*background:#fff/);
  assert.match(editorStyles, /\.output-panel \.result-grid\{grid-template-columns:minmax\(180px,240px\) minmax\(0,1fr\)/);
  assert.match(editorStyles, /\.output-panel \.qr-stage:not\(\.expanded\)\{width:100%;max-width:240px/);
  assert.match(editorStyles, /\.validation-inline\{margin:0 0 16px/);
  assert.match(editorStyles, /\.validation-toolbar \.validation-toggle\{[^}]*width:auto;min-height:0;[^}]*background:transparent/);
  assert.match(editorStyles, /\.validation-remarks-line\.warn\{color:var\(--warning\)\}/);
  assert.match(editorStyles, /\.validation-remarks-line\.fail\{color:var\(--danger\)\}/);
  assert.match(editorStyles, /\.validation-inline \.validation-summary \.badge\.empty\{[^}]*opacity:\.42/);
  assert.match(editorStyles, /\.badge\.pending\{[^}]*color:var\(--muted\)/);
  assert.match(editorStyles, /\.simple-intro-heading\{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap\}/);
  assert.match(editorStyles, /\.simple-question-count\{flex:0 0 auto;white-space:nowrap\}/);
  assert.match(editorStyles, /\.spec-box\[open\]>summary \.summary-hint:after\{content:"скрыть";font-size:12px\}/);
  assert.match(editorStyles, /\.checksum-metric\{grid-column:1\/-1\}/);
  assert.match(editorStyles, /\.checksum-metric strong\{[^}]*font:700 18px\/1\.35[^}]*white-space:normal;overflow-wrap:anywhere\}/);
  assert.match(editorStyles, /\.size-analysis\[open\]>summary \.summary-hint:after\{content:"скрыть";font-size:12px\}/);
  assert.match(editorStyles, /\.qr-open-help\{display:grid;grid-template-columns:32px minmax\(0,1fr\)/);
  assert.match(editorStyles, /\.fallback-metric strong\{color:var\(--muted\)\}/);
  assert.match(editorStyles, /\.fallback-metric\.recovery[^{]*\{[^}]*border-color:#765e2d/);
  assert.match(editorStyles, /\.device-print-page\{[^}]*width:210mm;[^}]*min-height:297mm/);
  assert.match(editorStyles, /\.device-print-preflight\.pass\{color:#176a55\}/);
  assert.match(editorStyles, /\.device-test-screen-view\{display:grid;grid-template-columns:340px minmax\(0,1fr\)/);
  assert.match(editorStyles, /@page\{size:A4 portrait;margin:0\}/);
  const editorApp = fs.readFileSync(path.join(__dirname, '../editor/app.js'), 'utf8');
  const htmlIds = new Set([...editorPage.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of editorApp.matchAll(/\$\('([^']+)'\)/g)) assert.ok(htmlIds.has(match[1]), 'в HTML отсутствует #' + match[1]);
  assert.match(editorApp, /function setQrExpanded\(expanded\)/);
  assert.match(editorApp, /core\.fitQrDisplay\(state\.qr\.modules, state\.qr\.quietZone, window\.innerWidth, window\.innerHeight, window\.devicePixelRatio \|\| 1\)/);
  assert.match(editorApp, /elements\.canvas\.style\.left = fit\.cssLeft \+ 'px'/);
  assert.match(editorApp, /window\.addEventListener\('resize', fitExpandedQr\)/);
  assert.match(editorApp, /function setValidationExpanded\(expanded\)/);
  assert.match(editorApp, /expanded \? 'скрыть' : 'показать'/);
  assert.match(editorApp, /quietWhenEmpty = \(entry\[0\] === 'fail' \|\| entry\[0\] === 'warn'\) && entry\[2\] === 0/);
  assert.match(editorApp, /Предупреждение: /);
  assert.match(editorApp, /Нарушение: /);
  assert.match(editorApp, /var optimization = core\.optimizeHtml\(sourceHtml\)/);
  assert.match(editorApp, /html = core\.optimizeHtml\(currentHtml\(\)\)\.html/);
  assert.match(editorApp, /elements\.qrOpenHelp\.hidden = true/);
  assert.match(editorApp, /elements\.qrOpenHelp\.hidden = !exact/);
  assert.match(editorApp, /core\.analyzeQrImage\(decoded/);
  assert.match(editorApp, /inversionAttempts: 'onlyInvert'/);
  assert.match(editorApp, /var importedEccFits = !!requestedEcc/);
  assert.match(editorApp, /deviceTestApi\.createController/);
  assert.match(editorApp, /jsQR: window\.jsQR/);
  const deviceTestSource = fs.readFileSync(path.join(__dirname, '../editor/device-test.js'), 'utf8');
  for (const match of deviceTestSource.matchAll(/\$\('([^']+)'\)/g)) assert.ok(htmlIds.has(match[1]), 'в HTML отсутствует #' + match[1]);
  assert.match(deviceTestSource, /CARD_WIDTH_MM = 85\.60/);
  assert.match(deviceTestSource, /title: 'Представление и запуск HTML'/);
  assert.match(deviceTestSource, /title: 'Ступени плотности'/);
  assert.match(deviceTestSource, /title: 'Ручной офлайн-запуск на iPhone'/);
  assert.match(deviceTestSource, /verifyCanvasPayload\(canvas, payload, decoder\)/);
  assert.match(deviceTestSource, /modulePixels = Math\.max\(1, Math\.round\(targetCss \* dpr \/ totalModules\)\)/);
  const jsQrSource = fs.readFileSync(path.join(__dirname, '../editor/vendor/jsQR.js'), 'utf8');
  assert.match(jsQrSource, /decoded\.errorCorrectionLevel = \["L", "M", "Q", "H"\]/);
  assert.match(jsQrSource, /dataMask: decoded\.dataMask/);
  assert.deepEqual(core.validateSpec(built.spec), []);
  assert.equal(built.spec.interface.noVerticalScroll, true);
  assert.ok(core.byteLength(url) <= core.getQrLimit(built.spec.qr.ecc));
  assert.equal(built.spec.limits, undefined);
  assert.equal(built.spec.functionalRequirements, undefined);
  assert.equal(built.spec.manualChecks, undefined);
  assert.deepEqual(core.findExternalResources(built.html), []);
  assert.deepEqual(core.findNetworkApis(built.html), []);
});

test('упрощённый конструктор поддерживает произвольное число вопросов и от двух ответов', () => {
  const questions = Array.from({ length: 7 }, (_, questionIndex) => ({
    prompt: 'Вопрос ' + (questionIndex + 1),
    answers: Array.from({ length: 5 }, (_, answerIndex) => 'Ответ ' + (answerIndex + 1)),
    correct: 4
  }));
  const built = simpleBuilder.build({ title: 'Расширенный тест', questions });
  assert.equal(built.config.questions.length, 7);
  built.config.questions.forEach((question) => {
    assert.equal(question.answers.length, 5);
    assert.equal(question.correct, 4);
  });
  assert.match(built.html, /l=Q\.length/);
  assert.doesNotMatch(built.html, /n==3/);
  assert.equal(built.spec.functionalRequirements, undefined);

  const minimum = simpleBuilder.normalizeConfig({ questions: [{ prompt: 'Один', answers: ['Да'], correct: 8 }] });
  assert.equal(minimum.questions.length, 1);
  assert.equal(minimum.questions[0].answers.length, 2);
  assert.equal(minimum.questions[0].correct, 0);
});

test('варианты оформления последовательно меняют объём теста', () => {
  const sizes = ['compact', 'balanced', 'expressive'].map((theme) => {
    const built = simpleBuilder.build({ ...simpleBuilder.DEFAULT_CONFIG, theme });
    assert.equal(built.config.theme, theme);
    assert.deepEqual(core.findExternalResources(built.html), []);
    return core.byteLength(built.html);
  });
  assert.ok(sizes[0] < sizes[1], 'компактное оформление должно быть меньше сбалансированного');
  assert.ok(sizes[1] < sizes[2], 'сбалансированное оформление должно быть меньше выразительного');
  assert.equal(simpleBuilder.normalizeConfig({ theme: 'unknown' }).theme, 'balanced');
});

test('модули сохраняют совместимость параметров, а интерфейс использует Base64 и автокоррекцию', () => {
  const limits = { L: 2953, M: 2331, Q: 1663, H: 1273 };
  ['base64', 'percent'].forEach((encoding) => {
    Object.keys(limits).forEach((ecc) => {
      const built = simpleBuilder.build({ qr: { encoding, ecc } });
      assert.deepEqual(built.config.qr, { encoding, ecc });
      assert.equal(built.spec.qr.encoding, encoding);
      assert.equal(built.spec.qr.ecc, ecc);
      assert.equal(built.spec.limits, undefined);
      assert.equal(core.getQrLimit(ecc), limits[ecc]);
    });
  });
  assert.deepEqual(simpleBuilder.normalizeConfig({ qr: { encoding: 'bad', ecc: 'Z' } }).qr, { encoding: 'base64', ecc: 'M' });

  const appSource = fs.readFileSync(path.join(__dirname, '../editor/app.js'), 'utf8');
  assert.match(appSource, /elements\.encoding\.value = 'base64'/);
  assert.match(appSource, /payloadBytes <= core\.getQrLimit\('M'\) \? 'M' : 'L'/);
  assert.match(appSource, /Данные не помещаются даже в QR с коррекцией L/);
});

test('максимальные кириллические поля упрощённого режима помещаются в QR', () => {
  const built = simpleBuilder.build({
    title: 'Я'.repeat(28),
    questions: [0, 1, 2].map(() => ({ prompt: 'Я'.repeat(48), answers: ['Я'.repeat(24), 'Я'.repeat(24)], correct: 1 }))
  });
  const url = core.makeDataUrl(built.html, 'base64');
  assert.ok(core.byteLength(url) <= core.getQrLimit(built.spec.qr.ecc));
});

test('упрощённый конструктор экранирует разметку и нормализует цвета и правильные ответы', () => {
  const built = simpleBuilder.build({
    title: '<img src=x>',
    colors: { background: 'red', card: '#ABCDEF', accent: '#123456' },
    questions: [{ prompt: '</script><script>bad()</script>', answers: ['<b>Да</b>', 'A&B'], correct: 1 }]
  });
  assert.doesNotMatch(built.html, /<img src=x>/);
  assert.doesNotMatch(built.html, /<script>bad\(\)/);
  assert.match(built.html, /&lt;img src=x&gt;/);
  assert.match(built.html, /\\u003c\/script\\u003e/);
  assert.match(built.html, /background:#071d2b/);
  assert.match(built.html, /background:#abcdef/);
  assert.match(built.html, /background:#123456/);
  assert.equal(built.config.questions[0].correct, 1);
});

test('визуальный конструктор создаёт валидные профили всех эталонов', () => {
  sample.items.forEach((item) => {
    const rebuilt = specBuilder.build(specBuilder.normalize(item.spec));
    assert.deepEqual(core.validateSpec(rebuilt), [], item.id);
    assert.equal(rebuilt.id, item.spec.id);
    assert.equal(rebuilt.title, item.spec.title);
    assert.equal(rebuilt.manualChecks, undefined);
    assert.equal(rebuilt.functionalRequirements, undefined);
    assert.equal(rebuilt.limits, undefined);
    if (item.spec.interface.minTouchTargetPx == null) assert.equal(rebuilt.interface.minTouchTargetPx, undefined);
  });
});

test('конструктор нормализует идентификатор и перечисления', () => {
  const built = specBuilder.build({
    id: 'Новый тест!', title: 'Новый тест', type: 'unknown',
    difficulty: 9,
    qr: { encoding: 'bad', ecc: 'Z', maxVersion: 99 },
    limits: { maxHtmlBytes: 0, maxDataUrlBytes: 2000000 },
    technical: {}, interface: { minTouchTargetPx: 10, minControlGapPx: 99 }
  });
  assert.match(built.id, /^[a-z0-9][a-z0-9-]*$/);
  assert.equal(built.difficulty, 5);
  assert.equal(built.type, 'interactive');
  assert.deepEqual(built.qr, { encoding: 'base64', ecc: 'M' });
  assert.equal(built.limits, undefined);
  assert.equal(built.interface.minTouchTargetPx, 24);
  assert.equal(built.interface.minControlGapPx, 32);
  assert.equal(specBuilder.build({ type: 'game' }).difficulty, 3);
});

test('конструктор игнорирует устаревшие функциональные и ручные поля', () => {
  const built = specBuilder.build({
    id: 'lists', title: 'Списки', qr: { encoding: 'base64', ecc: 'M' },
    functionalRequirements: [' Первое ', '', 'Второе'],
    manualChecks: [
      { id: 'phone', label: 'Телефон', instruction: 'Проверить телефон' },
      { id: 'phone', label: 'Повтор', instruction: 'Проверить ещё раз' },
      { id: 'empty', label: '', instruction: 'Нет названия' }
    ]
  });
  assert.equal(built.functionalRequirements, undefined);
  assert.equal(built.manualChecks, undefined);
  const editorPage = fs.readFileSync(path.join(__dirname, '../qr-microapps-lab.html'), 'utf8');
  assert.match(editorPage, /editor\/spec-builder\.js/);
  assert.match(editorPage, /id="spec-form"/);
  assert.doesNotMatch(editorPage, /id="(?:add-manual|spec-manual-list)"/);
});

test('история обновляет одинаковую сборку без дубликата и нумерует изменения', () => {
  const first = history.upsert([], { applicationId: 'quiz', title: 'Тест', signature: 'a', htmlBytes: 100, validation: { pass: 2 } }, 50);
  const updated = history.upsert(first.items, { applicationId: 'quiz', title: 'Тест', signature: 'a', htmlBytes: 100, validation: { pass: 5 } }, 50);
  const changed = history.upsert(updated.items, { applicationId: 'quiz', title: 'Тест', signature: 'b', htmlBytes: 90, validation: { pass: 5 } }, 50);
  assert.equal(first.record.number, 1);
  assert.equal(updated.items.length, 1);
  assert.equal(updated.added, false);
  assert.equal(updated.record.number, 1);
  assert.equal(updated.record.validation.pass, 5);
  assert.equal(changed.items.length, 2);
  assert.equal(changed.record.number, 2);
});

test('сравнение истории использует предыдущую сборку того же приложения', () => {
  const first = history.normalize({ number: 1, applicationId: 'quiz', htmlBytes: 120, dataUrlBytes: 200, qrVersion: 5, validation: { fail: 2 } });
  const other = history.normalize({ number: 2, applicationId: 'game', htmlBytes: 500, dataUrlBytes: 800, qrVersion: 10, validation: { fail: 0 } });
  const current = history.normalize({ number: 3, applicationId: 'quiz', htmlBytes: 100, dataUrlBytes: 180, qrVersion: 4, validation: { fail: 0 } });
  const items = [first, other, current];
  assert.equal(history.previousFor(items, current), first);
  assert.deepEqual(history.compare(first, current), { htmlBytes: -20, dataUrlBytes: -20, qrVersion: -1, fail: -2 });
});

test('CSV истории не содержит исходник и защищает формулы таблиц', () => {
  const record = history.normalize({
    number: 1, recordedAt: '2026-08-17T10:00:00.000Z', applicationId: 'quiz', title: '=2+2',
    htmlBytes: 100, dataUrlBytes: 180, qrVersion: 4, encoding: 'base64', ecc: 'M',
    validation: { pass: 5, fail: 0, warn: 0, pending: 0, manual: 2 }, roundtripOk: true, checksum: 'abc'
  });
  const csv = history.toCsv([record]);
  assert.equal(record.validation.manual, undefined);
  assert.equal(csv.trim().split(/\r?\n/).length, 2);
  assert.equal(csv.trim().split(/\r?\n/)[0].split(',').length, 15);
  assert.match(csv, /"'=2\+2"/);
  assert.doesNotMatch(csv, /data:text\/html|<!doctype/i);
  const editorPage = fs.readFileSync(path.join(__dirname, '../qr-microapps-lab.html'), 'utf8');
  assert.match(editorPage, /editor\/history\.js/);
  assert.match(editorPage, /id="iteration-history"/);
});

function comparisonReport(options = {}) {
  return {
    reportVersion: '0.1', generatedAt: options.generatedAt || '2026-08-17T12:00:00.000Z',
    application: { id: options.applicationId || 'shared-task', title: options.title || 'Реализация' },
    specification: { id: options.assignmentId || 'shared-task' },
    measurements: {
      htmlBytes: options.htmlBytes || 1000, dataUrlBytes: options.dataUrlBytes || 1400,
      encoding: 'base64', checksum: { algorithm: 'SHA-256', value: options.checksum || 'abc' },
      qr: { version: options.qrVersion == null ? 30 : options.qrVersion, ecc: 'M' }
    },
    roundtrip: { ok: options.roundtripOk !== false },
    validation: { summary: { pass: 10, fail: options.fail || 0, warn: options.warn || 0, pending: options.pending || 0, manual: 3 }, checks: [] }
  };
}

test('сравнение принимает валидный отчёт и вычисляет автоматическую готовность', () => {
  const item = comparison.normalize(comparisonReport({ title: 'Вариант А', checksum: 'aaa' }), 'p01.json');
  assert.equal(item.source, 'p01.json');
  assert.equal(item.automaticReady, true);
  assert.equal(item.dataUrlBytes, 1400);
  assert.equal(item.validation.manual, undefined);
  const failed = comparison.normalize(comparisonReport({ fail: 2, checksum: 'bbb' }), 'p02.json');
  assert.equal(failed.automaticReady, false);
  const pending = comparison.normalize(comparisonReport({ pending: 2, checksum: 'ccc' }), 'p03.json');
  assert.equal(pending.automaticReady, false);
});

test('порядок сравнения прозрачно учитывает готовность, нарушения и размер', () => {
  const small = comparison.normalize(comparisonReport({ title: 'Малый', dataUrlBytes: 1200, checksum: 'small' }), 'small.json');
  const large = comparison.normalize(comparisonReport({ title: 'Большой', dataUrlBytes: 1600, checksum: 'large' }), 'large.json');
  const failed = comparison.normalize(comparisonReport({ title: 'С нарушением', fail: 1, dataUrlBytes: 900, checksum: 'fail' }), 'fail.json');
  assert.deepEqual(comparison.rank([failed, large, small]).map((item) => item.title), ['Малый', 'Большой', 'С нарушением']);
  assert.equal(comparison.summarize([small, large]).mixedAssignments, false);
  const other = comparison.normalize(comparisonReport({ assignmentId: 'other', checksum: 'other' }), 'other.json');
  assert.equal(comparison.summarize([small, other]).mixedAssignments, true);
});

test('повторный отчёт обновляется без дубля, а другой источник сохраняется отдельно', () => {
  const report = comparisonReport({ checksum: 'same' });
  const first = comparison.upsert([], report, 'p01.json', 30);
  const repeated = comparison.upsert(first.items, report, 'p01.json', 30);
  const otherSource = comparison.upsert(repeated.items, report, 'p02.json', 30);
  assert.equal(first.added, true);
  assert.equal(repeated.added, false);
  assert.equal(repeated.items.length, 1);
  assert.equal(otherSource.items.length, 2);
});

test('CSV сравнения безопасен для таблиц и не содержит HTML или data URL', () => {
  const item = comparison.normalize(comparisonReport({ title: '=SUM(1,2)', checksum: 'safe' }), '@report.json');
  const csv = comparison.toCsv([item]);
  assert.match(csv, /"'=SUM\(1,2\)"/);
  assert.match(csv, /"'@report\.json"/);
  assert.doesNotMatch(csv, /<!doctype|data:text\/html/i);
  assert.equal(csv.trim().split(/\r?\n/)[0].split(',').length, 18);
  assert.throws(() => comparison.parse('{"reportVersion":"9"}', 'bad.json'), /версии 0\.1/i);
  const editorPage = fs.readFileSync(path.join(__dirname, '../qr-microapps-lab.html'), 'utf8');
  assert.match(editorPage, /editor\/comparison\.js/);
  assert.match(editorPage, /id="comparison-list"/);
  assert.match(editorPage, /id="comparison-files"[^>]*multiple/);
});

test('файл проекта сохраняет HTML, спецификацию и настройки без потерь', () => {
  const item = sample.getById('tiny-quiz');
  const text = projectFile.serialize({
    savedAt: '2026-08-17T12:00:00.000Z', html: item.html, specification: item.spec,
    settings: { encoding: 'base64', ecc: 'M', moduleScale: 8, quietZone: 6 },
    preview: { preset: '390x844', width: 390, height: 844 }
  });
  const restored = projectFile.parse(text);
  assert.equal(restored.format, 'qr-microapps-project');
  assert.equal(restored.version, '0.1');
  assert.equal(restored.html, item.html);
  assert.deepEqual(restored.specification, item.spec);
  assert.deepEqual(restored.settings, { encoding: 'base64', ecc: 'M', moduleScale: 8, quietZone: 6 });
  assert.deepEqual(restored.preview, { preset: '390x844', width: 390, height: 844 });
  const emulationSettings = projectFile.create({
    html: item.html, specification: item.spec,
    settings: { encoding: 'base64', ecc: 'Q', moduleScale: 1, quietZone: 0 }
  }).settings;
  assert.deepEqual(emulationSettings, { encoding: 'base64', ecc: 'Q', moduleScale: 1, quietZone: 0 });
});

test('файл проекта сохраняет редактируемую конфигурацию конструктора теста', () => {
  const config = simpleBuilder.normalizeConfig({ title: 'Сохранённый тест', theme: 'expressive', qr: { encoding: 'percent', ecc: 'L' } });
  const built = simpleBuilder.build(config);
  const restored = projectFile.parse(projectFile.serialize({
    html: built.html, specification: built.spec,
    editor: { mode: 'simple', simpleConfig: config }
  }));
  assert.equal(restored.editor.mode, 'simple');
  assert.deepEqual(restored.editor.simpleConfig, config);
  assert.equal(restored.editor.simpleConfig.theme, 'expressive');
  assert.deepEqual(restored.editor.simpleConfig.qr, { encoding: 'percent', ecc: 'L' });
  assert.equal(simpleBuilder.build(restored.editor.simpleConfig).html, restored.html);
});

test('импорт проекта отклоняет чужой формат, новую версию и слишком большой файл', () => {
  assert.throws(() => projectFile.parse('{"format":"other","version":"0.1","html":"x","specification":{}}'), /не файл проекта/i);
  assert.throws(() => projectFile.parse('{"format":"qr-microapps-project","version":"9","html":"x","specification":{}}'), /не поддерживается/i);
  assert.throws(() => projectFile.parse(' '.repeat(projectFile.MAX_TEXT_LENGTH + 1)), /слишком велик/i);
  const editorPage = fs.readFileSync(path.join(__dirname, '../qr-microapps-lab.html'), 'utf8');
  assert.match(editorPage, /editor\/project\.js/);
  assert.match(editorPage, /id="project-file"/);
  assert.match(editorPage, /id="download-spec"/);
  assert.match(editorPage, /id="download-game-spec"/);
  assert.match(editorPage, /id="copy-game-spec"/);
  assert.match(editorPage, /Спецификация предназначена для создания игр с помощью ИИ/);
  assert.match(editorPage, /id="embedded-game-spec"/);
  const appSource = fs.readFileSync(path.join(__dirname, '../editor/app.js'), 'utf8');
  const openProjectSource = appSource.slice(appSource.indexOf('async function openProject'), appSource.indexOf('async function copyDataUrl'));
  assert.ok(openProjectSource.length > 200);
  assert.doesNotMatch(openProjectSource, /runPreview\s*\(/, 'импорт не должен автоматически выполнять HTML');
});

test('спецификация документации фиксирует карты, изображения и обратную совместимость', () => {
  const gameSpecification = fs.readFileSync(path.join(__dirname, '../spec_game_creation_ru.md'), 'utf8');
  ['## 12. Документация примера в каталоге', "type: 'grid-map'", 'Другие карты и изображения', 'Обратная совместимость визуализаторов'].forEach((text) => {
    assert.ok(gameSpecification.includes(text), 'в спецификации должен быть раздел: ' + text);
  });
  assert.match(gameSpecification, /интерактивная карта маршрутов[\s\S]*самостоятельный тип/);
  assert.match(gameSpecification, /неизвестный тип визуализации[\s\S]*проигнорирован без ошибки/);
  const appSource = fs.readFileSync(path.join(__dirname, '../editor/app.js'), 'utf8');
  const documentationRenderer = appSource.slice(appSource.indexOf('function createDocumentationSvgElement'), appSource.indexOf('function openSampleDocumentation'));
  assert.match(documentationRenderer, /sectionData\.diagram/,'старое поле diagram должно оставаться в рендерере');
  assert.match(documentationRenderer, /visualization\.type === 'grid-map'/, 'grid-map должен использовать отдельный рендерер');
  assert.doesNotMatch(documentationRenderer, /innerHTML/, 'визуализаторы документации не должны вставлять произвольную разметку');
});

test('выбор примера сразу загружает его, а описание относится к предпросмотру', () => {
  const editorSource = fs.readFileSync(path.join(__dirname, '../editor/source.html'), 'utf8');
  assert.doesNotMatch(editorSource, /id="load-sample"/, 'отдельной кнопки загрузки примера быть не должно');
  const previewSection = editorSource.slice(editorSource.indexOf('<section class="panel preview-panel"'), editorSource.indexOf('<section class="panel history-panel"'));
  assert.match(previewSection, /id="sample-documentation-open"[^>]*>Описание примера</, 'описание должно открываться из этапа предпросмотра');
  const appSource = fs.readFileSync(path.join(__dirname, '../editor/app.js'), 'utf8');
  const selectionHandler = appSource.slice(appSource.indexOf("elements.exampleSelect.addEventListener('change'"), appSource.indexOf('elements.sampleDocumentationOpen.addEventListener'));
  assert.match(selectionHandler, /loadSample\(elements\.exampleSelect\.value\)/);
  assert.match(selectionHandler, /build\(\)\.then/);
  assert.match(selectionHandler, /runPreview\(\)/);
  assert.doesNotMatch(appSource, /\$\('load-sample'\)/);
});
