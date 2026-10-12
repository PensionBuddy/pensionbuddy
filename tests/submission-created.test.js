/* The emails sent after a form submission.
   Contract: the headers of netlify/lib/emails.js and
   netlify/functions/submission-created.js.

       node tests/submission-created.test.js

   Node only: the function runs on Netlify, never in a page. No network: the
   function is handed its own env and a fake fetch. It also holds the pages to
   shared/compliance-text.json, the one copy of the warnings and the
   regulator line, so the email and the site cannot drift apart. */
'use strict';

var fs = require('fs');
var path = require('path');
var H = require('./harness.js');
var t = H.suite('submission-created');
var has = t.has, group = t.group;
/* eq is strict (===); arrays and objects are compared as JSON */
function eq(label, actual, expected) {
  if (actual !== null && typeof actual === 'object') { t.eq(label, JSON.stringify(actual), JSON.stringify(expected)); }
  else { t.eq(label, actual, expected); }
}

var ROOT = path.join(__dirname, '..');
var E = require('../netlify/lib/emails.js');
var F = require('../netlify/functions/submission-created.js');
var TEXT = require('../shared/compliance-text.json');

var WARN1 = 'Warning: These figures are estimates only. They are not a reliable guide to the future performance of your investment.';
var WARN2 = 'Warning: The value of your investment may go down as well as up.';

function calc(over) {
  var d = {
    'form-name': 'calculator-results', 'bot-field': '', name: 'Mary Byrne', email: 'mary@example.com', consent: 'yes',
    results: 'At 66 you could have about €412,000 | That could pay about €1,370 a month',
    inputs: 'Your age now: 40 | Pension saved so far: €50,000 | Assumed yearly growth: 5%',
    link: 'https://pensionbuddy.ie/pension-calculator.html#age=40&pot=50000',
    page: 'https://pensionbuddy.ie/pension-calculator.html'
  };
  Object.keys(over || {}).forEach(function (k) { d[k] = over[k]; });
  return d;
}
var GUIDE_ENV = { GUIDE_URL_DIRECTOR: 'https://pensionbuddy.ie/guides/director.pdf',
                  GUIDE_URL_STARTER: 'https://pensionbuddy.ie/guides/starter.pdf',
                  GUIDE_URL_TRACKER: 'https://pensionbuddy.ie/guides/tracker.pdf' };

group('THE SHARED TEXT');
eq('1. the two warnings, exact', TEXT.warnings, [WARN1, WARN2]);

/* every page's warning box, and every footer, says what the shared file says */
var pages = fs.readdirSync(ROOT).filter(function (f) { return /\.html$/.test(f); });
var boxes = 0;
pages.forEach(function (f) {
  var html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  var re = /<div class="pb-warn">([\s\S]*?)<\/div>/g, m;
  while ((m = re.exec(html))) {
    boxes++;
    var words = m[1].replace(/<[^>]+>/g, '\n').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    eq('2. ' + f + ': its warning box is the shared text', words, TEXT.warnings);
  }
  if (html.indexOf('<footer') >= 0 && html.indexOf('trading name of Damian Condon') >= 0) {
    var foot = html.slice(html.indexOf('<footer')).replace(/<[^>]+>/g, '').replace(/&rsquo;/g, '’').replace(/\s+/g, ' ');
    has('3. ' + f + ': its footer carries the regulator line', foot, TEXT.regulator);
    has('3. ' + f + ': and the register line', foot, TEXT.register.replace(/'/g, '’').replace('’', foot.indexOf("Bank's") >= 0 ? "'" : '’'));
  }
});
eq('2. warning boxes found on the pages', boxes > 0, true);

group('CONSENT, AND NOTHING SENT WITHOUT IT');
eq('4. box ticked: sent', E.plan('calculator-results', calc(), {}).send, true);
eq('5. box not ticked: nothing', E.plan('calculator-results', calc({ consent: '' }), {}), { send: false, reason: 'consent box not ticked' });
eq('6. no consent field: nothing', E.plan('calculator-results', calc({ consent: undefined }), {}).send, false);
eq('7. consent "no": nothing', E.plan('director-guide', { email: 'a@b.ie', consent: 'no' }, GUIDE_ENV).send, false);
eq('8. honeypot filled: nothing', E.plan('calculator-results', calc({ 'bot-field': 'x' }), {}).send, false);
eq('9. a bad address: nothing', E.plan('calculator-results', calc({ email: 'not-an-email' }), {}).send, false);
eq('9. an address with a newline: nothing', E.plan('calculator-results', calc({ email: 'a@b.ie\nBcc: c@d.ie' }), {}).send, false);

group('WHICH FORMS');
['pension-finder', 'booking', 'pension-calculator-results', 'director-calculator-results', 'unknown']
  .forEach(function (f) { eq('10. "' + f + '": nothing', E.plan(f, calc(), GUIDE_ENV).send, false); });
['director-guide', 'starter-guide', 'tracker-guide'].forEach(function (f) {
  eq('11. "' + f + '" with its link set: sent', E.plan(f, { email: 'a@b.ie', consent: 'yes' }, GUIDE_ENV).send, true);
  eq('11. "' + f + '" with no link set: nothing', E.plan(f, { email: 'a@b.ie', consent: 'yes' }, {}).send, false);
});
eq('11. a guide link that is not https: nothing', E.plan('starter-guide', { email: 'a@b.ie', consent: 'yes' }, { GUIDE_URL_STARTER: 'http://x.ie/g.pdf' }).send, false);

group('THE ENVELOPE');
var m = E.plan('calculator-results', calc(), {}).message;
eq('12. from', m.from, 'Damian at Pensionbuddy <hello@pensionbuddy.ie>');
eq('13. reply-to', m.reply_to, 'hello@pensionbuddy.ie');
eq('14. to the submitter', m.to, ['mary@example.com']);
eq('15. test mode: only to EMAIL_TEST_TO', E.plan('calculator-results', calc(), { EMAIL_TEST: '1', EMAIL_TEST_TO: 'damian@example.ie' }).message.to, ['damian@example.ie']);
eq('16. test mode with no EMAIL_TEST_TO: nothing', E.plan('calculator-results', calc(), { EMAIL_TEST: '1' }).send, false);
eq('17. EMAIL_TEST not 1: the submitter', E.plan('calculator-results', calc(), { EMAIL_TEST: '0', EMAIL_TEST_TO: 'd@x.ie' }).message.to, ['mary@example.com']);

group('THE CALCULATOR EMAIL');
eq('18. subject: personal, no sales words', m.subject, 'Mary, your figures from the pension calculator');
eq('18. no first name: still plain', E.plan('calculator-results', calc({ name: '' }), {}).message.subject, 'Your figures from the pension calculator');
[m.html, m.text].forEach(function (body, i) {
  var k = i ? 'text' : 'html';
  has('19. ' + k + ': the result', body, 'At 66 you could have about €412,000');
  has('19. ' + k + ': the inputs', body, 'Pension saved so far');
  has('19. ' + k + ': the link back, with the figures', body, 'https://pensionbuddy.ie/pension-calculator.html#age=40&' + (i ? '' : 'amp;') + 'pot=50000');
  has('20. ' + k + ': the booking link', body, 'https://pensionbuddy.ie/booking.html');
  has('21. ' + k + ': warning 1, exact', body, WARN1);
  has('21. ' + k + ': warning 2, exact', body, WARN2);
  has('22. ' + k + ': the regulator line', body, i ? TEXT.regulator : E.esc(TEXT.regulator));
  has('23. ' + k + ': why they got it', body, 'You got this email because you asked for this result');
  eq('24. ' + k + ': the warnings after the booking button', body.indexOf(i ? WARN1 : E.esc(WARN1)) > body.indexOf('booking.html'), true);
  eq('25. ' + k + ': no advice, promise, urgency or marketing words', ['recommend', 'you should', 'guarantee', 'act now', 'today only', 'hurry', 'limited time', 'unsubscribe', 'newsletter']
    .filter(function (w) { return body.toLowerCase().indexOf(w) >= 0; }), []);
});
eq('26. one booking button', (m.html.match(/booking\.html/g) || []).length, 1);
has('27. dark mode styles', m.html, 'prefers-color-scheme: dark');
has('27. mobile viewport', m.html, 'width=device-width');
eq('28. no script, no image, no tracking pixel', /<script|<img|<iframe/i.test(m.html), false);

group('WHAT THE SUBMITTER TYPED IS ESCAPED, AND ONLY OUR LINKS ARE USED');
var x = E.plan('calculator-results', calc({ name: '<b>Eve</b>', results: '<a href="https://evil.example">Claim</a>',
  link: 'https://evil.example/pension-calculator.html' }), {}).message;
eq('29. no tag from the submission', /<b>Eve|<a href="https:\/\/evil/.test(x.html), false);
eq('30. a link to another site is not used', x.html.indexOf('https://evil.example/pension') < 0 && x.text.indexOf('https://evil.example/pension') < 0, true);
has('30. the calculator\'s own address instead', x.text, 'https://pensionbuddy.ie/pension-calculator.html');
eq('31. ownLink: http refused', E.ownLink('http://pensionbuddy.ie/x', {}), null);
eq('31. ownLink: a look-alike host refused', E.ownLink('https://pensionbuddy.ie.evil.example/x', {}), null);
eq('31. ownLink: the deploy\'s own address allowed', E.ownLink('https://deploy-preview-1--pb.netlify.app/pia.html', { URL: 'https://deploy-preview-1--pb.netlify.app' }), 'https://deploy-preview-1--pb.netlify.app/pia.html');
eq('32. a long result is cut', E.resultList('x'.repeat(5000))[0].length <= 600, true);
eq('33. inputs, new form', E.inputList('Your age now: 40 | PIA tax rate: not yet announced, try a figure: 20%'),
   [{ label: 'Your age now', value: '40' }, { label: 'PIA tax rate: not yet announced, try a figure', value: '20%' }]);
eq('33. inputs, old form', E.inputList('age=40, pot=50000'), [{ label: 'age', value: '40' }, { label: 'pot', value: '50000' }]);
eq('34. a missing result says so', E.plan('calculator-results', calc({ results: '' }), {}).message.text.indexOf('The figures were not included') >= 0, true);

group('THE LAYOUT (Job 4): ONE TEMPLATE, FROM THE SUMMARY THE PAGE SENDS');
var SUM = { v: 1, calc: 'director-calculator',
  head: { label: 'Your pension pot when you stop work', value: '€1,511,849', today: '€1,060,915' },
  more: [{ label: 'Company tax saved, all years added up', value: '€90,000' }],
  groups: [{ title: 'You', rows: [{ label: 'Your age now', value: '48' }, { label: 'Your salary in a year', value: '€100,000' }] },
           { title: 'Your pension', rows: [{ label: 'Your company pays in each year', value: '€40,000' }] },
           { title: 'Assumptions', rows: [{ label: 'Growth each year', value: '5%' }, { label: 'Prices rise each year (inflation)', value: '2%' }] }] };
var dm = E.plan('calculator-results', calc({ page: 'https://pensionbuddy.ie/director-calculator.html', link: '', summary: JSON.stringify(SUM) }), {}).message;
/* the html from its card on, past the title and the inbox preview line */
[dm.html.slice(dm.html.indexOf('class="pb-card')), dm.text].forEach(function (body, i) {
  var k = i ? 'text' : 'html', q = function (w) { return body.indexOf(i ? w : E.esc(w)); };
  var order = [q('€1,511,849'), q('Prices rise over time.'), q('Your figures'.toUpperCase()) >= 0 ? q('YOUR FIGURES') : q('Your figures'),
               q('What this means'.toUpperCase()) >= 0 ? q('WHAT THIS MEANS') : q('What this means'), body.indexOf('booking.html'), q(WARN1), q(TEXT.regulator)];
  eq('40. ' + k + ': headline, its sentence, your figures, what this means, the button, the warnings, the footer, in that order',
     order.every(function (x, j) { return x >= 0 && (j === 0 || x > order[j - 1]); }), true);
  has('41. ' + k + ': the headline in today\'s money', body, i ? "€1,060,915 in today's money" : '€1,060,915 in today&#39;s money');
  ['You', 'Your pension', 'Assumptions', 'Your results'].forEach(function (h) { has('42. ' + k + ': the heading "' + h + '"', body, h); });
  has('43. ' + k + ': growth as a %', body, '5%');
  has('43. ' + k + ': inflation as a %', body, '2%');
});
eq('44. html: one label and one value per row, in two columns', (dm.html.match(/<td class="pb-rule"/g) || []).length, 2 * 6);
eq('45. one booking button', (dm.html.match(/booking\.html/g) || []).length, 1);
eq('46. no jargon words in the email', ['actuarial', 'drawdown', 'AMC', 'notional', 'reckonable', 'SFT'].filter(function (w) { return dm.text.indexOf(w) >= 0; }), []);
eq('47. a summary that is not ours falls back to the two lists', E.plan('calculator-results', calc({ summary: '{"v":2}' }), {}).message.text.indexOf('At 66 you could have about €412,000') >= 0, true);
eq('47. a summary that is not JSON falls back too', E.plan('calculator-results', calc({ summary: '<b>x' }), {}).message.text.indexOf('Pension saved so far') >= 0, true);
var ev = E.plan('calculator-results', calc({ summary: JSON.stringify({ v: 1, head: { label: '<i>x</i>', value: '<script>' } }) }), {}).message;
eq('48. the summary is escaped', /<script>|<i>x/.test(ev.html), false);

group('THE GUIDE EMAIL');
var g = E.plan('director-guide', { email: 'a@b.ie', consent: 'yes', marketing_consent: 'no' }, GUIDE_ENV).message;
eq('35. subject', g.subject, 'The Pensionbuddy guide for company directors');
has('36. the link', g.text, 'https://pensionbuddy.ie/guides/director.pdf');
eq('37. one link in the body, the guide', (g.html.match(/<a /g) || []).length, 1);
eq('38. no booking button, no warnings', [g.html.indexOf('booking.html') < 0, g.html.indexOf(WARN1) < 0], [true, true]);
has('39. why they got it', g.text, 'You got this email because you asked for this guide');

group('THE REPLY FORMS: ENQUIRY AND PENSION-TRACE');
function ask(over) {
  var d = { 'form-name': 'enquiry', 'bot-field': '', topic: 'Check my pension', details: 'Provider: Zurich | Value: €25,000 to €100,000',
            message: 'Are the charges fair?', name: 'Mary', email: 'mary@example.com', contact_by: 'Email', phone: '',
            page: 'https://pensionbuddy.ie/index.html', reply_by: 'Tuesday 13 October' };
  Object.keys(over || {}).forEach(function (k) { d[k] = over[k]; });
  return d;
}
function trace(over) {
  var d = { 'form-name': 'pension-trace', 'bot-field': '', jobs: 'Harbour Bank, 1998 to 2004, Irish Life | Quay Foods, 2005 to 2006',
            jobs_count: '2', name: 'Mary Byrne', other_names: 'Mary Kelly', email: 'mary@example.com', phone: '087 123 4567',
            page: 'https://pensionbuddy.ie/tracker.html', reply_by: 'Monday 12 October' };
  Object.keys(over || {}).forEach(function (k) { d[k] = over[k]; });
  return d;
}
var aq = E.plan('enquiry', ask(), {}), tq = E.plan('pension-trace', trace(), {});
eq('52. enquiry: a copy to the sender, with no box to tick', [aq.send, aq.message && aq.message.to], [true, ['mary@example.com']]);
eq('52. pension-trace: a copy to the sender', [tq.send, tq.message && tq.message.to], [true, ['mary@example.com']]);
eq('53. subjects', [aq.message.subject, tq.message.subject], ['Mary, we have your question', 'Mary, we have your list of old jobs']);
eq('53. no name: still plain', E.plan('enquiry', ask({ name: '' }), {}).message.subject, 'We have your question');
has('54. enquiry copy: the day we reply', aq.message.text, 'We’ll reply by Tuesday 13 October.');
has('54. enquiry copy: a call when asked for one', E.plan('enquiry', ask({ contact_by: 'Phone', phone: '087 1' }), {}).message.text, 'We’ll call you by Tuesday 13 October.');
has('54. a day not in our shape is not repeated', E.plan('enquiry', ask({ reply_by: '<b>tomorrow</b>' }), {}).message.text, 'within one working day');
has('55. enquiry copy: what they sent', aq.message.text, 'Provider: Zurich');
has('55. and the question', aq.message.text, 'Question: Are the charges fair?');
has('55. pension-trace copy: each job', tq.message.text, 'Job 2: Quay Foods, 2005 to 2006');
eq('56. honeypot filled: no copy and no alert', [E.plan('enquiry', ask({ 'bot-field': 'x' }), {}).send, E.alert('enquiry', ask({ 'bot-field': 'x' }), {}).send], [false, false]);
eq('56. a bad address: no copy', E.plan('enquiry', ask({ email: 'nope' }), {}).send, false);
var al = E.alert('enquiry', ask(), {}), tl = E.alert('pension-trace', trace(), {});
eq('57. the alert goes to hello@, from the website', [al.message.to, al.message.from], [['hello@pensionbuddy.ie'], 'Pensionbuddy website <hello@pensionbuddy.ie>']);
eq('57. replying answers the sender', al.message.reply_to, 'mary@example.com');
eq('57. LEAD_TO moves it', E.alert('enquiry', ask(), { LEAD_TO: 'damian@greshamwealth.ie' }).message.to, ['damian@greshamwealth.ie']);
eq('57. test mode: EMAIL_TEST_TO', E.alert('enquiry', ask(), { EMAIL_TEST: '1', EMAIL_TEST_TO: 't@x.ie' }).message.to, ['t@x.ie']);
eq('58. alert subjects', [al.message.subject, tl.message.subject], ['New question: Check my pension, from Mary', 'New trace request: 2 old jobs, from Mary Byrne']);
has('58. the alert carries the phone', tl.message.text, 'Phone: 087 123 4567');
has('58. and the previous surname', tl.message.text, 'Previous surname: Mary Kelly');
eq('58. an alert with no valid address still goes, with no reply-to', [E.alert('enquiry', ask({ email: 'x' }), {}).send, 'reply_to' in E.alert('enquiry', ask({ email: 'x' }), {}).message], [true, false]);
eq('59. no alert for the other forms', ['calculator-results', 'director-guide', 'pension-finder'].map(function (f) { return E.alert(f, calc(), {}).send; }), [false, false, false]);
var ae = E.plan('enquiry', ask({ message: '<script>x</script>', name: '<b>Eve</b>' }), {}).message;
eq('60. what they typed is escaped', /<script>x|<b>Eve/.test(ae.html + E.alert('enquiry', ask({ message: '<script>x</script>' }), {}).message.html), false);
eq('60. a day is our shape or nothing', [E.replyDay('Monday 12 October'), E.replyDay('Sunday 11 October'), E.replyDay('Monday 32 October')], ['Monday 12 October', '', '']);

group('THE TOOLS: FEE CHECK, YEAR-END REMINDER, CHANGING JOBS, CALL BACK');
E.clock.now = function () { return new Date('2026-10-12T10:00:00Z'); };
var fc = E.plan('fee-check', { pot: '100000', fee: '1', age: '40', cost: '€1', email: 'mary@example.com', reply_by: 'Monday 12 October' }, {});
eq('63. fee check: a copy to the sender', [fc.send, fc.message.subject], [true, 'We have your fee check']);
has('63. the cost worked out again here at 6%, not taken from the page', fc.message.text, 'Fees by 66: €104,616');
eq('63. figures that are not figures are left out', E.plan('fee-check', { pot: 'x', fee: '1', age: '40', email: 'a@b.ie' }, {}).message.text.indexOf('Fees by 66'), -1);
eq('63. fee check alert subject', E.alert('fee-check', { pot: '100000', fee: '1', age: '40', email: 'mary@example.com' }, {}).message.subject, 'Fee check: €100,000 at 1.00%, from mary@example.com');
eq('64. year end: March from 12 October 2026 is 31 March 2027, reminder 17 February',
   [E.yearEnd('March', E.clock.now()).end.toISOString().slice(0, 10), E.yearEnd('March', E.clock.now()).rem.toISOString().slice(0, 10)], ['2027-03-31', '2027-02-17']);
eq('64. October: the end of this month, too close, so today', [E.yearEnd('October', E.clock.now()).close, E.yearEnd('October', E.clock.now()).days], [true, 19]);
eq('64. September: already past, so next year', E.yearEnd('September', E.clock.now()).end.toISOString().slice(0, 10), '2027-09-30');
eq('64. not a month: nothing', E.yearEnd('Smarch', E.clock.now()), null);
var yc = E.plan('year-end-reminder', { year_end: 'March', email: 'mary@example.com', reply_by: 'Monday 12 October' }, {});
eq('65. year end: the copy says the day, and every year', [yc.message.subject, /We\u2019ll remind you on 17 February 2027, and every year after\./.test(yc.message.text)], ['Your year-end reminder is set', true]);
var yclose = E.plan('year-end-reminder', { year_end: 'October', email: 'a@b.ie' }, {}).message;
eq('65. close: the copy is the reminder itself', [yclose.subject, /year end is 31 October 2026\./.test(yclose.text), /counts against this year/.test(yclose.text)], ['Your year end is close', true, true]);
var ya = E.alert('year-end-reminder', { year_end: 'March', email: 'mary@example.com' }, {}).message;
eq('66. the alert: no calendar file, it goes by itself', ['attachments' in ya, /every year after, by itself/.test(ya.text)], [false, true]);
eq('66. close: the subject says how close', E.alert('year-end-reminder', { year_end: 'October', email: 'a@b.ie' }, {}).message.subject, 'Year end in 19 days: a@b.ie');
eq('66. due: six weeks before the end of the month, any year', [E.reminderDue('March', new Date('2027-02-17T07:00:00Z')).toISOString().slice(0, 10),
   E.reminderDue('March', new Date('2028-02-18T07:00:00Z')) && E.reminderDue('March', new Date('2028-02-18T07:00:00Z')).toISOString().slice(0, 10),
   E.reminderDue('March', new Date('2027-02-18T07:00:00Z')), E.reminderDue('December', new Date('2026-11-19T07:00:00Z')).toISOString().slice(0, 10)],
   ['2027-03-31', '2028-03-31', null, '2026-12-31']);
var rm = E.reminder({ email: 'mary@example.com', year_end: 'March' }, new Date(Date.UTC(2027, 2, 31)), {});
eq('66. the reminder: to them, from us, the date and the line', [rm.to, rm.subject, /year end is 31 March 2027\./.test(rm.text), /Reply to stop them/.test(rm.text)],
   [['mary@example.com'], 'Your year end is six weeks away', true, true]);
eq('66. no address, or the honeypot: no reminder', [E.reminder({ email: 'x' }, new Date(), {}), E.reminder({ email: 'a@b.ie', 'bot-field': 'x' }, new Date(), {})], [null, null]);
var jc = E.plan('job-change', { change: 'Leaving a job', when: 'This month', email: 'mary@example.com', reply_by: 'Monday 12 October' }, {}).message;
eq('67. changing jobs: subject', jc.subject, 'Changing jobs: first steps');
has('67. leaving: its first steps', jc.text, 'Keep your leaving statement.');
has('67. starting: its own', E.plan('job-change', { change: 'Starting a job', email: 'a@b.ie' }, {}).message.text, 'Join as early as you can.');
eq('67. alert subject', E.alert('job-change', { change: 'Leaving a job', when: 'This month', email: 'mary@example.com' }, {}).message.subject, 'Changing jobs: Leaving a job, this month, from mary@example.com');
var cb = { name: 'Mary', phone: '087 123 4567', time: 'Afternoon', reply_by: 'Monday 12 October' };
eq('68. call back: no email asked for, so no copy', E.plan('callback', cb, {}).send, false);
eq('68. but the alert goes, with no reply-to', [E.alert('callback', cb, {}).send, 'reply_to' in E.alert('callback', cb, {}).message], [true, false]);
eq('68. subject and line', [E.alert('callback', cb, {}).message.subject, E.alert('callback', cb, {}).message.text.split('\n')[0]],
   ['Call back: Mary, 087 123 4567, afternoon', 'The site told them we call Monday 12 October, in the afternoon.']);
var ar = E.plan('enquiry', ask({ topic: 'About a result', details: 'Calculator: Pension calculator | Projected pot at retirement: €460,066 | Your age now: 40 | Pension saved so far: €50,000' }), {}).message;
has('69. a result: every row of it in the copy', ar.text, 'Pension saved so far: €50,000');

group('THE FUNCTION: NEVER THROWS, ALWAYS 200, LOGS NO ADDRESS');
var logs = [];
var origLog = console.log, origErr = console.error;
function quiet() { logs = []; console.log = function (s) { logs.push(s); }; console.error = function (s) { logs.push(s); }; }
function loud() { console.log = origLog; console.error = origErr; }
function event(form, data) { return { body: JSON.stringify({ payload: { id: 'sub123', form_name: form, data: data } }) }; }

(async function () {
  var calls = [];
  function okFetch(url, opts) { calls.push({ url: url, opts: opts }); return Promise.resolve({ ok: true, status: 200 }); }

  quiet();
  var r = await F._handler(event('calculator-results', calc()), {}, { env: { EMAIL_API_KEY: 're_test' }, fetch: okFetch });
  loud();
  eq('40. sent: 200', r.statusCode, 200);
  eq('41. one call to Resend', calls.map(function (c) { return c.url; }), ['https://api.resend.com/emails']);
  eq('42. the key from EMAIL_API_KEY', calls[0].opts.headers.Authorization, 'Bearer re_test');
  eq('43. idempotent per submission', calls[0].opts.headers['Idempotency-Key'], 'submission-sub123');
  var sent = JSON.parse(calls[0].opts.body);
  eq('44. html and text both', [typeof sent.html, typeof sent.text], ['string', 'string']);
  eq('45. no address in the log', logs.join(' ').indexOf('mary@example.com'), -1);

  calls = [];
  quiet();
  r = await F._handler(event('calculator-results', calc({ consent: '' })), {}, { env: { EMAIL_API_KEY: 're_test' }, fetch: okFetch });
  loud();
  eq('46. no consent: 200 and no call', [r.statusCode, calls.length], [200, 0]);

  quiet();
  r = await F._handler(event('calculator-results', calc()), {}, { env: {}, fetch: okFetch });
  loud();
  eq('47. no key: 200, no call, logged', [r.statusCode, calls.length, /EMAIL_API_KEY is not set/.test(logs.join(' '))], [200, 0, true]);

  quiet();
  r = await F._handler(event('calculator-results', calc()), {}, { env: { EMAIL_API_KEY: 'k' },
    fetch: function () { return Promise.resolve({ ok: false, status: 422, json: function () { return Promise.resolve({ name: 'validation_error', message: 'bad to: mary@example.com' }); } }); } });
  loud();
  eq('48. Resend refuses: 200, logged', [r.statusCode, /send failed: Resend answered 422: validation_error/.test(logs.join(' '))], [200, true]);
  eq('48. and the log carries no address', logs.join(' ').indexOf('mary@example.com'), -1);

  quiet();
  r = await F._handler(event('calculator-results', calc()), {}, { env: { EMAIL_API_KEY: 'k' }, fetch: function () { return Promise.reject(new Error('network down')); } });
  loud();
  eq('49. network failure: 200, logged', [r.statusCode, /network down/.test(logs.join(' '))], [200, true]);

  quiet();
  r = await F._handler({ body: 'not json' }, {}, { env: { EMAIL_API_KEY: 'k' }, fetch: okFetch });
  loud();
  eq('50. a broken event: 200, logged', [r.statusCode, /failed:/.test(logs.join(' '))], [200, true]);

  quiet();
  r = await F._handler(undefined, {}, { env: {}, fetch: okFetch });
  loud();
  eq('51. no event at all: 200', r.statusCode, 200);

  calls = [];
  quiet();
  r = await F._handler(event('enquiry', ask()), {}, { env: { EMAIL_API_KEY: 'k' }, fetch: okFetch });
  loud();
  eq('61. enquiry: two calls, the alert to Damian first', calls.map(function (c) { return JSON.parse(c.opts.body).to[0]; }), ['hello@pensionbuddy.ie', 'mary@example.com']);
  eq('61. each idempotent on its own key', calls.map(function (c) { return c.opts.headers['Idempotency-Key']; }), ['submission-sub123-alert', 'submission-sub123']);
  eq('61. no address in the log', logs.join(' ').indexOf('mary@example.com'), -1);

  calls = [];
  quiet();
  r = await F._handler(event('pension-trace', trace({ email: 'bad' })), {}, { env: { EMAIL_API_KEY: 'k' }, fetch: okFetch });
  loud();
  eq('62. no valid address: the alert still goes, no copy', [r.body, calls.length], ['sent', 1]);

  /* the daily reminders: Netlify's API stood in for, and Resend */
  var Y = await import('../netlify/functions/year-end-reminders.mjs');
  calls = [];
  var subs = [{ id: 's1', data: { year_end: 'March', email: 'mary@example.com' } }, { id: 's2', data: { year_end: 'June', email: 'joe@example.com' } },
              { id: 's3', data: { year_end: 'March', email: 'not an address' } }];
  function api(url, opts) {
    calls.push({ url: url, opts: opts || {} });
    if (/\/sites\/site1\/forms$/.test(url)) return Promise.resolve({ ok: true, json: function () { return Promise.resolve([{ id: 'f9', name: 'year-end-reminder' }]); } });
    if (/\/forms\/f9\/submissions/.test(url)) return Promise.resolve({ ok: true, json: function () { return Promise.resolve(/page=1$/.test(url) ? subs : []); } });
    return Promise.resolve({ ok: true, status: 200 });
  }
  quiet();
  var y1 = await Y.run({ env: { NETLIFY_API_TOKEN: 't', EMAIL_API_KEY: 'k' }, site: 'site1', fetch: api, now: new Date('2027-02-17T07:00:00Z') });
  loud();
  var mails = calls.filter(function (c) { return c.url === 'https://api.resend.com/emails'; });
  eq('70. the day: only March\u2019s reminder with an address goes', [y1.sent, mails.map(function (c) { return JSON.parse(c.opts.body).to[0]; })], [1, ['mary@example.com']]);
  eq('70. once per submission per year', mails[0].opts.headers['Idempotency-Key'], 'reminder-s1-2027-03-31');
  eq('70. no address in the log', logs.join(' ').indexOf('mary@example.com'), -1);
  calls = [];
  quiet();
  var y2 = await Y.run({ env: { NETLIFY_API_TOKEN: 't', EMAIL_API_KEY: 'k' }, site: 'site1', fetch: api, now: new Date('2027-02-18T07:00:00Z') });
  loud();
  eq('70. the day after: nothing', y2.sent, 0);
  quiet();
  var y3 = await Y.run({ env: { EMAIL_API_KEY: 'k' }, site: 'site1', fetch: api, now: new Date() });
  loud();
  eq('70. no token: nothing, logged', [y3.sent, /NETLIFY_API_TOKEN/.test(logs.join(' '))], [0, true]);
})();
