/**
 * Bhatu Prakash Portfolio - Responsive Navigation & Touch Interactions
 * Handles mobile hamburger drawer, touch gestures, smooth anchor scrolling, and responsive UX.
 */

(function () {
  'use strict';

  function initMobileNav() {
    const toggleBtn = document.getElementById('mobileNavToggle');
    const drawer = document.getElementById('mobileNavDrawer');
    const closeBtn = document.getElementById('mobileNavClose');
    const backdrop = drawer ? drawer.querySelector('.mobile-nav-backdrop') : null;
    const navLinks = drawer ? drawer.querySelectorAll('.mobile-nav-item') : [];

    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      toggleBtn.classList.add('is-active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      toggleBtn.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (drawer.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeDrawer();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeDrawer);
    }

    // Close on navigation item click + smooth scroll
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        closeDrawer();

        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetEl = document.querySelector(href);
          if (targetEl) {
            setTimeout(function () {
              if (window.lenis) {
                window.lenis.scrollTo(targetEl, { offset: href === '#home' ? 0 : -60, duration: 1 });
              } else {
                targetEl.scrollIntoView({ behavior: 'smooth' });
              }
            }, 300);
          }
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    // Touch swipe right to dismiss drawer on mobile panel
    const panel = drawer.querySelector('.mobile-nav-panel');
    if (panel) {
      let touchStartX = 0;
      let touchCurrentX = 0;

      panel.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      panel.addEventListener('touchmove', function (e) {
        touchCurrentX = e.touches[0].clientX;
      }, { passive: true });

      panel.addEventListener('touchend', function () {
        if (touchCurrentX > touchStartX + 60) {
          closeDrawer();
        }
      });
    }
  }

  // Touch swipe support for horizontal project card slider on tablets/mobiles
  function initProjectTrackTouch() {
    const pcTrack = document.getElementById('pcTrack');
    const pcArrowPrev = document.getElementById('pcArrowPrev');
    const pcArrowNext = document.getElementById('pcArrowNext');

    if (!pcTrack || !pcArrowPrev || !pcArrowNext) return;

    let startX = 0;
    let endX = 0;

    pcTrack.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });

    pcTrack.addEventListener('touchend', function (e) {
      endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          // Swiped left -> Next project
          pcArrowNext.click();
        } else {
          // Swiped right -> Previous project
          pcArrowPrev.click();
        }
      }
    }, { passive: true });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initMobileNav();
      initProjectTrackTouch();
    });
  } else {
    initMobileNav();
    initProjectTrackTouch();
  }
})();
