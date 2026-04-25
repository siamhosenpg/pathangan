"use client";

import React, { useState } from "react";
import PostProfiletop from "../postcard/PostProfiletop";
import AnswerCard from "./AnswerCard";
import LikeButton from "../postcard/LikeButton";
import ShareButton from "../postcard/ShareButton";
import AnswerButton from "../postcard/AnswerButton";
import type { Post } from "@/types/postTypes";
import PostCountleft from "../postcard/PostCountleft";
import BookmarkButton from "../../buttons/BookmarkButton";
import AnswerPopup from "./AnswerPopup";

import { useGetAnswersByQuestionQuery } from "@/redux/api/answer/answersApi";

interface Props {
  post: Post;
}

const QuestionCard = ({ post }: Props) => {
  const { userid, question, createdAt, _id } = post;
  const [showAnswerPopup, setShowAnswerPopup] = useState(false);

  const { data, isLoading } = useGetAnswersByQuestionQuery({
    questionId: _id,
    limit: 2,
  });

  return (
    <div className="bg-background pt-6 rounded-xl">
      <PostProfiletop user={userid} createdAt={createdAt} />
      <h3 className="mt-2 px-6">{question?.questionText}</h3>

      <div className="px-6 mt-2 flex flex-col gap-2">
        {isLoading ? (
          <>
            <div className="h-20 rounded-xl bg-background-secondary animate-pulse" />
            <div className="h-20 rounded-xl bg-background-secondary animate-pulse" />
          </>
        ) : (
          data?.answers.map((answer) => (
            <AnswerCard key={answer._id} answer={answer} questionId={_id} />
          ))
        )}
      </div>

      <div className="px-6 py-1 mt-2 border-b border-border flex items-center justify-between">
        <PostCountleft postId={post._id} />
        <button className="text-sm font-medium text-accent hover:underline">
          আরো উত্তর দেখুন
        </button>
      </div>

      <div className="px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <LikeButton postId={_id} />
          <AnswerButton onClick={() => setShowAnswerPopup(true)} />
          <ShareButton />
        </div>
        <BookmarkButton postId={post._id} />
      </div>

      {showAnswerPopup && (
        <AnswerPopup
          questionId={_id}
          questionText={question?.questionText ?? ""}
          onClose={() => setShowAnswerPopup(false)}
        />
      )}
    </div>
  );
};

export default QuestionCard;
