import { useState, useCallback, useRef } from 'react'

interface MediaDropZoneProps {
  onMediaAdded: (placeholder: string) => void
}

export function MediaDropZone({ onMediaAdded }: MediaDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [droppedFiles, setDroppedFiles] = useState<string[]>([])
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const placeholder = `[IMAGE: ${file.name}]`
        setDroppedFiles(prev => [...prev, file.name])
        onMediaAdded(placeholder)
      }
    }
  }, [onMediaAdded])

  const handleAddUrl = useCallback(() => {
    const url = urlInput.trim()
    if (!url) return

    let placeholder: string
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      placeholder = `[VIDEO: ${url}]`
    } else if (url.includes('tiktok.com')) {
      placeholder = `[TIKTOK: ${url}]`
    } else if (url.includes('instagram.com')) {
      placeholder = `[INSTAGRAM: ${url}]`
    } else {
      placeholder = `[MEDIA: ${url}]`
    }

    setDroppedFiles(prev => [...prev, url])
    onMediaAdded(placeholder)
    setUrlInput('')
  }, [urlInput, onMediaAdded])

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border border-dashed rounded-lg px-4 py-3 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border text-text-secondary hover:border-border-hover'
        }`}
      >
        <p className="text-xs font-mono">
          {isDragging ? 'Drop images here' : 'Drop screenshots/photos here or paste a URL below'}
        </p>
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
          placeholder="Paste YouTube or social URL..."
          className="flex-1 bg-bg-card border border-border rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="px-3 py-1.5 text-xs font-mono bg-bg-card border border-border rounded-md hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
        >
          Add
        </button>
      </div>

      {/* Added media list */}
      {droppedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {droppedFiles.map((f, i) => (
            <span key={i} className="text-[10px] font-mono bg-bg-card border border-border rounded px-2 py-0.5 text-text-secondary truncate max-w-[200px]">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
