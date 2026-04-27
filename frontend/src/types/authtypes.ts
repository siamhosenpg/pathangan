export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  profileImage?: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  message: string;
}

export interface GetMeResponse {
  user: AuthUser;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
