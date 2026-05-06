import React from "react";
import QuestionLeftLayout from "@/components/layout/questions/QuestionLeftLayout";
const page = () => {
  return (
    <div className="question-page flex gap-6 min-h-screen ">
      <div className="w-7/12">
        <QuestionLeftLayout />
      </div>
      <div className="w-5/12">aa</div>
    </div>
  );
};

export default page;
