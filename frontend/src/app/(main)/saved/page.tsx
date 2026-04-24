"use client";

import { useState } from "react";

import SavedPostsList from "@/components/layout/save/SavedPostsList";
import SavedCollectionPanel from "@/components/layout/save/SavedCollectionPanel";
import { useGetDefaultCollectionQuery } from "@/redux/api/save/savedCollectionApi";

export default function SavedPage() {
  const { data: defaultCol } = useGetDefaultCollectionQuery();
  const [activeCollectionId, setActiveCollectionId] = useState<string>("");

  // default collection load হলে set করো
  const resolvedId = activeCollectionId || defaultCol?._id || "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
      {/* left - posts */}
      <div>
        <h1 className="text-lg font-semibold mb-4">সেভ করা পোস্ট</h1>
        {resolvedId ? (
          <SavedPostsList collectionId={resolvedId} />
        ) : (
          <div className="text-center py-10 text-text-secondary text-sm">
            একটি ফোল্ডার সিলেক্ট করো
          </div>
        )}
      </div>

      {/* right - collections */}
      <div>
        <SavedCollectionPanel
          activeId={resolvedId}
          onSelect={setActiveCollectionId}
        />
      </div>
    </div>
  );
}
