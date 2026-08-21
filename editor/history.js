(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QRMicroappsHistory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CSV_FIELDS = [
    'iteration', 'recorded_at', 'application_id', 'title', 'html_bytes', 'data_url_bytes',
    'qr_version', 'encoding', 'ecc', 'pass', 'fail', 'warn', 'pending', 'roundtrip_ok', 'checksum'
  ];

  function number(value) {
    value = Number(value);
    return Number.isFinite(value) ? value : 0;
  }

  function normalize(record) {
    record = record || {};
    var validation = record.validation || {};
    return {
      number: number(record.number),
      recordedAt: String(record.recordedAt || new Date().toISOString()),
      updatedAt: String(record.updatedAt || record.recordedAt || new Date().toISOString()),
      applicationId: String(record.applicationId || 'microapp'),
      title: String(record.title || record.applicationId || 'Микроприложение'),
      htmlBytes: number(record.htmlBytes),
      dataUrlBytes: number(record.dataUrlBytes),
      qrVersion: number(record.qrVersion),
      encoding: String(record.encoding || ''),
      ecc: String(record.ecc || ''),
      validation: {
        pass: number(validation.pass), fail: number(validation.fail),
        warn: number(validation.warn), pending: number(validation.pending)
      },
      roundtripOk: record.roundtripOk === true,
      checksum: String(record.checksum || ''),
      signature: String(record.signature || '')
    };
  }

  function upsert(history, record, maxItems) {
    var items = Array.isArray(history) ? history.slice() : [];
    var next = normalize(record);
    var last = items[items.length - 1];
    var added = !last || !next.signature || last.signature !== next.signature;
    if (added) {
      next.number = items.reduce(function (maximum, item) { return Math.max(maximum, number(item.number)); }, 0) + 1;
      items.push(next);
    } else {
      next.number = last.number;
      next.recordedAt = last.recordedAt;
      items[items.length - 1] = next;
    }
    maxItems = Math.max(1, number(maxItems) || 50);
    if (items.length > maxItems) items = items.slice(items.length - maxItems);
    return { items: items, record: next, added: added };
  }

  function previousFor(history, current) {
    var items = Array.isArray(history) ? history : [];
    var index = items.lastIndexOf(current);
    if (index < 0) index = items.length;
    for (var i = index - 1; i >= 0; i--) {
      if (items[i].applicationId === current.applicationId) return items[i];
    }
    return null;
  }

  function compare(previous, current) {
    if (!previous || !current) return null;
    return {
      htmlBytes: number(current.htmlBytes) - number(previous.htmlBytes),
      dataUrlBytes: number(current.dataUrlBytes) - number(previous.dataUrlBytes),
      qrVersion: number(current.qrVersion) - number(previous.qrVersion),
      fail: number(current.validation && current.validation.fail) - number(previous.validation && previous.validation.fail)
    };
  }

  function csvCell(value) {
    var text = String(value == null ? '' : value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function toCsv(history) {
    var rows = [CSV_FIELDS.join(',')];
    (Array.isArray(history) ? history : []).forEach(function (item) {
      rows.push([
        item.number, item.recordedAt, item.applicationId, item.title, item.htmlBytes, item.dataUrlBytes,
        item.qrVersion, item.encoding, item.ecc, item.validation.pass, item.validation.fail,
        item.validation.warn, item.validation.pending, item.roundtripOk ? 'yes' : 'no', item.checksum
      ].map(csvCell).join(','));
    });
    return rows.join('\r\n') + '\r\n';
  }

  return {
    CSV_FIELDS: CSV_FIELDS.slice(),
    normalize: normalize,
    upsert: upsert,
    previousFor: previousFor,
    compare: compare,
    toCsv: toCsv
  };
});
