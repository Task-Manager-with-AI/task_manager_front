"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/api\/v1\/?$/,
  ""
)

export interface RemoteParticipant {
  userId: string
  socketId: string
  name: string
}

interface UseSignalingOptions {
  meetingId: string
  enabled: boolean
  onRoomState?: (participants: RemoteParticipant[]) => void
  onParticipantJoined?: (participant: RemoteParticipant) => void
  onParticipantLeft?: (userId: string) => void
  onOffer?: (payload: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => void
  onAnswer?: (payload: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => void
  onIceCandidate?: (payload: {
    fromUserId: string
    candidate: RTCIceCandidateInit
  }) => void
  onMinutesReady?: (payload: { meetingId: string; minuteId: string }) => void
  onProcessingStarted?: () => void
  onProcessingFailed?: (payload: { message: string }) => void
}

export function useSignaling(options: UseSignalingOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const optsRef = useRef(options)
  optsRef.current = options

  useEffect(() => {
    if (!options.enabled || !options.meetingId) return

    const socket = io(SOCKET_URL || undefined, {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    })
    socketRef.current = socket

    socket.on("connect", () => {
      setConnected(true)
      setError(null)
      socket.emit("meeting:join", { meetingId: options.meetingId })
    })

    socket.on("disconnect", () => setConnected(false))

    socket.on("connect_error", (err) => {
      setError(err.message || "Connection error")
    })

    socket.on("meeting:error", (payload: { message: string }) => {
      setError(payload.message)
    })

    socket.on("meeting:room-state", (payload: { participants: RemoteParticipant[] }) => {
      optsRef.current.onRoomState?.(payload.participants)
    })

    socket.on("meeting:participant-joined", (payload: RemoteParticipant) => {
      optsRef.current.onParticipantJoined?.(payload)
    })

    socket.on("meeting:participant-left", (payload: { userId: string }) => {
      optsRef.current.onParticipantLeft?.(payload.userId)
    })

    socket.on("webrtc:offer", (payload) => optsRef.current.onOffer?.(payload))
    socket.on("webrtc:answer", (payload) => optsRef.current.onAnswer?.(payload))
    socket.on("webrtc:ice-candidate", (payload) =>
      optsRef.current.onIceCandidate?.(payload)
    )

    socket.on("meeting:processing-started", () =>
      optsRef.current.onProcessingStarted?.()
    )
    socket.on("meeting:minutes-ready", (payload) =>
      optsRef.current.onMinutesReady?.(payload)
    )
    socket.on("meeting:processing-failed", (payload) =>
      optsRef.current.onProcessingFailed?.(payload)
    )

    return () => {
      socket.emit("meeting:leave", { meetingId: options.meetingId })
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.enabled, options.meetingId])

  const sendOffer = (targetUserId: string, sdp: RTCSessionDescriptionInit) => {
    socketRef.current?.emit("webrtc:offer", {
      meetingId: options.meetingId,
      targetUserId,
      sdp,
    })
  }

  const sendAnswer = (targetUserId: string, sdp: RTCSessionDescriptionInit) => {
    socketRef.current?.emit("webrtc:answer", {
      meetingId: options.meetingId,
      targetUserId,
      sdp,
    })
  }

  const sendIceCandidate = (targetUserId: string, candidate: RTCIceCandidateInit) => {
    socketRef.current?.emit("webrtc:ice-candidate", {
      meetingId: options.meetingId,
      targetUserId,
      candidate,
    })
  }

  return { connected, error, sendOffer, sendAnswer, sendIceCandidate }
}
