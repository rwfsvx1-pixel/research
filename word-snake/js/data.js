// 이야기 데이터: 장면(scene) → 단어(words) → 대사(lines)
// 뒤 장면으로 갈수록 문장이 길어지고 표현이 복잡해진다.
// art: [이모지, x%, y%, 크기px] — 대사를 하나 완성할 때마다 그림 조각이 하나씩 채워진다.
const STORY = {
  title: 'Coco and the Rainy Day',
  titleKo: '코코와 비 오는 날',
  chars: {
    J: { name: 'Jun', ko: '준', emoji: '🧒' },
    C: { name: 'Coco', ko: '코코', emoji: '🐍' },
  },
  scenes: [
    {
      id: 's1', emoji: '🌧️', title: 'A Rainy Day', titleKo: '비 오는 날',
      bg: ['#5b7fa8', '#9db8d2'], ground: '#5f8f5a',
      intro: '비가 주룩주룩 오는 날, 준은 풀숲에서 작은 뱀을 만났어요.',
      words: [
        { en: 'hello', ko: '안녕', emoji: '👋' },
        { en: 'rain', ko: '비', emoji: '🌧️' },
        { en: 'snake', ko: '뱀', emoji: '🐍' },
        { en: 'name', ko: '이름', emoji: '📛' },
        { en: 'friend', ko: '친구', emoji: '🤝' },
      ],
      lines: [
        { who: 'J', en: 'Hello!', ko: '안녕!', art: ['☁️', 22, 14, 54] },
        { who: 'C', en: 'I am Coco.', ko: '나는 코코야.', art: ['🌧️', 68, 16, 54] },
        { who: 'C', en: 'What is your name?', ko: '네 이름은 뭐야?', art: ['🌿', 86, 74, 40] },
        { who: 'J', en: 'My name is Jun.', ko: '내 이름은 준이야.', art: ['☂️', 22, 40, 50] },
        { who: 'C', en: 'Nice to meet you, Jun.', ko: '만나서 반가워, 준.', art: ['💛', 45, 44, 34] },
      ],
    },
    {
      id: 's2', emoji: '🍎', title: 'Hungry Coco', titleKo: '배고픈 코코',
      bg: ['#f6c56b', '#fde9b8'], ground: '#c98f4e',
      intro: '코코의 배에서 꼬르륵 소리가 났어요. 준은 가방을 열어 보았어요.',
      words: [
        { en: 'hungry', ko: '배고픈', emoji: '😋' },
        { en: 'apple', ko: '사과', emoji: '🍎' },
        { en: 'banana', ko: '바나나', emoji: '🍌' },
        { en: 'milk', ko: '우유', emoji: '🥛' },
        { en: 'like', ko: '좋아하다', emoji: '❤️' },
      ],
      lines: [
        { who: 'J', en: 'Are you hungry?', ko: '배고프니?', art: ['🎒', 8, 74, 40] },
        { who: 'C', en: 'Yes, I am hungry.', ko: '응, 배고파.', art: ['💭', 74, 38, 40] },
        { who: 'J', en: 'Do you like apples?', ko: '사과 좋아해?', art: ['🍎', 42, 70, 40] },
        { who: 'C', en: 'I like apples very much.', ko: '나는 사과를 아주 좋아해.', art: ['🍌', 52, 78, 36] },
        { who: 'C', en: "But I don't like milk.", ko: '하지만 우유는 안 좋아해.', art: ['🥛', 88, 72, 38] },
      ],
    },
    {
      id: 's3', emoji: '🏠', title: 'My House', titleKo: '우리 집',
      bg: ['#8fd3f4', '#d9f2ff'], ground: '#7cb86a',
      intro: '준은 코코를 집으로 데려갔어요. 코코는 눈이 휘둥그레졌어요.',
      words: [
        { en: 'house', ko: '집', emoji: '🏠' },
        { en: 'room', ko: '방', emoji: '🚪' },
        { en: 'bed', ko: '침대', emoji: '🛏️' },
        { en: 'big', ko: '큰', emoji: '🐘' },
        { en: 'small', ko: '작은', emoji: '🐭' },
      ],
      lines: [
        { who: 'J', en: 'This is my house.', ko: '여기가 우리 집이야.', art: ['🏠', 48, 30, 84] },
        { who: 'C', en: 'Wow, it is very big!', ko: '와, 정말 크다!', art: ['🌳', 88, 44, 60] },
        { who: 'C', en: 'Is this your room?', ko: '여기가 네 방이야?', art: ['🚪', 8, 60, 44] },
        { who: 'J', en: 'Yes, it is my room.', ko: '응, 내 방이야.', art: ['🧸', 40, 76, 34] },
        { who: 'J', en: 'You can sleep in this small bed.', ko: '너는 이 작은 침대에서 자도 돼.', art: ['🛏️', 86, 76, 44] },
      ],
    },
    {
      id: 's4', emoji: '⚽', title: "Let's Play", titleKo: '같이 놀자',
      bg: ['#7ed6a5', '#d8f5c8'], ground: '#4fa35a',
      intro: '다음 날, 준과 코코는 공원에 갔어요. 뭘 하고 놀까요?',
      words: [
        { en: 'play', ko: '놀다', emoji: '⚽' },
        { en: 'jump', ko: '뛰다', emoji: '🦘' },
        { en: 'swim', ko: '수영하다', emoji: '🏊' },
        { en: 'park', ko: '공원', emoji: '🏞️' },
        { en: 'fast', ko: '빠른', emoji: '⚡' },
      ],
      lines: [
        { who: 'J', en: 'Can you jump?', ko: '너 점프할 수 있어?', art: ['🌳', 10, 36, 70] },
        { who: 'C', en: "No, I can't jump.", ko: "아니, 난 점프 못 해.", art: ['⚽', 42, 78, 34] },
        { who: 'C', en: 'But I can swim well.', ko: '하지만 수영은 잘해.', art: ['💦', 84, 50, 40] },
        { who: 'J', en: "Let's play together in the park.", ko: '공원에서 같이 놀자.', art: ['🛝', 88, 30, 60] },
        { who: 'J', en: 'Wow, you are very fast, Coco!', ko: '와, 너 정말 빠르다, 코코!', art: ['⚡', 50, 46, 36] },
      ],
    },
    {
      id: 's5', emoji: '🌈', title: 'The Rainbow', titleKo: '무지개',
      bg: ['#6ec3f7', '#fff3c4'], ground: '#6fbf6a',
      intro: '비가 그쳤어요. 코코가 하늘을 올려다보며 물었어요.',
      words: [
        { en: 'weather', ko: '날씨', emoji: '🌦️' },
        { en: 'sunny', ko: '맑은', emoji: '☀️' },
        { en: 'sky', ko: '하늘', emoji: '🌤️' },
        { en: 'rainbow', ko: '무지개', emoji: '🌈' },
        { en: 'happy', ko: '행복한', emoji: '😊' },
      ],
      lines: [
        { who: 'C', en: 'How is the weather now?', ko: '지금 날씨 어때?', art: ['☁️', 14, 16, 50] },
        { who: 'J', en: 'It is sunny now.', ko: '이제 맑아.', art: ['☀️', 84, 14, 56] },
        { who: 'J', en: 'Look at the sky, Coco!', ko: '하늘 좀 봐, 코코!', art: ['🦋', 44, 52, 30] },
        { who: 'C', en: 'I can see a big rainbow!', ko: '큰 무지개가 보여!', art: ['🌈', 50, 24, 96] },
        { who: 'C', en: 'I am so happy with you.', ko: '너랑 있어서 정말 행복해.', art: ['🌻', 90, 72, 44] },
      ],
    },
    {
      id: 's6', emoji: '🌙', title: 'See You Tomorrow', titleKo: '내일 또 만나',
      bg: ['#f39a6b', '#ffd9a0'], ground: '#8a7a4f',
      intro: '해가 지고 있어요. 이제 헤어질 시간이에요.',
      words: [
        { en: 'home', ko: '집(으로)', emoji: '🏡' },
        { en: 'family', ko: '가족', emoji: '👨‍👩‍👧' },
        { en: 'miss', ko: '그리워하다', emoji: '🥺' },
        { en: 'tomorrow', ko: '내일', emoji: '📅' },
        { en: 'school', ko: '학교', emoji: '🏫' },
      ],
      lines: [
        { who: 'J', en: 'It is time to go home.', ko: '집에 갈 시간이야.', art: ['🌇', 50, 22, 80] },
        { who: 'C', en: 'I miss my family in the forest.', ko: '숲에 있는 가족이 보고 싶어.', art: ['🌲', 90, 46, 64] },
        { who: 'J', en: "Don't be sad, my friend.", ko: '슬퍼하지 마, 친구야.', art: ['🌲', 78, 52, 48] },
        { who: 'J', en: "Let's meet again tomorrow after school.", ko: '내일 학교 끝나고 다시 만나자.', art: ['🏫', 10, 46, 56] },
        { who: 'C', en: 'Okay! You are my best friend, Jun.', ko: '좋아! 넌 내 가장 친한 친구야, 준.', art: ['⭐', 46, 46, 36] },
      ],
    },
  ],
};
