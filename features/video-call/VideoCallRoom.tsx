"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useWebRTC } from "./useWebRTC"
import { useAudioRecorder } from "./useAudioRecorder"
import { VideoGrid } from "./VideoGrid"
import { CallControls } from "./CallControls"
import { useEndMeeting, useUploadAudio } from "@/features/meetings/meetings.hooks"

interface VideoCallRoomProps {
  meetingId: string
  meetingTitle: string
  projectId: string
  localUserName: string
}

type LeaveStage = "idle" | "uploading" | "ending" | "processing"

export function VideoCallRoom({
  meetingId,
  meetingTitle,
  projectId,
  localUserName,
}: VideoCallRoomProps) {
  const router = useRouter()
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [leaveStage, setLeaveStage] = useState<LeaveStage>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { localStream, remoteStreams, connected, error } = useWebRTC({
    meetingId,
    enabled: true,
    audioEnabled,
    videoEnabled,
    onMinutesReady: ({ minuteId: _minuteId }) => {
      router.push(`/projects/${projectId}/meetings/${meetingId}/minutes`)
    },
    onProcessingStarted: () => setLeaveStage("processing"),
    onProcessingFailed: (payload) => {
      setErrorMessage(payload.message)
      setLeaveStage("idle")
    },
  })

  const recorder = useAudioRecorder(localStream)
  const uploadAudio = useUploadAudio()
  const endMeeting = useEndMeeting()

  useEffect(() => {
    if (localStream && recorder.state === "idle") {
      recorder.start()
    }
  }, [localStream, recorder])

  const handleLeave = async () => {
    if (leaveStage !== "idle") return
    try {
      setLeaveStage("uploading")
      const blob = await recorder.stop()
      if (blob && blob.size > 0) {
        await uploadAudio.mutateAsync({ meetingId, blob })
      }
      setLeaveStage("ending")
      await endMeeting.mutateAsync(meetingId)
      setLeaveStage("processing")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al finalizar la llamada"
      setErrorMessage(msg)
      setLeaveStage("idle")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen flex-col bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">{meetingTitle}</h1>
          <p className="text-xs text-gray-400">
            {connected ? "Conectado" : "Conectando..."} ·{" "}
            {recorder.state === "recording" ? "🔴 Grabando" : "Sin grabación"}
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {remoteStreams.length + 1} participante
          {remoteStreams.length === 0 ? "" : "s"}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {error && (
          <div className="mx-4 mt-3 rounded-md bg-red-900/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        {errorMessage && (
          <div className="mx-4 mt-3 rounded-md bg-amber-900/40 px-3 py-2 text-sm text-amber-200">
            {errorMessage}
          </div>
        )}

        {leaveStage === "processing" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin" />
            <h2 className="text-xl font-semibold">
              Procesando audio y generando minutas...
            </h2>
            <p className="max-w-md text-sm text-gray-400">
              Esto puede tardar entre 30 segundos y unos minutos según la duración de la
              reunión. Cuando termine, te llevaremos a la página de la minuta automáticamente.
            </p>
          </div>
        ) : (
          <VideoGrid
            localStream={localStream}
            localName={localUserName}
            audioOff={!audioEnabled}
            videoOff={!videoEnabled}
            remoteStreams={remoteStreams}
          />
        )}
      </div>

      <CallControls
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={() => setAudioEnabled((v) => !v)}
        onToggleVideo={() => setVideoEnabled((v) => !v)}
        onLeave={handleLeave}
        leaving={leaveStage !== "idle"}
      />
    </div>
  )
}
