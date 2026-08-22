(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var parallaxTargets = [];
  var heroGrid = document.getElementById('hero-grid');
  if (heroGrid) parallaxTargets.push({ el: heroGrid, factor: 0.05, max: 40 });

  function updateParallax() {
    for (var i = 0; i < parallaxTargets.length; i++) {
      var t = parallaxTargets[i];
      var rect = t.el.getBoundingClientRect();
      var delta = (rect.top + rect.height / 2 - window.innerHeight / 2) * t.factor;
      if (delta > t.max) delta = t.max;
      if (delta < -t.max) delta = -t.max;
      t.el.style.transform = 'translateY(' + delta.toFixed(2) + 'px)';
    }
  }

  // Reduced motion (or Lenis failed to load): native scroll, no inertia, no parallax.
  if (reduce || typeof Lenis === 'undefined') return;

  window.__lenis = new Lenis({
    duration: 1.1,
    easing: function (t) { return 1 - Math.pow(1 - t, 4); },
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.2
  });

  window.__lenis.on('scroll', updateParallax);

  function raf(time) {
    window.__lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  for (var i = 0; i < anchorLinks.length; i++) {
    anchorLinks[i].addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href.length < 2) return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      window.__lenis.scrollTo(target, { offset: -20 });
    });
  }
})();
