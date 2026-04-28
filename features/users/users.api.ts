import { apiClient } from "@/lib/api-client"
import type { User } from "./users.types"

export const usersApi = {
  list: () => apiClient.get<User[]>("/users"),
}
