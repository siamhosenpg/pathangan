import Image from "next/image";
import React from "react";
import { FaCaretDown } from "react-icons/fa6";
import { FaRegHeart } from "react-icons/fa6";
import { HiDotsHorizontal } from "react-icons/hi";
import { MdBookmarkBorder, MdBookmark } from "react-icons/md";

const Postcard = () => {
  return (
    <div className="bg-background pt-6 rounded-xl">
      <div className="top px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 ">
          <div className="w-12 h-12 rounded-full overflow-hidden border-border shrink-0">
            <Image
              width={80}
              height={80}
              className=" bg-gray-300  w-full h-full object-cover "
              src=""
              alt=""
            />
          </div>
          <div>
            <h5>Siam Hosen</h5>
            <span className="block -mt-1 text-sm">3 years ago</span>
          </div>
        </div>
        <div>
          <HiDotsHorizontal size={19} />
        </div>
      </div>
      <div>
        <h3 className="mt-2 px-6">
          প্রাচীন সভ্যতার জন্মভূমি ও আধুনিক বিশ্বের এক অনন্য কেন্দ্র
        </h3>
        <p className="mt-2 px-6 line-clamp-3">
          মিশর (Egypt) পৃথিবীর অন্যতম প্রাচীন সভ্যতার দেশ, যার ইতিহাস হাজার
          হাজার বছর পুরনো। নীল নদের তীরে গড়ে ওঠা এই দেশটি মানব ইতিহাসের উন্নয়নে
          অসাধারণ ভূমিকা রেখেছে। প্রাচীন মিশরীয় সভ্যতা শুধু পিরামিড বা ফেরাউনের
          জন্যই বিখ্যাত নয়, বরং এটি ছিল বিজ্ঞান, চিকিৎসা, স্থাপত্য এবং গণিতের এক
          অগ্রণী কেন্দ্র। গিজার পিরামিড এবং স্ফিংক্স আজও পৃথিবীর সাত আশ্চর্যের
          অন্যতম নিদর্শন হিসেবে দাঁড়িয়ে আছে, যা সেই সময়কার উন্নত প্রকৌশল জ্ঞানের
          প্রমাণ দেয়। বর্তমান মিশর আফ্রিকা ও মধ্যপ্রাচ্যের মধ্যে একটি
          গুরুত্বপূর্ণ দেশ। সুয়েজ খাল আন্তর্জাতিক বাণিজ্যের জন্য অত্যন্ত
          গুরুত্বপূর্ণ একটি জলপথ, যা বিশ্ব অর্থনীতিতে মিশরের অবস্থানকে আরও
          শক্তিশালী করেছে। সংস্কৃতি ও ধর্মীয় দিক থেকেও মিশর একটি সমৃদ্ধ দেশ।
          ইসলাম এখানে প্রধান ধর্ম হলেও ঐতিহাসিকভাবে এটি বহু সভ্যতার মিলনস্থল
          হিসেবে পরিচিত। সব মিলিয়ে বলা যায়, মিশর শুধু ইতিহাসের অংশ নয়—এটি অতীত,
          বর্তমান এবং ভবিষ্যতের এক গুরুত্বপূর্ণ সংযোগস্থল।
        </p>
        <div className="w-full mt-1">
          <Image
            width={600}
            height={600}
            alt=""
            className="w-full border-t border-b border border-border "
            src="/image/demo.png"
          />
        </div>

        <div className="px-6 py-1 flex items-center gap-3 border-b border-border">
          <div>
            <span className="font-medium">34</span>{" "}
            <span className="text-sm">অন্যতম</span>
          </div>
          <div>
            <span className="font-medium">34</span>{" "}
            <span className="text-sm">অন্যতম </span>
          </div>
          <div>
            <span className="font-medium">34</span>{" "}
            <span className="text-sm">অন্যতম</span>
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="  flex items-center gap-1.5  ">
              <FaRegHeart size={19} />
              <span className="">প্রধান</span>
            </button>
            <button className="  flex items-center gap-1.5  ">
              <FaCaretDown size={19} />
              <span className="">প্রধান</span>
            </button>
          </div>
          <div>
            <button className="  flex items-center gap-1.5  ">
              <MdBookmarkBorder size={21} />
            </button>
            <button className="  hidden  items-center gap-1.5  ">
              <MdBookmark size={21} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Postcard;
