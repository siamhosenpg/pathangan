import React from "react";

const Header = () => {
  return (
    <div className=" bg-amber-700 h-[calc(100vh_-_70px)] overflow-hidden">
      <div className=" Pagearea flex items-center justify-between h-full w-full overflow-hidden">
        <div className="w-7/12">
          <h1>Walcome to Pathangan</h1>
        </div>
        <div className="w-5/12 h-full">
          <img
            className="h-full object-cover overflow-visible mt-8"
            src="/image/header/hero.png"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
