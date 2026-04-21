import React from "react";
import Image from "next/image";

import FollowButton from "../../buttons/FollowButton";
import { HiBadgeCheck } from "react-icons/hi";
import { HiDotsHorizontal } from "react-icons/hi";
const PostProfiletop = () => {
  return (
    <div className="top px-6 pb-1 flex items-center justify-between">
      <div className="flex items-center gap-2 ">
        <div className="w-12 h-12 rounded-full overflow-hidden border-border shrink-0">
          <Image
            width={80}
            height={80}
            className=" bg-gray-300  w-full h-full object-cover "
            src="/image/hero.jpg"
            alt=""
          />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h5 className="flex items-center gap-1.5">
              সিয়াম হোসেন <HiBadgeCheck className="text-accent" />
            </h5>
            <FollowButton />
          </div>
          <span className="block text-text-secondary -mt-0.5 text-sm">
            5 মাস আগে
          </span>
        </div>
      </div>
      <div>
        <HiDotsHorizontal size={19} />
      </div>
    </div>
  );
};

export default PostProfiletop;
