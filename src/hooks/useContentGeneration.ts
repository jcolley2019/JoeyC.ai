import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { OutputFormat, Platform, GenerationUsage, GenerationLimits } from '../types'

// Mirrors MAX_INPUT_CHARS in supabase/functions/generate-content/validate.ts.
const MAX_INPUT_CHARS = 30_000

// How often a streaming blog repaints the tabs (ms). Every delta would re-parse
// the whole markdown; ~12 repaints a second reads as live typing.
const STREAM_REPAINT_MS = 80

interface GenerateParams {
  input_type: 'youtube' | 'text' | 'voice'
  input_text: string
  output_format: OutputFormat
  platform?: Platform
  cascade_source?: string // Blog content to derive from
  real_time_hashtags?: string // Pre-researched hashtags to pass through
  // One id per generate() press, sent on every call of the cascade: the server
  // counts the daily quota per batch, not per model call.
  batch_id: string
}

interface GenerateMultiParams {
  input_type: 'youtube' | 'text' | 'voice'
  input_text: string
  output_formats: OutputFormat[]
  platforms: Platform[]
  cascade: boolean // Whether to use blog-first cascade flow
  usePerplexity: boolean // Whether to use Perplexity for hashtag research
}

interface GenerateResult {
  content: string
  usage: GenerationUsage
  limits: GenerationLimits
}

/** User-facing message for an error body from generate-content. */
function errorBodyMessage(body: { error?: string; reset_at?: string } | null, fallback: string): string {
  let msg = body?.error || fallback
  if (body?.reset_at) {
    const local = new Date(body.reset_at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
    msg += ` That is ${local} your time.`
  }
  return msg
}

/** Turn a non-2xx edge-function response into a user-facing message. */
async function functionErrorMessage(fnError: Error & { context?: unknown }): Promise<string> {
  let body: { error?: string; reset_at?: string } | null = null
  if (fnError.context instanceof Response) {
    try { body = await fnError.context.clone().json() } catch { /* not JSON */ }
  }
  return errorBodyMessage(body, fnError.message || 'Generation failed')
}

async function callGenerate(params: GenerateParams, signal: AbortSignal): Promise<GenerateResult> {
  const { data, error: fnError } = await supabase.functions.invoke('generate-content', {
    body: params,
    signal,
  })
  if (fnError) {
    if (signal.aborted) throw signal.reason
    const msg = await functionErrorMessage(fnError)
    console.error('Edge function error:', msg)
    throw new Error(msg)
  }
  return {
    content: data.content as string,
    usage: data.usage,
    limits: data.limits,
  }
}

/**
 * The blog call streams (server-sent events), which supabase.functions.invoke
 * cannot read, so it is a plain fetch with the session's bearer token.
 * `onText` receives the whole article so far after each delta.
 */
async function streamGenerate(
  params: GenerateParams,
  accessToken: string,
  signal: AbortSignal,
  onText: (textSoFar: string) => void,
  onStatus: (status: string) => void,
): Promise<GenerateResult> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    let body: { error?: string; reset_at?: string } | null = null
    try { body = await res.json() } catch { /* not JSON */ }
    throw new Error(errorBodyMessage(body, `Generation failed (${res.status})`))
  }
  // A generate-content build without streaming answers with plain JSON.
  if (!(res.headers.get('Content-Type') ?? '').includes('text/event-stream') || !res.body) {
    const data = await res.json()
    return { content: data.content, usage: data.usage, limits: data.limits }
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''
  let done: { usage: GenerationUsage; limits: GenerationLimits } | null = null

  for (;;) {
    const { done: eof, value } = await reader.read()
    if (eof) break
    buffer += decoder.decode(value, { stream: true })
    let sep: number
    while ((sep = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      let event = 'message'
      let data = ''
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (!data) continue // keep-alive comment
      const payload = JSON.parse(data)
      if (event === 'content_block_delta') {
        content += payload.text
        onText(content)
      } else if (event === 'status') {
        onStatus('Researching...')
      } else if (event === 'done') {
        done = payload
      } else if (event === 'error') {
        throw new Error(payload.error || 'Generation failed')
      }
    }
  }
  if (!done) throw new Error('The connection closed before the article finished. Try again.')
  return { content, usage: done.usage, limits: done.limits }
}

export interface UsageSummary {
  totalInputTokens: number
  totalOutputTokens: number
  models: string[]
  webSearchUsed: boolean
  dailyUsed: number
  dailyLimit: number
  estimatedCost: string
}

function calcUsageSummary(results: GenerateResult[]): UsageSummary {
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let webSearchUsed = false
  const models = new Set<string>()
  let dailyUsed = 0
  let dailyLimit = 50
  let cost = 0

  for (const r of results) {
    totalInputTokens += r.usage.input_tokens + (r.usage.cache_read_input_tokens ?? 0) + (r.usage.cache_creation_input_tokens ?? 0)
    totalOutputTokens += r.usage.output_tokens
    models.add(r.usage.model)
    if (r.usage.web_search_used) webSearchUsed = true
    // Parallel calls finish in any order; the highest count is the latest.
    dailyUsed = Math.max(dailyUsed, r.limits.daily_used)
    dailyLimit = r.limits.daily_limit
    // Priced on the server (MODEL_PRICING in generate-content).
    cost += r.usage.cost_usd ?? 0
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    models: [...models],
    webSearchUsed,
    dailyUsed,
    dailyLimit,
    estimatedCost: `~$${cost.toFixed(4)}`,
  }
}

/** Tabs markup the Studio parses: "## <label>" sections separated by "---". */
function combineSections(sections: { label: string; content: string }[]): string {
  return sections.map(s => `## ${s.label}\n\n${s.content}`).join('\n\n---\n\n')
}

export function useContentGeneration() {
  const [generating, setGenerating] = useState(false)
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Leaving the Studio stops the in-flight calls (and the server stops the model).
  useEffect(() => () => abortRef.current?.abort(), [])

  const cancel = useCallback(() => abortRef.current?.abort(), [])

  const generate = async (params: GenerateMultiParams): Promise<string | null> => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    setGenerating(true)
    setGeneratingStatus(null)
    setError(null)
    setResult(null)
    setUsageSummary(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      if (params.input_text.length > MAX_INPUT_CHARS) {
        throw new Error(`Input is too long (${params.input_text.length.toLocaleString()} characters; max ${MAX_INPUT_CHARS.toLocaleString()}). Shorten it and try again.`)
      }

      const batch_id = crypto.randomUUID()
      const allResults: GenerateResult[] = []
      const hasBlog = params.output_formats.includes('blog')
      const otherFormats = params.output_formats.filter(f => f !== 'blog')
      const useCascade = params.cascade && hasBlog && otherFormats.length > 0
      const hasSocialFormats = params.output_formats.some(f => f === 'social' || f === 'thread' || f === 'video')

      // Step 0: Perplexity hashtag research (if enabled and social formats selected)
      let realTimeHashtags: string | undefined
      if (params.usePerplexity && hasSocialFormats) {
        setGeneratingStatus('Researching trending hashtags...')
        try {
          const { data, error: fnError } = await supabase.functions.invoke('perplexity-hashtags', {
            body: {
              input_text: params.input_text,
              platforms: params.platforms,
            },
            signal,
          })
          if (!fnError && data?.hashtags) {
            realTimeHashtags = data.hashtags
          }
        } catch {
          // Silent fallback — Perplexity failed, Claude will handle hashtags
        }
        if (signal.aborted) throw signal.reason
      }

      setGeneratingStatus('Generating Content...')

      // Every call of this press, in tab order. The blog slot fills in while it
      // streams; the others appear when their call returns.
      const slots: { label: string; params: GenerateParams; content: string | null }[] = []
      const derivativeSlot = (label: string, p: Omit<GenerateParams, 'batch_id' | 'input_type' | 'input_text'>) =>
        slots.push({ label, content: null, params: { input_type: params.input_type, input_text: params.input_text, batch_id, ...p } })

      const formats = useCascade ? otherFormats : params.output_formats
      if (useCascade) derivativeSlot('📝 Blog Article', { output_format: 'blog' })
      for (const format of formats) {
        if (format === 'social') {
          for (const platform of params.platforms) {
            const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1)
            derivativeSlot(`📱 ${platformLabel}`, { output_format: 'social', platform, real_time_hashtags: realTimeHashtags })
          }
        } else {
          const formatLabel = format === 'blog' ? '📝 Blog Article' : format === 'video' ? '🎬 Image & Video Prompt' : '🧵 X Thread'
          derivativeSlot(formatLabel, { output_format: format, real_time_hashtags: realTimeHashtags })
        }
      }

      const render = () => {
        const ready = slots.filter(s => s.content !== null) as { label: string; content: string }[]
        if (ready.length === 0) return null
        // A single-format press shows the bare output, as before.
        return slots.length === 1 ? ready[0].content : combineSections(ready)
      }
      let repaint: ReturnType<typeof setTimeout> | null = null
      const scheduleRepaint = () => {
        if (repaint) return
        repaint = setTimeout(() => { repaint = null; if (!signal.aborted) setResult(render()) }, STREAM_REPAINT_MS)
      }

      const run = async (slot: (typeof slots)[number]): Promise<GenerateResult> => {
        const isBlog = slot.params.output_format === 'blog' && !slot.params.cascade_source
        const res = isBlog
          ? await streamGenerate(slot.params, session.access_token, signal,
              text => {
                if (slot.content === null) setGeneratingStatus('Writing the article...')
                slot.content = text
                scheduleRepaint()
              },
              setGeneratingStatus)
          : await callGenerate(slot.params, signal)
        slot.content = res.content
        allResults.push(res)
        return res
      }

      if (useCascade) {
        // === CASCADE FLOW ===
        // Step 1: Blog with web search (Sonnet 5), streamed into the Blog tab
        const blogResult = await run(slots[0])

        // Step 2: Derive all other formats from blog content (Haiku 4.5, parallel)
        setGeneratingStatus(`Adapting for ${slots.length - 1} format${slots.length > 2 ? 's' : ''}...`)
        for (const slot of slots.slice(1)) slot.params.cascade_source = blogResult.content
        await Promise.all(slots.slice(1).map(async slot => { await run(slot); scheduleRepaint() }))
      } else {
        // === STANDARD FLOW (no cascade) ===
        await Promise.all(slots.map(async slot => { await run(slot); scheduleRepaint() }))
      }

      if (repaint) clearTimeout(repaint)
      const combined = render()
      setResult(combined)

      // Calculate usage summary
      setUsageSummary(calcUsageSummary(allResults))

      return combined
    } catch (err) {
      const message = signal.aborted
        ? 'Generation cancelled.'
        : err instanceof Error ? err.message : 'Generation failed'
      setError(message)
      return null
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setGenerating(false)
      setGeneratingStatus(null)
    }
  }

  const extractYouTubeTranscript = async (url: string) => {
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { data, error: fnError } = await supabase.functions.invoke('youtube-transcript', {
        body: { url },
      })

      if (fnError) throw fnError
      return data.transcript as string
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract transcript'
      setError(message)
      return null
    }
  }

  return { generating, generatingStatus, result, error, usageSummary, generate, cancel, extractYouTubeTranscript, setResult, setError }
}
