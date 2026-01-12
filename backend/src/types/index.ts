export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationToken {
  id: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  userId: string;
}

export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  LOGIN_VERIFICATION = 'LOGIN_VERIFICATION',
}

// Request DTOs
export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyLoginRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
  type: TokenType;
}

// Response DTOs
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: Omit<User, 'password'>;
    token?: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
}

// Express Request Extension
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
