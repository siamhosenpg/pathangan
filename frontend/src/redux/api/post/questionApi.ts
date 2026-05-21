import { baseApi } from "../baseApi";
import { Post } from "@/types/postTypes";

// ── Response Types ─────────────────────────────────────
interface GetQuestionsResponse {
  questions: Post[];
  nextCursor: string | null;
}

interface GetQuestionsByUserResponse {
  questions: Post[];
  count: number;
  nextCursor: string | null;
}

// ── Params Types ───────────────────────────────────────
interface GetQuestionsParams {
  limit?: number;
}

interface GetQuestionsByUserParams {
  userid: string;
  limit?: number;
}

// ── API ────────────────────────────────────────────────
const questionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===================== ALL QUESTIONS (INFINITE) =====================
    getAllQuestions: builder.infiniteQuery<
      GetQuestionsResponse,
      GetQuestionsParams,
      string | null
    >({
      query: ({ queryArg, pageParam }) => ({
        url: "/questions",
        params: {
          limit: queryArg.limit ?? 10,
          ...(pageParam && { cursor: pageParam }),
        },
      }),

      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },

      providesTags: ["Post"],
    }),

    // ===================== USER QUESTIONS (INFINITE) =====================
    getQuestionsByUserId: builder.infiniteQuery<
      GetQuestionsByUserResponse,
      GetQuestionsByUserParams,
      string | null
    >({
      query: ({ queryArg, pageParam }) => ({
        url: `/questions/user/${queryArg.userid}`,
        params: {
          limit: queryArg.limit ?? 10,
          ...(pageParam && { cursor: pageParam }),
        },
      }),

      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },

      providesTags: (_result, _err, arg) => [
        { type: "Post", id: `USER_QUESTIONS_${arg.userid}` },
      ],
    }),

    // ===================== SINGLE QUESTION =====================
    getQuestionById: builder.query<Post & { isReacted: boolean }, string>({
      query: (id) => `/questions/${id}`,

      providesTags: (_result, _err, id) => [{ type: "Post", id }],
    }),
  }),
});

export const {
  useGetAllQuestionsInfiniteQuery,
  useGetQuestionsByUserIdInfiniteQuery,
  useGetQuestionByIdQuery,
} = questionApi;
