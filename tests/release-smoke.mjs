import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function requireFile(relativePath) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) errors.push(`Отсутствует файл: ${relativePath}`);
  return fullPath;
}

function read(relativePath) {
  return readFileSync(requireFile(relativePath), 'utf8');
}

[
  'pages/index.html', 'pages/.nojekyll', 'qr-microapps-lab.html', 'editor/source.html', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'spec_game_creation_ru.md',
  '.github/workflows/ci.yml', '.github/workflows/pages.yml',
  'tests/package.json', 'tests/package-lock.json', 'tests/playwright.config.js', 'tests/e2e/lab.spec.js', 'tests/standalone-browser-smoke.mjs',
  'tools/build-standalone.mjs'
].forEach(requireFile);

const firstPartyScripts = readdirSync(join(root, 'editor'))
  .filter((name) => extname(name) === '.js')
  .map((name) => join(root, 'editor', name));
for (const file of firstPartyScripts) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`Ошибка синтаксиса ${file}: ${(result.stderr || result.stdout).trim()}`);
}

['tests/playwright.config.js', 'tests/e2e/lab.spec.js', 'tests/standalone-browser-smoke.mjs', 'tools/build-standalone.mjs'].forEach((relativePath) => {
  const result = spawnSync(process.execPath, ['--check', join(root, relativePath)], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`Ошибка синтаксиса ${relativePath}: ${(result.stderr || result.stdout).trim()}`);
});

['tests/package.json', 'tests/package-lock.json'].forEach((relativePath) => {
  try { JSON.parse(read(relativePath)); }
  catch (error) { errors.push(`Некорректный JSON ${relativePath}: ${error.message}`); }
});

const editorHtml = read('qr-microapps-lab.html');
const assetPattern = /\b(?:src|href)="([^"]+)"/g;
for (const match of editorHtml.matchAll(assetPattern)) {
  const reference = match[1];
  if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) continue;
  const assetPath = join(root, reference.split(/[?#]/)[0]);
  if (!existsSync(assetPath)) errors.push(`HTML ссылается на отсутствующий ресурс: ${reference}`);
}

const indexHtml = read('pages/index.html');
if (!indexHtml.includes('qr-microapps-lab.html')) errors.push('Страница GitHub Pages не ведёт к редактору.');

const standaloneHtml = read('qr-microapps-lab.html');
if (/<script\b[^>]*\bsrc=/i.test(standaloneHtml)) errors.push('Автономный HTML содержит внешний script src.');
if (/<link\b[^>]*\brel="stylesheet"/i.test(standaloneHtml)) errors.push('Автономный HTML содержит внешнюю таблицу стилей.');
if (!standaloneHtml.includes('id="embedded-license-notices"')) errors.push('В автономный HTML не встроены лицензионные уведомления.');
if (!standaloneHtml.includes('QRCode.js 1.0.0') || !standaloneHtml.includes('jsQR 1.4.0')) errors.push('В автономном HTML не обозначены встроенные QR-библиотеки.');
if (!read('editor/app.js').includes("elements.preview.src = 'data:text/html;charset=utf-8,'")) errors.push('Предпросмотр должен использовать data: URL для безопасного запуска из file://.');

const ciWorkflow = read('.github/workflows/ci.yml');
if (!/npm --prefix tests run check/.test(ciWorkflow)) errors.push('CI не запускает полную проверку из tests/.');
if (!/npm --prefix tests run test:e2e/.test(ciWorkflow)) errors.push('CI не запускает браузерные E2E-тесты.');
if (!/playwright install --with-deps chromium/.test(ciWorkflow)) errors.push('CI не устанавливает Chromium для E2E-тестов.');
if (!/permissions:\s*\n\s*contents: read/.test(ciWorkflow)) errors.push('CI должен использовать минимальное разрешение contents: read.');

const pagesWorkflow = read('.github/workflows/pages.yml');
if (!/workflow_dispatch:/.test(pagesWorkflow)) errors.push('Pages должен поддерживать ручной запуск.');
if (/\n\s*push:/.test(pagesWorkflow)) errors.push('Pages не должен публиковаться автоматически до решения по лицензии.');
if (!/npm --prefix tests run check/.test(pagesWorkflow)) errors.push('Pages должен проверять проект до упаковки.');
if (!/cp pages\/index\.html _site\/index\.html/.test(pagesWorkflow)) errors.push('Pages должен брать стартовую страницу из pages/.');

const standaloneBuilder = read('tools/build-standalone.mjs');
if (!standaloneBuilder.includes('relative(root, fullPath)') || !standaloneBuilder.includes('isAbsolute(relativeToRoot)')) {
  errors.push('Сборщик должен безопасно разрешать пути одинаково в Windows и Linux.');
}
if (standaloneBuilder.includes("replaceAll('/', '\\\\')")) {
  errors.push('Сборщик не должен заменять разделители путей на Windows-специфичные.');
}

if (errors.length) {
  errors.forEach((message) => console.error(`ОШИБКА: ${message}`));
  process.exitCode = 1;
} else {
  console.log(`Релизная проверка пройдена: ${firstPartyScripts.length} JS-модулей и статическая структура.`);
}
