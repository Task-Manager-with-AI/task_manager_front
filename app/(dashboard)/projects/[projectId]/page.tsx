"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { enUS, es } from "date-fns/locale"
import { ArrowLeft, Check, Copy, KanbanSquare, Link2, ListTodo, Mail, Pencil, Plus, Trash2, UserPlus, Users, Video } from "lucide-react"
import {
  useDeleteProject,
  useProject,
  useProjectMembers,
  useUpdateProject,
} from "@/features/projects/projects.hooks"
import { useCreateInviteLink, useSendInviteByEmail } from "@/features/invites/invites.hooks"
import { useProjectTasks, useDeleteTask } from "@/features/tasks/tasks.hooks"
import { CreateTaskDialog } from "@/features/tasks/CreateTaskDialog"
import { getColumnStyles, type KanbanColumnColor } from "@/features/kanban/kanban.types"
import { useTranslation } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getMockPersonForUser } from "@/lib/people"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const PRIORITY_COLORS = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

type EditProjectForm = {
  name: string
  description?: string
}

type InviteEmailForm = {
  email: string
  memberRole: "ADMIN" | "MEMBER" | "GUEST"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function ProjectDetailPage() {
  const { t, locale } = useTranslation()
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  const editProjectSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("projects.projectNameRequired")),
        description: z.string().optional(),
      }),
    [t]
  )

  const inviteEmailSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.invalidEmail") ?? "Email inválido"),
        memberRole: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
      }),
    [t]
  )

  const projectStatusLabel = (status: string) => {
    if (status === "ACTIVE") return t("projects.statusActive")
    if (status === "ARCHIVED") return t("projects.statusArchived")
    return status
  }

  const priorityLabel = (priority: keyof typeof PRIORITY_COLORS) => {
    const map = {
      LOW: t("tasks.priorityLow"),
      MEDIUM: t("tasks.priorityMedium"),
      HIGH: t("tasks.priorityHigh"),
    }
    return map[priority]
  }

  const memberRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: t("projects.roleAdmin"),
      MEMBER: t("projects.roleMember"),
      GUEST: t("projects.roleGuest"),
    }
    return map[role] ?? role
  }

  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false)
  const [inviteTab, setInviteTab] = useState<"link" | "email">("link")
  const [inviteEmailSuccess, setInviteEmailSuccess] = useState(false)

  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId)
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId)
  const updateProjectMutation = useUpdateProject()
  const deleteProjectMutation = useDeleteProject()
  const deleteTaskMutation = useDeleteTask(projectId)
  const createInviteLinkMutation = useCreateInviteLink(projectId)
  const sendInviteEmailMutation = useSendInviteByEmail(projectId)

  const taskPendingDeletion = tasks?.find((task) => task.id === taskToDelete)

  const editProjectForm = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: { name: "", description: "" },
  })

  const addMemberForm = useForm<InviteEmailForm>({
    resolver: zodResolver(inviteEmailSchema),
    defaultValues: { email: "", memberRole: "MEMBER" },
  })

  const onUpdateProject = (data: EditProjectForm) => {
    if (!project) return
    updateProjectMutation.mutate(
      {
        id: project.id,
        dto: {
          name: data.name.trim(),
          description: data.description?.trim() || "",
        },
      },
      {
        onSuccess: () => setEditDialogOpen(false),
      }
    )
  }

  const onGenerateLink = async () => {
    const result = await createInviteLinkMutation.mutateAsync({ memberRole: "MEMBER" })
    setInviteLink(result.inviteUrl)
  }

  const onCopyInviteLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setInviteLinkCopied(true)
    setTimeout(() => setInviteLinkCopied(false), 2000)
  }

  const onSendInviteEmail = (data: InviteEmailForm) => {
    sendInviteEmailMutation.mutate(data, {
      onSuccess: () => {
        setInviteEmailSuccess(true)
        addMemberForm.reset({ email: "", memberRole: "MEMBER" })
      },
    })
  }

  const onDeleteProject = () => {
    if (!project) return
    deleteProjectMutation.mutate(project.id, {
      onSuccess: () => router.push("/projects"),
    })
  }

  const onDeleteTask = () => {
    if (!taskToDelete) return
    deleteTaskMutation.mutate(taskToDelete, {
      onSuccess: () => setTaskToDelete(null),
    })
  }

  const openEditDialog = () => {
    if (!project) return
    editProjectForm.reset({
      name: project.name,
      description: project.description ?? "",
    })
    setEditDialogOpen(true)
  }

  if (projectLoading) {
    return (
      <div className="p-4 space-y-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 text-center sm:p-6">
        <p className="text-gray-500">{t("projects.notFound")}</p>
        <Button variant="link" onClick={() => router.push("/projects")}>
          {t("projects.backToProjects")}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("projects.backToProjects")}
              onClick={() => router.push("/projects")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <Badge
              className={
                project.status === "ACTIVE"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-gray-100 text-gray-600"
              }
            >
              {projectStatusLabel(project.status)}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400 lg:ml-12">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/backlog`)}>
            <ListTodo className="w-4 h-4" />
            Bolsa de Tareas
          </Button>
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/kanban`)}>
            <KanbanSquare className="w-4 h-4" />
            {t("projects.kanban")}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/meetings`)}>
            <Video className="w-4 h-4" />
            {t("projects.meetings")}
          </Button>
          <Button variant="outline" onClick={openEditDialog}>
            <Pencil className="w-4 h-4" />
            {t("projects.edit")}
          </Button>
          <Button variant="outline" onClick={() => setMemberDialogOpen(true)}>
            <UserPlus className="w-4 h-4" />
            {t("projects.addMember")}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteProjectOpen(true)}>
            <Trash2 className="w-4 h-4" />
            {t("projects.delete")}
          </Button>
        </div>
      </div>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Users className="h-4 w-4" />
            {t("projects.projectMembers")}
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t("projects.activeCount").replace("{count}", String(members?.length ?? 0))}
          </span>
        </div>
        {membersLoading ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-10 w-36 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members?.map((member) => {
              const mock = getMockPersonForUser(member.userId)
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gray-200 text-xs text-gray-900 dark:bg-gray-700 dark:text-white">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="max-w-40 truncate font-medium text-gray-900 dark:text-white">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{memberRoleLabel(member.memberRole)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("projects.tasks")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("tasks.subtitle")}</p>
        </div>
        <Button onClick={() => setTaskDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          {t("tasks.newTask")}
        </Button>
      </div>

      <CreateTaskDialog
        projectId={projectId}
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        members={members}
        membersLoading={membersLoading}
      />

      {tasksLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          {/* Desktop table — hidden on mobile */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:block">
            <div className="table-responsive">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/60">
                    <TableHead>{t("tasks.titleLabel")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("tasks.priority")}</TableHead>
                    <TableHead>{t("tasks.responsible")}</TableHead>
                    <TableHead>{t("tasks.dueDate")}</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">{t("common.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                        {t("tasks.noTasksYet")}. {t("tasks.noTasksYetHint")}
                      </TableCell>
                    </TableRow>
                  )}
                  {tasks?.map((task) => (
                    <TableRow key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            getColumnStyles((task.column?.color as KanbanColumnColor) ?? "slate").badge
                          }
                        >
                          {task.column?.title ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_COLORS[task.priority]}>{priorityLabel(task.priority)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {task.responsible?.name ?? t("tasks.unassigned")}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {task.dueDate
                          ? format(new Date(task.dueDate), "PPp", {
                              locale: locale === "es" ? es : enUS,
                            })
                          : t("tasks.noDueDate")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-500"
                          aria-label={t("tasks.deleteTaskAria").replace("{name}", task.title)}
                          onClick={() => setTaskToDelete(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile card list — hidden on sm+ */}
          <div className="space-y-3 sm:hidden">
            {tasks?.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-700">
                {t("tasks.noTasksYet")}. {t("tasks.noTasksYetHint")}
              </div>
            )}
            {tasks?.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-500"
                    aria-label={t("tasks.deleteTaskAria").replace("{name}", task.title)}
                    onClick={() => setTaskToDelete(task.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge
                    className={
                      getColumnStyles((task.column?.color as KanbanColumnColor) ?? "slate").badge
                    }
                  >
                    {task.column?.title ?? "—"}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[task.priority]}>{priorityLabel(task.priority)}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p>{t("tasks.responsible")}: {task.responsible?.name ?? t("tasks.unassigned")}</p>
                  <p>
                    {t("tasks.dueDate")}:{" "}
                    {task.dueDate
                      ? format(new Date(task.dueDate), "PPp", { locale: locale === "es" ? es : enUS })
                      : t("tasks.noDueDate")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={editDialogOpen}
        onOpenChange={(nextOpen) => {
          setEditDialogOpen(nextOpen)
          if (!nextOpen) updateProjectMutation.reset()
        }}
      >
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">{t("projects.editProject")}</DialogTitle>
            <DialogDescription>{t("projects.editProjectDescription")}</DialogDescription>
          </DialogHeader>
          {updateProjectMutation.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
              {getErrorMessage(updateProjectMutation.error, t("common.somethingWrong"))}
            </p>
          )}
          <Form {...editProjectForm}>
            <form onSubmit={editProjectForm.handleSubmit(onUpdateProject)} className="space-y-4">
              <FormField
                control={editProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.projectName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editProjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("projects.description")}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={updateProjectMutation.isPending}>
                  {updateProjectMutation.isPending ? t("common.saving") : t("common.saveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={memberDialogOpen}
        onOpenChange={(nextOpen) => {
          setMemberDialogOpen(nextOpen)
          if (!nextOpen) {
            setInviteLink(null)
            setInviteLinkCopied(false)
            setInviteEmailSuccess(false)
            setInviteTab("link")
            addMemberForm.reset({ email: "", memberRole: "MEMBER" })
            createInviteLinkMutation.reset()
            sendInviteEmailMutation.reset()
          }
        }}
      >
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Invitar miembro
            </DialogTitle>
            <DialogDescription>
              Genera un link de invitación o envía un correo directamente.
            </DialogDescription>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setInviteTab("link")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors ${
                inviteTab === "link"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Link2 className="h-4 w-4" />
              Link
            </button>
            <button
              type="button"
              onClick={() => setInviteTab("email")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors ${
                inviteTab === "email"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Mail className="h-4 w-4" />
              Correo
            </button>
          </div>

          {inviteTab === "link" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                El link es válido por 7 días y puede ser usado por cualquier persona con el link.
              </p>
              {createInviteLinkMutation.error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {getErrorMessage(createInviteLinkMutation.error, t("common.somethingWrong"))}
                </p>
              )}
              {inviteLink ? (
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={onCopyInviteLink}>
                    {inviteLinkCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={onGenerateLink}
                  disabled={createInviteLinkMutation.isPending}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  {createInviteLinkMutation.isPending ? "Generando..." : "Generar link de invitación"}
                </Button>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {inviteTab === "email" && (
            <div className="space-y-3">
              {inviteEmailSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">¡Invitación enviada!</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setInviteEmailSuccess(false); sendInviteEmailMutation.reset() }}>
                      Enviar otra
                    </Button>
                    <Button size="sm" onClick={() => setMemberDialogOpen(false)}>
                      Listo
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {sendInviteEmailMutation.error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                      {getErrorMessage(sendInviteEmailMutation.error, t("common.somethingWrong"))}
                    </p>
                  )}
                  <Form {...addMemberForm}>
                    <form onSubmit={addMemberForm.handleSubmit(onSendInviteEmail)} className="space-y-4">
                      <FormField
                        control={addMemberForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo del invitado</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="nombre@empresa.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addMemberForm.control}
                        name="memberRole"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("members.role")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ADMIN">{t("projects.roleAdmin")}</SelectItem>
                                <SelectItem value="MEMBER">{t("projects.roleMember")}</SelectItem>
                                <SelectItem value="GUEST">{t("projects.roleGuest")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setMemberDialogOpen(false)}>
                          {t("common.cancel")}
                        </Button>
                        <Button type="submit" disabled={sendInviteEmailMutation.isPending}>
                          {sendInviteEmailMutation.isPending ? "Enviando..." : "Enviar invitación"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projects.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("projects.deleteProjectDetail").replace("{name}", project.name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteProjectMutation.isPending}
              onClick={onDeleteProject}
            >
              {deleteProjectMutation.isPending ? t("projects.deleting") : t("projects.deleteProject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(taskToDelete)} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tasks.deleteTaskTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {taskPendingDeletion
                ? t("tasks.deleteTaskNamed").replace("{name}", taskPendingDeletion.title)
                : t("tasks.deleteTaskGeneric")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteTaskMutation.isPending}
              onClick={onDeleteTask}
            >
              {deleteTaskMutation.isPending ? t("projects.deleting") : t("tasks.deleteTask")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
