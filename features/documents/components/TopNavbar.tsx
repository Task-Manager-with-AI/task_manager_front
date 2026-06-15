"use client"

import { ChangeEvent, FormEvent, RefObject } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Share, Users, Download, FileText, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/components/locale-provider"

type TopNavbarProps = {
  projectId: string
  title: string
  originalTitle: string
  setTitle: (val: string) => void
  handleRename: (e: FormEvent<HTMLFormElement>) => void
  isSaving: boolean
  
  // File operations
  handleCreateSnapshot: () => void
  isCreatingVersion: boolean
  handleExportDocx: () => void
  isCreatingConversionJob: boolean
  latestVersionId?: string
  importFileInputRef: RefObject<HTMLInputElement>
  handleImportDocx: (e: ChangeEvent<HTMLInputElement>) => void
  fileInputRef: RefObject<HTMLInputElement>
  handleUpload: (e: ChangeEvent<HTMLInputElement>) => void
  isUploading: boolean
  
  onShareClick: () => void

  // Display
  isHistoryMode?: boolean
  activeUsers?: Array<{ id: string; name: string; color: string }>
  onExitHistory?: () => void
}

export function TopNavbar({
  projectId,
  title,
  originalTitle,
  setTitle,
  handleRename,
  isSaving,
  handleCreateSnapshot,
  isCreatingVersion,
  handleExportDocx,
  isCreatingConversionJob,
  latestVersionId,
  importFileInputRef,
  handleImportDocx,
  fileInputRef,
  handleUpload,
  isUploading,
  onShareClick,
  isHistoryMode = false,
  activeUsers = [],
  onExitHistory,
}: TopNavbarProps) {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <div className={`flex flex-col border-b border-gray-200 dark:border-gray-800 ${isHistoryMode ? "bg-gray-900 text-white" : "bg-white dark:bg-gray-900"}`}>
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left Section: Back, Title, File Menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/projects/${projectId}/documents`)}
            className={isHistoryMode ? "text-gray-300 hover:text-white hover:bg-gray-800" : ""}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-col">
            <form onSubmit={handleRename} className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isHistoryMode}
                className={`h-7 border-transparent px-2 py-1 text-lg font-bold shadow-none focus-visible:ring-0 ${
                  isHistoryMode ? "text-white hover:bg-gray-800 focus:bg-gray-800 focus:text-white" : "text-gray-900 hover:bg-gray-100 focus:bg-white dark:text-white"
                }`}
              />
              {title !== originalTitle && !isHistoryMode && (
                <Button type="submit" size="icon" variant="ghost" className="h-6 w-6" disabled={isSaving}>
                  <Save className="h-3 w-3" />
                </Button>
              )}
            </form>
            
            <div className="flex items-center gap-1 px-1 mt-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs font-semibold ${isHistoryMode ? "text-blue-400 hover:text-blue-300 hover:bg-gray-800" : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"}`}>
                    Archivo
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isUploading || isHistoryMode}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Subir Adjunto</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importFileInputRef.current?.click()} disabled={isHistoryMode}>
                    <Download className="mr-2 h-4 w-4 rotate-180" />
                    <span>Importar desde Word</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportDocx} disabled={!latestVersionId || isCreatingConversionJob || isHistoryMode}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Exportar a .docx</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreateSnapshot} disabled={isCreatingVersion || isHistoryMode}>
                    <Save className="mr-2 h-4 w-4" />
                    <span>Snapshot</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs ${isHistoryMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800" : "text-gray-600 dark:text-gray-400"}`}>
                Editar
              </Button>
              <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs ${isHistoryMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800" : "text-gray-600 dark:text-gray-400"}`}>
                Ver
              </Button>
              <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs ${isHistoryMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800" : "text-gray-600 dark:text-gray-400"}`}>
                Formato
              </Button>
            </div>
          </div>
        </div>

        {/* Right Section: Avatars, Share */}
        <div className="flex items-center gap-4">
          {!isHistoryMode && (
            <>
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white uppercase dark:border-gray-900"
                    style={{ backgroundColor: user.color || "#4F46E5" }}
                    title={user.name}
                  >
                    {user.name.charAt(0)}
                  </div>
                ))}
                {activeUsers.length > 3 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-bold text-gray-700 dark:border-gray-900 dark:bg-gray-800 dark:text-gray-300">
                    +{activeUsers.length - 3}
                  </div>
                )}
              </div>
              <Button 
                onClick={onShareClick}
                className="h-9 gap-2 rounded-full bg-blue-100 px-4 text-sm font-medium text-blue-900 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-100 dark:hover:bg-blue-900"
              >
                <Share className="h-4 w-4" />
                Compartir
              </Button>
            </>
          )}
          {isHistoryMode && (
            <Button
              variant="outline"
              onClick={onExitHistory}
              className="h-9 gap-2 bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white"
            >
              Saliendo del Historial
            </Button>
          )}
        </div>
      </div>
      
      {/* Hidden inputs for file operations */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
      <input
        ref={importFileInputRef}
        type="file"
        className="hidden"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleImportDocx}
      />
    </div>
  )
}
