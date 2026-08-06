/* ==========================================================================
   PORTFOLIO SCRIPT - Modern Vanilla JS (ES Modules Pattern)
   นายวิชญ์ภาส อิ้มคำ | วิศวกรรมไฟฟ้า js
   Enhanced: Theme Toggle, 3D Cards, Radial Skills, Micro-interactions
   ========================================================================== */
 //จงผ่านสาธุ 99+ 99+ 999+ 9999+ 99999+ 999999+ 9999999+ 99999999+ 999999999+
(() => {
  'use strict';

  /* ===== CONFIG ===== */
  const CONFIG = {
    navHeight: 72,
    scrollOffset: 80,
    revealThreshold: 0.12,
    revealRootMargin: '0px 0px -50px 0px',
    progressBarHeight: 3,
    backToTopThreshold: 300,
    toastDuration: 3500,
    lightboxTransition: 200,
    staggerDelay: 80,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Theme
    themeStorageKey: 'portfolio-theme',
    // 3D Tilt
    tiltMax: 8,
    tiltPerspective: 1000,
    tiltScale: 1.02,
    // Particles
    particleCount: 60,
    particleMaxDist: 120,
  };

  /* ===== STATE ===== */
  const state = {
    currentSection: 'cover',
    lightboxIndex: 0,
    lightboxImages: [],
    isScrolling: false,
    ticking: false,
    currentTheme: 'system',
    // Tilt
    tiltElements: [],
    // Particles
    particles: [],
    animationId: null,
  };

  /* ===== DOM CACHE ===== */
  const els = {};

  function cacheElements() {
    els.navbar = document.getElementById('navbar');
    els.navToggle = document.getElementById('navToggle');
    els.navMenu = document.getElementById('navMenu');
    els.navLinks = document.querySelectorAll('.nav-link');
    els.progressBar = document.getElementById('progressBar');
    els.backToTop = document.getElementById('backToTop');
    els.toast = document.getElementById('toast');
    els.toastMessage = document.getElementById('toastMessage');
    els.lightbox = document.getElementById('lightbox');
    els.lightboxImage = document.getElementById('lightboxImage');
    els.lightboxCaption = document.getElementById('lightboxCaption');
    els.lightboxCounter = document.getElementById('lightboxCounter');
    els.lightboxClose = document.getElementById('lightboxClose');
    els.lightboxPrev = document.getElementById('lightboxPrev');
    els.lightboxNext = document.getElementById('lightboxNext');
    els.tabButtons = document.querySelectorAll('.tab-btn');
    els.tabPanels = document.querySelectorAll('.tab-panel');
    els.certificateCards = document.querySelectorAll('.certificate-card');
    els.contactForm = document.getElementById('contactForm');
    els.downloadCV = document.getElementById('downloadCV');
    els.sections = document.querySelectorAll('section[id]');
    els.revealElements = document.querySelectorAll('.reveal');
    els.scrollIndicator = document.querySelector('.scroll-indicator');
    els.skillFills = document.querySelectorAll('.skill-fill');
    els.markerDots = document.querySelectorAll('.marker-dot');
    // New elements
    els.themeToggle = document.getElementById('themeToggle');
    els.coverOrbs = document.querySelector('.cover-orbs');
    els.coverGrid = document.querySelector('.cover-grid');
    els.coverFloating = document.querySelector('.cover-floating');
    els.floatingItems = document.querySelectorAll('.floating-item');
    els.coverTagline = document.querySelector('.cover-tagline');
    els.coverCta = document.querySelector('.cover-cta');
    els.profilePhoto = document.querySelector('.profile-photo');
    els.prefaceImg = document.querySelector('.preface-img');
    els.certImages = document.querySelectorAll('.cert-image');
    els.projectCards = document.querySelectorAll('.project-card');
    els.detailCards = document.querySelectorAll('.detail-card');
    els.skillsRadar = document.querySelector('.skills-radar');
    els.skillsSummary = document.querySelector('.skills-summary');
    els.btns = document.querySelectorAll('.btn');
  }

  /* ===== UTILITIES ===== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  };

  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
  const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  function animateValue(el, start, end, duration, formatter = v => v) {
    if (CONFIG.reducedMotion) {
      el.textContent = formatter(end);
      return;
    }
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeOutQuart(progress);
      el.textContent = formatter(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function getScrollPercent() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? scrollTop / docHeight : 0;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  /* ===== THEME SYSTEM ===== */
  function initTheme() {
    const saved = localStorage.getItem(CONFIG.themeStorageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (state.currentTheme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  function applyTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(CONFIG.themeStorageKey, theme);
    updateThemeToggleUI();
    // Update meta theme-color
    updateMetaThemeColor();
  }

  function updateThemeToggleUI() {
    if (!els.themeToggle) return;
    els.themeToggle.setAttribute('data-theme', state.currentTheme);
    els.themeToggle.setAttribute('aria-label', `Current theme: ${state.currentTheme}. Click to cycle.`);
  }

  function cycleTheme() {
    const themes = ['system', 'dark', 'light'];
    const currentIndex = themes.indexOf(state.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    applyTheme(themes[nextIndex]);
    showToast(`Theme: ${themes[nextIndex]}`, 'info');
  }

  function updateMetaThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const isDark = state.currentTheme === 'dark' || (state.currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      meta.content = isDark ? '#0a0f14' : '#f5f7fa';
    }
  }

  function initThemeToggle() {
    if (!els.themeToggle) return;
    els.themeToggle.addEventListener('click', cycleTheme);
    els.themeToggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cycleTheme();
      }
    });
  }

  /* ===== PROGRESS BAR ===== */
  function updateProgressBar() {
    const percent = getScrollPercent() * 100;
    els.progressBar.style.transform = `scaleX(${percent / 100})`;
    els.progressBar.setAttribute('aria-valuenow', Math.round(percent));
  }

  /* ===== NAVBAR ===== */
  function handleNavbarScroll() {
    const scrolled = window.scrollY > 20;
    els.navbar.classList.toggle('scrolled', scrolled);
  }

  function handleNavToggle() {
    const expanded = els.navToggle.getAttribute('aria-expanded') === 'true';
    els.navToggle.setAttribute('aria-expanded', !expanded);
    els.navMenu.classList.toggle('open');
    document.body.style.overflow = expanded ? '' : 'hidden';
  }

  function closeNavMenu() {
    els.navToggle.setAttribute('aria-expanded', 'false');
    els.navMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  function handleNavLinkClick(e) {
    const href = e.currentTarget.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        smoothScrollTo(target);
        closeNavMenu();
        updateActiveNavLink(href.slice(1));
      }
    }
  }

  function updateActiveNavLink(sectionId) {
    els.navLinks.forEach(link => {
      const isActive = link.getAttribute('data-section') === sectionId;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  /* ===== SMOOTH SCROLL ===== */
  function smoothScrollTo(target, offset = CONFIG.scrollOffset) {
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = Math.min(Math.max(Math.abs(distance) / 2, 400), 1000);
    const startTime = performance.now();

    if (CONFIG.reducedMotion) {
      window.scrollTo(0, targetPosition);
      return;
    }

    function animateScroll(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      window.scrollTo(0, startPosition + distance * eased);
      if (progress < 1) requestAnimationFrame(animateScroll);
    }
    requestAnimationFrame(animateScroll);
  }

  /* ===== INTERSECTION OBSERVERS ===== */
  function initSectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          state.currentSection = id;
          updateActiveNavLink(id);
          updateScrollIndicator(id);
        }
      });
    }, {
      rootMargin: `-${CONFIG.navHeight}px 0px -60% 0px`,
      threshold: 0.15
    });

    els.sections.forEach(section => observer.observe(section));
  }

  function updateScrollIndicator(currentSection) {
    if (els.scrollIndicator) {
      els.scrollIndicator.style.opacity = currentSection === 'cover' ? '1' : '0';
      els.scrollIndicator.style.pointerEvents = currentSection === 'cover' ? 'auto' : 'none';
    }
  }

  function initRevealObserver() {
    if (CONFIG.reducedMotion) {
      els.revealElements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * CONFIG.staggerDelay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: CONFIG.revealRootMargin,
      threshold: CONFIG.revealThreshold
    });

    els.revealElements.forEach(el => observer.observe(el));
  }

  function initSectionHeaderObserver() {
    const headers = document.querySelectorAll('.section-header');
    if (CONFIG.reducedMotion) {
      headers.forEach(h => h.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0.1 });
    headers.forEach(h => observer.observe(h));
  }

  function initSkillBarsObserver() {
    if (CONFIG.reducedMotion) {
      els.skillFills.forEach(fill => {
        fill.style.width = fill.style.width || '0%';
      });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target;
          const targetWidth = fill.style.width || '0%';
          fill.style.width = '0%';
          requestAnimationFrame(() => {
            fill.style.width = targetWidth;
          });
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    els.skillFills.forEach(fill => observer.observe(fill));
  }

  function initTimelineMarkers() {
    if (CONFIG.reducedMotion) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.transform = 'scale(1.3)';
            entry.target.style.boxShadow = '0 0 0 4px var(--bg-primary), var(--shadow-glow-strong)';
            setTimeout(() => {
              entry.target.style.transform = '';
              entry.target.style.boxShadow = '';
            }, 800);
          }, i * 150);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -30% 0px', threshold: 0.3 });
    els.markerDots.forEach(dot => observer.observe(dot));
  }

  /* ===== BACK TO TOP ===== */
  function handleBackToTop() {
    const visible = window.scrollY > CONFIG.backToTopThreshold;
    els.backToTop.classList.toggle('visible', visible);
    els.backToTop.hidden = !visible;
  }

  function scrollToTop() {
    smoothScrollTo(document.body, 0);
  }

  /* ===== TABS ===== */
  function initTabs() {
    els.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        els.tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        els.tabPanels.forEach(p => {
          p.hidden = true;
          p.classList.remove('active');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const panel = document.getElementById(tabId);
        if (panel) {
          panel.hidden = false;
          requestAnimationFrame(() => panel.classList.add('active'));
        }
      });
    });
  }

  /* ===== LIGHTBOX ===== */
  function initLightbox() {
    els.certificateCards.forEach((card, index) => {
      const img = card.querySelector('.cert-image');
      if (img) {
        state.lightboxImages.push({
          src: img.src,
          alt: img.alt,
          caption: card.querySelector('h3')?.textContent || '',
          index
        });
        card.addEventListener('click', () => openLightbox(index));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(index);
          }
        });
      }
    });

    els.lightboxClose.addEventListener('click', closeLightbox);
    els.lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    els.lightboxNext.addEventListener('click', () => navigateLightbox(1));
    els.lightbox.addEventListener('click', (e) => {
      if (e.target === els.lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!els.lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox(index) {
    state.lightboxIndex = index;
    updateLightbox();
    els.lightbox.hidden = false;
    els.lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    els.lightboxClose.focus();
  }

  function closeLightbox() {
    els.lightbox.classList.remove('open');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      if (!els.lightbox.classList.contains('open')) els.lightbox.hidden = true;
    }, CONFIG.lightboxTransition);
  }

  function navigateLightbox(direction) {
    const len = state.lightboxImages.length;
    state.lightboxIndex = (state.lightboxIndex + direction + len) % len;
    updateLightbox();
  }

  function updateLightbox() {
    const item = state.lightboxImages[state.lightboxIndex];
    if (!item) return;
    els.lightboxImage.src = item.src;
    els.lightboxImage.alt = item.alt;
    els.lightboxCaption.textContent = item.caption;
    els.lightboxCounter.textContent = `${state.lightboxIndex + 1} / ${state.lightboxImages.length}`;
  }

  /* ===== CONTACT FORM ===== */
  function initContactForm() {
    if (!els.contactForm) return;
    els.contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(els.contactForm);
      const data = Object.fromEntries(formData);

      if (!data.name || !data.email || !data.subject || !data.message) {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
      }

      const submitBtn = els.contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/></svg> กำลังส่ง...';

      try {
        const mailtoLink = `mailto:wichapsimkham@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`)}`;
        window.location.href = mailtoLink;
        showToast('เปิดโปรแกรมอีเมลเพื่อส่งข้อความ...', 'info');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  /* ===== DOWNLOAD CV ===== */
  function initDownloadCV() {
    if (!els.downloadCV) return;
    els.downloadCV.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof html2pdf !== 'undefined') {
        const element = document.getElementById('main');
        const opt = {
          margin: 0.5,
          filename: 'Portfolio_Witchaphat_Imkam.pdf',
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: 'avoid-all', avoid: ['.section', '.project-card', '.certificate-card'] }
        };
        html2pdf().set(opt).from(element).save();
        showToast('กำลังสร้างไฟล์ PDF...', 'info');
      } else {
        window.print();
        showToast('ใช้ Ctrl+P เพื่อบันทึกเป็น PDF', 'info');
      }
    });
  }

  /* ===== TOAST NOTIFICATIONS ===== */
  function showToast(message, type = 'info') {
    els.toastMessage.textContent = message;
    els.toast.hidden = false;
    els.toast.classList.add('visible');
    els.toast.dataset.type = type;

    clearTimeout(els.toast._timeout);
    els.toast._timeout = setTimeout(() => {
      els.toast.classList.remove('visible');
      window.setTimeout(() => {
        if (!els.toast.classList.contains('visible')) els.toast.hidden = true;
      }, CONFIG.lightboxTransition);
    }, CONFIG.toastDuration);
  }

  /* ===== PARALLAX EFFECTS ===== */
  function initParallax() {
    if (CONFIG.reducedMotion) return;
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    if (!parallaxElements.length) return;

    let ticking = false;
    function updateParallax() {
      const scrollY = window.scrollY;
      parallaxElements.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const y = scrollY * speed;
        el.style.transform = `translate3d(0, ${y}px, 0)`;
      });
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ===== CURSOR GLOW EFFECT ===== */
  function initCursorGlow() {
    if (CONFIG.reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--accent-primary-dim) 0%, transparent 70%);
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      glow.style.opacity = '0.5';
    });

    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });

    function animateGlow() {
      glowX += (mouseX - glowX) * 0.15;
      glowY += (mouseY - glowY) * 0.15;
      glow.style.left = `${glowX}px`;
      glow.style.top = `${glowY}px`;
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  /* ===== TYPING ANIMATION FOR COVER ===== */
  function initTypingAnimation() {
    if (CONFIG.reducedMotion) return;
    const titleEng = document.querySelector('.title-eng');
    const nameEng = document.querySelector('.name-eng');
    if (!titleEng || !nameEng) return;

    const texts = {
      titleEng: 'PORTFOLIO',
      nameEng: 'Witchaphat Imkam'
    };

    function typeWriter(element, text, speed = 100, delay = 0) {
      element.textContent = '';
      element.style.borderRight = '2px solid var(--accent-primary)';
      let i = 0;
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          setTimeout(() => {
            element.style.borderRight = 'none';
          }, 1000);
        }
      }
      setTimeout(type, delay);
    }

    setTimeout(() => typeWriter(titleEng, texts.titleEng, 80, 0), 800);
    setTimeout(() => typeWriter(nameEng, texts.nameEng, 60, 500), 1200);
  }

  /* ===== PARTICLE BACKGROUND (COVER) ===== */
  function initParticles() {
    if (CONFIG.reducedMotion) return;
    const coverBg = document.querySelector('.cover-bg');
    if (!coverBg) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;z-index:-1;opacity:0.4';
    coverBg.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = [
      'oklch(0.65 0.22 180)',   // primary
      'oklch(0.60 0.24 260)',   // secondary
      'oklch(0.62 0.26 295)',   // purple
      'oklch(0.82 0.18 85)'     // warning
    ];

    function resize() {
      canvas.width = coverBg.clientWidth;
      canvas.height = coverBg.clientHeight;
    }
    resize();
    window.addEventListener('resize', debounce(resize, 250));

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONFIG.particleMaxDist) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = 0.08 * (1 - dist / CONFIG.particleMaxDist);
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      state.animationId = requestAnimationFrame(animate);
    }
    animate();
  }

  /* ===== 3D TILT EFFECT FOR CARDS ===== */
  function init3DTilt() {
    if (CONFIG.reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;

    const tiltCards = document.querySelectorAll('.project-card, .detail-card, .certificate-card, .achievement-card, .education-card');
    tiltCards.forEach(card => {
      card.classList.add('tilt-active');
      card.addEventListener('mousemove', handleTilt);
      card.addEventListener('mouseleave', resetTilt);
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease-out';
      });
      state.tiltElements.push(card);
    });
  }

  function handleTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;

    const rotateX = clamp(-deltaY * CONFIG.tiltMax, -CONFIG.tiltMax, CONFIG.tiltMax);
    const rotateY = clamp(deltaX * CONFIG.tiltMax, -CONFIG.tiltMax, CONFIG.tiltMax);

    card.style.transform = `
      perspective(${CONFIG.tiltPerspective}px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale3d(${CONFIG.tiltScale}, ${CONFIG.tiltScale}, ${CONFIG.tiltScale})
    `;

    // Move inner elements for depth
    const innerElements = card.querySelectorAll('.project-icon, h3, .project-desc, .project-skills, .project-tags, .detail-icon, h4, p, .strength-list, .skill-tags, .cert-content, .achievement-header, .achievement-body, .education-icon, .education-info');
    innerElements.forEach(el => {
      el.style.transform = `translateZ(30px) translateX(${-deltaX * 10}px) translateY(${-deltaY * 10}px)`;
    });
  }

  function resetTilt(e) {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease-out';
    card.style.transform = `
      perspective(${CONFIG.tiltPerspective}px)
      rotateX(0deg)
      rotateY(0deg)
      scale3d(1, 1, 1)
    `;
    const innerElements = card.querySelectorAll('[style*="translateZ"]');
    innerElements.forEach(el => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = 'translateZ(20px) translateX(0) translateY(0)';
    });
  }

  /* ===== RADIAL SKILL CHARTS ===== */
  function initRadialSkills() {
    const skillsData = [
      { name: 'Arduino / AVR', percent: 90, color: 'var(--accent-primary)' },
      { name: 'Embedded C / ESP32', percent: 85, color: 'var(--accent-secondary)' },
      { name: 'PLC Programming', percent: 85, color: 'var(--accent-warning)' },
      { name: 'IoT Protocols', percent: 80, color: 'var(--accent-purple)' },
      { name: 'Circuit / PCB Design', percent: 75, color: 'var(--accent-danger)' },
      { name: 'Robotics / Motor Control', percent: 80, color: 'var(--accent-primary)' },
      { name: 'Audio / PA System', percent: 70, color: 'var(--accent-secondary)' },
      { name: 'Python / Data Analysis', percent: 60, color: 'var(--accent-purple)' },
    ];

    // Check if radial charts already exist (SSR fallback)
    if (document.querySelector('.radial-chart')) return;

    // Inject gradient definitions
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.classList.add('radial-gradients');
    defs.style.cssText = 'position:absolute;width:0;height:0;';
    skillsData.forEach((skill, i) => {
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.id = `radial-gradient-${i}`;
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', skill.color);
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim());
      gradient.append(stop1, stop2);
      defs.appendChild(gradient);
    });
    document.body.appendChild(defs);

    // Create radial charts
    if (els.skillsRadar) {
      els.skillsRadar.innerHTML = '';
      skillsData.forEach((skill, i) => {
        const container = document.createElement('div');
        container.className = 'skill-radial reveal';
        container.innerHTML = `
          <div class="radial-chart" data-percent="${skill.percent}" data-gradient="radial-gradient-${i}">
            <svg viewBox="0 0 140 140">
              <defs>
                <linearGradient id="radial-gradient-${i}" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="${skill.color}"></stop>
                  <stop offset="100%" stop-color="${getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim()}"></stop>
                </linearGradient>
              </defs>
              <circle class="radial-bg" cx="70" cy="70" r="66" fill="none" stroke="var(--border-primary)" stroke-width="8"></circle>
              <circle class="radial-progress" cx="70" cy="70" r="66" fill="none" stroke="url(#radial-gradient-${i})" stroke-width="8" stroke-linecap="round" stroke-dasharray="415" stroke-dashoffset="415" style="transition: stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s;"></circle>
            </svg>
            <div class="radial-center">
              <span class="radial-percent">${skill.percent}%</span>
              <span class="radial-label">Proficiency</span>
            </div>
          </div>
          <span class="radial-name">${skill.name}</span>
        `;
        els.skillsRadar.appendChild(container);
      });

      // Animate on scroll
      const radialCharts = document.querySelectorAll('.radial-chart');
      if (CONFIG.reducedMotion) {
        radialCharts.forEach(chart => {
          const percent = parseFloat(chart.dataset.percent);
          const offset = 415 * (1 - percent / 100);
          chart.querySelector('.radial-progress').style.strokeDashoffset = offset;
        });
      } else {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const chart = entry.target;
              const percent = parseFloat(chart.dataset.percent);
              const offset = 415 * (1 - percent / 100);
              chart.querySelector('.radial-progress').style.strokeDashoffset = offset;
              observer.unobserve(chart);
            }
          });
        }, { rootMargin: '0px 0px -20% 0px', threshold: 0.2 });
        radialCharts.forEach(chart => observer.observe(chart));
      }
    }

    // Update reveal observers for new elements
    els.revealElements = document.querySelectorAll('.reveal');
    initRevealObserver();
  }

  /* ===== BUTTON RIPPLE EFFECT ===== */
  function initButtonRipple() {
    if (CONFIG.reducedMotion) return;

    els.btns.forEach(btn => {
      btn.addEventListener('click', createRipple);
    });
  }

  function createRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
    `;

    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  /* ===== IMAGE LOADING SKELETONS ===== */
  function initImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"], .profile-photo, .preface-img, .cert-image');
    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.classList.add('loading');
        img.addEventListener('load', () => {
          img.classList.remove('loading');
          img.classList.add('loaded');
        });
        img.addEventListener('error', () => {
          img.classList.remove('loading');
          img.classList.add('loaded');
        });
      }
    });
  }

  /* ===== SCROLL INDICATOR CLICK ===== */
  function initScrollIndicator() {
    if (els.scrollIndicator) {
      els.scrollIndicator.addEventListener('click', (e) => {
        e.preventDefault();
        const preface = document.getElementById('preface');
        if (preface) smoothScrollTo(preface);
      });
    }
  }

  /* ===== LOAD html2pdf DYNAMICALLY ===== */
  function loadHtml2Pdf() {
    if (typeof html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.integrity = 'sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLB7Qnw==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    }
  }

  /* ===== SMOOTH SCROLL FOR ANCHOR LINKS ===== */
  function initAnchorSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          smoothScrollTo(target);
          closeNavMenu();
          updateActiveNavLink(href.slice(1));
        }
      });
    });
  }

  /* ===== INITIALIZATION ===== */
  function init() {
    cacheElements();

    // Core functionality
    initTheme();
    initSectionObserver();
    initRevealObserver();
    initSectionHeaderObserver();
    initSkillBarsObserver();
    initTimelineMarkers();
    initTabs();
    initLightbox();
    initContactForm();
    initDownloadCV();
    initScrollIndicator();
    initAnchorSmoothScroll();

    // Scroll handlers
    const scrollHandler = throttle(() => {
      updateProgressBar();
      handleNavbarScroll();
      handleBackToTop();
    }, 16);

    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Nav toggle
    els.navToggle?.addEventListener('click', handleNavToggle);
    els.navLinks.forEach(link => link.addEventListener('click', handleNavLinkClick));

    // Back to top
    els.backToTop?.addEventListener('click', scrollToTop);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNavMenu();
    });

    // Enhanced features
    initThemeToggle();
    initTypingAnimation();
    initParticles();
    initCursorGlow();
    initParallax();
    init3DTilt();
    initRadialSkills();
    initButtonRipple();
    initImageLoading();
    loadHtml2Pdf();

    // Initial checks
    updateProgressBar();
    handleNavbarScroll();
    handleBackToTop();

    // Announce ready
    console.log('%c⚡ Portfolio Loaded', 'color: #00d4aa; font-size: 16px; font-weight: bold;');
    console.log('%cWitchaphat Imkam - Electrical Engineering RMUTT', 'color: #888; font-size: 12px;');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.Portfolio = {
    showToast,
    openLightbox,
    smoothScrollTo,
    applyTheme,
    cycleTheme,
    CONFIG,
    state
  };
  
})();
