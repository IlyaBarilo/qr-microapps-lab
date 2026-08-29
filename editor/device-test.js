(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QRMicroappsDeviceTest = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CARD_WIDTH_MM = 85.60;
  var CARD_HEIGHT_MM = 53.98;
  var DEFAULT_CSS_PX_PER_MM = 96 / 25.4;
  var STORAGE_KEY = 'qr-microapps-lab-screen-calibration';
  var REPOSITORY_URL = 'https://github.com/IlyaBarilo/qr-microapps-lab';
  var PIXEL_PRESETS = [256, 384, 512, 768, 1024];
  var MM_PRESETS = [35, 45, 55, 70];

  function byteLength(value) {
    value = String(value || '');
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(value).length;
    if (typeof Buffer !== 'undefined') return Buffer.byteLength(value, 'utf8');
    return unescape(encodeURIComponent(value)).length;
  }

  function encodeBase64(value) {
    value = String(value || '');
    if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(value)));
    return Buffer.from(value, 'utf8').toString('base64');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function formatPrintTimestamp(value) {
    var date = new Date(value == null ? Date.now() : value);
    if (Number.isNaN(date.getTime())) return '';
    var two = function (part) { return String(part).padStart(2, '0'); };
    return two(date.getDate()) + '.' + two(date.getMonth() + 1) + '.' + date.getFullYear() + ' ' + two(date.getHours()) + ':' + two(date.getMinutes()) + ':' + two(date.getSeconds());
  }

  function makeUrlPayload(id, targetBytes) {
    var prefix = REPOSITORY_URL + '#qr-device-test-' + id + '-';
    return prefix + 'A'.repeat(Math.max(0, targetBytes - byteLength(prefix)));
  }

  function makeHtmlDataUrl(html) {
    return 'data:text/html;charset=utf-8;base64,' + encodeBase64(String(html || ''));
  }

  function item(id, title, purpose, payload, ecc, printMm, type, moduleMm) {
    return {
      id: id,
      title: title,
      purpose: purpose,
      payload: payload,
      payloadBytes: byteLength(payload),
      ecc: ecc,
      quietZone: 4,
      printMm: printMm,
      moduleMm: moduleMm || 0,
      type: type
    };
  }

  function createOverviewPage(id, letter, codePrefix, simplePayload, brickPayload) {
    return {
      id: id,
      letter: letter,
      number: letter,
      title: id === 'quick' ? 'Быстрый отдельный тест' : 'Ссылки и автономные игры',
      description: 'GitHub-ссылки и неизменённые встроенные игры при печатном модуле около 0,50 мм',
      items: [
        item(codePrefix + '1', 'Репозиторий', 'Прямая ссылка на QR Microapps Lab', REPOSITORY_URL, 'M', 0, 'URL', 0.50),
        item(codePrefix + '2', 'Репозиторий · плотный URL', 'Ссылка той же длины, что QR игры «Разбей блоки»', makeUrlPayload(codePrefix + '2', byteLength(brickPayload)), 'M', 0, 'URL', 0.50),
        item(codePrefix + '3', 'Игра «ИТ-мини-тест»', 'Встроенная игра без изменений', simplePayload, 'M', 0, 'DATA', 0.50),
        item(codePrefix + '4', 'Игра «Разбей блоки»', 'Встроенная игра без изменений', brickPayload, 'M', 0, 'DATA', 0.50)
      ]
    };
  }

  function createTestSuite(content) {
    content = content || {};
    if (!content.simpleHtml || !content.brickHtml) throw new Error('Не найдены встроенные игры для тестовых QR.');
    var simpleHtml = String(content.simpleHtml);
    var brickHtml = String(content.brickHtml);
    var simplePayload = makeHtmlDataUrl(simpleHtml);
    var brickPayload = makeHtmlDataUrl(brickHtml);
    if (byteLength(simplePayload) > 2331 || byteLength(brickPayload) > 2331) throw new Error('Встроенная тестовая игра больше вместимости QR с коррекцией M.');

    var quick = createOverviewPage('quick', 'Q', 'Q', simplePayload, brickPayload);
    var overview = createOverviewPage('overview', 'A', 'A', simplePayload, brickPayload);
    var brickBytes = byteLength(brickPayload);

    var threshold = {
      id: 'threshold',
      letter: 'B',
      number: 'B',
      title: 'Порог печати игры «Разбей блоки»',
      description: 'Один и тот же неизменённый data: URL, размер каждого модуля от 0,50 до 0,25 мм',
      items: [0.50, 0.40, 0.32, 0.25].map(function (moduleMm, index) {
        return item('B' + (index + 1), '«Разбей блоки» · модуль ' + moduleMm.toFixed(2).replace('.', ',') + ' мм', brickBytes + ' байт · ECC M', brickPayload, 'M', 0, 'DATA', moduleMm);
      })
    };

    var correctionPayload = makeUrlPayload('C', 800);
    var correction = {
      id: 'correction',
      letter: 'C',
      number: 'C',
      title: 'Коррекция ошибок',
      description: 'Одна GitHub-ссылка и модуль 0,45 мм, разные уровни L, M, Q и H',
      items: ['L', 'M', 'Q', 'H'].map(function (ecc, index) {
        return item('C' + (index + 1), 'Коррекция ' + ecc, 'GitHub URL · 800 байт · модуль 0,45 мм', correctionPayload, ecc, 0, 'URL', 0.45);
      })
    };

    return { quick: [quick], full: [overview, threshold, correction] };
  }

  function calculateCalibration(cardCssWidth, devicePixelRatio) {
    var width = Math.max(1, Number(cardCssWidth) || 1);
    var dpr = Math.max(0.25, Number(devicePixelRatio) || 1);
    var cssPxPerMm = width / CARD_WIDTH_MM;
    return {
      cardCssWidth: width,
      cssPxPerMm: cssPxPerMm,
      cssPpi: cssPxPerMm * 25.4,
      devicePxPerMm: cssPxPerMm * dpr,
      devicePpi: cssPxPerMm * 25.4 * dpr,
      devicePixelRatio: dpr
    };
  }

  function classifyModulePixels(modulePixels) {
    if (modulePixels >= 4) return { id: 'good', label: 'Хороший запас', detail: 'Не менее 4 пикселей экрана на модуль.' };
    if (modulePixels >= 3) return { id: 'warn', label: 'Пограничный режим', detail: '3 пикселя экрана на модуль; нужна проверка камерой.' };
    return { id: 'bad', label: 'Слишком мелко', detail: 'Меньше 3 пикселей экрана на модуль.' };
  }

  function calculateScreenRender(modules, quietZone, requestedCssSize, devicePixelRatio, cssPxPerMm) {
    var totalModules = Math.max(1, Number(modules) + Math.max(0, Number(quietZone) || 0) * 2);
    var dpr = Math.max(0.25, Number(devicePixelRatio) || 1);
    var targetCss = Math.max(1, Number(requestedCssSize) || 1);
    var modulePixels = Math.max(1, Math.round(targetCss * dpr / totalModules));
    var backingSize = totalModules * modulePixels;
    var cssSize = backingSize / dpr;
    var scale = Math.max(0.01, Number(cssPxPerMm) || DEFAULT_CSS_PX_PER_MM);
    return {
      totalModules: totalModules,
      modulePixels: modulePixels,
      backingSize: backingSize,
      cssSize: cssSize,
      physicalMm: cssSize / scale,
      quality: classifyModulePixels(modulePixels)
    };
  }

  function calculateScreenCapacity(modules, quietZone, availableCssSize, devicePixelRatio) {
    var totalModules = Math.max(1, Number(modules) + Math.max(0, Number(quietZone) || 0) * 2);
    var dpr = Math.max(0.25, Number(devicePixelRatio) || 1);
    var modulePixels = Math.max(0, Math.floor(Math.max(0, Number(availableCssSize) || 0) * dpr / totalModules));
    return {
      totalModules: totalModules,
      modulePixels: modulePixels,
      backingSize: totalModules * modulePixels,
      cssSize: totalModules * modulePixels / dpr
    };
  }

  function calculatePrintGeometry(modules, quietZone, targetModuleMm, minimumSizeMm) {
    var totalModules = Math.max(1, Number(modules) + Math.max(0, Number(quietZone) || 0) * 2);
    var target = Math.max(0.01, Number(targetModuleMm) || 0.01);
    var sizeMm = Math.max(Math.max(0, Number(minimumSizeMm) || 0), totalModules * target);
    var moduleMm = sizeMm / totalModules;
    return {
      totalModules: totalModules,
      sizeMm: sizeMm,
      moduleMm: moduleMm,
      printerDots300: moduleMm * 300 / 25.4,
      printerDots600: moduleMm * 600 / 25.4
    };
  }

  function createQrModel(QRCodeConstructor, payload, ecc, documentObject) {
    var holder = documentObject.createElement('div');
    holder.hidden = true;
    documentObject.body.appendChild(holder);
    var instance;
    try {
      instance = new QRCodeConstructor(holder, {
        text: payload,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCodeConstructor.CorrectLevel[ecc]
      });
    } finally { holder.remove(); }
    if (!instance || !instance._oQRCode) throw new Error('QR-кодировщик не вернул матрицу.');
    return instance._oQRCode;
  }

  function drawModel(canvas, model, quietZone, modulePixels) {
    var modules = model.getModuleCount();
    var quiet = Math.max(0, Number(quietZone) || 0);
    var scale = Math.max(1, Math.round(Number(modulePixels) || 1));
    var size = (modules + quiet * 2) * scale;
    canvas.width = size;
    canvas.height = size;
    var context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);
    context.fillStyle = '#000000';
    for (var row = 0; row < modules; row++) {
      for (var column = 0; column < modules; column++) {
        if (model.isDark(row, column)) context.fillRect((column + quiet) * scale, (row + quiet) * scale, scale, scale);
      }
    }
    return { modules: modules, version: (modules - 17) / 4, totalModules: modules + quiet * 2, pixels: size };
  }

  function createController(options) {
    options = options || {};
    var documentObject = options.document || document;
    var windowObject = options.window || window;
    var QRCodeConstructor = options.QRCode || windowObject.QRCode;
    var getCurrent = typeof options.getCurrent === 'function' ? options.getCurrent : function () { return {}; };
    var $ = function (id) { return documentObject.getElementById(id); };
    var elements = {
      overlay: $('device-test-overlay'), dialog: documentObject.querySelector('.device-test-dialog'), pages: $('device-test-pages'), pagesView: $('device-test-pages-view'), screenView: $('device-test-screen-view'),
      pagesTab: $('device-test-pages-tab'), screenTab: $('device-test-screen-tab'), set: $('device-test-set'), close: $('device-test-close'), print: $('device-test-print'),
      openQuick: $('open-quick-device-test'), openFull: $('open-full-device-test'), screenCode: $('device-screen-code'), prev: $('device-screen-prev'), next: $('device-screen-next'),
      pixelPresets: $('device-screen-pixel-presets'), mmPresets: $('device-screen-mm-presets'), cardRuler: $('device-card-ruler'), cardWidth: $('device-card-width'),
      cardWidthOutput: $('device-card-width-output'), calibrationSave: $('device-calibration-save'), calibrationReset: $('device-calibration-reset'), calibrationResult: $('device-calibration-result'),
      screenStage: $('device-screen-stage'), screenCanvas: $('device-screen-canvas'), screenCaption: $('device-screen-caption'), screenOnly: $('device-screen-only'), screenOnlyExit: $('device-screen-only-exit'),
      qrMetrics: $('device-screen-qr-metrics'), cssSize: $('device-screen-css-size'), bufferSize: $('device-screen-buffer-size'), physicalSize: $('device-screen-physical-size'),
      modulePixels: $('device-screen-module-pixels'), capacity: $('device-screen-capacity'), quality: $('device-screen-quality')
    };
    if (!elements.overlay || !QRCodeConstructor) return null;

    var state = {
      set: 'quick', view: 'pages', pages: [], items: [], selectedId: '', targetUnit: 'px', targetValue: 512,
      calibration: null, modelCache: {}, lastFocus: null
    };

    function formatDecimal(value, digits) {
      return Number(value).toFixed(digits == null ? 1 : digits).replace('.', ',');
    }

    function loadCalibration() {
      try {
        var saved = JSON.parse(windowObject.localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved && saved.cardCssWidth >= 180 && saved.cardCssWidth <= 700) return calculateCalibration(saved.cardCssWidth, windowObject.devicePixelRatio || 1);
      } catch (error) { /* Локальный файл может запрещать хранилище. */ }
      return null;
    }

    function saveCalibration(calibration) {
      try { windowObject.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cardCssWidth: calibration.cardCssWidth })); }
      catch (error) { /* Локальный файл может запрещать хранилище. */ }
    }

    function clearSavedCalibration() {
      try { windowObject.localStorage.removeItem(STORAGE_KEY); }
      catch (error) { /* Локальный файл может запрещать хранилище. */ }
    }

    function getModel(testItem) {
      var key = testItem.id + '|' + testItem.ecc + '|' + testItem.payloadBytes;
      if (!state.modelCache[key]) state.modelCache[key] = createQrModel(QRCodeConstructor, testItem.payload, testItem.ecc, documentObject);
      return state.modelCache[key];
    }

    function currentCssPxPerMm() {
      return state.calibration ? state.calibration.cssPxPerMm : DEFAULT_CSS_PX_PER_MM;
    }

    function setView(view) {
      state.view = view === 'screen' ? 'screen' : 'pages';
      var screen = state.view === 'screen';
      elements.pagesView.hidden = screen;
      elements.screenView.hidden = !screen;
      elements.pagesTab.classList.toggle('active', !screen);
      elements.screenTab.classList.toggle('active', screen);
      elements.pagesTab.setAttribute('aria-selected', String(!screen));
      elements.screenTab.setAttribute('aria-selected', String(screen));
      elements.print.disabled = screen;
      if (screen) windowObject.requestAnimationFrame(renderScreen);
    }

    function flattenItems(pages) {
      var result = [];
      pages.forEach(function (page) { page.items.forEach(function (testItem) { result.push(testItem); }); });
      return result;
    }

    function renderPage(testPage) {
      var page = documentObject.createElement('article');
      page.className = 'device-print-page device-print-page-' + testPage.id;
      page.dataset.pageNumber = String(testPage.number);
      var head = documentObject.createElement('header');
      head.className = 'device-print-head';
      head.innerHTML = '<div><b>QR Microapps Lab · тест устройства</b><h3>Лист ' + escapeHtml(testPage.letter) + ' · ' + escapeHtml(testPage.title) + '</h3><p>' + escapeHtml(testPage.description) + '</p></div><div class="device-print-fields">Устройство: ____________________<br>Камера / ОС: ___________________<br>Печать: <span data-print-timestamp></span></div>';
      var grid = documentObject.createElement('div');
      grid.className = 'device-print-grid';
      testPage.items.forEach(function (testItem) {
        var model = getModel(testItem);
        var modules = model.getModuleCount();
        var version = (modules - 17) / 4;
        var printGeometry = calculatePrintGeometry(modules, testItem.quietZone, testItem.moduleMm || testItem.printMm / (modules + testItem.quietZone * 2), 30);
        var printMm = printGeometry.sizeMm;
        var card = documentObject.createElement('button');
        card.type = 'button';
        card.className = 'device-print-code';
        card.dataset.testCodeId = testItem.id;
        card.setAttribute('aria-label', 'Открыть ' + testItem.id + ' на экране');
        var canvas = documentObject.createElement('canvas');
        canvas.style.width = printMm + 'mm';
        canvas.style.height = printMm + 'mm';
        drawModel(canvas, model, testItem.quietZone, 8);
        var copy = documentObject.createElement('div');
        copy.className = 'device-print-code-copy';
        copy.innerHTML = '<strong>' + escapeHtml(testItem.id) + ' · ' + escapeHtml(testItem.title) + '</strong><span>' + escapeHtml(testItem.type) + ' · ' + testItem.payloadBytes + ' Б · QR v' + version + ' · ECC ' + escapeHtml(testItem.ecc) + '</span><small>' + formatDecimal(printMm, 1) + ' мм · модуль ' + formatDecimal(printGeometry.moduleMm, 2) + ' мм</small><small>' + formatDecimal(printGeometry.printerDots300, 1) + ' точки при 300 dpi · ' + formatDecimal(printGeometry.printerDots600, 1) + ' при 600 dpi</small><small>' + escapeHtml(testItem.purpose) + '</small><em>□ найден &nbsp; □ предложено действие &nbsp; □ открыто</em>';
        card.append(canvas, copy);
        grid.appendChild(card);
      });
      var footer = documentObject.createElement('footer');
      footer.className = 'device-print-footer';
      footer.innerHTML = '<div><span>Контроль 50 мм</span><i></i></div><p>Печать: масштаб 100%, без «Вписать в страницу». Контрольные URL ведут на github.com/IlyaBarilo/qr-microapps-lab; длинный фрагмент не меняет страницу репозитория.</p>';
      page.append(head, grid, footer);
      return page;
    }

    function populateScreenCodes() {
      elements.screenCode.replaceChildren();
      state.items.forEach(function (testItem) {
        var option = documentObject.createElement('option');
        option.value = testItem.id;
        option.textContent = testItem.id + ' · ' + testItem.title;
        elements.screenCode.appendChild(option);
      });
      if (!state.items.some(function (testItem) { return testItem.id === state.selectedId; })) state.selectedId = state.items[0] ? state.items[0].id : '';
      elements.screenCode.value = state.selectedId;
    }

    function renderPages() {
      elements.pages.replaceChildren();
      state.pages.forEach(function (testPage) { elements.pages.appendChild(renderPage(testPage)); });
      updatePrintTimestamps();
      populateScreenCodes();
    }

    function updatePrintTimestamps() {
      var timestamp = formatPrintTimestamp(new Date());
      elements.pages.querySelectorAll('[data-print-timestamp]').forEach(function (output) { output.textContent = timestamp; });
      return timestamp;
    }

    function selectSet(setName) {
      state.set = setName === 'full' ? 'full' : 'quick';
      elements.set.value = state.set;
      var suite = createTestSuite(getCurrent());
      state.pages = suite[state.set];
      state.items = flattenItems(state.pages);
      state.modelCache = {};
      renderPages();
      if (state.view === 'screen') renderScreen();
    }

    function selectedItem() {
      return state.items.find(function (testItem) { return testItem.id === state.selectedId; }) || state.items[0];
    }

    function renderCalibration() {
      var width = Number(elements.cardWidth.value) || 324;
      var live = calculateCalibration(width, windowObject.devicePixelRatio || 1);
      elements.cardRuler.style.width = width + 'px';
      elements.cardRuler.style.height = width * CARD_HEIGHT_MM / CARD_WIDTH_MM + 'px';
      elements.cardWidthOutput.value = Math.round(width) + ' px';
      if (state.calibration) {
        elements.calibrationResult.className = 'device-calibration-result good';
        elements.calibrationResult.textContent = 'Сохранено: ' + formatDecimal(state.calibration.cssPxPerMm, 2) + ' CSS px/мм · ≈' + Math.round(state.calibration.cssPpi) + ' CSS ppi · DPR ' + formatDecimal(windowObject.devicePixelRatio || 1, 2) + '.';
      } else {
        elements.calibrationResult.className = 'device-calibration-result';
        elements.calibrationResult.textContent = 'Пока не сохранено. Текущее совпадение дало бы ' + formatDecimal(live.cssPxPerMm, 2) + ' CSS px/мм; физические размеры QR сейчас приблизительные.';
      }
    }

    function availableStageSize() {
      var width = Math.max(0, elements.screenStage.clientWidth - 32);
      var height = Math.max(0, elements.screenStage.clientHeight - (elements.overlay.classList.contains('qr-only') ? 32 : 96));
      return Math.min(width, height);
    }

    function renderScreen() {
      var testItem = selectedItem();
      if (!testItem) return;
      state.selectedId = testItem.id;
      elements.screenCode.value = testItem.id;
      var model = getModel(testItem);
      var modules = model.getModuleCount();
      var dpr = windowObject.devicePixelRatio || 1;
      var pxPerMm = currentCssPxPerMm();
      var requestedCss = state.targetUnit === 'mm' ? state.targetValue * pxPerMm : state.targetValue;
      var metrics = calculateScreenRender(modules, testItem.quietZone, requestedCss, dpr, pxPerMm);
      var drawing = drawModel(elements.screenCanvas, model, testItem.quietZone, metrics.modulePixels);
      elements.screenCanvas.style.width = metrics.cssSize + 'px';
      elements.screenCanvas.style.height = metrics.cssSize + 'px';
      elements.screenCaption.innerHTML = '<strong>' + escapeHtml(testItem.id) + ' · ' + escapeHtml(testItem.title) + '</strong><span>' + testItem.payloadBytes + ' Б · QR v' + drawing.version + ' · ECC ' + escapeHtml(testItem.ecc) + '</span>';
      elements.qrMetrics.textContent = 'v' + drawing.version + ' · ' + modules + '×' + modules + ' + поля = ' + metrics.totalModules;
      elements.cssSize.textContent = Math.round(metrics.cssSize) + ' × ' + Math.round(metrics.cssSize) + ' CSS px';
      elements.bufferSize.textContent = metrics.backingSize + ' × ' + metrics.backingSize + ' px';
      elements.physicalSize.textContent = (state.calibration ? '' : '≈') + formatDecimal(metrics.physicalMm, 1) + ' × ' + formatDecimal(metrics.physicalMm, 1) + ' мм';
      elements.modulePixels.textContent = metrics.modulePixels + ' px/модуль';
      var capacity = calculateScreenCapacity(modules, testItem.quietZone, availableStageSize(), dpr);
      elements.capacity.textContent = capacity.modulePixels ? 'до ' + capacity.modulePixels + ' px/модуль без прокрутки' : 'код целиком не помещается';
      elements.quality.className = 'device-screen-quality ' + metrics.quality.id;
      elements.quality.innerHTML = '<strong>' + metrics.quality.label + '</strong><span>' + metrics.quality.detail + (metrics.cssSize > availableStageSize() ? ' Выбранный размер больше доступной области экрана.' : '') + '</span>';
      Array.prototype.forEach.call(elements.pixelPresets.children, function (button) { button.classList.toggle('active', state.targetUnit === 'px' && Number(button.dataset.value) === state.targetValue); });
      Array.prototype.forEach.call(elements.mmPresets.children, function (button) { button.classList.toggle('active', state.targetUnit === 'mm' && Number(button.dataset.value) === state.targetValue); });
    }

    function createPresetButtons(holder, values, unit) {
      values.forEach(function (value) {
        var button = documentObject.createElement('button');
        button.type = 'button';
        button.className = 'device-screen-preset';
        button.dataset.value = String(value);
        button.textContent = value + ' ' + unit;
        button.addEventListener('click', function () {
          state.targetUnit = unit;
          state.targetValue = value;
          renderScreen();
        });
        holder.appendChild(button);
      });
    }

    function changeSelection(offset) {
      var index = state.items.findIndex(function (testItem) { return testItem.id === state.selectedId; });
      if (index < 0) index = 0;
      index = (index + offset + state.items.length) % state.items.length;
      state.selectedId = state.items[index].id;
      renderScreen();
    }

    function setQrOnly(enabled) {
      elements.overlay.classList.toggle('qr-only', !!enabled);
      elements.screenOnlyExit.hidden = !enabled;
      documentObject.body.classList.toggle('device-code-focus-open', !!enabled);
      windowObject.requestAnimationFrame(renderScreen);
    }

    function open(setName) {
      state.lastFocus = documentObject.activeElement;
      elements.overlay.hidden = false;
      documentObject.body.classList.add('device-test-open');
      selectSet(setName);
      setView('pages');
      elements.close.focus();
    }

    function close() {
      setQrOnly(false);
      elements.overlay.hidden = true;
      documentObject.body.classList.remove('device-test-open');
      if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus();
    }

    createPresetButtons(elements.pixelPresets, PIXEL_PRESETS, 'px');
    createPresetButtons(elements.mmPresets, MM_PRESETS, 'mm');
    state.calibration = loadCalibration();
    elements.cardWidth.value = String(Math.round(state.calibration ? state.calibration.cardCssWidth : CARD_WIDTH_MM * DEFAULT_CSS_PX_PER_MM));
    renderCalibration();

    elements.openQuick.addEventListener('click', function () { open('quick'); });
    elements.openFull.addEventListener('click', function () { open('full'); });
    elements.close.addEventListener('click', close);
    elements.pagesTab.addEventListener('click', function () { setView('pages'); });
    elements.screenTab.addEventListener('click', function () { setView('screen'); });
    elements.set.addEventListener('change', function () { selectSet(elements.set.value); });
    elements.print.addEventListener('click', function () { setView('pages'); updatePrintTimestamps(); windowObject.requestAnimationFrame(function () { windowObject.print(); }); });
    elements.pages.addEventListener('click', function (event) {
      var card = event.target.closest('[data-test-code-id]');
      if (!card) return;
      state.selectedId = card.dataset.testCodeId;
      setView('screen');
    });
    elements.screenCode.addEventListener('change', function () { state.selectedId = elements.screenCode.value; renderScreen(); });
    elements.prev.addEventListener('click', function () { changeSelection(-1); });
    elements.next.addEventListener('click', function () { changeSelection(1); });
    elements.cardWidth.addEventListener('input', function () { state.calibration = null; renderCalibration(); });
    elements.calibrationSave.addEventListener('click', function () {
      state.calibration = calculateCalibration(elements.cardWidth.value, windowObject.devicePixelRatio || 1);
      saveCalibration(state.calibration);
      renderCalibration();
      renderScreen();
    });
    elements.calibrationReset.addEventListener('click', function () {
      state.calibration = null;
      clearSavedCalibration();
      elements.cardWidth.value = String(Math.round(CARD_WIDTH_MM * DEFAULT_CSS_PX_PER_MM));
      renderCalibration();
      renderScreen();
    });
    elements.screenOnly.addEventListener('click', function () { setQrOnly(true); });
    elements.screenOnlyExit.addEventListener('click', function () { setQrOnly(false); });
    windowObject.addEventListener('resize', function () { if (!elements.overlay.hidden && state.view === 'screen') renderScreen(); });
    windowObject.addEventListener('beforeprint', updatePrintTimestamps);
    documentObject.addEventListener('keydown', function (event) {
      if (elements.overlay.hidden || event.key !== 'Escape') return;
      if (elements.overlay.classList.contains('qr-only')) setQrOnly(false);
      else close();
    });

    return { open: open, close: close, selectSet: selectSet, setView: setView, renderScreen: renderScreen, state: state };
  }

  return {
    CARD_WIDTH_MM: CARD_WIDTH_MM,
    CARD_HEIGHT_MM: CARD_HEIGHT_MM,
    DEFAULT_CSS_PX_PER_MM: DEFAULT_CSS_PX_PER_MM,
    formatPrintTimestamp: formatPrintTimestamp,
    createTestSuite: createTestSuite,
    calculateCalibration: calculateCalibration,
    calculateScreenRender: calculateScreenRender,
    calculateScreenCapacity: calculateScreenCapacity,
    calculatePrintGeometry: calculatePrintGeometry,
    classifyModulePixels: classifyModulePixels,
    drawModel: drawModel,
    createController: createController
  };
});
