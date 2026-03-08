// Sentiment Analysis Types
export type SentimentType = "positive" | "negative" | "neutral" | "helpful" | "unhelpful" | "spam";

export interface SentimentScore {
  sentiment: SentimentType;
  confidence: number; // 0-100
  keywords: string[];
}

// Opinion Data
export interface Opinion {
  text: string;
  sentiment: SentimentType;
  confidence: number;
  likes: number;
  relevanceScore: number; // 0-100
  source: "youtube_comment" | "tweet" | "user";
  timestamp: string;
}

// Key Point Extraction
export interface KeyPoint {
  text: string;
  frequency: number; // how many sources mention this
  sentiment: SentimentType;
  sources: string[];
  evidenceCount: number;
}

// Credibility Metrics
export interface CredibilityMetrics {
  overall: number; // 0-100
  engagement: number; // likes/retweets ratio
  recency: number; // 0-100 (newer = higher)
  source_authority: string; // "official" | "verified" | "community" | "unknown"
  verification_status: boolean;
}

// Research Result Structure
export interface ResearchResource {
  id: string;
  title: string;
  url: string;
  type: "official" | "video" | "tweet" | "guide" | "forum";
  credibility: CredibilityMetrics;
  opinions: Opinion[];
  keyPoints: KeyPoint[];
  metadata: {
    author?: string;
    channelName?: string;
    publishDate?: string;
    views?: number;
    likes?: number;
    comments?: number;
    summary?: string;
  };
}

// Government Service Entry
export interface GovernmentService {
  id: string;
  name: string;
  keywords: string[];
  description: string;
  officialLinks: string[];
  category: string;
  state?: string;
  requirements: string[];
  processingTime: string;
  relatedServices: string[];
}

// Research Query Result
export interface ResearchQueryResult {
  query: string;
  timestamp: string;
  governmentService?: GovernmentService;
  resources: ResearchResource[];
  opinionDistribution: {
    helpful: number; // %
    unhelpful: number; // %
    neutral: number; // %
  };
  averageCredibility: number; // 0-100
  topKeyPoints: KeyPoint[];
  recommendedActions: string[];
}
