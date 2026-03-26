import { useState, useEffect, useRef, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { BlogPost } from '../types'

const PAGE_SIZE = 6

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Fetch all tags once on mount (lightweight query)
  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('tags')
      .eq('status', 'published')
      .then(({ data }) => {
        const tags = [...new Set((data || []).flatMap(p => p.tags || []))].sort()
        setAllTags(tags)
      })
  }, [])

  // Fetch posts with pagination, resets when tag changes
  const fetchPosts = useCallback(async (tag: string | null, offset: number) => {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data } = await query
    return data || []
  }, [])

  // Initial load + reset on tag change
  useEffect(() => {
    setLoading(true)
    setPosts([])
    setHasMore(true)
    fetchPosts(activeTag, 0).then(data => {
      setPosts(data)
      setHasMore(data.length === PAGE_SIZE)
      setLoading(false)
    })
  }, [activeTag, fetchPosts])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && hasMore) {
          setLoadingMore(true)
          fetchPosts(activeTag, posts.length).then(data => {
            setPosts(prev => [...prev, ...data])
            setHasMore(data.length === PAGE_SIZE)
            setLoadingMore(false)
          })
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, posts.length, activeTag, fetchPosts])

  const readTime = (content: string) => Math.max(1, Math.ceil(content.split(/\s+/).length / 200))

  return (
    <div className="min-h-screen bg-bg noise-overlay">
      <Helmet>
        <title>Blog — JoeyC.ai</title>
        <meta name="description" content="AI experiments, build logs, and lessons learned — by Joey Colley." />
        <link rel="canonical" href="https://joeyc.ai/blog" />
        <meta property="og:title" content="Blog — JoeyC.ai" />
        <meta property="og:description" content="AI experiments, build logs, and lessons learned — by Joey Colley." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://joeyc.ai/blog" />
        <meta property="og:image" content="https://joeyc.ai/photos/joey-headshot2.png" />
        <meta property="og:site_name" content="JoeyC.ai" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Blog — JoeyC.ai" />
        <meta name="twitter:description" content="AI experiments, build logs, and lessons learned — by Joey Colley." />
        <meta name="twitter:image" content="https://joeyc.ai/photos/joey-headshot2.png" />
      </Helmet>

      {/* Hero header */}
      <div className="border-b border-border/50 bg-gradient-to-b from-primary/[0.03] to-transparent">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 8H3m4 4l-4-4 4-4" />
            </svg>
            Back to site
          </Link>

          <p className="section-label mb-4">
            {'// BLOG'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Thoughts & Builds
          </h1>
          <p className="text-text-secondary text-lg max-w-xl leading-relaxed">
            AI experiments, build logs, and lessons learned on the journey from
            non-traditional dev to building real things with AI.
          </p>
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTag === null
                  ? 'bg-primary text-bg border border-primary'
                  : 'bg-bg-card text-text-secondary border border-border hover:border-primary/50 hover:text-primary'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeTag === tag
                    ? 'bg-primary text-bg border border-primary'
                    : 'bg-bg-card text-text-secondary border border-border hover:border-primary/50 hover:text-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-bg-card border border-border rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-border/50 rounded w-1/4 mb-4" />
                <div className="h-6 bg-border/50 rounded w-3/4 mb-3" />
                <div className="h-4 bg-border/50 rounded w-full mb-2" />
                <div className="h-4 bg-border/50 rounded w-2/3 mb-4" />
                <div className="flex gap-2">
                  <div className="h-5 bg-border/50 rounded w-12" />
                  <div className="h-5 bg-border/50 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">
              {activeTag ? `No posts tagged "${activeTag}"` : 'No posts yet'}
            </h2>
            <p className="text-text-secondary">
              {activeTag ? (
                <button onClick={() => setActiveTag(null)} className="text-primary hover:underline">
                  Clear filter
                </button>
              ) : 'First post coming soon. Stay tuned.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post, index) => {
              const isFeature = index === 0 && !activeTag && posts.length > 1
              return (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className={`group block card-glow rounded-xl border border-border bg-bg-card overflow-hidden ${
                    isFeature ? 'md:col-span-2' : ''
                  }`}
                >
                  {/* Cover image or gradient accent bar */}
                  {post.cover_image ? (
                    <div className={`overflow-hidden ${isFeature ? 'h-56 md:h-72' : 'h-44'}`}>
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-40 group-hover:opacity-70 transition-opacity" />
                  )}

                  <div className={`p-6 ${isFeature ? 'md:p-8' : ''}`}>
                    {/* Meta row */}
                    <div className="flex items-center gap-3 mb-3">
                      <time className="font-mono text-xs text-text-secondary">
                        {new Date(post.published_at!).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                      <span className="text-border">·</span>
                      <span className="font-mono text-xs text-text-secondary">
                        {readTime(post.content)} min read
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      className={`font-bold text-text-primary group-hover:text-primary transition-colors mb-3 leading-tight ${
                        isFeature ? 'text-2xl md:text-3xl' : 'text-lg'
                      }`}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className={`text-text-secondary leading-relaxed mb-4 ${
                      isFeature ? 'text-base max-w-2xl' : 'text-sm line-clamp-3'
                    }`}>
                      {post.excerpt}
                    </p>

                    {/* Tags + read more */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {(post.tags || []).slice(0, 4).map(tag => (
                          <button
                            key={tag}
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveTag(activeTag === tag ? null : tag)
                            }}
                            className={`px-2 py-0.5 rounded-md text-xs font-mono transition-all ${
                              activeTag === tag
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'bg-primary/5 text-primary/70 border border-primary/10 hover:bg-primary/10 hover:text-primary'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                        Read
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 8h10m-4-4l4 4-4 4" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {!loading && hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-10">
            {loadingMore && (
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            )}
          </div>
        )}

        {!loading && !hasMore && posts.length > PAGE_SIZE && (
          <p className="text-center text-text-secondary/50 text-sm font-mono py-8">
            That's everything.
          </p>
        )}
      </div>
    </div>
  )
}
