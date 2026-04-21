import React from "react";
import {
  AiOutlineHome,
  AiOutlineUser,
  AiOutlineFileText,
  AiOutlineSetting,
  AiOutlineBook,
  AiOutlineCheckSquare,
  AiOutlineCalendar,
  AiOutlineBell,
  AiOutlineMessage,
  AiOutlineShoppingCart,
  AiOutlineLogout,
  AiOutlinePlus,
  AiOutlineFilter,
  AiOutlineDownload,
  AiOutlineUpload,
} from "react-icons/ai";

interface NavItem {
  id: number;
  name: string;
  icon: React.ReactNode;
  path: string;
}

const navData: NavItem[] = [
  { id: 3, name: "খসড়া", icon: <AiOutlineFileText />, path: "/draft" },
  {
    id: 4,
    name: "কার্যকলাপ",
    icon: <AiOutlineCheckSquare />,
    path: "/activity",
  },
  { id: 5, name: "শিক্ষা", icon: <AiOutlineBook />, path: "/education" },
  { id: 6, name: "ব্যবস্থা", icon: <AiOutlineSetting />, path: "/settings" },
  {
    id: 7,
    name: "ক্যালেন্ডার",
    icon: <AiOutlineCalendar />,
    path: "/calendar",
  },
  { id: 8, name: "বিজ্ঞপ্তি", icon: <AiOutlineBell />, path: "/notifications" },
  { id: 9, name: "বার্তা", icon: <AiOutlineMessage />, path: "/messages" },
  {
    id: 10,
    name: "কেনাকাটা",
    icon: <AiOutlineShoppingCart />,
    path: "/shopping",
  },

  { id: 15, name: "লগ আউট", icon: <AiOutlineLogout />, path: "/logout" },
];

const LeftNav = () => {
  return (
    <nav className=" bg-background rounded-xl h-full ">
      <div className="p-6">
        <ul className="space-y-2">
          {navData.map((item) => (
            <li key={item.id}>
              <a
                href={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-accent/10 hover:text-indigo-900 transition-all duration-200 ease-in-out font-medium"
              >
                <span className="text-xl text-text">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default LeftNav;
