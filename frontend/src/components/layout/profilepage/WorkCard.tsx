import React from "react";
import { MdOutlineWork } from "react-icons/md";
import type { WorkEntry } from "@/types/usertypes";
interface workprops {
  work: WorkEntry;
}
const WorkCard = ({ work }: workprops) => {
  return (
    <div
      key={work._id}
      className=" flex items-center gap-4 border-border border rounded-xl p-3 w-full"
    >
      <div className=" text-text-tertiary w-fit shrink-0">
        <MdOutlineWork size={44} />
      </div>
      <div>
        <h5>{work.industry}</h5>
        <span>{work.position}</span>
      </div>
    </div>
  );
};

export default WorkCard;
