"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi } from "./tasks.api"
import type { Task, CreateTaskDto, UpdateTaskDto, TaskStatus } from "./tasks.types"

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => tasksApi.listByProject(projectId),
    enabled: Boolean(projectId),
  })
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskDto }) =>
      tasksApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}

export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.updateStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] })
      const previous = queryClient.getQueryData<Task[]>(["tasks", projectId])
      queryClient.setQueryData<Task[]>(["tasks", projectId], (old) =>
        old?.map((t) => (t.id === taskId ? { ...t, status } : t)) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tasks", projectId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}
