import { baseApi } from "./baseApi";
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  GetMeResponse,
  LogoutResponse,
} from "@/types/authtypes";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
        } catch {}
      },
    }),

    // ✅ এভাবে করো — onQueryStarted দিয়ে token save করো
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
        } catch {}
      },
    }),

    getMe: builder.query<GetMeResponse, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
    }),

    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          localStorage.removeItem("token");
        } catch {}
      },
    }),
    googleMobileAuth: builder.mutation<
      AuthResponse,
      {
        googleId: string;
        email: string;
        name: string;
        photo?: string;
      }
    >({
      query: (body) => ({
        url: "/googleauth/google/mobile",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
        } catch {}
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useGoogleMobileAuthMutation, // ← নতুন
} = authApi;
