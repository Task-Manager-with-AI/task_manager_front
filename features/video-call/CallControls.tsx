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

  return (
    <div className="flex items-center justify-center gap-3 border-t border-gray-800 bg-gray-900 p-4">
      <Button
        variant={audioEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleAudio}
        aria-label={audioEnabled ? t("videoCall.muteMic") : t("videoCall.unmuteMic")}
      >
        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>
      <Button
        variant={videoEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleVideo}
        aria-label={videoEnabled ? t("videoCall.turnOffCamera") : t("videoCall.turnOnCamera")}
      >
        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>
      <Button variant="destructive" onClick={onLeave} disabled={leaving} className="gap-2">
        <PhoneOff className="h-5 w-5" />
        {leaving
          ? t("videoCall.processing")
          : isHost
            ? t("videoCall.endMeeting")
            : t("videoCall.leave")}
      </Button>
    </div>
  )
}
