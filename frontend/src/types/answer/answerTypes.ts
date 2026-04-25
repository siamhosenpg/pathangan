export interface AnswerUser {
  _id: string;
  name: string;
  username: string;
  profileImage: string;
  badges: string[];
}

export interface Answer {
  _id: string;
  questionId: string;
  userId: AnswerUser;
  text: string;
  upvotesCount: number;
  downvotesCount: number;
  isBestAnswer: boolean;
  createdAt: string;
}

export interface GetAnswersResponse {
  success: boolean;
  answers: Answer[];
  totalCount: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface GetAnswerCountResponse {
  success: boolean;
  count: number;
}

export interface CreateAnswerResponse {
  success: boolean;
  message: string;
  answer: Answer;
}

export interface VoteAnswerResponse {
  success: boolean;
  upvotesCount: number;
  downvotesCount: number;
}

export interface GetAnswersQueryParams {
  questionId: string;
  limit?: number;
  cursor?: string;
}

export interface CreateAnswerPayload {
  questionId: string;
  text: string;
}

export interface VoteAnswerPayload {
  answerId: string;
  voteType: "upvote" | "downvote";
  questionId: string;
}
