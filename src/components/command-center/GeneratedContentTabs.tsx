import { useState, useMemo, useRef, useCallback } from 'react'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { useLanguage } from '../../hooks/useLanguage'
import type { BrandProfile } from '../../types'

interface ContentSection {
  label: string
  format: 'blog' | 'social' | 'thread' | 'video'
  platform?: string
  content: string
}

interface GeneratedContentTabsProps {
  rawContent: string
  onContentChange: (content: string) => void
  onClear?: () => void
  onPublishBlog?: (content: string) => void
  brandProfile?: BrandProfile | null
}

const PRESET_FONTS: Record<string, string> = {
  modern: 'Calibri',
  luxury: 'Garamond',
  editorial: 'Palatino',
  tech: 'Arial',
}

const platformNames: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
}

// Try to split video/image prompt content into per-platform sections
function splitVideoByPlatform(content: string): ContentSection[] | null {
  const platformKeys = Object.keys(platformNames)

  // Primary: === PLATFORM === separators
  const separatorRegex = /===\s*(TIKTOK|INSTAGRAM|PINTEREST|YOUTUBE|LINKEDIN)\s*===/gi
  const matches: { platform: string; index: number; fullMatchEnd: number }[] = []
  let m: RegExpExecArray | null
  while ((m = separatorRegex.exec(content)) !== null) {
    const platform = m[1].toLowerCase()
    if (platformKeys.includes(platform)) {
      matches.push({ platform, index: m.index, fullMatchEnd: m.index + m[0].length })
    }
  }

  // Fallback: emoji-based headers like "🎬 VIDEO PROMPT FOR TIKTOK"
  if (matches.length < 2) {
    const platformPattern = platformKeys.join('|')
    const fallbackRegex = new RegExp(
      `(?:^|\\n)(?:#{1,3}\\s*)?(?:🎬|📋|🖼️)?\\s*(?:VIDEO|IMAGE)?\\s*(?:PROMPT(?:\\s+FOR)?)?\\s*(${platformPattern})(?:\\s*(?:PROMPT|:))?\\s*\\n`,
      'gi'
    )
    matches.length = 0
    while ((m = fallbackRegex.exec(content)) !== null) {
      const platform = m[1].toLowerCase()
      if (platformKeys.includes(platform)) {
        matches.push({ platform, index: m.index, fullMatchEnd: m.index + m[0].length })
      }
    }
  }

  if (matches.length < 1) return null

  const sections: ContentSection[] = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].fullMatchEnd
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length
    const sectionContent = content.slice(start, end).replace(/^[\s-=]+/, '').replace(/[\s-=]+$/, '').trim()
    const pName = platformNames[matches[i].platform] || matches[i].platform
    sections.push({
      label: `🎬 ${pName}`,
      format: 'video',
      platform: matches[i].platform,
      content: sectionContent,
    })
  }

  return sections.length > 0 ? sections : null
}

// Parse combined multi-format output into sections
function parseSections(raw: string): ContentSection[] {
  // Check for section headers like "## 📝 Blog Article" or "## 📱 Tiktok"
  const sectionRegex = /^## (📝 Blog Article|📱 (\w+)|🎬 (?:Video Prompt|Image & Video Prompt)|🧵 X Thread)$/gm
  const matches: { label: string; index: number }[] = []
  let m: RegExpExecArray | null
  while ((m = sectionRegex.exec(raw)) !== null) {
    matches.push({ label: m[1], index: m.index })
  }

  if (matches.length === 0) {
    // Single format — try to split video content by platform
    const videoSplit = splitVideoByPlatform(raw)
    if (videoSplit) return videoSplit

    // Fallback: single section
    return [{ label: 'Content', format: 'social', content: raw.trim() }]
  }

  const sections: ContentSection[] = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].label.length + 3 // skip "## label\n"
    const end = i + 1 < matches.length
      ? raw.lastIndexOf('---', matches[i + 1].index) > start
        ? raw.lastIndexOf('---', matches[i + 1].index)
        : matches[i + 1].index
      : raw.length
    const content = raw.slice(start, end).replace(/^[\s-]+/, '').trim()
    const label = matches[i].label

    let format: ContentSection['format'] = 'social'
    let platform: string | undefined
    if (label.includes('Blog')) format = 'blog'
    else if (label.includes('Video') || label.includes('Image')) {
      format = 'video'
      // If single video section, try to split by platform
      if (matches.length === 1) {
        const videoSplit = splitVideoByPlatform(content)
        if (videoSplit) return videoSplit
      }
    }
    else if (label.includes('Thread')) format = 'thread'
    else if (label.includes('📱')) {
      format = 'social'
      platform = label.replace('📱 ', '')
    }

    sections.push({ label, format, platform, content })
  }

  return sections
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

function BlogView({ content, editing, onSave }: { content: string; editing: boolean; onSave: (markdown: string) => void }) {
  const html = useMemo(() => marked.parse(content, { async: false }) as string, [content])
  const editorRef = useRef<HTMLDivElement>(null)

  const handleSave = useCallback(() => {
    if (!editorRef.current) return
    const md = turndownService.turndown(editorRef.current.innerHTML)
    onSave(md)
  }, [onSave])

  // Expose save handler via ref callback
  const saveRef = useRef(handleSave)
  saveRef.current = handleSave

  return (
    <div
      ref={editorRef}
      contentEditable={editing}
      suppressContentEditableWarning
      className={`prose prose-invert max-w-none px-6 py-6 bg-bg-card border rounded-lg overflow-y-auto focus:outline-none ${
        editing
          ? 'border-primary/40 ring-1 ring-primary/20 cursor-text'
          : 'border-border'
      }`}
      style={{ maxHeight: '700px' }}
      dangerouslySetInnerHTML={{ __html: html }}
      data-save-ref={editing ? 'true' : undefined}
    />
  )
}

// Helper to extract markdown from a BlogView editor ref
function getBlogViewMarkdown(container: HTMLElement | null): string | null {
  if (!container) return null
  const editor = container.querySelector('[contenteditable="true"]') as HTMLElement | null
  if (!editor) return null
  return turndownService.turndown(editor.innerHTML)
}

// Parse social content into labeled sections (works for TikTok, Instagram, etc.)
function parseSocialSections(content: string): { header: string; body: string }[] {
  // Match section headers like "**🎬 HOOK (first 3 seconds)**" or "**📝 SCRIPT**"
  const sectionRegex = /\*\*([^*]+)\*\*/g
  const headers: { text: string; index: number }[] = []
  let match: RegExpExecArray | null
  while ((match = sectionRegex.exec(content)) !== null) {
    // Only treat as a section header if it starts at the beginning of a line
    const before = content.slice(0, match.index)
    if (match.index === 0 || before.endsWith('\n') || before.endsWith('\n\n')) {
      headers.push({ text: match[1].trim(), index: match.index })
    }
  }

  if (headers.length === 0) {
    return [{ header: '', body: content }]
  }

  const sections: { header: string; body: string }[] = []
  for (let i = 0; i < headers.length; i++) {
    const headerEnd = headers[i].index + headers[i].text.length + 4 // 4 for the ** markers
    const bodyEnd = i + 1 < headers.length ? headers[i + 1].index : content.length
    const body = content.slice(headerEnd, bodyEnd).trim()
    sections.push({ header: headers[i].text, body })
  }
  return sections
}

function cleanSocialText(text: string, isHashtagSection = false): string {
  let cleaned = text
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold markers
    .replace(/\*(.+?)\*/g, '$1')     // italic markers
    .replace(/^#+\s*/gm, '')         // header markers
    .replace(/^[-*]\s/gm, '• ')     // bullets

  if (isHashtagSection) {
    // In hashtag sections, ensure every word that looks like a hashtag gets the # prefix
    cleaned = cleaned.replace(/(^|\s)(?!#)([A-Z][A-Za-z0-9]{2,})/gm, '$1#$2')
  }

  return cleaned
}

// Renders social content body with support for numbered lists, bullets, and paragraphs
function SocialBody({ text }: { text: string }) {
  const blocks = text.split('\n\n')
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(Boolean)

        // Check if this block is a numbered list (lines start with 1., 2., etc.)
        const isNumberedList = lines.length > 1 && lines.every(l => /^\d+[\.\)]\s/.test(l))
        if (isNumberedList) {
          return (
            <ol key={bi} className="list-decimal list-inside space-y-1.5 mb-3 last:mb-0">
              {lines.map((line, li) => (
                <li key={li} className="text-sm text-text-primary leading-relaxed">
                  {line.replace(/^\d+[\.\)]\s*/, '')}
                </li>
              ))}
            </ol>
          )
        }

        // Check if this block is a bullet list (lines start with • or - )
        const isBulletList = lines.length > 1 && lines.every(l => /^[•\-]\s/.test(l))
        if (isBulletList) {
          return (
            <ul key={bi} className="list-disc list-inside space-y-1.5 mb-3 last:mb-0">
              {lines.map((line, li) => (
                <li key={li} className="text-sm text-text-primary leading-relaxed">
                  {line.replace(/^[•\-]\s*/, '')}
                </li>
              ))}
            </ul>
          )
        }

        // Regular paragraph block
        return (
          <div key={bi} className="mb-3 last:mb-0">
            {lines.map((line, li) => (
              <p key={li} className="text-sm text-text-primary leading-relaxed">{line}</p>
            ))}
          </div>
        )
      })}
    </>
  )
}

function SocialView({ content }: { content: string }) {
  const sections = parseSocialSections(content)
  const hasSections = sections.length > 1 || sections[0]?.header

  if (!hasSections) {
    // Fallback: simple render for unstructured content
    const cleaned = cleanSocialText(content)
    return (
      <div className="bg-bg-card border border-border rounded-lg px-4 py-3 overflow-y-auto" style={{ maxHeight: '600px' }}>
        {cleaned.split('\n\n').map((block, i) => (
          <div key={i} className="mb-4 last:mb-0">
            {block.split('\n').map((line, j) => (
              <p key={j} className="text-sm text-text-primary leading-relaxed">{line}</p>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '600px' }}>
      {sections.map((section, i) => {
        const isHashtags = /hashtag/i.test(section.header)
        const cleaned = cleanSocialText(section.body, isHashtags)
        return (
          <div key={i} className="bg-bg-card border border-border rounded-lg overflow-hidden">
            {/* Section header */}
            {section.header && (
              <div className="px-4 py-2 border-b border-border bg-bg-section">
                <h4 className="text-xs font-mono font-semibold text-primary tracking-wide">
                  {section.header}
                </h4>
              </div>
            )}
            {/* Section body */}
            <div className="px-4 py-3">
              <SocialBody text={cleaned} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ThreadView({ content }: { content: string }) {
  // Parse tweets: split on --- separators, numbered prefixes (1/, 2.), or double newlines before numbers
  const tweets = content
    .split(/\n*---\n*|\n\n(?=\*?\*?\d+[\.\)\/])/)
    .map(t => t.trim())
    .filter(Boolean)
    // Clean each tweet: strip markdown symbols, number prefixes, header markers
    .map(raw => {
      return raw
        .replace(/^#+\s*/gm, '')              // header markers
        .replace(/\*\*(.+?)\*\*/g, '$1')      // bold **text**
        .replace(/\*(.+?)\*/g, '$1')          // italic *text*
        .replace(/^\*?\*?\d+[\.\)\/]\*?\*?\s*/, '') // number prefix like "1/" or "**2.**"
        .trim()
    })
    .filter(Boolean)

  return (
    <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '600px' }}>
      {tweets.map((tweet, i) => {
        const charCount = tweet.length
        const overLimit = charCount > 280
        return (
          <div key={i} className="bg-bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="shrink-0 text-xs font-mono text-primary/60 mt-0.5">{i + 1}.</span>
                <div className="flex-1 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {tweet}
                </div>
              </div>
              <span className={`shrink-0 text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full border ${
                overLimit
                  ? 'border-red-400/30 text-red-400 bg-red-400/5'
                  : 'border-border text-text-secondary'
              }`}>
                {charCount}/280
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function GeneratedContentTabs({ rawContent, onContentChange, onClear, onPublishBlog, brandProfile }: GeneratedContentTabsProps) {
  const { t } = useLanguage()
  const sections = useMemo(() => parseSections(rawContent), [rawContent])
  const [activeTab, setActiveTab] = useState(0)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedMd, setCopiedMd] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const currentSection = sections[activeTab] || sections[0]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentSection?.content || rawContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(currentSection?.content || rawContent)
    setCopiedMd(true)
    setTimeout(() => setCopiedMd(false), 2000)
  }

  // Download blog as .docx
  const handleDownloadDocx = useCallback(async () => {
    const content = currentSection?.content || ''
    const fontName = PRESET_FONTS[brandProfile?.style_preset || 'modern'] || 'Calibri'
    const accentHex = (brandProfile?.accent_color || '#2563eb').replace('#', '')
    const lines = content.split('\n')

    const paragraphs: Paragraph[] = []
    let inCodeBlock = false

    for (const line of lines) {
      if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue }
      if (inCodeBlock) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: line, font: 'Consolas', size: 20 })], spacing: { after: 40 } }))
        continue
      }

      // Skip image placeholders
      if (line.match(/^!\[.*\]\(.*\)$/)) continue

      if (line.startsWith('# ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line.replace(/^# /, ''), bold: true, font: fontName, size: 36, color: accentHex })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }))
      } else if (line.startsWith('## ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line.replace(/^## /, ''), bold: true, font: fontName, size: 28, color: accentHex })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        }))
      } else if (line.startsWith('### ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line.replace(/^### /, ''), bold: true, font: fontName, size: 24 })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        }))
      } else if (line.startsWith('> ')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line.replace(/^> /, ''), italics: true, font: fontName, size: 22, color: '666666' })],
          indent: { left: 400 },
          spacing: { after: 80 },
        }))
      } else if (line.match(/^[-*] /)) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: `• ${line.replace(/^[-*] /, '')}`, font: fontName, size: 22 })],
          indent: { left: 300 },
          spacing: { after: 60 },
        }))
      } else if (line.match(/^\d+\. /)) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line, font: fontName, size: 22 })],
          indent: { left: 300 },
          spacing: { after: 60 },
        }))
      } else if (line === '---') {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: '─'.repeat(50), color: 'cccccc', size: 16 })], spacing: { before: 200, after: 200 } }))
      } else if (line.trim() === '') {
        paragraphs.push(new Paragraph({ children: [], spacing: { after: 80 } }))
      } else {
        // Parse inline bold/italic
        const runs: TextRun[] = []
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/)
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: fontName, size: 22 }))
          } else if (part.startsWith('*') && part.endsWith('*')) {
            runs.push(new TextRun({ text: part.slice(1, -1), italics: true, font: fontName, size: 22 }))
          } else if (part.startsWith('`') && part.endsWith('`')) {
            runs.push(new TextRun({ text: part.slice(1, -1), font: 'Consolas', size: 20 }))
          } else if (part) {
            runs.push(new TextRun({ text: part, font: fontName, size: 22 }))
          }
        }
        if (runs.length > 0) {
          paragraphs.push(new Paragraph({ children: runs, spacing: { after: 80 } }))
        }
      }
    }

    // Add author info if brand profile exists
    if (brandProfile?.display_name) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: '─'.repeat(50), color: 'cccccc', size: 16 })], spacing: { before: 300, after: 200 } }))
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `About the Author`, bold: true, font: fontName, size: 24, color: accentHex })],
        spacing: { after: 80 },
      }))
      const bioLine = `${brandProfile.display_name}${brandProfile.title ? ` — ${brandProfile.title}` : ''}${brandProfile.bio ? `. ${brandProfile.bio}` : ''}`
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: bioLine, font: fontName, size: 22 })], spacing: { after: 60 } }))
      if (brandProfile.website_url) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: brandProfile.website_url, font: fontName, size: 20, color: accentHex })], spacing: { after: 40 } }))
      }
    }

    // Add date
    paragraphs.unshift(new Paragraph({
      children: [new TextRun({
        text: `${brandProfile?.display_name || 'Author'} • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        font: fontName, size: 20, color: '888888', italics: true,
      })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
    }))

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    })

    const blob = await Packer.toBlob(doc)
    const title = lines.find(l => l.startsWith('# '))?.replace(/^# /, '') || 'blog-post'
    const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) + '.docx'
    saveAs(blob, filename)
  }, [currentSection, brandProfile])

  // Print blog as PDF
  const handlePrintPdf = useCallback(() => {
    const content = currentSection?.content || ''
    const fontFamily = PRESET_FONTS[brandProfile?.style_preset || 'modern'] || 'Calibri'
    const accent = brandProfile?.accent_color || '#2563eb'
    const html = marked.parse(content) as string

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Blog Post</title>
<style>
  @page { margin: 1in; }
  body { font-family: '${fontFamily}', serif; font-size: 14px; line-height: 1.7; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 40px 20px; }
  h1 { font-size: 28px; color: ${accent}; margin-bottom: 4px; line-height: 1.2; }
  h2 { font-size: 22px; color: ${accent}; margin-top: 32px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
  h3 { font-size: 18px; color: #333; margin-top: 24px; }
  p { margin: 8px 0; }
  blockquote { border-left: 3px solid ${accent}; margin: 16px 0; padding: 8px 16px; background: #f9f9f9; color: #555; font-style: italic; }
  code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: 13px; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
  ul, ol { padding-left: 24px; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 32px 0; }
  a { color: ${accent}; }
  img { display: none; }
  .author-meta { color: #888; font-style: italic; font-size: 13px; margin-bottom: 24px; }
  .author-bio { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; }
  .author-bio strong { color: ${accent}; }
</style></head><body>
<p class="author-meta">${brandProfile?.display_name || 'Author'} &bull; ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
${html}
${brandProfile?.display_name ? `<div class="author-bio"><strong>About the Author</strong><br>${brandProfile.display_name}${brandProfile.title ? ` — ${brandProfile.title}` : ''}${brandProfile.bio ? `. ${brandProfile.bio}` : ''}${brandProfile.website_url ? `<br><a href="${brandProfile.website_url}">${brandProfile.website_url}</a>` : ''}</div>` : ''}
</body></html>`)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 300)
  }, [currentSection, brandProfile])

  const handleSave = useCallback(() => {
    const md = getBlogViewMarkdown(contentContainerRef.current)
    if (md === null) return

    const newSections = [...sections]
    newSections[activeTab] = { ...currentSection, content: md }
    if (sections.length === 1) {
      onContentChange(md)
    } else {
      const rebuilt = newSections
        .map(s => `## ${s.label}\n\n${s.content}`)
        .join('\n\n---\n\n')
      onContentChange(rebuilt)
    }
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [sections, activeTab, currentSection, onContentChange])

  const handleDiscard = () => {
    setEditing(false)
  }

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    setConfirmClear(false)
    onClear?.()
  }

  const handleDeleteTab = (index: number) => {
    if (sections.length <= 1) {
      onClear?.()
      return
    }
    const remaining = sections.filter((_, i) => i !== index)
    const rebuilt = remaining
      .map(s => `## ${s.label}\n\n${s.content}`)
      .join('\n\n---\n\n')
    onContentChange(rebuilt)
    if (activeTab >= remaining.length) setActiveTab(remaining.length - 1)
  }

  // Tab display names — exact labels
  const tabName = (s: ContentSection) => {
    if (s.format === 'blog') return 'Blog'
    if (s.format === 'thread') return 'X Thread'
    // Video sections with platform names get the platform label
    if (s.format === 'video' && s.platform) {
      return platformNames[s.platform] || s.platform.charAt(0).toUpperCase() + s.platform.slice(1)
    }
    if (s.format === 'video') return 'Prompt'
    if (s.platform) {
      return platformNames[s.platform] || s.platform.charAt(0).toUpperCase() + s.platform.slice(1)
    }
    return 'Content'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-white uppercase tracking-[0.1em]">{t('gen.title')}</h2>
        <div className="flex items-center gap-3">
          {editing && (
            <span className="text-[10px] font-mono text-primary">{t('gen.editing')}</span>
          )}
          {onClear && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-[13px] font-mono font-semibold border border-border rounded-md text-text-secondary hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              {confirmClear ? 'Confirm Clear' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {sections.length > 1 && (
        <div className="flex gap-1 bg-bg border border-border rounded-lg p-1">
          {sections.map((section, i) => (
            <div key={i} className="flex-1 relative">
              <button
                onClick={() => {
                  setActiveTab(i)
                  setEditing(false)
                }}
                className={`w-full px-3 py-2.5 rounded-md text-[15px] font-mono transition-all text-center ${
                  activeTab === i
                    ? 'bg-[#1e3a5f] text-white font-semibold border border-[#4a6fa5]/40 shadow-sm'
                    : 'text-[#94a3b8] font-medium hover:text-white hover:bg-bg-card border border-transparent'
                }`}
              >
                {tabName(section)}
              </button>
              {onClear && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteTab(i) }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-bg-card border border-border text-text-secondary hover:text-red-400 hover:border-red-400/30 flex items-center justify-center transition-colors text-[10px] leading-none"
                  title="Remove this tab"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content view — video uses SocialView for identical rendering */}
      <div ref={contentContainerRef}>
        {currentSection && (
          <>
            {currentSection.format === 'blog' && (
              <BlogView
                content={currentSection.content}
                editing={editing}
                onSave={() => {}}
              />
            )}
            {currentSection.format === 'social' && <SocialView content={currentSection.content} />}
            {currentSection.format === 'thread' && <ThreadView content={currentSection.content} />}
            {currentSection.format === 'video' && <SocialView content={currentSection.content} />}
          </>
        )}
      </div>

      {/* Bottom toolbar — format-specific actions */}
      <div className="flex items-center gap-2">
        {/* Blog: Edit + Save/Cancel + Publish */}
        {currentSection?.format === 'blog' && (
          <>
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  {saved ? t('gen.saved') : t('gen.edit')}
                </button>
                <button
                  onClick={() => onPublishBlog?.(currentSection.content)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {t('gen.publish')}
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  {copiedMd ? 'Copied!' : '📋 Markdown'}
                </button>
                <button
                  onClick={handleDownloadDocx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  📄 .docx
                </button>
                <button
                  onClick={handlePrintPdf}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  📑 PDF
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {t('gen.save')}
                </button>
                <button
                  onClick={handleDiscard}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border text-text-secondary hover:border-red-400/30 hover:text-red-400 transition-colors"
                >
                  {t('gen.cancel')}
                </button>
              </>
            )}
          </>
        )}

        {/* Social posts & Video prompts: Edit + Copy (identical layout) */}
        {(currentSection?.format === 'social' || currentSection?.format === 'video') && (
          <>
            <button
              onClick={() => {/* TODO: inline edit */}}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              {t('gen.edit')}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              {copied ? t('gen.copied') : t('gen.copy')}
            </button>
          </>
        )}

        {/* X Thread: Edit + Post to X */}
        {currentSection?.format === 'thread' && (
          <>
            <button
              onClick={() => {/* TODO: inline edit for thread */}}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              {t('gen.edit')}
            </button>
            <button
              onClick={() => {/* TODO: X API integration */}}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0] hover:bg-[#1d9bf0]/20 transition-colors"
            >
              {t('gen.postx')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
