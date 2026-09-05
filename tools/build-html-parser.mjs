import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'tests/package.json'));
const { build } = require('esbuild');
const result = await build({
  stdin: { contents: "export { parse, Parser } from 'parse5';", resolveDir: join(root, 'tests'), sourcefile: 'parse5-browser.js' },
  bundle: true, write: false, format: 'iife', globalName: 'QRMicroappsHtmlParser', platform: 'browser', target: 'es2020', minify: true,
  banner: { js: '/*! parse5 8.0.1 (MIT), including entities 8.0.0 (BSD-2-Clause). Licenses are distributed alongside this file. */' },
  footer: { js: 'if (typeof module === "object" && module.exports) module.exports = QRMicroappsHtmlParser;' }
});
function crlf(text) { return text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'); }
writeFileSync(join(root, 'editor/vendor/parse5.js'), crlf(result.outputFiles[0].text));
for (const name of ['parse5', 'entities']) {
  writeFileSync(join(root, 'editor/vendor', name + '.LICENSE'), crlf(readFileSync(join(root, 'tests/node_modules', name, 'LICENSE'), 'utf8')));
}
console.log('Локальный HTML-парсер и лицензии собраны.');
