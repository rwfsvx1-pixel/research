// 화면 구성: 홈 → 모험(게임) → 이야기책 → 복습 → 기록
const $app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let game = null, cleanup = null;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'on';
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.className = ''; }, 2600);
}
function screen(html) {
  if (game) { game.destroy(); game = null; }
  if (cleanup) { cleanup(); cleanup = null; }
  Sound.hush();
  $app.innerHTML = html;
  $app.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  return $app;
}
function go(where) {
  const [name, arg] = where.split(':');
  ({ home, map, book, review, record, play: () => play(+arg), scene: () => sceneView(+arg) })[name]();
}
function modal(html) {
  const m = el(`<div class="modal"><div class="card">${html}</div></div>`);
  $app.appendChild(m);
  return m;
}

// 장면 그림: 완성한 대사 수만큼 그림 조각이 나타난다
function artHTML(si, count, pop = -1, cls = '') {
  const sc = STORY.scenes[si];
  const bits = sc.lines.slice(0, count).map((l, i) =>
    `<span class="${i === pop ? 'pop' : ''}" style="left:${l.art[1]}%;top:${l.art[2]}%;font-size:${l.art[3]}px">${l.art[0]}</span>`).join('');
  return `<div class="art ${cls}" style="background:linear-gradient(${sc.bg[0]},${sc.bg[1]})">
    <i style="background:${sc.ground}"></i>${bits}
    <span style="left:28%;top:74%;font-size:52px">🧒</span><span style="left:66%;top:78%;font-size:46px">🐍</span>
    ${count < sc.lines.length ? `<b>${count}/${sc.lines.length}</b>` : ''}</div>`;
}
function bubble(line, extra = '') {
  const ch = STORY.chars[line.who];
  return `<div class="bub ${line.who}" ${extra}><em>${ch.emoji}</em><div><small>${ch.name}</small><p>${esc(line.en)}</p><span>${esc(line.ko)}</span></div></div>`;
}

// 듣기 · 따라 말하기 · 내 목소리 보내기 패널
function speakPanel(text) {
  const p = el(`<div class="speak">
    <div class="row"><button class="btn sm" data-a="listen">🔊 듣기</button><button class="btn sm" data-a="slow">🐢 천천히</button>
    <button class="btn sm mic" data-a="mic">🎤 따라 말하기</button></div><div class="fb"></div></div>`);
  const fb = p.querySelector('.fb'), mic = p.querySelector('.mic');
  let on = false, timer = null, last = null;
  p.querySelector('[data-a=listen]').onclick = () => Sound.speak(text);
  p.querySelector('[data-a=slow]').onclick = () => Sound.speak(text, 0.6);
  const stop = async () => {
    clearTimeout(timer); on = false; mic.textContent = '🎤 다시 말하기'; mic.classList.remove('rec');
    last = await Sound.recStop(); if (!last) return;
    Store.spoke();
    const url = URL.createObjectURL(last.blob);
    let msg = '녹음했어요! 내 목소리를 들어 보세요.';
    if (Sound.canScore) {
      const sc = Sound.score(text, last.heard || '');
      msg = sc >= 0.8 ? '⭐⭐⭐ 완벽해요!' : sc >= 0.5 ? '⭐⭐ 잘했어요! 한 번 더 해볼까요?' : '⭐ 조금 더 또박또박 말해 봐요.';
      if (last.heard) msg += `<br><small>이렇게 들렸어요: “${esc(last.heard)}”</small>`;
    }
    fb.innerHTML = `<p>${msg}</p><audio controls src="${url}"></audio><button class="btn sm kakao">💬 카톡으로 보내기</button>`;
    fb.querySelector('.kakao').onclick = async () => {
      const r = await Sound.share({ text: `🐍 영어로 말했어요: "${text}"`, blob: last.blob, ext: last.ext });
      if (r === 'saved') toast('녹음 파일을 저장했어요. 카톡 채팅방에서 파일로 보내세요!');
    };
  };
  mic.onclick = async () => {
    if (on) return stop();
    if (!Sound.canRecord) return toast('이 브라우저에서는 녹음을 할 수 없어요. 크롬이나 사파리로 열어 주세요.');
    try { await Sound.recStart(); } catch (e) { return toast('마이크를 쓸 수 있게 허락해 주세요.'); }
    on = true; mic.textContent = '⏹ 다 말했어요'; mic.classList.add('rec'); fb.innerHTML = '<p>듣고 있어요… 🎧</p>';
    timer = setTimeout(stop, 8000);
  };
  return p;
}

// ---------- 홈 ----------
function home() {
  const s = Store.s, due = Store.due().length, learned = Object.keys(s.lines).length;
  const next = STORY.scenes.findIndex((sc, i) => !(s.scenes[sc.id] || {}).done);
  screen(`<div class="page home">
    <div class="hero"><div class="logo">🐍🌧️</div><h1>${STORY.titleKo}</h1><p>Word Snake · ${STORY.title}</p>
      ${s.streak ? `<div class="chip">🔥 ${s.streak}일째 영어 모험 중</div>` : ''}</div>
    <button class="btn big go" data-go="${next < 0 ? 'map' : 'play:' + next}">▶ ${learned ? (next < 0 ? '다시 모험하기' : '모험 이어 하기') : '모험 시작!'}</button>
    <div class="grid">
      <button class="tile" data-go="map">🗺️<b>장면 고르기</b></button>
      <button class="tile" data-go="book">📖<b>이야기책</b></button>
      <button class="tile" data-go="review">🧠<b>기억 복습</b>${due ? `<i>${due}</i>` : ''}</button>
      <button class="tile" data-go="record">📊<b>학습 기록</b></button>
    </div>
    <p class="how">하늘에서 떨어지는 낱말을 <b>순서대로</b> 먹으면 뱀의 몸이 문장이 돼요.<br>문장을 완성할 때마다 이야기의 한 장면이 채워져요!</p>
  </div>`);
}

// ---------- 장면 고르기 ----------
function map() {
  const cards = STORY.scenes.map((sc, i) => {
    const open = Store.sceneOpen(i), st = (Store.s.scenes[sc.id] || {}).stars || 0;
    return `<button class="scard ${open ? '' : 'lock'}" ${open ? `data-go="play:${i}"` : 'disabled'}>
      <span class="em">${open ? sc.emoji : '🔒'}</span><div><b>${i + 1}. ${sc.titleKo}</b><small>${sc.title}</small></div>
      <span class="st">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</span></button>`;
  }).join('');
  screen(`<div class="page"><header><button class="back" data-go="home">←</button><h2>장면 고르기</h2></header>${cards}</div>`);
}

// ---------- 게임 ----------
function play(si) {
  const sc = STORY.scenes[si];
  // 방해 낱말 후보: 이 장면까지 나온 모든 낱말
  const upto = STORY.scenes.slice(0, si + 1);
  const wordPool = [...new Set(upto.flatMap(x => x.words.map(w => w.en)))];
  const linePool = [...new Set(upto.flatMap(x => x.lines.flatMap(l => l.en.split(' '))))];
  const tasks = [
    ...sc.words.map(w => ({ type: 'word', w, need: [w.en] })),
    ...sc.lines.map((line, li) => ({ type: 'line', line, li, need: line.en.split(' ') })),
  ];
  let ti = 0, hearts = 5, slips = 0, total = 0;

  screen(`<div class="play">
    <div class="hud"><button class="back" data-go="map">←</button><div class="hearts"></div><div class="prog"></div></div>
    <div class="prompt"></div>
    <canvas></canvas>
  </div>`);
  const $hearts = $app.querySelector('.hearts'), $prog = $app.querySelector('.prog'), $prompt = $app.querySelector('.prompt');
  const hud = () => {
    $hearts.textContent = '❤️'.repeat(hearts) + '🤍'.repeat(5 - hearts);
    $prog.innerHTML = tasks.map((t, i) => `<i class="${i < ti ? 'd' : i === ti ? 'c' : ''} ${t.type}"></i>`).join('');
  };
  const prompt = () => {
    const t = tasks[ti], n = game ? game.idx : 0;
    if (t.type === 'word') {
      $prompt.innerHTML = `<div class="q"><span class="big">${t.w.emoji}</span> <b>${t.w.ko}</b> <small>영어 낱말을 찾아 먹어요!</small></div>`;
    } else {
      const ch = STORY.chars[t.line.who];
      $prompt.innerHTML = `<div class="q"><button class="ear">🔊</button> ${ch.emoji} <b>${esc(t.line.ko)}</b></div>
        <div class="slots">${t.need.map((w, i) => `<span class="${i < n ? 'f' : i === n ? 'n' : ''}">${i < n ? esc(w) : '_'.repeat(Math.max(2, w.length))}</span>`).join('')}</div>`;
      $prompt.querySelector('.ear').onclick = () => Sound.speak(t.line.en);
    }
  };
  const startTask = () => {
    const t = tasks[ti]; slips = 0; hud();
    const first = t.type === 'line' && (ti === 0 || tasks[ti - 1].type === 'word');
    game.setTask(t.need, t.type === 'word' ? wordPool : linePool, { hint: si === 0, keepBody: t.type === 'word' && ti > 0 });
    prompt();
    if (t.type === 'line') { Sound.speak(t.line.en); if (first) toast('이제 낱말을 순서대로 먹어서 문장을 만들어요!'); }
  };
  const hurt = () => {
    hearts--; slips++; total++; hud();
    if (slips >= (tasks[ti].type === 'word' ? 1 : 2)) game.hint = true; // 헤매면 정답 낱말이 반짝인다
    if (hearts <= 0) {
      game.paused = true;
      const m = modal(`<div class="center"><div class="huge">☔</div><h3>괜찮아, 다시 해 보자!</h3><p>반짝이는 낱말을 따라가 봐요.</p><button class="btn big">다시 도전</button></div>`);
      m.querySelector('button').onclick = () => { m.remove(); hearts = 5; hud(); game.retry(); game.hint = true; prompt(); };
    }
  };
  const nextTask = () => {
    ti++;
    if (ti < tasks.length) return startTask();
    const stars = total <= 2 ? 3 : total <= 7 ? 2 : 1;
    Store.finishScene(si, stars); Sound.sfx.win();
    const last = si === STORY.scenes.length - 1;
    const m = modal(`<div class="center">${artHTML(si, sc.lines.length)}<h3>장면 완성! ${'⭐'.repeat(stars)}</h3>
      <p>“${sc.titleKo}” 이야기가 이야기책에 담겼어요.</p>
      <button class="btn big" data-x="story">📖 이야기 보기</button>
      <button class="btn" data-x="next">${last ? '🏠 처음으로' : '▶ 다음 장면'}</button></div>`);
    m.querySelector('[data-x=story]').onclick = () => sceneView(si, true);
    m.querySelector('[data-x=next]').onclick = () => last ? home() : play(si + 1);
  };

  game = new Game($app.querySelector('canvas'), {
    bg: sc.bg, ground: sc.ground,
    speed: 30 + si * 5, gap: Math.max(0.9, 1.5 - si * 0.1), maxDrops: 5 + Math.min(2, si),
    onEat: text => {
      Sound.sfx.eat(); prompt();
      if (tasks[ti].type === 'word') Sound.speak(text);
    },
    onWrong: () => { Sound.sfx.bad(); hurt(); },
    onMiss: () => { Sound.sfx.miss(); hurt(); },
    onDone: () => {
      const t = tasks[ti];
      hearts = Math.min(5, hearts + 1);
      if (t.type === 'word') {
        Store.learnWord(t.w.en);
        toast(`${t.w.emoji} ${t.w.en} = ${t.w.ko}`);
        return setTimeout(nextTask, 700);
      }
      Store.unlockLine(si, t.li);
      Sound.speak(t.line.en);
      const m = modal(`${artHTML(si, t.li + 1, t.li)}<p class="tag">✨ 그림 조각을 얻었어요!</p>${bubble(t.line)}<div class="sp"></div>
        <button class="btn big">다음 ➡</button>`);
      m.querySelector('.sp').appendChild(speakPanel(t.line.en));
      m.querySelector('.btn.big').onclick = async () => { await Sound.recStop(); Sound.hush(); m.remove(); nextTask(); };
    },
  });
  hud();

  // 시작 전: 장면 소개 + 오늘의 낱말 미리 듣기
  const m = modal(`<div class="center"><div class="huge">${sc.emoji}</div><h3>${si + 1}. ${sc.titleKo}</h3><p>${sc.intro}</p>
    <div class="vocab">${sc.words.map(w => `<button data-w="${w.en}">${w.emoji}<b>${w.en}</b><small>${w.ko}</small></button>`).join('')}</div>
    <p class="dim">낱말을 눌러서 소리를 들어 봐요. 화면을 누르거나 방향키로 뱀을 움직여요.</p>
    <button class="btn big">시작!</button></div>`);
  m.querySelectorAll('[data-w]').forEach(b => { b.onclick = () => Sound.speak(b.dataset.w); });
  m.querySelector('.btn.big').onclick = () => { Sound.unlock(); m.remove(); startTask(); };
}

// ---------- 이야기책 ----------
function book() {
  const cards = STORY.scenes.map((sc, i) => {
    const n = Store.unlockedCount(i);
    return `<button class="bcard" ${n ? `data-go="scene:${i}"` : 'disabled'}>${artHTML(i, n, -1, 'mini')}
      <b>${i + 1}. ${n ? sc.titleKo : '???'}</b><small>${n ? sc.title : '아직 만나지 못한 장면'}</small></button>`;
  }).join('');
  screen(`<div class="page"><header><button class="back" data-go="home">←</button><h2>이야기책</h2></header>
    <p class="dim">내가 만든 문장들이 모여 하나의 이야기가 돼요.</p><div class="shelf">${cards}</div></div>`);
}

function sceneView(si, autoplay) {
  const sc = STORY.scenes[si], n = Store.unlockedCount(si);
  const rows = sc.lines.map((l, li) => Store.line(si, li) ? bubble(l, `data-li="${li}"`)
    : `<div class="bub lock"><em>🔒</em><div><p>아직 완성하지 못한 대사</p></div></div>`).join('');
  screen(`<div class="page"><header><button class="back" data-go="book">←</button><h2>${si + 1}. ${sc.titleKo}</h2></header>
    ${artHTML(si, n)}<p class="narr">${sc.intro}</p>
    <div class="row"><button class="btn sm" id="all">▶ 전체 듣기</button><button class="btn sm" id="role">🎭 역할놀이</button><button class="btn sm kakao" id="send">💬 이야기 보내기</button></div>
    <div class="lines">${rows}</div><div id="sp"></div></div>`);
  const bubs = [...$app.querySelectorAll('.bub[data-li]')];
  let run = 0;
  cleanup = () => { run++; Sound.recStop(); };
  const mark = b => { bubs.forEach(x => x.classList.toggle('on', x === b)); if (b) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  bubs.forEach(b => b.onclick = () => {
    run++; mark(b);
    const l = sc.lines[+b.dataset.li], sp = document.getElementById('sp');
    sp.innerHTML = ''; sp.appendChild(speakPanel(l.en));
    Sound.speak(l.en);
  });
  const playAll = async () => {
    const me = ++run;
    for (const b of bubs) { if (me !== run) return; mark(b); await Sound.speak(sc.lines[+b.dataset.li].en); await new Promise(r => setTimeout(r, 350)); }
    if (me === run) mark(null);
  };
  document.getElementById('all').onclick = playAll;
  document.getElementById('role').onclick = () => { run++; rolePlay(si); };
  document.getElementById('send').onclick = async () => {
    const text = `📖 ${sc.title} (${sc.titleKo})\n` + sc.lines.filter((_, li) => Store.line(si, li))
      .map(l => `${STORY.chars[l.who].emoji} ${STORY.chars[l.who].name}: ${l.en}`).join('\n') + '\n\n🐍 Word Snake에서 내가 만든 이야기예요!';
    const r = await Sound.share({ text });
    if (r === 'copied') toast('이야기를 복사했어요. 카톡에 붙여 넣어 보내세요!');
    if (r === 'fail') toast('이 브라우저에서는 보내기를 할 수 없어요.');
  };
  if (autoplay) playAll();
}

// 역할놀이: 한 사람 역을 맡아 상대의 말을 듣고 내 대사를 직접 말한다
function rolePlay(si) {
  const sc = STORY.scenes[si];
  const lines = sc.lines.filter((_, li) => Store.line(si, li));
  let me = 'J', i = 0;
  const m = modal('');
  const card = m.querySelector('.card');
  const step = () => {
    Sound.hush(); Sound.recStop();
    if (i >= lines.length) {
      card.innerHTML = `<div class="center"><div class="huge">👏</div><h3>대화 완성!</h3><p>이번에는 역할을 바꿔서 해 볼까요?</p>
        <button class="btn big" data-x="swap">🔄 역할 바꾸기</button><button class="btn" data-x="end">끝내기</button></div>`;
      card.querySelector('[data-x=swap]').onclick = () => { me = me === 'J' ? 'C' : 'J'; i = 0; step(); };
      card.querySelector('[data-x=end]').onclick = () => m.remove();
      return;
    }
    const l = lines[i], mine = l.who === me;
    card.innerHTML = `<p class="tag">🎭 나는 ${STORY.chars[me].emoji} ${STORY.chars[me].name}! (${i + 1}/${lines.length})</p>
      ${mine ? `<div class="turn">내 차례예요! 영어로 말해 봐요 🎤</div>` : ''}${bubble(l)}<div class="sp"></div>
      <div class="row"><button class="btn" data-x="end">그만</button><button class="btn big" data-x="next">다음 ➡</button></div>`;
    if (mine) card.querySelector('.sp').appendChild(speakPanel(l.en)); else Sound.speak(l.en);
    card.querySelector('[data-x=next]').onclick = () => { i++; step(); };
    card.querySelector('[data-x=end]').onclick = () => { Sound.hush(); Sound.recStop(); m.remove(); };
  };
  step();
}

// ---------- 기억 복습: 장면을 떠올리며 대사를 다시 만든다 ----------
function review() {
  let list = Store.due(), extra = false;
  if (!list.length) { list = shuffle(Store.due(true)).slice(0, 5); extra = true; }
  if (!list.length) {
    return screen(`<div class="page"><header><button class="back" data-go="home">←</button><h2>기억 복습</h2></header>
      <div class="center pad"><div class="huge">🌱</div><p>아직 복습할 문장이 없어요.<br>모험에서 문장을 먼저 만들어 봐요!</p><button class="btn big" data-go="play:0">모험 시작</button></div></div>`);
  }
  list = list.slice(0, 8);
  let i = 0, good = 0;
  const step = () => {
    if (i >= list.length) {
      Sound.sfx.win();
      return screen(`<div class="page"><div class="center pad"><div class="huge">🧠✨</div><h3>복습 끝!</h3><p>${list.length}문장 중 ${good}문장을 한 번에 기억했어요.</p>
        ${extra ? '' : '<p class="dim">기억한 문장은 며칠 뒤에, 헷갈린 문장은 내일 다시 만나요.</p>'}<button class="btn big" data-go="home">좋아요!</button></div></div>`);
    }
    const { si, li } = list[i], sc = STORY.scenes[si], l = sc.lines[li], ch = STORY.chars[l.who];
    const prev = li > 0 ? sc.lines[li - 1] : null;
    const words = l.en.split(' ');
    let tiles = shuffle(words.map((w, k) => ({ w, k })));
    if (words.length > 1 && tiles.every((t, k) => t.k === k)) tiles.reverse();
    let picked = [], wrong = false;
    screen(`<div class="page"><header><button class="back" data-go="home">←</button><h2>기억 복습 ${i + 1}/${list.length}</h2></header>
      ${extra && i === 0 ? '<p class="dim">오늘 복습은 다 했어요! 연습 삼아 몇 문장만 더 해 봐요.</p>' : ''}
      ${artHTML(si, Store.unlockedCount(si), -1, 'mini wide')}
      <p class="narr">📍 ${sc.titleKo} — ${prev ? '이 말을 들은 다음…' : sc.intro}</p>
      ${prev ? bubble(prev) : ''}
      <div class="ask">${ch.emoji} <b>${ch.ko}</b>${ch.ko === '준' ? '은' : '는'} 뭐라고 했을까요?<br><span>${esc(l.ko)}</span></div>
      <div class="answer"></div><div class="tiles"></div><div class="after"></div></div>`);
    if (prev) Sound.speak(prev.en);
    const $ans = $app.querySelector('.answer'), $tiles = $app.querySelector('.tiles'), $after = $app.querySelector('.after');
    const paint = () => {
      $ans.innerHTML = picked.map(t => `<button data-k="${t.k}">${esc(t.w)}</button>`).join('') || '<small>낱말을 순서대로 눌러요</small>';
      $tiles.innerHTML = tiles.filter(t => !picked.includes(t)).map(t => `<button data-k="${t.k}">${esc(t.w)}</button>`).join('');
      $ans.querySelectorAll('button').forEach(b => b.onclick = () => { picked = picked.filter(t => t.k !== +b.dataset.k); paint(); });
      $tiles.querySelectorAll('button').forEach(b => b.onclick = () => { picked.push(tiles.find(t => t.k === +b.dataset.k)); paint(); check(); });
    };
    const check = () => {
      if (picked.length < words.length) return;
      if (picked.map(t => t.w).join(' ') !== l.en) {
        wrong = true; Sound.sfx.bad(); $ans.classList.add('no');
        setTimeout(() => { $ans.classList.remove('no'); picked = []; paint(); toast(`힌트: “${words[0]}”(으)로 시작해요`); }, 600);
        return;
      }
      Sound.sfx.eat(); if (!extra) Store.review(si, li, !wrong); // 미리 하는 연습은 복습 일정을 바꾸지 않는다
      if (!wrong) good++;
      $ans.classList.add('ok'); $tiles.innerHTML = '';
      $ans.querySelectorAll('button').forEach(b => b.disabled = true);
      $after.innerHTML = `<p class="tag">${wrong ? (extra ? '좋아요! 다시 떠올렸어요.' : '좋아요! 내일 한 번 더 만나요.') : '🎉 한 번에 기억했어요!'}</p>`;
      $after.appendChild(speakPanel(l.en));
      const nx = el('<button class="btn big">다음 ➡</button>');
      nx.onclick = async () => { await Sound.recStop(); i++; step(); };
      $after.appendChild(nx);
      Sound.speak(l.en);
      nx.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    paint();
  };
  step();
}

// ---------- 학습 기록 ----------
function record() {
  const s = Store.s, all = Store.due(true);
  const nScenes = Object.values(s.scenes).filter(x => x.done).length;
  const when = r => { const d = Math.ceil((r.due - Date.now()) / 86400000); return d <= 0 ? '오늘 복습' : `${d}일 뒤`; };
  const rows = all.sort((a, b) => a.si - b.si || a.li - b.li).map(({ si, li, r }) => {
    const l = STORY.scenes[si].lines[li];
    return `<div class="rec"><div><b>${esc(l.en)}</b><small>${esc(l.ko)}</small></div><div class="m"><span>${'●'.repeat(r.box)}${'○'.repeat(6 - r.box)}</span><small>${when(r)}</small></div></div>`;
  }).join('');
  screen(`<div class="page"><header><button class="back" data-go="home">←</button><h2>학습 기록</h2></header>
    <div class="stats">
      <div><b>${s.streak}</b>일 연속</div><div><b>${nScenes}</b>/${STORY.scenes.length} 장면</div>
      <div><b>${all.length}</b>/${STORY.scenes.length * 5} 문장</div><div><b>${Object.keys(s.words).length}</b> 낱말</div>
      <div><b>${s.spoken}</b>번 말하기</div><div><b>${s.reviews}</b>번 복습</div>
    </div>
    <h4>문장별 기억 정도 <small>(●가 많을수록 오래 기억하고 있어요)</small></h4>
    ${rows || '<p class="dim">아직 만든 문장이 없어요.</p>'}
    <button class="btn sm ghost" id="reset">기록 지우고 처음부터</button></div>`);
  document.getElementById('reset').onclick = () => { if (confirm('모든 기록을 지울까요?')) { Store.reset(); home(); } };
}

home();
