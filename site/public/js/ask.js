// "Ask the embassy" page: check the assistant is enabled, send the question, render the answer
// with its sources. Everything rendered is created with textContent / createElement, never
// innerHTML, so a model answer can't inject markup into the page.
(function () {
  'use strict';

  var form = document.getElementById('ask-form');
  if (!form) return;

  var api = form.getAttribute('data-api');
  var lang = form.getAttribute('data-lang') || 'en';
  var status = document.getElementById('ask-status');
  var answerBox = document.getElementById('ask-answer');
  var button = document.getElementById('ask-submit');
  var field = document.getElementById('ask-question');

  // An example question links to ?q=... ; fill the box from it so the visitor reads the question
  // before sending it. Deliberately not auto-submitted - following a link should not fire a
  // request on arrival - and clamped to the same 300 characters the API accepts.
  var preset = new URLSearchParams(window.location.search).get('q');
  if (preset) {
    field.value = preset.slice(0, 300);
    field.focus();
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) { node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return node;
  }

  function alert(kind, text) {
    return el('div', { class: 'usa-alert usa-alert--' + kind + ' usa-alert--slim' }, [
      el('div', { class: 'usa-alert__body' }, [el('p', { class: 'usa-alert__text' }, [text])]),
    ]);
  }

  function setStatus(node) { status.textContent = ''; if (node) status.appendChild(node); }

  // 1. Is the assistant available here? If not, say so and disable the form.
  fetch(api + '/ask/status')
    .then(function (r) { return r.json(); })
    .then(function (s) {
      if (!s.enabled) {
        setStatus(alert('info', form.getAttribute('data-disabled')));
        field.disabled = true;
        button.disabled = true;
      }
    })
    .catch(function () { setStatus(alert('error', form.getAttribute('data-error'))); });

  // 2. Ask.
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var question = field.value.trim();
    button.disabled = true;
    answerBox.textContent = '';
    setStatus(el('p', { class: 'text-base-dark' }, [form.getAttribute('data-thinking')]));

    fetch(api + '/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question, lang: lang }),
    })
      .then(function (r) {
        if (r.status === 429) { throw new Error('rate'); }
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .then(function (data) {
        setStatus(alert(data.grounded ? 'success' : 'warning',
          form.getAttribute(data.grounded ? 'data-grounded' : 'data-not-grounded')));
        // Answer text: citation markers like [2] become links to the matching source.
        var p = el('p', { class: 'usa-prose font-body-lg' });
        var parts = data.answer.split(/(\[\d+\])/);
        parts.forEach(function (part) {
          var m = /^\[(\d+)\]$/.exec(part);
          var src = m && data.sources.filter(function (s) { return String(s.n) === m[1]; })[0];
          p.appendChild(src ? el('a', { class: 'usa-link', href: src.url, title: src.title }, [part]) : document.createTextNode(part));
        });
        answerBox.appendChild(p);
        if (data.sources.length) {
          answerBox.appendChild(el('h2', { class: 'font-heading-sm margin-top-3' }, [form.getAttribute('data-sources')]));
          var list = el('ol', { class: 'usa-list' });
          data.sources.forEach(function (s) {
            list.appendChild(el('li', {}, [el('a', { class: 'usa-link', href: s.url }, [s.title + (s.section && s.section !== s.title ? ' › ' + s.section : '')])]));
          });
          answerBox.appendChild(list);
        }
      })
      .catch(function () { setStatus(alert('error', form.getAttribute('data-error'))); })
      .finally(function () { button.disabled = false; });
  });
})();
