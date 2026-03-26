import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface XPostResult {
  success: boolean
  url?: string
  count?: number
  error?: string
}

/**
 * Parses generated thread content into individual tweets.
 * Handles the format: **1/** tweet text, **2/** tweet text, etc.
 * Also handles: 1/ tweet text, 2/ tweet text
 * Stops before the QUOTE TWEET section.
 */
export function parseThreadToTweets(content: string): string[] {
  const tweets: string[] = []

  // Remove everything from "QUOTE TWEET" onward (it's not part of the thread)
  const threadPart = content.split(/\*{0,2}📌\s*QUOTE TWEET\*{0,2}/i)[0]

  // Match numbered tweets: **1/** or 1/ or **1.** patterns
  const tweetBlocks = threadPart.split(/(?:^|\n)\s*\*{0,2}(\d+)[\/.)]\*{0,2}\s*/gm)

  // The split produces: [preamble, "1", tweet1, "2", tweet2, ...]
  // Skip index 0 (preamble), then pairs of (number, content)
  for (let i = 1; i < tweetBlocks.length; i += 2) {
    const text = (tweetBlocks[i + 1] || '').trim()
    if (text) {
      // Clean markdown bold/italic but keep the actual text
      const cleaned = text
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove **bold** and *italic*
        .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
        .trim()
      if (cleaned && cleaned.length > 0) {
        tweets.push(cleaned)
      }
    }
  }

  return tweets
}

/**
 * Checks if content looks like an X thread (has numbered tweets).
 */
export function isThreadContent(content: string): boolean {
  // Check for the numbered tweet pattern
  return /\*{0,2}[12][\/.)]\*{0,2}\s/.test(content)
}

/**
 * Extracts a single tweetable message from non-thread content.
 * Takes the first 280 chars, breaking at a word boundary.
 */
export function extractSingleTweet(content: string): string {
  // Strip markdown formatting
  const plain = content
    .replace(/^#+\s+.+$/gm, '') // Remove headers
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove bold/italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links to text
    .replace(/^[-*]\s+/gm, '') // Remove list markers
    .replace(/\n{2,}/g, '\n')
    .trim()

  if (plain.length <= 280) return plain

  // Cut at word boundary before 280
  const truncated = plain.substring(0, 277)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.substring(0, lastSpace > 200 ? lastSpace : 277) + '...'
}

export function useXPosting() {
  const [posting, setPosting] = useState(false)
  const [postResult, setPostResult] = useState<XPostResult | null>(null)

  const postToX = async (content: string): Promise<XPostResult> => {
    setPosting(true)
    setPostResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      let body: Record<string, unknown>

      if (isThreadContent(content)) {
        const tweets = parseThreadToTweets(content)
        if (tweets.length === 0) {
          throw new Error('Could not parse any tweets from the content')
        }

        // Validate all tweets are under 280 chars
        const overLimit = tweets.findIndex(t => t.length > 280)
        if (overLimit !== -1) {
          throw new Error(
            `Tweet ${overLimit + 1} is ${tweets[overLimit].length} characters (max 280). Edit it down before posting.`
          )
        }

        body = { mode: 'thread', tweets }
      } else {
        const text = extractSingleTweet(content)
        body = { mode: 'single', text }
      }

      const { data, error: fnError } = await supabase.functions.invoke('post-to-x', { body })

      if (fnError) {
        const msg = data?.error || fnError.message || 'Failed to post to X'
        throw new Error(msg)
      }

      const result: XPostResult = {
        success: true,
        url: data.url,
        count: data.count || 1,
      }
      setPostResult(result)
      return result
    } catch (err) {
      const result: XPostResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to post to X',
      }
      setPostResult(result)
      return result
    } finally {
      setPosting(false)
    }
  }

  const clearResult = () => setPostResult(null)

  return { posting, postResult, postToX, clearResult }
}
