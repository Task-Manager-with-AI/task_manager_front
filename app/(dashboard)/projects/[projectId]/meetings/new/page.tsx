"use client"

import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useProjectMembers } from "@/features/projects/projects.hooks"
import { useCreateMeeting } from "@/features/meetings/meetings.hooks"

const schema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  participantIds: z.array(z.string()).default([]),
})

type FormValues = z.infer<typeof schema>

export default function CreateMeetingPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { data: members } = useProjectMembers(projectId)
  const createMutation = useCreateMeeting(projectId)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      scheduledAt: "",
      participantIds: [],
    },
  })

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(
      {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        scheduledAt: data.scheduledAt
          ? new Date(data.scheduledAt).toISOString()
          : undefined,
        participantIds: data.participantIds,
      },
      {
        onSuccess: (meeting) => {
          router.push(`/projects/${projectId}/meetings/${meeting.id}`)
        },
      }
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/projects/${projectId}/meetings`)}
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Nueva reunión
        </h1>
      </div>

      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {createMutation.error && (
          <p
            role="alert"
            className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "Algo salió mal"}
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Sprint Review" {...field} />
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Objetivo de la reunión" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programada para (opcional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participantIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invitar miembros</FormLabel>
                  <div className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                    {(members ?? []).length === 0 && (
                      <p className="text-sm text-gray-500">
                        Este proyecto aún no tiene miembros.
                      </p>
                    )}
                    {members?.map((member) => {
                      const checked = field.value.includes(member.userId)
                      return (
                        <label
                          key={member.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const next = c
                                ? [...field.value, member.userId]
                                : field.value.filter((id) => id !== member.userId)
                              field.onChange(next)
                            }}
                          />
                          <div className="text-sm">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.user.name}
                            </p>
                            <p className="text-xs text-gray-500">{member.user.email}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/projects/${projectId}/meetings`)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear reunión"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
