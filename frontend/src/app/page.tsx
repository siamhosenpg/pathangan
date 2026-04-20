import Postcard from "@/components/ui/card/postcard/Postcard";
import Image from "next/image";

export default function Home() {
  return (
    <main className="bg-background-secondary ">
      <div className="flex Pagearea  min-h-screen gap-6 xl:gap-6 2xl:gap-6 ">
        {/* Left Sidebar */}
        <nav className=" w-[40%] xl:w-[27%] hidden lg:block  sticky top-22.5  h-[calc(100vh-90px)] rounded-t-lg  ">
          <div className="w-full  overflow-y-hidden hover:overflow-y-scroll h-full  ScrollSystem  ">
            fgsg
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-[44%] mt-2 md:mt-4  ">
          <Postcard />
        </div>

        {/* Right Sidebar */}
        <nav className="w-[27%]  hidden xl:block    sticky  top-22.5  h-[calc(100vh-90px)] rounded-t-lg  ">
          <div className="  overflow-y-hidden hover:overflow-y-scroll ScrollSystem w-full h-full  ">
            adfd
          </div>
        </nav>
      </div>
    </main>
  );
}
