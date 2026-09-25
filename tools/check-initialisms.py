#!/usr/bin/env python3
"""Every initialism spelled out at its first use, on every page.

    python3 tools/check-initialisms.py                 # every page
    python3 tools/check-initialisms.py pia.html ...    # some pages
    python3 tools/check-initialisms.py --all           # also list the ones that pass

Reg 88 of the Consumer Protection Code 2025 asks for an initialism to be spelled
out where it is used; the site's rule (Run 22) is that each page spells out
each initialism at its FIRST use, as "Personal Retirement Savings Account
(PRSA)". This is the check, committed so the next audit reruns it instead of
rebuilding it (Run 22's scan was not kept, and Run 25 had to rebuild it).

It does not work from a list. Every token of two or more capitals is found
(a plural s and dotted forms like B.A. included), so a new initialism is caught
the first time a page uses it.

WHAT IT READS. Each page is served from the working tree with a probe
injected in memory (nothing is written to disk) and loaded in the local
headless Chrome, so script-written text is included. Three texts:

  dom       every text node in document order, hidden ones included: a folded
            panel, a jargon chip's definition and a result the page has not
            shown yet can all be opened by a reader
  visible   the page's innerText, what is laid out now
  tabs      for every role="tab", the text and alt/aria-label the tab's panel
            shows once it is clicked, read after the text that precedes the
            tablist: how the home page's tool picker swaps its photograph

WHAT COUNTS AS SPELLED OUT, at the first use:

  paren     "Full name (INIT)", the site's form
  after     "INIT (Full name)"
  before    the full name immediately before, as in the glossary's headings
            ("Defined Contribution DC") or "a qualifying recognised overseas
            pension scheme, a QROPS": the initials of the words before match
  next      the full name immediately after, as in the glossary's "PIA
            Personal Investment Account"

EXCEPTIONS are listed below with their reasons; everything else is a FAIL.
Not covered: text a script writes only after some other interaction (a
slider moved, a form sent). Those strings live in assets/js and the parts'
page.js files; search them by hand after changing them.

Exit status 1 if any page has an initialism not spelled out at first use.
"""
import functools, html, http.server, json, os, re, socket, subprocess, sys, threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

TOKEN = re.compile(r'(?<![\w.])(?:[A-Z]\.){2,}|(?<![\w\'’-])[A-Z][A-Z0-9&]*[A-Z](?:s)?(?![\w’\'-])')
SMALL = {'of', 'and', 'the', 'for', 'a', 'an', 'to', 'in', 'on', 'or', '&'}

# Left as they are, each for a reason. Keys are the token with any dots and a
# plural s removed. Run 22 settled the first six; Run 25 added HM and PDF and
# put both to Damian.
EXCEPT = {
    'UK': 'a country, in everyday use (the footer\'s "Worked in the UK")',
    'GOV': 'GOV.UK, a web address',
    'HM': 'part of a department\'s name, "HM Revenue and Customs (HMRC)"',
    'KPMG': 'a firm\'s own name',
    'CEO': 'a job title, in the home page\'s locked founder section',
    'CMO': 'a job title, in the home page\'s locked founder section',
    'BA': 'a degree, in the home page\'s locked founder section',
    'PDF': 'the name of the option in the reader\'s own print window',
    'II': 'a Roman numeral ("IORP II")',
    'III': 'a Roman numeral ("appendix III")',
}

# The games draw on a canvas, and the jargon quiz asks what PRSI stands for,
# so spelling it out would give the answer away (Run 22).
SKIP_PAGES = ('games/',)

PROBE = r"""
window.addEventListener('load', function () { setTimeout(function () {
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1 };
  function walk(until) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      for (var p = n.parentNode; p && p !== document.body; p = p.parentNode) {
        if (SKIP[p.nodeName] || p.id === 'PBPROBE') return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    } });
    var out = [], n;
    while ((n = w.nextNode())) {
      if (until && (until.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
      out.push(n.nodeValue);
    }
    return out.join(' ');
  }
  function labels(root) {
    var out = [];
    root.querySelectorAll('[alt],[aria-label]').forEach(function (e) {
      ['alt', 'aria-label'].forEach(function (a) { var v = e.getAttribute(a); if (v) out.push(v); });
    });
    return out.join(' ');
  }
  var res = { dom: walk(null), visible: document.body.innerText, tabs: [] };
  var tabs = [].slice.call(document.querySelectorAll('[role="tab"]'));
  tabs.forEach(function (t) {
    try { t.click(); } catch (e) { return; }
    var id = t.getAttribute('aria-controls'), panel = id && document.getElementById(id);
    var list = t.closest('[role="tablist"]') || t;
    res.tabs.push({ tab: (t.textContent || '').trim().slice(0, 60),
                    before: walk(list),
                    shown: panel ? panel.innerText + ' ' + labels(panel) : labels(document.body) });
  });
  var pre = document.createElement('pre');
  pre.id = 'PBPROBE';
  pre.textContent = JSON.stringify(res);
  document.body.appendChild(pre);
}, 600); });
"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/__pbprobe.js':
            return self._send(PROBE.encode('utf-8'), 'application/javascript')
        if path.endswith('.html') and '?probe' in self.path:
            text = open(os.path.join(ROOT, path.lstrip('/')), encoding='utf-8').read()
            i = text.rindex('</body>')
            text = text[:i] + '<script src="/__pbprobe.js"></script>' + text[i:]
            return self._send(text.encode('utf-8'), 'text/html; charset=utf-8')
        return super().do_GET()

    def _send(self, body, ctype):
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)


def serve():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Handler, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, port


def read_page(port, page):
    r = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--window-size=1200,1000',
                        '--virtual-time-budget=6000', '--dump-dom',
                        'http://127.0.0.1:%d/%s?probe' % (port, page)],
                       capture_output=True, text=True, timeout=120)
    m = re.search(r'<pre id="PBPROBE">(.*?)</pre>', r.stdout, re.S)
    return json.loads(html.unescape(m.group(1))) if m else None


def key_of(tok):
    k = tok.replace('.', '')
    return k[:-1] if len(k) > 2 and k.endswith('s') and k[:-1].isupper() else k


def initials(words):
    return ''.join(w[0].upper() for w in words if w.lower() not in SMALL and w[0].isalpha())


def how_spelled(text, m):
    """paren, after, before or next, or None when not spelled out here."""
    key = key_of(m.group(0))
    before, after = text[max(0, m.start() - 200):m.start()], text[m.end():m.end() + 200]
    if before.rstrip().endswith('('):
        return 'paren'
    a = re.match(r'\s*\(([^)]{3,140})\)', after)
    if a and re.search(r'[a-z]', a.group(1)):
        return 'after'
    prev = re.findall(r"[A-Za-z][A-Za-z'’-]*", re.sub(r',\s*(?:a|an|the)?\s*$', ' ', before))
    for n in range(len(key), len(key) + 5):
        if n <= len(prev) and initials(prev[-n:]) == key:
            return 'before'
    nxt = re.findall(r"[A-Za-z][A-Za-z'’-]*", after[:160])
    for n in range(len(key), len(key) + 5):
        if initials(nxt[:n]) == key:
            return 'next'
    return None


def first_uses(text):
    text = re.sub(r'\s+', ' ', text)
    out = {}
    for m in TOKEN.finditer(text):
        k = key_of(m.group(0))
        if k not in out:
            out[k] = (how_spelled(text, m), text[max(0, m.start() - 70):m.end() + 50])
    return out


def pages(args):
    if args:
        return args
    found = sorted(f for f in os.listdir(ROOT) if f.endswith('.html'))
    return [p for p in found if not p.startswith(SKIP_PAGES)]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    show_all = '--all' in sys.argv
    srv, port = serve()
    bad = 0
    try:
        for page in pages(args):
            d = read_page(port, page)
            if d is None:
                print('%-36s FAIL  the page did not report its text' % page)
                bad += 1
                continue
            rows = {}
            for stream in ('dom', 'visible'):
                for k, (how, ctx) in first_uses(d[stream]).items():
                    if k not in rows or (rows[k][0] and not how):
                        rows[k] = (how, ctx, stream)
            for t in d['tabs']:
                for k, (how, ctx) in first_uses(t['before'] + ' ' + t['shown']).items():
                    if k not in rows or (rows[k][0] and not how):
                        rows[k] = (how, ctx, 'tab "%s"' % t['tab'])
            fails = [(k, r) for k, r in sorted(rows.items()) if not r[0] and k not in EXCEPT]
            bad += len(fails)
            ok = sorted(k for k, r in rows.items() if r[0])
            ex = sorted(k for k, r in rows.items() if not r[0] and k in EXCEPT)
            print('%-36s %s  %d spelled out%s' % (page, 'FAIL' if fails else 'ok  ', len(ok),
                  ('; left as they are: ' + ', '.join(ex)) if ex else ''))
            for k, (how, ctx, stream) in fails:
                print('    %-8s not spelled out at its first use (%s): ...%s...' % (k, stream, ctx))
            if show_all:
                for k in ok:
                    print('    %-8s %-6s ...%s...' % (k, rows[k][0], rows[k][1]))
    finally:
        srv.shutdown()
    print('\n%s' % ('every initialism is spelled out at its first use' if not bad
                    else '%d initialism(s) not spelled out at first use' % bad))
    if not bad:
        print('left as they are, by rule: ' + '; '.join('%s, %s' % (k, v) for k, v in EXCEPT.items()))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
