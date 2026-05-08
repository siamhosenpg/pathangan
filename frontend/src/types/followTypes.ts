export interface FollowUser {
  _id: string;
  name: string;
  username?: string;
  profileImage?: string;
  profilePicture?: string;
  bio?: string;
}

export interface FollowRecord {
  _id: string;
  followerId: string | FollowUser;
  followingId: string | FollowUser;
  createdAt: string;
  updatedAt: string;
}

export interface FollowListResponse {
  success: boolean;
  count: number;
  followers: FollowRecord[];
}

export interface FollowingListResponse {
  success: boolean;
  count: number;
  following: FollowRecord[];
}

export interface FollowResponse {
  success: boolean;
  message: string;
  follow: FollowRecord;
}

export interface UnfollowResponse {
  success: boolean;
  message: string;
}

export interface FollowersCountResponse {
  success: boolean;
  followersCount: number;
}

export interface FollowingCountResponse {
  success: boolean;
  followingCount: number;
}

export interface FollowErrorResponse {
  message: string;
}
