import React from "react";
import FollowButton from "../buttons/FollowButton";
import type { User } from "@/types/usertypes";
import Image from "next/image";
interface UserProps {
  user: User;
}

const Profilecard = ({ user }: UserProps) => {
  return (
    <div className="p-2 pr-3 w-full flex items-center justify-between bg-background hover:bg-accent/10 duration-200 transition-all rounded-xl">
      <div className="flex items-center gap-2.5 w-4/6 ">
        <div className="w-13 h-13 rounded-full border border-border shrink">
          {user.profileImage ? (
            <Image
              alt="profile"
              src={user.profileImage}
              width={90}
              height={90}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center bg-accent-secondary">
              <span className="text-2xl font-bold text-accent">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div>
          <h5>{user?.name}</h5>
          {user?.bio && (
            <span className="block mt-0.5 text-sm font-medium text-text-tertiary">
              {user?.bio}
            </span>
          )}
        </div>
      </div>
      <div className=" shrink-0 ">
        <FollowButton />
      </div>
    </div>
  );
};

export default Profilecard;
