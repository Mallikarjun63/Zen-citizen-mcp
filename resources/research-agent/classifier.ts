import type { SentimentType, SentimentScore, CommentLabel } from "./types.js";

/**
 * Sentiment Classifier for analyzing opinions and feedback
 * Uses pattern matching for efficient, offline classification
 */

interface SentimentPatterns {
  positive: string[];
  negative: string[];
  unhelpful: string[];
  spam: string[];
}

const SENTIMENT_PATTERNS: SentimentPatterns = {
  positive: [
    "works", "great", "helpful", "thank", "thanks", "solved", "fixed", "easy", "simple",
    "fantastic", "excellent", "perfect", "loved", "awesome", "best", "tried", "worked",
    "successful", "success", "amazing", "brilliant", "superb", "wonderful", "verified",
    "confirmed", "genuine", "authentic", "official", "legit", "100%", "definitely",
    "actually worked", "got it", "received", "approved", "completed", "done", "finished"
  ],
  negative: [
    "doesn't work", "not work", "failed", "scam", "fake", "wrong", "terrible", "awful",
    "waste", "useless", "misleading", "confusing", "complicated", "difficult", "bad",
    "horrible", "worst", "don't bother", "avoid", "fraud", "cheating", "error",
    "not helpful", "unhelpful", "couldn't", "can't", "doesn't", "never", "rejected",
    "denied", "refused", "problem", "issue", "glitch", "broken"
  ],
  unhelpful: [
    "idk", "not sure", "dunno", "unclear", "confusing", "vague", "incomplete",
    "missing info", "no idea", "couldn't help", "didn't help", "irrelevant",
    "off topic", "random", "nonsense", "doesn't apply", "not applicable"
  ],
  spam: [
    "click here", "subscribe now", "link in bio", "follow me", "dm me", "buy now",
    "limited time", "only today", "urgently", "hurry", "act now", "free money",
    "get rich", "work from home", "earn passive", "affiliate", "referral",
    "xxx", "bit.ly", "goo.gl", "promo code", "discount code"
  ]
};

/**
 * Classify sentiment of given text
 */
export function classifySentiment(text: string): SentimentScore {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  // Count pattern matches
  const positiveCount = countMatches(lowerText, SENTIMENT_PATTERNS.positive);
  const negativeCount = countMatches(lowerText, SENTIMENT_PATTERNS.negative);
  const unhelpfulCount = countMatches(lowerText, SENTIMENT_PATTERNS.unhelpful);
  const spamCount = countMatches(lowerText, SENTIMENT_PATTERNS.spam);

  // Determine dominant sentiment
  let sentiment: SentimentType = "neutral";
  let confidence = 50;

  const scores = {
    positive: positiveCount,
    negative: negativeCount,
    unhelpful: unhelpfulCount,
    spam: spamCount,
  };

  // Find dominant sentiment
  let maxScore = 0;
  let maxSentiment: SentimentType = "neutral";

  if (positiveCount > maxScore) {
    maxScore = positiveCount;
    maxSentiment = "positive";
  }
  if (spamCount > maxScore) {
    maxScore = spamCount;
    maxSentiment = "spam";
  }
  if (negativeCount > maxScore) {
    maxScore = negativeCount;
    maxSentiment = "negative";
  }
  if (unhelpfulCount > maxScore) {
    maxScore = unhelpfulCount;
    maxSentiment = "unhelpful";
  }

  // Spam takes priority
  if (spamCount > 0) {
    sentiment = "spam";
    confidence = Math.min(100, 70 + spamCount * 10);
  } else if (maxScore > 0) {
    sentiment = maxSentiment;
    // Confidence based on match count and text length
    confidence = Math.min(100, 60 + Math.min(40, maxScore * 15));
  }

  // Extract keywords that influenced the classification
  const keywords = extractKeywords(lowerText, SENTIMENT_PATTERNS, sentiment);

  return {
    sentiment,
    confidence,
    keywords,
  };
}

/**
 * Classify a comment as either an `opinion` or `information`.
 * Returns a simple label, confidence (0-100) and keywords that influenced the label.
 */
export function classifyComment(text: string): {
  label: CommentLabel;
  confidence: number;
  keywords: string[];
} {
  const lower = text.toLowerCase();

  const opinionPatterns = [
    "i think", "i feel", "in my opinion", "imo", "i'm not sure", "i was", "i'd", "i've", "we should", "should", "recommend", "suggest", "best", "worst", "love", "hate", "agree", "disagree", "believe", "think", "feels", "feeling",
  ];

  const infoPatterns = [
    "documents", "form", "apply", "application", "fee", "fees", "process", "required", "requirement", "upload", "download", "link", "official", "office", "address", "phone", "contact", "website", "id", "passport", "certificate", "birth", "date", "₹", "rupee", "days", "weeks", "months", "hours", "minutes",
  ];

  let opinionCount = 0;
  let infoCount = 0;
  const found: string[] = [];

  for (const p of opinionPatterns) {
    const re = new RegExp(`\\b${escapeRegex(p)}\\b`, "i");
    if (re.test(lower)) {
      opinionCount++;
      found.push(p);
    }
  }

  for (const p of infoPatterns) {
    const re = new RegExp(`\\b${escapeRegex(p)}\\b`, "i");
    if (re.test(lower)) {
      infoCount++;
      found.push(p);
    }
  }

  // Heuristic: if informational keywords dominate, label as information; if opinion keywords dominate, label as opinion
  let label: CommentLabel = "other";
  let confidence = 50;

  if (infoCount > opinionCount) {
    label = "information";
    confidence = Math.min(95, 50 + infoCount * 20);
  } else if (opinionCount > infoCount) {
    label = "opinion";
    confidence = Math.min(95, 50 + opinionCount * 20);
  } else if (infoCount === opinionCount && infoCount > 0) {
    // both present — lean toward information if text contains numbers or currency
    const hasNumber = /\d+/.test(lower) || /₹/.test(lower) || /rupee/.test(lower);
    if (hasNumber) {
      label = "information";
      confidence = 70;
    } else {
      label = "opinion";
      confidence = 60;
    }
  } else {
    // no clear matches — try short heuristics: presence of verbs like 'apply' or 'submit' indicates information
    if (/\b(apply|submit|required|documents|form)\b/i.test(lower)) {
      label = "information";
      confidence = 60;
    } else if (/\b(i think|imo|in my opinion|i feel|i believe)\b/i.test(lower)) {
      label = "opinion";
      confidence = 60;
    } else {
      label = "other";
      confidence = 50;
    }
  }

  return { label, confidence, keywords: found.slice(0, 6) };
}

/**
 * Count pattern matches in text
 */
function countMatches(text: string, patterns: string[]): number {
  let count = 0;
  for (const pattern of patterns) {
    // Use word boundary matching
    const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Extract keywords that influenced classification
 */
function extractKeywords(text: string, patterns: SentimentPatterns, sentiment: SentimentType): string[] {
  const patternList = patterns[sentiment === "positive" ? "positive" : sentiment === "negative" ? "negative" : sentiment === "spam" ? "spam" : "unhelpful"];
  
  const found: string[] = [];
  for (const pattern of patternList) {
    const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b`, "gi");
    if (regex.test(text)) {
      found.push(pattern);
    }
  }
  return found.slice(0, 5); // Top 5 keywords
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Calculate helpfulness score based on sentiment and text quality
 */
export function calculateHelpfulnessScore(
  text: string,
  likes: number,
  sentiment: SentimentType
): number {
  let score = 50; // Base score

  // Sentiment impact
  if (sentiment === "positive" || sentiment === "helpful") score += 30;
  if (sentiment === "negative" || sentiment === "unhelpful") score -= 20;
  if (sentiment === "spam") score = 0;

  // Text length impact (longer = potentially more detailed)
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 20) score += 10;
  if (wordCount < 5) score -= 5;

  // Engagement impact (normalized)
  const engagementBonus = Math.min(20, Math.floor(Math.log(likes + 1) * 2));
  score += engagementBonus;

  return Math.max(0, Math.min(100, score));
}

/**
 * Extract actionable key points from text
 */
export function extractKeyPoints(text: string): string[] {
  const lines = text.split(/[.\n!?]/);
  const keyPoints: string[] = [];

  // Look for action items and important information
  const actionKeywords = ["need", "must", "should", "visit", "contact", "call", "submit", "apply", "provide", "bring", "go to"];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains action keywords
    if (actionKeywords.some(kw => trimmed.toLowerCase().includes(kw))) {
      if (trimmed.length > 10 && trimmed.length < 200) {
        keyPoints.push(trimmed);
      }
    }
  }

  return keyPoints.slice(0, 5);
}
