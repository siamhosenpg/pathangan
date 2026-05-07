"use client";
import { useState } from "react";
import { useRegisterMutation, useGetMeQuery } from "@/redux/api/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { RegisterRequest } from "@/types/authtypes";
import Link from "next/link";
import {
  MdEmail,
  MdLock,
  MdPerson,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { FcGoogle } from "react-icons/fc";

export default function RegisterForm() {
  const dispatch = useAppDispatch();
  const [register, { isLoading, error }] = useRegisterMutation();
  const { refetch } = useGetMeQuery();
  const [form, setForm] = useState<Omit<RegisterRequest, "username">>({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [googleAlert, setGoogleAlert] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await register(form).unwrap();
      dispatch(setUser(res.user));
      await refetch();
      window.location.href = "/";
    } catch {}
  };

  const errorMessage =
    error && "data" in error
      ? (error.data as { message: string })?.message
      : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-6 py-12">
      {/* Google Alert Modal */}
      {googleAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <FcGoogle size={22} />
              </div>
              <div>
                <p className="text-text font-semibold text-sm">
                  Google লগইন শীঘ্রই আসছে
                </p>
                <p className="text-text-secondary text-xs mt-0.5">
                  Coming Soon
                </p>
              </div>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              আমরা শীঘ্রই Google-এর সাথে সংযোগ স্থাপন করব। এই ফিচারটি শীঘ্রই
              প্রকাশিত হবে। এর মধ্যে ইমেইল দিয়ে রেজিস্ট্রেশন করুন।
            </p>
            <button
              onClick={() => setGoogleAlert(false)}
              className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Logo & Heading */}
        <div className="flex flex-col gap-1 items-center mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-xl">প</span>
          </div>
          <h2 className="text-3xl font-bold text-text">অ্যাকাউন্ট খুলুন ✨</h2>
          <p className="text-sm text-text-secondary">
            নিচের তথ্যগুলো পূরণ করুন
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Google Button */}
        <button
          type="button"
          onClick={() => setGoogleAlert(true)}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-white/5 hover:bg-white/10 transition-all text-text text-sm font-medium"
        >
          <FcGoogle size={20} />
          Google দিয়ে রেজিস্ট্রেশন করুন
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-text-secondary text-xs">অথবা ইমেইল দিয়ে</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-text text-sm">পুরো নাম</label>
            <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
              <MdPerson size={18} className="text-text-secondary shrink-0" />
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="আপনার পুরো নাম লিখুন"
                className="w-full bg-transparent py-4 text-text text-sm placeholder:text-text/40 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-text text-sm">ইমেইল</label>
            <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
              <MdEmail size={18} className="text-text-secondary shrink-0" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="আপনার ইমেইল লিখুন"
                className="w-full bg-transparent py-4 text-text text-sm placeholder:text-text/40 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-text text-sm">পাসওয়ার্ড</label>
            <div className="flex items-center bg-white/5 border border-border rounded-xl px-4 gap-3 focus-within:border-accent transition-colors">
              <MdLock size={18} className="text-text-secondary shrink-0" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className="w-full bg-transparent py-4 text-text text-sm placeholder:text-text/40 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-secondary hover:text-text transition-colors shrink-0"
              >
                {showPassword ? (
                  <MdVisibilityOff size={18} />
                ) : (
                  <MdVisibility size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
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

        <p className="text-center text-text-secondary text-sm">
          আগে থেকেই অ্যাকাউন্ট আছে?{" "}
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
