import { apiClient } from "@/lib/api-client"
import type { ContactPayload } from "./support.types"

export const supportApi = {
  contact: (payload: ContactPayload) =>
    apiClient.post<null>("/support/contact", payload),
}
