"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useVerifyEmail, useResendVerification } from "@/features/auth/auth.hooks"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

const RESEND_COOLDOWN = 60

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""

  const [code, setCode] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { mutate: verify, isPending: isVerifying, error: verifyError } = useVerifyEmail()
  const { mutate: resend, isPending: isResending, isSuccess: resendSent } = useResendVerification()

  useEffect(() => {
    if (!email) router.replace("/register")
  }, [email, router])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    verify({ email, code })
  }

  function handleResend() {
    resend({ email })
    startCooldown()
  }

  const apiError = verifyError instanceof ApiError ? verifyError.message : null

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Verifica tu correo</CardTitle>
        <CardDescription>
          Enviamos un código de 6 dígitos a{" "}
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiError && (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {resendSent && (
          <Alert>
            <AlertDescription>Código reenviado. Revisa tu bandeja de entrada.</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Código de verificación
            </label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? "Verificando…" : "Verificar correo"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          ¿No recibiste el código?{" "}
          {cooldown > 0 ? (
            <span className="text-muted-foreground">
              Reenviar en {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="underline underline-offset-4 hover:text-primary disabled:opacity-50"
            >
              {isResending ? "Enviando…" : "Reenviar código"}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="underline underline-offset-4 hover:text-primary"
          >
            Volver al registro
          </button>
        </p>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
