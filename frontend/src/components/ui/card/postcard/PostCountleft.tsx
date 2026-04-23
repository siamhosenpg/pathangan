import React from "react";
import BanglaNumber from "../../extra/Banglanumber";
import { useGetReactionCountQuery } from "@/redux/api/reactionApi";

const PostCountleft = ({ postId }: { postId: string }) => {
  const { data, isLoading } = useGetReactionCountQuery(postId);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="font-medium">
          <BanglaNumber value={isLoading ? 0 : data?.count || 0} />
        </span>
        <span className="text-sm">সমর্থন</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">
          <BanglaNumber value={425} />
        </span>
        <span className="text-sm">উত্তর</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">
          <BanglaNumber value={452} />
        </span>
        <span className="text-sm">প্রচার</span>
      </div>
    </div>
  );
};

export default PostCountleft;
