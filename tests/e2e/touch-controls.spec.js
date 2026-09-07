const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');
const labUrl = pathToFileURL(path.resolve(__dirname, '../../qr-microapps-lab.html')).href;
const metadata = '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">';

test.use({ hasTouch: true });

async function openLab(page) {
  await page.goto(labUrl);
  await expect(page.locator('#runtime-log')).toContainText('Приложение запустилось.');
}

function touchCheck(page) {
  return page.locator('#validation-list .check').filter({ hasText: 'Сенсорное управление' });
}

for (const [id, title, question, count] of [
  ['tiny-quiz', 'ИТ-мини-тест', '#q', 2],
  ['computer-thinking', 'Как думает компьютер?', '#p', 3],
  ['tournament-bracket', 'Турнирная сетка', '#z', 3]
]) {
  test('созданные скриптом кнопки работают касанием: ' + title, async ({ page }) => {
    await openLab(page);
    await page.locator('#example-select').selectOption(id);
    const preview = page.frameLocator('#preview');
    await expect(preview.locator('#a button')).toHaveCount(count);
    await expect(touchCheck(page)).toHaveClass(/\bpass\b/);
    await expect(touchCheck(page)).toContainText('В предпросмотре');
    const before = await preview.locator(question).innerText();
    await preview.locator('#a button').first().tap();
    await expect(preview.locator(question)).not.toHaveText(before);
    await expect(touchCheck(page)).toHaveClass(/\bpass\b/);
  });
}

test('Карьерный компас проходит все три результата касанием и запускается повторно', async ({ page }) => {
  await openLab(page);
  await page.locator('#example-select').selectOption('career-compass');
  const preview = page.frameLocator('#preview');
  const questions = ['Что интереснее?', 'Как удобнее работать?', 'Что важнее в проекте?'];
  await expect(preview.locator('#q')).toHaveText(questions[0]);
  await expect(page.locator('#validation-list .check:not(.pass)')).toHaveCount(0);
  await expect(page.locator('#code-difficulty')).toBeDisabled();
  await expect(page.locator('#apply-difficulty')).toBeDisabled();
  for (const [answers, result] of [
    [[0, 0, 0], 'Разработка'],
    [[1, 0, 0], 'Управление продуктом'],
    [[0, 1, 1], 'Аналитика']
  ]) {
    for (let index = 0; index < answers.length; index++) {
      await expect(preview.locator('#q')).toHaveText(questions[index]);
      await expect(preview.locator('#s')).toHaveText('Вопрос ' + (index + 1) + ' из 3');
      await preview.locator('#a button').nth(answers[index]).tap();
    }
    await expect(preview.locator('#q b')).toHaveText(result);
    await expect(preview.locator('#s')).toHaveText('Рекомендация');
    await expect(page.locator('#validation-list .check:not(.pass)')).toHaveCount(0);
    await preview.getByRole('button', { name: 'Пройти ещё раз' }).tap();
    await expect(preview.locator('#q')).toHaveText(questions[0]);
  }
  await page.locator('#preview-preset').selectOption('390x844');
  await expect(preview.locator('body')).toHaveJSProperty('clientWidth', 390);
  await expect(page.locator('#validation-list .check:not(.pass)')).toHaveCount(0);
});

test('неиспользованная строка с кнопкой не подтверждает сенсорное управление', async ({ page }) => {
  await openLab(page);
  await page.locator('#source').fill(metadata + '<p>Только текст</p><script>var unused="<button>Ответ</button>";</script>');
  await page.locator('#build').click();
  await expect(page.frameLocator('#preview').locator('p')).toHaveText('Только текст');
  await expect(touchCheck(page)).toHaveClass(/\bwarn\b/);
  await expect(touchCheck(page)).toContainText('в исходнике и предпросмотре');
});

test('динамическая кнопка подтверждает касание только когда доступна', async ({ page }) => {
  await openLab(page);
  await page.locator('#source').fill(metadata + '<div id=a></div><script>a.innerHTML=\'<button disabled>Ответ</button>\';</script>');
  await page.locator('#build').click();
  const button = page.frameLocator('#preview').locator('button');
  await expect(button).toBeDisabled();
  await expect(touchCheck(page)).toHaveClass(/\bwarn\b/);
  await expect(touchCheck(page)).toContainText('в исходнике и предпросмотре');
  await button.evaluate(element => { element.disabled = false; });
  await expect(touchCheck(page)).toHaveClass(/\bpass\b/);
  await button.evaluate(element => { element.style.pointerEvents = 'none'; });
  await expect(touchCheck(page)).toHaveClass(/\bwarn\b/);
  await button.evaluate(element => { element.style.pointerEvents = ''; });
  await expect(touchCheck(page)).toHaveClass(/\bpass\b/);
  await button.evaluate(element => { element.hidden = true; });
  await expect(touchCheck(page)).toHaveClass(/\bwarn\b/);
  await button.evaluate(element => { element.hidden = false; });
  await expect(touchCheck(page)).toHaveClass(/\bpass\b/);
  await button.evaluate(element => { element.setAttribute('aria-disabled', 'true'); });
  await expect(touchCheck(page)).toHaveClass(/\bwarn\b/);
  await button.evaluate(element => { element.removeAttribute('aria-disabled'); });
  await expect(touchCheck(page)).toHaveClass(/\bpass\b/);
});
