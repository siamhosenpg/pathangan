import type { Metadata } from "next";
import { Baloo_Da_2, Inter } from "next/font/google";
import "./globals.css";

import ReduxProvider from "@/components/layout/ReduxProvider";
import AuthInitializer from "@/components/ui/AuthInitializer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const baloo = Baloo_Da_2({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pathangan.com"),

  title: {
    default: "পাঠাঙ্গান | Pathangan",
    template: "%s | পাঠাঙ্গান",
  },

  description:
    "পাঠাঙ্গান (Pathangan) হলো একটি আধুনিক বাংলা Knowledge Media, Course Marketplace ও Learning Platform যেখানে কোর্স, লাইভ ক্লাস, শিক্ষক নিয়োগ, স্কিল ডেভেলপমেন্ট এবং কমিউনিটি লার্নিং একসাথে পাওয়া যায়।",

  keywords: [
    "পাঠাঙ্গান",
    "Pathangan",
    "বাংলা লার্নিং প্ল্যাটফর্ম",
    "বাংলা কোর্স",
    "online course",
    "course marketplace",
    "live class",
    "teacher hiring",
    "knowledge media",
    "বাংলাদেশি ই-লার্নিং",
    "skill development",
    "education platform",
    "programming course",
    "freelancing course",
    "বাংলা শিক্ষা প্ল্যাটফর্ম",
  ],

  authors: [{ name: "Pathangan Team" }],
  creator: "Pathangan",
  publisher: "Pathangan",

  applicationName: "Pathangan",

  category: "education",

  openGraph: {
    title: "পাঠাঙ্গান | Pathangan",
    description:
      "বাংলার আধুনিক Knowledge Media ও Course Marketplace — কোর্স, লাইভ ক্লাস, শিক্ষক এবং স্কিল ডেভেলপমেন্ট এক প্ল্যাটফর্মে।",
    url: "https://pathangan.com",
    siteName: "Pathangan",
    locale: "bn_BD",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Pathangan - Knowledge Media & Course Marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "পাঠাঙ্গান | Pathangan",
    description:
      "বাংলার আধুনিক Knowledge Media ও Course Marketplace প্ল্যাটফর্ম।",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/image/logo/pathangan.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${baloo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <ReduxProvider>
          <AuthInitializer />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
