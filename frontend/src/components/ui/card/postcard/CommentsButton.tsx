import React from "react";
import { FaRegComment } from "react-icons/fa6";
const CommentsButton = () => {
  return (
    <button className="  flex items-center gap-1.5  ">
      <FaRegComment size={19} />
      <span className=" font-medium block mt-0.5">মতামত</span>
    </button>
  );
};

export default CommentsButton;
