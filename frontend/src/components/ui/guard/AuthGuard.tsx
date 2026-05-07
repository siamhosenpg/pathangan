"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { useGetMeQuery } from "@/redux/api/authApi";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // isLoading true থাকলে getMe এখনো চলছে — এই সময় redirect করবো না
  const { isLoading } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    // getMe শেষ হওয়ার পরে যদি login না থাকে তাহলে redirect
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // getMe চলাকালীন কিছু দেখাবে না — এতে flicker হবে না
  if (isLoading) return null;

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
