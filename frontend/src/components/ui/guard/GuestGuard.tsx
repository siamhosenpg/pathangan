"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { useGetMeQuery } from "@/redux/api/authApi";

export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // getMe শেষ হওয়ার আগে redirect করবো না
  const { isLoading } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    // getMe শেষ হওয়ার পরে যদি login থাকে তাহলে home এ পাঠাও
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // getMe চলাকালীন কিছু দেখাবে না
  if (isLoading) return null;

  if (isAuthenticated) return null;

  return <>{children}</>;
}
