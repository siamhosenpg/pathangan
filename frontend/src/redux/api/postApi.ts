import { baseApi } from "./baseApi";

import type {
  GetPostsResponse,
  GetPostsByUserIdResponse,
  Post,
  PostResponse,
  PostCountResponse,
  DeletePostResponse,
  CreateQuestionPostRequest,
  CreateSharePostRequest,
  UpdatePostRequest,
} from "@/types/postTypes";

const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===================== GET ALL POSTS (INFINITE) =====================
    getPosts: builder.infiniteQuery<
      GetPostsResponse,
      { limit?: number },
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage: GetPostsResponse) =>
          lastPage.nextCursor ?? null,
      },

      query: ({
        queryArg,
        pageParam,
      }: {
        queryArg: { limit?: number };
        pageParam: string | null;
      }) => ({
        url: "/posts",
        method: "GET" as const,

        params: {
          cursor: pageParam ?? undefined,
          limit: queryArg.limit ?? 10,
        },
      }),

      providesTags: ["Post"],
    }),

    // ===================== GET POST BY ID =====================
    getPostById: builder.query<Post, string>({
      query: (id) => ({
        url: `/posts/post/${id}`,
        method: "GET" as const,
      }),

      providesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),

    // ===================== GET POSTS BY USERID (INFINITE) =====================
    getPostsByUserId: builder.infiniteQuery<
      GetPostsByUserIdResponse,
      { userid: string; limit?: number; postType?: string },
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null as string | null,

        getNextPageParam: (lastPage: GetPostsByUserIdResponse) =>
          lastPage.nextCursor ?? null,
      },

      query: ({
        queryArg,
        pageParam,
      }: {
        queryArg: {
          userid: string;
          limit?: number;
          postType?: string;
        };

        pageParam: string | null;
      }) => ({
        url: `/posts/user/${queryArg.userid}`,
        method: "GET" as const,

        params: {
          cursor: pageParam ?? undefined,
          limit: queryArg.limit ?? 10,
          postType: queryArg.postType,
        },
      }),

      providesTags: (_result, _error, { userid }) => [
        { type: "Post", id: userid },
      ],
    }),

    // ===================== GET POST COUNT =====================
    getPostCountByUserId: builder.query<PostCountResponse, string>({
      query: (userid) => ({
        url: `/posts/user/${userid}/count`,
        method: "GET" as const,
      }),
    }),

    // ===================== CREATE NORMAL POST =====================
    createPost: builder.mutation<PostResponse, FormData>({
      query: (formData) => ({
        url: "/posts",
        method: "POST" as const,
        body: formData,
      }),

      invalidatesTags: ["Post"],
    }),

    // ===================== CREATE QUESTION POST =====================
    createQuestionPost: builder.mutation<
      PostResponse,
      CreateQuestionPostRequest
    >({
      query: (body) => ({
        url: "/posts/create/question",
        method: "POST" as const,
        body,
      }),

      invalidatesTags: ["Post"],
    }),

    // ===================== CREATE COURSE POST =====================
    createCoursePost: builder.mutation<PostResponse, FormData>({
      query: (formData) => ({
        url: "/posts/create/course",
        method: "POST" as const,
        body: formData,
      }),

      invalidatesTags: ["Post"],
    }),

    // ===================== CREATE SHARE POST =====================
    createSharePost: builder.mutation<PostResponse, CreateSharePostRequest>({
      query: (body) => ({
        url: "/posts/share",
        method: "POST" as const,
        body,
      }),

      invalidatesTags: ["Post"],
    }),

    // ===================== UPDATE POST =====================
    updatePost: builder.mutation<PostResponse, UpdatePostRequest>({
      query: ({ id, body }) => ({
        url: `/posts/${id}`,
        method: "PUT" as const,
        body,
      }),

      invalidatesTags: (_result, _error, { id }) => [{ type: "Post", id }],
    }),

    // ===================== DELETE POST =====================
    deletePost: builder.mutation<DeletePostResponse, string>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "DELETE" as const,
      }),

      invalidatesTags: ["Post"],
    }),
  }),
});
export { postApi };
export const {
  useGetPostsInfiniteQuery,
  useGetPostByIdQuery,
  useGetPostsByUserIdInfiniteQuery,
  useGetPostCountByUserIdQuery,
  useCreatePostMutation,
  useCreateQuestionPostMutation,
  useCreateCoursePostMutation,
  useCreateSharePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postApi;
