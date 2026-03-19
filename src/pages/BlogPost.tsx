import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark-dimmed.min.css'
import { supabase } from '../lib/supabase'
import type { BlogPost as BlogPostType } from '../types'
import type { Components } from 'react-markdown'

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl md:text-4xl font-bold mt-10 mb-4 text-text-primary leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold mt-12 mb-4 text-text-primary leading-tight border-b border-border/30 pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold mt-8 mb-3 text-text-primary">{children}</h3>
  ),
  p: ({ children, node }) => {
    // Check if paragraph contains only an image — don't wrap in <p>
    const child = node?.children?.[0]
    if (node?.children?.length === 1 && child && 'tagName' in child && child.tagName === 'img') {
      return <>{children}</>
    }
    return <p className="mb-5 text-text-secondary leading-relaxed text-base">{children}</p>
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary-hover underline underline-offset-4 decoration-primary/30 transition-colors"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="text-text-primary font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
  ul: ({ children }) => <ul className="my-4 ml-1 space-y-2">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 ml-1 space-y-2 list-decimal">{children}</ol>,
  li: ({ children }) => (
    <li className="text-text-secondary leading-relaxed pl-2 ml-4 list-inherit">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-lg border-l-4 border-primary/40 bg-primary/5 px-5 py-4 [&>p]:mb-0 [&>p]:text-text-primary">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-') || className?.includes('hljs')
    if (isBlock) {
      const lang = className?.replace(/.*language-/, '').replace(/\s.*/, '') || ''
      return (
        <div className="relative my-6 rounded-xl overflow-hidden border border-border">
          {lang && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-bg-card">
              <span className="text-xs font-mono text-text-secondary/60">{lang}</span>
              <button
                onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                className="text-xs font-mono text-text-secondary/40 hover:text-primary transition-colors"
              >
                Copy
              </button>
            </div>
          )}
          <pre className="!my-0 !rounded-none overflow-x-auto">
            <code className={`${className || ''} text-sm !leading-relaxed`}>
              {children}
            </code>
          </pre>
        </div>
      )
    }
    return (
      <code className="bg-bg-card px-1.5 py-0.5 rounded text-primary font-mono text-sm border border-border/50">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <>{children}</>,
  hr: () => <hr className="my-10 border-t border-border/50" />,
  img: ({ src, alt }) => {
    // Handle illustration placeholders
    if (src?.startsWith('ILLUSTRATION:')) {
      const keyword = src.replace('ILLUSTRATION:', '')
      return (
        <div className="my-8 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-bg-card to-primary/3 p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary italic mb-1">{alt}</p>
          <p className="text-xs font-mono text-text-secondary/50">{keyword}</p>
        </div>
      )
    }
    return (
      <img
        src={src}
        alt={alt}
        className="my-6 rounded-xl border border-border w-full"
      />
    )
  },
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-bg-card border-b border-border">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left font-mono text-xs text-text-secondary uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-text-secondary border-t border-border/30">{children}</td>
  ),
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPostType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setPost(data)
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link to="/blog" className="text-primary hover:underline text-sm">
          Back to blog
        </Link>
      </div>
    )
  }

  const readingTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))

  // Strip the H1 title from content if it matches the post title
  let articleContent = post.content
  const firstLine = articleContent.split('\n')[0]
  if (firstLine?.startsWith('# ') && firstLine.replace('# ', '').trim() === post.title.trim()) {
    articleContent = articleContent.split('\n').slice(1).join('\n').trim()
  }

  return (
    <div className="min-h-screen bg-bg noise-overlay">
      <Helmet>
        <title>{post.title} — JoeyC.ai</title>
        <meta name="description" content={post.excerpt} />
        <meta name="author" content="Joey Colley" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="article:author" content="Joey Colley" />
        {post.published_at && (
          <meta property="article:published_time" content={post.published_at} />
        )}
        {(post.tags || []).map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        {post.cover_image && (
          <meta property="og:image" content={post.cover_image} />
        )}
        <meta name="twitter:card" content={post.cover_image ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        {post.cover_image && (
          <meta name="twitter:image" content={post.cover_image} />
        )}
      </Helmet>

      {/* Article header */}
      <div className="border-b border-border/30 bg-gradient-to-b from-primary/[0.03] to-transparent">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 8H3m4 4l-4-4 4-4" />
            </svg>
            All posts
          </Link>

          {/* Tags */}
          {(post.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/photos/joey-headshot1.png" alt="Joey Colley" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-sm text-text-primary font-medium">Joey Colley</p>
                <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                  <time>
                    {new Date(post.published_at!).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span className="text-border">·</span>
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.cover_image && (
        <div className="max-w-4xl mx-auto px-6 pt-10">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full rounded-xl border border-border object-cover max-h-[28rem]"
          />
        </div>
      )}

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={mdComponents}
        >
          {articleContent}
        </Markdown>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border/30">
          <div className="flex items-center gap-4 mb-6">
            <img src="/photos/joey-headshot1.png" alt="Joey Colley" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-text-primary">Joey Colley</p>
              <p className="text-sm text-text-secondary">
                Building apps with AI and sharing the journey on{' '}
                <a href="https://www.tiktok.com/@buildaiwithjoey" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors">
                  TikTok
                </a>
                {' & '}
                <a href="https://www.instagram.com/gobuildai" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors">
                  Instagram
                </a>
              </p>
            </div>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 8H3m4 4l-4-4 4-4" />
            </svg>
            More posts
          </Link>
        </div>
      </article>
    </div>
  )
}
