// 산성비 + 스네이크: 하늘에서 단어가 떨어지고, 뱀이 차례대로 먹으면 몸이 곧 문장이 된다.
class Game {
  constructor(canvas, opt) {
    this.cv = canvas; this.c = canvas.getContext('2d'); this.o = opt;
    this.drops = []; this.segs = []; this.trail = []; this.fx = [];
    this.need = []; this.idx = 0; this.pool = []; this.hint = false;
    this.paused = true; this.safe = 0; this.shake = 0; this.spawnT = 0; this.face = -Math.PI / 2;
    this.dir = null; this.target = null; this.t = 0;
    this.resize();
    this.head = { x: this.W / 2, y: this.H * 0.62 };
    this.rain = Array.from({ length: 36 }, () => ({ x: Math.random(), y: Math.random(), v: 0.5 + Math.random() * 0.6 }));

    const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    this.onDown = e => { this.down = true; this.target = pos(e); this.dir = null; e.preventDefault(); };
    this.onMove = e => { if (this.down) { this.target = pos(e); e.preventDefault(); } };
    this.onUp = () => { this.down = false; };
    this.onKey = e => {
      const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }[e.key];
      if (d && !this.paused) { this.dir = { x: d[0], y: d[1] }; this.target = null; e.preventDefault(); }
    };
    this.onSize = () => this.resize();
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('resize', this.onSize);

    this.last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (!this.paused) this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.cv.removeEventListener('pointerdown', this.onDown);
    this.cv.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('resize', this.onSize);
  }

  resize() {
    const r = this.cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    this.W = Math.max(200, r.width); this.H = Math.max(200, r.height);
    this.cv.width = this.W * dpr; this.cv.height = this.H * dpr;
    this.c.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.GH = 34; // 땅 높이
  }

  font() { this.c.font = '700 17px system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'; }
  width(text) { this.font(); return Math.ceil(this.c.measureText(text).width) + 22; }

  // 새 과제: need = 순서대로 먹어야 할 낱말들, pool = 방해 낱말 후보
  setTask(need, pool, { hint = false, keepBody = false } = {}) {
    this.need = need; this.idx = 0; this.hint = hint;
    this.pool = pool.filter(w => !need.includes(w));
    if (!keepBody) this.segs = [];
    this.drops = []; this.spawnT = 0.4; this.paused = false;
  }
  retry() { this.idx = 0; this.segs = []; this.drops = []; this.spawnT = 0.4; this.paused = false; }

  spawn() {
    const want = this.need[this.idx];
    if (want == null) return;
    let text;
    if (!this.drops.some(d => d.text === want)) text = want;
    else {
      // 문장의 뒤쪽 낱말도 섞어서 "순서"를 생각하게 한다
      const later = this.need.slice(this.idx + 1);
      const src = later.length && Math.random() < 0.5 ? later : this.pool;
      text = src[Math.floor(Math.random() * src.length)];
      if (text == null || this.drops.some(d => d.text === text)) return;
    }
    const w = this.width(text);
    for (let i = 0; i < 12; i++) {
      const x = w / 2 + 6 + Math.random() * (this.W - w - 12);
      if (this.drops.every(d => d.y > 70 || Math.abs(d.x - x) > (d.w + w) / 2 + 8)) {
        this.drops.push({ text, w, x, y: -20, vy: this.o.speed * (0.85 + Math.random() * 0.3) });
        return;
      }
    }
  }

  burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = 60 + Math.random() * 120;
      this.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.5, color });
    }
  }

  update(dt) {
    this.t += dt; this.safe -= dt; this.shake = Math.max(0, this.shake - dt);
    const h = this.head, SP = 210, R = 17;
    let mx = 0, my = 0;
    if (this.target) {
      const dx = this.target.x - h.x, dy = this.target.y - h.y, d = Math.hypot(dx, dy);
      if (d > 3) { const st = Math.min(SP * dt, d); mx = dx / d * st; my = dy / d * st; }
    } else if (this.dir) { mx = this.dir.x * SP * dt; my = this.dir.y * SP * dt; }
    const nx = Math.max(R, Math.min(this.W - R, h.x + mx)), ny = Math.max(R, Math.min(this.H - this.GH - R, h.y + my));
    if (nx !== h.x || ny !== h.y) {
      this.face = Math.atan2(ny - h.y, nx - h.x);
      h.x = nx; h.y = ny;
      this.trail.push({ x: nx, y: ny });
      if (this.trail.length > 4000) this.trail.splice(0, 1000);
    }

    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.drops.length < this.o.maxDrops) { this.spawn(); this.spawnT = this.o.gap; }

    const want = this.need[this.idx];
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.y += d.vy * dt;
      const hit = Math.abs(h.x - d.x) < d.w / 2 + R - 4 && Math.abs(h.y - d.y) < 17 + R - 4;
      if (hit && d.text === want) {
        this.drops.splice(i, 1);
        this.segs.push({ text: d.text, w: d.w });
        this.idx++;
        this.burst(d.x, d.y, '#ffe066', 14);
        this.o.onEat(d.text);
        if (this.idx >= this.need.length) { this.paused = true; this.drops = []; this.o.onDone(); return; }
      } else if (hit && this.safe <= 0) {
        this.drops.splice(i, 1);
        this.safe = 0.9; this.shake = 0.35;
        this.burst(d.x, d.y, '#ff6b6b');
        this.o.onWrong(d.text);
        if (this.paused) return;
      } else if (d.y > this.H - this.GH) {
        this.drops.splice(i, 1);
        this.burst(d.x, this.H - this.GH, '#b8f28a', 8);
        if (d.text === want) { this.o.onMiss(d.text); if (this.paused) return; }
      }
    }
    this.fx.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; });
    this.fx = this.fx.filter(p => p.life > 0);
  }

  pill(x, y, w, fill, stroke, lw) {
    const c = this.c, hh = 17;
    c.beginPath();
    if (c.roundRect) c.roundRect(x - w / 2, y - hh, w, hh * 2, hh); else c.rect(x - w / 2, y - hh, w, hh * 2);
    c.fillStyle = fill; c.fill();
    if (stroke) { c.lineWidth = lw || 2; c.strokeStyle = stroke; c.stroke(); }
  }

  draw() {
    const c = this.c, W = this.W, H = this.H, o = this.o;
    c.save();
    if (this.shake > 0) c.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, o.bg[0]); g.addColorStop(1, o.bg[1]);
    c.fillStyle = g; c.fillRect(-10, -10, W + 20, H + 20);

    // 빗줄기
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.5; c.beginPath();
    this.rain.forEach(r => {
      if (!this.paused) { r.y += r.v * 0.012; if (r.y > 1) { r.y = 0; r.x = Math.random(); } }
      c.moveTo(r.x * W, r.y * H); c.lineTo(r.x * W - 3, r.y * H + 12);
    });
    c.stroke();

    c.fillStyle = o.ground; c.fillRect(-10, H - this.GH, W + 20, this.GH + 10);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-10, H - this.GH, W + 20, 4);

    this.font(); c.textAlign = 'center'; c.textBaseline = 'middle';

    // 뱀 몸통: 머리가 지나온 길을 따라 낱말들이 줄지어 따라온다
    const h = this.head;
    let acc = 0, ti = this.trail.length - 1, px = h.x, py = h.y, prevW = 30;
    const places = [];
    for (const s of this.segs) {
      const dist = prevW / 2 + s.w / 2 + 2; let need = dist;
      while (ti >= 0 && need > 0) {
        const p = this.trail[ti], d = Math.hypot(p.x - px, p.y - py);
        if (d >= need) { const k = need / d; px += (p.x - px) * k; py += (p.y - py) * k; need = 0; }
        else { need -= d; px = p.x; py = p.y; ti--; }
      }
      places.push({ s, x: px, y: py }); prevW = s.w; acc += dist;
    }
    for (let i = places.length - 1; i >= 0; i--) {
      const p = places[i];
      this.pill(p.x, p.y, p.s.w, i % 2 ? '#3fae5a' : '#48c268', '#2b8a45');
      c.fillStyle = '#fff'; c.fillText(p.s.text, p.x, p.y + 1);
    }
    // 머리
    const blink = this.safe > 0 && Math.floor(this.t * 12) % 2;
    c.globalAlpha = blink ? 0.45 : 1;
    c.beginPath(); c.arc(h.x, h.y, 17, 0, 6.29); c.fillStyle = '#35a853'; c.fill();
    c.lineWidth = 2; c.strokeStyle = '#237a3b'; c.stroke();
    const fx = Math.cos(this.face), fy = Math.sin(this.face);
    c.strokeStyle = '#e8475f'; c.lineWidth = 3; c.beginPath();
    c.moveTo(h.x + fx * 16, h.y + fy * 16); c.lineTo(h.x + fx * 25, h.y + fy * 25); c.stroke();
    [-1, 1].forEach(sd => {
      const ex = h.x + fx * 6 - fy * 7 * sd, ey = h.y + fy * 6 + fx * 7 * sd;
      c.beginPath(); c.arc(ex, ey, 5, 0, 6.29); c.fillStyle = '#fff'; c.fill();
      c.beginPath(); c.arc(ex + fx * 2, ey + fy * 2, 2.4, 0, 6.29); c.fillStyle = '#222'; c.fill();
    });
    c.globalAlpha = 1;

    // 떨어지는 낱말
    const want = this.need[this.idx];
    for (const d of this.drops) {
      const glow = this.hint && d.text === want;
      if (glow) { c.shadowColor = '#ffd43b'; c.shadowBlur = 16 + Math.sin(this.t * 8) * 6; }
      this.pill(d.x, d.y, d.w, '#fff', glow ? '#f5b800' : 'rgba(0,0,0,.18)', glow ? 3 : 1.5);
      c.shadowBlur = 0;
      c.fillStyle = '#243'; c.fillText(d.text, d.x, d.y + 1);
    }
    for (const p of this.fx) {
      c.globalAlpha = Math.max(0, p.life * 2); c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x, p.y, 4, 0, 6.29); c.fill();
    }
    c.globalAlpha = 1;
    c.restore();
  }
}
