/**
 * Helpers shared by the Vercel Node functions in api/. Files prefixed with "_" are not
 * deployed as endpoints.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { highlightLanguages } from '../src/lib/markdown'

export const SITE_URL = 'https://www.joeyc.ai'
export const SITE_NAME = 'JoeyC.ai'
export const AUTHOR = 'Joey Colley'

export type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>
}
export type VercelResponse = ServerResponse & {
  status(code: number): VercelResponse
  send(body: string): VercelResponse
}

export interface PostRow {
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  published_at: string | null
  updated_at: string | null
  tags: string[] | null
}

export function getSupabase(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('api: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing at runtime; serving plain shell')
    return null
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Same pipeline react-markdown runs on the client (remark-gfm, rehype-raw, rehype-highlight subset). */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeHighlight, { languages: highlightLanguages })
  .use(rehypeStringify)

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown)
  return String(file)
}

export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export function isoDate(v: string | null | undefined): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}
