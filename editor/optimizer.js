(function (root, factory) {
  var commonjs = typeof module === 'object' && module.exports;
  var api = factory(commonjs ? require('./vendor/acorn.js') : root.acorn, commonjs ? require('./vendor/csstree.js') : root.csstree);
  if (commonjs) module.exports = api;
  else root.QRMicroappsOptimizer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (acorn, csstree) {
  'use strict';

  function astSignature(ast) {
    return JSON.stringify(ast, function (key, value) {
      return key === 'start' || key === 'end' || key === 'loc' ? undefined : value;
    });
  }

  function compactJavaScript(source, moduleScript) {
    if (!acorn) return source;
    try {
      var tokens = [];
      var options = { ecmaVersion: 'latest', sourceType: moduleScript ? 'module' : 'script', onToken: tokens };
      var original = acorn.parse(source, options);
      var output = '';
      var cursor = 0;
      tokens.forEach(function (token) {
        var gap = source.slice(cursor, token.start);
        if (/^\s+$/.test(gap)) {
          var previous = output.slice(-1);
          var following = source[token.start] || '';
          if (/[\r\n\u2028\u2029]/.test(gap)) {
            gap = previous && !/[\[(,;:]$/.test(previous) && !/[\]),;:]/.test(following) ? '\n' : '';
          } else {
            gap = previous && !/[\[\](){};,=:]/.test(previous) && !/[\[\](){};,=:]/.test(following) ? ' ' : '';
          }
        }
        output += gap + source.slice(token.start, token.end);
        cursor = token.end;
      });
      output = (output + source.slice(cursor)).trim();
      // Token gaps must not change ASI, operators or the syntax tree.
      var candidate = acorn.parse(output, { ecmaVersion: 'latest', sourceType: options.sourceType });
      return output.length <= source.length && astSignature(original) === astSignature(candidate) ? output : source;
    } catch (error) {
      // Unknown syntax remains available to the browser without rewriting it.
      return source;
    }
  }

  function compactCss(source) {
    if (!csstree) return source;
    try {
      var ast = csstree.parse(source, { onParseError: function (error) { throw error; } });
      var output = csstree.generate(ast);
      return output.length <= source.length ? output : source;
    } catch (error) { return source; }
  }

  function tagAt(source, start) {
    var match = /^<\/?([a-z][\w:-]*)\b/i.exec(source.slice(start));
    if (!match) return null;
    var quote = '';
    for (var i = start + match[0].length; i < source.length; i++) {
      var character = source[i];
      if (quote) { if (character === quote) quote = ''; }
      else if (character === '"' || character === "'") quote = character;
      else if (character === '>') return { name: match[1].toLowerCase(), end: i + 1, closing: source[start + 1] === '/' };
    }
    return null;
  }

  function compactTag(tag) {
    var quote = '';
    var output = '';
    for (var i = 0; i < tag.length; i++) {
      var character = tag[i];
      if (quote) {
        output += character;
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
        output += character;
      } else if (/[\t\n\f\r ]/.test(character)) {
        if (output.slice(-1) !== ' ') output += ' ';
      } else output += character;
    }
    return output;
  }

  function attribute(tag, name) {
    var cursor = /^<[^\s/>]+/.exec(tag)[0].length;
    while (cursor < tag.length) {
      var rest = tag.slice(cursor);
      var match = /^[\t\n\f\r /]*([^\s=/>]+)(?:[\t\n\f\r ]*=[\t\n\f\r ]*(?:"([^"]*)"|'([^']*)'|([^\t\n\f\r >]*)))?/.exec(rest);
      if (!match) break;
      if (match[1].toLowerCase() === name) return match[2] || match[3] || match[4] || '';
      cursor += match[0].length;
    }
    return '';
  }

  function optimizeHtml(value, options) {
    var source = String(value == null ? '' : value);
    var output = '';
    var cursor = 0;
    if (!options || options.enabled !== false) {
      while (cursor < source.length) {
        var start = source.indexOf('<', cursor);
        if (start < 0) break;
        output += source.slice(cursor, start);
        if (source.slice(start, start + 4) === '<!--') {
          var commentEnd = source.indexOf('-->', start + 4);
          if (commentEnd < 0) { cursor = start; break; }
          output += source.slice(start, commentEnd + 3);
          cursor = commentEnd + 3;
          continue;
        }
        var tag = tagAt(source, start);
        if (!tag) { output += '<'; cursor = start + 1; continue; }
        var opening = source.slice(start, tag.end);
        output += compactTag(opening);
        cursor = tag.end;
        if (!tag.closing && /^(script|style|pre|textarea|title|template|svg|math|xmp|iframe|noembed|noframes|plaintext)$/.test(tag.name)) {
          // Keep opaque regions intact, including nested templates and SVG.
          if (/^(pre|template|svg|math|plaintext)$/.test(tag.name)) {
            output += source.slice(cursor);
            cursor = source.length;
            break;
          }
          var closing = new RegExp('</' + tag.name + '[\t\n\f\r />]', 'ig');
          closing.lastIndex = cursor;
          var found = closing.exec(source);
          if (!found) break;
          var content = source.slice(cursor, found.index);
          var type = attribute(opening, 'type').toLowerCase();
          if (tag.name === 'script' && /<script\b/i.test(content)) return optimizeHtml(source, { enabled: false });
          if (tag.name === 'style' && (!type || type === 'text/css')) content = compactCss(content);
          if (tag.name === 'script' && /^(|module|text\/javascript|application\/javascript)$/.test(type)) content = compactJavaScript(content, type === 'module');
          output += content;
          cursor = found.index;
        }
      }
      output = (output + source.slice(cursor)).trim();
    } else output = source;
    var originalBytes = new TextEncoder().encode(source).length;
    var optimizedBytes = new TextEncoder().encode(output).length;
    var savedBytes = Math.max(0, originalBytes - optimizedBytes);
    return { html: output, originalBytes: originalBytes, optimizedBytes: optimizedBytes, savedBytes: savedBytes,
      savedPercent: originalBytes ? savedBytes / originalBytes * 100 : 0, commentsRemoved: 0, changed: output !== source };
  }

  return { optimizeHtml: optimizeHtml, compactCss: compactCss };
});
