// 3D 블록 섬 (시험판): 하늘에서 떨어진 낱말 블록을 캐서 문장을 만들면 다음 섬으로 가는 다리가 놓인다.
(() => {
  const T = THREE;
  const HW = 3, PL = 9, GAP = 3, STEP = PL + GAP, NP = 6; // 섬 반너비, 섬 길이, 물 간격, 섬 개수
  const $cv = document.getElementById('cv'), $hearts = document.querySelector('.hearts'), $prog = document.querySelector('.prog'),
    $prompt = document.querySelector('.prompt'), $stick = document.getElementById('stick');
  const standalone = !!window.ISLAND_STANDALONE;

  const renderer = new T.WebGLRenderer({ canvas: $cv, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(55, 1, 0.1, 120);
  scene.add(new T.HemisphereLight(0xffffff, 0x667788, 0.85));
  const sun = new T.DirectionalLight(0xffffff, 0.55); sun.position.set(4, 10, 6); scene.add(sun);
  const resize = () => { const w = $app.clientWidth, h = $app.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', resize); resize();

  // ---- 그림 재료 ----
  const texCache = {};
  function wordTex(text, bg, fg, edge) {
    const k = text + bg; if (texCache[k]) return texCache[k];
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = edge; g.fillRect(0, 0, 256, 256); g.fillStyle = bg; g.fillRect(12, 12, 232, 232);
    let fs = 96; do { g.font = `800 ${fs}px system-ui, sans-serif`; fs -= 4; } while (g.measureText(text).width > 216 && fs > 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 134);
    return (texCache[k] = new T.CanvasTexture(c));
  }
  function sprite(draw, w, h, sx, sy) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'));
    const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true }));
    s.scale.set(sx, sy, 1); return s;
  }
  const emojiSprite = (e, size) => sprite(g => { g.font = '96px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 64, 70); }, 128, 128, size, size);
  const signSprite = text => sprite(g => {
    g.fillStyle = '#fff'; g.strokeStyle = '#8a5a2b'; g.lineWidth = 10;
    g.beginPath(); g.rect(8, 8, 752, 112); g.fill(); g.stroke();
    let fs = 64; do { g.font = `800 ${fs}px system-ui, sans-serif`; fs -= 3; } while (g.measureText(text).width > 710 && fs > 18);
    g.fillStyle = '#243'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 384, 66);
  }, 768, 128, 3.6, 0.6);
  const box = (w, h, d, color) => new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshLambertMaterial({ color }));

  // ---- 주인공들 ----
  function makeJun() {
    const g = new T.Group();
    const part = (w, h, d, c, x, y, z) => { const m = box(w, h, d, c); m.position.set(x, y, z); g.add(m); return m; };
    g.legs = [part(0.22, 0.45, 0.24, 0x34507a, -0.14, 0.22, 0), part(0.22, 0.45, 0.24, 0x34507a, 0.14, 0.22, 0)];
    part(0.62, 0.6, 0.38, 0xf7c531, 0, 0.75, 0);                  // 노란 비옷
    g.arms = [part(0.16, 0.5, 0.2, 0xf7c531, -0.4, 0.78, 0), part(0.16, 0.5, 0.2, 0xf7c531, 0.4, 0.78, 0)];
    part(0.5, 0.48, 0.48, 0xf2c9a0, 0, 1.3, 0);                   // 얼굴
    part(0.58, 0.2, 0.56, 0xf7c531, 0, 1.6, -0.02);               // 비옷 모자
    part(0.08, 0.08, 0.04, 0x222222, -0.12, 1.34, 0.25); part(0.08, 0.08, 0.04, 0x222222, 0.12, 1.34, 0.25);
    return g;
  }
  function makeCoco() {
    const g = new T.Group(), h = box(0.6, 0.5, 0.6, 0x35a853); h.position.y = 0.3; g.add(h);
    [-0.16, 0.16].forEach(x => {
      const e = box(0.16, 0.16, 0.06, 0xffffff); e.position.set(x, 0.42, 0.31); g.add(e);
      const p = box(0.07, 0.07, 0.04, 0x222222); p.position.set(x, 0.42, 0.35); g.add(p);
    });
    const t = box(0.1, 0.04, 0.3, 0xe8475f); t.position.set(0, 0.2, 0.42); g.add(t);
    return g;
  }
  const jun = makeJun(), coco = makeCoco(); scene.add(jun, coco);
  const tail = [0, 1].map(() => { const m = box(0.5, 0.4, 0.5, 0x48c268); scene.add(m); return m; });

  // 비
  const RAIN = 260, rainPos = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i++) { rainPos[i * 3] = (Math.random() - 0.5) * 22; rainPos[i * 3 + 1] = Math.random() * 14; rainPos[i * 3 + 2] = (Math.random() - 0.5) * 22; }
  const rainGeo = new T.BufferGeometry(); rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
  const rain = new T.Points(rainGeo, new T.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.6 })); scene.add(rain);

  // ---- 상태 ----
  let root = null, si = 0, sc = null, tasks = [], ti = 0, need = [], idx = 0, hint = false, state = 'intro';
  let hearts = 5, slips = 0, total = 0, spawnT = 0, land = new Set(), blocks = [], bits = [], got = [], trail = [], pool = [];
  const P = { x: 0, z: -4, face: Math.PI, walk: 0 };
  let goal = null, stuck = 0, joy = null, keys = {}, tNow = 0;
  const key = (x, z) => Math.round(x) + ',' + Math.round(z);
  const platOf = t => (t.type === 'word' ? 0 : t.li);

  function build(n) {
    si = n; sc = STORY.scenes[si];
    if (root) scene.remove(root);
    got.forEach(m => scene.remove(m));
    root = new T.Group(); scene.add(root);
    land = new Set(); blocks = []; bits = []; got = []; trail = []; goal = null;
    const sky = new T.Color(sc.bg[0]).lerp(new T.Color(sc.bg[1]), 0.45);
    scene.background = sky; scene.fog = new T.Fog(sky, 16, 46);

    const cells = [];
    for (let p = 0; p < NP; p++) for (let x = -HW; x <= HW; x++) for (let z = 0; z < PL; z++) cells.push([x, -p * STEP - z]);
    const grass = new T.InstancedMesh(new T.BoxGeometry(1, 0.35, 1), new T.MeshLambertMaterial({ color: 0xffffff }), cells.length);
    const dirt = new T.InstancedMesh(new T.BoxGeometry(1, 1.4, 1), new T.MeshLambertMaterial({ color: 0x8a5f3c }), cells.length);
    const m = new T.Matrix4(), base = new T.Color(sc.ground);
    cells.forEach(([x, z], i) => {
      land.add(key(x, z));
      m.setPosition(x, -0.175, z); grass.setMatrixAt(i, m);
      grass.setColorAt(i, base.clone().offsetHSL(0, 0, (x + z) % 2 ? 0.05 : -0.02));
      m.setPosition(x, -1.05, z); dirt.setMatrixAt(i, m);
    });
    grass.instanceColor.needsUpdate = true; root.add(grass, dirt);
    const water = new T.Mesh(new T.PlaneGeometry(140, 180), new T.MeshLambertMaterial({ color: 0x3f8fd6, transparent: true, opacity: 0.85 }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -0.55, -35); root.add(water);
    const flag = emojiSprite(sc.emoji, 3); flag.position.set(0, 2.2, -(NP - 1) * STEP - 5); root.add(flag);

    const upto = STORY.scenes.slice(0, si + 1);
    pool = { word: [...new Set(upto.flatMap(x => x.words.map(w => w.en)))], line: [...new Set(upto.flatMap(x => x.lines.flatMap(l => l.en.split(' '))))] };
    tasks = [...sc.words.map(w => ({ type: 'word', w, need: [w.en] })), ...sc.lines.map((line, li) => ({ type: 'line', line, li, need: line.en.split(' ') }))];
    ti = 0; hearts = 5; total = 0; state = 'intro'; need = []; idx = 0;
    P.x = 0; P.z = -4; P.face = Math.PI;
    hud(); $prompt.innerHTML = '';

    const md = modal(`<div class="center"><div class="huge">${sc.emoji}</div><h3>${si + 1}. ${sc.titleKo} 섬</h3><p>${sc.intro}</p>
      <div class="vocab">${sc.words.map(w => `<button data-w="${w.en}">${w.emoji}<b>${w.en}</b><small>${w.ko}</small></button>`).join('')}</div>
      <p class="dim">화면을 <b>누르면</b> 그곳으로 걸어가요. 낱말 블록을 <b>누르면</b> 가서 캐요.<br>화면을 <b>끌면</b> 조이스틱처럼 움직여요. (키보드: 방향키)</p>
      <button class="btn big">출발!</button></div>`);
    md.querySelectorAll('[data-w]').forEach(b => { b.onclick = () => Sound.speak(b.dataset.w); });
    md.querySelector('.btn.big').onclick = () => { Sound.unlock(); md.remove(); startTask(); };
  }

  function hud() {
    $hearts.textContent = '❤️'.repeat(hearts) + '🤍'.repeat(5 - hearts);
    $prog.innerHTML = tasks.map((t, i) => `<i class="${i < ti ? 'd' : i === ti ? 'c' : ''} ${t.type}"></i>`).join('');
  }
  function prompt() {
    const t = tasks[ti];
    if (state === 'travel') { $prompt.innerHTML = `<div class="q"><span class="big">🌉</span> <b>다리를 건너 다음 섬으로 가요!</b></div>`; return; }
    if (!t) return;
    if (t.type === 'word') { $prompt.innerHTML = `<div class="q"><span class="big">${t.w.emoji}</span> <b>${t.w.ko}</b> <small>영어 낱말 블록을 캐요!</small></div>`; return; }
    const ch = STORY.chars[t.line.who];
    $prompt.innerHTML = `<div class="q"><button class="ear">🔊</button> ${ch.emoji} <b>${esc(t.line.ko)}</b></div>
      <div class="slots">${t.need.map((w, i) => `<span class="${i < idx ? 'f' : i === idx ? 'n' : ''}">${i < idx ? esc(w) : '_'.repeat(Math.max(2, w.length))}</span>`).join('')}</div>`;
    $prompt.querySelector('.ear').onclick = () => Sound.speak(t.line.en);
  }
  function clearBlocks() { blocks.forEach(b => root.remove(b.mesh)); blocks = []; goal = null; }
  function clearGot() { got.forEach(m => scene.remove(m)); got = []; }

  function startTask() {
    const t = tasks[ti]; need = t.need; idx = 0; slips = 0; hint = si === 0; state = 'task'; spawnT = 0.3;
    clearBlocks(); if (!(t.type === 'word' && ti > 0)) clearGot();
    hud(); prompt();
    if (t.type === 'line') { Sound.speak(t.line.en); if (ti > 0 && tasks[ti - 1].type === 'word') toast('이제 낱말 블록을 순서대로 캐서 문장을 만들어요!'); }
  }

  function spawn() {
    const want = need[idx], t = tasks[ti]; let text;
    if (!blocks.some(b => b.text === want)) text = want;
    else {
      const later = need.slice(idx + 1), src = later.length && Math.random() < 0.5 ? later : pool[t.type].filter(w => !need.includes(w));
      text = src[Math.floor(Math.random() * src.length)];
      if (text == null || blocks.some(b => b.text === text)) return;
    }
    const pz = -platOf(t) * STEP;
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * (HW * 2 + 1)) - HW, z = pz - 1 - Math.floor(Math.random() * (PL - 2));
      if (Math.hypot(x - P.x, z - P.z) < 1.8 || blocks.some(b => Math.abs(b.x - x) < 2 && Math.abs(b.z - z) < 2)) continue;
      const mat = new T.MeshLambertMaterial({ map: wordTex(text, '#fffaf0', '#243', '#c9b79c'), emissive: 0x000000 });
      const mesh = new T.Mesh(new T.BoxGeometry(0.94, 0.94, 0.94), mat);
      mesh.position.set(x, 13 + Math.random() * 3, z); root.add(mesh);
      const b = { text, x, z, mesh, landed: false, life: 18 }; mesh.userData.b = b; blocks.push(b);
      return;
    }
  }
  function burst(x, y, z, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const m = box(0.16, 0.16, 0.16, color); m.position.set(x, y, z); root.add(m);
      bits.push({ m, vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 5, life: 0.7 });
    }
  }
  function removeBlock(b) { root.remove(b.mesh); blocks = blocks.filter(x => x !== b); if (goal && goal.block === b) goal = null; }

  function hurt() {
    hearts--; slips++; total++; hud();
    if (slips >= (tasks[ti].type === 'word' ? 1 : 2)) hint = true;
    if (hearts > 0) return;
    state = 'pause';
    const md = modal(`<div class="center"><div class="huge">☔</div><h3>괜찮아, 다시 해 보자!</h3><p>반짝이는 블록을 찾아봐요.</p><button class="btn big">다시 도전</button></div>`);
    md.querySelector('button').onclick = () => { md.remove(); hearts = 5; startTask(); hint = true; };
  }

  function mine(b) {
    removeBlock(b);
    if (b.text !== need[idx]) { burst(b.x, 0.5, b.z, 0xff6b6b); Sound.sfx.bad(); toast(`“${b.text}” 말고 다른 블록이에요!`); return hurt(); }
    burst(b.x, 0.5, b.z, 0xffe066, 14); Sound.sfx.eat();
    const m = new T.Mesh(new T.BoxGeometry(0.66, 0.66, 0.66), new T.MeshLambertMaterial({ map: wordTex(b.text, '#3fae5a', '#fff', '#2b8a45') }));
    scene.add(m); got.push(m);
    idx++; prompt();
    const t = tasks[ti];
    if (t.type === 'word') Sound.speak(b.text);
    if (idx < need.length) return;
    hearts = Math.min(5, hearts + 1);
    if (t.type === 'word') {
      Store.learnWord(t.w.en); toast(`${t.w.emoji} ${t.w.en} = ${t.w.ko}`);
      const s = emojiSprite(t.w.emoji, 1.3), k = ti; s.position.set(k % 2 ? HW : -HW, 0.75, -1 - k * 1.6); root.add(s);
      ti++; state = 'pause'; setTimeout(startTask, 700);
    } else bridge(t);
  }

  // 문장 완성 → 다리가 한 칸씩 놓인다
  function bridge(t) {
    state = 'pause'; clearBlocks(); hud();
    Store.unlockLine(si, t.li);
    const z0 = -t.li * STEP - PL; let row = 0;
    const iv = setInterval(() => {
      for (let x = -1; x <= 1; x++) {
        const pl = box(0.96, 0.3, 0.96, (x + row) % 2 ? 0xb9834a : 0xa8743f); pl.position.set(x, -0.15, z0 - row); root.add(pl);
        land.add(key(x, z0 - row));
      }
      Sound.sfx.eat();
      if (++row < GAP) return;
      clearInterval(iv);
      const sg = signSprite(t.line.en); sg.position.set(0, 1.5, z0 - GAP + 0.4); root.add(sg);
      const a = emojiSprite(t.line.art[0], 1.8); a.position.set(t.li % 2 ? -HW + 0.3 : HW - 0.3, 1, z0 - GAP - 1.5); root.add(a);
      Sound.speak(t.line.en);
      const md = modal(`<p class="tag">🌉 문장으로 다리를 놓았어요!</p>${bubble(t.line)}<div class="sp"></div><button class="btn big">건너가기 ➡</button>`);
      md.querySelector('.sp').appendChild(speakPanel(t.line.en));
      md.querySelector('.btn.big').onclick = async () => { await Sound.recStop(); Sound.hush(); md.remove(); clearGot(); state = 'travel'; ti++; hud(); prompt(); };
    }, 260);
  }

  function finish() {
    state = 'done';
    const stars = total <= 2 ? 3 : total <= 7 ? 2 : 1, last = si === STORY.scenes.length - 1;
    Store.finishScene(si, stars); Sound.sfx.win();
    const md = modal(`<div class="center"><div class="huge">${sc.emoji}</div><h3>섬 탐험 완료! ${'⭐'.repeat(stars)}</h3>
      <p>다리마다 내가 만든 문장이 걸려 있어요.<br>“${sc.titleKo}” 이야기가 이야기책에 담겼어요.</p>
      <button class="btn big" data-x="next">${last ? '🔁 처음 섬으로' : '⛵ 다음 섬으로'}</button>
      ${standalone ? '' : '<a class="btn" href="index.html">📖 이야기책 · 복습 하러 가기</a>'}</div>`);
    md.querySelector('[data-x=next]').onclick = () => { md.remove(); build(last ? 0 : si + 1); };
  }

  // ---- 조작 ----
  const ray = new T.Raycaster(), ndc = new T.Vector2(), groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0), hitPt = new T.Vector3();
  let down = null;
  $cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, drag: false }; e.preventDefault(); });
  $cv.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y, d = Math.hypot(dx, dy);
    if (!down.drag && d > 14) { down.drag = true; goal = null; $stick.hidden = false; $stick.style.left = down.x + 'px'; $stick.style.top = down.y + 'px'; }
    if (down.drag) { const k = Math.min(1, d / 50) / (d || 1); joy = { x: dx * k, z: dy * k }; $stick.firstElementChild.style.transform = `translate(${joy.x * 26}px, ${joy.z * 26}px)`; }
  });
  window.addEventListener('pointerup', e => {
    if (!down) return;
    const tap = !down.drag; down = null; joy = null; $stick.hidden = true;
    if (!tap || (state !== 'task' && state !== 'travel')) return;
    const r = $cv.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(blocks.filter(b => b.landed).map(b => b.mesh))[0];
    if (hit) { const b = hit.object.userData.b; goal = { x: b.x, z: b.z, block: b }; }
    else if (ray.ray.intersectPlane(groundPlane, hitPt)) goal = { x: hitPt.x, z: hitPt.z };
    stuck = 0;
  });
  window.addEventListener('keydown', e => { keys[e.key] = true; if (/^Arrow/.test(e.key)) e.preventDefault(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function movePlayer(dt) {
    let vx = 0, vz = 0;
    const kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0), kz = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
    if (joy) { vx = joy.x; vz = joy.z; }
    else if (kx || kz) { const d = Math.hypot(kx, kz); vx = kx / d; vz = kz / d; goal = null; }
    else if (goal) {
      const dx = goal.x - P.x, dz = goal.z - P.z, d = Math.hypot(dx, dz);
      if (goal.block) { if (d < 1.55) { const b = goal.block; goal = null; P.face = Math.atan2(dx, dz); return mine(b); } }
      else if (d < 0.15) { goal = null; return; }
      vx = dx / d; vz = dz / d;
    }
    if (!vx && !vz) { P.walk = 0; return; }
    const SP = 4.6 * dt, here = key(P.x, P.z);
    const ok = (x, z) => { const k = key(x, z); return land.has(k) && (k === here || !blocks.some(b => b.landed && key(b.x, b.z) === k)); };
    const ox = P.x, oz = P.z;
    if (ok(P.x + vx * SP + Math.sign(vx) * 0.25, P.z)) P.x += vx * SP;
    if (ok(P.x, P.z + vz * SP + Math.sign(vz) * 0.25)) P.z += vz * SP;
    const moved = Math.hypot(P.x - ox, P.z - oz);
    if (moved > 0.001) { P.face = Math.atan2(vx, vz); P.walk += dt * 11; trail.push({ x: P.x, z: P.z }); if (trail.length > 3000) trail.splice(0, 1000); }
    if (goal) { stuck = moved < SP * 0.2 ? stuck + dt : 0; if (stuck > 0.6) goal = null; }
  }

  function update(dt) {
    if (state === 'task' || state === 'travel') movePlayer(dt);
    if (state === 'travel' && P.z < -(tasks[ti - 1].li + 1) * STEP + 0.4) { if (ti >= tasks.length) finish(); else startTask(); }
    if (state === 'task') {
      spawnT -= dt;
      if (spawnT <= 0 && blocks.length < 5 + Math.min(2, si)) { spawn(); spawnT = Math.max(0.9, 1.4 - si * 0.1); }
      const want = need[idx];
      for (const b of blocks.slice()) {
        if (!b.landed) {
          b.mesh.position.y -= 10 * dt;
          if (b.mesh.position.y <= 0.47) {
            b.mesh.position.y = 0.47; b.landed = true; burst(b.x, 0.1, b.z, 0xffffff, 4);
            if (Math.hypot(b.x - P.x, b.z - P.z) < 0.7) { P.z = Math.min(P.z + 1, -platOf(tasks[ti]) * STEP); } // 머리 위에 떨어지면 한 칸 비켜선다
          }
        } else {
          b.life -= dt;
          if (b.life < 2.5) b.mesh.scale.setScalar(Math.max(0.05, b.life / 2.5));
          if (b.life <= 0) { removeBlock(b); burst(b.x, 0.2, b.z, 0xb8f28a, 6); if (b.text === want) { Sound.sfx.miss(); toast('블록이 비에 녹아 버렸어요!'); hurt(); if (state !== 'task') return; } continue; }
        }
        const glow = hint && b.text === want;
        b.mesh.material.emissive.setHex(glow ? 0xffb300 : 0x000000);
        b.mesh.material.emissiveIntensity = glow ? 0.35 + Math.sin(tNow * 7) * 0.25 : 0;
        if (goal && goal.block === b) b.mesh.rotation.y = Math.sin(tNow * 10) * 0.12; else b.mesh.rotation.y = 0;
      }
    }
    for (const p of bits) { p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.vy -= 14 * dt; p.life -= dt; if (p.life <= 0) root.remove(p.m); }
    bits = bits.filter(p => p.life > 0);
  }

  // 코코와 캔 낱말들이 준이 지나온 길을 따라 줄지어 온다
  function followers() {
    const list = [coco, ...tail, ...got];
    let px = P.x, pz = P.z, ti2 = trail.length - 1, lx = px, lz = pz;
    list.forEach((m, i) => {
      let needD = i === 0 ? 1.0 : i <= 2 ? 0.55 : 0.78;
      lx = px; lz = pz;
      while (ti2 >= 0 && needD > 0) {
        const p = trail[ti2], d = Math.hypot(p.x - px, p.z - pz);
        if (d >= needD) { const k = needD / d; px += (p.x - px) * k; pz += (p.z - pz) * k; needD = 0; } else { needD -= d; px = p.x; pz = p.z; ti2--; }
      }
      if (needD > 0) { pz += needD; } // 아직 걸은 길이 짧으면 뒤로 줄을 선다
      const y = i === 0 ? 0 : i <= 2 ? 0.2 : 0.36 + Math.sin(tNow * 5 + i) * 0.04;
      m.position.set(px, y, pz);
      if (i === 0) m.rotation.y = Math.atan2(lx - px, lz - pz);
    });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; tNow += dt;
    if (root) update(dt);
    jun.position.set(P.x, 0, P.z); jun.rotation.y = P.face;
    const sw = Math.sin(P.walk) * (P.walk ? 0.6 : 0);
    jun.legs[0].rotation.x = sw; jun.legs[1].rotation.x = -sw; jun.arms[0].rotation.x = -sw; jun.arms[1].rotation.x = sw;
    followers();
    const tx = P.x * 0.75, tz = P.z;
    camera.position.lerp(new T.Vector3(tx, 11.5, tz + 8.5), 0.12); camera.lookAt(camera.position.x, 0, camera.position.z - 9.5);
    for (let i = 0; i < RAIN; i++) { rainPos[i * 3 + 1] -= 13 * dt; if (rainPos[i * 3 + 1] < 0) rainPos[i * 3 + 1] = 14; }
    rainGeo.attributes.position.needsUpdate = true; rain.position.set(P.x, 0, P.z - 3);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.__island = { get state() { return state; }, get blocks() { return blocks; }, get want() { return need[idx]; }, P, setGoal: g => { goal = g; stuck = 0; } };
  const first = STORY.scenes.findIndex(s => !(Store.s.scenes[s.id] || {}).done);
  build(first < 0 ? 0 : first);
  camera.position.set(0, 11.5, P.z + 8.5);
  requestAnimationFrame(frame);
})();
