"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { enUS, es } from "date-fns/locale"
import { ArrowLeft, KanbanSquare, Pencil, Plus, Trash2, UserPlus, Users, Video } from "lucide-react"
import {
  useAddProjectMember,
  useDeleteProject,
  useProject,
  useProjectMembers,
  useUpdateProject,
} from "@/features/projects/projects.hooks"
import { useUsers } from "@/features/users/users.hooks"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

type AddMemberForm = {
  userId: string
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

  const addMemberSchema = useMemo(
    () =>
      z.object({
        userId: z.string().min(1, t("members.chooseUserRequired")),
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

  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId)
  const { data: users, isLoading: usersLoading } = useUsers()
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId)
  const updateProjectMutation = useUpdateProject()
  const addMemberMutation = useAddProjectMember(projectId)
  const deleteProjectMutation = useDeleteProject()
  const deleteTaskMutation = useDeleteTask(projectId)

  const memberIds = useMemo(() => new Set((members ?? []).map((member) => member.userId)), [members])
  const availableUsers = useMemo(
    () => (users ?? []).filter((user) => !memberIds.has(user.id)),
    [memberIds, users]
  )
  const taskPendingDeletion = tasks?.find((task) => task.id === taskToDelete)

  const editProjectForm = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: { name: "", description: "" },
  })

  const addMemberForm = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: "", memberRole: "MEMBER" },
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

  const onAddMember = (data: AddMemberForm) => {
    addMemberMutation.mutate(data, {
      onSuccess: () => {
        addMemberForm.reset({ userId: "", memberRole: "MEMBER" })
        setMemberDialogOpen(false)
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
                    <AvatarImage src={mock.imageURL} alt={member.user.name} />
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
            addMemberMutation.reset()
            addMemberForm.reset({ userId: "", memberRole: "MEMBER" })
          }
        }}
      >
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">{t("projects.addMemberTitle")}</DialogTitle>
            <DialogDescription>{t("projects.addMemberDescription")}</DialogDescription>
          </DialogHeader>
          {addMemberMutation.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
              {getErrorMessage(addMemberMutation.error, t("common.somethingWrong"))}
            </p>
          )}
          <Form {...addMemberForm}>
            <form onSubmit={addMemberForm.handleSubmit(onAddMember)} className="space-y-4">
              <FormField
                control={addMemberForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("members.user")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={usersLoading || availableUsers.length === 0}>
                          <SelectValue
                            placeholder={
                              usersLoading ? t("members.loadingUsers") : t("members.chooseUser")
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableUsers.length === 0 && !usersLoading && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("members.allUsersMembers")}
                      </p>
                    )}
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
                <Button
                  type="submit"
                  disabled={addMemberMutation.isPending || usersLoading || availableUsers.length === 0}
                >
                  {addMemberMutation.isPending ? t("members.adding") : t("projects.addMember")}
                </Button>
              </div>
            </form>
          </Form>
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
