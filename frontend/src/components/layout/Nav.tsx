import React from "react";
import Link from "next/link";

import { navigationdata } from "./navigationdata";

// Icons
import { FaAngleDown } from "react-icons/fa6";
import { IconType } from "react-icons";

// Component
import Searchbox from "../ui/searchbox/Searchbox";

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
  return (
    <div className="bg-background border-b border-border h-18 fixed top-0 left-0 w-full z-50">
      {/* loading indicator */}
      <div className="hidden w-5/12 mb-[-2] bg-green-600 h-1 absolute bottom-0"></div>

      <div className="Pagearea flex justify-between items-center h-full">
        {/* Left side */}
        <div className="flex items-center gap-8">
          <div className="w-30 h-full">
            <img
              className="w-full object-cover"
              src="/image/logo/pathangan.png"
              alt="logo"
            />
          </div>

          <ul className="flex gap-6 items-center font-medium">
            {navigationdata.map((item: NavItem, index: number) => {
              return (
                <li key={index} className="relative group">
                  {/* Parent item */}
                  <Link
                    href={item.link}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <span>{item.name}</span>

                    {item.submenu && (
                      <FaAngleDown className="text-[10px] text-text-secondary group-hover:rotate-[-90deg] duration-200" />
                    )}
                  </Link>

                  {/* Submenu */}
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
              );
            })}
          </ul>
        </div>

        {/* Right side */}
        <div className="flex gap-6 items-center">
          <Searchbox />
        </div>
      </div>
    </div>
  );
};

export default Nav;
