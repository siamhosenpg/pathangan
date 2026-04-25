"use client";

import React from "react";
import StarRating from "../../star/StarRating";
import { useRouter } from "next/navigation";

import type { Answer } from "@/types/answer/answerTypes";

interface Props {
  answer: Answer;
  questionId: string;
}

const AnswerCard = ({ answer, questionId }: Props) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/answer/${answer._id}`)}
      className="flex gap-3 py-3 border border-border px-3 rounded-xl"
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
          <div className="text-sm">
            <StarRating rating={4.5} />
          </div>
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
