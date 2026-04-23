import React from "react";
import PostProfiletop from "../postcard/PostProfiletop";
import AnswerCard from "./AnswerCard";
import { MdBookmarkBorder } from "react-icons/md";
import LikeButton from "../postcard/LikeButton";
import ShareButton from "../postcard/ShareButton";
import AnswerButton from "../postcard/AnswerButton";
import BanglaNumber from "../../extra/Banglanumber";
import type { Post } from "@/types/postTypes";
import PostCountleft from "../postcard/PostCountleft";

interface Props {
  post: Post;
}

const QuestionCard = ({ post }: Props) => {
  const { userid, question, createdAt, _id } = post;

  return (
    <div className="bg-background pt-6 rounded-xl">
      <PostProfiletop user={userid} createdAt={createdAt} />
      <h3 className="mt-2 px-6">{question?.questionText}</h3>

      <div className="px-6 mt-2 flex flex-col gap-2">
        <AnswerCard />
        <AnswerCard />
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
          <AnswerButton />
          <ShareButton />
        </div>
        <button className="flex items-center gap-1.5">
          <MdBookmarkBorder size={21} />
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
