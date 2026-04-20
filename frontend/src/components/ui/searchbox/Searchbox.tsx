"use client";
import React from "react";

// Importing search icon from react-icons
import { IoSearch } from "react-icons/io5";

const Searchbox = () => {
  return (
    <form className="flex w-[300px] items-center gap-2 border border-border rounded-full overflow-hidden p-1 ">
      <input
        type="text"
        className="  px-5 py-1 w-full  text-sm "
        placeholder="তথ্য অনুসন্ধান করুন"
      />
      <IoSearch className=" w-9 h-9 shrink-0 rounded-full  bg-background-secondary p-2 text-lg cursor-pointer" />
    </form>
  );
};

export default Searchbox;
