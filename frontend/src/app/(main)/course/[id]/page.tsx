"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useGetPostByIdQuery } from "@/redux/api/postApi";
import PostProfiletop from "@/components/ui/card/postcard/PostProfiletop";
import CommentsSection from "@/components/ui/comments/CommentsSection";
import LikeButton from "@/components/ui/card/postcard/LikeButton";
import BookmarkButton from "@/components/ui/buttons/BookmarkButton";
import { MdOutlinePlayCircle } from "react-icons/md";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

export default function CourseDetailPage() {
  const { id } = useParams();
  const { data: post, isLoading, isError } = useGetPostByIdQuery(id as string);
  const [activeSlide, setActiveSlide] = useState(0);

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
        কোর্স লোড করতে সমস্যা হয়েছে
      </div>
    );
  }

  const course = post.course;
  const media = course?.media ?? [];
  const hasMultiple = media.length > 1;

  const prevSlide = () =>
    setActiveSlide((p) => (p === 0 ? media.length - 1 : p - 1));
  const nextSlide = () =>
    setActiveSlide((p) => (p === media.length - 1 ? 0 : p + 1));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ===== LEFT — course content ===== */}
        <div className="flex flex-col gap-5">
          {/* media slider */}
          {media.length > 0 && (
            <div
              className="relative w-full bg-black rounded-2xl overflow-hidden"
              style={{ aspectRatio: "16/9" }}
            >
              {media[activeSlide].type === "video" ? (
                <video
                  src={media[activeSlide].url}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={media[activeSlide].url}
                  alt=""
                  fill
                  className="object-cover"
                />
              )}

              {/* slider controls */}
              {hasMultiple && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <IoChevronBack size={18} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <IoChevronForward size={18} />
                  </button>

                  {/* dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {media.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className={`rounded-full transition-all ${i === activeSlide ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* slide counter */}
              {hasMultiple && (
                <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {activeSlide + 1} / {media.length}
                </div>
              )}
            </div>
          )}

          {/* thumbnail strip */}
          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {media.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === activeSlide ? "border-accent" : "border-transparent"}`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <MdOutlinePlayCircle size={24} className="text-white" />
                    </div>
                  ) : (
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* course info */}
          <div className="bg-background rounded-2xl p-5 flex flex-col gap-4">
            <PostProfiletop user={post.userid} createdAt={post.createdAt} />

            {course?.title && (
              <h1 className="text-xl font-bold text-text-primary">
                {course.title}
              </h1>
            )}

            {course?.description && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {course.description}
              </p>
            )}

            {/* tags */}
            {course?.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 rounded-full bg-background-secondary text-text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* price + actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                {course?.price && course.price > 0 ? (
                  <p className="text-lg font-bold text-accent">
                    ৳ {course.price}
                  </p>
                ) : (
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    বিনামূল্যে
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <LikeButton postId={post._id} />
                {post._id && <BookmarkButton postId={post._id} />}
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT — comments ===== */}
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
