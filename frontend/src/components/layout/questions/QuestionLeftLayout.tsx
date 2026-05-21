"use client";
import React from "react";
import { useGetAllQuestionsInfiniteQuery } from "@/redux/api/post/questionApi";

import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import PostCardSkeleton from "@/components/ui/card/postcard/PostCardSkeleton";

const QuestionLeftLayout = () => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllQuestionsInfiniteQuery({ limit: 10 });

  if (isError) {
    return <div>Error occurred while fetching questions.</div>;
  }

  return (
    <div className="question-left-layout flex flex-col gap-4 pb-14 w-full">
      {/* LOADING */}
      {isLoading && <PostCardSkeleton />}

      {/* DATA */}
      {data?.pages.map((page, pageIndex) => (
        <React.Fragment key={pageIndex}>
          {page.questions.map((question) => (
            <QuestionCard key={question._id} post={question} />
          ))}
        </React.Fragment>
      ))}

      {/* LOAD MORE BUTTON (optional) */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          className="py-2 text-sm text-blue-500"
        >
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

export default QuestionLeftLayout;
