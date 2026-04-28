import { apiClient } from "@/lib/api-client"
import type { User, LoginDto, RegisterDto } from "./auth.types"

export const authApi = {
  login: (dto: LoginDto) => apiClient.post<User>("/auth/login", dto),
  register: (dto: RegisterDto) => apiClient.post<User>("/auth/register", dto),
  logout: () => apiClient.post<null>("/auth/logout"),
  me: () => apiClient.get<User>("/auth/me"),
}
