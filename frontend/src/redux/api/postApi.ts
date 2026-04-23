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
    // ===================== GET ALL POSTS =====================
    getPosts: builder.query<
      GetPostsResponse,
      { cursor?: string; limit?: number }
    >({
      query: ({ cursor, limit = 10 } = {}) => ({
        url: "/posts",
        method: "GET",
        params: { cursor, limit },
      }),
      providesTags: ["Post"],
    }),

    // ===================== GET POST BY ID =====================
    getPostById: builder.query<Post, string>({
      query: (id) => ({ url: `/posts/post/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    // ===================== GET POSTS BY USERID =====================
    getPostsByUserId: builder.query<
      GetPostsByUserIdResponse,
      { userid: string; cursor?: string; limit?: number; postType?: string }
    >({
      query: ({ userid, cursor, limit = 10, postType }) => ({
        url: `/posts/user/${userid}`,
        method: "GET",
        params: { cursor, limit, postType },
      }),
      providesTags: (result, error, { userid }) => [
        { type: "Post", id: userid },
      ],
    }),

    // ===================== GET POST COUNT =====================
    getPostCountByUserId: builder.query<PostCountResponse, string>({
      query: (userid) => ({
        url: `/posts/user/${userid}/count`,
        method: "GET",
      }),
    }),

    // ===================== CREATE NORMAL POST =====================
    createPost: builder.mutation<PostResponse, FormData>({
      query: (formData) => ({
        url: "/posts",
        method: "POST",
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
        method: "POST",
        body,
      }),
      invalidatesTags: ["Post"],
    }),

    // ===================== CREATE COURSE POST =====================
    createCoursePost: builder.mutation<PostResponse, FormData>({
      query: (formData) => ({
        url: "/posts/create/course",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Post"],
    }),

    // ===================== CREATE SHARE POST =====================
    createSharePost: builder.mutation<PostResponse, CreateSharePostRequest>({
      query: (body) => ({
        url: "/posts/share",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Post"],
    }),

    // ===================== UPDATE POST =====================
    updatePost: builder.mutation<PostResponse, UpdatePostRequest>({
      query: ({ id, body }) => ({
        url: `/posts/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Post", id }],
    }),

    // ===================== DELETE POST =====================
    deletePost: builder.mutation<DeletePostResponse, string>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Post"],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetPostsByUserIdQuery,
  useGetPostCountByUserIdQuery,
  useCreatePostMutation,
  useCreateQuestionPostMutation,
  useCreateCoursePostMutation,
  useCreateSharePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postApi;
