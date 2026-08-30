(function () {
  'use strict';

  var core = window.QRMicroappsCore;
  var simpleBuilder = window.QRMicroappsSimple;
  var specBuilder = window.QRMicroappsSpecBuilder;
  var historyApi = window.QRMicroappsHistory;
  var projectApi = window.QRMicroappsProject;
  var comparisonApi = window.QRMicroappsComparison;
  var sample = window.QRMicroappsSample;
  var deviceTestApi = window.QRMicroappsDeviceTest;
  var $ = function (id) { return document.getElementById(id); };
  var elements = {
    themeToggle: $('theme-toggle'), themeToggleIcon: $('theme-toggle-icon'), themeToggleLabel: $('theme-toggle-label'),
    source: $('source'), spec: $('spec'), dataUrl: $('data-url'), encoding: $('encoding'), ecc: $('ecc'),
    moduleScale: $('module-scale'), quietZone: $('quiet-zone'), status: $('status'), canvas: $('qr-canvas'),
    placeholder: $('qr-placeholder'), qrZoom: $('qr-zoom'), qrZoomIcon: $('qr-zoom-icon'), htmlBytes: $('html-bytes'), urlBytes: $('url-bytes'),
    qrVersion: $('qr-version'), qrMatrix: $('qr-matrix'), qrMask: $('qr-mask'), qrReserve: $('qr-reserve'), qrReserveLabel: $('qr-reserve-label'),
    qrLOption: $('qr-l-option'), qrLOptionLabel: $('qr-l-option-label'), qrLReserve: $('qr-l-reserve'),
    qrCorrectionCard: $('qr-correction-card'), qrCorrectionLabel: $('qr-correction-label'), qrCorrectionValue: $('qr-correction-value'), qrCorrectionNote: $('qr-correction-note'), checksum: $('checksum'),
    roundtripPill: $('roundtrip-pill'), roundtripCard: $('roundtrip-card'), roundtripIcon: $('roundtrip-icon'),
    roundtripTitle: $('roundtrip-title'), roundtripDetail: $('roundtrip-detail'), validationSummary: $('validation-summary'),
    validationRemarks: $('validation-remarks'), validationToggle: $('validation-toggle'), validationDetails: $('validation-details'),
    validationList: $('validation-list'), preview: $('preview'), device: $('device'), runtimeLog: $('runtime-log'), previewDifficulty: $('preview-difficulty'),
    previewPreset: $('preview-preset'), previewWidth: $('preview-width'), previewHeight: $('preview-height'),
    downloadPng: $('download-png'), copyUrl: $('copy-url'), downloadHtml: $('download-html'), qrOpenHelp: $('qr-open-help'),
    downloadReport: $('download-report'), exampleSelect: $('example-select'), fileActions: $('file-actions'),
    sampleDocumentationOpen: $('sample-documentation-open'), sampleDocumentationOverlay: $('sample-documentation-overlay'),
    sampleDocumentationTitle: $('sample-documentation-title'), sampleDocumentationContent: $('sample-documentation-content'),
    sampleDocumentationClose: $('sample-documentation-close'),
    difficultyEditor: $('difficulty-editor'), difficultyVariableNote: $('difficulty-variable-note'),
    codeDifficulty: $('code-difficulty'), applyDifficulty: $('apply-difficulty'),
    codeEditor: $('code-editor'), simpleEditor: $('simple-editor'), modeSimple: $('mode-simple'), modeCode: $('mode-code'),
    buildButton: $('build'), clearButton: $('clear'), simpleTitle: $('simple-title'), simpleTheme: $('simple-theme'), simpleBackground: $('simple-background'),
    simpleCard: $('simple-card'), simpleAccent: $('simple-accent'), simpleSize: $('simple-size'),
    simpleQuestions: $('simple-questions'), simpleQuestionCount: $('simple-question-count'), simpleAddQuestion: $('simple-add-question'), sizeTotal: $('size-total'),
    sizeBreakdown: $('size-breakdown'), encodingCompare: $('encoding-compare'), optimizationHints: $('optimization-hints'),
    optimizationSummary: $('optimization-summary'), optimizationSaving: $('optimization-saving'), optimizationDetail: $('optimization-detail'),
    historySummary: $('history-summary'), iterationHistory: $('iteration-history'), downloadHistory: $('download-history'),
    clearHistory: $('clear-history'), projectFile: $('project-file'), downloadProject: $('download-project'),
    downloadSpec: $('download-spec'), downloadGameSpec: $('download-game-spec'), copyGameSpec: $('copy-game-spec'),
    specForm: $('spec-form'), specJsonEditor: $('spec-json-editor'),
    specModeForm: $('spec-mode-form'), specModeJson: $('spec-mode-json'), specTitleInput: $('spec-title-input'),
    specIdInput: $('spec-id-input'), specTypeInput: $('spec-type-input'), specSingleFileInput: $('spec-single-file-input'),
    specExternalInput: $('spec-external-input'), specNetworkInput: $('spec-network-input'),
    specViewportInput: $('spec-viewport-input'), specTouchInput: $('spec-touch-input'), specOverflowInput: $('spec-overflow-input'),
    specVerticalOverflowInput: $('spec-vertical-overflow-input'),
    specTouchSizeInput: $('spec-touch-size-input'), specGapInput: $('spec-gap-input'), specLabelsInput: $('spec-labels-input'),
    comparisonFiles: $('comparison-files'),
    addCurrentComparison: $('add-current-comparison'), downloadComparison: $('download-comparison'),
    clearComparison: $('clear-comparison'), comparisonSummary: $('comparison-summary'), comparisonList: $('comparison-list'),
    qrImportAnalysis: $('qr-import-analysis'), qrImportFile: $('qr-import-file'), importedQrVersion: $('imported-qr-version'),
    importedQrMatrix: $('imported-qr-matrix'), importedQrEcc: $('imported-qr-ecc'), importedQrMask: $('imported-qr-mask'),
    importedQrPayload: $('imported-qr-payload'), importedQrModes: $('imported-qr-modes'), importedQrImage: $('imported-qr-image'),
    importedQrModule: $('imported-qr-module'), importedQrMargin: $('imported-qr-margin'), importedQrPerspective: $('imported-qr-perspective'),
    importedQrContrast: $('imported-qr-contrast'), importedQrType: $('imported-qr-type'), importedQrObservations: $('imported-qr-observations'),
    importedQrData: $('imported-qr-data'), applyImportedQr: $('apply-imported-qr'), closeImportedQr: $('close-imported-qr'),
    qrEmulationNote: $('qr-emulation-note'), qrEmulationText: $('qr-emulation-text'), clearQrEmulation: $('clear-qr-emulation')
  };

  var state = {
    html: '', spec: null, dataUrl: '', qr: null, checks: [], runtime: null, checksum: null,
    roundtrip: null, report: null, sizeAnalysis: null, optimization: null, previewToken: '', previewHtml: '', runtimeMessages: [],
    iterations: [], comparisons: [], buildId: 0, mode: 'code', specEditorMode: 'form', importedQrProfile: null, qrEmulation: null,
    sampleDocumentationLastFocus: null
  };
  var simpleBuildTimer = 0;

  function getSavedTheme() {
    try {
      var theme = localStorage.getItem('qr-microapps-lab-theme');
      return theme === 'light' || theme === 'dark' ? theme : 'dark';
    } catch (error) { return 'dark'; }
  }

  function saveTheme(theme) {
    try { localStorage.setItem('qr-microapps-lab-theme', theme); } catch (error) { /* Локальный файл может запрещать хранилище. */ }
  }

  function applyTheme(theme, save) {
    var light = theme === 'light';
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    elements.themeToggle.setAttribute('aria-pressed', String(light));
    elements.themeToggleLabel.textContent = light ? 'Тёмная тема' : 'Светлая тема';
    elements.themeToggleIcon.textContent = light ? '☾' : '☀';
    elements.themeToggle.title = light ? 'Включить тёмную тему' : 'Включить светлую тему';
    elements.themeToggle.setAttribute('aria-label', elements.themeToggle.title);
    if (save) saveTheme(light ? 'light' : 'dark');
  }

  function setStatus(message, kind) {
    elements.status.textContent = message;
    elements.status.className = 'status' + (kind ? ' ' + kind : '');
  }

  function formatBytes(value) {
    return Number(value || 0).toLocaleString('ru-RU') + ' Б';
  }

  function formatDecimal(value, digits) {
    return Number(value).toFixed(digits == null ? 1 : digits).replace('.', ',');
  }

  function formatQrModes(modes) {
    var labels = { numeric: 'цифры', alphanumeric: 'алфавитно-цифровой', byte: 'байты', kanji: 'кандзи', eci: 'ECI' };
    return (modes || []).map(function (mode) { return labels[mode] || mode; }).join(', ') || 'не указаны';
  }

  function renderQrEmulation() {
    var profile = state.qrEmulation;
    elements.qrEmulationNote.hidden = !profile;
    if (!profile) {
      elements.qrEmulationText.textContent = '';
      return;
    }
    elements.qrEmulationText.textContent = 'Имитация загруженного QR: коррекция ' + profile.ecc + ', ' + profile.moduleScale + ' пикс./модуль, рамка ' + profile.quietZone + ' мод. Версия и маска будут рассчитаны заново.';
  }

  function clearQrEmulation(resetGeometry) {
    state.qrEmulation = null;
    if (resetGeometry) {
      elements.moduleScale.value = '6';
      elements.quietZone.value = '4';
    }
    renderQrEmulation();
  }

  function clearImportedQrAnalysis() {
    state.importedQrProfile = null;
    elements.qrImportAnalysis.hidden = true;
    elements.importedQrData.value = '';
  }

  function renderImportedQrAnalysis(profile, data) {
    state.importedQrProfile = profile;
    var geometry = profile.geometry || {};
    elements.qrImportFile.textContent = (profile.file.name || 'Изображение') + ' · ' + formatBytes(profile.file.bytes);
    elements.importedQrVersion.textContent = String(profile.version);
    elements.importedQrMatrix.textContent = profile.modules + '×' + profile.modules;
    elements.importedQrEcc.textContent = profile.ecc || 'не определена';
    elements.importedQrMask.textContent = profile.mask == null ? 'не определена' : String(profile.mask);
    elements.importedQrPayload.textContent = formatBytes(profile.payloadBytes);
    elements.importedQrModes.textContent = formatQrModes(profile.chunkModes);
    elements.importedQrImage.textContent = profile.file.width + '×' + profile.file.height + ' px';
    elements.importedQrModule.textContent = geometry.modulePixels == null ? 'не вычислен' : '≈' + formatDecimal(geometry.modulePixels, 1) + ' px';
    elements.importedQrMargin.textContent = geometry.marginModules == null
      ? 'не вычислено'
      : '≈' + formatDecimal(geometry.marginModules, 1) + ' мод. · ' + Math.round(geometry.marginPixels) + ' px';
    elements.importedQrPerspective.textContent = geometry.perspectivePercent == null ? 'не вычислена' : '≈' + formatDecimal(geometry.perspectivePercent, 1) + ' %';
    elements.importedQrContrast.textContent = profile.inverted ? 'инвертированный' : 'обычный';
    elements.importedQrType.textContent = profile.payload.label;
    elements.importedQrObservations.replaceChildren();
    (profile.observations || []).forEach(function (observation) {
      var item = document.createElement('li');
      item.className = observation.status || 'info';
      item.textContent = observation.text;
      elements.importedQrObservations.appendChild(item);
    });
    elements.importedQrData.value = String(data || '');
    elements.applyImportedQr.disabled = !profile.ecc;
    elements.qrImportAnalysis.hidden = false;
  }

  function applyImportedQrProfile() {
    var profile = state.importedQrProfile;
    if (!profile || !profile.ecc) return setStatus('Уровень коррекции загруженного QR не определён.', 'bad');
    state.qrEmulation = {
      ecc: profile.emulation.ecc,
      moduleScale: profile.emulation.moduleScale,
      quietZone: profile.emulation.quietZone,
      sourceFile: profile.file.name,
      sourceVersion: profile.version,
      sourceMask: profile.mask
    };
    elements.moduleScale.value = String(state.qrEmulation.moduleScale);
    elements.quietZone.value = String(state.qrEmulation.quietZone);
    renderQrEmulation();
    var controls = elements.qrEmulationNote.closest('details');
    if (controls) controls.open = true;
    setStatus('Параметры загруженного QR перенесены в генератор. Нажмите «Проверить и создать QR» для сравнения.', 'good');
  }

  function renderQrReserves(html, encoding, ecc, emulation) {
    var payloadBytes = core.byteLength(core.makeDataUrl(html, encoding));
    var currentLimit = core.getQrLimit(ecc);
    var currentReserve = currentLimit - payloadBytes;
    var lLimit = core.getQrLimit('L');
    var lReserve = lLimit - payloadBytes;
    var usingL = ecc === 'L';
    var mReduction = core.getReductionToFit(html, encoding, 'M');
    var needsMReduction = usingL && mReduction.payloadReduction > 0;
    var reductionValue = (mReduction.htmlReduction == null ? mReduction.payloadReduction : mReduction.htmlReduction) + ' Б';
    var reductionText = mReduction.htmlReduction == null
      ? 'сократите QR-нагрузку минимум на ' + formatBytes(mReduction.payloadReduction)
      : 'сократите HTML минимум на ' + formatBytes(mReduction.htmlReduction);
    elements.qrReserveLabel.textContent = 'Запас при ' + ecc;
    elements.qrReserve.textContent = (currentReserve >= 0 ? '+' : '') + currentReserve + ' Б';
    elements.qrReserve.title = 'Вместимость QR при коррекции ' + ecc + ': ' + currentLimit + ' Б.';
    elements.qrReserve.style.color = currentReserve < 0 ? 'var(--danger)' : usingL ? 'var(--warning)' : 'var(--accent)';
    elements.qrReserve.parentElement.classList.toggle('low-ecc', usingL);
    elements.qrLOption.hidden = false;
    elements.qrLOption.classList.toggle('recovery', needsMReduction);
    elements.qrLOptionLabel.textContent = needsMReduction ? 'Сократить для M' : 'Запас при L';
    elements.qrLReserve.textContent = needsMReduction ? reductionValue : (lReserve >= 0 ? '+' : '') + lReserve + ' Б';
    elements.qrLReserve.title = needsMReduction ? 'Минимальное сокращение для коррекции M.' : 'Вместимость QR при коррекции L: ' + lLimit + ' Б.';
    elements.qrLReserve.style.color = needsMReduction ? 'var(--warning)' : lReserve >= 0 ? 'var(--muted)' : 'var(--danger)';
    elements.qrCorrectionCard.className = 'correction-card ' + (lReserve < 0 ? 'danger' : usingL ? 'warning' : 'good');
    elements.qrCorrectionLabel.textContent = emulation && emulation.active ? 'Имитация параметров' : 'Автокоррекция QR';
    elements.qrCorrectionValue.textContent = ecc;
    elements.qrCorrectionNote.textContent = emulation && emulation.active
      ? emulation.eccApplied
        ? 'Применён уровень ' + ecc + ' из загруженного QR; версия и маска рассчитаны кодировщиком заново.'
        : 'Уровень ' + emulation.requestedEcc + ' не вместил текущую нагрузку; использован ' + ecc + '. Геометрия изображения сохранена.'
      : lReserve < 0
      ? 'Даже L не вмещает нагрузку — необходимо уменьшить HTML.'
      : usingL
        ? 'Устойчивость к повреждениям снижена; ' + reductionText + ', чтобы вернуться к M.'
        : 'Автоматически выбран M — рекомендуемый баланс вместимости и устойчивости.';
    return currentLimit;
  }

  function clearSizeAnalysis() {
    state.sizeAnalysis = null;
    state.optimization = null;
    elements.sizeTotal.textContent = '—';
    elements.optimizationSummary.hidden = true;
    elements.optimizationSummary.className = 'optimization-summary';
    elements.optimizationSaving.textContent = '—';
    elements.optimizationDetail.textContent = 'Исходный и итоговый размеры появятся после проверки.';
    elements.sizeBreakdown.innerHTML = '<p class="analysis-empty">Анализ появится после проверки.</p>';
    elements.encodingCompare.textContent = '';
    elements.optimizationHints.replaceChildren();
  }

  function renderSizeAnalysis(html, spec, encoding, ecc, optimization) {
    var analysis = core.analyzeSize(html, { spec: spec, encoding: encoding, ecc: ecc });
    state.sizeAnalysis = analysis;
    state.optimization = optimization || core.optimizeHtml(html);
    elements.sizeTotal.textContent = formatBytes(analysis.totalBytes);
    elements.optimizationSummary.hidden = false;
    elements.optimizationSummary.className = 'optimization-summary' + (state.optimization.savedBytes ? '' : ' unchanged');
    elements.optimizationSaving.textContent = state.optimization.savedBytes ? '−' + formatBytes(state.optimization.savedBytes) + ' · ' + state.optimization.savedPercent.toFixed(1).replace('.', ',') + ' %' : '0 Б · уже компактно';
    elements.optimizationDetail.textContent = 'Исходный HTML: ' + formatBytes(state.optimization.originalBytes) + ' → после оптимизации: ' + formatBytes(state.optimization.optimizedBytes) + (state.optimization.commentsRemoved ? ' · удалено комментариев: ' + state.optimization.commentsRemoved : '');
    elements.sizeBreakdown.replaceChildren();
    analysis.categories.forEach(function (category) {
      var row = document.createElement('div');
      row.className = 'size-row';
      var label = document.createElement('span');
      label.textContent = category.label;
      var value = document.createElement('strong');
      value.textContent = formatBytes(category.bytes) + ' · ' + Math.round(category.percent) + ' %';
      var track = document.createElement('span');
      track.className = 'size-track';
      var fill = document.createElement('span');
      fill.className = 'size-fill ' + category.id;
      fill.style.width = Math.max(0.5, category.percent) + '%';
      track.appendChild(fill);
      row.append(label, value, track);
      elements.sizeBreakdown.appendChild(row);
    });
    var payload = analysis.payload;
    elements.encodingCompare.textContent = 'QR-нагрузка Base64: ' + formatBytes(payload.base64Bytes) + (payload.effectiveLimit ? ' · лимит: ' + formatBytes(payload.effectiveLimit) : '');
    elements.optimizationHints.replaceChildren();
    analysis.hints.forEach(function (item) {
      if (item.id === 'encoding') return;
      var card = document.createElement('article');
      card.className = 'optimization-hint ' + item.level;
      var title = document.createElement('strong');
      title.textContent = item.title;
      var message = document.createElement('p');
      message.textContent = item.message;
      card.append(title, message);
      elements.optimizationHints.appendChild(card);
    });
    return analysis;
  }

  function formatDelta(value, suffix) {
    value = Number(value || 0);
    return (value > 0 ? '+' : '') + value.toLocaleString('ru-RU') + (suffix || '');
  }

  function historyBadge(text, kind) {
    var badge = document.createElement('span');
    badge.className = 'badge ' + (kind || 'muted');
    badge.textContent = text;
    return badge;
  }

  function renderHistory() {
    var items = state.iterations;
    elements.downloadHistory.disabled = !items.length;
    elements.clearHistory.disabled = !items.length;
    elements.historySummary.replaceChildren();
    elements.iterationHistory.replaceChildren();
    if (!items.length) {
      elements.historySummary.appendChild(historyBadge('Пока одна сборка или история пуста', 'muted'));
      var empty = document.createElement('p');
      empty.className = 'analysis-empty';
      empty.textContent = 'Успешные сборки появятся здесь автоматически.';
      elements.iterationHistory.appendChild(empty);
      return;
    }

    var latest = items[items.length - 1];
    var previous = historyApi.previousFor(items, latest);
    var latestDelta = historyApi.compare(previous, latest);
    elements.historySummary.appendChild(historyBadge('Сборок в сессии: ' + items.length, 'muted'));
    if (latestDelta) {
      elements.historySummary.appendChild(historyBadge('HTML ' + formatDelta(latestDelta.htmlBytes, ' Б'), 'muted'));
      elements.historySummary.appendChild(historyBadge('Нагрузка ' + formatDelta(latestDelta.dataUrlBytes, ' Б'), 'muted'));
      elements.historySummary.appendChild(historyBadge('Нарушения ' + formatDelta(latestDelta.fail), latestDelta.fail > 0 ? 'fail' : latestDelta.fail < 0 ? 'good' : 'muted'));
    } else elements.historySummary.appendChild(historyBadge('Первая сборка «' + latest.title + '»', 'muted'));

    items.slice().reverse().forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'iteration-card';
      var head = document.createElement('div');
      head.className = 'iteration-head';
      var titleWrap = document.createElement('div');
      var title = document.createElement('strong');
      title.textContent = item.title;
      var time = document.createElement('small');
      time.textContent = new Date(item.recordedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      titleWrap.append(title, time);
      var number = document.createElement('span');
      number.className = 'iteration-number';
      number.textContent = '#' + item.number;
      head.append(titleWrap, number);

      var metrics = document.createElement('div');
      metrics.className = 'iteration-metrics';
      [
        ['HTML', formatBytes(item.htmlBytes)], ['Data URL', formatBytes(item.dataUrlBytes)],
        ['QR', 'версия ' + item.qrVersion], ['Контроль', item.checksum.slice(0, 10)]
      ].forEach(function (entry) {
        var metric = document.createElement('div');
        metric.className = 'iteration-metric';
        var label = document.createElement('span');
        label.textContent = entry[0];
        var value = document.createElement('b');
        value.textContent = entry[1];
        metric.append(label, value);
        metrics.appendChild(metric);
      });

      var validation = document.createElement('div');
      validation.className = 'iteration-validation';
      validation.append(
        historyBadge('✓ ' + item.validation.pass, 'good'),
        historyBadge('× ' + item.validation.fail, item.validation.fail ? 'fail' : 'muted'),
        historyBadge('… ' + item.validation.pending, 'muted'),
        historyBadge(item.roundtripOk ? 'QR совпал' : 'QR не совпал', item.roundtripOk ? 'good' : 'fail')
      );

      var itemPrevious = historyApi.previousFor(items, item);
      var delta = historyApi.compare(itemPrevious, item);
      var deltaText = document.createElement('p');
      deltaText.className = 'iteration-delta' + (delta && delta.fail < 0 ? ' good' : delta && delta.fail > 0 ? ' bad' : '');
      deltaText.textContent = delta ? 'К предыдущей: HTML ' + formatDelta(delta.htmlBytes, ' Б') + ', нагрузка ' + formatDelta(delta.dataUrlBytes, ' Б') + ', нарушения ' + formatDelta(delta.fail) + '.' : 'Первая итерация этого приложения.';
      card.append(head, metrics, validation, deltaText);
      elements.iterationHistory.appendChild(card);
    });
  }

  function recordIteration() {
    if (!historyApi || !state.html || !state.spec || !state.dataUrl || !state.qr || !state.checksum) return;
    var now = new Date().toISOString();
    var summary = core.summarizeChecks(state.checks);
    var signature = [state.spec.id, state.spec.title, state.checksum.algorithm, state.checksum.value, elements.encoding.value, elements.ecc.value].join('|');
    var result = historyApi.upsert(state.iterations, {
      recordedAt: now,
      updatedAt: now,
      applicationId: state.spec.id,
      title: state.spec.title,
      htmlBytes: core.byteLength(state.html),
      dataUrlBytes: core.byteLength(state.dataUrl),
      qrVersion: state.qr.version,
      encoding: elements.encoding.value,
      ecc: elements.ecc.value,
      validation: summary,
      roundtripOk: !!(state.roundtrip && state.roundtrip.ok),
      checksum: state.checksum.value,
      signature: signature
    }, 50);
    state.iterations = result.items;
    renderHistory();
  }

  function renderComparison() {
    var items = state.comparisons;
    elements.addCurrentComparison.disabled = !state.report;
    elements.downloadComparison.disabled = !items.length;
    elements.clearComparison.disabled = !items.length;
    elements.comparisonSummary.replaceChildren();
    elements.comparisonList.replaceChildren();
    if (!items.length) {
      elements.comparisonSummary.appendChild(historyBadge('Добавьте текущую сборку или загрузите отчёты', 'muted'));
      var empty = document.createElement('p');
      empty.className = 'analysis-empty';
      empty.textContent = 'Результаты сравнения появятся здесь.';
      elements.comparisonList.appendChild(empty);
      return;
    }

    var summary = comparisonApi.summarize(items);
    elements.comparisonSummary.append(
      historyBadge('Реализаций: ' + summary.total, 'muted'),
      historyBadge('Автоматически готовы: ' + summary.ready, summary.ready ? 'good' : 'muted'),
      historyBadge('Заданий: ' + summary.assignments.length, summary.mixedAssignments ? 'warn' : 'muted')
    );
    if (summary.mixedAssignments) elements.comparisonSummary.appendChild(historyBadge('Смешаны разные ID приложений', 'warn'));

    comparisonApi.rank(items).forEach(function (item, index) {
      var card = document.createElement('article');
      card.className = 'comparison-card' + (item.automaticReady ? ' ready' : '');
      var head = document.createElement('div');
      head.className = 'comparison-head';
      var titleWrap = document.createElement('div');
      var title = document.createElement('strong');
      title.textContent = item.title;
      var source = document.createElement('small');
      source.textContent = item.source + ' · задание ' + item.assignmentId;
      titleWrap.append(title, source);
      var rank = document.createElement('span');
      rank.className = 'comparison-rank';
      rank.textContent = '#' + (index + 1);
      head.append(titleWrap, rank);

      var metrics = document.createElement('div');
      metrics.className = 'comparison-metrics';
      [
        ['HTML', formatBytes(item.htmlBytes)], ['Data URL', formatBytes(item.dataUrlBytes)],
        ['QR', 'версия ' + item.qrVersion], ['Контроль', item.checksum.slice(0, 10)]
      ].forEach(function (entry) {
        var metric = document.createElement('div');
        metric.className = 'comparison-metric';
        var label = document.createElement('span');
        label.textContent = entry[0];
        var value = document.createElement('b');
        value.textContent = entry[1];
        metric.append(label, value);
        metrics.appendChild(metric);
      });

      var badges = document.createElement('div');
      badges.className = 'comparison-badges';
      badges.append(
        historyBadge(item.automaticReady ? 'Автопроверка пройдена' : 'Не готово', item.automaticReady ? 'good' : 'fail'),
        historyBadge('× ' + item.validation.fail, item.validation.fail ? 'fail' : 'muted'),
        historyBadge('! ' + item.validation.warn, item.validation.warn ? 'warn' : 'muted'),
        historyBadge('… ' + item.validation.pending, 'muted')
      );

      var result = document.createElement('p');
      result.className = 'comparison-result ' + (item.automaticReady ? 'good' : 'bad');
      if (item.automaticReady) result.textContent = 'Автоматические условия и обратная проверка пройдены.';
      else {
        var reasons = [];
        if (item.validation.fail) reasons.push('нарушений: ' + item.validation.fail);
        if (item.validation.pending) reasons.push('ожидают проверки: ' + item.validation.pending);
        if (!item.roundtripOk) reasons.push('нет точного QR-восстановления');
        if (!item.qrVersion) reasons.push('не определена версия QR');
        result.textContent = 'Требует исправления: ' + (reasons.join(', ') || 'проверьте отчёт') + '.';
      }
      card.append(head, metrics, badges, result);
      elements.comparisonList.appendChild(card);
    });
  }

  function addComparisonReport(report, sourceName) {
    if (!comparisonApi) throw new Error('Модуль сравнения не загружен.');
    var result = comparisonApi.upsert(state.comparisons, report, sourceName, 30);
    state.comparisons = result.items;
    renderComparison();
    return result;
  }

  function addCurrentToComparison() {
    try {
      var report = createReport();
      if (!report) throw new Error('Сначала создайте и проверьте QR.');
      var result = addComparisonReport(report, 'Текущая вкладка');
      setStatus(result.added ? 'Текущая реализация добавлена в сравнение.' : 'Данные текущей реализации обновлены.', 'good');
    } catch (error) { setStatus(error.message, 'bad'); }
  }

  function readTextFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Не удалось прочитать ' + file.name + '.')); };
      reader.readAsText(file, 'utf-8');
    });
  }

  async function loadComparisonReports(input) {
    var files = Array.prototype.slice.call(input.files || []);
    input.value = '';
    if (!files.length) return;
    var imported = 0;
    var errors = [];
    for (var i = 0; i < files.length; i++) {
      try {
        var reportText = await readTextFile(files[i]);
        var item = comparisonApi.parse(reportText, files[i].name);
        addComparisonReport(item, files[i].name);
        imported++;
      } catch (error) { errors.push(files[i].name + ': ' + error.message); }
    }
    if (errors.length) setStatus('Загружено отчётов: ' + imported + '. Ошибки: ' + errors.join(' '), 'bad');
    else setStatus('Загружено отчётов: ' + imported + '.', 'good');
  }

  function clamp(value, min, max, fallback) {
    value = Number(value);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  }

  function optionalNumber(input) {
    return input.value.trim() === '' ? null : Number(input.value);
  }

  function readSpecForm() {
    var currentDifficulty = null;
    try { currentDifficulty = JSON.parse(elements.spec.value).difficulty; }
    catch (error) { currentDifficulty = null; }
    return {
      schemaVersion: '0.1', id: elements.specIdInput.value, title: elements.specTitleInput.value,
      type: elements.specTypeInput.value, difficulty: currentDifficulty,
      qr: { encoding: elements.encoding.value, ecc: elements.ecc.value },
      technical: {
        singleHtmlFile: elements.specSingleFileInput.checked,
        externalResources: elements.specExternalInput.checked,
        networkRequests: elements.specNetworkInput.checked,
        requiredViewport: elements.specViewportInput.checked
      },
      interface: {
        touchControls: elements.specTouchInput.checked,
        noHorizontalScroll: elements.specOverflowInput.checked,
        noVerticalScroll: elements.specVerticalOverflowInput.checked,
        minTouchTargetPx: optionalNumber(elements.specTouchSizeInput),
        minControlGapPx: optionalNumber(elements.specGapInput),
        requireControlLabels: elements.specLabelsInput.value === '' ? null : elements.specLabelsInput.value === 'true'
      }
    };
  }

  function writeSpecForm(spec) {
    if (!specBuilder) return;
    var config = specBuilder.normalize(spec);
    elements.specTitleInput.value = config.title;
    elements.specIdInput.value = config.id;
    elements.specTypeInput.value = config.type;
    elements.specSingleFileInput.checked = config.technical.singleHtmlFile;
    elements.specExternalInput.checked = config.technical.externalResources;
    elements.specNetworkInput.checked = config.technical.networkRequests;
    elements.specViewportInput.checked = config.technical.requiredViewport;
    elements.specTouchInput.checked = config.interface.touchControls;
    elements.specOverflowInput.checked = config.interface.noHorizontalScroll;
    elements.specVerticalOverflowInput.checked = config.interface.noVerticalScroll;
    elements.specTouchSizeInput.value = config.interface.minTouchTargetPx == null ? '' : String(config.interface.minTouchTargetPx);
    elements.specGapInput.value = config.interface.minControlGapPx == null ? '' : String(config.interface.minControlGapPx);
    elements.specLabelsInput.value = config.interface.requireControlLabels == null ? '' : String(config.interface.requireControlLabels);
  }

  function syncSpecJsonFromForm(quiet) {
    if (!specBuilder) throw new Error('Модуль профиля проверки не загружен.');
    var spec = specBuilder.build(readSpecForm());
    elements.spec.value = JSON.stringify(spec, null, 2);
    elements.encoding.value = spec.qr.encoding;
    elements.ecc.value = spec.qr.ecc;
    if (!quiet) setStatus('Профиль проверки обновлён. Нажмите «Проверить и создать QR».');
    return spec;
  }

  function updateSpecFromForm() {
    try { syncSpecJsonFromForm(false); }
    catch (error) { setStatus(error.message, 'bad'); }
  }

  function setSpecEditorMode(mode, quiet, skipSync) {
    var formMode = mode !== 'json';
    if (formMode) {
      try {
        var parsed = JSON.parse(elements.spec.value);
        var errors = core.validateSpec(parsed);
        if (errors.length) throw new Error(errors.join(' '));
        writeSpecForm(parsed);
        elements.encoding.value = parsed.qr.encoding;
        elements.ecc.value = parsed.qr.ecc;
      } catch (error) {
        setStatus('Нельзя открыть конструктор: ' + error.message, 'bad');
        return false;
      }
    } else if (state.specEditorMode === 'form' && !skipSync) syncSpecJsonFromForm(true);
    state.specEditorMode = formMode ? 'form' : 'json';
    elements.specForm.hidden = !formMode;
    elements.specJsonEditor.hidden = formMode;
    elements.specModeForm.classList.toggle('active', formMode);
    elements.specModeJson.classList.toggle('active', !formMode);
    elements.specModeForm.setAttribute('aria-pressed', String(formMode));
    elements.specModeJson.setAttribute('aria-pressed', String(!formMode));
    if (!quiet) setStatus(formMode ? 'Открыты настройки профиля проверки.' : 'Открыт JSON-профиль проверки.');
    return true;
  }

  function loadSpecText(text) {
    elements.spec.value = text;
    try {
      var parsed = JSON.parse(text);
      var errors = core.validateSpec(parsed);
      if (errors.length) throw new Error(errors.join(' '));
      if (specBuilder) parsed = specBuilder.build(parsed);
      elements.spec.value = JSON.stringify(parsed, null, 2);
      writeSpecForm(parsed);
      elements.encoding.value = parsed.qr.encoding;
      elements.ecc.value = parsed.qr.ecc;
      setStatus('JSON-профиль проверки загружен.', 'good');
    } catch (error) {
      setSpecEditorMode('json', true, true);
      setStatus('Профиль проверки загружен с ошибкой: ' + error.message, 'bad');
    }
  }

  function questionCountLabel(count) {
    var lastTwo = count % 100;
    var last = count % 10;
    var word = lastTwo >= 11 && lastTwo <= 14 ? 'вопросов' : last === 1 ? 'вопрос' : last >= 2 && last <= 4 ? 'вопроса' : 'вопросов';
    return count + ' ' + word;
  }

  function renderSimpleQuestions(questions) {
    elements.simpleQuestions.replaceChildren();
    questions.forEach(function (question, questionIndex) {
      var card = document.createElement('article');
      card.className = 'simple-question';
      card.dataset.questionIndex = String(questionIndex);
      card.setAttribute('aria-label', 'Вопрос ' + (questionIndex + 1));
      card.innerHTML = '<div class="simple-question-head"><strong></strong><button type="button" data-simple-action="remove-question">Удалить вопрос</button></div>' +
        '<label>Текст вопроса<input data-simple-prompt type="text" maxlength="48"></label>' +
        '<div class="simple-answers"></div>' +
        '<button class="simple-add-answer" type="button" data-simple-action="add-answer">Добавить вариант ответа</button>';
      card.querySelector('.simple-question-head strong').textContent = 'Вопрос ' + (questionIndex + 1);
      card.querySelector('[data-simple-action="remove-question"]').disabled = questions.length <= 1;
      card.querySelector('[data-simple-prompt]').value = question.prompt;

      var answers = card.querySelector('.simple-answers');
      question.answers.forEach(function (answer, answerIndex) {
        var row = document.createElement('div');
        row.className = 'simple-answer-row';
        row.dataset.answerIndex = String(answerIndex);
        row.innerHTML = '<label><span></span><input data-simple-answer type="text" maxlength="24"></label>' +
          '<label class="simple-correct"><input data-simple-correct type="radio"><span>Правильный</span></label>' +
          '<button type="button" data-simple-action="remove-answer">Удалить</button>';
        row.querySelector('label>span').textContent = 'Вариант ' + (answerIndex + 1);
        row.querySelector('[data-simple-answer]').value = answer;
        var correct = row.querySelector('[data-simple-correct]');
        correct.name = 'simple-correct-' + questionIndex;
        correct.checked = answerIndex === question.correct;
        var remove = row.querySelector('[data-simple-action="remove-answer"]');
        remove.disabled = question.answers.length <= 2;
        remove.setAttribute('aria-label', 'Удалить вариант ' + (answerIndex + 1));
        answers.appendChild(row);
      });
      elements.simpleQuestions.appendChild(card);
    });
    elements.simpleQuestionCount.textContent = questionCountLabel(questions.length);
  }

  function readSimpleConfig() {
    return {
      title: elements.simpleTitle.value,
      theme: elements.simpleTheme.value,
      qr: { encoding: elements.encoding.value, ecc: elements.ecc.value },
      colors: {
        background: elements.simpleBackground.value,
        card: elements.simpleCard.value,
        accent: elements.simpleAccent.value
      },
      questions: Array.prototype.map.call(elements.simpleQuestions.querySelectorAll('.simple-question'), function (card) {
        var answerRows = card.querySelectorAll('.simple-answer-row');
        var correct = Array.prototype.findIndex.call(answerRows, function (row) { return row.querySelector('[data-simple-correct]').checked; });
        return {
          prompt: card.querySelector('[data-simple-prompt]').value,
          answers: Array.prototype.map.call(answerRows, function (row) { return row.querySelector('[data-simple-answer]').value; }),
          correct: correct < 0 ? 0 : correct
        };
      })
    };
  }

  function writeSimpleConfig(config) {
    config = simpleBuilder.normalizeConfig(config);
    elements.simpleTitle.value = config.title;
    elements.simpleTheme.value = config.theme;
    elements.encoding.value = config.qr.encoding;
    elements.ecc.value = config.qr.ecc;
    elements.simpleBackground.value = config.colors.background;
    elements.simpleCard.value = config.colors.card;
    elements.simpleAccent.value = config.colors.accent;
    renderSimpleQuestions(config.questions);
  }

  function syncSimpleSource() {
    if (!simpleBuilder) throw new Error('Модуль конструктора теста не загружен.');
    var built = simpleBuilder.build(readSimpleConfig());
    elements.source.value = built.html;
    elements.spec.value = JSON.stringify(built.spec, null, 2);
    writeSpecForm(built.spec);
    elements.encoding.value = built.spec.qr.encoding;
    elements.ecc.value = built.spec.qr.ecc;
    var htmlBytes = core.byteLength(built.html);
    var urlBytes = core.byteLength(core.makeDataUrl(built.html, built.spec.qr.encoding));
    elements.simpleSize.textContent = 'HTML ' + formatBytes(htmlBytes) + ' · Data URL ' + formatBytes(urlBytes);
    elements.simpleSize.parentElement.classList.toggle('over-limit', urlBytes > core.getQrLimit(built.spec.qr.ecc));
    refreshDifficultyEditor();
    return built;
  }

  function scheduleSimpleBuild() {
    if (state.mode !== 'simple') return;
    clearTimeout(simpleBuildTimer);
    try { syncSimpleSource(); }
    catch (error) { setStatus(error.message, 'bad'); return; }
    setStatus('Изменения собраны. Обновляю проверку…');
    simpleBuildTimer = setTimeout(function () {
      build().then(function () { if (state.mode === 'simple' && state.html) runPreview(); });
    }, 400);
  }

  function changeSimpleStructure(action, control) {
    var config = readSimpleConfig();
    var card = control && control.closest('.simple-question');
    var questionIndex = card ? Number(card.dataset.questionIndex) : -1;
    var row = control && control.closest('.simple-answer-row');
    var answerIndex = row ? Number(row.dataset.answerIndex) : -1;
    var focusSelector = '';

    if (action === 'add-question') {
      config.questions.push({
        prompt: 'Вопрос ' + (config.questions.length + 1),
        answers: ['Вариант 1', 'Вариант 2'],
        correct: 0
      });
      questionIndex = config.questions.length - 1;
      focusSelector = '[data-simple-prompt]';
    } else if (action === 'remove-question' && config.questions.length > 1 && questionIndex >= 0) {
      config.questions.splice(questionIndex, 1);
      questionIndex = Math.min(questionIndex, config.questions.length - 1);
      focusSelector = '[data-simple-prompt]';
    } else if (action === 'add-answer' && config.questions[questionIndex]) {
      var question = config.questions[questionIndex];
      question.answers.push('Вариант ' + (question.answers.length + 1));
      answerIndex = question.answers.length - 1;
      focusSelector = '.simple-answer-row[data-answer-index="' + answerIndex + '"] [data-simple-answer]';
    } else if (action === 'remove-answer' && config.questions[questionIndex] && config.questions[questionIndex].answers.length > 2 && answerIndex >= 0) {
      var editedQuestion = config.questions[questionIndex];
      editedQuestion.answers.splice(answerIndex, 1);
      if (editedQuestion.correct === answerIndex) editedQuestion.correct = 0;
      else if (editedQuestion.correct > answerIndex) editedQuestion.correct--;
      answerIndex = Math.min(answerIndex, editedQuestion.answers.length - 1);
      focusSelector = '.simple-answer-row[data-answer-index="' + answerIndex + '"] [data-simple-answer]';
    } else return;

    renderSimpleQuestions(config.questions);
    scheduleSimpleBuild();
    requestAnimationFrame(function () {
      var currentCard = elements.simpleQuestions.querySelector('.simple-question[data-question-index="' + questionIndex + '"]');
      var focusTarget = currentCard && currentCard.querySelector(focusSelector);
      if (focusTarget) focusTarget.focus();
    });
  }

  function setMode(mode, rebuild) {
    var simpleMode = mode === 'simple';
    state.mode = simpleMode ? 'simple' : 'code';
    clearTimeout(simpleBuildTimer);
    elements.simpleEditor.hidden = !simpleMode;
    elements.codeEditor.hidden = simpleMode;
    elements.fileActions.hidden = simpleMode;
    elements.modeSimple.classList.toggle('active', simpleMode);
    elements.modeCode.classList.toggle('active', !simpleMode);
    elements.modeSimple.setAttribute('aria-pressed', String(simpleMode));
    elements.modeCode.setAttribute('aria-pressed', String(!simpleMode));
    elements.buildButton.textContent = simpleMode ? 'Собрать, проверить и создать QR' : 'Проверить и создать QR';
    elements.clearButton.textContent = simpleMode ? 'Сбросить поля' : 'Очистить';
    if (simpleMode) {
      try { syncSimpleSource(); }
      catch (error) { setStatus(error.message, 'bad'); return; }
      setStatus('Конструктор теста: HTML собран и готов к автоматической проверке.');
      if (rebuild) build().then(function () { if (state.mode === 'simple' && state.html) runPreview(); });
    } else {
      refreshDifficultyEditor();
      setStatus('Режим кода: доступны HTML и профиль автоматических проверок.');
    }
  }

  function resetSimpleWorkspace() {
    writeSimpleConfig(simpleBuilder.DEFAULT_CONFIG);
    syncSimpleSource();
    setStatus('Поля конструктора теста сброшены.');
    build().then(function () { if (state.mode === 'simple' && state.html) runPreview(); });
  }

  function parseSpec() {
    var parsed;
    if (state.specEditorMode === 'form') syncSpecJsonFromForm(true);
    try { parsed = JSON.parse(elements.spec.value); }
    catch (error) { throw new Error('Ошибка JSON-профиля проверки: ' + error.message); }
    var errors = core.validateSpec(parsed);
    if (errors.length) throw new Error(errors.join(' '));
    if (specBuilder) {
      parsed = specBuilder.build(parsed);
      elements.spec.value = JSON.stringify(parsed, null, 2);
    }
    return parsed;
  }

  function currentHtml() {
    var html = core.normalizeSource(elements.source.value);
    if (!html.trim()) throw new Error('Добавьте HTML-код приложения.');
    if (/^data:/i.test(elements.source.value.trim())) elements.source.value = html;
    return html;
  }

  function fitExpandedQr() {
    if (!elements.qrZoom.classList.contains('expanded') || !state.qr) return;
    var fit = core.fitQrDisplay(state.qr.modules, state.qr.quietZone, window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    elements.canvas.style.width = fit.cssSize + 'px';
    elements.canvas.style.height = fit.cssSize + 'px';
    elements.canvas.style.left = fit.cssLeft + 'px';
    elements.canvas.style.top = fit.cssTop + 'px';
    elements.canvas.dataset.modulePixels = String(fit.pixelsPerModule);
    elements.canvas.dataset.totalModules = String(fit.totalModules);
  }

  function clearExpandedQrSize() {
    elements.canvas.style.removeProperty('width');
    elements.canvas.style.removeProperty('height');
    elements.canvas.style.removeProperty('left');
    elements.canvas.style.removeProperty('top');
    delete elements.canvas.dataset.modulePixels;
    delete elements.canvas.dataset.totalModules;
  }

  function setQrExpanded(expanded) {
    expanded = !!expanded && !elements.qrZoom.disabled;
    elements.qrZoom.classList.toggle('expanded', expanded);
    elements.qrZoom.setAttribute('aria-expanded', String(expanded));
    elements.qrZoom.setAttribute('aria-label', expanded ? 'Уменьшить QR-код' : 'Увеличить QR-код');
    elements.qrZoomIcon.textContent = expanded ? '×' : '🔍';
    document.body.classList.toggle('qr-modal-open', expanded);
    if (expanded) fitExpandedQr();
    else clearExpandedQrSize();
  }

  function clearQr() {
    setQrExpanded(false);
    elements.qrZoom.disabled = true;
    var context = elements.canvas.getContext('2d');
    context.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    elements.canvas.style.display = 'none';
    elements.placeholder.style.display = '';
    elements.qrVersion.textContent = '—';
    elements.qrMatrix.textContent = '—';
    elements.qrMask.textContent = '—';
    elements.qrReserve.textContent = '—';
    elements.qrReserveLabel.textContent = 'Запас при ' + elements.ecc.value;
    elements.qrReserve.parentElement.classList.remove('low-ecc');
    elements.qrLOption.hidden = false;
    elements.qrLOption.classList.remove('recovery');
    elements.qrLOptionLabel.textContent = 'Запас при L';
    elements.qrLReserve.textContent = '—';
    elements.qrCorrectionCard.className = 'correction-card';
    elements.qrCorrectionLabel.textContent = 'Автокоррекция QR';
    elements.qrCorrectionValue.textContent = '—';
    elements.qrCorrectionNote.textContent = 'Уровень будет выбран после расчёта нагрузки.';
    elements.checksum.textContent = '—';
    elements.downloadPng.disabled = true;
    elements.copyUrl.disabled = true;
    elements.downloadHtml.disabled = true;
    elements.qrOpenHelp.hidden = true;
    clearSizeAnalysis();
  }

  function renderQr(text, ecc, scale, quiet) {
    if (typeof QRCode !== 'function') throw new Error('Локальный QR-кодировщик не загружен.');
    var holder = document.createElement('div');
    holder.hidden = true;
    document.body.appendChild(holder);
    var instance;
    try {
      instance = new QRCode(holder, {
        text: text,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel[ecc]
      });
    } catch (error) {
      throw new Error('Не удалось сформировать QR-код с выбранными параметрами. Попробуйте снизить коррекцию, выбрать Base64 или уменьшить содержимое.');
    } finally {
      holder.remove();
    }
    if (!instance || !instance._oQRCode) throw new Error('QR-кодировщик не вернул матрицу.');
    var model = instance._oQRCode;
    var modules = model.getModuleCount();
    var version = (modules - 17) / 4;
    var size = (modules + quiet * 2) * scale;
    elements.canvas.width = size;
    elements.canvas.height = size;
    var context = elements.canvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size, size);
    context.fillStyle = '#000000';
    for (var row = 0; row < modules; row++) {
      for (var column = 0; column < modules; column++) {
        if (model.isDark(row, column)) context.fillRect((column + quiet) * scale, (row + quiet) * scale, scale, scale);
      }
    }
    elements.canvas.style.display = 'block';
    elements.placeholder.style.display = 'none';
    elements.qrZoom.disabled = false;
    return { version: version, modules: modules, pixels: size, ecc: ecc, scale: scale, quietZone: quiet };
  }

  function decodeRenderedQr() {
    if (typeof jsQR !== 'function') throw new Error('Локальный QR-декодировщик не загружен.');
    var context = elements.canvas.getContext('2d', { willReadFrequently: true });
    var image = context.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
    var decoded = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
    if (!decoded) throw new Error('Изображение QR не удалось декодировать.');
    return decoded;
  }

  function setRoundtrip(ok, title, detail) {
    state.roundtrip = { ok: ok, title: title, detail: detail };
    elements.roundtripCard.className = 'roundtrip-card ' + (ok ? 'good' : 'fail');
    elements.roundtripIcon.textContent = ok ? '✓' : '×';
    elements.roundtripTitle.textContent = title;
    elements.roundtripDetail.textContent = detail;
    elements.roundtripPill.className = 'badge ' + (ok ? 'good' : 'fail');
    elements.roundtripPill.textContent = ok ? 'QR восстановлен точно' : 'Ошибка восстановления';
  }

  function setValidationExpanded(expanded) {
    expanded = !!expanded;
    elements.validationDetails.hidden = !expanded;
    elements.validationToggle.setAttribute('aria-expanded', String(expanded));
    elements.validationToggle.textContent = expanded ? 'скрыть' : 'показать';
  }

  function renderValidation(checks) {
    var summary = core.summarizeChecks(checks);
    elements.validationSummary.replaceChildren();
    [
      ['pass', 'Пройдено: ' + summary.pass + ' из ' + checks.length, summary.pass],
      ['warn', 'Предупреждения: ' + summary.warn, summary.warn],
      ['fail', 'Нарушено: ' + summary.fail, summary.fail]
    ].forEach(function (entry) {
      var badge = document.createElement('span');
      var quietWhenEmpty = (entry[0] === 'fail' || entry[0] === 'warn') && entry[2] === 0;
      badge.className = 'badge ' + entry[0] + (quietWhenEmpty ? ' empty' : '');
      badge.textContent = entry[1];
      elements.validationSummary.appendChild(badge);
    });

    var warnings = checks.filter(function (check) { return check.status === 'warn'; });
    var failures = checks.filter(function (check) { return check.status === 'fail'; });
    elements.validationRemarks.replaceChildren();
    [
      ['warn', 'Предупреждение: ', warnings],
      ['fail', 'Нарушение: ', failures]
    ].forEach(function (entry) {
      if (!entry[2].length) return;
      var issueLabels = entry[2].slice(0, 3).map(function (check) { return check.label; });
      var line = document.createElement('span');
      line.className = 'validation-remarks-line ' + entry[0];
      line.textContent = entry[1] + issueLabels.join(' · ') + (entry[2].length > issueLabels.length ? ' · ещё ' + (entry[2].length - issueLabels.length) : '');
      elements.validationRemarks.appendChild(line);
    });
    elements.validationRemarks.className = 'validation-remarks';
    elements.validationRemarks.hidden = !warnings.length && !failures.length;

    var icons = { pass: '✓', fail: '×', warn: '!', pending: '…' };
    var statusNames = { pass: 'готово', fail: 'нарушение', warn: 'внимание', pending: 'ожидает' };
    elements.validationList.replaceChildren();
    checks.forEach(function (check) {
      var card = document.createElement('article');
      card.className = 'check ' + check.status;
      var icon = document.createElement('span');
      icon.className = 'check-icon';
      icon.textContent = icons[check.status] || '·';
      var text = document.createElement('div');
      var title = document.createElement('strong');
      title.textContent = check.label;
      var description = document.createElement('p');
      description.textContent = check.message;
      text.append(title, description);
      var badge = document.createElement('span');
      badge.className = 'badge ' + check.status;
      badge.textContent = statusNames[check.status] || check.status;
      card.append(icon, text, badge);
      if (check.evidence) {
        var details = document.createElement('details');
        var summaryElement = document.createElement('summary');
        summaryElement.textContent = 'Показать обнаруженные данные';
        var evidence = document.createElement('div');
        evidence.textContent = check.evidence;
        details.append(summaryElement, evidence);
        card.appendChild(details);
      }
      elements.validationList.appendChild(card);
    });
  }

  function renderSpecError(message) {
    var checks = [{ id: 'spec', label: 'Профиль проверки', status: 'fail', message: message, evidence: '' }];
    state.checks = checks;
    renderValidation(checks);
  }

  function createReport() {
    if (!state.spec || !state.dataUrl) return null;
    return {
      reportVersion: '0.1',
      generatedAt: new Date().toISOString(),
      application: { id: state.spec.id, title: state.spec.title },
      specification: state.spec,
      measurements: {
        htmlBytes: core.byteLength(state.html),
        dataUrlBytes: core.byteLength(state.dataUrl),
        encoding: elements.encoding.value,
        optimization: state.optimization ? {
          originalBytes: state.optimization.originalBytes,
          optimizedBytes: state.optimization.optimizedBytes,
          savedBytes: state.optimization.savedBytes,
          savedPercent: state.optimization.savedPercent,
          commentsRemoved: state.optimization.commentsRemoved,
          changed: state.optimization.changed
        } : null,
        checksum: state.checksum,
        qr: state.qr,
        sizeAnalysis: state.sizeAnalysis
      },
      roundtrip: state.roundtrip,
      runtime: state.runtime,
      validation: {
        summary: core.summarizeChecks(state.checks),
        checks: state.checks
      }
    };
  }

  function refreshValidation() {
    if (!state.html || !state.spec || !state.dataUrl) return;
    state.checks = core.validateHtml(state.html, state.spec, {
      encoding: elements.encoding.value,
      ecc: elements.ecc.value,
      dataUrl: state.dataUrl,
      qrVersion: state.qr && state.qr.version,
      runtime: state.runtime
    });
    renderValidation(state.checks);
    state.report = createReport();
    elements.downloadReport.disabled = false;
    recordIteration();
    renderComparison();
  }

  async function build() {
    var buildId = ++state.buildId;
    setStatus('Оптимизирую HTML, выполняю проверки и формирую QR…');
    clearQr();
    elements.dataUrl.value = '';
    try {
      var sourceHtml = currentHtml();
      var optimization = core.optimizeHtml(sourceHtml);
      var html = optimization.html;
      var matchingRuntime = state.previewHtml === html ? state.runtime : null;
      elements.encoding.value = 'base64';
      elements.ecc.value = 'M';
      var spec = parseSpec();
      var sourceDifficulty = core.inspectDifficulty(sourceHtml);
      if (sourceDifficulty.count === 1 && sourceDifficulty.valid) spec.difficulty = sourceDifficulty.value;
      refreshDifficultyEditor();
      var encoding = 'base64';
      var dataUrl = core.makeDataUrl(html, encoding);
      var payloadBytes = core.byteLength(dataUrl);
      var automaticEcc = payloadBytes <= core.getQrLimit('M') ? 'M' : 'L';
      var requestedEcc = state.qrEmulation && state.qrEmulation.ecc;
      var importedEccFits = !!requestedEcc && payloadBytes <= core.getQrLimit(requestedEcc);
      var ecc = importedEccFits ? requestedEcc : automaticEcc;
      var autoFallback = !requestedEcc && ecc === 'L' && payloadBytes <= core.getQrLimit('L');
      elements.ecc.value = ecc;
      spec.qr.encoding = encoding;
      spec.qr.ecc = ecc;
      elements.spec.value = JSON.stringify(spec, null, 2);
      var physicalLimit = renderQrReserves(html, encoding, ecc, {
        active: !!requestedEcc,
        requestedEcc: requestedEcc,
        eccApplied: importedEccFits
      });
      if (physicalLimit && payloadBytes > physicalLimit) {
        throw new Error('Данные не помещаются даже в QR с коррекцией L: ' + formatBytes(payloadBytes) + ' при вместимости ' + formatBytes(physicalLimit) + '. Уменьшите содержимое.');
      }
      var scale = clamp(elements.moduleScale.value, 1, 20, 6);
      var quiet = clamp(elements.quietZone.value, 0, 16, 4);
      renderSizeAnalysis(html, spec, encoding, ecc, optimization);
      var qr = renderQr(dataUrl, ecc, scale, quiet);
      qr.emulation = state.qrEmulation ? {
        sourceFile: state.qrEmulation.sourceFile,
        sourceVersion: state.qrEmulation.sourceVersion,
        sourceMask: state.qrEmulation.sourceMask,
        requestedEcc: requestedEcc,
        eccApplied: importedEccFits
      } : null;
      var decoded = decodeRenderedQr();
      qr.mask = decoded.dataMask == null ? null : decoded.dataMask;
      var sourceChecksum = await core.checksum(dataUrl);
      var decodedChecksum = await core.checksum(decoded.data);
      if (buildId !== state.buildId) return;

      state.html = html;
      state.optimization = optimization;
      state.spec = spec;
      state.dataUrl = dataUrl;
      state.qr = qr;
      if (elements.qrZoom.classList.contains('expanded')) fitExpandedQr();
      state.checksum = sourceChecksum;
      state.runtime = matchingRuntime;
      elements.dataUrl.value = dataUrl;
      elements.htmlBytes.textContent = formatBytes(core.byteLength(html));
      elements.urlBytes.textContent = formatBytes(core.byteLength(dataUrl));
      elements.qrVersion.textContent = String(qr.version);
      elements.qrMatrix.textContent = qr.modules + '×' + qr.modules;
      elements.qrMask.textContent = qr.mask == null ? '—' : String(qr.mask);
      elements.checksum.textContent = sourceChecksum.value.slice(0, 12);
      elements.checksum.title = sourceChecksum.algorithm + ': ' + sourceChecksum.value;

      var exact = decoded.data === dataUrl && decodedChecksum.value === sourceChecksum.value;
      setRoundtrip(exact, exact ? 'Содержимое восстановлено без изменений' : 'Восстановленное содержимое отличается', exact ? 'Декодировано из пикселей QR и побайтово сопоставлено. ' + sourceChecksum.algorithm + ': ' + sourceChecksum.value.slice(0, 16) + '…' : 'Сравнение контрольных сумм не пройдено.');

      elements.downloadPng.disabled = false;
      elements.copyUrl.disabled = false;
      elements.downloadHtml.disabled = false;
      elements.qrOpenHelp.hidden = !exact;
      refreshValidation();
      var failed = core.summarizeChecks(state.checks).fail;
      var optimizationNote = optimization.savedBytes ? ' HTML сокращён на ' + formatBytes(optimization.savedBytes) + ' (' + optimization.savedPercent.toFixed(1).replace('.', ',') + ' %).' : ' HTML уже был компактным.';
      var fallbackNote = autoFallback ? ' Коррекция автоматически переключена с M на L.' : '';
      var emulationNote = requestedEcc
        ? importedEccFits
          ? ' Применена коррекция ' + requestedEcc + ' из профиля загруженного QR.'
          : ' Коррекция ' + requestedEcc + ' из профиля не вместила нагрузку; использован уровень ' + ecc + '.'
        : '';
      setStatus((failed ? 'QR создан, но найдено нарушений: ' + failed + '.' : 'QR создан и автоматически проверен.') + fallbackNote + emulationNote + optimizationNote, failed ? 'bad' : 'good');
    } catch (error) {
      state.html = '';
      state.spec = null;
      state.dataUrl = '';
      state.qr = null;
      state.report = null;
      state.optimization = null;
      elements.downloadReport.disabled = true;
      renderComparison();
      renderSpecError(error.message);
      setStatus(error.message, 'bad');
    }
  }

  function populateExamples() {
    elements.exampleSelect.replaceChildren();
    (sample.items || [sample]).forEach(function (item) {
      var option = document.createElement('option');
      option.value = item.id || item.spec.id;
      option.textContent = item.title || item.spec.title;
      elements.exampleSelect.appendChild(option);
    });
    elements.exampleSelect.value = sample.defaultId || sample.spec.id;
    updateSampleDocumentationButton();
  }

  function selectedSample() {
    return typeof sample.getById === 'function' ? sample.getById(elements.exampleSelect.value) : sample;
  }

  function updateSampleDocumentationButton() {
    var selected = selectedSample();
    var available = Boolean(selected && selected.documentation);
    elements.sampleDocumentationOpen.disabled = !available;
    elements.sampleDocumentationOpen.title = available
      ? 'Открыть описание примера «' + (selected.title || selected.spec.title) + '»'
      : 'Для этого примера описание пока не добавлено';
  }

  function appendDocumentationText(container, tagName, text, className) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    container.appendChild(element);
  }

  function createDocumentationSvgElement(tagName) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
  }

  function renderGridMapDocumentation(container, visualization) {
    var rows = visualization.rows || [];
    var width = rows.length ? rows[0].length : 0;
    if (!width || rows.some(function (row) { return row.length !== width; })) return;
    var cells = rows.join('');
    var wallValue = visualization.wall || '1';
    var starts = visualization.starts || [];
    var exitData = typeof visualization.exit === 'number'
      ? { index: visualization.exit, label: 'E' }
      : visualization.exit;
    if (!starts.length || !exitData) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'sample-grid-map';
    var caption = document.createElement('p');
    caption.className = 'sample-grid-map-caption';
    caption.textContent = visualization.caption || '';
    var svg = createDocumentationSvgElement('svg');
    svg.classList.add('sample-grid-map-svg');
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + rows.length);
    svg.setAttribute('role', 'img');
    var svgTitle = createDocumentationSvgElement('title');
    svgTitle.textContent = visualization.title || 'Схема лабиринта';
    var svgDescription = createDocumentationSvgElement('desc');
    svg.appendChild(svgTitle);
    svg.appendChild(svgDescription);

    for (var index = 0; index < cells.length; index++) {
      var cellRect = createDocumentationSvgElement('rect');
      cellRect.setAttribute('x', index % width);
      cellRect.setAttribute('y', Math.floor(index / width));
      cellRect.setAttribute('width', 1);
      cellRect.setAttribute('height', 1);
      cellRect.setAttribute('class', 'sample-grid-map-cell ' + (cells[index] === wallValue ? 'is-wall' : 'is-floor'));
      svg.appendChild(cellRect);
    }

    function appendMarker(marker, markerClass) {
      var group = createDocumentationSvgElement('g');
      group.setAttribute('class', 'sample-grid-map-marker ' + markerClass);
      var rect = createDocumentationSvgElement('rect');
      rect.setAttribute('x', marker.index % width);
      rect.setAttribute('y', Math.floor(marker.index / width));
      rect.setAttribute('width', 1);
      rect.setAttribute('height', 1);
      var label = createDocumentationSvgElement('text');
      label.setAttribute('x', marker.index % width + 0.5);
      label.setAttribute('y', Math.floor(marker.index / width) + 0.62);
      label.setAttribute('text-anchor', 'middle');
      label.textContent = marker.label;
      group.appendChild(rect);
      group.appendChild(label);
      svg.appendChild(group);
    }

    starts.forEach(function (start) { appendMarker(start, 'is-start'); });
    appendMarker(exitData, 'is-exit');
    svgDescription.textContent = (visualization.caption || 'Схема карты') + '. Стены показаны тёмными клетками; отмечены четыре точки старта и выход.';
    svg.setAttribute('aria-label', svgDescription.textContent);
    if (caption.textContent) wrapper.appendChild(caption);
    wrapper.appendChild(svg);
    container.appendChild(wrapper);
  }

  function renderDocumentationVisualization(container, visualization) {
    if (visualization.type === 'grid-map') renderGridMapDocumentation(container, visualization);
  }

  function renderSampleDocumentation(documentation) {
    elements.sampleDocumentationTitle.textContent = documentation.title || 'Документация';
    elements.sampleDocumentationContent.replaceChildren();
    (documentation.intro || []).forEach(function (text) {
      appendDocumentationText(elements.sampleDocumentationContent, 'p', text, 'sample-documentation-intro');
    });
    (documentation.sections || []).forEach(function (sectionData) {
      var section = document.createElement('section');
      section.className = 'sample-documentation-section';
      if (sectionData.title) appendDocumentationText(section, 'h3', sectionData.title);
      (sectionData.paragraphs || []).forEach(function (text) { appendDocumentationText(section, 'p', text); });
      if (sectionData.items && sectionData.items.length) {
        var list = document.createElement('ul');
        sectionData.items.forEach(function (text) { appendDocumentationText(list, 'li', text); });
        section.appendChild(list);
      }
      if (sectionData.diagram) appendDocumentationText(section, 'pre', sectionData.diagram, 'sample-documentation-diagram');
      if (sectionData.visualization) renderDocumentationVisualization(section, sectionData.visualization);
      elements.sampleDocumentationContent.appendChild(section);
    });
  }

  function openSampleDocumentation() {
    var selected = selectedSample();
    if (!selected || !selected.documentation) return;
    renderSampleDocumentation(selected.documentation);
    state.sampleDocumentationLastFocus = document.activeElement;
    elements.sampleDocumentationOverlay.hidden = false;
    document.body.classList.add('sample-documentation-open');
    elements.sampleDocumentationClose.focus();
  }

  function closeSampleDocumentation() {
    if (elements.sampleDocumentationOverlay.hidden) return;
    elements.sampleDocumentationOverlay.hidden = true;
    document.body.classList.remove('sample-documentation-open');
    if (state.sampleDocumentationLastFocus && typeof state.sampleDocumentationLastFocus.focus === 'function') state.sampleDocumentationLastFocus.focus();
  }

  function refreshDifficultyEditor() {
    var source = elements.source.value;
    try { source = core.normalizeSource(source); }
    catch (error) { source = elements.source.value; }
    var difficulty = core.inspectDifficulty(source);
    var difficultyNames = ['', 'очень лёгкая', 'лёгкая', 'средняя', 'сложная', 'очень сложная'];
    var hasDifficulty = difficulty.count === 1 && difficulty.valid;
    elements.previewDifficulty.textContent = hasDifficulty ? 'Сложность: ' + difficulty.value + ' — ' + difficultyNames[difficulty.value] : 'Без сложности';
    elements.previewDifficulty.classList.remove('good');
    elements.previewDifficulty.classList.toggle('muted', !hasDifficulty);
    elements.difficultyEditor.hidden = false;
    elements.difficultyEditor.classList.toggle('unavailable', !difficulty.editable);
    elements.codeDifficulty.disabled = !difficulty.editable;
    elements.applyDifficulty.disabled = !difficulty.editable;
    if (!difficulty.count) {
      elements.codeDifficulty.value = '3';
      elements.difficultyVariableNote.textContent = 'В коде нет переменной var $d=3;';
      return;
    }
    elements.codeDifficulty.value = String(difficulty.valid ? difficulty.value : 3);
    elements.difficultyVariableNote.textContent = difficulty.count > 1
      ? 'Найдено несколько переменных — оставьте одну'
      : 'Переменная $d' + (difficulty.valid ? ' найдена в текущем HTML' : ' содержит значение вне диапазона 1–5');
  }

  function applyCodeDifficulty() {
    try {
      var value = Number(elements.codeDifficulty.value);
      var html = core.normalizeSource(elements.source.value);
      elements.source.value = core.setDifficulty(html, value);
      var spec = parseSpec();
      spec.difficulty = value;
      elements.spec.value = JSON.stringify(spec, null, 2);
      writeSpecForm(spec);
      refreshDifficultyEditor();
      setStatus('Сложность ' + value + ' применена к текущему HTML.');
      build().then(function () { if (state.html) runPreview(); });
    } catch (error) { setStatus(error.message, 'bad'); }
  }

  function loadSample(id) {
    var selected = typeof sample.getById === 'function' ? sample.getById(id || elements.exampleSelect.value) : sample;
    elements.exampleSelect.value = selected.id || selected.spec.id;
    elements.source.value = selected.html;
    elements.spec.value = JSON.stringify(selected.spec, null, 2);
    writeSpecForm(selected.spec);
    elements.encoding.value = selected.spec.qr.encoding;
    elements.ecc.value = selected.spec.qr.ecc;
    updateSampleDocumentationButton();
    refreshDifficultyEditor();
    setStatus('Загружен эталонный пример «' + selected.spec.title + '».');
  }

  function resetWorkspace() {
    stopPreview();
    clearImportedQrAnalysis();
    clearQrEmulation(true);
    state.buildId++;
    state.html = '';
    state.spec = null;
    state.dataUrl = '';
    state.qr = null;
    state.checks = [];
    state.runtime = null;
    state.report = null;
    elements.source.value = '';
    refreshDifficultyEditor();
    var blankSpec = specBuilder ? specBuilder.build({}) : {};
    elements.spec.value = JSON.stringify(blankSpec, null, 2);
    writeSpecForm(blankSpec);
    elements.dataUrl.value = '';
    elements.htmlBytes.textContent = '0 Б';
    elements.urlBytes.textContent = '0 Б';
    elements.validationList.replaceChildren();
    elements.validationSummary.innerHTML = '<span class="badge muted">Проверка ещё не запускалась</span>';
    elements.validationRemarks.textContent = '';
    elements.validationRemarks.hidden = true;
    setValidationExpanded(false);
    elements.roundtripCard.className = 'roundtrip-card';
    elements.roundtripIcon.textContent = '↺';
    elements.roundtripTitle.textContent = 'Обратная проверка не выполнена';
    elements.roundtripDetail.textContent = 'После генерации изображение QR будет декодировано и побайтово сравнено с исходной нагрузкой.';
    elements.roundtripPill.className = 'badge muted';
    elements.roundtripPill.textContent = 'Ещё не проверено';
    elements.downloadReport.disabled = true;
    renderComparison();
    clearQr();
    setStatus('Поля очищены.');
  }

  function downloadBlob(content, type, name) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function currentProjectInput() {
    if (!projectApi) throw new Error('Модуль файлов проекта не загружен.');
    if (state.mode === 'simple') syncSimpleSource();
    var html = currentHtml();
    var spec = parseSpec();
    return {
      html: html,
      specification: spec,
      settings: {
        encoding: elements.encoding.value,
        ecc: elements.ecc.value,
        moduleScale: elements.moduleScale.value,
        quietZone: elements.quietZone.value
      },
      editor: {
        mode: state.mode,
        simpleConfig: state.mode === 'simple' ? readSimpleConfig() : null
      },
      preview: {
        preset: elements.previewPreset.value,
        width: elements.previewWidth.value,
        height: elements.previewHeight.value
      }
    };
  }

  function downloadCurrentProject() {
    try {
      var input = currentProjectInput();
      downloadBlob(projectApi.serialize(input), 'application/json;charset=utf-8', input.specification.id + '.qrapp.json');
      setStatus('Файл проекта сохранён локально.', 'good');
    } catch (error) { setStatus(error.message, 'bad'); }
  }

  function downloadCurrentSpec() {
    try {
      if (state.mode === 'simple') syncSimpleSource();
      var spec = parseSpec();
      downloadBlob(JSON.stringify(spec, null, 2) + '\n', 'application/json;charset=utf-8', spec.id + '-validation-profile.json');
      setStatus('Профиль проверки сохранён локально.', 'good');
    } catch (error) { setStatus(error.message, 'bad'); }
  }

  function embeddedGameSpecification() {
    var template = $('embedded-game-spec');
    var content = template && template.content ? template.content.querySelector('pre') : null;
    if (!content || !content.textContent.trim()) throw new Error('Встроенная спецификация создания игр недоступна.');
    return content.textContent.replace(/\r?\n/g, '\r\n').replace(/(?:\r\n)*$/, '\r\n');
  }

  function downloadGameSpecification() {
    try {
      downloadBlob(embeddedGameSpecification(), 'text/markdown;charset=utf-8', 'spec_game_creation_ru.md');
      setStatus('Спецификация создания игр сохранена локально.', 'good');
    } catch (error) { setStatus(error.message, 'bad'); }
  }

  async function copyPlainText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {}
    }
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.focus();
    field.select();
    var copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('Команда копирования недоступна.');
  }

  async function copyGameSpecification() {
    try {
      await copyPlainText(embeddedGameSpecification());
      setStatus('Текст спецификации создания игр скопирован.', 'good');
    } catch (error) { setStatus('Не удалось скопировать спецификацию: ' + error.message, 'bad'); }
  }

  function equalJson(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  async function openProject(text) {
    try {
      if (!projectApi) throw new Error('Модуль файлов проекта не загружен.');
      var project = projectApi.parse(text);
      var specErrors = core.validateSpec(project.specification);
      if (specErrors.length) throw new Error('Профиль проверки проекта недействителен. ' + specErrors.join(' '));
      var projectSpec = specBuilder ? specBuilder.build(project.specification) : project.specification;

      stopPreview();
      var restoredSimpleMode = false;
      if (project.editor.mode === 'simple' && project.editor.simpleConfig && simpleBuilder) {
        var simpleResult = simpleBuilder.build(project.editor.simpleConfig);
        restoredSimpleMode = simpleResult.html === project.html && equalJson(simpleResult.spec, projectSpec);
        if (restoredSimpleMode) {
          writeSimpleConfig(project.editor.simpleConfig);
          setMode('simple', false);
        }
      }
      if (!restoredSimpleMode) {
        setMode('code', false);
        elements.source.value = project.html;
        elements.spec.value = JSON.stringify(projectSpec, null, 2);
        writeSpecForm(projectSpec);
        refreshDifficultyEditor();
      }

      elements.encoding.value = project.settings.encoding;
      elements.ecc.value = project.settings.ecc;
      elements.moduleScale.value = String(project.settings.moduleScale);
      elements.quietZone.value = String(project.settings.quietZone);
      var presetExists = Array.prototype.some.call(elements.previewPreset.options, function (option) { return option.value === project.preview.preset; });
      elements.previewPreset.value = presetExists ? project.preview.preset : 'custom';
      elements.previewWidth.value = String(project.preview.width);
      elements.previewHeight.value = String(project.preview.height);
      applyPreviewSize();

      await build();
      if (!state.html) return;
      var fallback = project.editor.mode === 'simple' && !restoredSimpleMode ? ' Конструктор теста этой версии не совпал с сохранённым HTML, поэтому открыт режим кода.' : '';
      setStatus('Проект «' + projectSpec.title + '» открыт и QR проверен. Для выполнения кода нажмите «Запустить».' + fallback, fallback ? '' : 'good');
    } catch (error) { setStatus('Не удалось открыть проект: ' + error.message, 'bad'); }
  }

  async function copyDataUrl() {
    if (!state.dataUrl) return;
    try {
      await copyPlainText(state.dataUrl);
      setStatus('Data URL скопирован.', 'good');
    } catch (error) { setStatus('Не удалось скопировать: ' + error.message, 'bad'); }
  }

  function downloadPng() {
    if (!state.qr) return;
    var link = document.createElement('a');
    link.href = elements.canvas.toDataURL('image/png');
    link.download = (state.spec && state.spec.id ? state.spec.id : 'microapp') + '-qr.png';
    link.click();
  }

  function addRuntimeMessage(text, className) {
    if (state.runtimeMessages.indexOf(text) >= 0) return;
    state.runtimeMessages.push(text);
    if (state.runtimeMessages.length === 1) elements.runtimeLog.replaceChildren();
    var item = document.createElement('li');
    item.className = className || '';
    item.textContent = text;
    elements.runtimeLog.appendChild(item);
  }

  function runPreview() {
    var html;
    try { html = core.optimizeHtml(currentHtml()).html; }
    catch (error) { setStatus(error.message, 'bad'); return; }
    state.previewHtml = html;
    state.previewToken = Date.now().toString(36) + Math.random().toString(36).slice(2);
    state.runtimeMessages = [];
    state.runtime = null;
    elements.runtimeLog.innerHTML = '<li class="muted-item">Запуск в sandbox…</li>';
    elements.preview.removeAttribute('srcdoc');
    elements.preview.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(core.buildPreviewDocument(html, state.previewToken));
    setStatus('Предпросмотр запущен с запретом сетевых запросов.', 'good');
  }

  function stopPreview() {
    state.previewToken = '';
    state.previewHtml = '';
    elements.preview.removeAttribute('srcdoc');
    elements.preview.src = 'about:blank';
    elements.runtimeLog.innerHTML = '<li class="muted-item">Предпросмотр остановлен.</li>';
  }

  function applyPreviewSize() {
    var width = clamp(elements.previewWidth.value, 180, 1200, 360);
    var height = clamp(elements.previewHeight.value, 240, 1600, 640);
    elements.previewWidth.value = width;
    elements.previewHeight.value = height;
    elements.device.style.width = width + 'px';
    elements.device.style.height = height + 'px';
  }

  function applyPreset() {
    if (elements.previewPreset.value !== 'custom') {
      var parts = elements.previewPreset.value.split('x');
      elements.previewWidth.value = parts[0];
      elements.previewHeight.value = parts[1];
    }
    applyPreviewSize();
  }

  function readFile(input, callback) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { callback(String(reader.result || '')); input.value = ''; };
    reader.onerror = function () { setStatus('Не удалось прочитать файл.', 'bad'); input.value = ''; };
    reader.readAsText(file, 'utf-8');
  }

  function decodeQrImage(file) {
    return new Promise(function (resolve, reject) {
      if (typeof window.jsQR !== 'function') return reject(new Error('Модуль декодирования QR недоступен.'));
      var image = new Image();
      var url = URL.createObjectURL(file);
      image.onload = function () {
        try {
          var limit = 3000;
          var scale = Math.min(1, limit / Math.max(image.naturalWidth, image.naturalHeight));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          var context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          var pixels = context.getImageData(0, 0, canvas.width, canvas.height);
          var decoded = window.jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' });
          var inverted = false;
          if (!decoded) {
            decoded = window.jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'onlyInvert' });
            inverted = !!decoded;
          }
          if (!decoded || !decoded.data) throw new Error('QR-код на изображении не распознан. Попробуйте более чёткое изображение с белым полем вокруг кода.');
          resolve({
            decoded: decoded,
            profile: core.analyzeQrImage(decoded, {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              width: image.naturalWidth,
              height: image.naturalHeight,
              decodeWidth: pixels.width,
              decodeHeight: pixels.height,
              decodeScale: scale,
              inverted: inverted
            })
          });
        } catch (error) { reject(error); }
        finally { URL.revokeObjectURL(url); }
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Не удалось открыть QR-изображение.'));
      };
      image.src = url;
    });
  }

  async function loadQrImage(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    input.value = '';
    if (file.type && !/^image\//i.test(file.type)) return setStatus('Выбранный файл не является изображением.', 'bad');
    if (file.size > 30 * 1024 * 1024) return setStatus('QR-изображение больше 30 МБ.', 'bad');
    clearImportedQrAnalysis();
    clearQrEmulation(true);
    setStatus('Декодирование QR-изображения…');
    try {
      var result = await decodeQrImage(file);
      renderImportedQrAnalysis(result.profile, result.decoded.data);
      if (result.profile.payload.isHtml) {
        var source = core.normalizeSource(result.decoded.data);
        setMode('code', false);
        elements.source.value = source;
        refreshDifficultyEditor();
        setStatus('QR-изображение декодировано и проанализировано: HTML загружен в редактор.', 'good');
      } else {
        setStatus('QR-изображение декодировано и проанализировано. Содержимое не является HTML и показано только в профиле.', 'good');
      }
    } catch (error) { setStatus(error.message || 'Не удалось декодировать QR-изображение.', 'bad'); }
  }

  window.addEventListener('message', function (event) {
    var message = event.data;
    if (!message || message.source !== 'qr-microapps-preview' || event.source !== elements.preview.contentWindow || message.token !== state.previewToken) return;
    if (message.kind === 'ready') addRuntimeMessage('Приложение запустилось.', 'good-item');
    if (message.kind === 'error') addRuntimeMessage('Ошибка JavaScript: ' + (message.data.message || 'без описания') + (message.data.line ? ' · строка ' + message.data.line : ''), 'error-item');
    if (message.kind === 'blocked') addRuntimeMessage('Заблокирован ресурс: ' + (message.data.uri || message.data.directive || 'неизвестный адрес'), 'warn-item');
    if (message.kind === 'metrics') {
      state.runtime = message.data;
      addRuntimeMessage(message.data.horizontalOverflow ? 'Обнаружена горизонтальная прокрутка.' : 'Горизонтальное переполнение не обнаружено.', message.data.horizontalOverflow ? 'error-item' : 'good-item');
      if (state.previewHtml === state.html) refreshValidation();
      else addRuntimeMessage('Предпросмотр отличается от последней QR-сборки; отчёт и история не обновлены.', 'warn-item');
    }
  });

  $('build').addEventListener('click', function () {
    if (state.mode === 'simple') syncSimpleSource();
    build().then(function () { if (state.html) runPreview(); });
  });
  elements.themeToggle.addEventListener('click', function () {
    applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', true);
  });
  elements.applyImportedQr.addEventListener('click', applyImportedQrProfile);
  elements.closeImportedQr.addEventListener('click', function () { elements.qrImportAnalysis.hidden = true; setStatus('Профиль загруженного QR скрыт.'); });
  elements.clearQrEmulation.addEventListener('click', function () { clearQrEmulation(true); setStatus('Возвращён автоматический выбор коррекции и стандартная геометрия QR.'); });
  elements.qrZoom.addEventListener('click', function () { setQrExpanded(!elements.qrZoom.classList.contains('expanded')); });
  window.addEventListener('resize', fitExpandedQr);
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (!elements.sampleDocumentationOverlay.hidden) closeSampleDocumentation();
    else if (elements.qrZoom.classList.contains('expanded')) setQrExpanded(false);
  });
  elements.exampleSelect.addEventListener('change', function () {
    setMode('code', false);
    loadSample(elements.exampleSelect.value);
    build().then(function () { if (state.html) runPreview(); });
  });
  elements.sampleDocumentationOpen.addEventListener('click', openSampleDocumentation);
  elements.sampleDocumentationClose.addEventListener('click', closeSampleDocumentation);
  elements.sampleDocumentationOverlay.addEventListener('click', function (event) { if (event.target === elements.sampleDocumentationOverlay) closeSampleDocumentation(); });
  elements.applyDifficulty.addEventListener('click', applyCodeDifficulty);
  elements.source.addEventListener('input', refreshDifficultyEditor);
  $('clear').addEventListener('click', function () { if (state.mode === 'simple') resetSimpleWorkspace(); else resetWorkspace(); });
  $('copy-url').addEventListener('click', copyDataUrl);
  $('download-png').addEventListener('click', downloadPng);
  $('download-html').addEventListener('click', function () { if (state.html) downloadBlob(state.html, 'text/html;charset=utf-8', (state.spec && state.spec.id || 'microapp') + '.html'); });
  $('download-report').addEventListener('click', function () { if (state.report) downloadBlob(JSON.stringify(createReport(), null, 2), 'application/json;charset=utf-8', (state.spec && state.spec.id || 'microapp') + '-validation-report.json'); });
  elements.validationToggle.addEventListener('click', function () { setValidationExpanded(elements.validationDetails.hidden); });
  elements.downloadProject.addEventListener('click', downloadCurrentProject);
  elements.downloadSpec.addEventListener('click', downloadCurrentSpec);
  elements.downloadGameSpec.addEventListener('click', downloadGameSpecification);
  elements.copyGameSpec.addEventListener('click', copyGameSpecification);
  elements.addCurrentComparison.addEventListener('click', addCurrentToComparison);
  elements.comparisonFiles.addEventListener('change', function () { loadComparisonReports(this); });
  elements.downloadComparison.addEventListener('click', function () { if (state.comparisons.length) downloadBlob('\ufeff' + comparisonApi.toCsv(state.comparisons), 'text/csv;charset=utf-8', 'qr-microapps-comparison.csv'); });
  elements.clearComparison.addEventListener('click', function () { state.comparisons = []; renderComparison(); setStatus('Сравнение очищено.'); });
  elements.downloadHistory.addEventListener('click', function () { if (state.iterations.length) downloadBlob('\ufeff' + historyApi.toCsv(state.iterations), 'text/csv;charset=utf-8', 'qr-microapps-iterations.csv'); });
  elements.clearHistory.addEventListener('click', function () { state.iterations = []; renderHistory(); setStatus('История сборок очищена.'); });
  $('run-preview').addEventListener('click', runPreview);
  $('stop-preview').addEventListener('click', stopPreview);
  $('reset-preview').addEventListener('click', function () { stopPreview(); setTimeout(runPreview, 30); });
  $('html-file').addEventListener('change', function () { readFile(this, function (text) { elements.source.value = text; refreshDifficultyEditor(); setStatus('HTML-файл загружен.'); }); });
  $('qr-image-file').addEventListener('change', function () { loadQrImage(this); });
  $('spec-file').addEventListener('change', function () { readFile(this, loadSpecText); });
  elements.projectFile.addEventListener('change', function () { readFile(this, openProject); });
  elements.previewPreset.addEventListener('change', applyPreset);
  [elements.previewWidth, elements.previewHeight].forEach(function (input) { input.addEventListener('change', function () { elements.previewPreset.value = 'custom'; applyPreviewSize(); }); });
  [elements.moduleScale, elements.quietZone].forEach(function (input) { input.addEventListener('change', function () { if (elements.source.value.trim()) build(); }); });
  elements.modeSimple.addEventListener('click', function () { setMode('simple', true); });
  elements.modeCode.addEventListener('click', function () { setMode('code', false); });
  elements.specModeForm.addEventListener('click', function () { setSpecEditorMode('form', false); });
  elements.specModeJson.addEventListener('click', function () { setSpecEditorMode('json', false); });
  [
    elements.specTitleInput, elements.specIdInput, elements.specTypeInput,
    elements.specSingleFileInput, elements.specExternalInput, elements.specNetworkInput, elements.specViewportInput,
    elements.specTouchInput, elements.specOverflowInput, elements.specVerticalOverflowInput,
    elements.specTouchSizeInput, elements.specGapInput, elements.specLabelsInput
  ].forEach(function (input) { input.addEventListener('input', updateSpecFromForm); input.addEventListener('change', updateSpecFromForm); });
  [elements.simpleTitle, elements.simpleTheme, elements.simpleBackground, elements.simpleCard, elements.simpleAccent].forEach(function (input) {
    input.addEventListener('input', scheduleSimpleBuild);
    input.addEventListener('change', scheduleSimpleBuild);
  });
  elements.simpleQuestions.addEventListener('input', scheduleSimpleBuild);
  elements.simpleQuestions.addEventListener('change', scheduleSimpleBuild);
  elements.simpleQuestions.addEventListener('click', function (event) {
    var control = event.target.closest('[data-simple-action]');
    if (control && elements.simpleQuestions.contains(control)) changeSimpleStructure(control.dataset.simpleAction, control);
  });
  elements.simpleAddQuestion.addEventListener('click', function () { changeSimpleStructure('add-question', null); });

  applyTheme(getSavedTheme(), false);
  applyPreviewSize();
  renderHistory();
  renderComparison();
  if (deviceTestApi) {
    deviceTestApi.createController({
      QRCode: window.QRCode,
      getCurrent: function () {
        var simpleGame = sample.getById('tiny-quiz');
        var brickGame = sample.getById('brick-breaker');
        return {
          simpleHtml: simpleGame.html,
          brickHtml: brickGame.html
        };
      }
    });
  }
  if (simpleBuilder) writeSimpleConfig(simpleBuilder.DEFAULT_CONFIG);
  populateExamples();
  loadSample(sample.defaultId);
  build().then(runPreview);
})();
