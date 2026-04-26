"use client";

import React, { useState } from "react";

import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
} from "@/redux/api/followApi";
import { useAppSelector } from "@/redux/hooks";

interface Props {
  targetUserId: string;
}

const FollowButton = ({ targetUserId }: Props) => {
  const currentUser = useAppSelector((state) => state.auth.user);

  const { data: followers, isLoading: checkingFollow } =
    useGetFollowersQuery(targetUserId);

  const isFollowing = followers?.some((f) =>
    typeof f.followerId === "object"
      ? f.followerId._id === currentUser?.id
      : f.followerId === currentUser?.id,
  );

  const [followUser, { isLoading: following }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: unfollowing }] = useUnfollowUserMutation();

  const isLoading = checkingFollow || following || unfollowing;

  const handleToggle = async () => {
    if (!currentUser) return;
    try {
      if (isFollowing) {
        await unfollowUser(targetUserId).unwrap();
      } else {
        await followUser(targetUserId).unwrap();
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  if (currentUser?.id === targetUserId) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`font-semibold transition-all duration-200 ${
        isFollowing
          ? "text-muted-foreground hover:text-red-500"
          : "text-accent hover:opacity-80"
      }`}
    >
      {isLoading ? "..." : isFollowing ? "অনুসরণ করা হচ্ছে" : "অনুসরণ করুন"}
    </button>
  );
};

export default FollowButton;
