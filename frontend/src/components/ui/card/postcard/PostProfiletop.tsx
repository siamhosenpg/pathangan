import React from "react";
import Image from "next/image";
import FollowButton from "../../buttons/FollowButton";
import { HiBadgeCheck } from "react-icons/hi";
import { HiDotsHorizontal } from "react-icons/hi";
import type { PostUser } from "@/types/postTypes";

interface Props {
  user: PostUser;
  createdAt: string;
}

const getTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} মাস আগে`;
  if (days > 0) return `${days} দিন আগে`;
  if (hours > 0) return `${hours} ঘণ্টা আগে`;
  if (minutes > 0) return `${minutes} মিনিট আগে`;
  return "এইমাত্র";
};

const PostProfiletop = ({ user, createdAt }: Props) => {
  return (
    <div className="top px-6 pb-1 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 rounded-full overflow-hidden border-border shrink-0 bg-accent/20">
          {user.profileImage ? (
            <Image
              width={80}
              height={80}
              className="bg-gray-300 w-full h-full object-cover"
              src={user.profileImage}
              alt={user.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent font-bold text-lg">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h5 className="flex items-center gap-1.5">
              {user.name}
              {user?.badges && user.badges.length > 0 && (
                <HiBadgeCheck className="text-accent" />
              )}
            </h5>
            <FollowButton />
          </div>
          <span className="block text-text-secondary -mt-0.5 text-sm">
            {getTimeAgo(createdAt)}
          </span>
        </div>
      </div>
      <div>
        <HiDotsHorizontal size={19} />
      </div>
    </div>
  );
};

export default PostProfiletop;
