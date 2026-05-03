"use client";

import type { Answer } from "@/types/answer/answerTypes";
import {
  useGiveRatingMutation,
  useGetRatingsByAnswerQuery,
  useGetMyRatingQuery,
} from "@/redux/api/rating/ratingApi";

export function AnswerDetail({ answer }: { answer: Answer }) {
  const { data: ratingStats } = useGetRatingsByAnswerQuery(answer._id);
  const { data: myRating } = useGetMyRatingQuery(answer._id);
  const [giveRating, { isLoading }] = useGiveRatingMutation();

  const currentRating = myRating?.userRating ?? 0;
  const averageRating = ratingStats?.averageRating ?? 0;
  const ratingCount = ratingStats?.ratingCount ?? 0;

  const hasRated = currentRating > 0;

  const handleRating = async (star: number) => {
    if (isLoading) return;
    await giveRating({ answerId: answer._id, rating: star });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-background rounded-2xl p-5">
        <p className="text-xs text-text-tertiary mb-3">উত্তর</p>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-background-secondary overflow-hidden shrink-0">
            {answer.userId.profileImage ? (
              <img
                src={answer.userId.profileImage}
                alt={answer.userId.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-text-secondary">
                {answer.userId.name?.[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {answer.userId.name}
            </p>
          </div>
        </div>

        {/* Answer Text */}
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {answer.text}
        </p>

        {/* Rating Section */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-text-tertiary mb-2">
            {hasRated ? "আপনার রেটিং" : "এই উত্তরটি রেট করুন"}
          </p>

          <div className="flex items-center gap-2">
            {/* Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                // আমি rate করলে আমার rating দেখাবে হলুদে
                // rate না করলে সব star ধূসর — average দেখাবে না
                const isFilledByMe = hasRated && currentRating >= star;

                return (
                  <button
                    key={star}
                    disabled={isLoading}
                    onClick={() => handleRating(star)}
                    className="text-2xl leading-none transition-transform active:scale-90 disabled:opacity-50"
                  >
                    <span
                      className={
                        isFilledByMe ? "text-yellow-400" : "text-border"
                      }
                    >
                      ★
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stats — সবসময় দেখাবে যদি rating থাকে */}
            {ratingCount > 0 && (
              <div className="flex items-center gap-1 ml-1">
                <span className="text-sm font-semibold text-text-primary">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-text-tertiary">
                  ({ratingCount} জন)
                </span>
              </div>
            )}
          </div>

          {/* আমি rate করলে feedback দেখাবে */}
          {hasRated && (
            <p className="text-xs text-text-tertiary mt-1.5">
              আপনি{" "}
              <span className="text-yellow-400 font-medium">
                {currentRating} তারা
              </span>{" "}
              দিয়েছেন
            </p>
          )}
        </div>

        {/* Votes & Best Answer */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <span className="font-medium text-sm">{answer.upvotesCount}</span>{" "}
            <span className="text-xs text-text-tertiary">ইতিবাচক</span>
          </div>
          <div>
            <span className="font-medium text-sm">{answer.downvotesCount}</span>{" "}
            <span className="text-xs text-text-tertiary">নেতিবাচক</span>
          </div>
          {answer.isBestAnswer && (
            <span className="ml-auto text-xs font-medium text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
              সেরা উত্তর ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
