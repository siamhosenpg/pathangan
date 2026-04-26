import { baseApi } from "./baseApi";
import type {
  FollowRecord,
  FollowResponse,
  UnfollowResponse,
  FollowersCountResponse,
  FollowingCountResponse,
} from "@/types/followTypes";

export const followApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ POST /follows/follow/:userId
    followUser: builder.mutation<FollowResponse, string>({
      query: (userId) => ({
        url: `/follows/follow/${userId}`,
        method: "POST",
      }),
      transformErrorResponse: (response) => {
        const data = response.data as { message?: string };
        return data?.message ?? "Failed to follow user";
      },
      invalidatesTags: (_result, _error, userId) => [
        { type: "Follow", id: userId },
        { type: "Follow", id: "FOLLOWERS_COUNT" },
        { type: "Follow", id: "FOLLOWING_COUNT" },
        { type: "Follow", id: "FOLLOWERS_LIST" },
        { type: "Follow", id: "FOLLOWING_LIST" },
      ],
    }),

    // ✅ DELETE /follows/unfollow/:userId
    unfollowUser: builder.mutation<UnfollowResponse, string>({
      query: (userId) => ({
        url: `/follows/unfollow/${userId}`,
        method: "DELETE",
      }),
      transformErrorResponse: (response) => {
        const data = response.data as { message?: string };
        return data?.message ?? "Failed to unfollow user";
      },
      invalidatesTags: (_result, _error, userId) => [
        { type: "Follow", id: userId },
        { type: "Follow", id: "FOLLOWERS_COUNT" },
        { type: "Follow", id: "FOLLOWING_COUNT" },
        { type: "Follow", id: "FOLLOWERS_LIST" },
        { type: "Follow", id: "FOLLOWING_LIST" },
      ],
    }),

    // ✅ GET /follows/followers/:userId
    getFollowers: builder.query<FollowRecord[], string>({
      query: (userId) => `/follows/followers/${userId}`,
      transformErrorResponse: (response) => {
        const data = response.data as { message?: string };
        return data?.message ?? "Failed to fetch followers";
      },
      providesTags: (_result, _error, userId) => [
        { type: "Follow", id: "FOLLOWERS_LIST" },
        { type: "Follow", id: userId },
      ],
    }),

    // ✅ GET /follows/following/:userId
    getFollowing: builder.query<FollowRecord[], string>({
      query: (userId) => `/follows/following/${userId}`,
      transformErrorResponse: (response) => {
        const data = response.data as { message?: string };
        return data?.message ?? "Failed to fetch following";
      },
      providesTags: (_result, _error, userId) => [
        { type: "Follow", id: "FOLLOWING_LIST" },
        { type: "Follow", id: userId },
      ],
    }),

    // ✅ GET /follows/followers/count/:userId
    getFollowersCount: builder.query<FollowersCountResponse, string>({
      query: (userId) => `/follows/followers/count/${userId}`,
      transformErrorResponse: (response) => {
        const data = response.data as { message?: string };
        return data?.message ?? "Failed to fetch followers count";
      },
      providesTags: (_result, _error, userId) => [
        { type: "Follow", id: "FOLLOWERS_COUNT" },
        { type: "Follow", id: userId },
      ],
    }),

    // ✅ GET /follows/following/count/:userId
    getFollowingCount: builder.query<FollowingCountResponse, string>({
      query: (userId) => `/follows/following/count/${userId}`,
      transformErrorResponse: (response) => {
        const data = response.data as { message?: string };
        return data?.message ?? "Failed to fetch following count";
      },
      providesTags: (_result, _error, userId) => [
        { type: "Follow", id: "FOLLOWING_COUNT" },
        { type: "Follow", id: userId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetFollowersCountQuery,
  useGetFollowingCountQuery,
} = followApi;
