(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.QRMicroappsCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QRMicroappsComparison = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';

  var MAX_TEXT_LENGTH = 1000000;
  var CSV_FIELDS = [
    'position', 'source', 'title', 'application_id', 'assignment_id', 'generated_at', 'automatic_ready',
    'html_bytes', 'data_url_bytes', 'qr_version', 'encoding', 'ecc', 'pass', 'fail', 'warn', 'pending',
    'roundtrip_ok', 'checksum'
  ];

  function object(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function number(value) {
    value = Number(value);
    return Number.isFinite(value) ? value : 0;
  }

  function text(value, fallback) {
    value = String(value == null ? '' : value).trim();
    return value || fallback || '';
  }

  function normalize(report, sourceName) {
    if (!report || typeof report !== 'object' || Array.isArray(report)) throw new Error('Отчёт должен быть JSON-объектом.');
    if (report.reportVersion !== '0.1') throw new Error('Поддерживаются отчёты версии 0.1.');
    var application = object(report.application);
    var specification = object(report.specification);
    if (core.validateSpec(specification).length) throw new Error('В отчёте отсутствует полный корректный профиль проверки.');
    if (report.validatorVersion !== core.VALIDATOR_VERSION) throw new Error('Отчёт создан другой версией валидатора. Повторите проверку приложения в текущей лаборатории.');
    var measurements = object(report.measurements);
    var qr = object(measurements.qr);
    var checksum = object(measurements.checksum);
    var validation = object(report.validation);
    var summary = object(validation.summary);
    var roundtrip = object(report.roundtrip);
    var applicationId = text(application.id);
    var title = text(application.title);
    if (!applicationId || !title) throw new Error('В отчёте отсутствуют данные приложения.');
    if (number(measurements.htmlBytes) < 1 || number(measurements.dataUrlBytes) < 1) throw new Error('В отчёте отсутствуют измерения размера.');
    if (!text(checksum.value)) throw new Error('В отчёте отсутствует контрольная сумма.');
    if (!Number.isInteger(measurements.htmlBytes) || !Number.isInteger(measurements.dataUrlBytes)) throw new Error('Размеры в отчёте должны быть целыми числами.');
    if (!Number.isInteger(qr.version) || qr.version < 1 || qr.version > 40) throw new Error('Недопустимая версия QR в отчёте.');
    if (!Number.isInteger(qr.quietZone) || qr.quietZone < 0 || qr.quietZone > 16) throw new Error('В отчёте отсутствует размер белого поля QR.');
    if (['base64', 'percent'].indexOf(measurements.encoding) < 0 || ['L', 'M', 'Q', 'H'].indexOf(qr.ecc) < 0) throw new Error('Не заданы параметры кодирования QR.');
    if (typeof roundtrip.ok !== 'boolean') throw new Error('Отсутствует результат обратного декодирования.');
    var counts = { pass: 0, fail: 0, warn: 0, pending: 0 };
    Object.keys(counts).forEach(function (status) {
      if (!Number.isInteger(summary[status]) || summary[status] < 0) throw new Error('Сводка проверки неполна или содержит недопустимые значения.');
    });
    if (!Array.isArray(validation.checks) || !validation.checks.length) throw new Error('Отсутствует список выполненных проверок.');
    var checkIds = [];
    validation.checks.forEach(function (check) {
      if (!check || typeof check.id !== 'string' || !check.id.trim() || checkIds.indexOf(check.id) >= 0 || !Object.prototype.hasOwnProperty.call(counts, check.status)) throw new Error('Некорректная или повторяющаяся проверка в отчёте.');
      checkIds.push(check.id);
      counts[check.status]++;
    });
    core.expectedCheckIds(specification, qr.ecc).forEach(function (id) {
      if (checkIds.indexOf(id) < 0) throw new Error('В отчёте отсутствует обязательная проверка: ' + id + '.');
    });
    var quietCheck = validation.checks.find(function (check) { return check.id === 'qr-quiet-zone'; });
    if (quietCheck.status !== (qr.quietZone < 4 ? 'fail' : 'pass')) throw new Error('Проверка белого поля противоречит параметрам QR.');
    Object.keys(counts).forEach(function (status) {
      if (counts[status] !== summary[status]) throw new Error('Сводка не совпадает со списком проверок.');
    });
    var item = {
      source: text(sourceName, 'Отчёт'),
      title: title,
      applicationId: applicationId,
      assignmentId: text(specification.id, applicationId),
      generatedAt: text(report.generatedAt),
      htmlBytes: number(measurements.htmlBytes),
      dataUrlBytes: number(measurements.dataUrlBytes),
      qrVersion: number(qr.version),
      encoding: text(measurements.encoding),
      ecc: text(qr.ecc),
      validation: {
        pass: number(summary.pass), fail: number(summary.fail),
        warn: number(summary.warn), pending: number(summary.pending)
      },
      roundtripOk: roundtrip.ok === true,
      checksum: text(checksum.value)
    };
    item.profileKey = core.validationProfileKey(specification, qr.ecc);
    item.automaticReady = item.validation.fail === 0 && item.validation.pending === 0 && item.roundtripOk && item.qrVersion > 0 &&
      validation.checks.find(function (check) { return check.id === 'source-analysis'; }).status === 'pass';
    item.signature = [item.source, item.applicationId, item.checksum, item.encoding, item.ecc, item.profileKey].join('|');
    return item;
  }

  function parse(textValue, sourceName) {
    if (typeof textValue !== 'string') throw new Error('Отчёт должен быть текстовым JSON.');
    if (textValue.length > MAX_TEXT_LENGTH) throw new Error('Файл отчёта слишком велик.');
    var report;
    try { report = JSON.parse(textValue); }
    catch (error) { throw new Error('Ошибка JSON-отчёта: ' + error.message); }
    return normalize(report, sourceName);
  }

  function upsert(items, report, sourceName, maxItems) {
    var list = Array.isArray(items) ? items.slice() : [];
    var next = report && report.signature ? report : normalize(report, sourceName);
    var index = list.findIndex(function (item) { return item.signature === next.signature; });
    var added = index < 0;
    if (added) list.push(next);
    else list[index] = next;
    maxItems = Math.max(1, number(maxItems) || 30);
    if (list.length > maxItems) list = list.slice(list.length - maxItems);
    return { items: list, record: next, added: added };
  }

  function rank(items) {
    return (Array.isArray(items) ? items : []).slice().sort(function (left, right) {
      if (left.automaticReady !== right.automaticReady) return left.automaticReady ? -1 : 1;
      if (left.validation.fail !== right.validation.fail) return left.validation.fail - right.validation.fail;
      if (left.validation.pending !== right.validation.pending) return left.validation.pending - right.validation.pending;
      if (left.roundtripOk !== right.roundtripOk) return left.roundtripOk ? -1 : 1;
      if (left.dataUrlBytes !== right.dataUrlBytes) return left.dataUrlBytes - right.dataUrlBytes;
      if (left.htmlBytes !== right.htmlBytes) return left.htmlBytes - right.htmlBytes;
      return left.title.localeCompare(right.title, 'ru');
    });
  }

  function summarize(items) {
    var list = Array.isArray(items) ? items : [];
    var assignments = [];
    list.forEach(function (item) { if (assignments.indexOf(item.assignmentId) < 0) assignments.push(item.assignmentId); });
    return {
      total: list.length,
      ready: list.filter(function (item) { return item.automaticReady; }).length,
      assignments: assignments,
      mixedProfiles: new Set(list.map(function (item) { return item.profileKey; })).size > 1,
      mixedAssignments: assignments.length > 1
    };
  }

  function csvCell(value) {
    var valueText = String(value == null ? '' : value);
    if (/^[=+\-@]/.test(valueText)) valueText = "'" + valueText;
    return '"' + valueText.replace(/"/g, '""') + '"';
  }

  function toCsv(items) {
    var rows = [CSV_FIELDS.join(',')];
    rank(items).forEach(function (item, index) {
      rows.push([
        index + 1, item.source, item.title, item.applicationId, item.assignmentId, item.generatedAt,
        item.automaticReady ? 'yes' : 'no', item.htmlBytes, item.dataUrlBytes, item.qrVersion,
        item.encoding, item.ecc, item.validation.pass, item.validation.fail, item.validation.warn, item.validation.pending,
        item.roundtripOk ? 'yes' : 'no', item.checksum
      ].map(csvCell).join(','));
    });
    return rows.join('\r\n') + '\r\n';
  }

  return {
    MAX_TEXT_LENGTH: MAX_TEXT_LENGTH,
    CSV_FIELDS: CSV_FIELDS.slice(),
    normalize: normalize,
    parse: parse,
    upsert: upsert,
    rank: rank,
    summarize: summarize,
    toCsv: toCsv
  };
});
