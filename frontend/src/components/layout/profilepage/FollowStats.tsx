"use client";

import React from "react";

import {
  useGetFollowersCountQuery,
  useGetFollowingCountQuery,
} from "@/redux/api/followApi";

interface Props {
  userId: string;
}

const FollowStats = ({ userId }: Props) => {
  const { data: followersData, isLoading: loadingFollowers } =
    useGetFollowersCountQuery(userId);

  const { data: followingData, isLoading: loadingFollowing } =
    useGetFollowingCountQuery(userId);

  return (
    <div className="flex items-center gap-6 px-6">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-foreground">
          {loadingFollowers ? "..." : (followersData?.followersCount ?? 0)}
        </span>
        <span className="text-sm text-muted-foreground">অনুসরণকারী</span>
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-foreground">
          {loadingFollowing ? "..." : (followingData?.followingCount ?? 0)}
        </span>
        <span className="text-sm text-muted-foreground">অনুসরণ করছি</span>
      </div>
    </div>
  );
};

export default FollowStats;
