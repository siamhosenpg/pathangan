import React from "react";
import { MdBookmarkBorder } from "react-icons/md";
import { HiDotsHorizontal } from "react-icons/hi";
import BanglaNumber from "../../extra/Banglanumber";
import Image from "next/image";
import LikeButton from "../postcard/LikeButton";
import CommentsButton from "../postcard/CommentsButton";
import ShareButton from "../postcard/ShareButton";
import type { Post } from "@/types/postTypes";
import PostCountleft from "../postcard/PostCountleft";

import { useRouter } from "next/navigation";

interface Props {
  post: Post;
}

const CourseCardFeed = ({ post }: Props) => {
  const { userid, course, likesCount, commentsCount, sharesCount, createdAt } =
    post;
  const thumbnail = course?.media?.find((m) => m.type === "image")?.url;
  const router = useRouter();
  return (
    <div className="bg-background rounded-xl">
      {/* thumbnail */}
      <div className="p-4">
        <div
          onClick={() => router.push(`/course/${post._id}`)}
          className="w-full rounded-xl overflow-hidden"
        >
          {thumbnail ? (
            <Image
              width={600}
              height={600}
              alt={course?.title || ""}
              className="w-full aspect-video object-cover border-t border-b border rounded-xl border-border"
              src={thumbnail}
            />
          ) : (
            <div className="w-full aspect-video rounded-xl bg-accent/10 flex items-center justify-center border border-border">
              <span className="text-text-secondary text-sm">ছবি নেই</span>
            </div>
          )}
        </div>
      </div>

      {/* course info */}
      <div className="flex gap-4 px-6">
        <div className="w-12 h-12 rounded-full border-border border shrink-0 overflow-hidden bg-accent/20">
          {userid.profileImage ? (
            <Image
              width={600}
              height={600}
              alt={userid.name}
              className="w-full h-full rounded-full object-cover"
              src={userid.profileImage}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent font-bold">
              {userid.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="w-full">
          <h3 className="line-clamp-2">{course?.title}</h3>
          <div className="flex items-center gap-2">
            <h3 className="text-sm">{userid.name}</h3>
            <span className="text-sm text-text-secondary">
              {course?.price === 0 ? "বিনামূল্যে" : `৳${course?.price}`}
            </span>
          </div>
        </div>
      </div>

      {/* counts + actions */}
      <div className="mt-2 ">
        <div className="px-6 py-1 border-b border-border">
          <PostCountleft postId={post._id} />
        </div>

        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <LikeButton postId={post._id} />
            <CommentsButton />
            <ShareButton />
          </div>
          <div className="flex items-center justify-end gap-4">
            <button className="bg-accent text-white font-medium px-4 py-1.5 rounded-lg">
              বার্তা পাঠান
            </button>
            <button className="flex items-center gap-1.5">
              <HiDotsHorizontal size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCardFeed;
