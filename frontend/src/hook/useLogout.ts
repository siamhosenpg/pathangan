import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/redux/api/authApi";
import { clearUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";

export function useLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutMutation, { isLoading }] = useLogoutMutation();

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      dispatch(clearUser());
      router.push("/login");
    }
  };

  return { logout, isLoading };
}
