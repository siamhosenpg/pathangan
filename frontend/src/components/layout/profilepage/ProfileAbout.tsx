import React from "react";
import EducationCard from "./EducationCard";
import WorkCard from "./WorkCard";

const ProfileAbout = () => {
  return (
    <div className="p-6 bg-background rounded-xl">
      <div>
        <h5 className="p-2">কর্ম স্থল</h5>
        <div className="grid grid-cols-2 gap-2 w-full">
          <WorkCard />
          <WorkCard />
        </div>
      </div>
      <div className="mt-2">
        <h5 className="p-2">শিক্ষাগত যোগ্যতা</h5>
        <div className="grid grid-cols-2 gap-2 w-full">
          <EducationCard />
          <EducationCard />
        </div>
      </div>
    </div>
  );
};

export default ProfileAbout;
