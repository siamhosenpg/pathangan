// components/IconButton.jsx

import React from "react";

export default function IconButton({
  icon: Icon,
  className,
  NotifacationStatus,
}) {
  return (
    <button
      className={`p-2 rounded-full cursor-pointer text-text-second shrink-0 flex items-center justify-center  w-[36px] h-[36px] relative  transition ${className}`}
    >
      {NotifacationStatus && (
        <div className="bg-red-500 w-[10px] h-[10px] absolute rounded-full border-background border-2 right-0 mr-2 mt-[-3px]"></div>
      )}

      <Icon size={18} />
    </button>
  );
}
