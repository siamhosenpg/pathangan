"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCreatePostMutation,
  useCreateQuestionPostMutation,
  useCreateCoursePostMutation,
} from "@/redux/api/postApi";
import { useAppSelector } from "@/redux/hooks";
import Image from "next/image";

type PostType = "post" | "question" | "course";

interface CourseMediaPreview {
  file: File;
  url: string;
  type: "image" | "video";
}

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [activeType, setActiveType] = useState<PostType>("post");

  const [createPost, { isLoading: postLoading }] = useCreatePostMutation();
  const [createQuestion, { isLoading: questionLoading }] =
    useCreateQuestionPostMutation();
  const [createCourse, { isLoading: courseLoading }] =
    useCreateCoursePostMutation();
  const isLoading = postLoading || questionLoading || courseLoading;

  // NORMAL POST STATE
  const [title, setTitle] = useState("");
  const [text, setText] = useState(""); // ← caption থেকে text
  const [privacy, setPrivacy] = useState("public");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  // QUESTION STATE
  const [questionText, setQuestionText] = useState("");
  const [questionTags, setQuestionTags] = useState("");

  // COURSE STATE
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [coursePrice, setCoursePrice] = useState("");
  const [courseTags, setCourseTags] = useState("");
  const [courseMedia, setCourseMedia] = useState<CourseMediaPreview[]>([]);

  const [error, setError] = useState("");

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const hasVideo = files.some((f) => f.type.startsWith("video"));
    const hasImage = files.some((f) => f.type.startsWith("image"));
    if (hasVideo && hasImage) {
      setError("ছবি এবং ভিডিও একসাথে দেওয়া যাবে না");
      return;
    }
    setError("");
    setMediaFiles(files);
    setMediaPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCourseMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const videos = files.filter((f) => f.type.startsWith("video"));
    if (videos.length > 1) {
      setError("একটির বেশি ভিডিও দেওয়া যাবে না");
      return;
    }
    setError("");
    const newMedia: CourseMediaPreview[] = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "image",
    }));
    setCourseMedia((prev) => [...prev, ...newMedia]);
  };

  const removeCourseMedia = (index: number) => {
    setCourseMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (activeType === "post") {
        if (!text.trim() && mediaFiles.length === 0) {
          setError("কিছু একটা লিখুন অথবা ছবি/ভিডিও যোগ করুন");
          return;
        }
        const formData = new FormData();
        if (title.trim()) formData.append("title", title.trim());
        formData.append("text", text); // ← caption → text
        formData.append("privacy", privacy);
        mediaFiles.forEach((f) => formData.append("media", f));
        await createPost(formData).unwrap();
      }

      if (activeType === "question") {
        if (!questionText.trim()) {
          setError("প্রশ্ন লিখুন");
          return;
        }
        await createQuestion({
          questionText: questionText.trim(),
          tags: questionTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          privacy,
        }).unwrap();
      }

      if (activeType === "course") {
        if (!courseTitle.trim()) {
          setError("কোর্সের শিরোনাম দিন");
          return;
        }
        const formData = new FormData();
        formData.append("title", courseTitle.trim());
        formData.append("description", courseDesc);
        formData.append("price", coursePrice || "0");
        formData.append("privacy", privacy);
        courseTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((tag) => formData.append("tags", tag));
        courseMedia.forEach((m) => formData.append("media", m.file));
        await createCourse(formData).unwrap();
      }

      router.push("/");
    } catch (err: any) {
      setError(err?.data?.message || "কিছু একটা সমস্যা হয়েছে");
    }
  };

  const tabs: { type: PostType; label: string; icon: React.ReactNode }[] = [
    {
      type: "post",
      label: "পোস্ট",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      type: "question",
      label: "প্রশ্ন",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 17h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      type: "course",
      label: "কোর্স",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* HEADING */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-text">নতুন পোস্ট</h1>
        </div>

        {/* TAB */}
        <div className="flex gap-2 mb-6 bg-white/5 border border-border rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => {
                setActiveType(tab.type);
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeType === tab.type
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* USER ROW */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-accent/20 shrink-0">
            {user?.profileImage ? (
              <Image
                src={user.profileImage}
                alt="profile"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-accent font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-text text-sm font-medium">{user?.name}</p>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="bg-white/5 border border-border rounded-lg px-2 py-0.5 text-text-secondary text-xs outline-none mt-0.5 cursor-pointer"
            >
              <option value="public" className="bg-background">
                সবাই দেখতে পাবে
              </option>
              <option value="friends" className="bg-background">
                বন্ধুরা দেখতে পাবে
              </option>
              <option value="private" className="bg-background">
                শুধু আমি দেখব
              </option>
            </select>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* ===== NORMAL POST ===== */}
          {activeType === "post" && (
            <>
              {/* title */}
              <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="শিরোনাম লিখুন (ঐচ্ছিক)"
                  className="w-full bg-transparent py-3.5 text-text text-sm font-medium placeholder:text-text/30 outline-none"
                />
              </div>

              {/* text */}
              <div className="bg-white/5 border border-border rounded-xl px-4 py-3 focus-within:border-accent transition-colors">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="আপনার মনের কথা লিখুন..."
                  rows={5}
                  className="w-full bg-transparent text-text text-sm placeholder:text-text/30 outline-none resize-none"
                />
              </div>

              {/* media preview */}
              {mediaPreviews.length > 0 && (
                <div
                  className={`grid gap-2 ${mediaPreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  {mediaPreviews.map((url, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden aspect-square bg-white/5"
                    >
                      {mediaFiles[i]?.type.startsWith("video") ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={url}
                          alt="preview"
                          fill
                          className="object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* media upload */}
              <label className="flex items-center gap-2 text-text-secondary text-sm cursor-pointer hover:text-text transition-colors w-fit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="8.5"
                    cy="8.5"
                    r="1.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 15l-5-5L5 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                ছবি / ভিডিও যোগ করুন
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaSelect}
                />
              </label>
            </>
          )}

          {/* ===== QUESTION POST ===== */}
          {activeType === "question" && (
            <>
              <div className="bg-white/5 border border-border rounded-xl px-4 py-3 focus-within:border-accent transition-colors">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="আপনার প্রশ্নটি লিখুন..."
                  rows={4}
                  className="w-full bg-transparent text-text text-sm placeholder:text-text/30 outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text text-sm font-medium">ট্যাগ</label>
                <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-text shrink-0"
                  >
                    <path
                      d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="7"
                      y1="7"
                      x2="7.01"
                      y2="7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="text"
                    value={questionTags}
                    onChange={(e) => setQuestionTags(e.target.value)}
                    placeholder="react, nextjs, javascript (কমা দিয়ে আলাদা করুন)"
                    className="w-full bg-transparent py-3.5 text-text text-sm placeholder:text-text/30 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* ===== COURSE POST ===== */}
          {activeType === "course" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-text text-sm font-medium">
                  কোর্সের শিরোনাম *
                </label>
                <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="কোর্সের নাম লিখুন"
                    className="w-full bg-transparent py-3.5 text-text text-sm placeholder:text-text/30 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-text text-sm font-medium">বিবরণ</label>
                <div className="bg-white/5 border border-border rounded-xl px-4 py-3 focus-within:border-accent transition-colors">
                  <textarea
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    placeholder="কোর্স সম্পর্কে বিস্তারিত লিখুন..."
                    rows={4}
                    className="w-full bg-transparent text-text text-sm placeholder:text-text/30 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-2 w-1/2">
                  <label className="text-text text-sm font-medium">
                    মূল্য (টাকা)
                  </label>
                  <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                    <span className="text-text/50 text-sm shrink-0">৳</span>
                    <input
                      type="number"
                      value={coursePrice}
                      onChange={(e) => setCoursePrice(e.target.value)}
                      placeholder="০"
                      min="0"
                      className="w-full bg-transparent py-3.5 text-text text-sm placeholder:text-text/30 outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-1/2">
                  <label className="text-text text-sm font-medium">ট্যাগ</label>
                  <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                    <input
                      type="text"
                      value={courseTags}
                      onChange={(e) => setCourseTags(e.target.value)}
                      placeholder="react, nextjs"
                      className="w-full bg-transparent py-3.5 text-text text-sm placeholder:text-text/30 outline-none"
                    />
                  </div>
                </div>
              </div>

              {courseMedia.length > 0 && (
                <div
                  className={`grid gap-2 ${courseMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  {courseMedia.map((m, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden aspect-square bg-white/5"
                    >
                      {m.type === "video" ? (
                        <video
                          src={m.url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={m.url}
                          alt="course media"
                          fill
                          className="object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        {m.type === "video" ? "ভিডিও" : "ছবি"}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCourseMedia(i)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2 text-text-secondary text-sm cursor-pointer hover:text-text transition-colors w-fit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="8.5"
                    cy="8.5"
                    r="1.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 15l-5-5L5 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                ছবি / ভিডিও যোগ করুন
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleCourseMediaSelect}
                />
              </label>
            </>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
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
                পোস্ট হচ্ছে...
              </span>
            ) : (
              "পোস্ট করুন"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
