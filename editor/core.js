(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QRMicroappsCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var QR_LIMITS = { L: 2953, M: 2331, Q: 1663, H: 1273 };
  var DATA_URL_PREFIX = 'data:text/html;charset=utf-8';

  function utf8Bytes(value) {
    return new TextEncoder().encode(String(value == null ? '' : value));
  }

  function byteLength(value) {
    return utf8Bytes(value).length;
  }

  function formatByteCount(value) {
    var number = Math.abs(Number(value) || 0);
    var lastTwo = number % 100;
    var last = number % 10;
    var word = lastTwo >= 11 && lastTwo <= 14 ? 'байт' : last === 1 ? 'байт' : last >= 2 && last <= 4 ? 'байта' : 'байт';
    return value + ' ' + word;
  }

  function bytesToBase64(bytes) {
    if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
      return Buffer.from(bytes).toString('base64');
    }
    var out = '';
    var step = 8192;
    for (var i = 0; i < bytes.length; i += step) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    }
    return btoa(out);
  }

  function base64ToBytes(value) {
    var clean = String(value || '').replace(/\s+/g, '');
    if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
      return new Uint8Array(Buffer.from(clean, 'base64'));
    }
    var binary = atob(clean);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function utf8ToBase64(value) {
    return bytesToBase64(utf8Bytes(value));
  }

  function base64ToUtf8(value) {
    return new TextDecoder().decode(base64ToBytes(value));
  }

  function makeDataUrl(html, encoding) {
    var mode = encoding || 'base64';
    if (mode === 'base64') return DATA_URL_PREFIX + ';base64,' + utf8ToBase64(html);
    if (mode === 'percent') return DATA_URL_PREFIX + ',' + encodeURIComponent(html);
    throw new Error('Неизвестный способ кодирования: ' + mode);
  }

  function parseDataUrl(value) {
    var source = String(value || '').trim();
    if (!/^data:/i.test(source)) throw new Error('Строка не является data URL.');
    var comma = source.indexOf(',');
    if (comma < 0) throw new Error('Некорректный data URL: отсутствует разделитель данных.');
    var meta = source.slice(5, comma);
    var payload = source.slice(comma + 1);
    var isBase64 = /;base64(?:;|$)/i.test(meta);
    var mime = (meta.split(';')[0] || 'text/plain').toLowerCase();
    var text;
    try {
      text = isBase64 ? base64ToUtf8(payload) : decodeURIComponent(payload);
    } catch (error) {
      throw new Error('Не удалось декодировать data URL: ' + error.message);
    }
    return { mime: mime, encoding: isBase64 ? 'base64' : 'percent', text: text };
  }

  function normalizeSource(value) {
    var source = String(value || '').trim();
    if (!source) return '';
    return /^data:/i.test(source) ? parseDataUrl(source).text : String(value);
  }

  function compactHtmlTag(tag) {
    var output = '';
    var quote = '';
    var pendingSpace = false;
    for (var index = 0; index < tag.length; index++) {
      var character = tag[index];
      if (quote) {
        output += character;
        if (character === quote) quote = '';
        continue;
      }
      if (character === '"' || character === "'") {
        if (pendingSpace && output && !/[<=\s]$/.test(output)) output += ' ';
        pendingSpace = false;
        quote = character;
        output += character;
        continue;
      }
      if (/\s/.test(character)) {
        pendingSpace = true;
        continue;
      }
      if (pendingSpace) {
        var previous = output[output.length - 1] || '';
        if (character !== '>' && character !== '/' && character !== '=' && previous !== '<' && previous !== '/' && previous !== '=' && previous !== '!') output += ' ';
        pendingSpace = false;
      }
      output += character;
    }
    return output;
  }

  function compactJavaScript(javascript) {
    var source = String(javascript || '');
    var output = '';
    var state = 'code';
    var quote = '';
    for (var index = 0; index < source.length;) {
      var character = source[index];
      var next = source[index + 1] || '';
      if (state === 'string' || state === 'template' || state === 'regex') {
        output += character;
        if (character === '\\' && index + 1 < source.length) output += source[++index];
        else if (character === quote) state = 'code';
        index++;
        continue;
      }
      if (state === 'line-comment') {
        output += character;
        index++;
        if (character === '\n' || character === '\r') state = 'code';
        continue;
      }
      if (state === 'block-comment') {
        output += character;
        if (character === '*' && next === '/') {
          output += next;
          index += 2;
          state = 'code';
        } else index++;
        continue;
      }
      if (character === '"' || character === "'") {
        state = 'string';
        quote = character;
        output += character;
        index++;
        continue;
      }
      if (character === '`') {
        state = 'template';
        quote = character;
        output += character;
        index++;
        continue;
      }
      if (character === '/' && next === '/') {
        state = 'line-comment';
        output += '//';
        index += 2;
        continue;
      }
      if (character === '/' && next === '*') {
        state = 'block-comment';
        output += '/*';
        index += 2;
        continue;
      }
      if (character === '/') {
        state = 'regex';
        quote = '/';
        output += character;
        index++;
        continue;
      }
      if (/\s/.test(character)) {
        var start = index;
        while (index < source.length && /\s/.test(source[index])) index++;
        var whitespace = source.slice(start, index);
        var previous = output[output.length - 1] || '';
        var following = source[index] || '';
        var hasLineBreak = /[\r\n]/.test(whitespace);
        if (hasLineBreak) {
          if (!/[\[\(,;:]$/.test(previous) && !/[\]\),;:]/.test(following) && output) output += '\n';
        } else if (previous !== '\n' && output && !/[\[\]\(\),;:{}=]/.test(previous) && !/[\[\]\(\),;:{}=]/.test(following)) output += ' ';
        continue;
      }
      output += character;
      index++;
    }
    return output.trim();
  }

  function optimizeHtml(value) {
    var source = String(value == null ? '' : value);
    var originalBytes = byteLength(source);
    var protectedContents = [];
    var tokenPrefix = '\uE000QRMLAB';
    while (source.indexOf(tokenPrefix) >= 0) tokenPrefix += 'X';
    var protectedSource = source.replace(/<(script|style|pre|textarea|template|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, function (block, tagName) {
      var openEnd = block.indexOf('>') + 1;
      var closeStart = block.toLowerCase().lastIndexOf('</');
      var token = tokenPrefix + protectedContents.length + '\uE001';
      var content = block.slice(openEnd, closeStart);
      var kind = tagName.toLowerCase();
      protectedContents.push(kind === 'style' ? compactCss(content) : kind === 'script' ? compactJavaScript(content) : content);
      return block.slice(0, openEnd) + token + block.slice(closeStart);
    });
    var commentsRemoved = 0;
    var optimized = protectedSource.replace(/<!--[\s\S]*?-->/g, function (comment) {
      if (/^<!--\s*\[if\b/i.test(comment) || /<!\[endif\]\s*-->$/i.test(comment)) return comment;
      commentsRemoved++;
      return '';
    });
    var blockTags = {
      html: 1, head: 1, body: 1, title: 1, meta: 1, link: 1, base: 1,
      main: 1, section: 1, article: 1, aside: 1, header: 1, footer: 1, nav: 1,
      div: 1, p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1,
      ul: 1, ol: 1, li: 1, dl: 1, dt: 1, dd: 1, table: 1, thead: 1,
      tbody: 1, tfoot: 1, tr: 1, th: 1, td: 1, form: 1, fieldset: 1,
      legend: 1, details: 1, summary: 1, figure: 1, figcaption: 1,
      blockquote: 1, canvas: 1, video: 1, audio: 1, source: 1,
      script: 1, style: 1, pre: 1, textarea: 1, template: 1, svg: 1, math: 1
    };
    optimized = optimized.replace(/(<\/?([a-z][\w:-]*)\b[^>]*>)\s+(?=<\/?([a-z][\w:-]*)\b)/gi, function (whole, leftTag, leftName, rightName) {
      return blockTags[leftName.toLowerCase()] || blockTags[rightName.toLowerCase()] ? leftTag : leftTag + ' ';
    });
    optimized = optimized.replace(/(<!doctype\b[^>]*>)\s+(?=<html\b)/i, '$1').replace(/<[^>]+>/g, compactHtmlTag).trim();
    protectedContents.forEach(function (content, index) {
      optimized = optimized.split(tokenPrefix + index + '\uE001').join(content);
    });
    var optimizedBytes = byteLength(optimized);
    var savedBytes = Math.max(0, originalBytes - optimizedBytes);
    return {
      html: optimized,
      originalBytes: originalBytes,
      optimizedBytes: optimizedBytes,
      savedBytes: savedBytes,
      savedPercent: originalBytes ? savedBytes / originalBytes * 100 : 0,
      commentsRemoved: commentsRemoved,
      changed: optimized !== source
    };
  }

  function getQrLimit(ecc) {
    return QR_LIMITS[String(ecc || 'M').toUpperCase()] || 0;
  }

  function maskJavaScriptNonCode(javascript) {
    var source = String(javascript || '');
    var output = '';
    var state = 'code';
    var quote = '';
    var regexClass = false;
    function masked(character) { return character === '\n' || character === '\r' ? character : ' '; }
    function startsRegex(index) {
      var cursor = index - 1;
      while (cursor >= 0 && /\s/.test(source[cursor])) cursor--;
      if (cursor < 0 || /[\(\[\{=,:;!&|?+\-*%^~<>]/.test(source[cursor])) return true;
      var end = cursor + 1;
      while (cursor >= 0 && /[\w$]/.test(source[cursor])) cursor--;
      return /^(?:return|throw|case|delete|void|typeof|instanceof|in|of|yield|await)$/.test(source.slice(cursor + 1, end));
    }
    for (var index = 0; index < source.length;) {
      var character = source[index];
      var next = source[index + 1] || '';
      if (state === 'string' || state === 'template') {
        output += masked(character);
        if (character === '\\' && index + 1 < source.length) output += masked(source[++index]);
        else if (character === quote) state = 'code';
        index++;
        continue;
      }
      if (state === 'regex') {
        output += masked(character);
        if (character === '\\' && index + 1 < source.length) output += masked(source[++index]);
        else if (character === '[') regexClass = true;
        else if (character === ']') regexClass = false;
        else if (character === '/' && !regexClass) state = 'code';
        index++;
        continue;
      }
      if (state === 'line-comment') {
        output += masked(character);
        index++;
        if (character === '\n' || character === '\r') state = 'code';
        continue;
      }
      if (state === 'block-comment') {
        output += masked(character);
        if (character === '*' && next === '/') {
          output += ' ';
          index += 2;
          state = 'code';
        } else index++;
        continue;
      }
      if (character === '"' || character === "'") {
        state = 'string';
        quote = character;
        output += ' ';
        index++;
        continue;
      }
      if (character === '`') {
        state = 'template';
        quote = character;
        output += ' ';
        index++;
        continue;
      }
      if (character === '/' && next === '/') {
        state = 'line-comment';
        output += '  ';
        index += 2;
        continue;
      }
      if (character === '/' && next === '*') {
        state = 'block-comment';
        output += '  ';
        index += 2;
        continue;
      }
      if (character === '/' && startsRegex(index)) {
        state = 'regex';
        regexClass = false;
        output += ' ';
        index++;
        continue;
      }
      output += character;
      index++;
    }
    return output;
  }

  function findReservedFormatIdentifiers(html) {
    var source = String(html || '');
    var found = [];
    var scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    var scriptMatch;
    while ((scriptMatch = scriptPattern.exec(source))) {
      var code = maskJavaScriptNonCode(scriptMatch[1]);
      var identifierPattern = /\$[A-Za-z_$][\w$]*|\$/g;
      var identifierMatch;
      while ((identifierMatch = identifierPattern.exec(code))) {
        if (identifierMatch[0] !== '$d') found.push(identifierMatch[0]);
      }
    }
    return unique(found);
  }

  function inspectDifficulty(html) {
    var source = String(html || '');
    var declarations = [];
    var scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    var declarationPattern = /\b(var)\s+(\$d)\s*=\s*(-?\d+(?:\.\d+)?)\b/g;
    var scriptMatch;
    while ((scriptMatch = scriptPattern.exec(source))) {
      var bodyStart = scriptMatch.index + scriptMatch[0].indexOf('>') + 1;
      var declarationMatch;
      declarationPattern.lastIndex = 0;
      while ((declarationMatch = declarationPattern.exec(scriptMatch[1]))) {
        var valueOffset = declarationMatch.index + declarationMatch[0].lastIndexOf(declarationMatch[3]);
        declarations.push({
          name: declarationMatch[2],
          value: Number(declarationMatch[3]),
          start: bodyStart + valueOffset,
          end: bodyStart + valueOffset + declarationMatch[3].length
        });
      }
    }
    var declaration = declarations.length === 1 ? declarations[0] : null;
    var valid = !!declaration && Number.isInteger(declaration.value) && declaration.value >= 1 && declaration.value <= 5;
    return {
      count: declarations.length,
      editable: declarations.length === 1,
      valid: valid,
      name: declaration ? declaration.name : '',
      value: declaration ? declaration.value : null,
      start: declaration ? declaration.start : -1,
      end: declaration ? declaration.end : -1
    };
  }

  function setDifficulty(html, value) {
    value = Number(value);
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('Сложность должна быть целым числом от 1 до 5.');
    var source = String(html || '');
    var difficulty = inspectDifficulty(source);
    if (!difficulty.editable) throw new Error(difficulty.count ? 'В HTML должна быть ровно одна переменная сложности.' : 'Добавьте в JavaScript строку var $d=3;.');
    return source.slice(0, difficulty.start) + value + source.slice(difficulty.end);
  }

  function getReductionToFit(html, encoding, ecc) {
    var mode = encoding || 'base64';
    var limit = getQrLimit(ecc);
    var payloadBytes = byteLength(makeDataUrl(html, mode));
    var htmlBytes = byteLength(html);
    var htmlReduction = null;
    if (mode === 'base64') {
      var prefixBytes = byteLength(makeDataUrl('', mode));
      var maxHtmlBytes = Math.max(0, Math.floor((limit - prefixBytes) / 4) * 3);
      htmlReduction = Math.max(0, htmlBytes - maxHtmlBytes);
    }
    return {
      limit: limit,
      payloadBytes: payloadBytes,
      payloadReduction: Math.max(0, payloadBytes - limit),
      htmlBytes: htmlBytes,
      htmlReduction: htmlReduction
    };
  }

  function fitQrDisplay(modules, quietZone, viewportWidth, viewportHeight, pixelRatio) {
    var matrixModules = Math.max(1, Math.floor(Number(modules) || 1));
    var quiet = Math.max(0, Math.floor(Number(quietZone) || 0));
    var totalModules = matrixModules + quiet * 2;
    var ratio = Number(pixelRatio);
    if (!Number.isFinite(ratio) || ratio <= 0) ratio = 1;
    var cssLimit = Math.max(1, Math.min(Number(viewportWidth) || 1, Number(viewportHeight) || 1));
    var physicalLimit = Math.max(totalModules, Math.floor(cssLimit * ratio));
    var pixelsPerModule = Math.max(1, Math.floor(physicalLimit / totalModules));
    var physicalSize = totalModules * pixelsPerModule;
    var physicalViewportWidth = Math.floor(Math.max(1, Number(viewportWidth) || 1) * ratio);
    var physicalViewportHeight = Math.floor(Math.max(1, Number(viewportHeight) || 1) * ratio);
    var physicalLeft = Math.max(0, Math.floor((physicalViewportWidth - physicalSize) / 2));
    var physicalTop = Math.max(0, Math.floor((physicalViewportHeight - physicalSize) / 2));
    return {
      totalModules: totalModules,
      pixelsPerModule: pixelsPerModule,
      physicalSize: physicalSize,
      cssSize: physicalSize / ratio,
      physicalLeft: physicalLeft,
      physicalTop: physicalTop,
      cssLeft: physicalLeft / ratio,
      cssTop: physicalTop / ratio
    };
  }

  function fnv1a(value) {
    var bytes = utf8Bytes(value);
    var hash = 0x811c9dc5;
    for (var i = 0; i < bytes.length; i++) {
      hash ^= bytes[i];
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return ('00000000' + hash.toString(16)).slice(-8);
  }

  async function checksum(value) {
    var cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (cryptoApi && cryptoApi.subtle) {
      var digest = await cryptoApi.subtle.digest('SHA-256', utf8Bytes(value));
      var bytes = new Uint8Array(digest);
      var hex = '';
      for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
      return { algorithm: 'SHA-256', value: hex };
    }
    return { algorithm: 'FNV-1a-32', value: fnv1a(value) };
  }

  function validateSpec(spec) {
    var errors = [];
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
      return ['Профиль проверки должен быть JSON-объектом.'];
    }
    if (spec.schemaVersion !== '0.1') errors.push('Поддерживается schemaVersion «0.1».');
    if (!spec.id || typeof spec.id !== 'string') errors.push('Не задан строковый идентификатор id.');
    if (!spec.title || typeof spec.title !== 'string') errors.push('Не задано название title.');
    if (!spec.qr || typeof spec.qr !== 'object') errors.push('Не задан раздел qr.');
    else {
      if (['base64', 'percent'].indexOf(spec.qr.encoding) < 0) errors.push('qr.encoding должен быть base64 или percent.');
      if (['L', 'M', 'Q', 'H'].indexOf(spec.qr.ecc) < 0) errors.push('qr.ecc должен быть L, M, Q или H.');
    }
    if (spec.interface && spec.interface.minTouchTargetPx != null && (!Number.isInteger(spec.interface.minTouchTargetPx) || spec.interface.minTouchTargetPx < 24 || spec.interface.minTouchTargetPx > 96)) {
      errors.push('interface.minTouchTargetPx должен быть целым числом от 24 до 96.');
    }
    if (spec.interface && spec.interface.minControlGapPx != null && (!Number.isInteger(spec.interface.minControlGapPx) || spec.interface.minControlGapPx < 0 || spec.interface.minControlGapPx > 32)) {
      errors.push('interface.minControlGapPx должен быть целым числом от 0 до 32.');
    }
    if (spec.interface && spec.interface.requireControlLabels != null && typeof spec.interface.requireControlLabels !== 'boolean') {
      errors.push('interface.requireControlLabels должен быть логическим значением.');
    }
    if (spec.interface && spec.interface.noVerticalScroll != null && typeof spec.interface.noVerticalScroll !== 'boolean') {
      errors.push('interface.noVerticalScroll должен быть логическим значением.');
    }
    if (spec.difficulty != null && (!Number.isInteger(spec.difficulty) || spec.difficulty < 1 || spec.difficulty > 5)) {
      errors.push('difficulty должен быть целым числом от 1 до 5.');
    }
    return errors;
  }

  function result(id, label, status, message, evidence) {
    return { id: id, label: label, status: status, message: message, evidence: evidence || '' };
  }

  function unique(values) {
    return values.filter(function (value, index) { return values.indexOf(value) === index; });
  }

  function attributeValue(tag, name) {
    var pattern = new RegExp('\\b' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
    var match = pattern.exec(tag || '');
    return match ? (match[1] || match[2] || match[3] || '').trim() : '';
  }

  function findExternalResources(html) {
    var found = [];
    var attributes = /<(script|link|img|iframe|audio|video|source|track|object|embed|input|image|use|a|form)\b[^>]*?\b(src|href|xlink:href|srcset|data|poster|action)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    var match;
    while ((match = attributes.exec(html))) {
      var value = (match[3] || match[4] || match[5] || '').trim();
      if (value && !/^(?:data:|blob:|#|about:blank$)/i.test(value)) found.push(match[1] + '[' + match[2] + '] → ' + value.slice(0, 120));
    }
    var cssUrls = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi;
    while ((match = cssUrls.exec(html))) {
      var cssValue = (match[1] || match[2] || match[3] || '').trim();
      if (cssValue && !/^(?:data:|blob:|#)/i.test(cssValue)) found.push('CSS url() → ' + cssValue.slice(0, 120));
    }
    var cssImports = /@import\s+(?:"([^"]+)"|'([^']+)')/gi;
    while ((match = cssImports.exec(html))) {
      var importValue = (match[1] || match[2] || '').trim();
      if (importValue && !/^(?:data:|blob:|#)/i.test(importValue)) found.push('CSS @import → ' + importValue.slice(0, 120));
    }
    var metaTags = html.match(/<meta\b[^>]*>/gi) || [];
    metaTags.forEach(function (tag) {
      if (!/^refresh$/i.test(attributeValue(tag, 'http-equiv'))) return;
      var refresh = attributeValue(tag, 'content');
      var target = /\burl\s*=\s*(?:"([^"]*)"|'([^']*)'|([^;\s]+))/i.exec(refresh);
      var refreshUrl = target ? (target[1] || target[2] || target[3] || '').trim() : '';
      if (!refreshUrl || !/^(?:data:|blob:|#|about:blank$)/i.test(refreshUrl)) found.push('meta[refresh] → ' + (refreshUrl || refresh || 'переход'));
    });
    if (/<base\b[^>]*href\s*=/i.test(html)) found.push('base[href]');
    return unique(found);
  }

  function findNetworkApis(html) {
    var patterns = [
      ['fetch()', /\bfetch\s*\(/i],
      ['XMLHttpRequest', /\bXMLHttpRequest\b/i],
      ['WebSocket', /\bWebSocket\b/i],
      ['EventSource', /\bEventSource\b/i],
      ['sendBeacon()', /\bsendBeacon\s*\(/i],
      ['importScripts()', /\bimportScripts\s*\(/i],
      ['динамический import()', /\bimport\s*\(/i],
      ['window.open()', /\bwindow\s*\.\s*open\s*\(/i],
      ['переход через location', /(?:\b(?:window|document)\s*\.\s*)?\blocation(?:\s*\.\s*href)?\s*=|\blocation\s*\.\s*(?:assign|replace)\s*\(/i]
    ];
    return patterns.filter(function (entry) { return entry[1].test(html); }).map(function (entry) { return entry[0]; });
  }

  function countMarkupAndContent(source, totals) {
    var tagPattern = /<[^>]*>/g;
    var cursor = 0;
    var match;
    while ((match = tagPattern.exec(source))) {
      totals.content += byteLength(source.slice(cursor, match.index));
      totals.markup += byteLength(match[0]);
      cursor = match.index + match[0].length;
    }
    totals.content += byteLength(source.slice(cursor));
  }

  function compactCss(css) {
    var source = String(css || '');
    var withoutComments = '';
    var quote = '';
    for (var index = 0; index < source.length; index++) {
      var character = source[index];
      if (quote) {
        withoutComments += character;
        if (character === '\\' && index + 1 < source.length) withoutComments += source[++index];
        else if (character === quote) quote = '';
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        withoutComments += character;
        continue;
      }
      if (character === '/' && source[index + 1] === '*') {
        index += 2;
        while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) index++;
        index++;
        continue;
      }
      withoutComments += character;
    }
    var output = '';
    var pendingSpace = false;
    quote = '';
    for (var position = 0; position < withoutComments.length; position++) {
      var current = withoutComments[position];
      if (quote) {
        output += current;
        if (current === '\\' && position + 1 < withoutComments.length) output += withoutComments[++position];
        else if (current === quote) quote = '';
        continue;
      }
      if (current === '"' || current === "'") {
        if (pendingSpace && output && !/[{}:;,>]$/.test(output)) output += ' ';
        pendingSpace = false;
        quote = current;
        output += current;
        continue;
      }
      if (/\s/.test(current)) {
        pendingSpace = true;
        continue;
      }
      if (pendingSpace) {
        var previous = output[output.length - 1] || '';
        if (output && !/[{}:;,>]$/.test(previous) && !/[{}:;,>]/.test(current)) output += ' ';
        pendingSpace = false;
      }
      if (/[{}:;,>]/.test(current) && output[output.length - 1] === ' ') output = output.slice(0, -1);
      output += current;
    }
    return output.replace(/;}/g, '}').trim();
  }

  function analyzeSize(html, options) {
    html = String(html == null ? '' : html);
    options = options || {};
    var totals = { markup: 0, css: 0, javascript: 0, content: 0 };
    var blockPattern = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
    var cursor = 0;
    var match;
    var cssSavings = 0;
    while ((match = blockPattern.exec(html))) {
      countMarkupAndContent(html.slice(cursor, match.index), totals);
      var kind = match[1].toLowerCase();
      totals[kind === 'style' ? 'css' : 'javascript'] += byteLength(match[0]);
      if (kind === 'style') {
        var openEnd = match[0].indexOf('>') + 1;
        var closeStart = match[0].toLowerCase().lastIndexOf('</style');
        var cssSource = match[0].slice(openEnd, closeStart);
        cssSavings += Math.max(0, byteLength(cssSource) - byteLength(compactCss(cssSource)));
      }
      cursor = match.index + match[0].length;
    }
    countMarkupAndContent(html.slice(cursor), totals);

    var totalBytes = byteLength(html);
    var categories = [
      { id: 'markup', label: 'HTML-разметка', bytes: totals.markup },
      { id: 'css', label: 'CSS', bytes: totals.css },
      { id: 'javascript', label: 'JavaScript', bytes: totals.javascript },
      { id: 'content', label: 'Текст и данные', bytes: totals.content }
    ].map(function (category) {
      category.percent = totalBytes ? category.bytes / totalBytes * 100 : 0;
      return category;
    });

    var encoding = options.encoding || 'base64';
    var base64Bytes = byteLength(makeDataUrl(html, 'base64'));
    var percentBytes;
    try { percentBytes = byteLength(makeDataUrl(html, 'percent')); }
    catch (error) { percentBytes = null; }
    var currentBytes = encoding === 'percent' && percentBytes != null ? percentBytes : base64Bytes;
    var ecc = options.ecc || 'M';
    var qrLimit = getQrLimit(ecc);
    var effectiveLimit = qrLimit;
    var embeddedMatches = html.match(/\bdata:[^"'\s<>]+/gi) || [];
    var embeddedBytes = embeddedMatches.reduce(function (sum, value) { return sum + byteLength(value); }, 0);
    var formattingSavings = optimizeHtml(html).savedBytes;
    var hints = [];
    function hint(id, level, title, message, savings) {
      hints.push({ id: id, level: level, title: title, message: message, estimatedSavings: savings || 0 });
    }

    if (formattingSavings >= 8) hint('markup-formatting', 'info', 'Убрать комментарии и межтеговые пробелы', 'Оценочная экономия без изменения содержимого: ' + formatByteCount(formattingSavings) + '.', formattingSavings);
    if (cssSavings >= 8) hint('css-formatting', 'info', 'Уплотнить CSS', 'Комментарии и форматирование CSS занимают примерно ' + formatByteCount(cssSavings) + '.', cssSavings);
    var alternativeEncoding = encoding === 'base64' ? 'percent' : 'base64';
    var alternativeBytes = alternativeEncoding === 'base64' ? base64Bytes : percentBytes;
    if (alternativeBytes != null && currentBytes - alternativeBytes >= 8) hint('encoding', 'info', 'Сравнить кодирование ' + alternativeEncoding, 'Для текущего текста нагрузка будет меньше примерно на ' + formatByteCount(currentBytes - alternativeBytes) + '.', currentBytes - alternativeBytes);
    if (effectiveLimit && effectiveLimit - currentBytes < Math.max(40, effectiveLimit * 0.05)) {
      hint('payload-reserve', currentBytes > effectiveLimit ? 'danger' : 'warn', 'Малый запас QR-нагрузки', currentBytes > effectiveLimit ? 'Лимит превышен на ' + formatByteCount(currentBytes - effectiveLimit) + '.' : 'До действующего лимита осталось ' + formatByteCount(effectiveLimit - currentBytes) + '. Любое изменение текста требует повторной проверки.');
    }
    if (embeddedMatches.length) hint('embedded-data', embeddedBytes > totalBytes * 0.25 ? 'warn' : 'info', 'Встроенные data:-ресурсы', 'Найдено ресурсов: ' + embeddedMatches.length + ', суммарная длина ссылок — ' + formatByteCount(embeddedBytes) + '. Проверьте, нужен ли каждый ресурс.');
    var largest = categories.reduce(function (best, category) { return category.bytes > best.bytes ? category : best; }, categories[0]);
    if (largest && largest.bytes) hint('largest-category', 'info', 'Крупнейшая часть — ' + largest.label, 'Она занимает ' + formatByteCount(largest.bytes) + ' (' + Math.round(largest.percent) + ' % HTML). Оптимизацию разумно начинать здесь.');
    if (!hints.length) hint('no-obvious-savings', 'info', 'Явных резервов не найдено', 'Код уже компактен по измеримым признакам. Не удаляйте обязательные функции ради нескольких байт.');

    return {
      totalBytes: totalBytes,
      categories: categories,
      embeddedData: { count: embeddedMatches.length, bytes: embeddedBytes },
      payload: {
        encoding: encoding,
        currentBytes: currentBytes,
        base64Bytes: base64Bytes,
        percentBytes: percentBytes,
        qrLimit: qrLimit,
        effectiveLimit: effectiveLimit || null,
        reserve: effectiveLimit ? effectiveLimit - currentBytes : null
      },
      estimates: { formattingSavings: formattingSavings, cssSavings: cssSavings },
      hints: hints
    };
  }

  function analyzeControls(controls, minSize, minGap) {
    controls = Array.isArray(controls) ? controls.filter(function (control) {
      return control && Number.isFinite(control.width) && Number.isFinite(control.height) && control.width > 0 && control.height > 0;
    }) : [];
    minSize = Number(minSize) || 0;
    minGap = Number(minGap) || 0;
    var small = controls.filter(function (control) { return control.width < minSize || control.height < minSize; });
    var unlabeled = controls.filter(function (control) { return !control.labeled; });
    var tightPairs = 0;
    var smallestGap = null;
    for (var i = 0; i < controls.length; i++) {
      for (var j = i + 1; j < controls.length; j++) {
        var first = controls[i];
        var second = controls[j];
        var firstRight = Number.isFinite(first.right) ? first.right : first.left + first.width;
        var secondRight = Number.isFinite(second.right) ? second.right : second.left + second.width;
        var firstBottom = Number.isFinite(first.bottom) ? first.bottom : first.top + first.height;
        var secondBottom = Number.isFinite(second.bottom) ? second.bottom : second.top + second.height;
        if (![first.left, first.top, second.left, second.top, firstRight, secondRight, firstBottom, secondBottom].every(Number.isFinite)) continue;
        var dx = Math.max(0, first.left - secondRight, second.left - firstRight);
        var dy = Math.max(0, first.top - secondBottom, second.top - firstBottom);
        var gap = Math.sqrt(dx * dx + dy * dy);
        if (smallestGap == null || gap < smallestGap) smallestGap = gap;
        if (gap < minGap) tightPairs++;
      }
    }
    return {
      count: controls.length,
      smallCount: small.length,
      unlabeledCount: unlabeled.length,
      tightPairCount: tightPairs,
      minWidth: controls.length ? Math.min.apply(null, controls.map(function (control) { return control.width; })) : null,
      minHeight: controls.length ? Math.min.apply(null, controls.map(function (control) { return control.height; })) : null,
      smallestGap: smallestGap
    };
  }

  function validateHtml(html, spec, options) {
    options = options || {};
    var checks = [];
    var technical = spec.technical || {};
    var interfaceRules = spec.interface || {};
    var encoding = options.encoding || (spec.qr && spec.qr.encoding) || 'base64';
    var ecc = options.ecc || (spec.qr && spec.qr.ecc) || 'M';
    var dataUrl = options.dataUrl || makeDataUrl(html, encoding);
    var payloadBytes = byteLength(dataUrl);
    var external = findExternalResources(html);
    var network = findNetworkApis(html);
    var difficulty = inspectDifficulty(html);
    var reservedFormatIdentifiers = findReservedFormatIdentifiers(html);

    var doctypes = html.match(/<!doctype\s+html\s*>/gi) || [];
    var validDoctype = doctypes.length === 1 && /^\s*<!doctype\s+html\s*>/i.test(html);
    checks.push(result('single-html', 'HTML-документ', validDoctype ? 'pass' : 'fail', validDoctype ? 'Документ начинается с единственного <!doctype html>.' : 'Документ должен начинаться с единственного <!doctype html>.', doctypes.length > 1 ? 'Найдено doctype: ' + doctypes.length : ''));

    var hasUtf8 = /<meta\b[^>]*\bcharset\s*=\s*["']?utf-8["']?[^>]*>/i.test(html);
    checks.push(result('charset', 'Кодировка UTF-8', hasUtf8 ? 'pass' : 'fail', hasUtf8 ? 'Тег meta charset=utf-8 найден.' : 'Добавьте meta charset=utf-8 для прямого открытия HTML с корректной кириллицей.'));

    if (technical.requiredViewport !== false) {
      var viewportTags = html.match(/<meta\b[^>]*>/gi) || [];
      var viewportTag = '';
      viewportTags.some(function (tag) {
        if (!/^viewport$/i.test(attributeValue(tag, 'name'))) return false;
        viewportTag = tag;
        return true;
      });
      var viewportContent = attributeValue(viewportTag, 'content');
      var hasDeviceWidth = /(?:^|[,;\s])width\s*=\s*device-width(?:$|[,;\s])/i.test(viewportContent);
      var hasInitialScale = /(?:^|[,;\s])initial-scale\s*=\s*1(?:\.0+)?(?:$|[,;\s])/i.test(viewportContent);
      var validViewport = !!viewportTag && hasDeviceWidth && hasInitialScale;
      checks.push(result('viewport', 'Мобильный viewport', validViewport ? 'pass' : 'fail', validViewport ? 'Viewport содержит width=device-width и initial-scale=1.' : 'Добавьте meta viewport с width=device-width,initial-scale=1.', viewportTag && !validViewport ? viewportTag : ''));
    }

    if (technical.externalResources === false) {
      checks.push(result('external-resources', 'Внешние ресурсы', external.length ? 'fail' : 'pass', external.length ? 'Обнаружены внешние или файловые зависимости.' : 'Ссылки на внешние ресурсы не обнаружены.', external.join('\n')));
    }

    if (technical.networkRequests === false) {
      checks.push(result('network-apis', 'Сеть и навигация', network.length ? 'fail' : 'pass', network.length ? 'Обнаружены сетевые API или переходы из приложения.' : 'Явные сетевые API и программные переходы не обнаружены.', network.join(', ')));
    }

    if (spec.type === 'game' || spec.difficulty != null) {
      var expectedDifficulty = Number.isInteger(spec.difficulty) ? spec.difficulty : 3;
      var difficultyStatus = difficulty.count === 1 && difficulty.valid && difficulty.value === expectedDifficulty ? 'pass' : 'fail';
      var difficultyMessage = difficulty.count === 0
        ? 'Добавьте в JavaScript одну переменную var $d=3; для настройки сложности в редакторе.'
        : difficulty.count > 1
          ? 'Найдена не одна переменная сложности: ' + difficulty.count + '.'
          : !difficulty.valid
            ? 'Значение сложности должно быть целым числом от 1 до 5.'
            : difficulty.value !== expectedDifficulty
              ? 'Значение в HTML (' + difficulty.value + ') не совпадает с профилем (' + expectedDifficulty + ').'
              : 'Сложность ' + difficulty.value + ' доступна для изменения в редакторе.';
      checks.push(result('difficulty', 'Настраиваемая сложность', difficultyStatus, difficultyMessage, difficulty.name ? difficulty.name + '=' + difficulty.value : ''));
    }

    checks.push(result(
      'reserved-format-identifiers',
      'Зарезервированный префикс $',
      reservedFormatIdentifiers.length ? 'warn' : 'pass',
      reservedFormatIdentifiers.length
        ? 'Имена, начинающиеся с $, зарезервированы форматом QR Microapps Lab. Переименуйте пользовательские переменные.'
        : 'Пользовательские идентификаторы с зарезервированным префиксом $ не обнаружены.',
      reservedFormatIdentifiers.join(', ')
    ));

    var nativeDialogs = html.match(/\b(?:alert|confirm|prompt)\s*\(/gi) || [];
    checks.push(result('native-dialogs', 'Нативные диалоги', nativeDialogs.length ? 'warn' : 'pass', nativeDialogs.length ? 'Нативные диалоги могут мешать рестарту и блокировать интерфейс.' : 'alert/confirm/prompt не обнаружены.', unique(nativeDialogs).join(', ')));

    var qrLimit = getQrLimit(ecc);
    checks.push(result('payload-size', 'Вместимость QR', payloadBytes <= qrLimit ? 'pass' : 'fail', payloadBytes + ' из ' + qrLimit + ' байт по стандартной вместимости QR; кодирование ' + encoding + ', коррекция ' + ecc + '.'));
    if (ecc === 'L') {
      var mReduction = getReductionToFit(html, encoding, 'M');
      var reductionText = mReduction.payloadReduction
        ? mReduction.htmlReduction == null
          ? 'Для возврата к M сократите QR-нагрузку минимум на ' + formatByteCount(mReduction.payloadReduction) + '.'
          : 'Для возврата к M сократите HTML минимум на ' + formatByteCount(mReduction.htmlReduction) + '.'
        : 'Данные уже помещаются в M — рекомендуется выбрать M.';
      checks.push(result('low-ecc', 'Коррекция L', 'warn', 'Уровень L снижает устойчивость QR-кода к повреждениям. ' + reductionText));
    }

    if (interfaceRules.touchControls) {
      var touchHint = /(?:touchstart|pointerdown|pointerup|onclick\s*=|addEventListener\s*\(\s*["']click|<button\b)/i.test(html);
      checks.push(result('touch-controls', 'Сенсорное управление', touchHint ? 'pass' : 'warn', touchHint ? 'Обнаружены обработчики или элементы, доступные касанием.' : 'Сенсорное управление не удалось подтвердить статически.'));
    }

    if (interfaceRules.noHorizontalScroll) {
      if (options.runtime && typeof options.runtime.horizontalOverflow === 'boolean') {
        checks.push(result('horizontal-overflow', 'Горизонтальная прокрутка', options.runtime.horizontalOverflow ? 'fail' : 'pass', options.runtime.horizontalOverflow ? 'Предпросмотр шире доступной области.' : 'В текущем размере переполнение не обнаружено.', options.runtime.scrollWidth ? 'scrollWidth=' + options.runtime.scrollWidth + ', viewport=' + options.runtime.viewportWidth : ''));
      } else checks.push(result('horizontal-overflow', 'Горизонтальная прокрутка', 'pending', 'Ожидается измерение запущенного предпросмотра.'));
    }

    if (interfaceRules.noVerticalScroll !== false) {
      if (options.runtime && typeof options.runtime.verticalOverflow === 'boolean') {
        checks.push(result('vertical-overflow', 'Вертикальная прокрутка', options.runtime.verticalOverflow ? 'fail' : 'pass', options.runtime.verticalOverflow ? 'Предпросмотр выше доступной области.' : 'В текущем размере переполнение не обнаружено.', options.runtime.scrollHeight ? 'scrollHeight=' + options.runtime.scrollHeight + ', viewport=' + options.runtime.viewportHeight : ''));
      } else checks.push(result('vertical-overflow', 'Вертикальная прокрутка', 'pending', 'Ожидается измерение запущенного предпросмотра.'));
    }

    var hasRuntimeControls = options.runtime && Array.isArray(options.runtime.controls);
    var controlMetrics = hasRuntimeControls ? analyzeControls(options.runtime.controls, interfaceRules.minTouchTargetPx, interfaceRules.minControlGapPx) : null;
    if (interfaceRules.minTouchTargetPx) {
      if (controlMetrics && controlMetrics.count) checks.push(result(
        'touch-target-size',
        'Размер зон касания',
        controlMetrics.smallCount ? 'fail' : 'pass',
        controlMetrics.smallCount ? 'Элементов меньше ' + interfaceRules.minTouchTargetPx + ' px: ' + controlMetrics.smallCount + ' из ' + controlMetrics.count + '.' : 'Проверено элементов: ' + controlMetrics.count + '. Минимальный размер — ' + interfaceRules.minTouchTargetPx + ' px.',
        'Минимум: ' + Math.round(controlMetrics.minWidth) + '×' + Math.round(controlMetrics.minHeight) + ' px.'
      ));
      else if (!options.runtime) checks.push(result('touch-target-size', 'Размер зон касания', 'pending', 'Ожидается измерение элементов в предпросмотре.'));
      else checks.push(result('touch-target-size', 'Размер зон касания', 'warn', 'Измеримые DOM-элементы управления не найдены. Управление внутри canvas автоматически не оценивается.'));
    }

    if (interfaceRules.minControlGapPx != null) {
      if (controlMetrics) {
        if (controlMetrics.count < 2) checks.push(result('control-spacing', 'Интервалы между элементами', 'pass', 'На текущем экране меньше двух измеримых элементов управления.'));
        else checks.push(result(
          'control-spacing',
          'Интервалы между элементами',
          controlMetrics.tightPairCount ? 'fail' : 'pass',
          controlMetrics.tightPairCount ? 'Пар с интервалом меньше ' + interfaceRules.minControlGapPx + ' px: ' + controlMetrics.tightPairCount + '.' : 'Интервалы между элементами не меньше ' + interfaceRules.minControlGapPx + ' px.',
          controlMetrics.smallestGap == null ? '' : 'Минимальный интервал: ' + Math.round(controlMetrics.smallestGap) + ' px.'
        ));
      } else checks.push(result('control-spacing', 'Интервалы между элементами', 'pending', 'Ожидается измерение элементов в предпросмотре.'));
    }

    if (interfaceRules.requireControlLabels) {
      if (controlMetrics && controlMetrics.count) checks.push(result(
        'control-labels',
        'Подписи элементов управления',
        controlMetrics.unlabeledCount ? 'fail' : 'pass',
        controlMetrics.unlabeledCount ? 'Элементов без текста, value, aria-label или title: ' + controlMetrics.unlabeledCount + '.' : 'Все измеримые элементы имеют подпись.'
      ));
      else if (!options.runtime) checks.push(result('control-labels', 'Подписи элементов управления', 'pending', 'Ожидается измерение элементов в предпросмотре.'));
      else checks.push(result('control-labels', 'Подписи элементов управления', 'warn', 'Измеримые DOM-элементы управления не найдены.'));
    }

    if (!options.runtime) {
      checks.push(result('preview-start', 'Запуск предпросмотра', 'pending', 'Ожидается запуск изолированного предпросмотра.'));
      checks.push(result('runtime-errors', 'Ошибки выполнения', 'pending', 'Ожидается запуск изолированного предпросмотра.'));
      checks.push(result('blocked-operations', 'Заблокированные операции', 'pending', 'Ожидается запуск изолированного предпросмотра.'));
    } else {
      var runtimeErrors = Array.isArray(options.runtime.errors) ? options.runtime.errors : [];
      var blockedOperations = Array.isArray(options.runtime.blocked) ? options.runtime.blocked : [];
      checks.push(result('preview-start', 'Запуск предпросмотра', 'pass', 'Приложение загрузилось в изолированном предпросмотре.'));
      checks.push(result('runtime-errors', 'Ошибки выполнения', runtimeErrors.length ? 'fail' : 'pass', runtimeErrors.length ? 'Во время выполнения обнаружены ошибки JavaScript.' : 'Ошибки JavaScript и необработанные Promise не обнаружены.', runtimeErrors.map(function (item) { return typeof item === 'string' ? item : item.message + (item.line ? ' · строка ' + item.line : ''); }).join('\n')));
      checks.push(result('blocked-operations', 'Заблокированные операции', blockedOperations.length ? 'fail' : 'pass', blockedOperations.length ? 'Предпросмотр заблокировал ресурсы или возможности, нарушающие автономность.' : 'Нарушения политики автономного запуска не обнаружены.', blockedOperations.map(function (item) { return typeof item === 'string' ? item : item.uri || item.directive || 'неизвестная операция'; }).join('\n')));
    }

    return checks;
  }

  function summarizeChecks(checks) {
    return checks.reduce(function (summary, check) {
      if (Object.prototype.hasOwnProperty.call(summary, check.status)) summary[check.status] += 1;
      return summary;
    }, { pass: 0, fail: 0, warn: 0, pending: 0 });
  }

  function injectIntoHtml(html, injection) {
    var head = /<head(?:\s[^>]*)?>/i.exec(html);
    if (head) {
      var at = head.index + head[0].length;
      return html.slice(0, at) + injection + html.slice(at);
    }
    var doctype = /<!doctype[^>]*>/i.exec(html);
    var position = doctype ? doctype.index + doctype[0].length : 0;
    return html.slice(0, position) + injection + html.slice(position);
  }

  function buildPreviewDocument(html, token) {
    var safeToken = JSON.stringify(String(token));
    var csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; connect-src \'none\'; img-src data: blob:; media-src data: blob:; font-src data:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; frame-src \'none\'; worker-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">';
    var monitor = '<script>(function(){var t=' + safeToken + ',z,x=[],b=[];' +
      'function p(k,d){parent.postMessage({source:"qr-microapps-preview",token:t,kind:k,data:d||{}},"*")}' +
      'addEventListener("error",function(e){if(x.length>=20)return;var d={message:e.message||"Ошибка JavaScript",line:e.lineno||0};x.push(d);p("error",d);u()});' +
      'addEventListener("unhandledrejection",function(e){if(x.length>=20)return;var d={message:String(e.reason||"Необработанный Promise")};x.push(d);p("error",d);u()});' +
      'addEventListener("securitypolicyviolation",function(e){if(b.length>=20)return;var d={directive:e.violatedDirective||"",uri:e.blockedURI||""};b.push(d);p("blocked",d);u()});' +
      'function m(){var d=document.documentElement,o=document.body,sw=Math.max(d?d.scrollWidth:0,o?o.scrollWidth:0),sh=Math.max(d?d.scrollHeight:0,o?o.scrollHeight:0),vw=d?d.clientWidth:innerWidth,vh=d?d.clientHeight:innerHeight,es=document.querySelectorAll("button,a[href],input:not([type=hidden]),select,textarea,[role=button],[onclick]"),cs=[];' +
      'for(var i=0;i<es.length;i++){var e=es[i],r=e.getBoundingClientRect(),s=getComputedStyle(e);if(r.width<1||r.height<1||s.display=="none"||s.visibility=="hidden")continue;var l=(e.getAttribute("aria-label")||e.getAttribute("title")||e.innerText||e.value||"").trim();cs.push({width:Math.round(r.width*10)/10,height:Math.round(r.height*10)/10,left:Math.round(r.left*10)/10,top:Math.round(r.top*10)/10,right:Math.round(r.right*10)/10,bottom:Math.round(r.bottom*10)/10,labeled:!!l})}' +
      'p("metrics",{horizontalOverflow:sw>vw+1,verticalOverflow:sh>vh+1,scrollWidth:sw,scrollHeight:sh,viewportWidth:vw,viewportHeight:vh,controls:cs,errors:x.slice(),blocked:b.slice()})}' +
      'function u(){clearTimeout(z);z=setTimeout(m,40)}addEventListener("load",function(){m();new MutationObserver(u).observe(document.body,{childList:true,subtree:true});setTimeout(m,350);p("ready")});addEventListener("resize",u)})();</script>';
    return injectIntoHtml(html, csp + monitor);
  }

  return {
    DATA_URL_PREFIX: DATA_URL_PREFIX,
    QR_LIMITS: QR_LIMITS,
    byteLength: byteLength,
    utf8ToBase64: utf8ToBase64,
    base64ToUtf8: base64ToUtf8,
    makeDataUrl: makeDataUrl,
    parseDataUrl: parseDataUrl,
    normalizeSource: normalizeSource,
    optimizeHtml: optimizeHtml,
    getQrLimit: getQrLimit,
    inspectDifficulty: inspectDifficulty,
    findReservedFormatIdentifiers: findReservedFormatIdentifiers,
    setDifficulty: setDifficulty,
    getReductionToFit: getReductionToFit,
    fitQrDisplay: fitQrDisplay,
    checksum: checksum,
    validateSpec: validateSpec,
    findExternalResources: findExternalResources,
    findNetworkApis: findNetworkApis,
    analyzeSize: analyzeSize,
    analyzeControls: analyzeControls,
    validateHtml: validateHtml,
    summarizeChecks: summarizeChecks,
    buildPreviewDocument: buildPreviewDocument
  };
});
