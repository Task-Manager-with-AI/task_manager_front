"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Check, Loader2 } from "lucide-react"
import { useTranslation } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { MEDIA_ERROR, useWebRTC } from "./useWebRTC"
import { useMeetingAudioRecorder } from "./useMeetingAudioRecorder"
import { VideoGrid } from "./VideoGrid"
import { CallControls } from "./CallControls"
import { useEndMeeting, useUploadAudio } from "@/features/meetings/meetings.hooks"

interface VideoCallRoomProps {
  meetingId: string
  meetingTitle: string
  projectId: string
  localUserName: string
  isHost: boolean
}

type LeaveStage = "idle" | "uploading" | "ending" | "processing"

export function VideoCallRoom({
  meetingId,
  meetingTitle,
  projectId,
  localUserName,
  isHost,
}: VideoCallRoomProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [leaveStage, setLeaveStage] = useState<LeaveStage>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const { localStream, remoteStreams, connected, criticalError, deviceState } = useWebRTC({
    meetingId,
    enabled: true,
    // audioEnabled/videoEnabled are controlled below after device detection
    audioEnabled: true,
    videoEnabled: true,
    onMinutesReady: () => {
      router.push(`/projects/${projectId}/meetings/${meetingId}/minutes`)
    },
    onProcessingStarted: () => {
      if (isHost) {
        setLeaveStage("processing")
        return
      }
      router.push(`/projects/${projectId}/meetings/${meetingId}`)
    },
    onProcessingFailed: (payload) => {
      setErrorMessage(payload.message)
      setLeaveStage("idle")
    },
  })

  // Initialize controls based on what devices are actually available
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)

  useEffect(() => {
    setAudioEnabled(deviceState.hasAudio)
    setVideoEnabled(deviceState.hasVideo)
  }, [deviceState.hasAudio, deviceState.hasVideo])

  const recorder = useMeetingAudioRecorder(
    isHost ? localStream : null,
    isHost ? remoteStreams : []
  )
  const uploadAudio = useUploadAudio()
  const endMeeting = useEndMeeting()

  useEffect(() => {
    if (isHost && localStream && recorder.state === "idle") {
      recorder.start()
    }
  }, [isHost, localStream, recorder])

  const handleLeave = async () => {
    if (leaveStage !== "idle") return

    if (!isHost) {
      router.push(`/projects/${projectId}/meetings/${meetingId}`)
      return
    }

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
      const msg = err instanceof Error ? err.message : t("meetings.somethingWrong")
      setErrorMessage(msg)
      setLeaveStage("idle")
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // fallback: select text from a temp input
    }
  }

  const connectionLabel = criticalError
    ? t("videoCall.disconnected")
    : connected
      ? t("videoCall.connected")
      : t("videoCall.connecting")

  const participantCount = remoteStreams.length + 1
  const participantLabel =
    participantCount === 1 ? t("videoCall.participant") : t("videoCall.participants")

  const recordingLabel = isHost
    ? recorder.state === "recording"
      ? t("videoCall.recordingMeeting")
      : t("videoCall.notRecording")
    : t("videoCall.hostRecords")

  const resolveCriticalError = (message: string) => {
    if (message === MEDIA_ERROR.INSECURE_CONTEXT) return t("videoCall.insecureContext")
    if (message === MEDIA_ERROR.UNAVAILABLE) return t("videoCall.mediaUnavailable")
    return message
  }

  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col bg-gray-950 text-white">
      {/* Header — responsive padding */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-800 px-3 py-2 sm:px-6 sm:py-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold sm:text-lg">{meetingTitle}</h1>
          <p className="truncate text-xs text-gray-400">
            {connectionLabel} · {recordingLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-2">
          <span className="hidden text-xs text-gray-400 sm:block">
            {participantCount} {participantLabel}
          </span>
          {/* BUG-03: copy meeting link */}
          <button
            onClick={handleCopyLink}
            title="Copiar link de la sala"
            className="flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-700"
          >
            {linkCopied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{linkCopied ? "¡Copiado!" : "Copiar link"}</span>
          </button>
        </div>
      </header>

      {/* Main video area */}
      <div className="flex-1 overflow-auto">
        {/* BUG-05: device warning (amber) vs critical error (red) */}
        {deviceState.mediaWarning && (
          <div className="pointer-events-none mx-3 mt-2 rounded-md bg-amber-900/40 px-3 py-2 text-xs text-amber-200 sm:mx-4 sm:mt-3 sm:text-sm">
            {deviceState.mediaWarning}
          </div>
        )}
        {criticalError && (
          <div className="pointer-events-none mx-3 mt-2 rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-200 sm:mx-4 sm:mt-3 sm:text-sm">
            {resolveCriticalError(criticalError)}
          </div>
        )}
        {errorMessage && (
          <div className="mx-3 mt-2 rounded-md bg-amber-900/40 px-3 py-2 text-xs text-amber-200 sm:mx-4 sm:mt-3 sm:text-sm">
            {errorMessage}
          </div>
        )}

        {leaveStage === "processing" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center sm:p-10">
            <Loader2 className="h-10 w-10 animate-spin" />
            <h2 className="text-lg font-semibold sm:text-xl">{t("videoCall.processingTitle")}</h2>
            <p className="max-w-md text-sm text-gray-400">{t("videoCall.processingHint")}</p>
            <Button
              variant="outline"
              className="mt-2 border-gray-600 text-white hover:bg-gray-800"
              onClick={() => router.push(`/projects/${projectId}/meetings/${meetingId}`)}
            >
              {t("videoCall.backToProject")}
            </Button>
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

      {/* Controls footer — BUG-04: shrink-0 + safe-area handled inside CallControls */}
      <CallControls
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={() => setAudioEnabled((v) => !v)}
        onToggleVideo={() => setVideoEnabled((v) => !v)}
        onLeave={handleLeave}
        leaving={leaveStage !== "idle"}
        isHost={isHost}
      />
    </div>
  )
}
