export interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy?: { id: string; name: string; email: string }
  members?: ProjectMember[]
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  memberRole: string
  joinedAt?: string
  isActive: boolean
  user: { id: string; name: string; email: string }
}

export interface CreateProjectDto {
  name: string
  description?: string
}

export interface UpdateProjectDto {
  name?: string
  description?: string
}

export interface AddMemberDto {
  userId: string
  memberRole?: "ADMIN" | "MEMBER" | "GUEST"
}
