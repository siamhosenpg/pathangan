"use client";

import { useState } from "react";

import SavedPostsList from "@/components/layout/save/SavedPostsList";
import SavedCollectionPanel from "@/components/layout/save/SavedCollectionPanel";
import { useGetDefaultCollectionQuery } from "@/redux/api/save/savedCollectionApi";
import PostCardSkeleton from "@/components/ui/card/postcard/PostCardSkeleton";

function CollectionPanelSkeleton() {
  return (
    <div className="flex flex-col gap-3   w-full ">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 w-full rounded-2xl bg-background px-4 py-3"
        >
          <div className="w-9 h-9 rounded-xl bg-background-secondary shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 w-1/2 rounded-full bg-background-secondary" />
            <div className="h-2.5 w-1/3 rounded-full bg-background-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SavedPage() {
  const { data: defaultCol, isLoading: isDefaultColLoading } =
    useGetDefaultCollectionQuery();
  const [activeCollectionId, setActiveCollectionId] = useState<string>("");

  const resolvedId = activeCollectionId || defaultCol?._id || "";

  return (
    <div className="flex gap-6 w-full">
      {/* left - posts */}
      <div className="w-7/12">
        {isDefaultColLoading ? (
          <PostCardSkeleton />
        ) : resolvedId ? (
          <SavedPostsList collectionId={resolvedId} />
        ) : (
          <div className="text-center py-10 text-text-secondary text-sm">
            একটি ফোল্ডার সিলেক্ট করো
          </div>
        )}
      </div>

      {/* right - collections */}
      <div className="w-5/12">
        {isDefaultColLoading ? (
          <CollectionPanelSkeleton />
        ) : (
          <SavedCollectionPanel
            activeId={resolvedId}
            onSelect={setActiveCollectionId}
          />
        )}
      </div>
    </div>
  );
}
