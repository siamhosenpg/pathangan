import React from "react";
import { LuFilePenLine } from "react-icons/lu";
import { useRouter } from "next/navigation";
interface Props {
  onClick?: () => void;
}

const AnswerButton = ({ onClick }: Props) => {
  const router = useRouter();
  return (
    <button
      onClick={onClick}
      className="  flex items-center gap-1.5   cursor-pointer "
    >
      <LuFilePenLine size={19} />
      <span className=" font-medium block">উত্তর</span>
    </button>
  );
};

export default AnswerButton;
