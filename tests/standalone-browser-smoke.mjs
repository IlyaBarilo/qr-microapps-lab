import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const standaloneUrl = pathToFileURL(resolve(root, 'qr-microapps-lab.html')).href;
const expectedGameSpecification = readFileSync(resolve(root, 'spec_game_creation_ru.md'), 'utf8')
  .replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\n*$/, '\n');
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const pageErrors = [];
  const consoleErrors = [];
  const networkRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => {
    if (/^https?:/i.test(request.url())) networkRequests.push(request.url());
  });

  await page.goto(standaloneUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений', null, { timeout: 30_000 });
  const result = await page.evaluate(() => ({
    canvasVisible: getComputedStyle(document.querySelector('#qr-canvas')).display !== 'none',
    licenses: document.querySelector('#embedded-license-notices')?.textContent || '',
    validationSummary: document.querySelector('#validation-summary')?.textContent || '',
    correction: document.querySelector('#qr-correction-value')?.textContent || '',
    lReserveColor: getComputedStyle(document.querySelector('#qr-l-reserve')).color,
    hiddenSettings: document.querySelector('#encoding')?.type === 'hidden' && document.querySelector('#ecc')?.type === 'hidden',
    appVersions: [...document.querySelectorAll('[data-app-version]')].map((element) => element.textContent),
    gameSpecification: document.querySelector('#embedded-game-spec')?.content.querySelector('pre')?.textContent || '',
    difficultyVisible: !document.querySelector('#difficulty-editor')?.hidden,
    difficultyDisabled: document.querySelector('#code-difficulty')?.disabled && document.querySelector('#apply-difficulty')?.disabled,
    previewDifficulty: document.querySelector('#preview-difficulty')?.textContent || ''
  }));

  assert.equal(result.canvasVisible, true, 'QR-canvas должен быть видим после стартовой проверки.');
  assert.match(result.licenses, /QRCODE\.JS 1\.0\.0 — MIT LICENSE/);
  assert.match(result.licenses, /JSQR 1\.4\.0 — APACHE LICENSE 2\.0/);
  assert.match(result.validationSummary, /Пройдено: \d+ из \d+/);
  assert.equal(result.correction, 'M');
  assert.equal(result.lReserveColor, 'rgb(154, 180, 192)', 'Резерв L при выбранной M должен быть серым.');
  assert.equal(result.hiddenSettings, true);
  assert.equal(new Set(result.appVersions).size, 1, 'В заголовке и подвале должна отображаться одна версия программы.');
  assert.match(result.appVersions[0], /^v\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?$/, 'Локальная версия должна иметь публичный формат тега.');
  assert.equal(result.gameSpecification, expectedGameSpecification, 'Встроенная Markdown-спецификация должна точно совпадать с исходным файлом.');
  assert.equal(result.difficultyVisible, true, 'Блок сложности должен быть виден для любого кода.');
  assert.equal(result.difficultyDisabled, false, 'У стартовой игры с $d управление сложностью должно быть активно.');
  assert.equal(result.previewDifficulty, 'Сложность: 3 — средняя');

  const specificationDownloadPromise = page.waitForEvent('download');
  await page.click('#download-game-spec');
  const specificationDownload = await specificationDownloadPromise;
  assert.equal(specificationDownload.suggestedFilename(), 'spec_game_creation_ru.md');
  assert.equal(readFileSync(await specificationDownload.path(), 'utf8'), expectedGameSpecification.replace(/\n/g, '\r\n'), 'Скачанная спецификация должна сохранять полный текст в CRLF.');
  await page.click('#copy-game-spec');
  await page.waitForFunction(() => document.querySelector('#status')?.textContent !== 'Спецификация создания игр сохранена локально.');
  assert.equal(await page.locator('#status').textContent(), 'Текст спецификации создания игр скопирован.');

  const generatedQr = Buffer.from(await page.locator('#qr-canvas').evaluate((canvas) => canvas.toDataURL('image/png').split(',')[1]), 'base64');
  await page.fill('#source', '');
  await page.locator('#qr-image-file').setInputFiles({ name: 'microapp-qr.png', mimeType: 'image/png', buffer: generatedQr });
  await page.waitForFunction(() => document.querySelector('#status')?.textContent.includes('QR-изображение декодировано'), null, { timeout: 30_000 });
  assert.match(await page.locator('#source').inputValue(), /РАЗБЕЙ БЛОКИ/, 'Загруженное QR-изображение должно декодироваться обратно в HTML-код.');

  await page.click('#build');
  await page.waitForTimeout(800);
  assert.equal(await page.locator('#validation-summary').textContent(), result.validationSummary, 'Повторная генерация не должна менять число проверок.');
  assert.deepEqual(networkRequests, [], 'Автономный HTML не должен выполнять HTTP/HTTPS-запросы.');
  assert.deepEqual(pageErrors, [], 'Автономный HTML не должен создавать ошибки страницы.');
  assert.deepEqual(consoleErrors, [], 'Автономный HTML не должен создавать ошибки консоли.');

  const fitsOnlyL = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><p>' + 'я'.repeat(900) + '</p>';
  await page.fill('#source', fitsOnlyL);
  await page.click('#build');
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений' && document.querySelector('#qr-correction-value')?.textContent === 'L', null, { timeout: 30_000 });
  assert.equal(await page.locator('#preview-difficulty').textContent(), 'Без сложности');
  const automaticL = await page.evaluate(() => ({
    ecc: document.querySelector('#ecc')?.value,
    label: document.querySelector('#qr-reserve-label')?.textContent || '',
    current: document.querySelector('#qr-reserve')?.textContent || '',
    fallbackLabel: document.querySelector('#qr-l-option-label')?.textContent || '',
    reduction: document.querySelector('#qr-l-reserve')?.textContent || '',
    note: document.querySelector('#qr-correction-note')?.textContent || '',
    lowEccWarning: [...document.querySelectorAll('.check.warn')].some((element) => element.textContent.includes('Коррекция L'))
  }));
  assert.equal(automaticL.ecc, 'L', 'M должен автоматически переключаться на L при доступной вместимости.');
  assert.equal(automaticL.label, 'Запас при L');
  assert.match(automaticL.current, /^\+\d+ Б$/);
  assert.equal(automaticL.fallbackLabel, 'Сократить для M');
  assert.match(automaticL.reduction, /^\d+ Б$/);
  assert.match(automaticL.note, /Устойчивость к повреждениям снижена/);
  assert.equal(automaticL.lowEccWarning, true, 'Автоотчёт должен предупреждать о сниженной устойчивости L.');

  await page.evaluate(() => {
    document.querySelector('#source').value = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><button>OK</button>';
    document.querySelector('#encoding').value = 'percent';
    document.querySelector('#ecc').value = 'H';
  });
  await page.click('#build');
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений' && document.querySelector('#qr-correction-value')?.textContent === 'M', null, { timeout: 30_000 });
  assert.match(await page.locator('#data-url').inputValue(), /^data:text\/html;charset=utf-8;base64,/, 'Ручное значение Percent должно заменяться фиксированным Base64.');

  await page.selectOption('#example-select', 'packet-network');
  await page.click('#load-sample');
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений', null, { timeout: 30_000 });
  const packetGeometry = await page.frameLocator('#preview').locator('canvas').evaluate((canvas) => ({
    logicalHeight: window.H,
    transformY: canvas.getContext('2d').getTransform().f
  }));
  assert.equal(packetGeometry.transformY, 0, 'Поле «Пакет в сети» должно начинаться у верхнего края.');
  assert.ok(packetGeometry.logicalHeight > 360, '«Пакет в сети» должен использовать всю высоту экрана без нижнего следа.');

  await page.selectOption('#example-select', 'brick-breaker');
  await page.click('#load-sample');
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений', null, { timeout: 30_000 });
  const ballGeometry = await page.frameLocator('#preview').locator('canvas').evaluate((canvas) => ({
    logicalHeight: window.H,
    platformY: window.PY,
    transformY: canvas.getContext('2d').getTransform().f
  }));
  assert.equal(ballGeometry.transformY, 0, 'Поле «Разбей блоки» должно начинаться у верхнего края.');
  assert.ok(ballGeometry.logicalHeight > 360, 'Высокий экран должен использоваться по всей высоте.');
  assert.ok(Math.abs(ballGeometry.logicalHeight - ballGeometry.platformY - 75) < 0.01, 'Под платформой должна оставаться увеличенная зона управления.');

  await page.selectOption('#example-select', 'brick-breaker');
  await page.click('#load-sample');
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений', null, { timeout: 30_000 });
  assert.equal(await page.locator('#difficulty-editor').isVisible(), true, 'Для любого HTML должен отображаться блок сложности.');
  assert.equal(await page.locator('#code-difficulty').inputValue(), '3', 'По умолчанию должна выбираться средняя сложность.');
  const sourceBeforeDifficulty = await page.locator('#source').inputValue();
  await page.selectOption('#code-difficulty', '5');
  assert.equal(await page.locator('#source').inputValue(), sourceBeforeDifficulty, 'Смена сложности не должна перезаписывать HTML до нажатия «Применить».');
  await page.click('#apply-difficulty');
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений', null, { timeout: 30_000 });
  assert.equal(await page.locator('#qr-correction-value').textContent(), 'M', '«Разбей блоки» должна помещаться в QR с коррекцией M.');
  assert.equal(JSON.parse(await page.locator('#spec').inputValue()).difficulty, 5, 'Выбранная сложность должна сохраняться в профиле.');
  const brickCanvas = page.frameLocator('#preview').locator('canvas');
  await brickCanvas.click({ position: { x: 180, y: 320 } });
  await brickCanvas.evaluate(() => {
    A = 1;
    K = 31;
    X = 18.5 - V;
    Y = 52 - U;
  });
  await page.waitForTimeout(100);
  const brickResult = await brickCanvas.evaluate(() => ({ blocks: A, score: K, state: Q }));
  assert.deepEqual(brickResult, { blocks: 0, score: 32, state: 3 }, 'Последний из 32 блоков должен давать очко и открывать экран победы.');

  await page.selectOption('#example-select', 'firewall');
  await page.click('#load-sample');
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений' && document.querySelector('#qr-correction-value')?.textContent === 'M', null, { timeout: 30_000 });
  assert.equal(await page.locator('#preview-difficulty').textContent(), 'Сложность: 3 — средняя');
  assert.equal(await page.locator('.validation-remarks-line.warn').count(), 0, 'У «Брандмауэра» не должно быть предупреждения о коррекции L.');
  assert.equal(await page.locator('.validation-remarks-line.fail').count(), 0, 'У «Брандмауэра» не должно быть нарушений переполнения.');
  const firewallCanvas = page.frameLocator('#preview').locator('canvas');
  assert.equal(await firewallCanvas.evaluate(() => m), 1, '«Брандмауэр» должен начинаться со стартового экрана.');
  await firewallCanvas.click({ position: { x: 180, y: 320 } });
  assert.equal(await firewallCanvas.evaluate(() => q), 0, 'Касание должно запускать «Брандмауэр».');

  await page.fill('#source', '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><script>var $d=3,$score=0</script>');
  await page.click('#build');
  await page.waitForFunction(() => document.querySelector('.validation-remarks-line.warn')?.textContent.includes('Зарезервированный префикс $'), null, { timeout: 30_000 });
  assert.match(await page.locator('.validation-remarks-line.warn').textContent(), /Предупреждение: Зарезервированный префикс \$/);

  await page.fill('#source', '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><script>setTimeout(()=>{throw Error("boom")},20)</script>');
  await page.click('#build');
  await page.waitForFunction(() => /Ошибка JavaScript:.*boom/.test(document.querySelector('#runtime-log')?.textContent || ''), null, { timeout: 30_000 });
  await page.waitForFunction(() => [...document.querySelectorAll('.check')].some((element) => element.textContent.includes('Ошибки выполнения') && element.classList.contains('fail')), null, { timeout: 30_000 });
  const runtimeErrorCheck = await page.locator('.check', { hasText: 'Ошибки выполнения' }).evaluate((element) => ({
    className: element.className,
    text: element.textContent
  }));
  assert.match(runtimeErrorCheck.className, /\bfail\b/, 'Ошибка пользовательского JavaScript должна нарушать автопроверку.');
  assert.match(runtimeErrorCheck.text, /нарушение/, 'Ошибка выполнения должна иметь статус нарушения.');

  await page.fill('#source', '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><img src="https://example.invalid/blocked.png" alt="x">');
  await page.click('#build');
  await page.waitForFunction(() => document.querySelector('#runtime-log')?.textContent.includes('Заблокирован ресурс:'), null, { timeout: 30_000 });
  await page.waitForFunction(() => [...document.querySelectorAll('.check')].some((element) => element.textContent.includes('Заблокированные операции') && element.classList.contains('fail')), null, { timeout: 30_000 });
  const blockedCheck = await page.locator('.check', { hasText: 'Заблокированные операции' }).evaluate((element) => ({
    className: element.className,
    text: element.textContent
  }));
  assert.match(blockedCheck.className, /\bfail\b/, 'Заблокированный внешний ресурс должен нарушать автопроверку.');
  assert.match(blockedCheck.text, /нарушение/, 'Заблокированная операция должна иметь статус нарушения.');
  await page.fill('#source', '<!doctype html><button>OK</button>');
  await page.click('#build');
  await page.waitForFunction(() => !document.querySelector('#validation-remarks')?.hidden, null, { timeout: 30_000 });
  const remarksLayout = await page.evaluate(() => {
    const summary = document.querySelector('#validation-summary').getBoundingClientRect();
    const remarks = document.querySelector('#validation-remarks').getBoundingClientRect();
    const failure = document.querySelector('.validation-remarks-line.fail');
    return { summaryBottom: summary.bottom, remarksTop: remarks.top, color: getComputedStyle(failure).color, text: failure.textContent };
  });
  assert.ok(remarksLayout.remarksTop >= remarksLayout.summaryBottom, 'Замечания должны располагаться ниже индикаторов.');
  assert.match(remarksLayout.text, /^Нарушение: /);
  assert.equal(remarksLayout.color, 'rgb(255, 127, 133)', 'Нарушение должно выводиться красным цветом.');
  console.log('Автономный HTML успешно запущен напрямую с диска без сетевых запросов.');
} finally {
  await browser.close();
}
