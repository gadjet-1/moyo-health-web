/**
 * MOYO — Healthcare for Everyone
 * Main JavaScript Module
 * Production-ready, accessible, performant
 */

(function () {
  'use strict';

  /* ================================================
     UTILITY FUNCTIONS
     ================================================ */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);

  /* ================================================
     NAVIGATION
     ================================================ */

  const initNav = () => {
    const nav = $('#nav');
    const hamburger = $('#hamburger');
    const mobileMenu = $('#mobile-menu');
    const mobileLinks = $$('.nav__mobile-link');

    if (!nav) return;

    // Scroll state
    const onScroll = () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 20);
    };
    on(window, 'scroll', onScroll, { passive: true });
    onScroll();

    // Hamburger toggle
    const closeMobile = () => {
      hamburger?.classList.remove('open');
      mobileMenu?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    const openMobile = () => {
      hamburger?.classList.add('open');
      mobileMenu?.classList.add('open');
      hamburger?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      mobileMenu?.querySelector('a')?.focus();
    };

    on(hamburger, 'click', () => {
      const isOpen = mobileMenu?.classList.contains('open');
      isOpen ? closeMobile() : openMobile();
    });

    // Close on mobile link click
    mobileLinks.forEach(link => on(link, 'click', closeMobile));

    // Close on outside click
    on(document, 'click', (e) => {
      if (mobileMenu?.classList.contains('open') &&
          !nav.contains(e.target)) {
        closeMobile();
      }
    });

    // Close on Escape
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu?.classList.contains('open')) {
        closeMobile();
        hamburger?.focus();
      }
    });

    // Smooth scroll for all anchor links
    on(document, 'click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const target = $(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMobile();
      const navHeight = nav.getBoundingClientRect().height;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
      // Update focus for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  };

  /* ================================================
     SCROLL REVEAL
     ================================================ */

  const initScrollReveal = () => {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach((el, i) => {
      // Stagger children in same container
      el.style.transitionDelay = `${(i % 4) * 0.08}s`;
      observer.observe(el);
    });
  };

  /* ================================================
     COUNTER ANIMATION
     ================================================ */

  const animateCount = (el, target, duration = 2000) => {
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const start = performance.now();
    const isDecimal = String(target).includes('.');

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      if (target >= 10000) {
        el.textContent = prefix + Math.round(current).toLocaleString() + suffix;
      } else if (isDecimal) {
        el.textContent = prefix + current.toFixed(1) + suffix;
      } else {
        el.textContent = prefix + Math.round(current) + suffix;
      }

      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + (target >= 10000 ? target.toLocaleString() : target) + suffix;
    };

    requestAnimationFrame(step);
  };

  const initCounters = () => {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.dataset.count);
            animateCount(el, target);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => observer.observe(el));
  };

  /* ================================================
     APP SHOWCASE TABS
     ================================================ */

  const initShowcaseTabs = () => {
    const tabs = $$('.showcase__tab');
    const panels = $$('.showcase__panel');

    if (!tabs.length) return;

    const activate = (tab) => {
      const target = tab.dataset.tab;

      // Update tabs
      tabs.forEach(t => {
        t.classList.toggle('showcase__tab--active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      // Update panels
      panels.forEach(panel => {
        const isTarget = panel.id === `tab-${target}`;
        panel.classList.toggle('showcase__panel--hidden', !isTarget);
      });
    };

    tabs.forEach(tab => {
      on(tab, 'click', () => activate(tab));

      // Keyboard navigation
      on(tab, 'keydown', (e) => {
        const idx = tabs.indexOf(tab);
        let next = -1;
        if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
        if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
        if (next >= 0) {
          tabs[next].focus();
          activate(tabs[next]);
          e.preventDefault();
        }
      });
    });
  };

  /* ================================================
     WAITLIST FORM
     ================================================ */

  const initWaitlistForm = () => {
    const form = $('#waitlist-form');
    const successPanel = $('#wl-success');
    if (!form) return;

    const fields = {
      name: {
        el: $('#wl-name'),
        err: $('#wl-name-err'),
        validate: v => v.trim().length >= 2 ? '' : 'Please enter your full name.'
      },
      email: {
        el: $('#wl-email'),
        err: $('#wl-email-err'),
        validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.'
      },
      phone: {
        el: $('#wl-phone'),
        err: $('#wl-phone-err'),
        validate: v => v.trim().replace(/\s/g, '').length >= 8 ? '' : 'Please enter a valid phone number.'
      }
    };

    // Real-time validation on blur
    Object.values(fields).forEach(({ el, err, validate }) => {
      if (!el) return;
      on(el, 'blur', () => {
        const msg = validate(el.value);
        err.textContent = msg;
        el.classList.toggle('error', !!msg);
        el.setAttribute('aria-invalid', !!msg);
      });
      on(el, 'input', () => {
        if (el.classList.contains('error')) {
          const msg = validate(el.value);
          if (!msg) {
            err.textContent = '';
            el.classList.remove('error');
            el.setAttribute('aria-invalid', 'false');
          }
        }
      });
    });

    on(form, 'submit', async (e) => {
      e.preventDefault();

      // Validate all
      let valid = true;
      Object.values(fields).forEach(({ el, err, validate }) => {
        if (!el) return;
        const msg = validate(el.value);
        err.textContent = msg;
        el.classList.toggle('error', !!msg);
        el.setAttribute('aria-invalid', !!msg);
        if (msg) { valid = false; }
      });

      if (!valid) {
        // Focus first error
        const firstErr = Object.values(fields).find(f => f.el?.classList.contains('error'));
        firstErr?.el?.focus();
        return;
      }

      // Show loading state
      const btn = $('#wl-submit');
      const btnText = btn?.querySelector('.btn-text');
      const spinner = btn?.querySelector('.btn-spinner');

      if (btn) {
        btn.disabled = true;
        if (btnText) btnText.textContent = 'Joining…';
        if (spinner) spinner.hidden = false;
      }

      // Simulate API call (replace with real endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Show success
      form.hidden = true;
      if (successPanel) {
        successPanel.hidden = false;
        successPanel.focus();
      }
    });
  };

  /* ================================================
     HERO PHONE ANIMATION ENHANCEMENT
     ================================================ */

  const initHeroAnimations = () => {
    // Animate bar fill on load
    const bar = $('.phone-ui__bar-fill');
    if (bar) {
      bar.style.width = '0%';
      requestAnimationFrame(() => {
        setTimeout(() => { bar.style.width = '84%'; }, 800);
      });
    }
  };

  /* ================================================
     ECOSYSTEM DIAGRAM — connecting lines
     ================================================ */

  const initEcosystem = () => {
    // Animate nodes on scroll into view
    const nodes = $$('.eco__node-icon');
    nodes.forEach((node, i) => {
      node.style.animationDelay = `${i * 0.1}s`;
    });
  };

  /* ================================================
     PERFORMANCE: Lazy load images
     ================================================ */

  const initLazyImages = () => {
    const imgs = $$('img[loading="lazy"]');
    if ('loading' in HTMLImageElement.prototype) return; // native support

    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ isIntersecting, target }) => {
        if (isIntersecting && target.dataset.src) {
          target.src = target.dataset.src;
          observer.unobserve(target);
        }
      });
    });
    imgs.forEach(img => observer.observe(img));
  };

  /* ================================================
     KEYBOARD FOCUS VISIBLE
     ================================================ */

  const initFocusVisible = () => {
    document.body.classList.add('js-focus-ring-hidden');
    on(document, 'keydown', () => document.body.classList.remove('js-focus-ring-hidden'));
    on(document, 'mousedown', () => document.body.classList.add('js-focus-ring-hidden'));
  };

  /* ================================================
     ACTIVE NAV LINK ON SCROLL
     ================================================ */

  const initActiveNav = () => {
    const sections = $$('section[id], main > section');
    const navLinks = $$('.nav__link');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(link => {
              const href = link.getAttribute('href');
              link.classList.toggle('nav__link--active', href === `#${id}`);
            });
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    sections.forEach(s => observer.observe(s));
  };

  /* ================================================
     SCROLL PROGRESS (subtle top bar)
     ================================================ */

  const initScrollProgress = () => {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: fixed; top: 0; left: 0; z-index: 2000;
      height: 2px; width: 0%; 
      background: linear-gradient(to right, #00796B, #29B6F6);
      transition: width 0.1s linear;
      pointer-events: none;
    `;
    document.body.prepend(bar);

    on(window, 'scroll', () => {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      bar.style.width = `${(scrolled / total) * 100}%`;
    }, { passive: true });
  };

  /* ================================================
     IMPACT CARD PARALLAX (subtle)
     ================================================ */

  const initSubtleParallax = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 900) return;

    const cards = $$('.impact__card, .float-card');

    on(window, 'mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      cards.forEach((card, i) => {
        const depth = (i % 3 + 1) * 2;
        card.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
      });
    }, { passive: true });
  };

  /* ================================================
     STATS: format large numbers with + suffix
     ================================================ */

  const formatStatSuffix = () => {
    const statNums = $$('.stat__num[data-count]');
    statNums.forEach(el => {
      const count = parseInt(el.dataset.count, 10);
      if (count >= 1000) {
        el.dataset.suffix = '+';
      }
    });
  };

  /* ================================================
     INIT
     ================================================ */

  const init = () => {
    initNav();
    initScrollReveal();
    initCounters();
    initShowcaseTabs();
    initWaitlistForm();
    initHeroAnimations();
    initEcosystem();
    initLazyImages();
    initFocusVisible();
    initActiveNav();
    initScrollProgress();
    formatStatSuffix();

    // Parallax only on desktop, not touch
    if (!window.matchMedia('(hover: none)').matches) {
      initSubtleParallax();
    }

    // Set current year in footer if present
    const yearEl = $('.footer__year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  };

  // Bootstrap
  if (document.readyState === 'loading') {
    on(document, 'DOMContentLoaded', init);
  } else {
    init();
  }

})();

const demoBtn = document.getElementById("demoBtn");
const demoModal = document.getElementById("demoModal");
const closeDemo = document.getElementById("closeDemo");
const demoForm = document.getElementById("demoForm");
const demoSuccess = document.getElementById("demoSuccess");

demoBtn.addEventListener("click", () => {
  demoModal.classList.add("active");
});

closeDemo.addEventListener("click", () => {
  demoModal.classList.remove("active");
});

demoModal.addEventListener("click", (e) => {
  if(e.target.classList.contains("demo-modal__backdrop")){
    demoModal.classList.remove("active");
  }
});

demoForm.addEventListener("submit", (e) => {
  e.preventDefault();

  demoModal.classList.remove("active");
  demoSuccess.classList.add("active");

  setTimeout(() => {
    demoSuccess.classList.remove("active");
    demoForm.reset();
  }, 4000);
});
