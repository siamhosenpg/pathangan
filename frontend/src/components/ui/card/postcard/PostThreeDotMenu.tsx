"use client";

import React, { useEffect, useRef } from "react";
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineLink,
  HiOutlineEyeOff,
  HiOutlineFlag,
  HiOutlineTrash,
} from "react-icons/hi";
import { useAppSelector } from "@/redux/hooks";

interface Props {
  postId: string;
  postAuthorId: string;
  menuStyle: React.CSSProperties;
  onClose: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  danger?: boolean;
}

const PostThreeDotMenu = ({
  postId,
  postAuthorId,
  menuStyle,
  onClose,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const isOwnPost = currentUserId === postAuthorId;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    onClose();
  };

  const handleDeletePost = () => {
    // TODO: dispatch delete post action
    console.log("Delete post:", postId);
    onClose();
  };

  const menuItems: MenuItem[] = [
    {
      icon: <HiOutlineQuestionMarkCircle size={20} />,
      title: "কেন এই পোস্টটি দেখছি?",
      subtitle: "এই পোস্টটি কেন দেখানো হচ্ছে তা জানুন",
      onClick: onClose,
    },
    {
      icon: <HiOutlineLink size={20} />,
      title: "লিংক কপি করুন",
      subtitle: "এই পোস্টের লিংক কপি করুন",
      onClick: handleCopyLink,
    },
    {
      icon: <HiOutlineEyeOff size={20} />,
      title: "আগ্রহী নই",
      subtitle: "এই ধরনের পোস্ট কম দেখাও",
      onClick: onClose,
    },
    {
      icon: <HiOutlineFlag size={20} />,
      title: "পোস্ট রিপোর্ট করুন",
      subtitle: "এই পোস্টটি নিয়ে আমি উদ্বিগ্ন",
      onClick: onClose,
    },
  ];

  if (isOwnPost) {
    menuItems.push({
      icon: <HiOutlineTrash size={20} />,
      title: "পোস্ট ডিলিট করুন",
      subtitle: "এই পোস্টটি স্থায়ীভাবে মুছে ফেলুন",
      onClick: handleDeletePost,
      danger: true,
    });
  }

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] py-1.5 animate-in fade-in zoom-in-95 duration-100"
    >
      {menuItems.map((item, index) => (
        <React.Fragment key={index}>
          {item.danger && <div className="my-1.5 h-px bg-gray-100 mx-2" />}
          <button
            onClick={item.onClick}
            style={{ width: "calc(100% - 8px)" }}
            className={`flex items-center gap-3 px-3 py-2 mx-1 rounded-lg transition-colors duration-100 text-left
              ${
                item.danger
                  ? "hover:bg-red-50 text-red-600"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
          >
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                ${item.danger ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"}`}
            >
              {item.icon}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                {item.title}
              </span>
              {item.subtitle && (
                <span
                  className={`text-xs mt-0.5 ${item.danger ? "text-red-400" : "text-gray-500"}`}
                >
                  {item.subtitle}
                </span>
              )}
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default PostThreeDotMenu;
