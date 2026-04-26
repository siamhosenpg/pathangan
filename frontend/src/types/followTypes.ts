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

export interface FollowResponse {
  success: boolean;
  message: string;
  follow: FollowRecord;
}

export interface UnfollowResponse {
  message: string;
}

export interface FollowersCountResponse {
  followersCount: number;
}

export interface FollowingCountResponse {
  followingCount: number;
}

export interface FollowErrorResponse {
  message: string;
}
