/* Every morning, the year-end reminders due today.

   A director picks their company's year end on director.html
   (assets/js/pb-yearend.js); the submission stays in Netlify Forms as
   "year-end-reminder". Each day at 07:00 UTC this reads those submissions
   and emails everyone whose reminder is today: six weeks before the last day
   of the month they picked, every year (netlify/lib/emails.js reminderDue and
   reminder). To stop someone's reminders, delete their submission in
   Netlify Forms.

   Environment: EMAIL_API_KEY (Resend, as for submission-created) and
   NETLIFY_API_TOKEN, a Netlify personal access token, to read the
   submissions. docs/EMAIL-SETUP.md. It never throws; it logs what it did,
   never an address. */
import emails from '../lib/emails.js';

const API = 'https://api.netlify.com/api/v1';
const RESEND = 'https://api.resend.com/emails';
const FORM = 'year-end-reminder';

function log(msg, extra) { console.log('[year-end-reminders] ' + msg + (extra ? ' ' + JSON.stringify(extra) : '')); }

/* deps: { env, fetch, now, site } so tests/submission-created.test.js can run it */
export async function run(deps) {
  const env = deps.env || {}, get = deps.fetch, now = deps.now || new Date();
  const token = env.NETLIFY_API_TOKEN, key = env.EMAIL_API_KEY, site = deps.site || env.SITE_ID;
  if (!token || !key || !site) { log('nothing sent: NETLIFY_API_TOKEN, EMAIL_API_KEY or the site id is not set'); return { sent: 0 }; }
  const auth = { Authorization: 'Bearer ' + token };
  try {
    const forms = await (await get(API + '/sites/' + site + '/forms', { headers: auth })).json();
    const form = (Array.isArray(forms) ? forms : []).find((f) => f.name === FORM);
    if (!form) { log('no "' + FORM + '" form yet'); return { sent: 0 }; }
    let sent = 0, failed = 0;
    for (let page = 1; page <= 50; page++) {
      const subs = await (await get(API + '/forms/' + form.id + '/submissions?per_page=100&page=' + page, { headers: auth })).json();
      if (!Array.isArray(subs) || !subs.length) break;
      for (const sub of subs) {
        const d = sub.data || {}, end = emails.reminderDue(d.year_end, now);
        const msg = end && emails.reminder(d, end, env);
        if (!msg) continue;
        const r = await get(RESEND, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json',
                     'Idempotency-Key': 'reminder-' + sub.id + '-' + end.toISOString().slice(0, 10) },
          body: JSON.stringify(msg)
        });
        if (r.ok) sent++; else failed++;
      }
      if (subs.length < 100) break;
    }
    log('done', { sent: sent, failed: failed });
    return { sent: sent, failed: failed };
  } catch (e) {
    log('failed: ' + String(e && e.message || e));
    return { sent: 0 };
  }
}

export default async (req, context) => {
  await run({ env: process.env, fetch: fetch, site: context && context.site && context.site.id });
  return new Response('ok');
};

export const config = { schedule: '0 7 * * *' };
