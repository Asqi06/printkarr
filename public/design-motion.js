// Progressive enhancement: content and ordinary navigation work without animation.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  var motion = window.Motion, gsap = window.gsap;
  var animations = new Map(), observer, marqueeObserver;
  function remember(node, animation) { animations.set(node, animation); }
  var marquee = document.querySelector('.print-marquee');
  if (marquee) {
    var pause = marquee.querySelector('button');
    pause.addEventListener('click', function () {
      var paused = marquee.classList.toggle('is-paused');
      pause.setAttribute('aria-pressed', String(paused));
      pause.textContent = paused ? 'Resume motion' : 'Pause motion';
    });
    if (window.IntersectionObserver) {
      marqueeObserver = new IntersectionObserver(function (entries) {
        marquee.classList.toggle('is-visible', entries[0].isIntersecting);
      });
      marqueeObserver.observe(marquee);
    } else marquee.classList.add('is-visible');
  }
  if (gsap && document.querySelector('.editorial-hero')) {
    document.querySelectorAll('.hero-eyebrow, .hero-copy h1, .hero-description, .hero-actions').forEach(function (node, index) {
      remember(node, gsap.fromTo(node, { y:index === 1 ? 44 : 18, opacity:.25 }, { y:0, opacity:1, duration:.85, delay:index*.1, ease:'power3.out', clearProps:'transform,opacity' }));
    });
    var sheet = document.querySelector('.hero-sheet');
    if (sheet) remember(sheet, gsap.fromTo(sheet, { x:64, rotation:5, scale:1.08, opacity:.4 }, { x:0, rotation:0, scale:1, opacity:1, duration:1.15, delay:.12, ease:'power3.out', clearProps:'transform,opacity' }));
  }
  if (motion && window.IntersectionObserver) {
    // Distinct content entrances; never animate a section and its children together.
    var effects = [
      ['.section-heading h2, .section-intro h2, .compare-section>h2, .referral-section h2, .campus-invitation h2', {y:[40,0], opacity:[.25,1]}, .8, 0],
      ['.process-list li', {x:[36,0], opacity:[.2,1]}, .65, .08],
      ['.feature-portrait img', {x:[42,0], scale:[1.06,1], opacity:[.3,1]}, .9, 0],
      ['.feature-notes article', {y:[24,0], opacity:[.2,1]}, .6, .09],
      ['.qk-prices strong, .guide-rates strong', {scale:[.88,1], opacity:[.25,1]}, .7, .08],
      ['.wallet-art-card', {y:[45,0], rotate:[-14,-6], opacity:[.3,1]}, .95, 0],
      ['.wallet-chapter h2', {x:[-28,0], opacity:[.25,1]}, .8, 0],
      ['.qk-pack, .qk-step', {y:[36,0], rotate:[2,0], opacity:[.25,1]}, .7, .07],
      ['.comparison-notes>div', {x:[24,0], opacity:[.25,1]}, .65, .12],
      ['.referral-link', {scale:[.94,1], opacity:[.3,1]}, .7, 0],
      ['.qk-faq-list details', {y:[14,0], opacity:[.35,1]}, .5, .04],
      ['.partner-model, .pk-host .img', {y:[30,0], opacity:[.3,1]}, .8, 0],
      ['.kiosk-image, .xerox-hero>img', {y:[28,0], opacity:[.35,1]}, .8, 0],
      ['.interior-wrap h1, .pub-wrap>h1, .main>h1, .login-box h1', {y:[22,0], opacity:[.4,1]}, .55, 0],
      ['.main>.grid>.card, .wallet-overview, .dashboard-action', {y:[12,0], opacity:[.5,1]}, .35, .04]
    ];
    var targets = new Map();
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (reduced.matches) return;
        var effect = targets.get(entry.target);
        remember(entry.target, motion.animate(entry.target, effect.frames, {duration:effect.duration, delay:effect.delay, ease:[.16,1,.3,1]}));
      });
    }, {threshold:.15});
    effects.forEach(function (effect) {
      document.querySelectorAll(effect[0]).forEach(function (node, index) {
        if (targets.has(node)) return;
        targets.set(node, {frames:effect[1], duration:effect[2], delay:(index % 4)*effect[3]});
        observer.observe(node);
      });
    });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.hero-actions a, .qk-pack, .dashboard-action, .referral-link, .rowlink').forEach(function (link) {
        var arrow = link.querySelector('.ui-icon');
        if (!arrow) return;
        var hover;
        function move(x) {
          if (reduced.matches) return;
          hover?.stop();
          hover = motion.animate(arrow, {x:x}, {type:'spring', stiffness:350, damping:24});
          remember(arrow, hover);
        }
        link.addEventListener('pointerenter', function () { move(4); });
        link.addEventListener('pointerleave', function () { move(0); });
      });
    }
  }
  document.querySelectorAll('.qk-faq-list details').forEach(function (item) {
    item.addEventListener('toggle', function () {
      var answer = item.querySelector('p');
      if (!item.open || reduced.matches || !answer?.animate) return;
      animations.get(answer)?.cancel();
      remember(answer, answer.animate([{opacity:.2, transform:'translateY(-8px)'}, {opacity:1, transform:'none'}], {duration:240, easing:'ease-out'}));
    });
  });
  reduced.addEventListener('change', function () {
    if (!reduced.matches) return;
    observer?.disconnect(); marqueeObserver?.disconnect();
    animations.forEach(function (animation, node) {
      if (animation.kill) animation.kill(); else if (animation.cancel) animation.cancel(); else animation.stop();
      node.style.removeProperty('opacity'); node.style.removeProperty('transform');
    });
  });
})();
