"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "./projects.api"
import type { AddMemberDto, CreateProjectDto, UpdateProjectDto } from "./projects.types"

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProjectDto) => projectsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

export function useProjectMembers(id: string) {
  return useQuery({
    queryKey: ["projects", id, "members"],
    queryFn: () => projectsApi.getMembers(id),
    enabled: Boolean(id),
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProjectDto }) =>
      projectsApi.update(id, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["projects", id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.removeQueries({ queryKey: ["projects", id] })
      queryClient.removeQueries({ queryKey: ["projects", id, "members"] })
    },
  })
}

export function useAddProjectMember(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: AddMemberDto) => projectsApi.addMember(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", id] })
      queryClient.invalidateQueries({ queryKey: ["projects", id, "members"] })
    },
  })
}
