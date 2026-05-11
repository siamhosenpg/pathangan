"use client";
import React from "react";
import Link from "next/link";
import { navigationdata } from "./navigationdata";
import { FaAngleDown } from "react-icons/fa6";
import { IconType } from "react-icons";
import { IoSearch, IoClose } from "react-icons/io5";
import Searchbox from "../../ui/searchbox/Searchbox";
import NotificationNav from "@/components/ui/notifications/NotificationNav";

type SubMenuItem = {
  name: string;
  link: string;
};

type NavItem = {
  name: string;
  link: string;
  icon?: IconType;
  submenu?: SubMenuItem[];
};

const Nav = () => {
  const [showSearch, setShowSearch] = React.useState(false);

  return (
    <div className="bg-background border-b border-border h-18 fixed top-0 left-0 w-full z-50">
      <div className="hidden w-5/12 mb-[-2] bg-green-600 h-1 absolute bottom-0"></div>

      <div className="Pagearea flex justify-between items-center h-full">
        {/* Left side */}
        <div className="items-center gap-8 flex ml-6 md:ml-0">
          <div className="w-30 h-full">
            <img
              className="w-full object-cover"
              src="/image/logo/pathangan.png"
              alt="logo"
            />
          </div>

          <ul className="gap-6 items-center font-medium hidden md:flex">
            {navigationdata.map((item: NavItem, index: number) => (
              <li key={index} className="relative group">
                <Link
                  href={item.link}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <span>{item.name}</span>
                  {item.submenu && (
                    <FaAngleDown className="text-[10px] text-text-secondary group-hover:rotate-[-90deg] duration-200" />
                  )}
                </Link>

                {item.submenu && (
                  <div className="absolute hidden bg-transparent pt-6 mt-[-10px] group-hover:block w-fit">
                    <ul className="bg-background p-3 rounded border-border border w-fit">
                      {item.submenu.map((subItem, subIndex: number) => (
                        <li
                          key={subIndex}
                          className="px-6 py-3 rounded hover:bg-background-secondary min-w-[150px] text-nowrap cursor-pointer"
                        >
                          <Link href={subItem.link}>{subItem.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Right side */}
        <div className="flex gap-2 md:gap-6 items-center flex-row-reverse md:flex-row w-full md:w-auto px-6 md:px-0">
          <NotificationNav />

          {/* Mobile search toggle button */}
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className="md:hidden relative w-9 h-9 flex items-center justify-center"
            aria-label="সার্চ"
          >
            <IoSearch
              className={`absolute w-5 h-5 transition-all duration-300 ${
                showSearch
                  ? "opacity-0 rotate-90 scale-50"
                  : "opacity-100 rotate-0 scale-100"
              }`}
            />
            <IoClose
              className={`absolute w-5 h-5 transition-all duration-300 ${
                showSearch
                  ? "opacity-100 rotate-0 scale-100"
                  : "opacity-0 -rotate-90 scale-50"
              }`}
            />
          </button>

          <div className="hidden md:block">
            <Searchbox />
          </div>
        </div>
      </div>

      {/* Mobile search dropdown */}
      <div
        className={`md:hidden absolute left-0 w-full bg-linear-to-b from-background to-transparent  overflow-hidden transition-all duration-300 ease-in-out ${
          showSearch
            ? "max-h-24 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2"
        }`}
        style={{ top: "72px" }}
      >
        <div className="px-4 py-2">
          <Searchbox />
        </div>
      </div>
    </div>
  );
};

export default Nav;
