import Image from "next/image";
import React from "react";
import BanglaNumber from "../../extra/Banglanumber";

const CourseCard = () => {
  return (
    <div className=" flex items-center gap-4 pr-2 ">
      <div className="w-38 shrink-0">
        <Image
          alt=""
          src="/image/course.jpg"
          width={800}
          height={300}
          className="w-full  rounded-xl bg-amber-300 object-cover"
        />
      </div>
      <div>
        <h5 className=" line-clamp-2 ">
          শিক্ষার মাধ্যমে আমরা আমাদের দক্ষতা বৃদ্ধি করি এবং নতুন জিনিস শিখি।
          শিক্ষার মাধ্যমে আমরা আমাদের দক্ষতা বৃদ্ধি করি এবং নতুন জিনিস শিখি।
        </h5>
        <div className="mt-1 text-sm">
          <BanglaNumber value={34} /> জন বেত্তি
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
