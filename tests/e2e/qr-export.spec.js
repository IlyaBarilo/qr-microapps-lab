const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');

const labUrl = pathToFileURL(path.resolve(__dirname, '../../qr-microapps-lab.html')).href;

async function openLab(page) {
  await page.goto(labUrl);
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('#download-svg')).toBeEnabled();
}

async function downloadSvg(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#download-svg').click();
  const file = await pending;
  expect(file.suggestedFilename()).toMatch(/-qr\.svg$/);
  const chunks = [];
  for await (const chunk of await file.createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

test('SVG сохраняет пиксели и нагрузку PNG, а название остаётся безопасным текстом', async ({ page }) => {
  const requests = [];
  page.on('request', request => { if (/^https?:/i.test(request.url())) requests.push(request.url()); });
  await page.route(/^https?:/i, route => route.abort());
  await openLab(page);
  await page.locator('.spec-box').evaluate(element => { element.open = true; });
  const title = 'QR <script>alert("x")</script> & ё';
  await page.locator('#spec-title-input').fill(title);
  await page.locator('#build').click();
  await expect(page.locator('#download-svg')).toBeEnabled();
  const svg = await downloadSvg(page);
  const result = await page.evaluate(async svg => {
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const original = window.document.querySelector('#qr-canvas');
    const canvas = window.document.createElement('canvas');
    canvas.width = original.width;
    canvas.height = original.height;
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      image.src = url;
      await image.decode();
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const pngPixels = original.getContext('2d').getImageData(0, 0, original.width, original.height);
      return { error: !!document.querySelector('parsererror'), title: document.querySelector('title')?.textContent,
        scripts: document.querySelectorAll('script,image,foreignObject').length,
        samePixels: pixels.data.every((value, index) => value === pngPixels.data[index]),
        payload: jsQR(pixels.data, canvas.width, canvas.height)?.data };
    } finally { URL.revokeObjectURL(url); }
  }, svg);
  expect(result).toEqual({ error: false, title, scripts: 0, samePixels: true, payload: await page.locator('#data-url').inputValue() });
  await expect(page.locator('.download-actions button').first()).toHaveText('Скачать PNG');
  expect(requests).toEqual([]);
});

test('печать сохраняет выбранный размер и подписи на одном A4, не меняя исходный QR', async ({ page, browserName }, testInfo) => {
  await openLab(page);
  await page.locator('.qr-controls').evaluate(element => { element.open = true; });
  await page.locator('#quiet-zone').fill('0');
  await page.locator('#build').click();
  await expect(page.locator('#print-qr')).toBeEnabled();
  const dataUrl = await page.locator('#data-url').inputValue();
  const modules = Number((await page.locator('#qr-matrix').textContent()).split('×')[0]);
  const svg = await downloadSvg(page);
  expect(svg).toContain('viewBox="0 0 ' + modules + ' ' + modules + '"');
  await page.locator('#print-qr').click();
  await expect(page.locator('#qr-print-dialog')).toBeVisible();
  await page.locator('#qr-print-title').fill('Киберлабиринт: тест печати');
  await page.locator('#qr-print-instruction').fill('Отсканируйте QR и откройте приложение.\nПроверьте: ё, & и <текст>.');
  await page.locator('#qr-print-size').fill('85.5');
  await expect(page.locator('#qr-print-confirm')).toBeEnabled();
  await expect(page.locator('#qr-print-code svg')).toHaveAttribute('width', '85.5mm');
  await expect(page.locator('#qr-print-code svg')).toHaveAttribute('viewBox', '0 0 ' + (modules + 8) + ' ' + (modules + 8));
  await expect(page.locator('#qr-print-margin-note')).toContainText('увеличено до 4');
  await expect(page.locator('#quiet-zone')).toHaveValue('0');
  await expect(page.locator('#data-url')).toHaveValue(dataUrl);
  await page.evaluate(() => { window.printCalls = 0; window.print = () => window.printCalls++; });
  await page.locator('#qr-print-confirm').click();
  expect(await page.evaluate(() => printCalls)).toBe(1);

  await page.emulateMedia({ media: 'print' });
  const geometry = await page.locator('#qr-print-code svg').evaluate(element => ({
    width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height,
    sheetWidth: document.querySelector('#qr-print-sheet').getBoundingClientRect().width,
    overflow: document.querySelector('#qr-print-sheet').scrollHeight - document.querySelector('#qr-print-sheet').clientHeight
  }));
  expect(geometry.width).toBeCloseTo(85.5 * 96 / 25.4, 1);
  expect(geometry.height).toBeCloseTo(geometry.width, 1);
  expect(geometry.sheetWidth).toBeCloseTo(210 * 96 / 25.4, 1);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('.workspace')).toBeHidden();
  await expect(page.locator('#device-test-overlay')).toBeHidden();
  if (browserName === 'chromium') {
    const pdf = await page.pdf({ path: testInfo.outputPath('qr-85mm.pdf'), preferCSSPageSize: true, printBackground: true });
    expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length).toBe(1);
  }
  await page.emulateMedia({ media: 'screen' });
  await page.locator('#qr-print-size').fill('180');
  await expect(page.locator('#qr-print-confirm')).toBeEnabled();
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ path: testInfo.outputPath('qr-180mm.pdf'), preferCSSPageSize: true, printBackground: true });
    expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length).toBe(1);
    await page.emulateMedia({ media: 'screen' });
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#qr-print-dialog')).not.toBeVisible();
  await expect(page.locator('#print-qr')).toBeFocused();
  await page.locator('#print-qr').click();
  await expect(page.locator('#qr-print-title')).toHaveValue('Киберлабиринт: тест печати');
  await expect(page.locator('#qr-print-size')).toHaveValue('180');
  if (browserName === 'chromium') await page.screenshot({ path: testInfo.outputPath('print-desktop.png') });
});

test('некорректный размер, переполнение листа и устаревшая сборка не допускают печати', async ({ page, browserName }, testInfo) => {
  await openLab(page);
  await page.locator('#print-qr').click();
  await page.locator('#qr-print-size').fill('');
  await expect(page.locator('#qr-print-confirm')).toBeDisabled();
  await expect(page.locator('#qr-print-message')).toContainText('от 20 до 180');
  await page.locator('#qr-print-size').fill('180');
  await page.locator('#qr-print-instruction').fill('строка\n'.repeat(45));
  await expect(page.locator('#qr-print-message')).toContainText('не помещаются');
  await expect(page.locator('#qr-print-confirm')).toBeDisabled();
  await page.locator('#qr-print-instruction').fill('Откройте приложение');
  await expect(page.locator('#qr-print-confirm')).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('#qr-print-dialog').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  if (browserName === 'chromium') await page.screenshot({ path: testInfo.outputPath('print-mobile.png') });
  await page.evaluate(() => { document.querySelector('#source').value = '<!doctype html><p>Новый исходник</p>'; document.querySelector('#source').dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#qr-print-dialog')).not.toBeVisible();
  await expect(page.locator('#print-qr')).toBeDisabled();
  await expect(page.locator('#download-svg')).toBeDisabled();
  await expect(page.locator('#download-png')).toBeDisabled();
});
