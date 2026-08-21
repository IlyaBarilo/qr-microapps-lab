import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'editor', 'source.html');
const outputPaths = [join(root, 'qr-microapps-lab.html')];
const checkOnly = process.argv.includes('--check');

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/^\uFEFF/, '');
}

function escapeInlineScript(source) {
  return source.replace(/<\/script/gi, '<\\/script');
}

function licenseBlock() {
  const entries = [
    ['QR MICROAPPS LAB — MIT LICENSE', read('LICENSE')],
    ['QRCODE.JS 1.0.0 — MIT LICENSE', read('editor/vendor/qrcodejs.LICENSE')],
    ['JSQR 1.4.0 — APACHE LICENSE 2.0', read('editor/vendor/jsQR.LICENSE')]
  ];
  const text = entries.map(([title, license]) => `${title}\n${'='.repeat(title.length)}\n${license.trim()}`).join('\n\n');
  return `  <script type="text/plain" id="embedded-license-notices" data-purpose="license-notices">\n${text}\n  <\/script>\n`;
}

function build() {
  let html = readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '');
  const stylesheetPattern = /  <link rel="stylesheet" href="editor\/styles\.css">/;
  if (!stylesheetPattern.test(html)) throw new Error('Не найдена ожидаемая ссылка на editor/styles.css.');
  html = html.replace(stylesheetPattern, `  <style data-source="editor/styles.css">\n${read('editor/styles.css').trim()}\n  </style>`);

  const scriptPattern = /  <script src="([^"]+)"><\/script>/g;
  let scriptsInlined = 0;
  html = html.replace(scriptPattern, (tag, relativePath) => {
    const fullPath = resolve(root, ...relativePath.split('/'));
    const relativeToRoot = relative(root, fullPath);
    if (relativeToRoot === '..' || relativeToRoot.startsWith(`..${sep}`) || isAbsolute(relativeToRoot)) {
      throw new Error(`Недопустимый путь скрипта: ${relativePath}`);
    }
    if (!existsSync(fullPath)) throw new Error(`Не найден скрипт: ${relativePath}`);
    scriptsInlined += 1;
    let banner = `/* Встроенный исходный файл: ${relativePath}. */`;
    if (relativePath === 'editor/vendor/qrcode.min.js') banner = '/*! QRCode.js 1.0.0 | Copyright (c) 2012 davidshimjs | MIT License */';
    if (relativePath === 'editor/vendor/jsQR.js') banner = '/*! jsQR 1.4.0 | Apache License 2.0 | Полный текст лицензии встроен в этот HTML. */';
    return `  <script data-source="${relativePath}">\n${banner}\n${escapeInlineScript(readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '').trim())}\n  <\/script>`;
  });
  if (scriptsInlined !== 10) throw new Error(`Ожидалось 10 локальных скриптов, встроено: ${scriptsInlined}.`);

  html = html.replace('</head>', `${licenseBlock()}</head>`);
  if (/<script\b[^>]*\bsrc=/i.test(html) || /<link\b[^>]*\brel="stylesheet"/i.test(html)) {
    throw new Error('В итоговом HTML остались внешние ссылки на стили или скрипты.');
  }
  if (!html.includes('id="embedded-license-notices"')) throw new Error('В итоговый HTML не встроены лицензионные уведомления.');
  return html.replace(/\r\n/g, '\n').replace(/\s*$/, '\n');
}

const output = build();
if (checkOnly) {
  for (const outputPath of outputPaths) {
    if (!existsSync(outputPath)) throw new Error(`Автономный HTML ещё не собран: ${outputPath}. Выполните npm --prefix tests run build:standalone.`);
    const current = readFileSync(outputPath, 'utf8').replace(/\r\n/g, '\n');
    if (current !== output) throw new Error(`Автономный HTML устарел: ${outputPath}. Выполните npm --prefix tests run build:standalone.`);
  }
  console.log(`Автономный HTML актуален: ${output.length.toLocaleString('ru-RU')} символов.`);
} else {
  for (const outputPath of outputPaths) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, output, 'utf8');
    console.log(`Собран ${outputPath}: ${output.length.toLocaleString('ru-RU')} символов.`);
  }
}
