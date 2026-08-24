// src/scripts/main.js
// Small progressive-enhancement layer: mobile nav, header shrink, scroll reveals.

// Mark JS as available — scroll-reveal hiding is gated on this class so
// content is always visible without JS.
document.documentElement.classList.add('js');

// Mobile navigation
const toggle = document.getElementById('mobile-menu-toggle');
const nav = document.getElementById('site-nav');
const overlay = document.getElementById('nav-overlay');

function setNav(open) {
  toggle?.classList.toggle('active', open);
  nav?.classList.toggle('active', open);
  overlay?.classList.toggle('active', open);
  toggle?.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}

toggle?.addEventListener('click', () => setNav(!nav.classList.contains('active')));
overlay?.addEventListener('click', () => setNav(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setNav(false);
});

// Header shrink on scroll
const header = document.getElementById('site-header');
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      header?.classList.toggle('scrolled', window.scrollY > 40);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// Scroll-reveal animations (respects prefers-reduced-motion via CSS)
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));

// --- Vehicle photo gallery -------------------------------------------------
// Swaps the lead image when a thumbnail is chosen. Progressive enhancement:
// with JS off, every photo is still in the DOM and reachable.
(function initGallery() {
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;

  const main = gallery.querySelector('[data-gallery-main]');
  const thumbs = [...gallery.querySelectorAll('.gallery-thumb')];
  if (!main || thumbs.length < 2) return;

  const show = (thumb) => {
    main.src = thumb.dataset.src;
    thumbs.forEach((t) => {
      const active = t === thumb;
      t.classList.toggle('is-active', active);
      if (active) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
  };

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => show(thumb));
    thumb.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = thumbs[(i + (e.key === 'ArrowRight' ? 1 : -1) + thumbs.length) % thumbs.length];
      next.focus();
      show(next);
    });
  });
})();
