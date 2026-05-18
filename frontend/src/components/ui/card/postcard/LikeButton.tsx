import React, { useState, useEffect } from "react";
import { FaRegHeart, FaHeart } from "react-icons/fa6";
import { useToggleReactionMutation } from "@/redux/api/reactionApi";

const LikeButton = ({
  postId,
  initialLiked,
}: {
  postId: string;
  initialLiked: boolean;
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [toggleReaction, { isLoading }] = useToggleReactionMutation();

  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  const handleLike = async () => {
    try {
      const res = await toggleReaction(postId).unwrap();
      setIsLiked(res.liked);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className="flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
    >
      {isLiked ? (
        <FaHeart
          size={19}
          className={`block transition-all duration-200 text-accent`}
        />
      ) : (
        <FaRegHeart size={19} className={`block transition-all duration-200`} />
      )}

      <span
        className={`font-medium block transition-all duration-200 ${
          isLiked ? "text-accent" : "text-text"
        }`}
      >
        সমর্থন
      </span>
    </button>
  );
};

export default LikeButton;
