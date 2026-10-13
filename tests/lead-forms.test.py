#!/usr/bin/env python3
"""The lead forms, submitted for real in headless Chrome (Run 27; five form
   names on thirteen pages since Run 45: "Email me this result" under one name
   on every calculator that offers it, and no form in front of the booking
   calendar).

    python3 tests/lead-forms.test.py

A local server stands in for Netlify: it serves the site, and it answers the
forms' POST to "/" with 200 or 500, recording every body it is sent. Each page
is loaded with a probe that fills its form the way a reader would and submits
it; the probe reads back what the page then says. Every page runs twice, once
with the post accepted and once refused, all in ONE Chrome launch.

What it proves, per form:
  1. exactly one POST, urlencoded, carrying the form's own form-name
  2. carrying every field the form declares in its static HTML, and nothing
     else: Netlify keeps only the declared fields, so an undeclared one would
     be silently lost, and a declared one never filled would arrive blank
  3. the honeypot sent empty, the name and email as typed, the consent as
     yes or no (on "Email me this result", the box the reader must tick: yes)
  4. accepted: the page's existing success state
  5. refused: the page's existing email route ("Your email app should have
     opened")
  6. no script error on the page
and, for assets/js/pb-forms.js itself: a 2xx is true; a 404, a network
failure and no answer inside TIMEOUT_MS are each false; a field the form does
not declare is refused before anything is posted.

The form names and pages are tests/build.test.py's LEAD_FORMS and
REPLY_FORMS. A page can carry two forms (the tracker page: the guide and the
old jobs timeline), so each job names its form, and the probe, the declared
fields and the recorded POST are all that form's.
"""
import base64, html, json, os, re, socket, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
from harness import eq, report  # noqa: E402

CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

LEAD_FORMS = {
    'director.html': 'director-guide',
    'starter.html': 'starter-guide',
    'tracker.html': 'tracker-guide',
    'find-my-pension.html': 'pension-finder',
    # Run 43, item 5e, and Run 45: the shared form (pagebuild.after_block):
    # name, email and the box to tick, no opt-in box
    'pension-calculator.html': 'calculator-results',
    'director-calculator.html': 'calculator-results',
    'director-pension-rules.html': 'calculator-results',
    'broker-vs-autoenrolment.html': 'calculator-results',
    'pension-fees-calculator.html': 'calculator-results',
    'state-pension-reality-check.html': 'calculator-results',
    'state-pension-entitlement.html': 'calculator-results',
    'standard-fund-threshold.html': 'calculator-results',
    'pia.html': 'calculator-results',
}

# the forms that ask Damian to reply (tools/lead-blocks.py), by form name
REPLY_FORMS = {
    'enquiry': ['booking.html', 'director-pension-rules.html', 'director-year-end-checklist.html', 'director.html', 'glossary.html',
                'index.html', 'pensions-over-50.html', 'self-employed-pensions.html', 'starter.html', 'uk-pensions-in-ireland.html'],
    'pension-trace': ['tracker.html'],
    # the fee check ("fee-check") left the home page on 13 October 2026, for the cost of waiting: on no page now
    'year-end-reminder': ['director.html'],
    'job-change': ['tracker.html'],
    'callback': ['booking.html'],
}
# "Ask us about this" under a result (pagebuild.after_block, on every page
# in pagebuild.AFTER): a form in the page that posts as enquiry, with the
# fields the Ask form declares. Here on the skeleton, a built calculator and
# the two lists, each with what it sends that the others do not.
ASK_RESULT = {'pension-calculator.html': ' | Your age: ', 'state-pension-reality-check.html': ' | PRSI contributions by 66: ',
              'my-pensions.html': ' | Your list: 1 pension, \u20ac40,000 | Pension 1: Irish Life, \u20ac40,000',
              'director-pension-rules.html': ' | Your list: '}
JOBS = (sorted(LEAD_FORMS.items()) + sorted((p, n) for n, ps in REPLY_FORMS.items() for p in ps) +
        [(p, 'ask-result') for p in sorted(ASK_RESULT)])

# Job 4: the calculators whose headline is a projection, so it is also shown
# in today's money
PROJECTED = ('pension-calculator.html', 'director-calculator.html', 'pension-fees-calculator.html', 'pia.html')
SUMMARIES = {}

# how the probe fills each page, and where it reads the outcome
PROBE = r"""<script>
(function(){
  var R={errors:[]};
  window.addEventListener('error',function(e){
    /* an off-site file that cannot load here (the booking calendar's) is not this page's error */
    var t=e.target,u=t&&t!==window&&(t.src||t.href);
    if(u&&String(u).indexOf(location.origin)!==0)return;
    R.errors.push(String(e.message||e));},true);
  var q=new URLSearchParams(location.search), mode=q.get('__lead'), tick=mode==='ok', fname=q.get('__form');
  function $(id){return document.getElementById(id);}
  function set(id,v){var el=$(id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}
  function finish(){
    var p=document.createElement('pre');p.id='__lead';
    p.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(R))));
    document.body.appendChild(p);
  }
  function text(id){var el=$(id);return el?el.textContent.trim():'';}
  function visible(el){return !!el&&getComputedStyle(el).display!=='none'&&!el.hidden;}
  var page=location.pathname.replace(/^\//,'');

  if(mode==='unit'){
    /* pb-forms.js on its own, against stubbed fetches */
    var form=document.querySelector('form[data-netlify="true"]'), real=window.fetch, out={};
    /* the day Damian replies by: weekends and Irish public holidays skipped */
    out.replyBy=[PBForms.replyBy(new Date(2026,9,10,9)),PBForms.replyBy(new Date(2026,9,23,15)),PBForms.replyBy(new Date(2026,11,24,12))];
    function run(stub){ window.fetch=stub; return PBForms.send(form); }
    run(function(){return Promise.resolve({ok:true});}).then(function(v){out.ok200=v;
      return run(function(){return Promise.resolve({ok:false,status:404});});}).then(function(v){out.no404=v;
      return run(function(){return Promise.reject(new TypeError('network'));});}).then(function(v){out.network=v;
      var t0=performance.now();
      return run(function(){return new Promise(function(){});}).then(function(v){out.hang=v;out.hangMs=Math.round(performance.now()-t0);});
    }).then(function(){
      var posted=false; window.fetch=function(){posted=true;return Promise.resolve({ok:true});};
      try{ PBForms.send(form,{not_declared:'x'}); out.undeclared='no throw'; }
      catch(e){ out.undeclared=String(e.message); }
      out.undeclaredPosted=posted;
      /* a filled honeypot: nothing posted, and a quiet success */
      var hp=form.elements['bot-field']; posted=false; hp.value='http://spam.example';
      return PBForms.send(form).then(function(v){ out.botOk=v; out.botPosted=posted; hp.value='';
        window.fetch=real; R.unit=out; finish(); });
    });
    return;
  }

  var OKS={'year-end-reminder':'pbyOk','job-change':'pbmOk','callback':'pbcOk','ask-result':'pbrOk'};
  if(fname==='year-end-reminder'){
    $('pbyForm').querySelector('input[name="year_end"][value="March"]').click(); set('pbyEmail','test@example.com');
  }else if(fname==='job-change'){
    $('pbmForm').querySelector('input[name="change"][value="Leaving a job"]').click();
    $('pbmForm').querySelector('input[name="when"][value="This month"]').click(); set('pbmEmail','test@example.com');
  }else if(fname==='callback'){
    set('pbcName','Test Person'); set('pbcPhone','087 123 4567');
  }else if(fname==='ask-result'){
    /* a result first: the directors' four answers, or one pension listed */
    if($('drForm')){['drExec','drMore','drAge','drBig'].forEach(function(n){document.querySelector('input[name="'+n+'"][value="yes"]').click();});$('drForm').requestSubmit();}
    if($('ptName0')){set('ptName0','Irish Life');set('ptValue0','40000');}
    set('pbrMsg','What does this mean?'); set('pbrEmail','test@example.com');
  }else if(fname==='enquiry'){
    $('askForm').querySelector('input[name="topic"][value="Check my pension"]').click();
    $('askForm').querySelector('.pb-ask-step.on .pb-ask-next').click();
    [].forEach.call($('askForm').querySelectorAll('.pb-ask-chips'),function(g){g.children[1].click();});
    $('askForm').querySelector('.pb-ask-step.on .pb-ask-next').click();
    set('askMsg','Are the charges fair?'); set('askName','Test Person'); set('askEmail','test@example.com');
  }else if(fname==='pension-trace'){
    set('pbjEmp','Harbour Bank'); set('pbjFrom','2005'); set('pbjTo','2011'); $('pbjAddBtn').click();
    set('pbjName','Test Person'); set('pbjEmail','test@example.com');
  }else if($('drForm')){
    /* the directors' rules: a result first, the four answers and the list */
    ['drExec','drMore','drAge','drBig'].forEach(function(n){document.querySelector('input[name="'+n+'"][value="yes"]').click();});
    $('drForm').requestSubmit();
  }
  if(fname==='enquiry'||fname==='pension-trace'||OKS[fname]){
    /* filled above */
  }else if($('ecForm')){
    $('ecMore').click();
    set('ecName','Test Person'); set('ecEmail','test@example.com'); $('ecConsent').checked=true;
  }else if($('mForm')){
    set('mEmail','test@example.com'); $('mConsent').checked=true; $('mOptin').checked=tick;
  }else if($('pfForm')){
    set('pfEmp0Name','Harbour Bank'); set('pfEmp0From','2005'); set('pfEmp0To','2011');
    set('pfName','Test Person'); set('pfDob','1970-04-07'); set('pfAddress','1 Main Street, Dublin');
    set('pfEmail','test@example.com'); set('pfSigned','Test Person'); $('pfConfirm').checked=true;
    $('pfOptin').checked=tick;
  }
  var form=fname==='ask-result'?$('pbrForm'):document.querySelector('form[name="'+fname+'"]');
  R.form=form?form.getAttribute('name'):null;
  form.requestSubmit();
  var n=0;
  (function poll(){
    n++;
    if(OKS[fname]){ var ok=$(OKS[fname]); R.done=!ok.hidden; var t=ok.querySelector('[data-ok-text]')||$('pbrOkText'); R.said=t?t.textContent.trim():''; }
    else if(fname==='enquiry'){ R.done=!$('askOk').hidden; R.said=text('askOkText'); }
    else if(fname==='pension-trace'){ R.done=!$('pbjOk').hidden; R.said=text('pbjOkText'); }
    else if($('ecOk')){ R.done=!$('ecOk').hidden; R.said=text('ecOkText'); }
    else if($('mOk')){ R.done=$('mOk').classList.contains('show'); R.said=text('mOkText'); }
    else { R.done=visible($('pfStep4')); R.said=text('pfDone'); }
    if(R.done||n>200){ setTimeout(finish,300); return; }
    setTimeout(poll,25);
  })();
})();
</script>"""


class Recorder:
    lock = threading.Lock()
    posts = []


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path == '/__leads':
            jobs = json.loads(q['jobs'][0])
            body = ('<!doctype html><meta charset="utf-8"><body><script>'
                    'var JOBS=%s,OUT=[];'
                    'function next(){var j=JOBS.shift();if(!j){var p=document.createElement("pre");p.id="__all";'
                    'p.textContent=JSON.stringify(OUT);document.body.appendChild(p);return;}'
                    'var f=document.createElement("iframe");f.style.cssText="width:1200px;height:900px";'
                    'f.src="/"+j[0]+"?__lead="+j[1]+"&__form="+j[2];document.body.appendChild(f);var n=0;'
                    '(function poll(){n++;var p=null;try{p=f.contentDocument.getElementById("__lead");}catch(e){}'
                    'if(p){OUT.push([j[0],j[1],j[2],p.textContent]);f.remove();next();return;}'
                    'if(n>1200){OUT.push([j[0],j[1],j[2],null]);f.remove();next();return;}setTimeout(poll,25);})();}'
                    'next();</script></body>') % json.dumps(jobs)
            return self._send(body.encode('utf-8'))
        path = u.path.lstrip('/')
        fs = os.path.join(ROOT, path)
        if path.endswith('.html') and os.path.isfile(fs) and '__lead' in q:
            t = open(fs, encoding='utf-8').read()
            t = t.replace('</body>', PROBE + '</body>', 1)
            return self._send(t.encode('utf-8'))
        return super().do_GET()

    def do_POST(self):
        n = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(n).decode('utf-8')
        rq = parse_qs(urlparse(self.headers.get('Referer') or '').query)
        ref, fname = rq.get('__lead', [''])[0], rq.get('__form', [''])[0]
        page = urlparse(self.headers.get('Referer') or '').path.lstrip('/')
        with Recorder.lock:
            Recorder.posts.append({'page': page, 'mode': ref, 'form': fname, 'path': self.path,
                                   'type': self.headers.get('Content-Type'), 'body': body})
        status = 200 if ref == 'ok' else 500
        b = b'<!doctype html><title>stand-in</title>'
        self.send_response(status)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _send(self, b):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(b)


class Declared(HTMLParser):
    """The names one Netlify form on the page declares in its static HTML."""
    def __init__(self, want):
        super().__init__()
        self.want, self.names, self.inside, self.form = want, [], False, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'form' and a.get('data-netlify') == 'true' and a.get('name') == self.want:
            self.inside, self.form = True, a.get('name')
        elif self.inside and tag in ('input', 'textarea', 'select') and a.get('name'):
            if a['name'] not in self.names:
                self.names.append(a['name'])

    def handle_endtag(self, tag):
        if tag == 'form':
            self.inside = False


# Run 28: every lead form's success message, word for word (Run 45: "Email
# me this result" has its own, with the reader's first name)
SUCCESS = "Thanks - we've got it. The guide is emailed to you automatically."
SUCCESS_FINDER = "Thanks - we've got it. Damian will be in touch personally."
SUCCESS_RESULT = 'Thanks, Test. Because you ticked the box, this result is emailed to you automatically.'
DAY = '[A-Z][a-z]+day \\d{1,2} [A-Z][a-z]+'
REPLIED = re.compile('^Thanks, Test\\. We\u2019ll reply by ' + DAY + '\\.$')
SUCCESS_REPLY = {'enquiry': REPLIED, 'pension-trace': REPLIED,
                 'ask-result': re.compile('^We\u2019ll reply by ' + DAY + '\\.$'),
                 'year-end-reminder': re.compile('^(We\u2019ll remind you on \\d{1,2} [A-Z][a-z]+ \\d{4}, and every year after|Year end is close\\. Check your email)\\.$'),
                 'job-change': re.compile('^We\u2019ll email you by ' + DAY + '\\.$'),
                 'callback': re.compile('^We\u2019ll call ' + DAY + ', in the morning\\.$')}

def main():
    if not os.path.exists(CHROME):
        print('Chrome not found at %s' % CHROME)
        sys.exit(1)
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    jobs = [[p, m, n] for p, n in JOBS for m in ('ok', 'fail')] + [['standard-fund-threshold.html', 'unit', 'calculator-results']]
    url = 'http://127.0.0.1:%d/__leads?jobs=%s' % (port, json.dumps(jobs).replace(' ', ''))
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
                        '--disable-extensions', '--mute-audio', '--window-size=1280,1000',
                        '--virtual-time-budget=480000', '--dump-dom', url],
                       capture_output=True, timeout=480)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'<pre id="__all">([^<]*)</pre>', dom)
    eq('0. one Chrome launch returned every job', bool(m), True)
    if not m:
        report(); return
    results = {}
    for page, mode, fname, b64 in json.loads(html.unescape(m.group(1))):
        results[(page, mode, fname)] = json.loads(base64.b64decode(b64).decode('utf-8')) if b64 else None

    for page, name in JOBS:
        posted = 'enquiry' if name == 'ask-result' else name
        d = Declared(posted); d.feed(open(os.path.join(ROOT, page), encoding='utf-8').read())
        eq('%s: the static form is "%s"' % (page, name), d.form, posted)
        for mode in ('ok', 'fail'):
            r = results.get((page, mode, name))
            tag = '%s on %s [%s]' % (name, page, 'accepted' if mode == 'ok' else 'refused')
            eq('%s: the probe reported' % tag, r is not None, True)
            if r is None:
                continue
            posts = [x for x in Recorder.posts if x['page'] == page and x['mode'] == mode and x['form'] == name]
            eq('%s: exactly one POST' % tag, len(posts), 1)
            if not posts:
                continue
            x = posts[0]
            fields = parse_qs(x['body'], keep_blank_values=True)
            eq('%s: to "/", urlencoded' % tag, (x['path'], x['type']), ('/', 'application/x-www-form-urlencoded'))
            eq('%s: every declared field, and nothing else' % tag, sorted(fields), sorted(d.names))
            eq('%s: each field once' % tag, [k for k, v in fields.items() if len(v) != 1], [])
            eq('%s: form-name' % tag, fields.get('form-name'), [posted])
            eq('%s: the honeypot empty' % tag, fields.get('bot-field'), [''])
            if name != 'callback':
                eq('%s: the email as typed' % tag, fields.get('email'), ['test@example.com'])
            got = lambda *ks: [fields.get(k, [''])[0] for k in ks]
            if name == 'year-end-reminder':
                eq('%s: the month, and the reminder day' % tag,
                   (got('year_end')[0], bool(re.match(r'^(\d{1,2} [A-Z][a-z]+ \d{4}|As soon as possible)$', got('remind_on')[0]))), ('March', True))
            if name == 'job-change':
                eq('%s: leaving, and when' % tag, got('change', 'when'), ['Leaving a job', 'This month'])
            if name == 'callback':
                eq('%s: the name, the number and the time' % tag, got('name', 'phone', 'time'), ['Test Person', '087 123 4567', 'Morning'])
            if name == 'ask-result':
                eq('%s: about a result, its rows, the question' % tag,
                   (got('topic')[0], got('details')[0].startswith('Calculator: '), ASK_RESULT[page] in got('details')[0], got('message', 'contact_by')),
                   ('About a result', True, True, ['What does this mean?', 'Email']))
            if name == 'calculator-results':
                eq('%s: the name as typed, and the box ticked' % tag, (fields.get('name'), fields.get('consent')), (['Test Person'], ['yes']))
                # Job 4: the summary the email is laid out from
                try:
                    sm = json.loads(fields.get('summary', [''])[0])
                except ValueError:
                    sm = {}
                eq('%s: the summary is ours, for this calculator' % tag, (sm.get('v'), sm.get('calc')), (1, page[:-5]))
                if page == 'director-pension-rules.html':
                    eq('%s: the summary carries the list' % tag, bool(sm.get('notes')), True)
                else:
                    eq('%s: the summary has a headline figure and grouped rows' % tag,
                       (bool((sm.get('head') or {}).get('value')), [g['title'] for g in sm.get('groups', [])][:1]), (True, ['You']))
                if page in PROJECTED:
                    rows = [r for g in sm.get('groups', []) for r in g['rows']]
                    eq('%s: the headline in today\'s money' % tag, (sm.get('head') or {}).get('today', '').startswith('\u20ac'), True)
                    eq('%s: inflation among the assumptions, as a %%' % tag,
                       [r['value'] for r in rows if r['label'].startswith('Prices rise')], ['2%'])
                if mode == 'ok' and os.environ.get('PB_SUMMARIES_OUT'):
                    SUMMARIES[page] = fields.get('summary', [''])[0]
            if name == 'enquiry':
                eq('%s: the topic, the taps, the question, the name and the way to reply' % tag,
                   [fields.get(k, [''])[0] for k in ('topic', 'details', 'message', 'name', 'contact_by')],
                   ['Check my pension', 'Provider: Zurich | Value: \u20ac25,000 to \u20ac100,000', 'Are the charges fair?', 'Test Person', 'Email'])
            if name == 'pension-trace':
                eq('%s: the jobs, how many, and the name' % tag,
                   [fields.get(k, [''])[0] for k in ('jobs', 'jobs_count', 'name')], ['Harbour Bank, 2005 to 2011', '1', 'Test Person'])
            if name in REPLY_FORMS or name == 'ask-result':
                eq('%s: the day we reply by, in the one shape' % tag,
                   bool(re.match(r'^(Monday|Tuesday|Wednesday|Thursday|Friday) \d{1,2} [A-Z][a-z]+$', fields.get('reply_by', [''])[0])), True)
            if name.endswith('-guide'):
                # the box to email the guide (netlify/functions/submission-created.js sends only on yes)
                eq('%s: the box ticked' % tag, fields.get('consent'), ['yes'])
            if 'marketing_consent' in fields:
                eq('%s: the consent as the box was left' % tag, fields['marketing_consent'],
                   ['yes' if mode == 'ok' else 'no'])
            if 'page' in fields:
                eq('%s: the page it came from' % tag, fields['page'][0].split('?')[0].endswith('/' + page), True)
            blank = sorted(k for k, v in fields.items() if v == [''] and k not in
                           ('bot-field', 'other_names', 'phone', 'signature_drawn', 'message') +
                           (('name',) if name == 'ask-result' else ()))
            eq('%s: nothing else blank' % tag, blank, [])
            eq('%s: no script error' % tag, r.get('errors'), [])
            eq('%s: the page moved on' % tag, r.get('done'), True)
            said = r.get('said') or ''
            if mode == 'ok':
                # Run 28: one success message on every form, promising only
                # what happens (Netlify emails the visitor nothing)
                if name in SUCCESS_REPLY:
                    eq('%s: says it arrived, and when we reply' % tag, bool(SUCCESS_REPLY[name].match(said)), True)
                else:
                    eq('%s: says it arrived' % tag, (SUCCESS_RESULT if name == 'calculator-results' else SUCCESS_FINDER if name == 'pension-finder' else SUCCESS) in said and 'email app' not in said, True)
                eq('%s: and promises nothing that is not sent' % tag,
                   [w for w in ('on its way', 'on the way', 'if nothing arrives', 'delivery depends') if w in said.lower()], [])
            else:
                eq('%s: opens the email instead' % tag, 'Your email app should have opened' in said, True)

    u = (results.get(('standard-fund-threshold.html', 'unit', 'calculator-results')) or {}).get('unit') or {}
    eq('pb-forms: the day Damian replies by skips weekends and public holidays', u.get('replyBy'),
       ['Monday 12 October', 'Tuesday 27 October', 'Tuesday 29 December'])
    eq('pb-forms: a 2xx is true', u.get('ok200'), True)
    eq('pb-forms: a 404 is false', u.get('no404'), False)
    eq('pb-forms: a network failure is false', u.get('network'), False)
    eq('pb-forms: no answer is false', u.get('hang'), False)
    eq('pb-forms: after TIMEOUT_MS, not before', 3900 <= (u.get('hangMs') or 0) <= 6000, True)
    has_msg = 'has no hidden field "not_declared"' in (u.get('undeclared') or '')
    eq('pb-forms: an undeclared field is refused', has_msg, True)
    eq('pb-forms: and nothing is posted', u.get('undeclaredPosted'), False)
    eq('pb-forms: a filled honeypot posts nothing', u.get('botPosted'), False)
    eq('pb-forms: and the bot is told it worked', u.get('botOk'), True)
    # every form that sends anything carries the honeypot, declared to Netlify
    for page in sorted(set(p for p, _ in JOBS)):
        src = open(os.path.join(ROOT, page), encoding='utf-8').read()
        for m in re.finditer(r'<form\b[^>]*data-netlify="true"[^>]*>(.*?)</form>', src, re.S):
            eq('%s: its Netlify form declares the honeypot and carries the field' % page,
               ('netlify-honeypot="bot-field"' in m.group(0), 'name="bot-field"' in m.group(1)), (True, True))
    if os.environ.get('PB_SUMMARIES_OUT'):
        with open(os.environ['PB_SUMMARIES_OUT'], 'w', encoding='utf-8') as f:
            json.dump(SUMMARIES, f, ensure_ascii=False, indent=1)
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
