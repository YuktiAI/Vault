import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { File, Folder, MoreVertical } from "lucide-react"
import { FileActions } from "@/components/FileActions"

// Types matching our Supabase schema
type FileData = {
  id: string
  name: string
  size: number
  type: string
  created_at: string
  storage_path: string
}

type FolderData = {
  id: string
  name: string
  created_at: string
}

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // Fetch top-level folders and files (where parent_id / folder_id is null)
  const [{ data: folders }, { data: files }] = await Promise.all([
    supabase
      .from('folders')
      .select('*')
      .is('parent_id', null)
      .order('name'),
    supabase
      .from('files')
      .select('*')
      .is('folder_id', null)
      .is('is_trashed', false)
      .order('created_at', { ascending: false })
  ])

  function formatSize(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">My Drive</h1>

      {/* Folders Section */}
      {folders && folders.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder: FolderData) => (
              <div 
                key={folder.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer group"
              >
                <Folder className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--color-surface-3)] rounded text-[var(--color-text-muted)] transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Files Section */}
      <section>
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Files</h2>
        
        {!files || files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/30">
            <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
              <File className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text)] mb-1">No files yet</h3>
            <p className="text-sm text-[var(--color-text-muted)] text-center max-w-sm">
              Upload files or create folders to get started. Drag and drop works too!
            </p>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/50 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              <div className="col-span-6 lg:col-span-7">Name</div>
              <div className="col-span-3 lg:col-span-2 hidden md:block">Date Modified</div>
              <div className="col-span-3 lg:col-span-2 text-right">Size</div>
              <div className="col-span-3 md:col-span-1"></div>
            </div>
            
            <div className="divide-y divide-[var(--color-border)]">
              {files.map((file: FileData) => (
                <div 
                  key={file.id}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[var(--color-surface-2)] transition-colors group cursor-pointer"
                >
                  <div className="col-span-6 lg:col-span-7 flex items-center gap-3 overflow-hidden">
                    <File className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{file.name}</span>
                  </div>
                  <div className="col-span-3 lg:col-span-2 hidden md:block text-sm text-[var(--color-text-muted)]">
                    {new Date(file.created_at).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 lg:col-span-2 text-sm text-[var(--color-text-muted)] text-right">
                    {formatSize(file.size)}
                  </div>
                  <div className="col-span-3 md:col-span-1 flex justify-end">
                    <FileActions file={file} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
