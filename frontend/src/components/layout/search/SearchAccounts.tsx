import Image from "next/image";
import Link from "next/link";

import type { SearchUser } from "@/redux/api/others/searchApi";

interface Props {
  users: SearchUser[];
}

export default function SearchAccounts({ users }: Props) {
  if (users.length === 0) {
    return (
      <div className="text-center py-6 text-text-secondary text-sm">
        কোনো অ্যাকাউন্ট পাওয়া যায়নি
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text-secondary mb-2">
        অ্যাকাউন্ট
      </h3>
      {users.map((user) => (
        <Link
          key={user._id}
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-background-secondary transition-colors"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-background-secondary flex-shrink-0 flex items-center justify-center">
            {user.profileImage ? (
              <Image
                src={user.profileImage}
                alt={user.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-text-secondary">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-text-primary truncate">
              {user.name}
            </span>
            <span className="text-xs text-text-secondary truncate">
              @{user.username}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
