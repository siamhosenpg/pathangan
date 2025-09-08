import { LuBookOpenText } from "react-icons/lu";
import { LuNotebookPen } from "react-icons/lu";
import { LiaIdCardSolid } from "react-icons/lia";
import { GrAnnounce } from "react-icons/gr";

export const NavData = [
  {
    name: "কমিউনিটি",
    link: "/",
  },
  {
    name: "ঘোষণাপত্র",
    link: "/about",
    icon: GrAnnounce,
  },
  {
    name: "প্রশ্নসমূহ",
    link: "/questions",
    icon: LuNotebookPen,
    submenu: [
      {
        name: "জুনিয়র স্কুল সার্টিফিকেট",
        link: "/jsc",
      },
      {
        name: "সিনিয়র স্কুল সার্টিফিকেট",
        link: "/ssc",
      },
      {
        name: "উচ্চ মাধ্যমিক সার্টিফিকেট",
        link: "/hsc",
      },
      {
        name: "বিশ্ববিদ্যালয়",
        link: "/university",
      },
    ],
  },
  {
    name: "শিক্ষকবৃন্দ ",
    link: "/teachers",
    icon: LiaIdCardSolid,
  },
  {
    name: "বই সমূহ",
    link: "/books",
    submenu: [
      {
        name: "একাডেমিক বই",
        link: "/shop/academic-books",
      },
      {
        name: "নন-একাডেমিক বই",
        link: "/shop/non-academic-books",
      },
      {
        name: "সাহিত্য",
        link: "/shop/literature",
      },
      {
        name: "বিজ্ঞান",
        link: "/shop/science",
      },
      {
        name: "ইতিহাস",
        link: "/shop/history",
      },
      {
        name: "ধর্ম",
        link: "/shop/religion",
      },
    ],
  },
  {
    name: "কোর্স সমূহ",
    link: "/courses",
  },
  {
    name: "যোগাযোগ",
    link: "/contact",
  },
];
