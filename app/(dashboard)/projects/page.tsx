"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, FolderOpen, Trash2 } from "lucide-react"
import { useProjects, useCreateProject, useDeleteProject } from "@/features/projects/projects.hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const PROJECT_COLORS = [
  "bg-blue-200 dark:bg-blue-800",
  "bg-pink-200 dark:bg-pink-800",
  "bg-green-200 dark:bg-green-800",
  "bg-yellow-200 dark:bg-yellow-800",
  "bg-purple-200 dark:bg-purple-800",
  "bg-red-200 dark:bg-red-800",
]

export default function ProjectsPage() {
  const router = useRouter()
  const { data: projects, isLoading } = useProjects()
  const { mutate: createProject, isPending } = useCreateProject()
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject()
  const [open, setOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const selectedProject = projects?.find((project) => project.id === projectToDelete)

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  })

  const onSubmit = (data: CreateForm) => {
    createProject(
      { name: data.name, description: data.description || undefined },
      { onSuccess: () => { form.reset(); setOpen(false) } }
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all your projects
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Create Project</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project name</FormLabel>
                      <FormControl>
                        <Input placeholder="My awesome project" {...field} />
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
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What is this project about?"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create project"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && projects?.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
        </div>
      )}

      {!isLoading && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-8 h-8 rounded-lg ${PROJECT_COLORS[index % PROJECT_COLORS.length]} flex items-center justify-center`}
                  >
                    <FolderOpen className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      project.status === "ACTIVE"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {project.status}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2 text-gray-900 dark:text-white">
                  {project.name}
                </CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2 text-gray-500 dark:text-gray-400">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Created {format(new Date(project.createdAt), "MMM d, yyyy")}
                </p>
              </CardContent>
              <CardFooter className="justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-500"
                  aria-label={`Delete project ${project.name}`}
                  onClick={() => setProjectToDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(projectToDelete)} onOpenChange={(next) => !next && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProject
                ? `This will remove "${selectedProject.name}" from active project lists.`
                : "This will remove the selected project from active project lists."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
              onClick={() => {
                if (!projectToDelete) return
                deleteProject(projectToDelete, { onSuccess: () => setProjectToDelete(null) })
              }}
            >
              {isDeleting ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
