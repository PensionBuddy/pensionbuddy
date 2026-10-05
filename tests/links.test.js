/* Damian's Calendly link: one copy, shared/site-links.json.

       node tests/links.test.js

   Every Calendly event link in a page, script, the email code or a test is
   that one, and nothing else on the site names a calendar. The booking
   page's script adds the utm_* tags to it at run time
   (tests/give-then-ask.test.mjs G11 checks the tags arrive). */
'use strict';
var fs = require('fs'), path = require('path');
var H = require('./harness.js');
var t = H.suite('links');
var ROOT = path.join(__dirname, '..');
var CALENDLY = require('../shared/site-links.json').calendly;
var PAT = /https:\/\/calendly\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/g;

t.eq('1. the shared link', CALENDLY, 'https://calendly.com/damian-pensionbuddy/pensionbuddy-1-1');

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    if (/^(\.git|node_modules|docs)$/.test(e.name)) return;
    var p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|js|mjs|py|json)$/.test(e.name)) out.push(p);
  });
  return out;
}
var found = 0;
walk(ROOT, []).forEach(function (f) {
  var rel = path.relative(ROOT, f);
  if (rel === path.join('shared', 'site-links.json') || rel === path.join('tests', 'links.test.js')) return;
  var m = fs.readFileSync(f, 'utf8').match(PAT) || [];
  found += m.length;
  m.forEach(function (u) { t.eq('2. ' + rel + ': the shared link', u, CALENDLY); });
});
var booking = fs.readFileSync(path.join(ROOT, 'booking.html'), 'utf8');
t.eq('3. booking.html: the fallback button uses it', booking.indexOf('id="calOpenBtn" href="' + CALENDLY + '"') >= 0, true);
t.eq('3. booking.html: the embed uses it', booking.indexOf("var CAL_EVENT_URL='" + CALENDLY + "'") >= 0, true);
t.eq('4. links checked', found >= 2, true);
