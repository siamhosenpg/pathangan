import React from "react";
import { FooterData } from "./footerdata";

const Footer = () => {
  return (
    <div className=" bg-gray-900">
      <div className="Pagearea flex justify-between gap-18 py-18">
        <div className="w-4/12 ">
          <img
            className="w-32 object-cover"
            src="/image/logo/logo.png"
            alt="Pathangan Logo"
          />
          <p className="mt-4 text-gray-400">
            পথঙ্গনের মাধ্যমে আমরা চাই বাংলাদেশের প্রতিটি শিক্ষার্থী যেন মানসম্মত
            শিক্ষা উপভোগ করতে পারে। আমরা বিশ্বাস করি, শিক্ষাই পারে পরিবর্তন
            আনার।
          </p>

          <div className="mt-6 text-gray-500 text-sm">
            &copy; 2024 Pathangan. All rights reserved.
          </div>
        </div>
        <div className="w-8/12 flex justify-between ">
          {FooterData.map((item, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <ul className="mt-8">
                {item.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="mb-2">
                    <a
                      href={link.link}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Footer;
