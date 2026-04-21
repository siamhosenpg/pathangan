import React from "react";
import FollowButton from "../buttons/FollowButton";

const Profilecard = () => {
  return (
    <div className="p-2 pr-3 w-full flex items-center justify-between bg-background hover:bg-accent/10 duration-200 transition-all rounded-xl">
      <div className="flex items-center gap-2.5 w-4/6 ">
        <div className="w-13 h-13 rounded-full border border-border shrink">
          <img
            className="w-full h-full rounded-full overflow-hidden  object-cover"
            src="/image/hero.jpg"
            alt=""
          />
        </div>
        <div>
          <h5>সিয়াম হোসেন</h5>
          <span className="block mt-0.5 text-sm font-medium text-text-tertiary">
            পদার্থ বিজ্ঞান শিক্ষক
          </span>
        </div>
      </div>
      <div className=" shrink-0 ">
        <FollowButton />
      </div>
    </div>
  );
};

export default Profilecard;
