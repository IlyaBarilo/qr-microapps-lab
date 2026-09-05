const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');
const labUrl = pathToFileURL(path.resolve(__dirname, '../../qr-microapps-lab.html')).href;
const html = '  <!doctype html>\n<meta charset=utf-8><p>Мой незавершённый текст</p>\n<script>window.draftExecuted=true;</script>  ';

async function openLab(page) {
  await page.goto(labUrl);
  await expect(page.locator('#runtime-log')).toContainText('Приложение запустилось.');
}

async function openDrafts(page) {
  await page.locator('#draft-panel').evaluate(element => { element.open = true; });
}

async function restoreVersion(page, label) {
  await openDrafts(page);
  const value = await page.locator('#draft-select option').filter({ hasText: label }).first().getAttribute('value');
  await page.locator('#draft-select').selectOption(value);
  await page.locator('#restore-draft').click();
}

test('перезагрузка восстанавливает исходный HTML и незавершённый JSON без выполнения кода', async ({ page }) => {
  await openLab(page);
  await page.locator('#source').fill(html);
  await page.locator('.spec-box').evaluate(element => { element.open = true; });
  await page.locator('#spec-mode-json').click();
  await page.locator('#spec').fill('{"title": "Ещё не готово",');
  // Reload before the debounce expires: beforeunload must flush the raw fields.
  await page.reload();
  await expect(page.locator('#source')).toHaveValue(html);
  await expect(page.locator('#spec')).toHaveValue('{"title": "Ещё не готово",');
  await expect(page.locator('#spec-mode-json')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#preview')).toHaveAttribute('src', 'about:blank');
  await expect(page.locator('#download-html')).toBeDisabled();
  await expect(page.locator('#status')).toContainText('Черновик восстановлен');
});

test('после выбора примера, конструктора и очистки можно вернуть прежнюю работу', async ({ page }) => {
  await openLab(page);
  await page.locator('#source').fill(html);
  await page.locator('#example-select').selectOption('brick-breaker');
  await restoreVersion(page, 'Перед выбором примера');
  await expect(page.locator('#source')).toHaveValue(html);
  await page.locator('#mode-simple').click();
  await page.locator('#mode-code').click();
  await restoreVersion(page, 'Перед открытием конструктора');
  await expect(page.locator('#source')).toHaveValue(html);
  await page.locator('#clear').click();
  await restoreVersion(page, 'Перед очисткой');
  await expect(page.locator('#source')).toHaveValue(html);
});

test('пустые поля вопросов остаются редактируемыми после восстановления конструктора', async ({ page }) => {
  await openLab(page);
  await page.locator('#mode-simple').click();
  await page.locator('#simple-title').fill('');
  await page.locator('[data-simple-prompt]').first().fill('');
  await page.locator('[data-simple-answer]').first().fill('');
  await page.locator('[data-simple-correct]').nth(1).check();
  await page.reload();
  await expect(page.locator('#mode-simple')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#simple-title')).toHaveValue('');
  await expect(page.locator('[data-simple-prompt]').first()).toHaveValue('');
  await expect(page.locator('[data-simple-answer]').first()).toHaveValue('');
  await expect(page.locator('[data-simple-correct]').nth(1)).toBeChecked();
  await expect(page.locator('#preview')).toHaveAttribute('src', 'about:blank');
});

test('скачанный черновик открывается с незавершённым профилем в другом браузерном контексте', async ({ page, browser }) => {
  await openLab(page);
  await page.locator('#source').fill(html);
  await page.locator('.spec-box').evaluate(element => { element.open = true; });
  await page.locator('#spec-mode-json').click();
  await page.locator('#spec').fill('{');
  await openDrafts(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-draft').click();
  const stream = await (await downloadPromise).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const other = await browser.newContext();
  try {
    const imported = await other.newPage();
    await openLab(imported);
    await imported.locator('#project-file').setInputFiles({ name: 'draft.qrdraft.json', mimeType: 'application/json', buffer: Buffer.concat(chunks) });
    await expect(imported.locator('#source')).toHaveValue(html);
    await expect(imported.locator('#spec')).toHaveValue('{');
    await expect(imported.locator('#preview')).toHaveAttribute('src', 'about:blank');
  } finally { await other.close(); }
});

test('при запрете хранилища показывается предупреждение и сохраняется отмена замены в текущей вкладке', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Storage denied', 'SecurityError'); }; });
  await openLab(page);
  await page.locator('#source').fill(html);
  await expect(page.locator('#draft-status')).toContainText('Автосохранение недоступно');
  await page.locator('#example-select').selectOption('brick-breaker');
  await restoreVersion(page, 'Перед выбором примера');
  await expect(page.locator('#source')).toHaveValue(html);
  expect(await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  })).toBe(true);
});

test('две вкладки с копией состояния сеанса не перезаписывают черновики друг друга', async ({ page, context }) => {
  await openLab(page);
  await page.locator('#source').fill(html);
  await expect(page.locator('#draft-status')).toContainText('Черновик сохранён');
  const copiedSession = await page.evaluate(() => sessionStorage.getItem('qr-microapps-draft-tab'));
  const other = await context.newPage();
  await other.addInitScript(owner => sessionStorage.setItem('qr-microapps-draft-tab', owner), copiedSession);
  await other.goto(labUrl);
  await expect(other.locator('#source')).toHaveValue(html);
  await page.locator('#source').fill('первый черновик');
  await other.locator('#source').fill('второй черновик');
  await expect(page.locator('#draft-status')).toContainText('Черновик сохранён');
  await expect(other.locator('#draft-status')).toContainText('Черновик сохранён');
  const saved = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('qr-microapps-drafts-v1:'))
    .map(key => JSON.parse(localStorage.getItem(key)).snapshot.fields.source));
  expect(saved).toContain('первый черновик');
  expect(saved).toContain('второй черновик');
});
