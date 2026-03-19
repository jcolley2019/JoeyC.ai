import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { supabase } from '../../lib/supabase'
import type { BlogPost } from '../../types'

const PLACEHOLDER_POSTS = [
  { title: 'Why I Built JoeyC.ai', slug: 'why-i-built-joeyc-ai', excerpt: 'The story behind building a personal site that doubles as a portfolio, content hub, and AI playground — all without a CS degree.', published_at: '2026-03-10T12:00:00Z' },
  { title: 'My Favorite AI Tools Right Now', slug: 'my-favorite-ai-tools-right-now', excerpt: 'The tools I actually use every day to build apps, automate workflows, and create content. No fluff, just what works.', published_at: '2026-03-08T12:00:00Z' },
  { title: 'What I Learned Building Luxvibe.io', slug: 'what-i-learned-building-luxvibe-io', excerpt: 'Building a luxury lifestyle platform from scratch taught me more about AI-assisted development than any course could.', published_at: '2026-03-06T12:00:00Z' },
  { title: 'How I Use Claude to Build Faster', slug: 'how-i-use-claude-to-build-faster', excerpt: 'Claude changed how I build software. Here\'s my actual workflow for going from idea to deployed app in hours, not weeks.', published_at: '2026-03-04T12:00:00Z' },
]

export function BlogPreview() {
  const [posts, setPosts] = useState<(BlogPost | typeof PLACEHOLDER_POSTS[0])[]>([])
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data && data.length >= 4) {
          setPosts(data)
        } else {
          // Fill remaining slots with placeholders
          const real = data || []
          const needed = 4 - real.length
          setPosts([...real, ...PLACEHOLDER_POSTS.slice(0, needed)])
        }
      })
  }, [])

  useEffect(() => {
    if (headerRef.current) {
      gsap.set(headerRef.current, { opacity: 0, y: 60 })
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            gsap.to(headerRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' })
            obs.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(headerRef.current)
    }

    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.blog-preview-card')
      gsap.set(cards, { opacity: 0, x: 200 })

      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            gsap.to(cards, {
              x: 0,
              opacity: 1,
              ease: 'power3.out',
              duration: 0.8,
              stagger: 0.15,
            })
            obs.disconnect()
          }
        },
        { threshold: 0.2 }
      )
      obs.observe(gridRef.current)
    }
  }, [posts])

  return (
    <section className="py-28 px-6 bg-bg-section">
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef}>
          <p className="section-label mb-6">
            {'// FROM THE BLOG'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Thoughts, Builds & AI Experiments
          </h2>
          <p className="text-text-secondary mb-14 max-w-lg text-base">
            I write about building apps with AI, lessons learned, and tools worth
            knowing. No fluff — just real stuff from someone doing it in public.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-preview-card group block rounded-xl border border-border bg-bg-card p-5 transition-all duration-300 hover:-translate-y-2 hover:border-[#4a6fa5]/50 hover:shadow-[0_0_30px_rgba(74,111,165,0.12)]"
            >
              <p className="font-mono text-xs text-text-secondary mb-3">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Coming soon'}
              </p>
              <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors mb-3 line-clamp-2 text-sm leading-snug">
                {post.title}
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed line-clamp-3 mb-4">
                {post.excerpt || ''}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4a6fa5] group-hover:gap-2.5 transition-all">
                Read More
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8h10m-4-4l4 4-4 4" />
                </svg>
              </span>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#4a6fa5]/30 text-[#4a6fa5] text-sm font-medium hover:bg-[#4a6fa5]/10 hover:border-[#4a6fa5]/50 transition-all"
          >
            View All Posts
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h10m-4-4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
