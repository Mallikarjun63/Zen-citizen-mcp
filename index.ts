import "dotenv/config";
import { MCPServer, object, text, widget, markdown } from "mcp-use/server";
import { z } from "zod";
import { searchYouTube, searchTwitter, searchBothPlatforms, researchGovernmentQuery } from "./api.js";
import type { YouTubeResults, TwitterResults } from "./resources/api-results/types.js";

function buildActionLinks(service?: { officialLinks?: string[]; documentLinks?: string[] }) {
  const links = service?.officialLinks || [];
  const docs = service?.documentLinks || [];

  const inferPurpose = (url: string) => {
    const u = url.toLowerCase();
    if (/(apply|register|application|new-?service|request)/.test(u)) return "apply";
    if (/(view|search|download|records|certificate|rtc|pahani|khata|mutation)/.test(u)) return "view";
    if (/(status|track|grievance|help|support|contact|sakala)/.test(u)) return "help";
    return "official";
  };

  const inferLabel = (purpose: string, index: number, url: string) => {
    if (purpose === "apply") return "Apply online";
    if (purpose === "view") return "View or download records";
    if (purpose === "help") return "Official help or status portal";
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return index === 0 ? `Official primary portal (${host})` : `Official portal (${host})`;
    } catch {
      return index === 0 ? "Official primary portal" : "Official portal";
    }
  };

  const actionLinks = links.slice(0, 6).map((url, index) => {
    const purpose = inferPurpose(url);
    return {
      label: inferLabel(purpose, index, url),
      url,
      purpose,
    };
  });

  const documentLinks = docs.slice(0, 4).map((url) => ({
    label: "Official document or form",
    url,
    purpose: "document",
  }));

  return [...actionLinks, ...documentLinks];
}

const server = new MCPServer({
  name: "Zen-Citizen",
  title: "Zen-Citizen", // display name
  version: "1.0.0",
  description: "MCP server with MCP Apps integration",
  baseUrl: process.env.MCP_URL || "https://70qwsysdwu49.deploy.mcp-use.com", // Full base URL (e.g., https://myserver.com)
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com", // Can be customized later
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

/**
 * TOOL THAT RETURNS A WIDGET
 * The `widget` config tells mcp-use which widget component to render.
 * The `widget()` helper in the handler passes props to that component.
 * Docs: https://mcp-use.com/docs/typescript/server/mcp-apps
 */

// Fruits data — color values are Tailwind bg-[] classes used by the carousel UI
const fruits = [
  { fruit: "mango", color: "bg-[#FBF1E1] dark:bg-[#FBF1E1]/10" },
  { fruit: "pineapple", color: "bg-[#f8f0d9] dark:bg-[#f8f0d9]/10" },
  { fruit: "cherries", color: "bg-[#E2EDDC] dark:bg-[#E2EDDC]/10" },
  { fruit: "coconut", color: "bg-[#fbedd3] dark:bg-[#fbedd3]/10" },
  { fruit: "apricot", color: "bg-[#fee6ca] dark:bg-[#fee6ca]/10" },
  { fruit: "blueberry", color: "bg-[#e0e6e6] dark:bg-[#e0e6e6]/10" },
  { fruit: "grapes", color: "bg-[#f4ebe2] dark:bg-[#f4ebe2]/10" },
  { fruit: "watermelon", color: "bg-[#e6eddb] dark:bg-[#e6eddb]/10" },
  { fruit: "orange", color: "bg-[#fdebdf] dark:bg-[#fdebdf]/10" },
  { fruit: "avocado", color: "bg-[#ecefda] dark:bg-[#ecefda]/10" },
  { fruit: "apple", color: "bg-[#F9E7E4] dark:bg-[#F9E7E4]/10" },
  { fruit: "pear", color: "bg-[#f1f1cf] dark:bg-[#f1f1cf]/10" },
  { fruit: "plum", color: "bg-[#ece5ec] dark:bg-[#ece5ec]/10" },
  { fruit: "banana", color: "bg-[#fdf0dd] dark:bg-[#fdf0dd]/10" },
  { fruit: "strawberry", color: "bg-[#f7e6df] dark:bg-[#f7e6df]/10" },
  { fruit: "lemon", color: "bg-[#feeecd] dark:bg-[#feeecd]/10" },
];

server.tool(
  {
    name: "search-tools",
    description: "Search for fruits and display the results in a visual widget",
    schema: z.object({
      query: z.string().optional().describe("Search query to filter fruits"),
    }),
    widget: {
      name: "product-search-result",
      invoking: "Searching...",
      invoked: "Results loaded",
    },
  },
  async ({ query }) => {
    const results = fruits.filter(
      (f) => !query || f.fruit.toLowerCase().includes(query.toLowerCase())
    );

    // let's emulate a delay to show the loading state
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return widget({
      props: { query: query ?? "", results },
      output: text(
        `Found ${results.length} fruits matching "${query ?? "all"}"`
      ),
    });
  }
);

server.tool(
  {
    name: "get-fruit-details",
    description: "Get detailed information about a specific fruit",
    schema: z.object({
      fruit: z.string().describe("The fruit name"),
    }),
    outputSchema: z.object({
      fruit: z.string(),
      color: z.string(),
      facts: z.array(z.string()),
    }),
  },
  async ({ fruit }) => {
    const found = fruits.find(
      (f) => f.fruit?.toLowerCase() === fruit?.toLowerCase()
    );
    return object({
      fruit: found?.fruit ?? fruit,
      color: found?.color ?? "unknown",
      facts: [
        `${fruit} is a delicious fruit`,
        `Color: ${found?.color ?? "unknown"}`,
      ],
    });
  }
);


/**
 * YOUTUBE SEARCH TOOL
 * Searches YouTube videos and fetches top comments
 * Requires: YOUTUBE_API_KEY environment variable
 */
server.tool(
  {
    name: "search-youtube",
    description: "Search YouTube videos and get comments related to a query",
    schema: z.object({
      query: z.string().describe("Search query for YouTube videos"),
    }),
    widget: {
      name: "api-results",
      invoking: "Searching YouTube...",
      invoked: "YouTube results loaded",
    },
  },
  async ({ query }) => {
    try {
      const results = await searchYouTube(query);
      return widget({
        props: {
          query,
          youtubeResults: results,
          twitterResults: null,
        },
        output: text(
          `Found ${results.videos.length} YouTube videos and ${results.comments.length} comments for "${query}"`
        ),
      });
    } catch (error) {
      return text(`Error searching YouTube: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

/**
 * TWITTER SEARCH TOOL
 * Searches recent tweets related to a query
 * Requires: TWITTER_BEARER_TOKEN environment variable
 */
server.tool(
  {
    name: "search-twitter",
    description: "Search Twitter/X for tweets related to a query",
    schema: z.object({
      query: z.string().describe("Search query for Twitter/X"),
    }),
    widget: {
      name: "api-results",
      invoking: "Searching Twitter...",
      invoked: "Twitter results loaded",
    },
  },
  async ({ query }) => {
    try {
      const results = await searchTwitter(query);
      return widget({
        props: {
          query,
          youtubeResults: null,
          twitterResults: results,
        },
        output: text(`Found ${results.count} tweets for "${query}"`),
      });
    } catch (error) {
      return text(`Error searching Twitter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

/**
 * COMBINED SEARCH TOOL
 * Searches both YouTube and Twitter for a query
 * Requires: YOUTUBE_API_KEY and TWITTER_BEARER_TOKEN environment variables
 */
server.tool(
  {
    name: "search-all",
    description: "Search YouTube videos, comments, and Twitter tweets for a specific query across both platforms",
    schema: z.object({
      query: z.string().describe("Search query to find content on YouTube and Twitter"),
    }),
    widget: {
      name: "api-results",
      invoking: "Searching YouTube and Twitter...",
      invoked: "Results loaded",
    },
  },
  async ({ query }) => {
    try {
      const { youtube, twitter, errors } = await searchBothPlatforms(query);
      
      const errorMsg = errors.length > 0 ? `\nWarnings: ${errors.join(", ")}` : "";
      const youtubeCount = youtube?.videos.length ?? 0;
      const twitterCount = twitter?.tweets.length ?? 0;
      
      return widget({
        props: {
          query,
          youtubeResults: youtube || null,
          twitterResults: twitter || null,
        },
        output: text(
          `Found ${youtubeCount} YouTube videos and ${twitterCount} tweets for "${query}"${errorMsg}`
        ),
      });
    } catch (error) {
      return text(`Error searching: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

/**
 * RESEARCH AGENT TOOL - INDIA SPECIFIC
 * AI-powered research agent for Indian government services
 * PRIMARY: YouTube videos and comments
 * OPTIONAL: Twitter tweets (graceful fallback)
 * Analyzes with sentiment classification and credibility scoring
 * Searches only India-specific content and resources
 * Provides structured insights for ChatGPT to compose helpful responses
 */
server.tool(
  {
    name: "research-government-query",
    description: "India-specific research agent for Indian government services. Returns a visual widget showing related YouTube videos and Twitter posts, plus a step-by-step guide with official links, document checklist, and key takeaways.",
    schema: z.object({
      query: z.string().describe("Indian government service query (e.g., 'How do I get 10th marks card if I lost it?', 'How to apply for PAN card')"),
      instructions: z.string().optional().describe("Optional instructions to guide the GPT summarization and response formatting"),
    }),
    widget: {
      name: "api-results",
    },
  },
  async ({ query, instructions }) => {
    try {
      const DEFAULT_INSTRUCTIONS = `Respond in Markdown with these sections:\n\n## Summary — one paragraph\n\n## Top Videos — numbered list: title, url, 1-sent summary, top 2 comments\n\n## Key Points — bullet list of top 5 takeaways\n\n## Actions — 3-5 concrete next steps with Markdown hyperlinks using official government links only\n\n## Direct Links\n- Apply link\n- View/Download link\n- Status/Help link\n\nDo not include extraneous commentary.`;

      const effectiveInstructions = (instructions as string | undefined) || DEFAULT_INSTRUCTIONS;
      const result = await researchGovernmentQuery(query, effectiveInstructions);
      const actionLinks = buildActionLinks(result.governmentService as any);
      const topResources = result.resources.slice(0, 10).map((r: any) => ({
        title: r.title,
        url: r.url,
        type: r.type,
        credibility: r.credibility.overall,
        author: r.metadata?.author || undefined,
        summary: r.metadata?.summary || undefined,
        topComments: (r.opinions || []).slice(0, 3).map((o: any) => ({ text: o.text, sentiment: o.sentiment, likes: o.likes })),
      }));

      const topVideos = topResources.filter((r: any) => r.type === "video").slice(0, 5);
      const topVideoLinks = topVideos.map((v: any) => ({ title: v.title, url: v.url, credibility: v.credibility }));
      const topTweets = topResources.filter((r: any) => r.type === "tweet").slice(0, 5);
      const topTweetLinks = topTweets.map((t: any) => ({ title: t.title, url: t.url, credibility: t.credibility }));
      const topKeyPoints = result.topKeyPoints.slice(0, 5);
      const topActions = result.recommendedActions.slice(0, 5);

      const responseMarkdown = [
        `> AI ASSISTANT NOTE: Keep all links below clickable and unchanged. Do not replace URLs with generic suggestions.`,
        "",
        `## One-Sentence Plan`,
        `Use the official local-body portal, submit eKhata/mutation details, upload required documents, pay fees, track verification, and download the approved record.`,
        "",
        `## Quick Summary`,
        `- Query: ${result.query}`,
        `- Average credibility: ${result.averageCredibility}/100`,
        `- Opinion split: ${result.opinionDistribution.opinion}% opinion, ${result.opinionDistribution.information}% information, ${result.opinionDistribution.other}% other`,
        "",
        "## Official Portal Links",
        ...(actionLinks.length > 0
          ? actionLinks.map((a: any, i: number) => `${i + 1}. [${a.label}](${a.url})`)
          : ["- No official links found."]),
        "",
        "## Printable Document Checklist",
        "1. Registered sale deed / conveyance deed (scan clear PDF)",
        "2. Property identifier (survey number, asset/assessment number, khata number, or full address)",
        "3. Applicant ID proof (Aadhaar/PAN/Passport)",
        "4. Latest property tax receipt (if available)",
        "5. Supporting records if asked (EC, approved plan, possession certificate)",
        "6. POA document if filing through representative",
        "7. Active mobile and email for OTP/status alerts",
        "",
        "## Step-by-Step Online Process",
        "1. Open your local-body official portal (BBMP for Bengaluru, else municipal/eSwathu/eAasthi portal).",
        "2. Register/login using mobile/email and complete OTP verification.",
        "3. Select service: eKhata, New Khata, Mutation, or Khata Transfer.",
        "4. Fill property details exactly as in title/tax records.",
        "5. Upload all required documents in specified format and size.",
        "6. Pay applicable fees online or via challan and keep receipt.",
        "7. Save application ID and track status stages until approved.",
        "8. Download approved eKhata/Khata extract or collect from office if required.",
        "",
        "## Common Problems and Fixes",
        "1. Asset number not found: search by survey number/address or confirm details at ward office.",
        "2. Name mismatch: upload supporting ID and correction proof/affidavit.",
        "3. Application stuck in verification: raise grievance on Sakala or visit local office with application ID.",
        "4. Rejected documents: re-upload clear scans matching portal format rules.",
        "",
        "## Related YouTube Videos (Direct Links)",
        ...(topVideos.length > 0
          ? topVideos.map((v: any, i: number) => `${i + 1}. [${v.title}](${v.url}) (credibility: ${Math.round(v.credibility)}/100)`)
          : ["- No YouTube videos found for this query."]),
        "",
        "## Useful Comments from Videos",
        ...(topVideos.length > 0
          ? topVideos.flatMap((v: any, i: number) => {
              const comments = (v.topComments || []).slice(0, 2);
              if (comments.length === 0) {
                return [`${i + 1}. ${v.title}: no comments captured.`];
              }
              return comments.map((c: any, j: number) => `${i + 1}.${j + 1} ${v.title}: \"${String(c.text).replace(/\s+/g, " ").slice(0, 180)}\"`);
            })
          : ["- No comment insights available."]),
        "",
        "## Twitter/X References",
        ...(topTweets.length > 0
          ? topTweets.map((t: any, i: number) => `${i + 1}. [${t.author ? `@${t.author}: ` : ""}${t.title.substring(0, 80)}...](${t.url}) (credibility: ${Math.round(t.credibility)}/100)`)
          : ["- No Twitter/X posts found for this query."]),
        "",
        "## Recommended Next Steps",
        ...(topActions.length > 0
          ? topActions.map((a: string, i: number) => `${i + 1}. ${a}`)
          : ["- No recommendations available."])
      ].join("\n");

      // Return widget for visual video cards + clean guide text for ChatGPT to present.
      return widget({
        props: {
          query,
          youtubeResults: (result as any).youtubeRaw || null,
          twitterResults: (result as any).twitterRaw || null,
        },
        output: text(responseMarkdown),
      });
    } catch (error) {
      return text(`Research failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

server.listen().then(() => {
  console.log(`Server running`);
});
