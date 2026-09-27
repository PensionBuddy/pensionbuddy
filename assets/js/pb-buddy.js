/* Ask Buddy, the floating quick-answers widget, in one place (Run 32,
   docs/UX-MOTION-AUDIT.md part 3a). Every root page loads it once, where its
   inline copy used to be; until then 23 pages carried one copy and six
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
  btn.innerHTML='<img src="'+AV+'" alt="">Ask Buddy';
  var panel=document.createElement('div');
  panel.className='pb-b-panel';panel.id='pbBuddyPanel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Ask Buddy: common questions');
  var listHtml='';
  qs.forEach(function(x,i){
    listHtml+='<div class="pb-b-item"><button type="button" class="pb-b-q" aria-expanded="false" data-i="'+i+'">'+x.q+'<span class="pm" aria-hidden="true">+</span></button><div class="pb-b-a" id="pbA'+i+'"><div>'+x.a+'</div></div></div>';
  });
  panel.innerHTML='<div class="pb-b-head"><img src="'+AV+'" alt=""><div><div class="t">Ask Buddy</div><div class="s">Quick answers. General info only \u2014 never advice.</div></div><button type="button" class="pb-b-close" aria-label="Close">\u00d7</button></div>'
    +'<div class="pb-b-list">'+listHtml+'</div>'
    +'<div class="pb-b-foot"><a class="btn btn-primary" href="booking.html">Book a call with Damian for free</a><p class="pb-why">Free, 20 minutes, no obligation.</p></div>';
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
})();
