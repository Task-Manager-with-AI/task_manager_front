"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowRight, Calendar, Loader2, Users, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/components/locale-provider"
import { useAllMeetings } from "@/features/meetings/meetings.hooks"
import type { Meeting, MeetingStatus, MeetingType } from "@/features/meetings/meetings.types"

const STATUS_COLORS: Record<MeetingStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  ENDED: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  PROCESSED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const TYPE_COLORS: Record<MeetingType, string> = {
  REGULAR: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  DAILY: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  SPRINT_PLANNING: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
}

export default function AllMeetingsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { data: meetings, isLoading } = useAllMeetings()

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

  const getMeetingRoute = (m: Meeting) => {
    const base = `/projects/${m.projectId}/meetings/${m.id}`
    if (m.status === "PROCESSED") {
      if (m.meetingType === "DAILY" && m.dailyAnalysis) return `${base}/daily`
      if (m.minute) return `${base}/minutes`
    }
    return base
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {t("meetings.allMeetingsTitle")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("meetings.allMeetingsSubtitle")}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (!meetings || meetings.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 dark:border-gray-700 sm:py-16">
          <Video className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">{t("meetings.noMeetingsGlobal")}</p>
        </div>
      )}

      {!isLoading && meetings && meetings.length > 0 && (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingRow
              key={meeting.id}
              meeting={meeting}
              statusLabel={statusLabel}
              typeLabel={typeLabel}
              onNavigate={() => router.push(getMeetingRoute(meeting))}
              onGoToProject={() =>
                router.push(`/projects/${meeting.projectId}/meetings`)
              }
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface MeetingRowProps {
  meeting: Meeting
  statusLabel: (s: MeetingStatus) => string
  typeLabel: (t: MeetingType) => string
  onNavigate: () => void
  onGoToProject: () => void
  t: (key: string) => string
}

function MeetingRow({ meeting, statusLabel, typeLabel, onNavigate, onGoToProject, t }: MeetingRowProps) {
  const isProcessing = meeting.status === "ENDED"
  const meetingType: MeetingType = meeting.meetingType ?? "REGULAR"

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-gray-900 dark:text-white">
              {meeting.title}
            </span>
            <Badge className={STATUS_COLORS[meeting.status]}>
              {statusLabel(meeting.status)}
            </Badge>
            <Badge className={TYPE_COLORS[meetingType]}>
              {typeLabel(meetingType)}
            </Badge>
            {isProcessing && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("meetings.processingAudio")}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {meeting.project.name}
            </span>
            {meeting.scheduledAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(meeting.scheduledAt), "dd MMM yyyy HH:mm", { locale: es })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {meeting.participants.length}
            </span>
          </div>
        </div>

        {/* Actions — stack vertically on mobile */}
        <div className="flex shrink-0 items-center gap-2 sm:ml-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs text-gray-500 sm:flex-none"
            onClick={onGoToProject}
          >
            {t("meetings.goToProject")}
          </Button>
          <Button size="sm" onClick={onNavigate}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
