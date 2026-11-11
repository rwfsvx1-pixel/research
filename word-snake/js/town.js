// 써니타운: 주민 · 장소 · 날마다 일어나는 일(대본)
// 대본은 AI가 연결되지 않았을 때 쓰이고, AI가 연결되면 goal/targets만 길잡이로 쓴다.
const TOWN = {
  name: 'Sunny Town', nameKo: '써니타운',
  avatars: ['🧒', '👧', '👦', '🧑', '👩‍🦱', '🧑‍🦰'],
  likes: [
    { en: 'soccer', ko: '축구', e: '⚽' }, { en: 'dogs', ko: '강아지', e: '🐶' }, { en: 'cats', ko: '고양이', e: '🐱' },
    { en: 'pizza', ko: '피자', e: '🍕' }, { en: 'games', ko: '게임', e: '🎮' }, { en: 'drawing', ko: '그림 그리기', e: '🎨' },
    { en: 'music', ko: '음악', e: '🎵' }, { en: 'dinosaurs', ko: '공룡', e: '🦖' }, { en: 'swimming', ko: '수영', e: '🏊' },
    { en: 'books', ko: '책', e: '📚' }, { en: 'ice cream', ko: '아이스크림', e: '🍦' }, { en: 'robots', ko: '로봇', e: '🤖' },
  ],
  npcs: {
    mia: { name: 'Mia', ko: '미아', e: '👧', place: 'mia', persona: 'a cheerful 10-year-old girl who lives next door, loves dogs and jokes, and is excited to have a new neighbor' },
    bun: { name: 'Mrs. Bun', ko: '번 아주머니', e: '👩‍🍳', place: 'bakery', persona: 'the warm, funny owner of the town bakery who loves feeding children and gives everything a silly bread name' },
    green: { name: 'Mr. Green', ko: '그린 선생님', e: '👨‍🏫', place: 'school', persona: 'a kind, patient elementary school teacher who praises every try and loves plants' },
  },
  places: {
    home: { name: 'My Room', ko: '내 방', e: '🏠', day: 1 },
    mia: { name: "Mia's House", ko: '미아네 집', e: '🏡', day: 1 },
    bakery: { name: 'Bakery', ko: '빵집', e: '🥐', day: 1 },
    school: { name: 'School', ko: '학교', e: '🏫', day: 2 },
    park: { name: 'Park', ko: '공원', e: '🌳', day: 3 },
  },
  // {name} 이름, {like1} {like2} 좋아하는 것
  missions: [
    {
      id: 'd1mia', day: 1, npc: 'mia', place: 'mia', gift: '🌻', title: '옆집 친구 미아와 인사하기',
      scene: 'The child just moved to Sunny Town and meets Mia in front of her house for the first time.',
      goal: 'greet each other, learn the child\'s name, and find out one thing the child likes',
      targets: ['My name is ...', 'Nice to meet you.', 'I like ...'],
      turns: [
        { say: 'Hi! I am Mia. What is your name?', ko: '안녕! 나는 미아야. 네 이름은 뭐야?', opts: [{ en: 'My name is {name}.', ko: '내 이름은 {name}(이)야.' }, { en: 'Hello! I am {name}.', ko: '안녕! 나는 {name}(이)야.' }] },
        { say: 'Nice to meet you, {name}! Are you new here?', ko: '만나서 반가워, {name}! 여기 새로 왔어?', opts: [{ en: 'Yes, I am new here.', ko: '응, 새로 왔어.' }, { en: 'Yes. Nice to meet you, too.', ko: '응. 나도 만나서 반가워.' }] },
        { say: 'I like dogs. What do you like?', ko: '나는 강아지를 좋아해. 너는 뭘 좋아해?', opts: [{ en: 'I like {like1}.', ko: '나는 {like1ko} 좋아해.', fact: 'likes {like1}' }, { en: 'I like {like2}.', ko: '나는 {like2ko} 좋아해.', fact: 'likes {like2}' }, { en: 'I like dogs, too.', ko: '나도 강아지 좋아해.', fact: 'likes dogs' }] },
      ],
      end: { say: 'Cool! Let\'s be friends. This flower is for you!', ko: '멋지다! 우리 친구 하자. 이 꽃은 너 줄게!' },
    },
    {
      id: 'd1bun', day: 1, npc: 'bun', place: 'bakery', gift: '🍞', title: '빵집에서 먹고 싶은 것 사기',
      scene: 'The child walks into the bakery for the first time, a little hungry.',
      goal: 'greet, order one thing politely, and say thank you',
      targets: ['I am hungry.', 'I want ..., please.', 'Thank you.'],
      turns: [
        { say: 'Hello! Welcome to my bakery. Are you hungry?', ko: '안녕! 우리 빵집에 온 걸 환영해. 배고프니?', opts: [{ en: 'Yes, I am hungry.', ko: '네, 배고파요.' }, { en: 'Yes, a little.', ko: '네, 조금요.' }] },
        { say: 'What do you want? Bread, a cookie, or a donut?', ko: '뭘 먹고 싶니? 빵, 쿠키, 도넛?', opts: [{ en: 'I want bread, please.', ko: '빵 주세요.', fact: 'likes bread' }, { en: 'I want a cookie, please.', ko: '쿠키 주세요.', fact: 'likes cookies' }, { en: 'I want a donut, please.', ko: '도넛 주세요.', fact: 'likes donuts' }] },
        { say: 'Here you are. It is one dollar.', ko: '여기 있어. 1달러란다.', opts: [{ en: 'Here you are. Thank you.', ko: '여기요. 고맙습니다.' }, { en: 'Thank you very much.', ko: '정말 고맙습니다.' }] },
      ],
      end: { say: 'You are welcome. Come again, {name}!', ko: '천만에. 또 오렴, {name}!' },
    },
    {
      id: 'd2green', day: 2, npc: 'green', place: 'school', gift: '📚', title: '학교 첫날, 선생님과 이야기하기',
      scene: 'It is the child\'s first morning at Sunny Town school.',
      goal: 'talk about how the child feels, today\'s weather, and a favorite subject',
      targets: ['I am good.', 'It is sunny.', 'I like English.'],
      turns: [
        { say: 'Good morning! I am Mr. Green. How are you today?', ko: '좋은 아침! 나는 그린 선생님이야. 오늘 기분이 어때?', opts: [{ en: 'I am good.', ko: '좋아요.' }, { en: 'I am happy.', ko: '행복해요.' }, { en: 'I am a little sleepy.', ko: '조금 졸려요.' }] },
        { say: 'I see. Look outside! How is the weather?', ko: '그렇구나. 밖을 봐! 날씨가 어때?', opts: [{ en: 'It is sunny.', ko: '맑아요.' }, { en: 'It is cloudy.', ko: '흐려요.' }, { en: 'It is rainy.', ko: '비가 와요.' }] },
        { say: 'Good job! What is your favorite subject?', ko: '잘했어! 제일 좋아하는 과목이 뭐니?', opts: [{ en: 'I like English.', ko: '영어를 좋아해요.', fact: 'favorite subject is English' }, { en: 'I like math.', ko: '수학을 좋아해요.', fact: 'favorite subject is math' }, { en: 'I like P.E.', ko: '체육을 좋아해요.', fact: 'favorite subject is P.E.' }] },
      ],
      end: { say: 'Great! Welcome to our class, {name}.', ko: '훌륭해! 우리 반에 온 걸 환영해, {name}.' },
    },
    {
      id: 'd2mia', day: 2, npc: 'mia', place: 'mia', gift: '⚽', title: '미아가 같이 놀자고 해요',
      scene: 'After school, Mia waits in front of her house and wants to play.',
      goal: 'find out what the child can do and decide what to play together',
      targets: ['Yes, I can.', "No, I can't.", "Let's ..."],
      turns: [
        { say: 'Hi, {name}! Can you play today?', ko: '안녕, {name}! 오늘 놀 수 있어?', opts: [{ en: 'Yes, I can.', ko: '응, 놀 수 있어.' }, { en: 'Yes! I am free today.', ko: '응! 오늘 한가해.' }] },
        { say: 'Yay! Can you swim?', ko: '야호! 너 수영할 수 있어?', opts: [{ en: 'Yes, I can swim.', ko: '응, 수영할 수 있어.', fact: 'can swim' }, { en: "No, I can't swim.", ko: '아니, 수영 못 해.', fact: 'cannot swim' }] },
        { say: 'Okay! Then let\'s play {like1} together!', ko: '좋아! 그럼 같이 {like1ko} 하고 놀자!', opts: [{ en: 'Sounds good!', ko: '좋아!' }, { en: "Okay. Let's go!", ko: '그래. 가자!' }] },
      ],
      end: { say: 'You are my best friend, {name}!', ko: '넌 내 가장 친한 친구야, {name}!' },
    },
    {
      id: 'd3bun', day: 3, npc: 'bun', place: 'bakery', gift: '🎂', title: '미아의 생일 케이크 사기',
      scene: 'Today is Mia\'s birthday. The child comes to the bakery to buy a cake for her.',
      goal: 'order a birthday cake and say who it is for',
      targets: ['I want a cake, please.', 'It is for Mia.', 'She is ten years old.'],
      turns: [
        { say: 'Hello again, {name}! How are you today?', ko: '또 왔구나, {name}! 오늘 어떠니?', opts: [{ en: 'I am great.', ko: '아주 좋아요.' }, { en: 'I am good. And you?', ko: '좋아요. 아주머니는요?' }] },
        { say: 'I am happy to see you. What do you want today?', ko: '널 봐서 기쁘구나. 오늘은 뭘 줄까?', opts: [{ en: 'I want a cake, please.', ko: '케이크 주세요.' }, { en: 'I want a birthday cake.', ko: '생일 케이크를 사고 싶어요.' }] },
        { say: 'A cake! Who is it for?', ko: '케이크! 누구 주려고?', opts: [{ en: 'It is for Mia.', ko: '미아 주려고요.' }, { en: 'It is for my friend, Mia.', ko: '제 친구 미아 주려고요.' }] },
        { say: 'How nice! How old is Mia?', ko: '착하기도 하지! 미아는 몇 살이니?', opts: [{ en: 'She is ten years old.', ko: '열 살이에요.' }, { en: "I don't know.", ko: '잘 모르겠어요.' }] },
      ],
      end: { say: 'Here is your cake. Say happy birthday to Mia!', ko: '케이크 여기 있다. 미아한테 생일 축하한다고 전해 주렴!' },
    },
    {
      id: 'd3mia', day: 3, npc: 'mia', place: 'park', gift: '🎈', title: '공원에서 미아 생일 축하하기',
      scene: 'Mia is having a small birthday picnic in the park. The child arrives with a cake.',
      goal: 'say happy birthday, give the cake, and talk about birthdays',
      targets: ['Happy birthday!', 'This is for you.', 'My birthday is in ...'],
      turns: [
        { say: 'Hi, {name}! Today is my birthday!', ko: '안녕, {name}! 오늘 내 생일이야!', opts: [{ en: 'Happy birthday, Mia!', ko: '생일 축하해, 미아!' }, { en: 'Happy birthday! This is for you.', ko: '생일 축하해! 이거 네 거야.' }] },
        { say: 'Wow, a cake! Thank you! Do you like cake?', ko: '와, 케이크다! 고마워! 너 케이크 좋아해?', opts: [{ en: 'Yes, I like cake.', ko: '응, 케이크 좋아해.', fact: 'likes cake' }, { en: 'Yes, I love it!', ko: '응, 엄청 좋아해!', fact: 'likes cake' }] },
        { say: 'Me too! When is your birthday?', ko: '나도! 네 생일은 언제야?', opts: [{ en: 'My birthday is in May.', ko: '내 생일은 5월이야.', fact: 'birthday is in May' }, { en: 'My birthday is in December.', ko: '내 생일은 12월이야.', fact: 'birthday is in December' }, { en: 'It is a secret!', ko: '비밀이야!' }] },
      ],
      end: { say: 'This is the best birthday. Thank you, {name}!', ko: '최고의 생일이야. 고마워, {name}!' },
    },
  ],
  // 4일째부터: AI가 연결되어 있을 때 날마다 두 명이 새 이야깃거리로 말을 건다
  topics: [
    { t: 'weekend plans', ko: '주말 계획 이야기하기' }, { t: 'favorite food and what to eat today', ko: '좋아하는 음식 이야기하기' },
    { t: 'pets and animals', ko: '동물 이야기하기' }, { t: 'family members', ko: '가족 이야기하기' },
    { t: 'what the child did today', ko: '오늘 한 일 이야기하기' }, { t: 'weather and what to wear', ko: '날씨와 옷 이야기하기' },
    { t: 'daily routine and time', ko: '하루 일과 이야기하기' }, { t: 'a small problem the character needs help with', ko: '주민의 부탁 들어주기' },
  ],
  gifts: ['🧸', '🪴', '🖼️', '🎁', '🍪', '🪁', '🎨', '📮', '🧩', '🪀'],
};
