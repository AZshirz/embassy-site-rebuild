// Small progressive enhancements. The site works fully without this file;
// it only adds an "Open now / Closed now" badge computed in Baku local time.
(function () {
  'use strict';

  // Two of these: one in the header on every page, one beside the hours table on the home page.
  // Each carries its own data attributes, so this code needs no knowledge of where it sits.
  var badges = document.querySelectorAll('[data-hours-status]');
  if (!badges.length) return;

  // Work out the weekday and minute-of-day in the embassy's time zone, once, rather than per
  // badge - all of them are asking the same question.
  var timeZone = badges[0].getAttribute('data-timezone') || 'Asia/Baku';
  var dayIndex, nowMinutes;
  try {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    var get = function (type) { return (parts.find(function (p) { return p.type === type; }) || {}).value; };
    dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
    nowMinutes = parseInt(get('hour'), 10) % 24 * 60 + parseInt(get('minute'), 10);
  } catch (e) {
    return;   // Older browsers without Intl time-zone support: leave every badge hidden.
  }

  Array.prototype.forEach.call(badges, function (badge) {
    // Opening hours are rendered into data attributes by the page, so there is no hard-coded
    // schedule here: data-hours="08:30-17:30,08:30-17:30,...,closed,closed"
    var schedule = (badge.getAttribute('data-hours') || '').split(',');
    var today = schedule[dayIndex];
    var isOpen = false;
    if (today && today !== 'closed') {
      var range = today.split('-');
      var toMin = function (hhmm) { var t = hhmm.split(':'); return parseInt(t[0], 10) * 60 + parseInt(t[1], 10); };
      isOpen = nowMinutes >= toMin(range[0]) && nowMinutes < toMin(range[1]);
    }

    badge.textContent = isOpen ? badge.getAttribute('data-open-label') : badge.getAttribute('data-closed-label');
    badge.classList.add(isOpen ? 'site-hours-status--open' : 'site-hours-status--closed');
    badge.hidden = false;
  });
})();
