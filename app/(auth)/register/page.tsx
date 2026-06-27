"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRegister } from "@/features/auth/auth.hooks"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Por favor confirma tu contraseña"),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "Debes aceptar los términos y condiciones para continuar",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

function TermsContent() {
  return (
    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
      <section className="space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">1. Uso del servicio</h3>
        <p>
          Mondays es una plataforma de gestión ágil de proyectos. Al registrarte, aceptas
          utilizarla únicamente para fines lícitos. No está permitido distribuir contenido
          malicioso ni interferir con la seguridad del sistema.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">2. Privacidad y datos</h3>
        <p>
          Recopilamos únicamente los datos necesarios: nombre, correo electrónico e información
          de proyectos. Tus datos no se venden ni se comparten con terceros con fines comerciales.
          Si te registras con Google, solo verificamos tu identidad; no accedemos a tu correo
          ni a otros servicios de Google.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">3. Cuentas y seguridad</h3>
        <p>
          Eres responsable de mantener la confidencialidad de tu contraseña. Nos reservamos el
          derecho de suspender cuentas que incumplan estos términos o presenten actividad sospechosa.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">4. Propiedad intelectual</h3>
        <p>
          El contenido que creas (proyectos, tareas, documentos) es tuyo. Nos otorgas una licencia
          limitada para almacenarlo y mostrártelo dentro de la plataforma. El software y la marca
          de Mondays son propiedad de sus desarrolladores.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">5. Modificaciones</h3>
        <p>
          Podemos actualizar estos términos en cualquier momento. Te notificaremos por correo ante
          cambios significativos. El uso continuado de la plataforma implica la aceptación de los
          nuevos términos.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">6. Contacto</h3>
        <p>
          ¿Preguntas? Escríbenos a{" "}
          <a
            href="mailto:fsociety.soporte@gmail.com"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            fsociety.soporte@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  )
}

export default function RegisterPage() {
  const { mutate: register, isPending, error } = useRegister()
  const [termsOpen, setTermsOpen] = useState(false)

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  })

  const apiError = error instanceof ApiError ? error.message : null

  const onSubmit = ({ name, email, password }: RegisterForm) => {
    register({ name, email, password })
  }

  return (
    <>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Completa el formulario para comenzar</CardDescription>
        </CardHeader>
        <CardContent>
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@ejemplo.com" {...field} />
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mín. 8 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-2.5">
                      <FormControl>
                        <Checkbox
                          id="acceptTerms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <label
                        htmlFor="acceptTerms"
                        className="text-sm leading-snug text-gray-600 dark:text-gray-300 cursor-pointer select-none"
                      >
                        Acepto los{" "}
                        <button
                          type="button"
                          onClick={() => setTermsOpen(true)}
                          className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400"
                        >
                          Términos y condiciones
                        </button>
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creando cuenta…" : "Crear cuenta"}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Términos y condiciones</DialogTitle>
            <DialogDescription>
              Última actualización: 26 de junio de 2025
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <TermsContent />
          </ScrollArea>
          <div className="flex justify-end pt-2">
            <Button onClick={() => {
              form.setValue("acceptTerms", true, { shouldValidate: true })
              setTermsOpen(false)
            }}>
              Acepto los términos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
