/* Prakash Bhatu — Portfolio interactions
   Lightweight, dependency-free (optional Lenis for smooth scroll). */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var CONTACT_EMAIL = 'bhatuprakash140@gmail.com';
  var WHATSAPP_NUMBER = '919773189041';
  // Paste the free access key from https://web3forms.com (sent to bhatuprakash140@gmail.com)
  // to deliver form messages straight to the inbox. Empty = form opens the visitor's email app.
  var WEB3FORMS_KEY = 'a98cf0dd-a4c3-42e3-9e21-2096e6799e08';
  function escapeHtml(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ---------- Theme (dark / light) ---------- */
  function applyTheme(theme, animate) {
    if (animate && !reduceMotion) {
      root.classList.add('theme-fade');
      setTimeout(function () { root.classList.remove('theme-fade'); }, 500);
    }
    root.setAttribute('data-theme', theme);
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#0a0a0b');
    $$('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
      b.setAttribute('aria-pressed', String(theme === 'light'));
    });
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next, true);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  /* ---------- Dynamic year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- Film grain texture (generated once, ~6 KB) ---------- */
  if (!reduceMotion && doc.querySelector('.film-grain')) {
    try {
      var gc = doc.createElement('canvas');
      gc.width = gc.height = 160;
      var gx = gc.getContext('2d');
      var gd = gx.createImageData(160, 160);
      for (var gi = 0; gi < gd.data.length; gi += 4) {
        var v = Math.random() * 255;
        gd.data[gi] = gd.data[gi + 1] = gd.data[gi + 2] = v;
        gd.data[gi + 3] = 255;
      }
      gx.putImageData(gd, 0, 0);
      root.style.setProperty('--grain', 'url(' + gc.toDataURL('image/png') + ')');
    } catch (e) { /* grain is decorative */ }
  }

  /* ---------- Opening title sequence (once per session) ---------- */
  var introDone = !root.classList.contains('intro-on');
  var introCallbacks = [];
  function whenIntroDone(fn) { if (introDone) fn(); else introCallbacks.push(fn); }
  (function intro() {
    var el = $('#intro');
    if (introDone || !el) { if (el) el.remove(); return; }
    if (lenis) lenis.stop();
    var tc = $('#introTc');
    var skip = $('#introSkip');
    var start = performance.now();
    var finished = false;
    var tcLoop = function (t) {
      if (finished) return;
      var ms = t - start;
      var f = Math.floor(ms / (1000 / 24)) % 24;
      var sec = Math.floor(ms / 1000);
      tc.textContent = '00:00:' + String(sec).padStart(2, '0') + ':' + String(f).padStart(2, '0');
      requestAnimationFrame(tcLoop);
    };
    requestAnimationFrame(tcLoop);

    var close = function () {
      if (finished) return;
      finished = true;
      el.classList.add('is-out');
      try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
      // let the shutters start opening, then hand over to the hero
      setTimeout(function () {
        introDone = true;
        root.classList.remove('intro-on');
        if (lenis) lenis.start();
        introCallbacks.forEach(function (fn) { fn(); });
        introCallbacks = [];
      }, 450);
      setTimeout(function () { el.remove(); }, 1300);
    };
    if (skip) {
      skip.addEventListener('click', close);
      setTimeout(function () { skip.focus({ preventScroll: true }); }, 50);
    }
    doc.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { close(); doc.removeEventListener('keydown', onKey); }
    });
    el.addEventListener('wheel', close, { passive: true });
    el.addEventListener('touchmove', close, { passive: true });

    // play for at least 1.6 s, and until the first hero frame is ready (max 3 s)
    var minDone = false, frameReady = false;
    var maybeClose = function () { if (minDone && frameReady) close(); };
    setTimeout(function () { minDone = true; maybeClose(); }, 1600);
    setTimeout(close, 3000);
    var first = new Image();
    first.onload = first.onerror = function () { frameReady = true; maybeClose(); };
    first.src = 'webp/prakash-portfolio_00000.webp';
  })();

  function scrollToTarget(target) {
    var header = $('#siteHeader');
    var offset = target.id === 'home' ? 0 : -((header ? header.offsetHeight : 0) + 24);
    if (lenis) {
      lenis.scrollTo(target, { offset: offset, duration: 1.2 });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* ---------- Mobile menu ---------- */
  var menu = $('#mobileMenu');
  var toggle = $('#menuToggle');
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    doc.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = $('a', menu);
      if (first) setTimeout(function () { first.focus(); }, 300);
    }
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Anchor links ---------- */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="#"], [data-to-top]');
    if (!a) return;
    if (a.hasAttribute('data-to-top')) {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    var url = new URL(a.href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash || url.hash === '#') return;
    var target = doc.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    if (menu && menu.classList.contains('is-open')) setMenu(false);
    scrollToTarget(target);
    history.replaceState(null, '', url.hash);
  });

  /* ---------- Header: hide on scroll down, active link ---------- */
  var header = $('#siteHeader');
  var lastY = window.pageYOffset;
  function onScrollHeader() {
    var y = window.pageYOffset;
    if (header) {
      var menuOpen = menu && menu.classList.contains('is-open');
      if (!menuOpen && y > 160 && y > lastY + 4) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y <= 160) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  var navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var sectionMap = {};
    navLinks.forEach(function (l) { sectionMap[l.getAttribute('href').slice(1)] = l; });
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = sectionMap[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionMap).forEach(function (id) { var s = doc.getElementById(id); if (s) navObs.observe(s); });
  }

  /* ---------- Text split + reveal ---------- */
  function splitWords(el) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span');
            w.className = 'w';
            var inner = doc.createElement('span');
            inner.textContent = p;
            inner.style.setProperty('--i', i++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    }
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    walk(el);
    el.setAttribute('aria-label', label);
    $$('.w', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
  }
  $$('[data-split]').forEach(splitWords);

  var revealEls = $$('[data-reveal], [data-split]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revObs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    // Hero elements animate in on load (page entrance)
    revealEls.forEach(function (el) {
      if (el.closest('.hero')) return;
      revObs.observe(el);
    });
    var heroEls = revealEls.filter(function (el) { return el.closest('.hero'); });
    var showHero = function () { heroEls.forEach(function (el) { el.classList.add('is-in'); }); };
    whenIntroDone(function () {
      requestAnimationFrame(function () { requestAnimationFrame(showHero); });
      setTimeout(showHero, 120);
    });
  }

  /* ---------- Hero: scroll-linked portrait sequence ---------- */
  (function heroSequence() {
    var canvas = $('#heroCanvas');
    var wrap = $('#heroCanvasWrap');
    var hero = $('#home');
    if (!canvas || !wrap || !hero) return;
    var ctx = canvas.getContext('2d', { alpha: false });
    var TOTAL = 240;
    var BG = '#121212';
    var images = new Array(TOTAL);
    var loaded = new Uint8Array(TOTAL);
    var target = 0, current = 0, lastDrawn = -1, dirty = true;
    var mobileMQ = window.matchMedia('(max-width: 1024px)');

    function src(i) {
      return 'webp/prakash-portfolio_' + String(i).padStart(5, '0') + '.webp';
    }
    // Lighter on phones: every 2nd frame (every 3rd with Data Saver). nearestLoaded() fills the gaps.
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var stride = saveData ? 3 : (mobileMQ.matches ? 2 : 1);
    function fetchFrame(i) {
      i = i - (i % stride);
      if (images[i]) return images[i];
      var img = new Image();
      img.decoding = 'async';
      images[i] = img;
      img.onload = function () { loaded[i] = 1; if (Math.abs(i - Math.round(current)) <= 2 || i === 0) dirty = true; };
      // a failed frame is skipped: nearestLoaded() draws the closest frame that did load
      img.src = src(i);
      return img;
    }
    function nearestLoaded(i) {
      if (loaded[i]) return i;
      for (var d = 1; d < TOTAL; d++) {
        if (i - d >= 0 && loaded[i - d]) return i - d;
        if (i + d < TOTAL && loaded[i + d]) return i + d;
      }
      return -1;
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.imageSmoothingQuality = 'high';
      dirty = true; lastDrawn = -1;
    }
    function draw(img) {
      var cw = canvas.width, ch = canvas.height;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, cw, ch);
      var s, w, h, x, y;
      if (mobileMQ.matches) {
        // Portrait crop centred on the subject
        s = Math.max(cw / (iw * 0.42), ch / (ih * 0.92));
        w = iw * s; h = ih * s;
        x = (cw - w) / 2;
        y = ch - h * 0.98;
      } else {
        // Cover, with the subject shifted right so copy sits on the left
        s = Math.max(cw / iw, ch / ih) * 1.02;
        w = iw * s; h = ih * s;
        var shift = wrap.clientWidth >= 1500 ? 0.2 : 0.24;
        x = (cw - w) / 2 + cw * shift;
        y = (ch - h) / 2 + ch * 0.04;
      }
      ctx.drawImage(img, x, y, w, h);
    }
    function progress() {
      var r, p;
      if (mobileMQ.matches || reduceMotion) {
        r = wrap.getBoundingClientRect();
        p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      } else {
        r = hero.getBoundingClientRect();
        var dist = hero.offsetHeight - window.innerHeight;
        p = dist > 0 ? -r.top / dist : 0;
      }
      return Math.max(0, Math.min(1, p));
    }
    // Scene controller: --hp drives dissolve / letterbox / camera push in CSS; captions switch by range
    var caps = $$('.cap', hero).map(function (c) {
      return { el: c, from: parseFloat(c.getAttribute('data-from')), to: parseFloat(c.getAttribute('data-to')) };
    });
    function updateScene(p) {
      var cinematic = !reduceMotion && !mobileMQ.matches;
      hero.style.setProperty('--hp', cinematic ? p.toFixed(4) : '0');
      for (var ci = 0; ci < caps.length; ci++) {
        var cp = caps[ci];
        var on = cinematic && p >= cp.from && p < cp.to;
        cp.el.classList.toggle('is-on', on);
        cp.el.classList.toggle('is-past', cinematic && p >= cp.to);
      }
    }
    function onScroll() {
      var hp = progress();
      updateScene(hp);
      target = reduceMotion ? 0 : hp * (TOTAL - 1);
      var c = Math.round(target);
      for (var o = 0; o <= 8; o++) {
        if (c + o < TOTAL) fetchFrame(c + o);
        if (c - o >= 0) fetchFrame(c - o);
      }
    }
    function tick() {
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.01) current = target;
      var idx = nearestLoaded(Math.round(current));
      if (idx >= 0 && (idx !== lastDrawn || dirty)) {
        draw(images[idx]);
        lastDrawn = idx; dirty = false;
      }
      requestAnimationFrame(tick);
    }

    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) onScroll(); }, { rootMargin: '200px' }).observe(wrap);
    }
    window.addEventListener('scroll', function () { if (visible) onScroll(); }, { passive: true });
    window.addEventListener('resize', function () { resize(); onScroll(); }, { passive: true });
    if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', function () { resize(); onScroll(); });

    resize();
    fetchFrame(0);
    if (!reduceMotion) {
      for (var k = 1; k <= 6; k++) fetchFrame(k);
      var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };
      window.addEventListener('load', function () {
        setTimeout(function () {
          var keys = [];
          for (var i = 8; i < TOTAL; i += 8) keys.push(i);
          (function next() {
            if (!keys.length) return;
            fetchFrame(keys.shift());
            idle(next, { timeout: 600 });
          })();
        }, 1200);
      }, { once: true });
    }
    onScroll();
    requestAnimationFrame(tick);
  })();

  /* ---------- Card glow follows the pointer ---------- */
  if (finePointer && !reduceMotion) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* ---------- Cursor bubble on project media ---------- */
  var bubble = $('#cursorBubble');
  var preview = $('#indexPreview');
  if (finePointer && !reduceMotion) {
    var mx = 0, my = 0, bx = 0, by = 0, px = 0, py = 0, running = false;
    var bubbleOn = false, previewOn = false;
    var loop = function () {
      bx += (mx - bx) * 0.22; by += (my - by) * 0.22;
      px += (mx - px) * 0.14; py += (my - py) * 0.14;
      if (bubble) bubble.style.translate = bx + 'px ' + by + 'px';
      if (preview) preview.style.translate = (px + 180) + 'px ' + py + 'px';
      if (bubbleOn || previewOn || Math.abs(mx - bx) > 0.5) requestAnimationFrame(loop); else running = false;
    };
    var kick = function () { if (!running) { running = true; requestAnimationFrame(loop); } };
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; kick(); }, { passive: true });

    $$('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        if (!bubble) return;
        bubble.textContent = el.getAttribute('data-cursor') === 'View case study' ? 'View' : el.getAttribute('data-cursor');
        bx = mx; by = my;
        bubbleOn = true; bubble.classList.add('is-visible'); kick();
      });
      el.addEventListener('pointerleave', function () { bubbleOn = false; if (bubble) bubble.classList.remove('is-visible'); });
    });

    $$('[data-preview]').forEach(function (row) {
      row.addEventListener('pointerenter', function () {
        if (!preview) return;
        var img = $('img', preview);
        img.src = row.getAttribute('data-preview');
        px = mx; py = my;
        previewOn = true; preview.classList.add('is-visible'); kick();
      });
      row.addEventListener('pointerleave', function () { previewOn = false; if (preview) preview.classList.remove('is-visible'); });
    });
  }

  /* ---------- Process film strip ----------
     Desktop: the section pins and vertical scroll moves the reel sideways
     (pin height = viewport + horizontal overflow, so 1px down = 1px across).
     Tablet/phone or reduced motion: native swipe carousel. */
  var pfPin = $('#processSteps');
  if (pfPin) {
    var pfStrip = $('.pf-strip', pfPin);
    var pfTrack = $('.pf-track', pfPin);
    var pfFrames = $$('.pf-frame', pfPin);
    var pfCount = $('.pf-count b', pfPin);
    var pfBar = $('.pf-bar', pfPin);
    var pfSteps = pfFrames.length - 1; // last frame is "The end"
    var pfMQ = window.matchMedia('(max-width: 1024px)');
    var pfOverflow = 0;
    var pfTick = false;
    var pinned = function () { return !reduceMotion && !pfMQ.matches; };

    var pfLayout = function () {
      if (pinned()) {
        pfOverflow = Math.max(0, pfTrack.scrollWidth - pfStrip.clientWidth);
        pfPin.style.height = (window.innerHeight + pfOverflow) + 'px';
      } else {
        pfOverflow = 0;
        pfPin.style.height = '';
        pfTrack.style.transform = '';
      }
    };
    var pfSetActive = function (p) {
      var best = 0;
      if (pinned()) {
        // pinned: scroll progress walks through the frames, first → "The end"
        best = Math.round(p * (pfFrames.length - 1));
      } else {
        // swipe: the frame whose centre is closest to the strip centre
        var sr = pfStrip.getBoundingClientRect();
        var mid = sr.left + sr.width / 2, bestD = Infinity;
        pfFrames.forEach(function (f, i) {
          var r = f.getBoundingClientRect();
          var d = Math.abs(r.left + r.width / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
      }
      pfFrames.forEach(function (f, i) { f.classList.toggle('is-active', i === best); });
      if (pfCount) pfCount.textContent = String(Math.min(best + 1, pfSteps)).padStart(2, '0');
      if (pfBar) pfBar.style.setProperty('--pfp', p.toFixed(4));
    };
    var pfUpdate = function () {
      pfTick = false;
      var p;
      if (pinned()) {
        var r = pfPin.getBoundingClientRect();
        var dist = pfPin.offsetHeight - window.innerHeight;
        p = dist > 0 ? Math.max(0, Math.min(1, -r.top / dist)) : 0;
        pfTrack.style.transform = 'translate3d(' + (-p * pfOverflow).toFixed(1) + 'px,0,0)';
      } else {
        var max = pfStrip.scrollWidth - pfStrip.clientWidth;
        p = max > 0 ? pfStrip.scrollLeft / max : 0;
      }
      pfSetActive(p);
    };
    var pfRequest = function () { if (!pfTick) { pfTick = true; requestAnimationFrame(pfUpdate); } };
    window.addEventListener('scroll', pfRequest, { passive: true });
    pfStrip.addEventListener('scroll', pfRequest, { passive: true });
    window.addEventListener('resize', function () { pfLayout(); pfRequest(); }, { passive: true });
    window.addEventListener('load', function () { pfLayout(); pfRequest(); }, { once: true });
    if (pfMQ.addEventListener) pfMQ.addEventListener('change', function () { pfLayout(); pfRequest(); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { pfLayout(); pfRequest(); });
    pfLayout();
    pfUpdate();
  }

  /* =========================================================
     SCROLL MOTION
     One rAF loop drives every scroll-linked effect. Each item
     gets a progress value p: 0 when its top enters the bottom of
     the viewport, 1 when its bottom leaves the top.
     Only transform / opacity / clip-path are animated.
     ========================================================= */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* Count-up stats (runs once, also fine with reduced motion: shows final value) */
  var counters = $$('[data-count]');
  if (counters.length) {
    var runCount = function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var numEl = el.firstChild;
      if (reduceMotion || !numEl) return;
      var start = null, dur = 1400;
      var step = function (t) {
        if (start === null) start = t;
        var k = clamp01((t - start) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        numEl.nodeValue = String(Math.round(target * eased));
        if (k < 1) requestAnimationFrame(step);
      };
      numEl.nodeValue = '0';
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var cObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cObs.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cObs.observe(c); });
    }
  }

  /* Word-by-word text fill */
  $$('[data-fill]').forEach(function (el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span');
            w.className = 'fw';
            w.setAttribute('aria-hidden', 'true');
            w.textContent = part;
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) { walk(child); }
      });
    })(el);
    el.setAttribute('aria-label', label);
  });

  var motionItems = [];
  function addItems(sel, type) { $$(sel).forEach(function (el, i) { motionItems.push({ el: el, type: type, i: i }); }); }

  if (!reduceMotion) {
    root.classList.add('has-motion');
    addItems('[data-fill]', 'fill');
    addItems('.work-grid .project', 'zoom');
    addItems('.project-media img', 'parallax');
    addItems('.logo-banner', 'clip');
    addItems('.video-grid .video-tile', 'float');
    addItems('.footer-word, .s-title-shift', 'rise');
    addItems('.services-grid .service', 'tilt');
  }

  var progressBar = $('#scrollProgress');
  var lastScrollY = window.pageYOffset;
  var scrollDir = 1;
  var velocity = 0;

  function updateMotion() {
    var vh = window.innerHeight;
    var y = window.pageYOffset;
    var dy = y - lastScrollY;
    if (dy !== 0) scrollDir = dy > 0 ? 1 : -1;
    velocity += (Math.abs(dy) - velocity) * 0.2;
    lastScrollY = y;

    if (progressBar) {
      var max = doc.documentElement.scrollHeight - vh;
      progressBar.style.transform = 'scaleX(' + (max > 0 ? clamp01(y / max) : 0).toFixed(4) + ')';
    }

    for (var n = 0; n < motionItems.length; n++) {
      var it = motionItems[n];
      var r = it.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      var p = clamp01((vh - r.top) / (vh + r.height));

      switch (it.type) {
        case 'fill': {
          var words = it.words || (it.words = $$('.fw', it.el));
          var k = clamp01((p - 0.18) / 0.42) * words.length;
          for (var w = 0; w < words.length; w++) words[w].classList.toggle('on', w < k);
          break;
        }
        case 'zoom': {
          var z = clamp01(p / 0.38);
          it.el.style.scale = (0.9 + 0.1 * z).toFixed(4);
          break;
        }
        case 'parallax': {
          it.el.style.setProperty('--py', ((p - 0.5) * -12).toFixed(2) + '%');
          break;
        }
        case 'clip': {
          var c = clamp01((p - 0.04) / 0.36);
          var inset = ((1 - c) * 16).toFixed(2);
          it.el.style.clipPath = 'inset(' + inset + '% ' + inset + '% ' + inset + '% ' + inset + '% round 28px)';
          break;
        }
        case 'float': {
          var col = it.i % 4;
          var amp = [40, -30, 55, -20][col];
          it.el.style.translate = '0 ' + ((p - 0.5) * amp).toFixed(1) + 'px';
          break;
        }
        case 'rise': {
          // complete once the element is fully on screen (footer sits at page end)
          var rv = clamp01((vh - r.top) / (r.height * 1.3));
          var ease = 1 - Math.pow(1 - rv, 3);
          it.el.style.translate = '0 ' + ((1 - ease) * 45).toFixed(2) + '%';
          it.el.style.opacity = (0.15 + 0.85 * ease).toFixed(3);
          break;
        }
        case 'tilt': {
          var tv = clamp01(p / 0.4);
          var dirX = it.i % 2 ? 1 : -1;
          it.el.style.rotate = ((1 - tv) * 4 * dirX).toFixed(2) + 'deg';
          // no sideways slide on narrow screens (single column would overflow)
          it.el.style.translate = window.innerWidth < 761 ? '0 ' + ((1 - tv) * 30).toFixed(1) + 'px' : ((1 - tv) * 40 * dirX).toFixed(1) + 'px 0';
          break;
        }
      }
    }
  }

  /* Velocity-reactive marquees (JS-driven, reverse with scroll direction) */
  var marquees = [];
  if (!reduceMotion) {
    root.classList.add('js-marquee');
    $$('[data-marquee]').forEach(function (track) {
      marquees.push({
        el: track,
        dir: parseFloat(track.getAttribute('data-marquee')) || -1,
        base: parseFloat(track.getAttribute('data-speed')) || 40,
        x: 0,
        hover: false,
        width: 0
      });
      var wrapHover = track.closest('[data-pause-hover]');
      if (wrapHover) {
        var m = marquees[marquees.length - 1];
        wrapHover.addEventListener('pointerenter', function () { m.hover = true; });
        wrapHover.addEventListener('pointerleave', function () { m.hover = false; });
      }
    });
    var measure = function () {
      marquees.forEach(function (m) { m.width = m.el.firstElementChild ? m.el.firstElementChild.offsetWidth : 0; });
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { once: true });
  }

  var lastT = performance.now();
  function frame(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    updateMotion();
    var boost = 1 + Math.min(velocity, 80) * 0.12;
    for (var i = 0; i < marquees.length; i++) {
      var m = marquees[i];
      if (!m.width) continue;
      var speed = m.hover ? 0 : m.base * boost;
      m.x += m.dir * scrollDir * speed * dt;
      if (m.x <= -m.width) m.x += m.width;
      if (m.x > 0) m.x -= m.width;
      m.el.style.transform = 'translate3d(' + m.x.toFixed(2) + 'px,0,0)';
    }
    var skew = Math.max(-8, Math.min(8, velocity * 0.35 * scrollDir));
    root.style.setProperty('--skew', skew.toFixed(2) + 'deg');
    requestAnimationFrame(frame);
  }
  if (!reduceMotion) requestAnimationFrame(frame);
  else { updateMotion(); window.addEventListener('scroll', updateMotion, { passive: true }); }

  /* ---------- Video modal ---------- */
  var vmodal = $('#vmodal');
  var vdialog = $('#vmodalDialog');
  var vvideo = $('#vmodalVideo');
  var vtitle = $('#vmodalTitle');
  var vclose = $('#vmodalClose');
  var lastTrigger = null;
  function openVideo(btn) {
    if (!vmodal) return;
    lastTrigger = btn;
    vtitle.textContent = btn.getAttribute('data-title');
    vdialog.classList.toggle('is-portrait', btn.getAttribute('data-format') === 'reel');
    vvideo.src = btn.getAttribute('data-video');
    vmodal.classList.add('is-open');
    vmodal.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    doc.body.style.overflow = 'hidden';
    vclose.focus();
    var p = vvideo.play();
    if (p && p.catch) p.catch(function () {});
  }
  function closeVideo() {
    if (!vmodal || !vmodal.classList.contains('is-open')) return;
    vvideo.pause();
    vvideo.removeAttribute('src');
    vvideo.load();
    vmodal.classList.remove('is-open');
    vmodal.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    doc.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }
  $$('.video-tile').forEach(function (b) { b.addEventListener('click', function () { openVideo(b); }); });
  if (vclose) vclose.addEventListener('click', closeVideo);
  if (vmodal) vmodal.addEventListener('click', function (e) { if (e.target === vmodal) closeVideo(); });
  doc.addEventListener('keydown', function (e) {
    if (!vmodal || !vmodal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeVideo();
    if (e.key === 'Tab') {
      var f = [vclose, vvideo];
      var i = f.indexOf(doc.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  /* ---------- FAQ ---------- */
  $$('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', String(!open));
    });
  });

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        var prev = btn.getAttribute('aria-label');
        btn.setAttribute('aria-label', 'Email copied');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';
        setTimeout(function () {
          btn.setAttribute('aria-label', prev);
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { window.location.href = 'mailto:' + text; });
      } else {
        window.location.href = 'mailto:' + text;
      }
    });
  });

  /* ---------- Contact form (email / WhatsApp handoff) ---------- */
  var form = $('#projectForm');
  if (form) {
    var status = $('#formStatus');
    var submitter = 'email';
    $$('[data-send]', form).forEach(function (b) {
      b.addEventListener('click', function () { submitter = b.getAttribute('data-send'); });
    });

    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'; },
      type: function (v) { return v ? '' : 'Please choose a project type.'; },
      message: function (v) { return v.trim().length >= 10 ? '' : 'Please add a short description (at least 10 characters).'; }
    };
    function validateField(input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var msg = rule(input.value);
      var field = input.closest('.field');
      var err = $('.field-error', field);
      field.classList.toggle('has-error', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    }
    $$('input, select, textarea', form).forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value) validateField(input); });
      input.addEventListener('input', function () { if (input.closest('.field').classList.contains('has-error')) validateField(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('input, select, textarea', form);
      var firstInvalid = null;
      fields.forEach(function (f) { if (!validateField(f) && !firstInvalid) firstInvalid = f; });
      if (firstInvalid) { firstInvalid.focus(); return; }

      var bot = form.querySelector('[name="botcheck"]');
      if (bot && bot.checked) return; // spam bot filled the hidden field
      var d = {};
      fields.forEach(function (f) { if (f.name !== 'botcheck') d[f.name] = f.value.trim(); });
      var lines = [
        'Hi Prakash,',
        '',
        d.message,
        '',
        '— Project type: ' + d.type,
        '— Budget: ' + (d.budget || 'Not specified'),
        '— Name: ' + d.name,
        '— Email: ' + d.email
      ];
      var body = lines.join('\n');

      if (submitter === 'whatsapp') {
        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
        status.innerHTML = 'WhatsApp opened in a new tab with your message. Prefer email? Write to <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>.';
      } else if (WEB3FORMS_KEY) {
        // Direct delivery to the inbox via Web3Forms; falls back to the email app on failure
        var sendBtn = form.querySelector('[data-send="email"]');
        sendBtn.disabled = true;
        sendBtn.setAttribute('aria-busy', 'true');
        status.hidden = false;
        status.textContent = 'Sending…';
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: 'New project inquiry: ' + d.type + ' — ' + d.name,
            from_name: 'Portfolio contact form',
            replyto: d.email,
            name: d.name,
            email: d.email,
            project_type: d.type,
            budget: d.budget || 'Not specified',
            message: d.message
          })
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (!res || !res.success) throw new Error('send failed');
          form.reset();
          status.innerHTML = '<strong>Thank you — your message has been sent.</strong> I\'ll reply to ' + escapeHtml(d.email) + ' soon.';
        }).catch(function () {
          var subject = 'New project: ' + d.type + ' — ' + d.name;
          window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
          status.innerHTML = 'The form couldn\'t send right now, so your email app was opened instead. You can also write to <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>.';
        }).then(function () {
          sendBtn.disabled = false;
          sendBtn.removeAttribute('aria-busy');
        });
        return;
      } else {
        var subject = 'New project: ' + d.type + ' — ' + d.name;
        window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        status.innerHTML = 'Your email app should open with the message ready to send. If nothing happened, email me at <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a> or message me on <a href="https://wa.me/' + WHATSAPP_NUMBER + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>.';
      }
      status.hidden = false;
    });
    var note = $('#formNote');
    if (note && WEB3FORMS_KEY) note.textContent = 'Your message goes straight to my inbox. I usually reply by email.';
  }
})();
