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

      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        // ── Feed (getPosts infinite) cache update ──────────────
        const patchFeed = dispatch(
          baseApi.util.updateQueryData(
            // ✅ এখন করো
            "getPosts" as never,
            { limit: 10 } as never,
            (draft: any) => {
              if (!draft?.pages) return;
              for (const page of draft.pages) {
                const post = page.posts?.find((p: any) => p._id === postId);
                if (post) {
                  const wasLiked = post.isReacted;
                  post.isReacted = !wasLiked;
                  post.likesCount = wasLiked
                    ? post.likesCount - 1
                    : post.likesCount + 1;
                }
              }
            },
          ),
        );

        // ── Single post (getPostById) cache update ─────────────
        const patchSingle = dispatch(
          baseApi.util.updateQueryData(
            "getPostById" as never,
            postId as never,
            (draft: any) => {
              if (!draft) return;
              const wasLiked = draft.isReacted;
              draft.isReacted = !wasLiked;
              draft.likesCount = wasLiked
                ? draft.likesCount - 1
                : draft.likesCount + 1;
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          // ❌ error হলে দুটোই rollback
          patchFeed.undo();
          patchSingle.undo();
        }
      },
    }),

    // 🟣 Get reactions list
    getReactionsByPost: builder.query<IGetReactionsResponse, string>({
      query: (postId) => `/reactions/post/${postId}`,
      providesTags: (_result, _error, postId) => [{ type: "Post", id: postId }],
    }),

    // 🟡 Get count
    getReactionCount: builder.query<IReactionCountResponse, string>({
      query: (postId) => `/reactions/count/${postId}`,
      providesTags: (_result, _error, postId) => [
        { type: "Post", id: postId },
        { type: "Reaction", id: postId },
      ],
    }),

    // ── এটা আর use হচ্ছে না, তবে রাখা আছে পুরনো code এর জন্য
    checkUserLiked: builder.query<ICheckUserLikedResponse, string>({
      query: (postId) => `/reactions/check/${postId}`,
      providesTags: (_result, _error, postId) => [
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
