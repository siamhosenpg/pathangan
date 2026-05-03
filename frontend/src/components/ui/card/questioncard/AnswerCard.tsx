"use client";

import React from "react";
import StarRating from "../../star/StarRating";
import { useRouter } from "next/navigation";
import { useGetRatingsByAnswerQuery } from "@/redux/api/rating/ratingApi";

import type { Answer } from "@/types/answer/answerTypes";

interface Props {
  answer: Answer;
  questionId: string;
}

const AnswerCard = ({ answer, questionId }: Props) => {
  const router = useRouter();

  const { data: ratingStats } = useGetRatingsByAnswerQuery(answer._id);
  const averageRating = ratingStats?.averageRating ?? 0;

  return (
    <div
      onClick={() => router.push(`/answer/${answer._id}`)}
      className="flex gap-3 py-3 border border-border px-3 rounded-xl cursor-pointer active:scale-95 transition"
    >
      <div className="w-9 h-9 overflow-hidden rounded-full border-border border shrink-0 bg-background-tertiary">
        <img
          src={answer.userId.profileImage || "/image/hero.jpg"}
          alt={answer.userId.name}
        />
      </div>
      <div>
        <p className="line-clamp-3 w-full">{answer.text}</p>
        <div className="flex items-center gap-4 mt-1">
          {/* Rating */}
          {averageRating > 0 && (
            <div className="text-sm">
              <StarRating rating={averageRating} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div>
              <span className="font-medium text-sm">{answer.upvotesCount}</span>{" "}
              <span className="text-xs font-medium text-text-tertiary">
                ইতিবাচক
              </span>
            </div>
            <div>
              <span className="font-medium text-sm">
                {answer.downvotesCount}
              </span>{" "}
              <span className="text-xs font-medium text-text-tertiary">
                নেতিবাচক
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;
