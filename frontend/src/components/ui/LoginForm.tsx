"use client";
import { useState } from "react";
import { useLoginMutation, useGetMeQuery } from "@/redux/api/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { LoginRequest } from "@/types/authtypes";
import Link from "next/link";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";

import GoogleAuthButton from "./buttons/GoogleAuthButton";

export default function LoginForm() {
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
      dispatch(setUser(res.user));
      await refetch();
      window.location.href = "/";
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const errorMessage =
    error && "data" in error
      ? (error.data as { message: string })?.message
      : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col gap-1 items-center mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-xl">প</span>
          </div>
          <h2 className="text-3xl font-bold text-text">স্বাগতম 👋</h2>
          <p className="text-sm text-text-secondary">
            আপনার অ্যাকাউন্টে প্রবেশ করুন
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Google Button */}
        <GoogleAuthButton />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-text-secondary text-xs">অথবা ইমেইল দিয়ে</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                placeholder="আপনার পাসওয়ার্ড লিখুন"
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
                লগইন হচ্ছে...
              </span>
            ) : (
              "লগইন করুন"
            )}
          </button>
        </form>

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
  );
}
