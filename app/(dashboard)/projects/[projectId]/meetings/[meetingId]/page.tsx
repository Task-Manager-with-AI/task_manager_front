"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Copy,
  Check,
  FileText,
  KanbanSquare,
  Loader2,
  Users,
  Video,
  Zap,
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/components/locale-provider"
import { useMeeting } from "@/features/meetings/meetings.hooks"
import type { MeetingStatus, MeetingType } from "@/features/meetings/meetings.types"

const STATUS_COLORS: Record<MeetingStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  ENDED: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  PROCESSED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const TYPE_COLORS: Record<MeetingType, string> = {
  REGULAR: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  DAILY: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  SPRINT_PLANNING: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
}

export default function MeetingDetailPage() {
  const params = useParams<{ projectId: string; meetingId: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: meeting, isLoading } = useMeeting(params.meetingId)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleCopyRoomLink = async () => {
    const roomUrl = `${window.location.origin}/projects/${params.projectId}/meetings/${params.meetingId}/room`
    try {
      await navigator.clipboard.writeText(roomUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {}
  }

  const statusLabel = (status: MeetingStatus) => {
    const map: Record<MeetingStatus, string> = {
      SCHEDULED: t("meetings.statusScheduled"),
      IN_PROGRESS: t("meetings.statusInProgress"),
      ENDED: t("meetings.statusEnded"),
      PROCESSED: t("meetings.statusProcessed"),
      FAILED: t("meetings.statusFailed"),
    }
    return map[status]
  }

  const typeLabel = (type: MeetingType) => {
    const map: Record<MeetingType, string> = {
      REGULAR: t("meetings.typeRegular"),
      DAILY: t("meetings.typeDaily"),
      SPRINT_PLANNING: t("meetings.typeSprint"),
    }
    return map[type]
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="p-4 text-center sm:p-6">
        <p className="text-gray-500">{t("meetings.notFound")}</p>
        <Button
          variant="link"
          onClick={() => router.push(`/projects/${params.projectId}/meetings`)}
        >
          {t("common.back")}
        </Button>
      </div>
    )
  }

  const meetingType: MeetingType = meeting.meetingType ?? "REGULAR"
  const canJoin = meeting.status === "SCHEDULED" || meeting.status === "IN_PROGRESS"
  const isProcessing = meeting.status === "ENDED"
  const isProcessed = meeting.status === "PROCESSED"

  const hasMinutes = isProcessed && Boolean(meeting.minute)
  const hasDailyAnalysis = isProcessed && meetingType === "DAILY" && Boolean(meeting.dailyAnalysis)
  const hasSprintMinutes = isProcessed && meetingType === "SPRINT_PLANNING" && Boolean(meeting.minute)

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3 sm:mb-6">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("common.back")}
          onClick={() => router.push(`/projects/${params.projectId}/meetings`)}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{meeting.title}</h1>
            <Badge className={STATUS_COLORS[meeting.status]}>{statusLabel(meeting.status)}</Badge>
            <Badge className={TYPE_COLORS[meetingType]}>{typeLabel(meetingType)}</Badge>
          </div>
          {meeting.description && (
            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              {meeting.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Schedule */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <CalendarClock className="h-4 w-4" />
            {t("meetings.scheduleSection")}
          </h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">{t("meetings.scheduledLabel")}</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {meeting.scheduledAt
                  ? format(new Date(meeting.scheduledAt), "dd MMM yyyy HH:mm")
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t("meetings.startedLabel")}</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {meeting.startedAt
                  ? format(new Date(meeting.startedAt), "dd MMM yyyy HH:mm")
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{t("meetings.endedLabel")}</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {meeting.endedAt
                  ? format(new Date(meeting.endedAt), "dd MMM yyyy HH:mm")
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Participants */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Users className="h-4 w-4" />
            {t("meetings.participantsSection")} ({meeting.participants.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {meeting.participants.map((participant) => (
              <li key={participant.id} className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>{participant.user.name}</span>
                <span className="text-xs text-gray-400">{participant.user.email}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Actions — content depends on meeting type */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
            {t("meetings.actionsSection")}
          </h2>
          {isProcessed && meetingType === "SPRINT_PLANNING" && (
            <p className="mb-3 text-xs text-purple-600 dark:text-purple-400">
              {t("meetings.sprintFocused")}
            </p>
          )}
          {isProcessed && meetingType === "REGULAR" && (
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              {t("meetings.typeRegular")}
            </p>
          )}
          <div className="space-y-2">
            {canJoin && (
              <>
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/projects/${params.projectId}/meetings/${meeting.id}/room`
                    )
                  }
                >
                  <Video className="h-4 w-4" />
                  {t("meetings.joinCall")}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleCopyRoomLink}
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {linkCopied ? "¡Link copiado!" : "Copiar link de sala"}
                </Button>
              </>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("meetings.processingAudio")}
              </div>
            )}
            {/* Sprint Planning or Regular: show minutes button */}
            {(hasMinutes || hasSprintMinutes) && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/projects/${params.projectId}/meetings/${meeting.id}/minutes`
                  )
                }
              >
                <FileText className="h-4 w-4" />
                {t("meetings.viewMinutesAndSuggestions")}
              </Button>
            )}
            {/* Kanban button for Sprint Planning */}
            {hasSprintMinutes && (
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => router.push(`/projects/${params.projectId}/kanban`)}
              >
                <KanbanSquare className="h-4 w-4" />
                {t("minutes.goToKanban")}
              </Button>
            )}
            {meeting.status === "FAILED" && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {t("meetings.processingError")}: {meeting.errorMessage ?? "—"}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Detection section — only for Daily or when kanban updates exist */}
      {isProcessed && meetingType === "DAILY" && (
        <section className="mt-4 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-indigo-800 dark:text-indigo-300">
            <AlertTriangle className="h-4 w-4" />
            {t("meetings.detectionSection")}
          </h2>
          <p className="mb-3 text-xs text-indigo-600 dark:text-indigo-400">
            {t("meetings.dailyFocused")}
          </p>
          {hasDailyAnalysis ? (
            <Button
              className="w-full border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
              variant="outline"
              onClick={() =>
                router.push(
                  `/projects/${params.projectId}/meetings/${meeting.id}/daily`
                )
              }
            >
              <Zap className="h-4 w-4" />
              {t("meetings.viewBlockers")}
            </Button>
          ) : (
            <p className="text-xs text-indigo-500 dark:text-indigo-400">
              {t("daily.noAnalysis")}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
