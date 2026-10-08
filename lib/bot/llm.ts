/* polza.ai (OpenAI-compatible): chat for answers and routing, whisper for voice notes. */

type Msg = { role: "system" | "user" | "assistant"; content: string };

const base = () => (process.env.POLZA_BASE_URL?.trim() || "https://api.polza.ai/v1").replace(/\/$/, "");
const key = () => process.env.POLZA_API_KEY?.trim();

export async function chat(messages: Msg[], opts: { json?: boolean; maxTokens?: number; temperature?: number } = {}) {
  if (!key()) return null;
  try {
    const r = await fetch(`${base()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key()}` },
      body: JSON.stringify({
        model: process.env.POLZA_MODEL?.trim() || "openai/gpt-4o-mini",
        messages,
        max_tokens: opts.maxTokens ?? 400,
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!r.ok) {
      console.error("llm", r.status, (await r.text()).slice(0, 200));
      return null;
    }
    const d = await r.json();
    return (d.choices?.[0]?.message?.content as string | undefined)?.trim() || null;
  } catch (error) {
    console.error("llm", error);
    return null;
  }
}

export async function transcribe(audio: Blob): Promise<string | null> {
  if (!key()) return null;
  const form = new FormData();
  form.append("file", audio, "voice.ogg");
  form.append("model", process.env.POLZA_STT_MODEL?.trim() || "openai/whisper-large-v3-turbo");
  form.append("language", "ru");
  try {
    const r = await fetch(`${base()}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}` },
      body: form,
    });
    if (!r.ok) {
      console.error("stt", r.status, (await r.text()).slice(0, 200));
      return null;
    }
    const d = await r.json();
    return (d.text as string | undefined)?.trim() || null;
  } catch (error) {
    console.error("stt", error);
    return null;
  }
}
