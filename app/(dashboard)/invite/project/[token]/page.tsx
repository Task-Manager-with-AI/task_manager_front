"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInviteInfo, useAcceptInvite } from "@/features/invites/invites.hooks"
import { useCurrentUser } from "@/features/auth/auth.hooks"

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()

  const { data: me, isLoading: meLoading } = useCurrentUser()
  const { data: invite, isLoading: inviteLoading, error } = useInviteInfo(params.token)
  const acceptMutation = useAcceptInvite()

  // If not logged in, redirect to login then come back
  useEffect(() => {
    if (!meLoading && !me) {
      router.replace(`/login?from=/invite/project/${params.token}`)
    }
  }, [me, meLoading, params.token, router])

  const handleAccept = async () => {
    try {
      const result = await acceptMutation.mutateAsync(params.token)
      router.replace(`/projects/${result.projectId}`)
    } catch {}
  }

  if (meLoading || inviteLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Invitación no válida</h1>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            Este link de invitación no existe o ha sido eliminado.
          </p>
        </div>
        <Button onClick={() => router.push("/projects")}>Ir a proyectos</Button>
      </div>
    )
  }

  if (!invite.valid) {
    const isUsed = invite.reason === "used"
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          {isUsed ? (
            <CheckCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          ) : (
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {isUsed ? "Invitación ya usada" : "Invitación expirada"}
          </h1>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            {isUsed
              ? `La invitación al proyecto "${invite.projectName}" ya fue aceptada.`
              : `La invitación al proyecto "${invite.projectName}" ya no está vigente. Pide al administrador un nuevo link.`}
          </p>
        </div>
        <Button onClick={() => router.push("/projects")}>Ir a proyectos</Button>
      </div>
    )
  }

  // Valid invite
  const roleLabel =
    invite.memberRole === "ADMIN"
      ? "Administrador"
      : invite.memberRole === "GUEST"
        ? "Invitado"
        : "Miembro"

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
        <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Únete al proyecto</h1>
        <p className="max-w-md text-gray-600 dark:text-gray-300">
          <strong>{invite.createdBy}</strong> te ha invitado a unirte a
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{invite.projectName}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tu rol será: <strong>{roleLabel}</strong>
        </p>
      </div>

      {acceptMutation.error && (
        <p className="max-w-sm rounded-md bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
          {acceptMutation.error instanceof Error
            ? acceptMutation.error.message
            : "Error al unirte al proyecto"}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/projects")}>
          Cancelar
        </Button>
        <Button onClick={handleAccept} disabled={acceptMutation.isPending}>
          {acceptMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uniéndose...
            </>
          ) : (
            "Unirme al proyecto"
          )}
        </Button>
      </div>
    </div>
  )
}
