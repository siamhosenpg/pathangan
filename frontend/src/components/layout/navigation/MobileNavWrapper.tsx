"use client";

import dynamic from "next/dynamic";

const MobileNav = dynamic(
  () => import("@/components/layout/navigation/MobileNave"),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function MobileNavWrapper() {
  return (
    <div className="block md:hidden">
      <MobileNav />
    </div>
  );
}
