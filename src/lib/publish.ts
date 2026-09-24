/**
 * Title, slug and body derivation for publishing generated markdown as a blog post.
 * Kept free of React and Supabase so it can be unit-checked with plain node/tsx.
 */

export const TITLE_MAX_CHARS = 120
export const FALLBACK_TITLE_MAX_CHARS = 80
export const SLUG_MAX_WORDS = 8

export interface DerivedPost {
  title: string
  slug: string
  body: string
}

export type DeriveResult = { ok: true; post: DerivedPost } | { ok: false; error: string }

const isBlank = (line: string) => line.trim() === ''
const isThematicBreak = (line: string) => /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)
const isH1 = (line: string) => /^#\s+\S/.test(line)

/** Strip inline markdown so a fallback title reads as plain text. */
const plainText = (line: string) =>
  line
    .replace(/^#{1,6}\s+/, '')
    .replace(/[*_`~>]/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim()

const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max).trimEnd() : s)

export function slugify(title: string, maxWords = SLUG_MAX_WORDS): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join('-')
}

/**
 * Skip leading blank lines and thematic breaks (`---`), then take the first `# ` heading as
 * the title and drop it from the body. Without an H1, the first non-empty line becomes the
 * title (max 80 chars) and stays in the body. Empty content is a validation error.
 */
export function deriveTitleAndSlug(content: string): DeriveResult {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')

  let start = 0
  while (start < lines.length && (isBlank(lines[start]) || isThematicBreak(lines[start]))) start += 1
  const rest = lines.slice(start)

  if (rest.length === 0 || rest.every(isBlank)) {
    return { ok: false, error: 'Nothing to publish: the post is empty.' }
  }

  let title: string
  let bodyLines: string[]

  if (isH1(rest[0])) {
    title = plainText(rest[0])
    bodyLines = rest.slice(1)
  } else {
    const firstText = rest.find(l => !isBlank(l))!
    title = truncate(plainText(firstText), FALLBACK_TITLE_MAX_CHARS)
    bodyLines = rest
  }

  title = truncate(title, TITLE_MAX_CHARS)
  if (!title) {
    return { ok: false, error: 'Add a title: start the post with a "# Heading" line.' }
  }

  const slug = slugify(title)
  if (!slug) {
    return { ok: false, error: 'The title has no letters or numbers to build a URL from. Add a "# Heading" line.' }
  }

  return { ok: true, post: { title, slug, body: bodyLines.join('\n').trim() } }
}
