import React from "react";
import { Navigationdata } from "./navigationdata";
import { IoSearch } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { FaChevronDown } from "react-icons/fa";
import { HiOutlineShoppingCart } from "react-icons/hi";
import IconButton from "@/components/buttons/Iconbutton";

const Nav = () => {
  return (
    <div className="Pagearea border-b border-border">
      <div className="h-[70px] flex items-center justify-between">
        <div className=" h-full flex items-center gap-8">
          <div className="font-semibold text-xl w-[80px]  h-full">
            <img
              className="w-full h-full"
              src="/image/logos/pathangan.png"
              alt=""
            />
          </div>
          <ul className="flex h-full items-center gap-5 ">
            {Navigationdata.map((data, index) => (
              <li
                key={index}
                className=" relative group flex items-center gap-1 h-full"
              >
                <span className="block">{data.Name}</span>

                {/* Show icon only if dropdown exists */}
                {data.Dropdowndata && data.Dropdowndata.length > 0 && (
                  <FaChevronDown size={12} className="" />
                )}

                {/* Dropdown */}
                {data.Dropdowndata && data.Dropdowndata.length > 0 && (
                  <div className="absolute hidden group-hover:block w-auto py-2  top-[70px] left-[-17px]">
                    <div className="bg-background-second flex flex-col gap-1.5 px-5 py-5 rounded-md w-[200px]">
                      {data.Dropdowndata.map((dropdata, i) => (
                        <div className=" py-1 cursor-pointer" key={i}>
                          {dropdata.Name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-4">
          <div className=" flex items-center">
            <IconButton
              icon={HiOutlineShoppingCart}
              NotifacationStatus={true}
            />
            <IconButton icon={CgProfile} />
          </div>
          <form
            className=" flex bg-background-second rounded-full overflow-hidden p-1 w-[300px]  border border-border-second "
            action=""
          >
            <input
              className="px-5 py-[6px] text-base text-[14px] w-full"
              type="text"
              placeholder="বংলাই খুজুন"
            />
            <IconButton
              icon={IoSearch}
              className="bg-background hover:bg-background-second border-border-second border"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default Nav;
