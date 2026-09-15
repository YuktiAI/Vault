"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { UploadCloud, X, File as FileIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  currentFolderId: string | null
}

export function UploadModal({ isOpen, onClose, currentFolderId }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const totalFiles = files.length
      let completedFiles = 0

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const storagePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('vault')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream'
          })

        if (uploadError) throw uploadError

        // 2. Insert into files table
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            user_id: user.id,
            name: file.name,
            folder_id: currentFolderId,
            storage_path: storagePath,
            size: file.size,
            type: file.type || 'application/octet-stream',
          })

        if (dbError) throw dbError

        completedFiles++
        setProgress(Math.round((completedFiles / totalFiles) * 100))
      }

      // Success
      setFiles([])
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || "An error occurred during upload")
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Upload Files</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-500">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {files.length === 0 ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`
                h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors
                ${dragActive 
                  ? "border-blue-500 bg-blue-500/5" 
                  : "border-[var(--color-border)] bg-[var(--color-surface-2)]/30 hover:bg-[var(--color-surface-2)]/80 hover:border-[var(--color-text-muted)]"
                }
              `}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleChange}
              />
              <div className="w-12 h-12 mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-[var(--color-text)] mb-1">
                Drag and drop files here
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                or click to browse your computer
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Selected Files</h3>
                {!uploading && (
                  <button 
                    onClick={() => setFiles([])}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]">
                    <FileIcon className="w-5 h-5 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">{f.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
              </div>

              {uploading && (
                <div className="pt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--color-text-muted)]">Uploading...</span>
                    <span className="font-medium text-blue-400">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Files"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
