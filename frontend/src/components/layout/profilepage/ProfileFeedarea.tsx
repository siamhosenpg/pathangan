"use client";

import { useState } from "react";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import { useGetPostsByUserIdQuery } from "@/redux/api/postApi";

interface ProfilePostsProps {
  userid: string;
}

export default function ProfilePosts({ userid }: ProfilePostsProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allPosts, setAllPosts] = useState<any[]>([]);

  const { data, isLoading, isFetching } = useGetPostsByUserIdQuery(
    { userid, cursor, limit: 10 },
    { skip: !userid, refetchOnMountOrArgChange: true },
  );

  // merge without duplicate
  (() => {
    if (!data?.posts) return;
    const existingIds = new Set(allPosts.map((p) => p._id));
    const newPosts = data.posts.filter((p: any) => !existingIds.has(p._id));
    if (newPosts.length > 0) {
      setAllPosts((prev) => [...prev, ...newPosts]);
    }
  })();

  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  // skeleton
  if (isLoading && allPosts.length === 0) {
    return (
      <div className="w-full flex justify-center py-10">
        <svg
          className="animate-spin text-accent"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 018-8"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-75"
          />
        </svg>
      </div>
    );
  }

  // empty
  if (!isLoading && allPosts.length === 0) {
    return (
      <div className="w-full text-center py-10 text-text-secondary text-sm">
        কোনো পোস্ট নেই
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      {allPosts.map((post: any) => {
        if (!post) return null;

        if (post.postType === "question") {
          return <QuestionCard key={post._id} post={post} />;
        }
        if (post.postType === "course") {
          return <CourseCardFeed key={post._id} post={post} />;
        }
        return <Postcard key={post._id} post={post} />;
      })}

      {/* load more */}
      {data?.nextCursor && (
        <button
          onClick={handleLoadMore}
          disabled={isFetching}
          className="w-full py-2.5 text-sm text-text-secondary hover:text-text-primary border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isFetching ? "লোড হচ্ছে..." : "আরো দেখুন"}
        </button>
      )}

      {isFetching && allPosts.length > 0 && (
        <div className="w-full flex justify-center py-2">
          <svg
            className="animate-spin text-accent"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-75"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
