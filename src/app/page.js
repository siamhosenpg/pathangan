import About from "@/components/sections/about/About";
import Footer from "@/components/sections/footer/Footer";
import Header from "@/components/sections/header/Header";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Header />
      <About />
      <Footer />
    </div>
  );
}
