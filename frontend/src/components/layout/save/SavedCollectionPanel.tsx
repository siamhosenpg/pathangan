"use client";

import { useState } from "react";
import {
  MdOutlineCreateNewFolder,
  MdOutlineFolder,
  MdOutlineFolderSpecial,
  MdDeleteOutline,
} from "react-icons/md";

import {
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
} from "@/redux/api/save/savedCollectionApi";
interface Props {
  activeId: string;
  onSelect: (id: string) => void;
}

export default function SavedCollectionPanel({ activeId, onSelect }: Props) {
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const { data: collections, isLoading } = useGetCollectionsQuery();
  const [createCollection, { isLoading: creating }] =
    useCreateCollectionMutation();
  const [deleteCollection] = useDeleteCollectionMutation();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCollection({ name: newName.trim() });
    setNewName("");
    setShowInput(false);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    isDefault: boolean,
  ) => {
    e.stopPropagation();
    if (isDefault) return;
    await deleteCollection(id);
  };

  return (
    <div className="bg-background rounded-xl p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">ফোল্ডার</h2>
        <button
          onClick={() => setShowInput((p) => !p)}
          className="text-accent hover:opacity-75 transition-opacity"
          title="নতুন ফোল্ডার"
        >
          <MdOutlineCreateNewFolder size={22} />
        </button>
      </div>

      {/* new folder input */}
      {showInput && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="ফোল্ডারের নাম"
            className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 bg-background-secondary outline-none focus:border-accent"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="text-sm px-3 py-1.5 bg-accent text-white rounded-lg disabled:opacity-50"
          >
            {creating ? "..." : "যোগ করো"}
          </button>
        </div>
      )}

      {/* list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-lg bg-background-secondary animate-pulse"
            />
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          {collections?.map((col) => (
            <li key={col._id}>
              <button
                onClick={() => onSelect(col._id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                  ${
                    activeId === col._id
                      ? "bg-accent text-white"
                      : "hover:bg-background-secondary text-text-primary"
                  }`}
              >
                <span className="flex items-center gap-2">
                  {col.default ? (
                    <MdOutlineFolderSpecial size={18} />
                  ) : (
                    <MdOutlineFolder size={18} />
                  )}
                  {col.name}
                </span>

                {!col.default && (
                  <span
                    onClick={(e) => handleDelete(e, col._id, col.default)}
                    className={`transition-opacity ${activeId === col._id ? "text-white" : "text-text-secondary"} hover:opacity-75`}
                  >
                    <MdDeleteOutline size={16} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
