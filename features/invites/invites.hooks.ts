import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "./invites.api"
import type { CreateInviteLinkDto, SendInviteEmailDto } from "./invites.types"

export function useInviteInfo(token: string) {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: () => api.getInviteInfo(token),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useAcceptInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => api.acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

export function useCreateInviteLink(projectId: string) {
  return useMutation({
    mutationFn: (dto: CreateInviteLinkDto) => api.createInviteLink(projectId, dto),
  })
}

export function useSendInviteByEmail(projectId: string) {
  return useMutation({
    mutationFn: (dto: SendInviteEmailDto) => api.sendInviteByEmail(projectId, dto),
  })
}
