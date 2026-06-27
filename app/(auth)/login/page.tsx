"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { GoogleLogin } from "@react-oauth/google"
import { useLogin, useGoogleAuth } from "@/features/auth/auth.hooks"
import { ApiError } from "@/lib/api-client"
import { useTranslation } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

type LoginForm = {
  email: string
  password: string
}

export default function LoginPage() {
  const { t } = useTranslation()
  const { mutate: login, isPending, error } = useLogin()
  const { mutate: googleAuth, error: googleError } = useGoogleAuth()

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.invalidEmail")),
        password: z.string().min(1, t("auth.passwordRequired")),
      }),
    [t]
  )

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const apiError = error instanceof ApiError ? error.message : null
  const googleApiError = googleError instanceof ApiError ? googleError.message : null

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("auth.signIn")}</CardTitle>
        <CardDescription>{t("auth.signInDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {(apiError || googleApiError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError ?? googleApiError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={(response) => {
              if (response.credential) {
                googleAuth({ credential: response.credential })
              }
            }}
            onError={() => {
              // handled via mutation error state
            }}
            theme="outline"
            shape="rectangular"
            text="signin_with"
          />
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">o continúa con email</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => login(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.password")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
        </Form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="underline underline-offset-4 hover:text-primary">
            {t("auth.register")}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
