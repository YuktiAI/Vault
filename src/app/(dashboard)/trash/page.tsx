import { Trash2 } from "lucide-react"

export default function TrashPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Trash</h1>
      
      <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]/30">
        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
          <Trash2 className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text)] mb-1">Trash is empty</h3>
        <p className="text-sm text-[var(--color-text-muted)] text-center max-w-sm">
          Items in the trash will be deleted forever after 30 days.
        </p>
      </div>
    </div>
  )
}
