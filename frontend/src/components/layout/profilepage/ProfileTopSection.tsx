"use client";
import { useAppSelector } from "@/redux/hooks";
import FollowButton from "@/components/ui/buttons/FollowButton";
import Image from "next/image";
import type { User } from "@/types/usertypes";
import FollowStats from "./FollowStats";
import Link from "next/link";
import UserRating from "@/components/ui/star/UserRating";

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
      <div className="relative -mt-6 pl-3 md:pl-6 pr-2 flex items-end md:items-center justify-between">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6">
          {/* PROFILE IMAGE */}
          <div className="w-20 h-20 md:w-36 md:h-36 rounded-full border-background border-4 md:border-8 shrink-0 overflow-hidden bg-accent/20">
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
                <span className="text-2xl md:text-4xl font-bold text-accent">
                  {data.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* NAME + RATING */}
          <div className="mt-1 md:mt-2">
            <h1 className="text-base md:text-xl font-bold">{data.name}</h1>
            <div className="mt-1">
              <UserRating userId={data._id} />
            </div>
          </div>
        </div>

        {/* FOLLOW বা EDIT PROFILE */}
        <div className="shrink-0 self-end md:self-auto pb-1 md:pb-0">
          {isOwnProfile ? (
            <Link
              href="/edit-profile"
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-border text-text-secondary hover:border-accent hover:text-accent transition-all text-xs md:text-sm font-medium"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 md:w-[15px] md:h-[15px]"
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
              <span className="hidden md:block">প্রোফাইল</span>
              <span className="md:hidden">সম্পাদনা</span>
              <span className="hidden md:block">সম্পাদনা</span>
            </Link>
          ) : (
            <FollowButton targetUserId={data._id} />
          )}
        </div>
      </div>

      <div className="mt-3">
        <FollowStats activityStats={data.activityStats} />
      </div>

      {/* BIO + ABOUT */}
      <div className="mt-4 px-3 md:px-6">
        {data.bio && (
          <h2 className="font-semibold text-base md:text-lg">{data.bio}</h2>
        )}
        {data.aboutText && (
          <p className="mt-1.5 text-sm md:text-base">{data.aboutText}</p>
        )}
      </div>
    </div>
  );
};

export default ProfileTopSection;
