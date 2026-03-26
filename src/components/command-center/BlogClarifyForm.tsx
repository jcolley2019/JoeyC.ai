import { useState, useEffect } from 'react'
import { MediaInput, type MediaAttachment } from './MediaInput'
import { useLanguage } from '../../hooks/useLanguage'

export interface BlogClarifyData {
  tools: string
  details: string
  affiliateLinks: { name: string; url: string }[]
  mediaRefs: string
  mediaAttachments: MediaAttachment[]
}

interface BlogClarifyFormProps {
  onDataChange: (data: BlogClarifyData) => void
  onSkip?: () => void
}

export function BlogClarifyForm({ onDataChange, onSkip }: BlogClarifyFormProps) {
  const { t } = useLanguage()
  const [tools, setTools] = useState('')
  const [details, setDetails] = useState('')
  const [affiliateLinks, setAffiliateLinks] = useState<{ name: string; url: string }[]>([])
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [mediaRefs, _setMediaRefs] = useState('')
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([])

  // Report data changes up
  useEffect(() => {
    // Include any pending link in the reported data
    const pendingLinks = linkName.trim() && linkUrl.trim()
      ? [...affiliateLinks, { name: linkName.trim(), url: linkUrl.trim() }]
      : affiliateLinks
    onDataChange({ tools, details, affiliateLinks: pendingLinks, mediaRefs, mediaAttachments })
  }, [tools, details, affiliateLinks, linkName, linkUrl, mediaRefs, mediaAttachments, onDataChange])

  const addLink = () => {
    if (linkName.trim() && linkUrl.trim()) {
      setAffiliateLinks([...affiliateLinks, { name: linkName.trim(), url: linkUrl.trim() }])
      setLinkName('')
      setLinkUrl('')
    }
  }

  const removeLink = (index: number) => {
    setAffiliateLinks(affiliateLinks.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5 relative">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-primary uppercase tracking-wider">{t('clarify.title')}</p>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-xs font-mono text-text-secondary hover:text-primary transition-colors"
          >
            Skip →
          </button>
        )}
      </div>

      {/* Tools/gear */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          {t('clarify.tools')}
        </label>
        <input
          type="text"
          value={tools}
          onChange={e => setTools(e.target.value)}
          placeholder={t('clarify.tools.placeholder')}
          className="w-full bg-bg-card border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Additional details */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          {t('clarify.details')}
        </label>
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder={t('clarify.details.placeholder')}
          rows={2}
          className="w-full bg-bg-card border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary resize-none"
        />
      </div>

      {/* Affiliate links */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-text-secondary">
            {t('clarify.affiliate')}
          </label>
          {affiliateLinks.length > 0 && (
            <button
              onClick={() => { setLinkName(''); setLinkUrl(''); }}
              className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors"
            >
              {t('clarify.addanother')}
            </button>
          )}
        </div>
        {affiliateLinks.length > 0 && (
          <div className="space-y-1 mb-2">
            {affiliateLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono text-text-secondary bg-bg-card border border-border rounded px-2 py-1.5">
                <span className="text-primary font-medium shrink-0">{link.name}</span>
                <span className="text-text-secondary/50 truncate flex-1">{link.url}</span>
                <button onClick={() => removeLink(i)} className="text-red-400 hover:text-red-300 shrink-0">&times;</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={linkName}
            onChange={e => setLinkName(e.target.value)}
            placeholder={t('clarify.product')}
            className="flex-1 bg-bg-card border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={e => e.key === 'Enter' && addLink()}
            className="flex-1 bg-bg-card border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary"
          />
          <button
            onClick={addLink}
            disabled={!linkName.trim() || !linkUrl.trim()}
            className="px-3 py-2 text-xs font-mono bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:bg-bg-card disabled:border-border disabled:text-text-secondary"
          >
            {t('media.add')}
          </button>
        </div>
      </div>

      {/* Images & Media */}
      <MediaInput
        attachments={mediaAttachments}
        onAttachmentsChange={setMediaAttachments}
      />
    </div>
  )
}
