# 써니타운 AI 서버

게임(GitHub Pages)에서 주민이 AI로 대답하게 하려면 이 작은 서버가 필요합니다.
API 키를 웹페이지에 넣으면 누구나 볼 수 있으므로, 키는 서버에만 둡니다.

## 준비물
- Anthropic API 키 (console.anthropic.com, 사용한 만큼 요금이 나옵니다)
- Cloudflare 계정 (Workers 무료 요금제로 충분)

## 올리기
```bash
cd word-snake/server
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY   # API 키 붙여 넣기
npx wrangler secret put TOWN_KEY            # 직접 정한 암호 (게임 설정에 똑같이 입력)
npx wrangler deploy                         # 끝나면 https://sunnytown-ai.<계정>.workers.dev 주소가 나옵니다
```

게임의 마을 화면 → ⚙️ → **AI 서버 주소**에 위 주소를, **서버 암호**에 TOWN_KEY를 넣고 저장합니다.

## 알아둘 점
- `wrangler.toml`의 `ALLOWED_ORIGIN`이 게임 주소와 같아야 합니다.
- 모델은 `MODEL` 값으로 바꿉니다. 기본값은 `claude-opus-5-5`이고, 짧은 아이 대화에는 더 저렴한 `claude-haiku-5-5`도 쓸 수 있습니다.
- 암호를 아는 사람은 이 서버로 Claude를 쓸 수 있습니다. 암호는 가족만 알게 하고, Anthropic 콘솔에서 월 사용 한도를 걸어 두세요.
- 이 서버 코드는 실제 API에 연결해 시험하지 못했습니다. 처음 올린 뒤 게임에서 대화가 되는지 확인해 주세요.
