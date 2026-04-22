import { baseApi } from "./baseApi";

import type {
  User,
  UpdateUserRequest,
  SuggestedUsersResponse,
} from "@/types/usertypes";

const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // সব user
    getUsers: builder.query<User[], void>({
      query: () => ({ url: "/users/user", method: "GET" }),
    }),

    // username দিয়ে single user
    getUserByUsername: builder.query<User, string>({
      query: (username) => ({ url: `/users/user/${username}`, method: "GET" }),
    }),

    // suggested users
    getSuggestedUsers: builder.query<SuggestedUsersResponse, void>({
      query: () => ({ url: "/users/suggested", method: "GET" }),
    }),

    // user update (image সহ)
    updateUser: builder.mutation<
      { message: string; user: User },
      UpdateUserRequest
    >({
      query: ({ userid, formData }) => ({
        url: `/users/user/${userid}`,
        method: "PUT",
        body: formData,
      }),
    }),

    // user delete
    deleteUser: builder.mutation<{ message: string }, number>({
      query: (userid) => ({
        url: `/users/user/${userid}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByUsernameQuery,
  useGetSuggestedUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
