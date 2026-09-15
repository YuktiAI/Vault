import { Star } from "lucide-react"

export default function StarredPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Starred</h1>
      
      <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/30">
        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
          <Star className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text)] mb-1">No starred files</h3>
        <p className="text-sm text-[var(--color-text-muted)] text-center max-w-sm">
          Add stars to files or folders that you want to easily find later.
        </p>
      </div>
    </div>
  )
}
