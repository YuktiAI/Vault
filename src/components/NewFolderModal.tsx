"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { X, FolderPlus, Loader2, AlertCircle } from "lucide-react"

interface NewFolderModalProps {
  isOpen: boolean
  onClose: () => void
  currentFolderId: string | null
}

export function NewFolderModal({ isOpen, onClose, currentFolderId }: NewFolderModalProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: dbError } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: name.trim(),
          parent_id: currentFolderId,
        })

      if (dbError) throw dbError

      // Success
      setName("")
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the folder")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-500" />
            New Folder
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate}>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-500">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="folderName" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Folder Name
              </label>
              <input
                id="folderName"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Untitled folder"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/20 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
