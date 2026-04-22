"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetMeQuery } from "@/redux/api/authApi";
import { setUser, clearUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data, isError, isSuccess } = useGetMeQuery();

  useEffect(() => {
    if (isSuccess && data?.user) {
      dispatch(setUser(data.user));
    }

    if (isError) {
      dispatch(clearUser());
    }
  }, [data, isSuccess, isError, dispatch, router]);

  return null;
}
