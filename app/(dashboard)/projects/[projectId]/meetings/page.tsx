"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Upload, Video } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslation } from "@/components/locale-provider"
import { useProject } from "@/features/projects/projects.hooks"
import { useProjectMeetings } from "@/features/meetings/meetings.hooks"
import type { MeetingStatus } from "@/features/meetings/meetings.types"

const STATUS_COLORS: Record<MeetingStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  ENDED: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  PROCESSED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export default function MeetingsListPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: project } = useProject(projectId)
  const { data: meetings, isLoading } = useProjectMeetings(projectId)

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

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.backToProject")}
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{t("meetings.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project?.name ?? t("meetings.projectFallback")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/meetings/upload`)}
          >
            <Upload className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t("meetings.uploadFile")}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/meetings/new`)}
          >
            <Plus className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t("meetings.newMeeting")}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:block">
            <div className="table-responsive">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/60">
                    <TableHead>{t("meetings.tableTitle")}</TableHead>
                    <TableHead>{t("meetings.tableStatus")}</TableHead>
                    <TableHead>{t("meetings.tableParticipants")}</TableHead>
                    <TableHead>{t("meetings.tableScheduled")}</TableHead>
                    <TableHead>{t("meetings.tableCreated")}</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(meetings ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                        {t("meetings.noMeetings")}. {t("meetings.noMeetingsHint")}
                      </TableCell>
                    </TableRow>
                  )}
                  {meetings?.map((meeting) => (
                    <TableRow
                      key={meeting.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      onClick={() => router.push(`/projects/${projectId}/meetings/${meeting.id}`)}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">{meeting.title}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[meeting.status]}>{statusLabel(meeting.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {meeting.participants.length}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {meeting.scheduledAt
                          ? format(new Date(meeting.scheduledAt), "dd MMM yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(meeting.createdAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        {(meeting.status === "SCHEDULED" || meeting.status === "IN_PROGRESS") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/projects/${projectId}/meetings/${meeting.id}/room`)
                            }
                          >
                            <Video className="h-4 w-4" />
                            {t("meetings.join")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 sm:hidden">
            {(meetings ?? []).length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
                {t("meetings.noMeetings")}. {t("meetings.noMeetingsHint")}
              </div>
            )}
            {meetings?.map((meeting) => (
              <button
                key={meeting.id}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                onClick={() => router.push(`/projects/${projectId}/meetings/${meeting.id}`)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{meeting.title}</p>
                  <Badge className={STATUS_COLORS[meeting.status]}>{statusLabel(meeting.status)}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p>{t("meetings.tableParticipants")}: {meeting.participants.length}</p>
                  {meeting.scheduledAt && (
                    <p>{t("meetings.tableScheduled")}: {format(new Date(meeting.scheduledAt), "dd MMM yyyy HH:mm")}</p>
                  )}
                </div>
                {(meeting.status === "SCHEDULED" || meeting.status === "IN_PROGRESS") && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/projects/${projectId}/meetings/${meeting.id}/room`)}
                    >
                      <Video className="mr-1.5 h-4 w-4" />
                      {t("meetings.join")}
                    </Button>
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
