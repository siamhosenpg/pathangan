// ===================== USER (populated) =====================
export interface PostUser {
  _id: string;
  name: string;
  username: string;
  profileImage?: string;
  badges?: string[];
  gender?: string;
  bio?: string;
}

// ===================== NORMAL POST CONTENT =====================
export interface PostContent {
  parentPost?: Post | null;
  title?: string;
  text?: string; // ← caption এর বদলে
  media?: string[];
  type?: "image" | "video" | "text" | "share" | "audio";
  location?: string;
  tags?: string[];
  mentions?: string[];
}

// ===================== QUESTION POST =====================
export interface QuestionPost {
  questionText: string;
  tags?: string[];
}

// ===================== COURSE MEDIA =====================
export interface CourseMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  duration?: string;
}

// ===================== COURSE POST =====================
export interface CoursePost {
  title: string;
  description?: string;
  media?: CourseMedia[];
  price?: number;
  tags?: string[];
}

// ===================== MAIN POST =====================
export interface Post {
  _id: string;
  userid: PostUser;
  postType: "post" | "question" | "course";
  content?: PostContent;
  question?: QuestionPost;
  course?: CoursePost;
  privacy: "public" | "friends" | "private";
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
}

// ===================== REQUEST TYPES =====================
export interface CreatePostRequest {
  formData: FormData;
}

export interface CreateQuestionPostRequest {
  questionText: string;
  tags?: string[];
  privacy?: string;
}

export interface CreateSharePostRequest {
  parentPost: string;
  caption?: string;
  privacy?: string;
}

export interface UpdatePostRequest {
  id: string;
  body: Partial<{
    content: Partial<PostContent>;
    question: Partial<QuestionPost>;
    course: Partial<CoursePost>;
    privacy: string;
  }>;
}

// ===================== RESPONSE TYPES =====================
export interface GetPostsResponse {
  posts: Post[];
  nextCursor: string | null;
}

export interface GetPostsByUserIdResponse {
  posts: Post[];
  count: number;
  nextCursor: string | null;
}

export interface PostResponse {
  success: boolean;
  post: Post;
}

export interface PostCountResponse {
  userid: string;
  count: number;
}

export interface DeletePostResponse {
  message: string;
}
