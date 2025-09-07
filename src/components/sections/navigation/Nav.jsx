import React from "react";
import { NavData } from "./navigationdata"; // Adjust the path as necessary

// Importing icons from react-icons
import { CgProfile } from "react-icons/cg";

const Nav = () => {
  return (
    <div className="bg-background border-b border-border h-18">
      <div className="Pagearea flex justify-between items-center h-full">
        {/*  Left side: Logo and Navigation Links */}
        <div className="flex items-center gap-10">
          <div>logo</div>
          <ul className="flex gap-8 items-center">
            {NavData.map((item, index) => (
              <li key={index}>
                {" "}
                {item.name}
                {item.submenu ? (
                  <ul>
                    {item.submenu &&
                      item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>{subItem.name}</li>
                      ))}
                  </ul>
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
