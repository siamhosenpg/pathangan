import React from "react";
import { LuFilePenLine } from "react-icons/lu";
const AnswerButton = () => {
  return (
    <button className="  flex items-center gap-1.5  ">
      <LuFilePenLine size={19} />
      <span className=" font-medium block mt-0.5">উত্তর</span>
    </button>
  );
};

export default AnswerButton;
