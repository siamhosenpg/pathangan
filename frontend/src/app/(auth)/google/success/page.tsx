"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetMeQuery } from "@/redux/api/authApi";
import { setUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";

export default function GoogleSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { refetch } = useGetMeQuery();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.replace("/login?error=google_failed");
      return;
    }

    // token localStorage এ রাখো
    localStorage.setItem("token", token);

    // user info আনো
    refetch().then((res) => {
      if (res.data?.user) {
        dispatch(setUser(res.data.user));
      }
      router.replace("/");
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">লগইন হচ্ছে...</p>
      </div>
    </div>
  );
}
