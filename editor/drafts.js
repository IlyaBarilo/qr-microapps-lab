(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QRMicroappsDrafts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var FORMAT = 'qr-microapps-draft';
  var PREFIX = 'qr-microapps-drafts-v1:';
  var MAX_TEXT_LENGTH = 2000000;
  var HISTORY_LIMIT = 20;

  function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function validate(value) {
    if (!object(value) || value.format !== FORMAT || value.version !== '0.1') throw new Error('Формат или версия черновика не поддерживается.');
    if (!object(value.fields) || typeof value.fields.source !== 'string' || typeof value.fields.spec !== 'string') throw new Error('В черновике отсутствуют исходник и профиль.');
    if (Object.keys(value.fields).some(function (key) { return typeof value.fields[key] !== 'string' && typeof value.fields[key] !== 'boolean'; })) throw new Error('Поля черновика имеют неверный формат.');
    if (['code', 'simple'].indexOf(value.mode) < 0 || ['form', 'json'].indexOf(value.specEditorMode) < 0) throw new Error('Режим редактора в черновике не поддерживается.');
    if (!Array.isArray(value.questions) || !value.questions.length || value.questions.some(function (question) {
      return !object(question) || typeof question.prompt !== 'string' || !Array.isArray(question.answers) || question.answers.length < 2 ||
        question.answers.some(function (answer) { return typeof answer !== 'string'; }) || !Number.isInteger(question.correct) || question.correct < 0 || question.correct >= question.answers.length;
    })) throw new Error('Вопросы черновика имеют неверный формат.');
    if (value.qrEmulation != null && (!object(value.qrEmulation) || ['L', 'M', 'Q', 'H'].indexOf(value.qrEmulation.ecc) < 0)) throw new Error('Параметры QR в черновике имеют неверный формат.');
    return value;
  }

  function serialize(snapshot) {
    var text = JSON.stringify(validate(snapshot), null, 2) + '\r\n';
    if (text.length > MAX_TEXT_LENGTH) throw new Error('Черновик слишком велик для сохранения одним файлом.');
    return text;
  }

  function parse(text) {
    if (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH) throw new Error('Файл черновика слишком велик.');
    var value;
    try { value = JSON.parse(text.replace(/^\uFEFF/, '')); }
    catch (error) { throw new Error('Не удалось прочитать JSON черновика: ' + error.message); }
    return validate(value);
  }

  function createStore(getStorage, owner) {
    var memory = new Map();
    var storageError = '';
    var sequence = 0;
    var lastStamp = 0;

    function list() {
      var records = new Map();
      try {
        var storage = getStorage();
        for (var i = 0; i < storage.length; i++) {
          var key = storage.key(i);
          if (!key || key.indexOf(PREFIX) !== 0) continue;
          try {
            var record = JSON.parse(storage.getItem(key));
            if (!record || record.id !== key.slice(PREFIX.length) || !Number.isFinite(record.savedAt)) continue;
            validate(record.snapshot);
            records.set(record.id, record);
          } catch (error) { /* A damaged or newer record must not erase other drafts. */ }
        }
      } catch (error) { storageError = error.message || 'Хранилище недоступно'; }
      memory.forEach(function (record, id) { records.set(id, record); });
      return Array.from(records.values()).sort(function (a, b) { return b.savedAt - a.savedAt || b.id.localeCompare(a.id); });
    }

    function save(snapshot, label, archive) {
      validate(snapshot);
      lastStamp = Math.max(Date.now(), lastStamp + 1);
      var record = { id: archive ? owner + '-' + lastStamp + '-' + (++sequence) : owner,
        kind: archive ? 'history' : 'current', savedAt: lastStamp, label: String(label || 'Автосохранение'), snapshot: clone(snapshot) };
      memory.set(record.id, record);
      try {
        var text = JSON.stringify(record);
        if (text.length > MAX_TEXT_LENGTH) throw new Error('Черновик слишком велик');
        var storage = getStorage();
        storage.setItem(PREFIX + record.id, text);
        memory.delete(record.id);
        storageError = '';
        ['history', 'current'].forEach(function (kind) {
          list().filter(function (entry) { return entry.kind === kind; }).slice(HISTORY_LIMIT).forEach(function (entry) {
            storage.removeItem(PREFIX + entry.id);
            memory.delete(entry.id);
          });
        });
        return true;
      } catch (error) {
        storageError = error.message || 'Не удалось сохранить черновик';
        return false;
      }
    }

    return {
      list: list,
      save: save,
      latest: function (previousOwner) { var records = list(); return records.find(function (record) { return record.id === (previousOwner || owner); }) || records[0] || null; },
      error: function () { return storageError; }
    };
  }

  return { FORMAT: FORMAT, PREFIX: PREFIX, MAX_TEXT_LENGTH: MAX_TEXT_LENGTH, HISTORY_LIMIT: HISTORY_LIMIT,
    serialize: serialize, parse: parse, createStore: createStore };
});
