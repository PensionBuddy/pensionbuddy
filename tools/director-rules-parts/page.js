/* director-pension-rules.html (Run 20 #6).

   Which topics apply is assets/js/director-topics.js, covered by
   tests/director-topics.test.js; this file reads the four answers and lists
   what the module returns. Topics only, never a recommendation. Nothing is
   sent or stored. */
(function () {
  'use strict';
  var D = window.PBDirectorTopics;
  var form = document.getElementById('drForm');
  if (!D || !form) return;
  var $ = function (id) { return document.getElementById(id); };
  /* the booking link arrives with "Director" ticked; the fragment is added
     here rather than written into the markup, where the site's link check
     would read it as an anchor the booking page lacks (as in run 19, #2) */
  if ($('drBook')) $('drBook').href = 'booking.html#persona=director';

  function answers() {
    var a = {};
    D.QUESTIONS.forEach(function (q) { var c = form.querySelector('input[name="' + q + '"]:checked'); if (c) a[q] = c.value; });
    return a;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = answers(), list = D.topics(a);
    if (!list) {
      $('drErr').textContent = 'Answer all four questions to see the list.';
      form.querySelector('input[name="' + D.missing(a)[0] + '"]').focus();
      return;
    }
    $('drErr').textContent = '';
    var ul = $('drList');
    ul.textContent = '';
    list.forEach(function (t) {
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(t.text + ' '));
      var link = document.createElement('a');
      link.href = t.href;
      link.textContent = t.href.charAt(0) === '#' ? 'Read the rule' : 'Open the check';
      li.appendChild(link);
      ul.appendChild(li);
    });
    $('drOut').hidden = false;
    $('drOutH').focus();
  });
})();
