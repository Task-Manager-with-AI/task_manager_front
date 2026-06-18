import { io, type Socket } from "socket.io-client"
import { fetchRealtimeToken } from "@/lib/realtime-auth"

export function getRealtimeSocketUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/v1\/?$/, "")
}

export async function connectRealtimeSocket(): Promise<Socket> {
  const token = await fetchRealtimeToken()
  const url = getRealtimeSocketUrl()
  const options = {
    path: "/socket.io",
    withCredentials: true,
    transports: ["websocket", "polling"] as ("websocket" | "polling")[],
    auth: { token },
  }

  return url ? io(url, options) : io(options)
}
