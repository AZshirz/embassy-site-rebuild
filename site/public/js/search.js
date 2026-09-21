// Search page: read ?q= from the URL, ask the API, render results. Progressive enhancement:
// the form itself works without this file; this only fills in the results.
(function () {
  'use strict';

  var box = document.getElementById('search-results');
  if (!box) return;

  var q = new URLSearchParams(window.location.search).get('q');
  var field = document.getElementById('search-page-field');
  if (field && q) field.value = q;
  if (!q || q.trim().length < 2) return;

  var api = box.getAttribute('data-api');
  var lang = box.getAttribute('data-lang') || 'en';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) { node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return node;
  }

  box.textContent = '';
  box.appendChild(el('p', { class: 'text-base-dark' }, ['…']));

  fetch(api + '/search?' + new URLSearchParams({ q: q.trim(), lang: lang, limit: '10' }))
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      box.textContent = '';
      box.appendChild(el('h2', { class: 'font-heading-lg' }, [box.getAttribute('data-results-for') + ': “' + data.query + '” (' + data.count + ')']));
      if (!data.count) {
        box.appendChild(el('p', {}, [box.getAttribute('data-no-results')]));
        return;
      }
      var list = el('ul', { class: 'usa-collection' });
      data.results.forEach(function (r) {
        var meta = el('div', { class: 'usa-collection__meta' }, [el('span', { class: 'usa-collection__meta-item' }, [r.title + (r.section && r.section !== r.title ? ' › ' + r.section : '')])]);
        var body = el('div', { class: 'usa-collection__body' }, [
          el('h3', { class: 'usa-collection__heading' }, [el('a', { class: 'usa-link', href: r.url }, [r.section || r.title])]),
          el('p', { class: 'usa-collection__description' }, [r.snippet]),
          meta,
        ]);
        list.appendChild(el('li', { class: 'usa-collection__item' }, [body]));
      });
      box.appendChild(list);
    })
    .catch(function () {
      box.textContent = '';
      box.appendChild(el('p', { class: 'usa-alert usa-alert--error usa-alert--slim' }, [el('span', { class: 'usa-alert__text' }, [box.getAttribute('data-error')])]));
    });
})();
