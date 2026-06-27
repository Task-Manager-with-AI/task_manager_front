"use client"

import { ScrollText, Shield, FileText, AlertCircle, RefreshCw, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/components/locale-provider"
const LAST_UPDATED = "26 de junio de 2025"
const CONTACT_EMAIL = "fsociety.soporte@gmail.com"
const APP_NAME = "Mondays"

interface SectionProps {
  icon: React.FC<{ className?: string }>
  title: string
  children: React.ReactNode
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
          <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 space-y-3">
        {children}
      </CardContent>
    </Card>
  )
}

export default function TermsPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
          <ScrollText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("nav.terms")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Última actualización: {LAST_UPDATED}
          </p>
        </div>
      </div>

      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        Bienvenido a <strong>{APP_NAME}</strong>. Al crear una cuenta y utilizar nuestra
        plataforma de gestión ágil, aceptas los siguientes términos y condiciones. Lee
        este documento con atención antes de usar el servicio.
      </p>

      <div className="space-y-4">
        <Section icon={FileText} title="1. Uso del servicio">
          <p>
            {APP_NAME} es una plataforma de gestión ágil de proyectos diseñada para equipos de
            desarrollo de software. Al registrarte, obtienes acceso a funcionalidades como gestión
            de tareas, reuniones, actas automáticas con IA, kanban y chat en tiempo real.
          </p>
          <p>
            Te comprometes a utilizar el servicio únicamente para fines lícitos y de acuerdo con
            estas condiciones. No está permitido usar la plataforma para actividades ilegales,
            distribuir contenido malicioso ni interferir con la seguridad del sistema.
          </p>
        </Section>

        <Section icon={Shield} title="2. Privacidad y datos personales">
          <p>
            Recopilamos únicamente los datos necesarios para prestar el servicio: nombre, correo
            electrónico y la información que introduzcas en proyectos, tareas y reuniones.
          </p>
          <p>
            Tus datos no se venden ni se comparten con terceros con fines comerciales. El audio de
            reuniones se procesa temporalmente para generar transcripciones y actas; no se almacena
            de forma indefinida salvo que lo hayas configurado explícitamente.
          </p>
          <p>
            Si te registras con Google, compartimos únicamente el token de identidad con los
            servidores de Google para verificar tu cuenta. No accedemos a tu correo, Drive ni
            ningún otro servicio de Google.
          </p>
        </Section>

        <Section icon={AlertCircle} title="3. Cuentas y seguridad">
          <p>
            Eres responsable de mantener la confidencialidad de tu contraseña y de todas las
            actividades que ocurran bajo tu cuenta. Notifícanos de inmediato si detectas un acceso
            no autorizado.
          </p>
          <p>
            Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estos términos,
            que presenten actividad sospechosa o que infrinjan derechos de terceros.
          </p>
        </Section>

        <Section icon={ScrollText} title="4. Propiedad intelectual">
          <p>
            Todo el contenido generado por ti (proyectos, tareas, documentos, actas) es de tu
            propiedad. Nos otorgas una licencia limitada para almacenarlo y mostrártelo dentro de
            la plataforma.
          </p>
          <p>
            El software, diseño y marca de {APP_NAME} son propiedad de sus desarrolladores.
            No puedes copiar, modificar ni distribuir la plataforma sin autorización expresa.
          </p>
        </Section>

        <Section icon={RefreshCw} title="5. Modificaciones y disponibilidad">
          <p>
            Podemos actualizar estos términos en cualquier momento. Te notificaremos por correo
            electrónico ante cambios significativos. El uso continuado de la plataforma tras la
            notificación implica la aceptación de los nuevos términos.
          </p>
          <p>
            Nos esforzamos por mantener el servicio disponible en todo momento, pero no garantizamos
            una disponibilidad del 100 %. Podemos interrumpir el servicio temporalmente por
            mantenimiento o causas de fuerza mayor sin previo aviso.
          </p>
        </Section>

        <Section icon={Mail} title="6. Contacto">
          <p>
            Si tienes preguntas sobre estos términos o sobre cómo tratamos tus datos, puedes
            contactarnos en{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>

      <Separator className="my-8 bg-gray-200 dark:bg-gray-700" />

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        Al continuar usando {APP_NAME} confirmas que has leído y aceptado estos términos.
      </p>
    </div>
  )
}
