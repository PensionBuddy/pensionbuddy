#!/usr/bin/env python3
"""The seven lead forms, submitted for real in headless Chrome (Run 27).

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
  3. the honeypot sent empty, the email as typed, the consent as yes or no
  4. accepted: the page's existing success state
  5. refused: the page's existing email route ("Your email app should have
     opened"), or for booking, the calendar all the same
  6. no script error on the page
and, for assets/js/pb-forms.js itself: a 2xx is true; a 404, a network
failure and no answer inside TIMEOUT_MS are each false; a field the form does
not declare is refused before anything is posted.

The form names and pages are tests/build.test.py's LEAD_FORMS.
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
    'booking.html': 'booking',
    'pension-calculator.html': 'pension-calculator-results',
    'director-calculator.html': 'director-calculator-results',
    'director.html': 'director-guide',
    'starter.html': 'starter-guide',
    'tracker.html': 'tracker-guide',
    'find-my-pension.html': 'pension-finder',
}

# how the probe fills each page, and where it reads the outcome
PROBE = r"""<script>
(function(){
  var R={errors:[]};
  window.addEventListener('error',function(e){R.errors.push(String(e.message||e));},true);
  var q=new URLSearchParams(location.search), mode=q.get('__lead'), tick=mode==='ok';
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
      window.fetch=real; R.unit=out; finish();
    });
    return;
  }

  if(page==='booking.html'){
    set('qName','Test Person'); set('qEmail','test@example.com'); $('pDirector').click();
  }else if($('ecForm')){
    set('ecEmail','test@example.com'); $('ecOptin').checked=tick;
  }else if($('mForm')){
    set('mEmail','test@example.com'); $('mOptin').checked=tick;
  }else if($('pfForm')){
    set('pfEmp0Name','Harbour Bank'); set('pfEmp0From','2005'); set('pfEmp0To','2011');
    set('pfName','Test Person'); set('pfDob','1970-04-07'); set('pfAddress','1 Main Street, Dublin');
    set('pfEmail','test@example.com'); set('pfSigned','Test Person'); $('pfConfirm').checked=true;
    $('pfOptin').checked=tick;
  }
  var form=document.querySelector('form[data-netlify="true"]');
  R.form=form?form.getAttribute('name'):null;
  form.requestSubmit();
  var n=0;
  (function poll(){
    n++;
    var ok=$('ecOk')||$('mOk');
    if(page==='booking.html'){ R.done=visible($('calStage')); R.said=text('qualDoneMsg'); }
    else if(ok){ R.done=ok.classList.contains('show'); R.said=text('ecOkText')||text('mOkText'); }
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
                    'f.src="/"+j[0]+"?__lead="+j[1];document.body.appendChild(f);var n=0;'
                    '(function poll(){n++;var p=null;try{p=f.contentDocument.getElementById("__lead");}catch(e){}'
                    'if(p){OUT.push([j[0],j[1],p.textContent]);f.remove();next();return;}'
                    'if(n>1200){OUT.push([j[0],j[1],null]);f.remove();next();return;}setTimeout(poll,25);})();}'
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
        ref = parse_qs(urlparse(self.headers.get('Referer') or '').query).get('__lead', [''])[0]
        page = urlparse(self.headers.get('Referer') or '').path.lstrip('/')
        with Recorder.lock:
            Recorder.posts.append({'page': page, 'mode': ref, 'path': self.path,
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
    """The names the page's Netlify form declares in its static HTML."""
    def __init__(self):
        super().__init__()
        self.names, self.inside, self.form = [], False, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'form' and a.get('data-netlify') == 'true':
            self.inside, self.form = True, a.get('name')
        elif self.inside and tag in ('input', 'textarea', 'select') and a.get('name'):
            if a['name'] not in self.names:
                self.names.append(a['name'])

    def handle_endtag(self, tag):
        if tag == 'form':
            self.inside = False


# Run 28: every lead form's success message, word for word
SUCCESS = "Thanks - we've got it. Damian will be in touch personally."

def main():
    if not os.path.exists(CHROME):
        print('Chrome not found at %s' % CHROME)
        sys.exit(1)
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    jobs = [[p, m] for p in LEAD_FORMS for m in ('ok', 'fail')] + [['booking.html', 'unit']]
    url = 'http://127.0.0.1:%d/__leads?jobs=%s' % (port, json.dumps(jobs).replace(' ', ''))
    p = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
                        '--disable-extensions', '--mute-audio', '--window-size=1280,1000',
                        '--virtual-time-budget=240000', '--dump-dom', url],
                       capture_output=True, timeout=240)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'<pre id="__all">([^<]*)</pre>', dom)
    eq('0. one Chrome launch returned every job', bool(m), True)
    if not m:
        report(); return
    results = {}
    for page, mode, b64 in json.loads(html.unescape(m.group(1))):
        results[(page, mode)] = json.loads(base64.b64decode(b64).decode('utf-8')) if b64 else None

    for page, name in LEAD_FORMS.items():
        d = Declared(); d.feed(open(os.path.join(ROOT, page), encoding='utf-8').read())
        eq('%s: the static form is "%s"' % (page, name), d.form, name)
        for mode in ('ok', 'fail'):
            r = results.get((page, mode))
            tag = '%s [%s]' % (name, 'accepted' if mode == 'ok' else 'refused')
            eq('%s: the probe reported' % tag, r is not None, True)
            if r is None:
                continue
            posts = [x for x in Recorder.posts if x['page'] == page and x['mode'] == mode]
            eq('%s: exactly one POST' % tag, len(posts), 1)
            if not posts:
                continue
            x = posts[0]
            fields = parse_qs(x['body'], keep_blank_values=True)
            eq('%s: to "/", urlencoded' % tag, (x['path'], x['type']), ('/', 'application/x-www-form-urlencoded'))
            eq('%s: every declared field, and nothing else' % tag, sorted(fields), sorted(d.names))
            eq('%s: each field once' % tag, [k for k, v in fields.items() if len(v) != 1], [])
            eq('%s: form-name' % tag, fields.get('form-name'), [name])
            eq('%s: the honeypot empty' % tag, fields.get('bot-field'), [''])
            eq('%s: the email as typed' % tag, fields.get('email'), ['test@example.com'])
            if 'marketing_consent' in fields:
                eq('%s: the consent as the box was left' % tag, fields['marketing_consent'],
                   ['yes' if mode == 'ok' else 'no'])
            if 'page' in fields:
                eq('%s: the page it came from' % tag, fields['page'][0].split('?')[0].endswith('/' + page), True)
            blank = sorted(k for k, v in fields.items() if v == [''] and k not in
                           ('bot-field', 'other_names', 'phone', 'signature_drawn'))
            eq('%s: nothing else blank' % tag, blank, [])
            eq('%s: no script error' % tag, r.get('errors'), [])
            eq('%s: the page moved on' % tag, r.get('done'), True)
            said = r.get('said') or ''
            if page == 'booking.html':
                eq('%s: the calendar opens either way' % tag, said.startswith('Thanks, Test.'), True)
            elif mode == 'ok':
                # Run 28: one success message on every form, promising only
                # what happens (Netlify emails the visitor nothing)
                eq('%s: says it arrived' % tag, SUCCESS in said and 'email app' not in said, True)
                eq('%s: and promises nothing that is not sent' % tag,
                   [w for w in ('on its way', 'on the way', 'if nothing arrives', 'delivery depends') if w in said.lower()], [])
            else:
                eq('%s: opens the email instead' % tag, 'Your email app should have opened' in said, True)

    u = (results.get(('booking.html', 'unit')) or {}).get('unit') or {}
    eq('pb-forms: a 2xx is true', u.get('ok200'), True)
    eq('pb-forms: a 404 is false', u.get('no404'), False)
    eq('pb-forms: a network failure is false', u.get('network'), False)
    eq('pb-forms: no answer is false', u.get('hang'), False)
    eq('pb-forms: after TIMEOUT_MS, not before', 3900 <= (u.get('hangMs') or 0) <= 6000, True)
    has_msg = 'has no hidden field "not_declared"' in (u.get('undeclared') or '')
    eq('pb-forms: an undeclared field is refused', has_msg, True)
    eq('pb-forms: and nothing is posted', u.get('undeclaredPosted'), False)
    srv.shutdown()
    report()


if __name__ == '__main__':
    main()
