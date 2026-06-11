"use client";
import { useGoogleMobileAuthMutation } from "@/redux/api/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { FcGoogle } from "react-icons/fc";

export default function GoogleAuthButton() {
  const dispatch = useAppDispatch();
  const [googleMobileAuth, { isLoading }] = useGoogleMobileAuthMutation();

  const handleGoogleLogin = () => {
    // Web flow — backend passport route এ redirect করে
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/googleauth/google`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-white/5 hover:bg-white/10 transition-all text-text text-sm font-medium disabled:opacity-50"
    >
      <FcGoogle size={20} />
      Google দিয়ে লগইন করুন
    </button>
  );
}
