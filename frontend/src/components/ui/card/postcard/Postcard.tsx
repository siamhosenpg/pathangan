import Image from "next/image";
import { MdBookmarkBorder } from "react-icons/md";
import LikeButton from "./LikeButton";
import CommentsButton from "./CommentsButton";
import ShareButton from "./ShareButton";
import PostProfiletop from "./PostProfiletop";
import BanglaNumber from "../../extra/Banglanumber";
import type { Post } from "@/types/postTypes";
import PostCountleft from "./PostCountleft";
import { useState } from "react";
import BookmarkButton from "../../buttons/BookmarkButton";

interface Props {
  post: Post;
}

const Postcard = ({ post }: Props) => {
  const { userid, content, createdAt } = post;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-background pt-6 rounded-xl">
      <PostProfiletop user={userid} createdAt={createdAt} />
      <div>
        {content?.title && <h3 className="mt-2 px-6">{content.title}</h3>}

        {content?.text && (
          <div className="mt-2 px-6 ">
            <p
              className={`whitespace-pre-wrap ${!expanded && content.text.length > 200 ? "line-clamp-3" : ""}`}
            >
              {content.text}
            </p>
            {content.text.length > 200 && (
              <span
                onClick={() => setExpanded((prev) => !prev)}
                className="text-sm block text-text-tertiary font-medium py-1 hover:underline mt-1"
              >
                {expanded ? "আগের অবস্থায় আসুন" : "আরো পড়ুন"}
              </span>
            )}
          </div>
        )}

        {/* media */}
        {content?.media && content.media.length > 0 && (
          <div className="w-full mt-1">
            {content.type === "video" ? (
              <video
                src={content.media[0]}
                controls
                className="w-full border-t border-b border-border"
              />
            ) : (
              <div
                className={`grid gap-0.5 mt-1 ${content.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
              >
                {content.media.map((url, i) => (
                  <Image
                    key={i}
                    width={600}
                    height={600}
                    alt=""
                    className="w-full max-h-157.5 object-cover border-t border-b border-border"
                    src={url}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* counts */}
        <div className="flex items-center justify-between px-6 py-1 border-b border-border">
          <PostCountleft postId={post._id} />
        </div>

        {/* actions */}
        <div className="px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <LikeButton postId={post._id} />
            <CommentsButton />
            <ShareButton />
          </div>
          {post._id && <BookmarkButton postId={post._id} />}
        </div>
      </div>
    </div>
  );
};

export default Postcard;
