import { apiClient } from "@/lib/api-client"
import type { User, LoginDto, RegisterDto, VerifyEmailDto, ResendVerificationDto, GoogleAuthDto } from "./auth.types"

export const authApi = {
  login: (dto: LoginDto) => apiClient.post<User>("/auth/login", dto),
  register: (dto: RegisterDto) => apiClient.post<User>("/auth/register", dto),
  verifyEmail: (dto: VerifyEmailDto) => apiClient.post<User>("/auth/verify-email", dto),
  resendVerification: (dto: ResendVerificationDto) => apiClient.post<null>("/auth/resend-verification", dto),
  googleAuth: (dto: GoogleAuthDto) => apiClient.post<User>("/auth/google", dto),
  logout: () => apiClient.post<null>("/auth/logout"),
  me: () => apiClient.get<User>("/auth/me"),
}
