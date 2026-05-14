import React from "react";
import BanglaNumber from "../../extra/Banglanumber";

interface Props {
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
}

const PostCountleft = ({
  likesCount = 0,
  commentsCount = 0,
  sharesCount = 0,
}: Props) => {
  return (
    <div className="flex items-center gap-3 ">
      {/* reaction count */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-xs lg:text-sm">
          <BanglaNumber value={likesCount} />
        </span>
        <span className=" text-xs lg:text-sm">সমর্থন</span>
      </div>

      {/* comment count */}
      {commentsCount > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-xs lg:text-sm">
            <BanglaNumber value={commentsCount} />
          </span>
          <span className=" text-xs lg:text-sm">মতামত</span>
        </div>
      )}

      {/* share count */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-xs lg:text-sm ">
          <BanglaNumber value={sharesCount} />
        </span>
        <span className=" text-xs lg:text-sm">প্রচার</span>
      </div>
    </div>
  );
};

export default PostCountleft;
