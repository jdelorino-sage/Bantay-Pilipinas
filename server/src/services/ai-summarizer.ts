import type { AISummary, FocalPoint } from "@bantay-pilipinas/shared";
import Anthropic from "@anthropic-ai/sdk";
import { CircuitBreaker } from "./circuit-breaker.js";

type Provider = "anthropic" | "groq" | "openrouter" | "ollama" | "none";

const anthropicBreaker = new CircuitBreaker("anthropic-ai", 3, 60_000);
const groqBreaker = new CircuitBreaker("groq-ai", 3, 60_000);
const openRouterBreaker = new CircuitBreaker("openrouter-ai", 3, 60_000);
const ollamaBreaker = new CircuitBreaker("ollama-ai", 3, 30_000);

const PH_SYSTEM_PROMPT = `You are an intelligence analyst for Bantay Pilipinas (Philippine Monitor), a real-time Philippine intelligence dashboard. Provide a concise briefing based on the following headlines.

Focus on:
1. West Philippine Sea incidents (vessel intrusions, diplomatic protests, military activity)
2. Security threats (terrorism, insurgency, armed conflict)
3. Natural disasters (typhoons, earthquakes, volcanic activity)
4. Economic developments (PSE, BSP policy, inflation, remittances)
5. Major political developments

Format: 2-3 paragraph briefing. Lead with the most critical developments. Use specific names, locations, and figures. Reference source reliability (Tier 1 = government/wire, Tier 2 = major national, Tier 3 = specialist). End with a threat assessment summary.`;

async function tryAnthropic(headlines: string[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !anthropicBreaker.canExecute()) return null;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      system: PH_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}` },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text in response");
    anthropicBreaker.recordSuccess();
    return textBlock.text;
  } catch (err) {
    anthropicBreaker.recordFailure();
    console.error("[ai] Anthropic failed:", (err as Error).message);
    return null;
  }
}

async function tryGroq(headlines: string[]): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !groqBreaker.canExecute()) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: PH_SYSTEM_PROMPT },
          { role: "user", content: `Headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}` },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const data = await res.json() as { choices: { message: { content: string } }[] };
    groqBreaker.recordSuccess();
    return data.choices[0]?.message?.content || null;
  } catch (err) {
    groqBreaker.recordFailure();
    console.error("[ai] Groq failed:", (err as Error).message);
    return null;
  }
}

async function tryOpenRouter(headlines: string[]): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !openRouterBreaker.canExecute()) return null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bantay-pilipinas.netlify.app",
        "X-Title": "Bantay Pilipinas",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: PH_SYSTEM_PROMPT },
          { role: "user", content: `Headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}` },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
    const data = await res.json() as { choices: { message: { content: string } }[] };
    openRouterBreaker.recordSuccess();
    return data.choices[0]?.message?.content || null;
  } catch (err) {
    openRouterBreaker.recordFailure();
    console.error("[ai] OpenRouter failed:", (err as Error).message);
    return null;
  }
}

async function tryOllama(headlines: string[]): Promise<string | null> {
  const url = process.env.OLLAMA_API_URL;
  const model = process.env.OLLAMA_MODEL || "llama3.1:8b";
  if (!url || !ollamaBreaker.canExecute()) return null;

  try {
    const res = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: PH_SYSTEM_PROMPT },
          { role: "user", content: `Headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json() as { message?: { content: string } };
    ollamaBreaker.recordSuccess();
    return data.message?.content || null;
  } catch (err) {
    ollamaBreaker.recordFailure();
    console.error("[ai] Ollama failed:", (err as Error).message);
    return null;
  }
}

function extractFocalPoints(text: string, headlines: string[]): FocalPoint[] {
  const focalPoints: FocalPoint[] = [];
  const lower = text.toLowerCase();

  const patterns: { keyword: string; category: string; severity: "low" | "medium" | "high" }[] = [
    { keyword: "west philippine sea", category: "wps-maritime", severity: "high" },
    { keyword: "scarborough", category: "wps-maritime", severity: "high" },
    { keyword: "ayungin", category: "wps-maritime", severity: "high" },
    { keyword: "typhoon", category: "disaster", severity: "high" },
    { keyword: "earthquake", category: "disaster", severity: "medium" },
    { keyword: "volcano", category: "disaster", severity: "medium" },
    { keyword: "barmm", category: "defense", severity: "medium" },
    { keyword: "npa", category: "defense", severity: "medium" },
    { keyword: "inflation", category: "economy", severity: "medium" },
  ];

  for (const p of patterns) {
    if (lower.includes(p.keyword)) {
      const related = headlines
        .map((h, i) => ({ h, i }))
        .filter(({ h }) => h.toLowerCase().includes(p.keyword))
        .map(({ i }) => i);

      focalPoints.push({
        title: p.keyword.charAt(0).toUpperCase() + p.keyword.slice(1),
        description: `Detected mentions of ${p.keyword} in briefing`,
        category: p.category as FocalPoint["category"],
        severity: p.severity,
        relatedArticles: related,
      });
    }
  }

  return focalPoints.slice(0, 5);
}

export async function generateSummary(headlines: string[]): Promise<AISummary> {
  const providers: { name: Provider; fn: (h: string[]) => Promise<string | null> }[] = [
    { name: "anthropic", fn: tryAnthropic },
    { name: "groq", fn: tryGroq },
    { name: "openrouter", fn: tryOpenRouter },
    { name: "ollama", fn: tryOllama },
  ];

  for (const provider of providers) {
    const result = await provider.fn(headlines);
    if (result) {
      return {
        summaryText: result,
        focalPoints: extractFocalPoints(result, headlines),
        provider: provider.name,
        createdAt: new Date().toISOString(),
      };
    }
  }

  return {
    summaryText: `Philippine intelligence briefing based on ${headlines.length} headlines. Configure ANTHROPIC_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY for AI-powered summaries.`,
    focalPoints: extractFocalPoints("", headlines),
    provider: "none",
    createdAt: new Date().toISOString(),
  };
}
