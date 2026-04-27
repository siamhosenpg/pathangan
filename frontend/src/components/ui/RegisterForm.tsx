"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisterMutation } from "@/redux/api/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { RegisterRequest } from "@/types/authtypes";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register, { isLoading, error }] = useRegisterMutation();
  const [form, setForm] = useState<Omit<RegisterRequest, "username">>({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await register(form).unwrap();
      dispatch(setUser(res.user));
      router.push("/");
    } catch {}
  };

  const errorMessage =
    error && "data" in error
      ? (error.data as { message: string })?.message
      : null;

  return (
    <div className="min-h-screen w-full flex">
      {/* ===== LEFT SIDE ===== */}
      <div className="hidden lg:flex w-1/2 relative bg-accent/10 flex-col items-center justify-center px-16 overflow-hidden">
        <div className="absolute z-10 top-[-80px] left-[-80px] w-[350px] h-[350px] bg-purple-600 opacity-20 rounded-full blur-[120px]" />
        <div className="absolute z-10 bottom-[-60px] right-[-60px] w-[300px] h-[300px] bg-blue-500 opacity-20 rounded-full blur-[100px]" />

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

          <div className="flex flex-col gap-4">
            <h1 className="text-3xl xl:text-5xl font-extrabold text-text leading-tight">
              আজই শুরু করুন <br />
              <span className="text-text-secondary">আপনার যাত্রা</span>
            </h1>
            <p className="text-text-secondary text-base leading-relaxed">
              বিনামূল্যে অ্যাকাউন্ট খুলুন এবং লক্ষ মানুষের সাথে যুক্ত হন। আপনার
              গল্প বলার সময় এখনই।
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {[
              { step: "০১", text: "অ্যাকাউন্ট তৈরি করুন — মাত্র ১ মিনিটে" },
              { step: "০২", text: "আপনার প্রোফাইল সাজান" },
              { step: "০৩", text: "বন্ধু ও পরিবারের সাথে যুক্ত হন" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/25 border border-border rounded-xl px-4 py-3"
              >
                <span className="text-accent font-bold text-sm shrink-0">
                  {item.step}
                </span>
                <span className="text-text-secondary text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RIGHT SIDE ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-text">
              অ্যাকাউন্ট খুলুন ✨
            </h2>
            <p className="text-text-secondary text-sm">
              নিচের তথ্যগুলো পূরণ করুন
            </p>
          </div>

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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* name — full width */}
            <div className="flex flex-col gap-2">
              <label className="text-text text-sm">পুরো নাম</label>
              <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text shrink-0"
                >
                  <path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="আপনার পুরো নাম লিখুন"
                  className="w-full bg-transparent py-4 text-text text-sm placeholder:text-text/30 outline-none"
                />
              </div>
            </div>

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
                  className="w-full bg-transparent py-4 text-text text-sm placeholder:text-text/30 outline-none"
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
                  minLength={6}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className="w-full bg-transparent py-4 text-text text-sm placeholder:text-text/30 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text hover:text-text-secondary transition-colors shrink-0"
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
                  অ্যাকাউন্ট তৈরি হচ্ছে...
                </span>
              ) : (
                "রেজিস্ট্রেশন করুন"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-secondary text-xs">অথবা</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-text-secondary text-sm">
            আগে থেকেই অ্যাকাউন্ট আছে?{" "}
            <Link
              href="/login"
              className="text-accent hover:opacity-80 font-medium transition-opacity"
            >
              লগইন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
