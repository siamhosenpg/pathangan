import React from "react";
import QuestionLeftLayout from "@/components/layout/questions/QuestionLeftLayout";
const page = () => {
  return (
    <div className="question-page flex gap-6 min-h-[calc(100vh-90px)] w-full">
      <div className=" w-full lg:w-7/12 ">
        <QuestionLeftLayout />
      </div>
      <div className=" hidden w-0 lg:w-5/12 lg:block"></div>
    </div>
  );
};

export default page;
