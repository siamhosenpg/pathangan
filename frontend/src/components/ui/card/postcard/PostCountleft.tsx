import React from "react";
import BanglaNumber from "../../extra/Banglanumber";
import { useGetReactionCountQuery } from "@/redux/api/reactionApi";
import { useGetCommentsCountQuery } from "@/redux/api/commentApi";

const PostCountleft = ({ postId }: { postId: string }) => {
  const { data: reactionData, isLoading: reactionLoading } =
    useGetReactionCountQuery(postId);
  const { data: commentsData, isLoading: commentsLoading } =
    useGetCommentsCountQuery(postId);

  return (
    <div className="flex items-center gap-3">
      {/* reaction count */}

      <div className="flex items-center gap-1.5">
        <span className="font-medium">
          <BanglaNumber
            value={reactionLoading ? 0 : reactionData?.count || 0}
          />
        </span>
        <span className="text-sm">সমর্থন</span>
      </div>

      {/* comment count */}
      {commentsData && commentsData.count > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="font-medium">
            <BanglaNumber
              value={commentsLoading ? 0 : commentsData?.count || 0}
            />
          </span>
          <span className="text-sm">মতামত</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 ">
        <span className="font-medium">
          <BanglaNumber value={452} />
        </span>
        <span className="text-sm">প্রচার</span>
      </div>
    </div>
  );
};

export default PostCountleft;
