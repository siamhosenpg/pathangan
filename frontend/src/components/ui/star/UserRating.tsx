import React from "react";
import StarRating from "./StarRating";
import { useGetUserAverageRatingQuery } from "@/redux/api/rating/ratingApi";
import BanglaNumber from "../extra/Banglanumber";

const UserRating = ({ userId }: { userId: string }) => {
  const { data, isLoading, isError } = useGetUserAverageRatingQuery(userId);

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
        <span className="text-sm font-medium text-text-secondary">
          রেটিং তথ্য লোড করা যায়নি
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 ">
      <StarRating rating={data?.averageRating || 0} />
      <span className="text-sm font-medium text-text-secondary">
        <BanglaNumber value={data?.totalRatingCount || 0} /> জন বেত্তি
      </span>
    </div>
  );
};

export default UserRating;
