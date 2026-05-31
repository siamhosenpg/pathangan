"use client";

import { useGetAllCoursesInfiniteQuery } from "@/redux/api/post/courseApi";
import React from "react";

export default function CoursesPage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllCoursesInfiniteQuery({
    limit: 10,
  });

  if (isLoading) {
    return <div className="p-6 text-center">Loading courses...</div>;
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-500">Failed to load courses</div>
    );
  }

  const courses = data?.pages?.flatMap((page) => page.courses) || [];

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">All Courses</h1>

      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course._id} className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{course.course.title}</h2>

            <p className="text-sm text-gray-600 mt-1">
              {course.course.description}
            </p>

            <div className="mt-2 text-sm">💰 Price: {course.course.price}</div>

            <div className="mt-2 text-xs text-gray-500">
              ❤️ Likes: {course.likesCount} | 💬 Comments:{" "}
              {course.commentsCount}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="text-center mt-6">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 bg-black text-white rounded"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
