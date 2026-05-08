// components/ui/notification/NotificationBadge.tsx
import React from "react";

interface Props {
  count: number;
}

const NotificationBadge = ({ count }: Props) => {
  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[3px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotificationBadge;
