import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { OutputFormat, Platform, GenerationUsage, GenerationLimits, BrandProfile } from '../types'

interface GenerateParams {
  input_type: 'youtube' | 'text' | 'voice'
  input_text: string
  output_format: OutputFormat
  platform?: Platform
  cascade_source?: string // Blog content to derive from
  use_perplexity?: boolean
  all_platforms?: Platform[]
  real_time_hashtags?: string // Pre-researched hashtags to pass through
  brand_context?: Partial<BrandProfile>
}

interface GenerateMultiParams {
  input_type: 'youtube' | 'text' | 'voice'
  input_text: string
  output_formats: OutputFormat[]
  platforms: Platform[]
  cascade: boolean // Whether to use blog-first cascade flow
  usePerplexity: boolean // Whether to use Perplexity for hashtag research
  brand_context?: Partial<BrandProfile> // Brand profile for content personalization
}

interface GenerateResult {
  content: string
  usage: GenerationUsage
  limits: GenerationLimits
}

async function callGenerate(params: GenerateParams): Promise<GenerateResult> {
  const { data, error: fnError } = await supabase.functions.invoke('generate-content', {
    body: params,
  })
  if (fnError) {
    // Try to extract the actual error message from the response
    const msg = data?.error || fnError.message || 'Generation failed'
    console.error('Edge function error:', msg, data)
    throw new Error(msg)
  }
  return {
    content: data.content as string,
    usage: data.usage,
    limits: data.limits,
  }
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

  for (const r of results) {
    totalInputTokens += r.usage.input_tokens
    totalOutputTokens += r.usage.output_tokens
    models.add(r.usage.model)
    if (r.usage.web_search_used) webSearchUsed = true
    dailyUsed = r.limits.daily_used
    dailyLimit = r.limits.daily_limit
  }

  // Rough cost estimate (Sonnet 4.6: $3/$15 per 1M, Haiku 4.5: $0.80/$4 per 1M)
  let cost = 0
  for (const r of results) {
    const isHaiku = r.usage.model.includes('haiku')
    const inputRate = isHaiku ? 0.80 : 3.0
    const outputRate = isHaiku ? 4.0 : 15.0
    cost += (r.usage.input_tokens / 1_000_000) * inputRate
    cost += (r.usage.output_tokens / 1_000_000) * outputRate
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

export function useContentGeneration() {
  const [generating, setGenerating] = useState(false)
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null)

  const generate = async (params: GenerateMultiParams) => {
    setGenerating(true)
    setGeneratingStatus(null)
    setError(null)
    setResult(null)
    setUsageSummary(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

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
          })
          if (!fnError && data?.hashtags) {
            realTimeHashtags = data.hashtags
          }
        } catch {
          // Silent fallback — Perplexity failed, Claude will handle hashtags
        }
      }

      setGeneratingStatus('Generating Content...')

      if (useCascade) {
        // === CASCADE FLOW ===
        // Step 1: Generate blog with web search (Sonnet 4.6)
        const blogResult = await callGenerate({
          input_type: params.input_type,
          input_text: params.input_text,
          output_format: 'blog',
          brand_context: params.brand_context,
        })
        allResults.push(blogResult)

        // Step 2: Derive all other formats from blog content (Haiku 4.5, parallel)
        const derivativeCalls: { label: string; params: GenerateParams }[] = []

        for (const format of otherFormats) {
          if (format === 'social') {
            for (const platform of params.platforms) {
              const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1)
              derivativeCalls.push({
                label: `📱 ${platformLabel}`,
                params: {
                  input_type: params.input_type,
                  input_text: params.input_text,
                  output_format: 'social',
                  platform,
                  cascade_source: blogResult.content,
                  use_perplexity: false, // Already researched
                  real_time_hashtags: realTimeHashtags,
                },
              })
            }
          } else {
            const formatLabel = format === 'video' ? '🎬 Image & Video Prompt' : '🧵 X Thread'
            derivativeCalls.push({
              label: formatLabel,
              params: {
                input_type: params.input_type,
                input_text: params.input_text,
                output_format: format,
                cascade_source: blogResult.content,
                use_perplexity: false,
                real_time_hashtags: realTimeHashtags,
              },
            })
          }
        }

        const derivativeResults = await Promise.all(
          derivativeCalls.map(async (call) => {
            const res = await callGenerate(call.params)
            allResults.push(res)
            return { label: call.label, content: res.content }
          })
        )

        // Combine: blog first, then derivatives
        let combined = `## 📝 Blog Article\n\n${blogResult.content}`
        for (const d of derivativeResults) {
          combined += `\n\n---\n\n## ${d.label}\n\n${d.content}`
        }
        setResult(combined)

      } else {
        // === STANDARD FLOW (no cascade) ===
        const calls: { label: string; params: GenerateParams }[] = []

        for (const format of params.output_formats) {
          if (format === 'social') {
            for (const platform of params.platforms) {
              const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1)
              calls.push({
                label: `📱 ${platformLabel}`,
                params: {
                  input_type: params.input_type,
                  input_text: params.input_text,
                  output_format: 'social',
                  platform,
                  use_perplexity: false, // Already researched upfront
                  real_time_hashtags: realTimeHashtags,
                  all_platforms: params.platforms,
                },
              })
            }
          } else {
            const formatLabel = format === 'blog' ? '📝 Blog Article' : format === 'video' ? '🎬 Image & Video Prompt' : '🧵 X Thread'
            calls.push({
              label: formatLabel,
              params: {
                input_type: params.input_type,
                input_text: params.input_text,
                output_format: format,
                real_time_hashtags: realTimeHashtags,
                ...(format === 'blog' && params.brand_context ? { brand_context: params.brand_context } : {}),
              },
            })
          }
        }

        const results = await Promise.all(
          calls.map(async (call) => {
            const res = await callGenerate(call.params)
            allResults.push(res)
            return { label: call.label, content: res.content }
          })
        )

        let combined: string
        if (results.length === 1) {
          combined = results[0].content
        } else {
          combined = results
            .map(r => `---\n\n## ${r.label}\n\n${r.content}`)
            .join('\n\n')
            .replace(/^---\n\n/, '')
        }
        setResult(combined)
      }

      // Calculate usage summary
      const summary = calcUsageSummary(allResults)
      setUsageSummary(summary)

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
      return null
    } finally {
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

  return { generating, generatingStatus, result, error, usageSummary, generate, extractYouTubeTranscript, setResult, setError }
}
