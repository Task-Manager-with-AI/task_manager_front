"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useCreateDiagram } from "../documents.hooks"
import type { DiagramType, GeneratedDiagram } from "../documents.types"

type DiagramGeneratorModalProps = {
  isOpen: boolean
  projectId: string
  documentId?: string
  onClose: () => void
  onGenerate: (diagram: GeneratedDiagram) => void
}

const DEFAULT_PLACEHOLDER = "Ejemplo: Sistema de gestion de usuarios con autenticacion..."
const SEQUENCE_PLACEHOLDER =
  "Ejemplo: Usuario inicia sesion, el frontend envia credenciales al backend, el backend consulta la base de datos y responde exito o error."
const ACTIVITY_PLACEHOLDER =
  "Ejemplo: Cliente confirma pedido, el sistema valida stock y fraude en paralelo, sincroniza resultados, decide si aprueba el pago, genera orden y finaliza."
const COMPONENT_PLACEHOLDER =
  "Ejemplo: Cliente web consume API Gateway, el gateway se comunica con servicios de autenticacion, catalogo y pedidos, pedidos depende de pagos, inventario y base de datos."
const DEPLOYMENT_PLACEHOLDER =
  "Ejemplo: Navegador del cliente se conecta a un servidor web, este enruta a un app server con API y worker, usa PostgreSQL y se integra con pagos y notificaciones."

export function DiagramGeneratorModal({
  isOpen,
  projectId,
  documentId,
  onClose,
  onGenerate,
}: DiagramGeneratorModalProps) {
  const [prompt, setPrompt] = useState("")
  const [diagramType, setDiagramType] = useState<DiagramType>("class")
  const { mutateAsync: createDiagram, isPending: isGenerating } = useCreateDiagram(
    projectId,
    documentId
  )

  const isSequenceDiagram = diagramType === "sequence"
  const isActivityDiagram = diagramType === "activity"
  const isComponentDiagram = diagramType === "component"
  const isDeploymentDiagram = diagramType === "deployment"
  const description = isSequenceDiagram
    ? "Describe el flujo de interaccion entre participantes. La Inteligencia Artificial analizara actores, mensajes y fragmentos para generar el diagrama de secuencia con Kroki/PlantUML."
    : isActivityDiagram
      ? "Describe un flujo de trabajo con inicio, acciones, decisiones, paralelismo y responsables cuando aplique. La Inteligencia Artificial estructurara el proceso para generar el diagrama de actividad."
      : isComponentDiagram
        ? "Describe la arquitectura por componentes, capas y dependencias. La Inteligencia Artificial organizara componentes, sistemas externos e integraciones para generar el diagrama de componentes."
        : isDeploymentDiagram
          ? "Describe una escena de infraestructura con cliente, servidor web, app server, base de datos, integraciones y artefactos desplegados. La Inteligencia Artificial organizara el despliegue para generar un diagrama mas visual y legible."
      : "Describe el diagrama que deseas generar. La Inteligencia Artificial analizara el texto y Kroki/PlantUML dibujara el modelo."
  const placeholder = isSequenceDiagram
    ? SEQUENCE_PLACEHOLDER
    : isActivityDiagram
      ? ACTIVITY_PLACEHOLDER
      : isComponentDiagram
        ? COMPONENT_PLACEHOLDER
        : isDeploymentDiagram
          ? DEPLOYMENT_PLACEHOLDER
      : DEFAULT_PLACEHOLDER

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    try {
      const diagram = await createDiagram({
        prompt,
        diagram_type: diagramType,
      })
      onGenerate(diagram)
      setPrompt("")
      onClose()
    } catch (error) {
      console.error("Diagram generation error:", error)
      const errorMessage =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Hubo un error al generar el diagrama."
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generador de Diagramas UML</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Tipo de Diagrama</label>
            <Select value={diagramType} onValueChange={(value) => setDiagramType(value as DiagramType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de diagrama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Diagrama de Clases (Logical)</SelectItem>
                <SelectItem value="use_case">Diagrama de Casos de Uso</SelectItem>
                <SelectItem value="sequence">Diagrama de Secuencia</SelectItem>
                <SelectItem value="activity">Diagrama de Actividad</SelectItem>
                <SelectItem value="component">Diagrama de Componentes</SelectItem>
                <SelectItem value="deployment">Diagrama de Despliegue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Requerimiento</label>
            <Textarea
              placeholder={placeholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando diagrama...
              </>
            ) : (
              "Generar e Insertar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
