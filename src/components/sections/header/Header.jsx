import React from "react";
import { HeaderData } from "./headerdata";

const Header = () => {
  return (
    <div className="  text-white bg-linear-to-bl  from-violet-600 to-fuchsia-800 h-[calc(100vh_-_70px)] overflow-hidden">
      <div className=" Pagearea flex items-center justify-between gap-8 h-full w-full overflow-hidden">
        <div className="w-6/12">
          <h1 className="text-shadow-xl  ">{HeaderData.title}</h1>
          <p className="mt-4  leading-7">{HeaderData.description}</p>
          {/* Achievement Section */}
          <div className="flex gap-12 mt-16">
            {HeaderData.achievement.map((item, index) => (
              <div key={index} className={``}>
                <h2 className="text-5xl font-bold">{item.number}</h2>
                <h6 className="text-sm mt-1.5">{item.title}</h6>
              </div>
            ))}
          </div>
        </div>
        <div className="w-5/12 h-full relative">
          <img
            className=" absolute w-full h-full z-0 opacity-10"
            src="/image/header/brush.png"
            alt=""
          />
          <img
            className="h-full object-cover overflow-visible mt-8 relative z-10"
            src={HeaderData.image}
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
