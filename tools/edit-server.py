#!/usr/bin/env python3
"""
Local visual copy editor for the Pensionbuddy site.

    python3 tools/edit-server.py

Serves the site on localhost and lets you click any piece of static copy on the
rendered page and type over it. Nothing is written back into the HTML. Pressing
"Save my edits" writes a changes list to docs/copy-edits.json (and a readable
docs/copy-edits.txt) recording page, element, old text and new text.

WHY THE MARKERS ARE NOT IN THE HTML FILES
-----------------------------------------
The editable markers (data-pbe) and the editor itself are injected into the
*served copy* of each page, in memory. The files in the repo are opened read
only and never modified, so the editor cannot reach the deployed site: the
deployed pages are these files, and these files contain none of it.
tools/verify.py enforces that with a hard check.

WHAT IS EDITABLE, AND HOW DYNAMIC TEXT IS KEPT OUT
--------------------------------------------------
Four independent filters, each of which can veto an element:

  1. Structure   only "text leaf" elements, headings, paragraphs, list items,
                 link and button labels, table cells and the like. Anything
                 holding another block is skipped and we descend into it.
                 Form controls, script, style, aria-hidden and <head> are out.
  2. Script-aware  any element carrying an id that the page's own JavaScript
                 mentions is skipped, along with everything inside it. If the
                 page's code knows an element by name, we assume it writes to it.
  3. Settle check  the browser compares the text it actually rendered against
                 the text in the source file. Anything a script rewrote during
                 page load no longer matches, and is locked.
  4. Live watch  a MutationObserver keeps running. If a script changes an
                 element's text at any point in the session, that element's
                 editability is revoked on the spot.

Filters 3 and 4 catch what 1 and 2 cannot guess. Anything uncertain ends up
locked rather than editable, which is the intended bias.

Python 3.9 stdlib only.
"""
import argparse, functools, hashlib, html, http.server, json, os, re, socket
import subprocess, sys, threading, time, urllib.parse
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODE_DIR = os.path.join(ROOT, 'tools', 'edit-mode')
EDITS_JSON = os.path.join(ROOT, 'docs', 'copy-edits.json')
EDITS_TXT = os.path.join(ROOT, 'docs', 'copy-edits.txt')

# --- what may be an editable element -----------------------------------------
# Tags that can host a run of copy. A qualifying element is the OUTERMOST one
# whose subtree holds text and no other block, so you edit the paragraph rather
# than a stray span inside it.
TEXT_HOSTS = {
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'figcaption',
    'summary', 'button', 'label', 'legend', 'dt', 'dd', 'td', 'th', 'caption',
    'div', 'span', 'a', 'small', 'strong', 'em', 'b', 'i', 'cite', 'address',
}
# Tags allowed to sit inside an editable without disqualifying it. svg and img
# are allowed as opaque atoms: the browser makes them uneditable so a button
# label with an arrow icon is still editable text.
INLINE_OK = {
    'a', 'b', 'strong', 'i', 'em', 'span', 'br', 'sup', 'sub', 'abbr', 'small',
    'u', 'mark', 'wbr', 'time', 'code', 'svg', 'path', 'circle', 'ellipse',
    'line', 'polyline', 'polygon', 'rect', 'g', 'defs', 'use', 'img', 'picture',
    'source', 'title', 'del', 'ins', 'q', 'bdi', 'var', 'samp', 'kbd',
}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
        'meta', 'param', 'source', 'track', 'wbr'}
# Never descend into these at all.
OPAQUE = {'script', 'style', 'noscript', 'template', 'head', 'select',
          'textarea', 'option', 'iframe'}

# Class names that mark a control rather than copy. These are the segmented
# controls, the burger, the countdown chip and the two script-built widgets.
DENY_CLASS = {
    'seg', 'nav-toggle', 'nav-tick', 'nt-n', 'nt-l', 'nt-dot', 'ind',
    'pb-consent', 'pb-buddy', 'pb-b-head', 'pb-b-item', 'pb-b-q', 'pb-b-a',
    'pb-b-close', 'pb-c-yes', 'pb-c-no', 'logo-mark', 'skip',
}
# Roles that belong to the tab system.
DENY_ROLE = {'tab', 'tablist'}

FRIENDLY = {
    'h1': 'main heading', 'h2': 'heading', 'h3': 'sub-heading',
    'h4': 'sub-heading', 'h5': 'sub-heading', 'h6': 'sub-heading',
    'p': 'paragraph', 'li': 'list item', 'button': 'button label',
    'a': 'link text', 'label': 'field label', 'summary': 'FAQ question',
    'blockquote': 'quote', 'figcaption': 'caption', 'td': 'table cell',
    'th': 'table heading', 'dt': 'term', 'dd': 'definition',
    'span': 'text', 'div': 'text', 'small': 'small print',
    'strong': 'text', 'em': 'text', 'b': 'text', 'i': 'text',
    'cite': 'citation', 'address': 'address', 'legend': 'legend',
    'caption': 'table caption',
}


def strip_tags(s):
    """The text a browser would report for this markup, as textContent sees it:
    tags contribute nothing at all, not even a space."""
    return re.sub(r'<[^>]*>', '', re.sub(r'<!--.*?-->', '', s, flags=re.S))


def norm(s):
    """Whitespace-normalised text, so source layout never looks like a change."""
    return re.sub(r'\s+', ' ', (s or '').replace('\xa0', ' ')).strip()


class Node:
    __slots__ = ('tag', 'attrs', 'start', 'inner_start', 'inner_end', 'end',
                 'children', 'parent', 'text', 'has_block', 'has_atom', 'alt')

    def __init__(self, tag, attrs, start, inner_start, parent):
        self.tag, self.attrs, self.start = tag, attrs, start
        self.inner_start, self.inner_end, self.end = inner_start, None, None
        self.children, self.parent = [], parent
        self.text, self.has_block, self.has_atom, self.alt = '', False, False, None


class Doc(HTMLParser):
    """Position-tracking parse. Records each element's inner source range."""

    def __init__(self, src):
        super().__init__(convert_charrefs=True)
        self.src = src
        self.lines = [0]
        for line in src.splitlines(True):
            self.lines.append(self.lines[-1] + len(line))
        self.root = Node('#root', {}, 0, 0, None)
        self.stack = [self.root]
        self.opaque_depth = 0
        self.feed(src)
        self.close()

    def off(self):
        ln, col = self.getpos()
        return self.lines[ln - 1] + col

    # HTMLParser gives us byte-free line/col; get_starttag_text gives the tag
    # source verbatim, which is how we find where the content starts.
    def handle_starttag(self, tag, attrs):
        start = self.off()
        raw = self.get_starttag_text() or ('<' + tag + '>')
        node = Node(tag, dict(attrs), start, start + len(raw), self.stack[-1])
        self.stack[-1].children.append(node)
        if tag in OPAQUE:
            self.opaque_depth += 1
        if tag not in VOID:
            self.stack.append(node)
        else:
            node.inner_end = node.end = node.inner_start

    def handle_startendtag(self, tag, attrs):
        start = self.off()
        raw = self.get_starttag_text() or ''
        node = Node(tag, dict(attrs), start, start + len(raw), self.stack[-1])
        node.inner_end = node.end = node.inner_start
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        if tag in OPAQUE:
            self.opaque_depth = max(0, self.opaque_depth - 1)
        # Tolerate stray or mismatched closers: unwind to the matching open tag
        # if there is one, otherwise ignore the closer entirely.
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                end = self.off()
                for node in self.stack[i:]:
                    if node.inner_end is None:
                        node.inner_end = node.end = end
                del self.stack[i:]
                return

    def handle_data(self, data):
        if self.opaque_depth:
            return
        if data.strip():
            self.stack[-1].text += data


def script_ids(src):
    """Every id string that appears inside this page's own <script> blocks."""
    js = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', src, re.S | re.I))
    return set(re.findall(r"['\"]([A-Za-z][A-Za-z0-9_-]{1,40})['\"]", js))


def subtree_text(node):
    out = node.text
    for c in node.children:
        out += ' ' + subtree_text(c)
    return out


def has_block_inside(node):
    """True if any descendant element is a block, i.e. this is not a text leaf."""
    for c in node.children:
        if c.tag not in INLINE_OK or has_block_inside(c):
            return True
    return False


class Marks:
    """The editable elements of one page, and where they live in the source."""

    def __init__(self, page, src):
        self.page, self.src = page, src
        self.sha = hashlib.sha1(src.encode('utf-8')).hexdigest()[:12]
        self.items = {}          # id -> record
        self.inserts = []        # (offset, text) to splice into the served copy
        self._n = 0
        doc = Doc(src)
        self._deny_ids = script_ids(src)
        body = self._find(doc.root, 'body') or doc.root
        self._walk(body, False)
        self.inserts.sort(key=lambda x: x[0])

    def _find(self, node, tag):
        for c in node.children:
            if c.tag == tag:
                return c
            hit = self._find(c, tag)
            if hit:
                return hit
        return None

    def _in_control(self, node):
        """A control region: the burger, a segmented control, the countdown chip,
        the tab strip, anything hidden from assistive tech. Inherited downward,
        so the buttons inside a tablist are excluded with it."""
        a = node.attrs
        return (a.get('aria-hidden') == 'true'
                or a.get('role') in DENY_ROLE
                or bool(set((a.get('class') or '').split()) & DENY_CLASS))

    def _script_named(self, node):
        """The page's own JavaScript mentions this element's id, so assume it
        writes to it. Deliberately not inherited: an id on a wrapper such as
        #main or #mode1Results would otherwise take a whole region out, and the
        settle check plus live watch already cover anything inside that moves."""
        i = node.attrs.get('id')
        return bool(i and i in self._deny_ids)

    def _path(self, node):
        out = []
        cur = node
        while cur is not None and cur.tag != '#root':
            bit = cur.tag
            cls = (cur.attrs.get('class') or '').split()
            if cur.attrs.get('id'):
                bit += '#' + cur.attrs['id']
            elif cls:
                bit += '.' + cls[0]
            out.append(bit)
            cur = cur.parent
        return ' > '.join(reversed(out[:4]))

    def _add(self, node):
        self._n += 1
        eid = str(self._n)
        inner = self.src[node.inner_start:node.inner_end]
        text = norm(html.unescape(strip_tags(inner)))
        self.items[eid] = {
            'id': eid, 'page': self.page, 'tag': node.tag,
            'label': FRIENDLY.get(node.tag, node.tag),
            'where': self._path(node),
            'line': self.src.count('\n', 0, node.start) + 1,
            'text': text, 'html': inner, 'kind': 'text',
            'start': node.inner_start, 'end': node.inner_end,
        }
        # data-pbe goes in right after the tag name in the served copy only
        self.inserts.append((node.start + 1 + len(node.tag),
                             ' data-pbe="%s"' % eid))
        return eid

    def _add_alt(self, node):
        raw = self.src[node.start:node.inner_start]
        m = re.search(r'\balt\s*=\s*"([^"]*)"', raw)
        if not m or not norm(m.group(1)):
            return                      # empty alt is a decorative image, leave it
        self._n += 1
        eid = str(self._n)
        self.items[eid] = {
            'id': eid, 'page': self.page, 'tag': 'img', 'label': 'image alt text',
            'where': self._path(node),
            'line': self.src.count('\n', 0, node.start) + 1,
            'text': html.unescape(m.group(1)), 'html': '', 'kind': 'alt',
            'start': node.start + m.start(1), 'end': node.start + m.end(1),
        }
        self.inserts.append((node.start + 1 + len(node.tag),
                             ' data-pbe-alt="%s"' % eid))

    def _walk(self, node, in_control):
        for c in node.children:
            if c.tag in OPAQUE:
                continue
            control = in_control or self._in_control(c)
            if c.tag == 'img':
                if not control:
                    self._add_alt(c)
                continue
            if c.inner_end is None:          # never closed, do not trust its range
                continue
            is_leaf = (c.tag in TEXT_HOSTS and not has_block_inside(c)
                       and norm(subtree_text(c)))
            # A wrapper with no words of its own, holding two or more separate
            # runs of copy, is edited as its parts. The announcement bar is the
            # case in point: two independent messages either side of a divider.
            if is_leaf and not norm(c.text):
                kids = [k for k in c.children if norm(subtree_text(k))]
                if len(kids) > 1 and all(k.tag in TEXT_HOSTS for k in kids):
                    is_leaf = False
            if is_leaf:
                if not control and not self._script_named(c):
                    self._add(c)
                continue                     # a text leaf is edited whole, never in parts
            self._walk(c, control)

    def render(self, editor_js, editor_css, enabled):
        """The served copy: markers spliced in, editor appended. Never saved."""
        out, prev = [], 0
        for off, txt in self.inserts:
            out.append(self.src[prev:off])
            out.append(txt)
            prev = off
        out.append(self.src[prev:])
        doc = ''.join(out)
        payload = {
            'page': self.page, 'sha': self.sha, 'enabled': enabled,
            'items': {k: {'text': v['text'], 'label': v['label'],
                          'where': v['where'], 'line': v['line'],
                          'kind': v['kind']}
                      for k, v in self.items.items()},
        }
        boot = ('<style id="pbe-css">%s</style>\n'
                '<script id="pbe-data" type="application/json">%s</script>\n'
                '<script id="pbe-js">%s</script>\n'
                % (editor_css, json.dumps(payload).replace('</', '<\\/'), editor_js))
        idx = doc.rfind('</body>')
        return doc[:idx] + boot + doc[idx:] if idx != -1 else doc + boot


CACHE = {}


def marks_for(page):
    path = os.path.join(ROOT, page)
    mtime = os.path.getmtime(path)
    hit = CACHE.get(page)
    if hit and hit[0] == mtime:
        return hit[1]
    src = open(path, encoding='utf-8', errors='replace').read()
    m = Marks(page, src)
    CACHE[page] = (mtime, m)
    return m


def load_edits():
    if os.path.isfile(EDITS_JSON):
        try:
            return json.load(open(EDITS_JSON, encoding='utf-8')).get('changes', [])
        except Exception:
            return []
    return []


def write_edits(changes):
    changes.sort(key=lambda c: (c['page'], c['line']))
    os.makedirs(os.path.dirname(EDITS_JSON), exist_ok=True)
    with open(EDITS_JSON, 'w', encoding='utf-8') as f:
        json.dump({'saved': time.strftime('%Y-%m-%d %H:%M:%S'),
                   'count': len(changes), 'changes': changes}, f,
                  indent=2, ensure_ascii=False)
        f.write('\n')
    lines = ['Copy edits pending, saved %s' % time.strftime('%Y-%m-%d %H:%M'),
             '%d change%s' % (len(changes), '' if len(changes) == 1 else 's'), '']
    page = None
    for c in changes:
        if c['page'] != page:
            page = c['page']
            lines += ['=' * 66, page, '=' * 66, '']
        lines += ['line %-5s  %s  (%s)' % (c['line'], c['label'], c['where']),
                  '  OLD: ' + c['old'], '  NEW: ' + c['new'], '']
    with open(EDITS_TXT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype='application/json'):
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parts = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parts.path).lstrip('/')
        if path == '__pbe/pending':
            return self._send(200, json.dumps({'changes': load_edits()}))
        if path in ('', 'index'):
            path = 'index.html'
        if path.endswith('.html') and os.path.isfile(os.path.join(ROOT, path)):
            q = urllib.parse.parse_qs(parts.query)
            enabled = q.get('edit', ['1'])[0] != '0'
            try:
                m = marks_for(path)
                body = m.render(read(os.path.join(MODE_DIR, 'editor.js')),
                                read(os.path.join(MODE_DIR, 'editor.css')), enabled)
            except Exception as exc:               # never take the site down
                import traceback
                traceback.print_exc()
                return self._send(500, 'edit-server could not mark %s: %s'
                                  % (path, exc), 'text/plain; charset=utf-8')
            return self._send(200, body, 'text/html; charset=utf-8')
        return super().do_GET()

    def do_POST(self):
        if urllib.parse.urlparse(self.path).path != '/__pbe/save':
            return self._send(404, '{}')
        n = int(self.headers.get('Content-Length') or 0)
        try:
            payload = json.loads(self.rfile.read(n) or b'{}')
        except Exception as exc:
            return self._send(400, json.dumps({'error': str(exc)}))

        kept = {(c['page'], c['id']): c for c in load_edits()}
        stale = []
        for e in payload.get('edits', []):
            page, eid = e.get('page'), str(e.get('id'))
            try:
                m = marks_for(page)
            except Exception:
                continue
            rec = m.items.get(eid)
            if not rec:
                stale.append('%s #%s (page changed since you loaded it)' % (page, eid))
                continue
            new = norm(e.get('new', ''))
            if new == rec['text'] or not new:
                kept.pop((page, eid), None)        # edited back to the original
                continue
            kept[(page, eid)] = {
                'page': page, 'id': eid, 'kind': rec['kind'],
                'label': rec['label'], 'where': rec['where'], 'line': rec['line'],
                'old': rec['text'], 'new': new,
                'old_html': rec['html'], 'new_html': e.get('new_html', ''),
                'source': {'start': rec['start'], 'end': rec['end'],
                           'file_sha1': m.sha},
            }
        changes = list(kept.values())
        write_edits(changes)
        print('  saved %d change%s to docs/copy-edits.json'
              % (len(changes), '' if len(changes) == 1 else 's'))
        return self._send(200, json.dumps({
            'ok': True, 'count': len(changes), 'stale': stale,
            'file': os.path.relpath(EDITS_JSON, ROOT)}))


def read(p):
    return open(p, encoding='utf-8').read()


def free_port(pref):
    for p in [pref] + [0]:
        s = socket.socket()
        try:
            s.bind(('127.0.0.1', p))
            got = s.getsockname()[1]
            s.close()
            return got
        except OSError:
            s.close()
    return 0


def main():
    ap = argparse.ArgumentParser(description='Local visual copy editor.')
    ap.add_argument('--port', type=int, default=8787)
    ap.add_argument('--page', default='index.html', help='page to open first')
    ap.add_argument('--no-open', action='store_true')
    ap.add_argument('--report', action='store_true',
                    help='print what is editable on each page and exit')
    ap.add_argument('--view', action='store_true',
                    help='open in view mode, editing off, instead of edit mode')
    args = ap.parse_args()

    pages = sorted(f for f in os.listdir(ROOT) if f.endswith('.html'))
    if args.report:
        tot = 0
        for p in pages:
            m = marks_for(p)
            kinds = {}
            for it in m.items.values():
                kinds[it['label']] = kinds.get(it['label'], 0) + 1
            tot += len(m.items)
            top = ', '.join('%s %d' % (k, v) for k, v in
                            sorted(kinds.items(), key=lambda x: -x[1])[:5])
            print('%-32s %4d  %s' % (p, len(m.items), top))
        print('%-32s %4d editable elements across %d pages' % ('TOTAL', tot, len(pages)))
        return

    port = free_port(args.port)
    srv = http.server.ThreadingHTTPServer(
        ('127.0.0.1', port), functools.partial(Handler, directory=ROOT))
    mode = '0' if args.view else '1'
    url = 'http://127.0.0.1:%d/%s?edit=%s' % (port, args.page, mode)
    print('\n  Pensionbuddy copy editor')
    print('  ' + '-' * 44)
    if port != args.port:
        print('  Port %d was busy, using %d instead.' % (args.port, port))
    print('  Open:      %s' % url)
    print('  Saves to:  docs/copy-edits.json  (and .txt)')
    print('  Your HTML files are opened read only and never changed.')
    print('  Stop with Ctrl+C.\n')
    if not args.no_open:
        try:
            subprocess.Popen(['open', url], stdout=subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL)
        except Exception:
            pass
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\n  stopped')


if __name__ == '__main__':
    main()
