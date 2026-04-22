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
    <div className="w-full h-[calc(100vh-108px)] -mt-4.5 rounded-2xl bg-background flex items-center justify-center">
      <div className="flex flex-col items-center text-center px-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <RiAlertLine size={36} className="text-accent" />
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-bold text-accent mb-3">৪০৪</h1>

        {/* Divider */}
        <div className="w-12 h-px bg-border mb-5" />

        {/* Title */}
        <h2 className="text-xl font-semibold text-text mb-2">
          পৃষ্ঠাটি খুঁজে পাওয়া যাচ্ছে না
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-text-secondary leading-7 max-w-[320px] mb-6">
          আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি হয়তো সরিয়ে ফেলা হয়েছে, নাম পরিবর্তন
          হয়েছে, অথবা কখনো ছিলই না।
        </p>

        {/* Path badge */}
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-mono rounded-lg px-3 py-2 mb-8">
          <RiLink size={13} />
          {pathname}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 bg-accent hover:bg-green-600 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors cursor-pointer"
          >
            <RiHomeLine size={16} />
            হোমপেজে যান
          </button>

          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 border border-border hover:border-green-500/40 hover:bg-green-500/5 text-text-secondary hover:text-green-500 text-sm font-medium rounded-lg px-5 py-2.5 transition-colors cursor-pointer"
          >
            <RiArrowLeftLine size={16} />
            পেছনে ফিরুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
