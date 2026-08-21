import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const placeholder = '__APP_VERSION__';

export function formatPackageVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/.exec(String(value || '').trim());
  if (!match) throw new Error('Некорректная версия пакета. Ожидается формат 0.1.0 или 0.1.2-beta.1.');
  const patch = match[3] === '0' ? '' : `.${match[3]}`;
  return `v${match[1]}.${match[2]}${patch}${match[4] || ''}`;
}

export function injectAppVersion(html, value) {
  const version = String(value || '').trim();
  if (!/^v\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Недопустимый номер версии: ${version || 'пустое значение'}.`);
  }
  const count = String(html).split(placeholder).length - 1;
  if (count !== 1) throw new Error(`Ожидалась одна метка ${placeholder}, найдено: ${count}.`);
  return String(html).replace(placeholder, version);
}

function packageDisplayVersion() {
  const packageData = JSON.parse(readFileSync(resolve(root, 'tests', 'package.json'), 'utf8'));
  return formatPackageVersion(packageData.version);
}

function targetPath(args) {
  const fileIndex = args.indexOf('--file');
  const requested = fileIndex >= 0 ? args[fileIndex + 1] : 'qr-microapps-lab.html';
  if (!requested) throw new Error('После --file необходимо указать путь.');
  const target = resolve(root, requested);
  const relativeTarget = relative(root, target);
  if (relativeTarget === '..' || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget)) {
    throw new Error(`Файл версии должен находиться внутри проекта: ${requested}`);
  }
  return target;
}

function main(args) {
  if (args.includes('--print-local')) {
    process.stdout.write(packageDisplayVersion());
    return;
  }
  const versionIndex = args.indexOf('--version');
  if (versionIndex < 0 || !args[versionIndex + 1]) {
    throw new Error('Использование: node tools/set-standalone-version.mjs --version v0.1 [--file qr-microapps-lab.html]');
  }
  const file = targetPath(args);
  const output = injectAppVersion(readFileSync(file, 'utf8'), args[versionIndex + 1]);
  writeFileSync(file, output, 'utf8');
  console.log(`В ${relative(root, file)} подставлена версия ${args[versionIndex + 1]}.`);
}

const executedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (executedFile === resolve(fileURLToPath(import.meta.url))) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
