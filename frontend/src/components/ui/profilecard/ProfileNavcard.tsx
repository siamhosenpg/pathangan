"use client";
import Image from "next/image";
import React from "react";
import { HiBadgeCheck } from "react-icons/hi";
import StarRating from "../star/StarRating";

import { useAppSelector } from "@/redux/hooks";
import Link from "next/link";

const ProfileNavcard = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user)
    return (
      <div className="p-6 bg-background rounded-xl h-fit shrink-0 flex items-center gap-2.5 animate-pulse">
        {/* Profile Image Skeleton */}
        <div className="w-14 h-14 rounded-full bg-background-tertiary " />

        {/* Text Section */}
        <div className="flex-1 space-y-2">
          {/* Name */}
          <div className="h-4 w-32 bg-background-tertiary  rounded" />

          {/* Rating */}
          <div className="h-3 w-24 bg-background-tertiary rounded" />
        </div>
      </div>
    );
  return (
    <div className="p-6 bg-background rounded-xl h-fit shrink-0 flex items-center gap-2.5">
      <Link
        href={`/${user.username}`}
        className="w-14 h-14 overflow-hidden rounded-full border border-border"
      >
        {user.profileImage ? (
          <Image
            alt="profile"
            src={user.profileImage}
            width={90}
            height={90}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center bg-accent-secondary">
            <span className="text-2xl font-bold text-accent">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Link>
      <div>
        <div className="flex items-center gap-3">
          <h5 className="flex items-center gap-1.5">
            {user.name} <HiBadgeCheck className="text-accent" />
          </h5>
        </div>
        <div className=" text-text-secondary   flex gap-2  items-center">
          <StarRating rating={4.6} />
          <span className=" text-sm">৪৯ জন বেত্তি </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileNavcard;
