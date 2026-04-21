import Image from "next/image";
import React from "react";
import { HiBadgeCheck } from "react-icons/hi";
import StarRating from "../star/StarRating";

const ProfileNavcard = () => {
  return (
    <div className="p-6 bg-background rounded-xl h-fit shrink-0 flex items-center gap-2.5">
      <div className="w-14 h-14 overflow-hidden rounded-full border border-border">
        <Image
          width={100}
          height={100}
          className=" w-full h-full object-cover"
          src="/image/hero.jpg"
          alt=""
        />
      </div>
      <div>
        <div className="flex items-center gap-3">
          <h5 className="flex items-center gap-1.5">
            সিয়াম হোসেন <HiBadgeCheck className="text-accent" />
          </h5>
        </div>
        <div className=" text-text-secondary   flex gap-2  items-center">
          <StarRating rating={4.6} />
          <span className=" text-sm">৪৯ জন বেত্তি </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileNavcard;
