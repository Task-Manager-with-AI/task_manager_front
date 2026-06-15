"use client"

import { useState } from "react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/components/locale-provider"
import { useDocumentPermissions, useSetDocumentPermissions } from "@/features/documents/documents.hooks"
import type { DocumentAuthor, DocumentPermissionRole } from "@/features/documents/documents.types"

type ShareDocumentModalProps = {
  documentId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  owner?: DocumentAuthor
}

export function ShareDocumentModal({ documentId, isOpen, onOpenChange, owner }: ShareDocumentModalProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")

  const { data: permissions, isLoading } = useDocumentPermissions(documentId)
  const { mutate: setPermissions, isPending } = useSetDocumentPermissions(documentId)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  const handleRoleChange = (userId: string, newRole: DocumentPermissionRole) => {
    if (!permissions) return
    
    // Map current permissions to the format expected by the mutation
    const newPermissionsList = permissions.map(p => ({
      userId: p.userId,
      role: p.userId === userId ? newRole : p.role
    }))

    setPermissions(newPermissionsList)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir documento</DialogTitle>
          <DialogDescription>
            Agrega personas o grupos para que colaboren en este documento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-4">
          <Input
            placeholder="Agregar personas o grupos..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button disabled={!email.trim()}>Invitar</Button>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Personas con acceso
          </h4>

          {/* Owner */}
          {owner && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-white uppercase">
                  {owner.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{owner.name} (Propietario)</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">Propietario</span>
            </div>
          )}

          {isLoading && (
            <div className="text-sm text-gray-500 py-2">Cargando accesos...</div>
          )}

          {/* Users with access */}
          {(permissions ?? []).map((perm) => {
            // Avoid listing owner if they somehow got into permissions list
            if (perm.userId === owner?.id) return null

            return (
              <div key={perm.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white uppercase">
                    {perm.user?.name.charAt(0) || "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{perm.user?.name || "Usuario"}</span>
                  </div>
                </div>
                <Select 
                  disabled={isPending}
                  value={perm.role} 
                  onValueChange={(val) => handleRoleChange(perm.userId, val as DocumentPermissionRole)}
                >
                  <SelectTrigger className="w-[120px] h-8 border-none shadow-none text-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="COMMENTER">Comentador</SelectItem>
                    <SelectItem value="VIEWER">Lector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="ghost" size="sm" className="gap-2 text-blue-600" onClick={handleCopyLink}>
            <Copy className="h-4 w-4" />
            Copiar enlace
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Hecho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
