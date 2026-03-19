import { useState, useRef, useEffect } from 'react'
import { MediaDropZone } from './MediaDropZone'
import type { OutputFormat } from '../../types'

export interface Draft {
  id: string
  content: string
  format: OutputFormat
  platform?: string
  createdAt: Date
}

interface DraftsSectionProps {
  drafts: Draft[]
  onUpdateDraft: (id: string, content: string) => void
  onDeleteDraft: (id: string) => void
  onPublishBlog: (content: string) => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

function DraftCard({
  draft,
  onUpdate,
  onDelete,
  onPublishBlog,
}: {
  draft: Draft
  onUpdate: (content: string) => void
  onDelete: () => void
  onPublishBlog?: (content: string) => void
}) {
  const [expanded, setExpanded] = useState(true) // Most recent draft starts expanded
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (expanded && textareaRef.current) {
      const ta = textareaRef.current
      ta.style.height = 'auto'
      ta.style.height = Math.max(200, Math.min(ta.scrollHeight, 600)) + 'px'
    }
  }, [expanded, draft.content])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMediaAdded = (placeholder: string) => {
    onUpdate(draft.content + '\n\n' + placeholder)
  }

  const formatLabel = draft.format === 'social'
    ? `Social${draft.platform ? ` (${draft.platform})` : ''}`
    : draft.format === 'blog'
      ? 'Blog Article'
      : draft.format === 'video'
        ? 'Video Prompt'
        : 'X Thread'

  return (
    <div className="bg-bg-card border border-border rounded-lg transition-colors hover:border-border-hover">
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary">{formatLabel}</span>
          <span className="text-border text-xs">·</span>
          <span className="text-xs text-text-secondary font-mono">
            {draft.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-border text-xs">·</span>
          <span className="text-xs text-text-secondary font-mono">
            {draft.content.length} chars
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Copy & Delete in header */}
          <button
            onClick={e => { e.stopPropagation(); handleCopy() }}
            className="px-3 py-1 text-xs font-mono border border-border rounded-md hover:border-primary hover:text-primary transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {draft.format === 'blog' && onPublishBlog && (
            <button
              onClick={e => { e.stopPropagation(); onPublishBlog(draft.content) }}
              className="px-3 py-1 text-xs font-mono bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              Publish
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="px-3 py-1 text-xs font-mono border border-border rounded-md hover:border-red-400 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
            className={`text-text-secondary transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M3 5l3 3 3-3" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <textarea
            ref={textareaRef}
            value={draft.content}
            onChange={e => onUpdate(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-sm text-text-primary leading-relaxed focus:outline-none focus:border-primary resize-y font-mono"
            style={{ minHeight: '200px' }}
          />
          <MediaDropZone onMediaAdded={handleMediaAdded} />
        </div>
      )}
    </div>
  )
}

export function DraftsSection({
  drafts,
  onUpdateDraft,
  onDeleteDraft,
  onPublishBlog,
  collapsed,
  onToggleCollapsed,
}: DraftsSectionProps) {
  return (
    <div>
      {/* Section heading — matches History style */}
      <div
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={onToggleCollapsed}
      >
        <div>
          <h2 className="font-semibold text-text-primary mb-1">Blog / Social Media Drafts</h2>
          <p className="text-xs text-text-secondary">
            {drafts.length === 0
              ? 'Generated content will appear here as editable drafts.'
              : `${drafts.length} draft${drafts.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={`text-text-secondary transition-transform ${collapsed ? '' : 'rotate-180'}`}
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </div>

      {!collapsed && (
        <div className="space-y-3">
          {drafts.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-6 border border-dashed border-border rounded-lg">
              No drafts yet. Generate content above to create your first draft.
            </p>
          ) : (
            drafts.map(draft => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onUpdate={content => onUpdateDraft(draft.id, content)}
                onDelete={() => onDeleteDraft(draft.id)}
                onPublishBlog={onPublishBlog}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
