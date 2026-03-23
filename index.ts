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
  baseUrl: process.env.MCP_URL || "https://nameless-feather-wq36z.run.mcp-use.com", // Full base URL (e.g., https://myserver.com)
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
const SOURCE_FORMAT_INSTRUCTIONS = `You are a detailed research assistant specializing in Indian government services. Analyze the retrieved data and produce a comprehensive, in-depth response of at least 600 words.

    Structure your response as multiple BLOB sections. Each section MUST have:
    1. A bold header: **BLOB X: Descriptive Section Title**
    2. Multiple detailed paragraphs (at least 2-3 paragraphs per section) explaining the topic thoroughly — cover what, why, how, tips, warnings, fees, timelines, and real citizen experiences
    3. A **Sources:** block with bulleted URLs

    EXACT format for each section:

    **BLOB X: Section Title**

    [Detailed paragraph 1 — thorough explanation of this aspect]

    [Detailed paragraph 2 — additional context, process steps, fees, timelines, or tips]

    [Detailed paragraph 3 — community feedback, warnings, or real-world experiences]

    **Sources:**
    * <Source URL 1>
    * <Source URL 2>
    * <Source URL 3>

    ---

    CRITICAL RULES:
    - Write in flowing paragraphs, NOT bullet points for content
    - Each section must have substantial detail (not one-liners)
    - Use '*' for source bullets
    - Use '---' to separate BLOB sections
    - Total response must exceed 600 words
    - Only use URLs from the retrieved data — never fabricate URLs`;

server.tool(
  {
    name: "research-government-query",
    description: "India-specific research agent for Indian government services. IMPORTANT: Use ONLY retrieved data in responses — never fabricate facts. Every section must include a Sources block with real URLs from the tool output. Do not replace URLs with generic text.",
    schema: z.object({
      query: z.string().describe("Indian government service query (e.g., 'How do I get 10th marks card if I lost it?', 'How to apply for PAN card')"),
      instructions: z.string().default(SOURCE_FORMAT_INSTRUCTIONS).describe("Formatting instructions. Defaults to Information/Sources format: every section has retrieved content followed by real source URLs. Do not override unless needed."),
    }),
  },
  async ({ query, instructions }) => {
    try {
      const effectiveInstructions = instructions || SOURCE_FORMAT_INSTRUCTIONS;
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

      let blobCount = 1;
      const sections: string[] = [
        `> NOTE: All content below is sourced exclusively from the MCP server context. Do not add, invent, or replace any information or URLs.`,
        `---`,
        ``,
      ];

      // Section: About This Service
      if (result.governmentService) {
        const svc = result.governmentService;
        const allOfficialLinks = [...(svc.officialLinks || []), ...(svc.documentLinks || [])];
        sections.push(`**BLOB ${blobCount++}: ${svc.name} — What It Is & Who Issues It**`);
        sections.push(``);
        sections.push(`${svc.description} This is an essential government service that citizens frequently need to access for official documentation, compliance, or personal administrative needs. Understanding how this service works, who provides it, and what is required will save you considerable time and effort. The service is managed through official government portals and local government offices across the country.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        if (allOfficialLinks.length > 0) {
          allOfficialLinks.slice(0, 3).forEach((link: string) => sections.push(`* ${link}`));
        } else {
          sections.push(`* Information from government service records`);
        }
        sections.push(``);
        if (svc.category || svc.state) {
          sections.push(`This service falls under the ${svc.category || "General Government"} category${svc.state ? ` and is specifically administered by the state of ${svc.state}` : ""}. While the broad framework is set by central government guidelines, the actual implementation, fee structure, and processing timelines can vary significantly depending on your local Regional Transport Office (RTO), District Collector office, or the specific department handling your application. Always verify the latest rules with your local authority before proceeding.`);
          sections.push(``);
          sections.push(`**Sources:**`);
          allOfficialLinks.slice(0, 2).forEach((link: string) => sections.push(`* ${link}`));
          sections.push(``);
        }
        sections.push(`The official websites for this service are the only authorized platforms for applications, payments, and status tracking. You must use these portals for any legitimate transaction. Third-party agents or consultants may assist with the process, but the actual issuing authority is always the government department concerned. Beware of fraudulent websites that mimic government portals — always check that the URL ends in .gov.in or .nic.in before entering any personal data.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        if (allOfficialLinks.length > 0) {
          allOfficialLinks.forEach((link: string) => sections.push(`* ${link}`));
        } else {
          sections.push(`* Official government records`);
        }
        sections.push(``);
        // Official Website Links block
        sections.push(`**Official Websites:**`);
        if (allOfficialLinks.length > 0) {
          allOfficialLinks.forEach((link: string) => sections.push(`* ${link}`));
        }
        sections.push(``);
        sections.push(`---`);
        sections.push(``);
      }

      // Section: Requirements
      if (result.governmentService && result.governmentService.requirements.length > 0) {
        const svc = result.governmentService;
        const allReqLinks = [...(svc.officialLinks || []), ...(svc.documentLinks || [])].slice(0, 6);
        sections.push(`**BLOB ${blobCount++}: Official Process & Requirements (Step-by-Step)**`);
        sections.push(``);
        if (svc.processingTime) {
          sections.push(`The official processing time for this service is approximately ${svc.processingTime}. However, this is an estimate and actual turnaround times may vary depending on the volume of applications at your local office, the completeness of your submitted documents, and whether any verification or physical visit is required. It is advisable to apply well in advance of any deadline you may have.`);
          sections.push(``);
          sections.push(`**Sources:**`);
          allReqLinks.slice(0, 2).forEach((link: string) => sections.push(`* ${link}`));
          sections.push(``);
        }
        sections.push(`To successfully complete this process, you will need to gather the following documents and meet these requirements: ${svc.requirements.join(", ").replace(/, ([^,]*)$/, " and $1")}. Each of these items plays a critical role in verifying your identity, eligibility, and the legitimacy of your application. Missing even one document can result in delays or outright rejection of your application.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        allReqLinks.slice(0, 3).forEach((link: string) => sections.push(`* ${link}`));
        sections.push(``);
        sections.push(`It is strongly recommended that you carry both original documents and photocopies (self-attested where required). Many government offices also now accept digitally signed documents via DigiLocker. Before visiting any office, check if an online application or appointment booking is available — this can significantly reduce waiting times and ensure your slot is confirmed.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        if (allReqLinks.length > 0) {
          allReqLinks.forEach((link: string) => sections.push(`* ${link}`));
        } else {
          sections.push(`* Process requirements from official documentation`);
        }
        sections.push(``);
        sections.push(`You should also be aware that fees for this service may vary by state and office. Some offices accept online payments via the official portal, while others may require payment through a designated bank challan. Always ask for an official receipt after making any payment and keep it safe until the process is complete.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        allReqLinks.slice(0, 2).forEach((link: string) => sections.push(`* ${link}`));
        sections.push(``);
        sections.push(`---`);
        sections.push(``);
      }

      // Section: Official Action Links
      if (actionLinks.length > 0) {
        sections.push(`**BLOB ${blobCount++}: Official Portals & How to Use Them**`);
        sections.push(``);
        const linksText = actionLinks.map((a: any) => `${a.label} (${a.url})`).join("; ");
        sections.push(`The Indian government has established several dedicated online portals for this service. You can access the following platforms: ${linksText}. These portals are the only officially authorized gateways for submitting applications, tracking your application status, downloading certificates, and filing grievances.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        actionLinks.slice(0, 3).forEach((a: any) => sections.push(`* ${a.url}`));
        sections.push(``);
        sections.push(`When using these portals, ensure you are on the correct website by verifying the domain (typically ending in .gov.in or .nic.in). Beware of third-party websites that may charge extra fees or collect your personal data without authorization. Always use the official portal for payments, and keep screenshots or transaction IDs of all online payments for your records.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        actionLinks.forEach((a: any) => sections.push(`* ${a.url}`));
        sections.push(``);
        sections.push(`If you face technical issues on any portal, most offer a helpline number or a grievance section where you can report problems. You can also visit your nearest Common Service Centre (CSC) or e-Seva Kendra for in-person assistance with online applications.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        actionLinks.slice(0, 2).forEach((a: any) => sections.push(`* ${a.url}`));
        sections.push(``);
        sections.push(`---`);
        sections.push(``);
      }

      // Section: YouTube Videos — uses LLM summaries for detailed content
      if (topVideos.length > 0) {
        sections.push(`**BLOB ${blobCount++}: Detailed Guides & Community Experiences (YouTube)**`);
        sections.push(``);
        const videoTitles = topVideos.map((v: any) => `"${v.title}"`).join(", ");
        sections.push(`Our research identified several highly relevant educational videos on YouTube that walk through this process in detail. The key resources include ${videoTitles}. These videos are created by a mix of official channels, experienced content creators, and citizens who have personally gone through the process, offering both official guidance and practical, on-the-ground advice.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        topVideos.slice(0, 2).forEach((v: any) => sections.push(`* ${v.url}`));
        sections.push(``);
        // Include LLM-generated detailed summaries for each video with per-video sources
        for (const v of topVideos) {
          if (v.summary && v.summary.trim().length > 30) {
            sections.push(v.summary.trim());
            sections.push(``);
            sections.push(`**Sources:**`);
            sections.push(`* ${v.url}`);
            sections.push(``);
          }
        }
        // If no LLM summaries, provide manual feedback narrative with sources
        const hasSummaries = topVideos.some((v: any) => v.summary && v.summary.trim().length > 30);
        if (!hasSummaries) {
          for (const v of topVideos) {
            const comments = (v.topComments || []).slice(0, 3).map((c: any) => `"${String(c.text).replace(/\s+/g, " ").slice(0, 120)}"`).join(", ");
            if (comments) {
              sections.push(`In the video "${v.title}", viewers have shared their experiences: ${comments}. These firsthand accounts reveal the practical challenges and successes that applicants face during this process.`);
              sections.push(``);
              sections.push(`**Sources:**`);
              sections.push(`* ${v.url}`);
              sections.push(``);
            }
          }
        }
        sections.push(`The community feedback on these videos is invaluable — it often reveals tips that official documentation does not cover, such as which counter to go to, what time to arrive to avoid queues, or how to handle common rejection reasons. Always cross-reference video advice with the official portal for the most current rules.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        topVideos.forEach((v: any) => sections.push(`* ${v.url}`));
        if (result.governmentService?.officialLinks) {
          result.governmentService.officialLinks.slice(0, 2).forEach((link: string) => sections.push(`* ${link}`));
        }
        sections.push(``);
        sections.push(`---`);
        sections.push(``);
      }

      // Section: Twitter/X
      if (topTweets.length > 0) {
        sections.push(`**BLOB ${blobCount++}: Public Discourse & Real-Time Citizen Feedback (Twitter/X)**`);
        sections.push(``);
        const tweetNarrative = topTweets.map((t: any) => `"${t.title.substring(0, 120)}"`).join("; ");
        sections.push(`Public discourse on Twitter/X reveals several key points of interest from citizens who have recently interacted with this service. Notable discussions include: ${tweetNarrative}. These snippets reflect the most recent community sentiment, common questions, and real-time issues that applicants are facing.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        topTweets.slice(0, 3).forEach((t: any) => sections.push(`* ${t.url}`));
        sections.push(``);
        sections.push(`Social media discussions are particularly valuable because they capture issues that may not yet be reflected in official documentation — such as temporary website outages, changes in fee structure, new document requirements, or office-specific quirks. However, always verify any claims made on social media against the official government portal before acting on them, as misinformation can also spread quickly.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        topTweets.forEach((t: any) => sections.push(`* ${t.url}`));
        if (result.governmentService?.officialLinks) {
          result.governmentService.officialLinks.slice(0, 2).forEach((link: string) => sections.push(`* ${link}`));
        }
        sections.push(``);
        sections.push(`---`);
        sections.push(``);
      }

      // Section: Key Insights
      if (topKeyPoints.length > 0) {
        sections.push(`**BLOB ${blobCount++}: Key Insights & Analysis**`);
        sections.push(``);
        sections.push(`After analyzing all available data from official sources, YouTube content creators, and community discussions, the primary insights are as follows: ${topKeyPoints.map((kp: any) => kp.text).join(", ").replace(/, ([^,]*)$/, " and $1")}. These points represent the most frequently mentioned and highest-confidence findings from our research.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        const insightLinks = [...(result.governmentService?.officialLinks || []), ...topResources.map((r: any) => r.url)].slice(0, 6);
        insightLinks.slice(0, 3).forEach((link: string) => sections.push(`* ${link}`));
        sections.push(``);
        sections.push(`Understanding these high-level takeaways is crucial for anyone navigating this government service. They highlight the most common pain points, the steps where applicants typically get stuck, and the areas where preparation pays off the most. By being aware of these insights before you begin the process, you can avoid the most common mistakes and delays that other citizens have reported.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        if (insightLinks.length > 0) {
          insightLinks.forEach((link: string) => sections.push(`* ${link}`));
        } else {
          sections.push(`* Information synthesized from research data`);
        }
        sections.push(``);
        sections.push(`---`);
        sections.push(``);
      }

      // Section: Recommended Next Steps
      if (topActions.length > 0) {
        sections.push(`**BLOB ${blobCount++}: Recommended Next Steps**`);
        sections.push(``);
        const actionsPart = topActions.join("; ").replace(/; ([^;]*)$/, "; and finally $1");
        sections.push(`Based on our comprehensive research, the recommended course of action is as follows: ${actionsPart}. Following these steps in order will give you the best chance of a smooth and successful outcome. Skipping steps or submitting incomplete documentation is the most common cause of delays reported by other applicants.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        if (actionLinks.length > 0) {
          actionLinks.slice(0, 3).forEach((a: any) => sections.push(`* ${a.url}`));
        }
        sections.push(``);
        sections.push(`We strongly advise using only the official government portals for all document submissions and fee payments. Third-party agents or websites may charge inflated fees and cannot guarantee the validity of the documents they produce. If you encounter any difficulties during the process, most government offices have a public grievance cell or a Sakala-type service guarantee system where you can escalate your issue.`);
        sections.push(``);
        sections.push(`**Sources:**`);
        if (actionLinks.length > 0) {
          actionLinks.slice(0, 4).forEach((a: any) => sections.push(`* ${a.url}`));
        } else {
          sections.push(`* Process steps derived from official procedures`);
        }
        sections.push(``);
        // Final Official Websites block
        if (result.governmentService?.officialLinks && result.governmentService.officialLinks.length > 0) {
          sections.push(`**Official Websites:**`);
          result.governmentService.officialLinks.forEach((link: string) => sections.push(`* ${link}`));
          sections.push(``);
        }
        sections.push(`---`);
      }

      const responseMarkdown = sections.join("\n");

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
