(function () {
  // This script's tag ends up executed twice per page load (confirmed live:
  // one network fetch, but its top-level code runs twice, producing two
  // independent Lenis instances that raced each other for scroll control —
  // that's what made hash-anchor scrolling intermittently fail). Root cause
  // is in the site's page-bundler script-recreation step, not fixable here,
  // so this guards against it directly instead.
  if (window.__siteJsInitialized) return;
  window.__siteJsInitialized = true;

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

  // Lenis resets scroll to 0 on init, silently undoing the browser's native
  // jump-to-anchor when a page loads with a #hash in the URL (e.g. a link
  // from another page like /#about) -- so it has to be handled explicitly.
  // Calls .resize() first since Lenis's internal scroll limit doesn't
  // recompute on its own after construction. Even with that, a single
  // resize()+scrollTo() at `load` still lands short intermittently for
  // reasons that didn't resolve with any single fixed timing point tried --
  // manually calling scrollTo again afterwards always works correctly, so
  // rather than chase the exact right moment, this verifies the landing and
  // retries (with a fresh resize()) until it actually lands.
  if (window.location.hash) {
    var hashTarget = document.getElementById(window.location.hash.slice(1));
    if (hashTarget) {
      var hashScrollAttempts = 0;
      var scrollToHash = function () {
        hashScrollAttempts++;
        window.__lenis.resize();
        window.__lenis.scrollTo(hashTarget, { offset: -20, immediate: true });
        setTimeout(function () {
          // getBoundingClientRect().top is already viewport-relative, so a
          // correct landing means this is ~20 (matching the -20 offset).
          var landedAt = hashTarget.getBoundingClientRect().top;
          if (Math.abs(landedAt - 20) > 40 && hashScrollAttempts < 10) {
            scrollToHash();
          }
        }, 120);
      };
      if (document.readyState === 'complete') {
        scrollToHash();
      } else {
        window.addEventListener('load', scrollToHash);
      }
    }
  }

  function raf(time) {
    window.__lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  for (var i = 0; i < anchorLinks.length; i++) {
    if (anchorLinks[i].hasAttribute('data-open-book-a-call')) continue; // handled by booking-modal.js instead
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
