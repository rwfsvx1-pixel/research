// 2D 게임과 3D 블록 섬이 함께 쓰는 화면 부품
const $app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'on';
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.className = ''; }, 2600);
}
function modal(html) {
  const m = el(`<div class="modal"><div class="card">${html}</div></div>`);
  $app.appendChild(m);
  return m;
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

