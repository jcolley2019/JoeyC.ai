import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface BlogPostEditorProps {
  initialContent: string
  onClose: () => void
  onPublished: () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractTags(content: string): string[] {
  const tagPatterns = [
    /AI/i, /Claude/i, /GPT/i, /automation/i, /no-?code/i,
    /TikTok/i, /Instagram/i, /social media/i, /content/i,
    /React/i, /Supabase/i, /n8n/i, /API/i, /workflow/i,
    /building in public/i, /tutorial/i, /beginner/i,
  ]
  const tagLabels = [
    'AI', 'Claude', 'GPT', 'Automation', 'No-Code',
    'TikTok', 'Instagram', 'Social Media', 'Content',
    'React', 'Supabase', 'n8n', 'API', 'Workflow',
    'Building in Public', 'Tutorial', 'Beginner',
  ]
  const found: string[] = []
  tagPatterns.forEach((pattern, i) => {
    if (pattern.test(content) && found.length < 5) {
      found.push(tagLabels[i])
    }
  })
  return found.length > 0 ? found : ['AI', 'Building in Public']
}

export function BlogPostEditor({ initialContent, onClose, onPublished }: BlogPostEditorProps) {
  const lines = initialContent.split('\n')
  const firstLine = lines[0]?.replace(/^#\s*/, '') || ''
  const body = lines.slice(1).join('\n').trim()

  const [title, setTitle] = useState(firstLine)
  const [content, setContent] = useState(body || initialContent)
  const [tags, setTags] = useState<string[]>(extractTags(initialContent))
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('published')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    setSaving(true)
    setError(null)

    const slug = slugify(title)
    const excerpt = content.replace(/[#*_`>\[\]()!]/g, '').replace(/\n+/g, ' ').slice(0, 200).trim()

    const { error: dbError } = await supabase.from('blog_posts').insert({
      title: title.trim(),
      slug,
      content: content.trim(),
      excerpt,
      tags,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    onPublished()
  }

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Publish Blog Post</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className="block font-mono text-xs text-text-secondary mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-text-secondary mt-1 font-mono">
            Slug: /blog/{slugify(title) || '...'}
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block font-mono text-xs text-text-secondary mb-1.5">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono border border-primary/20"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-400 transition-colors ml-0.5"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 2l8 8M10 2l-8 8" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Add a tag..."
              className="flex-1 bg-bg border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={addTag}
              className="px-3 py-1.5 text-xs font-mono border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs text-text-secondary mb-1.5">Content (Markdown)</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={14}
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors resize-none text-sm font-mono leading-relaxed"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="font-mono text-xs text-text-secondary">Status:</label>
          <button
            onClick={() => setStatus('draft')}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
              status === 'draft' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' : 'text-text-secondary border border-border'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setStatus('published')}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
              status === 'published' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'text-text-secondary border border-border'
            }`}
          >
            Published
          </button>
        </div>

        {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary bg-primary text-bg font-semibold py-2.5 rounded-lg relative z-10 disabled:opacity-50"
          >
            <span className="relative z-10">
              {saving ? 'Saving...' : status === 'published' ? 'Publish' : 'Save Draft'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
