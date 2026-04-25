import { baseApi } from "../baseApi";

import type {
  GetAnswersResponse,
  GetAnswerCountResponse,
  CreateAnswerResponse,
  VoteAnswerResponse,
  GetAnswersQueryParams,
  CreateAnswerPayload,
  VoteAnswerPayload,
  Answer,
} from "@/types/answer/answerTypes";

const answersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnswersByQuestion: builder.query<
      GetAnswersResponse,
      GetAnswersQueryParams
    >({
      query: ({ questionId, limit = 5, cursor }) => {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        if (cursor) params.set("cursor", cursor);
        return `/answers/question/${questionId}?${params.toString()}`;
      },
      providesTags: (result, error, { questionId }) => [
        { type: "Answer", id: questionId },
      ],
    }),

    getAnswerCount: builder.query<GetAnswerCountResponse, string>({
      query: (questionId) => `/answers/question/${questionId}/count`,
      providesTags: (result, error, questionId) => [
        { type: "Answer", id: `count-${questionId}` },
      ],
    }),

    getAnswerById: builder.query<{ success: boolean; answer: Answer }, string>({
      query: (answerId) => `/answers/${answerId}`,
      providesTags: (result, error, answerId) => [
        { type: "Answer", id: answerId },
      ],
    }),

    createAnswer: builder.mutation<CreateAnswerResponse, CreateAnswerPayload>({
      query: ({ questionId, text }) => ({
        url: `/answers/question/${questionId}`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (result, error, { questionId }) => [
        { type: "Answer", id: questionId },
        { type: "Answer", id: `count-${questionId}` },
      ],
    }),

    voteAnswer: builder.mutation<VoteAnswerResponse, VoteAnswerPayload>({
      query: ({ answerId, voteType }) => ({
        url: `/answers/${answerId}/vote`,
        method: "PATCH",
        body: { voteType },
      }),
      async onQueryStarted(
        { answerId, voteType, questionId },
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          (baseApi as any).util.updateQueryData(
            "getAnswersByQuestion",
            { questionId, limit: 5 },
            (draft: GetAnswersResponse) => {
              const answer = draft.answers.find((a) => a._id === answerId);
              if (!answer) return;
              if (voteType === "upvote") {
                answer.upvotesCount += 1;
              } else {
                answer.downvotesCount += 1;
              }
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetAnswersByQuestionQuery,
  useGetAnswerCountQuery,
  useGetAnswerByIdQuery, // ← এটা add

  useCreateAnswerMutation,
  useVoteAnswerMutation,
} = answersApi;
