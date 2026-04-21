type SubMenuItem = {
  name: string;
  link: string;
};

type NavItem = {
  name: string;
  link: string;
  submenu?: SubMenuItem[];
};

export const navigationdata = [
  {
    name: "কমিউনিটি",
    link: "/",
  },
  {
    name: "ঘোষণাপত্র",
    link: "/about",
  },
  {
    name: "প্রশ্নসমূহ",
    link: "/questions",
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
    name: "শিক্ষকবৃন্দ",
    link: "/teachers",
  },

  {
    name: "কোর্স সমূহ",
    link: "/courses",
  },
  {
    name: "যোগাযোগ",
    link: "/contact",
  },
  {
    name: "আমাদের সম্পর্কে",
    link: "/about",
  },
] as const satisfies readonly NavItem[];
