import { apiClient } from "@/lib/api-client"

/** JWT for realtime channels when the WebSocket host differs from the REST origin. */
export async function fetchRealtimeToken(): Promise<string> {
  const data = await apiClient.get<{ token: string }>("/auth/realtime-token")
  return data.token
}
