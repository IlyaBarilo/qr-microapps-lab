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

function countPdfPages(pdf) {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
}

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
    appVersionWrappersHidden: [...document.querySelectorAll('[data-app-version-wrap]')].every((element) => element.hidden),
    gameSpecification: document.querySelector('#embedded-game-spec')?.content.querySelector('pre')?.textContent || '',
    difficultyVisible: !document.querySelector('#difficulty-editor')?.hidden,
    difficultyDisabled: document.querySelector('#code-difficulty')?.disabled && document.querySelector('#apply-difficulty')?.disabled,
    previewDifficulty: document.querySelector('#preview-difficulty')?.textContent || '',
    theme: document.documentElement.dataset.theme,
    themeLabel: document.querySelector('#theme-toggle-label')?.textContent || '',
    panelBackground: getComputedStyle(document.querySelector('.panel')).backgroundImage
  }));

  assert.equal(result.canvasVisible, true, 'QR-canvas должен быть видим после стартовой проверки.');
  assert.match(result.licenses, /QRCODE\.JS 1\.0\.0 — MIT LICENSE/);
  assert.match(result.licenses, /JSQR 1\.4\.0 — APACHE LICENSE 2\.0/);
  assert.match(result.validationSummary, /Пройдено: \d+ из \d+/);
  assert.equal(result.correction, 'M');
  assert.equal(result.lReserveColor, 'rgb(154, 180, 192)', 'Резерв L при выбранной M должен быть серым.');
  assert.equal(result.hiddenSettings, true);
  assert.deepEqual(result.appVersions, ['', ''], 'Рабочая сборка не должна подставлять номер версии.');
  assert.equal(result.appVersionWrappersHidden, true, 'В рабочей сборке номер версии должен быть скрыт в заголовке и подвале.');
  assert.equal(result.gameSpecification, expectedGameSpecification, 'Встроенная Markdown-спецификация должна точно совпадать с исходным файлом.');
  assert.equal(result.difficultyVisible, true, 'Блок сложности должен быть виден для любого кода.');
  assert.equal(result.difficultyDisabled, false, 'У стартовой игры с $d управление сложностью должно быть активно.');
  assert.equal(result.previewDifficulty, 'Сложность: 3 — средняя');
  assert.equal(result.theme, 'dark', 'Рабочая сборка должна открываться в тёмной теме по умолчанию.');
  assert.equal(result.themeLabel, 'Светлая тема');

  await page.click('#open-full-device-test');
  await page.waitForFunction(() => document.querySelectorAll('.device-print-page').length === 3 && document.querySelectorAll('.device-print-code').length === 12);
  const devicePages = await page.evaluate(() => ({
    pageCount: document.querySelectorAll('.device-print-page').length,
    codeCount: document.querySelectorAll('.device-print-code').length,
    pageTitles: [...document.querySelectorAll('.device-print-page h3')].map((element) => element.textContent),
    codeIds: [...document.querySelectorAll('.device-print-code')].map((element) => element.dataset.testCodeId),
    labels: [...document.querySelectorAll('.device-print-code-copy strong')].map((element) => element.textContent),
    timestamps: [...document.querySelectorAll('[data-print-timestamp]')].map((element) => element.textContent),
    brickPayload: document.querySelector('[data-test-code-id="A4"] canvas')?.width || 0
  }));
  assert.equal(devicePages.pageCount, 3, 'Полный тест устройства должен содержать три листа A4.');
  assert.equal(devicePages.codeCount, 12, 'Полный тест устройства должен содержать 12 QR-кодов.');
  assert.deepEqual(devicePages.pageTitles.map((title) => title.slice(0, 6)), ['Лист A', 'Лист B', 'Лист C']);
  assert.deepEqual(devicePages.codeIds, ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4']);
  assert.ok(devicePages.labels.some((label) => label.includes('Игра «ИТ-мини-тест»')), 'Обзорный лист должен включать точный мини-тест.');
  assert.ok(devicePages.labels.some((label) => label.includes('Игра «Разбей блоки»')), 'Обзорный лист должен включать точную игру «Разбей блоки».');
  assert.equal(devicePages.timestamps.length, 3, 'Каждый печатный лист должен содержать метку времени.');
  assert.ok(devicePages.timestamps.every((timestamp) => timestamp === devicePages.timestamps[0] && /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/.test(timestamp)), 'На всех листах должна быть одна корректная дата печати.');
  assert.ok(devicePages.brickPayload > 0, 'Тестовые QR должны быть отрисованы в предпросмотре листа.');
  await page.evaluate(() => document.querySelectorAll('[data-print-timestamp]').forEach((element) => { element.textContent = 'ожидание печати'; }));
  const fullPrintPdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  assert.equal(countPdfPages(fullPrintPdf), 3, 'Полный набор должен печататься ровно на трёх листах без пустых страниц.');
  const timestampsAfterPrint = await page.locator('[data-print-timestamp]').allTextContents();
  assert.ok(timestampsAfterPrint.every((timestamp) => timestamp === timestampsAfterPrint[0] && /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/.test(timestamp)), 'Событие печати должно обновлять дату одновременно на всех листах.');

  await page.selectOption('#device-test-set', 'quick');
  await page.waitForFunction(() => document.querySelectorAll('.device-print-page').length === 1 && document.querySelector('[data-test-code-id="Q4"]'));
  const quickPrintPdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  assert.equal(countPdfPages(quickPrintPdf), 1, 'Быстрый набор должен печататься ровно на одном листе.');
  await page.selectOption('#device-test-set', 'full');
  await page.waitForFunction(() => document.querySelectorAll('.device-print-page').length === 3 && document.querySelector('[data-test-code-id="A3"]'));
  const decodedDeviceCodes = await page.evaluate(() => [...document.querySelectorAll('.device-print-code canvas')].map((canvas) => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    return !!jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' });
  }));
  assert.ok(decodedDeviceCodes.every(Boolean), 'Все 12 тестовых QR должны независимо декодироваться из пикселей.');

  await page.click('[data-test-code-id="A3"]');
  await page.waitForFunction(() => !document.querySelector('#device-test-screen-view')?.hidden && document.querySelector('#device-screen-code')?.value === 'A3' && document.querySelector('#device-screen-canvas')?.width > 0);
  const screenQr = await page.evaluate(() => ({
    selected: document.querySelector('#device-screen-code')?.value,
    cssSize: document.querySelector('#device-screen-css-size')?.textContent || '',
    buffer: document.querySelector('#device-screen-buffer-size')?.textContent || '',
    modulePixels: document.querySelector('#device-screen-module-pixels')?.textContent || '',
    physical: document.querySelector('#device-screen-physical-size')?.textContent || ''
  }));
  assert.equal(screenQr.selected, 'A3');
  assert.match(screenQr.cssSize, /CSS px/);
  assert.match(screenQr.buffer, /px/);
  assert.match(screenQr.modulePixels, /^\d+ px\/модуль$/);
  assert.match(screenQr.physical, /^≈/);

  await page.locator('#device-card-width').fill('428');
  await page.click('#device-calibration-save');
  assert.match(await page.locator('#device-calibration-result').textContent(), /Сохранено: 5,00 CSS px\/мм/);
  assert.doesNotMatch(await page.locator('#device-screen-physical-size').textContent(), /^≈/);
  await page.click('#device-screen-only');
  assert.equal(await page.locator('#device-test-overlay').evaluate((element) => element.classList.contains('qr-only')), true, 'Режим «Только QR» должен скрывать элементы управления.');
  await page.click('#device-screen-only-exit');
  await page.click('#device-test-close');
  assert.equal(await page.locator('#device-test-overlay').isHidden(), true);

  const decodedCorrectionLevels = await page.evaluate(() => ['L', 'M', 'Q', 'H'].map((level) => {
    const holder = document.createElement('div');
    document.body.appendChild(holder);
    const instance = new QRCode(holder, {
      text: 'QR LEVEL ' + level,
      width: 256,
      height: 256,
      correctLevel: QRCode.CorrectLevel[level]
    });
    const canvas = holder.querySelector('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' });
    holder.remove();
    return { expected: level, actual: decoded?.errorCorrectionLevel, mask: decoded?.dataMask };
  }));
  assert.deepEqual(decodedCorrectionLevels.map((item) => item.actual), ['L', 'M', 'Q', 'H']);
  decodedCorrectionLevels.forEach((item) => assert.ok(Number.isInteger(item.mask) && item.mask >= 0 && item.mask <= 7));

  await page.click('#theme-toggle');
  const lightTheme = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    pressed: document.querySelector('#theme-toggle')?.getAttribute('aria-pressed'),
    label: document.querySelector('#theme-toggle-label')?.textContent || '',
    panelBackground: getComputedStyle(document.querySelector('.panel')).backgroundImage
  }));
  assert.equal(lightTheme.theme, 'light');
  assert.equal(lightTheme.pressed, 'true');
  assert.equal(lightTheme.label, 'Тёмная тема');
  assert.notEqual(lightTheme.panelBackground, result.panelBackground, 'Светлая тема должна менять оформление панелей.');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений', null, { timeout: 30_000 });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light', 'Выбранная тема должна сохраняться после перезагрузки.');
  await page.click('#theme-toggle');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');

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
  assert.equal(await page.locator('#qr-import-analysis').isVisible(), true, 'После загрузки должен показываться профиль QR.');
  assert.equal(await page.locator('#imported-qr-ecc').textContent(), 'M');
  assert.match(await page.locator('#imported-qr-mask').textContent(), /^[0-7]$/);
  assert.match(await page.locator('#imported-qr-matrix').textContent(), /^\d+×\d+$/);
  assert.match(await page.locator('#imported-qr-module').textContent(), /^≈\d/);
  assert.match(await page.locator('#imported-qr-margin').textContent(), /мод\./);
  assert.match(await page.locator('#imported-qr-modes').textContent(), /байты/);
  assert.equal(await page.locator('#imported-qr-type').textContent(), 'HTML в data URL');
  await page.click('#apply-imported-qr');
  assert.equal(await page.locator('#qr-emulation-note').isVisible(), true);

  await page.click('#build');
  await page.waitForFunction(() => document.querySelector('#qr-correction-label')?.textContent === 'Имитация параметров', null, { timeout: 30_000 });
  assert.match(await page.locator('#qr-correction-note').textContent(), /из загруженного QR/);
  assert.equal(await page.locator('#validation-summary').textContent(), result.validationSummary, 'Повторная генерация не должна менять число проверок.');
  await page.click('#clear-qr-emulation');
  assert.equal(await page.locator('#qr-emulation-note').isVisible(), false);
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

  await page.selectOption('#example-select', 'tournament-bracket');
  await page.click('#load-sample');
  await page.waitForFunction(() => document.querySelector('#roundtrip-title')?.textContent === 'Содержимое восстановлено без изменений', null, { timeout: 30_000 });
  assert.equal(await page.locator('#qr-correction-value').textContent(), 'M', '«Турнирная сетка» должна помещаться в QR с коррекцией M.');
  assert.match(await page.frameLocator('#preview').locator('body').innerText(), /Турнирная сетка/);
  assert.doesNotMatch(await page.locator('#source').inputValue(), /Ответ:/, 'В публичном примере не должно быть отладочной подсказки.');

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
