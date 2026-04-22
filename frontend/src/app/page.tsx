import LeftNav from "@/components/layout/navigation/LeftNav";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import Profilecard from "@/components/ui/profilecard/Profilecard";
import ProfileNavcard from "@/components/ui/profilecard/ProfileNavcard";
import Image from "next/image";

export default function Home() {
  return (
    <main className=" w-full  ">
      <div className="flex gap-6 ">
        {/* Main Content */}
        <div className="flex-1 w-[44%]  flex gap-4 flex-col pb-18 ">
          <Postcard />
          <CourseCardFeed />
          <QuestionCard />
        </div>

        {/* Right Sidebar */}
        <nav className="w-[40%] shrink-0 hidden xl:block    sticky  top-22.5  h-[calc(100vh-90px)] rounded-t-lg  ">
          <div className="  overflow-y-hidden hover:overflow-y-scroll ScrollSystem w-full h-full  ">
            <div className="bg-background rounded-xl p-4 flex flex-col gap-1.5">
              <Profilecard />
              <Profilecard />
              <Profilecard />
              <Profilecard />
              <Profilecard />
              <Profilecard />
            </div>
          </div>
        </nav>
      </div>
    </main>
  );
}
