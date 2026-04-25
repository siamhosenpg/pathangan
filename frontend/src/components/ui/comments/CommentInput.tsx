"use client";

import { useState } from "react";
import { FiSend } from "react-icons/fi";

interface Props {
  onSubmit?: (text: string) => void;
}

export default function CommentInput({ onSubmit }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit?.(text.trim());
    setText("");
  };

  return (
    <div className="px-4 py-3 border-t border-border">
      <div className="flex items-center gap-3 bg-background-secondary rounded-full px-4 py-2.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="মন্তব্য লিখুন..."
          className="flex-1 text-sm bg-transparent outline-none text-text-primary placeholder:text-text-tertiary"
        />

        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="text-accent hover:opacity-75 transition-opacity flex-shrink-0 disabled:opacity-30"
        >
          <FiSend size={17} />
        </button>
      </div>
    </div>
  );
}
