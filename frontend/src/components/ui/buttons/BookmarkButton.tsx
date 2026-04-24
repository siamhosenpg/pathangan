"use client";

import { MdBookmark, MdBookmarkBorder } from "react-icons/md";
import {
  useCheckIfSavedQuery,
  useSavePostMutation,
  useDeleteSavedItemMutation,
} from "@/redux/api/save/savedItemApi";
import { useGetDefaultCollectionQuery } from "@/redux/api/save/savedCollectionApi";

export default function BookmarkButton({ postId }: { postId: string }) {
  const { data: savedStatus } = useCheckIfSavedQuery(postId, {
    skip: !postId, // ← postId না থাকলে call করবে না
  });

  const { data: defaultCol, isLoading: colLoading } =
    useGetDefaultCollectionQuery();

  const [savePost, { isLoading: saving }] = useSavePostMutation();
  const [deleteSaved, { isLoading: deleting }] = useDeleteSavedItemMutation();

  const isLoading = saving || deleting || colLoading;

  const handleToggle = async () => {
    if (!postId) return; // ← postId guard
    if (!defaultCol?._id) return; // ← collectionId guard
    if (isLoading) return;

    if (savedStatus?.saved) {
      await deleteSaved(postId);
    } else {
      await savePost({ collectionId: defaultCol._id, postId });
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || !postId}
      className="flex items-center gap-1.5 disabled:opacity-50"
    >
      {savedStatus?.saved ? (
        <MdBookmark size={21} className="text-accent" />
      ) : (
        <MdBookmarkBorder size={21} />
      )}
    </button>
  );
}
