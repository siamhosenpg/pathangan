import React from "react";
// Importing profile icon from react-icons
import { CgProfile } from "react-icons/cg";

const ProfileAvater = () => {
  return (
    <button className="flex items-center cursor-pointer ">
      <CgProfile className="text-xl" />
    </button>
  );
};

export default ProfileAvater;
