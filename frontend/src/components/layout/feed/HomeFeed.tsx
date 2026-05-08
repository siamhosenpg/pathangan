"use client";

import { useRef, useCallback } from "react";

import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import PostCardSkeleton from "@/components/ui/card/postcard/PostCardSkeleton";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import { useGetPostsInfiniteQuery } from "@/redux/api/postApi";

export default function HomeFeed() {
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetPostsInfiniteQuery({ limit: 10 });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  // sentinel ref — এই div স্ক্রিনে আসলে next page fetch হবে
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
      <div className="w-full space-y-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
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

      {posts.length === 0 && (
        <div className="text-center py-10 text-text-secondary text-sm">
          কোনো পোস্ট নেই
        </div>
      )}

      {/* sentinel — scroll এর শেষে */}
      <div ref={sentinelRef} className="h-4" />

      {/* next page loading skeleton */}
      {isFetchingNextPage && (
        <div className="w-full space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}

      {/* সব পোস্ট শেষ */}
      {!hasNextPage && posts.length > 0 && (
        <div className="text-center py-6 text-text-secondary text-sm">
          আর কোনো পোস্ট নেই
        </div>
      )}
    </div>
  );
}
