import SuggenstedUser from "@/components/layout/suggesteduser/SuggenstedUser";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";

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
            <SuggenstedUser />
          </div>
        </nav>
      </div>
    </main>
  );
}
