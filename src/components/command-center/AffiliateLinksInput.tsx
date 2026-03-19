import { useState } from 'react'

export interface AffiliateLink {
  name: string
  url: string
}

interface AffiliateLinksInputProps {
  links: AffiliateLink[]
  onLinksChange: (links: AffiliateLink[]) => void
}

export function AffiliateLinksInput({ links, onLinksChange }: AffiliateLinksInputProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  const addLink = () => {
    if (name.trim() && url.trim()) {
      onLinksChange([...links, { name: name.trim(), url: url.trim() }])
      setName('')
      setUrl('')
    }
  }

  const removeLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2.5">
      <label className="block text-sm font-medium text-text-secondary">Affiliate Links</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Product name"
          className="flex-1 bg-bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary transition-colors"
        />
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          onKeyDown={e => e.key === 'Enter' && addLink()}
          className="flex-1 bg-bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={addLink}
          disabled={!name.trim() || !url.trim()}
          className="px-4 py-2.5 text-sm font-mono bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-30"
        >
          Add
        </button>
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {links.map((link, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-primary/5 border border-primary/20 rounded-full px-2.5 py-0.5 text-primary">
              {link.name}
              <button onClick={() => removeLink(i)} className="text-primary/50 hover:text-red-400">&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
