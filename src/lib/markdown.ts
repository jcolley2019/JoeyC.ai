/**
 * Shared markdown configuration. The client (react-markdown in BlogPost.tsx) and the
 * server prerender (api/blog.ts, api/rss.ts) both use these exports so a post renders
 * identically before and after hydration.
 */
import type { PluggableList } from 'unified'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'

// Only the grammars the blog actually uses; the full highlight.js set is ~170 KB.
export const highlightLanguages = { javascript, typescript, json, bash, python, css, xml, html: xml }

export const remarkPlugins: PluggableList = [remarkGfm]
export const rehypePlugins: PluggableList = [rehypeRaw, [rehypeHighlight, { languages: highlightLanguages }]]

/**
 * The post page renders `post.title` as its own H1, so a leading markdown H1 (after any
 * leading blank lines or `---` breaks) is dropped to avoid two H1s.
 */
export function stripLeadingH1(content: string): string {
  const lines = content.split('\n')
  let i = 0
  while (i < lines.length && /^\s*(?:-{3,}|\*{3,}|_{3,})?\s*$/.test(lines[i])) i += 1
  const body = /^#\s+\S/.test(lines[i] ?? '') ? lines.slice(i + 1) : lines.slice(i)
  return body.join('\n').trim()
}

export function readingTimeMinutes(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
}
