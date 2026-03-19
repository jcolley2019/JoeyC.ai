import { useState, useCallback, useRef, useEffect } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

export interface MediaAttachment {
  type: 'image' | 'video' | 'url'
  name: string
  preview?: string // data URL for image thumbnails, or object URL for video
}

interface MediaInputProps {
  attachments: MediaAttachment[]
  onAttachmentsChange: (attachments: MediaAttachment[]) => void
}

export function MediaInput({ attachments, onAttachmentsChange }: MediaInputProps) {
  const { t } = useLanguage()
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const addMediaFile = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) return

    if (isImage) {
      const reader = new FileReader()
      reader.onload = () => {
        onAttachmentsChange([...attachments, {
          type: 'image',
          name: file.name,
          preview: reader.result as string,
        }])
      }
      reader.readAsDataURL(file)
    } else {
      const objectUrl = URL.createObjectURL(file)
      onAttachmentsChange([...attachments, {
        type: 'video',
        name: file.name,
        preview: objectUrl,
      }])
    }
  }, [attachments, onAttachmentsChange])

  // Clipboard paste handler (Ctrl+V) — supports Snipping Tool
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            const name = `pasted-image-${Date.now()}.${file.type.split('/')[1] || 'png'}`
            const renamedFile = new File([file], name, { type: file.type })
            addMediaFile(renamedFile)
          }
          return
        }
      }
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [addMediaFile])

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
    for (const file of Array.from(e.dataTransfer.files)) {
      addMediaFile(file)
    }
  }, [addMediaFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    for (const file of Array.from(e.target.files || [])) {
      addMediaFile(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [addMediaFile])

  const handleAddUrl = useCallback(() => {
    const url = urlInput.trim()
    if (!url) return
    onAttachmentsChange([...attachments, { type: 'url', name: url }])
    setUrlInput('')
  }, [urlInput, attachments, onAttachmentsChange])

  const removeAttachment = useCallback((index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index))
  }, [attachments, onAttachmentsChange])

  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-medium text-text-secondary mb-0.5">{t('media.label')}</label>

      {/* Full drop zone — click or drag files anywhere in this area */}
      <div
        ref={containerRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg px-4 py-8 text-center transition-all cursor-pointer min-h-[140px] flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-primary bg-primary/10 text-primary scale-[1.01]'
            : 'border-border/60 text-text-secondary hover:border-primary/40 hover:bg-primary/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-mono">
          {isDragging ? t('media.drop') : t('media.drag')}
        </p>
        <p className="text-[10px] text-text-secondary/50 font-mono">
          {t('media.browse')} &middot; {t('media.paste')}
        </p>

        {/* Thumbnail gallery inside the drop zone */}
        {attachments.filter(a => a.type === 'image' || a.type === 'video').length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 justify-center" onClick={e => e.stopPropagation()}>
            {attachments.map((att, i) => (att.type === 'image' || att.type === 'video') && (
              <div key={i} className="relative group">
                {att.type === 'image' ? (
                  <img
                    src={att.preview}
                    alt={att.name}
                    className="w-16 h-16 object-cover rounded-md border border-border"
                  />
                ) : (
                  <div className="relative w-16 h-16 rounded-md border border-border overflow-hidden bg-black/40">
                    <video
                      src={att.preview}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
                      </svg>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
                <p className="text-[9px] font-mono text-text-secondary truncate max-w-[64px] mt-0.5">{att.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <input
          type="text"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
          placeholder={t('media.url.placeholder')}
          className="flex-1 bg-bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="px-4 py-2.5 text-sm font-mono bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-30"
        >
          {t('media.add')}
        </button>
      </div>

      {/* URL attachments */}
      {attachments.filter(a => a.type === 'url').length > 0 && (
        <div className="flex flex-wrap gap-1">
          {attachments.map((att, i) => att.type === 'url' && (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono bg-bg-card border border-border rounded-full px-2.5 py-0.5 text-text-secondary">
              <span className="truncate max-w-[180px]">{att.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-red-400 hover:text-red-300">&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
