import React from "react";
import { FaRegHeart } from "react-icons/fa6";
const LikeButton = () => {
  return (
    <button className="  flex items-center gap-1.5  ">
      <FaRegHeart className="block" size={19} />
      <span className=" font-medium block ">সমর্থন</span>
    </button>
  );
};

export default LikeButton;
