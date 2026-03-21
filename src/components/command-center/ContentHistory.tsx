import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../hooks/useLanguage'
import type { ContentGeneration } from '../../types'

export function ContentHistory() {
  const { t } = useLanguage()
  const [generations, setGenerations] = useState<ContentGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const { data } = await supabase
      .from('content_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    setGenerations(data || [])
    setLoading(false)
  }

  const handleCopySelected = async () => {
    if (selected.size === 0) return
    const content = generations
      .filter(g => selected.has(g.id))
      .map(g => g.generated_content)
      .join('\n\n---\n\n')
    await navigator.clipboard.writeText(content)
    setCopiedId('toolbar')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === generations.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(generations.map(g => g.id)))
    }
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    setDeleting(true)

    const ids = Array.from(selected)
    const { error } = await supabase
      .from('content_generations')
      .delete()
      .in('id', ids)

    if (!error) {
      setGenerations(prev => prev.filter(g => !selected.has(g.id)))
      setSelected(new Set())
      if (expanded && selected.has(expanded)) {
        setExpanded(null)
      }
    }

    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-1/3 mb-2" />
            <div className="h-3 bg-border rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <p className="text-text-secondary text-sm text-center py-8">
        {t('history.empty')}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar: Copy — Select All — N selected — Delete */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopySelected}
          disabled={selected.size === 0}
          className={`px-3 py-1.5 rounded-md text-[13px] font-mono transition-all border ${
            selected.size > 0
              ? 'border-[#2a3d6a] text-[#e2e8f0] hover:border-primary hover:text-primary'
              : 'border-[#2a3d6a] text-[#e2e8f0] opacity-40 cursor-not-allowed'
          }`}
        >
          {copiedId === 'toolbar' ? t('history.copied') : t('history.copy')}
        </button>

        <button
          onClick={toggleSelectAll}
          className={`px-3 py-1.5 rounded-md text-[13px] font-mono transition-all border ${
            selected.size === generations.length
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-[#2a3d6a] text-[#e2e8f0] hover:border-border-hover'
          }`}
        >
          {selected.size === generations.length ? t('history.deselectall') : t('history.selectall')}
        </button>

        {selected.size > 0 && (
          <span className="text-xs text-text-secondary font-mono">
            {selected.size} {t('history.selected')}
          </span>
        )}

        {selected.size > 0 && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 rounded-md text-xs font-mono border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
          >
            {deleting ? t('history.deleting') : t('history.delete')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {generations.map(gen => (
          <div
            key={gen.id}
            className={`bg-bg-card border rounded-lg p-3 transition-colors ${
              selected.has(gen.id)
                ? 'border-primary/40 bg-primary/5'
                : 'border-border hover:border-border-hover'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(gen.id) }}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  selected.has(gen.id)
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                {selected.has(gen.id) && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </button>

              {/* Content row — clickable to expand */}
              <div
                className="flex-1 flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(expanded === gen.id ? null : gen.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[14px] text-[#e2e8f0]">
                    {gen.input_type}
                  </span>
                  <span className="text-[#94a3b8] text-[14px]">&rarr;</span>
                  <span className="font-mono text-[13px] text-white bg-[#1e3a5f] px-1.5 py-0.5 rounded">
                    {gen.output_format}
                    {gen.platform ? ` (${gen.platform})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#94a3b8] font-mono">
                    {new Date(gen.created_at).toLocaleDateString()}
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className={`text-text-secondary transition-transform ${expanded === gen.id ? 'rotate-180' : ''}`}
                  >
                    <path d="M3 5l3 3 3-3" />
                  </svg>
                </div>
              </div>
            </div>

            {expanded === gen.id && (
              <div className="mt-3 pt-3 border-t border-border ml-7">
                <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {gen.generated_content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
