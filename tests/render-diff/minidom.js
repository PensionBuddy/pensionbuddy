'use strict';
/* A DOM small enough to read and real enough to run the PensionBuddy page
   scripts unmodified. Built from the SHIPPED html, so ids, classes, data
   attributes and document order are the page's own, not a guess.

   Every write a script makes is recorded as [key, prop, value]. One render's
   worth of those, reduced to the LAST value written to each cell, is what
   "rendered output" means here, and the diff between the old script's and the
   new script's is the whole test. Recording per render rather than walking the
   tree is what makes a 29.7 million state sweep finish. */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea']);

function key(el) {
  if (el.attributes && el.attributes.id) return '#' + el.attributes.id;
  return el._key || (el._key = el.tagName.toLowerCase() + '@' + el.uid);
}

class ClassList {
  constructor(el) { this.el = el; }
  get _set() {
    const c = this.el.attributes['class'] || '';
    return c.split(/\s+/).filter(Boolean);
  }
  _write(list) {
    this.el.attributes['class'] = list.join(' ');
    this.el.rec('class', this.el.attributes['class']);
  }
  contains(n) { return this._set.includes(n); }
  add(n) { const s = this._set; if (!s.includes(n)) { s.push(n); this._write(s); } else this._write(s); }
  remove(n) { this._write(this._set.filter(x => x !== n)); }
  toggle(n, force) {
    const on = force === undefined ? !this.contains(n) : !!force;
    if (on) this.add(n); else this.remove(n);
    return on;
  }
  get value() { return this.el.attributes['class'] || ''; }
}

class Style {
  constructor(el) { this.props = Object.create(null); this.el = el; }
  setProperty(k, v) { this.props[k] = String(v); this.el.rec('style:' + k, this.props[k]); }
  getPropertyValue(k) { return this.props[k] === undefined ? '' : this.props[k]; }
  removeProperty(k) { delete this.props[k]; this.el.rec('style:' + k, null); }
}
for (const p of ['transform', 'display', 'width', 'opacity', 'height', 'visibility']) {
  Object.defineProperty(Style.prototype, p, {
    get() { return this.props[p] === undefined ? '' : this.props[p]; },
    set(v) { this.props[p] = String(v); this.el.rec('style:' + p, this.props[p]); },
  });
}

class El {
  constructor(tag, attrs, doc) {
    this.tagName = tag.toUpperCase();
    this.attributes = Object.assign(Object.create(null), attrs || {});
    this.children = [];
    this.parentNode = null;
    this.doc = doc;
    this.style = new Style(this);
    this.classList = new ClassList(this);
    this.listeners = Object.create(null);
    this._text = null;
    this._html = null;
    this.uid = doc ? (doc.__uid = (doc.__uid || 0) + 1) : 0;
  }

  rec(prop, value) {
    const r = this.doc && this.doc.__rec;
    if (r) r.push([key(this), prop, value]);
  }

  /* --- attributes ----------------------------------------------------- */
  setAttribute(k, v) { this.attributes[k] = String(v); this.rec('@' + k, this.attributes[k]); }
  getAttribute(k) { return this.attributes[k] === undefined ? null : this.attributes[k]; }
  removeAttribute(k) { delete this.attributes[k]; this.rec('@' + k, null); }
  hasAttribute(k) { return this.attributes[k] !== undefined; }

  get id() { return this.attributes.id || ''; }
  get className() { return this.attributes['class'] || ''; }
  set className(v) { this.attributes['class'] = String(v); this.rec('class', this.attributes['class']); }

  /* hidden reflects to the attribute, exactly as the real DOM does: the
     compare page selects `.togbody:not([hidden]) input[type=range]`, so a
     property that did not reflect would silently change that query. */
  get hidden() { return this.attributes.hidden !== undefined; }
  set hidden(v) {
    if (v) this.attributes.hidden = '';
    else delete this.attributes.hidden;
    this.rec('hidden', !!v);
  }

  get value() { return this.attributes.value === undefined ? '' : this.attributes.value; }
  set value(v) { this.attributes.value = String(v); this.rec('value', this.attributes.value); }
  get min() { return this.attributes.min === undefined ? '' : this.attributes.min; }
  set min(v) { this.attributes.min = String(v); this.rec('min', this.attributes.min); }
  get max() { return this.attributes.max === undefined ? '' : this.attributes.max; }
  set max(v) { this.attributes.max = String(v); this.rec('max', this.attributes.max); }
  get step() { return this.attributes.step === undefined ? '' : this.attributes.step; }
  get type() { return this.attributes.type === undefined ? '' : this.attributes.type; }
  get checked() { return this.attributes.checked !== undefined; }
  set checked(v) {
    if (v) this.attributes.checked = ''; else delete this.attributes.checked;
    this.rec('checked', !!v);
  }
  get tabIndex() { const t = this.attributes.tabindex; return t === undefined ? 0 : Number(t); }
  set tabIndex(v) { this.attributes.tabindex = String(v); this.rec('tabindex', this.attributes.tabindex); }

  /* --- content -------------------------------------------------------- */
  set textContent(v) { this._text = String(v); this._html = null; this.rec('text', this._text); }
  get textContent() {
    if (this._text !== null) return this._text;
    if (this._html !== null) return this._html.replace(/<[^>]*>/g, '');
    return this._srcText();
  }
  set innerHTML(v) { this._html = String(v); this._text = null; this.rec('html', this._html); }
  get innerHTML() {
    if (this._html !== null) return this._html;
    if (this._text !== null) return this._text;
    return this._srcHtml();
  }
  _srcText() { return this.children.map(c => (c.nodeType === 3 ? c.data : c._srcText())).join(''); }
  _srcHtml() { return this.children.map(c => (c.nodeType === 3 ? c.data : c.outerHTML())).join(''); }
  outerHTML() {
    const a = Object.keys(this.attributes).map(k => ` ${k}="${this.attributes[k]}"`).join('');
    const t = this.tagName.toLowerCase();
    if (VOID.has(t)) return `<${t}${a}>`;
    return `<${t}${a}>${this._srcHtml()}</${t}>`;
  }

  /* --- tree ----------------------------------------------------------- */
  appendChild(n) {
    n.parentNode = this; this.children.push(n);
    this.rec('append', n.nodeType === 3 ? '#text' : n.tagName.toLowerCase());
    return n;
  }
  insertBefore(n, ref) {
    const i = this.children.indexOf(ref);
    n.parentNode = this;
    this.children.splice(i < 0 ? this.children.length : i, 0, n);
    this.rec('insert', n.nodeType === 3 ? '#text' : n.tagName.toLowerCase());
    return n;
  }
  get firstChild() { return this.children[0] || null; }
  get nextSibling() {
    if (!this.parentNode) return null;
    const i = this.parentNode.children.indexOf(this);
    return this.parentNode.children[i + 1] || null;
  }

  /* --- queries -------------------------------------------------------- */
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) { return query(this, sel); }
  closest(sel) {
    let n = this;
    const c = parseCompound(sel.trim());
    while (n && n.nodeType !== 3) { if (matchesCompound(n, c)) return n; n = n.parentNode; }
    return null;
  }
  matches(sel) { return matchesCompound(this, parseCompound(sel.trim())); }

  /* --- events --------------------------------------------------------- */
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  removeEventListener(type, fn) {
    const l = this.listeners[type];
    if (l) this.listeners[type] = l.filter(f => f !== fn);
  }
  dispatchEvent(ev) {
    let n = this;
    const target = this;
    while (n) {
      const l = n.listeners[ev.type];
      if (l) for (const fn of l.slice()) fn.call(n, Object.assign({ target, currentTarget: n, preventDefault() {} }, ev));
      if (!ev.bubbles) break;
      n = n.parentNode;
    }
    return true;
  }
  focus() { this.doc.activeElement = this; this.rec('focus', true); }
  blur() { if (this.doc.activeElement === this) this.doc.activeElement = null; }
  getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }; }
}
Object.defineProperty(El.prototype, 'nodeType', { value: 1 });

class Text {
  constructor(data) { this.nodeType = 3; this.data = data; this.parentNode = null; }
  get nextSibling() {
    if (!this.parentNode) return null;
    const i = this.parentNode.children.indexOf(this);
    return this.parentNode.children[i + 1] || null;
  }
}

/* ------------------------------------------------------------------ parse */

function parse(html, doc) {
  const root = new El('root', {}, doc);
  const stack = [root];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>"'\s/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>`]+))?)*)\s*(\/?)>/g;
  let last = 0, m;
  while ((m = re.exec(html)) !== null) {
    const text = html.slice(last, m.index);
    if (text) stack[stack.length - 1].appendChild(new Text(text));
    last = re.lastIndex;
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();

    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName === tag.toUpperCase()) { stack.length = i; break; }
      }
      continue;
    }
    const el = new El(tag, parseAttrs(m[3]), doc);
    stack[stack.length - 1].appendChild(el);
    if (VOID.has(tag) || m[4] === '/') continue;
    if (RAW.has(tag)) {
      const close = html.indexOf(`</${tag}`, last);
      const end = close < 0 ? html.length : close;
      if (end > last) el.appendChild(new Text(html.slice(last, end)));
      const gt = html.indexOf('>', end);
      last = gt < 0 ? html.length : gt + 1;
      re.lastIndex = last;
      continue;
    }
    stack.push(el);
  }
  const tail = html.slice(last);
  if (tail) stack[stack.length - 1].appendChild(new Text(tail));
  return root;
}

function parseAttrs(s) {
  const out = Object.create(null);
  const re = /([^<>"'\s/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const v = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
    out[m[1].toLowerCase()] = v;
  }
  return out;
}

/* ---------------------------------------------------------------- selector */
/* Exactly what the four page scripts use: descendant combinators of compound
   selectors made of a tag, classes, [attr] / [attr="v"], and one :not(simple).
   Anything else throws rather than quietly matching nothing. */

function parseCompound(s) {
  const c = { tag: null, classes: [], attrs: [], not: null };
  let rest = s;
  const notM = rest.match(/:not\(([^)]*)\)/);
  if (notM) { c.not = parseCompound(notM[1]); rest = rest.replace(notM[0], ''); }
  const re = /^([a-zA-Z][\w-]*)|^\.([\w-]+)|^\[([\w-]+)(?:(=)"?([^\]"]*)"?)?\]/;
  while (rest.length) {
    const m = rest.match(re);
    if (!m) throw new Error('minidom: unsupported selector fragment: ' + JSON.stringify(s));
    if (m[1]) c.tag = m[1].toUpperCase();
    else if (m[2]) c.classes.push(m[2]);
    else c.attrs.push({ name: m[3].toLowerCase(), op: m[4] || null, value: m[5] });
    rest = rest.slice(m[0].length);
  }
  return c;
}

function matchesCompound(el, c) {
  if (!el || el.nodeType === 3) return false;
  if (c.tag && el.tagName !== c.tag) return false;
  for (const k of c.classes) if (!el.classList.contains(k)) return false;
  for (const a of c.attrs) {
    const v = el.attributes[a.name];
    if (v === undefined) return false;
    if (a.op === '=' && v !== a.value) return false;
  }
  if (c.not && matchesCompound(el, c.not)) return false;
  return true;
}

function splitDescendants(sel) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of sel.trim()) {
    if (ch === '[' || ch === '(') depth++;
    if (ch === ']' || ch === ')') depth--;
    if (ch === ' ' && depth === 0) { if (cur) out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function query(root, sel) {
  const parts = splitDescendants(sel).map(parseCompound);
  let current = [root];
  for (const part of parts) {
    const next = [];
    for (const node of current) walk(node, n => { if (matchesCompound(n, part)) next.push(n); });
    current = dedupe(next);
  }
  return current;
}

function walk(node, fn) {
  for (const c of node.children || []) {
    if (c.nodeType === 3) continue;
    fn(c);
    walk(c, fn);
  }
}
function dedupe(list) {
  const seen = new Set(), out = [];
  for (const n of list) if (!seen.has(n.uid)) { seen.add(n.uid); out.push(n); }
  return out;
}

/* -------------------------------------------------------------- document */

class Document {
  constructor(html) {
    this.__rec = null;
    this.__uid = 0;
    this.root = parse(html, this);
    this.byId = new Map();
    walk(this.root, n => { if (n.attributes.id && !this.byId.has(n.attributes.id)) this.byId.set(n.attributes.id, n); });
    this.documentElement = this.root.querySelector('html') || new El('html', {}, this);
    this.body = this.root.querySelector('body') || this.documentElement;
    this.head = this.root.querySelector('head') || this.documentElement;
    this.activeElement = null;
    this.listeners = Object.create(null);
  }
  getElementById(id) { return this.byId.get(id) || null; }
  querySelector(s) { return query(this.root, s)[0] || null; }
  querySelectorAll(s) { return query(this.root, s); }
  createElement(tag) { return new El(tag, {}, this); }
  createElementNS(ns, tag) { const e = new El(tag, {}, this); e.namespaceURI = ns; return e; }
  createTextNode(t) { return new Text(t); }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  removeEventListener() {}
}

module.exports = { Document, El, Text, parse, query, key };
