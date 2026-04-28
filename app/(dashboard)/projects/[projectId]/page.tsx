"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ArrowLeft, KanbanSquare, Pencil, Plus, Trash2, UserPlus, Users } from "lucide-react"
import {
  useAddProjectMember,
  useDeleteProject,
  useProject,
  useProjectMembers,
  useUpdateProject,
} from "@/features/projects/projects.hooks"
import { useUsers } from "@/features/users/users.hooks"
import { useProjectTasks, useCreateTask, useDeleteTask } from "@/features/tasks/tasks.hooks"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

const STATUS_COLORS = {
  PENDING: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
}

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  responsibleId: z.string().optional(),
})

const editProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
})

const addMemberSchema = z.object({
  userId: z.string().min(1, "Choose a user"),
  memberRole: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
})

type CreateTaskForm = z.infer<typeof createTaskSchema>
type EditProjectForm = z.infer<typeof editProjectSchema>
type AddMemberForm = z.infer<typeof addMemberSchema>

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong"
}

function toApiDate(value?: string) {
  return value ? new Date(value).toISOString() : undefined
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId)
  const { data: users, isLoading: usersLoading } = useUsers()
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId)
  const createTaskMutation = useCreateTask(projectId)
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

  const taskForm = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      responsibleId: "unassigned",
    },
  })

  const editProjectForm = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: { name: "", description: "" },
  })

  const addMemberForm = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: "", memberRole: "MEMBER" },
  })

  const onCreateTask = (data: CreateTaskForm) => {
    createTaskMutation.mutate(
      {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        dueDate: toApiDate(data.dueDate),
        priority: data.priority,
        responsibleId: data.responsibleId === "unassigned" ? undefined : data.responsibleId,
      },
      {
        onSuccess: () => {
          taskForm.reset({
            title: "",
            description: "",
            dueDate: "",
            priority: "MEDIUM",
            responsibleId: "unassigned",
          })
          setTaskDialogOpen(false)
        },
      }
    )
  }

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
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Project not found.</p>
        <Button variant="link" onClick={() => router.push("/projects")}>
          Back to projects
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to projects"
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
              {project.status}
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
            Kanban
          </Button>
          <Button variant="outline" onClick={openEditDialog}>
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setMemberDialogOpen(true)}>
            <UserPlus className="w-4 h-4" />
            Add member
          </Button>
          <Button variant="destructive" onClick={() => setDeleteProjectOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Users className="h-4 w-4" />
            Project members
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {members?.length ?? 0} active
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
            {members?.map((member) => (
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.memberRole}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track owner, due date, priority, and status in one place.
          </p>
        </div>
        <Dialog
          open={taskDialogOpen}
          onOpenChange={(nextOpen) => {
            setTaskDialogOpen(nextOpen)
            if (!nextOpen) {
              createTaskMutation.reset()
              taskForm.reset({
                title: "",
                description: "",
                dueDate: "",
                priority: "MEDIUM",
                responsibleId: "unassigned",
              })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              New task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Create task</DialogTitle>
            </DialogHeader>
            {createTaskMutation.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
                {getErrorMessage(createTaskMutation.error)}
              </p>
            )}
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4">
                <FormField
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={taskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Task description" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={taskForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={taskForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={taskForm.control}
                  name="responsibleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsible</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={membersLoading}>
                            <SelectValue placeholder="Choose a responsible member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
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
                  <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending ? "Creating..." : "Create task"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {tasksLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/60">
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                    No tasks yet. Create your first one.
                  </TableCell>
                </TableRow>
              )}
              {tasks?.map((task) => (
                <TableRow key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[task.status]}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {task.responsible?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy HH:mm") : "No due date"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-500"
                      aria-label={`Delete task ${task.title}`}
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
            <DialogTitle className="text-gray-900 dark:text-white">Edit project</DialogTitle>
          </DialogHeader>
          {updateProjectMutation.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
              {getErrorMessage(updateProjectMutation.error)}
            </p>
          )}
          <Form {...editProjectForm}>
            <form onSubmit={editProjectForm.handleSubmit(onUpdateProject)} className="space-y-4">
              <FormField
                control={editProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project name</FormLabel>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProjectMutation.isPending}>
                  {updateProjectMutation.isPending ? "Saving..." : "Save changes"}
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
            <DialogTitle className="text-gray-900 dark:text-white">Add project member</DialogTitle>
          </DialogHeader>
          {addMemberMutation.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
              {getErrorMessage(addMemberMutation.error)}
            </p>
          )}
          <Form {...addMemberForm}>
            <form onSubmit={addMemberForm.handleSubmit(onAddMember)} className="space-y-4">
              <FormField
                control={addMemberForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={usersLoading || availableUsers.length === 0}>
                          <SelectValue placeholder={usersLoading ? "Loading users..." : "Choose a user"} />
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
                        All active users are already members.
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
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="GUEST">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setMemberDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addMemberMutation.isPending || usersLoading || availableUsers.length === 0}
                >
                  {addMemberMutation.isPending ? "Adding..." : "Add member"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will remove "${project.name}" from active project lists. Existing task data stays in the database.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteProjectMutation.isPending}
              onClick={onDeleteProject}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(taskToDelete)} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              {taskPendingDeletion
                ? `This will permanently delete "${taskPendingDeletion.title}".`
                : "This will permanently delete the selected task."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteTaskMutation.isPending}
              onClick={onDeleteTask}
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
