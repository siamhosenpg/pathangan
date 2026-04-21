import React from "react";
import PostProfiletop from "../postcard/PostProfiletop";
import AnswerCard from "./AnswerCard";

import { MdBookmarkBorder, MdBookmark } from "react-icons/md";

import LikeButton from "../postcard/LikeButton";
import ShareButton from "../postcard/ShareButton";
import AnswerButton from "../postcard/AnswerButton";

const QuestionCard = () => {
  return (
    <div className="bg-background pt-6 rounded-xl">
      <PostProfiletop />
      <h3 className="mt-2 px-6">ইসলামের পাঁচটি স্তম্ভ কী কী?</h3>
      <div className="px-6 mt-1 flex flex-col gap-2">
        <AnswerCard />
        <AnswerCard />
      </div>
      <div className="px-6 py-1 mt-2 border-b border-border flex items-center justify-between">
        <div className=" flex items-center gap-3 ">
          <div>
            <span className="font-medium">34</span>{" "}
            <span className="text-sm">সমর্থন</span>
          </div>
          <div>
            <span className="font-medium">34</span>{" "}
            <span className="text-sm">উত্তর </span>
          </div>
          <div>
            <span className="font-medium">34</span>{" "}
            <span className="text-sm">প্রচার</span>
          </div>
        </div>
        <button className=" text-sm font-medium text-accent hover:underline">
          আরো উত্তর দেখুন
        </button>
      </div>
      <div className="px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <LikeButton />
          <AnswerButton />
          <ShareButton />
        </div>
        <div>
          <button className="  flex items-center gap-1.5  ">
            <MdBookmarkBorder size={21} />
          </button>
          <button className="  hidden  items-center gap-1.5  ">
            <MdBookmark size={21} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
