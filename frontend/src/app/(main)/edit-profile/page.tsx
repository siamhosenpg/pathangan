"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useUpdateUserMutation,
  useGetUserByUsernameQuery,
} from "@/redux/api/userApi";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import type { WorkEntry, EducationEntry } from "@/types/usertypes";
import Image from "next/image";

export default function EditProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [updateUser, { isLoading, error }] = useUpdateUserMutation();

  const { data: fullUser, isLoading: userLoading } = useGetUserByUsernameQuery(
    user?.username ?? "",
    { skip: !user?.username },
  );

  const profileImageRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    aboutText: "",
    gender: "",
    location: "",
  });

  const [works, setWorks] = useState<WorkEntry[]>([]);
  const [educations, setEducations] = useState<EducationEntry[]>([]);

  useEffect(() => {
    if (fullUser) {
      setForm({
        name: fullUser.name || "",
        username: fullUser.username || "",
        bio: fullUser.bio || "",
        aboutText: fullUser.aboutText || "",
        gender: fullUser.gender || "",
        location: fullUser.location || "",
      });
      setWorks(fullUser.work || []);
      setEducations(fullUser.educations || []);
    }
  }, [fullUser]);

  if (!user || userLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
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
          <p className="text-text-secondary text-sm">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "profile") {
      setProfileFile(file);
      setProfilePreview(url);
    } else {
      setCoverFile(file);
      setCoverPreview(url);
    }
  };

  // Work handlers
  const addWork = () =>
    setWorks((prev) => [
      ...prev,
      { industry: "", position: "", duration: "", status: "running" },
    ]);
  const removeWork = (i: number) =>
    setWorks((prev) => prev.filter((_, idx) => idx !== i));
  const handleWorkChange = (
    i: number,
    field: keyof WorkEntry,
    value: string,
  ) => {
    setWorks((prev) =>
      prev.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)),
    );
  };

  // Education handlers
  const addEducation = () =>
    setEducations((prev) => [
      ...prev,
      { institution: "", degree: "", duration: "", status: "completed" },
    ]);
  const removeEducation = (i: number) =>
    setEducations((prev) => prev.filter((_, idx) => idx !== i));
  const handleEducationChange = (
    i: number,
    field: keyof EducationEntry,
    value: string,
  ) => {
    setEducations((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullUser?.userid) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val) formData.append(key, val);
    });
    formData.append("work", JSON.stringify(works));
    formData.append("educations", JSON.stringify(educations));
    if (profileFile) formData.append("profileImage", profileFile);
    if (coverFile) formData.append("coverImage", coverFile);

    try {
      const res = await updateUser({
        userid: fullUser.userid,
        formData,
      }).unwrap();
      dispatch(
        setUser({
          id: user.id,
          username: res.user.username,
          name: res.user.name,
          email: res.user.email,
        }),
      );
      router.push("/");
    } catch {}
  };

  const errorMessage =
    error && "data" in error
      ? (error.data as { message: string })?.message
      : null;

  return (
    <div className="min-h-screen w-full bg-background pb-20">
      {/* COVER */}
      <div className="relative w-full h-52 bg-accent/10 overflow-hidden">
        {coverPreview ? (
          <Image src={coverPreview} alt="cover" fill className="object-cover" />
        ) : fullUser?.coverImage ? (
          <Image
            src={fullUser.coverImage}
            alt="cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5" />
        )}
        <button
          type="button"
          onClick={() => coverImageRef.current?.click()}
          className="absolute bottom-3 right-4 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-2 rounded-lg transition-colors backdrop-blur-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
          কভার বদলান
        </button>
        <input
          ref={coverImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageChange(e, "cover")}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* PROFILE IMAGE */}
        <div className="relative -mt-14 mb-6 w-fit">
          <div className="w-28 h-28 rounded-full border-4 border-background overflow-hidden bg-accent/20">
            {profilePreview ? (
              <Image
                src={profilePreview}
                alt="profile"
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : fullUser?.profileImage ? (
              <Image
                src={fullUser.profileImage}
                alt="profile"
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-accent">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => profileImageRef.current?.click()}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2" />
            </svg>
          </button>
          <input
            ref={profileImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageChange(e, "profile")}
          />
        </div>

        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-2xl font-bold text-text">প্রোফাইল এডিট করুন</h1>
          <p className="text-text-secondary text-sm">আপনার তথ্য আপডেট করুন</p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
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
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* name + username */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-text text-sm font-medium">পুরো নাম</label>
              <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text shrink-0"
                >
                  <path
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="আপনার নাম"
                  className="w-full bg-transparent py-3.5 text-text text-sm placeholder:text-text/30 outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-text text-sm font-medium">ইউজারনেম</label>
              <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                <span className="text-text/50 text-sm shrink-0">@</span>
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="username"
                  className="w-full bg-transparent py-3.5 text-text text-sm placeholder:text-text/30 outline-none"
                />
              </div>
            </div>
          </div>

          {/* bio */}
          <div className="flex flex-col gap-2">
            <label className="text-text text-sm font-medium">বায়ো</label>
            <div className="bg-white/5 border border-border rounded-xl px-4 py-3 focus-within:border-accent transition-colors">
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="নিজের সম্পর্কে সংক্ষেপে লিখুন..."
                rows={3}
                className="w-full bg-transparent text-text text-sm placeholder:text-text/30 outline-none resize-none"
              />
            </div>
          </div>

          {/* aboutText */}
          <div className="flex flex-col gap-2">
            <label className="text-text text-sm font-medium">
              আপনার সম্পর্কে
            </label>
            <div className="bg-white/5 border border-border rounded-xl px-4 py-3 focus-within:border-accent transition-colors">
              <textarea
                name="aboutText"
                value={form.aboutText}
                onChange={handleChange}
                placeholder="বিস্তারিত লিখুন..."
                rows={4}
                className="w-full bg-transparent text-text text-sm placeholder:text-text/30 outline-none resize-none"
              />
            </div>
          </div>

          {/* location + gender */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-text text-sm font-medium">অবস্থান</label>
              <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text shrink-0"
                >
                  <path
                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="10"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <input
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="আপনার শহর"
                  className="w-full bg-transparent py-3.5 text-text text-sm placeholder:text-text/30 outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-text text-sm font-medium">লিঙ্গ</label>
              <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full bg-transparent py-3.5 text-text text-sm outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-background">
                    বেছে নিন
                  </option>
                  <option value="male" className="bg-background">
                    পুরুষ
                  </option>
                  <option value="female" className="bg-background">
                    মহিলা
                  </option>
                  <option value="other" className="bg-background">
                    অন্যান্য
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* WORK */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-text text-sm font-medium">
                কর্মঅভিজ্ঞতা
              </label>
              <button
                type="button"
                onClick={addWork}
                className="text-accent text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                যোগ করুন
              </button>
            </div>
            {works.map((work, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 bg-white/5 border border-border rounded-xl p-4 relative"
              >
                <button
                  type="button"
                  onClick={() => removeWork(i)}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <div className="flex gap-3">
                  <input
                    value={work.industry}
                    onChange={(e) =>
                      handleWorkChange(i, "industry", e.target.value)
                    }
                    placeholder="প্রতিষ্ঠানের নাম"
                    className="w-1/2 bg-transparent border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-text/30 outline-none focus:border-accent transition-colors"
                  />
                  <input
                    value={work.position}
                    onChange={(e) =>
                      handleWorkChange(i, "position", e.target.value)
                    }
                    placeholder="পদবি"
                    className="w-1/2 bg-transparent border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-text/30 outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    value={work.duration}
                    onChange={(e) =>
                      handleWorkChange(i, "duration", e.target.value)
                    }
                    placeholder="সময়কাল (যেমন: ২০২০-২০২৩)"
                    className="w-1/2 bg-transparent border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-text/30 outline-none focus:border-accent transition-colors"
                  />
                  <select
                    value={work.status}
                    onChange={(e) =>
                      handleWorkChange(i, "status", e.target.value)
                    }
                    className="w-1/2 bg-background border border-border rounded-lg px-3 py-2.5 text-text text-sm outline-none focus:border-accent transition-colors"
                  >
                    <option value="running">চলমান</option>
                    <option value="closed">সমাপ্ত</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* EDUCATION */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-text text-sm font-medium">
                শিক্ষাগত যোগ্যতা
              </label>
              <button
                type="button"
                onClick={addEducation}
                className="text-accent text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                যোগ করুন
              </button>
            </div>
            {educations.map((edu, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 bg-white/5 border border-border rounded-xl p-4 relative"
              >
                <button
                  type="button"
                  onClick={() => removeEducation(i)}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <div className="flex gap-3">
                  <input
                    value={edu.institution}
                    onChange={(e) =>
                      handleEducationChange(i, "institution", e.target.value)
                    }
                    placeholder="প্রতিষ্ঠানের নাম"
                    className="w-1/2 bg-transparent border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-text/30 outline-none focus:border-accent transition-colors"
                  />
                  <input
                    value={edu.degree}
                    onChange={(e) =>
                      handleEducationChange(i, "degree", e.target.value)
                    }
                    placeholder="ডিগ্রি/বিষয়"
                    className="w-1/2 bg-transparent border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-text/30 outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    value={edu.duration}
                    onChange={(e) =>
                      handleEducationChange(i, "duration", e.target.value)
                    }
                    placeholder="সময়কাল (যেমন: ২০১৮-২০২২)"
                    className="w-1/2 bg-transparent border border-border rounded-lg px-3 py-2.5 text-text text-sm placeholder:text-text/30 outline-none focus:border-accent transition-colors"
                  />
                  <select
                    value={edu.status}
                    onChange={(e) =>
                      handleEducationChange(i, "status", e.target.value)
                    }
                    className="w-1/2 bg-background border border-border rounded-lg px-3 py-2.5 text-text text-sm outline-none focus:border-accent transition-colors"
                  >
                    <option value="running">চলমান</option>
                    <option value="completed">সম্পন্ন</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-1/3 py-3.5 rounded-xl border border-border text-text text-sm font-medium hover:bg-white/5 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-2/3 py-3.5 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  সংরক্ষণ হচ্ছে...
                </span>
              ) : (
                "পরিবর্তন সংরক্ষণ করুন"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
