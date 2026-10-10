/* Lluna d'avui a Vancouver
 * Writes today's date in Vancouver into the element with id="avui" 
 * and today's moon phase into the element with id="lluna-avui". 
 * Phase times: J. Meeus, "Astronomical Algorithms" (2nd ed.), ch. 49, complete method. 
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

  // Meeus's periodic corrections, in days, in the book's order. Each row: the multiples of M, M' 
  // and F in the sine's argument, the power of E the term is multiplied by, then the coefficients. 
  // The term in the Moon's node (Omega) and the planetary terms are applied separately below. 
  var NEW_FULL = [  // [M, M', F, power of E, new moon, full moon] 
    [ 0, 1,  0, 0, -0.40720, -0.40614],
    [ 1, 0,  0, 1,  0.17241,  0.17302],
    [ 0, 2,  0, 0,  0.01608,  0.01614],
    [ 0, 0,  2, 0,  0.01039,  0.01043],
    [-1, 1,  0, 1,  0.00739,  0.00734],
    [ 1, 1,  0, 1, -0.00514, -0.00515],
    [ 2, 0,  0, 2,  0.00208,  0.00209],
    [ 0, 1, -2, 0, -0.00111, -0.00111],
    [ 0, 1,  2, 0, -0.00057, -0.00057],
    [ 1, 2,  0, 1,  0.00056,  0.00056],
    [ 0, 3,  0, 0, -0.00042, -0.00042],
    [ 1, 0,  2, 1,  0.00042,  0.00042],
    [ 1, 0, -2, 1,  0.00038,  0.00038],
    [-1, 2,  0, 1, -0.00024, -0.00024],
    [ 2, 1,  0, 0, -0.00007, -0.00007],
    [ 0, 2, -2, 0,  0.00004,  0.00004],
    [ 3, 0,  0, 0,  0.00004,  0.00004],
    [ 1, 1, -2, 0,  0.00003,  0.00003],
    [ 0, 2,  2, 0,  0.00003,  0.00003],
    [ 1, 1,  2, 0, -0.00003, -0.00003],
    [-1, 1,  2, 0,  0.00003,  0.00003],
    [-1, 1, -2, 0, -0.00002, -0.00002],
    [ 1, 3,  0, 0, -0.00002, -0.00002],
    [ 0, 4,  0, 0,  0.00002,  0.00002]
  ];
  var QUARTERS = [  // [M, M', F, power of E, first and last quarter] 
    [ 0, 1,  0, 0, -0.62801],
    [ 1, 0,  0, 1,  0.17172],
    [ 1, 1,  0, 1, -0.01183],
    [ 0, 2,  0, 0,  0.00862],
    [ 0, 0,  2, 0,  0.00804],
    [-1, 1,  0, 1,  0.00454],
    [ 2, 0,  0, 2,  0.00204],
    [ 0, 1, -2, 0, -0.00180],
    [ 0, 1,  2, 0, -0.00070],
    [ 0, 3,  0, 0, -0.00040],
    [-1, 2,  0, 1, -0.00034],
    [ 1, 0,  2, 1,  0.00032],
    [ 1, 0, -2, 1,  0.00032],
    [ 2, 1,  0, 2, -0.00028],
    [ 1, 2,  0, 1,  0.00027],
    [-1, 1, -2, 0, -0.00005],
    [ 0, 2,  2, 0,  0.00004],
    [ 1, 1,  2, 0, -0.00004],
    [-2, 1,  0, 0,  0.00004],
    [ 1, 1, -2, 0,  0.00003],
    [ 3, 0,  0, 0,  0.00003],
    [ 0, 2, -2, 0,  0.00002],
    [-1, 1,  2, 0,  0.00002],
    [ 1, 3,  0, 0, -0.00002]
  ];
  // Planetary arguments A1 to A14: 
  // [degrees, + degrees per lunation, + degrees times T squared, amplitude in days] 
  var PLANETARY = [
    [299.77,  0.107408, -0.009173, 0.000325],
    [251.88,  0.016321,  0,        0.000165],
    [251.83, 26.651886,  0,        0.000164],
    [349.42, 36.412478,  0,        0.000126],
    [ 84.66, 18.206239,  0,        0.000110],
    [141.74, 53.303771,  0,        0.000062],
    [207.14,  2.453732,  0,        0.000060],
    [154.84,  7.306860,  0,        0.000056],
    [ 34.52, 27.261239,  0,        0.000047],
    [207.19,  0.121824,  0,        0.000042],
    [291.34,  1.844379,  0,        0.000040],
    [161.72, 24.198154,  0,        0.000037],
    [239.56, 25.513099,  0,        0.000035],
    [331.55,  3.592518,  0,        0.000023]
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
    var rad = Math.PI / 180, T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    // Earth's slowly changing orbit 
    var E  = 1 - 0.002516 * T - 0.0000074 * T2;
    // Sun's mean anomaly 
    var M  = rad * (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3);
    // Moon's mean anomaly 
    var Mp = rad * (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4);
    // Moon's argument of latitude 
    var F  = rad * (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4);
    // longitude of the Moon's ascending node 
    var Om = rad * (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3);
    var phase = phaseOf(k), quarter = phase === 1 || phase === 3;
    // column of the coefficient to use 
    var table = quarter ? QUARTERS : NEW_FULL, column = phase === 2 ? 5 : 4;
    // mean phase (Julian Day, in TT)
    var jd = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
    var i, row, W;
    for (i = 0; i < table.length; i++) {
      row = table[i];
      jd += row[column] * Math.pow(E, row[3]) * Math.sin(row[0] * M + row[1] * Mp + row[2] * F);
    }
    jd -= 0.00017 * Math.sin(Om);
    if (quarter) {
      W = 0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Mp)
        - 0.00002 * Math.cos(Mp - M) + 0.00002 * Math.cos(Mp + M) + 0.00002 * Math.cos(2 * F);
      jd += phase === 1 ? W : -W;
    }
    for (i = 0; i < PLANETARY.length; i++) {
      row = PLANETARY[i];
      jd += row[3] * Math.sin(rad * (row[0] + row[1] * k + row[2] * T2));
    }
    // Julian Day -> ms (TT is 69.184 s ahead of UTC since 2017) 
    return (jd - 2440587.5) * DAY - 69184;
  }

  // Vancouver and British Columbia's calendar. 
  // The browser's own time-zone data is used if it passes the test below. 
  // Otherwise the built-in rules further down are used. 
  var browserZone = null;
  try {
    var zone = new Intl.DateTimeFormat('en-US',
      { timeZone: 'America/Vancouver', year: 'numeric', month: 'numeric', day: 'numeric' });
    // Test days, all on the 15th: [year, month (0 = January), hours Vancouver is behind UTC]. 
    // UTC-8 in December 2025; UTC-7 in July and December 2026, after BC's last clock change. 
    // Each test day starts at that hour UTC: half an hour before, it must still be the 14th in 
    // Vancouver, and half an hour after, the 15th. 
    var testDays = [[2025, 11, 8], [2026, 6, 7], [2026, 11, 7]], knowsVancouver = true;
    for (var t = 0; t < testDays.length; t++) {
      var testDay = Date.UTC(testDays[t][0], testDays[t][1], 15);
      var dayStarts = testDay + testDays[t][2] * 3600000;
      if (zoneDay(zone, dayStarts - 1800000) !== testDay / DAY - 1 ||
          zoneDay(zone, dayStarts + 1800000) !== testDay / DAY) knowsVancouver = false;
    }
    if (knowsVancouver) browserZone = zone;
  } catch (e) {
    browserZone = null;  // no usable time-zone support
  }

  // Day number (days since 1 January 1970) of a moment, according to the browser's time-zone data 
  function zoneDay(zone, ms) {
    var parts = zone.formatToParts(new Date(ms)), year, month, day, date;
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'year') year = Number(parts[i].value);
      if (parts[i].type === 'month') month = Number(parts[i].value);
      if (parts[i].type === 'day') day = Number(parts[i].value);
    }
    date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);  // unlike Date.UTC, keeps years 0 to 99 as they are
    return date.getTime() / DAY;
  }

  // Built-in rules: Vancouver's offset from UTC, in hours. 
  // British Columbia stays on UTC-7 all year since 8 March 2026. 
  // This function needs updating if BC changes its clocks again. 
  function vancouverOffset(ms) {
    if (ms >= Date.UTC(2026, 2, 8, 10)) return -7;
    var year = new Date(ms).getUTCFullYear();
    var start = Date.UTC(year, 2, sundayOnOrAfter(year, 2, 8), 10);  // 2:00 at UTC-8 
    var end = Date.UTC(year, 10, sundayOnOrAfter(year, 10, 1), 9);  // 2:00 at UTC-7 
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

  // Date and phase for the moment now (ms since 1970, UTC), 
  // or null if the device's clock is set outside the years 1000 to 9999. 
  function describe(now) {
    var today = vancouverDay(now);
    var d = new Date(today * DAY);  // today in Vancouver 
    var year = d.getUTCFullYear();
    if (!(year >= 1000 && year <= 9999)) return null;  // this also catches a time that is not a number 
    var lunations = (now / DAY + 2440587.5 - 2451550.09766) / 29.530588861;  // since 6 January 2000 
    var k = Math.floor(lunations * 4) / 4 - 0.25;  // a phase safely in the past 
    while (phaseMoment(k + 0.25) <= now) k += 0.25;  // -> the last phase before now 
    if (vancouverDay(phaseMoment(k + 0.25)) === today) k += 0.25;  // a phase later today also counts for today 
    return {
      date: (d.getUTCDate() < 10 ? '0' : '') + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + year,
      label: LABELS[phaseOf(k)][vancouverDay(phaseMoment(k)) === today ? 0 : 1]
    };
  }

  // Replace an element's content with plain text (never interpreted as HTML) 
  // The new text is created first, so if that fails, whatever the page had in the element stays in place. 
  function setText(el, text) {
    var node;
    if (/^(script|style)$/i.test(el.nodeName)) return;
    node = document.createTextNode(text);
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(node);
  }

  // Show today's date and phase, rewriting an element only when its text changes. 
  var shownDate = '', shownLabel = '';
  function update() {
    var current = describe(new Date().getTime()), dateEl, phaseEl;
    if (!current) return;
    dateEl = document.getElementById('avui');
    phaseEl = document.getElementById('lluna-avui');
    if (dateEl && current.date !== shownDate) {
      setText(dateEl, current.date);
      shownDate = current.date;
    }
    if (phaseEl && current.label !== shownLabel) {
      setText(phaseEl, current.label);
      shownLabel = current.label;
    }
  }

  // Update now and after every ten-second mark of the clock. 
  function tick() {
    var wait;
    try {
      update();
    } catch (ignored) {
      // keep going: one failed update must not stop the later ones 
    }
    wait = 10000 - ((new Date().getTime() % 10000) + 10000) % 10000;
    window.setTimeout(tick, (wait > 0 ? wait : 10000) + 20);
  }

  // Start once the page has loaded, wherever the <script> tag is placed 
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
    tick();
  }
  if (document.readyState === 'complete') {
    start();
  } else if (window.addEventListener) {
    // All browsers except Internet Explorer 8 and older 'load' first: 
    // it still starts the script even if the page's own markup hides document.addEventListener 
    window.addEventListener('load', start, false);
    document.addEventListener('DOMContentLoaded', start, false);  // usually fires sooner 
  } else {
    // older browsers: keep any existing onload handler 
    var previousOnload = window.onload;
    window.onload = function (e) {
      try {
        start();  // first, so an error in the page's own handler can't stop it 
      } catch (ignored) {
        // and an error here can't stop the page's own handler either 
      }
      if (previousOnload) previousOnload(e);  // a plain call: Internet Explorer 5.0 has no .call() 
    };
    // The page may still replace window.onload, 
    // so check five times a second whether the page has finished loading 
    var poll = function () {
      if (started) return;
      if (document.readyState === 'complete') {
        try {
          start();
        } catch (ignored) {
          // nothing more to do 
        }
      } else if (typeof document.readyState === 'string') {
        window.setTimeout(poll, 200);
      }
    };
    window.setTimeout(poll, 200);
  }
})();
