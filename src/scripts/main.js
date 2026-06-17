import { renderExperience } from '../components/experience.js';
import { renderRoles } from '../components/roles.js';
import { renderArticles } from '../components/articles.js';

let currentLang = 'ar';

function switchLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  const html = document.documentElement;
  const body = document.body;
  const label = document.getElementById('lang-label');

  if (currentLang === 'en') {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
    body.setAttribute('dir', 'ltr');
    label.textContent = 'العربية';
  } else {
    html.setAttribute('lang', 'ar');
    html.setAttribute('dir', 'rtl');
    body.setAttribute('dir', 'rtl');
    label.textContent = 'English';
  }

  document.querySelectorAll('[data-ar][data-en]').forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
    if (el.hasAttribute('placeholder')) {
      el.setAttribute('placeholder', currentLang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en'));
    } else {
      el.textContent = currentLang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
    }
  });

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', currentLang === 'ar'
      ? 'شهاب عبدالرحيم عثمان سيف - قيادي تنفيذي في التسويق وتطوير الأعمال والتحول الرقمي والشراكات الاستراتيجية'
      : 'Shehab Abdulraheem Othman Saif - Executive leader in Marketing, Business Development, Digital Transformation & Strategic Partnerships');
  }

  // Remember the choice so a returning visitor keeps their language.
  try { localStorage.setItem('lang', currentLang); } catch (e) { /* storage unavailable */ }
}

// Fetches a JSON file with a timeout and a few retries, so that a slow or
// momentarily dropped mobile connection doesn't permanently leave a section
// empty. Throws only after every attempt is exhausted.
async function fetchJsonResilient(url, { retries = 2, timeout = 8000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      // Small backoff before retrying, growing with each attempt.
      if (attempt < retries) await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

// Loads the data-driven sections from JSON and renders them. Resolved
// relative to this module so it works regardless of where the page is served.
// Each section loads and renders independently: if one request fails on a
// flaky connection, the others still appear instead of the whole page breaking.
async function loadDynamicSections() {
  const url = (name) => new URL(`../data/${name}.json`, import.meta.url);
  const sections = [
    { name: 'experience', target: 'experience-timeline', render: renderExperience },
    { name: 'roles', target: 'expertise-grid', render: renderRoles },
    { name: 'articles', target: 'insights-grid', render: renderArticles },
  ];

  await Promise.all(sections.map(async ({ name, target, render }) => {
    const el = document.getElementById(target);
    if (!el) return;
    try {
      const data = await fetchJsonResilient(url(name));
      render(data, el);
    } catch (err) {
      console.error(`Failed to load section "${name}"`, err);
      renderSectionFallback(el);
    }
  }));
}

// Shown in place of a section whose data could not be loaded, with a button
// to retry without reloading the whole page.
function renderSectionFallback(el) {
  const msg = currentLang === 'ar'
    ? 'تعذّر تحميل هذا القسم. تحقق من اتصالك وحاول مرة أخرى.'
    : 'This section could not be loaded. Check your connection and try again.';
  const retry = currentLang === 'ar' ? 'إعادة المحاولة' : 'Retry';
  el.innerHTML = `<div class="section-fallback"><p>${msg}</p><button type="button" class="btn btn-outline" data-retry>${retry}</button></div>`;
  el.querySelector('[data-retry]').addEventListener('click', () => {
    loadDynamicSections().then(initObservers);
  });
}

// Attaches scroll-reveal observers. Called after the dynamic sections are in
// the DOM so their cards are observed too. Cards revealing together are given
// a small incremental delay so they cascade in rather than snapping at once.
function initObservers() {
  const observer = new IntersectionObserver((entries) => {
    const arriving = entries.filter(e => e.isIntersecting);
    arriving.forEach((entry, i) => {
      entry.target.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 90}ms`);
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
}

function initInteractions() {
  document.getElementById('lang-switch').addEventListener('click', switchLanguage);

  // Restore a previously chosen language (default stays Arabic).
  try {
    if (localStorage.getItem('lang') === 'en') switchLanguage();
  } catch (e) { /* storage unavailable */ }

  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  // The inline head script may have already set a theme (saved or system
  // preference) before paint, so start from the live attribute.
  let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', isDark ? '#060B17' : '#0B1F3A');
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) { /* storage unavailable */ }
  });

  const mobileToggle = document.getElementById('mobile-toggle');
  const mainNav = document.getElementById('main-nav');
  mobileToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });

  const header = document.getElementById('header');
  const toTop = document.getElementById('to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (window.scrollY / docHeight) * 100;
    document.getElementById('scroll-progress').style.width = scrollPercent + '%';

    if (toTop) toTop.classList.toggle('show', window.scrollY > 600);
  });

  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        mainNav.classList.remove('open');
      }
    });
  });

  initHeroParticles();
  initContactForm();
}

function initHeroParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  // Honor the user's reduced-motion preference: draw a single static frame
  // instead of running the continuous animation loop.
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size = Math.random() * 2 + 1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212,175,55,0.5)';
      ctx.fill();
    }
  }

  for (let i = 0; i < 60; i++) particles.push(new Particle());

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(37,99,235,${0.15 * (1 - dist / 150)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    if (!reduceMotion) requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;
  const formStatus = document.getElementById('form-status');
  const messages = {
    success: { ar: 'تم إرسال رسالتك بنجاح. سأعاود التواصل معك قريبًا.', en: 'Your message has been sent successfully. I will get back to you soon.' },
    error: { ar: 'تعذّر إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقًا.', en: 'Could not send your message. Please try again later.' }
  };

  function showFormStatus(type) {
    formStatus.textContent = messages[type][currentLang];
    formStatus.className = 'form-status show ' + type;
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(contactForm)).toString(),
      });
      if (!response.ok) throw new Error('Submission failed');
      showFormStatus('success');
      contactForm.reset();
    } catch (err) {
      showFormStatus('error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function boot() {
  try {
    await loadDynamicSections();
  } catch (err) {
    console.error('Failed to load dynamic sections', err);
  }
  initObservers();
  initInteractions();
}

boot();
