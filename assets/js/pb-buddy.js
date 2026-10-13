/* Ask Buddy, the floating button, in one place (Run 32,
   docs/UX-MOTION-AUDIT.md part 3a). Every root page loads it once, marked
   type="text/pb-late": the script in <head> (tools/pagebuild.py MOTION_HEAD)
   starts it once the first frame has painted, so the first paint never
   waits for it.
   Since 12 October 2026 (Damian: the questions before you call go, and a
   form on every page) the panel is a question and an email, no list of
   answers. It posts as "enquiry", the form "Ask us. We reply by email."
   declares (tools/lead-parts/ask.html), with the topic "Ask Buddy" and the
   page, through assets/js/pb-forms.js, which it loads when first opened if
   the page has not; failing that, a pre-filled email. Its form CSS is here:
   nothing of it exists without script. Vanilla JS. */
(function(){
  if(document.getElementById('pbBuddyBtn'))return;
  var me=document.currentScript, SRC=me&&me.src?me.src.replace(/pb-buddy\.js.*$/,'pb-forms.js'):'assets/js/pb-forms.js';
  var AV='data:image/jpeg;base64,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';
  var EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/, FALLBACK='hello@pensionbuddy.ie';
  /* on the booking page, and just after it, the panel does not point back to booking */
  var BOOKING=/^(booking|thank-you)(\.html)?$/.test(location.pathname.split('/').pop());
  var CSS=[
    '.pb-b-form{padding:16px 18px 6px;overflow-y:auto;flex:1}',
    '.pb-b-form textarea,.pb-b-form input[type=email]{display:block;width:100%;margin:0 0 10px;padding:12px 14px;font:15px/1.45 var(--font);color:var(--ink);background:var(--surface-2,#F4F1EA);border:1.5px solid transparent;border-radius:8px}',
    '.pb-b-form textarea{min-height:92px;resize:vertical}',
    '.pb-b-form textarea:focus,.pb-b-form input[type=email]:focus{outline:none;border-color:var(--teal);background:#fff;box-shadow:0 0 0 4px var(--teal-50)}',
    '.pb-b-form .btn{width:100%;justify-content:center}',
    '.pb-b-panel:not(:has(.pb-b-foot)) .pb-b-form{padding-bottom:18px}',
    '.pb-b-err{margin:8px 0 0;color:var(--red,#B42318);font-size:13.5px;font-weight:600}',
    '.pb-b-err:empty{display:none}',
    '.pb-b-ok{padding:26px 18px 18px;text-align:center}',
    '.pb-b-ok:focus{outline:none}',
    '.pb-b-ok b{display:block;font-size:19px;margin-bottom:4px;color:var(--ink)}',
    '.pb-b-ok p{margin:0;color:var(--ink-2);font-size:14.5px}',
    ':root.pb-motion .pb-b-ok:not([hidden]){animation:pbBIn .4s cubic-bezier(.22,.61,.36,1) both}',
    ':root.pb-motion .pb-b-form .is-bad{animation:pbBShake .42s cubic-bezier(.36,.07,.19,.97)}',
    '@keyframes pbBIn{from{opacity:0;transform:translateY(8px)}}',
    '@keyframes pbBShake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}'
  ].join('\n');
  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);

  var btn=document.createElement('button');
  btn.id='pbBuddyBtn';btn.className='pb-b-btn';btn.type='button';
  btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<img src="'+AV+'" width="96" height="96" alt=""><span class="pb-b-label">Ask Buddy</span>';
  var panel=document.createElement('div');
  panel.className='pb-b-panel';panel.id='pbBuddyPanel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Ask Buddy: ask us a question');
  panel.innerHTML='<div class="pb-b-head"><img src="'+AV+'" width="96" height="96" alt=""><div><div class="t">Ask Buddy</div><div class="s">Ask us anything. We reply by email.</div></div><button type="button" class="pb-b-close" aria-label="Close">\u00d7</button></div>'
    +'<form class="pb-b-form" novalidate>'
    +'<input type="hidden" name="form-name" value="enquiry"><input type="hidden" name="topic" value="Ask Buddy">'
    +'<input type="hidden" name="page"><input type="hidden" name="reply_by"><input type="hidden" name="details">'
    +'<input type="hidden" name="name"><input type="hidden" name="contact_by" value="Email"><input type="hidden" name="phone">'
    +'<p class="pb-hp" hidden><label>Leave this field empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>'
    +'<textarea name="message" maxlength="1500" aria-label="Your question" placeholder="Your question"></textarea>'
    +'<input name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" aria-label="Your email" placeholder="Your email" aria-describedby="pbBErr">'
    +'<button type="submit" class="btn btn-primary">Send</button>'
    +'<p class="pb-b-err" id="pbBErr" role="alert"></p>'
    +'</form>'
    +'<div class="pb-b-ok" role="status" tabindex="-1" hidden><b>Sent.</b><p></p></div>'
    +(BOOKING?'':'<div class="pb-b-foot"><a class="btn btn-ghost" href="booking.html">Book a free 20-minute call with us</a></div>');
  document.body.appendChild(btn);document.body.appendChild(panel);

  function open(){panel.hidden=false;btn.setAttribute('aria-expanded','true');var f=form.hidden?panel.querySelector('.pb-b-close'):msg;if(f)f.focus();}
  function close(){panel.hidden=true;btn.setAttribute('aria-expanded','false');btn.focus();}
  btn.addEventListener('click',function(){panel.hidden?open():close();});
  panel.querySelector('.pb-b-close').addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden)close();});
  var form=panel.querySelector('form'), okBox=panel.querySelector('.pb-b-ok'), err=panel.querySelector('.pb-b-err');
  var msg=form.elements.message, email=form.elements.email, go=form.querySelector('[type=submit]');
  /* pb-forms.js, if the page did not load it: fetched once, on the first open */
  var forms=null;
  function loadForms(){
    if(window.PBForms)return Promise.resolve(true);
    if(forms)return forms;
    forms=new Promise(function(res){var sc=document.createElement('script');sc.src=SRC;sc.onload=function(){res(!!window.PBForms);};sc.onerror=function(){res(false);};document.head.appendChild(sc);});
    return forms;
  }
  btn.addEventListener('click',function(){loadForms();});
  [msg,email].forEach(function(el){el.addEventListener('input',function(){err.textContent='';});});
  function shake(el){if(!el)return;el.classList.remove('is-bad');void el.offsetWidth;el.classList.add('is-bad');}
  function mail(){
    window.location.href='mailto:'+FALLBACK+'?subject='+encodeURIComponent('A question')+'&body='+encodeURIComponent(msg.value.trim()+'\n\n'+location.href.split('#')[0]);
  }
  function said(h,t){form.hidden=true;okBox.hidden=false;okBox.querySelector('b').textContent=h;okBox.querySelector('p').textContent=t;okBox.focus({preventScroll:true});}
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(go.getAttribute('aria-disabled')==='true')return;
    if(!msg.value.trim()){err.textContent='Type your question.';shake(msg);msg.focus();return;}
    if(!EMAIL.test(email.value.trim())){err.textContent='Enter a valid email.';shake(email);email.focus();return;}
    err.textContent='';go.setAttribute('aria-disabled','true');
    loadForms().then(function(ok){
      if(!ok){go.removeAttribute('aria-disabled');mail();said('One more step.','Your email app should have opened with it ready to send. If not, email '+FALLBACK+'.');return;}
      var by=PBForms.replyBy?PBForms.replyBy():'';
      PBForms.send(form,{page:location.href.split('#')[0],reply_by:by,details:'Asked from: '+document.title}).then(function(sent){
        go.removeAttribute('aria-disabled');
        if(sent)said('Sent.','We\u2019ll reply '+(by?'by '+by:'within one working day')+'.');
        else{mail();said('One more step.','Your email app should have opened with it ready to send. If not, email '+FALLBACK+'.');}
      });
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
       - Away: while the analytics choice or the phone menu is open it waits
         off screen and out of the tab order, so it covers neither the choice,
         the menu nor the page. The menu opening shuts the panel.
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
    var nav=document.getElementById('navLinks');
    function menu(){return !!nav&&nav.classList.contains('open');}
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
      var away=(body.classList.contains('pb-banner-open')||menu())&&panel.hidden;
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
    if(nav)new MutationObserver(function(){
      if(menu()&&!panel.hidden){panel.hidden=true;btn.setAttribute('aria-expanded','false');}
      place();
    }).observe(nav,{attributes:true,attributeFilter:['class']});
    /* the panel open or shut: it opens where the button is, never aside */
    new MutationObserver(function(){if(!panel.hidden){aside=false;clearTimeout(clearT);clearT=null;}place();watch();}).observe(panel,{attributes:true,attributeFilter:['hidden']});
    tuck();place();watch();
  }
  /* after the page's own scripts have run (the bars); PBMotion is the head script's */
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',giveWay);
  else giveWay();
})();
