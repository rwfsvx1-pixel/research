// 써니타운: 영어만 쓰는 마을에서 하루하루 살아가는 게임
(() => {
  const KEY = 'sunnytown.v1', DAY = 86400000, GAP = [0, 1, 2, 4, 7, 14, 30];
  const blank = () => ({ name: '', avatar: '🧒', likes: [], facts: [], day: 1, done: {}, hearts: {}, items: [], phrases: {}, chats: 0, rewards: [], told: {} });
  let S = blank();
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const likeOf = i => TOWN.likes.find(l => l.en === S.likes[i]) || TOWN.likes[i];
  const fill = s => String(s).replace(/\{name\}/g, S.name).replace(/\{like(\d)(ko)?\}/g, (_, n, ko) => likeOf(n - 1)[ko ? 'ko' : 'en']);
  const norm = s => s.toLowerCase().replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();

  // 오늘의 일: 3일째까지는 준비된 이야기, 그다음부터는 AI가 있을 때 날마다 새 이야깃거리
  function missionsOf(day) {
    const fixed = TOWN.missions.filter(m => m.day === day);
    if (fixed.length || !AI.on) return fixed;
    const ids = Object.keys(TOWN.npcs);
    return [0, 1].map(i => {
      const id = ids[(day + i) % ids.length], npc = TOWN.npcs[id], tp = TOWN.topics[(day * 2 + i) % TOWN.topics.length];
      return { id: `f${day}-${i}`, day, npc: id, place: npc.place, gift: TOWN.gifts[(day + i) % TOWN.gifts.length], title: `${npc.ko}와 ${tp.ko}`,
        scene: `An ordinary day in Sunny Town. ${npc.name} meets the child at the ${TOWN.places[npc.place].name}.`,
        goal: `have a short friendly chat about ${tp.t}, connecting it to what you remember about the child`, targets: ['any short simple sentences'] };
    });
  }
  const today = () => missionsOf(S.day);
  const pending = () => today().filter(m => !S.done[m.id]);
  const duePhrases = () => Object.entries(S.phrases).filter(([, p]) => p.due <= Date.now()).sort((a, b) => a[1].due - b[1].due).slice(0, 3).map(([en]) => en);
  function learn(en, ko, npc) {
    const p = S.phrases[en] || (S.phrases[en] = { ko: ko || '', n: 0, box: 0, npc });
    p.n++; if (ko && !p.ko) p.ko = ko;
    p.box = Math.min(p.box + 1, GAP.length - 1); p.due = Date.now() + GAP[p.box] * DAY;
  }

  function nav(cur) {
    const b = (id, e, t) => `<button class="${cur === id ? 'on' : ''}" data-nav="${id}">${e}<small>${t}</small></button>`;
    return `<nav class="tabs">${b('town', '🏘️', '마을')}${b('room', '🏠', '내 방')}${b('book', '📒', '내 표현')}${b('gift', '🎁', '약속')}</nav>`;
  }
  function page(html, cur) {
    Sound.hush();
    $app.innerHTML = `<div class="page vpage">${html}</div>${cur ? nav(cur) : ''}`;
    $app.querySelectorAll('[data-nav]').forEach(b => { b.onclick = () => ({ town, room, book, gift })[b.dataset.nav](); });
    return $app.firstElementChild;
  }
  function confirmBox(msg, yes, fn) {
    const m = modal(`<div class="center"><p>${msg}</p><div class="row"><button class="btn" data-x="no">취소</button><button class="btn big" data-x="yes">${yes}</button></div></div>`);
    m.querySelector('[data-x=no]').onclick = () => m.remove();
    m.querySelector('[data-x=yes]').onclick = () => { m.remove(); fn(); };
  }

  // ---------- 처음: 이사 오기 ----------
  function welcome() {
    let avatar = S.avatar, likes = [];
    const p = page(`<div class="center pad2"><div class="huge">🏘️☀️</div><h1 class="vt">써니타운</h1>
      <p>영어만 쓰는 작은 마을로 이사 왔어요.<br>이웃과 이야기하며 하루하루 살아 봐요!</p>
      <label class="fld">마을에서 쓸 이름 <small>(영어로, 별명도 좋아요)</small><input id="nm" maxlength="12" placeholder="예: Jun, Mina" autocomplete="off"></label>
      <div class="fld">내 모습<div class="pick" id="av">${TOWN.avatars.map(a => `<button data-a="${a}">${a}</button>`).join('')}</div></div>
      <div class="fld">좋아하는 것 3가지<div class="pick wide" id="lk">${TOWN.likes.map(l => `<button data-l="${l.en}">${l.e} ${l.ko}</button>`).join('')}</div></div>
      <button class="btn big" id="go">이사 가기 🚚</button></div>`);
    const paint = () => {
      p.querySelectorAll('#av button').forEach(b => b.classList.toggle('on', b.dataset.a === avatar));
      p.querySelectorAll('#lk button').forEach(b => b.classList.toggle('on', likes.includes(b.dataset.l)));
    };
    p.querySelectorAll('#av button').forEach(b => { b.onclick = () => { avatar = b.dataset.a; paint(); }; });
    p.querySelectorAll('#lk button').forEach(b => { b.onclick = () => { const l = b.dataset.l; likes = likes.includes(l) ? likes.filter(x => x !== l) : likes.length < 3 ? [...likes, l] : likes; paint(); }; });
    p.querySelector('#go').onclick = () => {
      const name = p.querySelector('#nm').value.trim().replace(/[^A-Za-z .'-]/g, '');
      if (!name) return toast('영어 알파벳으로 이름을 써 주세요.');
      if (likes.length < 3) return toast('좋아하는 것을 3가지 골라 주세요.');
      Sound.unlock(); S.name = name; S.avatar = avatar; S.likes = likes; save(); town();
    };
    paint();
  }

  // ---------- 마을 ----------
  function town() {
    const ms = today(), pend = pending();
    const todo = ms.length ? ms.map(m => `<button class="todo ${S.done[m.id] ? 'ok' : ''}" data-m="${m.id}"><span>${S.done[m.id] ? '✅' : '⬜'}</span><b>${m.title}</b><em>${TOWN.npcs[m.npc].e}</em></button>`).join('')
      : `<p class="dim">준비된 이야기는 여기까지예요. AI 대화를 연결하면 날마다 새 이야기가 이어져요. (⚙️)</p>`;
    const places = Object.entries(TOWN.places).map(([id, pl]) => {
      const open = S.day >= pl.day, m = pend.find(x => x.place === id);
      const who = m ? TOWN.npcs[m.npc] : Object.values(TOWN.npcs).find(n => n.place === id);
      return `<button class="place ${open ? '' : 'lock'}" data-p="${id}"><span class="em">${open ? pl.e : '🔒'}</span><b>${pl.name}</b><small>${open ? pl.ko : `Day ${pl.day}에 열려요`}</small>
        ${open && who ? `<i class="who">${who.e}${m ? '<u>💬</u>' : ''}</i>` : ''}</button>`;
    }).join('');
    const p = page(`<header class="vh"><div><small>☀️ Day ${S.day} · ${TOWN.name}</small><h2>${S.avatar} ${esc(S.name)}</h2></div><button class="back" id="set">⚙️</button></header>
      <section class="box"><h4>오늘의 일 ${AI.on ? '<span class="ai">AI 대화</span>' : ''}</h4>${todo}
      ${ms.length && !pend.length ? '<p class="tag">오늘 할 일을 다 했어요! 내 방에서 잠을 자면 다음 날이 와요 🌙</p>' : ''}</section>
      <div class="places">${places}</div>`, 'town');
    p.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => { const m = ms.find(x => x.id === b.dataset.m); if (S.done[m.id]) toast('이미 끝낸 일이에요.'); else chat(m); }; });
    p.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => visit(b.dataset.p); });
    p.querySelector('#set').onclick = settings;
  }
  function visit(id) {
    const pl = TOWN.places[id];
    if (S.day < pl.day) return toast(`${pl.ko}은(는) Day ${pl.day}에 열려요.`);
    if (id === 'home') return room();
    const m = pending().find(x => x.place === id);
    if (m) return chat(m);
    const npcId = Object.keys(TOWN.npcs).find(k => TOWN.npcs[k].place === id);
    if (npcId && AI.on) {
      const npc = TOWN.npcs[npcId];
      return chat({ id: null, npc: npcId, place: id, title: `${npc.ko}와 수다 떨기`, scene: `The child drops by the ${pl.name} just to say hi.`, goal: 'have a short, fun small talk about anything the child likes', targets: ['any short simple sentences'] });
    }
    toast(npcId ? `${TOWN.npcs[npcId].ko}와 오늘 할 이야기는 다 했어요.` : '지금은 아무도 없어요.');
  }

  // ---------- 대화 ----------
  function chat(m) {
    const npc = TOWN.npcs[m.npc], hearts = S.hearts[m.npc] || 0;
    const ctx = { npc, mission: m, kid: { name: S.name, likes: S.likes, facts: S.facts.slice(-12) }, due: duePhrases() };
    let useAI = AI.on, ai = useAI ? AI.chat(ctx) : null, kidTurns = 0, busy = false, cur = null, closed = false;
    const p = page(`<header class="vh chat-h"><button class="back" id="bk">←</button><div><h2>${npc.e} ${npc.name} <small>${'💛'.repeat(Math.min(hearts, 5))}</small></h2><small>${TOWN.places[m.place].e} ${esc(m.title)}</small></div></header>
      <div class="msgs"></div><div class="reply"></div>`);
    p.classList.add('chat');
    const $msgs = p.querySelector('.msgs'), $reply = p.querySelector('.reply');
    p.querySelector('#bk').onclick = () => { closed = true; town(); };
    const add = node => { $msgs.appendChild(node); $msgs.scrollTop = $msgs.scrollHeight; return node; };

    function npcBubble(o) {
      const b = add(el(`<div class="mb n"><em>${npc.e}</em><div><p>${esc(o.say)}</p><span hidden>${esc(o.ko)}</span><div class="mt"><button data-a="say">🔊</button>${o.ko ? '<button data-a="ko">뜻 보기</button>' : ''}</div></div></div>`));
      b.querySelector('[data-a=say]').onclick = () => Sound.speak(o.say);
      const k = b.querySelector('[data-a=ko]'); if (k) k.onclick = () => { b.querySelector('span').hidden = false; k.remove(); };
      Sound.speak(o.say);
    }
    function scripted() {
      const t = m.turns && m.turns[kidTurns];
      if (t) return { say: fill(t.say), ko: fill(t.ko), opts: t.opts.map(o => ({ en: fill(o.en), ko: fill(o.ko), fact: o.fact && fill(o.fact) })), facts: [], done: false, fix: null };
      const e = m.end || { say: 'I have to go now. See you tomorrow!', ko: '이제 가 봐야 해. 내일 봐!' };
      return { say: fill(e.say), ko: fill(e.ko), opts: [], facts: [], done: true, fix: null };
    }
    async function npcTurn(kidText, kidBubble, picked) {
      busy = true; $reply.innerHTML = '';
      const dots = add(el(`<div class="mb n"><em>${npc.e}</em><div class="dots"><i></i><i></i><i></i></div></div>`));
      let o;
      if (useAI) {
        try { o = await ai.next(kidText); }
        catch (e) { useAI = false; toast(e && e.code === 'rate_limited' ? '잠깐 쉬었다가 다시 해요. 준비된 대화로 이어 갈게요.' : 'AI 연결이 안 돼서 준비된 대화로 이어 갈게요.'); }
      }
      if (closed) return;
      if (!o) o = scripted();
      dots.remove();
      if (kidText != null) {
        if (o.fix && norm(o.fix.en) !== norm(kidText)) {
          kidBubble.querySelector('div').appendChild(el(`<div class="fix">✨ 이렇게 말해요: <b>${esc(o.fix.en)}</b>${o.fix.tip ? `<small>${esc(o.fix.tip)}</small>` : ''}<button>🔊</button></div>`)).querySelector('button').onclick = () => Sound.speak(o.fix.en);
          learn(o.fix.en, '', m.npc);
        } else if (/^[\x20-\x7e]+$/.test(kidText) && /[a-z]/i.test(kidText)) learn(kidText, picked ? picked.ko : '', m.npc);
        (picked && picked.fact ? [picked.fact] : o.facts).forEach(f => { if (!S.facts.includes(f)) S.facts.push(f); });
        S.facts = S.facts.slice(-30); save();
      }
      if (kidTurns >= 8) o.done = true;
      cur = o; npcBubble(o); busy = false;
      if (o.done) finish(); else replyUI();
    }
    function send(text, picked) {
      if (busy) return;
      kidTurns++;
      const kb = add(el(`<div class="mb k"><div><p>${esc(text)}</p></div><em>${S.avatar}</em></div>`));
      npcTurn(text, kb, picked);
    }

    // 대답하기: (1) 하고 싶은 말을 고르면 낱말 조각으로 영어 문장을 만들고, (2) AI 모드에서는 직접 써도 된다
    function replyUI() {
      const chips = cur.opts.map((o, i) => `<button class="chip" data-i="${i}">💬 ${esc(o.ko || o.en)}</button>`).join('');
      $reply.innerHTML = `<small class="dim">${cur.opts.length ? '하고 싶은 말을 골라요' : '영어로 대답해 봐요'}</small><div class="chips">${chips}</div>
        ${useAI ? `<form class="typ"><input id="say" maxlength="120" autocomplete="off" placeholder="직접 쓰기 (한국어로 써도 도와줘요)"><button class="btn sm">보내기</button></form>` : ''}`;
      $reply.querySelectorAll('.chip').forEach(b => { b.onclick = () => tiles(cur.opts[+b.dataset.i]); });
      const f = $reply.querySelector('form');
      if (f) f.onsubmit = e => { e.preventDefault(); const v = f.querySelector('input').value.trim(); if (v) send(v, cur.opts.find(o => norm(o.en) === norm(v))); };
    }
    function tiles(opt) {
      const words = opt.en.split(' '); let tl = shuffle(words.map((w, k) => ({ w, k })));
      if (words.length > 1 && tl.every((t, k) => t.k === k)) tl.reverse();
      let picked = [], miss = 0;
      $reply.innerHTML = `<div class="ask2"><button class="x">✕</button>💬 ${esc(opt.ko)}<small class="peek"></small></div><div class="answer"></div><div class="tiles"></div>`;
      const $a = $reply.querySelector('.answer'), $t = $reply.querySelector('.tiles');
      $reply.querySelector('.x').onclick = replyUI;
      const paint = () => {
        $a.innerHTML = picked.map(t => `<button data-k="${t.k}">${esc(t.w)}</button>`).join('') || '<small>낱말을 순서대로 눌러 영어로 말해요</small>';
        $t.innerHTML = tl.filter(t => !picked.includes(t)).map(t => `<button data-k="${t.k}">${esc(t.w)}</button>`).join('');
        $a.querySelectorAll('button').forEach(b => { b.onclick = () => { picked = picked.filter(t => t.k !== +b.dataset.k); paint(); }; });
        $t.querySelectorAll('button').forEach(b => { b.onclick = () => { picked.push(tl.find(t => t.k === +b.dataset.k)); paint(); check(); }; });
      };
      const check = () => {
        if (picked.length < words.length) return;
        if (picked.map(t => t.w).join(' ') === opt.en) { Sound.sfx.eat(); return send(opt.en, opt); }
        Sound.sfx.bad(); $a.classList.add('no'); miss++;
        setTimeout(() => { $a.classList.remove('no'); picked = []; paint(); $reply.querySelector('.peek').textContent = miss >= 2 ? opt.en : `“${words[0]}”(으)로 시작해요`; }, 500);
      };
      paint();
    }
    function finish() {
      S.chats++;
      if (m.id) { S.done[m.id] = true; S.hearts[m.npc] = (S.hearts[m.npc] || 0) + 1; if (m.gift) S.items.push(m.gift); }
      save(); Sound.sfx.win();
      $reply.innerHTML = `<div class="endc">${m.id ? `<b>대화 완료! ${npc.ko}와 더 친해졌어요 💛</b>${m.gift ? `<span>선물을 받았어요: <i>${m.gift}</i> (내 방에 놓았어요)</span>` : ''}` : '<b>즐거운 수다였어요!</b>'}
        <div class="row"><button class="btn" id="bk2">📒 내 표현 보기</button><button class="btn big" id="ok">마을로 ➡</button></div></div>`;
      $reply.querySelector('#ok').onclick = town; $reply.querySelector('#bk2').onclick = book;
    }
    npcTurn(null);
  }

  // ---------- 내 방 ----------
  function room() {
    const pend = pending(), ms = today();
    const friends = Object.entries(TOWN.npcs).map(([id, n]) => `<div class="fr"><em>${n.e}</em><b>${n.name}</b><span>${'💛'.repeat(Math.min(S.hearts[id] || 0, 8)) || '<small>아직 못 만났어요</small>'}</span></div>`).join('');
    const p = page(`<header class="vh"><div><small>🏠 My Room</small><h2>${S.avatar} ${esc(S.name)}의 방</h2></div></header>
      <div class="roomv"><div class="shelf2">${S.items.map(i => `<span>${i}</span>`).join('') || '<small>이웃과 이야기하면 선물이 생겨요</small>'}</div><div class="floor"><span>🛏️</span><span class="me">${S.avatar}</span><span>🪟</span></div></div>
      <section class="box"><h4>이웃들</h4>${friends}</section>
      <section class="box"><h4>내가 한 이야기 <small>(이웃들이 기억해요)</small></h4><p class="dim">${S.facts.length ? S.facts.map(esc).join(' · ') : '아직 없어요.'}</p></section>
      <button class="btn big" id="sleep">🌙 잠자기 (다음 날로)</button>`, 'room');
    p.querySelector('#sleep').onclick = () => {
      if (pend.length) return toast(`아직 오늘 할 일이 ${pend.length}개 남았어요.`);
      if (!ms.length && !missionsOf(S.day + 1).length) return toast('다음 이야기는 AI 대화를 연결하면 이어져요. (마을 화면의 ⚙️)');
      S.day++; save();
      const m = modal(`<div class="center"><div class="huge">🌙 → ☀️</div><h3>Good morning, ${esc(S.name)}!</h3><p>Day ${S.day}이 밝았어요.</p><button class="btn big">일어나기</button></div>`);
      Sound.speak(`Good morning, ${S.name}!`);
      m.querySelector('button').onclick = () => { m.remove(); town(); };
    };
  }

  // ---------- 내 표현 ----------
  function book() {
    const list = Object.entries(S.phrases).sort((a, b) => a[1].due - b[1].due);
    const rows = list.map(([en, ph], i) => `<button class="rec ph" data-i="${i}"><div><b>${esc(en)}</b><small>${esc(ph.ko)}</small></div><div class="m"><span>${'●'.repeat(ph.box)}${'○'.repeat(6 - ph.box)}</span><small>${ph.n}번 말함</small></div></button>`).join('');
    const p = page(`<header class="vh"><div><small>📒 My Sentences</small><h2>내가 말한 표현 ${list.length}개</h2></div></header>
      <p class="dim">마을에서 내가 직접 말한 문장이에요. 눌러서 다시 듣고 따라 말해 봐요.<br>이웃들이 며칠 뒤에 이 표현을 다시 쓸 기회를 줄 거예요.</p>
      ${rows || '<p class="dim center pad2">아직 없어요. 이웃과 이야기해 봐요!</p>'}<div id="sp"></div>`, 'book');
    p.querySelectorAll('.ph').forEach(b => { b.onclick = () => {
      const en = list[+b.dataset.i][0], m = modal(`<h3>${esc(en)}</h3><p class="dim">${esc(list[+b.dataset.i][1].ko)}</p><div class="sp"></div><button class="btn">닫기</button>`);
      m.querySelector('.sp').appendChild(speakPanel(en)); Sound.speak(en);
      m.querySelector('.btn:last-child').onclick = async () => { await Sound.recStop(); Sound.hush(); m.remove(); };
    }; });
  }

  // ---------- 약속(보상): 부모님과 정한 목표를 이루면 카톡으로 알린다 ----------
  const KINDS = { chats: ['대화', '번 하기', () => S.chats], days: ['마을에서', '일 살기', () => S.day], phrases: ['표현', '개 말하기', () => Object.keys(S.phrases).length] };
  function gift() {
    const rows = S.rewards.map((r, i) => {
      const k = KINDS[r.kind], now = k[2](), ok = now >= r.n;
      return `<div class="rw ${ok ? 'ok' : ''}"><div><b>${k[0]} ${r.n}${k[1]}</b><span>🎁 ${esc(r.text)}</span><div class="bar"><i style="width:${Math.min(100, now / r.n * 100)}%"></i></div><small>${Math.min(now, r.n)} / ${r.n}</small></div>
        <div class="rwb">${ok ? `<button class="btn sm kakao" data-t="${i}">💬 ${S.told[r.id] ? '다시 알리기' : '달성! 알리기'}</button>` : ''}<button class="btn sm ghost" data-d="${i}">지우기</button></div></div>`;
    }).join('');
    const p = page(`<header class="vh"><div><small>🎁 Promises</small><h2>선물 약속</h2></div></header>
      <p class="dim">부모님과 함께 목표와 선물을 정해요. 목표를 이루면 카톡으로 알릴 수 있어요.</p>
      ${rows || '<p class="dim center">아직 약속이 없어요.</p>'}
      <section class="box"><h4>새 약속 만들기 <small>(부모님과 함께)</small></h4>
        <div class="newr"><select id="rk"><option value="chats">대화 ○번 하기</option><option value="days">마을에서 ○일 살기</option><option value="phrases">표현 ○개 말하기</option></select>
        <input id="rn" type="number" min="1" max="999" value="10" aria-label="목표 숫자"><input id="rt" maxlength="30" placeholder="선물 (예: 아이스크림)"></div>
        <button class="btn" id="add">약속 추가</button></section>`, 'gift');
    p.querySelector('#add').onclick = () => {
      const n = Math.floor(+p.querySelector('#rn').value), text = p.querySelector('#rt').value.trim();
      if (!(n > 0) || !text) return toast('목표 숫자와 선물을 써 주세요.');
      S.rewards.push({ id: 'r' + Date.now(), kind: p.querySelector('#rk').value, n, text }); save(); gift();
    };
    p.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => confirmBox('이 약속을 지울까요?', '지우기', () => { S.rewards.splice(+b.dataset.d, 1); save(); gift(); }); });
    p.querySelectorAll('[data-t]').forEach(b => { b.onclick = async () => {
      const r = S.rewards[+b.dataset.t], k = KINDS[r.kind];
      const best = Object.keys(S.phrases).slice(-3).map(e => `· ${e}`).join('\n');
      const text = `🎉 ${S.name}(이)가 써니타운에서 목표를 이뤘어요!\n✅ ${k[0]} ${r.n}${k[1]}\n🎁 약속한 선물: ${r.text}\n\n요즘 영어로 이런 말을 해요:\n${best || '· (아직 없음)'}\n\n(Day ${S.day} · 대화 ${S.chats}번 · 표현 ${Object.keys(S.phrases).length}개)`;
      const res = await Sound.share({ text });
      if (res === 'copied') toast('내용을 복사했어요. 카톡에 붙여 넣어 보내세요!');
      if (res === 'fail') { const m = modal(`<p class="dim">아래 내용을 길게 눌러 복사해서 카톡으로 보내세요.</p><textarea readonly rows="9" style="width:100%">${esc(text)}</textarea><button class="btn">닫기</button>`); m.querySelector('button').onclick = () => m.remove(); }
      if (res !== 'cancel') { S.told[r.id] = true; save(); if (res === 'shared') gift(); }
    }; });
  }

  // ---------- 설정 ----------
  function settings() {
    const kind = { claude: '연결됨 (Claude)', server: '연결됨 (내 서버)', none: '연결 안 됨 · 준비된 대본으로 대화해요' }[AI.kind];
    const m = modal(`<h3>⚙️ 설정</h3><p><b>AI 대화:</b> ${kind}</p>
      <p class="dim">AI가 연결되면 이웃이 내 말을 알아듣고 자유롭게 대답해요. 한국어로 써도 영어로 어떻게 말하는지 알려 줘요.</p>
      <label class="fld">AI 서버 주소<input id="u" placeholder="https://..." value="${esc(AI.cfg.url || '')}"></label>
      <label class="fld">서버 암호<input id="k" value="${esc(AI.cfg.key || '')}"></label>
      <div class="row"><button class="btn" id="sv">저장</button><button class="btn" id="cl">닫기</button></div>
      <button class="btn sm ghost" id="rs">처음부터 다시 (기록 지우기)</button>`);
    m.querySelector('#cl').onclick = () => m.remove();
    m.querySelector('#sv').onclick = () => { AI.setServer(m.querySelector('#u').value, m.querySelector('#k').value); m.remove(); toast('저장했어요.'); town(); };
    m.querySelector('#rs').onclick = () => { m.remove(); confirmBox('마을 기록을 모두 지우고 처음부터 시작할까요?', '지우기', () => { S = blank(); save(); welcome(); }); };
  }

  window.__town = { get S() { return S; } };
  const boot = () => (S.name ? town() : welcome());
  boot();
  AI.ready.then(() => { if (AI.on && S.name && $app.querySelector('.places')) town(); });
})();
