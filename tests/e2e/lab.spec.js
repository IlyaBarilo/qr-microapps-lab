const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');

const labUrl = pathToFileURL(path.resolve(__dirname, '..', '..', 'qr-microapps-lab.html')).href;

async function openLab(page) {
  await page.goto(labUrl);
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('#runtime-log')).toContainText('Приложение запустилось.');
}

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('стартовый пример создаёт QR, автоотчёт и трёхколоночный интерфейс', async ({ page }) => {
  const errors = collectPageErrors(page);
  await openLab(page);

  await expect(page).toHaveTitle('QR Microapps Lab');
  await expect(page.locator('#qr-canvas')).toBeVisible();
  await expect(page.locator('#qr-open-help')).toBeVisible();
  await expect(page.locator('#qr-open-help')).toContainText('можно выбрать «Поиск»');
  await expect(page.locator('#qr-open-help')).toContainText('Открыть как сайт');
  await expect(page.locator('#roundtrip-pill')).toHaveText('QR восстановлен точно');
  await expect(page.locator('#qr-reserve')).toHaveText(/^\+\d+ Б$/);
  await expect(page.locator('#qr-reserve-label')).toHaveText('Запас при M');
  await expect(page.locator('#qr-l-reserve')).toHaveText(/^\+\d+ Б$/);
  await expect(page.locator('#qr-correction-value')).toHaveText('M');
  await expect(page.locator('#qr-correction-note')).toContainText('рекомендуемый баланс');
  await expect(page.locator('#qr-l-option')).not.toHaveClass(/recovery/);
  await expect(page.locator('#validation-summary')).toContainText('Нарушено: 0');
  await expect(page.locator('#validation-summary')).toContainText('Предупреждения: 0');
  await expect(page.locator('#iteration-history .iteration-card')).toHaveCount(1);

  const layout = await page.locator('.workspace').evaluate((workspace) => {
    const panels = ['.input-panel', '.output-panel', '.preview-panel'].map((selector) => workspace.querySelector(selector).getBoundingClientRect());
    return {
      lefts: panels.map((box) => Math.round(box.left)),
      widths: panels.map((box) => Math.round(box.width)),
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth
    };
  });
  expect(layout.lefts[0]).toBeLessThan(layout.lefts[1]);
  expect(layout.lefts[1]).toBeLessThan(layout.lefts[2]);
  expect(Math.max(...layout.widths) - Math.min(...layout.widths)).toBeLessThanOrEqual(2);
  expect(layout.pageOverflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('QR увеличивается, а компактные панели раскрываются и скрываются', async ({ page }) => {
  await openLab(page);

  const qr = page.locator('#qr-zoom');
  await qr.click();
  await expect(qr).toHaveAttribute('aria-expanded', 'true');
  await expect(qr).toHaveClass(/expanded/);
  await expect(qr).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const canvas = page.locator('#qr-canvas');
  const initialFit = await canvas.evaluate((element) => {
    const matrix = Number(document.querySelector('#qr-matrix').textContent.split('×')[0]);
    const quiet = Number(document.querySelector('#quiet-zone').value);
    const physicalModulePixels = element.getBoundingClientRect().width * devicePixelRatio / (matrix + quiet * 2);
    const rect = element.getBoundingClientRect();
    return {
      physicalModulePixels,
      declared: Number(element.dataset.modulePixels),
      left: rect.left * devicePixelRatio,
      top: rect.top * devicePixelRatio,
      rightGap: (innerWidth - rect.right) * devicePixelRatio,
      bottomGap: (innerHeight - rect.bottom) * devicePixelRatio
    };
  });
  expect(initialFit.physicalModulePixels).toBeCloseTo(Math.round(initialFit.physicalModulePixels), 5);
  expect(initialFit.declared).toBe(Math.round(initialFit.physicalModulePixels));
  expect(initialFit.left).toBeCloseTo(Math.round(initialFit.left), 5);
  expect(initialFit.top).toBeCloseTo(Math.round(initialFit.top), 5);
  expect(Math.abs(initialFit.left - initialFit.rightGap)).toBeLessThanOrEqual(1);
  expect(Math.abs(initialFit.top - initialFit.bottomGap)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 1920, height: 900 });
  const resizedFit = await canvas.evaluate((element) => {
    const matrix = Number(document.querySelector('#qr-matrix').textContent.split('×')[0]);
    const quiet = Number(document.querySelector('#quiet-zone').value);
    return element.getBoundingClientRect().width * devicePixelRatio / (matrix + quiet * 2);
  });
  expect(resizedFit).toBeCloseTo(Math.round(resizedFit), 5);
  await page.keyboard.press('Escape');
  await expect(qr).toHaveAttribute('aria-expanded', 'false');
  await expect(canvas).not.toHaveAttribute('data-module-pixels');

  const qrControls = page.locator('details.qr-controls');
  await expect(qrControls).not.toHaveAttribute('open', '');
  await qrControls.locator('summary').click();
  await expect(qrControls).toHaveAttribute('open', '');

  const report = page.locator('#validation-details');
  await expect(report).toBeHidden();
  await page.locator('#validation-toggle').click();
  await expect(report).toBeVisible();
  await expect(page.locator('#validation-toggle')).toHaveText('скрыть');
  await page.locator('#validation-toggle').click();
  await expect(report).toBeHidden();
  await expect(page.locator('#validation-toggle')).toHaveText('показать');
});

test('конструктор добавляет вопросы и ответы с фиксированным Base64 и автокоррекцией', async ({ page }) => {
  await openLab(page);
  await page.locator('#mode-simple').click();

  await expect(page.locator('#simple-editor')).toBeVisible();
  await page.locator('#simple-title').fill('E2E-тест');
  await page.locator('#simple-add-question').click();
  await expect(page.locator('#simple-question-count')).toHaveText('4 вопроса');
  await page.locator('.simple-question').first().locator('[data-simple-action="add-answer"]').click();
  await expect(page.locator('.simple-question').first().locator('.simple-answer-row')).toHaveCount(3);
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('#data-url')).toHaveValue(/^data:text\/html;charset=utf-8;base64,/);
  const specification = JSON.parse(await page.locator('#spec').inputValue());
  expect(specification.qr).toEqual({ encoding: 'base64', ecc: 'M' });
  expect(specification).not.toHaveProperty('manualChecks');
  await expect(page.frameLocator('#preview').getByRole('heading', { name: 'E2E-тест' })).toBeVisible();
});

test('прежние ручные настройки игнорируются в пользу Base64 и автокоррекции', async ({ page }) => {
  await openLab(page);
  await page.evaluate(() => {
    document.querySelector('#encoding').value = 'percent';
    document.querySelector('#ecc').value = 'H';
  });
  await page.locator('#build').click();
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('#encoding')).toHaveValue('base64');
  await expect(page.locator('#ecc')).toHaveValue('M');
  await expect(page.locator('#data-url')).toHaveValue(/^data:text\/html;charset=utf-8;base64,/);
});

test('сложность применяется к любому HTML с $d и сохраняется в профиле', async ({ page }) => {
  await openLab(page);
  const difficulty = page.locator('#code-difficulty');
  await expect(page.locator('#difficulty-editor')).toBeVisible();
  await expect(difficulty).toBeEnabled();
  await expect(page.locator('#preview-difficulty')).toHaveText('Сложность: 3 — средняя');
  await page.locator('#source').fill('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><p>Без настройки сложности</p>');
  await expect(page.locator('#preview-difficulty')).toHaveText('Без сложности');
  await expect(difficulty).toBeDisabled();
  await expect(page.locator('#apply-difficulty')).toBeDisabled();
  await page.locator('#source').fill('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><script>var $d=3;window.level=$d</script>');
  await expect(page.locator('#difficulty-editor')).toBeVisible();
  await expect(difficulty).toBeEnabled();
  await expect(page.locator('#preview-difficulty')).toHaveText('Сложность: 3 — средняя');
  await expect(page.locator('#apply-difficulty')).toBeEnabled();
  await expect(difficulty.locator('option')).toHaveCount(5);
  await expect(difficulty).toHaveValue('3');

  const sourceBefore = await page.locator('#source').inputValue();
  await difficulty.selectOption('5');
  await expect(page.locator('#source')).toHaveValue(sourceBefore);
  await page.locator('#apply-difficulty').click();
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('#qr-correction-value')).toHaveText('M');
  await expect(page.locator('#source')).toHaveValue(/var \$d=5/);
  await expect(page.locator('#preview-difficulty')).toHaveText('Сложность: 5 — очень сложная');
  expect(JSON.parse(await page.locator('#spec').inputValue()).difficulty).toBe(5);
  expect(await page.frameLocator('#preview').locator('html').evaluate(() => window.level)).toBe(5);
});

test('при переполнении M автоматически выбирается L и показывается цель сокращения', async ({ page }) => {
  await openLab(page);
  const fitsOnlyL = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><p>' + 'я'.repeat(900) + '</p>';
  await page.locator('#source').fill(fitsOnlyL);
  await page.locator('#build').click();
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('#ecc')).toHaveValue('L');
  await expect(page.locator('#qr-reserve')).toHaveText(/^\+\d+ Б$/);
  await expect(page.locator('#qr-l-option-label')).toHaveText('Сократить для M');
  await expect(page.locator('#qr-l-reserve')).toHaveText(/^\d+ Б$/);
  await expect(page.locator('#qr-l-option')).toBeVisible();
  await expect(page.locator('#qr-reserve-label')).toHaveText('Запас при L');
  await expect(page.locator('#qr-correction-value')).toHaveText('L');
  await expect(page.locator('#qr-correction-note')).toContainText('Устойчивость к повреждениям снижена');
  await expect(page.locator('#validation-list')).toContainText('Коррекция L');
});

test('альбомный предпросмотр не получает внутреннюю прокрутку', async ({ page }) => {
  await openLab(page);
  await expect(page.locator('#load-sample')).toHaveCount(0);
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await page.locator('#preview-preset').selectOption('640x360');

  const device = await page.locator('#device').evaluate((element) => ({
    width: element.clientWidth,
    height: element.clientHeight,
    overflowX: getComputedStyle(element).overflowX,
    overflowY: getComputedStyle(element).overflowY
  }));
  expect(device.width).toBeLessThanOrEqual(640);
  expect(device.height).toBe(360);
  expect(device.overflowX).toBe('hidden');
  expect(device.overflowY).toBe('hidden');
  const frameOverflow = await page.frameLocator('#preview').locator('html').evaluate((html) => ({
    horizontal: html.scrollWidth - html.clientWidth,
    vertical: html.scrollHeight - html.clientHeight
  }));
  expect(frameOverflow.horizontal).toBeLessThanOrEqual(0);
  expect(frameOverflow.vertical).toBeLessThanOrEqual(0);
});

test('ошибка пользовательского JavaScript попадает в автоотчёт', async ({ page }) => {
  await openLab(page);
  const html = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><script>setTimeout(()=>{throw Error("boom")},20)</script>';
  await page.locator('#source').fill(html);
  await page.locator('#build').click();
  await expect(page.locator('#runtime-log')).toContainText(/Ошибка JavaScript:.*boom/);
  await page.locator('#validation-toggle').click();
  const check = page.locator('.check', { hasText: 'Ошибки выполнения' });
  await expect(check).toHaveClass(/fail/);
  await expect(check).toContainText('нарушение');
});

test('экспортируемый отчёт содержит только автоматические статусы', async ({ page }) => {
  await openLab(page);
  await page.locator('#validation-toggle').click();
  await expect(page.locator('#download-report')).toBeEnabled();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-report').click();
  const download = await downloadPromise;
  const filename = await download.path();
  const report = JSON.parse(await fs.readFile(filename, 'utf8'));

  expect(report.specification).not.toHaveProperty('manualChecks');
  expect(report.validation.summary).toEqual(expect.objectContaining({ fail: 0, warn: 0, pending: 0 }));
  expect(report.validation.summary).not.toHaveProperty('manual');
  expect(report.validation.checks.every((check) => ['pass', 'fail', 'warn'].includes(check.status))).toBe(true);
});
