"use client";

import { useParams } from "next/navigation";
import { useGetPostByIdQuery } from "@/redux/api/postApi";
import BackButton from "@/components/ui/buttons/BackButton";
import PostPageLeft from "@/components/layout/postpage/PostPageLeft";
import CommentsSection from "@/components/ui/comments/CommentsSection";

export default function PostDetailPage() {
  const { id } = useParams();
  const { data: post, isLoading, isError } = useGetPostByIdQuery(id as string);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-20">
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

  if (isError || !post) {
    return (
      <div className="text-center py-20 text-text-secondary text-sm">
        পোস্ট লোড করতে সমস্যা হয়েছে
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* back */}
      <div className="mb-5">
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* left */}
        <PostPageLeft post={post} />

        {/* right — comments */}
        <div
          className="bg-background rounded-2xl overflow-hidden sticky top-4"
          style={{ height: "80vh" }}
        >
          <CommentsSection postId={post._id} />
        </div>
      </div>
    </div>
  );
}
