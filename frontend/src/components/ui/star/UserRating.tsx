import React from "react";
import StarRating from "./StarRating";
import { useGetUserAverageRatingQuery } from "@/redux/api/rating/ratingApi";
import BanglaNumber from "../extra/Banglanumber";

const UserRating = ({ userId }: { userId: string }) => {
  const { data, isLoading, isError } = useGetUserAverageRatingQuery(userId, {
    skip: !userId, // ✅ userId না থাকলে query skip করবে
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 opacity-30 animate-pulse">
        <StarRating rating={0} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-3">
        <StarRating rating={0} />
        <span className="text-sm font-medium text-text-secondary">
          <BanglaNumber value={0} /> জন রেটিং দিয়েছে
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <StarRating rating={data?.averageRating || 0} />
      <span className="text-sm font-medium text-text-secondary">
        <BanglaNumber value={data?.totalRatingCount || 0} /> জন রেটিং দিয়েছে
      </span>
    </div>
  );
};

export default UserRating;
