const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');
const labUrl = pathToFileURL(path.resolve(__dirname, '../../qr-microapps-lab.html')).href;
const prefix = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><script>var $d=3;</script>';

async function openLab(page) {
  await page.goto(labUrl);
  await expect(page.locator('#runtime-log')).toContainText('Приложение запустилось.');
}

async function build(page, html) {
  await page.locator('#source').fill(html);
  await page.locator('#build').click();
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('#runtime-log')).toContainText('Приложение запустилось.');
}

test('предпросмотр блокирует ресурсы и навигацию при ложных head в пользовательском HTML', async ({ page }) => {
  const requests = [];
  await page.route('https://example.invalid/**', async route => {
    requests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'text/html', body: 'intercepted' });
  });
  await openLab(page);
  for (const body of [
    '<title>Example <head></title><img src=https://example.invalid/title>',
    '<script>var marker="<head>";</script><img src=https://example.invalid/script>',
    '<!-- <head> --><img src=https://example.invalid/comment>',
    '<script>location.href="https://example.invalid/navigation";</script>'
  ]) {
    await page.locator('#source').fill(prefix + body);
    await page.locator('#build').click();
    await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
    await expect(page.locator('#runtime-log')).toContainText('Заблокирован');
    await expect(page.locator('.check', { hasText: 'Заблокированные операции' })).toHaveClass(/fail/);
    expect(requests).toEqual([]);
  }
});

test('оптимизированный HTML сохраняет CSS, regex, URL и межтеговый пробел в браузере', async ({ page }) => {
  await openLab(page);
  const html = prefix + '<style>.box :first-child { color: rgb(255, 0, 0); }</style>' +
    '<div class=box><span id=target>Text</span></div> <div>Next</div>' +
    '<img id=picture src=data:,x /><script>var result=/[/ ]/.test(" ");</script>';
  await build(page, html);
  const frame = page.frameLocator('#preview');
  await expect(frame.locator('#target')).toHaveCSS('color', 'rgb(255, 0, 0)');
  expect(await frame.locator('body').evaluate(() => result)).toBe(true);
  await expect(frame.locator('#picture')).toHaveAttribute('src', 'data:,x');
  expect(await frame.locator('.box').evaluate(e => e.nextSibling.textContent)).toBe(' ');
  await page.locator('.qr-controls').evaluate(e => { e.open = true; });
  await page.locator('#optimize-source').uncheck();
  await expect(page.locator('#download-html')).toBeDisabled();
  await page.locator('#build').click();
  await expect(page.locator('#download-html')).toBeEnabled();
  expect(await page.evaluate(() => QRMicroappsCore.parseDataUrl(document.querySelector('#data-url').value).text)).toBe(html);
});

test('правки и загрузка HTML отключают старый экспорт и отменяют незавершённую сборку', async ({ page }) => {
  await openLab(page);
  await page.locator('#source').fill(prefix + '<button>NEW</button>');
  for (const id of ['download-html', 'download-png', 'copy-url', 'download-report', 'add-current-comparison']) {
    await expect(page.locator('#' + id)).toBeDisabled();
  }
  await expect(page.locator('#roundtrip-title')).toContainText('требуется пересборка');
  await page.evaluate(() => {
    const original = QRMicroappsCore.checksum;
    window.releaseChecksum = null;
    let delayed = false;
    QRMicroappsCore.checksum = async value => {
      if (!delayed) {
        delayed = true;
        await new Promise(resolve => { window.releaseChecksum = resolve; });
      }
      QRMicroappsCore.checksum = original;
      return original(value);
    };
  });
  await page.locator('#build').click();
  await expect.poll(() => page.evaluate(() => typeof window.releaseChecksum)).toBe('function');
  await page.locator('#source').fill(prefix + '<button>NEWER</button>');
  await expect(page.locator('#download-html')).toBeDisabled();
  await page.locator('#build').click();
  await expect(page.locator('#download-html')).toBeEnabled();
  expect(await page.evaluate(() => QRMicroappsCore.parseDataUrl(document.querySelector('#data-url').value).text)).toContain('NEWER');
  await expect(page.locator('#runtime-log')).toContainText('Приложение запустилось.');
  const previewBefore = await page.locator('#preview').getAttribute('src');
  await page.evaluate(() => window.releaseChecksum());
  await page.waitForTimeout(100);
  await expect(page.locator('#preview')).toHaveAttribute('src', previewBefore);
  await page.locator('#html-file').setInputFiles({ name: 'imported.html', mimeType: 'text/html', buffer: Buffer.from(prefix + '<button>IMPORTED</button>') });
  await expect(page.locator('#download-png')).toBeDisabled();
  await page.locator('.spec-box').evaluate(e => { e.open = true; });
  await page.locator('#build').click();
  await expect(page.locator('#download-report')).toBeEnabled();
  await page.locator('#spec-title-input').fill('Changed profile');
  await expect(page.locator('#download-report')).toBeDisabled();
});

test('карточки и управление сложностью помещаются на телефоне, планшете и ноутбуке', async ({ page }) => {
  await openLab(page);
  for (const width of [390, 768, 1280, 1366, 1440, 1600, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflow = await page.evaluate(() => ['.output-panel', '.result-grid', '.metrics-column', '.correction-card', '.difficulty-editor'].map(selector => {
      const element = document.querySelector(selector);
      return { selector, overflow: element.scrollWidth - element.clientWidth };
    }).filter(item => item.overflow > 1));
    expect(overflow, 'viewport ' + width).toEqual([]);
    const overlap = await page.locator('.difficulty-editor').evaluate(e => {
      const text = e.querySelector('.difficulty-editor-copy').getBoundingClientRect();
      const label = e.querySelector('label').getBoundingClientRect();
      return text.right > label.left + 1 && text.bottom > label.top + 1;
    });
    expect(overlap, 'difficulty ' + width).toBe(false);
  }
});

test('автоотчёт замечает style, class и CSSOM после запуска', async ({ page }) => {
  await openLab(page);
  await build(page, prefix + '<style>.wide{width:1200px}button{width:120px;height:48px}</style><button>Resize</button>');
  const check = page.locator('.check', { hasText: 'Горизонтальная прокрутка' });
  await expect(check).toHaveClass(/pass/);
  const body = page.frameLocator('#preview').locator('body');
  await body.evaluate(e => { e.style.width = '1200px'; });
  await expect(check).toHaveClass(/fail/);
  await body.evaluate(e => { e.style.width = ''; });
  await expect(check).toHaveClass(/pass/);
  await body.evaluate(e => { e.className = 'wide'; });
  await expect(check).toHaveClass(/fail/);
  await body.evaluate(e => { e.className = ''; });
  await expect(check).toHaveClass(/pass/);
  await body.evaluate(() => document.styleSheets[0].insertRule('body { width: 1300px; }', 0));
  await expect(check).toHaveClass(/fail/);
  await body.evaluate(() => document.styleSheets[0].deleteRule(0));
  await expect(check).toHaveClass(/pass/);
});

test('нулевое белое поле отмечается нарушением даже при успешном декодировании', async ({ page }) => {
  await openLab(page);
  await page.locator('.qr-controls').evaluate(element => { element.open = true; });
  await page.locator('#quiet-zone').fill('0');
  await page.locator('#quiet-zone').dispatchEvent('change');
  await expect(page.locator('#roundtrip-title')).toHaveText('Содержимое восстановлено без изменений');
  await expect(page.locator('.check', { hasText: 'Белое поле QR' })).toHaveClass(/fail/);
  await page.locator('#quiet-zone').fill('4');
  await page.locator('#quiet-zone').dispatchEvent('change');
  await expect(page.locator('.check', { hasText: 'Белое поле QR' })).toHaveClass(/pass/);
});

test('анализ разметки не обращается к сети и отличает данные от исполняемого кода', async ({ page }) => {
  const requests = [];
  await page.route('https://example.invalid/**', route => { requests.push(route.request().url()); return route.abort(); });
  await openLab(page);
  await page.locator('#source').fill('<!doctype html><!--<meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">--><p>fetch()</p>' +
    '<img data-src="data:,x" src="https://example.invalid/image">');
  await page.locator('#build').click();
  await expect(page.locator('.check', { hasText: 'Кодировка UTF-8' })).toHaveClass(/fail/);
  await expect(page.locator('.check', { hasText: 'Мобильный viewport' })).toHaveClass(/fail/);
  await expect(page.locator('.check', { hasText: 'Внешние ресурсы' })).toHaveClass(/fail/);
  await expect(page.locator('.check', { hasText: 'Сеть и навигация' })).toHaveClass(/pass/);
  expect(requests).toEqual([]);
});

test('клавиатурный фокус загрузки файла обозначается на видимой кнопке', async ({ page }) => {
  await openLab(page);
  await page.locator('#html-file').focus();
  await expect(page.locator('label[for=html-file]')).toHaveCSS('outline-style', 'solid');
});
