"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LifeBuoy,
  Rocket,
  Video,
  KanbanSquare,
  FileText,
  MessageSquare,
  Bell,
  Sparkles,
  Mail,
  BookOpen,
  Send,
  CheckCircle2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSendSupportContact } from "@/features/support/support.hooks"
import { useCurrentUser } from "@/features/auth/auth.hooks"
import type { ContactPayload } from "@/features/support/support.types"

const QUICK_START = [
  {
    icon: Rocket,
    title: "Crea o únete a un proyecto",
    text: "Desde la barra lateral, crea un proyecto o pide que te agreguen. Cada proyecto agrupa sus tareas, reuniones, documentos y chat.",
  },
  {
    icon: KanbanSquare,
    title: "Organiza el trabajo en el tablero",
    text: "Abre el Kanban del proyecto, crea tareas, asigna responsables y arrástralas entre columnas para cambiar su estado.",
  },
  {
    icon: Video,
    title: "Registra tus reuniones",
    text: "Programa una reunión, grábala y deja que la IA genere la minuta con resumen, puntos clave y acuerdos accionables.",
  },
  {
    icon: Sparkles,
    title: "Pregúntale al Copiloto IA",
    text: "En cada proyecto, abre el Copiloto IA y pregunta en lenguaje natural sobre documentos, minutas, tareas o el chat del equipo.",
  },
]

const MODULES = [
  {
    icon: KanbanSquare,
    title: "Tareas y Kanban",
    text: "Crea tareas con responsable, prioridad y fecha límite. El tablero refleja el estado en tiempo real y alimenta el dashboard.",
  },
  {
    icon: Video,
    title: "Reuniones y minutas (IA)",
    text: "Programa, graba y transcribe reuniones. La IA detecta el tipo (Daily, Planning, etc.), genera la minuta y sugiere tareas a partir de los acuerdos.",
  },
  {
    icon: FileText,
    title: "Documentos colaborativos",
    text: "Edita documentos en tiempo real con tu equipo, controla versiones y permisos, e impórtalos/expórtalos a DOCX.",
  },
  {
    icon: MessageSquare,
    title: "Chat de equipo",
    text: "Chat por proyecto y mensajes directos, con adjuntos, reacciones, convertir mensaje en tarea y resumen «¿Qué me perdí?».",
  },
  {
    icon: Sparkles,
    title: "Copiloto IA (RAG)",
    text: "Un asistente que conoce todo tu proyecto. Responde con citas a la fuente y acepta consultas por voz desde el micrófono.",
  },
  {
    icon: Bell,
    title: "Notificaciones",
    text: "Recibe avisos en tiempo real cuando te asignan tareas, cambian su estado, te agregan a un proyecto, inician una reunión o llega un mensaje.",
  },
]

const FAQS = [
  {
    q: "¿Cómo agrego a alguien a mi proyecto?",
    a: "Abre el proyecto y ve a la gestión de miembros. La persona recibirá una notificación de que fue agregada y verá el proyecto en su barra lateral.",
  },
  {
    q: "¿Cómo genero la minuta de una reunión?",
    a: "Inicia la reunión y graba el audio. Al finalizar, el audio se transcribe automáticamente y la IA produce la minuta con resumen, puntos clave y acuerdos. Desde los acuerdos puedes crear tareas.",
  },
  {
    q: "¿Qué puedo preguntarle al Copiloto IA?",
    a: "Cosas como «¿qué tareas están bloqueadas?», «resume el documento de arquitectura», «¿de qué se habló en el último planning?», «¿qué reuniones tengo esta semana?» o «¿qué reportes hay disponibles?». Responde citando la fuente.",
  },
  {
    q: "El micrófono del Copiloto no funciona, ¿qué hago?",
    a: "Asegúrate de permitir el acceso al micrófono cuando el navegador lo solicite (icono del candado en la barra de direcciones). El dictado graba un audio corto y lo transcribe; necesita un micrófono disponible y conexión con el servidor.",
  },
  {
    q: "¿Cómo convierto un mensaje del chat en una tarea?",
    a: "En el chat, abre las opciones del mensaje y elige «Convertir en tarea». Se creará una tarea en el proyecto enlazada a ese mensaje.",
  },
  {
    q: "¿Por qué algunas acciones tienen un pequeño retraso?",
    a: "Las funciones de IA (transcripción, minutas, Copiloto) procesan en segundo plano. La transcripción de audios largos puede tardar algunos minutos.",
  },
  {
    q: "¿Mis datos están aislados por proyecto?",
    a: "Sí. Solo ves el contenido de los proyectos a los que perteneces. El Copiloto y las búsquedas respetan esos permisos y nunca mezclan datos entre proyectos.",
  },
]

function ContactForm() {
  const { data: currentUser } = useCurrentUser()
  const { mutate: sendContact, isPending, isSuccess } = useSendSupportContact()

  const [form, setForm] = useState<ContactPayload>({
    subject: "",
    message: "",
    category: "other",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendContact(form)
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <p className="font-semibold text-gray-900 dark:text-white">
          ¡Mensaje enviado!
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Te responderemos en 24–48 h a{" "}
          <span className="font-medium">{currentUser?.email}</span>.
        </p>
        <Button variant="outline" size="sm" onClick={() => setForm({ subject: "", message: "", category: "other" })}>
          Enviar otro mensaje
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="category">Categoría</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm((f) => ({ ...f, category: v as ContactPayload["category"] }))}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">Error / Bug</SelectItem>
            <SelectItem value="feature">Solicitud de funcionalidad</SelectItem>
            <SelectItem value="billing">Facturación</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject">Asunto</Label>
        <Input
          id="subject"
          placeholder="Describe el asunto brevemente"
          maxLength={100}
          required
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Mensaje</Label>
        <Textarea
          id="message"
          placeholder="Cuéntanos con detalle tu consulta o problema…"
          rows={5}
          maxLength={2000}
          required
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
        <p className="text-right text-xs text-gray-400">{form.message.length}/2000</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Respuesta a{" "}
          <span className="font-medium">{currentUser?.email ?? "tu correo"}</span>
        </p>
        <Button type="submit" disabled={isPending}>
          <Send className="mr-2 h-4 w-4" />
          {isPending ? "Enviando…" : "Enviar mensaje"}
        </Button>
      </div>
    </form>
  )
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Hero */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ayuda y soporte
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Guías rápidas, preguntas frecuentes y cómo contactarnos. Todo lo que
            necesitas para sacarle el máximo a la plataforma.
          </p>
        </div>
      </div>

      {/* Quick start */}
      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Rocket className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          Primeros pasos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_START.map((item) => (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                {item.text}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          Funcionalidades
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Card key={m.title}>
              <CardHeader className="space-y-0 pb-2">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <m.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{m.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                {m.text}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Preguntas frecuentes
        </h2>
        <Card>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 dark:text-gray-400">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Contact form */}
      <section>
        <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-900/50 dark:bg-violet-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Contactar con soporte
            </CardTitle>
            <CardDescription>
              Envíanos tu consulta y te responderemos en 24–48 horas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
