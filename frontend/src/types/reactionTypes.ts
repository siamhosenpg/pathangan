// 🔹 Single Reaction (Like)
export interface IReaction {
  _id: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  postId: string;
  createdAt: string;
  updatedAt: string;
}

// 🔹 Toggle Response
export interface IToggleReactionResponse {
  message: string;
  liked: boolean;
  reaction?: IReaction;
}

// 🔹 Get Reactions (List)
export interface IGetReactionsResponse {
  count: number;
  reactions: IReaction[];
}

// 🔹 Count Response
export interface IReactionCountResponse {
  success: boolean;
  postId: string;
  count: number;
}
export interface ICheckUserLikedResponse {
  liked: boolean;
}
