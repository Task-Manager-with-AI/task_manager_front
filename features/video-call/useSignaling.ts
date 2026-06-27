"use client"

import { useEffect, useRef, useState } from "react"
import type { Socket } from "socket.io-client"
import { connectRealtimeSocket } from "@/lib/realtime-socket"

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
  // Always up-to-date reference so event handlers never go stale
  const optsRef = useRef(options)
  optsRef.current = options

  useEffect(() => {
    if (!options.enabled || !options.meetingId) return

    let active = true

    // Named handler refs so we can remove exactly these listeners on cleanup,
    // without accidentally removing other hooks' listeners on the shared socket.
    const onConnect = () => {
      if (!active) return
      setConnected(true)
      setError(null)
      socketRef.current?.emit("meeting:join", { meetingId: optsRef.current.meetingId })
    }

    const onDisconnect = () => {
      if (active) setConnected(false)
    }

    const onConnectError = (err: Error) => {
      if (active) setError(err.message || "Connection error")
    }

    const onMeetingError = (payload: { message: string }) => {
      if (active) setError(payload.message)
    }

    const onRoomState = (payload: { participants: RemoteParticipant[] }) => {
      if (active) optsRef.current.onRoomState?.(payload.participants)
    }

    const onParticipantJoined = (payload: RemoteParticipant) => {
      if (active) optsRef.current.onParticipantJoined?.(payload)
    }

    const onParticipantLeft = (payload: { userId: string }) => {
      if (active) optsRef.current.onParticipantLeft?.(payload.userId)
    }

    const onOffer = (payload: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (active) optsRef.current.onOffer?.(payload)
    }

    const onAnswer = (payload: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (active) optsRef.current.onAnswer?.(payload)
    }

    const onIceCandidate = (payload: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (active) optsRef.current.onIceCandidate?.(payload)
    }

    const onProcessingStarted = () => {
      if (active) optsRef.current.onProcessingStarted?.()
    }

    const onMinutesReady = (payload: { meetingId: string; minuteId: string }) => {
      if (active) optsRef.current.onMinutesReady?.(payload)
    }

    const onProcessingFailed = (payload: { message: string }) => {
      if (active) optsRef.current.onProcessingFailed?.(payload)
    }

    connectRealtimeSocket()
      .then((socket) => {
        if (!active) return
        socketRef.current = socket

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("connect_error", onConnectError)
        socket.on("meeting:error", onMeetingError)
        socket.on("meeting:room-state", onRoomState)
        socket.on("meeting:participant-joined", onParticipantJoined)
        socket.on("meeting:participant-left", onParticipantLeft)
        socket.on("webrtc:offer", onOffer)
        socket.on("webrtc:answer", onAnswer)
        socket.on("webrtc:ice-candidate", onIceCandidate)
        socket.on("meeting:processing-started", onProcessingStarted)
        socket.on("meeting:minutes-ready", onMinutesReady)
        socket.on("meeting:processing-failed", onProcessingFailed)

        // If already connected when we attach, join the room right away
        if (socket.connected) {
          setConnected(true)
          setError(null)
          socket.emit("meeting:join", { meetingId: optsRef.current.meetingId })
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Connection error")
      })

    return () => {
      active = false

      const socket = socketRef.current
      if (socket) {
        // Leave this meeting room; keep the shared socket open for other uses (chat)
        socket.emit("meeting:leave", { meetingId: optsRef.current.meetingId })

        // Remove only the handlers we registered — not all listeners on these events
        socket.off("connect", onConnect)
        socket.off("disconnect", onDisconnect)
        socket.off("connect_error", onConnectError)
        socket.off("meeting:error", onMeetingError)
        socket.off("meeting:room-state", onRoomState)
        socket.off("meeting:participant-joined", onParticipantJoined)
        socket.off("meeting:participant-left", onParticipantLeft)
        socket.off("webrtc:offer", onOffer)
        socket.off("webrtc:answer", onAnswer)
        socket.off("webrtc:ice-candidate", onIceCandidate)
        socket.off("meeting:processing-started", onProcessingStarted)
        socket.off("meeting:minutes-ready", onMinutesReady)
        socket.off("meeting:processing-failed", onProcessingFailed)
      }

      socketRef.current = null
      setConnected(false)
    }
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
