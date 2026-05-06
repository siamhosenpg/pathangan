"use client";
import React from "react";
import { useGetAllQuestionsQuery } from "@/redux/api/post/questionApi";
import Postcard from "@/components/ui/card/postcard/Postcard";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
const QuestionLeftLayout = () => {
  const { data, isLoading, isError } = useGetAllQuestionsQuery({});

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error occurred while fetching questions.</div>;

  return (
    <div className="question-left-layout flex flex-col gap-4 pb-14">
      {data?.questions.map((question) => (
        <QuestionCard key={question._id} post={question} />
      ))}
    </div>
  );
};

export default QuestionLeftLayout;
