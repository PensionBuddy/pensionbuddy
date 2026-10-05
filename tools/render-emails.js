/* Writes each email netlify/lib/emails.js sends, with sample figures, to
   docs/email-shots/: <name>.html, <name>.txt, and with --shots a phone-width
   screenshot in light and dark mode (needs Playwright).

       node tools/render-emails.js [--shots] */
'use strict';
var fs = require('fs'), path = require('path');
var E = require('../netlify/lib/emails.js');
var OUT = path.join(__dirname, '..', 'docs', 'email-shots');

var GUIDE_ENV = { GUIDE_URL_DIRECTOR: 'https://pensionbuddy.ie/guides/director-guide.pdf',
                  GUIDE_URL_STARTER: 'https://pensionbuddy.ie/guides/starter-guide.pdf',
                  GUIDE_URL_TRACKER: 'https://pensionbuddy.ie/guides/tracker-guide.pdf' };
var SAMPLES = {
  'calculator-results': { email: 'mary@example.com', consent: 'yes', name: 'Mary Byrne',
    results: 'Your pension at 66 could be about €412,000 | That could pay about €1,370 a month, in today\'s money',
    inputs: 'Your age now: 40 | Retirement age: 66 | Pension saved so far: €50,000 | Your monthly contribution: €300 | ' +
            'Your annual earnings: €50,000 | Employer monthly contribution: €150 | Assumed yearly growth: 5%',
    link: 'https://pensionbuddy.ie/pension-calculator.html#age=40&ret=66&pot=50000',
    page: 'https://pensionbuddy.ie/pension-calculator.html' },
  'director-guide': { email: 'mary@example.com', consent: 'yes' },
  'starter-guide': { email: 'mary@example.com', consent: 'yes' },
  'tracker-guide': { email: 'mary@example.com', consent: 'yes' }
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  var names = Object.keys(SAMPLES);
  names.forEach(function (n) {
    var m = E.plan(n, SAMPLES[n], GUIDE_ENV).message;
    fs.writeFileSync(path.join(OUT, n + '.html'), m.html);
    fs.writeFileSync(path.join(OUT, n + '.txt'), 'From: ' + m.from + '\nReply-To: ' + m.reply_to + '\nSubject: ' + m.subject + '\n\n' + m.text);
  });
  if (process.argv.indexOf('--shots') < 0) return;
  var pw = require('playwright');
  var browser = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined });
  for (var i = 0; i < names.length; i++) {
    for (var scheme of ['light', 'dark']) {
      var page = await browser.newPage({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 2, colorScheme: scheme });
      await page.goto('file://' + path.join(OUT, names[i] + '.html'));
      await page.screenshot({ path: path.join(OUT, names[i] + '-' + scheme + '.png'), fullPage: true });
      await page.close();
    }
  }
  await browser.close();
}
main().catch(function (e) { console.error(e); process.exit(1); });
