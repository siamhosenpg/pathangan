"use client";

import { FaStar, FaRegStar } from "react-icons/fa";
import {
  useGiveRatingMutation,
  useGetRatingsByAnswerQuery,
  useGetMyRatingQuery,
} from "@/redux/api/rating/ratingApi";
import { useState } from "react";

interface Props {
  answerId: string;
}

export function AnswerRating({ answerId }: Props) {
  const { data: ratingStats } = useGetRatingsByAnswerQuery(answerId);
  const { data: myRating } = useGetMyRatingQuery(answerId);
  const [giveRating, { isLoading }] = useGiveRatingMutation();

  // hover state — কোন star এ mouse আছে
  const [hovered, setHovered] = useState<number>(0);

  const currentRating = myRating?.userRating ?? 0;
  const averageRating = ratingStats?.averageRating ?? 0;
  const ratingCount = ratingStats?.ratingCount ?? 0;
  const hasRated = currentRating > 0;

  const handleRating = async (star: number) => {
    if (isLoading) return;
    await giveRating({ answerId, rating: star });
  };

  // কোন star টা filled দেখাবে তা নির্ধারণ
  // hover করলে hover value, না হলে আমার দেওয়া rating
  const activeRating = hovered > 0 ? hovered : currentRating;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs text-text-tertiary mb-2">
        {hasRated ? "আপনার রেটিং" : "এই উত্তরটি রেট করুন"}
      </p>

      <div className="flex items-center gap-2">
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = activeRating >= star;

            return (
              <button
                key={star}
                disabled={isLoading}
                onClick={() => handleRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="text-xl leading-none transition-transform active:scale-90 disabled:opacity-50 p-0.5"
              >
                {isFilled ? (
                  <FaStar className="text-accent" />
                ) : (
                  <FaRegStar className="text-border" />
                )}
              </button>
            );
          })}
        </div>

        {/* Stats */}
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

      {/* Feedback */}
      {hasRated && (
        <p className="text-xs text-text-tertiary mt-1.5">
          আপনি{" "}
          <span className="text-accent font-medium">{currentRating} তারা</span>{" "}
          দিয়েছেন
        </p>
      )}
    </div>
  );
}
