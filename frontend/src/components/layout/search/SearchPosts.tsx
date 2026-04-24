import Postcard from "@/components/ui/card/postcard/Postcard";
import CourseCardFeed from "@/components/ui/card/course/CourseCardFeed";
import QuestionCard from "@/components/ui/card/questioncard/QuestionCard";
import type { Post } from "@/types/postTypes";

interface Props {
  posts: Post[];
}

export default function SearchPosts({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-10 text-text-secondary text-sm">
        কোনো পোস্ট পাওয়া যায়নি
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {posts.map((post) => {
        if (!post) return null;
        if (post.postType === "question")
          return <QuestionCard key={post._id} post={post} />;
        if (post.postType === "course")
          return <CourseCardFeed key={post._id} post={post} />;
        return <Postcard key={post._id} post={post} />;
      })}
    </div>
  );
}
