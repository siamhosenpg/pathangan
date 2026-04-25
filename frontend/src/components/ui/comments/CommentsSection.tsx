"use client";

import CommentList from "./CommentList";
import CommentInput from "./CommentInput";
import {
  useGetCommentsByPostQuery,
  useCreateCommentMutation,
  useGetCommentsCountQuery,
} from "@/redux/api/commentApi";

interface Props {
  postId: string;
}

export default function CommentsSection({ postId }: Props) {
  const { data, isLoading } = useGetCommentsByPostQuery({ postId });
  const { data: countData } = useGetCommentsCountQuery(postId);

  const [createComment] = useCreateCommentMutation();

  const handleSubmit = async (text: string) => {
    try {
      await createComment({ postId, text }).unwrap();
    } catch (err) {
      console.error("Failed to create comment", err);
    }
  };

  // 🔥 API -> UI FORMAT
  const comments =
    data?.data.map((c) => ({
      id: c._id,
      name: c.commentUserId?.name || "Unknown",
      text: c.text,
      time: formatTimeAgo(c.createdAt),
      avatar: c.commentUserId?.profileImage,
    })) || [];

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-border">
        <p className="text-sm font-semibold">
          মন্তব্য ({countData?.count || 0})
        </p>
      </div>

      <CommentList comments={comments} isLoading={isLoading} />

      <CommentInput onSubmit={handleSubmit} />
    </div>
  );
}

// ================= TIME FORMAT =================
function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "এখনই";
  if (minutes < 60) return `${minutes} মিনিট আগে`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;

  const days = Math.floor(hours / 24);
  return `${days} দিন আগে`;
}
