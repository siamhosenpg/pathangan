"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BiHomeAlt2 } from "react-icons/bi";
import { TbCalendarQuestion } from "react-icons/tb";
import { RiGraduationCapLine } from "react-icons/ri";
import { MdOutlineAddCircleOutline } from "react-icons/md";
import { useAppSelector } from "@/redux/hooks";

type NavItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  {
    id: "home",
    icon: <BiHomeAlt2 size={22} />,
    label: "হোম",
    href: "/",
  },
  {
    id: "question",
    icon: <TbCalendarQuestion size={22} />,
    label: "প্রশ্ন",
    href: "/questions",
  },
  {
    id: "create",
    icon: <MdOutlineAddCircleOutline size={22} />,
    label: "তৈরি করুন",
    href: "/create-post",
  },
  {
    id: "course",
    icon: <RiGraduationCapLine size={22} />,
    label: "কোর্স",
    href: "/courses",
  },
];

const MobileNav = () => {
  const pathname = usePathname();
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLElement>(null);
  const ticking = useRef(false);
  const { user } = useAppSelector((state) => state.auth);

  const profileHref = "/profile";
  const isProfileActive = pathname === profileHref;

  const firstLetter = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : "প";

  const displayName = user?.name ? user.name.split(" ")[0] : "প্রোফাইল";

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const nav = navRef.current;
          if (!nav) return;

          if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
            nav.style.transform =
              "translateX(-50%) translateY(calc(100% + 20px))";
            nav.style.opacity = "0";
          } else {
            nav.style.transform = "translateX(-50%) translateY(0)";
            nav.style.opacity = "1";
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md"
      style={{
        transform: "translateX(-50%) translateY(0)",
        opacity: 1,
        transition:
          "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
      }}
    >
      <div className="flex items-center justify-between bg-background border border-border rounded-full px-2 py-2 shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-accent/20"
                  : "text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40"
              }`}
            >
              <span
                className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Profile */}
        <Link
          href={`/${user?.username || "profile"}`}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isProfileActive
              ? "bg-accent/20"
              : "text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full overflow-hidden transition-all duration-200 ring-2 ${
              isProfileActive
                ? "ring-accent"
                : "ring-zinc-200 dark:ring-zinc-600"
            }`}
          >
            {user?.profileImage ? (
              <Image
                src={user.profileImage}
                alt="প্রোফাইল"
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent/20 text-accent font-semibold text-xs">
                {firstLetter}
              </div>
            )}
          </div>
          <span className="text-[10px] font-medium leading-none">
            {displayName}
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNav;
