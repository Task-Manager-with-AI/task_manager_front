"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSignaling, RemoteParticipant } from "./useSignaling"

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

export const MEDIA_ERROR = {
  INSECURE_CONTEXT: "INSECURE_CONTEXT",
  UNAVAILABLE: "MEDIA_DEVICES_UNAVAILABLE",
} as const

function getMediaAccessError(): string | null {
  if (typeof window === "undefined") return null
  if (!window.isSecureContext) return MEDIA_ERROR.INSECURE_CONTEXT
  if (!navigator.mediaDevices?.getUserMedia) return MEDIA_ERROR.UNAVAILABLE
  return null
}

export interface RemoteStream {
  userId: string
  name: string
  stream: MediaStream
}

interface UseWebRTCOptions {
  meetingId: string
  enabled: boolean
  audioEnabled: boolean
  videoEnabled: boolean
  onMinutesReady?: (payload: { meetingId: string; minuteId: string }) => void
  onProcessingStarted?: () => void
  onProcessingFailed?: (payload: { message: string }) => void
}

export function useWebRTC({
  meetingId,
  enabled,
  audioEnabled,
  videoEnabled,
  onMinutesReady,
  onProcessingStarted,
  onProcessingFailed,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, RemoteStream>>({})
  const [error, setError] = useState<string | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const participantsRef = useRef<Record<string, RemoteParticipant>>({})
  const signalingRef = useRef<ReturnType<typeof useSignaling> | null>(null)

  // Get local media on mount
  useEffect(() => {
    if (!enabled) return

    const accessError = getMediaAccessError()
    if (accessError) {
      setError(accessError)
      return
    }

    let cancelled = false
    let acquiredStream: MediaStream | null = null

    navigator.mediaDevices!
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        acquiredStream = stream
        setLocalStream(stream)
      })
      .catch((err) => {
        setError(err.message || "Could not access camera/microphone")
      })

    return () => {
      cancelled = true
      acquiredStream?.getTracks().forEach((t) => t.stop())
    }
  }, [enabled])

  // Toggle local track enabled flags when controls change
  useEffect(() => {
    if (!localStream) return
    localStream.getAudioTracks().forEach((t) => (t.enabled = audioEnabled))
    localStream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled))
  }, [audioEnabled, videoEnabled, localStream])

  const createPeer = useCallback(
    (participant: RemoteParticipant): RTCPeerConnection => {
      const pc = new RTCPeerConnection(RTC_CONFIG)

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream)
        })
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signalingRef.current?.sendIceCandidate(
            participant.userId,
            event.candidate.toJSON()
          )
        }
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (!remoteStream) return
        setRemoteStreams((prev) => ({
          ...prev,
          [participant.userId]: {
            userId: participant.userId,
            name: participant.name,
            stream: remoteStream,
          },
        }))
      }

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        ) {
          setRemoteStreams((prev) => {
            const next = { ...prev }
            delete next[participant.userId]
            return next
          })
        }
      }

      peersRef.current[participant.userId] = pc
      participantsRef.current[participant.userId] = participant
      return pc
    },
    [localStream]
  )

  const closePeer = useCallback((userId: string) => {
    const pc = peersRef.current[userId]
    if (pc) {
      pc.close()
      delete peersRef.current[userId]
    }
    delete participantsRef.current[userId]
    setRemoteStreams((prev) => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
  }, [])

  const signaling = useSignaling({
    meetingId,
    enabled: enabled && Boolean(localStream),
    onRoomState: async (participants) => {
      // For each existing participant, create a peer and send an offer
      for (const participant of participants) {
        const pc = createPeer(participant)
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          signalingRef.current?.sendOffer(participant.userId, offer)
        } catch (err) {
          console.error("Failed to create offer", err)
        }
      }
    },
    onParticipantJoined: (participant) => {
      // Just register; the newcomer is responsible for sending the offer
      participantsRef.current[participant.userId] = participant
    },
    onParticipantLeft: (userId) => closePeer(userId),
    onOffer: async ({ fromUserId, sdp }) => {
      const participant =
        participantsRef.current[fromUserId] ?? {
          userId: fromUserId,
          socketId: "",
          name: "Participant",
        }
      const pc = peersRef.current[fromUserId] ?? createPeer(participant)
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        signalingRef.current?.sendAnswer(fromUserId, answer)
      } catch (err) {
        console.error("Failed to answer offer", err)
      }
    },
    onAnswer: async ({ fromUserId, sdp }) => {
      const pc = peersRef.current[fromUserId]
      if (!pc) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      } catch (err) {
        console.error("Failed to set remote answer", err)
      }
    },
    onIceCandidate: async ({ fromUserId, candidate }) => {
      const pc = peersRef.current[fromUserId]
      if (!pc) return
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error("Failed to add ICE candidate", err)
      }
    },
    onMinutesReady,
    onProcessingStarted,
    onProcessingFailed,
  })
  signalingRef.current = signaling

  // Cleanup all peer connections on unmount or disable
  useEffect(() => {
    return () => {
      Object.values(peersRef.current).forEach((pc) => pc.close())
      peersRef.current = {}
      participantsRef.current = {}
    }
  }, [])

  return {
    localStream,
    remoteStreams: Object.values(remoteStreams),
    connected: signaling.connected,
    error: error ?? signaling.error,
  }
}
