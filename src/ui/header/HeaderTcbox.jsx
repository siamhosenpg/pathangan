import React from "react";
import Rating from "@/components/rating/Rating";

const HeaderTcbox = ({ data }) => {
  return (
    <div className="w-full px-5 py-4  border-border border rounded-lg backdrop-blur-2xl bg-linear-to-r from-[#008cff0e] to-[#83ff8300] ">
      <div className="flex justify-between  items-center gap-5">
        <div className="w-17 h-17 shrink-0 rounded-lg overflow-hidden">
          <img
            className="w-full h-full rounded-lg"
            src={data.profile_image}
            alt=""
          />
        </div>
        <div className="w-full ">
          <h6>{data.name}</h6>
          <div className="text-sm">{data.occupation}</div>
          <div>
            <Rating rating={data.rating} />
          </div>
        </div>
      </div>
      <p className="  text-sm mt-4 line-clamp-2 overflow-hidden ">
        {data.about}
      </p>
    </div>
  );
};

export default HeaderTcbox;
