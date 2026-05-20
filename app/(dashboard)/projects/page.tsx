"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, FolderOpen, Trash2 } from "lucide-react"
import { useProjects, useCreateProject, useDeleteProject } from "@/features/projects/projects.hooks"
import { useTranslation } from "@/components/locale-provider"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type CreateForm = {
  name: string
  description?: string
}

const PROJECT_COLORS = [
  "bg-blue-200 dark:bg-blue-800",
  "bg-pink-200 dark:bg-pink-800",
  "bg-green-200 dark:bg-green-800",
  "bg-yellow-200 dark:bg-yellow-800",
  "bg-purple-200 dark:bg-purple-800",
  "bg-red-200 dark:bg-red-800",
]

export default function ProjectsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: projects, isLoading } = useProjects()
  const { mutate: createProject, isPending } = useCreateProject()
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject()
  const [open, setOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const selectedProject = projects?.find((project) => project.id === projectToDelete)

  const createSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("projects.nameRequired")),
        description: z.string().optional(),
      }),
    [t]
  )

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

  const projectStatusLabel = (status: string) => {
    if (status === "ACTIVE") return t("projects.statusActive")
    if (status === "ARCHIVED") return t("projects.statusArchived")
    return status
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{t("projects.title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("projects.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("common.newProject")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">{t("projects.createProject")}</DialogTitle>
              <DialogDescription>{t("projects.createDescription")}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.projectName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("projects.namePlaceholder")} {...field} />
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
                      <FormLabel>{t("projects.descriptionOptional")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("projects.descriptionPlaceholder")}
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
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? t("projects.creating") : t("projects.createProject")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && projects?.length === 0 && (
        <div className="py-16 text-center text-gray-400 dark:text-gray-500 sm:py-20">
          <FolderOpen className="mx-auto mb-3 h-12 w-12 opacity-40" />
          <p className="text-lg font-medium">{t("projects.noProjects")}</p>
          <p className="mt-1 text-sm">{t("projects.noProjectsHint")}</p>
        </div>
      )}

      {!isLoading && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className="border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${PROJECT_COLORS[index % PROJECT_COLORS.length]}`}
                  >
                    <FolderOpen className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      project.status === "ACTIVE"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {projectStatusLabel(project.status)}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-base text-gray-900 dark:text-white">
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
                  {t("projects.created")} {format(new Date(project.createdAt), "MMM d, yyyy")}
                </p>
              </CardContent>
              <CardFooter className="justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  {t("projects.open")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-500"
                  aria-label={t("projects.deleteProjectAria").replace("{name}", project.name)}
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
            <AlertDialogTitle>{t("projects.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProject
                ? t("projects.deleteConfirmNamed").replace("{name}", selectedProject.name)
                : t("projects.deleteConfirmGeneric")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
              onClick={() => {
                if (!projectToDelete) return
                deleteProject(projectToDelete, { onSuccess: () => setProjectToDelete(null) })
              }}
            >
              {isDeleting ? t("projects.deleting") : t("projects.deleteProject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
