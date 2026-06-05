// redux/api/privateAnswer/privateAnswerApi.ts

import { Answer } from "@/types/answer/answerTypes";
import { baseApi } from "../baseApi";

interface GetPrivateAnswerResponse {
  success: boolean;
  answer: Answer | null;
}

interface CreatePrivateAnswerResponse {
  success: boolean;
  message: string;
  answer: Answer;
}

interface CreatePrivateAnswerPayload {
  questionId: string;
  text: string;
}

const privateAnswerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrivateAnswerByQuestion: builder.query<GetPrivateAnswerResponse, string>(
      {
        query: (questionId) => `/private-answers/${questionId}`,
        providesTags: (_result, _error, questionId) => [
          { type: "PrivateAnswer", id: questionId },
        ],
      },
    ),

    createPrivateAnswer: builder.mutation<
      CreatePrivateAnswerResponse,
      CreatePrivateAnswerPayload
    >({
      query: ({ questionId, text }) => ({
        url: `/private-answers/${questionId}`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (_result, _error, { questionId }) => [
        { type: "PrivateAnswer", id: questionId },
      ],
    }),
  }),
});

export const {
  useGetPrivateAnswerByQuestionQuery,
  useCreatePrivateAnswerMutation,
} = privateAnswerApi;
