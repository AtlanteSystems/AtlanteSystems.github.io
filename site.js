/* Atlante Systems - lightweight visual effects for demo-style redesign */
(() => {
  document.documentElement.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Canvas particle network disabled for performance
  const canvas = null;
  if (false && canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, particles = [];
    let mouse = { x: -9999, y: -9999 };
    const LINK = 110;
    const MAX = 28;

    function resize() {
      const dpr = 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(MAX, Math.max(14, Math.floor((width * height) / 55000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.5 + 0.7,
      }));
    }

    let raf = 0;
    function draw() {
      if (document.hidden) { raf = 0; return; }
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150 && dist > 0) {
            p.x += (dx / dist) * 0.5;
            p.y += (dy / dist) * 0.5;
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150,220,255,.55)';
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(110,231,255,${(1 - d / LINK) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      if (!reducedMotion) raf = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); if (reducedMotion) draw(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !reducedMotion && !raf) draw(); });
    let pm = 0;
    window.addEventListener('pointermove', (e) => {
      if (pm) return;
      const x = e.clientX, y = e.clientY;
      pm = requestAnimationFrame(() => { mouse.x = x; mouse.y = y; pm = 0; });
    }, { passive: true });
    window.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    resize();
    draw();
  }

  // Reveal on scroll + optional count up
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
        entry.target.querySelectorAll('[data-count]').forEach((el) => {
          const target = Number(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          if (reducedMotion) { el.textContent = target + suffix; return; }
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min((now - start) / 1100, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.16 });
    revealEls.forEach((el) => observer.observe(el));
  }

  // Pointer-reactive tilt cards (desktop fine pointer only)
  const canTilt = !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canTilt) {
    document.querySelectorAll('.tilt, .card, .pricing-card').forEach((card) => {
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        if (raf) return;
        const cx = e.clientX, cy = e.clientY;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (cx - r.left) / r.width;
          const y = (cy - r.top) / r.height;
          card.style.setProperty('--rx', ((0.5 - y) * 4).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((x - 0.5) * 4).toFixed(2) + 'deg');
          card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
          raf = 0;
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }
})();
