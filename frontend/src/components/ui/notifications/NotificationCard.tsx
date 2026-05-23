"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { Notification } from "@/types/notifications/notificationTypes";
import GreenMark from "../badges/GreenMark";

interface Props {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const getNotificationText = (type: Notification["type"]) => {
  switch (type) {
    case "like":
      return "তোমার পোস্টে রিঅ্যাক্ট করেছে";
    case "comment":
      return "তোমার পোস্টে মন্তব্য করেছে";
    case "follow":
      return "তোমাকে অনুসরণ করতে শুরু করেছে";
    case "share":
      return "তোমার পোস্ট শেয়ার করেছে";
    default:
      return "";
  }
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  const days = Math.floor(hrs / 24);
  return `${days} দিন আগে`;
};

const getNavigationPath = (notification: Notification): string | null => {
  const { type, actorId, target } = notification;

  if (type === "follow") {
    // actor এর profile এ যাবে
    return actorId?.username ? `/${actorId.username}` : null;
  }

  if (
    (type === "like" || type === "comment" || type === "share") &&
    target?.postId
  ) {
    // post এ যাবে
    return `/post/${target.postId}`;
  }

  return null;
};

const NotificationCard = ({ notification, onRead, onDelete }: Props) => {
  const router = useRouter();
  const { _id, actorId, type, read, createdAt } = notification;

  const handleClick = () => {
    if (!read) onRead(_id);

    const path = getNavigationPath(notification);
    if (path) router.push(path);
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer group ${
        read ? "bg-transparent" : "bg-accent/5"
      } hover:bg-bg-secondary`}
      onClick={handleClick}
    >
      {/* avatar */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-tertiary">
          {actorId?.profileImage ? (
            <Image
              src={actorId.profileImage}
              alt={actorId.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm font-semibold">
              {actorId?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        {!read && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-bg-primary" />
        )}
      </div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary leading-snug">
          <span className="font-semibold flex items-center gap-1">
            {actorId?.name}{" "}
            {actorId?.greenmarkVerified && (
              <GreenMark mark={actorId.greenmarkVerified} />
            )}
          </span>{" "}
          <span className="text-text-secondary">
            {getNotificationText(type)}
          </span>
        </p>
        <p className="text-xs text-text-secondary mt-0.5">
          {timeAgo(createdAt)}
        </p>
      </div>

      {/* delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(_id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-red-500 text-xs px-2 py-1 rounded-lg hover:bg-red-50 shrink-0"
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationCard;
