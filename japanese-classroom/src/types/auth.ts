export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  roomId: string;
}
