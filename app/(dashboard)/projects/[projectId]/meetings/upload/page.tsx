"use client"

import { useCallback, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  FileAudio,
  FileVideo,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslation } from "@/components/locale-provider"
import { useProject, useProjectMembers } from "@/features/projects/projects.hooks"
import { meetingsApi } from "@/features/meetings/meetings.api"

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_AUDIO = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a", "audio/flac", "audio/x-flac", "audio/aac", "audio/x-aac"]
const ACCEPTED_VIDEO = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/avi", "video/mov"]
const ACCEPTED_MIME = [...ACCEPTED_AUDIO, ...ACCEPTED_VIDEO]
const ACCEPTED_EXT = ".mp3,.wav,.ogg,.webm,.m4a,.flac,.aac,.mp4,.mov,.avi,.mkv"
const MAX_SIZE_BYTES = 200 * 1024 * 1024

const AUDIO_FORMATS = ["MP3", "WAV", "OGG", "WebM", "M4A", "FLAC", "AAC"]
const VIDEO_FORMATS = ["MP4", "MOV", "AVI", "MKV", "WebM"]

type Step = "idle" | "creating" | "uploading" | "processing" | "done" | "error"

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: Array<{ key: Step; labelKey: string }> = [
  { key: "creating", labelKey: "meetings.uploadStepCreate" },
  { key: "uploading", labelKey: "meetings.uploadStepUpload" },
  { key: "processing", labelKey: "meetings.uploadStepProcess" },
  { key: "done", labelKey: "meetings.uploadStepDone" },
]

const STEP_ORDER: Step[] = ["idle", "creating", "uploading", "processing", "done"]

function StepBar({ current, t }: { current: Step; t: (k: string) => string }) {
  const currentIdx = STEP_ORDER.indexOf(current)
  return (
    <div className="flex items-center gap-0 w-full max-w-lg mx-auto">
      {STEPS.map((step, i) => {
        const stepIdx = STEP_ORDER.indexOf(step.key)
        const done = current === "done" ? true : stepIdx < currentIdx
        const active = stepIdx === currentIdx
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                  done
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                      ? "bg-blue-600 border-blue-600 text-white animate-pulse"
                      : "bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600",
                ].join(" ")}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={[
                  "text-[10px] font-medium whitespace-nowrap",
                  done || active ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500",
                ].join(" ")}
              >
                {t(step.labelKey)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mx-1 transition-all duration-500 mb-4",
                  done ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700",
                ].join(" ")}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UploadMeetingPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  const { data: project } = useProject(projectId)
  const { data: members } = useProjectMembers(projectId)

  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [titleError, setTitleError] = useState(false)
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [step, setStep] = useState<Step>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAudio = file ? ACCEPTED_AUDIO.some((m) => file.type.startsWith(m.split("/")[0]) && ACCEPTED_AUDIO.includes(file.type)) : false

  const validateFile = useCallback(
    (f: File): boolean => {
      setFileError(null)
      const mimeOk =
        ACCEPTED_MIME.includes(f.type) ||
        f.type.startsWith("audio/") ||
        f.type.startsWith("video/")
      if (!mimeOk) {
        setFileError(t("meetings.uploadInvalidFormat"))
        return false
      }
      if (f.size > MAX_SIZE_BYTES) {
        setFileError(t("meetings.uploadFileTooLarge"))
        return false
      }
      return true
    },
    [t]
  )

  const handleFile = useCallback(
    (f: File) => {
      if (validateFile(f)) setFile(f)
    },
    [validateFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped) handleFile(dropped)
    },
    [handleFile]
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }
  const onDragLeave = () => setDragActive(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ""
  }

  const toggleParticipant = (userId: string) => {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError(true)
      return
    }
    if (!file) return

    setTitleError(false)
    setErrorMsg(null)

    try {
      setStep("creating")
      const meeting = await meetingsApi.create(projectId, {
        title: title.trim(),
        participantIds,
      })

      setStep("uploading")
      await meetingsApi.start(meeting.id)
      await meetingsApi.uploadMedia(meeting.id, file)

      setStep("processing")
      await meetingsApi.end(meeting.id)

      setStep("done")
      setTimeout(() => {
        router.push(`/projects/${projectId}/meetings/${meeting.id}`)
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("meetings.uploadError")
      setErrorMsg(msg)
      setStep("error")
    }
  }

  const isProcessing = ["creating", "uploading", "processing"].includes(step)
  const isDone = step === "done"

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("common.back")}
          onClick={() => router.push(`/projects/${projectId}/meetings`)}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            {t("meetings.uploadTitle")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {project?.name ?? t("meetings.projectFallback")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Step bar */}
        {(isProcessing || isDone) && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <StepBar current={step} t={t} />
            {isDone && (
              <p className="mt-4 text-center text-sm font-medium text-green-600 dark:text-green-400">
                {t("meetings.uploadRedirecting")}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {step === "error" && errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Dropzone */}
        {!isProcessing && !isDone && (
          <>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && inputRef.current?.click()}
              className={[
                "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200",
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30 scale-[1.01]"
                  : file
                    ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/20 cursor-default"
                    : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800/50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-blue-500 dark:hover:bg-blue-950/10",
              ].join(" ")}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXT}
                className="hidden"
                onChange={onInputChange}
              />

              {dragActive ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                    {t("meetings.uploadDragActive")}
                  </p>
                </>
              ) : file ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    {file.type.startsWith("audio/") ? (
                      <FileAudio className="w-8 h-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <FileVideo className="w-8 h-8 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t("meetings.uploadFileSelected")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-mono truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setFileError(null)
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t("meetings.uploadRemoveFile")}
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-700 dark:text-gray-200">
                      {t("meetings.uploadDropzone")}
                    </p>
                    <p className="text-sm text-gray-400">{t("meetings.uploadDropzoneOr")}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
                        <FileAudio className="w-3 h-3 inline mr-0.5" />
                        Audio:
                      </span>
                      {AUDIO_FORMATS.map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
                        <FileVideo className="w-3 h-3 inline mr-0.5" />
                        Video:
                      </span>
                      {VIDEO_FORMATS.map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium dark:bg-violet-950/40 dark:text-violet-300 border border-violet-100 dark:border-violet-800"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {t("meetings.uploadMaxSize")}
                    </p>
                  </div>
                </>
              )}
            </div>

            {fileError && (
              <p className="text-sm text-red-600 dark:text-red-400 -mt-3">{fileError}</p>
            )}

            {/* Meeting info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("meetings.uploadMeetingTitle")}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input
                  placeholder={t("meetings.uploadMeetingTitlePlaceholder")}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (titleError) setTitleError(false)
                  }}
                  className={titleError ? "border-red-400 focus-visible:ring-red-300" : ""}
                />
                {titleError && (
                  <p className="text-xs text-red-500">{t("meetings.uploadMeetingTitleRequired")}</p>
                )}
              </div>

              {/* Participants */}
              {members && members.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("meetings.uploadParticipants")}
                  </p>
                  <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {members.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        <Checkbox
                          checked={participantIds.includes(member.userId)}
                          onCheckedChange={() => toggleParticipant(member.userId)}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!file || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("meetings.uploadAnalyzing")}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t("meetings.uploadAnalyze")}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
