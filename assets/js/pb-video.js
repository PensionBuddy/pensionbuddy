/*
  The game cards' videos (Run 38, item 1).

  Each card on the home page's "Just here to learn?" keeps its still
  picture, which is the video's poster too (data-poster, set only as the
  video comes near, so nothing loads early), and what a reader gets without
  JavaScript, with reduced motion asked for, or with data saving on. Over it
  sits a short loop of the real game, recorded by tools/record-games.mjs:
  muted, looping, inline, hidden from screen readers (the picture's own
  words describe the game), and not fetched at all (preload="none") until
  the card comes within about a screen of the viewport. It plays while it is
  near and pauses when it is not, or when the tab is hidden.

  Its button (WCAG 2.2.2) is an icon, pause or play, in the video's top
  corner, and its name says what it will do and to which game ("Pause
  video: Buddy's Run"; not "Play" alone, which the card's own link says for
  the game); a reader's pause holds until they press it again.
  With reduced motion (html.pb-motion off, now or later) nothing loads and
  nothing plays, and the video and its button are not drawn: the picture is
  all there is. Nothing is stored.
*/
(function () {
  'use strict';
  var vids = [].slice.call(document.querySelectorAll('video[data-pb-video]'));
  if (!vids.length || !('IntersectionObserver' in window)) { return; }
  var root = document.documentElement;
  var saving = !!(navigator.connection && navigator.connection.saveData);
  function motion() { return root.classList.contains('pb-motion'); }

  vids.forEach(function (v) {
    var btn = v.parentNode.querySelector('[data-pb-video-btn]');
    var name = btn ? btn.getAttribute('data-name') : '';
    var held = saving, near = false, fetched = false;
    function label() {
      if (!btn) { return; }
      btn.setAttribute('data-state', v.paused ? 'paused' : 'playing');
      btn.setAttribute('aria-label', (v.paused ? 'Play video' : 'Pause video') + ': ' + name);
    }
    function sync() {
      if (motion() && near && !held) {
        if (!fetched) {
          fetched = true;
          /* the poster is the card's own picture, the file the picture
             beneath has just loaded; set only now, as a poster in the
             markup is fetched at once, however far down the page it is */
          if (v.getAttribute('data-poster')) { v.poster = v.getAttribute('data-poster'); }
          v.preload = 'auto';
          v.load();
        }
        var p = v.play();
        if (p && p.catch) { p.catch(function () { label(); }); }
      } else if (!v.paused) {
        v.pause();
      }
      label();
    }
    v.addEventListener('play', label);
    v.addEventListener('pause', label);
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (v.paused) { held = false; near = true; sync(); } else { held = true; v.pause(); }
      });
    }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { near = e.isIntersecting; sync(); });
    }, { rootMargin: '600px 0px' }).observe(v);
    document.addEventListener('pb:motion', sync);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (!v.paused) { v.pause(); } } else { sync(); }
    });
    label();
  });
}());
