import { apiClient } from "@/lib/api-client"
import type { Project, ProjectMember, CreateProjectDto, UpdateProjectDto, AddMemberDto } from "./projects.types"

export const projectsApi = {
  list: () => apiClient.get<Project[]>("/projects"),
  get: (id: string) => apiClient.get<Project>(`/projects/${id}`),
  create: (dto: CreateProjectDto) => apiClient.post<Project>("/projects", dto),
  update: (id: string, dto: UpdateProjectDto) => apiClient.patch<Project>(`/projects/${id}`, dto),
  delete: (id: string) => apiClient.delete<null>(`/projects/${id}`),
  addMember: (id: string, dto: AddMemberDto) =>
    apiClient.post<ProjectMember>(`/projects/${id}/members`, dto),
  getMembers: (id: string) => apiClient.get<ProjectMember[]>(`/projects/${id}/members`),
}
