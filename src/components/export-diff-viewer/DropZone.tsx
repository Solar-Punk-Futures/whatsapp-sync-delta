import { useCallback, useState } from "react"
import { Upload, FileText } from "lucide-react"
import { cn } from "../../lib/utils"

interface DropZoneProps {
  onFileUpload?: (file: File) => void
}

export function DropZone({ onFileUpload }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFileUpload?.(file)
    },
    [onFileUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileUpload?.(file)
    },
    [onFileUpload]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 transition-all duration-200",
        isDragging
          ? "border-emerald-400 bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-12 items-center justify-center rounded-full transition-colors duration-200",
          isDragging
            ? "bg-emerald-100 dark:bg-emerald-900/50"
            : "bg-zinc-100 dark:bg-zinc-800"
        )}
      >
        {isDragging ? (
          <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Upload className="size-5 text-zinc-400 dark:text-zinc-500" />
        )}
      </div>

      <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {isDragging ? "Drop your export file" : "Drop a WhatsApp export here"}
      </p>
      <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
        .txt file exported from WhatsApp
      </p>

      <label className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200">
        Browse files
        <input
          type="file"
          accept=".txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>
    </div>
  )
}
