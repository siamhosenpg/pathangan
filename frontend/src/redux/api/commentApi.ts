import { baseApi } from "./baseApi";
import type {
  Comment,
  GetCommentsResponse,
  GetRepliesResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentCountResponse,
} from "@/types/commentTypes";

const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===================== GET COUNT =====================
    getCommentsCount: builder.query<CommentCountResponse, string>({
      query: (postId) => `/comments/count/${postId}`,
      providesTags: (result, error, postId) => [
        { type: "Comment", id: `count-${postId}` },
      ],
    }),

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

      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(
            commentApi.util.updateQueryData(
              "getCommentsByPost",
              { postId },
              (draft) => {
                draft.data.unshift(data.data);
                draft.total += 1;
                draft.count += 1;
              },
            ),
          );

          dispatch(
            commentApi.util.updateQueryData(
              "getCommentsCount",
              postId,
              (draft) => {
                draft.count += 1;
              },
            ),
          );
        } catch {}
      },

      invalidatesTags: (result, error, { postId }) => [
        { type: "Comment", id: postId },
        { type: "Comment", id: `count-${postId}` },
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
      { commentId: string; postId: string }
    >({
      query: ({ commentId }) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),

      async onQueryStarted(
        { commentId, postId },
        { dispatch, queryFulfilled },
      ) {
        try {
          await queryFulfilled;

          dispatch(
            commentApi.util.updateQueryData(
              "getCommentsByPost",
              { postId },
              (draft) => {
                draft.data = draft.data.filter((c) => c._id !== commentId);
                draft.total -= 1;
                draft.count -= 1;
              },
            ),
          );

          dispatch(
            commentApi.util.updateQueryData(
              "getCommentsCount",
              postId,
              (draft) => {
                draft.count = Math.max(0, draft.count - 1);
              },
            ),
          );
        } catch {}
      },

      invalidatesTags: (result, error, { postId }) => [
        { type: "Comment", id: postId },
        { type: "Comment", id: `count-${postId}` },
      ],
    }),
  }),
});

export const {
  useGetCommentsCountQuery,
  useGetCommentsByPostQuery,
  useGetRepliesByCommentQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentApi;
