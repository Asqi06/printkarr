// Progressive enhancement: documents and navigation remain visible without motion.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  var motion = window.Motion, gsap = window.gsap;
  var animations = new Map(), observer;
  function remember(node, animation) { animations.set(node, animation); }
  if (gsap && document.querySelector('.editorial-hero')) {
    var hero = document.querySelectorAll('.hero-eyebrow, .hero-copy h1, .hero-description, .hero-actions');
    hero.forEach(function (node, index) {
      remember(node, gsap.fromTo(node, { y:18, opacity:.5 }, { y:0, opacity:1, duration:.6, delay:index*.08, ease:'power2.out', clearProps:'transform,opacity' }));
    });
    var sheet = document.querySelector('.hero-sheet');
    if (sheet) remember(sheet, gsap.fromTo(sheet, { y:20, opacity:.5 }, { y:0, opacity:1, duration:.8, ease:'power2.out', clearProps:'transform,opacity' }));
  }
  if (motion && window.IntersectionObserver) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (reduced.matches) return;
        remember(entry.target, motion.animate(entry.target, { opacity:[.65,1], y:[14,0] }, { duration:.45, ease:[.22,1,.36,1] }));
      });
    }, { threshold:.08 });
    document.querySelectorAll('.qk-section, .wallet-chapter, .main > .grid, .wallet-overview').forEach(function (node) { observer.observe(node); });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.hero-actions a, .qk-pack, .dashboard-action, .referral-link').forEach(function (link) {
        var arrow = link.querySelector('.ui-icon');
        if (!arrow) return;
        var hover;
        function move(x) {
          if (reduced.matches) return;
          hover?.stop();
          hover = motion.animate(arrow, { x:x }, { type:'spring', stiffness:350, damping:24 });
          remember(arrow, hover);
        }
        link.addEventListener('pointerenter', function () { move(3); });
        link.addEventListener('pointerleave', function () { move(0); });
      });
    }
  }
  reduced.addEventListener('change', function () {
    if (!reduced.matches) return;
    observer?.disconnect();
    animations.forEach(function (animation, node) {
      if (animation.kill) animation.kill(); else animation.stop();
      node.style.removeProperty('opacity'); node.style.removeProperty('transform');
    });
  });
})();
