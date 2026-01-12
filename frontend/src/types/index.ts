export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: User;
    token?: string;
    userId?: string;
  };
  errors?: Record<string, string[]>;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyData {
  email: string;
  code: string;
}

export interface ResendCodeData {
  email: string;
  type: 'EMAIL_VERIFICATION' | 'LOGIN_VERIFICATION';
}
