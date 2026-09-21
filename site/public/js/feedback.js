// Feedback form: submit as JSON to the API and show the outcome without leaving the page.
(function () {
  'use strict';

  var form = document.getElementById('feedback-form');
  if (!form) return;

  // Which page is the feedback about? The page that linked here (same site only), else "/".
  var pageField = document.getElementById('feedback-page');
  try {
    var from = new URLSearchParams(window.location.search).get('page') || (document.referrer ? new URL(document.referrer).pathname : '');
    if (from && /^\/[A-Za-z0-9\-_\/]*$/.test(from)) pageField.value = from;
  } catch (e) { /* keep "/" */ }

  var status = document.getElementById('feedback-status');
  var button = form.querySelector('button[type=submit]');

  function show(kind, text) {
    status.textContent = '';
    var alert = document.createElement('div');
    alert.className = 'usa-alert usa-alert--' + kind + ' usa-alert--slim';
    var body = document.createElement('div'); body.className = 'usa-alert__body';
    var p = document.createElement('p'); p.className = 'usa-alert__text'; p.textContent = text;
    body.appendChild(p); alert.appendChild(body); status.appendChild(alert);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    var data = new FormData(form);
    var payload = {
      page: data.get('page') || '/',
      rating: Number(data.get('rating')),
      message: (data.get('message') || '').toString(),
      website: (data.get('website') || '').toString(),
    };
    var email = (data.get('email') || '').toString().trim();
    if (email) payload.email = email;

    button.disabled = true;
    var label = button.textContent;
    button.textContent = form.getAttribute('data-sending');

    fetch(form.getAttribute('data-api') + '/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (r.status === 429) { show('warning', form.getAttribute('data-too-many')); return null; }
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (result) {
        if (!result) return;
        show('success', form.getAttribute('data-thanks') + ' ' + form.getAttribute('data-reference') + ': ' + result.id);
        form.reset();
        pageField.value = payload.page;
      })
      .catch(function () { show('error', form.getAttribute('data-error')); })
      .finally(function () { button.disabled = false; button.textContent = label; });
  });
})();
