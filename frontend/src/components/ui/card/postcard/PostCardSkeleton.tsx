"use client";

const PostCardSkeleton = () => {
  return (
    <div className=" w-full bg-background pt-6 rounded-xl pb-6">
      {/* top profile section */}
      <div className="px-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* profile image */}
          <div className="w-12 h-12 rounded-full bg-background-secondary shrink-0" />

          {/* name + time */}
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-background-secondary" />
            <div className="h-3 w-20 rounded bg-background-secondary" />
          </div>
        </div>

        {/* three dot */}
        <div className="h-8 w-8 rounded-full bg-background-secondary" />
      </div>

      {/* title */}
      <div className="px-6 mt-2">
        <div className="h-5 w-2/3 rounded bg-background-secondary" />
      </div>

      {/* text */}
      <div className="px-6 mt-4 space-y-2">
        <div className="h-4 w-full rounded bg-background-secondary" />
        <div className="h-4 w-full rounded bg-background-secondary" />
        <div className="h-4 w-3/4 rounded bg-background-secondary" />
      </div>

      {/* image */}
      <div className="mt-5 px-6">
        <div className="w-full h-80 bg-background-secondary  rounded-xl" />
      </div>
    </div>
  );
};

export default PostCardSkeleton;
