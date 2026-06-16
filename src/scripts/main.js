import { renderAchievements } from '../components/achievements.js';
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

  initCharts();
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
    { name: 'achievements', target: 'impact-grid', render: renderAchievements },
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

function animateCounter(el, target) {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString() + (target >= 100 ? '+' : '');
  }, 30);
}

// Attaches scroll-reveal and counter observers. Called after the dynamic
// sections are in the DOM so their cards are observed too.
function initObservers() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'));
        animateCounter(entry.target, target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.impact-number').forEach(el => counterObserver.observe(el));
}

let charts = {};
function initCharts() {
  // Chart.js is loaded as an optional, deferred script. If it failed to load
  // (e.g. a flaky mobile connection) the rest of the page still works.
  if (typeof Chart === 'undefined') return;

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDarkMode ? '#F1F5F9' : '#0F172A';
  const gridColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(11,31,58,0.05)';
  const fontFamily = currentLang === 'ar' ? 'IBM Plex Sans Arabic' : 'Inter';

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { labels: { color: textColor, font: { family: fontFamily } } } },
    scales: {
      x: { ticks: { color: textColor, font: { family: fontFamily } }, grid: { color: gridColor } },
      y: { ticks: { color: textColor, font: { family: fontFamily } }, grid: { color: gridColor } }
    }
  };

  if (charts.sales) charts.sales.destroy();
  if (charts.digital) charts.digital.destroy();
  if (charts.growth) charts.growth.destroy();
  if (charts.partners) charts.partners.destroy();

  const salesCtx = document.getElementById('salesChart');
  const digitalCtx = document.getElementById('digitalChart');
  const growthCtx = document.getElementById('growthChart');
  const partnersCtx = document.getElementById('partnersChart');

  if (!salesCtx || !digitalCtx || !growthCtx || !partnersCtx) return;

  charts.sales = new Chart(salesCtx, {
    type: 'bar',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: currentLang === 'ar' ? 'التحقيق %' : 'Achievement %',
        data: [105, 108, 112, 110],
        backgroundColor: ['rgba(11,31,58,0.8)', 'rgba(37,99,235,0.8)', 'rgba(212,175,55,0.8)', 'rgba(22,163,74,0.8)'],
        borderRadius: 8
      }]
    },
    options: commonOptions
  });

  charts.digital = new Chart(digitalCtx, {
    type: 'doughnut',
    data: {
      labels: currentLang === 'ar' ? ['رقمي', 'تقليدي'] : ['Digital', 'Traditional'],
      datasets: [{
        data: [35, 65],
        backgroundColor: ['#2563EB', '#0B1F3A'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: textColor, font: { family: fontFamily } } } }
    }
  });

  charts.growth = new Chart(growthCtx, {
    type: 'line',
    data: {
      labels: ['2019', '2020', '2021', '2022', '2023'],
      datasets: [{
        label: currentLang === 'ar' ? 'العملاء' : 'Customers',
        data: [1200, 1800, 2500, 3800, 5000],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212,175,55,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#D4AF37'
      }]
    },
    options: commonOptions
  });

  charts.partners = new Chart(partnersCtx, {
    type: 'polarArea',
    data: {
      labels: currentLang === 'ar' ? ['نقل', 'دفع', 'تجارة', 'تقنية', 'حكومي'] : ['Transport', 'Payment', 'Commerce', 'Tech', 'Gov'],
      datasets: [{
        data: [5, 4, 3, 2, 1],
        backgroundColor: [
          'rgba(11,31,58,0.7)',
          'rgba(37,99,235,0.7)',
          'rgba(212,175,55,0.7)',
          'rgba(22,163,74,0.7)',
          'rgba(239,68,68,0.7)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: textColor, font: { family: fontFamily } } } },
      scales: { r: { grid: { color: gridColor }, ticks: { color: textColor, backdropColor: 'transparent', font: { family: fontFamily } } } }
    }
  });
}

function initInteractions() {
  document.getElementById('lang-switch').addEventListener('click', switchLanguage);

  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  let isDark = false;
  themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    initCharts();
  });

  const mobileToggle = document.getElementById('mobile-toggle');
  const mainNav = document.getElementById('main-nav');
  mobileToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });

  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (window.scrollY / docHeight) * 100;
    document.getElementById('scroll-progress').style.width = scrollPercent + '%';
  });

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

  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initCharts();
        chartObserver.disconnect();
      }
    });
  }, { threshold: 0.2 });
  const analyticsSection = document.getElementById('analytics');
  if (analyticsSection) chartObserver.observe(analyticsSection);
}

function initHeroParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
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
    requestAnimationFrame(animateParticles);
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
