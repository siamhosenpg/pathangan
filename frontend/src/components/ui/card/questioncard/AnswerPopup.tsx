"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import AnswerPopupContent from "./AnswerPopupContent";

interface Props {
  questionId: string;
  questionText: string;
  onClose: () => void;
}

export default function AnswerPopup({
  questionId,
  questionText,
  onClose,
}: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-background w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold">উত্তর দিন</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <IoClose size={18} />
          </button>
        </div>

        <AnswerPopupContent
          questionId={questionId}
          questionText={questionText}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
