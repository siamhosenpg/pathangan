import { baseApi } from "../baseApi";

import {
  GetNotificationsResponse,
  UnreadCountResponse,
  NotificationActionResponse,
} from "@/types/notifications/notificationTypes";

const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ===================== GET NOTIFICATIONS (INFINITE) =====================
    getMyNotifications: builder.infiniteQuery<
      GetNotificationsResponse,
      { limit?: number },
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage: GetNotificationsResponse) =>
          lastPage.nextCursor ?? null,
      },
      query: ({
        queryArg,
        pageParam,
      }: {
        queryArg: { limit?: number };
        pageParam: string | null;
      }) => ({
        url: "/notifications",
        method: "GET" as const,
        params: {
          cursor: pageParam ?? undefined,
          limit: queryArg.limit ?? 10,
        },
      }),
      providesTags: ["Notification"],
    }),

    // ===================== UNREAD COUNT =====================
    getUnreadNotificationCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: "/notifications/unread-count",
        method: "GET" as const,
      }),
      providesTags: ["Notification"],
    }),

    // ===================== MARK SINGLE AS READ =====================
    markAsRead: builder.mutation<NotificationActionResponse, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH" as const,
      }),
      invalidatesTags: ["Notification"],
    }),

    // ===================== MARK ALL AS READ =====================
    markAllAsRead: builder.mutation<NotificationActionResponse, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH" as const,
      }),
      invalidatesTags: ["Notification"],
    }),

    // ===================== DELETE SINGLE =====================
    deleteNotification: builder.mutation<NotificationActionResponse, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE" as const,
      }),
      invalidatesTags: ["Notification"],
    }),

    // ===================== DELETE ALL =====================
    deleteAllNotifications: builder.mutation<NotificationActionResponse, void>({
      query: () => ({
        url: "/notifications/delete-all",
        method: "DELETE" as const,
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetMyNotificationsInfiniteQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} = notificationApi;
