import React from "react";
import { NavData } from "./navigationdata"; // Adjust the path as necessary

// Importing icons from react-icons
import { CgProfile } from "react-icons/cg";
import { FaAngleDown } from "react-icons/fa6";

const Nav = () => {
  return (
    <div className="bg-background border-b border-border h-18  fixed top-0 left-0 w-full z-50">
      <div className="Pagearea flex justify-between items-center h-full">
        {/*  Left side: Logo and Navigation Links */}
        <div className="flex items-center gap-8 ">
          <div className="w-11 h-11">
            <img
              className="w-full object-cover"
              src="/image/logo/logo.png"
              alt=""
            />
          </div>
          <ul className="flex gap-6 items-center font-medium ">
            {NavData.map((item, index) => (
              <li key={index} className="relative group    ">
                {item.submenu ? (
                  <span className="flex items-center gap-1">
                    <span className="">{item.name}</span>
                    <FaAngleDown className="text-[10px] text-text-secondary group-hover:rotate-[-90deg] duration-200" />
                  </span>
                ) : (
                  <div className="cursor-pointer">{item.name}</div>
                )}

                {item.submenu ? (
                  <div className="absolute hidden bg-transparent pt-6 mt-[-10px] group-hover:block w-fit ">
                    <ul className="  bg-background p-3 rounded border-border border w-fit">
                      {item.submenu &&
                        item.submenu.map((subItem, subIndex) => (
                          <li
                            className="px-6 py-3 rounded hover:bg-background-secondary min-w-[150px] text-nowrap cursor-pointer "
                            key={subIndex}
                          >
                            {subItem.name}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        {/* Right side: Search and icons */}
        <div className="flex gap-6 items-center">
          <div>DarkModeToggle</div>
          <div>Search</div>
          <div>Cart</div>
          <div>
            <CgProfile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nav;
