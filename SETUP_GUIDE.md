# YouTube & Twitter API Integration Setup Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Get Your API Keys

#### YouTube API (Free)
1. Open https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Search for "YouTube Data API v3" and enable it
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the key

#### Twitter/X API
1. Open https://developer.twitter.com/en/portal/dashboard
2. Go to **Projects & Apps** → Create or use existing app
3. Go to **Keys and tokens** → **Bearer Token**
4. Copy the token (keep it private!)

### Step 3: Configure Environment

Create `.env` file in project root:

```bash
YOUTUBE_API_KEY=YOUR_YOUTUBE_KEY_HERE
TWITTER_BEARER_TOKEN=YOUR_TWITTER_TOKEN_HERE
```

Optional: when connecting this MCP as a ChatGPT Connector, you can pass `instructions` to control how ChatGPT formats summaries. If you don't provide `instructions`, the server uses a default Structured Markdown template that returns: Summary, Top Videos (title/url/summary/top comments), Key Points, and Actions.

Example `instructions` templates you can pass from ChatGPT when invoking the `research-government-query` tool:

- Structured Markdown (default):
```
Respond in Markdown with these sections:

## Summary — one paragraph

## Top Videos — numbered list: title, url, 1‑sent summary, top 2 comments

## Key Points — bullet list of top 5 takeaways

## Actions — 3 concrete next steps with links

Do not include extraneous commentary.
```

- JSON (programmatic):
```
Return only valid JSON with keys: {"query","summary","top_videos","top_key_points","recommended_actions","governmentService"}
```

When using the ChatGPT Connector (Developer mode):

1. Settings → Connectors → Advanced → Enable Developer mode.
2. Import this MCP server: `https://sparkling-king-bjlrd.run.mcp-use.com/mcp` (or your MCP URL).
3. In ChatGPT, call the `research-government-query` tool and pass `query` and optional `instructions`.

If `instructions` is omitted, the server will format results using the Structured Markdown default.

### Step 4: Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000/inspector` to test

---

## Testing the Tools

### Using the Inspector

1. Go to http://localhost:3000/inspector
2. Select **search-all** tool
3. Enter a search query: `"artificial intelligence"`
4. Click **Execute**
5. Results appear in list view with two tabs

### Available Tools

```
search-youtube  → YouTube videos + comments
search-twitter  → Recent tweets only
search-all      → Both platforms combined
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `YOUTUBE_API_KEY not set` | Add to `.env` and restart server |
| `403 Forbidden` | YouTube quota exceeded - check Google Cloud Console |
| `401 Unauthorized` | Twitter token invalid - regenerate in Developer Portal |

---

## API Rate Limits

- **YouTube**: 10,000 units/day (free tier)
- **Twitter**: Depends on your plan

---

## Next: Deploy to Production

```bash
npm run build
npm run deploy
```

Then use in ChatGPT or any MCP client!
