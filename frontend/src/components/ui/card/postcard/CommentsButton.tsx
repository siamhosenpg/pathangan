import React from "react";
import { FaRegComment } from "react-icons/fa6";

interface Props {
  onClick?: () => void;
}

const CommentsButton = ({ onClick }: Props) => {
  return (
    <button onClick={onClick} className="  flex items-center gap-1.5  ">
      <FaRegComment size={19} />
      <span className=" font-medium block ">মতামত</span>
    </button>
  );
};

export default CommentsButton;
