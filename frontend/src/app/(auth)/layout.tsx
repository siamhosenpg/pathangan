import { Baloo_Da_2, Inter } from "next/font/google";
import "../globals.css";
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

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className={` ${baloo.variable} ${inter.variable} h-full antialiased`}>
      {children}
    </main>
  );
}
