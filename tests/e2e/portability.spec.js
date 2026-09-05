const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');

const labUrl = pathToFileURL(path.resolve(__dirname, '../../qr-microapps-lab.html')).href;
const source = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">' +
  '<h1>Проверка ё ✓</h1><button onclick="this.textContent=\'Работает без сети\'">Нажать</button><script>var $d=3;</script>';

async function disableNetwork(context, browserName) {
  // WebKit's offline emulation also rejects file: navigation on Windows.
  // Block HTTP(S) explicitly in every browser and assert zero network attempts.
  await context.route(/^https?:/i, route => route.abort('internetdisconnected'));
  if (browserName !== 'webkit') await context.setOffline(true);
}

test.beforeEach(async ({ context, browserName }) => { await disableNetwork(context, browserName); });

function watchContext(context) {
  const requests = [];
  const errors = [];
  context.on('request', request => { if (/^https?:/i.test(request.url())) requests.push(request.url()); });
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  return { requests, errors };
}

async function openLab(page) {
  await page.goto(labUrl);
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('#runtime-log')).toContainText('Приложение запустилось.');
}

async function download(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const file = await pending;
  const chunks = [];
  for await (const chunk of await file.createReadStream()) chunks.push(chunk);
  return { name: file.suggestedFilename(), buffer: Buffer.concat(chunks) };
}

test('скачанные HTML и PNG сохраняют игру и работают без сети', async ({ context }, testInfo) => {
  const observed = watchContext(context);
  const page = await context.newPage();
  await openLab(page);
  await page.locator('.qr-controls').evaluate(element => { element.open = true; });
  await page.locator('#optimize-source').uncheck();
  await page.locator('#source').fill(source);
  await page.locator('#build').click();
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('Проверка ё ✓');
  const html = await download(page, '#download-html');
  expect(html.name).toMatch(/\.html$/);
  expect(html.buffer.toString('utf8')).toBe(source);
  const htmlPath = testInfo.outputPath('exported-game.html');
  await fs.mkdir(path.dirname(htmlPath), { recursive: true });
  await fs.writeFile(htmlPath, html.buffer);
  const exported = await context.newPage();
  await exported.goto(pathToFileURL(htmlPath).href);
  await expect(exported.locator('h1')).toHaveText('Проверка ё ✓');
  await exported.locator('button').click();
  await expect(exported.locator('button')).toHaveText('Работает без сети');
  await exported.close();

  const png = await download(page, '#download-png');
  expect(png.name).toMatch(/\.png$/);
  expect(png.buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  await page.locator('#source').fill('Другой исходник');
  await page.locator('#qr-image-file').setInputFiles({ name: png.name, mimeType: 'image/png', buffer: png.buffer });
  await expect(page.locator('#source')).toHaveValue(source);
  await expect(page.locator('#status')).toContainText('HTML загружен в редактор');
  await expect(page.locator('#download-html')).toBeDisabled();
  expect(observed).toEqual({ requests: [], errors: [] });
});

test('файл проекта переносит исходник, профиль и настройки в чистый контекст без запуска кода', async ({ context, browser, browserName }) => {
  const observed = watchContext(context);
  const page = await context.newPage();
  await openLab(page);
  await page.locator('.qr-controls').evaluate(element => { element.open = true; });
  await page.locator('#optimize-source').uncheck();
  await page.locator('#source').fill(source);
  await page.locator('#module-scale').fill('5');
  await page.locator('#quiet-zone').fill('6');
  await page.locator('#preview-preset').selectOption('640x360');
  await page.locator('#build').click();
  await expect(page.locator('#download-html')).toBeEnabled();
  const exported = await download(page, '#download-project');
  expect(exported.name).toMatch(/\.qrapp\.json$/);
  const saved = JSON.parse(exported.buffer.toString('utf8'));
  const other = await browser.newContext();
  await disableNetwork(other, browserName);
  const otherObserved = watchContext(other);
  try {
    const imported = await other.newPage();
    await openLab(imported);
    await imported.locator('#project-file').setInputFiles({ name: exported.name, mimeType: 'application/json', buffer: exported.buffer });
    await expect(imported.locator('#status')).toContainText('открыт и QR проверен');
    await expect(imported.locator('#source')).toHaveValue(source);
    expect(JSON.parse(await imported.locator('#spec').inputValue())).toEqual(saved.specification);
    await expect(imported.locator('#optimize-source')).not.toBeChecked();
    await expect(imported.locator('#module-scale')).toHaveValue('5');
    await expect(imported.locator('#quiet-zone')).toHaveValue('6');
    await expect(imported.locator('#preview-preset')).toHaveValue('640x360');
    await expect(imported.locator('#preview')).toHaveAttribute('src', 'about:blank');
    await imported.locator('#run-preview').click();
    await expect(imported.frameLocator('#preview').locator('h1')).toHaveText('Проверка ё ✓');
    await imported.frameLocator('#preview').locator('button').click();
    await expect(imported.frameLocator('#preview').locator('button')).toHaveText('Работает без сети');
    expect(otherObserved).toEqual({ requests: [], errors: [] });
  } finally { await other.close(); }
  expect(observed).toEqual({ requests: [], errors: [] });
});
