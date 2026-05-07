"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation, useGetMeQuery } from "@/redux/api/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { LoginRequest } from "@/types/authtypes";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const { refetch } = useGetMeQuery();
  const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login(form).unwrap();
      console.log("res:", res);
      dispatch(setUser(res.user));
      await refetch();
      console.log("refetch done");
      router.push("/");
      console.log("push done");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const errorMessage =
    error && "data" in error
      ? (error.data as { message: string })?.message
      : null;
  return (
    <div className="min-h-screen w-full flex ">
      {/* ===== LEFT SIDE ===== */}
      <div className="hidden lg:flex w-1/2 relative bg-accent/10 flex-col items-center justify-center px-16 overflow-hidden">
        {/* background blobs */}
        <div className="absolute z-10 top-[-80px] left-[-80px] w-[350px] h-[350px] bg-purple-600 opacity-20 rounded-full blur-[120px]" />
        <div className="absolute z-10 bottom-[-60px] right-[-60px] w-[300px] h-[300px] bg-blue-500 opacity-20 rounded-full blur-[100px]" />

        {/* logo */}
        <div className="relative z-10 flex flex-col items-start gap-10 w-full max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-white text-xl font-bold tracking-wide">
              প্রসঙ্গ
            </span>
          </div>

          {/* headline */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl xl:text-5xl font-extrabold text-text leading-tight">
              আপনার মানুষদের <br />
              <span className=" text-text-secondary">সাথে যুক্ত থাকুন</span>
            </h1>
            <p className="text-text-secondary text-base leading-relaxed">
              প্রিয়জনদের সাথে মুহূর্ত ভাগ করুন, নতুন বন্ধু তৈরি করুন এবং আপনার
              গল্প বলুন।
            </p>
          </div>

          {/* features */}
          <div className="flex flex-col gap-4 w-full">
            {[
              { icon: "💬", text: "তাৎক্ষণিক বার্তা পাঠান" },
              { icon: "📸", text: "ছবি ও মুহূর্ত শেয়ার করুন" },
              { icon: "🌐", text: "বিশ্বজুড়ে মানুষের সাথে পরিচিত হন" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/25 border border-border rounded-xl px-4 py-3"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-text-secondary text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RIGHT SIDE ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-8">
          {/* heading */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-text">স্বাগতম 👋</h2>
            <p className="text-sm">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
          </div>

          {/* error */}
          {errorMessage && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
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

          {/* form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 ">
            {/* email */}
            <div className="flex flex-col gap-2">
              <label className="text-text text-sm">ইমেইল</label>
              <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text shrink-0"
                >
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <polyline
                    points="22,6 12,13 2,6"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="আপনার ইমেইল লিখুন"
                  className="w-full bg-transparent py-4 text-text text-sm placeholder:text-text/50 outline-none"
                />
              </div>
            </div>

            {/* password */}
            <div className="flex flex-col gap-2">
              <label className="text-text text-sm">পাসওয়ার্ড</label>
              <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text shrink-0"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 11V7a5 5 0 0 1 10 0v4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full bg-transparent py-4 text-text text-sm placeholder:text-text/50 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text hover:text-text-tertiary transition-colors shrink-0"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="1"
                        y1="1"
                        x2="23"
                        y2="23"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
                  লগইন হচ্ছে...
                </span>
              ) : (
                "লগইন করুন"
              )}
            </button>
          </form>

          {/* divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-text text-xs">অথবা</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* register link */}
          <p className="text-center text-text-secondary text-sm">
            অ্যাকাউন্ট নেই?{" "}
            <Link
              href="/register"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              এখনই রেজিস্ট্রেশন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
