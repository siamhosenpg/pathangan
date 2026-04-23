import ProfileAbout from "@/components/layout/profilepage/ProfileAbout";
import ProfileTopSection from "@/components/layout/profilepage/ProfileTopSection";
import CourseCard from "@/components/ui/card/course/CourseCard";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import Postcard from "@/components/ui/card/postcard/Postcard";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import { getUserByUsername } from "@/lib/userApi";
import { notFound } from "next/navigation";

type Props = {
  params: {
    username: string;
  };
};
const page = async ({ params }: Props) => {
  const { username } = await params;

  let user;

  try {
    user = await getUserByUsername(username);
  } catch (error) {
    return notFound(); // ✅ যদি API fail করে
  }

  if (!user) {
    return notFound(); // ✅ যদি user না থাকে
  }
  return (
    <div className="w-full flex gap-6">
      <div className="grid grid-cols-1 gap-4 w-7/12 pb-12">
        <ProfileTopSection data={user} />

        <ProfileAbout educations={user.educations} work={user.work} />
        <Postcard />
        <CourseCardFeed />
        <QuestionCard />
      </div>
      <div className="p-4 bg-background w-5/12 rounded-xl h-fit flex flex-col gap-4">
        <CourseCard />
        <CourseCard />
        <CourseCard />
      </div>
    </div>
  );
};

export default page;
