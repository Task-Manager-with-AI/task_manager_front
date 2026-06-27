"use client"

import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/locale-provider"

interface CallControlsProps {
  audioEnabled: boolean
  videoEnabled: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onLeave: () => void
  leaving?: boolean
  isHost?: boolean
}

export function CallControls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  leaving,
  isHost = false,
}: CallControlsProps) {
  const { t } = useTranslation()

  const leaveLabel = leaving
    ? t("videoCall.processing")
    : isHost
      ? t("videoCall.endMeeting")
      : t("videoCall.leave")

  return (
    <div className="flex shrink-0 items-center justify-center gap-3 border-t border-gray-800 bg-gray-900 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Button
        variant={audioEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleAudio}
        aria-label={audioEnabled ? t("videoCall.muteMic") : t("videoCall.unmuteMic")}
        className="h-11 w-11 shrink-0 sm:h-10 sm:w-10"
      >
        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      <Button
        variant={videoEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleVideo}
        aria-label={videoEnabled ? t("videoCall.turnOffCamera") : t("videoCall.turnOnCamera")}
        className="h-11 w-11 shrink-0 sm:h-10 sm:w-10"
      >
        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      {/* On mobile: icon-only. On sm+: icon + label text */}
      <Button
        variant="destructive"
        onClick={onLeave}
        disabled={leaving}
        aria-label={leaveLabel}
        className="h-11 w-11 shrink-0 sm:h-10 sm:w-auto sm:gap-2 sm:px-4"
      >
        <PhoneOff className="h-5 w-5 shrink-0" />
        <span className="hidden sm:inline">{leaveLabel}</span>
      </Button>
    </div>
  )
}
