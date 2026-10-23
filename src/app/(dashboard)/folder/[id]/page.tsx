import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { File, Folder, ChevronRight } from "lucide-react"
import { FileActions } from "@/components/FileActions"
import { FolderActions } from "@/components/FolderActions"
import Link from "next/link"
import { notFound } from "next/navigation"

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
  parent_id: string | null
}

export default async function FolderPage({ params }: { params: { id: string } }) {
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

  // Get current folder info
  const { data: currentFolder } = await supabase
    .from('folders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!currentFolder) notFound()

  // Get parent folder if any (for breadcrumb)
  let parentFolder: FolderData | null = null
  if (currentFolder.parent_id) {
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('id', currentFolder.parent_id)
      .single()
    parentFolder = data
  }

  // Fetch subfolders and files inside this folder
  const [{ data: folders }, { data: files }] = await Promise.all([
    supabase
      .from('folders')
      .select('*')
      .eq('parent_id', params.id)
      .order('name'),
    supabase
      .from('files')
      .select('*')
      .eq('folder_id', params.id)
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          My Drive
        </Link>
        {parentFolder && (
          <>
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            <Link href={`/folder/${parentFolder.id}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              {parentFolder.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
        <span className="font-medium text-[var(--color-text)]">{currentFolder.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-[var(--color-text)]">{currentFolder.name}</h1>

      {/* Subfolders */}
      {folders && folders.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder: FolderData) => (
              <div
                key={folder.id}
                className="relative flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-colors group"
              >
                <Link href={`/folder/${folder.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Folder className="w-5 h-5 text-blue-500 fill-blue-500/20 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
                </Link>
                <FolderActions folder={folder} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Files */}
      <section>
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Files</h2>

        {!files || files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/30">
            <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
              <File className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text)] mb-1">This folder is empty</h3>
            <p className="text-sm text-[var(--color-text-muted)] text-center max-w-sm">
              Upload files using the New button to add them here.
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
