/* Ask Buddy, the floating quick-answers widget, in one place (Run 32,
   docs/UX-MOTION-AUDIT.md part 3a). Every root page loads it once, where its
   inline copy used to be, marked type="text/pb-late": the script in <head>
   (tools/pagebuild.py MOTION_HEAD) starts it once the first frame has
   painted, so the first paint never waits for it. Until then 23 pages
   carried one copy and six
   another, differing only in the first shared answer, which the six now ask
   for with data-first-answer="short". Nothing else changes: the same
   button, panel, questions (the page's own FAQ, or the site-wide set below,
   copied verbatim from the homepage FAQ), keyboard handling and focus.
   Quick answers, never advice. Vanilla JS, no external calls. */
(function(){
  if(document.getElementById('pbBuddyBtn'))return;
  /* the page's option, on its own script tag: data-first-answer="short" gives
     the first shared answer without its last sentence, as booking, thank-you,
     index, starter, tracker and director carried it before this file */
  var me=document.currentScript, SHORT=!!(me&&me.getAttribute('data-first-answer')==='short');
  var SHARED=[{"q": "Is the first chat really free?", "a": "<p>Yes, completely, with no obligation afterwards. Twenty minutes to understand your situation and answer your questions. If we're not the right fit, we'll say so.</p>"}, {"q": "What does it cost if I become a client?", "a": "<p>That depends on what you need, and we'll be upfront before you commit to anything. How we're paid, by fee, commission or a mix, is set out in our Terms of Business.</p>"}, {"q": "Do I need to know anything before we talk?", "a": "<p>Not at all. Come as you are, with whatever you remember. Doing the digging and turning it into something that makes sense is the job.</p>"}, {"q": "Is my information kept private?", "a": "<p>Yes. Anything you share is handled in line with our Privacy Notice and data-protection law. We'll only ever use it to help with your enquiry.</p>"}];
  var AV='data:image/jpeg;base64,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';
  var qs=[];
  document.querySelectorAll('.faq-list details').forEach(function(d){
    var s=d.querySelector('summary'); if(!s)return;
    var q=s.textContent.replace(/\+\s*$/,'').trim();
    var c=d.cloneNode(true); var cs=c.querySelector('summary'); if(cs)cs.parentNode.removeChild(cs);
    qs.push({q:q,a:c.innerHTML});
  });
  if(SHORT)SHARED[0]={q:SHARED[0].q,a:"<p>Yes, completely, with no obligation afterwards. Twenty minutes to understand your situation and answer your questions.</p>"};
  if(!qs.length)qs=SHARED.slice();
  qs=qs.slice(0,5);

  var btn=document.createElement('button');
  btn.id='pbBuddyBtn';btn.className='pb-b-btn';btn.type='button';
  btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<img src="'+AV+'" width="96" height="96" alt=""><span class="pb-b-label">Ask Buddy</span>';
  var panel=document.createElement('div');
  panel.className='pb-b-panel';panel.id='pbBuddyPanel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Ask Buddy: common questions');
  var listHtml='';
  qs.forEach(function(x,i){
    listHtml+='<div class="pb-b-item"><button type="button" class="pb-b-q" aria-expanded="false" data-i="'+i+'">'+x.q+'<span class="pm" aria-hidden="true">+</span></button><div class="pb-b-a" id="pbA'+i+'"><div>'+x.a+'</div></div></div>';
  });
  panel.innerHTML='<div class="pb-b-head"><img src="'+AV+'" width="96" height="96" alt=""><div><div class="t">Ask Buddy</div><div class="s">Quick answers. General info only \u2014 never advice.</div></div><button type="button" class="pb-b-close" aria-label="Close">\u00d7</button></div>'
    +'<div class="pb-b-list">'+listHtml+'</div>'
    +'<div class="pb-b-foot"><a class="btn btn-primary" href="booking.html">Book a free 20-minute call with us</a></div>';
  document.body.appendChild(btn);document.body.appendChild(panel);

  function open(){panel.hidden=false;btn.setAttribute('aria-expanded','true');var f=panel.querySelector('.pb-b-close');if(f)f.focus();}
  function close(){panel.hidden=true;btn.setAttribute('aria-expanded','false');btn.focus();}
  btn.addEventListener('click',function(){panel.hidden?open():close();});
  panel.querySelector('.pb-b-close').addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden)close();});
  panel.querySelectorAll('.pb-b-q').forEach(function(b){
    b.addEventListener('click',function(){
      var item=b.parentNode,was=item.classList.contains('open');
      panel.querySelectorAll('.pb-b-item.open').forEach(function(o){o.classList.remove('open');o.querySelector('.pb-b-q').setAttribute('aria-expanded','false');});
      if(!was){item.classList.add('open');b.setAttribute('aria-expanded','true');}
    });
  });

  /* ---- Floating chrome gives way (Run 32, docs/UX-MOTION-AUDIT.md part 3b) ----
     The button never sits on what the reader needs, and never moves the page.
     It moves only by the translate property, from --pb-b-x and --pb-b-y
     written here (the BUDDY block of CSS turns them into a translate and
     times it), never by bottom, so it causes no layout shift.
       - Tucked: after the first scroll it is Buddy's photo alone, at least
         44 by 44px; its name, "Ask Buddy", stays for screen readers.
       - Stepping aside: while a caveat (PBMotion.CAVEATS), a form field or
         the booking calendar is under it, or a control with focus is (one in
         the tab order, focused from the keyboard or typed in: not <main>,
         which a click on page text focuses),
         it slides off to the right, at once; it comes back once that area
         has been clear for 600ms, and never returns sooner than a second
         after its last move, so it cannot flicker. It never moves while it
         or its panel has focus, and focus on it brings it back.
       - Above the bars: with the phone booking bar or the calculators'
         results bar up it rides just over it, as before, and comes down
         with it when the bar steps down for a caveat.
       - Away: while the analytics choice is open it waits off screen and out
         of the tab order, so it covers neither the choice nor the page.
     Under reduced motion the positions are the same and the moves instant.
     Without IntersectionObserver it stays where it is, as before. */
  function giveWay(){
    if(!('IntersectionObserver' in window))return;
    var root=document.documentElement, body=document.body;
    var CAVEATS=(window.PBMotion&&PBMotion.CAVEATS)||'.pb-warn,.infoadvice,.disclosure';
    var FIELDS='input:not([type=hidden]),select,textarea,#calEmbed,#calStage';
    var CHROME='.pb-bookbar,.pb-peek,.pb-consent,#pbBuddyPanel,#pbBuddyBtn';
    var hx=0,hy=0,aside=false,covered=false,last=0,clearT=null,io=null,hits=[];
    function has(c){return root.classList.contains(c);}
    function focusIn(){var a=document.activeElement;return !!a&&(btn.contains(a)||panel.contains(a));}
    /* where the button sits when it is not aside, in viewport px */
    function home(){
      var w=btn.offsetWidth,h=btn.offsetHeight,vw=root.clientWidth,vh=window.innerHeight;
      var right=vw-18+hx,bottom=vh-18+hy;
      return {left:right-w,top:bottom-h,right:right,bottom:bottom};
    }
    function meets(r,h,m){return r.left<h.right+m&&r.right>h.left-m&&r.top<h.bottom+m&&r.bottom>h.top-m;}
    function place(){
      var bar=document.querySelector('.pb-bookbar'),peek=document.querySelector('.pb-peek');
      var away=body.classList.contains('pb-banner-open')&&panel.hidden;
      hx=0;hy=0;
      if(has('pb-peek-on')&&peek&&!has('pb-peek-yield'))hy=-(peek.offsetHeight+12);
      else if(has('pb-bookbar-on')&&bar&&!has('pb-bookbar-yield')&&panel.hidden)hy=-(bar.offsetHeight+12);
      btn.classList.toggle('pb-b-away',away);
      var off=(aside||away)&&panel.hidden;
      btn.classList.toggle('pb-b-aside',off);
      btn.style.setProperty('--pb-b-x',off?'calc(100% + 32px)':hx+'px');
      btn.style.setProperty('--pb-b-y',hy+'px');
    }
    function decide(){
      var want=(hits.length>0||covered)&&panel.hidden&&!focusIn();
      if(want){
        clearTimeout(clearT);clearT=null;
        if(!aside){aside=true;last=Date.now();place();}
      }else if(aside&&!clearT){
        clearT=setTimeout(function again(){
          clearT=null;
          if((hits.length>0||covered)&&!focusIn())return;
          var wait=1000-(Date.now()-last);
          if(wait>0){clearT=setTimeout(again,wait);return;}
          aside=false;last=Date.now();place();
        },600);
      }
    }
    function watch(){
      if(io)io.disconnect();hits=[];
      var h=home(),m=8,vw=root.clientWidth,vh=window.innerHeight;
      var rm=[h.top-m,vw-h.right-m,vh-h.bottom-m,h.left-m].map(function(v){return -Math.max(0,Math.round(v))+'px';}).join(' ');
      io=new IntersectionObserver(function(es){
        es.forEach(function(e){
          var i=hits.indexOf(e.target);
          if(e.isIntersecting&&i<0)hits.push(e.target);
          else if(!e.isIntersecting&&i>=0)hits.splice(i,1);
        });
        decide();
      },{rootMargin:rm,threshold:0});
      [].slice.call(document.querySelectorAll(CAVEATS+','+FIELDS)).forEach(function(el){
        if(!el.closest(CHROME))io.observe(el);
      });
    }
    /* the element that has focus: if it meets the button's place, step aside */
    /* a real control, as pb-peek.js counts one: in the tab order, and focused
       from the keyboard or a field being typed in. Not <main tabindex="-1">,
       which takes focus from a click on its text or the skip link and, as
       wide as the page, would keep Buddy aside all the way down */
    function control(a){
      if(!a||a===body||a===root||a.tabIndex<0||btn.contains(a)||panel.contains(a)||a.closest('.pb-bookbar,.pb-peek,.pb-consent'))return false;
      if(a.isContentEditable||a.tagName==='TEXTAREA'||a.tagName==='SELECT'||
         (a.tagName==='INPUT'&&!/^(range|checkbox|radio|button|submit|reset|color|file|image|hidden)$/i.test(a.type||'')))return true;
      try{return a.matches(':focus-visible');}catch(e){return true;}
    }
    function checkFocus(){
      var a=document.activeElement;
      covered=control(a)&&(function(r){return r.width>0&&meets(r,home(),8);})(a.getBoundingClientRect());
      decide();
    }
    function tuck(){
      var t=window.scrollY>40;
      if(t!==has('pb-b-tucked')){root.classList.toggle('pb-b-tucked',t);place();watch();}
    }
    var raf=0;
    window.addEventListener('scroll',function(){
      if(raf)return;
      raf=requestAnimationFrame(function(){raf=0;tuck();if(covered||document.activeElement!==body)checkFocus();});
    },{passive:true});
    window.addEventListener('resize',function(){place();watch();});
    document.addEventListener('focusin',function(e){
      if(btn.contains(e.target)||panel.contains(e.target)){if(aside){aside=false;covered=false;last=Date.now();place();}return;}
      checkFocus();
    });
    document.addEventListener('focusout',function(){setTimeout(checkFocus,0);});
    /* the bars and the analytics choice come and go by classes on <html> and <body>.
       A bar arriving moves the button's own place, so whether the focused
       control is under it is asked again, not remembered from before (Run
       37: with the booking bar coming up after a focus, the button came back
       from aside onto the control it had stepped away from) */
    var mo=new MutationObserver(function(){place();watch();checkFocus();});
    mo.observe(root,{attributes:true,attributeFilter:['class']});
    mo.observe(body,{attributes:true,attributeFilter:['class']});
    /* the panel open or shut: it opens where the button is, never aside */
    new MutationObserver(function(){if(!panel.hidden){aside=false;clearTimeout(clearT);clearT=null;}place();watch();}).observe(panel,{attributes:true,attributeFilter:['hidden']});
    tuck();place();watch();
  }
  /* after the page's own scripts have run (the bars); PBMotion is the head script's */
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',giveWay);
  else giveWay();
})();
