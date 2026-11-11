// AI 대화 연결: (1) Claude 아티팩트 안에서는 보는 사람의 Claude를 쓰고,
// (2) 그 밖에서는 설정에 넣은 내 서버(server/ 폴더의 프록시) 주소로 보낸다. 둘 다 없으면 대본 모드.
const AI = (() => {
  const CFG = 'sunnytown.ai';
  let sample = null, cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(CFG) || '{}'); } catch (e) {}
  const ready = (async () => {
    try { if (window.claude && window.claude.use) sample = await window.claude.use('sample'); } catch (e) { sample = null; }
  })();

  // 주민 한 명의 역할 설명서. 대화의 첫 user 메시지로 항상 함께 보낸다.
  function rules({ npc, kid, mission, due }) {
    return `You are role-playing ${npc.name}, ${npc.persona}, in "Sunny Town": a friendly English-speaking town inside a game that helps a Korean elementary school child (4th grade, about 10 years old) learn English by living there.

The child: name "${kid.name}"; likes: ${kid.likes.join(', ') || 'unknown'}.
What you remember about the child: ${kid.facts.length ? kid.facts.join('; ') : 'nothing yet (you just met)'}.
Situation: ${mission.scene}
Goal of this chat: ${mission.goal}.
Try to let the child naturally use: ${mission.targets.join(' / ')}.${due.length ? `\nIf it fits naturally, bring back these sentences the child learned before so they can use them again: ${due.join(' / ')}.` : ''}

Rules:
- Speak ONLY simple English: 1-2 short sentences, at most 10 words each, vocabulary a beginner knows. Stay in character: warm, playful, encouraging. Ask one easy question at a time.
- The child may answer in Korean, in broken English, or with one word. Always understand kindly and keep the story going. When the child's message was Korean or had a mistake, put the correct simple English sentence they meant in "fix"; otherwise "fix" is null. Never scold.
- Child safety: never ask for or repeat real personal details (address, phone, school name, full name, passwords). No scary, violent, romantic or grown-up topics. If the child brings up something unsafe or sad, respond with one caring sentence, suggest telling a parent or teacher, and return to the town story.
- After the goal is reached, or after about 5 child messages, say a warm goodbye and set "done" to true.

Reply with ONLY one JSON object, no other text:
{"say": "your line in English", "ko": "natural Korean translation of say", "fix": null or {"en": "the correct English sentence the child meant", "tip": "one short friendly tip in Korean"}, "suggest": [{"en": "something the child could say next, 3-7 words", "ko": "its Korean meaning"}, ... exactly 3, with different meanings], "facts": ["short English facts newly learned about the child, like 'likes pizza'; usually empty"], "done": false}

The chat starts now: the child has just arrived. Say your first line.`;
  }

  async function ask(messages) {
    await ready;
    if (sample) return sample.json(messages, { cache: false, modelTier: 'quick' });
    if (cfg.url) {
      const r = await fetch(cfg.url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-town-key': cfg.key || '' }, body: JSON.stringify({ messages }) });
      if (!r.ok) throw { code: 'http_' + r.status };
      const text = (await r.json()).text || '';
      const a = text.indexOf('{'), b = text.lastIndexOf('}');
      if (a < 0 || b < a) throw { code: 'invalid_json' };
      return JSON.parse(text.slice(a, b + 1));
    }
    throw { code: 'no_ai' };
  }

  // 한 번의 대화를 맡는 객체: next(아이의 말)을 부를 때마다 주민의 다음 대사를 돌려준다
  function chat(ctx) {
    const turns = [{ role: 'user', content: rules(ctx) }];
    return {
      async next(kidText) {
        if (kidText != null) turns.push({ role: 'user', content: 'Child: ' + String(kidText).slice(0, 300) });
        const out = await ask(turns);
        if (!out || typeof out.say !== 'string' || !out.say.trim()) throw { code: 'invalid_json' };
        turns.push({ role: 'assistant', content: JSON.stringify({ say: out.say, done: !!out.done }) });
        return {
          say: out.say.trim(), ko: typeof out.ko === 'string' ? out.ko : '',
          fix: out.fix && typeof out.fix.en === 'string' ? { en: out.fix.en, tip: String(out.fix.tip || '') } : null,
          opts: (Array.isArray(out.suggest) ? out.suggest : []).filter(s => s && typeof s.en === 'string').slice(0, 3).map(s => ({ en: s.en, ko: String(s.ko || '') })),
          facts: (Array.isArray(out.facts) ? out.facts : []).filter(f => typeof f === 'string').slice(0, 3),
          done: !!out.done,
        };
      },
    };
  }

  return {
    ready, chat,
    get on() { return !!sample || !!cfg.url; },
    get kind() { return sample ? 'claude' : cfg.url ? 'server' : 'none'; },
    get cfg() { return cfg; },
    setServer(url, key) { cfg = { url: url.trim(), key: key.trim() }; try { localStorage.setItem(CFG, JSON.stringify(cfg)); } catch (e) {} },
  };
})();
