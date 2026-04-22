import FollowButton from "@/components/ui/buttons/FollowButton";
import StarRating from "@/components/ui/star/StarRating";
import Image from "next/image";
import React from "react";

const ProfileTopSection = () => {
  return (
    <div className="bg-background rounded-xl p-4 pb-6">
      <div className=" relative">
        <Image
          alt=""
          src="/image/demo.png"
          width={800}
          height={300}
          className="w-full aspect-6/2 rounded-xl bg-amber-300 object-cover"
        />
      </div>
      <div className=" relative -mt-6 pl-6 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-36 h-36 rounded-full border-background border-8 ">
            <Image
              alt=""
              src="/image/hero.jpg"
              width={800}
              height={300}
              className="w-full aspect-square rounded-full bg-amber-300 object-cover"
            />
          </div>
          <div className=" mt-2">
            <h1 className="text-xl font-bold">সিয়াম হোসেন</h1>
            <div className="flex items-center gap-3 mt-1 ">
              <StarRating rating={4.5} />
              <span>৪৯ জন বেত্তি</span>
            </div>
          </div>
        </div>
        <div>
          <FollowButton />
        </div>
      </div>
      <div className="mt-4 px-6">
        <h2 className="font-semibold  text-lg">ইতিহাস হাজার হাজার বছর পুরনো</h2>
        <p className="mt-1.5">
          আমাদের প্রশ্নের উত্তর হল যে জ্ঞান এবং শিক্ষা আমাদের জীবনের সবচেয়ে
          গুরুত্বপূর্ণ অংশ। এটি আমাদের ভবিষ্যৎ গড়তে, সমাজে অবদান রাখতে এবং সফল
          হতে সাহায্য করে। শিক্ষার মাধ্যমে আমরা আমাদের দক্ষতা বৃদ্ধি করি এবং
          নতুন জিনিস শিখি।
        </p>
      </div>
    </div>
  );
};

export default ProfileTopSection;
