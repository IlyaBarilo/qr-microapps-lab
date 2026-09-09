const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');
const labUrl = pathToFileURL(path.resolve(__dirname, '../../qr-microapps-lab.html')).href;

test('интервалы турнирной сетки проверяются без погрешности дробных координат', async ({ page }) => {
  await page.goto(labUrl);
  await expect(page.locator('#runtime-log')).toContainText('Приложение запустилось.');
  await page.locator('#example-select').selectOption('tournament-bracket');
  const preview = page.frameLocator('#preview');
  const buttons = preview.locator('#a button');
  const spacing = page.locator('#validation-list .check').filter({ hasText: 'Интервалы между элементами' });
  await expect(buttons).toHaveCount(3);
  await expect(spacing).toHaveClass(/\bpass\b/);

  // Сначала создаём реальное нарушение и проверяем дробное значение в отчёте.
  await buttons.evaluateAll(elements => {
    // Половина пикселя представима во всех движках; 3.9px квантуется по-разному.
    for (const element of elements) element.style.marginBottom = '3.5px';
  });
  await expect(spacing).toHaveClass(/\bfail\b/);
  await expect(spacing).toContainText('Минимальный интервал: 7,5 px.');

  // Возвращаем 8 px и сдвигаем кнопки к координатам, вызывавшим ложное нарушение.
  const roundedGap = await buttons.evaluateAll(elements => {
    for (const element of elements) element.style.marginBottom = '';
    const body = document.body;
    body.style.translate = 'none';
    body.style.translate = '0 ' + (206.4 - elements[0].getBoundingClientRect().top) + 'px';
    const first = elements[0].getBoundingClientRect();
    const second = elements[1].getBoundingClientRect();
    return Math.round(second.top * 10) / 10 - Math.round(first.bottom * 10) / 10;
  });
  expect(roundedGap).toBeLessThan(8);
  expect(roundedGap).toBeCloseTo(8, 10);
  await expect(spacing).toHaveClass(/\bpass\b/);
  await expect(spacing).toContainText('Минимальный интервал: 8 px.');
});
