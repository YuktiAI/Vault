"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react"

interface FolderActionsProps {
  folder: { id: string; name: string }
}

export function FolderActions({ folder }: FolderActionsProps) {
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(folder.name)
  const [loading, setLoading] = useState<"rename" | "delete" | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Focus input when rename mode activates
  useEffect(() => {
    if (renaming) inputRef.current?.focus()
  }, [renaming])

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed || trimmed === folder.name) {
      setRenaming(false)
      return
    }
    setLoading("rename")
    const { error } = await supabase
      .from("folders")
      .update({ name: trimmed })
      .eq("id", folder.id)

    setLoading(null)
    if (error) {
      alert("Failed to rename folder.")
    } else {
      setRenaming(false)
      router.refresh()
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(false)
    if (!confirm(`Delete folder "${folder.name}"? Files inside will also be removed.`)) return

    setLoading("delete")
    try {
      // Get all files in this folder to remove from storage
      const { data: files } = await supabase
        .from("files")
        .select("storage_path, id")
        .eq("folder_id", folder.id)

      if (files && files.length > 0) {
        await supabase.storage.from("vault").remove(files.map((f) => f.storage_path))
        await supabase.from("files").delete().eq("folder_id", folder.id)
      }

      // Delete the folder itself
      const { error } = await supabase.from("folders").delete().eq("id", folder.id)
      if (error) throw error

      router.refresh()
    } catch {
      alert("Failed to delete folder.")
    } finally {
      setLoading(null)
    }
  }

  if (renaming) {
    return (
      <form onSubmit={handleRename} onClick={(e) => e.stopPropagation()} className="flex-1 flex items-center gap-2">
        <input
          ref={inputRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
          className="flex-1 px-2 py-1 text-sm rounded-lg border border-zinc-500 bg-[var(--color-bg)] text-[var(--color-text)] outline-none min-w-0"
        />
        <button
          type="submit"
          disabled={!!loading}
          className="text-xs text-zinc-200 hover:text-white font-medium shrink-0"
        >
          {loading === "rename" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setRenaming(false) }}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] shrink-0"
        >
          Cancel
        </button>
      </form>
    )
  }

  return (
    <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        disabled={!!loading}
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-3)] transition-colors opacity-0 group-hover:opacity-100"
        title="Folder options"
      >
        {loading === "delete" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MoreVertical className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); setRenaming(true) }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
            Rename
          </button>
          <div className="h-px bg-[var(--color-border)]" />
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
