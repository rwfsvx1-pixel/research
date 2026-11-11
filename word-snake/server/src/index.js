// 써니타운 AI 프록시 (Cloudflare Worker)
// 브라우저에 API 키를 두지 않기 위해, 게임은 이 서버로 대화를 보내고 서버가 Claude API를 부른다.
import Anthropic from "@anthropic-ai/sdk";

const MAX_TURNS = 40, MAX_CHARS = 12000;

function cors(env, origin) {
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    ok,
    headers: {
      "access-control-allow-origin": ok ? origin : "null",
      "access-control-allow-headers": "content-type, x-town-key",
      "access-control-allow-methods": "POST, OPTIONS",
      "vary": "origin",
    },
  };
}
const json = (body, status, headers) => new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json" } });

export default {
  async fetch(request, env) {
    const { ok, headers } = cors(env, request.headers.get("origin") || "");
    if (request.method === "OPTIONS") return new Response(null, { status: ok ? 204 : 403, headers });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);
    if (!ok) return json({ error: "origin_not_allowed" }, 403, headers);
    // 주소를 아는 아무나 쓰지 못하도록 암호를 확인한다 (게임 설정의 "서버 암호")
    if (!env.TOWN_KEY || request.headers.get("x-town-key") !== env.TOWN_KEY) return json({ error: "bad_key" }, 401, headers);

    let body;
    try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400, headers); }
    const messages = Array.isArray(body.messages) ? body.messages : null;
    const valid = messages && messages.length > 0 && messages.length <= MAX_TURNS
      && messages.every(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length > 0)
      && messages.reduce((n, m) => n + m.content.length, 0) <= MAX_CHARS
      && messages[0].role === "user" && messages[messages.length - 1].role === "user";
    if (!valid) return json({ error: "bad_messages" }, 400, headers);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const response = await client.beta.messages.create({
        model: env.MODEL || "claude-opus-5-5",
        max_tokens: 16000,
        output_config: { effort: "low" },            // 짧은 대화라 빠른 응답이 우선
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",                         // 모델이 거절하면 서버가 다른 모델로 한 번 더 시도
        messages,
      });
      if (response.stop_reason === "refusal") return json({ error: "refused" }, 422, headers);
      const text = response.content.filter(b => b.type === "text").map(b => b.text).join("");
      return json({ text }, 200, headers);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: "rate_limited" }, 429, headers);
      if (err instanceof Anthropic.APIError) return json({ error: "upstream_" + (err.status || "error") }, 502, headers);
      return json({ error: "server_error" }, 500, headers);
    }
  },
};
