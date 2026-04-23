import React from "react";
import EducationCard from "./EducationCard";
import WorkCard from "./WorkCard";
import type { WorkEntry, EducationEntry } from "@/types/usertypes";

interface DataTypes {
  work: WorkEntry[];
  educations: [EducationEntry];
}

const ProfileAbout = ({ work, educations }: DataTypes) => {
  return (
    <div className="p-6 bg-background rounded-xl">
      <div>
        <h5 className="p-2">কর্ম স্থল</h5>
        <div className="grid grid-cols-2 gap-2 w-full">
          {work.map((work) => (
            <WorkCard key={work._id} work={work} />
          ))}
        </div>
      </div>
      <div className="mt-2">
        <h5 className="p-2">শিক্ষাগত যোগ্যতা</h5>
        <div className="grid grid-cols-2 gap-2 w-full">
          {educations.map((education) => (
            <EducationCard key={education._id} education={education} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileAbout;
