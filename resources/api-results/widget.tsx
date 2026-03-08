import { useWidget, type WidgetMetadata } from "mcp-use/react";
import React, { useState } from "react";
import { z } from "zod";
import { CombinedResultsSchema } from "./types.js";
import type { CombinedResults } from "./types.js";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  description: "Display YouTube videos, comments, and Twitter tweets in a list view",
  props: CombinedResultsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Searching YouTube and Twitter...",
    invoked: "Results loaded",
  },
};

const ApiResultsWidget: React.FC = () => {
  const { props, isPending, theme } = useWidget<CombinedResults>();
  const [activeTab, setActiveTab] = useState<"youtube" | "twitter" | "all">("all");

  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-slate-900" : "bg-white";
  const textColor = isDark ? "text-slate-100" : "text-slate-900";
  const borderColor = isDark ? "border-slate-700" : "border-slate-200";

  if (isPending) {
    return (
      <div className={`${bgColor} ${textColor} p-6 rounded-lg`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-300 rounded w-3/4"></div>
          <div className="h-4 bg-slate-300 rounded"></div>
          <div className="h-4 bg-slate-300 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const { youtubeResults, twitterResults, query } = props;
  const aggregatedComments = youtubeResults
    ? (youtubeResults.comments && youtubeResults.comments.length > 0
        ? youtubeResults.comments
        : Object.values(youtubeResults.commentsByVideo || {}).flat())
    : [];

  return (
    <div className={`${bgColor} ${textColor} rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${borderColor}`}>
        <h2 className="text-2xl font-bold mb-2">Search Results</h2>
        <p className={`${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Query: <span className="font-semibold">{query}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${borderColor} sticky top-0 ${bgColor}`}>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 px-4 py-3 font-medium transition ${
            activeTab === "all"
              ? `border-b-2 border-blue-500 ${isDark ? "text-blue-400" : "text-blue-600"}`
              : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All Results
        </button>
        {youtubeResults && (
          <button
            onClick={() => setActiveTab("youtube")}
            className={`flex-1 px-4 py-3 font-medium transition ${
              activeTab === "youtube"
                ? `border-b-2 border-red-500 ${isDark ? "text-red-400" : "text-red-600"}`
                : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            YouTube ({youtubeResults.videos.length})
          </button>
        )}
        {twitterResults && (
          <button
            onClick={() => setActiveTab("twitter")}
            className={`flex-1 px-4 py-3 font-medium transition ${
              activeTab === "twitter"
                ? `border-b-2 border-blue-400 ${isDark ? "text-blue-300" : "text-blue-500"}`
                : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Twitter ({twitterResults.tweets.length})
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {/* YouTube Section */}
        {(activeTab === "all" || activeTab === "youtube") && youtubeResults && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-red-500">▶</span> YouTube Videos ({youtubeResults.videos.length})
            </h3>

            {/* Videos */}
            <div className="space-y-4 mb-6">
              {youtubeResults.videos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-4 rounded-lg border transition hover:shadow-lg ${
                    isDark
                      ? "border-slate-700 hover:bg-slate-800"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-4">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-24 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 line-clamp-2">{video.title}</h4>
                      <p className={`text-sm mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {video.channelTitle}
                      </p>
                      <p
                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
                      >
                        {video.viewCount && `${parseInt(video.viewCount).toLocaleString()} views`}
                        {video.viewCount && " • "}
                        {new Date(video.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Comments */}
            {aggregatedComments.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-slate-400">
                  Top Comments ({aggregatedComments.length})
                </h4>
                <div className="space-y-3">
                  {aggregatedComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                    >
                      <div className="flex gap-2 items-start mb-2">
                        {comment.authorProfileImageUrl && (
                          <img
                            src={comment.authorProfileImageUrl}
                            alt={comment.authorDisplayName}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{comment.authorDisplayName}</p>
                          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            {new Date(comment.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs font-medium">❤️ {comment.likeCount}</span>
                      </div>
                      <p className="text-sm line-clamp-3">{comment.textDisplay}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Twitter Section */}
        {(activeTab === "all" || activeTab === "twitter") && twitterResults && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-blue-400">𝕏</span> Tweets ({twitterResults.count})
            </h3>
            <div className="space-y-4">
              {twitterResults.tweets.map((tweet) => (
                <a
                  key={tweet.id}
                  href={tweet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-4 rounded-lg border transition hover:shadow-lg ${
                    isDark
                      ? "border-slate-700 hover:bg-slate-800"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-3 mb-2">
                    {tweet.authorAvatarUrl && (
                      <img
                        src={tweet.authorAvatarUrl}
                        alt={tweet.author}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{tweet.author}</p>
                          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            @{tweet.authorHandle}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                      {new Date(tweet.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed">{tweet.text}</p>
                  <div className={`flex gap-6 text-xs font-medium ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}>
                    <span>❤️ {tweet.likeCount.toLocaleString()}</span>
                    <span>🔄 {tweet.retweetCount.toLocaleString()}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!youtubeResults && !twitterResults && (
          <div className="text-center py-8">
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              No results found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiResultsWidget;
