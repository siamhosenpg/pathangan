"use client";

import React, { useState, useRef, useEffect } from "react";
import { MdNotificationsNone, MdNotifications } from "react-icons/md";
import NotificationBadge from "./NotificationBadge";
import NotificationPanel from "./NotificationPanel";
import { useGetUnreadNotificationCountQuery } from "@/redux/api/notifications/notificationApi";

const NotificationNav = () => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useGetUnreadNotificationCountQuery();
  const unreadCount = data?.count ?? 0;

  const handleOpen = () => {
    setOpen(true);
    setClosing(false);
    requestAnimationFrame(() => setVisible(true));
  };

  const handleClose = () => {
    setClosing(true);
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 300);
  };

  const handleToggle = () => {
    if (open && !closing) {
      handleClose();
    } else if (!open) {
      handleOpen();
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closing]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl hover:bg-bg-secondary transition-colors text-text-primary"
      >
        {open ? (
          <MdNotifications size={24} className="text-accent" />
        ) : (
          <MdNotificationsNone size={24} />
        )}
        <NotificationBadge count={unreadCount} />
      </button>

      {/* Desktop panel */}
      {open && (
        <div
          className="hidden md:block absolute left-0 top-12 z-50"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          <NotificationPanel onClose={handleClose} />
        </div>
      )}

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
          {/* bottom sheet */}
          <div
            className="relative z-10"
            style={{
              transform: visible ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <NotificationPanel onClose={handleClose} mobile />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationNav;
