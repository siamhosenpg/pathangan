"use client";

import Postcard from "@/components/ui/card/postcard/Postcard";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import { useGetSavedItemsQuery } from "@/redux/api/save/savedItemApi";

interface Props {
  collectionId: string;
}

export default function SavedPostsList({ collectionId }: Props) {
  const { data, isLoading, isError } = useGetSavedItemsQuery(collectionId, {
    skip: !collectionId,
  });

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
      <div className="text-center py-10 text-text-secondary text-sm">
        লোড করতে সমস্যা হয়েছে
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 text-text-secondary text-sm">
        এই ফোল্ডারে কোনো পোস্ট নেই
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      {data.map((item) => {
        const post = item.postId;
        if (!post) return null;

        if (post.postType === "question") {
          return <QuestionCard key={item._id} post={post} />;
        }
        if (post.postType === "course") {
          return <CourseCardFeed key={item._id} post={post} />;
        }
        return <Postcard key={item._id} post={post} />;
      })}
    </div>
  );
}
