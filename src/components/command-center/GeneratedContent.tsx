import { useState, useRef, useEffect } from 'react'
import { MediaDropZone } from './MediaDropZone'
import type { OutputFormat } from '../../types'

interface GeneratedContentProps {
  content: string
  format: OutputFormat
  onContentChange: (content: string) => void
  onPublishBlog?: () => void
  onExpandToBlog?: () => void
  expandingToBlog?: boolean
  onClearOutput: () => void
}

export function GeneratedContent({ content, format, onContentChange, onPublishBlog, onExpandToBlog, expandingToBlog, onClearOutput }: GeneratedContentProps) {
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to fit content
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.max(400, Math.min(ta.scrollHeight, 800)) + 'px'
    }
  }, [content])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMediaAdded = (placeholder: string) => {
    // Insert placeholder at the end of the content
    onContentChange(content + '\n\n' + placeholder)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">
          Generated {format === 'social' ? 'Post' : format === 'blog' ? 'Article' : format === 'video' ? 'Video Prompt' : 'Thread'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-mono bg-bg-card border border-border rounded-md hover:border-primary hover:text-primary transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {format !== 'blog' && onExpandToBlog && (
            <button
              onClick={onExpandToBlog}
              disabled={expandingToBlog}
              className="px-3 py-1.5 text-xs font-mono bg-accent/10 border border-accent/30 text-accent rounded-md hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              {expandingToBlog ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Expanding...
                </span>
              ) : (
                'Expand to Blog'
              )}
            </button>
          )}
          {format === 'blog' && onPublishBlog && (
            <button
              onClick={onPublishBlog}
              className="px-3 py-1.5 text-xs font-mono bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              Publish to Site
            </button>
          )}
          <button
            onClick={onClearOutput}
            className="px-3 py-1.5 text-xs font-mono bg-bg-card border border-border rounded-md hover:border-red-400/50 hover:text-red-400 transition-colors"
          >
            Clear Output
          </button>
        </div>
      </div>

      {/* Editable full-width textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => onContentChange(e.target.value)}
        className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-sm text-text-primary leading-relaxed focus:outline-none focus:border-primary resize-y font-mono"
        style={{ minHeight: '400px' }}
      />

      {/* Media drop zone */}
      <MediaDropZone onMediaAdded={handleMediaAdded} />
    </div>
  )
}
