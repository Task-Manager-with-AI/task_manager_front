export interface User {
  id: string
  name: string
  email: string
  roleId: number
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  role?: { name: string }
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  name: string
  email: string
  password: string
}

export interface VerifyEmailDto {
  email: string
  code: string
}

export interface ResendVerificationDto {
  email: string
}

export interface GoogleAuthDto {
  credential: string
}
