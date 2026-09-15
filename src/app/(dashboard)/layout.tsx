"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { HardDrive, Home, Clock, Star, Trash2, Database, Settings, LogOut, Menu, X, Plus } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

import { UploadModal } from "@/components/UploadModal"
import { NewFolderModal } from "@/components/NewFolderModal"
import { FileUp, FolderPlus } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [newDropdownOpen, setNewDropdownOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const navItems = [
    { href: "/", icon: Home, label: "My Drive" },
    { href: "/recent", icon: Clock, label: "Recent" },
    { href: "/starred", icon: Star, label: "Starred" },
    { href: "/trash", icon: Trash2, label: "Trash" },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex overflow-hidden">
      <UploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        currentFolderId={null} 
      />
      
      <NewFolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        currentFolderId={null}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)]
        transform transition-transform duration-200 ease-in-out flex flex-col
        lg:relative lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[var(--color-text)]">Vault</span>
          </Link>
          <button 
            className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 relative">
          <button 
            onClick={() => setNewDropdownOpen(!newDropdownOpen)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New
          </button>
          
          {newDropdownOpen && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden z-10">
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
                onClick={() => {
                  setUploadModalOpen(true)
                  setNewDropdownOpen(false)
                }}
              >
                <FileUp className="w-4 h-4 text-blue-400" />
                File Upload
              </button>
              <div className="h-px bg-[var(--color-border)]" />
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
                onClick={() => {
                  setFolderModalOpen(true)
                  setNewDropdownOpen(false)
                }}
              >
                <FolderPlus className="w-4 h-4 text-blue-400" />
                New Folder
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-blue-500/10 text-blue-500" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-4 px-4 lg:px-8 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 backdrop-blur-sm sticky top-0 z-30">
          <button 
            className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-2 -ml-2 rounded-lg hover:bg-[var(--color-surface-2)]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 flex items-center justify-between">
            {/* Search could go here */}
            <div className="flex-1" />
            
            <div className="flex items-center gap-4">
              {/* Profile or other top actions */}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
