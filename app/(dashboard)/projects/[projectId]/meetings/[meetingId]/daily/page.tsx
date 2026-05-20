"use client"

import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KanbanSquare,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  User,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/components/locale-provider"
import { useDailyAnalysis, useKanbanUpdates } from "@/features/meetings/meetings.hooks"
import type { DailyEntry, SprintHealth } from "@/features/meetings/meetings.types"

const HEALTH_CONFIG: Record<
  SprintHealth,
  { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }
> = {
  GREEN: {
    label: "healthGreen",
    icon: ShieldCheck,
    color: "text-green-700 dark:text-green-300",
    bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
  },
  YELLOW: {
    label: "healthYellow",
    icon: TriangleAlert,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  },
  RED: {
    label: "healthRed",
    icon: ShieldAlert,
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
  },
}

const KANBAN_STATUS_COLORS = {
  DONE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  BLOCKED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export default function DailyAnalysisPage() {
  const params = useParams<{ projectId: string; meetingId: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  const { data: analysis, isLoading: loadingAnalysis } = useDailyAnalysis(params.meetingId)
  const { data: kanbanUpdates, isLoading: loadingKanban } = useKanbanUpdates(params.meetingId)

  const isLoading = loadingAnalysis || loadingKanban

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="p-4 text-center sm:p-6">
        <p className="mb-4 text-gray-500">{t("daily.noAnalysis")}</p>
        <Button
          variant="link"
          onClick={() =>
            router.push(
              `/projects/${params.projectId}/meetings/${params.meetingId}`
            )
          }
        >
          {t("daily.backToMeeting")}
        </Button>
      </div>
    )
  }

  const health = analysis.sprintHealth as SprintHealth
  const healthConf = HEALTH_CONFIG[health] ?? HEALTH_CONFIG.GREEN
  const HealthIcon = healthConf.icon

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.back")}
            onClick={() =>
              router.push(
                `/projects/${params.projectId}/meetings/${params.meetingId}`
              )
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {t("daily.pageTitle")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("daily.subtitle")}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/projects/${params.projectId}/kanban`)}
        >
          <KanbanSquare className="mr-1.5 h-4 w-4" />
          {t("minutes.goToKanban")}
        </Button>
      </div>

      {/* Sprint Health Banner */}
      <div className={`mb-5 flex items-start gap-3 rounded-xl border p-4 sm:mb-6 sm:items-center ${healthConf.bg}`}>
        <HealthIcon className={`h-8 w-8 shrink-0 ${healthConf.color}`} />
        <div>
          <p className={`text-sm font-semibold ${healthConf.color}`}>
            {t("daily.sprintHealth")}: {t(`daily.${healthConf.label}`)}
          </p>
          {analysis.overallBlockers.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-sm text-gray-700 dark:text-gray-300">
              {analysis.overallBlockers.map((b, i) => (
                <li key={i} className="flex items-start gap-1">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  {b}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {t("daily.noBlockers")}
            </p>
          )}
        </div>
      </div>

      {/* Per-participant entries */}
      {analysis.entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
          {t("daily.noEntries")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {analysis.entries.map((entry) => (
            <DailyEntryCard key={entry.id} entry={entry} t={t} />
          ))}
        </div>
      )}

      {/* Kanban Updates */}
      <section className="mt-8">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Zap className="h-5 w-5 text-amber-500" />
          {t("daily.kanbanUpdatesTitle")}
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t("daily.kanbanUpdatesHint")}
        </p>

        {(!kanbanUpdates || kanbanUpdates.length === 0) ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-700">
            {t("daily.noKanbanUpdates")}
          </p>
        ) : (
          <div className="space-y-2">
            {kanbanUpdates.map((update) => {
              const statusKey = update.newStatus as keyof typeof KANBAN_STATUS_COLORS
              const statusColor = KANBAN_STATUS_COLORS[statusKey] ?? KANBAN_STATUS_COLORS.BLOCKED
              const statusLabel = t(`daily.kanbanStatus${update.newStatus.charAt(0) + update.newStatus.slice(1).toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`)
              return (
                <div
                  key={update.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{update.taskTitle}</p>
                      {update.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{update.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {t("minutes.suggestedFor")}: {update.mentionedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor}>{statusLabel}</Badge>
                    <Badge
                      className={
                        update.applied
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }
                    >
                      {update.applied ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("daily.kanbanApplied")}
                        </span>
                      ) : (
                        t("daily.kanbanPending")
                      )}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {Math.round(update.confidence * 100)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

interface DailyEntryCardProps {
  entry: DailyEntry
  t: (key: string) => string
}

function DailyEntryCard({ entry, t }: DailyEntryCardProps) {
  const hasBlockers = entry.blockers.length > 0

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm dark:bg-gray-800 ${
        hasBlockers
          ? "border-red-200 dark:border-red-800"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Participant header */}
      <div
        className={`flex items-center gap-2 rounded-t-xl border-b px-4 py-3 ${
          hasBlockers
            ? "border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
            : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-750"
        }`}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
          <User className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">{entry.participantName}</span>
        {hasBlockers && (
          <AlertCircle className="ml-auto h-4 w-4 text-red-500" />
        )}
      </div>

      {/* Answers */}
      <div className="space-y-3 p-4">
        <QuestionAnswer
          question={t("daily.question1")}
          answer={entry.yesterday}
          icon="1"
        />
        <QuestionAnswer
          question={t("daily.question2")}
          answer={entry.today}
          icon="2"
        />

        {/* Question 3 — blockers */}
        <div>
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 text-[10px] font-bold">
              3
            </span>
            {t("daily.question3")}
          </p>
          {hasBlockers ? (
            <ul className="ml-5 space-y-1">
              {entry.blockers.map((b, i) => (
                <li key={i} className="flex items-start gap-1 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-5 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("daily.noBlockers")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function QuestionAnswer({
  question,
  answer,
  icon,
}: {
  question: string
  answer: string
  icon: string
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400 text-[10px] font-bold">
          {icon}
        </span>
        {question}
      </p>
      <p className="ml-5 text-sm text-gray-700 dark:text-gray-300">
        {answer || <span className="italic text-gray-400">—</span>}
      </p>
    </div>
  )
}
