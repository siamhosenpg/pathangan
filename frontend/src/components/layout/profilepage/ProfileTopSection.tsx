"use client";
import { useAppSelector } from "@/redux/hooks";
import FollowButton from "@/components/ui/buttons/FollowButton";
import StarRating from "@/components/ui/star/StarRating";
import Image from "next/image";
import type { User } from "@/types/usertypes";
import FollowStats from "./FollowStats";
import Link from "next/link";

interface dataprops {
  data: User;
}

const ProfileTopSection = ({ data }: dataprops) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isOwnProfile = currentUser?.id === data._id;

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
      <div className="relative -mt-6 pl-6 pr-2 flex items-center justify-between">
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

        {/* FOLLOW বা EDIT PROFILE */}
        <div>
          {isOwnProfile ? (
            <Link
              href="/edit-profile"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary hover:border-accent hover:text-accent transition-all text-sm font-medium"
            >
              {/* pencil icon */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              প্রোফাইল সম্পাদনা
            </Link>
          ) : (
            <FollowButton targetUserId={data._id} />
          )}
        </div>
      </div>

      <div className="mt-3">
        <FollowStats userId={data._id} />
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
