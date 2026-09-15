"use client"

import { useState } from "react"
import { Download, Eye, Trash2, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface FileData {
  id: string
  name: string
  storage_path: string
}

export function FileActions({ file }: { file: FileData }) {
  const [loadingAction, setLoadingAction] = useState<"view" | "download" | "delete" | null>(null)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingAction("download")
    try {
      const { data, error } = await supabase.storage
        .from('vault')
        .download(file.storage_path)
      
      if (error) throw error
      
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading file:", error)
      alert("Failed to download file.")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleView = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingAction("view")
    try {
      const { data, error } = await supabase.storage
        .from('vault')
        .createSignedUrl(file.storage_path, 60, {
          download: false
        })
        
      if (error) throw error
      
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error("Error viewing file:", error)
      alert("Failed to open file.")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to permanently delete "${file.name}"?`)) return
    
    setLoadingAction("delete")
    try {
      // 1. Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('vault')
        .remove([file.storage_path])
        
      if (storageError) throw storageError
      
      // 2. Delete from Database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id)
        
      if (dbError) throw dbError
      
      router.refresh()
    } catch (error) {
      console.error("Error deleting file:", error)
      alert("Failed to delete file.")
      setLoadingAction(null)
    }
  }

  return (
    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
      <button 
        onClick={handleView}
        disabled={!!loadingAction}
        title="View"
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-blue-400 hover:bg-blue-400/10 transition-colors disabled:opacity-50"
      >
        {loadingAction === "view" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
      </button>
      
      <button 
        onClick={handleDownload}
        disabled={!!loadingAction}
        title="Download"
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-50"
      >
        {loadingAction === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>

      <button 
        onClick={handleDelete}
        disabled={!!loadingAction}
        title="Delete"
        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        {loadingAction === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
