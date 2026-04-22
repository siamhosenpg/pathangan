export interface User {
  _id: string;
  userid: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  aboutText?: string;
  gender?: string;
  work?: string;
  location?: string;
  educations?: string[];
  profileImage?: string;
  coverImage?: string;
  role?: string;
  status?: string;
  createdAt?: string;
}

export interface GetUsersResponse {
  users: User[];
}

export interface GetUserResponse {
  user: User;
}

export interface UpdateUserRequest {
  userid: number;
  formData: FormData; // image upload er jonno FormData
}

export interface SuggestedUsersResponse {
  count: number;
  users: User[];
}
