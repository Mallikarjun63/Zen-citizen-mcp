import axios from "axios";
import type { YouTubeResults, TwitterResults, YouTubeVideo, YouTubeComment, TwitterTweet } from "./resources/api-results/types.js";
import type { ResearchQueryResult } from "./resources/research-agent/types.js";
import { processYouTubeResults, processTwitterResults, compileResearchResult } from "./resources/research-agent/orchestrator.js";
import { summarizeForVideo } from "./resources/research-agent/llm.js";

/**
 * YouTube API Helper
 * Requires: YOUTUBE_API_KEY environment variable
 */
export async function searchYouTube(query: string): Promise<YouTubeResults> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable not set");
  }

  try {
    // Search for videos - India specific
    const searchResponse = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        q: query,
        key: apiKey,
        part: "snippet",
        type: "video",
        maxResults: 5,
        relevanceLanguage: "en",
        regionCode: "IN", // India specific
        relevantLanguage: "en,hi", // English and Hindi
      },
    });

    const videos: YouTubeVideo[] = searchResponse.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || "",
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    // Fetch comments for each video (top 3 comments per video), build commentsByVideo map and aggregated comments list
    const commentsByVideo: Record<string, YouTubeComment[]> = {};
    const aggregatedComments: YouTubeComment[] = [];

    for (const video of videos) {
      try {
        const commentsResponse = await axios.get("https://www.googleapis.com/youtube/v3/commentThreads", {
          params: {
            videoId: video.id,
            key: apiKey,
            part: "snippet",
            maxResults: 3,
            textFormat: "plainText",
          },
        });

        const videoComments: YouTubeComment[] = (commentsResponse.data.items || [])
          .map((thread: any) => {
            const comment = thread.snippet.topLevelComment.snippet;
            return {
              id: thread.id,
              authorDisplayName: comment.authorDisplayName,
              textDisplay: comment.textDisplay,
              likeCount: comment.likeCount,
              publishedAt: comment.publishedAt,
              authorProfileImageUrl: comment.authorProfileImageUrl,
              videoId: video.id,
            };
          })
          .slice(0, 3);

        commentsByVideo[video.id] = videoComments;
        aggregatedComments.push(...videoComments);
      } catch (error) {
        console.warn(`Could not fetch comments for video ${video.id}:`, (error as any)?.message || error);
        commentsByVideo[video.id] = [];
      }
    }

    return {
      videos,
      comments: aggregatedComments,
      commentsByVideo,
      query,
    };
  } catch (error) {
    throw new Error(`YouTube search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Twitter/X API Helper
 * Requires: TWITTER_BEARER_TOKEN environment variable
 * Filters for India-specific content
 */
export async function searchTwitter(query: string): Promise<TwitterResults> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error("TWITTER_BEARER_TOKEN environment variable not set");
  }

  try {
    // Add India context to query for region-specific results
    const indiaQuery = `(${query}) (India OR Indian OR "in" OR "IN") lang:en`;
    
    const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
      params: {
        query: indiaQuery,
        "tweet.fields": "public_metrics,created_at,author_id",
        "user.fields": "username,profile_image_url,verified",
        expansions: "author_id",
        max_results: 10,
      },
    });

    const users = response.data.includes?.users || [];
    const userMap = Object.fromEntries(users.map((u: any) => [u.id, u]));

    const tweets: TwitterTweet[] = (response.data.data || []).map((tweet: any) => {
      const author = userMap[tweet.author_id];
      return {
        id: tweet.id,
        text: tweet.text,
        author: author?.name || "Unknown",
        authorName: author?.name || "Unknown",
        authorHandle: author?.username || "unknown",
        authorAvatarUrl: author?.profile_image_url,
        authorVerified: author?.verified || false,
        createdAt: tweet.created_at,
        likeCount: tweet.public_metrics?.like_count || 0,
        retweetCount: tweet.public_metrics?.retweet_count || 0,
        replyCount: tweet.public_metrics?.reply_count || 0,
        url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
      };
    });

    return {
      tweets,
      query,
      count: tweets.length,
    };
  } catch (error) {
    throw new Error(`Twitter search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Combined search for both platforms
 * Twitter is optional - research agent works with just YouTube
 */
export async function searchBothPlatforms(query: string): Promise<{
  youtube: YouTubeResults | null;
  twitter: TwitterResults | null;
  errors: string[];
}> {
  const errors: string[] = [];
  let youtube: YouTubeResults | null = null;
  let twitter: TwitterResults | null = null;

  // Search YouTube (REQUIRED)
  try {
    youtube = await searchYouTube(query);
  } catch (error) {
    errors.push(`YouTube: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Search Twitter (OPTIONAL - graceful fail)
  try {
    twitter = await searchTwitter(query);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[Research Agent] Twitter unavailable (${errorMsg}) - continuing with YouTube only`);
    // Don't add to errors - Twitter is optional
  }

  return { youtube, twitter, errors };
}

/**
 * Research Agent for Government Services - INDIA SPECIFIC
 * PRIMARY: YouTube (working)
 * OPTIONAL: Twitter (graceful fallback)
 * Integrates YouTube and optionally Twitter, with Indian government service database
 * Searches only for India-specific content and resources
 * Provides curated insights with sentiment analysis and credibility scoring
 */
export async function researchGovernmentQuery(query: string, instructions?: string): Promise<ResearchQueryResult> {
  try {
    console.log(`[Research Agent - India] Processing query: "${query}"`);

    // Fetch data from both platforms (India-specific)
    const { youtube, twitter, errors } = await searchBothPlatforms(query);

    if (errors.length > 0) {
      console.warn("[Research Agent] Errors during data collection:", errors);
    }

    if (!youtube && !twitter) {
      throw new Error("No data retrieved from any source");
    }

    // Process raw data through sentiment classifier and credibility scorer
    const youtubeResources = youtube ? processYouTubeResults(youtube) : [];
    const twitterResources = twitter ? processTwitterResults(twitter) : [];

    console.log(
      `[Research Agent] Processed ${youtubeResources.length} YouTube resources${twitter ? ` and ${twitterResources.length} Twitter resources` : " (Twitter unavailable)"}`
    );

    // Attach LLM-generated summaries to YouTube resources (if OpenAI key is available)
    if (youtube && youtubeResources.length > 0) {
      for (const res of youtubeResources) {
        try {
          const video = youtube.videos.find((v) => v.id === res.id);
          const commentsForVideo = youtube.commentsByVideo?.[res.id] || [];
          const summary = await summarizeForVideo(
            video?.title || res.title,
            video?.description || "",
            commentsForVideo,
            instructions
          );
          if (!res.metadata) res.metadata = {} as any;
          (res.metadata as any).summary = summary;
        } catch (err) {
          console.warn("Failed to summarize resource", res.id, (err as any)?.message || err);
        }
      }
    }

    // Compile final research result
    const result = compileResearchResult(query, youtubeResources, twitterResources);

    console.log(
      `[Research Agent] Research complete. Opinion distribution: ${result.opinionDistribution.helpful}% helpful, ${result.opinionDistribution.unhelpful}% unhelpful`
    );

    return result;
  } catch (error) {
    throw new Error(
      `Research failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

