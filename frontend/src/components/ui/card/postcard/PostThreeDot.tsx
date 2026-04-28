"use client";

import React, { useRef, useState } from "react";
import { HiDotsHorizontal } from "react-icons/hi";
import PostThreeDotMenu from "./PostThreeDotMenu";

interface Props {
  postId: string;
  postAuthorId: string;
}

const PostThreeDot = ({ postId, postAuthorId }: Props) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 280;
    const menuHeight = 240;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    let left: number;

    if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6;
    } else {
      top = rect.top - menuHeight - 6;
    }

    left = rect.right - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8;
    }

    setMenuStyle({
      top,
      left,
      width: menuWidth,
      position: "fixed",
      zIndex: 9999,
    });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center cursor-pointer rounded-full hover:bg-gray-200/70 transition-colors duration-150 text-gray-500"
      >
        <HiDotsHorizontal size={19} />
      </button>

      {open && (
        <PostThreeDotMenu
          postId={postId}
          postAuthorId={postAuthorId}
          menuStyle={menuStyle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default PostThreeDot;
