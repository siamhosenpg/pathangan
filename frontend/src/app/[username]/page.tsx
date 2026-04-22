import ProfileAbout from "@/components/layout/profilepage/ProfileAbout";
import ProfileTopSection from "@/components/layout/profilepage/ProfileTopSection";
import CourseCard from "@/components/ui/card/course/CourseCard";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import React from "react";

const page = () => {
  return (
    <div className="w-full flex gap-6">
      <div className="grid grid-cols-1 gap-4 w-7/12 pb-12">
        <ProfileTopSection />
        <ProfileAbout />
        <Postcard />
        <CourseCardFeed />
        <QuestionCard />
      </div>
      <div className="p-4 bg-background w-5/12 rounded-xl h-fit flex flex-col gap-4">
        <CourseCard />
        <CourseCard />
        <CourseCard />
      </div>
    </div>
  );
};

export default page;
