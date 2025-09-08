import React from "react";

import { HiOutlineShoppingCart } from "react-icons/hi";

const Carticon = () => {
  return (
    <button className="flex items-center cursor-pointer ">
      <HiOutlineShoppingCart className="text-xl" />
    </button>
  );
};

export default Carticon;
