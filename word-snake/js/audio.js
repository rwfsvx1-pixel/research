// 듣기(TTS) · 말하기(녹음 + 가능하면 발음 인식) · 공유(카톡 등) · 효과음
const Sound = (() => {
  const synth = window.speechSynthesis;
  let voice = null;
  const pick = () => {
    if (!synth) return;
    const vs = synth.getVoices().filter(v => /^en[-_]/i.test(v.lang));
    voice = vs.find(v => /en[-_]US/i.test(v.lang) && /Google|Samantha|Natural|Aria|Jenny/i.test(v.name))
      || vs.find(v => /en[-_]US/i.test(v.lang)) || vs[0] || null;
  };
  if (synth) { pick(); synth.onvoiceschanged = pick; }

  function speak(text, rate = 0.9) {
    return new Promise(res => {
      if (!synth) return res();
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = rate; if (voice) u.voice = voice;
      const t = setTimeout(res, 1500 + text.length * 140); // onend가 안 오는 브라우저 대비
      u.onend = u.onerror = () => { clearTimeout(t); res(); };
      synth.speak(u);
    });
  }
  const hush = () => synth && synth.cancel();

  let ac = null;
  const ctx = () => ac || (ac = new (window.AudioContext || window.webkitAudioContext)());
  function beep(freqs, dur = 0.09, type = 'sine') {
    try {
      const a = ctx(); let t = a.currentTime;
      freqs.forEach(f => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur); t += dur * 0.8;
      });
    } catch (e) {}
  }
  const sfx = {
    eat: () => beep([660, 880]), bad: () => beep([200, 150], 0.14, 'square'),
    miss: () => beep([300], 0.12, 'triangle'), win: () => beep([523, 659, 784, 1047], 0.13),
  };

  // --- 녹음 ---
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  // 모바일에서는 녹음과 음성 인식이 마이크를 두고 충돌하므로 녹음만 한다.
  const canScore = !!SR && !mobile;
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  let rec = null, stream = null, chunks = [], sr = null, heard = '';

  async function recStart() {
    hush();
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = []; heard = '';
    rec = new MediaRecorder(stream);
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.start();
    if (canScore) {
      try {
        sr = new SR(); sr.lang = 'en-US'; sr.interimResults = false;
        sr.onresult = e => { heard = Array.from(e.results).map(r => r[0].transcript).join(' '); };
        sr.onerror = () => {};
        sr.start();
      } catch (e) { sr = null; }
    }
  }
  async function recStop() {
    if (!rec) return null;
    const r = rec; rec = null;
    await new Promise(res => { r.onstop = res; r.stop(); });
    stream.getTracks().forEach(t => t.stop());
    if (sr) { const x = sr; sr = null; await new Promise(res => { x.onend = res; setTimeout(res, 1200); try { x.stop(); } catch (e) { res(); } }); }
    const raw = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
    let blob = raw, ext = /mp4|aac/.test(raw.type) ? 'm4a' : /ogg/.test(raw.type) ? 'ogg' : 'webm';
    try { blob = await toWav(raw); ext = 'wav'; } catch (e) {} // 어디서나 재생되도록 WAV로 변환
    return { blob, ext, heard };
  }
  async function toWav(blob) {
    const buf = await ctx().decodeAudioData(await blob.arrayBuffer());
    const d = buf.getChannelData(0), n = d.length;
    const v = new DataView(new ArrayBuffer(44 + n * 2));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 0x7fff, true);
    return new Blob([v], { type: 'audio/wav' });
  }
  // 목표 문장의 단어를 몇 개나 알아들었는지 (0~1)
  function score(target, said) {
    const norm = s => s.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/).filter(Boolean);
    const t = norm(target), h = norm(said);
    if (!t.length) return 0;
    return t.filter(w => { const i = h.indexOf(w); if (i < 0) return false; h.splice(i, 1); return true; }).length / t.length;
  }

  // --- 공유: 휴대폰에서는 공유 창에서 카카오톡을 고르면 된다 ---
  async function share({ text, blob, ext }) {
    const data = { title: 'Word Snake', text };
    if (blob) {
      const file = new File([blob], `my-english.${ext}`, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ ...data, files: [file] }); return 'shared'; }
        catch (e) { if (e.name === 'AbortError') return 'cancel'; }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      return 'saved';
    }
    if (navigator.share) {
      try { await navigator.share(data); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancel'; }
    }
    try { await navigator.clipboard.writeText(text); return 'copied'; } catch (e) { return 'fail'; }
  }

  return { speak, hush, sfx, recStart, recStop, score, share, canRecord, canScore, unlock: () => { try { ctx().resume(); } catch (e) {} } };
})();
