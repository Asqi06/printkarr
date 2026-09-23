// Tiny shell runtime: reveal-on-scroll, toast, clock. No dependencies.
(function () {
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  var t;
  window.toast = function (msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(t);
    t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  };

  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canHover && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      card.addEventListener('pointerenter', function () {
        card.style.transition = 'transform .18s ease-out, box-shadow .6s cubic-bezier(.22,.68,.24,1)';
      });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(1100px) rotateY(' + (px * 9).toFixed(2) + 'deg) rotateX(' + (-py * 9).toFixed(2) + 'deg) translateY(-7px) scale(1.008)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform .8s cubic-bezier(.22,.68,.24,1), box-shadow .6s cubic-bezier(.22,.68,.24,1)';
        card.style.transform = '';
      });
    });
  }
})();
