import { baseApi } from "@/redux/api/baseApi";
import type {
  SendPrivateQuestionRequest,
  UpdateQuestionStatusRequest,
  GetQuestionsParams,
  PrivateQuestionListResponse,
  PrivateQuestionSingleResponse,
  UnreadCountResponse,
  DeleteQuestionResponse,
  UpdateStatusResponse,
} from "@/types/privateQuestionTypes";

export const privateQuestionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===================== SEND QUESTION =====================
    sendPrivateQuestion: builder.mutation<
      PrivateQuestionSingleResponse,
      SendPrivateQuestionRequest
    >({
      query: (body) => ({
        url: "/private-questions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PrivateQuestion"],
    }),

    // ===================== GET INBOX =====================
    getInbox: builder.infiniteQuery<
      PrivateQuestionListResponse,
      GetQuestionsParams | void,
      string | null
    >({
      query: ({ queryArg, pageParam }) => {
        const params = new URLSearchParams();

        if (pageParam) params.set("cursor", pageParam);
        if (queryArg?.limit) params.set("limit", String(queryArg.limit));
        if (queryArg?.status) params.set("status", queryArg.status);

        return `/private-questions/inbox?${params.toString()}`;
      },
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      providesTags: ["PrivateQuestion"],
    }),

    // ===================== GET SENT QUESTIONS =====================
    getSentQuestions: builder.infiniteQuery<
      PrivateQuestionListResponse,
      GetQuestionsParams | void,
      string | null
    >({
      query: ({ queryArg, pageParam }) => {
        const params = new URLSearchParams();

        if (pageParam) params.set("cursor", pageParam);
        if (queryArg?.limit) params.set("limit", String(queryArg.limit));

        return `/private-questions/sent?${params.toString()}`;
      },
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      providesTags: ["PrivateQuestion"],
    }),

    // ===================== GET UNREAD COUNT =====================
    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => "/private-questions/unread-count",
      providesTags: ["PrivateQuestion"],
    }),

    // ===================== GET SINGLE QUESTION =====================
    getPrivateQuestionById: builder.query<
      PrivateQuestionSingleResponse,
      string
    >({
      query: (id) => `/private-questions/${id}`,
      providesTags: (_result, _err, id) => [{ type: "PrivateQuestion", id }],
    }),

    // ===================== UPDATE STATUS =====================
    updateQuestionStatus: builder.mutation<
      UpdateStatusResponse,
      UpdateQuestionStatusRequest
    >({
      query: ({ id, status }) => ({
        url: `/private-questions/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        "PrivateQuestion",
        { type: "PrivateQuestion", id },
      ],
    }),

    // ===================== DELETE QUESTION =====================
    deletePrivateQuestion: builder.mutation<DeleteQuestionResponse, string>({
      query: (id) => ({
        url: `/private-questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PrivateQuestion"],
    }),
  }),
});

export const {
  useSendPrivateQuestionMutation,
  useGetInboxInfiniteQuery,
  useGetSentQuestionsInfiniteQuery,
  useGetUnreadCountQuery,
  useGetPrivateQuestionByIdQuery,
  useUpdateQuestionStatusMutation,
  useDeletePrivateQuestionMutation,
} = privateQuestionApi;
