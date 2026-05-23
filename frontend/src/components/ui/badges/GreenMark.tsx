import { BiSolidBadgeCheck } from "react-icons/bi";

interface GreenMarkProps {
  mark: boolean;
  style?: string;
}

const GreenMark = ({ mark, style }: GreenMarkProps) => {
  return (
    <span className={`text-accent ${style || ""}`}>
      {mark && <BiSolidBadgeCheck />}
    </span>
  );
};

export default GreenMark;
