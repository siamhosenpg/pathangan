import React from "react";
import PostProfiletop from "../postcard/PostProfiletop";

import { MdBookmarkBorder, MdBookmark } from "react-icons/md";
import { HiDotsHorizontal } from "react-icons/hi";
import BanglaNumber from "../../extra/Banglanumber";
import Image from "next/image";
import LikeButton from "../postcard/LikeButton";
import CommentsButton from "../postcard/CommentsButton";
import ShareButton from "../postcard/ShareButton";
const CourseCardFeed = () => {
  return (
    <div className="bg-background  rounded-xl">
      <div className="p-4">
        <div className="w-full rounded-xl overflow-hidden ">
          <Image
            width={600}
            height={600}
            alt=""
            className="w-full aspect-video object-cover border-t border-b border rounded-xl border-border "
            src="/image/course.jpg"
          />
        </div>
      </div>
      <div className="flex gap-4 px-6">
        <div className="w-12 h-12 rounded-full border-border border shrink-0 overflow-hidden">
          <Image
            width={600}
            height={600}
            alt=""
            className="w-full h-full  rounded-full "
            src="/image/hero.jpg"
          />
        </div>
        <div className="w-full ">
          <h3 className=" line-clamp-2">
            আমাদের প্রশ্নের উত্তর হল যে জ্ঞান এবং শিক্ষা আমাদের জীবনের সবচেয়ে
            গুরুত্বপূর্ণ অংশ। এটি আমাদের ভবিষ্যৎ গড়তে, সমাজে অবদান রাখতে এবং
            সফল হতে সাহায্য করে।
          </h3>
          <div className="flex items-center gap-2">
            <h3 className="text-sm">সিয়াম হোসেন</h3>
            <span className="text-sm text-text-tertiary">৪৯ জন বেত্তি</span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="px-6 py-1 flex items-center gap-3 border-b border-border">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">
              <BanglaNumber value={54} />
            </span>
            <span className="text-sm">সমর্থন</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">
              <BanglaNumber value={54} />
            </span>
            <span className="text-sm">মতামত </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">
              <BanglaNumber value={54} />
            </span>
            <span className="text-sm">প্রচার</span>
          </div>
        </div>

        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <LikeButton />
            <CommentsButton />
            <ShareButton />
          </div>
          <div className="flex items-center justify-end gap-4">
            <button className="bg-accent text-white font-medium px-4 py-1.5 rounded-lg">
              বার্তা পাঠান
            </button>
            <button className="  flex items-center gap-1.5  ">
              <HiDotsHorizontal size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCardFeed;
