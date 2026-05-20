"use client"

import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "@/components/locale-provider"
import { useCreateTask } from "./tasks.hooks"
import type { ProjectMember } from "@/features/projects/projects.types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type CreateTaskForm = {
  title: string
  description?: string
  dueDate?: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  responsibleId?: string
}

interface CreateTaskDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultColumnId?: string
  members?: ProjectMember[]
  membersLoading?: boolean
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function toApiDate(value?: string) {
  return value ? new Date(value).toISOString() : undefined
}

export function CreateTaskDialog({
  projectId,
  open,
  onOpenChange,
  defaultColumnId,
  members,
  membersLoading = false,
}: CreateTaskDialogProps) {
  const { t } = useTranslation()
  const createTaskMutation = useCreateTask(projectId)

  const createTaskSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("tasks.titleRequired")),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
        responsibleId: z.string().optional(),
      }),
    [t]
  )

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      responsibleId: "unassigned",
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      createTaskMutation.reset()
      form.reset({
        title: "",
        description: "",
        dueDate: "",
        priority: "MEDIUM",
        responsibleId: "unassigned",
      })
    }
  }

  const onSubmit = (data: CreateTaskForm) => {
    createTaskMutation.mutate(
      {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        dueDate: toApiDate(data.dueDate),
        priority: data.priority,
        responsibleId: data.responsibleId === "unassigned" ? undefined : data.responsibleId,
        columnId: defaultColumnId,
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">{t("tasks.createTask")}</DialogTitle>
          <DialogDescription>{t("tasks.createDescription")}</DialogDescription>
        </DialogHeader>
        {createTaskMutation.error && (
          <p
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            role="alert"
          >
            {getErrorMessage(createTaskMutation.error, t("common.somethingWrong"))}
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tasks.titleLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("tasks.titlePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.description")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("tasks.descriptionPlaceholder")} rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tasks.dueDate")}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tasks.priority")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">{t("tasks.priorityLow")}</SelectItem>
                        <SelectItem value="MEDIUM">{t("tasks.priorityMedium")}</SelectItem>
                        <SelectItem value="HIGH">{t("tasks.priorityHigh")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="responsibleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tasks.responsible")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={membersLoading}>
                        <SelectValue placeholder={t("tasks.chooseResponsible")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">{t("tasks.unassigned")}</SelectItem>
                      {members?.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? t("tasks.creatingTask") : t("tasks.createTask")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

