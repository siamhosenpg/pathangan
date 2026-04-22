"use client";
import React from "react";
import {
  AiOutlineFileText,
  AiOutlineSetting,
  AiOutlineBook,
  AiOutlineCheckSquare,
  AiOutlineCalendar,
  AiOutlineBell,
  AiOutlineMessage,
  AiOutlineShoppingCart,
  AiOutlineLogout,
} from "react-icons/ai";

import { useLogoutMutation } from "@/redux/api/authApi";
import { clearUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
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
];

const LeftNav = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearUser());
      router.push("/login");
    }
  };
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
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-accent/10 hover:text-indigo-900 transition-all duration-200 ease-in-out font-medium"
          >
            <AiOutlineLogout size={21} />
            <span> {isLoading ? "লগ আউট হচ্ছে..." : "লগ আউট"} </span>
          </button>
        </ul>
      </div>
    </nav>
  );
};

export default LeftNav;
