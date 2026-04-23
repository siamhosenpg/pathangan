"use client";
import Profilecard from "@/components/ui/profilecard/Profilecard";
import { useGetSuggestedUsersQuery } from "@/redux/api/userApi";

const SuggenstedUser = () => {
  const { data, isLoading, isError } = useGetSuggestedUsersQuery();
  return (
    <div className="bg-background rounded-xl p-4 flex flex-col gap-1.5">
      {isLoading &&
        Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="p-2 pr-3 w-full flex items-center justify-between bg-background rounded-xl animate-pulse"
            >
              <div className="flex items-center gap-2.5 w-4/6">
                <div className="w-13 h-13 rounded-full bg-background-tertiary" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-background-tertiary rounded" />
                  <div className="h-3 w-32 bg-background-tertiary rounded" />
                </div>
              </div>
              <div className="w-20 h-8 bg-background-tertiary rounded-lg shrink-0" />
            </div>
          ))}
      {data?.users.map((user) => (
        <Profilecard user={user} />
      ))}
    </div>
  );
};

export default SuggenstedUser;
