// Small progressive enhancements. The site works fully without this file;
// it only adds an "Open now / Closed now" badge computed in Baku local time.
(function () {
  'use strict';

  var status = document.querySelector('[data-hours-status]');
  if (!status) return;

  // Opening hours are rendered into data attributes by the page, so this script
  // has no hard-coded schedule: data-hours="08:30-17:30,08:30-17:30,...,closed,closed"
  var schedule = (status.getAttribute('data-hours') || '').split(',');
  var openLabel = status.getAttribute('data-open-label');
  var closedLabel = status.getAttribute('data-closed-label');
  var timeZone = status.getAttribute('data-timezone') || 'Asia/Baku';

  try {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    var get = function (type) { return (parts.find(function (p) { return p.type === type; }) || {}).value; };
    var dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
    var nowMinutes = parseInt(get('hour'), 10) % 24 * 60 + parseInt(get('minute'), 10);

    var today = schedule[dayIndex];
    var isOpen = false;
    if (today && today !== 'closed') {
      var range = today.split('-');
      var toMin = function (hhmm) { var t = hhmm.split(':'); return parseInt(t[0], 10) * 60 + parseInt(t[1], 10); };
      isOpen = nowMinutes >= toMin(range[0]) && nowMinutes < toMin(range[1]);
    }

    status.textContent = isOpen ? openLabel : closedLabel;
    status.classList.add(isOpen ? 'site-hours-status--open' : 'site-hours-status--closed');
    status.hidden = false;
  } catch (e) {
    // Older browsers without Intl time zone support: leave the badge hidden.
  }
})();
