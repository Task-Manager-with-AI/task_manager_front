"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sprintsApi } from "./sprints.api"
import type { CreateSprintDto, UpdateSprintDto, AssignTasksDto } from "./sprints.types"

export function useProjectSprints(projectId: string) {
  return useQuery({
    queryKey: ["sprints", projectId],
    queryFn: () => sprintsApi.listByProject(projectId),
    enabled: Boolean(projectId),
  })
}

export function useActiveSprint(projectId: string) {
  return useQuery({
    queryKey: ["sprints", projectId, "active"],
    queryFn: () => sprintsApi.getActive(projectId),
    enabled: Boolean(projectId),
  })
}

export function useSprint(sprintId: string | null) {
  return useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: () => sprintsApi.get(sprintId!),
    enabled: Boolean(sprintId),
  })
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateSprintDto) => sprintsApi.create(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
    },
  })
}

export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sprintId, dto }: { sprintId: string; dto: UpdateSprintDto }) =>
      sprintsApi.update(sprintId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
    },
  })
}

export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) => sprintsApi.start(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId, "active"] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}

export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) => sprintsApi.complete(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId, "active"] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) => sprintsApi.delete(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
    },
  })
}

export function useAssignSprintTasks(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sprintId, dto }: { sprintId: string; dto: AssignTasksDto }) =>
      sprintsApi.assignTasks(sprintId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
      queryClient.invalidateQueries({ queryKey: ["backlog", projectId] })
    },
  })
}
