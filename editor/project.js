(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QRMicroappsProject = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var FORMAT = 'qr-microapps-project';
  var VERSION = '0.1';
  var MAX_TEXT_LENGTH = 1000000;
  var ENCODINGS = ['base64', 'percent'];
  var ECC_LEVELS = ['L', 'M', 'Q', 'H'];

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max, fallback) {
    value = Number(value);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
  }

  function option(value, allowed, fallback) {
    value = String(value || '');
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function validateShape(project) {
    if (!isObject(project)) throw new Error('Файл проекта должен содержать JSON-объект.');
    if (project.format !== FORMAT) throw new Error('Это не файл проекта QR Microapps Lab.');
    if (project.version !== VERSION) throw new Error('Версия файла проекта не поддерживается: ' + String(project.version || 'не указана') + '.');
    if (typeof project.html !== 'string' || !project.html.trim()) throw new Error('В файле проекта отсутствует HTML.');
    if (!isObject(project.specification)) throw new Error('В файле проекта отсутствует профиль проверки.');
    if (project.settings != null && !isObject(project.settings)) throw new Error('Настройки проекта имеют неверный формат.');
    if (project.editor != null && !isObject(project.editor)) throw new Error('Данные редактора имеют неверный формат.');
    if (project.preview != null && !isObject(project.preview)) throw new Error('Настройки предпросмотра имеют неверный формат.');
  }

  function create(input) {
    input = input || {};
    if (typeof input.html !== 'string' || !input.html.trim()) throw new Error('Нельзя сохранить проект без HTML.');
    if (!isObject(input.specification)) throw new Error('Нельзя сохранить проект без профиля проверки.');
    var specQr = isObject(input.specification.qr) ? input.specification.qr : {};
    var settings = isObject(input.settings) ? input.settings : {};
    var editor = isObject(input.editor) ? input.editor : {};
    var preview = isObject(input.preview) ? input.preview : {};
    var simpleMode = editor.mode === 'simple' && isObject(editor.simpleConfig);
    return {
      format: FORMAT,
      version: VERSION,
      savedAt: String(input.savedAt || new Date().toISOString()),
      html: input.html,
      specification: clone(input.specification),
      settings: {
        encoding: option(settings.encoding, ENCODINGS, option(specQr.encoding, ENCODINGS, 'base64')),
        ecc: option(settings.ecc, ECC_LEVELS, option(specQr.ecc, ECC_LEVELS, 'M')),
        moduleScale: clamp(settings.moduleScale, 1, 20, 6),
        quietZone: clamp(settings.quietZone, 0, 16, 4),
        optimize: settings.optimize !== false
      },
      editor: {
        mode: simpleMode ? 'simple' : 'code',
        simpleConfig: simpleMode ? clone(editor.simpleConfig) : null
      },
      preview: {
        preset: String(preview.preset || '360x640'),
        width: clamp(preview.width, 180, 1200, 360),
        height: clamp(preview.height, 240, 1600, 640)
      }
    };
  }

  function serialize(input) {
    return JSON.stringify(create(input), null, 2) + '\n';
  }

  function parse(text) {
    if (typeof text !== 'string') throw new Error('Файл проекта должен быть текстовым JSON.');
    if (text.length > MAX_TEXT_LENGTH) throw new Error('Файл проекта слишком велик.');
    var parsed;
    try { parsed = JSON.parse(text); }
    catch (error) { throw new Error('Ошибка JSON-файла проекта: ' + error.message); }
    validateShape(parsed);
    return create(parsed);
  }

  return {
    FORMAT: FORMAT,
    VERSION: VERSION,
    MAX_TEXT_LENGTH: MAX_TEXT_LENGTH,
    create: create,
    serialize: serialize,
    parse: parse
  };
});
