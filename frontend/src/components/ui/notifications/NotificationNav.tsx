// components/ui/notification/NotificationNav.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { MdNotificationsNone, MdNotifications } from "react-icons/md";
import NotificationBadge from "./NotificationBadge";
import NotificationPanel from "./NotificationPanel";

import { useGetUnreadNotificationCountQuery } from "@/redux/api/notifications/notificationApi";

const NotificationNav = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useGetUnreadNotificationCountQuery();
  const unreadCount = data?.count ?? 0;

  // outside click বন্ধ
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-xl hover:bg-bg-secondary transition-colors text-text-primary"
      >
        {open ? (
          <MdNotifications size={24} className="text-accent" />
        ) : (
          <MdNotificationsNone size={24} />
        )}
        <NotificationBadge count={unreadCount} />
      </button>

      {/* panel */}
      {open && (
        <div className="absolute left-0 top-12 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ">
          <NotificationPanel />
        </div>
      )}
    </div>
  );
};

export default NotificationNav;
