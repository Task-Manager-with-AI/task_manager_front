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

export interface DeviceState {
  hasAudio: boolean
  hasVideo: boolean
  mediaWarning: string | null
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

// Try to acquire media with graceful fallback: both → audio-only → video-only → none
async function acquireMedia(): Promise<{ stream: MediaStream | null; deviceState: DeviceState }> {
  const api = navigator.mediaDevices

  // 1. Both devices
  try {
    const stream = await api.getUserMedia({ audio: true, video: true })
    return { stream, deviceState: { hasAudio: true, hasVideo: true, mediaWarning: null } }
  } catch {}

  // 2. Audio only (camera busy or unavailable)
  try {
    const stream = await api.getUserMedia({ audio: true, video: false })
    return {
      stream,
      deviceState: {
        hasAudio: true,
        hasVideo: false,
        mediaWarning: "Cámara no disponible. Entrando con solo audio.",
      },
    }
  } catch {}

  // 3. Video only (mic busy or unavailable)
  try {
    const stream = await api.getUserMedia({ audio: false, video: true })
    return {
      stream,
      deviceState: {
        hasAudio: false,
        hasVideo: true,
        mediaWarning: "Micrófono no disponible. Entrando con solo video.",
      },
    }
  } catch {}

  // 4. No media — join as listener
  return {
    stream: null,
    deviceState: {
      hasAudio: false,
      hasVideo: false,
      mediaWarning: "Cámara y micrófono no disponibles. Entrando como oyente.",
    },
  }
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
  const [criticalError, setCriticalError] = useState<string | null>(null)
  const [deviceState, setDeviceState] = useState<DeviceState>({
    hasAudio: false,
    hasVideo: false,
    mediaWarning: null,
  })
  // Gate signaling on media acquisition completing (any outcome).
  // This prevents the race where meeting:room-state fires before localStream is set,
  // causing the WebRTC offer to contain no tracks and resulting in a silent/black call.
  const [mediaAcquired, setMediaAcquired] = useState(false)

  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const participantsRef = useRef<Record<string, RemoteParticipant>>({})
  const signalingRef = useRef<ReturnType<typeof useSignaling> | null>(null)

  // Acquire local media with graceful fallback, then signal readiness
  useEffect(() => {
    if (!enabled) return

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCriticalError(MEDIA_ERROR.INSECURE_CONTEXT)
      setMediaAcquired(true) // still allow joining (listener only)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setDeviceState({
        hasAudio: false,
        hasVideo: false,
        mediaWarning: "Tu navegador no soporta acceso a cámara/micrófono. Entrando como oyente.",
      })
      setMediaAcquired(true)
      return
    }

    let cancelled = false
    let acquiredStream: MediaStream | null = null

    acquireMedia().then(({ stream, deviceState: ds }) => {
      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop())
        return
      }
      acquiredStream = stream
      setLocalStream(stream)
      setDeviceState(ds)
      setMediaAcquired(true)
    })

    return () => {
      cancelled = true
      acquiredStream?.getTracks().forEach((t) => t.stop())
      setMediaAcquired(false)
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

  // Only connect signaling after media acquisition is settled (prevents the race
  // where onRoomState fires before localStream is set, creating offers with no tracks).
  const signaling = useSignaling({
    meetingId,
    enabled: enabled && mediaAcquired,
    onRoomState: async (participants) => {
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

  // Cleanup all peer connections on unmount
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
    criticalError,
    deviceState,
    error: criticalError ?? signaling.error,
  }
}
