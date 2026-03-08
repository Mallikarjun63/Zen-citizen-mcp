import axios from "axios";

const OPENAI_URL = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";

export async function summarizeForVideo(
  title: string,
  description: string,
  comments: { authorDisplayName?: string; textDisplay: string }[],
  instructions?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";

  const promptParts: string[] = [];
  promptParts.push(`Title: ${title}`);
  if (description) promptParts.push(`Description: ${description}`);
  if (comments && comments.length > 0) {
    const sample = comments.slice(0, 5).map((c, i) => `Comment ${i + 1}: ${c.textDisplay}`).join("\n");
    promptParts.push(`Top comments:\n${sample}`);
  }

  const system = instructions || `You are a concise assistant. Summarize the video and top comments into 2-4 short bullet points and a one-sentence actionable recommendation.`;

  const messages = [
    { role: "system", content: system },
    { role: "user", content: promptParts.join("\n\n") },
  ];

  try {
    const resp = await axios.post(
      `${OPENAI_URL}/chat/completions`,
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        temperature: 0.2,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = resp.data?.choices?.[0]?.message?.content;
    return text || "";
  } catch (err) {
    console.warn("LLM summarization failed:", err?.message || err);
    return "";
  }
}

export default { summarizeForVideo };
