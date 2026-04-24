"use client";

import { useState, useEffect } from "react";
import { IoSearch } from "react-icons/io5";
import { useRouter } from "next/navigation";

const Searchbox = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit(e as any);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-75 items-center gap-2 border border-accent/20 rounded-full overflow-hidden p-1"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="px-5 py-1 w-full text-sm"
        placeholder="তথ্য অনুসন্ধান করুন"
      />
      <button type="submit">
        <IoSearch className="w-9 h-9 shrink-0 rounded-full bg-accent/30 p-2 text-lg cursor-pointer" />
      </button>
    </form>
  );
};

export default Searchbox;
