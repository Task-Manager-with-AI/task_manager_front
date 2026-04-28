"use client"

import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { authApi } from "./auth.api"
import type { LoginDto, RegisterDto } from "./auth.types"

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false,
  })
}

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user)
      router.push("/projects")
    },
  })
}

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    onSuccess: () => {
      router.push("/login")
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear()
      router.push("/login")
    },
  })
}
