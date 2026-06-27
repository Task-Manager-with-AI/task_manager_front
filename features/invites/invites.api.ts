import { apiClient } from "@/lib/api-client"
import type {
  InviteInfo,
  InviteLinkResult,
  CreateInviteLinkDto,
  SendInviteEmailDto,
} from "./invites.types"

export function getInviteInfo(token: string) {
  return apiClient.get<InviteInfo>(`/invites/${token}`)
}

export function acceptInvite(token: string) {
  return apiClient.post<{ projectId: string; projectName: string }>(`/invites/${token}/accept`)
}

export function createInviteLink(projectId: string, dto: CreateInviteLinkDto = {}) {
  return apiClient.post<InviteLinkResult>(`/projects/${projectId}/invites/link`, dto)
}

export function sendInviteByEmail(projectId: string, dto: SendInviteEmailDto) {
  return apiClient.post<{ message: string }>(`/projects/${projectId}/invites/email`, dto)
}
