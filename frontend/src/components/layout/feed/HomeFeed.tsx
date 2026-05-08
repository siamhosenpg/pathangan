"use client";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import PostCardSkeleton from "@/components/ui/card/postcard/PostCardSkeleton";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import { useGetPostsQuery } from "@/redux/api/postApi";

export default function HomeFeed() {
  const { data, isLoading, isError } = useGetPostsQuery({});

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
