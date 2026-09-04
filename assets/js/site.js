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

  // Lenis resets scroll to 0 on init, silently undoing the browser's native
  // jump-to-anchor when a page loads with a #hash in the URL (e.g. a link
  // from another page like /#about) -- so it has to be handled explicitly.
  // This remains intermittently flaky even after `load` plus an explicit
  // .resize() call (verified live, repeatedly) -- something about this
  // page's load order still occasionally leaves Lenis's scroll limit stale
  // at the moment scrollTo runs, for reasons that didn't resolve with any
  // single fixed timing point tried so far. Rather than guess another exact
  // moment, this verifies the scroll actually landed and retries with a
  // fresh resize() if it didn't, up to a few attempts.
  if (window.location.hash) {
    var hashTarget = document.getElementById(window.location.hash.slice(1));
    if (hashTarget) {
      var hashScrollAttempts = 0;
      var scrollToHash = function () {
        hashScrollAttempts++;
        window.__lenis.resize();
        window.__lenis.scrollTo(hashTarget, { offset: -20, immediate: true });
        setTimeout(function () {
          // getBoundingClientRect().top is already viewport-relative (i.e.
          // already accounts for current scroll), so a correct landing
          // means this is ~20 (matching the -20 offset) -- NOT ~0 and NOT
          // adding window.scrollY again, which is what an earlier version
          // of this check mistakenly did, making it never actually verify
          // anything.
          var landedAt = hashTarget.getBoundingClientRect().top;
          console.log('[hash-scroll] attempt', hashScrollAttempts, 'landedAt', landedAt, 'lenisLimit', window.__lenis.limit, 'scrollY', window.scrollY);
          if (Math.abs(landedAt - 20) > 40 && hashScrollAttempts < 10) {
            scrollToHash();
          }
        }, 120);
      };
      console.log('[hash-scroll] hash', window.location.hash, 'readyState', document.readyState);
      if (document.readyState === 'complete') {
        scrollToHash();
      } else {
        window.addEventListener('load', function () {
          console.log('[hash-scroll] load event fired, lenisLimit', window.__lenis.limit);
          scrollToHash();
        });
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
