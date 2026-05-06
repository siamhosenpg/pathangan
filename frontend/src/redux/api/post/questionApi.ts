import { baseApi } from "../baseApi";

import { Post } from "@/types/postTypes";

interface GetQuestionsResponse {
  questions: Post[];
  nextCursor: string | null;
}

interface GetQuestionsByUserResponse {
  questions: Post[];
  count: number;
  nextCursor: string | null;
}

interface GetQuestionsParams {
  limit?: number;
  cursor?: string | null;
}

const questionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllQuestions: builder.query<GetQuestionsResponse, GetQuestionsParams>({
      query: ({ limit = 10, cursor } = {}) => ({
        url: "/questions",
        params: { limit, ...(cursor && { cursor }) },
      }),
      providesTags: ["Post"],
    }),

    getQuestionsByUserId: builder.query<
      GetQuestionsByUserResponse,
      GetQuestionsParams & { userid: string }
    >({
      query: ({ userid, limit = 10, cursor }) => ({
        url: `/questions/user/${userid}`,
        params: { limit, ...(cursor && { cursor }) },
      }),
      providesTags: ["Post"],
    }),

    getQuestionById: builder.query<Post, string>({
      query: (id) => `/questions/${id}`,
      providesTags: ["Post"],
    }),
  }),
});

export const {
  useGetAllQuestionsQuery,
  useGetQuestionsByUserIdQuery,
  useGetQuestionByIdQuery,
} = questionApi;
