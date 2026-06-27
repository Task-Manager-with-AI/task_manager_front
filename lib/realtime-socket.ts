import { io, type Socket } from "socket.io-client"
import { fetchRealtimeToken } from "@/lib/realtime-auth"

export function getRealtimeSocketUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/v1\/?$/, "")
}

// Singleton socket — all hooks share one connection per page load.
// This prevents the "WebSocket closed before connection established" error that
// occurs when useSignaling unmounts/remounts and tries to open a new WS while
// the previous one is still in the closing handshake.
let _socket: Socket | null = null
let _connecting: Promise<Socket> | null = null

export async function connectRealtimeSocket(): Promise<Socket> {
  // Return existing connected socket immediately
  if (_socket?.connected) return _socket

  // Dedup concurrent calls (e.g. StrictMode double-mount)
  if (_connecting) return _connecting

  _connecting = (async () => {
    // If there's a stale socket, disconnect it cleanly before creating a new one
    if (_socket) {
      _socket.disconnect()
      _socket = null
    }

    const token = await fetchRealtimeToken()
    const url = getRealtimeSocketUrl()
    const options = {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"] as ("websocket" | "polling")[],
      auth: { token },
      // Don't let Socket.IO auto-reconnect — we manage the lifecycle
      reconnection: false,
    }

    _socket = url ? io(url, options) : io(options)
    return _socket
  })().finally(() => {
    _connecting = null
  })

  return _connecting
}

export function disconnectRealtimeSocket(): void {
  _socket?.disconnect()
  _socket = null
  _connecting = null
}
