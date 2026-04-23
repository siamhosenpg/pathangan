import React from "react";
import { FaRegHeart } from "react-icons/fa6";

import {
  useToggleReactionMutation,
  useCheckUserLikedQuery,
} from "@/redux/api/reactionApi";

const LikeButton = ({ postId }: { postId: string }) => {
  const { data } = useCheckUserLikedQuery(postId);
  const [toggleReaction, { isLoading }] = useToggleReactionMutation();

  const handleLike = async () => {
    try {
      await toggleReaction(postId).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const isLiked = data?.liked;

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className="flex items-center gap-1.5 transition-all duration-200"
    >
      <FaRegHeart
        size={19}
        className={`block transition-all duration-200 ${
          isLiked ? "text-green-500 scale-110" : "text-gray-600"
        }`}
      />

      <span
        className={`font-medium block transition-all duration-200 ${
          isLiked ? "text-green-500" : "text-gray-700"
        }`}
      >
        সমর্থন
      </span>
    </button>
  );
};

export default LikeButton;
