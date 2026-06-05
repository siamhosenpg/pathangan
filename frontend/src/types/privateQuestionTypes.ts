export type QuestionStatus = "pending" | "answered" | "ignored";

export interface PrivateQuestionUser {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
}

export interface PrivateQuestion {
  _id: string;
  senderId: PrivateQuestionUser;
  receiverId: PrivateQuestionUser;
  questionText: string;
  status: QuestionStatus;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===================== REQUEST TYPES =====================
export interface SendPrivateQuestionRequest {
  receiverId: string;
  questionText: string;
}

export interface UpdateQuestionStatusRequest {
  id: string;
  status: Extract<QuestionStatus, "answered" | "ignored">;
}

export interface GetQuestionsParams {
  limit?: number;
  cursor?: string;
  status?: QuestionStatus; // inbox filter এর জন্য
}

// ===================== RESPONSE TYPES =====================
export interface PrivateQuestionListResponse {
  success: boolean;
  questions: PrivateQuestion[];
  nextCursor: string | null;
}

export interface PrivateQuestionSingleResponse {
  success: boolean;
  question: PrivateQuestion;
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

export interface DeleteQuestionResponse {
  success: boolean;
  message: string;
}

export interface UpdateStatusResponse {
  success: boolean;
  question: PrivateQuestion;
}
