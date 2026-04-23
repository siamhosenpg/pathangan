import { baseApi } from "./baseApi";
import {
  IToggleReactionResponse,
  IGetReactionsResponse,
  IReactionCountResponse,
  ICheckUserLikedResponse,
} from "@/types/reactionTypes";

export const reactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 🟢 Toggle Like
    toggleReaction: builder.mutation<IToggleReactionResponse, string>({
      query: (postId) => ({
        url: "/reactions/toggle",
        method: "POST",
        body: { postId },
      }),

      // 🔥 OPTIMISTIC UPDATE
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          reactionApi.util.updateQueryData(
            "checkUserLiked",
            postId,
            (draft) => {
              // toggle UI instantly
              if (draft) {
                draft.liked = !draft.liked;
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo(); // ❌ error হলে rollback
        }
      },
    }),

    // 🟣 Get reactions list
    getReactionsByPost: builder.query<IGetReactionsResponse, string>({
      query: (postId) => `/reactions/post/${postId}`,
      providesTags: (result, error, postId) => [{ type: "Post", id: postId }],
    }),

    // 🟡 Get count
    getReactionCount: builder.query<IReactionCountResponse, string>({
      query: (postId) => `/reactions/count/${postId}`,
      providesTags: (result, error, postId) => [
        { type: "Post", id: postId },
        { type: "Reaction", id: postId },
      ],
    }),

    checkUserLiked: builder.query<ICheckUserLikedResponse, string>({
      query: (postId) => `/reactions/check/${postId}`,

      // 🔥 add this
      providesTags: (result, error, postId) => [
        { type: "Reaction", id: postId },
      ],
    }),
  }),
});

export const {
  useToggleReactionMutation,
  useGetReactionsByPostQuery,
  useGetReactionCountQuery,
  useCheckUserLikedQuery,
} = reactionApi;
