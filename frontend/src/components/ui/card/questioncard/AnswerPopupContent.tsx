"use client";

import { useState } from "react";
import { FiSend } from "react-icons/fi";
import { useCreateAnswerMutation } from "@/redux/api/answer/answersApi";

interface Props {
  questionId: string;
  questionText: string;
  onClose: () => void;
}

export default function AnswerPopupContent({
  questionId,
  questionText,
  onClose,
}: Props) {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [createAnswer, { isLoading }] = useCreateAnswerMutation();

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    if (answer.trim().length < 5) {
      setError("উত্তর কমপক্ষে ৫ অক্ষরের হতে হবে");
      return;
    }
    setError("");
    try {
      await createAnswer({ questionId, text: answer.trim() }).unwrap();
      setAnswer("");
      onClose();
    } catch (err: any) {
      const msg = err?.data?.message;
      if (msg === "You have already answered this question") {
        setError("আপনি আগেই এই প্রশ্নের উত্তর দিয়েছেন");
      } else {
        setError(msg || "কিছু একটা সমস্যা হয়েছে");
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-xs text-text-tertiary mb-1">প্রশ্ন</p>
        <h3 className="text-base font-semibold text-text-primary leading-snug">
          {questionText}
        </h3>
      </div>

      <div className="flex-1 px-5 py-4">
        <textarea
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            if (error) setError("");
          }}
          placeholder="আপনার উত্তর লিখুন..."
          className="w-full h-full min-h-40 text-sm text-text-primary bg-background-secondary rounded-xl px-4 py-3 outline-none resize-none placeholder:text-text-tertiary leading-relaxed border border-transparent focus:border-accent/30 transition-colors"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <div className="px-5 py-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          {answer.length} অক্ষর
        </span>
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || isLoading}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <FiSend size={15} />
          {isLoading ? "পোস্ট হচ্ছে..." : "উত্তর দিন"}
        </button>
      </div>
    </div>
  );
}
