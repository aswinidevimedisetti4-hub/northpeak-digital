// =========================================================
// Critical path: runs immediately — nav toggle + form
// validation are needed the moment a user can interact.
// =========================================================

function initNav() {
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  if (!navToggle || !navList) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navList.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  if (!form || !statusEl) return;

  const validators = {
    name: (v) => v.trim().length >= 2 ? '' : 'Enter your name (2+ characters).',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    budget: (v) => v ? '' : 'Select a budget range.',
    message: (v) => v.trim().length >= 10 ? '' : 'Tell us a bit more (10+ characters).'
  };

  function showFieldError(fieldName, message) {
    const input = form.elements[fieldName];
    const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
    const wrapper = input.closest('.field');
    if (errorEl) errorEl.textContent = message;
    if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
  }

  function validateField(fieldName) {
    const input = form.elements[fieldName];
    const message = validators[fieldName](input.value);
    showFieldError(fieldName, message);
    return message === '';
  }

  Object.keys(validators).forEach(fieldName => {
    const input = form.elements[fieldName];
    input.addEventListener('blur', () => validateField(fieldName));
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('has-error')) {
        validateField(fieldName);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    const results = Object.keys(validators).map(validateField);
    const allValid = results.every(Boolean);

    if (!allValid) {
      e.preventDefault();
      statusEl.textContent = 'Please fix the highlighted fields above.';
      statusEl.className = 'form-status error';
      return;
    }

    // If deployed on Netlify with data-netlify="true", let the native POST submit
    // (Netlify handles server-side validation/storage). This intercepts only to
    // show a friendly inline confirmation without a full page reload.
    if (form.hasAttribute('data-netlify')) {
      e.preventDefault();
      statusEl.textContent = 'Sending...';
      statusEl.className = 'form-status';

      try {
        const formData = new FormData(form);
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString()
        });

        if (response.ok) {
          statusEl.textContent = "Thanks — we'll be in touch within one business day.";
          statusEl.className = 'form-status success';
          form.reset();
        } else {
          throw new Error('Network response was not OK');
        }
      } catch (err) {
        statusEl.textContent = 'Something went wrong. Please email us directly.';
        statusEl.className = 'form-status error';
      }
    }
  });
}

// =========================================================
// Decorative enhancements: scroll-reveal + parallax add
// nothing functionally required, so they're deferred to
// idle time instead of competing with the critical path
// for main-thread time during load.
// =========================================================

function initScrollReveal() {
  const revealTargets = document.querySelectorAll('.service-card');
  if (!revealTargets.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in-view'));
  }
}

function initParallax() {
  const contourField = document.getElementById('contourField');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!contourField || prefersReducedMotion) return;

  // rAF-throttled: at most one style write per animation frame,
  // instead of one per scroll event (which can fire dozens of times/frame).
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const offset = window.scrollY * 0.08;
      contourField.style.transform = `translateY(${offset}px)`;
      ticking = false;
    });
  }, { passive: true });
}

function initEnhancements() {
  initScrollReveal();
  initParallax();
}

// ===== Boot =====
initNav();
initContactForm();

if ('requestIdleCallback' in window) {
  requestIdleCallback(initEnhancements, { timeout: 2000 });
} else {
  setTimeout(initEnhancements, 200);
}
