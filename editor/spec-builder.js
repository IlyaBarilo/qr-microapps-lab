(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QRMicroappsSpecBuilder = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var TYPES = ['game', 'quiz', 'career-guidance', 'interactive', 'other'];
  var ENCODINGS = ['base64', 'percent'];
  var ECC_LEVELS = ['L', 'M', 'Q', 'H'];

  function text(value, fallback, limit) {
    value = String(value == null ? '' : value).trim();
    return (value || fallback || '').slice(0, limit || 240);
  }

  function integer(value, min, max, fallback) {
    if (value === '' || value == null) return fallback;
    value = Number(value);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  function choice(value, allowed, fallback) {
    value = String(value || '');
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function bool(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
  }

  function slug(value, fallback) {
    var transliteration = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i',
      к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
      х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya'
    };
    var result = String(value || '').toLowerCase().replace(/[а-яё]/g, function (character) { return transliteration[character] || ''; })
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
    return result || fallback || 'microapp';
  }

  function normalize(spec) {
    spec = spec && typeof spec === 'object' && !Array.isArray(spec) ? spec : {};
    var qr = spec.qr && typeof spec.qr === 'object' ? spec.qr : {};
    var technical = spec.technical && typeof spec.technical === 'object' ? spec.technical : {};
    var interfaceRules = spec.interface && typeof spec.interface === 'object' ? spec.interface : {};
    var title = text(spec.title, 'Новое микроприложение', 80);
    var type = choice(spec.type, TYPES, 'interactive');
    return {
      schemaVersion: '0.1',
      id: slug(spec.id || title, 'microapp'),
      title: title,
      type: type,
      difficulty: type === 'game' ? integer(spec.difficulty, 1, 5, 3) : spec.difficulty == null ? null : integer(spec.difficulty, 1, 5, 3),
      qr: {
        encoding: choice(qr.encoding, ENCODINGS, 'base64'),
        ecc: choice(qr.ecc, ECC_LEVELS, 'M')
      },
      technical: {
        singleHtmlFile: bool(technical.singleHtmlFile, true),
        externalResources: bool(technical.externalResources, false),
        networkRequests: bool(technical.networkRequests, false),
        requiredViewport: bool(technical.requiredViewport, true)
      },
      interface: {
        touchControls: bool(interfaceRules.touchControls, true),
        noHorizontalScroll: bool(interfaceRules.noHorizontalScroll, true),
        noVerticalScroll: bool(interfaceRules.noVerticalScroll, true),
        minTouchTargetPx: interfaceRules.minTouchTargetPx == null || interfaceRules.minTouchTargetPx === '' ? null : integer(interfaceRules.minTouchTargetPx, 24, 96, 44),
        minControlGapPx: interfaceRules.minControlGapPx == null || interfaceRules.minControlGapPx === '' ? null : integer(interfaceRules.minControlGapPx, 0, 32, 8),
        requireControlLabels: typeof interfaceRules.requireControlLabels === 'boolean' ? interfaceRules.requireControlLabels : null
      }
    };
  }

  function build(input) {
    var config = normalize(input);
    var interfaceRules = {
      touchControls: config.interface.touchControls,
      noHorizontalScroll: config.interface.noHorizontalScroll,
      noVerticalScroll: config.interface.noVerticalScroll
    };
    if (config.interface.minTouchTargetPx != null) interfaceRules.minTouchTargetPx = config.interface.minTouchTargetPx;
    if (config.interface.minControlGapPx != null) interfaceRules.minControlGapPx = config.interface.minControlGapPx;
    if (config.interface.requireControlLabels != null) interfaceRules.requireControlLabels = config.interface.requireControlLabels;
    var result = {
      schemaVersion: '0.1', id: config.id, title: config.title, type: config.type,
      qr: config.qr,
      technical: config.technical,
      interface: interfaceRules
    };
    if (config.difficulty != null) result.difficulty = config.difficulty;
    return result;
  }

  return {
    TYPES: TYPES.slice(),
    slug: slug,
    normalize: normalize,
    build: build
  };
});
