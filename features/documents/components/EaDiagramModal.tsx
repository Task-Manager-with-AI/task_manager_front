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

type EaDiagramModalProps = {
  isOpen: boolean
  onClose: () => void
  onGenerate: (imageUrl: string) => void
}

const DEFAULT_PLACEHOLDER = "Ejemplo: Sistema de gestión de usuarios con autenticación..."
const SEQUENCE_PLACEHOLDER =
  "Ejemplo: Usuario inicia sesión, el frontend envía credenciales al backend, el backend consulta la base de datos y responde éxito o error."

export function EaDiagramModal({ isOpen, onClose, onGenerate }: EaDiagramModalProps) {
  const [prompt, setPrompt] = useState("")
  const [diagramType, setDiagramType] = useState("class")
  const [isGenerating, setIsGenerating] = useState(false)

  const isSequenceDiagram = diagramType === "sequence"
  const description = isSequenceDiagram
    ? "Describe el flujo de interacción entre participantes. La Inteligencia Artificial analizará actores, mensajes y fragmentos del escenario para que Enterprise Architect genere el diagrama de secuencia."
    : "Describe el diagrama que deseas generar. La Inteligencia Artificial analizará el texto y Enterprise Architect dibujará el modelo."
  const placeholder = isSequenceDiagram ? SEQUENCE_PLACEHOLDER : DEFAULT_PLACEHOLDER

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    const aiBackendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL || "http://localhost:8000"
    try {
      const response = await fetch(`${aiBackendUrl}/api/v1/ea/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, diagram_type: diagramType }),
      })

      if (!response.ok) {
        let errorMessage = "Error generating diagram"
        try {
          const errorBody = await response.json()
          if (typeof errorBody?.detail === "string" && errorBody.detail.trim()) {
            errorMessage = errorBody.detail
          }
        } catch {
          // Keep default message when the backend does not return JSON.
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.status === "success" && data.url) {
        onGenerate(data.url)
        setPrompt("")
        onClose()
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("EA Generation error:", error)
      const errorMessage =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Hubo un error al conectar con Enterprise Architect."
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generador de Arquitectura (Enterprise Architect)</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Tipo de Diagrama</label>
            <Select value={diagramType} onValueChange={setDiagramType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de diagrama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Diagrama de Clases (Logical)</SelectItem>
                <SelectItem value="use_case">Diagrama de Casos de Uso</SelectItem>
                <SelectItem value="sequence">Diagrama de Secuencia</SelectItem>
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
                Generando EA...
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
