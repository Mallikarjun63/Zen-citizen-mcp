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

const BLOB_FORMAT_INSTRUCTIONS = `Present the tool output using the BLOB format below. Each BLOB is a self-contained section covering one specific aspect of the topic.

FORMATTING RULES (mandatory — do not skip):
1. Use the retrieved information directly — do not fabricate or guess facts.
2. Attach the correct source links that support the information in each BLOB.
3. Place a Sources section clearly after the content in every BLOB.
4. Do not invent sources or add URLs that are not in the retrieved data.
5. Include relevant sources for every section returned.
6. Every important claim must be backed by a source URL from the tool output.
7. Keep the response readable but ensure sources remain visible and traceable.
8. Do not remove, merge away, or summarize away the sources provided by the tool.

Format for each BLOB:
**BLOB N: [Descriptive Title]**
[Content paragraph(s) or bullet list — only retrieved data, no invented text]

Sources:
- [exact URL from retrieved data]
- [exact URL from retrieved data]

Keep all URLs as plain clickable links — do not shorten, rewrite, or replace them.`;

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
    description: "India-specific research agent for Indian government services. Always present the output using the BLOB format specified in the `instructions` field — each BLOB covers one topic with a Sources section underneath containing only URLs from the retrieved data. CRITICAL RULES: (1) Never fabricate facts or invent source URLs. (2) Return all URLs intact and clickable. (3) Do not replace fetched URLs with generic text. (4) Include related videos and top comments when available.",
    schema: z.object({
      query: z.string().describe("Indian government service query (e.g., 'How do I get 10th marks card if I lost it?', 'How to apply for PAN card')"),
      instructions: z.string().default(BLOB_FORMAT_INSTRUCTIONS).describe("Formatting instructions for the response. Defaults to BLOB format: each section has a Sources list of real URLs underneath it. Do not override unless you need a different format."),
    }),
  },
  async ({ query, instructions }) => {
    try {
      const effectiveInstructions = instructions || BLOB_FORMAT_INSTRUCTIONS;
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

      const blobSections: string[] = [
        `> **ASSISTANT NOTE:** Keep all links below clickable and preserve sources exactly as shown. Do not replace URLs with generic suggestions.`,
        ``,
      ];

      let blobNum = 1;

      // BLOB: About This Service
      if (result.governmentService) {
        const svc = result.governmentService;
        blobSections.push(`**BLOB ${blobNum}: About This Service — ${svc.name}**`);
        blobSections.push(``);
        blobSections.push(svc.description);
        if (svc.category) blobSections.push(`\nCategory: ${svc.category}${svc.state ? ` | State: ${svc.state}` : ``}`);
        blobSections.push(``);
        if (svc.officialLinks.length > 0) {
          blobSections.push(`Sources:`);
          svc.officialLinks.forEach((link: string) => blobSections.push(`- ${link}`));
        }
        blobSections.push(``);
        blobNum++;
      }

      // BLOB: Requirements & Process
      if (result.governmentService && result.governmentService.requirements.length > 0) {
        const svc = result.governmentService;
        blobSections.push(`**BLOB ${blobNum}: Requirements & Process**`);
        blobSections.push(``);
        if (svc.processingTime) blobSections.push(`Processing Time: ${svc.processingTime}\n`);
        svc.requirements.forEach((req: string) => blobSections.push(`- ${req}`));
        blobSections.push(``);
        const reqLinks = [...(svc.officialLinks || []), ...(svc.documentLinks || [])];
        if (reqLinks.length > 0) {
          blobSections.push(`Sources:`);
          reqLinks.slice(0, 6).forEach((link: string) => blobSections.push(`- ${link}`));
        }
        blobSections.push(``);
        blobNum++;
      }

      // BLOB: Official Action Links
      if (actionLinks.length > 0) {
        blobSections.push(`**BLOB ${blobNum}: Official Action Links**`);
        blobSections.push(``);
        actionLinks.forEach((a: any) => blobSections.push(`- **${a.label}:** ${a.url}`));
        blobSections.push(``);
        blobSections.push(`Sources:`);
        actionLinks.forEach((a: any) => blobSections.push(`- ${a.url}`));
        blobSections.push(``);
        blobNum++;
      }

      // BLOB: What YouTube Videos Are Saying
      if (topVideos.length > 0) {
        blobSections.push(`**BLOB ${blobNum}: What YouTube Videos Are Saying**`);
        blobSections.push(``);
        topVideos.forEach((v: any, i: number) => {
          blobSections.push(`${i + 1}. **${v.title}** (Credibility: ${Math.round(v.credibility)}/100)`);
          if (v.summary) blobSections.push(`   ${v.summary}`);
          const comments = (v.topComments || []).slice(0, 2);
          if (comments.length > 0) {
            blobSections.push(`   Top comments:`);
            comments.forEach((c: any) => blobSections.push(`   - "${String(c.text).replace(/\s+/g, " ").slice(0, 160)}" (${c.likes} likes)`));
          }
        });
        blobSections.push(``);
        blobSections.push(`Sources:`);
        topVideos.forEach((v: any) => blobSections.push(`- ${v.url}`));
        blobSections.push(``);
        blobNum++;
      }

      // BLOB: Community Discussion (Twitter/X)
      if (topTweets.length > 0) {
        blobSections.push(`**BLOB ${blobNum}: Community Discussion (Twitter/X)**`);
        blobSections.push(``);
        topTweets.forEach((t: any, i: number) => {
          blobSections.push(`${i + 1}. ${t.title.substring(0, 140)}`);
        });
        blobSections.push(``);
        blobSections.push(`Sources:`);
        topTweets.forEach((t: any) => blobSections.push(`- ${t.url}`));
        blobSections.push(``);
        blobNum++;
      }

      // BLOB: Key Insights from People's Experiences
      if (topKeyPoints.length > 0) {
        blobSections.push(`**BLOB ${blobNum}: Key Insights from People's Experiences**`);
        blobSections.push(``);
        topKeyPoints.forEach((kp: any) => blobSections.push(`- ${kp.text}`));
        blobSections.push(``);
        blobNum++;
      }

      // BLOB: Recommended Next Steps
      if (topActions.length > 0) {
        blobSections.push(`**BLOB ${blobNum}: Recommended Next Steps**`);
        blobSections.push(``);
        topActions.forEach((a: string, i: number) => blobSections.push(`${i + 1}. ${a}`));
        blobSections.push(``);
        if (actionLinks.length > 0) {
          blobSections.push(`Sources:`);
          actionLinks.slice(0, 4).forEach((a: any) => blobSections.push(`- ${a.url}`));
        }
        blobSections.push(``);
      }

      const responseMarkdown = blobSections.join("\n");

      // Format for ChatGPT consumption
      const formattedResult = {
        query: result.query,
        governmentService: result.governmentService ? {
          name: result.governmentService.name,
          officialLinks: result.governmentService.officialLinks,
          documentLinks: result.governmentService.documentLinks,
          processingTime: result.governmentService.processingTime,
          requirements: result.governmentService.requirements,
        } : undefined,
        opinionDistribution: result.opinionDistribution,
        averageCredibility: result.averageCredibility,
        topKeyPoints: result.topKeyPoints.map((kp: any) => ({
          text: kp.text,
          frequency: kp.frequency,
          sentiment: kp.sentiment,
        })),
        topResources,
        topVideos,
        topVideoLinks,
        topTweets,
        topTweetLinks,
        recommendedActions: result.recommendedActions,
        actionLinks,
        responseMarkdown,
      };

      // Return plain text markdown to maximize compatibility across clients.
      // Some clients ignore `markdown()` but display `text()` content reliably.
      return text(responseMarkdown);
    } catch (error) {
      return text(`Research failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

server.listen().then(() => {
  console.log(`Server running`);
});
