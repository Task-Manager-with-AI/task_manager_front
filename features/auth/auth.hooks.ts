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
  const queryClient = useQueryClient()

  return useMutation({
    // [DEMO] Email verification is disabled on the backend, so after creating
    // the account we auto-login (sets the session cookie) and go straight to
    // the dashboard — no /verify-email screen.
    // To re-enable: mutationFn: (dto) => authApi.register(dto), and onSuccess
    // should router.push(`/verify-email?email=${encodeURIComponent(dto.email)}`).
    mutationFn: async (dto: RegisterDto) => {
      await authApi.register(dto)
      return authApi.login({ email: dto.email, password: dto.password })
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user)
      router.push(postLoginPath(user))
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
