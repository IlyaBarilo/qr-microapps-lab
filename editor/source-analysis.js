(function (root, factory) {
  var commonjs = typeof module === 'object' && module.exports;
  var api = factory(commonjs ? require('./vendor/parse5.js') : root.QRMicroappsHtmlParser,
    commonjs ? require('./vendor/acorn.js') : root.acorn, commonjs ? require('./vendor/csstree.js') : root.csstree);
  if (commonjs) module.exports = api;
  else root.QRMicroappsSourceAnalysis = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (parser, acorn, csstree) {
  'use strict';

  function attribute(node, name) {
    var found = (node.attrs || []).find(function (item) { return (item.prefix ? item.prefix + ':' : '') + item.name === name; });
    return found ? found.value : '';
  }
  function text(node) { return (node.childNodes || []).filter(function (child) { return child.nodeName === '#text'; }).map(function (child) { return child.value; }).join(''); }
  function localUrl(value) { return /^(?:data:|blob:|#|about:blank$)/i.test(value.trim()); }
  function add(list, value) { if (list.indexOf(value) < 0) list.push(value); }

  // The URL token may contain commas (notably in data URLs). Descriptors end at
  // a comma outside parentheses, as in the HTML srcset parsing algorithm.
  function srcsetUrls(value) {
    var urls = [];
    var at = 0;
    while (at < value.length) {
      while (/[\t\n\f\r ,]/.test(value[at] || '') && at < value.length) at++;
      var start = at;
      while (at < value.length && !/[\t\n\f\r ]/.test(value[at])) at++;
      var url = value.slice(start, at);
      if (!url) break;
      urls.push(url.replace(/,+$/, ''));
      if (/,$/.test(url)) continue;
      var depth = 0;
      while (at < value.length) {
        var character = value[at++];
        if (character === '(') depth++;
        if (character === ')') depth = Math.max(0, depth - 1);
        if (character === ',' && !depth) break;
      }
    }
    return urls;
  }

  function expressionPath(node) {
    if (!node) return '';
    if (node.type === 'ChainExpression') return expressionPath(node.expression);
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'MemberExpression') {
      var property = !node.computed && node.property.type === 'Identifier' ? node.property.name :
        node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string' ? node.property.value : '';
      var parent = expressionPath(node.object);
      return parent && property ? parent + '.' + property : '';
    }
    return '';
  }

  function analyze(html, depth) {
    var result = { doctypes: 0, hasUtf8: false, viewports: [], external: [], network: [], dialogs: [], touch: false, unparsed: [] };
    var engine = new parser.Parser({ scriptingEnabled: true });
    var onDoctype = engine.onDoctype;
    engine.onDoctype = function (token) { result.doctypes++; return onDoctype.call(this, token); };
    engine.tokenizer.write(String(html), true);
    var document = engine.document;
    var urlsByTag = { script: ['src'], link: ['href', 'imagesrcset'], img: ['src', 'srcset'], iframe: ['src'],
      audio: ['src'], video: ['src', 'poster'], source: ['src', 'srcset'], track: ['src'], object: ['data'], embed: ['src'],
      input: ['src', 'formaction'], button: ['formaction'], image: ['href', 'xlink:href'], use: ['href', 'xlink:href'],
      a: ['href', 'ping'], area: ['href', 'ping'], form: ['action'], base: ['href'] };

    function external(value, label) { if (value.trim() && !localUrl(value)) add(result.external, label + ' → ' + value.trim().slice(0, 120)); }

    function css(source, inline) {
      try {
        var ast = csstree.parse(source, { context: inline ? 'declarationList' : 'stylesheet', onParseError: function (error) { throw error; } });
        csstree.walk(ast, function (node) {
          if (node.type === 'Url') external(node.value, 'CSS url()');
          if (node.type === 'Atrule' && node.name.toLowerCase() === 'import' && node.prelude) {
            var first = node.prelude.children.first;
            if (first && first.type === 'String') external(first.value, 'CSS @import');
          }
        });
      } catch (error) { add(result.unparsed, 'CSS: ' + error.message); }
    }

    function javascript(source, type) {
      var ast;
      try { ast = acorn.parse(type === 'handler' ? 'function handler(event){\n' + source + '\n}' : source,
        { ecmaVersion: 'latest', sourceType: type === 'module' ? 'module' : 'script' }); }
      catch (error) { add(result.unparsed, 'JavaScript: ' + error.message); return; }
      var stack = [ast];
      while (stack.length) {
        var node = stack.pop();
        if (!node || typeof node.type !== 'string') continue;
        if (node.type === 'CallExpression' || node.type === 'NewExpression') {
          var path = expressionPath(node.callee).replace(/^(?:window|globalThis|self)\./, '');
          var names = { fetch: 'fetch()', XMLHttpRequest: 'XMLHttpRequest', WebSocket: 'WebSocket', EventSource: 'EventSource',
            'navigator.sendBeacon': 'sendBeacon()', importScripts: 'importScripts()', open: 'window.open()' };
          if (Object.prototype.hasOwnProperty.call(names, path)) add(result.network, names[path]);
          if (/^(?:document\.)?location\.(?:assign|replace)$/.test(path)) add(result.network, 'переход через location');
          if (/^(alert|confirm|prompt)$/.test(path)) add(result.dialogs, path + '()');
          if (/(?:^|\.)addEventListener$/.test(path) && node.arguments[0] && /^(click|pointerdown|pointerup|touchstart|touchend)$/.test(node.arguments[0].value)) result.touch = true;
          if (path === 'eval' || path === 'Function') add(result.unparsed, 'Динамически создаваемый JavaScript требует проверки при запуске.');
        }
        if (node.type === 'AssignmentExpression') {
          var target = expressionPath(node.left).replace(/^(?:window|globalThis|self)\./, '');
          if (/^(?:document\.)?location(?:\.href)?$/.test(target)) add(result.network, 'переход через location');
          if (/(?:^|\.)(?:onclick|onpointerdown|onpointerup|ontouchstart|ontouchend)$/.test(target)) result.touch = true;
        }
        if (node.type === 'ImportExpression') add(result.network, 'динамический import()');
        if (/^(ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration)$/.test(node.type) && node.source) external(node.source.value, 'JavaScript import');
        Object.keys(node).forEach(function (key) {
          var value = node[key];
          if (Array.isArray(value)) value.forEach(function (child) { if (child && child.type) stack.push(child); });
          else if (value && value.type) stack.push(value);
        });
      }
    }

    var stack = [{ node: document, inert: false }];
    while (stack.length) {
      var entry = stack.pop();
      var node = entry.node;
      var tag = node.tagName;
      if (tag) {
        var htmlElement = node.namespaceURI === 'http://www.w3.org/1999/xhtml';
        if (tag === 'meta' && htmlElement && !entry.inert) {
          if (attribute(node, 'charset').trim().toLowerCase() === 'utf-8') result.hasUtf8 = true;
          if (attribute(node, 'name').trim().toLowerCase() === 'viewport') result.viewports.push(attribute(node, 'content'));
          if (attribute(node, 'http-equiv').trim().toLowerCase() === 'refresh') {
            var content = attribute(node, 'content');
            var refresh = /(?:^|;)\s*url\s*=\s*["']?([^"']*)/i.exec(content);
            if (refresh) external(refresh[1], 'meta[refresh]');
            else add(result.external, 'meta[refresh] → ' + content);
          }
        }
        (urlsByTag[tag] || []).forEach(function (name) {
          var value = attribute(node, name);
          if (tag === 'base' && value) add(result.external, 'base[href]');
          var values = /srcset$/.test(name) ? srcsetUrls(value) : name === 'ping' ? value.split(/\s+/) : [value];
          values.forEach(function (url) { external(url, tag + '[' + name + ']'); });
        });
        if (tag === 'style' && (!attribute(node, 'type') || attribute(node, 'type').toLowerCase() === 'text/css')) css(text(node), false);
        if (attribute(node, 'style')) css(attribute(node, 'style'), true);
        if (tag === 'script') {
          var type = attribute(node, 'type').trim().toLowerCase();
          if (/^(|module|text\/javascript|application\/javascript)$/.test(type)) javascript(text(node), type);
        }
        (node.attrs || []).forEach(function (item) {
          if (/^on[a-z]+$/.test(item.name)) javascript(item.value, 'handler');
          if (/^(onclick|onpointerdown|onpointerup|ontouchstart|ontouchend)$/.test(item.name) && !entry.inert) result.touch = true;
        });
        if (tag === 'button' && !entry.inert) result.touch = true;
        if (tag === 'iframe' && attribute(node, 'srcdoc')) {
          if ((depth || 0) >= 3) add(result.unparsed, 'Слишком много уровней вложенного HTML.');
          else {
            var nested = analyze(attribute(node, 'srcdoc'), (depth || 0) + 1);
            ['external', 'network', 'dialogs', 'unparsed'].forEach(function (key) { nested[key].forEach(function (value) { add(result[key], value); }); });
          }
        }
      }
      (node.childNodes || []).slice().reverse().forEach(function (child) { stack.push({ node: child, inert: entry.inert }); });
      // Template contents may later be inserted into the document, so inspect
      // dependencies there, but do not count their metadata as document metadata.
      if (node.content) stack.push({ node: node.content, inert: true });
    }
    return result;
  }

  return { analyze: analyze, srcsetUrls: srcsetUrls };
});
