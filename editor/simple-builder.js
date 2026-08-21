(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QRMicroappsSimple = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_CONFIG = {
    title: 'Мой ИТ-тест',
    theme: 'balanced',
    qr: { encoding: 'base64', ecc: 'M' },
    colors: { background: '#071d2b', card: '#0d3042', accent: '#64e6d4' },
    questions: [
      { prompt: 'Что защищает аккаунт?', answers: ['Пароль', 'Монитор'], correct: 0 },
      { prompt: 'Какой код выполняет браузер?', answers: ['JavaScript', 'SQL'], correct: 0 },
      { prompt: 'Что проверяет брандмауэр?', answers: ['Трафик', 'Яркость'], correct: 0 }
    ]
  };

  function text(value, fallback, limit) {
    value = String(value == null ? '' : value).trim();
    return (value || fallback).slice(0, limit);
  }

  function color(value, fallback) {
    value = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
  }

  function theme(value, fallback) {
    value = String(value || '');
    return ['compact', 'balanced', 'expressive'].indexOf(value) >= 0 ? value : fallback;
  }

  function option(value, allowed, fallback) {
    value = String(value || '');
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  function normalizeConfig(input) {
    input = input || {};
    var defaults = cloneDefaults();
    var colors = input.colors || {};
    var qr = input.qr || {};
    var questions = Array.isArray(input.questions) ? input.questions : [];
    if (!questions.length) questions = defaults.questions;
    return {
      title: text(input.title, defaults.title, 28),
      theme: theme(input.theme, defaults.theme),
      qr: {
        encoding: option(qr.encoding, ['base64', 'percent'], defaults.qr.encoding),
        ecc: option(qr.ecc, ['L', 'M', 'Q', 'H'], defaults.qr.ecc)
      },
      colors: {
        background: color(colors.background, defaults.colors.background),
        card: color(colors.card, defaults.colors.card),
        accent: color(colors.accent, defaults.colors.accent)
      },
      questions: questions.map(function (question, index) {
        question = question || {};
        var fallback = defaults.questions[index] || {
          prompt: 'Вопрос ' + (index + 1),
          answers: ['Вариант 1', 'Вариант 2'],
          correct: 0
        };
        var answers = Array.isArray(question.answers) ? question.answers : [];
        var answerCount = Math.max(2, answers.length);
        var normalizedAnswers = [];
        for (var answerIndex = 0; answerIndex < answerCount; answerIndex++) {
          normalizedAnswers.push(text(answers[answerIndex], fallback.answers[answerIndex] || 'Вариант ' + (answerIndex + 1), 24));
        }
        var correct = Math.round(Number(question.correct));
        if (!Number.isFinite(correct) || correct < 0 || correct >= normalizedAnswers.length) correct = 0;
        return {
          prompt: text(question.prompt, fallback.prompt, 48),
          answers: normalizedAnswers,
          correct: correct
        };
      })
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function safeJson(value) {
    return JSON.stringify(value).replace(/[<>&]/g, function (character) {
      return { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026' }[character];
    });
  }

  function createStyle(config) {
    var colors = config.colors;
    if (config.theme === 'compact') {
      return '*{box-sizing:border-box}body{margin:0;padding:12px;background:' + colors.background + ';color:#fff;font:16px system-ui}main{max-width:400px;margin:auto;padding:12px;background:' + colors.card + '}h1{font-size:22px}button{width:100%;min-height:44px;margin:6px 0;border:0;padding:8px;background:' + colors.accent + ';color:#04202a;font-weight:bold}';
    }
    if (config.theme === 'expressive') {
      return '*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at top,' + colors.accent + ',' + colors.background + ' 58%);color:#fff;font-family:system-ui}main{width:min(100%,420px);padding:26px;border:1px solid ' + colors.accent + ';border-radius:28px;background:' + colors.card + ';box-shadow:0 22px 60px #0008}h1{margin:0 0 20px;font-size:28px;letter-spacing:-.04em}#q{font-size:19px;line-height:1.4}#s{color:' + colors.accent + ';font-weight:700}button{width:100%;min-height:54px;margin-top:11px;border:0;border-radius:16px;padding:10px 14px;background:linear-gradient(135deg,' + colors.accent + ',#fff);color:#04202a;font:750 17px system-ui;box-shadow:0 7px 18px #0005;transition:.15s}button:active{transform:scale(.98)}';
    }
    return '*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:18px;background:' + colors.background + ';color:#effaff;font-family:system-ui}main{width:min(100%,400px);padding:22px;border-radius:22px;background:' + colors.card + '}h1{margin:0 0 18px}button{width:100%;min-height:52px;margin-top:10px;border:0;border-radius:14px;background:' + colors.accent + ';color:#04202a;font:700 17px system-ui}';
  }

  function createHtml(input) {
    var config = normalizeConfig(input);
    var questions = config.questions.map(function (question) {
      return [question.prompt, question.answers, question.correct];
    });
    return '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>' + createStyle(config) + '</style><main><h1>' + escapeHtml(config.title) + '</h1><p id=q></p><div id=a></div><p id=s></p></main><script>Q=' + safeJson(questions) + ';n=k=0;l=Q.length;B=(t,f)=>{b=document.createElement(\'button\');b.textContent=t;b.onclick=f;a.append(b)};R=_=>{a.innerHTML=\'\';if(n==l){q.textContent=\'Результат: \'+k+\' из \'+l;B(\'Пройти ещё раз\',_=>{n=k=0;R()});s.textContent=k==l?\'Отлично!\':\'Попробуй ещё\';return}q.textContent=Q[n][0];Q[n][1].map((t,i)=>B(t,_=>A(i)));s.textContent=\'Вопрос \'+(n+1)+\' из \'+l};A=x=>{k+=x==Q[n][2];n++;R()};R()</script>\n';
  }

  function createSpec(input) {
    var config = normalizeConfig(input);
    return {
      schemaVersion: '0.1', id: 'simple-quiz', title: config.title, type: 'quiz',
      qr: { encoding: config.qr.encoding, ecc: config.qr.ecc },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true, minTouchTargetPx: 44, minControlGapPx: 8, requireControlLabels: true }
    };
  }

  function build(input) {
    var config = normalizeConfig(input);
    return { config: config, html: createHtml(config), spec: createSpec(config) };
  }

  return {
    DEFAULT_CONFIG: cloneDefaults(),
    normalizeConfig: normalizeConfig,
    escapeHtml: escapeHtml,
    createStyle: createStyle,
    createHtml: createHtml,
    createSpec: createSpec,
    build: build
  };
});
