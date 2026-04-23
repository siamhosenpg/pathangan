"use client";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import { useGetPostsQuery } from "@/redux/api/postApi";

export default function HomeFeed() {
  const { data, isLoading, isError } = useGetPostsQuery({});

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
  console.log("posts data:", data?.posts);
  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      {data?.posts.map((post) => {
        if (!post) return null; // ← এটা যোগ করো

        if (post.postType === "question") {
          return <QuestionCard key={post._id} post={post} />;
        }
        if (post.postType === "course") {
          return <CourseCardFeed key={post._id} post={post} />;
        }
        return <Postcard key={post._id} post={post} />;
      })}

      {data?.posts.length === 0 && (
        <div className="text-center py-10 text-text-secondary text-sm">
          কোনো পোস্ট নেই
        </div>
      )}
    </div>
  );
}
