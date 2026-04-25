"use client";

import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";

interface Props {
  label?: string;
}

export default function BackButton({ label = "ফিরে যান" }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors group"
    >
      <span className="w-8 h-8 rounded-full flex items-center justify-center bg-background-secondary group-hover:bg-background-tertiary transition-colors">
        <IoArrowBack size={17} />
      </span>
      {label}
    </button>
  );
}
