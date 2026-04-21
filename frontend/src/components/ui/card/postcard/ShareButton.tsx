import React from "react";
import { PiShareFatBold } from "react-icons/pi";
const ShareButton = () => {
  return (
    <button className="  flex items-center gap-1.5  ">
      <PiShareFatBold size={19} />
      <span className="font-medium block ">প্রচার</span>
    </button>
  );
};

export default ShareButton;
