"use client";

import { useSearchParams } from "next/navigation";
import { useGlobalSearchQuery } from "@/redux/api/others/searchApi";
import SearchPosts from "@/components/layout/search/SearchPosts";
import SearchAccounts from "@/components/layout/search/SearchAccounts";
import { IoSearch } from "react-icons/io5";

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const { data, isLoading, isError } = useGlobalSearchQuery(q, {
    skip: !q,
  });

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-16">
        <svg
          className="animate-spin text-accent"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 018-8"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-75"
          />
        </svg>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-secondary">
        <IoSearch size={40} className="opacity-30" />
        <p className="text-sm">কিছু খুঁজুন</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-text-secondary text-sm">
        সার্চ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <p className="text-sm text-text-secondary mb-6">
        <span className="font-semibold text-text-primary">&quot;{q}&quot;</span>{" "}
        এর ফলাফল
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start">
        <SearchPosts posts={data?.posts ?? []} />

        <div className="bg-background rounded-xl p-4 sticky top-4">
          <SearchAccounts users={data?.users ?? []} />
        </div>
      </div>
    </div>
  );
}
