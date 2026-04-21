"use client";

import React from "react";
import {
  RiAlertLine,
  RiHomeLine,
  RiArrowLeftLine,
  RiLink,
} from "react-icons/ri";
import { usePathname, useRouter } from "next/navigation";

const NotFoundPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="w-full h-[calc(100vh-108px)] -mt-4.5 rounded-2xl bg-background relative overflow-hidden flex items-center justify-center">
      {/* Grid background */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          backgroundImage: `linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Outer hex clip-path shape */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] animate-spin"
        style={{
          clipPath:
            "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
          background:
            "linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(16,185,129,0.05) 100%)",
          animationDuration: "18s",
          animationTimingFunction: "linear",
        }}
      />

      {/* Inner hex clip-path shape */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] animate-spin"
        style={{
          clipPath:
            "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
          background: "rgba(34,197,94,0.07)",
          border: "1px solid rgba(34,197,94,0.15)",
          animationDuration: "12s",
          animationTimingFunction: "linear",
          animationDirection: "reverse",
        }}
      />

      {/* Corner decorations */}
      {[
        "top-[18px] left-[18px] border-t-2 border-l-2 rounded-tl",
        "top-[18px] right-[18px] border-t-2 border-r-2 rounded-tr",
        "bottom-[18px] left-[18px] border-b-2 border-l-2 rounded-bl",
        "bottom-[18px] right-[18px] border-b-2 border-r-2 rounded-br",
      ].map((cls, i) => (
        <div
          key={i}
          className={`absolute w-[60px] h-[60px] ${cls}`}
          style={{ borderColor: "rgba(34,197,94,0.2)" }}
        />
      ))}

      {/* Corner dots */}
      {[
        "top-[60px] left-[60px]",
        "top-[60px] right-[60px]",
        "bottom-[60px] left-[60px]",
        "bottom-[60px] right-[60px]",
      ].map((cls, i) => (
        <div
          key={i}
          className={`absolute w-[6px] h-[6px] rounded-full ${cls}`}
          style={{ background: "#22c55e", opacity: 0.4 }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-10">
        {/* Icon ring */}
        <div
          className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-5"
          style={{
            background: "rgba(34,197,94,0.12)",
            border: "1.5px solid rgba(34,197,94,0.35)",
            animation: "pulse-green 2.5s ease-in-out infinite",
          }}
        >
          <RiAlertLine size={44} color="#22c55e" />
        </div>

        {/* 404 */}
        <h1
          className="text-[92px] font-bold leading-none tracking-tighter mb-2"
          style={{
            background:
              "linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #86efac 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ৪০৪
        </h1>

        {/* Divider */}
        <div
          className="w-14 h-0.5 rounded-full my-3"
          style={{
            background:
              "linear-gradient(90deg, transparent, #22c55e, transparent)",
          }}
        />

        {/* Title */}
        <h2 className="text-[22px] font-semibold mb-2.5 text-text">
          পৃষ্ঠাটি খুঁজে পাওয়া যাচ্ছে না
        </h2>

        {/* Subtitle */}
        <p className="text-sm leading-7 max-w-[300px] mb-7 text-text-tertiary">
          আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি হয়তো সরিয়ে ফেলা হয়েছে, নাম পরিবর্তন
          হয়েছে, অথবা কখনো ছিলই না।
        </p>

        {/* Current path badge */}
        <div
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-mono mb-7"
          style={{
            background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.25)",
            color: "#4ade80",
          }}
        >
          <RiLink size={14} color="#4ade80" />
          {pathname}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2.5 rounded-[10px] px-7 py-3 text-[15px] font-semibold transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            style={{
              background: "#22c55e",
              color: "#052e12",
            }}
          >
            <RiHomeLine size={18} />
            হোমপেজে যান
          </button>

          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-[10px] px-5 py-3 text-[15px] font-medium transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            style={{
              background: "transparent",
              color: "#4ade80",
              border: "1.5px solid rgba(34,197,94,0.3)",
            }}
          >
            <RiArrowLeftLine size={18} />
            পেছনে ফিরুন
          </button>
        </div>
      </div>

      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.2); }
          50%       { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
