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
/* Each calculator's summary is what the real page sent at its defaults
   (tests/lead-forms.test.py with PB_SUMMARIES_OUT set), so the shots show
   the one template with real figures. */
var SAMPLES = {
  'calculator-results': { form: 'calculator-results', data: { email: 'mary@example.com', consent: 'yes', name: 'Mary Byrne',
    summary: "{\"v\":1,\"calc\":\"pension-calculator\",\"head\":{\"label\":\"Your pension pot when you stop work\",\"value\":\"€460,066\",\"today\":\"€274,926\"},\"more\":[{\"label\":\"Income it could pay, each month\",\"value\":\"€1,534\",\"today\":\"€917\"}],\"groups\":[{\"title\":\"You\",\"rows\":[{\"label\":\"Your age now\",\"value\":\"40\"},{\"label\":\"Age you stop work\",\"value\":\"66\"},{\"label\":\"What you earn in a year\",\"value\":\"€50,000\"}]},{\"title\":\"Your pension\",\"rows\":[{\"label\":\"Saved in your pension so far\",\"value\":\"€50,000\"},{\"label\":\"You pay in each month\",\"value\":\"€300\"},{\"label\":\"Your employer pays in each month\",\"value\":\"€150\"}]},{\"title\":\"Assumptions\",\"rows\":[{\"label\":\"Growth each year\",\"value\":\"5%\"},{\"label\":\"Prices rise each year (inflation)\",\"value\":\"2%\"}]}],\"years\":26}",
    link: 'https://pensionbuddy.ie/pension-calculator.html', page: 'https://pensionbuddy.ie/pension-calculator.html' } },
  'calculator-results-director': { form: 'calculator-results', data: { email: 'mary@example.com', consent: 'yes', name: 'Mary Byrne',
    summary: "{\"v\":1,\"calc\":\"director-calculator\",\"head\":{\"label\":\"Your pension pot when you stop work\",\"value\":\"€1,511,849\",\"today\":\"€1,058,535\"},\"more\":[{\"label\":\"Company tax saved, all years added up\",\"value\":\"€90,000\"}],\"groups\":[{\"title\":\"You\",\"rows\":[{\"label\":\"Your age now\",\"value\":\"48\"},{\"label\":\"Age you stop work\",\"value\":\"66\"},{\"label\":\"Your salary in a year\",\"value\":\"€100,000\"}]},{\"title\":\"Your pension\",\"rows\":[{\"label\":\"Saved in your pension so far\",\"value\":\"€150,000\"},{\"label\":\"Your company pays in each year\",\"value\":\"€40,000\"},{\"label\":\"Share of that money put in your pension\",\"value\":\"half into the pension\"}]},{\"title\":\"Assumptions\",\"rows\":[{\"label\":\"Growth each year\",\"value\":\"5%\"},{\"label\":\"Prices rise each year (inflation)\",\"value\":\"2%\"}]}],\"years\":18}",
    link: 'https://pensionbuddy.ie/director-calculator.html', page: 'https://pensionbuddy.ie/director-calculator.html' } },
  'calculator-results-fees': { form: 'calculator-results', data: { email: 'mary@example.com', consent: 'yes', name: 'Mary Byrne',
    summary: "{\"v\":1,\"calc\":\"pension-fees-calculator\",\"head\":{\"label\":\"Your plan, when you stop work\",\"value\":\"€227,710\",\"today\":\"€138,796\"},\"more\":[{\"label\":\"The other plan, when you stop work\",\"value\":\"€258,137\",\"today\":\"€157,342\"}],\"groups\":[{\"title\":\"You\",\"rows\":[{\"label\":\"Years until you stop work\",\"value\":\"25\"}]},{\"title\":\"Your pension\",\"rows\":[{\"label\":\"Saved in your pension so far\",\"value\":\"€50,000\"},{\"label\":\"Paid in each month\",\"value\":\"€200\"},{\"label\":\"Yearly charge, your plan\",\"value\":\"1%\"},{\"label\":\"Charge on each payment, your plan\",\"value\":\"5%\"},{\"label\":\"Yearly charge, the other plan\",\"value\":\"0.5%\"},{\"label\":\"Charge on each payment, the other plan\",\"value\":\"0%\"}]},{\"title\":\"Assumptions\",\"rows\":[{\"label\":\"Growth each year, before charges\",\"value\":\"5%\"},{\"label\":\"Prices rise each year (inflation)\",\"value\":\"2%\"}]}],\"years\":25}",
    link: 'https://pensionbuddy.ie/pension-fees-calculator.html', page: 'https://pensionbuddy.ie/pension-fees-calculator.html' } },
  'calculator-results-state-pension': { form: 'calculator-results', data: { email: 'mary@example.com', consent: 'yes', name: 'Mary Byrne',
    summary: "{\"v\":1,\"calc\":\"state-pension-entitlement\",\"head\":{\"label\":\"State Pension, each week\",\"value\":\"€280.86\"},\"more\":[{\"label\":\"State Pension, each year\",\"value\":\"€14,605\"}],\"groups\":[{\"title\":\"You\",\"rows\":[{\"label\":\"Year you were born\",\"value\":\"1962\"},{\"label\":\"Year you first paid social insurance (PRSI)\",\"value\":\"1985\"}]},{\"title\":\"Your pension\",\"rows\":[{\"label\":\"Weeks you paid social insurance\",\"value\":\"1,560\"},{\"label\":\"Weeks credited to you\",\"value\":\"260\"},{\"label\":\"Weeks spent caring at home (HomeCaring)\",\"value\":\"0\"}]}]}",
    link: 'https://pensionbuddy.ie/state-pension-entitlement.html', page: 'https://pensionbuddy.ie/state-pension-entitlement.html' } },
  'calculator-results-sft': { form: 'calculator-results', data: { email: 'mary@example.com', consent: 'yes', name: 'Mary Byrne',
    summary: "{\"v\":1,\"calc\":\"standard-fund-threshold\",\"head\":{\"label\":\"Share of the limit your pensions would use\",\"value\":\"75%\"},\"more\":[{\"label\":\"The limit for that year\",\"value\":\"€2,200,000\"}],\"groups\":[{\"title\":\"You\",\"rows\":[{\"label\":\"Year you take your pensions\",\"value\":\"2026\"}]},{\"title\":\"Your pension\",\"rows\":[{\"label\":\"All your pensions added up\",\"value\":\"€1,650,000\"},{\"label\":\"Lump sum you take\",\"value\":\"€400,000\"}]}]}",
    link: 'https://pensionbuddy.ie/standard-fund-threshold.html', page: 'https://pensionbuddy.ie/standard-fund-threshold.html' } },
  'director-guide': { form: 'director-guide', data: { email: 'mary@example.com', consent: 'yes' } },
  'starter-guide': { form: 'starter-guide', data: { email: 'mary@example.com', consent: 'yes' } },
  'tracker-guide': { form: 'tracker-guide', data: { email: 'mary@example.com', consent: 'yes' } }
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  var names = Object.keys(SAMPLES);
  names.forEach(function (n) {
    var m = E.plan(SAMPLES[n].form, SAMPLES[n].data, GUIDE_ENV).message;
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
