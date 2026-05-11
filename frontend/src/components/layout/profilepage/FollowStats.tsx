"use client";

import type { ActivityStats } from "@/types/usertypes";

interface Props {
  activityStats?: ActivityStats;
}

const FollowStats = ({ activityStats }: Props) => {
  return (
    <div className="flex items-center gap-2 lg:gap-6 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-foreground">
          {activityStats?.totalFollowers ?? 0}
        </span>
        <span className="text-sm text-muted-foreground">অনুসরণকারী</span>
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-foreground">
          {activityStats?.totalFollowing ?? 0}
        </span>
        <span className="text-sm text-muted-foreground">অনুসরণ করছি</span>
      </div>
    </div>
  );
};

export default FollowStats;
