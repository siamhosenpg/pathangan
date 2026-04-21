import React from "react";
import StarRating from "../../star/StarRating";

const AnswerCard = () => {
  return (
    <div className="flex gap-3 py-3 border border-border px-3 rounded-xl">
      <div className="w-9 h-9 overflow-hidden rounded-full border-border border shrink-0 bg-background-tertiary">
        <img src="/image/hero.jpg" alt="" />
      </div>
      <div>
        <p className=" line-clamp-3 w-full">
          আমাদের প্রশ্নের উত্তর হল যে জ্ঞান এবং শিক্ষা আমাদের জীবনের সবচেয়ে
          গুরুত্বপূর্ণ অংশ। এটি আমাদের ভবিষ্যৎ গড়তে, সমাজে অবদান রাখতে এবং সফল
          হতে সাহায্য করে। শিক্ষার মাধ্যমে আমরা আমাদের দক্ষতা বৃদ্ধি করি এবং
          নতুন জিনিস শিখি। প্রতিটি মানুষের শিক্ষার অধিকার রয়েছে এবং এটি আমাদের
          ব্যক্তিগত উন্নয়নের চাবিকাঠি।
        </p>
        <div className="flex items-center gap-4">
          <div className=" text-sm">
            <StarRating rating={4.5} />
          </div>
          <div className=" flex items-center gap-3  mt-1 ">
            <div>
              <span className="font-medium text-sm">34</span>{" "}
              <span className="text-xs font-medium">ইতিবাচক</span>
            </div>
            <div>
              <span className="font-medium text-sm">34</span>{" "}
              <span className="text-xs font-medium">নেতিবাচক </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;
