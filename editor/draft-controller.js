(function () {
  'use strict';

  window.QRMicroappsDraftController = {
    create: function (options) {
      var api = window.QRMicroappsDrafts;
      var owner = Date.now().toString(36) + Math.random().toString(36).slice(2);
      var previousOwner = '';
      try {
        previousOwner = sessionStorage.getItem('qr-microapps-draft-tab') || '';
        sessionStorage.setItem('qr-microapps-draft-tab', owner);
      } catch (error) { /* Each open tab still gets an independent autosave. */ }
      var store = api.createStore(function () { return localStorage; }, owner);
      var status = document.getElementById('draft-status');
      var select = document.getElementById('draft-select');
      var restoreButton = document.getElementById('restore-draft');
      var dirty = false;
      var durable = false;
      var restoring = false;
      var timer = 0;
      var lastCheckpoint = '';

      function render() {
        var selected = select.value;
        select.replaceChildren(new Option('Выберите сохранённую версию', ''));
        store.list().forEach(function (record) {
          var title = record.snapshot.mode === 'simple' ? 'Конструктор теста' : 'HTML и проверки';
          try { title = JSON.parse(record.snapshot.fields.spec).title || title; } catch (error) { /* An incomplete profile is a valid draft. */ }
          select.add(new Option(new Date(record.savedAt).toLocaleString('ru-RU') + ' · ' + record.label + ' · ' + String(title).slice(0, 60), record.id));
        });
        select.value = selected;
        restoreButton.disabled = !select.value;
      }

      function flush() {
        clearTimeout(timer);
        if (!dirty || restoring) return;
        try { durable = store.save(options.read(), 'Автосохранение', false); }
        catch (error) { durable = false; }
        status.textContent = durable ? 'Черновик сохранён в этом браузере' : 'Автосохранение недоступно — скачайте черновик';
        status.classList.toggle('draft-warning', !durable);
        render();
      }

      function changed() {
        if (restoring) return;
        dirty = true;
        durable = false;
        clearTimeout(timer);
        status.textContent = 'Сохраняю изменения…';
        timer = setTimeout(flush, 300);
      }

      function checkpoint(label) {
        if (restoring) return;
        var snapshot = options.read();
        var signature = JSON.stringify(snapshot);
        if (signature === lastCheckpoint) return;
        lastCheckpoint = signature;
        store.save(snapshot, label, true);
        render();
      }

      function restore(record, initial) {
        if (!record) return false;
        if (!initial) checkpoint('Перед восстановлением');
        restoring = true;
        try { options.restore(record.snapshot); }
        finally { restoring = false; }
        dirty = true;
        flush();
        options.status('Черновик восстановлен. Код не запущен; нажмите «Проверить и создать QR» для проверки.');
        return true;
      }

      select.addEventListener('change', function () { restoreButton.disabled = !select.value; });
      restoreButton.addEventListener('click', function () { restore(store.list().find(function (record) { return record.id === select.value; }), false); });
      document.getElementById('download-draft').addEventListener('click', function () {
        try {
          options.download(api.serialize(options.read()), 'application/json;charset=utf-8', 'microapp.qrdraft.json');
          options.status('Черновик скачан. Он сохраняет исходник и незавершённые поля без проверки.');
        } catch (error) { options.status(error.message, 'bad'); }
      });
      ['input', 'change'].forEach(function (name) {
        document.addEventListener(name, function (event) { if (options.isInput(event.target)) changed(); });
      });
      document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
      window.addEventListener('pagehide', flush);
      window.addEventListener('beforeunload', function (event) {
        flush();
        if (dirty && !durable) { event.preventDefault(); event.returnValue = ''; }
      });
      window.addEventListener('storage', function (event) { if (!event.key || event.key.indexOf(api.PREFIX) === 0) render(); });
      render();

      return { changed: changed, checkpoint: checkpoint, flush: flush,
        restoreLatest: function () { return restore(store.latest(previousOwner), true); },
        importText: function (text) { return restore({ snapshot: api.parse(text) }, false); } };
    }
  };
})();
