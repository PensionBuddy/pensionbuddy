#!/usr/bin/env node
/* Record the two games' card videos (Run 38, item 1).

       node tools/record-games.mjs                 # both games
       node tools/record-games.mjs buddys-run      # one

   The real games, played headless and deterministically: each loads in an
   iframe of 1200 x 675, the frame tools/shoot-product.py photographs for the
   cards' still pictures (so the video starts where its poster is), with its
   clock replaced by one this script turns. The game's own animation loop
   runs, one call per 1/120 s for Buddy's Run and per 1/30 s for Jargon
   Battle, with the same seeded random numbers and the same autopilot the
   stills use, and after every thirtieth of a second the stage is
   photographed. Nothing about the games is changed; they cannot tell.

   Before a frame is encoded the frames are checked for flashing, the way
   tests/games.test.py checks the game itself: the mean relative luminance
   of the whole frame and of each cell of a 6 x 3 grid, and a change of 0.1
   or more from the last turning point counts as a transition; more than six
   in any one second fails (WCAG 2.3.1's three flashes). Then Chrome's own
   encoder (WebCodecs) encodes them at 1280 x 720, every frame exactly 1/30 s,
   twice: H.264 (baseline, so no frame is reordered) and VP8 (not VP9: a Mac's
   hardware VP9 decoder refused one of the VP9 clips that software decoded
   without a fault, and VP8 is only ever decoded in software), and
   tools/video-mux.js writes them into an MP4 and a WebM, each under 1.5 MB,
   in assets/video/. No other software is needed, except where Chrome has no
   H.264 encoder (Chromium on Linux): there the MP4 is made from the same
   frames by ffmpeg's libx264, if it is installed.

   Buddy's Run's clip starts after a run-up and must keep all three lives,
   show the Poolbeg stacks on the far shore, a double jump, the lighthouse and
   a stomp; Jargon Battle's answers two
   questions right, from the second to the fourth, the question its still
   shows. Buddy's Run's own pause control ("P to pause" and its Pause
   button) is hidden in the clip (Run 39, Damian's call): beside the card's
   real pause button it read as a second one. It keeps its place, so
   nothing else in the game's top bar moves; Jargon Battle shows none.
   Exit 0, or 1 with the reason. */
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, statSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(join(HERE, '..'));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FPS = 30, SECONDS = 8, W = 1200, H = 675, VW = 1280, VH = 720, MAX_BYTES = 1.5 * 1024 * 1024, BPS = 1100000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const only = process.argv.slice(2);

/* the clock the games get: requestAnimationFrame queues, __step(ms) turns
   it, and performance.now() and Date.now() read it */
const CLOCK = `<script>(function(){var t=1000,q=[];window.__now=function(){return t;};
  window.requestAnimationFrame=function(cb){q.push(cb);return q.length;};window.cancelAnimationFrame=function(){};
  if(window.performance){performance.now=function(){return t;};}var D=Date,d0=D.now();Date.now=function(){return d0+t;};
  window.__step=function(ms){t+=ms;var r=q;q=[];r.forEach(function(cb){cb(t);});};})();</script>`;
/* the stills' own CSS (tools/shoot-product.py HIDE and SETTLE), read from
   that file, so the video frames the game exactly as its poster does */
const SETTLE = JSON.parse(execFileSync('python3', ['-c', 'import importlib.util,json,sys;'
  + 's=importlib.util.spec_from_file_location("sp",sys.argv[1]);m=importlib.util.module_from_spec(s);'
  + 's.loader.exec_module(m);print(json.dumps(m.HIDE+m.SETTLE))', join(HERE, 'shoot-product.py')], { encoding: 'utf8' }));

const SEEDED = 'function pbSeed(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);'
  + 't=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}';

const GAMES = {
  'buddys-run': {
    page: 'games/buddys-run.html', target: '#stage',
    /* the game's own pause control, hidden in its place (Run 39) */
    hide: '#hud .hint,#pauseBtn{visibility:hidden!important}',
    /* the stills' autopilot, one decision per 1/120 s step */
    setup: SEEDED + `
      window.__B=window.BuddysRun; __B.setRng(pbSeed(20260929));
      document.getElementById('startBtn').click();
      window.__held=false;
      window.__stacks=function(){ var cv=document.getElementById('game'), k=cv.width/640, c=cv.getContext('2d'),
        y0=Math.round(130*k), h=Math.round(55*k), d=c.getImageData(0,y0,cv.width,h).data, on={}, p;
        for(p=0;p<d.length;p+=4){ if(Math.abs(d[p]-193)<8&&Math.abs(d[p+1]-80)<8&&Math.abs(d[p+2]-46)<8){ on[Math.floor(((p/4)%cv.width)/k)]=1; } }
        var xs=Object.keys(on).map(Number).sort(function(a,b){return a-b;}), runs=[], s=null, q=null;
        xs.forEach(function(v){ if(s===null||v>q+2){ if(s!==null)runs.push([s,q]); s=v; } q=v; });
        if(s!==null)runs.push([s,q]);
        return runs.filter(function(r){return r[0]>2&&r[1]<637&&r[1]-r[0]>=5;}).length>=2; };
      /* jump a crab close up; double jump over (or onto) the lighthouse; jump
         for an angel at jump height and double jump for a high one, when no
         crab is near */
      window.__pilot=function(){ var st=__B.state(), hb=__B.buddyHit(), bd=st.buddy;
        function gap(l){ return l.x-(hb.x+hb.w); }
        var threat=st.labels.some(function(l){ var g=gap(l); return l.kind==='bad'&&!l.spent&&!l.big&&g>0&&g<st.speed*0.068+10; });
        var big=st.labels.some(function(l){ var g=gap(l); return l.kind==='bad'&&!l.spent&&l.big&&g>-l.w&&g<st.speed*0.75; });
        var badSoon=st.labels.some(function(l){ var g=gap(l); return l.kind==='bad'&&!l.spent&&g>-l.w&&g<st.speed*1.3; });
        var mid=st.labels.some(function(l){ var g=gap(l); return l.kind==='good'&&l.floating===true&&g>0&&g<st.speed*0.3; });
        var high=st.labels.some(function(l){ var g=gap(l); return l.kind==='good'&&l.high&&g>-l.w/2&&g<st.speed*0.6; });
        if(bd.onGround&&(threat||big||(!badSoon&&(mid||high)))){ __B.jump(); __held=true; }
        /* the lighthouse: double jump on the way up, so the arc stays on screen */
        if(!bd.onGround&&bd.airJumps>0&&((big&&bd.vy>=-250)||(high&&bd.vy>=-40))){ __B.jump(); }
        if(__held&&bd.onGround&&bd.vy===0&&!threat&&!big){ __B.releaseJump(); __held=false; } };
      window.__frame=function(){ for(var i=0;i<4;i++){ __pilot(); __step(1000/120); } var s=__B.state();
        return {phase:s.phase,lives:s.lives,score:s.score,stacks:__stacks(),air:s.buddy.airJumps,
          big:s.labels.some(function(l){return l.big;}),squashed:s.labels.some(function(l){return l.squashed;})}; };
      /* the run-up, 2,240 steps: the clip then shows a double jump for a high
         angel, the lighthouse coming up, a double jump onto it and its lamp lit,
         and the still is taken inside it */
      for(var n=0;n<560;n++){ __frame(); }
      if(document.activeElement&&document.activeElement.blur){ document.activeElement.blur(); }
      JSON.stringify(__B.state().phase)`,
    check: frames => {
      const lost = frames.some(f => f.lives !== 3 || f.phase !== 'running');
      const stacks = frames.filter(f => f.stacks).length / frames.length;
      return lost ? 'a life was lost, or the run stopped, during the clip'
        : stacks < 0.5 ? 'the Poolbeg stacks are in only ' + Math.round(stacks * 100) + '% of the frames'
        : !frames.some(f => f.air === 0) ? 'the clip shows no double jump'
        : !frames.some(f => f.big) ? 'the clip shows no lighthouse'
        : !frames.some(f => f.squashed) ? 'the clip shows no stomp' : '';
    },
  },
  'jargon-battle': {
    page: 'games/jargon-battle.html', target: '#game',
    /* start, answer the first question right, and begin on the second */
    setup: SEEDED + `
      window.__J=window.JargonBattle; __J.setRng(pbSeed(20260929));
      window.__opts=document.querySelectorAll('#menu .opt');
      document.getElementById('startBtn').click(); __step(1000/30);
      document.getElementById('nextBtn').click(); for(var i=0;i<30;i++){ __step(1000/30); }
      __opts[__J.state().current.correctIndex].click(); for(i=0;i<60;i++){ __step(1000/30); }
      document.getElementById('nextBtn').click(); for(i=0;i<10;i++){ __step(1000/30); }
      window.__n=0;
      /* the clip: read the question, answer it right, watch the paper land,
         next; the same again; the fourth question to finish, as the still */
      window.__frame=function(){ var f=__n++;
        if(f===36||f===150){ __opts[__J.state().current.correctIndex].click(); }
        if(f===108||f===222){ document.getElementById('nextBtn').click(); }
        __step(1000/30); var s=__J.state(); return {phase:s.phase,index:s.index,hearts:s.hearts,blobHp:s.blobHp}; };
      if(document.activeElement&&document.activeElement.blur){ document.activeElement.blur(); }
      JSON.stringify(__J.state().phase)`,
    check: frames => {
      const last = frames[frames.length - 1];
      return frames[0].index !== 1 ? 'the clip does not open on the second question'
        : last.index !== 3 ? 'the clip does not end on the fourth question'
        : frames.some(f => f.hearts !== 3) ? 'a heart was lost during the clip' : '';
    },
  },
};

/* ---- the server: the site, a game with the clock in, the frames, the encoder ---- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
let frames = [];
const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  const send = (body, type) => { res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };
  let m;
  if ((m = path.match(/^\/__frame\/(\d+)\.png$/))) { return send(frames[+m[1]], 'image/png'); }
  if (path === '/__wrap.html') {
    const g = GAMES[new URL(req.url, 'http://x').searchParams.get('g')];
    const game = g.page.replace(/([^/]+)$/, '__rec-$1');
    return send(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#FAFAF9">
      <iframe id="f" src="/${game}" style="width:${W}px;height:${H}px;border:0;display:block"></iframe></body></html>`, TYPES['.html']);
  }
  if (path === '/__enc.html') { return send('<!doctype html><html><head><script src="/__mux.js"></script></head><body style="margin:0"></body></html>', TYPES['.html']); }
  if (path === '/__mux.js') { return send(readFileSync(join(HERE, 'video-mux.js')), TYPES['.js']); }
  if ((m = path.match(/^\/(games\/)__rec-([a-z-]+\.html)$/))) {
    const t = readFileSync(join(ROOT, m[1] + m[2]), 'utf8').replace('<head>', '<head>' + CLOCK, 1);
    return send(t, TYPES['.html']);
  }
  const f = join(ROOT, path);
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  send(readFileSync(f), TYPES[extname(f)] || 'application/octet-stream');
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

/* ---- Chrome ---- */
const prof = mkdtempSync(join(tmpdir(), 'pb-rec-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--disable-extensions', '--force-color-profile=srgb',
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
  /* Chrome refuses its sandbox to root (a container) */
  ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : []), 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill('SIGKILL'); } catch {} try { rmSync(prof, { recursive: true, force: true }); } catch {} server.close(); };
process.on('exit', cleanup);
let port;
for (let i = 0; i < 150 && !port; i++) { await sleep(100); const f = join(prof, 'DevToolsActivePort'); if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0].trim(); }
if (!port) { console.log('no DevTools port from Chrome'); process.exit(1); }
const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map(); const waiters = [];
ws.onmessage = m => { const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(JSON.stringify(d.error))) : p.res(d.result); }
  else if (d.method) for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === d.method) { waiters[i].res(d.params); waiters.splice(i, 1); } };
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method, ms) => new Promise(res => { waiters.push({ method, res }); setTimeout(() => res(null), ms); });
const ev = async (expr, awaitPromise = false) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('pb-consent','rejected')}catch(e){}" });

async function go(url) {
  const loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url });
  await loaded;
}
const inGame = expr => ev(`document.getElementById('f').contentWindow.eval(${JSON.stringify(expr)})`);

/* the flash check, on the frames' luminance: as tests/games.test.py */
const FLASH = `(function(){
  function lin(c){c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
  function turns(s){var e=s[0],dir=0,at=[],i,v;for(i=1;i<s.length;i++){v=s[i];
    if(dir>=0&&v<=e-0.1){at.push(i);dir=-1;e=v;}else if(dir<=0&&v>=e+0.1){at.push(i);dir=1;e=v;}
    else if((dir>0&&v>e)||(dir<0&&v<e)){e=v;}}return at;}
  function most(at,per){var b=0,i,j;for(i=0;i<at.length;i++){for(j=i;j<at.length&&at[j]-at[i]<per;j++){}b=Math.max(b,j-i);}return b;}
  window.__means=function(cx,w,h){var d=cx.getImageData(0,0,w,h).data,G=[],n=[],x,y,k,L,gi,all=0,cnt=0;
    for(k=0;k<18;k++){G.push(0);n.push(0);}
    for(y=0;y<h;y+=2){for(x=0;x<w;x+=2){k=(y*w+x)*4;L=0.2126*lin(d[k])+0.7152*lin(d[k+1])+0.0722*lin(d[k+2]);
      gi=Math.min(2,Math.floor(y/h*3))*6+Math.min(5,Math.floor(x/w*6));G[gi]+=L;n[gi]++;all+=L;cnt++;}}
    for(k=0;k<18;k++){G[k]=n[k]?G[k]/n[k]:0;}return {whole:all/cnt,cells:G};};
  window.__worst=function(fr,per){var o={whole:most(turns(fr.map(function(f){return f.whole;})),per),cell:0},c;
    for(c=0;c<18;c++){o.cell=Math.max(o.cell,most(turns(fr.map(function(f){return f.cells[c];})),per));}return o;};
})()`;

function hasFfmpeg() {
  try { return execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { stdio: 'pipe' }).toString().includes('libx264'); } catch { return false; }
}
function ffmpegMp4(file, n) {
  const dir = mkdtempSync(join(tmpdir(), 'pb-frames-'));
  try {
    for (let i = 0; i < n; i++) writeFileSync(join(dir, String(i).padStart(4, '0') + '.png'), frames[i]);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', join(dir, '%04d.png'),
      '-vf', 'scale=' + VW + ':' + VH, '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
      '-b:v', String(BPS), '-maxrate', String(Math.round(BPS * 1.5)), '-bufsize', String(BPS * 2), '-g', '60', '-r', String(FPS),
      '-movflags', '+faststart', '-an', file], { stdio: 'pipe' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
  return { bytes: statSync(file).size, codec: 'libx264 baseline (ffmpeg)', frames: n };
}

let failed = false;
const outDir = join(ROOT, 'assets', 'video');
mkdirSync(outDir, { recursive: true });
for (const [name, g] of Object.entries(GAMES)) {
  if (only.length && !only.includes(name)) continue;
  await go(ORIGIN + '/__wrap.html?g=' + name);
  await ev(`new Promise(r=>{var f=document.getElementById('f');function ok(){var d=f.contentDocument;return d&&d.readyState==='complete'&&(!d.fonts||d.fonts.status==='loaded');}
    (function t(){ if(ok()) r(1); else setTimeout(t,50); })();})`, true);
  await ev(`(function(){var d=document.getElementById('f').contentDocument,s=d.createElement('style');s.textContent=${JSON.stringify(SETTLE + (g.hide || ''))};d.head.appendChild(s);d.documentElement.classList.remove('pb-preveil');})()`);
  await sleep(300);
  await inGame(g.setup);
  await ev('window.scrollTo(0,0)');
  const box = await ev(`(function(){var f=document.getElementById('f'),el=f.contentDocument.querySelector(${JSON.stringify(g.target)}),r=el.getBoundingClientRect(),o=f.getBoundingClientRect();
    return {x:o.left+r.left,y:o.top+r.top,width:r.width,height:r.height};})()`);
  if (Math.round(box.width) !== W || Math.round(box.height) !== H) { console.log(name + ': the stage is ' + JSON.stringify(box) + ', not ' + W + ' x ' + H); failed = true; continue; }
  const n = FPS * SECONDS, states = [];
  frames = [];
  for (let i = 0; i < n; i++) {
    states.push(await inGame('JSON.stringify(__frame())').then(JSON.parse));
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...box, scale: VW / box.width } });
    frames.push(Buffer.from(shot.data, 'base64'));
  }
  const why = g.check(states);
  /* the encoder page: the frames' flash check, then the two encodings */
  await go(ORIGIN + '/__enc.html');
  await ev(FLASH);
  const flash = await ev(`(async function(){var c=document.createElement('canvas');c.width=${VW};c.height=${VH};var cx=c.getContext('2d',{willReadFrequently:true}),fr=[];
    for(var i=0;i<${n};i++){var b=await createImageBitmap(await (await fetch('/__frame/'+i+'.png')).blob());cx.drawImage(b,0,0,${VW},${VH});fr.push(__means(cx,${VW},${VH}));}
    return __worst(fr,${FPS});})()`, true);
  const out = { name, frames: n, seconds: SECONDS, flash, why };
  for (const [ext, codec] of [['mp4', 'avc1.42001f'], ['webm', 'vp8']]) {
    const res = await ev(`(async function(){
      var cfg={codec:${JSON.stringify(codec)},width:${VW},height:${VH},bitrate:${BPS},bitrateMode:'variable',framerate:${FPS},latencyMode:'quality'};
      if(${JSON.stringify(ext)}==='mp4'){cfg.avc={format:'avc'};}
      var sup=await VideoEncoder.isConfigSupported(cfg); if(!sup.supported){return {error:'unsupported: '+cfg.codec};}
      var chunks=[],desc=null,err=null;
      var enc=new VideoEncoder({output:function(c,meta){var d=new Uint8Array(c.byteLength);c.copyTo(d);chunks.push({data:d,key:c.type==='key',ts:c.timestamp});
          if(!desc&&meta&&meta.decoderConfig&&meta.decoderConfig.description){var s=meta.decoderConfig.description;desc=new Uint8Array(s.buffer?s.buffer.slice(s.byteOffset,s.byteOffset+s.byteLength):s);}},
        error:function(e){err=String(e);}});
      enc.configure(cfg);
      for(var i=0;i<${n};i++){var b=await createImageBitmap(await (await fetch('/__frame/'+i+'.png')).blob());
        var f=new VideoFrame(b,{timestamp:Math.round(i*1e6/${FPS}),duration:Math.round(1e6/${FPS})});enc.encode(f,{keyFrame:i%60===0});f.close();b.close();}
      await enc.flush(); enc.close();
      if(err){return {error:err};}
      for(i=1;i<chunks.length;i++){if(chunks[i].ts<=chunks[i-1].ts){return {error:'frames out of order: the encoder reordered them'};}}
      /* every frame decodes, straight from the encoder, before it goes in a file */
      var got=0,derr=null,dcfg={codec:cfg.codec,codedWidth:${VW},codedHeight:${VH}};if(desc){dcfg.description=desc;}
      var dec=new VideoDecoder({output:function(fr){got++;fr.close();},error:function(e){derr=String(e);}});
      dec.configure(dcfg);
      chunks.forEach(function(c){dec.decode(new EncodedVideoChunk({type:c.key?'key':'delta',timestamp:c.ts,data:c.data}));});
      try{await dec.flush();}catch(e){derr=derr||String(e);}
      if(derr||got!==chunks.length){return {error:'the encoded frames do not decode: '+(derr||got+' of '+chunks.length)};}
      var file=${JSON.stringify(ext)}==='mp4'?PBMux.mp4(chunks,{width:${VW},height:${VH},fps:${FPS},description:desc})
        :PBMux.webm(chunks,{width:${VW},height:${VH},fps:${FPS},codec:'V_VP8'});
      var s='',k;for(k=0;k<file.length;k+=0x8000){s+=String.fromCharCode.apply(null,file.subarray(k,k+0x8000));}
      return {frames:chunks.length,keys:chunks.filter(function(c){return c.key;}).length,b64:btoa(s)};})()`, true);
    const file = join(outDir, name + '.' + ext);
    if (res.error && ext === 'mp4' && /^unsupported/.test(res.error) && hasFfmpeg()) {
      /* Chromium without H.264 (Linux, Playwright's build): the same frames
         through ffmpeg's libx264, baseline, every frame 1/30 s, no B-frames */
      out[ext] = ffmpegMp4(file, n);
      if (out[ext].bytes >= MAX_BYTES) { failed = true; out[ext].tooBigOrShort = true; }
      continue;
    }
    if (res.error) { out[ext] = res.error; failed = true; continue; }
    const bytes = Buffer.from(res.b64, 'base64');
    writeFileSync(file, bytes);
    out[ext] = { bytes: bytes.length, codec, frames: res.frames, keyframes: res.keys };
    if (bytes.length >= MAX_BYTES || res.frames !== n) { failed = true; out[ext].tooBigOrShort = true; }
  }
  if (why || flash.whole > 6 || flash.cell > 6) failed = true;
  console.log(JSON.stringify(out));
}
cleanup();
process.exit(failed ? 1 : 0);
