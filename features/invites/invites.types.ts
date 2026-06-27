export interface InviteInfo {
  valid: boolean
  reason?: "used" | "expired"
  projectName: string
  projectId?: string
  memberRole?: string
  invitedEmail?: string | null
  createdBy?: string
}

export interface CreateInviteLinkDto {
  memberRole?: "ADMIN" | "MEMBER" | "GUEST"
}

export interface SendInviteEmailDto {
  email: string
  memberRole?: "ADMIN" | "MEMBER" | "GUEST"
}

export interface InviteLinkResult {
  inviteUrl: string
  token: string
  expiresAt: string
}
