"use client";

import { useState } from "react";
import Image from "next/image";

import BookmarkButton from "@/components/ui/buttons/BookmarkButton";
import type { Post } from "@/types/postTypes";
import PostProfiletop from "@/components/ui/card/postcard/PostProfiletop";
import LikeButton from "@/components/ui/card/postcard/LikeButton";
import CommentsButton from "@/components/ui/card/postcard/CommentsButton";
import ShareButton from "@/components/ui/card/postcard/ShareButton";

interface Props {
  post: Post;
}

export default function PostPageLeft({ post }: Props) {
  const { userid, content, createdAt } = post;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-background rounded-2xl flex flex-col">
      {/* profile */}
      <div className="pt-5 px-1">
        <PostProfiletop user={userid} createdAt={createdAt} />
      </div>

      {/* title */}
      {content?.title && (
        <h3 className="mt-3 px-5 text-base font-semibold">{content.title}</h3>
      )}

      {/* text */}
      {content?.text && (
        <div className="mt-2 px-5">
          <p
            className={`text-sm leading-relaxed whitespace-pre-wrap ${!expanded && content.text.length > 300 ? "line-clamp-4" : ""}`}
          >
            {content.text}
          </p>
          {content.text.length > 300 && (
            <span
              onClick={() => setExpanded((p) => !p)}
              className="text-sm text-text-tertiary font-medium cursor-pointer hover:underline mt-1 block"
            >
              {expanded ? "আগের অবস্থায় আসুন" : "আরো পড়ুন"}
            </span>
          )}
        </div>
      )}

      {/* media */}
      {content?.media && content.media.length > 0 && (
        <div className="mt-3">
          {content.type === "video" ? (
            <video
              src={content.media[0]}
              controls
              className="w-full rounded-xl border border-border"
            />
          ) : (
            <div
              className={`grid gap-0.5 ${content.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {content.media.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt=""
                  width={800}
                  height={600}
                  className="w-full max-h-[600px] object-cover border-t border-b border-border"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* actions */}
      <div className="px-5 py-3 flex items-center justify-between border-t border-border mt-4">
        <div className="flex items-center gap-5">
          <LikeButton postId={post._id} />
          <CommentsButton />
          <ShareButton />
        </div>
        {post._id && <BookmarkButton postId={post._id} />}
      </div>
    </div>
  );
}
