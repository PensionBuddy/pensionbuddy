/* Two small containers for tools/record-games.mjs (Run 38): what WebCodecs'
   VideoEncoder hands back, frame by frame, written into a file a <video>
   element can play. No library: each is the least the format asks for.

     PBMux.mp4(chunks, {width, height, fps, description})  -> Uint8Array
       H.264 ("avc" format, length-prefixed NAL units) in an MP4 with the
       index (moov) before the data, so it plays as it arrives.
     PBMux.webm(chunks, {width, height, fps, codec: 'V_VP8'}) -> Uint8Array
       VP8 (or VP9) in a WebM with its duration and one cue per keyframe, so
       it loops and seeks.

   chunks: [{data: Uint8Array, key: boolean, ts: microseconds}], in decode
   order, one per frame, every frame the same length (1/fps). */
(function (root) {
  'use strict';

  function cat(parts) {
    var n = 0, i, out, o = 0;
    for (i = 0; i < parts.length; i++) { n += parts[i].length; }
    out = new Uint8Array(n);
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  }
  function u8(a) { return new Uint8Array(a); }
  function be(n, bytes) { var a = [], i; for (i = bytes - 1; i >= 0; i--) { a.push(Math.floor(n / Math.pow(256, i)) & 255); } return u8(a); }
  function str(s) { var a = [], i; for (i = 0; i < s.length; i++) { a.push(s.charCodeAt(i) & 255); } return u8(a); }

  /* ------------------------------------------------------------ MP4 ---- */
  function box(type, parts) { var body = cat(parts || []); return cat([be(body.length + 8, 4), str(type), body]); }
  function full(type, version, flags, parts) { return box(type, [u8([version]), be(flags, 3)].concat(parts || [])); }
  var MATRIX = cat([be(0x10000, 4), be(0, 4), be(0, 4), be(0, 4), be(0x10000, 4), be(0, 4), be(0, 4), be(0, 4), be(0x40000000, 4)]);

  function mp4(chunks, o) {
    var scale = o.fps * 1000, per = 1000, n = chunks.length, dur = n * per;
    var sizes = chunks.map(function (c) { return c.data.length; });
    var keys = [];
    chunks.forEach(function (c, i) { if (c.key) { keys.push(i + 1); } });
    function moov(mdatStart) {
      var avcC = box('avcC', [o.description]);
      var avc1 = box('avc1', [u8([0, 0, 0, 0, 0, 0]), be(1, 2), be(0, 16), be(o.width, 2), be(o.height, 2),
        be(0x480000, 4), be(0x480000, 4), be(0, 4), be(1, 2), u8(new Array(32).fill(0)), be(0x18, 2), be(0xffff, 2), avcC]);
      var stbl = box('stbl', [
        full('stsd', 0, 0, [be(1, 4), avc1]),
        full('stts', 0, 0, [be(1, 4), be(n, 4), be(per, 4)]),
        full('stss', 0, 0, [be(keys.length, 4)].concat(keys.map(function (k) { return be(k, 4); }))),
        full('stsc', 0, 0, [be(1, 4), be(1, 4), be(n, 4), be(1, 4)]),
        full('stsz', 0, 0, [be(0, 4), be(n, 4)].concat(sizes.map(function (s) { return be(s, 4); }))),
        full('stco', 0, 0, [be(1, 4), be(mdatStart, 4)])]);
      var minf = box('minf', [full('vmhd', 0, 1, [be(0, 8)]),
        box('dinf', [full('dref', 0, 0, [be(1, 4), full('url ', 0, 1)])]), stbl]);
      var mdia = box('mdia', [full('mdhd', 0, 0, [be(0, 4), be(0, 4), be(scale, 4), be(dur, 4), be(0x55c4, 2), be(0, 2)]),
        full('hdlr', 0, 0, [be(0, 4), str('vide'), be(0, 12), str('VideoHandler'), u8([0])]), minf]);
      var tkhd = full('tkhd', 0, 3, [be(0, 4), be(0, 4), be(1, 4), be(0, 4), be(dur, 4), be(0, 8), be(0, 2), be(0, 2), be(0, 2), be(0, 2),
        MATRIX, be(o.width * 65536, 4), be(o.height * 65536, 4)]);
      var mvhd = full('mvhd', 0, 0, [be(0, 4), be(0, 4), be(scale, 4), be(dur, 4), be(0x10000, 4), be(0x100, 2), be(0, 10),
        MATRIX, be(0, 24), be(2, 4)]);
      return box('moov', [mvhd, box('trak', [tkhd, mdia])]);
    }
    var ftyp = box('ftyp', [str('isom'), be(512, 4), str('isom'), str('iso2'), str('avc1'), str('mp41')]);
    var size0 = moov(0).length;
    var head = cat([ftyp, moov(ftyp.length + size0 + 8)]);
    var data = cat(chunks.map(function (c) { return c.data; }));
    return cat([head, be(data.length + 8, 4), str('mdat'), data]);
  }

  /* ----------------------------------------------------------- WebM ---- */
  function vint(n) {   /* an EBML size: the shortest that holds n */
    var len = 1;
    while (n >= Math.pow(2, 7 * len) - 1) { len++; }
    var b = be(n, len); b[0] |= (1 << (8 - len)); return b;
  }
  function id(n) { var len = n > 0xffffff ? 4 : n > 0xffff ? 3 : n > 0xff ? 2 : 1; return be(n, len); }
  function el(i, body) { return cat([id(i), vint(body.length), body]); }
  function uint(i, n) { var len = 1; while (n >= Math.pow(256, len)) { len++; } return el(i, be(n, len)); }
  function flt(i, x) { var b = new DataView(new ArrayBuffer(8)); b.setFloat64(0, x); return el(i, new Uint8Array(b.buffer)); }
  function txt(i, s) { return el(i, str(s)); }

  function webm(chunks, o) {
    var perMs = 1000 / o.fps, n = chunks.length;
    var ebml = el(0x1A45DFA3, cat([uint(0x4286, 1), uint(0x42F7, 1), uint(0x42F2, 4), uint(0x42F3, 8),
      txt(0x4282, 'webm'), uint(0x4287, 4), uint(0x4285, 2)]));
    var info = el(0x1549A966, cat([uint(0x2AD7B1, 1000000), flt(0x4489, n * perMs), txt(0x4D80, 'PBMux'), txt(0x5741, 'tools/record-games.mjs')]));
    var tracks = el(0x1654AE6B, el(0xAE, cat([uint(0xD7, 1), uint(0x73C5, 1), uint(0x83, 1), txt(0x86, o.codec),
      uint(0x9C, 0), el(0xE0, cat([uint(0xB0, o.width), uint(0xBA, o.height)]))])));
    /* one cluster per keyframe, its blocks timed from its start */
    var clusters = [], cur = null;
    chunks.forEach(function (c, i) {
      var t = Math.round(i * perMs);
      if (c.key || !cur) { cur = { t: t, blocks: [] }; clusters.push(cur); }
      var rel = t - cur.t;
      cur.blocks.push(el(0xA3, cat([vint(1), be(rel & 0xffff, 2), u8([c.key ? 0x80 : 0]), c.data])));
    });
    var bodies = clusters.map(function (cl) { return el(0x1F43B675, cat([uint(0xE7, cl.t)].concat(cl.blocks))); });
    /* cues point at each cluster, from the start of the segment's data */
    function cues(start) {
      var pos = start, pts = [];
      clusters.forEach(function (cl, k) {
        pts.push(el(0xBB, cat([uint(0xB3, cl.t), el(0xB7, cat([uint(0xF7, 1), uint(0xF1, pos)]))])));
        pos += bodies[k].length;
      });
      return el(0x1C53BB6B, cat(pts));
    }
    var lead = info.length + tracks.length;
    var cueLen = cues(0).length, guess = 0;
    for (var k = 0; k < 4; k++) { guess = cues(lead + cueLen).length; if (guess === cueLen) { break; } cueLen = guess; }
    var segBody = cat([info, tracks, cues(lead + cueLen)].concat(bodies));
    return cat([ebml, el(0x18538067, segBody)]);
  }

  root.PBMux = { mp4: mp4, webm: webm };
}(typeof window !== 'undefined' ? window : this));
