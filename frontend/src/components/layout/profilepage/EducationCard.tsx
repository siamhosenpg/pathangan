import Image from "next/image";
import React from "react";

import type { EducationEntry } from "@/types/usertypes";
import { RiGraduationCapFill } from "react-icons/ri";

interface educationprops {
  education: EducationEntry;
}

const EducationCard = ({ education }: educationprops) => {
  return (
    <div
      key={education._id}
      className=" flex items-center gap-4 border-border border rounded-xl p-3 w-full"
    >
      <div className=" text-text-tertiary w-fit shrink-0">
        <RiGraduationCapFill size={44} />
      </div>
      <div>
        <h5>{education.institution}</h5>
        <span>{education.degree}</span>
      </div>
    </div>
  );
};

export default EducationCard;
