/* The emails netlify/functions/submission-created.js sends: which form gets
   one, to whom, and its words. No network here, so all of it runs under node
   (tests/submission-created.test.js) exactly as it runs on Netlify.

   ONE RULE ABOVE THE REST: nothing is sent unless the submitter ticked the
   box (consent=yes). Then, per form:
     calculator-results   the result and the figures they used, a link back
                          to the calculator, one booking button, the two
                          prescribed warnings word for word
     director-guide,
     starter-guide,
     tracker-guide        the guide's link and nothing else; no link set in
                          the environment, no email
     anything else        nothing (pension-finder, and the old booking and
                          *-calculator-results forms, whose requests stay in
                          Netlify)

   Information only: no advice, no promise of returns, no urgency, no
   marketing, no list. The warnings and the regulator line come from
   shared/compliance-text.json, never typed here.

   Everything in a submission is typed by whoever sent it, so every value is
   escaped, cut to length, and a link is used only when it points at this
   site. */
'use strict';

var TEXT = require('../../shared/compliance-text.json');

var FROM = 'Pensionbuddy <hello@pensionbuddy.ie>';
var REPLY_TO = 'hello@pensionbuddy.ie';
var SITE = 'https://pensionbuddy.ie';
var BOOK_WORDS = 'Book a free 20-minute call with us';   // tools/pagebuild.py AFTER_WORDS

// page file -> the calculator's name, as the footer's Tools list names it
var CALCULATORS = {
  'pension-calculator.html': 'Pension calculator',
  'director-calculator.html': 'Director calculator',
  'pension-fees-calculator.html': 'Pension charges calculator',
  'broker-vs-autoenrolment.html': 'Auto-enrolment comparison',
  'state-pension-reality-check.html': 'State Pension reality check',
  'state-pension-entitlement.html': 'State Pension entitlement check',
  'standard-fund-threshold.html': 'Standard Fund Threshold calculator',
  'pia.html': 'Personal Investment Account (PIA) calculator',
  'director-pension-rules.html': 'Directors’ pension rules check'
};

// form name -> the guide, and the environment variable that holds its link
var GUIDES = {
  'director-guide': { title: 'The Pensionbuddy guide for company directors', env: 'GUIDE_URL_DIRECTOR' },
  'starter-guide': { title: 'The Pensionbuddy guide to starting a pension', env: 'GUIDE_URL_STARTER' },
  'tracker-guide': { title: 'The Pensionbuddy guide to finding a lost pension', env: 'GUIDE_URL_TRACKER' }
};

var MAX = { name: 80, results: 2000, inputs: 2000, item: 300 };

function str(v, max) {
  var s = v == null ? '' : String(v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return max && s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function validEmail(e) {
  return typeof e === 'string' && e.length <= 254 && /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/.test(e);
}

function firstName(name) {
  var n = str(name, MAX.name).split(' ')[0];
  return /^[\p{L}][\p{L}'’.-]*$/u.test(n) ? n : '';
}

function siteBase(env) {
  var u = str(env && env.URL);
  return /^https:\/\/[a-z0-9.-]+$/i.test(u) ? u : SITE;
}

/* a link the submission carries, only if it points at this site: the live
   domain or this deploy's own address; otherwise null */
function ownLink(raw, env) {
  var u;
  try { u = new URL(str(raw)); } catch (e) { return null; }
  var hosts = ['pensionbuddy.ie', 'www.pensionbuddy.ie'];
  try { hosts.push(new URL(siteBase(env)).hostname); } catch (e) { /* SITE is valid */ }
  if (u.protocol !== 'https:' || hosts.indexOf(u.hostname) < 0 || u.username || u.password) return null;
  return u.href;
}

function pageFile(raw) {
  try { return new URL(str(raw)).pathname.split('/').pop() || ''; } catch (e) { return ''; }
}

/* "Your age now: 40 | Pension saved so far: €50,000" (assets/js/pb-after.js);
   before that, "age=40, pot=50000" */
function inputList(raw) {
  var s = str(raw, MAX.inputs);
  if (!s) return [];
  var parts = s.indexOf(' | ') >= 0 || s.indexOf(': ') >= 0 ? s.split(' | ') : s.split(', ');
  return parts.map(function (p) {
    // a label may hold ": " itself ("PIA tax rate: not yet announced, ..."), so the last one splits
    var s = p.trim(), k = s.lastIndexOf(': ');
    if (k < 0) k = s.indexOf('=');
    var sep = s.charAt(k) === '=' ? 1 : 2;
    return k > 0 ? { label: str(s.slice(0, k), MAX.item), value: str(s.slice(k + sep), MAX.item) } : { label: '', value: str(s, MAX.item) };
  }).filter(function (x) { return x.label || x.value; });
}

function resultList(raw) {
  return str(raw, MAX.results).split(' | ').map(function (r) { return str(r, MAX.item * 2); }).filter(Boolean);
}

/* ---------------------------------------------------------------- layout */

var C = { bg: '#F6F3EC', card: '#FFFFFF', ink: '#14231F', ink2: '#3E4F4A', line: '#E3DED3',
          teal: '#0F6E62', warnBg: '#FFF6E5', warnLine: '#E8B44C' };

function shell(o) {
  // o: { title, preheader, body (html), why }
  return '<!doctype html>\n<html lang="en-IE">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<meta name="color-scheme" content="light dark">\n<meta name="supported-color-schemes" content="light dark">\n' +
    '<title>' + esc(o.title) + '</title>\n<style>\n' +
    'body{margin:0;padding:0;background:' + C.bg + ';}\n' +
    'a{color:' + C.teal + ';}\n' +
    '@media (prefers-color-scheme: dark){\n' +
    '  .pb-bg{background:#0E1715 !important;}\n' +
    '  .pb-card{background:#16221F !important;border-color:#2A3A36 !important;}\n' +
    '  .pb-ink,.pb-ink td,.pb-ink p,.pb-ink h1,.pb-ink h2{color:#EDEAE2 !important;}\n' +
    '  .pb-ink2,.pb-ink2 p{color:#B9C4C0 !important;}\n' +
    '  .pb-warn{background:#2B2414 !important;border-color:#8A6A24 !important;color:#F4E6C6 !important;}\n' +
    '  .pb-link{color:#7FD3C6 !important;}\n' +
    '  .pb-rule{border-color:#2A3A36 !important;}\n' +
    '}\n' +
    '[data-ogsc] .pb-card{background:#16221F !important;}\n' +
    '@media only screen and (max-width:620px){ .pb-pad{padding:22px 18px !important;} }\n' +
    '</style>\n</head>\n' +
    '<body class="pb-bg" style="margin:0;padding:0;background:' + C.bg + ';">\n' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + esc(o.preheader) + '</div>\n' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="pb-bg" style="background:' + C.bg + ';">\n' +
    '<tr><td align="center" style="padding:24px 12px;">\n' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">\n' +
    '<tr><td class="pb-ink" style="padding:0 4px 14px;font:700 18px/1.3 Arial,Helvetica,sans-serif;color:' + C.ink + ';">Pensionbuddy</td></tr>\n' +
    '<tr><td class="pb-card pb-ink pb-pad" style="background:' + C.card + ';border:1px solid ' + C.line + ';border-radius:10px;padding:28px 30px;' +
    'font:16px/1.55 Arial,Helvetica,sans-serif;color:' + C.ink + ';">\n' + o.body + '\n</td></tr>\n' +
    '<tr><td class="pb-ink2" style="padding:18px 4px 0;font:13px/1.55 Arial,Helvetica,sans-serif;color:' + C.ink2 + ';">\n' +
    '<p style="margin:0 0 8px;">' + esc(TEXT.regulator) + ' ' + esc(TEXT.register) + '</p>\n' +
    '<p style="margin:0;">' + esc(o.why) + '</p>\n' +
    '</td></tr>\n</table>\n</td></tr>\n</table>\n</body>\n</html>\n';
}

function p(html, extra) {
  return '<p style="margin:0 0 14px;' + (extra || '') + '">' + html + '</p>';
}

function h2(text) {
  return '<h2 style="margin:22px 0 8px;font:700 17px/1.35 Arial,Helvetica,sans-serif;">' + esc(text) + '</h2>';
}

function button(href, words) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px;"><tr>' +
    '<td style="background:' + C.teal + ';border-radius:8px;">' +
    '<a href="' + esc(href) + '" style="display:inline-block;padding:13px 22px;font:700 16px/1.2 Arial,Helvetica,sans-serif;' +
    'color:#FFFFFF;text-decoration:none;border-radius:8px;">' + esc(words) + '</a></td></tr></table>';
}

function warnings() {
  return '<div class="pb-warn" style="background:' + C.warnBg + ';border:1px solid ' + C.warnLine + ';border-radius:8px;' +
    'padding:14px 16px;margin:6px 0 0;color:' + C.ink + ';">' +
    TEXT.warnings.map(function (w, i) {
      return '<p style="margin:' + (i ? '8px' : '0') + ' 0 0;font-weight:700;">' + esc(w) + '</p>';
    }).join('') + '</div>';
}

/* --------------------------------------------------------------- emails */

function calculatorEmail(d, env) {
  var base = siteBase(env);
  var file = pageFile(d.page);
  var calc = CALCULATORS[file] || 'calculator';
  var back = ownLink(d.link, env) || (CALCULATORS[file] ? base + '/' + file : base + '/');
  var book = base + '/booking.html';
  var results = resultList(d.results), inputs = inputList(d.inputs);
  var hi = firstName(d.name);
  var why = 'You got this email because you asked for this result on pensionbuddy.ie and ticked the box to let us email it to you.';
  var subject = 'Your result from the Pensionbuddy ' + calc;
  var intro = 'Here is the result you asked us to email you from the ' + calc + '.';

  var body = [
    p(esc(hi ? 'Hello ' + hi + ',' : 'Hello,')),
    p(esc(intro)),
    h2('Your result'),
    results.length
      ? results.map(function (r) { return p(esc(r)); }).join('\n')
      : p(esc('The result was not included in your request. Open the calculator below to see it again.')),
    h2('The figures you entered'),
    inputs.length
      ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;border-collapse:collapse;">' +
        inputs.map(function (x) {
          return '<tr><td class="pb-rule" style="padding:7px 10px 7px 0;border-bottom:1px solid ' + C.line + ';vertical-align:top;">' + esc(x.label) + '</td>' +
            '<td class="pb-rule" style="padding:7px 0;border-bottom:1px solid ' + C.line + ';text-align:right;vertical-align:top;font-weight:700;white-space:nowrap;">' + esc(x.value) + '</td></tr>';
        }).join('') + '</table>'
      : p(esc('No figures were included in your request.')),
    p('<a class="pb-link" href="' + esc(back) + '" style="color:' + C.teal + ';font-weight:700;">Open the ' + esc(calc) + ' again</a>'),
    p(esc('If you would like to talk this through, you can book a call.')),
    button(book, BOOK_WORDS),
    warnings()
  ].join('\n');

  var text = [
    hi ? 'Hello ' + hi + ',' : 'Hello,', '',
    intro, '',
    'YOUR RESULT',
    results.length ? results.join('\n') : 'The result was not included in your request. Open the calculator below to see it again.', '',
    'THE FIGURES YOU ENTERED',
    inputs.length ? inputs.map(function (x) { return (x.label ? x.label + ': ' : '') + x.value; }).join('\n') : 'No figures were included in your request.', '',
    'Open the ' + calc + ' again: ' + back, '',
    'If you would like to talk this through, you can book a call.',
    BOOK_WORDS + ': ' + book, '',
    TEXT.warnings.join('\n'), '',
    '--',
    TEXT.regulator + ' ' + TEXT.register,
    why, ''
  ].join('\n');

  return { subject: subject, html: shell({ title: subject, preheader: intro, body: body, why: why }), text: text };
}

function guideEmail(guide, url) {
  var why = 'You got this email because you asked for this guide on pensionbuddy.ie and ticked the box to let us email it to you.';
  var subject = guide.title;
  var intro = 'Here is the guide you asked for.';
  var body = [
    p(esc('Hello,')),
    p(esc(intro)),
    p('<a class="pb-link" href="' + esc(url) + '" style="color:' + C.teal + ';font-weight:700;">' + esc(guide.title) + '</a>')
  ].join('\n');
  var text = ['Hello,', '', intro, '', guide.title + ': ' + url, '', '--',
              TEXT.regulator + ' ' + TEXT.register, why, ''].join('\n');
  return { subject: subject, html: shell({ title: subject, preheader: intro, body: body, why: why }), text: text };
}

/* What to send for one submission, or why nothing is sent.
   form: the Netlify form name; data: its fields; env: process.env.
   Returns { send: true, message } or { send: false, reason }. */
function plan(form, data, env) {
  var d = data || {}, e = env || {};
  if (str(d['bot-field'])) return { send: false, reason: 'honeypot filled' };
  if (str(d.consent).toLowerCase() !== 'yes') return { send: false, reason: 'consent box not ticked' };
  var email = str(d.email);
  if (!validEmail(email)) return { send: false, reason: 'no valid email address' };

  var built;
  if (form === 'calculator-results') {
    built = calculatorEmail(d, e);
  } else if (GUIDES[form]) {
    // set by Damian in Netlify, not by the submitter, so any https address will do
    var url = str(e[GUIDES[form].env]);
    if (!/^https:\/\/\S+$/.test(url)) return { send: false, reason: GUIDES[form].env + ' is not set to an https link' };
    built = guideEmail(GUIDES[form], url);
  } else {
    return { send: false, reason: 'no email for form "' + form + '"' };
  }

  var to = email;
  if (str(e.EMAIL_TEST) === '1') {
    to = str(e.EMAIL_TEST_TO);
    if (!validEmail(to)) return { send: false, reason: 'EMAIL_TEST=1 but EMAIL_TEST_TO is not a valid address' };
  }
  return {
    send: true,
    message: { from: FROM, to: [to], reply_to: REPLY_TO, subject: built.subject, html: built.html, text: built.text }
  };
}

module.exports = {
  plan: plan, inputList: inputList, resultList: resultList, ownLink: ownLink, esc: esc, validEmail: validEmail,
  FROM: FROM, REPLY_TO: REPLY_TO, CALCULATORS: CALCULATORS, GUIDES: GUIDES, TEXT: TEXT
};
