import { baseApi } from "../baseApi";

// ===================== TYPES =====================
export interface RatingStats {
  answerId: string;
  averageRating: number;
  ratingCount: number;
}

export interface GiveRatingResponse {
  success: boolean;
  message: string;
  userRating: number;
  averageRating: number;
  ratingCount: number;
}

export interface GiveRatingRequest {
  answerId: string;
  rating: number; // 1 - 5
}

export interface MyRatingResponse {
  success: true;
  userRating: number | null;
}

export interface DeleteRatingResponse {
  success: boolean;
  message: string;
}

export interface AnswerRatingItem {
  answerId: string;
  averageRating: number;
  ratingCount: number;
}

export interface QuestionRatingsResponse {
  success: boolean;
  questionId: string;
  answerRatings: AnswerRatingItem[];
}

export interface UserAverageRatingResponse {
  success: boolean;
  userId: string;
  averageRating: number;
  totalRatingCount: number;
}

// ===================== RATING API =====================
export const ratingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /ratings/answer/:answerId — rating দেওয়া বা update করা
    giveRating: builder.mutation<GiveRatingResponse, GiveRatingRequest>({
      query: ({ answerId, rating }) => ({
        url: `/ratings/answer/${answerId}`,
        method: "POST",
        body: { rating },
      }),
      invalidatesTags: (_result, _error, { answerId }) => [
        { type: "Rating", id: answerId },
        { type: "Rating", id: `MY_${answerId}` }, // ← এইটা missing ছিল
      ],
    }),

    // GET /ratings/answer/:answerId — answer এর average rating ও count
    getRatingsByAnswer: builder.query<RatingStats, string>({
      query: (answerId) => `/ratings/answer/${answerId}`,
      providesTags: (_result, _error, answerId) => [
        { type: "Rating", id: answerId },
      ],
    }),

    // GET /ratings/answer/:answerId/my — আমার নিজের rating
    getMyRating: builder.query<MyRatingResponse, string>({
      query: (answerId) => `/ratings/answer/${answerId}/my`,
      providesTags: (_result, _error, answerId) => [
        { type: "Rating", id: `MY_${answerId}` },
      ],
    }),

    // DELETE /ratings/answer/:answerId — rating সরিয়ে দেওয়া
    deleteRating: builder.mutation<DeleteRatingResponse, string>({
      query: (answerId) => ({
        url: `/ratings/answer/${answerId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, answerId) => [
        { type: "Rating", id: answerId },
        { type: "Rating", id: `MY_${answerId}` },
      ],
    }),

    // GET /ratings/question/:questionId — question এর সব answer এর rating
    getRatingsByQuestion: builder.query<QuestionRatingsResponse, string>({
      query: (questionId) => `/ratings/question/${questionId}`,
      providesTags: (_result, _error, questionId) => [
        { type: "Rating", id: `QUESTION_${questionId}` },
      ],
    }),

    getUserAverageRating: builder.query<UserAverageRatingResponse, string>({
      query: (userId) => `/ratings/user/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "Rating", id: `USER_${userId}` },
      ],
    }),
  }),
});

export const {
  useGiveRatingMutation,
  useGetRatingsByAnswerQuery,
  useGetMyRatingQuery,
  useDeleteRatingMutation,
  useGetRatingsByQuestionQuery,
  useGetUserAverageRatingQuery,
} = ratingApi;
