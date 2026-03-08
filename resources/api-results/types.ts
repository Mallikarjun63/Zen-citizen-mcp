import { z } from "zod";

// YouTube Types
export const YouTubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string(),
  channelTitle: z.string(),
  viewCount: z.string().optional(),
  publishedAt: z.string(),
  url: z.string(),
});

export const YouTubeCommentSchema = z.object({
  id: z.string(),
  authorDisplayName: z.string(),
  textDisplay: z.string(),
  likeCount: z.number(),
  videoId: z.string().optional(),
  publishedAt: z.string(),
  authorProfileImageUrl: z.string().optional(),
});

export const YouTubeResultsSchema = z.object({
  videos: z.array(YouTubeVideoSchema),
  comments: z.array(YouTubeCommentSchema),
  commentsByVideo: z.record(z.string(), z.array(YouTubeCommentSchema)).optional(),
  query: z.string(),
});

// Twitter Types
export const TwitterTweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string(),
  authorName: z.string().optional(),
  authorHandle: z.string(),
  authorAvatarUrl: z.string().optional(),
  authorVerified: z.boolean().optional(),
  createdAt: z.string(),
  likeCount: z.number(),
  retweetCount: z.number(),
  replyCount: z.number().optional(),
  url: z.string(),
});

export const TwitterResultsSchema = z.object({
  tweets: z.array(TwitterTweetSchema),
  query: z.string(),
  count: z.number(),
});

// Combined Results
export const CombinedResultsSchema = z.object({
  query: z.string(),
  youtubeResults: YouTubeResultsSchema.optional(),
  twitterResults: TwitterResultsSchema.optional(),
});

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  viewCount?: string;
  publishedAt: string;
  url: string;
};

export type YouTubeComment = {
  id: string;
  authorDisplayName: string;
  textDisplay: string;
  likeCount: number;
  publishedAt: string;
  videoId?: string;
  authorProfileImageUrl?: string;
};

export type YouTubeResults = {
  videos: YouTubeVideo[];
  comments: YouTubeComment[];
  commentsByVideo?: Record<string, YouTubeComment[]>;
  query: string;
};

export type TwitterTweet = {
  id: string;
  text: string;
  author: string;
  authorName?: string;
  authorHandle: string;
  authorAvatarUrl?: string;
  authorVerified?: boolean;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount?: number;
  url: string;
};

export type TwitterResults = {
  tweets: TwitterTweet[];
  query: string;
  count: number;
};

export type CombinedResults = {
  query: string;
  youtubeResults?: YouTubeResults;
  twitterResults?: TwitterResults;
  authorInfo?: Record<string, any>;
};
