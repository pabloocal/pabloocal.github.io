/* Lluna d'avui a Vancouver
 * Writes today's date in Vancouver into the element with id="avui" 
 * and today's moon phase into the element with id="lluna-avui". 
 * Phase times: J. Meeus, "Astronomical Algorithms" (2nd ed.), ch. 49. 
 * Written in standard ECMAScript 3 with no deprecated features. 
 */
(function () {
  'use strict';

  // Page labels: [on the day of the phase, on the days that follow it]. 
  // The moon symbols are JavaScript escapes. 
  var LABELS = [
    ['\uD83C\uDF11 Lluna nova',     '\uD83C\uDF12 Lluna nova visible'],
    ['\uD83C\uDF13 Quart creixent', '\uD83C\uDF14 Lluna gibosa creixent'],
    ['\uD83C\uDF15 Lluna plena',    '\uD83C\uDF16 Lluna gibosa minvant'],
    ['\uD83C\uDF17 Quart minvant',  '\uD83C\uDF18 Lluna minvant']
  ];
  // Month names; '\u00E7' is c-cedilla 
  var MONTHS = ['Gener', 'Febrer', 'Mar\u00E7', 'Abril', 'Maig', 'Juny',
                'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];

  // Corrections in days: multiples of [M, M', F], then coefficients for new moon, full moon, quarters. 
  // Each term is also multiplied by E once for every multiple of M (see phaseMoment). 
  var TERMS = [
    [ 0, 1,  0, -0.40720, -0.40614, -0.62801],
    [ 1, 0,  0,  0.17241,  0.17302,  0.17172],
    [ 0, 2,  0,  0.01608,  0.01614,  0.00862],
    [ 0, 0,  2,  0.01039,  0.01043,  0.00804],
    [-1, 1,  0,  0.00739,  0.00734,  0.00454],
    [ 1, 1,  0, -0.00514, -0.00515, -0.01183],
    [ 2, 0,  0,  0.00208,  0.00209,  0.00204],
    [ 0, 1, -2, -0.00111, -0.00111, -0.00180],
    [ 0, 1,  2, -0.00057, -0.00057, -0.00070],
    [ 1, 2,  0,  0.00056,  0.00056,  0.00027],
    [ 0, 3,  0, -0.00042, -0.00042, -0.00040],
    [ 1, 0,  2,  0.00042,  0.00042,  0.00032],
    [ 1, 0, -2,  0.00038,  0.00038,  0.00032],
    [-1, 2,  0, -0.00024, -0.00024, -0.00034],
    [ 2, 1,  0, -0.00007, -0.00007, -0.00028]
  ];

  // Milliseconds in a day 
  var DAY = 86400000; 

  // Which phase k is: 0 new moon, 1 first quarter, 2 full moon, 3 last quarter (also for negative k) 
  function phaseOf(k) {
    return Math.round((k - Math.floor(k)) * 4);
  }

  // Moment of phase k, in milliseconds since 1970 (UTC). 
  // k counts lunations since the new moon of 6 January 2000: 
  // whole k = new moon, k + 0.25 = first quarter, + 0.5 = full, + 0.75 = last quarter. 
  function phaseMoment(k) {
    var T = k / 1236.85, rad = Math.PI / 180;
    var E  = 1 - 0.002516 * T - 0.0000074 * T * T;                     // Earth's slowly changing orbit 
    var M  = rad * (2.5534 + 29.1053567 * k);                          // Sun's mean anomaly 
    var Mp = rad * (201.5643 + 385.81693528 * k + 0.0107582 * T * T);  // Moon's mean anomaly 
    var F  = rad * (160.7108 + 390.67050284 * k - 0.0016118 * T * T);  // Moon's argument of latitude 
    var phase = phaseOf(k);
    var column = [3, 5, 4, 5][phase];                                  // TERMS column for this phase 
    var jd = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T;    // mean phase (Julian Day, in TT) 
    for (var i = 0; i < TERMS.length; i++) {
      jd += TERMS[i][column] * Math.pow(E, Math.abs(TERMS[i][0])) *
            Math.sin(TERMS[i][0] * M + TERMS[i][1] * Mp + TERMS[i][2] * F);
    }
    if (phase % 2) jd += (phase === 1 ? 1 : -1) * (0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Mp));
    return (jd - 2440587.5) * DAY - 69000;  // Julian Day -> ms (TT = UTC + 69 s since 2017)
  }

  // Vancouver's calendar. The browser's own time-zone data is used if it already knows that British 
  // Columbia stays on UTC-7 all year since 8 March 2026: browsers keep that data up to date, so any 
  // later change to BC's clocks is followed automatically. Otherwise the built-in rules below are used. 
  var browserZone = null;
  try {
    var zone = new Intl.DateTimeFormat('en-US',
      { timeZone: 'America/Vancouver', year: 'numeric', month: 'numeric', day: 'numeric' });
    // At UTC-7 all year, 15 January and 15 July 2027 both start at 07:00 UTC in Vancouver: 
    // half an hour before, it is still the 14th there; half an hour after, it is the 15th 
    var jan = Date.UTC(2027, 0, 15), jul = Date.UTC(2027, 6, 15), hour = 3600000;
    if (zoneDay(zone, jan + 6.5 * hour) === jan / DAY - 1 && zoneDay(zone, jan + 7.5 * hour) === jan / DAY &&
        zoneDay(zone, jul + 6.5 * hour) === jul / DAY - 1 && zoneDay(zone, jul + 7.5 * hour) === jul / DAY) {
      browserZone = zone;
    }
  } catch (e) {
    browserZone = null;  // no usable time-zone support
  }

  // Day number (days since 1 January 1970) of a moment, according to the browser's time-zone data 
  function zoneDay(zone, ms) {
    var parts = zone.formatToParts(new Date(ms)), year, month, day;
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'year') year = Number(parts[i].value);
      if (parts[i].type === 'month') month = Number(parts[i].value);
      if (parts[i].type === 'day') day = Number(parts[i].value);
    }
    return Date.UTC(year, month - 1, day) / DAY;
  }

  // Built-in rules: Vancouver's offset from UTC, in hours. 
  // British Columbia stays on UTC-7 all year since 8 March 2026. 
  function vancouverOffset(ms) {
    if (ms >= Date.UTC(2026, 2, 8, 10)) return -7;
    var year = new Date(ms).getUTCFullYear();
    var start = Date.UTC(year, 2, sundayOnOrAfter(year, 2, 8), 10);  // 2:00 at UTC-8 
    var end = Date.UTC(year, 10, sundayOnOrAfter(year, 10, 1), 9);   // 2:00 at UTC-7 
    return (ms >= start && ms < end) ? -7 : -8;
  }
  function sundayOnOrAfter(year, month, day) {
    return day + (7 - new Date(Date.UTC(year, month, day)).getUTCDay()) % 7;
  }

  // Day number on Vancouver's calendar (days since 1 January 1970) 
  function vancouverDay(ms) {
    if (browserZone) {
      try {
        var day = zoneDay(browserZone, ms);
        if (!isNaN(day)) return day;
      } catch (e) {
        // fall through to the built-in rules 
      }
    }
    return Math.floor((ms + vancouverOffset(ms) * 3600000) / DAY);
  }

  // Date and phase for the moment now (ms since 1970, UTC) 
  function describe(now) {
    var today = vancouverDay(now);
    var lunations = (now / DAY + 2440587.5 - 2451550.09766) / 29.530588861;  // since 6 January 2000 
    var k = Math.floor(lunations * 4) / 4 - 0.25;                  // a phase safely in the past 
    while (phaseMoment(k + 0.25) <= now) k += 0.25;                // -> the last phase before now 
    if (vancouverDay(phaseMoment(k + 0.25)) === today) k += 0.25;  // a phase later today also counts for today 
    var d = new Date(today * DAY);                                 // today in Vancouver 
    return {
      date: (d.getUTCDate() < 10 ? '0' : '') + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(),
      label: LABELS[phaseOf(k)][vancouverDay(phaseMoment(k)) === today ? 0 : 1]
    };
  }

  // Replace an element's content with plain text (never interpreted as HTML) 
  function setText(el, text) {
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(document.createTextNode(text));
  }

  // Show today's date and phase, rewriting an element only when its text changes. 
  var shownDate = '', shownLabel = '';
  function update() {
    var current = describe(new Date().getTime());
    var dateEl = document.getElementById('avui');
    var phaseEl = document.getElementById('lluna-avui');
    if (dateEl && current.date !== shownDate) setText(dateEl, current.date);
    if (phaseEl && current.label !== shownLabel) setText(phaseEl, current.label);
    shownDate = current.date;
    shownLabel = current.label;
  }

  // Start once the page has loaded, wherever the <script> tag is placed, then check every minute 
  var started = false;
  function start() {
    if (started || !document.getElementById) return;
    started = true;
    if (!document.getElementById('avui') && !document.getElementById('lluna-avui')) {
      if (window.console && window.console.warn) {
        window.console.warn('lluna.js: no element with id="avui" or id="lluna-avui" on this page');
      }
      return;
    }
    update();
    window.setInterval(update, 60000);
  }
  if (document.readyState === 'complete') {
    start();
  } else if (window.addEventListener) {        // all browsers except Internet Explorer 8 and older 
    document.addEventListener('DOMContentLoaded', start, false);
    window.addEventListener('load', start, false);
  } else {                                     // older browsers: keep any existing onload handler 
    var previousOnload = window.onload;
    window.onload = function (e) {
      start();                                 // first, so an error in the page's own handler can't stop it 
      if (previousOnload) previousOnload.call(window, e);
    };
  }
})();
