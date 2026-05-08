"use client";

import { useRef, useCallback } from "react";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import PostCardSkeleton from "@/components/ui/card/postcard/PostCardSkeleton";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import { useGetPostsByUserIdInfiniteQuery } from "@/redux/api/postApi";

interface ProfilePostsProps {
  userid: string;
}

export default function ProfilePosts({ userid }: ProfilePostsProps) {
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetPostsByUserIdInfiniteQuery(
    { userid, limit: 10 },
    { skip: !userid },
  );

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  if (isLoading) {
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

  if (isError) {
    return (
      <div className="w-full text-center py-10 text-text-secondary text-sm">
        পোস্ট লোড করতে সমস্যা হয়েছে
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="w-full text-center py-10 text-text-secondary text-sm">
        কোনো পোস্ট নেই
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      {posts.map((post) => {
        if (!post) return null;

        if (post.postType === "question") {
          return <QuestionCard key={post._id} post={post} />;
        }
        if (post.postType === "course") {
          return <CourseCardFeed key={post._id} post={post} />;
        }
        return <Postcard key={post._id} post={post} />;
      })}

      {/* sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* next page loading */}
      {isFetchingNextPage && (
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

      {!hasNextPage && posts.length > 0 && (
        <div className="text-center py-6 text-text-secondary text-sm">
          আর কোনো পোস্ট নেই
        </div>
      )}
    </div>
  );
}
