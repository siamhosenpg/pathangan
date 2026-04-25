"use client";

import { use } from "react";
import BackButton from "@/components/ui/buttons/BackButton";
import { useGetAnswerByIdQuery } from "@/redux/api/answer/answersApi";

import { useGetPostByIdQuery } from "@/redux/api/postApi";
import { AnswerDetail } from "@/components/ui/card/questioncard/AnswerDetail";

interface Props {
  params: Promise<{ answerId: string }>;
}

export default function AnswerDetailPage({ params }: Props) {
  const { answerId } = use(params);
  const { data, isLoading, isError } = useGetAnswerByIdQuery(answerId);

  const questionId = data?.answer?.questionId ?? "";
  const { data: questionData, isLoading: questionLoading } =
    useGetPostByIdQuery(questionId, { skip: !questionId });

  const isPageLoading = isLoading || (!!questionId && questionLoading);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <BackButton />
      </div>

      {isPageLoading ? (
        <div className="flex flex-col gap-4">
          {/* question skeleton */}
          <div className="bg-background rounded-2xl p-5 animate-pulse">
            <div className="h-3 w-16 bg-background-secondary rounded mb-3" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-background-secondary shrink-0" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-background-secondary rounded" />
                <div className="h-2.5 w-16 bg-background-secondary rounded" />
              </div>
            </div>
            <div className="h-5 w-3/4 bg-background-secondary rounded" />
          </div>

          {/* answer skeleton */}
          <div className="bg-background rounded-2xl p-5 animate-pulse">
            <div className="h-3 w-12 bg-background-secondary rounded mb-3" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-background-secondary shrink-0" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-background-secondary rounded" />
                <div className="h-2.5 w-16 bg-background-secondary rounded" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full bg-background-secondary rounded" />
              <div className="h-3 w-full bg-background-secondary rounded" />
              <div className="h-3 w-4/5 bg-background-secondary rounded" />
              <div className="h-3 w-full bg-background-secondary rounded" />
              <div className="h-3 w-2/3 bg-background-secondary rounded" />
            </div>
          </div>
        </div>
      ) : isError || !data?.answer ? (
        <div className="bg-background rounded-2xl p-5 text-center">
          <p className="text-sm text-text-tertiary">
            উত্তর খুঁজে পাওয়া যায়নি।
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* question card */}
          {/* question card */}
          {questionData && (
            <div className="bg-background rounded-2xl p-5">
              <p className="text-xs text-text-tertiary mb-2">প্রশ্ন</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-background-secondary overflow-hidden shrink-0">
                  {questionData.userid?.profileImage ? (
                    <img
                      src={questionData.userid.profileImage}
                      alt={questionData.userid.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-text-secondary">
                      {questionData.userid?.name?.[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {questionData.userid?.name}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {questionData.userid?.username}
                  </p>
                </div>
              </div>
              <h2 className="text-base font-semibold text-text-primary leading-snug">
                {questionData.question?.questionText}
              </h2>
            </div>
          )}

          {/* answer card */}
          <AnswerDetail answer={data.answer} />
        </div>
      )}
    </div>
  );
}
