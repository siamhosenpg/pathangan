import React from "react";
import { MdOutlineWork } from "react-icons/md";

const WorkCard = () => {
  return (
    <div className=" flex items-center gap-4 border-border border rounded-xl p-3 w-full">
      <div className=" text-text-tertiary w-fit shrink-0">
        <MdOutlineWork size={44} />
      </div>
      <div>
        <h5>রাজশাহী বিশ্ববিদ্যালয়</h5>
        <span>ইসলামের ইতিহাস ও সংস্কৃতি</span>
      </div>
    </div>
  );
};

export default WorkCard;
