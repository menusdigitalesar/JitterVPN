/* ===== JITTER VPN — main.js ===== */

// ── Cursor glow
const cursorGlow = document.createElement('div');
cursorGlow.className = 'cursor-glow';
document.body.appendChild(cursorGlow);
let cx = 0, cy = 0, gx = 0, gy = 0;
if (matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; });
  (function tick() {
    gx += (cx - gx) * .1; gy += (cy - gy) * .1;
    cursorGlow.style.left = gx + 'px';
    cursorGlow.style.top  = gy + 'px';
    requestAnimationFrame(tick);
  })();
}

// ── Nav scroll effect
const nav = document.getElementById('nav');
const progress = document.getElementById('scrollProgress');
const backTop = document.getElementById('backTop');
const heroSpotlight = document.getElementById('heroSpotlight');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 24);
  const max = document.body.scrollHeight - innerHeight;
  progress.style.width = (scrollY / max * 100) + '%';
  backTop.classList.toggle('show', scrollY > innerHeight * .7);
}, { passive: true });

// ── Back to top
backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Mobile menu
const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
toggle?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  toggle.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}));

// ── Hero spotlight follow
if (matchMedia('(hover: hover)').matches) {
  document.querySelector('.hero')?.addEventListener('pointermove', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
    const sy = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
    heroSpotlight?.style.setProperty('--sx', sx);
    heroSpotlight?.style.setProperty('--sy', sy);
  });
}

// ── Reveal on scroll (IntersectionObserver)
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── Hero title character split
function splitChars(root) {
  root.childNodes.forEach(node => {
    if (node.nodeType === 3) { // text
      const frag = document.createDocumentFragment();
      let i = 0;
      for (const ch of node.textContent) {
        if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); i++; continue; }
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.style.setProperty('--chd', (0.3 + i * 0.03) + 's');
        frag.appendChild(s);
        i++;
      }
      node.replaceWith(frag);
    } else if (node.nodeType === 1 && node.tagName !== 'BR') {
      splitChars(node);
    }
  });
}
const heroTitle = document.getElementById('heroTitle');
if (heroTitle) splitChars(heroTitle);

// ── Number ticker
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
const tickerIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target  = parseFloat(el.dataset.target);
    const suffix  = el.dataset.suffix || '';
    const dec     = parseInt(el.dataset.dec || '0');
    const dur     = 1500;
    const start   = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = (target * easeOut(p)).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    tickerIO.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.ticker').forEach(el => tickerIO.observe(el));

// ── FAQ accordion (single open)
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-item[open]').forEach(other => {
      if (other !== item) other.open = false;
    });
  });
});

// ── Plan card 3D tilt
if (matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.plan-card:not(.plan-soon)').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r  = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * 8;
      const ry = (px - 0.5) * 8;
      card.style.transform = `translateY(-6px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      card.style.transformStyle = 'preserve-3d';
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      card.style.transformStyle = '';
    });
  });
}

// ── Magnetic buttons
if (matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.btn-glow').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top  + r.height / 2);
      btn.style.transform = `translate(${dx * .14}px, ${dy * .2}px) translateY(-2px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1), box-shadow .25s';
      btn.style.transform = '';
      setTimeout(() => { btn.style.transition = ''; }, 500);
    });
  });
}

// ── Canvas particle system (hero)
const canvas = document.getElementById('heroCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  const MAX = 60;
  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function mkParticle() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      r: Math.random() * 1.5 + 0.5,
      vy: -(Math.random() * 0.8 + 0.3),
      vx: (Math.random() - .5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > .5 ? '0,212,255' : '124,58,237',
    };
  }

  let raf;
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (particles.length < MAX && Math.random() < .4) particles.push(mkParticle());
    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.002;
      if (p.alpha <= 0 || p.y < -10) return false;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
      return true;
    });
    raf = requestAnimationFrame(drawParticles);
  }

  // Only run when hero is visible
  const heroSection = document.querySelector('.hero');
  const canvasIO = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { drawParticles(); }
    else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }, { threshold: 0.1 });
  if (heroSection) canvasIO.observe(heroSection);
}

// ── Config binding (update links from config.js)
if (typeof SITE !== 'undefined') {
  const waLinks = document.querySelectorAll('a[href*="wa.me"]');
  waLinks.forEach(a => {
    a.href = `https://wa.me/${SITE.whatsapp}?text=Hola!%20quiero%20contratar%20Jitter%20VPN`;
  });
  const tgLinks = document.querySelectorAll('a[href*="t.me"]');
  tgLinks.forEach(a => {
    a.href = `https://t.me/${SITE.telegram}`;
  });
}
