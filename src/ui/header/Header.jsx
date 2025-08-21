import React from "react";
import { Headerdata, Headerteacherdata, HeaderScoreData } from "./headerdata";
import HeaderTcbox from "./HeaderTcbox";

const Header = () => {
  return (
    <div className="Pagearea bg-background-second h-[calc(100vh_-_70px)]">
      <div className="flex items-center h-full justify-between gap-12 relative">
        <div className="left w-6/12 relative z-10">
          <h1>{Headerdata.Title}</h1>
          <p className="mt-6 pra">{Headerdata.Paragraph}</p>
          <div className=" flex items-center gap-6 mt-6">
            {HeaderScoreData.map((data, i) => (
              <div className="flex  items-center gap-3">
                <h2>{data.Countnumber}</h2>
                <h6 className="mt-2">{data.text}</h6>
              </div>
            ))}
          </div>
        </div>
        <div className="w-[500px] h-[500px] bg-[#0c79ff15] blur-3xl absolute right-[30%] z-0"></div>
        <div className="right w-6/12 grid grid-cols-2 gap-6 relative z-10">
          {Headerteacherdata &&
            Headerteacherdata.map((data, i) => (
              <HeaderTcbox key={i} data={data} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Header;
