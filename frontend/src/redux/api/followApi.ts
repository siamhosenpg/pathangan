import { baseApi } from "./baseApi";
import type {
  FollowRecord,
  FollowListResponse,
  FollowingListResponse,
  FollowResponse,
  UnfollowResponse,
  FollowersCountResponse,
  FollowingCountResponse,
} from "@/types/followTypes";

export const followApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    followUser: builder.mutation<FollowResponse, string>({
      query: (userId) => ({
        url: `/follows/follow/${userId}`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, userId) => [
        { type: "Follow", id: userId },
        { type: "Follow", id: "FOLLOWERS_COUNT" },
        { type: "Follow", id: "FOLLOWING_COUNT" },
        { type: "Follow", id: "FOLLOWERS_LIST" },
        { type: "Follow", id: "FOLLOWING_LIST" },
      ],
    }),

    unfollowUser: builder.mutation<UnfollowResponse, string>({
      query: (userId) => ({
        url: `/follows/unfollow/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, userId) => [
        { type: "Follow", id: userId },
        { type: "Follow", id: "FOLLOWERS_COUNT" },
        { type: "Follow", id: "FOLLOWING_COUNT" },
        { type: "Follow", id: "FOLLOWERS_LIST" },
        { type: "Follow", id: "FOLLOWING_LIST" },
      ],
    }),

    // ✅ return type এখন FollowListResponse
    getFollowers: builder.query<FollowListResponse, string>({
      query: (userId) => `/follows/followers/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "Follow", id: "FOLLOWERS_LIST" },
        { type: "Follow", id: userId },
      ],
    }),

    // ✅ return type এখন FollowingListResponse
    getFollowing: builder.query<FollowingListResponse, string>({
      query: (userId) => `/follows/following/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "Follow", id: "FOLLOWING_LIST" },
        { type: "Follow", id: userId },
      ],
    }),

    getFollowersCount: builder.query<FollowersCountResponse, string>({
      query: (userId) => `/follows/followers/count/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "Follow", id: "FOLLOWERS_COUNT" },
        { type: "Follow", id: userId },
      ],
    }),

    getFollowingCount: builder.query<FollowingCountResponse, string>({
      query: (userId) => `/follows/following/count/${userId}`,
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
