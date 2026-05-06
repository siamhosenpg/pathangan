export const dynamic = "force-dynamic";

import SearchPageClient from "@/components/layout/search/SearchPageClient";
import { Suspense } from "react";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
