/* Netlify runs this after every verified form submission (the event name
   "submission-created" is the file name; nothing else wires it up).

   It emails the submitter what they asked for, through Resend, when
   netlify/lib/emails.js says to. It never throws and always answers 200:
   the submission is already stored in Netlify Forms whatever happens here,
   and this function stores nothing of its own. A failure is logged, with
   the form name and submission id but never the address or the figures.

   Environment: EMAIL_API_KEY (Resend), and optionally EMAIL_TEST=1 with
   EMAIL_TEST_TO, GUIDE_URL_DIRECTOR, GUIDE_URL_STARTER, GUIDE_URL_TRACKER.
   docs/EMAIL-SETUP.md. */
'use strict';

var emails = require('../lib/emails.js');

var RESEND = 'https://api.resend.com/emails';
var TIMEOUT_MS = 8000;

function log(level, msg, extra) {
  var line = '[submission-created] ' + msg + (extra ? ' ' + JSON.stringify(extra) : '');
  (level === 'error' ? console.error : console.log)(line);
}

async function send(message, key, id, fetchImpl) {
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
  try {
    var headers = { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
    if (id) headers['Idempotency-Key'] = 'submission-' + id;   // a retried event sends once
    var r = await fetchImpl(RESEND, { method: 'POST', headers: headers, body: JSON.stringify(message), signal: ctrl.signal });
    if (r.ok) return { ok: true };
    // the error's name only: Resend's message can quote the address
    var detail = '';
    try { detail = String((await r.json()).name || '').slice(0, 80); } catch (e) { /* no JSON body */ }
    return { ok: false, error: 'Resend answered ' + r.status + (detail ? ': ' + detail : '') };
  } catch (e) {
    return { ok: false, error: e && e.name === 'AbortError' ? 'Resend did not answer in ' + TIMEOUT_MS + 'ms' : String(e && e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

async function handler(event, context, deps) {
  var env = (deps && deps.env) || process.env;
  var fetchImpl = (deps && deps.fetch) || fetch;
  var form = '', id = '';
  try {
    var payload = JSON.parse((event && event.body) || '{}').payload || {};
    form = String(payload.form_name || '');
    id = String(payload.id || '');
    var p = emails.plan(form, payload.data || {}, env);
    if (!p.send) {
      log('info', 'nothing sent: ' + p.reason, { form: form, id: id });
      return { statusCode: 200, body: 'not sent' };
    }
    var key = env.EMAIL_API_KEY;
    if (!key) {
      log('error', 'nothing sent: EMAIL_API_KEY is not set', { form: form, id: id });
      return { statusCode: 200, body: 'not sent' };
    }
    var r = await send(p.message, key, id, fetchImpl);
    if (r.ok) {
      log('info', 'sent' + (String(env.EMAIL_TEST) === '1' ? ' (test mode, to EMAIL_TEST_TO)' : ''), { form: form, id: id });
      return { statusCode: 200, body: 'sent' };
    }
    log('error', 'send failed: ' + r.error, { form: form, id: id });
  } catch (e) {
    log('error', 'failed: ' + String(e && e.stack || e), { form: form, id: id });
  }
  return { statusCode: 200, body: 'not sent' };
}

exports.handler = function (event, context) { return handler(event, context); };
exports._handler = handler;   // tests/submission-created.test.js passes its own env and fetch
