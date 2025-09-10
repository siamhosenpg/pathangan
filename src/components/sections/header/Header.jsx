import React from "react";

const Header = () => {
  return (
    <div className=" bg-linear-to-bl from-violet-400 to-fuchsia-400 h-[calc(100vh_-_70px)] overflow-hidden">
      <div className=" Pagearea flex items-center justify-between gap-8 h-full w-full overflow-hidden">
        <div className="w-6/12">
          <h1>অন্যকে সম্মান করলে তবেই নিজেও সম্মান পাওয়া যায়।</h1>
          <p className="mt-4  leading-7">
            পথঙ্গনের মাধ্যমে আমরা চাই বাংলাদেশের প্রতিটি শিক্ষার্থী যেন মানসম্মত
            শিক্ষা উপভোগ করতে পারে। আমরা বিশ্বাস করি, শিক্ষাই পারে পরিবর্তন
            আনার। তাই আমরা প্রতিটি শিক্ষার্থীর জন্য নিয়ে এসেছি মানসম্মত
            শিক্ষাসামগ্রী, যা তাদের শিক্ষাজীবনকে করবে আরও সমৃদ্ধ ও আনন্দময়।
            পথঙ্গনের সাথে থাকুন, সাফল্যের পথে এগিয়ে চলুন।
          </p>
        </div>
        <div className="w-5/12 h-full relative">
          <img
            className=" absolute w-full h-full z-0 opacity-10"
            src="/image/header/brush.png"
            alt=""
          />
          <img
            className="h-full object-cover overflow-visible mt-8 relative z-10"
            src="/image/header/hero.png"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
