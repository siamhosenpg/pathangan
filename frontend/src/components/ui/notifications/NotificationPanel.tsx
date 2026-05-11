"use client";

import React, { useRef, useCallback } from "react";
import NotificationCard from "./NotificationCard";
import { IoClose } from "react-icons/io5";

import {
  useGetMyNotificationsInfiniteQuery,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useMarkAsReadMutation,
} from "@/redux/api/notifications/notificationApi";

interface Props {
  onClose?: () => void;
  mobile?: boolean;
}

const NotificationPanel = ({ onClose, mobile = false }: Props) => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useGetMyNotificationsInfiniteQuery({ limit: 15 });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications] = useDeleteAllNotificationsMutation();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  return (
    <div
      className={`relative flex flex-col bg-background border border-border shadow-xl overflow-hidden ${
        mobile
          ? "w-screen rounded-t-3xl h-[80vh]"
          : "h-[90vh] w-100 rounded-2xl"
      }`}
    >
      {/* mobile drag handle */}
      {mobile && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border z-10" />
      )}

      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 mt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">
            বিজ্ঞপ্তি
          </h2>
          {unreadCount > 0 && (
            <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-accent hover:underline font-medium"
            >
              সব পড়েছি
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => deleteAllNotifications()}
              className="text-xs text-red-500 hover:underline font-medium"
            >
              সব মুছুন
            </button>
          )}
          {mobile && (
            <button
              onClick={onClose}
              className="ml-1 p-1 rounded-full hover:bg-accent/10 transition-colors"
            >
              <IoClose size={18} className="text-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {isLoading && (
          <div className="flex flex-col gap-2 px-4 py-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-bg-tertiary shrink-0" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-3 w-3/4 rounded-full bg-bg-tertiary" />
                  <div className="h-2.5 w-1/3 rounded-full bg-bg-tertiary" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-text-secondary text-sm">
            <span className="text-3xl mb-3">🔔</span>
            কোনো বিজ্ঞপ্তি নেই
          </div>
        )}

        {notifications.map((notification) => (
          <NotificationCard
            key={notification._id}
            notification={notification}
            onRead={(id) => markAsRead(id)}
            onDelete={(id) => deleteNotification(id)}
          />
        ))}

        <div ref={sentinelRef} className="h-2" />

        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasNextPage && notifications.length > 0 && (
          <p className="text-center text-xs text-text-secondary py-4">
            সব বিজ্ঞপ্তি দেখা হয়েছে
          </p>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
