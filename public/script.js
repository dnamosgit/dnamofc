(function () {
  'use strict';

  /* Logo splash (phones and tablets): hold briefly once the logo has loaded, then fade out.
     Shown once per visit; later pages skip it via the inline script in <head>.
     The Club site (data-splash-key) keeps its own "seen" note, and also waits for the
     page's pictures and styles to finish loading, so the page is ready when the logo clears.
     The stylesheet fades the splash out by itself after 3 seconds whatever happens. */
  var splash = document.querySelector('.splash');
  if (splash && getComputedStyle(splash).display !== 'none') {
    var splashKey = document.documentElement.getAttribute('data-splash-key');
    try { sessionStorage.setItem(splashKey || 'dnamoSplash', '1'); } catch (e) {}
    var logo = splash.querySelector('img');
    var waits = splashKey && document.readyState !== 'complete' ? 2 : 1;
    var hideSplash = function () {
      if (--waits > 0) return;
      setTimeout(function () { splash.classList.add('done'); }, 900);
    };
    if (logo.complete) hideSplash();
    else { logo.addEventListener('load', hideSplash); logo.addEventListener('error', hideSplash); }
    if (waits > 0 && splashKey) window.addEventListener('load', hideSplash);
  }

  /* Light / dark mode. The choice is remembered on this device, per site
     (the pages carry data-theme-key); this site starts dark.
     The inline script in <head> applies a saved choice before the page paints. */
  var root = document.documentElement;
  var themeBtn = document.querySelector('.theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function showTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-checked', String(dark));
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#000000' : '#ffffff');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') !== 'dark';
      if (dark) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem(root.getAttribute('data-theme-key') || 'dnamoTheme', dark ? 'dark' : 'light'); } catch (e) {}
      showTheme();
    });
    showTheme();
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* Menu button on phones and tablets */
  var navbox = document.querySelector('.navbox');
  var burger = document.querySelector('.burger');
  burger.addEventListener('click', function () {
    var open = navbox.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });

  /* Club site: on phones and tablets each dropdown is folded away behind a small arrow,
     so the whole menu fits. The group holding the current page starts open. */
  if (document.documentElement.getAttribute('data-site') === 'club') {
    Array.prototype.forEach.call(navbox.querySelectorAll('.navdrop'), function (drop, i) {
      var menu = drop.querySelector('.dropmenu');
      var link = drop.querySelector('.nav');
      if (!menu || !link) return;
      menu.id = menu.id || 'dropmenu-' + i;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'droptoggle';
      btn.setAttribute('aria-controls', menu.id);
      btn.setAttribute('aria-label', 'Show the pages under ' + link.textContent.trim());
      var set = function (open) {
        drop.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      };
      btn.addEventListener('click', function () { set(!drop.classList.contains('open')); });
      drop.insertBefore(btn, menu);
      set(!!menu.querySelector('.on'));
    });
  }

  /* Blocks fade up as they scroll into view. The .reveal class is added here, so the page
     is fully visible without JavaScript. Classes are removed afterwards so hover effects
     are not slowed by the stagger delay. */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        revealIO.unobserve(el);
        el.classList.add('in');
        setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.transitionDelay = '';
        }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    var seen = [];
    Array.prototype.forEach.call(document.querySelectorAll(
      'main section.w > .eyebrow, main section.w > h1.h, main section.w > .lead, ' +
      '.dark > .w > .eyebrow, .dark > .w > h2.h, .grid > *, .split > *, .split2 > *, ' +
      '.goals li, .cta-row, .band .w, .sec-split > *, .club-sec > h2.h'
    ), function (el) {
      var i = seen.filter(function (p) { return p === el.parentNode; }).length;
      seen.push(el.parentNode);
      el.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
      el.classList.add('reveal');
      revealIO.observe(el);
    });
  }

  /* Coaches (Club pages): selecting a coach opens their profile under the name; one is open at a time */
  Array.prototype.forEach.call(document.querySelectorAll('.coach'), function (card) {
    var head = card.querySelector('button.coach-head');
    if (!head) return;
    var bio = card.querySelector('.coach-bio');
    var toggle = function () {
      var open = !card.classList.contains('open');
      Array.prototype.forEach.call(document.querySelectorAll('.coach.open'), function (other) {
        other.classList.remove('open');
        other.querySelector('.coach-bio').hidden = true;
        other.querySelector('button.coach-head').setAttribute('aria-expanded', 'false');
      });
      if (!open) return;
      card.classList.add('open');
      bio.hidden = false;
      head.setAttribute('aria-expanded', 'true');
      // The card moves when it opens across the row: keep it in view
      var top = card.getBoundingClientRect().top;
      if (top < 90 || top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + top - 110, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    head.addEventListener('click', toggle);
    card.querySelector('img').addEventListener('click', toggle);
  });

  /* Page banner (Club pages): the photo moves a little slower than the page */
  var banner = document.querySelector('.pagehero img');
  if (banner && !reduceMotion) {
    var drifting = false;
    var drift = function () {
      drifting = false;
      var y = window.scrollY || 0;
      if (y < banner.parentNode.offsetHeight + 80) banner.style.setProperty('--drift', Math.round(y * 0.22) + 'px');
    };
    window.addEventListener('scroll', function () {
      if (!drifting) { drifting = true; requestAnimationFrame(drift); }
    }, { passive: true });
  }

  /* Cards: a soft red glow follows the pointer */
  if (canHover) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest ? e.target.closest('.card, .dir') : null;
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* Home hero slideshow: the photos take turns, cross-fading. Works for any number of photos.
     Without motion (or with a single photo) the first one simply stays. */
  var heroMedia = document.querySelector('.heromedia');
  var slides = heroMedia ? heroMedia.querySelectorAll('img[data-slot], img[data-extra]') : [];
  if (slides.length > 1 && !reduceMotion) {
    var slideNow = 0;
    slides[0].classList.add('on');
    heroMedia.classList.add('cycling');
    setInterval(function () {
      slides[slideNow].classList.remove('on');
      slideNow = (slideNow + 1) % slides.length;
      slides[slideNow].classList.add('on');
    }, 6500);
  }

  /* Home hero: the background video stays still for visitors who ask for reduced motion */
  var heroVideo = document.querySelector('.heromedia video');
  if (heroVideo && reduceMotion) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  }

  /* Back to top button, shown after scrolling down */
  var totop = document.createElement('button');
  totop.type = 'button';
  totop.className = 'totop';
  totop.setAttribute('aria-label', 'Back to top');
  totop.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(totop);
  var syncTop = function () { totop.classList.toggle('show', window.scrollY > 600); };
  window.addEventListener('scroll', syncTop, { passive: true });
  syncTop();
  totop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

})();
