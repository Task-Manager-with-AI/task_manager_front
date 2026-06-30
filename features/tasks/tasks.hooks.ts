"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi } from "./tasks.api"
import type { Task, CreateTaskDto, UpdateTaskDto } from "./tasks.types"

export function useProjectTasks(projectId: string, scope?: "backlog" | "kanban" | "all") {
  return useQuery({
    queryKey: ["tasks", projectId, scope ?? "all"],
    queryFn: () => tasksApi.listByProject(projectId, scope),
    enabled: Boolean(projectId),
  })
}

export function useBacklogTasks(projectId: string) {
  return useQuery({
    queryKey: ["backlog", projectId],
    queryFn: () => tasksApi.listBacklog(projectId),
    enabled: Boolean(projectId),
  })
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      queryClient.invalidateQueries({ queryKey: ["backlog", projectId] })
      queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectId] })
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

export function useUpdateTaskColumn(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: string; columnId: string }) =>
      tasksApi.updateColumn(taskId, columnId),
    onMutate: async ({ taskId, columnId }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] })
      const previous = queryClient.getQueryData<Task[]>(["tasks", projectId])
      queryClient.setQueryData<Task[]>(["tasks", projectId], (old) =>
        old?.map((t) => (t.id === taskId ? { ...t, columnId } : t)) ?? []
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
      queryClient.invalidateQueries({ queryKey: ["backlog", projectId] })
      queryClient.invalidateQueries({ queryKey: ["kanban-columns", projectId] })
    },
  })
}
