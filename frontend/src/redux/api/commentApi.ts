import { baseApi } from "./baseApi";
import { postApi } from "./postApi";

import type {
  Comment,
  GetCommentsResponse,
  GetRepliesResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "@/types/commentTypes";

const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===================== GET COMMENTS =====================
    getCommentsByPost: builder.query<
      GetCommentsResponse,
      { postId: string; page?: number; limit?: number }
    >({
      query: ({ postId, page = 1, limit = 20 }) => ({
        url: `/comments/${postId}`,
        params: { page, limit },
      }),

      providesTags: (result, error, { postId }) => [
        { type: "Comment", id: postId },
      ],
    }),

    // ===================== GET REPLIES =====================
    getRepliesByComment: builder.query<
      GetRepliesResponse,
      { commentId: string; page?: number; limit?: number }
    >({
      query: ({ commentId, page = 1, limit = 20 }) => ({
        url: `/comments/replies/${commentId}`,
        params: { page, limit },
      }),

      providesTags: (result, error, { commentId }) => [
        { type: "Comment", id: `replies-${commentId}` },
      ],
    }),

    // ===================== CREATE COMMENT =====================
    createComment: builder.mutation<
      { success: boolean; data: Comment },
      CreateCommentRequest
    >({
      query: (body) => ({
        url: `/comments`,
        method: "POST",
        body,
      }),

      // ===================== CREATE COMMENT - onQueryStarted =====================
      async onQueryStarted(
        { postId, parentCommentId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data } = await queryFulfilled;

          if (!parentCommentId) {
            dispatch(
              commentApi.util.updateQueryData(
                "getCommentsByPost",
                { postId, page: 1, limit: 20 },
                (draft) => {
                  draft.data.unshift(data.data);
                  draft.total += 1;
                  draft.count += 1;
                },
              ),
            );

            dispatch(
              postApi.util.updateQueryData(
                "getPosts",
                { limit: 10 },
                (draft: any) => {
                  if (!draft?.pages) return;

                  for (const page of draft.pages) {
                    // ✅ page.posts — backend এর response key
                    const post = page.posts?.find((p: any) => p._id === postId);
                    if (post) {
                      post.commentsCount += 1;
                      break;
                    }
                  }
                },
              ),
            );
          }

          if (parentCommentId) {
            dispatch(
              commentApi.util.updateQueryData(
                "getRepliesByComment",
                { commentId: parentCommentId, page: 1, limit: 20 },
                (draft) => {
                  draft.data.push(data.data);
                  draft.totalReplies += 1;
                  draft.count += 1;
                },
              ),
            );
          }
        } catch (error) {
          console.error(error);
        }
      },

      invalidatesTags: (result, error, { postId, parentCommentId }) => [
        { type: "Comment", id: postId },

        ...(parentCommentId
          ? [
              {
                type: "Comment" as const,
                id: `replies-${parentCommentId}`,
              },
            ]
          : []),
      ],
    }),

    // ===================== UPDATE COMMENT =====================
    updateComment: builder.mutation<
      { success: boolean; data: Comment },
      UpdateCommentRequest
    >({
      query: ({ commentId, text }) => ({
        url: `/comments/${commentId}`,
        method: "PUT",
        body: { text },
      }),

      invalidatesTags: (result, error, { commentId }) => [
        { type: "Comment", id: commentId },
      ],
    }),

    // ===================== DELETE COMMENT =====================
    deleteComment: builder.mutation<
      { success: boolean; message: string },
      {
        commentId: string;
        postId: string;
        parentCommentId?: string | null;
      }
    >({
      query: ({ commentId }) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),

      // ===================== DELETE COMMENT - onQueryStarted =====================
      async onQueryStarted(
        { commentId, postId, parentCommentId },
        { dispatch, queryFulfilled },
      ) {
        try {
          await queryFulfilled;

          if (!parentCommentId) {
            dispatch(
              commentApi.util.updateQueryData(
                "getCommentsByPost",
                { postId, page: 1, limit: 20 },
                (draft) => {
                  draft.data = draft.data.filter((c) => c._id !== commentId);
                  draft.total = Math.max(0, draft.total - 1);
                  draft.count = Math.max(0, draft.count - 1);
                },
              ),
            );

            dispatch(
              postApi.util.updateQueryData(
                "getPosts",
                { limit: 10 },
                (draft: any) => {
                  if (!draft?.pages) return;

                  for (const page of draft.pages) {
                    // ✅ page.posts — backend এর response key
                    const post = page.posts?.find((p: any) => p._id === postId);
                    if (post) {
                      post.commentsCount = Math.max(0, post.commentsCount - 1);
                      break;
                    }
                  }
                },
              ),
            );
          }

          if (parentCommentId) {
            dispatch(
              commentApi.util.updateQueryData(
                "getRepliesByComment",
                { commentId: parentCommentId, page: 1, limit: 20 },
                (draft) => {
                  draft.data = draft.data.filter((c) => c._id !== commentId);
                  draft.totalReplies = Math.max(0, draft.totalReplies - 1);
                  draft.count = Math.max(0, draft.count - 1);
                },
              ),
            );
          }
        } catch (error) {
          console.error(error);
        }
      },

      invalidatesTags: (result, error, { postId, parentCommentId }) => [
        { type: "Comment", id: postId },

        ...(parentCommentId
          ? [
              {
                type: "Comment" as const,
                id: `replies-${parentCommentId}`,
              },
            ]
          : []),
      ],
    }),
  }),
});

export const {
  useGetCommentsByPostQuery,
  useGetRepliesByCommentQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentApi;

export default commentApi;
