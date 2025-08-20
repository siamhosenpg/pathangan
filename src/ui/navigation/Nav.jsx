import React from "react";
import { Navigationdata } from "./navigationdata";

const Nav = () => {
  return (
    <div className="Pagearea border-b">
      <div className="h-[70px] flex items-center">
        <div>logo</div>
        <ul className="flex items-center gap-2">
          {Navigationdata.map((data, index) => {
            return <li key={index}>{data.Name}</li>;
          })}
        </ul>
      </div>
    </div>
  );
};

export default Nav;
