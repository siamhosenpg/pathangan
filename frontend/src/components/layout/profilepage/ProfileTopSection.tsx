import FollowButton from "@/components/ui/buttons/FollowButton";
import StarRating from "@/components/ui/star/StarRating";
import Image from "next/image";
import React from "react";
import type { User } from "@/types/usertypes";

interface dataprops {
  data: User;
}

const ProfileTopSection = ({ data }: dataprops) => {
  return (
    <div className="bg-background rounded-xl p-4 pb-6">
      {/* COVER */}
      <div className="relative">
        {data.coverImage ? (
          <Image
            alt="cover"
            src={data.coverImage}
            width={800}
            height={300}
            className="w-full aspect-6/2 rounded-xl object-cover"
          />
        ) : (
          <div className="w-full aspect-6/2 rounded-xl bg-emerald-500/20" />
        )}
      </div>

      {/* PROFILE ROW */}
      <div className="relative -mt-6 pl-6 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* PROFILE IMAGE */}
          <div className="w-36 h-36 rounded-full border-background border-8 shrink-0 overflow-hidden bg-accent/20">
            {data.profileImage ? (
              <Image
                alt="profile"
                src={data.profileImage}
                width={144}
                height={144}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-accent-secondary">
                <span className="text-4xl font-bold text-accent">
                  {data.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* NAME + RATING */}
          <div className="mt-2">
            <h1 className="text-xl font-bold">{data.name}</h1>

            <div className="flex items-center gap-3 mt-1">
              <StarRating rating={4.5} />
              <span>৪৯ জন বেত্তি</span>
            </div>
          </div>
        </div>

        <div>
          <FollowButton />
        </div>
      </div>

      {/* BIO + ABOUT */}
      <div className="mt-4 px-6">
        {data.bio && <h2 className="font-semibold text-lg">{data.bio}</h2>}
        {data.aboutText && <p className="mt-1.5">{data.aboutText}</p>}
      </div>
    </div>
  );
};

export default ProfileTopSection;
