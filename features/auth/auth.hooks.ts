"use client"

import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { authApi } from "./auth.api"
import type { LoginDto, RegisterDto, VerifyEmailDto, ResendVerificationDto, GoogleAuthDto } from "./auth.types"

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false,
  })
}

function postLoginPath(user: { role?: { name?: string } } | null | undefined) {
  return user?.role?.name === "SUPER_ADMIN" ? "/admin" : "/projects"
}

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user)
      router.push(postLoginPath(user))
    },
  })
}

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    onSuccess: (_data, variables) => {
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`)
    },
  })
}

export function useVerifyEmail() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: VerifyEmailDto) => authApi.verifyEmail(dto),
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user)
      router.push(postLoginPath(user))
    },
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (dto: ResendVerificationDto) => authApi.resendVerification(dto),
  })
}

export function useGoogleAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: GoogleAuthDto) => authApi.googleAuth(dto),
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user)
      router.push(postLoginPath(user))
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
