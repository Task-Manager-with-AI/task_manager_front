"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { meetingsApi } from "./meetings.api"
import type { CreateMeetingDto, Meeting } from "./meetings.types"

export function useProjectMeetings(projectId: string) {
  return useQuery({
    queryKey: ["meetings", projectId],
    queryFn: () => meetingsApi.listByProject(projectId),
    enabled: Boolean(projectId),
  })
}

export function useMeeting(meetingId: string) {
  return useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => meetingsApi.get(meetingId),
    enabled: Boolean(meetingId),
    refetchInterval: (q) => {
      const data = q.state.data as Meeting | undefined
      if (!data) return false
      // Poll while audio is being processed
      if (data.status === "ENDED") return 3000
      return false
    },
  })
}

export function useCreateMeeting(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateMeetingDto) => meetingsApi.create(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", projectId] })
    },
  })
}

export function useStartMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (meetingId: string) => meetingsApi.start(meetingId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meeting", data.id] })
      queryClient.invalidateQueries({ queryKey: ["meetings", data.projectId] })
    },
  })
}

export function useEndMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (meetingId: string) => meetingsApi.end(meetingId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meeting", data.id] })
      queryClient.invalidateQueries({ queryKey: ["meetings", data.projectId] })
    },
  })
}

export function useUploadAudio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId, blob }: { meetingId: string; blob: Blob }) =>
      meetingsApi.uploadAudio(meetingId, blob),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meeting", data.id] })
    },
  })
}

export function useMinuteByMeeting(meetingId: string) {
  return useQuery({
    queryKey: ["minute", meetingId],
    queryFn: () => meetingsApi.getMinute(meetingId),
    enabled: Boolean(meetingId),
    retry: 1,
  })
}
