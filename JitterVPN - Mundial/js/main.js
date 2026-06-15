/* ═══════ JITTER VPN — main.js ═══════ */

// ── Scroll progress + nav
const nav      = document.getElementById('nav');
const progress = document.getElementById('scrollProgress');
const backTop  = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 20);
  progress.style.width = (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
  backTop.classList.toggle('show', scrollY > innerHeight * .6);
}, { passive: true });
backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Mobile menu
const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
toggle?.addEventListener('click', () => {
  const o = links.classList.toggle('open');
  toggle.classList.toggle('open', o);
  toggle.setAttribute('aria-expanded', o);
  document.body.style.overflow = o ? 'hidden' : '';
});
links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open'); toggle.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
}));

// ── Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── Hero title character split (first line only, not the cycling span)
(function splitHeroTitle() {
  const title = document.querySelector('.hero-title');
  if (!title) return;
  title.childNodes.forEach(node => {
    if (node.nodeType !== 3) return;
    const frag = document.createDocumentFragment();
    let i = 0;
    for (const ch of node.textContent) {
      if (ch === ' ' || ch === '\n') { frag.appendChild(document.createTextNode(ch === '\n' ? '' : ' ')); i++; continue; }
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = ch;
      s.style.setProperty('--chd', (.2 + i * .03) + 's');
      frag.appendChild(s); i++;
    }
    node.replaceWith(frag);
  });
})();

// ── Cycling hero subtitle (blur-number inspired)
const cycleWords = ['velocidad real.', 'estabilidad total.', 'sin límites.', 'privacidad real.', 'ritmo de campeón. 🏆', 'velocidad mundialista. 🇦🇷'];
let cycleIdx = 0;
const cycleEl = document.getElementById('titleCycle');
if (cycleEl) {
  setInterval(() => {
    cycleEl.classList.add('cycle-out');
    setTimeout(() => {
      cycleIdx = (cycleIdx + 1) % cycleWords.length;
      cycleEl.textContent = cycleWords[cycleIdx];
      cycleEl.classList.remove('cycle-out');
      cycleEl.style.animation = 'none';
      cycleEl.offsetWidth; // reflow
      cycleEl.style.animation = '';
    }, 380);
  }, 3200);
}

// ── Blur-number ticker for stats (AnimateNumber port)
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
const tickIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el  = e.target;
    const tgt = parseFloat(el.dataset.target);
    const sfx = el.dataset.suffix || '';
    const dec = parseInt(el.dataset.dec || '0');
    const dur = 1600; const t0 = performance.now();
    el.classList.add('an-tick');

    // digit-by-digit blur effect (simplified)
    function step(now) {
      const p   = Math.min((now - t0) / dur, 1);
      const val = (tgt * easeOut(p)).toFixed(dec) + sfx;
      el.textContent = val;
      if (p < 1) requestAnimationFrame(step);
      else el.classList.remove('an-tick');
    }
    requestAnimationFrame(step);
    tickIO.unobserve(el);
  });
}, { threshold: .5 });
document.querySelectorAll('.an-num').forEach(el => tickIO.observe(el));

// ── Terminal speed bar animation
(function animSpeedBar() {
  const bar = document.getElementById('termSpeedBar');
  const val = document.getElementById('termSpeedVal');
  if (!bar || !val) return;
  let current = 0; const target = 22;
  const heroEl = document.querySelector('.hero');
  let started = false;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || started) return;
    started = true;
    setTimeout(() => {
      const dur = 2200; const t0 = performance.now();
      function step(now) {
        const p = Math.min((now - t0) / dur, 1);
        current = target * easeOut(p);
        bar.style.width = (current / target * 100) + '%';
        val.textContent = current.toFixed(1) + ' Mbps';
        if (p < 1) requestAnimationFrame(step);
        else val.textContent = target + ' Mbps';
      }
      requestAnimationFrame(step);
    }, 2600); // after terminal lines appear
  }, { threshold: .3 }).observe(heroEl);
})();

// ── Canvas particle background (hero)
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], raf;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function mkP() {
    return {
      x: Math.random() * W, y: H + 5,
      r: Math.random() * 1.2 + .3,
      vy: -(Math.random() * .7 + .2),
      vx: (Math.random() - .5) * .3,
      a: Math.random() * .45 + .1,
      col: Math.random() > .6 ? '0,212,255' : Math.random() > .5 ? '124,58,237' : '245,158,11'
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (particles.length < 55 && Math.random() < .4) particles.push(mkP());
    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.a -= .0018;
      if (p.a <= 0 || p.y < -8) return false;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.col},${p.a})`;
      ctx.fill();
      return true;
    });
    raf = requestAnimationFrame(draw);
  }

  const heroEl = document.querySelector('.hero');
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) draw();
    else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); }
  }, { threshold: .05 }).observe(heroEl);
})();

// ── FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-item[open]').forEach(o => { if (o !== item) o.open = false; });
  });
});

// ──────────────────────────────────────────
// ── PAYMENT MODAL
// ──────────────────────────────────────────
const overlay   = document.getElementById('pmOverlay');
const backdrop  = document.getElementById('pmBackdrop');
const pmClose   = document.getElementById('pmClose');
const pmTotal   = document.getElementById('pmTotal');
const pmOrderN  = document.getElementById('pmOrderName');
const pmOrderP  = document.getElementById('pmOrderPrice');
const pmConfirm = document.getElementById('pmConfirmBtn');

function openPayModal(plan, dur, price) {
  pmTotal.textContent  = price;
  pmOrderN.textContent = `Jitter VPN — ${plan} (${dur})`;
  pmOrderP.textContent = price;

  const msg = encodeURIComponent(
    `Hola! Acabo de realizar el pago del plan *${plan} (${dur})* por *${price}*. Te adjunto el comprobante. Gracias!`
  );
  pmConfirm.href = `https://wa.me/543764734171?text=${msg}`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // animate total (blur-number style)
  animateTotal(price);
}

function closePayModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function animateTotal(priceStr) {
  const num = parseInt(priceStr.replace(/\D/g, ''), 10);
  if (!num) return;
  const dur = 600; const t0 = performance.now();
  function step(now) {
    const p   = Math.min((now - t0) / dur, 1);
    const cur = Math.round(num * easeOut(p));
    pmTotal.textContent = '$' + cur.toLocaleString('es-AR') + ' ARS';
    if (p < 1) requestAnimationFrame(step);
    else pmTotal.textContent = '$' + num.toLocaleString('es-AR') + ' ARS';
  }
  requestAnimationFrame(step);
}

// Open from plan rows
document.querySelectorAll('.pr-buy-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const plan  = btn.dataset.plan;
    const dur   = btn.dataset.dur;
    const price = btn.dataset.price;
    openPayModal(plan, dur, price);
  });
});

pmClose?.addEventListener('click', closePayModal);
backdrop?.addEventListener('click', closePayModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePayModal(); });

// touch drag to close
let touchStart = 0;
document.getElementById('pmSheet')?.addEventListener('touchstart', e => { touchStart = e.touches[0].clientY; }, { passive: true });
document.getElementById('pmSheet')?.addEventListener('touchend', e => {
  if (e.changedTouches[0].clientY - touchStart > 80) closePayModal();
}, { passive: true });

// ──────────────────────────────────────────
// ── DNS MODAL
// ──────────────────────────────────────────
const dnsOverlay  = document.getElementById('dnsOverlay');
const dnsBackdrop = document.getElementById('dnsBackdrop');
const dnsClose    = document.getElementById('dnsClose');
const dnsOpenBtn  = document.getElementById('dnsOpenBtn');
const dnsForm     = document.getElementById('dnsForm');
const dnsSubmit   = document.getElementById('dnsSubmit');
const dnsStatus   = document.getElementById('dnsStatus');

// Inputs
const inSub  = document.getElementById('dnsSubdomain');
const inIp   = document.getElementById('dnsIp');
const errSub = document.getElementById('dnsSubErr');
const errIp  = document.getElementById('dnsIpErr');
const dotAvail = document.getElementById('dnsAvailDot');

// Live preview elements
const dlpSub = document.getElementById('dlpSub');
const dlpIp  = document.getElementById('dlpIp');
const dpSub  = document.getElementById('dnsPreviewSub');  // card preview
const dpIp   = document.getElementById('dnsPreviewIp');

function openDnsModal() {
  dnsOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  inSub.focus();
}
function closeDnsModal() {
  dnsOverlay.classList.remove('open');
  document.body.style.overflow = '';
  resetDnsForm();
}

dnsOpenBtn?.addEventListener('click', openDnsModal);
dnsClose?.addEventListener('click', closeDnsModal);
dnsBackdrop?.addEventListener('click', closeDnsModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && dnsOverlay?.classList.contains('open')) closeDnsModal(); });

// touch drag to close
document.getElementById('dnsSheet')?.addEventListener('touchstart', e => { touchStart = e.touches[0].clientY; }, { passive: true });
document.getElementById('dnsSheet')?.addEventListener('touchend', e => {
  if (e.changedTouches[0].clientY - touchStart > 80) closeDnsModal();
}, { passive: true });

// ── Live preview update
function updateDnsPreview() {
  const sub = inSub?.value.trim() || 'subdominio';
  const ip  = inIp?.value.trim()  || '0.0.0.0';
  if (dlpSub) dlpSub.textContent = sub;
  if (dlpIp)  dlpIp.textContent  = ip;
  if (dpSub)  dpSub.textContent  = sub;
  if (dpIp)   dpIp.textContent   = ip;
}

// Subdomain validation + debounced availability check
let checkTimer;
inSub?.addEventListener('input', () => {
  updateDnsPreview();
  errSub.textContent = '';
  inSub.classList.remove('err', 'ok');
  dotAvail?.classList.remove('avail', 'taken');

  const val = inSub.value.trim();
  if (!val) return;

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(val)) {
    inSub.classList.add('err');
    errSub.textContent = 'Solo letras, números y guiones. Sin espacios ni puntos.';
    return;
  }

  // debounced check
  clearTimeout(checkTimer);
  checkTimer = setTimeout(async () => {
    try {
      const r = await fetch(`/api/check?subdomain=${encodeURIComponent(val)}`);
      const d = await r.json();
      if (d.error) {
        inSub.classList.add('err');
        errSub.style.color = '#f87171';
        errSub.textContent = `Error: ${d.error}`;
      } else if (d.available) {
        inSub.classList.add('ok');
        errSub.style.color = 'var(--gr)';
        errSub.textContent = `✓ "${val}.jittervpn.dpdns.org" está disponible`;
      } else {
        inSub.classList.add('err');
        errSub.style.color = '#f87171';
        errSub.textContent = `"${val}" ya está en uso. Elegí otro nombre.`;
      }
    } catch (e) {
      errSub.style.color = '#f87171';
      errSub.textContent = `Error de red: ${e.message}`;
    }
  }, 600);
});

inIp?.addEventListener('input', () => {
  updateDnsPreview();
  errIp.textContent = '';
  inIp.classList.remove('err', 'ok');
  const val = inIp.value.trim();
  if (!val) return;
  const parts = val.split('.');
  const valid = parts.length === 4 && parts.every(p => p !== '' && !isNaN(+p) && +p >= 0 && +p <= 255);
  if (valid) { inIp.classList.add('ok'); }
  else if (val.length > 6) { inIp.classList.add('err'); errIp.textContent = 'IP inválida. Ejemplo: 177.22.45.10'; }
});

// ── Submit
dnsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errSub.textContent = ''; errIp.textContent = '';
  errSub.style.color = '#f87171'; errIp.style.color = '#f87171';

  const subdomain = inSub.value.trim();
  const ip        = inIp.value.trim();

  // Frontend validation
  let valid = true;
  if (!subdomain) { errSub.textContent = 'Ingresá un nombre de subdominio.'; valid = false; }
  else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(subdomain)) { errSub.textContent = 'Formato inválido.'; valid = false; }
  if (!ip) { errIp.textContent = 'Ingresá la IP de tu servidor.'; valid = false; }
  else {
    const parts = ip.split('.');
    if (parts.length !== 4 || !parts.every(p => p !== '' && !isNaN(+p) && +p >= 0 && +p <= 255)) {
      errIp.textContent = 'IP inválida. Ejemplo: 177.22.45.10'; valid = false;
    }
  }
  if (!valid) return;

  // Loading state
  dnsSubmit.disabled = true;
  dnsStatus.className = 'dns-status loading';
  dnsStatus.innerHTML = '<div class="spin"></div><span>Creando registro DNS en Cloudflare…</span>';

  try {
    const res  = await fetch('/api/dns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain, ip }),
    });
    const data = await res.json();

    if (data.success) {
      dnsStatus.className = 'dns-status success';
      dnsStatus.innerHTML = `
        <strong>✓ Registro DNS creado correctamente</strong>
        <span class="ds-domain">${data.domain}</span>
        apunta a <strong>${data.ip}</strong><br>
        <span style="font-size:.78rem;color:var(--td);margin-top:.35rem;display:block">
          La propagación puede tardar entre 1 y 60 segundos.
        </span>`;
      inSub.classList.add('ok'); inIp.classList.add('ok');
      // update preview
      updateDnsPreview();
    } else {
      throw new Error(data.error || 'Error desconocido.');
    }
  } catch (err) {
    dnsStatus.className = 'dns-status error';
    dnsStatus.innerHTML = `<strong>✗ Error:</strong> ${err.message}`;
    dnsSubmit.disabled = false;
  }
});

function resetDnsForm() {
  dnsForm?.reset();
  errSub.textContent = ''; errIp.textContent = '';
  inSub?.classList.remove('err','ok'); inIp?.classList.remove('err','ok');
  dnsStatus.className = 'dns-status'; dnsStatus.innerHTML = '';
  dnsSubmit.disabled = false;
  if (dlpSub) dlpSub.textContent = 'subdominio';
  if (dlpIp)  dlpIp.textContent  = '0.0.0.0';
}

// ── Copy buttons
const toast = document.createElement('div');
toast.className = 'toast'; toast.textContent = '¡Copiado!';
document.body.appendChild(toast);
let toastTimer;

document.querySelectorAll('.pm-copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.copy;
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied');
      // swap icon to checkmark
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
        btn.classList.remove('copied');
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
      }, 2000);
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
    });
  });
});

// ── Confetti Mundial 2026 (celeste + blanco + dorado)
(function initConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pieces = [];
  const COLORS = ['#75AADB','#75AADB','#ffffff','#ffffff','#f0c040','#a8d8f0'];
  const MAX = 60;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function mkPiece() {
    const size = Math.random() * 8 + 4;
    return {
      x:   Math.random() * W,
      y:   -size,
      w:   size,
      h:   size * (Math.random() * .5 + .3),
      rot: Math.random() * Math.PI * 2,
      vx:  (Math.random() - .5) * 1.2,
      vy:  Math.random() * 1.4 + .6,
      vr:  (Math.random() - .5) * .08,
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      a:   Math.random() * .4 + .15,
    };
  }

  let lastSpawn = 0;
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    if (pieces.length < MAX && ts - lastSpawn > 180) {
      pieces.push(mkPiece());
      lastSpawn = ts;
    }
    pieces = pieces.filter(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.rot += p.vr;
      if (p.y > H + 20) return false;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      return true;
    });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
