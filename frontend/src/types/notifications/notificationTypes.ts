export interface NotificationActor {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
  greenmarkVerified?: boolean;
  gender?: string;
}

export interface NotificationTarget {
  postId?: string | null;
  commentId?: string | null;
}

export interface Notification {
  _id: string;
  userId: string;
  type: "like" | "comment" | "follow" | "share";
  actorId: NotificationActor;
  target: NotificationTarget;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
}
