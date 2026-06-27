"use client"

import { useRouter } from "next/navigation"
import { ShieldOff, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MeetingAccessDeniedPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <ShieldOff className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sin acceso a esta reunión
        </h1>
        <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
          No eres miembro del proyecto que organiza esta reunión, o la reunión no existe.
          Pide al organizador que te invite al proyecto primero.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Button onClick={() => router.push("/projects")}>
          <Home className="mr-2 h-4 w-4" />
          Ir a proyectos
        </Button>
      </div>
    </div>
  )
}
