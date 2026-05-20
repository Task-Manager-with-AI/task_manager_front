"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowLeft,
  Check,
  KanbanSquare,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMinuteByMeeting } from "@/features/meetings/meetings.hooks"
import { useTranslation } from "@/components/locale-provider"
import { useProjectMembers } from "@/features/projects/projects.hooks"
import {
  useAcceptSuggestion,
  useMinuteSuggestions,
  useRejectSuggestion,
  useUpdateSuggestion,
} from "@/features/suggestions/suggestions.hooks"
import type {
  SuggestionStatus,
  TaskSuggestion,
} from "@/features/meetings/meetings.types"
import type { TaskPriority } from "@/features/tasks/tasks.types"

const SUGGESTION_STATUS_COLORS: Record<SuggestionStatus, string> = {
  PENDING: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  EDITED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

const editSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  responsibleId: z.string().optional(),
})

type EditForm = z.infer<typeof editSchema>

export default function MinutesPage() {
  const params = useParams<{ projectId: string; meetingId: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: minute, isLoading } = useMinuteByMeeting(params.meetingId)
  const { data: members } = useProjectMembers(params.projectId)
  const { data: suggestions } = useMinuteSuggestions(minute?.id ?? "")

  const updateMutation = useUpdateSuggestion(minute?.id ?? "")
  const rejectMutation = useRejectSuggestion(minute?.id ?? "")
  const acceptMutation = useAcceptSuggestion(minute?.id ?? "", params.projectId)

  const [editingId, setEditingId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 sm:p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!minute) {
    return (
      <div className="p-4 text-center sm:p-6">
        <p className="text-gray-500">{t("meetings.noMinutes")}</p>
        <Button
          variant="link"
          onClick={() =>
            router.push(`/projects/${params.projectId}/meetings/${params.meetingId}`)
          }
        >
          {t("meetings.backToMeeting")}
        </Button>
      </div>
    )
  }

  const items = suggestions ?? minute.taskSuggestions ?? []

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(`/projects/${params.projectId}/meetings/${params.meetingId}`)
            }
            aria-label={t("common.back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {t("minutes.pageTitle")} — {minute.meeting.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("minutes.subtitle")}</p>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
            {t("minutes.summary")}
          </h2>
          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {minute.summary}
          </p>
          {minute.keyPoints.length > 0 && (
            <>
              <h3 className="mt-4 mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                {t("minutes.keyPoints")}
              </h3>
              <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {minute.keyPoints.map((kp, i) => (
                  <li key={i}>{kp}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
            {t("minutes.agreements")}
          </h2>
          {minute.agreements.length === 0 ? (
            <p className="text-sm text-gray-500">{t("minutes.noAgreements")}</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {minute.agreements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                >
                  <span className="mr-2 font-semibold">{a.order}.</span>
                  {a.text}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Plus className="h-5 w-5" />
          {t("minutes.suggestionsTitle")} ({items.length})
        </h2>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{t("minutes.suggestionsHint")}</p>

        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
            {t("minutes.noSuggestions")}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                members={members ?? []}
                isEditing={editingId === suggestion.id}
                onStartEdit={() => setEditingId(suggestion.id)}
                onCancelEdit={() => setEditingId(null)}
                onSave={async (values) => {
                  await updateMutation.mutateAsync({
                    id: suggestion.id,
                    dto: {
                      title: values.title,
                      description: values.description || null,
                      priority: values.priority as TaskPriority,
                      suggestedForId:
                        values.responsibleId === "unassigned"
                          ? null
                          : values.responsibleId,
                    },
                  })
                  setEditingId(null)
                }}
                onReject={() => rejectMutation.mutate(suggestion.id)}
                onAccept={() =>
                  acceptMutation.mutate({
                    id: suggestion.id,
                    dto: {},
                  })
                }
                accepting={acceptMutation.isPending}
                saving={updateMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

interface SuggestionCardProps {
  suggestion: TaskSuggestion
  members: { id: string; userId: string; user: { id: string; name: string } }[]
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: (values: EditForm) => Promise<void>
  onReject: () => void
  onAccept: () => void
  accepting?: boolean
  saving?: boolean
}

function SuggestionCard({
  suggestion,
  members,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onReject,
  onAccept,
  accepting,
  saving,
}: SuggestionCardProps) {
  const { t } = useTranslation()
  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: suggestion.title,
      description: suggestion.description ?? "",
      priority: suggestion.priority,
      responsibleId: suggestion.suggestedForId ?? "unassigned",
    },
  })

  const isFinalized =
    suggestion.status === "ACCEPTED" || suggestion.status === "REJECTED"

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={SUGGESTION_STATUS_COLORS[suggestion.status]}>
            {suggestion.status}
          </Badge>
          <Badge className={PRIORITY_COLORS[suggestion.priority]}>
            {suggestion.priority}
          </Badge>
          {suggestion.task && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              {t("minutes.taskCreated")}: {suggestion.task.title}
            </Badge>
          )}
        </div>
        {!isFinalized && !isEditing && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onStartEdit}>
              <Pencil className="h-4 w-4" />
              {t("minutes.edit")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              {t("minutes.reject")}
            </Button>
            <Button size="sm" onClick={onAccept} disabled={accepting}>
              <Check className="h-4 w-4" />
              {accepting ? t("minutes.accepting") : t("minutes.accept")}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <form
          onSubmit={form.handleSubmit(onSave)}
          className="space-y-3"
        >
          <Input
            placeholder={t("minutes.taskTitlePlaceholder")}
            {...form.register("title")}
          />
          <Textarea
            rows={2}
            placeholder={t("minutes.descriptionPlaceholder")}
            {...form.register("description")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={form.watch("priority")}
              onValueChange={(v) =>
                form.setValue("priority", v as "LOW" | "MEDIUM" | "HIGH")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{t("minutes.priorityLow")}</SelectItem>
                <SelectItem value="MEDIUM">{t("minutes.priorityMedium")}</SelectItem>
                <SelectItem value="HIGH">{t("minutes.priorityHigh")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.watch("responsibleId")}
              onValueChange={(v) => form.setValue("responsibleId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("minutes.responsible")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">{t("minutes.unassigned")}</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              <X className="h-4 w-4" />
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("minutes.saving") : t("minutes.saveChanges")}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {suggestion.title}
          </h3>
          {suggestion.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {suggestion.description}
            </p>
          )}
          {suggestion.suggestedFor && (
            <p className="mt-2 text-xs text-gray-500">
              {t("minutes.suggestedFor")}: <strong>{suggestion.suggestedFor.name}</strong>
            </p>
          )}
        </>
      )}
    </div>
  )
}
