"use client";
import { useEffect } from "react";
import { useGetMeQuery } from "@/redux/api/authApi";
import { setUser, clearUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const { data, isError, isSuccess } = useGetMeQuery();

  useEffect(() => {
    if (isSuccess && data?.user) {
      dispatch(
        setUser({
          id: (data.user as any)._id || data.user.id, // ← _id handle করো
          username: data.user.username,
          name: data.user.name,
          email: data.user.email,
          profileImage: (data.user as any).profileImage || "", // ← এটা যোগ করো
        }),
      );
    }
    if (isError) {
      dispatch(clearUser());
    }
  }, [data, isSuccess, isError, dispatch]);

  return null;
}
