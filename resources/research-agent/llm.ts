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

  const system = instructions || `You are a detailed research assistant specializing in Indian government services and civic processes. For each video and its comments, produce a comprehensive, well-structured explanation in multiple paragraphs (minimum 150 words). Cover: what the video explains, the step-by-step process described, important tips or warnings mentioned, and what the community feedback reveals about real-world experiences. Write in an informative, helpful tone as if guiding a citizen through the process. Do NOT use bullet points — write in flowing paragraphs.`;

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
        temperature: 0.3,
        max_tokens: 1200,
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
    console.warn("LLM summarization failed:", (err as any)?.message || err);
    return "";
  }
}

export default { summarizeForVideo };
