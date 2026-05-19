"use client"

import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CallControlsProps {
  audioEnabled: boolean
  videoEnabled: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onLeave: () => void
  leaving?: boolean
}

export function CallControls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  leaving,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 border-t border-gray-800 bg-gray-900 p-4">
      <Button
        variant={audioEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleAudio}
        aria-label={audioEnabled ? "Silenciar micrófono" : "Activar micrófono"}
      >
        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>
      <Button
        variant={videoEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleVideo}
        aria-label={videoEnabled ? "Apagar cámara" : "Encender cámara"}
      >
        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>
      <Button
        variant="destructive"
        onClick={onLeave}
        disabled={leaving}
        className="gap-2"
      >
        <PhoneOff className="h-5 w-5" />
        {leaving ? "Procesando..." : "Terminar"}
      </Button>
    </div>
  )
}
