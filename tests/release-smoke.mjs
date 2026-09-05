import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { formatPackageVersion, injectAppVersion } from '../tools/set-standalone-version.mjs';

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
  'docs/images/qr-microapps-lab.webp',
  '.github/workflows/ci.yml', '.github/workflows/pages.yml',
  'tests/package.json', 'tests/package-lock.json', 'tests/playwright.config.js', 'tests/e2e/lab.spec.js', 'tests/standalone-browser-smoke.mjs',
  'tools/build-standalone.mjs', 'tools/set-standalone-version.mjs', 'tools/build-html-parser.mjs',
  'editor/vendor/parse5.js', 'editor/vendor/parse5.LICENSE', 'editor/vendor/entities.LICENSE'
].forEach(requireFile);

const firstPartyScripts = readdirSync(join(root, 'editor'))
  .filter((name) => extname(name) === '.js')
  .map((name) => join(root, 'editor', name));
for (const file of firstPartyScripts) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`Ошибка синтаксиса ${file}: ${(result.stderr || result.stdout).trim()}`);
}

['tests/playwright.config.js', 'tests/e2e/lab.spec.js', 'tests/standalone-browser-smoke.mjs', 'tools/build-standalone.mjs', 'tools/set-standalone-version.mjs', 'tools/build-html-parser.mjs'].forEach((relativePath) => {
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

const readme = read('README.md');
if (!readme.includes('docs/images/qr-microapps-lab.webp')) errors.push('README не содержит публичный скриншот интерфейса.');
if (!readme.includes('releases/latest/download/qr-microapps-lab.html')) errors.push('README не содержит прямую ссылку на автономный HTML последнего релиза.');

const standaloneHtml = read('qr-microapps-lab.html');
if (/<script\b[^>]*\bsrc=/i.test(standaloneHtml)) errors.push('Автономный HTML содержит внешний script src.');
if (/<link\b[^>]*\brel="stylesheet"/i.test(standaloneHtml)) errors.push('Автономный HTML содержит внешнюю таблицу стилей.');
if (!standaloneHtml.includes('id="embedded-license-notices"')) errors.push('В автономный HTML не встроены лицензионные уведомления.');
if (!standaloneHtml.includes('QRCode.js 1.0.0') || !standaloneHtml.includes('jsQR 1.4.0')) errors.push('В автономном HTML не обозначены встроенные QR-библиотеки.');
if (!standaloneHtml.includes('id="embedded-game-spec"') || !standaloneHtml.includes('data-purpose="game-creation-specification"')) errors.push('В автономный HTML не встроена Markdown-спецификация создания игр.');
if (!standaloneHtml.includes('id="download-game-spec"') || !standaloneHtml.includes('id="copy-game-spec"')) errors.push('В интерфейсе отсутствуют действия со спецификацией создания игр.');
if (!standaloneHtml.includes('id="device-test-overlay"') || !standaloneHtml.includes('QR Microapps Lab · тест устройства')) errors.push('В автономный HTML не встроен тест QR на экране и бумаге.');
if ((standaloneHtml.match(/__APP_VERSION__/g) || []).length !== 1) errors.push('Автономный HTML должен содержать ровно одну релизную метку версии.');
if (standaloneHtml.includes('__LOCAL_VERSION__')) errors.push('В автономном HTML осталась несобранная локальная метка версии.');
if ((standaloneHtml.match(/data-app-version>/g) || []).length !== 2) errors.push('Для версии программы должны быть подготовлены места в заголовке и подвале.');
if ((standaloneHtml.match(/data-app-version-wrap hidden/g) || []).length !== 2) errors.push('В рабочей сборке номер версии должен быть скрыт.');
try {
  if (formatPackageVersion('0.1.0') !== 'v0.1' || formatPackageVersion('0.1.2') !== 'v0.1.2') errors.push('Форматирование номера релиза работает неверно.');
  const injected = injectAppVersion(standaloneHtml, 'v9.8.7');
  if (!injected.includes("var version = 'v9.8.7'")) errors.push('Инструмент не подставляет номер версии в автономный HTML.');
  if (injected.includes('__APP_VERSION__')) errors.push('После подстановки в HTML осталась релизная метка версии.');
} catch (error) {
  errors.push(`Ошибка проверки механизма версии: ${error.message}`);
}
if (!read('editor/app.js').includes("elements.preview.src = 'data:text/html;charset=utf-8,'")) errors.push('Предпросмотр должен использовать data: URL для безопасного запуска из file://.');

const ciWorkflow = read('.github/workflows/ci.yml');
if (!/npm --prefix tests run check/.test(ciWorkflow)) errors.push('CI не запускает полную проверку из tests/.');
if (!/npm --prefix tests run test:e2e/.test(ciWorkflow)) errors.push('CI не запускает браузерные E2E-тесты.');
if (!/playwright install --with-deps chromium/.test(ciWorkflow)) errors.push('CI не устанавливает Chromium для E2E-тестов.');
if (!/permissions:\s*\n\s*contents: read/.test(ciWorkflow)) errors.push('CI должен использовать минимальное разрешение contents: read.');

if (!/npm --prefix tests run test:standalone-browser/.test(ciWorkflow)) errors.push('CI должен запускать проверку автономного HTML в браузере.');
const pagesWorkflow = read('.github/workflows/pages.yml');
if (!/npm --prefix tests run check:all/.test(pagesWorkflow)) errors.push('Перед публикацией нужны модульные и браузерные проверки.');
if (!/name:\s*Publish release/.test(pagesWorkflow)) errors.push('Единый workflow публикации должен иметь понятное имя.');
if (!/workflow_dispatch:/.test(pagesWorkflow)) errors.push('Публикация должна поддерживать ручной запуск.');
if (!/release:\s*\n\s*types:\s*\[published\]/.test(pagesWorkflow)) errors.push('Публикация должна автоматически запускаться при публикации релиза.');
if (/push:\s*\n\s*branches:\s*\[main\]/.test(pagesWorkflow)) errors.push('Pages не должен публиковать непроверенную версию из последнего push в main.');
if (!/Existing release tag/.test(pagesWorkflow)) errors.push('Ручной запуск должен принимать существующий тег релиза.');
if (!/ref:.*github\.event\.release\.tag_name.*inputs\.tag/.test(pagesWorkflow)) errors.push('Workflow должен извлекать файлы выбранного тега релиза.');
if ((pagesWorkflow.match(/npm --prefix tests run check/g) || []).length !== 1) errors.push('Проект должен проверяться ровно один раз за публикацию.');
if (!/contents:\s*write/.test(pagesWorkflow)) errors.push('Workflow должен иметь разрешение на добавление файла в релиз.');
if (!/gh release upload .*qr-microapps-lab\.html --clobber/.test(pagesWorkflow)) errors.push('Workflow должен прикладывать автономный HTML к релизу.');
if (!/cp pages\/index\.html _site\/index\.html/.test(pagesWorkflow)) errors.push('Pages должен брать стартовую страницу из pages/.');
if (!/configure-pages@v6/.test(pagesWorkflow) || !/upload-pages-artifact@v5/.test(pagesWorkflow) || !/deploy-pages@v5/.test(pagesWorkflow)) errors.push('Workflow должен использовать актуальные Pages actions на Node.js 24.');
if (!/grep -q "__APP_VERSION__"/.test(pagesWorkflow) || !/set-standalone-version\.mjs --version/.test(pagesWorkflow)) errors.push('Workflow должен подставлять выбранный тег с поддержкой старых релизов без метки версии.');
if (existsSync(join(root, '.github/workflows/release.yml'))) errors.push('Отдельный дублирующий workflow релиза должен быть удалён.');

const standaloneBuilder = read('tools/build-standalone.mjs');
if (!standaloneBuilder.includes('relative(root, fullPath)') || !standaloneBuilder.includes('isAbsolute(relativeToRoot)')) {
  errors.push('Сборщик должен безопасно разрешать пути одинаково в Windows и Linux.');
}
if (standaloneBuilder.includes("replaceAll('/', '\\\\')")) {
  errors.push('Сборщик не должен заменять разделители путей на Windows-специфичные.');
}
if (!standaloneBuilder.includes("read('spec_game_creation_ru.md')")) errors.push('Сборщик должен брать встроенную спецификацию из публичного Markdown-файла.');

if (errors.length) {
  errors.forEach((message) => console.error(`ОШИБКА: ${message}`));
  process.exitCode = 1;
} else {
  console.log(`Релизная проверка пройдена: ${firstPartyScripts.length} JS-модулей и статическая структура.`);
}
