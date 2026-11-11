// 학습 기록 (localStorage) + 간격 반복(Leitner) 스케줄
const Store = (() => {
  const KEY = 'wordsnake.v1';
  const DAY = 86400000;
  const GAP = [0, 1, 2, 4, 7, 14, 30]; // 상자(box)별 다음 복습까지의 날 수
  const blank = () => ({ scenes: {}, lines: {}, words: {}, streak: 0, lastDay: '', spoken: 0, reviews: 0 });
  let s = blank();
  try { s = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  const day = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const touch = () => {
    const today = day();
    if (s.lastDay === today) return;
    s.streak = s.lastDay === day(Date.now() - DAY) ? s.streak + 1 : 1;
    s.lastDay = today;
  };
  return {
    get s() { return s; },
    key: (si, li) => `${STORY.scenes[si].id}-${li}`,
    line(si, li) { return s.lines[this.key(si, li)]; },
    unlockedCount(si) { return STORY.scenes[si].lines.filter((_, li) => this.line(si, li)).length; },
    sceneOpen(si) { return si === 0 || !!(s.scenes[STORY.scenes[si - 1].id] || {}).done; },
    learnWord(en) { s.words[en] = (s.words[en] || 0) + 1; save(); },
    unlockLine(si, li) {
      touch();
      const k = this.key(si, li);
      if (!s.lines[k]) s.lines[k] = { box: 1, due: Date.now() + DAY, right: 0, wrong: 0 };
      save();
    },
    finishScene(si, stars) {
      const id = STORY.scenes[si].id, cur = s.scenes[id] || {};
      s.scenes[id] = { done: true, stars: Math.max(stars, cur.stars || 0) };
      save();
    },
    // 복습할 때가 된 문장들 (오래된 것부터)
    due(all) {
      const out = [];
      STORY.scenes.forEach((sc, si) => sc.lines.forEach((_, li) => {
        const r = this.line(si, li);
        if (r && (all || r.due <= Date.now())) out.push({ si, li, r });
      }));
      return out.sort((a, b) => a.r.due - b.r.due);
    },
    review(si, li, ok) {
      touch();
      const r = this.line(si, li); if (!r) return;
      if (ok) { r.right++; r.box = Math.min(r.box + 1, GAP.length - 1); } else { r.wrong++; r.box = 1; }
      r.due = Date.now() + GAP[r.box] * DAY;
      s.reviews++;
      save();
    },
    spoke() { s.spoken++; save(); },
    reset() { s = blank(); save(); },
  };
})();
