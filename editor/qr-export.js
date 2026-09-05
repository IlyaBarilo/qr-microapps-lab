(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QRMicroappsQrExport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function escapeXml(value) {
    // XML 1.0 cannot contain lone surrogates or most control characters.
    return Array.from(String(value == null ? '' : value)).filter(function (character) {
      var code = character.codePointAt(0);
      return code === 9 || code === 10 || code === 13 || code >= 32 && code <= 0xD7FF ||
        code >= 0xE000 && code <= 0xFFFD || code >= 0x10000 && code <= 0x10FFFF;
    }).join('').replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character];
    });
  }

  function geometry(modules, quietZone, sizeMm) {
    if (!Number.isInteger(modules) || modules < 21 || modules > 177 || (modules - 17) % 4) throw new Error('Некорректный размер матрицы QR.');
    if (!Number.isInteger(quietZone) || quietZone < 0 || quietZone > 16) throw new Error('Белое поле должно содержать от 0 до 16 модулей.');
    if (!Number.isFinite(sizeMm) || sizeMm < 20 || sizeMm > 180) throw new Error('Задайте размер QR от 20 до 180 мм.');
    var totalModules = modules + 2 * quietZone;
    return { modules: modules, quietZone: quietZone, totalModules: totalModules, sizeMm: sizeMm,
      moduleMm: sizeMm / totalModules, marginMm: quietZone * sizeMm / totalModules };
  }

  function toSvg(matrix, options) {
    options = options || {};
    if (!Array.isArray(matrix)) throw new Error('Матрица QR отсутствует.');
    var layout = geometry(matrix.length, options.quietZone, options.sizeMm == null ? 100 : options.sizeMm);
    var commands = [];
    matrix.forEach(function (row, y) {
      if (!Array.isArray(row) || row.length !== matrix.length || row.some(function (cell) { return typeof cell !== 'boolean'; })) {
        throw new Error('Матрица QR должна быть квадратной и содержать логические значения.');
      }
      for (var x = 0; x < row.length; x++) {
        if (!row[x]) continue;
        var start = x;
        while (x + 1 < row.length && row[x + 1]) x++;
        commands.push('M' + (start + layout.quietZone) + ' ' + (y + layout.quietZone) + 'h' + (x - start + 1) + 'v1H' + (start + layout.quietZone) + 'z');
      }
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + layout.sizeMm + 'mm" height="' + layout.sizeMm +
      'mm" viewBox="0 0 ' + layout.totalModules + ' ' + layout.totalModules + '" role="img" aria-label="' + escapeXml(options.title || 'QR-код') +
      '" shape-rendering="crispEdges">\r\n<title>' + escapeXml(options.title || 'QR-код') + '</title>\r\n' +
      '<rect width="' + layout.totalModules + '" height="' + layout.totalModules + '" fill="#fff"/>\r\n' +
      '<path d="' + commands.join('') + '" fill="#000"/>\r\n</svg>\r\n';
  }

  function createController(options) {
    var $ = function (id) { return document.getElementById(id); };
    var dialog = $('qr-print-dialog');
    var title = $('qr-print-title');
    var instruction = $('qr-print-instruction');
    var size = $('qr-print-size');
    var sheet = $('qr-print-sheet');
    var stage = $('qr-print-stage');
    var wrapper = $('qr-print-sheet-wrap');
    var code = $('qr-print-code');
    var message = $('qr-print-message');
    var print = $('qr-print-confirm');
    var current = null;
    var revision = '';
    var pending = 0;
    var lastFocus = null;
    var defaults = 'Наведите камеру телефона на QR-код и откройте приложение.\nЕсли код показан как текст, используйте «Открыть как сайт» для полного адреса data:.';

    function fit() {
      if (!dialog.open) return;
      var width = sheet.offsetWidth;
      if (!width) return;
      var scale = Math.min(1, stage.clientWidth / width);
      sheet.style.setProperty('--qr-sheet-scale', String(scale));
      wrapper.style.width = width * scale + 'px';
      wrapper.style.height = sheet.offsetHeight * scale + 'px';
    }

    function update() {
      cancelAnimationFrame(pending);
      if (!current) return false;
      print.disabled = true;
      message.textContent = '';
      code.replaceChildren();
      $('qr-print-heading').textContent = title.value;
      $('qr-print-copy').textContent = instruction.value;
      try {
        if (!title.value.trim()) throw new Error('Введите название для печатного листа.');
        var quiet = Math.max(4, current.quietZone);
        var layout = geometry(current.matrix.length, quiet, Number(size.value));
        code.innerHTML = toSvg(current.matrix, { quietZone: quiet, sizeMm: layout.sizeMm, title: title.value });
        $('qr-print-geometry').textContent = 'Модуль: ' + layout.moduleMm.toFixed(3).replace('.', ',') + ' мм · белое поле: ' + quiet + ' мод.';
        $('qr-print-margin-note').textContent = current.quietZone < 4 ? 'На печатном листе белое поле увеличено до 4 модулей. Скачиваемые PNG и SVG сохраняют исходную рамку.' : '';
        fit();
        if (sheet.scrollHeight > sheet.clientHeight + 1 || sheet.scrollWidth > sheet.clientWidth + 1) {
          throw new Error('Текст и QR не помещаются на одном листе. Сократите инструкцию или уменьшите QR.');
        }
        print.disabled = false;
        return true;
      } catch (error) {
        message.textContent = error.message;
        return false;
      }
    }

    function schedule() {
      print.disabled = true;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(update);
    }

    function close() {
      cancelAnimationFrame(pending);
      if (dialog.open) dialog.close();
      document.body.classList.remove('qr-print-open');
    }

    function open() {
      var next = options.getCurrent();
      if (!next) return;
      if (revision !== next.revision) {
        title.value = next.title;
        instruction.value = defaults;
        revision = next.revision;
      }
      current = next;
      lastFocus = $('print-qr');
      document.body.classList.add('qr-print-open');
      dialog.showModal();
      update();
    }

    $('print-qr').addEventListener('click', open);
    $('qr-print-close').addEventListener('click', close);
    dialog.addEventListener('close', function () {
      document.body.classList.remove('qr-print-open');
      if (lastFocus && lastFocus.isConnected && !lastFocus.disabled) lastFocus.focus();
    });
    dialog.addEventListener('click', function (event) {
      var bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) close();
    });
    [title, instruction, size].forEach(function (input) { input.addEventListener('input', schedule); });
    print.addEventListener('click', function () { if (update()) window.print(); });
    window.addEventListener('beforeprint', function () { if (dialog.open) update(); });
    window.addEventListener('afterprint', fit);
    window.addEventListener('resize', fit);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(stage);
    return { close: close, invalidate: function () { close(); current = null; } };
  }

  return { toSvg: toSvg, geometry: geometry, createController: createController };
});
