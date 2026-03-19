import { useState } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

interface YouTubeInputProps {
  onTranscriptExtracted: (transcript: string) => void
  extractTranscript: (url: string) => Promise<string | null>
}

export function YouTubeInput({ onTranscriptExtracted, extractTranscript }: YouTubeInputProps) {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    const result = await extractTranscript(url)
    setLoading(false)
    if (result) {
      setTranscript(result)
      onTranscriptExtracted(result)
    } else {
      setError(t('yt.error'))
    }
  }

  return (
    <div className="space-y-3">
      <label className="block font-mono text-sm text-text-secondary">{t('yt.label')}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 bg-bg-card border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors text-sm"
        />
        <button
          onClick={handleExtract}
          disabled={loading || !url.trim()}
          className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/30 rounded-lg font-medium text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {loading ? t('yt.extracting') : t('yt.extract')}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

      {transcript && (
        <div className="mt-3">
          <p className="font-mono text-xs text-text-secondary mb-1">
            {t('yt.transcript')} ({transcript.length} {t('input.chars')})
          </p>
          <div className="bg-bg-card border border-border rounded-lg p-3 max-h-40 overflow-y-auto text-sm text-text-secondary leading-relaxed">
            {transcript.slice(0, 500)}{transcript.length > 500 ? '...' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
